# TriFrame Guard AI v0.3 architecture

TriFrame Guard AI is an instruction-driven, read-only Codex agent. Binance Agent OS supplies all live market observations; local arithmetic computes the deterministic metrics in SCORING.md. Multiple datasets mean spot prices, candles and futures funding from Binance, not other providers.

## Data flow and latency

1. Parse demo/full/audit mode separately from the symbol; normalize the exact pair without guessing a quote.
2. Use exposed direct spot schemas and the known futures schemas documented in AGENTS.md. No routine tool_search. Only fall back to discovery when a required direct tool is unavailable or a schema is unknown; restrict categories to market-data (market if needed), inspect public purpose and schema, and cache the result for the session. Never repeat discovery for the same purpose apart from one transient retry; paginate only as necessary. Cache metadata, not live observations.
3. Start the retrieval timer immediately before market reads. Spot exchange information and USD-M exchange information are independent and may run concurrently. Validate spot base/quote, eligibility and TRADING status. Match futures base/quote, PERPETUAL type and TRADING status exactly.
4. After spot validation, issue spot_tickerPrice, spot_ticker24hr with type FULL, and spot_klines with limit 61 for 15m, 1h and 4h concurrently where supported. Read futures_usds.markPrice only after matching the active contract. Use tool_execute for known futures operations when no verified direct equivalent is exposed.
5. Use a valid current exchange-information server time when suitable; otherwise request the known futures_usds.checkServerTime concurrently with other independent reads. A known spot.time is also allowed. Do not discover a clock needlessly when a usable one already exists.
6. Await and inspect each outcome independently. Retry a transient request only once, honoring supplied rate-limit timing; if it still fails, mark affected fields UNAVAILABLE and continue. Nontransient failures are not retried. No indefinite retry or rediscovery loop.
7. Stop retrieval timing when the final required market request/retry settles. Validate candle ordering, uniqueness, positive consistent OHLC, nonnegative volume and interval spacing. Exclude incomplete/corrupt bars, never bridge gaps, and use the latest contiguous closed segment capped at 60; at least 30 bars are required per usable timeframe.
8. Calculate every metric, component, conflict and confidence deduction using SCORING.md. Retain the evidence and exact calls internally, then render the chosen mode.

Concurrency applies only to independent public reads; validation and contract matching remain dependencies. It does not authorize trading or account tools.

## Time and provenance

Retrieval elapsed seconds are wall-clock time from first market request dispatch through final required response/failure, including retries and intervening delays, not the sum of parallel durations. Prefer monotonic elapsed measurement; record UTC start/end and per-call dispatch/completion. Record metadata-discovery time separately. Reading instructions before retrieval and processing after the last market response do not count.

Freeze freshness assessment at retrieval end. Advance a valid exchange clock by measured elapsed time since its receipt, or use labeled local UTC with the existing confidence deduction. SCORING.md defines the unchanged 5-minute source age, two-candle-interval age, 5-second future tolerance and greater-than-2-minute market-window thresholds. Do not deduct confidence because subsequent model reasoning is slow.

Ticker closeTime is the rolling-window endpoint; candle open/close times describe history coverage; funding time describes its observation. nextFundingTime is a schedule. A timestamp-free price response has retrieval-time-only attribution. Keep distinct snapshot prices distinct.

Record exact actual MCP names and arguments, tool_execute logical targets, discovery and failed calls, field causes, raw observations and computed metrics internally. Detailed provenance is displayed only in audit mode. No market data is persisted by default.

## Rendering

Default DEMO REPORT: approximately one terminal screen, shared seven-field summary, three Key Signals, compact Market Snapshot, 2-4 interpretation sentences, Agent OS tool names, retrieval seconds, UTC timestamp and exact disclaimer footer. Preserve material missing-data and freshness caveats, conflict warnings and PARTIAL/spot-only scope.

Full audit mode is selected by full/audit or an explicit request for detailed scoring/provenance. It adds observed-data tables, computed metrics, all five scoring contributions, confidence arithmetic, exact MCP calls, coverage and timestamps in the prompt's audit order. Both modes calculate the same results from the same evidence.

An audit expansion of an existing report may use its retained evidence only when labeled with the original historical snapshot timestamp. A fresh analysis never reuses that evidence as live data.

## Failure and safety scope

Invalid/halted pairs receive validation results without numeric risk scores. Verified absence of a matching perpetual differs from discovery failure. Missing data remains UNAVAILABLE and never implies low risk. Complete MCP failure yields confidence 0. Never substitute another provider, request keys, access balances or invoke order, transfer, withdrawal or account-management operations.

The local dashboard uses Node built-in HTTP, filesystem and child-process modules with plain HTML/CSS/JavaScript. `POST /api/analyze` validates a simple pair string and starts `codex exec` in this project with the read-only sandbox. The agent still performs all market retrieval and scoring through the existing instructions and Binance Agent OS. The server makes no direct Binance HTTP requests.

Only loopback access is served; JSON requests enforce local origins, bounded input and one active analysis. The final agent message is captured in a temporary file and removed after reading. The UI renders text safely and falls back to the full report if required fields are missing. No database, frontend framework, standalone scoring engine or enforced MCP permission gateway is added. Speed depends on Codex and MCP response times; the demo video target is not a latency guarantee.
