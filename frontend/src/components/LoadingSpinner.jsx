/**
 * LoadingSpinner.jsx
 * ==================
 * Animated bouncing-dots loader displayed inside buttons while processing.
 */

export default function LoadingSpinner({ label = 'Processing…' }) {
  return (
    <span className="flex flex-col items-center gap-2 pointer-events-none">
      {/* Bouncing dots */}
      <span className="flex gap-1.5 items-center justify-center">
        <span className="w-2 h-2 rounded-full bg-current dot-0" />
        <span className="w-2 h-2 rounded-full bg-current dot-1" />
        <span className="w-2 h-2 rounded-full bg-current dot-2" />
      </span>

      {/* Label */}
      <span className="font-mono text-[11px] tracking-widest uppercase opacity-80">
        {label}
      </span>
    </span>
  )
}
