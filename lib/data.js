const fs = require('fs-extra');

function Storage () {
  this.users = {
    receivers: [],
    blackList: []
  };
  this.channels = {
    tasks: []
  };
  this.messages = {
    tasks: []
  };
}

const proto = {
  load: function ()
  { // Charge les id stockés precedements dans id.json
    const storedData = require("../data/id.json");
    for(var k in storedData) {
      this[k]=storedData[k];
    }
  },
  save: function ()
  { // Save the data currently loaded by the bot client.
    fs.writeFileSync("./data/id.json", JSON.stringify(this));
  },

  add: function (id)
  { // Create a new storage for the data used by the given server id
    this[id] = new Storage(); // Instanciate new server id storage
    fs.copySync('./data/tmp/template',  `./data/tmp/${id}`);
  },

  delete: function (id)
  { // Delete the data of the given server id
    delete this[id]; // delete the storage for the server
    fs.removeSync(`./data/tmp/${id}`);
  },
  clear: function ()
  { // Clear out every data from every server.
    for(var id in this) {
      this.delete(id);
    }
  },
  write: (id, fileName, txt) => {
    fs.writeFileSync(`./data/tmp/${id}/${fileName}.txt`, txt);
  },
  read: (id, fileName) => {
    return fs.readFileSync(`./data/tmp/${id}/${fileName}.txt`, "utf8");
  },
  tuto: (language) => {
    // Didn't knew where else to put it since it require fs
    return fs.readFileSync(`./data/eg/${language}.txt`, "utf8");
  }
};


const data = Object.create(proto);
data.load();

module.exports = data;
