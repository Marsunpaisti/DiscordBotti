const Enmap = require("enmap");
const axios = require("axios");
const betDatabase = new Enmap({ name: "coronaBetDatabase" });

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

const getCurrentBets = (client, message) => {
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
			let userName = client.users.fetch(bet.userId).username || bet.username;
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
			let userName = client.users.fetch(bet.userId).username || bet.username;
			messageString += userName + " is betting for:\t\t\t" + bet.bet + " cases\n";
		}
	}
	messageString += "------------------------------------------------------------\n";

	return message.channel.send(messageString);
};

const checkBets = async client => {
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
	client.logger.debug("Total cases: " + totalCases);
};

exports.init = async client => {
	client.logger.log(`\tLoading corona bet database`);
	await betDatabase.defer;
	client.logger.log(`\tCorona bet database loaded`);
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
	} else if (command == "check") {
		checkBets(client);
	}
};

exports.config = {
	enabled: true,
	commands: ["addbet", "bet", "coronabet", "cases", "getbets", "currentbets", "bets", "check"],
	allowPrivateMessages: false
};

exports.info = {
	name: "Betting",
	category: "Fun",
	description: "Lets users bet for coronavirus cases for the next day, keeping score",
	usage: "\nbet [numberOfCases] to bet\nbets to get current bets\ncases to get current statistics on coronavirus"
};
