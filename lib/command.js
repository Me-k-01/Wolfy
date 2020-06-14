// Command templates //
/* DO NOT use default values for parametters
DO NOT use capitales in names
boolean attributes count as false by default. */
let template = {};
template.main = {
  ping : { main () {
      return `${Math.round(this.client.ws.ping)}ms de latence!`;
    },
    desc: '$ping :\n> Montre la latence de la connection server/bot.'
  },
  kill: { async main () {
      if (this.isDev) {
        await this.msg.reply("*ded*");
        this.client.destroy();
        process.exit(1);
      }
    }
  },
  help: { main () {
      return CommandConfig.helper(template.main) + "\n" + CommandConfig.helper(template.admin);
    },
    desc: "$help :\n> La liste des commandes"
  }
};
template.admin = {
  channel: {
    new: { async main (type) {
        if (!type) return "Erreur: Vous devez preciser un type de channel.";
        const typeCountainer = {
          task: ['task-manager-', 'Gestionaires de taches', 'gestion des taches'],
        };
        const strToUse = typeCountainer[type];
        if (! strToUse) return "Erreur: Veuillez preciser un type de channel valide";
        // Cashing a bit
        const dataChan = this.data.channels,
          dataMsg = this.data.messages,
          channels = this.msg.guild.channels,
          i = dataChan[type+'s'].length;
        // If it's our first channel, we create a new category to store it
        if (i === 0 && ! dataChan[type+'Category']) {
          const cat = await channels.create(strToUse[1], {type: 'category'});
          if (cat)
            dataChan[type+'Category'] = cat.id;
        }

        if (! this.msg.string)
          this.msg.string = `${strToUse[0]}-${i || ''}`;
        // Create channel + message
        let newChan, newMsg;
        try {
          newChan = await channels.create(this.msg.string, {
            parent: channels.cache.get(dataChan[type+'Category']),
            topic: strToUse[1],
            reason: `${this.msg.author.username} lo vult`
          });
          newMsg = await newChan.send(this.dataBase.read(this.msg.guild.id, type));
        } catch (err) {
          return `Erreur: Je n'ai pas pu proceder à la création du channels de ${strToUse[2]}.`;
        }
        // Save data
        dataChan[type+'s'][i] = newChan.id;
        dataMsg[type+'s'][i]  = newMsg.id;
        this.dataBase.save();
        return `Un nouveau channel de gestion des taches à été créé. Nommé: ${this.msg.string}`;
      },
      desc: '$channel new dice|task|charsheet "name" :\n> ',
      useString: true
    },
    info: { main (type) {
        let txt = '';
        const typeOfChan = this.data.channels[type+'s'];
        if (! Array.isArray(typeOfChan))
          return `Erreur: Aucune info disponnible pour "${type}"`;
        for (var t of typeOfChan)
          txt += t + " ";
        return 'Voici la liste des id de channels qui sont stockés pour "'+ type +'":\n```' + txt + '```';
      },
      desc: "$channel info  <task> :\n> ",
    },
    destroy: { main (channelsID) {
        const channels = this.msg.guild.channels;
        if (channelsID.length === 0)
          return "Erreur: Vous devez preciser au moins 1 id";
        for (const id of channelsID) {
          const chan = channels.cache.get(id);
          if (chan)
            chan.delete();
          else
            return `Erreur: Le channel "${id}" n'existe pas`;
          this.dataBase.removeChannel(this.msg.guild.id, id);
        }
        return "Le/les channels ont été supprimés avec succès.";
      },
      desc: "$channel destroy [ids] :\n> Supprime des channels.",
      useArray: true
    },
    clear: { main (args) {
        if (args.length === 0)
          return 'Erreur: vous devez préciser le type de channel.';

        const chanCache = this.msg.guild.channels.cache,
          dataChan = this.data.channels;

        const clearFromType = (type) => {
          // Delete from data base and destroy every channel of a given type (stored messages and categories included)
          if ( Array.isArray(dataChan[type+'s']) ) {
            for (const id of dataChan[type+'s']) {
              const chan = chanCache.get(id);
              if (chan)
                chan.delete();
            }
            dataChan[type+'s'].length = 0;
            // Things complementary to delete
            if (this.data.messages[type+'s'])
              this.data.messages[type+'s'].length = 0;
            if (dataChan[type + 'Category']) {
              const chan = chanCache.get(dataChan[type+'Category']);
              if (chan)
                chan.delete();
              delete dataChan[dataChan[type+'Category']];
            }
            this.dataBase.save();
          }
        };

        if (args[0] === 'all') {
          if (args.length !== 1) return `Erreur: trop d'argument fournis après "all"`;
          for (const type in dataChan) {
            clearFromType(type.substr(0, type.length-1));
          }
          return "Tous les channels de ma confection on été reduit à l'état d'atom.";
        }

        for (const type of args) {
          if (dataChan[type+'s'])
            clearFromType(type);
          else
            return `Erreur: ${type} n'est pas une valeur correcte.`;
        }
      },
      desc: "$channel clear <type> :\n> Supprime tout d'un certain type de channel.",
      useArray: true
    },
  },
  message: {
    show: { main (name) {
        if (! name)
          return "Erreur: Veuillez préciser quelle texte vous voulez voir.";
        try {
          return this.dataBase.read(this.msg.guild.id, name);
        } catch (err) {
          return `Erreur: ${name} n'est pas une valeur possible.`;
        }
      },
      desc: '$message show <welcome|task> :\n> Montre le texte courrament enregistré'
    },
    modify: {  main (name) {
        if (! name)
          return "Erreur: Veuillez préciser quelle texte vous voulez transformer.";
        try {
          this.dataBase.write(this.msg.guild.id, name, this.msg.string);
          return "J'ai modifié le texte de " + name + " qui sera utilisé pour les prochains messages.";
        } catch (err) {
          return `Erreur: ${name} n'est pas une valeur possible.`;
        }
      },
      desc: '$message modify <name> "texte" :\n> Modifie le texte courrament enregistré',
      useString: true
    },
  },
  reset: { main () {
      this.dataBase.delete(this.msg.guild.id);
      this.dataBase.add(this.msg.guild.id);
      this.dataBase.save();
    },
    desc: 'reset :\n> Se réinitialise et oubli les channels créer par le bot sur le server.'
  }
};
template.task = {
  add: { main (n) {
      const taskBoard = this.task.board;
      let i = 0; // Which board
      if (n) {
        if ( ! taskBoard.isNumBoard(n) ) // Is not a valid number
          return;
        i = parseInt(n)-1;
      }
      this.task.msg.edit(taskBoard.add(this.msg.string, i));
    },
    desc: '',
    useString: true
  },
  swap: { main(a, b) {
      const taskBoard = this.task.board;
      if ( taskBoard.isNum(a) && taskBoard.isNum(b) && a != b) {
        const i = parseInt(a)-1;
        const j = parseInt(b)-1;
        this.task.msg.edit(taskBoard.swap(i, j));
      }
    },
    desc: ''
  },
  delete: { main (n) {
      const taskBoard = this.task.board;
      if (taskBoard.isNum(n) )
        this.task.msg.edit(taskBoard.del(parseInt(n)-1));
    },
    desc: ''
  },
  reset: { main () {
      if (this.isAdmin) {
        this.task.msg.edit(this.dataBase.read(this.msg.guild.id, "task"));
      }
    },
    desc: ''
  }
};

