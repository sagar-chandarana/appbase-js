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
        graph:{},
        interface:{},
        debug:{}
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
        ab.graph.storage = {};

        ab.graph.storage.get = function(what,key,extras){

            return new Promise(function(resolve,reject){


                var cached = ab.caching.get(what,key);
                cached = cached?cached:{};

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

                            resolve(false); //for now, as server is not available

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

                            resolve(false); //for now, as server is not available

                        }
                        cached.isFresh && amplify.publish('toServer:listen_to_data',uuid);
                        break;

                    case 'path_vertex':

                        ab.graph.storage.get('path_uuid',key)
                            .then(function(uuid){
                                if(!uuid){
                                    resolve(false);
                                }

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

                            resolve(false); //for now, as server is not available
                        }

                        cached.isFresh && amplify.publish('toServer:listen_to_data',uuid);
                        break;

                    case 'path_edges':
                        ab.graph.storage.get('path_uuid',key)
                            .then(function(uuid){
                                if(!uuid){
                                    resolve(false);
                                }

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

        ab.graph.storage.set = function(what,key,val,extrasArgs){

            return new Promise(function(resolve,reject){

                var extras = extrasArgs?extrasArgs:{};

                switch(what){
                    case 'path_uuid':
                        /*expected string*/
                        if(typeof val != "string"){
                            reject ('UUID must be a string');
                        }

                        ab.caching.set(what,key,val);

                        resolve();

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
                            reject ('Object not valid.');
                        }


                        var cached = ab.caching.get(what,key);
                        var storedVertex = cached? cached.val:undefined;

                        if(!extras.isLocal && val.timestamp && storedVertex && storedVertex.timestamp >= val.timestamp){
                            reject('Object not valid.');
                        }

                        if(extras.patch && storedVertex){
                            for(var prop in val.properties){
                                val.properties[prop] == null? delete storedVertex.properties[prop] : storedVertex.properties[prop] = val.properties[prop];
                            }

                            val = storedVertex;
                        }

                        if(extras.isLocal)
                            val.timestamp = null;


                        //todo: preserve server's version, with a timestamp
                        val.prev = ab.caching.get(what,key)? ab.caching.get(what,key).val:undefined;
                        val.prev && delete val.prev.prev; //delete older state

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
                            reject ('Object not valid.');
                        }

                        extras.path = key;


                        var storeNow = function(){

                            if(!val.uuid){
                                ab.graph.storage.get('path_uuid',key).then(function(uuid){
                                    ab.graph.storage.set('uuid_vertex',uuid,val,extras).then(resolve,reject);
                                },reject);

                            } else {
                                ab.graph.storage.set('path_uuid',key,val.uuid).then(function(){
                                    ab.graph.storage.set('uuid_vertex',val.uuid,val,extras).then(resolve,reject);
                                },reject);


                            }
                        }

                        if(typeof extras.shouldExist != 'undefined' ){
                            ab.graph.storage.get('path_vertex',key,extras)
                                .then(function(storedVertex){

                                    if(extras.shouldExist){
                                        if(storedVertex){
                                            storeNow();
                                        }else {

                                            reject("Vertex not found.")
                                        }

                                    } else {

                                        if(storedVertex){

                                            reject("Vertex already exists.")
                                        }else {

                                            storeNow();
                                        }

                                    }

                                },reject);
                        } else {
                            storeNow();
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

                        var storeNow = function(){

                            for(var edgeName in val){
                                //validation

                                if(val[edgeName] && val[edgeName].data){
                                    var path = extras.path+'/'+edgeName;
                                    var vertex = val[edgeName].data;

                                    ab.graph.storage.set('path_vertex',path,vertex);
                                    delete val[edgeName].data;
                                }

                            }

                            var cached = ab.caching.get(what,key);
                            var storedEdges = cached.val;

                            if(extras.patch && storedEdges){
                                for(var edgeName in val){
                                    //TODO: timestamps, server edge delete flag
                                    val[edgeName] == null? delete storedEdges[edgeName] : storedEdges[edgeName] = val[edgeName];
                                    //TODO:fire events
                                    //TODO: in edges
                                }

                                val = storedEdges;
                            }

                            ab.caching.set(what,key,val);

                            resolve();
                        }

                        if(extras.shouldExist){
                            ab.graph.storage.get('uuid_vertex',key,extras)
                                .then(function(storedVertex){
                                    if(storedVertex){
                                        storeNow();
                                    } else {
                                        reject("Vertex not found.")
                                    }

                                },reject);
                        } else {
                            storeNow();
                        }


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
                            reject ('Object not valid.');
                        }

                        if(!extras)
                            var extras = {};

                        extras.path = key;

                        if(!val.uuid){

                            ab.graph.storage.get('path_uuid',key).then(function(uuid){
                                ab.graph.storage.set('uuid_edges',uuid,val,extras).then(resolve,reject);
                            },reject);

                        } else {

                            ab.graph.storage.set('path_uuid',key,val.uuid).then(function(){
                                ab.graph.storage.set('uuid_edges',val.uuid,val,extras).then(resolve,reject);
                            },reject);


                        }

                        break;

                    default :
                        reject('What to set?');

                }
            })
        }

        ab.graph.path_vertex = {
            get:function(path){
                return ab.graph.storage.get('path_vertex',path);
            },
            set: function(path,vertex,extras){
                if(!extras)
                    extras = {};

                return ab.graph.storage.set('path_vertex',path,vertex,extras);
            }
        };

        ab.graph.path_out_edges = {
            get:function(path){
                return ab.graph.storage.get('path_edges',path);
            },
            set: function(path,edges,extras){
                var localCallback = extras.isLocal? extras.localCallback:false;

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

                                    storeEdges().then(handleServer);
                                } else {
                                    localCallback("Vertex not found.")
                                }


                            },function(error){
                                localCallback(error); //TODO: what kind of error it would be? should there be a retry? Possible case: the vertex wasn't in the cache and network is also gone
                            }
                        );
                    } else {
                        storeEdges().then(handleServer);
                    }

                    var handleServer = function(){
                        //TODO: server, localCallback
                    };


                } else {
                    //server data has changed
                    storeEdges();
                }

                var storeEdges = function(){
                    ab.graph.storage.set('path_edges',path,edges,localCallback?{isLocal:true,shouldExist:true,patch:true}:extras).then(
                        function(){

                           //TODO: server, localCallback
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

    ab.interface.init = function(){

        ab.interface.ref_obj = function(path,lite){

            var priv = {};
            var exports = {
                properties:{},
                named_edges:{},
                ordered_edges:{}
            };

            priv.path = ab.util.cutLeadingTrailingSlashes(path);

            exports.path = function(){
                return priv.path;
            }

            exports.out = function(edgeName){
                return ab.interface.ref_obj(priv.path + '/' +edgeName,true);
            }

            exports.in = function(){
                return ab.interface.ref_obj(ab.util.cutBack(priv.path),true);
            }

            exports.properties.add = function(prop,val,localCallback){
                var vertex = {properties:{}};
                vertex.properties[prop] = val;

                ab.graph.path_vertex.set(priv.path,vertex,{isLocal:true,shouldExist:true,patch:true}).then(function(){
                    localCallback && localCallback(false);
                },localCallback ? localCallback: function(error){
                    throw error;
                });
            }

            exports.properties.commit = function(prop,apply,localCallback){
                //todo:
            }

            exports.properties.remove = function(prop,localCallback){
                var vertex = {properties:{}};
                vertex.properties[prop] = null;

                ab.graph.path_vertex.set(priv.path,vertex,{isLocal:true,shouldExist:true,patch:true}).then(function(){
                    localCallback && localCallback(false);
                },localCallback ? localCallback: function(error){
                    throw error;
                });
            }

            exports.destroy = function(localCallback){
                //TODO:
            }

            exports.on = function(){

            }

            priv.on_properties = function(){

            }

            return exports;

        }

        ab.interface.global = {};

        ab.interface.global.create = function(collection,key,localCallback){
            if(!key){
              var key = ab.util.uuid(); //TODO: it should not contain numbers
            }

            //TODO: serverside creation of UUIDs for new objects
            ab.graph.path_vertex.set(collection+'/'+key,{uuid:ab.util.uuid(),timestamp:null,properties:{}},{isLocal:true,shouldExist:false}).then(function(){

                localCallback && localCallback(false);

            },localCallback ? localCallback: function(error){
                throw error;
            });

            return ab.interface.ref_obj('collection'+'/'+'key');
        }

        ab.interface.global.ref = ab.interface.ref_obj;

        Appbase.create = ab.interface.global.create;
        Appbase.ref = ab.interface.global.ref;
    }

    ab.debug.init = function(){
        if(!Appbase.debug){
            delete Appbase.debug;
            return;
        }

        Appbase.debug = {ab:ab};

    }


    var main = function(){
        ab.network.init();
        ab.caching.init();
        ab.firing.init();
        ab.graph.init();
        ab.interface.init();
        ab.debug.init();

    }

    main();

})()