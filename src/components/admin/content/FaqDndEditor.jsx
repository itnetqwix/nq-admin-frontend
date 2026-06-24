import React from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'

import CmsHtmlEditor from './CmsHtmlEditor'

function SortableSection({ sec, si, sections, setSections, markDirty, onRemoveSection, onAddItem, onRemoveItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sec.id
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1
  }

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{ mb: 2.5, p: 2, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}
    >
      <Stack direction='row' spacing={1} alignItems='flex-start' sx={{ mb: 2 }}>
        <IconButton size='small' {...attributes} {...listeners} aria-label='Drag section'>
          <DragIndicatorIcon fontSize='small' />
        </IconButton>
        <TextField
          label={`Section ${si + 1} title`}
          fullWidth
          size='small'
          value={sec.title}
          onChange={e => {
            markDirty(() =>
              setSections(prev => prev.map(s => (s.id === sec.id ? { ...s, title: e.target.value } : s)))
            )
          }}
          placeholder='e.g. Getting started'
        />
        <IconButton color='error' onClick={() => void onRemoveSection(sec.id)} aria-label='Remove section'>
          <DeleteOutlineIcon />
        </IconButton>
      </Stack>

      <SortableContext items={(sec.items || []).map(it => it.id)} strategy={verticalListSortingStrategy}>
        {(sec.items || []).map((it, ii) => (
          <SortableFaqItem
            key={it.id}
            item={it}
            ii={ii}
            sec={sec}
            sections={sections}
            setSections={setSections}
            markDirty={markDirty}
            onRemoveItem={onRemoveItem}
            canRemove={(sec.items || []).length > 1}
          />
        ))}
      </SortableContext>

      <Button size='small' onClick={() => onAddItem(sec.id)} sx={{ mt: 1 }}>
        Add question
      </Button>
    </Box>
  )
}

function SortableFaqItem({ item, ii, sec, setSections, markDirty, onRemoveItem, canRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <Box ref={setNodeRef} style={style} sx={{ mb: 2, pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}>
      <Stack direction='row' spacing={1} alignItems='flex-start'>
        <IconButton size='small' {...attributes} {...listeners} aria-label='Drag question'>
          <DragIndicatorIcon fontSize='small' />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <TextField
            label={`Question ${ii + 1}`}
            fullWidth
            size='small'
            value={item.q}
            onChange={e => {
              markDirty(() =>
                setSections(prev =>
                  prev.map(s =>
                    s.id === sec.id
                      ? {
                          ...s,
                          items: s.items.map(it => (it.id === item.id ? { ...it, q: e.target.value } : it))
                        }
                      : s
                  )
                )
              )
            }}
            sx={{ mb: 1.5 }}
          />
          <CmsHtmlEditor
            label='Answer'
            value={item.a}
            onChange={html => {
              markDirty(() =>
                setSections(prev =>
                  prev.map(s =>
                    s.id === sec.id
                      ? {
                          ...s,
                          items: s.items.map(it => (it.id === item.id ? { ...it, a: html } : it))
                        }
                      : s
                  )
                )
              )
            }}
            minHeight={160}
            helperText='Rich text supported — links and lists render in the app.'
          />
          {canRemove ? (
            <Button size='small' color='error' sx={{ mt: 1 }} onClick={() => void onRemoveItem(sec.id, item.id)}>
              Remove
            </Button>
          ) : null}
        </Box>
      </Stack>
    </Box>
  )
}

export default function FaqDndEditor({
  sections,
  setSections,
  markDirty,
  onRemoveSection,
  onAddSection,
  onAddItem,
  onRemoveItem
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = event => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeSection = sections.find(s => s.id === active.id)
    const overSection = sections.find(s => s.id === over.id)
    if (activeSection && overSection) {
      markDirty(() => {
        const oldIndex = sections.findIndex(s => s.id === active.id)
        const newIndex = sections.findIndex(s => s.id === over.id)
        setSections(arrayMove(sections, oldIndex, newIndex))
      })
      return
    }

    for (const sec of sections) {
      const activeItem = sec.items.find(it => it.id === active.id)
      const overItem = sec.items.find(it => it.id === over.id)
      if (activeItem && overItem && sec.id === sections.find(s => s.items.some(it => it.id === over.id))?.id) {
        markDirty(() => {
          setSections(prev =>
            prev.map(s => {
              if (s.id !== sec.id) return s
              const oldIndex = s.items.findIndex(it => it.id === active.id)
              const newIndex = s.items.findIndex(it => it.id === over.id)
              return { ...s, items: arrayMove(s.items, oldIndex, newIndex) }
            })
          )
        })
        return
      }
    }
  }

  return (
    <Box>
      <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 2 }}>
        <Typography variant='subtitle1' fontWeight={700}>
          Editor
        </Typography>
        <Button size='small' startIcon={<AddIcon />} onClick={onAddSection}>
          Add section
        </Button>
      </Stack>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {sections.map((sec, si) => (
            <SortableSection
              key={sec.id}
              sec={sec}
              si={si}
              sections={sections}
              setSections={setSections}
              markDirty={markDirty}
              onRemoveSection={onRemoveSection}
              onAddItem={onAddItem}
              onRemoveItem={onRemoveItem}
            />
          ))}
        </SortableContext>
      </DndContext>
    </Box>
  )
}
