import { Offer, OfferStatus, LaneMinimums } from "./types";

export class LaneViabilityReport {
  offers: Offer[];
  minimums: LaneMinimums;

  constructor(offers: Offer[], minimums: LaneMinimums) {
    this.offers = offers;
    this.minimums = minimums;
  }

  build(): Offer[] {
    console.log('Building lane viability report...');
    for (const offer of this.offers) {
      const laneOffers = this.offers.filter(
        (o) => o.destination + '|' + o.truckType === offer.destination + '|' + offer.truckType
      );
      let revenue = 0;
      let weight = 0;
      let pallets = 0;
      for (const o of laneOffers) {
        if (o.status === OfferStatus.ACCEPTED) continue; // already fulfilled
        revenue += Math.round(o.quantity * o.pricePerCase * 100) / 100;
        weight += Math.round(o.quantity * o.unitGrossWeight * 100) / 100;
        pallets += o.quantity / o.casesPerPallet;
      }
      const mins = this.minimums[offer.truckType]
        ? this.minimums[offer.truckType]
        : { revenue: 0, weight: 0, pallets: 0 };
      offer.laneKey = offer.destination + '|' + offer.truckType;
      offer.laneRevenue = revenue;
      offer.laneWeight = weight;
      offer.lanePallets = pallets;
      offer.laneViable = revenue >= mins.revenue && weight >= mins.weight && pallets >= mins.pallets;
      console.log(`Offer ${offer.id}: lane ${offer.laneKey} viable=${offer.laneViable}`);
    }
    return this.offers;
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
