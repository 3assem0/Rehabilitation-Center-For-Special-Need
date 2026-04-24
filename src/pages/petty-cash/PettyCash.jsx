import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import PageWrapper from "../../components/layout/PageWrapper";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import ConfirmModal from "../../components/ui/ConfirmModal";
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
  AlertCircle,
  Edit2,
  Trash2
} from "lucide-react";
import DataTable from "../../components/ui/DataTable";

const PettyCash = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  // Using global petty_cash collection without filtering by employee
  const { data: transactions, addDocument, updateDocument, deleteDocument } = useFirestore("petty_cash");
  
  const [actionModal, setActionModal] = useState(null); // 'topup' | 'spend'
  const [editingTx, setEditingTx] = useState(null);
  const [formData, setFormData] = useState({ amount: "", category: "supplies", purpose: "" });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Calculate global balance
  const globalBalance = useMemo(() => {
    return transactions.reduce((sum, tx) => {
      return tx.type === 'spend' ? sum - tx.amount : sum + tx.amount;
    }, 0);
  }, [transactions]);

  const handleAction = async (e) => {
    e.preventDefault();
    const amount = Number(formData.amount);

    if (actionModal === 'spend' && !editingTx) {
      if (amount > globalBalance) {
        return toast.error("رصيد العهدة غير كافٍ");
      }
    }

    try {
      if (editingTx) {
        // Calculate new balance diff
        const oldAmount = editingTx.type === 'spend' ? -editingTx.amount : editingTx.amount;
        const newAmount = editingTx.type === 'spend' ? -amount : amount;
        
        await updateDocument(editingTx.id, {
          amount: amount,
          category: editingTx.type === 'spend' ? formData.category : 'topup',
          purpose: formData.purpose,
        });
        toast.success("تم التعديل بنجاح");
      } else {
        await addDocument({
          type: actionModal,
          amount: amount,
          category: actionModal === 'spend' ? formData.category : 'topup',
          purpose: formData.purpose,
          currentBalance: actionModal === 'spend' ? globalBalance - amount : globalBalance + amount,
          date: new Date(),
          createdBy: currentUser.uid
        });
        toast.success(t("successfullyUpdated"));
      }
      setActionModal(null);
      setEditingTx(null);
      setFormData({ amount: "", category: "supplies", purpose: "" });
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = (tx) => {
    setEditingTx(tx);
    setActionModal(tx.type);
    setFormData({
      amount: tx.amount,
      category: tx.category || "supplies",
      purpose: tx.purpose || ""
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteDocument(id);
      toast.success(t("successfullyDeleted"));
      setDeleteConfirm(null);
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
    { header: "الفئة", key: "category", render: (val) => t(val) || val },
    { header: "المبلغ", key: "amount", render: (val) => <span className="font-bold text-lg">{val} ج.م</span> },
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
    },
    {
      header: "إجراءات",
      key: "actions",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(row)} className="text-primary-light hover:text-primary">
            <Edit2 size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(row.id)} className="text-danger">
            <Trash2 size={16} />
          </Button>
        </div>
      )
    }
  ];

  return (
    <PageWrapper title={t("pettyCash")}>
      <Toaster position="top-center" />
      
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-primary">{t("pettyCash")}</h1>
        <p className="text-text-muted mt-1">إدارة العهدة النقدية العامة ومتابعة المصروفات النثرية</p>
      </div>

      <div className="card max-w-3xl mx-auto mb-10 text-center py-10 shadow-lg shadow-primary/5">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet size={36} className="text-primary" />
        </div>
        <p className="text-text-muted font-bold uppercase tracking-widest text-sm mb-2">الرصيد المتاح في العهدة</p>
        <h2 className="text-5xl font-black text-primary mb-8">{globalBalance.toLocaleString()} ج.م</h2>

        <div className="flex items-center justify-center gap-4">
          <Button 
            onClick={() => setActionModal('spend')}
            className="gap-2 text-white bg-danger hover:bg-danger/90 border-transparent px-8 py-3 text-lg"
          >
            <ArrowDownCircle size={20} />
            صرف من العهدة
          </Button>
          <Button 
            onClick={() => setActionModal('topup')}
            className="gap-2 text-white bg-success hover:bg-success/90 border-transparent px-8 py-3 text-lg"
          >
            <ArrowUpCircle size={20} />
            تعبئة العهدة
          </Button>
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold text-primary mb-6">سجل حركات العهدة</h3>
        <DataTable 
          columns={txColumns} 
          data={transactions.sort((a, b) => {
            const da = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
            const db = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
            return db - da;
          })} 
          searchPlaceholder="بحث في المعاملات..."
        />
      </div>

      {/* Action Modal (Spend/TopUp/Edit) */}
      <Modal
        isOpen={!!actionModal}
        onClose={() => { setActionModal(null); setEditingTx(null); setFormData({ amount: "", category: "supplies", purpose: "" }); }}
        title={editingTx ? 'تعديل المعاملة' : (actionModal === 'spend' ? 'صرف من العهدة النقدية' : 'تعبئة رصيد العهدة')}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setActionModal(null); setEditingTx(null); setFormData({ amount: "", category: "supplies", purpose: "" }); }}>{t("cancel")}</Button>
            <Button 
              variant={actionModal === 'spend' ? 'danger' : 'success'} 
              onClick={handleAction}
            >
              {editingTx ? 'حفظ التعديل' : (actionModal === 'spend' ? 'تأكيد الصرف' : 'تأكيد التعبئة')}
            </Button>
          </>
        }
      >
        <form onSubmit={handleAction} className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10 mb-4">
            <AlertCircle size={24} className="text-primary" />
            <div>
              <p className="text-sm font-bold text-primary">رصيد العهدة الحالي</p>
              <p className="text-lg font-black text-primary">{globalBalance.toLocaleString()} ج.م</p>
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
      <ConfirmModal 
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm)}
        message={t("confirmDelete")}
      />
    </PageWrapper>
  );
};

export default PettyCash;
