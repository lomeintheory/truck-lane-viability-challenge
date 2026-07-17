# Task 1 Code Review

## Overview
The `LaneViabilityReport` class correctly implements the core functionality: it groups offers by lane, calculates totals, and determines viability. The tests validate the main scenarios as well. That being said, here are some areas we could improve:

## Functionality
- **Side effects - mutation violates report semantics**: The `build()` method mutates the input `offers` array by attaching lane properties (`laneRevenue`, `laneViable`, etc.). This is unexpected behavior for a class named `LaneViabilityReport` — a "report" implies a read-only summary/analysis of data, not transformation of the source. This creates hidden coupling: any code that uses the same `offers` reference elsewhere will unexpectedly see these new properties.
- **CANCELLED offers**: The test on line 78 expects CANCELLED offers to count toward lane totals (only ACCEPTED are excluded). Is this the intended business logic? (Based on the take-home assignment, I'd think not and this is where I'd ask the team for additional insights)

## Performance
- **O(n²) time complexity in build()**: The current implementation has O(n²) time complexity because each offer triggers a filter over all offers. With large offer counts, this could become a bottleneck. We could improve this to O(n) by grouping offers by lane in a first pass, then calculating totals in a second pass. This would maintain the same behavior while scaling better.

## Design
- **Lane metadata duplication**: Currently each offer in the same lane carries identical values of `laneRevenue`, `laneWeight`, etc. This couples offer data with lane aggregates. For the offer-centric "My Offers" page, this trade-off is reasonable (simplicity and UI alignment vs. data normalization). If requirements shift toward lane-centric features (seller dashboards, lane marketplace), a lane-keyed structure might be worth revisiting.
- **Type design mixes domain and computed data**: The `Offer` interface includes optional lane properties that are "populated by LaneViabilityReport". This pollutes the domain model with computed/derived data and makes these properties optional everywhere, even after `build()` runs. 
- **Mixed concerns in build()**: Grouping, calculation, and viability logic are all intertwined in one method. This makes it harder to test and modify safely. I'd consider extracting calculation logic into testable helper functions.
- **Unused method**: The `laneRevenue()` method has no test coverage and duplicates logic from `build()`. Because it's not being called elsewhere, we could remove it or to piggyback on the previous point, incorporate it into `build()` as a helper function and maybe even refactor it to calculate weight and pallet totals.
- **Template literals**: Could improve readability: 
  ```typescript
  const laneKey = `${destination}|${truckType}`;

## Test Coverage
- **Missing test: different truck types on same destination**: The tests don't verify that Dallas|dry and Dallas|refrigerated are separate lanes, even though the laneKey logic suggests they should be.
- **Missing test: truck type not in minimums**: The fallback logic when a truck type's minimum set isn't configured has no test coverage.
