import {} from "./z-getDocs.js";
import { syncNow } from "./y-gameLogic.js";
import { logActivity } from "./y-activityLog.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBO6a6nJKh_edhLswQEIk07gnQI46UBrCQ",
  authDomain: "leveling-nexus-bdee1.firebaseapp.com",
  projectId: "leveling-nexus-bdee1",
  storageBucket: "leveling-nexus-bdee1.appspot.com",
  messagingSenderId: "360029039248",
  appId: "1:360029039248:web:99b73cb4e8a5e6fc08c615",
  measurementId: "G-4TFCZV1RWX",
  databaseURL: "https://leveling-nexus-bdee1-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

const app       = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth      = getAuth(app);

// ===============================
// INJECTED STYLES
// ===============================
const style = document.createElement("style");
style.textContent = `
/* ── shared quest row ── */
.quest-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(65,182,255,0.12);
  background: rgba(65,182,255,0.04);
  margin-bottom: 6px;
  transition: border-color 0.2s, background 0.2s;
}
.quest-row:hover {
  border-color: rgba(65,182,255,0.25);
  background: rgba(65,182,255,0.07);
}

.quest-row-left  { flex: 1; min-width: 0; }
.quest-row-right { flex-shrink: 0; }

.quest-title {
  font-family: "Orbitron", system-ui;
  font-size: 11px; font-weight: 700;
  color: #d9eefc;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.quest-category {
  font-family: "Orbitron", system-ui;
  font-size: 9px; letter-spacing: 0.5px;
  margin-top: 3px;
}
.quest-category.strength     { color: #ff8080; }
.quest-category.intelligence { color: #41b6ff; }
.quest-category.urgent-cat   { color: #ffb800; }
.quest-category.stamina      { color: #41ff88; }
.quest-category.health       { color: #41ff88; }
.quest-category.multi        { color: #41ff88; }

.quest-exp {
  font-family: "Orbitron", system-ui;
  font-size: 9px; color: rgba(65,182,255,0.5);
  margin-top: 1px; letter-spacing: 0px;
}

/* Complete / action buttons */
.quest-complete-btn {
  padding: 5px 12px;
  font-family: "Orbitron", system-ui;
  font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
  color: #021726;
  background: linear-gradient(180deg, var(--neon), var(--neon-2));
  border: none; border-radius: 7px; cursor: pointer;
  box-shadow: 0 0 8px rgba(65,182,255,0.5);
  transition: all 0.2s ease;
}
.quest-complete-btn:hover    { transform: translateY(-1px); box-shadow: 0 0 12px rgba(65,182,255,0.8); }
.quest-complete-btn:active   { transform: translateY(0); }
.quest-complete-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

/* Checkmark */
.quest-checkmark {
  font-family: "Orbitron", system-ui;
  font-size: 14px; font-weight: 700;
  color: var(--neon);
  text-shadow: 0 0 8px rgba(65,182,255,0.6);
}

/* Section divider */
.quest-section-divider {
  display: flex; align-items: center; gap: 8px;
  margin: 10px 0 6px;
  font-family: "Orbitron", system-ui;
  font-size: 9px; font-weight: 700; letter-spacing: 1.5px;
  color: rgba(65,182,255,0.4); text-transform: uppercase;
}

/* ── active quest row extras ── */
.quest-time-tag {
  font-family: "Orbitron", system-ui;
  font-size: 9px; color: rgba(65,182,255,0.5);
  margin-top: 1px; letter-spacing: 0px;
}
.quest-days-tag {
  font-family: "Orbitron", system-ui;
  font-size: 9px; color: rgba(65,182,255,0.35);
  margin-top: 1px; letter-spacing: 0px;
}

/* ── urgent quest row extras ── */
.quest-deadline-tag {
  font-family: "Orbitron", system-ui;
  font-size: 9px; margin-top: 3px; letter-spacing: 0.3px;
}
.quest-deadline-tag.safe     { color: rgba(65,182,255,0.5); }
.quest-deadline-tag.warning  { color: #ffb800; }
.quest-deadline-tag.critical { color: #ff6b6b; }

.quest-status-badge {
  font-family: "Orbitron", system-ui;
  font-size: 9px; font-weight: 700; letter-spacing: 0.5px;
  padding: 3px 8px; border-radius: 6px; white-space: nowrap;
}
.quest-status-badge.pending   { background: rgba(65,182,255,0.1);  border: 1px solid rgba(65,182,255,0.3);  color: rgba(65,182,255,0.7); }
.quest-status-badge.active    { background: rgba(65,255,130,0.1);  border: 1px solid rgba(65,255,130,0.4);  color: #41ff88; }
.quest-status-badge.completed { background: rgba(65,182,255,0.08); border: 1px solid rgba(65,182,255,0.2);  color: rgba(65,182,255,0.4); }
.quest-status-badge.failed    { background: rgba(255,80,80,0.1);   border: 1px solid rgba(255,80,80,0.3);   color: #ff6b6b; }

/* Empty state */
.quest-empty {
  font-family: "Orbitron", system-ui;
  font-size: 11px; color: rgba(217,238,252,0.2);
  text-align: center; padding: 18px 0; letter-spacing: 0.5px;
}

/* ═══════════════════════════════════════
   IN-PROGRESS CARD — Active Quest runner
   ═══════════════════════════════════════ */

.ip-row {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(65,182,255,0.18);
  background: rgba(65,182,255,0.04);
  margin-bottom: 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  transition: border-color 0.2s;
}
.ip-row:hover { border-color: rgba(65,182,255,0.3); }

.ip-row-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ip-title {
  font-family: "Orbitron", system-ui;
  font-size: 11px; font-weight: 700;
  color: #d9eefc;
  flex: 1; min-width: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.ip-category {
  font-family: "Orbitron", system-ui;
  font-size: 9px; letter-spacing: 0.5px; flex-shrink: 0;
  color: rgba(65,182,255,0.6);
}
.ip-category.strength     { color: #ff8080; }
.ip-category.intelligence { color: #41b6ff; }
.ip-category.stamina      { color: #41ff88; }
.ip-category.health       { color: #41ff88; }
.ip-category.multi        { color: #41ff88; }

.ip-time {
  font-family: "Orbitron", system-ui;
  font-size: 9px; color: rgba(65,182,255,0.5);
  letter-spacing: 0px;
}

/* Timer bar */
.ip-bar-wrap {
  width: 100%;
  height: 4px;
  border-radius: 4px;
  background: rgba(65,182,255,0.08);
  overflow: hidden;
}
.ip-bar-fill {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--neon), var(--neon-2));
  box-shadow: 0 0 6px rgba(65,182,255,0.5);
  transition: width 1s linear;
}
.ip-bar-fill.expiring {
  background: linear-gradient(90deg, #ffb800, #ff6b6b);
  box-shadow: 0 0 6px rgba(255,100,0,0.5);
}

/* Countdown label */
.ip-countdown {
  font-family: "Orbitron", system-ui;
  font-size: 9px; color: rgba(65,182,255,0.6);
  letter-spacing: 0px;
}
.ip-countdown.expiring { color: #ffb800; }
.ip-countdown.critical { color: #ff6b6b; }

/* XP preview label */
.ip-xp {
  font-family: "Orbitron", system-ui;
  font-size: 9px; color: rgba(65,182,255,0.4);
  letter-spacing: 0px;
}

/* Action buttons row */
.ip-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.ip-btn {
  padding: 5px 14px;
  font-family: "Orbitron", system-ui;
  font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
  border: none; border-radius: 7px; cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1;
}
.ip-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none !important; }

/* Accept — neon blue */
.ip-btn.accept {
  color: #021726;
  background: linear-gradient(180deg, var(--neon), var(--neon-2));
  box-shadow: 0 0 8px rgba(65,182,255,0.5);
}
.ip-btn.accept:hover { transform: translateY(-1px); box-shadow: 0 0 14px rgba(65,182,255,0.8); }

/* Reject — red outline */
.ip-btn.reject {
  color: #ff6b6b;
  background: rgba(255,80,80,0.08);
  border: 1px solid rgba(255,80,80,0.35);
}
.ip-btn.reject:hover { background: rgba(255,80,80,0.18); border-color: rgba(255,80,80,0.6); transform: translateY(-1px); }

/* Complete — amber/gold */
.ip-btn.complete {
  color: #021726;
  background: linear-gradient(180deg, #ffb800, #ff8c00);
  box-shadow: 0 0 8px rgba(255,180,0,0.5);
}
.ip-btn.complete:hover { transform: translateY(-1px); box-shadow: 0 0 14px rgba(255,180,0,0.8); }

/* Penalty / result flash */
.ip-result {
  font-family: "Orbitron", system-ui;
  font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
  text-align: center; padding: 4px 0;
}
.ip-result.gain { color: #41ff88; text-shadow: 0 0 8px rgba(65,255,130,0.5); }
.ip-result.loss { color: #ff6b6b; text-shadow: 0 0 8px rgba(255,80,80,0.5); }
`;
document.head.appendChild(style);

