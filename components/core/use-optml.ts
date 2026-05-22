'use client'

import { useState, useCallback, useRef } from 'react'
import type { Capture, CaptureMethod, Report, AnalysisStatus, CreativeDetails } from '../shared/types'
import { extractMetadata } from '../capture/extract-metadata'

const MOCK_CREDITS = 5

export function useOptml() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSelectingArea, setIsSelectingArea] = useState(false)
  const [pendingCapture, setPendingCapture] = useState<{
    method: CaptureMethod
    imageUrl: string
    label?: string
  } | null>(null)
  const [captureProcessing, setCaptureProcessing] = useState(false)
  const [captures, setCaptures] = useState<Capture[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [activeCapture, setActiveCapture] = useState<Capture | null>(null)
  const [creditBalance, setCreditBalance] = useState(MOCK_CREDITS)
  const [openReportId, setOpenReportId] = useState<string | null>(null)
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('pending')
  const [creativeDetails, setCreativeDetails] = useState<CreativeDetails | undefined>(undefined)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleSidebar = useCallback(() => setIsOpen((prev) => !prev), [])
  const closeSidebar = useCallback(() => setIsOpen(false), [])

  const stageCapture = useCallback(
    (method: CaptureMethod, imageUrl: string, label?: string) => {
      setPendingCapture({ method, imageUrl, label })
      setIsOpen(true)
    },
    []
  )

  const confirmCapture = useCallback(async () => {
    if (!pendingCapture) return

    // Show processing state inside CaptureConfirm — keep dialog open
    setCaptureProcessing(true)

    const capture: Capture = {
      id: crypto.randomUUID(),
      method: pendingCapture.method,
      imageUrl: pendingCapture.imageUrl,
      createdAt: new Date(),
      label: pendingCapture.label,
    }

    // Deduct credit immediately
    setCaptures((prev) => [capture, ...prev])
    setActiveCapture(capture)
    setCreditBalance((prev) => Math.max(0, prev - 1))

    // Create report stub in 'extracting' state
    const reportId = crypto.randomUUID()
    const reportStub: Report = {
      id: reportId,
      captureId: capture.id,
      label: capture.label,
      thumbnailUrl: capture.imageUrl,
      createdAt: new Date(),
      status: 'extracting',
    }
    setReports((prev) => [reportStub, ...prev])

    // Run lightweight metadata extraction — dialog stays open during this
    try {
      const metadata = await extractMetadata(capture.imageUrl)

      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, status: 'generating' as const, metadata }
            : r
        )
      )

      // Close capture dialog, reset analysis state, open report drawer
      // User sees the report structure first — they open Confirm Details when ready
      setPendingCapture(null)
      setCaptureProcessing(false)
      setAnalysisStatus('pending')
      setCreativeDetails(undefined)
      setOpenReportId(reportId)

      // TODO Cycle 2: kick off full AI analysis here
      await new Promise(res => setTimeout(res, 1200))
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, status: 'complete' as const, score: 72 }
            : r
        )
      )
    } catch (err) {
      console.error('[Optml] Metadata extraction failed:', err)
      setCaptureProcessing(false)
      setPendingCapture(null)
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? {
                ...r,
                status: 'error' as const,
                errorMessage: err instanceof Error ? err.message : 'Extraction failed',
              }
            : r
        )
      )
    }
  }, [pendingCapture])

  const discardCapture = useCallback(() => setPendingCapture(null), [])

  const selectCapture = useCallback((capture: Capture) => {
    setActiveCapture(capture)
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const url = URL.createObjectURL(file)
      stageCapture('upload', url, file.name)
      e.target.value = ''
    },
    [stageCapture]
  )

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const startAreaSelection = useCallback(() => {
    setIsOpen(false)
    setIsSelectingArea(true)
  }, [])

  const handleAreaCapture = useCallback(
    (dataUrl: string) => {
      setIsSelectingArea(false)
      stageCapture('area', dataUrl, 'Area capture')
    },
    [stageCapture]
  )

  const cancelAreaSelection = useCallback(() => {
    setIsSelectingArea(false)
    setIsOpen(true)
  }, [])

  const renameReport = useCallback((id: string, newName: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, label: newName } : r))
  }, [])

  const deleteReport = useCallback((id: string) => {
    setReports(prev => prev.filter(r => r.id !== id))
    setOpenReportId(prev => prev === id ? null : prev)
  }, [])

  const confirmCreativeDetails = useCallback((details: CreativeDetails) => {
    setCreativeDetails(details)
    setAnalysisStatus('complete')
    setShowConfirmDialog(false)
  }, [])

  return {
    isOpen,
    isSelectingArea,
    pendingCapture,
    captures,
    reports,
    activeCapture,
    creditBalance,
    captureProcessing,
    openReportId,
    setOpenReportId,
    analysisStatus,
    creativeDetails,
    showConfirmDialog,
    setShowConfirmDialog,
    confirmCreativeDetails,
    renameReport,
    deleteReport,
    fileInputRef,
    toggleSidebar,
    closeSidebar,
    stageCapture,
    confirmCapture,
    discardCapture,
    selectCapture,
    handleFileChange,
    handleUploadClick,
    startAreaSelection,
    handleAreaCapture,
    cancelAreaSelection,
  }
}