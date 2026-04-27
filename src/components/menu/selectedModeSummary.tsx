import type { MonopolyMode } from "../../assets/types";

export function SelectedModeSummary({ selectedMode }: { selectedMode: MonopolyMode }) {
    const timerText =
        selectedMode.turnTimer === undefined || selectedMode.turnTimer === 0
            ? "No Timer"
            : `${selectedMode.turnTimer} Sec`;

    return (
        <main>
            <h3>{selectedMode.Name}</h3>

            <table>
                <tbody>
                    <tr>
                        <td>Winning State:</td>
                        <td>{selectedMode.WinningMode.toUpperCase()}</td>
                    </tr>
                    <tr>
                        <td>Trades:</td>
                        <td>{selectedMode.AllowDeals ? "ALLOWED" : "NOT-ALLOWED"}</td>
                    </tr>
                    <tr>
                        <td>Mortgage:</td>
                        <td>{selectedMode.mortageAllowed ? "ALLOWED" : "NOT-ALLOWED"}</td>
                    </tr>
                    <tr>
                        <td>Starting Cash:</td>
                        <td>{selectedMode.startingCash} M</td>
                    </tr>
                    <tr>
                        <td>Turn Timer:</td>
                        <td>{timerText}</td>
                    </tr>
                </tbody>
            </table>
        </main>
    );
}
