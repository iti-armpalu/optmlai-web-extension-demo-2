import type { Report } from './types'

export function generateTitle(report: Report): string {
    if (report.label && report.label !== 'Area capture' && report.label !== 'Upload') {
        return report.label
    }

    if (!report.metadata) return report.label ?? 'Creative report'

    const intentMap: Record<string, string> = {
        'Product launch': 'Product Launch Creative',
        'E-commerce conversion': 'E-commerce Conversion Ad',
        'Brand awareness': 'Brand Awareness Campaign',
    }

    for (const [key, title] of Object.entries(intentMap)) {
        if (report.metadata.inferredIntent.includes(key)) {
            return `${title} — ${report.metadata.format}`
        }
    }

    return `${report.metadata.format} Analysis`
}