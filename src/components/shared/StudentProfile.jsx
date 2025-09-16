// src/components/shared/StudentProfile.jsx
import React from 'react';

const StudentProfile = ({ student }) => {
  if (!student) return null;

  return (
    <div className="student-profile">
      <div className="student-avatar">
        {student.name ? student.name.charAt(0) : 'أ'}
      </div>
      <div className="student-info">
        <h2>{student.name}</h2>
        <p className="student-grade-section">
          {student.grade} - {student.section}
        </p>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-label">رقم الهوية</div>
            <div className="info-value">{student.idNumber}</div>
          </div>
          <div className="info-item">
            <div className="info-label">جوال ولي الأمر</div>
            <div className="info-value">{student.phone}</div>
          </div>
          <div className="info-item">
            <div className="info-label">البريد الإلكتروني</div>
            <div className="info-value">{student.email || 'غير متوفر'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;