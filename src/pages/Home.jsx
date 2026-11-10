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
.ci-landing .panel img,.ci-landing .cover img{display:block;width:100%;height:100%;object-fit:cover}

/* header flottant (suspendu), masqué au défilement vers le bas */
.ci-landing header.nav{position:fixed;top:12px;left:0;right:0;z-index:60;padding-inline:clamp(12px,3vw,24px);transition:transform .35s cubic-bezier(.4,0,.2,1),opacity .3s ease}
.ci-landing header.nav.nav-hidden{transform:translateY(-150%);opacity:0;pointer-events:none}
.ci-landing header.nav .wrap{display:flex;align-items:center;gap:24px;height:62px;padding-inline:18px;
  background:rgba(255,255,255,.72);backdrop-filter:saturate(1.4) blur(14px);border:1px solid var(--line);border-radius:16px;
  box-shadow:0 12px 34px -16px rgba(15,26,19,.38)}
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
.ci-landing .hero .wrap{position:relative;z-index:2;display:grid;grid-template-columns:1.04fr 1fr;gap:clamp(28px,4vw,60px);align-items:center;
  padding-top:clamp(82px,10vh,104px);padding-bottom:clamp(44px,6vw,72px)}
.ci-landing .hero-canvas{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:.9}
.ci-landing section[id]{scroll-margin-top:90px}
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

