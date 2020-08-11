const {createRouter} = require("../src/General State.js");

describe('general state', ()=> {
	let $;
	beforeEach(()=>{
		$ = createRouter();
	});
	it('can not access path before initialization', ()=> {
		let test = () => {
			let list = $['list'];
			list['nums']=[1];
		}
		expect(test).toThrow();
	});
	it('should init list,sum to 0', ()=>{
		$['list,sum'] = 0;
		let list = $['list'];
		expect($['list,sum']).toBe(0);
		expect(list['sum']).toBe(0);
	});
	it('can set sum in different ways', ()=> {
		$['list,sum'] = 0;
		let list = $['list'];
		expect(list['sum']).toBe(0);
		list['sum'] = 2;
		expect(list['sum']).toBe(2);
		$['list,sum']+=10;
		expect(list['sum']).toBe(12);
		list['sum']+=10;
		expect(list['sum']).toBe(22);
	});
	it('can watch changes for a path', ()=> {
		$['list,sum'] = 0;
		let list = $['list'];
		list['+nums,*'] = (num)=>list['sum']+=num;
		list['nums'] = [1,2,3,4];
		expect(list['nums,0']).toBe(1);
		expect(list['nums,1']).toBe(2);
		expect(list['nums,2']).toBe(3);
		expect(list['nums,3']).toBe(4);
		expect(list['sum']).toBe(10);
	});
	it('can add listener on clearing', ()=> {
		$['list,sum'] = 0;
		let list = $['list'];
		list['+nums,*'] = (n)=> list['sum']+=n;
		list['-nums,*'] = (n)=> list['sum']-=n;
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
		$['#x10'] = (val)=> val*10;
		$['+x10'] = (val)=> $['currentX10'] = val;
		$['x10'] = 4;
		expect($['x10']).toBe(40);
		expect($['currentX10']).toBe(40);
	});
	it('can add action after(on) getting', ()=> {
		$['$x10'] = (val)=> val*10;
		$['+x10'] = (val)=> $['currentX10'] = val;
		$['x10'] = 4;
		expect($['x10']).toBe(40);
		expect($['currentX10']).toBe(4); // here it's 4 not 40 

		$['$name'] = (name) => 'hello '+name;
		$['name'] = 'ali';
		expect($['name']).toBe('hello ali');
	});
	it('can have 2 satrs (any to any)', ()=>{  // stars need to point to end of path
		$['+list,*'] = ()=> fail('should not executed')  // cause it's not the end of path
		$['+list,*,*'] = (val, p1, p2) => {
			expect(p1).toBe('nums');
			expect(p2).toBe('0');
		}
		$['list,nums'] = [1];
	});
	it('can have multiple listener ', ()=> {
		$['addIns,result'] = 0;
		let addIns = $['addIns'];
		$['+addIns,x'] = $['+addIns,y'] = (a)=> $['addIns,result']+=a;
		$['-addIns,x'] = $['-addIns,y'] = (a)=> $['addIns,result']-=a;
		addIns.x = 1;
		expect(addIns['result']).toBe(1);
		addIns.y = 2;
		expect(addIns['result']).toBe(3);
		addIns.y = 3;
		expect(addIns['result']).toBe(4);
		
	});
});
