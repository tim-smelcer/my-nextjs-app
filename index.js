const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/captions/:videoId', async (req, res) => {
  const videoId = req.params.videoId;
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    await page.waitForSelector('ytd-transcript-renderer');
    const transcriptText = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('ytd-transcript-segment-renderer'));
      return nodes.map(n => n.innerText).join('\n');
    });

    await browser.close();
    res.send(transcriptText);
  } catch (error) {
    res.status(500).send('Error fetching transcript: ' + error.toString());
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});