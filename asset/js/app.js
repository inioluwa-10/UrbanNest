/* Listings — lifestyle attrs (vibe/pets/yard/schools/walk/garage/pool/commute/modern/view)
   power the Lifestyle Match score (see matchScore). */
const listings = [
  {id:1, price:685000, beds:4, baths:3, sqft:2480, addr:"2412 Barton Hills Dr, Austin, TX", tag:"For sale", type:"sale", isNew:false, img:"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=700&q=80&auto=format&fit=crop", vibe:"suburb", pets:true, yard:3, schools:9, walk:62, garage:true, pool:false, commute:8, modern:false, view:true},
  {id:2, price:3200, beds:3, baths:2, sqft:1780, addr:"4501 Duval St, Austin, TX", tag:"For rent", type:"rent", isNew:true, img:"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=700&q=80&auto=format&fit=crop", vibe:"suburb", pets:true, yard:1, schools:6, walk:74, garage:false, pool:true, commute:6, modern:false, view:false},
  {id:3, price:529000, beds:3, baths:2, sqft:1925, addr:"1208 E 12th St, Austin, TX", tag:"New", type:"new", isNew:true, img:"https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=700&q=80&auto=format&fit=crop", vibe:"urban", pets:true, yard:1, schools:5, walk:82, garage:false, pool:false, commute:9, modern:true, view:false},
  {id:4, price:899000, beds:5, baths:4, sqft:3420, addr:"7 Enchanted Oaks, West Lake Hills, TX", tag:"For sale", type:"sale", isNew:false, img:"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=700&q=80&auto=format&fit=crop", vibe:"suburb", pets:true, yard:3, schools:10, walk:24, garage:true, pool:true, commute:5, modern:false, view:true},
  {id:5, price:2450, beds:2, baths:2, sqft:1240, addr:"900 S 1st St #210, Austin, TX", tag:"For rent", type:"rent", isNew:false, img:"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=700&q=80&auto=format&fit=crop", vibe:"urban", pets:true, yard:0, schools:5, walk:95, garage:false, pool:true, commute:9, modern:true, view:false},
  {id:6, price:775000, beds:4, baths:3, sqft:2650, addr:"3103 Cherry Creek Dr, Austin, TX", tag:"Open house", type:"sale", isNew:true, img:"https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=700&q=80&auto=format&fit=crop", vibe:"suburb", pets:true, yard:2, schools:8, walk:45, garage:true, pool:false, commute:7, modern:true, view:false},
];
/* Original list prices (change indicators compare against these) + persisted price history */
const ORIG = Object.fromEntries(listings.map(l=>[l.id, l.price]));
let savedPrices = JSON.parse(localStorage.getItem("un_prices")||"{}");
listings.forEach(l=>{ if(savedPrices[l.id]!=null) l.price = savedPrices[l.id]; });
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const fmt = n => "$" + n.toLocaleString();
let favs = new Set(JSON.parse(localStorage.getItem("un_favs")||"[]"));
let activeFilter = "all";

/* ===== Feature 1: Price-change alerts for saved homes =====
   watch: {listingId: priceAtSave} — what you paid attention to.
   alerts: list of detected changes (newest first). */
let watch  = JSON.parse(localStorage.getItem("un_watch")  || "{}");
let alerts = JSON.parse(localStorage.getItem("un_alerts") || "[]");

/* ===== Feature 2: Lifestyle profile (from the match quiz) ===== */
let profile = JSON.parse(localStorage.getItem("un_profile") || "null");

/* Toast */
let toastT;
function toast(msg){
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(()=>t.classList.remove("show"), 2600);
}

