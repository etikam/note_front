import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:5200/', { waitUntil:'domcontentloaded', timeout:30000 });
await p.waitForSelector('.ci-landing .hero img'); await p.waitForTimeout(2500);
// reveal the news cards by scrolling there
await p.evaluate(()=>document.querySelector('#actualites').scrollIntoView()); await p.waitForTimeout(1400);
const card = await p.$('.ci-landing .card');
await card.hover(); await p.waitForTimeout(500);
const lift = await p.evaluate(()=>{const c=document.querySelector('.ci-landing .card');const t=getComputedStyle(c).transform;return t;});
// anchor smooth scroll test: back to top, click Programmes, sample scrollY over time
await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(800);
const y0 = await p.evaluate(()=>window.pageYOffset);
await p.click('.ci-landing header.nav a[href="#programmes"]');
await p.waitForTimeout(120); const yMid = await p.evaluate(()=>window.pageYOffset);
await p.waitForTimeout(1200); const yEnd = await p.evaluate(()=>window.pageYOffset);
console.log('card hover transform:', lift);
console.log('anchor scroll y0/mid/end:', y0, yMid, yEnd, '| smooth:', (yMid>y0 && yMid<yEnd));
await b.close();
