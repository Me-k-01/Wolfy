/* Dependencies */
const Discord = require('discord.js');
const fs = require('fs');


const config = require("./data/config.json");
const data = require("./data/id.json");
const Template = require( './lib/template.js');


const client = new Discord.Client();

// Send errors to dev in case of error to debug.
const kill = () => {process.exit(1);};
const debug = async (err) => {
  await sendToDev(err);
  kill();
};
const error = (err) => {
  console.log("An error has occured!");
  console.error(err);
  debug(err);
};


async function sendToDev(txt)
{
  const dev = await client.users.fetch(config.dev);
  if ( dev ) { // Si on l'a trouvé
    dev.send(txt);
  }
}

function newData(guildID)
{ // Create a new template for the data used by the server of id "guildID"
  data[guildID] = new Template();

  const path = `./data/txt/${guildID}`;
  if(!fs.existsSync(path))
  { // On creer un fichier si il n'existe pas
    fs.mkdirSync(path, 0766, err => {
      if (err) {error(err);}
    });
  }
}

function saveData()
{ // Save the data currently loaded by the bot client.
  fs.writeFile ("./data/id.json", JSON.stringify(data), function(err) {
    if (err) {error(err);}
    console.log('Saved currently loaded data.');
    }
  );
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  sendToDev(`Logged in as ${client.user.tag}!`);
  client.guilds.forEach(guild => {
    if (! data[guild.id]) { // Si il manque une sauvegarde de donnée serveur
      newData(guild.id); // On initialise une nouvelle saubegarde
    }
  });

});

client.on("guildCreate", guild => {
  console.log("Joined a new guild: " + guild.name);
  sendToDev("Joined a new guild: " + guild.name);
  // adding to guildArray
});
client.on("guildDelete", guild => {
  console.log("Left a guild: " + guild.name);
  sendToDev("Left a guild: " + guild.name);
  //remove from guildArray
});


client.on('message', async msg => {
  const guild = msg.guild,
    author = msg.author ;

  if (author.bot) { return; }
  if (guild === null) { // Si ce n'est pas un message d'un serveur
    // On cherche les id des serveurs commun entre le bot et l'utilisateur
    const guilds = client.guilds.filter(guild => guild.member(author.id));
    guilds.forEach(commonGuild => {
      const receivedList = [];
      data[commonGuild.id].users.receivers.forEach(async rcvID => {
        // For each message receiver
        const rcv = await client.users.fetch(rcvID);
        // If we found the receiver, we send the message to him
        if ( rcv && author !== rcv && !receivedList.includes(rcvID)) {
          // exept if it's the author or if we already send it to him (in case of multiple guilds)
          receivedList.push(rcvID);
          rcv.send(`${author.username}#${author.discriminator}:\b> ${msg.content}`);
        }

      });
    });
    return;
  }

  // If author is a admin
  const isAdmin = msg.member.roles.find(role => role.hasPermission('Administrator'));
  const save = data[guild.id]; // la sauvegarde du serveur courant
  // Si l'auteur est blacklisté
  if (save.users.blackList.includes(author.id)) {return;}

  const modify = (fileName, txt) => {
    fs.writeFileSync(`data/txt/${guild.id}/${fileName}.txt`, txt);
  };
  const read = (fileName) => {
    return fs.readFileSync(`data/txt/${guild.id}/${fileName}.txt`, "utf8");
  };

  if (txt === 'ping') {
    msg.reply('Pong!');
  }

  if (msg.content.startsWith(config.prefix))
  {
    const cmd = msg.content.toLowerCase().substring(1).split().filter(word => word !== '' );
    switch (cmd[0])
    {
      case "task", "t":
        if (isAdmin) {
          if (cmd[1]) {
            const tasks = save.channels.tasks;
            switch (cmd[1])
            {
              case "new", "n":
                let n;
                if (tasks.length > 0) {
                  n = tasks.length;
                }
                const chan = await guild.createChannel(`task-manager-${n}`, 'text');
                chan.send(read("task"));
                tasks.push(chan.id);
                
                break;
              case "modify", "mod", "m":
                const txt = msg.content.substring(cmd[0].length + cmd[1].length);
                modify("task", txt);
                break;
              case "delete", "del", "d":
                for (let arg in cmd.slice(2))
                {
                  const id = parseInt(arg);
                  if (isNaN(arg)) {
                    msg.reply(`Je n'ai pas pu proceder à la suppression du channel d'id "${arg}" car ce n'est pas un nombre.`);
                  } else {  // Find and del channel by a given id
                    const i = tasks.indexOf(id);
                    if (i>-1) {
                      tasks.splice(i, 1); // del the id from the stored channel
                      const chan = guild.channels.find(chan => chan.id === id);
                      if (chan) {
                        chan.delete();
                      }
                    } else {
                      msg.reply(`Je n'ai pas pu proceder à la suppression du channel d'id "${arg}" car il n'était pas considerer comme un channel de gestion de tache.`);
                    }

                  }
                }
                // If no id is provided, we delete de latest task manager channel
                if (cmd.length === 2) {
                  const id = tasks.pop();
                  guild.channels.find(chan => chan.id === id).delete();
                }
                break;
              case "info", "i":
                msg.reply("Liste des id channels stockés pour le traitement du gestionnaire des taches: \b ```" + save.channels.task + "```");
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
        if (author.id === config.dev) {
          kill();
        }
        break;
      default:
    }
  }
});



// Error listener
client.on('Error', error);
client.login(config.token);