/* Listings */
/* Lifestyle Match score (0-99): budget, bedrooms, must-haves and life stage */
const wantTests = {
  pets:   l => l.pets,
  yard:   l => l.yard >= 2,
  school: l => l.schools >= 8,
  walk:   l => l.walk >= 70,
  quiet:  l => l.vibe === "suburb",
  garage: l => l.garage,
  pool:   l => l.pool,
  commute:l => l.commute >= 7,
  view:   l => l.view,
  modern: l => l.modern
};
function matchScore(l){
  if(!profile) return null;
  let s = 46;                                   // neutral starting point
  if(l.price <= profile.budget) s += 16;        // fits the budget
  else s -= Math.min(24, Math.round(((l.price-profile.budget)/profile.budget)*60));
  if(l.beds >= profile.beds) s += 12;           // enough bedrooms
  else s -= (profile.beds - l.beds) * 8;
  profile.wants.forEach(w => { if(wantTests[w] && wantTests[w](l)) s += 7; });
  if(profile.stage === "family")  s += (l.schools >= 8 ? 6 : -4) + (l.beds >= 3 ? 4 : -4);
  if(profile.stage === "remote")  s += (l.sqft >= 1900 ? 6 : -3);
  if(profile.stage === "starter") s -= (l.price > profile.budget ? 6 : 0);
  return Math.max(3, Math.min(99, s));
}

/* Price-change indicator vs. original list price */
function priceChange(l){
  const delta = l.price - ORIG[l.id];
  if(!delta) return "";
  const pct = Math.abs(delta / ORIG[l.id] * 100).toFixed(1);
  const cls = delta > 0 ? "up" : "down";
  const arrow = delta > 0 ? "▲" : "▼";
  const sign = delta > 0 ? "+" : "−";
  return `<span class="pchg ${cls}" title="Changed from ${fmt(ORIG[l.id])}">${arrow} ${sign}${fmt(Math.abs(delta))} (${pct}%)</span>`;
}

function render(){
  const el = $("#cards");
  /* Saving a home is a signed-in only action: signed out, hearts render as
     disabled outlines and the saved count stays at 0 (stored favs return on sign-in). */
  const signedIn = !!getSession();
  let items = listings.filter(l => activeFilter==="all" ? true : activeFilter==="new" ? l.isNew : activeFilter==="sale" ? (l.type==="sale"||l.type==="new") : l.type===activeFilter);
  if(profile) items = [...items].sort((a,b) => matchScore(b) - matchScore(a)); // best lifestyle fit first
  el.innerHTML = items.map(l => {
    const score = matchScore(l);
    const loved = signedIn && favs.has(l.id);
    return `
    <article class="card" data-id="${l.id}">
      <div class="card-img">
        <img loading="lazy" src="${l.img}" alt="${l.addr}">
        <span class="badge">${l.tag}</span>
        <button class="fav ${loved?"loved":""}${signedIn?"":" locked"}" data-fav="${l.id}"${signedIn?"":' aria-disabled="true" title="Sign in to save homes"'}>${loved?"♥":"♡"}</button>
        ${score!==null ? `<span class="match-pill ${score>=70?"good":score>=45?"ok":"low"}">${score}% match</span>` : ""}
      </div>
      <div class="card-body">
        <div class="price">${fmt(l.price)}${l.type==="rent" ? "/mo":""} ${priceChange(l)}</div>
        <div class="specs"><b>${l.beds}</b> bds · <b>${l.baths}</b> ba · <b>${l.sqft.toLocaleString()}</b> sqft</div>
        <div class="addr">${l.addr}</div>
        ${signedIn && watch[l.id]!=null && watch[l.id]!==l.price ? alertChip(l) : ""}
      </div>
    </article>`;
  }).join("") || `<p class="muted">No homes match this filter.</p>`;
  $("#favCount").textContent = signedIn ? favs.size : 0;
}
function alertChip(l){
  const delta = l.price - watch[l.id];
  const cls = delta > 0 ? "up" : "down";
  const word = delta > 0 ? "Price up since you saved it" : "Price dropped since you saved it";
  return `<span class="watched ${cls}">${word}</span>`;
}
function setFilter(f){
  activeFilter = f;
  $$(".chip").forEach(c=>c.classList.toggle("active", c.dataset.filter===f));
  render();
}

