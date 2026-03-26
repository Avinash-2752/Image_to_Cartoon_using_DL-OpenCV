/**
 * App.jsx
 * =======
 * Root component — composes the full single-page application.
 */

import { useCartoon } from './hooks/useCartoon'
import UploadZone    from './components/UploadZone'
import ImageCard     from './components/ImageCard'
import ActionButtons from './components/ActionButtons'

export default function App() {
  const {
    original,
    opencvResult,
    aiResult,
    loadingOpencv,
    loadingAi,
    error,
    selectImage,
    convertOpencv,
    convertAi,
    reset,
  } = useCartoon()

  const hasResults = opencvResult || aiResult
  const resultCount = [original, opencvResult, aiResult].filter(Boolean).length

  // Choose grid columns based on how many cards to show
  const gridCols =
    resultCount === 1 ? 'sm:grid-cols-1 max-w-sm' :
    resultCount === 2 ? 'sm:grid-cols-2 max-w-2xl' :
                        'sm:grid-cols-3 max-w-5xl'

  return (
    <div className="min-h-screen flex flex-col bg-[#0D0D0D]">

      {/* ── Decorative background grid ─────────────────────────────── */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="relative z-10 border-b border-white/[0.08] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">🎨</span>
          <div>
            <h1 className="font-display text-3xl tracking-[0.18em] uppercase leading-none">
              Cartoon<span className="text-[#E8FF3A]">AI</span>
            </h1>
            <p className="font-mono text-[10px] text-white/30 tracking-widest uppercase mt-0.5">
              Photo → Cartoon
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#39FF6A] animate-pulse" />
          <span className="font-mono text-xs text-white/30">
            OpenCV + Neural Style Transfer
          </span>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 w-full mx-auto px-4 sm:px-6 py-10
                       flex flex-col gap-8 max-w-5xl">

        {/* Hero section — only shown before image is selected */}
        {!original && (
          <section className="text-center space-y-4 pt-4 animate-fade-in">
            <h2 className="font-display text-6xl sm:text-8xl tracking-widest uppercase leading-none">
              Turn Photos<br />
              <span className="shimmer-text">Into Art</span>
            </h2>
            <p className="font-body text-white/45 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              Upload any photo and cartoon-ify it with classical computer vision
              or AI neural style transfer — all running locally, no cloud required.
            </p>

            {/* Method badges */}
            <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
              {[
                { icon: '⚡', label: 'OpenCV bilateral filter', color: '#E8FF3A' },
                { icon: '🤖', label: 'Fast neural style (ONNX)', color: '#39FF6A' },
              ].map(({ icon, label, color }) => (
                <span
                  key={label}
                  className="font-mono text-xs px-3 py-1.5 rounded-full border"
                  style={{ color, borderColor: `${color}40`, background: `${color}10` }}
                >
                  {icon} {label}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Upload zone */}
        <UploadZone onFile={selectImage} hasImage={!!original} />

        {/* Error banner */}
        {error && (
          <div className="animate-fade-in border border-[#FF3A8C]/40 bg-[#FF3A8C]/10
                          rounded-xl px-5 py-3 flex items-start gap-3">
            <span className="text-lg mt-0.5">⚠️</span>
            <div>
              <p className="font-mono text-sm text-[#FF3A8C]">{error}</p>
              <p className="font-body text-xs text-white/40 mt-1">
                Try a smaller image or a different format.
              </p>
            </div>
          </div>
        )}

        {/* Action buttons — only when image is loaded */}
        {original && (
          <ActionButtons
            onOpencv={convertOpencv}
            onAi={convertAi}
            loadingOpencv={loadingOpencv}
            loadingAi={loadingAi}
            disabled={!original}
          />
        )}

        {/* Processing hint */}
        {(loadingOpencv || loadingAi) && (
          <p className="text-center font-mono text-xs text-white/30 animate-pulse">
            {loadingAi && !opencvResult
              ? '🤖 First AI run may take 30–60 s while the model (~6 MB) downloads…'
              : '⚙️ Processing your image…'}
          </p>
        )}

        {/* Results grid */}
        {original && (
          <section
            className={`grid grid-cols-1 gap-6 mx-auto w-full ${gridCols}`}
          >
            {/* Original */}
            <ImageCard
              title="Original"
              src={original.previewUrl}
            />

            {/* OpenCV result */}
            {opencvResult && (
              <ImageCard
                title="OpenCV"
                badge="Classical CV"
                badgeColor="yellow"
                src={opencvResult}
                downloadName="cartoon_opencv.png"
              />
            )}

            {/* AI result */}
            {aiResult && (
              <ImageCard
                title="AI Style"
                badge="Neural Network"
                badgeColor="green"
                src={aiResult}
                downloadName="cartoon_ai.png"
              />
            )}
          </section>
        )}

        {/* How-it-works info strip — appears after at least one result */}
        {hasResults && (
          <div className="animate-fade-in border border-white/10 rounded-2xl p-5
                          grid sm:grid-cols-2 gap-6 bg-white/[0.02]">
            <div>
              <h4 className="font-display tracking-widest text-base text-[#E8FF3A] uppercase mb-1">
                ⚡ OpenCV method
              </h4>
              <p className="font-body text-sm text-white/50 leading-relaxed">
                Bilateral filter ×7 smooths colour regions while preserving hard edges.
                Adaptive thresholding builds an ink-line mask that's composited on top.
              </p>
            </div>
            <div>
              <h4 className="font-display tracking-widest text-base text-[#39FF6A] uppercase mb-1">
                🤖 AI method
              </h4>
              <p className="font-body text-sm text-white/50 leading-relaxed">
                Fast neural style transfer (Udnie ONNX model, ~6 MB) repaints your image
                in a painterly style. Colour quantisation + edge overlay sharpen the cartoon look.
              </p>
            </div>
          </div>
        )}

        {/* Reset link */}
        {original && (
          <div className="flex justify-center pb-4">
            <button
              onClick={reset}
              className="font-mono text-xs text-white/25 hover:text-white/50
                         transition-colors underline underline-offset-4"
            >
              ✕ Clear and start over
            </button>
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.08] px-6 py-4">
        <p className="font-mono text-[10px] text-white/20 text-center tracking-widest uppercase">
          CartoonAI &nbsp;·&nbsp; OpenCV 4 + Fast Neural Style Transfer (ONNX) &nbsp;·&nbsp;
          Flask + React + Tailwind CSS &nbsp;·&nbsp; CPU-only · No GPU required
        </p>
      </footer>
    </div>
  )
}
