// src/components/shared/AttendanceCalendar.jsx
import React, { useState, useEffect } from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, getDay } from 'date-fns';
import { ar } from 'date-fns/locale';

const AttendanceCalendar = ({ attendanceData, onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (onDateSelect) {
      onDateSelect(selectedDate);
    }
  }, [selectedDate, onDateSelect]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const getDayStatus = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const attendance = attendanceData.find(a => a.date === dateString);
    
    if (!attendance) return 'weekend';
    
    return attendance.status === 'حاضر' ? 'present' : 'absent';
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div className="attendance-calendar-container">
      <div className="calendar-header">
        <button onClick={goToPreviousMonth} className="calendar-nav">
          
        </button>
        <h3>{format(currentDate, 'MMMM yyyy', { locale: ar })}</h3>
        <button onClick={goToNextMonth} className="calendar-nav">
          
        </button>
      </div>
      
      <div className="calendar-weekdays">
        {['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}
      </div>
      
      <div className="attendance-calendar">
        {daysInMonth.map((date, index) => {
          const dayStatus = getDayStatus(date);
          const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          
          return (
            <div 
              key={index} 
              className={`calendar-day ${dayStatus} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => handleDateClick(date)}
            >
              <div className="day-number">{format(date, 'd')}</div>
              <div className="day-status">
                {dayStatus === 'present' ? 'حاضر' : dayStatus === 'absent' ? 'غائب' : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttendanceCalendar;