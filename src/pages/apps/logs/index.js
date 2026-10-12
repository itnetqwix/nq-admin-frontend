import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function RemovedLogsPage() {
  const router = useRouter()

  useEffect(() => {
    void router.replace('/apps/ops?tab=events')
  }, [router])

  return null
}
