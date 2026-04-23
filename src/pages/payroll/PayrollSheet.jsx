import React, { useState, useMemo } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import DataTable from "../../components/ui/DataTable";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
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
  Printer, 
  CheckCircle2, 
  DollarSign,
  Wallet,
  Coins
} from "lucide-react";

const PayrollSheet = () => {
  const { t, language } = useTranslation();
  const { currentUser } = useAuth();
  const { data: employees } = useFirestore("employees");
  const { data: attendance } = useFirestore("attendance");
  const { data: payroll, addDocument: addPayroll, updateDocument: updatePayroll } = useFirestore("payroll");
  const { data: advances, addDocument: addAdvance } = useFirestore("advances");
  const { addDocument: addExpense } = useFirestore("expenses");
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const locale = language === "ar" ? ar : enUS;
  const monthKey = format(currentMonth, 'yyyy-MM');

  const [paymentModal, setPaymentModal] = useState(null); // record to pay
  const [paymentAmount, setPaymentAmount] = useState("");

  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [advanceData, setAdvanceData] = useState({ employeeId: "", amount: "", notes: "" });

  // Filter attendance for current month
  const monthAttendance = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return attendance.filter(record => {
      const d = record.date?.toDate ? record.date.toDate() : new Date(record.date);
      return d >= start && d <= end;
    });
  }, [attendance, currentMonth]);

  // Existing payroll records for this month
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

    const amount = Number(paymentAmount);
    if (amount <= 0 || amount > paymentModal.remainingAmount) {
      return toast.error("المبلغ غير صالح، يجب أن يكون أكبر من صفر ولا يتجاوز المبلغ المتبقي");
    }

    try {
      const newPaid = (paymentModal.paidAmount || 0) + amount;
      const newRemaining = paymentModal.netSalary - newPaid;
      const status = newRemaining <= 0 ? "paid" : "partial";

      await updatePayroll(paymentModal.id, {
        paidAmount: newPaid,
        remainingAmount: newRemaining,
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

  const handleAdvanceSubmit = async (e) => {
    e.preventDefault();
    if (!advanceData.employeeId || !advanceData.amount) return toast.error("يرجى إكمال البيانات");

    try {
      await addAdvance({
        employeeId: advanceData.employeeId,
        amount: Number(advanceData.amount),
        notes: advanceData.notes,
        month: monthKey,
        date: new Date(),
        createdBy: currentUser.uid
      });
      toast.success("تم تسجيل السلفة بنجاح. قم بتوليد المسير ليتم خصمها.");
      setAdvanceModalOpen(false);
      setAdvanceData({ employeeId: "", amount: "", notes: "" });
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
    { header: "الإضافي", key: "overtimePay", render: (val) => <span className="text-success">+{val}</span> },
    { 
      header: "السلف والخصومات", 
      key: "deductions", 
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="text-danger font-bold">-{row.deductions}</span>
          {row.advances > 0 && <span className="text-[10px] text-text-muted">سلف: {row.advances}</span>}
        </div>
      ) 
    },
    { 
      header: "الصافي", 
      key: "netSalary", 
      render: (val) => <span className="text-lg font-black text-primary">{val.toLocaleString()}</span> 
    },
    { 
      header: "المدفوع", 
      key: "paidAmount", 
      render: (val) => <span className="text-success font-bold">{val || 0}</span> 
    },
    { 
      header: "المتبقي", 
      key: "remainingAmount", 
      render: (val) => <span className="text-danger font-bold">{val !== undefined ? val : '---'}</span> 
    },
    { 
      header: "الحالة", 
      key: "paymentStatus",
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <Badge variant={statusVariants[val || (row.isPaid ? 'paid' : 'pending')]}>
            {statusLabels[val || (row.isPaid ? 'paid' : 'pending')]}
          </Badge>
          {val !== 'paid' && !row.isPaid && (row.remainingAmount > 0 || row.remainingAmount === undefined) && (
            <Button variant="ghost" size="sm" onClick={() => {
              setPaymentModal(row);
              setPaymentAmount(row.remainingAmount ?? row.netSalary);
            }} title="صرف دفعة">
              <Coins size={16} className="text-success" />
            </Button>
          )}
        </div>
      )
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
          <Button variant="secondary" className="gap-2 text-danger border-danger/20 hover:bg-danger/5" onClick={() => setAdvanceModalOpen(true)}>
            <Wallet size={18} />
            تسجيل سلفة
          </Button>
          <Button onClick={handleGeneratePayroll} className="gap-2 shadow-lg shadow-primary/20">
            <Calculator size={18} />
            توليد المسير
          </Button>
        </div>
      </div>

      {existingPayroll.length > 0 ? (
        <DataTable 
          columns={columns} 
          data={existingPayroll.filter(p => employees.some(e => e.id === p.employeeId))} 
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
                <p className="text-xs text-text-muted mb-1">الصافي</p>
                <p className="font-bold">{paymentModal.netSalary} ج.م</p>
              </div>
              <div className="p-3 bg-success/10 rounded-lg text-center text-success">
                <p className="text-xs mb-1">المدفوع مسبقاً</p>
                <p className="font-bold">{paymentModal.paidAmount || 0} ج.م</p>
              </div>
              <div className="p-3 bg-danger/10 rounded-lg text-center text-danger">
                <p className="text-xs mb-1">المتبقي</p>
                <p className="font-bold">{paymentModal.remainingAmount} ج.م</p>
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

      {/* Advance Modal */}
      <Modal
        isOpen={advanceModalOpen}
        onClose={() => setAdvanceModalOpen(false)}
        title={`تسجيل سلفة موظف (${format(currentMonth, 'MMMM yyyy', { locale })})`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdvanceModalOpen(false)}>إلغاء</Button>
            <Button variant="danger" onClick={handleAdvanceSubmit}>حفظ السلفة</Button>
          </>
        }
      >
        <form onSubmit={handleAdvanceSubmit} className="space-y-6">
          <div className="w-full">
            <label className="block text-sm font-semibold mb-2">الموظف</label>
            <select 
              className="input"
              value={advanceData.employeeId}
              onChange={(e) => setAdvanceData({ ...advanceData, employeeId: e.target.value })}
              required
            >
              <option value="">اختر الموظف...</option>
              {employees.filter(e => e.isActive).map(emp => (
                <option key={emp.id} value={emp.id}>
                  {language === 'ar' ? emp.nameAr : emp.name}
                </option>
              ))}
            </select>
          </div>

          <Input 
            label="مبلغ السلفة" 
            type="number"
            value={advanceData.amount}
            onChange={(e) => setAdvanceData({ ...advanceData, amount: e.target.value })}
            required
          />

          <div className="w-full">
            <label className="block text-sm font-semibold mb-2">ملاحظات (اختياري)</label>
            <textarea 
              className="input"
              value={advanceData.notes}
              onChange={(e) => setAdvanceData({ ...advanceData, notes: e.target.value })}
            ></textarea>
          </div>
        </form>
      </Modal>

    </PageWrapper>
  );
};

export default PayrollSheet;
