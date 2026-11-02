# Registra con la voce naturale (edge-tts) le frasi del racconto.
# Uso (dalla cartella WHATSAPP TRUCCHI):  node strumenti/frasi.js > frasi.json  e poi  python strumenti/voci.py frasi.json
# - si rifanno solo le frasi nuove o cambiate (audio/elenco.json ricorda il testo di ogni file);
# - i file che non servono più si cancellano.
import asyncio, json, os, sys
import edge_tts

VOCE = 'it-IT-IsabellaNeural'
VELOCITA = '-8%'
CARTELLA = 'audio'
ELENCO = os.path.join(CARTELLA, 'elenco.json')


async def registra(testo, percorso):
    com = edge_tts.Communicate(testo, voice=VOCE, rate=VELOCITA)
    audio = bytearray()
    async for c in com.stream():
        if c['type'] == 'audio':
            audio.extend(c['data'])
    if len(audio) < 2000:
        raise RuntimeError('registrazione vuota')
    with open(percorso, 'wb') as out:
        out.write(audio)


async def main():
    frasi = json.load(open(sys.argv[1], encoding='utf-8'))
    os.makedirs(CARTELLA, exist_ok=True)
    try:
        vecchio = json.load(open(ELENCO, encoding='utf-8'))
    except Exception:
        vecchio = {}
    elenco, nuove, errori = {}, 0, 0
    for f in frasi:
        percorso = os.path.join(CARTELLA, f['file'])
        if os.path.exists(percorso) and vecchio.get(f['file']) == f['testo']:
            elenco[f['file']] = f['testo']
            continue
        for prova in range(3):
            try:
                await asyncio.wait_for(registra(f['testo'], percorso), 60)
                elenco[f['file']] = f['testo']
                nuove += 1
                break
            except Exception as e:
                print(f'  riprovo ({prova + 1}) {f["file"]}: {str(e)[:120]}', flush=True)
                await asyncio.sleep(2 + 4 * prova)
        else:
            errori += 1
    for nome in os.listdir(CARTELLA):
        if nome.endswith('.mp3') and nome not in elenco:
            os.remove(os.path.join(CARTELLA, nome))
    with open(ELENCO, 'w', encoding='utf-8', newline='\n') as out:
        json.dump(elenco, out, ensure_ascii=False, indent=1)
    print(f'Frasi: {len(frasi)} · registrate ora: {nuove} · già pronte: {len(elenco) - nuove} · non riuscite: {errori}')


asyncio.run(main())
