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

//Name space
var ab = {
	util:{},
	net:{
		server:'http://162.242.213.228:3000/'
	},
	pro:{},
	auth:{},
	store:{
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

ab.store.obj.parent.addParent = function(childUuid,parentObj,k){
	if(typeof ab.store.obj.parent.objs[childUuid] == 'undefined'){
		ab.store.obj.parent.objs[childUuid] = {	parents: {} }
	}
	ab.store.obj.parent.objs[childUuid].parents[parentObj.id] = {parent:parentObj,forKey:k};
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

ab.util.parseTypeFromKey = function(key){
    var key = key.slice(key.indexOf('_')+1);
    return key.slice(0,key.indexOf('_'));
}

ab.util.front = function(path){
    return path.indexOf('/') == -1? path: path.slice(0,path.indexOf('/'));;
}

ab.util.cutFront = function(path){
    return path.indexOf('/') == -1? '': path.slice(path.indexOf('/')+1);;
}

ab.util.postToUrl = function (path, params, method) {
    method = method || "post"; // Set method to post by default if not specified.

    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);
    for(var key in params) {
        if(params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
         }
    }
    document.body.appendChild(form);
    form.submit();
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
							obj = {id:uuid,collection:createNew}
							isANewObj = true;
						} else {
							callback(err,false);
							return;
						}

					if(typeof ab.store.obj.storage[uuid] == 'undefined'){
						ab.store.obj.storage[uuid] = new AppbaseObj(obj);
						if(isANewObj)
							ab.store.obj.put.nowId(uuid);
					}


					if(typeof ab.store.obj.get.noRq[uuid] == 'undefined') {
						//real patcher
						//console.log('patching')
						//console.log(obj)
						ab.store.obj.storage[obj.id].setNewSelfObj(obj);
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
	//console.log("listening:"+uuid);
   ab.socket.emit('get', uuid);
   ab.socket.on(uuid, function(obj) {
       if(obj === "false") {

			console.log(uuid+' not found on server');
			done(false, false);
       }
       else {
			//console.log('arrived')
			//console.log(obj);
			done(false, obj);
       }
   });
}

ab.net.putByUuid = function(obj, done) {
	//console.log('putting')
	//console.log(obj);
	ab.socket.emit('put', obj);
	done(false);
}

/*
ab.net.getByUuid = function (uuid,callback){
	/* callback function(err,obj).
	err - true/false (only network error).
	obj - false in case of err or uuid not found.
	*

	//TODO: ab.net.listenToUuid(collection,uuid,obj){}

	callback(false,false);
}

ab.net.putByUuid = function (obj,callback){
	//console.log(obj);
	//uuid = obj.id
	//collection = obj.collection
	/*
		callback function(err).
	*
	callback(false);
}


ab.net.listenToUuid = function (uuid,callback){
	//callback err(network),obj

	callback(false,false);
} */

ab.util.getTreePro = function (levels,selfRef){
	//console.log(levels,baseUuid)
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
							for (var linkKey in obj.links[linkCollection]){
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

//treePro = ab.util.getTreePro;
/*
ab.util.getTree = function (levels,baseUuid,callback){
	if (levels < 1)
		return null;
	if (levels == 1)
		return ab.util.clone(ab.store.obj.storage[baseUuid].properties);

	var obj = ab.util.clone(ab.store.obj.storage[baseUuid].properties);


		for (var linkKey in ab.store.obj.storage[baseUuid].links[linkCollection]){
			obj['@'+linkCollection][linkKey] = ab.util.createSnapshot(levels-1, ab.store.obj.storage[baseUuid].links[linkCollection][linkKey]);
		}
	}

	return ab.util.clone(obj);
}
*/
//ab.util.getTreePro = Promise.denodeify(ab.util.getTree);

ab.util.clone = function (obj){
	return JSON.parse(JSON.stringify(obj));
}

ab.util.pathToUuid = function (path,callback,parentUuid){
	var front = ab.util.front(path);

	//var collection = ab.util.parseCollectionFromPath(front);
	//var key = ab.util.parseKeyFromPath(front);

	if(typeof parentUuid == 'undefined'){ //the path is newly asked and is not a recursive call

		if( path == front+'/'+ab.util.front(ab.util.cutFront(path))){
			//unique key
			callback(false,ab.util.front(ab.util.cutFront(path))); //second element is key
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
	} else{ //we have the parentUuid and a path.
		//if(path == ''){ //we came to the end
		//	callback(false,parentUuid);
		//	return;
		//} else {
			//console.log('here fetching:'+parentUuid);
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
								//ab.util.pathToUuid(newPath,orgCallback,newParentUuid);
							}
						} else{
							orgCallback(err,false);
							return;
						}
					};
			}(path,callback));
		//}

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
/*
ab.util.parseCollectionFromPath = function (Path){
	var temp = Path.slice(Path.lastIndexOf('/')+1);
	temp = temp.lastIndexOf(':')== -1 ? temp.slice(temp.lastIndexOf('@')+1): temp.slice(temp.lastIndexOf('@')+1,temp.lastIndexOf(':'));
	return temp
}
*/
ab.util.isNumber = function (n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

var AppbaseObj = function (obj){

	//this.paths[path]=true;
	//this.key = ab.util.parseKeyFromPath(path);

	this.links = {};

	this.linksOrdered = [];

	this.listeners = {
		link_added:{},
		link_removed:{},
		value_changed:{},
		subtree_changed:{},
		link_changed:{}
	};

	this.setSelfObj(obj);
}

AppbaseObj.prototype.setSelfObj = function(obj){
	this.id = obj.id;
	//this.properties = typeof obj.properties != "undefined"? JSON.parse(obj.properties):{};
	this.collection = obj.collection;

	delete obj["properties"];
	delete obj["collection"];
	delete obj["id"];



	for (var newLink in obj){
        var type = ab.util.parseTypeFromKey(newLink);
		var order = ab.util.parseOrderFromKey(newLink);
        var val = obj[newLink];
        if (type == typeof new Object()){
            val = {
                uuid: val
            }
        }

		this.addLink(newLink,val,true,order);
	}
}

AppbaseObj.prototype.generateSelfObj = function(){
	var obj = {id:this.id};
	obj.properties = JSON.stringify(this.properties);

	obj.collection = this.collection;

	//for (var oldLinkCollection in this.linksOrdered){
		//console.log(this.linksOrdered[oldLinkCollection])
		for (var i = 0;i< this.linksOrdered.length;i++){
			var oldLinkKey = this.linksOrdered[i];
			obj[oldLinkKey] = i.toString()+':'+this.links[oldLinkKey];
		}
	//}

	return obj;
}

AppbaseObj.prototype.setNewSelfObj = function(obj){


	delete obj["properties"];
	delete obj["collection"];
	delete obj["id"];



    for (var newLink in obj){
        var type = ab.util.parseTypeFromKey(newLink);
        var order = ab.util.parseOrderFromKey(newLink);
        var val = obj[newLink];
        if (type == typeof new Object()){
            val = {
                uuid: val
            }
        }

        //TODO: handle order change, property value change, firing

        this.addLink(newLink,val,true,order);
    }


    for (var oldLinkKey in this.links)
        if (typeof obj[oldLinkKey] == 'undefined')
            this.removeLink(oldLinkKey);


}

AppbaseObj.prototype.setProps = function(prop){
	for (var x in prop) {
		this.properties[x] = prop[x];
	}
	this.fire('value_changed',ab.util.clone(this.properties));
}


AppbaseObj.prototype.addLink = function(linkName,val,noFire,order){
	noFire = false || noFire;

    this.links[linkName] = val;

    //handle ordering
    var oldIndex = this.linksOrdered.indexOf(val);

    if(typeof order != 'undefined'){

        if(oldIndex) {
            this.linksOrdered.splice(oldIndex,1);
        }

        if (order < 0){
            order = this.linksOrdered.length + order + 1;
        }

        if(typeof this.linksOrdered[order] == 'undefined')
            this.linksOrdered[order] = linkName;
        else
            this.linksOrdered.splice(order,0,linkName);

	}
	else if( oldIndex ){
        //property exits, order not defined. do nothing,
	} else {
        this.linksOrdered.unshift(linkName); //new property, order not defined - push to top
    }

    if (typeof val == typeof new Object())
	    ab.store.obj.parent.addParent(val.uuid,this,linkName);

	if(!noFire)
		this.fire('link_added',Appbase.ref(ab.util.parseCollectionFromPath(linkName)+":"+uuid))

}



AppbaseObj.prototype.fire = function(event,obj){
	//console.log('firing:'+event)
	//console.log(obj)
	for (var refId in this.listeners[event]){
		if(this.listeners[event][refId])
			setTimeout(this.listeners[event][refId].bind(undefined,obj),0);
	}

	switch(event){
		case 'value_changed':
			for (var id in ab.store.obj.parent.getParents(this.id)){
				ab.store.obj.parent.getParents(this.id)[id].parent.fire('link_changed',Appbase.ref(this.collection+':'+this.id))
			}
		break;
		case  'link_changed':
		case  'link_added':
		case  'link_removed':
			this.fire('subtree_changed',[obj[0],event]);
			//this.fire('link_changed',[obj[0],event]);
			/*
			for (var id in ab.store.obj.parent.getParents(this.id)){

				ab.store.obj.parent.getParents(this.id)[id].parent.fire('subtree_changed',[this.collection+':'+ab.store.obj.parent.getParents(this.id)[id].forKey+'/'+obj[0],event])
			}*/
		//break;

		case  'subtree_changed':
			for (var id in ab.store.obj.parent.getParents(this.id)){
				ab.store.obj.parent.getParents(this.id)[id].parent.fire('subtree_changed',[this.collection+':'+ab.store.obj.parent.getParents(this.id)[id].forKey+'/'+obj[0],obj[1]])
			}
		break;

		default:
			break;
	}
}

AppbaseObj.prototype.addListener = function(event,id,func){
	this.listeners[event][id] = func;
}



AppbaseObj.prototype.removeLink = function(linkName){

	//var linkCollection = ab.util.parseCollectionFromPath(linkName);
	//var linkGroupC =  ab.util.parseGroupCollectionFromPath(linkName);
	//var linkKey = ab.util.parseKeyFromPath(linkName);



	//if(typeof this.links[linkCollection] == 'undefined' || typeof this.links[linkCollection][linkKey] == 'undefined' )
		//return;
	var val = this.links[linkName]
    if (typeof val == 'undefined')
        return;

	delete this.links[linkName];
	//delete this.linksUuid[uuid];

	var order = this.linksOrdered.indexOf(linkKey);
	this.linksOrdered.splice(order,1);

    if(typeof val == typeof new Object())
	    ab.store.obj.parent.removeParent(val.uuid,this);

	/*
	var thisRef = this;
	ab.store.obj.get.nowPro(uuid,false).then(function(childObj){
		childObj.removeParent(thisRef);
	}).then(null,console.log);
	*/

	this.fire('link_removed',Appbase.ref(ab.util.parseCollectionFromPath(linkName)+":"+uuid))
}

var AppbaseRef = function(path,dontFetch){
	this.path = path;
	this.refId = ab.util.uuid(); //this id is used to make this ref a unique identity, which will be used to add/remove listeners

	var isAPath = false;
	if (this.path == ab.util.front(this.path)){
		var id = ab.util.uuid();
		this.path = this.path+"/"+id;
	}

	if(ab.util.cutFront(ab.util.cutFront(path)).indexOf('/')>=0){
		isAPath = true;
	}

	/*
	abc = function(thisRef){
		thisRef.uuidPro().then(function(uuid){
			console.log(uuid);
			if(uuid){
				return ab.store.obj.get.nowPro(uuid,ab.util.parseCollectionFromPath(thisRef.path));
			} else {
				throw Error(thisRef.path+": Path doesn't exist");
			}
		}).then(console.log,console.log)
	}
	abc(this);
	*/
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
		}(this.path,isAPath));
	}


	/*
	if (typeof ab.store.obj.storage[this.uuid()] == 'undefined'){
		var obj = {id:this.uuid(),collection:ab.util.parseCollectionFromPath(path)}
		ab.store.obj.storage[this.uuid()] = new AppbaseObj(obj);

	}*/

}

