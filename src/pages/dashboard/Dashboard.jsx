import React, { useMemo, useState } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import { useFirestore } from "../../hooks/useFirestore";
import { useTranslation } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { toast, Toaster } from "react-hot-toast";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  Clock,
  ArrowRight,
  Activity,
  Plus,
  UserPlus
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format, subMonths, isSameMonth } from "date-fns";
import { ar, enUS } from "date-fns/locale";

// ─── Design tokens ───────────────────────────────────────────────
const T = {
  bg:         "#F5F5F5",
  card:       "#ffffff",
  border:     "0.5px solid #E8E8EC",
  radius:     "14px",
  pad:        "20px 24px",
  title:      { fontSize: "16px", fontWeight: 500, color: "#1a1a2e" },
  label:      { fontSize: "11px", fontWeight: 500, color: "#9090A8", textTransform: "uppercase", letterSpacing: "0.08em" },
  body:       { fontSize: "14px", color: "#6B6B80" },
  hint:       { fontSize: "12px", color: "#9090A8" },
  bigNum:     { fontSize: "28px", fontWeight: 500, color: "#1a1a2e", lineHeight: 1.1 },
};

const card = {
  background: T.card,
  borderRadius: T.radius,
  border: T.border,
  padding: T.pad,
};

const TrendBadge = ({ up, value }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: "3px",
    background: up ? "#DCFCE7" : "#FEE2E2",
    color: up ? "#16A34A" : "#DC2626",
    fontSize: "12px", fontWeight: 500,
    padding: "2px 8px", borderRadius: "20px",
  }}>
    {up ? <ArrowUpRight size={12} strokeWidth={2}/> : <ArrowDownRight size={12} strokeWidth={2}/>}
    {value}
  </span>
);

const SectionTitle = ({ children }) => (
  <h3 style={T.title}>{children}</h3>
);

