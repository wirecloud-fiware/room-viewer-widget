//  http://conwet.fi.upm.es/docs/display/wirecloud/Javascript+API

// set namespace
var MockMP = {};

(function (namespace) {

    "use strict";

    var NullStrategy = function NullStrategy() {
    };

    NullStrategy.prototype.getImplementation = function getImplementation(method, obj) {
        return function () {
            return null;
        };
    };

    var ExceptionStrategy = function ExceptionStrategy() {
    };

    ExceptionStrategy.prototype.getImplementation = function getImplementation(method, obj) {
        return function () {
            throw {
                name: "StrategyException",
                message: method + " has failed: not mocked."
            };
        };
    };

    var DefaultStrategy = function DefaultStrategy() {
    };

    DefaultStrategy.prototype.getImplementation = function getImplementation(method, obj) {
        return function () {
            return obj;
        };
    };

    namespace.Strategy = Object.freeze({
        EXCEPTION: new ExceptionStrategy(),
        NULL: new NullStrategy(),
        DEFAULT: new DefaultStrategy()
    });

    namespace.MockMP = function MockMP() {
        this.strategy = namespace.Strategy.NULL;
        this.spySet = [];
        this.map = {
            http: ["buildProxyURL", "makeRequest"],
            wiring: ["pushEvent", "registerCallback"],
            prefs: ["get", "set", "registerCallback"],
            widget: ["getVariable", "drawAttention", "id", "log", "context"],
            context: ["get"],
            mashup: [""]
        };

        createDefaultValues.call(this);
        createMocks.call(this);
    };

    namespace.MockMP.prototype.reset = function reset(spyList) {
        var spySet = this.spySet;
        if (spyList) {
            spySet = spyList;
        }

        spySet.forEach(function (spy) {
            spy.reset();
        });
    };

    namespace.MockMP.prototype.setStrategy = function setStrategy(strategy) {
        this.strategy = strategy;
        createMocks.call(this);
    };


/*****************************************************************************/
/********************************** Private **********************************/
/*****************************************************************************/

    var createMocks = function createMocks() {
        var spy = {};
        var map = this.map;
        var method = "";
        var methodTemp;

        this.spySet = [];
        for (var attr in map) {
            method = "MashupPlatform.";
            method += attr + ".";
            var spyNameList = map[attr];
            this[attr] = jasmine.createSpyObj(attr, spyNameList);
            
            for (var i = 0; i < spyNameList.length; i++) {
                var spyName = spyNameList[i];
                methodTemp = method + spyName;
                spy = this[attr][spyName];
                this.spySet.push(spy);
                spy.and.callFake(this.strategy.getImplementation(methodTemp, this.defaultValues[methodTemp]));
            }
        }
        spy = jasmine.createSpyObj("context", ["registerCallback"]);
        method = "MashupPlatform.widget.context.registerCallback";
        spy.registerCallback.and.callFake(this.strategy.getImplementation(method, this.defaultValues[method]));
        this.widget.context = spy;

        spy = jasmine.createSpyObj("context", ["get"]);
        method = "MashupPlatform.mashup.context.get";
        spy.get.and.callFake(this.strategy.getImplementation(method, this.defaultValues[method]));
        this.mashup.context = spy;
    };

    var createDefaultValues = function createDefaultValues() {
        this.defaultValues = {
            "MashupPlatform.context.get" : "not set yet",
            "MashupPlatform.http.buildProxyURL": null,
            "MashupPlatform.http.makeRequest": null,
            "MashupPlatform.mashup.context.get" : "not set yet",
            "MashupPlatform.prefs.get": "value",
            "MashupPlatform.prefs.set": null,
            "MashupPlatform.prefs.registerCallback": null,
            "MashupPlatform.widget.getVariable": "value",
            "MashupPlatform.widget.drawAttention": null,
            "MashupPlatform.widget.id": "id33",
            "MashupPlatform.widget.log": "something",
            "MashupPlatform.widget.context.registerCallback": null,
            "MashupPlatform.wiring.pushEvent": null,
            "MashupPlatform.wiring.registerCallback": null
        };
    };

})(MockMP);

// MashupPlatform = new MockMP.MockMP();
