import { useState, useEffect, useRef } from "react";

const LOGO_B64 = "data:image/jpeg;base64,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";


function Counter({ target, suffix }) {
  const [count, setCount] = useState(isNaN(parseInt(target)) ? target : 0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    if (isNaN(parseInt(target))) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const end = parseInt(target);
        const duration = 1400;
        const step = end / (duration / 16);
        let current = 0;
        const timer = setInterval(() => {
          current += step;
          if (current >= end) { setCount(end); clearInterval(timer); }
          else setCount(Math.floor(current));
        }, 16);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [stats, setStats] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [debouches, setDebouches] = useState([]);
  const [admission, setAdmission] = useState([]);
  const [direction, setDirection] = useState([]);
  const [historique, setHistorique] = useState([]);


  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);  
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
 useEffect(() => {

  // ===== STATS =====
  fetch("http://localhost:8000/api/home/stats")
    .then(res => {
      if (!res.ok) {
        throw new Error("Erreur API stats");
      }
      return res.json();
    })
    .then(data => {
      console.log("Stats :", data);

      if (data.data && data.data.length > 0) {
        setStats(data.data);
      } else {
        console.warn("Stats vides");
      }
    })
    .catch(err => {
      console.error("Erreur stats :", err);
    });


  // ===== DEPARTEMENTS =====
  fetch("http://localhost:8000/api/departements")
    .then(res => {
      if (!res.ok) {
        throw new Error("Erreur API départements");
      }
      return res.json();
    })
    .then(data => {
      console.log("Départements :", data);

      if (data.data && data.data.length > 0) {
        setDepartements(data.data);
      } else {
        console.warn("Départements vides");
      }
    })
    .catch(err => {
      console.error("Erreur départements :", err);
    });


  // ===== DEBOUCHES =====
  fetch("http://localhost:8000/api/debouches")
    .then(res => res.json())
    .then(data => setDebouches(data.data))
    .catch(err => console.error(err));


  // ===== ADMISSION =====
  fetch("http://localhost:8000/api/admission")
    .then(res => res.json())
    .then(data => setAdmission(data.data))
    .catch(err => console.error(err));


  // ===== DIRECTION =====
  fetch("http://localhost:8000/api/direction")
    .then(res => res.json())
    .then(data => setDirection(data.data))
    .catch(err => console.error(err));


  // ===== HISTORIQUE =====
  fetch("http://localhost:8000/api/historique-directeurs")
    .then(res => res.json())
    .then(data => setHistorique(data.data))
    .catch(err => console.error(err));

}, []);

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#F8FAFF", color: "#1E293B", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=Lora:ital,wght@0,600;0,700;1,600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .ci-page { font-family: 'Sora', sans-serif; }
        .lora { font-family: 'Lora', serif !important; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse-ring { 0%,100% { box-shadow: 0 0 0 0 rgba(29,78,216,0.25); } 50% { box-shadow: 0 0 0 10px rgba(29,78,216,0); } }
        @keyframes slide-in { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
        .hero-text { animation: fadeUp 0.8s ease both; }
        .hero-text:nth-child(2) { animation-delay: 0.15s; }
        .hero-text:nth-child(3) { animation-delay: 0.3s; }
        .hero-text:nth-child(4) { animation-delay: 0.45s; }
        .dept-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .dept-card:hover { transform: translateY(-5px); box-shadow: 0 20px 50px rgba(29,78,216,0.12) !important; }
        .nav-link { position: relative; }
        .nav-link::after { content:''; position:absolute; bottom:-3px; left:0; right:0; height:2px; background:#1D4ED8; transform:scaleX(0); transition:transform 0.25s ease; }
        .nav-link:hover::after { transform:scaleX(1); }
        .nav-link:hover { color: #1D4ED8 !important; }
        .hist-row:hover { background: #EFF6FF !important; }
        .btn-connect { transition: all 0.25s ease; }
        .btn-connect:hover { background: #1E40AF !important; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(29,78,216,0.35) !important; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #1D4ED8; border-radius: 4px; }
      `}</style>

      {/* ══ NAVBAR ══ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 999,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 3rem", height: 68,
        background: scrolled ? "rgba(255,255,255,0.97)" : "#fff",
        borderBottom: "1px solid #E2E8F0",
        boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.08)" : "none",
        transition: "all 0.3s ease",
      }}>
        {/* Logo + nom */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src={LOGO_B64}
            alt="Logo Centre Informatique UGANC"
            style={{ height: 46, width: "auto", objectFit: "contain", borderRadius: 4 }}
          />
          <div style={{ borderLeft: "2px solid #E2E8F0", paddingLeft: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", fontFamily: "'Sora',sans-serif", letterSpacing: "0.01em" }}>Centre Informatique</div>
            <div style={{ fontSize: 10, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase" }}>UGANC · Conakry</div>
          </div>
        </div>

        {/* Liens */}
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          {[["Accueil","#accueil"],["Formations","#departements"],["Admission","#admission"],["Direction","#direction"],["Contact","#contact"]].map(([l,h]) => (
            <a key={l} href={h} className="nav-link" style={{ fontSize: 13, fontWeight: 600, color: "#475569", textDecoration: "none", fontFamily: "'Sora',sans-serif", letterSpacing: "0.02em" }}>{l}</a>
          ))}
        </div>

        {/* Bouton connexion bien structuré */}
        <a
          href="/auth/login"
          className="btn-connect"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "#1D4ED8",
            color: "#fff",
            padding: "10px 22px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
            fontFamily: "'Sora',sans-serif",
            letterSpacing: "0.03em",
            boxShadow: "0 4px 14px rgba(29,78,216,0.3)",
            whiteSpace: "nowrap",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
          Se connecter
        </a>
      </nav>

      {/* ══ HERO ══ */}
      <section id="accueil" style={{ paddingTop: 68, minHeight: "92vh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 40%, #F8FAFF 100%)" }}>
        {/* Déco géométrique */}
        <div style={{ position: "absolute", top: 0, right: 0, width: "45%", height: "100%", background: "linear-gradient(135deg, #1D4ED8 0%, #0369A1 100%)", clipPath: "polygon(18% 0, 100% 0, 100% 100%, 0% 100%)", opacity: 0.07, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 60, right: 80, width: 220, height: 220, borderRadius: "50%", border: "2px solid rgba(29,78,216,0.1)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 100, right: 120, width: 140, height: 140, borderRadius: "50%", background: "rgba(29,78,216,0.05)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 60, left: "30%", width: 80, height: 80, borderRadius: 12, border: "2px solid rgba(29,78,216,0.1)", transform: "rotate(20deg)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 3rem", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 60, alignItems: "center", width: "100%" }}>
          <div>
            <div className="hero-text" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#DBEAFE", border: "1px solid #BFDBFE", borderRadius: 100, padding: "6px 16px", marginBottom: 28, fontSize: 11, color: "#1D4ED8", fontFamily: "'Sora',sans-serif", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1D4ED8", display: "inline-block" }} />
              Université Gamal Abdel Nasser de Conakry
            </div>

            <h1 className="lora hero-text" style={{ fontSize: "clamp(38px,5vw,62px)", fontWeight: 700, lineHeight: 1.1, marginBottom: 20, color: "#0F172A" }}>
              Centre<br />
              <span style={{ color: "#1D4ED8" }}>Informatique</span>
            </h1>

            <p className="hero-text" style={{ fontSize: 16, color: "#64748B", lineHeight: 1.85, maxWidth: 500, marginBottom: 40, fontFamily: "'Sora',sans-serif", fontWeight: 300 }}>
              Fruit d'un partenariat France-Guinée depuis <strong style={{ color: "#1D4ED8", fontWeight: 700 }}>1989</strong> — Formations en Licence, Master et Doctorat dans les domaines des NTIC et du Développement Logiciel.
            </p>

            <div className="hero-text" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <a href="#departements" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#1D4ED8", color: "#fff", padding: "13px 28px", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none", fontFamily: "'Sora',sans-serif", boxShadow: "0 6px 20px rgba(29,78,216,0.35)", transition: "all 0.25s ease" }}
                onMouseEnter={e => e.currentTarget.style.background="#1E40AF"}
                onMouseLeave={e => e.currentTarget.style.background="#1D4ED8"}
              >
                Découvrir nos formations
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </a>
              <a href="/auth/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: "#1D4ED8", padding: "13px 28px", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none", fontFamily: "'Sora',sans-serif", border: "2px solid #BFDBFE", transition: "all 0.25s ease" }}
                onMouseEnter={e => { e.currentTarget.style.background="#EFF6FF"; e.currentTarget.style.borderColor="#1D4ED8"; }}
                onMouseLeave={e => { e.currentTarget.style.background="#fff"; e.currentTarget.style.borderColor="#BFDBFE"; }}
              >
                Plateforme de notes
              </a>
            </div>
          </div>

          {/* Carte logo */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ background: "#fff", borderRadius: 24, padding: "2.5rem", boxShadow: "0 20px 60px rgba(29,78,216,0.12)", border: "1px solid #E2E8F0", maxWidth: 320, width: "100%", textAlign: "center" }}>
              <img src={LOGO_B64} alt="Logo CI UGANC" style={{ width: "100%", maxWidth: 200, height: "auto", objectFit: "contain", marginBottom: 20, borderRadius: 8 }} />
              <div style={{ height: 1, background: "#E2E8F0", marginBottom: 16 }} />
              <div style={{ fontSize: 12, color: "#94A3B8", fontFamily: "'Sora',sans-serif", lineHeight: 1.6 }}>
                Arrêté N°632/MEN/DNSUP/89<br />
                <span style={{ color: "#1D4ED8", fontWeight: 600 }}>Dixinn, Conakry · Guinée</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <div style={{ background: "#1D4ED8", padding: "0 3rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", maxWidth: 1000, margin: "0 auto" }}>
          {stats.map((s, i) => (
            <div key={s.label} style={{ padding: "2rem 1rem", textAlign: "center", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.15)" : "none" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 8, fontFamily: "'Sora',sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.icon} {s.label}</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", fontFamily: "'Lora',serif", lineHeight: 1 }}>
                <Counter target={s.num} suffix="" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ À PROPOS ══ */}
      <section style={{ padding: "6rem 3rem", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: "#1D4ED8", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 14, fontFamily: "'Sora',sans-serif", fontWeight: 700 }}>À PROPOS</div>
            <h2 className="lora" style={{ fontSize: 38, fontWeight: 700, color: "#0F172A", lineHeight: 1.2, marginBottom: 20 }}>
              Bienvenue au<br /><em style={{ color: "#1D4ED8" }}>Centre Informatique</em>
            </h2>
            <p style={{ fontSize: 15, color: "#64748B", lineHeight: 1.9, marginBottom: 16, fontFamily: "'Sora',sans-serif", fontWeight: 300 }}>
              Créé en 1989 grâce à un partenariat France-Guinée, le Centre Informatique est un établissement autonome de l'Université Gamal Abdel Nasser de Conakry, sous la supervision directe du Recteur.
            </p>
            <p style={{ fontSize: 15, color: "#64748B", lineHeight: 1.9, marginBottom: 28, fontFamily: "'Sora',sans-serif", fontWeight: 300 }}>
              Il forme des ingénieurs et développeurs compétents à travers deux départements spécialisés, avec un cursus conforme au système LMD reconnu à l'international.
            </p>
            <a href="https://ci.edu.gn/a-propos" target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 700, color: "#1D4ED8", textDecoration: "none", fontFamily: "'Sora',sans-serif", display: "inline-flex", alignItems: "center", gap: 6 }}>
              En savoir plus →
            </a>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
  {[
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      label: "Partenariat", val: "France – Guinée"
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        </svg>
      ),
      label: "Arrêté", val: "N°632/MEN/89"
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
          <path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
      ),
      label: "Cursus", val: "Système LMD"
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      ),
      label: "Localisation", val: "Dixinn, Conakry"
    },
  ].map((item) => (
    <div key={item.label} style={{ background: "#F8FAFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "1.25rem", borderTop: "3px solid #1D4ED8" }}>
      <div style={{ width: 38, height: 38, background: "#DBEAFE", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
        {item.icon}
      </div>
      <div style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, fontFamily: "'Sora',sans-serif", fontWeight: 600 }}>{item.label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", fontFamily: "'Sora',sans-serif" }}>{item.val}</div>
    </div>
  ))}
</div>
        </div>
      </section>

      {/* ══ DÉPARTEMENTS ══ */}
      <section id="departements" style={{ padding: "6rem 3rem", background: "#F8FAFF" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div style={{ fontSize: 11, color: "#1D4ED8", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 14, fontFamily: "'Sora',sans-serif", fontWeight: 700 }}>FORMATIONS</div>
            <h2 className="lora" style={{ fontSize: 42, fontWeight: 700, color: "#0F172A" }}>Nos départements</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
            {departements.map((d) => (
              <div key={d.code} className="dept-card" style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "2.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", borderTop: `4px solid ${d.accentColor}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                  <div style={{ background: d.lightBg, color: d.accentColor, fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 6, fontFamily: "'Sora',sans-serif", letterSpacing: "0.06em" }}>{d.code}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: "'Sora',sans-serif" }}>{d.niveaux}</div>
                </div>
                <h3 className="lora" style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", marginBottom: 14, lineHeight: 1.3 }}>{d.title}</h3>
                <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.8, marginBottom: 18, fontFamily: "'Sora',sans-serif", fontWeight: 300 }}>{d.desc}</p>
                <div style={{ fontSize: 12, marginBottom: 6 }}><span style={{ fontWeight: 700, color: "#374151", fontFamily: "'Sora',sans-serif" }}>Encadrement : </span><span style={{ color: "#64748B", fontFamily: "'Sora',sans-serif" }}>{d.encadrement}</span></div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, margin: "16px 0 20px" }}>
                  {d.tags.map((t) => <span key={t} style={{ fontSize: 11, fontWeight: 600, color: d.accentColor, background: d.lightBg, padding: "4px 12px", borderRadius: 6, fontFamily: "'Sora',sans-serif" }}>{t}</span>)}
                </div>
                <a href={d.link} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: d.accentColor, textDecoration: "none", fontFamily: "'Sora',sans-serif" }}>
                  En savoir plus
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </a>
              </div>
            ))}
          </div>

          {/* Débouchés */}
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: "1.75rem 2rem" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14, fontFamily: "'Sora',sans-serif" }}>Débouchés professionnels</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {debouches.map((d) => <span key={d.id} style={{ fontSize: 13, color: "#374151", background: "#F1F5F9", border: "1px solid #E2E8F0", padding: "6px 16px", borderRadius: 8, fontFamily: "'Sora',sans-serif", fontWeight: 500 }}>{d.name}</span>)}
            </div>
          </div>
        </div>
      </section>

      {/* ══ ADMISSION ══ */}
