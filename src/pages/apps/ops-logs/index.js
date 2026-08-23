import { opsTabRedirect } from 'src/features/ops/opsTabRedirect'

export const getServerSideProps = opsTabRedirect('events')

export default function OpsLogsRedirect() {
  return null
}
