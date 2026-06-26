/**
 * This patch prevents React from crashing when Google Translate is used on the page.
 * Google Translate wraps text nodes in <font> tags, which causes React's Virtual DOM 
 * to lose track of the actual DOM nodes. When React tries to update or unmount those nodes,
 * it throws a "NotFoundError: Failed to execute 'removeChild' on 'Node'" or similar errors.
 * 
 * This monkey-patches the native DOM methods to swallow those specific errors instead of crashing the app.
 */
export function patchGoogleTranslateCrash() {
  if (typeof Node === 'function' && Node.prototype) {
    const originalRemoveChild = Node.prototype.removeChild
    Node.prototype.removeChild = function <T extends Node>(child: T): T {
      if (child.parentNode !== this) {
        if (console) {
          console.warn('Prevented React crash from Google Translate (removeChild on different parent)')
        }
        return child
      }
      return originalRemoveChild.apply(this, arguments as any) as T
    }

    const originalInsertBefore = Node.prototype.insertBefore
    Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
      if (referenceNode && referenceNode.parentNode !== this) {
        if (console) {
          console.warn('Prevented React crash from Google Translate (insertBefore on different parent)')
        }
        return newNode
      }
      return originalInsertBefore.apply(this, arguments as any) as T
    }
  }
}
