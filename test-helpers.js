const DATETIME_ISO_8601_REGMATCH = /(\d{4})-(\d{2})-(\d{2})T(\d{2})\:(\d{2})\:(\d{2})[+-](\d{2})\:(\d{2})/;

export const validateNormalizedContribution = (contribution) => {
  expect(contribution.type).toBe('donation');
  expect(typeof contribution.title).toBe('string');
  expect(contribution.title.length).toBeGreaterThan(4);
  expect(typeof contribution.billionaire).toBe('string');
  expect(contribution.billionaire.length).toBe(36);
  expect(contribution.date_of_investment.match(DATETIME_ISO_8601_REGMATCH)).not.toBeNull();
  expect(contribution.amount).toBeGreaterThan(1);
  expect([true, false].indexOf(contribution.amount_is_estimate)).toBeGreaterThan(-1);
  for (const cause of (contribution.related_causes || [])) {
    expect(typeof cause).toBe('string');
  }
  expect(contribution.impact_score).toBeGreaterThan(-1);
  expect(contribution.impact_score).toBeLessThan(6);
  for (const source_url of (contribution.source_urls || [])) {
    expect(typeof source_url).toBe('string');
    expect(source_url).toContain('http');
    expect(source_url).toContain('://');
  }

  if (contribution.description) {
    expect(typeof contribution.description).toBe('string');
  }
  if (contribution.image) {
    expect(typeof contribution.image).toBe('string');
    expect(contribution.image.length).toBeLessThan(500);
  }
  if (contribution.philanthropic_foundation) {
    expect(typeof contribution.philanthropic_foundation).toBe('string');
    expect(contribution.philanthropic_foundation.length).toBe(36);
  }
};
