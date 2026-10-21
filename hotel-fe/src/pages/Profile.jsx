import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TABS = ['Thông tin cá nhân', 'Giấy tờ', 'Lịch sử lưu trú', 'Ghi chú', 'Khai báo lưu trú'];
const HISTORY = [
  ['12/08/2026', '14/08/2026', 'P.301', 'Deluxe'],
  ['03/05/2026', '05/05/2026', 'P.205', 'Standard'],
  ['20/01/2026', '22/01/2026', 'P.510', 'Suite'],
];
const demo = () => alert('Bản demo: chức năng này chưa kết nối API.');
const Field = ({ label, ...p }) => <label>{label}<input {...p} /></label>;
const Save = ({ children = 'Lưu thay đổi' }) => <button type="button" className="btn auto" onClick={demo}>{children}</button>;

function Upload({ label }) {
  const [src, setSrc] = useState(null);
  return (
    <label className="up">
      {src ? <img src={src} alt={label} /> : <span>{label}<br /><small>Bấm để chọn ảnh</small></span>}
      <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && setSrc(URL.createObjectURL(e.target.files[0]))} />
    </label>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [foreign, setForeign] = useState(false);
  const handleLogout = () => {
    localStorage.removeItem('grand_hotel_current_user_v2');
    sessionStorage.removeItem('grand_hotel_current_user_v2');
    navigate('/login');
  };
  return (
    <>
      <header className="top">
        <b>Grand Hotel</b>
        <span><button type="button" className="link" style={{ color: '#fff' }} onClick={handleLogout}>Đăng xuất</button></span>
      </header>
      <div className="page">
        <h1>Hồ sơ khách</h1>
        <p className="muted">Thông tin, giấy tờ và lưu trú của khách</p>
        <div className="tabs" role="tablist">
          {TABS.map((t, i) => <button key={t} role="tab" className={i === tab ? 'on' : ''} onClick={() => setTab(i)}>{t}</button>)}
        </div>
        <div className="panel">
          {tab === 0 && (<>
            <div className="grid">
              <Field label="Họ và tên" /><Field label="Ngày sinh" type="date" />
              <label>Giới tính<select><option>Nam</option><option>Nữ</option><option>Khác</option></select></label>
              <Field label="Quốc tịch" defaultValue="Việt Nam" />
              <Field label="Số điện thoại" type="tel" /><Field label="Email" type="email" />
            </div>
            <Field label="Địa chỉ thường trú" /><Save />
          </>)}
          {tab === 1 && (<>
            <div className="grid">
              <label>Loại giấy tờ<select><option>CCCD</option><option>Hộ chiếu</option></select></label>
              <Field label="Số giấy tờ" /><Field label="Ngày cấp" type="date" /><Field label="Nơi cấp" />
            </div>
            <div className="grid"><Upload label="Ảnh mặt trước" /><Upload label="Ảnh mặt sau" /></div>
            <br /><Save>Lưu giấy tờ</Save>
          </>)}
          {tab === 2 && (
            <table>
              <thead><tr><th>Ngày đến</th><th>Ngày đi</th><th>Phòng</th><th>Loại phòng</th></tr></thead>
              <tbody>{HISTORY.map((r) => <tr key={r[0]}>{r.map((c) => <td key={c}>{c}</td>)}</tr>)}</tbody>
            </table>
          )}
          {tab === 3 && (<>
            <div className="tags">
              {['Dị ứng', 'Yêu cầu giường', 'VIP'].map((t) => <label key={t} className="check"><input type="checkbox" /> {t}</label>)}
            </div>
            <label>Ghi chú chi tiết<textarea rows="5" placeholder="Ví dụ: dị ứng hải sản, cần giường đôi, tầng cao" /></label>
            <Save>Lưu ghi chú</Save>
          </>)}
          {tab === 4 && (<>
            <p className="muted">Thông tin khai báo với cơ quan công an. Với khách nước ngoài, khách sạn khai báo tạm trú qua trang thông tin điện tử của cơ quan công an.</p>
            <div className="grid">
              <label>Đối tượng khai báo
                <select value={foreign ? 'nn' : 'vn'} onChange={(e) => setForeign(e.target.value === 'nn')}>
                  <option value="vn">Công dân Việt Nam</option><option value="nn">Người nước ngoài</option>
                </select>
              </label>
              <Field label="Số phòng" />
              <Field label="Ngày đến" type="date" /><Field label="Ngày đi dự kiến" type="date" />
              <Field label="Nghề nghiệp" /><Field label="Nơi làm việc / học tập" />
              <Field label="Lý do lưu trú" />
            </div>
            {foreign && (
              <div className="grid">
                <Field label="Loại thị thực (visa)" /><Field label="Số thị thực" />
                <Field label="Ngày nhập cảnh" type="date" /><Field label="Cửa khẩu nhập cảnh" />
              </div>
            )}
            <div className="actions">
              <Save>Lưu khai báo</Save>
              <button type="button" className="btn ghost auto" onClick={demo}>Xuất file nộp công an</button>
            </div>
          </>)}
        </div>
      </div>
    </>
  );
}
