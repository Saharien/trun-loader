const CREDENTIALS = require('./credentials');
const convertData = require('./convertData');

const scraperObject = {

    url: 'https://www.strava.com/clubs/812233/recent_activity',

    async scraper(browser) {
        let page = await browser.newPage();
        console.log(`Navigating to ${this.url}...`);
        await page.goto(this.url);

        // Wait for the required DOM to be rendered
        await page.waitForSelector('.btn-accept-cookie-banner');
        await page.click('.btn-accept-cookie-banner');

        await page.waitForSelector('#email');
        await page.type('#email', CREDENTIALS.username);
        await page.type('#password', CREDENTIALS.password);
        await page.click('#login-button');

        await page.waitForSelector('.branding-content');

        for (let j = 0; j < 2; j++) {   // unbedingt wieder auf 5 umbiegen!!!!!!

            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await page.waitForTimeout(3000);
        }

        let feed = await page.$$eval('.feed-container .activity', activities => {
            
            function extractData(el) {
              
                var distance = '0 km';
                try {
                  if( el.querySelector('li[title="Distanz"]')!=null ) distance = el.querySelector('li[title="Distanz"]').textContent;
                } catch(err) {}
                                
                var line = {
                    'url'  : el.querySelector('a').href,
                    'timestamp': el.querySelector('.timestamp').getAttribute("datetime"),
                    'name': el.querySelector('.entry-athlete').textContent,
                    'distance': distance
                };
              
                return line;
            }

            activities = activities.map(extractData);
           
            return activities;
        });
        
        feed = feed.map(convertData.convertData);


        
        console.log(feed);

    }
}
module.exports = scraperObject;