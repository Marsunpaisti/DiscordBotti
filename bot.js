if (Number(process.version.slice(1).split(".")[0]) < 8)
	throw new Error("Node 8.0.0 or higher is required. Update Node on your system.");

const Enmap = require("enmap");
const Discord = require("discord.js");
const Fs = require("fs").promises;

//Setup client
const client = new Discord.Client();
client.logger = require("./utils/logger");
client.config = require("./config");
client.modules = new Enmap();
client.commands = new Enmap();
client.settings = new Enmap({ name: "settings" });
client.settings.ensure("default", client.config.defaultSettings);

//Add some utility functions to client
require("./utils/clientFunctions")(client);
const init = async () => {
	await loadModules();
	client.login(client.config.token);
};

const loadModules = async () => {
	const moduleFiles = await Fs.readdir("./modules/");
	client.logger.log(`Loading a total of ${moduleFiles.length} modules`);
	for (let moduleFile of moduleFiles) {
		if (!moduleFile.endsWith(".js")) return;
		const errorMessage = await client.loadModule(client, moduleFile);
		if (errorMessage) client.logger.error(errorMessage);
	}
};

init();
