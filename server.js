// Servidor HTTP Nativo para Execução Local do NexusTrack (Zero Dependências)
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3030;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Roteamento de APIs
  if (pathname.startsWith('/api/')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      req.body = body;
      req.query = parsedUrl.query;

      if (pathname === '/api/v1/stats') {
        return require('./api/v1/stats')(req, res);
      }
      if (pathname === '/api/v1/track') {
        return require('./api/v1/track')(req, res);
      }
      if (pathname === '/api/v1/webhooks/ggcheckout') {
        return require('./api/v1/webhooks/ggcheckout')(req, res);
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Endpoint não encontrado' }));
    });
    return;
  }

  // Arquivos estáticos em public/
  let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
  
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(__dirname, 'public', 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`⚡ NexusTrack (Rastreador Multi-Ofertas) Ativo!`);
  console.log(`👉 Painel Local: http://localhost:${PORT}`);
  console.log(`👉 Tracker Script: http://localhost:${PORT}/tracker.js`);
  console.log(`👉 Webhook GGCheckout: http://localhost:${PORT}/api/v1/webhooks/ggcheckout`);
  console.log(`=======================================================`);
});
