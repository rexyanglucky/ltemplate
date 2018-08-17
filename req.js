var http = require('http');

var req=http.request('http://campusrd2.zhaopin.com:8097/api/user/prelogin', function(res){
	res.on('data', (chunk) => {
    console.log(`响应主体: ${chunk}`);
  });
  res.on('end', () => {
    console.log('响应中已无数据。');
  });
})
req.end();



