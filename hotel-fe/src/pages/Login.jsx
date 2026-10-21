import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Login.css';

const STORAGE_KEYS = {
  USER: 'grand_hotel_current_user_v2',
  ACTIVE_STAFF_ID: 'grand_hotel_active_staff_id_v2',
  STAFF_USERS: 'grand_hotel_staff_users_v2',
};

function isSafeInternalPath(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');
}

const DEFAULT_CCCD_FRONT = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
const DEFAULT_CCCD_BACK = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';

// Danh sách nhân sự mặc định đối chiếu
const SYSTEM_STAFF_ACCOUNTS = [
  { id: 'NV-001', username: 'admin', name: 'Hoàng Minh Quân', email: 'quan.hoang@grandhotel.vn', phone: '0903111222', roleId: 'admin', roleTitle: 'Tổng Quản Lý / Admin' },
  { id: 'NV-002', username: 'manager', name: 'Nguyễn Thu Thảo', email: 'thao.nguyen@grandhotel.vn', phone: '0918333444', roleId: 'manager', roleTitle: 'Quản Lý Lễ Tân' },
  { id: 'NV-003', username: 'receptionist', name: 'Lê Hoàng Nam', email: 'nam.le@grandhotel.vn', phone: '0982555666', roleId: 'receptionist', roleTitle: 'Nhân Viên Lễ Tân' },
  { id: 'NV-004', username: 'cashier', name: 'Phạm Đăng Khoa', email: 'khoa.pham@grandhotel.vn', phone: '0945888999', roleId: 'cashier', roleTitle: 'Thu Ngân / Thủ Quỹ' },
  { id: 'NV-005', username: 'housekeeping', name: 'Trần Thị Lan', email: 'lan.tran@grandhotel.vn', phone: '0937777888', roleId: 'housekeeping', roleTitle: 'Quản Lý Buồng Phòng' },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // Đọc tham số chuyển hướng (redirect query)
  const queryParams = new URLSearchParams(location.search);
  const redirectTarget = queryParams.get('redirect') || location.state?.from?.pathname;

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [showDemoModal, setShowDemoModal] = useState(false);

  // Countdown timer cho Brute-Force lockout
  useEffect(() => {
    let timer;
    if (lockoutTimer > 0) {
      timer = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTimer]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    setErrorMsg('');
    const cleanId = identifier.trim().toLowerCase();
    const cleanPw = password.trim();

    if (!cleanId || !cleanPw) {
      setErrorMsg('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setLoading(true);

    // Mô phỏng độ trễ xác thực mạng và băm bảo mật
    setTimeout(() => {
      // 1. Kiểm tra trong danh sách nhân viên
      const savedStaff = localStorage.getItem(STORAGE_KEYS.STAFF_USERS);
      let staffList = SYSTEM_STAFF_ACCOUNTS;
      if (savedStaff) {
        try {
          staffList = JSON.parse(savedStaff);
        } catch {
          localStorage.removeItem(STORAGE_KEYS.STAFF_USERS);
        }
      }

      const matchedStaff = staffList.find((s) => {
        const uname = s.username ? s.username.toLowerCase() : '';
        const email = s.email ? s.email.toLowerCase() : '';
        const phone = s.phone ? s.phone.replace(/\s+/g, '') : '';
        const id = s.id ? s.id.toLowerCase() : '';
        return cleanId === uname || cleanId === email || cleanId === phone || cleanId === id;
      }) || SYSTEM_STAFF_ACCOUNTS.find((s) => s.username === cleanId || s.email.toLowerCase() === cleanId);

      if (matchedStaff && matchedStaff.status !== 'locked') {
        // Kiểm tra mật khẩu (chuẩn demo: 123456)
        if (cleanPw === '123456') {
          const staffUser = {
            id: matchedStaff.id,
            username: matchedStaff.username || matchedStaff.id,
            name: matchedStaff.name,
            email: matchedStaff.email,
            role: 'staff',
            roleId: matchedStaff.roleId,
            avatar: matchedStaff.name ? matchedStaff.name.charAt(0) : 'S',
            loginAt: new Date().toISOString()
          };

          localStorage.removeItem(STORAGE_KEYS.USER);
          sessionStorage.removeItem(STORAGE_KEYS.USER);
          (rememberMe ? localStorage : sessionStorage).setItem(STORAGE_KEYS.USER, JSON.stringify(staffUser));
          localStorage.setItem(STORAGE_KEYS.ACTIVE_STAFF_ID, matchedStaff.id);
          setLoading(false);

          // Điều hướng vào Admin hoặc trang đích yêu cầu trước đó
          navigate(isSafeInternalPath(redirectTarget) && redirectTarget.startsWith('/admin') ? redirectTarget : '/admin');
          return;
        }
      }

      // 2. Kiểm tra trong tài khoản khách hàng
      const isCustomerMatch = (
        cleanId === 'khachhang' ||
        cleanId === 'an.nguyen@email.com' ||
        cleanId === '0901234567' ||
        cleanId === '079095001234'
      );

      if (isCustomerMatch) {
        if (cleanPw === '123456') {
          const customerUser = {
            username: 'khachhang',
            name: 'NGUYỄN VĂN AN',
            phone: '0901234567',
            email: 'an.nguyen@email.com',
            dob: '1995-05-15',
            gender: 'Nam',
            address: 'Quận 1, TP. Hồ Chí Minh',
            cccd: '079095001234',
            cccdDate: '2021-08-20',
            cccdPlace: 'Cục CSQLHC về TTXH',
            cccdFront: DEFAULT_CCCD_FRONT,
            cccdBack: DEFAULT_CCCD_BACK,
            role: 'customer',
            avatar: 'A',
            loginAt: new Date().toISOString()
          };

          localStorage.removeItem(STORAGE_KEYS.USER);
          sessionStorage.removeItem(STORAGE_KEYS.USER);
          (rememberMe ? localStorage : sessionStorage).setItem(STORAGE_KEYS.USER, JSON.stringify(customerUser));
          setLoading(false);

          // Điều hướng về trang chủ hoặc trang người dùng yêu cầu (ngoại trừ /admin)
          if (isSafeInternalPath(redirectTarget) && !redirectTarget.startsWith('/admin')) {
            navigate(redirectTarget);
          } else {
            navigate('/');
          }
          return;
        }
      }

      // 3. Xử lý khi xác thực thất bại
      setLoading(false);
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= 5) {
        setLockoutTimer(30);
        setErrorMsg('Phát hiện nhiều lần đăng nhập không thành công. Nhằm bảo vệ an toàn, hệ thống tạm khóa đăng nhập trong 30 giây.');
      } else {
        setErrorMsg(`Thông tin đăng nhập hoặc mật khẩu không chính xác (Đã thử: ${newAttempts}/5). Vui lòng thử lại.`);
      }
    }, 450);
  };

  const handleQuickFill = (testUser, testPass) => {
    setIdentifier(testUser);
    setPassword(testPass);
    setErrorMsg('');
    setShowDemoModal(false);
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card-container">
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="login-brand-logo">
            <i className="fa-solid fa-hotel"></i>
          </div>
          <h1 className="login-brand-title">Grand Hotel & Resorts</h1>
          <p className="login-brand-subtitle">Hệ Thống Đăng Nhập & Quản Lý Tập Trung</p>
          <div className="login-security-tag">
            <i className="fa-solid fa-shield-halved"></i> Xác thực bảo mật chuẩn RBAC
          </div>
        </div>

        {/* Thông báo điều hướng bảo vệ Route */}
        {redirectTarget && (
          <div className="login-alert-banner" style={{ background: 'rgba(212, 175, 55, 0.1)', borderColor: 'rgba(212, 175, 55, 0.4)', color: '#f6e6b4' }}>
            <i className="fa-solid fa-lock" style={{ color: '#d4af37' }}></i>
            <div>Khu vực yêu cầu đăng nhập với quyền phù hợp để tiếp tục.</div>
          </div>
        )}

        {/* Thông báo lỗi đăng nhập */}
        {errorMsg && (
          <div className="login-alert-banner">
            <i className="fa-solid fa-circle-exclamation"></i>
            <div>{errorMsg}</div>
          </div>
        )}

        {/* Form Đăng Nhập Nghiệp Vụ Chuẩn */}
        <form onSubmit={handleLogin}>
          <div className="login-form-group">
            <label className="login-form-label">Tên đăng nhập / Email / SĐT / CCCD</label>
            <div className="login-input-wrapper">
              <i className="fa-regular fa-user login-input-icon"></i>
              <input
                type="text"
                className="login-input"
                placeholder="Nhập tài khoản đăng nhập..."
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading || lockoutTimer > 0}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="login-form-group">
            <label className="login-form-label">Mật khẩu</label>
            <div className="login-input-wrapper">
              <i className="fa-solid fa-lock login-input-icon"></i>
              <input
                type={showPassword ? 'text' : 'password'}
                className="login-input"
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || lockoutTimer > 0}
                required
              />
              <button
                type="button"
                className="login-pw-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                <i className={showPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'}></i>
              </button>
            </div>
          </div>

          <div className="login-options-row">
            <label className="login-remember-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Ghi nhớ đăng nhập
            </label>
            <Link to="/forgot-password" className="login-forgot-link">
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={loading || lockoutTimer > 0}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Đang xác thực hệ thống...
              </>
            ) : lockoutTimer > 0 ? (
              <>
                <i className="fa-solid fa-clock"></i> Khóa thử lại ({lockoutTimer}s)
              </>
            ) : (
              <>
                <i className="fa-solid fa-right-to-bracket"></i> Đăng Nhập Vào Hệ Thống
              </>
            )}
          </button>
        </form>

        {/* Demo Helper Sheet Drawer Trigger (Dành riêng cho tester/giám khảo kiểm thử) */}
        <div className="login-demo-helper-bar">
          <button
            type="button"
            className="login-demo-trigger-btn"
            onClick={() => setShowDemoModal(true)}
          >
            <i className="fa-solid fa-circle-question"></i> Bảng Danh Mục Tài Khoản Thử Nghiệm
          </button>
        </div>

        {/* Footer */}
        <div className="login-card-footer">
          <div>
            Chưa có tài khoản?{' '}
            <Link to="/register" className="login-footer-link">
              Đăng ký khách hàng mới
            </Link>
          </div>
          <Link to="/" className="login-back-home">
            <i className="fa-solid fa-arrow-left"></i> Quay lại Cổng Khách Hàng (Trang Chủ)
          </Link>
        </div>
      </div>

      {/* Modal Hướng Dẫn Tài Khoản Thử Nghiệm Chuẩn Chuyên Nghiệp */}
      {showDemoModal && (
        <div className="demo-modal-backdrop" onClick={() => setShowDemoModal(false)}>
          <div className="demo-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="demo-modal-header">
              <h3>
                <i className="fa-solid fa-id-badge" style={{ color: '#d4af37' }}></i>
                Danh Mục Tài Khoản Kiểm Thử Nghiệp Vụ
              </h3>
              <button
                type="button"
                className="demo-modal-close"
                onClick={() => setShowDemoModal(false)}
              >
                &times;
              </button>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0 0 16px' }}>
              Bấm nút <strong>"Điền vào Form"</strong> để tự động nạp thông tin vào form, sau đó bấm <strong>"Đăng Nhập"</strong> để hệ thống thực thi xác thực chuẩn.
            </p>
            <table className="demo-table">
              <thead>
                <tr>
                  <th>Vai Trò Nghiệp Vụ</th>
                  <th>Tài Khoản / Email</th>
                  <th>Mật Khẩu</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {SYSTEM_STAFF_ACCOUNTS.map((staff) => (
                  <tr key={staff.id}>
                    <td>
                      <strong style={{ color: '#f6e6b4' }}>{staff.roleTitle}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{staff.name}</div>
                    </td>
                    <td>
                      <code>{staff.username}</code>
                    </td>
                    <td><code>123456</code></td>
                    <td>
                      <button
                        type="button"
                        className="demo-fill-btn"
                        onClick={() => handleQuickFill(staff.username, '123456')}
                      >
                        Điền vào Form
                      </button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td>
                    <strong style={{ color: '#6ee7b7' }}>Khách Hàng (Customer)</strong>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Nguyễn Văn An</div>
                  </td>
                  <td><code>khachhang</code></td>
                  <td><code>123456</code></td>
                  <td>
                    <button
                      type="button"
                      className="demo-fill-btn"
                      onClick={() => handleQuickFill('khachhang', '123456')}
                    >
                      Điền vào Form
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
