const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/stream', (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).send('Missing URL');

  // Spawn yt-dlp process to fetch audio stream
  const ytdlp = spawn('yt-dlp', [
    '-f', 'bestaudio',     // Choose best audio format
    '--no-mtime',          // Don't check file timestamps
    '-o', '-',             // Stream to stdout
    videoUrl
  ]);

  // Handle yt-dlp errors
  ytdlp.stderr.on('data', data => {
    console.error('yt-dlp error:', data.toString());
  });

  ytdlp.on('error', err => {
    console.error('Failed to start yt-dlp:', err);
    res.sendStatus(500);
  });

  // Set appropriate response headers
  res.set({
    'Content-Type': 'audio/mpeg', // Or 'audio/opus' depending on the format you want
    'Transfer-Encoding': 'chunked',
  });

  // Pipe yt-dlp output -> ffmpeg -> response
  ffmpeg(ytdlp.stdout)
    .audioCodec('libmp3lame')   // Convert to mp3
    .format('mp3')              // Output mp3 format
    .on('error', err => {
      console.error('FFmpeg error:', err.message);
      res.sendStatus(500);
    })
    .pipe(res, { end: true });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
