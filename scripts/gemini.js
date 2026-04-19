/* ═══════════════════════════════════════════════════
   GEMINI AI — Few-Shot Streaming Insight Generation
   ═══════════════════════════════════════════════════ */

const Gemini = (() => {

  const GEMINI_API_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent';

  // ─── System Instruction ───
  const SYSTEM_PROMPT = `You are an expert Indian mutual fund analyst with 20+ years of experience evaluating equity funds for retail investors. You combine quantitative rigour with accessible plain-English communication.

Your task: Analyse Flexi Cap mutual fund data provided by the user and generate a structured, opinionated investment insight.

## Analysis Framework (First-Principles)

Evaluate every fund across these five dimensions:

### 1. RISK-ADJUSTED RETURNS
- Evaluate Sharpe ratio relative to category median (category Sharpe typically ranges −0.5 to +0.3 in Indian Flexi Caps)
- Assess return consistency by comparing 3Y, 5Y, 10Y CAGRs and the 3Y rolling return
- A fund whose rolling return significantly exceeds its CAGR shows resilience across market cycles

### 2. COST EFFICIENCY
- Expense ratio vs category average (~0.73% for direct plans)
- Quantify the compounding drag: every 0.1% extra cost reduces a 10-year corpus by ~1%
- Reward funds with low ER + strong returns (high "value per basis point")

### 3. PORTFOLIO QUALITY
- P/E ratio: below 25 = value tilt, above 30 = growth/momentum tilt
- Volatility vs category std dev (~14.4%): lower volatility with comparable returns is superior
- AUM considerations: very small AUM (<500 Cr) may signal liquidity/tracking risk

### 4. DOWNSIDE PROTECTION
- Alpha: in this dataset alpha is 0 for all funds, so focus on relative metrics
- Volatility vs peers: rank the fund's vol against the category avg
- Category relative performance (5Y/10Y multiplier): >1.0x means outperformance

### 5. VERDICT
- Assign a stance: **STRONG BUY** / **BUY** / **HOLD** / **AVOID**
- Recommend investor profile and minimum holding horizon
- List exactly 3 strengths and 3 risks as bullet points

## Formatting Rules
- Use markdown with ## headings for each section
- Use **bold** for key numbers and verdicts
- Use bullet points, not paragraphs, for strengths/risks
- Keep total output between 400–600 words
- End with a standard disclaimer
- Never recommend specific rupee amounts to invest`;

  // ─── Few-Shot Examples (sent as conversation history) ───
  const FEW_SHOT_EXAMPLES = [
    // ── Example 1: A strong outperformer ──
    {
      role: 'user',
      parts: [{ text: `Analyse the following Flexi Cap mutual fund:

FUND NAME: Alpha Growth Flexi Cap Fund
AMC: Alpha AMC
CATEGORY: Flexi Cap Fund
PLAN: Growth

PERFORMANCE METRICS:
- AUM: ₹45000.00 Crore
- 3Y CAGR: 18.50% (Category Avg: 14.90%)
- 5Y CAGR: 17.20% (Category Avg: 12.80%)
- 10Y CAGR: 16.50% (Category Avg: 14.10%)
- 3Y Avg Rolling Return: 23.10%

RISK METRICS:
- Expense Ratio: 0.55% (Category Avg: 0.73%)
- Sharpe Ratio: 0.0800 (Category Avg: -0.3200)
- Volatility (Std Dev): 11.50 (Category Avg: 14.36)
- Alpha: 0
- P/E Ratio: 22.50 (Category Avg: 27.20)

CATEGORY COMPARISON:
- Returns vs Category (5Y): 1.5800x
- Returns vs Category (10Y): 1.6200x

EXIT LOAD: 1.0%

Please provide a comprehensive first-principles analysis.` }]
    },
    {
      role: 'model',
      parts: [{ text: `## 📊 Alpha Growth Flexi Cap Fund — Investment Insight

## 1. Risk-Adjusted Returns

This fund is a top-quartile performer across all time horizons. The 3Y CAGR of 18.50% beats the category average (14.90%) by a healthy 3.6 percentage points, and this outperformance widens over longer periods — the 10Y CAGR of 16.50% exceeds the category by 2.4%.

The Sharpe ratio of 0.08 is notably above the category average of −0.32, meaning the fund delivers meaningfully better returns per unit of risk taken. The 3Y rolling return of 23.10% — significantly higher than the 3Y CAGR — confirms the fund has performed consistently across different market entry points, not just in a lucky window.

## 2. Cost Efficiency

At 0.55%, the expense ratio is 24% lower than the category average of 0.73%. Over a 10-year SIP, this 0.18% annual saving compounds to roughly an extra 1.8% of your corpus — real money at scale. This is one of the most cost-efficient funds in the Flexi Cap category.

## 3. Portfolio Quality

The P/E ratio of 22.50 — well below the category average of 27.20 — signals a value-oriented portfolio. The fund manager is buying quality at reasonable prices rather than chasing momentum. Combined with a volatility of 11.50 (vs category avg 14.36), this is a portfolio built for durability, not excitement. The ₹45,000 Cr AUM ensures strong liquidity and no capacity constraints.

## 4. Downside Protection

With volatility 20% below the category average and returns 60%+ above category over 5 and 10 years, this fund offers an unusually attractive risk-reward profile. The 1.58x category outperformance over 5Y and 1.62x over 10Y show the fund protects capital well in downturns while capturing meaningful upside in bull runs.

## 5. Verdict

| | |
|---|---|
| Stance | STRONG BUY ✅ |
| Investor Profile | Conservative to Moderate |
| Min. Horizon | 5+ years |

Key Strengths:
- ✅ Consistent outperformance across 3Y, 5Y, and 10Y with widening alpha over time
- ✅ Best-in-class cost efficiency at 0.55% — compounding advantage over decades
- ✅ Low volatility + value-oriented P/E provides a smoother ride than most peers

Key Risks:
- ⚠️ Large AUM may limit the fund's ability to take meaningful positions in mid/small-cap ideas
- ⚠️ Value tilt could underperform in strong momentum-driven rallies
- ⚠️ Past outperformance does not guarantee future results — fund manager changes are always a risk

---

Disclaimer: This insight is AI-generated for educational purposes only. It is not SEBI-registered investment advice. Past performance does not guarantee future results. Consult a certified financial advisor before making investment decisions.` }]
    },

    // ── Example 2: A mediocre/avoid fund ──
    {
      role: 'user',
      parts: [{ text: `Analyse the following Flexi Cap mutual fund:

FUND NAME: Beta Balanced Flexi Cap Fund
AMC: Beta AMC
CATEGORY: Flexi Cap Fund
PLAN: Growth

PERFORMANCE METRICS:
- AUM: ₹350.00 Crore
- 3Y CAGR: 9.80% (Category Avg: 14.90%)
- 5Y CAGR: 0.00% (Category Avg: 12.80%)
- 10Y CAGR: 0.00% (Category Avg: 14.10%)
- 3Y Avg Rolling Return: 5.80%

RISK METRICS:
- Expense Ratio: 0.91% (Category Avg: 0.73%)
- Sharpe Ratio: -0.4400 (Category Avg: -0.3200)
- Volatility (Std Dev): 17.62 (Category Avg: 14.36)
- Alpha: 0
- P/E Ratio: 26.90 (Category Avg: 27.20)

CATEGORY COMPARISON:
- Returns vs Category (5Y): 0.00x
- Returns vs Category (10Y): 0.00x

EXIT LOAD: 1.0%

Please provide a comprehensive first-principles analysis.` }]
    },
    {
      role: 'model',
      parts: [{ text: `## 📊 Beta Balanced Flexi Cap Fund — Investment Insight

## 1. Risk-Adjusted Returns

This fund significantly underperforms its category. The 3Y CAGR of 9.80% trails the category average of 14.90% by over 5 percentage points — a stark gap. More concerning, no 5Y or 10Y return data is available, suggesting the fund either launched recently or has undergone restructuring, making long-term track record assessment impossible.

The Sharpe ratio of −0.44 is worse than the already weak category average of −0.32. The 3Y rolling return of just 5.80% — far below the 3Y CAGR — indicates that return quality degrades when you look at different entry windows, a red flag for consistency.

## 2. Cost Efficiency

The 0.91% expense ratio is 25% above the category average. This is a fund that charges more while delivering less. Over 10 years on a ₹10,000 monthly SIP at 10% return, this extra 0.18% cost drag would erode approximately ₹35,000 from your corpus. There is no cost justification here given the weak returns.

## 3. Portfolio Quality

The P/E ratio of 26.90 is roughly in line with the category average, so the portfolio isn't taking an extreme style bet — it's just underperforming with a benchmark-like allocation. The volatility of 17.62 is 22% higher than the category average of 14.36, meaning you're taking significantly more risk for significantly less return. The ₹350 Cr AUM is quite small, which raises concerns about liquidity and the AMC's commitment to the product.

## 4. Downside Protection

The combination of high volatility and low returns is the worst possible risk-reward profile. With no 5Y/10Y category comparison data available, there's no evidence this fund protects capital in downturns. The negative Sharpe ratio confirms the fund isn't compensating investors for the risk it takes.

## 5. Verdict

| | |
|---|---|
| Stance | AVOID |
| Investor Profile | Not recommended for any profile |
| Min. Horizon | N/A — insufficient track record |

Key Strengths:
- ✅ P/E ratio in line with category — no extreme concentration risk
- ✅ Small AUM could theoretically allow nimble portfolio adjustments
- ✅ Exit load structure is standard at 1%

Key Risks:
- 🔴 Returns trail category average by 5+ percentage points over 3 years
- 🔴 Expense ratio is among the highest in category with no performance justification
- 🔴 Volatility 22% above category average — you're paying for risk, not returns

---

Disclaimer: This insight is AI-generated for educational purposes only. It is not SEBI-registered investment advice. Past performance does not guarantee future results. Consult a certified financial advisor before making investment decisions.` }]
    }
  ];

  /** Build the user prompt from actual fund data */
  function buildPrompt(fund) {
    const catAvg = DataLoader.getCategoryAverages();

    return `Analyse the following Flexi Cap mutual fund:

FUND NAME: ${fund.fund_name}
AMC: ${fund.amc}
CATEGORY: ${fund.category}
PLAN: ${fund.plan}

PERFORMANCE METRICS:
- AUM: ₹${fund.aum_cr ? fund.aum_cr.toFixed(2) : 'N/A'} Crore
- 3Y CAGR: ${fund.cagr_3y != null && fund.cagr_3y !== 0 ? fund.cagr_3y.toFixed(2) + '%' : 'N/A'} (Category Avg: ${catAvg.cagr_3y ? catAvg.cagr_3y.toFixed(2) + '%' : 'N/A'})
- 5Y CAGR: ${fund.cagr_5y != null && fund.cagr_5y !== 0 ? fund.cagr_5y.toFixed(2) + '%' : 'N/A'} (Category Avg: ${catAvg.cagr_5y ? catAvg.cagr_5y.toFixed(2) + '%' : 'N/A'})
- 10Y CAGR: ${fund.cagr_10y != null && fund.cagr_10y !== 0 ? fund.cagr_10y.toFixed(2) + '%' : 'N/A'} (Category Avg: ${catAvg.cagr_10y ? catAvg.cagr_10y.toFixed(2) + '%' : 'N/A'})
- 3Y Avg Rolling Return: ${fund.rolling_return_3y != null && fund.rolling_return_3y !== 0 ? fund.rolling_return_3y.toFixed(2) + '%' : 'N/A'}

RISK METRICS:
- Expense Ratio: ${fund.expense_ratio != null ? fund.expense_ratio.toFixed(2) + '%' : 'N/A'} (Category Avg: ${catAvg.expense_ratio ? catAvg.expense_ratio.toFixed(2) + '%' : 'N/A'})
- Sharpe Ratio: ${fund.sharpe_ratio != null ? fund.sharpe_ratio.toFixed(4) : 'N/A'} (Category Avg: ${catAvg.sharpe_ratio ? catAvg.sharpe_ratio.toFixed(4) : 'N/A'})
- Volatility (Std Dev): ${fund.volatility != null ? fund.volatility.toFixed(2) : 'N/A'} (Category Avg: ${catAvg.volatility ? catAvg.volatility.toFixed(2) : 'N/A'})
- Alpha: ${fund.alpha != null ? fund.alpha : 'N/A'}
- P/E Ratio: ${fund.pe_ratio != null ? fund.pe_ratio.toFixed(2) : 'N/A'} (Category Avg: ${catAvg.pe_ratio ? catAvg.pe_ratio.toFixed(2) : 'N/A'})

CATEGORY COMPARISON:
- Returns vs Category (5Y): ${fund.returns_vs_cat_5y && fund.returns_vs_cat_5y !== 0 ? fund.returns_vs_cat_5y.toFixed(4) + 'x' : 'N/A'}
- Returns vs Category (10Y): ${fund.returns_vs_cat_10y && fund.returns_vs_cat_10y !== 0 ? fund.returns_vs_cat_10y.toFixed(4) + 'x' : 'N/A'}

EXIT LOAD: ${fund.exit_load != null ? fund.exit_load + '%' : 'N/A'}

Please provide a comprehensive first-principles analysis.`;
  }

  /** Build the full contents array with few-shot examples + real query */
  function buildContents(fund) {
    const userPrompt = buildPrompt(fund);

    // Few-shot conversation: example pairs + real user query
    return [
      ...FEW_SHOT_EXAMPLES,
      {
        role: 'user',
        parts: [{ text: userPrompt }]
      }
    ];
  }

  /** Generate insight with streaming */
  async function generateInsight(fund) {
    // Try localStorage first, fall back to hardcoded key
    const apiKey = Utils.getFromStorage('gemini_api_key') || 'AIzaSyCB5L4Xnkkpp6MxTy1nrlddSb-glqQSUYk';
    const container = document.getElementById('insightContainer');

    if (!apiKey) {
      container.innerHTML = `<div class="ai-error">
        <strong>API key not configured.</strong> Please enter your Gemini API key in Settings (⚙️ icon in header).
      </div>`;
      return;
    }

    const btn = document.getElementById('generateInsightBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Generating...';
    }

    container.innerHTML = `<div class="ai-loading"><div class="loader"></div><span>Analysing fund data...</span></div>`;

    try {
      const contents = buildContents(fund);

      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}&alt=sse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: contents,
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 2500,
            topP: 0.9,
            topK: 40
          }
        })
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) {
          throw new Error('Gemini API rate limit reached. Try again in a few seconds.');
        } else if (status === 401 || status === 403) {
          throw new Error('Invalid API key. Please check your key in Settings.');
        } else {
          const errBody = await response.text().catch(() => '');
          throw new Error(`API error (${status}). ${errBody.slice(0, 100)}`);
        }
      }

      // Stream via SSE
      let fullText = '';
      container.innerHTML = `<div class="insight-card streaming-border" id="insightCard"><div id="insightContent"></div></div>`;
      const insightContent = document.getElementById('insightContent');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;
            try {
              const data = JSON.parse(jsonStr);
              const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                fullText += text;
                // Render markdown progressively
                if (typeof marked !== 'undefined' && marked.parse) {
                  insightContent.innerHTML = marked.parse(fullText);
                } else {
                  insightContent.textContent = fullText;
                }
                // Auto-scroll to bottom of insight
                insightContent.scrollTop = insightContent.scrollHeight;
              }
            } catch { /* skip invalid JSON chunks */ }
          }
        }
      }

      // Final render — remove streaming border, add disclaimer + actions
      const card = document.getElementById('insightCard');
      if (card) card.classList.remove('streaming-border');

      container.innerHTML = `
        <div class="insight-card" id="insightCard">
          <div id="insightContent">${typeof marked !== 'undefined' && marked.parse ? marked.parse(fullText) : fullText}</div>
          <div class="insight-disclaimer">
            This insight is AI-generated for educational purposes only. It is not SEBI-registered investment advice.
            Past performance does not guarantee future results. Consult a certified financial advisor before investing.
          </div>
          <div class="insight-actions">
            <button class="btn btn--outline btn--sm" id="copyInsightBtn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy Insight
            </button>
            <button class="btn btn--outline btn--sm" id="regenerateInsightBtn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
              Regenerate
            </button>
          </div>
        </div>`;

      // Bind actions
      document.getElementById('copyInsightBtn')?.addEventListener('click', () => {
        navigator.clipboard.writeText(fullText).then(() => {
          Utils.showToast('Insight copied to clipboard');
        });
      });

      document.getElementById('regenerateInsightBtn')?.addEventListener('click', () => {
        generateInsight(fund);
      });

    } catch (err) {
      container.innerHTML = `<div class="ai-error">${Utils.escapeHtml(err.message)}</div>`;
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg> ✨ Generate Insight`;
      }
    }
  }

  return { generateInsight };
})();
