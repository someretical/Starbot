# Invite Starbot to your server
Currently not available
{% comment %} 
    [Click here]() 
{% endcomment %}

# Data collection policy
By being present in any server where the bot is present, you automatically consent to having the following data collected from you. 

## Persistent storage
The following data is stored in persistent (secondary) storage which lasts between reboots. Every care has been taken to ensure the security of the data being stored.
- Tags - custom commands
	- The ID of the user who created the tag
	- The ID of the server in which the tag was created
	- The name of the tag
	- The response of the tag
	- When the tag was last edited
	- The number of uses the tag has
- Stars - starred messages
	- The ID of the starred message
	- The ID of the starred message author
	- The ID of the channel the starred message was sent in
	- The ID of the server in which the starred message was sent
	- The IDs of the users who starred the message
- Users - user profiles
	- The ID of the user
	- Reputation point count
	- Coin count
	- Throttles - contain the ID of the user and command name(s)

## Other data accessed
While the bot is online, it may access all data about you that the Discord API has provided. Only the data listed above is actually stored by the bot.

## Other information
- If you wish to delete all the data the bot has stored about you, run the `purgedata` command.
- If you wish to completely opt out of data collection across all servers where both you and the bot are present, run the `optout` command.
	- This command performs the purgedata command and will create a special persistent entry containing only your user ID so the bot knows to block you in the future.
	- This command is non-reversible as it will make the bot permanently block you.
- **NOTE:** the above commands will also reset your user profile to 0 reputation and coins.

- Alternatively, you can just leave any server where the bot is present if you do not consent to the data collection policy.
