const express = require('express');
const fetch = require('node-fetch');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 10000;
const WORKERS_URL = 'https://klmanga-proxy.shunichi-0314.workers.dev';

// HTTPSエージェントの設定（SSL検証を緩和）
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

app.get('*', async (req, res) => {
  try {
    const targetUrl = `${WORKERS_URL}${req.url}`;
    
    console.log(`Fetching from Workers: ${targetUrl}`);
    console.log(`Request headers:`, {
      'User-Agent': req.get('User-Agent'),
      'Referer': req.get('Referer'),
      'Origin': req.get('Origin')
    });
    
    // Workersにアクセス
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'no-cache',
        // Origin と Referer を動的に設定（重要：Workers がブラウザからのアクセスと認識するため）
        'Origin': `${req.protocol}://${req.get('host')}`,
        'Referer': `${req.protocol}://${req.get('host')}/`,
      },
      agent: httpsAgent,
    });
    
    console.log(`Workers response status: ${response.status}`);
    
    if (response.status === 403) {
      const errorBody = await response.text();
      console.error('Workers returned 403:', errorBody);
      return res.status(503).send(`
        <h1>503 Service Unavailable</h1>
        <p>Workers returned 403 Forbidden.</p>
        <p><strong>Workersは直接アクセス可能です:</strong></p>
        <p><a href="${WORKERS_URL}${req.url}" target="_blank">${WORKERS_URL}${req.url}</a></p>
        <p>WorkersのコードでCORS設定を確認してください。</p>
      `);
    }
    
    const contentType = response.headers.get('Content-Type') || '';
    
    // レスポンスヘッダーを設定
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // レスポンスボディを転送
    response.body.pipe(res);

  } catch (error) {
    console.error('Error fetching from Workers:', error.message);
    res.status(500).send(`<h1>500 Internal Server Error</h1><p>Error: ${error.message}</p>`);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Proxying to: ${WORKERS_URL}`);
});