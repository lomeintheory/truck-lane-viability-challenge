import { Offer, OfferStatus, LaneMinimums, MinimumSet, OfferWithLaneData } from "./types";

interface LaneTotals {
  revenue: number;
  weight: number;
  pallets: number;
}

interface LaneGap {
  revenue: number;
  weight: number;
  pallets: number;
}

export function calculateLaneTotals(offers: Offer[]): Map<string, LaneTotals> {
  const totals = new Map<string, LaneTotals>();

  for (const offer of offers) {
    if (offer.status === OfferStatus.ACCEPTED) continue;

    const laneKey = getLaneKey(offer.destination, offer.truckType);
    const currentTotals = totals.get(laneKey) ?? { revenue: 0, weight: 0, pallets: 0 };
    currentTotals.revenue += Math.round(offer.quantity * offer.pricePerCase * 100) / 100;
    currentTotals.weight += Math.round(offer.quantity * offer.unitGrossWeight * 100) / 100;
    currentTotals.pallets += offer.quantity / offer.casesPerPallet;
    totals.set(laneKey, currentTotals);
  }
  return totals;
}

export function getMinimums(minimums: LaneMinimums, truckType: string): MinimumSet | null {
  return minimums[truckType] ?? null;
}

export function getLaneKey(destination: string, truckType: string): string {
  return `${destination}|${truckType}`;
}

export function calculateLaneGap(totals: LaneTotals, mins: MinimumSet | null): LaneGap | null {
  if (!mins) return null;

  return {
    revenue: Math.max(0, mins.revenue - totals.revenue),
    weight: Math.max(0, mins.weight - totals.weight),
    pallets: Math.max(0, mins.pallets - totals.pallets),
  }
}

export class LaneViabilityReport {
  offers: Offer[];
  minimums: LaneMinimums;

  constructor(offers: Offer[], minimums: LaneMinimums) {
    this.offers = offers;
    this.minimums = minimums;
  }

  build(): OfferWithLaneData[] {
    const totalsByLane = calculateLaneTotals(this.offers);

    return this.offers.map((offer) => {
      const laneKey = getLaneKey(offer.destination, offer.truckType);
      const totals = totalsByLane.get(laneKey) ?? { revenue: 0, weight: 0, pallets: 0 };
      const mins = getMinimums(this.minimums, offer.truckType);
      const laneViable = mins ? totals.revenue >= mins.revenue && totals.weight >= mins.weight && totals.pallets >= mins.pallets : undefined;
      const gap = calculateLaneGap(totals, mins);

      return {
        ...offer,
        laneKey,
        laneRevenue: totals.revenue,
        laneWeight: totals.weight,
        lanePallets: totals.pallets,
        laneViable,
        laneRevenueGap: gap?.revenue,
        laneWeightGap: gap?.weight,
        lanePalletsGap: gap?.pallets,
      }
    })
  }
}
