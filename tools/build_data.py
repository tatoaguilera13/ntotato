# Construye site/data/game.json a partir de los datos extraídos del juego (raw/).
import json, re, os
RAW = '/home/claude/raw'
OUT = '/home/claude/site/data/game.json'
C = json.load(open(f'{RAW}/computed.json'))
sets_cfg = json.load(open(f'{RAW}/sets.json'))
events = json.load(open(f'{RAW}/events.json'))
bijuu = json.load(open(f'{RAW}/bijuu.json'))
config = json.load(open(f'{RAW}/config.json'))

# ---------- traducción pt -> es de frases cortas de la wiki ----------
PT_ES = [
 ("(ou ", "(o "), ("não morre", "\u2060no muere"), ("no fim", "al final"), (" no ", " en el "), ("não", "no"), ("perto", "cerca"), ("Corpo", "Cuerpo"),
 ("contra jogador: até", "contra jugador: hasta"), ("contra jogador", "contra jugador"),
 ("com o SEU HP abaixo de", "con TU HP por debajo de"), ("com o seu HP abaixo de", "con tu HP por debajo de"),
 ("2+ inimigos perto (ou boss/jogador)", "2+ enemigos cerca (o boss/jugador)"),
 ("boss, jogador ou 3+ inimigos", "boss, jugador o 3+ enemigos"),
 ("inimigos perto", "enemigos cerca"), ("dano recebido", "daño recibido"), ("de dano", "de daño"),
 ("dano:", "daño:"), ("alvo sem marca", "objetivo sin marca"), ("controle no alvo", "control sobre el objetivo"),
 ("proteção:", "protección:"), ("suporte:", "soporte:"), ("em volta", "alrededor"), ("no fim", "al final"),
 ("vira vida", "se convierte en vida"), ("sem jutsus", "sin jutsus"), ("invulnerável", "invulnerable"),
 ("atordoar", "aturdir"), ("atordoa", "aturde"), ("prende", "atrapa"), ("prender", "atrapar"), ("preso", "atrapado"),
 ("cego", "ciego"), ("avança até o alvo", "avanza hasta el objetivo"), ("avança", "avanza"), ("empurra", "empuja"),
 ("transformação", "transformación"), ("velocidade", "velocidad"), ("imune a", "inmune a"), ("imune", "inmune"),
 ("invoca", "invoca"), ("esquiva", "esquiva"), ("aliados", "aliados"), ("aliado ferido", "aliado herido"),
 ("ferido", "herido"), ("tira ", "quita "), ("provoca", "provoca"), ("monstros", "monstruos"), ("brigando", "peleando"),
 ("chefe", "jefe"), ("outro mundo", "otro mundo"), ("invisível", "invisible"), ("invisíveis", "invisibles"),
 ("puxa", "atrae"), ("leva", "lleva"), ("devolve", "devuelve"), ("não", "no"), ("sozinho", "solo"), ("mata", "mata"),
 ("custa", "cuesta"), ("vale", "vale"), ("envenena", "envenena"), ("veneno", "veneno"), ("depois", "después"),
 ("corpo", "cuerpo"), ("vai", "va"), ("evento", "evento"), ("revive", "revive"), ("controla", "controla"),
 ("confunde", "confunde"), ("destruído", "destruido"), ("morre", "muere"), ("nunca", "nunca"), ("só ", "solo "),
 ("na mão", "a mano"), ("copia", "copia"), ("inteira", "entera"), ("absorve", "absorbe"), ("corações", "corazones"),
 ("marionete", "marioneta"), ("tentáculo", "tentáculo"), ("cópia", "copia"), ("caminho", "camino"), ("manda", "manda"),
 ("rato", "ratón"), ("tinta", "tinta"), ("esquivam", "esquivan"), ("pedaço", "pedazo"), ("branco", "blanco"),
 ("golpes", "golpes"), ("golpe", "golpe"), ("todos", "todos"), ("cura", "cura"), ("chakra", "chakra"),
 ("dano", "daño"), ("alvo", "objetivo"), ("jogador", "jugador"), ("inimigos", "enemigos"), ("abaixo", "por debajo"),
 ("seu ", "tu "), ("você", "tú"), (" ou ", " o "), (" com ", " con "), (" sem ", " sin "), (" em ", " en "),
 (" até ", " hasta "), (" do ", " del "), (" dos ", " de los "), (" no ", " en el "), (" na ", " en la "),
 (" um ", " un "), (" para ", " para "), (" por ", " por "), ("recarga", "recarga"), ("arma", "arma"),
 ("skills", "skills"), ("comum", "común"), ("sela", "sella"), ("clone", "clon"), ("cinzas", "cenizas"),
 ("vida", "vida"), ("combate", "combate"), ("proteção", "protección"), ("controle", "control"), ("suporte", "soporte"),
]
def tr(s):
    s = ' ' + s + ' '
    for a, b in PT_ES:
        s = s.replace(a, b)
    return s.replace('\u2060','').strip()

