/* ═══════════════════════════════════════════════════
   RETURNS CALCULATOR — SIP & Lump Sum
   ═══════════════════════════════════════════════════ */

const Calculator = (() => {

  let mode = 'sip'; // 'sip' | 'lumpsum'
  let doughnutChart = null;
  let areaChart = null;
  let prefillFund = null;

  function init() {
    bindModeToggle();
    bindInputs();
    bindExport();
    calculate();
  }

  /** Bind mode toggle */
  function bindModeToggle() {
    const sipBtn = document.getElementById('modeSIP');
    const lumpsumBtn = document.getElementById('modeLumpsum');
    const toggle = document.getElementById('calcModeToggle');

    sipBtn.addEventListener('click', () => {
      mode = 'sip';
      sipBtn.classList.add('active');
      lumpsumBtn.classList.remove('active');
      toggle.removeAttribute('data-mode');
      document.getElementById('sipInputs').style.display = 'flex';
      document.getElementById('lumpsumInputs').style.display = 'none';
      calculate();
    });

    lumpsumBtn.addEventListener('click', () => {
      mode = 'lumpsum';
      lumpsumBtn.classList.add('active');
      sipBtn.classList.remove('active');
      toggle.setAttribute('data-mode', 'lumpsum');
      document.getElementById('sipInputs').style.display = 'none';
      document.getElementById('lumpsumInputs').style.display = 'flex';
      calculate();
    });
  }

  /** Bind input change handlers */
  function bindInputs() {
    // SIP inputs
    syncSlider('sipAmount', 'sipAmountSlider');
    syncSlider('sipReturn', 'sipReturnSlider');
    syncSlider('sipDuration', 'sipDurationSlider');
    syncSlider('sipStepUp', 'sipStepUpSlider');

    // Lump sum inputs
    syncSlider('lsAmount', 'lsAmountSlider');
    syncSlider('lsReturn', 'lsReturnSlider');
    syncSlider('lsDuration', 'lsDurationSlider');
  }

  /** Sync number input ↔ range slider */
  function syncSlider(inputId, sliderId) {
    const input = document.getElementById(inputId);
    const slider = document.getElementById(sliderId);
    if (!input || !slider) return;

    input.addEventListener('input', () => {
      slider.value = input.value;
      updateSliderTrack(slider);
      calculate();
    });

    slider.addEventListener('input', () => {
      input.value = slider.value;
      updateSliderTrack(slider);
      calculate();
    });

    // Initial track
    updateSliderTrack(slider);
  }

  /** Update slider track fill visually */
  function updateSliderTrack(slider) {
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const val = parseFloat(slider.value);
    const pct = ((val - min) / (max - min)) * 100;
    slider.style.background = `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, var(--border) ${pct}%, var(--border) 100%)`;
  }

  /** Calculate returns */
  function calculate() {
    let result;
    if (mode === 'sip') {
      result = calculateSIP();
    } else {
      result = calculateLumpSum();
    }

    updateResultCards(result);
    updateDoughnutChart(result);
    updateAreaChart(result);
    updateYearTable(result);
  }

  /** SIP calculation */
  function calculateSIP() {
    const monthlyAmount = parseFloat(document.getElementById('sipAmount').value) || 0;
    const annualReturn = parseFloat(document.getElementById('sipReturn').value) || 0;
    const years = parseInt(document.getElementById('sipDuration').value) || 0;
    const stepUp = parseFloat(document.getElementById('sipStepUp').value) || 0;
    const monthlyRate = annualReturn / 12 / 100;

    let totalInvested = 0;
    let corpus = 0;
    let currentSIP = monthlyAmount;
    const yearData = [];

    for (let y = 1; y <= years; y++) {
      let yearInvested = 0;
      for (let m = 0; m < 12; m++) {
        corpus = (corpus + currentSIP) * (1 + monthlyRate);
        yearInvested += currentSIP;
      }
      totalInvested += yearInvested;

      yearData.push({
        year: y,
        invested: Math.round(totalInvested),
        returns: Math.round(corpus - totalInvested),
        corpus: Math.round(corpus)
      });

      // Step-up SIP annually
      if (stepUp > 0) {
        currentSIP = currentSIP * (1 + stepUp / 100);
      }
    }

    return {
      totalInvested: Math.round(totalInvested),
      totalReturns: Math.round(corpus - totalInvested),
      totalCorpus: Math.round(corpus),
      multiple: totalInvested > 0 ? (corpus / totalInvested) : 0,
      yearData
    };
  }

  /** Lump Sum calculation */
  function calculateLumpSum() {
    const principal = parseFloat(document.getElementById('lsAmount').value) || 0;
    const annualReturn = parseFloat(document.getElementById('lsReturn').value) || 0;
    const years = parseInt(document.getElementById('lsDuration').value) || 0;

    const yearData = [];
    let corpus = principal;

    for (let y = 1; y <= years; y++) {
      corpus = corpus * (1 + annualReturn / 100);
      yearData.push({
        year: y,
        invested: Math.round(principal),
        returns: Math.round(corpus - principal),
        corpus: Math.round(corpus)
      });
    }

    return {
      totalInvested: Math.round(principal),
      totalReturns: Math.round(corpus - principal),
      totalCorpus: Math.round(corpus),
      multiple: principal > 0 ? (corpus / principal) : 0,
      yearData
    };
  }

  /** Update result cards */
  function updateResultCards(result) {
    document.getElementById('resultInvested').textContent = Utils.formatINRFull(result.totalInvested);
    document.getElementById('resultReturns').textContent = Utils.formatINRFull(result.totalReturns);
    document.getElementById('resultCorpus').textContent = Utils.formatINRFull(result.totalCorpus);
    document.getElementById('resultMultiple').textContent = result.multiple.toFixed(1) + 'x';
  }

  /** Update doughnut chart */
  function updateDoughnutChart(result) {
    const canvas = document.getElementById('doughnutChart');
    if (!canvas) return;

    const data = {
      labels: ['Amount Invested', 'Wealth Gained'],
      datasets: [{
        data: [result.totalInvested, result.totalReturns],
        backgroundColor: ['rgba(156, 163, 175, 0.3)', 'rgba(0, 137, 123, 0.8)'],
        borderColor: ['rgba(156, 163, 175, 0.5)', 'rgba(0, 137, 123, 1)'],
        borderWidth: 2,
        hoverBorderWidth: 3,
        cutout: '68%',
        spacing: 2,
      }]
    };

    if (doughnutChart) {
      doughnutChart.data = data;
      doughnutChart.update('none');
    } else {
      doughnutChart = new Chart(canvas, {
        type: 'doughnut',
        data,
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { family: "'Plus Jakarta Sans'", size: 11, weight: 500 },
                usePointStyle: true,
                pointStyleWidth: 10,
                padding: 14,
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
                label: (ctx) => ` ${ctx.label}: ${Utils.formatINRFull(ctx.parsed)}`
              }
            }
          }
        }
      });
    }
  }

  /** Update area chart */
  function updateAreaChart(result) {
    const canvas = document.getElementById('areaChart');
    if (!canvas) return;

    const labels = result.yearData.map(d => `Year ${d.year}`);
    const corpusData = result.yearData.map(d => d.corpus);
    const investedData = result.yearData.map(d => d.invested);

    const data = {
      labels,
      datasets: [
        {
          label: 'Corpus Value',
          data: corpusData,
          borderColor: 'rgba(0, 137, 123, 1)',
          backgroundColor: 'rgba(0, 137, 123, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(0, 137, 123, 1)',
          borderWidth: 2.5,
        },
        {
          label: 'Amount Invested',
          data: investedData,
          borderColor: 'rgba(156, 163, 175, 0.6)',
          backgroundColor: 'rgba(156, 163, 175, 0.05)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 1.5,
          borderDash: [4, 4],
        }
      ]
    };

    if (areaChart) {
      areaChart.data = data;
      areaChart.update('none');
    } else {
      areaChart = new Chart(canvas, {
        type: 'line',
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { family: "'Plus Jakarta Sans'", size: 11, weight: 500 },
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
              padding: 12,
              cornerRadius: 6,
              callbacks: {
                label: (ctx) => ` ${ctx.dataset.label}: ${Utils.formatINRFull(ctx.parsed.y)}`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                font: { family: "'Plus Jakarta Sans'", size: 10 },
                color: '#718096',
                maxTicksLimit: 10
              }
            },
            y: {
              grid: { color: 'rgba(226, 232, 240, 0.5)' },
              ticks: {
                font: { family: "'IBM Plex Mono'", size: 10 },
                color: '#718096',
                callback: v => Utils.formatINRFull(v)
              }
            }
          }
        }
      });
    }
  }

  /** Update year-by-year table */
  function updateYearTable(result) {
    const tbody = document.getElementById('yearTableBody');
    if (!tbody) return;

    tbody.innerHTML = result.yearData.map(d => `
      <tr>
        <td>${d.year}</td>
        <td>${Utils.formatINRFull(d.invested)}</td>
        <td>${Utils.formatINRFull(d.returns)}</td>
        <td>${Utils.formatINRFull(d.corpus)}</td>
      </tr>
    `).join('');
  }

  /** Prefill from fund detail */
  function prefillFromFund(fund) {
    prefillFund = fund;
    if (fund.cagr_5y && fund.cagr_5y > 0) {
      // Set SIP return to fund's 5Y CAGR
      const sipReturn = document.getElementById('sipReturn');
      const sipReturnSlider = document.getElementById('sipReturnSlider');
      const lsReturn = document.getElementById('lsReturn');
      const lsReturnSlider = document.getElementById('lsReturnSlider');

      if (sipReturn) { sipReturn.value = fund.cagr_5y.toFixed(1); }
      if (sipReturnSlider) { sipReturnSlider.value = fund.cagr_5y.toFixed(1); updateSliderTrack(sipReturnSlider); }
      if (lsReturn) { lsReturn.value = fund.cagr_5y.toFixed(1); }
      if (lsReturnSlider) { lsReturnSlider.value = fund.cagr_5y.toFixed(1); updateSliderTrack(lsReturnSlider); }

      calculate();
      Utils.showToast(`Using ${fund.fund_name.split(' ').slice(0,3).join(' ')}'s 5Y CAGR: ${fund.cagr_5y.toFixed(1)}%`);
    }
  }

  /** Copy results as text */
  function bindExport() {
    const copyBtn = document.getElementById('copyResultsBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const invested = document.getElementById('resultInvested').textContent;
        const returns = document.getElementById('resultReturns').textContent;
        const corpus = document.getElementById('resultCorpus').textContent;
        const multiple = document.getElementById('resultMultiple').textContent;

        const text = `📊 Mutual Fund Returns Calculator

Mode: ${mode === 'sip' ? 'SIP' : 'Lump Sum'}
Total Invested: ${invested}
Estimated Returns: ${returns}
Total Corpus: ${corpus}
Return Multiple: ${multiple}

Calculated on Quantis FlexiCap Screener`;

        navigator.clipboard.writeText(text).then(() => {
          Utils.showToast('Results copied to clipboard');
        });
      });
    }

    const downloadBtn = document.getElementById('downloadImgBtn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', async () => {
        const resultsPanel = document.getElementById('calcResults');
        if (!resultsPanel) return;

        try {
          Utils.showToast('Generating image...');
          const html2canvasFn = window.html2canvas || (window.html2canvasPro && window.html2canvasPro.default) || window.html2canvasPro;

          if (typeof html2canvasFn !== 'function') {
            Utils.showToast('Image export library not loaded');
            return;
          }

          const canvas = await html2canvasFn(resultsPanel, {
            backgroundColor: '#F4F6F9',
            scale: 2,
            useCORS: true
          });

          const link = document.createElement('a');
          link.download = `quantis-returns-${mode}-${Date.now()}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          Utils.showToast('Image downloaded!');
        } catch (err) {
          console.error('Export error:', err);
          Utils.showToast('Failed to export image');
        }
      });
    }
  }

  return { init, calculate, prefillFromFund };
})();
