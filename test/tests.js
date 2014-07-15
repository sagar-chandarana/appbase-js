QUnit.module('hello');
QUnit.test( "hello test", function( assert ) {
  assert.ok( 1 == "1", "Passed!" );
});

QUnit.module('Libs');
QUnit.test("required libraries",function(assert){
    expect(8);
    assert.ok(Promise,"Promise exists");
    assert.ok(Promise.resolve,"Promise.resolve exists");
    assert.ok(Promise.all,"Promise.all exists");
    assert.ok(Promise.reject,"Promise.reject exists");
    assert.ok(Promise.denodeify,"Promise.denodeify exists");

    assert.ok(io,'io exists');

    assert.ok(io.connect,'io.connect exists');

    assert.ok(Appbase,'Appbase exists');
});

var debugMode = Appbase.debug;
/*
QUnit.module('Appbase globals',{
    setup: function() {
        Appbase.debug = {
            ignoreGlobals: true
        }
    },
    teardown: function() {
        Appbase.debug = {
        }
    }
});
*/

QUnit.test("Appbase debug mode",function(assert){
    if(debugMode){
        expect(2);
        assert.ok(Appbase.debug,'Appbase.debug true');
        assert.ok(Appbase.debug.ab,'Appbase.debug.ab');
    } else {
        expect(1);
        assert.ok(true,'Appbase not in debug mode.');
    }

});

QUnit.test('Limiting Appbase global exposure',function(assert){
    var allowedExposure;
    if (debugMode){
        allowedExposure = ['debug','create','ref'];
    } else {
        allowedExposure = ['create','ref'];
    }

    expect(allowedExposure.length);
    for(var key in Appbase){
        assert.ok(allowedExposure.indexOf(key) > -1,'exposed: '+key);
    }
});


/*
QUnit.test('Appbase.create should expect only two args, and strings should not contain " " and "/"',function(assert){
    expect(3);
    assert.throws(function() {Appbase.create('asd','asdas','asdasd')},'Expected only two arguments: namespace and key','No of args');
    assert.throws(function() {Appbase.create('/asdasd/',"asdasd asd")},"Namespace and key should not contain blank-space or '/'","' ' and '/'");

    Appbase.create('asd','asdas');
    assert.ok(true,'Doesnt throw error');
});
*/



