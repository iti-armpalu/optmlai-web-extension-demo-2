'use client'

import { useState, useEffect, useRef, type RefObject } from 'react'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Crosshair,
  Upload,
  MousePointerClick,
  GalleryHorizontalEnd,
  FileText,
  ChevronRight,
  Settings,
  LogOut,
  Sparkles,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'
import type { Capture, CaptureMethod, Report } from '../shared/types'
import { generateTitle } from '../shared/generate-title'
import { UserDialog } from './user-dialog'

// ── Mock auth state — replace with real auth in Cycle 3 ──
const MOCK_USER = {
  name: 'Alex Morgan',
  email: 'alex@studio.co',
  avatar: '',
  initials: 'AM',
  credits: 5,
}

interface OptmlSidebarProps {
  isOpen: boolean
  onClose: () => void
  captures: Capture[]
  reports: Report[]
  analysisStatus: 'pending' | 'complete'
  activeCapture: Capture | null
  creditBalance: number
  onCapture: (method: CaptureMethod, imageUrl: string, label?: string) => void
  onSelectCapture: (capture: Capture) => void
  onOpenReport: (id: string) => void
  onShowAllReports: () => void
  onRenameReport: (id: string, newName: string) => void
  onDeleteReport: (id: string) => void
  onUploadClick: () => void
  onAreaSelect: () => void
  onFromCaptures: () => void
  fileInputRef: RefObject<HTMLInputElement | null>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
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

function makePlaceholder(label: string): string {
  if (typeof window === 'undefined') return ''
  const c = document.createElement('canvas')
  c.width = 400; c.height = 225
  const ctx = c.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#f4f4f5'; ctx.fillRect(0, 0, 400, 225)
    ctx.strokeStyle = '#d4d4d8'; ctx.lineWidth = 1
    for (let i = 0; i < 400; i += 20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 225); ctx.stroke() }
    for (let j = 0; j < 225; j += 20) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(400, j); ctx.stroke() }
    ctx.fillStyle = '#71717a'; ctx.font = '13px system-ui'; ctx.textAlign = 'center'
    ctx.fillText(label, 200, 112)
  }
  return c.toDataURL('image/png')
}

// ── Auth gate dialog — shown when logged-out user clicks capture ──
function AuthGateDialog({ onClose, onLogin }: { onClose: () => void; onLogin: () => void }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-2xl border shadow-xl p-6 w-80 space-y-4 z-10">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Sign in to capture</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You need an account to run analysis. Get 3 free credits when you sign up.
          </p>
        </div>
        <div className="space-y-2">
          <Button className="w-full h-9 text-sm" onClick={onLogin}>Create account</Button>
          <Button variant="outline" className="w-full h-9 text-sm" onClick={onLogin}>Log in</Button>
        </div>
        <p className="text-[11px] text-muted-foreground text-center">Get 3 free credits on signup</p>
      </div>
    </div>
  )
}

