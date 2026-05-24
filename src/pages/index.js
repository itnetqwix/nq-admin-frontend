import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Spinner from 'src/@core/components/spinner'

/**
 * Root route — real dashboard lives at /home.
 */
const Index = () => {
  const router = useRouter()

  useEffect(() => {
    if (router.isReady) {
      router.replace('/home')
    }
  }, [router.isReady, router])

  return <Spinner />
}

Index.authGuard = false
Index.guestGuard = false

export default Index
