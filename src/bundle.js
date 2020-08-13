const __req = function (path) {
		const mem = {};
		const modules = {
"/home/ali/Devs/nodejs/tools/src/tools.js":function (){
const __exp={};
// -----------------------------  functional tools  -----------------------------
const combine = (fst, ...fns) => (...params) => fns.reduce((p, fn) => fn(p), fst(...params));
const curry = (fn, ...args) => (...newargs) => fn(...args, ...newargs);
const fork = (...fns) => (...params) => fns.map(fn => fn(...params));
const extract = (obj) => (prop) => obj[prop];
const guard = (fn, ...guards) => (...p) => guards.every(f => f(...p))  && fn(...p);
const forward = v => v;
const deadFn = function deadFn() { };
function opt(origin, o={}) {
    let switchs = expandKeys({
        undefined: ()=> origin,
        'object,function': (key)=> o[key]
    })
    function f(key) { return switchs[typeof o[key]](key);}
    f.data = o;
    return f;
}
const _route = {
    function: (f, ...p)=> f(...p),
    object: (switchs, ...p)=>{
        let key = switchs._(...p);
        return _route[typeof switchs[key]](switchs[key], ...p);
    }
}
function route (switchs) {
    switchs = expandKeys(switchs);
    return (...p)=> _route.object(switchs, ...p);
}
function err (msg) {throw Error(msg);}
__exp.combine = combine;
__exp.curry = curry;
__exp.extract = extract;
__exp.fork = fork;
__exp.guard = guard;
__exp.forward = forward;
__exp.deadFn = deadFn;
__exp.opt = opt;
__exp.route = route;
__exp.err = err;
// -----------------------------  acronyms  -----------------------------
__exp.c = combine;
__exp.u = curry;
__exp.x = extract;
__exp.E = fork;
__exp.O = guard;
__exp.f = forward;
__exp.d = deadFn;

// -----------------------------  objects tools  -----------------------------
__exp.keys = keys;
__exp.resKeys = resKeys;
__exp.isObject = isObject;
__exp.isPartialEqual = isPartialEqual;
__exp.flattenKeys = flattenKeys;
__exp.expandKeys = expandKeys;

function keys (o) { return Object.keys(o);}
function resKeys (o) { return keys.reduce(obj, key => obj[key], this);}
function isObject(o) { return Object.prototype.toString.call(o) === "[object Object]"; }

function expandKeys(o, delimiter = ',', out = {}) {
    keys(o).forEach(key => {
        let value = isObject(o[key]) ? expandKeys(o[key], delimiter) : o[key];
        key.split(delimiter).map(k => k.trim()).forEach(k => out[k] = value);
    });
    return out;
}

function isPartialEqual(a, b) {
    if (typeof a !== typeof b)
        return false;
    return typeof a === 'object' ? !Object.keys(a).some(key => !isPartialEqual(a[key], b[key])) : a === b;
}
function flattenKeys(o, path = '', delimiter = ',', out = {}) {
    Object.keys(o).forEach(key => typeof o[key] === 'object' ?
        flattenKeys(o[key], path + key + delimiter, delimiter, out) : out[path + key] = o[key]);
    return out;
}

// -----------------------------  extending Array  -----------------------------

Array.prototype.add = function (elm) { this.push(elm); }
Array.prototype.remove = function (elm) {
    let i = this.findIndex((x) => x === elm);
    return this.removeAt(i);
};
Array.prototype.removeAt = function (index, count = 1) {
    if (index < this.length && index >= 0) {
        this.splice(index, count);
        return true;
    }
    return false;
};
Array.prototype.forEachRight = function (fn) {
    for (let index = this.length - 1; index > -1; index--) {
        const element = this[index];
        fn(element, index, this);
    }
};
Array.prototype.last = function () { return this[this.length - 1]; };

// -----------------------------  extending String  -----------------------------

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};
String.prototype.last = function () {
    return this[this.length - 1];
};

return __exp;
},"/home/ali/Devs/nodejs/tools/src/General State.js":function (){
const __exp={};
const { forward, deadFn, keys, opt, guard, route, err } = __req(`/home/ali/Devs/nodejs/tools/src/tools.js`);

__exp.createRouter = function () {
    const virtualListeners = [];
    virtualListeners.forEach = deadFn;
    virtualListeners.add = (f, o1, path) => o1[path] = [f];

    const deadSet = { add: deadFn, delete:deadFn };
    const _stars = {0:',', 1:',*'};

    const values = {};
    const watchers = opt(virtualListeners);
    const cleaners = opt(virtualListeners);
    const setters = opt(forward);
    const getters = opt(forward);
    const sets = opt({
        add: route({
            undefined: (_, path) => sets[path] = deadSet,
            string: (child, anc) => { sets[anc] = new Set().add(child); values[anc] = construct(anc + ","); },
            _: (child) => typeof child,
        }),
        delete: deadFn
    });

    const routerHandler = {
        set({ route }, prop, value) {
            switch (prop[0]) {
                case '+': addListener(watchers, route + prop.slice(1), value); break;
                case '-': addListener(cleaners, route + prop.slice(1), value); break;
                case '#': setters.data[route + prop.slice(1)] = value; break;
                case '$': getters.data[route + prop.slice(1)] = value; break;
                default: 
                    let path = route + prop;
                    set(setters(path)(value), path); break;
            }
            return true;
        },
        get({ route }, prop) {
            switch (prop[0]) {
                case '-': switch (prop[1]) {
                    case '+': watchers.data[route + prop.slice(2)] = virtualListeners; break;
                    case '-': cleaners.data[route + prop.slice(2)] = virtualListeners; break;
                }; break;
                default: return get(route + prop);
            }
        },
        deleteProperty({ route }, prop) {
            del(route + prop);
            return true;
        }
    }
    const set = guard(route({
        object: (val, path) => { path += ','; keys(val).forEach(k => set(val[k], path + k)); },
        "number,string": {
            undefined: (val, path) => {
                values[path] = val;
                splitAncestors(path).forEach(([anc, ...children]) => {
                    sets(anc).add(children[0], anc);
                    watchers(anc).forEach(f => f(values[anc], ...children));
                    watchers(anc + stars(children.length)).forEach(f => f(values[path], ...children));
                });
            },
            "number,string": (val, path) => {
                if (val === values[path]) return;
                let ancestors = splitAncestors(path);
                emit(ancestors, path, cleaners, 'Right');
                values[path] = val;
                emit(ancestors, path, watchers);
            },
            _: (_, path) => typeof values[path],
        }, _: (val) => typeof val,
    }),
        (val, path) => typeof val === typeof values[path] || values[path] === undefined || err('set failed path: ' + path));

    const stars = route({
        undefined: (n) => _stars[n] = ',*'+stars(n-1),
        string: (n) => _stars[n],
        _: (n) => typeof _stars[n]
    });

    function get(path) { return getters(path)(values[path]); }

    function del(path) {
        if (values[path] === undefined) return;
        emit(splitAncestors(path), path, cleaners, 'Right');
        values[path] = undefined;
        let index = path.lastIndexOf(',');
        sets[path.slice(0, index)].delete(path.slice(index + 1));
    }
    function emit(ancestors, path, o1, r = '') {
        ancestors['forEach' + r](([a, ...children]) => {
            o1(a).forEach(f => f(values[a], ...children));
            o1(a+stars(children.length)).forEach(f => f(values[path], ...children));
        });
    }
    function splitAncestors(path) {
        let result = [[path]];
        let index = path.lastIndexOf(','), ancestor = path.slice(0, index), keys = [path.slice(index + 1)]; path = ancestor;
        while (index !== -1) {
            result.push([ancestor, ...keys])
            index = ancestor.lastIndexOf(','), ancestor = ancestor.slice(0, index), keys.unshift(path.slice(index + 1)), path = ancestor;
        }
        return result;
    }
    function addListener(w, path, f) { w(path).add(f, w.data, path); }
    function construct(route) {
        sets[route.slice(0, -1)] = new Set();
        return new Proxy({ route }, routerHandler);
    };
    return construct('');
}

return __exp;
},"index.js":function (){
const __exp={};
const tools = __req(`/home/ali/Devs/nodejs/tools/src/tools.js`);
const {createRouter} = __req(`/home/ali/Devs/nodejs/tools/src/General State.js`);

__exp = {...tools, createRouter};

return __exp;
}};
return mem[path] || (mem[path] = modules[path]());
}

const bundle = module.exports=__req("index.js")