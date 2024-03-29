(function(window){var QUnit,assert,config,onErrorFnPrev,testId=0,fileName=(sourceFromStacktrace(0)||"").replace(/(:\d+)+\)?/,"").replace(/.+\//,""),toString=Object.prototype.toString,hasOwn=Object.prototype.hasOwnProperty,Date=window.Date,setTimeout=window.setTimeout,clearTimeout=window.clearTimeout,defined={document:typeof window.document!=="undefined",setTimeout:typeof window.setTimeout!=="undefined",sessionStorage:(function(){var x="qunit-test-string";try{sessionStorage.setItem(x,x);sessionStorage.removeItem(x);return true;}catch(e){return false;}}())},errorString=function(error){var name,message,errorString=error.toString();if(errorString.substring(0,7)==="[object"){name=error.name?error.name.toString():"Error";message=error.message?error.message.toString():"";if(name&&message){return name+": "+message;}else if(name){return name;}else if(message){return message;}else{return "Error";}}else{return errorString;}},objectValues=function(obj){//
var key,val,vals=QUnit.is("array",obj)?[]:{};for(key in obj){if(hasOwn.call(obj,key)){val=obj[key];vals[key]=val===Object(val)?objectValues(val):val;}}
return vals;};QUnit={module:function(name,testEnvironment){config.currentModule=name;config.currentModuleTestEnvironment=testEnvironment;config.modules[name]=true;},asyncTest:function(testName,expected,callback){if(arguments.length===2){callback=expected;expected=null;}
QUnit.test(testName,expected,callback,true);},test:function(testName,expected,callback,async){var test,nameHtml="<span class='test-name'>"+escapeText(testName)+"</span>";if(arguments.length===2){callback=expected;expected=null;}
if(config.currentModule){nameHtml="<span class='module-name'>"+escapeText(config.currentModule)+"</span>: "+nameHtml;}
test=new Test({nameHtml:nameHtml,testName:testName,expected:expected,async:async,callback:callback,module:config.currentModule,moduleTestEnvironment:config.currentModuleTestEnvironment,stack:sourceFromStacktrace(2)});if(!validTest(test)){return;}
test.queue();},expect:function(asserts){if(arguments.length===1){config.current.expected=asserts;}else{return config.current.expected;}},start:function(count){if(config.semaphore===undefined){QUnit.begin(function(){//
setTimeout(function(){QUnit.start(count);});});return;}
config.semaphore-=count||1;if(config.semaphore>0){return;}
if(config.semaphore<0){config.semaphore=0;QUnit.pushFailure("Called start() while already started (QUnit.config.semaphore was 0 already)",null,sourceFromStacktrace(2));return;}
if(defined.setTimeout){setTimeout(function(){if(config.semaphore>0){return;}
if(config.timeout){clearTimeout(config.timeout);}
config.blocking=false;process(true);},13);}else{config.blocking=false;process(true);}},stop:function(count){config.semaphore+=count||1;config.blocking=true;if(config.testTimeout&&defined.setTimeout){clearTimeout(config.timeout);config.timeout=setTimeout(function(){QUnit.ok(false,"Test timed out");config.semaphore=1;QUnit.start();},config.testTimeout);}}};(function(){function F(){}
F.prototype=QUnit;QUnit=new F();QUnit.constructor=F;}());config={queue:[],blocking:true,hidepassed:false,reorder:true,//
altertitle:true,scrolltop:true,requireExpects:false,urlConfig:[{id:"noglobals",label:"Check for Globals",tooltip:"Enabling this will test if any test introduces new properties on the `window` object. Stored as query-strings."},{id:"notrycatch",label:"No try-catch",tooltip:"Enabling this will run tests outside of a try-catch block. Makes debugging exceptions in IE reasonable. Stored as query-strings."}],modules:{},
begin:[],done:[],log:[],testStart:[],testDone:[],moduleStart:[],moduleDone:[]};(function(){var i,current,location=window.location||{search:"",protocol:"file:"},params=location.search.slice(1).split("&"),length=params.length,urlParams={};if(params[0]){for(i=0;i<length;i++){current=params[i].split("=");current[0]=decodeURIComponent(current[0]);current[1]=current[1]?decodeURIComponent(current[1]):true;if(urlParams[current[0]]){urlParams[current[0]]=[].concat(urlParams[current[0]],current[1]);}else{urlParams[current[0]]=current[1];}}}
QUnit.urlParams=urlParams;config.filter=urlParams.filter;config.module=urlParams.module;config.testNumber=[];if(urlParams.testNumber){urlParams.testNumber=[].concat(urlParams.testNumber);for(i=0;i<urlParams.testNumber.length;i++){current=urlParams.testNumber[i];config.testNumber.push(parseInt(current,10));}}
QUnit.isLocal=location.protocol==="file:";}());extend(QUnit,{config:config,init:function(){extend(config,{stats:{all:0,bad:0},moduleStats:{all:0,bad:0},started:+new Date(),updateRate:1000,blocking:false,autostart:true,autorun:false,filter:"",queue:[],semaphore:1});var tests,banner,result,qunit=id("qunit");if(qunit){qunit.innerHTML="<h1 id='qunit-header'>"+escapeText(document.title)+"</h1>"+
"<h2 id='qunit-banner'></h2>"+
"<div id='qunit-testrunner-toolbar'></div>"+
"<h2 id='qunit-userAgent'></h2>"+
"<ol id='qunit-tests'></ol>";}
tests=id("qunit-tests");banner=id("qunit-banner");result=id("qunit-testresult");if(tests){tests.innerHTML="";}
if(banner){banner.className="";}
if(result){result.parentNode.removeChild(result);}
if(tests){result=document.createElement("p");result.id="qunit-testresult";result.className="result";tests.parentNode.insertBefore(result,tests);result.innerHTML="Running...<br/>&nbsp;";}},reset:function(){var fixture=id("qunit-fixture");if(fixture){fixture.innerHTML=config.fixture;}},is:function(type,obj){return QUnit.objectType(obj)===type;},objectType:function(obj){if(typeof obj==="undefined"){return "undefined";}
if(obj===null){return "null";}
var match=toString.call(obj).match(/^\[object\s(.*)\]$/),type=match&&match[1]||"";switch(type){case "Number":if(isNaN(obj)){return "nan";}
return "number";case "String":case "Boolean":case "Array":case "Date":case "RegExp":case "Function":return type.toLowerCase();}
if(typeof obj==="object"){return "object";}
return undefined;},push:function(result,actual,expected,message){if(!config.current){throw new Error("assertion outside test context, was "+sourceFromStacktrace());}
var output,source,details={module:config.current.module,name:config.current.testName,result:result,message:message,
actual:actual,expected:expected
};message=escapeText(message)||(result?"okay":"failed");message="<span class='test-message'>"+message+"</span>";output=message;if(!result){expected=escapeText(QUnit.jsDump.parse(expected));actual=escapeText(QUnit.jsDump.parse(actual));output+="<table><tr class='test-expected'><th>Expected: </th><td><pre>"+expected+"</pre></td></tr>";if(actual!==expected){output+="<tr class='test-actual'><th>Result: </th><td><pre>"+actual+"</pre></td></tr>";output+="<tr class='test-diff'><th>Diff: </th><td><pre>"+QUnit.diff(expected,actual)+"</pre></td></tr>";}
source=sourceFromStacktrace();if(source){details.source=source;output+="<tr class='test-source'><th>Source: </th><td><pre>"+escapeText(source)+"</pre></td></tr>";}
output+="</table>";}
runLoggingCallbacks("log",QUnit,details);config.current.assertions.push({result:!!result,message:output});},pushFailure:function(message,source,actual){if(!config.current){throw new Error("pushFailure() assertion outside test context, was "+sourceFromStacktrace(2));}
var output,details={module:config.current.module,name:config.current.testName,result:false,message:message};message=escapeText(message)||"error";message="<span class='test-message'>"+message+"</span>";output=message;output+="<table>";if(actual){output+="<tr class='test-actual'><th>Result: </th><td><pre>"+escapeText(actual)+"</pre></td></tr>";}
if(source){details.source=source;output+="<tr class='test-source'><th>Source: </th><td><pre>"+escapeText(source)+"</pre></td></tr>";}
output+="</table>";runLoggingCallbacks("log",QUnit,details);config.current.assertions.push({result:false,message:output});},url:function(params){params=extend(extend({},QUnit.urlParams),params);var key,querystring="?";for(key in params){if(hasOwn.call(params,key)){querystring+=encodeURIComponent(key)+"="+
encodeURIComponent(params[key])+"&";}}
return window.location.protocol+"//"+window.location.host+
window.location.pathname+querystring.slice(0,-1);},extend:extend,id:id,addEvent:addEvent,addClass:addClass,hasClass:hasClass,removeClass:removeClass});extend(QUnit.constructor.prototype,{begin:registerLoggingCallback("begin"),done:registerLoggingCallback("done"),log:registerLoggingCallback("log"),testStart:registerLoggingCallback("testStart"),testDone:registerLoggingCallback("testDone"),moduleStart:registerLoggingCallback("moduleStart"),moduleDone:registerLoggingCallback("moduleDone")});if(!defined.document||document.readyState==="complete"){config.autorun=true;}
QUnit.load=function(){runLoggingCallbacks("begin",QUnit,{});var banner,filter,i,j,label,len,main,ol,toolbar,val,selection,urlConfigContainer,moduleFilter,userAgent,numModules=0,moduleNames=[],moduleFilterHtml ="",urlConfigHtml="",oldconfig=extend({},config);QUnit.init();extend(config,oldconfig);config.blocking=false;len=config.urlConfig.length;for(i=0;i<len;i++){val=config.urlConfig[i];if(typeof val==="string"){val={id:val,label:val};}
config[val.id]=QUnit.urlParams[val.id];if(!val.value||typeof val.value==="string"){urlConfigHtml+="<input id='qunit-urlconfig-"+escapeText(val.id)+
"' name='"+escapeText(val.id)+
"' type='checkbox'"+(val.value?" value='"+escapeText(val.value)+"'":"")+(config[val.id]?" checked='checked'":"")+
" title='"+escapeText(val.tooltip)+
"'><label for='qunit-urlconfig-"+escapeText(val.id)+
"' title='"+escapeText(val.tooltip)+"'>"+val.label+"</label>";}else{urlConfigHtml+="<label for='qunit-urlconfig-"+escapeText(val.id)+
"' title='"+escapeText(val.tooltip)+
"'>"+val.label+
": </label><select id='qunit-urlconfig-"+escapeText(val.id)+
"' name='"+escapeText(val.id)+
"' title='"+escapeText(val.tooltip)+
"'><option></option>";selection=false;if(QUnit.is("array",val.value)){for(j=0;j<val.value.length;j++){urlConfigHtml+="<option value='"+escapeText(val.value[j])+"'"+(config[val.id]===val.value[j]?(selection=true)&&" selected='selected'":"")+
">"+escapeText(val.value[j])+"</option>";}}else{for(j in val.value){if(hasOwn.call(val.value,j)){urlConfigHtml+="<option value='"+escapeText(j)+"'"+(config[val.id]===j?(selection=true)&&" selected='selected'":"")+
">"+escapeText(val.value[j])+"</option>";}}}
if(config[val.id]&&!selection){urlConfigHtml+="<option value='"+escapeText(config[val.id])+
"' selected='selected' disabled='disabled'>"+
escapeText(config[val.id])+
"</option>";}
urlConfigHtml+="</select>";}}
for(i in config.modules){if(config.modules.hasOwnProperty(i)){moduleNames.push(i);}}
numModules=moduleNames.length;moduleNames.sort(function(a,b){return a.localeCompare(b);});moduleFilterHtml+="<label for='qunit-modulefilter'>Module: </label><select id='qunit-modulefilter' name='modulefilter'><option value='' "+(config.module===undefined?"selected='selected'":"")+
">< All Modules ></option>";for(i=0;i<numModules;i++){moduleFilterHtml+="<option value='"+escapeText(encodeURIComponent(moduleNames[i]))+"' "+(config.module===moduleNames[i]?"selected='selected'":"")+
">"+escapeText(moduleNames[i])+"</option>";}
moduleFilterHtml+="</select>";userAgent=id("qunit-userAgent");if(userAgent){userAgent.innerHTML=navigator.userAgent;}
banner=id("qunit-header");if(banner){banner.innerHTML="<a href='"+QUnit.url({filter:undefined,module:undefined,testNumber:undefined})+"'>"+banner.innerHTML+"</a> ";}
toolbar=id("qunit-testrunner-toolbar");if(toolbar){filter=document.createElement("input");filter.type="checkbox";filter.id="qunit-filter-pass";addEvent(filter,"click",function(){var tmp,ol=id("qunit-tests");if(filter.checked){ol.className=ol.className+" hidepass";}else{tmp=" "+ol.className.replace(/[\n\t\r]/g," ")+" ";ol.className=tmp.replace(/ hidepass /," ");}
if(defined.sessionStorage){if(filter.checked){sessionStorage.setItem("qunit-filter-passed-tests","true");}else{sessionStorage.removeItem("qunit-filter-passed-tests");}}});if(config.hidepassed||defined.sessionStorage&&sessionStorage.getItem("qunit-filter-passed-tests")){filter.checked=true;ol=id("qunit-tests");ol.className=ol.className+" hidepass";}
toolbar.appendChild(filter);label=document.createElement("label");label.setAttribute("for","qunit-filter-pass");label.setAttribute("title","Only show tests and assertions that fail. Stored in sessionStorage.");label.innerHTML="Hide passed tests";toolbar.appendChild(label);urlConfigContainer=document.createElement("span");urlConfigContainer.innerHTML=urlConfigHtml;addEvents(urlConfigContainer.getElementsByTagName("input"),"click",function(event){var params={},target=event.target||event.srcElement;params[target.name]=target.checked?target.defaultValue||true:undefined;window.location=QUnit.url(params);});addEvents(urlConfigContainer.getElementsByTagName("select"),"change",function(event){var params={},target=event.target||event.srcElement;params[target.name]=target.options[target.selectedIndex].value||undefined;window.location=QUnit.url(params);});toolbar.appendChild(urlConfigContainer);if(numModules>1){moduleFilter=document.createElement("span");moduleFilter.setAttribute("id","qunit-modulefilter-container");moduleFilter.innerHTML=moduleFilterHtml;addEvent(moduleFilter.lastChild,"change",function(){var selectBox=moduleFilter.getElementsByTagName("select")[0],selectedModule=decodeURIComponent(selectBox.options[selectBox.selectedIndex].value);window.location=QUnit.url({module:(selectedModule==="")?undefined:selectedModule,filter:undefined,testNumber:undefined});});toolbar.appendChild(moduleFilter);}}
main=id("qunit-fixture");if(main){config.fixture=main.innerHTML;}
if(config.autostart){QUnit.start();}};if(defined.document){addEvent(window,"load",QUnit.load);}
onErrorFnPrev=window.onerror;window.onerror=function(error,filePath,linerNr){var ret=false;if(onErrorFnPrev){ret=onErrorFnPrev(error,filePath,linerNr);}
if(ret!==true){if(QUnit.config.current){if(QUnit.config.current.ignoreGlobalErrors){return true;}
QUnit.pushFailure(error,filePath+":"+linerNr);}else{QUnit.test("global failure",extend(function(){QUnit.pushFailure(error,filePath+":"+linerNr);},{validTest:validTest}));}
return false;}
return ret;};function done(){config.autorun=true;if(config.previousModule){runLoggingCallbacks("moduleDone",QUnit,{name:config.previousModule,failed:config.moduleStats.bad,passed:config.moduleStats.all-config.moduleStats.bad,total:config.moduleStats.all});}
delete config.previousModule;var i,key,banner=id("qunit-banner"),tests=id("qunit-tests"),runtime=+new Date()-config.started,passed=config.stats.all-config.stats.bad,html=["Tests completed in ",runtime," milliseconds.<br/>","<span class='passed'>",passed,"</span> assertions of <span class='total'>",config.stats.all,"</span> passed, <span class='failed'>",config.stats.bad, "</span> failed."].join("");if(banner){banner.className=(config.stats.bad?"qunit-fail":"qunit-pass");}
if(tests){id("qunit-testresult").innerHTML=html;}
if(config.altertitle&&defined.document&&document.title){document.title=[(config.stats.bad?"\u2716":"\u2714"),document.title.replace(/^[\u2714\u2716] /i,"")].join(" ");}
if(config.reorder&&defined.sessionStorage&&config.stats.bad===0){for(i=0;i<sessionStorage.length;i++){key=sessionStorage.key(i++);if(key.indexOf("qunit-test-")===0){sessionStorage.removeItem(key);}}}
if(config.scrolltop&&window.scrollTo){window.scrollTo(0,0);}
runLoggingCallbacks("done",QUnit,{failed:config.stats.bad,passed:passed,total:config.stats.all,runtime:runtime});}
function validTest(test){var include,filter=config.filter&&config.filter.toLowerCase(),module=config.module&&config.module.toLowerCase(),fullName=(test.module+": "+test.testName).toLowerCase();if(test.callback&&test.callback.validTest===validTest){delete test.callback.validTest;return true;}
if(config.testNumber.length>0){if(inArray(test.testNumber,config.testNumber)<0){return false;}}
if(module&&(!test.module||test.module.toLowerCase()!==module)){return false;}
if(!filter){return true;}
include=filter.charAt(0)!=="!";if(!include){filter=filter.slice(1);}
if(fullName.indexOf(filter)!==-1){return include;}
return!include;}//
function extractStacktrace(e,offset){offset=offset===undefined?3:offset;var stack,include,i;if(e.stacktrace){return e.stacktrace.split("\n")[offset+3];}else if(e.stack){stack=e.stack.split("\n");if(/^error$/i.test(stack[0])){stack.shift();}
if(fileName){include=[];for(i=offset;i<stack.length;i++){if(stack[i].indexOf(fileName)!==-1){break;}
include.push(stack[i]);}
if(include.length){return include.join("\n");}}
return stack[offset];}else if(e.sourceURL){if(/qunit.js$/.test(e.sourceURL)){return;}
return e.sourceURL+":"+e.line;}}
function sourceFromStacktrace(offset){try{throw new Error();}catch(e){return extractStacktrace(e,offset);}}
function escapeText(s){if(!s){return "";}
s=s+"";return s.replace(/['"<>&]/g,function(s){switch(s){case "'":return "&#039;";case "\"":return "&quot;";case "<":return "&lt;";case ">":return "&gt;";case "&":return "&amp;";}});}
function synchronize(callback,last){config.queue.push(callback);if(config.autorun&&!config.blocking){process(last);}}
function process(last){function next(){process(last);}
var start=new Date().getTime();config.depth=config.depth?config.depth+1:1;while(config.queue.length&&!config.blocking){if(!defined.setTimeout||config.updateRate<=0||((new Date().getTime()-start)<config.updateRate)){config.queue.shift()();} else{setTimeout(next,13);break;}}
config.depth--;if(last&&!config.blocking&&!config.queue.length&&config.depth===0){done();}}
function saveGlobal(){config.pollution=[];if(config.noglobals){for(var key in window){if(hasOwn.call(window,key)){if(/^qunit-test-output/.test(key)){continue;}
config.pollution.push(key);}}}}
function checkPollution(){var newGlobals,deletedGlobals,old=config.pollution;saveGlobal();newGlobals=diff(config.pollution,old);if(newGlobals.length>0){QUnit.pushFailure("Introduced global variable(s): "+newGlobals.join(", "));}
deletedGlobals=diff(old,config.pollution);if(deletedGlobals.length>0){QUnit.pushFailure("Deleted global variable(s): "+deletedGlobals.join(", "));}}
function diff(a,b){var i,j,result=a.slice();for(i=0;i<result.length;i++){for(j=0;j<b.length;j++){if(result[i]===b[j]){result.splice(i,1);i--;break;}}}
return result;}
function extend(a,b){for(var prop in b){if(hasOwn.call(b,prop)){if(!(prop==="constructor"&&a===window)){if(b[prop]===undefined){delete a[prop];}else{a[prop]=b[prop];}}}}
return a;}
function addEvent(elem,type,fn){if(elem.addEventListener){elem.addEventListener(type,fn,false);}else if(elem.attachEvent){elem.attachEvent("on"+type,fn);}else{throw new Error("addEvent() was called in a context without event listener support");}}
function addEvents(elems,type,fn){var i=elems.length;while(i--){addEvent(elems[i],type,fn);}}
function hasClass(elem,name){return(" "+elem.className+" ").indexOf(" "+name+" ")>-1;}
function addClass(elem,name){if(!hasClass(elem,name)){elem.className+=(elem.className?" ":"")+name;}}
function removeClass(elem,name){var set=" "+elem.className+" ";while(set.indexOf(" "+name+" ")>-1){set=set.replace(" "+name+" "," ");}
elem.className=typeof set.trim==="function"?set.trim():set.replace(/^\s+|\s+$/g,"");}
function id(name){return defined.document&&document.getElementById&&document.getElementById(name);}
function registerLoggingCallback(key){return function(callback){config[key].push(callback);};}
function runLoggingCallbacks(key,scope,args){var i,callbacks;if(QUnit.hasOwnProperty(key)){QUnit[key].call(scope,args);}else{callbacks=config[key];for(i=0;i<callbacks.length;i++){callbacks[i].call(scope,args);}}}
function inArray(elem,array){if(array.indexOf){return array.indexOf(elem);}
for(var i=0,length=array.length;i<length;i++){if(array[i]===elem){return i;}}
return-1;}
function Test(settings){extend(this,settings);this.assertions=[];this.testNumber=++Test.count;}
Test.count=0;Test.prototype={init:function(){var a,b,li,tests=id("qunit-tests");if(tests){b=document.createElement("strong");b.innerHTML=this.nameHtml;a=document.createElement("a");a.innerHTML="Rerun";a.href=QUnit.url({testNumber:this.testNumber});li=document.createElement("li");li.appendChild(b);li.appendChild(a);li.className="running";li.id=this.id="qunit-test-output"+testId++;tests.appendChild(li);}},setup:function(){if(this.module!==config.previousModule||!hasOwn.call(config,"previousModule")){if(hasOwn.call(config,"previousModule")){runLoggingCallbacks("moduleDone",QUnit,{name:config.previousModule,failed:config.moduleStats.bad,passed:config.moduleStats.all-config.moduleStats.bad,total:config.moduleStats.all});}
config.previousModule=this.module;config.moduleStats={all:0,bad:0};runLoggingCallbacks("moduleStart",QUnit,{name:this.module});}
config.current=this;this.testEnvironment=extend({setup:function(){},teardown:function(){}},this.moduleTestEnvironment);this.started=+new Date();runLoggingCallbacks("testStart",QUnit,{name:this.testName,module:this.module});QUnit.current_testEnvironment=this.testEnvironment;if(!config.pollution){saveGlobal();}
if(config.notrycatch){this.testEnvironment.setup.call(this.testEnvironment,QUnit.assert);return;}
try{this.testEnvironment.setup.call(this.testEnvironment,QUnit.assert);}catch(e){QUnit.pushFailure("Setup failed on "+this.testName+": "+(e.message||e),extractStacktrace(e,1));}},run:function(){config.current=this;var running=id("qunit-testresult");if(running){running.innerHTML="Running: <br/>"+this.nameHtml;}
if(this.async){QUnit.stop();}
this.callbackStarted=+new Date();if(config.notrycatch){this.callback.call(this.testEnvironment,QUnit.assert);this.callbackRuntime=+new Date()-this.callbackStarted;return;}
try{this.callback.call(this.testEnvironment,QUnit.assert);this.callbackRuntime=+new Date()-this.callbackStarted;}catch(e){this.callbackRuntime=+new Date()-this.callbackStarted;QUnit.pushFailure("Died on test #"+(this.assertions.length+1)+" "+this.stack+": "+(e.message||e),extractStacktrace(e,0));saveGlobal();if(config.blocking){QUnit.start();}}},teardown:function(){config.current=this;if(config.notrycatch){if(typeof this.callbackRuntime==="undefined"){this.callbackRuntime=+new Date()-this.callbackStarted;}
this.testEnvironment.teardown.call(this.testEnvironment,QUnit.assert);return;}else{try{this.testEnvironment.teardown.call(this.testEnvironment,QUnit.assert);}catch(e){QUnit.pushFailure("Teardown failed on "+this.testName+": "+(e.message||e),extractStacktrace(e,1));}}
checkPollution();},finish:function(){config.current=this;if(config.requireExpects&&this.expected===null){QUnit.pushFailure("Expected number of assertions to be defined, but expect() was not called.",this.stack);}else if(this.expected!==null&&this.expected!==this.assertions.length){QUnit.pushFailure("Expected "+this.expected+" assertions, but "+this.assertions.length+" were run",this.stack);}else if(this.expected===null&&!this.assertions.length){QUnit.pushFailure("Expected at least one assertion, but none were run - call expect(0) to accept zero assertions.",this.stack);}
var i,assertion,a,b,time,li,ol,test=this,good=0,bad=0,tests=id("qunit-tests");this.runtime=+new Date()-this.started;config.stats.all+=this.assertions.length;config.moduleStats.all+=this.assertions.length;if(tests){ol=document.createElement("ol");ol.className="qunit-assert-list";for(i=0;i<this.assertions.length;i++){assertion=this.assertions[i];li=document.createElement("li");li.className=assertion.result?"pass":"fail";li.innerHTML=assertion.message||(assertion.result?"okay":"failed");ol.appendChild(li);if(assertion.result){good++;}else{bad++;config.stats.bad++;config.moduleStats.bad++;}}
if(QUnit.config.reorder&&defined.sessionStorage){if(bad){sessionStorage.setItem("qunit-test-"+this.module+"-"+this.testName,bad);}else{sessionStorage.removeItem("qunit-test-"+this.module+"-"+this.testName);}}
if(bad===0){addClass(ol,"qunit-collapsed");}
b=document.createElement("strong");b.innerHTML=this.nameHtml+" <b class='counts'>(<b class='failed'>"+bad+"</b>, <b class='passed'>"+good+"</b>, "+this.assertions.length+")</b>";addEvent(b,"click",function(){var next=b.parentNode.lastChild,collapsed=hasClass(next,"qunit-collapsed");(collapsed?removeClass:addClass)(next,"qunit-collapsed");});addEvent(b,"dblclick",function(e){var target=e&&e.target?e.target:window.event.srcElement;if(target.nodeName.toLowerCase()==="span"||target.nodeName.toLowerCase()==="b"){target=target.parentNode;}
if(window.location&&target.nodeName.toLowerCase()==="strong"){window.location=QUnit.url({testNumber:test.testNumber});}});time=document.createElement("span");time.className="runtime";time.innerHTML=this.runtime+" ms";li=id(this.id);li.className=bad?"fail":"pass";li.removeChild(li.firstChild);a=li.firstChild;li.appendChild(b);li.appendChild(a);li.appendChild(time);li.appendChild(ol);}else{for(i=0;i<this.assertions.length;i++){if(!this.assertions[i].result){bad++;config.stats.bad++;config.moduleStats.bad++;}}}
runLoggingCallbacks("testDone",QUnit,{name:this.testName,module:this.module,failed:bad,passed:this.assertions.length-bad,total:this.assertions.length,runtime:this.runtime,duration:this.runtime});QUnit.reset();config.current=undefined;},queue:function(){var bad,test=this;synchronize(function(){test.init();});function run(){synchronize(function(){test.setup();});synchronize(function(){test.run();});synchronize(function(){test.teardown();});synchronize(function(){test.finish();});}
bad=QUnit.config.reorder&&defined.sessionStorage&&+sessionStorage.getItem("qunit-test-"+this.module+"-"+this.testName);if(bad){run();}else{synchronize(run,true);}}};//
assert=QUnit.assert={ok:function(result,msg){if(!config.current){throw new Error("ok() assertion outside test context, was "+sourceFromStacktrace(2));}
result=!!result;msg=msg||(result?"okay":"failed");var source,details={module:config.current.module,name:config.current.testName,result:result,message:msg};msg="<span class='test-message'>"+escapeText(msg)+"</span>";if(!result){source=sourceFromStacktrace(2);if(source){details.source=source;msg+="<table><tr class='test-source'><th>Source: </th><td><pre>"+
escapeText(source)+
"</pre></td></tr></table>";}}
runLoggingCallbacks("log",QUnit,details);config.current.assertions.push({result:result,message:msg});},equal:function(actual,expected,message){QUnit.push(expected==actual,actual,expected,message);},notEqual:function(actual,expected,message){QUnit.push(expected!=actual,actual,expected,message);},propEqual:function(actual,expected,message){actual=objectValues(actual);expected=objectValues(expected);QUnit.push(QUnit.equiv(actual,expected),actual,expected,message);},notPropEqual:function(actual,expected,message){actual=objectValues(actual);expected=objectValues(expected);QUnit.push(!QUnit.equiv(actual,expected),actual,expected,message);},deepEqual:function(actual,expected,message){QUnit.push(QUnit.equiv(actual,expected),actual,expected,message);},notDeepEqual:function(actual,expected,message){QUnit.push(!QUnit.equiv(actual,expected),actual,expected,message);},strictEqual:function(actual,expected,message){QUnit.push(expected===actual,actual,expected,message);},notStrictEqual:function(actual,expected,message){QUnit.push(expected!==actual,actual,expected,message);},"throws":function(block,expected,message){var actual,expectedOutput=expected,ok=false;if(!message&&typeof expected==="string"){message=expected;expected=null;}
config.current.ignoreGlobalErrors=true;try{block.call(config.current.testEnvironment);}catch(e){actual=e;}
config.current.ignoreGlobalErrors=false;if(actual){if(!expected){ok=true;expectedOutput=null;}else if(expected instanceof Error){ok=actual instanceof Error&&actual.name===expected.name&&actual.message===expected.message;}else if(QUnit.objectType(expected)==="regexp"){ok=expected.test(errorString(actual));}else if(QUnit.objectType(expected)==="string"){ok=expected===errorString(actual);}else if(actual instanceof expected){ok=true;}else if(expected.call({},actual)===true){expectedOutput=null;ok=true;}
QUnit.push(ok,actual,expectedOutput,message);}else{QUnit.pushFailure(message,null,"No exception was thrown.");}}};extend(QUnit.constructor.prototype,assert);QUnit.constructor.prototype.raises=function(){QUnit.push(false,false,false,"QUnit.raises has been deprecated since 2012 (fad3c1ea), use QUnit.throws instead");};QUnit.constructor.prototype.equals=function(){QUnit.push(false,false,false,"QUnit.equals has been deprecated since 2009 (e88049a0), use QUnit.equal instead");};QUnit.constructor.prototype.same=function(){QUnit.push(false,false,false,"QUnit.same has been deprecated since 2009 (e88049a0), use QUnit.deepEqual instead");};QUnit.equiv=(function(){function bindCallbacks(o,callbacks,args){var prop=QUnit.objectType(o);if(prop){if(QUnit.objectType(callbacks[prop])==="function"){return callbacks[prop].apply(callbacks,args);}else{return callbacks[prop];}}}
var innerEquiv,callers=[],parents=[],parentsB=[],getProto=Object.getPrototypeOf||function(obj){return obj.__proto__;},callbacks=(function(){function useStrictEquality(b,a){if(b instanceof a.constructor||a instanceof b.constructor){return a==b;}else{return a===b;}}
return{"string":useStrictEquality,"boolean":useStrictEquality,"number":useStrictEquality,"null":useStrictEquality,"undefined":useStrictEquality,"nan":function(b){return isNaN(b);},"date":function(b,a){return QUnit.objectType(b)==="date"&&a.valueOf()===b.valueOf();},"regexp":function(b,a){return QUnit.objectType(b)==="regexp"&&a.source===b.source&&a.global===b.global&&a.ignoreCase===b.ignoreCase&&a.multiline===b.multiline&&a.sticky===b.sticky;},"function":function(){var caller=callers[callers.length-1];return caller!==Object&&typeof caller!=="undefined";},"array":function(b,a){var i,j,len,loop,aCircular,bCircular;if(QUnit.objectType(b)!=="array"){return false;}
len=a.length;if(len!==b.length){return false;}
parents.push(a);parentsB.push(b);for(i=0;i<len;i++){loop=false;for(j=0;j<parents.length;j++){aCircular=parents[j]===a[i];bCircular=parentsB[j]===b[i];if(aCircular||bCircular){if(a[i]===b[i]||aCircular&&bCircular){loop=true;}else{parents.pop();parentsB.pop();return false;}
}}
if(!loop&&!innerEquiv(a[i],b[i])){parents.pop();parentsB.pop();return false;}}
parents.pop();parentsB.pop();return true;},"object":function(b,a){var i,j,loop,aCircular,bCircular,eq=true,aProperties=[],bProperties=[];if(a.constructor!==b.constructor){if(!((getProto(a)===null&&getProto(b)===Object.prototype)||(getProto(b)===null&&getProto(a)===Object.prototype))){return false;}}
callers.push(a.constructor);parents.push(a);parentsB.push(b);for(i in a){loop=false;for(j=0;j<parents.length;j++){aCircular=parents[j]===a[i];bCircular=parentsB[j]===b[i];if(aCircular||bCircular){if(a[i]===b[i]||aCircular&&bCircular){loop=true;}else{eq=false;break;}}}
aProperties.push(i);if(!loop&&!innerEquiv(a[i],b[i])){eq=false;break;}}
parents.pop();parentsB.pop();callers.pop();for(i in b){bProperties.push(i);}
return eq&&innerEquiv(aProperties.sort(),bProperties.sort());}};}());innerEquiv=function(){var args=[].slice.apply(arguments);if(args.length<2){return true;}

return(function(a,b){if(a===b){return true;}else if(a===null||b===null||typeof a==="undefined"||typeof b==="undefined"||QUnit.objectType(a)!==QUnit.objectType(b)){return false;}else{return bindCallbacks(a,callbacks,[b,a]);}}(args[0],args[1])&&innerEquiv.apply(this,args.splice(1,args.length-1)));};return innerEquiv;}());QUnit.jsDump=(function(){function quote(str){return "\""+str.toString().replace(/"/g,"\\\"")+"\"";}
function literal(o){return o+"";}
function join(pre,arr,post){var s=jsDump.separator(),base=jsDump.indent(),inner=jsDump.indent(1);if(arr.join){arr=arr.join(","+s+inner);}
if(!arr){return pre+post;}
return[pre,inner+arr,base+post].join(s);}
function array(arr,stack){var i=arr.length,ret=new Array(i);this.up();while(i--){ret[i]=this.parse(arr[i],undefined,stack);}
this.down();return join("[",ret,"]");}
var reName=/^function (\w+)/,jsDump={parse:function(obj,type,stack){stack=stack||[];var inStack,res,parser=this.parsers[type||this.typeOf(obj)];type=typeof parser;inStack=inArray(obj,stack);if(inStack!==-1){return "recursion("+(inStack-stack.length)+")";}
if(type==="function"){stack.push(obj);res=parser.call(this,obj,stack);stack.pop();return res;}
return(type==="string")?parser:this.parsers.error;},typeOf:function(obj){var type;if(obj===null){type="null";}else if(typeof obj==="undefined"){type="undefined";}else if(QUnit.is("regexp",obj)){type="regexp";}else if(QUnit.is("date",obj)){type="date";}else if(QUnit.is("function",obj)){type="function";}else if(typeof obj.setInterval!==undefined&&typeof obj.document!=="undefined"&&typeof obj.nodeType==="undefined"){type="window";}else if(obj.nodeType===9){type="document";}else if(obj.nodeType){type="node";}else if(toString.call(obj)==="[object Array]"||(typeof obj.length==="number"&&typeof obj.item!=="undefined"&&(obj.length?obj.item(0)===obj[0]:(obj.item(0)===null&&typeof obj[0]==="undefined")))){type="array";}else if(obj.constructor===Error.prototype.constructor){type="error";}else{type=typeof obj;}
return type;},separator:function(){return this.multiline?this.HTML?"<br />":"\n":this.HTML?"&nbsp;":" ";},indent:function(extra){if(!this.multiline){return "";}
var chr=this.indentChar;if(this.HTML){ chr=chr.replace(/\t/g,"   ").replace(/ /g,"&nbsp;");}
return new Array(this.depth+(extra||0)).join(chr);},up:function(a){this.depth+=a||1;},down:function(a){this.depth-=a||1;},setParser:function(name,parser){this.parsers[name]=parser;},quote:quote,literal:literal,join:join,depth:1,parsers:{window:"[Window]",document:"[Document]",error:function(error){return "Error(\""+error.message+"\")";},unknown:"[Unknown]","null":"null","undefined":"undefined","function":function(fn){var ret="function",name="name" in fn?fn.name:(reName.exec(fn)||[])[1];if(name){ret+=" "+name;}
ret+="( ";ret=[ret,QUnit.jsDump.parse(fn,"functionArgs"),"){"].join("");return join(ret,QUnit.jsDump.parse(fn,"functionCode"),"}");},array:array,nodelist:array,"arguments":array,object:function(map,stack){var ret=[],keys,key,val,i;QUnit.jsDump.up();keys=[];for(key in map){keys.push(key);}
keys.sort();for(i=0;i<keys.length;i++){key=keys[i];val=map[key];ret.push(QUnit.jsDump.parse(key,"key")+": "+QUnit.jsDump.parse(val,undefined,stack));}
QUnit.jsDump.down();return join("{",ret,"}");},node:function(node){var len,i,val,open=QUnit.jsDump.HTML?"&lt;":"<",close=QUnit.jsDump.HTML?"&gt;":">",tag=node.nodeName.toLowerCase(),ret=open+tag,attrs=node.attributes;if(attrs){for(i=0,len=attrs.length;i<len;i++){val=attrs[i].nodeValue;if(val&&val!=="inherit"){ret+=" "+attrs[i].nodeName+"="+QUnit.jsDump.parse(val,"attribute");}}}
ret+=close;if(node.nodeType===3||node.nodeType===4){ret+=node.nodeValue;}
return ret+open+"/"+tag+close;},functionArgs:function(fn){var args,l=fn.length;if(!l){return "";}
args=new Array(l);while(l--){args[l]=String.fromCharCode(97+l);}
return " "+args.join(", ")+" ";},key:quote,functionCode:"[code]",attribute:quote,string:quote,date:quote,regexp:literal,number:literal,"boolean":literal},HTML:false,indentChar:"  ",multiline:true};return jsDump;}());QUnit.diff=(function(){function diff(o,n){var i,ns={},os={};for(i=0;i<n.length;i++){if(!hasOwn.call(ns,n[i])){ns[n[i]]={rows:[],o:null};}
ns[n[i]].rows.push(i);}
for(i=0;i<o.length;i++){if(!hasOwn.call(os,o[i])){os[o[i]]={rows:[],n:null};}
os[o[i]].rows.push(i);}
for(i in ns){if(hasOwn.call(ns,i)){if(ns[i].rows.length===1&&hasOwn.call(os,i)&&os[i].rows.length===1){n[ns[i].rows[0]]={text:n[ns[i].rows[0]],row:os[i].rows[0]};o[os[i].rows[0]]={text:o[os[i].rows[0]],row:ns[i].rows[0]};}}}
for(i=0;i<n.length-1;i++){if(n[i].text!=null&&n[i+1].text==null&&n[i].row+1<o.length&&o[n[i].row+1].text==null&&n[i+1]==o[n[i].row+1]){n[i+1]={text:n[i+1],row:n[i].row+1};o[n[i].row+1]={text:o[n[i].row+1],row:i+1};}}
for(i=n.length-1;i>0;i--){if(n[i].text!=null&&n[i-1].text==null&&n[i].row>0&&o[n[i].row-1].text==null&&n[i-1]==o[n[i].row-1]){n[i-1]={text:n[i-1],row:n[i].row-1};o[n[i].row-1]={text:o[n[i].row-1],row:i-1};}}
return{o:o,n:n};}
return function(o,n){o=o.replace(/\s+$/,"");n=n.replace(/\s+$/,"");var i,pre,str="",out=diff(o===""?[]:o.split(/\s+/),n===""?[]:n.split(/\s+/)),oSpace=o.match(/\s+/g),nSpace=n.match(/\s+/g);if(oSpace==null){oSpace=[" "];}
else{oSpace.push(" ");}
if(nSpace==null){nSpace=[" "];}
else{nSpace.push(" ");}
if(out.n.length===0){for(i=0;i<out.o.length;i++){str+="<del>"+out.o[i]+oSpace[i]+"</del>";}}
else{if(out.n[0].text==null){for(n=0;n<out.o.length&&out.o[n].text==null;n++){str+="<del>"+out.o[n]+oSpace[n]+"</del>";}}
for(i=0;i<out.n.length;i++){if(out.n[i].text==null){str+="<ins>"+out.n[i]+nSpace[i]+"</ins>";}
else{pre="";for(n=out.n[i].row+1;n<out.o.length&&out.o[n].text==null;n++){pre+="<del>"+out.o[n]+oSpace[n]+"</del>";}
str+=" "+out.n[i].text+nSpace[i]+pre;}}}
return str;};}());if(typeof window!=="undefined"){extend(window,QUnit.constructor.prototype);window.QUnit=QUnit;}
if(typeof module!=="undefined"&&module.exports){module.exports=QUnit;}}((function(){return this;})()));