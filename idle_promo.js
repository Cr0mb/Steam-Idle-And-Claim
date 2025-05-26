const dotenv = require('dotenv');
const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const nodemailer = require('nodemailer');
const chalk = require('chalk');
const http = require('http');
const figlet = require('figlet');

dotenv.config();

figlet.text('Slice Strip', {
  font: 'Standard',
  horizontalLayout: 'default',
  verticalLayout: 'default'
}, function (err, data) {
  if (err) {
    console.log('Error generating title');
    console.dir(err);
    return;
  }
  console.log(chalk.blue(data));
  console.log(chalk.yellow('Made by GitHub.com/Cr0mb\n'));
});

// Validate required environment variables
['STEAM_USERNAME', 'STEAM_PASSWORD', 'STEAM_SHARED_SECRET', 'SENDER_EMAIL', 'SENDER_PASSWORD', 'RECEIVER_EMAIL'].forEach(key => {
  if (!process.env[key]) {
    console.error(chalk.red(`Missing required environment variable: ${key}`));
    process.exit(1);
  }
});

const username = process.env.STEAM_USERNAME;
const password = process.env.STEAM_PASSWORD;
const sharedSecret = process.env.STEAM_SHARED_SECRET;

const SENDER_EMAIL = process.env.SENDER_EMAIL;
const SENDER_PASSWORD = process.env.SENDER_PASSWORD;
const RECEIVER_EMAIL = process.env.RECEIVER_EMAIL;

const games = [578080, 304930, 230410, 729460, 42700, 1222730, 414700, 1546990, 1547000, 242760, 281990, 383180];
const status = 1; // Online

const SENTRY_FILE = path.join(__dirname, 'sentry.bin');
const SEEN_PROMOS_FILE = path.resolve(__dirname, 'seen_promotions.txt');

// Create seen_promotions.txt if it doesn't exist
if (!fs.existsSync(SEEN_PROMOS_FILE)) {
  fs.writeFileSync(SEEN_PROMOS_FILE, '', 'utf8');
}

let seenPromotions = new Set(
  fs.readFileSync(SEEN_PROMOS_FILE, 'utf8').split('\n').filter(Boolean)
);

// Setup email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SENDER_EMAIL,
    pass: SENDER_PASSWORD,
  },
});

async function sendEmail(subject, body) {
  try {
    await transporter.sendMail({
      from: SENDER_EMAIL,
      to: RECEIVER_EMAIL,
      subject,
      text: body,
    });
    console.log(chalk.green('📧 Email sent successfully.'));
  } catch (err) {
    console.error(chalk.red('Failed to send email:'), err);
  }
}

function getAppIdFromLogoUrl(logoUrl) {
  const parts = logoUrl.split('/apps/');
  return parts[1] ? parts[1].split('/')[0] : null;
}

async function fetchAppDetails(appId) {
  try {
    const res = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
    if (res.data[appId]?.success) {
      return res.data[appId].data;
    }
    return null;
  } catch (err) {
    console.error(chalk.red(`Error fetching details for appId ${appId}: ${err.message}`));
    return null;
  }
}

