import { chromium } from 'playwright';
const b = await chromium.launch();
const SP='C:/Users/etien/AppData/Local/Temp/claude/afac0f794e30b12f/2dcf65e2-1dd2-449c-98e7-fa8f7b67c070/scratchpad/';
// desktop
let ctx = await b.newContext({ viewport:{width:1440,height:900}, reducedMotion:'reduce' });
let p = await ctx.newPage();
await p.goto('http://127.0.0.1:5200/', { waitUntil:'domcontentloaded', timeout:30000 });
await p.waitForSelector('.ci-landing .hero img'); await p.waitForTimeout(3500);
await p.screenshot({ path:SP+'audit_desktop.png', fullPage:true });
await ctx.close();
// mobile
ctx = await b.newContext({ viewport:{width:390,height:844}, isMobile:true, reducedMotion:'reduce' });
p = await ctx.newPage();
await p.goto('http://127.0.0.1:5200/', { waitUntil:'domcontentloaded', timeout:30000 });
await p.waitForSelector('.ci-landing .hero'); await p.waitForTimeout(3500);
await p.screenshot({ path:SP+'audit_mobile.png', fullPage:true });
// test menu button
const menuClickable = await p.evaluate(()=>{const m=document.querySelector('.ci-landing .menu-btn');if(!m)return 'no-btn';m.click();return 'clicked';});
await p.waitForTimeout(400);
const navVisibleAfter = await p.evaluate(()=>{const n=document.querySelector('.ci-landing nav.links');return n?getComputedStyle(n).display:'no-nav';});
console.log('menu:', menuClickable, '| nav.links display after click:', navVisibleAfter);
await b.close();
