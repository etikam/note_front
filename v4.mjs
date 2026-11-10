import { chromium } from 'playwright';
const b = await chromium.launch();
const SP='C:/Users/etien/AppData/Local/Temp/claude/afac0f794e30b12f/2dcf65e2-1dd2-449c-98e7-fa8f7b67c070/scratchpad/';
async function shot(w,h,mobile,name){
  const ctx = await b.newContext({ viewport:{width:w,height:h}, isMobile:mobile, reducedMotion:'reduce' });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:5200/', { waitUntil:'domcontentloaded', timeout:30000 });
  await p.addStyleTag({ content:'.ci-landing .reveal{opacity:1!important;transform:none!important}' });
  await p.waitForSelector('.ci-landing .hero'); await p.waitForTimeout(2800);
  const over = await p.evaluate(()=>({ bodyW:document.body.scrollWidth, winW:window.innerWidth }));
  await p.screenshot({ path:SP+name, fullPage:true });
  await ctx.close();
  return over;
}
const a = await shot(900,1000,false,'resp_900.png');
const c = await shot(390,844,true,'resp_390.png');
console.log('900 overflow:', JSON.stringify(a));
console.log('390 overflow:', JSON.stringify(c));
await b.close();
