// src/features/po/EditPO.jsx

import { useEditPO } from './usePOEdit'
import WizardShell from '@/components/form/WizardShell'
import Step1Details from './create/Step1Details'
import Step2LineItems from './create/Step2LineItems'
import Step3Attachments from './create/Step3Attachments'
import Step4Review from './create/Step4Review'
import SubmitSuccess from './create/SubmitSuccess'
import { S } from '@/lib/strings'

const STEP_LABELS = [S.stepDetails, S.stepItems, S.stepAttach, S.stepReview]

export default function EditPO() {
  const wizard = useEditPO()
  const { loading, loadError, step, submitted, submitting, submitError } = wizard

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
        جارٍ التحميل…
      </div>
    )
  }

  if (loadError) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
        {loadError}
      </div>
    )
  }

  if (submitted) {
    return <SubmitSuccess onDone={wizard.handleDone} />
  }

  const isFinalStep = step === 4

  return (
    <WizardShell
      title={S.editPO ?? 'تعديل طلب الشراء'}
      step={step}
      totalSteps={4}
      stepLabels={STEP_LABELS}
      error={submitError}
      primary={{
        label: isFinalStep
          ? (submitting ? S.submitting : S.saveDraft ?? 'حفظ التعديلات')
          : S.continue,
        onClick: isFinalStep ? wizard.handleSubmit : wizard.goNext,
        disabled: isFinalStep ? submitting : !wizard.canProceed(),
      }}
      secondary={
        step > 1
          ? { label: S.back, onClick: wizard.goBack, disabled: submitting }
          : null
      }
    >
      {step === 1 && <Step1Details wizard={wizard} />}
      {step === 2 && <Step2LineItems wizard={wizard} />}
      {step === 3 && <Step3Attachments wizard={wizard} />}
      {step === 4 && <Step4Review wizard={wizard} />}
    </WizardShell>
  )
}