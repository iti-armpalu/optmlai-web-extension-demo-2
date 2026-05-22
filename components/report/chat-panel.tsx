// 'use client'

// import { useState, useRef, useEffect } from 'react'
// import { Send, Info } from 'lucide-react'
// import ReactMarkdown from 'react-markdown'
// import { Button } from '@/components/ui/button'
// import type { Report, AnalysisStatus, CreativeDetails } from '../shared/types'
// import type { MockReportData } from './mock-data'

// interface Message {
//     id: string
//     role: 'user' | 'assistant'
//     content: string
//     pending?: boolean
//     isSystem?: boolean
// }

// interface ChatPanelProps {
//     report: Report | null
//     analysisStatus: AnalysisStatus
//     creativeDetails?: CreativeDetails
//     reportData: MockReportData | null
// }

// const MAX_MESSAGES = 20

// const PENDING_SUGGESTIONS = [
//     'What elements were detected?',
//     'What channel does this look like?',
//     "What's the inferred intent?",
// ]

// const COMPLETE_SUGGESTIONS = [
//     'Why is the cognitive score low?',
//     'Which context should I prioritise?',
//     "What's the most critical fix?",
// ]

// function buildSystemPrompt(
//     report: Report | null,
//     analysisStatus: AnalysisStatus,
//     creativeDetails: CreativeDetails | undefined,
//     reportData: MockReportData | null
// ): string {
//     const metadata = report?.metadata

//     if (analysisStatus === 'pending') {
//         return `You are Optml, an AI assistant for creative ad analysis.

// The user has captured a creative ad image. A lightweight metadata extraction has been run. The full analysis has NOT been generated yet — the user has not confirmed channel, purpose, or key elements.

// You can ONLY answer questions based on the following extracted metadata:
// ${metadata ? `
// - Format: ${metadata.format}
// - Detected elements: ${metadata.detectedElements.join(', ')}
// - Inferred intent: ${metadata.inferredIntent}
// - Layout structure: ${metadata.layoutStructure}
// - Dominant colours: ${metadata.dominantColors.join(', ')}
// - Likely channel: ${metadata.channel}
// ` : '- No metadata available yet.'}

// You CANNOT answer questions about:
// - Visual or cognitive impact scores (not generated yet)
// - Specific creative fixes (not generated yet)
// - Context or placement performance (not generated yet)
// - Heatmap or attention data (not generated yet)

// If asked about unavailable data, explain that the user needs to confirm creative details to generate the full report. Be helpful, concise, and honest about limitations. Do not make up scores or analysis.`
//     }

//     return `You are Optml, an AI assistant for creative ad analysis.

// The full report has been generated. You have access to all analysis data.

// CREATIVE METADATA:
// ${metadata ? `
// - Format: ${metadata.format}
// - Detected elements: ${metadata.detectedElements.join(', ')}
// - Inferred intent: ${metadata.inferredIntent}
// - Layout: ${metadata.layoutStructure}
// - Colours: ${metadata.dominantColors.join(', ')}
// ` : ''}

// CONFIRMED SETUP:
// ${creativeDetails ? `
// - Channel: ${creativeDetails.channel}
// - Purpose: ${creativeDetails.purpose}
// - Key elements: ${creativeDetails.detectedElements.join(', ')}
// ` : ''}

// REPORT DATA:
// ${reportData ? `
// - Visual Impact Score: ${reportData.visualScore}/100 — ${reportData.visualScoreLabel}
// - Visual insight: ${reportData.visualInsight}
// - Cognitive Impact Score: ${reportData.cognitiveScore}/100 — ${reportData.cognitiveScoreLabel}
// - Cognitive insight: ${reportData.cognitiveInsight}
// - Heatmap insight: ${reportData.heatmapInsight}
// - Creative fixes: ${reportData.fixes.map(f => `${f.label} (${f.severity}): ${f.description}`).join(' | ')}
// - Contexts: ${reportData.contexts.map(c => `${c.name}: ${c.status}`).join(', ')}
// ` : ''}

