import { useEffect, useRef, useState } from 'react'

/* ════════════════════════════════════════════════════════════════════════════
   SITE DU PROGRAMME — Licence Bio-Informatique
   Centre Informatique (UGANC, Conakry) · Département NTIC
   Site autonome servi sur bioinfo.ci.edu.gn (host-aware, voir programHosts.js).
   ════════════════════════════════════════════════════════════════════════════ */

const CENTER_URL = 'https://ci.edu.gn'
const NOTES_URL = 'https://notes.ci.edu.gn'

/* ─────────── Hélice d'ADN animée (canvas, respecte prefers-reduced-motion) ─────────── */
function DnaHelix() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let w = 0
    let h = 0
    let dpr = 1

    const resize = () => {
      const r = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = r.width
      h = r.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const LIME = '#b7e017'
    const draw = (phase) => {
      ctx.clearRect(0, 0, w, h)
      const cx = w * (w < 620 ? 0.5 : 0.62)
      const amp = Math.min(w * 0.17, 120)
      const turns = 2.1
      const steps = 150
      const top = 24
      const bottom = h - 24
      const span = bottom - top

      // Barreaux (paires de bases) — dessinés d'abord pour passer sous les brins.
      for (let i = 0; i <= steps; i += 6) {
        const t = i / steps
        const y = top + t * span
        const a = t * turns * Math.PI * 2 + phase
        const x1 = cx + Math.sin(a) * amp
        const x2 = cx + Math.sin(a + Math.PI) * amp
        const depth = (Math.cos(a) + 1) / 2 // 0 arrière … 1 avant
        ctx.strokeStyle = `rgba(183,224,23,${0.12 + depth * 0.45})`
        ctx.lineWidth = 1 + depth * 1.6
        ctx.beginPath()
        ctx.moveTo(x1, y)
        ctx.lineTo(x2, y)
        ctx.stroke()
      }

      // Deux brins.
      const strand = (offset, color) => {
        ctx.beginPath()
        for (let i = 0; i <= steps; i++) {
          const t = i / steps
          const y = top + t * span
          const a = t * turns * Math.PI * 2 + phase + offset
          const x = cx + Math.sin(a) * amp
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = color
        ctx.lineWidth = 2.4
        ctx.stroke()
      }
      strand(0, 'rgba(234,243,236,0.9)')
      strand(Math.PI, LIME)

      // Nucléotides (petits nœuds lumineux) sur les deux brins.
      for (let i = 0; i <= steps; i += 6) {
        const t = i / steps
        const y = top + t * span
        const a = t * turns * Math.PI * 2 + phase
        for (const off of [0, Math.PI]) {
          const x = cx + Math.sin(a + off) * amp
          const depth = (Math.cos(a + off) + 1) / 2
          ctx.beginPath()
          ctx.arc(x, y, 1.6 + depth * 2.6, 0, Math.PI * 2)
          ctx.fillStyle = off === 0 ? `rgba(234,243,236,${0.4 + depth * 0.6})` : `rgba(183,224,23,${0.4 + depth * 0.6})`
          ctx.fill()
        }
      }
    }

    if (reduce) {
      draw(0.6)
      window.addEventListener('resize', () => draw(0.6))
      return () => window.removeEventListener('resize', resize)
    }
    const start = performance.now()
    const loop = (now) => {
      draw(((now - start) / 1000) * 0.6)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])
  return <canvas ref={ref} className="helix" aria-hidden="true" />
}

/* ─────────── Bande de séquence (motif signature, défilement lent) ─────────── */
function SequenceStrip() {
  const bases = 'ATCGGCTAAGCTTACCGATGCTAGCTAGGCATTACGATCGTTAGCCATGCAGTCATGCTAGCATCGATCGTAGCTACGATCGATCGTAGCATCG'
  const colors = { A: '#b7e017', T: '#eaf3ec', C: '#7fd4ff', G: '#ffd36e' }
  const row = bases.split('').map((b, i) => (
    <span key={i} style={{ color: colors[b] }}>{b}</span>
  ))
  return (
    <div className="seqstrip" aria-hidden="true">
      <div className="seqstrip-track">{row}{row}</div>
    </div>
  )
}

/* ─────────── Icônes ─────────── */
const IArrow = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
const ICode = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5" /></svg>
const IDna = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 3c0 6 12 6 12 12M18 3c0 6-12 6-12 12M6 21c0-2 12-2 12 0M6 3c0-.3 12-.3 12 0M7 7h10M7 17h10" /></svg>
const IChart = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 20V4M4 20h16M8 20v-6M13 20V9M18 20v-9" /></svg>
const IPulse = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 12h4l2-6 4 12 2-6h6" /></svg>
const ILeaf = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M11 20A7 7 0 0 1 4 13c0-5 5-9 16-9 0 11-4 16-9 16zM9 15c3-3 5-4 8-5" /></svg>
const IShield = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" /></svg>
const ICheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M4 12l5 5L20 6" /></svg>

