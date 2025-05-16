const dotenv = require('dotenv');
const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const nodemailer = require('nodemailer');
const figlet = require('figlet');
const chalk = require('chalk');
const http = require('http');

dotenv.config();

// Steam login config
const username = process.env.STEAM_USERNAME;
const password = process.env.STEAM_PASSWORD;
const sharedSecret = process.env.STEAM_SHARED_SECRET;
const twoFactorCode = SteamTotp.generateAuthCode(sharedSecret);

const games = [730, 230410, 440, 105600, 70, 109600, 489830, 320, 1172380, 22320, 42700, 304930, 3205720, 729460, 550, 383150, 300, 620, 203140];
const status = 1; // online


// Email config
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const SENDER_PASSWORD = process.env.SENDER_PASSWORD;
const RECEIVER_EMAIL = process.env.RECEIVER_EMAIL;
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: SENDER_EMAIL, pass: SENDER_PASSWORD },
});

const SENTRY_FILE = path.join(__dirname, 'sentry.bin');

const SEEN_PROMOS_FILE = path.resolve(__dirname, 'seen_promotions.txt');
const seenPromotions = new Set(fs.existsSync(SEEN_PROMOS_FILE) ? fs.readFileSync(SEEN_PROMOS_FILE, 'utf8').split('\n').filter(Boolean) : []);

const client = new SteamUser();

function sendEmail(subject, body) {
  return transporter.sendMail({ from: SENDER_EMAIL, to: RECEIVER_EMAIL, subject, text: body });
}

function saveSeenPromotions(promos) {
  fs.appendFileSync(SEEN_PROMOS_FILE, promos.map(p => p + '\n').join(''), 'utf8');
}

function getAppIdFromLogoUrl(logoUrl) {
  const parts = logoUrl.split('/apps/');
  return parts[1] ? parts[1].split('/')[0] : null;
}

async function fetchAppDetails(appId) {
  try {
    const res = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
    return res.data[appId].success ? res.data[appId].data : null;
  } catch {
    return null;
  }
}

async function fetchPromotions(maxprice) {
  try {
    const res = await axios.get('https://store.steampowered.com/search/results/', {
      params: { specials: '1', ndl: '1', json: '1', maxprice }
    });
    const promos = [];
    for (const item of res.data.items || []) {
      const appId = getAppIdFromLogoUrl(item.logo || '');
      if (!appId || seenPromotions.has(item.name)) continue;
      const details = await fetchAppDetails(appId);
      if (!details) continue;
      const { discount_percent, final } = details.price_overview || {};
      const discount = discount_percent || 0;
      const price = (final || 0) / 100;
      if (discount >= 80 || price === 0.0) {
        promos.push({
          title: item.name,
          discount,
          price,
          app_id: parseInt(appId),
        });
      }
    }
    return promos;
  } catch (err) {
    console.log(chalk.red(`✖ Error fetching promos: ${err.message}`));
    return [];
  }
}

function claimFreeGames(appIds) {
  return new Promise(resolve => {
    client.requestFreeLicense(appIds, (err, granted) => {
      if (err) console.error(chalk.red('✖ Error claiming games:'), err);
      else console.log(chalk.green('✔ Game(s) claimed:'), granted);
      resolve(granted);
    });
  });
}

function printPromo(p) {
  console.log(chalk.cyan('='.repeat(50)));
  console.log(`${chalk.yellow('Title:')} ${p.title}`);
  console.log(`${chalk.yellow('App ID:')} ${chalk.blue(p.app_id)}`);
  console.log(`${chalk.yellow('Discount:')} ${chalk.green(p.discount + '%')}`);
  const priceColor = p.price === 0 ? chalk.green : chalk.white;
  console.log(`${chalk.yellow('Price:')} ${priceColor(`$${p.price.toFixed(2)}`)}`);
  console.log(`${chalk.yellow('Link:')} https://store.steampowered.com/app/${p.app_id}`);
  console.log(chalk.cyan('='.repeat(50)) + '\n');
}

// function to get a random interval between 1 and 6 hours (ms)
function getRandomInterval() {
  const min = 1 * 60 * 60 * 1000;  // 1 hour in ms
  const max = 6 * 60 * 60 * 1000;  // 6 hours in ms
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function promoCheckerLoop() {
  console.log(chalk.magenta(figlet.textSync('Slice Strip')));
  console.log(chalk.green.bold('Made by GitHub.com/Cr0mb\n'));

  while (true) {
    console.log(chalk.yellow('🔍 Checking for free games...'));
    const promos = await fetchPromotions('free');
    const newPromos = promos.filter(p => !seenPromotions.has(p.title));
    if (newPromos.length) {
      newPromos.forEach(printPromo);
      const appIds = newPromos.map(p => p.app_id);
      await claimFreeGames(appIds);
      const body = newPromos.map(p => `${p.title} (${p.discount}%) - $${p.price}\nhttps://store.steampowered.com/app/${p.app_id}`).join('\n\n');
      await sendEmail('🎉 New Free Steam Games Claimed!', body);
      newPromos.forEach(p => seenPromotions.add(p.title));
      saveSeenPromotions(newPromos.map(p => p.title));
    } else {
      console.log(chalk.gray('No new free games found.'));
    }
    const waitTime = getRandomInterval();
    console.log(chalk.blue(`⏱ Next check in ${(waitTime / (60 * 60 * 1000)).toFixed(2)} hours.`));
    await new Promise(r => setTimeout(r, waitTime));
  }
}

client.on('sentry', function (sentry) {
  fs.writeFileSync(SENTRY_FILE, sentry);
});

const logOnOptions = {
  accountName: username,
  password: password,
  twoFactorCode: twoFactorCode
};

if (fs.existsSync(SENTRY_FILE)) {
  logOnOptions.shaSentryfile = fs.readFileSync(SENTRY_FILE);
}

client.logOn(logOnOptions);

client.on('loggedOn', () => {
  console.log(chalk.green(`✔ Logged in as ${client.steamID}`));
  client.setPersona(status);
  client.gamesPlayed(games);

  // Hourly refresh cycle
  setInterval(() => {
    console.log(chalk.gray("🔄 Hourly cycle: stopping games..."));
    client.gamesPlayed([]);
    setTimeout(() => {
      console.log(chalk.gray("▶️ Hourly cycle: starting games again..."));
      client.gamesPlayed(games);
    }, 10000);
  }, 3600000);

  promoCheckerLoop();
});

http.createServer((req, res) => {
  if (req.url === '/stop') {
    client.gamesPlayed([]);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('⏹️ Stopped playing games.');
  } else if (req.url === '/start') {
    client.gamesPlayed(games);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('▶️ Started playing games.');
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('✔ I\'m alive.');
  }
}).listen(8080, () => console.log(chalk.blue('🌐 Keep-alive server running on port 8080')));
