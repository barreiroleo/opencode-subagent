import { Plugin } from "@opencode/plugin"
import { applyModel, readModel, watchSessions } from "./agents"
import { label, type SelectedModel } from "./model"
import { Subagent } from "./rpc"

export default Plugin.define({
  id: "subagent",
  async setup(ctx) {
    let selectedModel = (await ctx.storage.get("model")) as SelectedModel | undefined
    await ctx.storage.remove("agent")

    await applyModel(ctx, () => selectedModel)

    const controller = new AbortController()
    void watchSessions(ctx, controller.signal).catch(() => {})

    const registration = await ctx.rpc.register(Subagent, {
      async model(input) {
        const selection = input as { providerID: string; id: string; variant?: string }

        const { data: models } = await ctx.model.list()
        const found = models.find(
          (m) => m.providerID === selection.providerID && m.id === selection.id,
        )
        if (!found || (selection.variant && !found.variants.some((v) => v.id === selection.variant))) {
          return { ok: false, text: `Model ${label(selection)} not found in the catalog.` }
        }

        selectedModel = selection.variant ? selection : { providerID: selection.providerID, id: selection.id }
        await ctx.storage.set("model", selectedModel)
        await ctx.agent.reload()
        await registration.events.emit("changed", { model: selectedModel })

        return { ok: true, text: `Subagent model: ${label(selection)}` }
      },
      async get() {
        const model = await readModel(ctx)
        return model ? { model } : {}
      },
      async clear() {
        selectedModel = undefined
        await ctx.storage.remove("model")
        await ctx.agent.reload()
        await registration.events.emit("changed", {})
        return { ok: true, text: "Subagent model cleared (agents use their configured model)." }
      },
    })

    return () => controller.abort()
  },
})
