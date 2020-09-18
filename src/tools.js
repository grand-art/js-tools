// -----------------------------  functional tools  -----------------------------
const pipe = (fst, ...fns) => (...params) =>
  fns.reduce((p, fn) => fn(p), fst(...params))
const aim = (fn, ...args) => (...newargs) => fn(...newargs, ...args)
const curry = (fn, ...args) => (...newargs) => fn(...args, ...newargs)
const fork = (...fns) => (...params) => fns.map(fn => fn(...params))
const sap = obj => prop => obj[prop]
const guard = (fn, ...guards) => (...p) =>
  guards.every(f => f(...p)) && fn(...p)
const forward = v => v
const deadFn = function deadFn () {}
const swich = switchs => {
  switchs = expandKeys(switchs)
  return (...p) => _swich.object(switchs, ...p)
}
const _swich = {
  function: (f, ...p) => f(...p),
  object: (switchs, ...p) => {
    const key = switchs._(...p)
    return _swich[typeof switchs[key]](switchs[key], ...p)
  }
}
function err (msg) {
  throw Error(msg)
}

exports.swich = swich
exports.curry = curry
exports.aim = aim
exports.pipe = pipe
exports.fork = fork
exports.guard = guard
exports.forward = forward
exports.sap = sap
exports.deadFn = deadFn
exports.err = err
exports.isEven = x => (x & 1) === 0
exports.isOdd = x => (x & 1) === 1
// -----------------------------  Object tools  -----------------------------
const each = (fn, o) => keys(o).forEach(k => fn(o[k], k, o))
const map = (fn, o) => keys(o).map(k => fn(o[k], k, o))
const reduce = (fn, mem, o) => keys(o).reduce((m, k) => fn(o[k], m, k, o), mem)
const find = () => (fn, o) => keys(o).find(k => fn(o[k], k, o))
const filter = () => (fn, o) => keys(o).filter(k => fn(o[k], k, o))
const every = () => (fn, o) => keys(o).every(k => fn(o[k], k, o))
const some = () => (fn, o) => keys(o).some(k => fn(o[k], k, o))
const at = (n = 0, o) => o[(n + o.length) % o.length]

exports.map = map
exports.each = each
exports.reduce = reduce
exports.find = find
exports.filter = filter
exports.every = every
exports.some = some
exports.at = at
// -----------------------------  JSON tools  -----------------------------
exports.keys = Object.keys
exports.resKeys = resKeys
exports.isObject = isObject
exports.isPartialEqual = isPartialEqual
exports.flattenKeys = flattenKeys
exports.expandKeys = expandKeys

const keys = Object.keys
function resKeys (keys, o) {
  return keys.reduce((obj, key) => obj[key], o)
}
function isObject (o) {
  return Object.prototype.toString.call(o) === '[object Object]'
}

function expandKeys (o, delimiter = ',', out = {}) {
  keys(o).forEach(key => {
    const value = isObject(o[key]) ? expandKeys(o[key], delimiter) : o[key]
    key
      .split(delimiter)
      .map(k => k.trim())
      .forEach(k => (out[k] = value))
  })
  return out
}

function isPartialEqual (a, b) {
  if (typeof a !== typeof b) return false
  return typeof a === 'object'
    ? !keys(a).some(key => !isPartialEqual(a[key], b[key]))
    : a === b
}
function flattenKeys (o, path = '', delimiter = ',', out = {}) {
  Object.keys(o).forEach(key =>
    typeof o[key] === 'object'
      ? flattenKeys(o[key], path + key + delimiter, delimiter, out)
      : (out[path + key] = o[key])
  )
  return out
}
