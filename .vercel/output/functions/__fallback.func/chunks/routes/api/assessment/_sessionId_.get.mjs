import { d as defineEventHandler, g as getRouterParam, c as createError, u as useRuntimeConfig } from '../../../nitro/nitro.mjs';
import { ConvexHttpClient } from 'convex/browser';
import { a as api } from '../../../_/api.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '@iconify/utils';
import 'consola';

const _sessionId__get = defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const sessionId = getRouterParam(event, "sessionId");
  if (!config.public.convexUrl || sessionId.startsWith("dev_")) {
    return null;
  }
  const convex = new ConvexHttpClient(config.public.convexUrl);
  try {
    const [session, assessment] = await Promise.all([
      convex.query(api.sessions.get, { id: sessionId }),
      convex.query(api.assessments.getBySession, { sessionId })
    ]);
    return { session, assessment };
  } catch (err) {
    console.error("[assessment GET] Failed:", err);
    throw createError({ statusCode: 500, message: "Failed to fetch assessment" });
  }
});

export { _sessionId__get as default };
//# sourceMappingURL=_sessionId_.get.mjs.map
