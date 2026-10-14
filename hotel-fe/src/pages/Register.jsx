import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import OtpInput from '../components/OtpInput';

export default function Register() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [via, setVia] = useState({ email: true, phone: false });
  const [err, setErr] = useState('');
  const toggle = (k) => setVia((v) => ({ ...v, [k]: !v[k] }));

  if (step === 2)
    return (
      <AuthLayout title="Xác thực OTP" subtitle="Nhập mã 6 số vừa gửi tới email hoặc số điện thoại của bạn">
        <OtpInput />
        <button className="btn" onClick={() => nav('/login')}>Xác nhận</button>
        <p className="foot">Chưa nhận được mã? <button className="link">Gửi lại mã</button></p>
      </AuthLayout>
    );

  return (
    <AuthLayout title="Đăng ký tài khoản" subtitle="Tạo tài khoản mới và xác thực bằng mã OTP">
      <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.target); if (f.get('pw') !== f.get('pw2')) return setErr('Mật khẩu nhập lại không khớp'); setErr(''); setStep(2); }}>
        <label>Họ và tên<input required /></label>
        <fieldset>
          <legend>Nhận mã OTP qua (chọn 1 hoặc cả 2)</legend>
          <label className="check"><input type="checkbox" checked={via.email} onChange={() => toggle('email')} /> Email</label>
          <label className="check"><input type="checkbox" checked={via.phone} onChange={() => toggle('phone')} /> Số điện thoại</label>
        </fieldset>
        {via.email && <label>Email<input type="email" required /></label>}
        {via.phone && <label>Số điện thoại<input type="tel" required /></label>}
        <label>Mật khẩu<input name="pw" type="password" required minLength={6} /></label>
        <label>Nhập lại mật khẩu<input name="pw2" type="password" required /></label>
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn" disabled={!via.email && !via.phone}>Gửi mã OTP</button>
      </form>
      <p className="foot">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
    </AuthLayout>
  );
}
