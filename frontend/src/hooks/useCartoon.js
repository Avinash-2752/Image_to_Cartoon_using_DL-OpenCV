/**
 * useCartoon.js
 * =============
 * Central state and API logic for the cartoon conversion flow.
 *
 * Returns
 * -------
 * original        – { file, previewUrl } or null
 * opencvResult    – URL string of the OpenCV output image, or null
 * aiResult        – URL string of the AI output image, or null
 * loadingOpencv   – boolean
 * loadingAi       – boolean
 * error           – string or null
 * selectImage()   – call with a File object
 * convertOpencv() – trigger OpenCV conversion
 * convertAi()     – trigger AI conversion
 * reset()         – clear all state
 */

import { useState, useCallback } from 'react'
import axios from 'axios'

const API_BASE = '/api'

// Max file size in bytes (10 MB) — mirrors backend limit
const MAX_BYTES = 10 * 1024 * 1024

// Accepted MIME types
const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/bmp',
])

export function useCartoon() {
  const [original, setOriginal]         = useState(null)
  const [opencvResult, setOpencvResult] = useState(null)
  const [aiResult, setAiResult]         = useState(null)
  const [loadingOpencv, setLoadingOpencv] = useState(false)
  const [loadingAi, setLoadingAi]       = useState(false)
  const [error, setError]               = useState(null)

  // ── Select / validate image ─────────────────────────────────────────────
  const selectImage = useCallback((file) => {
    if (!file) return

    if (!ALLOWED_TYPES.has(file.type)) {
      setError('Unsupported format. Please upload PNG, JPG, WEBP or BMP.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`)
      return
    }

    // Revoke previous object URL to free memory
    if (original?.previewUrl) {
      URL.revokeObjectURL(original.previewUrl)
    }

    setOriginal({ file, previewUrl: URL.createObjectURL(file) })
    setOpencvResult(null)
    setAiResult(null)
    setError(null)
  }, [original])

  // ── OpenCV conversion ───────────────────────────────────────────────────
  const convertOpencv = useCallback(async () => {
    if (!original?.file) return
    setLoadingOpencv(true)
    setError(null)

    try {
      const form = new FormData()
      form.append('image', original.file)

      const { data } = await axios.post(`${API_BASE}/cartoon/opencv`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60_000, // 60 s
      })
      // Add cache-busting timestamp so the browser always re-fetches
      setOpencvResult(`${data.output_url}?t=${Date.now()}`)
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        (err.code === 'ECONNABORTED' ? 'Request timed out. Try a smaller image.' : 'OpenCV conversion failed.')
      setError(msg)
    } finally {
      setLoadingOpencv(false)
    }
  }, [original])

  // ── AI conversion ───────────────────────────────────────────────────────
  const convertAi = useCallback(async () => {
    if (!original?.file) return
    setLoadingAi(true)
    setError(null)

    try {
      const form = new FormData()
      form.append('image', original.file)

      const { data } = await axios.post(`${API_BASE}/cartoon/ai`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120_000, // 2 min (model download + inference on first run)
      })
      setAiResult(`${data.output_url}?t=${Date.now()}`)
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        (err.code === 'ECONNABORTED' ? 'Request timed out. The AI model may still be downloading — try again in 30 s.' : 'AI conversion failed.')
      setError(msg)
    } finally {
      setLoadingAi(false)
    }
  }, [original])

  // ── Reset all state ─────────────────────────────────────────────────────
  const reset = useCallback(() => {
    if (original?.previewUrl) {
      URL.revokeObjectURL(original.previewUrl)
    }
    setOriginal(null)
    setOpencvResult(null)
    setAiResult(null)
    setError(null)
  }, [original])

  return {
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
  }
}
