/**
 * Pure, framework-free logic for the ExitIntentModal + dismissible CTAs.
 *
 * Splitting this out keeps the "use client" component thin AND makes the
 * a11y wiring + trigger rules unit-testable without a DOM/jsdom dependency.
 */

/** sessionStorage key — once set, the exit-intent modal won't re-arm this tab. */
export const EXIT_INTENT_SESSION_KEY = 'p51:exit-intent-shown'

/**
 * The accessibility props for the modal dialog container. role="dialog" +
 * aria-modal + aria-labelledby (pointing at the visible title) is the WAI-ARIA
 * modal pattern; the component adds focus-trap + Escape on top.
 */
export function dialogA11yProps(titleId: string): {
  role: 'dialog'
  'aria-modal': true
  'aria-labelledby': string
} {
  return { role: 'dialog', 'aria-modal': true, 'aria-labelledby': titleId }
}

/**
 * True when a mouseout indicates the pointer left the viewport through the TOP
 * edge (the classic "about to close the tab" exit gesture). `relatedTarget` is
 * null only when leaving the document entirely, which filters out in-page moves.
 */
export function isExitIntent(e: { clientY: number; relatedTarget: unknown }): boolean {
  return e.relatedTarget == null && e.clientY <= 0
}

/** Arm the trigger only when it hasn't already fired this session. */
export function shouldArm(sessionFlag: string | null): boolean {
  return sessionFlag == null
}
