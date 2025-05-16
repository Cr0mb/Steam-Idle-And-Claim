  <img src="https://github.com/user-attachments/assets/259cab77-b52c-4797-9e06-7609138b3f19" width="300" />

  
  # Slice Strip

  **Slice Strip** is a powerful automated Steam bot designed to:


* Idle multiple Steam games simultaneously to gain playtime and earn trading cards.
* Automatically detect and claim free and heavily discounted (80%+) Steam games.
* Send email notifications when a free game is successfully claimed.
* Handle Steam Guard two-factor authentication (2FA) using shared secrets.
* Check for promotions at randomized intervals between 1 to 6 hours, to mimic natural behavior.
* Provide a simple HTTP API web server for remote control of idling and stopping the bot.

---

## Features

* Idle multiple Steam games concurrently.
* Automatically detect free or 80%+ discounted Steam games.
* Automatically claim free Steam licenses.
* Persist claimed promotions to avoid duplicate claims.
* Send email notifications upon successful free game claims.
* Support Steam Guard 2FA with shared secrets and sentry files.
* Randomized checking intervals to avoid detection and appear human-like.
* Simple HTTP API to remotely start and stop game idling.
* Runs on Linux systems (Ubuntu recommended).

---

## Prerequisites

Before running Slice Strip, ensure you have:

* A computer running **Ubuntu Linux** or a similar Linux distribution.
* Basic terminal/command line proficiency.
* Stable internet connection.
* A **Steam account** with:

  * Your Steam username.
  * Your Steam password.
  * (Optional but recommended) Steam shared secret for 2FA.
* An email account (Gmail recommended) supporting SMTP to send notification emails.
* Basic router access for port forwarding if you want remote bot control.

---

## Installation Guide

### 1. Open a Terminal

On Ubuntu, press `Ctrl + Alt + T` to open a terminal window.

### 2. Clone the Repository

Run:

```bash
git clone https://github.com/Cr0mb/Steam-Idle-And-Claim.git
```

This downloads the bot source code into the `Steam-Idle-And-Claim` folder.

### 3. Enter the Bot Directory

```bash
cd Steam-Idle-And-Claim
```

### 4. Install Node.js and npm

If Node.js isn’t installed, run:

```bash
sudo apt update
sudo apt install nodejs npm -y
```

### 5. Install Dependencies

Inside the project folder, install dependencies:

```bash
npm install
```

### 6. Create the `.env` File

Run:

```bash
nano .env
```

Add the following, replacing each `your_...` with your actual info:

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
* `SENDER_EMAIL`: Email address to send notifications from.
* `SENDER_PASSWORD`: Password or app-specific password for the sender email.
* `RECEIVER_EMAIL`: Email address to receive notifications.

Save the file with `Ctrl + O`, press Enter, then exit with `Ctrl + X`.

---

## Running the Bot

Run the bot with:

```bash
node index.js
```

You will see logs for Steam login, game idling start, and periodic promotion checks.

---

## Remote Control via HTTP API

Slice Strip runs a lightweight web server on port 8080 by default, allowing you to control the bot remotely:

| Endpoint                      | Description                          |
| ----------------------------- | ------------------------------------ |
| `http://localhost:8080/`      | Health check — verify bot is running |
| `http://localhost:8080/start` | Start idling games                   |
| `http://localhost:8080/stop`  | Stop idling games                    |

---

## Making the Bot Accessible from Outside Your Network

To access the bot remotely over the internet:

### 1. Open Port 8080 in Ubuntu Firewall

```bash
sudo ufw allow 8080/tcp
sudo ufw reload
sudo ufw status
```

Make sure port 8080 is allowed.

### 2. Configure the Bot to Listen on All Interfaces

Ensure in `index.js` the server listens on `0.0.0.0`:

```js
server.listen(8080, '0.0.0.0', () => {
  console.log('Server listening on port 8080');
});
```

### 3. Find Your Local IP Address

Run:

```bash
ip addr show
```

Look for an IP like `192.168.x.x` for your active network interface.

### 4. Setup Port Forwarding on Your Router

* Login to your router’s web interface.
* Locate the Port Forwarding section.
* Forward external port 8080 to your local IP and port 8080.
* Save changes.

### 5. Get Your Public IP Address

Open a browser and visit [https://whatismyipaddress.com/](https://whatismyipaddress.com/) or run:

```bash
curl ifconfig.me
```

### 6. Access the Bot Externally

Open your browser at:

```
http://your-public-ip-address:8080/
```

You should see the health check page.

---

## Optional: Use a Free Domain with freedns.afraid.org

Instead of using your IP, get a free subdomain:

1. Create an account at [https://freedns.afraid.org](https://freedns.afraid.org).
2. Add a subdomain pointing to your public IP.
3. Use the subdomain URL with port 8080 to access the bot remotely.

---

## Security Recommendations

* Never share your `.env` file or credentials.
* Protect port 8080 using firewall rules or VPN.
* Consider using a reverse proxy (e.g., Nginx) with authentication.
* Change the default port 8080 to something less common for obscurity.

---

## Troubleshooting

* Verify Node.js is installed and working.
* Double-check `.env` for typos.
* Confirm Steam credentials and 2FA shared secret are correct.
* Check firewall and port forwarding configurations.
* Ensure your internet connection is active.

---

## Contributing

Feel free to submit bugs or improvements via GitHub issues or pull requests.

---

## Contributing

Feel free to submit bug reports or improvements by opening an issue or pull request on the GitHub repository.




