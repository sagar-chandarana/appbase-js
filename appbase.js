Appbase = {};

if (!Object.keys) {
	console.log('setting Object.keys');
    Object.keys = function (obj) {
        var keys = [],
            k;
        for (k in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, k)) {
                keys.push(k);
            }
        }
        return keys;
    };
}

Object.isEmpty = function (obj) {
    return Object.keys(obj).length === 0;
}

//Name space
var ab = {
	util:{},
	net:{
		server:'http://162.242.213.228:3000/'
	},
	pro:{},
	auth:{},
    events:{},
	store:{
        listeners:{},
        rootpath: {},
		obj:{
			put:{
				q:{
					objs:{}
				}
			}
			,storage:{}
			,get:{}
			,parent:{
				objs:{

				}
			}
		}
	}
};

ab.events.types = {
    extern: {
        object_added:"object_added",
        object_removed:"object_removed",
        value:"value",
        object_changed:"object_changed"
    },
    intern: {
        object_added:"object_added",
        object_removed:"object_removed",
        value:"value",
        value_arrived:"value_arrived",
        object_changed:"object_changed"
    }
}

ab.events.initForPath = function(path){
    if (typeof ab.store.listeners[path] == 'undefined'){
        ab.store.listeners[path] = {};

        for(var event in ab.events.types.extern){
            ab.store.listeners[path][ab.events.types.extern[event]] = {};
        }
    }
}

ab.events.fireIntern = function(eventData,data){
    switch(eventData.event){
        case ab.events.types.intern.value:
            ab.events.fireExtern(eventData,data);
            for (var id in ab.store.obj.parent.getParents(eventData.onId)){
                var newData = ab.util.clone(data);
                newData.name = ab.store.obj.parent.getParents(eventData.onId)[id].forKey;
                ab.events.fireIntern({event:ab.events.types.intern.object_changed,onId:id},newData); //TODO: data missing?
            }
            break;

        case ab.events.types.intern.value_arrived:
            eventData.event = ab.events.types.extern.value;
            ab.events.fireExtern(eventData,data);
            break;

        case ab.events.types.intern.object_changed:
            //TODO: fire up.value - recursive listening.
            eventData.event = ab.events.types.extern.object_changed;
            ab.events.fireExtern(eventData,data);
            break;

        case ab.events.types.intern.object_added:
            eventData.event = ab.events.types.extern.object_added;
            ab.events.fireExtern(eventData,data);
            break;

        case ab.events.types.intern.object_removed:
            eventData.event = ab.events.types.extern.object_removed;
            ab.events.fireExtern(eventData,data);
            break;

        default:
            break;
    }
}


var AppbaseSnapObj = function(path, eventData,objData){

    var data = ab.util.clone(objData);

    //filling data
    if(eventData.event == ab.events.types.extern.value){
        data.path = path;
        data.name = ab.util.back(path);

    } else { //object_* event
        data.path = path+'/'+data.name;
    }

    var promises = [];

    if(typeof data.val == 'undefined'){
        promises.push(ab.store.obj.get.nowPro(data.id)
            .then(function(obj){
                data.val = obj.export();
                return Promise.resolve();
            },function(err){
                console.log(err);
                data.val = null;
                return Promise.resolve();
            })
        );
    }

    if(typeof data.index == 'undefined'){
        promises.push(ab.util.pathToUuidPro(ab.util.cutBack(data.path))
            .then(function(uuid){
                return ab.store.obj.get.nowPro(uuid,false);
            })
            .then(function(obj){
                data.index = obj.linksOrdered.indexOf(data.name);
                return Promise.resolve();
            },function(err){
                console.log(err);
                data.index = null;
                return Promise.resolve();
            })
        );
    }

    data.ref = Appbase.ref(data.path,true);

    return Promise.all(promises).then(function(){
        return Promise.resolve({
            prevVal:function(){
                return data.prevVal;
            },
            val: function(){
                return data.val;
            },
            path: function(){
                return data.path;
            },
            name: function(){
                return data.name;
            },
            ref: function(){
                return data.ref;
            },
            index: function(){
                return data.index;
            },
            prevIndex: function(){
                return data.prevIndex;
            },
            exportVal: function(){
                //TODO:
            }

        });

    });

}

