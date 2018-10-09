global.fetch = require('isomorphic-fetch');
global.navigator = { };

var express = require('express');
const config = require('../config.json');
var router = express.Router();
const cognito = require ('amazon-cognito-identity-js');



const getPasswordErrors = (req, source)=>{
	if (source == 'sign-up'){
		req.check('email', 'Invalid Email').isEmail();
	}
	req.check('password','Password must be at least 8 chars long').isLength({min: 8});
	req.check('password','Password does not match').equals(req.body['confirm_password']);
	req.check('password','Password does not contain special character').matches(/[$*.{}()?"!@#%&%/,><':;|_~`]/);
	req.check('password','Password does not contain number').matches(/[0-9]/);
	req.check('password','Password does not lower case').matches(/[a-z]/);
	req.check('password','Password does not upper case').matches(/[A-Z]/);
	
	return req.validationErrors();
}


const poolData = {
	UserPoolId: config.amazon.UserPoolId,
	ClientId : config.amazon.ClientId
}

const userPool = new cognito.CognitoUserPool(poolData);

router.get('/signup', function(req, res) {
	res.redirect('index.html');
});


router.post('/signup', function(req, res) {
	const errors = getPasswordErrors(req, 'sign-up');
	req.session['sign-up-errors']=[];
	
	if(errors){
		for(let error of errors){
			req.session['sign-up-errors'].push(error.msg);
		}
		console.log(req.session['sign-up-errors']);
		return res.redirect('/signup');
	}
	
	const email = req.body.email;
	const pass = req.body.pass;
	const confirm_pass = req.body.confirm_pass;

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

	req.session['log-in-errors'] = [];
	const cognitoUser = new cognito.CognitoUser(userDetails);
	//Password1!
	
	cognitoUser.authenticateUser(authDetails, {
		onSuccess: function(data) {
			req.session.sub = data.getIdToken().decodePayload().sub;
			//res.status(200).json(data);
			return res.redirect('/loggedIn.html');

		}, //end success
		onFailure: function (err) {
			console.log(err.code);
			res.status(200).json(err);
		}//end failure
	})//end auth user
	

});

router.post('/change-password', (req, res)=>{
	if(!req.session.sub){
		return res.redirect('/login');
	}

	const errors = getPasswordErrors(req);
	req.session['change-password-errors'] = []

	if(errors){
		for(let error of errors){
			req.session['change-password-errors'].push(error.msg);
		}
		console.log(req.session['change-password-errors']);
		return res.redirect('/loggedIn.html');
	}

	const userDetails = {Username: req.session.sub, Pool: userPool}
	const cognitoUser = new cognito.CognitoUser(userDetails);

	cognitoUser.getSession((err, session)=>{
		if(err || !session.isValid){
			console.error(err.msg || JSON.stringify(err));
			return res.redirect('/login');
		}
		cognitoUser.changePassword(req.body['old-password'], req.body.password, (err, data)=>{
			if(err){
				console.error(err.msg || JSON.stringify(err));
				return res.redirect('/login');
			}
			res.status(200).json(data);
		})

	})


})



module.exports = router;
