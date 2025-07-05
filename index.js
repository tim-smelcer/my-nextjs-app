const express = require('express');
const chromium = require('chrome-aws-lambda');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/captions/:videoId', async (req, res) => {
  const { videoId } = req.params;
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless
    });

    const page = await browser.newPage();
    await page.goto(videoUrl, { waitUntil: 'networkidle2' });

    const captions = await page.evaluate(() => {
      const scripts = [...document.querySelectorAll('script')];
      const playerScript = scripts.find(s => s.textContent.includes('captionTracks'));
      if (!playerScript) return null;

      const match = /"captionTracks":(\[.*?\])/.exec(playerScript.textContent);
      if (!match || !match[1]) return null;

      return JSON.parse(match[1]);
    });

    await browser.close();

    if (!captions) {
      return res.status(404).send('No captions found.');
    }

    res.json(captions);
  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).send(`Error fetching transcript: ${error.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
