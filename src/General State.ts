import { ifExist } from "./tools";
const routerHandler =  {
    set(s:State, prop:string, value:any) {
        switch (prop[0]) {
            case '+': s.watch(prop.slice(1), value); break;
            case '-': s.onClean(prop.slice(1), value); break;
            case '#': s.setSetter(prop.slice(1), value); break;
            case '$': s.setGetter(prop.slice(1), value); break;
            default : s.set(prop, value); break;
        }
        return true;
    },
    get(s:State, prop:string){
        switch (prop[0]) {
            case '-': switch(prop[1]) {
                case '+' : s.clearAllWatchers(prop.slice(2)); break;
                case '-' : s.clearAllCleaners(prop.slice(2)); break;
            }
            default: return s.get(prop);
        }
    },
    deleteProperty(s:State, prop:string) {
        s.delete(prop);
        return true;
    }
}
export function createRouter(s = new State()):AO {
    return new Proxy(s, routerHandler);
}

class State {
    values: AO;
    watchers: { [prop: string]: AF[] };
    cleaners: { [prop: string]: AF[] };
    sets: { [prop: string]: Set<string> };
    setters: { [prop: string]: AF };
    getters: { [prop: string]: AF };
    constructor(public route = '', s = { values: {}, watchers: {}, cleaners: {}, sets: {}, setters:{}, getters:{} }) {
        this.values = s.values;
        this.watchers = s.watchers;
        this.cleaners = s.cleaners;
        this.sets = s.sets;
        this.setters = s.setters;
        this.getters = s.getters;
        this.sets[route.slice(0,-1)] = new Set();
    }
    get(path: string) { 
        path = this.route+path;
        return this.getters[path]? this.getters[path](this.values[this.route+path]):this.values[path] ; 
    }
    set(path: string, val: any) {
        let ap = this.route + path;
        if (this.values[ap] !== undefined && typeof val !== typeof this.values[ap]) throw Error('set failed for path: ' + ap);
        if (typeof val === 'object') {
            path+=',';
            Object.keys(val).forEach(k => this.set(path+ k, val[k]));
        }
        else this._setPrimary(ap, val);
    }
    _setPrimary(path: string, val: number | string) {
        if (this.values[path] === undefined) this._init(path, val);
        else if(this.values[path] !== (this.setters[path]? this.setters[path](val) : val)) this._assign(path, val);
    }
    _assign(path: string, val: number | string) {
        let ancestors = this.splitAncestors(path);
        ancestors.forEachRight(([a, ...keys]) => ifExist(this.cleaners[a], 'forEach', (f: AF) => f(this.values[a], ...keys)));
        ifExist(this.cleaners[path], 'forEach', (f: AF) => f(this.values[path]));
        ancestors.length > 0 && ifExist(this.cleaners[ancestors[0][0]+',*'], 'forEach', (f: AF) => f(this.values[path]));
        
        this.values[path] = this.setters[path]? this.setters[path](val) : val;
        
        ifExist(this.watchers[path], 'forEach', (f: AF) => f(this.values[path]));
        ancestors.length > 0 && ifExist(this.watchers[ancestors[0][0]+',*'], 'forEach', (f: AF) => f(this.values[path]));
        ancestors.forEach(([a, ...keys]) => ifExist(this.watchers[a], 'forEach', (f: AF) => f(this.values[a], ...keys)));
    }
    _init(path: string, val: number | string) {
        let ancestors = this.splitAncestors(path);
        this.values[path] = this.setters[path]? this.setters[path](val) : val;
        ifExist(this.watchers[path], 'forEach', (f: AF) => f(this.values[path]));
        ancestors.length > 0 && ifExist(this.watchers[ancestors[0][0]+',*'], 'forEach', (f: AF) => f(this.values[path]));
        ancestors.forEach(([a, ...keys]) => {
            (this.values[a] === undefined) && (this.values[a] = createRouter(new State(a+',', this)));
            this.sets[a].add(keys[0]);
            ifExist(this.watchers[a], 'forEach', (f: AF) => f(this.values[a], ...keys));
        });
    }
    watch (path:string, fn:AF) {
        path = this.route+path;
        this.watchers[path]?this.watchers[path].push(fn):this.watchers[path] = [fn];
    }
    onClean (path:string, fn:AF) {
        path = this.route+path;
        this.cleaners[path]?this.cleaners[path].push(fn):this.cleaners[path] = [fn];
    }
    setSetter(path:string, fn:AF) { this.setters[this.route+path] = fn; }
    setGetter(path:string, fn:AF) { this.getters[this.route+path] = fn; }
    clearAllWatchers (path: string) {
        this.watchers[this.route+path] = []; }
    clearAllCleaners (path: string) {
        this.cleaners[this.route+path] = []; }
    delete(path:string) {
        path = this.route + path;
        let ancestors = this.splitAncestors(path);
        ancestors.forEachRight(([a, ...keys]) => ifExist(this.cleaners[a], 'forEach', (f: AF) => f(this.values[a], ...keys)));
        ifExist(this.cleaners[path], 'forEach', (f: AF) => f(this.values[path]));
        ancestors.length > 0 && ifExist(this.cleaners[ancestors[0][0]+',*'], 'forEach', (f: AF) => f(this.values[path]));
        
        this.values[path] = undefined;
    }
    splitAncestors(path: string) {
        let result = [];
        let index = path.lastIndexOf(','), ancestor = path.slice(0, index), keys = [path.slice(index + 1)]; path = ancestor;
        while (index !== -1) {
            result.push([ancestor, ...keys])
            index = ancestor.lastIndexOf(','), ancestor = ancestor.slice(0, index), keys.unshift(path.slice(index + 1)), path = ancestor;
        }
        return result;
    }
}