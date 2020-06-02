const fs = require('fs-extra');
const TaskBoard = require('./lib/task.js')
const {strToArray, substringFrom, lastItem, replaceChar} = require('./lib/util.js');

const main = fs.readFileSync(`./data/tmp/${"template"}/${"task"}.txt`, "utf8");
let input;
input = "swap 1 2"
input = "add 20 6";
const cmd = strToArray(input);
let edit;


const taskBoard = new TaskBoard(main, input);
switch (cmd[0])
{
  case "add": case "a":
    let argI = 0,
      i = 0; // Which board
    // If a board number is provided at the beginning.
    if ( taskBoard.isNumBoard(cmd[1]) ) {
      i = parseInt(cmd[1])-1;
      argI = 1;
    }
    edit = taskBoard.add(substringFrom(cmd[argI], input), i);
    break;
  case "swap": case "swp": case "s":
    if ( taskBoard.isNum(cmd[1]) && taskBoard.isNum(cmd[2]) && cmd[1] != cmd[2]) {
      const i = parseInt(cmd[1])-1;
      const j = parseInt(cmd[2])-1;
      edit = taskBoard.swap(i, j);

    }
    break;
  case "delete": case "del": case "d":
    break;
  case "reset": case "res":
    break;
  default:
}
console.log(edit);
module.exports = TaskBoard;