/* Dropdowns: click-to-toggle + hover via CSS */
function closeMenus(except){
  $$(".nav-menu.open").forEach(m=>{ if(m!==except){ m.classList.remove("open"); m.querySelector(".nav-top-link")?.setAttribute("aria-expanded","false"); }});
}
$$("[data-menu] > .nav-top-link").forEach(link=>{
  link.addEventListener("click", e=>{
    const menu = link.parentElement;
    const panel = menu.querySelector(".dropdown-panel");
    if(!panel) return;
    // On desktop with hover, still allow click to pin open; second click follows link
    if(menu.classList.contains("open")){ closeMenus(); return; } // let default navigate
    e.preventDefault();
    closeMenus(menu);
    menu.classList.add("open");
    link.setAttribute("aria-expanded","true");
  });
  link.addEventListener("mouseenter", ()=>{ if(window.matchMedia("(hover:hover)").matches){ closeMenus(link.parentElement); link.parentElement.classList.add("open"); }});
});
document.addEventListener("click", e=>{ if(!e.target.closest("[data-menu]")) closeMenus(); });
document.addEventListener("keydown", e=>{ if(e.key==="Escape"){ closeMenus(); closeModal(); }});

/* Global action handler — makes every dropdown link functional */
document.addEventListener("click", e=>{
  const favBtn = e.target.closest("[data-fav]");
  if(favBtn){ e.stopPropagation(); const id=+favBtn.dataset.fav;
    if(!getSession()){                    // not signed in → cannot save or unsave
      openModal("signin");
      toast("Sign in to save homes to your favourites");
      return;
    }
    const listing = listings.find(l=>l.id===id);
    if(favs.has(id)){
      favs.delete(id); delete watch[id];
      localStorage.setItem("un_watch", JSON.stringify(watch));
      toast("Removed from saved homes");
    } else {
      favs.add(id); watch[id] = listing.price;      // baseline price for change detection
      localStorage.setItem("un_watch", JSON.stringify(watch));
      toast(`Saved ♥ — we'll alert you if ${listing.addr.split(",")[0]} changes price`);
    }
    localStorage.setItem("un_favs", JSON.stringify([...favs])); render();
    return; }
  const chip = e.target.closest(".chip");
  if(chip){ setFilter(chip.dataset.filter); return; }

  const act = e.target.closest("[data-action]");
  if(!act) return;
  const action = act.dataset.action;
  if(act.dataset.toast) toast(act.dataset.toast);

  if(action==="filter"){
    e.preventDefault();
    setFilter(act.dataset.filter || "all");
    document.getElementById("listings").scrollIntoView({behavior:"smooth"});
    closeMenus();
  }
  else if(action==="goto"){
    e.preventDefault(); closeMenus();
    const t = act.dataset.target;
    if(t==="top"){ window.scrollTo({top:0,behavior:"smooth"}); return; }
    document.querySelector(t)?.scrollIntoView({behavior:"smooth"});
  }
  else if(action==="afford"){
    e.preventDefault(); closeMenus();
    document.querySelector("#mortgage").scrollIntoView({behavior:"smooth"});
    const card = $("#calcCard"); card.classList.add("flash");
    setTimeout(()=>card.classList.remove("flash"),1200);
    setTimeout(()=>$("#calcPrice").focus(),600);
  }
  else if(action==="rates"){
    e.preventDefault(); closeMenus();
    document.querySelector("#mortgage").scrollIntoView({behavior:"smooth"});
    const box = $("#ratesBox"); box.hidden = false;
    toast("Live rates: 30-yr 6.20% · 15-yr 5.55% · 5-yr ARM 5.91%");
  }
  else if(action==="prequal"){
    e.preventDefault(); closeMenus();
    const user = getSession();
    if(!user){ openModal("signup"); toast("Create an account to get pre-qualified"); }
    else { document.querySelector("#mortgage").scrollIntoView({behavior:"smooth"}); toast(`Good news ${user.name.split(" ")[0]} — you're pre-qualified up to $520,000`); }
  }
  else if(action==="value"){
    e.preventDefault(); closeMenus();
    document.querySelector("#sell").scrollIntoView({behavior:"smooth",block:"center"});
    estimateValue();
  }
  else if(action==="app"){
    e.preventDefault(); closeMenus();
    toast("UrbanNest app link sent — search “UrbanNest” in your app store");
  }
  else if(action==="auth"){
    e.preventDefault(); closeMenus();
    const user = getSession();
    if(!user) openModal("signin");
    else toast(`You're signed in as ${user.email}`);
  }
  else if(action==="toast"){
    e.preventDefault(); closeMenus();
  }
});

