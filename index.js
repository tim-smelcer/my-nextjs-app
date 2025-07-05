import express from 'express';
import axios from 'axios';
import { parse } from 'node-html-parser';

const app = express();
const port = process.env.PORT || 3000;

app.get('/captions', async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).json({ error: 'Missing URL parameter' });

  const videoIdMatch = videoUrl.match(/v=([a-zA-Z0-9_-]+)/);
  if (!videoIdMatch) return res.status(400).json({ error: 'Invalid YouTube URL' });

  const videoId = videoIdMatch[1];

  try {
    const videoPage = await axios.get(`https://www.youtube.com/watch?v=${videoId}`);
    const root = parse(videoPage.data);
    const scriptTag = root.querySelectorAll('script').find(script => script.text.includes('captionTracks'));

    const captionTracksMatch = scriptTag.text.match(/"captionTracks":(\[.*?\])/);
    if (!captionTracksMatch) return res.status(404).json({ error: 'No captions found for this video' });

    const captionTracks = JSON.parse(captionTracksMatch[1]);
    const englishTrack = captionTracks.find(track => track.languageCode === 'en');

    if (!englishTrack) return res.status(404).json({ error: 'English captions not available' });

    const captionRes = await axios.get(englishTrack.baseUrl);
    const captionRoot = parse(captionRes.data);

    const transcript = captionRoot.querySelectorAll('text').map(el => el.text).join('\n');
    return res.json({ transcript });

  } catch (err) {
    console.error('Transcript fetch error:', err);
    return res.status(500).json({ error: 'Error fetching transcript' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
