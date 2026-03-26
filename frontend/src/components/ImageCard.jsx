/**
 * ImageCard.jsx
 * =============
 * Displays a single processed image with title, badge and download button.
 *
 * Props
 * -----
 * title        – card heading (e.g. "Original")
 * src          – image URL / object URL
 * badge        – optional small label (e.g. "Classical", "Neural")
 * badgeColor   – "yellow" | "green" | "blue"  (default "yellow")
 * downloadName – if provided, shows a download link with this filename
 */

const BADGE_STYLES = {
  yellow: 'bg-[#E8FF3A]/15 text-[#E8FF3A] border-[#E8FF3A]/30',
  green : 'bg-[#39FF6A]/15 text-[#39FF6A] border-[#39FF6A]/30',
  blue  : 'bg-[#3AE8FF]/15 text-[#3AE8FF] border-[#3AE8FF]/30',
  pink  : 'bg-[#FF3A8C]/15 text-[#FF3A8C] border-[#FF3A8C]/30',
}

export default function ImageCard({
  title,
  src,
  badge,
  badgeColor = 'yellow',
  downloadName,
}) {
  return (
    <div className="flex flex-col gap-3 animate-slide-up">

      {/* ── Header row ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <h3 className="font-display text-xl tracking-[0.12em] uppercase text-white/90 leading-none">
          {title}
        </h3>
        {badge && (
          <span
            className={[
              'font-mono text-[9px] px-2 py-0.5 rounded-full border',
              'uppercase tracking-widest whitespace-nowrap',
              BADGE_STYLES[badgeColor] ?? BADGE_STYLES.yellow,
            ].join(' ')}
          >
            {badge}
          </span>
        )}
      </div>

      {/* ── Image container ────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-xl border border-white/10
                   bg-white/[0.04] group"
      >
        <img
          src={src}
          alt={title}
          loading="lazy"
          className="w-full object-contain max-h-[280px] transition-transform duration-300 group-hover:scale-[1.02]"
        />

        {/* Subtle gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-10
                        bg-gradient-to-t from-black/40 to-transparent
                        pointer-events-none" />
      </div>

      {/* ── Download button ────────────────────────────────────────── */}
      {downloadName && (
        <a
          href={src}
          download={downloadName}
          className="
            flex items-center justify-center gap-2 py-2.5 rounded-xl
            border border-white/15 hover:border-[#E8FF3A]/50
            text-sm font-body font-medium text-white/50 hover:text-[#E8FF3A]
            bg-white/[0.02] hover:bg-[#E8FF3A]/5
            transition-all duration-200 group/dl
          "
          onClick={(e) => e.stopPropagation()}
        >
          <svg
            className="w-3.5 h-3.5 transition-transform group-hover/dl:translate-y-0.5"
            fill="none" stroke="currentColor" strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4" />
          </svg>
          Download
        </a>
      )}
    </div>
  )
}
