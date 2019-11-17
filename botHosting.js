const Discord = require("discord.js");  // Charge la librairy discord.
var config = require("./config.json");  // Reccupere le fichier config.
const fs = require("fs");  // fs pour lire le fichier .txt .

const bot = new Discord.Client({
  partials : ["MESSAGE"]
});  // Client

bot.on("ready", function () {
  console.log("I am ready!");

  config.devKey = Math.trunc(Math.random() * 1000).toString();  // Clef du développeur.
  if ( bot.users.get(config.adminsID[0]) ) {  // On s'envoie la clef.
    bot.users.get(config.adminsID[0]).send(config.devKey);
  }
  console.log( "Dev Key Prefix = ", config.devKey );  // A utilisé en tant que préfix.

});

bot.on("error", function (err) {  // Lorsqu'il y a une erreur,
  console.log("An error has occured!");
  console.error(err);  // On l'affiche dans la console
  if ( bot.users.get(config.adminsID[0]) ) {  // On regarde si l'admin est trouvable
  // Si il est présent sur un serveur commun au bot.
    // On lui transmet l'erreur.
    bot.users.get(config.adminsID[0]).send(err);
  }
  process.exit(1);  // On quitte le programme
});

bot.on("guildMemberAdd", function (member) {
  let user = member.user;
  user.send(fs.readFileSync(config.textPath.welcome, "utf8"))
});

bot.on("messageReactionAdd", async function (reaction, user) {
  let applyRole = async function () {
    /* Fonction pour appliquer un role en fonction de l'émoticon utilisé. */
    let emojiName = reaction.emoji.name;
    // Le role du même nom que l'émoticon.
    let role = reaction.message.guild.roles.find( (r) => r.name.toLowerCase() == emojiName.toLowerCase() );
    // L'objet utilisateur.
    let member = reaction.message.guild.members.find( (m) => m.id == user.id );

    try { // On fait attention au erreurs d'attribution de role lié aux permissions.
      if ( role && member ) {
        await member.roles.add(role);  // On ajoute le membre au role lié à la reaction.
        console.log(user.username + " became " + role.name)
      }
    } catch(err) {  // Si il y a une erreur
      console.log(err);
    }
  };

  if ( reaction.message.partial ) {
    try {
      let msg = await reaction.message.fetch();
      for ( var i = 0; i < config.messagesID.length; i++ ) {
        if ( msg.id == config.messagesID[i] ) {
          applyRole();
        }
      }
    } catch(err) {
      console.log(err);
    }
  } else {
    for ( var i = 0; i < config.messagesID.length; i++ ) {
      if ( reaction.message.id == config.messagesID[i] ) {
          applyRole();
      }
    }
  }
});

bot.on("messageReactionRemove", async function (reaction, user) {
  let removeRole = async function () {
    /* Fonction pour retirer un role en fonction de l'émoticon utilisé. */
    let emojiName = reaction.emoji.name;

    // Le role du même nom que l'émoticon.
    let role = reaction.message.guild.roles.find( (r) => r.name.toLowerCase() == emojiName.toLowerCase() );

    // L'objet utilisateur.
    let member = reaction.message.guild.members.find( (m) => m.id == user.id );

    try { // On fait attention au erreurs de gestion de role lié aux permissions.
      if ( role && member ) {
        await member.roles.remove(role);  // On retire le membre au role lié à la reaction.
        console.log(user.username + " left " + role.name)
      }
    } catch(err) {  // Si il y a une erreur.
      console.log(err);
    }
  };
  if ( reaction.message.partial ) {
    try {
      let msg = await reaction.message.fetch();
      for ( var i = 0; i < config.messagesID.length; i++ ) {
        if ( msg.id == config.messagesID[i] ) {
          removeRole();
        }
      }
    } catch(err) {
      console.log(err);
    }
  } else {
    for ( var i = 0; i < config.messagesID.length; i++ ) {
      if ( reaction.message.id == config.messagesID[i] ) {
          removeRole();
      }
    }
  }
});

