const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 10000;

const TARGET_URL = 'https://klmanga.mba';

// ブラウザのように見せかけるためのヘッダー
const browserHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Cache-Control': 'max-age=0'
};

app.use('/', createProxyMiddleware({
  target: TARGET_URL,
  changeOrigin: true,
  onProxyReq: function(proxyReq, req, res) {
    // ブラウザのヘッダーを設定
    Object.keys(browserHeaders).forEach(key => {
      proxyReq.setHeader(key, browserHeaders[key]);
    });
    
    // Hostヘッダーをターゲットのホストに設定
    proxyReq.setHeader('Host', new URL(TARGET_URL).host);
    
    // Refererを設定（オプション）
    if (!proxyReq.getHeader('referer')) {
      proxyReq.setHeader('referer', TARGET_URL);
    }
  },
  onProxyRes: function (proxyRes, req, res) {
    // CSPヘッダーを削除して表示を許可
    delete proxyRes.headers['content-security-policy'];
    delete proxyRes.headers['content-security-policy-report-only'];
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['x-xss-protection'];
    
    // Set-Cookieヘッダーのドメインを修正
    if (proxyRes.headers['set-cookie']) {
      proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map(cookie => {
        return cookie.replace(/Domain=[^;]+/i, '')
                    .replace(/Secure(?=;|$)/i, '')
                    .replace(/SameSite=[^;]+/i, '');
      });
    }
    
    // Locationヘッダー（リダイレクト）を修正
    if (proxyRes.headers['location']) {
      const location = proxyRes.headers['location'];
      if (location.startsWith('https://klmanga.mba')) {
        proxyRes.headers['location'] = location.replace('https://klmanga.mba', '');
      }
    }
  },
  cookieDomainRewrite: {
    '*': ''
  },
  followRedirects: true
}));

app.listen(PORT, () => {
  console.log(`Proxy server is running on port ${PORT}`);
  console.log(`Target: ${TARGET_URL}`);
});
