/**
 * Created by Sagar on 31/7/14.
 */

path='http://lol.sagar.appbase.io/lol/rofl'
vertex = {prop:'val'}
Appbase.debug.ab.network.properties.patch(path,vertex,undefined,callback=function(vertex){console.log(vertex)})

