/**
 * Inline reference to a symbol of the local sprite (public/icons.svg)
 */
export function icon(name) {
  return `<svg class="icon" aria-hidden="true"><use href="/icons.svg#${name}"></use></svg>`;
}
