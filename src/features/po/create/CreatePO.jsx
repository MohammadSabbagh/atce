import { useCreatePO } from './useCreatePO'
import StepIndicator from './StepIndicator'
import Step1Details from './Step1Details'
import Step2LineItems from './Step2LineItems'
import Step3Attachments from './Step3Attachments'
import Step4Review from './Step4Review'
import SubmitSuccess from './SubmitSuccess'
import '@/styles/create-po.scss'

const STEP_LABELS = ['Details', 'Line Items', 'Attachments', 'Review']

export default function CreatePO() {
  const wizard = useCreatePO()
  const { step, submitted, submitting, submitError } = wizard

  if (submitted) return <SubmitSuccess onDone={wizard.handleDone} />

  return (
    <div className="create-po">
      <div className="create-po__header">
        <h1 className="create-po__title">New Purchase Order</h1>
        <StepIndicator current={step} labels={STEP_LABELS} />
      </div>

      <div className="create-po__body">
        {step === 1 && <Step1Details wizard={wizard} />}
        {step === 2 && <Step2LineItems wizard={wizard} />}
        {step === 3 && <Step3Attachments wizard={wizard} />}
        {step === 4 && <Step4Review wizard={wizard} />}
      </div>

      {submitError && (
        <div className="create-po__error">{submitError}</div>
      )}

      <div className="create-po__footer">
        {step > 1 && (
          <button
            className="create-po__btn-back"
            onClick={wizard.goBack}
            disabled={submitting}
          >
            Back
          </button>
        )}
        {step < 4 ? (
          <button
            className="create-po__btn-next"
            onClick={wizard.goNext}
            disabled={!wizard.canProceed()}
          >
            Continue
          </button>
        ) : (
          <button
            className="create-po__btn-submit"
            onClick={wizard.handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : 'Submit PO'}
          </button>
        )}
      </div>
    </div>
  )
}