// Answer questions about the creative, scores, fixes, contexts, and recommendations. Be specific, cite actual scores and data. Keep responses concise and actionable.`
// }

// export function ChatPanel({ report, analysisStatus, creativeDetails, reportData }: ChatPanelProps) {
//     const [messages, setMessages] = useState<Message[]>([])
//     const [input, setInput] = useState('')
//     const [isLoading, setIsLoading] = useState(false)
//     const [userMessageCount, setUserMessageCount] = useState(0)
//     const [prevStatus, setPrevStatus] = useState<AnalysisStatus>(analysisStatus)
//     const bottomRef = useRef<HTMLDivElement>(null)
//     const inputRef = useRef<HTMLTextAreaElement>(null)

//     const isPending = analysisStatus === 'pending'
//     const suggestions = isPending ? PENDING_SUGGESTIONS : COMPLETE_SUGGESTIONS
//     const remaining = MAX_MESSAGES - userMessageCount
//     const isLimitReached = remaining <= 0
//     const isNearLimit = remaining <= 5 && remaining > 0
//     const isDisabled = isLimitReached || isLoading

//     // Auto-scroll to bottom
//     useEffect(() => {
//         bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
//     }, [messages])

//     // Insert system divider when analysis unlocks
//     useEffect(() => {
//         if (prevStatus === 'pending' && analysisStatus === 'complete') {
//             setMessages(prev => [...prev, {
//                 id: crypto.randomUUID(),
//                 role: 'assistant',
//                 content: 'Full report unlocked — you can now ask about scores, fixes and contexts.',
//                 isSystem: true,
//             }])
//         }
//         setPrevStatus(analysisStatus)
//     }, [analysisStatus])

//     async function sendMessage(text?: string) {
//         const content = (text ?? input).trim()
//         if (!content || isLoading || isLimitReached) return

//         const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content }
//         const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: '', pending: true }

//         setUserMessageCount(prev => prev + 1)
//         setMessages(prev => [...prev, userMsg, assistantMsg])
//         setInput('')
//         setIsLoading(true)

//         try {
//             const systemPrompt = buildSystemPrompt(report, analysisStatus, creativeDetails, reportData)

//             const response = await fetch('/api/chat', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({
//                     model: 'claude-sonnet-4-20250514',
//                     max_tokens: 1000,
//                     system: systemPrompt,
//                     messages: [
//                         ...messages
//                             .filter(m => !m.pending && !m.isSystem)
//                             .map(m => ({ role: m.role, content: m.content })),
//                         { role: 'user', content },
//                     ],
//                 }),
//             })

//             if (!response.ok) {
//                 const err = await response.json()
//                 const errMsg = err.error?.type === 'rate_limit_error'
//                     ? 'Too many requests — please wait a moment and try again.'
//                     : 'Something went wrong. Please try again.'
//                 setMessages(prev => prev.map(m => m.id === assistantMsg.id
//                     ? { ...m, content: errMsg, pending: false } : m))
//                 return
//             }

//             // Read the SSE stream — flush to state on a 30ms interval for smooth rendering
//             const reader = response.body!.getReader()
//             const decoder = new TextDecoder()
//             let accumulated = ''

//             // Show empty bubble immediately (remove pending dots)
//             setMessages(prev => prev.map(m => m.id === assistantMsg.id
//                 ? { ...m, content: '', pending: false } : m))

//             // Flush accumulated text to state every 30ms
//             const msgId = assistantMsg.id
//             const flushInterval = setInterval(() => {
//                 setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: accumulated } : m))
//             }, 30)

//             try {
//                 while (true) {
//                     const { done, value } = await reader.read()
//                     if (done) break
//                     const chunk = decoder.decode(value, { stream: true })
//                     for (const line of chunk.split('\n')) {
//                         if (!line.startsWith('data: ')) continue
//                         const data = line.slice(6).trim()
//                         if (data === '[DONE]') continue
//                         try {
//                             const json = JSON.parse(data)
//                             if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
//                                 accumulated += json.delta.text
//                             }
//                         } catch { /* skip malformed */ }
//                     }
//                 }
//             } finally {
//                 clearInterval(flushInterval)
//             }

