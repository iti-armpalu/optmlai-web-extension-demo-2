'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Info, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Report, AnalysisStatus, CreativeDetails } from '../shared/types'
import type { MockReportData } from './mock-data'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    pending?: boolean
}

interface ChatPanelProps {
    report: Report | null
    analysisStatus: AnalysisStatus
    creativeDetails?: CreativeDetails
    reportData: MockReportData | null
}

// Build the system prompt based on what's available
function buildSystemPrompt(
    report: Report | null,
    analysisStatus: AnalysisStatus,
    creativeDetails: CreativeDetails | undefined,
    reportData: MockReportData | null
): string {
    const metadata = report?.metadata

    if (analysisStatus === 'pending') {
        return `You are Optml, an AI assistant for creative ad analysis.

The user has captured a creative ad image. A lightweight metadata extraction has been run. The full analysis has NOT been generated yet — the user has not confirmed channel, purpose, or key elements.

You can ONLY answer questions based on the following extracted metadata:
${metadata ? `
- Format: ${metadata.format}
- Detected elements: ${metadata.detectedElements.join(', ')}
- Inferred intent: ${metadata.inferredIntent}
- Layout structure: ${metadata.layoutStructure}
- Dominant colours: ${metadata.dominantColors.join(', ')}
- Likely channel: ${metadata.channel}
` : '- No metadata available yet.'}

You CANNOT answer questions about:
- Visual or cognitive impact scores (not generated yet)
- Specific creative fixes (not generated yet)
- Context or placement performance (not generated yet)
- Heatmap or attention data (not generated yet)

If asked about unavailable data, explain that the user needs to confirm creative details to generate the full report. Be helpful, concise, and honest about limitations. Do not make up scores or analysis.`
    }

    return `You are Optml, an AI assistant for creative ad analysis.

The full report has been generated. You have access to all analysis data.

CREATIVE METADATA:
${metadata ? `
- Format: ${metadata.format}
- Detected elements: ${metadata.detectedElements.join(', ')}
- Inferred intent: ${metadata.inferredIntent}
- Layout: ${metadata.layoutStructure}
- Colours: ${metadata.dominantColors.join(', ')}
` : ''}

CONFIRMED SETUP:
${creativeDetails ? `
- Channel: ${creativeDetails.channel}
- Purpose: ${creativeDetails.purpose}
- Key elements: ${creativeDetails.detectedElements.join(', ')}
` : ''}

REPORT DATA:
${reportData ? `
- Visual Impact Score: ${reportData.visualScore}/100 — ${reportData.visualScoreLabel}
- Visual insight: ${reportData.visualInsight}
- Cognitive Impact Score: ${reportData.cognitiveScore}/100 — ${reportData.cognitiveScoreLabel}
- Cognitive insight: ${reportData.cognitiveInsight}
- Heatmap insight: ${reportData.heatmapInsight}
- Creative fixes: ${reportData.fixes.map(f => `${f.label} (${f.severity}): ${f.description}`).join(' | ')}
- Contexts: ${reportData.contexts.map(c => `${c.name}: ${c.status}`).join(', ')}
` : ''}

Answer questions about the creative, scores, fixes, contexts, and recommendations. Be specific, cite actual scores and data. Keep responses concise and actionable.`
}

const MAX_MESSAGES = 20 // user messages allowed per report credit

const PENDING_SUGGESTIONS = [
    'What elements were detected?',
    'What channel does this look like?',
    'What\'s the inferred intent?',
]

const COMPLETE_SUGGESTIONS = [
    'Why is the cognitive score low?',
    'Which context should I prioritise?',
    'What\'s the most critical fix?',
]

