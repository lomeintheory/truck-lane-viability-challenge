import { LaneViabilityReport, calculateLaneGap, calculateLaneTotals, getLaneKey, getMinimums } from "./lane-viability-report";
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

  (() => {
    console.log('-- calculateLaneTotals aggregates revenue, weight, and pallets per lane --');
    const totals = calculateLaneTotals([
      makeOffer({ id: 'off1', quantity: 200, pricePerCase: 12 }),
      makeOffer({ id: 'off2', quantity: 150, pricePerCase: 10 })
    ]);
    const dallasDry = totals.get('Dallas, TX|dry');
    expect(dallasDry?.revenue).to.equal(3900);
    expect(dallasDry?.weight).to.equal(4200);
    expect(dallasDry?.pallets).to.equal(7);
  })();

  (() => {
    console.log('-- calculateLaneTotals excludes accepted offers --');
    const totals = calculateLaneTotals([
      makeOffer({ id: 'off1' }),
      makeOffer({ id: 'off2', status: OfferStatus.ACCEPTED }),
    ]);
    expect(totals.get('Dallas, TX|dry')?.revenue).to.equal(1000);
  })();

  (() => {
    console.log('-- calculateLaneTotals keeps different truck types at the same destination separate --');
    const totals = calculateLaneTotals([
      makeOffer({ id: 'off1', truckType: 'dry' }),
      makeOffer({ id: 'off2', truckType: 'refrigerated' }),
    ]);
    expect(totals.get('Dallas, TX|dry')?.revenue).to.equal(1000);
    expect(totals.get('Dallas, TX|refrigerated')?.revenue).to.equal(1000);
  })();

  (() => {
    console.log('-- getMinimums returns the configured minimums for a truck type --');
    const mins = getMinimums({ dry: { revenue: 100, weight: 200, pallets: 3 } }, 'dry');
    expect(mins).to.deep.equal({ revenue: 100, weight: 200, pallets: 3 });
  })();

  (() => {
    console.log('-- getMinimums returns null for an unconfigured truck type --');
    const mins = getMinimums({ dry: { revenue: 100, weight: 200, pallets: 3 } }, 'refrigerated');
    expect(mins).to.equal(null);
  })();

  (() => {
    console.log('-- leaves viability and gaps undefined when the truck type is not configured --');
    const report = new LaneViabilityReport(
      [makeOffer({ id: 'off1', truckType: 'refrigerated' })],
      { dry: { revenue: 1000, weight: 1000, pallets: 1 } }
    );
    const rows = report.build();
    expect(rows[0].laneViable).to.equal(undefined);
    expect(rows[0].laneRevenueGap).to.equal(undefined);
    expect(rows[0].laneWeightGap).to.equal(undefined);
    expect(rows[0].lanePalletsGap).to.equal(undefined);
  })();

  (() => {
    console.log('-- getLaneKey combines destination and truck type --');
    expect(getLaneKey('Dallas, TX', 'dry')).to.equal('Dallas, TX|dry');
  })();

  (() => {
    console.log('-- calculateLaneGap returns zero gaps when totals meet minimums --');
    const gap = calculateLaneGap(
      { revenue: 1000, weight: 1200, pallets: 2 },
      { revenue: 1000, weight: 1000, pallets: 1 }
    );
    expect(gap).to.deep.equal({ revenue: 0, weight: 0, pallets: 0 });
  })();

  (() => {
    console.log('-- calculateLaneGap returns the shortfall per dimension when totals miss minimums --');
    const gap = calculateLaneGap(
      { revenue: 1000, weight: 1200, pallets: 2 },
      { revenue: 1500, weight: 1500, pallets: 5}
    );
    expect(gap).to.deep.equal({ revenue: 500, weight: 300, pallets: 3 });
  })();

  (() => {
    console.log('-- calculateLaneGap returns null when minimums are not configured --');
    const gap = calculateLaneGap({ revenue: 1000, weight: 1200, pallets: 2 }, null);
    expect(gap).to.equal(null);
  })();

  (() => {
    console.log('-- reports a zero gap on every dimension when a lane is viable --');
    const report = new LaneViabilityReport(
      [makeOffer({ id: 'off1', quantity: 200, pricePerCase: 12 })],
      { dry: { revenue: 1000, weight: 1000, pallets: 1 } }
    );
    const rows = report.build();
    expect(rows[0].laneRevenueGap).to.equal(0);
    expect(rows[0].laneWeightGap).to.equal(0);
    expect(rows[0].lanePalletsGap).to.equal(0);
  })();

  (() => {
    console.log('-- reports the shortfall per dimension when a lane is not viable --');
    const report = new LaneViabilityReport(
      [makeOffer({ id: 'off1' })],
      { dry: { revenue: 1500, weight: 1500, pallets: 5 } }
    );
    const rows = report.build();
    expect(rows[0].laneRevenueGap).to.equal(500);
    expect(rows[0].laneWeightGap).to.equal(300);
    expect(rows[0].lanePalletsGap).to.equal(3);
    expect(rows[0].laneViable).to.equal(false);
  })();

  console.log('...Tests complete!');
})();
