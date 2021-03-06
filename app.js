/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");

// Setup Restify Server
var server = restify.createServer();
console.log(server)
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

var tableName = 'botdata';
var storageName = "ilxbotstorage";
var storageKey = 'gzufJ6z3CRCbv8/FuKITCTDwIOSfQqSPDiqvZKMyliQrPlT1VrWx8BU7Ah+yDRJ8e0pfxRR+raLlljetTDYNBw==';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, storageName, storageKey);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);
bot.set('storage', tableStorage);

bot.dialog('/', function (session) {
    const botName = 'ilxbot2';
    const cleanedMessage = session.message.text.replace(botName, '').trim();
    const args = cleanedMessage.split(' ');
    const setStringWords = new Set(args)
    const returnMsg = '';
    const arrayEmoji=[]
    var hasEmoji= setStringWords.has('emoji');

    session.on('error', function (err) {
        session.send('Failed with message: %s', err.message);
        session.endDialog();
    });
    
    try {
        if (hasEmoji) {
            var emoji = require('node-emoji');
            let indexEmoji = args.indexOf('emoji')
            let message = ''
            const elementAfterEmoji = args[parseInt(indexEmoji)+1]
            const emojiElement = emoji.search(elementAfterEmoji)
            if (emojiElement.length == 0) {
                message = emoji.emojify('Sorry, we don\'t have that emoji! :disappointed_relieved:');
            }
            else {
                emojiElement.forEach(element => {
                    message += element.emoji
                });
            }
            session.send(message);
        }
        else if (args[1] === 'get-reminder') {
            const userReminder = session.userData.reminder;
            session.send(userReminder ? userReminder : 'You haven\'t set a reminder for yourself. Do that with \"set-reminder\"');
        }
        else if (args[1] === 'set-reminder') {
            let remember = '';
            for (var i = 2; i < args.length; ++i) {
                remember += args[i] + " ";
            }
            remember = remember.trim();
            session.userData.reminder = remember;
            session.send(`Set your reminder to ${remember}`);
        }
        else if (args[1] === 'help') {
            session.send(
                {
                    "type": "message",
                    "attachments": [{
                        "contentType": "application/vnd.microsoft.card.receipt",
                        "content": {
                            "title": "Commands:",
                            "items": [
                                { "subtitle": "emoji [emoji_name]:", "text": "returns matching emojis"},
                                { "subtitle": "set-reminder [remind me of...]:", "text": "sets a reminder for you"},
                                { "subtitle": "get-reminder:", "text": "returns your reminder you set"},
                            ]
                        }
                    }]
                }
            );
            //session.send('Commands:\n\nemoji [emoji_name]: returns matching emojis\n\nset-reminder [remind me of...]: sets a reminder for you\n\nget-reminder: returns your reminder you set\n');
        }
        else {
            const messageData = JSON.stringify(args);
            session.send(`I don\'t understand! Message: "${cleanedMessage}", Split message: ${messageData}`);
        }
    } catch (err) {
        // ignore this comment
        session.error(err);
    }

    // capture session user information
    session.userData.userId = session.message.user.id;
    // capture conversation information
    const timestamp = new Date();
    session.conversationData[timestamp.toISOString().replace(/:/g,"-")] = session.message.text;
    // save data
    session.save();
    bot.set('storage', tableStorage);
});
