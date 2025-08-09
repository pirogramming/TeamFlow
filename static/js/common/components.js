/* UI components helpers: toast, modal, dropdown, theme */

export function showToast(message, type = 'info', timeout = 3000) {
  const prev = document.querySelector('.toast');
  if (prev) prev.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  if (type === 'error') toast.style.background = '#B91C1C';
  if (type === 'success') toast.style.background = '#065F46';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), timeout);
}

export function toggleModal(id, open = true) {
  const el = document.getElementById(id);
  if (!el) return;
  if (open) el.classList.add('active');
  else el.classList.remove('active');
}

export function setupDropdown(trigger, menu) {
  const t = typeof trigger === 'string' ? document.querySelector(trigger) : trigger;
  const m = typeof menu === 'string' ? document.querySelector(menu) : menu;
  if (!t || !m) return;
  const open = () => (m.style.display = 'block');
  const close = () => (m.style.display = 'none');
  t.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = m.style.display === 'block';
    (isOpen ? close : open)();
  });
  document.addEventListener('click', (e) => {
    if (!m.contains(e.target) && !t.contains(e.target)) close();
  });
}
