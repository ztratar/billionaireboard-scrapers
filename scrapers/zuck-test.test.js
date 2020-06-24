import { getRecentData } from "./chan-zuckerberg-initiative";

import { validateNormalizedContribution } from "../test-helpers";

test('Recent data makes API calls', async () => {
  // Load 1 page of data
  const recentData = await getRecentData(1);
  for (const d of recentData) {
    validateNormalizedContribution(d);
  }
});

