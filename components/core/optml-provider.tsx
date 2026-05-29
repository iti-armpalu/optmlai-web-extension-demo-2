'use client'

import { useState } from 'react'
import { useOptml } from './use-optml'
import { FloatingToggle } from './floating-toggle'
import { OptmlSidebar } from './sidebar'
import { AreaSelector } from '../capture/area-selector'
import { CaptureConfirm } from '../capture/capture-confirm'
import { FromCapturesDrawer } from '../capture/from-captures-drawer'
import { ReportDrawer } from '../report/report-drawer'
import { ConfirmDetailsDialog } from '../report/confirm-details-dialog'
import { AllReportsDrawer } from '../report/all-reports-drawer'

export function OptmlProvider() {
  const {
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
  } = useOptml()

  const openReport = reports.find((r) => r.id === openReportId) ?? null
  const [showAllReports, setShowAllReports] = useState(false)
  const [showFromCaptures, setShowFromCaptures] = useState(false)

  return (
    <>
      {/* Area selector — full screen, renders alone */}
      {isSelectingArea && (
        <AreaSelector
          onCapture={handleAreaCapture}
          onCancel={cancelAreaSelection}
        />
      )}

      {!isSelectingArea && (
        <>
          {/* Floating toggle — always visible */}
          <FloatingToggle
            isOpen={isOpen}
            onClick={toggleSidebar}
          />

          {/* Sidebar */}
          <OptmlSidebar
            isOpen={isOpen}
            onClose={closeSidebar}
            captures={captures}
            reports={reports}
            analysisStatus={analysisStatus}
            activeCapture={activeCapture}
            creditBalance={creditBalance}
            onCapture={stageCapture}
            onSelectCapture={selectCapture}
            onOpenReport={(id) => setOpenReportId(id)}
            onShowAllReports={() => setShowAllReports(true)}
            onRenameReport={renameReport}
            onDeleteReport={deleteReport}
            onUploadClick={handleUploadClick}
            onAreaSelect={startAreaSelection}
            onFromCaptures={() => setShowFromCaptures(true)}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
          />

          {/* From captures drawer */}
          <FromCapturesDrawer
            isOpen={showFromCaptures}
            onClose={() => setShowFromCaptures(false)}
            captures={captures}
            onSelectCapture={(capture) => {
              setShowFromCaptures(false)
              stageCapture(capture.method, capture.imageUrl, capture.label)
            }}
          />

          {/* Capture confirm — independent of sidebar open state */}
          {pendingCapture && (
            <div onClick={e => e.stopPropagation()}>
              <CaptureConfirm
                imageUrl={pendingCapture.imageUrl}
                creditBalance={creditBalance}
                isProcessing={captureProcessing}
                onConfirm={confirmCapture}
                onDiscard={discardCapture}
              />
            </div>
          )}

          {/* Report drawer — independent of sidebar open state */}
          <ReportDrawer
            report={openReport}
            isOpen={openReportId !== null}
            onClose={() => setOpenReportId(null)}
            analysisStatus={analysisStatus}
            creativeDetails={creativeDetails}
            onConfirmDetails={() => setShowConfirmDialog(true)}
          />
        </>
      )}

      {/* All reports drawer */}
      <AllReportsDrawer
        isOpen={showAllReports}
        onClose={() => setShowAllReports(false)}
        reports={reports}
        onOpenReport={(id) => { setOpenReportId(id); setShowAllReports(false) }}
        onRenameReport={renameReport}
        onDeleteReport={deleteReport}
      />

      {/* Confirm details dialog — always mounted */}
      <ConfirmDetailsDialog
        key={openReportId ?? 'no-report'}
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmCreativeDetails}
        initialDetails={creativeDetails}
        imageUrl={openReport?.thumbnailUrl}
      />
    </>
  )
}