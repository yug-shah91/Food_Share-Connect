// Global error handler for debugging
window.addEventListener('error', function(event) {
  const errorMsg = `❌ JS Error: ${event.message} at ${event.filename.split('/').pop()}:${event.lineno}`;
  console.error(errorMsg, event.error);
  showToast(errorMsg);
});

window.addEventListener('unhandledrejection', function(event) {
  const errorMsg = `❌ Promise Error: ${event.reason}`;
  console.error(errorMsg, event.reason);
  showToast(errorMsg);
});

// ============================================================
//  CONFIG — update BASE_URL when deploying
// ============================================================
const BASE_URL = 'http://localhost:8080';
 
// ============================================================
//  UI UTILS — Toast Notifications
// ============================================================
function showToast(message) {
  console.log("Toast:", message);
  const toast = document.getElementById('toast');
  if (!toast) {
    alert(message);
    return;
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
 
// ============================================================
//  API HELPERS
// ============================================================
 
/**
 * Returns the JWT token stored in memory (set after login).
 */
let _token = null;
 
function getToken() { 
  if (!_token) {
    _token = localStorage.getItem('token');
  }
  return _token; 
}
function setToken(t) { 
  _token = t; 
  if (t) {
    localStorage.setItem('token', t);
  } else {
    localStorage.removeItem('token');
  }
}
function clearToken() { 
  _token = null; 
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
}
 
/**
 * Generic fetch wrapper — injects Authorization header when token exists.
 * Throws an Error with message = backend error text on non-2xx.
 */
async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (getToken()) headers['Authorization'] = 'Bearer ' + getToken();
 
  const res = await fetch(BASE_URL + path, { ...options, headers });
 
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      msg = body.message || body.error || JSON.stringify(body);
    } catch (_) { /* ignore parse errors */ }
    throw new Error(msg);
  }
 
  // 204 No Content — return null
  if (res.status === 204) return null;
  return res.json();
}
 
// ── Auth ────────────────────────────────────────────────────
const api = {
  login:          (username, password) =>
    apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
 
  register:       (data) =>
    apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
 
  // Donations
  getActive:      ()    => apiFetch('/api/donations'),
  getById:        (id)  => apiFetch('/api/donations/' + id),
  createDonation: (data) =>
    apiFetch('/api/donations', { method: 'POST', body: JSON.stringify(data) }),
  getMyDonations: ()    => apiFetch('/api/donations/mine'),
  claimDonation:  (id)  => apiFetch('/api/donations/' + id + '/claim', { method: 'POST' }),
  verifyOtp:      (id, otp) => apiFetch('/api/donations/' + id + '/verify-otp', { method: 'POST', body: JSON.stringify({ otp }) }),
  getMyClaims:    ()    => apiFetch('/api/donations/claimed'),
 
  // Admin
  getAdminDashboard: () => apiFetch('/api/admin/dashboard'),
  deleteDonation:    (id) => apiFetch('/api/donations/' + id, { method: 'DELETE' }),

  // Notifications
  getNotifications:  ()   => apiFetch('/api/notifications'),
  markNotifRead:     (id) => apiFetch('/api/notifications/' + id + '/read', { method: 'POST' }),
};
 
// ============================================================
//  CATEGORY / STORAGE ENUM MAPS
//  Backend uses enum names (e.g. COOKED_MEALS); frontend uses display strings.
// ============================================================
const CATEGORY_TO_ENUM = {
  'Cooked Meals':        'COOKED_MEALS',
  'Bakery Items':        'BAKERY_ITEMS',
  'Vegetables & Fruits': 'VEGETABLES_FRUITS',
  'Dairy Products':      'DAIRY_PRODUCTS',
  'Packaged Food':       'PACKAGED_FOOD',
};
 
const ENUM_TO_CATEGORY = Object.fromEntries(
  Object.entries(CATEGORY_TO_ENUM).map(([k, v]) => [v, k])
);
 
const STORAGE_TO_ENUM = {
  'Room Temperature': 'ROOM_TEMPERATURE',
  'Refrigerated':     'REFRIGERATED',
  'Frozen':           'FROZEN',
};
 
const EMOJI_MAP = {
  'Cooked Meals': '🥘', 'COOKED_MEALS': '🥘',
  'Bakery Items': '🍞', 'BAKERY_ITEMS': '🍞',
  'Vegetables & Fruits': '🥗', 'VEGETABLES_FRUITS': '🥗',
  'Dairy Products': '🥛', 'DAIRY_PRODUCTS': '🥛',
  'Packaged Food': '📦', 'PACKAGED_FOOD': '📦',
};
 
// Map backend riskLevel string to CSS class & labels
const RISK_META = {
  LOW:  { cls: 'low',  label: 'Low Risk',    hours: '~6–8 hours',  freshLabel: 'Fresh',   expiresIn: '6h' },
  MED:  { cls: 'med',  label: 'Medium Risk', hours: '~2–4 hours',  freshLabel: 'Use Soon', expiresIn: '3h' },
  HIGH: { cls: 'high', label: 'High Risk',   hours: '< 2 hours',   freshLabel: 'Urgent',   expiresIn: '1h' },
};
 
// ============================================================
//  SESSION STATE
// ============================================================
let currentUser = null; // { username, fullName, role }
 
// ============================================================
//  LOGIN
// ============================================================
function fillLogin(user, pass) {
  document.getElementById('login-user').value = user;
  document.getElementById('login-pass').value = pass;
}
 
