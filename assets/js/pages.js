import * as C from "./calc.js";
import { S, esc, fmt, short, hours, money, pct, $, $$, profileForm, bindProfileForm, rateFor, saveProfile, nextOccurrences, countdown, localTime, localDay } from "./app.js";
import { GUIDE, GLOSSARY } from "./guide.js";

const footer = () => `<div class="footer">Números calculados con las fórmulas del código público del juego (cliente y motor del servidor) y la wiki oficial, actualizados al ${S.G.gen}. Pueden cambiar con parches: si algo no coincide con lo que ves en el juego, avisá en el Discord del clan.</div>`;
const cls = { "Daño": "acc", "Off-tank": "warn", "Tank": "ch", "Soporte": "ok" };
const clsPill = (c) => `<span class="pill ${cls[c] || ""}">${esc(c)}</span>`;
const qName = ["Común", "Raro", "Épico", "Legendario"];

// mejores hunts para un nivel (por eficiencia exp/HP, con densidad)
function rankHunts(level, rate) {
  return S.G.hunts.filter(h => h.min <= level).map(h => {
    const a = C.huntAvg(h), epk = C.expPerKill(a.exp, level, rate);
    return { h, a, epk, eff: a.exp / a.hp, toNext: (C.expForLevel(level + 1) - C.expForLevel(level)) / epk };
  });
}
function bestHuntsFor(level, rate, n = 3) {
  const all = rankHunts(level, rate);
  const tier = C.tierFor(level);
  const near = all.filter(x => x.h.lv >= Math.max(1, tier - 100));
  return near.sort((a, b) => b.epk * Math.min(1, b.eff / maxEff(near)) - a.epk * Math.min(1, a.eff / maxEff(near))).slice(0, n);
}
const maxEff = (arr) => Math.max(...arr.map(x => x.eff));

// SVG de líneas simple
function lineChart(series, { w = 760, h = 240, xMin, xMax, yLog = false, marks = [], yLabel = "" } = {}) {
  const pad = { l: 52, r: 12, t: 12, b: 26 };
  const xs = series.flatMap(s => s.pts.map(p => p[0])), ys = series.flatMap(s => s.pts.map(p => p[1])).filter(v => v > 0);
  xMin ??= Math.min(...xs); xMax ??= Math.max(...xs);
  let yMin = yLog ? Math.min(...ys) : 0, yMax = Math.max(...ys);
  const ty = (v) => yLog ? (Math.log10(v) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin)) : (v - yMin) / (yMax - yMin);
  const X = (x) => pad.l + (x - xMin) / (xMax - xMin) * (w - pad.l - pad.r), Y = (y) => h - pad.b - ty(Math.max(y, yLog ? yMin : -Infinity)) * (h - pad.t - pad.b);
  let g = "";
  const ticks = yLog ? [...Array(Math.ceil(Math.log10(yMax)) - Math.floor(Math.log10(yMin)) + 1)].map((_, i) => 10 ** (Math.floor(Math.log10(yMin)) + i)).filter(v => v >= yMin && v <= yMax) : [0, .25, .5, .75, 1].map(f => yMin + f * (yMax - yMin));
  for (const v of ticks) g += `<line x1="${pad.l}" x2="${w - pad.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${pad.l - 6}" y="${Y(v) + 4}" text-anchor="end">${short(v)}</text>`;
  for (let x = Math.ceil(xMin / 100) * 100; x <= xMax; x += 100) g += `<text x="${X(x)}" y="${h - 8}" text-anchor="middle">${x}</text>`;
  for (const m of marks) g += `<line x1="${X(m.x)}" x2="${X(m.x)}" y1="${pad.t}" y2="${h - pad.b}" stroke="${m.c || "var(--acc)"}" stroke-dasharray="4 4"/><text x="${X(m.x) + 4}" y="${pad.t + 10}" style="fill:${m.c || "var(--acc)"}" text-anchor="start">${esc(m.t)}</text>`;
  for (const s of series) g += `<polyline fill="none" stroke="${s.c}" stroke-width="2" points="${s.pts.map(p => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(" ")}"/>`;
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(yLabel)}">${g}</svg>`;
}

// ================= HOY =================
function pageHome(root) {
  const G = S.G;
  const draw = () => {
    const p = S.profile, rate = rateFor(p), today = C.vocsOfDay(), tomorrow = C.vocsOfDay(Date.now() + 864e5);
    const rk = C.rankFor(p.elo), kagePct = Math.min(1, p.elo / 20000);
    const best = bestHuntsFor(p.level, rate);
    const evs = nextOccurrences().slice(0, 5);
    const bands = C.taskBandsFor(p.level).filter(b => b.open && b.diff !== "baixa");
    const topBand = bands.sort((a, b) => C.taskElo(b.band, "extensa", b.diff) - C.taskElo(a.band, "extensa", a.diff))[0];
    const nextSaga = G.sagas[p.sagas];
    const isDay = today.includes(p.voc);
    root.innerHTML = `
    <div class="hero">
      <div class="flex between"><div>
        <h1 class="mt0">${p.name ? `Hola, ${esc(p.name)}` : "Bienvenido, ninja"} 👋</h1>
        <p class="mt0">Tu centro de mando para NTO Idle en español. Completá tu perfil y todo el sitio se ajusta a tu personaje: hunts, tasks, misiones y el camino a Hokage.</p>
      </div>
      <div class="flex"><span class="pill acc">Level ${p.level}</span>${p.voc ? `<span class="pill">${esc(p.voc)}</span>` : ""}<span class="pill ch">${esc(rk.name)} · ${fmt(p.elo)} elo</span></div></div>
      <div class="small mute" style="margin-top:8px">Camino a Kage (20.000 elo)</div>
      <div class="progress"><i style="width:${(kagePct * 100).toFixed(1)}%"></i></div>
      <div class="small mute">${pct(kagePct)} · faltan ${fmt(Math.max(0, 20000 - p.elo))} elo · sagas ${p.sagas}/36 · tasks ${p.tasks}/50 — <a href="#/hokage">ver plan completo</a></div>
    </div>

    <div class="card">${profileForm(p)}</div>

    <div class="grid g3">
      <div class="stat"><div class="k">Personaje del día</div><div class="v" style="font-size:19px">${today.map(esc).join(" · ")}</div>
        <div class="s">${isDay ? `<b style="color:var(--ok)">¡Es el tuyo! ×1,5 exp y entrenamiento hoy.</b>` : `×1,5 exp y entrenamiento. Mañana: ${tomorrow.map(esc).join(" · ")}`}</div></div>
      <div class="stat"><div class="k">Tu multiplicador de exp</div><div class="v">×${fmt(rate, 2)}</div>
        <div class="s">${!p.stamina ? "Recuperá stamina verde (+30%)." : "Stamina verde activa."} ${p.level >= 200 && !p.pvp ? "Modo PvP daría +30%." : ""}</div></div>
      <div class="stat"><div class="k">Para subir 1 level</div><div class="v">${best[0] ? short(best[0].toNext) : "—"} kills</div>
        <div class="s">${best[0] ? `en ${esc(best[0].h.n)} · ${hours(best[0].toNext / (p.kpm * 60))} a ${fmt(p.kpm)} kills/min` : ""}</div></div>
    </div>

    <h2>Próximos eventos <span class="small mute">(en tu hora local)</span></h2>
    <div class="tw"><table><tbody>${evs.map(e => `<tr class="${e.hot ? "hl" : ""}"><td>${e.ic}</td><td><b>${esc(e.name)}</b><div class="small mute">${esc(e.what)}</div></td>
      <td class="r"><b class="num">${localTime(e.at)}</b><div class="small mute">${localDay(e.at)}</div></td><td class="r countdown" data-at="${+e.at}">${countdown(e.at)}</td></tr>`).join("")}</tbody></table></div>

    <h2>Qué hacer ahora con tu personaje</h2>
    <div class="grid g2">
      <div class="card"><h3>🗺️ Dónde cazar</h3>${best.map((x, i) => `<div class="flex between" style="padding:6px 0;border-bottom:1px solid var(--line)">
          <div><b>${i + 1}. ${esc(x.h.n)}</b><div class="small mute">${x.h.mon.map(m => esc(m[0])).join(", ")} · set ${esc(G.sets.find(s => s.id === x.h.set)?.n || "")}</div></div>
          <div class="r"><span class="num">${short(x.epk)}</span> <span class="small mute">exp/kill</span></div></div>`).join("")}
        <p class="small mute">Ordenadas por exp por kill ajustada por la vida de los monstruos (menos vida = kills más rápidos). <a href="#/hunts">Ver todas</a></p></div>
      <div class="card"><h3>📜 Task recomendada</h3>${topBand ? `<p><b>Extensa (1.000 kills) · ${C.TASK_DIFF.find(d => d.id === topBand.diff).es}</b> en la faixa ${topBand.band}: <b class="num">+${C.taskElo(topBand.band, "extensa", topBand.diff)} elo</b> por task.</p>
        <p class="small ink2">La extensa diluye la tarifa de aceptación (25 kills) y da 3 cartas de caza. ${topBand.diff === "dificil" ? "La difícil multiplica el elo ×1,6: si aguantás esos monstruos, es la mejor." : ""}</p>` : "<p>Sin tasks abiertas.</p>"}
        <p class="small"><a href="#/tasks">Calculadora de tasks</a></p>
        <h3>🧭 Misiones</h3><p class="small ink2">Mandá a tu personaje siempre en misión mientras cazás: no te frena y suma exp, gold, piedras de refino y elo (+1 a +25). <a href="#/misiones">Ver cuál conviene</a></p>
        <h3>👹 Próxima saga</h3>${nextSaga ? `<p><b>${esc(nextSaga.n)}</b> · level ${nextSaga.lv} · ${short(nextSaga.hp)} HP · <span class="pill acc">+25 elo</span> ${p.level >= nextSaga.lv ? `<span class="pill ok">disponible</span>` : `<span class="pill">level ${nextSaga.lv}</span>`}</p>` : `<p class="pill ok">¡Todas las sagas hechas!</p>`}
      </div>
    </div>
    ${footer()}`;
    bindProfileForm(root, (_, k) => { if (k !== "name") draw(); });
  };
  draw();
  return { tick: () => $$(".countdown", root).forEach(el => el.textContent = countdown(new Date(+el.dataset.at))) };
}

