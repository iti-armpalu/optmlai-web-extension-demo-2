'use client'

import { useState, useEffect } from 'react'
import { X, Clock, CheckCircle2 } from 'lucide-react'
import type { Capture } from '../shared/types'

interface FromCapturesDrawerProps {
    isOpen: boolean
    onClose: () => void
    captures: Capture[]
    onSelectCapture: (capture: Capture) => void
}

function formatDate(date: Date) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
    }).format(new Date(date))
}

const METHOD_LABELS: Record<string, string> = {
    area: 'Area selection',
    upload: 'Upload',
    click: 'Select element',
    saved: 'From captures',
}

export function FromCapturesDrawer({
    isOpen, onClose, captures, onSelectCapture,
}: FromCapturesDrawerProps) {
    const [mounted, setMounted] = useState(false)
    const [selected, setSelected] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => setMounted(true))
            setSelected(null)
        } else {
            setMounted(false)
        }
    }, [isOpen])

    useEffect(() => {
        function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose])

    if (!isOpen && !mounted) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[54] bg-black/20 backdrop-blur-[2px] transition-opacity duration-300"
                style={{ opacity: mounted ? 1 : 0 }}
                onClick={onClose}
            />

            {/* Drawer — slides in from right, sits left of sidebar */}
            <div
                className="fixed inset-y-3 z-[55] flex flex-col border shadow-2xl rounded-2xl overflow-hidden transition-transform duration-300 ease-out"
                style={{
                    right: 320 + 8,
                    width: 300,
                    transform: mounted ? 'translateX(0)' : 'translateX(calc(100% + 340px))',
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(20px)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
                    <div>
                        <p className="text-sm font-semibold">From captures</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Select a previous capture to re-run analysis</p>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors flex-shrink-0">
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Capture list */}
                <div className="flex-1 overflow-y-auto">
                    {captures.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-6">
                            <p className="text-sm font-medium">No captures yet</p>
                            <p className="text-xs text-muted-foreground">Use Select area, Upload, or Select element to capture a creative first.</p>
                        </div>
                    ) : (
                        <div className="p-3 space-y-2">
                            {captures.map(capture => {
                                const isSelected = selected === capture.id
                                const hasImage = capture.imageUrl?.startsWith('data:') || capture.imageUrl?.startsWith('blob:')
                                return (
                                    <button
                                        key={capture.id}
                                        onClick={() => setSelected(capture.id)}
                                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${isSelected
                                                ? 'border-emerald-400 bg-emerald-50 ring-1 ring-emerald-400'
                                                : 'border-border hover:bg-muted/40'
                                            }`}
                                    >
                                        {/* Thumbnail */}
                                        <div className="w-16 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted border">
                                            {hasImage ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={capture.imageUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                                    <div className="w-4 h-4 rounded bg-neutral-300" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate">{capture.label ?? METHOD_LABELS[capture.method] ?? 'Capture'}</p>
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                                                <Clock className="w-2.5 h-2.5" />
                                                {formatDate(capture.createdAt)}
                                            </div>
                                        </div>

                                        {/* Selected indicator */}
                                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {captures.length > 0 && (
                    <div className="px-3 py-3 border-t flex-shrink-0">
                        <button
                            disabled={!selected}
                            onClick={() => {
                                const capture = captures.find(c => c.id === selected)
                                if (capture) { onSelectCapture(capture); onClose() }
                            }}
                            className="w-full h-9 rounded-lg bg-neutral-900 text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors"
                        >
                            {selected ? 'Run analysis on this capture' : 'Select a capture'}
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}