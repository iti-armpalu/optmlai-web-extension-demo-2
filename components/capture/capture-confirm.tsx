'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { X, Zap, Coins, ImageIcon, Loader2, CheckCircle2 } from 'lucide-react'

interface CaptureConfirmProps {
    imageUrl: string
    creditBalance: number
    isProcessing: boolean
    onConfirm: () => void
    onDiscard: () => void
}

export function CaptureConfirm({
    imageUrl,
    creditBalance,
    isProcessing,
    onConfirm,
    onDiscard,
}: CaptureConfirmProps) {
    const hasCredits = creditBalance > 0
    const [imgError, setImgError] = useState(false)
    const isDisplayable = imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')

    return (
        <div className="fixed bottom-[88px] right-[316px] z-40 w-[280px] rounded-xl border bg-background shadow-xl shadow-black/10 flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-3 pt-3 pb-2">
                <span className="text-xs font-semibold">
                    {isProcessing ? 'Analysing capture…' : 'Preview capture'}
                </span>
                {!isProcessing && (
                    <button
                        onClick={onDiscard}
                        className="w-5 h-5 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Image preview */}
            <div className="mx-3 overflow-hidden border bg-muted relative flex items-center justify-center">
                {isDisplayable && !imgError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imageUrl}
                        alt="Captured creative"
                        className="w-full h-auto block"
                        style={{ maxHeight: 180, objectFit: 'contain' }}
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground py-8 w-full">
                        <ImageIcon className="w-6 h-6" />
                        <span className="text-[11px]">Preview unavailable</span>
                    </div>
                )}

                {/* Processing overlay on the image */}
                {isProcessing && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-foreground" />
                        <span className="text-[11px] font-medium text-foreground">Extracting metadata…</span>
                    </div>
                )}
            </div>

            <Separator className="mt-3" />

            <div className="px-3 py-3 flex flex-col gap-3">

                {/* Processing steps — visible during extraction */}
                {isProcessing ? (
                    <div className="flex flex-col gap-2">
                        <TimedSteps />
                    </div>
                ) : (
                    <>
                        {/* Credit notice */}
                        <div className="flex items-start gap-2.5 rounded-lg bg-muted/60 px-3 py-2.5">
                            <Coins className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] text-muted-foreground leading-snug">
                                    Running this report uses{' '}
                                    <span className="font-semibold text-foreground">1 credit</span>.
                                    You have{' '}
                                    <span className={`font-semibold ${hasCredits ? 'text-foreground' : 'text-destructive'}`}>
                                        {creditBalance} credit{creditBalance !== 1 ? 's' : ''}
                                    </span>{' '}
                                    remaining.
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-1.5">
                            <Button
                                className="w-full h-9 gap-2 text-xs font-semibold"
                                onClick={onConfirm}
                                disabled={!hasCredits}
                            >
                                <Zap className="w-3.5 h-3.5" />
                                Run report
                                <Badge
                                    variant="secondary"
                                    className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-white/20 text-white border-0"
                                >
                                    1 credit
                                </Badge>
                            </Button>

                            {!hasCredits && (
                                <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                                    Buy credits
                                </Button>
                            )}

                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
                                onClick={onDiscard}
                            >
                                Discard
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

const STEPS = [
    'Detecting elements',
    'Analysing layout structure',
    'Inferring intent & channel',
    'Preparing report',
]

const STEP_DURATION = 900 // ms per step

function TimedSteps() {
    const [activeStep, setActiveStep] = useState(0)

    useEffect(() => {
        if (activeStep >= STEPS.length - 1) return
        const t = setTimeout(() => setActiveStep((s) => s + 1), STEP_DURATION)
        return () => clearTimeout(t)
    }, [activeStep])

    return (
        <>
            {STEPS.map((label, i) => {
                const done = i < activeStep
                const loading = i === activeStep
                const pending = i > activeStep
                return (
                    <ProcessingStep key={label} label={label} done={done} loading={loading} pending={pending} />
                )
            })}
        </>
    )
}

function ProcessingStep({
    label,
    done,
    loading,
    pending,
}: {
    label: string
    done?: boolean
    loading?: boolean
    pending?: boolean
}) {
    return (
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                {done && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />}
                {pending && <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
            </div>
            <span className={`text-[11px] transition-colors duration-300 ${done ? 'text-foreground' : loading ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                {label}
            </span>
        </div>
    )
}