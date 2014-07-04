/**
 * Created by Sagar on 4/7/14.
 */


//setting global
Object.isEmpty = function (obj) {
    return Object.keys(obj).length === 0;
}

Object.clone = function (obj){
    return JSON.parse(JSON.stringify(obj));
}

Appbase = {
    debug:true
};

//Enclosing the whole code
(function () {
    //Name space
    ab = {
        util:{},
        network:{},
        firing:{},
        caching:{}
    }

    ab.util.cutLeadingTrailingSlashes = function(path){
        while(path.charAt(path.length - 1) == '/') {
            path = path.slice(0,-1);
        }

        while(path.charAt(0) == '/') {
            path = path.slice(1);
        }

        return path;
    }

    ab.util.front = function(path){
        path = ab.util.cutLeadingTrailingSlashes(path);
        return path.indexOf('/') == -1? path: path.slice(0,path.indexOf('/'));
    }

    ab.util.cutFront = function(path){
        path = ab.util.cutLeadingTrailingSlashes(path);
        return path.indexOf('/') == -1? '': path.slice(path.indexOf('/')+1);
    }

    ab.util.back = function(path){
        path = ab.util.cutLeadingTrailingSlashes(path);
        return path.lastIndexOf('/') == -1? path: path.slice(path.lastIndexOf('/')+1);
    }

    ab.util.cutBack = function(path){
        path = ab.util.cutLeadingTrailingSlashes(path);
        return path.lastIndexOf('/') == -1? '': path.slice(0,path.lastIndexOf('/'));
    }

    ab.util.uuid = function (){
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }

    ab.network.init = function() {

        var listenToUuid = function(uuid) {
            ab.socket.emit('get', uuid);
            ab.socket.on(uuid, function(obj) {
                !obj &&  amplify.publish('fromServer:data_not_found', false,uuid);

                obj && amplify.publish('fromServer:data_arrived', false,uuid,obj);

                amplify.publish('fromServer:'+uuid, false,uuid,obj);
            });
        }

        var putByUuid = function(obj) {
            ab.socket.emit('put', obj);
            amplify.publish('fromServer:data_pushed',false,obj.uuid);
        }

        amplify.subscribe('toServer:listen_to_data',function(uuid){
            listenToUuid(uuid);
        });

        amplify.subscribe('toServer:push_data',function(obj){
            putByUuid(obj);
        });

    }

    ab.caching.init = function(){
        ab.caching.inMemory = {};

        amplify.subscribe('fromServer:data_arrived',function(error,uuid,obj){
            if(!error){
                if(!ab.caching.inMemory[obj.uuid]){
                    ab.caching.inMemory[obj.uuid] = obj;
                    amplify.publish('fromCache:data_arrived_from_server',obj.uuid);
                } else if(ab.caching.inMemory[obj.uuid].timestamp > obj.timestamp ) {
                    ab.caching.inMemory[obj.uuid] = obj;
                    amplify.publish('fromCache:data_modified_by_server',obj.uuid);
                }
            } else {
                amplify.publish('fromCache:data_error_from_server',obj.uuid);
            }
        })

        amplify.subscribe('fromServer:data_not_found',function(error,uuid){
            amplify.publish('fromCache:data_not_found_on_server',uuid);
        })

        amplify.subscribe('toCache:data_modified_locally',function(uuid){
            amplify.publish('toServer:push_data',ab.caching.inMemory[uuid]);
        });

        ab.caching.get = function(uuid){
            var promise = new Promise(function(resolve,reject){
                if(ab.caching.inMemory[uuid]){
                    resolve(ab.caching.inMemory[uuid])
                }else {
                    var listener1 = amplify.subscribe('fromServer:'+uuid,function(arrived_uuid){
                        if(arrived_uuid == uuid){

                            resolve(ab.caching.inMemory[uuid])
                            amplify.unsubscribe('fromCache:'+uuid,listener1);
                        }
                    })

                    var listener2 = amplify.subscribe('fromCache:data_not_found_on_server',function(arrived_uuid){
                        if(arrived_uuid == uuid){
                            resolve(false);
                            amplify.unsubscribe('fromCache:data_arrived_from_server',listener1);
                            amplify.unsubscribe('fromCache:data_not_found_on_server',listener2);
                        }
                    })

                    var listener3 = amplify.subscribe('fromCache:data_error_from_server',function(arrived_uuid){

                    })

                }
            })

            return promise;
        }
    }

})()