![image](https://github.com/user-attachments/assets/259cab77-b52c-4797-9e06-7609138b3f19)




---

# Slice Strip

**Slice Strip** is an automated Steam bot that helps you:

* Idle multiple Steam games at once to gain playtime and trading cards.
* Automatically find and claim free or heavily discounted games on Steam.
* Get email notifications when a free game is successfully claimed.
* Handle Steam Guard two-factor authentication (2FA) using shared secrets.
* Periodically check for promotions every 1 to 6 hours at random intervals.
* Control the bot remotely via a simple web server.

---

## Features

* Idle many games simultaneously.
* Detect free or 80%+ discounted Steam games.
* Claim free Steam licenses automatically.
* Save which promotions have already been claimed.
* Send email notifications when a new free game is claimed.
* Support Steam Guard 2FA with shared secrets and sentry files.
* Randomized promotion check intervals to appear natural.
* HTTP API to start and stop game idling remotely.

---

## What You Need Before You Start

* A computer running **Ubuntu Linux** (or another Linux distro).
* Basic knowledge of using the terminal/command line.
* Internet connection.
* A **Steam account** with:

  * Your Steam username.
  * Your Steam password.
  * (Optional but recommended) Your Steam shared secret for 2FA.
* A **Gmail account** or other email that supports SMTP to send notifications.
* Basic access to your home router for port forwarding if you want remote access.

---

## Step-by-Step Installation Guide

### Step 1: Open the Terminal

On Ubuntu, press `Ctrl + Alt + T` to open a terminal window. This is where you will type commands.

### Step 2: Download the Bot Code

Type the following command and press **Enter**:

```bash
git clone https://github.com/Cr0mb/Steam-Idle-And-Claim.git
```

This downloads the bot’s code into a folder named `Steam-Idle-And-Claim`.

### Step 3: Go to the Bot Folder

Change directory into the bot folder by typing:

```bash
cd Steam-Idle-And-Claim
```

and press **Enter**.

### Step 4: Install Node.js

If you don’t have Node.js installed (needed to run the bot), install it by running:

```bash
sudo apt update
sudo apt install nodejs npm -y
```

Wait for the installation to finish.

### Step 5: Install Bot Dependencies

Inside the `Steam-Idle-And-Claim` folder, run:

```bash
npm install
```

This installs all required software packages for the bot.

### Step 6: Create the `.env` File (Important!)

The bot needs a file named `.env` that stores your private information like your Steam username and email credentials.

To create this file, run:

```bash
nano .env
```

This opens a simple text editor inside the terminal.

Now, copy and paste the following text exactly, replacing each `your_...` part with your real information:

```
STEAM_USERNAME=your_steam_username
STEAM_PASSWORD=your_steam_password
STEAM_SHARED_SECRET=your_steam_shared_secret
SENDER_EMAIL=your_email@gmail.com
SENDER_PASSWORD=your_email_password
RECEIVER_EMAIL=recipient_email@gmail.com
```

* `STEAM_USERNAME`: Your Steam login name.
* `STEAM_PASSWORD`: Your Steam password.
* `STEAM_SHARED_SECRET`: Your Steam 2FA shared secret (optional but recommended).
* `SENDER_EMAIL`: The email address you want to send notifications from (Gmail recommended).
* `SENDER_PASSWORD`: The password or app-specific password for that email.
* `RECEIVER_EMAIL`: The email address where you want to receive notifications.

Once done, press `Ctrl + O` then `Enter` to save the file, then `Ctrl + X` to exit nano.

---

## How to Run the Bot

To start the bot, type this command inside the `Steam-Idle-And-Claim` folder:

```bash
node index.js
```

You will see messages showing the bot logging in to Steam, starting to idle games, and checking for free game promotions.

---

## How to Control the Bot Remotely

The bot runs a small web server on your computer that listens on port 8080.

You can control it by opening these addresses in your web browser:

* `http://localhost:8080/` — Check if the bot is running (health check).
* `http://localhost:8080/start` — Start idling games.
* `http://localhost:8080/stop` — Stop idling games.

---

## How to Make the Bot Accessible From the Internet (Port Forwarding)

If you want to control the bot remotely (not just on your own computer), you need to allow external access to your bot’s web server.

### Step 1: Allow Port 8080 on Ubuntu Firewall

Run these commands to open port 8080:

```bash
sudo ufw allow 8080/tcp
sudo ufw reload
sudo ufw status
```

Make sure the status shows port 8080 allowed.

### Step 2: Make Sure the Bot Listens on All Network Interfaces

In the bot’s code (`index.js`), ensure the server listens on `0.0.0.0` instead of just `localhost`. This usually looks like:

```js
server.listen(8080, '0.0.0.0', () => {
  console.log('Server listening on port 8080');
});
```

If unsure, you can ask for help.

### Step 3: Find Your Local IP Address

Run:

```bash
ip addr show
```

Look for an IP address like `192.168.x.x` under your network interface (often named `eth0` or `wlan0`).

### Step 4: Set Up Port Forwarding on Your Router

* Log in to your router’s web interface by entering its IP (commonly `192.168.0.1` or `192.168.1.1`) into your browser.
* Find the section called **Port Forwarding** or **Virtual Server**.
* Add a new rule forwarding external port `8080` to your computer’s internal IP and port `8080`.
* Save and apply.

### Step 5: Find Your Public IP Address

Open a browser on your Ubuntu machine and visit:

[https://whatismyipaddress.com/](https://whatismyipaddress.com/)

Or run:

```bash
curl ifconfig.me
```

This is your internet-facing IP.

### Step 6: Access the Bot From Outside Your Network

Use this address in any web browser (replace the IP with yours):

```
http://your-public-ip-address:8080/
```

You should see the bot’s health check page.

---

## Optional: Use a Free Domain Name with freedns.afraid.org

Instead of remembering your IP address, you can get a free subdomain pointing to your server.

### How to Set It Up

1. Go to [https://freedns.afraid.org](https://freedns.afraid.org) and create a free account.
2. Log in and go to **Subdomains**.
3. Choose a free shared domain or add your own domain.
4. Create a new subdomain (e.g., `steambot.yourchosenhost.tk`).
5. Set the subdomain type to **A** and enter your public IP address.
6. Save changes.
7. Wait a few minutes for the DNS to update.

Now you can access your bot using:

```
http://steambot.yourchosenhost.tk:8080/
```

---

## Security Advice

* Do **not** share your `.env` file with anyone.
* Keep your Steam and email passwords secret.
* Consider restricting port 8080 access using firewall rules or a VPN.
* For more security, consider using a reverse proxy (e.g., Nginx) with password protection.
* Change the default port from 8080 to something less common if possible.

---

## Troubleshooting Tips

* If the bot won’t start, make sure Node.js is installed correctly.
* Double-check your `.env` file for typos.
* Confirm your Steam credentials and shared secret are correct.
* Check your firewall and router port forwarding settings.
* Make sure your internet connection is working.

---

## Contributing

Feel free to submit bug reports or improvements by opening an issue or pull request on the GitHub repository.




