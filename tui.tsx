import type { ModelInfo } from "@opencode-ai/client"
import { Plugin } from "@opencode-ai/plugin/tui"

const HELP = `Usage:

  /subagent model    Select model and effort for subagent spawns
  /subagent agent    Select the subagent type (not implemented yet)`

export default Plugin.define({
  id: "subagent.tui",
  setup(context) {
    const pickModel = async () => {
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

      if (model.variants.length === 0) {
        context.ui.toast.show({ message: `Subagent model: ${model.providerID}/${model.modelID}`, variant: "success" })
        return
      }

      // Empty string means "Default (no variant)": variant ids are never
      // empty, so it stays distinguishable from a cancelled dialog.
      const variant = await context.ui.dialog.select<string>({
        title: `Effort — ${model.modelID}`,
        placeholder: "Filter efforts…",
        options: [
          { title: "Default (no variant)", value: "" },
          ...model.variants.map((v) => ({ title: v.id, value: v.id })),
        ],
      })
      if (variant === undefined) return

      context.ui.toast.show({
        message: `Subagent model: ${model.providerID}/${model.modelID}${variant ? `#${variant}` : ""}`,
        variant: "success",
      })
    }

    const layer = () => ({
      mode: "global" as const,
      priority: 10,
      commands: [
        {
          id: "subagent.select",
          title: "Select subagent model",
          group: "Subagent",
          palette: true,
          slash: { name: "subagent", arguments: true },
          run: async (input?: string) => {
            const [first = ""] = (input ?? "").trim().split(/\s+/)

            if (first === "model") {
              await pickModel()
              return
            }

            context.ui.dialog.alert({ title: "Subagent", message: HELP })
          },
        },
      ],
    })

    // The keymap layer must be owned by a rendered component; setup() runs
    // outside the host's keymap provider.
    context.ui.slot({
      append: "app",
      render: () => {
        context.keymap.layer(layer)
        return <box />
      },
    })
  },
})
