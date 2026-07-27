import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  Stack,
  Typography
} from '@mui/material'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AdminPageShell, { AdminPageSection } from 'src/layouts/components/AdminPageShell'
import AdminDataTable from 'src/layouts/components/AdminDataTable'
import { getCmsAssetHealth, uploadCmsAsset } from 'src/services/cmsApi'

const MAX_MB = 5
const ALLOWED = 'image/jpeg,image/png,image/webp'

export default function CmsUploadsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)
  const [pct, setPct] = useState(null)
  const [lastUrl, setLastUrl] = useState('')
  const [kind, setKind] = useState('banners')

  const loadHealth = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getCmsAssetHealth()
      setStats({ scanned: data?.scanned, ok: data?.ok_count })
      const broken = (data?.broken || []).map((r, i) => ({
        id: `${r.source}-${r.id}-${r.field}-${i}`,
        ...r
      }))
      setRows(broken)
    } catch (e) {
      setError(e?.message || 'Health scan failed')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadHealth()
  }, [loadHealth])

  const onFile = async e => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!ALLOWED.split(',').includes(file.type)) {
      toast.error('JPEG, PNG, or WebP only')
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Max ${MAX_MB} MB`)
      return
    }
    setPct(0)
    setLastUrl('')
    try {
      const { mediaUrl, expiresIn } = await uploadCmsAsset(file, kind, setPct)
      setLastUrl(mediaUrl)
      toast.success(`Uploaded (presign TTL ${expiresIn || 900}s)`)
      await loadHealth()
    } catch (err) {
      toast.error(err?.message || 'Upload failed — retry')
    } finally {
      setPct(null)
    }
  }

  const columns = [
    { field: 'source', headerName: 'Source', width: 90 },
    { field: 'title', headerName: 'Title', flex: 1, minWidth: 140 },
    { field: 'field', headerName: 'Field', width: 140 },
    { field: 'status', headerName: 'HTTP', width: 80 },
    { field: 'error', headerName: 'Error', flex: 1, minWidth: 120 },
    {
      field: 'url',
      headerName: 'URL',
      flex: 1,
      minWidth: 180,
      renderCell: p => (
        <Typography variant='caption' sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.value}>
          {p.value}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      renderCell: p => (
        <Button
          size='small'
          component={Link}
          href={p.row.source === 'tip' ? '/apps/cms/tips' : '/apps/cms/banners'}
        >
          Fix
        </Button>
      )
    }
  ]

  return (
    <AdminPageShell
      title='CMS uploads'
      subtitle={`Signed PUT to S3. Types: JPEG/PNG/WebP · max ${MAX_MB} MB. Stuck = HEAD-failing image URLs.`}
      actions={
        <Stack direction='row' spacing={1}>
          <Button component={Link} href='/apps/cms' variant='outlined'>
            CMS hub
          </Button>
          <Button variant='outlined' onClick={() => void loadHealth()}>
            Rescan health
          </Button>
        </Stack>
      }
      contentSx={{ p: 0 }}
    >
      <AdminPageSection>
        <Alert severity='info' sx={{ mb: 2 }}>
          Presign → PUT. If progress stalls, retry (presign expires ~15 min). Broken list is live CMS references that
          fail HEAD — not the Redis chat-media pending queue.
        </Alert>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
          <Button component='label' variant='contained' disabled={pct != null}>
            Upload to {kind}
            <input hidden type='file' accept={ALLOWED} onChange={onFile} />
          </Button>
          <Button size='small' variant={kind === 'banners' ? 'contained' : 'text'} onClick={() => setKind('banners')}>
            banners
          </Button>
          <Button size='small' variant={kind === 'tips' ? 'contained' : 'text'} onClick={() => setKind('tips')}>
            tips
          </Button>
          <Button size='small' variant={kind === 'pages' ? 'contained' : 'text'} onClick={() => setKind('pages')}>
            pages
          </Button>
        </Stack>

        {pct != null ? (
          <Box sx={{ mb: 2 }}>
            <Typography variant='caption'>Uploading… {pct}%</Typography>
            <LinearProgress variant='determinate' value={pct} />
          </Box>
        ) : null}

        {lastUrl ? (
          <Alert severity='success' sx={{ mb: 2 }}>
            Public URL (paste into banner/tip): <code>{lastUrl}</code>
          </Alert>
        ) : null}

        <Typography variant='subtitle2' sx={{ mb: 1 }}>
          Stuck / broken assets
          {stats ? ` · scanned ${stats.scanned}, ok ${stats.ok}, broken ${rows.length}` : ''}
        </Typography>
        <AdminDataTable
          rows={rows}
          columns={columns}
          loading={loading}
          error={error}
          total={rows.length}
          page={0}
          pageSize={50}
          onPaginationModelChange={() => {}}
          onRetry={() => void loadHealth()}
          emptyMessage='No broken image URLs'
          height={420}
        />
      </AdminPageSection>
    </AdminPageShell>
  )
}
