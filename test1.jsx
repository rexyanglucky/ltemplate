<template>
	<div v-for="item in list">
	<div v-if="item.name">{{d.name}}</div>
	<div v-else>无</div>
	</div>
</template>
export default {
	data:{
	list:[
	{name:'test',value:'123',isshow:false},
	{name:'test1',value:'1234',isshow:true},
	{name:'test2',value:'1235',isshow:true}
	]}

}

