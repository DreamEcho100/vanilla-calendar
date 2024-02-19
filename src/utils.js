/**
 * @template {HTMLElement | Element} Elem
 * @param {Elem | null | undefined} element
 * @param {string} message
 * @returns {Elem}
 * @throws {Error}
 */
export function isElementOrThrow(element, message) {
  if (!(element instanceof HTMLElement)) {
    throw new Error(message);
  }

  return element;
}
