import { Rpc } from "@opencode-ai/plugin/rpc"

export const Subagent = Rpc.define({
  id: "subagent",
  methods: {
    model: {
      input: { type: "object", properties: { providerID: { type: "string" }, id: { type: "string" }, variant: { type: "string" } }, required: ["providerID", "id"], additionalProperties: false },
      output: { type: "object", properties: { ok: { type: "boolean" }, text: { type: "string" } }, required: ["ok", "text"], additionalProperties: false },
    },
  },
  events: {},
})
