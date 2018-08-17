function LPromise(p){
  this.resolve= null;
  this.reject = null;
  try{
    let r = p(this.resolve,this.reject);
    setTimeout(() => {
      this.resolve&&this.resolve(r);
    }, 0);
    
  } catch(err){
    setTimeout(() => {
      this.reject&&this.reject(r);
    }, 0);
  }
}
LPromise.prototype.then=function(resolve){
  this.resolve=resolve;
}
LPromise.prototype.catch=function(reject){
  this.reject=reject;
}

let a =new LPromise(function(){console.log(1);return 2;});
a.then(r=>{console.log(r);});
a.catch(err=>{console.log(err)});


var b=new Promise(function(resolve,reject){
  console.log(3);
  resolve(2)
});
b.then(r=>{console.log(r);});
b.catch(err=>{console.log(err)});