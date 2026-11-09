import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { fetchLandingContent } from '@/features/landing/api/landingApi'

/* ───────────────────────── styles (portée .ci-landing) ───────────────────────── */
const CSS = `
.ci-landing{
  --bg:#ffffff; --bg-soft:#f4f6f3; --bg-mist:#eef2ec;
  --fg:#15211b; --muted:#56655c; --faint:#8b978d;
  --line:#e4e9e2; --line-soft:#eef1ec;
  --green-deep:#13311f; --green:#1c4a2e; --green-soft:#eaf1e9;
  --lime:#b7e017; --lime-bright:#c6f024; --lime-ink:#1a2e0c;
  --radius:18px; --radius-sm:12px; --maxw:1200px;
  --sans:"Plus Jakarta Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  background:var(--bg); color:var(--fg); font-family:var(--sans); font-size:16px; line-height:1.6;
  -webkit-font-smoothing:antialiased; overflow-x:hidden;
}
.ci-landing *{box-sizing:border-box}
.ci-landing h1,.ci-landing h2,.ci-landing h3,.ci-landing h4{margin:0;font-weight:800;letter-spacing:-.02em;line-height:1.06;text-wrap:balance}
.ci-landing p{margin:0}
.ci-landing a{color:inherit;text-decoration:none}
.ci-landing img{max-width:100%}
.ci-landing .wrap{width:100%;max-width:var(--maxw);margin-inline:auto;padding-inline:clamp(16px,4vw,40px)}
.ci-landing .eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:13px;font-weight:700;color:var(--green)}
.ci-landing .eyebrow::before{content:"";width:22px;height:11px;border-radius:999px;background:
  radial-gradient(circle at 25% 50%, var(--green) 0 3.4px, transparent 3.6px),
  radial-gradient(circle at 75% 50%, var(--lime) 0 3.4px, transparent 3.6px), var(--green-soft)}
.ci-landing .btn{display:inline-flex;align-items:center;gap:9px;height:48px;padding:0 22px;border-radius:999px;
  font-weight:700;font-size:14.5px;cursor:pointer;border:1px solid transparent;transition:background-color .18s,color .18s,border-color .18s}
.ci-landing .btn svg{width:17px;height:17px}
.ci-landing .btn-primary{background:var(--green-deep);color:#fff}
.ci-landing .btn-primary:hover{background:var(--green)}
.ci-landing .btn-lime{background:var(--lime);color:var(--lime-ink)}
.ci-landing .btn-lime:hover{background:var(--lime-bright)}
.ci-landing .btn-ghost{background:transparent;color:var(--fg);border-color:var(--line)}
.ci-landing .btn-ghost:hover{border-color:var(--green);color:var(--green)}
.ci-landing .btn-outline-light{background:transparent;color:#fff;border-color:rgba(255,255,255,.28)}
.ci-landing .btn-outline-light:hover{background:rgba(255,255,255,.1)}
.ci-landing .link-arrow{display:inline-flex;align-items:center;gap:7px;font-weight:700;font-size:14.5px;color:var(--fg);border-bottom:2px solid var(--lime);padding-bottom:3px}
.ci-landing .link-arrow svg{width:16px;height:16px;transition:transform .18s}
.ci-landing .link-arrow:hover svg{transform:translateX(3px)}
.ci-landing .arrow-circle{display:inline-grid;place-items:center;width:30px;height:30px;border-radius:999px;background:var(--lime);color:var(--lime-ink)}
.ci-landing .arrow-circle svg{width:15px;height:15px}

/* photos — rendu N&B cohérent */
.ci-landing .panel img,.ci-landing .cover img{display:block;width:100%;height:100%;object-fit:cover;filter:grayscale(1) contrast(1.04)}

.ci-landing .topbar{background:var(--green-deep);color:#cfe0d3;font-size:13px}
.ci-landing .topbar .wrap{display:flex;align-items:center;justify-content:space-between;gap:16px;height:42px}
.ci-landing .topbar ul{display:flex;gap:22px;list-style:none;margin:0;padding:0;flex-wrap:wrap}
.ci-landing .topbar li{display:inline-flex;align-items:center;gap:8px}
.ci-landing .topbar svg{width:14px;height:14px;color:var(--lime)}
.ci-landing .socials{display:flex;gap:8px}
.ci-landing .socials a{display:grid;place-items:center;width:26px;height:26px;border-radius:999px;background:rgba(255,255,255,.08);color:#dfeae1}
.ci-landing .socials a:hover{background:var(--lime);color:var(--lime-ink)}
.ci-landing .socials svg{width:13px;height:13px}

.ci-landing header.nav{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.88);backdrop-filter:saturate(1.3) blur(12px);border-bottom:1px solid var(--line-soft)}
.ci-landing header.nav .wrap{display:flex;align-items:center;gap:24px;height:72px}
.ci-landing .brand{display:flex;align-items:center;gap:11px;font-weight:800;font-size:17px;letter-spacing:-.02em}
.ci-landing .brand .mark{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:var(--green-deep)}
.ci-landing .brand .mark span{width:17px;height:9px;border-radius:999px;background:
  radial-gradient(circle at 26% 50%, #fff 0 3px, transparent 3.2px),
  radial-gradient(circle at 74% 50%, var(--lime) 0 3px, transparent 3.2px)}
.ci-landing nav.links{display:flex;gap:4px;margin-left:8px}
.ci-landing nav.links a{padding:8px 13px;border-radius:9px;font-size:14.5px;font-weight:600;color:var(--muted)}
.ci-landing nav.links a:hover,.ci-landing nav.links a.active{color:var(--green);background:var(--green-soft)}
.ci-landing header.nav .cta{margin-left:auto;display:flex;align-items:center;gap:10px}
.ci-landing .menu-btn{display:none;width:44px;height:44px;border-radius:11px;border:1px solid var(--line);background:#fff;cursor:pointer}

.ci-landing .hero{position:relative;overflow:hidden;background:
  radial-gradient(130% 90% at 88% -8%, var(--bg-mist) 0%, transparent 46%),
  linear-gradient(180deg,#fff 0%, var(--bg-soft) 100%)}
.ci-landing .hero .wrap{position:relative;display:grid;grid-template-columns:1.04fr 1fr;gap:clamp(28px,4vw,60px);align-items:center;
  padding-top:clamp(48px,6vw,78px);padding-bottom:clamp(52px,7vw,92px)}
.ci-landing .hero-shape{position:absolute;border-radius:40px;z-index:0;pointer-events:none}
.ci-landing .shape-b{width:320px;height:320px;right:-80px;bottom:-120px;border-radius:999px;
  background:radial-gradient(circle at 40% 40%, rgba(183,224,23,.22), transparent 68%)}
.ci-landing h1.hero-title{font-size:clamp(2.35rem,5.1vw,4rem);letter-spacing:-.035em}
.ci-landing h1.hero-title em{font-style:normal;color:var(--green);position:relative;white-space:nowrap}
.ci-landing h1.hero-title em::after{content:"";position:absolute;left:0;right:0;bottom:.04em;height:.16em;background:var(--lime);border-radius:999px;z-index:-1;opacity:.85}
.ci-landing .hero-lead{margin-top:20px;max-width:30rem;color:var(--muted);font-size:17px}
.ci-landing .hero-actions{margin-top:30px;display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.ci-landing .hero-foot{margin-top:34px;display:flex;align-items:center;gap:20px;flex-wrap:wrap;color:var(--faint);font-size:13.5px;font-weight:600}
.ci-landing .hero-foot .dot{width:5px;height:5px;border-radius:999px;background:var(--lime)}
.ci-landing .stage{position:relative;height:clamp(380px,42vw,500px);perspective:1400px;z-index:1}
.ci-landing .stage-inner{position:absolute;inset:0;transform-style:preserve-3d;will-change:transform}
.ci-landing .panel{position:absolute;border-radius:22px;overflow:hidden;background:#dfe3df;
  box-shadow:0 34px 74px -36px rgba(13,49,31,.44),0 10px 26px -18px rgba(15,26,19,.22);border:5px solid #fff;will-change:transform}
.ci-landing .p1{width:46%;height:62%;left:2%;top:6%}
.ci-landing .p2{width:40%;height:50%;right:3%;top:0}
.ci-landing .p3{width:44%;height:46%;right:8%;bottom:2%}
.ci-landing .seal{position:absolute;left:40%;top:52%;width:92px;height:92px;z-index:5;will-change:transform}
.ci-landing .seal svg{width:100%;height:100%}
.ci-landing .spark{position:absolute;right:12%;bottom:16%;color:var(--lime);z-index:6;will-change:transform}
.ci-landing .spark svg{width:38px;height:38px;filter:drop-shadow(0 2px 6px rgba(28,74,46,.3))}

.ci-landing .marquee{background:var(--green-deep);color:#eaf3ec;overflow:hidden;border-block:1px solid rgba(255,255,255,.06)}
.ci-landing .marquee-track{display:flex;gap:0;white-space:nowrap;width:max-content;animation:ci-scroll 34s linear infinite}
.ci-landing .marquee:hover .marquee-track{animation-play-state:paused}
.ci-landing .marquee span{display:inline-flex;align-items:center;gap:24px;padding:16px 24px;font-weight:700;font-size:17px;letter-spacing:-.01em}
.ci-landing .marquee .star{color:var(--lime)}
@keyframes ci-scroll{to{transform:translateX(-50%)}}

.ci-landing section{padding-block:clamp(56px,7vw,96px)}
.ci-landing .sec-head{text-align:center;max-width:640px;margin-inline:auto;margin-bottom:46px}
.ci-landing .sec-head .eyebrow{justify-content:center}
.ci-landing .sec-head h2{margin-top:14px;font-size:clamp(1.9rem,3.6vw,2.7rem)}
.ci-landing .sec-head p{margin-top:14px;color:var(--muted)}

.ci-landing .about .wrap{display:grid;grid-template-columns:1fr 1.05fr;gap:clamp(28px,4vw,64px);align-items:center}
.ci-landing .about-media{position:relative}
.ci-landing .about-media .panel{position:relative;box-shadow:0 2px 8px rgba(15,26,19,.06),0 20px 42px -26px rgba(15,26,19,.26);margin-bottom:16px}
.ci-landing .about-media .am1{height:210px}
.ci-landing .about-media .am2{height:170px;width:84%}
.ci-landing .about-badge{position:absolute;right:-6px;top:188px;width:96px;height:96px;z-index:3}
.ci-landing .about-badge svg{width:100%;height:100%}
.ci-landing .about h2{font-size:clamp(1.8rem,3.4vw,2.55rem);margin-top:14px}
.ci-landing .about-lead{margin-top:16px;color:var(--muted)}
.ci-landing .facts{margin-top:26px;display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ci-landing .fact{background:var(--bg-soft);border:1px solid var(--line);border-radius:var(--radius-sm);padding:14px 16px}
.ci-landing .fact .k{font-size:12px;font-weight:700;color:var(--green);margin-bottom:3px}
.ci-landing .fact .v{font-size:13.5px;color:var(--muted);font-weight:600}
.ci-landing .about .btn{margin-top:28px}

.ci-landing .stats{border-block:1px solid var(--line);background:var(--bg);padding-block:0}
.ci-landing .stats .wrap{display:grid;grid-template-columns:repeat(4,1fr);gap:0;padding-block:clamp(34px,4vw,52px)}
.ci-landing .stat{position:relative;padding-inline:clamp(12px,2vw,28px);text-align:center}
.ci-landing .stat + .stat::before{content:"";position:absolute;left:0;top:14%;height:72%;width:1px;background:var(--line)}
.ci-landing .stat .num{font-size:clamp(2rem,3.4vw,2.7rem);font-weight:800;letter-spacing:-.03em;color:var(--green-deep);font-variant-numeric:tabular-nums}
.ci-landing .stat .lab{margin-top:4px;color:var(--muted);font-size:14px;font-weight:600}

.ci-landing .programs{background:var(--green-deep);color:#eaf3ec;position:relative;overflow:hidden}
.ci-landing .programs::before{content:"";position:absolute;inset:0;background:
  repeating-linear-gradient(135deg, rgba(255,255,255,.025) 0 2px, transparent 2px 22px);pointer-events:none}
.ci-landing .programs .sec-head{text-align:left;margin:0 0 34px;max-width:none;display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap}
.ci-landing .programs .sec-head .eyebrow{justify-content:flex-start;color:var(--lime)}
.ci-landing .programs .sec-head .eyebrow::before{background:
  radial-gradient(circle at 25% 50%, #fff 0 3.4px, transparent 3.6px),
  radial-gradient(circle at 75% 50%, var(--lime) 0 3.4px, transparent 3.6px), rgba(255,255,255,.12)}
.ci-landing .programs h2{color:#fff;font-size:clamp(1.9rem,3.6vw,2.7rem);margin-top:12px;max-width:18ch}
.ci-landing .dept{position:relative;z-index:1;margin-top:40px}
.ci-landing .dept-head{display:flex;align-items:center;gap:14px;margin-bottom:20px}
.ci-landing .dept-head .n{display:grid;place-items:center;width:34px;height:34px;border-radius:9px;background:rgba(255,255,255,.08);color:var(--lime);font-weight:800;font-size:14px}
.ci-landing .dept-head h3{color:#fff;font-size:1.3rem}
.ci-landing .dept-head p{color:#a9c3af;font-size:14px}
.ci-landing .prog-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}
.ci-landing .prog{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.1);border-radius:var(--radius);padding:24px;display:flex;flex-direction:column;gap:12px;transition:background-color .18s,border-color .18s}
.ci-landing .prog:hover{background:rgba(255,255,255,.075);border-color:rgba(183,224,23,.4)}
.ci-landing .prog .cover{height:118px;border-radius:12px;overflow:hidden;background:#20402b;margin:-4px -4px 6px}
.ci-landing .prog .deg{font-size:12px;font-weight:700;color:var(--lime);letter-spacing:.02em}
.ci-landing .prog h4{color:#fff;font-size:1.12rem}
.ci-landing .prog p{color:#b9cfbf;font-size:14px;flex:1}
.ci-landing .prog .plink{display:inline-flex;align-items:center;gap:7px;font-weight:700;font-size:13.5px;color:#eaf3ec}
.ci-landing .prog .plink .arrow-circle{width:26px;height:26px}
.ci-landing .prog .plink .arrow-circle svg{width:13px;height:13px}
.ci-landing .prog .levels{display:flex;flex-wrap:wrap;gap:6px}
.ci-landing .prog .lvl{font-size:11.5px;font-weight:700;color:#cfe0d3;background:rgba(255,255,255,.08);border-radius:999px;padding:3px 10px}
.ci-landing .prog.feature{background:var(--lime);border-color:var(--lime)}
.ci-landing .prog.feature .deg{color:#38571a}
.ci-landing .prog.feature h4{color:var(--lime-ink)}
.ci-landing .prog.feature p{color:#30491c}
.ci-landing .prog.feature .plink{color:var(--lime-ink)}
.ci-landing .prog.feature .lvl{color:#38571a;background:rgba(26,46,12,.12)}
.ci-landing .prog.feature .plink .arrow-circle{background:var(--green-deep);color:var(--lime)}

.ci-landing .news-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.ci-landing .card{background:#fff;border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;display:flex;flex-direction:column;transition:border-color .18s,box-shadow .18s}
.ci-landing .card:hover{border-color:var(--green);box-shadow:0 2px 8px rgba(15,26,19,.06),0 20px 42px -26px rgba(15,26,19,.26)}
.ci-landing .card .cover{height:168px;overflow:hidden;background:#dfe3df}
.ci-landing .card .body{padding:20px 22px 24px;display:flex;flex-direction:column;gap:10px;flex:1}
.ci-landing .meta{display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--faint);font-weight:600}
.ci-landing .tag{display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;background:var(--green-soft);color:var(--green);font-size:11.5px;font-weight:700}
.ci-landing .card h3{font-size:1.14rem;letter-spacing:-.02em}
.ci-landing .card .body p{color:var(--muted);font-size:14px;flex:1}

.ci-landing .admission{background:var(--bg-soft)}
.ci-landing .steps{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.ci-landing .step{position:relative;background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:26px 22px}
.ci-landing .step .no{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;background:var(--green-soft);color:var(--green);font-weight:800;margin-bottom:16px}
.ci-landing .step h4{font-size:1.08rem;margin-bottom:7px}
.ci-landing .step p{color:var(--muted);font-size:14px}

.ci-landing .cta-band{background:var(--green-deep);color:#fff;position:relative;overflow:hidden}
.ci-landing .cta-band::after{content:"";position:absolute;right:-60px;top:-40px;width:280px;height:280px;border-radius:999px;background:radial-gradient(circle,rgba(183,224,23,.18),transparent 70%)}
.ci-landing .cta-band .wrap{position:relative;display:grid;grid-template-columns:1.2fr 1fr;gap:40px;align-items:center}
.ci-landing .cta-band h2{color:#fff;font-size:clamp(1.9rem,3.6vw,2.7rem);max-width:16ch}
.ci-landing .cta-band p{margin-top:14px;color:#bcd3c2;max-width:40ch}
.ci-landing .cta-actions{display:flex;gap:14px;flex-wrap:wrap;margin-top:26px}
.ci-landing .contact-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:var(--radius);padding:26px}
.ci-landing .contact-card h4{color:#fff;font-size:1.1rem;margin-bottom:16px}
.ci-landing .contact-card ul{list-style:none;margin:0;padding:0;display:grid;gap:14px}
.ci-landing .contact-card li{display:flex;align-items:center;gap:12px;color:#cfe0d3;font-size:14.5px}
.ci-landing .contact-card svg{width:18px;height:18px;color:var(--lime);flex-shrink:0}

.ci-landing footer.foot{background:#0c2316;color:#9fb6a6;font-size:14px}
.ci-landing footer.foot .wrap{padding-block:46px;display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:32px}
.ci-landing footer.foot .brand{color:#fff;margin-bottom:14px}
.ci-landing footer.foot .brand .mark{background:rgba(255,255,255,.08)}
.ci-landing footer.foot h5{color:#fff;font-size:13px;font-weight:700;margin:0 0 14px}
.ci-landing footer.foot ul{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.ci-landing footer.foot a:hover{color:var(--lime)}
.ci-landing footer.foot .fcol p{max-width:30ch;color:#8ba694}
.ci-landing .footbar{border-top:1px solid rgba(255,255,255,.08)}
.ci-landing .footbar .wrap{padding-block:18px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;color:#7d9686;font-size:13px}

/* apparition au défilement (activée seulement quand JS ajoute .anim) */
.ci-landing.anim .reveal{opacity:0;transform:translateY(28px);transition:opacity .7s ease, transform .8s cubic-bezier(.2,.75,.2,1)}
.ci-landing.anim .reveal.in{opacity:1;transform:none}

@media (max-width:980px){
  .ci-landing nav.links,.ci-landing .topbar li.hide-sm{display:none}
  .ci-landing .menu-btn{display:grid;place-items:center;margin-left:auto}
  .ci-landing header.nav .cta .cta-hide{display:none}
  .ci-landing .hero .wrap,.ci-landing .about .wrap,.ci-landing .cta-band .wrap{grid-template-columns:1fr}
  .ci-landing .stage{height:360px;order:-1}
  .ci-landing .prog-grid,.ci-landing .news-grid,.ci-landing .steps,.ci-landing .stats .wrap{grid-template-columns:1fr 1fr}
  .ci-landing footer.foot .wrap{grid-template-columns:1fr 1fr}
}
@media (max-width:620px){
  .ci-landing .prog-grid,.ci-landing .news-grid,.ci-landing .steps,.ci-landing .stats .wrap{grid-template-columns:1fr}
  .ci-landing .stat + .stat::before{display:none}
  .ci-landing .stats .wrap{gap:22px}
  .ci-landing .about-media .am2{width:100%}
  .ci-landing .facts{grid-template-columns:1fr}
  .ci-landing footer.foot .wrap{grid-template-columns:1fr}
  .ci-landing .topbar .wrap{justify-content:center}
}
@media (prefers-reduced-motion:reduce){
  .ci-landing .marquee-track{animation:none}
}
`

