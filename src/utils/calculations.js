import { differenceInMinutes } from "date-fns";

/**
 * Calculates work hours, overtime, and late minutes for a single attendance record.
 */
export const calculateWorkHours = (checkIn, checkOut, scheduledHours = 8) => {
  if (!checkIn || !checkOut) return { actualHours: 0, overtimeHours: 0, lateMinutes: 0 };

  const start = new Date(`2000-01-01T${checkIn}`);
  const end   = new Date(`2000-01-01T${checkOut}`);

  const totalMinutes  = differenceInMinutes(end, start);
  const actualHours   = totalMinutes / 60;
  const overtimeHours = Math.max(0, actualHours - scheduledHours);

  const shiftStart  = new Date(`2000-01-01T09:00`);
  const lateMinutes = Math.max(0, differenceInMinutes(start, shiftStart));

  return {
    actualHours:   Number(actualHours.toFixed(2)),
    overtimeHours: Number(overtimeHours.toFixed(2)),
    lateMinutes,
  };
};

/**
 * Computes the monthly payroll for an employee.
 *
 * Logic (monthly salary model):
 *   • Base salary   = employee.monthlySalary   (falls back to hourlyRate × totalHours if not set)
 *   • Daily rate    = monthlySalary / workingDays  (we use 26 as standard working days)
 *   • Absent deduct = absentDays × dailyRate
 *   • Late deduct   = (totalLateMinutes / (scheduledHours × 60)) × dailyRate
 *   • Overtime pay  = overtimeHours × (dailyRate / scheduledHours) × overtimeMultiplier
 *   • Advances      = sum of advances registered for this month
 *   • Net salary    = base - absentDeduction - lateDeduction + overtimePay - advances
 */
export const calculateEmployeePayroll = (employee, attendanceRecords, monthAdvances = []) => {
  const WORKING_DAYS     = 26;
  const SCHEDULED_HOURS  = 8;

  // ── Accumulate attendance stats ──────────────────────────────────
  let totalOvertimeHours = 0;
  let totalLateMinutes   = 0;
  let absentDays         = 0;

  attendanceRecords.forEach(record => {
    if (record.status === "absent") {
      absentDays++;
    } else if (record.status === "present" || record.status === "late") {
      totalOvertimeHours += record.overtimeHours || 0;
      totalLateMinutes   += record.lateMinutes   || 0;
    }
    // half_day counts as 0.5 absent day
    if (record.status === "half_day") {
      absentDays += 0.5;
    }
  });

  // ── Monthly salary base (with hourly fallback) ───────────────────
  const useMonthlySalary = Boolean(employee.monthlySalary && employee.monthlySalary > 0);
  const monthlySalary    = useMonthlySalary ? Number(employee.monthlySalary) : 0;

  let grossSalary, overtimePay, absentDeduction, lateDeduction;

  if (useMonthlySalary) {
    const dailyRate  = monthlySalary / WORKING_DAYS;
    const hourlyRate = dailyRate / SCHEDULED_HOURS;

    absentDeduction = 0;
    lateDeduction   = 0;
    overtimePay     = totalOvertimeHours * hourlyRate * (employee.overtimeRate || 1.5);
    grossSalary     = monthlySalary;
  } else {
    // Legacy hourly fallback
    const hourlyRate = Number(employee.hourlyRate) || 0;
    let totalWorkHours = 0;
    attendanceRecords.forEach(r => {
      if (r.status === "present" || r.status === "late") {
        totalWorkHours += r.actualHours || 0;
      }
    });
    absentDeduction = 0;
    lateDeduction   = 0;
    overtimePay     = totalOvertimeHours * hourlyRate * (employee.overtimeRate || 1.5);
    grossSalary     = totalWorkHours * hourlyRate;
  }

  const totalAdvances   = monthAdvances.reduce((s, a) => s + (a.amount || 0), 0);
  const totalDeductions = totalAdvances; // Removed auto absent/late deductions
  const netSalary       = Math.max(0, grossSalary + overtimePay - totalDeductions);

  return {
    employeeId:       employee.id,
    monthlySalary:    Math.round(grossSalary),
    overtimeHours:    Number(totalOvertimeHours.toFixed(2)),
    absentDays:       Number(absentDays.toFixed(1)),
    deductionMinutes: totalLateMinutes,
    grossSalary:      Math.round(grossSalary),
    overtimePay:      Math.round(overtimePay),
    absentDeduction:  Math.round(absentDeduction),
    lateDeductions:   Math.round(lateDeduction),
    advances:         Math.round(totalAdvances),
    deductions:       Math.round(totalDeductions),
    netSalary:        Math.round(netSalary),
  };
};
