import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import OtpInput from '../components/OtpInput';

export default function ForgotPassword() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [err, setErr] = useState('');
  const next = (e) => {
    e.preventDefault();
    if (step === 3) {
      const f = new FormData(e.target);
      if (f.get('pw') !== f.get('pw2')) return setErr('Mật khẩu nhập lại không khớp');
      return nav('/login');
    }
    setStep(step + 1);
  };
  const text = [
    ['Quên mật khẩu', 'Nhập email hoặc số điện thoại đã đăng ký để nhận mã OTP'],
    ['Nhập mã OTP', 'Mã 6 số đã được gửi cho bạn'],
    ['Đặt mật khẩu mới', 'Mật khẩu mới cần từ 6 ký tự trở lên'],
  ][step - 1];
  return (
    <AuthLayout title={text[0]} subtitle={text[1]}>
      <form onSubmit={next}>
        {step === 1 && <label>Email hoặc số điện thoại<input required /></label>}
        {step === 2 && <OtpInput />}
        {step === 3 && (<>
          <label>Mật khẩu mới<input name="pw" type="password" required minLength={6} /></label>
          <label>Nhập lại mật khẩu mới<input name="pw2" type="password" required /></label>
          {err && <p className="err" role="alert">{err}</p>}
        </>)}
        <button className="btn">{['Gửi mã OTP', 'Xác nhận mã', 'Đổi mật khẩu'][step - 1]}</button>
      </form>
      <p className="foot"><Link to="/login">Quay lại đăng nhập</Link></p>
    </AuthLayout>
  );
}
