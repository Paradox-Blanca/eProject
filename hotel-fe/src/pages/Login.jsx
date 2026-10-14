import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

const STORAGE_KEYS = {
  USER: 'grand_hotel_current_user_v2',
  ACTIVE_STAFF_ID: 'grand_hotel_active_staff_id_v2'
};

const DEFAULT_CCCD_FRONT = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
const DEFAULT_CCCD_BACK = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';

export default function Login() {
  const nav = useNavigate();
  const [show, setShow] = useState(false);
  const [role, setRole] = useState('staff');
  // Tài khoản mặc định: admin, mật khẩu: 123456
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (role === 'staff' || username.toLowerCase() === 'admin') {
      const staffUser = {
        username: 'admin',
        name: 'Hoàng Minh Quân (Admin)',
        role: 'staff',
        avatar: 'A'
      };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(staffUser));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_STAFF_ID, 'NV-001');
      nav('/admin');
    } else {
      const customerUser = {
        username: username,
        name: 'NGUYỄN VĂN AN',
        phone: '0901234567',
        email: username.includes('@') ? username : 'an.nguyen@email.com',
        dob: '1995-05-15',
        gender: 'Nam',
        address: 'Quận 1, TP. Hồ Chí Minh',
        cccd: '079095001234',
        cccdDate: '2021-08-20',
        cccdPlace: 'Cục CSQLHC về TTXH',
        cccdFront: DEFAULT_CCCD_FRONT,
        cccdBack: DEFAULT_CCCD_BACK,
        role: 'customer',
        avatar: 'A'
      };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(customerUser));
      nav('/');
    }
  };

  const handleQuickLoginAdmin = () => {
    const staffUser = {
      username: 'admin',
      name: 'Hoàng Minh Quân (Admin)',
      role: 'staff',
      avatar: 'A'
    };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(staffUser));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_STAFF_ID, 'NV-001');
    nav('/admin');
  };

  const handleQuickLoginCustomer = () => {
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
      avatar: 'A'
    };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(customerUser));
    nav('/');
  };

  return (
    <AuthLayout title="Đăng nhập Grand Hotel" subtitle="Nhập tài khoản để tiếp tục vào hệ thống">
      {/* Box gợi ý tài khoản mặc định */}
      <div style={{
        background: 'rgba(212, 175, 55, 0.1)',
        border: '1.5px dashed #d4af37',
        borderRadius: '8px',
        padding: '10px 14px',
        marginBottom: '16px',
        fontSize: '0.86rem',
        color: '#0f172a'
      }}>
        <div style={{ fontWeight: 700, color: '#b38e22', marginBottom: '2px' }}>
          <i className="fa-solid fa-key" style={{ marginRight: '6px' }}></i>
          Tài khoản mặc định hệ thống:
        </div>
        <div>Tài khoản: <strong style={{ color: '#0f172a' }}>admin</strong> &nbsp;|&nbsp; Mật khẩu: <strong style={{ color: '#0f172a' }}>123456</strong></div>
      </div>

      <form onSubmit={handleLoginSubmit}>
        <label>Đăng nhập với vai trò:
          <select 
            value={role} 
            onChange={e => {
              const r = e.target.value;
              setRole(r);
              if (r === 'staff') {
                setUsername('admin');
                setPassword('123456');
              } else {
                setUsername('khachhang');
                setPassword('123456');
              }
            }}
          >
            <option value="staff">Nhân Viên / Quản Trị Viên (Admin Dashboard)</option>
            <option value="customer">Khách Hàng (Đặt phòng & Định danh CCCD)</option>
          </select>
        </label>

        <label>Tên đăng nhập / Email / Số CCCD
          <input 
            required 
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Nhập tài khoản đăng nhập" 
          />
        </label>

        <label>Mật khẩu
          <div className="pw">
            <input 
              required 
              type={show ? 'text' : 'password'} 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu" 
            />
            <button type="button" className="link" onClick={() => setShow(!show)}>
              {show ? 'Ẩn' : 'Hiện'}
            </button>
          </div>
        </label>

        <div className="row">
          <label className="check"><input type="checkbox" defaultChecked /> Ghi nhớ đăng nhập</label>
          <Link to="/forgot-password">Quên mật khẩu?</Link>
        </div>

        <button className="btn" type="submit">
          <i className="fa-solid fa-right-to-bracket" style={{ marginRight: '6px' }}></i>
          {role === 'staff' ? 'Đăng Nhập Vào Admin Dashboard' : 'Đăng Nhập Khách Hàng'}
        </button>
      </form>

      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed #dbe2ea', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button 
          type="button" 
          className="btn" 
          style={{ background: 'linear-gradient(135deg, #d4af37 0%, #aa8214 100%)', color: '#0b111e', fontWeight: 700 }}
          onClick={handleQuickLoginAdmin}
        >
          <i className="fa-solid fa-crown" style={{ marginRight: '6px' }}></i>
          Vào Nhanh: Quản Trị Viên (admin / 123456)
        </button>
        <button 
          type="button" 
          className="btn ghost" 
          onClick={handleQuickLoginCustomer}
        >
          <i className="fa-solid fa-user-check" style={{ marginRight: '6px' }}></i>
          Vào Nhanh: Khách Hàng VIP
        </button>
      </div>

      <p className="foot">
        Chưa có tài khoản? <Link to="/register">Đăng ký thành viên kèm CCCD</Link>
      </p>
      <p className="foot" style={{ marginTop: '8px' }}>
        <Link to="/"><i className="fa-solid fa-arrow-left" style={{ marginRight: '4px' }}></i> Quay về Trang Chủ (Landing Page)</Link>
      </p>
    </AuthLayout>
  );
}
