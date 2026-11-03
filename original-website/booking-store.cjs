'use strict';
const {DatabaseSync}=require('node:sqlite'),{randomUUID}=require('node:crypto'),L=require('./dist/logic.js');
function createStore(file){
 const db=new DatabaseSync(file);db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS bookings (reference TEXT PRIMARY KEY, request_key TEXT NOT NULL UNIQUE, product_id TEXT NOT NULL, start INTEGER NOT NULL, customer_end INTEGER NOT NULL, blocked_until INTEGER NOT NULL, quantity INTEGER NOT NULL, extra_days INTEGER NOT NULL, net REAL NOT NULL, vat REAL NOT NULL, gross REAL NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, status TEXT NOT NULL DEFAULT \'confirmed\', created_at INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS bookings_calendar ON bookings(product_id,start,blocked_until,status);');
 db.exec('CREATE TABLE IF NOT EXISTS closures (id TEXT PRIMARY KEY, kind TEXT NOT NULL, product_id TEXT NOT NULL, start INTEGER NOT NULL, end INTEGER NOT NULL, from_date TEXT NOT NULL, to_date TEXT NOT NULL)');
 const blocked=(id,start,end)=>!!db.prepare("SELECT id FROM closures WHERE kind='rental' AND (product_id='all' OR product_id=?) AND start<? AND end>? LIMIT 1").get(id,end,start);
 function occupancy(productId,start,end){
   const rows=db.prepare("SELECT start,blocked_until,quantity FROM bookings WHERE product_id=? AND status='confirmed' AND start<? AND blocked_until>?").all(productId,end,start),events=[];
   for(const b of rows){events.push([Math.max(start,b.start),b.quantity],[Math.min(end,b.blocked_until),-b.quantity])}
   events.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);let max=0,current=0;for(const [,delta]of events){current+=delta;max=Math.max(max,current)}return max;
 }
 function available(p,start,extraDays,quantity,now=Date.now()){
   if(!Number.isInteger(p.stock)||p.stock<1||p.price===null)return null;
   const period=L.rentalPeriod(start,extraDays),begin=Date.parse(period.start),end=Date.parse(period.blockedUntil);
   if(begin<=now||begin>now+2*366*86400000||quantity>p.stock)return false;
   return !blocked(p.id,begin,end)&&occupancy(p.id,begin,end)+quantity<=p.stock;
 }
 function publicBooking(b){return {reference:b.reference,customerEnd:new Date(b.customer_end).toISOString(),start:new Date(b.start).toISOString(),price:{total:b.gross}}}
 function book(p,input){
   if(!input||!Number.isInteger(input.quantity)||input.quantity<1||input.quantity>1000||!Number.isInteger(input.extraDays)||input.extraDays<0||input.extraDays>30||typeof input.name!=='string'||!input.name.trim()||input.name.length>100||typeof input.email!=='string'||input.email.length>200||!/^\S+@\S+\.\S+$/.test(input.email)||typeof input.requestKey!=='string'||! /^[a-zA-Z0-9-]{16,80}$/.test(input.requestKey))throw Object.assign(Error('invalid'),{status:400});
   if(p.price===null||!Number.isInteger(p.stock)||p.stock<1)throw Object.assign(Error('not_configured'),{status:409});
   const now=Date.now(),period=L.rentalPeriod(input.start,input.extraDays),start=Date.parse(period.start),end=Date.parse(period.blockedUntil);
   if(start<=now||start>now+2*366*86400000)throw Object.assign(Error('invalid_date'),{status:400});
   const price=L.rentalPrice(p.price,input.quantity,input.extraDays);
   db.exec('BEGIN IMMEDIATE');try{
     const prior=db.prepare('SELECT * FROM bookings WHERE request_key=?').get(input.requestKey);
     if(prior){if(prior.product_id!==p.id||prior.start!==start||prior.quantity!==input.quantity||prior.extra_days!==input.extraDays||prior.email!==input.email.trim())throw Object.assign(Error('request_mismatch'),{status:409});db.exec('COMMIT');return publicBooking(prior)}
     if(blocked(p.id,start,end)||occupancy(p.id,start,end)+input.quantity>p.stock)throw Object.assign(Error('conflict'),{status:409});
     const reference='EHE-'+randomUUID().slice(0,8).toUpperCase();
     db.prepare('INSERT INTO bookings(reference,request_key,product_id,start,customer_end,blocked_until,quantity,extra_days,net,vat,gross,name,email,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(reference,input.requestKey,p.id,start,Date.parse(period.customerEnd),end,input.quantity,input.extraDays,price.total,0,price.total,input.name.trim(),input.email.trim(),now);
     db.exec('COMMIT');return {reference,start:period.start,customerEnd:period.customerEnd,price};
   }catch(e){db.exec('ROLLBACK');throw e}
 }
 return {available,book,closures:()=>db.prepare('SELECT * FROM closures ORDER BY start').all(),addClosure:c=>{db.prepare('INSERT INTO closures VALUES(?,?,?,?,?,?,?)').run(randomUUID(),c.kind,c.productId,c.start,c.end,c.from,c.to)},deleteClosure:id=>db.prepare('DELETE FROM closures WHERE id=?').run(id),bookings:()=>db.prepare('SELECT reference,product_id,start,customer_end,quantity,name,email,status FROM bookings ORDER BY start DESC').all(),close:()=>db.close()};
}
module.exports={createStore};
