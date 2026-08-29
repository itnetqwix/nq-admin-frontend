import { useState } from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { AdminSubTabs, OpsSurfaceCard } from 'src/components/admin'
import { ops } from 'src/styles/opsSurface'
import { DEFAULT_LESSON } from './PricingLessonSplit'
import PricingLessonSplit from './PricingLessonSplit'
import PricingSimulatorTab from './PricingSimulatorTab'
import PricingUnitEconomicsTab from './PricingUnitEconomicsTab'

const PROFIT_SUB_TABS = [
  { value: 'lesson', label: 'This lesson' },
  { value: 'infra', label: 'After infrastructure' },
  { value: 'advanced', label: 'Advanced simulator' }
]

export default function PricingProfitCheckTab({ config, isDirty, canEdit, onPatchRegion }) {
  const [lesson, setLesson] = useState(DEFAULT_LESSON)
  const [subTab, setSubTab] = useState('lesson')

  return (
    <Stack spacing={2.5}>
      <AdminSubTabs value={subTab} onChange={setSubTab} tabs={PROFIT_SUB_TABS} />

      {subTab === 'lesson' ? (
        <OpsSurfaceCard>
          <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', fontSize: 16, mb: 0.5 }}>
            This lesson
          </Typography>
          <Typography sx={{ fontSize: 13, color: ops.body, mb: 2, lineHeight: 1.5 }}>
            Same quote website and app will charge. Tune commission here; save at the top to publish.
          </Typography>
          <PricingLessonSplit
            config={config}
            isDirty={isDirty}
            canEdit={canEdit}
            onPatchRegion={onPatchRegion}
            value={lesson}
            onChange={setLesson}
          />
        </OpsSurfaceCard>
      ) : null}

      {subTab === 'infra' ? (
        <OpsSurfaceCard>
          <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', fontSize: 16, mb: 0.5 }}>
            After infrastructure
          </Typography>
          <Typography sx={{ fontSize: 13, color: ops.body, mb: 2, lineHeight: 1.5 }}>
            Commission is the company take. After infra for this duration should still be at least that commission —
            raise trainee fees if it falls short.
          </Typography>
          <PricingUnitEconomicsTab config={config} isDirty={isDirty} lesson={lesson} />
        </OpsSurfaceCard>
      ) : null}

      {subTab === 'advanced' ? (
        <OpsSurfaceCard>
          <Typography sx={{ fontWeight: 600, letterSpacing: '-0.28px', fontSize: 16, mb: 0.5 }}>
            Promo, tax, payment method
          </Typography>
          <Typography sx={{ fontSize: 13, color: ops.body, mb: 2, lineHeight: 1.5 }}>
            Full quote simulator with optional promo and payment method overrides.
          </Typography>
          <PricingSimulatorTab config={config} isDirty={isDirty} variant='full' />
        </OpsSurfaceCard>
      ) : null}
    </Stack>
  )
}
