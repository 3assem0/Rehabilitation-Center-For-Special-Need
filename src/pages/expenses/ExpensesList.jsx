import React, { useState } from "react";
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
import { MinusCircle, Edit2 } from "lucide-react";

const ExpensesList = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { data: expenses, loading, addDocument, updateDocument } = useFirestore("expenses");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const initialFormState = {
    category: "rent",
    amount: "",
    description: "",
    reference: "",
    date: new Date().toISOString().split('T')[0]
  };
  const [formData, setFormData] = useState(initialFormState);

  const handleEditClick = (expense, e) => {
    e.stopPropagation();
    setFormData({
      category: expense.category || "rent",
      amount: expense.amount || "",
      description: expense.description || "",
      reference: expense.reference || "",
      date: expense.date || new Date().toISOString().split('T')[0]
    });
    setEditingId(expense.id);
    setIsModalOpen(true);
  };

  const columns = [
    { header: t("category"), key: "category", render: (val) => t(val) },
    { 
      header: t("amount"), 
      key: "amount", 
      render: (val) => <span className="font-bold text-danger">{val} ج.م</span> 
    },
    { header: t("description"), key: "description" },
    { header: t("reference"), key: "reference" },
    { header: t("date"), key: "date" },
    {
      header: "إجراءات",
      key: "actions",
      render: (_, row) => (
        <button 
          onClick={(e) => handleEditClick(row, e)}
          className="p-2 text-text-muted hover:text-primary transition-colors rounded-lg hover:bg-bg"
        >
          <Edit2 size={16} />
        </button>
      )
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const dataToSave = {
        ...formData,
        amount: Number(formData.amount),
        createdBy: currentUser.uid
      };

      if (editingId) {
        await updateDocument(editingId, dataToSave);
        toast.success("تم التعديل بنجاح", { position: "top-center" });
      } else {
        await addDocument(dataToSave);
        toast.success(t("successfullyAdded"), { position: "top-center" });
      }
      
      setIsModalOpen(false);
      setEditingId(null);
      setFormData(initialFormState);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const totalThisMonth = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <PageWrapper title={t("expenses")}>
      <Toaster position="top-center" />
      
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t("expenses")}</h1>
          <p className="text-text-muted mt-1">تسجيل ومتابعة المصروفات التشغيلية والرواتب</p>
        </div>
        <div className="flex gap-4">
          <div className="card !py-2 !px-4 flex items-center gap-3 border-danger/20 bg-danger/5">
            <span className="text-xs text-danger font-bold uppercase tracking-wider">إجمالي الشهر</span>
            <span className="text-xl font-bold text-danger">{totalThisMonth.toLocaleString()} ج.م</span>
          </div>
          <Button onClick={openAddModal} className="gap-2" variant="danger">
            <MinusCircle size={20} />
            إضافة مصروف
          </Button>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={expenses} 
        searchPlaceholder={t("description")}
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingId(null); }} 
        title={editingId ? "تعديل مصروف" : "إضافة مصروف جديد"}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); setEditingId(null); }}>{t("cancel")}</Button>
            <Button variant="danger" onClick={handleSubmit}>{t("save")}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="w-full">
              <label className="block text-sm font-semibold mb-2 text-text">{t("category")}</label>
              <select 
                name="category" 
                className="input" 
                value={formData.category} 
                onChange={handleInputChange}
              >
                <option value="rent">{t("rent")}</option>
                <option value="salaries">{t("salaries")}</option>
                <option value="petty_cash_expense">{t("petty_cash_expense")}</option>
                <option value="maintenance">{t("maintenance")}</option>
                <option value="supplies">{t("supplies")}</option>
                <option value="emergency">{t("emergency")}</option>
                <option value="other">{t("other")}</option>
              </select>
            </div>
            
            <Input 
              label={t("amount")} 
              name="amount" 
              type="number"
              value={formData.amount} 
              onChange={handleInputChange} 
              required 
            />
          </div>

          <Input 
            label={t("description")} 
            name="description" 
            value={formData.description} 
            onChange={handleInputChange} 
            required 
          />

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label={t("reference")} 
              name="reference" 
              placeholder="مثلاً: رقم الفاتورة"
              value={formData.reference} 
              onChange={handleInputChange} 
            />
            
            <Input 
              label={t("date")} 
              name="date" 
              type="date"
              value={formData.date} 
              onChange={handleInputChange} 
              required 
            />
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};

export default ExpensesList;
