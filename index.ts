import { Plugin, type Model } from "@opencode-ai/plugin"
import { Subagent } from "./rpc"

const TARGET_AGENTS = ["implement", "implement-simple", "general"]

type SelectedModel = { providerID: string; id: string; variant?: string }

export default Plugin.define({
  id: "subagent",
  async setup(ctx) {
    let selectedModel = (await ctx.storage.get("model")) as SelectedModel | undefined
    await ctx.storage.remove("agent")

    await ctx.agent.transform((editor) => {
      if (!selectedModel) return
      const model = selectedModel
      for (const id of TARGET_AGENTS) {
        if (!editor.get(id)) continue
        editor.update(id, (agent) => {
          agent.model = {
            providerID: model.providerID,
            id: model.id,
            variant: model.variant,
          } as Model.Ref
        })
      }
    })

    // File-based agents (implement, implement-simple) are not exposed to
    // agent transforms, so the model is applied to the spawned session here.
    const controller = new AbortController()
    void (async () => {
      for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
        if (event.type !== "session.created") continue
        const d = event.data
        if (!d.parentID || !d.agent || !TARGET_AGENTS.includes(d.agent)) continue
        if (d.location?.directory && d.location.directory !== ctx.location.directory) continue
        // Read shared storage so stale instances never apply an old selection.
        const current = ((await ctx.storage.get("model")) as SelectedModel | undefined) ?? undefined
        if (!current?.providerID || !current.id) continue
        try {
          await ctx.session.switchModel({
            sessionID: d.sessionID,
            model: { providerID: current.providerID, id: current.id, variant: current.variant } as Model.Ref,
          })
        } catch {}
      }
    })().catch(() => {})

    const registration = await ctx.rpc.register(Subagent, {
      async model(input) {
        const selection = input as { providerID: string; id: string; variant?: string }
        const suffix = selection.variant ? `#${selection.variant}` : ""

        const { data: models } = await ctx.catalog.model.list()
        const found = models.find(
          (m) => m.providerID === selection.providerID && (m.modelID === selection.id || m.id === selection.id),
        )
        if (!found || (selection.variant && !found.variants.some((v) => v.id === selection.variant))) {
          return { ok: false, text: `Model ${selection.providerID}/${selection.id}${suffix} not found in the catalog.` }
        }

        selectedModel = {
          providerID: selection.providerID,
          id: selection.id,
          variant: selection.variant || undefined,
        }
        await ctx.storage.set("model", selectedModel)
        await ctx.agent.reload()
        await registration.events.emit("changed", { model: selectedModel })

        return { ok: true, text: `Subagent model: ${selection.providerID}/${selection.id}${suffix}` }
      },
      async get(input) {
        const current = ((await ctx.storage.get("model")) as SelectedModel | undefined) ?? undefined
        return { model: current }
      },
    })

    return () => controller.abort()
  },
})
