import { opsTabRedirect } from 'src/features/ops/opsTabRedirect'

export const getServerSideProps = opsTabRedirect('calls')

export default function CallDiagnosticsRedirect() {
  return null
}
