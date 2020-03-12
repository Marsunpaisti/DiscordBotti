exports.init = async client => {
	client.on("ready", async () => {
		client.logger.log(
			`${client.user.tag}, ready to serve ${client.users.cache.size} (cached) users in ${client.guilds.cache.size} (cached) servers.`,
			"ready"
		);

		// Make the bot status "playing game" to show the help command on the sidebar
		client.user.setActivity(`Default help: ${client.settings.get("default").prefix}help`, { type: "PLAYING" });
	});
};

exports.run = async (client, message, command, args) => {};

exports.config = {
	enabled: true,
	commands: [""]
};

exports.info = {
	name: "Ready event handler",
	category: "System",
	description: 'Does stuff when the client gets the "ready" event',
	usage: "Automatic"
};
