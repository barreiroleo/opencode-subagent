# Subagent

Subagent is an OpenCode V2 plugin that lets you dynamically choose the model used by subagents with
the `/subagent` command.

## Usage

```
/subagent model                              Model and effort picker
/subagent model <provider/model[#variant]>   Direct selection
/subagent clear                              Clears the selection
```

When a selection is active, the prompt footer displays `subagent: provider/model#variant`.

## Showcase

Select a model from the catalog:

![Subagent model picker](screenshots/model-picker.png)

Choose the subagent effort:

![Subagent effort picker](screenshots/variant-picker.png)

The active model and effort are shown in the prompt footer:

![Selected subagent model](screenshots/selected-model.png)

The main session can use a different model from its subagent:

![Subagent running with a different model](screenshots/subagent-spawn.png)

Entering the subagent session shows the selected model in its response:

![Subagent session showing GLM-5.3-Flash](screenshots/subagent-child.png)

## How it works

The package defines two plugins over the same RPC contract:

- **TUI plugin**: runs in the client.
  Registers the `/subagent` command, selection dialogs, and the footer indicator.
- **Server plugin**: runs alongside the OpenCode server.
  Registers the RPC methods, persists the selection in `ctx.storage` (key `model`), and applies it to
  agents and sessions.

The server is the source of truth. The TUI maintains an ephemeral in-memory mirror
(`context.storage.memory`) that is seeded once with the `get` method and kept up to date by the
`changed` event.

```mermaid
sequenceDiagram
    actor U as User
    participant TUI as TUI plugin
    participant SRV as Server plugin
    participant ST as ctx.storage

    Note over TUI,SRV: TUI startup
    TUI->>SRV: rpc get()
    SRV-->>TUI: current selection

    U->>TUI: /subagent model
    TUI->>TUI: picker (model and effort)
    TUI->>SRV: rpc model(provider, id, variant)
    SRV->>SRV: validates against the catalog
    SRV->>ST: set("model", selection)
    SRV->>SRV: agent.reload() — applyModel
    SRV-->>TUI: changed event
    TUI->>TUI: footer updates the indicator

    Note over SRV: watchSessions applies switchModel to each new subagent session
```

## Development

```sh
bunx tsc --noEmit --strict --module nodenext --moduleResolution nodenext \
  --target esnext --jsx preserve --skipLibCheck index.ts tui.tsx
```

> References:
>
> - [RPC guide](https://opencode.ai/v2/docs/build/plugins/rpc)
> - [CLI plugin](https://opencode.ai/v2/docs/build/plugins/cli)
> - [Plugins](https://opencode.ai/v2/docs/build/plugins)
