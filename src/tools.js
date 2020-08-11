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
exports.combine = combine;
exports.curry = curry;
exports.extract = extract;
exports.fork = fork;
exports.guard = guard;
exports.forward = forward;
exports.deadFn = deadFn;
exports.opt = opt;
exports.route = route;
exports.err = err;
// -----------------------------  acronyms  -----------------------------
exports.c = combine;
exports.u = curry;
exports.x = extract;
exports.E = fork;
exports.O = guard;
exports.f = forward;
exports.d = deadFn;

// -----------------------------  objects tools  -----------------------------
exports.keys = keys;
exports.resKeys = resKeys;
exports.isObject = isObject;
exports.isPartialEqual = isPartialEqual;
exports.flattenKeys = flattenKeys;
exports.expandKeys = expandKeys;

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
