// Fórmulas del juego, portadas del código público del cliente de NTO Idle (game.js / worldengine.js / missions.js).
// Si el juego cambia sus números, se actualiza data/game.json con tools/build_data.py.

export const TIERS = [1, 25, 50, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 700, 800, 900];
export const SET_BANDS = [1, 100, 200, 400, 500, 700];
export const BAL = {
  expMult: 0.85,           // todo exp ganado pasa por ×0.85
  staminaGreenExp: 0.3,    // stamina ≥ 40 h
  vipExp: 0.2,
  pvpMult: 1.3,            // modo PvP (level 200+): exp y loot
  pveLootMult: 0.7,        // en PvE el loot rinde 70%
  xpBoost: 0.3,            // XP Boost de la tienda
  guildXp: 0.3,            // bonus de guild "Exp +30%"
  dayVoc: 1.5,             // personaje del día
  kageExp: 0.1,
  bestiaryPerPoint: 0.0025, bestiaryMax: 100,
  expCapFrom: 650, expCap: 3.5,
  offline: 0.5,
  staminaMaxH: 42, staminaGreenH: 40,
};

export const tierFor = (lv) => { let t = TIERS[0]; for (const x of TIERS) if (x <= lv) t = x; return t; };
export const setBandOf = (lv) => { let t = SET_BANDS[0]; for (const x of SET_BANDS) if (x <= lv) t = x; return t; };

let G = null;
export function bindData(game) { G = game; }

export const expForLevel = (L) => Math.floor((50 * L * L * L - 150 * L * L + 400 * L) / 3);
export const stageMult = (L) => G.curve[Math.max(1, Math.min(1000, Math.floor(L))) - 1][1];

// Multiplicador de exp según el código del servidor (WorldEngine.rates + expMult).
export function expRateMult(o = {}) {
  let m = o.pvp && o.level >= 200 ? BAL.pvpMult : 1;
  if (o.stamina !== false) m *= 1 + BAL.staminaGreenExp;          // stamina verde (por defecto sí)
  if (o.vip) m *= 1 + BAL.vipExp;
  if (o.kage) m *= 1 + BAL.kageExp;
  if (o.dayVoc) m *= BAL.dayVoc;
  if (o.xpBoost) m *= 1 + BAL.xpBoost;
  if (o.guildXp) m *= 1 + BAL.guildXp;
  if (o.bestiary) m *= 1 + Math.min(BAL.bestiaryMax, o.bestiary) * BAL.bestiaryPerPoint;
  if (o.prey) m *= 1 + o.prey / 100;
  if (o.level >= BAL.expCapFrom) m = Math.min(m, BAL.expCap);
  if (o.event) m *= o.event;           // evento de Double EXP (fuera del tope)
  if (o.offline) m *= BAL.offline;
  return m;
}

export const monster = (name) => G.monsters.find(m => m.n === name);

// Exp media por kill de una hunt (ponderada por cantidad de cada monstruo).
export function huntAvg(h) {
  let s = 0, n = 0, hp = 0, dps = 0, g = 0, sd = 0;
  for (const [name, c] of h.mon) { const m = monster(name); if (!m) continue; s += m.exp * c; hp += m.hp * c; dps += m.dps * c; g += m.g * c; sd += (m.sd || 0) * c; n += c; }
  return n ? { exp: s / n, hp: hp / n, dps: dps / n, gold: g / n, sd: sd / n, n } : { exp: 0, hp: 1, dps: 0, gold: 0, sd: 0, n: 0 };
}
export const expPerKill = (baseExp, level, rate) => Math.round(baseExp * stageMult(level) * BAL.expMult * rate);

// Kills necesarios para ir de (nivel, %) a nivel objetivo, con una exp base de monstruo dada.
export function killsToLevel(from, pct, to, baseExp, rate) {
  let kills = 0;
  for (let L = from; L < to; L++) {
    const need = (expForLevel(L + 1) - expForLevel(L)) * (L === from ? 1 - pct / 100 : 1);
    const per = baseExp * stageMult(L) * BAL.expMult * rate;
    if (per <= 0) return Infinity;
    kills += need / per;
  }
  return kills;
}

// Mejor exp base de hunt disponible para un nivel (para estimar tramos largos).
export function bestHuntExpFor(level) {
  let best = 0;
  for (const h of G.hunts) if (h.min <= level && h.lv <= level + 5) best = Math.max(best, huntAvg(h).exp);
  return best || 200;
}

