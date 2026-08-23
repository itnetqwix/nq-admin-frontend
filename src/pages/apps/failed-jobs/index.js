import { opsTabRedirect } from 'src/features/ops/opsTabRedirect'

export const getServerSideProps = opsTabRedirect('jobs')

export default function FailedJobsRedirect() {
  return null
}
