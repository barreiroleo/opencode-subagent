import { type Model, type Plugin } from "@opencode/plugin"
import { type SelectedModel } from "./model"

type Context = Plugin.Context

const TARGET_AGENTS = ["implement", "implement-simple", "general"]

export const readModel = async (context: Context) =>
  ((await context.storage.get("model")) as SelectedModel | undefined) ?? undefined

// Re-runs on every agent reload; the closure reads the latest selection.
export const applyModel = (context: Context, selection: () => SelectedModel | undefined) =>
  context.agent.transform((editor) => {
    const model = selection()
    if (!model) return
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
export const watchSessions = async (context: Context, signal: AbortSignal) => {
  for await (const event of context.event.subscribe({ signal })) {
    if (event.type !== "session.created") continue
    const d = event.data
    if (!d.parentID || !d.agent || !TARGET_AGENTS.includes(d.agent)) continue
    if (d.location?.directory && d.location.directory !== context.location.directory) continue
    // Read shared storage so stale instances never apply an old selection.
    const current = await readModel(context)
    if (!current?.providerID || !current.id) continue
    try {
      await context.session.switchModel({
        sessionID: d.sessionID,
        model: { providerID: current.providerID, id: current.id, variant: current.variant } as Model.Ref,
      })
    } catch {}
  }
}
