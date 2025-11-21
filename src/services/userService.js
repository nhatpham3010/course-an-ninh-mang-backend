/**
 * User Service
 * Handles user-related business logic
 */
import pool from "../config/db.js";

/**
 * Format relative time
 */
const formatRelative = (date) => {
  if (!date) return null;
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1 ngày trước";
  return `${diffDays} ngày trước`;
};

/**
 * Get user dashboard
 */
export const getUserDashboard = async (userId) => {
  // Stats
  const qKhoa = await pool.query(
    `SELECT COUNT(*) AS cnt FROM user_khoahoc WHERE user_id = $1 AND trangthai = 'in-progress'`,
    [userId]
  );
  const qModules = await pool.query(
    `SELECT COUNT(*) AS cnt FROM user_baihoc WHERE user_id = $1 AND hoanthanh_baihoc = true`,
    [userId]
  );
  const qLabs = await pool.query(
    `SELECT COUNT(*) AS cnt FROM lab_user WHERE user_id = $1 AND tiendo >= 100`,
    [userId]
  );
  const qCerts = await pool.query(
    `SELECT COUNT(*) AS cnt FROM user_baikiemtra WHERE user_id = $1 AND trangthai = 'completed'`,
    [userId]
  );

  const stats = [
    {
      title: "Khóa học đang học",
      value: parseInt(qKhoa.rows[0]?.cnt || "0"),
    },
    {
      title: "Module hoàn thành",
      value: parseInt(qModules.rows[0]?.cnt || "0"),
    },
    { title: "Lab hoàn thành", value: parseInt(qLabs.rows[0]?.cnt || "0") },
    {
      title: "Chứng chỉ đã nhận",
      value: parseInt(qCerts.rows[0]?.cnt || "0"),
    },
  ];

  // Learning Progress
  const coursesRes = await pool.query(
    `SELECT kh.id, kh.ten
     FROM khoahoc kh
     JOIN user_khoahoc uk ON uk.khoahoc_id = kh.id
     WHERE uk.user_id = $1`,
    [userId]
  );

  const learningProgress = [];
  for (const row of coursesRes.rows) {
    const courseId = row.id;

    const totalModulesRes = await pool.query(
      `SELECT COUNT(*) AS total FROM baihoc WHERE id_khoahoc = $1`,
      [courseId]
    );
    const totalModules = parseInt(totalModulesRes.rows[0]?.total || "0", 10);

    const completedModulesRes = await pool.query(
      `SELECT COUNT(*) AS done
       FROM user_baihoc ub
       JOIN baihoc b ON ub.baihoc_id = b.id
       WHERE ub.user_id = $1 AND b.id_khoahoc = $2 AND ub.hoanthanh_baihoc = true`,
      [userId, courseId]
    );
    const completedModules = parseInt(completedModulesRes.rows[0]?.done || "0", 10);

    const lastTestRes = await pool.query(
      `SELECT MAX(ub.ngayhoanthanh) AS last_date
       FROM user_baikiemtra ub
       JOIN baikiemtra bk ON ub.baikiemtra_id = bk.id
       JOIN khoahoc kh ON kh.id_baikiemtra = bk.id
       WHERE ub.user_id = $1 AND kh.id = $2`,
      [userId, courseId]
    );

    const lastDate = lastTestRes.rows[0]?.last_date || null;
    const lastAccess = lastDate
      ? `Lần cuối: ${formatRelative(lastDate)}`
      : "Lần cuối: -";

    const progressPercent =
      totalModules > 0
        ? Math.round((completedModules / totalModules) * 100)
        : 0;

    learningProgress.push({
      title: row.ten,
      progress: progressPercent,
      modules: `${completedModules}/${totalModules} modules`,
      lastAccess,
    });
  }

  // Recent Activities
  const testsRes = await pool.query(
    `SELECT ub.ngayhoanthanh, ub.diemso, bk.ten AS baikiemtra_ten
     FROM user_baikiemtra ub
     JOIN baikiemtra bk ON ub.baikiemtra_id = bk.id
     WHERE ub.user_id = $1 AND ub.trangthai = 'completed' AND ub.ngayhoanthanh IS NOT NULL
     ORDER BY ub.ngayhoanthanh DESC
     LIMIT 5`,
    [userId]
  );

  const testsActivities = testsRes.rows.map((r) => ({
    ts: r.ngayhoanthanh,
    title: `Hoàn thành: ${r.baikiemtra_ten}`,
    time: formatRelative(r.ngayhoanthanh),
    points: r.diemso != null ? `+${r.diemso} điểm` : null,
  }));

  const hoidapRes = await pool.query(
    `SELECT h.thoigian, h.cauhoi
     FROM hoidapai h
     JOIN chudeai c ON h.id_chudeai = c.id
     WHERE c.userid = $1
     ORDER BY h.thoigian DESC
     LIMIT 5`,
    [userId]
  );

  const hoidapActivities = hoidapRes.rows.map((r) => ({
    ts: r.thoigian,
    title: `Hỏi: ${r.cauhoi}`,
    time: formatRelative(r.thoigian),
    points: null,
  }));

  const merged = [...testsActivities, ...hoidapActivities];
  merged.sort((a, b) => new Date(b.ts) - new Date(a.ts));
  const recentActivities = merged.slice(0, 5).map((r) => ({
    title: r.title,
    time: r.time,
    points: r.points || "",
  }));

  const actionCards = [
    {
      title: "Khóa học",
      subtitle: "Xem thông tin từng khóa học",
      link: "/user/courses",
    },
    {
      title: "Thực hành Lab",
      subtitle: "Luyện tập với bài lab thực tế",
      link: "/user/labs",
    },
    {
      title: "Thử thách CTF",
      subtitle: "Tham gia các cuộc thi CTF",
      link: "/user/ctf",
    },
  ];

  // Get user info including role (package) and course_type
  const userRes = await pool.query(
    `SELECT id, ten, email, ngaysinh, role, course_type FROM users WHERE id = $1`,
    [userId]
  );
  const user = userRes.rows[0] || {};

  // Map course_type to package name
  const courseTypeToPackage = {
    free: null,
    basic: "Gói Cơ Bản",
    premium: "Gói Nâng Cao",
    year: "Gói Năm",
  };
  const currentPackage = courseTypeToPackage[user.course_type] || null;

  // Get user courses with details
  const userCoursesRes = await pool.query(
    `SELECT 
      kh.id,
      kh.ten,
      kh.mota,
      kh.thoiluong,
      kh.danhgia,
      uk.trangthai,
      (SELECT COUNT(*) FROM baihoc WHERE id_khoahoc = kh.id) AS total_lessons,
      (SELECT COUNT(*) 
       FROM user_baihoc ub
       JOIN baihoc b ON ub.baihoc_id = b.id
       WHERE ub.user_id = $1 AND b.id_khoahoc = kh.id AND ub.hoanthanh_baihoc = true
      ) AS completed_lessons
     FROM khoahoc kh
     JOIN user_khoahoc uk ON uk.khoahoc_id = kh.id
     WHERE uk.user_id = $1
     ORDER BY uk.trangthai DESC, kh.ten ASC`,
    [userId]
  );

  const courses = userCoursesRes.rows.map((c) => ({
    id: c.id,
    ten: c.ten,
    mota: c.mota,
    thoiluong: c.thoiluong,
    danhgia: c.danhgia ? parseFloat(c.danhgia) / 10 : null,
    trangthai: c.trangthai,
    total_lessons: parseInt(c.total_lessons || "0"),
    completed_lessons: parseInt(c.completed_lessons || "0"),
    progress: c.total_lessons > 0 
      ? Math.round((parseInt(c.completed_lessons || "0") / parseInt(c.total_lessons)) * 100)
      : 0,
  }));

  // Get payment history
  const paymentsRes = await pool.query(
    `SELECT 
      id, ho_ten, email, so_dien_thoai, phuong_thuc_thanh_toan,
      ten_goi, so_tien, ngay_thanh_toan, trang_thai, hinh_anh_chung_minh
     FROM thanhtoan
     WHERE user_id = $1
     ORDER BY ngay_thanh_toan DESC
     LIMIT 10`,
    [userId]
  );

  const payments = paymentsRes.rows.map((p) => ({
    id: p.id,
    ho_ten: p.ho_ten,
    email: p.email,
    so_dien_thoai: p.so_dien_thoai,
    phuong_thuc_thanh_toan: p.phuong_thuc_thanh_toan,
    ten_goi: p.ten_goi,
    so_tien: parseFloat(p.so_tien),
    ngay_thanh_toan: p.ngay_thanh_toan,
    trang_thai: p.trang_thai,
    hinh_anh_chung_minh: p.hinh_anh_chung_minh,
  }));

  return {
    stats,
    learningProgress,
    recentActivities,
    actionCards,
    userInfo: {
      id: user.id,
      ten: user.ten,
      email: user.email,
      ngaysinh: user.ngaysinh,
      role: user.role,
      course_type: user.course_type || "free",
      currentPackage: currentPackage,
      courses: courses,
    },
    payments: payments,
  };
};

