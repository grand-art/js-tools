// -----------------------------  object tools  -----------------------------
export function resObjKeys(obj:AO, keys:string[]) {
	return keys.reduce((obj, key) => obj[key], obj);
}
export function isPartialEqual(a:any, b:any):boolean {
	if (typeof a !== typeof b)
		return false;
	return typeof a === 'object' ? !Object.keys(a).some(key => !isPartialEqual(a[key], b[key])) : a === b;
}
export function flattenObjectByKey(target:AO, path = '', delimiter = ',', out:AO = {}) {
	Object.keys(target).forEach(key => typeof target[key] === 'object' ?
		flattenObjectByKey(target[key], path + key + delimiter, delimiter, out) : out[path + key] = target[key]);
	return out;
}
export function expandKeys(target:AO, delimiter = ',', out:AO = {}) {
	Object.keys(target).forEach(key => {
		let value = isObject(target[key]) ? expandKeys(target[key], delimiter) : target[key];
		let keys = key.split(delimiter).map(k => k.trim());
		keys.forEach(k => out[k] = value);
	});
	return out;
}
export function isObject(o:AO) { return Object.prototype.toString.call(o) === "[object Object]" }



// -----------------------------  functional tools  -----------------------------
export function ifExist(object:AO, type:string, ...params:any) { return object && object[type](...params); }
export function curry(fn:(...a:any)=>any, ...args:any) { return (...newargs:any) => fn(...args, ...newargs); }
export function extract(prop:string) { return (obj:AO) => obj[prop]; }
export function fork(...params:any) { return (...fns:AF[]) => fns.map(fn => fn(...params)); }
export function combine(...fns:AF[]) { return (...params:any[]) => fns.reduce((p, fn) => fn(...p), params) }
export function guard(fn:AF, ...guards:AF[]) { return (...params:any) => guards.every(f => f(...params)) && fn(...params); }


export function switcher(routes:AO, actions:AO, memory:AO = {}) {
	return memory['_'] = (...params:any) => _flow(routes, expandKeys(actions.constrains(memory, ...params), ',', { _params: [memory, ...params] }), actions);
}
export function _flow(routes:AO, flowParams:AO, actions:AO):any {
	if (typeof routes === 'string') return actions[routes](...flowParams._params);
	else if (Array.isArray(routes)) return routes.map(route => actions[route](...flowParams._params));
	else if (routes === undefined) return;
	let key = Object.keys(routes)[0];
	return _flow(routes[actions[key](...flowParams[key])], flowParams, actions);
}

// -----------------------------  extending String  -----------------------------

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};
String.prototype.last = function () {
    return this[this.length-1];
};

// -----------------------------  extending Array  -----------------------------

Array.prototype.remove = function (elm) {
    let i = this.findIndex((x:any )=> x === elm);
    return this.removeAt(i);
};
Array.prototype.removeAt = function (index, count = 1) {
    if (index < this.length) {
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
Array.prototype.last = function () {return this[this.length-1];};