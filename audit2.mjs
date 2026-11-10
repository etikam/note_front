import { chromium } from 'playwright';
const b = await chromium.launch();
const SP='C:/Users/etien/AppData/Local/Temp/claude/afac0f794e30b12f/2dcf65e2-1dd2-449c-98e7-fa8f7b67c070/scratchpad/';
const FORCE = '.ci-landing .reveal{opacity:1 !important;transform:none !important}';
async function shoot(w,h,mobile,name){
  const ctx = await b.newContext({ viewport:{width:w,height:h}, isMobile:mobile, reducedMotion:'reduce' });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:5200/', { waitUntil:'domcontentloaded', timeout:30000 });
  await p.waitForSelector('.ci-landing .hero'); await p.waitForTimeout(3000);
  await p.addStyleTag({ content: FORCE });
  await p.waitForTimeout(500);
  await p.screenshot({ path:SP+name, fullPage:true });
  await ctx.close();
}
await shoot(1440,900,false,'au2_desktop.png');
await shoot(390,844,true,'au2_mobile.png');
console.log('ok'); await b.close();
