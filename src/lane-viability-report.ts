import { Offer, OfferStatus, LaneMinimums } from "./types";

interface LaneTotals {
  revenue: number;
  weight: number;
  pallets: number;
}

export function calculateLaneTotals(offers: Offer[]): Map<string, LaneTotals> {
  const totals = new Map<string, LaneTotals>();

  for (const offer of offers) {
    if (offer.status === OfferStatus.ACCEPTED) continue;
    
    const laneKey = `${offer.destination}|${offer.truckType}`;
    const currentTotals = totals.get(laneKey) ?? { revenue: 0, weight: 0, pallets: 0 };
    currentTotals.revenue += Math.round(offer.quantity * offer.pricePerCase * 100) / 100;
    currentTotals.weight += Math.round(offer.quantity * offer.unitGrossWeight * 100) / 100;
    currentTotals.pallets += offer.quantity / offer.casesPerPallet;
    totals.set(laneKey, currentTotals);
  }
  return totals;
}

export class LaneViabilityReport {
  offers: Offer[];
  minimums: LaneMinimums;

  constructor(offers: Offer[], minimums: LaneMinimums) {
    this.offers = offers;
    this.minimums = minimums;
  }

  build(): Offer[] {
    const totalsByLane = calculateLaneTotals(this.offers);

    for (const offer of this.offers) {
      const laneKey = `${offer.destination}|${offer.truckType}`;
      const totals = totalsByLane.get(laneKey) ?? { revenue: 0, weight: 0, pallets: 0 };
      const mins = this.minimums[offer.truckType] ? this.minimums[offer.truckType] : { revenue: 0, weight: 0, pallets: 0 };

      offer.laneKey = laneKey;
      offer.laneRevenue = totals.revenue;
      offer.laneWeight = totals.weight;
      offer.lanePallets = totals.pallets;
      offer.laneViable = totals.revenue >= mins.revenue && totals.weight >= mins.weight && totals.pallets >= mins.pallets;
    }
    return this.offers;
    // console.log('Building lane viability report...');
    // for (const offer of this.offers) {
    //   const laneOffers = this.offers.filter(
    //     (o) => o.destination + '|' + o.truckType === offer.destination + '|' + offer.truckType
    //   );
    //   let revenue = 0;
    //   let weight = 0;
    //   let pallets = 0;
    //   for (const o of laneOffers) {
    //     if (o.status === OfferStatus.ACCEPTED) continue; // already fulfilled
    //     revenue += Math.round(o.quantity * o.pricePerCase * 100) / 100;
    //     weight += Math.round(o.quantity * o.unitGrossWeight * 100) / 100;
    //     pallets += o.quantity / o.casesPerPallet;
    //   }
    //   const mins = this.minimums[offer.truckType]
    //     ? this.minimums[offer.truckType]
    //     : { revenue: 0, weight: 0, pallets: 0 };
    //   offer.laneKey = offer.destination + '|' + offer.truckType;
    //   offer.laneRevenue = revenue;
    //   offer.laneWeight = weight;
    //   offer.lanePallets = pallets;
    //   offer.laneViable = revenue >= mins.revenue && weight >= mins.weight && pallets >= mins.pallets;
    //   console.log(`Offer ${offer.id}: lane ${offer.laneKey} viable=${offer.laneViable}`);
    // }
    // return this.offers;
  }

  laneRevenue(destination: string, truckType: string): number {
    const laneOffers = this.offers.filter(
      (o) => o.destination + '|' + o.truckType === destination + '|' + truckType
    );
    let revenue = 0;
    for (const o of laneOffers) {
      if (o.status === OfferStatus.ACCEPTED) continue;
      revenue += Math.round(o.quantity * o.pricePerCase * 100) / 100;
    }
    return revenue;
  }
}
