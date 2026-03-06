const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());

app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send("Bhai, proxy ke liye URL dena zaroori hai.");
    }

    try {
        const response = await axios({
            method: 'GET',
            url: targetUrl,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Referer': targetUrl
            }
        });

        // Headers pass karna taaki player ko lage ki real video file hai
        res.setHeader('Content-Type', response.headers['content-type'] || 'application/vnd.apple.mpegurl');
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Video stream ko direct Vercel player ko bhejna
        response.data.pipe(res);

    } catch (error) {
        console.error("Proxy Error:", error.message);
        res.status(500).send("Bhai, us HTTP server ne video dene se mana kar diya ya timeout ho gaya.");
    }
});

// Root path check karne ke liye ki server zinda hai ya nahi
app.get('/', (req, res) => {
    res.send("Proxy Server is Running! Use /proxy?url=YOUR_HTTP_LINK");
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