// ================= GUÍA =================
function pageGuide(root, sub) {
  root.innerHTML = `<h1>Guía completa de NTO Idle en español</h1>
    <p class="ink2">Todo lo que dice la wiki oficial, traducido, ordenado y con el <b>porqué</b> de cada mecánica (sacado del código del juego). Leela una vez de punta a punta: muchas decisiones que tomaste sin entender se van a aclarar.</p>
    <div class="toc">${GUIDE.map(s => `<a href="#/guia/${s.id}">${s.t}</a>`).join("")}</div>
    <div class="guide">${GUIDE.map(s => `<h2 id="g-${s.id}">${s.t}</h2>${s.html(S.G)}`).join("")}</div>${footer()}`;
  if (sub) setTimeout(() => document.getElementById("g-" + sub)?.scrollIntoView({ behavior: "smooth" }), 50);
  $$(".toc a", root).forEach(a => a.onclick = (e) => { e.preventDefault(); const id = a.getAttribute("href").split("/").pop(); history.replaceState(null, "", "#/guia/" + id); document.getElementById("g-" + id)?.scrollIntoView({ behavior: "smooth" }); });
}

// ================= EXP =================
function pageExp(root) {
  const G = S.G;
  const st = { to: Math.min(1000, S.profile.level + 50), hunt: "" , event: false, dayVoc: false };
  const draw = () => {
    const p = S.profile;
    const rate = rateFor(p, { event: st.event ? 2 : 0, dayVoc: st.dayVoc || C.vocsOfDay().includes(p.voc) });
    const hunts = rankHunts(p.level, rate).sort((a, b) => b.epk - a.epk);
    const chosen = hunts.find(x => x.h.id === st.hunt) || bestHuntsFor(p.level, rate, 1)[0];
    const to = Math.max(p.level + 1, Math.min(1000, st.to));
    const kills = chosen ? C.killsToLevel(p.level, p.pct, to, chosen.a.exp, rate) : Infinity;
    const h = kills / (p.kpm * 60);
    // tramo largo: usando la mejor hunt disponible en cada level
    let longK = 0; for (let L = p.level; L < to; L++) { const base = C.bestHuntExpFor(L); longK += (C.expForLevel(L + 1) - C.expForLevel(L)) * (L === p.level ? 1 - p.pct / 100 : 1) / (base * C.stageMult(L) * C.BAL.expMult * rateFor({ ...p, level: L }, { event: st.event ? 2 : 0 })); }
    const curvePts = G.curve.map((c, i) => [i + 1, c[1]]);
    const killsPts = []; for (let L = 10; L < 1000; L += 5) killsPts.push([L, (C.expForLevel(L + 1) - C.expForLevel(L)) / (C.bestHuntExpFor(L) * C.stageMult(L) * C.BAL.expMult * 1.3)]);
    root.innerHTML = `<h1>Calculadora de EXP y niveles</h1>
    <p class="ink2">Cuántos kills y cuántas horas te faltan para un level, con todos los multiplicadores reales del juego.</p>
    <div class="card">${profileForm(p, { full: true })}
      <div class="form" style="margin-top:12px">
        <div class="field"><label>Level objetivo</label><input type="number" id="to" min="2" max="1000" value="${to}"></div>
        <div class="field" style="min-width:260px"><label>Hunt</label><select id="hunt">${hunts.slice(0, 60).map(x => `<option value="${esc(x.h.id)}" ${x === chosen ? "selected" : ""}>${esc(x.h.n)} (lv ${x.h.lv}) · ${short(x.epk)} exp/kill</option>`).join("")}</select></div>
        <label class="check"><input type="checkbox" id="ev" ${st.event ? "checked" : ""}> Evento ×2 EXP</label>
      </div></div>
    <div class="grid g4">
      <div class="stat"><div class="k">Multiplicador total</div><div class="v">×${fmt(rate, 2)}</div><div class="s">${p.level >= 650 ? "Tope ×3,5 desde el level 650 (sin contar eventos)." : "incluye ×0,85 base aparte"}</div></div>
      <div class="stat"><div class="k">Exp por kill</div><div class="v">${chosen ? short(chosen.epk) : "—"}</div><div class="s">${chosen ? esc(chosen.h.n) : ""}</div></div>
      <div class="stat"><div class="k">Kills hasta el ${to}</div><div class="v">${short(kills)}</div><div class="s">en esa hunt, sin cambiar</div></div>
      <div class="stat"><div class="k">Tiempo estimado</div><div class="v">${hours(h)}</div><div class="s">a ${fmt(p.kpm)} kills/min · ${hours(h / Math.max(.5, p.hoursDay) * 24)} jugando ${fmt(p.hoursDay)} h/día</div></div>
    </div>
    <div class="callout ch"><b>Si vas cambiando de hunt a medida que subís</b>Usando siempre la mejor hunt de tu nivel: <b class="num">${short(longK)}</b> kills ≈ <b>${hours(longK / (p.kpm * 60))}</b> de caza (${hours(longK / (p.kpm * 60) / Math.max(.5, p.hoursDay) * 24)} a tu ritmo diario).</div>

    <h2>La curva de exp del juego</h2>
    <p class="ink2">Multiplicador de “stage” por level (lo que multiplica la exp de cada monstruo). Es altísimo al principio y cae fuerte entre el 450 y el 550: ahí empieza el juego largo.</p>
    <div class="card">${lineChart([{ c: "var(--acc)", pts: curvePts }], { yLog: true, marks: [{ x: p.level, t: "tú" }, { x: 450, t: "450", c: "var(--chakra)" }, { x: 650, t: "tope ×3,5", c: "var(--bad)" }], yLabel: "Multiplicador por level" })}</div>
    <h2>Kills necesarios por level</h2>
    <p class="ink2">Con la mejor hunt de cada level y stamina verde. Fijate el salto después del 450: del 500 al 1000 se necesitan ~340.000 kills.</p>
    <div class="card">${lineChart([{ c: "var(--chakra)", pts: killsPts }], { yLog: true, marks: [{ x: p.level, t: "tú" }], yLabel: "Kills por level" })}</div>
    <div class="tw"><table><thead><tr><th>Tramo</th><th class="r">Kills (mejor hunt)</th><th class="r">Horas a ${fmt(p.kpm)} k/min</th></tr></thead><tbody>
      ${[[8, 100], [100, 200], [200, 300], [300, 400], [400, 450], [450, 500], [500, 600], [600, 700], [700, 800], [800, 900], [900, 1000]].map(([a, b]) => { let k = 0; for (let L = a; L < b; L++) k += (C.expForLevel(L + 1) - C.expForLevel(L)) / (C.bestHuntExpFor(L) * C.stageMult(L) * C.BAL.expMult * 1.3); return `<tr class="${p.level >= a && p.level < b ? "hl" : ""}"><td>${a} → ${b}</td><td class="r num">${fmt(k)}</td><td class="r num">${hours(k / (p.kpm * 60))}</td></tr>`; }).join("")}
    </tbody></table></div>
    ${footer()}`;
    bindProfileForm(root, () => draw());
    $("#to").oninput = (e) => { st.to = Number(e.target.value); clearTimeout(st.t); st.t = setTimeout(draw, 400); };
    $("#hunt").onchange = (e) => { st.hunt = e.target.value; draw(); };
    $("#ev").onchange = (e) => { st.event = e.target.checked; draw(); };
  };
  draw();
}