/**
 * Get admin dashboard
 */
export const getAdminDashboard = async () => {
  const query = `
    WITH user_stats AS (
      SELECT 
        COUNT(*) AS total_users,
        COUNT(*) FILTER (WHERE DATE(ngaysinh) = CURRENT_DATE) AS today_registrations
      FROM users
    ),
    content_stats AS (
      SELECT 
        (COUNT(kh.id) + COUNT(bh.id)) AS total_content,
        23 AS pending_content
      FROM khoahoc kh
      LEFT JOIN baihoc bh ON bh.id_khoahoc = kh.id
    ),
    certificate_stats AS (
      SELECT 
        6 AS total_certificates,
        12 AS recent_certificates
    ),
    revenue_stats AS (
      SELECT 
        COALESCE(SUM(so_tien), 0)::TEXT AS total_revenue,
        ROUND(
          (COUNT(*) FILTER (WHERE trang_thai = 'completed')::DECIMAL / GREATEST((SELECT COUNT(*) FROM users), 1) * 100), 
          2
        )::TEXT || '%' AS conversion_rate
      FROM thanhtoan
      WHERE trang_thai = 'completed'
    ),
    stats_data AS (
      SELECT 1 AS id, 'Tổng người dùng' AS title, us.total_users::TEXT AS value,
             us.today_registrations || ' đăng ký hôm nay' AS subtitle, '+12%' AS trend,
             'Users' AS icon, 'blue' AS color
      FROM user_stats us
      UNION ALL
      SELECT 2, 'Nội dung', cs.total_content::TEXT, cs.pending_content || ' chờ duyệt',
             '+5%', 'BookOpen', 'red' FROM content_stats cs
      UNION ALL
      SELECT 3, 'Chứng chỉ', ccs.total_certificates::TEXT,
             ccs.recent_certificates || ' ngày vừa qua', '+100%', 'Award', 'yellow'
      FROM certificate_stats ccs
      UNION ALL
      SELECT 4, 'Doanh thu', rvs.total_revenue,
             'Tỷ lệ chuyển đổi: ' || rvs.conversion_rate, '+N/A%', 'TrendingUp', 'green'
      FROM revenue_stats rvs
    ),
    action_cards AS (
      SELECT 1 AS id, 'Duyệt nội dung' AS title, cs.pending_content || ' nội dung chờ duyệt' AS subtitle,
             'Xem ngay' AS button, 'blue' AS color, 'Eye' AS icon
      FROM content_stats cs
      UNION ALL
      SELECT 2, 'Kiểm tra chứng chỉ', '12 chứng chỉ được cấp cho học viên',
             'Kiểm tra', 'orange', 'Shield'
      FROM certificate_stats
      UNION ALL
      SELECT 3, 'Tạo báo cáo', 'Xuất báo cáo hệ thống',
             'Tạo báo cáo', 'purple', 'Download'
      FROM certificate_stats
    )
    SELECT 
      (SELECT json_agg(
        json_build_object(
          'title', s.title,
          'value', s.value,
          'subtitle', s.subtitle,
          'trend', s.trend,
          'icon', s.icon,
          'color', s.color
        )
      ) FROM stats_data s) AS stats,
      json_build_array(
        json_build_object('name','CPU Usage','value','52%','icon','Cpu','color','green'),
        json_build_object('name','Memory','value','35%','icon','HardDrive','color','yellow'),
        json_build_object('name','Storage','value','61%','icon','Database','color','green'),
        json_build_object('name','Network','value','89%','icon','Wifi','color','green'),
        json_build_object('name','Database','value','34%','icon','Server','color','green'),
        json_build_object('name','API Response','value','156ms','icon','Zap','color','green')
      ) AS systemMetrics,
      json_build_array(
        json_build_object('title','Phát hiện nhiều lần đăng nhập thất bại từ IP 192.168.1.100','time','2 phút trước','user','System','priority','HIGH','type','error'),
        json_build_object('title','Khóa học "Advanced SQL Injection" bị báo cáo vi phạm nội dung','time','5 phút trước','user','nhatphamyt@gmail.com','priority','HIGH','type','error'),
        json_build_object('title','Người dùng buiminhhieu123@gmail.com bị tạm khóa do vi phạm điều khoản','time','15 phút trước','user','admin','priority','MEDIUM','type','warning'),
        json_build_object('title','Series "Web Security Basics" đã được duyệt và xuất bản','time','1 giờ trước','user','QuanTQ','priority','LOW','type','success')
      ) AS recentActivities,
      (SELECT json_agg(
        json_build_object(
          'title', a.title,
          'subtitle', a.subtitle,
          'button', a.button,
          'color', a.color,
          'icon', a.icon
        )
      ) FROM action_cards a) AS actionCards;
  `;

  const result = await pool.query(query);
  return result.rows[0];
};

