// src/pages/StudentsPage.jsx
import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FormField from '../components/ui/FormField';
import Table from '../components/ui/Table';
import { fetchStudents, addStudent, deleteStudent, fetchSections } from '../services/studentService';

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]); // سيحتوي على جميع الشُعب مصنفة حسب الصف
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // تم التعديل: إضافة حالة لحفظ الصف المختار
  const [formData, setFormData] = useState({
    name: '',
    idNumber: '',
    grade: '', // هذا الحقل سيحتوي على ID الصف (gradeId)
    section: '', // هذا الحقل سيحتوي على ID الشعبة (sectionId)
    phone: '',
    email: '',
    address: '',
    dob: '',
    notes: ''
  });

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
  const load = async () => {
    try {
      await loadStudents();
    } catch (err) {
      setError('حدث خطأ أثناء تحميل الطلاب. يرجى المحاولة لاحقًا.');
      console.error('Error loading students:', err);
    }
  };
  load();
}, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await fetchStudents();
      setStudents(data);
      setError(null);
    } catch (err) {
      setError('فشل تحميل بيانات الطلاب. يرجى المحاولة لاحقًا.');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async () => {
    try {
      const data = await fetchSections();
      setSections(data);
    } catch (err) {
      console.error('Error fetching sections:', err);
      showToast('فشل تحميل الشُعب. تأكد من تشغيل السيرفر.', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // إذا تم تغيير الصف، نقوم بإعادة تعيين حقل الشعبة
    if (name === 'grade') {
      setFormData(prev => ({ ...prev, section: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // تقسيم الاسم الكامل إلى اسم أول واسم عائلة
      const [first_name, ...last_name_parts] = formData.name.split(' ');
      const last_name = last_name_parts.join(' ') || first_name;

      // تحويل تاريخ الميلاد إلى التنسيق الصحيح (YYYY-MM-DD)
      let birth_date = null;
      if (formData.dob) {
        const dateObj = new Date(formData.dob);
        if (!isNaN(dateObj)) {
          birth_date = dateObj.toISOString().split('T')[0];
        }
      }

      // الحصول على section_id من formData.section (الذي أصبح الآن ID)
      const section_id = formData.section || null;

      // الحصول على class_id من formData.grade (الذي أصبح الآن ID)
      const class_id = formData.grade || null;

      // التحقق من وجود الصف والشعبة
      if (!class_id) {
        throw new Error('يجب اختيار الصف الدراسي');
      }
      if (!section_id) {
        throw new Error('يجب اختيار الشعبة');
      }

      // التحقق من أن الشعبة تنتمي للصف المختار
      const selectedClass = sections.find(cls => cls.class_id == class_id);
      if (!selectedClass || !selectedClass.sections.some(sec => sec.id == section_id)) {
        throw new Error('الشعبة المحددة لا تنتمي للصف المختار');
      }

      // تحديد العام الدراسي الحالي (يمكنك جعله ديناميكيًا لاحقًا)
      const academic_year_id = 1;

      const studentData = {
        first_name,
        last_name,
        gender: 'ذكر',
        birth_date,
        nationality: 'يمني',
        religion: 'إسلام',
        address: formData.address,
        parent_phone: formData.phone,
        parent_email: formData.email,
        parent_guardian_name: 'ولي الأمر',
        parent_guardian_relation: 'أب',
        admission_date: new Date().toISOString().split('T')[0],
        section_id,
        academic_year_id
      };

      await addStudent(studentData);
      setFormData({
        name: '',
        idNumber: '',
        grade: '',
        section: '',
        phone: '',
        email: '',
        address: '',
        dob: '',
        notes: ''
      });
      loadStudents();
      showToast('تم إضافة الطالب بنجاح!');
    } catch (error) {
      console.error('Error adding student:', error);
      showToast(`فشل إضافة الطالب: ${error.message || 'يرجى التحقق من البيانات'}`, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
      try {
        await deleteStudent(id);
        loadStudents();
        showToast('تم حذف الطالب بنجاح!');
      } catch (error) {
        console.error('Error deleting student:', error);
        showToast('فشل حذف الطالب.', 'error');
      }
    }
  };

  const columns = [
    { header: 'الاسم', accessor: 'name' },
    { header: 'الهوية', accessor: 'idNumber' },
    { header: 'الصف', accessor: 'grade' },
    { header: 'الشعبة', accessor: 'section' },
    { header: 'الجوال', accessor: 'phone' },
    { header: 'الإجراءات', accessor: 'actions' }
  ];


  if (error) {
    return (
      <div className="error-message">
        <i className="fas fa-exclamation-circle"></i> {error}
      </div>
    );
  }

  // تم الإضافة: دالة للحصول على الشعب التابعة للصف المختار
const getSectionsForSelectedGrade = () => {
  if (!selectedGrade) return [];
  // نحصل على الشعب المرتبطة بالصف المختار
  const filtered = sections.filter(sec => sec.class_id === selectedGrade);
  // نزيل التكرارات باستخدام Map
  const unique = [...new Map(filtered.map(sec => [sec.id, sec])).values()];
  return unique;
};

  return (
    <div className="students-page">
      <h1 className="page-title">
        <i className="fas fa-users"></i>
        إدارة الطلاب
      </h1>
      <Card>
        <div className="card-header">
          <h2 className="card-title">
            <i className="fas fa-user-plus"></i>
            إضافة طالب جديد
          </h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <FormField
              label="الاسم الكامل"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="الاسم الأول والاسم العائلي"
            />
            <FormField
              label="رقم الهوية/الإقامة"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleInputChange}
              required
              placeholder="مثلاً: STD123456"
            />
          </div>
          <div className="form-row">
            <FormField
              label="الصف الدراسي"
              name="grade" // الآن يحتوي على ID الصف
              type="select"
              value={formData.grade}
              onChange={handleInputChange}
              options={[
                { value: '', label: 'اختر الصف' },
                ...sections.map(cls => ({
                  value: cls.class_id, // نستخدم ID الصف كقيمة
                  label: cls.class_name // نعرض اسم الصف للمستخدم
                }))
              ]}
              required
            />
            <FormField
              label="الشعبة"
              name="section" // الآن يحتوي على ID الشعبة
              type="select"
              value={formData.section}
              onChange={handleInputChange}
              options={[
                { value: '', label: 'اختر الشعبة' },
                ...getSectionsForSelectedGrade().map(sec => ({
                  value: sec.id, // نستخدم ID الشعبة كقيمة
                  label: sec.name // نعرض اسم الشعبة للمستخدم
                }))
              ]}
              required
            />
          </div>
          <div className="form-row">
            <FormField
              label="رقم جوال ولي الأمر"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              required
              placeholder="مثلاً: 712345678"
            />
            <FormField
              label="البريد الإلكتروني"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="مثلاً: example@example.com"
            />
          </div>
          <div className="form-row">
            <FormField
              label="العنوان"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="مثلاً: صنعاء، الحي السياسي"
            />
            <FormField
              label="تاريخ الميلاد"
              name="dob"
              type="date"
              value={formData.dob}
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
              rows="3"
              placeholder="ملاحظات إضافية عن الطالب"
            />
          </div>
          <Button type="submit" variant="primary">
            <i className="fas fa-save"></i>
            حفظ المعلومات
          </Button>
        </form>
      </Card>
      <Card>
        <div className="card-header">
          <h2 className="card-title">
            <i className="fas fa-users"></i>
            قائمة الطلاب
          </h2>
        </div>
        {loading ? (
  <div className="loading">
    <i className="fas fa-spinner fa-spin"></i> جاري التحميل...
  </div>
) : error ? (
  <div className="error-message">
    <i className="fas fa-exclamation-circle"></i> {error}
  </div>
) : students && students.length > 0 ? (
  <Table columns={columns} data={students} renderActions={renderActions} />
) : (
  <div className="no-data">لا يوجد طلاب مسجلين</div>
)}
      </Card>
    </div>
  );
};

export default StudentsPage;