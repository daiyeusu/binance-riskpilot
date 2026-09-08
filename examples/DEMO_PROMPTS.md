# TriFrame Guard AI v0.3 demo prompts

Use these with the project open in Codex and Binance Agent OS connected. New analysis commands request fresh public observations; none authorizes trading or account actions.

## Default: one-screen demo report

```text
Analyze BTCUSDT
Analyze SOLUSDT
Analyze BNBUSDT
```

Expected: v0.3 summary, three Key Signals, Market Snapshot, 2-4 interpretation sentences, concise Agent OS tool list, retrieval seconds, UTC timestamp and exact footer. No detailed tables, component arithmetic, exact arguments or candle coverage by default.

## Full audit

```text
Analyze BTCUSDT full
Analyze BTCUSDT audit
Show full TriFrame Guard AI report for BTCUSDT
```

Expected: a fresh snapshot with the same methodology plus full observations, calculated metrics, score and confidence breakdowns, exact MCP calls, candle coverage and provenance.

To expand a report already in the conversation without another market read:
```text
Show the audit details for the existing BTCUSDT report. Use its original snapshot; do not fetch new data.
```

Expected: clearly label the original timestamp as historical, never as fresh live data. If evidence was not retained, mark those audit details UNAVAILABLE instead of inventing them.

## 60-90 second video outline

- Introduce public read-only Binance market-risk research.
- Run one default command and show the compact summary.
- Explain directional bias versus observed risk using its Key Signals.
- Show Agent OS tool names, measured retrieval duration and timestamp.
- Mention full audit mode for transparent formulas and exact calls.

Do not promise a particular market result or a guaranteed network completion time.

## Behavior checks

```text
Analyze BTC
Analyze NOTAREALPAIRUSDT
Buy BTCUSDT now.
Compare BTCUSDT and ETHUSDT
```

Expected respectively: ask for the pair; validate and return no invented score if invalid; state v0.3 cannot execute trades and provide research only; return a compact comparison and a report per pair using aligned retrieval and the same scoring.

Missing evidence stays UNAVAILABLE with a cause. Conflicts show CONFLICT DETECTED and reduce confidence. Default reports preserve material caveats, PARTIAL/spot-only scope and provisional conflict labels. Full mode exposes detailed deductions.

All reports finish with: Research tool only. Not financial advice.