async function fetchPromotions(maxprice = 'free') {
  try {
    const res = await axios.get('https://store.steampowered.com/search/results/', {
      params: { specials: '1', ndl: '1', json: '1', maxprice },
    });

    const promos = [];
    for (const item of res.data.items || []) {
      const appId = getAppIdFromLogoUrl(item.logo || '');
      if (!appId || seenPromotions.has(item.name)) continue;

      const details = await fetchAppDetails(appId);
      if (!details) continue;

      const { discount_percent = 0, final = 0 } = details.price_overview || {};
      const discount = discount_percent;
      const price = final / 100;

      if (discount >= 80 || price === 0) {
        promos.push({
          title: item.name,
          discount,
          price,
          app_id: parseInt(appId, 10),
        });
      }
    }
    return promos;
  } catch (err) {
    console.error(chalk.red(`Error fetching promotions: ${err.message}`));
    return [];
  }
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

function claimFreeGames(appIds) {
  return new Promise((resolve) => {
    if (!appIds.length) return resolve([]);

    client.requestFreeLicense(appIds, (err, granted) => {
      if (err) {
        console.error(chalk.red('Error claiming games:'), err);
        return resolve([]);
      }

      if (granted.length) {
        console.log(chalk.green('🎁 Claimed games:'), granted.map(g => g.appid));
      } else {
        console.log(chalk.yellow('⚠ No new games claimed.'));
      }

      resolve(granted.map(g => g.appid));
    });
  });
}

function getRandomInterval() {
  const min = 1 * 60 * 60 * 1000;  // 1 hour
  const max = 6 * 60 * 60 * 1000;  // 6 hours
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function promoCheckerLoop() {
  while (true) {
    try {
      console.log(chalk.yellow('🔍 Checking for free games...'));
      const promos = await fetchPromotions('free');
      const newPromos = promos.filter(p => !seenPromotions.has(p.title));

      if (newPromos.length) {
        newPromos.forEach(printPromo);

        await new Promise(r => setTimeout(r, 2000)); // Delay before claiming
        const appIds = newPromos.map(p => p.app_id);
        const claimed = await claimFreeGames(appIds);

        if (claimed.length) {
          const claimedPromos = newPromos.filter(p => claimed.includes(p.app_id));
          const body = claimedPromos.map(p => 
            `${p.title} (${p.discount}%) - $${p.price}\nhttps://store.steampowered.com/app/${p.app_id}`
          ).join('\n\n');

          await sendEmail('🎉 New Free Steam Games Claimed!', body);

          for (const p of claimedPromos) {
            seenPromotions.add(p.title);
            fs.appendFileSync(SEEN_PROMOS_FILE, p.title + '\n', 'utf8');
          }

          console.log(chalk.green(`✅ Recorded ${claimedPromos.length} new claimed promotions.`));
        }
      } else {
        console.log(chalk.gray('No new promotions found.'));
      }

      const waitTime = getRandomInterval();
      console.log(chalk.blue(`⏳ Next check in ${(waitTime / (60 * 60 * 1000)).toFixed(2)} hours.`));
      await new Promise(r => setTimeout(r, waitTime));
    } catch (err) {
      console.error(chalk.red('❌ Error in promo checker loop:'), err);
      console.log(chalk.yellow('🔁 Retrying in 10 minutes...'));
      await new Promise(r => setTimeout(r, 10 * 60 * 1000));
    }
  }
}

const client = new SteamUser();
const logOnOptions = {
  accountName: username,
  password: password,
  twoFactorCode: SteamTotp.generateAuthCode(sharedSecret),
};

if (fs.existsSync(SENTRY_FILE)) {
  logOnOptions.shaSentryfile = fs.readFileSync(SENTRY_FILE);
}

client.on('sentry', (sentry) => {
  fs.writeFileSync(SENTRY_FILE, sentry);
  console.log(chalk.green('✅ Sentry file saved.'));
});

client.on('error', (err) => {
  console.error(chalk.red('Steam error:'), err.message);
  if (err.message.includes('Incorrect login') || err.message.includes('Logon session')) {
    if (fs.existsSync(SENTRY_FILE)) {
      fs.unlinkSync(SENTRY_FILE);
      console.log(chalk.yellow('🗑️ Removed stale sentry file.'));
    }
  }
  process.exit(1);
});

client.on('loggedOn', () => {
  console.log(chalk.green(`✔ Logged in as ${client.steamID.getSteam3RenderedID()}`));
  client.setPersona(status);
  client.gamesPlayed(games);

  setInterval(() => {
    console.log(chalk.gray("🛑 Hourly cycle: stopping games..."));
    client.gamesPlayed([]);
    setTimeout(() => {
      console.log(chalk.gray("▶️ Hourly cycle: starting games again..."));
      client.gamesPlayed(games);
    }, 10000);
  }, 3600000);

  promoCheckerLoop();
});

client.logOn(logOnOptions);

// Optional keep-alive HTTP server
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
    res.writeHead(404);
    res.end('Not found.');
  }
}).listen(3000, () => {
  console.log(chalk.cyan('🌐 HTTP control server listening on port 3000'));
});
