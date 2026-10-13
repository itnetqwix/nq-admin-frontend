import dynamic from 'next/dynamic'

/**
 * Which component renders each `?drawer=<type>:<id>`. Components load lazily so the drawers a
 * page never opens cost nothing. Each receives `{ id }`.
 */
export const ENTITY_DRAWERS = {
  user: { title: 'User', Component: dynamic(() => import('./drawers/UserDrawer'), { ssr: false }) },
  lesson: { title: 'Lesson', Component: dynamic(() => import('./drawers/LessonDrawer'), { ssr: false }) },
  dispute: { title: 'Dispute', Component: dynamic(() => import('./drawers/DisputeDrawer'), { ssr: false }) },
  job: { title: 'Failed job', Component: dynamic(() => import('./drawers/JobDrawer'), { ssr: false }) },
  payment: { title: 'Payment', Component: dynamic(() => import('./drawers/PaymentDrawer'), { ssr: false }) }
}

export const isKnownDrawerType = type => Object.prototype.hasOwnProperty.call(ENTITY_DRAWERS, type)
