import { d as defineEventHandler, r as readBody, c as createError, u as useRuntimeConfig } from '../../nitro/nitro.mjs';
import { ConvexHttpClient } from 'convex/browser';
import { a as api } from '../../_/api.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '@iconify/utils';
import 'consola';

const sessions_post = defineEventHandler(async (event) => {
  var _a, _b, _c;
  const config = useRuntimeConfig();
  const body = await readBody(event);
  if (!((_a = body.companyName) == null ? void 0 : _a.trim()) || !((_b = body.industry) == null ? void 0 : _b.trim())) {
    throw createError({ statusCode: 400, message: "companyName and industry are required" });
  }
  if (!config.public.convexUrl) {
    const mockId = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    return { sessionId: mockId };
  }
  const convex = new ConvexHttpClient(config.public.convexUrl);
  try {
    const sessionId = await convex.mutation(api.sessions.create, {
      companyName: body.companyName.trim(),
      industry: body.industry.trim(),
      email: (_c = body.email) == null ? void 0 : _c.trim()
    });
    return { sessionId };
  } catch (error) {
    console.error("[sessions.post] Convex mutation failed:", error);
    throw createError({ statusCode: 500, message: "Failed to create session" });
  }
});

export { sessions_post as default };
//# sourceMappingURL=sessions.post.mjs.map
