'use client'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { type RefObject } from 'react'
import {
    Crosshair,
    Upload,
    MousePointerClick,
    GalleryHorizontalEnd,
    FileText,
    ChevronRight,
    ChevronsUpDown,
    Settings,
    LogOut,
    Sparkles,
    MoreHorizontal,
    Pencil,
    Trash2,
} from 'lucide-react'
import type { Capture, CaptureMethod, Report } from '../shared/types'

interface OptmlSidebarProps {
    isOpen: boolean
    onClose: () => void
    captures: Capture[]
    reports: Report[]
    activeCapture: Capture | null
    onCapture: (method: CaptureMethod, imageUrl: string, label?: string) => void
    onSelectCapture: (capture: Capture) => void
    onShowAllReports: () => void
    onRenameReport: (id: string, newName: string) => void
    onDeleteReport: (id: string) => void
    onUploadClick: () => void
    onAreaSelect: () => void
    fileInputRef: RefObject<HTMLInputElement | null>
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const MOCK_USER = {
    name: 'Alex Morgan',
    email: 'alex@studio.co',
    avatar: '',
    initials: 'AM',
}

function formatRelativeTime(date: Date) {
    const diff = Date.now() - date.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
}


// Generates a tiny canvas placeholder data URL for methods without real capture yet
function makePlaceholder(label: string): string {
    if (typeof window === 'undefined') return ''
    const c = document.createElement('canvas')
    c.width = 400; c.height = 225
    const ctx = c.getContext('2d')
    if (ctx) {
        ctx.fillStyle = '#f4f4f5'
        ctx.fillRect(0, 0, 400, 225)
        ctx.strokeStyle = '#d4d4d8'
        ctx.lineWidth = 1
        for (let i = 0; i < 400; i += 20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 225); ctx.stroke() }
        for (let j = 0; j < 225; j += 20) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(400, j); ctx.stroke() }
        ctx.fillStyle = '#71717a'; ctx.font = '13px system-ui'; ctx.textAlign = 'center'
        ctx.fillText(label, 200, 112)
    }
    return c.toDataURL('image/png')
}

export function OptmlSidebar({
    isOpen,
    onClose,
    captures,
    reports,
    activeCapture,
    onCapture,
    onSelectCapture,
    onShowAllReports,
    onRenameReport,
    onDeleteReport,
    onUploadClick,
    onAreaSelect,
    fileInputRef,
    onFileChange,
}: OptmlSidebarProps) {
    if (!isOpen) return null

    const latestReports = reports.slice(0, 3)

    const captureActions = [
        {
            label: 'Select area',
            icon: Crosshair,
            onClick: onAreaSelect,
        },
        {
            label: 'Upload',
            icon: Upload,
            onClick: onUploadClick,
        },
        {
            label: 'Click select',
            icon: MousePointerClick,
            onClick: () => onCapture('click', makePlaceholder('Click capture — coming in Cycle 2'), 'Click capture'),
        },
        {
            label: 'From captures',
            icon: GalleryHorizontalEnd,
            onClick: () => { if (captures[0]) onCapture('saved', captures[0].imageUrl, captures[0].label) },
        },
    ]

    return (
        // Floating card — fixed above the toggle button
        <div className="fixed bottom-[88px] right-6 z-40 w-[300px] max-h-[calc(100vh-7rem)] rounded-xl border bg-background shadow-xl shadow-black/10 flex flex-col overflow-hidden">

            {/* ── Header ── */}
            <div className="px-4 pt-4 pb-3 border-b flex-shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-neutral-900 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                            <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" />
                            <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.5" />
                            <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.5" />
                            <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.25" />
                        </svg>
                    </div>
                    <span className="text-sm font-semibold">Optml</span>
                    <Badge variant="secondary" className="ml-auto text-[10px] px-2 py-0 h-4 font-medium">
                        Beta
                    </Badge>
                </div>
            </div>

            {/* ── Scrollable body ── */}
            <ScrollArea className="flex-1 min-h-0">
                <div className="flex flex-col">

                    {/* ── Capture grid ── */}
                    <div className="px-4 pt-4 pb-3">
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2.5">
                            Get the creative
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {captureActions.map(({ label, icon: Icon, onClick }) => (
                                <button
                                    key={label}
                                    onClick={onClick}
                                    className="flex flex-col items-center justify-center gap-1.5 rounded-lg border bg-background hover:bg-muted transition-colors py-3 px-2 text-center group"
                                >
                                    <Icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                    <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground leading-tight transition-colors">
                                        {label}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={onFileChange}
                        />
                    </div>

                    <Separator />

                    {/* ── Reports section ── */}
                    <div className="px-4 pt-3 pb-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between mb-0.5">
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                Reports
                            </p>
                            {reports.length > 0 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                    {reports.length}
                                </Badge>
                            )}
                        </div>

                        {/* Empty state */}
                        {reports.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-6 rounded-lg border border-dashed text-center">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium">No reports yet</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Capture a creative to generate your first report
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col gap-1.5">
                                    {latestReports.map((report) => (
                                        <div key={report.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted transition-colors group">

                                            {/* Thumbnail */}
                                            <div className="w-9 h-9 rounded-md bg-muted flex-shrink-0 overflow-hidden border relative">
                                                {report.thumbnailUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={report.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <FileText className="w-4 h-4 text-muted-foreground" />
                                                    </div>
                                                )}
                                                {report.status === 'extracting' && (
                                                    <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                                                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Meta — clickable to open report */}
                                            <button
                                                className="flex-1 min-w-0 text-left"
                                                onClick={() => {/* open report */ }}
                                            >
                                                <p className="text-xs font-medium truncate leading-tight">
                                                    {report.label ?? 'Untitled report'}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                                    {report.status === 'extracting' ? 'Extracting…'
                                                        : report.status === 'error' ? 'Failed'
                                                            : formatRelativeTime(report.createdAt)}
                                                </p>
                                            </button>

                                            {/* ··· menu */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded hover:bg-background flex-shrink-0">
                                                        <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem
                                                        className="text-xs gap-2"
                                                        onClick={() => {
                                                            const newName = prompt('Rename report:', report.label ?? '')
                                                            if (newName?.trim()) onRenameReport(report.id, newName.trim())
                                                        }}
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" /> Rename
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-xs gap-2 text-destructive focus:text-destructive"
                                                        onClick={() => onDeleteReport(report.id)}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-xs mt-1 h-8 text-muted-foreground hover:text-foreground"
                                    onClick={onShowAllReports}
                                >
                                    View all reports {reports.length > 0 && `(${reports.length})`}
                                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </ScrollArea>

            {/* ── Footer: User account ── */}
            <div className="border-t flex-shrink-0 p-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted transition-colors text-left">
                            <Avatar className="h-8 w-8 rounded-lg flex-shrink-0">
                                <AvatarImage src={MOCK_USER.avatar} alt={MOCK_USER.name} />
                                <AvatarFallback className="rounded-lg text-xs bg-neutral-900 text-white">
                                    {MOCK_USER.initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate">{MOCK_USER.name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{MOCK_USER.email}</p>
                            </div>
                            <ChevronsUpDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="end" className="w-56 mb-1">
                        <div className="px-2 py-1.5">
                            <p className="text-xs font-semibold">{MOCK_USER.name}</p>
                            <p className="text-[11px] text-muted-foreground">{MOCK_USER.email}</p>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-xs">
                            <Settings className="w-3.5 h-3.5" />
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-xs text-destructive focus:text-destructive">
                            <LogOut className="w-3.5 h-3.5" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}