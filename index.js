const express = require("express");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/captions/:videoId", async (req, res) => {
  const { videoId } = req.params;

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(`https://www.youtube.com/watch?v=${videoId}`);

    // Wait for transcript button (if available)
    await page.waitForSelector("button[aria-label='More actions']", { timeout: 10000 });
    await page.click("button[aria-label='More actions']");

    await page.waitForSelector("ytd-menu-service-item-renderer");
    const items = await page.$$("ytd-menu-service-item-renderer");
    for (let item of items) {
      const text = await item.evaluate(el => el.textContent);
      if (text.toLowerCase().includes("show transcript")) {
        await item.click();
        break;
      }
    }

    await page.waitForSelector("ytd-transcript-segment-renderer", { timeout: 10000 });

    const captions = await page.evaluate(() => {
      const segments = Array.from(document.querySelectorAll("ytd-transcript-segment-renderer"));
      return segments.map(segment => segment.innerText.trim());
    });

    await browser.close();
    res.json({ videoId, captions });

  } catch (error) {
    console.error("Error fetching transcript:", error);
    res.status(500).send(`Error fetching transcript: ${error.message}`);
  }
});

app.get("/", (req, res) => {
  res.send("Puppeteer Caption API is running.");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
