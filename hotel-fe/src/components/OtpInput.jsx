import { useRef } from 'react';

export default function OtpInput({ length = 6 }) {
  const refs = useRef([]);
  const onChange = (e, i) => {
    const v = e.target.value.replace(/\D/g, '').slice(-1);
    e.target.value = v;
    if (v && i < length - 1) refs.current[i + 1].focus();
  };
  const onKey = (e, i) => {
    if (e.key === 'Backspace' && !e.target.value && i > 0) refs.current[i - 1].focus();
  };
  return (
    <div className="otp">
      {Array.from({ length }).map((_, i) => (
        <input key={i} ref={(el) => (refs.current[i] = el)} inputMode="numeric" maxLength={1}
          aria-label={`Số OTP thứ ${i + 1}`} onChange={(e) => onChange(e, i)} onKeyDown={(e) => onKey(e, i)} />
      ))}
    </div>
  );
}
