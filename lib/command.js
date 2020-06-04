const fs = require('fs-extra');
const dataBase = require( './lib/data.js');

function Functionality(func, desc) {
  this.main = func;
  this.description = desc;
}

/* Template
DO NOT create obj with same name as parent
DO NOT use default values for parametters
boolean counts as false by default */
let mainCommand = {
  ping : { main () { return `${Math.round(4)}ms de latence!`; },
    desc: ""
  },
  task : {
    new: { main (n) {
        console.log("n: ", n);
        return "un nouveau channel de gestion des taches à été créé. Nommé: \n" + this.msg.string;
      },
      desc: "yeet",
      useString: true,
      useArray: false
    },
    delete: { main (channels) {
        console.log(channels);
        return "deleted: " + channels;
      },
      desc: "yeet",
      useString: false,
      useArray: true
    }

  },

};

function CommandManager(namespace) {
  let self = this;

  let prevArg = [];

  const toArray = (str) => {
    return str.toLowerCase().split(' ').filter(w => w !== '' );
  };
  let setString = (argArray, funcLen) => {
  console.log("###################################");
    console.log('argArray', argArray);
    console.log('funcLen', funcLen);
    console.log('argArray[funcLen]', argArray[funcLen]);
    if (!argArray[funcLen])
      return "Err";
    if (! namespace.msg.string)  {
      if (namespace.msg.content.indexOf(argArray[funcLen]) === namespace.msg.content.lastIndexOf(argArray[funcLen])) {
        namespace.msg.string = namespace.msg.content.slice(
          namespace.msg.content.toLowerCase().indexOf(argArray[funcLen])
        );
      } else {
        namespace.msg.string = argArray.slice(funcLen).join(" ");
      }
      console.log("'" + namespace.msg.string + "'");
      let newLen =  argArray.length - toArray(namespace.msg.string).length;
      console.log("len:", argArray.length, newLen);
      if (newLen >= 0)
        argArray.length = newLen;
    }
    console.log("namespace.msg.string: ", namespace.msg.string);
    console.log("argArray: ", argArray);
    console.log("###################################");
  };

  let strToCmdArray = (str) => {
    // Create from a given string a command arg array

    const i = str.indexOf('"'), j = str.lastIndexOf('"');

    if (i && j && i != j) {
      namespace.msg.string = str.slice(i+1, j); // We store the protected string for after
    } else
      return toArray(str);

    return toArray(str.slice(0, i)).concat(toArray(str.slice(j+1)));
  };

  let analyse = function (command, argArray) {
    const arg = argArray.shift();
    const obj = command[arg];
    prevArg.push(arg);
    if (obj && typeof obj.main === "function") { // If the arg is a known function
      if (obj.useString)
        setString(argArray, obj.main.length);
      console.log(argArray);
      obj.main = obj.main.bind(namespace); // Provide the template with usefull values
      if (obj.useArray) {
        console.log("need array");
        return obj.main(argArray);
      }
      if (argArray.length <= obj.main.length ) {
        console.log("argArray.length <= obj.main.length");
        return obj.main.apply(null, argArray);
      }
      return "/!\\ ERROR:          " + arg + "\nToo many args given to ^";
    }
    if (obj) {
      return analyse(obj, argArray); // recurse
    }
    return "Erreur: Commande non trouvé";

  };
  self.analyse = function (usePrefix = true) {
    // Start analysing the command with a recursive loop
    let txt = namespace.msg.content;
    if (usePrefix)
      txt = txt.substr(1);
    return analyse(self.command, strToCmdArray(txt) );
  };
  self.use = (template) => {
    // Choose a command template to use
    self.command = template;
  };
}

let msg = {
  guild: {id: "714221758777131038"},
  content: 'task new e"  "'
};

// Configuration of the accessible variable so that we can access it inside the command template
let commandManager = new CommandManager({
  dataBase: dataBase,
  data: dataBase[msg.guild.id],
  msg: msg
}) ;
commandManager.use(mainCommand);
console.log(commandManager.analyse(false));
// console.log(analyse(c, cmd));
