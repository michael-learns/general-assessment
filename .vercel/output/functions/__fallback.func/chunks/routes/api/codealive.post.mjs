import { d as defineEventHandler, r as readBody, c as createError, b as callCodealive, u as useRuntimeConfig } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '@iconify/utils';
import 'consola';

const codealive_post = defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);
  if (!body.tool || !body.params) {
    throw createError({ statusCode: 400, message: "Missing tool or params" });
  }
  const allowedTools = ["codebase_search", "codebase_consultant"];
  if (!allowedTools.includes(body.tool)) {
    throw createError({ statusCode: 400, message: "Invalid tool name" });
  }
  const result = await callCodealive(config.codeAliveApiKey, body.tool, body.params);
  if (result === "Feature lookup unavailable") {
    throw createError({ statusCode: 502, message: "Codealive API unavailable" });
  }
  return result;
});

export { codealive_post as default };
//# sourceMappingURL=codealive.post.mjs.map
