import React, { useMemo } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { useFirestore } from "../../hooks/useFirestore";
import { useTranslation } from "../../context/AppContext";
import { 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Wallet, 
  CheckCircle2, 
  ChevronLeft 
} from "lucide-react";
import { format, differenceInDays, isSameMonth } from "date-fns";

const Alerts = () => {
  const { t, language } = useTranslation();
  
  const { data: revenues } = useFirestore("revenues");
  const { data: employees } = useFirestore("employees");
  const { data: payroll } = useFirestore("payroll");
  const { data: transactions } = useFirestore("petty_cash");

  // Generate dynamic alerts based on system state
  const alerts = useMemo(() => {
    const list = [];
    const now = new Date();

    // 1. Overdue Payments (> 30 days and not paid)
    revenues.forEach(rev => {
      const revDate = rev.date?.toDate ? rev.date.toDate() : new Date(rev.date);
      const daysDiff = differenceInDays(now, revDate);
      
      if (rev.paymentStatus !== "paid" && daysDiff > 30) {
        list.push({
          id: `rev-${rev.id}`,
          type: "revenue",
          severity: "high",
          title: `متأخرات العميل: ${rev.clientName}`,
          description: `هذا الإيراد متأخر منذ ${daysDiff} يوم بمبلغ متبقي ${rev.remainingAmount} ج.م`,
          icon: <DollarSign size={20} />
        });
      }
    });

    // 2. Unpaid Salaries for current month
    const monthKey = format(now, 'yyyy-MM');
    employees.filter(e => e.isActive).forEach(emp => {
      const isPaid = payroll.find(p => p.employeeId === emp.id && p.month === monthKey && p.isPaid);
      if (!isPaid) {
        list.push({
          id: `sal-${emp.id}`,
          type: "payroll",
          severity: "medium",
          title: `راتب غير مدفوع: ${language === 'ar' ? emp.nameAr : emp.name}`,
          description: `لم يتم تأكيد صرف راتب هذا الموظف لشهر ${format(now, 'MMMM yyyy')}`,
          icon: <Clock size={20} />
        });
      }
    });

    // 3. Petty Cash Balance Warnings (< 20% limit)
    employees.forEach(emp => {
      const empTx = transactions.filter(tx => tx.employeeId === emp.id);
      const balance = empTx.reduce((sum, tx) => tx.type === 'spend' ? sum - tx.amount : sum + tx.amount, 0);
      const limit = emp.pettyCashLimit || 0;
      
      if (limit > 0 && balance < (limit * 0.2)) {
        list.push({
          id: `petty-${emp.id}`,
          type: "petty",
          severity: "low",
          title: `رصيد عهدة منخفض: ${language === 'ar' ? emp.nameAr : emp.name}`,
          description: `الرصيد المتبقي (${balance} ج.م) أقل من 20% من حد العهدة المسموح`,
          icon: <Wallet size={20} />
        });
      }
    });

    return list.sort((a, b) => {
      const priority = { high: 0, medium: 1, low: 2 };
      return priority[a.severity] - priority[b.severity];
    });
  }, [revenues, employees, payroll, transactions, language]);

  return (
    <PageWrapper title={t("alerts")}>
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-primary">{t("alerts")}</h1>
        <p className="text-text-muted mt-1">تنبيهات النظام الذكية للمتابعة المالية والإدارية</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {alerts.length > 0 ? (
          alerts.map(alert => (
            <div 
              key={alert.id} 
              className={`
                card flex items-start gap-4 p-5 transition-all hover:shadow-md border-r-4
                ${alert.severity === 'high' ? 'border-r-danger' : alert.severity === 'medium' ? 'border-r-warning' : 'border-r-primary-light'}
              `}
            >
              <div className={`
                w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                ${alert.severity === 'high' ? 'bg-danger/10 text-danger' : alert.severity === 'medium' ? 'bg-warning/10 text-warning' : 'bg-primary-light/10 text-primary-light'}
              `}>
                {alert.icon}
              </div>
              
              <div className="grow">
                <div className="flex items-center justify-between gap-4 mb-1">
                  <h3 className="font-bold text-text">{alert.title}</h3>
                  <Badge variant={alert.severity === 'high' ? 'red' : alert.severity === 'medium' ? 'yellow' : 'blue'}>
                    {t(alert.severity)}
                  </Badge>
                </div>
                <p className="text-sm text-text-muted leading-relaxed">
                  {alert.description}
                </p>
              </div>

              <Button variant="ghost" size="sm" className="shrink-0 text-text-muted hover:text-success">
                <CheckCircle2 size={18} />
                <span className="text-xs mr-1">{t("acknowledged")}</span>
              </Button>
            </div>
          ))
        ) : (
          <div className="card text-center py-20 bg-bg/20 border-dashed flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-primary">لا توجد تنبيهات حالياً</h3>
            <p className="text-text-muted">نظامك يعمل بشكل ممتاز، لا توجد مهام معلقة تتطلب اهتمامك الفوري.</p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default Alerts;
