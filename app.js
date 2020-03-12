const Enmap = require("enmap");

// non-cached, auto-fetch enmap:
const db = new Enmap({
	name: "database",
	autoFetch: true,
	fetchAll: true
});

db.defer.then(async () => {
	console.log("Loaded!");
	console.log(JSON.stringify(db, undefined, 2));

	const rand = Math.floor(Math.random() * 1000);
	db.set(rand, { "Testkey:": "persistent!" });
	console.log("Adding key " + rand.toString());

	console.log(db.fetch(db.keyArray()));
});
