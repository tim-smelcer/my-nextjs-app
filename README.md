# Puppeteer Caption API

A simple Node.js + Express API that uses Puppeteer to fetch the YouTube transcript (captions) for a given video.

## Usage

Deploy on Railway or another service that supports Puppeteer. Make sure to set the `PORT` environment variable to `3000`.

Endpoint:
GET /captions/:videoId

Example:
GET /captions/2Qczy8WL5aU