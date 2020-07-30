import {createRouter} from "../src/General State"

describe('general state', ()=> {
    const $ = createRouter() ;
    $['list,sum'] = 0;
    let list = $['list'];
    beforeEach(()=>{
        list['sum'] =0;
        list['-+nums,*'];
        list['--nums,*'];
        list['nums'] = [0,0,0,0];
        $['#x10'] = undefined;
        $['$x10'] = undefined;
    });
    it('should init list,sum to 0', ()=>{
        expect($['list,sum']).toBe(0);
        expect(list['sum']).toBe(0);
    });
    it('can set sum in different ways', ()=> {
        expect(list['sum']).toBe(0);
        list['sum'] = 2;
        expect(list['sum']).toBe(2);
        $['list,sum']+=10;
        expect(list['sum']).toBe(12);
        list['sum']+=10;
        expect(list['sum']).toBe(22);
    });
    it('can watch changes for a path', ()=> {
        list['+nums,*'] = (num:number)=>list['sum']+=num;
        list['nums'] = [1,2,3,4];
        expect(list['nums,0']).toBe(1);
        expect(list['nums,1']).toBe(2);
        expect(list['nums,2']).toBe(3);
        expect(list['nums,3']).toBe(4);
        expect(list['sum']).toBe(10);
    });
    it('can add listener on clearing', ()=> {
        list['+nums,*'] = (n:number)=> list['sum']+=n;
        list['-nums,*'] = (n:number)=> list['sum']-=n;
        list['nums'] = [1,2,3,4];
        expect(list['sum']).toBe(10);
        delete list['nums,2'];
        expect(list['sum']).toBe(7);
        list['nums,2'] = 10;
        expect(list['sum']).toBe(17);
        list['nums'] = {2:20};
        expect(list['sum']).toBe(27);

    });
    it('can add action before(on) setting', ()=> {
        $['#x10'] = (val:number)=> val*10;
        $['+x10'] = (val:number)=> $['currentX10'] = val;
        $['x10'] = 4;
        expect($['x10']).toBe(40);
        expect($['currentX10']).toBe(40);
    });
    it('can add action after(on) getting', ()=> {
        $['$x10'] = (val:number)=> val*10;
        $['+x10'] = (val:number)=> $['currentX10'] = val;
        $['x10'] = 4;
        expect($['x10']).toBe(40);
        expect($['currentX10']).toBe(4); // here it's 4 not 40 

        $['$name'] = (name:string) => 'hello '+name;
        $['name'] = 'ali';
        expect($['name']).toBe('hello ali');
    });
});
