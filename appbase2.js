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
                return {val:Object.clone(ab.caching.inMemory[key]),isFresh:true}
            } else {
                var fromPersistent = amplify.store(key);
                if(fromPersistent){
                    ab.caching.inMemory[key] = fromPersistent;
                    return {val:Object.clone(fromPersistent),isFresh:false};
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
                                if(!extras)
                                    var extras = {};

                                extras.path = key;

                                return ab.graph.storage.get('uuid_vertex',uuid,extras);
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
                                if(!extras)
                                    var extras = {};

                                extras.path = key;

                                return ab.graph.storage.get('uuid_edges',uuid,extras).then(function(edges){
                                    return Promise.resolve({uuid:uuid,edges:edges});
                                });
                            }).then(resolve,reject);
                        break;

                }
            })
        }

        ab.graph.storage.set = function(what,key,val,extras){
            //promise

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
                    if(typeof val != "object" || ! val.properties || typeof val.timestamp == 'undefined'){
                        throw ('Object not valid.');
                    }
                    /* not needed, asby reaching here, it confirms that the path_uuid existed, and currently it also means that uuid_vertex exists
                    if(extras.shouldExist){
                        ab.graph.storage.get('uuid_vertex',key,extras)
                        .then(function(storedVertex){
                            if(storedVertex){
                                if(extras.patch){
                                    for(var prop in val.properties){
                                        val.properties[prop] == null? delete storedVertex.properties[prop] : storedVertex.properties[prop] = val.properties[prop];

                                    }

                                    val = storedVertex;
                                }

                                if(extras.isLocal)
                                    val.timestamp = null;

                                ab.caching.set(what,key,val);
                                resolve();
                                //TODO:event

                            } else {
                                reject("Vertex not found.")
                            }

                        },reject)
                    } else { */
                        var cached = ab.caching.get(what,key);
                        var storedVertex = cached.val;

                        if(extras.patch && storedVertex){
                            for(var prop in val.properties){
                                val.properties[prop] == null? delete storedVertex.properties[prop] : storedVertex.properties[prop] = val.properties[prop];
                            }

                            val = storedVertex;
                        }

                        if(extras.isLocal)
                            val.timestamp = null;



                    //}
                    val.prev = ab.caching.get(what,key);


                    ab.caching.set(what,key,val);
                    //TODO:event
                    resolve();

                    break;

                case 'path_vertex':
                     /*
                     obj expected:
                     {
                        timestamp: blah,
                        properties: {
                        }

                     }
                     */

                    if(typeof val != "object" || ! val.properties || typeof val.timestamp == 'undefined'){
                        throw ('Object not valid.');
                    }


                    if(!extras)
                        var extras = {};

                    extras.path = key;

                    if(!val.uuid){

                        ab.graph.storage.get('path_uuid',key).then(function(uuid){
                            ab.graph.storage.set('uuid_vertex',uuid,val,extras);
                            resolve();
                        },reject);

                    } else {

                        ab.graph.storage.set('path_uuid',key,val.uuid);
                        ab.graph.storage.set('uuid_vertex',val.uuid,val,extras);

                    }

                    //TODO: fire
                    break;

                case 'uuid_edges':
                    /*
                     obj expected:
                     {
                         'linkName': {

                             timestamp: 'yo',
                             data: {
                                 uuid: blah,
                                 timestamp: blah,
                                 properties: {
                                 }
                             }
                         }

                     }
                     */

                    if(typeof val != "object" ||  ! val.linkName ||  typeof val.timestamp == 'undefined'){
                        throw ('Object not valid.');
                    }



                    for(var edgeName in val){
                        if(val[edgeName].data){
                            var path = extras.path+'/'+edgeName;
                            var vertex = val[edgeName].data;

                            ab.graph.storage.set('path_vertex',path,vertex);
                            delete val[edgeName].data;
                        }

                        //TODO:firing event
                    }

                    ab.caching.set(what,key,val);

                    break;

                case 'path_edges':
                    /*
                     obj expected:


                         {
                                'linkName': {

                                     timestamp: 'yo',
                                     data: {
                                         uuid: blah,
                                         timestamp: blah,
                                         properties: {
                                            }
                                     }
                                }

                         }

                     */

                    if(typeof val != "object"  || ! val.properties || typeof val.timestamp == 'undefined'){
                        throw ('Object not valid.');
                    }

                    if(!extras)
                        var extras = {};

                    extras.path = key;

                    if(!val.uuid){

                        ab.graph.storage.get('path_uuid',key).then(function(uuid){
                            ab.graph.storage.set('uuid_edges',uuid,val,extras);
                        });

                    } else {

                        ab.graph.storage.set('path_uuid',key,val.uuid);
                        ab.graph.storage.set('uuid_edges',val.uuid,val,extras);

                    }

                    break;

            }
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
                if(localCallback){
                    ab.graph.storage.set('path_vertex',path,vertex,{patch:true,isLocal:true})
                    .then(function(){

                        //server;
                        //localCallback;

                    },localCallback);


                } else {
                    //server data has changed
                    ab.graph.storage.set('path_vertex',path,vertex);
                }
            }
        };

        ab.graph.path_out_edges = {
            get:function(path){
                return ab.graph.storage.get('path_edges',path);
            },
            set: function(path,edges,localCallback){
                if(localCallback){
                    /*
                    expected when local
                    edges: {
                        'edgeName':path
                    } - only one edge
                     */
                    if(edges.length >1){
                        throw ('Only one edge should be added  at once, locally')
                        return;
                    }

                    var edgeName = edges.keys()[0];
                    var edgePath = edges[edgeName];

                    if(edgePath){
                        ab.graph.path_vertex.get(edgePath).then(
                            function(edgeVertex){
                                if(edgeVertex){

                                    edges[edgeName] = {
                                        timestamp: null
                                    };

                                    storeEdges();
                                    handleServer();
                                } else {
                                    localCallback("Vertex not found.")
                                }


                            },function(error){
                                localCallback(error); //TODO: what kind of error it would be? should there be a retry? Possible case: the vertex wasn't in the cache and network is also gone
                            }
                        );
                    } else {
                        storeEdges();
                        handleServer();
                    }

                    var handleServer = function(){
                        //TODO: server, localCallback
                    };


                } else {
                    //server data has changed
                    storeEdges();
                }

                var storeEdges = function(){
                    //TODO: patch mechanism
                    ab.graph.path_out_edges.get(path).then(
                        function(storedEdges){
                            if(storedEdges){
                                for(var edgeName in edges){
                                    storedEdges[edgeName] = edges[edgeName];
                                }

                                ab.graph.storage.set('path_vertex',path,storedEdges);

                                //TODO: server, localCallback
                            } else {
                                localCallback("Vertex not found.")
                            }

                        },
                        function(error){
                            localCallback(error); //TODO: what kind of error it would be? should there be a retry? Possible case: the vertex wasn't in the cache and network is also gone
                        }
                    )
                }

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