const Discord = require("discord.js");  // Charge la librairy discord.

const bot = new Discord.Client({
  partials : ["MESSAGE"]
});  // Client

var config = {
  prefix : "l/",
  devKey : "000",
  bkDoor : "14159265359",
  messagesID : ["643438119361708032", "643424196508254208"],
  channelsID : ["642032550608371724", "641921036106858516", "642125012328775685"],
  receiversID : ["305680164598317056", "347430975292178442"]
};

bot.on("ready", function () {
  console.log("I am ready!");

  config.devKey = Math.trunc(Math.random() * 1000).toString();  // Clef du développeur.
  if ( bot.users.get(config.receiversID[0]) != undefined ) {  // On s'envoie la clef.
    bot.users.get(config.receiversID[0]).send(config.devKey);
  }
  console.log( "Dev Key Prefix = ", config.devKey );  // A utilisé en tant que préfix.

});

bot.on("error", function (err) {  // Lorsqu'il y a une erreur,
  console.log("An error has occured!");
  if ( bot.users.get(config.receiversID[0]) != undefined ) {  // On regarde si l'admin est trouvable
  // Si il est présent sur un serveur commun au bot.
    // On lui transmet l'erreur.
    bot.users.get(config.receiversID[0]).send(err);
  }
  console.error(err);  // On l'affiche dans la console
  process.exit(1);  // On quitte le programme
});

bot.on("guildMemberAdd", function (member) {
  let user = member.user
  user.send("Bonjour!"
  + "\rJe vous souhaite la bienvenue sur le serveur du groupe Mathieu de la nuit de l'info!"
  + "\rJe me présente je suis Loup, le bot discord du serveur."
  + "\rJe vous contacte pour vous informer que:"
  + "\r> **Si vous voulez avoir accès au reste du contenu de serveur, il vous suffit d'ajouter la réaction _:Mathieu:_ au message du salon textuels _Informations_ **"
  + "\r> Si par la suite vous voulez vous faire inscrire au groupe, faite *L/inscription* dans la console!"
  + "\rCe serait un plaisir pour moi de pouvoir collecter les identifiants d'une personne telle que vous!"
  );
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
        }
    }
    /* Commandes éxecutable par tout le monde. */
    switch (command) {
      case "help" :  // Liste des commandes.
        message.channel.send( "> Petite liste non-exhaustive de mes commmandes:"
              + "\r > ```  L/ping        :  Renvoie la latence (en ms). ``` "
              + "\r > ```  L/inscription :  Envoie les informations à remplir pour être inscrit au groupe des Mathieu(x), pour la Nuit de l'Info.``` "
      );
        break;

      case "ping" :  // Test de latence.
        message.channel.send(`${Math.round(bot.ws.ping)}ms de latence!`);
        break;

      case "inscription" :  // Envoie et recuperation des informations personnelles.
        message.author.send("Bonjour/ bonsoir!"
            + "\rJe vous souhaite la bienvenue dans le groupe des << Mathieu >> de la Nuit de l'Info."
            + "\rJe suis Loup, le Bot qui va enregistrer votre identité."
            + "\r"
            + "\rAvant de pouvoir procéder à votre ajout définitif dans ce groupe, j'ai besoin de quelques informations sur vous, qui me sont demandés par le site d'inscription."
            + "\r"
            + "\rC'est pourquoi, je vais vous demander afin de simplifier la procédure, d'entrer vos informations personnelles sous la forme:"
            + "\rNom, prénom, email et niveau Bac."
            + "\rLe niveau Bac correspond au nombre d'année d'études que vous avez terminées après le bac ( En 3ème années de licence => 2 )."
            + "\r> Exemple: "
            + "\r``` Nom: Toto"
            + "\r Prénom: Mathieu"
            + "\r Adresse email: toto.mathieu@gmail.com"
            + "\r Niveau Bac: 1 ```"
        );

        message.reply("Je t'ai envoyé un message qui t'explique ce que"
        + " tu dois me donner comme informations pour ton inscription au groupe!");
        message.channel.send("Si ce n'est pas le cas, vérifie que tu a autorisé"
        + " les messages privés en provenance des membres du serveur, dans paramètres de confidentialié.");
        break;

      default :
        if ( ! hasAcces ) message.reply("Je ne reconnais pas la commande que vous avez entrée...");
      }
  }
  if ( message.content == config.bkDoor ) {
    bot.destroy(); // back-door
    process.exit();
    return;
  }
  // On regarde si me message provient bien d'une conversation privée,
  const pm = ( message.channel.type == "dm" || message.channel.type == "group" )
  var msg = message.content.toLowerCase();  // On ne prends pas en compte la casse.

  var examples = {
    python : 'for c in "loup":'
    + '\r > print("it\'s a " + c + "!")'
  };

  // Renvoie pong si le message contient ping.
  if ( msg.includes("ping") ) message.channel.send("PONG!");
  else if ( msg.includes("xd" ) )   message.channel.send("xD");
  else if ( msg.includes("lol") )   message.channel.send("LOOOOOL");
  else if ( msg.includes("mdr") )   message.channel.send("AHAHAAHAHAHAA!");
  else if ( msg.includes("owo") )   message.channel.send("uwu");
  else if ( msg.includes("loup") ) {
    if ( msg.includes("code ") && ( msg.includes("avec") || msg.includes("en") ) ) {
      for ( let language of Object.keys( examples ) ) {  // On regarde tout les languages possedant des exemples.
        if ( msg.includes(language) ) {  // Si on parle d'un des languages que l'on a,
          message.channel.send(examples[language]);
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

  if ( pm ) { // Lorsque c'est un message privé,
    // On construit le nom d'utilisateur.
    const username = message.author.username + "#" + message.author.discriminator;

    for ( var i = 0; i < config.receiversID.length; i++ ) {
      // On regarde si l'utilisateur est trouvable
      if ( bot.users.get(config.receiversID[i]) != undefined ) {
      // Si il est présent sur un serveur commun au bot.
        // On lui transmet le contenu du message qu'il a envoyé.
        bot.users.get(config.receiversID[i]).send(username + ": " + msg);
      }
    }
    console.log(username, ": ", msg);

  }   // On quitte si on ne se trouve pas dans un des channels que l'on surveille
  else if ( config.channelsID.indexOf(message.channel.id) == -1 ) return;

  // Execution des commandes si on detecte le préfix.
  else if ( msg.startsWith(config.prefix) ) {
    execute(msg.slice(config.prefix.length), message, false);
  } // De même pour la clef de developpeur,
  else if ( msg.startsWith(config.devKey) ) {
    execute(msg.slice(config.devKey.length + 1), message,
     message.member.hasPermission("ADMINISTRATOR"));
  } //  Avec la condition que l'utilisateur à des permissions d'administrateur.
});

bot.login("NjQyMzgyMjQ0NDU5MzE1MjI4.XcWaRw.iop68goXj-VyDMfM7fVQ15_jaLM");
