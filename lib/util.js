//
// const strToArray = (str) => {
//   // transform str to a command arg array
//   return str.split(' ').filter(w => w !== '' );
// };
// const substringFrom = (kw, str) => {
//   // Find the text following a keyword
//   const i = str.toLowerCase().indexOf(kw.toLowerCase());
//   const j = i+kw.length+1;
//   if (i >= 0 && str.length > j)
//     return str.substring(j);
//   return '';
// };
const lastItem = (array) => {
  if (array && array.length > 0)
    return array[array.length - 1];
};
//
// const replaceChar = (str, char, i) => {
//   if(i > str.length-1)
//     return str;
//   return str.substr(0,i) + char + str.substr(i+char.length);
// };

module.exports = {lastItem};
