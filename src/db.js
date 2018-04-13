const mongoose = require('mongoose');
const URLSlugs = require('mongoose-url-slugs');
const config = require('./config.js');

// user schema, changes TBD depending on implementation of passport auth
const UserSchema = new mongoose.Schema({
	username: String,
	email: String,
    password: {type: String, unique: true, required: true}
});

//trade schema
const TradeSchema = new mongoose.Schema({
	_user: {type: mongoose.Schema.Types.ObjectId,
			ref: 'User'},
    ticker: String,
    slug: String,
	priceAtCreation: Number,
	action: String,
	confidence: String,
	description: String,
	comments: [
		{
			_user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
			content: String,
			time: { type: Date, default: Date.now }
		}
	],
	time: { type: Date, default: Date.now }
});

mongoose.model('User', UserSchema);
mongoose.model('Trade', TradeSchema);

// Connect to DB
if (config.get('env') === 'production'){
	mongoose.connect(`mongodb://${config.get('db.user')}:${config.get('db.pwd')}@${config.get('db.host')}/${config.get('db.name')}`);
}
//no auth in development
else {
	mongoose.connect(`mongodb://${config.get('db.host')}/${config.get('db.name')}`);
}
