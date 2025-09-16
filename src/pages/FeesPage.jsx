// src/pages/FeesPage.jsx
import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FormField from '../components/ui/FormField';
import Table from '../components/ui/Table';
import api from '../services/api'; // تم الإضافة: استيراد api مباشرة
import { fetchFees, addFee, deleteFee, fetchStudentsForFees, fetchFeeTypes } from '../services/feeService';

const FeesPage = () => {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [academicYears, setAcademicYears] = useState([]); // تم الإضافة: حالة الأعوام الدراسية
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // حالة نموذج إضافة الدفعة
  const [formData, setFormData] = useState({
    student_id: '',
    fee_type_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    receipt_number: '',
    notes: ''
  });

  // حالة نموذج تسجيل الخصم
  const [discountData, setDiscountData] = useState({
    student_id: '',
    amount: '',
    percentage: '',
    reason: '',
    academic_year_id: '', // تم الإضافة: حقل العام الدراسي
    approved_by: 'مدير النظام',
  });

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    loadFees();
    loadStudents();
    loadFeeTypes();
    loadAcademicYears(); // تم الإضافة: تحميل الأعوام الدراسية
  }, []);

  const loadFees = async () => {
    try {
      setLoading(true);
      const data = await fetchFees();
      setFees(data);
      setError(null);
    } catch (err) {
      setError('فشل تحميل سجل الدفعات. يرجى المحاولة لاحقًا.');
      console.error('Error fetching fees:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const data = await fetchStudentsForFees();
      setStudents(data);
    } catch (err) {
      console.error('Error fetching students for fees:', err);
    }
  };

  const loadFeeTypes = async () => {
    try {
      const data = await fetchFeeTypes();
      setFeeTypes(data);
    } catch (err) {
      console.error('Error fetching fee types:', err);
      showToast('فشل تحميل أنواع الرسوم. تأكد من تشغيل السيرفر.', 'error');
    }
  };

  // تم الإضافة: دالة لتحميل الأعوام الدراسية
  const loadAcademicYears = async () => {
    try {
      const response = await api.get('/academic-years');
      setAcademicYears(response.data);
    } catch (err) {
      console.error('Error fetching academic years:', err);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // معالجة تغيير حقول نموذج الدفعة
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // إذا تم اختيار نوع الرسم، قم بتحديث المبلغ تلقائيًا إذا كان محددًا في نوع الرسم
    if (name === 'fee_type_id' && value) {
      const selectedFeeType = feeTypes.find(ft => ft.id === value);
      if (selectedFeeType && selectedFeeType.amount) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          amount: selectedFeeType.amount
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // معالجة تغيير حقول نموذج الخصم
  const handleDiscountChange = (e) => {
    const { name, value } = e.target;
    setDiscountData(prev => ({ ...prev, [name]: value }));
  };

  // معالجة تقديم نموذج الدفعة
  const handleSubmit = async (e) => {
    e.preventDefault();
    // التحقق من الحقول المطلوبة
    if (!formData.student_id || !formData.fee_type_id || !formData.amount) {
      showToast('الحقول المطلوبة غير مكتملة', 'error');
      return;
    }
    // التحقق من أن المبلغ رقم صحيح
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      showToast('المبلغ يجب أن يكون رقمًا موجبًا', 'error');
      return;
    }
    try {
      await addFee({
        ...formData,
        amount: amount
      });
      setFormData({
        student_id: '',
        fee_type_id: '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: '',
        receipt_number: '',
        notes: ''
      });
      loadFees();
      showToast('تم تسجيل الدفعة بنجاح!', 'success');
    } catch (error) {
      console.error('Error adding fee:', error);
      // عرض رسالة خطأ مفصلة إذا كانت متوفرة
      if (error.response?.data?.error) {
        showToast(error.response.data.error, 'error');
      } else {
        showToast('فشل تسجيل الدفعة. يرجى التحقق من البيانات.', 'error');
      }
    }
  };

  // معالجة تقديم نموذج الخصم
  const handleDiscountSubmit = async (e) => {
    e.preventDefault();
    // التحقق من الحقول
    if (!discountData.student_id || (!discountData.amount && !discountData.percentage) || !discountData.reason || !discountData.academic_year_id) {
      showToast('الحقول المطلوبة غير مكتملة', 'error');
      return;
    }
    // التحقق من أن المبلغ أو النسبة رقم صحيح
    const amount = parseFloat(discountData.amount);
    const percentage = parseFloat(discountData.percentage);
    if (discountData.amount && (isNaN(amount) || amount <= 0)) {
      showToast('المبلغ يجب أن يكون رقمًا موجبًا', 'error');
      return;
    }
    if (discountData.percentage && (isNaN(percentage) || percentage <= 0 || percentage > 100)) {
      showToast('النسبة يجب أن تكون بين 1 و 100', 'error');
      return;
    }
    try {
      await api.post('/discounts', discountData); // استخدام api مباشرة
      setDiscountData({
        student_id: '',
        amount: '',
        percentage: '',
        reason: '',
        academic_year_id: '', // تم الإضافة: إعادة تعيين العام الدراسي
        approved_by: 'مدير النظام',
      });
      showToast('تم تسجيل الخصم بنجاح!', 'success');
    } catch (error) {
      console.error('Error adding discount:', error);
      if (error.response?.data?.error) {
        showToast(error.response.data.error, 'error');
      } else {
        showToast('فشل تسجيل الخصم. يرجى التحقق من البيانات.', 'error');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الدفعة؟')) {
      try {
        await deleteFee(id);
        loadFees();
        showToast('تم حذف الدفعة بنجاح!', 'success');
      } catch (error) {
        console.error('Error deleting fee:', error);
        if (error.response?.data?.error) {
          showToast(error.response.data.error, 'error');
        } else {
          showToast('فشل حذف الدفعة.', 'error');
        }
      }
    }
  };

  const columns = [
    { header: 'الطالب', accessor: 'studentName' },
    { header: 'النوع', accessor: 'type' },
    { header: 'المبلغ', accessor: 'amount' },
    { header: 'التاريخ', accessor: 'date' },
    { header: 'طريقة الدفع', accessor: 'method' },
    { 
      header: 'الحالة', 
      accessor: 'status',
      render: () => (
        <span className="status status-paid">مسدد</span>
      )
    },
    { header: 'الإجراءات', accessor: 'actions' }
  ];

  const renderActions = (fee) => (
    <div className="actions">
      <Button 
        variant="primary" 
        size="sm" 
        icon="fas fa-edit"
        title="تعديل"
      />
      <Button 
        variant="danger" 
        size="sm" 
        icon="fas fa-trash"
        title="حذف"
        onClick={() => handleDelete(fee.id)}
      />
    </div>
  );

  if (error) {
    return (
      <div className="error-message">
        <i className="fas fa-exclamation-circle"></i> {error}
      </div>
    );
  }

  return (
    <div className="fees-page">
      <h1 className="page-title">
        <i className="fas fa-money-bill-wave"></i>
        الرسوم والدفعات
      </h1>

      {/* قسم إضافة دفعة جديدة */}
      <Card>
        <div className="card-header">
          <h2 className="card-title">
            <i className="fas fa-file-invoice-dollar"></i>
            إضافة دفعة جديدة
          </h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <FormField
              label="اختر الطالب"
              name="student_id"
              type="select"
              value={formData.student_id}
              onChange={handleInputChange}
              options={[
                { value: '', label: 'اختر طالبًا' },
                ...students.map(student => ({
                  value: student.id,
                  label: student.name
                }))
              ]}
              required
            />
            <FormField
              label="نوع الرسم"
              name="fee_type_id"
              type="select"
              value={formData.fee_type_id}
              onChange={handleInputChange}
              options={[
                { value: '', label: 'اختر النوع' },
                ...feeTypes.map(feeType => ({
                  value: feeType.id,
                  label: `${feeType.name} (${feeType.amount} ر.س)`
                }))
              ]}
              required
            />
          </div>
          <div className="form-row">
            <FormField
              label="المبلغ (ر.س)"
              name="amount"
              type="number"
              min="1"
              value={formData.amount}
              onChange={handleInputChange}
              required
              placeholder="مثلاً: 500"
            />
            <FormField
              label="تاريخ الدفع"
              name="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-row">
            <FormField
              label="طريقة الدفع"
              name="payment_method"
              type="select"
              value={formData.payment_method}
              onChange={handleInputChange}
              options={[
                { value: '', label: 'اختر الطريقة' },
                { value: 'نقدًا', label: 'نقدًا' },
                { value: 'تحويل بنكي', label: 'تحويل بنكي' },
                { value: 'بطاقة ائتمان', label: 'بطاقة ائتمان' },
                { value: 'شيك', label: 'شيك' }
              ]}
              required
            />
            <FormField
              label="رقم الإيصال"
              name="receipt_number"
              value={formData.receipt_number}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-row">
            <FormField
              label="ملاحظات"
              name="notes"
              type="textarea"
              value={formData.notes}
              onChange={handleInputChange}
              rows="2"
            />
          </div>
          <Button type="submit" variant="primary">
            <i className="fas fa-save"></i>
            تسجيل الدفعة
          </Button>
        </form>
      </Card>

      {/* قسم تسجيل خصم */}
      <Card>
        <div className="card-header">
          <h2 className="card-title">
            <i className="fas fa-percentage"></i>
            تسجيل خصم
          </h2>
        </div>
        <form onSubmit={handleDiscountSubmit}>
          <div className="form-row">
            <FormField
              label="اختر الطالب"
              name="student_id"
              type="select"
              value={discountData.student_id}
              onChange={handleDiscountChange}
              options={[
                { value: '', label: 'اختر طالبًا' },
                ...students.map(student => ({
                  value: student.id,
                  label: student.name
                }))
              ]}
              required
            />
           <FormField
              label="السبب"
              name="reason"
              value={discountData.reason}
              onChange={handleDiscountChange}
              required
              placeholder="سبب منح الخصم"
            />
          </div>
          <div className="form-row">
            <FormField
              label="نسبة الخصم (%)"
              name="percentage"
              type="number"
              min="1"
              max="100"
              value={discountData.percentage}
              onChange={handleDiscountChange}
              placeholder="أو استخدم المبلغ"
            />
            <FormField
              label="العام الدراسي"
              name="academic_year_id"
              type="select"
              value={discountData.academic_year_id}
              onChange={handleDiscountChange}
              options={[
                { value: '', label: 'اختر العام الدراسي' },
                ...academicYears.map(year => ({
                  value: year.id,
                  label: year.name
                }))
              ]}
              required
            />
          </div>
          <Button type="submit" variant="warning">
            <i className="fas fa-tag"></i>
            تسجيل الخصم
          </Button>
        </form>
      </Card>

      {/* قسم سجل الدفعات */}
      <Card>
        <div className="card-header">
          <h2 className="card-title">
            <i className="fas fa-money-check-alt"></i>
            سجل الدفعات
          </h2>
        </div>
        {loading ? (
          <div className="loading">
            <i className="fas fa-spinner fa-spin"></i> جاري التحميل...
          </div>
        ) : (
          <Table 
            columns={columns} 
            data={fees} 
            renderActions={renderActions} 
            emptyMessage="لا توجد دفعات مسجلة"
          />
        )}
      </Card>

      {/* قسم ملخص الرسوم */}
      <Card>
        <div className="card-header">
          <h2 className="card-title">
            <i className="fas fa-chart-bar"></i>
            ملخص الرسوم
          </h2>
        </div>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-label">إجمالي الرسوم المطلوبة</div>
            <div className="info-value" id="totalFees">0 ر.س</div>
          </div>
          <div className="info-item">
            <div className="info-label">المدفوع</div>
            <div className="info-value" id="paidFees" style={{ color: 'var(--success)' }}>0 ر.س</div>
          </div>
          <div className="info-item">
            <div className="info-label">المتبقى</div>
            <div className="info-value" id="pendingFees" style={{ color: 'var(--danger)' }}>0 ر.س</div>
          </div>
        </div>
      </Card>

      <div className={`toast ${toast.type === 'error' ? 'toast-error' : ''} ${toast.show ? 'show' : ''}`}>
        {toast.message}
      </div>
    </div>
  );
};

export default FeesPage;