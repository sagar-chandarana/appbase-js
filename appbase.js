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
        debug:{},
        errors:{}
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

    ab.util.timestamp = function(){
        return (new Date()).getTime();
    }

    ab.network.init = function() {
        ab.network.server = 'http://162.242.213.228:3000/';

        ab.network.properties = {};

        ab.network.properties.listen = function(request,callback){
            /*
                Listen for properties on a path
                 - request parameters - a JSON object
                   * path
                   * timestamp

                 - callback - called whenever the data arrives
                    arguments:
                   * error - eg. vertex not found/network error
                   * vertex - vertex object with properties

                 This method filters out multiple requests on a single path. I.E. it keeps track of all the paths being listened and it simply ignores if a path is already being listened.
             */
        }

        ab.network.properties.get = function(request,callback){
            /*
                Same as listen, but listen only once and when the data arrives, cut off the connection.
                Callback is called only once.
             */
        }

        ab.network.properties.isListening = function(path){
            /*
                Returns a boolean, whether a path is being listened or not
             */
        }

        ab.network.properties.stop = function(path){
            /*
                Stop listening for properties on a path
             */
        }

        ab.network.properties.patch = function(path,vertex,callback){
            /*
                Rest PATCH equivalent
                - callback
                   arguments:
                    *  error
                    *  timestamp - returned from server
             */
        }

        ab.network.properties.put = function(path,vertex,callback){
            /*
             Rest PUT equivalent
             - callback
               arguments:
                 *  error
                 *  timestamp - returned from server
             */
        }

    }

    ab.caching.init = function(){
        ab.caching.inMemory = {
        };

        var keyValFromArgs = function(prefix,key,val){
            if(typeof val == 'undefined'){
                var val = key;
                key = prefix;
            } else {
                key = prefix+':'+key;
            }

            return {key:key,val:val}
        }

        var keyFromArgs = function(prefix,key){
            if(!key){
                var key = prefix;
            } else {
                key = prefix+':'+key;
            }

            return key;
        }

        ab.caching.get = function(prefix,key){
            var key = keyFromArgs(prefix,key);

            if(!key){
                throw 'Invalid arguments for getting from cache.'
            }

            if(ab.caching.inMemory[key]){
                return {val:Object.clone(ab.caching.inMemory[key]),isFresh:true}
            } else {
                var fromPersistent = amplify.store(key);
                if(fromPersistent){
                    ab.caching.inMemory[key] = fromPersistent;
                    return {val:Object.clone(fromPersistent),isFresh:false};
                } else {
                    return {isFresh:false};
                }
            }
        }

        ab.caching.set = function(prefix,key,val){
            var key_val = keyValFromArgs(prefix,key,val);
            var key = key_val.key;
            var val = key_val.val;

            if(!key){
                throw 'Invalid arguments for setting the cache.'
            }

            ab.caching.inMemory[key] = val;

            if(val == undefined){
                amplify.store(key,null);
            } else {
                amplify.store(key,val);
            }
        }

        ab.caching.clear = function(prefix,key){
            var key = keyFromArgs(prefix,key);

            if(key){
                ab.caching.set(key,undefined); //clear
            } else {
                ab.caching.inMemory = {}; //clear
                var key_values = amplify.store();
                for(var key in key_values){
                    amplify.store(key,null); //clear
                }
            }

        }

    }

    ab.graph.init = function(){
        ab.graph.storage = {};

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

                            reject(ab.errors.vertex_not_found) //for now, as server is not available
                            return;
                        }
                        //todo: cached.isFresh && amplify.publish('toServer:listen_to_data',uuid);
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

                            reject(ab.errors.vertex_not_found); //for now, as server is not available
                            return;
                        }
                        //cached.isFresh && amplify.publish('toServer:listen_to_data',uuid);
                        break;

                    case 'path_vertex':

                        ab.graph.storage.get('path_uuid',key)
                            .then(function(uuid){

                                if(!extras)
                                    var extras = {};

                                extras.path = key;

                                return ab.graph.storage.get('uuid_vertex',uuid,extras);
                            })
                            .then(function(vertex){

                                ab.caching.clear("creation",key);
                                resolve(vertex);

                            },function(error){

                                if(error == ab.errors.vertex_not_found && ab.caching.get("creation",key).val){
                                    //Vertex creation
                                    //TODO: serverside creation of UUIDs for new objects
                                    ab.graph.storage.set(what,key,{uuid:ab.util.uuid(),timestamp:ab.util.timestamp(),properties:{}},{isLocal:true}).then(function(){
                                        ab.caching.clear("creation",key);
                                        return ab.graph.storage.get('path_vertex',key);
                                    }).then(resolve,reject);

                                } else {
                                    reject(error);
                                }
                            });
                        break;

                    case 'uuid_edges':
                        /*TODO: fetch from server, according to timestamp, startAT, endAt and then return data from cache */

                        if(cached.val){
                            cached.val.highestPriority = cached.val.highestPriority != null? cached.val.highestPriority:-Infinity;
                            cached.val.lowestPriority = cached.val.lowestPriority != null? cached.val.lowestPriority:Infinity;

                            resolve(cached.val);
                        } else {
                            resolve ({byName:{},byPriority:{},highestPriority:-Infinity,lowestPriority:+Infinity}); //empty object, as server is not available, and the assumption is path_uuid exists, but there are no edges for this uuid.
                        }

                        //cached.isFresh && amplify.publish('toServer:listen_to_data',uuid);
                        break;

                    case 'path_edges':
                        ab.graph.storage.get('path_vertex',key)
                            .then(function(vertex){
                                if(!extras)
                                    var extras = {};

                                extras.path = key;

                                return ab.graph.storage.get('uuid_edges',vertex.uuid,extras).then(function(edges){
                                    edges.uuid = vertex.uuid;
                                    return Promise.resolve(edges);
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
                    case 'uuid_path':
                        /*expected string*/
                        if(typeof val != "string"){
                            reject('UUID must be a string');
                            return;
                        }

                        var cached = ab.caching.get(what,key);

                        if(!cached.val){
                            cached.val = {};
                        }

                        cached.val[val] = true;

                        ab.caching.set(what,key,cached.val);
                        resolve();

                        break;

                    case 'path_uuid':
                        /*expected string*/
                        if(typeof val != "string"){
                            reject ('UUID must be a string');
                            return;
                        }

                        ab.caching.set(what,key,val);
                        ab.graph.storage.set('uuid_path',val,key).then(resolve,reject);

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
                            reject ('Object not valid. 1');
                            return;
                        }


                        var cached = ab.caching.get(what,key);
                        var storedVertex = cached? cached.val:undefined;

                        if(!extras.isLocal && val.timestamp && storedVertex && storedVertex.timestamp >= val.timestamp){
                            resolve(); //ignore
                            return;
                        }

                        if(extras.patch && storedVertex){
                            for(var prop in val.properties){
                                val.properties[prop] == null? delete storedVertex.properties[prop] : storedVertex.properties[prop] = val.properties[prop];
                            }

                            val = storedVertex;
                        }

                        //todo: preserve server's version, with a timestamp
                        val.prev = ab.caching.get(what,key).val;
                        val.prev && delete val.prev.prev; //delete older state

                        ab.caching.set(what,key,val);

                        resolve();


                        val.prev && ab.firing.fire('properties',key,val); //fire only if there's a previous version, i.e. the properties are 'modified'

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
                            reject ('Object not valid. 3');
                            return;
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
                                            storeNow();
                                    }
                                    else {
                                        reject("Vertex already exists.")
                                    }
                                },function(error){

                                    if(!extras.shouldExist && error == ab.errors.vertex_not_found ){
                                        storeNow();
                                    }
                                    else {
                                        reject(error);
                                    }
                                });
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
                         priority: 0,
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

                            var toBeFired = [];
                            var cached = ab.caching.get(what,key);
                            var storedByName = cached.val? cached.val.byName:null;
                            var storedByPriority = cached.val?cached.val.byPriority:{};
                            var lowestPriority = cached.val && cached.val.lowestPriority != null ? cached.val.lowestPriority:+Infinity;
                            var highestPriority = cached.val && cached.val.highestPriority != null  ? cached.val.highestPriority:-Infinity;

                            var setHighLow = function(prio){

                                if(typeof prio != 'number' ){
                                    reject( "Internal Error - while setting priority");
                                }

                                if(prio > highestPriority){
                                    highestPriority = prio;
                                }

                                if(prio < lowestPriority){
                                    lowestPriority = prio;
                                }
                            }

                            /*
                            format:
                            {
                                byName: {
                                    'linkName': {
                                        priority: 0,
                                        timestamp: 'yo'
                                    }
                                }

                                byPriority: {
                                    prio: [sorted names]
                                }
                            }
                            */

                            if(extras.patch && storedByName){
                                for(var edgeName in val){
                                    //TODO: timestamps, if no priority given in the local, server-timestamp is the priority

                                    if(val[edgeName] && val[edgeName].priority == "time"){
                                        val[edgeName].priority = val[edgeName].timestamp;
                                    }

                                    if(storedByName[edgeName]){ //Todo: ( && timestamp greater) )

                                        if(val[edgeName] && val[edgeName].priority == undefined){
                                            val[edgeName].priority = storedByName[edgeName].priority;
                                        }

                                        if(val[edgeName] == null || storedByName[edgeName].priority == val[edgeName].priority){ //todo: 1)server delete flag 2)//todo: check for uuids
                                            //remove edge
                                            toBeFired.push(['edge_removed',key,ab.graph.path_vertex.getSync(extras.path+'/'+edgeName),{edgeName:edgeName}]); //todo: vertex

                                            ab.caching.clear('path_uuid',extras.path+'/'+edgeName);
                                            //todo: in edge for edge uuid

                                            var priority = storedByName[edgeName].priority;
                                            storedByPriority[priority].splice(storedByPriority[priority].indexOf(edgeName),1);
                                            delete storedByName[edgeName];

                                            if(priority == lowestPriority){
                                                lowestPriority = Infinity;
                                            }

                                            if(priority == highestPriority){
                                                highestPriority = -Infinity;
                                            }



                                        } else if(val[edgeName].priority != storedByName[edgeName].priority ){ //todo: check for uuids

                                            toBeFired.push(['edge_moved',key,ab.graph.path_vertex.getSync(extras.path+'/'+edgeName),{edgeName:edgeName}]); //todo: 1) vertex 2) attach priority data

                                            var oldPriority = storedByName[edgeName].priority;
                                            storedByPriority[oldPriority].splice(storedByPriority[oldPriority].indexOf(edgeName),1);

                                            var newPriority = val[edgeName].priority;
                                            storedByName[edgeName].priority = newPriority;

                                            if(!storedByPriority[newPriority]){
                                                storedByPriority[newPriority] = [];
                                            }

                                            storedByPriority[newPriority].push(edgeName);
                                            storedByPriority[newPriority].sort();

                                            setHighLow(newPriority);

                                            if(oldPriority == lowestPriority){
                                                lowestPriority = Infinity;
                                            }

                                            if(oldPriority == highestPriority){
                                                highestPriority= -Infinity;
                                            }

                                            delete val[edgeName];

                                        } else {
                                            //it should not end up here
                                            reject('Edge data wrong');
                                            return;
                                        }
                                    }

                                }

                                // the only edges left are newly added
                            }

                            for(var edgeName in val){
                                if(!val[edgeName]) // todo: server delete flag
                                    continue;

                                if(val[edgeName].priority == undefined){
                                    val[edgeName].priority = val[edgeName].timestamp;
                                }

                                if(val[edgeName].data){
                                    var path = extras.path+'/'+edgeName;
                                    var vertex = val[edgeName].data;

                                    ab.graph.storage.set('path_vertex',path,vertex);
                                }

                                toBeFired.push(['edge_added',key,val[edgeName].data?val[edgeName].data:ab.graph.path_vertex.getSync(extras.path+'/'+edgeName),{edgeName:edgeName}]);

                                delete val[edgeName].data;

                                if(extras.patch && storedByName)
                                    storedByName[edgeName] = val[edgeName];

                                if(!storedByPriority[val[edgeName].priority]){
                                    storedByPriority[val[edgeName].priority] = [];
                                }

                                storedByPriority[val[edgeName].priority].push(edgeName);
                                storedByPriority[val[edgeName].priority].sort();


                                setHighLow(val[edgeName].priority);

                                //TODO: in edges
                            }

                            if(lowestPriority == +Infinity || highestPriority == -Infinity){
                                for(var prio in storedByPriority){

                                    if(storedByPriority[prio].length){
                                        setHighLow(parseInt(prio));
                                    }
                                }
                            }

                            ab.caching.set(what,key,{
                                byName: (extras.patch && storedByName)?storedByName:val,
                                byPriority: storedByPriority,
                                lowestPriority:lowestPriority,
                                highestPriority:highestPriority
                            });

                            resolve();

                            toBeFired.forEach(function(args){
                                ab.firing.fire.apply(null,args);
                            });

                        }

                        if(extras.shouldExist){
                            ab.graph.storage.get('uuid_vertex',key,extras)
                                .then(function(storedVertex){
                                    if(storedVertex){
                                        storeNow();
                                    } else {
                                        reject("Vertex not found.")
                                        return;
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

                        if(typeof val != "object"){
                            reject ('Object not valid. 4');
                            return;
                        }

                        if(!extras)
                            var extras = {};

                        extras.path = key;

                        if(!val.uuid){
                            ab.graph.storage.get('path_vertex',key).then(function(vertex){

                                ab.graph.storage.set('uuid_edges',vertex.uuid,val,extras).then(resolve,reject);
                            },reject);

                        } else {

                            ab.graph.storage.set('path_uuid',key,val.uuid).then(function(){
                                ab.graph.storage.set('uuid_edges',val.uuid,val,extras).then(resolve,reject);
                            },reject);


                        }

                        break;

                    default :
                        reject('What to set?');
                        return;

                }
            })
        }

        ab.graph.path_vertex = {
            get:function(path,extras){
                return ab.graph.storage.get('path_vertex',path);
            },
            getSync: function(path){
                return ab.caching.get('path_uuid',path).val && ab.caching.get('uuid_vertex',ab.caching.get('path_uuid',path).val)? ab.caching.get('uuid_vertex',ab.caching.get('path_uuid',path).val) : undefined;
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
            getSync: function(path){
                return ab.caching.get('path_uuid',path).val && ab.caching.get('uuid_edges',ab.caching.get('path_uuid',path).val)? ab.caching.get('uuid_edges',ab.caching.get('path_uuid',path).val) : {};
            },
            set: function(path,edges,extras){

                return new Promise(function(resolve,reject){


                    var handleServer = function(){
                        resolve();
                        //TODO: server, resolve,reject, timestamping
                    };

                    var stepTwo = function(){
                        if(newEdge.target){
                            ab.graph.path_vertex.get(edgePath)
                                .then(function(edgeVertex){
                                    edges[edgeName] = {
                                        timestamp: ab.util.timestamp(),
                                        priority: priority,
                                        data:edgeVertex
                                    };

                                    ab.graph.storage.set('path_edges',path,edges,extras).then(handleServer,reject);
                                },reject);
                        } else { //deletion
                            edges[edgeName] = null;
                            ab.graph.storage.set('path_edges',path,edges,extras).then(handleServer,reject);
                        }
                    }

                    if(extras.isLocal){
                        /*
                         expected when local
                         edges: {
                            edgeName: 'name',
                            target: appbase ref,
                            priority: priority
                         }
                         */
                        //todo: validation

                        var newEdge = edges;
                        edges = {};
                        var edgeName = newEdge.name;
                        var edgePath = newEdge.ref? newEdge.ref.path():null;
                        var priority = newEdge.priority;

                        if(!edgeName && !edgePath){

                            reject('Invalid arguments');
                            return;
                        }

                        if(!edgeName){

                            ab.graph.path_vertex.get(edgePath).then(function(vertex){
                                edgeName = vertex.uuid;
                                stepTwo();
                            },reject);
                        } else {
                            stepTwo();
                        }


                    } else { //server data has changed
                        ab.graph.storage.set('path_edges',path,edges,extras).then(resolve,reject);
                    }
                });
            }
        }

        ab.graph.path_in_edge_paths = {
            get:function(path){
                return ab.graph.storage.get('path_in_edge_paths',path);
            }
        };

        ab.graph.uuid_paths = {
            getSync:function(uuid){
                var cached = ab.caching.get('uuid_path',uuid);
                return cached.val?cached.val:{};
            }
        }
    }

    ab.firing.init = function(){

        ab.firing.snapshot = function(vertex){
            var exports = {};

            exports.properties = function(){
                return vertex.properties;
            }

            exports.prevProperties = function(){
                return vertex.prev?vertex.prev.properties:null;
            }

            return exports;
        }

        ab.firing.fire = function(event,uuid,vertex,extras){
            var ref;

            var paths = ab.graph.uuid_paths.getSync(uuid);
            for(var path in paths){

                switch(event){

                    case "properties":
                        ref  = Appbase.ref(path,true);
                        break;

                    case "edge_added":
                    case "edge_removed":
                    case "edge_changed":
                    case "edge_moved":
                        ref  = Appbase.ref(path+'/'+extras.edgeName,true);
                        break;

                    default:
                        throw ('Wrong event.');

                }

                amplify.publish(event+':'+path,false,ref,ab.firing.snapshot(vertex)); //TODO: extras (name,priority)
            };
        }

        ab.firing.properties = {};
        ab.firing.properties.on = function(path,name,callback){
            var listenerName = amplify.subscribe('properties:'+path,name,callback);

            ab.graph.path_vertex.get(path)
            .then(function(vertex){
                callback(false,Appbase.ref(path,true),ab.firing.snapshot(vertex));

            },function(error){
                amplify.unsubscribe('properties:'+path,listenerName);
                callback(error);
            });

        }

        ab.firing.properties.off = function(path,name){
            return amplify.unsubscribe('properties:'+path,name); // todo: stop listening, clear from RAM
        }

        ab.firing.edges = {};

        ab.firing.edges.on = function(event,path,name,options,callback){
            //todo: check event
            if(typeof name == "function" && callback == undefined && options==undefined){
                var callback = name;
                name = undefined;
            } else if(callback == undefined && typeof options == "function" && typeof name == "string"){
                var callback = options;
                options = undefined;
            } else if(callback == undefined && typeof options == "function" && typeof name == "object") {
                var callback = options;
                options = name;
                name = undefined;
            } else {
                throw "Invalid arguments."
            }

            var listenerName = amplify.subscribe(event+':'+path,name,callback);

            ab.graph.path_out_edges.get(path)  //TODO: provide startAt,endAt
            .then(function(edges){
                    if(event == "edge_added"){
                        //fire for existing edges


                        //todo: reverse, skip

                        var startAt = options && typeof options.startAt == 'number'? options.startAt:edges.lowestPriority;
                        var endAt = options && typeof options.endAt == 'number'? options.startAt:edges.highestPriority;

                        for(var i=startAt; (i<= endAt) && startAt != +Infinity && endAt!= -Infinity ;i++){ //todo: endAt inclusive or exlusive, if exlusive, endAt at max prio doesnt work

                            if(edges.byPriority[i]){

                                edges.byPriority[i].forEach(function(edgeName){
                                    var edgePath = path+edgeName;

                                    if(options && options.noData){
                                        callback(false,Appbase.ref(edgePath,true));
                                    } else {
                                        ab.graph.path_vertex.get(edgePath).then(function(vertex){
                                            callback(false,Appbase.ref(edgePath),ab.firing.snapshot(vertex)); //todo: name and extra data
                                        },callback);
                                    }
                                })
                            }
                        }

                    } else if (event == 'edge_changed'){
                        //todo: think: need anything special?
                    }

            },function(error){
                amplify.unsubscribe(event+':'+path,listenerName);
                callback(error);
            });
        }
    }

    ab.interface.init = function(){

        ab.interface.ref_obj = function(path,lite){

            var priv = {};
            var exports = {
                properties:{},
                edges:{}
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
                vertex.timestamp = ab.util.timestamp();

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
                vertex.timestamp = ab.util.timestamp();

                ab.graph.path_vertex.set(priv.path,vertex,{isLocal:true,shouldExist:true,patch:true}).then(function(){
                    localCallback && localCallback(false);
                },localCallback ? localCallback: function(error){
                    throw error;
                });
            }

            exports.destroy = function(localCallback){
                //TODO:
            }

            exports.edges.add = function(args,callback){
                if(args.ref && args.ref.path()){
                    args.target = args.ref.path();
                } else {
                    callback('Invalid arguments');
                }

                ab.graph.path_out_edges
                    .set(priv.path,args,{isLocal:true,patch:true,shouldExist:true})
                    .then(function(){
                            callback(false); //todo: ref and snap
                        },callback);

            }

            exports.edges.remove = function(args,callback){

                if(!((args.ref && args.ref.path()) || args.name)){
                    callback('Invalid arguments');
                }

                args.target = null; //delete

                ab.graph.path_out_edges.set(priv.path,args,{isLocal:true,patch:true,shouldExist:true}).then(function(){
                    callback(false);// todo: ref and snap
                },callback);
            }

            exports.edges.on = function(event,name,options,callback){
                return ab.firing.edges.on(event,priv.path,name,options,callback);
            }

            exports.properties.on = function(name,callback){
                return ab.firing.properties.on(priv.path,name,callback);
            }

            exports.properties.off = function(name){
                return ab.firing.properties.off(priv.path,name);
            }

            return exports;

        }

        ab.interface.global = {};

        ab.interface.global.create = function(collection,key){
            if(!key){
              var key = ab.util.uuid();
            }

            ab.caching.set('creation',collection+'/'+key,true);

            return ab.interface.ref_obj(collection+'/'+key);
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

    ab.errors.init = function(){
        ab.errors.vertex_not_found = "Vertex not found."
        ab.errors.vertex_exists = "Vertex already exists."
    }

    var main = function(){
        ab.network.init();
        ab.caching.init();
        ab.firing.init();
        ab.graph.init();
        ab.interface.init();
        ab.debug.init();
        ab.errors.init();
    }

    main();

})()