/* ─────────── Données de la fiche programme (construites pour ce site) ─────────── */
const PILLARS = [
  { icon: <IDna />, k: 'Le vivant', t: 'Biologie & génétique', d: "ADN, protéines, cellules, génomes : comprendre le langage du vivant pour savoir ce qu'on analyse." },
  { icon: <ICode />, k: 'La machine', t: 'Informatique & algorithmes', d: 'Programmation, structures de données et algorithmes capables de traiter des millions de séquences.' },
  { icon: <IChart />, k: 'La preuve', t: 'Statistiques & données', d: "Probabilités, modèles et apprentissage automatique pour tirer du sens d'océans de données biologiques." },
]

const STAKES = [
  { icon: <IPulse />, img: '/bioinfo/sequencing.jpg', t: 'Riposte aux épidémies', d: "Lors de l'épidémie d'Ebola de 2014 en Afrique de l'Ouest, c'est le séquençage du génome du virus qui a permis de retracer sa transmission. Former ces compétences ici, c'est répondre plus vite demain." },
  { icon: <IShield />, img: '/bioinfo/research.jpg', t: 'Santé des populations', d: "Paludisme résistant, drépanocytose très présente en Afrique de l'Ouest : la génomique aide à comprendre, dépister et traiter des maladies qui touchent directement la Guinée." },
  { icon: <ILeaf />, img: '/bioinfo/agriculture.jpg', t: 'Agriculture & biodiversité', d: 'Riz, manioc, variétés locales : analyser les génomes des plantes et des sols pour des cultures plus résistantes et une agriculture plus sûre.' },
]

const SKILLS = [
  'Programmer et automatiser l’analyse de données biologiques',
  'Aligner, assembler et annoter des séquences d’ADN et de protéines',
  'Exploiter les grandes bases de données génomiques (NCBI, Ensembl…)',
  'Appliquer statistiques et apprentissage automatique au vivant',
  'Construire des pipelines d’analyse reproductibles',
  'Communiquer des résultats scientifiques clairs et vérifiables',
]

const CURRICULUM = [
  {
    year: 'Licence 1',
    tag: 'Fondations',
    open: true,
    note: 'Niveau d’entrée — ouvert à la rentrée en cours.',
    sems: [
      { s: 'Semestre 1', units: ['Algorithmique & programmation (Python)', 'Mathématiques pour l’informatique', 'Biologie cellulaire', 'Chimie générale & biochimie', 'Introduction à la bio-informatique', 'Méthodologie & anglais scientifique'] },
      { s: 'Semestre 2', units: ['Programmation orientée objet', 'Structures de données', 'Probabilités & statistiques', 'Biologie moléculaire & génétique', 'Bases de données', 'Systèmes & environnement Linux'] },
    ],
  },
  {
    year: 'Licence 2',
    tag: 'Outils du vivant numérique',
    open: false,
    note: 'Cursus en déploiement progressif.',
    sems: [
      { s: 'Semestre 3', units: ['Algorithmes sur les séquences', 'Statistiques appliquées (R)', 'Génomique', 'Programmation web & données', 'Graphes & optimisation'] },
      { s: 'Semestre 4', units: ['Bases de données biologiques', 'Alignement de séquences (BLAST)', 'Biologie des systèmes', 'Modélisation moléculaire', 'Projet tutoré'] },
    ],
  },
  {
    year: 'Licence 3',
    tag: 'Spécialisation & professionnalisation',
    open: false,
    note: 'Cursus en déploiement progressif.',
    sems: [
      { s: 'Semestre 5', units: ['Séquençage haut débit (NGS)', 'Apprentissage automatique appliqué', 'Bio-informatique structurale', 'Phylogénie & évolution', 'Épidémiologie numérique'] },
      { s: 'Semestre 6', units: ['Pipelines & reproductibilité (Git, Nextflow)', 'Éthique & données de santé', 'Stage en laboratoire / entreprise', 'Projet de fin d’études'] },
    ],
  },
]

const CAREERS = [
  'Bio-informaticien·ne',
  'Analyste de données génomiques / NGS',
  'Data scientist en santé',
  'Assistant·e de recherche (laboratoires, instituts)',
  'Surveillance épidémiologique & santé publique',
  'R&D en agro-biotechnologie',
  'Poursuite en Master (bio-informatique, data science)',
]

