import * as C from "./calc.js?v=4";
import { PAGES } from "./pages.js?v=4";

export const S = { G: null, profile: null };

// ---------- utilidades ----------
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const fmt = (n, d = 0) => n == null || !isFinite(n) ? "—" : Number(n).toLocaleString("es-AR", { maximumFractionDigits: d, minimumFractionDigits: 0 });
export function short(n) {
  if (n == null || !isFinite(n)) return "—";
  const a = Math.abs(n);
  if (a >= 1e12) return fmt(n / 1e12, 2) + " B"; // billón (10^12)
  if (a >= 1e9) return fmt(n / 1e9, 2) + " mil M";
  if (a >= 1e6) return fmt(n / 1e6, 2) + " M";
  if (a >= 1e4) return fmt(n / 1e3, 1) + " k";
  return fmt(n, a < 10 ? 2 : 0);
}
export const hours = (h) => !isFinite(h) ? "∞" : h < 1 ? `${Math.round(h * 60)} min` : h < 48 ? `${fmt(h, 1)} h` : `${fmt(h / 24, 1)} días`;
export const money = (m) => m >= 100 ? `${fmt(m / 100, m >= 10000 ? 0 : 2)} gold` : `${fmt(m)} money`;
export const pct = (x, d = 1) => `${fmt(x * 100, d)}%`;
export const $ = (sel, el = document) => el.querySelector(sel);
export const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

// ---------- perfil (localStorage) ----------
const PKEY = "ntoh-perfil-v1";
const DEFAULT_PROFILE = { name: "", voc: "", level: 100, pct: 0, elo: 0, sagas: 0, tasks: 0, vip: false, pvp: false, stamina: true,
  guildXp: false, xpBoost: false, bestiary: 0, kpm: 8, hoursDay: 6, missionsDay: 2 };
export function loadProfile() {
  try { return { ...DEFAULT_PROFILE, ...(JSON.parse(localStorage.getItem(PKEY)) || {}) }; } catch { return { ...DEFAULT_PROFILE }; }
}
export function saveProfile(p) { S.profile = p; try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch { } }
export function rateFor(p, extra = {}) {
  const today = C.vocsOfDay();
  return C.expRateMult({ level: p.level, stamina: p.stamina, vip: p.vip, pvp: p.pvp, guildXp: p.guildXp, xpBoost: p.xpBoost,
    bestiary: p.bestiary, dayVoc: today.includes(p.voc), ...extra });
}

// Formulario reutilizable de perfil
export function profileForm(p, opts = {}) {
  const vocs = S.G.vocs.map(v => `<option ${v.n === p.voc ? "selected" : ""}>${esc(v.n)}</option>`).join("");
  return `<div class="form" data-profile-form>
    <div class="field"><label>Nombre</label><input data-p="name" value="${esc(p.name)}" placeholder="Tu ninja" style="width:150px"></div>
    <div class="field"><label>Vocación</label><select data-p="voc"><option value="">—</option>${vocs}</select></div>
    <div class="field"><label>Level</label><input type="number" data-p="level" min="1" max="1000" value="${p.level}"></div>
    <div class="field"><label>% del level</label><input type="number" data-p="pct" min="0" max="99.9" step="0.1" value="${p.pct}"></div>
    ${opts.full ? `<div class="field"><label>Elo actual</label><input type="number" data-p="elo" min="0" value="${p.elo}"></div>
    <div class="field"><label>Sagas hechas (de 36)</label><input type="number" data-p="sagas" min="0" max="36" value="${p.sagas}"></div>
    <div class="field"><label>Tasks hechas</label><input type="number" data-p="tasks" min="0" value="${p.tasks}"></div>
    <div class="field"><label>Kills por minuto</label><input type="number" data-p="kpm" min="0.5" step="0.5" value="${p.kpm}" title="Míralo en el Analyzer del juego"></div>
    <div class="field"><label>Horas de caza al día</label><input type="number" data-p="hoursDay" min="0" max="24" step="0.5" value="${p.hoursDay}"></div>` : ""}
    <label class="check"><input type="checkbox" data-p="vip" ${p.vip ? "checked" : ""}> VIP</label>
    <label class="check" title="Stamina por encima de 40 h: +30% exp"><input type="checkbox" data-p="stamina" ${p.stamina ? "checked" : ""}> Stamina verde</label>
    <label class="check" title="Modo PvP desde level 200: +30% exp y ×1,86 loot"><input type="checkbox" data-p="pvp" ${p.pvp ? "checked" : ""}> Modo PvP</label>
    ${opts.full ? `<label class="check"><input type="checkbox" data-p="guildXp" ${p.guildXp ? "checked" : ""}> Bonus guild Exp +30%</label>
    <label class="check"><input type="checkbox" data-p="xpBoost" ${p.xpBoost ? "checked" : ""}> XP Boost (tienda)</label>` : ""}
  </div>`;
}
export function bindProfileForm(root, onChange) {
  $$("[data-profile-form] [data-p]", root).forEach(el => el.addEventListener(el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "input", () => {
    const p = { ...S.profile }; const k = el.dataset.p;
    p[k] = el.type === "checkbox" ? el.checked : el.type === "number" ? Number(el.value) : el.value;
    if (k === "level") p.level = Math.max(1, Math.min(1000, Math.floor(p.level) || 1));
    saveProfile(p); onChange?.(p, k);
  }));
}

