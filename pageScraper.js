const CREDENTIALS = require('./credentials');
const convertData = require('./convertData');
const mongoose = require('mongoose');

const Run = require('./models/runs');
const Biking = require('./models/bikings');

function upsertRun(runObj) {

    if (mongoose.connection.readyState == 0) {
        mongoose.connect(CREDENTIALS.DB_URL);
    }

    // Make Mongoose use `findOneAndUpdate()`. Note that this option is `true`
    // by default, you need to set it to false.
    mongoose.set('useFindAndModify', false);

    // if the run already exists, update the entry, don't insert
    const conditions = { url: runObj.url, timestamp: runObj.timestamp };
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };

    Run.findOneAndUpdate(conditions, runObj, options, (err, result) => {
        if (err) throw err;
    });
}


function upsertBiking(bikingObj) {

    if (mongoose.connection.readyState == 0) {
        mongoose.connect(CREDENTIALS.dburl, { useNewUrlParser: true, useUnifiedTopology: true, user: CREDENTIALS.dbuser, pass: CREDENTIALS.dbpass, authSource: 'admin' });
    }

    // Make Mongoose use `findOneAndUpdate()`. Note that this option is `true`
    // by default, you need to set it to false.
    mongoose.set('useFindAndModify', false);

    // if the run already exists, update the entry, don't insert
    const conditions = { url: bikingObj.url, timestamp: bikingObj.timestamp };
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };

    Biking.findOneAndUpdate(conditions, bikingObj, options, (err, result) => {
        if (err) throw err;
    });
}

const scraperObject = {

    // Club Laufen
    urlRun: 'https://www.strava.com/clubs/812233/recent_activity',
    urlBike: 'https://www.strava.com/clubs/613295/recent_activity',

    async scraper(browser) {
        let page = await browser.newPage();
        console.log(`Navigating to ${this.urlRun}...`);
        await page.goto(this.urlRun);

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
                    if (el.querySelector('li[title="Distance"]') != null) distance = el.querySelector('li[title="Distance"]').textContent;
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
                    'distance': el.querySelectorAll('li[title="Distance"]'),
                    'distanz': el.querySelectorAll('li[title="Distanz"]')
                };

                let lines = new Array();

                let index = 0;
                for (index = 0; index < group.name.length; index++) {

                    let distance = '0 km';
                    try {
                        if (group.distance[index] != null) distance = el.querySelector('li[title="Distance"]').textContent;
                        if (group.distanz[index] != null) distance = el.querySelector('li[title="Distanz"]').textContent;
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

        console.log(feed);

        mongoose.connect(CREDENTIALS.dburl, { useNewUrlParser: true, useUnifiedTopology: true, user: CREDENTIALS.dbuser, pass: CREDENTIALS.dbpass, authSource: 'admin' });

        feed.map(function (entry) {
            upsertRun({
                url: entry.url,
                timestamp: entry.timestamp,
                name: entry.name,
                distance: entry.distance,
                date: entry.date
            });
        });

        // Idee zum sauberen Exiten: FOR Schleife über die Läufe, da sauberen findOneAndUpdate über die Läufe mit await (bin eh in einer async fct)
        // und dann db closen

        // ToDo: https://stackoverflow.com/questions/8813838/properly-close-mongooses-connection-once-youre-done (vll. mit await einbauen?)

        //mongoose.disconnect();
        //mongoose.connection.close();
        // mongoose.connection.close(false, () => {
        //     console.log('MongoDb connection closed.');
        // });

    },

    async scrapeTBike(browser) {
        let page = await browser.newPage();
        console.log(`Navigating to ${this.urlBike}...`);
        await page.goto(this.urlBike);

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
                    if (el.querySelector('li[title="Distance"]') != null) distance = el.querySelector('li[title="Distance"]').textContent;
                } catch (err) { }
                
                var elevgain = '0 m';
                try {
                    if (el.querySelector('li[title="Höhenmeter"]') != null) elevgain = el.querySelector('li[title="Höhenmeter"]').textContent;
                    if (el.querySelector('li[title="Elev Gain"]') != null) elevgain = el.querySelector('li[title="Elev Gain"]').textContent;
                } catch (err) { }

                var type = 'ride';
                try {
                    if (el.querySelector('.icon-ebikeride') != null) type = 'ebikeride';
                } catch (err) { }

                var line = {
                    'url': el.querySelector('a').href,
                    'timestamp': el.querySelector('.timestamp').getAttribute("datetime"),
                    'name': el.querySelector('.entry-athlete').textContent,
                    'distance': distance,
                    'elevgain': elevgain,
                    'type': type
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
                    'distanz': el.querySelectorAll('li[title="Distanz"]'),
                    'distance': el.querySelectorAll('li[title="Distance"]'),
                    'hoehenmeter' : el.querySelectorAll('li[title="Höhenmeter"]'),
                    'elevgain' : el.querySelectorAll('li[title="Elev Gain"]'),
                };

                let lines = new Array();

                let index = 0;
                for (index = 0; index < group.name.length; index++) {

                    let distance = '0 km';
                    try {
                        if (group.distanz[index] != null) distance = el.querySelector('li[title="Distanz"]').textContent;
                        if (group.distance[index] != null) distance = el.querySelector('li[title="Distance"]').textContent;
                    } catch (err) { }

                    let elevgain = '0 m';
                    try {
                        if (group.hoehenmeter[index] != null) elevgain = el.querySelector('li[title="Höhenmeter"]').textContent;
                        if (group.elevgain[index] != null) elevgain = el.querySelector('li[title="Elev Gain"]').textContent;
                    } catch (err) { }

                    let type = 'ride';
                    try {
                        if (el.querySelector('.icon-ebikeride') != null) type = 'ebikeride';
                    } catch (err) { }

                    let line = {
                        'url': group.name[index].href,
                        'timestamp': group.timestamp,
                        'name': group.name[index].textContent,
                        'distance': distance,
                        'elevgain': elevgain,
                        'type': type
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

        console.log(feed);

        mongoose.connect(CREDENTIALS.dburl, { useNewUrlParser: true, useUnifiedTopology: true, user: CREDENTIALS.dbuser, pass: CREDENTIALS.dbpass, authSource: 'admin' });

        feed.map(function (entry) {
            upsertBiking({
                url: entry.url,
                timestamp: entry.timestamp,
                name: entry.name,
                distance: entry.distance,
                elevgain: entry.elevgain,
                type: entry.type,
                date: entry.date
            });
        });

        // Idee zum sauberen Exiten: FOR Schleife über die Läufe, da sauberen findOneAndUpdate über die Läufe mit await (bin eh in einer async fct)
        // und dann db closen

        // ToDo: https://stackoverflow.com/questions/8813838/properly-close-mongooses-connection-once-youre-done (vll. mit await einbauen?)

        //mongoose.disconnect();
        //mongoose.connection.close();
        // mongoose.connection.close(false, () => {
        //     console.log('MongoDb connection closed.');
        // });


    }
}
module.exports = scraperObject;