

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
        assert.ok(Appbase.debug,'Appbase.debug');
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
}