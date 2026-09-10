import type { ModelInfo } from "@opencode-ai/client"
import type { Context } from "@opencode-ai/plugin/tui/context"
import { showResult, type SelectedModel } from "../model"
import { Subagent } from "../rpc"

export const pickModel = async (context: Context) => {
  const location = context.location ?? context.data.location.default()
  await context.data.location.model.sync(location)
  const models = (context.data.location.model.list(location) ?? [])
    .slice()
    .sort((a, b) => a.providerID.localeCompare(b.providerID) || a.modelID.localeCompare(b.modelID))

  if (models.length === 0) {
    context.ui.toast.show({ message: "No models in the catalog", variant: "error" })
    return
  }

  const model = await context.ui.dialog.select<ModelInfo>({
    title: "Subagent model",
    placeholder: "Filter models…",
    options: models.map((m) => ({
      title: m.modelID,
      value: m,
      description: m.name !== m.modelID ? m.name : undefined,
      category: m.providerID,
    })),
  })
  if (!model) return

  // Empty string means "Default (no variant)": variant ids are never
  // empty, so it stays distinguishable from a cancelled dialog. Models
  // without variants skip the dialog entirely.
  const variant = model.variants.length
    ? await context.ui.dialog.select<string>({
        title: `Effort — ${model.modelID}`,
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
    id: model.modelID,
    variant: variant || undefined,
  }
  const result = (await context.client.rpc(Subagent).model(selection)) as { ok: boolean; text: string }
  showResult(context, result)
}
