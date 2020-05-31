/* Dependencies */
const Discord = require('discord.js');
const client = new Discord.Client();

const config = require("./data/config.json");
const data = require( './lib/data.js');

// Send errors to dev in case of error to debug.
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
const substringFrom = (kw, str) => {
  // Find the text following a keyword
  const i = str.indexOf(kw);
  if (i >= 0 && str.length > i) return str.substring(str.indexOf(kw)+1);
  else return '';

};

async function sendToDev(txt)
{
  const dev = await client.users.fetch(config.dev);
  if ( dev ) { // Si on l'a trouvé
    dev.send(txt);
  }
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  client.guilds.cache.forEach(guild => {
    // If there is data server missing
    if (! data[guild.id]) {
      data.add(guild.id); // We make a new save
    }
  });
  for (const guildId in data) {
    // If the bot got kicked from a previous guild
    if (! client.guilds.cache.has(guildId)) {
      data.delete(guildId);
    }
  }
  data.save();
});

client.on("guildCreate", guild => {
  sendToDev("Joined a new guild: " + guild.name);
  data.add(quild.id);
  data.save();
});

client.on("guildDelete", guild => {
  sendToDev("Left a guild: " + guild.name);
  data.delete(guild.id);
  data.save();
});

client.on("guildMemberAdd", member => {
  member.user.send(data.read(member.guild.id, "welcome"));
});

client.on("channelDelete", channel => {
  const guild = channel.guild;
  if (guild) {
    const dataServer = data[guild.id],
      taskChan = dataServer.channels.tasks,
      taskMsg = dataServer.messages.tasks,
      i = taskChan.indexOf(channel.id);
    if (i>=0) {
      // If the user just deleted a stored channel, we need to remove it from the array
      taskChan.splice(i, 1);
      taskMsg.splice(i, 1);
      data.save();
    } else if (dataServer.channels.taskCat === channel.id) {
      // If it's the category stored, we also need to remove it from the array
      delete dataServer.channels.taskCat;
      data.save();
    }

  }
});

