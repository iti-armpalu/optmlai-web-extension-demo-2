'use client'

import {
  Comparison,
  ComparisonItem,
  ComparisonHandle,
} from '@/components/ui/image-comparison'
import type { MockReportData } from '../mock-data'
import type { Report } from '../../shared/types'

interface HeatmapTabProps {
  data: MockReportData
  report: Report
  analysisStatus: 'pending' | 'complete'
}

function HeatmapOverlaySvg() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <radialGradient id="hm-headline" cx="30%" cy="30%" r="32%">
          <stop offset="0%" stopColor="#ccff00" stopOpacity="0.92" />
          <stop offset="30%" stopColor="#66ff00" stopOpacity="0.70" />
          <stop offset="65%" stopColor="#00cc44" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#00aa33" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hm-visual" cx="78%" cy="65%" r="26%">
          <stop offset="0%" stopColor="#aaff00" stopOpacity="0.80" />
          <stop offset="40%" stopColor="#44dd00" stopOpacity="0.50" />
          <stop offset="100%" stopColor="#00aa33" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hm-cta" cx="20%" cy="83%" r="16%">
          <stop offset="0%" stopColor="#00ff88" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#00cc66" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#009944" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hm-bg" cx="55%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#003311" stopOpacity="0.20" />
          <stop offset="100%" stopColor="#001a08" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#hm-bg)" />
      <rect width="100%" height="100%" fill="url(#hm-cta)" />
      <rect width="100%" height="100%" fill="url(#hm-visual)" />
      <rect width="100%" height="100%" fill="url(#hm-headline)" />
    </svg>
  )
}

const INTENSITY_SCALE = [
  { label: 'Very high', sub: '>80%' },
  { label: 'High', sub: '60–80%' },
  { label: 'Medium', sub: '40–60%' },
  { label: 'Low', sub: '20–40%' },
  { label: 'Very low', sub: '<20%' },
]

export function HeatmapTab({ data, report, analysisStatus }: HeatmapTabProps) {
  const hasImage = report.thumbnailUrl?.startsWith('data:') || report.thumbnailUrl?.startsWith('blob:')

  return (
    <div className="p-6 space-y-6">

      {/* ── Key insight ── */}
      <div className="rounded-xl border bg-muted/40 px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
          Key insight
        </p>
        <p className="text-sm leading-relaxed text-foreground">{data.heatmapInsight}</p>
      </div>

      {/* ── Attention overlay ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Attention overlay
          </h3>
          <span className="text-[11px] text-muted-foreground">Drag to compare</span>
        </div>

        {hasImage ? (
          <div className="relative w-full overflow-hidden rounded-xl border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={report.thumbnailUrl} alt="" className="w-full h-auto block invisible" aria-hidden />
            <Comparison className="absolute inset-0 w-full h-full" mode="drag">
              <ComparisonItem position="left">
                <div className="absolute inset-0 w-full h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={report.thumbnailUrl}
                    alt="Heatmap"
                    className="w-full h-full object-cover"
                    style={{ filter: 'brightness(0.45)' }}
                  />
                  <HeatmapOverlaySvg />
                </div>
              </ComparisonItem>
              <ComparisonItem position="right">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={report.thumbnailUrl}
                  alt="Original creative"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </ComparisonItem>
              <ComparisonHandle />
            </Comparison>
          </div>
        ) : (
          <div className="rounded-xl border bg-muted flex items-center justify-center h-48">
            <p className="text-sm text-muted-foreground">No image available for heatmap analysis.</p>
          </div>
        )}


      </div>

      {/* ── Intensity scale ── */}
      <div className="space-y-2">
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Intensity scale
          </h3>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">
            Based on predicted likelihood of fixation.
          </p>
        </div>
        <div className="flex justify-between px-0.5">
          {INTENSITY_SCALE.map(({ label, sub }) => (
            <div key={label} className="flex flex-col items-center gap-0.5" style={{ width: '20%' }}>
              <p className="text-[10px] font-medium text-center">{label}</p>
              <p className="text-[9px] text-muted-foreground text-center">{sub}</p>
            </div>
          ))}
        </div>
        <div
          className="w-full h-1.5 rounded-full"
          style={{ background: 'linear-gradient(to right, #ccff00, #66ff00, #00cc44, #00ff88, #003311)' }}
        />
      </div>
    </div>
  )
}