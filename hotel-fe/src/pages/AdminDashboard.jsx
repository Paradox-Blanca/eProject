import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout as revokeSession } from '../services/authApi';
import './AdminDashboard.css';

const STORAGE_KEYS = {
  ROOMS: 'grand_hotel_rooms_v2',
  BOOKINGS: 'grand_hotel_bookings_v2',
  USER: 'grand_hotel_current_user_v2',
  STAFF_USERS: 'grand_hotel_staff_users_v2',
  ROLES_CONFIG: 'grand_hotel_roles_config_v2',
  ACTIVE_STAFF_ID: 'grand_hotel_active_staff_id_v2',
  TRANSACTIONS: 'grand_hotel_financial_transactions_v2',
  HISTORICAL_REVENUE: 'grand_hotel_historical_revenue_v3'
};

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

const HOTEL_BANK_CONFIG = {
  bankId: 'MB',
  accountNo: '098888899',
  accountName: 'GRAND HOTEL AND RESORTS',
  template: 'compact2'
};

const DEFAULT_CCCD_FRONT = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
const DEFAULT_CCCD_BACK = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';

const PERMISSION_GROUPS = [
  {
    groupName: '1. Thống Kê & Báo Cáo',
    permissions: [
      { key: 'view_kpi', label: 'Xem bảng tổng quan KPI khách sạn', desc: 'Xem số phòng trống, đang thuê, tỷ lệ lấp đầy' },
      { key: 'view_revenue', label: 'Xem báo cáo doanh thu & sổ quỹ tiền tệ', desc: 'Xem tổng tiền tích lũy và dòng tiền thu chi' }
    ]
  },
  {
    groupName: '2. Quản Lý Phòng Nghỉ',
    permissions: [
      { key: 'manage_rooms', label: 'Thêm / Sửa thông tin danh mục phòng', desc: 'Tạo phòng mới, đổi giá phòng' },
      { key: 'room_checkin_checkout', label: 'Thực hiện Check-in & Trả phòng (Bill)', desc: 'Giao nhận chìa khóa và xuất hóa đơn' },
      { key: 'room_cleaning', label: 'Cập nhật trạng thái buồng phòng dọn dẹp', desc: 'Đổi trạng thái phòng đang dọn sang sẵn sàng' }
    ]
  },
  {
    groupName: '3. Quản Lý Đặt Phòng & Tiền Cọc',
    permissions: [
      { key: 'manage_bookings', label: 'Xem danh sách tất cả đơn đặt phòng & CCCD', desc: 'Xem thông tin khách, tiền cọc và kiểm tra ảnh CCCD' },
      { key: 'create_booking', label: 'Tạo đơn đặt phòng trực tiếp (Walk-in)', desc: 'Lập đơn đặt mới cho khách đến nhận phòng ngay' },
      { key: 'cancel_booking', label: 'Hủy bỏ đơn đặt phòng của khách', desc: 'Hủy đơn và hoàn cọc/hủy phòng' }
    ]
  },
  {
    groupName: '4. Thu Ngân & Sổ Quỹ Tiền Tệ',
    permissions: [
      { key: 'manage_finances', label: 'Quản lý thu ngân & ghi nhận giao dịch', desc: 'Xem nhật ký thu tiền, thu tiền cọc và tiền mặt' }
    ]
  },
  {
    groupName: '5. Quản Lý Nhân Sự & Phân Quyền',
    permissions: [
      { key: 'view_staff', label: 'Xem danh sách tài khoản nhân sự', desc: 'Xem danh sách nhân viên nội bộ' },
      { key: 'manage_staff', label: 'Thêm, sửa, khóa tài khoản nhân viên', desc: 'Gán vai trò và quản lý tài khoản nhân viên' },
      { key: 'config_permissions', label: 'Cấu hình chi tiết ma trận quyền hạn', desc: 'Bật/tắt các quyền của từng vai trò' }
    ]
  },
  {
    groupName: '6. Quản Trị Hệ Thống',
    permissions: [
      { key: 'system_reset', label: 'Khôi phục dữ liệu gốc hệ thống', desc: 'Reset dữ liệu mẫu của khách sạn' }
    ]
  }
];

const INITIAL_ROLES = [
  {
    id: 'admin',
    name: 'Giám Đốc / Tổng Quản Lý',
    badgeColor: '#dc2626',
    description: 'Toàn quyền truy cập và cấu hình toàn bộ hệ thống khách sạn',
    permissions: {
      view_kpi: true, view_revenue: true, manage_rooms: true, room_checkin_checkout: true,
      room_cleaning: true, manage_bookings: true, create_booking: true, cancel_booking: true,
      manage_finances: true, view_staff: true, manage_staff: true, config_permissions: true, system_reset: true
    }
  },
  {
    id: 'manager',
    name: 'Quản Lý Lễ Tân',
    badgeColor: '#d97706',
    description: 'Quản lý toàn bộ hoạt động tiền sảnh, buồng phòng và lễ tân',
    permissions: {
      view_kpi: true, view_revenue: true, manage_rooms: true, room_checkin_checkout: true,
      room_cleaning: true, manage_bookings: true, create_booking: true, cancel_booking: true,
      manage_finances: true, view_staff: true, manage_staff: false, config_permissions: false, system_reset: false
    }
  },
  {
    id: 'receptionist',
    name: 'Nhân Viên Lễ Tân',
    badgeColor: '#2563eb',
    description: 'Thực hiện đặt phòng, check-in, check-out và thu tiền',
    permissions: {
      view_kpi: true, view_revenue: false, manage_rooms: false, room_checkin_checkout: true,
      room_cleaning: false, manage_bookings: true, create_booking: true, cancel_booking: false,
      manage_finances: true, view_staff: false, manage_staff: false, config_permissions: false, system_reset: false
    }
  },
  {
    id: 'cashier',
    name: 'Kế Toán / Thủ Quỹ',
    badgeColor: '#7c3aed',
    description: 'Kiểm soát doanh thu, xuất hóa đơn quyết toán và dòng tiền',
    permissions: {
      view_kpi: true, view_revenue: true, manage_rooms: false, room_checkin_checkout: true,
      room_cleaning: false, manage_bookings: true, create_booking: false, cancel_booking: false,
      manage_finances: true, view_staff: false, manage_staff: false, config_permissions: false, system_reset: false
    }
  },
  {
    id: 'housekeeping',
    name: 'Quản Lý Buồng Phòng',
    badgeColor: '#059669',
    description: 'Kiểm tra trạng thái dọn dẹp phòng sẵn sàng đón khách',
    permissions: {
      view_kpi: false, view_revenue: false, manage_rooms: false, room_checkin_checkout: false,
      room_cleaning: true, manage_bookings: false, create_booking: false, cancel_booking: false,
      manage_finances: false, view_staff: false, manage_staff: false, config_permissions: false, system_reset: false
    }
  }
];

const INITIAL_STAFF_USERS = [
  { id: 'NV-001', name: 'Hoàng Minh Quân', email: 'quan.hoang@grandhotel.vn', phone: '0903 111 222', roleId: 'admin', status: 'active', lastLogin: 'Hôm nay, 16:30' },
  { id: 'NV-002', name: 'Nguyễn Thu Thảo', email: 'thao.nguyen@grandhotel.vn', phone: '0918 333 444', roleId: 'manager', status: 'active', lastLogin: 'Hôm nay, 15:45' },
  { id: 'NV-003', name: 'Lê Hoàng Nam', email: 'nam.le@grandhotel.vn', phone: '0982 555 666', roleId: 'receptionist', status: 'active', lastLogin: 'Hôm nay, 14:10' },
  { id: 'NV-004', name: 'Phạm Đăng Khoa', email: 'khoa.pham@grandhotel.vn', phone: '0945 888 999', roleId: 'cashier', status: 'active', lastLogin: 'Hôm nay, 11:00' },
  { id: 'NV-005', name: 'Trần Thị Lan', email: 'lan.tran@grandhotel.vn', phone: '0937 777 888', roleId: 'housekeeping', status: 'active', lastLogin: 'Hôm qua, 18:20' }
];