/* Search tabs */
const hints = {buy:"Try “Austin TX”, “90210”, or “123 Main St” — 1.2M homes for sale.", rent:"2.4M rentals near you — apartments, houses, verified listings.", sell:"See what your home is worth — free NestEstimate in seconds.", loans:"Check today's rates — 30-yr fixed from 6.20% APR.", agent:"2,340 top-rated agents in Austin — avg 4.8★."};
$$(".search-tab").forEach(b=>b.addEventListener("click",()=>{
  $$(".search-tab").forEach(x=>x.classList.remove("active")); b.classList.add("active");
  $("#searchHint").textContent = hints[b.dataset.tab];
  $("#searchInput").placeholder = b.dataset.tab==="agent" ? "City or agent name..." : "City, neighborhood, ZIP, address...";
}));
$("#searchBtn").addEventListener("click", doSearch);
$("#searchInput").addEventListener("keydown", e=>{ if(e.key==="Enter") doSearch(); });
function doSearch(){
  const q = $("#searchInput").value.trim() || "Austin, TX";
  document.getElementById("listings").scrollIntoView({behavior:"smooth"});
  document.querySelector(".section-head p").textContent = `Showing results near “${q}” — ${listings.length} homes`;
  toast(`Search: “${q}” — ${listings.length} homes found`);
}

/* Calculator */
function calc(){
  const P = +$("#calcPrice").value||0;
  const downPct = +$("#calcDown").value||0;
  const rate = +$("#calcRate").value||0;
  const yrs = +$("#calcYears").value||30;
  const principal = P*(1-downPct/100);
  const r = rate/100/12, n = yrs*12;
  const m = r>0 ? principal*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1) : principal/n;
  $("#calcOut").textContent = "$"+Math.round(m).toLocaleString();
  $("#calcRange").value = Math.min(1500000, Math.max(100000, P));
}
["calcPrice","calcDown","calcRate","calcYears"].forEach(id=>document.getElementById(id).addEventListener("input",calc));
$("#calcRange").addEventListener("input",e=>{$("#calcPrice").value=e.target.value;calc();});
calc();

/* Home value estimator */
function estimateValue(){
  const addr = $("#valueInput").value.trim();
  const base = 480000 + (addr.length * 7321) % 220000;
  $("#valueOut").textContent = addr ? `NestEstimate™ for “${addr}”: $${base.toLocaleString()} · +4.2% YoY` : `NestEstimate™ for your home: $${base.toLocaleString()} · enter an address for a precise value`;
  toast("NestEstimate™ calculated");
}
$("#valueBtn").addEventListener("click", estimateValue);

