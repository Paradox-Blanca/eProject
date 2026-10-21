import { Navigate, useLocation } from 'react-router-dom';

const STORAGE_KEYS = {
  USER: 'grand_hotel_current_user_v2',
};

function readCurrentUser() {
  const savedUser = localStorage.getItem(STORAGE_KEYS.USER)
    || sessionStorage.getItem(STORAGE_KEYS.USER);

  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser);
  } catch {
    // A damaged demo session should never make a protected page unusable.
    localStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    return null;
  }
}

/**
 * ProtectedRoute: Kiểm tra trạng thái xác thực và phân quyền truy cập.
 * - Nếu chưa đăng nhập: Điều hướng về /login kèm URL nguồn (redirect).
 * - Nếu không đủ quyền hạn (vd: khách hàng cố truy cập trang quản trị): Điều hướng về Trang Chủ (/).
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const location = useLocation();
  const currentUser = readCurrentUser();

  if (!currentUser) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace state={{ from: location }} />;
  }

  if (requiredRole && currentUser.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
