# Espace étudiant (frontend)

## Routes

| Route | Page | API |
|-------|------|-----|
| `/student/dashboard` | KPI + raccourcis | `GET /students/me/stats/`, `GET /students/me/` |
| `/student/courses` | Liste cours | `GET /students/me/courses/` |
| `/student/courses/:courseId` | Détail (onglets) | `GET /academics/courses/:id/`, `GET .../archives/` |
| `/student/grades` | Notes publiées | `GET /students/me/grades/` |
| `/student/enrollments` | Demandes | `GET/POST /students/me/enrollments/` |
| `/profile` | Profil (menu avatar) | `GET/PATCH /students/profile/` + préférences, photo via `/auth/me/photo/` |
| `/student/promotion` | Chef de promo | `GET /students/me/cohort/` (si `can_manage_promotion`) |

## Navigation

- Sidebar + barre basse mobile (`md:hidden`) : Accueil, Cours, Notes, Inscriptions, Profil (+ Ma promotion si capability).
- Pas de sélecteur d’année académique : année courante affichée depuis `/students/me/` sur le dashboard.

## Isolation

- Gardes `StudentRoute` / `TeacherRoute` : un étudiant ne peut pas ouvrir `/teacher/*`.
- Aucun `student_id` passé côté client pour l’espace perso.

## Composants partagés

`features/student/ui/` : en-têtes, KPI, cartes cours/notes, filtres scroll-x, états vides.
