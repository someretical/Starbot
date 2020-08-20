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
		<td><code>/addcoins</code></td>
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
		<td><code>/balance</code></td>
		<td>shows author balance</td>
	</tr>
	<tr>
		<td><code>/balance <@123></code></td>
		<td>error</td>
	</tr>
	<tr>
		<td><code>/balance <@285571328155582465></code></td>
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
		<td><code>/transfercoins</code></td>
		<td>error</td>
	</tr>
	<tr>
		<td><code>/transfercoins <@123> 51.3</code></td>
		<td>error</td>
	</tr>
	<tr>
		<td><code>/transfercoins <@285571328155582465> 50</code></td>
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