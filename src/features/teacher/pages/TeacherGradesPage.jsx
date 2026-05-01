export function TeacherGradesPage() {
  return (
    <section className="stack-lg">
      <header>
        <h1>Notation</h1>
        <p className="text-muted">
          La saisie par cours se fait depuis la fiche cours (onglet «&nbsp;Notation&nbsp;»). Cette page pourra
          regrouper une vue transversale par année ou par département.
        </p>
      </header>

      <article className="card">
        <h2>Vue agrégée (à venir)</h2>
        <p>
          Les notes sont stockées sur le modèle <code>Grade</code> (quatre contrôles sur /10, moyenne calculée,
          publication distincte du circuit de validation).
        </p>
      </article>
    </section>
  )
}
