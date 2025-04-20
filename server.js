const express = require('express');
const { spawn } = require('child_process');
const app = express();

app.get('/stream', (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('Missing URL');

  const ytdlp = spawn('yt-dlp', ['-f', 'bestaudio', '-o', '-', url]);

  res.setHeader('Content-Type', 'audio/mpeg');

  ytdlp.stdout.pipe(res);

  ytdlp.stderr.on('data', (data) => {
    console.error(`yt-dlp error: ${data}`);
  });

  ytdlp.on('close', (code) => {
    console.log(`yt-dlp exited with code ${code}`);
    res.end();
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
