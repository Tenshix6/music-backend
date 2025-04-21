const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();

// 🧠 In-memory cache for recent stream URLs
const streamCache = new Map();

// Function to get video ID from YouTube URL
function extractVideoId(url) {
  try {
    return new URL(url).searchParams.get('v');
  } catch (e) {
    return null;
  }
}

// ⏱️ Set cache expiration time (e.g. 10 minutes)
const CACHE_TTL_MS = 10 * 60 * 1000;

app.get('/stream', (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('Missing URL');

  const videoId = extractVideoId(url);
  if (!videoId) return res.status(400).send('Invalid YouTube URL');

  // ✅ Check cache first
  const cached = streamCache.get(videoId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`✅ Using cached stream for ${videoId}`);
    res.setHeader('Content-Type', 'audio/mpeg');
    const ytdlp = spawn('curl', [cached.url]);
    ytdlp.stdout.pipe(res);
    ytdlp.stderr.on('data', (data) => console.error(`curl error: ${data}`));
    ytdlp.on('close', () => res.end());
    return;
  }

  // Get cookies from environment variable
  const cookies = process.env.YT_COOKIES;
  if (!cookies) return res.status(500).send('YT_COOKIES env var not set');

  const tempCookiePath = path.join(__dirname, 'temp_cookies.txt');
  fs.writeFileSync(tempCookiePath, cookies);

  // 🔁 Use yt-dlp to get the stream URL instead of direct pipe
  const urlFetcher = spawn('yt-dlp', [
    '--cookies', tempCookiePath,
    '-f', 'bestaudio',
    '--get-url',
    url
  ]);

  let streamUrl = '';
  urlFetcher.stdout.on('data', (data) => {
    streamUrl += data.toString().trim();
  });

  urlFetcher.stderr.on('data', (data) => {
    console.error(`yt-dlp error: ${data}`);
  });

  urlFetcher.on('close', (code) => {
    fs.unlinkSync(tempCookiePath);

    if (!streamUrl) {
      return res.status(500).send('Failed to get stream URL');
    }

    // 🗂️ Cache the stream URL
    streamCache.set(videoId, {
      url: streamUrl,
      timestamp: Date.now()
    });

    console.log(`🔁 Streaming ${videoId} from fresh yt-dlp URL`);
    res.setHeader('Content-Type', 'audio/mpeg');
    const audioStream = spawn('curl', [streamUrl]);
    audioStream.stdout.pipe(res);
    audioStream.stderr.on('data', (data) => console.error(`curl error: ${data}`));
    audioStream.on('close', () => res.end());
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