ab.events.fireExtern = function(eventData,data){

    if(eventData.paths)
        var paths = eventData.paths;
    else
        var paths = ab.util.uuidToPaths(eventData.onId);

    for(var i=0; i < paths.length;i++) {
        console.log('fired:'+ eventData.event+' on:'+eventData.onId+' prop:'+data.name+' id:'+data.id);

        var fireClosure = function(path) {

            var call = function(callback){
                AppbaseSnapObj(path,eventData,data).then(function(snapObj){
                    setTimeout(callback.bind(undefined,snapObj),0);
                });
            }

            ab.events.initForPath(path);

            if(eventData.callback){
                call(eventData.callback);
            }

            else {
                for (var refId in ab.store.listeners[path][eventData.event]){
                    if(ab.store.listeners[path][eventData.event][refId])
                        call(ab.store.listeners[path][eventData.event][refId]);
                }
            }

        }

        fireClosure(paths[i]);
    }

}

ab.store.obj.parent.addParent = function(childUuid,parentObj,k){
	if(typeof ab.store.obj.parent.objs[childUuid] == 'undefined'){
		ab.store.obj.parent.objs[childUuid] = {	parents: {} }
	}
	ab.store.obj.parent.objs[childUuid].parents[parentObj.id] = {parent:parentObj,forKey:k};
}

ab.util.uuidToPaths = function(uuid){
    if(Object.isEmpty(ab.store.obj.parent.getParents(uuid)) ){
        // root object
        return [ab.store.rootpath[uuid]];
    }

    var paths = [];

    var parents =  ab.store.obj.parent.getParents(uuid);
    for(var parent in parents){
        var parent_paths = ab.util.uuidToPaths(parent);
        for(var i=0;i<parent_paths.length;i++){
            paths.push(parents[parent].forKey +"/" + parent_paths[i]);
        }
    }

    return paths;
}

ab.store.obj.parent.removeParent = function(childUuid,parentObj){
	if(typeof ab.store.obj.parent.objs[childUuid] == 'undefined'){
		ab.store.obj.parent.objs[childUuid] = {	parents: {} }
	}
	delete ab.store.obj.parent.objs[childUuid].parents[parentObj.id]
}

ab.store.obj.parent.getParents = function(childUuid){
	if(typeof ab.store.obj.parent.objs[childUuid] == 'undefined'){
		ab.store.obj.parent.objs[childUuid] = {	parents: {} }
	}
	return ab.store.obj.parent.objs[childUuid].parents;
}

ab.util.parseOrderFromKey = function(key){
    return key.slice(0,key.indexOf('_'));
}

ab.util.parsePropertyFromKey = function(key){
    var key = key.slice(key.indexOf('_')+1);
    return key.slice(key.indexOf('_')+1);
}

ab.util.parseTypeFromKey = function(key){
    var key = key.slice(key.indexOf('_')+1);
    return key.slice(0,key.indexOf('_'));
}

ab.util.front = function(path){
    return path.indexOf('/') == -1? path: path.slice(0,path.indexOf('/'));
}

ab.util.cutFront = function(path){
    return path.indexOf('/') == -1? '': path.slice(path.indexOf('/')+1);
}

ab.util.back = function(path){
    return path.lastIndexOf('/') == -1? path: path.slice(path.lastIndexOf('/')+1);
}

ab.util.cutBack = function(path){
    return path.lastIndexOf('/') == -1? '': path.slice(0,path.lastIndexOf('/'));
}

