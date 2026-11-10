import { chromium } from 'playwright';
const b = await chromium.launch();
const SP='C:/Users/etien/AppData/Local/Temp/claude/afac0f794e30b12f/2dcf65e2-1dd2-449c-98e7-fa8f7b67c070/scratchpad/';
const ctx = await b.newContext({ viewport:{width:390,height:844}, isMobile:true, reducedMotion:'reduce' });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:5200/', { waitUntil:'domcontentloaded', timeout:30000 });
await p.waitForSelector('.ci-landing .hero img'); await p.waitForTimeout(2500);
await p.screenshot({ path:SP+'mob_hero.png', clip:{x:0,y:0,width:390,height:760} });
console.log('ok'); await b.close();
