import { Download } from 'lucide-react'

import { REQUIRED_COLUMNS } from '@/features/teacher/students/ui/import/import.constants'
import { CsvRequirementsDetails } from '@/features/teacher/students/ui/import/CsvRequirementsDetails'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Stack } from '@/shared/ui/Stack'

/**
 * @param {{ onDownload: () => void }} props
 */
export function TemplateSection({ onDownload }) {
  return (
    <Stack size="md">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Utilisez le modèle officiel pour garantir les bons intitulés de colonnes et éviter les rejets à l’import.
      </p>
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
          Colonnes obligatoires
        </p>
        <div className="flex flex-wrap gap-2">
          {REQUIRED_COLUMNS.map((name) => (
            <Badge key={name} tone="neutral" className="font-mono text-[11px]">
              {name}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="primary" onClick={onDownload}>
          <Download size={16} aria-hidden />
          Télécharger le modèle (.csv)
        </Button>
      </div>
      <CsvRequirementsDetails />
    </Stack>
  )
}