TAGS = ["PARALYZE","SILENCE","HEAL","BUFF","BLIND","AREA","MARK","DASH","INVULN","DEFENSE","TAUNT","TRAP",
        "CONTROL","INVIS","EXECUTE","SUMMON","WORLD","POISON","CLEANSE","CONFUSE","PULL","STEALTH","DEBUFF","PUSH","LIFESTEAL","REVIVE","COPY"]
TAG_ES = {"PARALYZE":"aturdir","SILENCE":"silenciar","HEAL":"cura","BUFF":"buff","BLIND":"cegar","AREA":"área","MARK":"marca",
          "DASH":"avance","INVULN":"invulnerable","DEFENSE":"defensa","TAUNT":"provocar","TRAP":"atrapar","CONTROL":"control",
          "INVIS":"invisible","EXECUTE":"ejecutar","SUMMON":"invocación","WORLD":"otro mundo","POISON":"veneno"}
def split_tags(s):
    out=[]; i=0
    while i < len(s):
        for t in sorted(TAGS, key=len, reverse=True):
            if s.startswith(t, i): out.append(t); i += len(t); break
        else: i += 1
    return out

# ---------- especiales ----------
spec = {}
cur = None
for line in open(f'{RAW}/wiki/especiais.txt'):
    line=line.rstrip('\n')
    if line.startswith('#H3 '): cur=line[4:].strip(); spec[cur]=[]; continue
    if cur and line.count('|')>=5 and not line.startswith('Lv'):
        c=[x.strip() for x in line.split('|')]
        spec[cur].append({"lv":int(c[0]) if c[0].isdigit() else c[0],"n":c[1],"tags":[TAG_ES.get(t,t.lower()) for t in split_tags(c[2])],
                          "que":tr(c[3]),"cuando":tr(c[4]),"cd":c[5]})

# ---------- vocaciones ----------
CLS_ES = {"Dano":"Daño","Off-tank":"Off-tank","Tank":"Tank","Suporte":"Soporte"}
vocs=[]
for v in C['voc']:
    if v['hidden']: continue
    vocs.append({"n":v['n'],"id":v['id'],"cls":CLS_ES.get(v['cls'],v['cls']),"vip":v['vip'],"esp":spec.get(v['n'],[])})
vocs.sort(key=lambda x:x['n'])
voc_ids = sorted(v['id'] for v in vocs)
vip_ids = sorted(v['id'] for v in vocs if v['vip'])

# ---------- monstruos / hunts ----------
mons = {m['n']: m for m in C['monsters']}
monsters=[{"n":m['n'],"k":m['k'],"lv":m['lv'],"exp":m['exp'],"hp":m['hp'],"dps":m['dps'],"g":m['g'],"set":m['set'],"sd":m['sd'],
           "mats":m['mats']} for m in C['monsters'] if m['k']=='normal' and m['exp']]
SET_NAME = {s['id']: s['name'] for s in sets_cfg['sets']}
def set_for_level(lv):
    best=None
    for s in sets_cfg['sets']:
        if s.get('legacy'): continue
        if s['band']<=lv and (best is None or s['band']>best['band']): best=s
    return best['id']
hunts=[]
for h in C['hunts']:
    name=h['n']
    hunts.append({"id":h['id'],"n":name,"lv":h['lv'],"min":h['min'],"mon":h['mon'],"tot":h['tot'],"fl":h['fl'],"set":set_for_level(h['lv'])})

# ---------- sets (stats de la wiki) ----------
sets_stats={}; cur=None
for line in open(f'{RAW}/wiki/sets.txt'):
    m=re.match(r'#H3 (.+?) faixa (\d+)',line)
    if m: cur=m.group(1).strip(); sets_stats[cur]=[]; continue
    if cur and line.count('|')==5 and not line.startswith('Peça'):
        c=[x.strip() for x in line.split('|')]
        num=lambda s:int(s.replace('.','')) if s else 0
        src={"hunts da faixa":"hunts de la faixa","bosses":"bosses","missões":"misiones"}.get(c[5],c[5])
        sets_stats[cur].append({"n":c[0],"slot":c[1],"hp":num(c[2]),"mp":num(c[3]),"arm":num(c[4]),"src":src})
