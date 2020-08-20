# Ensuring the bot runs correctly
This file documents all of the procedures that should be used to in order to test whether or not the bot is working properly.

## Commands
### Coins
#### Addcoins
<table>
	<tr>
		<th>Test</th>
		<th>Expected Result</th>
	</tr>
	<tr>
		<td>`/addcoins`</td>
		<td>100 coins are added to the author's model and a GlobalThrottle entry is created</td>
	</tr>
<table>

#### Balance
<table>
	<tr>
		<th>Test</th>
		<th>Expected Result</th>
	</tr>
	<tr>
		<td>`/balance`</td>
		<td>shows author balance</td>
	</tr>
	<tr>
		<td>`/balance <@123>`</td>
		<td>error</td>
	</tr>
	<tr>
		<td>`/balance <@285571328155582465>`</td>
		<td>shows user balance</td>
	</tr>
<table>

#### TransferCoins
<table>
	<tr>
		<th>Test</th>
		<th>Expected Result</th>
	</tr>
	<tr>
		<td>`/transfercoins`</td>
		<td>error</td>
	</tr>
	<tr>
		<td>`/transfercoins <@123> 51.3`</td>
		<td>error</td>
	</tr>
	<tr>
		<td>`/transfercoins <@285571328155582465> 50`</td>
		<td>transaction completes</td>
	</tr>
<table>

### Info
#### Avatar
#### ChannelInfo
#### RepCount
#### ServerIcon
#### ServerInfo
#### UserInfo

### Server
#### BlockChannel
#### BlockUser
#### SetPrefix
#### Setup
#### UnblockChannel
#### UnblockUser
#### ViewSettings

### Starboard
#### DeleteStar
#### FixStar
#### ReactionThreshold
#### SetStarboard
#### Star
#### Starboard
#### Unstar

### Tag
#### AddTag
#### DeleteTag
#### EditTag
#### TagInfo
#### TagList

### Utility
#### Eval
#### Help
#### Ping
#### Rep
#### Snowflake
#### UnpackID