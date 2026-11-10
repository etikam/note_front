import { chromium } from 'playwright';
const b = await chromium.launch();
const SP='C:/Users/etien/AppData/Local/Temp/claude/afac0f794e30b12f/2dcf65e2-1dd2-449c-98e7-fa8f7b67c070/scratchpad/';
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
const p = await ctx.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:5200/', { waitUntil:'domcontentloaded', timeout:30000 });
await p.waitForSelector('.ci-landing .hero img'); await p.waitForTimeout(2500);
// scroll through in steps to trigger reveals
const H = await p.evaluate(()=>document.body.scrollHeight);
for(let y=0; y<=H; y+=700){ await p.evaluate(sy=>window.scrollTo(0,sy), y); await p.waitForTimeout(250); }
await p.waitForTimeout(600);
// check any .reveal still hidden
const hidden = await p.evaluate(()=>{
  const els=[...document.querySelectorAll('.ci-landing .reveal')];
  return els.filter(e=>parseFloat(getComputedStyle(e).opacity)<0.5).map(e=>e.className).slice(0,8);
});
await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(800);
await p.screenshot({ path:SP+'flow_full.png', fullPage:true });
console.log('still hidden reveals:', hidden.length?hidden.join(' | '):'none');
console.log('page errors:', errs.length?errs.slice(0,4).join(' || '):'none');
await b.close();
