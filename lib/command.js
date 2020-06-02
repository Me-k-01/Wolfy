

function Command(client, dataBase, guildID) {
  data = dataBase[guildID];


  function channelDelete(channel) {
    const guild = channel.guild;
    if (guild) {
        i = data.channels.tasks.indexOf(channel.id);
      if (i>=0) {
        // If the user just deleted a stored channel, we need to remove it from the array
        data.channels.tasks.splice(i, 1);
        data.messages.tasks.splice(i, 1);
        data.save();
      } else if (data.taskCategory === channel.id) {
        // If it's the category stored, we also need to remove it from the array
        delete data.taskCategory;
        dataBase.save();
      }
    }
  }
}
