const express = require('express');
const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

const app = express();
const port = process.env.PORT || 3000;

app.get('/captions/:videoId', async (req, res) => {
  const { videoId } = req.params;
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const captions = await page.evaluate(() => {
      const captionTracks = window.ytInitialPlayerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (!captionTracks || captionTracks.length === 0) return 'No captions found';
      return captionTracks.map(track => track.baseUrl);
    });

    res.json({ captions });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).send(`Error fetching transcript: ${error.message}`);
  } finally {
    if (browser !== null) await browser.close();
  }
});

app.get('/', (req, res) => {
  res.send('API is running. Use /captions/:videoId');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
