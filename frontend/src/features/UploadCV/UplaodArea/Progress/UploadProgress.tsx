import React from 'react'
import type { UploadProgressProps, UploadProgressViewProps } from './UploadProgress.types'
import { UploadProgressView } from './UploadProgress.view'

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let val = bytes
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024
    i++
  }
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function formatEta(seconds: number | null | undefined): string {
  if (seconds == null) return '—'
  if (seconds < 1) return 'few sec'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export const UploadProgress: React.FC<UploadProgressProps & { onCancel: () => void }> = ({
  fileName,
  fileSizeBytes,
  percent,
  etaSeconds,
  onCancel,
}) => {
  const viewProps: UploadProgressViewProps = {
    fileName,
    sizeText: `${formatBytes(fileSizeBytes)}`,
    timeLeftText: `${formatEta(etaSeconds)} left`,
    percent,
    onCancel,
  }

  return <UploadProgressView {...viewProps} />
}

export default UploadProgress
