const { createRouter } = require('../src/General State.js')
const { isPartialEqual } = require('../src/tools.js')

const $ = createRouter()

$.o1 = { a: 1, b: 2 }
$.o2 = ':o1'

console.log($.o2.a)
$.o1 = { a: 4, b: 22 }
console.log(isPartialEqual($.o1, $.o2))
