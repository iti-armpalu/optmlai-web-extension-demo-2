'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  X, GripVertical,
  Pencil, Check, Plus, Tag, Clock, Lock, CheckCircle2,
  Download, Share2, MoreHorizontal, AlertCircle, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import type { Report, AnalysisStatus, CreativeDetails } from '../shared/types'
import { getMockData } from './mock-data'
import { generateTitle } from '../shared/generate-title'
import { ChatPanel } from './chat-panel'
import { OverviewTab } from './tabs/overview-tab'
import { HeatmapTab } from './tabs/heatmap-tab'
import { ContextsTab } from './tabs/contexts-tab'

interface ReportDrawerProps {
  report: Report | null
  isOpen: boolean
  onClose: () => void
  analysisStatus: AnalysisStatus
  creativeDetails?: CreativeDetails
  onConfirmDetails: () => void
}

const MIN_REPORT_WIDTH = 320
const MIN_CHAT_WIDTH = 280
const DEFAULT_SPLIT = 0.58

function formatTimestamp(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }) + ' at ' + date.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  })
}

export function ReportDrawer({ report, isOpen, onClose, analysisStatus, creativeDetails, onConfirmDetails }: ReportDrawerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartSplit = useRef(DEFAULT_SPLIT)
  const [split, setSplit] = useState(DEFAULT_SPLIT)
  const [activeTab, setActiveTab] = useState<'overview' | 'heatmap' | 'contexts'>('overview')
  const tabContentRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  // Editable title
  const [title, setTitle] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Tags
  const [tags, setTags] = useState<string[]>([])
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const tagInputRef = useRef<HTMLInputElement>(null)

  // Sync title when report changes
  useEffect(() => {
    if (report) setTitle(generateTitle(report))
  }, [report?.id])

  // Focus title input when editing starts
  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus()
  }, [isEditingTitle])

  // Focus tag input when adding starts
  useEffect(() => {
    if (isAddingTag) tagInputRef.current?.focus()
  }, [isAddingTag])

  // Slide animation + reset state on open
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setMounted(true))
      setSplit(DEFAULT_SPLIT)
      setActiveTab('overview')
    } else {
      setMounted(false)
    }
  }, [isOpen])

  // Focus trap
  useEffect(() => {
    if (!isOpen) return
    const drawer = containerRef.current?.closest('[data-drawer]') as HTMLElement | null
    if (!drawer) return
    const focusable = drawer.querySelectorAll<HTMLElement>(
      'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    function onTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }
    window.addEventListener('keydown', onTab)
    first?.focus()
    return () => window.removeEventListener('keydown', onTab)
  }, [isOpen])

  // Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (isEditingTitle) { setIsEditingTitle(false); return }
        if (isAddingTag) { setIsAddingTag(false); setTagInput(''); return }
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, isEditingTitle, isAddingTag])

  function switchTab(tab: 'overview' | 'heatmap' | 'contexts') {
    setActiveTab(tab)
    if (tabContentRef.current) tabContentRef.current.scrollTop = 0
  }

  function commitTitle() {
    if (!title.trim()) setTitle(report ? generateTitle(report) : 'Creative report')
    setIsEditingTitle(false)
  }

  function commitTag() {
    const val = tagInput.trim()
    if (val && !tags.includes(val)) setTags((prev) => [...prev, val])
    setTagInput('')
    setIsAddingTag(false)
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  // Divider drag
  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    dragStartX.current = e.clientX
    dragStartSplit.current = split
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [split])

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current || !containerRef.current) return
      const containerWidth = containerRef.current.offsetWidth
      const delta = e.clientX - dragStartX.current
      const newSplit = Math.max(
        MIN_REPORT_WIDTH / containerWidth,
        Math.min(
          1 - MIN_CHAT_WIDTH / containerWidth,
          dragStartSplit.current + delta / containerWidth
        )
      )
      setSplit(newSplit)
    }
    function onMouseUp() {
      if (!isDragging.current) return
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  if (!isOpen && !mounted) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px] transition-opacity duration-300"
        style={{ opacity: mounted ? 1 : 0 }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        data-drawer="true"
        className="fixed inset-y-0 right-0 z-[61] flex flex-col border-l shadow-2xl transition-transform duration-300 ease-out backdrop-blur-xl"
        style={{
          width: 'calc(100vw - 48px)',
          maxWidth: 1280,
          transform: mounted ? 'translateX(0)' : 'translateX(100%)',
          background: 'rgba(255,255,255,0.82)',
        }}
      >
        {/* ── Drawer top bar ── */}
        <div className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0 bg-muted/30">
          {/* Left — logo + title + analysis status */}
          <div className="w-5 h-5 rounded bg-neutral-900 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" />
              <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.5" />
              <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.5" />
              <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.25" />
            </svg>
          </div>
          <span className="text-xs font-medium text-muted-foreground">Optml Report</span>

          <div className="w-px h-4 bg-border mx-1" />

          {analysisStatus === 'pending' ? (
            <Button
              size="sm"
              onClick={onConfirmDetails}
              className="h-7 gap-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-white border-0"
            >
              <Lock className="w-3 h-3" />
              Analysis pending — confirm details
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[11px] text-green-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Analysis complete
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={onConfirmDetails}
              >
                View setup
              </Button>
            </div>
          )}

          {/* Right — actions + close */}
          <div className="ml-auto flex items-center gap-1">
            {/* Download */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Download report"
              onClick={() => console.log('[Optml] Download report')}
            >
              <Download className="w-3.5 h-3.5" />
            </Button>

            {/* Share */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Share report"
              onClick={() => console.log('[Optml] Share report')}
            >
              <Share2 className="w-3.5 h-3.5" />
            </Button>

            {/* More actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem className="text-xs gap-2" onClick={() => console.log('[Optml] Download PDF')}>
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs gap-2" onClick={() => console.log('[Optml] Download CSV')}>
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs gap-2" onClick={() => console.log('[Optml] Copy link')}>
                  <Share2 className="w-3.5 h-3.5" /> Copy link
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs gap-2" onClick={() => console.log('[Optml] Share via email')}>
                  <Share2 className="w-3.5 h-3.5" /> Share via email
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-4 bg-border mx-1" />

            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ── Split body ── */}
        <div ref={containerRef} className="flex flex-1 min-h-0 overflow-hidden">

          {/* Left: Report panel */}
          <div
            className="flex flex-col min-h-0 overflow-y-auto"
            style={{ width: `${split * 100}%` }}
          >
            {/* ── Report header — scoped to left panel ── */}
            <div className="px-6 py-4 border-b flex-shrink-0 space-y-2">
              {/* Title row */}
              <div className="flex items-start gap-2">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      ref={titleInputRef}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onBlur={commitTitle}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitTitle() }}
                      className="h-8 text-base font-semibold px-2 flex-1"
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0" onClick={commitTitle}>
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1 group">
                    <h2 className="text-base font-semibold leading-snug flex-1">{title}</h2>
                    <button
                      onClick={() => setIsEditingTitle(true)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
                    >
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>

              {/* Timestamp + tags */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span className="text-[11px]">{report ? formatTimestamp(report.createdAt) : '—'}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Tag className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-[11px] px-2 py-0 h-5 gap-1 font-normal cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                      onClick={() => removeTag(tag)}
                    >
                      {tag}
                      <X className="w-2.5 h-2.5" />
                    </Badge>
                  ))}
                  {isAddingTag ? (
                    <Input
                      ref={tagInputRef}
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onBlur={commitTag}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitTag()
                        if (e.key === 'Escape') { setIsAddingTag(false); setTagInput('') }
                      }}
                      placeholder="Tag name…"
                      className="h-5 text-[11px] px-2 w-24 rounded-full"
                    />
                  ) : (
                    <button
                      onClick={() => setIsAddingTag(true)}
                      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded-full hover:bg-muted"
                    >
                      <Plus className="w-3 h-3" />
                      Add tag
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-0 border-b px-4 flex-shrink-0">
              {(['overview', 'heatmap', 'contexts'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => switchTab(tab)}
                  className={`px-4 py-3 text-xs font-medium capitalize border-b-2 transition-colors -mb-px ${activeTab === tab
                      ? 'border-foreground text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div ref={tabContentRef} className="flex-1 overflow-y-auto">
              {/* Error state */}
              {report?.status === 'error' && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Report generation failed</p>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                      {report.errorMessage ?? 'Something went wrong while generating this report.'}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="gap-2" onClick={onClose}>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Close and retry
                  </Button>
                </div>
              )}
              {report && report.status !== 'error' && activeTab === 'overview' && (
                <OverviewTab
                  data={getMockData(report)}
                  report={report}
                  analysisStatus={analysisStatus}
                  onGoToContexts={() => switchTab('contexts')}
                  onConfirmDetails={onConfirmDetails}
                />
              )}
              {report && report.status !== 'error' && activeTab === 'heatmap' && (
                <HeatmapTab data={getMockData(report)} report={report} analysisStatus={analysisStatus} creativeDetails={creativeDetails} />
              )}
              {report && report.status !== 'error' && activeTab === 'contexts' && (
                <ContextsTab
                  data={getMockData(report)}
                  report={report}
                  analysisStatus={analysisStatus}
                  onConfirmDetails={onConfirmDetails}
                />
              )}
            </div>
          </div>

          {/* Divider */}
          <div
            className="relative flex items-center justify-center w-1 flex-shrink-0 cursor-col-resize group"
            onMouseDown={onDividerMouseDown}
          >
            <div className="absolute inset-y-0 w-px bg-border group-hover:bg-border-secondary transition-colors" />
            <div className="relative z-10 flex items-center justify-center w-5 h-8 rounded-full bg-background border shadow-sm group-hover:shadow-md transition-all">
              <GripVertical className="w-3 h-3 text-muted-foreground" />
            </div>
          </div>

          {/* Right: Chat panel */}
          <div
            className="flex flex-col min-h-0 border-l"
            style={{ width: `${(1 - split) * 100}%` }}
          >
            <ChatPanel
              report={report}
              analysisStatus={analysisStatus}
              creativeDetails={creativeDetails}
              reportData={report ? getMockData(report) : null}
            />
          </div>
        </div>
      </div>
    </>
  )
}