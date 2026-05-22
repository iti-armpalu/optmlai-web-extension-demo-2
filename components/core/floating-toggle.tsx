'use client'

import { X } from 'lucide-react'

interface FloatingToggleProps {
  isOpen: boolean
  onClick: () => void
}

export function FloatingToggle({ isOpen, onClick }: FloatingToggleProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-2">
      {isOpen ? (
        <button
          onClick={onClick}
          aria-label="Close sidebar"
          className="flex items-center justify-center gap-2 h-10 rounded-xl bg-neutral-900 text-white text-sm font-medium shadow-xl shadow-black/20 hover:bg-neutral-700 active:scale-95 transition-all duration-200"
          style={{ width: 276 }}
        >
          <X className="w-4 h-4" />
          Close sidebar
        </button>
      ) : (
        <button
          onClick={onClick}
          aria-label="Open Optml"
          className="w-12 h-12 rounded-full flex items-center justify-center bg-neutral-900 text-white shadow-xl shadow-black/20 hover:bg-neutral-700 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <svg viewBox="0 0 16 16" fill="none" className="w-5 h-5">
            <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" />
            <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.5" />
            <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.5" />
            <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.25" />
          </svg>
        </button>
      )}
    </div>
  )
}