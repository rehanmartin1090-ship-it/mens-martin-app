# Mens Martin Unified App

A premium, luxury-themed brand application for **Mens Martin** that unifies sales channels, automates tracking updates, and delivers an installable mobile Progressive Web App (PWA) experience for customers.

---

## How to Deploy Permanently to the Internet (Render)

To make this app permanently accessible to your customers 24/7 (without needing your computer to stay on), follow these simple steps:

### Step 1: Create a GitHub Repository & Push Code
1. Open your browser and go to [GitHub](https://github.com/) (Sign in or create a free account).
2. Click **New Repository**.
   - **Repository name**: `mens-martin-app`
   - **Public/Private**: Choose **Private** (recommended to keep your layout private) or Public.
   - Do NOT add a README, `.gitignore`, or license.
   - Click **Create repository**.
3. Copy the commands under "**…or push an existing repository from the command line**". They should look like this:
   ```powershell
   git remote add origin https://github.com/YOUR_USERNAME/mens-martin-app.git
   git branch -M main
   git push -u origin main
   ```
4. Open **PowerShell** on your computer, navigate to the folder, and run those 3 commands to push the code:
   ```powershell
   cd "C:\Users\User\.gemini\antigravity\scratch\mens-martin-app"
   # Paste your 3 GitHub push commands here
   ```

---

### Step 2: Deploy to Render (Free Cloud Hosting)
1. Go to [Render](https://render.com/) and sign up for a free account (you can log in using your GitHub account).
2. In the Render Dashboard, click **New +** (top right) and select **Blueprint**.
3. Connect your GitHub account and select the `mens-martin-app` repository.
4. Render will read the `render.yaml` file automatically and prompt you for:
   - **Group Name / Service Details** (you can leave defaults).
   - **Environment Variables**:
     - `SHOPIFY_STORE_URL`: `5uqdbj-h0.myshopify.com`
     - `SHOPIFY_ACCESS_TOKEN`: `YOUR_SHOPIFY_ACCESS_TOKEN`
5. Click **Apply**.

Render will now build your project, install packages, and deploy the server. Within 2-3 minutes, you will get a secure public URL (e.g. `https://mens-martin-app.onrender.com`).

---

## How to Install the App on Mobile

Once your public Render URL is live:
1. Open the URL on your mobile phone (**Chrome** for Android, **Safari** for iPhone).
2. **Install to Home Screen:**
   - **Android**: Tap the 3 dots menu in Chrome and select **Install App** or **Add to Home Screen**.
   - **iPhone**: Tap the **Share** button in Safari and select **Add to Home Screen**.
3. An app icon named **Mens Martin** with your premium gold logo will appear on your phone, running in fullscreen standalone app mode!
