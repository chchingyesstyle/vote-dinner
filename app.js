// NOTE: You must add your Firebase config below. Replace the placeholder object with your project's config.
// How to get it: Firebase Console -> Project Settings -> SDK snippet -> Config

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

const firebaseConfig = {
  // paste your config here
  // apiKey: "...",
};

// initialize (will throw if config is empty)
let app, db;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (err) {
  console.warn('Firebase not initialized — add firebaseConfig to app.js to enable saving.');
}

const nameEl = document.getElementById('name');
const dateEl = document.getElementById('date');
const voteBtn = document.getElementById('vote');
const listEl = document.getElementById('list');
const summaryEl = document.getElementById('summary');

voteBtn.addEventListener('click', async () => {
  const name = nameEl.value.trim();
  const date = dateEl.value;
  if (!name || !date) {
    alert('Please enter your name and choose a date.');
    return;
  }

  if (!db) {
    alert('Saving is disabled. Add your Firebase config into app.js.');
    return;
  }

  try {
    await addDoc(collection(db, 'votes'), { name, date, ts: new Date() });
    nameEl.value = '';
    dateEl.value = '';
  } catch (err) {
    console.error(err);
    alert('Failed to save vote: ' + err.message);
  }
});

// Real-time listener
if (db) {
  const q = query(collection(db, 'votes'), orderBy('ts', 'asc'));
  onSnapshot(q, (snap) => {
    const groups = {};
    snap.forEach(doc => {
      const v = doc.data();
      if (!v.date) return;
      groups[v.date] = groups[v.date] || [];
      groups[v.date].push(v.name || 'Anonymous');
    });

    // render list
    listEl.innerHTML = '';
    const dates = Object.keys(groups).sort();
    let best = null;
    dates.forEach(d => {
      const li = document.createElement('li');
      const left = document.createElement('div');
      left.textContent = d;
      const right = document.createElement('div');
      right.textContent = groups[d].join(', ');
      li.appendChild(left);
      li.appendChild(right);
      listEl.appendChild(li);

      if (!best || groups[d].length > groups[best].length) best = d;
    });

    if (best) {
      summaryEl.textContent = `${best} — ${groups[best].length} vote(s)`;
    } else {
      summaryEl.textContent = 'No votes yet';
    }
  }, (err) => {
    console.error('snapshot error', err);
    summaryEl.textContent = 'Error loading results';
  });
} else {
  // No DB: try to load from localStorage as fallback
  summaryEl.textContent = 'Not connected — saving disabled';
  const saved = JSON.parse(localStorage.getItem('votes') || '[]');
  const groups = {};
  saved.forEach(v => { groups[v.date] = groups[v.date] || []; groups[v.date].push(v.name); });
  listEl.innerHTML = '';
  Object.keys(groups).sort().forEach(d => {
    const li = document.createElement('li');
    li.innerHTML = `<div>${d}</div><div>${groups[d].join(', ')}</div>`;
    listEl.appendChild(li);
  });
}
