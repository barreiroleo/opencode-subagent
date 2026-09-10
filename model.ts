export type SelectedModel = { providerID: string; id: string; variant?: string }

export const label = (m: SelectedModel) => `${m.providerID}/${m.id}${m.variant ? `#${m.variant}` : ""}`

export const parseModel = (raw: string): SelectedModel | undefined => {
  const [ref, variant = ""] = raw.split("#")
  const [providerID = "", id = ""] = ref.split("/")
  return providerID && id ? { providerID, id, variant: variant || undefined } : undefined
}
