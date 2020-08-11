require("dotenv").config();

const axios = require("axios").default;
const { App } = require("@slack/bolt");

const app = new App({
	token: process.env.SLACK_BOT_TOKEN,
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	endpoints: process.env.SLACK_REQUEST_ENDPOINT || "/chomp/events",
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

// List of blacklisted reactor user ID's
const blacklist = [];

app.event("reaction_added", async ({ event }) => {
	//item_user is user id of message, user is user id of reactor
	const { reaction, item, item_user, user } = event;
	const { message, channel, ts } = item;

	// Ignore blacklisted user
	if (blacklist.includes(user)) return;

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
				const toolReactionGroup = msg.messages[0].reactions.find(reactionGroup => reactionGroup.name === reactions[0]);
				const legitimateReactors = toolReactionGroup.users.filter(user => !blacklist.includes(user));

				if (legitimateReactors.length === 1) {
					await app.client.chat
						.postMessage({
							token: process.env.SLACK_BOT_TOKEN,
							channel: process.env.SLACK_TOOLS_CHANNEL,
							text: msg.messages[0].text,
							icon_url: author.profile.image_original || author.profile.image_512,
							username: author.profile.display_name || author.profile.real_name,
							//unfurl_links: true,
							unfurl_media: true,
						})
						.then(res => {
							fancyLog(`User @ ${reactor.profile.display_name || reactor.profile.real_name} adds tool ${ts} in ${channel}`);
						})
						.catch(err =>
							fancyLog(
								new Error(
									`${err.message}. User @ ${
										reactor.profile.display_name || reactor.profile.real_name
									} tries to add tool ${ts} in ${channel}, but failed.`
								)
							)
						);
				} else {
					fancyLog(
						`User @ ${
							reactor.profile.display_name || reactor.profile.real_name
						} tries to add tool ${ts} in ${channel}, but isn't the first one to add this message so is rejected.`
					);
				}

				break;
			case reactions[1]:
				await app.client.chat
					.delete({
						token: process.env.SLACK_BOT_TOKEN,
						channel: process.env.SLACK_TOOLS_CHANNEL,
						ts,
					})
					.then(res => {
						fancyLog(`User @ ${reactor.profile.display_name || reactor.profile.real_name} deletes message ${ts}`);
					})
					.catch(err =>
						fancyLog(
							new Error(
								`${err.message}. User @ ${
									reactor.profile.display_name || reactor.profile.real_name
								} tried to delete message ${ts}, but failed.`
							)
						)
					);
				break;
		}
	} catch (err) {
		fancyLog(err);
	}
});

(async () => {
	// Start your app
	await app.start(process.env.PORT || 3003);

	fancyLog("⚡️ Bolt app is running!");
})();
