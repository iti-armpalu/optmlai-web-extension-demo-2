'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Check, X, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

interface AreaSelectorProps {
  onCapture: (dataUrl: string) => void
  onCancel: () => void
}

type Phase = 'idle' | 'drawing' | 'confirming' | 'capturing' | 'error'

type Handle =
  | 'nw' | 'n' | 'ne'
  | 'e' | 'se' | 's'
  | 'sw' | 'w' | 'move'

const HANDLE_CURSORS: Record<Handle, string> = {
  nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
  e: 'e-resize', se: 'se-resize', s: 's-resize',
  sw: 'sw-resize', w: 'w-resize', move: 'move',
}

const MIN_SIZE = 20

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val))
}

function normaliseRect(x1: number, y1: number, x2: number, y2: number): Rect {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  }
}

// 8 handles + move — position as % of rect
const HANDLES: { id: Handle; x: number; y: number }[] = [
  { id: 'nw', x: 0,   y: 0   },
  { id: 'n',  x: 0.5, y: 0   },
  { id: 'ne', x: 1,   y: 0   },
  { id: 'e',  x: 1,   y: 0.5 },
  { id: 'se', x: 1,   y: 1   },
  { id: 's',  x: 0.5, y: 1   },
  { id: 'sw', x: 0,   y: 1   },
  { id: 'w',  x: 0,   y: 0.5 },
]