// ===============================
// CONSTANTS
// ===============================
const DAILY_QUESTS = [
  {
    category: "Strength",
    tasks: ["20 Push Ups","20 Sit Ups","10 Squats","30 Jumping Jacks"]
  },
  {
    category: "Intelligence",
    tasks: ["Read 5 Pages of a Book"]
  }
];

// ===============================
// SYNC LOCK
// ===============================
let isSyncingGameData = false;

// ===============================
// XP / LEVEL HELPERS
// ===============================
/**
 * Apply XP gain or loss, handling both level-up AND level-down.
 */
function applyXPAndLevelUp(player, expGain) {
  let level = player.level ?? 1;
  let xp    = player.xp   ?? 0;
  xp += expGain;

  // ── Level UP ──
  let req = level * 1000;
  while (xp >= req) {
    xp   -= req;
    level += 1;
    req   = level * 1000;
  }

  // ── Level DOWN ──
  while (xp < 0 && level > 1) {
    level -= 1;
    xp    += level * 1000;
  }
  if (xp < 0) xp = 0;

  return { newLevel: level, newXP: xp };
}

function minsToTime(tot) {
  const h=Math.floor(tot/60), m=tot%60, ap=h>=12?"PM":"AM", h12=h%12||12;
  return `${h12}:${String(m).padStart(2,"0")} ${ap}`;
}

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));
  const day = d.getUTCDay()||7; d.setUTCDate(d.getUTCDate()+4-day);
  const y0 = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return `${d.getUTCFullYear()}-W${String(Math.ceil(((d-y0)/86400000+1)/7)).padStart(2,"0")}`;
}

function daysUntil(ts) { return Math.max(0, Math.ceil((ts - Date.now()) / 86400000)); }
function daysElapsed(createdAtMs) { return Math.floor((Date.now() - createdAtMs) / 86400000); }

function calcUrgentXP(player, createdAtMs) {
  const level   = player.level ?? 1;
  const elapsed = daysElapsed(createdAtMs);
  const decay   = Math.max(0, elapsed - 2) * 500 * level;
  return Math.max(0, 3000 * level - decay);
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function getTodayAbbr() {
  return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()];
}

function getTodaySchedule(quest) {
  const now    = new Date();
  const base   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMs = base.getTime() + quest.startMin * 60_000;
  const endMs   = base.getTime() + quest.endMin   * 60_000;
  return { startMs, endMs };
}

function getQuestPhase(quest) {
  const today = getTodayAbbr();
  if (!(quest.days || []).includes(today)) return "not-today";

  const { startMs, endMs } = getTodaySchedule(quest);
  const now   = Date.now();
  const grace = endMs + 30 * 60_000;

  if (now < startMs - 30 * 60_000)  return "too-early";
  if (now < startMs)                 return "accept-window";
  if (now < endMs - 30 * 60_000)    return "late-accept";
  if (now < endMs)                   return "final-window";
  if (now < grace)                   return "grace";
  return "expired";
}

function calcLateAcceptPenalty(quest, player) {
  const { startMs } = getTodaySchedule(quest);
  const level       = player.level ?? 1;
  const lateMs      = Math.max(0, Date.now() - startMs);
  const intervals   = Math.floor(lateMs / (30 * 60_000));
  if (intervals === 0) return 0;
  return (200 + Math.max(0, intervals - 1) * 100) * level;
}

function calcActiveXP(quest, player) {
  const level = player.level ?? 1;
  const slots = quest.slots || (quest.endMin - quest.startMin) / 30;
  return slots * 100 * level;
}

// ===============================
// CATEGORY HELPERS
// Centralised so every render spot
// handles both string and array categories
// identically.
// ===============================

/**
 * Returns the CSS class to use for a category.
 * For arrays with multiple entries, returns "multi" → green.
 * For a single string, returns the lowercased value.
 */
function getCatClass(category) {
  if (Array.isArray(category)) {
    return category.length > 1 ? "multi" : (category[0] || "").toLowerCase();
  }
  return (category || "").toLowerCase();
}

/**
 * Returns the display string for a category.
 * Arrays are joined as "Health + Stamina" style.
 */
function getCatDisplay(category) {
  if (Array.isArray(category)) return category.join(" + ");
  return category || "—";
}

// ===============================
// SHARED UI HELPERS
// ===============================
function createCheckmark() {
  const m = document.createElement("div");
  m.className  = "quest-checkmark";
  m.textContent = "✓";
  return m;
}

function createDivider(label) {
  const d = document.createElement("div");
  d.className = "quest-section-divider";
  d.innerHTML = `
    <div style="flex:1;height:1px;background:rgba(65,182,255,0.12);"></div>
    <span>${label}</span>
    <div style="flex:1;height:1px;background:rgba(65,182,255,0.12);"></div>
  `;
  return d;
}