if(debugMode){
    QUnit.module('DEBUG ON: Appbase internal methods');
    QUnit.test( "path manipulation methods", function( assert ) {
        expect(13);
        assert.equal(Appbase.debug.ab.util.cutLeadingTrailingSlashes('//one/two//'),'one/two','leading-trailing    slashes');

        var test = function(path,front,cutFront,back,cutBack) {
            assert.equal(Appbase.debug.ab.util.front(path), front,'path:'+path+ ' front-test');
            assert.equal(Appbase.debug.ab.util.cutFront(path), cutFront,'path:'+path+ ' cutFront-test');
            assert.equal(Appbase.debug.ab.util.back(path), back,'path:'+path+ ' back-test');
            assert.equal(Appbase.debug.ab.util.cutBack(path), cutBack,'path:'+path+ ' cutBack-test');
        }

        test('/one/two/three','one','two/three','three','one/two');
        test('/one/two','one','two','two','one');
        test('/one','one','','one','');
    });


    QUnit.module('DEBUG ON: Appbase global methods');
    QUnit.test('Appbase.create',function(assert){
        Appbase.create('lol','yello',function(error){
            assert.equal(error,"Vertex already exists.",'throw error for existing object');
        });

        var random_key = ab.util.uuid();

        Appbase.create('lol',random_key,function(error){
            assert.ok(!error,'No error for a new object');
            var uuid = Appbase.debug.ab.caching.get('path_uuid','lol/'+random_key);
            assert.ok(uuid.val,'path_uuid exists for the new object');
            assert.ok(Appbase.debug.ab.caching.get('uuid_vertex',uuid.val),'vertex_uuid exists for the new object');

        });

        Appbase.create('lol',function(error){
            assert.ok(!error,'No error for a new object with no given key');
        })
    });

    QUnit.module('DEBUG ON: Appbase Ref');
    /*QUnit.test('Appbase.ref,  properties.add, remove',function(assert){
        var path = 'lol/yello';
        var abRef = Appbase.ref(path);

        var prop = 'abc';
        var value = 'pqr';
        var prop1 = 'lol';
        var val1 = 'lala';

        abRef.properties.add(prop,value,function(error){
            assert.ok(error,'no error');

            Appbase.debug.ab.graph.storage.get('path_vertex',path).then(function(vertex){
                assert.equal(vertex.properties[prop],value,'property0 is added.');
            },function(error){
                assert.ok(!error);
            });
        });

        abRef.properties.add(prop1,val1,function(error){
            assert.ok(error,'no error');

            Appbase.debug.ab.graph.storage.get('path_vertex',path).then(function(vertex){
                assert.equal(vertex.properties[prop1],val1,'property1 is added.');
            },function(error){
                assert.ok(!error);
            });
        });

        abRef.properties.remove(prop,function(error){
            assert.ok(error,'no error');


            Appbase.debug.ab.graph.storage.get('path_vertex',path).then(function(vertex){
                assert.equal(vertex.properties[prop],undefined,'property0 is removed.');
                assert.equal(vertex.properties[prop1],val1,'property1 still exists.');
            },function(error){
                assert.ok(!error);
            });
        });

    });

*/

    QUnit.test('properties.on',function(assert){
        expect(12); //this is imp

        var abRef = Appbase.create('lala');

        var prop = 'abc';
        var value = 'pqr';
        var prop1 = 'lol';
        var val1 = 'lala';

        var listener1 = 'popu';

        var props = {}; //for a new object
        var prevProps = null;  //for a new object

        abRef.properties.on(listener1,function(error,ref,snap){
            assert.equal(ref.path(), abRef.path(),'Reference');
            assert.deepEqual(snap.properties(),props,'snap - Props');
            assert.deepEqual(snap.prevProperties(),prevProps,'snap - PrevProps');
        });


        prevProps = {};
        props[prop] = value;
        abRef.properties.add(prop,value);

        prevProps = Object.clone(props);
        props[prop1] = val1;
        abRef.properties.add(prop1,val1);

        prevProps = Object.clone(props);
        delete props[prop];
        abRef.properties.remove(prop);

        abRef.properties.off(listener1); //should not fire now

        abRef.properties.remove(prop1);
    });


    /*

    QUnit.module('DEBUG ON: AppbaseObj',{
        setup: function() {
            Appbase.debug = {
                ignoreFire: true,
                ignoreServerOut:true
            }
        },
        teardown: function() {
            Appbase.debug = {
            }
        }
    });

    QUnit.test("Import - export",function(assert){
        expect(10);


        //---------------import server obj-------------------
        var properties = {
            one: 'one',
            two:'two',
            three:'three'
        }

        var serverObj = {
            properties: JSON.stringify(properties),
            uuid:Appbase.toHide.ab.util.uuid(),
            timestamp: new Date().getTime()
            //,namespace:'gandu'
        }

        var abObj = new Appbase.toHide.AppbaseObj(serverObj);

        assert.deepEqual(abObj.properties,properties,'import properties');
        assert.deepEqual(abObj.uuid,serverObj.uuid,'import uuid');
        assert.deepEqual(abObj.timestamp,serverObj.timestamp,'import timestamp');
        //assert.deepEqual(abObj.namespace,serverObj.namespace,'import ns')
        //TODO: links

        //---------------new server obj-------------------
        properties = {
            four: 'four',
            five:'five'
        }

        var newServerObj = {
            properties: JSON.stringify(properties),
            timestamp: new Date().getTime()
        }

        abObj.importFromServer(newServerObj,true,true);

        assert.deepEqual(abObj.properties,properties,'new server obj: props');
        assert.deepEqual(abObj.timestamp,newServerObj.timestamp,'new server obj: timestamp');
        //TODO: links

        ////---------------adding/removing/replacing properties----------------

        properties['six'] = 'six';
        abObj.addProp('six','six');
        assert.deepEqual(abObj.properties,properties,'adding new prop');

        properties['six'] = 'seven';
        abObj.addProp('six','seven');
        assert.deepEqual(abObj.properties,properties,'replacing a prop');

        delete properties['four'];
        abObj.removeProp('four');

        assert.deepEqual(abObj.properties,properties,'removing a prop');

        assert.deepEqual(abObj.exportProps(),properties,'export props');

        newServerObj.uuid = serverObj.uuid;
        newServerObj.properties = JSON.stringify(properties);

        assert.deepEqual(abObj.exportToServer(),newServerObj,'export for server');
    });

    */

}

