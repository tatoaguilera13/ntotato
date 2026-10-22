import * as C from "./calc.js";
import { analyze, rowsToObjects, pushHistory, metrics } from "./advisor.js";
import { S, esc, fmt, short, hours, pct, $, $$, saveProfile, nextOccurrences, countdown, localTime, localDay } from "./app.js";

const WHEN = [["ahora", "🔥 Hacé esto ahora"], ["hoy", "📅 Hoy"], ["semana", "🗓️ Esta semana"], ["info", "💡 Para saber"]];

// ---- datos remotos (con caché corta en la sesión) ----
async function getJSON(url, ttl = 0) {
  const k = "ntoh-c:" + url;
  if (ttl) { try { const c = JSON.parse(sessionStorage.getItem(k)); if (c && Date.now() - c.t < ttl) return c.v; } catch { } }
  const r = await fetch(url); const v = await r.json().catch(() => ({ error: "Respuesta inválida" }));
  if (!r.ok) { const e = new Error(v.error || `Error ${r.status}`); e.data = v; throw e; }
  if (ttl) try { sessionStorage.setItem(k, JSON.stringify({ t: Date.now(), v })); } catch { }
  return v;
}
export const fetchChar = (name) => getJSON(`/api/char?name=${encodeURIComponent(name)}`);
export const fetchPeers = () => getJSON(`/api/peers`, 10 * 60e3).then(rowsToObjects);

const ago = (t) => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? "recién" : s < 3600 ? `hace ${Math.round(s / 60)} min` : `hace ${Math.round(s / 3600)} h`; };
const posTxt = (p, of) => p ? `${p}º de ${fmt(of)}` : "—";
const cmp = (mine, theirs, higherBetter = true, d = 0) => {
  if (theirs == null || mine == null) return `<span class="mute">—</span>`;
  const better = higherBetter ? mine >= theirs : mine <= theirs;
  return `<span class="pill ${better ? "ok" : "bad"}">${better ? "▲" : "▼"} ${fmt(Math.abs(mine - theirs), d)}</span>`;
};

