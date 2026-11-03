import fs from 'node:fs';
const client=fs.readFileSync('dist/index.html','utf8').replaceAll('\r\n','\n');
const css=client.match(/<style>([\s\S]*?)<\/style>/)[1];
const base=client.slice(client.indexOf('const icons='),client.indexOf('\nconst CLIENT_ID='));
const adminCss=fs.readFileSync('admin.css','utf8');
const adminJs=fs.readFileSync('admin.js','utf8');
const html=`<!doctype html>
<html lang="et"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#452b39"><title>Meie päev · Korraldaja stuudio</title><meta name="description" content="Pulmakorraldaja töölaud: pulmaprojektid, tähtajad, kontaktid ja kokkulepped."><style>${css}\n${adminCss}</style></head><body><div id="app"></div><div id="overlay-root"></div><div id="toast-root" role="status" aria-live="polite"></div><script>
/*DEMO_SNAPSHOT*/
${base}
${adminJs}
</script></body></html>`;
new Function(html.match(/<script>([\s\S]*)<\/script>/)[1]);
new Function(client.match(/<script>([\s\S]*)<\/script>/)[1]);
fs.writeFileSync('dist/admin.html',html);
console.log('Admin built; client and admin JavaScript syntax verified.');
