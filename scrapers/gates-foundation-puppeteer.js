const puppeteer = require('puppeteer');

// Google Doc Spreadsheet for Jack Dorsey's Start Small Foundation
const scrapeUrl = "https://www.gatesfoundation.org/How-We-Work/Quick-Links/Grants-Database";

const getRecordsOnPage = async (page) => {
  return await page.evaluate(() => {
    const rowSelector = ".results-wrap tbody tr";
    const rowList = document.querySelectorAll(rowSelector);

    const returnRecordArray = [];
    for (let i = 0; i < rowList.length; i++) {
      const recordRow = rowList[i];

      const columns = recordRow.querySelectorAll('td');

      const recordData = {
        url: ``,
        name: `${columns[0].innerText} - ${columns[2].innerText}`,
        amount: parseInt(columns[4].innerText.replace('$','').replace(',',''), 10)
      };
      returnRecordArray.push(recordData);
    }

    return returnRecordArray;
  });
};

const nextPage = async (page) => {
  console.log('clicking');
  await page.click('a.next_link');
  console.log('clicked');
  await page.waitForSelector(rowSelector);
  console.log('waited for selector');
};

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 250
  });
  const page = await browser.newPage();

  await page.goto(scrapeUrl, { waitUntil: 'load' });

  console.log('loading records...');

  const rowSelector = ".results-wrap tbody tr";

  await page.waitForSelector(rowSelector);

  // Get recordsOnPage
  const records = await getRecordsOnPage(page);

  console.log(records);

  await nextPage(page);

  const nextRecords = await getRecordsOnPage(page);

  console.log('records page 2', nextRecords);

  await browser.close();
})();
