// NOTE: You must add your Firebase config below. Replace the placeholder object with your project's config.
// How to get it: Firebase Console -> Project Settings -> SDK snippet -> Config

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, getDoc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import flatpickr from 'https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/esm/index.js';

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

let auth;
if (app) {
  auth = getAuth(app);
}

const nameEl = document.getElementById('name');
const dateEl = document.getElementById('date');
const voteBtn = document.getElementById('vote');
const listEl = document.getElementById('list');
const summaryEl = document.getElementById('summary');
const signInBtn = document.getElementById('signIn');
const signOutBtn = document.getElementById('signOut');
const userInfo = document.getElementById('userInfo');
const myVoteDisplay = document.getElementById('myVoteDisplay');
const myvoteSection = document.getElementById('myvote');
const changeVoteBtn = document.getElementById('changeVote');
const removeVoteBtn = document.getElementById('removeVote');

// init flatpickr
flatpickr(dateEl, { dateFormat: 'Y-m-d', minDate: 'today' });

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
    // if signed in, store by uid to enforce one vote per user
    const user = auth && auth.currentUser;
    if (user) {
      await setDoc(doc(db, 'votes', user.uid), { name: user.displayName || name, date, ts: new Date(), uid: user.uid });
    } else {
      // anonymous: create auto-id doc
      await addDoc(collection(db, 'votes'), { name, date, ts: new Date() });
    }
    nameEl.value = '';
    dateEl.value = '';
  } catch (err) {
    console.error(err);
    alert('Failed to save vote: ' + err.message);
  }
});

changeVoteBtn.addEventListener('click', () => {
  // focus date input so user can pick a new one
  dateEl.focus();
});

removeVoteBtn.addEventListener('click', async () => {
  if (!db || !auth || !auth.currentUser) return;
  if (!confirm('Remove your vote?')) return;
  try {
    await deleteDoc(doc(db, 'votes', auth.currentUser.uid));
  } catch (err) { console.error(err); alert('Remove failed: ' + err.message); }
});

// Real-time listener
if (db) {
  const q = query(collection(db, 'votes'), orderBy('ts', 'asc'));
  onSnapshot(q, (snap) => {
    const groups = {};
    const docs = [];
    snap.forEach(d => docs.push({ id: d.id, data: d.data() }));

    docs.forEach(({ id, data: v }) => {
      if (!v.date) return;
      groups[v.date] = groups[v.date] || [];
      // store objects to allow remove/edit links for signed-in users
      groups[v.date].push({ name: v.name || 'Anonymous', uid: v.uid || null, id });
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
      right.style.textAlign = 'right';
      // join names; annotate "(you)" when uid matches
      const parts = groups[d].map(entry => {
        if (entry.uid && auth && auth.currentUser && entry.uid === auth.currentUser.uid) return entry.name + ' (you)';
        return entry.name;
      });
      right.textContent = parts.join(', ');
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

  // Auth handlers
  if (auth) {
    const provider = new GoogleAuthProvider();
    signInBtn.addEventListener('click', async () => {
      try { await signInWithPopup(auth, provider); } catch (e) { console.error(e); }
    });
    signOutBtn.addEventListener('click', async () => { try { await signOut(auth); } catch (e) { console.error(e); } });

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        signInBtn.style.display = 'none';
        signOutBtn.style.display = 'inline-block';
        userInfo.textContent = `Signed in: ${user.displayName || user.email}`;
        myvoteSection.style.display = 'block';
        // show user's vote if exists
        const d = await getDoc(doc(db, 'votes', user.uid));
        if (d.exists()) {
          const v = d.data();
          myVoteDisplay.textContent = `${v.date} — ${v.name}`;
          changeVoteBtn.style.display = 'inline-block';
          removeVoteBtn.style.display = 'inline-block';
        } else {
          myVoteDisplay.textContent = 'None';
          changeVoteBtn.style.display = 'none';
          removeVoteBtn.style.display = 'none';
        }
      } else {
        signInBtn.style.display = 'inline-block';
        signOutBtn.style.display = 'none';
        userInfo.textContent = '';
        myvoteSection.style.display = 'none';
      }
    });
  }
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