export function AreaSelector({ onCapture, onCancel }: AreaSelectorProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const startPos = useRef<{ x: number; y: number } | null>(null)
  const dragState = useRef<{
    handle: Handle
    startMouse: { x: number; y: number }
    startRect: Rect
    shiftKey: boolean
  } | null>(null)

  const [phase, setPhase] = useState<Phase>('idle')
  const [rect, setRect] = useState<Rect | null>(null)
  const [activeHandle, setActiveHandle] = useState<Handle | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1920
  const vh = typeof window !== 'undefined' ? window.innerHeight : 1080

  // ── Keyboard ──
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter' && phase === 'confirming') handleConfirm()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel, phase, rect])

  // ── Global mouse move + up for drag/resize ──
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragState.current || !rect) return
      const { handle, startMouse, startRect, shiftKey } = dragState.current
      const dx = e.clientX - startMouse.x
      const dy = e.clientY - startMouse.y

      let { x, y, width, height } = startRect

      if (handle === 'move') {
        x = clamp(startRect.x + dx, 0, vw - width)
        y = clamp(startRect.y + dy, 0, vh - height)
      } else {
        // Apply delta to edges based on handle
        let left = startRect.x
        let top = startRect.y
        let right = startRect.x + startRect.width
        let bottom = startRect.y + startRect.height

        if (handle.includes('w')) left = clamp(startRect.x + dx, 0, right - MIN_SIZE)
        if (handle.includes('e')) right = clamp(startRect.x + startRect.width + dx, left + MIN_SIZE, vw)
        if (handle.includes('n')) top = clamp(startRect.y + dy, 0, bottom - MIN_SIZE)
        if (handle.includes('s')) bottom = clamp(startRect.y + startRect.height + dy, top + MIN_SIZE, vh)

        // Shift — maintain aspect ratio on corner handles
        if (shiftKey && ['nw','ne','se','sw'].includes(handle)) {
          const ar = startRect.width / startRect.height
          const newW = right - left
          const newH = bottom - top
          if (Math.abs(newW / newH - ar) > 0.01) {
            const adjH = newW / ar
            if (handle === 'nw' || handle === 'sw') {
              if (handle === 'nw') top = bottom - adjH
              else bottom = top + adjH
            } else {
              if (handle === 'ne') top = bottom - adjH
              else bottom = top + adjH
            }
          }
        }

        x = left; y = top; width = right - left; height = bottom - top
      }

      setRect({ x, y, width, height })
    }

    function onMouseUp() {
      dragState.current = null
      setActiveHandle(null)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [rect, vw, vh])

  // ── Draw new selection ──
  const onOverlayMouseDown = useCallback((e: React.MouseEvent) => {
    if (phase === 'capturing') return
    if (phase === 'confirming') {
      // Click outside selection resets
      setPhase('idle')
      setRect(null)
      return
    }
    if (e.button !== 0) return
    e.preventDefault()
    startPos.current = { x: e.clientX, y: e.clientY }
    setPhase('drawing')
    setRect({ x: e.clientX, y: e.clientY, width: 0, height: 0 })
  }, [phase])

  const onOverlayMouseMove = useCallback((e: React.MouseEvent) => {
    if (phase !== 'drawing' || !startPos.current) return
    setRect(normaliseRect(startPos.current.x, startPos.current.y, e.clientX, e.clientY))
  }, [phase])

  const onOverlayMouseUp = useCallback((e: React.MouseEvent) => {
    if (phase !== 'drawing' || !startPos.current) return
    const r = normaliseRect(startPos.current.x, startPos.current.y, e.clientX, e.clientY)
    startPos.current = null
    if (r.width < MIN_SIZE || r.height < MIN_SIZE) {
      setPhase('idle')
      setRect(null)
      return
    }
    setRect(r)
    setPhase('confirming')
  }, [phase])

  // ── Handle drag start ──
  function startHandleDrag(e: React.MouseEvent, handle: Handle) {
    e.stopPropagation()
    e.preventDefault()
    if (!rect) return
    dragState.current = {
      handle,
      startMouse: { x: e.clientX, y: e.clientY },
      startRect: { ...rect },
      shiftKey: e.shiftKey,
    }
    setActiveHandle(handle)
  }

  // ── Capture ──
  async function handleConfirm() {
    if (!rect) return
    setPhase('capturing')

    try {
      const { toPng } = await import('html-to-image')
      if (overlayRef.current) overlayRef.current.style.display = 'none'
      await new Promise(r => setTimeout(r, 60))

      let dataUrl = ''
      try {
        const fullDataUrl = await toPng(document.body, {
          pixelRatio: window.devicePixelRatio ?? 1,
          skipFonts: true,
          fetchRequestInit: { cache: 'only-if-cached', mode: 'same-origin' },
          filter: (node) => {
            if (node instanceof HTMLElement) {
              if (node.tagName === 'SCRIPT') return false
              if (node.dataset?.optmOverlay) return false
            }
            return true
          },
        })

        const dpr = window.devicePixelRatio ?? 1
        const img = new Image()
        await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = fullDataUrl })
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(rect.width * dpr)
        canvas.height = Math.round(rect.height * dpr)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(
          img,
          Math.round((rect.x + window.scrollX) * dpr),
          Math.round((rect.y + window.scrollY) * dpr),
          Math.round(rect.width * dpr),
          Math.round(rect.height * dpr),
          0, 0, canvas.width, canvas.height,
        )
        dataUrl = canvas.toDataURL('image/png')
      } finally {
        if (overlayRef.current) overlayRef.current.style.display = ''
      }

      onCapture(dataUrl)
    } catch (err) {
      if (overlayRef.current) overlayRef.current.style.display = ''
      console.warn('[Optml] Capture failed:', err)
      setErrorMsg('Capture failed. The page may contain content that cannot be captured.')
      setPhase('error')
    }
  }

  // ── Cursor ──
  const cursor = activeHandle
    ? HANDLE_CURSORS[activeHandle]
    : phase === 'confirming' ? 'default'
    : phase === 'capturing' ? 'wait'
    : 'crosshair'

  // ── Toolbar position ──
  const toolbarTop = rect ? Math.min(rect.y + rect.height + 10, vh - 56) : 0
  const toolbarLeft = rect ? clamp(rect.x, 8, vw - 200) : 0

  return (
    <div
      ref={overlayRef}
      data-optml-overlay="true"
      className="fixed inset-0 z-[9999]"
      style={{ cursor }}
      onMouseDown={onOverlayMouseDown}
      onMouseMove={onOverlayMouseMove}
      onMouseUp={onOverlayMouseUp}
    >
      {/* ── Dim + cutout ── */}
      {rect && rect.width > 0 && rect.height > 0 ? (
        <>
          <div className="absolute inset-x-0 top-0 bg-black/50" style={{ height: rect.y }} />
          <div className="absolute inset-x-0 bg-black/50" style={{ top: rect.y + rect.height, bottom: 0 }} />
          <div className="absolute bg-black/50" style={{ top: rect.y, width: rect.x, height: rect.height }} />
          <div className="absolute bg-black/50" style={{ top: rect.y, left: rect.x + rect.width, right: 0, height: rect.height }} />

          {/* Selection border — macOS screenshot style */}
          <div
            className="absolute"
            style={{
              left: rect.x, top: rect.y, width: rect.width, height: rect.height,
              border: '1px solid rgba(255,255,255,0.35)',
            }}
            onMouseDown={(e) => { e.stopPropagation(); startHandleDrag(e, 'move') }}
          >
            {/* Dimensions badge */}
            <div
              className="absolute -top-7 left-0 text-white text-[11px] font-medium px-2 py-0.5 rounded-md pointer-events-none"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', letterSpacing: '0.01em' }}
            >
              {Math.round(rect.width)} × {Math.round(rect.height)}
            </div>

            {/* 8 handles — small grey dots, macOS style */}
            {HANDLES.map(({ id, x, y }) => (
              <div
                key={id}
                style={{
                  position: 'absolute',
                  left: `${x * 100}%`,
                  top: `${y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: HANDLE_CURSORS[id],
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'rgba(180,180,180,0.9)',
                  zIndex: 10,
                }}
                onMouseDown={(e) => startHandleDrag(e, id)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="absolute inset-0 bg-black/40" />
      )}

      {/* ── Idle hint ── */}
      {phase === 'idle' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-neutral-900/90 text-white text-sm px-4 py-2.5 rounded-full shadow-lg backdrop-blur-sm">
            Click and drag to select an area · Esc to cancel
          </div>
        </div>
      )}

      {/* ── Confirm toolbar ── */}
      {phase === 'confirming' && rect && (
        <div
          className="absolute flex items-center gap-1.5 bg-neutral-900 rounded-lg p-1 shadow-xl"
          style={{ top: toolbarTop, left: toolbarLeft }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            className="h-7 px-3 text-xs bg-white text-neutral-900 hover:bg-neutral-100 gap-1.5"
            onClick={handleConfirm}
          >
            <Check className="w-3.5 h-3.5" />
            Capture this area
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-white hover:bg-white/10"
            onClick={(e) => { e.stopPropagation(); setPhase('idle'); setRect(null) }}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
          <span className="text-[10px] text-neutral-400 font-mono px-1 pointer-events-none">
            Enter ↵
          </span>
        </div>
      )}

      {/* ── Capturing spinner ── */}
      {phase === 'capturing' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-neutral-900/90 text-white text-sm px-5 py-3 rounded-full shadow-lg flex items-center gap-2.5">
            <Loader2 className="w-4 h-4 animate-spin" />
            Capturing…
          </div>
        </div>
      )}

      {/* ── Error state ── */}
      {phase === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-neutral-900 text-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4 space-y-4 text-center">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">Capture failed</p>
              <p className="text-xs text-neutral-400 leading-relaxed">{errorMsg}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="flex-1 h-8 text-xs text-white hover:bg-white/10"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 h-8 text-xs bg-white text-neutral-900 hover:bg-neutral-100 gap-1.5"
                onClick={() => { setPhase('confirming'); setErrorMsg('') }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}