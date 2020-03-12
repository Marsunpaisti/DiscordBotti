const Enmap = require("enmap");
const axios = require("axios");
const schedule = require("node-schedule");
const betDatabase = new Enmap({ name: "coronaBetDatabase" });
const channelDatabase = new Enmap({ name: "coronaReportingChannels" });
const scoreDatabase = new Enmap({ name: "coronaBettingScoreDatabase" });

const addBet = async (client, message, bet) => {
	let serverDatabase = betDatabase.get(message.guild.id);
	if (serverDatabase === undefined) {
		client.logger.log(`Creating corona bet database for server ${message.guild.name} (${message.guild.id})`);
		serverDatabase = {};
	} else {
		client.logger.log(`Found corona bet database for server ${message.guild.name} (${message.guild.id})`);
	}

	const tomorrowDate = new Date();
	tomorrowDate.setDate(tomorrowDate.getDate() + 1);

	const dateString = tomorrowDate.getDate() + "." + (tomorrowDate.getMonth() + 1) + "." + tomorrowDate.getFullYear();
	const betObject = {
		username: message.author.username,
		userId: message.author.id,
		bet: bet,
		date: new Date().toJSON()
	};

	if (!(dateString in serverDatabase)) {
		serverDatabase[dateString] = {};
	}

	//Check if bet was updated or if it was just added
	let actionString = "Added";
	if (message.author.id in serverDatabase[dateString]) actionString = "Updated";
	serverDatabase[dateString][message.author.id] = betObject;

	client.logger.log(`Added corona bet \n${JSON.stringify(betObject)} at date ${dateString} to database`);
	client.logger.debug(`${JSON.stringify(serverDatabase)}`);

	//Save db
	betDatabase.set(message.guild.id, serverDatabase);

	return message.reply(`${actionString} your bet to ${bet} corona cases tomorrow (${dateString})!`);
};

const getCurrentBets = async (client, message) => {
	let serverDatabase = betDatabase.get(message.guild.id);
	if (!serverDatabase) return message.channel.send(`No bets at the moment`);

	const date = new Date();
	const todayDateString = date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear();
	date.setDate(date.getDate() + 1);
	const tomorrowDateString = date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear();

	const todaysBets = serverDatabase[todayDateString];
	let messageString = "";
	if (todaysBets) {
		messageString += "Bets for today:\n";
		for (let key in todaysBets) {
			let bet = todaysBets[key];
			let userName = (await client.users.fetch(bet.userId).username) || bet.username;
			messageString += userName + " is betting for:\t\t\t" + bet.bet + " cases\n";
		}
	} else {
		messageString += "No bets for today\n";
	}

	const tomorrowBets = serverDatabase[tomorrowDateString];
	if (tomorrowBets) {
		messageString += "------------------------------------------------------------\n";
		messageString += "Bets for tomorrow:\n";
		for (let key in tomorrowBets) {
			let bet = tomorrowBets[key];
			let userName = (await client.users.fetch(bet.userId).username) || bet.username;
			messageString += userName + " is betting for:\t\t\t" + bet.bet + " cases\n";
		}
	}
	messageString += "------------------------------------------------------------\n";

	return message.channel.send(messageString);
};

const checkWinners = async client => {
	let coronaData = null;
	for (let attempt = 1; attempt <= 10; attempt++) {
		try {
			let response = await axios.get("https://w3qa5ydb4l.execute-api.eu-west-1.amazonaws.com/prod/finnishCoronaData");
			coronaData = await response.data;
		} catch (e) {
			client.logger.error(`Error getting corona data during attempt ${attempt}: ${e}`);
		}
		if (coronaData) break;
		if (attempt <= 10) {
			client.logger.log(`Retrying in 5 seconds.`);
			await new Promise(resolve => setTimeout(resolve, 5000));
		}
	}

	const totalCases = coronaData.confirmed.length;

	let guildIds = betDatabase.keyArray();
	guildIds.forEach(guildId => {
		checkWinnersForGuild(client, guildId, totalCases);
	});
};

