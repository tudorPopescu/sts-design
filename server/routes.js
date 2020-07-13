(function () {
	'use strict';

	let errors = require('./errors');

	module.exports = app => {
		/* ----------------------------------------------- CONFIG ----------------------------------------------- */
		app.post('/', require('./utils/jwtInit')(app));
		app.use('/auth', require('./routes/authentication'));
		app.use('/api/refreshToken', require('./utils/refreshToken')(app));
		app.use('/api/user', require('./routes/user')(app));
		app.use('/api/userAction', require('./routes/userAction')(app));
		app.use('/api/userError', require('./routes/userError')(app));
		app.use('/api/userRight', require('./routes/userRight')(app));
		app.use('/api/unit', require('./routes/unit')(app));

		/* ----------------------------------------------- DRAFTS - NOMENCLATURE ----------------------------------------------- */
		app.use('/api/draftCounty', require('./routes/drafts/draftCounty')(app));
		app.use('/api/draftLocality', require('./routes/drafts/draftLocality')(app));
		app.use('/api/draftVillage', require('./routes/drafts/draftVillage')(app));
		/* ----------------------------------------------- DRAFTS - APP ----------------------------------------------- */
		app.use('/api/draftStatus', require('./routes/drafts/draftStatus')(app));

		/* ----------------------------------------------- CONFIG APP ----------------------------------------------- */
		app.use('/api/compartment', require('./routes/compartment')(app));

		/* ----------------------------------------------- APP ----------------------------------------------- */
		app.use('/api/document', require('./routes/document')(app));
		app.use('/api/file', require('./routes/file')(app));
		app.use('/api/startNumber', require('./routes/startNumber')(app));

		/* ----------------------------------------------- DOWNLOAD ----------------------------------------------- */
		app.use('/generate', require('./routes/generate')(app));

		app.get('/app/*', (req, res) => {
			res.render('../../public/app/' + req.params['0']);
		});


		app.route('*/:url(api|auth|components|app|bower_components|assets)/*').get(errors[404]);
		app.route('/').get((req, res) => {
			res.render('login');
		});
		app.route('/:params').get((req, res) => {
			req.body.token = req.params.params;
			req.params = null;
			let loginFromYourApps = require('./utils/loginFromYourApps')(app);
			loginFromYourApps.logIn(req, res);
		});
		app.route('*').get(errors[404]);
	};
}());