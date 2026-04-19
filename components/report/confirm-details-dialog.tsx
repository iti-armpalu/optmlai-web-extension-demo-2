'use client'

import { useState, useRef, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Pencil, Trash2, Plus, ChevronRight,
    ChevronLeft, Lock, CheckCircle2, Crosshair,
} from 'lucide-react'
import type { CreativeDetails } from '../shared/types'

interface DetectedElement {
    id: string
    label: string
    category: string
    boundingBox: { x: number; y: number; w: number; h: number } // % of image
}

interface ConfirmDetailsDialogProps {
    open: boolean
    onClose: () => void
    onConfirm: (details: CreativeDetails) => void
    initialDetails?: Partial<CreativeDetails>
    imageUrl?: string
}

const ELEMENT_CATEGORIES = [
    'Logo', 'Headline', 'Tagline', 'Body copy', 'CTA button',
    'Product image', 'Background', 'Price', 'Offer', 'Social proof',
]

const CATEGORY_COLORS: Record<string, string> = {
    'Logo': 'border-purple-400 bg-purple-400/10',
    'Headline': 'border-blue-400 bg-blue-400/10',
    'Tagline': 'border-cyan-400 bg-cyan-400/10',
    'Body copy': 'border-slate-400 bg-slate-400/10',
    'CTA button': 'border-amber-400 bg-amber-400/10',
    'Product image': 'border-green-400 bg-green-400/10',
    'Background': 'border-gray-400 bg-gray-400/10',
    'Price': 'border-rose-400 bg-rose-400/10',
    'Offer': 'border-orange-400 bg-orange-400/10',
    'Social proof': 'border-teal-400 bg-teal-400/10',
}

const DOT_COLORS: Record<string, string> = {
    'Logo': 'bg-purple-400',
    'Headline': 'bg-blue-400',
    'Tagline': 'bg-cyan-400',
    'Body copy': 'bg-slate-400',
    'CTA button': 'bg-amber-400',
    'Product image': 'bg-green-400',
    'Background': 'bg-gray-400',
    'Price': 'bg-rose-400',
    'Offer': 'bg-orange-400',
    'Social proof': 'bg-teal-400',
}

const CHANNELS = [
    { value: 'Social Media', label: 'Social Media', description: 'Facebook, Instagram, TikTok, LinkedIn' },
    { value: 'Display Advertising', label: 'Display Advertising', description: 'Banner ads, programmatic display' },
    { value: 'TV / Video', label: 'TV / Video', description: 'CTV, OTT, YouTube, streaming' },
    { value: 'Retail Media', label: 'Retail Media', description: 'Amazon, Walmart, in-store displays' },
    { value: 'Email Marketing', label: 'Email Marketing', description: 'Newsletters, promotional emails' },
    { value: 'Out of Home', label: 'Out of Home', description: 'Billboards, transit, DOOH' },
]

const PURPOSES = [
    { value: 'Brand Awareness', label: 'Brand Awareness', description: 'Increase brand recognition and recall' },
    { value: 'Lead Generation', label: 'Lead Generation', description: 'Capture contact information and qualified leads' },
    { value: 'Direct Response', label: 'Direct Response', description: 'Drive immediate action or purchase' },
    { value: 'Consideration', label: 'Consideration', description: 'Move prospects further down the funnel' },
    { value: 'Retention / Loyalty', label: 'Retention / Loyalty', description: 'Engage existing customers' },
    { value: 'Product Launch', label: 'Product Launch', description: 'Introduce a new product or service' },
]

// Mock detected elements — pre-populated from AI extraction
const DEFAULT_ELEMENTS: DetectedElement[] = [
    { id: '1', label: 'Brand mark', category: 'Logo', boundingBox: { x: 62, y: 5, w: 30, h: 18 } },
    { id: '2', label: 'Main headline', category: 'Headline', boundingBox: { x: 5, y: 18, w: 55, h: 22 } },
    { id: '3', label: 'Sub-headline', category: 'Tagline', boundingBox: { x: 5, y: 42, w: 50, h: 10 } },
    { id: '4', label: 'Shop now', category: 'CTA button', boundingBox: { x: 5, y: 72, w: 28, h: 12 } },
    { id: '5', label: 'Product visual', category: 'Product image', boundingBox: { x: 60, y: 40, w: 36, h: 45 } },
]

