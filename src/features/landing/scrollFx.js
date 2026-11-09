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

/* ───────────────────────── scène Three.js (hero) ───────────────────────── */
function createThreeScene(canvas, hero) {
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  } catch {
    return null
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(0, 0, 6)

  const group = new THREE.Group()
  scene.add(group)

  const ico = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.6, 1),
    new THREE.MeshBasicMaterial({ color: 0x1c4a2e, wireframe: true, transparent: true, opacity: 0.42 }),
  )
  group.add(ico)

  const N = 520
  const pos = new Float32Array(N * 3)
  for (let i = 0; i < N; i++) {
    const r = 2.3 + Math.random() * 2.8
    const th = Math.random() * Math.PI * 2
    const ph = Math.acos(2 * Math.random() - 1)
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th)
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th)
    pos[i * 3 + 2] = r * Math.cos(ph)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const pts = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ color: 0xb7e017, size: 0.032, transparent: true, opacity: 0.85, sizeAttenuation: true }),
  )
  group.add(pts)

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
    group.rotation.y = t * 0.12 + prog * Math.PI * 1.3
    group.rotation.x = prog * 0.65
    camera.position.z = 6 - prog * 2.4
    ico.scale.setScalar(1 + prog * 0.55)
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
      ico.geometry.dispose()
      ico.material.dispose()
      geo.dispose()
      pts.material.dispose()
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