/* Auth — two separate forms: sign in vs create account */
const modal = $("#signModal");
let mode = "signin";
function openModal(m){
  setMode(m || "signin");
  modal.classList.add("open"); modal.setAttribute("aria-hidden","false");
  setTimeout(()=>$(mode==="signin" ? "#signinEmail" : "#signupName")?.focus(),50);
}
function closeModal(){ modal.classList.remove("open"); modal.setAttribute("aria-hidden","true"); }
function setMode(m){
  mode = m;
  $("#tabSignin").classList.toggle("active", m==="signin");
  $("#tabSignup").classList.toggle("active", m==="signup");
  $("#signinView").hidden = m!=="signin";
  $("#signupView").hidden = m!=="signup";
  $("#signinErr").hidden = true;
  $("#signupErr").hidden = true;
}
$("#tabSignin").addEventListener("click", ()=>setMode("signin"));
$("#tabSignup").addEventListener("click", ()=>setMode("signup"));
function bindPwToggle(btnId, inputId){
  document.getElementById(btnId)?.addEventListener("click", ()=>{
    const p = document.getElementById(inputId); p.type = p.type==="password" ? "text" : "password";
    document.getElementById(btnId).textContent = p.type==="password" ? "Show" : "Hide";
  });
}
bindPwToggle("pwToggleIn","signinPass");
bindPwToggle("pwToggleUp","signupPass");
$("#modalClose").addEventListener("click", closeModal);
modal.addEventListener("click", e=>{ if(e.target===modal) closeModal(); });
$("#forgotLink")?.addEventListener("click", e=>{ e.preventDefault(); toast("Reset link sent — check your email (demo)"); });
$$("[data-social]").forEach(b=>b.addEventListener("click", ()=>{
  const name = "Demo User", email = "demo@urbannest.com";
  saveSession({name, email, provider:b.dataset.social});
  closeModal(); toast(`Signed in with ${b.dataset.social} as ${email}`);
}));

const getUsers = () => JSON.parse(localStorage.getItem("un_users")||"{}");
const getSession = () => JSON.parse(localStorage.getItem("un_session")||"null");
function saveSession(user){
  const remember = $("#authRemember")?.checked !== false;
  localStorage.setItem("un_session", JSON.stringify(user));
  if(!remember) sessionStorage.setItem("un_session_tmp","1");
  paintUser();
}
function paintUser(){
  const user = getSession();
  const area = document.querySelector(".user-area");
  const btn = $("#sign");
  if(user){
    area.classList.add("logged");
    btn.textContent = user.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
    btn.classList.add("signed");
    btn.title = user.email;
    $("#avatar").textContent = btn.textContent;
    $("#userName").textContent = user.name;
    $("#userEmail").textContent = user.email;
  } else {
    area.classList.remove("logged");
    btn.textContent = "Sign in"; btn.classList.remove("signed");
  }
  paintProfileSummary();
  render();
}
$("#signinForm").addEventListener("submit", e=>{
  e.preventDefault();
  const email = $("#signinEmail").value.trim().toLowerCase();
  const pass = $("#signinPass").value;
  const err = $("#signinErr");
  const fail = m => { err.textContent = m; err.hidden = false; };
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a valid email address.");
  if(pass.length < 6) return fail("Password must be at least 6 characters.");
  const users = getUsers();
  if(users[email]){
    if(users[email].pass !== pass) return fail("Incorrect password for this email. Try 'Forgot password?' or Create account.");
    saveSession({name: users[email].name, email});
  } else {
    return fail("No account found for this email — click Create account to register.");
  }
  $("#signinPass").value = "";
  closeModal(); toast("Signed in — recommendations unlocked.");
});
$("#signupForm").addEventListener("submit", e=>{
  e.preventDefault();
  const name = $("#signupName").value.trim();
  const email = $("#signupEmail").value.trim().toLowerCase();
  const pass = $("#signupPass").value;
  const pass2 = $("#signupPass2").value;
  const err = $("#signupErr");
  const fail = m => { err.textContent = m; err.hidden = false; };
  if(!name) return fail("Please enter your full name.");
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a valid email address.");
  if(pass.length < 8) return fail("Create a password with at least 8 characters.");
  if(pass !== pass2) return fail("Passwords do not match.");
  if(!$("#signupTerms").checked) return fail("Please accept the Terms & Privacy to continue.");
  const users = getUsers();
  if(users[email]) return fail("Account already exists — switch to Sign in.");
  users[email] = {name, pass};
  localStorage.setItem("un_users", JSON.stringify(users));
  saveSession({name, email});
  $("#signupPass").value = ""; $("#signupPass2").value = "";
  closeModal(); toast(`Welcome to UrbanNest, ${name.split(" ")[0]}! Account created.`);
});
$("#sign").addEventListener("click", ()=>{
  const user = getSession();
  if(!user){ openModal("signin"); return; }
  $("#userMenu").classList.toggle("open");
});
document.addEventListener("click", e=>{ if(!e.target.closest(".user-area")) $("#userMenu")?.classList.remove("open"); });
$("#signOut").addEventListener("click", ()=>{
  localStorage.removeItem("un_session");
  $("#userMenu").classList.remove("open");
  paintUser(); toast("Signed out. See you soon.");
});
// Reco button behavior is handled by #recoAction (see Lifestyle Match section)

