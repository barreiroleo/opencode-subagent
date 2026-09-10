// The host provides OpenTUI's JSX namespace at runtime; mirror it globally so
// `--jsx preserve` typechecks plugin JSX against the real element types.
declare namespace JSX {
  type Element = import("@opentui/solid/jsx-runtime").JSX.Element
  type IntrinsicElements = import("@opentui/solid/jsx-runtime").JSX.IntrinsicElements
  interface ElementChildrenAttribute {
    children: {}
  }
}
