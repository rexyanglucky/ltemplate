function Vue(options) {
	const self = this;
	options=options||{};
	const {el,data,template} = options;
	let mountDiv = null;
	let templateStr='';
	this.data = data;
	//将this.data 扩展到this上
	Object.assign(this,this.data);
	if(template){
		let tlist = document.querySelectorAll(template);
		if(tlist&&tlist.length>0){
			console.log(tlist);
			templateStr=tlist[0].innerHTML;
		} else {
			templateStr=template;
		}
	}
	let domTree=null;
	let curdom={};
	complie(templateStr,{},function(ele,stack){
		let preTag=stack[stack.length-1];
		let predom=null;
		if(preTag && !preTag.isHandle){
			let predom=new element(preTag.tagName,preTag.attribute,preTag.data);
			preTag.dom=predom;
			preTag.isHandle=true;
			//首次pop 初始化根节点
			if(!domTree){
				domTree=predom;
				return;
			}
			let grandTag=domTree;
			let k = stack.length-2;
			while(k>=0){
				let p=stack[k];
				if(p.isHandle&&p.dom){
					grandTag=p.dom;
					break;	
				}
				k--;
			}
			grandTag.pushChildren(predom);
		}
		if(!ele.isHandle){
			curdom = new element(ele.tagName,ele.attribute,ele.data);
			preTag.dom.pushChildren(curdom);
		}
	});
	console.log(domTree);
	
	// this.genElement(domTree);
	let codeStr = genCode(domTree);
	console.log(codeStr);
	// let func =new Function(codeStr)
	let r =	new	Function(`with(this){${codeStr};}`);
	let vdom = r.call(this);
	if(vdom){
		console.log(vdom);
		let realDom = vdom.toRealDom();
	}

	if(el){
		mountDiv = document.querySelectorAll(el)[0];
	}
	/*	value:属性的值
		writable:是否可写，默认false
		configurable:是否可配置  
		enumerable:是否可枚举 默认false
		get:
		set:*/

	Object.defineProperty(this,'t',{
		value:1,
		// writable:false,
		// configurable:false,
		// enumerable:false
	})
	Object.defineProperty(this,'$el',{value:mountDiv});
	Object.defineProperty(this,'$options',{value:options})
	Object.defineProperty(this,'$templateStr',{value:templateStr})
	if(vdom){
		Object.defineProperty(this,'$realDom',{value:realDom})
	}
	// this.$el=mountDiv;
	// this.$options=options;
	// this.$templateStr=templateStr;
	this.$mount();

}
Vue.prototype.$mount=function(){
	if(this.$el){
		// this.$el.innerHTML=this.$templateStr;
		console.log(this.$realDom);
		if(this.$realDom){
			this.$el.appendChild(this.$realDom);
		}
	}
}
Vue.prototype.genElement=function(element){
	var codeStr = '';
	if(element.isfor){
		renderList(element);
	}
	if(element.isif){
		let exp = element.weakMap['v-if'];
		console.log(exp);
		if(exp)
		{
			let r =	new	Function(`with(this){return ${exp};}`);
			// eval(`function r(){return ${exp};console.log(123);}`);
			let t = r.call(this);
			
			element.isif=false;
			delete element.weakMap['v-if'];
			//判断该元素是否存在于真实dom中 相对应的是isshow 存在于真实dom中但是不显示
			element.isNotExists = !Boolean(t);
		}
	}
	if(element.iselse){
		let exp=element.weakMap['v-else'];
	}
	for(var k = 0, l = element.children.length; k < l; k++){
		var c = element.children[k];
		this.genElement(c);
	}
}

