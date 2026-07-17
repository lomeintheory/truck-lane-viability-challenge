# Truck Lane Viability

## Background
As a buyer on our marketplace, I place offers on surplus inventory from CPG sellers. Offers don't ship one at a time: they are grouped onto truck lanes, where a lane is a destination plus a truck type (for example, "Dallas, TX" on a dry truck). A seller will only run a truck if the lane is worth the freight cost, so each seller configures minimums per truck type: minimum total revenue, minimum total weight (in pounds), and minimum pallet count.

The LaneViabilityReport class powers the buyer's "My Offers" page. For each offer, it computes the totals of the lane that offer belongs to (revenue, weight, pallets) and whether the lane currently clears the seller's minimums, so the buyer can see which of their lanes are actually going to ship.

Some domain notes:

- An offer's revenue contribution is quantity * pricePerCase.
- An offer's weight contribution is quantity * unitGrossWeight.
- An offer's pallet contribution is quantity / casesPerPallet.
- ACCEPTED offers are already fulfilled and should not count toward a lane's current totals.

## Task 1: Code Review
Do a code review of the LaneViabilityReport class, and note any issues with code design, performance, functionality, and test coverage. Treat the tests as part of the code under review.

## Task 2: Mini Architecture
Now let's pretend this code has been in production for several months. Feedback has come in from a few directions:

- Engineers say the class is hard to modify safely, and a recent change caused a regression on the "My Offers" page.
- Large buyers with hundreds of offers say the page has gotten slow.
- Buyers say a viable/not-viable flag isn't enough. When a lane is not viable, they want to know how far off they are: how much more revenue, weight, or pallets they would need to add to make the lane ship.

Our Product Owner has prioritized the "gap" feature: for each lane, report the shortfall per dimension (revenue, weight, pallets) so the frontend can render "Add $450 more to make this lane viable."

Create a plan for how you would address this feedback in a refactor of this class. Take the lead and discuss with your interviewer, who can provide user and technical insights on request.

## Task 3: Implement it!
Time to pull it all together. Address your code review feedback and your architecture plan by improving the LaneViabilityReport class and adding the lane gap feature. Don't forget about the tests!

