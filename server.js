const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 10000;

const WORKERS_URL = 'https://klmanga-proxy.shunichi-0314.workers.dev';

app.get('*', async (req, res) => {
  try {
    const targetUrl = `${WORKERS_URL}${req.url}`;
    
    console.log(`Fetching: ${targetUrl}`);
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ja-JP,ja',
      },
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.status === 403) {
      return res.status(503).send(`
        <h1>503 Service Unavailable</h1>
        <p>Workers returned 403. This may be a CORS issue.</p>
        <p>Try accessing Workers directly: <a href="${WORKERS_URL}${req.url}">${WORKERS_URL}${req.url}</a></p>
      `);
    }
    
    const contentType = response.headers.get('Content-Type') || '';
    res.setHeader('Content-Type', contentType || 'text/html');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const html = await response.text();
    const renderOrigin = `${req.protocol}://${req.get('host')}`;
    const modifiedHtml = html.replace(/https:\/\/klmanga-proxy\.shunichi-0314\.workers\.dev/g, renderOrigin);
    
    res.send(modifiedHtml);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
