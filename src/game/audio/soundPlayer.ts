export function playSound(
    src: string,
    volume: number
) {
    const audio = new Audio(src);
    audio.volume = volume;
    audio.loop = false;
    audio.play();
}
