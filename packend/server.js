// server.js
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

// تحميل المتغيرات البيئية
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// إعداد اتصال قاعدة البيانات
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || " ",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// دالة لإنشاء اتصال قاعدة البيانات مع معالجة الأخطاء
const createConnection = async () => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("اتصال ناجح بقاعدة البيانات");
    return connection;
  } catch (error) {
    console.error("فشل الاتصال بقاعدة البيانات:", error);
    throw error;
  }
};

// دالة لتنفيذ الاستعلامات مع معالجة الأخطاء
const executeQuery = async (query, params = []) => {
  let connection;
  try {
    connection = await createConnection();
    const [results] = await connection.execute(query, params);
    return results;
  } catch (error) {
    console.error("خطأ في تنفيذ الاستعلام:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// نقطة النهاية الأساسية
app.get("/api", (req, res) => {
  res.json({
    message: "API يعمل بشكل صحيح",
    endpoints: {
      dashboard: "/api/dashboard/stats",
      latestStudents: "/api/dashboard/latest-students",
      students: "/api/students",
      studentsForForms: {
        fees: "/api/students/for-fees",
        attendance: "/api/students/for-attendance",
        reports: "/api/students/for-report",
      },
      classes: "/api/classes",
      sections: "/api/sections",
      feeTypes: "/api/fee-types",
      fees: "/api/fees",
      attendance: "/api/attendance",
      reports: "/api/reports/student/:id",
    },
  });
});

// 1. نقاط نهاية لوحة التحكم
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    // جلب إجمالي الطلاب النشطين
    const totalStudentsResult = await executeQuery(`
      SELECT COUNT(*) AS count 
      FROM students 
      WHERE status = 'نشط'
    `);
    const totalStudents = totalStudentsResult[0]?.count || 0;

    // جلب الحضور اليومي
    const attendanceTodayResult = await executeQuery(`
      SELECT COUNT(*) AS count 
      FROM attendance 
      WHERE date = CURDATE() AND status = 'حاضر'
    `);
    const attendanceToday = attendanceTodayResult[0]?.count || 0;

    // جلب الغياب اليومي
    const absentTodayResult = await executeQuery(`
      SELECT COUNT(*) AS count 
      FROM attendance 
      WHERE date = CURDATE() AND status = 'غائب'
    `);
    const absentToday = absentTodayResult[0]?.count || 0;

    // جلب الرسوم المستحقة
    const feesDueResult = await executeQuery(`
      SELECT 
        SUM(ft.amount) AS total_fees,
        COALESCE(SUM(p.amount), 0) AS paid_amount
      FROM fee_types ft
      LEFT JOIN payments p ON ft.id = p.fee_type_id
      WHERE ft.is_mandatory = 1
    `);
    const totalFees = feesDueResult[0]?.total_fees || 0;
    const paidAmount = feesDueResult[0]?.paid_amount || 0;
    const pendingAmount = totalFees - paidAmount;

    res.json({
      totalStudents,
      attendanceToday,
      absentToday,
      feesDue: pendingAmount,
    });
  } catch (error) {
    console.error("خطأ في جلب إحصائيات لوحة التحكم:", error);
    res.status(500).json({
      error: "فشل جلب الإحصائيات",
      details: error.message,
    });
  }
});

app.get("/api/dashboard/latest-students", async (req, res) => {
  try {
    const students = await executeQuery(`
      SELECT 
        s.id,
        CONCAT(s.first_name, ' ', s.last_name) AS name,
        c.name AS grade,
        sec.name AS section,
        s.parent_phone AS phone
      FROM students s
      JOIN sections sec ON s.section_id = sec.id
      JOIN classes c ON sec.class_id = c.id
      ORDER BY s.created_at DESC
      LIMIT 5
    `);

    res.json(students);
  } catch (error) {
    console.error("خطأ في جلب أحدث الطلاب:", error);
    res.status(500).json({
      error: "فشل جلب أحدث الطلاب",
      details: error.message,
    });
  }
});

// 2. نقاط نهاية الأصناف الدراسية
app.get("/api/classes", async (req, res) => {
  try {
    const classes = await executeQuery(`
      SELECT 
        id, name, level, order_number
      FROM classes
      ORDER BY order_number
    `);

    res.json(classes);
  } catch (error) {
    console.error("خطأ في جلب الأصناف الدراسية:", error);
    res.status(500).json({
      error: "فشل جلب الأصناف الدراسية",
      details: error.message,
    });
  }
});

