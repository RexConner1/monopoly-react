export function createContinueButton({
    parent,
    onContinue,
}: {
    parent: HTMLElement;
    onContinue: () => void;
}) {
    const btn = document.createElement("button");

    btn.innerHTML = "CONTINUE";

    btn.onclick = () => {
        onContinue();
    };

    parent.appendChild(btn);

    return btn;
}
