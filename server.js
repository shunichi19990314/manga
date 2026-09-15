const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
// Renderは環境変数 PORT を自動的に割り当てます
const PORT = process.env.PORT || 10000;

const TARGET_URL = 'https://klmanga.mba';

// プロキシミドルウェアの設定
app.use('/', createProxyMiddleware({
  target: TARGET_URL,
  changeOrigin: true,
  // 必要に応じてプロキシレスポンスのヘッダーを調整します
  onProxyRes: function (proxyRes, req, res) {
    // プロキシ先が設定しているCSP(Content-Security-Policy)を緩和する必要がある場合にコメントアウトを外します
    // delete proxyRes.headers['content-security-policy'];
    // delete proxyRes.headers['x-frame-options'];
  }
}));

app.listen(PORT, () => {
  console.log(`Proxy server is running on port ${PORT}`);
});
