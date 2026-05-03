/* ═══════════════════════════════════════════════════
   FUND DETAIL PANEL — renders all fund info + charts
   ═══════════════════════════════════════════════════ */

const DetailPanel = (() => {

  let currentFund = null;
  let returnsChart = null;

  /** Open the detail panel for a fund */
  function open(fund) {
    currentFund = fund;
    renderPanel(fund);

    const panel = document.getElementById('detailPanel');
    const overlay = document.getElementById('detailOverlay');
    panel.classList.add('open');
    overlay.classList.add('active');

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Bind close
    overlay.onclick = close;
    document.addEventListener('keydown', onEscape);
  }

  /** Close the panel */
  function close() {
    const panel = document.getElementById('detailPanel');
    const overlay = document.getElementById('detailOverlay');
    panel.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onEscape);

    // Destroy charts
    if (returnsChart) { returnsChart.destroy(); returnsChart = null; }
    currentFund = null;
  }

  function onEscape(e) {
    if (e.key === 'Escape') close();
  }

  /** Render the panel content */
  function renderPanel(fund) {
    const inner = document.getElementById('detailPanelInner');
    const catAvg = DataLoader.getCategoryAverages();

    inner.innerHTML = `
      <!-- Close bar -->
      <div class="detail-close">
        <span class="detail-close-label">Fund Details</span>
        <button class="icon-btn" id="detailCloseBtn" aria-label="Close panel">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Fund Header -->
      <div class="fund-header">
        <div class="fund-badges">
          <span class="fund-badge">Flexi Cap</span>
          <span class="fund-badge fund-badge--plan">${Utils.escapeHtml(fund.plan || 'Growth')}</span>
        </div>
        <h2>${Utils.escapeHtml(fund.fund_name)}</h2>
        <div class="fund-header-meta">
          <span class="meta-item">${Utils.escapeHtml(fund.amc)}</span>
          <span class="meta-divider"></span>
          <span class="meta-item">AUM: ${Utils.formatAUM(fund.aum_cr)}</span>
          ${fund.expense_ratio ? `<span class="meta-divider"></span><span class="meta-item">ER: ${fund.expense_ratio}%</span>` : ''}
        </div>
      </div>

      <!-- Key Metrics Grid -->
      <div class="detail-section">
        <div class="detail-section-title">Key Metrics</div>
        <div class="metrics-grid">
          ${metricCard('3Y CAGR', Utils.formatPercent(fund.cagr_3y), 'Compounded Annual Growth (3 Year)', fund.cagr_3y)}
          ${metricCard('5Y CAGR', Utils.formatPercent(fund.cagr_5y), 'Compounded Annual Growth (5 Year)', fund.cagr_5y)}
          ${metricCard('10Y CAGR', Utils.formatPercent(fund.cagr_10y), 'Compounded Annual Growth (10 Year)', fund.cagr_10y)}
          ${metricCard('Expense Ratio', Utils.formatPercentPlain(fund.expense_ratio), 'Lower is better', null, true)}
          ${metricCard('Sharpe Ratio', Utils.formatNumber(fund.sharpe_ratio), 'Risk-adjusted return. Higher is better')}
          ${metricCard('Volatility', Utils.formatNumber(fund.volatility), 'Std deviation. Lower = more consistent')}
          ${metricCard('P/E Ratio', Utils.formatNumber(fund.pe_ratio), 'Portfolio Price-to-Earnings')}
          ${metricCard('Alpha', Utils.formatPercent(fund.alpha), 'Excess return over benchmark', fund.alpha)}
          ${metricCard('Exit Load', fund.exit_load != null ? fund.exit_load + '%' : 'N/A', 'Fee on early redemption')}
        </div>
      </div>

      <!-- Returns Chart -->
      <div class="detail-section">
        <div class="chart-section">
          <h4>Returns vs Category Average</h4>
          <div class="chart-container">
            <canvas id="returnsChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Category Comparison -->
      <div class="detail-section">
        <div class="detail-section-title">Category Comparison</div>
        <div class="metrics-grid">
          ${metricCard('vs Category (5Y)', fund.returns_vs_cat_5y ? fund.returns_vs_cat_5y.toFixed(2) + 'x' : 'N/A', fund.returns_vs_cat_5y > 1 ? 'Outperforming category' : fund.returns_vs_cat_5y ? 'Underperforming category' : '')}
          ${metricCard('vs Category (10Y)', fund.returns_vs_cat_10y ? fund.returns_vs_cat_10y.toFixed(2) + 'x' : 'N/A', fund.returns_vs_cat_10y > 1 ? 'Outperforming category' : fund.returns_vs_cat_10y ? 'Underperforming category' : '')}
          ${metricCard('Cat. Std Dev', Utils.formatNumber(fund.category_std_dev), 'Category average volatility')}
        </div>
      </div>

      <!-- Fund Info -->
      <div class="detail-section">
        <div class="detail-section-title">Fund Information</div>
        <div class="fund-info-grid">
          <div class="fund-info-item">
            <span class="info-label">Category</span>
            <span class="info-value">${Utils.escapeHtml(fund.category)}</span>
          </div>
          <div class="fund-info-item">
            <span class="info-label">Plan</span>
            <span class="info-value">${Utils.escapeHtml(fund.plan)}</span>
          </div>
          <div class="fund-info-item">
            <span class="info-label">3Y Rolling Return</span>
            <span class="info-value">${Utils.formatPercent(fund.rolling_return_3y)}</span>
          </div>
          <div class="fund-info-item">
            <span class="info-label">Exit Load</span>
            <span class="info-value">${fund.exit_load != null ? fund.exit_load + '%' : 'N/A'}</span>
          </div>
        </div>
      </div>

      <!-- Use CAGR Button -->
      ${(fund.cagr_5y && fund.cagr_5y > 0) ? `
      <button class="btn btn--accent btn--fund-prefill" id="useCagrBtn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 16 12 14 15 10 9 8 12 2 12"/></svg>
        Use ${Utils.escapeHtml(fund.fund_name.split(' ').slice(0,2).join(' '))}'s 5Y CAGR in Calculator
      </button>` : ''}

      <!-- AI Insights Section -->
      <div class="ai-section">
        <div class="ai-section-header">
          <span class="ai-section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
            AI-Powered Insight
          </span>
          <button class="btn btn--ai sparkle-hover" id="generateInsightBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
            ✨ Generate Insight
          </button>
        </div>
        <div id="insightContainer"></div>
      </div>
    `;

    // Bind close
    document.getElementById('detailCloseBtn').addEventListener('click', close);

    // Bind Use CAGR
    const cagrBtn = document.getElementById('useCagrBtn');
    if (cagrBtn) {
      cagrBtn.addEventListener('click', () => {
        close();
        // Switch to calculator - simulate nav click
        document.querySelector('[data-page="calculator"]').click();
        // Navigate to calculator page
        const navCalc = document.getElementById('navCalculator');
        if (navCalc) navCalc.click();
        // Prefill
        setTimeout(() => {
          Calculator.prefillFromFund(fund);
        }, 200);
      });
    }

    // Bind rule-based insight
    const insightBtn = document.getElementById('generateInsightBtn');
    if (insightBtn) {
      insightBtn.addEventListener('click', () => {
        generateRuleBasedInsight(fund);
      });
    }

    // Render returns chart
    setTimeout(() => renderReturnsChart(fund, catAvg), 100);
  }

  /** Generate simple rule-based insight replacing AI */
  function generateRuleBasedInsight(fund) {
    const container = document.getElementById('insightContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="insight-loading">Analyzing fund metrics...</div>';
    
    setTimeout(() => {
      let insight = `<strong>Analysis for ${Utils.escapeHtml(fund.fund_name)}:</strong><br/><br/>`;
      
      if (fund.alpha != null) {
        if (fund.alpha > 0) insight += `✅ <strong>Alpha (${fund.alpha > 2 ? 'Strong' : 'Positive'}):</strong> The fund is outperforming its benchmark by ${fund.alpha.toFixed(2)}%.<br/>`;
        else insight += `⚠️ <strong>Alpha (Negative):</strong> The fund is underperforming its benchmark by ${Math.abs(fund.alpha).toFixed(2)}%.<br/>`;
      } else {
        insight += `ℹ️ <strong>Alpha:</strong> Benchmark comparison is not available.<br/>`;
      }
      
      if (fund.sharpe_ratio != null) {
        if (fund.sharpe_ratio > 1) insight += `✅ <strong>Sharpe Ratio (Good):</strong> A Sharpe ratio of ${fund.sharpe_ratio} indicates strong risk-adjusted returns.<br/>`;
        else insight += `⚠️ <strong>Sharpe Ratio (Weak):</strong> A Sharpe ratio of ${fund.sharpe_ratio} suggests lower compensation for the risk taken.<br/>`;
      }
      
      if (fund.expense_ratio != null) {
        if (fund.expense_ratio < 0.75) insight += `✅ <strong>Expense Ratio (Low):</strong> The expense ratio of ${fund.expense_ratio}% is competitive.<br/>`;
        else insight += `⚠️ <strong>Expense Ratio (High):</strong> The expense ratio of ${fund.expense_ratio}% is relatively high.<br/>`;
      }
      
      insight += `<br/><em>Note: This is a rule-based evaluation and not financial advice.</em>`;
      container.innerHTML = `<div class="insight-content">${insight}</div>`;
    }, 400);
  }

  /** Generate a metric card HTML */
  function metricCard(label, value, hint, colorVal, invertColor) {
    let colorClass = '';
    if (colorVal != null && !isNaN(colorVal) && Number(colorVal) !== 0) {
      if (invertColor) {
        colorClass = Number(colorVal) < 1 ? 'text-positive' : Number(colorVal) > 1.5 ? 'text-negative' : '';
      } else {
        colorClass = Number(colorVal) > 0 ? 'text-positive' : 'text-negative';
      }
    }
    return `<div class="metric-card">
      <span class="metric-label">${label}</span>
      <span class="metric-value ${colorClass}">${value}</span>
      ${hint ? `<span class="metric-hint">${hint}</span>` : ''}
    </div>`;
  }

  /** Render grouped bar chart: Fund vs Category Avg */
  function renderReturnsChart(fund, catAvg) {
    const canvas = document.getElementById('returnsChart');
    if (!canvas) return;

    const labels = ['3Y CAGR', '5Y CAGR', '10Y CAGR'];
    const fundData = [fund.cagr_3y || 0, fund.cagr_5y || 0, fund.cagr_10y || 0];
    const catData = [catAvg.cagr_3y || 0, catAvg.cagr_5y || 0, catAvg.cagr_10y || 0];

    returnsChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Fund',
            data: fundData,
            backgroundColor: 'rgba(0, 137, 123, 0.8)',
            borderColor: 'rgba(0, 137, 123, 1)',
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: 0.7,
            categoryPercentage: 0.6,
          },
          {
            label: 'Category Avg',
            data: catData,
            backgroundColor: 'rgba(156, 163, 175, 0.5)',
            borderColor: 'rgba(156, 163, 175, 0.8)',
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: 0.7,
            categoryPercentage: 0.6,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { family: "'Plus Jakarta Sans'", size: 11 },
              usePointStyle: true,
              pointStyleWidth: 12,
              padding: 16,
              color: '#4A5568'
            }
          },
          tooltip: {
            backgroundColor: '#1A202C',
            titleFont: { family: "'Plus Jakarta Sans'", size: 12 },
            bodyFont: { family: "'IBM Plex Mono'", size: 12 },
            padding: 10,
            cornerRadius: 6,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}%`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: "'Plus Jakarta Sans'", size: 11 },
              color: '#718096'
            }
          },
          y: {
            grid: { color: 'rgba(226, 232, 240, 0.5)' },
            ticks: {
              font: { family: "'IBM Plex Mono'", size: 10 },
              color: '#718096',
              callback: v => v + '%'
            }
          }
        }
      }
    });
  }

  function getCurrentFund() { return currentFund; }

  return { open, close, getCurrentFund };
})();
