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

QUnit.module('Appbase globals');
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

    QUnit.module('DEBUG ON: AppbaseObj');
    QUnit.test("Importing,exporting",function(assert){
        expect(5);

        var properties = {
            one: 'one',
            two:'two',
            three:'three'
        }

        var serverObj = {
            properties: JSON.stringify(properties),
            uuid:Appbase.toHide.util.uuid(),
            timestamp: new Date().getTime()
            //,namespace:'gandu'
        }

        var abObj = new Appbase.toHide.AppbaseObj(serverObj);

        assert.deepEqual(abObj.properties,properties,'import properties');
        assert.deepEqual(abObj.uuid,serverObj.uuid,'import uuid');
        assert.deepEqual(abObj.timestamp,serverObj.timestamp,'import timestamp');
        //assert.deepEqual(abObj.namespace,serverObj.namespace,'import ns')
        //TODO: links

        properties = {
            four: 'four',
            five:'five'
        }

        serverObj = {
            properties: JSON.stringify(properties),
            timestamp: new Date().getTime()
        }

        abObj.setSelfObj(serverObj);

        assert.deepEqual(abObj.properties,properties,'new props');
        assert.deepEqual(abObj.timestamp,serverObj.timestamp,'new timestamp');
        //TODO: links


        assert.deepEqual(abObj.exportProps(),properties,'export props');
    });


}