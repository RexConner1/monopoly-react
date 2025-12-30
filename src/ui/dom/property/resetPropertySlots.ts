export function resetPropertySlots(container: HTMLDivElement) {
    const slots = Array.from(
        container.querySelectorAll("div.street-houses")
    ) as HTMLDivElement[];

    for (const slot of slots) {
        slot.replaceChildren();
        slot.onclick = null;
        slot.style.cursor = "unset";
        slot.style.backgroundColor = "rgba(0,0,0,0%)";
        slot.style.padding = "0px";
        slot.setAttribute("data-tooltip-hover", "");
        slot.style.zIndex = "unset";
        slot.style.boxShadow = "";
    }
}
