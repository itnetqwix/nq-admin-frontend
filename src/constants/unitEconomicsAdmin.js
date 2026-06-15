import { DEFAULT_UNIT_ECONOMICS_INFRA, INFRA_CATEGORY_LABELS } from '../../../config/unitEconomicsInfra'

/** Mirrors backend INFRA_CATEGORY_LABELS for admin UI. */
export const INFRA_CATEGORIES = Object.entries(INFRA_CATEGORY_LABELS).map(([id, label]) => ({
  id,
  label
}))

export const DEFAULT_INFRA_FORM = {
  monthlyLessonVolume: String(DEFAULT_UNIT_ECONOMICS_INFRA.monthlyLessonVolume),
  monthlyTrainerOnboardings: String(DEFAULT_UNIT_ECONOMICS_INFRA.monthlyTrainerOnboardings),
  analysisPeriodDays: String(DEFAULT_UNIT_ECONOMICS_INFRA.analysisPeriodDays)
}

export function infraDocToForm(doc) {
  if (!doc) return { global: { ...DEFAULT_INFRA_FORM }, services: {} }
  return {
    global: {
      monthlyLessonVolume: String(doc.monthlyLessonVolume ?? 500),
      monthlyTrainerOnboardings: String(doc.monthlyTrainerOnboardings ?? 8),
      analysisPeriodDays: String(doc.analysisPeriodDays ?? 30)
    },
    services: { ...(doc.services || {}) }
  }
}

export function formToInfraPayload(form) {
  return {
    version: 1,
    monthlyLessonVolume: Number(form.global?.monthlyLessonVolume) || 500,
    monthlyTrainerOnboardings: Number(form.global?.monthlyTrainerOnboardings) || 8,
    analysisPeriodDays: Number(form.global?.analysisPeriodDays) || 30,
    services: form.services || {}
  }
}

/** Which field to edit per allocation type from catalog. */
export function infraValueFieldForAllocation(allocation) {
  switch (allocation) {
    case 'monthly_fixed':
    case 'onboarding_amortized':
      return 'monthlyCostCents'
    case 'per_lesson':
      return 'perLessonCents'
    case 'per_lesson_hour':
      return 'perHourCents'
    case 'per_booking':
      return 'perBookingCents'
    case 'percent_gmv':
      return 'percentRate'
    default:
      return null
  }
}

export function infraFieldLabel(allocation) {
  switch (allocation) {
    case 'monthly_fixed':
    case 'onboarding_amortized':
      return 'Monthly ($)'
    case 'per_lesson':
      return 'Per lesson (¢)'
    case 'per_lesson_hour':
      return 'Per hour (¢)'
    case 'per_booking':
      return 'Per booking (¢)'
    case 'percent_gmv':
      return 'Rate (%)'
    case 'pricing_live_cogs':
      return 'From pricing config'
    default:
      return 'Value'
  }
}

export function readInfraFieldValue(service, field, allocation) {
  if (!field) return ''
  const raw = service?.[field]
  if (raw == null) return ''
  if (field === 'percentRate') return String(Number(raw) * 100)
  if (field === 'monthlyCostCents') return (Number(raw) / 100).toFixed(2)
  return String(raw)
}

export function writeInfraFieldValue(field, input, allocation) {
  if (field === 'percentRate') return Number(input || 0) / 100
  if (field === 'monthlyCostCents') return Math.round(Number(input || 0) * 100)
  return Number(input || 0)
}
