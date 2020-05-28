
const fs = require('fs');

const config = require("./data/config.json");
const data = require("./data/id.json");
const Template = require( './lib/template.js');

const modify = (fileName, txt) => {
  fs.writeFileSync(`data/txt/${guild.id}/${fileName}.txt`, txt);
};
const read = (fileName) => {
  return fs.readFileSync(`data/txt/${guild.id}/${fileName}.txt`, "utf8");
};


function newData(guildID)
{ // Create a new template for the data used by the server of id "guildID"
  data[guildID] = new Template();

  const path = `./data/txt/${guildID}`;
  if(!fs.existsSync(path))
  { // On creer un fichier si il n'existe pas
    fs.mkdirSync(path, '0766', err => {
      if (err) {console.log(err);}
    });
  }
}

function saveData()
{ // Save the data currently loaded by the bot client.
  fs.writeFile ("./data/id.json", JSON.stringify(data), function(err) {
    if (err) {console.log(err);}
    }
  );
}
newData(3);
