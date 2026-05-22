'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ExternalLink, LogOut, Zap, User, CreditCard, BarChart2, ChevronRight, AlertTriangle, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UserDialogProps {
    isOpen: boolean
    onClose: () => void
    onLogout: () => void
    onDeleteAccount?: () => void
    user: {
        name: string
        email: string
        initials: string
        avatar?: string
    }
    creditBalance: number
}

type Tab = 'account' | 'plans' | 'usage'

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: 'account', label: 'Account', Icon: User },
    { id: 'plans', label: 'Plans & Credits', Icon: CreditCard },
    { id: 'usage', label: 'Usage', Icon: BarChart2 },
]

const STRIPE_BILLING = 'https://billing.stripe.com/p/login/test_bJe7sN75Hdqwb77eVVcV200'
const SIGNUP_BONUS = 3 // free credits given on signup

const PLANS = [
    { id: 'starter', name: 'Starter', credits: 8, price: '$5', desc: 'per month' },
    { id: 'standard', name: 'Standard', credits: 30, price: '$15', desc: 'per month' },
    { id: 'growth', name: 'Growth', credits: 125, price: '$50', desc: 'per month' },
]

// Set to false to simulate free user with signup credits only — no active plan
const MOCK_HAS_PLAN = true
// Set to false once signup bonus is fully consumed — max reverts to plan.credits only
const MOCK_SIGNUP_BONUS_REMAINING = true

const MOCK_CURRENT_PLAN = {
    id: 'standard',
    name: 'Standard',
    credits: 30,
    creditsUsed: 8,
    resetDate: 'Jun 1, 2026',
}

// Mock usage line items
const MOCK_LINE_ITEMS = [
    { label: 'Signup bonus', date: 'Jan 10, 2026', credits: +3, type: 'bonus' },
    { label: 'E-commerce Conversion Ad — Square', date: 'May 20, 2026', credits: -1, type: 'usage' },
    { label: 'Brand Awareness Campaign — Landscape', date: 'May 18, 2026', credits: -1, type: 'usage' },
    { label: 'Product Launch Creative — Story', date: 'May 15, 2026', credits: -1, type: 'usage' },
    { label: 'E-commerce Conversion Ad — Banner', date: 'May 12, 2026', credits: -1, type: 'usage' },
    { label: 'Standard plan — May 2026', date: 'May 1,  2026', credits: +30, type: 'plan' },
    { label: 'Brand Awareness Campaign — Square', date: 'Apr 29, 2026', credits: -1, type: 'usage' },
    { label: 'Standard plan — Apr 2026', date: 'Apr 1,  2026', credits: +30, type: 'plan' },
]