Appbase.ref = function(arg,dontFetch){
	return new AppbaseRef(arg,dontFetch);
}

Appbase.new = function(arg){
	return new AppbaseRef(arg);
}

/*
AppbaseRef.prototype.getLinks = function(collection,levels,limit,callback){
	this.getTree(1,function(treeObj){
		var pros = [];
		if(typeof treeObj.$links.$ordered[collection] == 'undefined'){
			treeObj.$links.$ordered[collection] = [];
		}

		for(var i = 0;i<limit && treeObj.$links.$ordered[collection].length;i++){
			treeObj.$links.$ordered[collection][i].$ref.get
		}
		Promise.all(treeObj.$linksOrdered.$)

	})
	this.uuidPro().then(function(uuid){
			return ab.util.getTreePro(levels,uuid);
	}).then(function(treeObj){
		var arry = [];
		for(var x in treeObj['@'+collection]){
			treeObj['@'+collection][x]['_id'] = x;
			arry.push(treeObj['@'+collection][x]);
		};
		callback(arry);
	})
}
*/


AppbaseRef.prototype.uuidPro = function(){
	return ab.util.pathToUuidPro(this.getPath()).then(function(uuid){ return uuid; });
}

AppbaseRef.prototype.uuid = function(callback) {
	ab.util.pathToUuid(this.path,callback);
}

