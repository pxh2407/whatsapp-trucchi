// Prende da index.html la parte fra «INIZIO APP» e «FINE APP» e la mette, dentro un blocco wp:html,
// in per-wordpress\blocco-wordpress.txt:   node crea-blocco-wordpress.js
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const inizio = html.indexOf('<!-- INIZIO APP');
const fine = html.indexOf('<!-- FINE APP -->');
if (inizio < 0 || fine < 0) throw new Error('Segnaposto INIZIO/FINE APP non trovati');
// sul sito voce e foto arrivano da GitHub Pages (repo pxh2407/whatsapp-trucchi)
const ONLINE = 'https://pxh2407.github.io/whatsapp-trucchi/';
let app = html.slice(html.indexOf('\n', inizio) + 1, fine).trim();
for (const [da, a] of [['data-audio="audio/"', 'data-audio="' + ONLINE + 'audio/"'], ['data-immagini="immagini/"', 'data-immagini="' + ONLINE + 'immagini/"']]) {
  if (!app.includes(da)) throw new Error('Non trovo ' + da);
  app = app.replace(da, a);
}
// Il database del sito non accetta i caratteri a 4 byte (quasi tutte le emoji): WordPress li cambia in &#x...;
// e dentro script e style si romperebbero. Li scriviamo noi in forma sicura, così WordPress non tocca niente:
// nello script \u{1F4F8}, nello stile \1F4F8 , nel resto &#x1f4f8;
// (WordPress cambia anche simboli «corti» come ✔ ▶ e il selettore invisibile U+FE0F: per sicurezza
// si trattano così tutti i caratteri da U+2000 in su; lettere accentate e «» restano come sono)
const LUNGHI = /[ -￿\u{10000}-\u{10FFFF}]/gu;
const hex = c => c.codePointAt(0).toString(16);
app = app.replace(/(<script>[\s\S]*?<\/script>)|(<style>[\s\S]*?<\/style>)|([^<]+|<)/g, (m, sc, st) => {
  if (sc) return sc.replace(LUNGHI, c => '\\u{' + hex(c).toUpperCase() + '}');
  if (st) return st.replace(LUNGHI, c => '\\' + hex(c).toUpperCase() + ' ');
  return m.replace(LUNGHI, c => '&#x' + hex(c) + ';');
});
if (LUNGHI.test(app)) throw new Error('Sono rimaste emoji a 4 byte');
const script = app.slice(app.indexOf('<script>'), app.indexOf('</script>'));
// WordPress trasforma le «&» dentro gli script e la pagina resta vuota
if (script.includes('&')) throw new Error('Nello script c\'è una «&»');
// Broken Link Checker rovina href/src scritti dentro le stringhe dello script
if (/(href|src)="/.test(script)) throw new Error('Nello script c\'è un href=" o src="');
fs.mkdirSync(path.join(__dirname, 'per-wordpress'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'per-wordpress', 'blocco-wordpress.txt'),
  '<!-- wp:html -->\n' + app + '\n<!-- /wp:html -->\n', 'utf8');
console.log('Creato per-wordpress\\blocco-wordpress.txt (' + app.length + ' caratteri)');
