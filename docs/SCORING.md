# RiskPilot v0.3 scoring

Directional Bias describes observed price direction (BULLISH, BEARISH, NEUTRAL or MIXED). The Observed Market Risk Score measures observed market instability / trading-condition risk, NOT the probability that price will go down. A bearish market may have a LOW risk score when volatility, funding stress, conflicts and instability are low. Neither output is a forecast, probability of loss or trade recommendation.

Confidence measures evidence completeness, freshness and agreement, not certainty about future price. Report it out of 100 with a maximum of 95, even with complete and consistent data. High confidence does not predict profit.

## Inputs and calculations

Both demo and audit modes use every formula and penalty below. Compute and retain all metrics, contributions, missing-field causes and provenance internally. Instructions below to show detailed metrics, volumes, next funding time, contributions, denominators or deductions apply to full audit mode. Demo mode uses the compact prompt template, preserving material caveats, conflicts, PARTIAL/spot-only qualifiers and UNAVAILABLE states without detailed tables.

Use up to 60 contiguous closed candles per timeframe, oldest first. Request 61 to accommodate the open candle. Require at least 30 closed candles for a timeframe to be usable; otherwise all its metrics are UNAVAILABLE. Use full precision internally, round displayed metrics sensibly and scores to nearest integer (half up).

For each usable timeframe, with latest index n:
- `SMA20` = average of last 20 closes.
- `R5 = 100 * (close[n] / close[n-5] - 1)`.
- True range = max(high-low, abs(high-previous close), abs(low-previous close)). `ATR14` = simple average of the latest 14 true ranges; `ATR% = 100 * ATR14 / close[n]`.
- `M = (close[n] - close[n-5]) / ATR14` (signed momentum in ATR units).
- Direction = UP if close > SMA20 and M >= 0.5; DOWN if close < SMA20 and M <= -0.5; otherwise FLAT.
- Volume ratio = mean base volume of last 5 bars / mean base volume of preceding 20 bars, calculated on the one-hour series. Do not compare raw volume across assets or timeframes.

Nonpositive prices or corrupt data are invalid. If ATR is zero with valid constant prices, set M=0 and ATR%=0. A zero volume denominator makes volume ratio UNAVAILABLE. Report rolling 24-hour base and quote volumes with units; do not confuse them with hourly candle volume. The ticker's rolling 24-hour range percentage is `100 * (high-low) / lastPrice`, descriptive only.

## Labels and conflicts

- Directional Bias: MIXED if usable timeframes include both UP and DOWN; BULLISH if at least two are UP and none DOWN; BEARISH if at least two DOWN and none UP; otherwise NEUTRAL. If fewer than two timeframes are usable, Directional Bias is UNAVAILABLE rather than a fabricated neutral conclusion.
- Momentum: use abs(M) on 15m: STRONG >=2, MODERATE >=0.5 and <2, WEAK <0.5. Show signed M and direction as well. Missing 15m gives UNAVAILABLE.
- Volatility: one-hour ATR% LOW <0.5; MODERATE >=0.5 and <1.5; HIGH >=1.5. Missing one-hour data gives UNAVAILABLE.
- Funding: interpret the returned `lastFundingRate` as the current reported funding field, not guaranteed next settlement. Convert decimal to percentage by multiplying by 100. POSITIVE if >0.001%, NEGATIVE if <-0.001%, otherwise NEUTRAL. Missing funding gives UNAVAILABLE. Report next funding time if provided; do not assume an eight-hour interval or annualize it.

Three conflict rules:
1. Directional conflict: at least one UP and one DOWN timeframe.
2. Volume divergence: abs(one-hour M) >=0.5 and volume ratio <0.7 (directional movement with subdued volume; this is a warning, not proof of reversal).
3. Funding/price divergence: funding >=+0.01% with one-hour DOWN, or funding <=-0.01% with one-hour UP.

Any triggered rule means Conflict Detection YES, print `CONFLICT DETECTED`, explain each rule and apply confidence penalties below. Directional conflict always means MIXED; other conflicts may retain the trend regime but require explicit caveats. If none triggers and some rules cannot be evaluated, report `NO (provisional; [rules] unavailable)`; never claim verified agreement from missing data.

## Observed Market Risk Score (0-100)

Add these five components. Conditions are evaluated in the order shown and bands include their lower bound.

| Component | Points |
|---|---|
| One-hour ATR% (0-30) | <0.5: 0; <1: 10; <2: 20; >=2: 30 |
| Momentum extension, max abs(M) across usable timeframes (0-20) | <1: 0; <2: 7; <3: 14; >=3: 20 |
| Conflict (0-25) | directional conflict: 25; otherwise funding/price divergence: 15; otherwise volume divergence: 10; otherwise 0 |
| Absolute funding percentage (0-15) | <0.01%: 0; <0.03%: 5; <0.05%: 10; >=0.05%: 15 |
| One-hour volume behavior (0-10) | ratio >=2 AND ATR% >=1: 10; otherwise ratio <0.7 AND abs(M)>=0.5: 7; otherwise ratio >=1.5: 4; otherwise 0 |

