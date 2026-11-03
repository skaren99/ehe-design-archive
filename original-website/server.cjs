'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{createStore}=require('./booking-store.cjs');
const root=__dirname,publicRoot=path.join(root,'dist'),port=Number(process.env.PORT||4173);
fs.mkdirSync(path.join(root,'work'),{recursive:true});
const store=createStore(process.env.BOOKING_DB||path.join(root,'work','bookings.sqlite'));
const catalog=()=>JSON.parse(fs.readFileSync(process.env.CATALOG_PATH||path.join(root,'catalog.json'),'utf8'));
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))}
function localStart(date,time){const target=Date.parse(date+'T'+time+':00Z');let stamp=target;for(let i=0;i<3;i++){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Tallinn',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(stamp)).map(x=>[x.type,x.value]));stamp+=target-Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`)}return new Date(stamp).toISOString()}
async function body(req){let content='';for await(const chunk of req){content+=chunk;if(content.length>16000)throw Object.assign(Error('too_large'),{status:413})}try{return JSON.parse(content)}catch{throw Object.assign(Error('invalid_json'),{status:400})}}
const admin=require('./admin-server.cjs').createAdmin(root,store,localStart);
const server=http.createServer(async(req,res)=>{try{
 const address=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(address.pathname);
 if(await admin.handle(req,res,address))return;
 if(pathname.startsWith('/api/')){
  const c=catalog();
  if(req.method==='GET'&&pathname==='/api/products')return json(res,200,c);
  if(req.method==='GET'&&pathname.startsWith('/api/availability/')){
   const p=c.products.find(p=>p.id===pathname.split('/').pop());if(!p)return json(res,404,{code:'not_found'});
   const from=address.searchParams.get('from'),to=address.searchParams.get('to'),time=address.searchParams.get('time'),quantity=Number(address.searchParams.get('quantity')),extraDays=Number(address.searchParams.get('extraDays'));
   if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||!/^\d{2}:\d{2}$/.test(time)||time<'08:00'||time>'18:00'||!Number.isInteger(quantity)||quantity<1||quantity>1000||!Number.isInteger(extraDays)||extraDays<0||extraDays>30)return json(res,400,{code:'invalid'});
   const first=Date.parse(from+'T12:00Z'),last=Date.parse(to+'T12:00Z');if(!Number.isFinite(first)||!Number.isFinite(last)||last<first||last-first>32*86400000)return json(res,400,{code:'invalid_range'});
   const verified=c.mode==='direct'&&p.price!==null&&Number.isInteger(p.stock),days=[];for(let d=first;d<=last;d+=86400000){const date=new Date(d).toISOString().slice(0,10);days.push({date,available:verified?store.available(p,localStart(date,time),extraDays,quantity):null})}
   return json(res,200,{verified,days});
  }
  if(req.method==='POST'&&pathname==='/api/bookings'){
   if(c.mode!=='direct')return json(res,503,{code:'not_enabled'});
   if(!(req.headers['content-type']||'').startsWith('application/json'))return json(res,415,{code:'invalid_content_type'});
   if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return json(res,403,{code:'origin'});
   const input=await body(req),p=c.products.find(p=>p.id===input.productId);if(!p)return json(res,404,{code:'not_found'});
   return json(res,201,store.book(p,input));
  }
  return json(res,404,{code:'not_found'});
 }
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end()}
 const file=path.resolve(publicRoot,'.'+pathname+(pathname.endsWith('/')?'index.html':''));if(!file.startsWith(publicRoot+path.sep)){res.writeHead(403);return res.end()}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.json':'application/json'})[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data)});
 }catch(e){json(res,e.status||500,{code:e.status?e.message:'server_error'})}});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
process.on('SIGINT',()=>server.close(()=>{store.close();process.exit()}));
