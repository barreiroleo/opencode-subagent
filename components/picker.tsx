import type { ModelInfo } from "@opencode/client"
import type { Context } from "@opencode/plugin/tui/context"
import { type SelectedModel } from "../model"
import { showResult } from "./toast"
import { Subagent } from "../rpc"

export const pickModel = async (context: Context) => {
  const location = context.location ?? context.data.location.default()
  await context.data.location.model.sync(location)
  const models = (context.data.location.model.list(location) ?? [])
    .slice()
    .sort((a, b) => a.providerID.localeCompare(b.providerID) || a.id.localeCompare(b.id))

  if (models.length === 0) {
    context.ui.toast.show({ message: "No models in the catalog", variant: "error" })
    return
  }

  const model = await context.ui.dialog.select<ModelInfo>({
    title: "Subagent model",
    placeholder: "Filter models…",
    options: models.map((m) => ({
      title: m.id,
      value: m,
      description: m.name !== m.id ? m.name : undefined,
      category: m.providerID,
    })),
  })
  if (!model) return

  // Empty string means "Default (no variant)": variant ids are never
  // empty, so it stays distinguishable from a cancelled dialog. Models
  // without variants skip the dialog entirely.
  const variant = model.variants.length
    ? await context.ui.dialog.select<string>({
        title: `Effort — ${model.id}`,
        placeholder: "Filter efforts…",
        options: [
          { title: "Default (no variant)", value: "" },
          ...model.variants.map((v) => ({ title: v.id, value: v.id })),
        ],
      })
    : ""
  if (variant === undefined) return

  const selection: SelectedModel = {
    providerID: model.providerID,
    id: model.id,
    variant: variant || undefined,
  }
  const result = (await context.client.rpc(Subagent).model(selection)) as { ok: boolean; text: string }
  showResult(context, result)
}
