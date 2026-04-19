/* ═══════════════════════════════════════════════════
   DATA LOADER — Parses CSV, exposes fund array
   ═══════════════════════════════════════════════════ */

const DataLoader = (() => {

  let funds = [];
  let categoryAverages = {};

  /** Parse CSV text → array of objects */
  function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Smart CSV split — handle commas inside quotes (if any)
      const values = smartSplit(line);
      if (values.length < headers.length) continue;

      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] != null ? values[idx].trim() : '';
      });
      rows.push(obj);
    }
    return rows;
  }

  /** Split CSV line handling quoted fields */
  function smartSplit(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }

  /** Map CSV columns → internal fund data model */
  function mapToFundModel(raw, idx) {
    const toNum = (val) => {
      const n = parseFloat(val);
      return isNaN(n) ? null : n;
    };

    return {
      id: 'fund_' + idx,
      fund_name: raw['Name'] || 'Unknown Fund',
      amc: extractAMC(raw['Name'] || ''),
      category: raw['Sub Category'] || 'Flexi Cap Fund',
      plan: raw['Plan'] || 'Growth',
      aum_cr: toNum(raw['AUM']),
      expense_ratio: toNum(raw['Expense Ratio']),
      exit_load: raw['Exit Load'] || 'N/A',
      alpha: toNum(raw['Alpha']),

      // Returns
      cagr_3y: toNum(raw['CAGR 3Y']),
      cagr_5y: toNum(raw['CAGR 5Y']),
      cagr_10y: toNum(raw['CAGR 10Y']),
      rolling_return_3y: toNum(raw['3Y Avg Annual Rolling Return ']),

      // Risk metrics
      volatility: toNum(raw['Volatility']),
      category_std_dev: toNum(raw['Category St Dev']),
      sharpe_ratio: toNum(raw['Sharpe Ratio']),
      pe_ratio: toNum(raw['PE Ratio']),

      // Category comparison
      returns_vs_cat_10y: toNum(raw['Returns vs sub-category - 10Y']),
      returns_vs_cat_5y: toNum(raw['Returns vs sub-category - 5Y']),
    };
  }

  /** Extract AMC name from fund name */
  function extractAMC(name) {
    // Common AMC mappings
    const amcPatterns = [
      { pattern: /^Parag Parikh/i, amc: 'PPFAS' },
      { pattern: /^HDFC/i, amc: 'HDFC AMC' },
      { pattern: /^Kotak/i, amc: 'Kotak AMC' },
      { pattern: /^Aditya Birla/i, amc: 'Aditya Birla SL' },
      { pattern: /^SBI/i, amc: 'SBI MF' },
      { pattern: /^UTI/i, amc: 'UTI AMC' },
      { pattern: /^ICICI/i, amc: 'ICICI Prudential' },
      { pattern: /^Franklin/i, amc: 'Franklin Templeton' },
      { pattern: /^Canara Rob/i, amc: 'Canara Robeco' },
      { pattern: /^Motilal Oswal/i, amc: 'Motilal Oswal' },
      { pattern: /^Axis/i, amc: 'Axis AMC' },
      { pattern: /^DSP/i, amc: 'DSP AMC' },
      { pattern: /^Nippon/i, amc: 'Nippon India' },
      { pattern: /^Bandhan/i, amc: 'Bandhan AMC' },
      { pattern: /^WOC/i, amc: 'WOC AMC' },
      { pattern: /^Bajaj Finserv/i, amc: 'Bajaj Finserv' },
      { pattern: /^Quant/i, amc: 'Quant AMC' },
      { pattern: /^Helios/i, amc: 'Helios AMC' },
      { pattern: /^PGIM/i, amc: 'PGIM India' },
      { pattern: /^HSBC/i, amc: 'HSBC AMC' },
      { pattern: /^JM /i, amc: 'JM Financial' },
      { pattern: /^Invesco/i, amc: 'Invesco India' },
      { pattern: /^Tata/i, amc: 'Tata AMC' },
      { pattern: /^Mirae/i, amc: 'Mirae Asset' },
      { pattern: /^Edelweiss/i, amc: 'Edelweiss AMC' },
      { pattern: /^Abakkus/i, amc: 'Abakkus AMC' },
      { pattern: /^JioBlackRock/i, amc: 'JioBlackRock' },
      { pattern: /^NJ /i, amc: 'NJ AMC' },
      { pattern: /^Union/i, amc: 'Union AMC' },
      { pattern: /^Bank of India/i, amc: 'Bank of India' },
      { pattern: /^Sundaram/i, amc: 'Sundaram AMC' },
      { pattern: /^360 ONE/i, amc: '360 ONE' },
      { pattern: /^Mahindra/i, amc: 'Mahindra Manulife' },
      { pattern: /^ITI/i, amc: 'ITI AMC' },
      { pattern: /^Baroda/i, amc: 'Baroda BNP' },
      { pattern: /^TRUSTMF/i, amc: 'TRUST MF' },
      { pattern: /^LIC/i, amc: 'LIC MF' },
      { pattern: /^Capitalmind/i, amc: 'Capitalmind' },
      { pattern: /^Taurus/i, amc: 'Taurus AMC' },
      { pattern: /^Samco/i, amc: 'Samco AMC' },
      { pattern: /^Navi/i, amc: 'Navi AMC' },
      { pattern: /^The Wealth/i, amc: 'Wealth Co.' },
      { pattern: /^Unifi/i, amc: 'Unifi AMC' },
      { pattern: /^Shriram/i, amc: 'Shriram AMC' },
      { pattern: /^Old Bridge/i, amc: 'Old Bridge' },
    ];

    for (const { pattern, amc } of amcPatterns) {
      if (pattern.test(name)) return amc;
    }

    // Fallback: use first two words
    const words = name.split(' ');
    return words.slice(0, 2).join(' ');
  }

  /** Compute category averages from data */
  function computeCategoryAverages(fundArr) {
    const metrics = ['cagr_3y', 'cagr_5y', 'cagr_10y', 'expense_ratio', 'sharpe_ratio', 'volatility', 'pe_ratio'];
    const avgs = {};

    metrics.forEach(metric => {
      const validVals = fundArr.filter(f => f[metric] != null && f[metric] !== 0).map(f => f[metric]);
      avgs[metric] = validVals.length > 0 ? validVals.reduce((a, b) => a + b, 0) / validVals.length : 0;
    });

    return avgs;
  }

  /** Load data from CSV file */
  async function loadData() {
    try {
      const response = await fetch('flexi-cap-mfs.csv');
      if (!response.ok) throw new Error('Failed to load data file');
      const csvText = await response.text();
      const rawData = parseCSV(csvText);

      funds = rawData
        .map((raw, idx) => mapToFundModel(raw, idx))
        .filter(f => f.fund_name !== 'Unknown Fund');

      categoryAverages = computeCategoryAverages(funds);

      return { funds, categoryAverages };
    } catch (err) {
      console.error('Data load error:', err);
      throw err;
    }
  }

  function getFunds() { return funds; }
  function getCategoryAverages() { return categoryAverages; }

  return {
    loadData,
    getFunds,
    getCategoryAverages
  };
})();
