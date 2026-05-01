import {
  File,
  FileArchive,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Presentation,
} from 'lucide-react'

import { cn } from '@/shared/lib/cn'

/**
 * Choisit une icône « fichier » Lucide selon le type MIME ou l’extension.
 * @param {{ content_type?: string; original_name?: string }} archive
 */
export function pickCourseArchiveIcon(archive) {
  const mime = String(archive?.content_type ?? '').toLowerCase()
  const name = String(archive?.original_name ?? '')
  const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : ''

  if (mime.startsWith('video/') || ['mp4', 'webm', 'mkv', 'mov', 'avi', 'm4v', 'ogv'].includes(ext)) {
    return FileVideo
  }
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'opus', 'wma'].includes(ext)) {
    return FileAudio
  }
  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'tif', 'tiff', 'heic'].includes(ext)) {
    return FileImage
  }
  if (
    ['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz'].includes(ext) ||
    mime.includes('zip') ||
    mime.includes('compressed') ||
    mime.includes('x-rar')
  ) {
    return FileArchive
  }
  if (['ppt', 'pptx', 'odp', 'key'].includes(ext) || mime.includes('presentation') || mime.includes('powerpoint')) {
    return Presentation
  }
  if (
    ['xls', 'xlsx', 'ods', 'csv', 'tsv'].includes(ext) ||
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    mime.includes('ms-excel')
  ) {
    return FileSpreadsheet
  }
  if (
    ['pdf', 'txt', 'doc', 'docx', 'odt', 'rtf', 'md', 'tex'].includes(ext) ||
    mime.includes('pdf') ||
    mime.includes('word') ||
    mime.includes('msword') ||
    mime.includes('opendocument.text')
  ) {
    return FileText
  }
  return File
}

const TONE_CLASS = {
  video: 'bg-violet-500/12 text-violet-700 dark:text-violet-300 ring-violet-500/20',
  audio: 'bg-amber-500/12 text-amber-800 dark:text-amber-200 ring-amber-500/20',
  image: 'bg-emerald-500/12 text-emerald-800 dark:text-emerald-200 ring-emerald-500/20',
  archive: 'bg-zinc-500/12 text-zinc-700 dark:text-zinc-300 ring-zinc-500/15',
  slides: 'bg-orange-500/12 text-orange-800 dark:text-orange-200 ring-orange-500/20',
  sheet: 'bg-green-600/12 text-green-900 dark:text-green-200 ring-green-600/20',
  doc: 'bg-brand-500/12 text-brand-800 dark:text-brand-200 ring-brand-500/20',
  default: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 ring-zinc-500/15',
}

function iconToneKey(Icon) {
  if (Icon === FileVideo) return 'video'
  if (Icon === FileAudio) return 'audio'
  if (Icon === FileImage) return 'image'
  if (Icon === FileArchive) return 'archive'
  if (Icon === Presentation) return 'slides'
  if (Icon === FileSpreadsheet) return 'sheet'
  if (Icon === FileText) return 'doc'
  return 'default'
}

/**
 * Pastille avec icône fichier pour une ligne d’archive.
 * @param {{ archive: { content_type?: string; original_name?: string }; className?: string; size?: number }} props
 */
export function CourseArchiveFileIcon({ archive, className, size = 18 }) {
  const Icon = pickCourseArchiveIcon(archive)
  const tone = TONE_CLASS[iconToneKey(Icon)] ?? TONE_CLASS.default
  return (
    <span
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1',
        tone,
        className,
      )}
      aria-hidden
    >
      <Icon size={size} strokeWidth={2} />
    </span>
  )
}
