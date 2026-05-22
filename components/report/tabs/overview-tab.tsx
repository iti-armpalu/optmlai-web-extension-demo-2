'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle2, Lock, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import type { MockReportData, Fix } from '../mock-data'
import type { Report } from '../../shared/types'

interface OverviewTabProps {
    data: MockReportData
    report: Report
    analysisStatus: 'pending' | 'complete'
    onGoToContexts: () => void
    onConfirmDetails: () => void
}

const SCORE_LEVELS = {
    visual: {
        high: { label: 'High', color: 'text-green-600', subtext: 'Creative can stop attention. Problems here are placement-driven, not structural.' },
        medium: { label: 'Medium', color: 'text-amber-600', subtext: 'Attention capture is inconsistent. Some contexts will lose this creative in the noise.' },
        low: { label: 'Low', color: 'text-red-500', subtext: 'Creative is not stopping attention. Fix structure before optimising placement.' },
    },
    cognitive: {
        high: { label: 'High', color: 'text-green-600', subtext: 'Message is clear and fast to process. Cognitive load is not your problem.' },
        medium: { label: 'Medium', color: 'text-amber-600', subtext: 'Message requires effort to process. You are losing fast-scroll audiences.' },
        low: { label: 'Low', color: 'text-red-500', subtext: 'Message is unclear or overloaded. Fix clarity before worrying about placement.' },
    },
}

const SCORE_TOOLTIPS = {
    visual: 'Measures predicted attention capture based on saliency modelling — how well the creative stops the eye.',
    cognitive: 'Measures how quickly and clearly the message can be processed — how easy it is to understand what the creative is saying.',
}

function scoreLevel(score: number, type: 'visual' | 'cognitive') {
    const levels = SCORE_LEVELS[type]
    if (score >= 70) return levels.high
    if (score >= 50) return levels.medium
    return levels.low
}

function ScoreCard({ score, label, type }: { score: number; label: string; type: 'visual' | 'cognitive' }) {
    const level = scoreLevel(score, type)
    return (
        <div className="flex-1 px-5 py-4 rounded-xl border bg-background space-y-1.5">
            <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
                <TooltipProvider delayDuration={200}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                                <Info className="w-3 h-3" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px] text-xs leading-relaxed z-[300]">
                            {SCORE_TOOLTIPS[type]}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <p className={`text-2xl font-bold ${level.color}`}>{level.label}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{level.subtext}</p>
        </div>
    )
}

const SEVERITY_STYLES = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-blue-100 text-blue-700',
}

const FIX_SEVERITY_STYLES = {
    high: { base: 'bg-red-50 border-red-100 text-red-900', active: 'bg-red-100 border-red-400 text-red-900', detail: 'text-red-800/70 border-red-200/60' },
    medium: { base: 'bg-amber-50 border-amber-100 text-amber-900', active: 'bg-amber-100 border-amber-400 text-amber-900', detail: 'text-amber-800/70 border-amber-200/60' },
    low: { base: 'bg-blue-50 border-blue-100 text-blue-900', active: 'bg-blue-100 border-blue-400 text-blue-900', detail: 'text-blue-800/70 border-blue-200/60' },
}

