import type { Report } from '../shared/types'

export interface Fix {
    id: string
    label: string
    summary: string     // one sentence — always visible
    description: string // full technical detail — revealed on expand
    severity: 'high' | 'medium' | 'low'
    boundingBox: { x: number; y: number; w: number; h: number }
}

export type ContextStatus = 'run-it' | 'fix-first' | 'wrong-context'
export type ContextChannel = 'Retail' | 'E-commerce' | 'Social'

export interface ContextNote {
    label: string
    detail: string
    boundingBox?: { x: number; y: number; w: number; h: number }
}

export interface ContextCard {
    id: string
    name: string
    channel: ContextChannel
    environmentDescription: string
    exposureTime: string
    status: ContextStatus
    recommendation: string
    audience: string
    // run-it: positive highlights about why it works
    // fix-first / wrong-context: specific issues to address
    notes: ContextNote[]
    strengths: string[]
}

export interface MockReportData {
    visualScore: number
    cognitiveScore: number
    visualScoreLabel: string
    cognitiveScoreLabel: string
    visualInsight: string
    cognitiveInsight: string
    fixes: Fix[]
    heatmapInsight: string
    fixationZones: { label: string; pct: number }[]
    benchmarkNote: string
    fixConnection: string
    contexts: ContextCard[]
}