ab.auth.login = function (uid,pwd,callback){
	/*
	req = new XMLHttpRequest();
	req.open('POST', 'http://192.168.0.18:3000/');
	req.setRequestHeader('Content-Type', 'application/json');
	req.send({'username':uid,'password':pwd});
	*/
	ab.util.postToUrl('http://192.168.0.18:3000/signup',{'username':uid,'password':pwd})
}


ab.store.obj.get.now = function(uuid,createNew,callback){
    if(typeof createNew == "function"){
        var callback = createNew;
        createNew = false;
    }

	if (typeof ab.store.obj.storage[uuid] == 'undefined'){

		if(typeof ab.store.obj.get.noRq[uuid] == 'undefined') {
			ab.store.obj.get.noRq[uuid] = [callback];
		} else {
			ab.store.obj.get.noRq[uuid].push(callback);
			return;
		}


		ab.net.listenToUuid(uuid,function(uuid,createNew){
			return function (err,obj){
				var isANewObj = false;
				if(!err){
					if(!obj)
						if(createNew){
							var obj = {id:uuid,collection:createNew}
							isANewObj = true;
						} else {
							callback(err,null);
							return;
						}

					if(typeof ab.store.obj.storage[uuid] == 'undefined'){
						ab.store.obj.storage[uuid] = new AppbaseObj(obj);
						if(isANewObj)
							ab.store.obj.put.nowId(uuid);
					}


					if(typeof ab.store.obj.get.noRq[uuid] == 'undefined') {
						//real patcher
						ab.store.obj.storage[obj.id].setSelfObj(obj,true);
					} else { //get requests
						while(ab.store.obj.get.noRq[uuid].length){
							cbc = ab.store.obj.get.noRq[uuid].shift();
							cbc(err,ab.store.obj.storage[uuid]);
						}
						delete ab.store.obj.get.noRq[uuid];
					}
				} else {
					throw  Error ('error here!')
				}
			}

		}(uuid,createNew));
	}
	else{
		callback(false,ab.store.obj.storage[uuid]);
	}
}

ab.store.obj.get.nowPro = Promise.denodeify(ab.store.obj.get.now);
ab.store.obj.get.noRq = {};

ab.store.obj.put.nowId = function (uuid){
	if(typeof ab.store.obj.put.q.objs[uuid] == 'undefined')
		ab.store.obj.put.q.objs[uuid] = true;
		setTimeout(ab.store.obj.put.q.process,0);
}
ab.store.obj.put.nowRef = function(abRef){
	abRef.uuid(function(err,uuid){
		ab.store.obj.put.nowId(uuid);
	});
}

ab.store.obj.put.q.isInProcess = false;

ab.store.obj.put.q.process = function (){
	if(ab.store.obj.put.q.isInProcess)
		return;

	for (var uuid in ab.store.obj.put.q.objs){
		//if(ab.store.obj.put.q.objs[uuid]){
			ab.store.obj.put.q.objs[uuid] = false;
			ab.net.putByUuid(ab.store.obj.storage[uuid].generateSelfObj(),function(uuid){
				return function(err){
					delete ab.store.obj.put.q.objs[uuid];
					if(err){
						ab.store.obj.put.nowId(uuid);
					}
				};
			}(uuid));
		//}
	}
	ab.store.obj.put.q.isInProcess = false;
}

//ab.socket = io.connect('http://192.168.0.18:3000/');
ab.socket = io.connect(ab.net.server);
//root immortalspectre

ab.net.listenToUuid = function(uuid, done) {

   ab.socket.emit('get', uuid);
   ab.socket.on(uuid, function(obj) {
       if(obj === "false") {

			console.log(uuid+' not found on server');
			done(false, false);
       }
       else {
			done(false, obj);
       }
   });
}

ab.net.putByUuid = function(obj, done) {
	ab.socket.emit('put', obj);
	done(false);
}

