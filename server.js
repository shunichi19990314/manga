const express = require('express');
const fetch = require('node-fetch');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 10000;
const WORKERS_URL = 'https://klmanga-proxy.shunichi-0314.workers.dev';

// HTTPS エージェントの設定（SSL 検証を緩和）
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
});

app.get('*', async (req, res) => {
  try {
    const targetUrl = `${WORKERS_URL}${req.url}`;
    
    // クライアントから実際の Origin/Referer を取得、なければフォールバック
    const clientHost = req.get('host') || 'localhost';
    const clientProtocol = req.protocol || 'http';
    const origin = req.get('Origin') || `${clientProtocol}://${clientHost}`;
    const referer = req.get('Referer') || `${clientProtocol}://${clientHost}/`;
    
    console.log(`Fetching from Workers: ${targetUrl}`);
    console.log(`Request headers:`, {
      'User-Agent': req.get('User-Agent'),
      'Referer': referer,
      'Origin': origin
    });
    
    // Workers にアクセス
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Ch-Ua': '"Chromium";v="131", "Not_A Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        // Origin と Referer を設定
        'Origin': origin,
        'Referer': referer,
      },
      agent: httpsAgent,
      redirect: 'follow',
    });
    
    console.log(`Workers response status: ${response.status}`);
    
    if (response.status === 403) {
      const errorBody = await response.text();
      console.error('Workers returned 403:', errorBody.substring(0, 500));
      return res.status(503).send(`
        <h1>503 Service Unavailable</h1>
        <p>Workers returned 403 Forbidden.</p>
        <p><strong>Workers は直接アクセス可能です:</strong></p>
        <p><a href="${WORKERS_URL}${req.url}" target="_blank">${WORKERS_URL}${req.url}</a></p>
        <p>Cloudflare のセキュリティブロックを受けています。</p>
        <p>Ray ID: 確認するには Workers のログを確認してください。</p>
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