function setListScrollable(el) {
  el.style.maxHeight = "260px";
  el.style.overflowY = "auto";
}

function fmtMs(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2,"0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2,"0")}s`;
  return `${s}s`;
}

// ===============================
// DAILY QUEST ROW
// ===============================
function _dailyKey(task, category) {
  return `${category}::${task}`.replace(/\s+/g, "_").toLowerCase();
}

function createDailyQuestRow(task, category, player, userId, completedTodaySet) {
  const row = document.createElement("div");
  row.className = "quest-row";

  const catClass  = getCatClass(category);
  const catDisplay = getCatDisplay(category);
  const taskKey   = _dailyKey(task, Array.isArray(category) ? category.join("+") : category);
  const isDone    = completedTodaySet.has(taskKey);

  row.innerHTML = `
    <div class="quest-row-left">
      <div class="quest-title">${task}</div>
      <div class="quest-category ${catClass}">${catDisplay}</div>
      <div class="quest-exp">Exp Gain: ${(player.level??1)*50}</div>
    </div>
    <div class="quest-row-right">
      ${isDone ? '<div class="quest-checkmark">✓</div>' : '<button class="quest-complete-btn">Complete</button>'}
    </div>
  `;

  if (isDone) return row;

  const btn = row.querySelector(".quest-complete-btn");

  btn.addEventListener("click", async () => {
    if (isSyncingGameData) return;
    isSyncingGameData = true;
    btn.disabled = true;
    btn.replaceWith(createCheckmark());

    try {
      const expGain = (player.level ?? 1) * 50;
      const { newLevel, newXP } = applyXPAndLevelUp(player, expGain);
      const todayKey = getTodayKey();

      const updates = {
        "player.xp":    newXP,
        "player.level": newLevel,
        updatedAt:      Date.now()
      };

      if (category === "Strength") {
        const cur = player.stats?.strength ?? 1;
        updates["player.stats.strength"] = cur + 1;
        if (!player.stats) player.stats = {};
        player.stats.strength = cur + 1;
      }
      if (category === "Intelligence") {
        const cur = player.stats?.intelligence ?? 1;
        updates["player.stats.intelligence"] = cur + 1;
        if (!player.stats) player.stats = {};
        player.stats.intelligence = cur + 1;
      }

      const gameRef = doc(firestore, "gameData", userId);
      const snap    = await getDoc(gameRef);
      if (snap.exists()) {
        const stored    = snap.data().quests?.dailyCompleted || {};
        const todayList = stored[todayKey] || [];
        if (!todayList.includes(taskKey)) todayList.push(taskKey);
        updates[`quests.dailyCompleted.${todayKey}`] = todayList;
        completedTodaySet.add(taskKey);
      }

      await updateDoc(doc(firestore, "gameData", userId), updates);
      player.xp    = newXP;
      player.level = newLevel;
      await _markPlayerActive(userId);
      syncNow();
      logActivity(userId, "gain", `Daily: ${task}`, expGain);
    } finally {
      isSyncingGameData = false;
    }
  });

  return row;
}

// ===============================
// RENDER: DAILY QUESTS  (card 2)
// ===============================
function renderDailyQuests(player, userId, savedQuests = [], completedTodaySet = new Set()) {
  const card = document.querySelector(".card:nth-child(2) .quest-list");
  if (!card) return;

  card.innerHTML = "";
  setListScrollable(card);

  DAILY_QUESTS.forEach(quest => {
    quest.tasks.forEach(task => {
      card.appendChild(createDailyQuestRow(task, quest.category, player, userId, completedTodaySet));
    });
  });

  if (savedQuests.length > 0) {
    card.appendChild(createDivider("Custom Quests"));
    savedQuests.forEach(q => {
      card.appendChild(createDailyQuestRow(q.text, q.category, player, userId, completedTodaySet));
    });
  }
}

// ===============================
// ACTIVE QUEST ROW  (card 1 — schedule display)
// ===============================
function createActiveQuestRow(quest) {
  const row = document.createElement("div");
  row.className = "quest-row";

  // category can be a string or an array — normalise for display
  const catClass   = getCatClass(quest.category);
  const catDisplay = getCatDisplay(quest.category);

  const startStr  = minsToTime(quest.startMin);
  const endStr    = minsToTime(quest.endMin);
  const daysStr   = (quest.days || []).join(", ");
  const slots     = quest.slots || (quest.endMin - quest.startMin) / 30;
  const statusCls = quest.status || "pending";

  row.innerHTML = `
    <div class="quest-row-left">
      <div class="quest-title">${quest.title}</div>
      <div class="quest-category ${catClass}">${catDisplay}</div>
      <div class="quest-time-tag">${startStr} – ${endStr}</div>
      <div class="quest-days-tag">${daysStr}</div>
      <div class="quest-exp">${slots * 100} × lvl XP per run</div>
    </div>
    <div class="quest-row-right">
      <span class="quest-status-badge ${statusCls}">${statusCls.toUpperCase()}</span>
    </div>
  `;

  return row;
}

// ===============================
// RENDER: ACTIVE QUESTS  (card 1)
// ===============================
function renderActiveQuests(activeQuests = []) {
  const card = document.querySelector(".card:nth-child(1) .quest-list");
  if (!card) return;

  card.innerHTML = "";
  setListScrollable(card);

  if (activeQuests.length === 0) {
    card.innerHTML = `<div class="quest-empty">No Quest Available</div>`;
    return;
  }

  activeQuests.forEach(q => card.appendChild(createActiveQuestRow(q)));
}

