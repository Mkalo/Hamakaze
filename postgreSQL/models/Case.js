const Sequelize = require('sequelize');

const Database = require('../postgreSQL');

const database = new Database();

let Case = database.db.define('case', {
	caseNumber: { type: Sequelize.INTEGER },
	action: { type: Sequelize.STRING },
	targetID: { type: Sequelize.STRING },
	targetName: { type: Sequelize.STRING },
	guildID: { type: Sequelize.STRING },
	guildName: { type: Sequelize.STRING },
	reason: {
		type: Sequelize.STRING,
		defaultValue: 'Placeholder'
	},
	moderatorID: {
		type: Sequelize.STRING,
		defaultValue: 'Placeholder'
	},
	moderatorName: {
		type: Sequelize.STRING,
		defaultValue: 'Placeholder'
	},
	messageID: {
		type: Sequelize.STRING,
		defaultValue: 'Placeholder'
	}
});

Case.sync();

module.exports = Case;