// ─── Main Dashboard ───────────────────────────────────────────────
const Dashboard = () => {
  const { t, language } = useTranslation();
  const { currentUser } = useAuth();
  const locale = language === "ar" ? ar : enUS;
  const navigate = useNavigate();

  // ── Real data hooks ──────────────────────────────────
  const { data: revenues, addDocument: addRevenue } = useFirestore("revenues");
  const { data: expenses } = useFirestore("expenses");
  const { addDocument: addEmployee } = useFirestore("employees");
  const { data: payments } = useFirestore("payments");
  const { data: pettyCash } = useFirestore("petty_cash");
  const { data: advances } = useFirestore("advances");

  // ── Quick Add Modals State ───────────────────────────
  const [quickAddType, setQuickAddType] = useState(null); // 'employee' | 'revenue'
  const [formData, setFormData] = useState({});

  const handleQuickAddChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQuickAddSubmit = async (e) => {
    e.preventDefault();
    try {
      if (quickAddType === 'employee') {
        await addEmployee({
          nameAr: formData.nameAr || "",
          name: formData.name || "",
          jobTitle: formData.jobTitle || "",
          monthlySalary: Number(formData.monthlySalary || 0),
          hourlyRate: 0,
          overtimeRate: 1.5,
          isActive: true,
          startDate: new Date().toISOString().split('T')[0]
        });
        toast.success("تمت إضافة الموظف بنجاح");
      } else if (quickAddType === 'revenue') {
        const total = Number(formData.totalAmount || 0);
        await addRevenue({
          clientName: formData.clientName || "",
          type: formData.type || "monthly_fee",
          totalAmount: total,
          paidAmount: 0,
          remainingAmount: total,
          paymentStatus: "pending",
          date: formData.date || new Date().toISOString().split('T')[0],
          paymentMethod: formData.paymentMethod || "cash",
          notes: formData.notes || "",
          isRecurring: !!formData.isRecurring,
          createdBy: currentUser.uid
        });
        toast.success("تمت إضافة الإيراد بنجاح");
      }
      setQuickAddType(null);
      setFormData({});
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ── KPI stats ──────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const lastMonth = subMonths(now, 1);

    // Current month revenues including recurring from past months
    const currentRevenues = revenues.filter(r => {
      if (!r.date) return false;
      const d = new Date(r.date.toDate ? r.date.toDate() : r.date);
      if (isSameMonth(d, now)) return true;
      if (r.isRecurring && d < now) return true; // Include recurring past revenues
      return false;
    });

    const currentExpenses = expenses.filter(e => {
      if (!e.date) return false;
      return isSameMonth(new Date(e.date.toDate ? e.date.toDate() : e.date), now);
    });

    const lastMonthRevenues = revenues.filter(r => {
      if (!r.date) return false;
      const d = new Date(r.date.toDate ? r.date.toDate() : r.date);
      if (isSameMonth(d, lastMonth)) return true;
      if (r.isRecurring && d < lastMonth) return true;
      return false;
    });

    const lastMonthExpenses = expenses.filter(e => {
      if (!e.date) return false;
      return isSameMonth(new Date(e.date.toDate ? e.date.toDate() : e.date), lastMonth);
    });

    const currentPettySpends = pettyCash.filter(p => {
      if (p.type !== 'spend') return false;
      if (p.isLinkedToExpense) return false; // Prevent double counting
      if (!p.date) return false;
      return isSameMonth(new Date(p.date.toDate ? p.date.toDate() : p.date), now);
    });

    const pettyCashBalance = pettyCash.reduce((sum, tx) => {
      return tx.type === 'spend' ? sum - (tx.amount || 0) : sum + (tx.amount || 0);
    }, 0);

    const currentMonthKey = format(now, 'yyyy-MM');
    const totalAdvancesThisMonth = advances
      .filter(a => a.month === currentMonthKey)
      .reduce((sum, a) => sum + (a.amount || 0), 0);

    const totalRev = currentRevenues.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const totalExp = currentExpenses.reduce((sum, e) => sum + (e.amount || 0), 0) + currentPettySpends.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // Calculate total paid this month (for new "المدفوعات الحالية" stat)
    const totalPaidThisMonth = currentRevenues.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
    
    const lastTotalRev = lastMonthRevenues.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const lastTotalExp = lastMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const pendingTotal = currentRevenues.reduce((sum, r) => sum + (r.remainingAmount || r.totalAmount || 0), 0);

    const overdueCount = revenues.filter(r => {
      if (!r.date) return false;
      if (r.paymentStatus === "paid") return false;
      return new Date(r.date.toDate ? r.date.toDate() : r.date) < thirtyDaysAgo;
    }).length;

    const revDiff = totalRev - lastTotalRev;
    const revUp = revDiff >= 0;
    const revTrendText = lastTotalRev === 0 ? "" : `${Math.abs(Math.round((revDiff / lastTotalRev) * 100))}% ${revUp ? (language === "ar" ? 'زيادة' : 'up') : (language === "ar" ? 'نقص' : 'down')}`;

    const expDiff = totalExp - lastTotalExp;
    const expUp = expDiff >= 0;
    const expTrendText = lastTotalExp === 0 ? "" : `${Math.abs(Math.round((expDiff / lastTotalExp) * 100))}% ${expUp ? (language === "ar" ? 'زيادة' : 'up') : (language === "ar" ? 'نقص' : 'down')}`;

    return { 
      totalRevenues: totalRev, 
      totalExpenses: totalExp, 
      netProfit: totalRev - totalExp, 
      totalPaidThisMonth,
      pendingPayments: pendingTotal, 
      overdueCount,
      lastTotalRev,
      lastTotalExp,
      revUp,
      revTrendText,
      expUp,
      expTrendText,
      pettyCashBalance,
      totalAdvancesThisMonth
    };
  }, [revenues, expenses, pettyCash, advances, language]);

  // ── Chart data: 6 months ───────────────────────
  const chartData = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), i)).reverse();
    return months.map(month => {
      const monthRev = revenues.filter(r => {
        if (!r.date) return false;
        const d = new Date(r.date.toDate ? r.date.toDate() : r.date);
        if (isSameMonth(d, month)) return true;
        if (r.isRecurring && d < month) return true;
        return false;
      }).reduce((s, r) => s + (r.totalAmount || 0), 0);

      const monthExp = expenses.filter(e => e.date && isSameMonth(new Date(e.date.toDate ? e.date.toDate() : e.date), month)).reduce((s, e) => s + (e.amount || 0), 0);
      return { name: format(month, "MMM", { locale }), revenues: monthRev, expenses: monthExp };
    });
  }, [revenues, expenses, locale]);

  // ── Pie data: current month expense categories ───────────────
  const pieData = useMemo(() => {
    const now = new Date();
    const cats = {};
    
    // Regular expenses
    expenses.filter(e => e.date && isSameMonth(new Date(e.date.toDate ? e.date.toDate() : e.date), now))
      .forEach(e => { cats[e.category] = (cats[e.category] || 0) + e.amount; });
    
    // Petty cash spends
    pettyCash.filter(p => p.type === 'spend' && p.date && isSameMonth(new Date(p.date.toDate ? p.date.toDate() : p.date), now))
      .forEach(p => { 
        const cat = p.category || 'other';
        cats[cat] = (cats[cat] || 0) + p.amount; 
      });

    return Object.keys(cats).map(cat => ({ name: t(cat) || cat, value: cats[cat] }));
  }, [expenses, pettyCash, t]);

  const PIE_COLORS = ["#6366F1", "#E85C3A", "#16A34A", "#F59E0B", "#9090A8", "#0F766E"];

  // ── Recent revenues for right panel ─────────────────────────────
  const recentRevenues = useMemo(() =>
    [...revenues]
      .sort((a, b) => {
        const da = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
        const db = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
        return db - da;
      })
      .slice(0, 5),
  [revenues]);

  // ── Recent expenses for comments panel ───────────────────────────
  const recentExpenses = useMemo(() =>
    [...expenses]
      .sort((a, b) => {
        const da = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
        const db = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
        return db - da;
      })
      .slice(0, 4),
  [expenses]);

  return (
    <PageWrapper title={t("dashboard")}>
      <Toaster position="top-center" />
      {/* ── 2-column content layout ── */}
      <div className="flex flex-col lg:flex-row gap-4 items-start w-full">

        {/* ════════════════════════════════════════════
            MAIN COLUMN
        ════════════════════════════════════════════ */}
        <div className="flex-1 w-full flex flex-col gap-4 min-w-0">

          {/* ── Overview card ── */}
          <div style={card}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <SectionTitle>نظرة عامة على الأداء المالي</SectionTitle>
            </div>

            {/* 2-col stat grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              {/* Revenues stat */}
              <div style={{ background: "#F9F9FB", borderRadius: "12px", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                  <TrendingUp size={15} strokeWidth={1.75} color="#9090A8" />
                  <span style={T.label}>{t("totalRevenues") || "إيرادات"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
                  <span style={T.bigNum}>{stats.totalRevenues.toLocaleString()}</span>
                  {stats.lastTotalRev > 0 && <TrendBadge up={stats.revUp} value={stats.revTrendText} />}
                </div>
                <p style={{ ...T.hint, marginTop: "4px" }}>
                  {stats.lastTotalRev > 0 ? (language === "ar" ? "مقابل الشهر الماضي" : "vs last month") : (language === "ar" ? "لا توجد إيرادات مسجلة الشهر الماضي" : "No revenues last month")}
                </p>
              </div>

              {/* Expenses stat */}
              <div style={{ background: "#F9F9FB", borderRadius: "12px", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                  <TrendingDown size={15} strokeWidth={1.75} color="#9090A8" />
                  <span style={T.label}>{t("totalExpenses") || "مصروفات"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
                  <span style={T.bigNum}>{stats.totalExpenses.toLocaleString()}</span>
                  {stats.lastTotalExp > 0 && <TrendBadge up={!stats.expUp} value={stats.expTrendText} />}
                </div>
                <p style={{ ...T.hint, marginTop: "4px" }}>
                  {stats.lastTotalExp > 0 ? (language === "ar" ? "مقابل الشهر الماضي" : "vs last month") : (language === "ar" ? "لا توجد مصروفات مسجلة الشهر الماضي" : "No expenses last month")}
                </p>
              </div>
            </div>

            {/* Highlight message */}
            {stats.overdueCount > 0 && (
              <div style={{ padding: "12px 14px", background: "#FFF5F3", borderRadius: "10px", border: "0.5px solid #E85C3A", display: "flex", alignItems: "center", gap: "10px" }}>
                <AlertCircle size={15} strokeWidth={1.75} color="#E85C3A" />
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "#1a1a2e" }}>
                    {stats.overdueCount} {language === "ar" ? "دفعة متأخرة تتجاوز 30 يوماً" : "overdue payments past 30 days"}
                  </p>
                  <p style={T.hint}>{language === "ar" ? "يُرجى المراجعة في قسم الإيرادات" : "Review in the revenues section"}</p>
                </div>
              </div>
            )}

            {/* Advanced Analytics Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-5 pt-5 border-t border-border">
              
              {/* Net Profit */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <DollarSign size={14} strokeWidth={2} color="#9090A8" />
                  <span style={T.hint}>{t("netProfit") || "صافي الربح"}</span>
                </div>
                <span style={{ fontSize: "16px", fontWeight: 600, color: stats.netProfit >= 0 ? "#16A34A" : "#DC2626" }}>
                  {stats.netProfit > 0 ? "+" : ""}{stats.netProfit.toLocaleString()} ج.م
                </span>
              </div>

              {/* Profit Margin */}
              <div className="flex flex-col gap-1 sm:border-r border-border sm:pr-4">
                <div className="flex items-center gap-1.5">
                  <PieChartIcon size={14} strokeWidth={2} color="#9090A8" />
                  <span style={T.hint}>{language === "ar" ? "هامش الربح" : "Profit Margin"}</span>
                </div>
                <span style={{ fontSize: "16px", fontWeight: 600, color: stats.netProfit > 0 ? "#16A34A" : "#1a1a2e" }}>
                  {stats.totalRevenues > 0 ? ((stats.netProfit / stats.totalRevenues) * 100).toFixed(1) : 0}%
                </span>
              </div>

              {/* Current Payments (Replaced Financial Health) */}
              <div className="flex flex-col gap-1 sm:border-r border-border sm:pr-4">
                <div className="flex items-center gap-1.5">
                  <Activity size={14} strokeWidth={2} color="#9090A8" />
                  <span style={T.hint}>{language === "ar" ? "المدفوعات الحالية" : "Current Payments"}</span>
                </div>
                <span style={{ fontSize: "16px", fontWeight: 600, color: "#16A34A" }}>
                  {stats.totalPaidThisMonth.toLocaleString()} ج.م
                </span>
              </div>

              {/* Pending Payments */}
              <div className="flex flex-col gap-1 sm:border-r border-border sm:pr-4">
                <div className="flex items-center gap-1.5">
                  <Clock size={14} strokeWidth={2} color="#9090A8" />
                  <span style={T.hint}>{t("pendingPayments") || "مدفوعات معلقة"}</span>
                </div>
                <span style={{ fontSize: "16px", fontWeight: 600, color: "#CA8A04" }}>
                  {stats.pendingPayments.toLocaleString()} ج.م
                </span>
              </div>

              {/* Petty Cash Balance */}
              <div className="flex flex-col gap-1 mt-2 pt-2 sm:mt-0 sm:pt-0 sm:border-t-0 border-t border-border sm:border-r sm:pr-4">
                <div className="flex items-center gap-1.5">
                  <DollarSign size={14} strokeWidth={2} color="#9090A8" />
                  <span style={T.hint}>{language === "ar" ? "رصيد العهدة" : "Petty Cash"}</span>
                </div>
                <span style={{ fontSize: "16px", fontWeight: 600, color: "#1a1a2e" }}>
                  {stats.pettyCashBalance.toLocaleString()} ج.م
                </span>
              </div>

              {/* Advances */}
              <div className="flex flex-col gap-1 mt-2 pt-2 sm:mt-0 sm:pt-0 sm:border-t-0 border-t border-border sm:border-r sm:pr-4">
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={14} strokeWidth={2} color="#9090A8" />
                  <span style={T.hint}>{language === "ar" ? "إجمالي السلف" : "Total Advances"}</span>
                </div>
                <span style={{ fontSize: "16px", fontWeight: 600, color: "#E85C3A" }}>
                  {stats.totalAdvancesThisMonth.toLocaleString()} ج.م
                </span>
              </div>

            </div>
          </div>

          {/* ── Area chart card ── */}
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <SectionTitle>
                {language === "ar" ? "الإيرادات مقابل المصروفات" : "Revenue vs Expenses"}
              </SectionTitle>
            </div>

            <div style={{ fontSize: "32px", fontWeight: 500, color: "#1a1a2e", marginBottom: "12px" }}>
              {stats.totalRevenues > 999999
                ? `${(stats.totalRevenues / 1000000).toFixed(1)}م`
                : stats.totalRevenues > 999
                ? `${(stats.totalRevenues / 1000).toFixed(0)}ك`
                : stats.totalRevenues.toLocaleString()} ج.م
            </div>

            <div style={{ height: "220px", width: "100%", marginTop: "10px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#F0F0F4" strokeWidth={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9090A8" }} dy={10} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ borderRadius: "10px", border: T.border, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", fontSize: "12px" }}
                    cursor={{ stroke: '#E8E8EC', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="revenues" name={language === "ar" ? "الإيرادات" : "Revenue"} stroke="#16A34A" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="expenses" name={language === "ar" ? "المصروفات" : "Expenses"} stroke="#DC2626" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Donut chart card ── */}
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <SectionTitle>{language === "ar" ? "توزيع المصروفات حسب الفئة" : "Expense Breakdown"}</SectionTitle>
              <PieChartIcon size={16} strokeWidth={1.75} color="#9090A8" />
            </div>
            <div style={{ height: "260px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={65} outerRadius={85} paddingAngle={4} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "10px", border: T.border, boxShadow: "none", fontSize: "12px" }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", color: "#6B6B80" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* ════════════════════════════════════════════
            RIGHT PANEL (280px)
        ════════════════════════════════════════════ */}
        <div className="w-full lg:w-[280px] shrink-0 flex flex-col gap-4">

          {/* Quick Actions Card */}
          <div style={{ ...card, padding: "16px" }}>
            <SectionTitle>إجراءات سريعة</SectionTitle>
            <div className="flex flex-col gap-2 mt-4">
              <Button 
                variant="secondary" 
                className="w-full justify-center gap-2 border-primary/20 text-primary hover:bg-primary/5"
                onClick={() => setQuickAddType('revenue')}
              >
                <Plus size={16} /> إضافة إيراد / مريض
              </Button>
              <Button 
                variant="secondary" 
                className="w-full justify-center gap-2 border-primary/20 text-primary hover:bg-primary/5"
                onClick={() => setQuickAddType('employee')}
              >
                <UserPlus size={16} /> إضافة موظف جديد
              </Button>
            </div>
          </div>

          {/* ── Recent Revenues list ── */}
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <SectionTitle>{language === "ar" ? "آخر الإيرادات" : "Recent Revenues"}</SectionTitle>
            </div>

            {recentRevenues.length === 0 && (
              <p style={T.hint}>{language === "ar" ? "لا توجد بيانات" : "No data yet"}</p>
            )}

            <div style={{ display: "flex", flexDirection: "column" }}>
              {recentRevenues.map((r, i) => (
                <div key={r.id || i}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
                      <div style={{
                        width: "40px", height: "40px", borderRadius: "8px", flexShrink: 0,
                        background: ["#DCFCE7","#FEE2E2","#EEF2FF","#FEF9C3","#F0FDF4"][i % 5],
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "13px", fontWeight: 500,
                        color: ["#16A34A","#DC2626","#6366F1","#CA8A04","#16A34A"][i % 5],
                      }}>
                        {(r.clientName || r.description || "R").charAt(0).toUpperCase()}
                      </div>
                      <div style={{ overflow: "hidden" }}>
                        <p style={{ fontSize: "13px", fontWeight: 500, color: "#1a1a2e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {r.clientName || r.description || (language === "ar" ? "إيراد" : "Revenue")}
                        </p>
                        <p style={{ ...T.hint, marginTop: "1px" }}>
                          {r.date ? format(r.date.toDate ? r.date.toDate() : new Date(r.date), "d MMM", { locale }) : "—"}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "end", flexShrink: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 500, color: "#1a1a2e" }}>{(r.totalAmount || 0).toLocaleString()} ج.م</p>
                      <span style={{
                        fontSize: "11px", fontWeight: 500,
                        color: r.paymentStatus === "paid" ? "#16A34A" : "#DC2626",
                      }}>
                        {r.paymentStatus === "paid" ? (language === "ar" ? "مدفوع" : "Paid") : (language === "ar" ? "معلق" : "Pending")}
                      </span>
                    </div>
                  </div>
                  {i < recentRevenues.length - 1 && <div style={{ height: "0.5px", background: "#F0F0F4" }} />}
                </div>
              ))}
            </div>

            <button onClick={() => navigate("/revenues")} style={{
              width: "100%", marginTop: "12px", padding: "8px",
              border: T.border, borderRadius: "20px",
              background: "transparent", cursor: "pointer",
              fontSize: "13px", color: "#6B6B80", textAlign: "center",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            }}>
              {language === "ar" ? "عرض كل الإيرادات" : "All revenues"} <ArrowRight size={14} strokeWidth={1.75} />
            </button>
          </div>
        </div>

      </div>

      {/* Quick Add Modals */}
      <Modal 
        isOpen={!!quickAddType} 
        onClose={() => { setQuickAddType(null); setFormData({}); }}
        title={quickAddType === 'employee' ? "إضافة موظف جديد بسرعة" : "إضافة إيراد / مريض جديد"}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setQuickAddType(null); setFormData({}); }}>إلغاء</Button>
            <Button onClick={handleQuickAddSubmit}>حفظ وإضافة</Button>
          </>
        }
      >
        <form onSubmit={handleQuickAddSubmit} className="space-y-4">
          {quickAddType === 'employee' ? (
            <>
              <Input label="اسم الموظف (بالعربية)" name="nameAr" value={formData.nameAr || ''} onChange={handleQuickAddChange} required />
              <Input label="المسمى الوظيفي" name="jobTitle" value={formData.jobTitle || ''} onChange={handleQuickAddChange} required />
              <Input label="الراتب الشهري (ج.م)" type="number" name="monthlySalary" value={formData.monthlySalary || ''} onChange={handleQuickAddChange} required />
            </>
          ) : (
            <>
              <Input label="اسم العميل / المريض" name="clientName" value={formData.clientName || ''} onChange={handleQuickAddChange} required />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="w-full">
                  <label className="block text-sm font-semibold mb-2 text-text">{t("revenueType") || "نوع الإيراد"}</label>
                  <select 
                    name="type" 
                    className="input" 
                    value={formData.type || "monthly_fee"} 
                    onChange={handleQuickAddChange}
                  >
                    <option value="monthly_fee">{t("monthly_fee") || "رسوم شهرية"}</option>
                    <option value="assessment">{t("assessment") || "تقييم"}</option>
                    <option value="overtime">{t("overtime") || "وقت إضافي"}</option>
                    <option value="life_skills">{t("life_skills") || "مهارات حياة"}</option>
                    <option value="therapy">{t("therapy") || "جلسات علاجية"}</option>
                    <option value="activities">{t("activities") || "أنشطة"}</option>
                    <option value="other">{t("other") || "أخرى"}</option>
                  </select>
                </div>
                
                <Input label="المبلغ الإجمالي (ج.م)" type="number" name="totalAmount" value={formData.totalAmount || ''} onChange={handleQuickAddChange} required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="w-full">
                  <label className="block text-sm font-semibold mb-2 text-text">{t("paymentMethod") || "طريقة الدفع"}</label>
                  <select 
                    name="paymentMethod" 
                    className="input" 
                    value={formData.paymentMethod || "cash"} 
                    onChange={handleQuickAddChange}
                  >
                    <option value="cash">{t("cash") || "نقداً"}</option>
                    <option value="bank_transfer">{t("bank_transfer") || "تحويل بنكي"}</option>
                    <option value="check">{t("check") || "شيك"}</option>
                  </select>
                </div>
                
                <Input label={t("date") || "التاريخ"} type="date" name="date" value={formData.date || new Date().toISOString().split('T')[0]} onChange={handleQuickAddChange} required />
              </div>

              <div className="flex items-center gap-3 p-4 bg-bg rounded-xl border border-border mt-4">
                <input
                  type="checkbox"
                  id="isRecurring"
                  name="isRecurring"
                  checked={formData.isRecurring || false}
                  onChange={(e) => setFormData(p => ({ ...p, isRecurring: e.target.checked }))}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
                <label htmlFor="isRecurring" className="text-sm font-semibold cursor-pointer select-none">
                  حالة متكررة (تُحسب تلقائياً كل شهر)
                </label>
              </div>

              <div className="w-full">
                <label className="block text-sm font-semibold mb-2 text-text">ملاحظات</label>
                <textarea 
                  name="notes" 
                  className="input min-h-[100px]" 
                  value={formData.notes || ''} 
                  onChange={handleQuickAddChange}
                ></textarea>
              </div>
            </>
          )}
        </form>
      </Modal>

    </PageWrapper>
  );
};

export default Dashboard;
