const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/captions', async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) {
    return res.status(400).json({ error: 'Missing YouTube URL' });
  }

  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(videoUrl, { waitUntil: 'networkidle2' });

    // Sample logic to simulate fetching captions — replace with real logic later
    const captions = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('yt-formatted-string')).map(el => el.innerText).slice(0, 5);
    });

    res.json({ success: true, captions });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).json({ error: 'Error fetching transcript' });
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
