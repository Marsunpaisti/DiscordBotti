exports.init = null;

exports.run = async (client, message, command, args) => {
	let moduleName = args[0];
	if (!moduleName) {
		msgString = "";

		client.logger.debug(client.modules.keyArray());
		for (let key of client.modules.keyArray()) {
			let iterModule = client.modules.get(key);
			if (iterModule.info.category === "Event") continue;
			msgString += `**${iterModule.info.name}**\n`;
			msgString += iterModule.info.description + "\n";
		}
		return message.channel.send(msgString);
	} else {
		moduleName = moduleName.toLowerCase();
		let searchKey = client.modules.keyArray().find(mod => mod.toLowerCase() === moduleName);
		client.logger.debug("Search with: " + searchKey);
		if (!searchKey) return message.channel.send("Failed to find module!");
		let searchModule = client.modules.get(searchKey);
		if (!searchModule || searchModule.info.category === "Event") return message.channel.send("Failed to find module!");
		let msgString = "**" + searchModule.info.name + "**\n";
		msgString += searchModule.info.description + "\n";
		msgString += "Commands: " + searchModule.config.commands.join(" ") + "\n";
		msgString += "Usage: " + searchModule.info.usage + "\n";
		return message.channel.send(msgString);
	}
};

exports.config = {
	enabled: true,
	commands: ["help", "h", "halp"],
	allowPrivateMessages: true
};

exports.info = {
	name: "Help",
	category: "System",
	description: "Informs the user about possible commands",
	usage: "**help** to get information about available modules\n**help** [module] to get details on a certain module"
};
