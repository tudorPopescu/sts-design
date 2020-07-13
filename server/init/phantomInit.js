(function () {
	'use strict';
	const phantom = require('phantom');

	exports.createPhantomSession = function (app) {
		if (app.locals.ph) {
			return Promise.resolve(app.locals.ph);
		} else {
			return phantom.create([], {
				dnodeOpts: {weak: false},
				parameters: {'web-security': 'no'}
			});
		}
	};

})();