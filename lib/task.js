const fs = require('fs-extra');
const {strToArray, substringFrom, lastItem, replaceChar} = require('../lib/util.js');

function TaskBoard(mainMsg, input) {
  let mainArray = mainMsg.split("\n");
  [this.boards, this.headlines] = divide(mainArray);

  function divide(mainArray) {
    // Divide the maine text input in 2 array of board and healine
    const boards = [],
      headlines=[];
    boards.get = function (pos) { return this[pos[0]][pos[1]]; };
    headlines.isFirst = ! mainArray[0].startsWith(">");// Is the first line is a headline or not
    let lastState;

    for (const line of mainArray) {
      const inBoard = line.startsWith(">"); // is a task pinned to a board
      if (lastState !== inBoard) { // If it's a new board / headline
        if (inBoard)
            boards.push([]);
        else
          headlines.push([]);
      }
       // If it's blank, we ignore it
      if (line.trim() === ">") {
        lastState = true;
        continue;
      }
      if (inBoard)
        lastItem(boards).push(line);
       else
        lastItem(headlines).push(line);
      lastState = inBoard;
    }
    return [boards, headlines];
  }

  this.construct = function() {
    let txt = '',
      n=0;

    for (let i=0; i<this.headlines.length; i++) {
      if (this.headlines.isFirst)
        txt += this.headlines[i] + '\n';

      if (this.boards[i]) {
        if (this.boards[i].length === 0)
          txt += '> \n';
        else
          for (let t of this.boards[i]) {
            if (t) {
              n++;
              txt += t.substr(0,2) + n + t.substr(t.indexOf("─")-1)+ "\n";
            }
          }
      }
      if (! this.headlines.isFirst)
        txt += this.headlines[i] + '\n';
    }
    return txt;
  };

  this.getPos = function (index) {
    let accumulator = 0;

    for (let i=0; i<this.boards.length; i++) {
      let len = this.boards[i].length ;
      accumulator += len;
      if (index < accumulator) {
        return [i, index - (accumulator - len)];
      }

    }
  };

  this.add = function(str, i) {
    // ATtach a string to board[i]
    str = str.replace(/\n/g, ' ');
    const insert = `> * ─ ${str} ·`; // The string to insert
    this.boards[i].push(insert);
    let txt = this.construct();
    return txt;
  };

  this.del = function(index) {
    // delete one line from a board
    let i, j;
    let pos = this.getPos(index);
    i = pos[0];
    j = pos[1];
    this.boards[i].splice(j, 1);
    let txt = this.construct();
    return txt;
  };


  this.swap = function (i, j) {
    let posA = this.getPos(i);
    let posB = this.getPos(j);
    let foo = this.boards.get(posA);
    this.boards[posA[0]][posA[1]] = this.boards.get(posB);
    this.boards[posB[0]][posB[1]] = foo;
    return this.construct();
  };

  this.isNum = function (n) { // num = index + 1
    let sum = 0;
    for (let b of this.boards) {
      sum += b.length;
    }
    return ( ! isNaN(n) && (0 < n && n <= sum));
  };

  this.isNumBoard = function (n) {
    return ( ! isNaN(n) && (0 < n && n <= this.boards.length));
  };
}

module.exports = TaskBoard;
