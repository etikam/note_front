/**
 * Effets de défilement de la landing (chargé en lazy).
 * Lenis (smooth scroll) + GSAP ScrollTrigger (pin, scrub, reveal, parallaxe) + scène Three.js dans le hero.
 *
 * Dégradé propre : sous prefers-reduced-motion ou sur mobile, on retombe sur un simple
 * reveal par IntersectionObserver (aucune lib lourde, aucun pin). Tout est réversible (cleanup).
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import * as THREE from 'three'

gsap.registerPlugin(ScrollTrigger)

/* ───────────────────────── scène Three.js (hero) — circuit numérique ───────────────────────── */
function buildCircuitLayer(cols, rows, step, traceColor, nodeColor, lineOpacity, nodeOpacity) {
  const layer = new THREE.Group()
  const px = (i) => (i - cols / 2) * step
  const py = (j) => (j - rows / 2) * step
  const verts = []
  const nodes = []
  const traceCount = Math.round(cols * 1.2)
  for (let t = 0; t < traceCount; t++) {
    let x = Math.floor(Math.random() * cols)
    let y = Math.floor(Math.random() * rows)
    let dir = Math.random() < 0.5 ? [1, 0] : [0, 1]
    const steps = 3 + Math.floor(Math.random() * 7)
    nodes.push(px(x), py(y), 0)
    for (let s = 0; s < steps; s++) {
      const nx = x + dir[0]
      const ny = y + dir[1]
      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) {
        dir = [dir[1] * -1 || 1, dir[0]]
        continue
      }
      verts.push(px(x), py(y), 0, px(nx), py(ny), 0)
      x = nx
      y = ny
      if (Math.random() < 0.42) {
        dir = dir[0] !== 0 ? [0, Math.random() < 0.5 ? 1 : -1] : [Math.random() < 0.5 ? 1 : -1, 0]
      }
    }
    nodes.push(px(x), py(y), 0)
  }
  const lineGeo = new THREE.BufferGeometry()
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3))
  layer.add(new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: traceColor, transparent: true, opacity: lineOpacity })))
  const nodeGeo = new THREE.BufferGeometry()
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nodes), 3))
  const nodeMat = new THREE.PointsMaterial({ color: nodeColor, size: 0.11, transparent: true, opacity: nodeOpacity, sizeAttenuation: true })
  const pts = new THREE.Points(nodeGeo, nodeMat)
  layer.add(pts)
  layer.userData.nodeMat = nodeMat
  return layer
}

function createThreeScene(canvas, hero) {
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  } catch {
    return null
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100)
  camera.position.set(0, 0, 10)

  // Circuit : deux couches (profondeur/parallaxe), lignes fines translucides + nœuds lime.
  const circuit = new THREE.Group()
  scene.add(circuit)
  const back = buildCircuitLayer(24, 15, 0.72, 0x2c6b45, 0x7fae63, 0.28, 0.5)
  back.position.z = -3
  const front = buildCircuitLayer(22, 13, 0.78, 0x3f8a5c, 0xb7e017, 0.5, 0.9)
  circuit.add(back, front)
  circuit.rotation.x = -0.12

  let prog = 0
  let raf = 0
  const clock = new THREE.Clock()

  function size() {
    const w = hero.clientWidth || window.innerWidth
    const h = hero.clientHeight || window.innerHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / Math.max(1, h)
    camera.updateProjectionMatrix()
  }
  size()
  window.addEventListener('resize', size)

  function animate() {
    const t = clock.getElapsedTime()
    camera.position.z = 10 - prog * 4.8 // zoom : on plonge dans le circuit
    circuit.position.x = -prog * 1.6 // léger panoramique au défilement
    circuit.rotation.x = -0.12 + prog * 0.1
    back.position.y = Math.sin(t * 0.2) * 0.1
    front.userData.nodeMat.opacity = 0.65 + 0.3 * Math.sin(t * 1.6)
    renderer.render(scene, camera)
    raf = requestAnimationFrame(animate)
  }
  animate()

  return {
    setProgress(p) {
      prog = p
    },
    dispose() {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', size)
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose()
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose())
      })
      renderer.dispose()
    },
  }
}