SLOT_ES={"head":"cabeza","body":"cuerpo","legs":"piernas","feet":"pies","weapon":"arma","shield":"escudo","necklace":"collar","ring":"anillo"}
sets=[]
for s in sets_cfg['sets']:
    if s.get('legacy'): continue
    sets.append({"id":s['id'],"n":s['name'],"band":s['band'],"kpp":s.get('killsPerPiece'),"power":s.get('power'),
                 "w":s.get('weights',sets_cfg['weights']),"bw":s.get('bossWeights',sets_cfg['bossWeights']),
                 "ew":s.get('eliteWeights',sets_cfg['eliteWeights']),"up":s.get('up'),
                 "pieces":[{**p,"slot":SLOT_ES.get(p['slot'],p['slot'])} for p in sets_stats.get(s['name'],[])]})
shop=sets_cfg['shop']

# ---------- bosses con mecánica (wiki) ----------
MEC_ES={"não se mexa":"no te muevas","marca no ninja":"marca en el ninja","arena encolhendo":"arena que se achica",
        "não olhe para ele":"no lo mires","quebre o golpe":"rompe el golpe","mate os clones":"mata los clones","memória":"memoria",
        "preso antes do vermelho":"atrapado antes del rojo"}
mech=[]; sagas=[]; mode=None
for line in open(f'{RAW}/wiki/bosses.txt'):
    line=line.rstrip('\n')
    if line.startswith('Boss |'): mode='b'; continue
    if line.startswith('Saga |'): mode='s'; continue
    if line.startswith('#'):
        if mode=='s' and line.startswith('#H'): mode=None
        continue
    c=[x.strip() for x in line.split('|')]
    if mode=='b' and len(c)==5:
        esp=[MEC_ES.get(x.strip(),x.strip()) for x in c[3].split(',') if x.strip()]
        premio=c[4].replace('colar/anel/escudo','collar/anillo/escudo').replace('até Épico','hasta Épico').replace('até Lendário','hasta Legendario')
        mech.append({"n":c[0],"lv":int(c[1]),"mec":c[2],"esp":esp,"premio":premio})
    if mode=='s' and len(c)==4:
        num=lambda s:int(s.replace('.',''))
        sagas.append({"n":c[0],"lv":int(c[1]),"hp":num(c[2]),"dps":num(c[3])})

# ---------- misiones ----------
missions=C['missions']

# ---------- eventos ----------
wb=events['worldBosses']
ev={"bosses":[{"n":b['title'],"mon":b['monster'],"lv":b['minLevel'],"times":b['times'],"days":b.get('days'),"off":b.get('off',False)} for b in wb['list']],
    "juubi":{"times":events['juubi']['times'],"min":events['juubi']['minLevel']},
    "castle":{"off":events['castle'].get('off',False),"times":events['castle']['times'],"days":events['castle']['days']},
    "ranked":{"min":events['ranked']['minLevel'],"times":events['ranked']['event']['times'],"dur":events['ranked']['event']['durMin'],
              "prizes":events['ranked']['event']['prizes']},
    "exp":events['expEvents']}

# ---------- bijuus ----------
bij=[{"n":b['name'],"tails":b['tails'],"price":b['price'],"jutsus":b['jutsus'],"mode":b['mode']} for b in bijuu['bijuus']]

game={
 "gen": "2026-10-22",
 "curve": C['curve'],
 "stages": config['expStages'],
 "monsters": monsters, "hunts": hunts, "sets": sets, "shop": shop,
 "rar": sets_cfg['rarities'],
 "tasks": C['tasks'], "missions": missions, "bands": C['bands'],
 "mech": mech, "sagas": sagas, "events": ev, "bijuus": bij,
 "vocs": vocs, "vocIds": voc_ids, "vipIds": vip_ids, "vocOfDayCheck": C['vocOfDay'],
 "ranks": config['ranks'],
 "dmgf": config['damageFactors'],
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(game, open(OUT,'w'), ensure_ascii=False, separators=(',',':'))
print('ok', os.path.getsize(OUT), 'bytes;', len(vocs),'vocs', sum(len(v['esp']) for v in vocs),'especiales', len(mech),'mech', len(sagas),'sagas', len(sets),'sets', len(hunts),'hunts')
print(vocs[0]['esp'][:2]); print(sets[2]['pieces'][:2]); print(mech[5]); print(config['ranks'])
