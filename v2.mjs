import { chromium } from 'playwright';
const b = await chromium.launch();
const SP='C:/Users/etien/AppData/Local/Temp/claude/afac0f794e30b12f/2dcf65e2-1dd2-449c-98e7-fa8f7b67c070/scratchpad/';
async function shotEl(w,h,mobile,sel,name){
  const ctx = await b.newContext({ viewport:{width:w,height:h}, isMobile:mobile, reducedMotion:'reduce' });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:5200/', { waitUntil:'domcontentloaded', timeout:30000 });
  await p.addStyleTag({ content:'.ci-landing .reveal{opacity:1!important;transform:none!important}' });
  await p.waitForSelector(sel); await p.waitForTimeout(2800);
  const el = await p.$(sel);
  await el.scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  await el.screenshot({ path:SP+name });
  await ctx.close();
}
await shotEl(1440,900,false,'.ci-landing .programs','prog_desktop.png');
await shotEl(390,844,true,'.ci-landing .programs','prog_mobile.png');
console.log('ok'); await b.close();