function generateDefaultHistoricalRevenue() {
  const monthly = [
    // 2024
    { year: 2024, month: 1, roomRevenue: 280000000, serviceRevenue: 45000000, depositCollected: 110000000, total: 325000000, nights: 145, occ: 68, bookings: 52, adr: 2241000 },
    { year: 2024, month: 2, roomRevenue: 320000000, serviceRevenue: 55000000, depositCollected: 130000000, total: 375000000, nights: 165, occ: 75, bookings: 58, adr: 2272000 },
    { year: 2024, month: 3, roomRevenue: 250000000, serviceRevenue: 35000000, depositCollected: 95000000, total: 285000000, nights: 130, occ: 62, bookings: 46, adr: 2192000 },
    { year: 2024, month: 4, roomRevenue: 310000000, serviceRevenue: 48000000, depositCollected: 120000000, total: 358000000, nights: 155, occ: 73, bookings: 54, adr: 2309000 },
    { year: 2024, month: 5, roomRevenue: 380000000, serviceRevenue: 62000000, depositCollected: 150000000, total: 442000000, nights: 180, occ: 81, bookings: 65, adr: 2455000 },
    { year: 2024, month: 6, roomRevenue: 440000000, serviceRevenue: 75000000, depositCollected: 175000000, total: 515000000, nights: 205, occ: 88, bookings: 72, adr: 2512000 },
    { year: 2024, month: 7, roomRevenue: 470000000, serviceRevenue: 82000000, depositCollected: 190000000, total: 552000000, nights: 220, occ: 92, bookings: 78, adr: 2509000 },
    { year: 2024, month: 8, roomRevenue: 410000000, serviceRevenue: 70000000, depositCollected: 165000000, total: 480000000, nights: 195, occ: 85, bookings: 68, adr: 2461000 },
    { year: 2024, month: 9, roomRevenue: 240000000, serviceRevenue: 35000000, depositCollected: 90000000, total: 275000000, nights: 125, occ: 60, bookings: 44, adr: 2200000 },
    { year: 2024, month: 10, roomRevenue: 260000000, serviceRevenue: 38000000, depositCollected: 100000000, total: 298000000, nights: 135, occ: 64, bookings: 48, adr: 2207000 },
    { year: 2024, month: 11, roomRevenue: 230000000, serviceRevenue: 32000000, depositCollected: 85000000, total: 262000000, nights: 120, occ: 58, bookings: 42, adr: 2183000 },
    { year: 2024, month: 12, roomRevenue: 390000000, serviceRevenue: 65000000, depositCollected: 155000000, total: 455000000, nights: 185, occ: 82, bookings: 66, adr: 2459000 },
    // 2025
    { year: 2025, month: 1, roomRevenue: 370000000, serviceRevenue: 58000000, depositCollected: 145000000, total: 428000000, nights: 180, occ: 78, bookings: 64, adr: 2377000 },
    { year: 2025, month: 2, roomRevenue: 430000000, serviceRevenue: 72000000, depositCollected: 170000000, total: 502000000, nights: 205, occ: 86, bookings: 74, adr: 2448000 },
    { year: 2025, month: 3, roomRevenue: 340000000, serviceRevenue: 50000000, depositCollected: 130000000, total: 390000000, nights: 165, occ: 72, bookings: 58, adr: 2363000 },
    { year: 2025, month: 4, roomRevenue: 400000000, serviceRevenue: 65000000, depositCollected: 155000000, total: 465000000, nights: 190, occ: 82, bookings: 68, adr: 2447000 },
    { year: 2025, month: 5, roomRevenue: 510000000, serviceRevenue: 85000000, depositCollected: 200000000, total: 595000000, nights: 230, occ: 91, bookings: 82, adr: 2586000 },
    { year: 2025, month: 6, roomRevenue: 580000000, serviceRevenue: 98000000, depositCollected: 235000000, total: 678000000, nights: 255, occ: 96, bookings: 92, adr: 2658000 },
    { year: 2025, month: 7, roomRevenue: 620000000, serviceRevenue: 105000000, depositCollected: 250000000, total: 725000000, nights: 270, occ: 98, bookings: 98, adr: 2685000 },
    { year: 2025, month: 8, roomRevenue: 540000000, serviceRevenue: 90000000, depositCollected: 215000000, total: 630000000, nights: 240, occ: 93, bookings: 86, adr: 2625000 },
    { year: 2025, month: 9, roomRevenue: 310000000, serviceRevenue: 45000000, depositCollected: 120000000, total: 355000000, nights: 150, occ: 68, bookings: 54, adr: 2366000 },
    { year: 2025, month: 10, roomRevenue: 340000000, serviceRevenue: 52000000, depositCollected: 135000000, total: 392000000, nights: 165, occ: 73, bookings: 60, adr: 2375000 },
    { year: 2025, month: 11, roomRevenue: 300000000, serviceRevenue: 42000000, depositCollected: 115000000, total: 342000000, nights: 145, occ: 65, bookings: 52, adr: 2358000 },
    { year: 2025, month: 12, roomRevenue: 530000000, serviceRevenue: 88000000, depositCollected: 210000000, total: 618000000, nights: 235, occ: 92, bookings: 84, adr: 2629000 },
    // 2026
    { year: 2026, month: 1, roomRevenue: 460000000, serviceRevenue: 75000000, depositCollected: 185000000, total: 535000000, nights: 215, occ: 85, bookings: 78, adr: 2488000 },
    { year: 2026, month: 2, roomRevenue: 530000000, serviceRevenue: 88000000, depositCollected: 210000000, total: 618000000, nights: 240, occ: 92, bookings: 88, adr: 2575000 },
    { year: 2026, month: 3, roomRevenue: 420000000, serviceRevenue: 65000000, depositCollected: 165000000, total: 485000000, nights: 195, occ: 79, bookings: 70, adr: 2487000 },
    { year: 2026, month: 4, roomRevenue: 490000000, serviceRevenue: 78000000, depositCollected: 190000000, total: 568000000, nights: 225, occ: 88, bookings: 80, adr: 2524000 },
    { year: 2026, month: 5, roomRevenue: 620000000, serviceRevenue: 105000000, depositCollected: 245000000, total: 725000000, nights: 265, occ: 95, bookings: 96, adr: 2735000 },
    { year: 2026, month: 6, roomRevenue: 710000000, serviceRevenue: 120000000, depositCollected: 280000000, total: 830000000, nights: 295, occ: 99, bookings: 108, adr: 2813000 },
    { year: 2026, month: 7, roomRevenue: 750000000, serviceRevenue: 130000000, depositCollected: 300000000, total: 880000000, nights: 310, occ: 100, bookings: 115, adr: 2838000 },
    { year: 2026, month: 8, roomRevenue: 650000000, serviceRevenue: 110000000, depositCollected: 260000000, total: 760000000, nights: 280, occ: 96, bookings: 100, adr: 2714000 },
    { year: 2026, month: 9, roomRevenue: 380000000, serviceRevenue: 60000000, depositCollected: 150000000, total: 440000000, nights: 180, occ: 75, bookings: 66, adr: 2444000 },
    { year: 2026, month: 10, roomRevenue: 410000000, serviceRevenue: 68000000, depositCollected: 165000000, total: 478000000, nights: 195, occ: 80, bookings: 72, adr: 2451000 },
    { year: 2026, month: 11, roomRevenue: 360000000, serviceRevenue: 55000000, depositCollected: 140000000, total: 415000000, nights: 175, occ: 72, bookings: 62, adr: 2371000 },
    { year: 2026, month: 12, roomRevenue: 640000000, serviceRevenue: 112000000, depositCollected: 255000000, total: 752000000, nights: 275, occ: 96, bookings: 98, adr: 2734000 }
  ];
  return { monthly };
}

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
}

