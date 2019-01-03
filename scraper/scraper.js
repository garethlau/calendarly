const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

module.exports = { scraper };

async function scraper(username, password) {

	const loginUrl = 'https://draftmyschedule.uwo.ca/login.cfm';

	try {
		const browser = await puppeteer.launch({
			headless: true, // set this to false for troubleshooting
			args: ['--no-sandbox', '--disable-setuid-sandbox']
		});
		const page = await browser.newPage();
		await page.goto(loginUrl);

		// username
		await page.focus('.form-control');
		await page.keyboard.type(username);

		// password
		await page.keyboard.press('Tab');
		await page.keyboard.type(password);

		// sign in
		await page.click('.btn-primary');

		// wait for page to load
		await page.waitForSelector('.text-danger');

		// agree
		await page.click('#agreement');
		await page.click('.btn-primary');


		// wait for page to load
		await page.waitForSelector('.navbar');

		// current schedule
		const elementHandle = await page.$('a[href="/secure/current_timetable.cfm"]');
		elementHandle.click();

		// wait for the table to load
		await page.waitForSelector('.class_text_font');

		// get class info
		const html = await page.content();

		// engage cheerio
		const $ = cheerio.load(html);

		// find classes and collect each classes data
		let data = await $('.class_box_border').map(function () {
			return $(this).data('content');
		}).get();

		//console.log(data);
		return(data);

	} catch (e) {
		console.log('our error: ', e);
		return(e);
	}
}