/// <reference path="./jsx-env.d.ts" />
/** @jsxImportSource @opentui/solid */
import { Plugin } from "@opencode/plugin/tui"
import { commandLayer } from "./components/commands.jsx"
import { Footer, selectedModelState } from "./components/footer.jsx"
import { pickModel } from "./components/picker.jsx"

export default Plugin.define({
  id: "subagent.tui",
  setup(context) {
    const { state, off } = selectedModelState(context)
    const pick = () => pickModel(context)

    // The keymap layer must be owned by a rendered component; setup() runs
    // outside the host's keymap provider.
    context.ui.slot({
      append: "app",
      render: () => {
        context.keymap.layer(() => commandLayer(context, pick))
        return <box />
      },
    })

    context.ui.slot({
      append: "prompt.footer",
      render: () => <Footer context={context} state={state} />,
    })

    return () => off()
  },
})
