//import monopolyJSON from "./monopoly.json";

export type CardBase = {
    title: string;
};

export type MoveCard = CardBase & {
    action: "move";
    tileid?: string;
    count?: number;
};

export type MoveNearestCard = CardBase & {
    action: "movenearest";
    groupid: "utility" | "railroad";
    rentmultiplier: number;
};

export type AddFundsCard = CardBase & {
    action: "addfunds";
    amount: number;
};

export type RemoveFundsCard = CardBase & {
    action: "removefunds";
    amount: number;
};

export type AddFundsFromPlayersCard = CardBase & {
    action: "addfundsfromplayers";
    amount: number;
};

export type RemoveFundsToPlayersCard = CardBase & {
    action: "removefundstoplayers";
    amount: number;
};

export type JailCard = CardBase & {
    action: "jail";
    subaction: "getout" | "goto";
};

export type PropertyChargesCard = CardBase & {
    action: "propertycharges";
    buildings: number;
    hotels: number;
};

export type ChanceCommunityChestCard =
    | MoveCard
    | MoveNearestCard
    | AddFundsCard
    | RemoveFundsCard
    | AddFundsFromPlayersCard
    | RemoveFundsToPlayersCard
    | JailCard
    | PropertyChargesCard;

//export const chanceCards: ChanceCommunityChestCard[] = monopolyJSON.chance as ChanceCommunityChestCard[];
//export const communityChestCards: ChanceCommunityChestCard[] = monopolyJSON.communitychest as ChanceCommunityChestCard[];
