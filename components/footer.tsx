/// <reference path="../jsx-env.d.ts" />
import type { Context } from "@opencode/plugin/tui/context"
import { Show } from "solid-js"
import type { Store } from "solid-js/store"
import { label, type SelectedModel } from "../model"
import { Subagent } from "../rpc"

type State = { model?: SelectedModel }

// Server storage is the source of truth; this ephemeral mirror is seeded
// once via get and live-updated by the changed event.
export const selectedModelState = (context: Context) => {
  const [state, setState] = context.storage.memory<State>("selected-model", {
    initial: { model: undefined },
  })
  void context.client.rpc(Subagent).get({}).then((out) => {
    setState((d) => { d.model = (out as { model?: SelectedModel }).model })
  })
  const off = context.client.rpc(Subagent).events.on("changed", (e) =>
    setState((d) => { d.model = e.data.model as SelectedModel | undefined }),
  )
  return { state, off }
}

export const Footer = (props: { context: Context; state: Store<State> }) => (
  <Show when={props.state.model}>
    {(m) => <text fg={props.context.theme.text.subdued}>subagent: {label(m())}</text>}
  </Show>
)
