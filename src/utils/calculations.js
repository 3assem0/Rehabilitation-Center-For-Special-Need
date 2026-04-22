import { differenceInMinutes, parseISO, format } from "date-fns";

/**
 * Calculates work hours, overtime, and late minutes for a single attendance record.
 * @param {string} checkIn - HH:mm format
 * @param {string} checkOut - HH:mm format
 * @param {number} scheduledHours - Default hours (e.g. 8)
 * @returns {object} { actualHours, overtimeHours, lateMinutes }
 */
export const calculateWorkHours = (checkIn, checkOut, scheduledHours = 8) => {
  if (!checkIn || !checkOut) return { actualHours: 0, overtimeHours: 0, lateMinutes: 0 };

  const start = new Date(`2000-01-01T${checkIn}`);
  const end = new Date(`2000-01-01T${checkOut}`);
  
  // Total minutes worked
  const totalMinutes = differenceInMinutes(end, start);
  const actualHours = totalMinutes / 60;
  
  // Overtime: any hours beyond scheduled
  const overtimeHours = Math.max(0, actualHours - scheduledHours);
  
  // Late minutes: assume standard start is 8:00 AM if not provided, 
  // but usually determined by checking against a 'shift start time' 
  // For this center, we'll assume a 9:00 AM start for late calculation if not specified.
  const shiftStart = new Date(`2000-01-01T09:00`);
  const lateMinutes = Math.max(0, differenceInMinutes(start, shiftStart));

  return {
    actualHours: Number(actualHours.toFixed(2)),
    overtimeHours: Number(overtimeHours.toFixed(2)),
    lateMinutes: lateMinutes
  };
};

/**
 * Computes the payroll for an employee based on their attendance records and advances for a month.
 */
export const calculateEmployeePayroll = (employee, attendanceRecords, monthAdvances = []) => {
  let totalWorkHours = 0;
  let totalOvertimeHours = 0;
  let totalDeductionMinutes = 0;

  attendanceRecords.forEach(record => {
    if (record.status === "present" || record.status === "late") {
      totalWorkHours += record.actualHours || 0;
      totalOvertimeHours += record.overtimeHours || 0;
      totalDeductionMinutes += record.lateMinutes || 0;
    }
  });

  const totalAdvances = monthAdvances.reduce((sum, advance) => sum + (advance.amount || 0), 0);

  const grossSalary = totalWorkHours * employee.hourlyRate;
  const overtimePay = totalOvertimeHours * employee.hourlyRate * (employee.overtimeRate || 1.5);
  const lateDeductions = (totalDeductionMinutes / 60) * employee.hourlyRate;
  
  const totalDeductions = lateDeductions + totalAdvances;
  const netSalary = grossSalary + overtimePay - totalDeductions;

  return {
    employeeId: employee.id,
    totalWorkHours: Number(totalWorkHours.toFixed(2)),
    overtimeHours: Number(totalOvertimeHours.toFixed(2)),
    deductionMinutes: totalDeductionMinutes,
    grossSalary: Math.round(grossSalary),
    overtimePay: Math.round(overtimePay),
    advances: Math.round(totalAdvances),
    lateDeductions: Math.round(lateDeductions),
    deductions: Math.round(totalDeductions),
    netSalary: Math.round(netSalary)
  };
};
