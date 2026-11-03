import fs from 'node:fs';
let js=fs.readFileSync('admin.js','utf8');
js=js.replace('${over.length} tegevust ootab uut kokkulepet.','${over.length} ${over.length===1?\'tegevus\':\'tegevust\'} ootab uut kokkulepet.');
js=js.replace("function clientUrl(id){return 'index.html?wedding='+encodeURIComponent(id)}","function clientUrl(id){return (window.DEMO_SNAPSHOT||location.protocol==='file:'?'https://meie-pulmaplaan-karen-2026.karensaksakulm.chatgpt.site/':'')+'index.html?wedding='+encodeURIComponent(id)}");
js=js.replace('Faili muudatused ei sünkrooni teiste seadmetega.','Faili muudatused ei sünkrooni teiste seadmetega. Demofaili kliendivaate lingid avavad veebiversiooni.');
fs.writeFileSync('admin.js',js);