// ===============================
// URGENT QUEST ROW  (with Complete button)
// ===============================
function createUrgentQuestRow(quest, player, userId, urgentWeek, currentWeek, weekXpEarned = 0) {
  const row = document.createElement("div");
  row.className = "quest-row";

  const dl         = daysUntil(quest.deadlineTs);
  const dlClass    = dl <= 1 ? "critical" : dl <= 3 ? "warning" : "safe";
  const dlText     = dl === 0 ? "⚠ Due today" : `${dl} day${dl !== 1 ? "s" : ""} left`;
  const statusCls  = quest.status || "pending";
  const level      = player.level ?? 1;
  const weekXpCap  = 9000 * level;
  const capReached = weekXpEarned >= weekXpCap;
  const rawXP      = calcUrgentXP(player, quest.createdAt);
  const effectiveXP = Math.max(0, Math.min(rawXP, weekXpCap - weekXpEarned));

  const xpDisplay = capReached
    ? `XP: 0 (weekly cap reached)`
    : `XP: ${effectiveXP.toLocaleString()} (max ${(3000*level).toLocaleString()} × lvl)`;

  row.innerHTML = `
    <div class="quest-row-left">
      <div class="quest-title">${quest.title}</div>
      <div class="quest-category urgent-cat">Urgent</div>
      <div class="quest-deadline-tag ${dlClass}">${dlText}</div>
      <div class="quest-exp">${xpDisplay}</div>
    </div>
    <div class="quest-row-right">
      <button class="quest-complete-btn"${capReached ? ' title="Weekly XP cap reached"' : ""}>Complete</button>
    </div>
  `;

  const btn = row.querySelector(".quest-complete-btn");

  if (statusCls === "completed" || statusCls === "failed") {
    btn.replaceWith(createCheckmark());
    return row;
  }

  btn.addEventListener("click", async () => {
    if (isSyncingGameData) return;
    isSyncingGameData = true;
    btn.disabled = true;

    try {
      const gameRef      = doc(firestore, "gameData", userId);
      const snap         = await getDoc(gameRef);
      if (!snap.exists()) return;

      const data         = snap.data();
      const freshPlayer  = data.player || {};
      const level        = freshPlayer.level ?? 1;

      const weekXpKey      = `urgentXpWeek_${currentWeek}`;
      const weekXpEarned   = data[weekXpKey] ?? 0;
      const weekXpCap      = 9000 * level;
      const rawXP          = calcUrgentXP(freshPlayer, quest.createdAt);
      const finalXP        = Math.max(0, Math.min(rawXP, weekXpCap - weekXpEarned));

      const { newLevel, newXP } = applyXPAndLevelUp(freshPlayer, finalXP);

      const curStr  = freshPlayer.stats?.strength     ?? 1;
      const curInt  = freshPlayer.stats?.intelligence ?? 1;
      const uWeek   = data.quests?.urgentWeek || { week: currentWeek, quests: [] };
      const qIdx    = (uWeek.quests || []).findIndex(q => q.id === quest.id);
      if (qIdx !== -1) uWeek.quests.splice(qIdx, 1);

      const weekStatKey    = `statPointsWeek_${currentWeek}`;
      const currentWeekPts = data[weekStatKey] ?? 0;
      const canGainStat    = currentWeekPts < 3 && !capReached;

      const updates = {
        "player.xp":         newXP,
        "player.level":      newLevel,
        "quests.urgentWeek": uWeek,
        [weekXpKey]:         weekXpEarned + finalXP,
        updatedAt:           Date.now()
      };
      if (canGainStat) {
        updates["player.stats.strength"]     = curStr + 1;
        updates["player.stats.intelligence"] = curInt + 1;
        updates[weekStatKey]                 = currentWeekPts + 1;
      }

      await updateDoc(gameRef, updates);
      freshPlayer.xp    = newXP;
      freshPlayer.level = newLevel;
      await _markPlayerActive(userId);
      syncNow();
      logActivity(userId, finalXP > 0 ? "gain" : "info", `Urgent: ${quest.title}`, finalXP);
      row.remove();
    } catch (err) {
      console.error("[urgentComplete]", err);
      btn.disabled = false;
    } finally {
      isSyncingGameData = false;
    }
  });

  return row;
}

async function _checkUrgentExpiry(urgentWeek, currentWeek, userId) {
  const quests = urgentWeek?.week === currentWeek
    ? (urgentWeek.quests || [])
    : [];

  const toFail = quests.filter(q =>
    q.status === "pending" &&
    q.deadlineTs < Date.now() &&
    !q.failedPenaltyApplied
  );

  if (toFail.length === 0) return;

  try {
    const gameRef = doc(firestore, "gameData", userId);
    const snap    = await getDoc(gameRef);
    if (!snap.exists()) return;

    const data        = snap.data();
    if (data.player?.inactive === true) return;

    const freshPlayer = data.player || {};
    const level       = freshPlayer.level ?? 1;
    const uWeek       = data.quests?.urgentWeek || { week: currentWeek, quests: [] };

    let   runningPlayer = { ...freshPlayer };
    const totalPenalty  = toFail.length * 5000 * level;

    const { newLevel, newXP } = applyXPAndLevelUp(runningPlayer, -totalPenalty);

    toFail.forEach(failed => {
      const idx = (uWeek.quests || []).findIndex(q => q.id === failed.id);
      if (idx !== -1) {
        uWeek.quests[idx].status               = "failed";
        uWeek.quests[idx].failedPenaltyApplied = true;
      }
    });

    await updateDoc(gameRef, {
      "player.xp":         newXP,
      "player.level":      newLevel,
      "quests.urgentWeek": uWeek,
      updatedAt:           Date.now()
    });

    console.log(`[urgentExpiry] Applied −${totalPenalty} XP for ${toFail.length} failed urgent quest(s)`);
    toFail.forEach(q => {
      logActivity(userId, "loss", `Urgent failed: ${q.title}`, -5000 * level);
    });

  } catch (err) {
    console.error("[urgentExpiry] _checkUrgentExpiry failed:", err);
  }
}

// ===============================
// RENDER: URGENT QUESTS  (card 3)
// ===============================
function renderUrgentQuests(urgentWeek, currentWeek, player, userId, weekXpEarned = 0) {
  _checkUrgentExpiry(urgentWeek, currentWeek, userId);

  const card = document.querySelector(".card:nth-child(3) .quest-list");
  if (!card) return;

  card.innerHTML = "";
  setListScrollable(card);

  const quests = urgentWeek?.week === currentWeek
    ? (urgentWeek.quests || [])
    : [];

  if (quests.length === 0) {
    card.innerHTML = `<div class="quest-empty">No Quest Available</div>`;
    return;
  }

  quests.forEach(q => card.appendChild(
    createUrgentQuestRow(q, player, userId, urgentWeek, currentWeek, weekXpEarned)
  ));
}

// ═══════════════════════════════════════════════════════
// IN-PROGRESS TAB — Active Quest runner
// ═══════════════════════════════════════════════════════

const _ipTimers = new Map();

function renderInProgress(activeQuests, player, userId) {
  const container = document.querySelector(".in-progress .quest-list");
  if (!container) return;

  if (!container.dataset.loaded) {
    container.innerHTML = `<div class="quest-empty" style="color:rgba(65,182,255,0.4);">Loading...</div>`;
  }

  _ipTimers.forEach(({ timerInterval }) => clearInterval(timerInterval));
  _ipTimers.clear();

  container.innerHTML = "";
  container.dataset.loaded = "true";
  setListScrollable(container);

  const todayKey = getTodayKey();
  const relevant = activeQuests.filter(q => {
    const phase = getQuestPhase(q);
    if (phase === "not-today" || phase === "too-early" || phase === "expired") return false;
    if (q.rejectedToday === true && q.rejectedDateKey === todayKey) return false;
    if (q.completedToday === true && q.completedDateKey === todayKey) return false;
    if (q.expiredPenaltyDate === todayKey) return false;
    return true;
  });

  if (relevant.length === 0) {
    container.innerHTML = `<div class="quest-empty">No Quest Available</div>`;
    return;
  }

  relevant.forEach(quest => {
    const row = buildInProgressRow(quest, player, userId);
    container.appendChild(row);
  });
}

