const express = require('express');
const cheerio = require('cheerio');
const bodyParser = require('body-parser')
const path = require('path');
const fs = require('fs');


const app = express();
const indexHtml = path.join(__dirname, 'build', 'index.html');
const indexHtmlContent = fs.readFileSync(indexHtml, 'utf8');
const $ = cheerio.load(indexHtmlContent);

function capitalizeFirstLetter(str) {
  if (!str) return;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function renderCharacter(region, realm, name) {
  const title = `${capitalizeFirstLetter(name)}-${capitalizeFirstLetter(realm)} on ${region.toUpperCase()}`;
  const clone = cheerio.load($.html());
  clone('title').replaceWith('<title>' + title + '</title>');
  return clone.html();
}

function renderActivity(region, activity, bracket) {
  let title;
  if (bracket === "shuffle-multiclass") {
    title = "Shuffle Multiclassers Leaderboard on " + region.toUpperCase();
  } else {
    title = `${capitalizeFirstLetter(bracket)} ${capitalizeFirstLetter(activity)} on ${region.toUpperCase()}`;
  }
  const clone = cheerio.load($.html());
  clone('title').replaceWith('<title>' + title + '</title>');
  return clone.html();
}

function renderThree(one, two, three) {
  const regionLc = one.toLowerCase();
  const activity = two.toLowerCase();
  const bracket = three.toLowerCase();
  if (
    (regionLc === 'eu' || regionLc === 'us') &&
    (activity === 'activity' || activity === 'ladder') &&
    (bracket === '2v2' || bracket === '3v3' || bracket === 'rbg' || bracket === 'shuffle' || bracket === 'shuffle-multiclass')
  ) {
    return renderActivity(regionLc, activity, bracket);
  } else {
    return renderCharacter(one, two, three);
  }
}

app.use(express.static(path.join(__dirname, 'build')));

app.get('/ping', function (req, res) {
  return res.send('pong');
});

app.get('/:pone/:ptwo', function (req, res) {
  const path = req.path;
  const pone = req.params.pone;
  const ptwo = req.params.ptwo;
  console.log('TWO: ', pone, ptwo);
  res.send($.html());
});

app.get('/:pone/:ptwo/:pthree', function (req, res) {
  const path = req.path;
  const pone = req.params.pone;
  const ptwo = req.params.ptwo;
  const pthree = req.params.pthree;
  console.log('THREE: ', pone, ptwo, pthree);
  res.send(renderThree(pone, ptwo, pthree));
});

app.get('/*', function (req, res) {
  console.log('NO MATCH: ', req.path);
  res.send($.html());
});

let port = process.env.PORT || 8080;
console.log('Starting server on port ' + port)
app.listen(port)