AppbaseRef.prototype.linkRef = function (path){
	if(path == parseCollectionFromPath)
		isACollection = true;
	return new AppbaseRef(this.path+'/'+path)
}

/*
AppbaseRef.prototype.countLinks = function(collection,cb){

	this.uuidPro().then(function(uuid) {
		return ab.store.obj.get.nowPro(uuid,false)
	}).then(function(obj){
		cb(Object.keys(obj[links][collection]).length);
	});

}
*/

AppbaseRef.prototype.getPath = function(){
	return this.path;
}

AppbaseRef.prototype.getKey = function(){
	return ab.util.parseKeyFromPath(this.path);
}

AppbaseRef.prototype.getCollection = function(){
	return ab.util.parseCollectionFromPath(this.path);
}

AppbaseRef.prototype.set= function(prop,val){
	var obj = {};
	obj[prop] = val;
	this.uuid(function(collection, propObj){
		return function(err,uuid){
			ab.store.obj.get.now(uuid,false,function(propObj){
				return function(err,obj){
					obj.setProps(propObj);
					ab.store.obj.put.nowId(obj.id)
				};
			}(propObj));
		};
	}(this.collection,obj));
	return this;
}

/*
AppbaseRef.prototype.getTree = function (levels,cb){
	ab.util.getTreePro(levels,this).then(function(tree){
		cb(tree);
	});
}
*/

