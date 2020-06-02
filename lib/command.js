

function Command(client, dataBase, guildID) {
  const self = this;
  const data = dataBase[guildID];


  self.channel = {
    delete: (channel) => {
      const guild = channel.guild;
      if (guild) {
        let i = data.channels.tasks.indexOf(channel.id);
        if (i>=0) {
          // If the user just deleted a stored channel, we need to remove it from the array
          data.channels.tasks.splice(i, 1);
          data.messages.tasks.splice(i, 1);
          dataBase.save();
        } else if (data.channels.taskCategory === channel.id) {
          // If it's the category stored, we also need to remove it from the array
          delete data.taskCategory;
          dataBase.save();
        }
      }
    }
  };
}

module.exports = Command;
