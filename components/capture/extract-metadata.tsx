import type { ImageMetadata } from '../shared/types'

// Lightweight metadata extraction — runs immediately on confirm.
// Hardcoded for now; Cycle 2 will replace with a real vision API call.
//
// In production this would:
//   1. Send the image to a fast /api/extract endpoint
//   2. Run a lightweight vision model pass (no scoring, no heatmap)
//   3. Return structured metadata in < 2s
//
// The metadata is used to:
//   - Show the user something meaningful instantly
//   - Pre-fill the report context before the full analysis runs
//   - Let the user confirm/correct detected elements before credits are spent

const MOCK_METADATA: ImageMetadata[] = [
    {
        format: 'Horizontal banner',
        dimensions: '1200 × 400',
        dominantColors: ['#0f0f1a', '#7c3aed', '#ffffff'],
        detectedElements: ['Headline', 'Sub-headline', 'CTA button', 'Brand mark', 'Product visual'],
        inferredIntent: 'Product launch — driving awareness and direct clicks to shop',
        layoutStructure: 'Left-aligned text block with right-side product visual',
        channel: 'Paid social / display',
    },
    {
        format: 'Square product card',
        dimensions: '800 × 800',
        dominantColors: ['#ffffff', '#f59e0b', '#1f2937'],
        detectedElements: ['Product image', 'Price label', 'Brand name', 'Star rating', 'Add to cart CTA'],
        inferredIntent: 'E-commerce conversion — driving immediate purchase',
        layoutStructure: 'Vertical stack: product image top, metadata bottom',
        channel: 'E-commerce / retargeting',
    },
    {
        format: 'Social story / lifestyle',
        dimensions: '1080 × 1080',
        dominantColors: ['#0891b2', '#06b6d4', '#ffffff'],
        detectedElements: ['Brand handle', 'Lifestyle headline', 'Body copy', 'Primary CTA', 'Secondary CTA'],
        inferredIntent: 'Brand awareness — lifestyle association and trial conversion',
        layoutStructure: 'Full-bleed gradient background, bottom-anchored content',
        channel: 'Instagram / Facebook feed',
    },
]

// Simulates a fast extraction pass (~600ms)
export async function extractMetadata(_imageUrl: string): Promise<ImageMetadata> {
    await new Promise(res => setTimeout(res, 3800))

    // Cycle 2: replace with real API call:
    // const res = await fetch('/api/extract', {
    //   method: 'POST',
    //   body: JSON.stringify({ imageUrl: _imageUrl }),
    // })
    // return res.json()

    // Return a random mock for now so different captures feel distinct
    return MOCK_METADATA[Math.floor(Math.random() * MOCK_METADATA.length)]
}