AppbaseRef.prototype.get= function(prop,cb){
	if( typeof prop == typeof (function(){})) {
		var cb = prop;
		prop = null;
	}


	this.uuid(function( prop,cb){
		return function(err,uuid){
			ab.store.obj.get.now(uuid,false,function(prop,cb){
				return function(err,obj){
					if(prop){
						if(typeof  obj.properties[prop] == 'undefined')
							cb(null);
						else
							cb(obj.properties[prop]);
					} else {
						cb(ab.util.clone(obj.properties));
					}
				};
			}(prop,cb));
		};
	}(prop,cb));
}

AppbaseRef.prototype.on= function(event,fun,levels){
	var listenObj = [event,this.refId,fun,levels];

	/*
	this.uuidPro().then(function (uuid){
		return ab.store.obj.get.nowPro(uuid,false);
	}).then(function(obj){
		obj.listeners[listenObj[0]][listenObj[1]] = listenObj[2];;
	}).catch(console.log)

	*/
	var thisRef = this;
	this.uuid(function(collection, listenObj){
		return function(err,uuid){
			if (listenObj[0] =='link_changed' || listenObj[0] == 'subtree_changed'){
				ab.util.getTreePro(typeof listenObj[3] == 'undefined'? 2: listenObj[3],thisRef);
			}

			ab.store.obj.get.now(uuid,false,function(listenObj){
				return function(err,obj){
					obj.listeners[listenObj[0]][listenObj[1]] = listenObj[2];;
				};
			}(listenObj));

		};
	}(this.collection,listenObj));
}

