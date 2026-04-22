import React, { useState, useMemo } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import { useFirestore } from "../../hooks/useFirestore";
import { useTranslation } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { toast, Toaster } from "react-hot-toast";
import { 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  History, 
  Plus, 
  Minus,
  AlertCircle
} from "lucide-react";
import DataTable from "../../components/ui/DataTable";

const PettyCash = () => {
  const { t, language } = useTranslation();
  const { currentUser } = useAuth();
  const { data: employees } = useFirestore("employees");
  const { data: transactions, addDocument } = useFirestore("petty_cash");
  
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [actionModal, setActionModal] = useState(null); // 'topup' | 'spend'
  const [formData, setFormData] = useState({ amount: "", category: "supplies", purpose: "" });

  // Calculate current balances for all employees
  const employeeBalances = useMemo(() => {
    const balances = {};
    employees.forEach(emp => {
      const empTx = transactions.filter(tx => tx.employeeId === emp.id);
      const total = empTx.reduce((sum, tx) => {
        return tx.type === 'spend' ? sum - tx.amount : sum + tx.amount;
      }, 0);
      balances[emp.id] = total;
    });
    return balances;
  }, [employees, transactions]);

  const handleAction = async (e) => {
    e.preventDefault();
    const amount = Number(formData.amount);
    const balance = employeeBalances[selectedEmployee.id] || 0;

    if (actionModal === 'spend') {
      if (amount > balance) {
        return toast.error("رصيد العهدة غير كافٍ");
      }
    } else if (actionModal === 'topup') {
      if (balance + amount > selectedEmployee.pettyCashLimit) {
        return toast.error("المبلغ يتجاوز حد العهدة المسموح به لهذا الموظف");
      }
    }

    try {
      await addDocument({
        employeeId: selectedEmployee.id,
        type: actionModal,
        amount: amount,
        category: formData.category,
        purpose: formData.purpose,
        currentBalance: actionModal === 'spend' ? balance - amount : balance + amount,
        date: new Date(),
        createdBy: currentUser.uid
      });
      toast.success(t("successfullyUpdated"));
      setActionModal(null);
      setFormData({ amount: "", category: "supplies", purpose: "" });
    } catch (error) {
      toast.error(error.message);
    }
  };

  const txColumns = [
    { 
      header: "النوع", 
      key: "type", 
      render: (val) => (
        <Badge variant={val === 'topup' ? 'green' : 'red'}>
          {val === 'topup' ? "تعبئة (+)" : "صرف (-)"}
        </Badge>
      )
    },
    { header: "الفئة", key: "category", render: (val) => t(val) },
    { header: "المبلغ", key: "amount", render: (val) => <span className="font-bold">{val} ج.م</span> },
    { header: "الغرض", key: "purpose" },
    { 
      header: "التاريخ", 
      key: "date", 
      render: (val) => {
        if (!val) return '---';
        try {
          const d = val.toDate ? val.toDate() : new Date(val);
          return format(d, 'dd/MM/yyyy HH:mm');
        } catch { return '---'; }
      }
    }
  ];

  return (
    <PageWrapper title={t("pettyCash")}>
      <Toaster position="top-center" />
      
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-primary">{t("pettyCash")}</h1>
        <p className="text-text-muted mt-1">إدارة العهد النقدية للموظفين ومتابعة المصروفات النثرية</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map(emp => {
          const balance = employeeBalances[emp.id] || 0;
          const usagePercent = Math.min(100, (balance / emp.pettyCashLimit) * 100);
          
          return (
            <div key={emp.id} className="card group hover:border-primary/30 transition-all flex flex-col h-full">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                    {(language === 'ar' ? emp.nameAr : emp.name).charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-primary">{language === 'ar' ? emp.nameAr : emp.name}</h3>
                    <p className="text-xs text-text-muted">{emp.jobTitle}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setSelectedEmployee(emp); setIsHistoryOpen(true); }}
                >
                  <History size={18} />
                </Button>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-2xl font-black text-primary">{balance.toLocaleString()} ج.م</span>
                  <span className="text-xs text-text-muted">من {emp.pettyCashLimit} ج.م</span>
                </div>
                <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${usagePercent < 20 ? 'bg-danger' : 'bg-success'}`}
                    style={{ width: `${usagePercent}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-border">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => { setSelectedEmployee(emp); setActionModal('spend'); }}
                  className="gap-1 text-danger border-danger/20 hover:bg-danger/5"
                >
                  <ArrowDownCircle size={14} />
                  صرف عهدة
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => { setSelectedEmployee(emp); setActionModal('topup'); }}
                  className="gap-1 text-success border-success/20 hover:bg-success/5"
                >
                  <ArrowUpCircle size={14} />
                  تعبئة عهدة
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* History Modal */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={selectedEmployee ? `سجل معاملات: ${language === 'ar' ? selectedEmployee.nameAr : selectedEmployee.name}` : ''}
      >
        {selectedEmployee && (
          <DataTable 
            columns={txColumns} 
            data={transactions.filter(tx => tx.employeeId === selectedEmployee.id)} 
            searchPlaceholder="بحث في المعاملات..."
          />
        )}
      </Modal>

      {/* Action Modal (Spend/TopUp) */}
      <Modal
        isOpen={!!actionModal}
        onClose={() => setActionModal(null)}
        title={actionModal === 'spend' ? 'صرف من العهدة النقدية' : 'تعبئة رصيد العهدة'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setActionModal(null)}>{t("cancel")}</Button>
            <Button 
              variant={actionModal === 'spend' ? 'danger' : 'success'} 
              onClick={handleAction}
            >
              {actionModal === 'spend' ? 'تأكيد الصرف' : 'تأكيد التعبئة'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleAction} className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10 mb-4">
            <AlertCircle size={24} className="text-primary" />
            <div>
              <p className="text-sm font-bold text-primary">الموظف: {selectedEmployee && (language === 'ar' ? selectedEmployee.nameAr : selectedEmployee.name)}</p>
              <p className="text-xs text-primary/70">الرصيد الحالي: {selectedEmployee && (employeeBalances[selectedEmployee.id] || 0)} ج.م</p>
            </div>
          </div>

          <Input 
            label="المبلغ" 
            type="number" 
            value={formData.amount} 
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })} 
            required 
            placeholder="0.00"
          />

          {actionModal === 'spend' && (
            <div className="w-full">
              <label className="block text-sm font-semibold mb-2">تصنيف المصروف</label>
              <select 
                className="input" 
                value={formData.category} 
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="supplies">{t("supplies")}</option>
                <option value="maintenance">{t("maintenance")}</option>
                <option value="emergency">{t("emergency")}</option>
                <option value="other">{t("other")}</option>
              </select>
            </div>
          )}

          <div className="w-full">
            <label className="block text-sm font-semibold mb-2">الغرض / السبب</label>
            <textarea 
              className="input min-h-[100px]" 
              value={formData.purpose} 
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              required
              placeholder={actionModal === 'spend' ? "مثلاً: شراء مستلزمات مكتبية" : "ملاحظات التعبئة"}
            ></textarea>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};

export default PettyCash;
