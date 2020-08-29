# Chomp

User-generated aggregator for tools that Hack Club members have made.

## Deploy

1. `touch .env` at the project root and define the following values:

```
SLACK_SIGNING_SECRET=
SLACK_BOT_TOKEN=
SLACK_LOG_CHANNEL=
SLACK_TOOLS_CHANNEL=
REACTION_ADD_TOOL=
REACTION_DEL_TOOL=
REACTION_WHITELIST_OWNER=
```
  - `SLACK_SIGNING_SECRET` and `SLACK_BOT_TOKEN` are the usual strings.
  - `SLACK_LOG_CHANNEL` is the channel ID where log messages will be sent to. Might want to be private.
  - `SLACK_TOOLS_CHANNEL` is the channel where tools are aggregated. Makes sense to be public.
  - `REACTION_ADD_TOOL` is the emoji identifier for the reaction that should trigger the bot. For example, if set to `joy`, then when a message is reacted with the `joy` emoji, the bot will attempt to add it to the `SLACK_TOOLS_CHANNEL`.
  - `REACTION_DEL_TOOL` is the emoji identifier for the reaction that should delete a tool in `SLACK_TOOLS_CHANNEL`. Only the `REACTION_WHITELIST_OWNER` user's reaction will be respected.
  - `REACTION_WHITELIST_OWNER` is the user ID of the user that should have permission to delete posts in `SLACK_TOOLS_CHANNEL`.
  
2. Optionally, define `SLACK_REQUEST_ENDPOINT` to change the Slack event subscription endpoint.
