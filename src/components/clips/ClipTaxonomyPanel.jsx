import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import RefreshIcon from '@mui/icons-material/Refresh'
import toast from 'react-hot-toast'
import { AdminLoadingState, AdminMasterDetailSkeleton } from 'src/components/admin/AdminLoadingState'
import { useAdminConfirm } from 'src/components/admin'
import {
  createClipCategory,
  createClipSubcategory,
  deleteClipCategory,
  deleteClipSubcategory,
  getClipTaxonomyAdmin,
  updateClipCategory,
  updateClipSubcategory
} from 'src/services/clipsAdminApi'

function catId(cat) {
  return cat?.id || cat?._id
}

export default function ClipTaxonomyPanel({ onTaxonomyChange }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newSubName, setNewSubName] = useState('')
  const [editCatName, setEditCatName] = useState('')
  const [editingCat, setEditingCat] = useState(false)
  const [editingSubId, setEditingSubId] = useState('')
  const [editSubName, setEditSubName] = useState('')
  const { confirm, ConfirmDialog } = useAdminConfirm()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getClipTaxonomyAdmin()
      const list = Array.isArray(data) ? data : []
      setCategories(list)
      onTaxonomyChange?.(list)
      setSelectedId(prev => {
        if (prev && list.some(c => catId(c) === prev)) return prev
        return list[0] ? catId(list[0]) : ''
      })
    } catch (e) {
      toast.error(e?.message || 'Failed to load categories')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [onTaxonomyChange])

  useEffect(() => {
    void load()
  }, [load])

  const selected = useMemo(
    () => categories.find(c => catId(c) === selectedId),
    [categories, selectedId]
  )

  const subs = selected?.subcategories || []

  const addCategory = async () => {
    const name = newCategory.trim()
    if (!name) return
    try {
      await createClipCategory(name)
      setNewCategory('')
      toast.success('Category created')
      void load()
    } catch (e) {
      toast.error(e?.message)
    }
  }

  const saveCategoryName = async () => {
    if (!selectedId || !editCatName.trim()) return
    try {
      await updateClipCategory(selectedId, { name: editCatName.trim() })
      setEditingCat(false)
      toast.success('Category updated')
      void load()
    } catch (e) {
      toast.error(e?.message)
    }
  }

  const addSubcategory = async () => {
    const name = newSubName.trim()
    if (!selectedId || !name) return
    try {
      await createClipSubcategory(selectedId, name)
      setNewSubName('')
      toast.success('Subcategory created')
      void load()
    } catch (e) {
      toast.error(e?.message)
    }
  }

  const saveSubcategoryName = async () => {
    const name = editSubName.trim()
    if (!editingSubId || !name) return
    try {
      await updateClipSubcategory(editingSubId, { name })
      setEditingSubId('')
      setEditSubName('')
      toast.success('Subcategory updated')
      void load()
    } catch (e) {
      toast.error(e?.message)
    }
  }

  const requestDelete = async target => {
    const ok = await confirm({
      title: `Delete ${target.type === 'category' ? 'category' : 'subcategory'}?`,
      message:
        target.type === 'category'
          ? 'All subcategories must be removed first. This cannot be undone.'
          : 'This subcategory will be removed from the taxonomy.',
      detail: target.label,
      confirmLabel: 'Delete',
      variant: 'danger'
    })
    if (!ok) return
    try {
      if (target.type === 'category') {
        await deleteClipCategory(target.id)
        toast.success('Category deleted')
      } else {
        await deleteClipSubcategory(target.id)
        toast.success('Subcategory deleted')
      }
      void load()
    } catch (e) {
      toast.error(e?.message)
    }
  }

  return (
    <Box>
      <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 2 }}>
        <Typography variant='body2' color='text.secondary'>
          Master data for clip uploads and library publishing. Trainers and trainees pick from these categories in the
          app.
        </Typography>
        <Button size='small' startIcon={<RefreshIcon />} onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </Stack>

      {loading && categories.length === 0 ? <AdminMasterDetailSkeleton /> : null}

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems='stretch'
        sx={{ display: loading && categories.length === 0 ? 'none' : 'flex' }}
      >
        <Box
          sx={{
            width: { xs: '100%', md: 280 },
            flexShrink: 0,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
            <Typography variant='subtitle2' fontWeight={700}>
              Categories
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {categories.length} total
            </Typography>
          </Box>
          <Stack direction='row' spacing={1} sx={{ p: 1.5 }}>
            <TextField
              size='small'
              fullWidth
              placeholder='New category name'
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && void addCategory()}
            />
            <IconButton color='primary' onClick={() => void addCategory()} aria-label='Add category'>
              <AddIcon />
            </IconButton>
          </Stack>
          <Divider />
          {loading ? (
            <Box sx={{ p: 2 }}>
              <AdminLoadingState message='Loading categories…' minHeight={120} />
            </Box>
          ) : categories.length === 0 ? (
            <Alert severity='info' sx={{ m: 1.5 }}>
              No categories yet. Add your first category above.
            </Alert>
          ) : (
            <List dense disablePadding sx={{ maxHeight: 420, overflow: 'auto' }}>
              {categories.map(cat => {
                const id = catId(cat)
                const active = id === selectedId
                return (
                  <ListItemButton key={id} selected={active} onClick={() => setSelectedId(id)}>
                    <ListItemText
                      primary={cat.name}
                      secondary={`${(cat.subcategories || []).length} subcategories`}
                    />
                  </ListItemButton>
                )
              })}
            </List>
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0, border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
          {!selected ? (
            <Typography color='text.secondary'>Select a category to manage subcategories.</Typography>
          ) : (
            <>
              <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 2 }}>
                {editingCat ? (
                  <Stack direction='row' spacing={1} sx={{ flex: 1, mr: 1 }}>
                    <TextField
                      size='small'
                      fullWidth
                      value={editCatName}
                      onChange={e => setEditCatName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && void saveCategoryName()}
                    />
                    <Button size='small' variant='contained' onClick={() => void saveCategoryName()}>
                      Save
                    </Button>
                    <Button size='small' onClick={() => setEditingCat(false)}>
                      Cancel
                    </Button>
                  </Stack>
                ) : (
                  <Box>
                    <Typography variant='h6'>{selected.name}</Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Subcategories shown to users under this sport
                    </Typography>
                  </Box>
                )}
                <Stack direction='row'>
                  {!editingCat ? (
                    <IconButton
                      size='small'
                      onClick={() => {
                        setEditCatName(selected.name)
                        setEditingCat(true)
                      }}
                    >
                      <EditOutlinedIcon fontSize='small' />
                    </IconButton>
                  ) : null}
                  <IconButton
                    size='small'
                    color='error'
                    onClick={() =>
                      void requestDelete({
                        type: 'category',
                        id: selectedId,
                        label: selected.name
                      })
                    }
                  >
                    <DeleteOutlineIcon fontSize='small' />
                  </IconButton>
                </Stack>
              </Stack>

              <Stack direction='row' spacing={1} sx={{ mb: 2 }}>
                <TextField
                  size='small'
                  fullWidth
                  label='New subcategory'
                  value={newSubName}
                  onChange={e => setNewSubName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && void addSubcategory()}
                />
                <Button variant='contained' startIcon={<AddIcon />} onClick={() => void addSubcategory()}>
                  Add
                </Button>
              </Stack>

              {subs.length === 0 ? (
                <Alert severity='info'>No subcategories yet. Add at least one before users can classify clips.</Alert>
              ) : (
                <Stack spacing={1}>
                  {subs.map(sub => {
                    const subId = sub.id || sub._id
                    const isEditing = editingSubId === subId
                    return (
                      <Stack
                        key={subId}
                        direction='row'
                        alignItems='center'
                        justifyContent='space-between'
                        spacing={1}
                        sx={{
                          px: 1.5,
                          py: 1,
                          borderRadius: 1,
                          bgcolor: 'action.hover'
                        }}
                      >
                        {isEditing ? (
                          <Stack direction='row' spacing={1} sx={{ flex: 1 }}>
                            <TextField
                              size='small'
                              fullWidth
                              value={editSubName}
                              onChange={e => setEditSubName(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && void saveSubcategoryName()}
                              autoFocus
                            />
                            <Button size='small' variant='contained' onClick={() => void saveSubcategoryName()}>
                              Save
                            </Button>
                            <Button
                              size='small'
                              onClick={() => {
                                setEditingSubId('')
                                setEditSubName('')
                              }}
                            >
                              Cancel
                            </Button>
                          </Stack>
                        ) : (
                          <>
                            <Typography variant='body2' fontWeight={500}>
                              {sub.name}
                            </Typography>
                            <Stack direction='row'>
                              <IconButton
                                size='small'
                                aria-label={`Edit ${sub.name}`}
                                onClick={() => {
                                  setEditingSubId(subId)
                                  setEditSubName(sub.name || '')
                                }}
                              >
                                <EditOutlinedIcon fontSize='small' />
                              </IconButton>
                              <IconButton
                                size='small'
                                color='error'
                                aria-label={`Delete ${sub.name}`}
                                onClick={() =>
                                  void requestDelete({
                                    type: 'subcategory',
                                    id: subId,
                                    label: sub.name
                                  })
                                }
                              >
                                <DeleteOutlineIcon fontSize='small' />
                              </IconButton>
                            </Stack>
                          </>
                        )}
                      </Stack>
                    )
                  })}
                </Stack>
              )}
            </>
          )}
        </Box>
      </Stack>

      {ConfirmDialog}
    </Box>
  )
}
