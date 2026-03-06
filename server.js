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
        // Asli server se data mangwana
        const response = await axios({
            method: 'GET',
            url: targetUrl,
            responseType: targetUrl.includes('.m3u8') ? 'text' : 'stream', // M3U8 ko text ki tarah, TS ko stream ki tarah
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });

        // Agar file .m3u8 (Playlist) hai, toh uske andar ke links fix karo
        if (targetUrl.includes('.m3u8') || (typeof response.data === 'string' && response.data.includes('#EXTM3U'))) {
            let m3u8Content = response.data;
            const lines = m3u8Content.split('\n');
            const basePath = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
            
            // Render ka apna URL nikalna
            const proxyBase = `${req.protocol}://${req.get('host')}/proxy?url=`;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                // Agar line link hai (comment nahi hai aur khali nahi hai)
                if (line && !line.startsWith('#')) {
                    let absoluteUrl = line;
                    // Agar link proper http se shuru nahi hota, toh uske aage asli IP laga do
                    if (!line.startsWith('http')) {
                        absoluteUrl = `${basePath}${line}`;
                    }
                    // Ab us absolute URL ko apni proxy ke through route kar do
                    lines[i] = `${proxyBase}${encodeURIComponent(absoluteUrl)}`;
                }
            }

            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.send(lines.join('\n'));
        }

        // Agar file .ts (Video Chunk) hai, toh direct player ko pipe kar do
        res.setHeader('Content-Type', response.headers['content-type'] || 'video/MP2T');
        res.setHeader('Access-Control-Allow-Origin', '*');
        response.data.pipe(res);

    } catch (error) {
        console.error("Proxy Error:", error.message);
        res.status(500).send("Error fetching target video.");
    }
});

app.get('/', (req, res) => {
    res.send("Smart Proxy is Running!");
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
