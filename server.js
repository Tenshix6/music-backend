const express = require('express');
const ytdl = require('ytdl-core');
const app = express();


app.get('/music', (req, res) => {
  const youtubeUrl = req.query.url;

  res.header("Content-Type", "audio/mpeg");

 
  ytdl(youtubeUrl, { filter: 'audioonly' }).pipe(res);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