function generateVietQRUrl(amount, content) {
  const cleanContent = encodeURIComponent((content || '').replace(/[^a-zA-Z0-9 ]/g, ''));
  return `https://img.vietqr.io/image/${HOTEL_BANK_CONFIG.bankId}-${HOTEL_BANK_CONFIG.accountNo}-${HOTEL_BANK_CONFIG.template}.png?amount=${amount}&addInfo=${cleanContent}&accountName=${encodeURIComponent(HOTEL_BANK_CONFIG.accountName)}`;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [currentUser] = useState(readCurrentUser);

  // Active Tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // Master Data States
  const [rooms, setRooms] = useState(() => {
    const d = localStorage.getItem(STORAGE_KEYS.ROOMS);
    return d ? JSON.parse(d) : [];
  });
  const [bookings, setBookings] = useState(() => {
    const d = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return d ? JSON.parse(d) : [];
  });
  const [staffUsers, setStaffUsers] = useState(() => {
    const d = localStorage.getItem(STORAGE_KEYS.STAFF_USERS);
    return d ? JSON.parse(d) : INITIAL_STAFF_USERS;
  });
  const [rolesConfig, setRolesConfig] = useState(() => {
    const d = localStorage.getItem(STORAGE_KEYS.ROLES_CONFIG);
    return d ? JSON.parse(d) : INITIAL_ROLES;
  });
  const [transactions, setTransactions] = useState(() => {
    const d = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return d ? JSON.parse(d) : [];
  });
  const [historicalRevenue, setHistoricalRevenue] = useState(() => {
    const d = localStorage.getItem(STORAGE_KEYS.HISTORICAL_REVENUE);
    return d ? JSON.parse(d) : generateDefaultHistoricalRevenue();
  });

  // Revenue filters
  const [revYear, setRevYear] = useState('2026');
  const [revPeriod, setRevPeriod] = useState('ALL');
  const [revRoomType, setRevRoomType] = useState('ALL');
  const [revDonutMode, setRevDonutMode] = useState('room');

  // Search & Filter in Tables
  const [searchRoom, setSearchRoom] = useState('');
  const [filterRoomStatus, setFilterRoomStatus] = useState('ALL');
  const [searchTx, setSearchTx] = useState('');
  const [filterTxMethod, setFilterTxMethod] = useState('ALL');
  const [searchStaff, setSearchStaff] = useState('');
  const [filterStaffRole, setFilterStaffRole] = useState('ALL');

  // Modals
  const [viewCccdBooking, setViewCccdBooking] = useState(null);
  const [checkoutRoom, setCheckoutRoom] = useState(null);
  const [checkoutBooking, setCheckoutBooking] = useState(null);
  const [checkoutMethod, setCheckoutMethod] = useState('VietQR');
  const [cashGiven, setCashGiven] = useState(0);

  const [isNewRoomModalOpen, setIsNewRoomModalOpen] = useState(false);
  const [newRoomForm, setNewRoomForm] = useState({ id: '', name: '', type: 'Standard', price: 1000000, image: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=600&q=80' });

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({ id: '', name: '', email: '', phone: '', roleId: 'receptionist', status: 'active' });

  const [isNewRoleModalOpen, setIsNewRoleModalOpen] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({ id: '', name: '', badgeColor: '#0284c7', description: '' });

  const [isManualTxModalOpen, setIsManualTxModalOpen] = useState(false);
  const [manualTxForm, setManualTxForm] = useState({ customer: '', amount: 1000000, method: 'VietQR', reason: '' });

  // Toast notifications
  const [toasts, setToasts] = useState([]);
  const showToast = (title, message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  // Chart references
  const trendCanvasRef = useRef(null);
  const donutCanvasRef = useRef(null);
  const trendChartInstance = useRef(null);
  const donutChartInstance = useRef(null);

  // Permissions are derived from the authenticated session, never a role picker.
  const activeStaff = staffUsers.find(s => s.id === currentUser?.id)
    || (currentUser ? {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      roleId: currentUser.roleId,
      status: 'active'
    } : null);
  const activeRole = rolesConfig.find(r => r.id === activeStaff?.roleId) || rolesConfig[0];

  const hasPermission = (permKey) => {
    return !!(activeRole?.permissions && activeRole.permissions[permKey]);
  };

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  }, [rooms]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  }, [bookings]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STAFF_USERS, JSON.stringify(staffUsers));
  }, [staffUsers]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROLES_CONFIG, JSON.stringify(rolesConfig));
  }, [rolesConfig]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HISTORICAL_REVENUE, JSON.stringify(historicalRevenue));
  }, [historicalRevenue]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await revokeSession();
    } catch {
      // The local session must still be cleared if the API cannot be reached.
    }
    localStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_STAFF_ID);
    showToast('Đã đăng xuất', 'Đã thoát phiên quản trị viên.', 'info');
    navigate('/login');
  };

  // Calculate 3-Year Revenue Stats
  const calculateRevenueStats = () => {
    let targetMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    if (revPeriod === 'Q1') targetMonths = [1, 2, 3];
    else if (revPeriod === 'Q2') targetMonths = [4, 5, 6];
    else if (revPeriod === 'Q3') targetMonths = [7, 8, 9];
    else if (revPeriod === 'Q4') targetMonths = [10, 11, 12];

    let multiplier = 1.0;
    if (revRoomType === 'Deluxe') multiplier = 0.22;
    else if (revRoomType === 'Suite') multiplier = 0.28;
    else if (revRoomType === 'Executive') multiplier = 0.25;
    else if (revRoomType === 'Villa') multiplier = 0.25;

    let totalRev = 0, totalRoom = 0, totalService = 0, totalNights = 0, totalDeposit = 0, occSum = 0;
    const liveBookingsRev = bookings.reduce((s, b) => s + (b.totalAmount || 0), 0);
    const liveDeposit = bookings.reduce((s, b) => s + (b.depositAmount || 0), 0);

    targetMonths.forEach(m => {
      if (revYear === 'ALL') {
        const d24 = historicalRevenue.monthly.find(x => x.year === 2024 && x.month === m) || { total:0, roomRevenue:0, serviceRevenue:0, nights:0, depositCollected:0, occ:0 };
        const d25 = historicalRevenue.monthly.find(x => x.year === 2025 && x.month === m) || { total:0, roomRevenue:0, serviceRevenue:0, nights:0, depositCollected:0, occ:0 };
        const d26 = historicalRevenue.monthly.find(x => x.year === 2026 && x.month === m) || { total:0, roomRevenue:0, serviceRevenue:0, nights:0, depositCollected:0, occ:0 };

        totalRev += (d24.total + d25.total + d26.total) * multiplier;
        totalRoom += (d24.roomRevenue + d25.roomRevenue + d26.roomRevenue) * multiplier;
        totalService += (d24.serviceRevenue + d25.serviceRevenue + d26.serviceRevenue) * multiplier;
        totalNights += (d24.nights + d25.nights + d26.nights);
        totalDeposit += (d24.depositCollected + d25.depositCollected + d26.depositCollected) * multiplier;
        occSum += Math.round((d24.occ + d25.occ + d26.occ) / 3);
      } else {
        const y = parseInt(revYear);
        const d = historicalRevenue.monthly.find(x => x.year === y && x.month === m) || { total:0, roomRevenue:0, serviceRevenue:0, nights:0, depositCollected:0, occ:0 };
        let mTotal = d.total * multiplier;
        let mDep = d.depositCollected * multiplier;
        if (y === 2026 && m === 10) {
          mTotal += liveBookingsRev * multiplier;
          mDep += liveDeposit * multiplier;
        }
        totalRev += mTotal;
        totalRoom += d.roomRevenue * multiplier;
        totalService += d.serviceRevenue * multiplier;
        totalNights += d.nights;
        totalDeposit += mDep;
        occSum += d.occ;
      }
    });

    const avgOcc = targetMonths.length > 0 ? Math.round(occSum / targetMonths.length) : 0;
    const adr = totalNights > 0 ? Math.round(totalRev / totalNights) : 0;
    const revPar = Math.round(adr * (avgOcc / 100));
    const settled = Math.max(0, totalRev - totalDeposit);

    return { totalRev, totalRoom, totalService, totalNights, avgOcc, adr, revPar, totalDeposit, settled };
  };

  const revStats = calculateRevenueStats();

  // Render Chart.js when tab is dashboard
  useEffect(() => {
    if (activeTab !== 'dashboard') return;
    if (typeof window.Chart === 'undefined') return;

    let targetMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    if (revPeriod === 'Q1') targetMonths = [1, 2, 3];
    else if (revPeriod === 'Q2') targetMonths = [4, 5, 6];
    else if (revPeriod === 'Q3') targetMonths = [7, 8, 9];
    else if (revPeriod === 'Q4') targetMonths = [10, 11, 12];

    const monthNames = targetMonths.map(m => `Tháng ${m}`);
    const d24 = targetMonths.map(m => {
      const it = historicalRevenue.monthly.find(x => x.year === 2024 && x.month === m);
      return it ? Math.round(it.total / 1000000) : 0;
    });
    const d25 = targetMonths.map(m => {
      const it = historicalRevenue.monthly.find(x => x.year === 2025 && x.month === m);
      return it ? Math.round(it.total / 1000000) : 0;
    });
    const d26 = targetMonths.map(m => {
      const it = historicalRevenue.monthly.find(x => x.year === 2026 && x.month === m);
      let val = it ? it.total : 0;
      if (m === 10) val += bookings.reduce((s, b) => s + (b.totalAmount || 0), 0);
      return Math.round(val / 1000000);
    });

    // 1. Line Chart
    if (trendCanvasRef.current) {
      if (trendChartInstance.current) trendChartInstance.current.destroy();

      const datasets = [];
      if (revYear === 'ALL' || revYear === '2024') {
        datasets.push({ label: 'Năm 2024 (Tr ₫)', data: d24, borderColor: '#94a3b8', tension: 0.35, fill: false, borderWidth: 2 });
      }
      if (revYear === 'ALL' || revYear === '2025') {
        datasets.push({ label: 'Năm 2025 (Tr ₫)', data: d25, borderColor: '#3b82f6', tension: 0.35, fill: false, borderWidth: 2.5 });
      }
      if (revYear === 'ALL' || revYear === '2026') {
        datasets.push({ label: 'Năm 2026 (Tr ₫)', data: d26, borderColor: '#d4af37', backgroundColor: 'rgba(212, 175, 55, 0.2)', tension: 0.35, fill: true, borderWidth: 3.5 });
      }

      trendChartInstance.current = new window.Chart(trendCanvasRef.current, {
        type: 'line',
        data: { labels: monthNames, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toLocaleString('vi-VN')} Tr ₫ (${(ctx.raw * 1000000).toLocaleString('vi-VN')} ₫)`
              }
            }
          },
          scales: {
            y: { ticks: { callback: (v) => v + ' Tr ₫' } }
          }
        }
      });
    }

    // 2. Donut Chart
    if (donutCanvasRef.current) {
      if (donutChartInstance.current) donutChartInstance.current.destroy();

      const isRoom = revDonutMode === 'room';
      const labels = isRoom ? ['Presidential Villa', 'Executive Suite', 'Premier Family', 'Deluxe Ocean'] : ['VietQR (Napas 24/7)', 'Thẻ tín dụng POS', 'Tiền mặt tại quầy'];
      const data = isRoom ? [36, 28, 22, 14] : [65, 23, 12];
      const colors = isRoom ? ['#d4af37', '#0284c7', '#8b5cf6', '#10b981'] : ['#10b981', '#3b82f6', '#f59e0b'];

      donutChartInstance.current = new window.Chart(donutCanvasRef.current, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
          cutout: '62%'
        }
      });
    }
  }, [activeTab, revYear, revPeriod, revRoomType, revDonutMode, historicalRevenue, bookings]);

  // Export to Excel (.xlsx) using SheetJS or CSV
  const handleExportExcel = (mode) => {
    if (!hasPermission('view_revenue')) {
      showToast('Từ chối quyền hạn', 'Tài khoản của bạn không có quyền trích xuất dữ liệu doanh thu.', 'danger');
      return;
    }

    if (window.XLSX) {
      const wb = window.XLSX.utils.book_new();

      const summaryData = [
        ["GRAND HOTEL & RESORTS"],
        ["BÁO CÁO DOANH THU & CHỈ SỐ TÀI CHÍNH 3 NĂM (2024 - 2026)"],
        [`Thời gian xuất: ${new Date().toLocaleString('vi-VN')} | Đơn vị tính: VNĐ`],
        [],
        ["Tháng", "Doanh Thu 2024", "Doanh Thu 2025", "Doanh Thu 2026", "Tăng Trưởng 26 vs 25", "Đêm Phòng (2026)", "Tỷ Lệ Lấp Đầy", "ADR (2026)"]
      ];

      for (let m = 1; m <= 12; m++) {
        const d24 = historicalRevenue.monthly.find(x => x.year === 2024 && x.month === m) || { total: 0 };
        const d25 = historicalRevenue.monthly.find(x => x.year === 2025 && x.month === m) || { total: 0 };
        const d26 = historicalRevenue.monthly.find(x => x.year === 2026 && x.month === m) || { total: 0, nights: 0, occ: 0, adr: 0 };
        const g = d25.total > 0 ? (((d26.total - d25.total) / d25.total) * 100).toFixed(1) + '%' : 'N/A';
        summaryData.push([`Tháng ${m}`, d24.total, d25.total, d26.total, g, d26.nights, d26.occ + '%', d26.adr]);
      }

      const ws = window.XLSX.utils.aoa_to_sheet(summaryData);
      window.XLSX.utils.book_append_sheet(wb, ws, "BaoCao_3Nam");
      window.XLSX.writeFile(wb, `Grand_Hotel_Bao_Cao_Doanh_Thu_3_Nam_${revYear}.xlsx`);
      showToast('Xuất Excel thành công', 'File báo cáo đã được tải xuống chuẩn .xlsx!', 'success');
    } else {
      showToast('Thông báo', 'Đang tạo bản tải xuống CSV UTF-8...', 'info');
    }
  };

  // Quick Action: Check-in Room
  const handleQuickCheckIn = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const guestName = prompt('Nhập họ tên khách nhận phòng:', 'NGUYỄN VĂN AN');
    if (!guestName) return;
    const phone = prompt('Nhập số điện thoại khách:', '0901234567') || '0901234567';
    const cccd = prompt('Nhập số CCCD khách:', '079095001234') || '079095001234';

    const bookingId = 'BK-' + Math.floor(1000 + Math.random() * 9000);
    const deposit = 500000;

    const newBooking = {
      id: bookingId,
      customerName: guestName.toUpperCase(),
      phone,
      cccd,
      cccdDate: '2021-08-20',
      cccdPlace: 'Cục CSQLHC về TTXH',
      dob: '1995-05-15',
      cccdFront: DEFAULT_CCCD_FRONT,
      cccdBack: DEFAULT_CCCD_BACK,
      roomId: room.id,
      roomName: room.name,
      checkIn: new Date().toISOString().split('T')[0],
      checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      nights: 1,
      addons: [],
      minibar: 0,
      totalAmount: room.price,
      depositAmount: deposit,
      depositMethod: 'Tiền mặt',
      paidAmount: deposit,
      remainingAmount: room.price - deposit,
      status: 'Đã check-in',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setBookings([newBooking, ...bookings]);
    setRooms(rooms.map(r => r.id === roomId ? { ...r, status: 'Đang thuê', currentGuest: guestName.toUpperCase() } : r));

    setTransactions([{
      id: 'TX-' + Math.floor(100 + Math.random() * 900),
      bookingId,
      customerName: guestName.toUpperCase(),
      type: `Cọc trực tiếp phòng ${roomId}`,
      method: 'Tiền mặt',
      amount: deposit,
      date: new Date().toLocaleString('vi-VN'),
      staff: activeStaff?.name || 'Lễ Tân'
    }, ...transactions]);

    showToast('Check-in hoàn tất', `Phòng ${roomId} đã giao cho khách ${guestName.toUpperCase()}.`, 'success');
  };

  // Open Checkout Modal
  const handleOpenCheckout = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const b = bookings.find(x => x.roomId === roomId && x.status === 'Đã check-in') || bookings.find(x => x.roomId === roomId);

    setCheckoutRoom(room);
    setCheckoutBooking(b);
    setCheckoutMethod('VietQR');
    setCashGiven(b ? (b.remainingAmount + 150000) : room.price);
  };

  // Finalize Checkout
  const handleFinalizeCheckout = () => {
    if (!checkoutRoom) return;
    const roomId = checkoutRoom.id;

    setRooms(rooms.map(r => r.id === roomId ? { ...r, status: 'Đang dọn', currentGuest: null } : r));
    if (checkoutBooking) {
      setBookings(bookings.map(b => b.id === checkoutBooking.id ? { ...b, status: 'Đã hoàn thành', remainingAmount: 0 } : b));
    }

    setTransactions([{
      id: 'TX-' + Math.floor(100 + Math.random() * 900),
      bookingId: checkoutBooking ? checkoutBooking.id : `P-${roomId}`,
      customerName: checkoutBooking ? checkoutBooking.customerName : 'Khách Lưu Trú',
      type: `Quyết toán trả phòng ${roomId}`,
      method: checkoutMethod,
      amount: checkoutBooking ? (checkoutBooking.remainingAmount + 150000) : checkoutRoom.price,
      date: new Date().toLocaleString('vi-VN'),
      staff: activeStaff?.name || 'Lễ Tân'
    }, ...transactions]);

    setCheckoutRoom(null);
    setCheckoutBooking(null);
    showToast('Quyết toán thành công!', `Phòng ${roomId} đã hoàn tất thanh toán và chuyển sang buồng phòng dọn dẹp.`, 'success');
  };

  // Complete Room Cleaning
  const handleCompleteCleaning = (roomId) => {
    setRooms(rooms.map(r => r.id === roomId ? { ...r, status: 'Trống', currentGuest: null } : r));
    showToast('Hoàn tất dọn phòng', `Phòng ${roomId} đã sạch sẽ và sẵn sàng đón khách mới!`, 'info');
  };

  // Confirm Check-in for Reserved Room
  const handleConfirmReservedCheckIn = (roomId) => {
    setRooms(rooms.map(r => r.id === roomId ? { ...r, status: 'Đang thuê' } : r));
    setBookings(bookings.map(b => b.roomId === roomId && b.status === 'Chờ check-in' ? { ...b, status: 'Đã check-in' } : b));
    showToast('Check-in thành công', `Đã giao chìa khóa phòng ${roomId} cho khách lưu trú.`, 'success');
  };

  // Cancel Booking
  const handleCancelBooking = (bookingId) => {
    if (!window.confirm(`Bạn có chắc muốn hủy đơn đặt ${bookingId}?`)) return;
    const b = bookings.find(x => x.id === bookingId);
    setBookings(bookings.map(x => x.id === bookingId ? { ...x, status: 'Đã hủy' } : x));
    if (b) {
      setRooms(rooms.map(r => r.id === b.roomId && r.status === 'Đã đặt' ? { ...r, status: 'Trống', currentGuest: null } : r));
    }
    showToast('Đã hủy đơn', `Đơn ${bookingId} đã được hủy bỏ và phòng đã trống trở lại.`, 'info');
  };

  // Reset all system data to initial demo state
  const handleResetDemoData = () => {
    if (!window.confirm('Khôi phục toàn bộ danh sách phòng, đơn đặt phòng, sổ quỹ, doanh thu và nhân viên về mặc định ban đầu?')) return;
    localStorage.removeItem(STORAGE_KEYS.ROOMS);
    localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
    localStorage.removeItem(STORAGE_KEYS.STAFF_USERS);
    localStorage.removeItem(STORAGE_KEYS.ROLES_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_STAFF_ID);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.HISTORICAL_REVENUE);
    window.location.reload();
  };

  // Filtered lists
  const filteredRoomsList = rooms.filter(r => {
    const s = searchRoom.toLowerCase();
    const matchSearch = r.id.includes(s) || r.name.toLowerCase().includes(s) || r.type.toLowerCase().includes(s);
    const matchStatus = filterRoomStatus === 'ALL' || r.status === filterRoomStatus;
    return matchSearch && matchStatus;
  });

  const filteredTxList = transactions.filter(t => {
    const s = searchTx.toLowerCase();
    const matchSearch = t.id.toLowerCase().includes(s) || t.customerName.toLowerCase().includes(s) || t.bookingId.toLowerCase().includes(s);
    const matchMethod = filterTxMethod === 'ALL' || t.method === filterTxMethod;
    return matchSearch && matchMethod;
  });

  const filteredStaffList = staffUsers.filter(s => {
    const q = searchStaff.toLowerCase();
    const matchSearch = s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
    const matchRole = filterStaffRole === 'ALL' || s.roleId === filterStaffRole;
    return matchSearch && matchRole;
  });

  return (
    <div className="admin-container">
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

      <div className="admin-layout">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <i className="fa-solid fa-crown"></i>
            <div className="admin-brand-info">
              <h3>GRAND HOTEL</h3>
              <span>Quản Trị Khách Sạn</span>
            </div>
          </div>

          <ul className="admin-nav">
            <li 
              className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <i className="fa-solid fa-chart-line"></i>
              <span>Dashboard Doanh Thu (3 Năm)</span>
            </li>
            <li 
              className={`admin-nav-item ${activeTab === 'rooms-management' ? 'active' : ''}`}
              onClick={() => setActiveTab('rooms-management')}
            >
              <i className="fa-solid fa-door-open"></i>
              <span>Quản Lý Phòng</span>
            </li>
            <li 
              className={`admin-nav-item ${activeTab === 'bookings-management' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings-management')}
            >
              <i className="fa-solid fa-book-bookmark"></i>
              <span>Quản Lý Đặt Phòng & CCCD</span>
            </li>
            <li 
              className={`admin-nav-item ${activeTab === 'financial-ledger' ? 'active' : ''}`}
              onClick={() => {
                if (!hasPermission('manage_finances')) {
                  showToast('Từ chối truy cập', 'Vai trò hiện tại không có quyền xem sổ quỹ thu chi.', 'danger');
                  return;
                }
                setActiveTab('financial-ledger');
              }}
            >
              <i className="fa-solid fa-money-check-dollar"></i>
              <span>Sổ Quỹ & Thu Chi</span>
            </li>
            <li 
              className={`admin-nav-item ${activeTab === 'users-management' ? 'active' : ''}`}
              onClick={() => {
                if (!hasPermission('view_staff')) {
                  showToast('Từ chối truy cập', 'Vai trò hiện tại không có quyền xem nhân sự.', 'danger');
                  return;
                }
                setActiveTab('users-management');
              }}
            >
              <i className="fa-solid fa-users-gear"></i>
              <span>Quản Lý Phân Quyền</span>
            </li>
            <li 
              className={`admin-nav-item ${activeTab === 'permissions-config' ? 'active' : ''}`}
              onClick={() => {
                if (!hasPermission('config_permissions')) {
                  showToast('Từ chối truy cập', 'Vai trò hiện tại không có quyền cấu hình phân quyền.', 'danger');
                  return;
                }
                setActiveTab('permissions-config');
              }}
            >
              <i className="fa-solid fa-shield-halved"></i>
              <span>Cấu Hình Phân Quyền</span>
            </li>
          </ul>

          <div className="sidebar-bottom">
            <button className="landing-btn btn-outline-gold" style={{ width: '100%', fontSize: '0.85rem' }} onClick={() => navigate('/')}>
              <i className="fa-solid fa-arrow-left"></i> Xem Trang Khách
            </button>
            {hasPermission('system_reset') && (
              <button className="landing-btn btn-dark" style={{ width: '100%', fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.15)' }} onClick={handleResetDemoData}>
                <i className="fa-solid fa-rotate"></i> Reset Dữ Liệu Gốc
              </button>
            )}
          </div>
        </aside>

        {/* Content Area */}
        <main className="admin-content">
          <header className="admin-topbar">
            <h2 className="topbar-title">
              {activeTab === 'dashboard' && 'Bảng Điều Khiển Tổng Quan Doanh Thu (3 Năm)'}
              {activeTab === 'rooms-management' && 'Quản Lý Danh Sách & Trạng Thái Phòng'}
              {activeTab === 'bookings-management' && 'Quản Lý Đơn Đặt Phòng & Định Danh CCCD'}
              {activeTab === 'financial-ledger' && 'Sổ Quỹ Thu Chi & Giao Dịch Tiền Tệ'}
              {activeTab === 'users-management' && 'Quản Lý Nhân Sự & Phân Quyền Vai Trò'}
              {activeTab === 'permissions-config' && 'Cấu Hình Ma Trận Phân Quyền Hệ Thống'}
            </h2>

            <div className="topbar-actions">
              <div className="quick-role-switcher" title="Chức vụ được xác định từ phiên đăng nhập">
                <i className="fa-solid fa-user-shield" style={{ color: 'var(--gold-dark)' }}></i>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {activeStaff?.name || 'Nhân sự'} · {activeRole?.name || 'Nhân sự nội bộ'}
                </span>
              </div>

              <button className="landing-btn btn-sm btn-dark" onClick={handleLogout} title="Đăng xuất">
                <i className="fa-solid fa-arrow-right-from-bracket"></i> Đăng xuất
              </button>
            </div>
          </header>

          <div className="admin-body">
            {/* ================= TAB 1: DASHBOARD ================= */}
            {activeTab === 'dashboard' && (
              <div>
                {/* 3-Year Revenue Toolbar */}
                <div className="revenue-toolbar-card">
                  <div className="rev-tool-title">
                    <h3><i className="fa-solid fa-chart-line" style={{ color: 'var(--gold-primary)' }}></i> BÁO CÁO DOANH THU & CHỈ SỐ TÀI CHÍNH 3 NĂM (2024 - 2026)</h3>
                    <p>Hệ thống thống kê thời gian thực, đối soát tăng trưởng doanh thu & xuất file Excel phục vụ kiểm toán tài chính</p>
                  </div>
                  <div className="rev-filters-wrap">
                    <select className="rev-select" value={revYear} onChange={e => setRevYear(e.target.value)}>
                      <option value="ALL">Tất Cả 3 Năm (2024 - 2026)</option>
                      <option value="2026">Năm 2026 (Năm hiện tại)</option>
                      <option value="2025">Năm 2025</option>
                      <option value="2024">Năm 2024</option>
                    </select>
                    <select className="rev-select" value={revPeriod} onChange={e => setRevPeriod(e.target.value)}>
                      <option value="ALL">Cả Năm (12 Tháng)</option>
                      <option value="Q1">Quý 1 (Tháng 1 - 3)</option>
                      <option value="Q2">Quý 2 (Tháng 4 - 6)</option>
                      <option value="Q3">Quý 3 (Tháng 7 - 9)</option>
                      <option value="Q4">Quý 4 (Tháng 10 - 12)</option>
                    </select>
                    <select className="rev-select" value={revRoomType} onChange={e => setRevRoomType(e.target.value)}>
                      <option value="ALL">Tất Cả Hạng Phòng</option>
                      <option value="Deluxe">Deluxe Ocean View</option>
                      <option value="Suite">Premier Family Suite</option>
                      <option value="Executive">Executive Club Suite</option>
                      <option value="Villa">Presidential Ocean Villa</option>
                    </select>
                    <button className="btn-excel" onClick={() => handleExportExcel('summary')}>
                      <i className="fa-solid fa-file-excel"></i> Xuất Excel Báo Cáo 3 Năm (.xlsx)
                    </button>
                  </div>
                </div>

                {/* 5 Financial KPIs */}
                <div className="rev-kpi-grid">
                  <div className="rev-kpi-card">
                    <div className="rev-kpi-header">
                      <span className="rev-kpi-label">Tổng Doanh Thu Thuần</span>
                      <div className="rev-kpi-icon" style={{ background: 'var(--gold-light)', color: 'var(--gold-dark)' }}><i className="fa-solid fa-sack-dollar"></i></div>
                    </div>
                    <div className="rev-kpi-value" style={{ color: 'var(--gold-dark)' }}>
                      {hasPermission('view_revenue') ? formatVND(revStats.totalRev) : 'Được bảo mật'}
                    </div>
                    <div>
                      <span className="rev-kpi-badge positive"><i className="fa-solid fa-arrow-trend-up"></i> +22.0% YoY</span>
                      <div className="rev-kpi-sub">Lũy kế theo bộ lọc</div>
                    </div>
                  </div>
                  <div className="rev-kpi-card blue">
                    <div className="rev-kpi-header">
                      <span className="rev-kpi-label">Tiền Phòng vs Dịch Vụ</span>
                      <div className="rev-kpi-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}><i className="fa-solid fa-hotel"></i></div>
                    </div>
                    <div className="rev-kpi-value" style={{ fontSize: '1.35rem' }}>
                      {hasPermission('view_revenue') ? formatVND(revStats.totalRoom) : '***'}
                    </div>
                    <div className="rev-kpi-sub">Dịch vụ & Minibar: {hasPermission('view_revenue') ? formatVND(revStats.totalService) : '***'}</div>
                  </div>
                  <div className="rev-kpi-card emerald">
                    <div className="rev-kpi-header">
                      <span className="rev-kpi-label">Số Đêm Phòng & Lấp Đầy</span>
                      <div className="rev-kpi-icon" style={{ background: '#d1fae5', color: '#059669' }}><i className="fa-solid fa-bed"></i></div>
                    </div>
                    <div className="rev-kpi-value" style={{ color: '#059669' }}>
                      {revStats.totalNights.toLocaleString('vi-VN')} Đêm
                    </div>
                    <div className="rev-kpi-sub">Tỷ lệ lấp đầy TB: {revStats.avgOcc}%</div>
                  </div>
                  <div className="rev-kpi-card purple">
                    <div className="rev-kpi-header">
                      <span className="rev-kpi-label">Chỉ Số ADR & RevPAR</span>
                      <div className="rev-kpi-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}><i className="fa-solid fa-chart-pie"></i></div>
                    </div>
                    <div className="rev-kpi-value" style={{ color: '#7c3aed', fontSize: '1.35rem' }}>
                      {formatVND(revStats.adr)}
                    </div>
                    <div className="rev-kpi-sub">RevPAR: {formatVND(revStats.revPar)} / phòng</div>
                  </div>
                  <div className="rev-kpi-card amber">
                    <div className="rev-kpi-header">
                      <span className="rev-kpi-label">Dòng Tiền Cọc & Thực Thu</span>
                      <div className="rev-kpi-icon" style={{ background: '#fef3c7', color: '#d97706' }}><i className="fa-solid fa-money-bill-transfer"></i></div>
                    </div>
                    <div className="rev-kpi-value" style={{ fontSize: '1.35rem', color: '#d97706' }}>
                      {hasPermission('view_revenue') ? formatVND(revStats.totalDeposit) : '***'}
                    </div>
                    <div className="rev-kpi-sub">Thực thu thanh toán: {hasPermission('view_revenue') ? formatVND(revStats.settled) : '***'}</div>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="charts-container-grid">
                  <div className="chart-card">
                    <div className="chart-card-header">
                      <h4><i className="fa-solid fa-chart-column" style={{ color: 'var(--gold-primary)' }}></i> Xu Hướng Doanh Thu 12 Tháng & So Sánh Tăng Trưởng 3 Năm</h4>
                    </div>
                    <div className="chart-canvas-box">
                      <canvas ref={trendCanvasRef}></canvas>
                    </div>
                  </div>
                  <div className="chart-card">
                    <div className="chart-card-header">
                      <h4><i className="fa-solid fa-pie-chart" style={{ color: '#0284c7' }}></i> Cơ Cấu Doanh Thu</h4>
                      <select className="rev-select" style={{ padding: '4px 8px', fontSize: '0.78rem' }} value={revDonutMode} onChange={e => setRevDonutMode(e.target.value)}>
                        <option value="room">Theo Hạng Phòng</option>
                        <option value="payment">Theo Kênh Thanh Toán</option>
                      </select>
                    </div>
                    <div className="chart-canvas-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <canvas ref={donutCanvasRef}></canvas>
                    </div>
                  </div>
                </div>

                {/* 12-Month Matrix Table */}
                <div className="table-card" style={{ marginBottom: '25px' }}>
                  <div className="table-header-box">
                    <div>
                      <h3 className="table-title"><i className="fa-solid fa-table-list" style={{ color: 'var(--gold-primary)' }}></i> Bảng Ma Trận Doanh Thu 12 Tháng & Tăng Trưởng Lũy Kế</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>So sánh đối soát chi tiết từng tháng qua các năm 2024, 2025, 2026</p>
                    </div>
                    <button className="landing-btn btn-sm btn-excel" onClick={() => handleExportExcel('summary')}>
                      <i className="fa-solid fa-file-excel"></i> Xuất Bảng Này Sang Excel
                    </button>
                  </div>
                  <div className="matrix-table-wrap">
                    <table className="matrix-table">
                      <thead>
                        <tr>
                          <th>Tháng</th>
                          <th>Doanh Thu 2024</th>
                          <th>Doanh Thu 2025</th>
                          <th>Doanh Thu 2026</th>
                          <th>Tăng Trưởng 26 vs 25</th>
                          <th>Đêm Phòng (2026)</th>
                          <th>Tỷ Lệ Lấp Đầy</th>
                          <th>Giá TB ADR (2026)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => {
                          const it24 = historicalRevenue.monthly.find(x => x.year === 2024 && x.month === m) || { total: 0 };
                          const it25 = historicalRevenue.monthly.find(x => x.year === 2025 && x.month === m) || { total: 0 };
                          const it26 = historicalRevenue.monthly.find(x => x.year === 2026 && x.month === m) || { total: 0, nights: 0, occ: 0, adr: 0 };
                          let val26 = it26.total;
                          if (m === 10) val26 += bookings.reduce((s, b) => s + (b.totalAmount || 0), 0);
                          const growth = it25.total > 0 ? (((val26 - it25.total) / it25.total) * 100).toFixed(1) : 0;

                          return (
                            <tr key={m}>
                              <td><strong>Tháng {m < 10 ? '0' + m : m}</strong></td>
                              <td>{formatVND(it24.total)}</td>
                              <td>{formatVND(it25.total)}</td>
                              <td><strong style={{ color: 'var(--gold-dark)' }}>{formatVND(val26)}</strong></td>
                              <td><span className="growth-badge-up"><i className="fa-solid fa-arrow-up"></i> +{growth}%</span></td>
                              <td>{it26.nights} đêm</td>
                              <td>{it26.occ}%</td>
                              <td>{formatVND(it26.adr)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Rooms Quick KPI */}
                <div className="kpi-grid">
                  <div className="kpi-card">
                    <div className="kpi-info">
                      <h4>Tổng Số Phòng</h4>
                      <div className="kpi-val">{rooms.length}</div>
                      <div className="kpi-sub">Hệ thống phòng lưu trú</div>
                    </div>
                    <div className="kpi-icon-box" style={{ background: '#e0f2fe', color: '#0284c7' }}><i className="fa-solid fa-building"></i></div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-info">
                      <h4>Phòng Đang Trống</h4>
                      <div className="kpi-val" style={{ color: 'var(--success)' }}>{rooms.filter(r => r.status === 'Trống').length}</div>
                      <div className="kpi-sub">Sẵn sàng đón khách</div>
                    </div>
                    <div className="kpi-icon-box" style={{ background: 'var(--success-light)', color: 'var(--success)' }}><i className="fa-solid fa-door-open"></i></div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-info">
                      <h4>Phòng Đang Thuê</h4>
                      <div className="kpi-val" style={{ color: 'var(--danger)' }}>{rooms.filter(r => r.status === 'Đang thuê').length}</div>
                      <div className="kpi-sub">Đang có khách ở</div>
                    </div>
                    <div className="kpi-icon-box" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}><i className="fa-solid fa-user-check"></i></div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-info">
                      <h4>Thực Thu Tiền Về</h4>
                      <div className="kpi-val" style={{ color: 'var(--gold-dark)' }}>
                        {hasPermission('view_revenue') ? formatVND(transactions.reduce((s, t) => s + (t.amount || 0), 0)) : '***'}
                      </div>
                      <div className="kpi-sub">Bao gồm cọc & quyết toán</div>
                    </div>
                    <div className="kpi-icon-box" style={{ background: 'var(--gold-light)', color: 'var(--gold-dark)' }}><i className="fa-solid fa-vault"></i></div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 2: ROOMS MANAGEMENT ================= */}
            {activeTab === 'rooms-management' && (
              <div className="table-card">
                <div className="table-header-box">
                  <div>
                    <h3 className="table-title">Danh Sách Quản Lý Trạng Thái Phòng</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Thực hiện Check-in / Trả phòng ngay tại danh sách</p>
                  </div>
                  <div className="room-filter-bar">
                    <input 
                      type="text" 
                      className="search-input" 
                      placeholder="Tìm số phòng / loại phòng..." 
                      value={searchRoom} 
                      onChange={e => setSearchRoom(e.target.value)} 
                    />
                    <select className="search-input" style={{ width: '170px' }} value={filterRoomStatus} onChange={e => setFilterRoomStatus(e.target.value)}>
                      <option value="ALL">Tất cả trạng thái</option>
                      <option value="Trống">Trống (Sẵn sàng)</option>
                      <option value="Đang thuê">Đang thuê</option>
                      <option value="Đã đặt">Đã đặt</option>
                      <option value="Đang dọn">Đang dọn</option>
                    </select>
                    {hasPermission('manage_rooms') && (
                      <button className="landing-btn btn-sm btn-gold" onClick={() => setIsNewRoomModalOpen(true)}>
                        <i className="fa-solid fa-plus"></i> Thêm Phòng Mới
                      </button>
                    )}
                  </div>
                </div>

                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Mã Phòng</th>
                        <th>Hạng Phòng</th>
                        <th>Giá / Đêm</th>
                        <th>Khách Đang Ở</th>
                        <th>Trạng Thái</th>
                        <th>Hành Động Trực Tiếp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRoomsList.map(room => {
                        let badgeClass = 'badge-available';
                        if (room.status === 'Đang thuê') badgeClass = 'badge-occupied';
                        if (room.status === 'Đã đặt') badgeClass = 'badge-reserved';
                        if (room.status === 'Đang dọn') badgeClass = 'badge-cleaning';

                        return (
                          <tr key={room.id}>
                            <td><strong style={{ fontSize: '1.05rem' }}><i className="fa-solid fa-key" style={{ color: 'var(--gold-dark)', marginRight: '5px' }}></i>{room.id}</strong></td>
                            <td>{room.name} <br /><small style={{ color: 'var(--text-muted)' }}>{room.type}</small></td>
                            <td>{formatVND(room.price)}</td>
                            <td>{room.currentGuest ? <strong>{room.currentGuest}</strong> : <span style={{ color: 'var(--text-muted)' }}>---</span>}</td>
                            <td><span className={`status-badge ${badgeClass}`}><span className="status-dot"></span> {room.status}</span></td>
                            <td>
                              {room.status === 'Trống' && (
                                <button className="landing-btn btn-sm btn-emerald" onClick={() => handleQuickCheckIn(room.id)}>
                                  <i className="fa-solid fa-user-plus"></i> Check-in
                                </button>
                              )}
                              {room.status === 'Đã đặt' && (
                                <button className="landing-btn btn-sm btn-blue" onClick={() => handleConfirmReservedCheckIn(room.id)}>
                                  <i className="fa-solid fa-key"></i> Giao Chìa Khóa
                                </button>
                              )}
                              {room.status === 'Đang thuê' && (
                                <button className="landing-btn btn-sm btn-gold" onClick={() => handleOpenCheckout(room.id)}>
                                  <i className="fa-solid fa-receipt"></i> Trả Phòng & Bill
                                </button>
                              )}
                              {room.status === 'Đang dọn' && (
                                <button className="landing-btn btn-sm btn-dark" onClick={() => handleCompleteCleaning(room.id)}>
                                  <i className="fa-solid fa-sparkles"></i> Đã Dọn Xong
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ================= TAB 3: BOOKINGS MANAGEMENT & CCCD ================= */}
            {activeTab === 'bookings-management' && (
              <div className="table-card">
                <div className="table-header-box">
                  <div>
                    <h3 className="table-title">Quản Lý Toàn Bộ Đơn Đặt Phòng & Định Danh CCCD</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Theo dõi tiền cọc, xem chi tiết CCCD & ảnh mặt trước/sau để khai báo tạm trú</p>
                  </div>
                  {hasPermission('create_booking') && (
                    <button className="landing-btn btn-gold btn-sm" onClick={() => handleQuickCheckIn('101')}>
                      <i className="fa-solid fa-plus"></i> Tạo Đơn Đặt Trực Tiếp (Walk-in)
                    </button>
                  )}
                </div>

                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Mã Đơn</th>
                        <th>Khách Hàng</th>
                        <th>Số CCCD / Hộ Chiếu</th>
                        <th>Hồ Sơ CCCD</th>
                        <th>Phòng</th>
                        <th>Tổng Tiền</th>
                        <th>Đã Cọc</th>
                        <th>Còn Lại</th>
                        <th>Trạng Thái</th>
                        <th>Xử Lý</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(b => {
                        let badgeClass = 'badge-reserved';
                        if (b.status === 'Đã check-in') badgeClass = 'badge-occupied';
                        if (b.status === 'Đã hoàn thành') badgeClass = 'badge-available';
                        if (b.status === 'Đã hủy') badgeClass = 'badge-cleaning';

                        return (
                          <tr key={b.id}>
                            <td><strong>{b.id}</strong></td>
                            <td><strong>{b.customerName}</strong><br /><small style={{ color: 'var(--text-muted)' }}>{b.phone}</small></td>
                            <td><strong style={{ color: 'var(--navy-dark)' }}>{b.cccd || '---'}</strong></td>
                            <td>
                              <button className="landing-btn btn-sm btn-outline-gold" onClick={() => setViewCccdBooking(b)}>
                                <i className="fa-solid fa-id-card"></i> Xem CCCD
                              </button>
                            </td>
                            <td>Phòng {b.roomId}</td>
                            <td><strong>{hasPermission('view_revenue') ? formatVND(b.totalAmount) : '***'}</strong></td>
                            <td><span className="status-badge badge-deposit">{hasPermission('view_revenue') ? formatVND(b.depositAmount) : '***'}</span></td>
                            <td><strong style={{ color: 'var(--danger)' }}>{hasPermission('view_revenue') ? formatVND(b.remainingAmount) : '***'}</strong></td>
                            <td><span className={`status-badge ${badgeClass}`}><span className="status-dot"></span> {b.status}</span></td>
                            <td>
                              {b.status === 'Chờ check-in' && (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button className="landing-btn btn-sm btn-blue" onClick={() => handleConfirmReservedCheckIn(b.roomId)}>
                                    <i className="fa-solid fa-check"></i> Check-in
                                  </button>
                                  <button className="landing-btn btn-sm btn-dark" onClick={() => handleCancelBooking(b.id)} title="Hủy đơn">
                                    <i className="fa-solid fa-xmark"></i>
                                  </button>
                                </div>
                              )}
                              {b.status === 'Đã check-in' && (
                                <button className="landing-btn btn-sm btn-gold" onClick={() => handleOpenCheckout(b.roomId)}>
                                  <i className="fa-solid fa-receipt"></i> Trả Phòng & Bill
                                </button>
                              )}
                              {b.status === 'Đã hoàn thành' && (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}><i className="fa-solid fa-check-double"></i> Đã quyết toán</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ================= TAB 4: FINANCIAL LEDGER ================= */}
            {activeTab === 'financial-ledger' && (
              <div>
                <div className="kpi-grid">
                  <div className="kpi-card">
                    <div className="kpi-info">
                      <h4>Tổng Thực Thu Đã Vào Két</h4>
                      <div className="kpi-val" style={{ color: 'var(--success)' }}>
                        {formatVND(transactions.reduce((s, t) => s + (t.amount || 0), 0))}
                      </div>
                      <div className="kpi-sub">Bao gồm cọc & quyết toán</div>
                    </div>
                    <div className="kpi-icon-box" style={{ background: 'var(--success-light)', color: 'var(--success)' }}><i className="fa-solid fa-vault"></i></div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-info">
                      <h4>Chuyển Khoản VietQR</h4>
                      <div className="kpi-val" style={{ color: '#0284c7' }}>
                        {formatVND(transactions.filter(t => t.method === 'VietQR').reduce((s, t) => s + t.amount, 0))}
                      </div>
                      <div className="kpi-sub">{transactions.filter(t => t.method === 'VietQR').length} giao dịch quét mã</div>
                    </div>
                    <div className="kpi-icon-box" style={{ background: '#e0f2fe', color: '#0284c7' }}><i className="fa-solid fa-qrcode"></i></div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-info">
                      <h4>Tiền Mặt Tại Quầy</h4>
                      <div className="kpi-val" style={{ color: 'var(--gold-dark)' }}>
                        {formatVND(transactions.filter(t => t.method === 'Tiền mặt').reduce((s, t) => s + t.amount, 0))}
                      </div>
                      <div className="kpi-sub">{transactions.filter(t => t.method === 'Tiền mặt').length} lần thu tiền mặt</div>
                    </div>
                    <div className="kpi-icon-box" style={{ background: 'var(--gold-light)', color: 'var(--gold-dark)' }}><i className="fa-solid fa-money-bill-wave"></i></div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-info">
                      <h4>Tiền Cọc Đang Giữ Chờ Check-in</h4>
                      <div className="kpi-val" style={{ color: 'var(--purple)' }}>
                        {formatVND(bookings.filter(b => b.status === 'Chờ check-in' || b.status === 'Đã check-in').reduce((s, b) => s + (b.depositAmount || 0), 0))}
                      </div>
                      <div className="kpi-sub">Sẽ khấu trừ khi trả phòng</div>
                    </div>
                    <div className="kpi-icon-box" style={{ background: 'var(--purple-light)', color: 'var(--purple)' }}><i className="fa-solid fa-hand-holding-dollar"></i></div>
                  </div>
                </div>

                <div className="table-card">
                  <div className="table-header-box">
                    <div>
                      <h3 className="table-title">Nhật Ký Giao Dịch Tiền Tệ Chi Tiết</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Ghi nhận tự động tất cả các dòng tiền thu cọc, VietQR và tiền mặt</p>
                    </div>
                    <div className="room-filter-bar">
                      <input 
                        type="text" 
                        className="search-input" 
                        placeholder="Tìm mã đơn, tên khách..." 
                        value={searchTx} 
                        onChange={e => setSearchTx(e.target.value)} 
                      />
                      <select className="search-input" style={{ width: '190px' }} value={filterTxMethod} onChange={e => setFilterTxMethod(e.target.value)}>
                        <option value="ALL">Tất cả phương thức</option>
                        <option value="VietQR">Chuyển khoản VietQR</option>
                        <option value="Tiền mặt">Tiền mặt tại quầy</option>
                        <option value="Thẻ tín dụng">Thẻ tín dụng / POS</option>
                      </select>
                      <button className="landing-btn btn-sm btn-gold" onClick={() => setIsManualTxModalOpen(true)}>
                        <i className="fa-solid fa-plus"></i> Thu Tiền Trực Tiếp
                      </button>
                    </div>
                  </div>

                  <div className="data-table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Mã GD</th>
                          <th>Mã Đơn / Khách Hàng</th>
                          <th>Nội Dung Thu Tiền</th>
                          <th>Phương Thức</th>
                          <th>Số Tiền Thu</th>
                          <th>Thời Gian</th>
                          <th>Nhân Viên Thu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTxList.map(t => (
                          <tr key={t.id}>
                            <td><strong>{t.id}</strong></td>
                            <td><strong>{t.customerName}</strong><br /><small style={{ color: 'var(--text-muted)' }}>{t.bookingId}</small></td>
                            <td>{t.type}</td>
                            <td>
                              <span className="status-badge" style={{ background: t.method === 'VietQR' ? '#e0f2fe' : (t.method === 'Tiền mặt' ? 'var(--gold-light)' : 'var(--purple-light)'), color: t.method === 'VietQR' ? '#0284c7' : (t.method === 'Tiền mặt' ? 'var(--gold-dark)' : 'var(--purple)') }}>
                                {t.method}
                              </span>
                            </td>
                            <td><strong style={{ color: 'var(--success)' }}>+ {formatVND(t.amount)}</strong></td>
                            <td><small style={{ color: 'var(--text-secondary)' }}>{t.date}</small></td>
                            <td><small style={{ fontWeight: 600 }}>{t.staff}</small></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 5: STAFF & USERS ================= */}
            {activeTab === 'users-management' && (
              <div className="table-card">
                <div className="table-header-box">
                  <div>
                    <h3 className="table-title">Danh Sách Nhân Sự & Phân Quyền Vai Trò</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Quản lý tài khoản nội bộ, gán vai trò quyền hạn</p>
                  </div>
                  <div className="room-filter-bar">
                    <input 
                      type="text" 
                      className="search-input" 
                      placeholder="Tìm tên nhân viên..." 
                      value={searchStaff} 
                      onChange={e => setSearchStaff(e.target.value)} 
                    />
                    <select className="search-input" style={{ width: '190px' }} value={filterStaffRole} onChange={e => setFilterStaffRole(e.target.value)}>
                      <option value="ALL">Tất cả vai trò</option>
                      {rolesConfig.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    {hasPermission('manage_staff') && (
                      <button className="landing-btn btn-sm btn-gold" onClick={() => { setStaffForm({ id: '', name: '', email: '', phone: '', roleId: 'receptionist', status: 'active' }); setIsStaffModalOpen(true); }}>
                        <i className="fa-solid fa-user-plus"></i> Thêm Nhân Viên Mới
                      </button>
                    )}
                  </div>
                </div>

                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Mã NV / Họ Tên</th>
                        <th>Email & SĐT</th>
                        <th>Vai Trò (Role)</th>
                        <th>Đăng Nhập Cuối</th>
                        <th>Trạng Thái</th>
                        <th>Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaffList.map(s => {
                        const role = rolesConfig.find(r => r.id === s.roleId) || { name: s.roleId, badgeColor: '#64748b' };
                        const isLocked = s.status === 'locked';

                        return (
                          <tr key={s.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className="user-avatar" style={{ background: role.badgeColor, color: '#fff', width: '34px', height: '34px' }}>
                                  {s.name.charAt(0)}
                                </div>
                                <div>
                                  <strong style={{ color: 'var(--navy-dark)' }}>{s.name}</strong>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{s.id}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div><i className="fa-regular fa-envelope" style={{ color: 'var(--text-muted)', marginRight: '5px' }}></i>{s.email}</div>
                              <small style={{ color: 'var(--text-muted)' }}><i className="fa-solid fa-phone" style={{ marginRight: '5px' }}></i>{s.phone}</small>
                            </td>
                            <td><span className="role-pill" style={{ backgroundColor: role.badgeColor }}><i className="fa-solid fa-shield-cat"></i> {role.name}</span></td>
                            <td><small style={{ color: 'var(--text-secondary)' }}>{s.lastLogin || 'Chưa đăng nhập'}</small></td>
                            <td><span className={`status-badge ${isLocked ? 'badge-locked' : 'badge-active'}`}><span className="status-dot"></span> {isLocked ? 'Đã khóa' : 'Hoạt động'}</span></td>
                            <td>
                              {hasPermission('manage_staff') && (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button className="landing-btn btn-sm btn-outline-gold" onClick={() => { setStaffForm(s); setIsStaffModalOpen(true); }} title="Sửa"><i className="fa-solid fa-pen"></i></button>
                                  <button 
                                    className={`landing-btn btn-sm ${isLocked ? 'btn-emerald' : 'btn-dark'}`}
                                    onClick={() => {
                                      setStaffUsers(staffUsers.map(x => x.id === s.id ? { ...x, status: isLocked ? 'active' : 'locked' } : x));
                                      showToast('Đổi trạng thái', `Tài khoản ${s.name} hiện: ${isLocked ? 'Hoạt động' : 'Đã khóa'}`, 'info');
                                    }}
                                    title={isLocked ? 'Mở khóa' : 'Khóa'}
                                  >
                                    <i className={`fa-solid ${isLocked ? 'fa-lock-open' : 'fa-lock'}`}></i>
                                  </button>
                                  <button 
                                    className="landing-btn btn-sm btn-danger"
                                    onClick={() => {
                                      if (window.confirm(`Xóa nhân viên ${s.name} (${s.id})?`)) {
                                        setStaffUsers(staffUsers.filter(x => x.id !== s.id));
                                        showToast('Đã xóa', `Đã xóa tài khoản ${s.name}.`, 'info');
                                      }
                                    }}
                                    title="Xóa"
                                  >
                                    <i className="fa-solid fa-trash"></i>
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ================= TAB 6: PERMISSIONS MATRIX ================= */}
            {activeTab === 'permissions-config' && (
              <div className="table-card">
                <div className="table-header-box">
                  <div>
                    <h3 className="table-title">Ma Trận Cấu Hình Phân Quyền Hệ Thống</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Tùy chỉnh phân quyền chi tiết cho từng vai trò chức danh</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="landing-btn btn-sm btn-outline-gold" onClick={() => setIsNewRoleModalOpen(true)}>
                      <i className="fa-solid fa-plus"></i> Tạo Vai Trò Mới
                    </button>
                    <button 
                      className="landing-btn btn-sm btn-dark" 
                      onClick={() => {
                        if (window.confirm('Khôi phục ma trận phân quyền về mặc định?')) {
                          setRolesConfig(INITIAL_ROLES);
                          showToast('Đã khôi phục', 'Ma trận quyền đã về trạng thái tiêu chuẩn ban đầu.', 'info');
                        }
                      }}
                    >
                      <i className="fa-solid fa-arrow-rotate-left"></i> Khôi Phục Gốc
                    </button>
                  </div>
                </div>

                <div className="data-table-wrap">
                  <table className="perm-matrix-table">
                    <thead>
                      <tr>
                        <th>Nhóm Chức Năng & Quyền Hạn</th>
                        {rolesConfig.map(r => (
                          <th key={r.id}>
                            <span className="role-pill" style={{ background: r.badgeColor }}>{r.name}</span>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'none', fontWeight: 'normal' }}>{r.id}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PERMISSION_GROUPS.map((group, gIdx) => (
                        <div key={gIdx} style={{ display: 'contents' }}>
                          <tr className="perm-matrix-group-row">
                            <td colSpan={rolesConfig.length + 1}>
                              <i className="fa-solid fa-folder-tree" style={{ marginRight: '8px', color: 'var(--gold-dark)' }}></i>
                              {group.groupName}
                            </td>
                          </tr>
                          {group.permissions.map(perm => (
                            <tr key={perm.key}>
                              <td>
                                <span className="perm-title">{perm.label}</span>
                                <span className="perm-desc">{perm.desc}</span>
                              </td>
                              {rolesConfig.map(r => {
                                const checked = !!(r.permissions && r.permissions[perm.key]);
                                return (
                                  <td key={r.id}>
                                    <input 
                                      type="checkbox" 
                                      className="perm-checkbox"
                                      checked={checked}
                                      onChange={e => {
                                        const newConfig = rolesConfig.map(roleItem => {
                                          if (roleItem.id === r.id) {
                                            return {
                                              ...roleItem,
                                              permissions: {
                                                ...roleItem.permissions,
                                                [perm.key]: e.target.checked
                                              }
                                            };
                                          }
                                          return roleItem;
                                        });
                                        setRolesConfig(newConfig);
                                        showToast('Cập nhật quyền', `Đã cập nhật quyền [${perm.label}] cho vai trò [${r.name}].`, 'info');
                                      }}
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </div>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ================= MODAL: ADMIN CCCD VIEWER ================= */}
      {viewCccdBooking && (
        <div className="modal-overlay">
          <div className="modal-card modal-lg">
            <div className="modal-header">
              <h3>Chi Tiết Định Danh CCCD Khách Lưu Trú</h3>
              <button className="modal-close-btn" onClick={() => setViewCccdBooking(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <div className="form-row" style={{ marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>HỌ TÊN KHÁCH:</span>
                    <strong style={{ fontSize: '1.15rem', color: 'var(--navy-dark)', display: 'block' }}>{viewCccdBooking.customerName}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SỐ CCCD / PASSPORT:</span>
                    <strong style={{ fontSize: '1.25rem', color: 'var(--gold-dark)', display: 'block' }}>{viewCccdBooking.cccd || 'CHƯA CẬP NHẬT'}</strong>
                  </div>
                </div>
                <div className="form-row-3" style={{ marginBottom: 0 }}>
                  <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NGÀY SINH:</span> <div><strong>{viewCccdBooking.dob || '---'}</strong></div></div>
                  <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NGÀY CẤP:</span> <div><strong>{viewCccdBooking.cccdDate || '---'}</strong></div></div>
                  <div><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NƠI CẤP:</span> <div><strong>{viewCccdBooking.cccdPlace || '---'}</strong></div></div>
                </div>
              </div>

              <h4 style={{ marginBottom: '12px', color: 'var(--navy-dark)' }}>
                <i className="fa-solid fa-images" style={{ color: 'var(--gold-dark)', marginRight: '6px' }}></i> Ảnh Chụp Căn Cước Công Dân Đối Chiếu:
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Mặt trước:</strong>
                  <img src={viewCccdBooking.cccdFront || DEFAULT_CCCD_FRONT} alt="CCCD Front" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Mặt sau:</strong>
                  <img src={viewCccdBooking.cccdBack || DEFAULT_CCCD_BACK} alt="CCCD Back" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button className="landing-btn btn-gold" onClick={() => setViewCccdBooking(null)}>
                  <i className="fa-solid fa-check"></i> Đã Kiểm Tra & Khớp Thông Tin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CHECKOUT & SETTLEMENT BILL ================= */}
      {checkoutRoom && (
        <div className="modal-overlay">
          <div className="modal-card modal-lg">
            <div className="modal-header">
              <h3>Phiếu Quyết Toán Trả Phòng & Thu Ngân</h3>
              <button className="modal-close-btn" onClick={() => { setCheckoutRoom(null); setCheckoutBooking(null); }}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="invoice-card">
                <div className="invoice-header">
                  <div>
                    <h2 style={{ fontFamily: 'Cinzel, serif', color: 'var(--navy-dark)', fontSize: '1.4rem', margin: 0 }}>GRAND HOTEL & RESORTS</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>Phiếu thanh toán kiêm bàn giao chìa khóa & quyết toán tiền cọc</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="invoice-id">{checkoutBooking ? checkoutBooking.id : 'HD-' + Math.floor(1000 + Math.random() * 9000)}</div>
                    <small>{new Date().toLocaleDateString('vi-VN')}</small>
                  </div>
                </div>

                <div className="form-row" style={{ marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Khách Hàng (CCCD):</div>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--navy-dark)' }}>{checkoutBooking ? checkoutBooking.customerName : (checkoutRoom.currentGuest || 'Khách Lưu Trú')}</strong>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{checkoutBooking?.phone} | CCCD: {checkoutBooking?.cccd || '---'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phòng Lưu Trú:</div>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--gold-dark)' }}>Phòng {checkoutRoom.id}</strong>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{checkoutRoom.name} ({checkoutRoom.type})</div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', borderRadius: 'var(--radius-md)', padding: '16px', marginTop: '15px' }}>
                  <div className="summary-row">
                    <span>Tổng Chi Phí Kỳ Nghỉ:</span>
                    <strong>{formatVND(checkoutBooking ? checkoutBooking.totalAmount + 150000 : checkoutRoom.price + 150000)}</strong>
                  </div>
                  <div className="summary-row" style={{ color: 'var(--purple)' }}>
                    <span><i className="fa-solid fa-hand-holding-dollar"></i> Đã Đặt Cọc Trước Đó:</span>
                    <strong>- {formatVND(checkoutBooking ? checkoutBooking.depositAmount : 0)}</strong>
                  </div>
                  <div className="summary-total" style={{ fontSize: '1.3rem', borderTop: '2px solid var(--gold-primary)', paddingTop: '12px', marginTop: '10px' }}>
                    <span>SỐ TIỀN CÒN PHẢI THU:</span>
                    <span style={{ color: 'var(--danger)' }}>
                      {formatVND(checkoutBooking ? checkoutBooking.remainingAmount + 150000 : checkoutRoom.price + 150000)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment selector */}
              <div style={{ background: '#ffffff', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '20px' }}>
                <label style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--navy-dark)', display: 'block', marginBottom: '10px' }}>
                  <i className="fa-solid fa-cash-register" style={{ color: 'var(--gold-dark)' }}></i> Phương Thức Khách Thanh Toán Số Tiền Còn Lại:
                </label>
                <div className="payment-methods-grid">
                  <div className={`payment-method-card ${checkoutMethod === 'VietQR' ? 'selected' : ''}`} onClick={() => setCheckoutMethod('VietQR')}>
                    <i className="fa-solid fa-qrcode"></i>
                    <strong>VietQR</strong>
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Chuyển khoản</small>
                  </div>
                  <div className={`payment-method-card ${checkoutMethod === 'Tiền mặt' ? 'selected' : ''}`} onClick={() => setCheckoutMethod('Tiền mặt')}>
                    <i className="fa-solid fa-money-bill-1-wave"></i>
                    <strong>Tiền Mặt</strong>
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Tại quầy thu ngân</small>
                  </div>
                  <div className={`payment-method-card ${checkoutMethod === 'Thẻ tín dụng' ? 'selected' : ''}`} onClick={() => setCheckoutMethod('Thẻ tín dụng')}>
                    <i className="fa-regular fa-credit-card"></i>
                    <strong>Quẹt Thẻ POS</strong>
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Visa / Master</small>
                  </div>
                </div>

                {checkoutMethod === 'VietQR' && (
                  <div style={{ marginTop: '15px', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Khách quét mã bên dưới để thanh toán đúng số tiền còn lại:
                    </p>
                    <img 
                      src={generateVietQRUrl(checkoutBooking ? checkoutBooking.remainingAmount + 150000 : checkoutRoom.price, `QUYET TOAN P${checkoutRoom.id}`)} 
                      alt="VietQR Checkout"
                      style={{ width: '160px', height: '160px', borderRadius: '10px', border: '1px solid #cbd5e1', padding: '6px', background: '#fff' }}
                    />
                  </div>
                )}

                {checkoutMethod === 'Tiền mặt' && (
                  <div style={{ background: '#f1f5f9', padding: '14px', borderRadius: '8px', marginTop: '10px' }}>
                    <div className="form-row" style={{ marginBottom: 0 }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>TIỀN KHÁCH ĐƯA (VNĐ):</label>
                        <input 
                          type="number" 
                          value={cashGiven} 
                          onChange={e => setCashGiven(parseFloat(e.target.value) || 0)}
                          style={{ fontWeight: 700, color: 'var(--success)' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>TIỀN THỐI LẠI CHO KHÁCH:</label>
                        <input 
                          type="text" 
                          readOnly 
                          value={formatVND(Math.max(0, cashGiven - (checkoutBooking ? checkoutBooking.remainingAmount + 150000 : checkoutRoom.price)))}
                          style={{ background: '#e2e8f0', fontWeight: 800, color: 'var(--navy-dark)' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button className="landing-btn btn-dark" onClick={() => { setCheckoutRoom(null); setCheckoutBooking(null); }}>Đóng</button>
                <button className="landing-btn btn-outline-gold" onClick={() => window.print()}>
                  <i className="fa-solid fa-print"></i> In Hóa Đơn
                </button>
                <button className="landing-btn btn-gold" onClick={handleFinalizeCheckout}>
                  <i className="fa-solid fa-check-double"></i> Xác Nhận Đã Thu Đủ Tiền & Hoàn Tất Trả Phòng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: MANUAL TRANSACTION ================= */}
      {isManualTxModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Ghi Nhận Thu Tiền / Đặt Cọc Trực Tiếp</h3>
              <button className="modal-close-btn" onClick={() => setIsManualTxModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={e => {
                e.preventDefault();
                setTransactions([{
                  id: 'TX-' + Math.floor(100 + Math.random() * 900),
                  bookingId: 'THU-LE',
                  customerName: manualTxForm.customer.toUpperCase(),
                  type: manualTxForm.reason,
                  method: manualTxForm.method,
                  amount: manualTxForm.amount,
                  date: new Date().toLocaleString('vi-VN'),
                  staff: activeStaff?.name || 'Thủ Quỹ'
                }, ...transactions]);
                setIsManualTxModalOpen(false);
                showToast('Thu tiền thành công', `Đã ghi nhận +${formatVND(manualTxForm.amount)} vào sổ quỹ.`, 'success');
              }}>
                <div className="form-group">
                  <label>Tên Khách Hàng *</label>
                  <input type="text" required value={manualTxForm.customer} onChange={e => setManualTxForm({ ...manualTxForm, customer: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Số Tiền Thu (VNĐ) *</label>
                    <input type="number" required value={manualTxForm.amount} onChange={e => setManualTxForm({ ...manualTxForm, amount: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group">
                    <label>Hình Thức Thanh Toán</label>
                    <select value={manualTxForm.method} onChange={e => setManualTxForm({ ...manualTxForm, method: e.target.value })}>
                      <option value="VietQR">Chuyển khoản VietQR</option>
                      <option value="Tiền mặt">Tiền mặt tại quầy</option>
                      <option value="Thẻ tín dụng">Thẻ tín dụng / POS</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Lý Do / Nội Dung Thu *</label>
                  <input type="text" required placeholder="VD: Phụ thu buffet / Đặt cọc tiệc" value={manualTxForm.reason} onChange={e => setManualTxForm({ ...manualTxForm, reason: e.target.value })} />
                </div>
                <button type="submit" className="landing-btn btn-gold" style={{ width: '100%', marginTop: '10px' }}>
                  <i className="fa-solid fa-file-invoice-dollar"></i> Lưu Giao Dịch Vào Sổ Quỹ
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD NEW ROOM ================= */}
      {isNewRoomModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Thêm Phòng Khách Sạn Mới</h3>
              <button className="modal-close-btn" onClick={() => setIsNewRoomModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={e => {
                e.preventDefault();
                if (rooms.some(r => r.id === newRoomForm.id.trim())) {
                  showToast('Lỗi số phòng', `Phòng ${newRoomForm.id} đã tồn tại!`, 'danger');
                  return;
                }
                const newRoom = {
                  id: newRoomForm.id.trim(),
                  name: newRoomForm.name.trim(),
                  type: newRoomForm.type,
                  price: newRoomForm.price,
                  status: 'Trống',
                  image: newRoomForm.image,
                  beds: 'Giường King Tiêu Chuẩn',
                  view: 'Hướng biển & Thành phố',
                  size: '45m²',
                  maxGuests: 2,
                  currentGuest: null
                };
                setRooms([...rooms, newRoom]);
                setIsNewRoomModalOpen(false);
                showToast('Thêm phòng thành công', `Đã kích hoạt phòng ${newRoom.id} trên toàn hệ thống.`, 'success');
              }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Số Phòng *</label>
                    <input type="text" required placeholder="VD: 501" value={newRoomForm.id} onChange={e => setNewRoomForm({ ...newRoomForm, id: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Hạng Phòng</label>
                    <select value={newRoomForm.type} onChange={e => setNewRoomForm({ ...newRoomForm, type: e.target.value })}>
                      <option value="Standard">Standard Deluxe</option>
                      <option value="Superior">Superior Ocean</option>
                      <option value="Suite">Executive Suite</option>
                      <option value="Villa">Presidential Villa</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Tên Phòng *</label>
                    <input type="text" required placeholder="VD: Sunset Sky Suite" value={newRoomForm.name} onChange={e => setNewRoomForm({ ...newRoomForm, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Giá Mỗi Đêm (VNĐ) *</label>
                    <input type="number" required value={newRoomForm.price} onChange={e => setNewRoomForm({ ...newRoomForm, price: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Đường Dẫn Ảnh (URL) *</label>
                  <input type="url" required value={newRoomForm.image} onChange={e => setNewRoomForm({ ...newRoomForm, image: e.target.value })} />
                </div>
                <button type="submit" className="landing-btn btn-gold" style={{ width: '100%', marginTop: '10px' }}>
                  <i className="fa-solid fa-plus"></i> Thêm Phòng Vào Hệ Thống
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT STAFF ================= */}
      {isStaffModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{staffForm.id ? `Chỉnh Sửa Nhân Sự (${staffForm.id})` : 'Thêm Nhân Sự Mới'}</h3>
              <button className="modal-close-btn" onClick={() => setIsStaffModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={e => {
                e.preventDefault();
                if (staffForm.id) {
                  setStaffUsers(staffUsers.map(s => s.id === staffForm.id ? staffForm : s));
                  showToast('Cập nhật nhân sự', `Đã cập nhật thông tin cho ${staffForm.name}.`, 'success');
                } else {
                  const newId = 'NV-' + String(staffUsers.length + 1).padStart(3, '0');
                  setStaffUsers([...staffUsers, { ...staffForm, id: newId, lastLogin: 'Vừa tạo' }]);
                  showToast('Thêm nhân sự thành công', `Đã cấp tài khoản cho ${staffForm.name} (${newId}).`, 'success');
                }
                setIsStaffModalOpen(false);
              }}>
                <div className="form-group">
                  <label>Họ và Tên Nhân Viên *</label>
                  <input type="text" required value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email Nội Bộ *</label>
                    <input type="email" required value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Số Điện Thoại *</label>
                    <input type="tel" required value={staffForm.phone} onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Vai Trò (Role)</label>
                    <select value={staffForm.roleId} onChange={e => setStaffForm({ ...staffForm, roleId: e.target.value })}>
                      {rolesConfig.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Trạng Thái</label>
                    <select value={staffForm.status} onChange={e => setStaffForm({ ...staffForm, status: e.target.value })}>
                      <option value="active">Đang hoạt động</option>
                      <option value="locked">Tạm khóa</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="landing-btn btn-gold" style={{ width: '100%', marginTop: '10px' }}>
                  <i className="fa-solid fa-user-check"></i> Lưu Thông Tin Nhân Sự
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD NEW ROLE ================= */}
      {isNewRoleModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Tạo Vai Trò Chức Danh Mới</h3>
              <button className="modal-close-btn" onClick={() => setIsNewRoleModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={e => {
                e.preventDefault();
                const id = newRoleForm.id.trim().toLowerCase().replace(/\s+/g, '_');
                if (rolesConfig.some(r => r.id === id)) {
                  showToast('Lỗi mã vai trò', `Mã vai trò '${id}' đã tồn tại!`, 'danger');
                  return;
                }
                const newRole = {
                  id,
                  name: newRoleForm.name.trim(),
                  badgeColor: newRoleForm.badgeColor,
                  description: newRoleForm.description || newRoleForm.name,
                  permissions: { view_kpi: true, manage_rooms: false, manage_bookings: true }
                };
                setRolesConfig([...rolesConfig, newRole]);
                setIsNewRoleModalOpen(false);
                showToast('Tạo vai trò thành công', `Đã thêm vai trò ${newRole.name}.`, 'success');
              }}>
                <div className="form-group">
                  <label>Tên Vai Trò (Chức Danh) *</label>
                  <input type="text" required placeholder="VD: Quản Lý Nhà Hàng" value={newRoleForm.name} onChange={e => setNewRoleForm({ ...newRoleForm, name: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Mã Vai Trò (ID không dấu) *</label>
                    <input type="text" required placeholder="VD: fnb_manager" value={newRoleForm.id} onChange={e => setNewRoleForm({ ...newRoleForm, id: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Màu Sắc Nhận Diện</label>
                    <input type="color" value={newRoleForm.badgeColor} onChange={e => setNewRoleForm({ ...newRoleForm, badgeColor: e.target.value })} style={{ height: '48px', padding: '4px' }} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Mô Tả Trách Nhiệm</label>
                  <textarea rows="2" value={newRoleForm.description} onChange={e => setNewRoleForm({ ...newRoleForm, description: e.target.value })}></textarea>
                </div>
                <button type="submit" className="landing-btn btn-gold" style={{ width: '100%', marginTop: '10px' }}>
                  <i className="fa-solid fa-plus"></i> Khởi Tạo Vai Trò Mới
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
