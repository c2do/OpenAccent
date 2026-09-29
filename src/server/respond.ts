import type { z } from 'zod';
import { profileFooter } from '../core/briefing.js';
import type { ServerContext } from './context.js';

type ToolResult = {
  content: { type: 'text'; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

/**
 * A successful tool result: markdown text plus structured data, with the profile footer appended.
 * The data is checked against the tool's output schema, so a tool can't return fields it doesn't declare.
 */
export function ok<S extends z.ZodType<Record<string, unknown>>>(ctx: ServerContext, text: string, schema: S, data: z.input<S>): ToolResult {
  const structured = schema.parse(data);
  const memory = ctx.memory.read();
  const warnings = ctx.memory.warnings.length ? `\n\n⚠ ${ctx.memory.warnings.join('\n⚠ ')}` : '';
  return {
    content: [{ type: 'text', text: `${text}${warnings}\n\n${profileFooter(memory)}` }],
    structuredContent: structured,
  };
}

/** An error the model can act on. */
export function fail(message: string): ToolResult {
  return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
}

/** Runs a handler and turns thrown errors into actionable tool errors. */
export async function guard(fn: () => ToolResult | Promise<ToolResult>): Promise<ToolResult> {
  try {
    return await fn();
  } catch (err) {
    return fail((err as Error).message);
  }
}

/** The dialect to use: the one asked for, else the user's profile dialect (the "dialect lock"). */
export function resolveDialect(ctx: ServerContext, requested: string | undefined): string | undefined {
  return requested ?? ctx.memory.read().profile.dialect;
}