function buildInProgressRow(quest, player, userId) {
  const phase              = getQuestPhase(quest);
  const { startMs, endMs } = getTodaySchedule(quest);
  const graceMs            = endMs + 30 * 60_000;

  // category can be a string or an array — normalise for display
  const catClass   = getCatClass(quest.category);
  const catDisplay = getCatDisplay(quest.category);

  const baseXP    = calcActiveXP(quest, player);
  const todayKey  = getTodayKey();
  const getIsAccepted = () =>
    quest.acceptedToday === true && quest.acceptedDateKey === todayKey;

  const row = document.createElement("div");
  row.className = "ip-row";
  row.dataset.questId = quest.id;

  // ── Header ──
  const header = document.createElement("div");
  header.className = "ip-row-header";
  header.innerHTML = `<div class="ip-title">${quest.title}</div>`;
  row.appendChild(header);

  // ── Category + Time ──
  const metaRow = document.createElement("div");
  metaRow.style.cssText = "display:flex;align-items:center;gap:8px;";
  metaRow.innerHTML = `
    <span class="ip-category ${catClass}">${catDisplay}</span>
    <span class="ip-time" style="margin:0;">${minsToTime(quest.startMin)} – ${minsToTime(quest.endMin)}</span>
  `;
  row.appendChild(metaRow);

  // ── Timer bar ──
  const barWrap = document.createElement("div");
  barWrap.className = "ip-bar-wrap";
  const barFill = document.createElement("div");
  barFill.className = "ip-bar-fill";
  barWrap.appendChild(barFill);
  row.appendChild(barWrap);

  // ── Countdown label ──
  const countdown = document.createElement("div");
  countdown.className = "ip-countdown";
  row.appendChild(countdown);

  // ── XP preview ──
  const xpLabel = document.createElement("div");
  xpLabel.className = "ip-xp";
  xpLabel.textContent = `XP: ${baseXP.toLocaleString()}`;
  row.appendChild(xpLabel);

  // ── Action buttons ──
  const actions = document.createElement("div");
  actions.className = "ip-actions";
  row.appendChild(actions);

  function tick() {
    const now          = Date.now();
    const currentPhase = getQuestPhase(quest);

    if (currentPhase === "expired") {
      clearInterval(timerHandle);
      _ipTimers.delete(quest.id);
      row.remove();
      _applyExpiredPenalty(quest, player, userId);
      return;
    }

    let barPct   = 0;
    let cdText   = "";
    let cdClass  = "ip-countdown";
    let expiring = false;

    if (currentPhase === "accept-window") {
      const windowStart = startMs - 30 * 60_000;
      const elapsed     = now - windowStart;
      barPct = Math.min(100, (elapsed / (30 * 60_000)) * 100);
      cdText = `Accept by: ${fmtMs(startMs - now)}`;

    } else if (currentPhase === "late-accept" || currentPhase === "final-window") {
      const totalDur = endMs - startMs;
      const elapsed  = now - startMs;
      barPct = Math.max(0, 100 - (elapsed / totalDur) * 100);

      const remaining = endMs - now;
      expiring = remaining < 10 * 60_000;
      cdText   = `Ends in: ${fmtMs(remaining)}`;
      cdClass  = expiring ? "ip-countdown expiring" : "ip-countdown";

      if (!getIsAccepted()) {
        const penalty = calcLateAcceptPenalty(quest, player);
        xpLabel.textContent = penalty > 0
          ? `XP: ${(baseXP - penalty).toLocaleString()} (−${penalty.toLocaleString()} late)`
          : `XP: ${baseXP.toLocaleString()}`;
      }

    } else if (currentPhase === "grace") {
      const elapsed = now - endMs;
      barPct = Math.min(100, (elapsed / (30 * 60_000)) * 100);
      barFill.classList.add("expiring");
      cdText  = `⚠ Grace: ${fmtMs(graceMs - now)}`;
      cdClass = "ip-countdown critical";
    }

    barFill.style.width = `${barPct}%`;
    if (expiring) barFill.classList.add("expiring");
    countdown.className   = cdClass;
    countdown.textContent = cdText;

    _refreshButtons(actions, quest, player, userId, currentPhase, getIsAccepted(), baseXP, row);
  }

  let timerHandle;
  tick();
  timerHandle = setInterval(tick, 1000);
  _ipTimers.set(quest.id, { timerInterval: timerHandle, rowEl: row });

  return row;
}

function _refreshButtons(actions, quest, player, userId, phase, isAccepted, baseXP, row) {
  const existingPhase = actions.dataset.phase;
  const newPhaseKey   = `${phase}-${isAccepted}`;
  if (existingPhase === newPhaseKey) return;
  actions.dataset.phase = newPhaseKey;

  actions.innerHTML = "";

  if (phase === "accept-window" && !isAccepted) {
    const acceptBtn = _makeBtn("ACCEPT", "ip-btn accept");
    const rejectBtn = _makeBtn("REJECT", "ip-btn reject");
    acceptBtn.onclick = () => _handleAccept(quest, player, userId, actions, row, false);
    rejectBtn.onclick = () => _handleReject(quest, player, userId, row, "on-time");
    actions.appendChild(acceptBtn);
    actions.appendChild(rejectBtn);

  } else if (phase === "accept-window" && isAccepted) {
    const check = document.createElement("div");
    check.className   = "quest-checkmark";
    check.textContent = "✓";
    actions.appendChild(check);

  } else if (phase === "late-accept" && !isAccepted) {
    const penalty   = calcLateAcceptPenalty(quest, player);
    const acceptBtn = _makeBtn(`ACCEPT LATE (−${penalty.toLocaleString()} XP)`, "ip-btn accept");
    const rejectBtn = _makeBtn(`REJECT (−${penalty.toLocaleString()} XP)`, "ip-btn reject");
    acceptBtn.onclick = () => _handleAccept(quest, player, userId, actions, row, true);
    rejectBtn.onclick = () => _handleReject(quest, player, userId, row, "late");
    actions.appendChild(acceptBtn);
    actions.appendChild(rejectBtn);

  } else if (phase === "late-accept" && isAccepted) {
    const badge = document.createElement("span");
    badge.className  = "quest-status-badge active";
    badge.textContent = "IN PROGRESS";
    actions.appendChild(badge);

  } else if ((phase === "final-window" || phase === "grace") && isAccepted) {
    const completeBtn = _makeBtn("COMPLETE", "ip-btn complete");
    completeBtn.onclick = () => _handleComplete(quest, player, userId, row);
    actions.appendChild(completeBtn);

  } else if ((phase === "final-window" || phase === "grace") && !isAccepted) {
    const badge = document.createElement("span");
    badge.className  = "quest-status-badge failed";
    badge.textContent = "MISSED";
    actions.appendChild(badge);
  }
}

