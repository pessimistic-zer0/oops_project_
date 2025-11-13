document.addEventListener('DOMContentLoaded', () => {
  const user = requireRole(['admin']);
  document.getElementById('role').textContent = user.role;
  document.getElementById('logoutBtn').addEventListener('click', logout);

  const workerSelect = document.getElementById('workerSelect');
  const complaintsEl = document.getElementById('complaints');

  // New: Create User form elements
  const createUserForm = document.getElementById('createUserForm');
  const cuName = document.getElementById('cuName');
  const cuEmail = document.getElementById('cuEmail');
  const cuPassword = document.getElementById('cuPassword');
  const cuRole = document.getElementById('cuRole');
  const cuPhone = document.getElementById('cuPhone');
  const cuRoomNumber = document.getElementById('cuRoomNumber');
  const cuError = document.getElementById('cuError');
  const cuSuccess = document.getElementById('cuSuccess');

  async function loadWorkers() {
    const data = await api('/api/admin/users?role=worker');
    workerSelect.innerHTML = '<option value="">Select worker...</option>';
    (data.items || []).forEach(w => {
      const opt = document.createElement('option');
      opt.value = w._id;
      opt.textContent = `${w.name} (${w.email})`;
      workerSelect.appendChild(opt);
    });
  }

  async function loadComplaints() {
    const data = await api('/api/complaints');
    const items = data.items || [];
    complaintsEl.innerHTML = items.length ? '' : '<small class="muted">No complaints.</small>';
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
        <div class="row" style="margin-top:8px;">
          <button class="btn" data-id="${c._id}">Assign to selected worker</button>
        </div>
      `;
      complaintsEl.appendChild(div);
    }

    complaintsEl.querySelectorAll('button[data-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const workerId = workerSelect.value;
        if (!workerId) return alert('Select a worker first');
        try {
          await api(`/api/complaints/${btn.dataset.id}/assign`, {
            method: 'PUT',
            body: { workerId }
          });
          await loadComplaints();
        } catch (e) {
          alert(e.message || 'Assignment failed');
        }
      });
    });
  }

  async function loadAnalytics() {
    const [overview, byCat, resolution] = await Promise.all([
      api('/api/analytics/complaints-overview'),
      api('/api/analytics/by-category'),
      api('/api/analytics/resolution-time')
    ]);
    document.getElementById('overview').textContent = JSON.stringify(overview, null, 2);
    document.getElementById('byCategory').textContent = JSON.stringify(byCat, null, 2);
    document.getElementById('resolution').textContent = JSON.stringify(resolution, null, 2);
  }

  // New: handle Create User form submit
  if (createUserForm) {
    createUserForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      cuError.textContent = '';
      cuSuccess.textContent = '';

      const payload = {
        name: cuName.value.trim(),
        email: cuEmail.value.trim(),
        password: cuPassword.value,
        role: cuRole.value,
        phone: cuPhone.value.trim(),
        roomNumber: cuRoomNumber.value.trim()
      };

      if (!payload.name || !payload.email || !payload.password || !payload.role) {
        cuError.textContent = 'Please fill in name, email, password, and role.';
        return;
      }

      try {
        const created = await api('/api/admin/users', {
          method: 'POST',
          body: payload
        });
        cuSuccess.textContent = `Created ${created.role} "${created.name}" (${created.email}).`;
        createUserForm.reset();
        // So new workers appear in the dropdown
        await loadWorkers();
      } catch (err) {
        cuError.textContent = err.message || 'Creation failed';
      }
    });
  }

  (async () => {
    await loadWorkers();
    await loadComplaints();
    await loadAnalytics();
  })();
});