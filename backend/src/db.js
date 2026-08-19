const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ profiles: {}, scans: {} }, null, 2));
  }
}

function read() {
  ensureStore();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function write(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// --- Profiles ---
function createProfile(profile) {
  const data = read();
  data.profiles[profile.id] = profile;
  write(data);
  return profile;
}

function getProfile(id) {
  const data = read();
  return data.profiles[id] || null;
}

// --- Scans ---
function createScan(scan) {
  const data = read();
  data.scans[scan.id] = scan;
  write(data);
  return scan;
}

function getScan(id) {
  const data = read();
  return data.scans[id] || null;
}

function updateScan(id, patch) {
  const data = read();
  if (!data.scans[id]) return null;
  data.scans[id] = { ...data.scans[id], ...patch };
  write(data);
  return data.scans[id];
}

function listScansByProfile(profileId) {
  const data = read();
  return Object.values(data.scans)
    .filter(s => s.profileId === profileId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

module.exports = {
  createProfile,
  getProfile,
  createScan,
  getScan,
  updateScan,
  listScansByProfile,
};
