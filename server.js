const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 10000;

// Cloudflare WorkersのURL
const WORKERS_URL = 'https://klmanga-proxy.shunichi-0314.workers.dev';

app.get('*', async (req, res) => {
  try {
    // Workersにリクエストを飛ばす
    const targetUrl = `${WORKERS_URL}${req.url}`;
    
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': req.get('User-Agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });

    const contentType = response.headers.get('Content-Type') || '';
    
    // HTMLの場合
    if (contentType.includes('text/html')) {
      const html = await response.text();
      
      // WorkersのURLを、Render自身のURLに書き換える
      const renderOrigin = `${req.protocol}://${req.get('host')}`;
      const modifiedHtml = html.replace(new RegExp(WORKERS_URL.replace('https://', ''), 'g'), renderOrigin);
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(modifiedHtml);
    } else {
      // 画像やCSSなどはそのままストリームで返す
      res.setHeader('Content-Type', contentType);
      response.body.pipe(res);
    }

  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`Render proxy server running on port ${PORT}`);
  console.log(`Target Workers: ${WORKERS_URL}`);
});
