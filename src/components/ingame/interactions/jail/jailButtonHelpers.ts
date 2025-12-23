export function getJailButtons() {
    return {
        roll: document.querySelector(
            `button[data-button-type="roll"]`
        ) as HTMLButtonElement,
        pay: document.querySelector(
            `button[data-button-type="pay"]`
        ) as HTMLButtonElement,
        card: document.querySelector(
            `button[data-button-type="card"]`
        ) as HTMLButtonElement
    };
}

export function enableButton(button: HTMLButtonElement) {
    button.setAttribute("aria-disabled", "false");
}

export function disableButton(button: HTMLButtonElement) {
    button.onclick = null;
    button.setAttribute("aria-disabled", "true");

    // small delay preserved from original logic
    setTimeout(() => {
        button.setAttribute("aria-disabled", "true");
    }, 300);
}
