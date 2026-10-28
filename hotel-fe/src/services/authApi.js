const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1').replace(/\/$/, '');

let accessToken = null;

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
  } catch (err) {
    const error = new Error('NETWORK_ERROR');
    error.isNetwork = true;
    throw error;
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.success) {
    const error = new Error(payload.message || 'Không thể kết nối đến dịch vụ xác thực.');
    error.status = response.status;
    throw error;
  }
  return payload.data;
}

export async function login(identifier, password) {
  const result = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
  accessToken = result.accessToken;
  return result;
}

export async function logout() {
  await request('/auth/logout', {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  accessToken = null;
}

export function getAccessToken() {
  return accessToken;
}
