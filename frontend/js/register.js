document.addEventListener('DOMContentLoaded', () => {
  const user = getUser();
  if (user) {
    if (user.role === 'admin') location.href = '/admin.html';
    else if (user.role === 'worker') location.href = '/worker.html';
    else location.href = '/student.html';
    return;
  }

  const form = document.getElementById('registerForm');
  const error = document.getElementById('error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.textContent = '';
    const payload = {
      name: document.getElementById('name').value.trim(),
      roomNumber: document.getElementById('roomNumber').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      password: document.getElementById('password').value
    };
    try {
      const data = await api('/api/auth/register', { method: 'POST', body: payload });
      setToken(data.token);
      setUser(data.user);
      location.href = '/student.html';
    } catch (err) {
      error.textContent = err.message || 'Registration failed';
    }
  });
});