async function doLogin() {
  const username = document.getElementById('login-user').value.trim().toLowerCase();
  const password = document.getElementById('login-pass').value.trim();
  const errEl    = document.getElementById('login-error');
 
  errEl.style.display = 'none';
 
  try {
    const data = await api.login(username, password);
    // data: { token, username, fullName, role }
    setToken(data.token);
    currentUser = {
      username: data.username,
      name:     data.fullName,
      role:     data.role.toLowerCase(), // "donor" | "recipient" | "admin"
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    bootApp();
  } catch (err) {
    errEl.style.display = 'block';
    errEl.textContent   = '❌ ' + (err.message || 'Invalid username or password');
  }
}
 
// Allow Enter key on login
document.getElementById('login-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
document.getElementById('login-user').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
 
function doLogout() {
  clearToken();
  currentUser = null;
  document.getElementById('screen-app').style.display = 'none';
  document.getElementById('screen-login').classList.add('active');
  document.getElementById('login-user').value    = '';
  document.getElementById('login-pass').value    = '';
  document.getElementById('login-error').style.display = 'none';
  
  // Clear registration fields as well
  document.getElementById('reg-name').value = '';
  document.getElementById('reg-user').value = '';
  document.getElementById('reg-pass').value = '';
  document.getElementById('reg-phone').value = '';
  document.getElementById('reg-security-id').value = '';
  document.getElementById('reg-error').style.display = 'none';
}

function toggleSignup(showSignup) {
  document.getElementById('login-form-container').style.display = showSignup ? 'none' : 'block';
  document.getElementById('signup-form-container').style.display = showSignup ? 'block' : 'none';
  document.getElementById('reg-error').style.display = 'none';
  document.getElementById('login-error').style.display = 'none';
  
  if (showSignup) {
    updateSecurityLabel(); // Ensure label is correct initially
  }
}

function updateSecurityLabel() {
  const role = document.getElementById('reg-role').value;
  const label = document.getElementById('security-id-label');
  if (role === 'DONOR') {
    label.textContent = 'Restaurant ID';
  } else {
    label.textContent = 'NGO ID';
  }
}

async function doRegister() {
  const fullName = document.getElementById('reg-name').value.trim();
  const username = document.getElementById('reg-user').value.trim().toLowerCase();
  const password = document.getElementById('reg-pass').value.trim();
  const phoneNumber = document.getElementById('reg-phone').value.trim();
  const role = document.getElementById('reg-role').value;
  const securityId = document.getElementById('reg-security-id').value.trim();
  const errEl = document.getElementById('reg-error');

  errEl.style.display = 'none';

  if (!fullName || !username || !password || !securityId) {
    errEl.style.display = 'block';
    errEl.textContent = '❌ Please fill in all fields.';
    return;
  }

  try {
    const data = await api.register({ fullName, username, password, role, securityId, phoneNumber });
    setToken(data.token);
    currentUser = {
      username: data.username,
      name:     data.fullName,
      role:     data.role.toLowerCase(),
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    bootApp();
  } catch (err) {
    errEl.style.display = 'block';
    errEl.textContent = '❌ ' + (err.message || 'Registration failed');
  }
}
 
// ============================================================
//  APP BOOT — build nav + show correct home after login
// ============================================================
function bootApp() {
  try {
    document.getElementById('screen-login').classList.remove('active');
    document.getElementById('screen-app').style.display = 'block';
  
    document.getElementById('nav-username').textContent = currentUser.name || currentUser.username;
    document.getElementById('nav-role-pill').innerHTML  =
      `<span class="role-pill ${currentUser.role}">${currentUser.role}</span>`;
  
    try { buildNav(); } catch (e) { console.error("Error building nav:", e); }
    try { goHome(); } catch (e) { console.error("Error going home:", e); }
    try { loadNotifications(); } catch (e) { console.error("Error loading notifications:", e); }
    setTimeout(() => {
      try { initMap(); } catch (e) { console.error("Error initializing map:", e); }
    }, 300);
  } catch (err) {
    console.error("Critical error in bootApp:", err);
    throw err;
  }
}
 
function buildNav() {
  const links = document.getElementById('nav-links');
  links.innerHTML = '';
 
  const navMap = {
    donor:     [
      { id: 'donor-home',    label: 'Home' },
      { id: 'donor-donate',  label: 'Donate Food' },
      { id: 'donor-history', label: 'My Donations' },
    ],
    recipient: [
      { id: 'recipient-home',    label: 'Home' },
      { id: 'recipient-find',    label: 'Find Food' },
      { id: 'recipient-claimed', label: 'My Pickups' },
    ],
    admin:     [
      { id: 'admin-home', label: 'Dashboard' },
    ],
  };
 
  (navMap[currentUser.role] || []).forEach(item => {
    const a     = document.createElement('a');
    a.href      = '#';
    a.id        = 'nav-' + item.id;
    a.textContent = item.label;
    a.onclick   = (e) => { e.preventDefault(); showPage(item.id); };
    links.appendChild(a);
  });
}
 
function goHome() {
  const homeMap = { donor: 'donor-home', recipient: 'recipient-home', admin: 'admin-home' };
  showPage(homeMap[currentUser.role]);
}
 
// ============================================================
//  PAGE ROUTING
// ============================================================
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
 
  const page    = document.getElementById('page-' + id);
  if (page) page.classList.add('active');
 
  const navLink = document.getElementById('nav-' + id);
  if (navLink) navLink.classList.add('active');
 
  window.scrollTo({ top: 0, behavior: 'smooth' });
 
  if (id === 'donor-home')        renderDonorHome();
  if (id === 'donor-history')     renderDonorHistory();
  if (id === 'donor-donate') {
    resetAiPanel();
    if (donateMapInstance) {
      setTimeout(() => {
        donateMapInstance.invalidateSize();
      }, 100);
    }
  }
  if (id === 'recipient-home')    renderRecipientHome();
  if (id === 'recipient-find')    renderFindFood();
  if (id === 'recipient-claimed') renderClaimedPickups();
  if (id === 'admin-home')        renderAdminDashboard();
}

function resetAiPanel() {
  document.getElementById('ai-empty').style.display  = 'block';
  document.getElementById('ai-result').style.display = 'none';
}
 
// ============================================================
//  DONOR — HOME
// ============================================================
async function renderDonorHome() {
  document.getElementById('donor-name-hero').textContent = (currentUser.name || currentUser.username || '').split(' ')[0];
 
  try {
    const donations = await api.getMyDonations();
    const active    = donations.filter(d => d.status === 'ACTIVE').length;
    const completed = donations.filter(d => d.status === 'CLAIMED' || d.status === 'COMPLETED').length;
    const meals     = donations.reduce((s, d) => s + (d.quantity || 0), 0);
 
    document.getElementById('d-meals').textContent     = meals;
    document.getElementById('d-active').textContent    = active;
    document.getElementById('d-completed').textContent = completed;
 
    const container = document.getElementById('donor-recent-listings');
    const recent    = donations.slice(-3).reverse();
 
    if (!recent.length) {
      container.innerHTML = '<div class="empty-mini">No listings yet. Add your first donation!</div>';
      return;
    }
 
    container.innerHTML = recent.map(d => {
      const risk = (d.riskLevel || 'LOW').toUpperCase();
      const meta = RISK_META[risk] || RISK_META.LOW;
      const cat  = ENUM_TO_CATEGORY[d.category] || d.category;
      return `
        <div class="mini-item">
          <div class="mini-icon">${EMOJI_MAP[d.category] || '🍱'}</div>
          <div class="mini-info">
            <div class="mini-name">${d.foodName} · ${d.quantity} servings</div>
            <div class="mini-meta">${d.address} · Score: ${d.freshnessScore}</div>
          </div>
          <span class="fbadge ${(d.status === 'CLAIMED' || d.status === 'COMPLETED') ? 'grey' : meta.cls}">${(d.status === 'CLAIMED' || d.status === 'COMPLETED') ? 'Claimed' : 'Active'}</span>
        </div>`;
    }).join('');

    // Update donor map markers!
    if (donorMapInstance) {
      setTimeout(() => {
        donorMapInstance.invalidateSize();
        updateDonorMapMarkers(donations);
      }, 100);
    }
  } catch (err) {
    showToast('⚠️ Could not load donations: ' + err.message);
  }
}
 
// ============================================================
//  DONOR — SUBMIT DONATION
// ============================================================
async function submitDonation() {
  const foodName    = document.getElementById('foodName').value.trim();
  const categoryRaw = document.getElementById('foodCategory').value;
  const quantity    = document.getElementById('quantity').value;
  const storageRaw  = document.getElementById('storage').value;
  const address     = document.getElementById('address').value.trim();
  const notes       = document.getElementById('notes').value.trim();
  const prepTime    = document.getElementById('prepTime').value;
  const pickupUntil = document.getElementById('pickupUntil').value;
  const freshnessDuration = document.getElementById('freshnessDuration').value.trim();
 
  if (!foodName || !categoryRaw || !quantity || !storageRaw || !address) {
    showToast('⚠️ Please fill in all required fields.');
    return;
  }
 
  // Convert display values to backend enum names
  const category = CATEGORY_TO_ENUM[categoryRaw] || categoryRaw;
  const storage  = STORAGE_TO_ENUM[storageRaw]   || storageRaw;

  // Geocode address via Nominatim if not already set by clicking map
  let latitude = selectedLatitude;
  let longitude = selectedLongitude;
  if (!latitude || !longitude) {
    showToast('Searching location coordinates...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const geoData = await geoRes.json();
      if (geoData && geoData.length > 0) {
        latitude = parseFloat(geoData[0].lat);
        longitude = parseFloat(geoData[0].lon);
      }
    } catch (geoErr) {
      clearTimeout(timeoutId);
      console.warn("Geocoding failed or timed out, continuing without coordinates", geoErr);
    }
  }

  try {
    const donation = await api.createDonation({
      foodName, category, quantity: Number(quantity),
      storage, address, latitude, longitude, notes, prepTime, pickupUntil, freshnessDuration
    });
 
    // Show AI result panel using backend-computed freshness
    const risk = (donation.riskLevel || 'LOW').toUpperCase();
    const meta = RISK_META[risk] || RISK_META.LOW;
 
    document.getElementById('ai-empty').style.display  = 'none';
    document.getElementById('ai-result').style.display = 'block';
    document.getElementById('f-score').textContent     = donation.freshnessScore;
 
    const riskEl     = document.getElementById('f-risk');
    riskEl.textContent = donation.riskLabel || meta.label;
    riskEl.className   = 'fbadge ' + meta.cls;
    document.getElementById('f-hours').textContent = donation.riskHours || meta.hours;
    document.getElementById('f-rec').textContent   = donation.riskRecommendation || '';
 
    document.getElementById('matching-loader').style.display  = 'flex';
    document.getElementById('matching-results').style.display = 'none';
 
    setTimeout(() => {
      document.getElementById('matching-loader').style.display  = 'none';
      document.getElementById('matching-results').style.display = 'block';
      showToast('✅ "' + foodName + '" listed! Recipients have been notified.');
 
      // Reset form
      ['foodName', 'quantity', 'address', 'notes', 'prepTime', 'pickupUntil', 'freshnessDuration', 'magicInput']
        .forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });
      document.getElementById('foodCategory').value = '';
      document.getElementById('storage').value      = '';

      // Reset map marker and coordinate variables
      selectedLatitude = null;
      selectedLongitude = null;
      if (donateMarker && donateMapInstance) {
        donateMapInstance.removeLayer(donateMarker);
        donateMarker = null;
      }
    }, 2000);
 
  } catch (err) {
    showToast('❌ Failed to submit: ' + err.message);
  }
}
 
