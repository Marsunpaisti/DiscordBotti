exports.init = async client => {
	client.on("message", async message => {
		//Ignore all bots messages
		if (message.author.bot) return;

		//Grab guild settings where message was sent
		const settings = client.getGuildSettings(message.guild);
		message.settings = settings;

		//Check if the bot was "mentioned", with no message -> return prefix
		const prefixMention = new RegExp(`^<@!?${client.user.id}>( |)$`);
		if (message.content.match(prefixMention)) {
			return message.reply(`My prefix on this server is \`${settings.prefix}\``);
		}

		//Ignore messages that dont start with the set prefix
		if (message.content.indexOf(settings.prefix) !== 0) return;

		const args = message.content
			.slice(settings.prefix.length)
			.trim()
			.split(/ +/g);

		//Take command from args and remove it from args
		const command = args.shift().toLowerCase();

		// If the member on a guild is invisible or not cached, fetch them.
		if (message.guild && !message.member) await message.guild.fetchMember(message.author);

		//TODO CHECK PERMISSION LEVELS

		//Check if a module exists for command
		const moduleName = client.commands.get(command);
		if (!moduleName) return;
		const commandModule = client.modules.get(moduleName);
		if (!commandModule) return;

		//Check if the command is meant for servers only (not private messages)
		if (command && commandModule && !message.guild && !commandModule.config.allowPrivateMessages) {
			return message.channel.send(
				"This command is unavailable via a private message. Please run this command in a server!"
			);
		}

		//Get flags such as -verbose -save etc from arguments
		message.flags = [];
		while (args[0] && args[0][0] === "-") {
			message.flags.push(args.shift().slice(1));
		}

		client.logger.cmd(
			`[CMD] ${message.author.username} (${message.author.id}) ran module ${commandModule.info.name} via command "${message.content}"`
		);
		commandModule.run(client, message, command, args);
	});
};

exports.run = async (client, message, command, args) => {};

exports.config = {
	enabled: true,
	commands: [""]
};

exports.info = {
	name: "Message event handler",
	category: "System",
	description: 'Does stuff when the client gets the "message" event',
	usage: "Automatic"
};
