document.addEventListener('DOMContentLoaded', () => {
  const user = requireRole(['student']);
  document.getElementById('role').textContent = user.role;
  document.getElementById('logoutBtn').addEventListener('click', logout);

  const listEl = document.getElementById('list');
  const form = document.getElementById('createForm');
  const error = document.getElementById('error');

  async function load() {
    const data = await api('/api/complaints');
    const items = data.items || [];
    listEl.innerHTML = items.length ? '' : '<small class="muted">No complaints yet.</small>';
    for (const c of items) {
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <div class="header">
          <div>
            <strong>${c.category}</strong>
            <div><small class="muted">${new Date(c.createdAt).toLocaleString()}</small></div>
          </div>
          <span class="badge">${c.status}</span>
        </div>
        <div>${c.description}</div>
        <div class="row" style="gap:8px; margin-top:8px;">
          ${(c.images||[]).map(src => `<img class="thumb" src="${src}"/>`).join('')}
        </div>
      `;
      listEl.appendChild(div);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.textContent = '';
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value.trim();
    const files = document.getElementById('images').files;

    if (!category || !description) {
      error.textContent = 'Category and description are required';
      return;
    }
    const fd = new FormData();
    fd.append('category', category);
    fd.append('description', description);
    Array.from(files).forEach(f => fd.append('images', f));

    try {
      await api('/api/complaints', { method: 'POST', body: fd, isForm: true });
      document.getElementById('description').value = '';
      document.getElementById('images').value = '';
      await load();
    } catch (err) {
      error.textContent = err.message || 'Failed to create complaint';
    }
  });

  load();
});