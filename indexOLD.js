const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const {google} = require('googleapis');
const OAuth2 = google.auth.OAuth2;

// these are only used for session stuff
// delete if not needed later
const uuid = require('uuid/v4');
const session = require('express-session');
const FileStore = require('session-file-store')(session);

const keys = require('./config/keys');
const fetch = require('node-fetch');

// import test event
const testEvent = require('./sampleEvent.js');

// initialize express app
const app = express();

// create oauth client to so we can use the getToken() method
function getOAuthClient() {
	return new OAuth2(keys.googleClientID, keys.googleClientSecret, 'http://localhost:5000/auth/google/callback')
}

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
	secret: 'eigjqiegjesg',
	resave: false,
	saveUninitialized: true,
}));

// test route
app.get('/test', (req, res) => {
	console.log(req.sessionID);
	res.send('test page');
});



// homepage
app.get('/', (req, res) => {
	console.log('inside the homepage callback function');
	console.log(req.sessionID);
	res.send('ur at homepage');
});

// google oauth route
app.get('/auth/google',
	passport.authenticate('google', {
		scope: ['https://www.googleapis.com/auth/calendar']
}));

// handle callback after authentication
// url has code
app.get('/auth/google/callback', (req, res) => {
	let oauth2client = getOAuthClient();
	let code = req.query.code;
	oauth2client.getToken(code, (err, tokens) => {

		console.log(tokens);
        // now tokens contains an access_token and an optional refresh_token
		// save the tokens (???) no need to save the token if we use it right after in the following
		// functions but it might be better to save it later once we move functions to separate files

		// access token is needed to make future requests to calendar API
		const accessToken = tokens.access_token;

		if (!err) {
			oauth2client.setCredentials(tokens);
			console.log('login success');

			// view all events in calId
			const calId = 'j0cjhiak8gbcm8ijt29g25p22s@group.calendar.google.com';
			const baseUrl = 'https://www.googleapis.com/calendar/v3';
			const method1 = '/calendars/';
			const method2 = '/events';
			const url = baseUrl + method1 + calId + method2 + '?access_token=' + accessToken;

			// create new event in calId
			fetch(url, {
				method: 'POST',
				body: JSON.stringify(testEvent),
		        headers: { 'Content-Type': 'application/json' },
			})
				.then(res => res.json())
				.then(json => console.log(json));

			// see events in calId
			fetch(url)
				.then(res => res.json())
				.then(json => console.log(json));


		}
		else {
			console.log('login failed');
		}
	});
	}
);

// listen to traffic on PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log("server on port: " + PORT);
});