//             // Final flush with complete content
//             setMessages(prev => prev.map(m => m.id === msgId
//                 ? { ...m, content: accumulated || 'No response received.', pending: false } : m))

//         } catch {
//             setMessages(prev =>
//                 prev.map(m => m.id === assistantMsg.id
//                     ? { ...m, content: 'Something went wrong. Please try again.', pending: false }
//                     : m
//                 )
//             )
//         } finally {
//             setIsLoading(false)
//         }
//     }

//     function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
//         if (e.key === 'Enter' && !e.shiftKey) {
//             e.preventDefault()
//             sendMessage()
//         }
//     }

//     return (
//         <div className="flex flex-col h-full">

//             {/* ── Scope notice (pending only) ── */}
//             {isPending && (
//                 <div className="flex items-start gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex-shrink-0">
//                     <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
//                     <p className="text-[11px] text-amber-700 leading-snug">
//                         Chat is scoped to extracted metadata only. Confirm creative details to unlock full report chat.
//                     </p>
//                 </div>
//             )}

//             {/* ── Messages ── */}
//             <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
//                 {messages.length === 0 ? (

//                     /* Empty state */
//                     <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
//                         <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
//                             <svg viewBox="0 0 16 16" fill="none" className="w-6 h-6">
//                                 <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" />
//                                 <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.5" />
//                                 <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.5" />
//                                 <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.25" />
//                             </svg>
//                         </div>
//                         <div className="space-y-1">
//                             <p className="text-sm font-medium">Ask Optml</p>
//                             <p className="text-xs text-muted-foreground max-w-[180px]">
//                                 {isPending
//                                     ? 'Ask about detected elements, layout, or inferred intent.'
//                                     : 'Ask anything about your creative, scores, fixes, or contexts.'}
//                             </p>
//                         </div>
//                         <div className="flex flex-wrap justify-center gap-1.5 max-w-[260px]">
//                             {suggestions.map(s => (
//                                 <button
//                                     key={s}
//                                     onClick={() => sendMessage(s)}
//                                     disabled={isLimitReached}
//                                     className="text-[11px] text-left px-3 py-2.5 rounded-lg border border-border bg-background hover:bg-muted hover:border-foreground/20 transition-colors text-foreground font-medium shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
//                                 >
//                                     {s}
//                                 </button>
//                             ))}
//                         </div>
//                     </div>

//                 ) : (
//                     <>
//                         {messages.map(msg => {

//                             /* System divider */
//                             if (msg.isSystem) {
//                                 return (
//                                     <div key={msg.id} className="flex items-center gap-3 py-1">
//                                         <div className="flex-1 h-px bg-border" />
//                                         <p className="text-[10px] text-muted-foreground whitespace-nowrap">{msg.content}</p>
//                                         <div className="flex-1 h-px bg-border" />
//                                     </div>
//                                 )
//                             }