// ── Inline rename row ──
function ReportRow({
  report,
  analysisStatus,
  onOpen,
  onRename,
  onDelete,
}: {
  report: Report
  analysisStatus: 'pending' | 'complete'
  onOpen: () => void
  onRename: (name: string) => void
  onDelete: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(generateTitle(report))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) inputRef.current?.focus()
  }, [isEditing])

  function commitRename() {
    if (editValue.trim()) onRename(editValue.trim())
    setIsEditing(false)
  }

  const statusDot = report.status === 'complete'
    ? analysisStatus === 'complete'
      ? 'bg-green-500'
      : 'bg-amber-400'
    : report.status === 'extracting'
      ? 'bg-amber-400 animate-pulse'
      : 'bg-amber-400'

  return (
    <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/60 transition-colors group">

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
        {/* Status dot overlay on thumbnail */}
        <div className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border border-white ${statusDot}`} />
      </div>

      {/* Meta */}
      <button className="flex-1 min-w-0 text-left" onClick={onOpen}>
        {isEditing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setIsEditing(false) }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="w-full text-xs font-medium bg-transparent border-b border-border outline-none pb-0.5"
          />
        ) : (
          <p className="text-xs font-medium truncate leading-tight">
            {generateTitle(report)}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {report.status === 'extracting' ? 'Extracting…'
            : report.status === 'error' ? 'Failed'
              : formatRelativeTime(report.createdAt)}
        </p>
      </button>

      {/* ··· menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded hover:bg-muted flex-shrink-0">
            <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            className="text-xs gap-2"
            onClick={() => { setEditValue(generateTitle(report)); setIsEditing(true) }}
          >
            <Pencil className="w-3.5 h-3.5" /> Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-xs gap-2 text-destructive focus:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function OptmlSidebar({
  isOpen,
  onClose,
  captures,
  reports,
  analysisStatus,
  activeCapture,
  creditBalance,
  onCapture,
  onSelectCapture,
  onOpenReport,
  onShowAllReports,
  onRenameReport,
  onDeleteReport,
  onUploadClick,
  onAreaSelect,
  onFromCaptures,
  fileInputRef,
  onFileChange,
}: OptmlSidebarProps) {
  const [showAuthGate, setShowAuthGate] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(true)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const latestReports = reports.slice(0, 3)

  // Escape key closes sidebar
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  function guardedCapture(action: () => void) {
    if (!isLoggedIn) { setShowAuthGate(true); return }
    if (creditBalance <= 0) return
    action()
  }

  const captureActions = [
    { label: 'Select area', icon: Crosshair, onClick: () => guardedCapture(onAreaSelect) },
    { label: 'Upload image', icon: Upload, onClick: () => guardedCapture(onUploadClick) },
    { label: 'Select element', icon: MousePointerClick, onClick: () => guardedCapture(() => onCapture('click', makePlaceholder('Select capture'), 'Select capture')) },
    { label: 'From captures', icon: GalleryHorizontalEnd, onClick: () => guardedCapture(onFromCaptures) },
  ]

  return (
    <TooltipProvider delayDuration={300}>

      {showAuthGate && <AuthGateDialog onClose={() => setShowAuthGate(false)} onLogin={() => { setIsLoggedIn(true); setShowAuthGate(false) }} />}

      {/* Backdrop — clicking outside closes */}
      <div
        className="fixed inset-y-0 right-0 z-[49]"
        style={{ left: 320 }}
        onClick={onClose}
        aria-hidden
      />

      {/* Sidebar — full height, floating with inset margins */}
      <div
        className="fixed top-3 bottom-3 right-3 z-50 flex flex-col border shadow-2xl shadow-black/15 overflow-hidden" style={{ width: 300, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)', borderRadius: '16px' }}

        role="dialog"
        aria-modal="true"
      >

        {/* ── Brand Identity Block ── */}
        <div className="px-4 py-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" />
                <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.5" />
                <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.5" />
                <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.25" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight">Optml</span>
            <Badge variant="secondary" className="ml-2 text-[10px] px-2 h-4 font-medium">Beta</Badge>
            <button
              onClick={onClose}
              className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto flex flex-col">

          {/* ── Capture Actions ── */}
          <div className="px-4 pt-4 pb-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2.5">
              New capture
            </p>
            <div className="grid grid-cols-2 gap-2">
              {captureActions.map(({ label, icon: Icon, onClick }) => (
                <Tooltip key={label}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onClick}
                      disabled={isLoggedIn && creditBalance <= 0}
                      className="relative flex flex-col items-center justify-center gap-1.5 rounded-xl border bg-white/70 hover:bg-white transition-colors py-3.5 px-2 text-center group disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground leading-tight transition-colors">
                        {label}
                      </span>

                    </button>
                  </TooltipTrigger>
                  {isLoggedIn && creditBalance <= 0 && (
                    <TooltipContent side="bottom" className="text-xs">No credits remaining</TooltipContent>
                  )}
                </Tooltip>
              ))}
            </div>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFileChange} />
          </div>

          <Separator />

          {/* ── Recent Reports ── */}
          <div className="px-4 pt-3 pb-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Recent reports
              </p>
              {reports.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 h-4">{reports.length}</Badge>
              )}
            </div>

            {/* Logged out — hide reports */}
            {!isLoggedIn ? (
              <p className="text-[11px] text-muted-foreground py-2">
                Sign in to view your reports
              </p>

            ) : reports.length === 0 ? (
              /* Logged in, no reports */
              <div className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl border border-dashed text-center">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-medium">No reports yet</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Capture a creative to get started</p>
                </div>
              </div>

            ) : (
              /* Report rows */
              <>
                {latestReports.map(report => (
                  <div key={report.id}>
                    <ReportRow
                      report={report}
                      analysisStatus={analysisStatus}
                      onOpen={() => onOpenReport(report.id)}
                      onRename={name => onRenameReport(report.id, name)}
                      onDelete={() => onDeleteReport(report.id)}
                    />
                  </div>
                ))}
              </>
            )}

            {/* View all — always visible when logged in */}
            {isLoggedIn && (
              <button
                onClick={onShowAllReports}
                className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-white/60 transition-colors mt-1"
              >
                <span>View all reports {reports.length > 0 && `(${reports.length})`}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── User Block (footer) ── */}
        <div className="border-t flex-shrink-0 p-3 pb-16">
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              {/* Left — opens user actions dialog */}
              <button className="flex items-center gap-2.5 flex-1 min-w-0 px-2 py-2 rounded-xl hover:bg-muted/60 transition-colors text-left cursor-pointer" onClick={() => setShowUserDialog(true)}>
                <Avatar className="h-8 w-8 rounded-lg flex-shrink-0">
                  <AvatarImage src={MOCK_USER.avatar} alt={MOCK_USER.name} />
                  <AvatarFallback className="rounded-lg text-xs bg-neutral-900 text-white">
                    {MOCK_USER.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{MOCK_USER.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {MOCK_USER.email}
                  </p>
                </div>

              </button>

              {/* Right — log out */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/60 transition-colors flex-shrink-0"
                    onClick={() => setIsLoggedIn(false)}
                  >
                    <LogOut className="w-4 h-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">Log out</TooltipContent>
              </Tooltip>
            </div>

          ) : (
            /* Logged out footer */
            <div className="space-y-2 px-1">
              <Button className="w-full h-9 text-sm" onClick={() => setIsLoggedIn(true)}>Sign up</Button>
              <Button variant="outline" className="w-full h-9 text-sm" onClick={() => setIsLoggedIn(true)}>Log in</Button>
              <p className="text-[11px] text-muted-foreground text-center">Get 3 free credits on signup</p>
            </div>
          )}
        </div>
      </div>
      {showUserDialog && isLoggedIn && (
        <UserDialog
          isOpen={showUserDialog}
          onClose={() => setShowUserDialog(false)}
          onLogout={() => { setIsLoggedIn(false); setShowUserDialog(false) }}
          user={MOCK_USER}
          creditBalance={creditBalance}
        />
      )}
    </TooltipProvider>
  )
}