require("dotenv").config();

const axios = require("axios").default;
const { App } = require("@slack/bolt");

const app = new App({
	token: process.env.SLACK_BOT_TOKEN,
	signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const fancyLog = (msg, channel = process.env.SLACK_LOG_CHANNEL) => {
	if (msg.message) console.error(msg);
	else console.log(msg);

	app.client.chat.postMessage({
		token: process.env.SLACK_BOT_TOKEN,
		//ID or name
		channel,
		text: null,
		attachments: [
			{
				color: msg.message ? "#ff0000" : "#dddddd",
				blocks: [
					{
						type: "section",
						text: {
							type: "plain_text",
							text: `${msg.message || msg}`,
							emoji: false,
						},
					},
				],
			},
		],
	});
};

// Listens to incoming messages that contain "!ping"
app.message("!ping", async ({ message, say }) => {
	// say() sends a message to the channel where the event was triggered
	await say(`Pong! <@${message.user}>`);
});

app.event("reaction_added", async ({ event }) => {
	//item_user is user id of message, user is user id of reactor
	const { reaction, item, item_user, user } = event;
	const { message, channel, ts } = item;

	//List of meaningul reactions
	const reactions = [process.env.REACTION_ADD_TOOL, process.env.REACTION_DEL_TOOL];
	if (!reactions.includes(reaction)) return;

	try {
		// Get target message of reaction
		// Get author of target message
		const [msg, author, reactor] = await Promise.all([
			app.client.conversations.history({
				token: process.env.SLACK_BOT_TOKEN,
				channel,
				latest: ts,
				limit: 1,
				inclusive: true,
			}),
			app.client.users.profile.get({
				token: process.env.SLACK_BOT_TOKEN,
				user: item_user,
			}),
			app.client.users.profile.get({
				token: process.env.SLACK_BOT_TOKEN,
				user,
			}),
		]);

		switch (reaction) {
			case reactions[0]:
				fancyLog(`User @ ${reactor.profile.display_name || reactor.profile.real_name} adds a tool from ${ts} in ${channel}`);
				app.client.chat
					.postMessage({
						token: process.env.SLACK_BOT_TOKEN,
						channel: process.env.SLACK_TOOLS_CHANNEL,
						text: msg.messages[0].text,
						icon_url: author.profile.image_original || author.profile.image_512,
						username: author.profile.display_name || author.profile.real_name,
						//unfurl_links: true,
						unfurl_media: true,
					})
					.catch(err => fancyLog(err));
				break;
			case reactions[1]:
				fancyLog(`User @ ${reactor.profile.display_name || reactor.profile.real_name} deletes message ${ts}`);
				app.client.chat
					.delete({
						token: process.env.SLACK_BOT_TOKEN,
						channel: process.env.SLACK_TOOLS_CHANNEL,
						ts,
					})
					.catch(err => fancyLog(err));
				break;
		}
	} catch (err) {
		fancyLog(err);
	}
});

(async () => {
	// Start your app
	await app.start(process.env.PORT || 3000);

	fancyLog("⚡️ Bolt app is running!");
})();
