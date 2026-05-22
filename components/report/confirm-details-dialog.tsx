'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Pencil, Trash2, ChevronRight, ChevronLeft,
  Lock, CheckCircle2, Plus, X,
} from 'lucide-react'
import type { CreativeDetails } from '../shared/types'

// ── Types ──────────────────────────────────────────────────────────────────

type ElementCategory = 'Logo' | 'Tagline' | 'Imagery' | 'CTA button'

interface DetectedElement {
  id: string
  index: number
  label: string
  category: ElementCategory
  descriptors: string[]
  boundingBox: { x: number; y: number; w: number; h: number }
}

interface ConfirmDetailsDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (details: CreativeDetails) => void
  initialDetails?: Partial<CreativeDetails>
  imageUrl?: string
}

// ── Constants ──────────────────────────────────────────────────────────────

const ELEMENT_CATEGORIES: ElementCategory[] = ['Logo', 'Tagline', 'Imagery', 'CTA button']

const DESCRIPTORS: Partial<Record<ElementCategory, string[]>> = {
  Tagline: [
    'Describes the product',
    'Specifies a benefit',
    'Refers to the occasion',
    'Prompts action',
    'Pushes a promotional offer',
  ],
  Imagery: [
    'Product shown prominently',
    'Includes branded assets',
    'Highlights the benefits',
    'Contains lifestyle imagery',
    'Social media repost',
  ],
}

// Single accent colour for all boxes — clean, consistent
const BOX_COLOR = 'rgba(52,211,153,0.9)'
const BOX_BG = 'rgba(52,211,153,0.07)'
const BOX_ACTIVE_BG = 'rgba(52,211,153,0.18)'

const DOT_COLORS: Record<ElementCategory, string> = {
  Logo: 'bg-purple-400',
  Tagline: 'bg-blue-400',
  Imagery: 'bg-green-400',
  'CTA button': 'bg-amber-400',
}

