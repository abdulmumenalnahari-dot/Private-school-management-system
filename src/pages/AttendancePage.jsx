// src/pages/AttendancePage.jsx
import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FormField from '../components/ui/FormField';
import Table from '../components/ui/Table';
import { Tabs, Tab } from '../components/ui/Tabs';
import AttendanceCalendar from '../components/shared/AttendanceCalendar';
import { fetchAttendance, fetchStudentsForAttendance, fetchClasses, fetchSections } from '../services/attendanceService';
import api from '../services/api';
import '../styles/pages/attendance.css';

const AttendancePage = () => {
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [toast, setToast] = useState({ show: false, message: '' });

  useEffect(() => {
    loadClasses();
    loadStudents();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadSections(selectedClass);
    }
  }, [selectedClass]);

  useEffect(() => {
    loadAttendance();
  }, [currentDate, selectedClass, selectedSection]);

  const loadClasses = async () => {
    try {
      const data = await fetchClasses();
      setClasses(data);
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const loadSections = async (classId) => {
    try {
      const data = await fetchSections(classId);
      setSections(data);
    } catch (err) {
      console.error('Error fetching sections:', err);
    }
  };

  const loadStudents = async () => {
    try {
      const data = await fetchStudentsForAttendance();
      setStudents(data);
    } catch (err) {
      console.error('Error fetching students for attendance:', err);
    }
  };

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const data = await fetchAttendance(currentDate);
      setAttendance(data);
      setError(null);
    } catch (err) {
      setError('فشل تحميل بيانات الحضور. يرجى المحاولة لاحقًا.');
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setCurrentDate(date);
  };

  const handleClassChange = (e) => {
    const classId = e.target.value;
    setSelectedClass(classId);
    setSelectedSection('');
  };

  const handleSectionChange = (e) => {
    setSelectedSection(e.target.value);
  };

  // دمج الطلاب مع سجل الحضور وتصفية حسب الصف والشعبة
  const getAttendanceWithAllStudents = () => {
    let filteredStudents = students;
    if (selectedClass) {
      filteredStudents = filteredStudents.filter(s => s.class_id == selectedClass);
    }
    if (selectedSection) {
      filteredStudents = filteredStudents.filter(s => s.section_id == selectedSection);
    }
    return filteredStudents.map(student => {
      const record = attendance.find(a => a.student_id === student.id);
      return {
        id: record?.id || null,
        student_id: student.id,
        name: student.name,
        grade: student.grade,
        section: student.section,
        status: record?.status || 'غائب', // إذا لم يكن هناك سجل، فالحالة افتراضية "غائب"
        time_in: record?.time_in || null,
        time_out: record?.time_out || null,
        notes: record?.notes || null,
      };
    });
  };

  const filterAttendance = () => {
    const allData = getAttendanceWithAllStudents();
    if (activeTab === 'all') {
      return allData;
    } else if (activeTab === 'present') {
      return allData.filter(a => a.status === 'حاضر');
    } else if (activeTab === 'absent') {
      return allData.filter(a => a.status === 'غائب');
    } else if (activeTab === 'late') {
      return allData.filter(a => a.status === 'متأخر');
    } else if (activeTab === 'leave') {
      return allData.filter(a => a.status === 'إجازة');
    }
    return allData;
  };

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3000);
  };

  // دالة لمعالجة تغيير حالة الطالب
  const handleStatusChange = async (studentId, newStatus) => {
    try {
      const attendanceData = {
        student_id: studentId,
        date: currentDate,
        status: newStatus,
        time_in: null,
        time_out: null,
        notes: null,
      };

      await api.post('/attendance', attendanceData);
      loadAttendance();
      showToast(`تم تحديث حالة الطالب إلى: ${newStatus}`);
    } catch (error) {
      console.error('Error updating attendance status:', error);
      showToast('فشل تحديث حالة الحضور.');
    }
  };

  // دالة لحذف سجل الحضور
  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف سجل الحضور هذا؟')) {
      try {
        await api.delete(`/attendance/${id}`);
        loadAttendance();
        showToast('تم حذف السجل بنجاح!');
      } catch (error) {
        console.error('Error deleting attendance record:', error);
        showToast('فشل حذف السجل.');
      }
    }
  };

  // دالة لعرض أزرار الاختيار والحالة
  const renderStatusButtons = (record) => {
    const handleRadioChange = (e) => {
      const newStatus = e.target.value;
      handleStatusChange(record.student_id, newStatus);
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input
            type="radio"
            name={`status-${record.student_id}`}
            value="حاضر"
            checked={record.status === 'حاضر'}
            onChange={handleRadioChange}
            style={{ transform: 'scale(1.2)' }}
          />
          <span style={{ color: '#28a745', fontWeight: 'bold' }}>حاضر</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input
            type="radio"
            name={`status-${record.student_id}`}
            value="غائب"
            checked={record.status === 'غائب'}
            onChange={handleRadioChange}
            style={{ transform: 'scale(1.2)' }}
          />
          <span style={{ color: '#dc3545', fontWeight: 'bold' }}>غائب</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input
            type="radio"
            name={`status-${record.student_id}`}
            value="متأخر"
            checked={record.status === 'متأخر'}
            onChange={handleRadioChange}
            style={{ transform: 'scale(1.2)' }}
          />
          <span style={{ color: '#ffc107', fontWeight: 'bold' }}>متأخر</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input
            type="radio"
            name={`status-${record.student_id}`}
            value="إجازة"
            checked={record.status === 'إجازة'}
            onChange={handleRadioChange}
            style={{ transform: 'scale(1.2)' }}
          />
          <span style={{ color: '#17a2b8', fontWeight: 'bold' }}>إجازة</span>
        </label>
      </div>
    );
  };

  // دالة لعرض أزرار الإجراءات
  const renderActions = (record) => (
    <div className="actions">
      <Button
        variant="danger"
        size="sm"
        icon="fas fa-trash"
        title="حذف"
        onClick={() => handleDelete(record.id || record.student_id)}
        disabled={!record.id}
      />
    </div>
  );

  // تعريف أعمدة الجدول
  const columns = [
    { header: 'الاسم', accessor: 'name' },
    { header: 'الصف', accessor: 'grade' },
    { header: 'الشعبة', accessor: 'section' },
    {
      header: 'الحالة',
      accessor: 'status',
      render: renderStatusButtons
    },
    {
      header: 'الإجراءات',
      accessor: 'actions',
      render: renderActions
    }
  ];

  if (error) {
    return (
      <div className="error-message">
        <i className="fas fa-exclamation-circle"></i> {error}
      </div>
    );
  }

  return (
    <div className="attendance-page">
      <h1 className="page-title">
        <i className="fas fa-calendar-check"></i>
        الحضور والغياب
      </h1>
      <Card>
        <div className="card-header">
          <h2 className="card-title">
            <i className="fas fa-calendar-day"></i>
            تسجيل الحضور ليوم {new Date(currentDate).toLocaleDateString('ar-EG')}
          </h2>
        </div>
        <div className="form-row" style={{ marginBottom: '20px' }}>
          <div className="form-group" style={{ maxWidth: '300px' }}>
            <label className="form-label">اختر التاريخ</label>
            <FormField
              name="attendanceDate"
              type="date"
              value={currentDate}
              onChange={(e) => handleDateChange(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ maxWidth: '300px' }}>
            <label className="form-label">اختر الصف</label>
            <FormField
              name="class"
              type="select"
              value={selectedClass}
              onChange={handleClassChange}
              options={[
                { value: '', label: 'اختر الصف' },
                ...classes.map(cls => ({
                  value: cls.id,
                  label: cls.name
                }))
              ]}
            />
          </div>
          <div className="form-group" style={{ maxWidth: '300px' }}>
            <label className="form-label">اختر الشعبة</label>
            <FormField
              name="section"
              type="select"
              value={selectedSection}
              onChange={handleSectionChange}
              options={[
                { value: '', label: 'اختر الشعبة' },
                ...sections.map(sec => ({
                  value: sec.id,
                  label: sec.name
                }))
              ]}
              disabled={!selectedClass}
            />
          </div>
        </div>
        <Tabs>
          <Tab label="جميع الطلاب" onClick={() => setActiveTab('all')}>
            <Table
              columns={columns}
              data={filterAttendance()}
              renderActions={renderActions}
              emptyMessage="لا توجد بيانات حضور لهذا اليوم"
            />
          </Tab>
          <Tab label="الحاضر" onClick={() => setActiveTab('present')}>
            <Table
              columns={columns}
              data={filterAttendance()}
              renderActions={renderActions}
              emptyMessage="لا توجد بيانات حضور لهذا اليوم"
            />
          </Tab>
          <Tab label="الغائب" onClick={() => setActiveTab('absent')}>
            <Table
              columns={columns}
              data={filterAttendance()}
              renderActions={renderActions}
              emptyMessage="لا توجد بيانات غياب لهذا اليوم"
            />
          </Tab>
          <Tab label="المتأخرون" onClick={() => setActiveTab('late')}>
            <Table
              columns={columns}
              data={filterAttendance()}
              renderActions={renderActions}
              emptyMessage="لا توجد بيانات تأخير لهذا اليوم"
            />
          </Tab>
          <Tab label="إجازة" onClick={() => setActiveTab('leave')}>
            <Table
              columns={columns}
              data={filterAttendance()}
              renderActions={renderActions}
              emptyMessage="لا توجد بيانات إجازة لهذا اليوم"
            />
          </Tab>
        </Tabs>
      </Card>
      <Card>
        <div className="card-header">
          <h2 className="card-title">
            <i className="fas fa-calendar-alt"></i>
            تقويم الحضور
          </h2>
        </div>
        <AttendanceCalendar
          attendanceData={attendance}
          onDateSelect={setCurrentDate}
        />
      </Card>
      <div className={`toast ${toast.show ? 'show' : ''}`}>
        {toast.message}
      </div>
    </div>
  );
};

export default AttendancePage;