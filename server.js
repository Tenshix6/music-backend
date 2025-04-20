const express = require('express');
const { exec } = require('child_process');
const app = express();

// Route to handle YouTube audio download
app.get('/music', (req, res) => {
  const youtubeUrl = req.query.url; // YouTube URL from query parameters

  const ytDlpCommand = `yt-dlp -x --audio-format mp3 ${youtubeUrl}`;

  exec(ytDlpCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).send('Failed to download the audio');
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return res.status(500).send('Error processing request');
    }

    res.header("Content-Type", "audio/mpeg");
    res.send(stdout);
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
