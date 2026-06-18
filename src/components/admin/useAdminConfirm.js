import { useCallback, useRef, useState } from 'react'
import AdminConfirmDialog from './AdminConfirmDialog'

const INITIAL = {
  open: false,
  title: '',
  message: '',
  detail: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  variant: 'default',
  loading: false
}

/**
 * Promise-based confirmations for tables and action buttons.
 */
export function useAdminConfirm() {
  const resolverRef = useRef(null)
  const [state, setState] = useState(INITIAL)

  const close = useCallback((result = false) => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setState(INITIAL)
  }, [])

  const confirm = useCallback(options => {
    return new Promise(resolve => {
      resolverRef.current = resolve
      setState({
        ...INITIAL,
        open: true,
        ...options
      })
    })
  }, [])

  const ConfirmDialog = (
    <AdminConfirmDialog
      {...state}
      onClose={() => close(false)}
      onConfirm={() => close(true)}
    />
  )

  return { confirm, ConfirmDialog }
}
