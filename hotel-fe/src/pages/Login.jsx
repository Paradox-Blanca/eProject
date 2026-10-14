import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

export default function Login() {
  const nav = useNavigate();
  const [show, setShow] = useState(false);
  return (
    <AuthLayout title="Đăng nhập" subtitle="Nhập tài khoản để tiếp tục">
      <form onSubmit={(e) => { e.preventDefault(); nav('/profile'); }}>
        <label>Email hoặc số điện thoại
          <input required placeholder="khach@email.com" />
        </label>
        <label>Mật khẩu
          <div className="pw">
            <input required type={show ? 'text' : 'password'} placeholder="Nhập mật khẩu" />
            <button type="button" className="link" onClick={() => setShow(!show)}>{show ? 'Ẩn' : 'Hiện'}</button>
          </div>
        </label>
        <div className="row">
          <label className="check"><input type="checkbox" /> Ghi nhớ đăng nhập</label>
          <Link to="/forgot-password">Quên mật khẩu?</Link>
        </div>
        <button className="btn">Đăng nhập</button>
      </form>
      <p className="foot">Chưa có tài khoản? <Link to="/register">Đăng ký</Link></p>
    </AuthLayout>
  );
}
