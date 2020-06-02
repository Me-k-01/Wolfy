/* Dependencies */
const Discord = require('discord.js');
const client = new Discord.Client();

const config = require("./data/config.json");
const data = require( './lib/data.js');
const {strToArray, substringFrom} = require('./lib/util.js');
const TaskBoard = require( './lib/task.js');

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
      dataChan = dataServer.channels,
      i = dataChan.tasks.indexOf(channel.id);
    if (i>=0) {
      // If the user just deleted a stored channel, we need to remove it from the array
      taskChan.tasks.splice(i, 1);
      dataServer.messages.tasks.splice(i, 1);
      data.save();
    } else if (dataChan.taskCategory === channel.id) {
      // If it's the category stored, we also need to remove it from the array
      delete dataChan.taskCategory;
      data.save();
    }

  }
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

  const isAdmin = msg.member.hasPermission("ADMINISTRATOR"),  // If author is a admin
    isDev = author.id === config.dev,
    dataServer = data[guild.id]; // Data of the current guild
  // If the author is blacklisted
  if (dataServer.users.blackList.includes(author.id)) return;

  // If the message was sent into a task management channel
  if (dataServer.channels.tasks.includes(msg.channel.id)) {
    msg.channel.startTyping();
    let mainMsg;
    const i = dataServer.channels.tasks.indexOf(msg.channel.id);
    try {
      mainMsg = await msg.channel.messages.fetch(
          dataServer.messages.tasks[i]
        );
    } catch (err) {
      dataServer.channels.tasks.splice(i, 1);
      dataServer.messages.tasks.splice(i, 1);
      data.save();

      await msg.reply("Je n'ai pas su retrouver mon message originel. :/");
      await msg.reply("DESTRUCTION DU SALON IMMINENT!");
      msg.channel.delete();
      return;
    }
    const cmd = strToArray(msg.content);

    const taskBoard = new TaskBoard(mainMsg.content, msg.content);
    switch (cmd[0])
    {
      case "add": case "a":
        let argI = 0,
          i = 0; // Which board
        // If a board number is provided at the beginning.
        if ( taskBoard.isNumBoard(cmd[1]) ) {
          i = parseInt(cmd[1])-1;
          argI = 1;
        }
        console.log("add");
        mainMsg.edit(taskBoard.add(substringFrom(cmd[argI], msg.content), i));
        break;
      case "swap": case "swp": case "s":
        console.log("swap");
        if ( taskBoard.isNum(cmd[1]) && taskBoard.isNum(cmd[2]) && cmd[1] != cmd[2] && cmd.length === 3) {
          const i = parseInt(cmd[1])-1;
          const j = parseInt(cmd[2])-1;
          mainMsg.edit(taskBoard.swap(i, j));
        }
        break;
      case "delete": case "del": case "d":
        if (cmd.length === 2) {
          if (taskBoard.isNum(cmd[1]) )
            mainMsg.edit(taskBoard.del(parseInt(cmd[1])-1));
        }
        break;
      case "reset":
        if (isAdmin && cmd.length === 1) {
          console.log("reset");
          mainMsg.edit(data.read(guild.id, "task"));
        }
        break;
      case "reaction": case "react": case "r":
        break;
      default:
    }
    // At the end we detroy the user message and return the function prematurely.
    await msg.delete();
    msg.channel.stopTyping();
    return;
  }

  // Commande
  if (msg.content.startsWith(config.prefix))
  {
    const cmd = strToArray(msg.content.substring(1));
    switch (cmd[0])
    {
      case "ping" :  // Test de latence.
        msg.reply(`${Math.round(client.ws.ping)}ms de latence!`);
        break;
      case "task": case "t":
        if (isAdmin) {
          if (cmd[1]) {
            const taskChan = dataServer.channels.tasks,
              taskMsg = dataServer.messages.tasks,
              channels = guild.channels.cache; // Every task man of the guild
            switch (cmd[1])
            {
              case "new": case "n":
                const i = taskChan.length;
                if (i === 0 && ! dataServer.channels.taskCategory) {
                  // If it's our first task manager channel, we create a new category to store it
                  const cat = await guild.channels.create('Gestionaire des taches', {type: 'category'});
                  if (cat)
                    dataServer.channels.taskCategory = cat.id;
                }
                const chan = await guild.channels.create(`task-manager-${i || ''}`, { parent: channels.get(dataServer.channels.taskCategory),topic: "Gestion des taches", reason: `${pseudo} lo vult` });
                if (!chan) {
                  msg.reply("Je n'ai pas pu proceder à la création du nouveau channel.");
                  return;
                }
                let mainMsg;
                try {
                  mainMsg = await chan.send(data.read(guild.id, "task"));
                } catch(err) {
                  msg.reply("Je n'ai pas pu proceder à la création du tableau de taches.");
                  return;
                }
                taskChan[i] = chan.id;
                taskMsg[i] = mainMsg.id;
                msg.reply("un nouveau channel de gestion des taches à été créé.");
                data.save();
                break;
              case "show": case "s":
                msg.reply('```' + data.read(guild.id, "task") + '```');
                break;
              case "modify": case "mod": case "m":
                data.write(guild.id, "task", substringFrom(cmd[1], msg.content));
                break;
              case "delete": case "del": case "d":
                const args = cmd.slice(2);
                for (const arg of args)
                {
                  if (arg === "all") { // If we delete everything
                    for (const target of taskChan)
                    {
                      const chan = channels.get(target);
                      if (chan)
                        chan.delete();
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
                      const chan = channels.get(arg);
                      if (chan)
                        await chan.delete();
                      msg.reply(`Le channel de gestion de tache ${i} d'id "${arg}" a été supprimé avec succès.`);
                    } else {
                      msg.reply(`Je n'ai pas pu proceder à la suppression du channel d'id "${arg}" car il n'était pas consideré comme un channel de gestion de tache.`);
                    }

                  }
                }
                // If no id is provided, we delete de latest task manager channel
                if (! args.length) {
                  if (taskChan.length) { // Provided that there is something to delete
                    const target = taskChan.pop();
                    taskMsg.pop();
                    const chan = channels.get(target);
                    if (chan) // Si un utilisateur ne l'a pas delete
                      chan.delete();
                    msg.reply("Le dernier channel créer supprimé.");
                  } else {
                    msg.reply("Il n'y a pas de channel de gestion de tache à supprimer.");
                  }
                }
                if (! taskChan.length) {
                  // If at last there is no more task channel, we delete the Task Man. category.
                  const cat = channels.get(dataServer.channels.taskCategory);
                  if (cat)
                    cat.delete();
                  delete dataServer.channels.taskCategory;
                }
                data.save();
                break;
              case "info": case "i":
                let txt = '';
                for (var t of tasks)
                  txt += t.channels + " ";
                msg.reply("Liste des id channels stockés pour le traitement du gestionnaire des taches: \b ```" + txt + "```");
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
