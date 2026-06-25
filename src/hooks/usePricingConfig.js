import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { deepClone } from 'src/constants/pricingAdmin'
import {
  fetchPricingConfig,
  fetchPricingDefaults,
  updatePricingConfig
} from 'src/services/pricingApi'

export function usePricingConfig() {
  const [config, setConfig] = useState(null)
  const [savedConfig, setSavedConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const isDirty = useMemo(() => {
    if (!config || !savedConfig) return false
    return JSON.stringify(config) !== JSON.stringify(savedConfig)
  }, [config, savedConfig])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchPricingConfig()
      const snapshot = deepClone(data)
      setConfig(snapshot)
      setSavedConfig(deepClone(data))
    } catch (e) {
      toast.error(e?.message || 'Failed to load pricing config')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const patch = useCallback(updater => {
    setConfig(prev => {
      const next = deepClone(prev)
      updater(next)
      return next
    })
  }, [])

  const patchRegion = useCallback((regionKey, partial) => {
    patch(cfg => {
      cfg.regions[regionKey] = { ...cfg.regions[regionKey], ...partial }
    })
  }, [patch])

  const patchProductFee = useCallback((productKey, partial) => {
    patch(cfg => {
      cfg.productFees[productKey] = { ...cfg.productFees[productKey], ...partial }
    })
  }, [patch])

  const patchPaymentMethod = useCallback((regionKey, methodId, partial) => {
    patch(cfg => {
      const fees = cfg.regions[regionKey].paymentMethodFees || {}
      fees[methodId] = { ...(fees[methodId] || { bps: 0, fixedMinor: 0 }), ...partial }
      cfg.regions[regionKey].paymentMethodFees = fees
    })
  }, [patch])

  const patchStoragePlan = useCallback((regionKey, planId, partial) => {
    patch(cfg => {
      const plans = cfg.regions[regionKey].storagePlans || {}
      plans[planId] = { ...(plans[planId] || {}), ...partial }
      cfg.regions[regionKey].storagePlans = plans
    })
  }, [patch])

  const patchTaxRate = useCallback((regionKey, jurisdictionCode, rateDecimal) => {
    patch(cfg => {
      const rates = { ...(cfg.regions[regionKey].salesTaxRates || {}) }
      rates[jurisdictionCode] = Number(rateDecimal) || 0
      cfg.regions[regionKey].salesTaxRates = rates
    })
  }, [patch])

  const patchEscrowPolicy = useCallback(partial => {
    patch(cfg => {
      cfg.escrowPolicy = { ...(cfg.escrowPolicy || {}), ...partial }
    })
  }, [patch])

  const patchGlobal = useCallback(partial => {
    patch(cfg => Object.assign(cfg, partial))
  }, [patch])

  const save = useCallback(async () => {
    if (!config) return false
    setSaving(true)
    try {
      const saved = await updatePricingConfig(config)
      const snapshot = deepClone(saved)
      setConfig(snapshot)
      setSavedConfig(deepClone(saved))
      toast.success('Pricing configuration saved')
      return true
    } catch (e) {
      toast.error(e?.message || 'Save failed')
      return false
    } finally {
      setSaving(false)
    }
  }, [config])

  const discard = useCallback(() => {
    setConfig(deepClone(savedConfig))
    toast.success('Changes discarded')
  }, [savedConfig])

  const resetToDefaults = useCallback(async () => {
    try {
      const defaults = await fetchPricingDefaults()
      setConfig(deepClone(defaults))
      toast.success('Loaded system defaults — click Save to apply')
    } catch (e) {
      toast.error(e?.message || 'Could not load defaults')
    }
  }, [])

  return {
    config,
    savedConfig,
    loading,
    saving,
    isDirty,
    load,
    save,
    discard,
    resetToDefaults,
    patchRegion,
    patchProductFee,
    patchPaymentMethod,
    patchStoragePlan,
    patchTaxRate,
    patchEscrowPolicy,
    patchGlobal
  }
}
