import { opsTabRedirect } from 'src/features/ops/opsTabRedirect'

export const getServerSideProps = opsTabRedirect('health')

export default function PlatformHealthRedirect() {
  return null
}
