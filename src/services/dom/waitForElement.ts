export function waitForElement<T extends Element>(
    selector: string,
    callback: (el: T) => void
) {
    const el = document.querySelector(selector);
    if (el) {
        callback(el as T);
    } else {
        requestAnimationFrame(() => waitForElement(selector, callback));
    }
}