/*解析状态枚举
	依次为 
	1.标记打开状态(Tag open)  遇到<符号时 标记
	2.标记名称状态(Tag name)  遇到[a-zA-Z]符号时 标记 
	3.标记属性状态(Attribute Name) 遇到空格或者空白字符时标记 自己添加
	4.数据状态(Data)		 遇到>符号时 标记
	5.关闭标记打开状态(Close tag open state)
*/
let parseStageObj={
	TagOpen:'TagOpen', 
	TagName:'TagName',
	AttributeName:'AttributeName',
	Data:'Data',
	ClosingTag:'ClosingTag',
	CloseTag:'CloseTag'
}
function isWhite(str){
	let reg=new RegExp('[\\r\\n\\f\\t\\s]');
	return reg.test(str);
}
function isTagName(str){
	let reg =new RegExp('[a-zA-Z]');
	return reg.test(str);
}
function isTagOpen(str){
	return str === '<';
}
//标签闭合
function isTagClose(str){
	return str === '>';
}
//标签开始关闭
function isTagEnding(str){
	return str==='/';
}

let tree=null;
let tagStack=[];
/*
*将模板转换为虚拟dom
*/
function complie(tpl,data,nextToken){
	tpl=tpl.replace(/[\r\n]/gi,'').replace(/[\s]+/gi,' ').replace(/<!--.*-->/gi,'').replace(/>([^>^<]*)</gi,'><textnode>$1</textnode><');
	// console.log(tpl);
	this.state=parseStageObj.CloseTag;
	let k = 0;
	let tagObj={tagName:'',attribute:'',data:''}
	while(k<tpl.length){
		const char=tpl[k]
		if(isTagOpen(char)){
			if(this.state===parseStageObj.CloseTag){
				this.state=parseStageObj.TagOpen;
			} else if(this.state===parseStageObj.Data) {//子节点开始 或者是本标签要闭合
				if(tpl.length>k+1){
					let nextChar=tpl[k+1]
					if(nextChar === '/'){
						this.state=parseStageObj.ClosingTag;
						k++;
						continue;
					} else {
						this.state=parseStageObj.TagOpen;
					}
				}
				
			}
		}
		else if(isTagName(char)&&this.state===parseStageObj.TagOpen){
			this.state=parseStageObj.TagName;
		}
		else if(isWhite(char)){			
			//<tagName 后面的空白
			if(this.state===parseStageObj.TagName){
				this.state=parseStageObj.AttributeName;
			}
		}
		else if(isTagClose(char)){
			if((this.state===parseStageObj.TagName||this.state===parseStageObj.AttributeName)){
				this.state=parseStageObj.Data;
				k++;
				continue;
			} else {
				if(this.state=parseStageObj.ClosingTag){
					this.state=parseStageObj.CloseTag;
				}
			}
		}
		else if(isTagEnding(char)){
			this.state=parseStageObj.ClosingTag;
		}


		k++;


		/*TagOpen:'TagOpen',
		TagName:'TagName',
		AttributeName:'AttributeName',
		Data:'Data',
		CloseTag:'CloseTag'*/
		switch(this.state){
			case parseStageObj.TagOpen:
			{
				//下次tagOpen 时 将tagObj还原 
				tagObj={tagName:'',attribute:'',data:''};
			}
			break;
			case parseStageObj.TagName:
			{
				tagObj.tagName+=char;

				//判断tagName结束时 将当前tagName压入栈
				if(isWhite(tpl[k]) || isTagClose(tpl[k])){
					if(tagObj&&tagObj.tagName){
						tagStack.push(tagObj);
					}
				}
			}
			break;
			case parseStageObj.AttributeName:
				tagObj.attribute+=char;
			break;
			case parseStageObj.Data:
				tagObj.data+=char;
			break;
			case parseStageObj.CloseTag:
			{
				let t=tagStack.pop();
				if(t&&t.tagName){
					// console.log(t);
					//子元素弹出后，将上层元素设置为当前tagObj 子元素后的内容作为其上层元素的Data
					// tagObj=tagStack[tagStack.length-1];
					nextToken(t,tagStack);

					this.state=parseStageObj.Data;
				}
			
				// tagObj={tagName:'',attribute:'',data:''};

			}
			break;
		}
	}
	let t=tagStack.pop();
	if(t&&t.tagName){
		nextToken(t,tagStack);
	}
	console.log(tagStack);
}

