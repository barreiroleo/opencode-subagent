import type { Context, KeymapLayer } from "@opencode/plugin/tui/context"
import { parseModel } from "../model.js"
import { showResult } from "./toast.js"
import { Subagent } from "../rpc.js"

const HELP = `Usage:

  /subagent model                     Select model and effort via picker
  /subagent model <provider/model[#variant]>   Select directly
  /subagent clear                     Clear the selection`

export const commandLayer = (context: Context, pickModel: () => Promise<void>): KeymapLayer => ({
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
        const [first = "", second = ""] = (input ?? "").trim().split(/\s+/)

        if (first === "model" && !second) {
          await pickModel()
          return
        }

        if (first === "model") {
          const ref = parseModel(second)
          if (!ref) {
            context.ui.dialog.alert({ title: "Subagent", message: HELP })
            return
          }
          const result = (await context.client.rpc(Subagent).model(ref)) as { ok: boolean; text: string }
          showResult(context, result)
          return
        }

        if (first === "clear") {
          const result = (await context.client.rpc(Subagent).clear({})) as { ok: boolean; text: string }
          showResult(context, result)
          return
        }

        context.ui.dialog.alert({ title: "Subagent", message: HELP })
      },
    },
  ],
})
