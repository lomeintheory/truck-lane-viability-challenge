export enum OfferStatus {
  ACTIVE = 'Active',
  ACCEPTED = 'Accepted',
  CANCELLED = 'Cancelled',
}

export interface Offer {
  id: string;
  buyerName: string;
  destination: string; // where the truck is headed, e.g. 'Dallas, TX'
  truckType: string; // e.g. 'dry' or 'refrigerated'
  status: OfferStatus;
  quantity: number; // cases
  pricePerCase: number; // dollars
  unitGrossWeight: number; // lbs per case
  casesPerPallet: number;
  // populated by LaneViabilityReport
  laneKey?: string;
  laneRevenue?: number;
  laneWeight?: number;
  lanePallets?: number;
  laneViable?: boolean;
}

export interface MinimumSet {
  revenue: number; // dollars
  weight: number; // lbs
  pallets: number;
}

// Seller-configured lane minimums, keyed by truck type
export type LaneMinimums = { [truckType: string]: MinimumSet };
