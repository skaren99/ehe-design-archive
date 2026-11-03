(function(root){
  'use strict';
  const round=n=>Math.round((n+Number.EPSILON)*100)/100;
  function interpolate(n,points){
    if(n<=points[0][0])return points[0][1];
    for(let i=1;i<points.length;i++){const [x,y]=points[i], [previousX,previousY]=points[i-1];if(n<=x)return round(previousY+(y-previousY)*(n-previousX)/(x-previousX))}
    return points[points.length-1][1];
  }
  // Source: Hinnakiri.xlsx, Arvutuskäik!B3:C12, F3:G12, J3:K12.
  const packages={half:[1,2,1,8,7,8],full:[1,4,1,16,12,16],coordination:[1,2,2,14]};
  const transport={local:20,mainland:50,hiiu:70,islands:100};
  const partyPoints=[[10,320],[30,450],[60,600],[80,800],[100,1000],[200,1500],[300,2000],[400,2500],[500,3000]];
  const decorationPoints=[[30,100],[100,300],[200,500],[400,800],[500,1000]];
  let pricing=null;
  function estimate(v){
    if(!v||!['wedding','birthday','summer','other'].includes(v.event)||!Number.isInteger(v.guests)||v.guests<1||v.guests>1000||!Object.hasOwn(transport,v.location)||!Object.hasOwn(packages,v.package)||!['none','mini','midi','maxi'].includes(v.decor)||typeof v.styling!=='boolean'||typeof v.dinner!=='boolean'||typeof v.visit!=='boolean'||typeof v.website!=='boolean'||![v.extraHours,v.lateHours].every(n=>Number.isFinite(n)&&n>=0&&n<=24&&Number.isInteger(n*2)))throw new Error('Invalid event details');
    const wedding=v.event==='wedding',party=['birthday','summer'].includes(v.event);
    const p=pricing||{packages:{half:1080,full:2000,coordination:760},transport,decor:{mini:[800,5],midi:[1200,10],maxi:[2500,20]},partyPoints,decorationPoints,extraHour:60,lateHour:60,assistant:500,assistantFrom:100,visit:100,website:200,dinner:8};
    const partyPrice=interpolate(v.guests,p.partyPoints);
    const service=wedding?p.packages[v.package]:party?partyPrice:null;
    const decorPrice=wedding?(v.decor==='none'?0:p.decor[v.decor][0]+v.guests*p.decor[v.decor][1]):v.styling?interpolate(v.guests,p.decorationPoints):0;
    const rows={service,transport:p.transport[v.location],decorating:decorPrice,extraHours:wedding?v.extraHours*p.extraHour:0,lateHours:wedding?v.lateHours*p.lateHour:0,assistant:wedding&&v.guests>=p.assistantFrom?p.assistant:0,visit:wedding&&v.visit?p.visit+p.transport[v.location]:0,website:wedding&&v.website?p.website:0,dinner:wedding&&v.dinner?v.guests*p.dinner:0};
    const complete=Object.values(rows).every(x=>x!==null),total=round(Object.values(rows).reduce((a,b)=>a+(b||0),0));
    return {rows,complete,total};
  }
  function rentalPeriod(start,extraDays=0){
    const stamp=Date.parse(start);
    if(!Number.isFinite(stamp)||!Number.isInteger(extraDays)||extraDays<0||extraDays>30)throw new Error('Invalid rental period');
    return {start:new Date(stamp).toISOString(),customerEnd:new Date(stamp+(36+24*extraDays)*3600000).toISOString(),blockedUntil:new Date(stamp+(48+24*extraDays)*3600000).toISOString()};
  }
  function rentalPrice(base,quantity=1,extraDays=0){
    if(base===null)return null;
    if(!Number.isFinite(base)||base<0||!Number.isInteger(quantity)||quantity<1||!Number.isInteger(extraDays)||extraDays<0||extraDays>30)throw new Error('Invalid rental price');
    const baseTotal=round(base*quantity),extra=round(base*quantity*.1*extraDays),total=round(baseTotal+extra);
    return {base:baseTotal,extra,total};
  }
  const api={estimate,rentalPeriod,rentalPrice,interpolate,setPricing:p=>{pricing=p}};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.EheLogic=api;
})(globalThis);
