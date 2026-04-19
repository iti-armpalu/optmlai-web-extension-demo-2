'use client'

import { useOptml } from './use-optml'
import { FloatingToggle } from './floating-toggle'
import { OptmlSidebar } from './sidebar'
import { AreaSelector } from '../capture/area-selector'
import { CaptureConfirm } from '../capture/capture-confirm'
import { ReportDrawer } from '../report/report-drawer'
import { ConfirmDetailsDialog } from '../report/confirm-details-dialog'

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

    return (
        <>
            {/* Area selector overlay */}
            {isSelectingArea && (
                <AreaSelector
                    onCapture={handleAreaCapture}
                    onCancel={cancelAreaSelection}
                />
            )}

            {!isSelectingArea && (
                <>
                    <FloatingToggle isOpen={isOpen} onClick={toggleSidebar} />

                    {isOpen && pendingCapture && (
                        <CaptureConfirm
                            imageUrl={pendingCapture.imageUrl}
                            creditBalance={creditBalance}
                            isProcessing={captureProcessing}
                            onConfirm={confirmCapture}
                            onDiscard={discardCapture}
                        />
                    )}

                    <OptmlSidebar
                        isOpen={isOpen}
                        onClose={closeSidebar}
                        captures={captures}
                        reports={reports}
                        activeCapture={activeCapture}
                        onCapture={stageCapture}
                        onSelectCapture={selectCapture}
                        onShowAllReports={() => console.log('[Optml] Show all reports')}
                        onRenameReport={renameReport}
                        onDeleteReport={deleteReport}
                        onUploadClick={handleUploadClick}
                        onAreaSelect={startAreaSelection}
                        fileInputRef={fileInputRef}
                        onFileChange={handleFileChange}
                    />

                    {/* Report drawer — opens automatically after extraction */}
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

            {/* Dialog always mounted outside conditional so it can open reliably */}
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