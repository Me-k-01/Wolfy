const data = require('./lib/data.js')

data.write("template", "task", data.read("template", "task").replace(/>/g, "> "))
