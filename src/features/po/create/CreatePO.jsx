import { useCreatePO } from './useCreatePO'
import WizardShell from '@/components/form/WizardShell'
import Step1Details from './Step1Details'
import Step2LineItems from './Step2LineItems'
import Step3Attachments from './Step3Attachments'
import Step4Review from './Step4Review'
import SubmitSuccess from './SubmitSuccess'
import { S } from '@/lib/strings'

const STEP_LABELS = [S.stepDetails, S.stepItems, S.stepAttach, S.stepReview]

export default function CreatePO() {
  const wizard = useCreatePO()
  const { step, submitted, submitting, submitError } = wizard

  if (submitted) return <SubmitSuccess onDone={wizard.handleDone} />

  const isFinalStep = step === 4

  return (
    <WizardShell
      title={S.createPO}
      step={step}
      totalSteps={4}
      stepLabels={STEP_LABELS}
      error={submitError}
      primary={{
        label: isFinalStep
          ? (submitting ? S.submitting : S.submit)
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