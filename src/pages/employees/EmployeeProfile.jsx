import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageWrapper from "../../components/layout/PageWrapper";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { useFirestore } from "../../hooks/useFirestore";
import { useTranslation } from "../../context/AppContext";
import { ArrowRight, Phone, Mail, Calendar, Clock, CheckCircle2, XCircle, AlertTriangle, MinusCircle } from "lucide-react";
import { format, isSameMonth } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const locale = language === "ar" ? ar : enUS;

  const { data: employees, loading: empLoading } = useFirestore("employees");
  const { data: attendance, loading: attLoading } = useFirestore("attendance");

  const employee = employees.find(e => e.id === id);

  // ── Current-month work hours ──
  const monthStats = useMemo(() => {
    if (!employee) return { totalHours: 0, presentDays: 0, absentDays: 0, lateDays: 0, halfDays: 0 };
    const now = new Date();
    const myRecords = attendance.filter(r => {
      if (r.employeeId !== id) return false;
      const d = r.date?.toDate ? r.date.toDate() : new Date(r.date);
      return isSameMonth(d, now);
    });
    const totalHours = myRecords.reduce((s, r) => s + (r.actualHours || 0), 0);
    const presentDays  = myRecords.filter(r => r.status === "present").length;
    const absentDays   = myRecords.filter(r => r.status === "absent").length;
    const lateDays     = myRecords.filter(r => r.status === "late").length;
    const halfDays     = myRecords.filter(r => r.status === "half_day").length;
    return { totalHours: Number(totalHours.toFixed(1)), presentDays, absentDays, lateDays, halfDays };
  }, [attendance, id, employee]);

  // ── All attendance records for this employee (sorted newest first) ──
  const empAttendance = useMemo(() => {
    return attendance
      .filter(r => r.employeeId === id)
      .sort((a, b) => {
        const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const db = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return db - da;
      });
  }, [attendance, id]);

  const loading = empLoading || attLoading;

  if (loading) return <PageWrapper title="..."><div className="text-center py-20 text-text-muted">{t("loading")}</div></PageWrapper>;
  if (!employee) return <PageWrapper title="..."><div className="text-center py-20">Employee not found</div></PageWrapper>;

  const statusConfig = {
    present:  { label: "حاضر",    icon: <CheckCircle2 size={14} />, cls: "text-success bg-success/10" },
    absent:   { label: "غائب",    icon: <XCircle size={14} />,      cls: "text-danger bg-danger/10" },
    late:     { label: "متأخر",   icon: <AlertTriangle size={14} />,cls: "text-warning bg-warning/10" },
    half_day: { label: "نصف يوم", icon: <MinusCircle size={14} />,  cls: "text-blue-500 bg-blue-50" },
  };

  return (
    <PageWrapper title={language === "ar" ? employee.nameAr : employee.name}>
      <div className="mb-8 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/employees")} className="gap-2">
          <ArrowRight size={20} className={language === "ar" ? "" : "rotate-180"} />
          <span>العودة للقائمة</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left column: Profile Card + Salary Info ── */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card text-center">
            <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
              <span className="text-4xl font-bold text-primary">
                {(language === "ar" ? employee.nameAr : employee.name).charAt(0)}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-primary">{language === "ar" ? employee.nameAr : employee.name}</h2>
            <p className="text-text-muted font-medium mb-4">{employee.jobTitle}</p>
            <Badge variant={employee.isActive ? 'green' : 'red'}>
              {employee.isActive ? t("active") : t("inactive")}
            </Badge>

            <div className="mt-8 space-y-3 text-right">
              {employee.phone && (
                <div className="flex items-center gap-3 p-3 bg-bg rounded-lg">
                  <Phone size={18} className="text-primary shrink-0" />
                  <span className="text-sm font-medium">{employee.phone}</span>
                </div>
              )}
              {employee.email && (
                <div className="flex items-center gap-3 p-3 bg-bg rounded-lg">
                  <Mail size={18} className="text-primary shrink-0" />
                  <span className="text-sm font-medium">{employee.email}</span>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 bg-bg rounded-lg">
                <Calendar size={18} className="text-primary shrink-0" />
                <span className="text-sm font-medium">بدأ في {employee.startDate}</span>
              </div>
            </div>
          </div>

          <div className="card bg-primary text-white border-none">
            <h4 className="font-bold mb-4 opacity-80">معلومات الراتب</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white/10 p-3 rounded-lg">
                <span className="text-sm">الراتب الشهري</span>
                <span className="font-bold">{(employee.monthlySalary || employee.hourlyRate || 0).toLocaleString()} ج.م</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right column: Stats + Attendance History ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* KPI mini cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="card flex items-center gap-3 !p-4">
              <div className="w-10 h-10 bg-success/10 text-success rounded-lg flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold">ساعات الشهر</p>
                <p className="text-lg font-black">{monthStats.totalHours} <span className="text-xs font-normal">س</span></p>
              </div>
            </div>
            <div className="card flex items-center gap-3 !p-4">
              <div className="w-10 h-10 bg-success/10 text-success rounded-lg flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold">أيام الحضور</p>
                <p className="text-lg font-black">{monthStats.presentDays} <span className="text-xs font-normal">يوم</span></p>
              </div>
            </div>
            <div className="card flex items-center gap-3 !p-4">
              <div className="w-10 h-10 bg-danger/10 text-danger rounded-lg flex items-center justify-center shrink-0">
                <XCircle size={20} />
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold">أيام الغياب</p>
                <p className="text-lg font-black">{monthStats.absentDays} <span className="text-xs font-normal">يوم</span></p>
              </div>
            </div>
          </div>

          {/* Attendance History Table */}
          <div className="card !p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-bg/30">
              <h3 className="font-bold text-primary">سجل الحضور والانصراف</h3>
            </div>
            {empAttendance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="bg-bg text-xs font-bold text-primary border-b border-border">
                      <th className="px-4 py-3">التاريخ</th>
                      <th className="px-4 py-3">اليوم</th>
                      <th className="px-4 py-3">الحالة</th>
                      <th className="px-4 py-3">الدخول</th>
                      <th className="px-4 py-3">الخروج</th>
                      <th className="px-4 py-3">الساعات</th>
                      <th className="px-4 py-3">إضافي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {empAttendance.map(record => {
                      const d = record.date?.toDate ? record.date.toDate() : new Date(record.date);
                      const cfg = statusConfig[record.status] || { label: record.status, icon: null, cls: "text-text-muted bg-bg" };
                      return (
                        <tr key={record.id} className="hover:bg-bg/40 transition-colors">
                          <td className="px-4 py-3 font-mono">{format(d, 'dd/MM/yyyy')}</td>
                          <td className="px-4 py-3 text-text-muted">{format(d, 'EEEE', { locale })}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${cfg.cls}`}>
                              {cfg.icon}
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono">{record.checkIn || "—"}</td>
                          <td className="px-4 py-3 font-mono">{record.checkOut || "—"}</td>
                          <td className="px-4 py-3 font-bold">{record.actualHours ?? "—"}</td>
                          <td className="px-4 py-3 text-success font-bold">
                            {record.overtimeHours > 0 ? `+${record.overtimeHours}` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-text-muted">
                <Clock size={40} className="opacity-20 mb-3" />
                <p className="text-sm">لا يوجد سجلات حضور بعد</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default EmployeeProfile;
