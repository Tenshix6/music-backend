const express = require('express');
const ytdl = require('ytdl-core');
const app = express();

// Route to stream YouTube audio
app.get('/music', (req, res) => {
  const youtubeUrl = req.query.url; // YouTube URL from query parameters

  res.header("Content-Type", "audio/mpeg");

  // Stream the audio directly to the response
  ytdl(youtubeUrl, { filter: 'audioonly' }).pipe(res);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
