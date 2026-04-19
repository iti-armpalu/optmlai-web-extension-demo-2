'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
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

type Phase = 'idle' | 'drawing' | 'confirming' | 'capturing'

export function AreaSelector({ onCapture, onCancel }: AreaSelectorProps) {
    const overlayRef = useRef<HTMLDivElement>(null)
    const startPos = useRef<{ x: number; y: number } | null>(null)
    const [phase, setPhase] = useState<Phase>('idle')
    const [rect, setRect] = useState<Rect | null>(null)

    function normaliseRect(x1: number, y1: number, x2: number, y2: number): Rect {
        return {
            x: Math.min(x1, x2),
            y: Math.min(y1, y2),
            width: Math.abs(x2 - x1),
            height: Math.abs(y2 - y1),
        }
    }

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return
        e.preventDefault()
        startPos.current = { x: e.clientX, y: e.clientY }
        setPhase('drawing')
        setRect({ x: e.clientX, y: e.clientY, width: 0, height: 0 })
    }, [])

    const onMouseMove = useCallback((e: React.MouseEvent) => {
        if (phase !== 'drawing' || !startPos.current) return
        setRect(normaliseRect(startPos.current.x, startPos.current.y, e.clientX, e.clientY))
    }, [phase])

    const onMouseUp = useCallback((e: React.MouseEvent) => {
        if (phase !== 'drawing' || !startPos.current) return
        const r = normaliseRect(startPos.current.x, startPos.current.y, e.clientX, e.clientY)
        if (r.width < 10 || r.height < 10) {
            setPhase('idle')
            setRect(null)
            startPos.current = null
            return
        }
        setRect(r)
        setPhase('confirming')
        startPos.current = null
    }, [phase])

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onCancel()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onCancel])

    async function handleConfirm() {
        if (!rect) return
        setPhase('capturing')

        try {
            const { toPng } = await import('html-to-image')

            if (overlayRef.current) overlayRef.current.style.display = 'none'
            await new Promise(r => setTimeout(r, 60))

            let dataUrl = ''
            try {
                // Capture the full page then crop via canvas
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

                // Crop to the selected rect using a canvas
                const dpr = window.devicePixelRatio ?? 1
                const img = new Image()
                await new Promise<void>((res, rej) => {
                    img.onload = () => res()
                    img.onerror = rej
                    img.src = fullDataUrl
                })
                const cropCanvas = document.createElement('canvas')
                cropCanvas.width = Math.round(rect.width * dpr)
                cropCanvas.height = Math.round(rect.height * dpr)
                const cropCtx = cropCanvas.getContext('2d')!
                cropCtx.drawImage(
                    img,
                    Math.round((rect.x + window.scrollX) * dpr),
                    Math.round((rect.y + window.scrollY) * dpr),
                    Math.round(rect.width * dpr),
                    Math.round(rect.height * dpr),
                    0, 0,
                    cropCanvas.width,
                    cropCanvas.height,
                )
                dataUrl = cropCanvas.toDataURL('image/png')
            } finally {
                if (overlayRef.current) overlayRef.current.style.display = ''
            }

            onCapture(dataUrl)
            return
        } catch (err) {
            console.warn('[Optml] html-to-image capture failed:', err)
            if (overlayRef.current) overlayRef.current.style.display = ''
        }

        // Fallback — canvas placeholder
        const fb = document.createElement('canvas')
        fb.width = Math.round(rect.width)
        fb.height = Math.round(rect.height)
        const ctx = fb.getContext('2d')
        if (ctx) {
            ctx.fillStyle = '#f4f4f5'
            ctx.fillRect(0, 0, fb.width, fb.height)
            ctx.strokeStyle = '#d4d4d8'
            ctx.lineWidth = 1
            for (let i = 0; i < fb.width; i += 20) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, fb.height); ctx.stroke()
            }
            for (let j = 0; j < fb.height; j += 20) {
                ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(fb.width, j); ctx.stroke()
            }
            ctx.fillStyle = '#71717a'
            ctx.font = '14px system-ui'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('Capture failed — check console for details', fb.width / 2, fb.height / 2 - 10)
            ctx.fillText(`${Math.round(rect.width)} × ${Math.round(rect.height)}`, fb.width / 2, fb.height / 2 + 12)
        }
        onCapture(fb.toDataURL('image/png'))
    }

    const toolbarTop = rect
        ? Math.min(rect.y + rect.height + 8, window.innerHeight - 60)
        : 0
    const toolbarLeft = rect ? Math.max(rect.x, 8) : 0

    return (
        <div
            ref={overlayRef}
            data-optml-overlay="true"
            className="fixed inset-0 z-[9999]"
            style={{ cursor: phase === 'confirming' || phase === 'capturing' ? 'default' : 'crosshair' }}
            onMouseDown={phase === 'confirming' || phase === 'capturing' ? undefined : onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
        >
            {rect && rect.width > 0 && rect.height > 0 ? (
                <>
                    <div className="absolute inset-x-0 top-0 bg-black/50" style={{ height: rect.y }} />
                    <div className="absolute inset-x-0 bg-black/50" style={{ top: rect.y + rect.height, bottom: 0 }} />
                    <div className="absolute bg-black/50" style={{ top: rect.y, width: rect.x, height: rect.height }} />
                    <div className="absolute bg-black/50" style={{ top: rect.y, left: rect.x + rect.width, right: 0, height: rect.height }} />

                    <div
                        className="absolute border-2 border-white shadow-lg pointer-events-none"
                        style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
                    >
                        {[
                            'top-0 left-0 -translate-x-1/2 -translate-y-1/2',
                            'top-0 right-0 translate-x-1/2 -translate-y-1/2',
                            'bottom-0 left-0 -translate-x-1/2 translate-y-1/2',
                            'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
                        ].map((pos, i) => (
                            <div key={i} className={`absolute w-2.5 h-2.5 bg-white rounded-sm shadow ${pos}`} />
                        ))}

                        {phase === 'drawing' && (
                            <div className="absolute -top-6 left-0 bg-neutral-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap">
                                {Math.round(rect.width)} × {Math.round(rect.height)}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="absolute inset-0 bg-black/40" />
            )}

            {phase === 'idle' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-neutral-900/90 text-white text-sm px-4 py-2.5 rounded-full shadow-lg backdrop-blur-sm">
                        Click and drag to select an area · Esc to cancel
                    </div>
                </div>
            )}

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
                        Capture
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-white hover:bg-white/10"
                        onClick={() => { setPhase('idle'); setRect(null) }}
                    >
                        <X className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-[10px] text-neutral-400 font-mono px-1">
                        {Math.round(rect.width)}×{Math.round(rect.height)}
                    </span>
                </div>
            )}

            {phase === 'capturing' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-neutral-900/90 text-white text-sm px-5 py-3 rounded-full shadow-lg flex items-center gap-2.5">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Capturing…
                    </div>
                </div>
            )}
        </div>
    )
}