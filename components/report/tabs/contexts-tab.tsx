'use client'

import { useState } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown, Clock, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { MockReportData, ContextCard, ContextChannel, ContextNote } from '../mock-data'
import type { Report } from '../../shared/types'

interface ContextsTabProps {
    data: MockReportData
    report: Report
    analysisStatus: 'pending' | 'complete'
    onConfirmDetails: () => void
}

const STATUS_CONFIG = {
    'run-it': {
        icon: CheckCircle2,
        label: 'Run it',
        description: 'This creative is ready to deploy in this environment without changes.',
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-100',
        badge: 'bg-green-100 text-green-700',
        dot: 'bg-green-500',
    },
    'fix-first': {
        icon: AlertTriangle,
        label: 'Fix first',
        description: 'Specific issues need resolving before this context will perform well.',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-100',
        badge: 'bg-amber-100 text-amber-700',
        dot: 'bg-amber-500',
    },
    'wrong-context': {
        icon: XCircle,
        label: 'Wrong context',
        description: 'This format or environment is fundamentally mismatched with the creative.',
        color: 'text-red-500',
        bg: 'bg-red-50',
        border: 'border-red-100',
        badge: 'bg-red-100 text-red-700',
        dot: 'bg-red-500',
    },
}

const CHANNEL_ORDER: ContextChannel[] = ['Retail', 'E-commerce', 'Social']

const CHANNEL_CONFIG: Record<ContextChannel, { color: string; bg: string }> = {
    'Retail': { color: 'text-purple-700', bg: 'bg-purple-50' },
    'E-commerce': { color: 'text-blue-700', bg: 'bg-blue-50' },
    'Social': { color: 'text-pink-700', bg: 'bg-pink-50' },
}

