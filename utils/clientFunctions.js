module.exports = client => {
	client.loadModule = async (client, moduleFile) => {
		try {
			client.logger.log(`Loading module: ${moduleFile}`);
			const props = require(`../modules/${moduleFile}`);
			if (props.init) {
				await props.init(client);
			}

			client.modules.set(props.info.name, props);
			props.config.commands.forEach(cmd => {
				cmd = cmd.toLowerCase();
				client.commands.set(cmd, props.info.name);
			});
			return false;
		} catch (e) {
			return `Unable to load module ${moduleFile}: ${e}`;
		}
	};

	// getGuildSettings merges the client defaults with the guild settings. Guild settings in
	// enmap should only have *unique* overrides that are different from defaults.
	client.getGuildSettings = guild => {
		client.settings.ensure("default", client.config.defaultSettings);
		if (!guild) return client.settings.get("default");
		const guildConf = client.settings.get(guild.id) || {};
		return { ...client.settings.get("default"), ...guildConf };
	};
};
