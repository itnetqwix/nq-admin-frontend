import NextLink from 'next/link'
import Box from '@mui/material/Box'
import { ops } from 'src/styles/opsSurface'
import { useEntityDrawer } from 'src/features/entity-drawers/EntityDrawerContext'

/**
 * Any id or name that has a detail view. Click opens it in the side drawer without leaving the
 * page; the href is a real URL so middle-click / copy-link / open-in-new-tab also work.
 */
export default function EntityLink({ type, id, children, mono = false, sx }) {
  const { hrefFor, open } = useEntityDrawer()
  if (!id) return <Box component='span'>{children ?? '—'}</Box>
  return (
    <Box
      component={NextLink}
      href={hrefFor(type, id)}
      shallow
      scroll={false}
      onClick={e => {
        // Let modified clicks (new tab / window) use the plain href.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return
        e.preventDefault()
        e.stopPropagation()
        open(type, id)
      }}
      sx={{
        color: ops.link,
        textDecoration: 'none',
        fontFamily: mono ? ops.mono : 'inherit',
        fontSize: mono ? 12 : 'inherit',
        '&:hover': { textDecoration: 'underline' },
        '&:focus-visible': { outline: `2px solid ${ops.accent}`, outlineOffset: 2, borderRadius: 2 },
        ...sx
      }}
    >
      {children ?? id}
    </Box>
  )
}