/* Mobile menu */
const ham=$("#hamburger"), mm=$("#mobileMenu");
ham.addEventListener("click",()=>{ mm.classList.toggle("open"); mm.style.display=""; const open=mm.classList.contains("open"); ham.setAttribute("aria-expanded",open); ham.textContent=open?"✕":"☰"; });
mm.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{ mm.classList.remove("open"); ham.textContent="☰"; }));

/* =========================================================
   FEATURE 1 — Price-change alerts for saved properties
   ========================================================= */
function addAlert(l, oldPrice){
  const delta = l.price - oldPrice;
  const a = {
    id: Date.now() + "-" + l.id,
    listing: l.id, addr: l.addr, img: l.img,
    old: oldPrice, now: l.price, delta,
    pct: (Math.abs(delta) / oldPrice * 100).toFixed(1),
    up: delta > 0, time: Date.now(), read: false
  };
  alerts.unshift(a);
  alerts = alerts.slice(0, 40);
  localStorage.setItem("un_alerts", JSON.stringify(alerts));
  return a;
}
function unreadCount(){ return alerts.filter(a=>!a.read).length; }
function paintBell(){
  const n = unreadCount();
  const badge = $("#bellCount");
  badge.textContent = n;
  badge.hidden = n === 0;
  $("#bell").classList.toggle("has-unread", n > 0);
}
function timeAgo(t){
  const m = Math.round((Date.now()-t)/60000);
  if(m < 1) return "just now";
  if(m < 60) return m + " min ago";
  const h = Math.round(m/60);
  if(h < 24) return h + " hr ago";
  return Math.round(h/24) + " d ago";
}
function renderAlerts(){
  const box = $("#alertList");
  if(!alerts.length){
    box.innerHTML = `<p class="muted" style="padding:14px">No price changes yet. Save a home (♥) and we'll watch its price for you.</p>`;
    return;
  }
  box.innerHTML = alerts.map(a=>`
    <div class="alert-item ${a.read?"":"unread"}" data-alert="${a.id}" data-goto-listing="${a.listing}">
      <img src="${a.img}" alt="">
      <div>
        <strong>${a.up?"▲":"▼"} ${fmt(Math.abs(a.delta))} (${a.up?"+":"−"}${a.pct}%)</strong>
        <p>${a.addr}</p>
        <small>${fmt(a.old)} → <b>${fmt(a.now)}</b> · ${timeAgo(a.time)}</small>
      </div>
    </div>`).join("");
}
function notifyUser(msg){
  toast(msg);
  // Browser notification (if permission already granted — we never prompt unprompted)
  if("Notification" in window && Notification.permission === "granted"){
    try{ new Notification("UrbanNest price alert", { body: msg }); }catch(e){}
  }
}
/* The "market": periodically nudge listing prices (saved homes always get watched,
   so you get an alert; others just show the ▲/▼ badge).
   In a real app this runs server-side on MLS/feed data. */
