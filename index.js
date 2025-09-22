// server.js
// where your node app starts

// init project
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const dns = require('dns');
const url = require('url');

// enable CORS[](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
const cors = require('cors');
app.use(cors({ optionsSuccessStatus: 200 }));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// Parse POST bodies
app.use(bodyParser.urlencoded({ extended: false }));

// Simple in-memory storage for URLs
const urlDatabase = [];
urlDatabase.push(null); // Make index start from 1

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

// API endpoint for shortening URL
app.post("/api/shorturl", function (req, res) {
  const originalUrl = req.body.url;

  // Check if URL is provided
  if (!originalUrl) {
    return res.json({ error: 'invalid url' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(originalUrl);
  } catch (e) {
    return res.json({ error: 'invalid url' });
  }

  // Check for http or https protocol
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return res.json({ error: 'invalid url' });
  }

  // Validate domain with dns.lookup
  dns.lookup(parsedUrl.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Check if URL already exists
    let shortUrl = urlDatabase.indexOf(originalUrl);
    if (shortUrl === -1) {
      shortUrl = urlDatabase.push(originalUrl) - 1;
    }

    res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});

// Redirect endpoint
app.get("/api/shorturl/:short_url", function (req, res) {
  const shortUrl = parseInt(req.params.short_url);

  if (isNaN(shortUrl) || shortUrl < 1 || shortUrl >= urlDatabase.length || !urlDatabase[shortUrl]) {
    return res.json({ error: 'invalid url' });
  }

  res.redirect(urlDatabase[shortUrl]);
});

// listen for requests :)
const listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});