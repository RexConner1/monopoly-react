export function buildUtilityDisplay(x: any) {
    return {
        cardCost: x.price ?? -1,
        title: x.name ?? "error",
        type: x.id.includes("water") ? "water" : "electricity"
    };
}

export function buildRailroadDisplay(x: any) {
    return {
        cardCost: x.price ?? -1,
        title: x.name ?? "error"
    };
}

export function buildStreetDisplay(x: any) {
    return {
        cardCost: x.price ?? -1,
        hotelsCost: x.ohousecost ?? -1,
        housesCost: x.housecost ?? -1,
        rent: x.rent ?? -1,
        multpliedrent: x.multpliedrent
            ? [
                  x.multpliedrent[0] ?? -1,
                  x.multpliedrent[1] ?? -1,
                  x.multpliedrent[2] ?? -1,
                  x.multpliedrent[3] ?? -1,
                  x.multpliedrent[4] ?? -1,
              ]
            : [-1, -1, -1, -1, -1],
        rentWithColorSet: x.rent ? x.rent * 2 : -1,
        title: x.name ?? "error",
        group: x.group
    };
}
