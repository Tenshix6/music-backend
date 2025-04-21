const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();

app.get('/stream', (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('Missing URL');

  // Get cookies from environment variable
  const cookies = process.env.YT_COOKIES;

  // If no cookies, return error
  if (!cookies) return res.status(500).send('YT_COOKIES env var not set');

  // Write cookies to a temporary file
  const tempCookiePath = path.join(__dirname, 'temp_cookies.txt');
  fs.writeFileSync(tempCookiePath, cookies);

  // Spawn yt-dlp with cookies
  const ytdlp = spawn('yt-dlp', [
    '--cookies', tempCookiePath,
    '-f', 'bestaudio',
    '-o', '-',
    url
  ]);

  // Set response type
  res.setHeader('Content-Type', 'audio/mpeg');

  // Pipe output
  ytdlp.stdout.pipe(res);

  // Error handling
  ytdlp.stderr.on('data', (data) => {
    console.error(`yt-dlp error: ${data}`);
  });

  // On stream end
  ytdlp.on('close', (code) => {
    console.log(`yt-dlp exited with code ${code}`);
    fs.unlinkSync(tempCookiePath); // Delete temp cookie file
    res.end();
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
