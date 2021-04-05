const { scrapeTBike } = require('./pageScraper');
const pageScraper = require('./pageScraper');

async function scrapeAll(browserInstance) {
    let browser;
    try {
        browser = await browserInstance;
        console.log('Start scraping (' + new Date() + ')');
        await pageScraper.scraper(browser);
        await pageScraper.scrapeTBike(browser);
    }
    catch (err) {
        console.log("Could not resolve the browser instance => ", err);
    }
    finally {
        browser.close();
    }
}

module.exports = (browserInstance) => scrapeAll(browserInstance)