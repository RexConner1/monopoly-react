// src/pages/Home/monopoly/utils/audio.ts
import type { MonopolySettings } from "../../assets/types.ts";
import { playSound } from "./soundPlayer.ts";

/**
 * The project uses a 3-slot audio array:
 * - audio[0] master
 * - audio[1] SFX
 * - audio[2] music
 */
export const MonopolySfx = {
    propertyPurchased: "./buying1.mp3",
    moneyAdded: "./moneyplus.mp3",
    moneyDeducted: "./moneyminus.mp3",
    jail: "./jail.mp3",
    rolling: "./rolling.mp3",
} as const;

export function getMusicVolume(settings?: MonopolySettings, base = 0.25) {
    if (!settings?.audio) return base;
    const [master, _sfx, music] = settings.audio;
    return (master / 100) * (music / 100);
}

export function getSfxVolume(settings?: MonopolySettings, base = 1) {
    if (!settings?.audio) return base;
    const [master, sfx] = settings.audio;
    return (master / 100) * (sfx / 100) * base;
}

export function playSfx(src: string, settings?: MonopolySettings, base = 1) {
    playSound(src, getSfxVolume(settings, base));
}

export function playPurchaseSfx(settings?: MonopolySettings) {
    playSfx(MonopolySfx.propertyPurchased, settings, 0.5);
}

export function playMoneyPlusSfx(settings?: MonopolySettings) {
    playSfx(MonopolySfx.moneyAdded, settings, 1);
}

export function playMoneyMinusSfx(settings?: MonopolySettings) {
    playSfx(MonopolySfx.moneyDeducted, settings, 1);
}

export function playJailSfx(settings?: MonopolySettings) {
    playSfx(MonopolySfx.jail, settings, 0.5);
}

export function playRollSfx(settings?: MonopolySettings) {
    playSfx(MonopolySfx.rolling, settings, 1);
}