/* ───────────────────────── photos (Unsplash, rendues N&B) ───────────────────────── */
const U = (id, w, h) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`
const PH = {
  hero: [
    { src: U('1522202176988-66273c2fd55f', 520, 680), alt: 'Étudiants en informatique' },
    { src: U('1591117207239-788bf8de6c3b', 520, 460), alt: 'Amphithéâtre' },
    { src: U('1588072432836-e10032774350', 560, 440), alt: 'Salle informatique' },
  ],
  about: [
    { src: U('1523240795612-9a054b0db644', 760, 440), alt: 'Travail en équipe' },
    { src: U('1543269865-cbf427effbad', 640, 360), alt: 'Groupe d’étudiants' },
  ],
  prog: [
    U('1517694712202-14dd9538aa97', 640, 360),
    U('1558494949-ef010cbdcc31', 640, 360),
    U('1531482615713-2afd69097998', 640, 360),
  ],
  news: [
    U('1531482615713-2afd69097998', 640, 360),
    U('1562774053-701939374585', 640, 360),
    U('1509062522246-3755977927d7', 640, 360),
  ],
}
const SEAL = (year) => `<svg viewBox="0 0 120 120"><defs><path id="ciCircle" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0"/></defs><circle cx="60" cy="60" r="58" fill="#13311f"/><circle cx="60" cy="60" r="44" fill="none" stroke="#b7e017" stroke-width="1" opacity=".5"/><text font-size="10" font-weight="700" letter-spacing="2" fill="#dfeae1"><textPath href="#ciCircle" startOffset="0">· CENTRE INFORMATIQUE · DEPUIS ${year} </textPath></text><g fill="none" stroke="#b7e017" stroke-width="2.4"><path d="M44 60h32M64 48l12 12-12 12"/></g></svg>`
const BADGE_YEARS = (n) => `<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="56" fill="#b7e017"/><text x="60" y="54" text-anchor="middle" font-size="30" font-weight="800" fill="#1a2e0c">${n}</text><text x="60" y="78" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1" fill="#38571a">ANS</text></svg>`

