import { Button } from '@mui/material'
import Link from 'next/link'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import LibrarySubmissionsPanel from 'src/components/clips/LibrarySubmissionsPanel'

export default function LibrarySubmissionsPage() {
  return (
    <AdminPageShell
      title='Netqwix Library requests'
      subtitle='Review videos submitted by trainers or trainees who want their clip added to the public Netqwix Library. Watch the clip, confirm category placement, then approve or reject with a reason.'
      actions={
        <Button component={Link} href='/apps/clip-taxonomy' variant='outlined' size='small'>
          Manage categories
        </Button>
      }
    >
      <AdminPageSection>
        <LibrarySubmissionsPanel />
      </AdminPageSection>
    </AdminPageShell>
  )
}