function marketTick(){
  const watched = listings.filter(l => watch[l.id] != null);
  // Prefer drifting a saved home (75%), otherwise move any listing
  const pool = (watched.length && Math.random() < 0.75) ? watched : listings;
  const l = pool[Math.floor(Math.random() * pool.length)];
  const old = l.price;
  const swing = (Math.random() < 0.55 ? -1 : 1) * (0.01 + Math.random() * 0.04); // ±1–5%
  let next = l.type === "rent"
    ? Math.round(l.price * (1 + swing) / 25) * 25
    : Math.round(l.price * (1 + swing) / 500) * 500;
  if(next === old) return;
  l.price = next;   // watch baseline stays at the price you saved, so the card keeps
                    // showing cumulative "since you saved" change
  localStorage.setItem("un_prices", JSON.stringify(Object.fromEntries(listings.map(x=>[x.id,x.price]))));
  render();
  if(watch[l.id] == null) return;        // not saved → price badge only, no alert
  const a = addAlert(l, old);
  paintBell();
  if($("#alertPanel").classList.contains("open")) renderAlerts();
  const short = l.addr.split(",")[0];
  notifyUser(`${a.up?"Price up":"Price drop"}: ${short} — ${fmt(old)} → ${fmt(next)} (${a.up?"+":"−"}${a.pct}%)`);
}
$("#bell").addEventListener("click", e=>{
  e.stopPropagation();
  const p = $("#alertPanel");
  const open = p.classList.toggle("open");
  if(open){ renderAlerts(); }
});
document.addEventListener("click", e=>{ if(!e.target.closest("#alertPanel") && !e.target.closest("#bell")) $("#alertPanel").classList.remove("open"); });
$("#alertList").addEventListener("click", e=>{
  const item = e.target.closest("[data-alert]");
  if(!item) return;
  const a = alerts.find(x=>x.id===item.dataset.alert);
  if(a){ a.read = true; localStorage.setItem("un_alerts", JSON.stringify(alerts)); paintBell(); renderAlerts(); }
  const card = document.querySelector(`.card[data-id="${item.dataset.gotoListing}"]`);
  if(card){ $("#alertPanel").classList.remove("open"); card.scrollIntoView({behavior:"smooth", block:"center"}); card.classList.add("flash"); setTimeout(()=>card.classList.remove("flash"),1400); }
});
$("#alertClear").addEventListener("click", e=>{
  e.stopPropagation();
  alerts = []; localStorage.setItem("un_alerts","[]"); paintBell(); renderAlerts();
});
document.addEventListener("keydown", e=>{ if(e.key==="Escape") $("#alertPanel").classList.remove("open"); });

/* =========================================================
   FEATURE 2 — Lifestyle Match quiz
   ========================================================= */
const wants = [
  {k:"pets",   icon:"🐾", label:"Pet friendly"},
  {k:"yard",   icon:"🌳", label:"Big backyard"},
  {k:"school", icon:"🎓", label:"Top schools"},
  {k:"walk",   icon:"🚶", label:"Walkable"},
  {k:"quiet",  icon:"🌲", label:"Quiet suburb"},
  {k:"garage", icon:"🚗", label:"Garage"},
  {k:"pool",   icon:"🏊", label:"Pool"},
  {k:"commute",icon:"🛣️", label:"Easy commute"},
  {k:"view",   icon:"🌄", label:"Views"},
  {k:"modern", icon:"✨", label:"Modern"}
];
function paintWants(selected){
  $("#wantGrid").innerHTML = wants.map(w =>
    `<button type="button" class="pick ${selected.includes(w.k)?"sel":""}" data-want="${w.k}">${w.icon} ${w.label}</button>`).join("");
}
function openQuiz(){
  const p = profile || {budget:650000, beds:3, wants:[], stage:"any"};
  $("#qBudget").value = p.budget;
  $("#qBudgetOut").textContent = fmt(p.budget);
  $("#qBeds").textContent = p.beds;
  $$("[data-stage]").forEach(b=>b.classList.toggle("sel", b.dataset.stage === p.stage));
  paintWants(p.wants);
  $("#quizModal").classList.add("open");
  $("#quizModal").setAttribute("aria-hidden","false");
}
function closeQuiz(){ $("#quizModal").classList.remove("open"); $("#quizModal").setAttribute("aria-hidden","true"); }

