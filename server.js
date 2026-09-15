const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 10000;

const WORKERS_URL = 'https://klmanga-proxy.shunichi-0314.workers.dev';

app.get('*', async (req, res) => {
  try {
    const targetPath = req.url;
    const targetUrl = `${WORKERS_URL}${targetPath}`;
    
    console.log(`Proxying to: ${targetUrl}`);
    
    // Workersにリクエスト
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
    });

    console.log(`Response status: ${response.status}`);
    
    const contentType = response.headers.get('Content-Type') || '';
    
    // レスポンスヘッダーを設定
    res.setHeader('Content-Type', contentType || 'text/html; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (response.status === 200 && contentType.includes('text/html')) {
      let html = await response.text();
      
      // WorkersのURLをRenderのURLに置換
      const renderOrigin = `${req.protocol}://${req.get('host')}`;
      html = html.replace(/https:\/\/klmanga-proxy\.shunichi-0314\.workers\.dev/g, renderOrigin);
      
      res.send(html);
    } else {
      // HTML以外はそのままストリーム
      response.body.pipe(res);
    }

  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).send(`
      <h1>Proxy Error</h1>
      <p>Error: ${error.message}</p>
      <p>Workers URL: ${WORKERS_URL}</p>
      <p>Requested path: ${req.url}</p>
    `);
  }
});

// OPTIONSリクエストへの対応
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Render proxy server running on port ${PORT}`);
  console.log(`Target Workers: ${WORKERS_URL}`);
  console.log(`Test URL: http://localhost:${PORT}/page/2/`);
});