//                             return (
//                                 <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
//                                     <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${msg.role === 'user'
//                                             ? 'bg-neutral-900 text-white'
//                                             : 'bg-muted text-foreground'
//                                         }`}>
//                                         {msg.pending ? (
//                                             <div className="flex items-center gap-1">
//                                                 <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
//                                                 <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
//                                                 <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
//                                             </div>
//                                         ) : (
//                                             <div className="space-y-2 text-xs">
//                                                 <ReactMarkdown
//                                                     components={{
//                                                         p: ({ children }) => <p className="text-xs leading-relaxed">{children}</p>,
//                                                         h1: ({ children }) => <p className="text-sm font-bold mt-2">{children}</p>,
//                                                         h2: ({ children }) => <p className="text-xs font-bold mt-2 uppercase tracking-wide text-muted-foreground">{children}</p>,
//                                                         h3: ({ children }) => <p className="text-xs font-semibold mt-1.5">{children}</p>,
//                                                         ul: ({ children }) => <ul className="space-y-1 my-1">{children}</ul>,
//                                                         ol: ({ children }) => <ol className="space-y-1 my-1 list-decimal pl-4">{children}</ol>,
//                                                         li: ({ children }) => (
//                                                             <li className="flex gap-2 text-xs leading-relaxed">
//                                                                 <span className="mt-[7px] w-1 h-1 rounded-full bg-current flex-shrink-0 opacity-40" />
//                                                                 <span>{children}</span>
//                                                             </li>
//                                                         ),
//                                                         strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
//                                                         em: ({ children }) => <em className="italic opacity-80">{children}</em>,
//                                                         code: ({ children }) => <code className="font-mono text-[10px] bg-black/10 px-1 py-0.5 rounded">{children}</code>,
//                                                         blockquote: ({ children }) => <blockquote className="border-l-2 border-current/20 pl-3 opacity-70 italic">{children}</blockquote>,
//                                                         hr: () => <hr className="border-current/10 my-2" />,
//                                                     }}
//                                                 >
//                                                     {msg.content}
//                                                 </ReactMarkdown>
//                                             </div>
//                                         )}
//                                     </div>
//                                 </div>
//                             )
//                         })}
//                         <div ref={bottomRef} />
//                     </>
//                 )}
//             </div>

//             {/* ── Input ── */}
//             <div className="border-t px-4 py-3 flex-shrink-0 space-y-1.5">
//                 <div className={`flex items-end gap-2 rounded-xl border bg-background px-3 py-2 ${isLimitReached ? 'opacity-50' : 'focus-within:ring-1 focus-within:ring-border'
//                     }`}>
//                     <textarea
//                         ref={inputRef}
//                         value={input}
//                         onChange={e => setInput(e.target.value)}
//                         onKeyDown={onKeyDown}
//                         disabled={isDisabled}
//                         placeholder={
//                             isLimitReached ? 'Message limit reached'
//                                 : isPending ? 'Ask Optml about the detected elements…'
//                                     : 'Ask Optml about this creative…'
//                         }
//                         rows={1}
//                         className="flex-1 resize-none text-xs bg-transparent outline-none placeholder:text-muted-foreground leading-relaxed min-h-[20px] max-h-[80px] disabled:cursor-not-allowed"
//                         style={{ height: 'auto' }}
//                         onInput={e => {
//                             const el = e.currentTarget
//                             el.style.height = 'auto'
//                             el.style.height = Math.min(el.scrollHeight, 80) + 'px'
//                         }}
//                     />
//                     <Button
//                         size="icon"
//                         className="h-6 w-6 flex-shrink-0 rounded-lg"
//                         disabled={!input.trim() || isDisabled}
//                         onClick={() => sendMessage()}
//                     >
//                         <Send className="w-3 h-3" />
//                     </Button>
//                 </div>

//                 {/* Message limit — text only */}
//                 {isLimitReached ? (
//                     <p className="text-[11px] text-red-400 px-1">Message limit reached — {MAX_MESSAGES} messages included per report.</p>
//                 ) : isNearLimit ? (
//                     <p className="text-[11px] text-amber-500 px-1">{remaining} message{remaining !== 1 ? 's' : ''} remaining.</p>
//                 ) : userMessageCount > 0 ? (
//                     <p className="text-[11px] text-muted-foreground/40 px-1 tabular-nums">{userMessageCount}/{MAX_MESSAGES} messages used</p>
//                 ) : null}
//             </div>
//         </div>
//     )
// }


'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Info } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import type { Report, AnalysisStatus, CreativeDetails } from '../shared/types'
import type { MockReportData } from './mock-data'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    pending?: boolean
    isSystem?: boolean
}

interface ChatPanelProps {
    report: Report | null
    analysisStatus: AnalysisStatus
    creativeDetails?: CreativeDetails
    reportData: MockReportData | null
}

const MAX_MESSAGES = 20

const PENDING_SUGGESTIONS = [
    'What elements were detected?',
    'What channel does this look like?',
    "What's the inferred intent?",
]

