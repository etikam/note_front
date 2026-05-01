export function TeacherDashboardPage() {
  return (
    <section className="stack-lg">
      <header>
        <h1>Dashboard enseignant</h1>
        <p className="text-muted">Vue operationnelle: cours, notes en brouillon, soumissions et validations.</p>
      </header>

      <div className="kpi-grid">
        <article className="card">
          <p className="kpi-label">Cours assignes</p>
          <p className="kpi-value">--</p>
        </article>
        <article className="card">
          <p className="kpi-label">Notes en brouillon</p>
          <p className="kpi-value">--</p>
        </article>
        <article className="card">
          <p className="kpi-label">En attente validation</p>
          <p className="kpi-value">--</p>
        </article>
        <article className="card">
          <p className="kpi-label">Publiees</p>
          <p className="kpi-value">--</p>
        </article>
      </div>

      <article className="card">
        <h2>Backlog prioritaire</h2>
        <ul className="list">
          <li>Terminer la saisie des notes du semestre en cours.</li>
          <li>Soumettre les cours complets au workflow.</li>
          <li>Verifier les retours de validation.</li>
        </ul>
      </article>
    </section>
  )
}
