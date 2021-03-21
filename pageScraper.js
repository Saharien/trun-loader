const CREDENTIALS = require('./credentials');

const scraperObject = {
    url: 'https://www.strava.com/clubs/812233/recent_activity',
    
    async scraper(browser){
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
        
        for (let j = 0; j < 5; j++) {                          // TODO Unbedingt wieder auf 5 erhöhen!!!!!!!!!!!!!
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await page.waitForTimeout(3000);
        }

        let feed = await page.$$eval('.feed-container .activity', activities => {
            // Extract the links from the data
            //const map1 = array1.map(x => [x * 2, x]);
            //activities = activities.map(el => el.querySelector('a').href)
            //activities = activities.map(el => el.querySelector('.timestamp').getAttribute("datetime"));
            //activities = activities.map(el => el.querySelector('.entry-athlete').textContent);
            //activities = activities.map(el => el.querySelector('li[title]').textContent);
            try {
              activities = activities.map(el => { if(el.querySelector('li[title="Distanz"]')!=null) {return (el.querySelector('li[title="Distanz"]').textContent)} else { return '0 km';} });
            } catch(err) {}

            return activities;
        });

        console.log(feed);
    }
}

module.exports = scraperObject;