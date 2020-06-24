/*
 * This template exists for you to create a scaffold for the scraper.
 *
 * Billionaires have foundations, and many foundations or billionaires directly
 * have websites that can be scraped. We want to gather their contribution data
 * and map it to the standard format.
 *
 * - Use the scaffold below to get started.
 * - Export global functions as they are named below. These will be
 *   called by the generic infrastructure, and then populate billionareboard.
 * - Please test both your recent and "all" scrapers. You can do this with jest.
 * - For a functioning example, refer to scrapers/gates-foundation.js
 * - More info: https://www.notion.so/ztratar/Billionaire-Scraping-0f1e6cfe7401422b845016e02e64c4b4
 *
 * TO RUN:
 * - yarn
 * - DEBUG=* node -r esm scrapers/<your-scraper>.js
 */

import _ from "lodash";
import debug from "debug";
import puppeteer from 'puppeteer'

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
export const FUND_ID = '9b4a1c89-a28d-4196-aa42-5d108aff7b5d'; // Get ID from billionaireboard
export const BILLIONAIRE_ID = '3b7bb5fe-04df-4ae9-af6f-9c054ecf29a8'; // Get ID from billionaireboard

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
export const getAllData = async () => await Promise.all((await getAll()).map(normalizeContribution))

/*
 * getRecentData
 *
 * Returns an array of *new* data from the source,
 *
 * Expect that this function will be run daily to get new data. It should
 * pull the last 20-30 records from the foundation's website. Since we'll run it
 * every day, we shouldn't miss anything.
 */
export const getRecentData = async (numberOfRow = 25) => await Promise.all((await getRowRange(numberOfRow)).map(normalizeContribution))

/*
 * -----------------------
 *    PRIVATE FUNCTIONS
 * -----------------------
 */

const url = 'https://chanzuckerberg.com/grants-ventures/grants/';

const normalizeAmount = amount => parseInt(amount.replace('$','').replace(',',''))
const normalizeDate = dateString => `${dateString.split(' - ')[0]}-12-31T22:28:08+00:00`

const scrapeFunctionFactory = func => async (row) => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  //Disable extraneous visual element like image or font to decrease load time
  await page.setRequestInterception(true);
  page.on('request', (request) => {
      if (['image', 'stylesheet', 'font', 'script'].indexOf(request.resourceType()) !== -1) return request.abort()
      request.continue()
  });


  const totalPromise = page.goto(url);
  //In case we only have to wait for a specific row before proceeding, 
  //we stop the page loading when that row have been loaded

  if(row){
    await page.waitForSelector(`tr:nth-of-type(${row+2}) .list-0 .td-searchable`);
    await page.evaluate(()=>window.stop())
  }
  else await totalPromise

  const result = await func(page,row)
  
  await browser.close()
  return result
}

const getRow = async (page,row)=>{
      const rowSelector = `tr:nth-of-type(${row+2})`
      const getList = number=>page.$$eval(`${rowSelector} .list-${number} .td-searchable`,e=>e.map(f=>f.innerHTML))
      const [title] = (await getList(0)); //The title is automatically the name of the grantee
      const [description] = (await getList(1))
      let [amount,date] = await getList(2)
      amount = normalizeAmount(amount)
      date = normalizeDate(date)
      const [topics] = (await getList(3))
      return {title,description,amount,date,topics,url}
}

const getRowRange = scrapeFunctionFactory(async (page,row)=>{
  const rows = []
  for(let i = 0;i<row;i++) rows.push(await getRow(page,i))
  return rows;
})

const getAll = scrapeFunctionFactory(async (page)=>{
      const getList = number=>page.$$eval(`.list-${number} .td-searchable`,e=>e.map(f=>f.innerHTML))

      const titles = await getList(0);
      const descriptions = await getList(1);

      const dateandamount = await getList(2);
      const amounts = dateandamount.filter((e,i)=>!(i%2)).map(normalizeAmount)
      const dates = dateandamount.filter((e,i)=>(i%2)).map(normalizeDate)
      const topics = (await getList(3)).filter((e,i)=>!(i%2))
      return titles.map((title,i)=>({title,description:descriptions[i],amount:amounts[i],date:dates[i],topic:topics[i],url}))
});

/*
 * -----------------------
 *       RUN CODE
 * -----------------------
 */
(async () => {
  // await getAllData(); // Ensure both exports work
  await getRecentData();
})();
