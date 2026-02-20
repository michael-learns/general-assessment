import { d as defineEventHandler, r as readBody, c as createError, s as setResponseHeader, a as sendStream, u as useRuntimeConfig, b as callCodealive } from '../../nitro/nitro.mjs';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
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

const TOPIC_MAP = [
  {
    name: "Company Overview",
    requiredQuestions: [
      "How many employees does your company have?",
      "What industry or sector are you in?",
      "Do you operate under multiple legal entities or companies?",
      "Which countries or regions do you operate in?"
    ],
    codealiveSearchHints: ["multi-entity", "multi-country", "company setup"]
  },
  {
    name: "Pay Structure",
    requiredQuestions: [
      "What pay frequencies do you use (weekly, bi-weekly, monthly, or mixed)?",
      "Do you have a mix of salaried, hourly, commission-based, or contractor employees?",
      "How do you handle overtime \u2014 fixed multiplier or custom rules?",
      "Do any employees have multiple pay rates or split pay?",
      "Are there shift differentials or special pay premiums?"
    ],
    codealiveSearchHints: ["pay frequency", "overtime", "salary", "hourly", "commission", "split pay", "shift differential"]
  },
  {
    name: "Leave & Benefits",
    requiredQuestions: [
      "What leave types do you offer (annual, sick, maternity/paternity, unpaid)?",
      "How does leave accrual work \u2014 is it time-based, tenure-based, or policy-based?",
      "What benefits deductions do you manage through payroll (medical, pension, insurance)?",
      "Do you provide allowances such as travel, housing, or meal allowances?"
    ],
    codealiveSearchHints: ["leave management", "leave accrual", "benefits deduction", "allowances"]
  },
  {
    name: "Compliance & Tax",
    requiredQuestions: [
      "What are your primary tax filing requirements?",
      "Which statutory contributions apply to your employees (e.g. SSS, PhilHealth, HDMF, CPF, EPF)?",
      "Are there any government-mandated benefits or contributions unique to your region?",
      "Are any of your employees covered by union agreements or collective bargaining agreements?"
    ],
    codealiveSearchHints: ["tax filing", "statutory contributions", "SSS", "PhilHealth", "HDMF", "CPF", "EPF", "union", "CBA"]
  },
  {
    name: "Edge Cases & Special Policies",
    requiredQuestions: [
      "How do you handle mid-period hires or terminations?",
      "What are your final pay computation rules?",
      "Do you ever need retroactive pay adjustments?",
      "Do you run off-cycle payroll for any reason?",
      "Do you pay employees in multiple currencies?"
    ],
    codealiveSearchHints: ["proration", "final pay", "retroactive pay", "off-cycle", "multi-currency"]
  },
  {
    name: "Summary",
    requiredQuestions: [],
    codealiveSearchHints: []
  }
];

function buildSystemPrompt(companyName, industry) {
  const topicMapStr = TOPIC_MAP.filter((s) => s.name !== "Summary").map((section) => formatSection(section)).join("\n\n");
  return `You are a professional payroll consultant conducting a fit assessment for ${companyName}, a company in the ${industry} industry.

Your goal is to determine whether our payroll system can meet their HR and payroll needs by conducting a structured but natural conversation.

## Your Behavior

1. **Be conversational and professional.** Ask one question at a time. Acknowledge the customer's answers before asking the next question.

2. **Follow the topic map below.** Cover all required questions in each section before moving on. You may ask follow-up questions based on what you learn.

3. **Use your tools to check features.** When the customer mentions a specific policy or feature, use the \`codealive_search\` tool to check if our system supports it. Use this information to ask smarter follow-up questions. Do NOT mention the tool to the customer \u2014 weave findings naturally into the conversation.

4. **Mark section transitions clearly.** When you move to a new section, briefly acknowledge you're shifting topics.

5. **Probe deeper when needed.** If a customer's answer reveals a complex or unusual policy, ask follow-up questions to fully understand it before moving on.

6. **Do not rush.** It's better to fully understand a requirement than to move on too quickly.

## Topic Map

${topicMapStr}

## Final Summary

When all sections are complete, generate a structured assessment in the following JSON format (wrapped in \`\`\`assessment\`\`\` code block):

\`\`\`assessment
{
  "sections": [
    {
      "name": "Section Name",
      "status": "supported|partial|gap",
      "findings": "What you found about their requirements and system support",
      "customerRequirements": ["requirement 1", "requirement 2"]
    }
  ],
  "overallFitScore": 85,
  "summary": "2-3 paragraph executive summary",
  "recommendations": "What the Implementation Team needs to know and plan for"
}
\`\`\`

Status definitions:
- **supported**: The system fully supports this requirement out of the box
- **partial**: The system partially supports it \u2014 some configuration or minor customization needed
- **gap**: The system does not currently support this \u2014 requires custom development or is a blocker

Start the conversation by warmly introducing yourself and asking for the customer's first name.`;
}
function formatSection(section) {
  return `### ${section.name}
Required questions (cover all of these):
${section.requiredQuestions.map((q) => `- ${q}`).join("\n")}
Codealive search hints: ${section.codealiveSearchHints.join(", ")}`;
}

