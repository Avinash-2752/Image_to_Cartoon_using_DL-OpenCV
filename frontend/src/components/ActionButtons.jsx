/**
 * ActionButtons.jsx
 * =================
 * Two conversion buttons — OpenCV and AI — with loading states.
 *
 * Props
 * -----
 * onOpencv      – handler for the OpenCV button
 * onAi          – handler for the AI button
 * loadingOpencv – boolean
 * loadingAi     – boolean
 * disabled      – boolean (no image selected)
 */

import LoadingSpinner from './LoadingSpinner'

export default function ActionButtons({
  onOpencv,
  onAi,
  loadingOpencv,
  loadingAi,
  disabled,
}) {
  const busy = loadingOpencv || loadingAi

  return (
    <div className="flex flex-col sm:flex-row gap-4">

      {/* ── OpenCV button ─────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onOpencv}
        disabled={disabled || busy}
        aria-label="Convert using OpenCV"
        className={[
          'flex-1 btn-acid min-h-[64px]',
          'bg-[#E8FF3A] text-[#0D0D0D]',
          'hover:bg-[#f3ff6b] hover:shadow-[0_0_24px_rgba(232,255,58,0.35)]',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none',
        ].join(' ')}
      >
        {loadingOpencv
          ? <LoadingSpinner label="OpenCV running…" />
          : (
            <span className="flex items-center justify-center gap-2.5">
              <span className="text-xl">⚡</span>
              <span>Convert with OpenCV</span>
            </span>
          )
        }
      </button>

      {/* ── AI button ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onAi}
        disabled={disabled || busy}
        aria-label="Convert using AI"
        className={[
          'flex-1 btn-acid min-h-[64px]',
          'bg-transparent border-2 border-[#39FF6A] text-[#39FF6A]',
          'hover:bg-[#39FF6A]/10 hover:shadow-[0_0_24px_rgba(57,255,106,0.25)]',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none',
        ].join(' ')}
      >
        {loadingAi
          ? <LoadingSpinner label="AI processing…" />
          : (
            <span className="flex items-center justify-center gap-2.5">
              <span className="text-xl">🤖</span>
              <span>Convert with AI</span>
            </span>
          )
        }
      </button>
    </div>
  )
}
