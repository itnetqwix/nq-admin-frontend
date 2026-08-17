import { useState } from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import { DEFAULT_LESSON } from './PricingLessonSplit'
import PricingLessonSplit from './PricingLessonSplit'
import PricingSimulatorTab from './PricingSimulatorTab'
import PricingUnitEconomicsTab from './PricingUnitEconomicsTab'

export default function PricingProfitCheckTab({ config, isDirty, canEdit, onPatchRegion }) {
  const [lesson, setLesson] = useState(DEFAULT_LESSON)

  return (
    <Stack spacing={3}>
      <AdminPageSection
        title='This lesson'
        subtitle='Same quote website and app will charge. Tune commission here; save at the top to publish.'
      >
        <PricingLessonSplit
          config={config}
          isDirty={isDirty}
          canEdit={canEdit}
          onPatchRegion={onPatchRegion}
          value={lesson}
          onChange={setLesson}
        />
      </AdminPageSection>

      <AdminPageSection
        title='After infrastructure'
        subtitle='Step 1 is take-rate minus Stripe. This subtracts AWS and video. 15 min costs less video than 30 min on the same $60 ticket.'
      >
        <PricingUnitEconomicsTab config={config} isDirty={isDirty} lesson={lesson} />
      </AdminPageSection>

      <Accordion disableGutters sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 600 }}>Promo, tax, payment method</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <PricingSimulatorTab config={config} isDirty={isDirty} variant='full' />
        </AccordionDetails>
      </Accordion>
    </Stack>
  )
}
