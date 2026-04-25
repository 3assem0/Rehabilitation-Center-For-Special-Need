import React, { useState, useMemo } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import DataTable from "../../components/ui/DataTable";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Input from "../../components/ui/Input";
import { useFirestore } from "../../hooks/useFirestore";
import { useTranslation } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { calculateEmployeePayroll } from "../../utils/calculations";
import { toast, Toaster } from "react-hot-toast";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  addMonths, 
  subMonths 
} from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { 
  Calculator, 
  ChevronLeft, 
  ChevronRight, 
  DollarSign,
  Wallet,
  Coins,
  Settings,
  Edit2,
  Trash2
} from "lucide-react";

const PayrollSheet = () => {
  const { t, language } = useTranslation();
  const { currentUser } = useAuth();
  const { data: employees } = useFirestore("employees");
  const { data: attendance } = useFirestore("attendance");
  const { data: payroll, addDocument: addPayroll, updateDocument: updatePayroll, deleteDocument: deletePayroll } = useFirestore("payroll");
  const { data: advances, addDocument: addAdvance } = useFirestore("advances");
  const { addDocument: addExpense } = useFirestore("expenses");
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const locale = language === "ar" ? ar : enUS;
  const monthKey = format(currentMonth, 'yyyy-MM');

  const [paymentModal, setPaymentModal] = useState(null); // record to pay
  const [paymentAmount, setPaymentAmount] = useState("");

  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [advanceData, setAdvanceData] = useState({ employeeId: "", amount: "", notes: "" });

  const [adjustModal, setAdjustModal] = useState(null);
  const [adjustData, setAdjustData] = useState({ deductions: 0, advances: 0 });

  const [deleteConfirm, setDeleteConfirm] = useState(null); // ID of record to delete

  // Filter attendance for current month
  const monthAttendance = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return attendance.filter(record => {
      const d = record.date?.toDate ? record.date.toDate() : new Date(record.date);
      return d >= start && d <= end;
    });
  }, [attendance, currentMonth]);

  // Enhanced payroll records with arrears calculation
  const tableData = useMemo(() => {
    return payroll
      .filter(p => p.month === monthKey && employees.some(e => e.id === p.employeeId))
      .map(p => {
        // Calculate sum of remaining amounts from all previous months
        const previousArrears = payroll
          .filter(prev => prev.employeeId === p.employeeId && prev.month < monthKey)
          .reduce((sum, prev) => sum + (prev.remainingAmount || 0), 0);
        
        const totalDue = (p.netSalary || 0) + previousArrears;
        const totalRemaining = Math.max(0, totalDue - (p.paidAmount || 0));
        
        return { 
          ...p, 
          previousArrears, 
          totalDue,
          displayRemaining: totalRemaining 
        };
      });
  }, [payroll, monthKey, employees]);

  const existingPayroll = useMemo(() => {
    return payroll.filter(p => p.month === monthKey);
  }, [payroll, monthKey]);

  // Advances for this month
  const monthAdvancesList = useMemo(() => {
    return advances.filter(a => a.month === monthKey);
  }, [advances, monthKey]);

  const handleGeneratePayroll = async () => {
    try {
      const activeEmployees = employees.filter(e => e.isActive);
      let count = 0;

      for (const emp of activeEmployees) {
        const empAttendance = monthAttendance.filter(a => a.employeeId === emp.id);
        const empAdvances = monthAdvancesList.filter(a => a.employeeId === emp.id);
        
        const payrollData = calculateEmployeePayroll(emp, empAttendance, empAdvances);
        
        const existing = existingPayroll.find(p => p.employeeId === emp.id);
        
        if (existing) {
          if (existing.paymentStatus !== "paid") {
            const newRemaining = payrollData.netSalary - (existing.paidAmount || 0);
            const status = newRemaining <= 0 ? "paid" : (existing.paidAmount > 0 ? "partial" : "pending");
            
            await updatePayroll(existing.id, { 
              ...payrollData, 
              remainingAmount: Math.max(0, newRemaining),
              paymentStatus: status,
              generatedAt: new Date() 
            });
            count++;
          }
        } else {
          await addPayroll({
            ...payrollData,
            month: monthKey,
            paidAmount: 0,
            remainingAmount: payrollData.netSalary,
            paymentStatus: "pending",
            generatedAt: new Date()
          });
          count++;
        }
      }
      toast.success(`${count} تم تحديث/إنشاء رواتب لـ موظف`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentModal) return;

    const amount = Number(paymentAmount); // <-- Defined amount here

    // Calculate total debt for this employee across all time (up to now)
    const previousArrears = payroll
      .filter(prev => prev.employeeId === paymentModal.employeeId && prev.month < monthKey)
      .reduce((sum, prev) => sum + (prev.remainingAmount || 0), 0);
    
    const currentTotalDue = (paymentModal.netSalary || 0) + previousArrears;
    const currentRemaining = currentTotalDue - (paymentModal.paidAmount || 0);
    
    if (amount <= 0 || amount > currentRemaining) {
      return toast.error("المبلغ غير صالح، يجب أن يكون أكبر من صفر ولا يتجاوز إجمالي المستحق");
    }

    try {
      const newPaid = (paymentModal.paidAmount || 0) + amount;
      // Note: remainingAmount in the database record for THIS month is (netSalary - paidAmount).
      // If paidAmount > netSalary, it will be negative, correctly offsetting previous arrears in the running total.
      const newMonthRemaining = paymentModal.netSalary - newPaid;
      const status = newMonthRemaining <= 0 ? "paid" : "partial";

      await updatePayroll(paymentModal.id, {
        paidAmount: newPaid,
        remainingAmount: newMonthRemaining,
        paymentStatus: status,
        lastPaidDate: new Date()
      });

      // Record in expenses
      const emp = employees.find(e => e.id === paymentModal.employeeId);
      await addExpense({
        category: "salaries",
        amount: amount,
        description: `صرف راتب - ${emp ? (language === 'ar' ? emp.nameAr : emp.name) : ''} (${monthKey})`,
        date: new Date().toISOString().split('T')[0],
        createdBy: currentUser.uid
      });

      toast.success("تم تسجيل الدفعة بنجاح");
      setPaymentModal(null);
      setPaymentAmount("");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleAdjustSubmit = async () => {
    try {
      const net = Math.max(0, (adjustModal.grossSalary || 0) + (adjustModal.overtimePay || 0) - adjustData.deductions - adjustData.advances);
      const paid = adjustModal.paidAmount || 0;
      const remaining = Math.max(0, net - paid);
      const status = remaining <= 0 ? "paid" : (paid > 0 ? "partial" : "pending");

      await updatePayroll(adjustModal.id, {
        deductions: adjustData.deductions,
        advances: adjustData.advances,
        netSalary: net,
        remainingAmount: remaining,
        paymentStatus: status
      });

      // Add advance to expenses if it increased
      const advanceDiff = adjustData.advances - (adjustModal.advances || 0);
      if (advanceDiff > 0) {
        const emp = employees.find(e => e.id === adjustModal.employeeId);
        await addExpense({
          category: "salaries",
          amount: advanceDiff,
          description: `سلفة موظف - ${emp ? (language === 'ar' ? emp.nameAr : emp.name) : ''}`,
          date: new Date().toISOString().split('T')[0],
          createdBy: currentUser.uid
        });
      }

      toast.success("تم تحديث البيانات بنجاح");
      setAdjustModal(null);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeletePayroll = async (id) => {
    try {
      await deletePayroll(id);
      toast.success(language === 'ar' ? "تم حذف السجل بنجاح" : "Record deleted successfully");
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const statusVariants = { paid: 'green', partial: 'yellow', pending: 'gray' };
  const statusLabels = { paid: 'تم الصرف', partial: 'جزئي', pending: 'بانتظار الصرف' };

  const columns = [
    { 
      header: "الموظف", 
      key: "employeeId",
      render: (val) => {
        const emp = employees.find(e => e.id === val);
        return <span className="font-bold">{emp ? (language === 'ar' ? emp.nameAr : emp.name) : '---'}</span>;
      }
    },
    { 
      header: "الراتب الأساسي", 
      key: "monthlySalary", 
      render: (val, row) => <span>{val ?? row.grossSalary ?? 0}</span> 
    },
    { header: "الإضافي", key: "overtimePay", render: (val) => <span className="text-success">+{val}</span> },
    { 
      header: "الخصومات والسلف", 
      key: "deductions", 
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-danger font-bold">-{row.deductions || 0}</span>
            {row.advances > 0 && <span className="text-[10px] text-text-muted">سلف: {row.advances}</span>}
          </div>
          <Button variant="ghost" size="sm" onClick={() => {
            setAdjustModal(row);
            setAdjustData({ deductions: row.deductions || 0, advances: row.advances || 0 });
          }} title="تعديل يدوي">
            <Settings size={14} className="text-text-muted" />
          </Button>
        </div>
      ) 
    },
    { 
      header: "الصافي", 
      key: "netSalary", 
      render: (val) => <span className="font-bold text-primary">{val.toLocaleString()}</span> 
    },
    { 
      header: "متأخرات سابقة", 
      key: "previousArrears", 
      render: (val) => <span className={val > 0 ? "text-danger font-bold" : "text-text-muted"}>{val > 0 ? `+${val.toLocaleString()}` : "0"}</span> 
    },
    { 
      header: "إجمالي المستحق", 
      key: "totalDue", 
      render: (val) => <span className="text-lg font-black text-primary">{val.toLocaleString()}</span> 
    },
    { 
      header: "المدفوع", 
      key: "paidAmount", 
      render: (val) => <span className="text-success font-bold">{val || 0}</span> 
    },
    { 
      header: "المتبقي", 
      key: "displayRemaining", 
      render: (val) => <span className="text-danger font-bold">{val !== undefined ? val.toLocaleString() : '---'}</span> 
    },
    { 
      header: "الحالة", 
      key: "paymentStatus",
      render: (val, row) => {
        const currentRemaining = row.remainingAmount ?? row.netSalary;
        return (
          <div className="flex items-center gap-2">
            <Badge variant={statusVariants[val || (row.isPaid ? 'paid' : 'pending')]}>
              {statusLabels[val || (row.isPaid ? 'paid' : 'pending')]}
            </Badge>
            {val !== 'paid' && !row.isPaid && (currentRemaining > 0) && (
              <Button variant="ghost" size="sm" onClick={() => {
                setPaymentModal(row);
                setPaymentAmount(currentRemaining);
              }} title="صرف دفعة">
                <Coins size={16} className="text-success" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setDeleteConfirm(row.id)}
              title="حذف السجل"
              className="text-danger hover:bg-danger/10"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        );
      }
    },
  ];

  return (
    <PageWrapper title={t("payroll")}>
      <Toaster position="top-center" />
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t("payroll")}</h1>
          <p className="text-text-muted mt-1">كشف الرواتب الشهري بناءً على الحضور والانصراف</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-border shadow-sm">
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronRight size={20} className={language === 'ar' ? '' : 'rotate-180'} />
          </Button>
          <div className="flex flex-col items-center min-w-[150px]">
            <span className="text-xs text-text-muted uppercase tracking-widest leading-none mb-1">شهر الاستحقاق</span>
            <span className="font-bold text-primary">
              {format(currentMonth, 'MMMM yyyy', { locale })}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronLeft size={20} className={language === 'ar' ? '' : 'rotate-180'} />
          </Button>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleGeneratePayroll} className="gap-2 shadow-lg shadow-primary/20">
            <Calculator size={18} />
            توليد المسير
          </Button>
        </div>
      </div>

      {tableData.length > 0 ? (
        <DataTable 
          columns={columns} 
          data={tableData} 
          searchPlaceholder="بحث عن موظف..."
        />
      ) : (
        <div className="card text-center py-24 bg-bg/20 border-dashed">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <DollarSign size={40} className="text-primary opacity-40" />
          </div>
          <h3 className="text-xl font-bold text-primary mb-2">لم يتم توليد مسير رواتب لهذا الشهر</h3>
          <p className="text-text-muted max-w-md mx-auto mb-8">
            اضغط على زر "توليد المسير" ليقوم النظام بحساب رواتب جميع الموظفين بناءً على سجلات الحضور الخاصة بهم.
          </p>
          <Button onClick={handleGeneratePayroll} className="px-10">توليد المسير الآن</Button>
        </div>
      )}

      {/* Payment Modal */}
      <Modal
        isOpen={!!paymentModal}
        onClose={() => { setPaymentModal(null); setPaymentAmount(""); }}
        title="تسجيل دفعة من الراتب"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setPaymentModal(null); setPaymentAmount(""); }}>إلغاء</Button>
            <Button variant="success" onClick={handlePaymentSubmit}>تأكيد الصرف</Button>
          </>
        }
      >
        {paymentModal && (
          <form onSubmit={handlePaymentSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-bg rounded-lg text-center">
                <p className="text-xs text-text-muted mb-1">إجمالي المستحق</p>
                <p className="font-bold">{(paymentModal.totalDue || paymentModal.netSalary).toLocaleString()} ج.م</p>
              </div>
              <div className="p-3 bg-success/10 rounded-lg text-center text-success">
                <p className="text-xs mb-1">المدفوع مسبقاً</p>
                <p className="font-bold">{paymentModal.paidAmount || 0} ج.م</p>
              </div>
              <div className="p-3 bg-danger/10 rounded-lg text-center text-danger">
                <p className="text-xs mb-1">المتبقي النهائي</p>
                <p className="font-bold">{(paymentModal.displayRemaining ?? paymentModal.remainingAmount ?? paymentModal.netSalary).toLocaleString()} ج.م</p>
              </div>
            </div>

            <Input 
              label="المبلغ المراد صرفه الآن" 
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              required
            />
            <p className="text-xs text-text-muted">ملاحظة: سيتم تسجيل هذا المبلغ تلقائياً في قائمة المصروفات.</p>
          </form>
        )}
      </Modal>

      {/* Adjust Modal */}
      <Modal
        isOpen={!!adjustModal}
        onClose={() => setAdjustModal(null)}
        title="تعديل الخصومات والسلف"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdjustModal(null)}>إلغاء</Button>
            <Button onClick={handleAdjustSubmit}>حفظ التعديلات</Button>
          </>
        }
      >
        {adjustModal && (
          <div className="space-y-4">
             <Input 
               label="قيمة الخصومات (غياب/تأخير/أخرى)" 
               type="number" 
               value={adjustData.deductions} 
               onChange={e => setAdjustData({...adjustData, deductions: Number(e.target.value)})} 
             />
             <Input 
               label="قيمة السلف" 
               type="number" 
               value={adjustData.advances} 
               onChange={e => setAdjustData({...adjustData, advances: Number(e.target.value)})} 
             />
             <p className="text-xs text-text-muted italic">سيتم تحديث صافي الراتب تلقائياً بعد الحفظ.</p>
          </div>
        )}
      </Modal>

      <ConfirmModal 
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDeletePayroll(deleteConfirm)}
        message={language === 'ar' ? "هل أنت متأكد من حذف هذا الراتب؟" : "Are you sure you want to delete this payroll?"}
      />

    </PageWrapper>
  );
};

export default PayrollSheet;
