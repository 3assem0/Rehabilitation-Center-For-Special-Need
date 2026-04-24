import React, { useMemo, useState } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { useFirestore } from "../../hooks/useFirestore";
import { useTranslation } from "../../context/AppContext";
import { toast, Toaster } from "react-hot-toast";
import { 
  Clock, 
  DollarSign, 
  CheckCircle2 
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

const Alerts = () => {
  const { t, language } = useTranslation();
  
  const { data: revenues } = useFirestore("revenues");
  const { data: employees } = useFirestore("employees");
  const { data: payroll } = useFirestore("payroll");

  // Local state to keep track of dismissed alerts with timestamps
  const [dismissedAlerts, setDismissedAlerts] = useState(() => {
    try {
      const stored = localStorage.getItem("dismissed_alerts");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  const handleDismiss = (id) => {
    setDismissedAlerts(prev => {
      const next = { ...prev, [id]: Date.now() };
      localStorage.setItem("dismissed_alerts", JSON.stringify(next));
      return next;
    });
    toast.success("تم تأكيد المراجعة، سيتم تذكيرك لاحقاً إذا لم يتم الحل");
  };

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
      const isPaid = payroll.find(p => p.employeeId === emp.id && p.month === monthKey && p.paymentStatus === 'paid');
      if (!isPaid) {
        list.push({
          id: `sal-${emp.id}-${monthKey}`,
          type: "payroll",
          severity: "medium",
          title: `راتب غير مدفوع: ${language === 'ar' ? emp.nameAr : emp.name}`,
          description: `لم يتم تأكيد صرف راتب هذا الموظف بالكامل لشهر ${format(now, 'MMMM yyyy')}`,
          icon: <Clock size={20} />
        });
      }
    });

    return list
      .filter(alert => {
        const dismissedAt = dismissedAlerts[alert.id];
        if (dismissedAt) {
          // Hide only if it was dismissed within the last 24 hours (86,400,000 ms)
          const isExpired = Date.now() - dismissedAt > 86400000;
          if (!isExpired) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const priority = { high: 0, medium: 1, low: 2 };
        return priority[a.severity] - priority[b.severity];
      });
  }, [revenues, employees, payroll, language, dismissedAlerts]);

  return (
    <PageWrapper title={t("alerts")}>
      <Toaster position="top-center" />
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-primary">{t("alerts")}</h1>
        <p className="text-text-muted m-2">تنبيهات النظام الذكية للمتابعة المالية والإدارية</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {alerts.length > 0 ? (
          alerts.map(alert => (
            <div 
              key={alert.id} 
              className={`
                card flex flex-col sm:flex-row items-start gap-4 p-5 transition-all hover:shadow-md border-r-4
                ${alert.severity === 'high' ? 'border-r-danger' : alert.severity === 'medium' ? 'border-r-warning' : 'border-r-primary-light'}
              `}
            >
              <div className="flex items-start gap-3 sm:gap-4 grow w-full">
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                  ${alert.severity === 'high' ? 'bg-danger/10 text-danger' : alert.severity === 'medium' ? 'bg-warning/10 text-warning' : 'bg-primary-light/10 text-primary-light'}
                `}>
                  {alert.icon}
                </div>
                
                <div className="grow min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <h3 className="font-bold text-text text-sm sm:text-base truncate">{alert.title}</h3>
                    <Badge variant={alert.severity === 'high' ? 'red' : alert.severity === 'medium' ? 'yellow' : 'blue'}>
                      {t(alert.severity)}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                    {alert.description}
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-auto shrink-0 flex justify-end mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-border sm:border-0">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full sm:w-auto text-text-muted hover:text-success justify-center gap-1"
                  onClick={() => handleDismiss(alert.id)}
                >
                  <CheckCircle2 size={18} />
                  <span className="text-xs">{t("acknowledged")}</span>
                </Button>
              </div>
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
