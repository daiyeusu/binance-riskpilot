const $ = id => document.getElementById(id);
function parseReport(raw) {
  const text = raw.replace(/```[^\n]*\n?/g, '').replace(/\*\*/g, '').replace(/^#{1,6}\s*/gm, '').trim();
  const headings = ['Key Signals', 'Market Snapshot', 'AI Interpretation', 'Agent OS'];
  const lines = text.split(/\r?\n/).map(line => line.trim());
  const positions = headings.map(h => lines.findIndex(line => line.replace(/:$/, '') === h));
  if (positions.some((p, i) => p < 0 || (i && p <= positions[i - 1]))) throw new Error('Missing sections');
  function fields(rows) {
    const result = {}; let key;
    for (const row of rows) {
      const match = row.match(/^(?:[-*]\s+)?([^:]+):\s*(.*)$/);
      if (match) { key = match[1].replace(/\s*\([^)]*\)/g, '').trim(); if (key in result) throw new Error('Duplicate field'); result[key] = match[2]; }
      else if (row && key) result[key] += ' ' + row;
    }
    return result;
  }
  const summary = fields(lines.slice(0, positions[0]));
  const snapshot = fields(lines.slice(positions[1] + 1, positions[2]));
  const agent = fields(lines.slice(positions[3] + 1).filter(l => !l.startsWith('Research tool only.')));
  const signals = lines.slice(positions[0] + 1, positions[1]).filter(Boolean).join('\n');
  const interpretation = lines.slice(positions[2] + 1, positions[3]).filter(Boolean).join(' ');
  for (const [object, keys] of [[summary, ['Directional Bias', 'Observed Market Risk', 'Confidence', 'Momentum', 'Volatility', 'Funding', 'Conflict']], [snapshot, ['Price', '24h', '15m', '1h', '4h', 'Funding']], [agent, ['Tools used', 'Retrieval time', 'Timestamp']]]) {
    for (const key of keys) if (!object[key]) throw new Error('Missing field');
  }
  if (!signals || !interpretation || !/^(YES|NO|UNAVAILABLE)\b/.test(summary.Conflict)) throw new Error('Incomplete report');
  return { summary, snapshot, agent, signals, interpretation };
}
function listFields(id, data, keys) {
  $(id).replaceChildren();
  for (const key of keys) { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = key; dd.textContent = data[key]; $(id).append(dt, dd); }
}
function addMeter(card, key, text) {
  const match = text.match(/^\s*(?:PARTIAL\s+)?(\d+(?:\.\d+)?)\s*\/\s*100\b/i);
  const score = match ? Number(match[1]) : null;
  const available = score !== null && score >= 0 && score <= 100;
  const meter = document.createElement('div'), fill = document.createElement('span');
  const band = text.match(/\b(LOW|MODERATE|HIGH|EXTREME)\b/);
  meter.className = 'meter ' + (key === 'Confidence' ? 'confidence' : band ? band[1].toLowerCase() : '');
  if (available) {
    meter.setAttribute('role', 'meter');
    meter.setAttribute('aria-label', key);
    meter.setAttribute('aria-valuemin', '0');
    meter.setAttribute('aria-valuemax', '100');
    meter.setAttribute('aria-valuenow', String(score));
    meter.setAttribute('aria-valuetext', text);
    fill.style.width = score + '%';
  } else {
    meter.classList.add('unavailable');
    meter.setAttribute('aria-hidden', 'true');
  }
  meter.append(fill);
  const scale = document.createElement('div');
  scale.className = 'meter-scale';
  const start = document.createElement('span'), end = document.createElement('span');
  start.textContent = available ? '0' : 'Meter unavailable'; end.textContent = '100';
  scale.append(start, end); card.append(meter, scale);
}
function renderTriFrame(snapshot = {}) {
  $('triframe-cards').replaceChildren();
  for (const timeframe of ['15m', '1h', '4h']) {
    const direction = (snapshot[timeframe] || '').match(/^\s*(UP|FLAT|DOWN|UNAVAILABLE)\b/i)?.[1].toUpperCase() || 'UNAVAILABLE';
    const card = document.createElement('div'), label = document.createElement('small'), value = document.createElement('strong');
    card.className = 'frame-card ' + direction.toLowerCase();
    label.textContent = timeframe; value.textContent = direction;
    card.append(label, value); $('triframe-cards').append(card);
  }
}
function render(raw) {
  $('raw').textContent = raw;
  $('result').hidden = false;
  $('parsed').hidden = true;
  $('fallback').hidden = true;
  $('full').open = false;
  renderTriFrame();
  try {
    const data = parseReport(raw);
    $('cards').replaceChildren();
    for (const key of ['Directional Bias', 'Observed Market Risk', 'Confidence', 'Momentum', 'Volatility', 'Funding', 'Conflict']) {
      const card = document.createElement('div'), label = document.createElement('small'), value = document.createElement('strong');
      card.className = 'card'; label.textContent = key; value.textContent = data.summary[key]; card.append(label, value);
      if (key === 'Observed Market Risk' || key === 'Confidence') addMeter(card, key, data.summary[key]);
      $('cards').append(card);
    }
    renderTriFrame(data.snapshot);
    const conflict = data.summary.Conflict;
    $('conflict').className = conflict.startsWith('YES') ? 'warning' : conflict.startsWith('NO') ? '' : 'unknown';
    $('conflict').textContent = conflict.startsWith('YES') ? '⚠ CONFLICT DETECTED' : conflict.startsWith('NO') ? 'No major timeframe conflict detected.' + (conflict.length > 2 ? ' ' + conflict.slice(2).trim() : '') : 'Conflict: ' + conflict;
    const ul = document.createElement('ul');
    for (const signal of data.signals.split(/\n(?=[-*]\s)/)) { const li = document.createElement('li'); li.textContent = signal.replace(/^[-*]\s*/, '').replace(/\n/g, ' '); ul.append(li); }
    $('signals').replaceChildren(ul);
    listFields('snapshot', data.snapshot, ['Price', '24h', '15m', '1h', '4h', 'Funding']);
    listFields('agent', data.agent, ['Tools used', 'Retrieval time', 'Timestamp']);
    $('interpretation').textContent = data.interpretation;
    $('parsed').hidden = false;
  } catch { $('fallback').hidden = false; $('full').open = true; }
}
const pairChips = [...document.querySelectorAll('[data-pair]')];
function updatePairChips() {
  const selected = $('symbol').value.trim().toUpperCase();
  for (const chip of pairChips) chip.setAttribute('aria-pressed', String(chip.dataset.pair === selected));
}
for (const chip of pairChips) chip.addEventListener('click', () => {
  if ($('symbol').disabled) return;
  $('symbol').value = chip.dataset.pair;
  updatePairChips();
});
$('symbol').addEventListener('input', updatePairChips);
updatePairChips();
const loadingMessages = [
  'Retrieving live Binance market evidence',
  'Evaluating 15m  1h  4h market structure',
  'Checking funding and market conditions',
  'Preparing conflict-aware risk report'
];
$('analysis-form').addEventListener('submit', async event => {
  event.preventDefault();
  if ($('run').disabled) return;
  $('run').disabled = true; $('symbol').disabled = true; $('result').hidden = true;
  for (const chip of pairChips) chip.disabled = true;
  $('status').className = 'loading'; $('status').textContent = 'Agent OS analysis in progress...';
  const elapsed = document.createElement('span'), message = document.createElement('small');
  elapsed.className = 'elapsed'; elapsed.setAttribute('aria-live', 'off'); elapsed.textContent = 'Elapsed: 0s';
  message.className = 'loading-message'; message.textContent = loadingMessages[0];
  $('status').append(elapsed, message);
  const startedAt = performance.now();
  let messageIndex = 0;
  const loadingTimer = setInterval(() => {
    const seconds = Math.floor((performance.now() - startedAt) / 1000);
    elapsed.textContent = `Elapsed: ${seconds}s`;
    const nextIndex = Math.floor(seconds / 4) % loadingMessages.length;
    if (nextIndex !== messageIndex) {
      messageIndex = nextIndex;
      message.textContent = loadingMessages[messageIndex];
    }
  }, 1000);
  try {
    const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol: $('symbol').value.trim().toUpperCase() }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Analysis failed.');
    if (typeof data.report !== 'string' || !data.report.trim()) throw new Error('No final report received.');
    render(data.report); $('status').className = ''; $('status').textContent = data.symbol + ' · Agent analysis complete';
  } catch (error) { $('status').className = 'error'; $('status').textContent = error.message; }
  finally {
    clearInterval(loadingTimer);
    $('run').disabled = false; $('symbol').disabled = false;
    for (const chip of pairChips) chip.disabled = false;
  }
});