function InlineCard({ ctx, report }: { ctx: ContextCard; report: Report }) {
    const cfg = STATUS_CONFIG[ctx.status]
    const chCfg = CHANNEL_CONFIG[ctx.channel]
    const Icon = cfg.icon
    const hasImage = report.thumbnailUrl?.startsWith('data:') || report.thumbnailUrl?.startsWith('blob:')
    const [activeObsIndex, setActiveObsIndex] = useState<number | null>(null)
    const activeObs = activeObsIndex !== null ? ctx.notes[activeObsIndex] : null

    return (
        <div className={`border-x border-b ${cfg.border} overflow-hidden shadow-md shadow-black/5 bg-white`}>

            {/* Recommendation header */}
            <div className={`${cfg.bg} px-5 py-4 border-b ${cfg.border}`}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                    <span className={`text-xs font-semibold uppercase tracking-wider ${cfg.color}`}>
                        {cfg.label}
                    </span>
                    <Badge className={`text-[10px] px-2 h-4 border-0 ${chCfg.bg} ${chCfg.color}`}>
                        {ctx.channel}
                    </Badge>
                </div>
                <p className="text-sm leading-relaxed">{ctx.recommendation}</p>
            </div>

            <div className="p-5 space-y-5">

                {/* Audience */}
                <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        What people are doing here
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{ctx.audience}</p>
                </div>

                {/* Fixes for this context */}
                <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Fixes for this context
                    </p>
                    <div className={`grid gap-3 ${hasImage ? 'grid-cols-2' : 'grid-cols-1'}`}>

                        {/* Left — empty state or fix cards */}
                        <div className="space-y-2">
                            {ctx.status === 'run-it' ? (
                                <p className="text-xs text-muted-foreground/50">
                                    This creative is well matched to this environment — no changes required.
                                </p>
                            ) : (
                                ctx.notes.map((obs, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveObsIndex(activeObsIndex === i ? null : i)}
                                        className={`w-full text-left p-3 rounded-lg border transition-colors text-xs ${activeObsIndex === i
                                                ? 'bg-amber-100 border-amber-400 text-amber-900'
                                                : 'bg-amber-50 hover:bg-amber-100 border-amber-100 text-amber-900'
                                            }`}
                                    >
                                        <p className="font-medium mb-1">{obs.label}</p>
                                        <p className="leading-relaxed text-[11px] text-amber-800/80">{obs.detail}</p>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Right — heatmap image always shown */}
                        {hasImage && (
                            <div className="flex flex-col gap-1.5">
                                {/* Image wrapper — relative only around the image so SVG stays within bounds */}
                                <div className="relative rounded-lg overflow-hidden border w-full">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={report.thumbnailUrl}
                                        alt=""
                                        className="w-full h-auto block"
                                        style={{ filter: 'brightness(0.45)' }}
                                    />
                                    <svg
                                        className="absolute inset-0 w-full h-full pointer-events-none"
                                        viewBox="0 0 100 100"
                                        preserveAspectRatio="none"
                                    >
                                        <defs>
                                            <radialGradient id="ctx-hm-1" cx="30%" cy="30%" r="32%">
                                                <stop offset="0%" stopColor="#ccff00" stopOpacity="0.90" />
                                                <stop offset="50%" stopColor="#66ff00" stopOpacity="0.55" />
                                                <stop offset="100%" stopColor="#00aa33" stopOpacity="0" />
                                            </radialGradient>
                                            <radialGradient id="ctx-hm-2" cx="78%" cy="65%" r="26%">
                                                <stop offset="0%" stopColor="#aaff00" stopOpacity="0.75" />
                                                <stop offset="60%" stopColor="#44dd00" stopOpacity="0.35" />
                                                <stop offset="100%" stopColor="#00aa33" stopOpacity="0" />
                                            </radialGradient>
                                            <radialGradient id="ctx-hm-3" cx="20%" cy="83%" r="16%">
                                                <stop offset="0%" stopColor="#00ff88" stopOpacity="0.55" />
                                                <stop offset="100%" stopColor="#009944" stopOpacity="0" />
                                            </radialGradient>
                                        </defs>
                                        <rect width="100%" height="100%" fill="url(#ctx-hm-1)" />
                                        <rect width="100%" height="100%" fill="url(#ctx-hm-2)" />
                                        <rect width="100%" height="100%" fill="url(#ctx-hm-3)" />
                                    </svg>
                                    {activeObs?.boundingBox && (
                                        <div
                                            className="absolute border-2 border-amber-400 bg-amber-400/10 rounded-sm transition-all duration-200"
                                            style={{
                                                left: `${activeObs.boundingBox.x}%`,
                                                top: `${activeObs.boundingBox.y}%`,
                                                width: `${activeObs.boundingBox.w}%`,
                                                height: `${activeObs.boundingBox.h}%`,
                                            }}
                                        >
                                            <div className="absolute -top-1 -left-1 w-2 h-2 bg-amber-400 rounded-full" />
                                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
                                            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-amber-400 rounded-full" />
                                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
                                        </div>
                                    )}
                                </div>
                                {/* Subtle hint below the image */}
                                {ctx.status !== 'run-it' && (
                                    <p className="text-[11px] text-muted-foreground">
                                        Click a fix to highlight it
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Strengths */}
                <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        What's working
                    </p>
                    <ul className="space-y-1">
                        {ctx.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                {s}
                            </li>
                        ))}
                    </ul>
                </div>

            </div>
        </div>
    )
}

export function ContextsTab({ data, report, analysisStatus, onConfirmDetails }: ContextsTabProps) {
    const [openIds, setOpenIds] = useState<Set<string>>(new Set())

    const counts = {
        'run-it': data.contexts.filter(c => c.status === 'run-it').length,
        'fix-first': data.contexts.filter(c => c.status === 'fix-first').length,
        'wrong-context': data.contexts.filter(c => c.status === 'wrong-context').length,
    }

    const grouped = CHANNEL_ORDER.map(channel => ({
        channel,
        items: data.contexts.filter(c => c.channel === channel),
    }))

    function toggleRow(id: string) {
        setOpenIds(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    return (
        <div className="relative">

            {/* Locked overlay when analysis pending */}
            {analysisStatus === 'pending' && (
                <div className="absolute inset-0 z-10">
                    <div className="absolute inset-0 backdrop-blur-md bg-background/75" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-8">
                        <div className="w-10 h-10 rounded-full bg-muted border flex items-center justify-center">
                            <Lock className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-semibold">Confirm creative details to unlock</p>
                            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                                Context analysis requires channel and purpose to evaluate this creative across environments.
                            </p>
                        </div>
                        <button
                            onClick={onConfirmDetails}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-foreground text-background px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
                        >
                            <Lock className="w-3 h-3" />
                            Confirm details
                        </button>
                    </div>
                </div>
            )}

            <div className="p-6 space-y-6">

                {/* ── Summary stats ── */}
                <div className="grid grid-cols-3 gap-3">
                    {(['run-it', 'fix-first', 'wrong-context'] as const).map(s => {
                        const cfg = STATUS_CONFIG[s]
                        const Icon = cfg.icon
                        return (
                            <div key={s} className={`rounded-xl border ${cfg.border} ${cfg.bg} px-4 py-3 flex gap-3`}>
                                <Icon className={`w-5 h-5 flex-shrink-0 ${cfg.color} mt-0.5`} />
                                <div className="min-w-0">
                                    <div className="flex items-baseline gap-1.5">
                                        <p className={`text-xl font-bold tabular-nums ${cfg.color}`}>{counts[s]}</p>
                                        <p className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</p>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{cfg.description}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* ── Accordion table ── */}
                <section className="space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        All contexts
                    </h3>

                    <div className="rounded-xl border overflow-hidden">
                        {/* Table header */}
                        <div className="grid grid-cols-[1fr_auto_auto_auto] bg-muted/50 border-b px-4 py-2.5 text-xs font-medium text-muted-foreground gap-4">
                            <span>Context</span>
                            <span className="hidden sm:block">Exposure</span>
                            <span>Status</span>
                            <span />
                        </div>

                        {grouped.map(({ channel, items }) => (
                            <div key={channel}>
                                {/* Channel header */}
                                <div className="px-4 py-1.5 border-b border-t bg-muted/20">
                                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${CHANNEL_CONFIG[channel].color}`}>
                                        {channel}
                                    </span>
                                </div>

                                {/* Context rows */}
                                {items.map((ctx, i) => {
                                    const cfg = STATUS_CONFIG[ctx.status]
                                    const isOpen = openIds.has(ctx.id)
                                    const isLast = i === items.length - 1

                                    return (
                                        <div key={ctx.id}>
                                            {/* Row */}
                                            <button
                                                onClick={() => toggleRow(ctx.id)}
                                                className={`w-full grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-3 text-left transition-colors ${!isLast || isOpen ? 'border-b' : 'border-b-0'
                                                    } ${isOpen ? 'border-b-0' : 'hover:bg-muted/40 border-b'}`}
                                            >
                                                <div>
                                                    <p className="text-xs font-medium">{ctx.name}</p>
                                                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-tight">
                                                        {ctx.environmentDescription}
                                                    </p>
                                                </div>
                                                <div className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground whitespace-nowrap">
                                                    <Clock className="w-3 h-3" />
                                                    {ctx.exposureTime}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                                                    <span className={`text-xs font-medium ${cfg.color} whitespace-nowrap`}>{cfg.label}</span>
                                                </div>
                                                <ChevronDown
                                                    className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                                />
                                            </button>

                                            {/* Inline expanded card */}
                                            {isOpen && (
                                                <div className="mx-3 mb-3 rounded-xl overflow-hidden shadow-sm border border-border">
                                                    <InlineCard ctx={ctx} report={report} />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    )
}