const CATEGORY_TEXT: Record<ElementCategory, string> = {
  Logo: 'text-purple-600',
  Tagline: 'text-blue-600',
  Imagery: 'text-green-600',
  'CTA button': 'text-amber-600',
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

let _idx = 1
const DEFAULT_ELEMENTS: DetectedElement[] = [
  { id: '1', index: _idx++, label: 'Brand mark', category: 'Logo', descriptors: [], boundingBox: { x: 62, y: 5, w: 30, h: 18 } },
  { id: '2', index: _idx++, label: 'Main headline', category: 'Tagline', descriptors: ['Describes the product', 'Specifies a benefit'], boundingBox: { x: 5, y: 18, w: 55, h: 22 } },
  { id: '3', index: _idx++, label: 'Sub-headline', category: 'Tagline', descriptors: ['Refers to the occasion'], boundingBox: { x: 5, y: 42, w: 50, h: 10 } },
  { id: '4', index: _idx++, label: 'Shop now', category: 'CTA button', descriptors: [], boundingBox: { x: 5, y: 72, w: 28, h: 12 } },
  { id: '5', index: _idx++, label: 'Product visual', category: 'Imagery', descriptors: ['Product shown prominently', 'Includes branded assets'], boundingBox: { x: 60, y: 40, w: 36, h: 45 } },
]

// ── Step indicator ─────────────────────────────────────────────────────────

function StepIndicator({ step, locked, onStepClick }: {
  step: 1 | 2; locked: boolean; onStepClick: (n: 1 | 2) => void
}) {
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
            <button onClick={() => onStepClick(n)} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold transition-colors ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
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

// ── Main component ─────────────────────────────────────────────────────────

export function ConfirmDetailsDialog({
  open, onClose, onConfirm, initialDetails, imageUrl,
}: ConfirmDetailsDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [locked, setLocked] = useState(false)
  const [elements, setElements] = useState<DetectedElement[]>(DEFAULT_ELEMENTS)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [drawingCategory, setDrawingCategory] = useState<ElementCategory | null>(null)
  const [drawRect, setDrawRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Resize state
  const [resizingId, setResizingId] = useState<string | null>(null)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const resizeStart = useRef<{ mx: number; my: number; box: DetectedElement['boundingBox'] } | null>(null)

  const imageRef = useRef<HTMLDivElement>(null)
  const drawStart = useRef<{ x: number; y: number } | null>(null)
  const listRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const nextIndex = useRef(6)

  const [channel, setChannel] = useState(initialDetails?.channel ?? '')
  const [purpose, setPurpose] = useState(initialDetails?.purpose ?? '')

  const hasImage = imageUrl?.startsWith('data:') || imageUrl?.startsWith('blob:')
  const isReadOnly = locked
  const grouped = ELEMENT_CATEGORIES.map(cat => ({
    category: cat,
    items: elements.filter(e => e.category === cat),
  }))

  // Reset on open
  useEffect(() => {
    if (!open) return
    const isConfirmed = !!initialDetails?.confirmedAt
    setStep(isConfirmed ? 2 : 1)
    setLocked(isConfirmed)
    setElements(DEFAULT_ELEMENTS)
    setActiveId(null)
    setEditingId(null)
    setDrawingCategory(null)
    setDrawRect(null)
    setIsDrawing(false)
    setChannel(initialDetails?.channel ?? '')
    setPurpose(initialDetails?.purpose ?? '')
    nextIndex.current = 6
  }, [open])

  // Scroll list to active element
  useEffect(() => {
    if (activeId && listRefs.current[activeId]) {
      listRefs.current[activeId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeId])

  // Global mouse move + up for resize
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!resizingId || !resizeStart.current || !imageRef.current) return
      const rect = imageRef.current.getBoundingClientRect()
      const dx = ((e.clientX - resizeStart.current.mx) / rect.width) * 100
      const dy = ((e.clientY - resizeStart.current.my) / rect.height) * 100
      const b = resizeStart.current.box
      let { x, y, w, h } = b
      if (resizeHandle?.includes('e')) w = Math.max(4, b.w + dx)
      if (resizeHandle?.includes('s')) h = Math.max(4, b.h + dy)
      if (resizeHandle?.includes('w')) { x = Math.min(b.x + b.w - 4, b.x + dx); w = Math.max(4, b.w - dx) }
      if (resizeHandle?.includes('n')) { y = Math.min(b.y + b.h - 4, b.y + dy); h = Math.max(4, b.h - dy) }
      setElements(prev => prev.map(el => el.id === resizingId ? { ...el, boundingBox: { x, y, w, h } } : el))
    }
    function onUp() { setResizingId(null); setResizeHandle(null); resizeStart.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [resizingId, resizeHandle])

  // Image mouse handlers for drawing
  const onImgMouseDown = useCallback((e: React.MouseEvent) => {
    if (!drawingCategory || isReadOnly || !imageRef.current) return
    e.preventDefault()
    const r = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * 100
    const y = ((e.clientY - r.top) / r.height) * 100
    drawStart.current = { x, y }
    setIsDrawing(true)
    setDrawRect({ x, y, w: 0, h: 0 })
  }, [drawingCategory, isReadOnly])

  const onImgMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !drawStart.current || !imageRef.current) return
    const r = imageRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100))
    const y = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100))
    setDrawRect({
      x: Math.min(drawStart.current.x, x),
      y: Math.min(drawStart.current.y, y),
      w: Math.abs(x - drawStart.current.x),
      h: Math.abs(y - drawStart.current.y),
    })
  }, [isDrawing])

  const onImgMouseUp = useCallback(() => {
    if (!isDrawing || !drawRect || !drawingCategory || drawRect.w < 2 || drawRect.h < 2) {
      setIsDrawing(false); setDrawRect(null); drawStart.current = null; return
    }
    const newEl: DetectedElement = {
      id: crypto.randomUUID(),
      index: nextIndex.current++,
      label: drawingCategory,
      category: drawingCategory,
      descriptors: [],
      boundingBox: { ...drawRect },
    }
    setElements(prev => [...prev, newEl])
    setActiveId(newEl.id)
    setIsDrawing(false)
    setDrawRect(null)
    setDrawingCategory(null)
    drawStart.current = null
  }, [isDrawing, drawRect, drawingCategory])

  function deleteElement(id: string) {
    setElements(prev => prev.filter(e => e.id !== id))
    if (activeId === id) setActiveId(null)
  }

  function commitEdit(id: string) {
    setElements(prev => prev.map(e => e.id === id ? { ...e, label: editLabel } : e))
    setEditingId(null)
  }

  function toggleDescriptor(id: string, d: string) {
    setElements(prev => prev.map(e => {
      if (e.id !== id) return e
      const has = e.descriptors.includes(d)
      return { ...e, descriptors: has ? e.descriptors.filter(x => x !== d) : [...e.descriptors, d] }
    }))
  }

  function handleGenerate() {
    setLocked(true)
    setTimeout(() => {
      onConfirm({
        channel, purpose,
        detectedElements: elements.map(e => `${e.category}: ${e.label}`),
        confirmedAt: new Date(),
      })
      onClose()
    }, 600)
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm" onClick={onClose} />}

      <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
        <DialogContent
          className="p-0 gap-0 overflow-hidden z-[200]"
          style={{ width: '90vw', maxWidth: '1100px', height: '85vh', display: 'flex', flexDirection: 'column' }}
        >

          {/* ── Header ── */}
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base">
                {isReadOnly ? 'Creative setup' : 'Confirm creative details'}
              </DialogTitle>
              <StepIndicator step={step} locked={isReadOnly} onStepClick={setStep} />
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {isReadOnly
                ? 'Analysis confirmed — these details are locked and read-only.'
                : step === 1
                  ? 'Verify the elements the system detected — adjust any that are incorrect before continuing.'
                  : 'Select the channel and purpose for this creative.'}
            </DialogDescription>
          </DialogHeader>

          {/* ── Step 1 — Verify elements ── */}
          {step === 1 && (
            <div className="flex flex-1 min-h-0">

              {/* ── Left: image canvas ── */}
              <div className="flex-1 flex flex-col min-w-0 border-r bg-neutral-50">

                {/* Image toolbar */}
                <div className="flex items-center justify-between px-4 border-b bg-white flex-shrink-0" style={{ height: 44 }}>
                  <p className="text-xs font-medium text-foreground">
                    {isReadOnly
                      ? 'Confirmed elements — read-only'
                      : drawingCategory
                        ? <span className="text-emerald-600">Click and drag on the image to draw a {drawingCategory} element</span>
                        : 'Click a box to select · Drag corners to resize'}
                  </p>
                  {drawingCategory ? (
                    <Button size="sm" variant="ghost" className="h-6 text-xs text-muted-foreground gap-1 px-2"
                      onClick={() => { setDrawingCategory(null); setDrawRect(null); setIsDrawing(false) }}>
                      <X className="w-3 h-3" /> Cancel draw
                    </Button>
                  ) : null}
                </div>

                {/* Image */}
                <div className="flex-1 overflow-auto flex items-center justify-center p-6">
                  {hasImage ? (
                    <div
                      ref={imageRef}
                      className="relative select-none w-full"
                      style={{ cursor: drawingCategory ? 'crosshair' : 'default' }}
                      onMouseDown={onImgMouseDown}
                      onMouseMove={onImgMouseMove}
                      onMouseUp={onImgMouseUp}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl} alt="" className="w-full h-auto block rounded-lg pointer-events-none" draggable={false} />

                      {/* When any element is active or being edited, show only that box */}
                      {elements.filter(el => (editingId || activeId) ? el.id === (editingId ?? activeId) : true).map(el => {
                        const isActive = activeId === el.id
                        const isHovered = hoveredId === el.id
                        return (
                          <div
                            key={el.id}
                            className="absolute rounded transition-all duration-100"
                            style={{
                              left: `${el.boundingBox.x}%`, top: `${el.boundingBox.y}%`,
                              width: `${el.boundingBox.w}%`, height: `${el.boundingBox.h}%`,
                              border: `1.5px solid ${BOX_COLOR}`,
                              background: isActive ? BOX_ACTIVE_BG : BOX_BG,
                              cursor: isReadOnly ? 'default' : 'pointer',
                              zIndex: isActive ? 10 : 1,
                            }}
                            onClick={() => !drawingCategory && setActiveId(isActive ? null : el.id)}
                            onMouseEnter={() => setHoveredId(el.id)}
                            onMouseLeave={() => setHoveredId(null)}
                          >
                            {/* Index label */}
                            <span
                              className="absolute -top-5 left-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-sm pointer-events-none select-none"
                              style={{ background: BOX_COLOR, color: '#fff', whiteSpace: 'nowrap' }}
                            >
                              {el.label}
                            </span>

                            {/* Resize handles — 4 corners, shown on hover or active */}
                            {(isActive || isHovered) && !isReadOnly && (
                              [
                                { id: 'nw', top: -4, left: -4 },
                                { id: 'ne', top: -4, right: -4 },
                                { id: 'sw', bottom: -4, left: -4 },
                                { id: 'se', bottom: -4, right: -4 },
                              ].map(h => (
                                <div
                                  key={h.id}
                                  className="absolute w-2.5 h-2.5 rounded-full bg-white z-20"
                                  style={{
                                    ...h,
                                    border: `1.5px solid ${BOX_COLOR}`,
                                    cursor: `${h.id}-resize`,
                                    position: 'absolute',
                                  }}
                                  onMouseDown={e => {
                                    e.stopPropagation(); e.preventDefault()
                                    setResizingId(el.id)
                                    setResizeHandle(h.id)
                                    resizeStart.current = { mx: e.clientX, my: e.clientY, box: { ...el.boundingBox } }
                                  }}
                                />
                              ))
                            )}
                          </div>
                        )
                      })}

                      {/* Draw preview */}
                      {drawRect && drawRect.w > 0 && (
                        <div
                          className="absolute pointer-events-none rounded"
                          style={{
                            left: `${drawRect.x}%`, top: `${drawRect.y}%`,
                            width: `${drawRect.w}%`, height: `${drawRect.h}%`,
                            border: `2px dashed ${BOX_COLOR}`,
                            background: 'rgba(52,211,153,0.1)',
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No image preview available</div>
                  )}
                </div>
              </div>

              {/* ── Right: element list ── */}
              <div className="w-80 flex flex-col bg-white">
                <div className="px-4 border-b flex items-center justify-between flex-shrink-0" style={{ height: 44 }}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Elements
                  </p>
                  <span className="text-xs text-muted-foreground">{elements.length} detected</span>
                </div>

                {/* Grouped list */}
                <div className="flex-1 overflow-y-auto">
                  {grouped.map(({ category, items }) => (
                    <div key={category} className="border-b last:border-b-0">

                      {/* Category header */}
                      <div className="flex items-center justify-between px-4 py-2 bg-muted/20 sticky top-0 z-10">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {category}
                        </span>
                        {/* Add element button per category */}
                        {!isReadOnly && (
                          <button
                            onClick={() => setDrawingCategory(category)}
                            className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition-colors ${drawingCategory === category
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                              }`}
                          >
                            <Plus className="w-2.5 h-2.5" />
                            Add
                          </button>
                        )}
                      </div>

                      {/* Empty state */}
                      {items.length === 0 && (
                        <p className="text-[11px] text-muted-foreground/50 px-4 py-2.5 italic">
                          None detected
                        </p>
                      )}

                      {/* Element rows */}
                      {items.map(el => {
                        const isActive = activeId === el.id
                        const isEditing = editingId === el.id
                        const descs = DESCRIPTORS[category]

                        return (
                          <div
                            key={el.id}
                            ref={node => { listRefs.current[el.id] = node }}
                            className={`border-t transition-colors ${isActive ? 'bg-emerald-50/60' : 'hover:bg-muted/20'}`}
                          >
                            {/* Element row — click selects */}
                            <div
                              className="flex items-center gap-2 px-4 py-2.5 cursor-pointer group"
                              onClick={() => setActiveId(isActive ? null : el.id)}
                            >
                              <p className="text-xs font-medium flex-1 truncate">{el.label}</p>
                              {!isReadOnly && (
                                <div className="flex gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={e => { e.stopPropagation(); setEditingId(isEditing ? null : el.id); setEditLabel(el.label) }}
                                    className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${isEditing ? 'bg-muted' : 'hover:bg-muted'}`}
                                  >
                                    <Pencil className="w-2.5 h-2.5 text-muted-foreground" />
                                  </button>
                                  <button
                                    onClick={e => { e.stopPropagation(); deleteElement(el.id) }}
                                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-destructive/10"
                                  >
                                    <Trash2 className="w-2.5 h-2.5 text-muted-foreground" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Descriptor pills — always visible, compact */}
                            {descs && el.descriptors.length > 0 && !isEditing && (
                              <div className="flex flex-wrap gap-1 px-4 pb-2">
                                {el.descriptors.map(d => (
                                  <span key={d} className="text-[9px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground leading-none">
                                    {d}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Edit panel — only opens via pencil click, focused and clean */}
                            {isEditing && !isReadOnly && (
                              <div className="mx-3 mb-3 rounded-lg border bg-white p-3 space-y-3 shadow-sm">
                                {/* Label edit */}
                                <div className="space-y-1">
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Label</p>
                                  <textarea
                                    value={editLabel}
                                    onChange={e => setEditLabel(e.target.value)}
                                    className="w-full text-xs px-2.5 py-1.5 rounded-md border bg-background resize-none leading-relaxed outline-none focus:ring-1 focus:ring-border"
                                    rows={2}
                                    autoFocus
                                  />
                                </div>
                                {/* Descriptors */}
                                {descs && (
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Content attributes</p>
                                    <div className="space-y-1.5">
                                      {descs.map(d => (
                                        <label key={d} className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={el.descriptors.includes(d)}
                                            onChange={() => toggleDescriptor(el.id, d)}
                                            className="w-3 h-3 rounded accent-emerald-500 flex-shrink-0"
                                          />
                                          <span className="text-[11px] leading-tight">{d}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {/* Save */}
                                <div className="flex justify-end gap-1.5 pt-1">
                                  <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditingId(null)}>Cancel</Button>
                                  <Button size="sm" className="h-6 text-xs px-2" onClick={() => commitEdit(el.id)}>Save</Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>

                {/* Step 1 footer */}
                <div className="px-3 py-3 border-t flex items-center gap-2 flex-shrink-0">
                  {isReadOnly && (
                    <div className="flex items-center gap-1.5 text-xs text-green-600">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Analysis confirmed</span>
                    </div>
                  )}
                  <div className="flex-1" />
                  {!isReadOnly && (
                    <Button variant="outline" className="h-9 text-sm px-4" onClick={onClose}>Cancel</Button>
                  )}
                  <Button
                    variant={isReadOnly ? 'outline' : 'default'}
                    className="h-9 text-sm px-4 gap-1.5"
                    onClick={() => setStep(2)}
                  >
                    {isReadOnly ? 'Channel & purpose' : 'Confirm elements'}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2 — Channel & purpose ── */}
          {step === 2 && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">

                {/* Channel */}
                <div className="space-y-3">
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
                        className={`text-left px-4 py-3 rounded-xl border transition-colors ${channel === c.value ? 'border-emerald-400 bg-emerald-50' : 'border-border hover:bg-muted/50'
                          } ${isReadOnly ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
                      >
                        <p className="text-sm font-medium">{c.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{c.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Purpose */}
                <div className="space-y-3">
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
                        className={`text-left px-4 py-3 rounded-xl border transition-colors ${purpose === p.value ? 'border-emerald-400 bg-emerald-50' : 'border-border hover:bg-muted/50'
                          } ${isReadOnly ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
                      >
                        <p className="text-sm font-medium">{p.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{p.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {!isReadOnly && (
                  <div className="rounded-lg bg-muted/40 border px-4 py-3">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Analysis will be generated using the confirmed elements, channel, and purpose. These cannot be changed after generation.
                    </p>
                  </div>
                )}
              </div>

              {/* Step 2 footer */}
              <div className="px-6 py-3 border-t flex-shrink-0 flex items-center gap-2">
                <Button
                  variant={isReadOnly ? 'outline' : 'ghost'}
                  className="h-9 text-sm px-4 gap-1.5 text-muted-foreground"
                  onClick={() => setStep(1)}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  {isReadOnly ? 'Key elements' : 'Back to elements'}
                </Button>
                {isReadOnly && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Analysis confirmed</span>
                  </div>
                )}
                <div className="flex-1" />
                {!isReadOnly ? (
                  <>
                    <Button variant="outline" className="h-9 text-sm px-5" onClick={onClose}>Cancel</Button>
                    <Button
                      className="h-9 text-sm px-5 gap-1.5"
                      disabled={!channel || !purpose || locked}
                      onClick={handleGenerate}
                    >
                      {locked ? 'Generating…' : <><CheckCircle2 className="w-3.5 h-3.5" />Generate full report</>}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" className="h-9 text-sm px-5" onClick={onClose}>Close</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}