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
		<td><code>/addcoins ?abc</code></td>
		<td>✔️</td>
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
		<td>✔️</td>
	</tr>
	<tr>
		<td><code>/balance <@123>|abc</code></td>
		<td>❌</td>
	</tr>
	<tr>
		<td><code>/balance <@285571328155582465></code></td>
		<td>✔️</td>
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
		<td>❌</td>
	</tr>
	<tr>
		<td><code>/transfercoins <@123> 51.3|-50</code></td>
		<td>❌</td>
	</tr>
	<tr>
		<td><code>/transfercoins <@285571328155582465> 50</code></td>
		<td>✔️</td>
	</tr>
<table>

### Info
#### Avatar
<table>
	<tr>
		<th>Test</th>
		<th>Expected Result</th>
	</tr>
	<tr>
		<td><code>/avatar</code></td>
		<td>✔️</td>
	</tr>
	<tr>
		<td><code>/avatar <@123>|abc</code></td>
		<td>❌</td>
	</tr>
	<tr>
		<td><code>/avatar <@285571328155582465></code></td>
		<td>✔️</td>
	</tr>
<table>

#### ChannelInfo
<table>
	<tr>
		<th>Test</th>
		<th>Expected Result</th>
	</tr>
	<tr>
		<td><code>/channelinfo</code></td>
		<td>✔️</td>
	</tr>
	<tr>
		<td><code>/channelinfo <@123>|abc</code></td>
		<td>❌</td>
	</tr>
	<tr>
		<td><code>/channelinfo <#any_valid_channel_id></code></td>
		<td>✔️</td>
	</tr>
<table>

#### RepCount
<table>
	<tr>
		<th>Test</th>
		<th>Expected Result</th>
	</tr>
	<tr>
		<td><code>/repcount</code></td>
		<td>✔️</td>
	</tr>
	<tr>
		<td><code>/repcount <@123>|abc</code></td>
		<td>❌</td>
	</tr>
	<tr>
		<td><code>/repcount <@285571328155582465></code></td>
		<td>✔️</td>
	</tr>
<table>

#### ServerIcon
<table>
	<tr>
		<th>Test</th>
		<th>Expected Result</th>
	</tr>
	<tr>
		<td><code>/servericon ?abc</code></td>
		<td>✔️</td>
	</tr>
<table>

#### ServerInfo
<table>
	<tr>
		<th>Test</th>
		<th>Expected Result</th>
	</tr>
	<tr>
		<td><code>/serverinfo ?abc</code></td>
		<td>✔️</td>
	</tr>
<table>

#### UserInfo
<table>
	<tr>
		<th>Test</th>
		<th>Expected Result</th>
	</tr>
	<tr>
		<td><code>/userinfo</code></td>
		<td>✔️</td>
	</tr>
	<tr>
		<td><code>/userinfo <@123>|abc</code></td>
		<td>❌</td>
	</tr>
	<tr>
		<td><code>/userinfo <@285571328155582465></code></td>
		<td>✔️</td>
	</tr>
<table>

### Server
#### BlockChannel
<table>
	<tr>
		<th>Test</th>
		<th>Expected Result</th>
	</tr>
	<tr>
		<td><code>/blockchannel</code></td>
		<td>❌</td>
	</tr>
	<tr>
		<td><code>/blockchannel <#123>|abc</code></td>
		<td>❌</td>
	</tr>
	<tr>
		<td><code>/blockchannel <#any_valid_text_channel_id></code></td>
		<td>✔️</td>
	</tr>
<table>

#### BlockUser
<table>
	<tr>
		<th>Test</th>
		<th>Expected Result</th>
	</tr>
	<tr>
		<td><code>/blockuser</code></td>
		<td>❌</td>
	</tr>
	<tr>
		<td><code>/blockuser <@123></code></td>
		<td>✔️</td>
	</tr>
	<tr>
		<td><code>/blockuser <@285571328155582465> 'abc 123'</code></td>
		<td>✔️</td>
	</tr>
	<tr>
		<td><code>/blockuser <@285571328155582465> 'abc 123' -g|--global</code></td>
		<td>✔️ (❌ if author not bot owner)</td>
	</tr>
