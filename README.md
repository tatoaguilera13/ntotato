# NTO Idle Hispano 🍥

Guía completa en español y calculadoras para **[NTO Idle](https://ntoidle.app)**, hecha para el primer clan hispano del servidor.

## Qué trae

| Sección | Para qué sirve |
|---|---|
| **Mi ninja** | Escribís el nombre de tu personaje y lee tus datos reales del ranking público (level, exp, skills, elo, kills, muertes, horas jugadas). Te compara con los jugadores de tu nivel y arma un plan priorizado: qué hacer ahora, hoy y esta semana, y cómo. |
| **Rivales** | La carrera de elo en vivo: top del ranking, elo por día de cada uno y en cuántos días los pasás. |
| **Guía completa** | Toda la wiki oficial traducida y ordenada, con el *porqué* de cada mecánica. |
| **Camino a Hokage** | Planificador de elo: cuánto sumás por día y en cuántos días llegás a 20.000. |
| **EXP y niveles** | Kills y horas hasta cualquier level, con todos los multiplicadores reales. |
| **Hunts** | Las 160 hunts ordenadas por rendimiento para tu level. |
| **Tasks y elo** | Elo de cada task según faixa, dificultad y tamaño; tasks élite. |
| **Misiones** | Exp/h, oro, piedras y elo de cada misión para tu level. |
| **Dragon Forge** | Piedras esperadas y probabilidad de llegar a +N. |
| **Sets y drops** | Kills por pieza, rarezas y stats de cada set. |
| **Vocaciones** | Las 55 vocaciones con sus 184 especiales traducidos + personaje del día de las próximas 2 semanas. |
| **Bosses, Eventos, Glosario, Clan** | Referencia rápida y organización del clan. |

El perfil se guarda solo en tu navegador (localStorage). El sitio **no toca el juego**: solo calcula con datos públicos, así que no rompe ninguna regla del servidor.

## Cómo lee tu personaje

Las funciones de `api/` (Vercel) leen el ranking **público** de `ntoidle.app/api/ranking` — el mismo que muestra el juego a cualquier visitante — y lo cachean (1 a 10 min) para no cargar el servidor. No piden contraseña, no inician sesión y no tocan el cliente del juego.

## Publicar en Vercel

1. Entrá a [vercel.com/new](https://vercel.com/new) e importá este repositorio.
2. Framework Preset: **Other**. Sin build command. Output directory: la raíz (`.`).
3. Deploy. Cada `git push` a `main` vuelve a publicar solo.

## Probar en tu PC

```bash
python3 -m http.server 8000   # y abrí http://localhost:8000
```

## De dónde salen los números

- La wiki oficial (`ntoidle.app/wiki`) y los datos públicos que carga el cliente del juego (`ntoidle.app/data/*.json`).
- Las fórmulas (curva de exp, multiplicadores, elo de tasks, misiones, forja, personaje del día) están portadas del código público del cliente y del motor del servidor que se descarga con el juego (`assets/js/calc.js`).
- `data/game.json` se genera con `tools/build_data.py`. Si el juego se actualiza, hay que volver a extraer los datos y regenerarlo.

Proyecto de fans, sin relación oficial con NTO Idle.
