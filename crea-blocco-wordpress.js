// Prende da index.html la parte fra «INIZIO APP» e «FINE APP» e la mette, dentro un blocco wp:html,
// in per-wordpress\blocco-wordpress.txt:   node crea-blocco-wordpress.js
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const inizio = html.indexOf('<!-- INIZIO APP');
const fine = html.indexOf('<!-- FINE APP -->');
if (inizio < 0 || fine < 0) throw new Error('Segnaposto INIZIO/FINE APP non trovati');
const app = html.slice(html.indexOf('\n', inizio) + 1, fine).trim();
const script = app.slice(app.indexOf('<script>'), app.indexOf('</script>'));
// WordPress trasforma le «&» dentro gli script e la pagina resta vuota
if (script.includes('&')) throw new Error('Nello script c\'è una «&»');
// Broken Link Checker rovina href/src scritti dentro le stringhe dello script
if (/(href|src)="/.test(script)) throw new Error('Nello script c\'è un href=" o src="');
fs.mkdirSync(path.join(__dirname, 'per-wordpress'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'per-wordpress', 'blocco-wordpress.txt'),
  '<!-- wp:html -->\n' + app + '\n<!-- /wp:html -->\n', 'utf8');
console.log('Creato per-wordpress\\blocco-wordpress.txt (' + app.length + ' caratteri)');
