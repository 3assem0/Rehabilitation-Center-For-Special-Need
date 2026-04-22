import React, { useMemo } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import KPICard from "../../components/ui/KPICard";
import { useFirestore } from "../../hooks/useFirestore";
import { useTranslation } from "../../context/AppContext";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertCircle, 
  ArrowUpRight,
  PieChart as PieChartIcon,
  BarChart3,
  Clock
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { ar } from "date-fns/locale";

const Dashboard = () => {
  const { t, language } = useTranslation();
  
  // Real-time data
  const { data: revenues } = useFirestore("revenues");
  const { data: expenses } = useFirestore("expenses");
  const { data: payments } = useFirestore("payments");
  
  // 1. KPI Calculations (Current Month) + Overdue Alert Count
  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const currentRevenues = revenues.filter(r => {
      if (!r.date) return false;
      return isSameMonth(new Date(r.date.toDate ? r.date.toDate() : r.date), now);
    });
    const currentExpenses = expenses.filter(e => {
      if (!e.date) return false;
      return isSameMonth(new Date(e.date.toDate ? e.date.toDate() : e.date), now);
    });
    
    const totalRev = currentRevenues.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalExp = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
    const pendingTotal = revenues.reduce((sum, r) => sum + (r.remainingAmount || 0), 0);

    // Count revenues that are still unpaid/partial AND older than 30 days
    const overdueCount = revenues.filter(r => {
      if (!r.date) return false;
      if (r.paymentStatus === 'paid') return false;
      const revDate = new Date(r.date.toDate ? r.date.toDate() : r.date);
      return revDate < thirtyDaysAgo;
    }).length;

    return {
      totalRevenues: totalRev,
      totalExpenses: totalExp,
      netProfit: totalRev - totalExp,
      pendingPayments: pendingTotal,
      overdueCount,
    };
  }, [revenues, expenses]);

  // 2. Chart Data: Last 6 Months
  const chartData = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), i)).reverse();
    
    return months.map(month => {
      const monthRev = revenues
        .filter(r => {
          if (!r.date) return false;
          return isSameMonth(new Date(r.date.toDate ? r.date.toDate() : r.date), month);
        })
        .reduce((sum, r) => sum + r.totalAmount, 0);
        
      const monthExp = expenses
        .filter(e => {
          if (!e.date) return false;
          return isSameMonth(new Date(e.date.toDate ? e.date.toDate() : e.date), month);
        })
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        name: format(month, 'MMM', { locale: ar }),
        revenues: monthRev,
        expenses: monthExp
      };
    });
  }, [revenues, expenses]);

  // 3. Category Breakdown Data
  const pieData = useMemo(() => {
    const categories = {};
    expenses.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    });
    return Object.keys(categories).map(cat => ({
      name: t(cat),
      value: categories[cat]
    }));
  }, [expenses, t]);

  const COLORS = ['#1B4F72', '#2E86C1', '#F39C12', '#27AE60', '#E74C3C', '#F1C40F'];

  return (
    <PageWrapper title={t("dashboard")}>
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <KPICard 
          title={t("totalRevenues")} 
          value={`${stats.totalRevenues.toLocaleString()} ج.م`}
          icon={<TrendingUp size={24} />}
          color="primary"
        />
        <KPICard 
          title={t("totalExpenses")} 
          value={`${stats.totalExpenses.toLocaleString()} ج.م`}
          icon={<TrendingDown size={24} />}
          color="danger"
        />
        <KPICard 
          title={t("netProfit")} 
          value={`${stats.netProfit.toLocaleString()} ج.م`}
          icon={<DollarSign size={24} />}
          color="success"
        />
        <KPICard 
          title={t("pendingPayments")} 
          value={`${stats.pendingPayments.toLocaleString()} ج.م`}
          icon={<Clock size={24} />}
          color="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-primary flex items-center gap-2">
              <BarChart3 size={20} />
              الإيرادات مقابل المصروفات (6 أشهر)
            </h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECF0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7F8C8D' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7F8C8D' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="revenues" name="الإيرادات" stroke="#1B4F72" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="expenses" name="المصروفات" stroke="#E74C3C" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses Breakdown */}
        <div className="card">
          <h3 className="font-bold text-primary flex items-center gap-2 mb-8">
            <PieChartIcon size={20} />
            توزيع المصروفات حسب الفئة
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {stats.overdueCount > 0 && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
                <AlertCircle className="text-yellow-600" size={24} />
                <div>
                  <p className="text-xs font-bold text-yellow-700 uppercase">تنبيه المدفوعات</p>
                  <p className="text-sm text-yellow-900">
                    هناك {stats.overdueCount} {stats.overdueCount === 1 ? 'دفعة متأخرة تتجاوز' : 'دفعات متأخرة تتجاوز'} 30 يوماً
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
