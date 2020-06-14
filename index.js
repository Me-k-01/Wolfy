/* Dependencies */
const Discord = require('discord.js');
const client = new Discord.Client();

const config = require("./data/config.json");
const dataBase = require( './lib/data.js');
const command = require( './lib/command.js');
const TaskBoard = require( './lib/task.js');

// Send errors to dev in case of error in order to debug.
const kill = () => {
  client.destroy();
  process.exit(1);
};
const debug = async (err) => {
  await sendToDev(err);
  kill();
};
const error = (err) => {
  console.log("An error has occured!");
  console.log(err);
  debug(err);
};
const sendToDev = async (txt) => {
  const dev = await client.users.fetch(config.dev);
  if ( dev ) { // Si on l'a trouvé
    dev.send(txt);
  }
};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  client.guilds.cache.forEach(guild => {
    // If there is data server missing
    if (! dataBase[guild.id]) {
      dataBase.add(guild.id); // We make a new save
    }
  });
  for (const guildId in dataBase) {
    // If the bot got kicked from a previous guild
    if (! client.guilds.cache.has(guildId)) {
      dataBase.delete(guildId);
    }
  }
  dataBase.save();
});
client.on("guildCreate", guild => {
  sendToDev("Joined a new guild: " + guild.name);
  dataBase.add(quild.id);
  dataBase.save();
});
client.on("guildDelete", guild => {
  sendToDev("Left a guild: " + guild.name);
  dataBase.delete(guild.id);
  dataBase.save();
});
client.on("guildMemberAdd", member => {
  member.user.send(dataBase.read(member.guild.id, "welcome"));
});
client.on("channelDelete", channel => {
  const guild = channel.guild;
  dataBase.removeChannel(guild.id, channel.id);
});
client.on("message", async msg => {
  const guild = msg.guild,
    author = msg.author,
    pseudo = author.username + '#' + author.discriminator ;

  // If the author is the bot itself
  if (author.bot) return;
  if (guild === null) {
    // Si ce n'est pas un message d'un serveur
    // On cherche les id des serveurs commun entre le bot et l'utilisateur
    const guilds = client.guilds.cache.filter(guild => guild.member(author.id));
    guilds.forEach(commonGuild => {
      const receivedList = [];
      dataBase[commonGuild.id].users.receivers.forEach(async rcvID => {
        // For each message receiver
        const rcv = await client.users.fetch(rcvID);
        // If we found the receiver, we send the message to him
        if ( rcv && author !== rcv && !receivedList.includes(rcvID)) {
          // exept if it's the author or if we already send it to him (in case of multiple guilds)
          receivedList.push(rcvID);
          rcv.send(`${pseudo}:\b> ${msg.content}`);
        }

      });
    });
    return;
  }

  const isAdmin = msg.member.hasPermission("ADMINISTRATOR"),  // If author is a admin
    isDev = author.id === config.dev,
    data = dataBase[guild.id]; // Data of the current guild
  // If the author is blacklisted
  if (data.users.blackList.includes(author.id)) return;

  // Special command //
  if (data.channels.tasks.includes(msg.channel.id))
  {
    msg.channel.startTyping();
    let taskMsg;
    const i = data.channels.tasks.indexOf(msg.channel.id);
    try {
      taskMsg = await msg.channel.messages.fetch(
        data.messages.tasks[i]
      );
    } catch (err) {
      data.channels.tasks.splice(i, 1);
      data.messages.tasks.splice(i, 1);
      dataBase.save();

      await msg.channel.send("Je n'ai pas su retrouver mon message originel. :/");
      await msg.channel.send("DESTRUCTION DU SALON IMMINENT!");
      msg.channel.delete();
      return;
    }

    let commandConfig = new command.Config({
      msg: msg,
      dataBase: dataBase,
      data: data,
      isDev: isDev,
      isAdmin: isAdmin,
      task: {
        msg: taskMsg,
        board: new TaskBoard(taskMsg.content)
      }
    }, false) ;
    await commandConfig.analyse(command.template.task);
    // At the end we detroy the user message and return the function prematurely.
    await msg.delete();
    msg.channel.stopTyping();
    return;
  }

  // Default command //
  if (msg.content.startsWith(config.prefix))
  {
    let commandConfig = new command.Config({
      msg: msg,
      client: client,
      dataBase: dataBase,
      data: data,
      isDev: isDev,
    }, true) ;
    let response = await commandConfig.analyse(command.template.main);
    if (response === "Erreur: Commande non trouvée." && isAdmin)
      response = await commandConfig.analyse(command.template.admin);
    if (response)
      msg.channel.send(response);
  }
});

// Error listener
client.on('Error', error);
client.login(config.token);