// 3. نقاط نهاية الشُعب
app.get("/api/sections", async (req, res) => {
  try {
    const sections = await executeQuery(`
      SELECT 
        sec.id, 
        sec.name, 
        c.id AS class_id,
        c.name AS class_name
      FROM sections sec
      JOIN classes c ON sec.class_id = c.id
      ORDER BY c.order_number, sec.name
    `);

    // تنظيم البيانات لسهولة الاستخدام في واجهة المستخدم
    const sectionsByClass = {};
    sections.forEach((section) => {
      if (!sectionsByClass[section.class_id]) {
        sectionsByClass[section.class_id] = {
          class_id: section.class_id,
          class_name: section.class_name,
          sections: [],
        };
      }
      sectionsByClass[section.class_id].sections.push({
        id: section.id,
        name: section.name,
      });
    });

    res.json(Object.values(sectionsByClass));
  } catch (error) {
    console.error("خطأ في جلب الشُعب:", error);
    res.status(500).json({
      error: "فشل جلب الشُعب",
      details: error.message,
    });
  }
});

// 4. نقاط نهاية أنواع الرسوم
app.get("/api/fee-types", async (req, res) => {
  try {
    const feeTypes = await executeQuery(`
      SELECT 
        id, name, amount, is_mandatory, description
      FROM fee_types
      ORDER BY name
    `);

    res.json(feeTypes);
  } catch (error) {
    console.error("خطأ في جلب أنواع الرسوم:", error);
    res.status(500).json({
      error: "فشل جلب أنواع الرسوم",
      details: error.message,
    });
  }
});

// 5. نقاط نهاية الطلاب
app.get("/api/students", async (req, res) => {
  try {
    const students = await executeQuery(`
      SELECT 
        s.id,
        CONCAT(s.first_name, ' ', s.last_name) AS name,
        s.id AS idNumber,
        c.name AS grade,
        sec.name AS section,
        s.parent_phone AS phone,
        s.parent_email AS email,
        s.address,
        s.birth_date AS dob,
        s.admission_date AS createdAt
      FROM students s
      JOIN sections sec ON s.section_id = sec.id
      JOIN classes c ON sec.class_id = c.id
      ORDER BY s.created_at DESC
    `);

    res.json(students);
  } catch (error) {
    console.error("خطأ في جلب قائمة الطلاب:", error);
    res.status(500).json({
      error: "فشل جلب قائمة الطلاب",
      details: error.message,
    });
  }
});

