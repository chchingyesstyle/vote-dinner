Vote Dinner — minimal voting webapp

Overview

This is a simple static webapp to vote for a dinner date. It uses Firebase Firestore to store votes in real-time and can be hosted for free using GitHub Pages.

Files

- index.html — UI
- style.css — styles
- app.js — JavaScript logic; paste your Firebase config into the firebaseConfig object

Setup

1. Create a Firebase project
   - Go to https://console.firebase.google.com/ and create a new project.
   - In Project Settings -> General -> Your apps -> Add Web App. Copy the firebaseConfig object.
   - Enable Firestore (Firestore Database) and create a database in test mode or set rules as you prefer.

2. Add config
   - Open `app.js` and replace the empty `firebaseConfig` with the object you copied from Firebase.

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

Notes and Next Steps

- This app uses Firestore in client-side JS. For a small group this is fine, but consider security rules to prevent abuse.
- Optional improvements: sign-in with Google to avoid name collisions; allow editing/removing votes; add a calendar widget.

License: MIT
