'use client'

import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LockedOverlayProps {
    onConfirm: () => void
}

export function LockedOverlay({ onConfirm }: LockedOverlayProps) {
    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
            {/* Blur + dim layer */}
            <div className="absolute inset-0 backdrop-blur-md bg-background/60" />

            {/* Message card */}
            <div className="relative z-10 flex flex-col items-center gap-3 text-center px-8 max-w-xs">
                <div className="w-10 h-10 rounded-full bg-muted border flex items-center justify-center">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-semibold">Confirm creative details</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Tell us the channel, purpose, and key elements to unlock the full analysis.
                    </p>
                </div>
                <Button size="sm" onClick={onConfirm} className="gap-2 mt-1">
                    <Lock className="w-3.5 h-3.5" />
                    Confirm details
                </Button>
            </div>
        </div>
    )
}