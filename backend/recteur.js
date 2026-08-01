const http = require('http');
const os = require('os');
const PORT = process.env.API_PORT || 8000;
const HOST = process.env.API_HOST || '0.0.0.0';
const agents = [
  { id: 'niche-validator', name: 'NICHE-VALIDATOR', status: 'ready', tasks: 0 },
  { id: 'script-alchemist', name: 'SCRIPT-ALCHEMIST', status: 'ready', tasks: 0 },
  { id: 'video-fabricant', name: 'VIDEO-FABRICANT', status: 'ready', tasks: 0 },
  { id: 'distribution-sentinel', name: 'DISTRIBUTION-SENTINEL', status: 'ready', tasks: 0 }
];
const taskQueue = [];
let taskIdCounter = 1;
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  if (path === '/' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({service:'APEX-Mycélium Recteur v1',status:'operational',mode:process.env.RECTEUR_MODE||'prototype',agents_active:agents.length,tasks_queued:taskQueue.length,timestamp:new Date().toISOString()}));
  } else if (path === '/health' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({status:'healthy',uptime:process.uptime()}));
  } else if (path === '/agents' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify(agents));
  } else if (path === '/tasks' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify(taskQueue));
  } else if (path === '/task' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const task = {id:`task-${taskIdCounter++}`,agent:payload.agent||agents[0].id,action:payload.action||'process',data:payload.data||{},status:'queued',created_at:new Date().toISOString()};
        taskQueue.push(task);
        res.writeHead(201);
        res.end(JSON.stringify(task));
      } catch (err) { res.writeHead(400); res.end(JSON.stringify({error:'Invalid JSON'})); }
    });
  } else { res.writeHead(404); res.end(JSON.stringify({error:'Not found'})); }
});
server.listen(PORT, HOST, () => {
  const ip = getLocalIP();
  console.log(`🐝 Recteur listening on http://${ip}:${PORT}`);
  console.log(`   Health: http://${ip}:${PORT}/health`);
  console.log(`   Agents: http://${ip}:${PORT}/agents`);
});
process.on('SIGTERM', () => { console.log('Shutting down gracefully...'); server.close(() => process.exit(0)); });
