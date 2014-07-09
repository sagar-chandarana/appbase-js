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
        caching:{},
        graph:{}
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
            //add deduplication of listening
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
        ab.caching.inMemory = {
        };

        ab.caching.get = function(prefix,key){
            if(!key){
                var key = prefix;
            } else {
                key = prefix+':'+key;
            }

            if(ab.caching.inMemory[key]){
                return {val:ab.caching.inMemory[key],isFresh:true}
            } else {
                var fromPersistent = amplify.store(key);
                if(fromPersistent){
                    ab.caching.inMemory[key] = fromPersistent;
                    return {val:fromPersistent,isFresh:false};
                } else {
                    {isFresh:false};
                }
            }
        }

        ab.caching.set = function(prefix,key,val){
            if(typeof val == 'undefined'){
                var val = key;
                key = prefix;
            } else {
                key = prefix+':'+key;
            }

            ab.caching.inMemory[key] = val;
            amplify.store(key,val);
        }

    }

    ab.graph.init = function(){

        ab.graph.storage.set = function(what,key,val,extras,localCallback){
            if(!localCallback && typeof extras == "function"){
                var localCallback = extras;
                delete extras;
            }

            switch(what){
                case 'path_uuid':
                    /*expected string*/
                    if(typeof val != "string"){
                        throw ('UUID must be a string');
                    }

                    ab.caching.set(what,key,val);

                    break;

                case 'uuid_vertex':
                    /*
                     obj expected:
                     {
                         timestamp: blah,
                         properties: {
                        }

                     }
                     */

                    if(typeof val != "object" || ! val.properties || ( !localCallback && typeof val.timestamp == 'undefined')){
                        throw ('Object not valid.');
                    }

                    ab.caching.set(what,key,val);

                    break;

                case 'path_vertex':
                    /*
                     obj expected:
                     {
                        uuid: blah,
                        timestamp: blah,
                        properties: {
                        }

                     }
                     */

                    if(typeof val != "object" ||  ! val.uuid || ! val.properties || ( !localCallback && typeof val.timestamp == 'undefined')){
                        throw ('Object not valid.');
                    }

                    ab.graph.storage.set('path_uuid',key,val.uuid);
                    ab.graph.storage.set('uuid_vertex',val.uuid,val,{path:key});
                    //TODO: server, localCallback
                    //TODO: fire
                    break;

                case 'uuid_edges':
                    /*
                     obj expected:
                     [
                        {
                            linkName: 'blah',
                            timestamp: 'yo',
                            data: {
                                 uuid: blah,
                                 timestamp: blah,
                                 properties: {
                                 }
                            }
                        }

                     ]
                     */

                    if(typeof val != "object" ||  ! val.linkName || ( !localCallback && typeof val.timestamp == 'undefined')){
                        throw ('Object not valid.');
                    }

                    val.forEach(function(edge){
                        if(edge.data){
                            var path = extras.path+'/'+edge.linkName;
                            var vertex = edge.data;

                            ab.graph.storage.set('path_vertex',path,vertex);
                            delete edge.data;
                        }
                    })

                    ab.caching.set(what,key,val);
                    //fire event

                    break;

                case 'path_edges':
                    /*
                     obj expected:
                     {
                         uuid: blah,
                         edges: [
                             {
                             linkName: 'blah',
                             timestamp: 'yo',
                                 data: {
                                 uuid: blah,
                                 timestamp: blah,
                                 properties: {
                                    }
                                 }
                             }

                         ]
                     }
                     */

                    if(typeof val != "object" ||  ! val.uuid || ! val.properties || ( !localCallback && typeof val.timestamp == 'undefined')){
                        throw ('Object not valid.');
                    }

                    ab.graph.storage.set('path_uuid',key,val.uuid);
                    ab.graph.storage.set('uuid_edges',val.uuid,val,{path:key});
                    //TODO: server, localCallback
                    //TODO: fire

                    break;

            }
        }

        ab.graph.storage.get = function(what,key,extras){

            return new Promise(function(resolve,reject){
                var cached = ab.caching.get(what,key);

                switch(what){
                    case 'path_uuid':
                        if(cached.val){
                            resolve(cached.val);
                        } else {
                            /*TODO: fetch from server
                            amplify.subscribe('fromServer:'+uuid,function(error,arrived_uuid,obj,topic,listenerName){
                                error && reject(error);

                                obj && resolve(ab.caching.inMemory[uuid]);
                                !obj && resolve(false);

                                amplify.unsubscribe(topic,listenerName);
                            })
                            */

                        }
                        cached.isFresh && amplify.publish('toServer:listen_to_data',uuid);
                        break;

                    case 'uuid_vertex':
                        if(cached.val){
                            resolve(cached.val);
                        } else {
                            /*TODO: fetch from server, according to timestamp
                             amplify.subscribe('fromServer:'+uuid,function(error,arrived_uuid,obj,topic,listenerName){
                             error && reject(error);

                             obj && resolve(ab.caching.inMemory[uuid]);
                             !obj && resolve(false);

                             amplify.unsubscribe(topic,listenerName);
                             })
                             */

                        }
                        cached.isFresh && amplify.publish('toServer:listen_to_data',uuid);
                        break;

                    case 'path_vertex':
                        ab.graph.storage.get('path_uuid',key)
                        .then(function(uuid){
                            return ab.graph.storage.get('uuid_vertex',uuid,{path:key});
                        })
                        .then(resolve,reject);
                        break;

                    case 'uuid_edges':
                        if(cached.val){
                            resolve(cached.val);
                        } else {
                            /*TODO: fetch from server, according to timestamp
                             amplify.subscribe('fromServer:'+uuid,function(error,arrived_uuid,obj,topic,listenerName){
                             error && reject(error);

                             obj && resolve(ab.caching.inMemory[uuid]);
                             !obj && resolve(false);

                             amplify.unsubscribe(topic,listenerName);
                             })
                             */
                        }

                        cached.isFresh && amplify.publish('toServer:listen_to_data',uuid);
                        break;

                    case 'path_edges':
                        ab.graph.storage.get('path_uuid',key)
                            .then(function(uuid){
                                return ab.graph.storage.get('uuid_edges',uuid,{path:key}).then(function(edges){
                                    return Promise.resolve({uuid:uuid,edges:edges});
                                });
                            }).then(resolve,reject);
                        break;

                }
            })
        }

        amplify.subscribe('toGraph:vertex',function(path,vertex,localCallback){
            if(localCallback){
                ab.graph.path_vertex.get(path).then(function(vertex){
                    if(vertex){
                        ab.graph.path_vertex.set(path,vertex,localCallback);
                    } else {
                        callback("Vertex not found.")
                    }
                });
            } else {
                ab.graph.path_vertex.set(path,vertex);
            }
        });

        amplify.subscribe('toGraph:edges',function(path,edges,localCallback){
            if(localCallback){
                ab.graph.path_out_edges.get(path).then(function(edges){
                    if(edges){
                        ab.graph.path_out_edges.set(path,edges,localCallback);

                    } else {
                        callback("Vertex not found.");
                    }
                });
            } else {
                ab.graph.path_out_edges.set(path,edges);
            }
        });

        ab.graph.path_vertex = {
            get:function(path){
                return ab.graph.storage.get('path_vertex',path);
            },
            set: function(path,vertex,localCallback){
                ab.graph.storage.set('path_vertex',path,vertex,localCallback);
            }
        };

        ab.graph.path_out_edges = {
            get:function(path){
                return ab.graph.storage.get('path_edges',path);
            },
            set: function(path,edges,localCallback){
                ab.graph.storage.set('path_edges',path,edges,localCallback);
            }
        };

        ab.graph.path_in_edge_paths = {
            get:function(path){
                return ab.graph.storage.get('path_in_edge_paths',path);
            }
        };

    }

    ab.firing.init = function(){
        amplify.subscribe('fromCache:data_modified_by_server fromCache:data_modified_locally',function(uuid,obj){
            //snapshot creation
            amplify.publish('fire:'+uuid,obj);
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
        ab.graph.init();

        Appbase.get = function(uuid,callback){
            return ab.firing.add(uuid,callback);
        }

        Appbase.set = function(uuid,obj){
            ab.caching.set(uuid,obj);
        }
    }

    main();

})()