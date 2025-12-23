import { waitForElement } from "../../dom/waitForElement";

export function handleSimplePurchase({
    args,
    fartherInfo,
    ShowStreet,
    clickSound
}: any) {
    waitForElement<HTMLButtonElement>(
        "button#card-response-yes",
        (yesButton) => {
            yesButton.onclick = () => {
                if (fartherInfo) {
                    args.onResponse("special_action", {
                        rolls: fartherInfo.rolls
                    });
                } else {
                    args.onResponse("buy", {});
                }
                ShowStreet(false);
            };

            const noButton = document.querySelector(
                "button#card-response-no"
            ) as HTMLButtonElement;

            noButton.onclick = () => {
                clickSound();
                args.onResponse("nothing", {});
                ShowStreet(false);
            };
        }
    );
}