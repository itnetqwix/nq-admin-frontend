import { useState } from 'react'
import { Button } from '@mui/material'
import Link from 'next/link'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import ClipTaxonomyPanel from 'src/components/clips/ClipTaxonomyPanel'

export default function ClipTaxonomyPage() {
  const [, setTaxonomy] = useState([])

  return (
    <AdminPageShell
      title='Clip categories (master data)'
      subtitle='Create and organize categories and subcategories used when users upload clips and request library publishing.'
      actions={
        <Button component={Link} href='/apps/library-submissions' variant='outlined' size='small'>
          Library requests
        </Button>
      }
    >
      <AdminPageSection>
        <ClipTaxonomyPanel onTaxonomyChange={setTaxonomy} />
      </AdminPageSection>
    </AdminPageShell>
  )
}