// ============================================================
//  DONOR — HISTORY
// ============================================================
async function renderDonorHistory() {
  const el = document.getElementById('donor-history-content');
  el.innerHTML = '<div class="empty-mini" style="padding:24px 0">Loading…</div>';
 
  try {
    const donations = await api.getMyDonations();
 
    if (!donations.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>You haven't added any donations yet.<br>Go to "Donate Food" to get started.</p></div>`;
      return;
    }
 
    el.innerHTML = `
      <table class="list-table">
        <thead><tr><th>Food</th><th>Category</th><th>Qty</th><th>Address</th><th>Freshness</th><th>Status</th><th>Time</th></tr></thead>
        <tbody>${donations.map(d => {
          const risk    = (d.riskLevel || 'LOW').toUpperCase();
          const meta    = RISK_META[risk] || RISK_META.LOW;
          const cat     = ENUM_TO_CATEGORY[d.category] || d.category;
          const timeStr = d.createdAt ? new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
          
          let statusHTML = '';
          if (d.status === 'COMPLETED') {
            statusHTML = `<span class="fbadge low">Collected ✓</span>`;
          } else if (d.status === 'CLAIMED') {
            statusHTML = `
              <div style="display:flex;flex-direction:column;gap:6px;align-items:center">
                <span class="fbadge warning">Claimed</span>
                <div style="display:flex;gap:4px;align-items:center">
                  <input type="text" placeholder="OTP" id="otp-input-${d.id}" 
                         style="width:55px;padding:3px 6px;font-size:12px;border:1px solid var(--border);border-radius:4px;text-align:center"
                         maxlength="4"/>
                  <button class="btn btn-primary" style="padding:2px 6px;font-size:11px;min-height:unset;line-height:1.2" 
                          onclick="submitOtpVerification(${d.id})">Verify</button>
                </div>
              </div>`;
          } else {
            statusHTML = `<span class="fbadge info">Active</span>`;
          }

          return `<tr>
            <td><strong>${EMOJI_MAP[d.category] || '🍱'} ${d.foodName}</strong></td>
            <td>${cat}</td>
            <td>${d.quantity} srv</td>
            <td>${d.address}</td>
            <td><span class="fbadge ${meta.cls}">${d.riskLabel || meta.label}</span></td>
            <td>${statusHTML}</td>
            <td style="color:var(--muted)">${timeStr}</td>
          </tr>`;
        }).join('')}
        </tbody>
      </table>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state"><p>⚠️ Could not load history: ${err.message}</p></div>`;
  }
}

