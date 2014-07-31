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
        while(path.charAt(path.length - 1) === '/') {
            path = path.slice(0,-1);
        }

        while(path.charAt(0) === '/') {
            path = path.slice(1);
        }

        return path;
    }

    ab.util.front = function(path){
        path = ab.util.cutLeadingTrailingSlashes(path);
        return path.indexOf('/') === -1? path: path.slice(0,path.indexOf('/'));
    }

    ab.util.cutFront = function(path){
        path = ab.util.cutLeadingTrailingSlashes(path);
        return path.indexOf('/') === -1? '': path.slice(path.indexOf('/')+1);
    }

    ab.util.back = function(path){
        path = ab.util.cutLeadingTrailingSlashes(path);
        return path.lastIndexOf('/') === -1? path: path.slice(path.lastIndexOf('/')+1);
    }

    ab.util.cutBack = function(path){
        path = ab.util.cutLeadingTrailingSlashes(path);
        return path.lastIndexOf('/') === -1? '': path.slice(0,path.lastIndexOf('/'));
    }

    ab.util.uuid = function (){
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }

    ab.util.timestamp = function(){
        return (new Date()).getTime();
    }

    ab.network.init = function() {
        var process = function(request, callback, listen) {
            request
            .success(function(data) {
                if(typeof data === 'string') {
                    callback(new Error(string));
                } else {
                    callback(null, data);
                    if(typeof listen === 'function') {
                        listen();
                    }
                }
            })
            .error(function(data) {
                if(typeof data === 'string') {
                    callback(new Error(data));
                } else if(data && typeof data.message === 'string') {
                    callback(new Error(data.message));
                } else {
                    callback(new Error('Unknown Error'));
                    console.log(data);
                }
            });
        }

        var paths = {};
        var edges = {};

        ab.network.server = 'http://162.242.213.228:3000/';

        ab.network.properties = {};
        ab.network.edges = {};

        ab.network.properties.listen = function(path,request,callback){
            if(!paths[path]) {
                paths[path] = { request: request };
                var req = { timestamp: request.timestamp, all: true };

                var listen = function() {
                    if(paths[path]) {
                        process(atomic.post(path + '/~properties', req), callback, listen);
                    }
                };

                listen();
            }

            /*
                Listen for properties on a path
                 - request parameters - a JSON object
                   * path
                   * timestamp

                 - callback - called whenever the data arrives
                    arguments:
                   * error - eg. vertex not found/network error
                   * obj - an object with properties vertex and optype

                 This method filters out multiple requests on a single path. I.E. it keeps track of all the paths being listened and it simply ignores if a path is already being listened.
             */
        }

        ab.network.properties.get = function(path, request,callback){
            var req = { timestamp: request.timestamp, all: true };

            process(atomic.post(path + '/~properties', req), callback);

            /*
                Same as listen, but listen only once and when the data arrives, cut off the connection.
                Callback is called only once.
             */
        }

        ab.network.properties.isListening = function(path){
            if(paths[path]) return true; else return false;
        }

        ab.network.properties.stop = function(path){
            delete paths[path];

            /*
                Stop listening for properties on a path
             */
        }

        ab.network.properties.patch = function(path,data,timestamp,callback){
            var req = { timestamp: timestamp, data: data };

            process(atomic.patch(path + '/~properties', req), callback);
            /*
                timestamp in request for strong PATCH.

                Rest PATCH equivalent
                - callback
                   arguments:
                    *  error
                    *  obj - with timestamp, _id, and fields just inserted
             */
        }

        ab.network.properties.remove = function(path,names,all,callback){
            var req = { data: names, all: all };

            process(atomic.delete(request.path + '/~properties', req), callback);

            /*

                Rest DELETE equivalent
                - callback
                   arguments:
                    *  error
                    *  obj - with timestamp, _id, and fields just deleted with an empty string (example: if field 'xyz' was deleted { _id: something, timestamp: something, xyz: ''})
             */
        }

        ab.network.edges.listen = function(path,request,callback){
            if(!edges[path]) {
                edges[path] = { request: request };
                var req = { timestamp: request.timestamp, data: request.names, filters: request.filters };

                var listen = function() {
                    if(paths[path]) {
                        process(atomic.post(path + '/~edges', req), callback, listen);
                    }
                };

                listen();
            }

            /*
                Listen for edges on a path
                 - request parameters - a JSON object
                   * timestamp
                   * names
                   * filters

                   names has priority over filters, i.e. if you give names, filters willbe ignored. names is an arrya of names
                   filters object contains startAt, endAt, skip, limit
                   empty filters object gets all edges

                   using names, you can bulk get edges, along with vertex data. like this
                   {
                        _id: something
                        edges: {
                            edgename1: {
                                vertex: {
                                    _id:
                                    timestamp:
                                    property1:
                                    property2:
                                }
                                timestamp:
                                order:
                            }
                            ...
                        }
                        optype:
                   }

                   using filters
                   {
                        _id: something
                        edges: {
                            edgename1: {
                                t_id:
                                timestamp:
                                order:
                            }
                            ...
                        }
                        optype:
                   }

                 - callback - called whenever the data arrives
                    arguments:
                   * error - eg. vertex not found/network error
                   * obj - an object with properties vertex and optype
             */
        }

        ab.network.edges.get = function(path, request,callback){
            var req = { timestamp: request.timestamp, data: request.names, filters: request.filters };

            process(atomic.post(path + '/~edges', req), callback);

            /*
                Same as listen, but listen only once and when the data arrives, cut off the connection.
                Callback is called only once.
             */
        }

        ab.network.edges.isListening = function(path){
            if(edges[path]) return true; else return false;
        }

        ab.network.edges.stop = function(path){
            delete edges[path];

            /*
                Stop listening for properties on a path
             */
        }

        ab.network.edges.patch = function(path,data,callback){
            var req = { data: data };

            process(atomic.patch(request.path + '/~edges', req), callback);

            /*
                Rest PATCH equivalent

                data will be of the form
                {
                    data: {
                        edgesname1: {
                            path: path of vertex to point to
                            order: order to put. this is optional. if this is not given no orderis set. if it is null, timestamp of server will be set as order
                        }
                    }
                }

                return object
                {
                    _id
                    edgesname1: {
                        t_id:
                        timestamp:
                        order:
                    }
                }
             */
        }

        ab.network.edges.remove = function(path,names,all,callback){
            var req = { data: names, all: all };

            process(atomic.delete(request.path + '/~edges', req));

            /*
                names is array of names of edges to remove
                all means remove all edges

                Rest DELETE equivalent
                - callback
                   arguments:
                    *  error
                    *  obj - with timestamp, _id, and fields just deleted with an empty string (example: if field 'xyz' was deleted { _id: something, timestamp: something, xyz: ''})
             */
        }


    }

    ab.caching.init = function(){

        var beforeLoad = {
            uuid_edges: function(input){
                var output = {
                    byPriority:{},
                    sortedPriorities: new SortedSet(),
                    byName:Object.clone(input.byName)
                };

                for(var priority in input.byPriority){
                    output.byPriority[priority] = new SortedSet(input.byPriority[priority]);
                    output.sortedPriorities.add(priority);
                }

                return output;
            }
        }

        var beforeSave = {
            uuid_edges: function(input){
                var output = {
                    byPriority:input.byPriority,
                    byName:input.byName
                };

                return output;
            }
        }

        ab.caching.inMemory = {
        };

        var keyValFromArgs = function(prefix,key,val){
            if(typeof val === 'undefined'){
                var val = key;
                key = prefix;
            } else {
                key = prefix+':'+key;
            }

            return {key:key,val:val}
        }

        var refineArgs = function(prefix,key,clone){
            if(key === undefined && clone === undefined && prefix){
                var key = prefix;
            } else if(clone === undefined && typeof key === "boolean" && prefix){
                var clone = key;
                key = prefix;

            } else if(typeof key === "string" && prefix) {
                key = prefix+':'+key;
            } else {
                throw 'Invalid arguments for getting from cache.'
            }

            return {key:key,clone:clone};
        }

        ab.caching.get = function(prefix,key,clone){
            var refined = refineArgs(prefix,key,clone);
            var key = refined.key;
            var clone = refined.clone;

            /* TODO: improve storage mechanism of edges.
                As all the edges are stored in a single object, cloning it has a huge overhead.
             */

            var fromPersistent,isFresh;
            if(ab.caching.inMemory[key] || (fromPersistent = amplify.store(key))){
                if(!ab.caching.inMemory[key]){
                    isFresh = false;
                    ab.caching.inMemory[key] = beforeLoad[prefix]?beforeLoad[prefix](fromPersistent):fromPersistent;
                } else {
                    isFresh = true;
                }

                return {val:clone?Object.clone(ab.caching.inMemory[key]):ab.caching.inMemory[key],isFresh:isFresh};

            } else {
                return {isFresh:false};
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

            /* TODO: improve storage mechanism of edges.

             As of now, all the edges are stored in a single object,
             causing a huge write on every persistent save event.

             */

            if(val === undefined){
                amplify.store(key,null);
            } else {
                amplify.store(key,beforeSave[prefix]? beforeSave[prefix](val):val);
            }
        }

        ab.caching.clear = function(prefix,key){
            var key = prefix? refineArgs(prefix,key).key:prefix;

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


                var cached = ab.caching.get(what,key,extras? extras.clone:undefined);

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

                                if(error === ab.errors.vertex_not_found && ab.caching.get("creation",key).val){
                                    //Vertex creation
                                    //TODO: serverside creation of UUIDs for new objects
                                    ab.graph.storage.set(what,key,{uuid:ab.util.uuid(),timestamp:ab.util.timestamp(),properties:{}},{isLocal:true,create:true}).then(function(){
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
                            resolve(cached.val);
                        } else {
                            resolve ({byName:{},byPriority:{},sortedPriorities: new SortedSet()}); //empty object, as server is not available, and the assumption is path_uuid exists, but there are no edges for this uuid.
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
                        if(typeof val !== "string"){
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
                        if(typeof val !== "string"){
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


                        if(typeof val !== "object" || ! val.properties || typeof val.timestamp === 'undefined'){
                            reject ('Object not valid. 1');
                            return;
                        }

                        var storedVertex;

                        if(!extras.isLocal && val.timestamp && storedVertex && storedVertex.timestamp >= val.timestamp){
                            resolve(); //ignore
                            return;
                        }


                        var storeNow = function(){

                            if(extras.patch && storedVertex){
                                for(var prop in val.properties){
                                    val.properties[prop] === null? delete storedVertex.properties[prop] : storedVertex.properties[prop] = val.properties[prop];
                                }

                                val = storedVertex;
                            }

                            //todo: preserve server's version, with a timestamp
                            val.prev = ab.caching.get(what,key).val;
                            val.prev && delete val.prev.prev; //delete older state


                            ab.caching.set(what,key,val);
                            resolve();

                            console.log(val.prev)
                            val.prev && ab.firing.fire('properties',key,val); //fire only if there's a previous version, i.e. the properties are 'modified'
                        }

                        if(extras.isLocal && !extras.create){
                            var extrasNew = Object.clone(extras);
                            extrasNew.clone = true;
                            ab.graph.storage.get(what,key,extrasNew).then(function(vertex){
                                storedVertex = vertex;
                                storeNow();
                            },reject);
                        } else {
                            storeNow();
                        }


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

                        if(typeof val !== "object" || ! val.properties || typeof val.timestamp === 'undefined'){
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

                        if(typeof extras.shouldExist !== 'undefined' ){
                            ab.graph.storage.get('path_vertex',key,extras)
                                .then(function(storedVertex){

                                    if(extras.shouldExist){
                                            storeNow();
                                    }
                                    else {
                                        reject("Vertex already exists.")
                                    }
                                },function(error){

                                    if(!extras.shouldExist && error === ab.errors.vertex_not_found ){
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
                            var storedByName = cached.val? cached.val.byName:{};
                            var storedByPriority = cached.val?cached.val.byPriority:{};
                            var sortedPriorities = cached.val?cached.val.sortedPriorities:new SortedSet();

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

                            if(extras.patch && !Object.isEmpty(storedByName)){
                                for(var edgeName in val){
                                    //TODO: timestamps, if no priority given in the local, server-timestamp is the priority

                                    if(val[edgeName] && val[edgeName].priority === "time"){
                                        val[edgeName].priority = val[edgeName].timestamp;
                                    }

                                    if(storedByName[edgeName]){ //Todo: ( && timestamp greater) )

                                        if(val[edgeName] && val[edgeName].priority === undefined){
                                            val[edgeName].priority = storedByName[edgeName].priority;
                                        }

                                        if(val[edgeName] === null || storedByName[edgeName].priority === val[edgeName].priority){ //todo: 1)server delete flag 2)//todo: check for uuids
                                            //remove edge
                                            toBeFired.push(['edge_removed',key,ab.graph.path_vertex.getSync(extras.path+'/'+edgeName),{edgeName:edgeName,priority:storedByName[edgeName].priority,prev_priority:storedByName[edgeName].priority}]); //todo: vertex

                                            ab.caching.clear('path_uuid',extras.path+'/'+edgeName);
                                            //todo: in edge for edge uuid

                                            var priority = storedByName[edgeName].priority;
                                            storedByPriority[priority].delete(edgeName);
                                            delete storedByName[edgeName];


                                            if(!storedByPriority[priority].length){
                                                sortedPriorities.delete(priority);
                                            }


                                        } else if(val[edgeName].priority !== storedByName[edgeName].priority ){ //todo: check for uuids

                                            toBeFired.push(['edge_moved',key,ab.graph.path_vertex.getSync(extras.path+'/'+edgeName),{edgeName:edgeName,priority:val[edgeName].priority,prev_priority:storedByName[edgeName].priority}]); //todo: vertex

                                            var oldPriority = storedByName[edgeName].priority;
                                            storedByPriority[oldPriority].delete(edgeName);
                                            if(!storedByPriority[oldPriority].length){
                                                sortedPriorities.delete(oldPriority);
                                            }

                                            var newPriority = val[edgeName].priority;
                                            storedByName[edgeName] = val[edgeName];

                                            if(!storedByPriority[newPriority]){
                                                storedByPriority[newPriority] = new SortedSet();
                                            }

                                            storedByPriority[newPriority].add(edgeName);
                                            sortedPriorities.add(newPriority);

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
                                if(!val[edgeName]){ // todo: server delete flag
                                    delete val[edgeName];
                                    continue;
                                }


                                if(val[edgeName].priority === undefined){
                                    val[edgeName].priority = val[edgeName].timestamp;
                                }

                                if(val[edgeName].data){
                                    var path = extras.path+'/'+edgeName;
                                    var vertex = val[edgeName].data;

                                    ab.graph.storage.set('path_vertex',path,vertex);
                                }

                                toBeFired.push(['edge_added',key,val[edgeName].data?val[edgeName].data:ab.graph.path_vertex.getSync(extras.path+'/'+edgeName),{edgeName:edgeName,priority:val[edgeName].priority,prev_priority:null}]);

                                delete val[edgeName].data;

                                if(extras.patch && storedByName)
                                    storedByName[edgeName] = val[edgeName];

                                if(!storedByPriority[val[edgeName].priority]){
                                    storedByPriority[val[edgeName].priority] = new SortedSet();
                                }

                                storedByPriority[val[edgeName].priority].add(edgeName);
                                sortedPriorities.add(val[edgeName].priority);

                                //TODO: in edges
                            }

                            ab.caching.set(what,key,{
                                byName: (extras.patch && storedByName)?storedByName:val,
                                byPriority: storedByPriority,
                                sortedPriorities: sortedPriorities
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

                        if(typeof val !== "object"){
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
                        if(!newEdge.delete){
                            var pros = [];
                            if(edgePath)
                                pros.push(ab.graph.path_vertex.get(edgePath));

                            Promise.all(pros)
                                .then(function(edgeVertex){
                                    edges[edgeName] = {
                                        timestamp: ab.util.timestamp(),
                                        priority: priority,
                                        data:edgeVertex && edgeVertex[0]?edgeVertex[0]:undefined
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
                        } else if(!edgePath){
                            ab.graph.path_vertex.get(path+'/'+edgeName).then(function(vertex){
                                stepTwo();
                            },function(error){
                                if(error === ab.errors.vertex_not_found){
                                    reject("Edge being modifed doesn't exist.");
                                } else {
                                    reject(error);
                                }
                            });

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

        ab.firing.vertexSnapshot = function(vertex){
            vertex = Object.clone(vertex);
            var exports = {};

            exports.properties = function(){
                return vertex.properties;
            }

            exports.prevProperties = function(){
                return vertex.prev?vertex.prev.properties:null;
            }

            return exports;
        }

        ab.firing.edgeSnapshot = function(edgeData){
            //no need to clone, as the object is not going to modified any internal methods
            var exports = {};

            exports.priority = function(){
                return edgeData.priority;
            }

            exports.prevPriority = function(){
                return edgeData.prev_priority;
            }

            exports.name = function(){
                return edgeData.edgeName;
            }

            return exports;
        }

        ab.firing.fire = function(event,uuid,vertex,edgeData){
            var ref;
            var vertexSnapshot = ab.firing.vertexSnapshot(vertex);
            var edgeSnapshot = edgeData? ab.firing.edgeSnapshot(edgeData):undefined;

            var paths = ab.graph.uuid_paths.getSync(uuid);
            for(var path in paths){

                setTimeout(function(path){
                    return function(){

                        switch(event){

                            case "properties":

                                ref  = Appbase.ref(path,true);
                                break;

                            case "edge_added":
                            case "edge_removed":
                            case "edge_changed":
                            case "edge_moved":
                                ref  = Appbase.ref(path+'/'+edgeData.edgeName,true);
                                break;

                            default:
                                throw ('Wrong event.');

                        }

                        //!edgeData && console.log('firing');
                        edgeData && amplify.publish(event+':'+path,false,ref,vertexSnapshot,edgeSnapshot);
                        !edgeData && amplify.publish(event+':'+path,false,ref,vertexSnapshot);
                   }
                }(path),0);

            };
        }

        ab.firing.properties = {};
        ab.firing.properties.on = function(path,name,callback){
            var listenerName = listenerName !== undefined? listenerName:ab.util.uuid();

            ab.graph.path_vertex.get(path)
            .then(function(vertex){
                    var vertexSnapshot = ab.firing.vertexSnapshot(vertex);
                setTimeout(function(){
                    //console.log('added');
                    amplify.subscribe('properties:'+path,name,callback);
                    callback(false,Appbase.ref(path,true),vertexSnapshot);
                },0);

            },function(error){
                //amplify.unsubscribe('properties:'+path,listenerName);
                callback(error);
            });

        }

        ab.firing.properties.off = function(path,name){
            //TODO:
            setTimeout(function(){
                //console.log('removing',name);
                return amplify.unsubscribe('properties:'+path,name); // todo: stop listening, clear from RAM
            },0);
        }

        ab.firing.edges = {};

        ab.firing.edges.off = function(event,path,name){
            //console.log('removing',name);
            //console.log('removed',);
            amplify.unsubscribe(event+':'+path,name)
        }

        ab.firing.edges.on = function(event,path,name,options,callback){
            //todo: check event
            if(typeof name === "function" && callback === undefined && options===undefined){
                var callback = name;
                name = undefined;
            } else if(callback === undefined && typeof options === "function" && typeof name === "string"){
                var callback = options;
                options = undefined;
            } else if(callback === undefined && typeof options === "function" && typeof name === "object") {
                var callback = options;
                options = name;
                name = undefined;
            } else {
                throw "Invalid arguments."
            }

            var name = name !== undefined? name:ab.util.uuid();

            ab.graph.path_out_edges.get(path)  //TODO: provide startAt,endAt
            .then(function(edges){
                if(event === "edge_added"){
                    //fire for existing edges


                    //todo: reverse, skip

                    var startAt = options && typeof options.startAt === 'number'? (edges.sortedPriorities.findLeastGreaterThanOrEqual(options.startAt)!== undefined? edges.sortedPriorities.find(edges.sortedPriorities.findLeastGreaterThanOrEqual(options.startAt).value).index: undefined):0;
                    var endAt = options && typeof options.endAt === 'number'? (edges.sortedPriorities.findGreatestLessThanOrEqual(options.endAt)!== undefined? edges.sortedPriorities.find(edges.sortedPriorities.findGreatestLessThanOrEqual(options.endAt).value).index+1: undefined):edges.sortedPriorities.length; //inclusive

                    if(startAt > endAt){
                        //swap
                        startAt = startAt + endAt;
                        endAt = startAt - endAt;
                        startAt = startAt - endAt;

                        //reverse = true;
                    }

                    var priorities = (startAt !== undefined && endAt !== undefined)? edges.sortedPriorities.slice(startAt,endAt):[];

                    for(var i = 0; (i< priorities.length) ;i++){
                        var priority = priorities[i];

                        edges.byPriority[priority].forEach(function(edgeName,j){
                            var edgePath = path+'/'+edgeName;

                            if(options && options.noData){
                                setTimeout(function(edgePath,i,j){
                                    return function(){

                                        if(i === priorities.length -1 && j === edges.byPriority[priority].length -1 ){
                                            //console.log('added');
                                            amplify.subscribe(event+':'+path,name,callback);
                                        }

                                        callback(false,Appbase.ref(edgePath));

                                    }
                                }(edgePath,i,j),0);



                            } else {
                                ab.graph.path_vertex.get(edgePath).then(function(vertex){
                                    setTimeout(function(edgePath,i,j){
                                        return function(){

                                            if(i === priorities.length -1 && j === edges.byPriority[priority].length -1 ){
                                                //console.log('added');
                                                amplify.subscribe(event+':'+path,name,callback);
                                            }

                                            callback(false,Appbase.ref(edgePath),ab.firing.vertexSnapshot(vertex)); //todo: name and extra data
                                        }
                                    }(edgePath,i,j),0);



                                },callback);
                            }
                        })

                    }



                } else{
                    amplify.subscribe(event+':'+path,name,callback);
                    //todo: think: need anything special?
                }

                //out(function(){
                     // at the end of the stack
                //},0);

            },function(error){
                //amplify.unsubscribe(event+':'+path,listenerName);
                callback(error);
            });

            return name;
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
                if(!((args.ref && args.ref.path()) || args.name)){
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

                args.delete = true; //delete

                ab.graph.path_out_edges.set(priv.path,args,{isLocal:true,patch:true,shouldExist:true}).then(function(){
                    callback(false);// todo: ref and snap
                },callback);
            }

            exports.edges.on = function(event,name,options,callback){
                var lName = ab.firing.edges.on(event,priv.path,name,options,callback);
                //console.log(lName);
                return lName;
            }

            exports.edges.off = function(event,name){
                return ab.firing.edges.off(event,priv.path,name);
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