function _makeBtn(label, className) {
  const btn = document.createElement("button");
  btn.className  = className;
  btn.textContent = label;
  return btn;
}

// ─────────────────────────────────────
// ACTION HANDLERS
// ─────────────────────────────────────

async function _handleAccept(quest, player, userId, actionsEl, row, isLate) {
  actionsEl.dataset.phase = "";
  actionsEl.innerHTML = "";
  const check = document.createElement("div");
  check.className  = "quest-checkmark";
  check.textContent = "✓";
  actionsEl.appendChild(check);

  const gameRef = doc(firestore, "gameData", userId);
  const snap    = await getDoc(gameRef);
  if (!snap.exists()) return;

  const data        = snap.data();
  const freshPlayer = data.player || {};
  const activeList  = data.quests?.active || [];
  const qIdx        = activeList.findIndex(q => q.id === quest.id);

  const todayKey = getTodayKey();
  if (qIdx !== -1) {
    activeList[qIdx].acceptedToday   = true;
    activeList[qIdx].acceptedDateKey = todayKey;
  }
  quest.acceptedToday   = true;
  quest.acceptedDateKey = todayKey;

  const updates = { "quests.active": activeList, updatedAt: Date.now() };

  if (isLate) {
    const penalty = calcLateAcceptPenalty(quest, freshPlayer);
    if (penalty > 0) {
      const { newLevel, newXP } = applyXPAndLevelUp(freshPlayer, -penalty);
      updates["player.xp"]    = newXP;
      updates["player.level"] = newLevel;
      freshPlayer.xp    = newXP;
      freshPlayer.level = newLevel;
      _showResult(row, `−${penalty.toLocaleString()} XP (late)`, "loss");
      logActivity(userId, "loss", `Late accept: ${quest.title}`, -penalty);
    }
  } else {
    _showResult(row, "Quest accepted!", "gain");
  }

  await updateDoc(gameRef, updates);
  await _markPlayerActive(userId);
}

async function _handleReject(quest, player, userId, row, timing) {
  clearInterval(_ipTimers.get(quest.id)?.timerInterval);
  _ipTimers.delete(quest.id);

  const gameRef = doc(firestore, "gameData", userId);
  const snap    = await getDoc(gameRef);
  if (!snap.exists()) { row.remove(); return; }

  const data        = snap.data();
  const freshPlayer = data.player || {};
  const activeList  = data.quests?.active || [];
  const qIdx        = activeList.findIndex(q => q.id === quest.id);

  const todayKeyR = getTodayKey();
  if (qIdx !== -1) {
    activeList[qIdx].rejectedToday   = true;
    activeList[qIdx].rejectedDateKey = todayKeyR;
  }

  const updates = { "quests.active": activeList, updatedAt: Date.now() };

  if (timing === "late") {
    const penalty = calcLateAcceptPenalty(quest, freshPlayer);
    if (penalty > 0) {
      const { newLevel, newXP } = applyXPAndLevelUp(freshPlayer, -penalty);
      updates["player.xp"]    = newXP;
      updates["player.level"] = newLevel;

      _showResult(row, `−${penalty.toLocaleString()} XP (rejected late)`, "loss");
      logActivity(userId, "loss", `Late reject: ${quest.title}`, -penalty);
      await updateDoc(gameRef, updates);
      setTimeout(async () => {
        row.remove();
        if (_ipPollData) {
          const freshSnap = await getDoc(doc(firestore, "gameData", userId));
          if (freshSnap.exists()) {
            _ipPollData.activeQuests = freshSnap.data().quests?.active || [];
          }
          renderInProgress(_ipPollData.activeQuests, _ipPollData.player, _ipPollData.userId);
        }
      }, 1600);
      return;
    }
  }

  await updateDoc(gameRef, updates);
  row.remove();

  if (_ipPollData) {
    const freshSnap = await getDoc(doc(firestore, "gameData", userId));
    if (freshSnap.exists()) {
      _ipPollData.activeQuests = freshSnap.data().quests?.active || [];
    }
    renderInProgress(_ipPollData.activeQuests, _ipPollData.player, _ipPollData.userId);
  }
}

async function _handleComplete(quest, player, userId, row) {
  const gameRef = doc(firestore, "gameData", userId);
  const snap    = await getDoc(gameRef);
  if (!snap.exists()) return;

  const data        = snap.data();
  const freshPlayer = data.player || {};
  const activeList  = data.quests?.active || [];
  const qIdx        = activeList.findIndex(q => q.id === quest.id);

  const xpGain = calcActiveXP(quest, freshPlayer);
  const { newLevel, newXP } = applyXPAndLevelUp(freshPlayer, xpGain);

  const todayKey = getTodayKey();

  if (qIdx !== -1) {
    activeList[qIdx].acceptedToday    = false;
    activeList[qIdx].acceptedDateKey  = null;
    activeList[qIdx].completedToday   = true;
    activeList[qIdx].completedDateKey = todayKey;
  }

  const updates = {
    "player.xp":     newXP,
    "player.level":  newLevel,
    "quests.active": activeList,
    updatedAt:       Date.now()
  };

  // ── +1 to the quest's stat(s) ──
  // category can be a single string OR an array (e.g. ["Stamina","Health"])
  const cats = Array.isArray(quest.category)
    ? quest.category.map(c => c.toLowerCase())
    : [String(quest.category).toLowerCase()];

  if (cats.includes("strength")) {
    updates["player.stats.strength"] = (freshPlayer.stats?.strength ?? 1) + 1;
  }
  if (cats.includes("intelligence")) {
    updates["player.stats.intelligence"] = (freshPlayer.stats?.intelligence ?? 1) + 1;
  }
  if (cats.includes("stamina")) {
    updates["player.stats.stamina"] = (freshPlayer.stats?.stamina ?? 1) + 1;
  }
  if (cats.includes("health")) {
    updates["player.stats.health"] = (freshPlayer.stats?.health ?? 1) + 1;
  }

  await updateDoc(gameRef, updates);
  await _markPlayerActive(userId);
  syncNow();
  logActivity(userId, "gain", `Active: ${quest.title}`, xpGain);

  _showResult(row, `+${xpGain.toLocaleString()} XP`, "gain");

  setTimeout(async () => {
    clearInterval(_ipTimers.get(quest.id)?.timerInterval);
    _ipTimers.delete(quest.id);
    row.remove();

    if (_ipPollData) {
      const freshSnap = await getDoc(doc(firestore, "gameData", userId));
      if (freshSnap.exists()) {
        _ipPollData.activeQuests = freshSnap.data().quests?.active || [];
      }
      renderInProgress(_ipPollData.activeQuests, _ipPollData.player, _ipPollData.userId);
    }
  }, 1800);
}

