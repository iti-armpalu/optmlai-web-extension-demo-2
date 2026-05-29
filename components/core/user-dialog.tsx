'use client'

import { useState, useEffect, useRef } from 'react'
import { X, LogOut, User, CreditCard, BarChart2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UserDialogProps {
    isOpen: boolean
    onClose: () => void
    onLogout: () => void
    onDeleteAccount?: () => void
    onOpenReport?: (id: string) => void
    user: {
        name: string
        email: string
        initials: string
        avatar?: string
        loginMethod?: 'email' | 'google'
    }
    creditBalance: number
}

type Tab = 'account' | 'plans' | 'usage'

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: 'account', label: 'Account', Icon: User },
    { id: 'plans', label: 'Plans & Credits', Icon: CreditCard },
    { id: 'usage', label: 'Usage', Icon: BarChart2 },
]

export function UserDialog({
    isOpen, onClose, onLogout, user,
}: UserDialogProps) {
    const [mounted, setMounted] = useState(false)
    const [tab, setTab] = useState<Tab>('account')
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen) requestAnimationFrame(() => setMounted(true))
        else setMounted(false)
    }, [isOpen])

    useEffect(() => {
        function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose])

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose()
        }
        if (isOpen) document.addEventListener('mousedown', onClickOutside)
        return () => document.removeEventListener('mousedown', onClickOutside)
    }, [isOpen, onClose])

    if (!isOpen && !mounted) return null

    return (
        <div className="fixed inset-0 z-[400]" style={{ pointerEvents: mounted ? 'auto' : 'none' }}>
            <div
                ref={ref}
                className="absolute flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all duration-200"
                style={{
                    bottom: 12, right: 320 + 8,
                    width: 520, height: 480,
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(20px)',
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateX(0) scale(1)' : 'translateX(12px) scale(0.97)',
                    transformOrigin: 'bottom right',
                }}
            >
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-neutral-900 flex items-center justify-center flex-shrink-0">
                            {user.avatar
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                : <span className="text-white text-[10px] font-semibold">{user.initials}</span>
                            }
                        </div>
                        <div>
                            <p className="text-xs font-semibold leading-tight">{user.name}</p>
                            <p className="text-[10px] text-muted-foreground leading-tight">{user.email}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="w-6 h-6" onClick={onClose}>
                        <X className="w-3.5 h-3.5" />
                    </Button>
                </div>

                {/* ── Body ── */}
                <div className="flex flex-1 min-h-0">

                    {/* Left nav */}
                    <div className="w-44 flex flex-col border-r py-2 flex-shrink-0 bg-muted/20">
                        {TABS.map(({ id, label, Icon }) => (
                            <button key={id} onClick={() => setTab(id)}
                                className={`flex items-center gap-2.5 px-4 py-2.5 text-xs transition-colors text-left ${tab === id
                                        ? 'bg-background font-semibold text-foreground'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                                    }`}
                            >
                                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                {label}
                                {tab === id && <ChevronRight className="w-3 h-3 ml-auto opacity-40" />}
                            </button>
                        ))}
                        <div className="flex-1" />
                        <button
                            onClick={() => { onLogout(); onClose() }}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors border-t"
                        >
                            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
                            Sign out
                        </button>
                    </div>

                    {/* Right content — placeholders, follow Andrej's implementation */}
                    <div className="flex-1 overflow-y-auto">

                        {tab === 'account' && (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                                    <User className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Account settings</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Profile, security, password and account management — follow Andrej's implementation.
                                    </p>
                                </div>
                            </div>
                        )}

                        {tab === 'plans' && (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Plans & Credits</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Subscription plans, credit balance, extra credits and billing — follow Andrej's implementation.
                                    </p>
                                </div>
                            </div>
                        )}

                        {tab === 'usage' && (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                                    <BarChart2 className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Usage</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Credit history, usage per report and invoice links — follow Andrej's implementation.
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    )
}