/* showcase cinématique plein écran */
.ci-landing .showcase{position:relative;background:var(--green-deep);color:#eaf3ec}
.ci-landing .sc-head{position:relative;z-index:2;max-width:620px;padding-top:clamp(56px,7vw,96px);padding-bottom:clamp(16px,3vw,28px)}
.ci-landing .sc-head .eyebrow{color:var(--lime)}
.ci-landing .sc-head .eyebrow::before{background:
  radial-gradient(circle at 25% 50%, #fff 0 3.4px, transparent 3.6px),
  radial-gradient(circle at 75% 50%, var(--lime) 0 3.4px, transparent 3.6px), rgba(255,255,255,.12)}
.ci-landing .sc-head h2{color:#fff;font-size:clamp(1.9rem,3.6vw,2.7rem);margin-top:12px;max-width:18ch}
.ci-landing .sc-head p{color:#a9c3af;margin-top:12px;font-size:15px}
.ci-landing .showcase{padding-bottom:clamp(44px,6vw,80px)}
.ci-landing .dept-row{margin-top:clamp(30px,4vw,52px)}
.ci-landing .dept-row-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:clamp(16px,2vw,24px)}
.ci-landing .dept-row-title{display:flex;align-items:center;gap:14px}
.ci-landing .dept-row-n{display:inline-grid;place-items:center;width:40px;height:40px;border-radius:11px;background:rgba(183,224,23,.14);color:var(--lime);font-weight:800;font-size:14px;flex-shrink:0}
.ci-landing .dept-row-title h3{color:#fff;font-size:clamp(1.3rem,2.3vw,1.7rem);letter-spacing:-.02em;line-height:1.1;max-width:26ch}
.ci-landing .dept-row-title p{color:#a9c3af;font-size:13.5px;margin-top:3px}
.ci-landing .dept-row-nav{display:flex;gap:9px;flex-shrink:0}
.ci-landing .rnav{display:grid;place-items:center;width:44px;height:44px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);color:#eaf3ec;cursor:pointer;transition:background-color .2s,border-color .2s,color .2s}
.ci-landing .rnav:hover{background:var(--lime);color:var(--lime-ink);border-color:var(--lime)}
.ci-landing .rnav svg{width:18px;height:18px}
.ci-landing .rnav.prev svg{transform:rotate(180deg)}
.ci-landing .dept-scroller{overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scroll-padding-inline:clamp(16px,4vw,40px);
  padding-inline:clamp(16px,4vw,40px);padding-block:6px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.26) transparent;-webkit-overflow-scrolling:touch}
.ci-landing .dept-scroller::-webkit-scrollbar{height:8px}
.ci-landing .dept-scroller::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:999px}
.ci-landing .dept-scroller::-webkit-scrollbar-track{background:transparent}
.ci-landing .dept-track{display:flex;gap:clamp(16px,2vw,24px);width:max-content}
.ci-landing .pcard{position:relative;flex:0 0 clamp(290px,78vw,860px);height:clamp(400px,56vh,520px);border-radius:22px;overflow:hidden;scroll-snap-align:center}
.ci-landing .pcard-bg{position:absolute;inset:0;z-index:0}
.ci-landing .pcard-bg img{width:100%;height:100%;object-fit:cover;transition:transform .7s cubic-bezier(.2,.7,.2,1)}
.ci-landing .pcard:hover .pcard-bg img{transform:scale(1.06)}
.ci-landing .pcard::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(0deg, rgba(9,20,13,.93), rgba(9,20,13,.34) 50%, rgba(9,20,13,.08) 100%)}
.ci-landing .pcard-content{position:relative;z-index:2;height:100%;display:flex;flex-direction:column;justify-content:flex-end;gap:10px;padding:clamp(22px,3vw,34px)}
.ci-landing .pcard-content .deg{font-size:12px;font-weight:700;color:var(--lime);letter-spacing:.03em}
.ci-landing .pcard-content h4{color:#fff;font-size:clamp(1.4rem,2.4vw,2rem);line-height:1.08;letter-spacing:-.02em;max-width:18ch}
.ci-landing .pcard-content p{color:#d6e3da;font-size:14.5px;line-height:1.55;max-width:46ch}
.ci-landing .showcase .levels{display:flex;flex-wrap:wrap;gap:7px}
.ci-landing .showcase .lvl{font-size:12px;font-weight:700;color:#eaf3ec;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.16);border-radius:999px;padding:4px 11px}
.ci-landing .pcard-content .btn{align-self:flex-start;margin-top:6px}
.ci-landing .programs .sec-head{text-align:left;margin:0 0 34px;max-width:none;display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap}
.ci-landing .programs .sec-head .eyebrow{justify-content:flex-start;color:var(--lime)}
.ci-landing .programs .sec-head .eyebrow::before{background:
  radial-gradient(circle at 25% 50%, #fff 0 3.4px, transparent 3.6px),
  radial-gradient(circle at 75% 50%, var(--lime) 0 3.4px, transparent 3.6px), rgba(255,255,255,.12)}
.ci-landing .programs h2{color:#fff;font-size:clamp(1.9rem,3.6vw,2.7rem);margin-top:12px;max-width:18ch}
.ci-landing .dept{position:relative;z-index:1;margin-top:clamp(36px,5vw,56px)}
.ci-landing .dept-grid{display:grid;grid-template-columns:.82fr 1.25fr;gap:clamp(24px,3vw,46px);align-items:start}
.ci-landing .dept-aside{position:sticky;top:96px}
.ci-landing .dept-aside .n{display:inline-grid;place-items:center;width:40px;height:40px;border-radius:11px;background:rgba(255,255,255,.08);color:var(--lime);font-weight:800;font-size:15px;margin-bottom:16px}
.ci-landing .dept-aside h3{color:#fff;font-size:clamp(1.3rem,2.1vw,1.6rem);margin-bottom:10px;max-width:15ch}
.ci-landing .dept-aside p{color:#a9c3af;font-size:14.5px;line-height:1.62}
.ci-landing .dept-count{display:inline-flex;align-items:center;margin-top:16px;font-size:12px;font-weight:700;color:var(--lime);
  background:rgba(183,224,23,.12);border:1px solid rgba(183,224,23,.32);border-radius:999px;padding:5px 13px}
.ci-landing .dept-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,258px),1fr));gap:18px}
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

/* apparition au défilement — mode allégé (.anim : IntersectionObserver ajoute .in) */
.ci-landing.anim .reveal{opacity:0;transform:translateY(28px);transition:opacity .7s ease, transform .8s cubic-bezier(.2,.75,.2,1)}
.ci-landing.anim .reveal.in{opacity:1;transform:none}
/* mode complet (.fx : GSAP pilote l'apparition en inline) — état de base masqué, sans flash */
.ci-landing.fx .reveal{opacity:0;will-change:opacity,transform}

/* menu mobile plein écran */
.ci-landing .mobile-menu{position:fixed;inset:0;z-index:70;background:var(--green-deep);
  display:flex;flex-direction:column;justify-content:center;gap:24px;padding:clamp(24px,8vw,48px);animation:ci-fade .22s ease}
.ci-landing .mobile-menu .mm-close{position:absolute;top:18px;right:18px;width:44px;height:44px;display:grid;place-items:center;
  border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#eaf3ec;cursor:pointer}
.ci-landing .mobile-menu nav{display:flex;flex-direction:column}
.ci-landing .mobile-menu nav a{color:#eaf3ec;font-size:clamp(26px,8vw,34px);font-weight:800;letter-spacing:-.025em;
  padding:14px 0;border-bottom:1px solid rgba(255,255,255,.1)}
.ci-landing .mobile-menu nav a:active{color:var(--lime)}
.ci-landing .mobile-menu .mm-cta{display:flex;flex-direction:column;gap:12px;margin-top:8px}
.ci-landing .mobile-menu .mm-cta .btn{justify-content:center}
@keyframes ci-fade{from{opacity:0}to{opacity:1}}

/* micro-interactions au survol */
.ci-landing .card .cover img{transition:transform .55s cubic-bezier(.2,.7,.2,1)}
.ci-landing .card:hover .cover img{transform:scale(1.06)}
.ci-landing .card{transition:border-color .2s,box-shadow .2s,transform .25s ease}
.ci-landing .card:hover{transform:translateY(-5px)}
.ci-landing .prog{transition:background-color .18s,border-color .18s,transform .22s ease}
.ci-landing .prog:hover{transform:translateY(-3px)}
.ci-landing .step{transition:transform .22s ease,border-color .18s,box-shadow .2s}
.ci-landing .step:hover{transform:translateY(-3px);border-color:var(--green);box-shadow:0 18px 38px -24px rgba(15,26,19,.3)}
.ci-landing .fact{transition:border-color .18s,transform .2s ease}
.ci-landing .fact:hover{border-color:var(--green);transform:translateY(-2px)}
.ci-landing .btn-primary,.ci-landing .btn-lime{transition:background-color .18s,color .18s,transform .18s ease,box-shadow .18s}
.ci-landing .btn-primary:hover,.ci-landing .btn-lime:hover{transform:translateY(-1px)}
.ci-landing .btn-lime:hover{box-shadow:0 10px 24px -10px rgba(183,224,23,.6)}

@media (max-width:980px){
  .ci-landing nav.links{display:none}
  .ci-landing .menu-btn{display:grid;place-items:center;margin-left:auto}
  .ci-landing header.nav .cta .cta-hide{display:none}
  .ci-landing .hero .wrap,.ci-landing .about .wrap,.ci-landing .cta-band .wrap{grid-template-columns:1fr}
  .ci-landing .stage{height:360px}
  .ci-landing .dept-grid{grid-template-columns:1fr;gap:20px}
  .ci-landing .dept-aside{position:static}
  .ci-landing .news-grid,.ci-landing .steps,.ci-landing .stats .wrap{grid-template-columns:1fr 1fr}
  .ci-landing footer.foot .wrap{grid-template-columns:1fr 1fr}
}
/* hero mobile : les 3 photos en grille nette (bannière + 2) au lieu du collage 3D */
@media (max-width:820px){
  .ci-landing .stage{position:static;height:auto;perspective:none}
  .ci-landing .stage .stage-inner{position:static;inset:auto;transform:none;display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .ci-landing .stage .stage-inner .panel{position:static;inset:auto;width:auto;height:158px;border-width:4px;will-change:transform}
  .ci-landing .stage .stage-inner .panel.p1{grid-column:1 / -1;height:clamp(190px,52vw,230px)}
  .ci-landing .stage .spark{display:none}
  .ci-landing .dept-row-nav{display:none}
  .ci-landing .pcard{flex-basis:84vw;height:clamp(380px,64vh,460px)}
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
  .ci-landing .sc-bg img{animation:none}
}
`

/* ───────────────────────── photos (Unsplash, rendues N&B) ───────────────────────── */
const U = (id, w, h) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`
const PH = {
  hero: [
    { src: U('1531482615713-2afd69097998', 540, 700), alt: 'Jeunes développeurs au travail' },
    { src: U('1573164713988-8665fc963095', 540, 460), alt: 'Informaticienne avec un ordinateur portable' },
    { src: U('1573495627361-d9b87960b12d', 560, 440), alt: 'Développeur en train de coder' },
  ],
  about: [
    { src: U('1522071820081-009f0129c71c', 760, 440), alt: 'Équipe de développeurs' },
    { src: U('1573164713712-03790a178651', 640, 360), alt: 'Informaticienne en salle serveurs' },
  ],
  prog: [
    U('1484417894907-623942c8ee29', 640, 360),
    U('1581092795360-fd1ca04f0952', 640, 360),
    U('1519389950473-47ba0277781c', 640, 360),
  ],
  news: [
    U('1531482615713-2afd69097998', 640, 360),
    U('1581092795360-fd1ca04f0952', 640, 360),
    U('1522071820081-009f0129c71c', 640, 360),
  ],
}
// Grandes images plein cadre pour le showcase des programmes.
const SCENE_IMG = [
  U('1531482615713-2afd69097998', 1500, 1000),
  U('1573164713988-8665fc963095', 1500, 1000),
  U('1581092795360-fd1ca04f0952', 1500, 1000),
  U('1573495627361-d9b87960b12d', 1500, 1000),
  U('1519389950473-47ba0277781c', 1500, 1000),
  U('1522071820081-009f0129c71c', 1500, 1000),
  U('1484417894907-623942c8ee29', 1500, 1000),
  U('1573164713712-03790a178651', 1500, 1000),
]
const BADGE_YEARS = (n) => `<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="56" fill="#b7e017"/><text x="60" y="54" text-anchor="middle" font-size="30" font-weight="800" fill="#1a2e0c">${n}</text><text x="60" y="78" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1" fill="#38571a">ANS</text></svg>`

/* ───────────────────────── icônes ───────────────────────── */
const IArrow = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
const IArrowThin = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
const IPhone = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" /></svg>
const IMail = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" /></svg>
const IPin = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
const IMenu = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
const IClose = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
const IChevron = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 6l6 6-6 6" /></svg>

const NAV = [['#accueil', 'Accueil'], ['#programmes', 'Programmes'], ['#actualites', 'Actualités'], ['#admission', 'Admission'], ['#contact', 'Contact']]

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
  const [menuOpen, setMenuOpen] = useState(false)
  const stageRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const ctrl = new AbortController()
    fetchLandingContent(ctrl.signal).then(setData).catch(() => setData(null))
    return () => ctrl.abort()
  }, [])

  // Effets de défilement (Lenis + GSAP ScrollTrigger + Three.js), chargés en lazy.
  // Une seule init, une fois les sections rendues (données chargées), avec repli temporisé.
  useEffect(() => {
    let cleanup = () => {}
    let alive = true
    let started = false
    const start = () => {
      if (started || !alive) return
      const root = document.querySelector('.ci-landing')
      if (!root) return
      started = true
      import('@/features/landing/scrollFx')
        .then((m) => {
          if (!alive) return
          cleanup = m.initLandingFx({
            root,
            hero: root.querySelector('.hero'),
            stage: stageRef.current,
            canvas: canvasRef.current,
          }) || (() => {})
        })
        .catch(() => {})
    }
    if (data) start()
    const fallback = setTimeout(start, 1500)
    return () => { alive = false; clearTimeout(fallback); cleanup() }
  }, [data])

  // Header flottant : se masque au défilement vers le bas, réapparaît vers le haut / en haut de page.
  useEffect(() => {
    const header = document.querySelector('.ci-landing header.nav')
    if (!header) return undefined
    let last = window.pageYOffset || 0
    let ticking = false
    const update = () => {
      const y = window.pageYOffset || document.documentElement.scrollTop || 0
      if (y < 90) header.classList.remove('nav-hidden')
      else if (y > last + 6) header.classList.add('nav-hidden')
      else if (y < last - 6) header.classList.remove('nav-hidden')
      last = y
      ticking = false
    }
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update) }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const inst = data?.institution ?? {}
  const foundingYear = inst.founding_year ?? 1989
  const stats = data?.stats ?? []
  const departments = data?.departments ?? []
  const news = data?.news ?? []
  const years = stats.find((s) => s.key === 'experience')?.value ?? (new Date().getFullYear() - foundingYear)

  // Défilement horizontal des carrousels de programmes (flèches).
  const scrollRow = (dir) => (e) => {
    const sc = e.currentTarget.closest('.dept-row')?.querySelector('.dept-scroller')
    if (sc) sc.scrollBy({ left: dir * sc.clientWidth * 0.85, behavior: 'smooth' })
  }

  const marqueeItems = departments.length
    ? departments.flatMap((d) => [cleanName(d.name), ...d.programs.map((p) => cleanName(p.name))])
    : ['Génie logiciel', 'Réseaux & systèmes', 'Développement', 'NTIC', 'Systèmes d’information']

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

      {/* header flottant */}
      <header className="nav">
        <div className="wrap">
          <a className="brand" href="#accueil"><span className="mark"><span /></span>Centre Informatique</a>
          <nav className="links">
            {NAV.map(([h, l], i) => (
              <a key={h} href={h} className={i === 0 ? 'active' : undefined}>{l}</a>
            ))}
          </nav>
          <div className="cta">
            <Link to="/auth/login" className="btn btn-ghost cta-hide">Espace notes</Link>
            <a href="#admission" className="btn btn-primary cta-hide">Candidater <IArrow /></a>
            <button className="menu-btn" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
              {menuOpen ? <IClose /> : <IMenu />}
            </button>
          </div>
        </div>
      </header>

      {/* menu mobile */}
      {menuOpen && (
        <div className="mobile-menu" role="dialog" aria-modal="true">
          <button className="mm-close" aria-label="Fermer" onClick={() => setMenuOpen(false)}><IClose /></button>
          <nav>
            {NAV.map(([h, l]) => (
              <a key={h} href={h} onClick={() => setMenuOpen(false)}>{l}</a>
            ))}
          </nav>
          <div className="mm-cta">
            <Link to="/auth/login" className="btn btn-lime" onClick={() => setMenuOpen(false)}>Espace notes <IArrow /></Link>
            <a href="#admission" className="btn btn-outline-light" onClick={() => setMenuOpen(false)}>Candidater</a>
          </div>
        </div>
      )}

      {/* hero */}
      <section className="hero" id="accueil">
        <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />
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
            <div className="spark" data-depth="30"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z" /></svg></div>
          </div>
        </div>
      </section>

      {/* stats — juste après le hero */}
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

      {/* programmes — carrousels horizontaux immersifs par département */}
      <section className="showcase" id="programmes">
        <div className="wrap sc-head reveal">
          <span className="eyebrow">Nos programmes</span>
          <h2>Des départements, des parcours diplômants</h2>
          <p>Explorez chaque département — faites défiler ses parcours horizontalement.</p>
        </div>
        {departments.map((d, di) => {
          const base = departments.slice(0, di).reduce((s, x) => s + x.programs.length, 0)
          return (
            <div className="dept-row" key={d.code}>
              <div className="wrap dept-row-head reveal">
                <div className="dept-row-title">
                  <span className="dept-row-n">{String(di + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{cleanName(d.name)}</h3>
                    <p>{d.programs.length} parcours diplômant{d.programs.length > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="dept-row-nav">
                  <button type="button" className="rnav prev" aria-label="Précédent" onClick={scrollRow(-1)}><IChevron /></button>
                  <button type="button" className="rnav next" aria-label="Suivant" onClick={scrollRow(1)}><IChevron /></button>
                </div>
              </div>
              <div className="dept-scroller" data-lenis-prevent>
                <div className="dept-track">
                  {d.programs.map((p, pi) => (
                    <article className="pcard" key={p.code}>
                      <div className="pcard-bg"><img src={SCENE_IMG[(base + pi) % SCENE_IMG.length]} alt="" /></div>
                      <div className="pcard-content">
                        <span className="deg">{p.degree_label || 'Diplôme'}</span>
                        <h4>{cleanName(p.name)}</h4>
                        <p>{p.description || 'Un parcours diplômant du Centre Informatique, de la licence au master.'}</p>
                        {p.levels?.length ? (
                          <div className="levels">{p.levels.map((lv) => <span className="lvl" key={lv.number}>{lv.name}</span>)}</div>
                        ) : null}
                        <a href={p.website_url || 'https://ci.edu.gn'} target="_blank" rel="noreferrer" className="btn btn-lime">Voir plus <IArrow /></a>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
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