async function submitOtpVerification(donationId) {
  const input = document.getElementById('otp-input-' + donationId);
  if (!input) return;
  const otp = input.value.trim();
  if (!otp) {
    showToast('⚠️ Please enter the 4-digit OTP code');
    return;
  }

  try {
    await api.verifyOtp(donationId, otp);
    showToast('✅ OTP verified successfully! Food pickup is complete.');
    renderDonorHome();
    renderDonorHistory();
  } catch (err) {
    showToast('❌ OTP Verification failed: ' + err.message);
  }
}
 
// ============================================================
//  RECIPIENT — HOME
// ============================================================
async function renderRecipientHome() {
  document.getElementById('recipient-name-hero').textContent = (currentUser.name || currentUser.username || '').split(' ')[0];
 
  try {
    const [activeDonations, myClaims] = await Promise.all([
      api.getActive(),
      api.getMyClaims(),
    ]);
    _activeListings = activeDonations; // Store globally so claiming from map works immediately
 
    const available = activeDonations.length;
    const claimed   = myClaims.length;
    const meals     = myClaims.reduce((s, d) => s + (d.quantity || 0), 0);
 
    document.getElementById('r-available').textContent = available;
    document.getElementById('r-claimed').textContent   = claimed;
    document.getElementById('r-meals').textContent     = meals;
 
    document.getElementById('recip-notif').textContent =
      available > 0
        ? `🔔 ${available} listing${available > 1 ? 's' : ''} available near you!`
        : '🔔 Check back soon for new listings!';
 
    const preview   = activeDonations.slice(-3).reverse();
    const container = document.getElementById('recip-preview-listings');
 
    if (!preview.length) {
      container.innerHTML = '<div class="empty-mini">No active listings right now.</div>';
      return;
    }
 
    container.innerHTML = preview.map(d => {
      const risk = (d.riskLevel || 'LOW').toUpperCase();
      const meta = RISK_META[risk] || RISK_META.LOW;
      return `
        <div class="mini-item">
          <div class="mini-icon">${EMOJI_MAP[d.category] || '🍱'}</div>
          <div class="mini-info">
            <div class="mini-name">${d.foodName} · ${d.quantity} servings</div>
            <div class="mini-meta">${d.address}</div>
          </div>
          <span class="fbadge ${meta.cls}">${meta.freshLabel}</span>
        </div>`;
    }).join('');

    if (mapInstance) {
      setTimeout(() => {
        mapInstance.invalidateSize();
        updateMapMarkers(activeDonations);
      }, 100);
    }
  } catch (err) {
    showToast('⚠️ Could not load data: ' + err.message);
  }
}
 
// ============================================================
//  RECIPIENT — FIND FOOD
// ============================================================
let _activeListings          = [];
let currentSearchQuery       = '';
let currentCategoryFilter    = '';
let currentFreshnessFilter   = '';
 
