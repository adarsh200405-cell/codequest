// Change this URL if your Express API runs on another host or port.
const API_BASE = 'http://127.0.0.1:5000/api';

async function api(path, options = {}) {
  const token = localStorage.getItem('codequest_token');
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (error) {
    throw new Error('Cannot connect to CodeQuest API. Make sure the backend and MongoDB are running.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed. Please try again.');
  return data;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function currentUser() {
  try { return JSON.parse(localStorage.getItem('codequest_user') || 'null'); }
  catch { return null; }
}
function requireLogin() {
  if (!localStorage.getItem('codequest_token')) {
    window.location.href = 'login.html?next=dashboard.html';
    return false;
  }
  return true;
}
