export type ContentSignalPolicy = {
  aiTrain: 'yes' | 'no'
  search: 'yes' | 'no'
  aiInput: 'yes' | 'no'
}

export function renderContentSignal(p: ContentSignalPolicy): string {
  return `Content-Signal: ai-train=${p.aiTrain}, search=${p.search}, ai-input=${p.aiInput}`
}