const COMPLETE_SUGGESTIONS = [
    'Why is the cognitive score low?',
    'Which context should I prioritise?',
    "What's the most critical fix?",
]

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

export function ChatPanel({ report, analysisStatus, creativeDetails, reportData }: ChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [userMessageCount, setUserMessageCount] = useState(0)
    const [prevStatus, setPrevStatus] = useState<AnalysisStatus>(analysisStatus)
    const bottomRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const isPending = analysisStatus === 'pending'
    const suggestions = isPending ? PENDING_SUGGESTIONS : COMPLETE_SUGGESTIONS
    const remaining = MAX_MESSAGES - userMessageCount
    const isLimitReached = remaining <= 0
    const isNearLimit = remaining <= 5 && remaining > 0
    const isDisabled = isLimitReached || isLoading

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Insert system divider when analysis unlocks
    useEffect(() => {
        if (prevStatus === 'pending' && analysisStatus === 'complete') {
            setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: 'Full report unlocked — you can now ask about scores, fixes and contexts.',
                isSystem: true,
            }])
        }
        setPrevStatus(analysisStatus)
    }, [analysisStatus])

    async function sendMessage(text?: string) {
        const content = (text ?? input).trim()
        if (!content || isLoading || isLimitReached) return

        const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content }
        const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: '', pending: true }

        setUserMessageCount(prev => prev + 1)
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
                            .filter(m => !m.pending && !m.isSystem)
                            .map(m => ({ role: m.role, content: m.content })),
                        { role: 'user', content },
                    ],
                }),
            })

            if (!response.ok) {
                const err = await response.json()
                const errMsg = err.error?.type === 'rate_limit_error'
                    ? 'Too many requests — please wait a moment and try again.'
                    : 'Something went wrong. Please try again.'
                setMessages(prev => prev.map(m => m.id === assistantMsg.id
                    ? { ...m, content: errMsg, pending: false } : m))
                return
            }

            // Read the SSE stream — flush to state on a 30ms interval for smooth rendering
            const reader = response.body!.getReader()
            const decoder = new TextDecoder()
            let accumulated = ''

            // Show empty bubble immediately (remove pending dots)
            setMessages(prev => prev.map(m => m.id === assistantMsg.id
                ? { ...m, content: '', pending: false } : m))

            // Flush accumulated text to state every 30ms
            const msgId = assistantMsg.id
            const flushInterval = setInterval(() => {
                setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: accumulated } : m))
            }, 30)

            try {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    const chunk = decoder.decode(value, { stream: true })
                    for (const line of chunk.split('\n')) {
                        if (!line.startsWith('data: ')) continue
                        const data = line.slice(6).trim()
                        if (data === '[DONE]') continue
                        try {
                            const json = JSON.parse(data)
                            if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
                                accumulated += json.delta.text
                            }
                        } catch { /* skip malformed */ }
                    }
                }
            } finally {
                clearInterval(flushInterval)
            }

            // Final flush with complete content
            setMessages(prev => prev.map(m => m.id === msgId
                ? { ...m, content: accumulated || 'No response received.', pending: false } : m))

        } catch {
            setMessages(prev =>
                prev.map(m => m.id === assistantMsg.id
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

            {/* ── Scope notice (pending only) ── */}
            {isPending && (
                <div className="flex items-start gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex-shrink-0">
                    <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700 leading-snug">
                        Chat is scoped to extracted metadata only. Confirm creative details to unlock full report chat.
                    </p>
                </div>
            )}

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {messages.filter(m => !m.isSystem).length === 0 ? (

                    /* Empty state — show system dividers above it if any */
                    <div className="flex flex-col h-full">
                        {messages.filter(m => m.isSystem).map(msg => (
                            <div key={msg.id} className="flex items-center gap-3 py-3 flex-shrink-0">
                                <div className="flex-1 h-px bg-border" />
                                <p className="text-[10px] text-muted-foreground whitespace-nowrap">{msg.content}</p>
                                <div className="flex-1 h-px bg-border" />
                            </div>
                        ))}
                        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center">
                            <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
                                <svg viewBox="0 0 16 16" fill="none" className="w-6 h-6">
                                    <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" />
                                    <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.5" />
                                    <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.5" />
                                    <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.25" />
                                </svg>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Ask Optml</p>
                                <p className="text-xs text-muted-foreground max-w-[180px]">
                                    {isPending
                                        ? 'Ask about detected elements, layout, or inferred intent.'
                                        : 'Ask anything about your creative, scores, fixes, or contexts.'}
                                </p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-1.5 max-w-[260px]">
                                {suggestions.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => sendMessage(s)}
                                        disabled={isLimitReached}
                                        className="text-[11px] text-left px-3 py-2.5 rounded-lg border border-border bg-background hover:bg-muted hover:border-foreground/20 transition-colors text-foreground font-medium shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                ) : (
                    <>
                        {messages.map(msg => {

                            /* System divider */
                            if (msg.isSystem) {
                                return (
                                    <div key={msg.id} className="flex items-center gap-3 py-1">
                                        <div className="flex-1 h-px bg-border" />
                                        <p className="text-[10px] text-muted-foreground whitespace-nowrap">{msg.content}</p>
                                        <div className="flex-1 h-px bg-border" />
                                    </div>
                                )
                            }

                            return (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${msg.role === 'user'
                                            ? 'bg-neutral-900 text-white'
                                            : 'bg-muted text-foreground'
                                        }`}>
                                        {msg.pending ? (
                                            <div className="flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        ) : (
                                            <div className="space-y-2 text-xs">
                                                <ReactMarkdown
                                                    components={{
                                                        p: ({ children }) => <p className="text-xs leading-relaxed">{children}</p>,
                                                        h1: ({ children }) => <p className="text-sm font-bold mt-2">{children}</p>,
                                                        h2: ({ children }) => <p className="text-xs font-bold mt-2 uppercase tracking-wide text-muted-foreground">{children}</p>,
                                                        h3: ({ children }) => <p className="text-xs font-semibold mt-1.5">{children}</p>,
                                                        ul: ({ children }) => <ul className="space-y-1 my-1">{children}</ul>,
                                                        ol: ({ children }) => <ol className="space-y-1 my-1 list-decimal pl-4">{children}</ol>,
                                                        li: ({ children }) => (
                                                            <li className="flex gap-2 text-xs leading-relaxed">
                                                                <span className="mt-[7px] w-1 h-1 rounded-full bg-current flex-shrink-0 opacity-40" />
                                                                <span>{children}</span>
                                                            </li>
                                                        ),
                                                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                                        em: ({ children }) => <em className="italic opacity-80">{children}</em>,
                                                        code: ({ children }) => <code className="font-mono text-[10px] bg-black/10 px-1 py-0.5 rounded">{children}</code>,
                                                        blockquote: ({ children }) => <blockquote className="border-l-2 border-current/20 pl-3 opacity-70 italic">{children}</blockquote>,
                                                        hr: () => <hr className="border-current/10 my-2" />,
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                        <div ref={bottomRef} />
                    </>
                )}
            </div>

            {/* ── Input ── */}
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
                            isLimitReached ? 'Message limit reached'
                                : isPending ? 'Ask Optml about the detected elements…'
                                    : 'Ask Optml about this creative…'
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

                {/* Message limit — text only */}
                {isLimitReached ? (
                    <p className="text-[11px] text-red-400 px-1">Message limit reached — {MAX_MESSAGES} messages included per report.</p>
                ) : isNearLimit ? (
                    <p className="text-[11px] text-amber-500 px-1">{remaining} message{remaining !== 1 ? 's' : ''} remaining.</p>
                ) : userMessageCount > 0 ? (
                    <p className="text-[11px] text-muted-foreground/40 px-1 tabular-nums">{userMessageCount}/{MAX_MESSAGES} messages used</p>
                ) : null}
            </div>
        </div>
    )
}