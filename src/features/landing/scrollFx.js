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

/* ───────────────────────── scène Three.js (hero) — puce / processeur ───────────────────────── */
function createThreeScene(canvas, hero) {
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  } catch {
    return null
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.set(0, 0, 7)

  scene.add(new THREE.AmbientLight(0xffffff, 0.8))
  const key = new THREE.DirectionalLight(0xffffff, 1.15)
  key.position.set(4, 6, 6)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0xb7e017, 0.5)
  rim.position.set(-5, -2, 3)
  scene.add(rim)

  // Puce électronique : corps + die + pistes lime + nœud central + pattes.
  const chip = new THREE.Group()
  scene.add(chip)

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.26, 2.1),
    new THREE.MeshStandardMaterial({ color: 0x13311f, metalness: 0.3, roughness: 0.55 }),
  )
  chip.add(body)

  const die = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.12, 1.3),
    new THREE.MeshStandardMaterial({ color: 0x1c4a2e, metalness: 0.4, roughness: 0.4, emissive: 0x0c2a16, emissiveIntensity: 0.4 }),
  )
  die.position.y = 0.17
  chip.add(die)

  const traceMat = new THREE.MeshStandardMaterial({ color: 0xb7e017, emissive: 0xb7e017, emissiveIntensity: 0.6, metalness: 0.2, roughness: 0.4 })
  for (let i = -2; i <= 2; i++) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.02, 0.03), traceMat)
    h.position.set(0, 0.235, i * 0.24)
    chip.add(h)
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 1.08), traceMat)
    v.position.set(i * 0.24, 0.235, 0)
    chip.add(v)
  }
  const node = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.08, 0.36),
    new THREE.MeshStandardMaterial({ color: 0xc6f024, emissive: 0xb7e017, emissiveIntensity: 0.95 }),
  )
  node.position.y = 0.25
  chip.add(node)

  const pinMat = new THREE.MeshStandardMaterial({ color: 0xd6ddd6, metalness: 0.85, roughness: 0.35 })
  const pinGeo = new THREE.BoxGeometry(0.13, 0.06, 0.26)
  const edge = 2.1 / 2 + 0.14
  for (let i = 0; i < 7; i++) {
    const t = -0.78 + i * 0.26
    const mk = (x, z, ry) => {
      const m = new THREE.Mesh(pinGeo, pinMat)
      m.position.set(x, -0.02, z)
      m.rotation.y = ry
      chip.add(m)
    }
    mk(t, edge, 0)
    mk(t, -edge, 0)
    mk(edge, t, Math.PI / 2)
    mk(-edge, t, Math.PI / 2)
  }

  chip.position.set(0, 0.2, 0)
  chip.scale.setScalar(0.95)
  chip.rotation.x = -0.9

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
    chip.rotation.y = t * 0.22 + prog * 1.0
    chip.rotation.x = -0.9 + prog * 0.12 // reste vue de dessus
    camera.position.z = 7.2 - prog * 3.7 // zoom : la puce grossit au défilement
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
