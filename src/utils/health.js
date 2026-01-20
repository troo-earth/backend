const express = require('express');
const axios = require('axios');
const os = require('os');

const sequelize = require('../config/database');
const redisClient = require('../config/redis');

const router = express.Router();

/* -------------------------------
   In-memory health state
-------------------------------- */
const healthState = {
    startedAt: new Date(),
    lastRequest: null,
    stats: {
        totalRequests: 0,
        totalErrors: 0,
        totalResponseTime: 0,
        requestCount: 0,
    }
};

/* -------------------------------
   Request tracker & Metrics
-------------------------------- */
function markRequest(req, res) {
    const path = req.originalUrl || req.path;

    // Filter internal/dashboard traffic
    if (path === '/' || path.startsWith('/health') || path.includes('favicon')) {
        return;
    }

    const start = process.hrtime();

    // Log Last Request
    healthState.lastRequest = {
        time: new Date(),
        ip: req.ip,
        path: path,
        method: req.method,
    };

    healthState.stats.totalRequests++;

    if (res && typeof res.on === 'function') {
        res.on('finish', () => {
            const diff = process.hrtime(start);
            const timeMs = (diff[0] * 1e9 + diff[1]) / 1e6;

            healthState.stats.totalResponseTime += timeMs;
            healthState.stats.requestCount++;

            if (res.statusCode >= 400) {
                healthState.stats.totalErrors++;
            }
        });
    }
}

/* -------------------------------
   Health data collector
-------------------------------- */
async function collectHealth() {
    // ---------- Database ----------
    let dbStatus = 'disconnected';
    let dbPingMs = null;

    try {
        const start = Date.now();
        await sequelize.authenticate();
        dbPingMs = Date.now() - start;
        dbStatus = 'connected';
    } catch {
        dbStatus = 'error';
    }

    // ---------- Redis ----------
    let redisStatus = 'disconnected';
    let redisPingMs = null;

    try {
        const start = Date.now();
        await redisClient.ping();
        redisPingMs = Date.now() - start;
        redisStatus = 'connected';
    } catch {
        redisStatus = 'error';
    }

    // ---------- Frontend (Hardcoded) ----------
    let frontendStatus = 'unknown';
    let frontendPingMs = null;
    const frontendUrl = 'https://dev.troo.earth'; // <--- Hardcoded URL

    try {
        const start = Date.now();
        const response = await axios.get(frontendUrl, {
            timeout: 3000,
            validateStatus: () => true, // Accept any status to calculate ping
        });
        frontendPingMs = Date.now() - start;
        // Check if site is actually up (200-499 range)
        frontendStatus = (response.status >= 200 && response.status < 500) ? 'reachable' : 'unhealthy';
    } catch {
        frontendStatus = 'unreachable';
    }

    // ---------- Stripe API (New) ----------
    let stripeStatus = 'unknown';
    let stripePingMs = null;

    try {
        const start = Date.now();
        // Pings Stripe's public API health check endpoint
        await axios.get('https://api.stripe.com/healthcheck', { timeout: 3000 });
        stripePingMs = Date.now() - start;
        stripeStatus = 'reachable';
    } catch {
        stripeStatus = 'unreachable';
    }

    // ---------- System Metrics ----------
    const memoryUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = Math.round((usedMem / totalMem) * 100);
    const loadAvg = os.loadavg();

    // Stats Calcs
    const totalReqs = healthState.stats.totalRequests;
    const errors = healthState.stats.totalErrors;
    const successCount = totalReqs - errors;
    const successRate = totalReqs > 0 ? ((successCount) / totalReqs * 100).toFixed(1) : 100;
    const avgTime = healthState.stats.requestCount > 0 ? (healthState.stats.totalResponseTime / healthState.stats.requestCount).toFixed(2) : 0;

    return {
        status: (dbStatus === 'connected' && redisStatus === 'connected') ? 'ok' : 'issue',
        timestamp: new Date().toISOString(),
        runtime: {
            uptimeSeconds: Math.floor(process.uptime()),
            // --- NEW DATA POINTS ---
            nodeVersion: process.version,
            platform: `${os.type()} (${os.arch()})`,
            cpuCount: os.cpus().length,
            // -----------------------
            memory: {
                rss: Math.round(memoryUsage.rss / 1024 / 1024),
                // --- NEW MEMORY DATA ---
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                // -----------------------
                systemPercent: memPercent
            },
            cpu: {
                loadAvg: loadAvg.map(l => l.toFixed(2))
            }
        },
        traffic: {
            totalRequests: totalReqs,
            successCount: successCount,
            failedCount: errors,
            successRate: successRate,
            avgResponseTime: avgTime,
            lastRequest: healthState.lastRequest,
        },
        dependencies: {
            database: { status: dbStatus, pingMs: dbPingMs },
            redis: { status: redisStatus, pingMs: redisPingMs },
            frontend: {
                url: process.env.FRONTEND_HEALTH_URL,
                status: frontendStatus,
                pingMs: frontendPingMs,
            },
            stripe: {
                status: stripeStatus,
                pingMs: stripePingMs,
            },
        },
    };
}

