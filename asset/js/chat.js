/* ============================================================
   Chat Widget — Listing Question AI (standalone)
   Loads on index.html (via app.js) and saved.html
   ============================================================ */
(function () {
  if (window.__chatInit) return;
  window.__chatInit = true;

  const listings = [
    {id:1, price:685000, beds:4, baths:3, sqft:2480, addr:"2412 Barton Hills Dr, Austin, TX", tag:"For sale", type:"sale", isNew:false, img:"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=700&q=80&auto=format&fit=crop", vibe:"suburb", pets:true, yard:3, schools:9, walk:62, garage:true, pool:false, commute:8, modern:false, view:true},
    {id:2, price:3200, beds:3, baths:2, sqft:1780, addr:"4501 Duval St, Austin, TX", tag:"For rent", type:"rent", isNew:true, img:"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=700&q=80&auto=format&fit=crop", vibe:"suburb", pets:true, yard:1, schools:6, walk:74, garage:false, pool:true, commute:6, modern:false, view:false},
    {id:3, price:529000, beds:3, baths:2, sqft:1925, addr:"1208 E 12th St, Austin, TX", tag:"New", type:"new", isNew:true, img:"https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=700&q=80&auto=format&fit=crop", vibe:"urban", pets:true, yard:1, schools:5, walk:82, garage:false, pool:false, commute:9, modern:true, view:false},
    {id:4, price:899000, beds:5, baths:4, sqft:3420, addr:"7 Enchanted Oaks, West Lake Hills, TX", tag:"For sale", type:"sale", isNew:false, img:"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=700&q=80&auto=format&fit=crop", vibe:"suburb", pets:true, yard:3, schools:10, walk:24, garage:true, pool:true, commute:5, modern:false, view:true},
    {id:5, price:2450, beds:2, baths:2, sqft:1240, addr:"900 S 1st St #210, Austin, TX", tag:"For rent", type:"rent", isNew:false, img:"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=700&q=80&auto=format&fit=crop", vibe:"urban", pets:true, yard:0, schools:5, walk:95, garage:false, pool:true, commute:9, modern:true, view:false},
    {id:6, price:775000, beds:4, baths:3, sqft:2650, addr:"3103 Cherry Creek Dr, Austin, TX", tag:"Open house", type:"sale", isNew:true, img:"https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=700&q=80&auto=format&fit=crop", vibe:"suburb", pets:true, yard:2, schools:8, walk:45, garage:true, pool:false, commute:7, modern:true, view:false}
  ];
  const fmt = n => "$" + n.toLocaleString();
  const chatData = listings.map(l => ({...l}));

  const chatFAB = document.createElement("button");
  chatFAB.className = "chat-fab";
  chatFAB.type = "button";
  chatFAB.title = "Ask about a listing";
  chatFAB.setAttribute("aria-label", "Open listing question chat");
  chatFAB.innerHTML = "💬";
  document.body.appendChild(chatFAB);

  const chatModal = document.createElement("div");
  chatModal.className = "chat-modal";
  chatModal.setAttribute("aria-hidden", "true");
  chatModal.innerHTML = '<div class="chat-head"><h3>💬 Listing Questions</h3><button class="chat-close" type="button" aria-label="Close chat">✕</button></div><div class="chat-body" id="chatBody"></div><div class="chat-input-wrap"><input type="text" id="chatInput" placeholder="Ask about a listing…" aria-label="Chat input"><button type="button" id="chatSend" aria-label="Send message">➤</button></div>';
  document.body.appendChild(chatModal);

  const chatBody = document.getElementById("chatBody");
  const chatInput = document.getElementById("chatInput");
  const chatClose = chatModal.querySelector(".chat-close");

  function openChat() {
    chatModal.classList.add("open");
    chatModal.setAttribute("aria-hidden", "false");
    if (!chatBody.children.length) {
      addBotMsg("Hi! Ask me anything about a listing — price, bedrooms, pets, commute, and more. Try a quick question below 👇");
    }
    setTimeout(() => chatInput?.focus(), 50);
  }
  function closeChat() {
    chatModal.classList.remove("open");
    chatModal.setAttribute("aria-hidden", "true");
  }
  function addBotMsg(html) {
    const d = document.createElement("div");
    d.className = "chat-msg bot";
    d.innerHTML = html;
    chatBody.appendChild(d);
    chatBody.scrollTop = chatBody.scrollHeight;
  }
  function addUserMsg(text) {
    const d = document.createElement("div");
    d.className = "chat-msg user";
    d.textContent = text;
    chatBody.appendChild(d);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function respond(question) {
    const q = question.toLowerCase().trim();
    const target = chatData.find(l => q.includes(l.addr.split(",")[0].toLowerCase().slice(0, 4)) || q.includes(l.tag.toLowerCase())) || chatData[0];
    if (/hello|hi\b|hey\b/.test(q)) {
      addBotMsg("Hey! I can answer questions about any UrbanNest listing. Try: <b>\"What's the price?\"</b>, <b>\"Does it have a pool?\"</b>, or pick a quick question below!");
      showQuickBtns(); return;
    }
    if (/\bprice\b|\bcost\b|\bhow much\b/.test(q)) {
      addBotMsg(`The listing is priced at <b>${fmt(target.price)}${target.type === "rent" ? "/mo" : ""}</b>. ${target.tag} in ${target.addr.split(",")[1]?.trim() || "Austin"}.`);
    } else if (/\bbedroom\b|\bbeds?\b|\bbd\b/.test(q)) {
      addBotMsg(`This home has <b>${target.beds} bedroom${target.beds > 1 ? "s" : ""}</b> and <b>${target.baths} bath${target.baths > 1 ? "s" : ""}</b>, with <b>${target.sqft.toLocaleString()} sqft</b>.`);
    } else if (/\bsqft\b|\bsquare feet|\bsize\b/.test(q)) {
      addBotMsg(`The size is <b>${target.sqft.toLocaleString()} sqft</b> with ${target.beds} beds and ${target.baths} baths.`);
    } else if (/\bpet\b|\bpets?\b|\banimal\b/.test(q)) {
      addBotMsg(target.pets ? "🐾 Yes, this home is <b>pet-friendly</b>!" : "Sorry, this home does <b>not</b> allow pets.");
    } else if (/\bpool\b/.test(q)) {
      addBotMsg(target.pool ? "🏊 Yes, there's a <b>pool</b>!" : "No pool here, but there's a " + (target.yard > 0 ? target.yard + " ft yard" : "no yard") + ".");
    } else if (/\bgarage\b|\bcarport\b/.test(q)) {
      addBotMsg(target.garage ? "🚗 Yes, this home has a <b>garage</b>!" : "No garage listed, check the specs for details.");
    } else if (/\byard\b|\bbackyard\b|\bgarden\b/.test(q)) {
      addBotMsg(target.yard > 0 ? `🌳 Yes! There's a <b>${target.yard} ft yard</b>.` : "No yard listed for this property.");
    } else if (/\bschool\b|\bschools?\b|\bkid\b|\bchild\b/.test(q)) {
      addBotMsg(target.schools >= 8 ? `🎓 Great schools! This area scores <b>${target.schools}/10</b> for top schools.` : `Schools in this area score <b>${target.schools}/10</b>.`);
    } else if (/\bwalk\b|\bwalkable\b|\bwalkability\b/.test(q)) {
      addBotMsg(`Walk score: <b>${target.walk}/100</b>. ${target.walk >= 70 ? "Very walkable!" : target.walk >= 40 ? "Somewhat walkable." : "Car is recommended."}`);
    } else if (/\bcommute\b|\bdrive\b|\bdrive time\b|\btraffic\b/.test(q)) {
      addBotMsg(`Commute score: <b>${target.commute}/10</b>. ${target.commute >= 7 ? "Easy commute!" : "Moderate commute."}`);
    } else if (/\bview\b|\bviews?\b/.test(q)) {
      addBotMsg(target.view ? "🌄 Yes, this home offers <b>views</b>!" : "No views listed for this property.");
    } else if (/\bmodern\b|\bnew\b|\brenovat\b/.test(q)) {
      addBotMsg(target.modern ? "✨ Yes, this home has a <b>modern</b> design!" : "Not listed as modern — may need updating.");
    } else if (/\bvibe\b|\barea\b|\bneighborhood\b/.test(q)) {
      addBotMsg(`This property is in a <b>${target.vibe}</b> neighborhood.`);
    } else if (/\baddress\b|\blocation\b|\bwhere\b/.test(q)) {
      addBotMsg(`This listing is at <b>${target.addr}</b>.`);
    } else {
      const feats = [];
      if (target.pets) feats.push("🐾 pets allowed");
      if (target.pool) feats.push("🏊 pool");
      if (target.garage) feats.push("🚗 garage");
      if (target.yard > 0) feats.push("🌳 " + target.yard + "ft yard");
      if (target.view) feats.push("🌄 views");
      if (target.modern) feats.push("✨ modern");
      addBotMsg(`About <b>${target.addr}</b>: ${target.beds} bd · ${target.baths} ba · ${target.sqft.toLocaleString()} sqft · ${fmt(target.price)}${target.type === "rent" ? "/mo" : ""}. Features: ${feats.length ? feats.join(", ") : "standard amenities"}. Try a more specific question!`);
    }
    showQuickBtns();
  }

  let quickShown = false;
  function showQuickBtns() {
    const existing = chatBody.querySelector(".chat-quick");
    if (existing) existing.remove();
    const qs = ["What's the price?", "Pets allowed?", "Any pool?", "Commute score?"];
    const wrap = document.createElement("div");
    wrap.className = "chat-quick";
    qs.forEach(s => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = s;
      b.addEventListener("click", () => { chatInput.value = s; handleChat(); });
      wrap.appendChild(b);
    });
    chatBody.appendChild(wrap);
    chatBody.scrollTop = chatBody.scrollHeight;
    quickShown = true;
  }

  function handleChat() {
    const text = chatInput.value.trim();
    if (!text) return;
    addUserMsg(text);
    chatInput.value = "";
    setTimeout(() => respond(text), 400);
  }

  chatFAB.addEventListener("click", () => {
    if (chatModal.classList.contains("open")) closeChat();
    else openChat();
  });
  chatClose.addEventListener("click", closeChat);
  chatModal.addEventListener("click", e => { if (e.target === chatModal) closeChat(); });
  chatInput.addEventListener("keydown", e => { if (e.key === "Enter") handleChat(); });
  const sendBtn = document.getElementById("chatSend");
  if (sendBtn) sendBtn.addEventListener("click", handleChat);
})();
