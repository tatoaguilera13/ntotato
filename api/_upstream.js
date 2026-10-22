// Lectura de solo-lectura del ranking PÚBLICO de NTO Idle (el mismo que muestra la web del juego).
// No inicia sesión, no toca personajes ni el cliente del juego. Las respuestas se cachean en el CDN de Vercel.
export const BASE = "https://ntoidle.app";
export async function upstream(path) {
  const r = await fetch(BASE + path, { headers: { "user-agent": "ntotato-fansite (ranking publico, cache)", accept: "application/json" } });
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch { }
  return { status: r.status, json };
}
export function send(res, status, body, maxAge = 60) {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 5}`);
  res.status(status).send(JSON.stringify(body));
}
