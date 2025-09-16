// src/pages/ReportsPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import Card from '../components/ui/Card';
import FormField from '../components/ui/FormField';
import Button from '../components/ui/Button';
import { fetchStudentsForReport, fetchStudentReport } from '../services/reportService';

const ReportsPage = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const reportRef = useRef();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const data = await fetchStudentsForReport();
      setStudents(data);
    } catch (err) {
      console.error('Error fetching students for report:', err);
    }
  };

  const handleStudentChange = async (e) => {
    const studentId = e.target.value;
    if (!studentId) {
      setSelectedStudent(null);
      setReportData(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const student = students.find(s => s.id === studentId);
      setSelectedStudent(student);
      const report = await fetchStudentReport(studentId);
      setReportData(report);
    } catch (err) {
      setError('فشل تحميل تقرير الطالب. يرجى المحاولة لاحقًا.');
      console.error('Error fetching student report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const content = reportRef.current.innerHTML;
    const styles = `
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; }
        .report-container { max-width: 21cm; margin: 0 auto; padding: 2cm; background: white; }
        .report-header { text-align: center; margin-bottom: 30px; border-bottom: 3px double #333; padding-bottom: 20px; }
        .report-title { font-size: 28px; font-weight: bold; color: #2c3e50; margin: 0; }
        .report-subtitle { font-size: 18px; color: #7f8c8d; margin: 5px 0 0; }
        .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
        .info-item { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
        .info-label { font-weight: bold; color: #555; margin-bottom: 5px; font-size: 14px; }
        .info-value { font-size: 22px; font-weight: bold; color: #2c3e50; }
        .section-title { font-size: 20px; font-weight: bold; color: #2c3e50; margin: 30px 0 15px; padding-bottom: 10px; border-bottom: 2px solid #eee; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: center; border: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status-present { background-color: #d4edda; color: #155724; }
        .status-absent { background-color: #f8d7da; color: #721c24; }
        .print-btn { display: none; }
        @media print {
          .no-print { display: none; }
          .print-btn { display: block; }
          body { margin: 0; }
        }
      </style>
    `;
    printWindow.document.write(`
      <html>
        <head>
          <title>تقرير الطالب - ${selectedStudent?.name || 'غير معروف'}</title>
          ${styles}
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (error) {
    return (
      <div className="reports-page">
        <h1 className="page-title">
          <i className="fas fa-file-alt"></i>
          التقارير
        </h1>
        <Card>
          <div className="card-header">
            <h2 className="card-title">
              <i className="fas fa-user-graduate"></i>
              تقرير الطالب
            </h2>
          </div>
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <h1 className="page-title">
        <i className="fas fa-file-alt"></i>
        التقارير
      </h1>
      <Card>
        <div className="card-header">
          <h2 className="card-title">
            <i className="fas fa-user-graduate"></i>
            تقرير الطالب
          </h2>
        </div>
        <div className="form-row" style={{ marginBottom: '20px' }}>
          <div className="form-group" style={{ maxWidth: '300px' }}>
            <label className="form-label">اختر الطالب</label>
            <FormField
              name="reportStudent"
              type="select"
              onChange={handleStudentChange}
              options={[
                { value: '', label: 'اختر طالبًا' },
                ...students.map(student => ({
                  value: student.id,
                  label: student.name
                }))
              ]}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <i className="fas fa-spinner fa-spin"></i> جاري تحميل التقرير...
          </div>
        ) : selectedStudent && reportData ? (
          <>
            <Button 
              onClick={handlePrint} 
              variant="primary" 
              className="no-print"
              style={{ marginBottom: '20px' }}
            >
              <i className="fas fa-print"></i> طباعة التقرير
            </Button>

            <div ref={reportRef} className="report-container">
              {/* العنوان الرسمي */}
              <div className="report-header">
                <h1 className="report-title">تقرير الطالب</h1>
                <p className="report-subtitle">صادر عن إدارة المدرسة - {new Date().toLocaleDateString('ar-EG')}</p>
              </div>

              {/* المعلومات الأساسية */}
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">اسم الطالب</div>
                  <div className="info-value">{selectedStudent.name}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">رقم الهوية</div>
                  <div className="info-value">{reportData.student.idNumber}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">الصف والشعبة</div>
                  <div className="info-value">{reportData.student.gradeSection}</div>
                </div>
              </div>

              {/* تفاصيل الرسوم حسب النوع */}
              <h2 className="section-title">تفاصيل الرسوم حسب النوع</h2>
              <table>
                <thead>
                  <tr>
                    <th>نوع الرسم</th>
                    <th>المطلوب</th>
                    <th>المدفوع</th>
                    <th>المتبقي</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.feesBreakdown.map((fee, index) => (
                    <tr key={index}>
                      <td>{fee.type}</td>
                      <td>{(fee.required || 0).toLocaleString()} ر.ي</td>
                      <td style={{ color: 'green' }}>{(fee.paid || 0).toLocaleString()} ر.ي</td>
                      <td style={{ color: (fee.pending || 0) > 0 ? 'red' : 'green' }}>
                        {(fee.pending || 0).toLocaleString()} ر.ي
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th>الإجمالي</th>
                    <th>{(reportData.totalFees || 0).toLocaleString()} ر.ي</th>
                    <th style={{ color: 'green' }}>{(reportData.totalPaid || 0).toLocaleString()} ر.ي</th>
                    <th style={{ color: 'red' }}>{(reportData.totalPending || 0).toLocaleString()} ر.ي</th>
                  </tr>
                </tfoot>
              </table>

              {/* تفاصيل الخصم */}
              {reportData.discounts.length > 0 && (
                <>
                  <h2 className="section-title">تفاصيل الخصومات</h2>
                  <div className="info-grid">
                    <div className="info-item">
                      <div className="info-label">إجمالي الخصم</div>
                      <div className="info-value" style={{ color: '#e74c3c' }}>
                        {(reportData.totalDiscount || 0).toLocaleString()} ر.ي
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">نسبة الخصم من الإجمالي</div>
                      <div className="info-value" style={{ color: '#e74c3c' }}>
                        {reportData.discountPercentage || 0}%
                      </div>
                    </div>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>قيمة الخصم</th>
                        <th>النسبة</th>
                        <th>السبب</th>
                        <th>تمت الموافقة بواسطة</th>
                        <th>تاريخ الموافقة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.discounts.map((discount, index) => (
                        <tr key={index}>
                          <td>{(discount.amount || 0).toLocaleString()} ر.ي</td>
                          <td>{discount.percentage || '---'}%</td>
                          <td>{discount.reason}</td>
                          <td>{discount.approved_by}</td>
                          <td>{new Date(discount.approval_date).toLocaleDateString('ar-EG')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {/* الحالة المالية النهائية */}
<div style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '12px' }}>
  <h3 className="section-title" style={{ marginBottom: '20px' }}>الحالة المالية</h3>
  
  {/* نسبة السداد */}
  {(() => {
    const total = reportData.totalFees || 0;
    const paid = reportData.totalPaid || 0;
    const discount = reportData.totalDiscount || 0;
    const finalPaid = paid + discount; // المدفوع + الخصم = المدفوع فعليًا
    const percentage = total > 0 ? Math.min(Math.round((finalPaid / total) * 100), 100) : 0;

    let progressColor = '#e74c3c'; // أحمر
    let statusText = `مسدد ${percentage}%`;

    if (percentage >= 100) {
      progressColor = '#27ae60'; // أخضر
      statusText = 'مسدد بالكامل ✅';
    } else if (percentage >= 50) {
      progressColor = '#f39c12'; // برتقالي
    }

    return (
      <>
        <div style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold', textAlign: 'center' }}>
          {statusText}
        </div>
        <div style={{ 
          width: '100%', 
          height: '24px', 
          backgroundColor: '#ecf0f1', 
          borderRadius: '12px', 
          overflow: 'hidden',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div 
            style={{
              width: `${percentage}%`,
              height: '100%',
              backgroundColor: progressColor,
              transition: 'width 0.6s ease, background-color 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '14px',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}
          >
            {percentage}%
          </div>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '10px', 
          fontSize: '14px',
          color: '#555'
        }}>
          <span>المدفوع: {(finalPaid).toLocaleString()} ر.ي</span>
          <span>المطلوب: {(total).toLocaleString()} ر.ي</span>
        </div>
      </>
    );
  })()}
</div>

              {/* الحضور والغياب */}
              <h2 className="section-title">سجل الحضور والغياب لهذا الشهر</h2>
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">نسبة الحضور</div>
                  <div className="info-value" style={{ color: '#27ae60' }}>
                    {reportData.attendanceRate || 0}%
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">نسبة الغياب</div>
                  <div className="info-value" style={{ color: '#e74c3c' }}>
                    {reportData.absenceRate || 0}%
                  </div>
                </div>
              </div>

              {/* تقويم الحضور */}
              <h3 style={{ marginTop: '30px', marginBottom: '15px', fontWeight: 'bold' }}>
                سجل الحضور التفصيلي لهذا الشهر:
              </h3>
              <table>
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.attendance.length > 0 ? (
                    reportData.attendance.map((record, index) => (
                      <tr key={index}>
                        <td>{new Date(record.date).toLocaleDateString('ar-EG')}</td>
                        <td>
                          <span className={`status ${record.status === 'حاضر' ? 'status-present' : 'status-absent'}`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2">لا توجد بيانات حضور لهذا الشهر</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* تذييل التقرير */}
              <div style={{ 
                marginTop: '50px', 
                paddingTop: '20px', 
                borderTop: '2px solid #333', 
                textAlign: 'center',
                fontSize: '14px',
                color: '#777'
              }}>
                <p>تم إصدار هذا التقرير إلكترونيًا ولا يحتاج لختم — صالح للاستخدام الرسمي</p>
                <p>مدير النظام: {reportData.discounts.length > 0 ? reportData.discounts[0].approved_by : '---'}</p>
              </div>
            </div>

            <Button 
              onClick={handlePrint} 
              variant="primary"
              className="no-print"
              style={{ marginTop: '30px' }}
            >
              <i className="fas fa-print"></i> طباعة التقرير
            </Button>
          </>
        ) : selectedStudent ? (
          <div className="no-report-message">
            <i className="fas fa-info-circle"></i> لا توجد بيانات كافية لتقرير هذا الطالب
          </div>
        ) : (
          <div className="select-student-message">
            <i className="fas fa-user-graduate"></i> يرجى اختيار طالب لعرض التقرير
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReportsPage;