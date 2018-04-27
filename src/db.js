const mongoose = require('mongoose');
const URLSlugs = require('mongoose-url-slugs');
const config   = require('../config/config.js');
const bcrypt   = require('bcrypt-nodejs');

// user schema, changes TBD depending on implementation of passport auth
const UserSchema = new mongoose.Schema({
	local : {
		username: String,
		password: String
	},
});

// generating a hash
UserSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
UserSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

//trade schema
const TradeSchema = new mongoose.Schema({
	_user: {type: mongoose.Schema.Types.ObjectId,
			ref: 'User'},
    ticker: String,
	companyName: String,
	sector: String,
	priceAtCreation: Number,
	currentPrice: Number,
	percentChange: Number, 
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

TradeSchema.plugin(URLSlugs('ticker action priceAtCreation'));

mongoose.model('User', UserSchema);
mongoose.model('Trade', TradeSchema);

// Connect to DB
if (config.get('env') === 'production'){
	mongoose.connect(`mongodb://${config.get('db.user')}:${config.get('db.pwd')}@${config.get('db.host')}/${config.get('db.name')}?authSource=admin`);
}
//no auth in development
else {
	mongoose.connect(`mongodb://${config.get('db.host')}/${config.get('db.name')}`);
}