async function _applyExpiredPenalty(quest, player, userId) {
  const todayKey = getTodayKey();
  if (quest.expiredPenaltyDate === todayKey) return;

  try {
    const gameRef = doc(firestore, "gameData", userId);
    const snap    = await getDoc(gameRef);
    if (!snap.exists()) return;

    const data        = snap.data();
    if (data.player?.inactive === true) return;

    const freshPlayer = data.player || {};
    const level       = freshPlayer.level ?? 1;
    const activeList  = data.quests?.active || [];
    const qIdx        = activeList.findIndex(q => q.id === quest.id);

    if (qIdx !== -1 && activeList[qIdx].expiredPenaltyDate === todayKey) return;

    const wasAccepted = quest.acceptedToday === true &&
                        quest.acceptedDateKey === todayKey;

    const penalty = wasAccepted ? 200 * level : 400 * level;
    const { newLevel, newXP } = applyXPAndLevelUp(freshPlayer, -penalty);

    if (qIdx !== -1) {
      activeList[qIdx].expiredPenaltyDate = todayKey;
      activeList[qIdx].acceptedToday      = false;
      activeList[qIdx].acceptedDateKey    = null;
    }
    quest.expiredPenaltyDate = todayKey;

    await updateDoc(gameRef, {
      "player.xp":     newXP,
      "player.level":  newLevel,
      "quests.active": activeList,
      updatedAt:       Date.now()
    });

    const reason = wasAccepted ? "failed to finish" : "missed";
    console.log(`[activeQuest] Penalty −${penalty} XP (${reason}) for "${quest.title}"`);
    logActivity(userId, "loss", `Active ${reason}: ${quest.title}`, -penalty);

  } catch (err) {
    console.error("[activeQuest] _applyExpiredPenalty failed:", err);
  }
}

function _showResult(row, text, type) {
  row.querySelector(".ip-result")?.remove();
  const el = document.createElement("div");
  el.className  = `ip-result ${type}`;
  el.textContent = text;
  row.appendChild(el);
}

// ─────────────────────────────────────
// POLLER — refreshes In Progress every 30s
// ─────────────────────────────────────
let _ipPollData = null;

setInterval(() => {
  if (_ipPollData) {
    renderInProgress(_ipPollData.activeQuests, _ipPollData.player, _ipPollData.userId);
  }
}, 30_000);

// ===============================
// INACTIVITY SYSTEM
// ===============================
async function _checkInactivityStatus(userId) {
  try {
    const gameRef = doc(firestore, "gameData", userId);
    const snap    = await getDoc(gameRef);
    if (!snap.exists()) return;

    const data        = snap.data();
    const freshPlayer = data.player || {};
    const todayKey    = getTodayKey();

    if (freshPlayer.lastInactivityCheckDate === todayKey) return;

    if (!freshPlayer.lastActiveDate) {
      await updateDoc(gameRef, {
        "player.lastActiveDate":          todayKey,
        "player.lastInactivityCheckDate": todayKey,
        "player.inactive":                false,
        updatedAt: Date.now()
      });
      return;
    }

    const lastActiveMs     = new Date(freshPlayer.lastActiveDate).getTime();
    const daysSince        = Math.floor((Date.now() - lastActiveMs) / 86400000);
    const shouldBeInactive = daysSince >= 7;

    if (freshPlayer.inactive !== shouldBeInactive ||
        freshPlayer.lastInactivityCheckDate !== todayKey) {
      await updateDoc(gameRef, {
        "player.inactive":                shouldBeInactive,
        "player.lastInactivityCheckDate": todayKey,
        updatedAt: Date.now()
      });
      if (shouldBeInactive && !freshPlayer.inactive) {
        console.log(`[inactivity] Player inactive — ${daysSince} days since last quest activity`);
        logActivity(userId, "info", `Inactive for ${daysSince} days — penalties paused`, 0);
      }
    }

  } catch (err) {
    console.error("[inactivity] _checkInactivityStatus failed:", err);
  }
}

async function _markPlayerActive(userId) {
  try {
    const gameRef = doc(firestore, "gameData", userId);
    const snap    = await getDoc(gameRef);
    if (!snap.exists()) return;

    const wasInactive = snap.data().player?.inactive === true;
    const todayKey    = getTodayKey();

    await updateDoc(gameRef, {
      "player.inactive":       false,
      "player.lastActiveDate": todayKey,
      updatedAt:               Date.now()
    });

    if (wasInactive) {
      console.log("[inactivity] Player reactivated via quest action");
      logActivity(userId, "info", "Returned from inactivity — penalties resumed", 0);
    }
  } catch (err) {
    console.error("[inactivity] _markPlayerActive failed:", err);
  }
}

