// Guía completa en español. Cada sección: id, título y una función que devuelve HTML (recibe los datos del juego).
const w = (t) => `<div class="why">${t}</div>`;

export const GUIDE = [
{ id: "basico", t: "1. Cómo funciona", html: () => `
<p>NTO Idle es un MMORPG “idle” de Naruto en el navegador: <b>tu ninja caza solo</b>. Vos elegís el personaje, el lugar y qué puede usar el automático. Sigue progresando aunque no estés haciendo clic, y hasta desconectado (caza offline).</p>
<h3>Los seis pasos del juego</h3>
<ol>
<li><b>Crear el ninja.</b> 58 vocaciones (55 jugables), cada una con su clase: Daño, Off-tank, Tank o Soporte. Kit de 9 jutsus de daño, 1 buff y 3 especiales (4 en las VIP). Se puede cambiar de vocación sin perder nada con el <i>Pergaminho de Personagem</i>.</li>
<li><b>Prender el Auto Hunt</b> (botón IDLE de la barra de abajo). El ninja recorre la hunt, elige objetivo, pega, suelta el combo, se cura, toma poción y junta loot.</li>
<li><b>Viajar a una hunt.</b> El botón JOGAR lista las hunts por faixa de level con los monstruos, el set que dropean y la dificultad del drop. Viajar es gratis.</li>
<li><b>Armar el set de tu faixa.</b> Es lo que decide tu ritmo de caza. El primero importante es el de Kakashi (level 100).</li>
<li><b>Tasks y misiones.</b> La task es cazar lo que ya ibas a cazar y cobrar extra. La misión corre sola por horas mientras seguís jugando.</li>
<li><b>Subir hasta el 1000.</b> No hay reborn.</li></ol>
<h3>El Auto Helper (pestañas)</h3>
<div class="tw"><table><thead><tr><th>Pestaña (PT)</th><th>Qué se prende ahí</th></tr></thead><tbody>
<tr><td>Combate</td><td>Auto Target · Auto Attack · Auto Heal (con el % de vida que elegís) · Auto Poção · Auto Power Down · Auto Provocar</td></tr>
<tr><td>Auto Hunt</td><td>Caminar solo por la hunt, seguir al objetivo, Auto Loot, ir al depot solo, vender loot flojo y qué hacer si aparece otro jugador</td></tr>
<tr><td>Jutsus</td><td>Los tres modos de combo: automático (los 4 más fuertes), skill individual y combo manual; y la casilla del jutsu de área</td></tr>
<tr><td>Buffs</td><td>Auto Buff (lo usa cada vez que se termina) y Auto Haste</td></tr>
<tr><td>Especiais</td><td>Cada especial se prende/apaga solo, con cuánta vida sale (tu HP o el del objetivo), Kawarimi (debajo de 18%) y Auto Bijuu</td></tr></tbody></table></div>
<h3>Reglas que valen desde el principio</h3>
<ul><li>Level máximo 1000, sin reborn.</li>
<li>El combo sale espaciado: un jutsu cada 0,75 s, los 4 en 3 s.</li>
<li>Morir sin <b>Amulet of Loss</b> tira la mochila entera; con él no cae nada. Sin mochila, cada pieza tiene 60% de caer.</li>
<li>PvE y PvP cazan en el mismo lugar: solo quien está en PvP lastima y es lastimado; los jutsus de área no tocan a quien está en PvE.</li></ul>`},

{ id: "exp", t: "2. Experiencia, stamina y caza offline", html: (G) => `
<p>La exp de un kill es: <b>exp del monstruo × stage de tu level × multiplicadores × 0,85</b>.</p>
<h3>El “stage” (la curva)</h3>
<p>Cada level tiene un multiplicador. Al principio es enorme (×34 en el level 1, ×24 en el 100, ×15 en el 200, ×7,6 en el 300) y va bajando: ×3,4 en el 400, ×1,36 en el 450 y menos de ×1 desde el 500. Por eso:</p>
<ul><li>Del 1 al 450 se sube muy rápido (en total unos 17.000 kills con buenas hunts).</li>
<li>Del 450 al 500 hacen falta ~15.000 kills, y del 500 al 1000 alrededor de <b>340.000</b>. Ahí empieza el juego largo.</li>
<li>Del 1 al 200 la wiki habla de “exp doble”: es el <i>early boost</i> (×2 hasta el 150, vuelve a ×1 en el 250). Unas 1,6 h de caza hasta el 200.</li></ul>
${w("El juego está diseñado para que todos lleguen rápido al contenido medio (400–450) y que la competencia real sea del 500 en adelante. Si te atrasaste, no te preocupes: se recupera rápido hasta el 450.")}
<h3>Todos los multiplicadores de exp (del código del servidor)</h3>
<div class="tw"><table><thead><tr><th>Fuente</th><th class="r">Efecto</th><th>Notas</th></tr></thead><tbody>
<tr><td>Stamina verde (≥ 40 h)</td><td class="r">×1,30</td><td>La más importante: no la desperdicies.</td></tr>
<tr><td>VIP</td><td class="r">×1,20</td><td>También da más caza offline (12 h).</td></tr>
<tr><td>Personaje del día</td><td class="r">×1,50</td><td>Exp y entrenamiento. Uno gratis y uno VIP por día.</td></tr>
<tr><td>Modo PvP (level 200+)</td><td class="r">×1,30</td><td>Y el loot pasa de ×0,7 a ×1,3. Riesgo: te pueden matar.</td></tr>
<tr><td>XP Boost (tienda)</td><td class="r">×1,30</td><td></td></tr>
<tr><td>Bonus de guild “Exp +30%”</td><td class="r">×1,30</td><td>3 días, máx. 2 por semana.</td></tr>
<tr><td>Prey de experiencia</td><td class="r">+13% a +40%</td><td>Solo en la especie elegida.</td></tr>
<tr><td>Puntos de Bestiario</td><td class="r">+0,25% c/u</td><td>Hasta 100 puntos (+25%).</td></tr>
<tr><td>Ser Kage</td><td class="r">×1,10</td><td>+5% HP también.</td></tr>
<tr><td>Evento Double EXP</td><td class="r">×2</td><td>Se aplica por fuera del tope.</td></tr>
<tr><td>Caza offline</td><td class="r">×0,5</td><td></td></tr></tbody></table></div>
<p>Se <b>multiplican</b> entre sí. Desde el level <b>650</b> hay un tope de ×3,5 para todo junto (salvo el evento).</p>
<h3>Stamina</h3>
<ul><li>Máximo 42 h. Por encima de 40 h está “verde” y da +30% de exp. Sin stamina no ganás exp.</li>
<li>Solo vuelve <b>entrenando</b> o <b>desconectado</b> (empieza a recuperarse 10 min después de salir). Por debajo de 40 h recupera 2 h por cada hora afuera; por encima de 40 h, media hora por hora.</li></ul>
${w("Las primeras 2 h de caza de cada sesión son las más valiosas (verde). Si jugás muchas horas seguidas, el resto rinde 30% menos: conviene repartir en sesiones y dejar entrenando offline entre medio.")}
<h3>Caza offline</h3>
<p>Guardás hasta 8 h (12 h con VIP) que rinden al 50%. Se llena mientras estás desconectado o entrenando offline.</p>
<h3>Morir</h3>
<ul><li>Perdés el 5% del dinero que llevás encima y exp (menos con <b>bless</b>: Light −30%, Medium −50%, Ultra −70%, Max −100%). Hasta el level 700 la pérdida de exp es la mitad.</li>
<li>Sin Amulet of Loss se cae la mochila entera.</li></ul>`},

{ id: "personaje", t: "3. Clases, jutsus y especiales", html: (G) => `
<h3>Las cuatro clases</h3>
<div class="tw"><table><thead><tr><th>Clase</th><th>Atributos</th><th>Buff del level 100</th><th>Especial del 250</th><th class="r">Vocaciones</th></tr></thead><tbody>
<tr><td><b>Daño</b></td><td>+10% daño, −10% HP</td><td>+20% daño</td><td>Marca al objetivo: recibe +30% de daño de todos</td><td class="r">26</td></tr>
<tr><td><b>Off-tank</b></td><td>+5% daño, +15% HP, −8% daño recibido</td><td>+15% daño y +15% daño recibido</td><td>Modo de lucha: más daño, más aguante y robo de vida</td><td class="r">12</td></tr>
<tr><td><b>Tank</b></td><td>−5% daño, +35% HP, −15% daño recibido, +5% bloqueo</td><td>+30% “daño recibido” (así figura en la wiki), +30% regeneración, +10% daño</td><td>Provoca a todos alrededor (incluso al jefe del mundo) y queda invulnerable</td><td class="r">8</td></tr>
<tr><td><b>Soporte</b></td><td>−5% daño, +50% cura, +25% chakra</td><td>+60% regeneración, +10% daño recibido, +10% daño (también para la party)</td><td>Cura, protege y limpia a toda la party</td><td class="r">9</td></tr></tbody></table></div>
<p>El balance apunta a que, cazando solo, el Off-tank haga 88% del daño de un Daño, y el Tank y el Soporte 80%. A cambio aguantan más (cazan hunts más peligrosas sin morir) y son clave en party.</p>
<h3>La escalera de jutsus (igual para todos)</h3>
<div class="tw"><table><thead><tr><th>Level</th><th>Qué se suma</th></tr></thead><tbody>
<tr><td>1</td><td>Throw Kunai / Shuriken</td></tr><tr><td>50</td><td>1º de objetivo único</td></tr><tr><td>75</td><td>2º de objetivo único (el básico del elemento)</td></tr>
<tr><td>100</td><td><b>Jutsu de ÁREA</b>: pega a todo en un rombo de 21 sqm a tu alrededor, sin necesitar objetivo</td></tr>
<tr><td>150 · 200 · 300 · 350 · 400</td><td>3º, 4º, 5º, 6º y 7º jutsu (del 300 para arriba cada uno tiene el suyo)</td></tr></tbody></table></div>
<ul><li>El combo automático usa los 4 más fuertes. La secuencia más fuerte es 400 › 350 › 300 › 250.</li>
<li>La casilla “Jutsu de área fijo en el combo” mete el del 100 en lugar del más débil: muy útil en hunts con muchos monstruos juntos.</li>
<li>Si no tenés chakra para la secuencia entera, el ninja espera.</li></ul>
<h3>Mejorar jutsus</h3>
<p>Con <b>puntos de jutsu</b> (salen del Prey: 1 cada 60 kills de la especie elegida, y del Bestiario) cada jutsu sube hasta nivel 10. Por nivel: ataque +3% daño, −4% chakra, +1,5% crítico; cura +4% cura; buff +6% duración, −3% recarga.</p>
${w("Los puntos de jutsu son limitados: ponelos primero en los jutsus que usa tu combo (los 4 más fuertes) y en tu cura.")}
<h3>Especiales</h3>
<ul><li>Recarga de 30 a 60 s y mecánicas que cambian la pelea: atrapar, aturdir, invulnerabilidad, curar, llevar a otro mundo.</li>
<li>Valen en todos lados menos en zona protegida (incluso PvP, castillo y la Guerra). Solo el Kamui no vale en eventos.</li>
<li>El automático los gasta en bosses y PvP, y en los monstruos de la hunt si prendés “Usar em monstros da hunt”.</li>
<li>Salen aunque estés atrapado, sin jutsus, ciego o confundido; solo aturdido los frena.</li>
<li>En jugadores, los estados duran la mitad, con tope: aturdir 2 s, atrapar 3 s, sin jutsus 4 s, ciego 3 s.</li></ul>
<p>Mirá los especiales de cada personaje en <a href="#/vocaciones">Vocaciones</a>.</p>
<h3>Sagas (ropa)</h3><p>Al llegar a ciertos levels se libera la ropa de la saga del anime correspondiente. Es solo estética; se elige en la ventana Sagas junto con el aura.</p>`},

{ id: "equipo", t: "4. Sets, ítems y armas", html: (G) => `
<p>El set es lo que decide el ritmo de caza. Faixas: Genin 1 · Kakashi 100 · Jiraiya 200 · Obito 400 · Hashirama 500 · Madara Rikudou 700 (+ Supreme Kage de la tienda).</p>
<ul><li><b>Ropa</b> (cabeza, cuerpo, piernas, pies): dropea en las hunts de la faixa.</li>
<li><b>Collar, anillo y escudo</b>: de los bosses (desafíos con mecánica y jefes del mundo). Ya no salen de misiones.</li>
<li><b>Arma</b>: solo de misiones (y casi siempre Común).</li></ul>
<div class="tw"><table><thead><tr><th>Set</th><th class="r">Faixa</th><th class="r">HP de las 8 piezas (base)</th><th class="r">En su rareza máxima</th></tr></thead><tbody>
<tr><td>Madara Rikudou</td><td class="r">700+</td><td class="r num">117.600</td><td class="r num">188.160</td></tr>
<tr><td>Supreme Kage (tienda, rareza fija)</td><td class="r">cualquiera</td><td class="r num">104.851</td><td class="r num">104.851</td></tr>
<tr><td>Hashirama</td><td class="r">500+</td><td class="r num">93.151</td><td class="r num">149.042</td></tr>
<tr><td>Obito</td><td class="r">400+</td><td class="r num">65.700</td><td class="r num">105.120</td></tr>
<tr><td>Jiraiya</td><td class="r">200+</td><td class="r num">11.040</td><td class="r num">17.664</td></tr>
<tr><td>Kakashi</td><td class="r">100+</td><td class="r num">5.520</td><td class="r num">8.832</td></tr>
<tr><td>Genin</td><td class="r">1+</td><td class="r num">551</td><td class="r num">882</td></tr></tbody></table></div>
${w("Fijate el salto Jiraiya → Obito: ×6 de vida. Por eso del 200 al 399 te va a costar aguantar hunts fuertes, y al llegar al 400 con el set Obito todo cambia. El Supreme Kage de la tienda es muy fuerte hasta el 500–699, pero un Hashirama legendario lo supera.")}
<h3>Rarezas</h3>
<p>Común ×1 · <span class="q2">Raro ×1,2</span> · <span class="q3">Épico ×1,4</span> · <span class="q4">Legendario ×1,6</span>. En hunts cae 88% Común, 9% Raro, 2,5% Épico, 0,5% Legendario (el Obito, Hashirama y Madara son más tacaños). En bosses: 50/38/9/3%.</p>
<p>Sufijos que pueden salir: <b>[TANK]</b> +10% HP máximo · <b>[DANO]</b> +10% daño de jutsus · <b>[SPEED]</b> −8% recarga de cura y buffs.</p>
<h3>Armas</h3>
<div class="tw"><table><thead><tr><th>Tipo</th><th>Alcance</th><th>Daño</th><th>Acierto</th></tr></thead><tbody>
<tr><td>Guante (Luva)</td><td>cuerpo a cuerpo</td><td>normal</td><td>siempre</td></tr>
<tr><td>Espada</td><td>cuerpo a cuerpo</td><td>normal</td><td>siempre</td></tr>
<tr><td>Distancia</td><td>hasta 4 sqm sin obstáculos</td><td>×1,5</td><td>50% con skill 10 → 67% con 80 → hasta 90%</td></tr></tbody></table></div>
${w("La de distancia empata con guante/espada recién con skill 80 de Distancia. Antes de eso, conviene cuerpo a cuerpo.")}
<h3>Ítems especiales</h3>
<ul><li><b>Pedra de Refinamento</b>: refina en la Dragon Forge. Solo de misiones.</li>
<li><b>Pedra de Refinamento Suprema</b>: para refinar piezas Legendarias. Solo misiones A, S y SS.</li>
<li><b>Essência de Chakra</b>: sube la rareza del Hashirama (1 cada ~540 kills en hunts Hashirama/Madara).</li>
<li><b>Essência de Chakra Pura</b>: la del Madara Rikudou (1 cada ~900 kills en hunts Madara).</li>
<li>Ítems del espacio Extra: <b>Nuvem da Akatsuki</b> (400+), <b>Selo dos Cinco Kages</b> (500+), <b>Olho do Rikudou</b> (700+). De desafíos con mecánica, jefes del mundo y misiones A/S/SS.</li>
<li><b>Amulet of Loss</b>: si morís, no cae nada.</li>
<li>Dinero: 100 money = 1 gold (se cambian solos).</li></ul>`},

{ id: "forja", t: "5. Dragon Forge", html: () => `
<p>Dos trabajos: <b>refinar</b> (+1 a +10) y <b>subir rareza</b>.</p>
<ul><li>Cada intento de refino gasta 1 piedra (las Legendarias usan la Suprema) y oro. Cada nivel da <b>+5% de atributos</b>.</li>
<li>Chances: +0→+1 90% · 85% · 80% · 72% · 62% · 52% · +6→+7 40% · 32% · 25% · +9→+10 18%.</li>
<li><b>Si falla, solo perdés la piedra</b>: la pieza no baja (confirmado en el código del servidor).</li>
<li>Subir rareza no tiene sorteo: gastás esencias + oro. Hashirama: 3/5/8 Essência de Chakra por paso. Madara: lo mismo con Essência Pura + Essência de Chakra.</li></ul>
${w("Como fallar no baja la pieza, refinar es solo cuestión de juntar piedras. Llegar a +5 cuesta en promedio ~6,5 piedras; a +7, ~11; a +10, ~23. Es el mayor “sumidero” de oro del juego: no refines piezas que vas a cambiar pronto.")}
<p><a href="#/forja">Abrir la calculadora de forja</a></p>`},

{ id: "tasks", t: "6. Tasks (la fuente principal de elo)", html: () => `
<p>Elegís una especie y una cantidad; lo que cazás cuenta solo. Solo hay tasks de cazar (las de juntar ítems se quitaron).</p>
<div class="grid g2"><div class="tw"><table><thead><tr><th>Dificultad</th><th>Faixa</th><th class="r">Recompensa</th><th class="r">Elo</th></tr></thead><tbody>
<tr><td>Muy fácil</td><td>2 abajo</td><td class="r">×0,5</td><td class="r">×0,3</td></tr><tr><td>Fácil</td><td>1 abajo</td><td class="r">×0,7</td><td class="r">×0,6</td></tr>
<tr><td>Media</td><td>la tuya</td><td class="r">×1</td><td class="r">×1</td></tr><tr><td><b>Difícil</b></td><td>1 arriba (abre 10 levels antes)</td><td class="r">×1,5</td><td class="r"><b>×1,6</b></td></tr></tbody></table></div>
<div class="tw"><table><thead><tr><th>Tamaño</th><th class="r">Kills</th><th class="r">Elo</th><th class="r">Cartas</th></tr></thead><tbody>
<tr><td>Corta</td><td class="r">150</td><td class="r">×1</td><td class="r">1</td></tr><tr><td>Larga</td><td class="r">400</td><td class="r">×2,6</td><td class="r">2</td></tr><tr><td><b>Extensa</b></td><td class="r">1.000</td><td class="r"><b>×6,5</b></td><td class="r">3</td></tr></tbody></table></div></div>
<p>Elo de una task = <b>(2 + faixa ÷ 50) × tamaño × dificultad</b>. Exp de la task = kills × exp del monstruo × 0,4 × recompensa (y después × tu stage). Aceptar cuesta el oro de 25 kills de tu faixa.</p>
<ul><li><b>Task diaria</b>: 200 kills, recompensa ×1,5 y +12 elo.</li>
<li><b>Task élite</b>: 1.000 kills de una especie específica (level 400+), +50 elo y pieza de set Rara o mejor.</li>
<li>La “Muy fácil” da poco elo, ninguna carta y no cuenta para las 50 tasks de Kage.</li></ul>
${w("El elo por kill casi no depende del tamaño, pero la Extensa paga una sola tarifa y da más cartas de caza (para el Prey). La faixa importa mucho: (2 + faixa/50) hace que una task del 500 dé 2× el elo de una del 200. Y la Difícil da ×1,6. Por eso subir de level rápido también es subir de elo rápido.")}
<p><a href="#/tasks">Calculadora de tasks</a></p>`},

{ id: "misiones", t: "7. Misiones", html: (G) => `
<p>Mandás al personaje y, cuando termina, recibe exp, dinero, el arma del set, piedras de refino y (en A, S y SS desde el 400) el ítem Extra. <b>Mientras tanto seguís jugando con él normalmente.</b></p>
<div class="tw"><table><thead><tr><th>Rank</th><th class="r">Duración</th><th class="r">Elo</th><th class="r">Arma</th><th class="r">Piedras</th><th class="r">Suprema</th><th class="r">Extra (400+)</th></tr></thead><tbody>
<tr><td>D</td><td class="r">30 min</td><td class="r">+1</td><td class="r">80%</td><td class="r">10%</td><td class="r"></td><td class="r"></td></tr>
<tr><td>C</td><td class="r">1 h</td><td class="r">+2</td><td class="r">60%</td><td class="r">20%</td><td class="r"></td><td class="r"></td></tr>
<tr><td>B</td><td class="r">2 h</td><td class="r">+4</td><td class="r">50%</td><td class="r">40%</td><td class="r"></td><td class="r"></td></tr>
<tr><td>A</td><td class="r">4 h</td><td class="r">+8</td><td class="r">40%</td><td class="r">60%</td><td class="r">5%</td><td class="r">4%</td></tr>
<tr><td>S</td><td class="r">8 h</td><td class="r">+18</td><td class="r">30%</td><td class="r">1</td><td class="r">12%</td><td class="r">3%</td></tr>
<tr><td>SS</td><td class="r">12 h</td><td class="r">+25</td><td class="r">20%</td><td class="r">1 a 2</td><td class="r">35%</td><td class="r">2%</td></tr></tbody></table></div>
<ul><li>Hasta 3 personajes de la cuenta en misión a la vez. Mandar cuesta 10% de lo que paga.</li>
<li>La recompensa se calcula por la faixa de la misión, no por tu level.</li>
<li>Pide el set de su faixa (o mejor) vestido: cabeza, armadura, pantalón y botas. El de la tienda sirve hasta las del 500–699.</li>
<li>Las piedras de la tabla son las del rank completo desde el 500; más abajo dan menos, y las de level bajo no dan.</li>
<li>Collar y anillo ya no salen de misiones.</li></ul>
${w("Es exp, oro, piedras y elo gratis: nunca dejes el slot vacío. Si vas a dormir o trabajar, la SS (12 h) es la que mejor aprovecha el tiempo.")}
<p><a href="#/misiones">Ver qué misión te conviene</a></p>`},

{ id: "prey", t: "8. Prey y Bestiario", html: () => `
<p>El <b>Bestiario</b> cuenta lo que matás; el <b>Prey</b> lo convierte en bonus.</p>
<h3>Prey</h3>
<ul><li>3 espacios (2 más con VIP), cada uno con una especie y un bonus.</li>
<li>Cada elección dura 2 h (de caza en esa especie); cambiar gratis vuelve cada 20 h.</li>
<li>Las cartas (6 tipos) re-sortean el bonus, traban el espacio o eligen la especie. Salen de las tasks (1/2/3 según tamaño, 2 la diaria) y de los bosses.</li>
<li><b>Cada 60 kills de la especie elegida sale 1 punto de jutsu.</b></li></ul>
<div class="tw"><table><thead><tr><th>Bonus</th><th>Qué hace</th><th class="r">Rango</th></tr></thead><tbody>
<tr><td>Daño</td><td>más daño a la especie</td><td class="r">7% a 25%</td></tr><tr><td>Defensa</td><td>menos daño recibido</td><td class="r">12% a 30%</td></tr>
<tr><td>Experiencia</td><td>más exp en la especie</td><td class="r">13% a 40%</td></tr><tr><td>Loot</td><td>más loot de la especie</td><td class="r">13% a 40%</td></tr></tbody></table></div>
<h3>Bestiario</h3>
<p>Matar la misma especie desbloquea marcas: 1.000 kills (1 punto, +5 elo), 5.000 (1 punto, +10 elo), 10.000 (2 puntos, +20 elo). Cada punto de bestiario vale +0,25% de exp, hasta 100 puntos.</p>
${w("Poné el Prey (Experiencia o Loot) en la misma especie de tu task: todo suma a la vez — task, élite, bestiario y puntos de jutsu.")}`},

{ id: "kage", t: "9. Graduación, Kages y títulos", html: (G) => `
<p>El <b>elo</b> sube tu patente. La última, <b>Kage</b>, es solo para los 5 primeros del ranking de elo.</p>
<div class="tw"><table><thead><tr><th>Patente</th><th class="r">Elo</th><th>Bonus</th></tr></thead><tbody>
<tr><td>Aluno</td><td class="r">0</td><td>—</td></tr><tr><td>Genin</td><td class="r">50</td><td>+1 taijutsu</td></tr><tr><td>Chunin</td><td class="r">100</td><td>+2 taijutsu, +2% regen</td></tr>
<tr><td>Jounin</td><td class="r">200</td><td>+1 ninjutsu, +3 taijutsu, +4% regen</td></tr><tr><td>Anbu</td><td class="r">400</td><td>+2 ninjutsu, +4 taijutsu, +6% regen</td></tr>
<tr><td>Sannin</td><td class="r">700</td><td>+5 ninjutsu, +5 taijutsu, +8% regen</td></tr>
<tr><td><b>Kage</b></td><td class="r"><b>20.000</b></td><td>+12 ninjutsu, +12 taijutsu, +20% regen, <b>+10% exp, +5% HP</b>. Pide además <b>todas las sagas, 50 tasks y estar en el top 5 de elo</b>.</td></tr></tbody></table></div>
<h3>De dónde sale el elo</h3>
<div class="tw"><table><thead><tr><th>Fuente</th><th class="r">Elo</th><th>Frecuencia</th></tr></thead><tbody>
<tr><td>Tasks</td><td class="r">(2 + faixa/50) × tamaño × dificultad</td><td>sin límite — la base de todo</td></tr>
<tr><td>Task élite</td><td class="r">+50</td><td>una por especie élite</td></tr>
<tr><td>Task diaria</td><td class="r">+12</td><td>1 por día</td></tr>
<tr><td>Misiones</td><td class="r">+1 a +25</td><td>según rank</td></tr>
<tr><td>Sagas</td><td class="r">+25</td><td>36 en total, una vez</td></tr>
<tr><td>Desafíos con mecánica</td><td class="r">+10</td><td>cada uno cada 24 h</td></tr>
<tr><td>Bestiario</td><td class="r">+5 / +10 / +20</td><td>por etapa por especie</td></tr>
<tr><td>Jefe del mundo</td><td class="r">hasta +40</td><td>repartido según tu % de daño</td></tr>
<tr><td>Castillo (guild)</td><td class="r">+30</td><td>cuando tu guild lo conquista</td></tr></tbody></table></div>
<h3>Los cinco Kages</h3>
<p>De los que cumplen la patente (20.000 elo, 36 sagas, 50 tasks), los 5 de más elo son Kages; el servidor rehace la lista cada minuto. 1º <b>Hokage</b> (Konoha), 2º Kazekage (Suna), 3º Raikage (Kumo), 4º Mizukage (Kiri), 5º Tsuchikage (Iwa). Mientras seas Kage tenés la patente, el bonus y el título; el <b>manto queda para siempre</b>.</p>
${w("Como el ranking es de elo y no de level, alguien que haga tasks Extensas Difíciles todo el día le gana a alguien de más level que solo caza. La clave es nunca cazar sin una task activa.")}
<p><a href="#/hokage">Abrir el planificador del camino a Hokage</a></p>
<h3>Títulos</h3>
<p>Se eligen en Graduação › Títulos y aparecen sobre tu nombre. Algunos: Lenda Viva (level 1000), Veterano (500), Sannin (patente), Herói das Sagas (todas las sagas), Caçador / Mestre do Bestiário, Matador de Chefes (500 bosses), Desafiante / Domador de Mecânicas, Jinchūriki (ganar el evento de la bijuu), Incansável (300 tasks), Ninja de Elite (100 misiones), y los de la Ranqueada.</p>`},

{ id: "bosses", t: "10. Sagas y desafíos con mecánica", html: () => `
<ul><li><b>Sagas</b>: la línea de tiempo del anime, en orden. Cada una libera la siguiente y da <b>+25 elo</b>. Son 36 (de Mizuki, level 10, a Kaguya, level 600). Obligatorias para Kage.</li>
<li><b>Desafíos con mecánica</b> (JOGAR › Chefes): de 1 a 3 ninjas de la misma party en una arena cerrada. A ciertas fracciones de vida el boss va al centro y suelta la mecánica (el piso rojo muestra dónde cae). Premio: collar/anillo/escudo del set de la faixa, +10 elo, cooldown 24 h. Hay que hacer al menos 10% del daño.</li>
<li>Desde el 500: mecánicas especiales (no te muevas, no lo mires, rompe el golpe, mata los clones, sepárense, memoria, arena que se achica).</li></ul>
<p><a href="#/bosses">Lista completa con cómo resolver cada mecánica</a></p>`},

{ id: "eventos", t: "11. Eventos", html: () => `
<ul><li><b>Evento de la Bijuu</b> — todos los días 18:00 (Brasilia), level 100+. Quien más daño hace se lleva el pergamino de esa bijuu. Los especiales no le pegan.</li>
<li><b>Guerra por la Jūbi</b> — 20:00, level 200+. Deathmatch; el ganador sella la Jūbi. Morir ahí no quita level.</li>
<li><b>Hora de la Ranqueada</b> — 21:00, level 200+. PP para el top 3.</li>
<li><b>Castillo de las guilds</b> y <b>Madara, el Fantasma</b> (fines de semana, 480+) — a veces en mantenimiento.</li>
<li>En el jefe del mundo morir no quita exp; exp, gold y elo se reparten por daño, y los 3 que más pegan ganan pieza de set.</li></ul>
<p><a href="#/eventos">Ver horarios en tu hora local</a></p>`},

{ id: "economia", t: "12. Economía y Puntos Premium", html: () => `
<ul><li>100 money = 1 gold. Los monstruos flojos dropean money. Personaje nuevo arranca con 100 money.</li>
<li><b>Dónde se va el oro:</b> Dragon Forge (el mayor sumidero), aceptar tasks (25 kills de tu faixa), mandar misiones (10%), pociones (3 gold cada una, igual a cualquier level), mochilas (precio fijo), tasa del mercado 5% (3% con VIP).</li>
<li><b>Puntos Premium (PP)</b>: compran en la Tienda Premium. También se pueden sacar a la mochila como gema y venderlos en el mercado por gold o PP. El bazar de personajes es una subasta en PP.</li>
<li>Regla del juego: “el dinero compra tiempo, no poder”.</li></ul>
${w("Si no querés gastar plata real, podés comprar gemas de PP con gold en el mercado. Lo que más rinde de la tienda para progresar es el VIP (+20% exp, más offline, 2 slots más de Prey, 4º especial) y el XP Boost.")}`},

{ id: "pvp", t: "13. PvP", html: () => `
<ul><li>Protección hasta el level 200: antes no podés entrar en PvP.</li>
<li>En modo PvP ganás <b>+30% de exp y loot ×1,3</b> (contra ×0,7 en PvE), a cambio de que otros jugadores en PvP te puedan atacar.</li>
<li>Calavera blanca 5 min al atacar; 50 muertes en 24 h dan calavera roja (3 días).</li>
<li>En PvP: cura ×0,5, pociones ×0,2, crítico/esquiva/reducción de daño a la mitad, y topes de daño por golpe.</li>
<li>Los jutsus de área no tocan a quien está en PvE.</li></ul>
${w("Para un clan organizado, el modo PvP es un multiplicador enorme: cazar en grupo en PvP da casi el doble de loot. Si estás solo y sos frágil, quedate en PvE.")}`},

{ id: "reglas", t: "14. Reglas del servidor", html: () => `
<ul><li>Prohibido usar bot, script, macro o cualquier programa que toque el juego o el navegador para sacar ventaja. El Auto Helper y la caza offline sí están permitidos. <b>Este sitio no toca el juego: solo calcula con datos públicos.</b></li>
<li>Prohibido abusar de bugs (y ocultar el abuso de otros): se reportan en el canal de bugs del Discord.</li>
<li>Nombres ofensivos o parecidos a los del staff se cambian o borran.</li>
<li>Prohibido bloquear el camino de otros a propósito (salvo en guerra de guilds).</li>
<li>Permitido: matar un monstruo que otro está atacando, cazar en la misma hunt, atraer monstruos cerca de otro.</li>
<li>Las cuentas son personales; el staff nunca pide tu contraseña. Préstamos, estafas en trades e ítems tirados no se devuelven.</li>
<li>Chat: sin links no autorizados, spam, publicidad de otros juegos ni comercio por fuera del juego.</li>
<li>Los PP son donaciones: no se reembolsan.</li>
<li>Castigos: advertencia, silencio, ban temporal o borrado.</li></ul>`},
];

