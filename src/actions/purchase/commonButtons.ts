import { createButton } from "../../ui/dom/buttonFactory";

export function createContinueButton(
    onContinue: () => void
) {
    return createButton("CONTINUE", onContinue);
}
