/* ═══════════════════════════════════════════════════
   SCREENER — Table Rendering, Sorting, Filtering, Pagination
   ═══════════════════════════════════════════════════ */

const Screener = (() => {

  // ─── Column Definitions ───
  const ALL_COLUMNS = [
    { id: 'fund_name',        label: 'Fund Name',          type: 'string',  default: true, pinned: true,  format: v => v, tooltip: 'Name of the mutual fund scheme.' },
    { id: 'amc',              label: 'AMC',                type: 'string',  default: true, pinned: false, format: v => v, tooltip: 'Asset Management Company managing the fund.' },
    { id: 'aum_cr',           label: 'AUM (₹ Cr)',         type: 'number',  default: true, pinned: false, format: v => Utils.formatAUM(v), tooltip: 'Assets Under Management in Crores. Total size of the fund.' },
    { id: 'expense_ratio',    label: 'Expense Ratio (%)',   type: 'number',  default: true, pinned: false, format: v => Utils.formatPercentPlain(v), tooltip: 'Annual fee as % of AUM. Lower is better.' },
    { id: 'cagr_3y',          label: '3Y CAGR (%)',        type: 'number',  default: true, pinned: false, format: v => Utils.formatPercent(v), color: true, tooltip: 'Compounded Annual Growth Rate over 3 years.' },
    { id: 'cagr_5y',          label: '5Y CAGR (%)',        type: 'number',  default: true, pinned: false, format: v => Utils.formatPercent(v), color: true, tooltip: 'Compounded Annual Growth Rate over 5 years.' },
    { id: 'cagr_10y',         label: '10Y CAGR (%)',       type: 'number',  default: true, pinned: false, format: v => Utils.formatPercent(v), color: true, tooltip: 'Compounded Annual Growth Rate over 10 years.' },
    { id: 'sharpe_ratio',     label: 'Sharpe Ratio',       type: 'number',  default: true, pinned: false, format: v => Utils.formatNumber(v), tooltip: 'Excess return per unit of total risk. Higher is better.' },
    { id: 'volatility',       label: 'Volatility',         type: 'number',  default: false, pinned: false, format: v => Utils.formatNumber(v), tooltip: 'Std deviation of returns. Lower = more consistent.' },
    { id: 'alpha',            label: 'Alpha',              type: 'number',  default: false, pinned: false, format: v => Utils.formatNumber(v), tooltip: 'Excess return over benchmark. Positive = fund added value.' },
    { id: 'pe_ratio',         label: 'P/E Ratio',          type: 'number',  default: false, pinned: false, format: v => Utils.formatNumber(v), tooltip: 'Portfolio Price-to-Earnings ratio. Valuation metric.' },
    { id: 'rolling_return_3y',label: '3Y Rolling Return',  type: 'number',  default: false, pinned: false, format: v => Utils.formatPercent(v), color: true, tooltip: 'Average 3-year return rolled over time. Measures consistency.' },
    { id: 'exit_load',        label: 'Exit Load (%)',       type: 'number',  default: false, pinned: false, format: v => v != null ? v + '%' : 'N/A', tooltip: 'Penalty fee charged for premature withdrawal.' },
    { id: 'returns_vs_cat_5y',label: 'vs Category (5Y)',   type: 'number',  default: false, pinned: false, format: v => v ? Utils.formatNumber(v) + 'x' : 'N/A', tooltip: '5-year returns divided by 5-year category average.' },
    { id: 'returns_vs_cat_10y',label:'vs Category (10Y)',  type: 'number',  default: false, pinned: false, format: v => v ? Utils.formatNumber(v) + 'x' : 'N/A', tooltip: '10-year returns divided by 10-year category average.' },
  ];

  // ─── State ───
  let allFunds = [];
  let filteredFunds = [];
  let activeColumns = [];
  let sortState = { column: null, direction: null }; // 'asc' | 'desc' | null
  let filters = {};      // { columnId: { min, max } or { text } }
  let searchQuery = '';
  let currentPage = 1;
  const PAGE_SIZE = 25;
  let focusedRowIndex = -1;

  // ─── DOM Refs ───
  const tableHead = () => document.getElementById('tableHead');
  const tableBody = () => document.getElementById('tableBody');
  const paginationInfo = () => document.getElementById('paginationInfo');
  const paginationControls = () => document.getElementById('paginationControls');
  const emptyState = () => document.getElementById('emptyState');
  const loadingState = () => document.getElementById('loadingState');
  const tableContainer = () => document.getElementById('tableContainer');
  const filterChips = () => document.getElementById('filterChips');
  const resetAllBtn = () => document.getElementById('resetAllBtn');

  /** Initialize screener */
  function init(funds) {
    allFunds = funds;

    // Load saved column state or use defaults
    const savedCols = Utils.getFromStorage('quantis_columns');
    if (savedCols && savedCols.length >= 3) {
      activeColumns = savedCols.filter(id => ALL_COLUMNS.find(c => c.id === id));
      // Ensure fund_name is always first
      if (!activeColumns.includes('fund_name')) {
        activeColumns.unshift('fund_name');
      }
    } else {
      activeColumns = ALL_COLUMNS.filter(c => c.default).map(c => c.id);
    }

    applyFilters();
    renderTable();
    updateStats();
    bindEvents();

    // Hide loading
    const ls = loadingState();
    if (ls) ls.style.display = 'none';
  }

  /** Get column def by id */
  function getCol(id) {
    return ALL_COLUMNS.find(c => c.id === id);
  }

  /** Apply all filters + search + sort */
  function applyFilters() {
    let result = [...allFunds];

    // Text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f =>
        (f.fund_name && f.fund_name.toLowerCase().includes(q)) ||
        (f.amc && f.amc.toLowerCase().includes(q))
      );
    }

    // Column filters
    Object.keys(filters).forEach(colId => {
      const col = getCol(colId);
      if (!col) return;
      const filter = filters[colId];

      if (col.type === 'number') {
        if (filter.min != null && filter.min !== '') {
          result = result.filter(f => f[colId] != null && Number(f[colId]) >= Number(filter.min));
        }
        if (filter.max != null && filter.max !== '') {
          result = result.filter(f => f[colId] != null && Number(f[colId]) <= Number(filter.max));
        }
      } else if (col.type === 'string' && filter.text) {
        const t = filter.text.toLowerCase();
        result = result.filter(f => f[colId] && f[colId].toLowerCase().includes(t));
      }
    });

    // Sort
    if (sortState.column && sortState.direction) {
      const col = getCol(sortState.column);
      result.sort((a, b) => {
        let va = a[sortState.column];
        let vb = b[sortState.column];
        if (va == null) return 1;
        if (vb == null) return -1;
        if (col.type === 'number') {
          va = Number(va);
          vb = Number(vb);
        } else {
          va = String(va).toLowerCase();
          vb = String(vb).toLowerCase();
        }
        if (va < vb) return sortState.direction === 'asc' ? -1 : 1;
        if (va > vb) return sortState.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    filteredFunds = result;
    currentPage = 1;
    focusedRowIndex = -1;
  }

  /** Get current page's funds */
  function getPageFunds() {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredFunds.slice(start, start + PAGE_SIZE);
  }

  /** Render full table */
  function renderTable() {
    renderHeader();
    renderFilterRow();
    renderBody();
    renderPagination();
    renderFilterChips();
    toggleEmptyState();
    updateResetButton();
  }

  /** Render table header */
  function renderHeader() {
    const thead = tableHead();
    // Only update header row (first row)
    let headerRow = thead.querySelector('tr:first-child');
    if (!headerRow) {
      headerRow = document.createElement('tr');
      thead.appendChild(headerRow);
    }

    headerRow.innerHTML = activeColumns.map(colId => {
      const col = getCol(colId);
      const isSorted = sortState.column === colId;
      const arrow = !isSorted ? '↕' : (sortState.direction === 'asc' ? '↑' : '↓');
      const sortedClass = isSorted ? 'sorted' : '';
      const tooltipAttr = col.tooltip ? `data-tooltip="${col.tooltip}" class="tooltip-trigger ${sortedClass}"` : `class="${sortedClass}"`;

      return `<th ${tooltipAttr} data-col="${colId}">
        <span class="th-content">
          ${Utils.escapeHtml(col.label)}
          <span class="sort-icon">${arrow}</span>
        </span>
      </th>`;
    }).join('');
  }

  /** Render filter row below header */
  function renderFilterRow() {
    const thead = tableHead();
    let filterRow = thead.querySelector('tr.filter-row');
    if (!filterRow) {
      filterRow = document.createElement('tr');
      filterRow.className = 'filter-row';
      thead.appendChild(filterRow);
    }

    filterRow.innerHTML = activeColumns.map(colId => {
      const col = getCol(colId);
      const f = filters[colId] || {};

      if (col.type === 'number') {
        const minVal = f.min != null ? f.min : '';
        const maxVal = f.max != null ? f.max : '';
        const minClass = minVal !== '' ? 'has-value' : '';
        const maxClass = maxVal !== '' ? 'has-value' : '';
        return `<th>
          <div class="filter-inputs">
            <input type="number" class="${minClass}" placeholder="Min" data-filter-col="${colId}" data-filter-type="min" value="${minVal}" step="any" aria-label="${col.label} minimum">
            <span class="filter-sep">–</span>
            <input type="number" class="${maxClass}" placeholder="Max" data-filter-col="${colId}" data-filter-type="max" value="${maxVal}" step="any" aria-label="${col.label} maximum">
          </div>
        </th>`;
      } else {
        const textVal = f.text || '';
        const textClass = textVal ? 'has-value' : '';
        return `<th>
          <input type="text" class="filter-text-input ${textClass}" placeholder="Search..." data-filter-col="${colId}" data-filter-type="text" value="${Utils.escapeHtml(textVal)}" aria-label="Filter ${col.label}">
        </th>`;
      }
    }).join('');
  }

  /** Render table body */
  function renderBody() {
    const tbody = tableBody();
    const pageFunds = getPageFunds();

    if (pageFunds.length === 0) {
      tbody.innerHTML = '';
      return;
    }

    tbody.innerHTML = pageFunds.map((fund, idx) => {
      const cells = activeColumns.map(colId => {
        const col = getCol(colId);
        const val = fund[colId];
        const formatted = col.format(val);

        let classes = '';
        let style = '';

        if (colId === 'fund_name') {
          classes = 'fund-name-cell';
        } else if (col.type === 'number') {
          classes = 'numeric';
          if (col.color && val != null && val !== 0) {
            classes += ' ' + Utils.returnTextClass(val);
          }
        }

        return `<td class="${classes}" data-label="${col.label}">${formatted != null ? formatted : 'N/A'}</td>`;
      }).join('');

      return `<tr data-fund-idx="${fund.id}" tabindex="-1">${cells}</tr>`;
    }).join('');
  }

  /** Render pagination */
  function renderPagination() {
    const total = filteredFunds.length;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const start = (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(currentPage * PAGE_SIZE, total);

    const infoEl = paginationInfo();
    if (infoEl) {
      infoEl.textContent = total > 0
        ? `Showing ${start}–${end} of ${total} funds`
        : 'No funds found';
    }

    const ctrlEl = paginationControls();
    if (!ctrlEl) return;

    if (totalPages <= 1) {
      ctrlEl.innerHTML = '';
      return;
    }

    let html = '';
    html += `<button class="page-btn" data-page="prev" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;

    // Smart page number display
    const pages = getPageNumbers(currentPage, totalPages);
    pages.forEach(p => {
      if (p === '...') {
        html += `<span class="page-btn" style="cursor:default;border:none;">…</span>`;
      } else {
        html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
      }
    });

    html += `<button class="page-btn" data-page="next" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;
    ctrlEl.innerHTML = html;
  }

  /** Smart page number generator */
  function getPageNumbers(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [];
    pages.push(1);
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  }

  /** Render filter chips */
  function renderFilterChips() {
    const container = filterChips();
    if (!container) return;

    let html = '';
    Object.keys(filters).forEach(colId => {
      const col = getCol(colId);
      const f = filters[colId];
      let label = '';

      if (col.type === 'number') {
        if (f.min != null && f.min !== '' && f.max != null && f.max !== '') {
          label = `${col.label}: ${f.min} – ${f.max}`;
        } else if (f.min != null && f.min !== '') {
          label = `${col.label}: ≥ ${f.min}`;
        } else if (f.max != null && f.max !== '') {
          label = `${col.label}: ≤ ${f.max}`;
        }
      } else if (f.text) {
        label = `${col.label}: "${f.text}"`;
      }

      if (label) {
        html += `<div class="filter-chip">
          <span>${Utils.escapeHtml(label)}</span>
          <button class="chip-remove" data-chip-col="${colId}" aria-label="Remove filter for ${col.label}">×</button>
        </div>`;
      }
    });

    if (searchQuery) {
      html += `<div class="filter-chip">
        <span>Search: "${Utils.escapeHtml(searchQuery)}"</span>
        <button class="chip-remove" data-chip-col="__search" aria-label="Clear search">×</button>
      </div>`;
    }

    container.innerHTML = html;
  }

  /** Toggle empty state */
  function toggleEmptyState() {
    const empty = emptyState();
    const scroll = document.querySelector('.table-scroll');
    if (filteredFunds.length === 0 && allFunds.length > 0) {
      if (empty) empty.style.display = 'flex';
      if (scroll) scroll.style.display = 'none';
    } else {
      if (empty) empty.style.display = 'none';
      if (scroll) scroll.style.display = 'block';
    }
  }

  /** Update reset button visibility */
  function updateResetButton() {
    const btn = resetAllBtn();
    const hasFilters = Object.keys(filters).length > 0 || searchQuery || sortState.column;
    if (btn) btn.style.display = hasFilters ? 'inline-flex' : 'none';
  }

  /** Update stats bar */
  function updateStats() {
    const catAvg = DataLoader.getCategoryAverages();

    const totalFunds = document.getElementById('statTotalFunds');
    const avgReturn = document.getElementById('statAvgReturn');
    const totalAUM = document.getElementById('statTotalAUM');
    const avgExpense = document.getElementById('statAvgExpense');

    if (totalFunds) totalFunds.textContent = allFunds.length;
    if (avgReturn) avgReturn.textContent = catAvg.cagr_3y ? catAvg.cagr_3y.toFixed(1) + '%' : 'N/A';
    if (totalAUM) {
      const total = allFunds.reduce((s, f) => s + (f.aum_cr || 0), 0);
      totalAUM.textContent = '₹' + (total / 100000).toFixed(1) + 'L Cr';
    }
    if (avgExpense) avgExpense.textContent = catAvg.expense_ratio ? catAvg.expense_ratio.toFixed(2) + '%' : 'N/A';
  }

  /** Bind events */
  function bindEvents() {
    // Sort on header click
    const thead = tableHead();
    thead.addEventListener('click', (e) => {
      const th = e.target.closest('th[data-col]');
      if (!th) return;

      // Don't sort if clicking on filter row
      if (th.closest('tr.filter-row')) return;

      const colId = th.dataset.col;
      if (sortState.column === colId) {
        if (sortState.direction === 'asc') sortState.direction = 'desc';
        else if (sortState.direction === 'desc') { sortState.column = null; sortState.direction = null; }
      } else {
        sortState.column = colId;
        sortState.direction = 'asc';
      }
      applyFilters();
      renderTable();
    });

    // Filter inputs (debounced)
    thead.addEventListener('input', Utils.debounce((e) => {
      const input = e.target;
      if (!input.dataset.filterCol) return;

      const colId = input.dataset.filterCol;
      const type = input.dataset.filterType;

      if (!filters[colId]) filters[colId] = {};

      if (type === 'text') {
        filters[colId].text = input.value;
        input.classList.toggle('has-value', !!input.value);
      } else {
        filters[colId][type] = input.value;
        input.classList.toggle('has-value', input.value !== '');
      }

      // Clean up empty filters
      const f = filters[colId];
      if ((!f.min || f.min === '') && (!f.max || f.max === '') && !f.text) {
        delete filters[colId];
      }

      applyFilters();
      renderBody();
      renderPagination();
      renderFilterChips();
      toggleEmptyState();
      updateResetButton();
    }, 300));

    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        searchQuery = e.target.value.trim();
        applyFilters();
        renderBody();
        renderPagination();
        renderFilterChips();
        toggleEmptyState();
        updateResetButton();
      }, 300));
    }

    // Pagination clicks
    const pageCtrl = paginationControls();
    if (pageCtrl) {
      pageCtrl.addEventListener('click', (e) => {
        const btn = e.target.closest('.page-btn');
        if (!btn || btn.disabled) return;
        const page = btn.dataset.page;
        if (page === 'prev') currentPage = Math.max(1, currentPage - 1);
        else if (page === 'next') currentPage = Math.min(Math.ceil(filteredFunds.length / PAGE_SIZE), currentPage + 1);
        else currentPage = parseInt(page);
        renderBody();
        renderPagination();
        // Scroll table to top
        const tc = tableContainer();
        if (tc) tc.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    // Row click → open detail panel
    const tbody = tableBody();
    tbody.addEventListener('click', (e) => {
      const tr = e.target.closest('tr[data-fund-idx]');
      if (!tr) return;
      const fundId = tr.dataset.fundIdx;
      const fund = allFunds.find(f => f.id === fundId);
      if (fund) DetailPanel.open(fund);
    });

    // Filter chip remove
    const chipsContainer = filterChips();
    if (chipsContainer) {
      chipsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.chip-remove');
        if (!btn) return;
        const colId = btn.dataset.chipCol;
        if (colId === '__search') {
          searchQuery = '';
          const si = document.getElementById('searchInput');
          if (si) si.value = '';
        } else {
          delete filters[colId];
        }
        applyFilters();
        renderTable();
      });
    }

    // Reset all
    const resetBtn = resetAllBtn();
    if (resetBtn) {
      resetBtn.addEventListener('click', resetAll);
    }

    // Empty state reset
    const emptyResetBtn = document.getElementById('emptyResetBtn');
    if (emptyResetBtn) {
      emptyResetBtn.addEventListener('click', resetAll);
    }

    // Keyboard navigation
    const tableEl = document.getElementById('screenerTable');
    tableEl.addEventListener('keydown', (e) => {
      const rows = Array.from(tableEl.querySelectorAll('tbody tr'));
      if (rows.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusedRowIndex = Math.min(focusedRowIndex + 1, rows.length - 1);
        focusRow(rows);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        focusedRowIndex = Math.max(focusedRowIndex - 1, 0);
        focusRow(rows);
      } else if (e.key === 'Enter' && focusedRowIndex >= 0) {
        e.preventDefault();
        rows[focusedRowIndex].click();
      }
    });
  }

  /** Focus a row for keyboard nav */
  function focusRow(rows) {
    rows.forEach(r => r.classList.remove('focused'));
    if (focusedRowIndex >= 0 && rows[focusedRowIndex]) {
      rows[focusedRowIndex].classList.add('focused');
      rows[focusedRowIndex].scrollIntoView({ block: 'nearest' });
      rows[focusedRowIndex].focus();
    }
  }

  /** Reset all filters, search, sort */
  function resetAll() {
    filters = {};
    searchQuery = '';
    sortState = { column: null, direction: null };
    currentPage = 1;
    const si = document.getElementById('searchInput');
    if (si) si.value = '';
    applyFilters();
    renderTable();
  }

  /** Called by column manager when columns change */
  function setColumns(newCols) {
    activeColumns = newCols;
    Utils.setToStorage('quantis_columns', activeColumns);
    renderTable();
  }

  function getActiveColumns() { return activeColumns; }
  function getAllColumns() { return ALL_COLUMNS; }
  function getFilteredFunds() { return filteredFunds; }

  return {
    init,
    renderTable,
    setColumns,
    getActiveColumns,
    getAllColumns,
    getFilteredFunds,
    resetAll,
    applyFilters
  };
})();