AppbaseRef.prototype.off= function(event){
	var listenObj = [event,this.refId]
	/*
	this.uuidPro().then(function (uuid){
		return ab.store.obj.get.nowPro(uuid,false);
	}).then(function(obj){
		delete  obj.listeners[listenObj[0]][listenObj[1]];
	}).catch(console.log)
	*/

	this.uuid(function(collection, listenObj){
		return function(err,uuid){
			ab.store.obj.get.now(uuid,false,function(listenObj){
				return function(err,obj){
					delete  obj.listeners[listenObj[0]][listenObj[1]];
				};
			}(listenObj));
		};
	}(this.collection,listenObj));

}



AppbaseRef.prototype.addLink= function(linkKey,abRef){
	if(typeof linkKey == 'object'){
		var abRef = linkKey;
		linkKey = ab.util.parseKeyFromPath(abRef.getPath());
	}

	var linkPath = abRef.getPath();
	var linkCollection = ab.util.parseCollectionFromPath(linkPath);
	//var linkName = linkCollection+':'+linkKey;
    var linkName = linkKey;

	Promise.all([this.getPath(),linkPath].map(function (path){return ab.util.pathToUuidPro(path)}))
	.then(function (uuids){
		return Promise.all(uuids.map(function (uuid) { return ab.store.obj.get.nowPro(uuid,false)}))
	}).then(function(objs){
		//objs[1].addParent(objs[0],ab.util.parseKeyFromPath(linkName));
		objs[0].addLink(linkName,objs[1].id);
		ab.store.obj.put.nowId(objs[0].id);
	});

	/*
	ab.util.pathToUuid(linkPath,function(linkName,linkPath,thisRef){
		return function(err,linkUuid){
			var linkCollection = ab.util.parseCollectionFromPath(linkName);
			var linkKey = ab.util.parseKeyFromPath(linkName) ;
			if(linkKey == '')
				linkKey = ab.util.parseKeyFromPath(linkPath);
				linkName = linkCollection+':'+linkKey;

			if(linkCollection != ab.util.parseCollectionFromPath(linkPath)){
				throw new Error("Collections don't match.");
				return;
			}
			else { //success
				ab.store.obj.get.now(linkUuid,false,function(linkName,linkPath,thisRef){
					return function(err,refObj){
						thisRef.uuid(function(linkName,refObj){
							return function(err,thisUuid){
								ab.store.obj.get.now(thisUuid,false,function(linkName,refObj){
									return function(err,thisObj){
										refObj.addParent(ab.store.obj.storage[thisObj.id],ab.util.parseKeyFromPath(linkName));
										thisObj.addLink(linkName,refObj.id);
										ab.store.obj.put.nowId(thisObj.id);
									}
								}(linkName,refObj));
							}
						}(linkName,refObj,thisRef.collection));

					}
				}(linkName,linkPath,thisRef));
			}
		};
	}(linkName,linkPath,this));
	*/

}

