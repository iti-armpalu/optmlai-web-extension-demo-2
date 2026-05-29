'use client'

import { useState, useMemo, useEffect } from 'react'
import {
    X, Search, Grid3X3, List, Clock, CheckCircle2, AlertCircle,
    MoreHorizontal, Pencil, Trash2, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Report } from '../shared/types'
import { generateTitle } from '../shared/generate-title'

interface AllReportsDrawerProps {
    isOpen: boolean
    onClose: () => void
    reports: Report[]
    onOpenReport: (id: string) => void
    onRenameReport: (id: string, label: string) => void
    onDeleteReport: (id: string) => void
}

type SortOrder = 'newest' | 'oldest' | 'name'
type ViewMode = 'grid' | 'list'

const PAGE_SIZE = 20

function formatDate(date: Date) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit',
    }).format(new Date(date))
}

function StatusBadge({ status }: { status: Report['status'] }) {
    if (status === 'complete') return (
        <span className="flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
            <CheckCircle2 className="w-2.5 h-2.5" /> Complete
        </span>
    )
    if (status === 'error') return (
        <span className="flex items-center gap-1 text-[10px] font-medium text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
            <AlertCircle className="w-2.5 h-2.5" /> Error
        </span>
    )
    return (
        <span className="flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Pending
        </span>
    )
}

function ReportThumbnail({ url, label }: { url?: string; label: string }) {
    const hasImage = url?.startsWith('data:') || url?.startsWith('blob:')
    if (hasImage) return <img src={url} alt={label} className="w-full h-full object-cover" />  // eslint-disable-line
    return (
        <div className="w-full h-full bg-muted flex items-center justify-center">
            <svg viewBox="0 0 16 16" fill="none" className="w-6 h-6">
                <rect x="1" y="1" width="6" height="6" rx="1.5" fill="#ccc" />
                <rect x="9" y="1" width="6" height="6" rx="1.5" fill="#ccc" opacity="0.5" />
                <rect x="1" y="9" width="6" height="6" rx="1.5" fill="#ccc" opacity="0.5" />
                <rect x="9" y="9" width="6" height="6" rx="1.5" fill="#ccc" opacity="0.25" />
            </svg>
        </div>
    )
}

