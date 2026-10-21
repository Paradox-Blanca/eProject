import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Landing.css';

const STORAGE_KEYS = {
  ROOMS: 'grand_hotel_rooms_v2',
  BOOKINGS: 'grand_hotel_bookings_v2',
  USER: 'grand_hotel_current_user_v2',
  TRANSACTIONS: 'grand_hotel_financial_transactions_v2',
};

const HOTEL_BANK_CONFIG = {
  bankId: 'MB',
  accountNo: '098888899',
  accountName: 'GRAND HOTEL AND RESORTS',
  template: 'compact2',
};

const DEFAULT_CCCD_FRONT = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
const DEFAULT_CCCD_BACK = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';

function readCurrentUser() {
  const savedUser = localStorage.getItem(STORAGE_KEYS.USER)
    || sessionStorage.getItem(STORAGE_KEYS.USER);
  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser);
  } catch {
    localStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    return null;
  }
}

const INITIAL_ROOMS = [
  { id: '101', name: 'Deluxe King Elegance', type: 'Standard', price: 750000, status: 'Trống', image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=700&q=80', beds: '1 Giường King lớn', view: 'Hướng hoa viên nội khu', size: '38m²', maxGuests: 2, currentGuest: null },
  { id: '102', name: 'Superior Twin Balcony', type: 'Superior', price: 1100000, status: 'Đang thuê', image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=700&q=80', beds: '2 Giường Twin êm ái', view: 'Ban công hướng biển', size: '45m²', maxGuests: 2, currentGuest: 'Trần Hải Đăng' },
  { id: '201', name: 'Executive Suite Hoàng Gia', type: 'Suite', price: 2200000, status: 'Trống', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=700&q=80', beds: 'Giường King Hoàng gia', view: 'View đại dương toàn cảnh', size: '68m²', maxGuests: 3, currentGuest: null },
  { id: '202', name: 'Premier Family Suite', type: 'Suite', price: 2800000, status: 'Đã đặt', image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=700&q=80', beds: '1 King + 2 Single Bed', view: 'Tầng cao hướng vịnh', size: '75m²', maxGuests: 4, currentGuest: 'Lê Minh Khang' },
  { id: '301', name: 'Presidential Ocean Villa', type: 'Villa', price: 5800000, status: 'Đang thuê', image: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=700&q=80', beds: 'Hồ bơi riêng & 2 King Beds', view: 'Trực diện bãi biển riêng', size: '140m²', maxGuests: 6, currentGuest: 'David Nguyễn' },
  { id: '302', name: 'Royal Penthouse Skyview', type: 'Villa', price: 8500000, status: 'Trống', image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=700&q=80', beds: 'Jacuzzi riêng & Phòng rượu VIP', view: 'Tầng 25 ngắm 360 độ thành phố', size: '210m²', maxGuests: 4, currentGuest: null }
];

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
}

function generateVietQRUrl(amount, content) {
  const cleanContent = encodeURIComponent((content || '').replace(/[^a-zA-Z0-9 ]/g, ''));
  return `https://img.vietqr.io/image/${HOTEL_BANK_CONFIG.bankId}-${HOTEL_BANK_CONFIG.accountNo}-${HOTEL_BANK_CONFIG.template}.png?amount=${amount}&addInfo=${cleanContent}&accountName=${encodeURIComponent(HOTEL_BANK_CONFIG.accountName)}`;
}

export default function Landing() {
  const navigate = useNavigate();

  // Rooms state
  const [rooms, setRooms] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROOMS);
    return saved ? JSON.parse(saved) : INITIAL_ROOMS;
  });

  // Current logged in user state
  const [currentUser, setCurrentUser] = useState(() => {
    return readCurrentUser();
  });

  // Filter state
  const [currentFilter, setCurrentFilter] = useState('ALL');
  const [scrolled, setScrolled] = useState(false);

  // Search Bar state
  const [heroCheckIn, setHeroCheckIn] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [heroCheckOut, setHeroCheckOut] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [heroRoomType, setHeroRoomType] = useState('ALL');
  const [heroGuests, setHeroGuests] = useState('2');

  // Modal states
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    customerName: '',
    phone: '',
    cccd: '',
    dob: '1995-05-15',
    checkIn: '',
    checkOut: '',
    breakfast: true,
    pickup: false,
    spa: false,
    depositPercent: 50,
    paymentMethod: 'VietQR'
  });

  // VietQR Modal state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);

  // My Bookings Modal state
  const [isMyBookingsModalOpen, setIsMyBookingsModalOpen] = useState(false);
  const [myBookingsList, setMyBookingsList] = useState([]);

  // Customer Profile & CCCD Modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    email: '',
    dob: '1995-05-15',
    gender: 'Nam',
    address: 'TP. Hồ Chí Minh',
    cccd: '079095001234',
    cccdDate: '2021-08-20',
    cccdPlace: 'Cục CSQLHC về TTXH',
    cccdFront: DEFAULT_CCCD_FRONT,
    cccdBack: DEFAULT_CCCD_BACK
  });

  // Toast notification state
  const [toasts, setToasts] = useState([]);

  const showToast = (title, message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Scroll listener for luxury navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 60) setScrolled(true);
      else setScrolled(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync user state with localStorage
  useEffect(() => {
    const u = readCurrentUser();
    if (u) {
      setCurrentUser(u);
      setProfileForm({
        name: u.name || '',
        phone: u.phone || '',
        email: u.email || u.username || '',
        dob: u.dob || '1995-05-15',
        gender: u.gender || 'Nam',
        address: u.address || 'TP. Hồ Chí Minh',
        cccd: u.cccd || '079095001234',
        cccdDate: u.cccdDate || '2021-08-20',
        cccdPlace: u.cccdPlace || 'Cục CSQLHC về TTXH',
        cccdFront: u.cccdFront || DEFAULT_CCCD_FRONT,
        cccdBack: u.cccdBack || DEFAULT_CCCD_BACK
      });
    }
  }, []);

  // Save rooms to localStorage when rooms state change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  }, [rooms]);

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    setCurrentUser(null);
    showToast('Đã đăng xuất', 'Quý khách đã đăng xuất an toàn khỏi hệ thống.', 'info');
  };

  // Filter rooms
  const filteredRooms = currentFilter === 'ALL'
    ? rooms
    : rooms.filter(r => r.type === currentFilter);

  // Search rooms button
  const handleSearchRooms = () => {
    if (heroCheckIn && heroCheckOut && heroCheckIn >= heroCheckOut) {
      showToast('Ngày không hợp lệ', 'Ngày trả phòng phải sau ngày nhận phòng.', 'danger');
      return;
    }
    if (heroRoomType !== 'ALL') {
      setCurrentFilter(heroRoomType);
    } else {
      setCurrentFilter('ALL');
    }
    const roomsSection = document.getElementById('rooms');
    if (roomsSection) {
      roomsSection.scrollIntoView({ behavior: 'smooth' });
    }
    showToast('Tìm kiếm thành công', 'Đã lọc danh sách các phòng khả dụng phù hợp.', 'info');
  };

  // Initiate Booking
  const handleOpenBooking = (room) => {
    if (room.status !== 'Trống') {
      showToast('Thông báo', 'Phòng này hiện không còn khả dụng.', 'danger');
      return;
    }

    setSelectedRoom(room);
    setBookingForm({
      customerName: currentUser ? (currentUser.name || '') : 'NGUYỄN VĂN AN',
      phone: currentUser ? (currentUser.phone || '') : '0901234567',
      cccd: currentUser ? (currentUser.cccd || '') : '079095001234',
      dob: currentUser ? (currentUser.dob || '1995-05-15') : '1995-05-15',
      checkIn: heroCheckIn,
      checkOut: heroCheckOut,
      breakfast: true,
      pickup: false,
      spa: false,
      depositPercent: 50,
      paymentMethod: 'VietQR'
    });
    setIsBookingModalOpen(true);
  };

  // Calculate stay duration and costs
  const calculateCosts = () => {
    if (!selectedRoom) return { nights: 1, roomTotal: 0, addonTotal: 0, grandTotal: 0, depositNeeded: 0 };

    let nights = 1;
    if (bookingForm.checkIn && bookingForm.checkOut) {
      const diff = new Date(bookingForm.checkOut) - new Date(bookingForm.checkIn);
      nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
      if (nights <= 0) nights = 1;
    }

    const roomTotal = selectedRoom.price * nights;
    let addonTotal = 0;
    if (bookingForm.breakfast) addonTotal += 200000 * nights;
    if (bookingForm.pickup) addonTotal += 450000;
    if (bookingForm.spa) addonTotal += 600000;

    const grandTotal = roomTotal + addonTotal;
    const depositNeeded = Math.round((grandTotal * bookingForm.depositPercent) / 100);

    return { nights, roomTotal, addonTotal, grandTotal, depositNeeded };
  };

  const costs = calculateCosts();

  // Submit Booking Form
  const handleBookingSubmit = (e) => {
    e.preventDefault();
    if (!selectedRoom) return;

    const bookingId = 'BK-' + Math.floor(1000 + Math.random() * 9000);
    const selectedAddons = [];
    if (bookingForm.breakfast) selectedAddons.push('Buffet Sáng Michelin');
    if (bookingForm.pickup) selectedAddons.push('Đưa Đón Sân Bay');
    if (bookingForm.spa) selectedAddons.push('Lotus Spa');

    const newBooking = {
      id: bookingId,
      customerName: bookingForm.customerName.trim().toUpperCase(),
      phone: bookingForm.phone.trim(),
      cccd: bookingForm.cccd.trim(),
      dob: bookingForm.dob,
      cccdFront: currentUser?.cccdFront || DEFAULT_CCCD_FRONT,
      cccdBack: currentUser?.cccdBack || DEFAULT_CCCD_BACK,
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      checkIn: bookingForm.checkIn,
      checkOut: bookingForm.checkOut,
      nights: costs.nights,
      addons: selectedAddons,
      minibar: 0,
      totalAmount: costs.grandTotal,
      depositAmount: costs.depositNeeded,
      depositMethod: bookingForm.paymentMethod,
      paidAmount: bookingForm.paymentMethod === 'Tiền mặt' ? 0 : costs.depositNeeded,
      remainingAmount: costs.grandTotal - (bookingForm.paymentMethod === 'Tiền mặt' ? 0 : costs.depositNeeded),
      status: 'Chờ check-in',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setIsBookingModalOpen(false);

    if (bookingForm.paymentMethod === 'VietQR' && costs.depositNeeded > 0) {
      setPendingBooking(newBooking);
      setIsQrModalOpen(true);
    } else {
      finalizeBooking(newBooking);
    }
  };

  // Finalize booking into localStorage and state
  const finalizeBooking = (booking) => {
    const savedBookings = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    const bookingsList = savedBookings ? JSON.parse(savedBookings) : [];
    bookingsList.unshift(booking);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookingsList));

    // Update room status
    setRooms(prev => prev.map(r => r.id === booking.roomId ? { ...r, status: 'Đã đặt', currentGuest: booking.customerName } : r));

    showToast('Đặt phòng thành công!', `Mã đơn: ${booking.id}. Định danh CCCD đã hoàn tất.`, 'success');
  };

  // Confirm VietQR payment
  const handleConfirmQrPaid = () => {
    if (!pendingBooking) return;

    // Record transaction
    const savedTxs = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const txList = savedTxs ? JSON.parse(savedTxs) : [];
    txList.unshift({
      id: 'TX-' + Math.floor(100 + Math.random() * 900),
      bookingId: pendingBooking.id,
      customerName: pendingBooking.customerName,
      type: `Đặt cọc phòng (${formatVND(pendingBooking.depositAmount)})`,
      method: 'VietQR',
      amount: pendingBooking.depositAmount,
      date: new Date().toLocaleString('vi-VN'),
      staff: 'Cổng Online VietQR'
    });
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txList));

    finalizeBooking(pendingBooking);
    setIsQrModalOpen(false);
    setPendingBooking(null);
  };

  // Open My Bookings Modal
  const handleOpenMyBookings = () => {
    const saved = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    const list = saved ? JSON.parse(saved) : [];
    const nameToMatch = currentUser?.name?.toLowerCase() || '';
    const phoneToMatch = currentUser?.phone || '';
    const cccdToMatch = currentUser?.cccd || '';

    const filtered = list.filter(b => 
      (nameToMatch && b.customerName?.toLowerCase().includes(nameToMatch)) ||
      (phoneToMatch && b.phone === phoneToMatch) ||
      (cccdToMatch && b.cccd === cccdToMatch)
    );
    setMyBookingsList(filtered.length > 0 ? filtered : list.slice(0, 3));
    setIsMyBookingsModalOpen(true);
  };

  // Update Customer CCCD & Profile
  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updatedUser = {
      ...(currentUser || {}),
      name: profileForm.name.trim().toUpperCase(),
      phone: profileForm.phone.trim(),
      email: profileForm.email.trim(),
      dob: profileForm.dob,
      gender: profileForm.gender,
      address: profileForm.address.trim(),
      cccd: profileForm.cccd.trim(),
      cccdDate: profileForm.cccdDate,
      cccdPlace: profileForm.cccdPlace.trim(),
      cccdFront: profileForm.cccdFront,
      cccdBack: profileForm.cccdBack,
      avatar: (profileForm.name.trim() || 'A').charAt(0).toUpperCase(),
      role: 'customer'
    };

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
    setIsProfileModalOpen(false);
    showToast('Cập nhật hồ sơ thành công', 'Thông tin cá nhân và ảnh CCCD đã được lưu trữ an toàn.', 'success');
  };

  // CCCD photo file reader helper
  const handleCccdFileChange = (e, field) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (uploadEvt) => {
        setProfileForm(prev => ({ ...prev, [field]: uploadEvt.target.result }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="landing-container">
      {/* Toast notifications */}
      <div className="landing-toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`landing-toast toast-${t.type}`}>
            <div className="toast-icon">
              <i className={`fa-solid ${t.type === 'success' ? 'fa-circle-check' : t.type === 'danger' ? 'fa-triangle-exclamation' : 'fa-circle-info'}`}></i>
            </div>
            <div className="toast-text">
              <h5>{t.title}</h5>
              <p>{t.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Header */}
      <header className={`landing-navbar ${scrolled ? 'scrolled' : ''}`}>
        <a href="#home" className="brand-logo">
          <i className="fa-solid fa-crown"></i>
          <div className="brand-text">
            <span className="brand-name">GRAND HOTEL</span>
            <span className="brand-sub">LUXURY RESORT & SPA</span>
          </div>
        </a>

        <ul className="nav-menu">
          <li><a href="#home" className="nav-link">Trang Chủ</a></li>
          <li><a href="#rooms" className="nav-link">Phòng Nghỉ</a></li>
          <li><a href="#amenities" className="nav-link">Tiện Ích 5 Sao</a></li>
        </ul>

        <div className="nav-actions">
          {currentUser?.role === 'staff' ? (
            <>
              <button 
                className="landing-btn btn-sm btn-gold"
                onClick={() => navigate('/admin')}
              >
                <i className="fa-solid fa-gauge-high"></i> Vào Admin Dashboard
              </button>
              <button 
                className="landing-btn btn-sm btn-dark" 
                onClick={handleLogout}
                title="Đăng xuất"
              >
                <i className="fa-solid fa-arrow-right-from-bracket"></i> Đăng xuất
              </button>
            </>
          ) : currentUser ? (
            <>
              <div 
                className="user-pill" 
                onClick={() => setIsProfileModalOpen(true)}
                title="Xem & Cập nhật hồ sơ CCCD"
              >
                <div className="user-avatar">{currentUser.avatar || currentUser.name?.charAt(0) || 'K'}</div>
                <span>{currentUser.name}</span>
                <i className="fa-solid fa-id-card" style={{ color: 'var(--gold-primary)', fontSize: '0.9rem' }} title="Đã định danh CCCD"></i>
              </div>
              <button 
                className="landing-btn btn-sm btn-outline-gold"
                onClick={() => setIsProfileModalOpen(true)}
              >
                <i className="fa-solid fa-address-card"></i> Hồ sơ CCCD
              </button>
              <button 
                className="landing-btn btn-sm btn-outline-gold"
                onClick={handleOpenMyBookings}
              >
                <i className="fa-solid fa-list-check"></i> Đơn của tôi
              </button>
              <button 
                className="landing-btn btn-sm btn-dark" 
                onClick={handleLogout}
                title="Đăng xuất"
              >
                <i className="fa-solid fa-arrow-right-from-bracket"></i> Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="landing-btn btn-gold btn-sm">
                <i className="fa-solid fa-user"></i> Đăng Nhập
              </Link>
              <Link to="/register" className="landing-btn btn-outline-gold btn-sm">
                <i className="fa-solid fa-id-card"></i> Đăng Ký CCCD
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="hero-tag">
          <i className="fa-solid fa-gem"></i> Đỉnh Cao Nghỉ Dưỡng Thượng Lưu
        </div>
        <h1>Tuyệt Tác Nghỉ Dưỡng <span>Chuẩn 5 Sao</span> Quốc Tế</h1>
        <p className="hero-sub">
          Khám phá không gian xa hoa, ẩm thực thượng hạng và dịch vụ chuẩn mực hoàng gia ngay giữa lòng thành phố biển.
        </p>

        {/* Floating Booking Bar */}
        <div className="booking-card">
          <div className="hero-input-group">
            <label><i className="fa-regular fa-calendar-check"></i> Ngày nhận phòng</label>
            <input 
              type="date" 
              value={heroCheckIn} 
              onChange={e => setHeroCheckIn(e.target.value)} 
            />
          </div>
          <div className="hero-input-group">
            <label><i className="fa-regular fa-calendar-xmark"></i> Ngày trả phòng</label>
            <input 
              type="date" 
              value={heroCheckOut} 
              onChange={e => setHeroCheckOut(e.target.value)} 
            />
          </div>
          <div className="hero-input-group">
            <label><i className="fa-solid fa-bed"></i> Hạng phòng</label>
            <select value={heroRoomType} onChange={e => setHeroRoomType(e.target.value)}>
              <option value="ALL">Tất cả hạng phòng</option>
              <option value="Standard">Standard Deluxe</option>
              <option value="Superior">Superior Ocean</option>
              <option value="Suite">Executive Suite</option>
              <option value="Villa">Presidential Villa</option>
            </select>
          </div>
          <div className="hero-input-group">
            <label><i className="fa-solid fa-user-group"></i> Số lượng khách</label>
            <select value={heroGuests} onChange={e => setHeroGuests(e.target.value)}>
              <option value="1">1 Khách</option>
              <option value="2">2 Khách (Cặp đôi)</option>
              <option value="4">4 Khách (Gia đình)</option>
              <option value="6">6+ Khách</option>
            </select>
          </div>
          <button 
            className="landing-btn btn-gold" 
            onClick={handleSearchRooms}
            style={{ height: '52px', alignSelf: 'flex-end' }}
          >
            <i className="fa-solid fa-magnifying-glass"></i> Tìm Phòng
          </button>
        </div>
      </section>

      {/* Room Section */}
      <section id="rooms" className="section">
        <div className="section-header">
          <span className="section-tag">Bộ Sưu Tập Phòng Nghỉ</span>
          <h2 className="section-title">Không Gian Nghỉ Dưỡng Hoàn Mỹ</h2>
          <p className="section-desc">
            Mỗi căn phòng tại Grand Hotel là một tuyệt tác kiến trúc kết hợp giữa nét cổ điển quý phái và tiện nghi hiện đại bậc nhất thế giới.
          </p>
        </div>

        <div className="filter-tabs">
          <button 
            className={`filter-btn ${currentFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setCurrentFilter('ALL')}
          >
            Tất Cả Phòng
          </button>
          <button 
            className={`filter-btn ${currentFilter === 'Standard' ? 'active' : ''}`}
            onClick={() => setCurrentFilter('Standard')}
          >
            Standard
          </button>
          <button 
            className={`filter-btn ${currentFilter === 'Superior' ? 'active' : ''}`}
            onClick={() => setCurrentFilter('Superior')}
          >
            Superior Ocean
          </button>
          <button 
            className={`filter-btn ${currentFilter === 'Suite' ? 'active' : ''}`}
            onClick={() => setCurrentFilter('Suite')}
          >
            Executive Suite
          </button>
          <button 
            className={`filter-btn ${currentFilter === 'Villa' ? 'active' : ''}`}
            onClick={() => setCurrentFilter('Villa')}
          >
            Presidential Villa
          </button>
        </div>

        <div className="room-grid">
          {filteredRooms.map(room => {
            const isAvailable = room.status === 'Trống';
            let badgeClass = 'badge-available';
            if (room.status === 'Đang thuê') badgeClass = 'badge-occupied';
            if (room.status === 'Đã đặt') badgeClass = 'badge-reserved';
            if (room.status === 'Đang dọn') badgeClass = 'badge-cleaning';

            return (
              <div key={room.id} className="room-card">
                <div className="room-status-top">
                  <span className={`status-badge ${badgeClass}`}>
                    <span className="status-dot"></span> {room.status}
                  </span>
                </div>
                <div className="room-img-wrap">
                  <img src={room.image} alt={room.name} className="room-img" />
                  <div className="room-overlay">
                    <span className="room-num">
                      <i className="fa-solid fa-key" style={{ color: 'var(--gold-primary)', marginRight: '6px' }}></i>
                      PHÒNG {room.id}
                    </span>
                  </div>
                </div>
                <div className="room-content">
                  <span className="room-type">{room.type}</span>
                  <h3 className="room-name">{room.name}</h3>
                  <div className="room-amenities">
                    <div className="amenity-item"><i className="fa-solid fa-bed"></i> {room.beds}</div>
                    <div className="amenity-item"><i className="fa-solid fa-maximize"></i> {room.size}</div>
                    <div className="amenity-item"><i className="fa-solid fa-user-group"></i> Tối đa {room.maxGuests} khách</div>
                    <div className="amenity-item"><i className="fa-solid fa-mountain-sun"></i> {room.view}</div>
                  </div>
                  <div className="room-footer">
                    <div className="price-box">
                      <span className="price-val">{formatVND(room.price)}</span>
                      <span className="price-unit">mỗi đêm (chưa VAT)</span>
                    </div>
                    {isAvailable ? (
                      <button 
                        className="landing-btn btn-gold btn-sm"
                        onClick={() => handleOpenBooking(room)}
                      >
                        <i className="fa-solid fa-calendar-plus"></i> Đặt Ngay
                      </button>
                    ) : (
                      <button 
                        className="landing-btn btn-dark btn-sm" 
                        disabled 
                        style={{ opacity: 0.6, cursor: 'not-allowed' }}
                      >
                        <i className="fa-solid fa-lock"></i> Hết phòng
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Amenities Section */}
      <section id="amenities" className="section amenities-section">
        <div className="section-header">
          <span className="section-tag">Trải Nghiệm Thượng Lưu</span>
          <h2 className="section-title">Tiện Ích Đặc Quyền 5 Sao</h2>
          <p className="section-desc">
            Grand Hotel mang đến hệ sinh thái nghỉ dưỡng trọn vẹn, thỏa mãn mọi giác quan với những dịch vụ chuẩn mực quốc tế cao cấp nhất.
          </p>
        </div>

        <div className="amenities-grid">
          <div className="amenity-card">
            <div className="amenity-icon-wrap"><i className="fa-solid fa-utensils"></i></div>
            <h4>Ẩm Thực Chuẩn Michelin</h4>
            <p>Thưởng thức thực đơn tinh hoa Âu - Á do các bếp trưởng đạt sao Michelin trực tiếp sáng tạo và chế biến cùng hầm rượu vang thượng hạng.</p>
          </div>
          <div className="amenity-card">
            <div className="amenity-icon-wrap"><i className="fa-solid fa-water-ladder"></i></div>
            <h4>Hồ Bơi Vô Cực Chân Mây</h4>
            <p>Hồ bơi nước ấm vô cực trên tầng cao ngắm trọn bình minh và hoàng hôn biển với quầy bar phục vụ cocktail nhiệt đới cả ngày.</p>
          </div>
          <div className="amenity-card">
            <div className="amenity-icon-wrap"><i className="fa-solid fa-spa"></i></div>
            <h4>Lotus Spa Hoàng Gia</h4>
            <p>Liệu pháp massage thư giãn bằng tinh dầu thảo mộc quý tộc, phòng xông hơi đá muối Himalaya giúp tái tạo năng lượng hoàn hảo.</p>
          </div>
          <div className="amenity-card">
            <div className="amenity-icon-wrap"><i className="fa-solid fa-car-side"></i></div>
            <h4>Đưa Đón Sân Bay Bằng Xe Sang</h4>
            <p>Đội xe Limousine và Mercedes-Benz Maybach sang trọng sẵn sàng phục vụ đưa đón sân bay riêng tư, an toàn và đúng giờ 24/7.</p>
          </div>
          <div className="amenity-card">
            <div className="amenity-icon-wrap"><i className="fa-solid fa-champagne-glasses"></i></div>
            <h4>Grand Ballroom & Tiệc Cưới</h4>
            <p>Trung tâm hội nghị và sự kiện sức chứa 1.000 khách với hệ thống âm thanh, ánh sáng hiện đại và dịch vụ tiệc đạt chuẩn yến tiệc ngoại giao.</p>
          </div>
          <div className="amenity-card">
            <div className="amenity-icon-wrap"><i className="fa-solid fa-shield-halved"></i></div>
            <h4>Định Danh CCCD Tạm Trú Tức Thì</h4>
            <p>Thủ tục khai báo tạm trú và xác thực danh tính điện tử CCCD mã hóa chuẩn an ninh quốc gia, bảo mật tuyệt đối 100% dữ liệu khách lưu trú.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-col">
            <a href="#home" className="brand-logo" style={{ marginBottom: '20px' }}>
              <i className="fa-solid fa-crown"></i>
              <div className="brand-text">
                <span className="brand-name">GRAND HOTEL</span>
                <span className="brand-sub">LUXURY RESORT & SPA</span>
              </div>
            </a>
            <p style={{ lineHeight: 1.8 }}>
              Biểu tượng của sự sang trọng, lòng hiếu khách chuẩn 5 sao và thủ tục đăng ký tạm trú CCCD bảo mật tuyệt đối.
            </p>
          </div>
          <div className="footer-col">
            <h4>Liên Kết Nhanh</h4>
            <ul className="footer-links">
              <li><a href="#home">Trang chủ</a></li>
              <li><a href="#rooms">Bộ sưu tập phòng</a></li>
              <li><a href="#amenities">Tiện ích đặc quyền</a></li>
              <li><Link to="/login">Đăng nhập tài khoản</Link></li>
              <li><Link to="/login?redirect=/admin" style={{ opacity: 0.75 }}><i className="fa-solid fa-lock" style={{ color: 'var(--gold-primary)', marginRight: '6px' }}></i> Cổng Nội Bộ Nhân Sự</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Quy Định & Pháp Lý</h4>
            <ul className="footer-links">
              <li><a href="#rooms"><i className="fa-solid fa-id-card" style={{ color: 'var(--gold-primary)', marginRight: '6px' }}></i> Khai báo CCCD / Tạm trú</a></li>
              <li><a href="#rooms"><i className="fa-solid fa-qrcode" style={{ color: 'var(--gold-primary)', marginRight: '6px' }}></i> Thanh toán VietQR Napas</a></li>
              <li><a href="#rooms"><i className="fa-solid fa-shield-halved" style={{ color: 'var(--gold-primary)', marginRight: '6px' }}></i> Bảo mật thông tin cá nhân</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Liên Hệ Trực Tiếp</h4>
            <p style={{ marginBottom: '10px' }}>
              <i className="fa-solid fa-location-dot" style={{ color: 'var(--gold-primary)', marginRight: '8px' }}></i> 
              01 Đại lộ Hoàng Gia, TP. Biển
            </p>
            <p style={{ marginBottom: '10px' }}>
              <i className="fa-solid fa-phone" style={{ color: 'var(--gold-primary)', marginRight: '8px' }}></i> 
              (+84) 1900 8888 99
            </p>
            <p>
              <i className="fa-solid fa-envelope" style={{ color: 'var(--gold-primary)', marginRight: '8px' }}></i> 
              concierge@grandhotel.vn
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; 2026 Grand Hotel & Resorts. Bản quyền thuộc về hệ thống quản lý khách sạn và định danh CCCD toàn diện.
        </div>
      </footer>

      {/* ================= MODAL 1: ĐẶT PHÒNG KHÁCH HÀNG ================= */}
      {isBookingModalOpen && selectedRoom && (
        <div className="modal-overlay">
          <div className="modal-card modal-lg">
            <div className="modal-header">
              <h3>Xác Nhận Đặt Phòng & Đặt Cọc</h3>
              <button className="modal-close-btn" onClick={() => setIsBookingModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleBookingSubmit}>
                {/* Room summary header */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px', paddingBottom: '18px', borderBottom: '1px solid var(--border-color)' }}>
                  <img src={selectedRoom.image} alt={selectedRoom.name} style={{ width: '120px', height: '85px', borderRadius: '10px', objectFit: 'cover' }} />
                  <div>
                    <span className="room-type">{selectedRoom.type}</span>
                    <h4 style={{ fontSize: '1.3rem', color: 'var(--navy-dark)', margin: '4px 0' }}>{selectedRoom.name} (Phòng {selectedRoom.id})</h4>
                    <div style={{ fontSize: '0.9rem', color: 'var(--gold-dark)', fontWeight: 700 }}>
                      {formatVND(selectedRoom.price)} / đêm
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="form-row">
                  <div className="form-group">
                    <label><i className="fa-regular fa-user"></i> Tên Quý Khách *</label>
                    <input 
                      type="text" 
                      required 
                      value={bookingForm.customerName}
                      onChange={e => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label><i className="fa-solid fa-phone"></i> Số Điện Thoại *</label>
                    <input 
                      type="tel" 
                      required 
                      value={bookingForm.phone}
                      onChange={e => setBookingForm({ ...bookingForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label><i className="fa-regular fa-id-card"></i> Số CCCD / Hộ Chiếu (Đăng ký tạm trú) *</label>
                    <input 
                      type="text" 
                      required 
                      value={bookingForm.cccd}
                      onChange={e => setBookingForm({ ...bookingForm, cccd: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label><i className="fa-regular fa-calendar"></i> Ngày Sinh *</label>
                    <input 
                      type="date" 
                      required 
                      value={bookingForm.dob}
                      onChange={e => setBookingForm({ ...bookingForm, dob: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label><i className="fa-regular fa-calendar-check"></i> Ngày Nhận Phòng (Check-in)</label>
                    <input 
                      type="date" 
                      required 
                      value={bookingForm.checkIn}
                      onChange={e => setBookingForm({ ...bookingForm, checkIn: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label><i className="fa-regular fa-calendar-xmark"></i> Ngày Trả Phòng (Check-out)</label>
                    <input 
                      type="date" 
                      required 
                      value={bookingForm.checkOut}
                      onChange={e => setBookingForm({ ...bookingForm, checkOut: e.target.value })}
                    />
                  </div>
                </div>

                {/* 5-Star Addons */}
                <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '8px' }}>
                  <i className="fa-solid fa-bell-concierge"></i> Dịch Vụ Gia Tăng 5 Sao:
                </label>
                <div className="addon-options">
                  <div className={`addon-item ${bookingForm.breakfast ? 'selected' : ''}`}>
                    <label>
                      <input 
                        type="checkbox" 
                        checked={bookingForm.breakfast}
                        onChange={e => setBookingForm({ ...bookingForm, breakfast: e.target.checked })}
                      />
                      <span>Buffet Ăn Sáng Hoàng Gia (Chuẩn Michelin)</span>
                    </label>
                    <strong style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>+ 200.000 ₫ / ngày</strong>
                  </div>
                  <div className={`addon-item ${bookingForm.pickup ? 'selected' : ''}`}>
                    <label>
                      <input 
                        type="checkbox" 
                        checked={bookingForm.pickup}
                        onChange={e => setBookingForm({ ...bookingForm, pickup: e.target.checked })}
                      />
                      <span>Đưa Đón Sân Bay Khứ Hồi Bằng Xe Sang</span>
                    </label>
                    <strong style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>+ 450.000 ₫</strong>
                  </div>
                  <div className={`addon-item ${bookingForm.spa ? 'selected' : ''}`}>
                    <label>
                      <input 
                        type="checkbox" 
                        checked={bookingForm.spa}
                        onChange={e => setBookingForm({ ...bookingForm, spa: e.target.checked })}
                      />
                      <span>Gói Thư Giãn Trị Liệu Lotus Spa Toàn Thân</span>
                    </label>
                    <strong style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>+ 600.000 ₫</strong>
                  </div>
                </div>

                {/* Deposit & Payment Selection */}
                <div style={{ background: 'rgba(212,175,55,0.06)', border: '1.5px solid var(--gold-primary)', borderRadius: 'var(--radius-md)', padding: '18px', margin: '20px 0' }}>
                  <h4 style={{ color: 'var(--navy-dark)', fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-coins" style={{ color: 'var(--gold-dark)' }}></i> Lựa Chọn Đặt Cọc & Phương Thức Thanh Toán:
                  </h4>
                  <div className="form-row" style={{ marginBottom: 0 }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>MỨC ĐẶT CỌC:</label>
                      <select 
                        value={bookingForm.depositPercent} 
                        onChange={e => setBookingForm({ ...bookingForm, depositPercent: parseInt(e.target.value) })}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontWeight: 600 }}
                      >
                        <option value={50}>Đặt Cọc 50% (Đảm bảo giữ phòng 5 sao)</option>
                        <option value={100}>Thanh Toán Toàn Bộ 100%</option>
                        <option value={0}>Thanh Toán Khi Nhận Phòng (0% cọc)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>PHƯƠNG THỨC THANH TOÁN:</label>
                      <select 
                        value={bookingForm.paymentMethod}
                        onChange={e => setBookingForm({ ...bookingForm, paymentMethod: e.target.value })}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontWeight: 600 }}
                      >
                        <option value="VietQR">📱 Chuyển Khoản Ngân Hàng VietQR (Quét mã)</option>
                        <option value="Thẻ tín dụng">💳 Thẻ Quốc Tế (Visa / Mastercard)</option>
                        <option value="Tiền mặt">💵 Tiền Mặt Khi Check-in</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Costs Summary */}
                <div className="booking-summary-box">
                  <div className="summary-row">
                    <span>Thời gian lưu trú:</span>
                    <strong>{costs.nights} đêm</strong>
                  </div>
                  <div className="summary-row">
                    <span>Tiền phòng gốc:</span>
                    <span>{formatVND(costs.roomTotal)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Phí dịch vụ gia tăng:</span>
                    <span>{formatVND(costs.addonTotal)}</span>
                  </div>
                  <div className="summary-row" style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px', marginTop: '8px' }}>
                    <span>Tổng giá trị đơn phòng:</span>
                    <strong style={{ color: 'var(--navy-dark)', fontSize: '1.05rem' }}>{formatVND(costs.grandTotal)}</strong>
                  </div>
                  <div className="summary-total" style={{ background: '#fef3c7', padding: '12px', borderRadius: '8px', border: 'none', marginTop: '8px' }}>
                    <span style={{ color: '#92400e', fontSize: '1rem' }}>Số Tiền Cần Đặt Cọc Ngay:</span>
                    <span style={{ color: '#b45309', fontSize: '1.25rem' }}>{formatVND(costs.depositNeeded)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end' }}>
                  <button type="button" className="landing-btn btn-dark" onClick={() => setIsBookingModalOpen(false)}>
                    Hủy Bỏ
                  </button>
                  <button type="submit" className="landing-btn btn-gold">
                    <i className="fa-solid fa-qrcode"></i> Tiến Hành Đặt Phòng & Nhận Mã QR
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: THANH TOÁN VIETQR ================= */}
      {isQrModalOpen && pendingBooking && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Thanh Toán Chuyển Khoản VietQR</h3>
              <button className="modal-close-btn" onClick={() => setIsQrModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                Vui lòng mở ứng dụng ngân hàng bất kỳ để quét mã thanh toán tức thì:
              </p>

              <div className="vietqr-box">
                <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gold-light)' }}>
                  <i className="fa-solid fa-shield-halved"></i> CỔNG THANH TOÁN CHUẨN NAPAS 24/7
                </div>

                <div className="vietqr-img-wrap">
                  <img 
                    src={generateVietQRUrl(pendingBooking.depositAmount, `DAT COC ${pendingBooking.id}`)} 
                    alt="VietQR" 
                    className="vietqr-img" 
                  />
                </div>

                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--gold-light)' }}>
                  {formatVND(pendingBooking.depositAmount)}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                  Nội dung: DAT COC {pendingBooking.id} ({pendingBooking.customerName})
                </div>

                <div className="bank-info-grid">
                  <div>
                    <span>Ngân Hàng Thụ Hưởng:</span>
                    <strong>MB BANK (Quân Đội)</strong>
                  </div>
                  <div>
                    <span>Số Tài Khoản Khách Sạn:</span>
                    <strong style={{ color: 'var(--gold-light)' }}>{HOTEL_BANK_CONFIG.accountNo}</strong>
                  </div>
                  <div>
                    <span>Tên Người Thụ Hưởng:</span>
                    <strong>{HOTEL_BANK_CONFIG.accountName}</strong>
                  </div>
                  <div>
                    <span>Cú Pháp Chuyển Khoản:</span>
                    <strong>DAT COC {pendingBooking.id}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '15px' }}>
                <button 
                  className="landing-btn btn-dark btn-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(HOTEL_BANK_CONFIG.accountNo);
                    showToast('Đã sao chép', `Số tài khoản ${HOTEL_BANK_CONFIG.accountNo} đã lưu vào bộ nhớ tạm.`, 'info');
                  }}
                >
                  <i className="fa-regular fa-copy"></i> Sao Chép Số TK
                </button>
                <button 
                  className="landing-btn btn-gold"
                  onClick={handleConfirmQrPaid}
                >
                  <i className="fa-solid fa-circle-check"></i> Tôi Đã Chuyển Khoản Xong
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: ĐƠN CỦA TÔI ================= */}
      {isMyBookingsModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card modal-lg">
            <div className="modal-header">
              <h3>Đơn Đặt Phòng Của Quý Khách</h3>
              <button className="modal-close-btn" onClick={() => setIsMyBookingsModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '12px 14px' }}>Mã Đơn</th>
                      <th style={{ padding: '12px 14px' }}>Phòng</th>
                      <th style={{ padding: '12px 14px' }}>Tổng Tiền</th>
                      <th style={{ padding: '12px 14px' }}>Đã Cọc</th>
                      <th style={{ padding: '12px 14px' }}>Còn Lại</th>
                      <th style={{ padding: '12px 14px' }}>Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myBookingsList.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                          Quý khách chưa có đơn đặt phòng nào. Hãy chọn phòng ngay!
                        </td>
                      </tr>
                    ) : (
                      myBookingsList.map(b => (
                        <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 14px' }}><strong>{b.id}</strong></td>
                          <td style={{ padding: '12px 14px' }}>Phòng {b.roomId} - {b.roomName}</td>
                          <td style={{ padding: '12px 14px' }}><strong>{formatVND(b.totalAmount)}</strong></td>
                          <td style={{ padding: '12px 14px' }}><span className="status-badge badge-deposit">{formatVND(b.depositAmount)}</span></td>
                          <td style={{ padding: '12px 14px' }}><strong style={{ color: 'var(--danger)' }}>{formatVND(b.remainingAmount)}</strong></td>
                          <td style={{ padding: '12px 14px' }}>
                            <span className={`status-badge ${b.status === 'Đã check-in' ? 'badge-occupied' : b.status === 'Đã hoàn thành' ? 'badge-available' : 'badge-reserved'}`}>
                              <span className="status-dot"></span> {b.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: HỒ SƠ CCCD KHÁCH HÀNG ================= */}
      {isProfileModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card modal-lg">
            <div className="modal-header">
              <h3>Hồ Sơ Cá Nhân & Định Danh CCCD</h3>
              <button className="modal-close-btn" onClick={() => setIsProfileModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSaveProfile}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div className="user-avatar" style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}>
                      {currentUser?.avatar || 'K'}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.15rem', color: 'var(--navy-dark)', margin: '0 0 4px' }}>
                        {profileForm.name || 'QUÝ KHÁCH'}
                      </h4>
                      <span className="status-badge badge-verified">
                        <i className="fa-solid fa-circle-check"></i> Đã Xác Minh CCCD
                      </span>
                    </div>
                  </div>
                </div>

                <div className="form-section-title">
                  <i className="fa-solid fa-user-pen"></i> 1. Cập Nhật Thông Tin Liên Hệ
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Họ và Tên (In hoa như trên CCCD) *</label>
                    <input 
                      type="text" 
                      required 
                      value={profileForm.name}
                      onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Số Điện Thoại *</label>
                    <input 
                      type="tel" 
                      required 
                      value={profileForm.phone}
                      onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-3">
                  <div className="form-group">
                    <label>Email Liên Hệ</label>
                    <input 
                      type="email" 
                      value={profileForm.email}
                      onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ngày Sinh *</label>
                    <input 
                      type="date" 
                      value={profileForm.dob}
                      onChange={e => setProfileForm({ ...profileForm, dob: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Giới Tính</label>
                    <select 
                      value={profileForm.gender}
                      onChange={e => setProfileForm({ ...profileForm, gender: e.target.value })}
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Địa Chỉ Thường Trú</label>
                  <input 
                    type="text" 
                    value={profileForm.address}
                    onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                  />
                </div>

                <div className="form-section-title">
                  <i className="fa-solid fa-id-card"></i> 2. Căn Cước Công Dân & Ảnh Chụp KYC
                </div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label>Số CCCD / Hộ Chiếu (12 số) *</label>
                    <input 
                      type="text" 
                      required 
                      value={profileForm.cccd}
                      onChange={e => setProfileForm({ ...profileForm, cccd: e.target.value })}
                      style={{ fontWeight: 700 }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ngày Cấp *</label>
                    <input 
                      type="date" 
                      required 
                      value={profileForm.cccdDate}
                      onChange={e => setProfileForm({ ...profileForm, cccdDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Nơi Cấp *</label>
                    <input 
                      type="text" 
                      required 
                      value={profileForm.cccdPlace}
                      onChange={e => setProfileForm({ ...profileForm, cccdPlace: e.target.value })}
                    />
                  </div>
                </div>

                <label style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '5px' }}>
                  Ảnh Chụp Căn Cước Công Dân (Mặt Trước & Mặt Sau)
                </label>
                <div className="cccd-upload-container">
                  <div className="cccd-upload-box" onClick={() => document.getElementById('fileProfFront').click()}>
                    <i className="fa-solid fa-camera-rotate"></i>
                    <span>Cập Nhật Mặt Trước</span>
                    <input 
                      type="file" 
                      id="fileProfFront" 
                      accept="image/*" 
                      style={{ display: 'none' }}
                      onChange={e => handleCccdFileChange(e, 'cccdFront')}
                    />
                    {profileForm.cccdFront && (
                      <img src={profileForm.cccdFront} alt="CCCD Mặt Trước" className="cccd-preview-img" />
                    )}
                  </div>
                  <div className="cccd-upload-box" onClick={() => document.getElementById('fileProfBack').click()}>
                    <i className="fa-solid fa-camera-rotate"></i>
                    <span>Cập Nhật Mặt Sau</span>
                    <input 
                      type="file" 
                      id="fileProfBack" 
                      accept="image/*" 
                      style={{ display: 'none' }}
                      onChange={e => handleCccdFileChange(e, 'cccdBack')}
                    />
                    {profileForm.cccdBack && (
                      <img src={profileForm.cccdBack} alt="CCCD Mặt Sau" className="cccd-preview-img" />
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button type="button" className="landing-btn btn-dark" onClick={() => setIsProfileModalOpen(false)}>
                    Đóng
                  </button>
                  <button type="submit" className="landing-btn btn-gold">
                    <i className="fa-solid fa-floppy-disk"></i> Lưu Thay Đổi Hồ Sơ & CCCD
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
