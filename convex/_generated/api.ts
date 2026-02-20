// TEMPORARY BOOTSTRAP STUB - will be overwritten by `bunx convex dev`
/* eslint-disable */
import type { ApiFromModules } from 'convex/server'
import type * as sessions from '../sessions'
import type * as messages from '../messages'
import type * as assessments from '../assessments'

type API = ApiFromModules<{
  sessions: typeof sessions
  messages: typeof messages
  assessments: typeof assessments
}>

export const api = {} as unknown as API
