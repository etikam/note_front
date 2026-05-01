const DEFAULT_IMAGE = '/images/auth_image.png'

export function AuthLayout({ imageSrc = DEFAULT_IMAGE, imageAlt = 'Gestion CI', children }) {
  return (
    <section className="min-h-screen flex">
      {/* Panneau visuel gauche */}
      <aside className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative overflow-hidden flex-col items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950" />
        <img
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity"
          src={imageSrc}
          alt={imageAlt}
        />
        {/* Décoration */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950/60 to-transparent" />
        <div className="relative z-10 px-12 text-center text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
            <span className="text-2xl font-bold tracking-tight">CI</span>
          </div>
          <h2 className="text-3xl font-bold mb-3 tracking-tight">Gestion CI</h2>
          <p className="text-brand-200 text-base leading-relaxed max-w-xs mx-auto">
            Plateforme de gestion académique — étudiants, notes et workflow de validation.
          </p>
        </div>
      </aside>

      {/* Panneau formulaire droit */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-12 bg-zinc-50 dark:bg-[var(--app-canvas)] text-zinc-900 dark:text-zinc-100">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-600 text-white dark:bg-brand-500 dark:text-white text-sm font-bold">
              CI
            </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">Gestion CI</span>
          </div>
          {children}
        </div>
      </div>
    </section>
  )
}
