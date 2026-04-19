/* ═══════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════ */

const Utils = (() => {

  /** Format number in Indian numbering system with ₹ symbol */
  function formatINR(num, decimals = 0) {
    if (num == null || isNaN(num)) return 'N/A';
    const n = Number(num);
    if (Math.abs(n) >= 1e7) {
      return '₹' + (n / 1e7).toFixed(2) + ' Cr';
    }
    if (Math.abs(n) >= 1e5) {
      return '₹' + (n / 1e5).toFixed(2) + ' L';
    }
    return '₹' + n.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  /** Format AUM in Cr */
  function formatAUM(num) {
    if (num == null || isNaN(num) || Number(num) === 0) return 'N/A';
    return '₹' + Number(num).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' Cr';
  }

  /** Format percentage with sign */
  function formatPercent(num, decimals = 2) {
    if (num == null || isNaN(num)) return 'N/A';
    const n = Number(num);
    if (n === 0) return '0.00%';
    const sign = n > 0 ? '+' : '';
    return sign + n.toFixed(decimals) + '%';
  }

  /** Format percentage without sign */
  function formatPercentPlain(num, decimals = 2) {
    if (num == null || isNaN(num)) return 'N/A';
    return Number(num).toFixed(decimals) + '%';
  }

  /** Format generic number */
  function formatNumber(num, decimals = 2) {
    if (num == null || isNaN(num)) return 'N/A';
    return Number(num).toFixed(decimals);
  }

  /** Debounce */
  function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /** localStorage helpers */
  function getFromStorage(key, fallback = null) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  }

  function setToStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { /* quota exceeded or private mode */ }
  }

  function removeFromStorage(key) {
    try {
      localStorage.removeItem(key);
    } catch { /* ignore */ }
  }

  /** Truncate text with ellipsis */
  function truncateText(text, maxLen = 40) {
    if (!text) return '';
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
  }

  /** Escape HTML to prevent XSS */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /** Show toast notification */
  function showToast(message, duration = 3000) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  }

  /** Determine return CSS class */
  function returnClass(val) {
    if (val == null || isNaN(val) || Number(val) === 0) return 'return-badge--neutral';
    return Number(val) > 0 ? 'return-badge--positive' : 'return-badge--negative';
  }

  /** Determine text color class for return values */
  function returnTextClass(val) {
    if (val == null || isNaN(val) || Number(val) === 0) return '';
    return Number(val) > 0 ? 'text-positive' : 'text-negative';
  }

  /** Format INR for calculator (full Indian format) */
  function formatINRFull(num) {
    if (num == null || isNaN(num)) return '₹0';
    const n = Math.round(Number(num));
    if (n >= 1e7) {
      return '₹' + (n / 1e7).toFixed(2) + ' Cr';
    }
    if (n >= 1e5) {
      return '₹' + (n / 1e5).toFixed(2) + ' L';
    }
    return '₹' + n.toLocaleString('en-IN');
  }

  return {
    formatINR,
    formatAUM,
    formatPercent,
    formatPercentPlain,
    formatNumber,
    debounce,
    getFromStorage,
    setToStorage,
    removeFromStorage,
    truncateText,
    escapeHtml,
    showToast,
    returnClass,
    returnTextClass,
    formatINRFull
  };
})();
