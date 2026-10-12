import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getFinanceOpsDashboard } from 'src/services/financeApi'
import { fetchTabData } from './financeTabData'
import { PAGE_SIZE } from './financeTabs'

/**
 * Data for the finance page: the active tab's rows, the escrow summary and the "stuck money" strip.
 * Rows are kept per tab so switching tabs never shows one table's rows under another table's columns
 * while the new tab is still loading.
 */
export default function useFinanceData({ tab, page, searchQ, refundStatus, escrowStatus, ledgerReferenceType, setPage }) {
  const [rowsByTab, setRowsByTab] = useState({})
  const [total, setTotal] = useState(0)
  const [escrowSummary, setEscrowSummary] = useState(null)
  const [opsDashboard, setOpsDashboard] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetchTabData(tab, { page, pageSize: PAGE_SIZE, searchQ, refundStatus, escrowStatus, ledgerReferenceType })
      setRowsByTab(prev => ({ ...prev, [tab]: r.rows }))
      setTotal(r.total)
      if (r.escrowSummary !== undefined) setEscrowSummary(r.escrowSummary)
    } catch (e) {
      console.error(e)
      toast.error(e?.message || 'Failed to load finance data')
    } finally {
      setLoading(false)
    }
  }, [tab, page, searchQ, refundStatus, escrowStatus, ledgerReferenceType])

  useEffect(() => {
    void getFinanceOpsDashboard()
      .then(setOpsDashboard)
      .catch(() => setOpsDashboard(null))
  }, [])

  // A new tab or filter starts again from page 1.
  useEffect(() => {
    setPage(1)
  }, [tab, searchQ, refundStatus, escrowStatus, ledgerReferenceType, setPage])

  useEffect(() => {
    void load()
  }, [load])

  return { rows: rowsByTab[tab] ?? [], total, loading, load, escrowSummary, opsDashboard, pageSize: PAGE_SIZE }
}