async function renderFindFood() {
  const grid = document.getElementById('listings-grid');
  grid.innerHTML = '<div class="empty-mini" style="padding:32px 0;text-align:center">Loading listings…</div>';
 
  try {
    _activeListings = await api.getActive();
    const claimedIds = new Set((await api.getMyClaims()).map(d => d.id));
 
    if (!_activeListings.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🍽</div><p>No active food listings right now.<br>Check back soon!</p></div>`;
      return;
    }
 
    grid.innerHTML = _activeListings.map(d => {
      const risk      = (d.riskLevel || 'LOW').toUpperCase();
      const meta      = RISK_META[risk] || RISK_META.LOW;
      const barColor  = risk === 'LOW' ? 'var(--g)' : risk === 'MED' ? 'var(--o)' : 'var(--danger)';
      const isClaimed = claimedIds.has(d.id);
      const cat       = ENUM_TO_CATEGORY[d.category] || d.category;
      return `
        <div class="listing-card" data-id="${d.id}" data-category="${cat}" data-name="${d.foodName.toLowerCase()}" data-risk="${risk.toLowerCase()}">
          <div class="card-top">
            <div class="food-emoji">${EMOJI_MAP[d.category] || '🍱'}</div>
            <span class="fbadge ${meta.cls}">${meta.freshLabel}</span>
          </div>
          <h3 class="food-name">${d.foodName}</h3>
          <div class="food-meta">👤 ${d.donorFullName} &nbsp;·&nbsp; 📦 ${d.quantity} servings</div>
          <div class="food-meta">📍 ${d.address} &nbsp;·&nbsp; ⏱ Safe Window: ${d.freshnessDuration || meta.expiresIn}</div>
          <div class="fbar"><div class="fbar-fill" style="width:${d.freshnessScore}%;background:${barColor}"></div></div>
          <div class="card-footer">
            <span class="score-tag">Freshness: ${d.freshnessScore}/100</span>
            <button class="btn-claim ${isClaimed ? 'claimed' : ''}"
              onclick="openClaimModal(${d.id})" ${isClaimed ? 'disabled' : ''}>
              ${isClaimed ? 'Claimed ✓' : 'Claim Pickup'}
            </button>
          </div>
        </div>`;
    }).join('');
 
    applyFilters();
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>⚠️ ${err.message}</p></div>`;
  }
}
 
function filterListings(query) {
  currentSearchQuery = query.toLowerCase();
  applyFilters();
}
 
function filterByCategory(cat) {
  currentCategoryFilter = cat;
  applyFilters();
}
 
function filterByFreshness(risk) {
  currentFreshnessFilter = risk;
  applyFilters();
}
 
function applyFilters() {
  document.querySelectorAll('.listing-card').forEach(card => {
    const nameMatch    = !currentSearchQuery    || card.dataset.name.includes(currentSearchQuery);
    const catMatch     = !currentCategoryFilter || card.dataset.category === currentCategoryFilter;
    const freshMatch   = !currentFreshnessFilter || card.dataset.risk === currentFreshnessFilter;
    card.classList.toggle('hidden', !(nameMatch && catMatch && freshMatch));
  });
}
 
// ============================================================
//  CLAIM MODAL
// ============================================================
function openClaimModal(donationId) {
  const d = _activeListings.find(x => x.id === donationId);
  if (!d) return;
 
  const risk = (d.riskLevel || 'LOW').toUpperCase();
  const meta = RISK_META[risk] || RISK_META.LOW;
  const cat  = ENUM_TO_CATEGORY[d.category] || d.category;
 
  document.getElementById('modal-title').textContent = 'Confirm Pickup — ' + d.foodName;
  document.getElementById('modal-desc').textContent  = 'You are claiming this donation for pickup.';
  document.getElementById('modal-details').innerHTML = `
    <strong>${EMOJI_MAP[d.category] || '🍱'} ${d.foodName}</strong><br>
    Donor: ${d.donorFullName}<br>
    Quantity: ${d.quantity} servings<br>
    Category: ${cat}<br>
    Location: ${d.address}<br>
    Contact Donor: <strong>${d.donorPhoneNumber || 'N/A'}</strong><br>
    Freshness Score: ${d.freshnessScore}/100 (${d.riskLabel || meta.label})<br>
    Safe Window: ${d.freshnessDuration || d.riskHours || meta.hours}
    ${d.notes ? '<br>Notes: ' + d.notes : ''}`;
 
  const confirmBtn    = document.getElementById('modal-confirm-btn');
  confirmBtn.onclick  = () => confirmClaim(donationId);
 
  document.getElementById('claim-modal').style.display = 'flex';
}
 
async function confirmClaim(donationId) {
  try {
    await api.claimDonation(donationId);
 
    document.getElementById('claim-modal').style.display = 'none';
    const d = _activeListings.find(x => x.id === donationId);
    showToast('✅ "' + (d ? d.foodName : 'Item') + '" claimed! Redirecting to My Pickups...');
 
    // Redirect to My Pickups immediately
    showPage('recipient-claimed');
  } catch (err) {
    document.getElementById('claim-modal').style.display = 'none';
    showToast('❌ Claim failed: ' + err.message);
  }
}
 
function closeModal(e) {
  if (e.target.id === 'claim-modal')
    document.getElementById('claim-modal').style.display = 'none';
}
 
// ============================================================
//  RECIPIENT — CLAIMED PICKUPS
// ============================================================
async function renderClaimedPickups() {
  const el = document.getElementById('claimed-content');
  el.innerHTML = '<div class="empty-mini" style="padding:24px 0">Loading…</div>';
 
  try {
    const myClaims = await api.getMyClaims();
 
    if (!myClaims.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><p>You haven't claimed any pickups yet.<br>Go to "Find Food" to browse available listings.</p></div>`;
      return;
    }
 
    el.innerHTML = `
      <table class="list-table">
        <thead><tr><th>Food</th><th>Donor</th><th>Qty</th><th>Location</th><th>Freshness</th><th>Pickup OTP</th><th>Claimed At</th></tr></thead>
        <tbody>${myClaims.map(d => {
          const risk    = (d.riskLevel || 'LOW').toUpperCase();
          const meta    = RISK_META[risk] || RISK_META.LOW;
          const timeStr = d.claimedAt ? new Date(d.claimedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
          const otpHTML = d.status === 'COMPLETED' 
            ? `<span class="fbadge low">Verified ✓</span>` 
            : `<span class="fbadge info" style="font-family:monospace;font-size:14px;letter-spacing:1px;font-weight:bold">${d.otp || '—'}</span>`;
          return `<tr>
            <td><strong>${EMOJI_MAP[d.category] || '🍱'} ${d.foodName}</strong></td>
            <td>${d.donorFullName} <br> <small>${d.donorPhoneNumber || ''}</small></td>
            <td>${d.quantity} srv</td>
            <td>${d.address}</td>
            <td><span class="fbadge ${meta.cls}">${d.riskLabel || meta.label}</span></td>
            <td>${otpHTML}</td>
            <td style="color:var(--muted)">${timeStr}</td>
          </tr>`;
        }).join('')}
        </tbody>
      </table>`;
  } catch (err) {
    el.innerHTML = `<div class="empty-state"><p>⚠️ Could not load pickups: ${err.message}</p></div>`;
  }
}
 
// ============================================================
//  ADMIN DASHBOARD
// ============================================================
async function renderAdminDashboard() {
  try {
    const stats = await api.getAdminDashboard();
 
    document.getElementById('a-meals').textContent     = stats.totalMeals;
    document.getElementById('a-co2').textContent       = stats.co2Saved.toFixed(1) + ' kg';
    document.getElementById('a-listings').textContent  = stats.totalListings;
    document.getElementById('a-completed').textContent = stats.completedListings;
 
    // All listings table
    const listingsEl = document.getElementById('admin-all-listings');
    if (!stats.allDonations || !stats.allDonations.length) {
      listingsEl.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:12px 0">No donations yet.</div>';
    } else {
      listingsEl.innerHTML = `
        <table class="data-table">
          <thead><tr><th>Food</th><th>Donor</th><th>Qty</th><th>Score</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${stats.allDonations.map(d => {
            const risk = (d.riskLevel || 'LOW').toUpperCase();
            const meta = RISK_META[risk] || RISK_META.LOW;
            return `<tr>
              <td>${EMOJI_MAP[d.category] || '🍱'} ${d.foodName}</td>
              <td>${d.donorFullName}</td>
              <td>${d.quantity}</td>
              <td><span class="fbadge ${meta.cls}">${d.freshnessScore}</span></td>
              <td><span class="fbadge ${(d.status === 'CLAIMED' || d.status === 'COMPLETED') ? 'low' : 'info'}">${(d.status === 'CLAIMED' || d.status === 'COMPLETED') ? 'Claimed' : 'Active'}</span></td>
              <td><button class="btn btn-ghost" style="padding:4px 8px;font-size:12px;color:var(--danger)" onclick="deleteDonationAdmin(${d.id})">Delete</button></td>
            </tr>`;
          }).join('')}
          </tbody>
        </table>`;
    }
 
    // Users table
    const usersEl = document.getElementById('admin-users-table');
    if (stats.users && stats.users.length) {
      usersEl.innerHTML = stats.users.map(u => `
        <tr>
          <td><strong>${u.fullName}</strong></td>
          <td><span class="role-pill ${u.role.toLowerCase()}">${u.role.toLowerCase()}</span></td>
          <td style="color:var(--muted)">${u.activityCount} ${u.activityLabel}</td>
        </tr>`).join('');
    }
 
    // Prediction log
    const predEl = document.getElementById('admin-pred-log');
    if (!stats.allDonations || !stats.allDonations.length) {
      predEl.innerHTML = '<div style="color:var(--muted);font-size:13px">No predictions yet.</div>';
    } else {
      predEl.innerHTML = stats.allDonations.map(d => {
        const risk     = (d.riskLevel || 'LOW').toUpperCase();
        const meta     = RISK_META[risk] || RISK_META.LOW;
        const dotColor = risk === 'LOW' ? 'var(--g)' : risk === 'MED' ? 'var(--o)' : 'var(--danger)';
        return `
          <div class="pred-row">
            <span class="pred-dot" style="background:${dotColor}"></span>
            <div>
              <div class="pred-name">${d.foodName} — by ${d.donorFullName}</div>
              <div class="pred-meta">Score: ${d.freshnessScore} · ${d.riskLabel || meta.label} · Safe: ${d.riskHours || meta.hours} · Status: ${(d.status === 'CLAIMED' || d.status === 'COMPLETED') ? 'Claimed' : 'Active'}</div>
            </div>
          </div>`;
      }).join('');
    }
  } catch (err) {
    showToast('⚠️ Admin dashboard error: ' + err.message);
  }
}
 
// ============================================================
//  MAP INITIALIZATION & HELPERS
// ============================================================
let mapInstance = null;
let mapMarkers = [];
let donorMapInstance = null;
let donorMapMarkers = [];
let donateMapInstance = null;
let donateMarker = null;
let selectedLatitude = null;
let selectedLongitude = null;
 
function initMap() {
  // 1. Recipient Map
  if (!mapInstance && document.getElementById('real-map')) {
    mapInstance = L.map('real-map').setView([23.2599, 77.4126], 12); // Bhopal
 
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);
 
    // If active listings are already loaded, display their markers immediately
    if (_activeListings && _activeListings.length > 0) {
      updateMapMarkers(_activeListings);
    }
  }

  // 2. Donor Home Map
  if (!donorMapInstance && document.getElementById('donor-map')) {
    donorMapInstance = L.map('donor-map').setView([23.2599, 77.4126], 12); // Bhopal

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(donorMapInstance);
  }

  // 3. Donate Page Map (Interactive Location Picker)
  if (!donateMapInstance && document.getElementById('donate-map')) {
    donateMapInstance = L.map('donate-map').setView([23.2599, 77.4126], 12); // Bhopal

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(donateMapInstance);

    // Let donor click to select coordinates & reverse-geocode address
    donateMapInstance.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      setDonateMarker(lat, lng);
      
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const data = await res.json();
        if (data && data.display_name) {
          document.getElementById('address').value = data.display_name;
        }
      } catch (err) {
        console.warn("Reverse geocoding failed", err);
      }
    });

    // Listen for manual address typing to geocode and center pin on map
    const addressInput = document.getElementById('address');
    if (addressInput) {
      addressInput.addEventListener('change', async (e) => {
        const addr = e.target.value.trim();
        if (addr) {
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`);
            const geoData = await geoRes.json();
            if (geoData && geoData.length > 0) {
              const lat = parseFloat(geoData[0].lat);
              const lon = parseFloat(geoData[0].lon);
              setDonateMarker(lat, lon);
              donateMapInstance.setView([lat, lon], 14);
            }
          } catch (err) {
            console.warn("Geocoding typed address failed", err);
          }
        }
      });
    }
  }
}

function updateMapMarkers(listings) {
  if (!mapInstance) return;
  
  // Clear old markers
  mapMarkers.forEach(m => mapInstance.removeLayer(m));
  mapMarkers = [];
  
  let bounds = L.latLngBounds();
  let hasValidCoords = false;

  listings.forEach(d => {
    if (d.latitude && d.longitude) {
      hasValidCoords = true;
      const marker = L.marker([d.latitude, d.longitude]).addTo(mapInstance);
      marker.bindPopup(`
        <strong>${EMOJI_MAP[d.category] || '🍱'} ${d.foodName}</strong><br>
        Qty: ${d.quantity} servings<br>
        Score: ${d.freshnessScore}/100<br>
        <button style="margin-top:5px;font-size:12px;padding:4px 8px;cursor:pointer;background:var(--primary);color:white;border:none;border-radius:4px;" onclick="openClaimModal(${d.id})">Claim</button>
      `);
      mapMarkers.push(marker);
      bounds.extend([d.latitude, d.longitude]);
    }
  });

  if (hasValidCoords) {
    mapInstance.fitBounds(bounds, { padding: [20, 20], maxZoom: 14 });
  } else {
    // Default back to Bhopal if no dynamic markers
    mapInstance.setView([23.2599, 77.4126], 12);
  }
}

// ============================================================
//  NOTIFICATIONS
// ============================================================
async function loadNotifications() {
  try {
    const notifs = await api.getNotifications();
    const unreadCount = notifs.filter(n => !n.read).length;
    
    const badge = document.getElementById('notif-badge');
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }

    const listEl = document.getElementById('notif-list');
    if (notifs.length === 0) {
      listEl.innerHTML = '<div class="empty-mini">No notifications</div>';
    } else {
      listEl.innerHTML = notifs.map(n => {
        const timeStr = new Date(n.createdAt).toLocaleString();
        return `<div class="notif-item ${n.read ? '' : 'unread'}" onclick="markNotifRead(${n.id}, this)">
          <div>${n.message}</div>
          <span class="notif-time">${timeStr}</span>
        </div>`;
      }).join('');
    }
  } catch (err) {
    console.error("Failed to load notifications", err);
  }
}

function toggleNotifications() {
  const dropdown = document.getElementById('notif-dropdown');
  dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

async function markNotifRead(id, element) {
    if (element.classList.contains('unread')) {
      try {
        await api.markNotifRead(id);
        element.classList.remove('unread');
        loadNotifications(); // Refresh badge
      } catch (err) {
        console.error("Failed to mark read", err);
      }
    }
}

async function deleteDonationAdmin(id) {
  if (!confirm("Are you sure you want to delete this listing?")) return;
  try {
    await api.deleteDonation(id);
    showToast("✅ Listing deleted successfully");
    renderAdminDashboard(); // Refresh
  } catch (err) {
    showToast("❌ Could not delete: " + err.message);
  }
}

// ============================================================
//  DONOR MAP & LOCATION PICKER HELPERS
// ============================================================
function updateDonorMapMarkers(donations) {
  if (!donorMapInstance) return;

  // Clear old markers
  donorMapMarkers.forEach(m => donorMapInstance.removeLayer(m));
  donorMapMarkers = [];

  let bounds = L.latLngBounds();
  let hasValidCoords = false;

  donations.forEach(d => {
    if (d.latitude && d.longitude) {
      hasValidCoords = true;
      const marker = L.marker([d.latitude, d.longitude]).addTo(donorMapInstance);
      const risk = (d.riskLevel || 'LOW').toUpperCase();
      const meta = RISK_META[risk] || RISK_META.LOW;
      
      marker.bindPopup(`
        <strong>${EMOJI_MAP[d.category] || '🍱'} ${d.foodName}</strong><br>
        Qty: ${d.quantity} servings<br>
        Status: <span style="font-weight:bold;color:${(d.status === 'CLAIMED' || d.status === 'COMPLETED') ? 'var(--muted)' : 'var(--primary)'}">${(d.status === 'CLAIMED' || d.status === 'COMPLETED') ? 'Claimed' : 'Active'}</span><br>
        Score: ${d.freshnessScore}/100 (${d.riskLabel || meta.label})
      `);
      donorMapMarkers.push(marker);
      bounds.extend([d.latitude, d.longitude]);
    }
  });

  if (hasValidCoords) {
    donorMapInstance.fitBounds(bounds, { padding: [20, 20], maxZoom: 14 });
  } else {
    donorMapInstance.setView([23.2599, 77.4126], 12);
  }
}

function setDonateMarker(lat, lon) {
  selectedLatitude = lat;
  selectedLongitude = lon;
  
  if (donateMarker) {
    donateMarker.setLatLng([lat, lon]);
  } else {
    donateMarker = L.marker([lat, lon]).addTo(donateMapInstance);
  }
}

// ============================================================
//  MAGIC PREDICT (AI FORM AUTO-FILLER)
// ============================================================
function magicAutofill() {
  const text = document.getElementById('magicInput').value.trim();
  if (!text) {
    showToast('⚠️ Please enter a description first.');
    return;
  }

  // 1. Quantity extraction (find any number)
  const qtyMatch = text.match(/\b(\d+)\b/);
  if (qtyMatch) {
    document.getElementById('quantity').value = qtyMatch[1];
  }

  // 2. Category matching
  const categorySelect = document.getElementById('foodCategory');
  let category = '';
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('biryani') || lowerText.includes('dal') || lowerText.includes('rice') || lowerText.includes('paneer') || lowerText.includes('curry') || lowerText.includes('meal') || lowerText.includes('roti') || lowerText.includes('sabzi') || lowerText.includes('soup') || lowerText.includes('pasta') || lowerText.includes('pizza') || lowerText.includes('burger') || lowerText.includes('makhani')) {
    category = 'Cooked Meals';
  } else if (lowerText.includes('bread') || lowerText.includes('cake') || lowerText.includes('muffin') || lowerText.includes('croissant') || lowerText.includes('bun') || lowerText.includes('cookie') || lowerText.includes('pastry') || lowerText.includes('bakery')) {
    category = 'Bakery Items';
  } else if (lowerText.includes('apple') || lowerText.includes('banana') || lowerText.includes('orange') || lowerText.includes('fruit') || lowerText.includes('salad') || lowerText.includes('tomato') || lowerText.includes('potato') || lowerText.includes('vegetable') || lowerText.includes('mango') || lowerText.includes('veg')) {
    category = 'Vegetables & Fruits';
  } else if (lowerText.includes('milk') || lowerText.includes('cheese') || lowerText.includes('curd') || lowerText.includes('butter') || lowerText.includes('dairy') || lowerText.includes('yogurt')) {
    category = 'Dairy Products';
  } else if (lowerText.includes('chips') || lowerText.includes('biscuit') || lowerText.includes('packet') || lowerText.includes('snack') || lowerText.includes('canned') || lowerText.includes('packaged') || lowerText.includes('chocolate')) {
    category = 'Packaged Food';
  }
  
  if (category) {
    categorySelect.value = category;
  }

  // 3. Storage Condition matching
  const storageSelect = document.getElementById('storage');
  let storage = 'Room Temperature'; // default
  if (lowerText.includes('refrigerate') || lowerText.includes('fridge') || lowerText.includes('cold') || lowerText.includes('cool')) {
    storage = 'Refrigerated';
  } else if (lowerText.includes('freez') || lowerText.includes('froz') || lowerText.includes('ice')) {
    storage = 'Frozen';
  }
  storageSelect.value = storage;

  // 4. Prepared At time matching
  // Look for formats: hh:mm am/pm or hh:mm or hh am/pm
  const timeRegex = /(\d{1,2}):?(\d{2})?\s*(am|pm)?/i;
  const timeMatch = text.match(timeRegex);
  if (timeMatch && !text.match(/^\d+$/)) {
    let hour = parseInt(timeMatch[1]);
    const minute = timeMatch[2] ? timeMatch[2] : '00';
    const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : '';
    
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    
    const formattedHour = String(hour).padStart(2, '0');
    document.getElementById('prepTime').value = `${formattedHour}:${minute}`;
    
    // Add default pickup until (4 hours later)
    let pickupHour = (hour + 4) % 24;
    document.getElementById('pickupUntil').value = `${String(pickupHour).padStart(2, '0')}:${minute}`;
  }

  // 5. Address matching (look for "at [location]" or "in [location]")
  const locationMatch = text.match(/(?:at|in|near)\s+([A-Za-z0-9\s,]+?)(?:\s+prepared|\s+listed|\s+ready|\s+for|\s+quantity|\s+temp|\s+refrigerated|\s+frozen|$)/i);
  if (locationMatch) {
    document.getElementById('address').value = locationMatch[1].trim();
    // Dispatch change event to update the map pin
    document.getElementById('address').dispatchEvent(new Event('change'));
  } else {
    // Fallback: search for standard locations
    const locations = ['Vijay Nagar', 'Palasia', 'Rajendra Nagar', 'Bhopal', 'Indore', 'Minal Residency', 'Arera Colony', 'MP Nagar'];
    for (let loc of locations) {
      if (lowerText.includes(loc.toLowerCase())) {
        document.getElementById('address').value = loc;
        document.getElementById('address').dispatchEvent(new Event('change'));
        break;
      }
    }
  }

  // 6. Food Name extraction
  let foodName = '';
  const ofMatch = text.match(/portions\s+of\s+([A-Za-z0-9\s]+?)(?:\s+at|\s+in|\s+near|\s+prepared|\s+with|\s+ready|$)/i) || 
                  text.match(/servings\s+of\s+([A-Za-z0-9\s]+?)(?:\s+at|\s+in|\s+near|\s+prepared|\s+with|\s+ready|$)/i);
  if (ofMatch) {
    foodName = ofMatch[1].trim();
  } else {
    const stopWords = ['warm', 'fresh', 'cooked', 'delicious', 'cold', 'leftover', 'some', 'portions', 'servings'];
    let words = text.split(/\s+/);
    let nameParts = [];
    for (let word of words) {
      let lWord = word.toLowerCase();
      if (lWord.match(/^\d+$/) || ['portions', 'servings', 'at', 'in', 'near', 'prepared', 'ready'].includes(lWord)) {
        break;
      }
      if (!stopWords.includes(lWord)) {
        nameParts.push(word);
      }
    }
    if (nameParts.length > 0) {
      foodName = nameParts.join(' ');
    }
  }
  if (foodName) {
    foodName = foodName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    document.getElementById('foodName').value = foodName;
  }

  showToast('🪄 AI Magic Predict: Form populated successfully!');
}

// Check for persisted login session on startup
(function checkPersistedSession() {
  const savedToken = localStorage.getItem('token');
  const savedUser = localStorage.getItem('currentUser');
  if (savedToken && savedUser) {
    try {
      _token = savedToken;
      currentUser = JSON.parse(savedUser);
      bootApp();
    } catch (e) {
      console.error('Failed to parse saved session:', e);
      clearToken();
    }
  }
})();