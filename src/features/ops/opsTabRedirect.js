/** Server redirect from legacy ops routes → /apps/ops?tab=… (preserves query). */
export function opsTabRedirect(tab) {
  return async function getServerSideProps({ query }) {
    const params = new URLSearchParams()
    params.set('tab', tab)
    for (const [key, raw] of Object.entries(query || {})) {
      if (key === 'tab') continue
      const value = Array.isArray(raw) ? raw[0] : raw
      if (value != null && value !== '') params.set(key, String(value))
    }
    return {
      redirect: {
        destination: `/apps/ops?${params.toString()}`,
        permanent: false
      }
    }
  }
}
