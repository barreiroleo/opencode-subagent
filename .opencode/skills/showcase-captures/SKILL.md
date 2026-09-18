---
name: Showcase captures
description: Reproduce the OpenCode TUI showcase flow and capture model selection, variants, and subagent execution
---

# Showcase captures

Keep the model-selection and execution captures in `screenshots/` and update the README links when the showcase changes.

## Setup

Use a dedicated tmux session and terminal window so the capture does not include the working terminal:

```sh
SESSION=subagent-showcase
ROOT="$(git rev-parse --show-toplevel)"

mkdir -p /tmp/opencode screenshots
tmux kill-session -t "$SESSION" 2>/dev/null || true
tmux new-session -d -s "$SESSION" "cd '$ROOT' && opencode --standalone ."
ghostty --theme=CustomDark --font-size=14 --window-width=120 --window-height=40 \
  -e tmux attach-session -t "$SESSION"
```

Focus the new terminal and make it fullscreen. With niri, use:

```sh
niri msg action fullscreen-window
```

## Captures

On Wayland, use `grim` for the screen capture:

```sh
grim /tmp/opencode/capture.png
```

Fullscreen captures may include the OpenCode tab row at the top and the tmux status bar at the bottom.
Remove those local-environment artifacts when cropping the images into `screenshots/` during the final recipe step.
For a 1920×1080 capture, crop to `1920x1009+0+24`.

The parent-session capture must show the main model in the composer and the selected subagent model in the footer.
The child-session capture must visibly identify the model used.

Avoid capturing user-specific session titles, desktop panels, or tmux status bars.

## Recipe

1. **Clear stale selection.** Send `/subagent clear` and wait for the confirmation to disappear.

   ```sh
   tmux send-keys -t "$SESSION" '/subagent clear' Enter
   ```

2. **Open and filter the model picker.** Send `/subagent model`, filter for `glm-5.3-flash`, and capture the filtered
   model picker before selecting the model.

   ```sh
   tmux send-keys -t "$SESSION" '/subagent model' Enter
   tmux send-keys -t "$SESSION" 'glm-5.3-flash'
   grim /tmp/opencode/model-picker.png
   ```

3. **Select and apply the first variant.** Submit the filtered model with `Enter`, press `Down` once to select the
   first variant after the default/no-variant entry, capture the highlighted variant, and submit it with `Enter`.

   ```sh
   tmux send-keys -t "$SESSION" Enter
   tmux send-keys -t "$SESSION" Down
   grim /tmp/opencode/variant-picker.png
   tmux send-keys -t "$SESSION" Enter
   ```

   Wait for the confirmation to disappear, then capture the selected model and effort in the prompt footer:

   ```sh
   grim /tmp/opencode/selected-model.png
   ```

4. **Spawn the subagent.** Send the exact prompt and wait until the subagent has finished and the parent response is
   visible. Capture the parent session.

   ```sh
   tmux send-keys -t "$SESSION" 'Spawn a subagent and say hi' Enter
   grim /tmp/opencode/subagent-spawn.png
   ```

5. **Enter the completed subagent.** Wait until the subagent has finished; it is now inactive. Open the child
   picker with `Down`, show inactive children with `C-a`, select the completed child with `Enter`, and capture its
   response.

   ```sh
   tmux send-keys -t "$SESSION" Down
   tmux send-keys -t "$SESSION" C-a
   tmux send-keys -t "$SESSION" Enter
   grim /tmp/opencode/subagent-child.png
   ```

6. **Crop, validate, and clean up.** Crop the captures into `screenshots/`, update README links if needed, validate the
   results, then clear the selection and close the dedicated session:

   ```sh
   for name in model-picker variant-picker selected-model subagent-spawn subagent-child; do
     magick "/tmp/opencode/$name.png" -crop 1920x1009+0+24 +repage "screenshots/$name.png"
   done
   identify screenshots/*.png
   git diff --check
   tmux send-keys -t "$SESSION" Escape
   tmux send-keys -t "$SESSION" '/subagent clear' Enter
   tmux kill-session -t "$SESSION"
   ```