// ---------- Tasks ----------
export const TASK_DIFF = [
  { id: "baixa", es: "Muy fácil", band: -2, mult: 0.5, elo: 0.3 },
  { id: "facil", es: "Fácil", band: -1, mult: 0.7, elo: 0.6 },
  { id: "media", es: "Media", band: 0, mult: 1, elo: 1 },
  { id: "dificil", es: "Difícil", band: 1, mult: 1.5, elo: 1.6 },
];
export const TASK_DUR = [
  { id: "curta", es: "Corta", kills: 150, elo: 1, cards: 1 },
  { id: "longa", es: "Larga", kills: 400, elo: 2.6, cards: 2 },
  { id: "extensa", es: "Extensa", kills: 1000, elo: 6.5, cards: 3 },
];
export const taskElo = (tier, durId, diffId) => {
  const d = TASK_DUR.find(x => x.id === durId), f = TASK_DIFF.find(x => x.id === diffId);
  return f.elo > 0 ? Math.max(1, Math.round((2 + tier / 50) * d.elo * f.elo)) : 0;
};
export const taskExp = (m, durId, diffId) => { const d = TASK_DUR.find(x => x.id === durId), f = TASK_DIFF.find(x => x.id === diffId); return Math.round(d.kills * m.exp * 0.4 * f.mult); };
export const taskGold = (m, durId, diffId) => { const d = TASK_DUR.find(x => x.id === durId), f = TASK_DIFF.find(x => x.id === diffId); return Math.round(d.kills * m.g * 0.5 * f.mult); };
export const taskFee = (level) => { // 25 kills de tu faixa (aprox: oro medio de los monstruos de tu tier)
  const t = tierFor(level); const ms = G.monsters.filter(m => m.lv === t); const g = ms.length ? ms.reduce((a, m) => a + m.g, 0) / ms.length : 1; return Math.round(25 * g);
};
// Bandas de task abiertas para un nivel (regla del juego: la hunt abre en su nivel −15; difícil permite +10).
export function taskBandsFor(level) {
  const i = TIERS.indexOf(tierFor(level));
  return TIERS.map((band, j) => {
    const diff = j > i ? "dificil" : j === i ? "media" : j === i - 1 ? "facil" : "baixa";
    if (j > i + 1) return null;
    const hs = G.hunts.filter(h => tierFor(h.lv) === band);
    if (!hs.length) return null;
    const entry = Math.min(...hs.map(h => h.min));
    return { band, diff, entry, open: entry <= level + (diff === "dificil" ? 10 : 0) };
  }).filter(Boolean);
}

// ---------- Misiones ----------
export const MISSION_RANKS = { D: { h: 0.5, elo: 1 }, C: { h: 1, elo: 2 }, B: { h: 2, elo: 4 }, A: { h: 4, elo: 8 }, S: { h: 8, elo: 18 }, SS: { h: 12, elo: 25 } };
export function missionReward(m, level) {
  // interpola la tabla calculada con el motor del juego
  const t = m.byLevel; if (level <= t[0][0]) return { exp: t[0][1], gold: t[0][2] };
  for (let i = 1; i < t.length; i++) if (level <= t[i][0]) {
    const [a, ea, ga] = t[i - 1], [b, eb, gb] = t[i], f = (level - a) / (b - a);
    return { exp: Math.round(ea + (eb - ea) * f), gold: Math.round(ga + (gb - ga) * f) };
  }
  const l = t[t.length - 1]; return { exp: l[1], gold: l[2] };
}

// ---------- Dragon Forge ----------
export const FORGE = { chances: [0.9, 0.85, 0.8, 0.72, 0.62, 0.52, 0.4, 0.32, 0.25, 0.18], perLevel: 0.05 };
// En el código del cliente un fallo no baja el refino: cada paso es independiente → piedras esperadas = 1/p.
export function forgeExpected(from, to) {
  let stones = 0; const steps = [];
  for (let f = from; f < to; f++) { const p = FORGE.chances[f]; stones += 1 / p; steps.push({ f, p, exp: 1 / p }); }
  return { stones, steps, statMult: 1 + FORGE.perLevel * to };
}

// ---------- Sets ----------
export function setKillsPerPiece(set) { return set.kpp || null; }
export function rarityOdds(w) { const t = w.reduce((a, b) => a + b, 0); return w.map(x => x / t); }

// ---------- Personaje del día (port de vocsOfDay) ----------
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function dayCycle(cycle, ids, salt) { const r = mulberry(cycle * 7919 + 17 + salt), a = [...ids]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function dayPick(day, ids, salt) {
  const n = ids.length; if (!n) return null;
  const cycle = Math.floor(day / n), k = day - cycle * n, cur = dayCycle(cycle, ids, salt);
  if (n > 1 && cur[0] === dayCycle(cycle - 1, ids, salt)[n - 1]) [cur[0], cur[1]] = [cur[1], cur[0]];
  return cur[k];
}
const DAY_FIX = { "2026-10-21": { vip: "Madara" } };
// Fecha "del servidor" (Brasilia, UTC−3) para un instante.
export function serverDate(ms = Date.now()) {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));
  return p; // AAAA-MM-DD
}
export function vocsOfDay(ms = Date.now()) {
  const iso = serverDate(ms); const [y, mo, d] = iso.split("-").map(Number);
  const day = Math.floor(Date.UTC(y, mo - 1, d) / 864e5);
  const ids = G.vocIds, vip = G.vipIds, free = ids.filter(id => !vip.includes(id));
  const fix = DAY_FIX[iso] || {};
  const byName = (n) => n ? (G.vocs.find(v => v.n === n)?.id ?? null) : null;
  const nameOf = (id) => G.vocs.find(v => v.id === id)?.n;
  return [byName(fix.free) ?? dayPick(day, free, 0), byName(fix.vip) ?? dayPick(day, vip, 101)].map(nameOf);
}

// ---------- Graduación ----------
export function rankFor(elo) { let r = G.ranks[0]; for (const x of G.ranks) if (elo >= x.minElo) r = x; return r; }
