
<script type="text/javascript">
	vue.component("test",{
		template:"#test",
		props:[{
			name:"list",
			type:[Object]
			default:null
		}]
	})
</script>
<div type="text/x-template" id="test">
		<div v-if="list.length">
			<div  v-for="item in list" data-attr="d=1" style="color: red">
				<div>
					<div v-if="item.name">{{item.name}}</div>
					<div v-else>无</div>
				</div>
				<div  v-for="d in item.children" data-attr="d=1" style="color: red">
				<div>
					<div v-if="d.name">{{item.name}}</div>
					<div v-else>无</div>
				</div>
			</div>
			</div>
		</div>
</div>