/**
 * Created by Sagar on 31/7/14.
 */

path='http://lol.sagar.appbase.io/lol/rofl'
vertex = {prop:'val'}
timestamp = 0;

Appbase.debug.ab.network.properties.listenUseful(path,function(error,vertex){
    console.log(error,vertex);
},function(error,vertex){
    console.log(error,vertex);
});


data = ['prop'];

ab.network.properties.remove(path,data,false,function(error,vertex){console.log('d',error,vertex)})