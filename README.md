# TriFrame Guard AI v0.3 DEMO-READY

TriFrame Guard AI is a Track A mini-hackathon project: a specialized, read-only market-risk agent running inside Codex, powered by Binance Agent OS MCP. It turns spot prices, three candle timeframes and futures funding into a concise report with transparent deterministic scoring.

Conflict-aware market intelligence powered by Binance Agent OS.

## Local dashboard

From this project directory, run:

```text
node server.js
```

Open http://localhost:3000, enter a complete pair such as BNBUSDT, and click **RUN AGENT ANALYSIS**. Node.js and the existing signed-in `codex` CLI must be available on PATH, with Binance Agent OS already connected in the CLI environment. No dependencies or installation are required.

The local Node server invokes `codex exec --cd <project> --sandbox read-only --ephemeral --color never --output-last-message <temporary file> -`, supplying the analysis prompt on stdin. Windows uses PowerShell to invoke the installed Codex shim. AGENTS.md defines boundaries, prompts/RISKPILOT.md defines report modes, and docs/SCORING.md remains the canonical formula. No scoring runs in the browser.

The bridge accepts one request at a time and times out after 15 minutes. It returns the final agent response, not the CLI event/debug transcript. Temporary report files are removed afterward. No database or report history is maintained. Requests run independently, so follow-up audit context is not retained. If a field cannot be parsed, the dashboard shows the raw report. It preserves partial, unavailable and provisional qualifiers.

CLI authentication, model availability, MCP access and latency depend on the existing local setup. A connection available in another Codex client is not necessarily available to this CLI. Non-interactive execution cannot resolve interactive approval/sign-in prompts. The read-only filesystem sandbox does not enforce MCP operation permissions: the existing public-operation allowlist remains an agent instruction, not a separate permission gateway. No MCP configuration is changed and no trading flow is added.

Implementation verification covers server startup, local page/assets and JavaScript syntax only; no live Binance analysis was run.

## Run a 60-90 second demo

1. Open this project in Codex with the already connected binance_agent_os server.
2. Enter `Analyze BTCUSDT` (or SOLUSDT / BNBUSDT).
3. Highlight Directional Bias separately from Observed Market Risk, the three Key Signals, and the short AI Interpretation.
4. Point out read-only safety, the Agent OS tool list, measured retrieval time and UTC snapshot timestamp.
5. Explain that `Analyze BTCUSDT full` requests a fresh analysis with detailed audit evidence. To expand the existing snapshot without another retrieval, ask for its audit details explicitly.

The default report aims to fit one terminal screen. A 60-90 second video is a presentation target, not a guaranteed MCP completion time. Connection failures produce visible limitations instead of invented results.

## Demo versus audit

Default commands:
```text
Analyze BTCUSDT
Analyze SOLUSDT
Analyze BNBUSDT
```

Demo mode shows the seven-field v0.3 summary, three Key Signals, Market Snapshot, 2-4 interpretation sentences, Agent OS tool names, retrieval seconds, UTC timestamp and disclaimer. Material conflicts, missing data, freshness caveats and PARTIAL/spot-only qualifiers remain visible.

Explicit audit requests:
```text
Analyze BTCUSDT full
Analyze BTCUSDT audit
Show full TriFrame Guard AI report for BTCUSDT
```

Audit mode adds detailed observations, computed-metric tables, all score contributions and confidence deductions, exact MCP arguments, candle coverage and provenance. Both modes retrieve and evaluate the same evidence. Full/audit changes presentation, not scoring or safety.

## Faster tool orchestration

Prefer the exposed spot_exchangeInfo, spot_tickerPrice, spot_ticker24hr and spot_klines tools. Use the known futures_usds.exchangeInformation, futures_usds.checkServerTime when useful, and futures_usds.markPrice schemas through tool_execute when necessary. No tool_search on every normal analysis: discovery is a fallback for missing direct tools or unknown schemas, with session metadata reuse and no repeated searches for the same purpose.

Independent public reads run concurrently where supported; dependent validation stays ordered. Each transient failure gets at most one retry, then affected fields become UNAVAILABLE and analysis continues. Never substitute another provider.

Retrieval time runs from first required market request through final required response/retry, not through report writing. Freshness is evaluated at retrieval end; subsequent model reasoning does not reduce confidence. Material market retrieval-window delays still count under SCORING.md.

## What the scores mean

Directional Bias is BULLISH, BEARISH, NEUTRAL or MIXED, or UNAVAILABLE without sufficient evidence. Observed Market Risk measures instability and trading conditions, not the probability that price will go down. A bearish market can have LOW risk; LOW is not a safety guarantee.

Rounded risk bands: LOW 0-24, MODERATE 25-49, HIGH 50-74, EXTREME 75-100. Confidence measures evidence quality and agreement, not forecast certainty: deductions start at 100 and the result is capped at 95/100, with lower unavailable-data caps and zero overrides preserved. Conflicts trigger CONFLICT DETECTED and the documented deductions. v0.3 preserves the existing metric formulas, weights, thresholds and partial-score logic.

## Safety and limitations

Public live market data comes only from Binance Agent OS. No direct Binance REST/HTTP, other data providers, web market searches, invented values or old snapshots represented as live data. TriFrame Guard AI never places/cancels orders, transfers, borrows, repays, withdraws, reads balances or manages accounts. Trade requests receive research only; no API keys are requested.

These are agent instructions, not an enforced MCP permission gateway. The server may expose tools outside the project's allowlist; TriFrame Guard AI must not call them. There is no standalone calculation engine or automated test suite. Scores are research heuristics, not calibrated probabilities or validated forecasts. No portfolio, news, order-book liquidity or liquidation analysis is included.

The v0.3 documentation upgrade does not run a live analysis or benchmark. See docs/ARCHITECTURE.md, docs/SCORING.md and examples/DEMO_PROMPTS.md. When project instructions are not loaded, supply AGENTS.md, prompts/RISKPILOT.md and docs/SCORING.md together.

Research tool only. Not financial advice.
