# Idan Avioz — Portfolio

Personal portfolio site for showcasing electronics, IoT, and embedded systems projects.

## Quick Start (Local Development)

```bash
npm install
npm run dev
```

Site will be available at `http://localhost:5173`

## Deploy to Vercel (Easiest — No GitHub Required)

### Option A: Drag and Drop (No GitHub needed)
1. Run `npm run build` — this creates a `dist` folder
2. Go to [vercel.com](https://vercel.com) and sign up (free)
3. On the dashboard, drag and drop the `dist` folder
4. Your site is live!

### Option B: Via GitHub (Recommended — auto-deploys on changes)
1. Create a GitHub account at [github.com](https://github.com)
2. Install Git on your computer: [git-scm.com/downloads](https://git-scm.com/downloads)
3. Run these commands:

```bash
cd portfolio-site
git init
git add .
git commit -m "Initial portfolio"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/portfolio.git
git push -u origin main
```

4. Go to [vercel.com](https://vercel.com), sign in with GitHub
5. Click "Import Project" → select your portfolio repo
6. Click "Deploy" — done!

## Connect a Custom Domain

After deploying to Vercel:
1. Buy a domain at [namecheap.com](https://www.namecheap.com) (e.g., `idanavioz.com`)
2. In Vercel dashboard → your project → Settings → Domains
3. Add your domain name
4. Vercel will show you 2 DNS records to add
5. Go to Namecheap → Domain List → Manage → Advanced DNS
6. Add the records Vercel showed you
7. Wait 5-30 minutes for DNS propagation
8. Done — your site is live at your custom domain!

## How to Update Your Site

### If using GitHub (Option B):
```bash
# After making changes:
git add .
git commit -m "Updated portfolio"
git push
```
Vercel auto-deploys within 30 seconds.

### If using drag-and-drop (Option A):
1. Run `npm run build` again
2. Re-upload the `dist` folder on Vercel

## Managing Content

All content (projects, skills, profile info) is managed directly on the site:
- **Projects**: Click "+" card to add, click any project → Edit/Delete
- **Skills**: Click "Edit Skills" button in the Skills section
- **Profile**: Click the gear icon (⚙) in the navigation bar

Data is saved in your browser's localStorage.

## Tech Stack

- React 18
- Vite 5
- Pure CSS (no frameworks)
- localStorage for data persistence
