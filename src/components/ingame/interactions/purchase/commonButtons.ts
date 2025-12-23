import { createButton } from "../../dom/buttonFactory";

export function createContinueButton(
    onContinue: () => void
) {
    return createButton("CONTINUE", onContinue);
}
