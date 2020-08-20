# Ensuring the bot runs correctly
This file documents all of the procedures that should be used to in order to test whether or not the bot is working properly.

## Commands
### Coins
#### Addcoins
- Expected behaviour: 100 coins are added to the author's model and a GlobalThrottle entry is created

#### Balance
- Test command: `/balance abc123`
- Expected behaviour: error

- Test command: `/balance <@123>`
- Expected behaviour: error

- Test command: `/balance <@285571328155582465>`
- Expected behaviour: shows balance

#### TransferCoins
- Test command: `/transfercoins abc123`
- Expected behaviour: error

- Test command: `/transfercoins abc123 abc123`
- Expected behaviour: error

- Test command: `/transfercoins <@285571328155582465> 51.3`
- Expected behaviour: error

- Test command: `/transfercoins <@285571328155582465> 50`
- Expected behaviour: transaction completes

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