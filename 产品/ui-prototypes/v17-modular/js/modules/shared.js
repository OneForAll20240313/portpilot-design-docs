/* ============================================================
Shared Module
Auto-extracted from prototype-v16-enhanced.html
PortPilot UI Prototype v16
============================================================ */

function showToast(message, type) {
  type = type || 'info';
  var container = document.getElementById('toastContainer');
  if (!container) return;
  var toast = document.createElement('div');
  var iconMap = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  toast.className = 'toast ' + type;
  toast.innerHTML = '<span class="toast-icon">' + (iconMap[type] || 'ℹ') + '</span><span>' + message + '</span>';
  container.appendChild(toast);
  setTimeout(function() {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 2000);
}

function toggleSwitch(el) {
  el.classList.toggle('on');
}