// Creating aliases //
let createAlias = (template, array) => {
  // create aliases linked to the first alias of a template object
  for (const aliases of array) {
    if (template[aliases[0]]) {
      for (var i = 1; i < aliases.length; i++) {
        template[aliases[i]] = template[aliases[0]];
      }
    }
  }
};
createAlias(template.main, [
  ["help", "hlp", "h"],
]);
createAlias(template.admin, [
  ["channel", "chan", "c"],
  ["message", "msg", "m"],
  ["reset", "res", "r"],
]);
createAlias(template.admin.channel, [
  ["new", "n"],
  ["info", "inf", "i"],
  ["destroy", "delete", "des", "del", "d"],
  ["clear", "clr", "c"],
]);
createAlias(template.admin.message, [
  ["show", "shw", "s"],
  ["modify", "mod", "m"],
]);

// The command configurator //
function CommandConfig(namespace, usePrefix) {
  const self = this;
  const commandLine = namespace.msg.content.substr(usePrefix); // True or false is converted to 1 or 0.
  const strToArray = (str) => {
    // Transform a string to an array
    return str.split(' ').filter(w => w !== '' );
  };
  const setString = (argArray, funcLen) => {
    // Deduce automaticaly a string from the commandLine with the number of argument of the main command function.
    if (! argArray[funcLen]) // if nothing is inputed
      return;
    if (! namespace.msg.string)  {
      const slice = argArray.slice(funcLen);
      namespace.msg.string = slice.join(" ");
      const newLen =  argArray.length - slice.length;
      if (newLen >= 0)
        argArray.length = newLen;
    }
  };
  const strToCmdArray = (str) => {
    // Create from a given string a command arg array
    const i = str.indexOf('"'), j = str.lastIndexOf('"');
    if (i && j && i != j)
      namespace.msg.string = str.slice(i+1, j); // We store the protected string for after
    else
      return strToArray(str);
    return strToArray(str.slice(0, i)).concat(strToArray(str.slice(j+1)));
  };
  // Public
  self.analyse = async function (template, argArray=strToCmdArray(commandLine)) {
    // Analyse and execute a command if found.
    const arg = argArray.shift();
    const obj = template[arg.toLowerCase()];
    if (obj && typeof obj.main === "function")
    { // If the arg is a known function
      if (obj.useString && ! obj.useArray)
        setString(argArray, obj.main.length);

      if (! obj.useString && namespace.msg.string)
        return '/!\\ ERREUR:          "'  + namespace.msg.string + '"\nChaine de characteres ^ non necessaire fournie.';

      const func = obj.main.bind(namespace); // Provide the template with usefull values
      if (obj.useArray)
        return await func(argArray);
      if (argArray.length <= func.length )
        return await func.apply(null, argArray);
      return "/!\\ ERREUR:                               " + arg + "\nTrop d'argument fournis après ^";
    }
    if (obj) {
      if (argArray.length > 0) {
        return await self.analyse(obj, argArray); // recurse
      }
      return `Erreur: Veuillez preciser une commande pour "${arg}".`;
    }
    return "Erreur: Commande non trouvée.";

  };

}
CommandConfig.helper = function (template, path='') {
  // Return a string of every command and their description
  let txt = '';
  for (const name in template) {
    const cmd = template[name];
    if (typeof cmd.main === 'function')
      txt += `${cmd.desc}\n`;
    else
      txt += this.helper(cmd, path + " " + name);
  }
  return txt;
};

module.exports.Config = CommandConfig;
module.exports.template = template;