The risk formula has no directional preference: upside and downside extension can both raise risk. Funding bands compare the returned per-event rate without assuming its interval. Display each contribution and its measured reason. Assign the human-readable band from the final rounded score, including normalized partial and spot-only scores:

| Observed Market Risk Score | Band |
|---|---|
| 0-24 | LOW |
| 25-49 | MODERATE |
| 50-74 | HIGH |
| 75-100 | EXTREME |

These labels are not safety guarantees. Keep PARTIAL and spot-only scope visible beside the score and band where applicable. If the score is UNAVAILABLE, its band is also UNAVAILABLE.

### Incomplete inputs

Do not assign zero to missing components. The extension component is fully known only with all three usable timeframes. The conflict component is fully known when all applicable rules can be evaluated, or when a confirmed directional conflict already establishes its maximum 25. Evaluating directional agreement requires all three timeframes; two opposing available timeframes are sufficient to confirm conflict. Verified lack of a matching perpetual makes the funding component and funding-divergence rule inapplicable, not unavailable; remove the funding component from the denominator. Failed discovery does not qualify as verified absence.

With at least two usable timeframes and usable one-hour volatility, report a partial score when needed: `100 * sum(known component points) / sum(known applicable component maxima)`. Show numerator, denominator, omitted components and the word PARTIAL. Otherwise Observed Market Risk Score is UNAVAILABLE. Complete reports with applicable funding use the direct sum. A verified no-perpetual report with all other components known uses the 85-point denominator and must label the scope as spot-only; omit any further unknown components under the same partial-score formula. Never compare scores with different coverage as equally reliable.

## Confidence Score (0-95, displayed out of 100)

Keep the internal baseline at 100 and subtract the following penalties. Then apply the final ceiling: `confidence = min(95, max(0, 100 - sum(penalties)))`. This is a cap, not a new 95-point baseline; existing deductions are unchanged. Never report AI confidence as 100/100.

- 15 per unusable timeframe; for each usable timeframe with only 30-59 contiguous closed bars subtract 5 instead.
- 10 for unavailable current spot price; 10 for unavailable full 24-hour ticker (missing change/high/low/volume means incomplete ticker).
- 10 if perpetual discovery fails or an existing perpetual's funding cannot be read; 0 for verified absence.
- 10 if the one-hour volume ratio is unavailable.
- 10 if the exchange clock is unavailable and local UTC must be used.
- 15 once if any present current source is >5 minutes old at retrieval end, any latest closed candle is more than two of its intervals old at retrieval end, the market retrieval window spans >2 minutes, or source timestamps are invalid/in the future beyond 5 seconds. List the cause. Historical candles within normal coverage are not stale merely because they are old. Use the timing definition below; never count post-retrieval reasoning or report writing.
- 20 for directional conflict, 10 for volume divergence, 10 for funding/price divergence; these conflict penalties are cumulative.

Cap confidence at 40 if risk is UNAVAILABLE. Set confidence to 0 if the symbol cannot be validated, there is no usable market evidence or MCP fails entirely. Missing fields are always listed even when no separate deduction exists. This score is evidence quality, not statistical certainty.

## Retrieval timing and freshness reference

Record UTC dispatch/completion times for market requests. Retrieval starts immediately before the first required market request (including exchange information) and ends when the final required market request or its one allowed retry settles, including failed requests. Elapsed seconds are wall-clock end minus start, not summed parallel request durations. Use a monotonic elapsed timer if available and retain UTC boundaries for audit. Record fallback metadata-discovery duration separately; discovery before the first market request is not retrieval time, while delays inside the market window remain included because snapshots can become misaligned. Initial instruction reading, calculation and report generation after the final market response are excluded.

Use a valid exchange clock advanced by measured elapsed time since its response to estimate exchange time at retrieval end; otherwise use labeled local UTC and the existing 10-point clock deduction. Assess each source against this fixed retrieval-end reference. Future-time checks compare a source timestamp with exchange/local time at that call's receipt (5-second tolerance). Funding next settlement is not a current-source timestamp. A timestamp-free price response has retrieval-time-only attribution; do not invent its source time. Long reasoning after retrieval must not change the confidence score or extend the retrieval timer; retain the original snapshot timestamp and do not imply the report is a newer observation.

## Arithmetic review examples (synthetic, not market observations)

- All timeframes present, no conflict, ATR%=0.8, max abs(M)=1.5, funding=0.02%, volume ratio=1.2: risk=10+7+0+5+0=22 (LOW); fresh complete evidence confidence=min(95,100)=95.
- Same inputs but directional conflict: risk=47 (MODERATE), confidence=min(95,100-20)=80, Directional Bias MIXED and `CONFLICT DETECTED`.
- First example with verified no perpetual: risk=100*(10+7+0+0)/85=20 rounded (LOW); spot-only scope, funding UNAVAILABLE (no matching contract), confidence remains 95.
- Entire MCP failure: all market outputs UNAVAILABLE, risk UNAVAILABLE, confidence 0. Never present a score of zero as a substitute for absent evidence.