/* ───────────────────────── init principal ───────────────────────── */
export function initLandingFx({ root, hero, stage, canvas }) {
  if (!root) return () => {}
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isMobile = window.matchMedia && window.matchMedia('(max-width: 820px)').matches

  // ---- Mode allégé : reveal simple, rien d'autre ----
  if (reduce || isMobile) {
    root.classList.add('anim')
    const io = new IntersectionObserver(
      (ents) => {
        for (const e of ents) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    root.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    return () => { io.disconnect(); root.classList.remove('anim') }
  }

  // ---- Mode complet ----
  root.classList.add('fx')
  const cleanups = []

  // Lenis smooth scroll, synchronisé avec ScrollTrigger via le ticker GSAP.
  const lenis = new Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 1 })
  const onLenis = () => ScrollTrigger.update()
  lenis.on('scroll', onLenis)
  const tick = (time) => lenis.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  cleanups.push(() => {
    gsap.ticker.remove(tick)
    lenis.off('scroll', onLenis)
    lenis.destroy()
  })

  // Scène 3D du hero.
  const scene3d = canvas && hero ? createThreeScene(canvas, hero) : null
  if (scene3d) cleanups.push(scene3d.dispose)

  // Tilt 3D du hero à la souris (hors scroll).
  const inner = stage ? stage.querySelector('.stage-inner') : null
  let onMove, onLeave
  if (inner && stage) {
    const rotY = gsap.quickTo(inner, 'rotationY', { duration: 0.6, ease: 'power3' })
    const rotX = gsap.quickTo(inner, 'rotationX', { duration: 0.6, ease: 'power3' })
    onMove = (e) => {
      const r = stage.getBoundingClientRect()
      rotY(((e.clientX - (r.left + r.width / 2)) / r.width) * 16)
      rotX((-(e.clientY - (r.top + r.height / 2)) / r.height) * 12)
    }
    onLeave = () => { rotY(0); rotX(0) }
    stage.addEventListener('mousemove', onMove)
    stage.addEventListener('mouseleave', onLeave)
    cleanups.push(() => {
      stage.removeEventListener('mousemove', onMove)
      stage.removeEventListener('mouseleave', onLeave)
    })
  }

  const ctx = gsap.context(() => {
    // 1) Reveal on scroll — titres, textes, images.
    gsap.utils.toArray('.reveal').forEach((el) => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 34 },
        { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 86%' } },
      )
    })

    // 2) Hero : PIN + SCRUB. Le hero reste figé pendant que la scène 3D avance/recule
    //    au rythme du défilement et que les couches (photos, formes) parallaxent.
    if (hero) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: '+=90%',
          pin: true,
          pinSpacing: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => { if (scene3d) scene3d.setProgress(self.progress) },
        },
      })
      tl.to('.p1', { yPercent: -16, ease: 'none' }, 0)
        .to('.p2', { yPercent: 12, ease: 'none' }, 0)
        .to('.p3', { yPercent: -28, ease: 'none' }, 0)
        .to('.hero-text', { y: -34, ease: 'none' }, 0)
        .to('.shape-b', { yPercent: 55, ease: 'none' }, 0)
    }

    // 3) Parallaxe additionnelle hors hero (couches à vitesses différentes).
    gsap.utils.toArray('[data-par]').forEach((el) => {
      if (hero && hero.contains(el)) return // le hero épinglé gère ses propres couches
      const sp = parseFloat(el.getAttribute('data-par')) || 0
      gsap.to(el, {
        y: () => sp * 480,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      })
    })
    gsap.utils.toArray('.about-media img').forEach((el, i) => {
      gsap.fromTo(
        el,
        { yPercent: -6 },
        {
          yPercent: 6 + i * 4,
          ease: 'none',
          scrollTrigger: { trigger: el.closest('.about'), start: 'top bottom', end: 'bottom top', scrub: true },
        },
      )
    })
  }, root)
  cleanups.push(() => ctx.revert())

  // Première mesure après montage.
  requestAnimationFrame(() => ScrollTrigger.refresh())

  return () => {
    for (const c of cleanups.reverse()) {
      try { c() } catch { /* noop */ }
    }
    root.classList.remove('fx')
  }
}
