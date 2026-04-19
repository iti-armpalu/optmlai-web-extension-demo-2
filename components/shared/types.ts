export type CaptureMethod = 'area' | 'upload' | 'click' | 'saved'

export interface Capture {
    id: string
    method: CaptureMethod
    imageUrl: string
    createdAt: Date
    label?: string
}

export interface ImageMetadata {
    format: string
    dimensions: string
    dominantColors: string[]
    detectedElements: string[]
    inferredIntent: string
    layoutStructure: string
    channel: string
}

export interface Report {
    id: string
    captureId: string
    label?: string
    thumbnailUrl?: string
    score?: number
    metadata?: ImageMetadata
    createdAt: Date
    status: 'extracting' | 'generating' | 'complete' | 'error'
    errorMessage?: string
}

// Analysis lifecycle — lives in useOptml, not on Report
export type AnalysisStatus = 'pending' | 'complete'

export interface CreativeDetails {
    channel: string
    purpose: string
    detectedElements: string[]
    confirmedAt?: Date
}