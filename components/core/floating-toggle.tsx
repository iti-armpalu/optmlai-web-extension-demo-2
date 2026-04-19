'use client'

import { Button } from '@/components/ui/button'
import { ScanSearch, X } from 'lucide-react'

interface FloatingToggleProps {
    isOpen: boolean
    onClick: () => void
}

export function FloatingToggle({ isOpen, onClick }: FloatingToggleProps) {
    return (
        <Button
            onClick={onClick}
            aria-label={isOpen ? 'Close Optml' : 'Open Optml'}
            className={`
        fixed bottom-6 right-6 z-50
        shadow-lg shadow-black/20
        transition-all duration-200
        hover:scale-105 active:scale-95
        bg-neutral-900 text-white hover:bg-neutral-700
        ${isOpen
                    ? 'h-10 w-10 rounded-full p-0'
                    : 'h-12 rounded-full px-5 gap-2'
                }
      `}
        >
            {isOpen ? (
                <X className="w-4 h-4" />
            ) : (
                <>
                    <ScanSearch className="w-4 h-4" />
                    <span className="text-sm font-medium">Optml</span>
                </>
            )}
        </Button>
    )
}