bot.on("message", function (message) {
  /* Est appellé a chaques nouveaux messages sur le serveur. */
  if ( message.author.bot ) return;  // Ne lis pas ses propres messages.

  function execute(command, message, hasAcces) {
    /* Fonction qui execute une commande demandé. */
    console.log(command);
    /* Commandes du développeur.
    ( Executés seulement si via la clef de dev et par un administrateur. )*/
    if ( hasAcces ) {
      switch (command) {
        case "kill" :
          message.channel.send("Adios!");
          bot.destroy();
          process.exit(1);
          break;

        case "test" :
          message.channel.send("Test effectué avec succès!");
          break;

        default :
          function idFromArray(array, cmd) {
          // Commandes lié aux ajouts / suppressions d'identifiants.
          // (Ne fait que retourner la liste modifiée.)
            if ( cmd.startsWith("show") ) { // Montre les id.
              message.channel.send("Liste des id:");
              for (let id of array) message.channel.send(id);
              console.log(`Showed`);

            } else if ( cmd.startsWith("add ") ) { // Ajouter l'id.
              let id = cmd.slice("add ".length);
              console.log(`Added ${id} to`);
              array.push(id);

            } else if ( cmd.startsWith("remove ") ) { // Retirer l'id.
              let id = cmd.slice("remove ".length);
              for ( let i = array.length-1; i--;) {
                if ( array[i] == id) array.splice(i, 1);
                }
              console.log(`Removed ${id} to`);

            } else if ( cmd.startsWith("clear") ) { // Tout supprimer.
              array = [] ;
              console.log(`Cleared`);
            }

            return array;
          }

          
          let inspector = { message   :  config.messagesID,
                            channel   :  config.channelsID,
                            blacklist :  config.blackList,
                            admin     :  config.adminsID
                          };

          for ( let key in inspector ) { // On inspecte chaque liste de commande,
            if ( command.startsWith(key) ) {  // Si on a une correspondance
              let cmd = command.slice(key.length + 1);
              inspector[key] = idFromArray(inspector[key], cmd);
              console.log(`${key}.`);
              return;
          } }

    } }
    /* Commandes éxecutable par tout le monde. */
    switch (command) {
      case "help" :  // Liste des commandes.
        message.channel.send( fs.readFileSync(config.textPath.listCommand, "utf8") );
        break;

      case "ping" :  // Test de latence.
        message.channel.send(`${Math.round(bot.ws.ping)}ms de latence!`);
        break;

      case "inscription" :  // Envoie et recuperation des informations personnelles.
        message.author.send(fs.readFileSync(config.textPath.inscription, "utf8"))

        message.reply("Je t'ai envoyé un message qui t'explique ce que"
        + " tu dois me donner comme informations pour ton inscription au groupe!");
        message.channel.send("Si ce n'est pas le cas, vérifie que tu a autorisé"
        + " les messages privés en provenance des membres du serveur, dans paramètres de confidentialié.")
        break;

      default :
        if ( ! hasAcces ) message.reply("Je ne reconnais pas la commande que vous avez entrée...");
      }
  }
  // On regarde si me message provient bien d'une conversation privée,
  const pm = ( message.channel.type == "dm" || message.channel.type == "group" );
  var msg = message.content.toLowerCase();  // On ne prends pas en compte la casse.

  if ( pm ) { // Lorsque c'est un message privé,
    ///////////// Personnes a ne pas prendre en compte 
    // On verifie que ce n'est pas un des admins,
    if ( config.blackList.indexOf(message.author.id) != -1 ) return;
    if ( config.adminsID.indexOf(message.author.id) != -1 ) return;
    /////////////

    // On construit le nom d'utilisateur.
    const username = message.author.username + "#" + message.author.discriminator;
    for ( let receiver of config.adminsID ) {
      // On regarde si l'utilisateur est trouvable
      if ( bot.users.get(receiver) ) {
      // Si il est présent sur un serveur commun au bot.
        // On lui transmet le contenu du message qu'il a envoyé.
        bot.users.get(receiver).send(username + ": " + msg);
      }
    }
    console.log(username, ": ", msg);
    return;  // On quitte a la fin, si c'est un message privé.
  }

  // On quitte si on ne se trouve pas dans un des channels que l'on surveille
  if ( config.channelsID.indexOf(message.channel.id) == -1 ) return;

  // Renvoie pong si le message contient ping.
  if ( msg.includes("ping") ) message.channel.send("PONG!");
  else if ( msg.includes("xd" ) )   message.channel.send("xD");
  else if ( msg.includes("lol") )   message.channel.send("LOOOOOL");
  else if ( msg.includes("mdr") )   message.channel.send("AHAHAAHAHAHAA!");
  else if ( msg.includes("owo") )   message.channel.send("uwu");
  else if ( msg.includes("loup") ) {
    if ( msg.includes("code ") && ( msg.includes("avec") || msg.includes("en") ) ) {
      for ( let language of Object.keys( config.examples ) ) {  // On regarde tout les languages possedant des exemples.
        if ( msg.includes(language) ) {  // Si on parle d'un des languages que l'on a,
          message.channel.send(fs.readFileSync(config.examples[language], "utf8"));
        }
      }
    }
    else if ( msg.includes("attaque") ) message.channel.send("Grrrr");
    else if ( msg.includes("joue") || msg.includes("fait") ) {
      if ( msg.includes("despacito") ) message.channel.send("Je regrette mais je me dois de refuser.");
      else message.channel.send("Jamais!");
    }
    else message.channel.send("oui?");
  }

  // Execution des commandes si on detecte le préfix.
  if ( msg.startsWith(config.prefix) ) {
    execute(msg.slice(config.prefix.length), message, false);
  } // De même pour la clef de developpeur,
  else if ( msg.startsWith(config.devKey) ) {
    execute(msg.slice(config.devKey.length + 1), message,
            //  Avec la condition que l'utilisateur à des permissions d'administrateur.
            message.member.hasPermission("ADMINISTRATOR"));
  }
});

bot.login(process.env.BOT_TOKEN);
