import React, { useState, useMemo } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import DataTable from "../../components/ui/DataTable";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import { useFirestore } from "../../hooks/useFirestore";
import { useTranslation } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { toast, Toaster } from "react-hot-toast";
import { Plus, Filter, Download, Edit2, Repeat, ArrowDownUp, Trash2 } from "lucide-react";
import { format } from "date-fns";

const RevenuesList = () => {
  const { t, language } = useTranslation();
  const { currentUser } = useAuth();
  const { data: revenues, loading, addDocument, updateDocument, deleteDocument } = useFirestore("revenues");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedRevenue, setSelectedRevenue] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const initialFormState = {
    clientName: "",
    type: "monthly_fee",
    totalAmount: "",
    paymentMethod: "cash",
    date: new Date().toISOString().split('T')[0],
    notes: "",
    isRecurring: false
  };
  const [formData, setFormData] = useState(initialFormState);

  // Filters & Sort State
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortKey, setSortKey] = useState("date-desc");

  const filteredAndSortedRevenues = useMemo(() => {
    let result = [...revenues];

    // Filter
    if (filterStatus !== "all") {
      result = result.filter(r => r.paymentStatus === filterStatus);
    }
    if (filterType !== "all") {
      result = result.filter(r => r.type === filterType);
    }

    // Sort
    result.sort((a, b) => {
      if (sortKey === "date-desc") {
        const da = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
        const db = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
        return db - da;
      }
      if (sortKey === "date-asc") {
        const da = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
        const db = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
        return da - db;
      }
      if (sortKey === "amount-desc") {
        return (b.totalAmount || 0) - (a.totalAmount || 0);
      }
      if (sortKey === "amount-asc") {
        return (a.totalAmount || 0) - (b.totalAmount || 0);
      }
      if (sortKey === "name-asc") {
        return (a.clientName || "").localeCompare(b.clientName || "", language);
      }
      return 0;
    });

    return result;
  }, [revenues, filterStatus, filterType, sortKey, language]);


  const handleEditClick = (revenue, e) => {
    e.stopPropagation();
    setFormData({
      clientName: revenue.clientName || "",
      type: revenue.type || "monthly_fee",
      totalAmount: revenue.totalAmount || "",
      paymentMethod: revenue.paymentMethod || "cash",
      date: revenue.date ? (revenue.date.toDate ? format(revenue.date.toDate(), 'yyyy-MM-dd') : revenue.date) : new Date().toISOString().split('T')[0],
      notes: revenue.notes || "",
      isRecurring: revenue.isRecurring || false
    });
    setEditingId(revenue.id);
    setIsModalOpen(true);
  };

  const toggleRecurring = async (e, row) => {
    e.stopPropagation();
    try {
      await updateDocument(row.id, { isRecurring: !row.isRecurring });
      toast.success(!row.isRecurring ? "تم تفعيل التكرار الشهري لهذا العميل" : "تم إيقاف التكرار");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const formatDate = (val) => {
    if (!val) return '---';
    try {
      const d = val.toDate ? val.toDate() : new Date(val);
      return format(d, 'dd/MM/yyyy');
    } catch { return String(val); }
  };

  const statusVariants = { paid: 'green', partial: 'yellow', pending: 'gray', overdue: 'red' };

  const columns = [
    { header: t("clientName"), key: "clientName" },
    { header: t("revenueType"), key: "type", render: (val) => t(val) },
    { 
      header: t("totalAmount"), 
      key: "totalAmount", 
      render: (val) => <span className="font-bold">{val} ج.م</span> 
    },
    { 
      header: t("paidAmount"), 
      key: "paidAmount", 
      render: (val) => <span className="text-success font-medium">{val || 0} ج.م</span> 
    },
    { 
      header: t("remainingAmount"), 
      key: "remainingAmount", 
      render: (val) => <span className="text-danger font-medium">{val} ج.م</span> 
    },
    { 
      header: t("paymentStatus"), 
      key: "paymentStatus",
      render: (val) => <Badge variant={statusVariants[val]}>{t(val)}</Badge>
    },
    { header: t("date"), key: "date", render: formatDate },
    { 
      header: "متكرر", 
      key: "isRecurring",
      render: (val, row) => (
        <button 
          onClick={(e) => toggleRecurring(e, row)}
          className={`p-1.5 rounded-lg transition-colors ${val ? 'bg-primary text-white shadow-md' : 'bg-bg text-text-muted hover:text-primary hover:bg-primary/10'}`}
          title="حالة متكررة (يتم إضافتها تلقائياً كل شهر)"
        >
          <Repeat size={16} />
        </button>
      )
    },
    {
      header: "إجراءات",
      key: "actions",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => handleEditClick(row, e)}
            className="p-2 text-text-muted hover:text-primary transition-colors rounded-lg hover:bg-bg"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(row.id); }}
            className="p-2 text-danger hover:bg-danger/10 transition-colors rounded-lg"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const handleDelete = async (id) => {
    try {
      await deleteDocument(id);
      toast.success("تم الحذف بنجاح");
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const total = Number(formData.totalAmount);
      
      if (editingId) {
        await updateDocument(editingId, {
          ...formData,
          totalAmount: total,
        });
        toast.success("تم التعديل بنجاح", { position: "top-center" });
      } else {
        await addDocument({
          ...formData,
          totalAmount: total,
          paidAmount: 0,
          remainingAmount: total,
          paymentStatus: "pending",
          createdBy: currentUser.uid
        });
        toast.success(t("successfullyAdded"), { position: "top-center" });
      }
      
      setIsModalOpen(false);
      setEditingId(null);
      setFormData(initialFormState);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleExport = () => {
    if (filteredAndSortedRevenues.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }

    const statusMap = { paid: "مدفوع", partial: "جزئي", pending: "قيد الانتظار", overdue: "متأخر" };
    const typeMap = {
      monthly_fee: "رسوم شهرية", assessment: "تقييم", overtime: "وقت إضافي",
      life_skills: "مهارات حياة", therapy: "جلسات علاجية", activities: "أنشطة", other: "أخرى"
    };
    const methodMap = { cash: "نقدي", bank_transfer: "تحويل بنكي", check: "شيك" };

    const headers = ["اسم العميل", "نوع الإيراد", "المبلغ الإجمالي", "المبلغ المدفوع", "المبلغ المتبقي", "حالة الدفع", "طريقة الدفع", "التاريخ", "متكرر", "ملاحظات"];
    const rows = filteredAndSortedRevenues.map(r => [
      r.clientName || "",
      typeMap[r.type] || r.type || "",
      r.totalAmount ?? "",
      r.paidAmount ?? 0,
      r.remainingAmount ?? "",
      statusMap[r.paymentStatus] || r.paymentStatus || "",
      methodMap[r.paymentMethod] || r.paymentMethod || "",
      r.date ? formatDate(r.date) : "",
      r.isRecurring ? "نعم" : "لا",
      (r.notes || "").replace(/"/g, '""')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `إيرادات_${new Date().toLocaleDateString("ar-EG").replace(/\//g, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("تم تصدير البيانات بنجاح");
  };

  return (
    <PageWrapper title={t("revenues")}>
      <Toaster position="top-center" />
      
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t("revenues")}</h1>
          <p className="text-text-muted mt-1">متابعة الإيرادات وتدفقات السيولة</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button variant="secondary" className="gap-2" onClick={handleExport}>
            <Download size={18} />
            تصدير
          </Button>
          <Button onClick={() => { setEditingId(null); setFormData(initialFormState); setIsModalOpen(true); }} className="gap-2">
            <Plus size={20} />
            {t("add")}
          </Button>
        </div>
      </div>

      {/* Filter and Sort Panel */}
      <div className="card mb-6 !p-4 flex flex-wrap gap-4 items-end bg-bg/50 border border-border">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-text-muted uppercase mb-1 flex items-center gap-1"><Filter size={12}/> تصفية بالحالة</label>
          <select className="input !py-2 !text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">الكل</option>
            <option value="paid">مدفوع</option>
            <option value="partial">مدفوع جزئياً</option>
            <option value="pending">قيد الانتظار</option>
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-bold text-text-muted uppercase mb-1 flex items-center gap-1"><Filter size={12}/> تصفية بالنوع</label>
          <select className="input !py-2 !text-sm" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">الكل</option>
            <option value="monthly_fee">{t("monthly_fee")}</option>
            <option value="assessment">{t("assessment")}</option>
            <option value="therapy">{t("therapy")}</option>
            <option value="life_skills">{t("life_skills")}</option>
            <option value="activities">{t("activities")}</option>
            <option value="other">{t("other")}</option>
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-bold text-text-muted uppercase mb-1 flex items-center gap-1"><ArrowDownUp size={12}/> ترتيب حسب</label>
          <select className="input !py-2 !text-sm" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
            <option value="date-desc">التاريخ (الأحدث أولاً)</option>
            <option value="date-asc">التاريخ (الأقدم أولاً)</option>
            <option value="amount-desc">المبلغ (الأعلى أولاً)</option>
            <option value="amount-asc">المبلغ (الأقل أولاً)</option>
            <option value="name-asc">اسم العميل (أ-ي)</option>
          </select>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredAndSortedRevenues} 
        searchPlaceholder={t("clientName")}
        onRowClick={(row) => setSelectedRevenue(row)}
      />

      {/* ── Detail View Modal ── */}
      <Modal
        isOpen={!!selectedRevenue}
        onClose={() => setSelectedRevenue(null)}
        title={selectedRevenue ? `تفاصيل الإيراد — ${selectedRevenue.clientName}` : ''}
      >
        {selectedRevenue && (
          <div className="space-y-5">
            {/* Status badge + date */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={statusVariants[selectedRevenue.paymentStatus]} className="text-sm px-4 py-1.5">
                  {t(selectedRevenue.paymentStatus)}
                </Badge>
                {selectedRevenue.isRecurring && (
                  <Badge variant="blue" className="text-xs px-2 py-1.5 gap-1"><Repeat size={12}/> متكرر</Badge>
                )}
              </div>
              <span className="text-xs text-text-muted">{formatDate(selectedRevenue.date)}</span>
            </div>

            {/* Amount summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 text-center">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">الإجمالي</p>
                <p className="text-xl font-black text-primary">{selectedRevenue.totalAmount?.toLocaleString()}</p>
                <p className="text-xs text-primary/60">ج.م</p>
              </div>
              <div className="rounded-xl bg-success/5 border border-success/10 p-4 text-center">
                <p className="text-[10px] font-bold text-success uppercase tracking-widest mb-1">المدفوع</p>
                <p className="text-xl font-black text-success">{(selectedRevenue.paidAmount || 0).toLocaleString()}</p>
                <p className="text-xs text-success/60">ج.م</p>
              </div>
              <div className="rounded-xl bg-danger/5 border border-danger/10 p-4 text-center">
                <p className="text-[10px] font-bold text-danger uppercase tracking-widest mb-1">المتبقي</p>
                <p className="text-xl font-black text-danger">{(selectedRevenue.remainingAmount || 0).toLocaleString()}</p>
                <p className="text-xs text-danger/60">ج.م</p>
              </div>
            </div>

            {/* Details rows */}
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
              {[
                { label: "اسم العميل",    value: selectedRevenue.clientName },
                { label: "نوع الإيراد",   value: t(selectedRevenue.type) },
                { label: "طريقة الدفع",   value: t(selectedRevenue.paymentMethod) },
                { label: "تاريخ الإيراد", value: formatDate(selectedRevenue.date) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center px-4 py-3 bg-bg/30 text-sm">
                  <span className="text-text-muted font-medium">{label}</span>
                  <span className="font-bold text-text">{value || '---'}</span>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="rounded-xl border border-border bg-bg/30 p-4">
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">ملاحظات</p>
              {selectedRevenue.notes ? (
                <p className="text-sm text-text leading-relaxed whitespace-pre-wrap break-all">{selectedRevenue.notes}</p>
              ) : (
                <p className="text-sm text-text-muted italic">لا توجد ملاحظات</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Add/Edit Revenue Modal ── */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingId(null); }} 
        title={editingId ? "تعديل إيراد" : "إضافة إيراد جديد"}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); setEditingId(null); }}>{t("cancel")}</Button>
            <Button onClick={handleSubmit}>{t("save")}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label={t("clientName")} 
            name="clientName" 
            value={formData.clientName} 
            onChange={handleInputChange} 
            required 
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="w-full">
              <label className="block text-sm font-semibold mb-2 text-text">{t("revenueType")}</label>
              <select 
                name="type" 
                className="input" 
                value={formData.type} 
                onChange={handleInputChange}
              >
                <option value="monthly_fee">{t("monthly_fee")}</option>
                <option value="assessment">{t("assessment")}</option>
                <option value="overtime">{t("overtime")}</option>
                <option value="life_skills">{t("life_skills")}</option>
                <option value="therapy">{t("therapy")}</option>
                <option value="activities">{t("activities")}</option>
                <option value="other">{t("other")}</option>
              </select>
            </div>
            
            <Input 
              label={t("totalAmount")} 
              name="totalAmount" 
              type="number"
              value={formData.totalAmount} 
              onChange={handleInputChange} 
              required 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="w-full">
              <label className="block text-sm font-semibold mb-2 text-text">{t("paymentMethod")}</label>
              <select 
                name="paymentMethod" 
                className="input" 
                value={formData.paymentMethod} 
                onChange={handleInputChange}
              >
                <option value="cash">{t("cash")}</option>
                <option value="bank_transfer">{t("bank_transfer")}</option>
                <option value="check">{t("check")}</option>
              </select>
            </div>
            
            <Input 
              label={t("date")} 
              name="date" 
              type="date"
              value={formData.date} 
              onChange={handleInputChange} 
              required 
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-bg rounded-xl border border-border">
            <input
              type="checkbox"
              id="isRecurring"
              name="isRecurring"
              checked={formData.isRecurring}
              onChange={handleInputChange}
              className="w-5 h-5 accent-primary cursor-pointer"
            />
            <label htmlFor="isRecurring" className="text-sm font-semibold cursor-pointer select-none">
              حالة متكررة (تُحسب تلقائياً في إيرادات الأشهر القادمة)
            </label>
          </div>

          <div className="w-full">
            <label className="block text-sm font-semibold mb-2 text-text">ملاحظات</label>
            <textarea 
              name="notes" 
              className="input min-h-[100px]" 
              value={formData.notes} 
              onChange={handleInputChange}
            ></textarea>
          </div>
        </form>
      </Modal>
      <ConfirmModal 
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm)}
        message="هل أنت متأكد من حذف هذا الإيراد؟"
      />
    </PageWrapper>
  );
};

export default RevenuesList;
