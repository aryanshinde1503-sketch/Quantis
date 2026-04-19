/* ═══════════════════════════════════════════════════
   MAIN — App Init, Routing, Theme, Settings
   ═══════════════════════════════════════════════════ */

(async function () {
  'use strict';

  // ─── Theme ───
  initTheme();

  // ─── Navigation ───
  initNav();

  // ─── Settings Modal ───
  initSettings();

  // ─── Load Data ───
  try {
    const { funds } = await DataLoader.loadData();

    // Init modules
    Screener.init(funds);
    ColumnManager.init();
    Calculator.init();

  } catch (err) {
    console.error('Init error:', err);
    showError(err.message || 'Failed to load fund data.');
  }

  // ═══════════════════════════════════════
  //  THEME
  // ═══════════════════════════════════════
  function initTheme() {
    const saved = Utils.getFromStorage('quantis_theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    }
    // Default is light (set in HTML)
  }

  // ═══════════════════════════════════════
  //  NAVIGATION — Tab switching
  // ═══════════════════════════════════════
  function initNav() {
    const tabs = document.querySelectorAll('.nav-tab');
    const pages = document.querySelectorAll('.page');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetPage = tab.dataset.page;

        // Update tabs
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Update pages
        pages.forEach(p => {
          if (p.dataset.page === targetPage) {
            p.classList.add('page--active');
          } else {
            p.classList.remove('page--active');
          }
        });

        // Re-calculate when switching to calculator (charts need visible canvas)
        if (targetPage === 'calculator') {
          setTimeout(() => Calculator.calculate(), 100);
        }
      });
    });
  }

  // ═══════════════════════════════════════
  //  SETTINGS MODAL
  // ═══════════════════════════════════════
  function initSettings() {
    const settingsBtn = document.getElementById('settingsBtn');
    const overlay = document.getElementById('settingsOverlay');
    const closeBtn = document.getElementById('settingsClose');
    const keyInput = document.getElementById('geminiKeyInput');
    const keyToggle = document.getElementById('keyToggle');
    const saveBtn = document.getElementById('saveKeyBtn');
    const clearBtn = document.getElementById('clearKeyBtn');

    function openSettings() {
      overlay.style.display = 'flex';
      // Load saved key
      const saved = Utils.getFromStorage('gemini_api_key');
      if (saved) keyInput.value = saved;
    }

    function closeSettings() {
      overlay.style.display = 'none';
    }

    settingsBtn.addEventListener('click', openSettings);
    closeBtn.addEventListener('click', closeSettings);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeSettings();
    });

    // Toggle key visibility
    keyToggle.addEventListener('click', () => {
      keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
    });

    // Save key
    saveBtn.addEventListener('click', () => {
      const key = keyInput.value.trim();
      if (key) {
        Utils.setToStorage('gemini_api_key', key);
        Utils.showToast('API key saved');
        closeSettings();
      } else {
        Utils.showToast('Please enter an API key');
      }
    });

    // Clear key
    clearBtn.addEventListener('click', () => {
      Utils.removeFromStorage('gemini_api_key');
      keyInput.value = '';
      Utils.showToast('API key cleared');
    });

    // Escape to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.style.display === 'flex') {
        closeSettings();
      }
    });
  }

  // ═══════════════════════════════════════
  //  ERROR STATE
  // ═══════════════════════════════════════
  function showError(msg) {
    const overlay = document.getElementById('errorOverlay');
    const message = document.getElementById('errorMessage');
    const retryBtn = document.getElementById('retryBtn');

    if (message) message.textContent = msg;
    if (overlay) overlay.style.display = 'flex';

    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        window.location.reload();
      });
    }
  }

})();
