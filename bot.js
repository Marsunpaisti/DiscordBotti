if (Number(process.version.slice(1).split(".")[0]) < 8)
	throw new Error("Node 8.0.0 or higher is required. Update Node on your system.");

const Enmap = require("enmap");
const Discord = require("discord.js");
const Fs = require("fs").promises;
require("dotenv").config();
const token = process.env.TOKEN;
const client = new Discord.Client();
// non-cached, auto-fetch enmap:
const Database = new Enmap({
	name: "database",
	autoFetch: true,
	fetchAll: true
});

const main = async () => {
	await Database.defer;
};

main();