// ---------- eventos con horario (hora de Brasilia, UTC−3) ----------
export function brtToDate(isoDay, hhmm) { return new Date(`${isoDay}T${hhmm}:00-03:00`); }
export function nextOccurrences(now = Date.now(), days = 2) {
  const G = S.G, out = [];
  for (let d = 0; d < days; d++) {
    const iso = C.serverDate(now + d * 864e5), dow = new Date(`${iso}T12:00:00-03:00`).getUTCDay();
    for (const b of G.events.bosses) {
      if (b.off) continue; if (b.days && !b.days.includes(dow)) continue;
      for (const t of b.times) out.push({ at: brtToDate(iso, t), name: b.n.replace("Evento Bijuu", "Evento de la Bijuu"), what: `Jefe del mundo · level ${b.lv}+`, ic: "🐉" });
    }
    for (const t of G.events.juubi.times) out.push({ at: brtToDate(iso, t), name: "Guerra por la Jūbi", what: `Deathmatch · level ${G.events.juubi.min}+ · el ganador sella la Jūbi`, ic: "⚔️" });
    for (const t of G.events.ranked.times) out.push({ at: brtToDate(iso, t), name: "Hora de la Ranqueada", what: `PvP 1v1 · level ${G.events.ranked.min}+ · ${G.events.ranked.dur} min · premios en PP`, ic: "🏆" });
  }
  for (const e of G.events.exp) {
    const s = new Date(e.start), en = new Date(e.end);
    if (en > now) out.push({ at: s, until: en, name: `Evento ×${e.exp} EXP`, what: `hasta las ${en.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })} (tu hora)`, ic: "✨", hot: true });
  }
  return out.filter(e => (e.until || new Date(+e.at + 30 * 60e3)) > now).sort((a, b) => a.at - b.at);
}
export function countdown(to) {
  const ms = to - Date.now(); if (ms <= 0) return "¡ahora!";
  const h = Math.floor(ms / 3.6e6), m = Math.floor(ms % 3.6e6 / 6e4);
  return h ? `en ${h} h ${m} min` : `en ${m} min`;
}
export const localTime = (d) => d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
export const localDay = (d) => { const t = C.serverDate(Date.now()), x = C.serverDate(+d); return x === t ? "hoy" : x === C.serverDate(Date.now() + 864e5) ? "mañana" : d.toLocaleDateString("es", { weekday: "long" }); };

// ---------- navegación ----------
const NAV = [
  ["Empezar", [["", "🥷", "Mi ninja"], ["rivales", "🏁", "Rivales"], ["hokage", "🍥", "Camino a Hokage"], ["guia", "📖", "Guía completa"]]],
  ["Calculadoras", [["exp", "📈", "EXP y niveles"], ["hunts", "🗺️", "Hunts"], ["tasks", "📜", "Tasks y elo"], ["misiones", "🧭", "Misiones"],
    ["forja", "🔨", "Dragon Forge"], ["sets", "🛡️", "Sets y drops"]]],
  ["Referencia", [["vocaciones", "🥷", "Vocaciones"], ["bosses", "👹", "Bosses y sagas"], ["eventos", "⏰", "Eventos"], ["glosario", "🔤", "Glosario PT → ES"]]],
  ["Clan", [["clan", "🔥", "Clan hispano"]]],
];
function renderNav(cur) {
  $("#nav").innerHTML = NAV.map(([sec, items]) => `<div class="sec">${sec}</div>` + items.map(([id, ic, label]) =>
    `<a href="#/${id}" class="${cur === id ? "on" : ""}"><span class="ic">${ic}</span>${label}</a>`).join("")).join("");
}
let timer = null;
function route() {
  const [page, ...rest] = (location.hash.replace(/^#\/?/, "") || "").split("/");
  const fn = PAGES[page] || PAGES[""];
  renderNav(PAGES[page] ? page : "");
  document.body.classList.remove("navopen");
  clearInterval(timer);
  const main = $("#main");
  main.innerHTML = "";
  const r = fn(main, rest.join("/"));
  if (r?.tick) timer = setInterval(r.tick, 30e3);
  if (!location.hash.includes("#guia/")) window.scrollTo(0, 0);
}

// ---------- tema ----------
function initTheme() {
  const k = "ntoh-theme"; let t = null; try { t = localStorage.getItem(k); } catch { }
  if (t) document.documentElement.dataset.theme = t;
  $("#themebtn").onclick = () => {
    const dark = matchMedia("(prefers-color-scheme: dark)").matches;
    const cur = document.documentElement.dataset.theme || (dark ? "dark" : "light");
    const nx = cur === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = nx; try { localStorage.setItem(k, nx); } catch { }
  };
}

async function boot() {
  initTheme();
  $("#menubtn").onclick = () => document.body.classList.toggle("navopen");
  const G = await fetch("data/game.json?v=4").then(r => r.json());
  S.G = G; C.bindData(G); S.profile = loadProfile();
  $("#gen").textContent = G.gen;
  addEventListener("hashchange", route);
  route();
}
boot().catch(e => { $("#main").innerHTML = `<div class="callout bad"><b>No se pudieron cargar los datos.</b>${esc(e.message)}</div>`; });