const CODEALIVE_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "codealive_search",
        description: "Search the payroll system codebase to check if a specific feature, policy type, or functionality is supported.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: {
              type: SchemaType.STRING,
              description: 'The feature or policy to search for, e.g. "split pay rates", "overtime calculation", "leave accrual"'
            }
          },
          required: ["query"]
        }
      },
      {
        name: "codealive_consultant",
        description: "Get an in-depth analysis of whether a complex HR/payroll policy is supported by the payroll system.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            question: {
              type: SchemaType.STRING,
              description: 'The specific question about system capability, e.g. "Does the system support retroactive pay adjustments for salary changes mid-pay-period?"'
            }
          },
          required: ["question"]
        }
      }
    ]
  }
];
const chat_post = defineEventHandler(async (event) => {
  var _a;
  const config = useRuntimeConfig();
  const body = await readBody(event);
  if (!body.sessionId || !((_a = body.userMessage) == null ? void 0 : _a.trim())) {
    throw createError({ statusCode: 400, message: "sessionId and userMessage are required" });
  }
  const isDevSession = body.sessionId.startsWith("dev_");
  const convex = config.public.convexUrl && !isDevSession ? new ConvexHttpClient(config.public.convexUrl) : null;
  if (convex) {
    try {
      await convex.mutation(api.messages.add, {
        sessionId: body.sessionId,
        role: "user",
        content: body.userMessage
      });
    } catch (err) {
      console.error("[chat.post] Failed to save user message:", err);
    }
  }
  setResponseHeader(event, "Content-Type", "text/event-stream");
  setResponseHeader(event, "Cache-Control", "no-cache");
  setResponseHeader(event, "Connection", "keep-alive");
  setResponseHeader(event, "X-Accel-Buffering", "no");
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const model = genAI.getGenerativeModel({
    model: config.geminiModel || "gemini-2.5-flash-preview-04-17",
    systemInstruction: buildSystemPrompt(body.companyName || "the customer", body.industry || "their industry"),
    tools: CODEALIVE_TOOLS
  });
  const history = (body.messages || []).map((m) => ({
    role: m.role,
    parts: [{ text: m.content }]
  }));
  const chat = model.startChat({ history });
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const codealiveQueries = [];
      let fullResponse = "";
      function send(data) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}

`));
      }
      async function processStream(streamResult) {
        const pendingCalls = [];
        for await (const chunk of (await streamResult).stream) {
          const calls = chunk.functionCalls();
          if (calls && calls.length > 0) {
            for (const call of calls) {
              pendingCalls.push({ name: call.name, args: call.args });
            }
          }
          const text = chunk.text();
          if (text) {
            fullResponse += text;
            send({ type: "text", content: text });
          }
        }
        if (pendingCalls.length > 0) {
          const functionResponses = [];
          for (const call of pendingCalls) {
            const query = call.args.query || call.args.question || "";
            codealiveQueries.push(`${call.name}: ${query}`);
            send({ type: "tool_call", tool: call.name, query });
            const caTool = call.name === "codealive_search" ? "codebase_search" : "codebase_consultant";
            const toolResult = await callCodealive(config.codeAliveApiKey, caTool, call.args);
            functionResponses.push({
              functionResponse: { name: call.name, response: { result: toolResult } }
            });
          }
          await processStream(chat.sendMessageStream(functionResponses));
        }
      }
      try {
        await processStream(chat.sendMessageStream(body.userMessage));
        if (convex && fullResponse) {
          try {
            await convex.mutation(api.messages.add, {
              sessionId: body.sessionId,
              role: "assistant",
              content: fullResponse,
              codealiveQueries: codealiveQueries.length > 0 ? codealiveQueries : void 0
            });
          } catch (err) {
            console.error("[chat.post] Failed to save assistant message:", err);
          }
        }
        send({ type: "done", codealiveQueries });
      } catch (err) {
        console.error("[chat.post] Stream error:", err);
        send({ type: "error", message: "AI service unavailable. Please try again." });
      } finally {
        controller.close();
      }
    }
  });
  return sendStream(event, stream);
});

export { chat_post as default };
//# sourceMappingURL=chat.post.mjs.map
