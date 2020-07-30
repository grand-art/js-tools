interface AO {
    [prop:string]:any
}
type AF = (...args:any)=>any;

// -----------------------------  extending String  -----------------------------
interface String {
    capitalize : ()=>string,
    last: ()=>string,
}
// -----------------------------  extending Array  -----------------------------
interface Array<T> {
    remove: (elm:T)=>boolean,
    removeAt: (index:number, count?:number)=>boolean,
    forEachRight: (fn:AF)=>void,
    last: ()=>T
}
