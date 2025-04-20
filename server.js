const express = require("express");
const axios = require("axios");
const ytDlp = require("yt-dlp");
const ffmpeg = require("fluent-ffmpeg");

const app = express();
const port = process.env.PORT || 3000;

const YOUTUBE_API_KEY = 'YOUR_YOUTUBE_API_KEY'; // Replace with your YouTube API key

// YouTube API search endpoint
app.get("/api/search", async (req, res) => {
  const query = req.query.query;
  if (!query) return res.status(400).send("Missing query parameter");

  try {
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${YOUTUBE_API_KEY}&type=video&maxResults=5`;

    // Fetch search results from YouTube API
    const response = await axios.get(youtubeUrl);
    const results = response.data.items.map(item => ({
      title: item.snippet.title,
      videoId: item.id.videoId,
      thumbnail: item.snippet.thumbnails.default.url
    }));

    res.json(results);
  } catch (err) {
    res.status(500).send("Error fetching data from YouTube API");
  }
});

// Stream route to stream audio using yt-dlp
app.get("/stream/:id", (req, res) => {
  const videoId = req.params.id;

  ytDlp.exec([`https://www.youtube.com/watch?v=${videoId}`, "-f", "bestaudio"])
    .then((output) => {
      const audioStream = output.stdout; // Get audio stream from yt-dlp
      res.setHeader("Content-Type", "audio/mpeg");
      audioStream.pipe(res); // Pipe audio to the client
    })
    .catch((err) => res.status(500).send("Error streaming audio"));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

