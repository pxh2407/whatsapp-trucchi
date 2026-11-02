// Elenca le frasi della voce leggendo i dati da index.html (parte fra DATI-INIZIO e DATI-FINE).
// Uso: node strumenti/frasi.js > frasi.json
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const a = html.indexOf('/* DATI-INIZIO');
const b = html.indexOf('/* DATI-FINE */');
if (a < 0 || b < 0) throw new Error('Segnaposto DATI-INIZIO / DATI-FINE non trovati');
const codice = html.slice(html.indexOf('\n', a) + 1, b);
const d = new Function(codice + '\nreturn { TRUCCHI, scenaDi, fileVoce, testoVoce };')();
const frasi = [];
const visti = {};
d.TRUCCHI.forEach((tr, n) => {
  ['a', 'i'].forEach(tel => {
    const scena = d.scenaDi(tr, tel);
    if (!scena) return;
    scena.forEach((f, k) => {
      const file = d.fileVoce(n, tr, tel, k);
      if (visti[file]) return;
      visti[file] = true;
      frasi.push({ file, testo: d.testoVoce(n, tr, k, f) });
    });
  });
});
process.stdout.write(JSON.stringify(frasi, null, 1));