function recCard(r) {
  return `<div class="card rec" style="margin:8px 0"><div class="flex" style="align-items:flex-start;flex-wrap:nowrap"><div style="font-size:22px;line-height:1">${r.ic}</div><div style="min-width:0">
    <b style="font-size:15.5px">${esc(r.title)}</b><p class="ink2 small" style="margin:4px 0 6px">${esc(r.why)}</p>
    ${r.how?.length ? `<ul class="small" style="margin:0;padding-left:18px">${r.how.map(h => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
    ${r.metric ? `<div class="small mute" style="margin-top:6px">${esc(r.metric.label)}: <b class="num">${fmt(r.metric.value)}</b></div>` : ""}</div></div></div>`;
}

export function pageNinja(root) {
  const st = { row: null, pos: null, of: 0, peers: null, at: 0, err: null, loading: false, sug: [] };
  const p0 = S.profile;

  const askName = (msg = "") => {
    root.innerHTML = `<div class="hero"><h1 class="mt0">Tu asistente de NTO Idle 🥷</h1>
      <p>Escribí el nombre de tu personaje. Leo tus datos reales del ranking público del juego (level, exp exacta, skills, elo, kills, muertes, horas jugadas), te comparo con los jugadores de tu nivel y te armo un plan de qué hacer y cómo.</p>
      <form id="f" class="form" style="margin-top:10px"><div class="field" style="flex:1;min-width:220px"><label>Nombre del personaje</label><input id="n" value="${esc(p0.name || "")}" placeholder="Ej: Tato" autocomplete="off" style="width:100%"></div><button class="btn">Analizar mi ninja</button></form>
      ${msg ? `<div class="callout bad" style="margin-top:12px">${msg}</div>` : ""}
      <p class="small mute" style="margin-top:12px">No necesita tu contraseña ni toca el juego: solo lee el ranking público, igual que cualquier visitante de la web del juego.</p></div>
      <div id="ev"></div>`;
    $("#f").onsubmit = (e) => { e.preventDefault(); const n = $("#n").value.trim(); if (n) { saveProfile({ ...S.profile, name: n }); load(true); } };
    renderEvents($("#ev"));
  };

  async function load(force = false) {
    const name = S.profile.name; if (!name) return askName();
    if (st.loading) return; st.loading = true;
    if (!st.row) root.innerHTML = `<div class="empty">Leyendo a <b>${esc(name)}</b> en el ranking del juego…</div>`;
    try {
      const [c, peers] = await Promise.all([fetchChar(name), st.peers && !force ? st.peers : fetchPeers()]);
      st.row = c.row; st.pos = c.pos; st.posVoc = c.posVoc; st.of = c.of; st.ofVoc = c.ofVoc; st.peers = peers; st.at = Date.now(); st.err = null;
      // el perfil de las calculadoras se actualiza solo
      const m = metrics(c.row);
      saveProfile({ ...S.profile, name: c.row.name, voc: c.row.vocName, level: c.row.level, pct: Math.round(m.pct * 10) / 10, elo: c.row.elo, kpm: m.kpm ? Math.round(m.kpm * 2) / 2 || 0.5 : S.profile.kpm, hoursDay: Math.round(m.hoursDay * 2) / 2 || S.profile.hoursDay });
      st.hist = pushHistory(c.row.name, c.row);
      draw();
    } catch (e) {
      st.loading = false;
      if (e.data?.sugerencias?.length) return askName(`No encontré “${esc(name)}”. ¿Quisiste decir: ${e.data.sugerencias.map(s => `<a href="#" data-n="${esc(s.name)}">${esc(s.name)}</a> (${esc(s.voc)} ${s.level})`).join(", ")}?`), $$("[data-n]").forEach(a => a.onclick = (ev) => { ev.preventDefault(); saveProfile({ ...S.profile, name: a.dataset.n }); load(true); });
      if (st.row) { st.err = e.message; draw(); } else askName(esc(e.message));
    }
    st.loading = false;
  }

  function draw() {
    const G = S.G, r = st.row, p = S.profile;
    const events = nextOccurrences();
    const A = analyze({ G, row: r, pos: st.pos, of: st.of, peers: st.peers, profile: p, history: st.hist, events });
    const me = A.me, peer = A.peer, f = A.f;
    const best = A.plan.best, epk = best ? C.expPerKill(best.a.exp, r.level, A.rate) : 0;
    const etaH = epk && me.kpm ? me.expToNext / epk / (me.kpm * 60) : null;
    const rk = C.rankFor(r.elo);
    root.innerHTML = `
    <div class="hero">
      <div class="flex between" style="align-items:flex-start">
        <div><h1 class="mt0">${esc(r.name)} ${r.online ? `<span class="pill ok">online</span>` : `<span class="pill">offline</span>`}</h1>
          <div class="flex"><span class="pill acc">Level ${r.level} · ${fmt(me.pct, 1)}%</span><span class="pill">${esc(r.vocName)}</span><span class="pill ch">${esc(r.grad)} · ${fmt(r.elo)} elo</span>${r.guild ? `<span class="pill">🏯 ${esc(r.guild.name)}</span>` : ""}${r.jin ? `<span class="pill warn">🐉 ${esc(r.jin)}</span>` : ""}${r.kage ? `<span class="pill acc">KAGE</span>` : ""}</div></div>
        <div class="r small mute">Actualizado ${ago(st.at)}<br><button class="btn ghost" id="rf" style="margin-top:6px">↻ Actualizar</button> <button class="btn ghost" id="ch" style="margin-top:6px">Cambiar</button></div>
      </div>
      ${st.err ? `<div class="callout bad">No pude actualizar: ${esc(st.err)}. Muestro los últimos datos.</div>` : ""}
      <div class="grid g4" style="margin-top:12px">
        <div class="stat"><div class="k">Ranking</div><div class="v" style="font-size:18px">Level ${posTxt(st.pos?.level, st.of)}</div><div class="s">Elo ${posTxt(st.pos?.elo, st.of)} · en ${esc(r.vocName)}: ${posTxt(st.posVoc?.level, st.ofVoc)}</div></div>
        <div class="stat"><div class="k">Próximo level</div><div class="v" style="font-size:18px">${short(me.expToNext)} exp</div><div class="s">${epk ? `≈ ${fmt(Math.ceil(me.expToNext / epk))} kills${etaH && etaH > 1 / 60 ? ` (${hours(etaH)})` : ""} en ${esc(best.h.n)}` : ""}</div></div>
        <div class="stat"><div class="k">Tu ritmo real</div><div class="v" style="font-size:18px">${me.kpm ? fmt(me.kpm, 1) : "—"} kills/min</div><div class="s">${fmt(me.hoursDay, 1)} h/día en juego · ${fmt(A.myEloDay)} elo/día${A.hr ? " (medido)" : ""}</div></div>
        <div class="stat"><div class="k">Camino a Kage</div><div class="v" style="font-size:18px">${pct(Math.min(1, r.elo / 20000))}</div><div class="progress"><i style="width:${Math.min(100, r.elo / 200).toFixed(1)}%"></i></div><div class="s">faltan ${fmt(Math.max(0, 20000 - r.elo))} elo</div></div>
      </div>
    </div>

    <div class="card flat"><div class="form">
      <span class="small mute" style="width:100%">Esto no sale en el ranking público, completalo vos:</span>
      <div class="field"><label>Sagas hechas (de 36)</label><input type="number" data-m="sagas" min="0" max="36" value="${p.sagasKnown ? p.sagas : ""}" placeholder="?"></div>
      <div class="field"><label>Tasks hechas</label><input type="number" data-m="tasks" min="0" value="${p.tasks}"></div>
      <label class="check"><input type="checkbox" data-m="vip" ${p.vip ? "checked" : ""}> VIP</label>
      <label class="check"><input type="checkbox" data-m="stamina" ${p.stamina ? "checked" : ""}> Stamina verde</label>
      <label class="check"><input type="checkbox" data-m="pvp" ${p.pvp ? "checked" : ""}> Cazo en modo PvP</label>
    </div></div>

    <h2>Tu plan</h2>
    ${WHEN.map(([k, t]) => { const list = A.recs.filter(x => x.when === k); return list.length ? `<h3>${t}</h3>${list.map(recCard).join("")}` : ""; }).join("")}

    <h2>Vos contra los jugadores de tu nivel</h2>
    <p class="ink2 small">${peer.n} jugadores entre el level ${r.level - peer.span} y el ${r.level + peer.span}. Mediana de cada dato.</p>
    <div class="tw"><table><thead><tr><th>Dato</th><th class="r">Vos</th><th class="r">Tus pares</th><th class="r">Diferencia</th></tr></thead><tbody>
      <tr><td>Ninjutsu <span class="small mute">(1 punto ≈ ${(f.skill / f.level).toFixed(1)} levels de daño de jutsu)</span></td><td class="r num">${r.ml}</td><td class="r num">${fmt(peer.ml)}</td><td class="r">${cmp(r.ml, peer.ml)}</td></tr>
      <tr><td>Skill de arma (${esc(me.weapon)})</td><td class="r num">${me.weaponSkill}</td><td class="r num">${fmt(peer.weapon)}</td><td class="r">${cmp(me.weaponSkill, peer.weapon)}</td></tr>
      <tr><td>Taijutsu (velocidad de ataque)</td><td class="r num">${r.fist}</td><td class="r num">${fmt(peer.fist)}</td><td class="r">${cmp(r.fist, peer.fist)}</td></tr>
      <tr><td>Shielding</td><td class="r num">${r.shield}</td><td class="r num">${fmt(peer.shield)}</td><td class="r">${cmp(r.shield, peer.shield)}</td></tr>
      <tr><td>Kills por minuto jugado</td><td class="r num">${fmt(me.kpm, 1)}</td><td class="r num">${fmt(peer.kpm, 1)}</td><td class="r">${cmp(me.kpm, peer.kpm, true, 1)}</td></tr>
      <tr><td>Horas en juego por día</td><td class="r num">${fmt(me.hoursDay, 1)}</td><td class="r num">${fmt(peer.hoursDay, 1)}</td><td class="r">${cmp(me.hoursDay, peer.hoursDay, true, 1)}</td></tr>
      <tr><td>Muertes cada 1.000 kills</td><td class="r num">${fmt(me.deathsPer1k, 2)}</td><td class="r num">${fmt(peer.deaths, 2)}</td><td class="r">${cmp(me.deathsPer1k, peer.deaths, false, 2)}</td></tr>
      <tr><td>Elo</td><td class="r num">${fmt(r.elo)}</td><td class="r num">${fmt(peer.elo)}</td><td class="r">${cmp(r.elo, peer.elo)}</td></tr>
    </tbody></table></div>

    <h2>Próximos eventos <span class="small mute">(tu hora)</span></h2><div id="ev"></div>
    <p class="small mute">Datos del ranking público del juego (se refrescan cada 2 min mientras tengas esta página abierta). Las recomendaciones usan las fórmulas reales del juego; tu ritmo “medido” se calcula entre tus visitas a este sitio.</p>`;
    renderEvents($("#ev", root));
    $("#rf").onclick = () => load(true);
    $("#ch").onclick = () => { saveProfile({ ...S.profile, name: "" }); st.row = null; askName(); };
    $$("[data-m]", root).forEach(el => el.onchange = () => { const k = el.dataset.m; saveProfile({ ...S.profile, [k]: el.type === "checkbox" ? el.checked : Number(el.value), ...(k === "sagas" ? { sagasKnown: true } : {}) }); draw(); });
  }

  if (S.profile.name) load(); else askName();
  return { tick: () => { $$(".countdown", root).forEach(el => el.textContent = countdown(new Date(+el.dataset.at))); if (st.row && Date.now() - st.at > 120e3) load(); } };
}

function renderEvents(el) {
  if (!el) return;
  const evs = nextOccurrences().slice(0, 4);
  el.innerHTML = `<div class="tw"><table><tbody>${evs.map(e => `<tr class="${e.hot ? "hl" : ""}"><td>${e.ic}</td><td><b>${esc(e.name)}</b><div class="small mute">${esc(e.what)}</div></td><td class="r"><b class="num">${localTime(e.at)}</b><div class="small mute">${localDay(e.at)}</div></td><td class="r countdown" data-at="${+e.at}">${countdown(e.at)}</td></tr>`).join("")}</tbody></table></div>`;
}

// ================= RIVALES =================
export function pageRivals(root) {
  const st = { list: null, err: null, filter: "" };
  const draw = () => {
    const me = S.profile.name?.toLowerCase();
    const all = [...st.list].sort((a, b) => b.elo - a.elo);
    const myIdx = all.findIndex(x => x.name.toLowerCase() === me);
    const mine = all[myIdx];
    const myRate = mine ? metrics(mine).eloDay : null;
    const guilds = {}; all.slice(0, 50).forEach(x => { const g = x.guild || "(sin guild)"; guilds[g] = (guilds[g] || 0) + 1; });
    const shown = all.filter(x => !st.filter || (x.guild || "").toLowerCase().includes(st.filter.toLowerCase()) || x.name.toLowerCase().includes(st.filter.toLowerCase())).slice(0, 100);
    root.innerHTML = `<h1>Rivales: la carrera por el elo</h1>
    <p class="ink2">Ranking de elo en vivo. Los 5 primeros que cumplan la patente (20.000 elo, 36 sagas, 50 tasks) son los Kages; el 1º es Hokage. “Elo/día” es su elo dividido por los días desde que crearon el personaje.</p>
    <div class="grid g3">
      <div class="stat"><div class="k">Puesto 5 (último Kage)</div><div class="v">${fmt(all[4]?.elo)}</div><div class="s">${esc(all[4]?.name || "")} · ${fmt(metrics(all[4]).eloDay)}/día</div></div>
      <div class="stat"><div class="k">Puesto 1</div><div class="v">${fmt(all[0]?.elo)}</div><div class="s">${esc(all[0]?.name || "")} · ${fmt(metrics(all[0]).eloDay)}/día · faltan ${fmt(Math.max(0, 20000 - all[0]?.elo))} para 20.000</div></div>
      <div class="stat"><div class="k">Vos</div><div class="v">${mine ? `${myIdx + 1}º` : "—"}</div><div class="s">${mine ? `${fmt(mine.elo)} elo · ${fmt(myRate)}/día` : `Cargá tu personaje en <a href="#/">Mi ninja</a>`}</div></div>
    </div>
    <div class="card"><b>Guilds en el top 50 de elo:</b> ${Object.entries(guilds).sort((a, b) => b[1] - a[1]).map(([g, n]) => `<span class="pill">${esc(g)} · ${n}</span>`).join(" ")}</div>
    <div class="card"><div class="form"><div class="field"><label>Filtrar por nombre o guild</label><input type="search" id="q" value="${esc(st.filter)}"></div></div></div>
    <div class="tw"><table><thead><tr><th class="r">#</th><th>Personaje</th><th class="r">Level</th><th class="r">Elo</th><th class="r">Elo/día</th><th class="r">h/día</th><th class="r">Ninjutsu</th><th>Guild</th>${mine ? `<th class="r">Lo pasás en</th>` : ""}</tr></thead><tbody>
    ${shown.map(x => { const m = metrics(x), i = all.indexOf(x); let pass = "";
      if (mine && x !== mine && x.elo > mine.elo) { const d = myRate - m.eloDay; pass = d > 0 ? `${Math.ceil((x.elo - mine.elo) / d)} días` : "—"; }
      return `<tr class="${x === mine ? "hl" : ""}"><td class="r num">${i + 1}</td><td><b>${esc(x.name)}</b> ${x.online ? `<span class="pill ok">on</span>` : ""}<div class="small mute">${esc(x.vocName)}</div></td><td class="r num">${x.level}</td><td class="r num"><b>${fmt(x.elo)}</b></td><td class="r num">${fmt(m.eloDay)}</td><td class="r num">${fmt(m.hoursDay, 1)}</td><td class="r num">${x.ml}</td><td class="small">${esc(x.guild || "—")}</td>${mine ? `<td class="r num">${pass}</td>` : ""}</tr>`; }).join("")}
    </tbody></table></div>`;
    $("#q").oninput = (e) => { st.filter = e.target.value; clearTimeout(st.t); st.t = setTimeout(() => { draw(); $("#q").focus(); }, 250); };
  };
  root.innerHTML = `<div class="empty">Cargando el ranking del juego…</div>`;
  fetchPeers().then(l => { st.list = l; draw(); }).catch(e => root.innerHTML = `<div class="callout bad"><b>No pude leer el ranking.</b>${esc(e.message)}</div>`);
}
