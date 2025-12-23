import { createButton } from "./buttonFactory";

export function createContinueButton(
    onContinue: () => void
) {
    return createButton("CONTINUE", onContinue);
}