<table>

#### SetPrefix
<table>
	<tr>
		<th>Test</th>
		<th>Expected Result</th>
	</tr>
	<tr>
		<td><code>/setprefix</code></td>
		<td>❌</td>
	</tr>
	<tr>
		<td><code>/setprefix 12345678901</code></td>
		<td>❌</td>
	</tr>
	<tr>
		<td><code>/setprefix 'a b&lt;single_quote&gt;'</code></td>
		<td>✔️ (returns <code>a b&lt;'</code>)</td>
	</tr>
<table>

#### Setup
<table>
	<tr>
		<th>Test</th>
		<th>Expected Result</th>
	</tr>
	<tr>
		<td><code>/setup</code></td>
		<td>✔️</td>
	</tr>
	<tr>
		<td><code>anyPrompt: cancel</code></td>
		<td>✔️</td>
	</tr>
	<tr>
		<td><code>!askIgnoredChannels: skip</code></td>
		<td>✔️</td>
	</tr>
	<tr>
		<td><code>askPrefix: 12345678901</code></td>
		<td>❌</td>
	</tr>
	<tr>
		<td><code>askPrefix: abc</code></td>
		<td>✔️</td>
	</tr>
	<tr>
		<td><code>askTag: non|123</code></td>
		<td>❌</td>
	</tr>
	<tr>
		<td><code>askTag: y|yes|n|no</code></td>
		<td>✔️</td>
	</tr>
	<tr>
		<td><code>askIgnoredChannels: done</code></td>
		<td>✔️</td>
	</tr>
	<tr>
		<td><code>askIgnoredChannels: <#123>|abc</code></td>
		<td>❌</td>
	</tr>
	<tr>
		<td><code>askIgnoredChannels: <#any_valid_text_channel_id></code></td>
		<td>✔️</td>
	</tr>
	<tr>
		<td><code>askStarboard: <#123>|123</code></td>
		<td>❌</td>
	</tr>
	<tr>
		<td><code>askStarboard: <#any_valid_text_channel_id></code></td>
		<td>✔️</td>
	</tr>
	<tr>
		<td><code>askStarboardChannel: <#123>|123</code></td>
		<td>❌</td>
	</tr>
	<tr>
		<td><code>askStarboardChannel: <#any_valid_text_channel_id></code></td>
		<td>✔️</td>
	</tr>
	<tr>
		<td><code>askReactionThreshold: abc|12.3|-123</code></td>
		<td>❌</td>
	</tr>
	<tr>
		<td><code>askReactionThreshold: 123</code></td>
		<td>✔️</td>
	</tr>
<table>

#### UnblockChannel
<table>
	<tr>
		<th>Test</th>
		<th>Expected Result</th>
	</tr>
	<tr>
		<td><code>/unblockchannel</code></td>
		<td>❌</td>
	</tr>
	<tr>
		<td><code>/unblockchannel <#123>|abc</code></td>
		<td>❌</td>
	</tr>
	<tr>
		<td><code>/unblockchannel <#any_valid_blocked_channel_id></code></td>
		<td>✔️</td>
	</tr>
<table>

#### UnblockUser
<table>
	<tr>
		<th>Test</th>
		<th>Expected Result</th>
	</tr>
	<tr>
		<td><code>/unblockuser</code></td>
		<td>❌</td>
	</tr>
	<tr>
		<td><code>/unblockuser <@123>|abc</code></td>
		<td>❌</td>
	</tr>
	<tr>
		<td><code>/unblockuser <@285571328155582465></code></td>
		<td>✔️</td>
	</tr>
	<tr>
		<td><code>/unblockuser <@285571328155582465> -g|--global</code></td>
		<td>✔️ (❌ if author is not bot owner)</td>
	</tr>
<table>

#### ViewSettings
<table>
	<tr>
		<th>Test</th>
		<th>Expected Result</th>
	</tr>
	<tr>
		<td><code>/viewsettings ?abc</code></td>
		<td>✔️</td>
	</tr>
<table>

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