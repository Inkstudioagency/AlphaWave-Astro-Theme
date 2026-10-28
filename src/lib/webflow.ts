/**
 * Helpers for the Webflow runtime (public/js/webflow.js).
 *
 * The template's animations are Webflow Interactions (IX3) bundled inside webflow.js.
 * Component interactions (e.g. button hover) find their elements through the
 * `data-wf-target` attribute, so reusable components must keep emitting it.
 */

/** Builds a `data-wf-target` value: [[[componentId, elementId], instancePath]] */
export function wfTarget(componentId: string, elementId: string, instance: string[]): string {
  return JSON.stringify([[[componentId, elementId], instance]]);
}

/** Webflow component ids used by the shared button components */
export const WF_COMPONENTS = {
  primaryButton: {
    id: 'f8b8f88f-4d53-daea-faff-1d6d7cdf2822',
    text: 'f8b8f88f-4d53-daea-faff-1d6d7cdf2823',
    hoverText: '724b01a3-01f9-0de8-3efa-7d72b03f227b',
    onDarkVariant: '1cfab160-387a-7e99-960e-e0d143162727',
  },
  secondaryButton: {
    id: '65105b8a-2f9b-fbd3-2cad-04e9e245ea17',
    text: '65105b8a-2f9b-fbd3-2cad-04e9e245ea18',
    hoverText: '1ee9257c-71a1-65ab-e86e-c882047635d9',
  },
  linkButton: {
    id: '5dd1def1-57e4-5b34-a200-33e9eed0a4d0',
    text: '5dd1def1-57e4-5b34-a200-33e9eed0a4d1',
    hoverText: '70724bda-b80d-b8a0-0208-ff82d3cb7298',
    icon: '5dd1def1-57e4-5b34-a200-33e9eed0a4d2',
  },
} as const;

/** Normalises a path for comparisons ("/blogs/" -> "/blogs") */
export function normalizePath(path: string): string {
  const clean = path.split(/[?#]/)[0];
  return clean.length > 1 ? clean.replace(/\/+$/, '') : clean;
}

/**
 * Webflow marks every link that points to the current page with
 * `aria-current="page"` and the `w--current` class. This reproduces it.
 */
export function currentLinkProps(href: string, pathname: string, className: string) {
  const isCurrent = normalizePath(href) === normalizePath(pathname);
  return {
    'aria-current': isCurrent ? ('page' as const) : undefined,
    class: isCurrent ? `${className} w--current` : className,
  };
}