export function ChatPanel({
    report,
    analysisStatus,
    creativeDetails,
    reportData,
}: ChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [userMessageCount, setUserMessageCount] = useState(0)
    const bottomRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const isPending = analysisStatus === 'pending'
    const suggestions = isPending ? PENDING_SUGGESTIONS : COMPLETE_SUGGESTIONS
    const remaining = MAX_MESSAGES - userMessageCount
    const isLimitReached = remaining <= 0
    const isNearLimit = remaining <= 5 && remaining > 0
    const isDisabled = isLimitReached || isLoading

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    async function sendMessage(text?: string) {
        const content = (text ?? input).trim()
        if (!content || isLoading || isLimitReached) return

        const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content }
        setUserMessageCount(prev => prev + 1)
        const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: '', pending: true }

        setMessages(prev => [...prev, userMsg, assistantMsg])
        setInput('')
        setIsLoading(true)

        try {
            const systemPrompt = buildSystemPrompt(report, analysisStatus, creativeDetails, reportData)

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 1000,
                    system: systemPrompt,
                    messages: [
                        ...messages
                            .filter(m => !m.pending)
                            .map(m => ({ role: m.role, content: m.content })),
                        { role: 'user', content },
                    ],
                }),
            })

            const data = await response.json()
            const reply = data.content?.[0]?.text ?? 'Sorry, I couldn\'t generate a response.'

            setMessages(prev =>
                prev.map(m => m.id === assistantMsg.id ? { ...m, content: reply, pending: false } : m)
            )
        } catch (err) {
            setMessages(prev =>
                prev.map(m =>
                    m.id === assistantMsg.id
                        ? { ...m, content: 'Something went wrong. Please try again.', pending: false }
                        : m
                )
            )
        } finally {
            setIsLoading(false)
        }
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    return (
        <div className="flex flex-col h-full">

            {/* Scope notice */}
            {isPending && (
                <div className="flex items-start gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-100">
                    <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700 leading-snug">
                        Chat is scoped to extracted metadata only. Confirm creative details to unlock full report chat.
                    </p>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Ask Optml</p>
                            <p className="text-xs text-muted-foreground max-w-[180px]">
                                {isPending
                                    ? 'Ask about detected elements, layout, or inferred intent.'
                                    : 'Ask anything about your creative, scores, fixes, or contexts.'}
                            </p>
                        </div>
                        {/* Suggestions */}
                        <div className="flex flex-col gap-1.5 w-full max-w-[220px]">
                            {suggestions.map(s => (
                                <button
                                    key={s}
                                    onClick={() => sendMessage(s)}
                                    className="text-[11px] text-left px-3 py-2 rounded-lg border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && (
                                    <div className="w-5 h-5 rounded bg-neutral-900 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                                        <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3">
                                            <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" />
                                            <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.5" />
                                            <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.5" />
                                            <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.25" />
                                        </svg>
                                    </div>
                                )}
                                <div
                                    className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${msg.role === 'user'
                                            ? 'bg-neutral-900 text-white'
                                            : 'bg-muted text-foreground'
                                        }`}
                                >
                                    {msg.pending ? (
                                        <div className="flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <div className="border-t px-4 py-3 flex-shrink-0 space-y-1.5">

                <div className={`flex items-end gap-2 rounded-xl border bg-background px-3 py-2 ${isLimitReached ? 'opacity-50' : 'focus-within:ring-1 focus-within:ring-border'
                    }`}>
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={onKeyDown}
                        disabled={isDisabled}
                        placeholder={
                            isLimitReached
                                ? 'Message limit reached'
                                : isPending
                                    ? 'Ask about the detected elements…'
                                    : 'Ask something about this creative…'
                        }
                        rows={1}
                        className="flex-1 resize-none text-xs bg-transparent outline-none placeholder:text-muted-foreground leading-relaxed min-h-[20px] max-h-[80px] disabled:cursor-not-allowed"
                        style={{ height: 'auto' }}
                        onInput={e => {
                            const el = e.currentTarget
                            el.style.height = 'auto'
                            el.style.height = Math.min(el.scrollHeight, 80) + 'px'
                        }}
                    />
                    <Button
                        size="icon"
                        className="h-6 w-6 flex-shrink-0 rounded-lg"
                        disabled={!input.trim() || isDisabled}
                        onClick={() => sendMessage()}
                    >
                        <Send className="w-3 h-3" />
                    </Button>
                </div>

                {/* Progress bar + counter — always visible below input */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-0.5 rounded-full bg-muted overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${isLimitReached ? 'bg-red-400' : isNearLimit ? 'bg-amber-400' : 'bg-neutral-300'
                                }`}
                            style={{ width: `${(userMessageCount / MAX_MESSAGES) * 100}%` }}
                        />
                    </div>
                    <p className={`text-[10px] tabular-nums flex-shrink-0 ${isLimitReached
                            ? 'text-red-400 font-medium'
                            : isNearLimit
                                ? 'text-amber-500 font-medium'
                                : 'text-muted-foreground/50'
                        }`}>
                        {isLimitReached
                            ? 'Limit reached'
                            : isNearLimit
                                ? `${remaining} left`
                                : `${userMessageCount}/${MAX_MESSAGES}`}
                    </p>
                </div>
            </div>
        </div>
    )
}