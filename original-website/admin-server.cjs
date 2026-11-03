'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const defaults={packages:{half:1080,full:2000,coordination:760},transport:{local:20,mainland:50,hiiu:70,islands:100},decor:{mini:[800,5],midi:[1200,10],maxi:[2500,20]},extraHour:60,lateHour:60,assistant:500,assistantFrom:100,visit:100,website:200,dinner:8,partyPoints:[[10,320],[30,450],[60,600],[80,800],[100,1000],[200,1500],[300,2000],[400,2500],[500,3000]],decorationPoints:[[30,100],[100,300],[200,500],[400,800],[500,1000]]};
function createAdmin(root,store,localStart){
 const file=path.join(root,'work','settings.json'),authFile=path.join(root,'work','admin-auth.json'),sessions=new Map(),attempts=new Map();
 const save=(target,data)=>{fs.writeFileSync(target+'.tmp',JSON.stringify(data,null,2));fs.renameSync(target+'.tmp',target)};
 if(!fs.existsSync(file))save(file,{revision:0,pricing:defaults,texts:{et:{},en:{}},images:{},leader:{name:'Karen',et:'EHE Eventsi juht. Kirjuta mulle oma ideest ja loome koos sinu sündmuse.',en:'Head of EHE Events. Tell me your idea and let’s plan your event together.',image:''}});
 if(!fs.existsSync(authFile)){const password=crypto.randomBytes(18).toString('base64url'),salt=crypto.randomBytes(16).toString('hex');save(authFile,{salt,hash:crypto.scryptSync(password,salt,64).toString('hex')});fs.writeFileSync(path.join(root,'work','admin-access.txt'),'Admin: http://127.0.0.1:4173/admin/\nPassword: '+password+'\nKeep this file private. Change the password in admin settings.\n')}
 const settings=()=>JSON.parse(fs.readFileSync(file,'utf8'));
 const fail=(message,status=400)=>{throw Object.assign(Error(message),{status})};
 const number=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1000000;
 function checkShape(value,shape){if(typeof shape==='number'){if(!number(value))fail('invalid_price');return}if(Array.isArray(shape)){if(!Array.isArray(value)||value.length!==shape.length)fail('invalid_price');value.forEach((x,i)=>checkShape(x,shape[i]));return}if(!value||Object.keys(value).sort().join()!==Object.keys(shape).sort().join())fail('invalid_price');for(const k in shape)checkShape(value[k],shape[k])}
 const str=(s,max=10000)=>typeof s==='string'&&s.length<=max;
 const image=s=>s===''||/^\/uploads\/[a-f0-9-]+\.(png|jpg|webp)$/.test(s)||s==='/wedding.jpg';
 async function read(req){let b='';for await(const c of req){b+=c;if(b.length>8*1024*1024)fail('too_large',413)}try{return JSON.parse(b)}catch{fail('invalid_json')}}
 const reply=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
 return {settings,async handle(req,res,url){
  const p=url.pathname;if(p==='/api/settings'&&req.method==='GET'){reply(res,200,settings());return true}
  if(p==='/api/events'&&req.method==='GET'){reply(res,200,store.closures().filter(x=>x.kind==='event').map(x=>({from:x.from_date,to:x.to_date})));return true}
  if(!p.startsWith('/api/admin/'))return false;
  const mutation=req.method!=='GET';if(mutation&&(!(req.headers['content-type']||'').startsWith('application/json')||!req.headers.origin||new URL(req.headers.origin).host!==req.headers.host))fail('origin',403);
  if(p==='/api/admin/login'&&req.method==='POST'){
   const ip=req.socket.remoteAddress,now=Date.now(),attempt=attempts.get(ip)||{count:0,until:now+900000};if(attempt.until<now){attempt.count=0;attempt.until=now+900000}if(++attempt.count>10)fail('too_many_attempts',429);attempts.set(ip,attempt);
   const v=await read(req),a=JSON.parse(fs.readFileSync(authFile));if(!str(v.password,200)||!crypto.timingSafeEqual(crypto.scryptSync(v.password,a.salt,64),Buffer.from(a.hash,'hex')))fail('wrong_password',401);
   attempts.delete(ip);const token=crypto.randomBytes(32).toString('hex');sessions.set(token,now+8*3600000);res.setHeader('Set-Cookie',`ehe_admin=${token}; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=28800${req.socket.encrypted?'; Secure':''}`);reply(res,200,{ok:true});return true;
  }
  const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('ehe_admin='))?.slice(10);if(!token||!(sessions.get(token)>Date.now()))fail('login_required',401);
  if(p==='/api/admin/logout'&&req.method==='POST'){sessions.delete(token);res.setHeader('Set-Cookie','ehe_admin=; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=0');reply(res,200,{ok:true});return true}
  if(p==='/api/admin/state'&&req.method==='GET'){reply(res,200,{settings:settings(),catalog:JSON.parse(fs.readFileSync(path.join(root,'catalog.json'))),closures:store.closures(),bookings:store.bookings()});return true}
  const v=mutation?await read(req):{};
  if(p==='/api/admin/password'&&req.method==='POST'){if(!str(v.password,200)||v.password.length<12)fail('password_min_12');const salt=crypto.randomBytes(16).toString('hex');save(authFile,{salt,hash:crypto.scryptSync(v.password,salt,64).toString('hex')});sessions.clear();fs.writeFileSync(path.join(root,'work','admin-access.txt'),'Password changed in admin.\n');reply(res,200,{ok:true});return true}
  if(p==='/api/admin/settings'&&req.method==='PUT'){
   if(v.revision!==settings().revision)fail('stale_reload',409);checkShape(v.pricing,defaults);if(!Number.isInteger(v.pricing.assistantFrom)||v.pricing.assistantFrom<1)fail('invalid_price');for(const key of ['partyPoints','decorationPoints']){let prev=0;for(const [n]of v.pricing[key]){if(!Number.isInteger(n)||n<=prev||n>1000)fail('invalid_guest_threshold');prev=n}}
   if(!v.texts||!v.images||!v.leader||!str(v.leader.name,100)||!str(v.leader.et)||!str(v.leader.en)||!image(v.leader.image))fail('invalid_content');for(const language of ['et','en']){if(!v.texts[language]||Object.entries(v.texts[language]).some(([k,x])=>!str(k)||!str(x)))fail('invalid_text')}
   if(Object.values(v.images).some(x=>!image(x)))fail('invalid_image');save(file,{revision:v.revision+1,pricing:v.pricing,texts:v.texts,images:v.images,leader:v.leader});reply(res,200,settings());return true;
  }
  if(p==='/api/admin/products'&&req.method==='PUT'){
   if(!Array.isArray(v.products)||v.products.length>500)fail('invalid_products');const ids=new Set();for(const p of v.products){if(!/^[a-z0-9-]{1,80}$/.test(p.id)||ids.has(p.id)||!['table','large','clothes'].includes(p.category)||!number(p.price)||!Number.isInteger(p.stock)||p.stock<0||p.stock>10000||!p.name||!p.description||!['et','en'].every(l=>str(p.name[l],150)&&p.name[l].trim()&&str(p.description[l]))||!Array.isArray(p.images)||p.images.length>5||p.images.some(x=>!image(x)||!x))fail('invalid_product');ids.add(p.id)}
   const old=JSON.parse(fs.readFileSync(path.join(root,'catalog.json')));if((v.revision||0)!==(old.revision||0))fail('stale_reload',409);save(path.join(root,'catalog.json'),{mode:'direct',revision:(old.revision||0)+1,products:v.products});reply(res,200,{ok:true});return true;
  }
  if(p==='/api/admin/upload'&&req.method==='POST'){
   if(typeof v.data!=='string')fail('invalid_image');const match=v.data.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);if(!match)fail('invalid_image');const b=Buffer.from(match[2],'base64');if(b.length>5*1024*1024)fail('image_max_5mb');const type=match[1],valid=type==='png'?b.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')):type==='jpeg'?b[0]===255&&b[1]===216&&b[2]===255:b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP';if(!valid)fail('invalid_image');const name=crypto.randomUUID()+'.'+(type==='jpeg'?'jpg':type);fs.mkdirSync(path.join(root,'dist','uploads'),{recursive:true});fs.writeFileSync(path.join(root,'dist','uploads',name),b);reply(res,200,{url:'/uploads/'+name});return true;
  }
  if(p==='/api/admin/closures'&&req.method==='POST'){
   if(!['rental','event'].includes(v.kind)||!/^\d{4}-\d{2}-\d{2}$/.test(v.from)||!/^\d{4}-\d{2}-\d{2}$/.test(v.to)||v.from>v.to||![v.from,v.to].every(d=>Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d))fail('invalid_dates');const products=JSON.parse(fs.readFileSync(path.join(root,'catalog.json'))).products;if(v.kind==='rental'&&v.productId!=='all'&&!products.some(p=>p.id===v.productId))fail('invalid_product');const next=new Date(Date.parse(v.to)+86400000).toISOString().slice(0,10);store.addClosure({...v,productId:v.kind==='event'?'all':v.productId,start:Date.parse(localStart(v.from,'00:00')),end:Date.parse(localStart(next,'00:00'))});reply(res,200,{ok:true});return true;
  }
  if(p==='/api/admin/closures'&&req.method==='DELETE'){if(!str(v.id,80))fail('invalid');store.deleteClosure(v.id);reply(res,200,{ok:true});return true}
  fail('not_found',404);
 }};
}
module.exports={createAdmin,defaults};
