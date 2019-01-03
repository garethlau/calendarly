const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const {google} = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

// session dependencies
const uuid = require('uuid/v4');
const session = require('express-session');
const FileStore = require('session-file-store')(session);

// google api keys
const keys = require('./config/keys');

// import scraper and creator stuff
const creator = require('./scraper/creator');
const scraper = require('./scraper/scraper.js');
const formatter = require('./scraper/formatter.js');

// initialize express app
const app = express();

// google oauth strategy
passport.use(
	new GoogleStrategy({
		clientID: keys.googleClientID,
		clientSecret: keys.googleClientSecret,
		callbackURL: '/auth/google/callback',
		proxy: true
	}, () => {
		console.log();
	})
);

// configure app and add middleware
app.use(session({
	genid: (req) => {
		console.log('inside the session middleware');
		console.log(req.sessionID);
		return uuid();
	},
	store: new FileStore(),
	unset: 'destroy',
	secret: keys.cookieKey,
	saveUninitialized: true,
	resave: false,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// form
app.get('/form', (req, res) => {
	res.sendFile('./views/form.html', {root: __dirname });
});

// form submit route
app.post('/submit', (req, res) => {
	req.session.username = req.body.username;
	req.session.password = req.body.password;
	req.session.calID = req.body.calID;
	res.sendFile('./views/submit.html', {root: __dirname});
});

// homepage
app.get('/', (req, res) => {
	console.log('inside the homepage callback function');
	console.log(req.sessionID);
	res.sendFile('./views/home.html', {root: __dirname});
});

// google oauth route
app.get('/auth/google',
	passport.authenticate('google', {
		scope: ['https://www.googleapis.com/auth/calendar']
}));

// handle callback after authentication
// url has code
app.get('/auth/google/callback', (req, res) => {
	let code = req.query.code;
	main(code, req).then( (data) => {
		console.log(data);
		res.redirect('/');
	}).catch( (error) => {
		console.log('error: ' + error);
	});
});

// create oauth client to so we can use the getToken() method
function getOAuthClient() {
	return new OAuth2(keys.googleClientID, keys.googleClientSecret, 'https://infinite-depths-50373.herokuapp.com/auth/google/callback')
}
// callback for heroku: https://infinite-depths-50373.herokuapp.com/auth/google/callback
// callback for localhost: http://localhost:5000/auth/google/callback

// scrape student calendar and interaction with google calendar is in this function
async function main(urlCode, req) {
	let oauth2client = getOAuthClient();
	let code = urlCode;

	const {tokens} = await oauth2client.getToken(code);
	oauth2client.setCredentials(tokens);
	/*
	await oauth2client.getToken(code, (err, tokens) => {

		console.log(tokens);
        // now tokens contains an access_token and an optional refresh_token
		// save the tokens (???) no need to save the token if we use it right after in the following
		// functions but it might be better to save it later once we move functions to separate files

		// access token is needed to make future requests to calendar API
		const token = tokens.access_token;
		req.accessToken = tokens.access_token;
		console.log('the access token is: ' + req.accessToken);
		if (!err) {
			oauth2client.setCredentials(tokens);
			console.log('login success');
			return(token);
		}
		else {
			console.log('login failed');
			return(null);
		}

	});*/
	console.log('finished getting access token: ' + tokens.access_token);
	const calEntries = await creator.creator(req.session.username, req.session.password);
	console.log('cal entries are: ');

	const calId = req.session.calID;
	const baseUrl = 'https://www.googleapis.com/calendar/v3';
	const method1 = '/calendars/';
	const method2 = '/events';
	const url = baseUrl + method1 + calId + method2 + '?access_token=' + tokens.access_token;

	// call the google api and create events
	for (let i = 0; i < calEntries.length; i++) {
/*		console.log('cal entry' + i);
		console.log(calEntries[i]);*/
		await fetch(url, {
			method: 'POST',
			body: calEntries[i],
	        headers: { 'Content-Type': 'application/json' },
		})
			.then( (res) => {
				console.log('just finished fetch');
				console.log(res);
			}).catch( (err) => {
				console.log('error trying to fetch');
				console.log(err);
		});
	}
	return ('finished');
}

function addEvents(urlCode, req) {
	let oauth2client = getOAuthClient();
	let code = urlCode;
	let accessToken;

	oauth2client.getToken(code, (err, tokens) => {
		// access token is needed to make future requests to calendar API
		accessToken = tokens.access_token;
		req.session.accessToken = tokens.access_token;
		oauth2client.setCredentials(tokens);

		scraper.scraper(req.session.username, req.session.password).then((data) => {
			const events = formatter.formatter(data);

			const calId = req.session.calID;
			const baseUrl = 'https://www.googleapis.com/calendar/v3';
			const method1 = '/calendars/';
			const method2 = '/events';
			const url = baseUrl + method1 + calId + method2 + '?access_token=' + req.session.accessToken;

			for (let i = 0; i < events.length; i++) {
				console.log('cal entry: ' + i);
				fetch(url, {
					method: 'POST',
					body: events[i],
					headers: {'Content-Type': 'application/json'},
				})
			}
		});
		console.log('scraper and formatter finished');

	});
}

// listen to traffic on PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log("server on port: " + PORT);
});