AppbaseRef.prototype.removeLink= function(abRef){
	console.log('remove:'+abRef);
	Promise.all([this.getPath(),abRef.getPath()].map(function (path){return ab.util.pathToUuidPro(path)}))
	.then(function (uuids){
		return Promise.all(uuids.map(function (uuid) { return ab.store.obj.get.nowPro(uuid,false)}))
	}).then(function(objs){
		objs[0].removeLinkUuid(objs[1].id);
		ab.store.obj.put.nowId(objs[0].id);
	});

	/*
	this.uuidPro().then(
		function(uuid){
			return ab.store.obj.get.nowPro(uuid,false);
		}
	).then(
		function(obj){
			obj.removeLink(linkName);
			ab.store.obj.put.nowId(obj.id);
		}
	)
	*/
}


//test


//console.log(ab.util.parseCollectionFromPath('Tweet:s'))
//AbO.setProps({lala:"mama"});
//laafasf = AbO.generateSelfObj;
//laafasf["Tweet:asfasf"] = "zdsrhzdth"
//AbO.setNewSelfObj(laafasf);
//delete laafasf["Tweet:asfasf"]
//AbO.setNewSelfObj(laafasf);
//setTimeout(AbO.setNewSelfObj.bind(AbO,laafasf),5000);


//ab.auth.login('sdfSD','SDFSDF');
//abR = new Appbase.ref.('User:sagar/Tweet:ABC');

//abR.set('as','asdd');

/*
abR.on('subtree_changed',function(obj){
	console.log(obj);
});

ab21 = new Appbase.ref.('User:faad');


abR.addLink('User',ab21.getPath());

ab21.addLink('Tweet',(new Appbase.ref.('Tweet:123')).getPath())


abRNew = new Appbase.ref.('User:sagar/User:faad');


ab3 = new Appbase.ref.('Tweet:123')

abRNew.on('subtree_changed',function(obj){
	console.log(obj);
});

ab3.set('asd','rezdybry5')
*/
//console.log(abR.getSnapshot(8));

/*
abR = new Appbase.ref.('User:sagar');

abR.on('link_removed',function(obj){
	console.log(obj);
})

abc =  new Appbase.ref.('User:faad');



abR.addLink('User',abc.getPath())
setTimeout(function () {abR.removeLink('User:faad')},2000);





//uuidPro(abR.getPath()).then(console.log)
*/






//signup(ab.net.server+'signup', "sagar", "pass", function(){
	//authenticate(ab.net.server+'login', "sagar", "pass", function(){

	//});
//});
//authenticate(ab.net.server+'login', "abc@d.com", "pass", callback);
/*
window['abFuncs'] = {};
Appbase.search = function( query, dn) {
	var path = ab.net.server;
	var uuidFunc = 'fchut'+ab.util.uuid().replace(/-/g,'');
	var closure = function(dn,uuidFunc){
		//console.log('asf')
		return function(uuids){
			//console.log(uuids);
			delete window[uuidFunc];
			//uuids = ['sagar']
			Promise.all(uuids.map(function (uuid) {  return ab.store.obj.get.nowPro(uuid,false)})).then(function(objs){
				//console.log(objs);
				var refArray = [];
				objs.forEach(function(obj){
					refArray.push(Appbase.ref(obj.collection+':'+obj.id));
				});
				dn(refArray);
			});
		}
	}

	window[uuidFunc] = closure(dn,uuidFunc);
   var scr = document.createElement("script");
   scr.type = "text/javascript";
   scr.src = path+"search?callback="+uuidFunc+"&collection="+query.collection+"&property="+query.property+"&sstring="+query.sstring;
   document.body.appendChild(scr);
} */
//abR = Appbase.ref('User:sagarlolol');
//abR.on('value_changed',function(obj){console.log(obj)});
//abR.set('val','pro');

ab.util.pathToUuid('abc/xyz/lol',function(yo,lo){console.log(yo,lo)});

