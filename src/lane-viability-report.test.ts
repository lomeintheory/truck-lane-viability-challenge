import { LaneViabilityReport } from "./lane-viability-report";
import { Offer, OfferStatus } from "./types";
import { expect } from "chai";

// Tests

function makeOffer(overrides: Partial<Offer> & { id: string }): Offer {
  return {
    buyerName: 'Acme Discount Grocers',
    destination: 'Dallas, TX',
    truckType: 'dry',
    status: OfferStatus.ACTIVE,
    quantity: 100,
    pricePerCase: 10,
    unitGrossWeight: 12,
    casesPerPallet: 50,
    ...overrides,
  };
}

(() => {
  console.log('Starting tests...');

  (() => {
    console.log('-- marks a lane viable when all minimums are met --');
    const report = new LaneViabilityReport(
      [
        makeOffer({ id: 'off1', quantity: 200, pricePerCase: 12 }),
        makeOffer({ id: 'off2', quantity: 150, pricePerCase: 10 }),
      ],
      { dry: { revenue: 3000, weight: 4000, pallets: 5 } }
    );
    const rows = report.build();
    expect(rows[0].laneRevenue).to.equal(3900);
    expect(rows[0].laneWeight).to.equal(4200);
    expect(rows[0].lanePallets).to.equal(7);
    expect(rows[0].laneViable).to.equal(true);
    expect(rows[1].laneViable).to.equal(true);
  })();

  (() => {
    console.log('-- marks a lane not viable when a minimum is missed --');
    const report = new LaneViabilityReport(
      [makeOffer({ id: 'off1' })],
      { dry: { revenue: 1500, weight: 500, pallets: 1 } }
    );
    const rows = report.build();
    expect(rows[0].laneViable).to.equal(false);
  })();

  (() => {
    console.log('-- groups offers into separate lanes --');
    const report = new LaneViabilityReport(
      [
        makeOffer({ id: 'off1', destination: 'Dallas, TX' }),
        makeOffer({ id: 'off2', destination: 'Memphis, TN' }),
      ],
      { dry: { revenue: 900, weight: 0, pallets: 0 } }
    );
    const rows = report.build();
    expect(rows[0].laneKey).to.equal('Dallas, TX|dry');
    expect(rows[1].laneKey).to.equal('Memphis, TN|dry');
    expect(rows[0].laneRevenue).to.equal(1000);
    expect(rows[1].laneRevenue).to.equal(1000);
  })();

  (() => {
    console.log('-- excludes accepted offers from lane totals --');
    const report = new LaneViabilityReport(
      [makeOffer({ id: 'off1' }), makeOffer({ id: 'off2', status: OfferStatus.ACCEPTED })],
      { dry: { revenue: 0, weight: 0, pallets: 0 } }
    );
    const rows = report.build();
    expect(rows[0].laneRevenue).to.equal(1000);
  })();

  (() => {
    console.log('-- counts every open offer in lane totals --');
    const report = new LaneViabilityReport(
      [makeOffer({ id: 'off1' }), makeOffer({ id: 'off2', status: OfferStatus.CANCELLED, quantity: 50 })],
      { dry: { revenue: 1200, weight: 0, pallets: 0 } }
    );
    const rows = report.build();
    expect(rows[0].laneRevenue).to.equal(1500);
    expect(rows[0].laneViable).to.equal(true);
  })();

  console.log('...Tests complete!');
})();