<section id="admission" style={{ padding: "6rem 3rem", background: "#fff" }}>
  <div style={{ maxWidth: 1100, margin: "0 auto" }}>
    <div style={{ textAlign: "center", marginBottom: "4rem" }}>
      <div style={{ fontSize: 11, color: "#1D4ED8", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 14, fontFamily: "'Sora',sans-serif", fontWeight: 700 }}>INSCRIPTION</div>
      <h2 className="lora" style={{ fontSize: 42, fontWeight: 700, color: "#0F172A" }}>Admission &amp; conditions</h2>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
      {admission.map((s, i) => (
        <div key={s.n} style={{ background: "#F8FAFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: "2rem 1.5rem", position: "relative", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, background: "#DBEAFE", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            {s.icon}
          </div>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#1D4ED8", letterSpacing: "0.15em", marginBottom: 10, fontFamily: "'Sora',sans-serif" }}>ÉTAPE {s.n}</div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 10, fontFamily: "'Sora',sans-serif" }}>{s.title}</h3>
          <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.7, fontFamily: "'Sora',sans-serif", fontWeight: 300 }}>{s.desc}</p>
          {i < admission.length - 1 && (
            <div style={{ position: "absolute", right: -10, top: "42%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "#1D4ED8", color: "#fff", borderRadius: "50%", fontSize: 10, zIndex: 2, fontWeight: 700 }}>›</div>
          )}
        </div>
      ))}
    </div>
  </div>
</section>

      {/* ══ DIRECTION ══ */}
      <section id="direction" style={{ padding: "6rem 3rem", background: "#F8FAFF" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div style={{ fontSize: 11, color: "#1D4ED8", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 14, fontFamily: "'Sora',sans-serif", fontWeight: 700 }}>ÉQUIPE DIRIGEANTE</div>
            <h2 className="lora" style={{ fontSize: 42, fontWeight: 700, color: "#0F172A" }}>La Direction</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 40 }}>
            {direction.map((p, i) => {
              const initials = p.name.split(" ").filter(w => w.length > 2).slice(0,2).map(w => w[0]).join("");
              const gradients = [
                "linear-gradient(135deg,#1D4ED8,#3B82F6)",
                "linear-gradient(135deg,#0369A1,#0EA5E9)",
                "linear-gradient(135deg,#1E40AF,#6366F1)",
                "linear-gradient(135deg,#0284C7,#38BDF8)",
              ];
              return (
                <div key={p.name} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: "1.75rem", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                  <div style={{ width: 58, height: 58, borderRadius: "50%", background: gradients[i], display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "'Lora',serif" }}>{initials}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 6, fontFamily: "'Sora',sans-serif", lineHeight: 1.3 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "#64748B", fontFamily: "'Sora',sans-serif", lineHeight: 1.4, marginBottom: p.since ? 10 : 0 }}>{p.role}</div>
                  {p.since && <div style={{ fontSize: 10, color: "#1D4ED8", background: "#DBEAFE", display: "inline-block", padding: "3px 10px", borderRadius: 100, fontFamily: "'Sora',sans-serif", fontWeight: 700 }}>{p.since}</div>}
                </div>
              );
            })}
          </div>

          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: "1.75rem 2rem" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16, fontFamily: "'Sora',sans-serif" }}>Historique des Directeurs Généraux</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {historique.map((h) => (
                <div key={h.n} className="hist-row" style={{ display: "flex", alignItems: "center", gap: 20, padding: "10px 14px", borderRadius: 8, transition: "background 0.2s", cursor: "default" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8", width: 120, flexShrink: 0, fontFamily: "'Sora',sans-serif" }}>{h.p}</span>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#CBD5E1", flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: "#475569", fontFamily: "'Sora',sans-serif" }}>{h.n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ CONTACT ══ */}
      <section id="contact" style={{ padding: "6rem 3rem", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div style={{ fontSize: 11, color: "#1D4ED8", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 14, fontFamily: "'Sora',sans-serif", fontWeight: 700 }}>CONTACT</div>
            <h2 className="lora" style={{ fontSize: 42, fontWeight: 700, color: "#0F172A" }}>Nous contacter</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
  {[
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      ),
      title: "Adresse", lines: ["Dixinn, Conakry 33139", "Guinée"], color: "#1D4ED8"
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 4.9 2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17.4z"/>
        </svg>
      ),
      title: "Téléphone", lines: ["+224 624 08 45 01", "+224 657 99 43 57"], color: "#0369A1"
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      ),
      title: "Email", lines: ["direction@ci.edu.gn"], color: "#1E40AF"
    },
  ].map((c) => (
    <div key={c.title} style={{ background: "#F8FAFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: "2rem", borderTop: `4px solid ${c.color}`, textAlign: "center" }}>
      <div style={{
        width: 52, height: 52,
        background: `${c.color}15`,
        borderRadius: 12,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 16px",
        color: c.color,
      }}>
        {c.icon}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: c.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, fontFamily: "'Sora',sans-serif" }}>{c.title}</div>
      {c.lines.map((l) => <div key={l} style={{ fontSize: 14, color: "#475569", marginBottom: 4, fontFamily: "'Sora',sans-serif" }}>{l}</div>)}
    </div>
  ))}
</div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ background: "#0F172A", padding: "2.5rem 3rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={LOGO_B64} alt="Logo CI" style={{ height: 36, borderRadius: 4, opacity: 0.9 }} />
          <span style={{ fontSize: 12, color: "#64748B", fontFamily: "'Sora',sans-serif" }}>
            © {new Date().getFullYear()} Centre Informatique — UGANC Conakry
          </span>
        </div>
        <a href="/auth/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#1D4ED8", color: "#fff", padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: "'Sora',sans-serif", boxShadow: "0 4px 14px rgba(29,78,216,0.4)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          Plateforme de notes
        </a>
      </footer>

    </div>
  );
}
