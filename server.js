const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 10000;

// あなたの Cloudflare Worker の URL
const CF_WORKER_URL = "https://klmanga-proxy.shunichi-0314.workers.dev";

app.all('*', async (req, res) => {
    try {
        const targetUrl = CF_WORKER_URL + req.url;

        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                // 自分のドメイン情報を Workers に伝える（これで書き換えが Render 向けになる）
                'X-Forwarded-Host': req.get('host'),
                'X-Forwarded-Proto': 'https',
                'User-Agent': req.headers['user-agent'],
                'Accept': req.headers['accept'],
                'Cookie': req.headers['cookie'] || ''
            },
            timeout: 30000
        });

        // ヘッダーの引き継ぎ
        const contentType = response.headers.get("content-type");
        if (contentType) res.set("Content-Type", contentType);
        res.set("Access-Control-Allow-Origin", "*");

        const buffer = await response.buffer();
        res.status(response.status).send(buffer);

    } catch (error) {
        console.error(error);
        res.status(500).send("読み込みに失敗しました。Workers 側を確認してください。");
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Proxying to: ${CF_WORKER_URL}`);
});
