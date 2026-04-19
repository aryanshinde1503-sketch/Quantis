/* ═══════════════════════════════════════════════════
   COLUMN MANAGER — Add/Remove/Reorder columns
   ═══════════════════════════════════════════════════ */

const ColumnManager = (() => {

  let isOpen = false;

  function init() {
    const btn = document.getElementById('columnManagerBtn');
    const closeBtn = document.getElementById('cmClose');

    if (btn) btn.addEventListener('click', toggle);
    if (closeBtn) closeBtn.addEventListener('click', close);

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!isOpen) return;
      const cm = document.getElementById('columnManager');
      const btn = document.getElementById('columnManagerBtn');
      if (cm && !cm.contains(e.target) && !btn.contains(e.target)) {
        close();
      }
    });
  }

  function toggle() {
    isOpen ? close() : open();
  }

  function open() {
    isOpen = true;
    const cm = document.getElementById('columnManager');
    cm.style.display = 'flex';
    renderList();
  }

  function close() {
    isOpen = false;
    const cm = document.getElementById('columnManager');
    cm.style.display = 'none';
  }

  function renderList() {
    const cmList = document.getElementById('cmList');
    const allCols = Screener.getAllColumns();
    const activeCols = Screener.getActiveColumns();

    // Sort: active columns first in order, then inactive
    const orderedCols = [
      ...activeCols.map(id => allCols.find(c => c.id === id)).filter(Boolean),
      ...allCols.filter(c => !activeCols.includes(c.id))
    ];

    cmList.innerHTML = orderedCols.map(col => {
      const isActive = activeCols.includes(col.id);
      const isPinned = col.pinned;
      const pinnedClass = isPinned ? 'pinned' : '';

      return `<div class="cm-item ${pinnedClass}" draggable="${!isPinned}" data-col-id="${col.id}">
        <span class="cm-drag" title="Drag to reorder">${isPinned ? '🔒' : '⠿'}</span>
        <input type="checkbox" ${isActive ? 'checked' : ''} ${isPinned ? 'disabled' : ''} data-cm-check="${col.id}" aria-label="Toggle ${col.label}">
        <span class="cm-label">${col.label}</span>
      </div>`;
    }).join('');

    // Bind checkbox events
    cmList.querySelectorAll('input[data-cm-check]').forEach(input => {
      input.addEventListener('change', onColumnToggle);
    });

    // Bind drag events
    initDragAndDrop();
  }

  function onColumnToggle(e) {
    const colId = e.target.dataset.cmCheck;
    const checked = e.target.checked;
    let activeCols = [...Screener.getActiveColumns()];

    if (checked) {
      if (!activeCols.includes(colId)) activeCols.push(colId);
    } else {
      // Enforce minimum 3 columns
      if (activeCols.length <= 3) {
        e.target.checked = true;
        Utils.showToast('Minimum 3 columns required');
        return;
      }
      activeCols = activeCols.filter(id => id !== colId);
    }

    Screener.setColumns(activeCols);
  }

  function initDragAndDrop() {
    const cmList = document.getElementById('cmList');
    let draggedItem = null;

    cmList.querySelectorAll('.cm-item[draggable="true"]').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        draggedItem = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.dataset.colId);
      });

      item.addEventListener('dragend', () => {
        if (draggedItem) draggedItem.classList.remove('dragging');
        draggedItem = null;
        cmList.querySelectorAll('.cm-item').forEach(el => el.classList.remove('drag-over'));
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        item.classList.add('drag-over');
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over');
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('drag-over');

        if (!draggedItem || draggedItem === item) return;

        const fromId = draggedItem.dataset.colId;
        const toId = item.dataset.colId;

        // Don't reorder above pinned fund_name
        if (toId === 'fund_name') return;

        let activeCols = [...Screener.getActiveColumns()];
        const fromIdx = activeCols.indexOf(fromId);
        const toIdx = activeCols.indexOf(toId);

        if (fromIdx === -1) return;

        activeCols.splice(fromIdx, 1);
        const insertIdx = toIdx === -1 ? activeCols.length : (fromIdx < toIdx ? toIdx : toIdx);
        activeCols.splice(insertIdx, 0, fromId);

        // Ensure fund_name stays first
        activeCols = activeCols.filter(id => id !== 'fund_name');
        activeCols.unshift('fund_name');

        Screener.setColumns(activeCols);
        renderList(); // Re-render the list
      });
    });
  }

  return { init, open, close };
})();
