/**
 * UploadZone.jsx
 * ==============
 * Drag-and-drop / click-to-browse image upload area.
 *
 * Props
 * -----
 * onFile(file)  – called with a validated File object
 * hasImage      – boolean; true when an image is already selected
 */

import { useRef, useState, useCallback } from 'react'

const ACCEPTED_MIME  = ['image/png', 'image/jpeg', 'image/webp', 'image/bmp']
const ACCEPTED_ATTR  = ACCEPTED_MIME.join(',')
const MAX_MB         = 10

function validate(file) {
  if (!file) return 'No file received.'
  if (!ACCEPTED_MIME.includes(file.type))
    return 'Unsupported format — please use PNG, JPG, WEBP or BMP.'
  if (file.size > MAX_MB * 1024 * 1024)
    return `File is ${(file.size / 1024 / 1024).toFixed(1)} MB — max is ${MAX_MB} MB.`
  return null
}

export default function UploadZone({ onFile, hasImage }) {
  const inputRef          = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [localErr, setLocalErr] = useState('')

  const handle = useCallback((file) => {
    const err = validate(file)
    if (err) { setLocalErr(err); return }
    setLocalErr('')
    onFile(file)
  }, [onFile])

  // ── Drag handlers ─────────────────────────────────────────────────────
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true)  }
  const onDragLeave = ()  => setDragging(false)
  const onDrop      = (e) => {
    e.preventDefault()
    setDragging(false)
    handle(e.dataTransfer.files[0])
  }
  const onInputChange = (e) => handle(e.target.files[0])

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload image"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      className={[
        'relative cursor-pointer select-none',
        'border-2 border-dashed rounded-2xl',
        'flex flex-col items-center justify-center gap-4 p-10',
        'transition-all duration-200',
        dragging
          ? 'border-[#E8FF3A] dropzone-glow bg-[#E8FF3A]/5'
          : 'border-white/20 hover:border-white/40 hover:bg-white/[0.02]',
        hasImage ? 'py-6 min-h-[100px]' : 'min-h-[220px]',
      ].join(' ')}
    >
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_ATTR}
        className="hidden"
        onChange={onInputChange}
      />

      {/* Icon */}
      <span className="text-5xl" aria-hidden="true">
        {dragging ? '📂' : hasImage ? '🔄' : '🖼️'}
      </span>

      {/* Text */}
      <div className="text-center space-y-1">
        <p className="font-body font-medium text-white/70 text-sm sm:text-base">
          {dragging
            ? 'Release to upload'
            : hasImage
            ? 'Drop a new image to replace'
            : 'Drop an image here or click to browse'}
        </p>
        <p className="font-mono text-xs text-white/35">
          PNG · JPG · WEBP · BMP &nbsp;·&nbsp; max {MAX_MB} MB
        </p>
      </div>

      {/* Validation error */}
      {localErr && (
        <p className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap
                      font-mono text-xs text-[#FF3A8C] bg-[#FF3A8C]/10
                      border border-[#FF3A8C]/30 rounded-full px-3 py-1">
          ⚠ {localErr}
        </p>
      )}
    </div>
  )
}
