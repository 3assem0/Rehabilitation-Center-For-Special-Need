import React, { useState, useMemo } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import DataTable from "../../components/ui/DataTable";
import Button from "../../components/ui/Button";
import { useFirestore } from "../../hooks/useFirestore";
import { useTranslation } from "../../context/AppContext";
import { Printer, FileText, Download, PieChart, TrendingUp, Users, Wallet } from "lucide-react";
import { format } from "date-fns";

const Reports = () => {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState("financial");

  const { data: revenues } = useFirestore("revenues");
  const { data: expenses } = useFirestore("expenses");
  const { data: payroll } = useFirestore("payroll");
  const { data: pettyCash } = useFirestore("petty_cash");
  const { data: employees } = useFirestore("employees");

  const tabs = [
    { id: "financial", label: t("financialReport"), icon: <TrendingUp size={18} /> },
    { id: "payroll", label: t("payrollReport"), icon: <Users size={18} /> },
    { id: "revenues", label: t("revenueReport"), icon: <FileText size={18} /> },
    { id: "petty", label: t("pettyCashReport"), icon: <Wallet size={18} /> },
  ];

  // Helper to format currency
  const fmt = (val) => `${(val || 0).toLocaleString()} ج.م`;

  return (
    <PageWrapper title={t("reports")}>
      <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8 no-print">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t("reports")}</h1>
          <p className="text-text-muted mt-1">تصدير واستخراج التقارير المالية والإدارية للمركز</p>
        </div>
        <Button onClick={() => window.print()} className="gap-2 shadow-lg shadow-primary/20">
          <Printer size={18} />
          {t("printReport")}
        </Button>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-2 mb-8 no-print">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all
              ${activeTab === tab.id 
                ? 'bg-primary text-white shadow-lg' 
                : 'bg-white text-text-muted hover:bg-bg border border-border'}
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Content */}
      <div className="print-area">
        <div className="hidden print:block mb-10 text-center border-b pb-6">
          <h1 className="text-3xl font-black text-primary">مركز التأهيل لذوي الاحتياجات الخاصة</h1>
          <p className="text-text-muted mt-2 uppercase tracking-widest">{tabs.find(t => t.id === activeTab).label}</p>
          <p className="text-xs mt-4">تاريخ الاستخراج: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        </div>

        {activeTab === "financial" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card border-primary/20 bg-primary/5">
                <p className="text-xs text-primary font-bold uppercase mb-2">إجمالي الإيرادات</p>
                <p className="text-2xl font-black">{fmt(revenues.reduce((s, r) => s + r.totalAmount, 0))}</p>
              </div>
              <div className="card border-danger/20 bg-danger/5">
                <p className="text-xs text-danger font-bold uppercase mb-2">إجمالي المصروفات</p>
                <p className="text-2xl font-black">{fmt(expenses.reduce((s, e) => s + e.amount, 0))}</p>
              </div>
              <div className="card border-success/20 bg-success/5">
                <p className="text-xs text-success font-bold uppercase mb-2">صافي الربح المتوقع</p>
                <p className="text-2xl font-black">
                  {fmt(revenues.reduce((s, r) => s + r.totalAmount, 0) - expenses.reduce((s, e) => s + e.amount, 0))}
                </p>
              </div>
            </div>

            <div className="card">
              <h3 className="font-bold mb-6 text-primary border-b pb-4">تفاصيل الحسابات الشهرية</h3>
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-bg text-xs font-bold uppercase">
                    <th className="p-4">الشهر</th>
                    <th className="p-4">الإيرادات</th>
                    <th className="p-4">المصروفات</th>
                    <th className="p-4">صافي الربح</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-t">
                  {/* Aggregated monthly logic would go here, using current month as demo */}
                  <tr>
                    <td className="p-4 font-bold">{format(new Date(), 'MMMM yyyy')}</td>
                    <td className="p-4 text-success">{fmt(revenues.reduce((s, r) => s + r.totalAmount, 0))}</td>
                    <td className="p-4 text-danger">{fmt(expenses.reduce((s, e) => s + e.amount, 0))}</td>
                    <td className="p-4 font-black">{fmt(revenues.reduce((s, r) => s + r.totalAmount, 0) - expenses.reduce((s, e) => s + e.amount, 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "payroll" && (
          <div className="card animate-in fade-in duration-500">
            <DataTable 
              columns={[
                { 
                  header: "الموظف", 
                  key: "employeeId",
                  render: (val) => employees.find(e => e.id === val)?.nameAr || '---'
                },
                { header: "ساعات العمل", key: "totalWorkHours" },
                { header: "الراتب الأساسي", key: "grossSalary", render: fmt },
                { header: "الخصومات", key: "deductions", render: (v) => <span className="text-danger">-{fmt(v)}</span> },
                { header: "صافي الراتب", key: "netSalary", render: (v) => <span className="font-bold">{fmt(v)}</span> },
                { header: "تم الصرف؟", key: "isPaid", render: (v) => v ? "نعم" : "لا" }
              ]} 
              data={payroll} 
              searchPlaceholder="بحث في الرواتب..."
            />
          </div>
        )}

        {activeTab === "revenues" && (
          <div className="card animate-in fade-in duration-500">
            <DataTable 
              columns={[
                { header: "اسم العميل", key: "clientName" },
                { header: "نوع الخدمة", key: "type", render: (v) => t(v) },
                { header: "الإجمالي", key: "totalAmount", render: fmt },
                { header: "المدفوع", key: "paidAmount", render: fmt },
                { header: "المتبقي", key: "remainingAmount", render: (v) => <span className="text-danger font-bold">{fmt(v)}</span> },
                { header: "الحالة", key: "paymentStatus", render: (v) => t(v) }
              ]} 
              data={revenues} 
              searchPlaceholder="بحث في العملاء..."
            />
          </div>
        )}

        {activeTab === "petty" && (
          <div className="card animate-in fade-in duration-500">
            <DataTable 
              columns={[
                { 
                  header: "المسؤول", 
                  key: "employeeId",
                  render: (val) => employees.find(e => e.id === val)?.nameAr || '---'
                },
                { header: "النوع", key: "type", render: (v) => (v === 'topup' ? 'تعبئة' : 'صرف') },
                { header: "المبلغ", key: "amount", render: fmt },
                { header: "الغرض", key: "purpose" },
                { 
                  header: "التاريخ", 
                  key: "date", 
                  render: (val) => val.toDate ? format(val.toDate(), 'dd/MM/yyyy') : '---' 
                }
              ]} 
              data={pettyCash} 
              searchPlaceholder="بحث في المعاملات..."
            />
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default Reports;
