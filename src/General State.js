const { forward, deadFn, keys, opt, guard, route, err } = require("./tools.js");

exports.createRouter = function () {
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
