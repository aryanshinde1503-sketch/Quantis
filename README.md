# Quantis — FlexiCap Fund Screener

A client-side mutual fund research tool for Indian Flexi Cap funds. Quantis lets you screen, sort, filter, and compare funds using key performance and risk metrics, view detailed fund breakdowns with charts, and model future returns with a built-in SIP/Lump Sum calculator.

---

## Features

**Screener**
- Paginated, sortable table of Flexi Cap mutual funds loaded from a local CSV (`flexi-cap-mfs.csv`)
- Per-column min/max (numeric) and text filters with active filter chips
- Global search by fund name or AMC
- Customisable columns — show/hide and drag-to-reorder via the Column Manager
- Keyboard navigation (↑ ↓ arrows + Enter to open detail)
- Column preferences persisted to `localStorage`

**Fund Detail Panel**
- Slide-in panel with key metrics: CAGR (3Y/5Y/10Y), Expense Ratio, Sharpe Ratio, Volatility, P/E, Alpha, Exit Load
- Grouped bar chart: fund returns vs. category average (Chart.js)
- Category comparison ratios (5Y & 10Y outperformance vs. sub-category)
- Rule-based insight engine that evaluates Alpha, Sharpe Ratio, and Expense Ratio
- "Use this fund's 5Y CAGR in Calculator" shortcut

**Returns Calculator**
- SIP mode: monthly amount, expected return, duration, and annual step-up percentage
- Lump Sum mode: principal, return rate, duration
- Live doughnut chart (invested vs. gains) and area chart (corpus growth over time)
- Year-by-year breakdown table
- Copy results to clipboard or download as a PNG image (requires `html2canvas`)

**Live NAV for Parag Parikh Flexi Cap**
- Fetches current NAV from `api.mfapi.in` on load and recalculates 3Y/5Y/10Y CAGRs dynamically

---

## Project Structure

```
├── index.html              # App shell, layout, all page markup
├── flexi-cap-mfs.csv       # Fund data (required at runtime)
├── utils.js                # Formatting helpers, localStorage wrappers, toast
├── data-loader.js          # CSV parser, fund model mapping, live NAV fetch, category averages
├── screener.js             # Table rendering, sorting, filtering, pagination, keyboard nav
├── column-manager.js       # Column visibility toggle and drag-to-reorder UI
├── detail-panel.js         # Slide-in fund detail panel, Chart.js bar chart, rule-based insights
├── calculator.js           # SIP & Lump Sum calculator, Chart.js doughnut + area charts
└── main.js                 # App init, theme, tab routing, settings modal, error state
```

---

## Getting Started

### Prerequisites

- A static file server (the app fetches `flexi-cap-mfs.csv` via `fetch()`, so opening `index.html` directly from the filesystem will fail due to CORS)
- No build step or package manager required

### Running locally

```bash
# Python
python -m http.server 8080

# Node.js (npx)
npx serve .

# VS Code
# Use the Live Server extension
```

Then open `http://localhost:8080` in your browser.

### CSV format

The data file must be named `flexi-cap-mfs.csv` and placed in the same directory as `index.html`. Required columns:

| Column | Description |
|---|---|
| `Name` | Full fund scheme name |
| `Sub Category` | SEBI sub-category (e.g. Flexi Cap Fund) |
| `Plan` | Growth / IDCW |
| `AUM` | Assets Under Management in ₹ Crore |
| `Expense Ratio` | Annual TER % |
| `Exit Load` | Exit load % |
| `Alpha` | Alpha vs. benchmark |
| `CAGR 3Y` / `CAGR 5Y` / `CAGR 10Y` | Point-to-point CAGRs |
| `3Y Avg Annual Rolling Return` | 3-year rolling return average |
| `Volatility` | Standard deviation of returns |
| `Category St Dev` | Sub-category standard deviation |
| `Sharpe Ratio` | Risk-adjusted return |
| `PE Ratio` | Portfolio P/E |
| `Returns vs sub-category - 5Y` | 5Y return / category 5Y average |
| `Returns vs sub-category - 10Y` | 10Y return / category 10Y average |

---

## Module Reference

### `utils.js`
Stateless helpers available globally as `Utils`.

| Function | Purpose |
|---|---|
| `formatINR(num)` | Indian numbering with ₹ symbol (L / Cr) |
| `formatAUM(num)` | AUM formatted as ₹X,XX,XXX.XX Cr |
| `formatPercent(num)` | Percentage with sign (e.g. `+14.23%`) |
| `formatPercentPlain(num)` | Percentage without sign |
| `formatNumber(num)` | Generic 2-decimal number |
| `formatINRFull(num)` | Full Indian format for calculator output |
| `debounce(fn, delay)` | Standard debounce wrapper |
| `getFromStorage(key)` | Safe `localStorage.getItem` with JSON parse |
| `setToStorage(key, value)` | Safe `localStorage.setItem` with JSON stringify |
| `escapeHtml(str)` | XSS-safe HTML encoding |
| `showToast(message)` | Temporary notification banner |
| `returnClass(val)` | CSS class for coloured return badges |

