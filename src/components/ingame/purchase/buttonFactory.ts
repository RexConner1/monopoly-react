export function createButton(
    label: string,
    onClick: () => void,
    disabled = false
) {
    const btn = document.createElement("button");
    btn.innerHTML = label;
    btn.disabled = disabled;
    btn.onclick = onClick;
    return btn;
}
