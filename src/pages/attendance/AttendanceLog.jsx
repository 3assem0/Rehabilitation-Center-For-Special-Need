import React, { useState, useMemo } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import { useFirestore } from "../../hooks/useFirestore";
import { useTranslation } from "../../context/AppContext";
import { calculateWorkHours } from "../../utils/calculations";
import { toast, Toaster } from "react-hot-toast";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, Save } from "lucide-react";

const AttendanceLog = () => {
  const { t, language } = useTranslation();
  const { data: employees } = useFirestore("employees");
  const { data: attendance, addDocument, updateDocument } = useFirestore("attendance");
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCell, setSelectedCell] = useState(null); // { employeeId, date }
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cellData, setCellData] = useState({
    status: "present",
    checkIn: "09:00",
    checkOut: "17:00",
    notes: ""
  });

  const locale = language === "ar" ? ar : enUS;
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Map attendance data for quick lookup: { employeeId: { dateString: record } }
  const attendanceMap = useMemo(() => {
    const map = {};
    attendance.forEach(record => {
      const dateStr = format(record.date.toDate ? record.date.toDate() : new Date(record.date), 'yyyy-MM-dd');
      if (!map[record.employeeId]) map[record.employeeId] = {};
      map[record.employeeId][dateStr] = record;
    });
    return map;
  }, [attendance]);

  const handleCellClick = (employee, date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const existing = attendanceMap[employee.id]?.[dateStr];
    
    setSelectedCell({ employee, date });
    if (existing) {
      setCellData({
        status: existing.status,
        checkIn: existing.checkIn || "09:00",
        checkOut: existing.checkOut || "17:00",
        notes: existing.notes || ""
      });
    } else {
      setCellData({ status: "present", checkIn: "09:00", checkOut: "17:00", notes: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedCell) return;
    const { employee, date } = selectedCell;
    const dateStr = format(date, 'yyyy-MM-dd');
    const existing = attendanceMap[employee.id]?.[dateStr];

    const hoursData = calculateWorkHours(cellData.checkIn, cellData.checkOut, 8);
    const finalData = {
      employeeId: employee.id,
      date: date,
      ...cellData,
      ...hoursData
    };

    try {
      if (existing) {
        await updateDocument(existing.id, finalData);
      } else {
        await addDocument(finalData);
      }
      toast.success(t("successfullyUpdated"));
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      present: 'bg-green-100 text-green-700',
      absent: 'bg-red-100 text-red-700',
      late: 'bg-yellow-100 text-yellow-700',
      half_day: 'bg-blue-100 text-blue-700'
    };
    return (
      <span className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${styles[status]}`}>
        {status.charAt(0).toUpperCase()}
      </span>
    );
  };

  return (
    <PageWrapper title={t("attendance")}>
      <Toaster position="top-center" />
      
      {/* Month Selector */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-primary">{t("attendance")}</h1>
        <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-border shadow-sm">
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronRight size={20} className={language === 'ar' ? '' : 'rotate-180'} />
          </Button>
          <span className="font-bold text-primary min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy', { locale })}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronLeft size={20} className={language === 'ar' ? '' : 'rotate-180'} />
          </Button>
        </div>
      </div>

      {/* Attendance Grid */}
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full border-collapse text-right">
            <thead className="sticky top-0 z-20 bg-bg text-primary">
              <tr>
                <th className="px-4 py-3 border border-border sticky right-0 bg-bg z-30 min-w-[180px]">{t("employee")}</th>
                {daysInMonth.map(day => (
                  <th key={day.toString()} className={`px-2 py-3 border border-border text-center min-w-[45px] ${isToday(day) ? 'bg-primary/10' : ''}`}>
                    <div className="text-[10px] opacity-60 font-medium">{format(day, 'EEE', { locale })}</div>
                    <div className="text-xs font-bold">{format(day, 'd')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-bg/40 transition-colors">
                  <td className="px-4 py-3 border border-border sticky right-0 bg-card z-10 font-bold text-sm">
                    {language === 'ar' ? emp.nameAr : emp.name}
                  </td>
                  {daysInMonth.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const record = attendanceMap[emp.id]?.[dateStr];
                    return (
                      <td 
                        key={`${emp.id}-${dateStr}`} 
                        className="p-1 border border-border text-center cursor-pointer hover:bg-primary/5 transition-colors"
                        onClick={() => handleCellClick(emp, day)}
                      >
                        <div className="flex justify-center">
                          {record ? getStatusBadge(record.status) : <span className="w-1 h-1 bg-border rounded-full"></span>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCell ? `${t("markAttendance")}: ${language === 'ar' ? selectedCell.employee.nameAr : selectedCell.employee.name}` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>{t("cancel")}</Button>
            <Button onClick={handleSave} className="gap-2">
              <Save size={18} />
              {t("save")}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-bg rounded-lg border border-border">
              <p className="text-xs text-text-muted mb-1">{t("todayDate")}</p>
              <p className="font-bold">{selectedCell ? format(selectedCell.date, 'dd/MM/yyyy') : ''}</p>
            </div>
            <div className="p-4 bg-bg rounded-lg border border-border">
              <p className="text-xs text-text-muted mb-1">{t("dayOfWeek")}</p>
              <p className="font-bold">{selectedCell ? format(selectedCell.date, 'EEEE', { locale }) : ''}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3">{t("attendanceStatus")}</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['present', 'absent', 'late', 'half_day'].map(status => (
                <button
                  key={status}
                  className={`px-4 py-2 rounded-lg border text-sm font-bold transition-all ${
                    cellData.status === status 
                    ? 'bg-primary text-white border-primary shadow-lg ring-2 ring-primary/20' 
                    : 'bg-white border-border text-text hover:border-primary'
                  }`}
                  onClick={() => setCellData({ ...cellData, status })}
                >
                  {t(status)}
                </button>
              ))}
            </div>
          </div>

          {(cellData.status === 'present' || cellData.status === 'late' || cellData.status === 'half_day') && (
            <div className="grid grid-cols-2 gap-6 animate-in slide-in-from-top-2">
              <Input 
                label={t("checkInTime")} 
                type="time" 
                value={cellData.checkIn} 
                onChange={(e) => setCellData({ ...cellData, checkIn: e.target.value })} 
              />
              <Input 
                label={t("checkOutTime")} 
                type="time" 
                value={cellData.checkOut} 
                onChange={(e) => setCellData({ ...cellData, checkOut: e.target.value })} 
              />
            </div>
          )}

          <div className="w-full">
            <label className="block text-sm font-semibold mb-2">{t("notes")}</label>
            <textarea 
              className="input min-h-[80px]" 
              value={cellData.notes}
              onChange={(e) => setCellData({ ...cellData, notes: e.target.value })}
            ></textarea>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
};

export default AttendanceLog;
