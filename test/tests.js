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


    /*
    QUnit.test('edges.add, edges.remove, edges.on("added")',function(assert){
        expect(73);
        var collection = 'lol';
        var key = 'rofl';
        var abRef = Appbase.create(collection,key);
        var path = abRef.path();

        var firingTestVars = {count:0,maxCount:5};

        abRef.edges.on('edge_added',function(error,edgeRef,snap){
            firingTestVars.count += 1;
            assert.equal(error,false,'no error');
            assert.ok(firingTestVars.count<=firingTestVars.maxCount,'edge_added:'+edgeRef.path()+ 'fire count:'+firingTestVars.count);

            Promise.all([Appbase.debug.ab.graph.path_vertex.get(edgeRef.path()),Appbase.debug.ab.graph.path_vertex.get(firingTestVars.edgeRef.path())]).then(function(vertexes){

                assert.deepEqual(vertexes[0],vertexes[1],'new edge path and reference:'+edgeRef.path());

            },function(error){
                assert.equal(error,'','error aayo');
            });
        })

        var edgeRef1 = Appbase.create('yoEdge1');
        var edgeName1 = 'haha1';
        var priority1 = -500; //lowest

        var edgeRef2 = Appbase.create('yoEdge2');
        var edgeName2 = undefined; //uuid be will the name
        var priority2 = 100;// highest when inserted

        var edgeRef3 = Appbase.create('yoEdge3');
        var edgeName3 = 'haha3';
        var priority3 = undefined; // timestamp // highest


        //addition
        firingTestVars.edgeRef = edgeRef1;
        abRef.edges.add({ref:edgeRef1, name:edgeName1,priority:priority1},function(error){
            assert.equal(error,false,'no error');
            Appbase.debug.ab.graph.storage.get('path_edges',path).then(function(edges){

                assert.ok(edges.byName[edgeName1] && edges.byName[edgeName1].priority==priority1,'edge1-byName object');
                assert.ok(edges.byPriority[priority1].indexOf(edgeName1) > -1,'edge1-byPriority object');
                assert.equal(edges.lowestPriority,priority1,'edge1-lowestPrio');
                assert.equal(edges.highestPriority,priority1,'edge1-higestPrio');
                assert.ok(Appbase.debug.ab.caching.get('path_uuid'));

            },function(error){
                assert.equal(error,'','error aayo');
            });
        });

        firingTestVars.edgeRef = edgeRef2;
        abRef.edges.add({ref:edgeRef2, name:edgeName2,priority:priority2},function(error){
            assert.equal(error,false,'no error');
            Promise.all([Appbase.debug.ab.graph.storage.get('path_uuid',edgeRef2.path()),Appbase.debug.ab.graph.storage.get('path_edges',path)]).then(function(array){
                edgeName2 = array[0];
                var edges = array[1];

                assert.ok(edges.byName[edgeName2] && edges.byName[edgeName2].priority==priority2,'edge2-byName object');
                assert.ok(edges.byPriority[priority2].indexOf(edgeName2) > -1,'edge2-byPriority object');
                assert.equal(edges.lowestPriority,priority1,'edge2-lowestPrio');
                assert.equal(edges.highestPriority,priority2,'edge2-higestPrio');

            },function(error){
                assert.equal(error,'','error aayo');
            });

            Promise.all([Appbase.debug.ab.graph.path_vertex.get(edgeRef1.path()),Appbase.debug.ab.graph.path_vertex.get(path+'/'+edgeName1)]).then(function(vertexes){

                assert.deepEqual(vertexes[0],vertexes[1],'new edge path and reference');

            },function(error){
                assert.equal(error,'','error aayo');
            });

        });

        firingTestVars.edgeRef = edgeRef3;
        abRef.edges.add({ref:edgeRef3, name:edgeName3,priority:priority3},function(error){
            assert.equal(error,false,'no error');
            Appbase.debug.ab.graph.storage.get('path_edges',path).then(function(edges){

                assert.ok(edges.byName[edgeName3] && edges.byName[edgeName3].priority,'edge3-byName object');

                priority3 = edges.byName[edgeName3].priority;

                assert.ok(edges.byPriority[priority3].indexOf(edgeName3) > -1,'edge3-byPriority object');
                assert.equal(edges.lowestPriority,priority1,'edge3-lowestPrio');
                assert.equal(edges.highestPriority,priority3,'edge3-highestPrio');

            },function(error){
                assert.equal(error,'','error aayo');
            });

            Promise.all([Appbase.debug.ab.graph.path_vertex.get(edgeRef2.path()),Appbase.debug.ab.graph.path_vertex.get(path+'/'+edgeName2)]).then(function(vertexes){

                assert.deepEqual(vertexes[0],vertexes[1],'new edge path and reference');

            },function(error){
                assert.equal(error,'','error aayo');
            });
        });

        //replacing/modifying
        var prev_priority1 = priority1;
        priority1 = 0;

        abRef.edges.add({ref:edgeRef1, name:edgeName1,priority:priority1},function(error){
            assert.equal(error,false,'no error');
            Appbase.debug.ab.graph.storage.get('path_edges',path).then(function(edges){

                assert.ok(edges.byName[edgeName1],'edge1-new prio-byName object test1');
                assert.ok(edges.byName[edgeName1].priority==priority1,'edge1-new prio-byName object test2');
                assert.ok(edges.byPriority[priority1].indexOf(edgeName1) > -1,'edge1-new prio-byPriority object');
                assert.ok(edges.byPriority[prev_priority1].indexOf(edgeName1) == -1,'edge1-new prio-byPriority object');
                assert.equal(edges.lowestPriority,priority1,'edge1-new prio-lowestPrio');
                assert.equal(edges.highestPriority,priority3,'edge1-new prio-higestPrio');

            },function(error){
                assert.equal(error,'','error aayo');
            });

            Promise.all([Appbase.debug.ab.graph.path_vertex.get(edgeRef3.path()),Appbase.debug.ab.graph.path_vertex.get(path+'/'+edgeName3)]).then(function(vertexes){

                assert.deepEqual(vertexes[0],vertexes[1],'new edge path and reference');

            },function(error){
                assert.equal(error,'','error aayo');
            });

        });

        var prev_priority2 = priority2;
        priority2 = -100;

        abRef.edges.add({ref:edgeRef2, priority:priority2},function(error){
            assert.equal(error,false,'no error');
            Appbase.debug.ab.graph.storage.get('path_edges',path).then(function(edges){

                assert.ok(edges.byName[edgeName2],'edge2-new prio-byName object test1');
                assert.ok(edges.byName[edgeName2].priority==priority2,'edge2-new prio-byName object test2');
                assert.ok(edges.byPriority[priority2].indexOf(edgeName2) > -1,'edge2-new prio-byPriority object test1');
                assert.ok(edges.byPriority[prev_priority2].indexOf(edgeName2) == -1,'edge2-new prio-byPriority object test2');
                assert.equal(edges.lowestPriority,priority2,'edge2-new prio-lowestPrio');
                assert.equal(edges.highestPriority,priority3,'edge2-new prio-higestPrio');

            },function(error){
                assert.equal(error,'','error aayo');
            });
        });

        //fire for existing edges
        abRef.edges.on('edge_added',function(error,edgeRef,snap){
            firingTestVars.count += 1;
            assert.equal(error,false,'no error');
            assert.ok(firingTestVars.count<=firingTestVars.maxCount,'edge_added:'+edgeRef.path()+ ' fire count:'+firingTestVars.count);

            /*
             Promise.all([Appbase.debug.ab.graph.path_vertex.get(edgeRef.path()),Appbase.debug.ab.graph.path_vertex.get(firingTestVars.edgeRef.path())]).then(function(vertexes){

             assert.deepEqual(vertexes[0],vertexes[1],'new edge path and reference:'+edgeRef.path());

             },function(error){
             assert.equal(error,'','error aayo');
             });
             * /
        })

        var prev_priority3 = priority3;
        priority3 = undefined;

        firingTestVars.edgeRef = edgeRef3;
        abRef.edges.add({ref:edgeRef3, name:edgeName3},function(error){
            assert.equal(error,false,'no error');
            Appbase.debug.ab.graph.storage.get('path_edges',path).then(function(edges){

                assert.ok(edges.byName[edgeName3] && edges.byName[edgeName3].priority,'edge3-no prio-byName object');

                priority3 = edges.byName[edgeName3].priority;

                assert.equal(prev_priority3,priority3,'edge3-no prio- new prio equals old prio');

                assert.ok(edges.byPriority[priority3].indexOf(edgeName3) > -1,'edge3-no prio-byPriority object');
                assert.equal(edges.lowestPriority,priority2,'edge3-no prio-lowestPrio');
                assert.equal(edges.highestPriority,priority3,'edge3-no prio-highestPrio');

            },function(error){
                assert.equal(error,'','error aayo');
            });
        });

        var prev_priority3 = priority3;
        priority3 = "time";

        abRef.edges.add({ref:edgeRef3,name:edgeName3, priority:priority3},function(error){
            assert.equal(error,false,'no error');
            Appbase.debug.ab.graph.storage.get('path_edges',path).then(function(edges){

                assert.ok(edges.byName[edgeName3],'edge3-time prio-byName object test1');

                priority3 = edges.byName[edgeName3].priority;

                assert.notEqual(prev_priority3,priority3,'edge3-time prio- new prio doesnt equal old prio');
                assert.ok(edges.byName[edgeName3].priority==priority3,'edge3-time prio-byName object test2');
                assert.ok(edges.byPriority[priority3].indexOf(edgeName3) > -1,'edge3-time prio-byPriority object test1');
                assert.ok(edges.byPriority[prev_priority3].indexOf(edgeName3) == -1,'edge3-time prio-byPriority object test2');
                assert.equal(edges.lowestPriority,priority2,'edge3-time prio-lowestPrio');
                assert.equal(edges.highestPriority,priority3,'edge3-time prio-higestPrio');

            },function(error){
                assert.equal(error,'','error aayo');
            });
        });

        //removal
        abRef.edges.remove({name:edgeName3},function(error){
            assert.equal(error,false,'no error');
            Appbase.debug.ab.graph.storage.get('path_edges',path).then(function(edges){

                assert.ok(!edges.byName[edgeName3],'edge3-removed-byName object');

                assert.ok(edges.byPriority[priority3].indexOf(edgeName3) == -1,'edge3-removed-byPriority object');
                assert.equal(edges.lowestPriority,priority2,'edge3-removed-lowestPrio');
                assert.equal(edges.highestPriority,priority1,'edge3-removed-highestPrio');

            },function(error){
                assert.equal(error,'','error aayo');
            });

            assert.equal(Appbase.debug.ab.caching.get('path_uuid',path+'/'+edgeName3).val,undefined,'edge3 path removed');

        });

        abRef.edges.remove({ref:edgeRef2},function(error){
            assert.equal(error,false,'no error');
            Appbase.debug.ab.graph.storage.get('path_edges',path).then(function(edges){

                assert.ok(!edges.byName[edgeName2],'edge2-removed-byName object');

                assert.ok(edges.byPriority[priority2].indexOf(edgeName2) == -1,'edge2-removed-byPriority object');
                assert.equal(edges.lowestPriority,priority1,'edge2-removed-lowestPrio');
                assert.equal(edges.highestPriority,priority1,'edge2-removed-highestPrio');

            },function(error){
                assert.equal(error,'','error aayo');
            });

            assert.equal(Appbase.debug.ab.caching.get('path_uuid',path+'/'+edgeName2).val,undefined,'edge2 path removed');
        });

        abRef.edges.remove({name:edgeName1},function(error){
            assert.equal(error,false,'no error');
            Appbase.debug.ab.graph.storage.get('path_edges',path).then(function(edges){

                assert.ok(!edges.byName[edgeName1],'edge1-removed-byName object');

                assert.ok(edges.byPriority[priority1].indexOf(edgeName1) == -1,'edge1-removed-byPriority object');
                assert.equal(edges.lowestPriority,Infinity,'edge1-removed-lowestPrio');
                assert.equal(edges.highestPriority,-Infinity,'edge1-removed-highestPrio');

            },function(error){
                assert.equal(error,'','error aayo');
            });

            assert.equal(Appbase.debug.ab.caching.get('path_uuid',path+'/'+edgeName1).val,undefined,'edge1 path removed');
        });

    });
    */

}
