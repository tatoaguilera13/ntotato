import { upstream, send } from "./_upstream.js";
// GET /api/peers → todo el ranking compacto (para comparar con jugadores de tu level). Cache 10 min.
const F = ["name", "vocName", "level", "exp", "elo", "ml", "fist", "glove", "sword", "dist", "shield", "kills", "bosses", "deaths", "playtime", "created", "online", "kage", "town"];
export default async function handler(req, res) {
  try {
    const first = await upstream(`/api/ranking?by=level&page=1&per=200`);
    if (first.status !== 200) return send(res, 502, { error: "ranking no disponible" }, 10);
    const pages = Math.min(30, first.json.pages || 1);
    const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => upstream(`/api/ranking?by=level&page=${i + 2}&per=200`)));
    const list = [first, ...rest].flatMap(r => r.json?.list || []);
    const rows = list.map(x => [...F.map(f => x[f] ?? null), x.guild?.name ?? null]);
    return send(res, 200, { fields: [...F, "guild"], updated: Date.now(), total: first.json.total, rows }, 600);
  } catch { return send(res, 502, { error: "El servidor del juego no respondió." }, 10); }
}