function ContextMenu({ onRename, onDelete }: { onRename: () => void; onDelete: () => void }) {
    const [open, setOpen] = useState(false)
    return (
        <div className="relative" onClick={e => e.stopPropagation()}>
            <button
                onClick={() => setOpen(v => !v)}
                className="w-6 h-6 rounded-md bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
            >
                <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-0" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-7 w-32 rounded-lg border bg-background shadow-lg z-10 py-1 overflow-hidden">
                        <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                            onClick={() => { onRename(); setOpen(false) }}>
                            <Pencil className="w-3 h-3 text-muted-foreground" /> Rename
                        </button>
                        <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => { onDelete(); setOpen(false) }}>
                            <Trash2 className="w-3 h-3" /> Delete
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

function ReportCardGrid({ report, onOpen, onRename, onDelete }: {
    report: Report; onOpen: () => void; onRename: (l: string) => void; onDelete: () => void
}) {
    const [renaming, setRenaming] = useState(false)
    const [val, setVal] = useState(report.label ?? 'Untitled report')
    const label = generateTitle(report)

    return (
        <div className="group rounded-xl border bg-background overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => !renaming && onOpen()}>
            <div className="w-full overflow-hidden bg-muted relative" style={{ aspectRatio: "16/9", minHeight: 180 }}>
                <ReportThumbnail url={report.thumbnailUrl} label={label} />
                <div className="absolute top-2 left-2"><StatusBadge status={report.status} /></div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ContextMenu onRename={() => setRenaming(true)} onDelete={onDelete} />
                </div>
            </div>
            <div className="px-4 py-3.5 space-y-1.5">
                {renaming ? (
                    <Input value={val} autoFocus onChange={e => setVal(e.target.value)}
                        onBlur={() => { onRename(val); setRenaming(false) }}
                        onKeyDown={e => { if (e.key === 'Enter') { onRename(val); setRenaming(false) } if (e.key === 'Escape') setRenaming(false) }}
                        className="h-6 text-xs px-1.5" onClick={e => e.stopPropagation()} />
                ) : (
                    <p className="text-sm font-semibold truncate">{label}</p>
                )}
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                    <Clock className="w-3 h-3" />{formatDate(report.createdAt)}
                </div>
            </div>
        </div>
    )
}

function ReportRowList({ report, onOpen, onRename, onDelete }: {
    report: Report; onOpen: () => void; onRename: (l: string) => void; onDelete: () => void
}) {
    const [renaming, setRenaming] = useState(false)
    const [val, setVal] = useState(report.label ?? 'Untitled report')
    const label = generateTitle(report)

    return (
        <div className="group flex items-center gap-3 px-5 py-3 border-b last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors"
            onClick={() => !renaming && onOpen()}>
            <div className="w-14 h-9 rounded-md overflow-hidden flex-shrink-0 border bg-muted">
                <ReportThumbnail url={report.thumbnailUrl} label={label} />
            </div>
            <div className="flex-1 min-w-0">
                {renaming ? (
                    <Input value={val} autoFocus onChange={e => setVal(e.target.value)}
                        onBlur={() => { onRename(val); setRenaming(false) }}
                        onKeyDown={e => { if (e.key === 'Enter') { onRename(val); setRenaming(false) } if (e.key === 'Escape') setRenaming(false) }}
                        className="h-6 text-xs px-1.5" onClick={e => e.stopPropagation()} />
                ) : (
                    <p className="text-xs font-medium truncate">{label}</p>
                )}
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                    <Clock className="w-2.5 h-2.5" />{formatDate(report.createdAt)}
                </div>
            </div>
            <StatusBadge status={report.status} />
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ContextMenu onRename={() => setRenaming(true)} onDelete={onDelete} />
            </div>
        </div>
    )
}

export function AllReportsDrawer({
    isOpen, onClose, reports, onOpenReport, onRenameReport, onDeleteReport,
}: AllReportsDrawerProps) {
    const [mounted, setMounted] = useState(false)
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState<SortOrder>('newest')
    const [view, setView] = useState<ViewMode>('grid')
    const [page, setPage] = useState(1)

    // Slide animation — same pattern as ReportDrawer
    useEffect(() => {
        if (isOpen) requestAnimationFrame(() => setMounted(true))
        else setMounted(false)
    }, [isOpen])

    // Escape closes
    useEffect(() => {
        function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose])

    const filtered = useMemo(() => {
        let list = [...reports]
        if (search.trim()) {
            const q = search.toLowerCase()
            list = list.filter(r => (r.label ?? 'Untitled report').toLowerCase().includes(q))
        }
        if (sort === 'newest') list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        else if (sort === 'oldest') list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        else list.sort((a, b) => (a.label ?? '').localeCompare(b.label ?? ''))
        return list
    }, [reports, search, sort])

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    if (!isOpen && !mounted) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px] transition-opacity duration-300"
                style={{ opacity: mounted ? 1 : 0 }}
                onClick={onClose}
            />

            {/* Drawer — same shell as ReportDrawer */}
            <div
                className="fixed inset-y-0 right-0 z-[61] flex flex-col border-l shadow-2xl transition-transform duration-300 ease-out backdrop-blur-xl"
                style={{
                    width: 'calc(100vw - 48px)',
                    maxWidth: 1280,
                    transform: mounted ? 'translateX(0)' : 'translateX(100%)',
                    background: 'rgba(255,255,255,0.82)',
                }}
            >
                {/* ── Top bar ── */}
                <div className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0 bg-muted/30">
                    {/* Logo */}
                    <div className="w-5 h-5 rounded bg-neutral-900 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3">
                            <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" />
                            <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.5" />
                            <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.5" />
                            <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.25" />
                        </svg>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">All reports</span>
                    <span className="text-xs text-muted-foreground/50">{reports.length}</span>

                    <div className="flex-1" />

                    {/* Close */}
                    <div className="w-px h-4 bg-border" />
                    <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors">
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="flex flex-1 min-h-0">
                    <div className="flex-1 flex flex-col min-w-0">

                        {/* Toolbar */}
                        <div className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0 bg-background/60">
                            {/* Search */}
                            <div className="relative flex-1 max-w-xs">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                                    placeholder="Search reports…" className="h-8 pl-8 text-xs" />
                                {search && (
                                    <button onClick={() => { setSearch(''); setPage(1) }} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                        <X className="w-3 h-3 text-muted-foreground" />
                                    </button>
                                )}
                            </div>

                            <div className="flex-1" />

                            {/* Sort */}
                            <select value={sort} onChange={e => { setSort(e.target.value as SortOrder); setPage(1) }}
                                className="h-8 text-xs border rounded-md px-2 bg-background text-foreground">
                                <option value="newest">Newest first</option>
                                <option value="oldest">Oldest first</option>
                                <option value="name">Name A–Z</option>
                            </select>

                            {/* View toggle */}
                            <div className="flex items-center border rounded-md overflow-hidden">
                                {([['grid', Grid3X3], ['list', List]] as const).map(([v, Icon]) => (
                                    <button key={v} onClick={() => setView(v as ViewMode)}
                                        className={`w-8 h-8 flex items-center justify-center transition-colors ${view === v ? 'bg-foreground text-background' : 'hover:bg-muted'}`}>
                                        <Icon className="w-3.5 h-3.5" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {reports.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                                    <p className="text-sm font-medium">No reports yet</p>
                                    <p className="text-xs text-muted-foreground">Capture something to get started</p>
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-2">
                                    <p className="text-sm text-muted-foreground">No reports match your search.</p>
                                    <button onClick={() => setSearch('')} className="text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground">
                                        Clear search
                                    </button>
                                </div>
                            ) : view === 'grid' ? (
                                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {paginated.map(r => (
                                        <ReportCardGrid key={r.id} report={r}
                                            onOpen={() => { onOpenReport(r.id); onClose() }}
                                            onRename={l => onRenameReport(r.id, l)}
                                            onDelete={() => onDeleteReport(r.id)} />
                                    ))}
                                </div>
                            ) : (
                                <div>
                                    {paginated.map(r => (
                                        <ReportRowList key={r.id} report={r}
                                            onOpen={() => { onOpenReport(r.id); onClose() }}
                                            onRename={l => onRenameReport(r.id, l)}
                                            onDelete={() => onDeleteReport(r.id)} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 px-5 py-3 border-t flex-shrink-0">
                                <Button size="sm" variant="outline" className="h-7 w-7 p-0"
                                    disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </Button>
                                <span className="text-xs text-muted-foreground tabular-nums">Page {page} of {totalPages}</span>
                                <Button size="sm" variant="outline" className="h-7 w-7 p-0"
                                    disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}