export function getMockData(_report: Report): MockReportData {
    return {
        visualScore: 74,
        cognitiveScore: 61,
        visualScoreLabel: 'Strong visual presence',
        cognitiveScoreLabel: 'Processing friction detected',
        visualInsight: 'High contrast headline and dominant product visual create strong initial draw. The CTA is well-placed but competes with the brand mark for weight.',
        cognitiveInsight: 'The sub-headline introduces ambiguity too early — users are asked to process benefit claims before anchoring on product category. Reordering the hierarchy would reduce cognitive load.',
        fixes: [
            {
                id: 'fix-1',
                label: 'CTA has insufficient contrast',
                summary: 'Contrast ratio is 2.1:1 — the CTA is not separating from the background.',
                description: 'Below the 4.5:1 threshold required for reliable visual separation. Saliency models show the CTA capturing under 8% of predicted fixations. This will underperform on every placement until resolved.',
                severity: 'high',
                boundingBox: { x: 8, y: 72, w: 28, h: 14 },
            },
            {
                id: 'fix-2',
                label: 'No clear visual entry point',
                summary: 'Attention is split across three elements — there is no dominant anchor.',
                description: 'Saliency analysis shows the headline, product visual, and brand mark competing simultaneously. Viewers without a clear entry point disengage faster across all formats.',
                severity: 'high',
                boundingBox: { x: 6, y: 10, w: 88, h: 85 },
            },
            {
                id: 'fix-3',
                label: 'Headline hierarchy is too flat',
                summary: 'Headline and sub-headline are near-identical in size — hierarchy is not registering.',
                description: 'Font size differential is under 12%. Cognitive processing requires 20–30% minimum to establish hierarchy. Both lines compete for first-read status regardless of placement.',
                severity: 'medium',
                boundingBox: { x: 6, y: 18, w: 55, h: 28 },
            },
            {
                id: 'fix-4',
                label: 'Product lacks figure-ground separation',
                summary: 'Edge detection shows the product blending into the background at small sizes.',
                description: 'Insufficient contrast between the product visual and the dark background means the product fails to register as a distinct object in low-attention environments and thumbnails.',
                severity: 'medium',
                boundingBox: { x: 60, y: 38, w: 36, h: 48 },
            },
        ],
        heatmapInsight: 'Attention clusters strongly on the headline and product visual. The CTA receives only 12% of fixations — well below the 30% benchmark for high-performing display ads.',
        fixationZones: [
            { label: 'Headline', pct: 68 },
            { label: 'Product visual', pct: 20 },
            { label: 'CTA', pct: 12 },
        ],
        benchmarkNote: 'For display ads, CTA elements should capture 25–35% of fixations. This creative is below benchmark.',
        fixConnection: 'Low CTA fixation is the structural cause of fix #1 in Creative Fixes.',
        contexts: [
            // ── Retail ──
            {
                id: 'proximity',
                name: 'Proximity (Billboards / OOH)',
                channel: 'Retail',
                environmentDescription: 'Billboards, transit ads, outdoor signage',
                exposureTime: '1–2s',
                status: 'fix-first',
                recommendation: 'Simplify to one message. At 1–2 seconds of exposure, only the headline and brand will register. The current layout tries to communicate too much for this format.',
                audience: 'Viewers in transit — driving, walking, or commuting. Attention is split, exposure is fleeting. Only the most dominant visual element will be remembered.',
                notes: [
                    { label: 'Headline readable at distance', detail: 'Bold weight and high contrast make the headline legible from 10–15 metres.', boundingBox: { x: 6, y: 18, w: 55, h: 40 } },
                    { label: 'CTA not viable at this exposure', detail: 'At 1–2s, no viewer will process a CTA. It adds visual noise without contributing to recall.', boundingBox: { x: 8, y: 72, w: 28, h: 14 } },
                ],
                strengths: ['Strong headline contrast for outdoor legibility', 'Dark background reduces glare in daylight'],
            },
            {
                id: 'transition',
                name: 'Transition (Entrance / Windows)',
                channel: 'Retail',
                environmentDescription: 'Store entrances, window displays, escalator ads',
                exposureTime: '2–4s',
                status: 'fix-first',
                recommendation: 'Lead with the product visual and a single benefit. Transition placements allow slightly more processing time but viewers are still in motion.',
                audience: 'Shoppers entering a space or moving between floors. Mild intent to browse — open to brand impressions if the visual is arresting.',
                notes: [
                    { label: 'Product visual performs well', detail: 'Clear product imagery lands quickly for a viewer in motion.', boundingBox: { x: 62, y: 55, w: 34, h: 38 } },
                    { label: 'Sub-headline lost at this exposure', detail: 'Secondary copy will not be read in a 2–4s window. Consider removing for this placement.' },
                ],
                strengths: ['High visual contrast stops attention effectively', 'Brand identity comes through clearly'],
            },
            {
                id: 'impulse',
                name: 'Impulse (Checkout / Promo)',
                channel: 'Retail',
                environmentDescription: 'Checkout lanes, end caps, promotional displays',
                exposureTime: '3–5s',
                status: 'run-it',
                recommendation: 'Good fit for impulse placement. Dwell time is sufficient for the full message and shoppers are already in purchase mode.',
                audience: 'Shoppers at checkout or near promotional displays. High purchase intent, idle attention. Receptive to last-minute brand messaging.',
                notes: [],
                strengths: ['Message complexity is appropriate for 3–5s exposure', 'Product and CTA both visible', 'Brand mark reinforces recognition at point of purchase'],
            },
            {
                id: 'destination',
                name: 'Destination (Shelf / Aisle)',
                channel: 'Retail',
                environmentDescription: 'Product shelves, in-aisle displays, comparison shopping',
                exposureTime: '5–15s',
                status: 'run-it',
                recommendation: 'Strong fit. Shoppers in destination mode are actively evaluating — longer dwell time means the full creative can land.',
                audience: 'Shoppers in active product comparison mode. Higher cognitive engagement, willing to read detail. Brand differentiation matters here.',
                notes: [],
                strengths: ['Layout rewards longer engagement', 'Product detail visible at close range', 'Brand positioning clear and differentiated'],
            },

            // ── E-commerce ──
            {
                id: 'discovery',
                name: 'Discovery (Category Pages)',
                channel: 'E-commerce',
                environmentDescription: 'Product grid thumbnails, category browsing, search results',
                exposureTime: '0.5–3s',
                status: 'fix-first',
                recommendation: 'Thumbnail legibility is the only thing that matters here. The current layout is too detail-heavy for a grid context — simplify to product + brand.',
                audience: 'Browsers scanning product grids at speed. No purchase intent yet. Visual differentiation drives the click.',
                notes: [
                    { label: 'Product visual too small in thumbnail', detail: 'At grid scale, the product visual competes with headline for space and neither wins.', boundingBox: { x: 62, y: 55, w: 34, h: 38 } },
                    { label: 'Headline unreadable at thumbnail size', detail: 'Text is not legible below 200px width — which is the standard grid thumbnail size.', boundingBox: { x: 6, y: 18, w: 55, h: 40 } },
                ],
                strengths: ['High contrast aids thumbnail differentiation', 'Brand colour is distinctive in a grid'],
            },
            {
                id: 'evaluation',
                name: 'Evaluation (PDP Features)',
                channel: 'E-commerce',
                environmentDescription: 'Product detail pages, feature comparisons, specification reading',
                exposureTime: '5–20s',
                status: 'run-it',
                recommendation: 'Excellent fit. PDP shoppers are in deep evaluation mode — the full creative hierarchy, product detail, and CTA all serve this intent.',
                audience: 'High-intent shoppers reading specifications and comparing features. Rational decision-making mode. Respond to product clarity and credibility signals.',
                notes: [],
                strengths: ['Product detail visible at full resolution', 'Headline clarity supports feature scanning', 'Layout supports extended reading'],
            },
            {
                id: 'conversion',
                name: 'Conversion (Cart / Checkout)',
                channel: 'E-commerce',
                environmentDescription: 'Shopping cart, checkout page, last-mile reassurance',
                exposureTime: '5–15s',
                status: 'fix-first',
                recommendation: 'Fix the CTA contrast before using at checkout. Conversion-stage placements require maximum clarity on the action step.',
                audience: 'Shoppers who have already decided to buy. Anxiety about the purchase is common. Reassurance, clarity, and trust signals matter most.',
                notes: [
                    { label: 'CTA contrast insufficient at conversion stage', detail: 'Checkout placements require the highest possible CTA visibility. The current contrast ratio fails this requirement.', boundingBox: { x: 8, y: 72, w: 28, h: 14 } },
                    { label: 'No trust signal present', detail: 'Conversion placements benefit from a guarantee, rating, or social proof element — currently absent.' },
                ],
                strengths: ['Brand is clearly identifiable for reassurance', 'Clean layout reduces distraction at checkout'],
            },

            // ── Social ──
            {
                id: 'awareness',
                name: 'Awareness (Thumb-Stop)',
                channel: 'Social',
                environmentDescription: 'Social media feeds, story placements, scroll-based content',
                exposureTime: '0.5–2s',
                status: 'run-it',
                recommendation: 'Strong thumb-stop performance. The high-contrast visual and bold headline create an effective pattern interrupt in a fast-moving feed.',
                audience: 'Passive scrollers in discovery mode. No intent, high velocity. The creative has less than 1 second to earn attention before the thumb moves on.',
                notes: [],
                strengths: ['Above-average visual impact score for feed formats', 'Headline lands within first glance', 'Colour palette is distinctive in a content feed'],
            },
            {
                id: 'consideration',
                name: 'Consideration (Pause & Evaluate)',
                channel: 'Social',
                environmentDescription: 'Paused feed viewing, saved posts, second looks',
                exposureTime: '3–8s',
                status: 'fix-first',
                recommendation: 'Fix the headline hierarchy before running in consideration placements. Users who pause to evaluate will read the full copy — the hierarchy conflict creates friction at this stage.',
                audience: 'Users who have chosen to stop and look. Mild to moderate interest. Evaluating whether to save, click, or engage further.',
                notes: [
                    { label: 'Headline hierarchy conflict visible at this exposure', detail: 'A user spending 3–8s will read both headline and sub-headline — the size parity creates reading confusion.', boundingBox: { x: 6, y: 18, w: 55, h: 40 } },
                    { label: 'CTA becomes relevant here', detail: 'Users pausing to evaluate are close to action — CTA contrast fix would improve click-through.', boundingBox: { x: 8, y: 72, w: 28, h: 14 } },
                ],
                strengths: ['Product value proposition is clear when read fully', 'Visual quality supports a premium brand impression'],
            },
            {
                id: 'validation',
                name: 'Validation (Social Proof Check)',
                channel: 'Social',
                environmentDescription: 'Profile visits, comment reading, credibility assessment',
                exposureTime: '5–15s',
                status: 'fix-first',
                recommendation: 'Add a social proof signal before running in validation contexts. Users in credibility-assessment mode expect reviews, ratings, or community signals.',
                audience: 'Users actively checking whether the brand is credible. High engagement, but sceptical. Trust signals and peer evidence matter more than product features.',
                notes: [
                    { label: 'No social proof present', detail: 'Validation-stage users expect a credibility signal — rating, user count, or testimonial. The creative lacks this entirely.' },
                    { label: 'Brand mark alone is insufficient', detail: 'A logo without community validation does not satisfy the trust-checking behaviour at this stage.', boundingBox: { x: 62, y: 55, w: 34, h: 38 } },
                ],
                strengths: ['Visual quality creates a credible first impression', 'Layout is clean enough for extended scrutiny'],
            },
        ],
    }
}