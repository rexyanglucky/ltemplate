function Vue(options) {
	options=options||{};
	const {el,data,template} = options;
	let mountDiv = null;
	let templateStr='';
	
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
	// this.$el=mountDiv;
	// this.$options=options;
	// this.$templateStr=templateStr;
	this.$mount();
}
Vue.prototype.$mount=function(){
	if(this.$el){
		this.$el.innerHTML=this.$templateStr;
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
	console.log(tpl);
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
	console.log(tagStack);
}

/*
* 将虚拟dom转换为真实dom字符串
*/
function renderDom(element,data){

}

//创建虚拟的text元素，供无标签的文本使用
function element(tagName,props,value,children){
	this.tagName=tagName;
	this.props=props;
	this.children=children||[];
	this.value=value;
}
element.prototype.pushChildren = function(child){
	this.children.push(child);
}
element.prototype.toString=function(){
	//todo 将模板语法映射为真实js
	let ele= this;
	let str='';
}
