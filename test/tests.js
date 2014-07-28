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
    Appbase.debug.ab.caching.clear();

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

    QUnit.module('DEBUG ON: Appbase Ref', {
        setup: function() {

        },
        teardown: function() {
        }
    });

    QUnit.test('Appbase.create,  properties.add, remove',function(assert){
        var path = 'lol/yello';
        var abRef = Appbase.create('lol','yello');

        var prop = 'abc';
        var value = 'pqr';
        var prop1 = 'lol';
        var val1 = 'lala';

        abRef.properties.add(prop,value,function(error){
            assert.equal(error,false,'no error');

            Appbase.debug.ab.graph.storage.get('path_vertex',path).then(function(vertex){
                assert.equal(vertex.properties[prop],value,'property0 is added.');
            },function(error){
                assert.equal(error,'','error aayo');
            });
        });

        abRef.properties.add(prop1,val1,function(error){
            assert.equal(error,false,'no error');

            Appbase.debug.ab.graph.storage.get('path_vertex',path).then(function(vertex){
                assert.equal(vertex.properties[prop1],val1,'property1 is added.');
            },function(error){
                assert.equal(error,'','error aayo');
            });
        });

        abRef.properties.remove(prop,function(error){
            assert.equal(error,false,'no error');


            Appbase.debug.ab.graph.storage.get('path_vertex',path).then(function(vertex){
                assert.equal(vertex.properties[prop],undefined,'property0 is removed.');
                assert.equal(vertex.properties[prop1],val1,'property1 still exists.');
            },function(error){
                assert.equal(error,'','error aayo');
            });
        });

    });


    QUnit.test('properties.on',function(assert){
        expect(12); //this is imp

        var path = Appbase.create('lala').path();

        var abRef = Appbase.ref(path);

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


    QUnit.test('edges.add, edges.remove',function(assert){

        var noOfExpectations = 0;
        var testEdge = function(testNo,testVars){
            (testVars.type == 'replace' ||  testVars.type == 'move' || testVars.type == 'remove') && (testVars.args.name = testVars.args.name != undefined? testVars.args.name: (testVars.basedOn != undefined?edgesToTest[testVars.basedOn].args.name:undefined));
            (testVars.type == 'replace' || ((testVars.type == 'remove' ||  testVars.type == 'move') && testVars.args.name == undefined)) && (testVars.args.ref = testVars.args.ref!= undefined? testVars.args.ref: (testVars.basedOn != undefined?edgesToTest[testVars.basedOn].args.ref:undefined));
            (testVars.type == 'add' && testVars.args.priority == undefined) && (testVars.args.priority = 'time');

            (testVars.type == "remove") && (noOfExpectations += 8);
            (testVars.type == "add" || testVars.type == "replace") &&  (noOfExpectations += 7);
            (testVars.type == "move") && (noOfExpectations += 9);

            expect(noOfExpectations); //Important
            testOperand.ref.edges[testVars.method](testVars.args,function(error){
                assert.equal(error,false,testNo+') '+testVars.testName);

                Promise.all([Appbase.debug.ab.graph.storage.get('path_edges',testOperand.path),testVars.args.ref != undefined ?Appbase.debug.ab.graph.storage.get('path_vertex',testVars.args.ref.path()):undefined])
                .then(function(array){
                    var edges = array[0];
                    if(testVars.type != "remove"){

                        testVars.obtained.name = testVars.args.name != undefined?testVars.args.name:array[1].uuid;

                        assert.ok(edges.byName[testVars.obtained.name],'byName-test1:edgeName');

                        var prev_priority = testVars.basedOn != undefined? edgesToTest[testVars.basedOn].obtained.priority:undefined;
                        prev_priority != undefined && (testOperand.sortedPriorities.delete(prev_priority));

                        var expectedPriority = testVars.args.priority != undefined? testVars.args.priority:prev_priority;
                        expectedPriority = (expectedPriority == "time"? edges.byName[testVars.obtained.name].timestamp:expectedPriority);
                        testVars.obtained.priority = edges.byName[testVars.obtained.name].priority;

                        assert.equal(testVars.obtained.priority,expectedPriority,'byName-test2:priority');
                        testOperand.sortedPriorities.add(expectedPriority);

                        (testVars.type == "move") && assert.notEqual(prev_priority,expectedPriority,'Priority modified');

                        assert.ok(edges.byPriority[expectedPriority].indexOf(testVars.obtained.name) > -1,'byPriority object');

                        (testVars.type == "move") && assert.ok(edges.byPriority[prev_priority].indexOf(testVars.obtained.name) == -1,'byPriority object - old priority is gone');
                        assert.equal(edges.sortedPriorities.min(),testOperand.sortedPriorities.min(),'lowest priority');
                        assert.equal(edges.sortedPriorities.max(),testOperand.sortedPriorities.max(),'highest priority');

                        array[1] && assert.equal(Appbase.debug.ab.caching.get('path_uuid',testOperand.path+'/'+testVars.obtained.name).val,array[1].uuid,"edge-path's uuid");
                        !array[1] && assert.ok(Appbase.debug.ab.caching.get('path_uuid',testOperand.path+'/'+testVars.obtained.name).val,"edge-path's uuid");

                    } else {

                        var deletedEdgeName = testVars.basedOn != undefined? edgesToTest[testVars.basedOn].obtained.name:undefined;
                        var deletedPriority = testVars.basedOn!= undefined? edgesToTest[testVars.basedOn].obtained.priority:undefined;
                        assert.ok(deletedEdgeName,"There's an edge to delete");
                        assert.ok(deletedPriority != undefined && typeof deletedPriority == "number",'Deleted edge had a priority');

                        edges.byPriority[deletedPriority].length == 0 && (testOperand.sortedPriorities.delete(deletedPriority));

                        assert.ok(!edges.byName[deletedEdgeName],'byName object');

                        assert.ok(edges.byPriority[deletedPriority].indexOf(deletedEdgeName) == -1,'byPriority object');
                        assert.equal(edges.sortedPriorities.min(),testOperand.sortedPriorities.min(),'lowest priority');
                        assert.equal(edges.sortedPriorities.max(),testOperand.sortedPriorities.max(),'highest priority');
                        assert.equal(Appbase.debug.ab.caching.get('path_uuid',testOperand.path+'/'+deletedEdgeName).val,undefined,'edge-path removed');

                    }

                },function(error){
                    assert.equal(error,'','error aayo');
                });

            });
        }

        var testOperand = {};
        testOperand.collection = 'lol';
        testOperand.key = 'rofl';
        testOperand.ref = Appbase.create(testOperand.collection,testOperand.key);
        testOperand.path = testOperand.ref.path();
        testOperand.sortedPriorities = new SortedSet();

        var edgesToTest = [];

        edgesToTest[0] = {
            testName:'Edge addition: with name, ref and priority',
            method:'add',
            args:{
                name:'haha1',
                ref:Appbase.create('yoEdge1'),
                priority:-500
            },
            obtained:{},
            type:'add'
        }

        edgesToTest[1] = {
            testName:'Edge addition: with ref and priority, no name',
            method:'add',
            args:{
                name:undefined,
                ref:Appbase.create('yoEdge2'),
                priority:100
            },
            obtained:{},
            type:'add'
        }

        edgesToTest[2] = {
            testName:'Edge addition: with name and ref, no priority',
            method:'add',
            args:{
                name:'haha3',
                ref:Appbase.create('yoEdge3'),
                priority:undefined
            },
            obtained:{},
            type:'add'
        }

        edgesToTest[3] = {
            testName:'Edge move: with name and new priority',
            method:'add',
            args:{
                priority:0
            },
            type:'move',
            obtained:{},
            basedOn:0
        }

        edgesToTest[4] = {
            testName:'Edge move: with ref and new priority',
            method:'add',
            args:{
                priority:-100
            },
            type:'move',
            obtained:{},
            basedOn:1
        }

        edgesToTest[5] = {
            testName:'Edge replace: with the same name and ref and no priority - i.e. the old priority ',
            method:'add',
            args:{
                ref:edgesToTest[2].args.ref,
                priority:undefined
            },
            type:'replace',
            obtained:{},
            basedOn:2

        }

        edgesToTest[6] = {
            testName:'Edge move: with name and "time" priority - i.e. the timestamp as priority',
            method:'add',
            args:{
                priority:"time"
            },
            type:'move',
            obtained:{},
            basedOn:5

        }

        edgesToTest[7] = {
            testName:'Edge replace: with name and a new ref, no priority - i.e. the old priority',
            method:'add',
            args:{
                ref: edgesToTest[0].args.ref,
                priority:undefined
            },
            type:'replace',
            obtained:{},
            basedOn:6

        }

        edgesToTest[8] = {
            testName:'Edge move: moving a just-replaced edge, with name, and a new "time" priority',
            method:'add',
            args:{
                priority:"time"
            },
            type:'move',
            obtained:{},
            basedOn:7

        }

        edgesToTest[9] = {
            testName:'Edge replace: Giving an existing ref (for an edge with no name) in the arguments, results as the replacement of itself',
            method:'add',
            args:{
            },
            type:'replace',
            obtained:{},
            basedOn:4

        }

        edgesToTest[10] = {
            testName:'Edge remove: with name',
            method:'remove',
            args:{
            },
            type:'remove',
            obtained:{},
            basedOn:3

        }

        edgesToTest[11] = {
            testName:'Edge remove: with ref',
            method:'remove',
            args:{
            },
            type:'remove',
            obtained:{},
            basedOn:9

        }

        edgesToTest[12] = {
            testName:'Edge remove: with name',
            method:'remove',
            args:{
            },
            type:'remove',
            obtained:{},
            basedOn:8

        }


        //TODO: tests for a deeper graph

        for(var i=0;edgesToTest[i]!=undefined;i++){
            testEdge(i,edgesToTest[i]);
        }

/*
       var firingTestVars = {count:0,maxCount:7,refs:[]};

        abRef.edges.on('edge_added',function(error,edgeRef,snap){
            firingTestVars.count += 1;
            assert.equal(error,false,'no error');
            assert.ok(firingTestVars.count<=firingTestVars.maxCount,'edge_added:'+edgeRef.path()+ 'fire count:'+firingTestVars.count);

            Promise.all([Appbase.debug.ab.graph.path_vertex.get(edgeRef.path()),Appbase.debug.ab.graph.path_vertex.get(firingTestVars.refs[firingTestVars.count].path())]).then(function(vertexes){

                assert.deepEqual(vertexes[0],vertexes[1],'new edge path and reference:'+edgeRef.path());

            },function(error){
                assert.equal(error,'','error aayo');
            });
        })
*/

    });

}
