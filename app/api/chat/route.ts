import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({ ...body, stream: true }),
        })

        if (!response.ok) {
            const error = await response.json()
            return new Response(JSON.stringify({ error: error.error?.message ?? 'API error' }), {
                status: response.status,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // Stream the SSE response directly to the client
        return new Response(response.body, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        })
    } catch {
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}