import React, { useState, useMemo } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import DataTable from "../../components/ui/DataTable";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import { useFirestore } from "../../hooks/useFirestore";
import { useTranslation } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { toast, Toaster } from "react-hot-toast";
import { Plus, Search, Receipt, Wallet } from "lucide-react";
import { format } from "date-fns";

const PaymentsList = () => {
  const { t, language } = useTranslation();
  const { currentUser } = useAuth();
  const { data: payments, addDocument } = useFirestore("payments");
  const { data: revenues, updateDocument } = useFirestore("revenues");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState(null);
  const [formData, setFormData] = useState({
    amount: "",
    paymentMethod: "cash",
    date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  const columns = [
    { header: t("clientName"), key: "clientName" },
    { header: t("amount"), key: "amount", render: (val) => <span className="font-bold text-success">{val} ج.م</span> },
    { header: t("paymentMethod"), key: "paymentMethod", render: (val) => t(val) },
    { 
      header: t("date"), 
      key: "date", 
      render: (val) => val.toDate ? format(val.toDate(), 'dd/MM/yyyy') : val 
    },
    { header: "ملاحظات", key: "notes" }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRevenue) return toast.error("يرجى اختيار معاملة إيراد");
    
    const amount = Number(formData.amount);
    const newPaidAmount = (selectedRevenue.paidAmount || 0) + amount;
    
    if (newPaidAmount > selectedRevenue.totalAmount) {
      return toast.error("المبلغ المدفوع لا يمكن أن يتجاوز إجمالي الإيراد");
    }

    try {
      // 1. Add Payment Transaction
      await addDocument({
        revenueId: selectedRevenue.id,
        clientName: selectedRevenue.clientName,
        amount: amount,
        paymentMethod: formData.paymentMethod,
        date: new Date(formData.date),
        notes: formData.notes,
        createdBy: currentUser.uid
      });

      // 2. Update Revenue Status
      const remaining = selectedRevenue.totalAmount - newPaidAmount;
      let status = "partial";
      if (remaining === 0) status = "paid";
      if (newPaidAmount === 0) status = "pending";

      await updateDocument(selectedRevenue.id, {
        paidAmount: newPaidAmount,
        remainingAmount: remaining,
        paymentStatus: status
      });

      toast.success(t("successfullyAdded"));
      setIsModalOpen(false);
      setFormData({ amount: "", paymentMethod: "cash", date: new Date().toISOString().split('T')[0], notes: "" });
      setSelectedRevenue(null);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <PageWrapper title={t("payments")}>
      <Toaster position="top-center" />
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t("payments")}</h1>
          <p className="text-text-muted mt-1">سجل تحصيل المستحقات النقدية من العملاء</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus size={20} />
          {t("add")}
        </Button>
      </div>

      <DataTable 
        columns={columns} 
        data={payments} 
        searchPlaceholder={t("clientName")}
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="تسجيل دفعة جديدة"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>{t("cancel")}</Button>
            <Button onClick={handleSubmit}>{t("save")}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Revenue Selector */}
          <div className="w-full">
            <label className="block text-sm font-semibold mb-2">اختر الإيراد المرتبط</label>
            <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto border border-border rounded-lg p-2 bg-bg/50">
              {revenues.filter(r => r.paymentStatus !== 'paid').map(rev => (
                <div 
                  key={rev.id}
                  onClick={() => setSelectedRevenue(rev)}
                  className={`p-3 rounded-md cursor-pointer border transition-all ${
                    selectedRevenue?.id === rev.id 
                    ? 'bg-primary text-white border-primary shadow-md' 
                    : 'bg-white border-border hover:border-primary'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{rev.clientName}</span>
                    <span className="text-xs opacity-80">{rev.totalAmount} ج.م</span>
                  </div>
                  <div className="text-[10px] opacity-70">المتبقي: {rev.remainingAmount} ج.م</div>
                </div>
              ))}
              {revenues.filter(r => r.paymentStatus !== 'paid').length === 0 && (
                <p className="text-center text-xs text-text-muted py-4">لا توجد دفعات مستحقة حالياً</p>
              )}
            </div>
          </div>

          {selectedRevenue && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 animate-in zoom-in duration-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted">المبلغ المتبقي للتحصيل:</span>
                <span className="font-black text-primary text-lg">{selectedRevenue.remainingAmount} ج.م</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="مبلغ الدفعة" 
              type="number" 
              name="amount"
              value={formData.amount} 
              onChange={handleInputChange} 
              required 
            />
            <div className="w-full">
              <label className="block text-sm font-semibold mb-2">{t("paymentMethod")}</label>
              <select name="paymentMethod" className="input" value={formData.paymentMethod} onChange={handleInputChange}>
                <option value="cash">{t("cash")}</option>
                <option value="bank_transfer">{t("bank_transfer")}</option>
                <option value="check">{t("check")}</option>
              </select>
            </div>
          </div>

          <Input 
            label={t("date")} 
            type="date" 
            name="date"
            value={formData.date} 
            onChange={handleInputChange} 
            required 
          />

          <div className="w-full">
            <label className="block text-sm font-semibold mb-2">ملاحظات</label>
            <textarea 
              name="notes" 
              className="input min-h-[80px]" 
              value={formData.notes} 
              onChange={handleInputChange}
              placeholder="مثلاً: دفعة مقدمة، أو رقم الشيك"
            ></textarea>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};

export default PaymentsList;
