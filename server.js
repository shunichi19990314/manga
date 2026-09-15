const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

const TARGET_URL = 'https://klmanga.mba';

// ブラウザのインスタンスをキャッシュ
let browser = null;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080'
      ]
    });
  }
  return browser;
}

app.use(express.static('public'));

app.get('*', async (req, res) => {
  try {
    const targetUrl = TARGET_URL + req.url;
    const browser = await getBrowser();
    const page = await browser.newPage();
    
    // ブラウザのふりをする
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // リクエストヘッダーを設定
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });
    
    // ページにアクセス
    await page.goto(targetUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // ページのHTMLを取得
    const html = await page.content();
    
    // HTML内のリンクを相対パスから絶対パスに変換
    const modifiedHtml = html.replace(
      new RegExp(`href=["']${TARGET_URL}`, 'g'),
      `href="${req.protocol}://${req.get('host')}`
    ).replace(
      new RegExp(`src=["']${TARGET_URL}`, 'g'),
      `src="${req.protocol}://${req.get('host')}`
    );
    
    await page.close();
    res.send(modifiedHtml);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});

// グレースフルシャットダウン
process.on('SIGINT', async () => {
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});