$("#lifeBtn").addEventListener("click", openQuiz);
$("#recoAction").addEventListener("click", ()=>{
  if(profile) document.getElementById("listings").scrollIntoView({behavior:"smooth"});
  else if(!getSession()) openModal("signin");
  else openQuiz();
});
$("#quizClose").addEventListener("click", closeQuiz);
$("#quizModal").addEventListener("click", e=>{ if(e.target === $("#quizModal")) closeQuiz(); });
document.addEventListener("keydown", e=>{ if(e.key==="Escape") closeQuiz(); });

$("#qBudget").addEventListener("input", e=> $("#qBudgetOut").textContent = fmt(+e.target.value));
$("#bedsMinus").addEventListener("click", ()=>{ const el=$("#qBeds"); el.textContent = Math.max(1, +el.textContent - 1); });
$("#bedsPlus").addEventListener("click",  ()=>{ const el=$("#qBeds"); el.textContent = Math.min(6, +el.textContent + 1); });
document.addEventListener("click", e=>{
  const stage = e.target.closest("[data-stage]");
  if(stage){ $$("[data-stage]").forEach(b=>b.classList.remove("sel")); stage.classList.add("sel"); }
  const pick = e.target.closest("[data-want]");
  if(pick) pick.classList.toggle("sel");
});

function paintProfileSummary(){
  const title = $("#recoTitle"), text = $("#recoText"), btn = $("#recoAction");
  const user = getSession();
  if(profile){
    const top = listings.map(l=>({l, s:matchScore(l)})).sort((a,b)=>b.s-a.s)[0];
    const strong = listings.filter(l=>matchScore(l) >= 70).length;
    if(title) title.textContent = `Lifestyle Match is live`;
    if(text) text.textContent = `${strong} home${strong===1?"":"s"} rated 70%+ for you · best fit: ${top.l.addr.split(",")[0]} at ${top.s}%.`;
    if(btn) btn.textContent = "See matched homes";
  } else if(user){
    if(title) title.textContent = `Welcome back, ${user.name.split(" ")[0]}`;
    if(text) text.textContent = `You have ${favs.size} saved home${favs.size===1?"":"s"} · take the Lifestyle Match quiz for ranked picks.`;
    if(btn) btn.textContent = "Take Lifestyle Match";
  } else {
    if(title) title.textContent = "Get home recommendations";
    if(text) text.textContent = "Sign in for a more personalized experience.";
    if(btn) btn.textContent = "Sign in";
  }
}
$("#quizSave").addEventListener("click", ()=>{
  profile = {
    budget: +$("#qBudget").value,
    beds: +$("#qBeds").textContent,
    stage: ($("[data-stage].sel") || {dataset:{stage:"any"}}).dataset.stage,
    wants: $$("#wantGrid .pick.sel").map(b=>b.dataset.want)
  };
  localStorage.setItem("un_profile", JSON.stringify(profile));
  closeQuiz();
  setFilter("all");
  render(); paintProfileSummary();
  const strong = listings.filter(l=>matchScore(l) >= 70).length;
  toast(`Matched! ${strong} home${strong===1?"":"s"} rated 70%+ for your lifestyle`);
  document.getElementById("listings").scrollIntoView({behavior:"smooth"});
});
$("#quizReset").addEventListener("click", ()=>{
  profile = null; localStorage.removeItem("un_profile");
  closeQuiz(); render(); paintProfileSummary();
  toast("Lifestyle Match cleared");
});

paintBell();
paintProfileSummary();
setTimeout(marketTick, 8000);     // first market check shortly after load
setInterval(marketTick, 25000);   // then keep watching while the tab is open

paintUser();
