import { useRouter } from 'next/router'
import Button from '@mui/material/Button'
import Icon from 'src/@core/components/icon'

export default function LiveLessonsHistoryLink() {
  const router = useRouter()
  return (
    <Button variant='outlined' startIcon={<Icon icon='mdi:history' />} onClick={() => router.push('/apps/live-lessons/history')}>
      History & debug
    </Button>
  )
}
