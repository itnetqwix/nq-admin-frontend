import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { EditorState, ContentState } from 'draft-js'
import draftToHtml from 'draftjs-to-html'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'

import { EditorWrapper } from 'src/@core/styles/libs/react-draft-wysiwyg'

const Editor = dynamic(() => import('react-draft-wysiwyg').then(mod => mod.Editor), { ssr: false })

const TOOLBAR = {
  options: ['inline', 'blockType', 'list', 'link', 'history'],
  inline: { options: ['bold', 'italic', 'underline'] },
  blockType: { options: ['Normal', 'H2', 'H3'] },
  list: { options: ['unordered', 'ordered'] }
}

function htmlToEditorState(html) {
  if (!html?.trim() || html === '<p></p>' || html === '<p><br></p>') {
    return EditorState.createEmpty()
  }
  try {
    // eslint-disable-next-line global-require
    const htmlToDraft = require('html-to-draftjs').default
    const blocks = htmlToDraft(html)
    if (!blocks?.contentBlocks?.length) return EditorState.createEmpty()
    const content = ContentState.createFromBlockArray(blocks.contentBlocks, blocks.entityMap)
    return EditorState.createWithContent(content)
  } catch {
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (!text) return EditorState.createEmpty()
    return EditorState.createWithContent(ContentState.createFromText(text))
  }
}

/**
 * Rich HTML editor for CMS surfaces (blog, legal, FAQ answers).
 * Emits HTML via onChange — matches mobile WebView rendering.
 */
export default function CmsHtmlEditor({
  value = '',
  onChange,
  label = 'Content',
  minHeight = 280,
  helperText,
  placeholder
}) {
  const [editorState, setEditorState] = useState(() => htmlToEditorState(value))
  const lastHtml = useRef(value)

  useEffect(() => {
    if (value !== lastHtml.current) {
      lastHtml.current = value
      setEditorState(htmlToEditorState(value))
    }
  }, [value])

  const handleChange = state => {
    setEditorState(state)
    const html = draftToHtml(state.getCurrentContent())
    lastHtml.current = html
    onChange?.(html)
  }

  return (
    <Box>
      {label ? (
        <Typography variant='subtitle2' fontWeight={600} sx={{ mb: 1 }}>
          {label}
        </Typography>
      ) : null}
      <EditorWrapper
        sx={{
          minHeight,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          px: 1,
          bgcolor: 'background.paper',
          '& .rdw-editor-main': { minHeight: minHeight - 48 }
        }}
      >
        <Editor
          editorState={editorState}
          onEditorStateChange={handleChange}
          toolbar={TOOLBAR}
          placeholder={placeholder}
        />
      </EditorWrapper>
      {helperText ? (
        <Typography variant='caption' color='text.secondary' sx={{ mt: 0.75, display: 'block' }}>
          {helperText}
        </Typography>
      ) : null}
    </Box>
  )
}
