import BlankLayout from 'src/@core/layouts/BlankLayout'

/** Public admin signup is closed — staff are invited from Roles. */
export async function getServerSideProps() {
  return { redirect: { destination: '/login', permanent: false } }
}

function RegisterRedirect() {
  return null
}

RegisterRedirect.getLayout = page => <BlankLayout>{page}</BlankLayout>
RegisterRedirect.guestGuard = true

export default RegisterRedirect
