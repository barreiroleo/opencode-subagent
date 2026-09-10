import type { Context } from "@opencode-ai/plugin/tui/context"

export type SelectedModel = { providerID: string; id: string; variant?: string }

export const label = (m: SelectedModel) => `${m.providerID}/${m.id}${m.variant ? `#${m.variant}` : ""}`

export const parseModel = (raw: string): SelectedModel | undefined => {
  const [ref, variant = ""] = raw.split("#")
  const [providerID = "", id = ""] = ref.split("/")
  return providerID && id ? { providerID, id, variant: variant || undefined } : undefined
}

export const showResult = (context: Context, result: { ok: boolean; text: string }) =>
  context.ui.toast.show({ message: result.text, variant: result.ok ? "success" : "error" })
