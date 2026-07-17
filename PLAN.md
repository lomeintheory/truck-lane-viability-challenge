# Task 2: Mini Architecture

## Assumptions
- The "My Offers" page is offer-centric: buyers view their individual offers with lane context. This drives the decision to keep the offer-centric structure (returning offers enriched with lane data) rather than overhauling to a lane-centric one (returning a map of lanes).
- The regression on the "My Offers" page is likely caused by mutation. The `build()` method mutates the input array in place, which creates hidden coupling. Any code using the same array reference elsewhere gets polluted with unexpected lane properties. This makes changes unsafe because an engineer adding more functionality to the class can unknowingly break other features that reuse the same data. For example, if offers are stored in React state, mutating them doesn't trigger re-renders because the reference hasn't changed, breaking UI updates. 
  - On that same note, the code is likely hard to modify safely because the `build()` method does too much in one place (grouping, calculating, checking viability). This makes it hard to understand, test, and modify individual pieces safely.
- Performance issues affect buyers with hundreds of offers is likely due to the O(n²) algorithm from filtering inside the for loop.
- An unconfigured truck type (missing from `minimums`) is a configuration gap, not a legitimate "no minimum required" signal. If sellers are expected to configure minimums for every truck type they run, silently defaulting to zero minimums would make any lane with an unconfigured truck type viable, which risks telling a buyer a lane will ship when the seller never actually committed to a minimum for that truck type.

## Proposed Solution

### Fix mutation issue
- Refactor build() to return new OfferWithLaneData[] instead of mutating input
- Introduce OfferWithLaneData interface (extends Offer with required lane fields)
- This makes the transformation explicit and type-safe

### Fix performance
- Replace filter-in-loop with separate passes:
  - Pass 1: Group offers by lane (O(n)) and calculate aggregates per lane
  - Pass 2: Map offers to enriched results
- Time complexity becomes O(n) instead of O(n²)

### Improve code design
- Extract focused helper functions to make the code easier to understand and modify safely:
  - `calculateLaneTotals()`: Computes revenue, weight, and pallets for a group of offers. Isolates the aggregation logic.
  - `getMinimums()`: Resolves minimums with fallback and encapsulates the lookup logic.

### Handle unconfigured truck types
- `getMinimums()` returns `MinimumSet | null` instead of defaulting to `{ revenue: 0, weight: 0, pallets: 0 }` when a truck type isn't in `minimums`
- `build()` treats `null` as an unknown viability state (`laneViable = undefined`) rather than viable, so a missing config can't be misread as "this lane will ship"
- Surfaces the config gap as a distinct state the frontend can render ("no shipping minimums on file"), instead of silently passing it off as viable

### Add gap feature
- Calculate shortfalls per dimension:
  - laneRevenueGap = mins.revenue - actual
  - laneWeightGap = mins.weight - actual
  - lanePalletsGap = mins.pallets - actual
- Add to OfferWithLaneData interface
