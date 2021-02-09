// Imports
if(process.env.NODE_ENV !== 'production'){
	require('dotenv').config()
}
const express = require('express')
const expressLayouts = require('express-ejs-layouts')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
// Import Routes
const indexWebRoutes = require('./routes/web/index');
const paymentWebRoutes = require('./routes/web/payments');

// Create an instance of express app
const app = express()
// Set port
const port = process.env.PORT || '3000'

// Configure folders containing static files
app.use(express.static('public'));
app.use('/images', express.static(__dirname + 'public/images'));

// Configure Template Engine
app.use(expressLayouts)
app.set('layout', './layouts/default')
app.set('view engine', 'ejs')

// Configure bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended:true
}));

// Connect to MongoDB
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
const db = mongoose.connection
db.on('error', (error) => console.error(error))
db.once('open', () => console.log('[STATUS] Connected to Database'))

// Web Routes
app.use('/', indexWebRoutes);
app.use('/payment', paymentWebRoutes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use(function(err, req, res, next) {
	// render the error page
	res.status(err.status || 500);
	res.render('pages/error', {
		title: err.status,
		status: err.status,
		message: err.message
	});
});

// Listen app on given port
app.listen(port, () => {
	console.info(`[STATUS] App listening on port ${port}`)
})