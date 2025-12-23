import { getJailButtons, enableButton, disableButton } from "./jailButtonHelpers";
import { handlePayToExitJail, handleCardToExitJail, handleRollInJail } from "./jailActionHandlers";

export function showJailButtons({
    isCardAvailable,
    socket,
    applyAnimation,
    SetSended,
    SetTimer
}: any) {
    const { roll, pay, card } = getJailButtons();

    const returnToNormal = () => {
        roll.onclick = () => {
            SetSended(true);
            socket.emit("roll_dice");
            console.warn("roll after return to normal");
            SetTimer(0);
        };

        SetTimer(0);
        SetSended(true);

        disableButton(card);
        disableButton(pay);

        pay.style.translate = "0px 0px";
    };

    // PAY OPTION
    enableButton(pay);
    pay.onclick = () =>
        handlePayToExitJail({
            socket,
            applyAnimation,
            returnToNormal
        });

    // CARD OPTION (optional)
    if (isCardAvailable) {
        enableButton(card);
        card.onclick = () =>
            handleCardToExitJail({
                socket,
                returnToNormal
            });
    } else {
        disableButton(card);
    }

    // ROLL OPTION
    roll.onclick = () =>
        handleRollInJail({
            socket,
            returnToNormal,
            SetSended,
            SetTimer
        });
}
