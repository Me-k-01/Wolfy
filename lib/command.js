const fs = require('fs-extra');
const dataBase = require( './lib/data.js');

function Functionality(func, desc) {
  this.main = func;
  this.description = desc;
}

/* Template
DO NOT use default values for parametters
DO NOT use capitales in names
boolean counts as false by default */
let mainCommand = {
  ping : { main () { return `${Math.round(4)}ms de latence!`; },
    desc: ""
  },
  task : {
    new: { main () {
        console.log();
        return "un nouveau channel de gestion des taches à été créé. Nommé: \n" + this.msg.string;
      },
      desc: "yeet",
      useString: true,
    },
    delete: { main (channelsID) {
        for (let id of channelsID) {

        }
        return "deleted: " + channelsID
        ;
      },
      desc: "yeet",
      useArray: true
    }
  },
};

function CommandConfig(namespace, usePrefix=true) {
  const self = this;
  const commandLine = namespace.msg.content.substr(usePrefix); // True or false is converted to 1 or 0.
  const toArray = (str) => {
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
      return toArray(str);
    return toArray(str.slice(0, i)).concat(toArray(str.slice(j+1)));
  };

  self.analyse = function (command, argArray=strToCmdArray(commandLine)) {
    const arg = argArray.shift();
    const obj = command[arg.toLowerCase()];
    if (obj && typeof obj.main === "function") { // If the arg is a known function
      if (obj.useString && ! obj.useArray)
        setString(argArray, obj.main.length);
      if (! obj.useString && namespace.msg.string)
        return '/!\\ ERREUR:          "'  + namespace.msg.string + '"\nChaine de characteres ^ non necessaire fournie.';
      obj.main = obj.main.bind(namespace); // Provide the template with usefull values
      if (obj.useArray) {
        return obj.main(argArray);
      }
      if (argArray.length <= obj.main.length ) {
        return obj.main.apply(null, argArray);
      }
      return "/!\\ ERREUR:                " + arg + "\nTrop d'argument fournis après ^";
    }
    if (obj) {
      return self.analyse(obj, argArray); // recurse
    }
    return "Erreur: Commande non trouvé";

  };
}

let msg = {
  guild: {id: "714221758777131038"},
  content: 'task delete'
};

// Configuration of the accessible variable so that we can access it inside the command template
let commandConfig = new CommandConfig({
  dataBase: dataBase,
  data: dataBase[msg.guild.id],
  msg: msg
}, false) ;

console.log(commandConfig.analyse(mainCommand));

module.exports.config = CommandConfig;
module.exports.template = {};
