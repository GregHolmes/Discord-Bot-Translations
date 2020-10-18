const Discord = require('discord.js');
const AWS = require('aws-sdk');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
const flagService = require('./flags');

require('dotenv').config();

AWS.config.region = process.env.AWS_REGION;
const translate = new AWS.Translate();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  if (msg.content === 'ping') {
    msg.reply('pong');
  }
});

client.on('messageReactionAdd', async (reaction, user) => {
	// When we receive a reaction we check if the reaction is partial or not
	if (reaction.partial) {
		// If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message: ', error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}

	translateText(reaction.message.content, flagService.convertFlagToText(reaction.emoji.name), reaction);

});

const translateText = async (originalText, targetLanguageCode, reaction) => {
	if (targetLanguageCode === null) {
		return;
	}

	return new Promise((resolve, reject) => {
		let params = {
			Text: originalText,
			SourceLanguageCode: "auto",
			TargetLanguageCode: targetLanguageCode
		}

		try {
			translate.translateText(params, (err, data) => {
				if (err) {
					reject(err);
				}

				if (data) {
					reaction.message.channel.send(reaction.message.author.username + ' requested a translation from `' + data.SourceLanguageCode + '` to `' + data.TargetLanguageCode + '`');
					reaction.message.channel.send('> ' + originalText);
					reaction.message.channel.send('```' + data.TranslatedText + '```');
					resolve(data);
				}

				return data;
			});
		} catch (err) {
			console.log(err);
		}
	});
}

client.login(process.env.DISCORD_TOKEN);