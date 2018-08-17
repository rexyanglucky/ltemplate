function createElement(){

}
function ac(argument) {
	let a = list.length;
	if(a){
		createElement(div,'v-if="list.length"',,
			[function(){
				function r(item ,undefined){
	    		createElement(div,' v-for="item in list" data-attr="d=1" style="color: red"',,
	    			[function(){createElement(textnode,'', ,[])}(),function(){createElement(div,'',,[function(){createElement(textnode,'', ,[])}(),function(){let a = item.name;if(a){createElement(div,' v-if="item.name"',,[function(){createElement(textnode,'',{{item.name}},[])}()])}}(),function(){createElement(textnode,'', ,[])}(),function(){undefined}(),function(){createElement(textnode,'', ,[])}()])}(),function(){createElement(textnode,'', ,[])}()])
	    		};
	    if(Array.isArray(val)){
			for(k=0,l=val.length;k<l;k++){
				r(val[k],k);
			}
		}
	}()])}
}