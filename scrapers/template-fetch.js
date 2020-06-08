/*
 * This template exists for you to create a scaffold for the scraper.
 * Please test both your recent and "all" scrapers.
 *
 * TO RUN: DEBUG=* node -r esm scrapers/<your-scraper>.js
 *
 * This will enable logging to print, and import/export ES6 use.
 */

import fetch from "node-fetch";
import _ from "lodash";
import debug from "debug";

import {
  extractCausesFromText,
  normalizeDescription
} from "../helpers";

const log = debug("scraper:template");

/*
 * -----------------------
 *    SCRAPER CONSTANTS
 * -----------------------
 */
export const FUND_ID = ''; // Get ID from billionaireboard
export const BILLIONAIRE_ID = ''; // Get ID from billionaireboard

/*
 * -----------------------
 * GLOBAL EXPORT FUNCTIONS
 * -----------------------
 */

/*
 * normalizeContribution
 *
 * Map the raw data you have from your custom scraper to the standard format,
 * which is then used for BillionaireBoard.com.
 */
export const normalizeContribution = (record) => {
  // Ensure description follows best practice formatting.
  const description = normalizeDescription(record.description);

  // Extract causes from combined title/description/topics we scraped
  const causeSearchText = _.flatten([
    record.title,
    record.description,
    record.topics
  ]).join(' ');
  const causes = await extractCausesFromText(causeSearchText);

  // Return the object
  return {
    // Required Fields
    type: 'donation',
    title: record.title,
    billionaire: BILLIONAIRE_ID,
    date_of_investment: record.date, // ISO format, guess to nearest time you can
    amount: record.amount,
    amount_is_estimate: false,
    currency: 'USD',
    related_causes: causes,
    impact_score: 3, // Default to the middle
    source_urls: [record.url], // Just ensure it's the right url
    // Optional
    organizationWebsite: null,
    description,
    image: record.thumbnailUrl,
    philanthropic_foundation: FUND_ID
  };
};

/*
 * getAllData
 *
 * Returns an array of *all* of the data from the source,
 * in the silobase format as follows. This function is expected to take
 * a long time to finish, navigate multiple pages, and potentially return
 * up to hundreds/thousands of records for the largest foundations.
 */
export const getAllData = async () => {
};

/*
 * getRecentData
 *
 * Returns an array of *new* data from the source,
 *
 * Expect that this function will be run daily to get new data. It should
 * pull the last 20-30 records from the foundation's website. Since we'll run it
 * every day, we shouldn't miss anything.
 */
export const getRecentData = async () => {
};

/*
 * -----------------------
 *    PRIVATE FUNCTIONS
 * -----------------------
 */


/*
 * -----------------------
 *       RUN CODE
 * -----------------------
 */
(async () => {
  // await getAllData(); // Ensure both exports work
  await getRecentData();
})();
