import { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import AddIcon from '@mui/icons-material/Add'
import toast from 'react-hot-toast'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import {
  createClipCategory,
  createClipSubcategory,
  deleteClipCategory,
  deleteClipSubcategory,
  getClipTaxonomyAdmin
} from 'src/services/clipsAdminApi'

export default function ClipTaxonomyPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [newSubByCat, setNewSubByCat] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getClipTaxonomyAdmin()
      setCategories(Array.isArray(data) ? data : [])
    } catch (e) {
      toast.error(e?.message || 'Failed to load taxonomy')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const addCategory = async () => {
    if (!newCategory.trim()) return
    try {
      await createClipCategory(newCategory.trim())
      setNewCategory('')
      toast.success('Category added')
      void load()
    } catch (e) {
      toast.error(e?.message)
    }
  }

  const addSubcategory = async catId => {
    const name = (newSubByCat[catId] || '').trim()
    if (!name) return
    try {
      await createClipSubcategory(catId, name)
      setNewSubByCat(s => ({ ...s, [catId]: '' }))
      toast.success('Subcategory added')
      void load()
    } catch (e) {
      toast.error(e?.message)
    }
  }

  return (
    <AdminPageShell title='Clips & Library' subtitle='Manage clip categories and subcategories'>
      <AdminPageSection title='Category taxonomy'>
        <Stack direction='row' spacing={2} sx={{ mb: 3 }}>
          <TextField
            size='small'
            label='New category'
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
          />
          <Button variant='contained' startIcon={<AddIcon />} onClick={() => void addCategory()}>
            Add category
          </Button>
        </Stack>
        {loading ? (
          <Typography color='text.secondary'>Loading…</Typography>
        ) : (
          categories.map(cat => (
            <Box key={cat.id || cat._id} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 1 }}>
                <Typography variant='h6'>{cat.name}</Typography>
                <IconButton
                  size='small'
                  color='error'
                  onClick={async () => {
                    try {
                      await deleteClipCategory(cat.id || cat._id)
                      toast.success('Category deleted')
                      void load()
                    } catch (e) {
                      toast.error(e?.message)
                    }
                  }}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Stack>
              <Stack direction='row' flexWrap='wrap' gap={1} sx={{ mb: 2 }}>
                {(cat.subcategories || []).map(sub => (
                  <Chip
                    key={sub.id || sub._id}
                    label={sub.name}
                    onDelete={async () => {
                      try {
                        await deleteClipSubcategory(sub.id || sub._id)
                        toast.success('Subcategory deleted')
                        void load()
                      } catch (e) {
                        toast.error(e?.message)
                      }
                    }}
                  />
                ))}
              </Stack>
              <Stack direction='row' spacing={1}>
                <TextField
                  size='small'
                  label='New subcategory'
                  value={newSubByCat[cat.id || cat._id] || ''}
                  onChange={e =>
                    setNewSubByCat(s => ({ ...s, [cat.id || cat._id]: e.target.value }))
                  }
                />
                <Button variant='outlined' onClick={() => void addSubcategory(cat.id || cat._id)}>
                  Add subcategory
                </Button>
              </Stack>
            </Box>
          ))
        )}
      </AdminPageSection>
    </AdminPageShell>
  )
}
