import { upstream, send } from "./_upstream.js";
// GET /api/ranking?by=elo&page=1&per=50[&voc=&guild=&q=&online=1]
const BY = new Set(["level", "elo", "kills", "bosses", "ninjutsu", "taijutsu", "espada", "luva", "distancia", "shielding", "ranked", "pvp"]);
export default async function handler(req, res) {
  const q = new URLSearchParams();
  q.set("by", BY.has(req.query.by) ? req.query.by : "elo");
  q.set("page", String(Math.max(1, Math.min(50, Number(req.query.page) || 1))));
  q.set("per", String(Math.max(1, Math.min(200, Number(req.query.per) || 50))));
  for (const k of ["voc", "guild", "q", "town"]) if (req.query[k]) q.set(k, String(req.query[k]).slice(0, 40));
  if (req.query.online) q.set("online", "1");
  try {
    const r = await upstream(`/api/ranking?${q}`);
    return send(res, r.status, r.json ?? { error: "respuesta inválida" }, 120);
  } catch { return send(res, 502, { error: "El servidor del juego no respondió." }, 5); }
}
