/*
 * TO RUN: DEBUG=* node -r esm scrapers/gates-foundation.js
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

const log = debug("scraper:gates-foundation");

/*
 * -----------------------
 *    SCRAPER CONSTANTS
 * -----------------------
 */
export const FUND_ID = '3b7ac2c2-760f-4cc6-a71a-887fe10a052f'; // Gates Foundation
export const BILLIONAIRE_ID = '31bfe210-0592-480a-9fc8-67c54e7c9c05'; // Bill Gates

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
export const normalizeContribution = async (record) => {
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
  const normalizedObj = {
    // Required Fields
    type: 'donation',
    title: record.title,
    billionaire: BILLIONAIRE_ID,
    date_of_investment: record.date, // ISO format
    amount: record.amount,
    amount_is_estimate: false,
    currency: 'USD',
    related_causes: causes,
    impact_score: 3, // Default to the middle
    source_urls: [`https://www.gatesfoundation.org${record.url}`],
    // Optional
    organizationWebsite: null,
    description,
    image: record.thumbnailUrl,
    philanthropic_foundation: FUND_ID
  };

  log("Record normalized", normalizedObj);

  return normalizedObj;
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
  let allRawData = [];

  // Gates foundation.com has 21,846 records as of 6/7/2020
  // With their default scan, they have 1814 pages.
  for (let pageNumber = 1; pageNumber <= 1814; pageNumber++) {
    allRawData = allRawData.concat(await getDataFromApiPage(pageNumber));
  }
  const finalData = allRawData.map(d => normalizeContribution(d));
  return finalData;
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
  log('Getting recent data...');

  let allRawData = [];

  // Get the first 5 pages
  for (let pageNumber = 1; pageNumber <= 5; pageNumber++) {
    allRawData = allRawData.concat(await getDataFromApiPage(pageNumber));
  }
  const finalData = allRawData.map(d => normalizeContribution(d));
  return finalData;
};

/*
 * -----------------------
 *    PRIVATE FUNCTIONS
 * -----------------------
 */
export const getDataFromApiPage = async (pageNumber) => {
  const scrapeUrl = "https://www.gatesfoundation.org/services/gfo/search.ashx";
  const queryData = {
    facetsToRender: ["gfocategories", "gfotopics", "gfoyear", "gforegions", "gfothumbnailurl", "gfograntee_website"],
    fieldQueries: '(@gfomediatype=="Grant")',
    freeTextQuery: '',
    page: pageNumber || 1,
    resultsPerPage: '12',
    sortBy: 'gfodate',
    sortDirection: 'desc'
  };

  const response = await fetch(scrapeUrl, {
    method: 'POST',
    body: JSON.stringify(queryData)
  });

  const data = (await response.json() || {}).results;
  /*
   * Example data from gatesfoundation.com API
   *
   * [{
   *   amount: 7517993
   *   categories: ["Global Health"]
   *   date: "2020-05-18T00:00:00-05:00"
   *   description: "to establish local molecular, genetic, and genomic laboratory and analytic capacity to support malaria surveillance in Tanzania."
   *   grantee: "National Institute for Medical Research"
   *   iconUrl: ""
   *   influencerTags: [""]
   *   0: ""
   *   influencerTopics: [""]
   *   languageCode: "en"
   *   mediaType: "Grant"
   *   regions: [""]
   *   subtitle: ""
   *   thumbnailAltText: ""
   *   thumbnailUrl: ""
   *   title: "National Institute for Medical Research"
   *   topics: ["Malaria"]
   *   url: "/How-We-Work/Quick-Links/Grants-Database/Grants/2020/05/INV-002202"
   *   year: "2020"
   * }, ...]
  */

  return data;
};

/*
 * -----------------------
 *       RUN CODE
 * -----------------------
 */
(async () => {
  log("Scraper starting...");

  // await getAllData(); // Ensure both exports work
  await getRecentData();

  log("Scraper Finished!");
})();
