document.addEventListener('DOMContentLoaded', () => {
  const user = getUser();
  if (user) {
    if (user.role === 'admin') location.href = '/admin.html';
    else if (user.role === 'worker') location.href = '/worker.html';
    else location.href = '/student.html';
    return;
  }

  const form = document.getElementById('loginForm');
  const error = document.getElementById('error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.textContent = '';
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const data = await api('/api/auth/login', { method: 'POST', body: { email, password } });
      setToken(data.token);
      setUser(data.user);
      if (data.user.role === 'admin') location.href = '/admin.html';
      else if (data.user.role === 'worker') location.href = '/worker.html';
      else location.href = '/student.html';
    } catch (err) {
      error.textContent = err.message || 'Login failed';
    }
  });
});