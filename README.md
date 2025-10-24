
Vote Dinner — minimal voting webapp (GitHub Issues backend)

Overview

This is a simple static webapp to vote for a dinner date. It uses GitHub Issues as a backend to store votes (as comments on a single issue) and can be hosted for free using GitHub Pages.

Files

- index.html — UI
- style.css — styles
- app.js — JavaScript logic; configure your GitHub repo and token at the top


Setup

1. Create a GitHub personal access token (PAT)
   - Go to https://github.com/settings/tokens → Generate new token (classic)
   - Give it a name, set expiration, and check "repo" scope
   - Copy the token (you'll need it for the next step)

2. Configure the app
   - Open `app.js` and set `GITHUB_OWNER`, `GITHUB_REPO`, and `GITHUB_TOKEN` at the top
   - Example:
     ```js
     const GITHUB_OWNER = 'your-username';
     const GITHUB_REPO = 'vote-dinner';
     const GITHUB_TOKEN = 'ghp_...';
     ```

3. Test locally
   - Serve the folder over HTTP (some browsers block module imports from file://). On Windows PowerShell you can run:

```powershell
# from inside the project folder
python -m http.server 8000
# or (if you have node)
npx http-server -c-1 . -p 8000
```

Then open http://localhost:8000 in your browser.

4. Publish to GitHub Pages
   - Create a GitHub repository and push this folder.
   - In the repo settings, enable GitHub Pages from the `main` branch (or use GitHub Actions to build if needed). The static site will be served.


How it works

- The app stores all votes as comments on a single issue in your repo (created automatically if not present)
- Each vote is a JSON object: `{ "name": "Alice", "dates": ["2025-10-24", "2025-10-25"], "ts": "..." }`
- Anyone with the token can add votes; all votes are public in the issue comments

Security note
- The GitHub token is required for writing votes. Do NOT commit your token to a public repo. For public deployments, consider using a proxy or serverless function to keep the token secret.

License: MIT

License: MIT