app.post("/api/students", async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    await connection.beginTransaction();

    const {
      first_name,
      last_name,
      gender,
      birth_date,
      nationality,
      religion,
      address,
      emergency_contact,
      medical_conditions,
      blood_type,
      parent_guardian_name,
      parent_guardian_relation,
      parent_phone,
      parent_email,
      parent_occupation,
      parent_work_address,
      admission_date,
      section_id,
      academic_year_id,
    } = req.body;

    // التحقق من الحقول المطلوبة
    if (!first_name || !last_name || !section_id) {
      return res.status(400).json({
        error: "الحقول المطلوبة غير مكتملة",
        fields: [
          !first_name && "first_name",
          !last_name && "last_name",
          !section_id && "section_id",
        ].filter(Boolean),
      });
    }

    // التحقق من وجود الطالب مسبقًا (باستخدام الاسم والشعبة)
    const [existingStudent] = await connection.execute(
      `
      SELECT id FROM students 
      WHERE first_name = ? AND last_name = ? AND section_id = ?
    `,
      [first_name, last_name, section_id]
    );

    if (existingStudent.length > 0) {
      return res.status(400).json({
        error: "الطالب موجود مسبقًا",
        details: "يوجد طالب بنفس الاسم والشعبة",
      });
    }

    // التحقق من وجود الشعبة في قاعدة البيانات
    const [sectionExists] = await connection.execute(
      `
      SELECT id FROM sections WHERE id = ?
    `,
      [section_id]
    );

    if (sectionExists.length === 0) {
      return res.status(400).json({
        error: "الشعبة المحددة غير موجودة",
        field: "section_id",
        value: section_id,
      });
    }

    // التحقق من وجود العام الدراسي في قاعدة البيانات
    if (academic_year_id) {
      const [yearExists] = await connection.execute(
        `
        SELECT id FROM academic_years WHERE id = ?
      `,
        [academic_year_id]
      );

      if (yearExists.length === 0) {
        return res.status(400).json({
          error: "العام الدراسي المحدد غير موجود",
          field: "academic_year_id",
          value: academic_year_id,
        });
      }
    }

    // توليد معرف فريد للطالب
    const studentId = `STD${Date.now()}`;

    // تأمين جميع الحقول
    const safeParams = [
      studentId,
      first_name,
      last_name,
      gender || null,
      birth_date || null,
      nationality || "يمني",
      religion || "إسلام",
      address || null,
      emergency_contact || null,
      medical_conditions || null,
      blood_type || null,
      parent_guardian_name || null,
      parent_guardian_relation || null,
      parent_phone || null,
      parent_email || null,
      parent_occupation || null,
      parent_work_address || null,
      admission_date || new Date().toISOString().split("T")[0],
      section_id,
      academic_year_id || null,
    ];

    // إدخال بيانات الطالب
    await connection.execute(
      `
      INSERT INTO students (
        id, first_name, last_name, gender, birth_date, nationality, religion, 
        address, emergency_contact, medical_conditions, blood_type,
        parent_guardian_name, parent_guardian_relation, parent_phone, 
        parent_email, parent_occupation, parent_work_address, 
        admission_date, section_id, academic_year_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      safeParams
    );

    await connection.commit();
    res.status(201).json({
      id: studentId,
      message: "تم إضافة الطالب بنجاح",
      success: true,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("خطأ في إضافة الطالب:", error);

    // معالجة خطأ المفتاح الخارجي بشكل خاص
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        error: "الشعبة المحددة غير موجودة في قاعدة البيانات",
        details: "تأكد من اختيار شعبة موجودة من القائمة",
      });
    }

    res.status(500).json({
      error: "فشل إضافة الطالب",
      details: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.delete("/api/students/:id", async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    await connection.beginTransaction();

    const studentId = req.params.id;

    // حذف السجلات المرتبطة
    await connection.execute("DELETE FROM attendance WHERE student_id = ?", [
      studentId,
    ]);
    await connection.execute("DELETE FROM payments WHERE student_id = ?", [
      studentId,
    ]);
    await connection.execute(
      "DELETE FROM academic_results WHERE student_id = ?",
      [studentId]
    );
    await connection.execute("DELETE FROM notes WHERE student_id = ?", [
      studentId,
    ]);
    await connection.execute(
      "DELETE FROM user_student_relations WHERE student_id = ?",
      [studentId]
    );

    // حذف الطالب
    await connection.execute("DELETE FROM students WHERE id = ?", [studentId]);

    await connection.commit();
    res.json({
      message: "تم حذف الطالب بنجاح",
      success: true,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("خطأ في حذف الطالب:", error);
    res.status(500).json({
      error: "فشل حذف الطالب",
      details: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.get("/api/students/for-fees", async (req, res) => {
  try {
    const students = await executeQuery(`
      SELECT 
        s.id,
        CONCAT(s.first_name, ' ', s.last_name) AS name
      FROM students s
      WHERE s.status = 'نشط'
      ORDER BY s.created_at DESC
    `);

    res.json(students);
  } catch (error) {
    console.error("خطأ في جلب الطلاب للرسوم:", error);
    res.status(500).json({
      error: "فشل جلب الطلاب للرسوم",
      details: error.message,
    });
  }
});

app.get("/api/students/for-attendance", async (req, res) => {
  try {
    const students = await executeQuery(`
      SELECT 
        s.id,
        CONCAT(s.first_name, ' ', s.last_name) AS name,
        c.name AS grade,
        sec.name AS section
      FROM students s
      JOIN sections sec ON s.section_id = sec.id
      JOIN classes c ON sec.class_id = c.id
      WHERE s.status = 'نشط'
      ORDER BY c.order_number, sec.name, s.first_name
    `);

    res.json(students);
  } catch (error) {
    console.error("خطأ في جلب الطلاب للحضور:", error);
    res.status(500).json({
      error: "فشل جلب الطلاب للحضور",
      details: error.message,
    });
  }
});

app.get("/api/students/for-report", async (req, res) => {
  try {
    const students = await executeQuery(`
      SELECT 
        s.id,
        CONCAT(s.first_name, ' ', s.last_name) AS name
      FROM students s
      WHERE s.status = 'نشط'
      ORDER BY s.created_at DESC
    `);

    res.json(students);
  } catch (error) {
    console.error("خطأ في جلب الطلاب للتقارير:", error);
    res.status(500).json({
      error: "فشل جلب الطلاب للتقارير",
      details: error.message,
    });
  }
});

// 6. نقاط نهاية الرسوم
app.get("/api/fees", async (req, res) => {
  try {
    const fees = await executeQuery(`
      SELECT 
        p.id,
        CONCAT(s.first_name, ' ', s.last_name) AS studentName,
        ft.name AS type,
        p.amount,
        p.payment_date AS date,
        p.payment_method AS method
      FROM payments p
      JOIN students s ON p.student_id = s.id
      JOIN fee_types ft ON p.fee_type_id = ft.id
      ORDER BY p.payment_date DESC
    `);

    res.json(fees);
  } catch (error) {
    console.error("خطأ في جلب سجل الدفعات:", error);
    res.status(500).json({
      error: "فشل جلب سجل الدفعات",
      details: error.message,
    });
  }
});

app.post("/api/fees", async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    await connection.beginTransaction();

    const {
      student_id,
      fee_type_id,
      amount,
      payment_date,
      payment_method,
      receipt_number,
      notes,
    } = req.body;

    // التحقق من الحقول المطلوبة
    if (!student_id || !fee_type_id || !amount) {
      return res.status(400).json({
        error: "الحقول المطلوبة غير مكتملة",
        fields: [
          !student_id && "student_id",
          !fee_type_id && "fee_type_id",
          !amount && "amount",
        ].filter(Boolean),
      });
    }

    // التحقق من وجود الطالب في قاعدة البيانات
    const [studentExists] = await connection.execute(
      `
      SELECT id FROM students WHERE id = ?
    `,
      [student_id]
    );

    if (studentExists.length === 0) {
      return res.status(400).json({
        error: "الطالب المحدد غير موجود",
        field: "student_id",
        value: student_id,
      });
    }

    // التحقق من وجود نوع الرسم في قاعدة البيانات
    const [feeTypeExists] = await connection.execute(
      `
      SELECT id FROM fee_types WHERE id = ?
    `,
      [fee_type_id]
    );

    if (feeTypeExists.length === 0) {
      return res.status(400).json({
        error: "نوع الرسم المحدد غير موجود",
        field: "fee_type_id",
        value: fee_type_id,
      });
    }

    // إدخال الدفعة
    await connection.execute(
      `
      INSERT INTO payments (
        student_id, fee_type_id, amount, payment_date, payment_method, receipt_number, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        student_id,
        fee_type_id,
        amount,
        payment_date || new Date().toISOString().split("T")[0],
        payment_method || "نقدًا",
        receipt_number || null,
        notes || null,
      ]
    );

    await connection.commit();
    res.status(201).json({
      message: "تم تسجيل الدفعة بنجاح",
      success: true,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("خطأ في تسجيل الدفعة:", error);
    res.status(500).json({
      error: "فشل تسجيل الدفعة",
      details: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.delete("/api/fees/:id", async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    await connection.beginTransaction();

    const paymentId = req.params.id;

    // حذف الدفعة
    await connection.execute("DELETE FROM payments WHERE id = ?", [paymentId]);

    await connection.commit();
    res.json({
      message: "تم حذف الدفعة بنجاح",
      success: true,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("خطأ في حذف الدفعة:", error);
    res.status(500).json({
      error: "فشل حذف الدفعة",
      details: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// 7. نقاط نهاية الحضور
app.get("/api/attendance", async (req, res) => {
  const { date } = req.query;
  try {
    const attendance = await executeQuery(
      `
      SELECT 
        a.id,
        a.student_id,
        CONCAT(s.first_name, ' ', s.last_name) AS name,
        c.name AS grade,
        sec.name AS section,
        a.status,
        a.time_in,
        a.time_out,
        a.notes
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN sections sec ON s.section_id = sec.id
      JOIN classes c ON sec.class_id = c.id
      WHERE a.date = ?
      ORDER BY c.order_number, sec.name, s.first_name
    `,
      [date || new Date().toISOString().split("T")[0]]
    );

    res.json(attendance);
  } catch (error) {
    console.error("خطأ في جلب بيانات الحضور:", error);
    res.status(500).json({
      error: "فشل جلب بيانات الحضور",
      details: error.message,
    });
  }
});

app.post("/api/attendance", async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    await connection.beginTransaction();

    const { student_id, date, status, time_in, time_out, notes } = req.body;

    // التحقق من الحقول المطلوبة
    if (!student_id || !date || !status) {
      return res.status(400).json({
        error: "الحقول المطلوبة غير مكتملة",
        fields: [
          !student_id && "student_id",
          !date && "date",
          !status && "status",
        ].filter(Boolean),
      });
    }

    // التحقق من وجود الطالب في قاعدة البيانات
    const [studentExists] = await connection.execute(
      `
      SELECT id FROM students WHERE id = ?
    `,
      [student_id]
    );

    if (studentExists.length === 0) {
      return res.status(400).json({
        error: "الطالب المحدد غير موجود",
        field: "student_id",
        value: student_id,
      });
    }

    // التحقق مما إذا كان هناك سجل موجود لهذا الطالب في هذا اليوم
    const [existing] = await connection.execute(
      `
      SELECT id FROM attendance WHERE student_id = ? AND date = ?
    `,
      [student_id, date]
    );

    if (existing.length > 0) {
      // تحديث السجل الموجود
      await connection.execute(
        `
        UPDATE attendance 
        SET status = ?, time_in = ?, time_out = ?, notes = ?
        WHERE student_id = ? AND date = ?
      `,
        [status, time_in, time_out, notes, student_id, date]
      );
    } else {
      // إنشاء سجل جديد
      await connection.execute(
        `
        INSERT INTO attendance (
          student_id, date, status, time_in, time_out, notes
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
        [student_id, date, status, time_in, time_out, notes]
      );
    }

    await connection.commit();
    res.status(201).json({
      message: "تم تحديث بيانات الحضور بنجاح",
      success: true,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("خطأ في تسجيل الحضور:", error);
    res.status(500).json({
      error: "فشل تسجيل الحضور",
      details: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

app.delete("/api/attendance/:id", async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    await connection.beginTransaction();

    const attendanceId = req.params.id;

    // حذف سجل الحضور
    await connection.execute("DELETE FROM attendance WHERE id = ?", [
      attendanceId,
    ]);

    await connection.commit();
    res.json({
      message: "تم حذف سجل الحضور بنجاح",
      success: true,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("خطأ في حذف سجل الحضور:", error);
    res.status(500).json({
      error: "فشل حذف سجل الحضور",
      details: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// 8. نقاط نهاية التقارير
app.get("/api/reports/student/:id", async (req, res) => {
  try {
    const studentId = req.params.id;

    // جلب معلومات الطالب
    const [student] = await executeQuery(
      `
      SELECT 
        s.id,
        CONCAT(s.first_name, ' ', s.last_name) AS name,
        s.id AS idNumber,
        c.name AS grade,
        sec.name AS section,
        s.parent_phone AS phone,
        s.parent_email AS email,
        s.admission_date AS createdAt
      FROM students s
      JOIN sections sec ON s.section_id = sec.id
      JOIN classes c ON sec.class_id = c.id
      WHERE s.id = ?
    `,
      [studentId]
    );

    if (!student) {
      return res.status(404).json({
        error: "الطالب غير موجود",
        studentId,
      });
    }

    // جلب بيانات الحضور
    const attendance = await executeQuery(
      `
      SELECT 
        date,
        status
      FROM attendance
      WHERE student_id = ?
      ORDER BY date DESC
      LIMIT 30
    `,
      [studentId]
    );

    // حساب نسبة الحضور
    const totalDays = attendance.length;
    const presentDays = attendance.filter((a) => a.status === "حاضر").length;
    const attendanceRate =
      totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    // جلب بيانات الرسوم
    const fees = await executeQuery(
      `
      SELECT 
        p.payment_date AS date,
        ft.name AS type,
        p.amount,
        p.payment_method AS method
      FROM payments p
      JOIN fee_types ft ON p.fee_type_id = ft.id
      WHERE p.student_id = ?
      ORDER BY p.payment_date DESC
    `,
      [studentId]
    );

    // حساب الإجماليات المالية
    const totalFeesResult = await executeQuery(
      `
      SELECT 
        SUM(ft.amount) AS total
      FROM fee_types ft
      WHERE ft.class_id = (
        SELECT section_id FROM students WHERE id = ?
      )
    `,
      [studentId]
    );

    const totalFees = totalFeesResult[0]?.total || 0;
    const paidAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const pendingFees = totalFees - paidAmount;
    const financialStatus = pendingFees <= 0 ? "مسدد" : "متأخر";

    res.json({
      student: {
        ...student,
        gradeSection: `${student.grade} - ${student.section}`,
      },
      attendance,
      attendanceRate,
      fees,
      totalFees,
      paidAmount,
      pendingFees,
      financialStatus,
    });
  } catch (error) {
    console.error("خطأ في جلب تقرير الطالب:", error);
    res.status(500).json({
      error: "فشل جلب تقرير الطالب",
      details: error.message,
    });
  }
});

// التعامل مع المسارات غير المعرفة
app.use((req, res) => {
  res.status(404).json({
    error: "المسار غير موجود",
    path: req.path,
  });
});

// معالجة الأخطاء العامة
app.use((err, req, res, next) => {
  console.error("خطأ غير متوقع:", err);
  res.status(500).json({
    error: "حدث خطأ داخلي في الخادم",
    details: err.message,
  });
});

// بدء الخادم
app.listen(PORT, () => {
  console.log(`الخادم يعمل على http://localhost:${PORT}`);
  console.log("الاتصال بقاعدة البيانات: school_management");
});
