export function handleJailTurnUI(turnId: string, context: any) {
    const { clients, socket, engineRef } = context;
    if (turnId !== socket.id) return;

    const player = clients.get(turnId);
    if (player?.isInJail) {
        engineRef.current?.showJailsButtons(player.getoutCards > 0);
    }
}
