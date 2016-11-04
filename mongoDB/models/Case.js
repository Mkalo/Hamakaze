const mongoose = require('mongoose');

const { Schema } = require('../mongoDB');

let CaseSchema = new Schema({
	caseNumber: Number,
	action: String,
	targetID: String,
	targetName: String,
	guildID: String,
	guildName: String,
	reason: { type: String, default: 'Placeholder' },
	userID: { type: String, default: 'Placeholder' },
	userName: { type: String, default: 'Placeholder' },
	messageID: { type: String, default: 'Placeholder' },
	createdAt: { type: Date, default: Date.now }
});
let Case = mongoose.model('Case', CaseSchema);

module.exports = class CaseModel {
	constructor(options = {}) {
		this.case = options;
	}
	static async find(guildID) {
		return Case.find({ guildID: guildID });
	}
	static async get(caseNumber, guildID) {
		return Case.findOne({ caseNumber: caseNumber, guildID: guildID });
	}
	static async getCaseNumber(guildID) {
		return Case.findOne({ guildID: guildID }).sort({ createdAt: -1 });
	}
	static async update(caseNumber, guildID, reason) {
		return Case.findOneAndUpdate({ caseNumber: caseNumber, guildID: guildID }, { reason: reason });
	}
	static async updateReason(caseNumber, guildID, reason, userID, userName) {
		return Case.findOneAndUpdate({ caseNumber: caseNumber, guildID: guildID }, { reason: reason, userID: userID, userName: userName });
	}
	static async messageID(caseNumber, guildID, messageID) {
		return Case.findOneAndUpdate({ caseNumber: caseNumber, guildID: guildID }, { messageID: messageID });
	}
	static async delete(caseNumber, guildID) {
		return Case.findOneAndRemove({ caseNumber: caseNumber, guildID: guildID });
	}
	save() {
		return Case.create(this.case);
	}
};
