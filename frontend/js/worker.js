document.addEventListener('DOMContentLoaded', () => {
  const user = requireRole(['worker']);
  document.getElementById('role').textContent = user.role;
  document.getElementById('logoutBtn').addEventListener('click', logout);

  const complaintsEl = document.getElementById('complaints');

  async function loadComplaints() {
    const data = await api('/api/complaints');
    const items = data.items || [];
    complaintsEl.innerHTML = items.length ? '' : '<small class="muted">No assigned complaints.</small>';
    for (const c of items) {
      const canStart = c.status === 'Assigned';
      const canResolve = c.status === 'In Progress';
      const div = document.createElement('div');
      div.className = 'card';
      div.dataset.id = c._id;
      div.innerHTML = `
        <div class="header">
          <div>
            <strong>${c.category}</strong>
            <div><small class="muted">${new Date(c.createdAt).toLocaleString()}</small></div>
          </div>
          <span class="badge" data-role="status">${c.status}</span>
        </div>
        <div>${c.description}</div>
        <div class="row" style="gap:8px; margin-top:8px;">
          ${(c.images || []).map(src => `<img class="thumb" src="${src}" alt="evidence"/>`).join('')}
        </div>
        <div class="row" style="margin-top:8px;">
          <button class="btn" data-act="start" ${canStart ? '' : 'disabled'}>Mark In Progress</button>
          <button class="btn" data-act="resolve" ${canResolve ? '' : 'disabled'}>Mark Resolved</button>
        </div>
      `;
      complaintsEl.appendChild(div);
    }
  }

  // Event delegation for dynamic buttons
  complaintsEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;

    const card = btn.closest('.card');
    const id = card?.dataset?.id;
    if (!id) return;

    const act = btn.dataset.act; // 'start' | 'resolve'
    const status = act === 'start' ? 'In Progress' : 'Resolved';

    btn.disabled = true;
    try {
      await api(`/api/complaints/${id}/status`, {
        method: 'PUT',
        body: { status }
      });
      // Reload the list to reflect new status and enable/disable correct buttons
      await loadComplaints();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      // If reload failed, at least re-enable the button so user can try again
      btn.disabled = false;
    }
  });

  loadComplaints();
});