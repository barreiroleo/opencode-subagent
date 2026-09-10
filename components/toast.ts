import type { Context } from "@opencode-ai/plugin/tui/context"

export const showResult = (context: Context, result: { ok: boolean; text: string }) =>
  context.ui.toast.show({ message: result.text, variant: result.ok ? "success" : "error" })