export function UserDialog({
    isOpen, onClose, onLogout, onDeleteAccount, user, creditBalance,
}: UserDialogProps) {
    const [mounted, setMounted] = useState(false)
    const [tab, setTab] = useState<Tab>('account')
    const [feedbackOpen, setFeedbackOpen] = useState(false)
    const [feedbackText, setFeedbackText] = useState('')
    const [feedbackSent, setFeedbackSent] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    // Dev-only credit scenario switcher
    const [devCredits, setDevCredits] = useState<number | null>(null)
    const [devHasPlan, setDevHasPlan] = useState<boolean | null>(null)
    const displayCredits = devCredits !== null ? devCredits : creditBalance
    const hasPlan = devHasPlan !== null ? devHasPlan : MOCK_HAS_PLAN
    const creditColor = displayCredits > 3 ? 'text-foreground' : displayCredits > 0 ? 'text-amber-600' : 'text-red-500'
    const plan = MOCK_CURRENT_PLAN
    // Signup bonus only counts toward max while it hasn't been fully consumed
    const creditMax = hasPlan ? plan.credits + (MOCK_SIGNUP_BONUS_REMAINING ? SIGNUP_BONUS : 0) : SIGNUP_BONUS
    const creditsRemaining = displayCredits

    useEffect(() => {
        if (isOpen) requestAnimationFrame(() => setMounted(true))
        else {
            setMounted(false)
            setFeedbackOpen(false); setFeedbackSent(false); setFeedbackText('')
            setDeleteConfirm(false)
        }
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

    function handleFeedbackSubmit() {
        if (!feedbackText.trim()) return
        setFeedbackSent(true)
        setTimeout(() => { setFeedbackOpen(false); setFeedbackText(''); setFeedbackSent(false) }, 1500)
    }

    if (!isOpen && !mounted) return null

    return (
        <div className="fixed inset-0 z-[400]" style={{ pointerEvents: mounted ? 'auto' : 'none' }}>
            <div
                ref={ref}
                className="absolute flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all duration-200"
                style={{
                    bottom: 12,
                    right: 320 + 8,
                    width: 580,
                    height: 580,
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
                            {user.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <span className="text-white text-[10px] font-semibold">{user.initials}</span>
                            )}
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
                    <div className="w-48 flex flex-col border-r py-2 flex-shrink-0 bg-muted/20">
                        {TABS.map(({ id, label, Icon }) => (
                            <button
                                key={id}
                                onClick={() => setTab(id)}
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

                        {/* Feedback button */}
                        {!feedbackOpen ? (
                            <button
                                onClick={() => setFeedbackOpen(true)}
                                className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors border-t"
                            >
                                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                                Give feedback
                            </button>
                        ) : (
                            <div className="px-3 py-3 border-t space-y-2">
                                {feedbackSent ? (
                                    <p className="text-xs text-green-600 font-medium px-1">Thanks!</p>
                                ) : (
                                    <>
                                        <textarea
                                            value={feedbackText}
                                            onChange={e => setFeedbackText(e.target.value)}
                                            placeholder="What's on your mind?"
                                            rows={2}
                                            autoFocus
                                            className="w-full text-xs px-2 py-1.5 rounded-lg border bg-background resize-none outline-none focus:ring-1 focus:ring-border leading-relaxed"
                                        />
                                        <div className="flex gap-1">
                                            <Button variant="outline" size="sm" className="h-6 text-[10px] flex-1 px-1"
                                                onClick={() => { setFeedbackOpen(false); setFeedbackText('') }}>Cancel</Button>
                                            <Button size="sm" className="h-6 text-[10px] flex-1 px-1"
                                                disabled={!feedbackText.trim()} onClick={handleFeedbackSubmit}>Send</Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => { onLogout(); onClose() }}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
                            Sign out
                        </button>
                    </div>

                    {/* Right content */}
                    <div className="flex-1 overflow-y-auto">

                        {/* ── Account ── */}
                        {tab === 'account' && (
                            <div className="p-5 space-y-5">

                                {/* Profile */}
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Profile</p>
                                    <div className="flex items-center gap-3 p-3 rounded-xl border bg-background/60">
                                        <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center flex-shrink-0">
                                            <span className="text-white text-sm font-semibold">{user.initials}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold">{user.name}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                                            onClick={() => window.open('https://optml.ai/account', '_blank')}>
                                            Edit <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Danger zone */}
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-red-500 mb-3">Danger zone</p>
                                    <div className="rounded-xl border border-red-100 bg-red-50/40 p-3 space-y-2">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-xs font-medium text-red-700">Delete account</p>
                                                <p className="text-[10px] text-red-500/80 leading-snug mt-0.5">
                                                    Permanently deletes your account, all reports, and remaining credits. This cannot be undone.
                                                </p>
                                            </div>
                                        </div>
                                        {!deleteConfirm ? (
                                            <Button variant="outline" size="sm"
                                                className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 w-full"
                                                onClick={() => setDeleteConfirm(true)}>
                                                Delete account
                                            </Button>
                                        ) : (
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] text-red-600 font-medium">Are you sure? This is permanent.</p>
                                                <div className="flex gap-1.5">
                                                    <Button variant="outline" size="sm" className="h-7 text-xs flex-1"
                                                        onClick={() => setDeleteConfirm(false)}>Cancel</Button>
                                                    <Button size="sm"
                                                        className="h-7 text-xs flex-1 bg-red-600 hover:bg-red-700 text-white border-0"
                                                        onClick={() => { onDeleteAccount?.(); onClose() }}>
                                                        Yes, delete
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Plans & Credits ── */}
                        {tab === 'plans' && (
                            <div className="p-5 space-y-5">

                                {/* Dev scenario switcher */}
                                <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/50 px-3 py-2 space-y-1.5">
                                    <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Dev only — user scenarios</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {([
                                            { label: 'Free · credits left', credits: 2, hasPlan: false },
                                            { label: 'Free · no credits', credits: 0, hasPlan: false },
                                            { label: 'Plan + bonus · full', credits: 32, hasPlan: true },
                                            { label: 'Plan · credits available', credits: 22, hasPlan: true },
                                            { label: 'Plan · low credits', credits: 2, hasPlan: true },
                                            { label: 'Plan · no credits', credits: 0, hasPlan: true },
                                        ] as { label: string; credits: number; hasPlan: boolean }[]).map(s => (
                                            <button
                                                key={s.label}
                                                onClick={() => { setDevCredits(s.credits); setDevHasPlan(s.hasPlan) }}
                                                className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${devCredits === s.credits && devHasPlan === s.hasPlan
                                                        ? 'bg-amber-400 text-white border-amber-400'
                                                        : 'bg-white border-amber-200 text-amber-700 hover:bg-amber-50'
                                                    }`}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => { setDevCredits(null); setDevHasPlan(null) }}
                                            className="text-[10px] px-2 py-1 rounded-md border border-amber-200 bg-white text-amber-700 hover:bg-amber-50"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                </div>

                                {/* Current plan */}
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Current plan</p>
                                    {hasPlan ? (
                                        <div className="rounded-xl border bg-background/60 p-3 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold">{plan.name}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">Resets {plan.resetDate}</p>
                                                </div>
                                                <Button size="sm" className="h-7 text-xs gap-1"
                                                    onClick={() => window.open(STRIPE_BILLING, '_blank')}>
                                                    Manage <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center justify-between pt-2 border-t">
                                                <p className="text-xs text-muted-foreground">Credits remaining</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className={`text-lg font-bold tabular-nums ${creditColor}`}>{displayCredits}</span>
                                                    <span className="text-[10px] text-muted-foreground">/ {creditMax}</span>
                                                </div>
                                            </div>
                                            {/* Two-segment bar: monthly (dark) + signup bonus (green) */}
                                            <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
                                                {(() => {
                                                    const bonusCredits = MOCK_SIGNUP_BONUS_REMAINING ? SIGNUP_BONUS : 0
                                                    const planCredits = plan.credits
                                                    const total = planCredits + bonusCredits
                                                    // How many of displayCredits come from plan vs bonus
                                                    const planUsed = Math.min(displayCredits, planCredits)
                                                    const bonusUsed = Math.max(0, displayCredits - planCredits)
                                                    return (
                                                        <>
                                                            <div
                                                                className="h-full bg-neutral-900 transition-all"
                                                                style={{ width: `${(planUsed / total) * 100}%` }}
                                                            />
                                                            {bonusCredits > 0 && (
                                                                <div
                                                                    className="h-full bg-emerald-400 transition-all"
                                                                    style={{ width: `${(bonusUsed / total) * 100}%` }}
                                                                />
                                                            )}
                                                        </>
                                                    )
                                                })()}
                                            </div>
                                            {MOCK_SIGNUP_BONUS_REMAINING && (
                                                <div className="flex items-center gap-3 mt-1">
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-2 h-1.5 rounded-sm bg-neutral-900" />
                                                        <p className="text-[9px] text-muted-foreground">Monthly</p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-2 h-1.5 rounded-sm bg-emerald-400" />
                                                        <p className="text-[9px] text-muted-foreground">Signup bonus</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold">Free</p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">3 signup credits — no active plan</p>
                                                </div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className={`text-lg font-bold tabular-nums ${creditColor}`}>{displayCredits}</span>
                                                    <span className="text-[10px] text-muted-foreground">/ {creditMax}</span>
                                                </div>
                                            </div>
                                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-neutral-900 transition-all"
                                                    style={{ width: `${Math.min(100, (displayCredits / creditMax) * 100)}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground leading-snug pt-1">
                                                You're on the free tier. Pick a plan below to get more credits each month.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Plans */}
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Plans</p>
                                    <div className="space-y-2">
                                        {PLANS.map(p => {
                                            const isCurrent = hasPlan && p.id === plan.id
                                            return (
                                                <div key={p.id} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-colors ${isCurrent ? 'border-foreground/30 bg-muted/30' : 'bg-background/60'
                                                    }`}>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xs font-semibold">{p.name}</p>
                                                            {isCurrent && <span className="text-[9px] font-semibold bg-foreground text-background px-1.5 py-0.5 rounded-full">Current</span>}
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground">{p.credits} credits {p.desc}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-bold">{p.price}</p>
                                                        <Button size="sm" variant={isCurrent ? 'outline' : 'default'}
                                                            className="h-6 text-[10px] w-16"
                                                            onClick={() => window.open(STRIPE_BILLING, '_blank')}>
                                                            {isCurrent ? 'Manage' : 'Select'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground/60 mt-2">New users receive 3 free credits on signup.</p>
                                </div>
                            </div>
                        )}

                        {/* ── Usage ── */}
                        {tab === 'usage' && (
                            <div className="p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Credit history</p>
                                    <span className="text-[11px] text-muted-foreground tabular-nums">{displayCredits} remaining</span>
                                </div>
                                <div className="rounded-xl border overflow-hidden divide-y">
                                    <div className="grid grid-cols-[1fr_auto_auto] px-3 py-2 bg-muted/30 gap-4">
                                        <p className="text-[10px] font-medium text-muted-foreground">Description</p>
                                        <p className="text-[10px] font-medium text-muted-foreground">Date</p>
                                        <p className="text-[10px] font-medium text-muted-foreground text-right">Credits</p>
                                    </div>
                                    {[...MOCK_LINE_ITEMS].reverse().map((item, i) => (
                                        <div key={i} className="grid grid-cols-[1fr_auto_auto] px-3 py-2.5 gap-4 items-center bg-background/60">
                                            <p className="text-xs truncate">{item.label}</p>
                                            <p className="text-[11px] text-muted-foreground whitespace-nowrap">{item.date}</p>
                                            <p className={`text-xs font-semibold text-right tabular-nums ${item.credits > 0 ? 'text-green-600' : 'text-foreground'
                                                }`}>
                                                {item.credits > 0 ? `+${item.credits}` : item.credits}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-muted-foreground/60">Mock data — replace with real usage API in production.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}