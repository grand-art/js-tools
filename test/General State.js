const { createRouter } = require('../src/General State.js')
const { keys, map, isPartialEqual } = require('../src/tools')

describe('general state', () => {
  describe('setting values:', () => {
    let $
    beforeEach(() => {
      $ = createRouter()
    })
    it('can set number', () => {
      $.n1 = 1
      $.n2 = 2
      expect($.n1 + $.n2).toBe(3)
      expect($.n1 - $.n2).toBe(-1)
    })
    it('can set string', () => {
      $.s1 = 'hello'
      $.s2 = 'world'
      expect($.s1 + $.s2).toBe('helloworld')
      expect($.s1.length).toBe(5)
      expect($.s2.length).toBe(5)
      expect(Object.keys($.s1)).toEqual(['0', '1', '2', '3', '4'])
    })
    it("it can't change its value type once its initialized", () => {
      $.n1 = 1
      expect(() => ($.n1 = 'error')).toThrow()
      $.s1 = 'hello'
      expect(() => ($.s1 = 11)).toThrow()
    })
    it('can set boolean', () => {
      $.true = true
      $.false = false
      expect($.true).toBe(true)
      expect($.false).toBe(false)
      expect($.true && $.true).toBe(true)
      expect($.true && $.false).toBe(false)
      expect($.true || $.false).toBe(true)
    })
    it('can set functions', () => {
      $.adder = (x, y) => x + y
      expect($.adder(2, 3)).toBe(5)
      expect($.adder(21, 13)).toBe(34)
      expect($.adder.name).toBe('')
      expect($.adder.length).toBe(2)
    })
    it('can set object', () => {
      $.point = { x: 1, y: 2, f: ({ x, y }) => x + y, flag: true }
      const point = $.point
      expect($['point,x']).toBe(1)
      expect($['point,y']).toBe(2)
      expect(point.x).toBe(1)
      expect(point.y).toBe(2)
      expect(point.f(point)).toBe(3)
    })
    it('can get keys of object', () => {
      $.point = { x: 1, y: 2 }
      const point = $.point
      expect(keys($.point)).toEqual(['x', 'y'])
      expect(keys(point)).toEqual(['x', 'y'])
      expect(Object.keys(point)).toEqual(['x', 'y'])
      expect(Reflect.ownKeys($.point)).toEqual(['x', 'y'])
      expect(Reflect.ownKeys(point)).toEqual(['x', 'y'])
      expect(Object.getOwnPropertyNames(point)).toEqual(['x', 'y'])
    })
    it('can set Arary', () => {
      $.list = [10, 11, 12, 13, 4]
      const list = $.list
      expect(list[0]).toBe(10)
      expect(list[1]).toBe(11)
      expect(list[2]).toBe(12)
      expect(list[3]).toBe(13)
      expect(list[4]).toBe(4)
      expect(list.length).toBe(undefined)
      expect(keys(list).length).toBe(5)
      expect(
        isPartialEqual(
          map(x => x * 2, list),
          [20, 22, 24, 26, 8]
        )
      ).toBe(true)
    })
    it('can set Array of objects', () => {
      $.persons = [
        { id: 0, name: 'ali' },
        { id: 1, name: 'emi' },
        { id: 2, name: 'john' },
        { id: 3, name: 'sara' }
      ]
      const persons = $.persons
      expect($['persons,0,name']).toBe('ali')
      expect(persons[0].name).toBe('ali')
      expect($['persons,3,id']).toBe(3)
    })
  })
  describe('getting', () => {
    let $
    beforeEach(() => {
      $ = createRouter()
    })
    it('can create proxy from path', () => {
      $['o,n'] = 10
      const o = $.o
      expect(o.n).toBe(10)
      $['a,b,c,d'] = 21
      const a = $.a
      a.b.c.e = 33
      $['a,b,c,f'] = 'hi'
      expect(a.b.c.d).toBe(21)
      expect(a.b.c.e).toBe(33)
      expect(a.b.c.f).toBe('hi')
      expect(keys(a.b.c)).toEqual(['d', 'e', 'f'])
    })
    it('can get length of path', () => {
      $.o = {
        n: 1,
        s: 'str',
        f: x => x * 2,
        obj: { x: 2, result: 4 },
        ar: [1, 2, 3]
      }
      expect($['|o,obj']).toBe(2)
      expect($['|o,ar']).toBe(3)
      expect($['|o']).toBe(5)
      delete $['o,n']
      expect($['|o']).toBe(4)
      delete $['o,n']
      expect($['|o']).toBe(4)
      delete $['o,s']
      expect($['|o']).toBe(3)
      delete $['o,f']
      expect($['|o']).toBe(2)
      delete $['o,obj']
      expect($['|o']).toBe(1)
      expect($['o,obj']).toBe(undefined)
    })
  })
  describe('setting watchers and cleaners', () => {
    let $
    beforeEach(() => {
      $ = createRouter()
    })
    it('can get full path from givin start path', () => {
      let result
      $['+o'] = (val, ...path) => (result = path)
      $['o,a,b,c,d'] = 'e'
      expect(result).toEqual(['d', 'c', 'b', 'a'])
    })
    it('can watch changes on primaries when adding or removing', () => {
      let changed, removed
      $['+n'] = v => (changed = v)
      $['-n'] = v => (removed = v)
      $['+s'] = v => (changed = v)
      $['-s'] = v => (removed = v)
      $.n = 21
      expect(changed).toBe(21)
      $.s = 'hello'
      expect(changed).toBe('hello')
      $.n = 11
      expect(removed).toBe(21)
      expect(changed).toBe(11)
      $.s = 'world'
      expect(removed).toBe('hello')
      expect(changed).toBe('world')
    })
    it('can watch objects', () => {
      let changed, removed, ks
      $['+o'] = (v, ...k) => {
        changed = v
        ks = k
      }
      $['-o'] = (v, k) => {
        removed = v
        key = k
      }
      $.o = {
        n: 1,
        s: 'str',
        f: x => x * 2,
        obj: { x: 2, result: 4 },
        ar: [1, 2, 3]
      }
      $['o,n'] = 2
      expect(changed).toBe(2)
      expect(removed).toBe(1)
      expect(ks[0]).toBe('n')
      $['o,s'] = 'ding'
      expect(changed).toBe('ding')
      expect(removed).toBe('str')
      expect(ks[0]).toBe('s')
      $['+o,obj,x'] = v => ($['o,obj,result'] = $['o,f']($['o,obj,x']))
      $['o,obj,x'] = 11
      expect($['o,obj,result']).toBe(22)
      expect(ks).toEqual(['x', 'obj'])
      $['o,ar,2'] = 23
      expect(changed).toBe(23)
      expect(removed).toBe(3)
      expect(ks).toEqual(['2', 'ar'])
    })
    it("won't execute listeners when value didn't change", () => {
      let counterPlus = 0
      let counterMinus = 0
      $['+o,n'] = (v, ...k) => {
        counterPlus++
      }
      $['-o,n'] = (v, k) => {
        counterMinus++
      }
      $.o = {
        n: 1,
        s: 'str',
        f: x => x * 2,
        obj: { x: 2, result: 4 },
        ar: [1, 2, 3]
      }
      $['o,n'] = 10
      expect(counterPlus).toBe(2) // since it got changed twice 1st inited with 1 then assigned to 2
      expect(counterMinus).toBe(1) // only once cleaner got called
      $['o,n'] = 10
      $['o,n'] = 10
      $['o,n'] = 10
      expect(counterPlus).toBe(2)
      expect(counterMinus).toBe(1) // since value didn't change won't call any listeners
      $['o,n'] = 11
      expect(counterPlus).toBe(3)
      expect(counterMinus).toBe(2)
    })
    it('can watch when a value 1st time gets initialized', () => {
      let iniCount = 0
      let changeCount = 0
      $.$n = () => iniCount++
      $['+n'] = () => changeCount++
      $.n = 0
      $.n = 1
      $.n = 2
      expect(iniCount).toBe(1)
      expect(changeCount).toBe(3)
    })
    it('can watch when value gets deleted', () => {
      let delCount = 0
      cleanCount = 0
      $._n = () => delCount++
      $['-n'] = () => cleanCount++
      $.n = 0
      $.n = 1
      $.n = 2
      expect(delCount).toBe(0)
      expect(cleanCount).toBe(2)
      delete $.n
      expect(delCount).toBe(1)
      expect(cleanCount).toBe(3)
      delete $.n
      delete $.n
      delete $.n
      expect(delCount).toBe(1)
      expect(cleanCount).toBe(3)
    })
    it('can listen for initialization', () => {
      const props = []
      const vals = []
      $.$app = (val, prop) => {
        vals.push(val)
        props.push(prop)
      }
      $.app = {
        article: {
          header: 'title',
          footer: 'foot'
        }
      }
      expect(props).toEqual(['header', 'footer'])
      expect(vals).toEqual(['title', 'foot'])
    })
  })
  describe('some rective program', () => {
    let $
    beforeEach(() => {
      $ = createRouter()
    })
    it('shows hello world', () => {
      let result
      const logger = v => (result = v)
      $['+logger'] = logger
      $.logger = 'hello world'
      expect(result).toBe('hello world')
    })
    it('adding 2 numbers', () => {
      $['+adder,in1'] = $['+adder,in2'] = v => ($['adder,result'] += v)
      $['-adder,in1'] = $['-adder,in2'] = v => ($['adder,result'] -= v)
      $['adder,result'] = 0
      $['adder,in1'] = 2
      $['adder,in2'] = 3
      expect($['adder,result']).toBe(5)
      $['adder,in1'] = 21
      $['adder,in2'] = 35
      expect($['adder,result']).toBe(56)
      $.adder = { in1: 11, in2: 99 }
      expect($['adder,result']).toBe(110)
    })
    it('sum of array of numbers', () => {
      $['+ar,nums'] = v => ($['ar,sum'] += v)
      $['-ar,nums'] = v => ($['ar,sum'] -= v)
      $['ar,sum'] = 0
      $['ar,nums'] = [1, 2, 3, 4]
      expect($['ar,sum']).toBe(10)
      $['ar,nums,2'] *= 3
      expect($['ar,sum']).toBe(16)
      $['ar,nums'] = { 2: 20 }
      expect($['ar,sum']).toBe(27)
      delete $['ar,nums,2']
      expect($['ar,sum']).toBe(7)
      expect(keys($['ar,nums'])).toEqual(['0', '1', '3'])
      delete $['ar,nums,0']
      expect($['ar,sum']).toBe(6)
      expect(keys($['ar,nums'])).toEqual(['1', '3'])
      $['ar,nums'] = [11, 22]
      expect($['ar,sum']).toBe(37)
      expect(keys($['ar,nums']).sort()).toEqual(['0', '1', '3'])
    })
  })
})