ab.util.getTreePro = function (levels,selfRef){

	return new Promise(
		function(resolve,reject){

			if (levels < 0)
				reject('levels<0');
			else{

				var treeObj = {}
				treeObj.$key = ab.util.parseKeyFromPath(selfRef.getPath());
				treeObj.$ref = selfRef;
				treeObj.$links = null;
				treeObj.$properties = null;

				if (levels == 0){
					resolve(treeObj);
				} else {
					selfRef.uuidPro().then(function(baseUuid){
						return ab.store.obj.get.nowPro(baseUuid,false);
					}).then(function(obj){

						treeObj.$properties = ab.util.clone(obj.properties);
						treeObj.$links = {$count:{},$ordered:{}};
						var pros = []
						var i = 0;

						for (var linkCollection in obj.links){
							for (var prop in obj.links[linkCollection]){
								pros[i] = ab.util.getTreePro(levels-1,Appbase.ref(selfRef.getPath()+'/'+linkCollection+':'+linkKey,true));
								//pros[i] = (ab.util.getTreePro(levels-1, obj.links[linkCollection][linkKey]));
								i++;
							}
						}
						Promise.all(pros).then(function (results){
							i = 0;
							for (var linkCollection in obj.links){
								treeObj.$links[linkCollection] = {};
								for (var linkKey in obj.links[linkCollection]){
									//console.log(results[i]);
									treeObj.$links[linkCollection][linkKey] = results[i];
									i++;
								}
							}

							for (var linkCollection in obj.linksOrdered){
								treeObj.$links.$count[linkCollection] = obj.linksOrdered[linkCollection].length;
								treeObj.$links.$ordered[linkCollection] = [];
								for(var i = 0;i< obj.linksOrdered[linkCollection].length;i++){
									treeObj.$links.$ordered[linkCollection][i] = treeObj.$links[linkCollection][obj.linksOrdered[linkCollection][i]];
								}
							}

							resolve(treeObj);
						});


					});
				}
			}
		}
	);
};

ab.util.clone = function (obj){
	return JSON.parse(JSON.stringify(obj));
}

ab.util.pathToUuid = function (path,callback,parentUuid){
    while(path.lastIndexOf('/') == path.length - 1) {
        path = path.splice(path.length - 1,1);
    }

    if(path.indexOf('/') < 0){
        callback("Path invalid.",false);
        return;
    }

	var front = ab.util.front(path);

	if(typeof parentUuid == 'undefined'){ //the path is newly asked and is not a recursive call

        var _2nd = ab.util.front(ab.util.cutFront(path));
		if( path == front+'/'+_2nd){//unique key
            ab.store.rootpath[_2nd] = path;
			callback(false,_2nd); //second element is key
			return;
		}
		else{ //fetch front uuid
			ab.util.pathToUuid(front+'/'+ab.util.front(ab.util.cutFront(path)),function(orgPath,orgCallback){
				return function (err,frontUuid){ // for front err = always false
					var newPath =  ab.util.cutFront(ab.util.cutFront(path)); //cut front, twice as it was unique obj
					ab.util.pathToUuid(newPath,orgCallback,frontUuid);
					return;
				};
			}(path,callback));
		}
	} else{
        ab.store.obj.get.now(parentUuid,false,function(orgPath,orgCallback){
                return function(err,parentObj){
                    if(!err){
                        if(!parentObj){ //path not found
                            orgCallback(false,false);
                            return;
                        } else{

                            if(orgPath == ''){ //we came to the end
                                orgCallback(false,parentObj.id);
                                return;
                            }

                            var newKey = front;

                            if(typeof parentObj.links[newKey] == 'undefined' ) {
                                orgCallback(false,false);
                                return;
                            }

                            var newVal = parentObj.links[newKey];

                            if (typeof newVal == typeof new Object()){
                                var newPath = ab.util.cutFront(orgPath); //cut front
                                ab.util.pathToUuid(newPath,orgCallback,newVal.uuid);
                            }
                            else {
                                orgCallback(false,false); //as its a property
                            }
                        }
                    } else{
                        orgCallback(err,false);
                        return;
                    }
                };
        }(path,callback));

	}
}

