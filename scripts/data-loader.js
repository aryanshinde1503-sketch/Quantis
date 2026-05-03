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
      rolling_return_3y: toNum(raw['3Y Avg Annual Rolling Return']),

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

      try {
        const apiRes = await fetch('https://api.mfapi.in/mf/122639');
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          const ppfas = funds.find(f => f.fund_name && f.fund_name.includes('Parag Parikh'));
          
          if (ppfas && apiData && apiData.data && apiData.data.length > 0) {
            const currentNav = parseFloat(apiData.data[0].nav);
            // Extract the latest NAV date components for historical offsets
            const [currentDay, currentMonth, currentYear] = apiData.data[0].date.split('-');
            
            // Sort NAV data chronologically (latest to oldest) to allow quick traversal
            const sortedData = [...apiData.data].sort((a, b) => {
              const [dayA, monthA, yearA] = a.date.split('-');
              const [dayB, monthB, yearB] = b.date.split('-');
              
              const dateA = new Date(parseInt(yearA), parseInt(monthA) - 1, parseInt(dayA)).getTime();
              const dateB = new Date(parseInt(yearB), parseInt(monthB) - 1, parseInt(dayB)).getTime();
              
              return dateB - dateA; // Descending order
            });

            /**
             * Finds the closest available historical NAV on or strictly before the target date.
             * @param {string} targetDateStr - Target date in DD-MM-YYYY format
             */
            const getClosestNav = (targetDateStr) => {
              const [targetDay, targetMonth, targetYear] = targetDateStr.split('-');
              const targetTime = new Date(parseInt(targetYear), parseInt(targetMonth) - 1, parseInt(targetDay)).getTime();
              
              // Traverse the sorted data to find the first entry matching the timeline condition
              for (const item of sortedData) {
                const [itemDay, itemMonth, itemYear] = item.date.split('-');
                const itemTime = new Date(parseInt(itemYear), parseInt(itemMonth) - 1, parseInt(itemDay)).getTime();
                
                if (itemTime <= targetTime) {
                  return parseFloat(item.nav);
                }
              }
              
              // Return null if the fund did not exist at or prior to the target date
              return null;
            };

            /**
             * Calculates the Compounded Annual Growth Rate (CAGR).
             */
            const calcCagr = (pastNav, years) => {
              // Ensure CAGR is calculated only when a valid, positive historical NAV is found
              if (pastNav && pastNav > 0) {
                return (Math.pow(currentNav / pastNav, 1 / years) - 1) * 100;
              }
              return null;
            };

            // Calculate historical CAGRs by stepping back 3, 5, and 10 years from the latest available date
            ppfas.cagr_3y = calcCagr(getClosestNav(`${currentDay}-${currentMonth}-${parseInt(currentYear)-3}`), 3);
            ppfas.cagr_5y = calcCagr(getClosestNav(`${currentDay}-${currentMonth}-${parseInt(currentYear)-5}`), 5);
            ppfas.cagr_10y = calcCagr(getClosestNav(`${currentDay}-${currentMonth}-${parseInt(currentYear)-10}`), 10);
          }
        } else {
          throw new Error(`API returned status ${apiRes.status}`);
        }
      } catch (e) {
        console.error('Failed to load API data:', e);
        if (typeof Utils !== 'undefined' && Utils.showToast) {
          Utils.showToast('Using fallback data');
        }
      }

      categoryAverages = computeCategoryAverages(funds);

      // Re-calculate the relative vs category columns for the updated fund
      const ppfas = funds.find(f => f.fund_name && f.fund_name.includes('Parag Parikh'));
      if (ppfas) {
        if (categoryAverages.cagr_5y) ppfas.returns_vs_cat_5y = ppfas.cagr_5y / categoryAverages.cagr_5y;
        if (categoryAverages.cagr_10y) ppfas.returns_vs_cat_10y = ppfas.cagr_10y / categoryAverages.cagr_10y;
      }

      // Calculate Alpha for all funds using fixed benchmark
      const benchmark = { cagr_3y: 14, cagr_5y: 13, cagr_10y: 12 };
      funds.forEach(fund => {
        fund.alpha_3y = (fund.cagr_3y != null) ? fund.cagr_3y - benchmark.cagr_3y : null;
        fund.alpha_5y = (fund.cagr_5y != null) ? fund.cagr_5y - benchmark.cagr_5y : null;
        fund.alpha_10y = (fund.cagr_10y != null) ? fund.cagr_10y - benchmark.cagr_10y : null;
        
        // Use 3Y alpha as the default alpha for the UI column
        fund.alpha = fund.alpha_3y;
      });

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
