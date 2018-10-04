global.fetch = require('isomorphic-fetch');
global.navigator = { };

var express = require('express');
const config = require('../config.json');
var router = express.Router();
const cognito = require ('amazon-cognito-identity-js');

const poolData = {
	UserPoolId: config.amazon.UserPoolId,
	ClientId : config.amazon.ClientId
}

const userPool = new cognito.CognitoUserPool(poolData);

router.get('/signup', function(req, res) {
	res.render('index');
});

router.post('/signup', function(req, res) {
	const email = req.body.email;
	const pass = req.body.pass;
	const confirm_pass = req.body.confirm_pass;
	
	if(pass !== confirm_pass){
		return res.redirect('/signup?error=password');
	}

	const emailData = {
		Name: 'email',
		Value: email
	}

	const emailAttributes = new cognito.CognitoUserAttribute(emailData);
	userPool.signUp(email, pass, [emailAttributes], null, (err, data) => {
		if (err){
			return console.error(err);
		}
		res.send(data.user);

	});

});

router.post('/login', function(req, res) {
	const loginDetails = {
		Username : req.body.email,
		Password : req.body.pass
	}
	const authDetails = new cognito.AuthenticationDetails(loginDetails);

	const userDetails = {
		Username : req.body.email,
		Pool : userPool
	}

	const cognitoUser = new cognito.CognitoUser(userDetails);
	//Password1!
	
	cognitoUser.authenticateUser(authDetails, {
		onSuccess: function(data) {
			console.log(data);
			res.status(200).json(data);
		}, //end success
		onFailure: function (err) {
			res.status(200).json(err);
		}//end failure
	})//end auth user
	

});


/*
GET 



*/
router.get('/apiDoc', function(req, res) {
	res.status(200).json([
		{"GET /flyer":" get all flyers"},
		{"GET /flyer/:id ":" get flyer by ID"},
		{"POST /flyer POST":" create flyer in db"},
		{"POST /ticket/:id ":" create new ticket in Blockchain and tie to flyer", payload: {"to":"cgn", "from":"jfk", "date":"2018-08-30T22:49:07.169Z"} },
		
		{"POST /luggage/:id/ticket/:ticket":" - add luggage to trip", payload: {"bag":{"w":1, "h":2, "l":3, "weight":4} }  },

	])

});

router.get('/test', function(req, res) {
	res.status(200).json({'api':'test api'})

});


router.post('/test', function(req, res) {
	res.status(200).json({'api':'test api'})
});



module.exports = router;
