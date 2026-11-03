import fs from 'node:fs';
const file='dist/index.html';let html=fs.readFileSync(file,'utf8').replaceAll('\r\n','\n');
if(!html.includes('const CLIENT_META=')){
const init=`const CLIENT_ID=new URLSearchParams(location.search).get('wedding')||'w1';
const EXPORTED_CLIENT=false;
const CLIENT_META=(()=>{try{return JSON.parse(localStorage.getItem('meie-paev-admin-v1'))?.weddings?.find(w=>w.id===CLIENT_ID)}catch{}})()||{names:'Mari & Karl',date:'2027-06-19',venue:'Metsaveere mõis',guests:72};
const KEY=CLIENT_ID==='w1'?'meie-paev-prototype-v1':'meie-paev-wedding-'+CLIENT_ID;`;
html=html.replace("const KEY='meie-paev-prototype-v1';",init);
html=html.replace("new Date('2027-06-19T00:00:00')","new Date(CLIENT_META.date+'T00:00:00')");
html=html.replace('<h2>Mari & Karl</h2>','<h2>${esc(CLIENT_META.names)}</h2>');
html=html.replace("${icon('calendar')}19. juuni 2027","${icon('calendar')}${new Date(CLIENT_META.date+'T12:00:00').toLocaleDateString('et-EE',{day:'numeric',month:'long',year:'numeric'})}");
html=html.replace("${icon('pin')}Metsaveere mõis","${icon('pin')}${esc(CLIENT_META.venue)}");
html=html.replace("${icon('users')}72 külalist","${icon('users')}${CLIENT_META.guests} külalist");
html=html.replace('<strong>Mari & Karl</strong><small>19.06.2027 · Metsaveere mõis</small>','<strong>${esc(CLIENT_META.names)}</strong><small>${new Date(CLIENT_META.date+\'T12:00:00\').toLocaleDateString(\'et-EE\')} · ${esc(CLIENT_META.venue)}</small>');
html=html.replace('<span class="demo">NÄIDISVAADE</span>','<span class="demo">NÄIDISVAADE</span>${!EXPORTED_CLIENT?\'<a class="btn" href="admin.html">Korraldaja vaade</a>\':\'\'}');
html=html.replace('>M & K</span>','>${esc(CLIENT_META.names.split(\'&\').map(s=>s.trim()[0]).join(\' & \'))}</span>');
html=html.replace("${group==='planner'?'Karen':'Mari & Karl'}","${group==='planner'?'Karen':esc(CLIENT_META.names)}");
html=html.replace('<option>Mari</option><option>Karl</option>','${CLIENT_META.names.split(\'&\').map(n=>\'<option>\'+esc(n.trim())+\'</option>\').join(\'\')}');
html=html.replace('<div class="next-meeting"><div class="calendar-tile"><small>Nov</small>06</div><div><strong>Järgmine ühine planeerimine</strong><br><small>6. november · 17.00 · näidiskohtumine</small></div></div>','<div class="next-meeting"><div class="calendar-tile">♡</div><div><strong>Üks samm korraga, koos.</strong><br><small>Järgmised kokkulepped leiad tegevuste alt.</small></div></div>');
const begin=html.indexOf('function download(){'),end=html.indexOf("\ndocument.addEventListener('click'",begin);
const replacement=String.raw`function download(){let html='<!doctype html>\n'+document.documentElement.outerHTML;const seedStart=html.indexOf('const SEED='),seedEnd=html.indexOf('\nconst CLIENT_ID=',seedStart);html=html.slice(0,seedStart)+'const SEED='+JSON.stringify(data).replace(/</g,'\\u003c')+';'+html.slice(seedEnd);html=html.replace(/^const EXPORTED_CLIENT=false;$/m,'const EXPORTED_CLIENT=true;');html=html.replace(/^const CLIENT_META=.*$/m,'const CLIENT_META='+JSON.stringify({names:CLIENT_META.names,date:CLIENT_META.date,venue:CLIENT_META.venue,guests:CLIENT_META.guests}).replace(/</g,'\\u003c')+';');html=html.replace(/^const KEY=.*?;let data;/m,"const KEY='meie-paev-shared-"+Date.now()+"';let data;");html=html.replace(/<div id="app">[\s\S]*?<script>/,'<div id="app"></div><div id="overlay-root"></div><div id="toast-root" role="status" aria-live="polite"></div>\n<script>');html=html.replace(/<body[^>]*>/,'<body>');const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));let a=document.createElement('a');a.href=url;a.download='meie-paev-prototuup.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Jagatav HTML-fail on valmis.')}`;
html=html.slice(0,begin)+replacement+html.slice(end);
html=html.replace('</style>','@media(max-width:800px){.top-actions{flex-wrap:wrap;justify-content:flex-end}.topbar{height:auto;min-height:70px;padding-top:10px;padding-bottom:10px}.top-actions .demo{display:none}.top-actions .btn{font-size:10px;padding:7px}.page-head>.eyebrow{display:none}}\n</style>');
fs.writeFileSync(file,html);
}
console.log('Client view supports per-wedding admin data.');
