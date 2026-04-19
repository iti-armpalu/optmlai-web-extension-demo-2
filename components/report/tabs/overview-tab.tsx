'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle2, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-bold ${level.color}`}>{level.label}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{level.subtext}</p>
        </div>
    )
}

function FixCard({ fix, isActive, onClick }: { fix: Fix; isActive: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left rounded-lg border transition-colors text-xs ${isActive
                    ? 'bg-amber-100 border-amber-400 text-amber-900'
                    : 'bg-amber-50 hover:bg-amber-100 border-amber-100 text-amber-900'
                }`}
        >
            <div className="p-3">
                <p className="font-medium mb-1">{fix.label}</p>
                <p className="leading-relaxed text-[11px] text-amber-800/80">{fix.summary}</p>
            </div>

            {/* Detail — shown when active */}
            {isActive && (
                <div className="px-3 pb-3 text-[11px] text-amber-800/70 leading-relaxed border-t border-amber-200/60 pt-2.5">
                    {fix.description}
                </div>
            )}
        </button>
    )
}

function ThumbnailWithBoundingBox({ imageUrl, box }: {
    imageUrl: string
    box?: { x: number; y: number; w: number; h: number }
}) {
    return (
        <div className="relative rounded-lg overflow-hidden border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Creative" className="w-full h-auto block" />
            {box && (
                <div
                    className="absolute border-2 border-amber-400 bg-amber-400/10 rounded-sm"
                    style={{
                        left: `${box.x}%`,
                        top: `${box.y}%`,
                        width: `${box.w}%`,
                        height: `${box.h}%`,
                    }}
                >
                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-amber-400 rounded-full" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-amber-400 rounded-full" />
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
                </div>
            )}
        </div>
    )
}

export function OverviewTab({ data, report, analysisStatus, onGoToContexts, onConfirmDetails }: OverviewTabProps) {
    const [activeFix, setActiveFix] = useState<string | null>(null)
    const activeFixData = data.fixes.find(f => f.id === activeFix)
    const readyCount = data.contexts.filter(c => c.status === 'run-it').length

    return (
        <div className="p-6 space-y-8">

            {/* ── Signal cards ── */}
            <section className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Creative health</h3>
                <div className="flex gap-3">
                    <ScoreCard score={data.visualScore} label="Visual impact" type="visual" />
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
                    <span className="text-[11px] text-muted-foreground flex-shrink-0">{data.fixes.length} issues found</span>
                </div>

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
                <div className="grid grid-cols-2 gap-4">
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

                    {/* Thumbnail with bounding box */}
                    <div className="space-y-2">
                        <ThumbnailWithBoundingBox
                            imageUrl={report.thumbnailUrl ?? ''}
                            box={activeFixData?.boundingBox}
                        />
                        {activeFixData ? (
                            <p className="text-[11px] text-muted-foreground">
                                Click a fix to highlight it
                            </p>
                        ) : (
                            <p className="text-[11px] text-muted-foreground">
                                Click a fix to highlight it
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* ── Contexts navigation block ── */}
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
                            See per-placement recommendations, deployment states, and what to fix per channel.
                        </p>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1.5 flex-shrink-0" onClick={onGoToContexts}>
                        View contexts
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </section>
        </div>
    )
}