const fs = require('fs-extra');

function Storage () {
  this.users = {
    receivers: [],
    blackList: []
  };

  this.channels = {
    tasks: []
  };
  this.message = {
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

  removeChannel: function (guildID, channelID)
  { // Remove channel and linked messages from data base
    const channels = this[guildID].channels;

    for (let type in channels) {
      if (Array.isArray(channels[type])) {
        const i = channels[type].indexOf(channelID);
        if (i > 0) {
          channels[type].splice(i, 1);
          if (this[guildID].messages[type])
            this[guildID].messages[type].splice(i, 1);
          this.save();
          return true;
        }
      } else {
        if (channels[type] === channelID) {
          delete channels[type];
          this.save();
          return true;
        }
      }
    }
  },

  delete: function (guildID)
  { // Delete the data of the given server id
    delete this[guildID]; // delete the storage for the server
    fs.removeSync(`./data/tmp/${guildID}`);
  },
  clear: function ()
  { // Clear out every data from every server.
    for(var id in this) {
      this.delete(id);
    }
  },
  write: (guildID, fileName, txt) => {
    fs.writeFileSync(`./data/tmp/${guildID}/${fileName}.txt`, txt);
  },
  read: (guildID, fileName) => {
    return fs.readFileSync(`./data/tmp/${guildID}/${fileName}.txt`, "utf8");
  },
  readFixedFile: (folder, fileName) => {
    // Didn't knew where else to put it since it require fs
    return fs.readFileSync(`./data/${folder}/${fileName}.txt`, "utf8");
  }
};


const data = Object.create(proto);
data.load();

module.exports = data;