---

### `data-loader.js`
Exposed as `DataLoader`. Called once at startup by `main.js`.

`DataLoader.loadData()` — async, returns `{ funds, categoryAverages }`.

Internally it:
1. Fetches and parses `flexi-cap-mfs.csv`
2. Maps each row to the internal fund model (see column list above)
3. Attempts a live NAV fetch from `https://api.mfapi.in/mf/122639` for Parag Parikh Flexi Cap and recalculates its CAGRs
4. Computes category averages across 7 metrics
5. Calculates 3Y/5Y/10Y Alpha for every fund against a fixed benchmark (14% / 13% / 12%)

---

### `screener.js`
Exposed as `Screener`. Manages all table state.

| Method | Purpose |
|---|---|
| `init(funds)` | Render table, bind events, restore saved columns |
| `setColumns(colIds)` | Update active columns and re-render (called by ColumnManager) |
| `getActiveColumns()` | Returns current column ID array |
| `getAllColumns()` | Returns all column definition objects |
| `getFilteredFunds()` | Returns currently filtered fund array |
| `resetAll()` | Clear all filters, sort, and search |

**Available columns** (15 total, 8 on by default):

`fund_name` · `amc` · `aum_cr` · `expense_ratio` · `cagr_3y` · `cagr_5y` · `cagr_10y` · `sharpe_ratio` · `volatility` · `alpha` · `pe_ratio` · `rolling_return_3y` · `exit_load` · `returns_vs_cat_5y` · `returns_vs_cat_10y`

---

### `column-manager.js`
Exposed as `ColumnManager`. Renders a dropdown with checkboxes and drag handles.

- Minimum 3 columns enforced
- `fund_name` is pinned and cannot be toggled or reordered
- Column order is saved to `localStorage` via `Screener.setColumns()`

---

### `detail-panel.js`
Exposed as `DetailPanel`.

| Method | Purpose |
|---|---|
| `open(fund)` | Render and slide in the panel for a given fund object |
| `close()` | Close the panel and destroy Chart.js instances |
| `getCurrentFund()` | Returns the fund currently shown in the panel |

The panel also exposes a "Use 5Y CAGR in Calculator" button that closes the panel, navigates to the Calculator tab, and calls `Calculator.prefillFromFund(fund)`.

---

### `calculator.js`
Exposed as `Calculator`.

| Method | Purpose |
|---|---|
| `init()` | Bind all inputs, sliders, and export controls |
| `calculate()` | Run calculation for the active mode and update all UI |
| `prefillFromFund(fund)` | Set the return rate fields to a fund's 5Y CAGR |

SIP calculation supports an optional annual step-up (in %) applied at the end of each year. All slider tracks are kept in sync with their paired number inputs.

---

### `main.js`
Entry point. Responsibilities:

- Initialise theme from `localStorage`
- Set up tab navigation between Screener and Calculator pages
- Load data via `DataLoader.loadData()` then hand off to `Screener.init()`, `ColumnManager.init()`, and `Calculator.init()`
- Manage a Settings modal (UI present; Gemini AI integration disabled, replaced by rule-based analysis in `DetailPanel`)
- Display a full-screen error overlay on data load failure with a retry button

---

## External Dependencies

All loaded via CDN in `index.html`:

| Library | Purpose |
|---|---|
| [Chart.js](https://www.chartjs.org/) | Bar, doughnut, and area charts |
| [html2canvas](https://html2canvas.hertzen.com/) | Calculator result PNG export |
| [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) | UI font |
| [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) | Numeric data font |

No npm packages, no bundler.

---

## Benchmark Assumptions

Alpha is computed against fixed benchmark returns:

| Period | Benchmark CAGR |
|---|---|
| 3 Year | 14% |
| 5 Year | 13% |
| 10 Year | 12% |

These figures approximate a broad Indian large-cap index over the respective periods and can be adjusted in `data-loader.js`.

---

## Theme & Persistence

- Light/dark theme toggled via `data-theme` on `<html>` and stored in `localStorage` under `quantis_theme`
- Active column list stored under `quantis_columns`

---

## Limitations & Notes

- Data is static (CSV-based); all fund metrics except Parag Parikh's NAV-derived CAGRs are sourced from the CSV at build time
- The live NAV API (`mfapi.in`) is called without authentication; if it is unreachable the app falls back to CSV values and shows a toast notification
- The Settings modal is present in the UI but the Gemini AI integration has been removed; fund analysis is handled by the rule-based engine in `detail-panel.js`
- The app is read-only — no user accounts, no server-side state