const checkWinnersForGuild = async (client, guildId, totalCases) => {
	//Check bets
	let serverDatabase = betDatabase.get(guildId);
	if (!serverDatabase) return;

	const date = new Date();
	date.setDate(date.getDate() + 1);
	const todayDateString = date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear();

	const todaysBets = serverDatabase[todayDateString];
	if (!todaysBets) return;

	let guessDifferences = {};
	for (let key in todaysBets) {
		let bet = todaysBets[key];
		let difference = Math.abs(totalCases - bet.bet);
		if (!(difference in guessDifferences)) guessDifferences[difference] = [];
		guessDifferences[difference].push(bet);
	}

	let sortedKeys = Object.keys(guessDifferences).sort();
	let message = "Current corona total: " + totalCases + " confirmed cases\n";
	message += "The winners of coronabingo today are:\n";
	let guessesArray = guessDifferences[sortedKeys[0]];
	for (let bet of guessesArray) {
		let username = (await client.users.fetch(bet.userId).username) || bet.username;
		message += `**${username}** won with a bet of ${bet.bet}\n`;
		let prevScore = scoreDatabase.get(bet.userId);
		if (!prevScore) {
			scoreDatabase.set(bet.userId, 1);
		} else {
			scoreDatabase.set(bet.userId, prevScore + 1);
		}
	}
	message += "------------------------------------------------------------\n";
	message += "TOP 5 Guesses:\n";
	let index = 0;
	for (let key of sortedKeys) {
		index += 1;
		guessesArray = guessDifferences[key];
		message += `${index}:`;
		for (let bet of guessesArray) {
			let username = (await client.users.fetch(bet.userId).username) || bet.username;
			message += `**${username}** (${bet.bet}) `;
		}
		message += `\n`;
	}

	message += "------------------------------------------------------------\n";
	let channelId = channelDatabase.get(guildId);
	if (!channelId) return;
	let channel = client.channels.resolve(channelId);
	if (!channel) return;
	channel.send(message);
};

function setChannel(client, message) {
	channelDatabase.set(message.guild.id, message.channel.id);
	client.logger.log(
		`Set channel ${message.channel.name} (${message.channel.id}) as corona betting channel for guild ${message.guild.name} (${message.guild.id})`
	);

	return message.channel.send(`Corona betting winners will now be announced on this channel!`);
}

exports.init = async client => {
	client.logger.log(`\tLoading corona bet database`);
	await betDatabase.defer;
	client.logger.log(`\tCorona bet database loaded`);
	const scheduleRule = new schedule.RecurrenceRule();
	scheduleRule.hour = 18;
	schedule.scheduleJob(scheduleRule, () => {
		checkWinners(client);
	});
};

exports.run = async (client, message, command, args) => {
	if (command == "bet" || command == "addbet" || command == "coronabet") {
		const bet = args[0];
		if (!bet || bet.match(/\D/)) {
			return message.reply(`Usage: ${module.exports.info.usage}`);
		} else if (bet > 999999999 || bet < 0) {
			return message.reply(`Invalid bet amount`);
		}
		addBet(client, message, bet);
	} else if (command == "getbets" || command == "currentbets" || command == "bets") {
		getCurrentBets(client, message);
	} else if (command == "setbettingchannel" || command == "setcoronachannel") {
		setChannel(client, message);
	}
};

exports.config = {
	enabled: true,
	commands: [
		"addbet",
		"bet",
		"coronabet",
		"cases",
		"getbets",
		"currentbets",
		"bets",
		"setbettingchannel",
		"setcoronachannel"
	],
	allowPrivateMessages: false
};

exports.info = {
	name: "Betting",
	category: "Fun",
	description: "Lets users bet for coronavirus cases for the next day, keeping score",
	usage:
		"\n**bet** [numberOfCases] to bet\n**bets** to get current bets\n**cases** to get current statistics on coronavirus\n**setbettingchannel** to set the current channel for winner reporting"
};