function FixCard({ fix, isActive, onClick }: { fix: Fix; isActive: boolean; onClick: () => void }) {
    const styles = FIX_SEVERITY_STYLES[fix.severity] ?? FIX_SEVERITY_STYLES.medium
    return (
        <button
            onClick={onClick}
            className={`w-full text-left rounded-lg border transition-colors text-xs ${isActive ? styles.active : styles.base + ' hover:opacity-90'}`}
        >
            <div className="p-3">
                <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium flex-1">{fix.label}</p>
                    {fix.severity && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize flex-shrink-0 ${SEVERITY_STYLES[fix.severity] ?? ''}`}>
                            {fix.severity}
                        </span>
                    )}
                </div>
                <p className={`leading-relaxed text-[11px] opacity-80`}>{fix.summary}</p>
            </div>
            {isActive && (
                <div className={`px-3 pb-3 text-[11px] leading-relaxed border-t pt-2.5 opacity-70 ${styles.detail}`}>
                    {fix.description}
                </div>
            )}
        </button>
    )
}

export function OverviewTab({ data, report, analysisStatus, onGoToContexts, onConfirmDetails }: OverviewTabProps) {
    const [activeFix, setActiveFix] = useState<string | null>(null)
    const activeFixData = data.fixes.find(f => f.id === activeFix)
    const readyCount = data.contexts.filter(c => c.status === 'run-it').length
    const hasImage = !!report.thumbnailUrl

    return (
        <div className="p-6 space-y-8">

            {/* ── Creative health ── */}
            <section className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Creative health</h3>
                <div className="flex gap-3">
                    {/* Visual impact — always unlocked */}
                    <ScoreCard score={data.visualScore} label="Visual impact" type="visual" />

                    {/* Cognitive impact — locked when pending */}
                    <div className="relative flex-1">
                        <ScoreCard score={data.cognitiveScore} label="Cognitive impact" type="cognitive" />
                        {analysisStatus === 'pending' && (
                            <div className="absolute inset-0 rounded-xl overflow-hidden">
                                <div className="absolute inset-0 backdrop-blur-md bg-background/70 flex flex-col items-center justify-center gap-2 p-3 text-center">
                                    <Lock className="w-4 h-4 text-muted-foreground" />
                                    <p className="text-[11px] text-muted-foreground leading-snug">Confirm creative details to unlock</p>
                                    <button onClick={onConfirmDetails} className="text-[11px] font-medium underline underline-offset-2 text-foreground">
                                        Confirm details
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ── Creative fixes ── */}
            <section className="space-y-3 relative">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Creative fixes
                        </h3>
                        <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                            Structural issues that affect performance everywhere, regardless of placement.
                        </p>
                    </div>
                    {data.fixes.length > 0 && (
                        <span className="text-[11px] text-muted-foreground flex-shrink-0">{data.fixes.length} fixes</span>
                    )}
                </div>

                {/* Pending lock overlay */}
                {analysisStatus === 'pending' && (
                    <div className="absolute inset-0 z-10 rounded-xl overflow-hidden">
                        <div className="absolute inset-0 backdrop-blur-md bg-background/70 flex flex-col items-center justify-center gap-2 text-center p-4">
                            <Lock className="w-4 h-4 text-muted-foreground" />
                            <p className="text-sm font-medium">Confirm creative details to unlock</p>
                            <p className="text-xs text-muted-foreground">Channel and purpose are needed to generate context-specific fixes.</p>
                            <button onClick={onConfirmDetails} className="mt-1 text-xs font-semibold underline underline-offset-2">
                                Confirm details
                            </button>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {data.fixes.length === 0 ? (
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-green-100 bg-green-50">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <p className="text-xs text-green-700">No structural issues detected — this creative is structurally sound.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 items-start">
                        {/* Fix list */}
                        <div className="space-y-2">
                            {data.fixes.map(fix => (
                                <FixCard
                                    key={fix.id}
                                    fix={fix}
                                    isActive={activeFix === fix.id}
                                    onClick={() => setActiveFix(activeFix === fix.id ? null : fix.id)}
                                />
                            ))}
                        </div>

                        {/* Thumbnail — sticky */}
                        {hasImage && (
                            <div className="sticky top-4 space-y-1.5">
                                <div className="relative rounded-lg overflow-hidden border bg-muted">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={report.thumbnailUrl} alt="Creative" className="w-full h-auto block" />
                                    {activeFixData?.boundingBox && (
                                        <div
                                            className="absolute border-2 border-amber-400 bg-amber-400/10 rounded-sm transition-all duration-200"
                                            style={{
                                                left: `${activeFixData.boundingBox.x}%`,
                                                top: `${activeFixData.boundingBox.y}%`,
                                                width: `${activeFixData.boundingBox.w}%`,
                                                height: `${activeFixData.boundingBox.h}%`,
                                            }}
                                        >
                                            <div className="absolute -top-1 -left-1 w-2 h-2 bg-amber-400 rounded-full" />
                                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
                                            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-amber-400 rounded-full" />
                                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    {activeFixData?.boundingBox ? 'Showing affected area' : 'Click a fix to highlight it'}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* ── Navigate to Contexts — only when complete ── */}
            {analysisStatus === 'complete' && (
                <section>
                    <div className="rounded-xl border bg-muted/30 p-4 flex items-center gap-4">
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <p className="text-sm font-semibold">
                                    {readyCount} of {data.contexts.length} contexts ready to run
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                See how this creative performs across placements — per-channel recommendations and what to fix per context.
                            </p>
                        </div>
                        <Button size="sm" variant="outline" className="gap-1.5 flex-shrink-0" onClick={onGoToContexts}>
                            View contexts
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </section>
            )}
        </div>
    )
}