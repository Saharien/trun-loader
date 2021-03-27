const CREDENTIALS = require('./credentials');
const convertData = require('./convertData');
const mongoose = require('mongoose');
const Run = require('./models/runs');

function upsertRun(runObj) {

    const DB_URL = 'mongodb://localhost/trun';

    if (mongoose.connection.readyState == 0) {
        mongoose.connect(DB_URL);
    }

    // if the run already exists, update the entry, don't insert
    const conditions = { url: runObj.url, timestamp: runObj.timestamp };
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };

    Run.findOneAndUpdate(conditions, runObj, options, (err, result) => {
        if (err) throw err;
    });
}

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

        for (let j = 0; j < 5; j++) {   // TODO unbedingt wieder auf 5 umbiegen!!!!!!

            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await page.waitForTimeout(3000);
        }

        // Normale Einträge
        let feed1 = await page.$$eval('.feed-container .activity', activities => {

            function extractData(el) {

                var distance = '0 km';
                try {
                    if (el.querySelector('li[title="Distanz"]') != null) distance = el.querySelector('li[title="Distanz"]').textContent;
                } catch (err) { }

                var line = {
                    'url': el.querySelector('a').href,
                    'timestamp': el.querySelector('.timestamp').getAttribute("datetime"),
                    'name': el.querySelector('.entry-athlete').textContent,
                    'distance': distance
                };

                return line;
            }

            activities = activities.map(extractData);

            return activities;
        });

        // Verschachtelte Einträge (wenn mehrere Leute zusammen laufen)
        let feed2 = await page.$$eval('.group-activity', activities => {

            function extractData(el) {

                var group = {
                    'timestamp': el.querySelector('.timestamp').getAttribute("datetime"),
                    'name': el.querySelectorAll('.entry-athlete'),
                    'distance': el.querySelectorAll('li[title="Distanz"]')
                };

                let lines = new Array();

                let index = 0;
                for (index = 0; index < group.name.length; index++) {

                    let distance = '0 km';
                    try {
                        if (group.distance[index] != null) distance = el.querySelector('li[title="Distanz"]').textContent;
                    } catch (err) { }

                    let line = {
                        'url': group.name[index].href,
                        'timestamp': group.timestamp,
                        'name': group.name[index].textContent,
                        'distance': distance
                    };

                    lines.push(line);

                };

                return lines;
            }

            activities = activities.flatMap(extractData);

            return activities;
        });

        var feed = feed1.concat(feed2);

        feed = feed.map(convertData.convertData);

        // mongoose.connect('mongodb://localhost/trun', { useNewUrlParser: true, useUnifiedTopology: true });

        // feed.map(function (entry) {
        //     upsertRun({
        //         url: entry.url,
        //         timestamp: entry.timestamp,
        //         name: entry.name,
        //         distance: entry.distance,
        //         date: entry.date
        //     });
        // });

        // ToDo: https://stackoverflow.com/questions/8813838/properly-close-mongooses-connection-once-youre-done (vll. mit await einbauen?)

        console.log(feed);

    }
}
module.exports = scraperObject;