ab.util.pathToUuidPro = Promise.denodeify(ab.util.pathToUuid);

ab.util.uuid = function (){
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
}

ab.util.compare = function (obj1,obj2){

	/*
	for(var x in obj1){
		if(obj1[x] != obj2[x])
			return false;
	}

	for(var x in obj2){
		if(obj1[x] != obj2[x])
			return false;
	}
	*/
}

ab.util.isNumber = function (n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

var AppbaseObj = function (obj){

	this.links = {};

	this.linksOrdered = [];
    this.changed = {};

	this.setSelfObj(obj);
}

AppbaseObj.prototype.export = function(){
    var obj = {};
    for(var prop in this.links){
        if(typeof this.links[prop] != typeof new Object()){
            obj[prop] = this.links[prop];
        }
    }
    return obj;
}

ab.util.uuidToValuePro = function(uuid){
    return ab.store.obj.get.nowPro(uuid)
        .then(function(obj){
            return Promise.resolve(obj.export());
        });
}

AppbaseObj.prototype.setSelfObj = function(obj,isNew){
    console.log('arrived',obj);
    var fireNewValue = false;

    if(!isNew) {
        this.id = obj.id;
        this.collection = obj.collection;
    } else {
        this.changed = typeof obj['changed']== 'undefined'? {}:JSON.parse(obj['changed']);
        var newProps = {};
        var oldVal = this.export();
    }

    delete obj["collection"];
	delete obj["id"];
    delete obj['changed'];

	for (var newLink in obj){
        var type = ab.util.parseTypeFromKey(newLink);
		var order = ab.util.parseOrderFromKey(newLink);
        var prop = ab.util.parsePropertyFromKey(newLink);
        var val = obj[newLink];

        if(isNew)
            newProps[prop] = true;

        if (type == typeof new Object()){
            var uuid = val;
            val = {
                uuid: uuid
            }
        }

        if(!isNew || typeof this.links[prop] == 'undefined')
            fireNewValue = true;
        	this.insert(prop,val,order,true);
	}

    if(isNew){
        for (var prop in this.links)
            if (! newProps[prop])
                fireNewValue = true;
                this.remove(prop,true);

        if(fireNewValue){
            ab.events.fireIntern({event:ab.events.types.intern.value,onId:this.id},{id:this.id,val:this.export(),prevVal:oldVal});
        }
    } else {
        //ab.events.fireIntern({event:ab.events.types.intern.value_arrived,onId:this.id},{id:this.id,val:this.export(),prevVal:null});
    }
}

AppbaseObj.prototype.generateSelfObj = function(){
	var obj = {id:this.id};
    obj.changed = JSON.stringify(this.changed);
    this.changed = {};
	obj.collection = this.collection;
    this.linksOrdered = this.linksOrdered.filter(function(n){ return n != undefined })

    for (var i = 0;i< this.linksOrdered.length;i++){
        var prop = this.linksOrdered[i];
        var key = i.toString()+'_' + typeof this.links[prop]+ '_' + prop;
        obj[key] = this.links[prop];
    }

    console.log('generated:',obj);
	return obj;
}

AppbaseObj.prototype.insert = function(prop,val,order,isRemote){

    var oldSelfVal = this.export();
    var oldObjVal = this.links[prop];
    if (typeof oldObjVal == 'undefined' )
        oldObjVal = null;
    else if(typeof oldObjVal == typeof new Object()){

        if(typeof ab.store.obj.storage[oldObjVal.uuid] != 'undefined'){ // shouldn't call get now, as the oldObjVal has to be local
            oldObjVal = ab.store.obj.storage[oldObjVal.uuid].export();
        } else {
            oldObjVal = null;
        }
    }
    this.links[prop] = val;
    if (typeof val == typeof new Object())
        ab.store.obj.parent.addParent(val.uuid,this,prop);

    //handle ordering
    var oldIndex = this.linksOrdered.indexOf(prop);


    console.log(this.links,prop,'old',oldIndex);

    if(oldIndex >= 0){
        if(typeof order == 'undefined' ){
            var order = oldIndex;
        }

        this.linksOrdered.splice(oldIndex,1);

    } else if(typeof order == 'undefined') {
        var order = 0;
    }

    if (order < 0){
        order = this.linksOrdered.length + order + 1;
    }

    if(typeof this.linksOrdered[order] == 'undefined')
        this.linksOrdered[order] = prop;
    else
        this.linksOrdered.splice(order,0,prop);

    if(oldIndex >= 0){ //object already exits
        if(!isRemote || this.changed[prop]){ //changed locally or change is specified from server

            var data = {
                id:(typeof val == typeof new Object()?val.uuid:null),
                val: (typeof val == typeof new Object()?undefined:val),
                prevVal:oldObjVal,
                index:order,
                prevIndex:oldIndex,
                name:prop
            };

            ab.events.fireIntern({event:ab.events.types.intern.object_changed,onId:this.id},data);
            console.log('changed')

            if(isRemote)
                delete this.changed[prop];
            else
                this.changed[prop] = true;
        }

    } else {
        if(!isRemote)
            ab.events.fireIntern({event:ab.events.types.intern.object_added,onId:this.id},{id:(typeof val == typeof new Object()?val.uuid:null),val: (typeof val == typeof new Object()?undefined:val),prevVal:null,index:0,prevIndex:null,name:prop});
    }

	if(!isRemote){
        ab.events.fireIntern({event:ab.events.types.intern.value,onId:this.id},{id:this.id,prevVal:oldSelfVal,val:this.export()});
        ab.store.obj.put.nowId(this.id);
    }

}


AppbaseObj.prototype.remove = function(prop,isRemote){
    var selfVal = this.export();
    var val = this.links[prop];
    if (typeof val == 'undefined'){
        console.log('removing undefined prop!');
        return;
    } else if(typeof val == typeof new Object()){
        var objUuid = val.uuid;
        if(typeof ab.store.obj.storage[val.uuid] != 'undefined'){ // shouldn't call get now, as the oldObjVal has to be local
            val = ab.store.obj.storage[val.uuid].export();
        } else {
            val = null;
        }
    }

	delete this.links[prop];

	var order = this.linksOrdered.indexOf(prop);
	this.linksOrdered.splice(order,1);

    if(typeof val == typeof new Object())
	    ab.store.obj.parent.removeParent(objUuid,this);

    ab.events.fireIntern({event:ab.events.types.intern.object_removed,onId:this.id},{id:(typeof val == typeof new Object()?objUuid:null),val:null,index:null,prevVal:val,prevIndex:order});

    if(!isRemote){
        ab.events.fireIntern({event:ab.events.types.intern.value,onId:this.id},{id:this.id,val:this.export(),prevVal:selfVal});
        ab.store.obj.put.nowId(this.id);
    }
}

var AppbaseRef = function(path,dontFetch){
    //TODO: reference to a property
	this._path = path;
	this.refId = ab.util.uuid(); //this id is used to make this ref a unique identity, which will be used to add/remove listeners

	var isAPath = false;
	if (this.path() == ab.util.front(this.path())){
		var id = ab.util.uuid();
		this._path = this.path()+"/"+id;
	}

	if(ab.util.cutFront(ab.util.cutFront(path)).indexOf('/')>=0){
		isAPath = true;
	}

	if(dontFetch) {
		//light weight
	} else {
		this.uuid(function(path,isAPath){
			return function(err,uuid){
				if(uuid){
					if(isAPath){
						ab.store.obj.get.now(uuid,false,function(err,obj){ if(!obj) throw new Error(path+": Path doesn't exist");});
					} else {
						ab.store.obj.get.now(uuid,ab.util.front(path),function(){});
					}
				} else{
					throw new Error(path+": Path doesn't exist");
				}
			};
		}(this.path(),isAPath));
	}

}

Appbase.ref = function(arg,dontFetch){
	return new AppbaseRef(arg,dontFetch);
}

Appbase.new = function(arg){
	return new AppbaseRef(arg);
}

AppbaseRef.prototype.uuidPro = function(){
	return ab.util.pathToUuidPro(this.path());
}

AppbaseRef.prototype.uuid = function(callback) {
	ab.util.pathToUuid(this.path(),callback);

    return this;
}

AppbaseRef.prototype.path = function(){
	return this._path;
}


AppbaseRef.prototype.on = function(event,fun,levels){
    //TODO: options
    if(! ab.events.types.extern[event] ){
        throw new Error("Invalid event.");
        return this;
    }

    ab.events.initForPath(this.path());

    //bring the object
    var that = this;
    var uid;
    this.uuidPro()
    .then(function(uuid){
        uid = uuid;
        return ab.store.obj.get.nowPro(uuid);
    }).then(function(obj){
            var eventData = {
                event: event,
                onId: uid,
                callback:fun,
                paths: [that.path()]
            }

            switch(event){

                case ab.events.types.extern.value:
                    var data = { val: obj.export(),
                        prevVal: null,
                        id: uid,
                        prevIndex:null
                    }

                    ab.events.fireExtern(eventData,data);
                    ab.store.listeners[that.path()][event][that.refId] = fun;
                    break;
                case ab.events.types.extern.object_added:
                    var promises = [];
                    for(var i=0;i<obj.linksOrdered;i++) {
                        if(obj.linksOrdered != undefined){
                            var val = obj.links[obj.linksOrdered[i]];
                            if(typeof val == typeof new Object()){
                                promises.push(ab.store.obj.get.nowPro(val.uuid));
                            }
                        }
                    }

                    Promise.all(promises).then(function(){
                        for(var i=0;i<obj.linksOrdered.length;i++) {
                            var val = obj.links[obj.linksOrdered[i]];
                            var data = {
                                prevVal: null,
                                name: obj.linksOrdered[i],
                                prevIndex:null,
                                index:i
                            }
                            if(typeof val == typeof new Object()){
                                data.id = val.uuid;
                            } else {
                                data.id = null,
                                data.val = val
                            }
                            ab.events.fireExtern(eventData,data);
                        }

                        ab.store.listeners[that.path()][event][that.refId] = fun;
                    })

                    break;
                default:
                    ab.store.listeners[that.path()][event][that.refId] = fun;
                    break;
            }
    },function(error){
        console.log(error);
    })

    return this;

}

AppbaseRef.prototype.off = function(event){
    ab.events.initForPath(this.path());
    if(event)
        delete ab.store.listeners[this.path()][event][this.refId];
    else
        for(var event in ab.store.listeners[this.path()])
            delete ab.store.listeners[this.path()][event][this.refId];

    return this;
}

AppbaseRef.prototype.insert = function(prop,val){
    var promises = [];
    promises.push(this.uuidPro().then(function(uuid){return ab.store.obj.get.nowPro(uuid)}));

    if(typeof val == typeof new Object()){ //TODO: check for AppbaseReference
        promises.push(val.uuidPro());
    }

    Promise.all(promises)
    .then(function(arr){
        if(arr.length == 2)
            val = { uuid: arr[1] } ;

        arr[0].insert(prop,val);
    });

    return this;
}

AppbaseRef.prototype.remove= function(prop){
    ab.util.pathToUuidPro(this.path())
        .then(function(uuid){
            return ab.store.obj.get.nowPro(uuid);
        })
        .then(function(obj){
            obj.remove(prop);
        });

    return this;
}

ab1 = Appbase.new('albela/sajan4');
//ab2 = Appbase.new('bella/vampire');

//ab1.insert('lolea',ab2);
//ab.util.pathToUuid('abc/xyz/lol',function(yo,lo){console.log(yo,lo)});

