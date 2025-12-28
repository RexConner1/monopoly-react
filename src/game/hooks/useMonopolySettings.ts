import { useEffect, useState } from "react";
import type { MonopolySettings } from "../../assets/types.ts";
import { CookieManager } from "../../assets/cookieManager.ts";


export function useMonopolySettings(pollMs = 1000) {
    const [settings, setSettings] = useState<MonopolySettings | undefined>(undefined);

    useEffect(() => {
        const interval = setInterval(() => {
            try {
                const raw = CookieManager.get("monopolySettings") as string;
                const parsed = JSON.parse(decodeURIComponent(raw))?.monopolySettings as MonopolySettings;
                setSettings(parsed);
            } catch {
                // ignore parse errors - cookie may not exist yet
            }
        }, pollMs);

        return () => clearInterval(interval);
    }, [pollMs]);

    return settings;
}
