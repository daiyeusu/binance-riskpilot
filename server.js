const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');

const root = __dirname;
let busy = false;
const assets = { '/': ['index.html', 'text/html'], '/style.css': ['style.css', 'text/css'], '/app.js': ['app.js', 'text/javascript'] };
function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}
async function analyze(symbol) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'triframe-'));
  const output = path.join(dir, 'report.txt');
  const args = ['-c', 'mcp_servers.binance_agent_os.default_tools_approval_mode="approve"', 'exec', '--cd', root, '--sandbox', 'read-only', '--ephemeral', '--color', 'never', '--output-last-message', output, '-'];
  try {
    await new Promise((resolve, reject) => {
      // PowerShell invokes the installed Windows shim; every argument is literal.
      const quote = value => "'" + value.replace(/'/g, "''") + "'";
      const child = process.platform === 'win32'
        ? spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', '& codex ' + args.map(quote).join(' ') + '; exit $LASTEXITCODE'], { cwd: root, windowsHide: true })
        : spawn('codex', args, { cwd: root });
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        if (process.platform === 'win32') spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
        else child.kill('SIGTERM');
      }, 15 * 60 * 1000);
      child.stdout.resume();
      child.stderr.resume();
      child.stdin.on('error', () => {});
      child.on('error', error => { clearTimeout(timer); reject(new Error('Could not start Codex CLI: ' + error.message)); });
      child.on('close', code => {
        clearTimeout(timer);
        if (timedOut) reject(new Error('Analysis exceeded 15 minutes. Check the Codex CLI and MCP connection.'));
        else if (code !== 0) reject(new Error('Codex CLI exited with code ' + code + '. Check CLI sign-in and the existing Binance Agent OS connection.'));
        else resolve();
      });
      child.stdin.end(`Analyze ${symbol}\n\nFollow AGENTS.md, prompts/RISKPILOT.md and docs/SCORING.md. Return the concise v0.3 DEMO REPORT branded TriFrame Guard AI. Public Binance Agent OS market reads only; never trade, access accounts, use direct Binance HTTP, or change files/configuration. Return the final report, preserving all missing-data and freshness caveats.`);
    });
    const report = (await fs.readFile(output, 'utf8')).trim();
    if (!report) throw new Error('Codex returned no final report.');
    return report;
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
}
const server = http.createServer(async (req, res) => {
  try {
    if (!['localhost:3000', '127.0.0.1:3000'].includes(req.headers.host)) return json(res, 403, { error: 'Local access only.' });
    if (req.method === 'GET' && assets[req.url]) {
      const [file, type] = assets[req.url];
      res.writeHead(200, { 'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'", 'X-Content-Type-Options': 'nosniff' });
      return res.end(await fs.readFile(path.join(root, 'public', file)));
    }
    if (req.method !== 'POST' || req.url !== '/api/analyze') return json(res, 404, { error: 'Not found.' });
    if (req.headers.origin && !['http://localhost:3000', 'http://127.0.0.1:3000'].includes(req.headers.origin)) return json(res, 403, { error: 'Local access only.' });
    if (!(req.headers['content-type'] || '').startsWith('application/json')) return json(res, 415, { error: 'Use application/json.' });
    let body = '';
    for await (const chunk of req) { body += chunk; if (body.length > 1024) return json(res, 413, { error: 'Request too large.' }); }
    let input;
    try { input = JSON.parse(body); } catch { return json(res, 400, { error: 'Invalid JSON.' }); }
    const symbol = typeof input?.symbol === 'string' ? input.symbol.trim().toUpperCase() : '';
    if (!/^[A-Z0-9]{5,24}$/.test(symbol)) return json(res, 400, { error: 'Enter a complete Binance pair, for example BNBUSDT (5–24 letters/digits).' });
    if (busy) return json(res, 409, { error: 'An analysis is already running. Please wait.' });
    busy = true;
    try { json(res, 200, { symbol, report: await analyze(symbol) }); }
    finally { busy = false; }
  } catch (error) { json(res, 500, { error: error.message || 'Analysis failed.' }); }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(3000, '127.0.0.1', () => console.log('TriFrame Guard AI — http://localhost:3000'));
