import { upstream, send } from "./_upstream.js";
// GET /api/char?name=Nombre  → perfil público del personaje + posiciones en el ranking
export default async function handler(req, res) {
  const name = String(req.query.name || "").trim().slice(0, 40);
  if (!name) return send(res, 400, { error: "Falta el nombre del personaje." }, 5);
  try {
    const r = await upstream(`/api/ranking/char?name=${encodeURIComponent(name)}`);
    if (r.status === 200 && r.json?.row) return send(res, 200, r.json, 60);
    // no exacto: buscar parecidos
    const s = await upstream(`/api/ranking?by=level&page=1&per=10&q=${encodeURIComponent(name)}`);
    const sug = (s.json?.list || []).map(x => ({ name: x.name, level: x.level, voc: x.vocName }));
    return send(res, 404, { error: "No encontré ese personaje en el ranking.", sugerencias: sug }, 30);
  } catch (e) {
    return send(res, 502, { error: "El servidor del juego no respondió. Probá en un rato." }, 5);
  }
}
