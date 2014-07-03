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
QUnit.test("Appbase debug mode",function(assert){
    if(debugMode){
        expect(2);
        assert.ok(Appbase.debug,'Appbase.debug true');
        assert.ok(Appbase.toHide,'Appbase.toHide');
    } else {
        expect(1);
        assert.ok(true,'Appbase not in debug mode.');
    }

});

QUnit.test('Limiting Appbase global exposure',function(assert){
    var allowedExposure;
    if (debugMode){
        allowedExposure = ['toHide','debug','create','ref'];
    } else {
        allowedExposure = ['new','ref'];
    }

    expect(allowedExposure.length);
    for(var key in Appbase){
        assert.ok(allowedExposure.indexOf(key) > -1,'exposed: '+key);
    }
});



QUnit.test('Appbase.create should expect only two args, and strings should not contain " " and "/"',function(assert){
    expect(3);
    assert.throws(function() {Appbase.create('asd','asdas','asdasd')},'Expected only two arguments: namespace and key','No of args');
    assert.throws(function() {Appbase.create('/asdasd/',"asdasd asd")},"Namespace and key should not contain blank-space or '/'","' ' and '/'");

    Appbase.create('asd','asdas');
    assert.ok(true,'Doesnt throw error');
});


if(debugMode){
    QUnit.module('DEBUG ON: Appbase internal methods');
    QUnit.test( "path manipulation methods", function( assert ) {
        expect(13);
        assert.equal(Appbase.toHide.ab.util.cutLeadingTrailingSlashes('//one/two//'),'one/two','leading-trailing    slashes');

        var test = function(path,front,cutFront,back,cutBack) {
            assert.equal(Appbase.toHide.ab.util.front(path), front,'path:'+path+ ' front-test');
            assert.equal(Appbase.toHide.ab.util.cutFront(path), cutFront,'path:'+path+ ' cutFront-test');
            assert.equal(Appbase.toHide.ab.util.back(path), back,'path:'+path+ ' back-test');
            assert.equal(Appbase.toHide.ab.util.cutBack(path), cutBack,'path:'+path+ ' cutBack-test');
        }

        test('/one/two/three','one','two/three','three','one/two');
        test('/one/two','one','two','two','one');
        test('/one','one','','one','');
    });

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


}