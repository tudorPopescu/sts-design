(function () {
	'use strict';
	const crypto = require('crypto'),
		jwt = require('jsonwebtoken');
	module.exports = {
		createSalt: createSalt,
		hashPwd: hashPwd,
		authenticate: authenticate,
		requireLogin: requireLogin,
		requiresRole: requiresRole,
		requiresRoles: requiresRoles
	};


	function createSalt() {
		return crypto.randomBytes(128).toString('base64');
	}

	function hashPwd(salt, pwd) {
		let hmac = crypto.createHmac('sha1', salt);
		return hmac.update(pwd).digest('hex');
	}

	function authenticate(password, salt, hashed_pwd) {
		return hashPwd(salt, password) === hashed_pwd;
	}

	function requireLogin(req, res, next) {
		let token = req.headers['x-access-token'] || req.body.token || req.params.token;
		if (token) {
			//console.log(token)
			jwt.verify(token, global.config.sKey, function checkToken(err, decoded) {
				if (err) {
					return res.status(403).json({success: false, message: 'Not authorized, no token.'});
				} else {
					req.user = decoded;
					return next();
				}
			});
		} else {
			return res.status(403).send({success: false, message: null});
		}
		return null;
	}

	function requiresRole(role) {
		return function (req, res, next) {
			let token = req.headers['x-access-token'] || req.body.token || req.params.token;
			if (token) {
				jwt.verify(token, global.config.sKey, function checkToken(err, decoded) {
					if (err) {
						return res.status(403).json({success: false, message: 'Not authorized, no token.'});
					} else {
						if (decoded.role === role) {
							req.user = decoded;
							return next();
						} else {
							return res.status(403).json({success: false, message: 'Not authorized role'});
						}
					}
				});
			} else {
				return res.status(403).send({success: false, message: null});
			}
			return null;
		};
	}

	function requiresRoles(roles) {
		return function (req, res, next) {
			let token = req.headers['x-access-token'] || req.body.token || req.params.token;
			if (token) {
				jwt.verify(token, global.config.sKey, function checkToken(err, decoded) {
					if (err) {
						return res.status(403).json({success: false, message: 'Not authorized, no token.'});
					} else {
						if (roles.indexOf(decoded.role) > -1) {
							req.user = decoded;
							return next();
						} else {
							return res.status(403).json({success: false, message: 'Not authorized role'});
						}
					}
				});
			} else {
				return res.status(403).send({success: false, message: null});
			}
			return null;
		};
	}

})();