client.on("message", async msg => {
  const guild = msg.guild,
    author = msg.author,
    pseudo = author.username + '#' + author.discriminator ;

  if (author.bot) {return;}
  if (guild === null) {
    // Si ce n'est pas un message d'un serveur
    // On cherche les id des serveurs commun entre le bot et l'utilisateur
    const guilds = client.guilds.cache.filter(guild => guild.member(author.id));
    guilds.forEach(commonGuild => {
      const receivedList = [];
      data[commonGuild.id].users.receivers.forEach(async rcvID => {
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

  // If author is a admin
  const isAdmin = msg.member.hasPermission("ADMINISTRATOR");
  const isDev = author.id === config.dev;
  const dataServer = data[guild.id]; // Data of the current guild
  // If the author is blacklisted
  if (dataServer.users.blackList.includes(author.id)) {return;}

  if (dataServer.channels.tasks.includes(msg.channel.id)) {
    // If the message is sent into a task management channel

      // At the end we detroy the user message and return the function prematurely.
      msg.delete();
      return;
  }

  // Commande
  if (msg.content.startsWith(config.prefix))
  {
    const cmd = msg.content.toLowerCase().substring(1).split(' ').filter(word => word !== '' );
    switch (cmd[0])
    {
      case "ping" :  // Test de latence.
        msg.reply(`${Math.round(client.ws.ping)}ms de latence!`);
        break;
      case "task": case "t":
        if (isAdmin) {
          if (cmd[1]) {
            const taskChan = dataServer.channels.tasks, // Toutes les channels de gestion des taches du serv
              taskMsg = dataServer.messages.tasks;
            switch (cmd[1])
            {
              case "new": case "n":
                const i = taskChan.length;
                if (! i) { // If it's our first task manager channel
                  // we create a new category to store it
                  const cat = await guild.channels.create('Gestionaire des taches', {type: 'category'});
                  if (cat) dataServer.channels.taskCat = cat.id;
                }
                const chan = await guild.channels.create(`task-manager-${i || ''}`, { parent: guild.channels.cache.get(dataServer.channels.taskCat),topic: "Gestion des taches", reason: `${pseudo} lo vult` });
                if (!chan) {
                  msg.reply("Je n'ai pas pu proceder à la creation du nouveau channel.");
                  return;
                }
                const response = await chan.send(data.read(guild.id, "task"));
                if (!response) {
                  msg.reply("Je n'ai pas pu proceder l'envoie du message de gestion.");
                  return;
                }
                taskChan[i] = chan.id;
                taskMsg[i] = response.id;
                msg.reply("un nouveau channel de gestion des taches à été créé.");

                data.save();
                break;
              case "show": case "s":
                msg.reply('```' + data.read(guild.id, "task") + '```');
                break;
              case "modify": case "mod": case "m":
                const txt = substringFrom(cmd[1], msg.content);
                data.write(guild.id, "task", txt);
                break;
              case "delete": case "del": case "d":
              const args = cmd.slice(2);
                for (const arg of args)
                {
                  if (arg === "all") {
                    for (const chanID of taskChan) {
                      const chan = guild.channels.cache.get(chanID);
                      if (chan) chan.delete();
                    }
                    taskChan.length = 0;
                    taskMsg.length = 0;
                    msg.reply("Tout les channels utilisé on été supprimé avec succès");
                    break;
                  }
                  if (isNaN(arg)) {
                    msg.reply(`Je n'ai pas pu proceder à la suppression du channel d'id "${arg}" car ce n'est pas un nombre.`);
                  } else {  // Find and del channel by a given id
                    const i = taskChan.indexOf(arg);
                    if (i>-1) {
                      // del the id from the stored channel and message
                      taskChan.splice(i, 1);
                      taskMsg.splice(i, 1);
                      const chan = guild.channels.cache.get(arg);
                      if (chan) chan.delete();
                      msg.reply(`Le channel de gestion de tache d'id "${arg}" a été supprimé avec succès.`);
                    } else {
                      msg.reply(`Je n'ai pas pu proceder à la suppression du channel d'id "${arg}" car il n'était pas consideré comme un channel de gestion de tache.`);
                    }

                  }
                }
                // If no id is provided, we delete de latest task manager channel
                if (! args.length) {
                  if (taskChan.length) { // Provided that there is something to delete
                    const id = taskChan.pop();
                    taskMsg.pop();
                    const chan = guild.channels.cache.get(id);
                    if (chan) {chan.delete();}
                    msg.reply("Le dernier channel créer supprimé.");
                  } else {
                    msg.reply("Il n'y a pas de channel de gestion de tache à supprimer.");
                  }
                }
                if (! taskChan.length) {
                  // If at last there is no more task channel, we delete the Task Man category.
                  const cat = guild.channels.cache.get(dataServer.channels.taskCat);
                  if (cat) {await cat.delete();}
                  delete dataServer.channels.taskCat;
                }

                data.save();
                break;
              case "info": case "i":
                msg.reply("Liste des id channels stockés pour le traitement du gestionnaire des taches: \b ```" + taskChan + "```");
                break;
              default: // Unfound task command
                msg.reply("Arguments invalides");
            }
          } else { // Undpecified arguments
            msg.reply("Veuillez specifier un argument");
          }
        } else { // User is not an admin
          msg.reply("Vous avez besoin des droits administrateur pour effectuer cette commande");
        }
        break;
      case "kill":
        if (isDev) {
          await msg.reply("**ded**");
          kill();
        }
        break;
      case "reset":
        if (isDev) {
          data.clear();
          client.guilds.cache.forEach(guild => {
            // If there is data server missing
            data.add(guild.id); // We make a new save
          });
          data.save();
        }
        msg.reply('Reinitialisation des données du bot effectué avec succès');
        break;
      default:
    }
  }
});



// Error listener
client.on('Error', error);
client.login(config.token);