// ── Step indicator ──
function StepIndicator({ step, locked, onStepClick }: { step: 1 | 2; locked: boolean; onStepClick: (n: 1 | 2) => void }) {
    return (
        <div className="flex items-center gap-2 mr-6">
            {locked && (
                <Badge variant="secondary" className="text-[10px] gap-1 h-5 mr-1">
                    <Lock className="w-2.5 h-2.5" /> Locked
                </Badge>
            )}
            {([1, 2] as const).map(n => {
                const isActive = step === n
                const isDone = locked || step > n
                return (
                    <div key={n} className="flex items-center gap-2">
                        <button
                            onClick={() => onStepClick(n)}
                            className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                        >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold transition-colors ${isDone
                                    ? 'bg-green-500 text-white'
                                    : isActive
                                        ? 'bg-foreground text-background'
                                        : 'bg-muted text-muted-foreground'
                                }`}>
                                {isDone ? <CheckCircle2 className="w-3 h-3" /> : n}
                            </div>
                            <span className={`text-xs ${isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                {n === 1 ? 'Verify elements' : 'Channel & purpose'}
                            </span>
                        </button>
                        {n < 2 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                    </div>
                )
            })}
        </div>
    )
}

// ── Bounding box overlay on image ──
function BoundingBoxOverlay({
    elements,
    activeId,
    onSelect,
    isDrawing,
    drawRect,
}: {
    elements: DetectedElement[]
    activeId: string | null
    onSelect: (id: string) => void
    isDrawing: boolean
    drawRect: { x: number; y: number; w: number; h: number } | null
}) {
    return (
        <>
            {elements.map(el => {
                const colorClass = CATEGORY_COLORS[el.category] ?? 'border-white/40 bg-white/5'
                const isActive = activeId === el.id
                return (
                    <button
                        key={el.id}
                        onClick={() => onSelect(el.id)}
                        className={`absolute border-2 rounded-sm transition-all duration-150 ${colorClass} ${isActive ? 'ring-2 ring-white ring-offset-0 opacity-100' : 'opacity-70 hover:opacity-100'
                            }`}
                        style={{
                            left: `${el.boundingBox.x}%`,
                            top: `${el.boundingBox.y}%`,
                            width: `${el.boundingBox.w}%`,
                            height: `${el.boundingBox.h}%`,
                        }}
                    >
                        {/* Label pill */}
                        <span className="absolute -top-4 left-0 text-[9px] font-semibold text-white bg-black/60 px-1 py-0.5 rounded whitespace-nowrap">
                            {el.category}
                        </span>
                    </button>
                )
            })}

            {/* Draw rect preview */}
            {isDrawing && drawRect && drawRect.w > 0 && (
                <div
                    className="absolute border-2 border-dashed border-white bg-white/10 pointer-events-none"
                    style={{
                        left: `${drawRect.x}%`,
                        top: `${drawRect.y}%`,
                        width: `${drawRect.w}%`,
                        height: `${drawRect.h}%`,
                    }}
                />
            )}
        </>
    )
}

export function ConfirmDetailsDialog({
    open,
    onClose,
    onConfirm,
    initialDetails,
    imageUrl,
}: ConfirmDetailsDialogProps) {
    const [step, setStep] = useState<1 | 2>(1)
    const [locked, setLocked] = useState(false)
    const [elements, setElements] = useState<DetectedElement[]>(DEFAULT_ELEMENTS)
    const [activeElementId, setActiveElementId] = useState<string | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editLabel, setEditLabel] = useState('')
    const [addingNew, setAddingNew] = useState(false)
    const [newCategory, setNewCategory] = useState('Headline')
    const [drawRect, setDrawRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const drawStart = useRef<{ x: number; y: number } | null>(null)
    const imageRef = useRef<HTMLDivElement>(null)

    const [channel, setChannel] = useState(initialDetails?.channel ?? '')
    const [purpose, setPurpose] = useState(initialDetails?.purpose ?? '')

    // Reset all state when dialog opens for a new capture
    // If initialDetails has a confirmedAt it means it's being reopened in read-only mode
    useEffect(() => {
        if (open) {
            const isAlreadyConfirmed = !!initialDetails?.confirmedAt
            setStep(isAlreadyConfirmed ? 2 : 1)
            setLocked(isAlreadyConfirmed)
            setElements(DEFAULT_ELEMENTS)
            setActiveElementId(null)
            setEditingId(null)
            setAddingNew(false)
            setDrawRect(null)
            setIsDrawing(false)
            setChannel(initialDetails?.channel ?? '')
            setPurpose(initialDetails?.purpose ?? '')
        }
    }, [open])

    const hasImage = imageUrl?.startsWith('data:') || imageUrl?.startsWith('blob:')
    const isStep2Valid = channel && purpose
    const activeElement = elements.find(e => e.id === activeElementId) ?? null

    // Drawing mode mouse handlers
    function getPct(e: React.MouseEvent) {
        if (!imageRef.current) return { x: 0, y: 0 }
        const rect = imageRef.current.getBoundingClientRect()
        return {
            x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
            y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
        }
    }

    function onImageMouseDown(e: React.MouseEvent) {
        if (!addingNew || locked) return
        const p = getPct(e)
        drawStart.current = p
        setIsDrawing(true)
        setDrawRect({ x: p.x, y: p.y, w: 0, h: 0 })
    }

    function onImageMouseMove(e: React.MouseEvent) {
        if (!isDrawing || !drawStart.current) return
        const p = getPct(e)
        setDrawRect({
            x: Math.min(drawStart.current.x, p.x),
            y: Math.min(drawStart.current.y, p.y),
            w: Math.abs(p.x - drawStart.current.x),
            h: Math.abs(p.y - drawStart.current.y),
        })
    }

    function onImageMouseUp() {
        if (!isDrawing || !drawRect || drawRect.w < 2 || drawRect.h < 2) {
            setIsDrawing(false)
            return
        }
        const newEl: DetectedElement = {
            id: crypto.randomUUID(),
            label: newCategory,
            category: newCategory,
            boundingBox: { ...drawRect },
        }
        setElements(prev => [...prev, newEl])
        setActiveElementId(newEl.id)
        setIsDrawing(false)
        setDrawRect(null)
        setAddingNew(false)
        drawStart.current = null
    }

    function deleteElement(id: string) {
        setElements(prev => prev.filter(e => e.id !== id))
        if (activeElementId === id) setActiveElementId(null)
    }

    function startEdit(el: DetectedElement) {
        setEditingId(el.id)
        setEditLabel(el.label)
    }

    function commitEdit(id: string) {
        setElements(prev => prev.map(e => e.id === id ? { ...e, label: editLabel } : e))
        setEditingId(null)
    }

    function updateCategory(id: string, cat: string) {
        setElements(prev => prev.map(e => e.id === id ? { ...e, category: cat } : e))
    }

    function handleGenerate() {
        setLocked(true)
        setTimeout(() => {
            onConfirm({
                channel,
                purpose,
                detectedElements: elements.map(e => `${e.category}: ${e.label}`),
                confirmedAt: new Date(),
            })
            onClose()
        }, 600)
    }

    // Read-only view when locked and reopened
    const isReadOnly = locked

    return (
        <>
            {/* Custom overlay — sits above report drawer (z-61) to create clear dialog backdrop */}
            {open && (
                <div
                    className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                />
            )}
            <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
                <DialogContent className="p-0 gap-0 overflow-hidden z-[200]" style={{ width: "90vw", maxWidth: "1100px", height: "85vh", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>

                    {/* Header */}
                    <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-base">
                                {isReadOnly ? 'Creative setup' : 'Confirm creative details'}
                            </DialogTitle>
                            <StepIndicator step={step} locked={isReadOnly} onStepClick={setStep} />
                        </div>
                        <DialogDescription className="text-xs text-muted-foreground mt-1">
                            {isReadOnly
                                ? 'Analysis has been generated. These details are locked and read-only.'
                                : 'Verify detected elements and select channel and purpose to unlock the full analysis.'}
                        </DialogDescription>
                    </DialogHeader>

                    {/* ── Step 1: Verify elements ── */}
                    {step === 1 && (
                        <div className="flex flex-col flex-1 min-h-0">
                            <div className="flex flex-1 min-h-0">

                                {/* Left — image with bounding boxes */}
                                <div className="flex-1 bg-muted/30 flex flex-col border-r">
                                    <div className="px-4 py-2.5 border-b bg-background flex items-center justify-between">
                                        <p className="text-xs font-medium text-muted-foreground">Creative preview</p>
                                        {!isReadOnly && (
                                            <div className="flex items-center gap-2">
                                                <Select value={newCategory} onValueChange={setNewCategory}>
                                                    <SelectTrigger className="h-6 text-[11px] w-32 border-dashed">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {ELEMENT_CATEGORIES.map(c => (
                                                            <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    size="sm"
                                                    variant={addingNew ? 'default' : 'outline'}
                                                    className="h-6 text-[11px] gap-1 px-2"
                                                    onClick={() => setAddingNew(v => !v)}
                                                >
                                                    <Crosshair className="w-3 h-3" />
                                                    {addingNew ? 'Drawing…' : 'Draw element'}
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                                        {hasImage ? (
                                            <div
                                                ref={imageRef}
                                                className="relative w-full select-none"
                                                style={{ cursor: addingNew ? 'crosshair' : 'default' }}
                                                onMouseDown={onImageMouseDown}
                                                onMouseMove={onImageMouseMove}
                                                onMouseUp={onImageMouseUp}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={imageUrl}
                                                    alt="Creative"
                                                    className="w-full h-auto block rounded-lg"
                                                    draggable={false}
                                                />
                                                <BoundingBoxOverlay
                                                    elements={elements}
                                                    activeId={activeElementId}
                                                    onSelect={id => !addingNew && setActiveElementId(id)}
                                                    isDrawing={isDrawing}
                                                    drawRect={drawRect}
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <p className="text-sm">No image preview available</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right — element list */}
                                <div className="w-64 flex flex-col bg-background">
                                    <div className="px-4 py-2.5 border-b">
                                        <p className="text-xs font-medium text-muted-foreground">
                                            Detected elements <span className="ml-1 text-foreground font-semibold">{elements.length}</span>
                                        </p>
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        {elements.map(el => {
                                            const dotColor = DOT_COLORS[el.category] ?? 'bg-gray-400'
                                            const isActive = activeElementId === el.id
                                            const isEditing = editingId === el.id
                                            return (
                                                <div
                                                    key={el.id}
                                                    onClick={() => setActiveElementId(el.id)}
                                                    className={`px-4 py-2.5 border-b cursor-pointer transition-colors ${isActive ? 'bg-accent' : 'hover:bg-muted/40'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                                                        <div className="flex-1 min-w-0">
                                                            {isEditing && !isReadOnly ? (
                                                                <Input
                                                                    value={editLabel}
                                                                    onChange={e => setEditLabel(e.target.value)}
                                                                    onBlur={() => commitEdit(el.id)}
                                                                    onKeyDown={e => e.key === 'Enter' && commitEdit(el.id)}
                                                                    className="h-5 text-xs px-1 py-0"
                                                                    autoFocus
                                                                    onClick={e => e.stopPropagation()}
                                                                />
                                                            ) : (
                                                                <p className="text-xs font-medium truncate">{el.label}</p>
                                                            )}
                                                            {/* Category selector */}
                                                            {isActive && !isReadOnly ? (
                                                                <Select
                                                                    value={el.category}
                                                                    onValueChange={cat => updateCategory(el.id, cat)}
                                                                >
                                                                    <SelectTrigger className="h-5 text-[10px] mt-0.5 px-1 border-0 bg-transparent p-0 shadow-none">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {ELEMENT_CATEGORIES.map(c => (
                                                                            <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            ) : (
                                                                <p className="text-[10px] text-muted-foreground">{el.category}</p>
                                                            )}
                                                        </div>
                                                        {!isReadOnly && (
                                                            <div className="flex items-center gap-0.5 flex-shrink-0">
                                                                <button
                                                                    onClick={e => { e.stopPropagation(); startEdit(el) }}
                                                                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-muted transition-colors"
                                                                >
                                                                    <Pencil className="w-2.5 h-2.5 text-muted-foreground" />
                                                                </button>
                                                                <button
                                                                    onClick={e => { e.stopPropagation(); deleteElement(el.id) }}
                                                                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-destructive/10 transition-colors"
                                                                >
                                                                    <Trash2 className="w-2.5 h-2.5 text-muted-foreground hover:text-destructive" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                </div>
                            </div>

                            {/* Step 1 sticky footer — same style as step 2 */}
                            <div className="px-6 py-3 border-t flex-shrink-0 flex items-center gap-2">
                                {isReadOnly && (
                                    <div className="flex items-center gap-1.5 text-xs text-green-600">
                                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                                        Analysis confirmed — read-only
                                    </div>
                                )}
                                <div className="flex-1" />
                                {!isReadOnly && (
                                    <Button variant="outline" className="h-9 text-sm px-5" onClick={onClose}>
                                        Cancel
                                    </Button>
                                )}
                                <Button
                                    variant={isReadOnly ? 'outline' : 'default'}
                                    className="h-9 text-sm px-5 gap-1.5"
                                    onClick={() => setStep(2)}
                                >
                                    {isReadOnly ? 'View channel & purpose' : 'Confirm key elements'}
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Channel & purpose ── */}
                    {step === 2 && (
                        <div className="flex flex-col flex-1 min-h-0">
                            <div className="p-6 space-y-5 flex-1 overflow-y-auto">

                                {/* Back to step 1 */}
                                {!isReadOnly && (
                                    <button
                                        onClick={() => setStep(1)}
                                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                        Back to key elements
                                    </button>
                                )}

                                <div className="space-y-6">
                                    {/* Channel */}
                                    <div className="col-span-2 space-y-2">
                                        <div>
                                            <p className="text-sm font-semibold">Channel</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Select the primary channel where this creative will run.</p>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {CHANNELS.map(c => (
                                                <button
                                                    key={c.value}
                                                    disabled={isReadOnly}
                                                    onClick={() => setChannel(c.value)}
                                                    className={`text-left px-4 py-3 rounded-xl border transition-colors ${channel === c.value
                                                            ? 'border-green-400 bg-green-50 text-foreground'
                                                            : 'border-border hover:bg-muted/50 text-foreground'
                                                        } ${isReadOnly ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
                                                >
                                                    <p className="text-sm font-medium">{c.label}</p>
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">{c.description}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Purpose */}
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-sm font-semibold">Purpose</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Select the primary objective this creative is designed to achieve.</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {PURPOSES.map(p => (
                                            <button
                                                key={p.value}
                                                disabled={isReadOnly}
                                                onClick={() => setPurpose(p.value)}
                                                className={`text-left px-4 py-3 rounded-xl border transition-colors ${purpose === p.value
                                                        ? 'border-green-400 bg-green-50 text-foreground'
                                                        : 'border-border hover:bg-muted/50 text-foreground'
                                                    } ${isReadOnly ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
                                            >
                                                <p className="text-sm font-medium">{p.label}</p>
                                                <p className="text-[11px] text-muted-foreground mt-0.5">{p.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Info note */}
                                {!isReadOnly && (
                                    <div className="rounded-lg bg-muted/40 border px-4 py-3">
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            Analysis will be generated using the confirmed key elements and selected channel and purpose. These inputs cannot be changed after generation.
                                        </p>
                                    </div>
                                )}


                            </div>

                            {/* Step 2 sticky footer */}
                            <div className="px-6 py-3 border-t flex-shrink-0 flex items-center gap-2">
                                <Button
                                    variant={isReadOnly ? 'outline' : 'ghost'}
                                    className="h-9 text-sm px-4 gap-1.5 text-muted-foreground"
                                    onClick={() => setStep(1)}
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    {isReadOnly ? 'View key elements' : 'Back to key elements'}
                                </Button>
                                {isReadOnly && (
                                    <div className="flex items-center gap-1.5 text-xs text-green-600">
                                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                                        Analysis confirmed — read-only
                                    </div>
                                )}
                                <div className="flex-1" />
                                {!isReadOnly ? (
                                    <>
                                        <Button variant="outline" className="h-9 text-sm px-5" onClick={onClose}>
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="default"
                                            className="h-9 text-sm px-5 gap-1.5"
                                            disabled={!isStep2Valid || locked}
                                            onClick={handleGenerate}
                                        >
                                            {locked ? 'Generating…' : (
                                                <>
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Generate full report
                                                </>
                                            )}
                                        </Button>
                                    </>
                                ) : (
                                    <Button variant="outline" className="h-9 text-sm px-5" onClick={onClose}>
                                        Close
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}