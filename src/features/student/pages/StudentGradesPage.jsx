export function StudentGradesPage() {
  return (
    <section className="stack-lg">
      <header>
        <h1>Mes notes</h1>
        <p className="text-muted">
          Seules les notes dont l’enseignant a activé la publication (<code>published</code>) seront visibles ici
          une fois la consultation branchée sur l’API.
        </p>
      </header>

      <article className="card">
        <h2>Relevé (à venir)</h2>
        <p>Cette section affichera les cours notés, filtrés par année académique.</p>
      </article>
    </section>
  )
}
