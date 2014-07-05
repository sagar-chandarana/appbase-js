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
        ab.network.server = 'http://162.242.213.228:3000/';
        ab.network.socket = io.connect(ab.network.server);

        var listenToUuid = function(uuid) {
            ab.network.socket.emit('get', uuid);
            ab.network.socket.on(uuid, function(obj) {
                obj = (obj == 'false'?false:obj);

                !obj &&  amplify.publish('fromServer:data_not_found', false,uuid);

                obj &&  obj && amplify.publish('fromServer:data_arrived', false,uuid,obj);

                amplify.publish('fromServer:'+uuid, false,uuid,obj);
            });
        }

        var putByUuid = function(obj) {
            ab.network.socket.emit('put', obj);
            amplify.publish('fromServer:data_pushed',false,obj.id);
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
                obj.timestamp = parseInt(obj.timestamp);
                if(!ab.caching.inMemory[obj.id]){
                    ab.caching.inMemory[obj.id] = obj;
                    amplify.publish('fromCache:data_arrived_from_server',obj.id);
                } else if(ab.caching.inMemory[obj.id].timestamp > obj.timestamp ) {
                //} else  {
                    ab.caching.inMemory[obj.id] = obj;
                    amplify.publish('fromCache:data_modified_by_server',obj.id);
                }
            } else {
                amplify.publish('fromCache:data_error_from_server',obj.id);
            }
        })

        amplify.subscribe('fromServer:data_not_found',function(error,uuid){
            amplify.publish('fromCache:data_not_found_on_server',uuid);
        });

        amplify.subscribe('toCache:data_modified_locally fromCache:data_modified_locally',function(uuid){
            amplify.publish('toServer:push_data',ab.caching.inMemory[uuid]);
        });

        ab.caching.get = function(uuid){
            var promise = new Promise(function(resolve,reject){
                if(ab.caching.inMemory[uuid]){
                    resolve(ab.caching.inMemory[uuid])
                } else {
                    amplify.subscribe('fromServer:'+uuid,function(error,arrived_uuid,obj,topic,listenerName){
                        error && reject(error);

                        obj && resolve(ab.caching.inMemory[uuid]);
                        !obj && resolve(false);

                        amplify.unsubscribe(topic,listenerName);
                    })

                    amplify.publish('toServer:listen_to_data',uuid);
                }
            })

            return promise;
        }

        ab.caching.set = function(uuid,obj){
            ab.caching.inMemory[uuid] = obj;
            obj.id = uuid;
            obj.timestamp = new Date().getTime().toString();
            amplify.publish('fromCache:data_modified_locally',obj.id);
        }
    }

    ab.firing.init = function(){
        amplify.subscribe('fromCache:data_modified_by_server fromCache:data_modified_locally',function(uuid){
            //snapshot creation
            amplify.publish('fire:'+uuid);
        });

        ab.firing.add = function (uuid,callback){
            ab.caching.get(uuid).then(function(cachedObj){
                //snapshot creation
                callback(cachedObj);
            })

            return amplify.subscribe('fire:'+uuid,callback);
        }

        ab.firing.remove = function(uuid,listenerName){
            return amplify.unsubscribe('fire:'+uuid,listenerName);
        }
    }


    var main = function(){
        ab.network.init();
        ab.caching.init();
        ab.firing.init();

        Appbase.get = function(uuid,callback){
            return ab.firing.add(uuid,callback);
        }

        Appbase.set = function(uuid,obj){
            ab.caching.set(uuid,obj);
        }
    }

    main();

})()