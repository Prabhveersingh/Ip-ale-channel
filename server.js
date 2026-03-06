const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

// Chrome ki security bypass karne ke liye headers
app.use(cors());

app.use('/proxy', (req, res, next) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send("URL missing");

    // Target URL ka base nikalna
    const targetBase = new URL(targetUrl).origin;

    createProxyMiddleware({
        target: targetBase,
        changeOrigin: true,
        pathRewrite: { '^/proxy': new URL(targetUrl).pathname + new URL(targetUrl).search },
        onProxyRes: function (proxyRes) {
            // Ye sabse important part hai Chrome ke liye
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = '*';
            delete proxyRes.headers['content-security-policy'];
        },
        onError: (err) => res.status(500).send("Server Busy")
    })(req, res, next);
});

app.listen(process.env.PORT || 8080);