// ===============================
// DAILY PENALTY CHECK
// ===============================
async function _checkDailyPenalty(userId) {
  try {
    const gameRef = doc(firestore, "gameData", userId);
    const snap    = await getDoc(gameRef);
    if (!snap.exists()) return;

    const data     = snap.data();
    const todayKey = getTodayKey();

    if (data.quests?.lastDailyPenaltyDate === todayKey) return;

    const activeList = data.quests?.active || [];
    let   flagsChanged = false;

    activeList.forEach(q => {
      if (q.rejectedToday && q.rejectedDateKey !== todayKey) {
        delete q.rejectedToday; delete q.rejectedDateKey; flagsChanged = true;
      }
      if (q.completedToday && q.completedDateKey !== todayKey) {
        delete q.completedToday; delete q.completedDateKey; flagsChanged = true;
      }
      if (q.expiredPenaltyDate && q.expiredPenaltyDate !== todayKey) {
        delete q.expiredPenaltyDate; flagsChanged = true;
      }
      if (q.acceptedToday && q.acceptedDateKey !== todayKey) {
        q.acceptedToday = false; q.acceptedDateKey = null; flagsChanged = true;
      }
    });

    if (flagsChanged) {
      await updateDoc(gameRef, { "quests.active": activeList, updatedAt: Date.now() });
      console.log("[dailyCleanup] Cleared stale active quest flags");
    }

    if (data.player?.inactive === true) {
      await updateDoc(gameRef, { "quests.lastDailyPenaltyDate": todayKey, updatedAt: Date.now() });
      return;
    }

    if (!data.quests?.lastDailyPenaltyDate) {
      await updateDoc(gameRef, { "quests.lastDailyPenaltyDate": todayKey, updatedAt: Date.now() });
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,"0")}-${String(yesterday.getDate()).padStart(2,"0")}`;

    const dailyCompleted     = data.quests?.dailyCompleted || {};
    const completedYesterday = new Set(dailyCompleted[yKey] || []);

    const savedCustom = data.quests?.daily || [];
    const allTasks = [];

    DAILY_QUESTS.forEach(group => {
      group.tasks.forEach(task => {
        allTasks.push(_dailyKey(task, group.category));
      });
    });
    savedCustom.forEach(q => {
      allTasks.push(_dailyKey(q.text, q.category));
    });

    const uncompleted = allTasks.filter(key => !completedYesterday.has(key));
    const freshPlayer = data.player || {};
    const level       = freshPlayer.level ?? 1;
    const penalty     = uncompleted.length * 100 * level;

    const updates = { "quests.lastDailyPenaltyDate": todayKey, updatedAt: Date.now() };

    if (penalty > 0) {
      const { newLevel, newXP } = applyXPAndLevelUp(freshPlayer, -penalty);
      updates["player.xp"]    = newXP;
      updates["player.level"] = newLevel;
      console.log(`[dailyPenalty] −${penalty} XP for ${uncompleted.length} uncompleted task(s) from ${yKey}`);
      logActivity(userId, "loss",
        `Daily penalty: ${uncompleted.length} task${uncompleted.length !== 1 ? "s" : ""} uncompleted`,
        -penalty);
    }

    await updateDoc(gameRef, updates);

  } catch (err) {
    console.error("[dailyPenalty] _checkDailyPenalty failed:", err);
  }
}

// ===============================
// WEEK ROLLOVER
// ===============================
async function _checkWeekRollover(userId) {
  try {
    const gameRef = doc(firestore, "gameData", userId);
    const snap    = await getDoc(gameRef);
    if (!snap.exists()) return;

    const data         = snap.data();
    const currentWeek  = getISOWeek(new Date());
    const urgentWeek   = data.quests?.urgentWeek    || { week: "", quests: [] };
    const urgentNext   = data.quests?.urgentNextWeek || [];
    const lastRollover = data.quests?.lastRolloverWeek || "";

    if (urgentWeek.week === currentWeek) return;
    if (lastRollover === currentWeek)    return;

    const freshPlayer = data.player || {};
    const level       = freshPlayer.level ?? 1;
    const isInactive  = data.player?.inactive === true;

    const failedQuests = isInactive ? [] : (urgentWeek.quests || []).filter(
      q => q.status === "pending" && !q.failedPenaltyApplied
    );

    const updates = {};
    let   penalisedPlayer = { ...freshPlayer };

    if (failedQuests.length > 0) {
      const totalPenalty = failedQuests.length * 5000 * level;
      const { newLevel, newXP } = applyXPAndLevelUp(penalisedPlayer, -totalPenalty);
      updates["player.xp"]    = newXP;
      updates["player.level"] = newLevel;
      penalisedPlayer.xp    = newXP;
      penalisedPlayer.level = newLevel;
      console.log(`[weekRollover] −${totalPenalty} XP for ${failedQuests.length} unfinished urgent quest(s) from ${urgentWeek.week}`);
      logActivity(userId, "loss",
        `Week ended: ${failedQuests.length} urgent quest${failedQuests.length !== 1 ? "s" : ""} unfinished`,
        -totalPenalty);
    }

    const promoted = urgentNext.map(q => ({
      ...q,
      status:               "pending",
      createdAt:            Date.now(),
      deadlineTs:           Date.now() + q.deadlineDays * 86400000,
      failedPenaltyApplied: false
    }));

    updates["quests.urgentWeek"]       = { week: currentWeek, quests: promoted };
    updates["quests.urgentNextWeek"]   = [];
    updates["quests.lastRolloverWeek"] = currentWeek;
    updates["updatedAt"]               = Date.now();

    await updateDoc(gameRef, updates);
    console.log(`[weekRollover] Week rolled to ${currentWeek}. Promoted ${promoted.length} quest(s) from queue.`);

  } catch (err) {
    console.error("[weekRollover] _checkWeekRollover failed:", err);
  }
}

// ===============================
// AUTH + DATA LOAD
// ===============================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    _ipTimers.forEach(({ timerInterval }) => clearInterval(timerInterval));
    _ipTimers.clear();
    _ipPollData = null;
    return;
  }

  const gameDoc = await getDoc(doc(firestore, "gameData", user.uid));
  if (!gameDoc.exists()) return;

  const gameData    = gameDoc.data();
  const player      = gameData.player  || {};
  const quests      = gameData.quests  || {};

  const savedDaily  = quests.daily      || [];
  const activeList  = quests.active     || [];
  const urgentWeek  = quests.urgentWeek || { week: "", quests: [] };
  const currentWeek = getISOWeek(new Date());

  _ipPollData = { activeQuests: activeList, player, userId: user.uid };

  const todayKey          = getTodayKey();
  const dailyCompleted    = gameData.quests?.dailyCompleted || {};
  const completedTodayArr = dailyCompleted[todayKey] || [];
  const completedTodaySet = new Set(completedTodayArr);

  await _checkInactivityStatus(user.uid);
  await _checkDailyPenalty(user.uid);
  await _checkWeekRollover(user.uid);

  const freshDoc    = await getDoc(doc(firestore, "gameData", user.uid));
  const freshData   = freshDoc.exists() ? freshDoc.data() : gameData;
  const freshUrgent = freshData.quests?.urgentWeek || { week: "", quests: [] };

  const weekXpKey    = `urgentXpWeek_${currentWeek}`;
  const weekXpEarned = freshData[weekXpKey] ?? 0;

  renderDailyQuests (player, user.uid, savedDaily, completedTodaySet);
  renderActiveQuests(activeList);
  renderUrgentQuests(freshUrgent, currentWeek, player, user.uid, weekXpEarned);
  renderInProgress  (activeList, player, user.uid);
});

// ===============================
// EXPORTED REFRESH
// ===============================
export async function refreshQuestCards() {
  const user = auth.currentUser;
  if (!user) return;

  const gameDoc = await getDoc(doc(firestore, "gameData", user.uid));
  if (!gameDoc.exists()) return;

  const gameData    = gameDoc.data();
  const player      = gameData.player  || {};
  const quests      = gameData.quests  || {};

  const savedDaily  = quests.daily      || [];
  const activeList  = quests.active     || [];
  const urgentWeek  = quests.urgentWeek || { week: "", quests: [] };
  const currentWeek = getISOWeek(new Date());

  _ipPollData = { activeQuests: activeList, player, userId: user.uid };

  const todayKey          = getTodayKey();
  const dailyCompleted    = quests.dailyCompleted || {};
  const completedTodaySet = new Set(dailyCompleted[todayKey] || []);

  await _checkInactivityStatus(user.uid);
  await _checkDailyPenalty(user.uid);
  await _checkWeekRollover(user.uid);

  const freshDoc2    = await getDoc(doc(firestore, "gameData", user.uid));
  const freshData2   = freshDoc2.exists() ? freshDoc2.data() : gameData;
  const freshUrgent2 = freshData2.quests?.urgentWeek || { week: "", quests: [] };

  const weekXpKey    = `urgentXpWeek_${currentWeek}`;
  const weekXpEarned = freshData2[weekXpKey] ?? 0;

  renderDailyQuests (player, user.uid, savedDaily, completedTodaySet);
  renderActiveQuests(activeList);
  renderUrgentQuests(freshUrgent2, currentWeek, player, user.uid, weekXpEarned);
  renderInProgress  (activeList, player, user.uid);
}