export const GLOSSARY = [
["Interfaz", [
["Jogar", "Jugar (elegir hunt / bosses)"], ["Caçada / Hunt", "Caza / zona de caza"], ["Faixa", "Franja / rango de levels"], ["Mochila", "Mochila"], ["Ficha", "Ficha del personaje"],
["Missões", "Misiones"], ["Bestiário", "Bestiario"], ["Graduação", "Graduación / rango ninja"], ["Patente", "Rango"], ["Mercado / Feira Ninja", "Mercado entre jugadores"],
["Bazar", "Subasta de personajes"], ["Forja", "Forja (Dragon Forge)"], ["Loja Premium", "Tienda premium"], ["Votações", "Votaciones"], ["Inventário", "Inventario"],
["Progressão", "Progreso"], ["Batalha", "Batalla"], ["Opções", "Opciones"], ["Personagens", "Personajes"], ["Sair", "Salir"], ["Mini janela", "Mini ventana"],
["Depositar", "Depositar"], ["Desafiar", "Desafiar"], ["Chefes", "Jefes / bosses"], ["Treino / Treinar", "Entrenamiento / entrenar"]]],
["Combate", [
["Dano", "Daño"], ["Dano recebido", "Daño recibido"], ["Vida / HP", "Vida"], ["Chakra / Mana", "Chakra"], ["Cura", "Curación"], ["Alvo", "Objetivo"],
["Atordoar / atordoado", "Aturdir / aturdido"], ["Prender / preso", "Atrapar / atrapado (no se mueve)"], ["Sem jutsus", "Silenciado (no puede usar jutsus)"], ["Cego", "Ciego"],
["Esquiva", "Esquiva"], ["Bloqueio", "Bloqueo"], ["Recarga", "Recarga / cooldown"], ["Golpe", "Golpe / ataque básico"], ["Especial", "Habilidad especial"],
["Provocar", "Provocar (taunt)"], ["Invulnerável", "Invulnerable"], ["Inimigos perto", "Enemigos cerca"], ["Abate", "Kill / muerte de un monstruo"], ["Morrer / morte", "Morir / muerte"]]],
["Equipo", [
["Peça", "Pieza"], ["Cabeça / Armadura / Calças / Botas", "Cabeza / Armadura / Pantalón / Botas"], ["Colar / Anel / Escudo", "Collar / Anillo / Escudo"], ["Arma / Luva / Espada", "Arma / Guante / Espada"],
["Raridade", "Rareza"], ["Comum / Raro / Épico / Lendário", "Común / Raro / Épico / Legendario"], ["Refino / Refinar", "Refino / refinar"], ["Pedra de Refinamento", "Piedra de refino"],
["Essência", "Esencia"], ["Melhoria", "Mejora"], ["Dropar / drop", "Soltar un ítem / botín"], ["Loot", "Botín"]]],
["Progreso", [
["Elo points", "Puntos de elo (ranking de graduación)"], ["Task / Tarefa", "Tarea de caza"], ["Fácil / Média / Difícil / Muito fácil", "Fácil / Media / Difícil / Muy fácil"], ["Curta / Longa / Extensa", "Corta / Larga / Extensa"],
["Carta de caça", "Carta de caza (para el Prey)"], ["Estágio", "Etapa"], ["Saga", "Saga (boss de la historia)"], ["Personagem do dia", "Personaje del día"], ["Desafio com mecânica", "Desafío con mecánica"],
["Pontos de jutsu", "Puntos de jutsu"], ["Aprimorar", "Mejorar"], ["Guilda", "Guild / clan"], ["Castelo", "Castillo"], ["Ranqueada", "Ranked (PvP clasificatorio)"], ["Temporada", "Temporada"]]],
["Chat y comunidad", [
["Valeu / vlw", "Gracias"], ["Bora / Partiu", "¡Vamos!"], ["Mano / cara", "Amigo / che"], ["Chama no privado / pv", "Escribime por privado"], ["Upar", "Subir de level"],
["Fazer party", "Armar party"], ["Alguém pra…?", "¿Alguien para…?"], ["Vendo / Compro / Troco", "Vendo / Compro / Cambio"], ["Quanto?", "¿Cuánto?"], ["Pegar / pego", "Agarrar / tomar"],
["Ajuda", "Ayuda"], ["Desculpa", "Perdón"], ["Beleza / blz", "Dale / está bien"], ["Tmj (tamo junto)", "Estamos juntos (saludo de compañerismo)"], ["Noob", "Novato"]]],
];
