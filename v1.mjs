import { chromium } from 'playwright';
const b = await chromium.launch();
const SP='C:/Users/etien/AppData/Local/Temp/claude/afac0f794e30b12f/2dcf65e2-1dd2-449c-98e7-fa8f7b67c070/scratchpad/';
// mobile menu open
let ctx = await b.newContext({ viewport:{width:390,height:844}, isMobile:true });
let p = await ctx.newPage();
await p.goto('http://127.0.0.1:5200/', { waitUntil:'domcontentloaded', timeout:30000 });
await p.waitForSelector('.ci-landing .menu-btn'); await p.waitForTimeout(1500);
await p.click('.ci-landing .menu-btn'); await p.waitForTimeout(500);
const menuShown = await p.evaluate(()=>!!document.querySelector('.ci-landing .mobile-menu'));
await p.screenshot({ path:SP+'mobile_menu.png' });
await ctx.close();
// desktop hover news card
ctx = await b.newContext({ viewport:{width:1440,height:900}, reducedMotion:'reduce' });
p = await ctx.newPage();
await p.goto('http://127.0.0.1:5200/', { waitUntil:'domcontentloaded', timeout:30000 });
await p.addStyleTag({ content:'.ci-landing .reveal{opacity:1!important;transform:none!important}' });
await p.waitForSelector('.ci-landing .card'); await p.waitForTimeout(2500);
const card = await p.$('.ci-landing .card');
await card.hover(); await p.waitForTimeout(500);
const cardT = await p.evaluate(()=>{const c=document.querySelector('.ci-landing .card');return {card:getComputedStyle(c).transform, img:getComputedStyle(c.querySelector('.cover img')).transform};});
console.log('mobile menu shown:', menuShown);
console.log('card hover transform:', cardT.card!=='none'?'lifted':'none', '| img:', cardT.img!=='none'?'zoomed':'none');
await b.close();