const ADMISSION = [
  { n: '01', t: 'Baccalauréat scientifique', d: 'Obtention du baccalauréat, de préférence dans une série scientifique (sciences de la vie, mathématiques).' },
  { n: '02', t: 'Orientation nationale', d: 'L’État oriente les nouveaux bacheliers vers les établissements publics. Il n’y a pas de candidature individuelle.' },
  { n: '03', t: 'Affectation au Centre', d: 'Les bacheliers orientés vers la Bio-Informatique du Centre Informatique rejoignent le département NTIC.' },
  { n: '04', t: 'Inscription & rentrée', d: 'Inscription administrative puis entrée en Licence 1 au sein de l’Université Gamal Abdel Nasser de Conakry.' },
]

/* ════════════════════════════ PAGE ════════════════════════════ */
export default function Bioinformatique() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const prevTitle = document.title
    document.title = 'Bio-Informatique · Licence — Centre Informatique (UGANC)'
    const meta = document.querySelector('meta[name="description"]') || (() => {
      const m = document.createElement('meta')
      m.name = 'description'
      document.head.appendChild(m)
      return m
    })()
    const prevDesc = meta.content
    meta.content = "Licence en Bio-Informatique du Centre Informatique (UGANC, Conakry) : l'informatique au service du vivant — génomique, santé, données biologiques."
    return () => { document.title = prevTitle; meta.content = prevDesc }
  }, [])

  const nav = [
    ['#discipline', 'La discipline'],
    ['#enjeux', 'Les enjeux'],
    ['#programme', 'Le programme'],
    ['#debouches', 'Débouchés'],
    ['#admission', 'Admission'],
  ]
  const go = (e, href) => {
    e.preventDefault()
    setMenuOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="bioinf">
      <style>{CSS}</style>

      {/* ───────── En-tête ───────── */}
      <header className="topbar">
        <div className="tb-inner">
          <a className="brand" href={CENTER_URL}>
            <span className="mark"><IDna /></span>
            <span className="brand-txt">
              <strong>Centre Informatique</strong>
              <em>Bio-Informatique</em>
            </span>
          </a>
          <nav className={`tb-nav${menuOpen ? ' open' : ''}`}>
            {nav.map(([href, label]) => (
              <a key={href} href={href} onClick={(e) => go(e, href)}>{label}</a>
            ))}
            <a className="tb-cta" href={CENTER_URL}>Le Centre <IArrow /></a>
          </nav>
          <button className="burger" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* ───────── Hero ───────── */}
      <section className="hero">
        <div className="hero-photo" aria-hidden="true" />
        <DnaHelix />
        <div className="hero-grad" />
        <div className="hero-inner">
          <span className="eyebrow"><i className="dot" /> Licence · Département NTIC</span>
          <h1>L’informatique au service <em>du vivant</em>.</h1>
          <p className="lede">
            La bio-informatique lit l’ADN, les protéines et les génomes avec les outils du code et des données.
            Au Centre Informatique de Conakry, elle forme une génération capable de mettre la puissance du
            numérique au service de la santé et de la science en Guinée.
          </p>
          <div className="hero-cta">
            <a className="btn btn-lime" href="#programme" onClick={(e) => go(e, '#programme')}>Explorer le programme <IArrow /></a>
            <a className="btn btn-ghost" href="#enjeux" onClick={(e) => go(e, '#enjeux')}>Pourquoi ça compte</a>
          </div>
          <div className="hero-foot">
            <span><strong>3 ans</strong> · Licence (L1 → L3)</span>
            <i className="sep" />
            <span><strong>UGANC</strong> · Conakry</span>
            <i className="sep" />
            <span><strong>Code BIOIF</strong> · NTIC</span>
          </div>
        </div>
      </section>

      <SequenceStrip />

      {/* ───────── La discipline ───────── */}
      <section id="discipline" className="band light">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow dark"><i className="dot" /> La discipline</span>
            <h2>Trois mondes qui se rencontrent</h2>
            <p className="sub">La bio-informatique n’existe qu’au croisement de la biologie, de l’informatique et des statistiques. On n’y apprend pas une matière, on apprend à les faire dialoguer.</p>
          </div>
          <div className="pillars">
            {PILLARS.map((p) => (
              <article key={p.t} className="pillar">
                <span className="p-icon">{p.icon}</span>
                <span className="p-k">{p.k}</span>
                <h3>{p.t}</h3>
                <p>{p.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Les enjeux (cœur émotionnel) ───────── */}
      <section id="enjeux" className="band deep">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow"><i className="dot" /> Pourquoi ici, pourquoi maintenant</span>
            <h2>Des données qui sauvent des vies</h2>
            <p className="sub light">La bio-informatique n’est pas un luxe académique. En Afrique de l’Ouest, elle touche directement la santé, l’alimentation et la souveraineté scientifique.</p>
          </div>
          <div className="stakes">
            {STAKES.map((s) => (
              <article key={s.t} className="stake">
                <div className="s-photo">
                  <img src={s.img} alt="" loading="lazy" decoding="async" />
                  <span className="s-icon">{s.icon}</span>
                </div>
                <div className="s-body">
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="stake-foot">
            Former ces compétences <strong>en Guinée</strong>, c’est cesser de dépendre de l’extérieur pour
            analyser nos propres données du vivant.
          </p>
        </div>
      </section>

      {/* ───────── Compétences ───────── */}
      <section className="band light">
        <div className="wrap split">
          <div className="split-media"><img src="/bioinfo/code.jpg" alt="Analyse de données biologiques par le code" loading="lazy" decoding="async" /></div>
          <div className="split-txt">
            <span className="eyebrow dark"><i className="dot" /> À la sortie</span>
            <h2>Ce qu’un diplômé sait faire</h2>
            <p className="sub">La Licence vise des compétences concrètes, utilisables en laboratoire, en recherche ou en entreprise.</p>
            <ul className="skills">
              {SKILLS.map((s) => (
                <li key={s}><span className="chk"><ICheck /></span>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────── Le programme / maquette ───────── */}
      <section id="programme" className="band mist">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow dark"><i className="dot" /> La maquette</span>
            <h2>Un parcours sur trois ans</h2>
            <p className="sub">Des fondations solides en première année, puis une montée en spécialisation jusqu’au projet de fin d’études et au stage.</p>
          </div>
          <div className="years">
            {CURRICULUM.map((y) => (
              <article key={y.year} className={`year${y.open ? ' is-open' : ''}`}>
                <header className="y-head">
                  <div>
                    <span className="y-name">{y.year}</span>
                    <span className="y-tag">{y.tag}</span>
                  </div>
                  <span className={`y-badge${y.open ? ' on' : ''}`}>{y.open ? 'Ouvert' : 'À venir'}</span>
                </header>
                <div className="y-sems">
                  {y.sems.map((sm) => (
                    <div key={sm.s} className="sem">
                      <span className="sem-name">{sm.s}</span>
                      <ul>
                        {sm.units.map((u) => <li key={u}>{u}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
                <p className="y-note">{y.note}</p>
              </article>
            ))}
          </div>
          <p className="maquette-note">
            Maquette indicative de la formation. Le contenu détaillé de chaque unité d’enseignement est arrêté
            par le département NTIC du Centre Informatique.
          </p>
        </div>
      </section>

      {/* ───────── Débouchés ───────── */}
      <section id="debouches" className="band light">
        <div className="wrap split">
          <div className="split-txt">
            <span className="eyebrow dark"><i className="dot" /> Débouchés</span>
            <h2>Où mène la bio-informatique</h2>
            <p className="sub">Un profil rare et recherché, à la frontière de la santé, de la recherche et de la donnée — en Guinée comme à l’international.</p>
            <ul className="careers">
              {CAREERS.map((c, i) => (
                <li key={c}><span className="c-n">{String(i + 1).padStart(2, '0')}</span>{c}</li>
              ))}
            </ul>
            <a className="link-arrow" href={CENTER_URL}>Découvrir le Centre Informatique <IArrow /></a>
          </div>
          <div className="split-media tall"><img src="/bioinfo/lab.jpg" alt="Environnement de laboratoire et de recherche" loading="lazy" decoding="async" /></div>
        </div>
      </section>

      {/* ───────── Admission ───────── */}
      <section id="admission" className="band deep">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow"><i className="dot" /> Admission</span>
            <h2>Une admission par orientation de l’État</h2>
            <p className="sub light">Le Centre Informatique est un établissement public de l’UGANC. L’accès se fait par l’orientation nationale des nouveaux bacheliers — il n’y a pas de candidature individuelle.</p>
          </div>
          <div className="steps">
            {ADMISSION.map((s) => (
              <div key={s.n} className="step">
                <span className="step-n">{s.n}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="cta-band">
        <div className="wrap">
          <h2>Lire le vivant par le code.</h2>
          <p>La Bio-Informatique rejoint l’offre du Centre Informatique. Découvrez l’ensemble des programmes et l’espace numérique du Centre.</p>
          <div className="cta-row">
            <a className="btn btn-lime" href={CENTER_URL}>Le Centre Informatique <IArrow /></a>
            <a className="btn btn-ghost-l" href={NOTES_URL}>Espace notes</a>
          </div>
        </div>
      </section>

      {/* ───────── Footer ───────── */}
      <footer className="foot">
        <div className="wrap f-inner">
          <div className="f-brand">
            <span className="mark"><IDna /></span>
            <div>
              <strong>Centre Informatique</strong>
              <span>Université Gamal Abdel Nasser de Conakry</span>
            </div>
          </div>
          <nav className="f-links">
            <a href={CENTER_URL}>Site du Centre</a>
            <a href={NOTES_URL}>Espace notes</a>
            <a href="#programme" onClick={(e) => go(e, '#programme')}>Le programme</a>
            <a href="#admission" onClick={(e) => go(e, '#admission')}>Admission</a>
          </nav>
          <p className="f-copy">Licence Bio-Informatique · Département NTIC · Conakry, Guinée</p>
        </div>
      </footer>
    </div>
  )
}

/* ════════════════════════════ STYLES (scopés .bioinf) ════════════════════════════ */
const CSS = `
.bioinf{
  --bg:#ffffff; --soft:#f4f6f3; --mist:#eef2ec;
  --ink:#0f1a12; --muted:#5a6b5e; --line:#e3e9e2;
  --deep:#0e2817; --green:#1c4a2e; --green-soft:#eaf1e9;
  --lime:#b7e017; --lime-br:#c6f024; --lime-ink:#1a2e0c;
  --sans:"Plus Jakarta Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  --mono:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
  --radius:18px; --radius-sm:12px;
  font-family:var(--sans); color:var(--ink); background:var(--bg);
  line-height:1.62; -webkit-font-smoothing:antialiased;
}
.bioinf *{box-sizing:border-box; margin:0; padding:0}
.bioinf a{color:inherit; text-decoration:none}
.bioinf h1,.bioinf h2,.bioinf h3{letter-spacing:-.025em; line-height:1.08; font-weight:800}
.bioinf .wrap{max-width:1140px; margin-inline:auto; padding-inline:clamp(20px,5vw,40px)}
.bioinf .eyebrow{display:inline-flex; align-items:center; gap:9px; font-size:12.5px; font-weight:700; letter-spacing:.02em; color:var(--lime); text-transform:none}
.bioinf .eyebrow.dark{color:var(--green)}
.bioinf .eyebrow .dot{width:7px; height:7px; border-radius:999px; background:var(--lime); box-shadow:0 0 0 4px rgba(183,224,23,.18)}
.bioinf .eyebrow.dark .dot{background:var(--green); box-shadow:0 0 0 4px rgba(28,74,46,.12)}

.bioinf .btn{display:inline-flex; align-items:center; gap:9px; font-weight:700; font-size:15px; padding:13px 22px; border-radius:999px; border:1.5px solid transparent; cursor:pointer; transition:.18s}
.bioinf .btn svg{width:17px; height:17px}
.bioinf .btn-lime{background:var(--lime); color:var(--lime-ink)}
.bioinf .btn-lime:hover{background:var(--lime-br); transform:translateY(-1px)}
.bioinf .btn-ghost{border-color:rgba(255,255,255,.28); color:#eaf3ec}
.bioinf .btn-ghost:hover{border-color:var(--lime); color:var(--lime)}
.bioinf .btn-ghost-l{border-color:rgba(255,255,255,.3); color:#eaf3ec}
.bioinf .btn-ghost-l:hover{border-color:#fff; color:#fff}
.bioinf .link-arrow{display:inline-flex; align-items:center; gap:8px; font-weight:700; font-size:14.5px; border-bottom:2px solid var(--lime); padding-bottom:3px; width:fit-content}
.bioinf .link-arrow svg{width:16px; height:16px; transition:transform .18s}
.bioinf .link-arrow:hover svg{transform:translateX(3px)}

/* ── Topbar ── */
.bioinf .topbar{position:sticky; top:0; z-index:50; background:rgba(14,40,23,.86); backdrop-filter:blur(12px); border-bottom:1px solid rgba(255,255,255,.08)}
.bioinf .tb-inner{max-width:1140px; margin-inline:auto; padding:12px clamp(20px,5vw,40px); display:flex; align-items:center; justify-content:space-between; gap:18px}
.bioinf .brand{display:flex; align-items:center; gap:11px}
.bioinf .brand .mark{display:grid; place-items:center; width:38px; height:38px; border-radius:11px; background:var(--lime); color:var(--lime-ink)}
.bioinf .brand .mark svg{width:22px; height:22px}
.bioinf .brand-txt{display:flex; flex-direction:column; line-height:1.15}
.bioinf .brand-txt strong{font-size:14.5px; color:#fff; font-weight:700}
.bioinf .brand-txt em{font-style:normal; font-size:12px; color:var(--lime); font-weight:600}
.bioinf .tb-nav{display:flex; align-items:center; gap:4px}
.bioinf .tb-nav>a{font-size:14px; font-weight:600; color:#cfe0d4; padding:8px 13px; border-radius:999px; transition:.15s}
.bioinf .tb-nav>a:hover{color:#fff; background:rgba(255,255,255,.08)}
.bioinf .tb-nav .tb-cta{color:var(--lime-ink); background:var(--lime); font-weight:700; margin-left:8px}
.bioinf .tb-nav .tb-cta svg{width:15px; height:15px}
.bioinf .tb-nav .tb-cta:hover{background:var(--lime-br)}
.bioinf .burger{display:none; flex-direction:column; gap:5px; background:none; border:0; cursor:pointer; padding:8px}
.bioinf .burger span{width:22px; height:2px; background:#eaf3ec; border-radius:2px}

/* ── Hero ── */
.bioinf .hero{position:relative; background:#071610; color:#eaf3ec; overflow:hidden; min-height:min(90vh,780px); display:flex; align-items:center}
.bioinf .hero-photo{position:absolute; inset:0; z-index:0; background:url(/bioinfo/hero.jpg) center right/cover no-repeat}
.bioinf .hero .helix{position:absolute; inset:0; width:100%; height:100%; z-index:1; opacity:.5; mix-blend-mode:screen}
.bioinf .hero-grad{position:absolute; inset:0; z-index:2; background:
  linear-gradient(90deg, #071610 6%, rgba(7,22,16,.82) 40%, rgba(7,22,16,.28) 78%, rgba(7,22,16,.5) 100%),
  linear-gradient(0deg, #071610 2%, rgba(7,22,16,0) 46%)}
.bioinf .hero-inner{position:relative; z-index:3; max-width:1140px; margin-inline:auto; padding:clamp(56px,9vw,96px) clamp(20px,5vw,40px); width:100%}
.bioinf .hero h1{font-size:clamp(2.4rem,6vw,4.4rem); margin:18px 0 20px; max-width:16ch; color:#fff}
.bioinf .hero h1 em{font-style:normal; color:var(--lime); position:relative; white-space:nowrap}
.bioinf .hero h1 em::after{content:""; position:absolute; left:0; right:0; bottom:.05em; height:.14em; background:rgba(183,224,23,.35); border-radius:999px; z-index:-1}
.bioinf .hero .lede{font-size:clamp(1.02rem,1.7vw,1.22rem); color:#cde0d2; max-width:52ch; margin-bottom:30px}
.bioinf .hero-cta{display:flex; flex-wrap:wrap; gap:12px; margin-bottom:34px}
.bioinf .hero-foot{display:flex; align-items:center; flex-wrap:wrap; gap:14px; font-size:13.5px; color:#9db7a5}
.bioinf .hero-foot strong{color:#eaf3ec; font-weight:700}
.bioinf .hero-foot .sep{width:4px; height:4px; border-radius:999px; background:var(--lime); opacity:.6}

/* ── Bande de séquence ── */
.bioinf .seqstrip{background:var(--deep); border-block:1px solid rgba(255,255,255,.06); overflow:hidden; padding:10px 0}
.bioinf .seqstrip-track{display:inline-flex; white-space:nowrap; font-family:var(--mono); font-size:13px; letter-spacing:.32em; font-weight:600; animation:seqscroll 60s linear infinite; will-change:transform}
.bioinf .seqstrip-track span{opacity:.72}
@keyframes seqscroll{from{transform:translateX(0)} to{transform:translateX(-50%)}}
@media (prefers-reduced-motion: reduce){ .bioinf .seqstrip-track{animation:none} }

/* ── Bandes ── */
.bioinf .band{padding-block:clamp(60px,9vw,108px)}
.bioinf .band.light{background:var(--bg)}
.bioinf .band.soft{background:var(--soft)}
.bioinf .band.mist{background:var(--mist)}
.bioinf .band.deep{background:radial-gradient(120% 120% at 80% 0%, #143320 0%, var(--deep) 60%); color:#eaf3ec}
.bioinf .sec-head{max-width:680px; margin-bottom:clamp(36px,5vw,56px)}
.bioinf .sec-head h2{font-size:clamp(1.8rem,3.6vw,2.7rem); margin:14px 0 14px}
.bioinf .sec-head .sub{font-size:clamp(1rem,1.5vw,1.12rem); color:var(--muted)}
.bioinf .sec-head .sub.light{color:#b9cdbe}
.bioinf .band.deep h2{color:#fff}

/* Piliers */
.bioinf .pillars{display:grid; grid-template-columns:repeat(3,1fr); gap:20px}
.bioinf .pillar{background:var(--soft); border:1px solid var(--line); border-radius:var(--radius); padding:28px 26px}
.bioinf .p-icon{display:grid; place-items:center; width:48px; height:48px; border-radius:13px; background:var(--green-soft); color:var(--green); margin-bottom:18px}
.bioinf .p-icon svg{width:26px; height:26px}
.bioinf .p-k{font-size:12px; font-weight:700; color:var(--green); letter-spacing:.03em}
.bioinf .pillar h3{font-size:1.28rem; margin:6px 0 10px}
.bioinf .pillar p{color:var(--muted); font-size:15px}

/* Enjeux */
.bioinf .stakes{display:grid; grid-template-columns:repeat(3,1fr); gap:20px}
.bioinf .stake{display:flex; flex-direction:column; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1); border-radius:var(--radius); overflow:hidden}
.bioinf .s-photo{position:relative; aspect-ratio:16/10; overflow:hidden}
.bioinf .s-photo img{width:100%; height:100%; object-fit:cover; display:block; transition:transform .7s cubic-bezier(.2,.7,.2,1)}
.bioinf .stake:hover .s-photo img{transform:scale(1.05)}
.bioinf .s-photo::after{content:""; position:absolute; inset:0; background:linear-gradient(0deg, rgba(7,22,16,.72), rgba(7,22,16,.05) 62%)}
.bioinf .s-icon{position:absolute; z-index:2; left:16px; bottom:14px; display:grid; place-items:center; width:46px; height:46px; border-radius:12px; background:var(--lime); color:var(--lime-ink); box-shadow:0 10px 22px -10px rgba(0,0,0,.6)}
.bioinf .s-icon svg{width:24px; height:24px}
.bioinf .s-body{padding:24px 24px 26px}
.bioinf .stake h3{font-size:1.24rem; color:#fff; margin-bottom:10px}
.bioinf .stake p{color:#b9cdbe; font-size:14.5px}
.bioinf .stake-foot{margin-top:30px; font-size:clamp(1.05rem,1.8vw,1.3rem); color:#dff0e4; max-width:60ch}
.bioinf .stake-foot strong{color:var(--lime)}

/* Split */
.bioinf .split{display:grid; grid-template-columns:1fr 1.1fr; gap:clamp(32px,5vw,64px); align-items:center}
.bioinf .split-media{position:relative; border-radius:20px; overflow:hidden; aspect-ratio:4/5; border:1px solid var(--line); box-shadow:0 30px 60px -40px rgba(7,22,16,.5)}
.bioinf .split-media.tall{aspect-ratio:3/4}
.bioinf .split-media img{position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block}
.bioinf .split-txt h2{font-size:clamp(1.8rem,3.4vw,2.5rem); margin:14px 0 14px}
.bioinf .split-txt .sub{color:var(--muted); margin-bottom:18px}
.bioinf .skills{display:grid; gap:12px; list-style:none}
.bioinf .skills li{display:flex; align-items:flex-start; gap:13px; background:var(--soft); border:1px solid var(--line); border-radius:var(--radius-sm); padding:16px 18px; font-weight:600; font-size:15px}
.bioinf .chk{flex-shrink:0; display:grid; place-items:center; width:26px; height:26px; border-radius:999px; background:var(--lime); color:var(--lime-ink)}
.bioinf .chk svg{width:15px; height:15px}

/* Maquette */
.bioinf .years{display:grid; grid-template-columns:repeat(3,1fr); gap:20px}
.bioinf .year{background:#fff; border:1px solid var(--line); border-radius:var(--radius); padding:26px 24px; display:flex; flex-direction:column}
.bioinf .year.is-open{border-color:var(--green); box-shadow:0 18px 40px -26px rgba(14,40,23,.4)}
.bioinf .y-head{display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:20px}
.bioinf .y-name{display:block; font-size:1.3rem; font-weight:800; letter-spacing:-.02em}
.bioinf .y-tag{display:block; font-size:12.5px; color:var(--muted); font-weight:600; margin-top:3px}
.bioinf .y-badge{flex-shrink:0; font-size:11px; font-weight:700; padding:5px 11px; border-radius:999px; background:var(--mist); color:var(--muted)}
.bioinf .y-badge.on{background:var(--lime); color:var(--lime-ink)}
.bioinf .y-sems{display:grid; gap:18px}
.bioinf .sem-name{display:block; font-size:12px; font-weight:700; color:var(--green); letter-spacing:.03em; margin-bottom:9px}
.bioinf .sem ul{list-style:none; display:grid; gap:7px}
.bioinf .sem li{position:relative; padding-left:16px; font-size:14px; color:#38483d}
.bioinf .sem li::before{content:""; position:absolute; left:0; top:9px; width:6px; height:6px; border-radius:999px; background:var(--lime)}
.bioinf .y-note{margin-top:18px; padding-top:16px; border-top:1px dashed var(--line); font-size:12.5px; color:var(--muted)}
.bioinf .maquette-note{margin-top:26px; font-size:13px; color:var(--muted); max-width:70ch}

/* Débouchés */
.bioinf .careers{list-style:none; display:grid; gap:10px}
.bioinf .careers li{display:flex; align-items:center; gap:16px; background:var(--soft); border:1px solid var(--line); border-radius:var(--radius-sm); padding:15px 20px; font-weight:600; font-size:15.5px}
.bioinf .c-n{font-family:var(--mono); font-size:13px; font-weight:700; color:var(--green); background:var(--green-soft); padding:4px 9px; border-radius:7px}

/* Admission */
.bioinf .steps{display:grid; grid-template-columns:repeat(4,1fr); gap:18px}
.bioinf .step{background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1); border-radius:var(--radius); padding:24px 22px}
.bioinf .step-n{font-family:var(--mono); font-size:13px; font-weight:700; color:var(--lime); display:inline-block; margin-bottom:14px; padding:4px 10px; border-radius:7px; background:rgba(183,224,23,.12)}
.bioinf .step h3{font-size:1.1rem; color:#fff; margin-bottom:9px}
.bioinf .step p{font-size:13.5px; color:#b9cdbe}

/* CTA */
.bioinf .cta-band{background:var(--lime); color:var(--lime-ink); padding-block:clamp(56px,8vw,88px); text-align:center}
.bioinf .cta-band h2{font-size:clamp(2rem,4.5vw,3.2rem)}
.bioinf .cta-band p{max-width:56ch; margin:16px auto 28px; font-size:clamp(1rem,1.6vw,1.15rem); color:#2a4310; font-weight:500}
.bioinf .cta-row{display:flex; gap:12px; justify-content:center; flex-wrap:wrap}
.bioinf .cta-band .btn-lime{background:var(--lime-ink); color:var(--lime)}
.bioinf .cta-band .btn-lime:hover{background:#0f1a07}
.bioinf .cta-band .btn-ghost-l{border-color:rgba(26,46,12,.4); color:var(--lime-ink)}
.bioinf .cta-band .btn-ghost-l:hover{border-color:var(--lime-ink)}

/* Footer */
.bioinf .foot{background:var(--deep); color:#9db7a5; padding-block:46px}
.bioinf .f-inner{display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:22px}
.bioinf .f-brand{display:flex; align-items:center; gap:13px}
.bioinf .f-brand .mark{display:grid; place-items:center; width:42px; height:42px; border-radius:12px; background:rgba(183,224,23,.14); color:var(--lime)}
.bioinf .f-brand .mark svg{width:24px; height:24px}
.bioinf .f-brand strong{display:block; color:#fff; font-size:15px}
.bioinf .f-brand span{font-size:12.5px}
.bioinf .f-links{display:flex; flex-wrap:wrap; gap:6px}
.bioinf .f-links a{font-size:14px; font-weight:600; color:#cfe0d4; padding:7px 13px; border-radius:999px}
.bioinf .f-links a:hover{color:#fff; background:rgba(255,255,255,.07)}
.bioinf .f-copy{width:100%; padding-top:18px; margin-top:4px; border-top:1px solid rgba(255,255,255,.08); font-size:12.5px}

/* ── Responsive ── */
@media (max-width:900px){
  .bioinf .pillars,.bioinf .stakes,.bioinf .years{grid-template-columns:1fr}
  .bioinf .steps{grid-template-columns:repeat(2,1fr)}
  .bioinf .split{grid-template-columns:1fr; gap:28px}
  .bioinf .split-media,.bioinf .split-media.tall{aspect-ratio:16/10}
}
@media (max-width:760px){
  .bioinf .tb-nav{position:fixed; inset:60px 0 auto 0; flex-direction:column; align-items:stretch; gap:4px; background:rgba(14,40,23,.98); backdrop-filter:blur(14px); padding:16px clamp(20px,5vw,40px) 22px; border-bottom:1px solid rgba(255,255,255,.1); transform:translateY(-130%); transition:transform .28s; box-shadow:0 20px 40px -20px rgba(0,0,0,.5)}
  .bioinf .tb-nav.open{transform:translateY(0)}
  .bioinf .tb-nav>a{padding:12px 14px; font-size:15px}
  .bioinf .tb-nav .tb-cta{margin-left:0; justify-content:center; margin-top:6px}
  .bioinf .burger{display:flex}
}
@media (max-width:520px){
  .bioinf .steps{grid-template-columns:1fr}
}
`
