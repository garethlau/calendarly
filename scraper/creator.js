const scraper = require('./scraper');
const formatter = require('./formatter');

module.exports = { creator };

async function creator(username, password) {
	const returnedData = await scraper.scraper(username, password);
	//console.log(returnedData);
	return formatter.formatter(returnedData);
}