// ================= HUNTS =================
function pageHunts(root) {
  const G = S.G;
  const st = { q: "", all: false, sort: "score", dir: -1, level: null };
  const draw = () => {
    const p = S.profile, level = st.level ?? p.level, rate = rateFor({ ...p, level });
    let rows = G.hunts.map(h => { const a = C.huntAvg(h), epk = C.expPerKill(a.exp, level, rate); return { h, a, epk, eff: a.exp / a.hp, ok: h.min <= level }; });
    const okRows = rows.filter(r => r.ok); const mE = Math.max(...okRows.map(r => r.eff)), mK = Math.max(...okRows.map(r => r.epk));
    rows.forEach(r => r.score = r.ok ? (r.epk / mK) * 0.6 + (r.eff / mE) * 0.4 : -1);
    if (!st.all) rows = rows.filter(r => r.ok && r.h.lv >= C.tierFor(level) - 150);
    if (st.q) { const q = st.q.toLowerCase(); rows = rows.filter(r => r.h.n.toLowerCase().includes(q) || r.h.mon.some(m => m[0].toLowerCase().includes(q))); }
    const key = { score: r => r.score, lv: r => r.h.lv, epk: r => r.epk, eff: r => r.eff, hp: r => r.a.hp, dps: r => r.a.dps, set: r => r.a.sd, tot: r => r.h.tot }[st.sort];
    rows.sort((a, b) => (key(a) - key(b)) * st.dir);
    const th = (k, t, r = true) => `<th class="sort ${r ? "r" : ""}" data-s="${k}">${t}${st.sort === k ? (st.dir < 0 ? " ↓" : " ↑") : ""}</th>`;
    root.innerHTML = `<h1>Buscador de hunts</h1>
    <p class="ink2">Las 160 hunts del juego con la exp que te dan <b>a vos</b> (level y multiplicadores de tu perfil). El “puntaje” mezcla exp por kill (60%) y exp por punto de vida del monstruo (40%): monstruos con poca vida mueren más rápido y rinden más exp por hora.</p>
    <div class="card"><div class="form">
      <div class="field"><label>Level</label><input type="number" id="lv" value="${level}" min="1" max="1000"></div>
      <div class="field"><label>Buscar hunt o monstruo</label><input type="search" id="q" value="${esc(st.q)}" placeholder="Ej: Konchu, Templo…"></div>
      <label class="check"><input type="checkbox" id="all" ${st.all ? "checked" : ""}> Mostrar todas (también bloqueadas)</label>
      <span class="pill">×${fmt(rate, 2)} exp</span>
    </div></div>
    <div class="tw"><table><thead><tr><th>Hunt</th>${th("lv", "Lv")}${th("score", "Puntaje")}${th("epk", "Exp/kill")}${th("eff", "Exp/HP")}${th("hp", "HP medio")}${th("dps", "DPS medio")}${th("tot", "Monstruos")}${th("set", "Set: kills/pieza")}<th class="r">Kills/level</th></tr></thead><tbody>
    ${rows.map(r => { const set = G.sets.find(s => s.id === r.h.set); const toNext = (C.expForLevel(level + 1) - C.expForLevel(level)) / r.epk;
      return `<tr class="${r.ok ? "" : "dim"}"><td><b>${esc(r.h.n)}</b><div class="small mute">${r.h.mon.map(m => `${esc(m[0])} ×${m[1]}`).join(" · ")}${r.h.fl > 1 ? ` · ${r.h.fl} pisos` : ""}${r.ok ? "" : ` · abre en el ${r.h.min}`}</div></td>
      <td class="r num">${r.h.lv}</td><td class="r"><div class="bar"><i style="width:${Math.max(0, r.score * 100).toFixed(0)}%"></i></div></td><td class="r num">${short(r.epk)}</td><td class="r num">${fmt(r.eff, 3)}</td>
      <td class="r num">${short(r.a.hp)}</td><td class="r num">${short(r.a.dps)}</td><td class="r num">${r.h.tot}</td>
      <td class="r"><span class="small">${esc(set?.n || "")}</span><div class="num small">${r.a.sd ? fmt(1 / r.a.sd) : "—"}</div></td><td class="r num">${r.ok ? short(toNext) : "—"}</td></tr>`; }).join("") || `<tr><td colspan="10" class="empty">Nada con ese filtro.</td></tr>`}
    </tbody></table></div>
    <div class="callout"><b>Cómo leer el DPS</b>Es el daño por segundo que hace en promedio un monstruo de esa hunt. Comparalo con tu vida y tu cura: si tu Auto Heal no alcanza, bajá de hunt aunque dé menos exp. Morir sin <i>Amulet of Loss</i> te tira la mochila entera.</div>
    ${footer()}`;
    $("#lv").oninput = (e) => { st.level = Number(e.target.value) || 1; clearTimeout(st.t); st.t = setTimeout(draw, 350); };
    $("#q").oninput = (e) => { st.q = e.target.value; clearTimeout(st.t); st.t = setTimeout(() => { draw(); $("#q").focus(); $("#q").setSelectionRange(99, 99); }, 250); };
    $("#all").onchange = (e) => { st.all = e.target.checked; draw(); };
    $$("th.sort", root).forEach(t => t.onclick = () => { const k = t.dataset.s; st.dir = st.sort === k ? -st.dir : -1; st.sort = k; draw(); });
  };
  draw();
}

// ================= TASKS =================
function pageTasks(root) {
  const G = S.G;
  const draw = () => {
    const p = S.profile, bands = C.taskBandsFor(p.level).filter(b => b.diff !== "baixa" || b.band >= C.tierFor(p.level) - 100);
    const fee = C.taskFee(p.level);
    const elites = G.tasks.elite;
    root.innerHTML = `<h1>Tasks y elo</h1>
    <p class="ink2">Las tasks son la principal fuente de <b>elo</b> (el ranking que define a los Kages). Elegís una especie y una cantidad; lo que cazás cuenta solo.</p>
    <div class="card">${profileForm(p)}</div>
    <div class="grid g3">
      <div class="stat"><div class="k">Tarifa para aceptar</div><div class="v">${money(fee)}</div><div class="s">≈ el oro de 25 kills de tu faixa</div></div>
      <div class="stat"><div class="k">Task diaria</div><div class="v">+12 elo</div><div class="s">200 kills · recompensa ×1,5 · hacela siempre</div></div>
      <div class="stat"><div class="k">Para la patente Kage</div><div class="v">${fmt(p.tasks)} / 50</div><div class="s">tasks completadas (las “muy fáciles” no cuentan)</div></div>
    </div>
    <h2>Elo por task según la faixa (para tu level ${p.level})</h2>
    <div class="tw"><table><thead><tr><th>Faixa</th><th>Dificultad</th><th>Estado</th><th class="r">Corta (150)</th><th class="r">Larga (400)</th><th class="r">Extensa (1.000)</th><th class="r">Elo cada 1.000 kills</th></tr></thead><tbody>
    ${bands.map(b => { const d = C.TASK_DIFF.find(x => x.id === b.diff); const e = (dur) => C.taskElo(b.band, dur, b.diff);
      return `<tr class="${b.open && b.diff === "dificil" ? "hl" : b.open ? "" : "dim"}"><td class="num">${b.band}</td><td>${d.es} <span class="small mute">(×${d.elo} elo)</span></td>
      <td>${b.open ? `<span class="pill ok">abierta</span>` : `<span class="pill">abre en ${b.entry - (b.diff === "dificil" ? 10 : 0)}</span>`}</td>
      <td class="r num">${e("curta")}</td><td class="r num">${e("longa")}</td><td class="r num"><b>${e("extensa")}</b></td><td class="r num">${fmt(e("extensa"))}</td></tr>`; }).join("")}
    </tbody></table></div>
    <div class="callout"><b>Regla de oro de las tasks</b>Elo por task = (2 + faixa ÷ 50) × tamaño × dificultad. El tamaño casi no cambia el elo por kill (Corta 1/150, Larga 2,6/400, Extensa 6,5/1.000) pero la <b>Extensa paga una sola tarifa</b> y da 3 cartas de caza. La <b>Difícil multiplica ×1,6</b> (faixa de arriba, se abre 10 levels antes). Así que: siempre Extensa, y Difícil si tu personaje aguanta esos monstruos.</div>
    <div class="callout ch"><b>Apilá todo sobre la misma especie</b>Un mismo kill cuenta a la vez para tu task, la <b>task élite</b> de esa especie (+50 elo), la <b>task diaria</b>, el <b>Prey</b> (bonus de exp/loot y 1 punto de jutsu cada 60 kills) y el <b>Bestiario</b> (+5/+10/+20 elo por etapa). Elegí la especie de tu task y poné ahí el Prey.</div>
    <h2>Tasks élite (+50 elo cada una, 1.000 kills)</h2>
    <div class="tw"><table><thead><tr><th>Monstruo</th><th class="r">Level</th><th>Hunts donde está</th><th>Pieza de set</th></tr></thead><tbody>
    ${elites.map(t => { const hs = G.hunts.filter(h => h.mon.some(m => m[0] === t.monster)).map(h => h.n); return `<tr class="${p.level >= t.minLevel ? "" : "dim"}"><td><b>${esc(t.monster)}</b></td><td class="r num">${t.minLevel}</td><td class="small">${hs.slice(0, 3).map(esc).join(" · ")}${hs.length > 3 ? ` +${hs.length - 3}` : ""}</td><td>${t.noPiece ? `<span class="pill">sin pieza</span>` : `<span class="pill ok">da pieza Rara+</span>`}</td></tr>`; }).join("")}
    </tbody></table></div>
    <h2>Recompensa en exp y gold de la mejor especie de cada faixa</h2>
    <div class="tw"><table><thead><tr><th>Faixa</th><th>Monstruo</th><th class="r">Exp base (Extensa, Media)</th><th class="r">Gold (Extensa, Media)</th></tr></thead><tbody>
    ${bands.filter(b => b.open).map(b => { const ms = G.monsters.filter(m => m.lv === b.band).sort((x, y) => y.exp - x.exp); const m = ms[0]; if (!m) return ""; return `<tr><td class="num">${b.band}</td><td>${esc(m.n)}</td><td class="r num">${short(C.taskExp(m, "extensa", "media") * C.stageMult(p.level) * C.BAL.expMult)}</td><td class="r num">${money(C.taskGold(m, "extensa", "media"))}</td></tr>`; }).join("")}
    </tbody></table></div>
    <p class="small mute">La exp de la task se multiplica por tu stage de level (igual que la de los kills).</p>
    ${footer()}`;
    bindProfileForm(root, () => draw());
  };
  draw();
}

