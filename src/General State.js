const { guard, swich, err, keys, each, at } = require('./tools.js')
exports.createRouter = function () {
  const values = {}
  const initializers = {}
  const watchers = {}
  const cleaners = {}
  const deleters = {}

  const primaries = 'number,string,function,boolean'
  const enumerable = { enumerable: true, configurable: true }
  const noenumerable = { enumerable: false, configurable: true, writable: true }

  const routerHandler = {
    set ({ route }, prop, value) {
      switch (prop[0]) {
        case '$':
          addListener(initializers, route + prop.slice(1), value)
          break
        case '+':
          addListener(watchers, route + prop.slice(1), value)
          break
        case '-':
          addListener(cleaners, route + prop.slice(1), value)
          break
        case '_':
          addListener(deleters, route + prop.slice(1), value)
          break
        default:
          set(value, route + prop)
          break
      }
      return true
    },
    get (t, prop) {
      const route = t.route
      switch (prop[0]) {
        case '-':
          switch (prop[1]) {
            case '+':
              watchers.data[route + prop.slice(2)] = []
              break
            case '-':
              cleaners.data[route + prop.slice(2)] = []
              break
          }
          break
        case '$':
          return t
        case '|':
          return values[route + prop.slice(1)]
            ? values[route + prop.slice(1)].$.length
            : 0
        default:
          return values[route + prop]
      }
    },
    deleteProperty ({ route }, prop) {
      const path = route + prop
      const val = values[path]
      if (val !== undefined) {
        del(val, path)
        const [anc, child] = getAncestor(path)
        if (anc) {
          Object.defineProperty(values[anc].$, child, noenumerable)
          values[anc].$.length--
        }
      }
      return true
    },
    ownKeys (t) {
      return keys(t)
    }
  }
  const set = guard(
    swich({
      object: (val, path) => {
        const p = path + ','
        each((v, k) => set(v, p + k), val)
      },
      [primaries]: {
        undefined: (val, path) => {
          const ancestors = splitAncestors(path)
          let index = 1
          let created
          if (ancestors.length > 1) {
            do {
              created = false
              const anc = ancestors[index][0]
              const key = at(-1, ancestors[index++])
              let o = values[anc]
              if (o === undefined) {
                o = construct(anc + ',')
                created = true
              }
              o = o.$
              o.length++
              Object.defineProperty(o, key, enumerable)
            } while (
              ancestors.length > index &&
              (created || values[ancestors[index][0]] === undefined)
            )
          }
          values[path] = val
          emit(ancestors, val, initializers, watchers)
        },
        [primaries]: (val, path) => {
          if (val === values[path]) return
          const ancestors = splitAncestors(path)
          emitR(ancestors, values[path], cleaners)
          values[path] = val
          emit(ancestors, val, watchers)
        },
        _: (_, path) => typeof values[path]
      },
      _: val => typeof val
    }),
    (val, path) =>
      typeof val === typeof values[path] ||
      values[path] === undefined ||
      err('set failed path: ' + path)
  )

  const del = swich({
    object: (val, path) => {
      const p = path + ','
      each((v, k) => del(v, p + k), val)
      values[path] = undefined
    },
    [primaries]: (val, path) => {
      emitR(splitAncestors(path), val, cleaners, deleters)
      values[path] = undefined
    },
    _: val => typeof val
  })
  function emit (ancestors, val, ...os) {
    ancestors.forEach(([a, ...children]) =>
      os.forEach(o => o[a] && o[a].forEach(f => f(val, ...children)))
    )
  }
  function emitR (ancestors, val, ...os) {
    ancestors.reduceRight(
      (p, [a, ...children]) =>
        os.forEach(o => o[a] && o[a].forEach(f => f(val, ...children))),
      ''
    )
  }
  function splitAncestors (path) {
    const result = [[path]]
    let index = path.lastIndexOf(',')
    let ancestor = path.slice(0, index)
    const keys = [path.slice(index + 1)]
    path = ancestor
    while (index !== -1) {
      result.push([ancestor, ...keys])
      index = ancestor.lastIndexOf(',')
      ancestor = ancestor.slice(0, index)
      keys.push(path.slice(index + 1))
      path = ancestor
    }
    return result
  }
  function getAncestor (path) {
    const index = path.lastIndexOf(',')
    return [path.slice(0, index), path.slice(index + 1)]
  }
  function addListener (o, path, fn) {
    ;(o[path] || (o[path] = [])).push(fn)
  }
  function construct (route) {
    return (values[route.slice(0, -1)] = new Proxy(
      Object.defineProperties(
        { route, length: 0 },
        {
          route: noenumerable,
          length: noenumerable
        }
      ),
      routerHandler
    ))
  }
  const rootProxy = construct('')
  return rootProxy
}
