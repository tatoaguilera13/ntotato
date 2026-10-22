// Motor de recomendaciones: toma los datos públicos de tu personaje + el ranking completo y arma un plan priorizado.
import * as C from "./calc.js";

const median = (a) => { const s = a.filter(x => x != null && isFinite(x)).sort((x, y) => x - y); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const pctile = (a, v) => { const s = a.filter(x => x != null && isFinite(x)); if (!s.length) return null; return s.filter(x => x < v).length / s.length; };
const DAY = 864e5;

export function rowsToObjects(peers) {
  if (!peers?.rows) return [];
  const F = peers.fields;
  return peers.rows.map(r => Object.fromEntries(F.map((f, i) => [f, r[i]])));
}

// Métricas derivadas de un personaje (fila del ranking)
export function metrics(r, now = Date.now()) {
  const L = r.level, base = C.expForLevel(L), next = C.expForLevel(L + 1);
  const days = Math.max(0.25, (now - (r.created || now)) / DAY);
  const playH = (r.playtime || 0) / 3.6e6;
  const weap = [["espada", r.sword], ["luva", r.glove], ["distancia", r.dist]].sort((a, b) => (b[1] || 0) - (a[1] || 0))[0];
  return {
    level: L, pct: Math.max(0, Math.min(99.99, (r.exp - base) / (next - base) * 100)), expToNext: next - r.exp,
    days, playH, hoursDay: Math.min(24, playH / days), kpm: playH > 0.2 ? r.kills / (playH * 60) : null,
    eloDay: r.elo / days, deathsPer1k: r.kills > 50 ? r.deaths / r.kills * 1000 : null,
    weapon: weap[0], weaponSkill: weap[1] || 10,
  };
}

// Daño de jutsu: factor por level y por ninjutsu según la faixa (config.damageFactors del juego)
export function dmgFactor(G, level) {
  const ts = Object.keys(G.dmgf).map(Number).sort((a, b) => a - b); let t = ts[0];
  for (const x of ts) if (x <= level) t = x; return G.dmgf[t];
}

// Historial local (para medir tu ritmo real entre visitas)
const HKEY = (n) => `ntoh-hist-${n.toLowerCase()}`;
export function pushHistory(name, r) {
  let h = []; try { h = JSON.parse(localStorage.getItem(HKEY(name))) || []; } catch { }
  const now = Date.now(), last = h[h.length - 1];
  if (!last || now - last.t > 10 * 60e3) { h.push({ t: now, level: r.level, exp: r.exp, elo: r.elo, kills: r.kills, play: r.playtime }); h = h.slice(-300); try { localStorage.setItem(HKEY(name), JSON.stringify(h)); } catch { } }
  return h;
}
export function historyRates(h) {
  if (!h || h.length < 2) return null;
  const last = h[h.length - 1]; const ref = [...h].reverse().find(x => last.t - x.t >= 2 * 3600e3 && last.t - x.t <= 8 * DAY) || h[0];
  const dt = (last.t - ref.t); if (dt < 30 * 60e3) return null;
  const d = dt / DAY;
  return { since: ref.t, hours: dt / 3.6e6, eloDay: (last.elo - ref.elo) / d, expHour: (last.exp - ref.exp) / (dt / 3.6e6), killsHour: (last.kills - ref.kills) / (dt / 3.6e6),
    playShare: ref.play != null && last.play != null ? (last.play - ref.play) / dt : null };
}

// Elige la mejor combinación task + hunt para el nivel
export function taskPlan(G, level) {
  const bands = C.taskBandsFor(level).filter(b => b.open && b.diff !== "baixa");
  const opts = [];
  for (const b of bands) {
    const elo = C.taskElo(b.band, "extensa", b.diff);
    const species = G.monsters.filter(m => m.lv === b.band);
    for (const m of species) {
      const hs = G.hunts.filter(h => h.min <= level && h.mon.some(x => x[0] === m.n));
      for (const h of hs) {
        const tot = h.mon.reduce((a, x) => a + x[1], 0), share = h.mon.find(x => x[0] === m.n)[1] / tot;
        const a = C.huntAvg(h);
        // kills de la especie por kill total = share; elo efectivo por kill en la hunt
        const eloPerKill = elo / 1000 * share;
        const elite = G.tasks.elite.find(e => e.monster === m.n && e.minLevel <= level);
        opts.push({ band: b.band, diff: b.diff, elo, m, h, share, a, eloPerKill, elite, score: eloPerKill * (elite ? 1.4 : 1) * Math.sqrt(a.exp / a.hp * 1000) });
      }
    }
  }
  opts.sort((x, y) => y.score - x.score);
  return { best: opts[0] || null, safer: opts.find(o => o.diff === "media" && o !== opts[0]) || null, all: opts };
}

export function analyze({ G, row, pos, of, peers, profile, history, events, now = Date.now() }) {
  const me = metrics(row, now);
  const L = row.level, voc = G.vocs.find(v => v.n === row.vocName);
  const others = peers.filter(p => p.name !== row.name);
  const span = Math.max(20, Math.round(L * 0.06));
  const near = others.filter(p => Math.abs(p.level - L) <= span);
  const nm = near.map(p => ({ p, m: metrics(p, now) }));
  const peer = {
    n: near.length, span,
    ml: median(near.map(p => p.ml)), mlP: pctile(near.map(p => p.ml), row.ml),
    shield: median(near.map(p => p.shield)), fist: median(near.map(p => p.fist)),
    weapon: median(nm.map(x => x.m.weaponSkill)),
    kpm: median(nm.map(x => x.m.kpm)), hoursDay: median(nm.map(x => x.m.hoursDay)),
    deaths: median(nm.map(x => x.m.deathsPer1k)), elo: median(near.map(p => p.elo)), eloP: pctile(near.map(p => p.elo), row.elo),
  };
  const byElo = [...peers].sort((a, b) => b.elo - a.elo);
  const top5 = byElo.slice(0, 5).map(p => ({ p, m: metrics(p, now) }));
  const fifth = top5[4]?.p;
  const hr = historyRates(history);
  const myEloDay = hr?.eloDay ?? me.eloDay;
  const rate = C.expRateMult({ level: L, stamina: profile.stamina, vip: profile.vip, pvp: profile.pvp, dayVoc: C.vocsOfDay(now).includes(row.vocName) });
  const plan = taskPlan(G, L);
  const f = dmgFactor(G, L);
  const recs = [];
  const add = (r) => recs.push(r);

  // ---------- eventos ----------
  for (const e of events.slice(0, 6)) {
    const mins = (e.at - now) / 6e4;
    if (e.name.includes("EXP")) {
      if (mins <= 0) add({ when: "ahora", ic: "✨", score: 100, title: `¡${e.name} activo ahora!`, why: "Toda la exp de caza vale el doble (se aplica incluso por encima del tope de ×3,5).",
        how: ["Cazá en tu mejor hunt de exp (abajo) sin pausas.", "Prey de Experiencia en la especie principal de la hunt.", "Si tenés XP Boost de la tienda, este es el momento."] });
      else if (mins < 12 * 60) add({ when: "hoy", ic: "✨", score: 90, title: `${e.name} a las ${e.at.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })} (tu hora)`, why: "Duplica la exp de caza durante 2 h. Si llegás con stamina verde (≥40 h) sumás +30% encima.",
        how: [`Desconectate o entrená un rato antes: la stamina se recupera 2 h por cada hora afuera (debajo de 40 h).`, "Dejá la task Extensa ya aceptada para no perder tiempo.", "Tené pociones y espacio en la mochila."] });
    }
  }
  const bij = events.find(e => e.name.includes("Bijuu"));
  if (bij && L >= 100 && !row.jin && (bij.at - now) / 6e4 < 8 * 60) add({ when: "hoy", ic: "🐉", score: 35, title: `Evento de la Bijuu (${bij.at.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })})`,
    why: "Quien más daño hace se lleva el pergamino (Modo Bijuu 7 días). El resto igual cobra exp, gold y elo según el daño.", how: ["Los especiales no le pegan: solo jutsus y golpes.", "Morir ahí no quita exp: andá aunque no ganes."] });

  // ---------- personaje del día ----------
  const today = C.vocsOfDay(now), tomorrow = C.vocsOfDay(now + DAY);
  if (today.includes(row.vocName)) add({ when: "ahora", ic: "⭐", score: 95, title: `¡Hoy ${row.vocName} es personaje del día!`, why: "×1,5 de exp y ×1,5 de entrenamiento todo el día (hasta la medianoche de Brasilia).", how: ["Priorizá horas de caza hoy por sobre cualquier otro día.", "Dejá el entrenamiento offline de ninjutsu corriendo cuando no cazes."] });
  else if (tomorrow.includes(row.vocName)) add({ when: "hoy", ic: "⭐", score: 40, title: `Mañana ${row.vocName} es personaje del día`, why: "×1,5 exp y entrenamiento mañana.", how: ["Guardá stamina verde para mañana.", "Planificá jugar más horas mañana."] });

  // ---------- plan de caza + task ----------
  if (plan.best) {
    const b = plan.best, d = C.TASK_DIFF.find(x => x.id === b.diff).es;
    const epk = C.expPerKill(b.a.exp, L, rate);
    add({ when: "ahora", ic: "📜", score: 88, title: `Task Extensa ${d} de ${b.m.n} y cazá en ${b.h.n}`,
      why: `Es la combinación que más elo te da por kill: +${b.elo} elo por task (${b.band >= C.tierFor(L) + 1 ? "faixa de arriba, ×1,6" : "tu faixa"}), y en esa hunt ${Math.round(b.share * 100)}% de los monstruos son ${b.m.n}.${b.elite ? ` Además tenés la task élite de ${b.m.n} (+50 elo) que cuenta con los mismos kills.` : ""}`,
      how: [`Task Master → especie ${b.m.n} → ${d} → Extensa (1.000).`, b.elite ? `Aceptá también la task élite de ${b.m.n}.` : "Aceptá también la task diaria (+12 elo).", `Prey: poné ${b.m.n} con bonus de Experiencia o Loot.`,
        `Viajá a ${b.h.n} (abre en el ${b.h.min}) y prendé el Auto Hunt. ≈ ${C.expPerKill(b.a.exp, L, rate) > 0 ? shortN(epk) : "—"} exp por kill.`,
        b.a.dps > 0 ? `Ojo: los monstruos pegan ~${shortN(b.a.dps)} de daño/s en promedio. Si morís, pasá a Media (${plan.safer ? plan.safer.m.n + " en " + plan.safer.h.n : "tu faixa"}).` : ""].filter(Boolean),
      metric: { label: "elo por 1.000 kills en la hunt", value: Math.round(b.eloPerKill * 1000) } });
  }

  // ---------- misiones ----------
  const ms = G.missions.filter(m => m.level <= L).map(m => ({ m, r: C.missionReward(m, L), h: m.ms / 3.6e6 })).sort((a, b) => b.r.exp / b.h - a.r.exp / a.h);
  if (ms.length) {
    const ss = ms.filter(x => x.h >= 4).sort((a, b) => b.h - a.h || b.r.exp - a.r.exp)[0];
    add({ when: "ahora", ic: "🧭", score: 70, title: `Misión: ${ms[0].m.name} (Rank ${ms[0].m.rank})`, why: `Es la que más exp por hora te da (${shortN(ms[0].r.exp * 0.85 / ms[0].h)} exp/h) y seguís cazando mientras tanto. +${ms[0].m.elo} elo.`,
      how: [`Pide tener vestido el set de su faixa (cabeza, armadura, pantalón y botas).`, ss && ss !== ms[0] ? `Antes de dormir o salir: ${ss.m.name} (Rank ${ss.m.rank}, ${ss.h} h, ${shortN(ss.r.exp * 0.85)} exp, +${ss.m.elo} elo) para no dejar el slot vacío.` : "Reenviala apenas termina.", "Si tenés otros personajes en la cuenta, mandalos también (hasta 3 a la vez): las piedras de refino solo salen de acá."] });
  }

  // ---------- ninjutsu ----------
  if (peer.ml != null) {
    const gap = peer.ml - row.ml, lvEq = f.skill / f.level;
    if (gap >= 3) add({ when: "hoy", ic: "🌀", score: 80 + Math.min(15, gap), title: `Tu ninjutsu (${row.ml}) está ${gap} por debajo de los jugadores de tu level (${Math.round(peer.ml)})`,
      why: `El daño de los jutsus es ${f.level} × level + ${f.skill} × ninjutsu: a tu level, 1 punto de ninjutsu vale lo mismo que ~${lvEq.toFixed(1)} levels. Estás en el percentil ${Math.round((peer.mlP || 0) * 100)} de tu rango (${peer.n} jugadores).`,
      how: ["Cuando no cazás, dejá el treino offline de ninjutsu (se acumulan hasta 12 h; se carga 1 h por cada hora sin entrenar).", "El personaje del día y el bonus de guild “Treino +50%” lo aceleran.", "Entrenar también recupera stamina."] });
    else if (gap <= -5) add({ when: "info", ic: "🌀", score: 10, title: `Ninjutsu ${row.ml}: ${-gap} arriba del promedio de tu level`, why: "Tu daño de jutsus está por encima de tus pares. Bien.", how: [] });
  }
  // escudo para tanques
  if (voc && (voc.cls === "Tank" || voc.cls === "Off-tank") && peer.shield != null && peer.shield - row.shield >= 4)
    add({ when: "semana", ic: "🛡️", score: 45, title: `Shielding ${row.shield} (tus pares: ${Math.round(peer.shield)})`, why: `Sos ${voc.cls}: el bloqueo es tu supervivencia en hunts y desafíos.`, how: ["Entrená en el Trainer Monk con escudo: sube shielding y la skill de arma a la vez."] });
  if (peer.weapon != null && peer.weapon - me.weaponSkill >= 6)
    add({ when: "semana", ic: "🗡️", score: 30, title: `Skill de ${me.weapon} ${me.weaponSkill} (tus pares: ${Math.round(peer.weapon)})`, why: "Sube el daño del golpe básico de tu arma.", how: [me.weapon === "distancia" && me.weaponSkill < 80 ? "Con distancia por debajo de 80 errás mucho: considerá guante o espada hasta subirla." : "Entrená la skill de tu arma en el Trainer Monk cuando no cazás."] });

  // ---------- ritmo de kills ----------
  if (me.kpm && peer.kpm && me.kpm < peer.kpm * 0.8 && row.kills > 500)
    add({ when: "hoy", ic: "⚡", score: 65, title: `Matás ${me.kpm.toFixed(1)} monstruos/min; tus pares ${peer.kpm.toFixed(1)}`, why: "Menos kills por minuto = menos exp y menos elo de tasks por hora jugada.",
      how: ["Jutsus: marcá “Jutsu de área fijo en el combo” si la hunt tiene grupos.", "Elegí hunts con monstruos de poca vida (mirá Exp/HP en Hunts).", "Revisá tu set: tiene que ser el de tu faixa, y refinarlo hasta +5 es barato.", "Subí ninjutsu (es tu daño)."] });

  // ---------- horas online ----------
  const topHours = median(top5.map(x => x.m.hoursDay));
  if (topHours && me.hoursDay < topHours * 0.7)
    add({ when: "hoy", ic: "🕒", score: 75, title: `Estás ~${me.hoursDay.toFixed(1)} h/día en juego; el top 5 de elo, ~${topHours.toFixed(1)} h/día`, why: "Es un juego idle: el que tiene el juego abierto más horas gana. La caza offline solo guarda 8 h y rinde 50%.",
      how: ["Dejá el juego abierto en una PC o celular que quede prendido (el Auto Helper está permitido).", "Cuando cerrás, dejá entrenamiento offline o misión larga corriendo.", "Repartí la caza en sesiones para aprovechar la stamina verde (+30%)."] });

  // ---------- muertes ----------
  if (me.deathsPer1k != null && row.deaths >= 3 && me.deathsPer1k > Math.max(0.3, (peer.deaths || 0) * 2))
    add({ when: "ahora", ic: "💀", score: 72, title: `Morís mucho: ${row.deaths} muertes (${me.deathsPer1k.toFixed(1)} cada 1.000 kills; tus pares ${(peer.deaths || 0).toFixed(1)})`, why: "Cada muerte te saca exp, 5% del oro que llevás, y sin Amulet of Loss la mochila entera.",
      how: ["Llevá siempre Amulet of Loss.", "Comprá bless (reduce la pérdida de exp 30% a 100%).", "Auto Helper → Combate: subí el % de Auto Heal y prendé Auto Poção.", "Bajá una faixa de hunt hasta tener el set completo."] });

  // ---------- sets ----------
  const nextSet = C.SET_BANDS.find(b => b > L), curSet = C.setBandOf(L);
  const setN = (b) => G.sets.find(s => s.band === b)?.n;
  if (nextSet && nextSet - L <= 30) add({ when: "semana", ic: "🛡️", score: 50, title: `Set ${setN(nextSet)} a ${nextSet - L} levels`, why: `A partir del ${nextSet} las hunts dropean el set ${setN(nextSet)}${nextSet === 400 ? " (×6 de vida respecto al Jiraiya: cambia todo)" : ""}. Las misiones de esa faixa lo piden vestido.`, how: ["No gastes piedras de refino en tu set actual: guardalas.", "Juntá oro para la forja del próximo set."] });
  else add({ when: "info", ic: "🛡️", score: 12, title: `Tu set objetivo: ${setN(curSet)} (faixa ${curSet})`, why: "Ropa de las hunts de la faixa; collar/anillo/escudo de los desafíos con mecánica; arma de misiones.", how: [] });

  // ---------- sagas y desafíos ----------
  const sagasAvail = G.sagas.filter(s => s.lv <= L).length;
  const sagasDone = row.title === "sagas" ? 36 : profile.sagasKnown ? profile.sagas : null;
  if (sagasDone == null) add({ when: "hoy", ic: "👹", score: 58, title: "¿Cuántas sagas hiciste?", why: `A tu level ya podrías tener ${sagasAvail} de 36 sagas. Cada una da +25 elo y son obligatorias para Kage; el ranking público no muestra cuántas hiciste.`, how: ["Completá el número en “Sagas hechas” acá arriba y te digo cuál sigue."] });
  else if (sagasDone < sagasAvail) { const s = G.sagas[sagasDone]; add({ when: "hoy", ic: "👹", score: 68, title: `Saga pendiente: ${s.n} (level ${s.lv})`, why: `Tenés ${sagasDone} hechas y a tu level podrías tener ${sagasAvail}: son ${(sagasAvail - sagasDone) * 25} elo esperándote. Obligatorias para Kage.`, how: [`Boss: ${shortN(s.hp)} HP, pega ~${shortN(s.dps)}/s.`, "Se hacen en orden desde el panel de sagas.", "Si no te alcanza el daño, pedí ayuda al clan o subí ninjutsu primero."] }); }
  const mech = G.mech.filter(m => m.lv <= L);
  if (mech.length) add({ when: "hoy", ic: "🤝", score: 55, title: `${mech.length} desafíos con mecánica disponibles (+10 elo c/u por día)`, why: `${mech.length * 10} elo por día extra y collar/anillo/escudo del set. Party de hasta 3: cada uno tiene que hacer ≥10% del daño.`, how: [`Empezá por: ${mech.slice(-3).map(m => m.n).join(", ")}.`, "Armá party con el clan: tank + soporte + daño.", "Mirá en Bosses cómo resolver cada mecánica."] });

  // ---------- carrera de elo ----------
  if (fifth && row.elo < fifth.elo) {
    const gap = fifth.elo - row.elo, theirs = metrics(fifth, now).eloDay, diff = myEloDay - theirs;
    add({ when: "semana", ic: "🍥", score: 60, title: `Te faltan ${fmtN(gap)} elo para el top 5 (${fifth.name}, ${fmtN(fifth.elo)})`,
      why: `Vos sumás ~${fmtN(myEloDay)} elo/día${hr ? " (medido entre tus visitas)" : " (promedio desde que creaste el personaje)"}; ${fifth.name} ~${fmtN(theirs)}/día. ${diff > 0 ? `A este ritmo lo pasás en ~${Math.ceil(gap / diff)} días.` : "A este ritmo no lo alcanzás: necesitás más elo por día."}`,
      how: ["Task Extensa siempre activa (la de arriba).", "Las sagas y desafíos diarios suman sin cazar más.", "Abrí Rivales para ver a todos los del top."] });
  }
  if (!row.guild) add({ when: "semana", ic: "🔥", score: 40, title: "No estás en ninguna guild", why: "El top 5 de elo es todo de una misma guild. En grupo se hacen los desafíos con mecánica, el castillo y la Guerra por la Jūbi.", how: ["Fundá el clan hispano y reclutá con el mensaje de la página Clan."] });

  // ---------- muro del 450 / PvP ----------
  if (L >= 420 && L < 500) add({ when: "info", ic: "📈", score: 25, title: "Se viene el muro del 450–500", why: "La curva de exp cae fuerte: del 450 al 500 hacen falta ~15.000 kills, y del 500 al 1000 ~340.000.", how: ["Aprovechá los eventos de Double EXP y el personaje del día.", "Desde acá el elo pesa más que el level para ser Kage."] });
  if (L >= 200 && !profile.pvp) add({ when: "info", ic: "⚔️", score: 22, title: "Modo PvP: +30% exp y casi el doble de loot", why: "En PvP el loot rinde ×1,3 contra ×0,7 en PvE, y la exp ×1,3. El riesgo: otros jugadores en PvP te pueden atacar.", how: ["Conviene en grupo con el clan, o en hunts poco concurridas.", "Si lo usás, marcá “Modo PvP” en tu perfil para que los cálculos lo tengan en cuenta."] });

  recs.sort((a, b) => b.score - a.score);
  return { me, peer, top5, fifth, hr, myEloDay, rate, plan, f, recs, rankPos: pos, of };
}

const fmtN = (n) => Number(n || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 });
function shortN(n) { const a = Math.abs(n); return a >= 1e9 ? (n / 1e9).toFixed(2) + " mil M" : a >= 1e6 ? (n / 1e6).toFixed(2) + " M" : a >= 1e4 ? (n / 1e3).toFixed(1) + " k" : fmtN(n); }
