import { formatInt, timeAgo } from 'src/utils/format'

/** What part of the product an error touches, in words an admin uses (matches backend classifyImpact). */
export const IMPACT_LABELS = {
  payment: 'Payments',
  auth: 'Sign-in',
  call: 'Live calls',
  booking: 'Booking',
  media: 'Video & uploads',
  other: 'Other'
}

const plural = (n, one, many) => `${formatInt(n)} ${n === 1 ? one : many}`

/**
 * Turn a Sentry issue (as normalised by the backend) into something an admin can act on:
 * a headline, one line of impact, and a severity tone. Severity follows how many people it hits,
 * not Sentry's level, because that is what an admin triages by.
 */
export function describeIssue(issue, now = Date.now()) {
  const users = Number(issue?.userCount) || 0
  const events = Number(issue?.count) || 0
  const tone = issue?.level === 'fatal' || users >= 10 ? 'danger' : users >= 1 ? 'warning' : 'neutral'

  const state = issue?.substatus === 'regressed' ? 'Regressed' : issue?.substatus === 'new' ? 'New' : null
  const parts = []
  parts.push(users > 0 ? `${plural(users, 'user', 'users')} affected` : 'No users identified')
  parts.push(plural(events, 'event', 'events'))
  if (issue?.firstSeen) parts.push(`first seen ${timeAgo(issue.firstSeen, now)}`)

  return {
    headline: issue?.title || 'Untitled error',
    detail: parts.join(' · '),
    state,
    impact: issue?.impact || 'other',
    impactLabel: IMPACT_LABELS[issue?.impact] || IMPACT_LABELS.other,
    project: issue?.project || null,
    tone,
    permalink: issue?.permalink || null
  }
}

/** Highest-impact first: people affected, then volume. */
export function rankIssues(issues = []) {
  return [...issues].sort(
    (a, b) => (Number(b.userCount) || 0) - (Number(a.userCount) || 0) || (Number(b.count) || 0) - (Number(a.count) || 0)
  )
}