/* ───────────────────────── icônes ───────────────────────── */
const IArrow = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
const IArrowThin = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
const IExtern = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M7 17 17 7M8 7h9v9" /></svg>
const IPhone = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" /></svg>
const IMail = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" /></svg>
const IPin = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
const IMenu = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>

function Counter({ value = 0, suffix = '' }) {
  const [n, setN] = useState(0)
  const ref = useRef(null)
  const done = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const target = Number(value) || 0
    if (reduce) { setN(target); return }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true
        const dur = 1400
        let start = null
        const tick = (t) => {
          if (!start) start = t
          const p = Math.min((t - start) / dur, 1)
          setN(Math.floor((1 - Math.pow(1 - p, 3)) * target))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        io.disconnect()
      }
    }, { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [value])
  return <span ref={ref}>{n.toLocaleString('fr-FR')}{suffix}</span>
}

const cleanName = (s) => (s || '').replace(/\s*\([^)]*\)\s*$/, '').trim()
const formatDate = (iso) => {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
  } catch { return iso }
}

export default function Home() {
  const [data, setData] = useState(null)
  const stageRef = useRef(null)

  useEffect(() => {
    const ctrl = new AbortController()
    fetchLandingContent(ctrl.signal).then(setData).catch(() => setData(null))
    return () => ctrl.abort()
  }, [])

  // Interactions : tilt 3D du hero (souris) + parallaxe de défilement + apparition au scroll.
  useEffect(() => {
    const root = document.querySelector('.ci-landing')
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || !root) return
    root.classList.add('anim')

    const stage = stageRef.current
    const inner = stage ? stage.querySelector('.stage-inner') : null
    const layers = stage ? Array.from(stage.querySelectorAll('[data-depth]')) : []
    const parEls = Array.from(root.querySelectorAll('[data-par]'))

    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0
    let sy = window.pageYOffset || document.documentElement.scrollTop || 0

    const onMove = (e) => {
      if (!stage) return
      const r = stage.getBoundingClientRect()
      tx = (e.clientX - (r.left + r.width / 2)) / r.width
      ty = (e.clientY - (r.top + r.height / 2)) / r.height
    }
    const onLeave = () => { tx = 0; ty = 0 }
    const onScroll = () => { sy = window.pageYOffset || document.documentElement.scrollTop || 0 }

    const loop = () => {
      cx += (tx - cx) * 0.07
      cy += (ty - cy) * 0.07
      if (inner) inner.style.transform = `rotateY(${cx * 10}deg) rotateX(${-cy * 8}deg)`
      for (const el of layers) {
        const d = parseFloat(el.getAttribute('data-depth')) || 0
        const ps = parseFloat(el.getAttribute('data-pscroll')) || 0
        el.style.transform = `translate3d(${cx * d * 1.9}px, ${cy * d * 1.35 + sy * ps}px, ${Math.abs(d)}px)`
      }
      for (const el of parEls) {
        const s = parseFloat(el.getAttribute('data-par')) || 0
        el.style.transform = `translate3d(0, ${sy * s}px, 0)`
      }
      raf = requestAnimationFrame(loop)
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            en.target.classList.add('in')
            io.unobserve(en.target)
          }
        }
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' },
    )
    root.querySelectorAll('.reveal').forEach((el) => io.observe(el))

    window.addEventListener('scroll', onScroll, { passive: true })
    if (stage) {
      stage.addEventListener('mousemove', onMove)
      stage.addEventListener('mouseleave', onLeave)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (stage) {
        stage.removeEventListener('mousemove', onMove)
        stage.removeEventListener('mouseleave', onLeave)
      }
      cancelAnimationFrame(raf)
      io.disconnect()
      root.classList.remove('anim')
    }
  }, [data])

  const inst = data?.institution ?? {}
  const foundingYear = inst.founding_year ?? 1989
  const stats = data?.stats ?? []
  const departments = data?.departments ?? []
  const news = data?.news ?? []
  const years = stats.find((s) => s.key === 'experience')?.value ?? (new Date().getFullYear() - foundingYear)

  const marqueeItems = departments.length
    ? departments.flatMap((d) => [cleanName(d.name), ...d.programs.map((p) => cleanName(p.name))])
    : ['Génie logiciel', 'Réseaux & systèmes', 'Développement', 'NTIC', 'Systèmes d’information']

  let progIndex = 0
  const marqueeRow = (
    <span>
      {marqueeItems.map((t, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 24 }}>
          {t} <i className="star">✦</i>
        </span>
      ))}
    </span>
  )

  return (
    <div className="ci-landing">
      <style>{CSS}</style>

      {/* top bar */}
      <div className="topbar">
        <div className="wrap">
          <ul>
            <li><IPhone />+224 624 08 45 01</li>
            <li className="hide-sm"><IMail />direction@ci.edu.gn</li>
            <li className="hide-sm"><IPin />Dixinn, Conakry — Guinée</li>
          </ul>
          <div className="socials">
            <a href="https://ci.edu.gn" target="_blank" rel="noreferrer" aria-label="Site du Centre">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 6h-2.5a15 15 0 0 0-1.1-3A8 8 0 0 1 18.9 8ZM12 4.2c.6.9 1.2 2.2 1.5 3.8h-3c.3-1.6.9-2.9 1.5-3.8ZM4.3 14a8 8 0 0 1 0-4h2.9a17 17 0 0 0 0 4Zm.8 2h2.5c.3 1.1.6 2.1 1.1 3A8 8 0 0 1 5.1 16Zm2.5-8H5.1a8 8 0 0 1 3.6-3 15 15 0 0 0-1.1 3ZM12 19.8c-.6-.9-1.2-2.2-1.5-3.8h3c-.3 1.6-.9 2.9-1.5 3.8Zm1.9-5.8h-3.8a15 15 0 0 1 0-4h3.8a15 15 0 0 1 0 4Zm.6 5a15 15 0 0 0 1.1-3h2.5a8 8 0 0 1-3.6 3Zm2.3-5a17 17 0 0 0 0-4h2.9a8 8 0 0 1 0 4Z" /></svg>
            </a>
          </div>
        </div>
      </div>

      {/* header */}
      <header className="nav">
        <div className="wrap">
          <a className="brand" href="#accueil"><span className="mark"><span /></span>Centre Informatique</a>
          <nav className="links">
            <a href="#accueil" className="active">Accueil</a>
            <a href="#programmes">Programmes</a>
            <a href="#actualites">Actualités</a>
            <a href="#admission">Admission</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="cta">
            <Link to="/auth/login" className="btn btn-ghost cta-hide">Espace notes</Link>
            <a href="#admission" className="btn btn-primary">Candidater <IArrow /></a>
            <button className="menu-btn" aria-label="Menu"><IMenu /></button>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="hero" id="accueil">
        <div className="hero-shape shape-b" data-par="-0.18" />
        <div className="wrap">
          <div className="hero-text">
            <span className="eyebrow">{inst.name || 'Centre Informatique'} · UGANC</span>
            <h1 className="hero-title">Former les talents du <em>numérique</em> guinéen</h1>
            <p className="hero-lead">
              Issu d’un partenariat France-Guinée depuis {foundingYear}, le Centre Informatique forme en
              Licence, Master et Doctorat — et met à disposition une plateforme pour suivre sa scolarité et ses notes.
            </p>
            <div className="hero-actions">
              <a href="#programmes" className="btn btn-primary">Découvrir les programmes <IArrow /></a>
              <Link to="/auth/login" className="link-arrow">Accéder à l’espace notes <IArrowThin /></Link>
            </div>
            <div className="hero-foot">
              <span>Arrêté N°632/MEN/DNSUP/89</span><span className="dot" />
              <span>Depuis {foundingYear}</span><span className="dot" />
              <span>Système LMD</span>
            </div>
          </div>

          <div className="stage" ref={stageRef}>
            <div className="stage-inner">
              <div className="panel p1" data-depth="26" data-pscroll="0.05"><img src={PH.hero[0].src} alt={PH.hero[0].alt} /></div>
              <div className="panel p2" data-depth="-20" data-pscroll="-0.04"><img src={PH.hero[1].src} alt={PH.hero[1].alt} /></div>
              <div className="panel p3" data-depth="40" data-pscroll="0.08"><img src={PH.hero[2].src} alt={PH.hero[2].alt} /></div>
            </div>
            <div className="seal" data-depth="14" dangerouslySetInnerHTML={{ __html: SEAL(foundingYear) }} />
            <div className="spark" data-depth="30"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z" /></svg></div>
          </div>
        </div>
      </section>

      {/* marquee */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">{marqueeRow}{marqueeRow}</div>
      </div>

      {/* about */}
      <section className="about">
        <div className="wrap">
          <div className="about-media reveal">
            <div className="panel am1"><img src={PH.about[0].src} alt={PH.about[0].alt} /></div>
            <div className="panel am2"><img src={PH.about[1].src} alt={PH.about[1].alt} /></div>
            <div className="about-badge" data-par="0.14" dangerouslySetInnerHTML={{ __html: BADGE_YEARS(years) }} />
          </div>
          <div className="about-text reveal">
            <span className="eyebrow">Le Centre</span>
            <h2>Un pôle d’excellence pour l’informatique en Guinée</h2>
            <p className="about-lead">
              Créé en {foundingYear} grâce à un partenariat France-Guinée, le Centre Informatique est un
              établissement de l’Université Gamal Abdel Nasser de Conakry. Il forme ingénieurs et développeurs
              à travers ses départements, selon le système LMD reconnu à l’international.
            </p>
            <div className="facts">
              <div className="fact"><div className="k">Partenariat</div><div className="v">France – Guinée</div></div>
              <div className="fact"><div className="k">Arrêté</div><div className="v">N°632/MEN/DNSUP/89</div></div>
              <div className="fact"><div className="k">Cursus</div><div className="v">Système LMD</div></div>
              <div className="fact"><div className="k">Localisation</div><div className="v">Dixinn, Conakry</div></div>
            </div>
            <a href="#programmes" className="btn btn-lime">Voir les programmes <IArrow /></a>
          </div>
        </div>
      </section>

      {/* stats */}
      {stats.length > 0 && (
        <section className="stats">
          <div className="wrap">
            {stats.map((s) => (
              <div className="stat reveal" key={s.key}>
                <div className="num"><Counter value={s.value} suffix={s.suffix || ''} /></div>
                <div className="lab">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* programmes */}
      <section className="programs" id="programmes">
        <div className="wrap">
          <div className="sec-head reveal">
            <div>
              <span className="eyebrow">Nos programmes</span>
              <h2>Des départements, des parcours diplômants</h2>
            </div>
            <a href="https://ci.edu.gn" target="_blank" rel="noreferrer" className="btn btn-outline-light">Le site du Centre <IArrow /></a>
          </div>

          {departments.map((d, di) => (
            <div className="dept reveal" key={d.code}>
              <div className="dept-head">
                <span className="n">{String(di + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{cleanName(d.name)}</h3>
                  {d.description ? <p>{d.description}</p> : null}
                </div>
              </div>
              <div className="prog-grid">
                {d.programs.map((p) => {
                  const feature = progIndex === 0
                  const cover = PH.prog[progIndex % PH.prog.length]
                  progIndex += 1
                  return (
                    <article className={`prog reveal${feature ? ' feature' : ''}`} key={p.code}>
                      <div className="cover"><img src={cover} alt="" loading="lazy" /></div>
                      <span className="deg">{p.degree_label || 'Diplôme'}</span>
                      <h4>{cleanName(p.name)}</h4>
                      {p.description ? <p>{p.description}</p> : <p />}
                      {p.levels?.length ? (
                        <div className="levels">
                          {p.levels.map((lv) => <span className="lvl" key={lv.number}>{lv.name}</span>)}
                        </div>
                      ) : null}
                      {p.website_url ? (
                        <a href={p.website_url} target="_blank" rel="noreferrer" className="plink">
                          Voir le site du programme <span className="arrow-circle"><IExtern /></span>
                        </a>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* actualités */}
      {news.length > 0 && (
        <section id="actualites">
          <div className="wrap">
            <div className="sec-head reveal">
              <span className="eyebrow">Actualités</span>
              <h2>Les moments forts de la vie du Centre</h2>
              <p>Événements, campus, diplômes : ce qui fait vibrer les salles et les laboratoires.</p>
            </div>
            <div className="news-grid">
              {news.map((a, i) => (
                <article className="card reveal" key={a.slug || i}>
                  <div className="cover"><img src={PH.news[i % PH.news.length]} alt="" loading="lazy" /></div>
                  <div className="body">
                    <div className="meta"><span className="tag">{a.tag_label}</span><span>{formatDate(a.published_at)}</span></div>
                    <h3>{a.title}</h3>
                    <p>{a.excerpt}</p>
                    {a.url ? (
                      <a href={a.url} target="_blank" rel="noreferrer" className="link-arrow">Lire l’article <IArrowThin /></a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* admission */}
      <section className="admission" id="admission">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="eyebrow">Admission</span>
            <h2>Rejoindre le Centre en quatre étapes</h2>
            <p>Un parcours de candidature clair, de la demande en ligne à l’inscription définitive.</p>
          </div>
          <div className="steps">
            <div className="step reveal"><div className="no">1</div><h4>Candidature</h4><p>Déposez votre demande et choisissez le programme visé.</p></div>
            <div className="step reveal"><div className="no">2</div><h4>Étude du dossier</h4><p>Vos relevés et pièces sont examinés par la commission.</p></div>
            <div className="step reveal"><div className="no">3</div><h4>Entretien</h4><p>Un échange pour confirmer votre projet et votre niveau.</p></div>
            <div className="step reveal"><div className="no">4</div><h4>Inscription</h4><p>Validez votre place et accédez à l’espace étudiant.</p></div>
          </div>
        </div>
      </section>

      {/* cta + contact */}
      <section className="cta-band" id="contact">
        <div className="wrap">
          <div>
            <h2>Prêt à construire votre avenir dans le numérique ?</h2>
            <p>Contactez le service scolarité pour toute question, ou accédez directement à votre espace de notes.</p>
            <div className="cta-actions">
              <a href="mailto:direction@ci.edu.gn" className="btn btn-lime">Nous écrire <IArrow /></a>
              <Link to="/auth/login" className="btn btn-outline-light">Espace notes</Link>
            </div>
          </div>
          <div className="contact-card reveal">
            <h4>Nous contacter</h4>
            <ul>
              <li><IPhone />+224 624 08 45 01 · +224 657 99 43 57</li>
              <li><IMail />direction@ci.edu.gn</li>
              <li><IPin />Dixinn, Conakry 33139 — Guinée</li>
            </ul>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="foot">
        <div className="wrap">
          <div className="fcol">
            <a className="brand" href="#accueil"><span className="mark"><span /></span>Centre Informatique</a>
            <p>Centre de formation et de recherche en informatique de l’Université Gamal Abdel Nasser de Conakry.</p>
          </div>
          <div className="fcol">
            <h5>Programmes</h5>
            <ul>
              {(departments.length ? departments : [{ code: 'x', name: 'Nos formations' }]).map((d) => (
                <li key={d.code}><a href="#programmes">{cleanName(d.name)}</a></li>
              ))}
            </ul>
          </div>
          <div className="fcol">
            <h5>Le Centre</h5>
            <ul>
              <li><a href="#actualites">Actualités</a></li>
              <li><a href="#admission">Admission</a></li>
              <li><a href="#contact">Contact</a></li>
              <li><a href="https://ci.edu.gn" target="_blank" rel="noreferrer">Site officiel</a></li>
            </ul>
          </div>
          <div className="fcol">
            <h5>Espaces</h5>
            <ul>
              <li><Link to="/auth/login">Espace notes</Link></li>
              <li><Link to="/auth/login">Étudiants</Link></li>
              <li><Link to="/auth/login">Enseignants</Link></li>
            </ul>
          </div>
        </div>
        <div className="footbar">
          <div className="wrap">
            <span>© {new Date().getFullYear()} Centre Informatique — UGANC. Tous droits réservés.</span>
            <span>Conakry · Guinée</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
