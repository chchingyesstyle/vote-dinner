// GitHub Issues backend config
// Set these before using:
const GITHUB_OWNER = 'chchingyesstyle'; // your GitHub username
const GITHUB_REPO = 'vote-dinner'; // your repo name
const GITHUB_TOKEN = ''; // your GitHub PAT (with repo scope)
const ISSUE_TITLE = 'Dinner Vote Data'; // all votes stored as comments on this issue

import flatpickr from 'https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/esm/index.js';

const nameEl = document.getElementById('name');
const dateEl = document.getElementById('date');
const voteBtn = document.getElementById('vote');
const listEl = document.getElementById('list');
const summaryEl = document.getElementById('summary');
const myVoteDisplay = document.getElementById('myVoteDisplay');
const myvoteSection = document.getElementById('myvote');
const changeVoteBtn = document.getElementById('changeVote');
const removeVoteBtn = document.getElementById('removeVote');

// init flatpickr (multiple-date selection)
const fp = flatpickr(dateEl, { mode: 'multiple', dateFormat: 'Y-m-d', minDate: 'today' });

// Helper: GitHub API request
async function ghRequest(path, method = 'GET', body = null) {
  const headers = {
    'Accept': 'application/vnd.github+json',
    'Authorization': `token ${GITHUB_TOKEN}`,
  };
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`https://api.github.com${path}`, opts);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

// Find or create the issue for storing votes
async function getOrCreateVoteIssue() {
  // Search for the issue
  const issues = await ghRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=open&per_page=100`);
  let issue = issues.find(i => i.title === ISSUE_TITLE);
  if (!issue) {
    // Create it
    issue = await ghRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, 'POST', { title: ISSUE_TITLE, body: 'All dinner votes are stored as comments.' });
  }
  return issue.number;
}

// Post a vote as a comment
async function postVoteComment(name, dates) {
  const issueNum = await getOrCreateVoteIssue();
  const payload = { name, dates, ts: new Date().toISOString() };
  await ghRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNum}/comments`, 'POST', { body: JSON.stringify(payload) });
}

// Get all votes (comments)
async function getAllVotes() {
  const issueNum = await getOrCreateVoteIssue();
  const comments = await ghRequest(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNum}/comments?per_page=100`);
  // Parse JSON bodies
  return comments.map(c => { try { return JSON.parse(c.body); } catch { return null; } }).filter(Boolean);
}

voteBtn.addEventListener('click', async () => {
  const name = nameEl.value.trim();
  const selected = (fp && fp.selectedDates) ? fp.selectedDates.map(d => fp.formatDate(d, 'Y-m-d')) : [];
  if (!name || selected.length === 0) {
    alert('Please enter your name and choose one or more dates.');
    return;
  }
  if (!GITHUB_TOKEN) {
    alert('GitHub token not set in app.js.');
    return;
  }
  try {
    await postVoteComment(name, selected);
    nameEl.value = '';
    fp.clear();
    await renderVotes();
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


// Render votes from GitHub
async function renderVotes() {
  if (!GITHUB_TOKEN) {
    summaryEl.textContent = 'GitHub token not set.';
    return;
  }
  try {
    const votes = await getAllVotes();
    const groups = {};
    votes.forEach(v => {
      if (Array.isArray(v.dates)) {
        v.dates.forEach(d => {
          groups[d] = groups[d] || [];
          groups[d].push(v.name || 'Anonymous');
        });
      }
    });
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
  } catch (err) {
    summaryEl.textContent = 'Error loading votes';
    console.error(err);
  }
}

// Initial render
renderVotes();
