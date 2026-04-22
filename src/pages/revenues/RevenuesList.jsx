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
import { Plus, Filter, Download } from "lucide-react";
import { format } from "date-fns";

const RevenuesList = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { data: revenues, loading, addDocument } = useFirestore("revenues");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState(null);
  const [formData, setFormData] = useState({
    clientName: "",
    type: "monthly_fee",
    totalAmount: "",
    paymentMethod: "cash",
    date: new Date().toISOString().split('T')[0],
    notes: ""
  });

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
      header: "ملاحظات", 
      key: "notes",
      render: (val) => val ? (
        <span className="text-sm text-text-muted italic max-w-[140px] truncate block">{val}</span>
      ) : <span className="text-text-muted opacity-40">—</span>
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const total = Number(formData.totalAmount);
      await addDocument({
        ...formData,
        totalAmount: total,
        paidAmount: 0,
        remainingAmount: total,
        paymentStatus: "pending",
        createdBy: currentUser.uid
      });
      toast.success(t("successfullyAdded"), { position: "top-center" });
      setIsModalOpen(false);
      setFormData({
        clientName: "", type: "monthly_fee", totalAmount: "", 
        paymentMethod: "cash", date: new Date().toISOString().split('T')[0], notes: ""
      });
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleExport = () => {
    if (revenues.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }

    const statusMap = { paid: "مدفوع", partial: "جزئي", pending: "قيد الانتظار", overdue: "متأخر" };
    const typeMap = {
      monthly_fee: "رسوم شهرية", assessment: "تقييم", overtime: "وقت إضافي",
      life_skills: "مهارات حياة", therapy: "جلسات علاجية", activities: "أنشطة", other: "أخرى"
    };
    const methodMap = { cash: "نقدي", bank_transfer: "تحويل بنكي", check: "شيك" };

    const headers = ["اسم العميل", "نوع الإيراد", "المبلغ الإجمالي", "المبلغ المدفوع", "المبلغ المتبقي", "حالة الدفع", "طريقة الدفع", "التاريخ", "ملاحظات"];
    const rows = revenues.map(r => [
      r.clientName || "",
      typeMap[r.type] || r.type || "",
      r.totalAmount ?? "",
      r.paidAmount ?? 0,
      r.remainingAmount ?? "",
      statusMap[r.paymentStatus] || r.paymentStatus || "",
      methodMap[r.paymentMethod] || r.paymentMethod || "",
      r.date ? formatDate(r.date) : "",
      (r.notes || "").replace(/"/g, '""')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    // UTF-8 BOM for correct Arabic display in Excel
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
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t("revenues")}</h1>
          <p className="text-text-muted mt-1">متابعة الإيرادات وتدفقات السيولة</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="gap-2" onClick={handleExport}>
            <Download size={18} />
            تصدير
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus size={20} />
            {t("add")}
          </Button>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={revenues} 
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
              <Badge variant={statusVariants[selectedRevenue.paymentStatus]} className="text-sm px-4 py-1.5">
                {t(selectedRevenue.paymentStatus)}
              </Badge>
              <span className="text-xs text-text-muted">{formatDate(selectedRevenue.date)}</span>
            </div>

            {/* Amount summary cards */}
            <div className="grid grid-cols-3 gap-3">
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

            {/* Notes — full, no truncation */}
            <div className="rounded-xl border border-border bg-bg/30 p-4">
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">ملاحظات</p>
              {selectedRevenue.notes ? (
                <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{selectedRevenue.notes}</p>
              ) : (
                <p className="text-sm text-text-muted italic">لا توجد ملاحظات</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Add Revenue Modal ── */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="إضافة إيراد جديد"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>{t("cancel")}</Button>
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
          
          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
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
    </PageWrapper>
  );
};

export default RevenuesList;
