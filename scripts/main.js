/* ═══════════════════════════════════════════════════
   MAIN — App Init, Routing, Theme, Settings
   ═══════════════════════════════════════════════════ */

(async function () {
  'use strict';

  // ─── Theme ───
  //arpit

  initTheme();

  // ─── Navigation ───
  initNav();

  // ─── Settings Modal ───
  initSettings();

  // ─── Load Data ───
  try {
    const loadingState = document.getElementById('loadingState');
    const tableContainer = document.getElementById('tableContainer');
    const emptyState = document.getElementById('emptyState');

    // Explicitly show loading state and hide table to prevent flicker
    if (loadingState) loadingState.style.display = 'flex';
    if (tableContainer) tableContainer.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';

    const { funds } = await DataLoader.loadData();

    // Data ready, restore table visibility
    if (tableContainer) tableContainer.style.display = 'block';

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
      keyInput.value = 'AI features disabled';
      keyInput.disabled = true;
    }

    function closeSettings() {
      overlay.style.display = 'none';
    }

    settingsBtn.addEventListener('click', openSettings);
    closeBtn.addEventListener('click', closeSettings);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeSettings();
    });

    // Toggle key visibility (disabled)
    keyToggle.addEventListener('click', () => {
      // Disabled
    });

    // Save key (disabled)
    saveBtn.addEventListener('click', () => {
      Utils.showToast('Gemini AI has been replaced by local analysis.');
    });

    // Clear key (disabled)
    clearBtn.addEventListener('click', () => {
      Utils.showToast('Gemini AI has been replaced by local analysis.');
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
