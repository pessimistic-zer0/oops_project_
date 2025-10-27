const API_BASE = ''; // same-origin

function getToken() { return localStorage.getItem('token') || ''; }
function setToken(t) { if (t) localStorage.setItem('token', t); else localStorage.removeItem('token'); }
function getUser() { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } }
function setUser(u) { if (u) localStorage.setItem('user', JSON.stringify(u)); else localStorage.removeItem('user'); }

async function api(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = new Headers();
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!isForm) headers.set('Content-Type', 'application/json');

  const opts = { method, headers };
  if (body !== undefined) {
    opts.body = isForm ? body : JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, opts);
  const ct = res.headers.get('Content-Type') || '';
  const isJson = ct.includes('application/json');
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    if (isJson) {
      const err = await res.json().catch(()=> ({}));
      msg = err.error || err.message || msg;
    }
    throw new Error(msg);
  }
  return isJson ? res.json() : res.text();
}

function requireRole(roles) {
  const u = getUser();
  if (!u) location.href = '/login.html';
  if (Array.isArray(roles) && roles.length && !roles.includes(u.role)) {
    if (u.role === 'admin') location.href = '/admin.html';
    else if (u.role === 'worker') location.href = '/worker.html';
    else location.href = '/student.html';
  }
  return u;
}

function logout() {
  setToken('');
  setUser(null);
  location.href = '/';
}