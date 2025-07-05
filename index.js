import express from 'express';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import chromium from 'chrome-aws-lambda';

puppeteer.use(StealthPlugin());

const app = express();
const port = process.env.PORT || 3000;

app.get('/captions', async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).json({ error: 'Missing URL parameter' });

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(videoUrl, { waitUntil: 'networkidle2' });

    // Click the "..." button under the video
    await page.waitForSelector('button[aria-label="More actions"]', { timeout: 10000 });
    await page.click('button[aria-label="More actions"]');

    // Click "Show transcript"
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const items = [...document.querySelectorAll('ytd-menu-service-item-renderer')];
      const transcriptItem = items.find(el => el.textContent.toLowerCase().includes('transcript'));
      if (transcriptItem) transcriptItem.click();
    });

    // Wait for transcript panel
    await page.waitForSelector('ytd-transcript-renderer', { timeout: 10000 });

    // Extract transcript
    const transcript = await page.evaluate(() => {
      const segments = document.querySelectorAll('ytd-transcript-segment-renderer');
      return Array.from(segments).map(el => el.innerText).join('\n');
    });

    await browser.close();
    return res.json({ transcript });
  } catch (err) {
    if (browser) await browser.close();
    console.error('Transcript error:', err);
    return res.status(500).json({ error: 'Error fetching transcript' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
