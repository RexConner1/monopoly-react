import { PlayerJSON } from "../../../assets/player";
import { applyTurnUpdate } from "../game/turn/applyTurnUpdate";
import { handleBankruptcy } from "../game/rules/bankruptcy";
import { checkMonopolyWin } from "../game/rules/monopolyWin";
import { checkRailroadWin } from "../game/rules/railroadWin";
import { handleJailTurnUI } from "../ui/jail/handleJailTurnUI";

export function onTurnFinished(args: {
    from: string;
    turnId: string;
    pJson: PlayerJSON;
    WinningMode: string;
}, context: any) {
    const {
        navRef,
        SetCurrent,
    } = context;

    applyTurnUpdate(args, context);

    const bankruptHandled = handleBankruptcy(args, context);
    if (bankruptHandled) return;

    if (args.WinningMode === "monopols" || args.WinningMode === "monopols & trains") {
        if (checkMonopolyWin(context)) return;

        if (args.WinningMode === "monopols & trains") {
            if (checkRailroadWin(context)) return;
        }
    }

    SetCurrent(args.turnId);
    handleJailTurnUI(args.turnId, context);
    navRef.current?.reRenderPlayerList();
}
