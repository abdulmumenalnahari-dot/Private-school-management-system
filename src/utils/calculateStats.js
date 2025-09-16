// src/utils/calculateStats.js
export const calculateAttendanceRate = (attendanceData) => {
  if (!attendanceData || attendanceData.length === 0) return 100;
  
  const total = attendanceData.length;
  const present = attendanceData.filter(a => a.status === 'حاضر').length;
  
  return Math.round((present / total) * 100);
};

export const calculateFinancialStatus = (totalFees, paidAmount) => {
  const pending = totalFees - paidAmount;
  return pending <= 0 ? 'مسدد' : 'متأخر';
};