let directObj={
	'v-if':'v-if',
	'v-for':'v-for',
	'v-else':'v-else',
	'v-on':'v-on',
	'v-bind':'v-bind'
/*	v-if,
	v-for,
	v-else,
	v-on,
	v-bind
*/
}


//创建虚拟的text元素，供无标签的文本使用
function element(tagName,props,value,children){
	this.tagName=tagName;
	this.propText = props;
	// this.props=props;
	this.children=children||[];
	this.value=value;
	let p=[];
	this.weakMap={};
	Object.defineProperty(this,'props',{
		// writable:true,
		configurable:true,
		enumerable:true,

		get:function(){
			return  p;
		},
		set:function(value){
			while(value){
				let keyindex=value.indexOf('=');
				if(keyindex<0){ // 如果沒有等號説明是獨立的屬性 以空格分隔
					console.log(value);
					let varr = value.split(' ');
					console.log(varr);
					varr.forEach(item=>{
						if(item){
							p.push({key:item,value:''});
							this.weakMap[item]='';
						}
					})
					value='';
					continue;
				}
				let key= value.substring(0,keyindex);
				//考慮沒有值的屬性
				let varr = key.split(' ');
				varr.forEach((item,index)=>{
					if(item && index < varr.length - 1){
						p.push({key:item,value:''});
						this.weakMap[item]='';
					}
				})
				key = varr[varr.length - 1];

				value=value.slice(keyindex);
				let attr={key:key,value:''};
				value =value.replace(/^=[\r\n\t\s]*/,'');
				let quoteTag =value[0];
				if(quoteTag && (quoteTag==="'" || quoteTag ==='"')){

					let reg=new RegExp(quoteTag+"([^"+quoteTag+"]*)"+quoteTag+"[\s]*","gi");
					if(reg.test(value)){
						let match = value.match(reg);
						attr.value=match[0].replace(/"/gi,'');
						value=value.slice(match[0].length+2-1);
					}
				}
				p.push(attr);
				this.weakMap[key]=attr.value;
			}
		}
	})
	this.props=props;

	if(this.weakMap.hasOwnProperty(directObj['v-if'])){
		this.isif=true;
	}
	if(this.weakMap.hasOwnProperty(directObj['v-for'])){
		this.isfor=true;
	}
	if(this.weakMap.hasOwnProperty(directObj['v-else'])){
		this.iselse=true;
	}
}
element.prototype.pushChildren = function(child){
	this.children.push(child);

}
/*
* 将虚拟dom转换为真实dom字符串
*/
element.prototype.toString=function(){
	//todo 将模板语法映射为真实js
	let ele= this;
	let str='';
}
//将虚拟dom转换为真实dom
element.prototype.toRealDom=function(){
	let vdom = this;
	let rdom=null;
	if(!vdom.isNotExists){
		if(vdom.tagName==='textnode'){
			rdom = document.createTextNode(vdom.value);
		}
		else{
			rdom = document.createElement(vdom.tagName);
		 	vdom.props.forEach(item=>{
			 		if(item){
						rdom.setAttribute(item.key,item.value);
			 		}
				});
				vdom.children.forEach(item=>{
					let c = item.toRealDom();
					if(c){
						rdom.appendChild(item.toRealDom());
					}
				})

		}
	}
	return rdom;

}


function vElement(tagName,props,value,children){
	this.tagName=tagName;
	this.children=children||[];
	this.value=value;
	this.props=props;
}
//将虚拟dom转换为真实dom
vElement.prototype.toRealDom=function(){
	let vdom = this;
	let rdom=null;
	if(vdom.tagName==='textnode'){
		rdom = document.createTextNode(vdom.value);
	}
	else{
		rdom = document.createElement(vdom.tagName);
	 	vdom.props.forEach(item=>{
		 		if(item){
					rdom.setAttribute(item.key,item.value);
		 		}
			});
			vdom.children.forEach(item=>{
				if(item){
					try{
						let c = item.toRealDom();
						if(c){
							rdom.appendChild(item.toRealDom());
						}
					}
					catch(err){console.log(err)}
				}
			})

	}
	return rdom;

}
function CreateVElement(tagName,props,value,children){
	let p = [];
	while(props){
		let keyindex=props.indexOf('=');
		if(keyindex<0){ // 如果沒有等號説明是獨立的屬性 以空格分隔
			console.log(props);
			let varr = props.split(' ');
			console.log(varr);
			varr.forEach(item=>{
				if(item){
					p.push({key:item,value:''});
				}
			})
			value='';
			continue;
		}
		let key= props.substring(0,keyindex);
		//考慮沒有值的屬性
		let varr = key.split(' ');
		varr.forEach((item,index)=>{
			if(item && index < varr.length - 1){
				p.push({key:item,value:''});
			}
		})
		key = varr[varr.length - 1];
		props=props.slice(keyindex);
		let attr={key:key,value:''};
		props =props.replace(/^=[\r\n\t\s]*/,'');
		let quoteTag =props[0];
		if(quoteTag && (quoteTag==="'" || quoteTag ==='"')){

			let reg=new RegExp(quoteTag+"([^"+quoteTag+"]*)"+quoteTag+"[\s]*","gi");
			if(reg.test(props)){
				let match = props.match(reg);
				attr.value=match[0].replace(/"/gi,'');
				props=props.slice(match[0].length+2-1);
			}
		}
		p.push(attr);
	}
	let c=[];
	children.forEach(item=>{
		if(Array.isArray(item) && item.length>0){
			item.forEach(i=>{
				c.push(i);
			})
		} else{
			c.push(item);
		}
	})

	let v = new vElement(tagName,p,value,c);
	return v;
}

function genCode(element){
	if(element.isfor){
		let exp=element.weakMap['v-for'];
		if(exp){
			let keyword='in';
			let arr = exp.split(keyword);
			if(arr && arr.length<2){throw new Error('v-for 参数错误')}
			let val = arr[1];
			let iteratorArr=arr[0].split(',');
			// item index
		    element.isfor =false;
			delete element.weakMap['v-for'];
			let func = `function (${iteratorArr[0]},${iteratorArr[1]}){
		    	 ${genCode(element)};
		    }`;
		    return	`return renderList(${val},${func})`;
		}
		return '';
	}
	if(element.isif){
		let codeStr = "";
		let exp = element.weakMap['v-if'];
		if(exp)
		{
			
			codeStr += `let a = ${exp};if(a){${genNormal(element)}}`;
		}
		return codeStr;
	}
	if(element.iselse){
		let exp=element.weakMap['v-else'];
	}
	// for(var k = 0, l = element.children.length; k < l; k++){
	// 	var c = element.children[k];
	// 	this.genElement(c);
	// }
	else {
		let codeStr = "";
		codeStr += `${genNormal(element)}`;
		return codeStr;
	}
	
}
function genNormal(element){
	let childArr=[];
	for(let k = 0,l = element.children.length;k < l;k++){
		if(element.children[k]){
			childArr.push(`function(){${genCode(element.children[k])}}()`);
		}
	}
	console.log(childArr);
	return `return CreateVElement('${element.tagName}',${element.propText?`'${element.propText}'`:null},${element.value?`'${element.value.replace(/{{([^}][^}]+)}}/gi,`'+$1+'`)}'`:null},[${childArr.join(",")}])`;
}
function genChildren(){

}
function renderList(val,render){
	let clist =[];
	if(val){
		if(Array.isArray(val)){
			for(k=0,l=val.length;k<l;k++){
				clist.push(render(val[k],k));
			}
		};
	}
	return clist;
}

// function genElement(element){
// 	let str = `createElement(${element.tagName},${element.props},${element.value},${element.children})`;
// 	if()
// }