// ================= HOKAGE =================
function pageHokage(root) {
  const G = S.G;
  const st = { diff: "auto", mech: 3, ms: "SS", useElite: true };
  const draw = () => {
    const p = S.profile, killsDay = p.kpm * 60 * p.hoursDay;
    const bands = C.taskBandsFor(p.level).filter(b => b.open && b.diff !== "baixa");
    let band = bands.find(b => b.diff === (st.diff === "auto" ? "dificil" : st.diff)) || bands.find(b => b.diff === "media") || bands[0];
    const tElo = band ? C.taskElo(band.band, "extensa", band.diff) : 0;
    const eloTasksDay = killsDay / 1000 * tElo;
    const rk = C.MISSION_RANKS[st.ms]; const missionsDay = Math.floor(24 / rk.h) * rk.elo;
    const mechAvail = G.mech.filter(m => m.lv <= p.level).length; const mechDay = Math.min(st.mech, mechAvail) * 10;
    const daily = 12;
    const perDay = eloTasksDay + missionsDay + mechDay + daily;
    const eliteLeft = st.useElite ? G.tasks.elite.filter(t => t.minLevel <= p.level).length * 50 : 0;
    const sagasLeft = (36 - p.sagas) * 25;
    const need = Math.max(0, 20000 - p.elo - eliteLeft - sagasLeft);
    const days = perDay > 0 ? need / perDay : Infinity;
    const parts = [["Tasks Extensas", eloTasksDay, "var(--acc)"], ["Misiones", missionsDay, "var(--chakra)"], ["Desafíos con mecánica", mechDay, "var(--q3)"], ["Task diaria", daily, "var(--ok)"]];
    root.innerHTML = `<h1>Camino a Hokage 🍥</h1>
    <p class="ink2">El Hokage no es el de más level: es el <b>1º del ranking de elo</b> entre quienes cumplen la patente Kage. El servidor recalcula el top 5 cada minuto: 1º Hokage (Konoha), 2º Kazekage (Suna), 3º Raikage (Kumo), 4º Mizukage (Kiri), 5º Tsuchikage (Iwa).</p>
    <div class="grid g3">
      <div class="stat"><div class="k">Elo</div><div class="v">${fmt(p.elo)} / 20.000</div><div class="progress"><i style="width:${Math.min(100, p.elo / 200).toFixed(1)}%"></i></div></div>
      <div class="stat"><div class="k">Sagas</div><div class="v">${p.sagas} / 36</div><div class="progress"><i style="width:${(p.sagas / 36 * 100).toFixed(1)}%"></i></div><div class="s">la última (Kaguya) pide level 600</div></div>
      <div class="stat"><div class="k">Tasks</div><div class="v">${p.tasks} / 50</div><div class="progress"><i style="width:${Math.min(100, p.tasks / 50 * 100).toFixed(1)}%"></i></div></div>
    </div>
    <div class="card">${profileForm(p, { full: true })}
      <div class="form" style="margin-top:12px">
        <div class="field"><label>Dificultad de task</label><select id="diff"><option value="auto">La mejor abierta</option><option value="media" ${st.diff === "media" ? "selected" : ""}>Media</option><option value="facil" ${st.diff === "facil" ? "selected" : ""}>Fácil</option></select></div>
        <div class="field"><label>Rank de misión</label><select id="ms">${Object.keys(C.MISSION_RANKS).map(k => `<option ${k === st.ms ? "selected" : ""}>${k}</option>`).join("")}</select></div>
        <div class="field"><label>Desafíos con mecánica/día</label><input type="number" id="mech" min="0" max="17" value="${st.mech}"></div>
        <label class="check"><input type="checkbox" id="el" ${st.useElite ? "checked" : ""}> Contar tasks élite</label>
      </div></div>
    <div class="grid g2">
      <div class="card"><h3>Tu elo por día</h3>
        ${parts.map(([n, v, c]) => `<div class="flex between"><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${c};margin-right:6px"></i>${n}</span><b class="num">+${fmt(v)}</b></div><div class="bar"><i style="width:${(v / perDay * 100).toFixed(1)}%;background:${c}"></i></div>`).join("")}
        <div class="flex between" style="margin-top:10px;font-size:18px"><b>Total</b><b class="num">+${fmt(perDay)} elo/día</b></div>
        <p class="small mute">${fmt(killsDay)} kills/día (${fmt(p.kpm)}/min × ${fmt(p.hoursDay)} h) en tasks Extensas ${band ? `${C.TASK_DIFF.find(d => d.id === band.diff).es} de la faixa ${band.band} (+${tElo} elo c/u)` : ""}.</p></div>
      <div class="card"><h3>Pronóstico</h3>
        <dl class="kv"><dt>Elo de una vez (sagas que faltan)</dt><dd class="num">+${fmt(sagasLeft)}</dd><dt>Elo de una vez (élites disponibles)</dt><dd class="num">+${fmt(eliteLeft)}</dd><dt>Falta cubrir por día</dt><dd class="num">${fmt(need)}</dd></dl>
        <div class="stat" style="margin-top:10px"><div class="k">Días hasta 20.000 elo</div><div class="v">${isFinite(days) ? fmt(Math.ceil(days)) : "∞"}</div><div class="s">${isFinite(days) ? `≈ ${new Date(Date.now() + days * 864e5).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}` : ""}</div></div>
        <p class="small ink2">Ojo: llegar a 20.000 te da la patente, pero el título depende de estar en el <b>top 5 de elo</b>. Con 600 jugadores hoy, el que llegue primero y no pare de sumar se queda con el Hokage.</p></div>
    </div>
    <h2>Estrategia para ser Hokage</h2>
    <div class="card">
      <ol>
        <li><b>Un solo personaje principal.</b> El elo es por personaje. Concentrá todo en uno; los otros dos slots de misión de la cuenta pueden ser alts que farmean piedras/oro.</li>
        <li><b>Subí rápido hasta ~450.</b> Hasta ahí cada level cuesta pocos kills (la curva es generosa) y las tasks de faixas altas dan más elo por kill: (2 + faixa/50). Una Extensa Difícil de faixa 500 da 125 elo; una de faixa 200, 62.</li>
        <li><b>Siempre una task Extensa activa</b> (Difícil si aguantás), la diaria y la élite de la misma especie. Prey en esa especie.</li>
        <li><b>Misión siempre corriendo.</b> Una SS cada 12 h (+25) o una S cada 8 h (+18) mientras cazás. No te frena.</li>
        <li><b>Sagas en orden:</b> 36 × 25 = 900 elo y son obligatorias para la patente. La última (Kaguya Ōtsutsuki) es level 600.</li>
        <li><b>Desafíos con mecánica en party</b> (hasta 3 del clan): +10 elo cada uno por día, más collar/anillo/escudo. Acá el clan hispano marca la diferencia: tank + soporte + daño.</li>
        <li><b>No te mueras.</b> Perder la mochila o exp te frena días. Usá Amulet of Loss y bless.</li>
      </ol>
    </div>
    ${footer()}`;
    bindProfileForm(root, () => draw());
    $("#diff").onchange = (e) => { st.diff = e.target.value; draw(); };
    $("#ms").onchange = (e) => { st.ms = e.target.value; draw(); };
    $("#mech").oninput = (e) => { st.mech = Number(e.target.value); clearTimeout(st.t); st.t = setTimeout(draw, 300); };
    $("#el").onchange = (e) => { st.useElite = e.target.checked; draw(); };
  };
  draw();
}

// ================= MISIONES =================
function pageMissions(root) {
  const G = S.G;
  const draw = () => {
    const p = S.profile;
    const rows = G.missions.map(m => { const r = C.missionReward(m, p.level); const h = m.ms / 3.6e6; return { m, r, h, ok: p.level >= m.level }; });
    const best = rows.filter(x => x.ok).sort((a, b) => b.r.exp / b.h - a.r.exp / a.h)[0];
    root.innerHTML = `<h1>Misiones</h1>
    <p class="ink2">Mandás al personaje en una misión y <b>seguís jugando con él</b>: cuando termina recibe exp, gold, la arma del set, piedras de refino y elo. Hasta 3 personajes de la cuenta en misión a la vez. Cuesta el 10% de lo que paga.</p>
    <div class="card">${profileForm(p)}</div>
    ${best ? `<div class="callout ok"><b>Mejor exp por hora para vos: ${esc(best.m.name)} (Rank ${best.m.rank})</b>${short(best.r.exp * C.BAL.expMult)} exp en ${hours(best.h)} → ${short(best.r.exp * C.BAL.expMult / best.h)} exp/h. Si no vas a estar para reenviarla, elegí una más larga (S u SS) para no dejar el slot vacío.</div>` : ""}
    <div class="tw"><table><thead><tr><th>Misión</th><th>Rank</th><th class="r">Level</th><th class="r">Duración</th><th class="r">Exp</th><th class="r">Exp/h</th><th class="r">Gold</th><th class="r">Elo</th><th class="r">Arma</th><th class="r">Piedra</th><th class="r">Suprema</th><th class="r">Extra</th></tr></thead><tbody>
    ${rows.map(x => `<tr class="${x === best ? "hl" : x.ok ? "" : "dim"}"><td><b>${esc(x.m.name)}</b></td><td><span class="pill ${x.m.rank.startsWith("S") ? "acc" : ""}">${x.m.rank}</span></td><td class="r num">${x.m.level}</td><td class="r num">${hours(x.h)}</td>
      <td class="r num">${short(x.r.exp * C.BAL.expMult)}</td><td class="r num">${short(x.r.exp * C.BAL.expMult / x.h)}</td><td class="r num">${money(x.r.gold)}</td><td class="r num">+${x.m.elo}</td>
      <td class="r num">${pct(x.m.weapon, 0)}</td><td class="r num">${x.m.stone ? (x.m.stone < 1 ? pct(x.m.stone, 0) : fmt(x.m.stone, 1)) : "—"}</td><td class="r num">${x.m.stoneHigh ? pct(x.m.stoneHigh, 0) : "—"}</td><td class="r num">${x.m.special && x.m.level >= 400 ? pct(x.m.special, 0) : "—"}</td></tr>`).join("")}
    </tbody></table></div>
    <div class="grid g2">
      <div class="card"><h3>Reglas que importan</h3><ul>
        <li>La recompensa se calcula por la <b>faixa de la misión</b>, no por tu level: una misión fácil rinde poco si estás muy arriba.</li>
        <li>Pide el <b>set de su faixa (o mejor) vestido</b>: cabeza, armadura, pantalón y botas. El set de la Tienda Premium sirve hasta las misiones del 500 al 699.</li>
        <li>Mientras dura no podés tomar otra misión ni ir al bazar. Abandonar = sin recompensa.</li>
        <li>La <b>arma del set solo sale de misiones</b> (casi siempre Común).</li>
        <li>Las piedras de refino solo salen de misiones; las <b>Supremas</b> (para piezas Legendarias) solo en A, S y SS.</li>
        <li>Item Extra (Nuvem da Akatsuki / Selo dos Cinco Kages / Olho do Rikudou) en A, S y SS desde el 400.</li></ul></div>
      <div class="card"><h3>Elo por día según el rank</h3><div class="tw" style="margin:0"><table><thead><tr><th>Rank</th><th class="r">Duración</th><th class="r">Elo</th><th class="r">Elo/día (sin huecos)</th></tr></thead><tbody>
        ${Object.entries(C.MISSION_RANKS).map(([k, v]) => `<tr><td>${k}</td><td class="r num">${hours(v.h)}</td><td class="r num">+${v.elo}</td><td class="r num">${fmt(24 / v.h * v.elo)}</td></tr>`).join("")}</tbody></table></div>
        <p class="small ink2">Todas rinden ~48–54 elo/día si las reenviás apenas terminan. Como nadie está despierto 24 h, la SS (2 por día) es la más realista para el personaje principal.</p></div>
    </div>
    ${footer()}`;
    bindProfileForm(root, () => draw());
  };
  draw();
}

// ================= FORJA =================
function pageForge(root) {
  const st = { from: 0, to: 7, stones: 15 };
  const draw = () => {
    const ex = C.forgeExpected(st.from, st.to);
    // probabilidad de llegar con N piedras (DP)
    const dp = (n) => { let d = new Array(11).fill(0); d[st.from] = 1; let reached = 0; for (let i = 0; i < n; i++) { const nd = new Array(11).fill(0); for (let f = st.from; f < st.to; f++) { if (!d[f]) continue; const pp = C.FORGE.chances[f]; nd[f + 1] += d[f] * pp; nd[f] += d[f] * (1 - pp); } reached += nd[st.to]; nd[st.to] = 0; d = nd; } return reached; };
    const probs = [5, 10, 15, 20, 30, 40, 60].map(n => [n, dp(n)]);
    root.innerHTML = `<h1>Dragon Forge</h1>
    <p class="ink2">Dos trabajos: <b>refinar</b> una pieza (+1 a +10, cada nivel da +5% de atributos) y <b>subir su rareza</b> con esencias. En el código del juego, si el refino falla <b>solo perdés la piedra</b>: la pieza no baja.</p>
    <div class="card"><div class="form">
      <div class="field"><label>Desde +</label><input type="number" id="f" min="0" max="9" value="${st.from}"></div>
      <div class="field"><label>Hasta +</label><input type="number" id="t" min="1" max="10" value="${st.to}"></div>
    </div></div>
    <div class="grid g3">
      <div class="stat"><div class="k">Piedras esperadas</div><div class="v">${fmt(ex.stones, 1)}</div><div class="s">promedio para ir de +${st.from} a +${st.to}</div></div>
      <div class="stat"><div class="k">Atributos al final</div><div class="v">×${fmt(ex.statMult, 2)}</div><div class="s">sobre la pieza base (+${st.to * 5}%)</div></div>
      <div class="stat"><div class="k">Piedra que usa</div><div class="v" style="font-size:17px">Común / Suprema</div><div class="s">Las Legendarias piden la Suprema (solo misiones A/S/SS)</div></div>
    </div>
    <div class="grid g2">
      <div class="tw"><table><thead><tr><th>Paso</th><th class="r">Chance</th><th class="r">Piedras promedio</th></tr></thead><tbody>
        ${C.FORGE.chances.map((c, f) => `<tr class="${f >= st.from && f < st.to ? "hl" : ""}"><td>+${f} → +${f + 1}</td><td class="r num">${pct(c, 0)}</td><td class="r num">${fmt(1 / c, 2)}</td></tr>`).join("")}</tbody></table></div>
      <div class="tw"><table><thead><tr><th>Si juntás…</th><th class="r">Probabilidad de llegar a +${st.to}</th></tr></thead><tbody>
        ${probs.map(([n, pr]) => `<tr><td>${n} piedras</td><td class="r"><div class="flex" style="justify-content:flex-end"><span class="num">${pct(pr, 0)}</span><div class="bar ch" style="width:90px"><i style="width:${(pr * 100).toFixed(0)}%"></i></div></div></td></tr>`).join("")}</tbody></table></div>
    </div>
    <div class="callout"><b>Cuándo refinar</b>Refiná las piezas que vas a usar mucho tiempo (el set de tu faixa definitiva). Hasta +5 es barato (≈1,4 piedras por nivel); de +6 en adelante la chance se desploma (40% → 18%). El oro de cada intento sube con el nivel de refino.</div>
    <h2>Subir rareza con esencias</h2>
    <div class="tw"><table><thead><tr><th>Set</th><th>Esencia</th><th class="r">Común→Raro</th><th class="r">Raro→Épico</th><th class="r">Épico→Legendario</th><th class="r">Total por pieza</th><th class="r">Kills aprox.</th></tr></thead><tbody>
      <tr><td>Hashirama (500)</td><td>Essência de Chakra (1 cada ~540 kills en hunts Hashirama/Madara)</td><td class="r num">3</td><td class="r num">5</td><td class="r num">8</td><td class="r num">16</td><td class="r num">≈ ${fmt(16 * 540)}</td></tr>
      <tr><td>Madara Rikudou (700)</td><td>Essência de Chakra Pura (1 cada ~900 kills) + Essência de Chakra</td><td class="r num">3</td><td class="r num">5</td><td class="r num">8</td><td class="r num">16 + 16</td><td class="r num">≈ ${fmt(16 * 900)}</td></tr>
    </tbody></table></div>
    <p class="small ink2">Subir rareza no tiene sorteo: gastás las esencias y el oro y listo. Los demás sets solo se consiguen Raro+ por drop. Llevar un set de fin de juego entero a Legendario pasa de 100 h de caza.</p>
    ${footer()}`;
    $("#f").oninput = (e) => { st.from = Math.max(0, Math.min(9, Number(e.target.value))); if (st.to <= st.from) st.to = st.from + 1; draw(); };
    $("#t").oninput = (e) => { st.to = Math.max(st.from + 1, Math.min(10, Number(e.target.value))); draw(); };
  };
  draw();
}

// ================= SETS =================
function pageSets(root) {
  const G = S.G;
  const odds = (w) => C.rarityOdds(w);
  const coupon = 4 * (1 + 1 / 2 + 1 / 3 + 1 / 4); // drops para juntar las 4 piezas de ropa
  root.innerHTML = `<h1>Sets y drops</h1>
  <p class="ink2">El set es lo que decide el ritmo de tu caza. Seis sets dropean (más el de la Tienda Premium). Ocho piezas cada uno; la <b>ropa</b> (cabeza, cuerpo, piernas, pies) cae en las hunts de la faixa, <b>collar, anillo y escudo</b> de los bosses (desafíos con mecánica y jefes del mundo) y el <b>arma</b> solo de misiones.</p>
  <div class="tw"><table><thead><tr><th>Set</th><th class="r">Faixa</th><th class="r">Kills por pieza</th><th class="r">Kills para las 4 de ropa</th><th>Rareza en hunts (C/R/E/L)</th><th>Rareza en bosses</th><th class="r">Poder</th></tr></thead><tbody>
  ${G.sets.map(s => { const kpp = s.kpp || (G.monsters.find(m => m.set === s.id && m.sd)?.sd ? 1 / G.monsters.find(m => m.set === s.id && m.sd).sd : null); const o = odds(s.w), b = odds(s.bw);
    return `<tr><td><b>${esc(s.n)}</b></td><td class="r num">${s.band}</td><td class="r num">${kpp ? fmt(kpp) : "—"}</td><td class="r num">${kpp ? fmt(kpp * coupon) : "—"}</td>
    <td class="small num">${o.map((x, i) => `<span class="q${i + 1}">${pct(x, x < .01 ? 2 : 1)}</span>`).join(" / ")}</td><td class="small num">${b.map((x, i) => `<span class="q${i + 1}">${pct(x, 1)}</span>`).join(" / ")}</td><td class="r num">${s.power ? "×" + fmt(s.power, 3) : "—"}</td></tr>`; }).join("")}
  <tr><td><b>${esc(G.shop.name)}</b> <span class="pill acc">Tienda</span></td><td class="r num">${G.shop.band}</td><td colspan="3" class="small">${G.shop.setPrice} PP el set o ${G.shop.piecePrice} PP por pieza · rareza fija (Legendario)</td><td></td><td class="r num">×${fmt(G.shop.power, 3)}</td></tr>
  </tbody></table></div>
  <div class="callout ch"><b>“Kills para las 4 de ropa”</b>Como cada drop es una pieza al azar, juntar las 4 distintas lleva en promedio 8,3 drops (problema del coleccionista). Es el número realista para planear.</div>
  <h2>Rarezas</h2>
  <div class="tw"><table><thead><tr><th>Rareza</th><th class="r">Atributos</th><th>Cómo se consigue</th></tr></thead><tbody>
  ${G.rar.map((r, i) => `<tr><td class="q${i + 1}"><b>${qName[i]}</b></td><td class="r num">×${r.mult}</td><td class="small">${i === 0 ? "la mayoría de los drops" : "drop directo o subiendo en la Dragon Forge con esencias (solo Hashirama y Madara)"}</td></tr>`).join("")}</tbody></table></div>
  <p class="small ink2">Las tasks élite dan piezas que arrancan en Raro (95% Raro, 4,5% Épico, 0,5% Legendario). Sufijos extra que pueden salir: <b>[TANK]</b> +10% HP · <b>[DANO]</b> +10% daño de jutsus · <b>[SPEED]</b> −8% recarga de cura y buffs.</p>
  <h2>Piezas de cada set</h2>
  ${G.sets.map(s => `<details class="card"><summary>${esc(s.n)} <span class="mute small">faixa ${s.band}</span></summary><div class="tw"><table><thead><tr><th>Pieza</th><th>Lugar</th><th class="r">HP</th><th class="r">Chakra</th><th class="r">Armadura</th><th>De dónde sale</th></tr></thead><tbody>
    ${s.pieces.map(x => `<tr><td>${esc(x.n)}</td><td>${esc(x.slot)}</td><td class="r num">${x.hp ? fmt(x.hp) : ""}</td><td class="r num">${x.mp ? fmt(x.mp) : ""}</td><td class="r num">${x.arm || ""}</td><td class="small">${esc(x.src)}</td></tr>`).join("")}</tbody></table></div></details>`).join("")}
  <div class="callout"><b>Loot en PvE vs PvP</b>En modo PvE el loot rinde 70%; en modo PvP (level 200+) rinde 130%: casi el doble de drops y +30% de exp, a cambio del riesgo de que te maten.</div>
  ${footer()}`;
}

// ================= VOCACIONES =================
function pageVocs(root, sub) {
  const G = S.G; const st = { cls: "", vip: "", q: "" };
  const days = []; for (let i = 0; i < 14; i++) { const ms = Date.now() + i * 864e5; days.push([C.serverDate(ms), C.vocsOfDay(ms)]); }
  const draw = () => {
    let vs = G.vocs.filter(v => (!st.cls || v.cls === st.cls) && (st.vip === "" || String(v.vip) === st.vip) && (!st.q || v.n.toLowerCase().includes(st.q.toLowerCase())));
    const sel = G.vocs.find(v => v.n === decodeURIComponent(sub || ""));
    root.innerHTML = `<h1>Vocaciones y especiales</h1>
    <p class="ink2">55 personajes jugables. Todos tienen 9 jutsus de daño en los mismos levels (1, 50, 75, 100 de área, 150, 200, 300, 350, 400), un buff y 3 especiales (4 en los VIP, que además pegan +5%). Podés cambiar de vocación sin perder nada con el <i>Pergaminho de Personagem</i>.</p>
    <div class="grid g4">${[["Daño", "+10% daño, −10% HP. Especial de clase: marca al objetivo (+30% de daño de todos).", "100%"], ["Off-tank", "+5% daño, +15% HP, −8% daño recibido. Modo de lucha con robo de vida.", "88%"], ["Tank", "−5% daño, +35% HP, −15% daño recibido, +5% bloqueo. Provoca y se vuelve invulnerable.", "80%"], ["Soporte", "−5% daño, +50% cura, +25% chakra. Cura y limpia a la party.", "80%"]].map(([c, d, m]) => `<div class="stat"><div class="k">${clsPill(c)}</div><div class="s" style="margin-top:6px">${d}</div><div class="small mute">Daño solo cazando: ${m}</div></div>`).join("")}</div>
    ${sel ? `<div class="card" id="sel"><div class="flex between"><h2 class="mt0">${esc(sel.n)} ${clsPill(sel.cls)} ${sel.vip ? `<span class="pill acc">VIP</span>` : ""}</h2><a href="#/vocaciones">cerrar ✕</a></div>
      <div class="tw"><table><thead><tr><th class="r">Lv</th><th>Especial</th><th>Qué hace</th><th>Cuándo lo usa el automático</th><th class="r">Recarga</th></tr></thead><tbody>
      ${sel.esp.map(e => `<tr><td class="r num">${e.lv}</td><td><b>${esc(e.n)}</b><div class="tags">${e.tags.map(t => `<span class="pill">${esc(t)}</span>`).join("")}</div></td><td>${esc(e.que)}</td><td class="small">${esc(e.cuando)}</td><td class="r num small">${esc(e.cd)}</td></tr>`).join("")}</tbody></table></div>
      <p class="small mute">“Recarga · %” = recarga y el porcentaje de chakra que cuesta. En jugadores, los estados duran la mitad (aturdir máx. 2 s, atrapar 3 s, sin jutsus 4 s, ciego 3 s).</p></div>` : ""}
    <div class="card"><div class="form">
      <div class="field"><label>Clase</label><select id="cls"><option value="">Todas</option>${["Daño", "Off-tank", "Tank", "Soporte"].map(c => `<option ${st.cls === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
      <div class="field"><label>VIP</label><select id="vip"><option value="">Todas</option><option value="true" ${st.vip === "true" ? "selected" : ""}>Solo VIP</option><option value="false" ${st.vip === "false" ? "selected" : ""}>Gratis</option></select></div>
      <div class="field"><label>Buscar</label><input type="search" id="q" value="${esc(st.q)}"></div></div></div>
    <div class="grid g4">${vs.map(v => `<a class="card voc-card" href="#/vocaciones/${encodeURIComponent(v.n)}" style="margin:0;color:inherit;text-decoration:none"><div class="flex between"><b>${esc(v.n)}</b>${v.vip ? `<span class="pill acc">VIP</span>` : ""}</div>
      <div style="margin:6px 0">${clsPill(v.cls)}</div><div class="small mute">${v.esp.map(e => esc(e.n)).join(" · ")}</div></a>`).join("")}</div>
    <h2>Personaje del día (próximas 2 semanas)</h2>
    <p class="ink2">Cada día hay uno gratis y uno VIP con ×1,5 de exp y de entrenamiento. Es determinístico (sale de una semilla fija), así que lo podemos predecir. Cambia a la medianoche de Brasilia.</p>
    <div class="tw"><table><thead><tr><th>Día</th><th>Gratis</th><th>VIP</th></tr></thead><tbody>${days.map(([d, v], i) => `<tr class="${v.includes(S.profile.voc) ? "hl" : ""}"><td>${i === 0 ? "<b>Hoy</b>" : new Date(d + "T12:00:00-03:00").toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" })}</td><td>${esc(v[0])}</td><td>${esc(v[1])}</td></tr>`).join("")}</tbody></table></div>
    ${footer()}`;
    $("#cls").onchange = (e) => { st.cls = e.target.value; draw(); };
    $("#vip").onchange = (e) => { st.vip = e.target.value; draw(); };
    $("#q").oninput = (e) => { st.q = e.target.value; clearTimeout(st.t); st.t = setTimeout(() => { draw(); $("#q").focus(); }, 300); };
    if (sel) $("#sel").scrollIntoView({ block: "start" });
  };
  draw();
}

// ================= BOSSES =================
function pageBosses(root) {
  const G = S.G, p = S.profile;
  const MEC = { "no te muevas": "No te muevas hasta que salga el golpe: el que camina, cae.", "marca en el ninja": "Sepárense: la marca explota alrededor de cada uno.", "arena que se achica": "El borde oscuro quema: quedate adentro.",
    "no lo mires": "Dale la espalda (Ctrl + flecha gira sin caminar).", "rompe el golpe": "Pegale hasta romper el escudo.", "mata los clones": "Matá los clones a tiempo: cada uno vivo explota y cura al boss.", "memoria": "Memorizá el orden: los 3 dibujos explotan en la misma secuencia, sin volver a aparecer." };
  root.innerHTML = `<h1>Bosses y sagas</h1>
  <p class="ink2">Dos tipos: las <b>sagas</b> (la historia del anime en orden, una vez cada una, +25 elo y obligatorias para ser Kage) y los <b>desafíos con mecánica</b> (repetibles cada 24 h, en party de 1 a 3, +10 elo y collar/anillo/escudo del set).</p>
  <h2>Desafíos con mecánica <span class="small mute">(JOGAR › Chefes)</span></h2>
  <p class="ink2">A ciertas fracciones de vida el boss se para en el centro y suelta la mecánica: el piso rojo muestra dónde cae el golpe. Desde el 500 aparecen mecánicas especiales (la barra de arriba dice qué hacer). Para recibir premio tenés que hacer al menos el 10% del daño.</p>
  <div class="tw"><table><thead><tr><th>Boss</th><th class="r">Level</th><th>Mecánica</th><th>Especiales</th><th>Premio</th></tr></thead><tbody>
  ${G.mech.map(m => `<tr class="${p.level >= m.lv ? "" : "dim"}"><td><b>${esc(m.n)}</b></td><td class="r num">${m.lv}</td><td class="small">${esc(m.mec)}</td><td>${m.esp.map(e => `<span class="pill warn" title="${esc(MEC[e] || "")}">${esc(e)}</span>`).join(" ")}</td><td class="small">${esc(m.premio)}</td></tr>`).join("")}</tbody></table></div>
  <div class="card"><h3>Cómo resolver cada mecánica</h3><dl class="kv">${Object.entries(MEC).map(([k, v]) => `<dt><span class="pill warn">${k}</span></dt><dd>${v}</dd>`).join("")}
    <dt><span class="pill warn">atrapado antes del rojo</span></dt><dd>Si quedás atrapado en el rojo, salí con un especial de teletransporte, Hiraishin o Kawarimi.</dd></dl></div>
  <h2>Las 36 sagas</h2>
  <p class="ink2">Se hacen en orden. Tu progreso: <b>${p.sagas}/36</b>. Fijate el “daño por segundo” del boss contra tu vida.</p>
  <div class="tw"><table><thead><tr><th>#</th><th>Saga</th><th class="r">Level</th><th class="r">HP</th><th class="r">Daño/s</th><th></th></tr></thead><tbody>
  ${G.sagas.map((s, i) => `<tr class="${i === p.sagas ? "hl" : i < p.sagas ? "dim" : ""}"><td class="num">${i + 1}</td><td><b>${esc(s.n)}</b></td><td class="r num">${s.lv}</td><td class="r num">${short(s.hp)}</td><td class="r num">${short(s.dps)}</td><td>${i < p.sagas ? "✓" : i === p.sagas ? `<span class="pill acc">siguiente</span>` : ""}</td></tr>`).join("")}</tbody></table></div>
  ${footer()}`;
}

// ================= EVENTOS =================
function pageEvents(root) {
  const G = S.G;
  const draw = () => {
    const evs = nextOccurrences(Date.now(), 3);
    root.innerHTML = `<h1>Eventos</h1>
    <p class="ink2">Pasan a la misma hora para todos. Los horarios oficiales son de Brasilia (UTC−3); acá los ves convertidos a <b>tu hora local</b> (${Intl.DateTimeFormat().resolvedOptions().timeZone}).</p>
    <div class="tw"><table><tbody>${evs.map(e => `<tr class="${e.hot ? "hl" : ""}"><td>${e.ic}</td><td><b>${esc(e.name)}</b><div class="small mute">${esc(e.what)}</div></td><td class="r"><b class="num">${localTime(e.at)}</b><div class="small mute">${localDay(e.at)}</div></td><td class="r countdown" data-at="${+e.at}">${countdown(e.at)}</td></tr>`).join("")}</tbody></table></div>
    <div class="grid g2">
      <div class="card"><h3>🐉 Evento de la Bijuu (todos los días, 18:00 BRT)</h3><p>Una de las nueve bijuus (sorteada por la fecha, igual para todos) aparece en la arena. Level 100+, sin tope. <b>Quien hace más daño se lleva su pergamino</b> (Modo Bijuu por 7 días). Los especiales no le hacen daño: solo jutsus y golpes. Exp, gold y elo se reparten por daño; los 3 que más pegan llevan pieza de set.</p></div>
      <div class="card"><h3>⚔️ Guerra por la Jūbi (20:00 BRT)</h3><p>Deathmatch en un valle de dos pisos, level 200+. El ganador se lleva la Jūbi (el Modo Bijuu más fuerte: +25% daño). Morir ahí no quita level. Ideal para coordinar al clan.</p></div>
      <div class="card"><h3>🏆 Ranqueada</h3><p>PvP 1v1 al mejor de 3, level 200+. La “Hora de la Ranqueada” (21:00 BRT, 60 min) da 10/6/3 PP al top 3. Cada mes es una temporada: 1º Founder's Pack + 100 PP + título; 2º +50 PP; 3º +25 PP (mínimo 10 partidas).</p></div>
      <div class="card"><h3>🏰 Castillo de las guilds</h3><p>La guild que aguanta 10 min en el trono se queda con el castillo: +30 elo para cada miembro y +10% de exp hasta el próximo evento. ${G.events.castle.off ? `<span class="pill">en mantenimiento ahora</span>` : ""}</p>
        <h3>👻 Madara, el Fantasma</h3><p>Jefe del mundo de level 480+, sábados y domingos 20:30 BRT. ${G.events.bosses.find(b => b.mon === "Madara")?.off ? `<span class="pill">desactivado ahora</span>` : ""}</p></div>
    </div>
    <h2>Bijuus y Modo Bijuu</h2>
    <p class="ink2">Sellar una bijuu habilita el Modo Bijuu: se llena la vida, sube el daño y solo salen sus jutsus (sin especiales ni Hiraishin). Dura 30 s con 90 s de recarga. Se consigue con el pergamino de la Tienda Premium (7 días) o ganando el evento.</p>
    <div class="tw"><table><thead><tr><th>Bijuu</th><th class="r">Colas</th><th class="r">Precio</th><th class="r">Daño</th><th class="r">Defensa</th><th class="r">Velocidad</th><th>Jutsus</th></tr></thead><tbody>
    ${G.bijuus.map(b => `<tr><td><b>${esc(b.n)}</b></td><td class="r num">${b.tails}</td><td class="r num">${b.price ? b.price + " PP" : "Guerra"}</td><td class="r num">+${b.mode.dmg}%</td><td class="r num">+${b.mode.def}%</td><td class="r num">+${b.mode.speed}%</td><td class="small">${b.jutsus.map(esc).join(" · ")}</td></tr>`).join("")}</tbody></table></div>
    ${footer()}`;
  };
  draw();
  return { tick: () => $$(".countdown", root).forEach(el => el.textContent = countdown(new Date(+el.dataset.at))) };
}

// ================= GLOSARIO =================
function pageGlossary(root) {
  const st = { q: "" };
  const draw = () => {
    const q = st.q.toLowerCase();
    const groups = GLOSSARY.map(([g, items]) => [g, items.filter(([a, b]) => !q || a.toLowerCase().includes(q) || b.toLowerCase().includes(q))]).filter(([, i]) => i.length);
    root.innerHTML = `<h1>Glosario portugués → español</h1><p class="ink2">El juego está en portugués. Estas son las palabras que vas a ver en la interfaz y en el chat.</p>
    <div class="card"><input type="search" id="q" placeholder="Buscar palabra…" value="${esc(st.q)}" style="width:100%"></div>
    ${groups.map(([g, items]) => `<h2>${g}</h2><div class="tw"><table><tbody>${items.map(([a, b]) => `<tr><td style="width:40%"><b>${esc(a)}</b></td><td>${esc(b)}</td></tr>`).join("")}</tbody></table></div>`).join("")}${footer()}`;
    $("#q").oninput = (e) => { st.q = e.target.value; clearTimeout(st.t); st.t = setTimeout(() => { draw(); $("#q").focus(); }, 200); };
  };
  draw();
}

// ================= CLAN =================
function pageClan(root) {
  const G = S.G;
  root.innerHTML = `<h1>Clan hispano 🔥</h1>
  <p class="ink2">El plan para armar el mejor clan del servidor solo con hispanohablantes y ocupar los asientos de Kage. Con ~600 jugadores, un grupo organizado de 15–30 personas activas puede dominar el ranking de elo.</p>
  <div class="grid g2">
    <div class="card"><h3>Objetivos del clan</h3><ol>
      <li><b>Hokage + más asientos Kage.</b> Hay 5 Kages (top 5 de elo). Un clan organizado puede ocupar varios.</li>
      <li><b>Desafíos con mecánica todos los días</b> en parties de 3: +10 elo para cada uno, collar/anillo/escudo.</li>
      <li><b>Guerra por la Jūbi y Castillo:</b> llegar juntos. El castillo da +30 elo a todos los miembros presentes y +10% exp.</li>
      <li><b>Bonus de guild:</b> Exp +30%, Loot +30%, Stamina lenta o Entrenamiento +50% (3 días, máx. 2 por semana). Se compran con puntos de la guild.</li></ol></div>
    <div class="card"><h3>Party ideal para desafíos (3 personas)</h3>
      <dl class="kv"><dt>${clsPill("Tank")}</dt><dd>Provoca a los monstruos y al boss, invulnerable. Hashirama, Yamato, Kisame, Gaara…</dd>
      <dt>${clsPill("Soporte")}</dt><dd>Cura a toda la party y quita aturdir/atrapar/sin jutsus. Sakura, Tsunade, Sai, Kabuto…</dd>
      <dt>${clsPill("Daño")}</dt><dd>Marca al objetivo (+30% de daño de todos) y pega. Itachi, Madara, Minato, Sasuke…</dd></dl>
      <p class="small ink2">Cada miembro necesita hacer ≥10% del daño para cobrar el premio, así que el tank y el soporte también tienen que pegar.</p></div>
  </div>
  <h2>Rutina diaria del clan</h2>
  <div class="tw"><table><thead><tr><th>Cuándo</th><th>Qué</th></tr></thead><tbody>
    <tr><td>Al conectar</td><td>Revisar <a href="#/">personaje del día</a>, renovar task Extensa + diaria, mandar misión, Prey en la especie de la task.</td></tr>
    <tr><td>Durante el día</td><td>Cazar en la mejor hunt de la faixa con Auto Hunt. Parties para desafíos con mecánica (cooldown 24 h).</td></tr>
    <tr><td>18:00 BRT</td><td>Evento de la Bijuu (level 100+): todos al jefe del mundo; el que más pega se lleva el pergamino.</td></tr>
    <tr><td>20:00 BRT</td><td>Guerra por la Jūbi (level 200+): entrar juntos.</td></tr>
    <tr><td>21:00 BRT</td><td>Hora de la Ranqueada (PP para el top 3).</td></tr>
    <tr><td>Antes de desconectar</td><td>Misión larga (S/SS), dejar caza offline/entrenamiento para recuperar stamina.</td></tr>
  </tbody></table></div>
  <h2>Reglas sugeridas del clan</h2>
  <div class="card"><ul>
    <li>Respetar las reglas del servidor: nada de bots, macros ni scripts que toquen el juego o el navegador (este sitio no toca el juego: solo calcula). El Auto Helper y la caza offline sí están permitidos.</li>
    <li>No bloquear caminos ni hacer spam; no se comercia por fuera del juego.</li>
    <li>Los recursos del clan (bonus de guild, pergaminos de bijuu, castillo) se planifican en Discord.</li>
    <li>Prioridad de elo: quienes estén más cerca del top 5 reciben apoyo en los desafíos.</li></ul></div>
  <h2>Mensaje para reclutar</h2>
  <div class="card"><p><b>Español:</b> ¿Hablás español y jugás NTO Idle? Estamos armando el primer clan hispano para ir por el Hokage. Parties diarias para desafíos, guía y calculadoras en español: [link de este sitio]. ¡Escribime!</p>
  <p><b>Português:</b> Fala espanhol? Estamos montando o primeiro clã hispano do NTO Idle, focado em elo e Kage. Parties diárias de desafios e guia em espanhol. Chama no privado!</p></div>
  ${footer()}`;
}

export const PAGES = { "": pageHome, guia: pageGuide, hokage: pageHokage, exp: pageExp, hunts: pageHunts, tasks: pageTasks, misiones: pageMissions,
  forja: pageForge, sets: pageSets, vocaciones: pageVocs, bosses: pageBosses, eventos: pageEvents, glosario: pageGlossary, clan: pageClan };