/* -------------------------------
   UI at /
-------------------------------- */
router.get('/', async (req, res) => {
    const health = await collectHealth();

    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Troo Earth · API Status</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  
  <link rel="icon" type="image/svg+xml" href="https://dev.troo.earth/favicon.svg">
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:opsz,wght@6..12,300;400;600;700;800;900&display=swap" rel="stylesheet">
  
  <style>
    :root {
      --brand-teal: #007473;
      --brand-dark: #173E35;
      --brand-accent: #FFB71B;
      --bg-color: #F8F9FA;
      --text-main: #173E35;
      --text-muted: #64748b;
    }

    * { box-sizing: border-box; }

    body {
      background-color: var(--bg-color);
      color: var(--text-main);
      font-family: 'Nunito Sans', sans-serif;
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      overflow-x: hidden;
    }

    /* --- Atmospheric Layer --- */
    .atmosphere {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none;
      z-index: -1;
      overflow: hidden;
    }

    .blob {
      position: absolute;
      border-radius: 50%;
      opacity: 0.2;
    }

    .blob-1 {
      top: -10%; left: -5%;
      width: 600px; height: 600px;
      background: var(--brand-teal);
      filter: blur(140px);
    }

    .blob-2 {
      top: 10%; right: -10%;
      width: 500px; height: 500px;
      background: var(--brand-accent);
      filter: blur(120px);
      animation: pulse 8s ease-in-out infinite;
    }

    .blob-3 {
      bottom: -10%; left: 10%;
      width: 500px; height: 500px;
      background: var(--brand-teal);
      filter: blur(130px);
    }

    .noise {
      position: absolute;
      inset: 0;
      opacity: 0.04;
      background-image: url('https://grainy-gradients.vercel.app/noise.svg');
      mix-blend-mode: overlay;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.2; transform: scale(1); }
      50% { opacity: 0.3; transform: scale(1.1); }
    }

    /* --- Container --- */
    .container {
      width: 100%;
      max-width: 1000px;
      padding: 60px 24px;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* --- Header --- */
    header {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 50px;
    }

    .brand-logo {
      height: 48px; /* Adjusted size for the full logo */
      width: auto;
    }

    .time-badge {
      font-size: 14px;
      font-weight: 700;
      background: rgba(255,255,255,0.6);
      padding: 8px 16px;
      border-radius: 99px;
      border: 1px solid rgba(0,0,0,0.05);
      color: var(--brand-dark);
      backdrop-filter: blur(4px);
    }

    /* --- HERO STATUS --- */
    .hero-status {
      text-align: center;
      margin-bottom: 50px;
      width: 100%;
    }

    .status-headline {
      font-size: 56px;
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -2px;
      margin: 0;
      /* CHANGED: 'to right' -> 'to left' */
      background: linear-gradient(to left, var(--brand-teal), var(--brand-dark));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .status-headline.issue {
      background: linear-gradient(to right, #EF4444, #B91C1C);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .status-sub {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-muted);
      margin-top: 12px;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    /* --- Main Card --- */
    .glass-card {
      width: 100%;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(20px);
      border-radius: 32px;
      box-shadow: 0 20px 80px -20px rgba(0, 116, 115, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.6);
      overflow: hidden;
      position: relative;
    }

    /* Loading Line */
    .loading-line {
      height: 6px;
      width: 0%;
      background: var(--brand-accent);
      position: absolute;
      top: 0; left: 0;
      z-index: 20;
    }
    .loading-line.animate {
      width: 100%;
      transition: width 10s linear;
    }

    /* --- Grid --- */
    .grid-layout {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      divide-x: 1px solid rgba(0,0,0,0.04);
    }
    @media (max-width: 900px) { 
      .grid-layout { grid-template-columns: 1fr; divide-x: none; divide-y: 1px solid rgba(0,0,0,0.04); } 
    }

    .column {
      padding: 40px;
    }

    .col-header {
      text-transform: uppercase;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #94a3b8;
      margin-bottom: 30px;
    }

    /* --- Metric Typography --- */
    .metric-block {
      margin-bottom: 24px;
    }
    
    .metric-value {
      font-size: 36px;
      font-weight: 800;
      color: var(--brand-dark);
      line-height: 1;
      letter-spacing: -1px;
    }
    
    .metric-label {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-muted);
      margin-top: 6px;
    }

    /* --- List Rows --- */
    .list-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid rgba(0,0,0,0.03);
      font-size: 15px;
    }
    .list-row:last-child { border-bottom: none; }
    
    .key { color: var(--text-muted); font-weight: 600; }
    .val { font-weight: 700; color: var(--brand-dark); }

    /* --- Pills --- */
    .pill {
      padding: 6px 14px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .pill.ok { background: rgba(0, 116, 115, 0.08); color: var(--brand-teal); }
    .pill.err { background: rgba(239, 68, 68, 0.08); color: #EF4444; }

    .dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
    .blink-green { animation: pulse-g 2s infinite; }
    .blink-red { animation: pulse-r 1s infinite; }
    
    @keyframes pulse-g { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
    @keyframes pulse-r { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }

    /* --- Footer Area --- */
    .footer-req {
      background: rgba(23, 62, 53, 0.03);
      padding: 24px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: monospace;
      font-size: 13px;
      color: var(--brand-dark);
      border-top: 1px solid rgba(0,0,0,0.05);
    }

    .footer-msg {
      margin-top: 30px;
      text-align: center;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-muted);
    }
  </style>
</head>
<body>

  <div class="atmosphere">
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>
    <div class="blob blob-3"></div>
    <div class="noise"></div>
  </div>

  <div class="container">
    
    <header>
      <img src="https://dev.troo.earth/assets/mainLogo-Do2wEJmm.svg" alt="Troo Earth" class="brand-logo" />
      
      <div class="time-badge">
        <span id="time-display">${new Date().toLocaleTimeString()}</span>
      </div>
    </header>

    <div class="hero-status">
      <h1 id="global-headline" class="status-headline">All Systems Operational</h1>
      <p class="status-sub">Real-time monitoring of API performance and dependencies.</p>
    </div>

    <div class="glass-card">
      <div id="progress-bar" class="loading-line animate"></div>

      <div class="grid-layout">
        
        <div class="column">
          <div class="col-header">Traffic & Quality</div>
          
          <div class="metric-block">
            <div class="metric-value" id="total-req">${health.traffic.totalRequests}</div>
            <div class="metric-label">Total Requests</div>
          </div>

          <div class="list-row">
            <span class="key">Successful</span>
            <span class="val" style="color:var(--brand-teal)" id="success-count">${health.traffic.successCount}</span>
          </div>
          <div class="list-row">
            <span class="key">Failed</span>
            <span class="val" style="color:#EF4444" id="failed-count">${health.traffic.failedCount}</span>
          </div>
          <div class="list-row">
            <span class="key">Success Rate</span>
            <span class="val" id="success-rate">${health.traffic.successRate}%</span>
          </div>
          <div class="list-row">
            <span class="key">Avg Latency</span>
            <span class="val" id="avg-time">${health.traffic.avgResponseTime}ms</span>
          </div>
        </div>

        <div class="column">
          <div class="col-header">Resources</div>
          
          <div class="metric-block">
            <div class="metric-value" id="uptime" style="font-size:28px">--h --m --s</div>
            <div class="metric-label">System Uptime</div>
          </div>

          <div class="list-row">
            <span class="key">Memory (RSS)</span>
            <span class="val" id="mem-rss">${health.runtime.memory.rss} MB</span>
          </div>
          <div class="list-row">
            <span class="key">Heap Used</span>
            <span class="val"><span id="mem-heap">${health.runtime.memory.heapUsed}</span> MB</span>
          </div>
          <div class="list-row">
            <span class="key">Load Avg</span>
            <span class="val" id="load">${health.runtime.cpu.loadAvg[0]}</span>
          </div>
          <div class="list-row">
            <span class="key">Platform</span>
            <span class="val" style="font-size:13px">${health.runtime.platform}</span>
          </div>
          <div class="list-row">
            <span class="key">Runtime</span>
            <span class="val">${health.runtime.nodeVersion} <span style="font-weight:400; opacity:0.5">/</span> ${health.runtime.cpuCount}c</span>
          </div>
        </div>

        <div class="column">
          <div class="col-header">Connectivity</div>
          
          <div class="list-row">
            <span class="key">Database</span>
            <span id="pill-db" class="pill ${health.dependencies.database.status === 'connected' ? 'ok' : 'err'}">
              <span id="dot-db" class="dot ${health.dependencies.database.status === 'connected' ? 'blink-green' : 'blink-red'}"></span>
              <span id="ping-db">${health.dependencies.database.pingMs || '?'} ms</span>
            </span>
          </div>

          <div class="list-row">
            <span class="key">Redis Cache</span>
            <span id="pill-redis" class="pill ${health.dependencies.redis.status === 'connected' ? 'ok' : 'err'}">
              <span id="dot-redis" class="dot ${health.dependencies.redis.status === 'connected' ? 'blink-green' : 'blink-red'}"></span>
              <span id="ping-redis">${health.dependencies.redis.pingMs || '?'} ms</span>
            </span>
          </div>

          <div class="list-row">
            <span class="key">Frontend</span>
            <span id="pill-fe" class="pill ${health.dependencies.frontend.status === 'reachable' ? 'ok' : 'err'}">
              <span id="dot-fe" class="dot ${health.dependencies.frontend.status === 'reachable' ? 'blink-green' : 'blink-red'}"></span>
              <span id="ping-fe">${health.dependencies.frontend.pingMs || '?'} ms</span>
            </span>
          </div>

          <div class="list-row">
            <span class="key">Stripe API</span>
            <span id="pill-stripe" class="pill err"> <span id="dot-stripe" class="dot blink-red"></span>
              <span id="ping-stripe">? ms</span>
            </span>
          </div>
        </div>
      </div>

      <div class="footer-req">
        <div><span style="opacity:0.5; margin-right:10px;">LAST INBOUND</span> <span id="req-method" style="font-weight:bold">${health.traffic.lastRequest?.method || '-'}</span></div>
        <div id="req-path">${health.traffic.lastRequest?.path || '-'}</div>
        <div id="req-ip" style="opacity:0.6">${health.traffic.lastRequest?.ip || '-'}</div>
      </div>
    </div>

    <div class="footer-msg">
      <div id="updates-msg">Live Updates Active · <span id="count">3</span> refreshes remaining</div>
    </div>

  </div>

  <script>
    let updatesLeft = 3;
    const progressBar = document.getElementById('progress-bar');
    
    // Helper to format seconds into HHh MMm SSs
    function formatUptime(seconds) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      return h + 'h ' + m + 'm ' + s + 's';
    }
    
    function resetProgressBar() {
      progressBar.classList.remove('animate');
      progressBar.style.width = '0%';
      void progressBar.offsetWidth; // Force Reflow
      progressBar.classList.add('animate');
      progressBar.style.width = '100%';
    }

    function updateUI(data) {
       document.getElementById('time-display').innerText = new Date().toLocaleTimeString();

       // Traffic
       document.getElementById('total-req').innerText = data.traffic.totalRequests;
       document.getElementById('success-count').innerText = data.traffic.successCount;
       document.getElementById('failed-count').innerText = data.traffic.failedCount;
       document.getElementById('success-rate').innerText = data.traffic.successRate + '%';
       document.getElementById('avg-time').innerText = data.traffic.avgResponseTime + 'ms';
       
       // Resources (Formatted Uptime)
       document.getElementById('uptime').innerText = formatUptime(data.runtime.uptimeSeconds);
       document.getElementById('mem-rss').innerText = data.runtime.memory.rss + ' MB';
       document.getElementById('load').innerText = data.runtime.cpu.loadAvg[0];
       document.getElementById('mem-heap').innerText = data.runtime.memory.heapUsed;

       // Pills
       const setPill = (id, status, ping) => {
         const pill = document.getElementById('pill-' + id);
         const dot = document.getElementById('dot-' + id);
         const pingEl = document.getElementById('ping-' + id);
         const isOk = status === 'connected' || status === 'reachable';
         
         pill.className = 'pill ' + (isOk ? 'ok' : 'err');
         dot.className = 'dot ' + (isOk ? 'blink-green' : 'blink-red');
         pingEl.innerText = (ping !== null ? ping : '?') + ' ms';
       };

       setPill('db', data.dependencies.database.status, data.dependencies.database.pingMs);
       setPill('redis', data.dependencies.redis.status, data.dependencies.redis.pingMs);
       setPill('fe', data.dependencies.frontend.status, data.dependencies.frontend.pingMs);
       setPill('stripe', data.dependencies.stripe.status, data.dependencies.stripe.pingMs);

       // Last Req
       if (data.traffic.lastRequest) {
         document.getElementById('req-method').innerText = data.traffic.lastRequest.method;
         document.getElementById('req-path').innerText = data.traffic.lastRequest.path;
         document.getElementById('req-ip').innerText = data.traffic.lastRequest.ip;
       }
       
       // Headline Status
       const hl = document.getElementById('global-headline');
       if (data.status === 'ok') {
         hl.classList.remove('issue');
         hl.innerText = "All Systems Operational";
       } else {
         hl.classList.add('issue');
         hl.innerText = "System Issues Detected";
       }
    }

    async function fetchHealth() {
      if (updatesLeft <= 0) return;

      try {
        const res = await fetch('/health/json');
        const data = await res.json();
        updateUI(data);
        
        updatesLeft--;
        document.getElementById('count').innerText = updatesLeft;

        if (updatesLeft > 0) {
           resetProgressBar();
        } else {
           progressBar.style.width = '100%';
           progressBar.classList.remove('animate');
           document.getElementById('updates-msg').innerHTML = 
            "<span style='color:#B45309; background:#FFFBEB; padding:6px 12px; border-radius:8px;'>updates paused</span>";
        }
      } catch (err) { console.error(err); }
    }

    // Init with initial server data passed in template if desired, 
    // but here we just trigger first fetch or use placeholders
    // Trigger first animation immediately
    setTimeout(resetProgressBar, 100);
    
    // Start interval
    setInterval(() => {
      if (updatesLeft > 0) fetchHealth();
    }, 10000);
  </script>
</body>
</html>
  `);
});

router.get('/health/json', async (req, res) => {
    const health = await collectHealth();
    res.json({ service: 'troo-earth-api', ...health });
});

module.exports = {
    healthRouter: router,
    markRequest,
};