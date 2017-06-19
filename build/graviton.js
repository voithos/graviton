(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _app = require('./graviton/app');

var _app2 = _interopRequireDefault(_app);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = { app: _app2.default }; /**
                                           * graviton
                                           *
                                           * JavaScript N-body Gravitational Simulator
                                           *
                                           * Copyright (c) 2015 Zaven Muradyan
                                           * Licensed under the MIT license
                                           *
                                           * Revision:
                                           *  @REVISION
                                           */

},{"./graviton/app":2}],2:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        * graviton/app -- The interactive graviton application
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        */
/* global jscolor */

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _vex = require('../vendor/vex');

var _vex2 = _interopRequireDefault(_vex);

var _random = require('../util/random');

var _random2 = _interopRequireDefault(_random);

var _sim = require('./sim');

var _sim2 = _interopRequireDefault(_sim);

var _gfx = require('./gfx');

var _gfx2 = _interopRequireDefault(_gfx);

var _events = require('./events');

var _events2 = _interopRequireDefault(_events);

var _timer = require('./timer');

var _timer2 = _interopRequireDefault(_timer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GtApp = (function () {
    function GtApp() {
        _classCallCheck(this, GtApp);

        var args = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        this.args = args;

        this.options = {};
        this.grid = null;

        this.animTimer = null;
        this.simTimer = null;

        this.events = null;
        this.sim = null;
        this.gfx = null;

        this.noclear = false;
        this.quadTreeLines = false;
        this.interaction = { previous: {} };
        this.targetBody = undefined;
        this.wasColorPickerActive = false;
        this.isHelpOpen = false;

        this.options.width = args.width = args.width || window.innerWidth;
        this.options.height = args.height = args.height || window.innerHeight;
        this.options.backgroundColor = args.backgroundColor || '#1F263B';

        // Retrieve canvas, or build one with arguments
        this.grid = typeof args.grid === 'string' ? document.getElementById(args.grid) : args.grid;

        if (typeof this.grid === 'undefined') {
            this.generateGrid(this.options.width, this.options.height, { backgroundColor: this.options.backgroundColor });
            args.grid = this.grid;
        }

        this.controls = typeof args.controls === 'string' ? document.getElementById(args.controls) : args.controls;

        if (typeof this.controls === 'undefined') {
            this.generateControls();
            args.controls = this.controls;
        }

        this.playBtn = args.playBtn = this.controls.querySelector('#playbtn');
        this.pauseBtn = args.pauseBtn = this.controls.querySelector('#pausebtn');
        this.quadTreeOffBtn = args.quadTreeOffBtn = this.controls.querySelector('#quadtreeoffbtn');
        this.quadTreeOnBtn = args.quadTreeOnBtn = this.controls.querySelector('#quadtreeonbtn');
        this.trailOffBtn = args.trailOffBtn = this.controls.querySelector('#trailoffbtn');
        this.trailOnBtn = args.trailOnBtn = this.controls.querySelector('#trailonbtn');
        this.helpBtn = args.helpBtn = this.controls.querySelector('#helpbtn');

        this.colorPicker = typeof args.colorPicker === 'string' ? document.getElementById(args.colorPicker) : args.colorPicker;

        if (typeof this.colorPicker === 'undefined') {
            this.colorPicker = document.createElement('input');
            this.colorPicker.className = 'bodycolorpicker';
            document.body.appendChild(this.colorPicker);
            args.colorPicker = this.colorPicker;
        }
        this.jscolor = new jscolor(this.colorPicker, {
            padding: 0,
            shadow: false,
            borderWidth: 0,
            backgroundColor: 'transparent',
            insetColor: '#3d559e',
            onFineChange: this.updateColor.bind(this)
        });

        this.metaInfo = typeof args.metaInfo === 'string' ? document.getElementById(args.metaInfo) : args.metaInfo;

        if (typeof this.metaInfo === 'undefined') {
            this.metaInfo = document.createElement('span');
            this.metaInfo.className = 'metainfo';
            document.body.appendChild(this.metaInfo);
            args.metaInfo = this.metaInfo;
        }

        // Initialize
        this.initComponents();
        this.initTimers();
    }

    /**
     * main -- Main 'game' loop
     */

    _createClass(GtApp, [{
        key: 'main',
        value: function main() {
            // Event processing
            //--------------------
            this.events.qget().forEach(function (event) {
                var retval = undefined;

                switch (event.type) {
                    case _events.EVENTCODES.MOUSEDOWN:
                        if (event.button === /* right click */2) {
                            // Remove body.
                            if (this.targetBody && !this.interaction.started) {
                                this.sim.removeBody(this.targetBody);
                                this.setTargetBody(undefined);
                            }
                        } else if (event.button === /* middle click */1) {
                            // Color picking
                            if (this.targetBody && !this.interaction.started) {
                                this.colorPicker.style.left = event.position.x + 'px';
                                this.colorPicker.style.top = event.position.y + 'px';
                                this.jscolor.fromString(this.targetBody.color);
                                this.jscolor.show();
                            }
                        } else {
                            /* left click */
                            // Base the check on the previous value, in case the color picker was just
                            // closed.
                            if (!this.wasColorPickerActive) {
                                // Add flag to signal other events
                                this.interaction.started = true;

                                if (this.targetBody) {
                                    this.interaction.body = this.targetBody;
                                } else {
                                    this.interaction.body = this.sim.addNewBody({
                                        x: event.position.x,
                                        y: event.position.y
                                    });
                                }

                                this.interaction.previous.x = event.position.x;
                                this.interaction.previous.y = event.position.y;
                            } else {
                                // Update the picker.
                                this.isColorPickerActive();
                            }
                        }
                        break; // end MOUSEDOWN

                    case _events.EVENTCODES.MOUSEUP:
                        if (this.interaction.started) {
                            this.interaction.started = false;

                            var body = this.interaction.body;

                            var velX = (event.position.x - body.x) * 0.0000001;
                            var velY = (event.position.y - body.y) * 0.0000001;
                            // When the simulation is active, add the velocity to the current velocity
                            // instead of completely resetting it (to allow for more interesting
                            // interactions).
                            body.velX = this.simTimer.active ? body.velX + velX : velX;
                            body.velY = this.simTimer.active ? body.velY + velY : velY;
                        }
                        this.updateTarget(event.position.x, event.position.y);
                        break;

                    case _events.EVENTCODES.MOUSEMOVE:
                        this.interaction.previous.x = event.position.x;
                        this.interaction.previous.y = event.position.y;
                        if (!this.interaction.started && !this.isColorPickerActive()) {
                            this.updateTarget(event.position.x, event.position.y);
                        }
                        break; // end MOUSEMOVE

                    case _events.EVENTCODES.MOUSEWHEEL:
                        if (this.targetBody) {
                            this.targetBody.adjustSize(event.delta);
                            this.updateMetaInfo();
                        }
                        break; // end MOUSEWHEEL

                    case _events.EVENTCODES.KEYDOWN:
                        switch (event.keycode) {
                            case _events.KEYCODES.K_ENTER:
                                this.toggleSim();
                                break;

                            case _events.KEYCODES.K_C:
                                // Clear simulation
                                this.sim.clear();
                                this.gfx.clear();
                                this.simTimer.stop();
                                retval = false;
                                break;

                            case _events.KEYCODES.K_P:
                                this.toggleTrails();
                                break;

                            case _events.KEYCODES.K_R:
                                // Generate random objects
                                this.generateBodies(10, { randomColors: true });
                                break;

                            case _events.KEYCODES.K_T:
                                this.sim.addNewBody({
                                    x: this.options.width / 2, y: this.options.height / 2,
                                    velX: 0, velY: 0,
                                    mass: 2000, radius: 50, color: '#5A5A5A'
                                });
                                this.sim.addNewBody({
                                    x: this.options.width - 400, y: this.options.height / 2,
                                    velX: 0, velY: 0.000025,
                                    mass: 1, radius: 5, color: '#787878'
                                });
                                break;

                            case _events.KEYCODES.K_QUESTIONMARK:
                                this.showHelp();
                                break;
                        }
                        break; // end KEYDOWN

                    case _events.CONTROLCODES.PLAYBTN:
                        this.toggleSim();
                        break;

                    case _events.CONTROLCODES.PAUSEBTN:
                        this.toggleSim();
                        break;

                    case _events.CONTROLCODES.QUADTREEOFFBTN:
                        this.toggleQuadTreeLines();
                        break;

                    case _events.CONTROLCODES.QUADTREEONBTN:
                        this.toggleQuadTreeLines();
                        break;

                    case _events.CONTROLCODES.TRAILOFFBTN:
                        this.toggleTrails();
                        break;

                    case _events.CONTROLCODES.TRAILONBTN:
                        this.toggleTrails();
                        break;

                    case _events.CONTROLCODES.HELPBTN:
                        this.showHelp();
                        break;
                }

                return retval;
            }, this);

            // Redraw screen
            this.redraw();
        }
    }, {
        key: 'initComponents',
        value: function initComponents() {
            // Create components -- order is important
            this.events = this.args.events = new _events2.default(this.args);
            this.sim = new _sim2.default(this.args);
            this.gfx = new _gfx2.default(this.args);
        }
    }, {
        key: 'initTimers',
        value: function initTimers() {
            // Add `main` loop, and start immediately
            this.animTimer = new _timer2.default(this.main.bind(this));
            this.animTimer.start();
            this.simTimer = new _timer2.default(this.sim.step.bind(this.sim), 60);
        }
    }, {
        key: 'toggleSim',
        value: function toggleSim() {
            if (this.simTimer.active) {
                this.playBtn.style.display = '';
                this.pauseBtn.style.display = 'none';
            } else {
                this.playBtn.style.display = 'none';
                this.pauseBtn.style.display = '';
            }
            this.simTimer.toggle();
        }
    }, {
        key: 'toggleTrails',
        value: function toggleTrails() {
            if (this.noclear) {
                this.trailOffBtn.style.display = '';
                this.trailOnBtn.style.display = 'none';
            } else {
                this.trailOffBtn.style.display = 'none';
                this.trailOnBtn.style.display = '';
            }
            this.noclear = !this.noclear;
        }
    }, {
        key: 'toggleQuadTreeLines',
        value: function toggleQuadTreeLines() {
            if (this.quadTreeLines) {
                this.quadTreeOffBtn.style.display = '';
                this.quadTreeOnBtn.style.display = 'none';
            } else {
                this.quadTreeOffBtn.style.display = 'none';
                this.quadTreeOnBtn.style.display = '';
            }
            this.quadTreeLines = !this.quadTreeLines;
        }
    }, {
        key: 'showHelp',
        value: function showHelp() {
            var _this = this;

            if (this.isHelpOpen) {
                return;
            }
            this.isHelpOpen = true;
            _vex2.default.open({
                unsafeContent: '\n                <h3>Shortcuts</h3>\n                <table class="shortcuts">\n                    <tbody>\n                    <tr>\n                        <td>Left click</td> <td> create body</td></tr>\n                    <tr>\n                        <td>Right click</td> <td> delete body</td></tr>\n                    <tr>\n                        <td>Middle click</td> <td> change body color</td></tr>\n                    <tr>\n                        <td><code>Enter key</code> key</td> <td> start simulation</td></tr>\n                    <tr>\n                        <td><code>C</code> key</td> <td> clear canvas</td></tr>\n                    <tr>\n                        <td><code>P</code> key</td> <td> toggle repainting</td></tr>\n                    <tr>\n                        <td><code>R</code> key</td> <td> create random bodies</td></tr>\n                    <tr>\n                        <td><code>T</code> key</td> <td> create Titan</td></tr>\n                    <tr>\n                        <td><code>?</code> key</td> <td> show help</td></tr>\n                    </tbody>\n                </table>\n                ',
                afterClose: function afterClose() {
                    _this.isHelpOpen = false;
                }
            });
        }
    }, {
        key: 'redraw',
        value: function redraw() {
            if (!this.noclear) {
                this.gfx.clear();
            }
            if (this.quadTreeLines) {
                this.gfx.drawQuadTreeLines(this.sim.tree.root);
            }
            if (this.interaction.started) {
                this.gfx.drawReticleLine(this.interaction.body, this.interaction.previous);
            }
            this.gfx.drawBodies(this.sim.bodies, this.targetBody);
        }
    }, {
        key: 'generateGrid',
        value: function generateGrid(width, height, style) {
            // Attach a canvas to the page, to house the simulations
            if (!style) {
                style = {};
            }

            this.grid = document.createElement('canvas');

            this.grid.className = 'gravitoncanvas';
            this.grid.width = width;
            this.grid.height = height;
            this.grid.style.display = 'block';
            this.grid.style.marginLeft = style.marginLeft || 'auto';
            this.grid.style.marginRight = style.marginRight || 'auto';
            this.grid.style.backgroundColor = style.backgroundColor || '#000000';

            document.body.appendChild(this.grid);
        }
    }, {
        key: 'generateControls',
        value: function generateControls() {
            this.controls = document.createElement('menu');
            this.controls.type = 'toolbar';
            this.controls.id = 'controls';
            this.controls.innerHTML = '\n            <menuitem id="playbtn">\n                <img src="assets/play.svg" alt="Start simulation">\n            </menuitem>\n            <menuitem id="pausebtn" style="display: none;">\n                <img src="assets/pause.svg" alt="Stop simulation">\n            </menuitem>\n            <menuitem id="quadtreeoffbtn">\n                <img src="assets/quadtree_off.svg" alt="Toggle quadtree lines">\n            </menuitem>\n            <menuitem id="quadtreeonbtn" style="display: none;">\n                <img src="assets/quadtree_on.svg" alt="Toggle quadtree lines">\n            </menuitem>\n            <menuitem id="trailoffbtn">\n                <img src="assets/trail_off.svg" alt="Toggle trails">\n            </menuitem>\n            <menuitem id="trailonbtn" style="display: none;">\n                <img src="assets/trail_on.svg" alt="Toggle trails">\n            </menuitem>\n            <menuitem id="helpbtn">\n                <img src="assets/help.svg" alt="Help">\n            </menuitem>\n            ';

            document.body.appendChild(this.controls);
        }
    }, {
        key: 'generateBodies',
        value: function generateBodies(num, args) {
            args = args || {};

            var minX = args.minX || 0;
            var maxX = args.maxX || this.options.width;
            var minY = args.minY || 0;
            var maxY = args.maxY || this.options.height;

            var minVelX = args.minVelX || 0;
            var maxVelX = args.maxVelX || 0.00001;
            var minVelY = args.minVelY || 0;
            var maxVelY = args.maxVelY || 0.00001;

            var minMass = args.minMass || 1;
            var maxMass = args.maxMass || 150;

            var minRadius = args.minRadius || 1;
            var maxRadius = args.maxRadius || 15;

            var color = args.color;

            for (var i = 0; i < num; i++) {
                if (args.randomColors === true) {
                    color = _random2.default.color();
                }

                this.sim.addNewBody({
                    x: _random2.default.number(minX, maxX),
                    y: _random2.default.number(minY, maxY),
                    velX: _random2.default.directional(minVelX, maxVelX),
                    velY: _random2.default.directional(minVelY, maxVelY),
                    mass: _random2.default.number(minMass, maxMass),
                    radius: _random2.default.number(minRadius, maxRadius),
                    color: color
                });
            }
        }
    }, {
        key: 'updateTarget',
        value: function updateTarget(x, y) {
            this.setTargetBody(this.sim.getBodyAt(x, y));
        }
    }, {
        key: 'setTargetBody',
        value: function setTargetBody(body) {
            this.targetBody = body;
            this.updateMetaInfo();
        }
    }, {
        key: 'updateMetaInfo',
        value: function updateMetaInfo() {
            if (this.targetBody) {
                this.metaInfo.innerHTML = '⊕ ' + this.targetBody.mass.toFixed(2) + ' &nbsp;' + ('⦿ ' + this.targetBody.radius.toFixed(2) + ' &nbsp;') + ('⇗ ' + this.targetBody.speed.toFixed(2));
            } else {
                this.metaInfo.textContent = '';
            }
        }
    }, {
        key: 'updateColor',
        value: function updateColor() {
            if (this.targetBody) {
                this.targetBody.updateColor(this.jscolor.toHEXString());
            }
        }
    }, {
        key: 'isColorPickerActive',
        value: function isColorPickerActive() {
            this.wasColorPickerActive = this.colorPicker.className.indexOf('jscolor-active') > -1;
            return this.wasColorPickerActive;
        }
    }]);

    return GtApp;
})(); // end graviton/app

exports.default = GtApp;

},{"../util/random":13,"../vendor/vex":15,"./events":4,"./gfx":5,"./sim":6,"./timer":7}],3:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _colors = require('../util/colors');

var _colors2 = _interopRequireDefault(_colors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * graviton/body -- The gravitational body
 */

var GtBody = (function () {
    function GtBody(args) {
        _classCallCheck(this, GtBody);

        args = args || {};

        this.x = args.x;
        this.y = args.y;
        if (typeof this.x !== 'number' || typeof this.y !== 'number') {
            throw Error('Correct positions were not given for the body.');
        }

        this.nextX = this.x;
        this.nextY = this.y;

        this.velX = args.velX || 0;
        this.velY = args.velY || 0;

        this.radius = args.radius || 10;
        // Initialized below.
        this.mass = undefined;
        this.color = undefined;
        this.highlight = undefined;

        this.updateColor(args.color || '#dbd3c8');
        this.adjustSize(0);
    }

    _createClass(GtBody, [{
        key: 'adjustSize',
        value: function adjustSize(delta) {
            this.radius = Math.max(this.radius + delta, 2);
            // Dorky formula to make mass scale "properly" with radius.
            this.mass = Math.pow(this.radius / 4, 3);
        }
    }, {
        key: 'updateColor',
        value: function updateColor(color) {
            this.color = color;
            this.highlight = _colors2.default.toHex(_colors2.default.brighten(_colors2.default.fromHex(this.color), .25));
        }
    }, {
        key: 'speed',
        get: function get() {
            // Velocities are tiny, so upscale it (arbitrarily) to make it readable.
            return Math.sqrt(this.velX * this.velX + this.velY * this.velY) * 1e6;
        }
    }]);

    return GtBody;
})(); // end graviton/body

exports.default = GtBody;

},{"../util/colors":11}],4:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * graviton/events -- Event queueing and processing
 */
var KEYCODES = exports.KEYCODES = {
    K_LEFT: 37,
    K_UP: 38,
    K_RIGHT: 39,
    K_DOWN: 40,

    K_0: 48,
    K_1: 49,
    K_2: 50,
    K_3: 51,
    K_4: 52,
    K_5: 53,
    K_6: 54,
    K_7: 55,
    K_8: 56,
    K_9: 57,

    K_A: 65,
    K_B: 66,
    K_C: 67,
    K_D: 68,
    K_E: 69,
    K_F: 70,
    K_G: 71,
    K_H: 72,
    K_I: 73,
    K_J: 74,
    K_K: 75,
    K_L: 76,
    K_M: 77,
    K_N: 78,
    K_O: 79,
    K_P: 80,
    K_Q: 81,
    K_R: 82,
    K_S: 83,
    K_T: 84,
    K_U: 85,
    K_V: 86,
    K_W: 87,
    K_X: 88,
    K_Y: 89,
    K_Z: 90,

    K_KP1: 97,
    K_KP2: 98,
    K_KP3: 99,
    K_KP4: 100,
    K_KP5: 101,
    K_KP6: 102,
    K_KP7: 103,
    K_KP8: 104,
    K_KP9: 105,

    K_QUESTIONMARK: 191,

    K_BACKSPACE: 8,
    K_TAB: 9,
    K_ENTER: 13,
    K_SHIFT: 16,
    K_CTRL: 17,
    K_ALT: 18,
    K_ESC: 27,
    K_SPACE: 32
};

var MOUSECODES = exports.MOUSECODES = {
    M_LEFT: 0,
    M_MIDDLE: 1,
    M_RIGHT: 2
};

var EVENTCODES = exports.EVENTCODES = {
    MOUSEDOWN: 1000,
    MOUSEUP: 1001,
    MOUSEMOVE: 1002,
    MOUSEWHEEL: 1003,
    CLICK: 1004,
    DBLCLICK: 1005,

    KEYDOWN: 1010,
    KEYUP: 1011
};

var CONTROLCODES = exports.CONTROLCODES = {
    PLAYBTN: 2000,
    PAUSEBTN: 2001,
    TRAILOFFBTN: 2002,
    TRAILONBTN: 2003,
    HELPBTN: 2004,
    QUADTREEOFFBTN: 2005,
    QUADTREEONBTN: 2006
};

var GtEvents = (function () {
    function GtEvents(args) {
        _classCallCheck(this, GtEvents);

        args = args || {};

        this.queue = [];

        if (typeof args.grid === 'undefined') {
            throw Error('No usable canvas element was given.');
        }
        this.grid = args.grid;
        this.controls = args.controls;
        this.playBtn = args.playBtn;
        this.pauseBtn = args.pauseBtn;
        this.quadTreeOffBtn = args.quadTreeOffBtn;
        this.quadTreeOnBtn = args.quadTreeOnBtn;
        this.trailOffBtn = args.trailOffBtn;
        this.trailOnBtn = args.trailOnBtn;
        this.helpBtn = args.helpBtn;

        this.wireupEvents();
    }

    _createClass(GtEvents, [{
        key: 'qadd',
        value: function qadd(event) {
            this.queue.push(event);
        }
    }, {
        key: 'qpoll',
        value: function qpoll() {
            return this.queue.shift();
        }
    }, {
        key: 'qget',
        value: function qget() {
            // Replacing the reference is faster than `splice()`
            var ref = this.queue;
            this.queue = [];
            return ref;
        }
    }, {
        key: 'qclear',
        value: function qclear() {
            this.queue = [];
        }
    }, {
        key: 'wireupEvents',
        value: function wireupEvents() {
            // Grid mouse events
            this.grid.addEventListener('click', this.handleClick.bind(this));
            this.grid.addEventListener('dblclick', this.handleDblClick.bind(this));

            this.grid.addEventListener('contextmenu', this.handleContextMenu.bind(this));
            this.grid.addEventListener('mousedown', this.handleMouseDown.bind(this));
            this.grid.addEventListener('mouseup', this.handleMouseUp.bind(this));
            this.grid.addEventListener('mousemove', this.handleMouseMove.bind(this));
            this.grid.addEventListener('wheel', this.handleMouseWheel.bind(this));

            // Grid key events
            document.addEventListener('keydown', this.handleKeyDown.bind(this));
            document.addEventListener('keyup', this.handleKeyUp.bind(this));

            // Control events
            this.playBtn.addEventListener('click', this.handleControlClick.bind(this, CONTROLCODES.PLAYBTN));
            this.pauseBtn.addEventListener('click', this.handleControlClick.bind(this, CONTROLCODES.PAUSEBTN));
            this.quadTreeOffBtn.addEventListener('click', this.handleControlClick.bind(this, CONTROLCODES.QUADTREEOFFBTN));
            this.quadTreeOnBtn.addEventListener('click', this.handleControlClick.bind(this, CONTROLCODES.QUADTREEONBTN));
            this.trailOffBtn.addEventListener('click', this.handleControlClick.bind(this, CONTROLCODES.TRAILOFFBTN));
            this.trailOnBtn.addEventListener('click', this.handleControlClick.bind(this, CONTROLCODES.TRAILONBTN));
            this.helpBtn.addEventListener('click', this.handleControlClick.bind(this, CONTROLCODES.HELPBTN));
        }
    }, {
        key: 'handleClick',
        value: function handleClick(event) {
            this.qadd({
                type: EVENTCODES.CLICK,
                position: this.getPosition(event),
                button: event.button,
                shift: event.shiftKey,
                ctrl: event.ctrlKey,
                timestamp: event.timeStamp
            });
        }
    }, {
        key: 'handleDblClick',
        value: function handleDblClick(event) {
            this.qadd({
                type: EVENTCODES.DBLCLICK,
                position: this.getPosition(event),
                button: event.button,
                shift: event.shiftKey,
                ctrl: event.ctrlKey,
                timestamp: event.timeStamp
            });
        }
    }, {
        key: 'handleContextMenu',
        value: function handleContextMenu(event) {
            // Prevent right-click menu
            event.preventDefault();
        }
    }, {
        key: 'handleMouseDown',
        value: function handleMouseDown(event) {
            this.qadd({
                type: EVENTCODES.MOUSEDOWN,
                position: this.getPosition(event),
                button: event.button,
                shift: event.shiftKey,
                ctrl: event.ctrlKey,
                timestamp: event.timeStamp
            });
        }
    }, {
        key: 'handleMouseUp',
        value: function handleMouseUp(event) {
            this.qadd({
                type: EVENTCODES.MOUSEUP,
                position: this.getPosition(event),
                button: event.button,
                shift: event.shiftKey,
                ctrl: event.ctrlKey,
                timestamp: event.timeStamp
            });
        }
    }, {
        key: 'handleMouseMove',
        value: function handleMouseMove(event) {
            this.qadd({
                type: EVENTCODES.MOUSEMOVE,
                position: this.getPosition(event),
                timestamp: event.timeStamp
            });
        }
    }, {
        key: 'handleMouseWheel',
        value: function handleMouseWheel(event) {
            // Reverse the up/down.
            var delta = -event.deltaY / 50;

            this.qadd({
                type: EVENTCODES.MOUSEWHEEL,
                position: this.getPosition(event),
                delta: delta,
                shift: event.shiftKey,
                ctrl: event.ctrlKey,
                timestamp: event.timeStamp
            });

            // Prevent the window from scrolling
            event.preventDefault();
        }
    }, {
        key: 'handleKeyDown',
        value: function handleKeyDown(event) {
            // Account for browser discrepancies
            var key = event.keyCode || event.which;

            this.qadd({
                type: EVENTCODES.KEYDOWN,
                keycode: key,
                shift: event.shiftKey,
                ctrl: event.ctrlKey,
                timestamp: event.timeStamp
            });
        }
    }, {
        key: 'handleKeyUp',
        value: function handleKeyUp(event) {
            // Account for browser discrepancies
            var key = event.keyCode || event.which;

            this.qadd({
                type: EVENTCODES.KEYUP,
                keycode: key,
                shift: event.shiftKey,
                ctrl: event.ctrlKey,
                timestamp: event.timeStamp
            });
        }
    }, {
        key: 'handleControlClick',
        value: function handleControlClick(type, event) {
            this.qadd({
                type: type,
                timestamp: event.timeStamp
            });
        }
    }, {
        key: 'getPosition',
        value: function getPosition(event) {
            // Calculate offset on the grid from clientX/Y, because
            // some browsers don't have event.offsetX/Y
            return {
                x: event.clientX - this.grid.offsetLeft,
                y: event.clientY - this.grid.offsetTop
            };
        }
    }]);

    return GtEvents;
})(); // end graviton/events

exports.default = GtEvents;

},{}],5:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * graviton/gfx -- The graphics object
 */

var GtGfx = (function () {
    function GtGfx(args) {
        _classCallCheck(this, GtGfx);

        args = args || {};

        this.grid = typeof args.grid === 'string' ? document.getElementById(args.grid) : args.grid;

        if (typeof this.grid === 'undefined') {
            throw Error('No usable canvas element was given.');
        }

        this.ctx = this.grid.getContext('2d');
    }

    _createClass(GtGfx, [{
        key: 'clear',
        value: function clear() {
            // Setting the width has the side effect
            // of clearing the canvas
            this.grid.width = this.grid.width;
        }
    }, {
        key: 'drawBodies',
        value: function drawBodies(bodies, targetBody) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = bodies[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var body = _step.value;

                    this.drawBody(body, /* isTargeted */body === targetBody);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }
    }, {
        key: 'drawBody',
        value: function drawBody(body, isTargeted) {
            this.ctx.fillStyle = body.color;

            this.ctx.beginPath();
            this.ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2, true);

            this.ctx.fill();
            if (isTargeted) {
                this.ctx.strokeStyle = body.highlight;
                this.ctx.lineWidth = Math.round(body.radius / 8);
                this.ctx.stroke();
            }
        }
    }, {
        key: 'drawReticleLine',
        value: function drawReticleLine(from, to) {
            var grad = this.ctx.createLinearGradient(from.x, from.y, to.x, to.y);
            grad.addColorStop(0, 'rgba(31, 75, 130, 1)');
            grad.addColorStop(1, 'rgba(31, 75, 130, 0.1)');
            this.ctx.strokeStyle = grad;
            this.ctx.lineWidth = 6;
            this.ctx.lineCap = 'round';

            // Draw initial background line.
            this.ctx.beginPath();
            this.ctx.moveTo(from.x, from.y);
            this.ctx.lineTo(to.x, to.y);
            this.ctx.stroke();

            // Draw overlay line.
            this.ctx.strokeStyle = '#3477CA';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(from.x, from.y);
            this.ctx.lineTo(to.x, to.y);
            this.ctx.stroke();
        }
    }, {
        key: 'drawQuadTreeLines',
        value: function drawQuadTreeLines(treeNode) {
            // Setup line style and call the drawing routines
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 1;
            this.ctx.lineCap = 'butt';
            this.drawQuadTreeLine(treeNode);
        }
    }, {
        key: 'drawQuadTreeLine',
        value: function drawQuadTreeLine(treeNode) {
            if (!treeNode || !treeNode.children) {
                return;
            }

            // Draw x and y lines
            this.ctx.beginPath();
            this.ctx.moveTo(treeNode.midX, treeNode.startY);
            this.ctx.lineTo(treeNode.midX, treeNode.startY + treeNode.height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(treeNode.startX, treeNode.midY);
            this.ctx.lineTo(treeNode.startX + treeNode.width, treeNode.midY);
            this.ctx.stroke();

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = treeNode.children[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var childNode = _step2.value;

                    this.drawQuadTreeLine(childNode);
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        }
    }]);

    return GtGfx;
})(); // end graviton/gfx

exports.default = GtGfx;

},{}],6:[function(require,module,exports){
'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        * graviton/sim -- The gravitational simulator
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        */

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _body = require('./body');

var _body2 = _interopRequireDefault(_body);

var _tree = require('./tree');

var _tree2 = _interopRequireDefault(_tree);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/** Exert force on a body and update its next position. */
function exertForce(body, netFx, netFy, deltaT) {
    // Calculate accelerations
    var ax = netFx / body.mass;
    var ay = netFy / body.mass;

    // Calculate new velocities, normalized by the 'time' interval
    body.velX += deltaT * ax;
    body.velY += deltaT * ay;

    // Calculate new positions after timestep deltaT
    // Note that this doesn't update the current position itself in order to not affect other
    // force calculations
    body.nextX += deltaT * body.velX;
    body.nextY += deltaT * body.velY;
}

/** Calculate the force exerted between a body and an attractor based on gravity. */
function calculateForce(body, attractor, G) {
    // Calculate the change in position along the two dimensions
    var dx = attractor.x - body.x;
    var dy = attractor.y - body.y;

    // Obtain the distance between the objects (hypotenuse)
    var r = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

    // Calculate force using Newtonian gravity, separate out into x and y components
    var F = G * body.mass * attractor.mass / Math.pow(r, 2);
    var Fx = F * (dx / r);
    var Fy = F * (dy / r);
    return [Fx, Fy];
}

var GtBruteForceSim = (function () {
    /** G represents the gravitational constant. */

    function GtBruteForceSim(G) {
        _classCallCheck(this, GtBruteForceSim);

        this.G = G;
    }

    /** Calculate the new position of a body based on brute force mechanics. */

    _createClass(GtBruteForceSim, [{
        key: 'calculateNewPosition',
        value: function calculateNewPosition(body, attractors, unusedTreeRoot, deltaT) {
            var netFx = 0;
            var netFy = 0;

            // Iterate through all bodies and sum the forces exerted
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = attractors[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var attractor = _step.value;

                    if (body !== attractor) {
                        var _calculateForce = calculateForce(body, attractor, this.G);

                        var _calculateForce2 = _slicedToArray(_calculateForce, 2);

                        var Fx = _calculateForce2[0];
                        var Fy = _calculateForce2[1];

                        netFx += Fx;
                        netFy += Fy;
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            exertForce(body, netFx, netFy, deltaT);
        }
    }]);

    return GtBruteForceSim;
})();

var GtBarnesHutSim = (function () {
    /** G represents the gravitational constant. */

    function GtBarnesHutSim(G, theta) {
        _classCallCheck(this, GtBarnesHutSim);

        this.G = G;
        this.theta = theta;
        this.netFx = 0;
        this.netFy = 0;
    }

    /** Calculate the new position of a body based on brute force mechanics. */

    _createClass(GtBarnesHutSim, [{
        key: 'calculateNewPosition',
        value: function calculateNewPosition(body, attractors, treeRoot, deltaT) {
            this.netFx = 0;
            this.netFy = 0;

            // Iterate through all bodies in the tree and sum the forces exerted
            this.calculateForceFromTree(body, treeRoot);
            exertForce(body, this.netFx, this.netFy, deltaT);
        }
    }, {
        key: 'calculateForceFromTree',
        value: function calculateForceFromTree(body, treeNode) {
            // Handle empty nodes
            if (!treeNode) {
                return;
            }

            if (!treeNode.children) {
                // The node is external (it's an actual body)
                if (body !== treeNode) {
                    var _calculateForce3 = calculateForce(body, treeNode, this.G);

                    var _calculateForce4 = _slicedToArray(_calculateForce3, 2);

                    var Fx = _calculateForce4[0];
                    var Fy = _calculateForce4[1];

                    this.netFx += Fx;
                    this.netFy += Fy;
                }
                return;
            }

            // The node is internal

            // Calculate the effective quadrant size and distance from center-of-mass
            var s = (treeNode.width + treeNode.height) / 2;

            var dx = treeNode.x - body.x;
            var dy = treeNode.y - body.y;
            var d = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

            if (s / d < this.theta) {
                // Node is sufficiently far away

                var _calculateForce5 = calculateForce(body, treeNode, this.G);

                var _calculateForce6 = _slicedToArray(_calculateForce5, 2);

                var Fx = _calculateForce6[0];
                var Fy = _calculateForce6[1];

                this.netFx += Fx;
                this.netFy += Fy;
            } else {
                // Node is close; recurse
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = treeNode.children[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var childNode = _step2.value;

                        this.calculateForceFromTree(body, childNode);
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }
            }
        }
    }]);

    return GtBarnesHutSim;
})();

var GtSim = (function () {
    function GtSim(args) {
        _classCallCheck(this, GtSim);

        args = args || {};

        this.useBruteForce = false;

        this.G = args.G || 6.67384 * Math.pow(10, -11); // Gravitational constant
        this.multiplier = args.multiplier || 1500; // Timestep
        this.scatterLimitX = args.scatterLimitX || args.width * 2;
        this.scatterLimitY = args.scatterLimitY || args.height * 2;

        this.bodies = [];
        // Incorporate the scatter limit
        this.tree = new _tree2.default(
        /* width */this.scatterLimitX,
        /* height */this.scatterLimitY,
        /* startX */(args.width - this.scatterLimitX) / 2,
        /* startY */(args.height - this.scatterLimitY) / 2);
        this.time = 0;

        this.bruteForceSim = new GtBruteForceSim(this.G);
        this.barnesHutSim = new GtBarnesHutSim(this.G, /* theta */0.5);
        this.activeSim = this.useBruteForce ? this.bruteForceSim : this.barnesHutSim;
    }

    _createClass(GtSim, [{
        key: 'toggleStrategy',
        value: function toggleStrategy() {
            this.useBruteForce = !this.useBruteForce;
            this.activeSim = this.useBruteForce ? this.bruteForceSim : this.barnesHutSim;
        }

        /** Calculate a step of the simulation. */

    }, {
        key: 'step',
        value: function step(elapsed) {
            if (!this.useBruteForce) {
                this.resetTree();
            }

            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = this.bodies[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var body = _step3.value;

                    this.activeSim.calculateNewPosition(body, this.bodies, this.tree.root, elapsed * this.multiplier);
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }

            this.commitPositionUpdates();
            this.time += elapsed; // Increment runtime
            this.removeScattered();
        }

        /** Update positions of all bodies to be the next calculated position. */

    }, {
        key: 'commitPositionUpdates',
        value: function commitPositionUpdates() {
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = this.bodies[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var body = _step4.value;

                    body.x = body.nextX;
                    body.y = body.nextY;
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }
        }

        /** Scan through the list of bodies and remove any that have fallen out of the scatter limit. */

    }, {
        key: 'removeScattered',
        value: function removeScattered() {
            var i = 0;
            while (i < this.bodies.length) {
                var body = this.bodies[i];

                if (body.x > this.scatterLimit || body.x < -this.scatterLimit || body.y > this.scatterLimit || body.y < -this.scatterLimit) {
                    // Remove from body collection
                    // We don't need to reset the tree here because this is a runtime (not user-based)
                    // operation, and the tree is reset automatically on every step of the simulation.
                    this.bodies.splice(i, 1);
                } else {
                    i++;
                }
            }
        }

        /** Create and return a new body to the simulation. */

    }, {
        key: 'addNewBody',
        value: function addNewBody(args) {
            var body = new _body2.default(args);
            this.bodies.push(body);
            this.resetTree();
            return body;
        }

        /** Removing a target body from the simulation. */

    }, {
        key: 'removeBody',
        value: function removeBody(targetBody) {
            for (var i = 0; i < this.bodies.length; i++) {
                var body = this.bodies[i];
                if (body === targetBody) {
                    this.bodies.splice(i, 1);
                    this.resetTree();
                    break;
                }
            }
        }

        /** Lookup an (x, y) coordinate and return the body that is at that position. */

    }, {
        key: 'getBodyAt',
        value: function getBodyAt(x, y) {
            for (var i = this.bodies.length - 1; i >= 0; i--) {
                var body = this.bodies[i];
                var isMatch = Math.abs(x - body.x) <= body.radius && Math.abs(y - body.y) <= body.radius;
                if (isMatch) {
                    return body;
                }
            }
            return undefined;
        }

        /** Clear the simulation. */

    }, {
        key: 'clear',
        value: function clear() {
            this.bodies.length = 0; // Remove all bodies from collection
            this.resetTree();
        }

        /** Clear and reset the quadtree, adding all existing bodies back. */

    }, {
        key: 'resetTree',
        value: function resetTree() {
            this.tree.clear();
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = this.bodies[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var body = _step5.value;

                    this.tree.addBody(body);
                }
            } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5.return) {
                        _iterator5.return();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }
        }
    }]);

    return GtSim;
})(); // end graviton/sim

exports.default = GtSim;

},{"./body":3,"./tree":8}],7:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        * graviton/timer -- Sim timer and FPS limiter
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        */

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _env = require('../util/env');

var _env2 = _interopRequireDefault(_env);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GtTimer = (function () {
    function GtTimer(fn) {
        _classCallCheck(this, GtTimer);

        var fps = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

        this._fn = fn;
        this._fps = fps;
        this._isActive = false;
        this._isAnimation = fps === null;
        this._cancellationId = null;

        this._window = _env2.default.getWindow();
    }

    _createClass(GtTimer, [{
        key: 'start',
        value: function start() {
            if (!this._isActive) {
                if (this._isAnimation) {
                    this._beginAnimation();
                } else {
                    this._beginInterval();
                }
                this._isActive = true;
            }
        }
    }, {
        key: 'stop',
        value: function stop() {
            if (this._isActive) {
                if (this._isAnimation) {
                    this._window.cancelAnimationFrame(this._cancellationId);
                } else {
                    this._window.clearInterval(this._cancellationId);
                }
                this._isActive = false;
            }
        }
    }, {
        key: 'toggle',
        value: function toggle() {
            if (this._isActive) {
                this.stop();
            } else {
                this.start();
            }
        }
    }, {
        key: '_beginAnimation',
        value: function _beginAnimation() {
            var _this = this;

            var lastTimestamp = this._window.performance.now();
            var animator = function animator(timestamp) {
                _this._cancellationId = _this._window.requestAnimationFrame(animator);
                _this._fn(timestamp - lastTimestamp);
                lastTimestamp = timestamp;
            };

            // Delay initial execution until the next tick.
            this._cancellationId = this._window.requestAnimationFrame(animator);
        }
    }, {
        key: '_beginInterval',
        value: function _beginInterval() {
            var _this2 = this;

            // Compute the delay per tick, in milliseconds.
            var timeout = 1000 / this._fps | 0;

            var lastTimestamp = this._window.performance.now();
            this._cancellationId = this._window.setInterval(function () {
                var timestamp = _this2._window.performance.now();
                _this2._fn(timestamp - lastTimestamp);
                lastTimestamp = timestamp;
            }, timeout);
        }
    }, {
        key: 'active',
        get: function get() {
            return this._isActive;
        }
    }]);

    return GtTimer;
})(); // end graviton/timer

exports.default = GtTimer;

},{"../util/env":12}],8:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * graviton/tree -- The gravitational body tree structure
 */

var GtTreeNode = (function () {
    function GtTreeNode(width, height, startX, startY) {
        _classCallCheck(this, GtTreeNode);

        this.width = width;
        this.height = height;
        this.startX = startX;
        this.startY = startY;

        // Convenience center points.
        this.halfWidth = width / 2;
        this.halfHeight = height / 2;
        this.midX = this.startX + this.halfWidth;
        this.midY = this.startY + this.halfHeight;

        // Matches GtBody's properties.
        this.mass = 0;
        this.x = 0;
        this.y = 0;

        // [NW, NE, SW, SE]
        this.children = new Array(4);
    }

    /** Add a body to the tree, updating mass and centerpoint. */

    _createClass(GtTreeNode, [{
        key: "addBody",
        value: function addBody(body) {
            this.updateMass(body);
            var quadrant = this.getQuadrant(body.x, body.y);

            if (this.children[quadrant] instanceof GtTreeNode) {
                this.children[quadrant].addBody(body);
            } else if (!this.children[quadrant]) {
                this.children[quadrant] = body;
            } else {
                var existing = this.children[quadrant];
                var quadX = existing.x > this.midX ? this.midX : this.startX;
                var quadY = existing.y > this.midY ? this.midY : this.startY;
                var node = new GtTreeNode(this.halfWidth, this.halfHeight, quadX, quadY);

                node.addBody(existing);
                node.addBody(body);

                this.children[quadrant] = node;
            }
        }

        /** Update the center of mass based on the addition of a new body. */

    }, {
        key: "updateMass",
        value: function updateMass(body) {
            var newMass = this.mass + body.mass;
            var newX = (this.x * this.mass + body.x * body.mass) / newMass;
            var newY = (this.y * this.mass + body.y * body.mass) / newMass;
            this.mass = newMass;
            this.x = newX;
            this.y = newY;
        }

        /** Return the quadrant index for a given (x, y) pair. Assumes that it lies within bounds. */

    }, {
        key: "getQuadrant",
        value: function getQuadrant(x, y) {
            var xIndex = Number(x > this.midX);
            var yIndex = Number(y > this.midY) * 2;
            return xIndex + yIndex;
        }
    }]);

    return GtTreeNode;
})();

var GtTree = (function () {
    function GtTree(width, height) {
        var startX = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

        _classCallCheck(this, GtTree);

        var startY = arguments.length <= 3 || arguments[3] === undefined ? 0 : arguments[3];

        this.width = width;
        this.height = height;
        this.startX = startX;
        this.startY = startY;
        this.root = undefined;
    }

    _createClass(GtTree, [{
        key: "addBody",
        value: function addBody(body) {
            if (this.root instanceof GtTreeNode) {
                this.root.addBody(body);
            } else if (!this.root) {
                this.root = body;
            } else {
                var existing = this.root;
                this.root = new GtTreeNode(this.width, this.height, this.startX, this.startY);
                this.root.addBody(existing);
                this.root.addBody(body);
            }
        }
    }, {
        key: "clear",
        value: function clear() {
            this.root = undefined;
        }
    }]);

    return GtTree;
})(); // end graviton/tree

exports.default = GtTree;

},{}],9:[function(require,module,exports){
'use strict';

require('./vendor/jscolor');

var _vex = require('./vendor/vex');

var _vex2 = _interopRequireDefault(_vex);

require('./polyfills');

var _graviton = require('./graviton');

var _graviton2 = _interopRequireDefault(_graviton);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

window.onload = function () {
    // Set options for dependencies.
    _vex2.default.defaultOptions.className = 'vex-theme-wireframe';

    // Start the main graviton app.
    window.graviton = new _graviton2.default.app();
};

},{"./graviton":1,"./polyfills":10,"./vendor/jscolor":14,"./vendor/vex":15}],10:[function(require,module,exports){
"use strict";

window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
    return window.setTimeout(callback, 1000 / 60);
};

window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || function (timeoutId) {
    window.clearTimeout(timeoutId);
};

window.performance = window.performance || {};
window.performance.now = window.performance.now || window.performance.webkitNow || window.performance.mozNow || Date.now;

},{}],11:[function(require,module,exports){
'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * colors -- Color manipulation helpers
 */
exports.default = {
    brighten: function brighten(colorArray, percent) {
        var _colorArray = _slicedToArray(colorArray, 3);

        var r = _colorArray[0];
        var g = _colorArray[1];
        var b = _colorArray[2];

        r = Math.round(Math.min(Math.max(0, r + r * percent), 255));
        g = Math.round(Math.min(Math.max(0, g + g * percent), 255));
        b = Math.round(Math.min(Math.max(0, b + b * percent), 255));
        return [r, g, b];
    },
    fromHex: function fromHex(hex) {
        var h = hex.replace('#', '');
        if (h.length < 6) {
            h = h.replace(/(.)/g, '$1$1');
        }
        return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
    },
    toHex: function toHex(colorArray) {
        var _colorArray2 = _slicedToArray(colorArray, 3);

        var r = _colorArray2[0];
        var g = _colorArray2[1];
        var b = _colorArray2[2];

        return '#' + ('0' + r.toString(16)).substr(r < 16 ? 0 : 1) + ('0' + g.toString(16)).substr(g < 16 ? 0 : 1) + ('0' + b.toString(16)).substr(b < 16 ? 0 : 1);
    }
};

},{}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * env - Environment retrieval methods.
 */
exports.default = {
    getWindow: function getWindow() {
        return window;
    }
};

},{}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * random -- A collection of random generator functions
 */
exports.default = {
    /**
     * Generate a random number between the given start and end points
     */

    number: function number(from) {
        var to = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

        if (to === null) {
            to = from;
            from = 0;
        }

        return Math.random() * (to - from) + from;
    },

    /**
     * Generate a random integer between the given positions
     */
    integer: function integer() {
        return Math.floor(this.number.apply(this, arguments));
    },

    /**
     * Generate a random number, with a random sign, between the given
     * positions
     */
    directional: function directional() {
        var rand = this.number.apply(this, arguments);
        if (Math.random() > 0.5) {
            rand = -rand;
        }
        return rand;
    },

    /**
     * Generate a random hexadecimal color
     */
    color: function color() {
        return '#' + ('00000' + Math.floor(Math.random() * 0x1000000).toString(16)).substr(-6);
    }
};

},{}],14:[function(require,module,exports){
/**
 * jscolor - JavaScript Color Picker
 *
 * @link    http://jscolor.com
 * @license For open source use: GPLv3
 *          For commercial use: JSColor Commercial License
 * @author  Jan Odvarko
 * @version 2.0.4
 *
 * See usage examples at http://jscolor.com/examples/
 */

"use strict";

if (!window.jscolor) {
	window.jscolor = (function () {

		var jsc = {

			register: function register() {
				jsc.attachDOMReadyEvent(jsc.init);
				jsc.attachEvent(document, 'mousedown', jsc.onDocumentMouseDown);
				jsc.attachEvent(document, 'touchstart', jsc.onDocumentTouchStart);
				jsc.attachEvent(window, 'resize', jsc.onWindowResize);
			},

			init: function init() {
				if (jsc.jscolor.lookupClass) {
					jsc.jscolor.installByClassName(jsc.jscolor.lookupClass);
				}
			},

			tryInstallOnElements: function tryInstallOnElements(elms, className) {
				var matchClass = new RegExp('(^|\\s)(' + className + ')(\\s*(\\{[^}]*\\})|\\s|$)', 'i');

				for (var i = 0; i < elms.length; i += 1) {
					if (elms[i].type !== undefined && elms[i].type.toLowerCase() == 'color') {
						if (jsc.isColorAttrSupported) {
							// skip inputs of type 'color' if supported by the browser
							continue;
						}
					}
					var m;
					if (!elms[i].jscolor && elms[i].className && (m = elms[i].className.match(matchClass))) {
						var targetElm = elms[i];
						var optsStr = null;

						var dataOptions = jsc.getDataAttr(targetElm, 'jscolor');
						if (dataOptions !== null) {
							optsStr = dataOptions;
						} else if (m[4]) {
							optsStr = m[4];
						}

						var opts = {};
						if (optsStr) {
							try {
								opts = new Function('return (' + optsStr + ')')();
							} catch (eParseError) {
								jsc.warn('Error parsing jscolor options: ' + eParseError + ':\n' + optsStr);
							}
						}
						targetElm.jscolor = new jsc.jscolor(targetElm, opts);
					}
				}
			},

			isColorAttrSupported: (function () {
				var elm = document.createElement('input');
				if (elm.setAttribute) {
					elm.setAttribute('type', 'color');
					if (elm.type.toLowerCase() == 'color') {
						return true;
					}
				}
				return false;
			})(),

			isCanvasSupported: (function () {
				var elm = document.createElement('canvas');
				return !!(elm.getContext && elm.getContext('2d'));
			})(),

			fetchElement: function fetchElement(mixed) {
				return typeof mixed === 'string' ? document.getElementById(mixed) : mixed;
			},

			isElementType: function isElementType(elm, type) {
				return elm.nodeName.toLowerCase() === type.toLowerCase();
			},

			getDataAttr: function getDataAttr(el, name) {
				var attrName = 'data-' + name;
				var attrValue = el.getAttribute(attrName);
				if (attrValue !== null) {
					return attrValue;
				}
				return null;
			},

			attachEvent: function attachEvent(el, evnt, func) {
				if (el.addEventListener) {
					el.addEventListener(evnt, func, false);
				} else if (el.attachEvent) {
					el.attachEvent('on' + evnt, func);
				}
			},

			detachEvent: function detachEvent(el, evnt, func) {
				if (el.removeEventListener) {
					el.removeEventListener(evnt, func, false);
				} else if (el.detachEvent) {
					el.detachEvent('on' + evnt, func);
				}
			},

			_attachedGroupEvents: {},

			attachGroupEvent: function attachGroupEvent(groupName, el, evnt, func) {
				if (!jsc._attachedGroupEvents.hasOwnProperty(groupName)) {
					jsc._attachedGroupEvents[groupName] = [];
				}
				jsc._attachedGroupEvents[groupName].push([el, evnt, func]);
				jsc.attachEvent(el, evnt, func);
			},

			detachGroupEvents: function detachGroupEvents(groupName) {
				if (jsc._attachedGroupEvents.hasOwnProperty(groupName)) {
					for (var i = 0; i < jsc._attachedGroupEvents[groupName].length; i += 1) {
						var evt = jsc._attachedGroupEvents[groupName][i];
						jsc.detachEvent(evt[0], evt[1], evt[2]);
					}
					delete jsc._attachedGroupEvents[groupName];
				}
			},

			attachDOMReadyEvent: function attachDOMReadyEvent(func) {
				var fired = false;
				var fireOnce = function fireOnce() {
					if (!fired) {
						fired = true;
						func();
					}
				};

				if (document.readyState === 'complete') {
					setTimeout(fireOnce, 1); // async
					return;
				}

				if (document.addEventListener) {
					document.addEventListener('DOMContentLoaded', fireOnce, false);

					// Fallback
					window.addEventListener('load', fireOnce, false);
				} else if (document.attachEvent) {
					// IE
					document.attachEvent('onreadystatechange', function () {
						if (document.readyState === 'complete') {
							document.detachEvent('onreadystatechange', arguments.callee);
							fireOnce();
						}
					});

					// Fallback
					window.attachEvent('onload', fireOnce);

					// IE7/8
					if (document.documentElement.doScroll && window == window.top) {
						var tryScroll = function tryScroll() {
							if (!document.body) {
								return;
							}
							try {
								document.documentElement.doScroll('left');
								fireOnce();
							} catch (e) {
								setTimeout(tryScroll, 1);
							}
						};
						tryScroll();
					}
				}
			},

			warn: function warn(msg) {
				if (window.console && window.console.warn) {
					window.console.warn(msg);
				}
			},

			preventDefault: function preventDefault(e) {
				if (e.preventDefault) {
					e.preventDefault();
				}
				e.returnValue = false;
			},

			captureTarget: function captureTarget(target) {
				// IE
				if (target.setCapture) {
					jsc._capturedTarget = target;
					jsc._capturedTarget.setCapture();
				}
			},

			releaseTarget: function releaseTarget() {
				// IE
				if (jsc._capturedTarget) {
					jsc._capturedTarget.releaseCapture();
					jsc._capturedTarget = null;
				}
			},

			fireEvent: function fireEvent(el, evnt) {
				if (!el) {
					return;
				}
				if (document.createEvent) {
					var ev = document.createEvent('HTMLEvents');
					ev.initEvent(evnt, true, true);
					el.dispatchEvent(ev);
				} else if (document.createEventObject) {
					var ev = document.createEventObject();
					el.fireEvent('on' + evnt, ev);
				} else if (el['on' + evnt]) {
					// alternatively use the traditional event model
					el['on' + evnt]();
				}
			},

			classNameToList: function classNameToList(className) {
				return className.replace(/^\s+|\s+$/g, '').split(/\s+/);
			},

			// The className parameter (str) can only contain a single class name
			hasClass: function hasClass(elm, className) {
				if (!className) {
					return false;
				}
				return -1 != (' ' + elm.className.replace(/\s+/g, ' ') + ' ').indexOf(' ' + className + ' ');
			},

			// The className parameter (str) can contain multiple class names separated by whitespace
			setClass: function setClass(elm, className) {
				var classList = jsc.classNameToList(className);
				for (var i = 0; i < classList.length; i += 1) {
					if (!jsc.hasClass(elm, classList[i])) {
						elm.className += (elm.className ? ' ' : '') + classList[i];
					}
				}
			},

			// The className parameter (str) can contain multiple class names separated by whitespace
			unsetClass: function unsetClass(elm, className) {
				var classList = jsc.classNameToList(className);
				for (var i = 0; i < classList.length; i += 1) {
					var repl = new RegExp('^\\s*' + classList[i] + '\\s*|' + '\\s*' + classList[i] + '\\s*$|' + '\\s+' + classList[i] + '(\\s+)', 'g');
					elm.className = elm.className.replace(repl, '$1');
				}
			},

			getStyle: function getStyle(elm) {
				return window.getComputedStyle ? window.getComputedStyle(elm) : elm.currentStyle;
			},

			setStyle: (function () {
				var helper = document.createElement('div');
				var getSupportedProp = function getSupportedProp(names) {
					for (var i = 0; i < names.length; i += 1) {
						if (names[i] in helper.style) {
							return names[i];
						}
					}
				};
				var props = {
					borderRadius: getSupportedProp(['borderRadius', 'MozBorderRadius', 'webkitBorderRadius']),
					boxShadow: getSupportedProp(['boxShadow', 'MozBoxShadow', 'webkitBoxShadow'])
				};
				return function (elm, prop, value) {
					switch (prop.toLowerCase()) {
						case 'opacity':
							var alphaOpacity = Math.round(parseFloat(value) * 100);
							elm.style.opacity = value;
							elm.style.filter = 'alpha(opacity=' + alphaOpacity + ')';
							break;
						default:
							elm.style[props[prop]] = value;
							break;
					}
				};
			})(),

			setBorderRadius: function setBorderRadius(elm, value) {
				jsc.setStyle(elm, 'borderRadius', value || '0');
			},

			setBoxShadow: function setBoxShadow(elm, value) {
				jsc.setStyle(elm, 'boxShadow', value || 'none');
			},

			getElementPos: function getElementPos(e, relativeToViewport) {
				var x = 0,
				    y = 0;
				var rect = e.getBoundingClientRect();
				x = rect.left;
				y = rect.top;
				if (!relativeToViewport) {
					var viewPos = jsc.getViewPos();
					x += viewPos[0];
					y += viewPos[1];
				}
				return [x, y];
			},

			getElementSize: function getElementSize(e) {
				return [e.offsetWidth, e.offsetHeight];
			},

			// get pointer's X/Y coordinates relative to viewport
			getAbsPointerPos: function getAbsPointerPos(e) {
				if (!e) {
					e = window.event;
				}
				var x = 0,
				    y = 0;
				if (typeof e.changedTouches !== 'undefined' && e.changedTouches.length) {
					// touch devices
					x = e.changedTouches[0].clientX;
					y = e.changedTouches[0].clientY;
				} else if (typeof e.clientX === 'number') {
					x = e.clientX;
					y = e.clientY;
				}
				return { x: x, y: y };
			},

			// get pointer's X/Y coordinates relative to target element
			getRelPointerPos: function getRelPointerPos(e) {
				if (!e) {
					e = window.event;
				}
				var target = e.target || e.srcElement;
				var targetRect = target.getBoundingClientRect();

				var x = 0,
				    y = 0;

				var clientX = 0,
				    clientY = 0;
				if (typeof e.changedTouches !== 'undefined' && e.changedTouches.length) {
					// touch devices
					clientX = e.changedTouches[0].clientX;
					clientY = e.changedTouches[0].clientY;
				} else if (typeof e.clientX === 'number') {
					clientX = e.clientX;
					clientY = e.clientY;
				}

				x = clientX - targetRect.left;
				y = clientY - targetRect.top;
				return { x: x, y: y };
			},

			getViewPos: function getViewPos() {
				var doc = document.documentElement;
				return [(window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0), (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0)];
			},

			getViewSize: function getViewSize() {
				var doc = document.documentElement;
				return [window.innerWidth || doc.clientWidth, window.innerHeight || doc.clientHeight];
			},

			redrawPosition: function redrawPosition() {

				if (jsc.picker && jsc.picker.owner) {
					var thisObj = jsc.picker.owner;

					var tp, vp;

					if (thisObj.fixed) {
						// Fixed elements are positioned relative to viewport,
						// therefore we can ignore the scroll offset
						tp = jsc.getElementPos(thisObj.targetElement, true); // target pos
						vp = [0, 0]; // view pos
					} else {
							tp = jsc.getElementPos(thisObj.targetElement); // target pos
							vp = jsc.getViewPos(); // view pos
						}

					var ts = jsc.getElementSize(thisObj.targetElement); // target size
					var vs = jsc.getViewSize(); // view size
					var ps = jsc.getPickerOuterDims(thisObj); // picker size
					var a, b, c;
					switch (thisObj.position.toLowerCase()) {
						case 'left':
							a = 1;b = 0;c = -1;break;
						case 'right':
							a = 1;b = 0;c = 1;break;
						case 'top':
							a = 0;b = 1;c = -1;break;
						default:
							a = 0;b = 1;c = 1;break;
					}
					var l = (ts[b] + ps[b]) / 2;

					// compute picker position
					if (!thisObj.smartPosition) {
						var pp = [tp[a], tp[b] + ts[b] - l + l * c];
					} else {
						var pp = [-vp[a] + tp[a] + ps[a] > vs[a] ? -vp[a] + tp[a] + ts[a] / 2 > vs[a] / 2 && tp[a] + ts[a] - ps[a] >= 0 ? tp[a] + ts[a] - ps[a] : tp[a] : tp[a], -vp[b] + tp[b] + ts[b] + ps[b] - l + l * c > vs[b] ? -vp[b] + tp[b] + ts[b] / 2 > vs[b] / 2 && tp[b] + ts[b] - l - l * c >= 0 ? tp[b] + ts[b] - l - l * c : tp[b] + ts[b] - l + l * c : tp[b] + ts[b] - l + l * c >= 0 ? tp[b] + ts[b] - l + l * c : tp[b] + ts[b] - l - l * c];
					}

					var x = pp[a];
					var y = pp[b];
					var positionValue = thisObj.fixed ? 'fixed' : 'absolute';
					var contractShadow = (pp[0] + ps[0] > tp[0] || pp[0] < tp[0] + ts[0]) && pp[1] + ps[1] < tp[1] + ts[1];

					jsc._drawPosition(thisObj, x, y, positionValue, contractShadow);
				}
			},

			_drawPosition: function _drawPosition(thisObj, x, y, positionValue, contractShadow) {
				var vShadow = contractShadow ? 0 : thisObj.shadowBlur; // px

				jsc.picker.wrap.style.position = positionValue;
				jsc.picker.wrap.style.left = x + 'px';
				jsc.picker.wrap.style.top = y + 'px';

				jsc.setBoxShadow(jsc.picker.boxS, thisObj.shadow ? new jsc.BoxShadow(0, vShadow, thisObj.shadowBlur, 0, thisObj.shadowColor) : null);
			},

			getPickerDims: function getPickerDims(thisObj) {
				var displaySlider = !!jsc.getSliderComponent(thisObj);
				var dims = [2 * thisObj.insetWidth + 2 * thisObj.padding + thisObj.width + (displaySlider ? 2 * thisObj.insetWidth + jsc.getPadToSliderPadding(thisObj) + thisObj.sliderSize : 0), 2 * thisObj.insetWidth + 2 * thisObj.padding + thisObj.height + (thisObj.closable ? 2 * thisObj.insetWidth + thisObj.padding + thisObj.buttonHeight : 0)];
				return dims;
			},

			getPickerOuterDims: function getPickerOuterDims(thisObj) {
				var dims = jsc.getPickerDims(thisObj);
				return [dims[0] + 2 * thisObj.borderWidth, dims[1] + 2 * thisObj.borderWidth];
			},

			getPadToSliderPadding: function getPadToSliderPadding(thisObj) {
				return Math.max(thisObj.padding, 1.5 * (2 * thisObj.pointerBorderWidth + thisObj.pointerThickness));
			},

			getPadYComponent: function getPadYComponent(thisObj) {
				switch (thisObj.mode.charAt(1).toLowerCase()) {
					case 'v':
						return 'v';break;
				}
				return 's';
			},

			getSliderComponent: function getSliderComponent(thisObj) {
				if (thisObj.mode.length > 2) {
					switch (thisObj.mode.charAt(2).toLowerCase()) {
						case 's':
							return 's';break;
						case 'v':
							return 'v';break;
					}
				}
				return null;
			},

			onDocumentMouseDown: function onDocumentMouseDown(e) {
				if (!e) {
					e = window.event;
				}
				var target = e.target || e.srcElement;

				if (target._jscLinkedInstance) {
					if (target._jscLinkedInstance.showOnClick) {
						target._jscLinkedInstance.show();
					}
				} else if (target._jscControlName) {
					jsc.onControlPointerStart(e, target, target._jscControlName, 'mouse');
				} else {
					// Mouse is outside the picker controls -> hide the color picker!
					if (jsc.picker && jsc.picker.owner) {
						jsc.picker.owner.hide();
					}
				}
			},

			onDocumentTouchStart: function onDocumentTouchStart(e) {
				if (!e) {
					e = window.event;
				}
				var target = e.target || e.srcElement;

				if (target._jscLinkedInstance) {
					if (target._jscLinkedInstance.showOnClick) {
						target._jscLinkedInstance.show();
					}
				} else if (target._jscControlName) {
					jsc.onControlPointerStart(e, target, target._jscControlName, 'touch');
				} else {
					if (jsc.picker && jsc.picker.owner) {
						jsc.picker.owner.hide();
					}
				}
			},

			onWindowResize: function onWindowResize(e) {
				jsc.redrawPosition();
			},

			onParentScroll: function onParentScroll(e) {
				// hide the picker when one of the parent elements is scrolled
				if (jsc.picker && jsc.picker.owner) {
					jsc.picker.owner.hide();
				}
			},

			_pointerMoveEvent: {
				mouse: 'mousemove',
				touch: 'touchmove'
			},
			_pointerEndEvent: {
				mouse: 'mouseup',
				touch: 'touchend'
			},

			_pointerOrigin: null,
			_capturedTarget: null,

			onControlPointerStart: function onControlPointerStart(e, target, controlName, pointerType) {
				var thisObj = target._jscInstance;

				jsc.preventDefault(e);
				jsc.captureTarget(target);

				var registerDragEvents = function registerDragEvents(doc, offset) {
					jsc.attachGroupEvent('drag', doc, jsc._pointerMoveEvent[pointerType], jsc.onDocumentPointerMove(e, target, controlName, pointerType, offset));
					jsc.attachGroupEvent('drag', doc, jsc._pointerEndEvent[pointerType], jsc.onDocumentPointerEnd(e, target, controlName, pointerType));
				};

				registerDragEvents(document, [0, 0]);

				if (window.parent && window.frameElement) {
					var rect = window.frameElement.getBoundingClientRect();
					var ofs = [-rect.left, -rect.top];
					registerDragEvents(window.parent.window.document, ofs);
				}

				var abs = jsc.getAbsPointerPos(e);
				var rel = jsc.getRelPointerPos(e);
				jsc._pointerOrigin = {
					x: abs.x - rel.x,
					y: abs.y - rel.y
				};

				switch (controlName) {
					case 'pad':
						// if the slider is at the bottom, move it up
						switch (jsc.getSliderComponent(thisObj)) {
							case 's':
								if (thisObj.hsv[1] === 0) {
									thisObj.fromHSV(null, 100, null);
								};break;
							case 'v':
								if (thisObj.hsv[2] === 0) {
									thisObj.fromHSV(null, null, 100);
								};break;
						}
						jsc.setPad(thisObj, e, 0, 0);
						break;

					case 'sld':
						jsc.setSld(thisObj, e, 0);
						break;
				}

				jsc.dispatchFineChange(thisObj);
			},

			onDocumentPointerMove: function onDocumentPointerMove(e, target, controlName, pointerType, offset) {
				return function (e) {
					var thisObj = target._jscInstance;
					switch (controlName) {
						case 'pad':
							if (!e) {
								e = window.event;
							}
							jsc.setPad(thisObj, e, offset[0], offset[1]);
							jsc.dispatchFineChange(thisObj);
							break;

						case 'sld':
							if (!e) {
								e = window.event;
							}
							jsc.setSld(thisObj, e, offset[1]);
							jsc.dispatchFineChange(thisObj);
							break;
					}
				};
			},

			onDocumentPointerEnd: function onDocumentPointerEnd(e, target, controlName, pointerType) {
				return function (e) {
					var thisObj = target._jscInstance;
					jsc.detachGroupEvents('drag');
					jsc.releaseTarget();
					// Always dispatch changes after detaching outstanding mouse handlers,
					// in case some user interaction will occur in user's onchange callback
					// that would intrude with current mouse events
					jsc.dispatchChange(thisObj);
				};
			},

			dispatchChange: function dispatchChange(thisObj) {
				if (thisObj.valueElement) {
					if (jsc.isElementType(thisObj.valueElement, 'input')) {
						jsc.fireEvent(thisObj.valueElement, 'change');
					}
				}
			},

			dispatchFineChange: function dispatchFineChange(thisObj) {
				if (thisObj.onFineChange) {
					var callback;
					if (typeof thisObj.onFineChange === 'string') {
						callback = new Function(thisObj.onFineChange);
					} else {
						callback = thisObj.onFineChange;
					}
					callback.call(thisObj);
				}
			},

			setPad: function setPad(thisObj, e, ofsX, ofsY) {
				var pointerAbs = jsc.getAbsPointerPos(e);
				var x = ofsX + pointerAbs.x - jsc._pointerOrigin.x - thisObj.padding - thisObj.insetWidth;
				var y = ofsY + pointerAbs.y - jsc._pointerOrigin.y - thisObj.padding - thisObj.insetWidth;

				var xVal = x * (360 / (thisObj.width - 1));
				var yVal = 100 - y * (100 / (thisObj.height - 1));

				switch (jsc.getPadYComponent(thisObj)) {
					case 's':
						thisObj.fromHSV(xVal, yVal, null, jsc.leaveSld);break;
					case 'v':
						thisObj.fromHSV(xVal, null, yVal, jsc.leaveSld);break;
				}
			},

			setSld: function setSld(thisObj, e, ofsY) {
				var pointerAbs = jsc.getAbsPointerPos(e);
				var y = ofsY + pointerAbs.y - jsc._pointerOrigin.y - thisObj.padding - thisObj.insetWidth;

				var yVal = 100 - y * (100 / (thisObj.height - 1));

				switch (jsc.getSliderComponent(thisObj)) {
					case 's':
						thisObj.fromHSV(null, yVal, null, jsc.leavePad);break;
					case 'v':
						thisObj.fromHSV(null, null, yVal, jsc.leavePad);break;
				}
			},

			_vmlNS: 'jsc_vml_',
			_vmlCSS: 'jsc_vml_css_',
			_vmlReady: false,

			initVML: function initVML() {
				if (!jsc._vmlReady) {
					// init VML namespace
					var doc = document;
					if (!doc.namespaces[jsc._vmlNS]) {
						doc.namespaces.add(jsc._vmlNS, 'urn:schemas-microsoft-com:vml');
					}
					if (!doc.styleSheets[jsc._vmlCSS]) {
						var tags = ['shape', 'shapetype', 'group', 'background', 'path', 'formulas', 'handles', 'fill', 'stroke', 'shadow', 'textbox', 'textpath', 'imagedata', 'line', 'polyline', 'curve', 'rect', 'roundrect', 'oval', 'arc', 'image'];
						var ss = doc.createStyleSheet();
						ss.owningElement.id = jsc._vmlCSS;
						for (var i = 0; i < tags.length; i += 1) {
							ss.addRule(jsc._vmlNS + '\\:' + tags[i], 'behavior:url(#default#VML);');
						}
					}
					jsc._vmlReady = true;
				}
			},

			createPalette: function createPalette() {

				var paletteObj = {
					elm: null,
					draw: null
				};

				if (jsc.isCanvasSupported) {
					// Canvas implementation for modern browsers

					var canvas = document.createElement('canvas');
					var ctx = canvas.getContext('2d');

					var drawFunc = function drawFunc(width, height, type) {
						canvas.width = width;
						canvas.height = height;

						ctx.clearRect(0, 0, canvas.width, canvas.height);

						var hGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
						hGrad.addColorStop(0 / 6, '#F00');
						hGrad.addColorStop(1 / 6, '#FF0');
						hGrad.addColorStop(2 / 6, '#0F0');
						hGrad.addColorStop(3 / 6, '#0FF');
						hGrad.addColorStop(4 / 6, '#00F');
						hGrad.addColorStop(5 / 6, '#F0F');
						hGrad.addColorStop(6 / 6, '#F00');

						ctx.fillStyle = hGrad;
						ctx.fillRect(0, 0, canvas.width, canvas.height);

						var vGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
						switch (type.toLowerCase()) {
							case 's':
								vGrad.addColorStop(0, 'rgba(255,255,255,0)');
								vGrad.addColorStop(1, 'rgba(255,255,255,1)');
								break;
							case 'v':
								vGrad.addColorStop(0, 'rgba(0,0,0,0)');
								vGrad.addColorStop(1, 'rgba(0,0,0,1)');
								break;
						}
						ctx.fillStyle = vGrad;
						ctx.fillRect(0, 0, canvas.width, canvas.height);
					};

					paletteObj.elm = canvas;
					paletteObj.draw = drawFunc;
				} else {
					// VML fallback for IE 7 and 8

					jsc.initVML();

					var vmlContainer = document.createElement('div');
					vmlContainer.style.position = 'relative';
					vmlContainer.style.overflow = 'hidden';

					var hGrad = document.createElement(jsc._vmlNS + ':fill');
					hGrad.type = 'gradient';
					hGrad.method = 'linear';
					hGrad.angle = '90';
					hGrad.colors = '16.67% #F0F, 33.33% #00F, 50% #0FF, 66.67% #0F0, 83.33% #FF0';

					var hRect = document.createElement(jsc._vmlNS + ':rect');
					hRect.style.position = 'absolute';
					hRect.style.left = -1 + 'px';
					hRect.style.top = -1 + 'px';
					hRect.stroked = false;
					hRect.appendChild(hGrad);
					vmlContainer.appendChild(hRect);

					var vGrad = document.createElement(jsc._vmlNS + ':fill');
					vGrad.type = 'gradient';
					vGrad.method = 'linear';
					vGrad.angle = '180';
					vGrad.opacity = '0';

					var vRect = document.createElement(jsc._vmlNS + ':rect');
					vRect.style.position = 'absolute';
					vRect.style.left = -1 + 'px';
					vRect.style.top = -1 + 'px';
					vRect.stroked = false;
					vRect.appendChild(vGrad);
					vmlContainer.appendChild(vRect);

					var drawFunc = function drawFunc(width, height, type) {
						vmlContainer.style.width = width + 'px';
						vmlContainer.style.height = height + 'px';

						hRect.style.width = vRect.style.width = width + 1 + 'px';
						hRect.style.height = vRect.style.height = height + 1 + 'px';

						// Colors must be specified during every redraw, otherwise IE won't display
						// a full gradient during a subsequential redraw
						hGrad.color = '#F00';
						hGrad.color2 = '#F00';

						switch (type.toLowerCase()) {
							case 's':
								vGrad.color = vGrad.color2 = '#FFF';
								break;
							case 'v':
								vGrad.color = vGrad.color2 = '#000';
								break;
						}
					};

					paletteObj.elm = vmlContainer;
					paletteObj.draw = drawFunc;
				}

				return paletteObj;
			},

			createSliderGradient: function createSliderGradient() {

				var sliderObj = {
					elm: null,
					draw: null
				};

				if (jsc.isCanvasSupported) {
					// Canvas implementation for modern browsers

					var canvas = document.createElement('canvas');
					var ctx = canvas.getContext('2d');

					var drawFunc = function drawFunc(width, height, color1, color2) {
						canvas.width = width;
						canvas.height = height;

						ctx.clearRect(0, 0, canvas.width, canvas.height);

						var grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
						grad.addColorStop(0, color1);
						grad.addColorStop(1, color2);

						ctx.fillStyle = grad;
						ctx.fillRect(0, 0, canvas.width, canvas.height);
					};

					sliderObj.elm = canvas;
					sliderObj.draw = drawFunc;
				} else {
					// VML fallback for IE 7 and 8

					jsc.initVML();

					var vmlContainer = document.createElement('div');
					vmlContainer.style.position = 'relative';
					vmlContainer.style.overflow = 'hidden';

					var grad = document.createElement(jsc._vmlNS + ':fill');
					grad.type = 'gradient';
					grad.method = 'linear';
					grad.angle = '180';

					var rect = document.createElement(jsc._vmlNS + ':rect');
					rect.style.position = 'absolute';
					rect.style.left = -1 + 'px';
					rect.style.top = -1 + 'px';
					rect.stroked = false;
					rect.appendChild(grad);
					vmlContainer.appendChild(rect);

					var drawFunc = function drawFunc(width, height, color1, color2) {
						vmlContainer.style.width = width + 'px';
						vmlContainer.style.height = height + 'px';

						rect.style.width = width + 1 + 'px';
						rect.style.height = height + 1 + 'px';

						grad.color = color1;
						grad.color2 = color2;
					};

					sliderObj.elm = vmlContainer;
					sliderObj.draw = drawFunc;
				}

				return sliderObj;
			},

			leaveValue: 1 << 0,
			leaveStyle: 1 << 1,
			leavePad: 1 << 2,
			leaveSld: 1 << 3,

			BoxShadow: (function () {
				var BoxShadow = function BoxShadow(hShadow, vShadow, blur, spread, color, inset) {
					this.hShadow = hShadow;
					this.vShadow = vShadow;
					this.blur = blur;
					this.spread = spread;
					this.color = color;
					this.inset = !!inset;
				};

				BoxShadow.prototype.toString = function () {
					var vals = [Math.round(this.hShadow) + 'px', Math.round(this.vShadow) + 'px', Math.round(this.blur) + 'px', Math.round(this.spread) + 'px', this.color];
					if (this.inset) {
						vals.push('inset');
					}
					return vals.join(' ');
				};

				return BoxShadow;
			})(),

			//
			// Usage:
			// var myColor = new jscolor(<targetElement> [, <options>])
			//

			jscolor: function jscolor(targetElement, options) {

				// General options
				//
				this.value = null; // initial HEX color. To change it later, use methods fromString(), fromHSV() and fromRGB()
				this.valueElement = targetElement; // element that will be used to display and input the color code
				this.styleElement = targetElement; // element that will preview the picked color using CSS backgroundColor
				this.required = true; // whether the associated text <input> can be left empty
				this.refine = true; // whether to refine the entered color code (e.g. uppercase it and remove whitespace)
				this.hash = false; // whether to prefix the HEX color code with # symbol
				this.uppercase = true; // whether to uppercase the color code
				this.onFineChange = null; // called instantly every time the color changes (value can be either a function or a string with javascript code)
				this.activeClass = 'jscolor-active'; // class to be set to the target element when a picker window is open on it
				this.minS = 0; // min allowed saturation (0 - 100)
				this.maxS = 100; // max allowed saturation (0 - 100)
				this.minV = 0; // min allowed value (brightness) (0 - 100)
				this.maxV = 100; // max allowed value (brightness) (0 - 100)

				// Accessing the picked color
				//
				this.hsv = [0, 0, 100]; // read-only  [0-360, 0-100, 0-100]
				this.rgb = [255, 255, 255]; // read-only  [0-255, 0-255, 0-255]

				// Color Picker options
				//
				this.width = 181; // width of color palette (in px)
				this.height = 101; // height of color palette (in px)
				this.showOnClick = true; // whether to display the color picker when user clicks on its target element
				this.mode = 'HSV'; // HSV | HVS | HS | HV - layout of the color picker controls
				this.position = 'bottom'; // left | right | top | bottom - position relative to the target element
				this.smartPosition = true; // automatically change picker position when there is not enough space for it
				this.sliderSize = 16; // px
				this.crossSize = 8; // px
				this.closable = false; // whether to display the Close button
				this.closeText = 'Close';
				this.buttonColor = '#000000'; // CSS color
				this.buttonHeight = 18; // px
				this.padding = 12; // px
				this.backgroundColor = '#FFFFFF'; // CSS color
				this.borderWidth = 1; // px
				this.borderColor = '#BBBBBB'; // CSS color
				this.borderRadius = 8; // px
				this.insetWidth = 1; // px
				this.insetColor = '#BBBBBB'; // CSS color
				this.shadow = true; // whether to display shadow
				this.shadowBlur = 15; // px
				this.shadowColor = 'rgba(0,0,0,0.2)'; // CSS color
				this.pointerColor = '#4C4C4C'; // px
				this.pointerBorderColor = '#FFFFFF'; // px
				this.pointerBorderWidth = 1; // px
				this.pointerThickness = 2; // px
				this.zIndex = 1000;
				this.container = null; // where to append the color picker (BODY element by default)

				for (var opt in options) {
					if (options.hasOwnProperty(opt)) {
						this[opt] = options[opt];
					}
				}

				this.hide = function () {
					if (isPickerOwner()) {
						detachPicker();
					}
				};

				this.show = function () {
					drawPicker();
				};

				this.redraw = function () {
					if (isPickerOwner()) {
						drawPicker();
					}
				};

				this.importColor = function () {
					if (!this.valueElement) {
						this.exportColor();
					} else {
						if (jsc.isElementType(this.valueElement, 'input')) {
							if (!this.refine) {
								if (!this.fromString(this.valueElement.value, jsc.leaveValue)) {
									if (this.styleElement) {
										this.styleElement.style.backgroundImage = this.styleElement._jscOrigStyle.backgroundImage;
										this.styleElement.style.backgroundColor = this.styleElement._jscOrigStyle.backgroundColor;
										this.styleElement.style.color = this.styleElement._jscOrigStyle.color;
									}
									this.exportColor(jsc.leaveValue | jsc.leaveStyle);
								}
							} else if (!this.required && /^\s*$/.test(this.valueElement.value)) {
								this.valueElement.value = '';
								if (this.styleElement) {
									this.styleElement.style.backgroundImage = this.styleElement._jscOrigStyle.backgroundImage;
									this.styleElement.style.backgroundColor = this.styleElement._jscOrigStyle.backgroundColor;
									this.styleElement.style.color = this.styleElement._jscOrigStyle.color;
								}
								this.exportColor(jsc.leaveValue | jsc.leaveStyle);
							} else if (this.fromString(this.valueElement.value)) {
								// managed to import color successfully from the value -> OK, don't do anything
							} else {
									this.exportColor();
								}
						} else {
							// not an input element -> doesn't have any value
							this.exportColor();
						}
					}
				};

				this.exportColor = function (flags) {
					if (!(flags & jsc.leaveValue) && this.valueElement) {
						var value = this.toString();
						if (this.uppercase) {
							value = value.toUpperCase();
						}
						if (this.hash) {
							value = '#' + value;
						}

						if (jsc.isElementType(this.valueElement, 'input')) {
							this.valueElement.value = value;
						} else {
							this.valueElement.innerHTML = value;
						}
					}
					if (!(flags & jsc.leaveStyle)) {
						if (this.styleElement) {
							this.styleElement.style.backgroundImage = 'none';
							this.styleElement.style.backgroundColor = '#' + this.toString();
							this.styleElement.style.color = this.isLight() ? '#000' : '#FFF';
						}
					}
					if (!(flags & jsc.leavePad) && isPickerOwner()) {
						redrawPad();
					}
					if (!(flags & jsc.leaveSld) && isPickerOwner()) {
						redrawSld();
					}
				};

				// h: 0-360
				// s: 0-100
				// v: 0-100
				//
				this.fromHSV = function (h, s, v, flags) {
					// null = don't change
					if (h !== null) {
						if (isNaN(h)) {
							return false;
						}
						h = Math.max(0, Math.min(360, h));
					}
					if (s !== null) {
						if (isNaN(s)) {
							return false;
						}
						s = Math.max(0, Math.min(100, this.maxS, s), this.minS);
					}
					if (v !== null) {
						if (isNaN(v)) {
							return false;
						}
						v = Math.max(0, Math.min(100, this.maxV, v), this.minV);
					}

					this.rgb = HSV_RGB(h === null ? this.hsv[0] : this.hsv[0] = h, s === null ? this.hsv[1] : this.hsv[1] = s, v === null ? this.hsv[2] : this.hsv[2] = v);

					this.exportColor(flags);
				};

				// r: 0-255
				// g: 0-255
				// b: 0-255
				//
				this.fromRGB = function (r, g, b, flags) {
					// null = don't change
					if (r !== null) {
						if (isNaN(r)) {
							return false;
						}
						r = Math.max(0, Math.min(255, r));
					}
					if (g !== null) {
						if (isNaN(g)) {
							return false;
						}
						g = Math.max(0, Math.min(255, g));
					}
					if (b !== null) {
						if (isNaN(b)) {
							return false;
						}
						b = Math.max(0, Math.min(255, b));
					}

					var hsv = RGB_HSV(r === null ? this.rgb[0] : r, g === null ? this.rgb[1] : g, b === null ? this.rgb[2] : b);
					if (hsv[0] !== null) {
						this.hsv[0] = Math.max(0, Math.min(360, hsv[0]));
					}
					if (hsv[2] !== 0) {
						this.hsv[1] = hsv[1] === null ? null : Math.max(0, this.minS, Math.min(100, this.maxS, hsv[1]));
					}
					this.hsv[2] = hsv[2] === null ? null : Math.max(0, this.minV, Math.min(100, this.maxV, hsv[2]));

					// update RGB according to final HSV, as some values might be trimmed
					var rgb = HSV_RGB(this.hsv[0], this.hsv[1], this.hsv[2]);
					this.rgb[0] = rgb[0];
					this.rgb[1] = rgb[1];
					this.rgb[2] = rgb[2];

					this.exportColor(flags);
				};

				this.fromString = function (str, flags) {
					var m;
					if (m = str.match(/^\W*([0-9A-F]{3}([0-9A-F]{3})?)\W*$/i)) {
						// HEX notation
						//

						if (m[1].length === 6) {
							// 6-char notation
							this.fromRGB(parseInt(m[1].substr(0, 2), 16), parseInt(m[1].substr(2, 2), 16), parseInt(m[1].substr(4, 2), 16), flags);
						} else {
							// 3-char notation
							this.fromRGB(parseInt(m[1].charAt(0) + m[1].charAt(0), 16), parseInt(m[1].charAt(1) + m[1].charAt(1), 16), parseInt(m[1].charAt(2) + m[1].charAt(2), 16), flags);
						}
						return true;
					} else if (m = str.match(/^\W*rgba?\(([^)]*)\)\W*$/i)) {
						var params = m[1].split(',');
						var re = /^\s*(\d*)(\.\d+)?\s*$/;
						var mR, mG, mB;
						if (params.length >= 3 && (mR = params[0].match(re)) && (mG = params[1].match(re)) && (mB = params[2].match(re))) {
							var r = parseFloat((mR[1] || '0') + (mR[2] || ''));
							var g = parseFloat((mG[1] || '0') + (mG[2] || ''));
							var b = parseFloat((mB[1] || '0') + (mB[2] || ''));
							this.fromRGB(r, g, b, flags);
							return true;
						}
					}
					return false;
				};

				this.toString = function () {
					return (0x100 | Math.round(this.rgb[0])).toString(16).substr(1) + (0x100 | Math.round(this.rgb[1])).toString(16).substr(1) + (0x100 | Math.round(this.rgb[2])).toString(16).substr(1);
				};

				this.toHEXString = function () {
					return '#' + this.toString().toUpperCase();
				};

				this.toRGBString = function () {
					return 'rgb(' + Math.round(this.rgb[0]) + ',' + Math.round(this.rgb[1]) + ',' + Math.round(this.rgb[2]) + ')';
				};

				this.isLight = function () {
					return 0.213 * this.rgb[0] + 0.715 * this.rgb[1] + 0.072 * this.rgb[2] > 255 / 2;
				};

				this._processParentElementsInDOM = function () {
					if (this._linkedElementsProcessed) {
						return;
					}
					this._linkedElementsProcessed = true;

					var elm = this.targetElement;
					do {
						// If the target element or one of its parent nodes has fixed position,
						// then use fixed positioning instead
						//
						// Note: In Firefox, getComputedStyle returns null in a hidden iframe,
						// that's why we need to check if the returned style object is non-empty
						var currStyle = jsc.getStyle(elm);
						if (currStyle && currStyle.position.toLowerCase() === 'fixed') {
							this.fixed = true;
						}

						if (elm !== this.targetElement) {
							// Ensure to attach onParentScroll only once to each parent element
							// (multiple targetElements can share the same parent nodes)
							//
							// Note: It's not just offsetParents that can be scrollable,
							// that's why we loop through all parent nodes
							if (!elm._jscEventsAttached) {
								jsc.attachEvent(elm, 'scroll', jsc.onParentScroll);
								elm._jscEventsAttached = true;
							}
						}
					} while ((elm = elm.parentNode) && !jsc.isElementType(elm, 'body'));
				};

				// r: 0-255
				// g: 0-255
				// b: 0-255
				//
				// returns: [ 0-360, 0-100, 0-100 ]
				//
				function RGB_HSV(r, g, b) {
					r /= 255;
					g /= 255;
					b /= 255;
					var n = Math.min(Math.min(r, g), b);
					var v = Math.max(Math.max(r, g), b);
					var m = v - n;
					if (m === 0) {
						return [null, 0, 100 * v];
					}
					var h = r === n ? 3 + (b - g) / m : g === n ? 5 + (r - b) / m : 1 + (g - r) / m;
					return [60 * (h === 6 ? 0 : h), 100 * (m / v), 100 * v];
				}

				// h: 0-360
				// s: 0-100
				// v: 0-100
				//
				// returns: [ 0-255, 0-255, 0-255 ]
				//
				function HSV_RGB(h, s, v) {
					var u = 255 * (v / 100);

					if (h === null) {
						return [u, u, u];
					}

					h /= 60;
					s /= 100;

					var i = Math.floor(h);
					var f = i % 2 ? h - i : 1 - (h - i);
					var m = u * (1 - s);
					var n = u * (1 - s * f);
					switch (i) {
						case 6:
						case 0:
							return [u, n, m];
						case 1:
							return [n, u, m];
						case 2:
							return [m, u, n];
						case 3:
							return [m, n, u];
						case 4:
							return [n, m, u];
						case 5:
							return [u, m, n];
					}
				}

				function detachPicker() {
					jsc.unsetClass(THIS.targetElement, THIS.activeClass);
					jsc.picker.wrap.parentNode.removeChild(jsc.picker.wrap);
					delete jsc.picker.owner;
				}

				function drawPicker() {

					// At this point, when drawing the picker, we know what the parent elements are
					// and we can do all related DOM operations, such as registering events on them
					// or checking their positioning
					THIS._processParentElementsInDOM();

					if (!jsc.picker) {
						jsc.picker = {
							owner: null,
							wrap: document.createElement('div'),
							box: document.createElement('div'),
							boxS: document.createElement('div'), // shadow area
							boxB: document.createElement('div'), // border
							pad: document.createElement('div'),
							padB: document.createElement('div'), // border
							padM: document.createElement('div'), // mouse/touch area
							padPal: jsc.createPalette(),
							cross: document.createElement('div'),
							crossBY: document.createElement('div'), // border Y
							crossBX: document.createElement('div'), // border X
							crossLY: document.createElement('div'), // line Y
							crossLX: document.createElement('div'), // line X
							sld: document.createElement('div'),
							sldB: document.createElement('div'), // border
							sldM: document.createElement('div'), // mouse/touch area
							sldGrad: jsc.createSliderGradient(),
							sldPtrS: document.createElement('div'), // slider pointer spacer
							sldPtrIB: document.createElement('div'), // slider pointer inner border
							sldPtrMB: document.createElement('div'), // slider pointer middle border
							sldPtrOB: document.createElement('div'), // slider pointer outer border
							btn: document.createElement('div'),
							btnT: document.createElement('span') // text
						};

						jsc.picker.pad.appendChild(jsc.picker.padPal.elm);
						jsc.picker.padB.appendChild(jsc.picker.pad);
						jsc.picker.cross.appendChild(jsc.picker.crossBY);
						jsc.picker.cross.appendChild(jsc.picker.crossBX);
						jsc.picker.cross.appendChild(jsc.picker.crossLY);
						jsc.picker.cross.appendChild(jsc.picker.crossLX);
						jsc.picker.padB.appendChild(jsc.picker.cross);
						jsc.picker.box.appendChild(jsc.picker.padB);
						jsc.picker.box.appendChild(jsc.picker.padM);

						jsc.picker.sld.appendChild(jsc.picker.sldGrad.elm);
						jsc.picker.sldB.appendChild(jsc.picker.sld);
						jsc.picker.sldB.appendChild(jsc.picker.sldPtrOB);
						jsc.picker.sldPtrOB.appendChild(jsc.picker.sldPtrMB);
						jsc.picker.sldPtrMB.appendChild(jsc.picker.sldPtrIB);
						jsc.picker.sldPtrIB.appendChild(jsc.picker.sldPtrS);
						jsc.picker.box.appendChild(jsc.picker.sldB);
						jsc.picker.box.appendChild(jsc.picker.sldM);

						jsc.picker.btn.appendChild(jsc.picker.btnT);
						jsc.picker.box.appendChild(jsc.picker.btn);

						jsc.picker.boxB.appendChild(jsc.picker.box);
						jsc.picker.wrap.appendChild(jsc.picker.boxS);
						jsc.picker.wrap.appendChild(jsc.picker.boxB);
					}

					var p = jsc.picker;

					var displaySlider = !!jsc.getSliderComponent(THIS);
					var dims = jsc.getPickerDims(THIS);
					var crossOuterSize = 2 * THIS.pointerBorderWidth + THIS.pointerThickness + 2 * THIS.crossSize;
					var padToSliderPadding = jsc.getPadToSliderPadding(THIS);
					var borderRadius = Math.min(THIS.borderRadius, Math.round(THIS.padding * Math.PI)); // px
					var padCursor = 'crosshair';

					// wrap
					p.wrap.style.clear = 'both';
					p.wrap.style.width = dims[0] + 2 * THIS.borderWidth + 'px';
					p.wrap.style.height = dims[1] + 2 * THIS.borderWidth + 'px';
					p.wrap.style.zIndex = THIS.zIndex;

					// picker
					p.box.style.width = dims[0] + 'px';
					p.box.style.height = dims[1] + 'px';

					p.boxS.style.position = 'absolute';
					p.boxS.style.left = '0';
					p.boxS.style.top = '0';
					p.boxS.style.width = '100%';
					p.boxS.style.height = '100%';
					jsc.setBorderRadius(p.boxS, borderRadius + 'px');

					// picker border
					p.boxB.style.position = 'relative';
					p.boxB.style.border = THIS.borderWidth + 'px solid';
					p.boxB.style.borderColor = THIS.borderColor;
					p.boxB.style.background = THIS.backgroundColor;
					jsc.setBorderRadius(p.boxB, borderRadius + 'px');

					// IE hack:
					// If the element is transparent, IE will trigger the event on the elements under it,
					// e.g. on Canvas or on elements with border
					p.padM.style.background = p.sldM.style.background = '#FFF';
					jsc.setStyle(p.padM, 'opacity', '0');
					jsc.setStyle(p.sldM, 'opacity', '0');

					// pad
					p.pad.style.position = 'relative';
					p.pad.style.width = THIS.width + 'px';
					p.pad.style.height = THIS.height + 'px';

					// pad palettes (HSV and HVS)
					p.padPal.draw(THIS.width, THIS.height, jsc.getPadYComponent(THIS));

					// pad border
					p.padB.style.position = 'absolute';
					p.padB.style.left = THIS.padding + 'px';
					p.padB.style.top = THIS.padding + 'px';
					p.padB.style.border = THIS.insetWidth + 'px solid';
					p.padB.style.borderColor = THIS.insetColor;

					// pad mouse area
					p.padM._jscInstance = THIS;
					p.padM._jscControlName = 'pad';
					p.padM.style.position = 'absolute';
					p.padM.style.left = '0';
					p.padM.style.top = '0';
					p.padM.style.width = THIS.padding + 2 * THIS.insetWidth + THIS.width + padToSliderPadding / 2 + 'px';
					p.padM.style.height = dims[1] + 'px';
					p.padM.style.cursor = padCursor;

					// pad cross
					p.cross.style.position = 'absolute';
					p.cross.style.left = p.cross.style.top = '0';
					p.cross.style.width = p.cross.style.height = crossOuterSize + 'px';

					// pad cross border Y and X
					p.crossBY.style.position = p.crossBX.style.position = 'absolute';
					p.crossBY.style.background = p.crossBX.style.background = THIS.pointerBorderColor;
					p.crossBY.style.width = p.crossBX.style.height = 2 * THIS.pointerBorderWidth + THIS.pointerThickness + 'px';
					p.crossBY.style.height = p.crossBX.style.width = crossOuterSize + 'px';
					p.crossBY.style.left = p.crossBX.style.top = Math.floor(crossOuterSize / 2) - Math.floor(THIS.pointerThickness / 2) - THIS.pointerBorderWidth + 'px';
					p.crossBY.style.top = p.crossBX.style.left = '0';

					// pad cross line Y and X
					p.crossLY.style.position = p.crossLX.style.position = 'absolute';
					p.crossLY.style.background = p.crossLX.style.background = THIS.pointerColor;
					p.crossLY.style.height = p.crossLX.style.width = crossOuterSize - 2 * THIS.pointerBorderWidth + 'px';
					p.crossLY.style.width = p.crossLX.style.height = THIS.pointerThickness + 'px';
					p.crossLY.style.left = p.crossLX.style.top = Math.floor(crossOuterSize / 2) - Math.floor(THIS.pointerThickness / 2) + 'px';
					p.crossLY.style.top = p.crossLX.style.left = THIS.pointerBorderWidth + 'px';

					// slider
					p.sld.style.overflow = 'hidden';
					p.sld.style.width = THIS.sliderSize + 'px';
					p.sld.style.height = THIS.height + 'px';

					// slider gradient
					p.sldGrad.draw(THIS.sliderSize, THIS.height, '#000', '#000');

					// slider border
					p.sldB.style.display = displaySlider ? 'block' : 'none';
					p.sldB.style.position = 'absolute';
					p.sldB.style.right = THIS.padding + 'px';
					p.sldB.style.top = THIS.padding + 'px';
					p.sldB.style.border = THIS.insetWidth + 'px solid';
					p.sldB.style.borderColor = THIS.insetColor;

					// slider mouse area
					p.sldM._jscInstance = THIS;
					p.sldM._jscControlName = 'sld';
					p.sldM.style.display = displaySlider ? 'block' : 'none';
					p.sldM.style.position = 'absolute';
					p.sldM.style.right = '0';
					p.sldM.style.top = '0';
					p.sldM.style.width = THIS.sliderSize + padToSliderPadding / 2 + THIS.padding + 2 * THIS.insetWidth + 'px';
					p.sldM.style.height = dims[1] + 'px';
					p.sldM.style.cursor = 'default';

					// slider pointer inner and outer border
					p.sldPtrIB.style.border = p.sldPtrOB.style.border = THIS.pointerBorderWidth + 'px solid ' + THIS.pointerBorderColor;

					// slider pointer outer border
					p.sldPtrOB.style.position = 'absolute';
					p.sldPtrOB.style.left = -(2 * THIS.pointerBorderWidth + THIS.pointerThickness) + 'px';
					p.sldPtrOB.style.top = '0';

					// slider pointer middle border
					p.sldPtrMB.style.border = THIS.pointerThickness + 'px solid ' + THIS.pointerColor;

					// slider pointer spacer
					p.sldPtrS.style.width = THIS.sliderSize + 'px';
					p.sldPtrS.style.height = sliderPtrSpace + 'px';

					// the Close button
					function setBtnBorder() {
						var insetColors = THIS.insetColor.split(/\s+/);
						var outsetColor = insetColors.length < 2 ? insetColors[0] : insetColors[1] + ' ' + insetColors[0] + ' ' + insetColors[0] + ' ' + insetColors[1];
						p.btn.style.borderColor = outsetColor;
					}
					p.btn.style.display = THIS.closable ? 'block' : 'none';
					p.btn.style.position = 'absolute';
					p.btn.style.left = THIS.padding + 'px';
					p.btn.style.bottom = THIS.padding + 'px';
					p.btn.style.padding = '0 15px';
					p.btn.style.height = THIS.buttonHeight + 'px';
					p.btn.style.border = THIS.insetWidth + 'px solid';
					setBtnBorder();
					p.btn.style.color = THIS.buttonColor;
					p.btn.style.font = '12px sans-serif';
					p.btn.style.textAlign = 'center';
					try {
						p.btn.style.cursor = 'pointer';
					} catch (eOldIE) {
						p.btn.style.cursor = 'hand';
					}
					p.btn.onmousedown = function () {
						THIS.hide();
					};
					p.btnT.style.lineHeight = THIS.buttonHeight + 'px';
					p.btnT.innerHTML = '';
					p.btnT.appendChild(document.createTextNode(THIS.closeText));

					// place pointers
					redrawPad();
					redrawSld();

					// If we are changing the owner without first closing the picker,
					// make sure to first deal with the old owner
					if (jsc.picker.owner && jsc.picker.owner !== THIS) {
						jsc.unsetClass(jsc.picker.owner.targetElement, THIS.activeClass);
					}

					// Set the new picker owner
					jsc.picker.owner = THIS;

					// The redrawPosition() method needs picker.owner to be set, that's why we call it here,
					// after setting the owner
					if (jsc.isElementType(container, 'body')) {
						jsc.redrawPosition();
					} else {
						jsc._drawPosition(THIS, 0, 0, 'relative', false);
					}

					if (p.wrap.parentNode != container) {
						container.appendChild(p.wrap);
					}

					jsc.setClass(THIS.targetElement, THIS.activeClass);
				}

				function redrawPad() {
					// redraw the pad pointer
					switch (jsc.getPadYComponent(THIS)) {
						case 's':
							var yComponent = 1;break;
						case 'v':
							var yComponent = 2;break;
					}
					var x = Math.round(THIS.hsv[0] / 360 * (THIS.width - 1));
					var y = Math.round((1 - THIS.hsv[yComponent] / 100) * (THIS.height - 1));
					var crossOuterSize = 2 * THIS.pointerBorderWidth + THIS.pointerThickness + 2 * THIS.crossSize;
					var ofs = -Math.floor(crossOuterSize / 2);
					jsc.picker.cross.style.left = x + ofs + 'px';
					jsc.picker.cross.style.top = y + ofs + 'px';

					// redraw the slider
					switch (jsc.getSliderComponent(THIS)) {
						case 's':
							var rgb1 = HSV_RGB(THIS.hsv[0], 100, THIS.hsv[2]);
							var rgb2 = HSV_RGB(THIS.hsv[0], 0, THIS.hsv[2]);
							var color1 = 'rgb(' + Math.round(rgb1[0]) + ',' + Math.round(rgb1[1]) + ',' + Math.round(rgb1[2]) + ')';
							var color2 = 'rgb(' + Math.round(rgb2[0]) + ',' + Math.round(rgb2[1]) + ',' + Math.round(rgb2[2]) + ')';
							jsc.picker.sldGrad.draw(THIS.sliderSize, THIS.height, color1, color2);
							break;
						case 'v':
							var rgb = HSV_RGB(THIS.hsv[0], THIS.hsv[1], 100);
							var color1 = 'rgb(' + Math.round(rgb[0]) + ',' + Math.round(rgb[1]) + ',' + Math.round(rgb[2]) + ')';
							var color2 = '#000';
							jsc.picker.sldGrad.draw(THIS.sliderSize, THIS.height, color1, color2);
							break;
					}
				}

				function redrawSld() {
					var sldComponent = jsc.getSliderComponent(THIS);
					if (sldComponent) {
						// redraw the slider pointer
						switch (sldComponent) {
							case 's':
								var yComponent = 1;break;
							case 'v':
								var yComponent = 2;break;
						}
						var y = Math.round((1 - THIS.hsv[yComponent] / 100) * (THIS.height - 1));
						jsc.picker.sldPtrOB.style.top = y - (2 * THIS.pointerBorderWidth + THIS.pointerThickness) - Math.floor(sliderPtrSpace / 2) + 'px';
					}
				}

				function isPickerOwner() {
					return jsc.picker && jsc.picker.owner === THIS;
				}

				function blurValue() {
					THIS.importColor();
				}

				// Find the target element
				if (typeof targetElement === 'string') {
					var id = targetElement;
					var elm = document.getElementById(id);
					if (elm) {
						this.targetElement = elm;
					} else {
						jsc.warn('Could not find target element with ID \'' + id + '\'');
					}
				} else if (targetElement) {
					this.targetElement = targetElement;
				} else {
					jsc.warn('Invalid target element: \'' + targetElement + '\'');
				}

				if (this.targetElement._jscLinkedInstance) {
					jsc.warn('Cannot link jscolor twice to the same element. Skipping.');
					return;
				}
				this.targetElement._jscLinkedInstance = this;

				// Find the value element
				this.valueElement = jsc.fetchElement(this.valueElement);
				// Find the style element
				this.styleElement = jsc.fetchElement(this.styleElement);

				var THIS = this;
				var container = this.container ? jsc.fetchElement(this.container) : document.getElementsByTagName('body')[0];
				var sliderPtrSpace = 3; // px

				// For BUTTON elements it's important to stop them from sending the form when clicked
				// (e.g. in Safari)
				if (jsc.isElementType(this.targetElement, 'button')) {
					if (this.targetElement.onclick) {
						var origCallback = this.targetElement.onclick;
						this.targetElement.onclick = function (evt) {
							origCallback.call(this, evt);
							return false;
						};
					} else {
						this.targetElement.onclick = function () {
							return false;
						};
					}
				}

				/*
    var elm = this.targetElement;
    do {
    	// If the target element or one of its offsetParents has fixed position,
    	// then use fixed positioning instead
    	//
    	// Note: In Firefox, getComputedStyle returns null in a hidden iframe,
    	// that's why we need to check if the returned style object is non-empty
    	var currStyle = jsc.getStyle(elm);
    	if (currStyle && currStyle.position.toLowerCase() === 'fixed') {
    		this.fixed = true;
    	}
    		if (elm !== this.targetElement) {
    		// attach onParentScroll so that we can recompute the picker position
    		// when one of the offsetParents is scrolled
    		if (!elm._jscEventsAttached) {
    			jsc.attachEvent(elm, 'scroll', jsc.onParentScroll);
    			elm._jscEventsAttached = true;
    		}
    	}
    } while ((elm = elm.offsetParent) && !jsc.isElementType(elm, 'body'));
    */

				// valueElement
				if (this.valueElement) {
					if (jsc.isElementType(this.valueElement, 'input')) {
						var updateField = function updateField() {
							THIS.fromString(THIS.valueElement.value, jsc.leaveValue);
							jsc.dispatchFineChange(THIS);
						};
						jsc.attachEvent(this.valueElement, 'keyup', updateField);
						jsc.attachEvent(this.valueElement, 'input', updateField);
						jsc.attachEvent(this.valueElement, 'blur', blurValue);
						this.valueElement.setAttribute('autocomplete', 'off');
					}
				}

				// styleElement
				if (this.styleElement) {
					this.styleElement._jscOrigStyle = {
						backgroundImage: this.styleElement.style.backgroundImage,
						backgroundColor: this.styleElement.style.backgroundColor,
						color: this.styleElement.style.color
					};
				}

				if (this.value) {
					// Try to set the color from the .value option and if unsuccessful,
					// export the current color
					this.fromString(this.value) || this.exportColor();
				} else {
					this.importColor();
				}
			}

		};

		//================================
		// Public properties and methods
		//================================

		// By default, search for all elements with class="jscolor" and install a color picker on them.
		//
		// You can change what class name will be looked for by setting the property jscolor.lookupClass
		// anywhere in your HTML document. To completely disable the automatic lookup, set it to null.
		//
		jsc.jscolor.lookupClass = 'jscolor';

		jsc.jscolor.installByClassName = function (className) {
			var inputElms = document.getElementsByTagName('input');
			var buttonElms = document.getElementsByTagName('button');

			jsc.tryInstallOnElements(inputElms, className);
			jsc.tryInstallOnElements(buttonElms, className);
		};

		jsc.register();

		return jsc.jscolor;
	})();
}

},{}],15:[function(require,module,exports){
(function (global){
"use strict";

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

/*! vex.combined.js: vex 3.1.1, vex-dialog 1.0.7 */
!(function (a) {
  if ("object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) && "undefined" != typeof module) module.exports = a();else if ("function" == typeof define && define.amd) define([], a);else {
    var b;b = "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : this, b.vex = a();
  }
})(function () {
  var a;return (function b(a, c, d) {
    function e(g, h) {
      if (!c[g]) {
        if (!a[g]) {
          var i = "function" == typeof require && require;if (!h && i) return i(g, !0);if (f) return f(g, !0);var j = new Error("Cannot find module '" + g + "'");throw (j.code = "MODULE_NOT_FOUND", j);
        }var k = c[g] = { exports: {} };a[g][0].call(k.exports, function (b) {
          var c = a[g][1][b];return e(c ? c : b);
        }, k, k.exports, b, a, c, d);
      }return c[g].exports;
    }for (var f = "function" == typeof require && require, g = 0; g < d.length; g++) {
      e(d[g]);
    }return e;
  })({ 1: [function (a, b, c) {
      "document" in window.self && ("classList" in document.createElement("_") && (!document.createElementNS || "classList" in document.createElementNS("http://www.w3.org/2000/svg", "g")) ? !(function () {
        "use strict";
        var a = document.createElement("_");if ((a.classList.add("c1", "c2"), !a.classList.contains("c2"))) {
          var b = function b(a) {
            var b = DOMTokenList.prototype[a];DOMTokenList.prototype[a] = function (a) {
              var c,
                  d = arguments.length;for (c = 0; c < d; c++) {
                a = arguments[c], b.call(this, a);
              }
            };
          };b("add"), b("remove");
        }if ((a.classList.toggle("c3", !1), a.classList.contains("c3"))) {
          var c = DOMTokenList.prototype.toggle;DOMTokenList.prototype.toggle = function (a, b) {
            return 1 in arguments && !this.contains(a) == !b ? b : c.call(this, a);
          };
        }a = null;
      })() : !(function (a) {
        "use strict";
        if ("Element" in a) {
          var b = "classList",
              c = "prototype",
              d = a.Element[c],
              e = Object,
              f = String[c].trim || function () {
            return this.replace(/^\s+|\s+$/g, "");
          },
              g = Array[c].indexOf || function (a) {
            for (var b = 0, c = this.length; b < c; b++) {
              if (b in this && this[b] === a) return b;
            }return -1;
          },
              h = function h(a, b) {
            this.name = a, this.code = DOMException[a], this.message = b;
          },
              i = function i(a, b) {
            if ("" === b) throw new h("SYNTAX_ERR", "An invalid or illegal string was specified");if (/\s/.test(b)) throw new h("INVALID_CHARACTER_ERR", "String contains an invalid character");return g.call(a, b);
          },
              j = function j(a) {
            for (var b = f.call(a.getAttribute("class") || ""), c = b ? b.split(/\s+/) : [], d = 0, e = c.length; d < e; d++) {
              this.push(c[d]);
            }this._updateClassName = function () {
              a.setAttribute("class", this.toString());
            };
          },
              k = j[c] = [],
              l = function l() {
            return new j(this);
          };if ((h[c] = Error[c], k.item = function (a) {
            return this[a] || null;
          }, k.contains = function (a) {
            return a += "", i(this, a) !== -1;
          }, k.add = function () {
            var a,
                b = arguments,
                c = 0,
                d = b.length,
                e = !1;do {
              a = b[c] + "", i(this, a) === -1 && (this.push(a), e = !0);
            } while (++c < d);e && this._updateClassName();
          }, k.remove = function () {
            var a,
                b,
                c = arguments,
                d = 0,
                e = c.length,
                f = !1;do {
              for (a = c[d] + "", b = i(this, a); b !== -1;) {
                this.splice(b, 1), f = !0, b = i(this, a);
              }
            } while (++d < e);f && this._updateClassName();
          }, k.toggle = function (a, b) {
            a += "";var c = this.contains(a),
                d = c ? b !== !0 && "remove" : b !== !1 && "add";return d && this[d](a), b === !0 || b === !1 ? b : !c;
          }, k.toString = function () {
            return this.join(" ");
          }, e.defineProperty)) {
            var m = { get: l, enumerable: !0, configurable: !0 };try {
              e.defineProperty(d, b, m);
            } catch (n) {
              n.number === -2146823252 && (m.enumerable = !1, e.defineProperty(d, b, m));
            }
          } else e[c].__defineGetter__ && d.__defineGetter__(b, l);
        }
      })(window.self));
    }, {}], 2: [function (a, b, c) {
      function d(a, b) {
        if ("string" != typeof a) throw new TypeError("String expected");b || (b = document);var c = /<([\w:]+)/.exec(a);if (!c) return b.createTextNode(a);a = a.replace(/^\s+|\s+$/g, "");var d = c[1];if ("body" == d) {
          var e = b.createElement("html");return e.innerHTML = a, e.removeChild(e.lastChild);
        }var f = g[d] || g._default,
            h = f[0],
            i = f[1],
            j = f[2],
            e = b.createElement("div");for (e.innerHTML = i + a + j; h--;) {
          e = e.lastChild;
        }if (e.firstChild == e.lastChild) return e.removeChild(e.firstChild);for (var k = b.createDocumentFragment(); e.firstChild;) {
          k.appendChild(e.removeChild(e.firstChild));
        }return k;
      }b.exports = d;var e,
          f = !1;"undefined" != typeof document && (e = document.createElement("div"), e.innerHTML = '  <link/><table></table><a href="/a">a</a><input type="checkbox"/>', f = !e.getElementsByTagName("link").length, e = void 0);var g = { legend: [1, "<fieldset>", "</fieldset>"], tr: [2, "<table><tbody>", "</tbody></table>"], col: [2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"], _default: f ? [1, "X<div>", "</div>"] : [0, "", ""] };g.td = g.th = [3, "<table><tbody><tr>", "</tr></tbody></table>"], g.option = g.optgroup = [1, '<select multiple="multiple">', "</select>"], g.thead = g.tbody = g.colgroup = g.caption = g.tfoot = [1, "<table>", "</table>"], g.polyline = g.ellipse = g.polygon = g.circle = g.text = g.line = g.path = g.rect = g.g = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">', "</svg>"];
    }, {}], 3: [function (a, b, c) {
      "use strict";
      function d(a, b) {
        if (void 0 === a || null === a) throw new TypeError("Cannot convert first argument to object");for (var c = Object(a), d = 1; d < arguments.length; d++) {
          var e = arguments[d];if (void 0 !== e && null !== e) for (var f = Object.keys(Object(e)), g = 0, h = f.length; g < h; g++) {
            var i = f[g],
                j = Object.getOwnPropertyDescriptor(e, i);void 0 !== j && j.enumerable && (c[i] = e[i]);
          }
        }return c;
      }function e() {
        Object.assign || Object.defineProperty(Object, "assign", { enumerable: !1, configurable: !0, writable: !0, value: d });
      }b.exports = { assign: d, polyfill: e };
    }, {}], 4: [function (a, b, c) {
      function d(a, b) {
        "object" != (typeof b === "undefined" ? "undefined" : _typeof(b)) ? b = { hash: !!b } : void 0 === b.hash && (b.hash = !0);for (var c = b.hash ? {} : "", d = b.serializer || (b.hash ? g : h), e = a && a.elements ? a.elements : [], f = Object.create(null), k = 0; k < e.length; ++k) {
          var l = e[k];if ((b.disabled || !l.disabled) && l.name && j.test(l.nodeName) && !i.test(l.type)) {
            var m = l.name,
                n = l.value;if (("checkbox" !== l.type && "radio" !== l.type || l.checked || (n = void 0), b.empty)) {
              if (("checkbox" !== l.type || l.checked || (n = ""), "radio" === l.type && (f[l.name] || l.checked ? l.checked && (f[l.name] = !0) : f[l.name] = !1), !n && "radio" == l.type)) continue;
            } else if (!n) continue;if ("select-multiple" !== l.type) c = d(c, m, n);else {
              n = [];for (var o = l.options, p = !1, q = 0; q < o.length; ++q) {
                var r = o[q],
                    s = b.empty && !r.value,
                    t = r.value || s;r.selected && t && (p = !0, c = b.hash && "[]" !== m.slice(m.length - 2) ? d(c, m + "[]", r.value) : d(c, m, r.value));
              }!p && b.empty && (c = d(c, m, ""));
            }
          }
        }if (b.empty) for (var m in f) {
          f[m] || (c = d(c, m, ""));
        }return c;
      }function e(a) {
        var b = [],
            c = /^([^\[\]]*)/,
            d = new RegExp(k),
            e = c.exec(a);for (e[1] && b.push(e[1]); null !== (e = d.exec(a));) {
          b.push(e[1]);
        }return b;
      }function f(a, b, c) {
        if (0 === b.length) return a = c;var d = b.shift(),
            e = d.match(/^\[(.+?)\]$/);if ("[]" === d) return a = a || [], Array.isArray(a) ? a.push(f(null, b, c)) : (a._values = a._values || [], a._values.push(f(null, b, c))), a;if (e) {
          var g = e[1],
              h = +g;isNaN(h) ? (a = a || {}, a[g] = f(a[g], b, c)) : (a = a || [], a[h] = f(a[h], b, c));
        } else a[d] = f(a[d], b, c);return a;
      }function g(a, b, c) {
        var d = b.match(k);if (d) {
          var g = e(b);f(a, g, c);
        } else {
          var h = a[b];h ? (Array.isArray(h) || (a[b] = [h]), a[b].push(c)) : a[b] = c;
        }return a;
      }function h(a, b, c) {
        return c = c.replace(/(\r)?\n/g, "\r\n"), c = encodeURIComponent(c), c = c.replace(/%20/g, "+"), a + (a ? "&" : "") + encodeURIComponent(b) + "=" + c;
      }var i = /^(?:submit|button|image|reset|file)$/i,
          j = /^(?:input|select|textarea|keygen)/i,
          k = /(\[[^\[\]]*\])/g;b.exports = d;
    }, {}], 5: [function (b, c, d) {
      (function (e) {
        !(function (b) {
          if ("object" == (typeof d === "undefined" ? "undefined" : _typeof(d)) && "undefined" != typeof c) c.exports = b();else if ("function" == typeof a && a.amd) a([], b);else {
            var f;f = "undefined" != typeof window ? window : "undefined" != typeof e ? e : "undefined" != typeof self ? self : this, f.vexDialog = b();
          }
        })(function () {
          return (function a(c, d, e) {
            function f(h, i) {
              if (!d[h]) {
                if (!c[h]) {
                  var j = "function" == typeof b && b;if (!i && j) return j(h, !0);if (g) return g(h, !0);var k = new Error("Cannot find module '" + h + "'");throw (k.code = "MODULE_NOT_FOUND", k);
                }var l = d[h] = { exports: {} };c[h][0].call(l.exports, function (a) {
                  var b = c[h][1][a];return f(b ? b : a);
                }, l, l.exports, a, c, d, e);
              }return d[h].exports;
            }for (var g = "function" == typeof b && b, h = 0; h < e.length; h++) {
              f(e[h]);
            }return f;
          })({ 1: [function (a, b, c) {
              function d(a, b) {
                if ("string" != typeof a) throw new TypeError("String expected");b || (b = document);var c = /<([\w:]+)/.exec(a);if (!c) return b.createTextNode(a);a = a.replace(/^\s+|\s+$/g, "");var d = c[1];if ("body" == d) {
                  var e = b.createElement("html");return e.innerHTML = a, e.removeChild(e.lastChild);
                }var f = g[d] || g._default,
                    h = f[0],
                    i = f[1],
                    j = f[2],
                    e = b.createElement("div");for (e.innerHTML = i + a + j; h--;) {
                  e = e.lastChild;
                }if (e.firstChild == e.lastChild) return e.removeChild(e.firstChild);for (var k = b.createDocumentFragment(); e.firstChild;) {
                  k.appendChild(e.removeChild(e.firstChild));
                }return k;
              }b.exports = d;var e,
                  f = !1;"undefined" != typeof document && (e = document.createElement("div"), e.innerHTML = '  <link/><table></table><a href="/a">a</a><input type="checkbox"/>', f = !e.getElementsByTagName("link").length, e = void 0);var g = { legend: [1, "<fieldset>", "</fieldset>"], tr: [2, "<table><tbody>", "</tbody></table>"], col: [2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"], _default: f ? [1, "X<div>", "</div>"] : [0, "", ""] };g.td = g.th = [3, "<table><tbody><tr>", "</tr></tbody></table>"], g.option = g.optgroup = [1, '<select multiple="multiple">', "</select>"], g.thead = g.tbody = g.colgroup = g.caption = g.tfoot = [1, "<table>", "</table>"], g.polyline = g.ellipse = g.polygon = g.circle = g.text = g.line = g.path = g.rect = g.g = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">', "</svg>"];
            }, {}], 2: [function (a, b, c) {
              function d(a, b) {
                "object" != (typeof b === "undefined" ? "undefined" : _typeof(b)) ? b = { hash: !!b } : void 0 === b.hash && (b.hash = !0);for (var c = b.hash ? {} : "", d = b.serializer || (b.hash ? g : h), e = a && a.elements ? a.elements : [], f = Object.create(null), k = 0; k < e.length; ++k) {
                  var l = e[k];if ((b.disabled || !l.disabled) && l.name && j.test(l.nodeName) && !i.test(l.type)) {
                    var m = l.name,
                        n = l.value;if (("checkbox" !== l.type && "radio" !== l.type || l.checked || (n = void 0), b.empty)) {
                      if (("checkbox" !== l.type || l.checked || (n = ""), "radio" === l.type && (f[l.name] || l.checked ? l.checked && (f[l.name] = !0) : f[l.name] = !1), !n && "radio" == l.type)) continue;
                    } else if (!n) continue;if ("select-multiple" !== l.type) c = d(c, m, n);else {
                      n = [];for (var o = l.options, p = !1, q = 0; q < o.length; ++q) {
                        var r = o[q],
                            s = b.empty && !r.value,
                            t = r.value || s;r.selected && t && (p = !0, c = b.hash && "[]" !== m.slice(m.length - 2) ? d(c, m + "[]", r.value) : d(c, m, r.value));
                      }!p && b.empty && (c = d(c, m, ""));
                    }
                  }
                }if (b.empty) for (var m in f) {
                  f[m] || (c = d(c, m, ""));
                }return c;
              }function e(a) {
                var b = [],
                    c = /^([^\[\]]*)/,
                    d = new RegExp(k),
                    e = c.exec(a);for (e[1] && b.push(e[1]); null !== (e = d.exec(a));) {
                  b.push(e[1]);
                }return b;
              }function f(a, b, c) {
                if (0 === b.length) return a = c;var d = b.shift(),
                    e = d.match(/^\[(.+?)\]$/);if ("[]" === d) return a = a || [], Array.isArray(a) ? a.push(f(null, b, c)) : (a._values = a._values || [], a._values.push(f(null, b, c))), a;if (e) {
                  var g = e[1],
                      h = +g;isNaN(h) ? (a = a || {}, a[g] = f(a[g], b, c)) : (a = a || [], a[h] = f(a[h], b, c));
                } else a[d] = f(a[d], b, c);return a;
              }function g(a, b, c) {
                var d = b.match(k);if (d) {
                  var g = e(b);f(a, g, c);
                } else {
                  var h = a[b];h ? (Array.isArray(h) || (a[b] = [h]), a[b].push(c)) : a[b] = c;
                }return a;
              }function h(a, b, c) {
                return c = c.replace(/(\r)?\n/g, "\r\n"), c = encodeURIComponent(c), c = c.replace(/%20/g, "+"), a + (a ? "&" : "") + encodeURIComponent(b) + "=" + c;
              }var i = /^(?:submit|button|image|reset|file)$/i,
                  j = /^(?:input|select|textarea|keygen)/i,
                  k = /(\[[^\[\]]*\])/g;b.exports = d;
            }, {}], 3: [function (a, b, c) {
              var d = a("domify"),
                  e = a("form-serialize"),
                  f = function f(a) {
                var b = document.createElement("form");b.classList.add("vex-dialog-form");var c = document.createElement("div");c.classList.add("vex-dialog-message"), c.appendChild(a.message instanceof window.Node ? a.message : d(a.message));var e = document.createElement("div");return e.classList.add("vex-dialog-input"), e.appendChild(a.input instanceof window.Node ? a.input : d(a.input)), b.appendChild(c), b.appendChild(e), b;
              },
                  g = function g(a) {
                var b = document.createElement("div");b.classList.add("vex-dialog-buttons");for (var c = 0; c < a.length; c++) {
                  var d = a[c],
                      e = document.createElement("button");e.type = d.type, e.textContent = d.text, e.className = d.className, e.classList.add("vex-dialog-button"), 0 === c ? e.classList.add("vex-first") : c === a.length - 1 && e.classList.add("vex-last"), (function (a) {
                    e.addEventListener("click", (function (b) {
                      a.click && a.click.call(this, b);
                    }).bind(this));
                  }).bind(this)(d), b.appendChild(e);
                }return b;
              },
                  h = function h(a) {
                var b = { name: "dialog", open: function open(b) {
                    var c = Object.assign({}, this.defaultOptions, b);c.unsafeMessage && !c.message ? c.message = c.unsafeMessage : c.message && (c.message = a._escapeHtml(c.message));var d = c.unsafeContent = f(c),
                        e = a.open(c),
                        h = c.beforeClose && c.beforeClose.bind(e);if ((e.options.beforeClose = (function () {
                      var a = !h || h();return a && c.callback(this.value || !1), a;
                    }).bind(e), d.appendChild(g.call(e, c.buttons)), e.form = d, d.addEventListener("submit", c.onSubmit.bind(e)), c.focusFirstInput)) {
                      var i = e.contentEl.querySelector("button, input, select, textarea");i && i.focus();
                    }return e;
                  }, alert: function alert(a) {
                    return "string" == typeof a && (a = { message: a }), a = Object.assign({}, this.defaultOptions, this.defaultAlertOptions, a), this.open(a);
                  }, confirm: function confirm(a) {
                    if ("object" != (typeof a === "undefined" ? "undefined" : _typeof(a)) || "function" != typeof a.callback) throw new Error("dialog.confirm(options) requires options.callback.");return a = Object.assign({}, this.defaultOptions, this.defaultConfirmOptions, a), this.open(a);
                  }, prompt: function prompt(b) {
                    if ("object" != (typeof b === "undefined" ? "undefined" : _typeof(b)) || "function" != typeof b.callback) throw new Error("dialog.prompt(options) requires options.callback.");var c = Object.assign({}, this.defaultOptions, this.defaultPromptOptions),
                        d = { unsafeMessage: '<label for="vex">' + a._escapeHtml(b.label || c.label) + "</label>", input: '<input name="vex" type="text" class="vex-dialog-prompt-input" placeholder="' + a._escapeHtml(b.placeholder || c.placeholder) + '" value="' + a._escapeHtml(b.value || c.value) + '" />' };b = Object.assign(c, d, b);var e = b.callback;return b.callback = function (a) {
                      if ("object" == (typeof a === "undefined" ? "undefined" : _typeof(a))) {
                        var b = Object.keys(a);a = b.length ? a[b[0]] : "";
                      }e(a);
                    }, this.open(b);
                  } };return b.buttons = { YES: { text: "OK", type: "submit", className: "vex-dialog-button-primary", click: function click() {
                      this.value = !0;
                    } }, NO: { text: "Cancel", type: "button", className: "vex-dialog-button-secondary", click: function click() {
                      this.value = !1, this.close();
                    } } }, b.defaultOptions = { callback: function callback() {}, afterOpen: function afterOpen() {}, message: "", input: "", buttons: [b.buttons.YES, b.buttons.NO], showCloseButton: !1, onSubmit: function onSubmit(a) {
                    return a.preventDefault(), this.options.input && (this.value = e(this.form, { hash: !0 })), this.close();
                  }, focusFirstInput: !0 }, b.defaultAlertOptions = { buttons: [b.buttons.YES] }, b.defaultPromptOptions = { label: "Prompt:", placeholder: "", value: "" }, b.defaultConfirmOptions = {}, b;
              };b.exports = h;
            }, { domify: 1, "form-serialize": 2 }] }, {}, [3])(3);
        });
      }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
    }, { domify: 2, "form-serialize": 4 }], 6: [function (a, b, c) {
      var d = a("./vex");d.registerPlugin(a("vex-dialog")), b.exports = d;
    }, { "./vex": 7, "vex-dialog": 5 }], 7: [function (a, b, c) {
      a("classlist-polyfill"), a("es6-object-assign").polyfill();var d = a("domify"),
          e = function e(a) {
        if ("undefined" != typeof a) {
          var b = document.createElement("div");return b.appendChild(document.createTextNode(a)), b.innerHTML;
        }return "";
      },
          f = function f(a, b) {
        if ("string" == typeof b && 0 !== b.length) for (var c = b.split(" "), d = 0; d < c.length; d++) {
          var e = c[d];e.length && a.classList.add(e);
        }
      },
          g = (function () {
        var a = document.createElement("div"),
            b = { WebkitAnimation: "webkitAnimationEnd", MozAnimation: "animationend", OAnimation: "oanimationend", msAnimation: "MSAnimationEnd", animation: "animationend" };for (var c in b) {
          if (void 0 !== a.style[c]) return b[c];
        }return !1;
      })(),
          h = { vex: "vex", content: "vex-content", overlay: "vex-overlay", close: "vex-close", closing: "vex-closing", open: "vex-open" },
          i = {},
          j = 1,
          k = !1,
          l = { open: function open(a) {
          var b = function b(a) {
            console.warn('The "' + a + '" property is deprecated in vex 3. Use CSS classes and the appropriate "ClassName" options, instead.'), console.warn("See http://github.hubspot.com/vex/api/advanced/#options");
          };a.css && b("css"), a.overlayCSS && b("overlayCSS"), a.contentCSS && b("contentCSS"), a.closeCSS && b("closeCSS");var c = {};c.id = j++, i[c.id] = c, c.isOpen = !0, c.close = function () {
            function a(a) {
              return "none" !== d.getPropertyValue(a + "animation-name") && "0s" !== d.getPropertyValue(a + "animation-duration");
            }if (!this.isOpen) return !0;var b = this.options;if (k && !b.escapeButtonCloses) return !1;var c = (function () {
              return !b.beforeClose || b.beforeClose.call(this);
            }).bind(this)();if (c === !1) return !1;this.isOpen = !1;var d = window.getComputedStyle(this.contentEl),
                e = a("") || a("-webkit-") || a("-moz-") || a("-o-"),
                f = (function j() {
              this.rootEl.parentNode && (this.rootEl.removeEventListener(g, j), delete i[this.id], this.rootEl.parentNode.removeChild(this.rootEl), b.afterClose && b.afterClose.call(this), 0 === Object.keys(i).length && document.body.classList.remove(h.open));
            }).bind(this);return g && e ? (this.rootEl.addEventListener(g, f), this.rootEl.classList.add(h.closing)) : f(), !0;
          }, "string" == typeof a && (a = { content: a }), a.unsafeContent && !a.content ? a.content = a.unsafeContent : a.content && (a.content = e(a.content));var m = c.options = Object.assign({}, l.defaultOptions, a),
              n = c.rootEl = document.createElement("div");n.classList.add(h.vex), f(n, m.className);var o = c.overlayEl = document.createElement("div");o.classList.add(h.overlay), f(o, m.overlayClassName), m.overlayClosesOnClick && o.addEventListener("click", function (a) {
            a.target === o && c.close();
          }), n.appendChild(o);var p = c.contentEl = document.createElement("div");if ((p.classList.add(h.content), f(p, m.contentClassName), p.appendChild(m.content instanceof window.Node ? m.content : d(m.content)), n.appendChild(p), m.showCloseButton)) {
            var q = c.closeEl = document.createElement("div");q.classList.add(h.close), f(q, m.closeClassName), q.addEventListener("click", c.close.bind(c)), p.appendChild(q);
          }return document.querySelector(m.appendLocation).appendChild(n), m.afterOpen && m.afterOpen.call(c), document.body.classList.add(h.open), c;
        }, close: function close(a) {
          var b;if (a.id) b = a.id;else {
            if ("string" != typeof a) throw new TypeError("close requires a vex object or id string");b = a;
          }return !!i[b] && i[b].close();
        }, closeTop: function closeTop() {
          var a = Object.keys(i);return !!a.length && i[a[a.length - 1]].close();
        }, closeAll: function closeAll() {
          for (var a in i) {
            this.close(a);
          }return !0;
        }, getAll: function getAll() {
          return i;
        }, getById: function getById(a) {
          return i[a];
        } };window.addEventListener("keyup", function (a) {
        27 === a.keyCode && (k = !0, l.closeTop(), k = !1);
      }), window.addEventListener("popstate", function () {
        l.defaultOptions.closeAllOnPopState && l.closeAll();
      }), l.defaultOptions = { content: "", showCloseButton: !0, escapeButtonCloses: !0, overlayClosesOnClick: !0, appendLocation: "body", className: "", overlayClassName: "", contentClassName: "", closeClassName: "", closeAllOnPopState: !0 }, Object.defineProperty(l, "_escapeHtml", { configurable: !1, enumerable: !1, writable: !1, value: e }), l.registerPlugin = function (a, b) {
        var c = a(l),
            d = b || c.name;if (l[d]) throw new Error("Plugin " + b + " is already registered.");l[d] = c;
      }, b.exports = l;
    }, { "classlist-polyfill": 1, domify: 2, "es6-object-assign": 3 }] }, {}, [6])(6);
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}]},{},[9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZ3Jhdml0b24uanMiLCJzcmMvZ3Jhdml0b24vYXBwLmpzIiwic3JjL2dyYXZpdG9uL2JvZHkuanMiLCJzcmMvZ3Jhdml0b24vZXZlbnRzLmpzIiwic3JjL2dyYXZpdG9uL2dmeC5qcyIsInNyYy9ncmF2aXRvbi9zaW0uanMiLCJzcmMvZ3Jhdml0b24vdGltZXIuanMiLCJzcmMvZ3Jhdml0b24vdHJlZS5qcyIsInNyYy9tYWluLmpzIiwic3JjL3BvbHlmaWxscy5qcyIsInNyYy91dGlsL2NvbG9ycy5qcyIsInNyYy91dGlsL2Vudi5qcyIsInNyYy91dGlsL3JhbmRvbS5qcyIsInNyYy92ZW5kb3IvanNjb2xvci5qcyIsInNyYy92ZW5kb3IvdmV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7O2tCQ2FlLEVBQUUsR0FBRyxlQUFPLEVBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUNEUixLQUFLO0FBQ3RCLGFBRGlCLEtBQUssR0FDQzs4QkFETixLQUFLOztZQUNWLElBQUkseURBQUcsRUFBRTs7QUFDakIsWUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7O0FBRWpCLFlBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ2xCLFlBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDOztBQUVqQixZQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztBQUN0QixZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQzs7QUFFckIsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7QUFDbkIsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7QUFDaEIsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7O0FBRWhCLFlBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0FBQ3JCLFlBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO0FBQzNCLFlBQUksQ0FBQyxXQUFXLEdBQUcsRUFBQyxRQUFRLEVBQUUsRUFBRSxFQUFDLENBQUM7QUFDbEMsWUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7QUFDNUIsWUFBSSxDQUFDLG9CQUFvQixHQUFHLEtBQUssQ0FBQztBQUNsQyxZQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQzs7QUFFeEIsWUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxJQUFJLE1BQU0sQ0FBQyxVQUFVLENBQUM7QUFDbEUsWUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxXQUFXLENBQUM7QUFDdEUsWUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLGVBQWUsSUFBSSxTQUFTOzs7QUFBQyxBQUdqRSxZQUFJLENBQUMsSUFBSSxHQUFHLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSyxRQUFRLEdBQ3JDLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUNsQyxJQUFJLENBQUMsSUFBSSxDQUFDOztBQUVkLFlBQUksT0FBTyxJQUFJLENBQUMsSUFBSSxLQUFLLFdBQVcsRUFBRTtBQUNsQyxnQkFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFDakQsRUFBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUMsQ0FBQyxDQUFDO0FBQ3pELGdCQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7U0FDekI7O0FBRUQsWUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLElBQUksQ0FBQyxRQUFRLEtBQUssUUFBUSxHQUM3QyxRQUFRLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FDdEMsSUFBSSxDQUFDLFFBQVEsQ0FBQzs7QUFFbEIsWUFBSSxPQUFPLElBQUksQ0FBQyxRQUFRLEtBQUssV0FBVyxFQUFFO0FBQ3RDLGdCQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztBQUN4QixnQkFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1NBQ2pDOztBQUVELFlBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN0RSxZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDekUsWUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDM0YsWUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDeEYsWUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ2xGLFlBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUMvRSxZQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7O0FBRXRFLFlBQUksQ0FBQyxXQUFXLEdBQUcsT0FBTyxJQUFJLENBQUMsV0FBVyxLQUFLLFFBQVEsR0FDbkQsUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQ3pDLElBQUksQ0FBQyxXQUFXLENBQUM7O0FBRXJCLFlBQUksT0FBTyxJQUFJLENBQUMsV0FBVyxLQUFLLFdBQVcsRUFBRTtBQUN6QyxnQkFBSSxDQUFDLFdBQVcsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ25ELGdCQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsR0FBRyxpQkFBaUIsQ0FBQztBQUMvQyxvQkFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQzVDLGdCQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7U0FDdkM7QUFDRCxZQUFJLENBQUMsT0FBTyxHQUFHLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7QUFDekMsbUJBQU8sRUFBRSxDQUFDO0FBQ1Ysa0JBQU0sRUFBRSxLQUFLO0FBQ2IsdUJBQVcsRUFBRSxDQUFDO0FBQ2QsMkJBQWUsRUFBRSxhQUFhO0FBQzlCLHNCQUFVLEVBQUUsU0FBUztBQUNyQix3QkFBWSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztTQUM1QyxDQUFDLENBQUM7O0FBRUgsWUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLElBQUksQ0FBQyxRQUFRLEtBQUssUUFBUSxHQUM3QyxRQUFRLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FDdEMsSUFBSSxDQUFDLFFBQVEsQ0FBQzs7QUFFbEIsWUFBSSxPQUFPLElBQUksQ0FBQyxRQUFRLEtBQUssV0FBVyxFQUFFO0FBQ3RDLGdCQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDL0MsZ0JBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBQztBQUNyQyxvQkFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3pDLGdCQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7U0FDakM7OztBQUFBLEFBR0QsWUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3RCLFlBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztLQUNyQjs7Ozs7QUFBQTtpQkF0RmdCLEtBQUs7OytCQTJGZjs7O0FBR0gsZ0JBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVMsS0FBSyxFQUFFO0FBQ3ZDLG9CQUFJLE1BQU0sWUFBQSxDQUFDOztBQUVYLHdCQUFRLEtBQUssQ0FBQyxJQUFJO0FBQ2QseUJBQUssUUFyR1EsVUFBVSxDQXFHUCxTQUFTO0FBQ3JCLDRCQUFJLEtBQUssQ0FBQyxNQUFNLHNCQUF1QixDQUFDLEVBQUU7O0FBRXRDLGdDQUFJLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRTtBQUM5QyxvQ0FBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3JDLG9DQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDOzZCQUNqQzt5QkFDSixNQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sdUJBQXdCLENBQUMsRUFBRTs7QUFFOUMsZ0NBQUksSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFO0FBQzlDLG9DQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ3RELG9DQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ3JELG9DQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQy9DLG9DQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDOzZCQUN2Qjt5QkFDSixNQUFNOzs7O0FBR0gsZ0NBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUU7O0FBRTVCLG9DQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7O0FBRWhDLG9DQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7QUFDakIsd0NBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7aUNBQzNDLE1BQU07QUFDSCx3Q0FBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUM7QUFDeEMseUNBQUMsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDbkIseUNBQUMsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7cUNBQ3RCLENBQUMsQ0FBQztpQ0FDTjs7QUFFRCxvQ0FBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQy9DLG9DQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7NkJBQ2xELE1BQU07O0FBRUgsb0NBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDOzZCQUM5Qjt5QkFDSjtBQUNELDhCQUFNOztBQUFBLEFBRVYseUJBQUssUUE3SVEsVUFBVSxDQTZJUCxPQUFPO0FBQ25CLDRCQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFO0FBQzFCLGdDQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7O0FBRWpDLGdDQUFJLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQzs7QUFFakMsZ0NBQUksSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQSxHQUFJLFNBQVMsQ0FBQztBQUNuRCxnQ0FBSSxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFBLEdBQUksU0FBUzs7OztBQUFDLEFBSW5ELGdDQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQztBQUMzRCxnQ0FBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUM7eUJBQzlEO0FBQ0QsNEJBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0RCw4QkFBTTs7QUFBQSxBQUVWLHlCQUFLLFFBOUpRLFVBQVUsQ0E4SlAsU0FBUztBQUNyQiw0QkFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQy9DLDRCQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFDL0MsNEJBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxFQUFFO0FBQzFELGdDQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7eUJBQ3pEO0FBQ0QsOEJBQU07O0FBQUEsQUFFVix5QkFBSyxRQXRLUSxVQUFVLENBc0tQLFVBQVU7QUFDdEIsNEJBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtBQUNqQixnQ0FBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3hDLGdDQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7eUJBQ3pCO0FBQ0QsOEJBQU07O0FBQUEsQUFFVix5QkFBSyxRQTdLUSxVQUFVLENBNktQLE9BQU87QUFDbkIsZ0NBQVEsS0FBSyxDQUFDLE9BQU87QUFDakIsaUNBQUssUUEvS1YsUUFBUSxDQStLVyxPQUFPO0FBQ2pCLG9DQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7QUFDakIsc0NBQU07O0FBQUEsQUFFVixpQ0FBSyxRQW5MVixRQUFRLENBbUxXLEdBQUc7O0FBRWIsb0NBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDakIsb0NBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDakIsb0NBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDckIsc0NBQU0sR0FBRyxLQUFLLENBQUM7QUFDZixzQ0FBTTs7QUFBQSxBQUVWLGlDQUFLLFFBM0xWLFFBQVEsQ0EyTFcsR0FBRztBQUNiLG9DQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7QUFDcEIsc0NBQU07O0FBQUEsQUFFVixpQ0FBSyxRQS9MVixRQUFRLENBK0xXLEdBQUc7O0FBRWIsb0NBQUksQ0FBQyxjQUFjLENBQUMsRUFBRSxFQUFFLEVBQUMsWUFBWSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7QUFDOUMsc0NBQU07O0FBQUEsQUFFVixpQ0FBSyxRQXBNVixRQUFRLENBb01XLEdBQUc7QUFDYixvQ0FBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUM7QUFDaEIscUNBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUM7QUFDckQsd0NBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUM7QUFDaEIsd0NBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsU0FBUztpQ0FDM0MsQ0FBQyxDQUFDO0FBQ0gsb0NBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDO0FBQ2hCLHFDQUFDLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDO0FBQ3ZELHdDQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxRQUFRO0FBQ3ZCLHdDQUFJLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLFNBQVM7aUNBQ3ZDLENBQUMsQ0FBQztBQUNILHNDQUFNOztBQUFBLEFBRVYsaUNBQUssUUFqTlYsUUFBUSxDQWlOVyxjQUFjO0FBQ3hCLG9DQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDaEIsc0NBQU07QUFBQSx5QkFDYjtBQUNELDhCQUFNOztBQUFBLEFBRVYseUJBQUssUUF2Tm9CLFlBQVksQ0F1Tm5CLE9BQU87QUFDckIsNEJBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUNqQiw4QkFBTTs7QUFBQSxBQUVWLHlCQUFLLFFBM05vQixZQUFZLENBMk5uQixRQUFRO0FBQ3RCLDRCQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7QUFDakIsOEJBQU07O0FBQUEsQUFFVix5QkFBSyxRQS9Ob0IsWUFBWSxDQStObkIsY0FBYztBQUM1Qiw0QkFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7QUFDM0IsOEJBQU07O0FBQUEsQUFFVix5QkFBSyxRQW5Pb0IsWUFBWSxDQW1PbkIsYUFBYTtBQUMzQiw0QkFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7QUFDM0IsOEJBQU07O0FBQUEsQUFFVix5QkFBSyxRQXZPb0IsWUFBWSxDQXVPbkIsV0FBVztBQUN6Qiw0QkFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO0FBQ3BCLDhCQUFNOztBQUFBLEFBRVYseUJBQUssUUEzT29CLFlBQVksQ0EyT25CLFVBQVU7QUFDeEIsNEJBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUNwQiw4QkFBTTs7QUFBQSxBQUVWLHlCQUFLLFFBL09vQixZQUFZLENBK09uQixPQUFPO0FBQ3JCLDRCQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDaEIsOEJBQU07QUFBQSxpQkFDYjs7QUFFRCx1QkFBTyxNQUFNLENBQUM7YUFDakIsRUFBRSxJQUFJLENBQUM7OztBQUFDLEFBR1QsZ0JBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUNqQjs7O3lDQUVnQjs7QUFFYixnQkFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxxQkFBYSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekQsZ0JBQUksQ0FBQyxHQUFHLEdBQUcsa0JBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2hDLGdCQUFJLENBQUMsR0FBRyxHQUFHLGtCQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNuQzs7O3FDQUVZOztBQUVULGdCQUFJLENBQUMsU0FBUyxHQUFHLG9CQUFZLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDbkQsZ0JBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDdkIsZ0JBQUksQ0FBQyxRQUFRLEdBQUcsb0JBQVksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztTQUNqRTs7O29DQUVXO0FBQ1IsZ0JBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUU7QUFDdEIsb0JBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFDaEMsb0JBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7YUFDeEMsTUFBTTtBQUNILG9CQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO0FBQ3BDLG9CQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2FBQ3BDO0FBQ0QsZ0JBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDMUI7Ozt1Q0FFYztBQUNYLGdCQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7QUFDZCxvQkFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUNwQyxvQkFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQzthQUMxQyxNQUFNO0FBQ0gsb0JBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7QUFDeEMsb0JBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7YUFDdEM7QUFDRCxnQkFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7U0FDaEM7Ozs4Q0FFcUI7QUFDbEIsZ0JBQUksSUFBSSxDQUFDLGFBQWEsRUFBRTtBQUNwQixvQkFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUN2QyxvQkFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQzthQUM3QyxNQUFNO0FBQ0gsb0JBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7QUFDM0Msb0JBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7YUFDekM7QUFDRCxnQkFBSSxDQUFDLGFBQWEsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUM7U0FDNUM7OzttQ0FFVTs7O0FBQ1AsZ0JBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtBQUNqQix1QkFBTzthQUNWO0FBQ0QsZ0JBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0FBQ3ZCLDBCQUFJLElBQUksQ0FBQztBQUNMLDZCQUFhLGlvQ0F3QlI7QUFDTCwwQkFBVSxFQUFFLHNCQUFNO0FBQ2QsMEJBQUssVUFBVSxHQUFHLEtBQUssQ0FBQztpQkFDM0I7YUFDSixDQUFDLENBQUM7U0FDTjs7O2lDQUVRO0FBQ0wsZ0JBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFO0FBQ2Ysb0JBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7YUFDcEI7QUFDRCxnQkFBSSxJQUFJLENBQUMsYUFBYSxFQUFFO0FBQ3BCLG9CQUFJLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ2xEO0FBQ0QsZ0JBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUU7QUFDMUIsb0JBQUksQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDOUU7QUFDRCxnQkFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQ3pEOzs7cUNBRVksS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUU7O0FBRS9CLGdCQUFJLENBQUMsS0FBSyxFQUFFO0FBQ1IscUJBQUssR0FBRyxFQUFFLENBQUM7YUFDZDs7QUFFRCxnQkFBSSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUU3QyxnQkFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsZ0JBQWdCLENBQUM7QUFDdkMsZ0JBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztBQUN4QixnQkFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0FBQzFCLGdCQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO0FBQ2xDLGdCQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDLFVBQVUsSUFBSSxNQUFNLENBQUM7QUFDeEQsZ0JBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUMsV0FBVyxJQUFJLE1BQU0sQ0FBQztBQUMxRCxnQkFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQyxlQUFlLElBQUksU0FBUyxDQUFDOztBQUVyRSxvQkFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3hDOzs7MkNBRWtCO0FBQ2YsZ0JBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMvQyxnQkFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsU0FBUyxDQUFDO0FBQy9CLGdCQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsR0FBRyxVQUFVLENBQUM7QUFDOUIsZ0JBQUksQ0FBQyxRQUFRLENBQUMsU0FBUywyZ0NBc0JsQixDQUFDOztBQUVOLG9CQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDNUM7Ozt1Q0FFYyxHQUFHLEVBQUUsSUFBSSxFQUFFO0FBQ3RCLGdCQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQzs7QUFFbEIsZ0JBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDO0FBQzFCLGdCQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO0FBQzNDLGdCQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQztBQUMxQixnQkFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQzs7QUFFNUMsZ0JBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDO0FBQ2hDLGdCQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQztBQUN0QyxnQkFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUM7QUFDaEMsZ0JBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDOztBQUV0QyxnQkFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUM7QUFDaEMsZ0JBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLElBQUksR0FBRyxDQUFDOztBQUVsQyxnQkFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLENBQUM7QUFDcEMsZ0JBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLElBQUksRUFBRSxDQUFDOztBQUVyQyxnQkFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQzs7QUFFdkIsaUJBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDMUIsb0JBQUksSUFBSSxDQUFDLFlBQVksS0FBSyxJQUFJLEVBQUU7QUFDNUIseUJBQUssR0FBRyxpQkFBTyxLQUFLLEVBQUUsQ0FBQztpQkFDMUI7O0FBRUQsb0JBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDO0FBQ2hCLHFCQUFDLEVBQUUsaUJBQU8sTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUM7QUFDNUIscUJBQUMsRUFBRSxpQkFBTyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQztBQUM1Qix3QkFBSSxFQUFFLGlCQUFPLFdBQVcsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDO0FBQzFDLHdCQUFJLEVBQUUsaUJBQU8sV0FBVyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUM7QUFDMUMsd0JBQUksRUFBRSxpQkFBTyxNQUFNLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQztBQUNyQywwQkFBTSxFQUFFLGlCQUFPLE1BQU0sQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDO0FBQzNDLHlCQUFLLEVBQUUsS0FBSztpQkFDZixDQUFDLENBQUM7YUFDTjtTQUNKOzs7cUNBRVksQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUNmLGdCQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2hEOzs7c0NBRWEsSUFBSSxFQUFFO0FBQ2hCLGdCQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztBQUN2QixnQkFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1NBQ3pCOzs7eUNBRWdCO0FBQ2IsZ0JBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtBQUNqQixvQkFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEdBQ25CLE9BQUssSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyx1QkFDL0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxhQUFTLFdBQzFDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDO2FBQy9DLE1BQU07QUFDSCxvQkFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO2FBQ2xDO1NBQ0o7OztzQ0FFYTtBQUNWLGdCQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7QUFDakIsb0JBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQzthQUMzRDtTQUNKOzs7OENBRXFCO0FBQ2xCLGdCQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDdEYsbUJBQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDO1NBQ3BDOzs7V0E5Y2dCLEtBQUs7OztrQkFBTCxLQUFLOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQ1BMLE1BQU07QUFDdkIsYUFEaUIsTUFBTSxDQUNYLElBQUksRUFBRTs4QkFERCxNQUFNOztBQUVuQixZQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQzs7QUFFbEIsWUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ2hCLFlBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNoQixZQUFJLE9BQU8sSUFBSSxDQUFDLENBQUMsS0FBSyxRQUFRLElBQUksT0FBTyxJQUFJLENBQUMsQ0FBQyxLQUFLLFFBQVEsRUFBRTtBQUMxRCxrQkFBTSxLQUFLLENBQUMsZ0RBQWdELENBQUMsQ0FBQztTQUNqRTs7QUFFRCxZQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDcEIsWUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDOztBQUVwQixZQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDO0FBQzNCLFlBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUM7O0FBRTNCLFlBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sSUFBSSxFQUFFOztBQUFDLEFBRWhDLFlBQUksQ0FBQyxJQUFJLEdBQUcsU0FBUyxDQUFDO0FBQ3RCLFlBQUksQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDO0FBQ3ZCLFlBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDOztBQUUzQixZQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksU0FBUyxDQUFDLENBQUM7QUFDMUMsWUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN0Qjs7aUJBeEJnQixNQUFNOzttQ0EwQlosS0FBSyxFQUFFO0FBQ2QsZ0JBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssRUFBRSxDQUFDLENBQUM7O0FBQUMsQUFFL0MsZ0JBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUM1Qzs7O29DQUVXLEtBQUssRUFBRTtBQUNmLGdCQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztBQUNuQixnQkFBSSxDQUFDLFNBQVMsR0FBRyxpQkFBTyxLQUFLLENBQUMsaUJBQU8sUUFBUSxDQUFDLGlCQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztTQUNuRjs7OzRCQUVXOztBQUVSLG1CQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztTQUN6RTs7O1dBeENnQixNQUFNOzs7a0JBQU4sTUFBTTs7Ozs7Ozs7Ozs7Ozs7OztBQ0ZwQixJQUFNLFFBQVEsV0FBUixRQUFRLEdBQUc7QUFDcEIsVUFBTSxFQUFFLEVBQUU7QUFDVixRQUFJLEVBQUUsRUFBRTtBQUNSLFdBQU8sRUFBRSxFQUFFO0FBQ1gsVUFBTSxFQUFFLEVBQUU7O0FBRVYsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7O0FBRVAsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTs7QUFFUCxTQUFLLEVBQUUsRUFBRTtBQUNULFNBQUssRUFBRSxFQUFFO0FBQ1QsU0FBSyxFQUFFLEVBQUU7QUFDVCxTQUFLLEVBQUUsR0FBRztBQUNWLFNBQUssRUFBRSxHQUFHO0FBQ1YsU0FBSyxFQUFFLEdBQUc7QUFDVixTQUFLLEVBQUUsR0FBRztBQUNWLFNBQUssRUFBRSxHQUFHO0FBQ1YsU0FBSyxFQUFFLEdBQUc7O0FBRVYsa0JBQWMsRUFBRSxHQUFHOztBQUVuQixlQUFXLEVBQUUsQ0FBQztBQUNkLFNBQUssRUFBRSxDQUFDO0FBQ1IsV0FBTyxFQUFFLEVBQUU7QUFDWCxXQUFPLEVBQUUsRUFBRTtBQUNYLFVBQU0sRUFBRSxFQUFFO0FBQ1YsU0FBSyxFQUFFLEVBQUU7QUFDVCxTQUFLLEVBQUUsRUFBRTtBQUNULFdBQU8sRUFBRSxFQUFFO0NBQ2QsQ0FBQzs7QUFFSyxJQUFNLFVBQVUsV0FBVixVQUFVLEdBQUc7QUFDdEIsVUFBTSxFQUFFLENBQUM7QUFDVCxZQUFRLEVBQUUsQ0FBQztBQUNYLFdBQU8sRUFBRSxDQUFDO0NBQ2IsQ0FBQzs7QUFFSyxJQUFNLFVBQVUsV0FBVixVQUFVLEdBQUc7QUFDdEIsYUFBUyxFQUFFLElBQUk7QUFDZixXQUFPLEVBQUUsSUFBSTtBQUNiLGFBQVMsRUFBRSxJQUFJO0FBQ2YsY0FBVSxFQUFFLElBQUk7QUFDaEIsU0FBSyxFQUFFLElBQUk7QUFDWCxZQUFRLEVBQUUsSUFBSTs7QUFFZCxXQUFPLEVBQUUsSUFBSTtBQUNiLFNBQUssRUFBRSxJQUFJO0NBQ2QsQ0FBQzs7QUFFSyxJQUFNLFlBQVksV0FBWixZQUFZLEdBQUc7QUFDeEIsV0FBTyxFQUFFLElBQUk7QUFDYixZQUFRLEVBQUUsSUFBSTtBQUNkLGVBQVcsRUFBRSxJQUFJO0FBQ2pCLGNBQVUsRUFBRSxJQUFJO0FBQ2hCLFdBQU8sRUFBRSxJQUFJO0FBQ2Isa0JBQWMsRUFBRSxJQUFJO0FBQ3BCLGlCQUFhLEVBQUUsSUFBSTtDQUN0QixDQUFDOztJQUdtQixRQUFRO0FBQ3pCLGFBRGlCLFFBQVEsQ0FDYixJQUFJLEVBQUU7OEJBREQsUUFBUTs7QUFFckIsWUFBSSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7O0FBRWxCLFlBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDOztBQUVoQixZQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSyxXQUFXLEVBQUU7QUFDbEMsa0JBQU0sS0FBSyxDQUFDLHFDQUFxQyxDQUFDLENBQUM7U0FDdEQ7QUFDRCxZQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDdEIsWUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO0FBQzlCLFlBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztBQUM1QixZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7QUFDOUIsWUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDO0FBQzFDLFlBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQztBQUN4QyxZQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7QUFDcEMsWUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO0FBQ2xDLFlBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQzs7QUFFNUIsWUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO0tBQ3ZCOztpQkFwQmdCLFFBQVE7OzZCQXNCcEIsS0FBSyxFQUFFO0FBQ1IsZ0JBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQzFCOzs7Z0NBRU87QUFDSixtQkFBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1NBQzdCOzs7K0JBRU07O0FBRUgsZ0JBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7QUFDckIsZ0JBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ2hCLG1CQUFPLEdBQUcsQ0FBQztTQUNkOzs7aUNBRVE7QUFDTCxnQkFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7U0FDbkI7Ozt1Q0FFYzs7QUFFWCxnQkFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNqRSxnQkFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzs7QUFFdkUsZ0JBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUM3RSxnQkFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUN6RSxnQkFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNyRSxnQkFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUN6RSxnQkFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzs7O0FBQUMsQUFHdEUsb0JBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNwRSxvQkFBUSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzs7O0FBQUMsQUFHaEUsZ0JBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUM1RCxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNuQyxnQkFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQzdELFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQ3BDLGdCQUFJLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksRUFDbkUsWUFBWSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7QUFDMUMsZ0JBQUksQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUNsRSxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztBQUN6QyxnQkFBSSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQ2hFLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO0FBQ3ZDLGdCQUFJLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksRUFDL0QsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7QUFDdEMsZ0JBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUM1RCxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztTQUN0Qzs7O29DQUVXLEtBQUssRUFBRTtBQUNmLGdCQUFJLENBQUMsSUFBSSxDQUFDO0FBQ04sb0JBQUksRUFBRSxVQUFVLENBQUMsS0FBSztBQUN0Qix3QkFBUSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDO0FBQ2pDLHNCQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU07QUFDcEIscUJBQUssRUFBRSxLQUFLLENBQUMsUUFBUTtBQUNyQixvQkFBSSxFQUFFLEtBQUssQ0FBQyxPQUFPO0FBQ25CLHlCQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVM7YUFDN0IsQ0FBQyxDQUFDO1NBQ047Ozt1Q0FFYyxLQUFLLEVBQUU7QUFDbEIsZ0JBQUksQ0FBQyxJQUFJLENBQUM7QUFDTixvQkFBSSxFQUFFLFVBQVUsQ0FBQyxRQUFRO0FBQ3pCLHdCQUFRLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUM7QUFDakMsc0JBQU0sRUFBRSxLQUFLLENBQUMsTUFBTTtBQUNwQixxQkFBSyxFQUFFLEtBQUssQ0FBQyxRQUFRO0FBQ3JCLG9CQUFJLEVBQUUsS0FBSyxDQUFDLE9BQU87QUFDbkIseUJBQVMsRUFBRSxLQUFLLENBQUMsU0FBUzthQUM3QixDQUFDLENBQUM7U0FDTjs7OzBDQUVpQixLQUFLLEVBQUU7O0FBRXJCLGlCQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7U0FDMUI7Ozt3Q0FFZSxLQUFLLEVBQUU7QUFDbkIsZ0JBQUksQ0FBQyxJQUFJLENBQUM7QUFDTixvQkFBSSxFQUFFLFVBQVUsQ0FBQyxTQUFTO0FBQzFCLHdCQUFRLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUM7QUFDakMsc0JBQU0sRUFBRSxLQUFLLENBQUMsTUFBTTtBQUNwQixxQkFBSyxFQUFFLEtBQUssQ0FBQyxRQUFRO0FBQ3JCLG9CQUFJLEVBQUUsS0FBSyxDQUFDLE9BQU87QUFDbkIseUJBQVMsRUFBRSxLQUFLLENBQUMsU0FBUzthQUM3QixDQUFDLENBQUM7U0FDTjs7O3NDQUVhLEtBQUssRUFBRTtBQUNqQixnQkFBSSxDQUFDLElBQUksQ0FBQztBQUNOLG9CQUFJLEVBQUUsVUFBVSxDQUFDLE9BQU87QUFDeEIsd0JBQVEsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQztBQUNqQyxzQkFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNO0FBQ3BCLHFCQUFLLEVBQUUsS0FBSyxDQUFDLFFBQVE7QUFDckIsb0JBQUksRUFBRSxLQUFLLENBQUMsT0FBTztBQUNuQix5QkFBUyxFQUFFLEtBQUssQ0FBQyxTQUFTO2FBQzdCLENBQUMsQ0FBQztTQUNOOzs7d0NBRWUsS0FBSyxFQUFFO0FBQ25CLGdCQUFJLENBQUMsSUFBSSxDQUFDO0FBQ04sb0JBQUksRUFBRSxVQUFVLENBQUMsU0FBUztBQUMxQix3QkFBUSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDO0FBQ2pDLHlCQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVM7YUFDN0IsQ0FBQyxDQUFDO1NBQ047Ozt5Q0FFZ0IsS0FBSyxFQUFFOztBQUVwQixnQkFBSSxLQUFLLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQzs7QUFFL0IsZ0JBQUksQ0FBQyxJQUFJLENBQUM7QUFDTixvQkFBSSxFQUFFLFVBQVUsQ0FBQyxVQUFVO0FBQzNCLHdCQUFRLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUM7QUFDakMscUJBQUssRUFBRSxLQUFLO0FBQ1oscUJBQUssRUFBRSxLQUFLLENBQUMsUUFBUTtBQUNyQixvQkFBSSxFQUFFLEtBQUssQ0FBQyxPQUFPO0FBQ25CLHlCQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVM7YUFDN0IsQ0FBQzs7O0FBQUMsQUFHSCxpQkFBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO1NBQzFCOzs7c0NBRWEsS0FBSyxFQUFFOztBQUVqQixnQkFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDLE9BQU8sSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDOztBQUV2QyxnQkFBSSxDQUFDLElBQUksQ0FBQztBQUNOLG9CQUFJLEVBQUUsVUFBVSxDQUFDLE9BQU87QUFDeEIsdUJBQU8sRUFBRSxHQUFHO0FBQ1oscUJBQUssRUFBRSxLQUFLLENBQUMsUUFBUTtBQUNyQixvQkFBSSxFQUFFLEtBQUssQ0FBQyxPQUFPO0FBQ25CLHlCQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVM7YUFDN0IsQ0FBQyxDQUFDO1NBQ047OztvQ0FFVyxLQUFLLEVBQUU7O0FBRWYsZ0JBQUksR0FBRyxHQUFHLEtBQUssQ0FBQyxPQUFPLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQzs7QUFFdkMsZ0JBQUksQ0FBQyxJQUFJLENBQUM7QUFDTixvQkFBSSxFQUFFLFVBQVUsQ0FBQyxLQUFLO0FBQ3RCLHVCQUFPLEVBQUUsR0FBRztBQUNaLHFCQUFLLEVBQUUsS0FBSyxDQUFDLFFBQVE7QUFDckIsb0JBQUksRUFBRSxLQUFLLENBQUMsT0FBTztBQUNuQix5QkFBUyxFQUFFLEtBQUssQ0FBQyxTQUFTO2FBQzdCLENBQUMsQ0FBQztTQUNOOzs7MkNBRWtCLElBQUksRUFBRSxLQUFLLEVBQUU7QUFDNUIsZ0JBQUksQ0FBQyxJQUFJLENBQUM7QUFDTixvQkFBSSxFQUFFLElBQUk7QUFDVix5QkFBUyxFQUFFLEtBQUssQ0FBQyxTQUFTO2FBQzdCLENBQUMsQ0FBQztTQUNOOzs7b0NBRVcsS0FBSyxFQUFFOzs7QUFHZixtQkFBTztBQUNILGlCQUFDLEVBQUUsS0FBSyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVU7QUFDdkMsaUJBQUMsRUFBRSxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUzthQUN6QyxDQUFDO1NBQ0w7OztXQTNMZ0IsUUFBUTs7O2tCQUFSLFFBQVE7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDL0ZSLEtBQUs7QUFDdEIsYUFEaUIsS0FBSyxDQUNWLElBQUksRUFBRTs4QkFERCxLQUFLOztBQUVsQixZQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQzs7QUFFbEIsWUFBSSxDQUFDLElBQUksR0FBRyxPQUFPLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxHQUNyQyxRQUFRLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FDbEMsSUFBSSxDQUFDLElBQUksQ0FBQzs7QUFFZCxZQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSyxXQUFXLEVBQUU7QUFDbEMsa0JBQU0sS0FBSyxDQUFDLHFDQUFxQyxDQUFDLENBQUM7U0FDdEQ7O0FBRUQsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUN6Qzs7aUJBYmdCLEtBQUs7O2dDQWVkOzs7QUFHSixnQkFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7U0FDckM7OzttQ0FFVSxNQUFNLEVBQUUsVUFBVSxFQUFFOzs7Ozs7QUFDM0IscUNBQWlCLE1BQU0sOEhBQUU7d0JBQWhCLElBQUk7O0FBQ1Qsd0JBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxrQkFBbUIsSUFBSSxLQUFLLFVBQVUsQ0FBQyxDQUFDO2lCQUM3RDs7Ozs7Ozs7Ozs7Ozs7O1NBQ0o7OztpQ0FFUSxJQUFJLEVBQUUsVUFBVSxFQUFFO0FBQ3ZCLGdCQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDOztBQUVoQyxnQkFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUNyQixnQkFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDOztBQUVoRSxnQkFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNoQixnQkFBSSxVQUFVLEVBQUU7QUFDWixvQkFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUN0QyxvQkFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ2pELG9CQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO2FBQ3JCO1NBQ0o7Ozt3Q0FFZSxJQUFJLEVBQUUsRUFBRSxFQUFFO0FBQ3RCLGdCQUFJLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyRSxnQkFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztBQUM3QyxnQkFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztBQUMvQyxnQkFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO0FBQzVCLGdCQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7QUFDdkIsZ0JBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxHQUFHLE9BQU87OztBQUFDLEFBRzNCLGdCQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQ3JCLGdCQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoQyxnQkFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUIsZ0JBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFOzs7QUFBQyxBQUdsQixnQkFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDO0FBQ2pDLGdCQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7QUFDdkIsZ0JBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUM7QUFDckIsZ0JBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hDLGdCQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1QixnQkFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUNyQjs7OzBDQUVpQixRQUFRLEVBQUU7O0FBRXhCLGdCQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUM7QUFDOUIsZ0JBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztBQUN2QixnQkFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO0FBQzFCLGdCQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDbkM7Ozt5Q0FFZ0IsUUFBUSxFQUFFO0FBQ3ZCLGdCQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRTtBQUNqQyx1QkFBTzthQUNWOzs7QUFBQSxBQUdELGdCQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQ3JCLGdCQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNoRCxnQkFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNsRSxnQkFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQzs7QUFFbEIsZ0JBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUM7QUFDckIsZ0JBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2hELGdCQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2pFLGdCQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDOzs7Ozs7O0FBRWxCLHNDQUF3QixRQUFRLENBQUMsUUFBUSxtSUFBRTt3QkFBaEMsU0FBUzs7QUFDaEIsd0JBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztpQkFDcEM7Ozs7Ozs7Ozs7Ozs7OztTQUNKOzs7V0EzRmdCLEtBQUs7OztrQkFBTCxLQUFLOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDSTFCLFNBQVMsVUFBVSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRTs7QUFFNUMsUUFBTSxFQUFFLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDN0IsUUFBTSxFQUFFLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJOzs7QUFBQyxBQUc3QixRQUFJLENBQUMsSUFBSSxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDekIsUUFBSSxDQUFDLElBQUksSUFBSSxNQUFNLEdBQUcsRUFBRTs7Ozs7QUFBQyxBQUt6QixRQUFJLENBQUMsS0FBSyxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQ2pDLFFBQUksQ0FBQyxLQUFLLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7Q0FDcEM7OztBQUFBLEFBR0QsU0FBUyxjQUFjLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUU7O0FBRXhDLFFBQU0sRUFBRSxHQUFHLFNBQVMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNoQyxRQUFNLEVBQUUsR0FBRyxTQUFTLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDOzs7QUFBQyxBQUdoQyxRQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDOzs7QUFBQyxBQUd2RCxRQUFNLENBQUMsR0FBRyxBQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLFNBQVMsQ0FBQyxJQUFJLEdBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDNUQsUUFBTSxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUEsQUFBQyxDQUFDO0FBQ3hCLFFBQU0sRUFBRSxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFBLEFBQUMsQ0FBQztBQUN4QixXQUFPLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0NBQ25COztJQUVLLGVBQWU7OztBQUVqQixhQUZFLGVBQWUsQ0FFTCxDQUFDLEVBQUU7OEJBRmIsZUFBZTs7QUFHYixZQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNkOzs7QUFBQTtpQkFKQyxlQUFlOzs2Q0FPSSxJQUFJLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUU7QUFDM0QsZ0JBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNkLGdCQUFJLEtBQUssR0FBRyxDQUFDOzs7QUFBQzs7Ozs7QUFHZCxxQ0FBd0IsVUFBVSw4SEFBRTt3QkFBekIsU0FBUzs7QUFDaEIsd0JBQUksSUFBSSxLQUFLLFNBQVMsRUFBRTs4Q0FDSCxjQUFjLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDOzs7OzRCQUFqRCxFQUFFOzRCQUFFLEVBQUU7O0FBQ2IsNkJBQUssSUFBSSxFQUFFLENBQUM7QUFDWiw2QkFBSyxJQUFJLEVBQUUsQ0FBQztxQkFDZjtpQkFDSjs7Ozs7Ozs7Ozs7Ozs7OztBQUVELHNCQUFVLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7U0FDMUM7OztXQXJCQyxlQUFlOzs7SUF3QmYsY0FBYzs7O0FBRWhCLGFBRkUsY0FBYyxDQUVKLENBQUMsRUFBRSxLQUFLLEVBQUU7OEJBRnBCLGNBQWM7O0FBR1osWUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDWCxZQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztBQUNuQixZQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNmLFlBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0tBQ2xCOzs7QUFBQTtpQkFQQyxjQUFjOzs2Q0FVSyxJQUFJLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUU7QUFDckQsZ0JBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ2YsZ0JBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQzs7O0FBQUMsQUFHZixnQkFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztBQUM1QyxzQkFBVSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7U0FDcEQ7OzsrQ0FFc0IsSUFBSSxFQUFFLFFBQVEsRUFBRTs7QUFFbkMsZ0JBQUksQ0FBQyxRQUFRLEVBQUU7QUFDWCx1QkFBTzthQUNWOztBQUVELGdCQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRTs7QUFFcEIsb0JBQUksSUFBSSxLQUFLLFFBQVEsRUFBRTsyQ0FDRixjQUFjLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDOzs7O3dCQUFoRCxFQUFFO3dCQUFFLEVBQUU7O0FBQ2Isd0JBQUksQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDO0FBQ2pCLHdCQUFJLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQztpQkFDcEI7QUFDRCx1QkFBTzthQUNWOzs7OztBQUFBLEFBS0QsZ0JBQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFBLEdBQUksQ0FBQyxDQUFDOztBQUVqRCxnQkFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQy9CLGdCQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDL0IsZ0JBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFdkQsZ0JBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFOzs7dUNBRUgsY0FBYyxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQzs7OztvQkFBaEQsRUFBRTtvQkFBRSxFQUFFOztBQUNiLG9CQUFJLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQztBQUNqQixvQkFBSSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7YUFDcEIsTUFBTTs7Ozs7OztBQUVILDBDQUF3QixRQUFRLENBQUMsUUFBUSxtSUFBRTs0QkFBaEMsU0FBUzs7QUFDaEIsNEJBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7cUJBQ2hEOzs7Ozs7Ozs7Ozs7Ozs7YUFDSjtTQUNKOzs7V0F2REMsY0FBYzs7O0lBMERDLEtBQUs7QUFDdEIsYUFEaUIsS0FBSyxDQUNWLElBQUksRUFBRTs4QkFERCxLQUFLOztBQUVsQixZQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQzs7QUFFbEIsWUFBSSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7O0FBRTNCLFlBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7QUFBQyxBQUMvQyxZQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLElBQUksSUFBSTtBQUFDLEFBQzFDLFlBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUMxRCxZQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7O0FBRTNELFlBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRTs7QUFBQyxBQUVqQixZQUFJLENBQUMsSUFBSSxHQUFHO21CQUNRLElBQUksQ0FBQyxhQUFhO29CQUNqQixJQUFJLENBQUMsYUFBYTtvQkFDbEIsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUEsR0FBSSxDQUFDO29CQUNyQyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQSxHQUFJLENBQUMsQ0FBQyxDQUFDO0FBQzdELFlBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDOztBQUVkLFlBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pELFlBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsYUFBYyxHQUFHLENBQUMsQ0FBQztBQUNoRSxZQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO0tBQ2hGOztpQkF2QmdCLEtBQUs7O3lDQXlCTDtBQUNiLGdCQUFJLENBQUMsYUFBYSxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQztBQUN6QyxnQkFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztTQUNoRjs7Ozs7OzZCQUdJLE9BQU8sRUFBRTtBQUNWLGdCQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRTtBQUNyQixvQkFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2FBQ3BCOzs7Ozs7O0FBRUQsc0NBQW1CLElBQUksQ0FBQyxNQUFNLG1JQUFFO3dCQUFyQixJQUFJOztBQUNYLHdCQUFJLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUMzQixJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2lCQUN6RTs7Ozs7Ozs7Ozs7Ozs7OztBQUVELGdCQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztBQUM3QixnQkFBSSxDQUFDLElBQUksSUFBSSxPQUFPO0FBQUMsQUFDckIsZ0JBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztTQUMxQjs7Ozs7O2dEQUd1Qjs7Ozs7O0FBQ3BCLHNDQUFtQixJQUFJLENBQUMsTUFBTSxtSUFBRTt3QkFBckIsSUFBSTs7QUFDWCx3QkFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQ3BCLHdCQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7aUJBQ3ZCOzs7Ozs7Ozs7Ozs7Ozs7U0FDSjs7Ozs7OzBDQUdpQjtBQUNkLGdCQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDVixtQkFBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7QUFDM0Isb0JBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRTVCLG9CQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksSUFDMUIsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLElBQzNCLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksSUFDMUIsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUU7Ozs7QUFJN0Isd0JBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztpQkFDNUIsTUFBTTtBQUNILHFCQUFDLEVBQUUsQ0FBQztpQkFDUDthQUNKO1NBQ0o7Ozs7OzttQ0FHVSxJQUFJLEVBQUU7QUFDYixnQkFBSSxJQUFJLEdBQUcsbUJBQVcsSUFBSSxDQUFDLENBQUM7QUFDNUIsZ0JBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3ZCLGdCQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7QUFDakIsbUJBQU8sSUFBSSxDQUFDO1NBQ2Y7Ozs7OzttQ0FHVSxVQUFVLEVBQUU7QUFDbkIsaUJBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN6QyxvQkFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1QixvQkFBSSxJQUFJLEtBQUssVUFBVSxFQUFFO0FBQ3JCLHdCQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDekIsd0JBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUNqQiwwQkFBTTtpQkFDVDthQUNKO1NBQ0o7Ozs7OztrQ0FHUyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQ1osaUJBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDOUMsb0JBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUIsb0JBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxJQUMvQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUN4QyxvQkFBSSxPQUFPLEVBQUU7QUFDVCwyQkFBTyxJQUFJLENBQUM7aUJBQ2Y7YUFDSjtBQUNELG1CQUFPLFNBQVMsQ0FBQztTQUNwQjs7Ozs7O2dDQUdPO0FBQ0osZ0JBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUM7QUFBQyxBQUN2QixnQkFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1NBQ3BCOzs7Ozs7b0NBR1c7QUFDUixnQkFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQzs7Ozs7O0FBQ2xCLHNDQUFtQixJQUFJLENBQUMsTUFBTSxtSUFBRTt3QkFBckIsSUFBSTs7QUFDWCx3QkFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQzNCOzs7Ozs7Ozs7Ozs7Ozs7U0FDSjs7O1dBdkhnQixLQUFLOzs7a0JBQUwsS0FBSzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDcEhMLE9BQU87QUFDeEIsYUFEaUIsT0FBTyxDQUNaLEVBQUUsRUFBWTs4QkFEVCxPQUFPOztZQUNSLEdBQUcseURBQUMsSUFBSTs7QUFDcEIsWUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDZCxZQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztBQUNoQixZQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztBQUN2QixZQUFJLENBQUMsWUFBWSxHQUFHLEdBQUcsS0FBSyxJQUFJLENBQUM7QUFDakMsWUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7O0FBRTVCLFlBQUksQ0FBQyxPQUFPLEdBQUcsY0FBSSxTQUFTLEVBQUUsQ0FBQztLQUNsQzs7aUJBVGdCLE9BQU87O2dDQWVoQjtBQUNKLGdCQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRTtBQUNqQixvQkFBSSxJQUFJLENBQUMsWUFBWSxFQUFFO0FBQ25CLHdCQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7aUJBQzFCLE1BQU07QUFDSCx3QkFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2lCQUN6QjtBQUNELG9CQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQzthQUN6QjtTQUNKOzs7K0JBRU07QUFDSCxnQkFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO0FBQ2hCLG9CQUFJLElBQUksQ0FBQyxZQUFZLEVBQUU7QUFDbkIsd0JBQUksQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO2lCQUMzRCxNQUFNO0FBQ0gsd0JBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztpQkFDcEQ7QUFDRCxvQkFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7YUFDMUI7U0FDSjs7O2lDQUVRO0FBQ0wsZ0JBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtBQUNoQixvQkFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2FBQ2YsTUFBTTtBQUNILG9CQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7YUFDaEI7U0FDSjs7OzBDQUVpQjs7O0FBQ2QsZ0JBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ25ELGdCQUFJLFFBQVEsR0FBRyxTQUFYLFFBQVEsQ0FBSSxTQUFTLEVBQUs7QUFDMUIsc0JBQUssZUFBZSxHQUFHLE1BQUssT0FBTyxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3BFLHNCQUFLLEdBQUcsQ0FBQyxTQUFTLEdBQUcsYUFBYSxDQUFDLENBQUM7QUFDcEMsNkJBQWEsR0FBRyxTQUFTLENBQUM7YUFDN0I7OztBQUFDLEFBR0YsZ0JBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUN2RTs7O3lDQUVnQjs7OztBQUViLGdCQUFJLE9BQU8sR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7O0FBRW5DLGdCQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNuRCxnQkFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxZQUFNO0FBQ2xELG9CQUFJLFNBQVMsR0FBRyxPQUFLLE9BQU8sQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDL0MsdUJBQUssR0FBRyxDQUFDLFNBQVMsR0FBRyxhQUFhLENBQUMsQ0FBQztBQUNwQyw2QkFBYSxHQUFHLFNBQVMsQ0FBQzthQUM1QixFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ2hCOzs7NEJBeERZO0FBQ1QsbUJBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztTQUN6Qjs7O1dBYmdCLE9BQU87OztrQkFBUCxPQUFPOzs7Ozs7Ozs7Ozs7Ozs7OztJQ0R0QixVQUFVO0FBQ1osYUFERSxVQUFVLENBQ0EsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFOzhCQUR6QyxVQUFVOztBQUVSLFlBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0FBQ25CLFlBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0FBQ3JCLFlBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0FBQ3JCLFlBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTTs7O0FBQUMsQUFHckIsWUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQzNCLFlBQUksQ0FBQyxVQUFVLEdBQUcsTUFBTSxHQUFHLENBQUMsQ0FBQztBQUM3QixZQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUN6QyxZQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVU7OztBQUFDLEFBRzFDLFlBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO0FBQ2QsWUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDWCxZQUFJLENBQUMsQ0FBQyxHQUFHLENBQUM7OztBQUFDLEFBR1gsWUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNoQzs7O0FBQUE7aUJBcEJDLFVBQVU7O2dDQXVCSixJQUFJLEVBQUU7QUFDVixnQkFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN0QixnQkFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFbEQsZ0JBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsWUFBWSxVQUFVLEVBQUU7QUFDL0Msb0JBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3pDLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUU7QUFDakMsb0JBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFDO2FBQ2xDLE1BQU07QUFDSCxvQkFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN6QyxvQkFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUMvRCxvQkFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUMvRCxvQkFBTSxJQUFJLEdBQUcsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQzs7QUFFM0Usb0JBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDdkIsb0JBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRW5CLG9CQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQzthQUNsQztTQUNKOzs7Ozs7bUNBR1UsSUFBSSxFQUFFO0FBQ2IsZ0JBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztBQUN0QyxnQkFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFBLEdBQUksT0FBTyxDQUFDO0FBQ2pFLGdCQUFNLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUEsR0FBSSxPQUFPLENBQUM7QUFDakUsZ0JBQUksQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDO0FBQ3BCLGdCQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUNkLGdCQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztTQUNqQjs7Ozs7O29DQUdXLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDZCxnQkFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDckMsZ0JBQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN6QyxtQkFBTyxNQUFNLEdBQUcsTUFBTSxDQUFDO1NBQzFCOzs7V0EzREMsVUFBVTs7O0lBOERLLE1BQU07QUFDdkIsYUFEaUIsTUFBTSxDQUNYLEtBQUssRUFBRSxNQUFNLEVBQTBCO1lBQXhCLE1BQU0seURBQUcsQ0FBQzs7OEJBRHBCLE1BQU07O1lBQ2dCLE1BQU0seURBQUcsQ0FBQzs7QUFDN0MsWUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7QUFDbkIsWUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7QUFDckIsWUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7QUFDckIsWUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7QUFDckIsWUFBSSxDQUFDLElBQUksR0FBRyxTQUFTLENBQUM7S0FDekI7O2lCQVBnQixNQUFNOztnQ0FTZixJQUFJLEVBQUU7QUFDVixnQkFBSSxJQUFJLENBQUMsSUFBSSxZQUFZLFVBQVUsRUFBRTtBQUNqQyxvQkFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDM0IsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRTtBQUNuQixvQkFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7YUFDcEIsTUFBTTtBQUNILG9CQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQzNCLG9CQUFJLENBQUMsSUFBSSxHQUFHLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5RSxvQkFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDNUIsb0JBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQzNCO1NBQ0o7OztnQ0FFTztBQUNKLGdCQUFJLENBQUMsSUFBSSxHQUFHLFNBQVMsQ0FBQztTQUN6Qjs7O1dBeEJnQixNQUFNOzs7a0JBQU4sTUFBTTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQzdEM0IsTUFBTSxDQUFDLE1BQU0sR0FBRyxZQUFXOztBQUV2QixrQkFBSSxjQUFjLENBQUMsU0FBUyxHQUFHLHFCQUFxQjs7O0FBQUMsQUFHckQsVUFBTSxDQUFDLFFBQVEsR0FBRyxJQUFJLG1CQUFHLEdBQUcsRUFBRSxDQUFDO0NBQ2xDLENBQUM7Ozs7O0FDWEYsTUFBTSxDQUFDLHFCQUFxQixHQUFHLE1BQU0sQ0FBQyxxQkFBcUIsSUFDdkQsTUFBTSxDQUFDLDJCQUEyQixJQUNsQyxNQUFNLENBQUMsd0JBQXdCLElBQy9CLFVBQVMsUUFBUSxFQUFFO0FBQ2YsV0FBTyxNQUFNLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUM7Q0FDakQsQ0FBQzs7QUFFTixNQUFNLENBQUMsb0JBQW9CLEdBQUcsTUFBTSxDQUFDLG9CQUFvQixJQUNyRCxNQUFNLENBQUMsdUJBQXVCLElBQzlCLFVBQVMsU0FBUyxFQUFFO0FBQ2hCLFVBQU0sQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUM7Q0FDbEMsQ0FBQzs7QUFFTixNQUFNLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQyxXQUFXLElBQUksRUFBRSxDQUFDO0FBQzlDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxJQUMzQyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsSUFDNUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLElBQ3pCLElBQUksQ0FBQyxHQUFHLENBQUM7Ozs7Ozs7Ozs7Ozs7a0JDZEU7QUFDWCxZQUFRLG9CQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUU7eUNBQ1YsVUFBVTs7WUFBckIsQ0FBQztZQUFFLENBQUM7WUFBRSxDQUFDOztBQUNaLFNBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFJLENBQUMsR0FBRyxPQUFPLEFBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDOUQsU0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUksQ0FBQyxHQUFHLE9BQU8sQUFBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUM5RCxTQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBSSxDQUFDLEdBQUcsT0FBTyxBQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQzlELGVBQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ3BCO0FBRUQsV0FBTyxtQkFBQyxHQUFHLEVBQUU7QUFDVCxZQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUM3QixZQUFJLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0FBQ2QsYUFBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQ2pDO0FBQ0QsZUFBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDNUIsUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUM1QixRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUN6QztBQUVELFNBQUssaUJBQUMsVUFBVSxFQUFFOzBDQUNJLFVBQVU7O1lBQXJCLENBQUM7WUFBRSxDQUFDO1lBQUUsQ0FBQzs7QUFDZCxlQUFPLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFBLENBQUUsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUM3QyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFBLENBQUUsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUM3QyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFBLENBQUUsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0tBQzlEO0NBQ0o7Ozs7Ozs7Ozs7O2tCQ3pCYztBQUNYLGFBQVMsdUJBQUc7QUFDUixlQUFPLE1BQU0sQ0FBQztLQUNqQjtDQUNKOzs7Ozs7Ozs7OztrQkNKYzs7Ozs7QUFJWCxVQUFNLGtCQUFDLElBQUksRUFBVztZQUFULEVBQUUseURBQUMsSUFBSTs7QUFDaEIsWUFBSSxFQUFFLEtBQUssSUFBSSxFQUFFO0FBQ2IsY0FBRSxHQUFHLElBQUksQ0FBQztBQUNWLGdCQUFJLEdBQUcsQ0FBQyxDQUFDO1NBQ1o7O0FBRUQsZUFBTyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQSxBQUFDLEdBQUcsSUFBSSxDQUFDO0tBQzdDOzs7OztBQUtELFdBQU8scUJBQVU7QUFDYixlQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sTUFBQSxDQUFYLElBQUksWUFBZ0IsQ0FBQyxDQUFDO0tBQzNDOzs7Ozs7QUFNRCxlQUFXLHlCQUFVO0FBQ2pCLFlBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLE1BQUEsQ0FBWCxJQUFJLFlBQWdCLENBQUM7QUFDaEMsWUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsR0FBRyxFQUFFO0FBQ3JCLGdCQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUM7U0FDaEI7QUFDRCxlQUFPLElBQUksQ0FBQztLQUNmOzs7OztBQUtELFNBQUssbUJBQUc7QUFDSixlQUFPLEdBQUcsR0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxTQUFTLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUEsQ0FBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUMxRjtDQUNKOzs7Ozs7Ozs7Ozs7Ozs7QUM1QkQsWUFBWSxDQUFDOztBQUdiLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO0FBQUUsT0FBTSxDQUFDLE9BQU8sR0FBRyxDQUFDLFlBQVk7O0FBR3JELE1BQUksR0FBRyxHQUFHOztBQUdULFdBQVEsRUFBRyxvQkFBWTtBQUN0QixPQUFHLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2xDLE9BQUcsQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUNoRSxPQUFHLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUUsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUM7QUFDbEUsT0FBRyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUN0RDs7QUFHRCxPQUFJLEVBQUcsZ0JBQVk7QUFDbEIsUUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRTtBQUM1QixRQUFHLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7S0FDeEQ7SUFDRDs7QUFHRCx1QkFBb0IsRUFBRyw4QkFBVSxJQUFJLEVBQUUsU0FBUyxFQUFFO0FBQ2pELFFBQUksVUFBVSxHQUFHLElBQUksTUFBTSxDQUFDLFVBQVUsR0FBRyxTQUFTLEdBQUcsNEJBQTRCLEVBQUUsR0FBRyxDQUFDLENBQUM7O0FBRXhGLFNBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDeEMsU0FBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLFNBQVMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLE9BQU8sRUFBRTtBQUN4RSxVQUFJLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRTs7QUFFN0IsZ0JBQVM7T0FDVDtNQUNEO0FBQ0QsU0FBSSxDQUFDLENBQUM7QUFDTixTQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQSxBQUFDLEVBQUU7QUFDdkYsVUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hCLFVBQUksT0FBTyxHQUFHLElBQUksQ0FBQzs7QUFFbkIsVUFBSSxXQUFXLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDeEQsVUFBSSxXQUFXLEtBQUssSUFBSSxFQUFFO0FBQ3pCLGNBQU8sR0FBRyxXQUFXLENBQUM7T0FDdEIsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUNoQixjQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO09BQ2Y7O0FBRUQsVUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQ2QsVUFBSSxPQUFPLEVBQUU7QUFDWixXQUFJO0FBQ0gsWUFBSSxHQUFHLEFBQUMsSUFBSSxRQUFRLENBQUUsVUFBVSxHQUFHLE9BQU8sR0FBRyxHQUFHLENBQUMsRUFBRyxDQUFDO1FBQ3JELENBQUMsT0FBTSxXQUFXLEVBQUU7QUFDcEIsV0FBRyxDQUFDLElBQUksQ0FBQyxpQ0FBaUMsR0FBRyxXQUFXLEdBQUcsS0FBSyxHQUFHLE9BQU8sQ0FBQyxDQUFDO1FBQzVFO09BQ0Q7QUFDRCxlQUFTLENBQUMsT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7TUFDckQ7S0FDRDtJQUNEOztBQUdELHVCQUFvQixFQUFHLENBQUMsWUFBWTtBQUNuQyxRQUFJLEdBQUcsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzFDLFFBQUksR0FBRyxDQUFDLFlBQVksRUFBRTtBQUNyQixRQUFHLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNsQyxTQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksT0FBTyxFQUFFO0FBQ3RDLGFBQU8sSUFBSSxDQUFDO01BQ1o7S0FDRDtBQUNELFdBQU8sS0FBSyxDQUFDO0lBQ2IsQ0FBQSxFQUFHOztBQUdKLG9CQUFpQixFQUFHLENBQUMsWUFBWTtBQUNoQyxRQUFJLEdBQUcsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzNDLFdBQU8sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQSxBQUFDLENBQUM7SUFDbEQsQ0FBQSxFQUFHOztBQUdKLGVBQVksRUFBRyxzQkFBVSxLQUFLLEVBQUU7QUFDL0IsV0FBTyxPQUFPLEtBQUssS0FBSyxRQUFRLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUM7SUFDMUU7O0FBR0QsZ0JBQWEsRUFBRyx1QkFBVSxHQUFHLEVBQUUsSUFBSSxFQUFFO0FBQ3BDLFdBQU8sR0FBRyxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsS0FBSyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDekQ7O0FBR0QsY0FBVyxFQUFHLHFCQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUU7QUFDakMsUUFBSSxRQUFRLEdBQUcsT0FBTyxHQUFHLElBQUksQ0FBQztBQUM5QixRQUFJLFNBQVMsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzFDLFFBQUksU0FBUyxLQUFLLElBQUksRUFBRTtBQUN2QixZQUFPLFNBQVMsQ0FBQztLQUNqQjtBQUNELFdBQU8sSUFBSSxDQUFDO0lBQ1o7O0FBR0QsY0FBVyxFQUFHLHFCQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFO0FBQ3ZDLFFBQUksRUFBRSxDQUFDLGdCQUFnQixFQUFFO0FBQ3hCLE9BQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ3ZDLE1BQU0sSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO0FBQzFCLE9BQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxHQUFHLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztLQUNsQztJQUNEOztBQUdELGNBQVcsRUFBRyxxQkFBVSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRTtBQUN2QyxRQUFJLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRTtBQUMzQixPQUFFLENBQUMsbUJBQW1CLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztLQUMxQyxNQUFNLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtBQUMxQixPQUFFLENBQUMsV0FBVyxDQUFDLElBQUksR0FBRyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDbEM7SUFDRDs7QUFHRCx1QkFBb0IsRUFBRyxFQUFFOztBQUd6QixtQkFBZ0IsRUFBRywwQkFBVSxTQUFTLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7QUFDdkQsUUFBSSxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLEVBQUU7QUFDeEQsUUFBRyxDQUFDLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztLQUN6QztBQUNELE9BQUcsQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDM0QsT0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2hDOztBQUdELG9CQUFpQixFQUFHLDJCQUFVLFNBQVMsRUFBRTtBQUN4QyxRQUFJLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLEVBQUU7QUFDdkQsVUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUN2RSxVQUFJLEdBQUcsR0FBRyxHQUFHLENBQUMsb0JBQW9CLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakQsU0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ3hDO0FBQ0QsWUFBTyxHQUFHLENBQUMsb0JBQW9CLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDM0M7SUFDRDs7QUFHRCxzQkFBbUIsRUFBRyw2QkFBVSxJQUFJLEVBQUU7QUFDckMsUUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDO0FBQ2xCLFFBQUksUUFBUSxHQUFHLFNBQVgsUUFBUSxHQUFlO0FBQzFCLFNBQUksQ0FBQyxLQUFLLEVBQUU7QUFDWCxXQUFLLEdBQUcsSUFBSSxDQUFDO0FBQ2IsVUFBSSxFQUFFLENBQUM7TUFDUDtLQUNELENBQUM7O0FBRUYsUUFBSSxRQUFRLENBQUMsVUFBVSxLQUFLLFVBQVUsRUFBRTtBQUN2QyxlQUFVLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztBQUFDLEFBQ3hCLFlBQU87S0FDUDs7QUFFRCxRQUFJLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRTtBQUM5QixhQUFRLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQzs7O0FBQUMsQUFHL0QsV0FBTSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FFakQsTUFBTSxJQUFJLFFBQVEsQ0FBQyxXQUFXLEVBQUU7O0FBRWhDLGFBQVEsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLEVBQUUsWUFBWTtBQUN0RCxVQUFJLFFBQVEsQ0FBQyxVQUFVLEtBQUssVUFBVSxFQUFFO0FBQ3ZDLGVBQVEsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLEVBQUUsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzdELGVBQVEsRUFBRSxDQUFDO09BQ1g7TUFDRCxDQUFDOzs7QUFBQSxBQUdGLFdBQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQzs7O0FBQUMsQUFHdkMsU0FBSSxRQUFRLENBQUMsZUFBZSxDQUFDLFFBQVEsSUFBSSxNQUFNLElBQUksTUFBTSxDQUFDLEdBQUcsRUFBRTtBQUM5RCxVQUFJLFNBQVMsR0FBRyxTQUFaLFNBQVMsR0FBZTtBQUMzQixXQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRTtBQUFFLGVBQU87UUFBRTtBQUMvQixXQUFJO0FBQ0gsZ0JBQVEsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzFDLGdCQUFRLEVBQUUsQ0FBQztRQUNYLENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDWCxrQkFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN6QjtPQUNELENBQUM7QUFDRixlQUFTLEVBQUUsQ0FBQztNQUNaO0tBQ0Q7SUFDRDs7QUFHRCxPQUFJLEVBQUcsY0FBVSxHQUFHLEVBQUU7QUFDckIsUUFBSSxNQUFNLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFO0FBQzFDLFdBQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ3pCO0lBQ0Q7O0FBR0QsaUJBQWMsRUFBRyx3QkFBVSxDQUFDLEVBQUU7QUFDN0IsUUFBSSxDQUFDLENBQUMsY0FBYyxFQUFFO0FBQUUsTUFBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO0tBQUU7QUFDN0MsS0FBQyxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7SUFDdEI7O0FBR0QsZ0JBQWEsRUFBRyx1QkFBVSxNQUFNLEVBQUU7O0FBRWpDLFFBQUksTUFBTSxDQUFDLFVBQVUsRUFBRTtBQUN0QixRQUFHLENBQUMsZUFBZSxHQUFHLE1BQU0sQ0FBQztBQUM3QixRQUFHLENBQUMsZUFBZSxDQUFDLFVBQVUsRUFBRSxDQUFDO0tBQ2pDO0lBQ0Q7O0FBR0QsZ0JBQWEsRUFBRyx5QkFBWTs7QUFFM0IsUUFBSSxHQUFHLENBQUMsZUFBZSxFQUFFO0FBQ3hCLFFBQUcsQ0FBQyxlQUFlLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDckMsUUFBRyxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7S0FDM0I7SUFDRDs7QUFHRCxZQUFTLEVBQUcsbUJBQVUsRUFBRSxFQUFFLElBQUksRUFBRTtBQUMvQixRQUFJLENBQUMsRUFBRSxFQUFFO0FBQ1IsWUFBTztLQUNQO0FBQ0QsUUFBSSxRQUFRLENBQUMsV0FBVyxFQUFFO0FBQ3pCLFNBQUksRUFBRSxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDNUMsT0FBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQy9CLE9BQUUsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7S0FDckIsTUFBTSxJQUFJLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRTtBQUN0QyxTQUFJLEVBQUUsR0FBRyxRQUFRLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztBQUN0QyxPQUFFLENBQUMsU0FBUyxDQUFDLElBQUksR0FBRyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7S0FDOUIsTUFBTSxJQUFJLEVBQUUsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUU7O0FBQzNCLE9BQUUsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztLQUNsQjtJQUNEOztBQUdELGtCQUFlLEVBQUcseUJBQVUsU0FBUyxFQUFFO0FBQ3RDLFdBQU8sU0FBUyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3hEOzs7QUFJRCxXQUFRLEVBQUcsa0JBQVUsR0FBRyxFQUFFLFNBQVMsRUFBRTtBQUNwQyxRQUFJLENBQUMsU0FBUyxFQUFFO0FBQ2YsWUFBTyxLQUFLLENBQUM7S0FDYjtBQUNELFdBQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQSxDQUFFLE9BQU8sQ0FBQyxHQUFHLEdBQUcsU0FBUyxHQUFHLEdBQUcsQ0FBQyxDQUFDO0lBQzdGOzs7QUFJRCxXQUFRLEVBQUcsa0JBQVUsR0FBRyxFQUFFLFNBQVMsRUFBRTtBQUNwQyxRQUFJLFNBQVMsR0FBRyxHQUFHLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQy9DLFNBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDN0MsU0FBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQ3JDLFNBQUcsQ0FBQyxTQUFTLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUEsR0FBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDM0Q7S0FDRDtJQUNEOzs7QUFJRCxhQUFVLEVBQUcsb0JBQVUsR0FBRyxFQUFFLFNBQVMsRUFBRTtBQUN0QyxRQUFJLFNBQVMsR0FBRyxHQUFHLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQy9DLFNBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDN0MsU0FBSSxJQUFJLEdBQUcsSUFBSSxNQUFNLENBQ3BCLE9BQU8sR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxHQUNoQyxNQUFNLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLFFBQVEsR0FDaEMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLEVBQ2hDLEdBQUcsQ0FDSCxDQUFDO0FBQ0YsUUFBRyxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDbEQ7SUFDRDs7QUFHRCxXQUFRLEVBQUcsa0JBQVUsR0FBRyxFQUFFO0FBQ3pCLFdBQU8sTUFBTSxDQUFDLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDO0lBQ2pGOztBQUdELFdBQVEsRUFBRyxDQUFDLFlBQVk7QUFDdkIsUUFBSSxNQUFNLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMzQyxRQUFJLGdCQUFnQixHQUFHLFNBQW5CLGdCQUFnQixDQUFhLEtBQUssRUFBRTtBQUN2QyxVQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ3pDLFVBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUU7QUFDN0IsY0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7T0FDaEI7TUFDRDtLQUNELENBQUM7QUFDRixRQUFJLEtBQUssR0FBRztBQUNYLGlCQUFZLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxjQUFjLEVBQUUsaUJBQWlCLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztBQUN6RixjQUFTLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxXQUFXLEVBQUUsY0FBYyxFQUFFLGlCQUFpQixDQUFDLENBQUM7S0FDN0UsQ0FBQztBQUNGLFdBQU8sVUFBVSxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUNsQyxhQUFRLElBQUksQ0FBQyxXQUFXLEVBQUU7QUFDMUIsV0FBSyxTQUFTO0FBQ2IsV0FBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7QUFDdkQsVUFBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0FBQzFCLFVBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLGdCQUFnQixHQUFHLFlBQVksR0FBRyxHQUFHLENBQUM7QUFDekQsYUFBTTtBQUFBLEFBQ1A7QUFDQyxVQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQztBQUMvQixhQUFNO0FBQUEsTUFDTjtLQUNELENBQUM7SUFDRixDQUFBLEVBQUc7O0FBR0osa0JBQWUsRUFBRyx5QkFBVSxHQUFHLEVBQUUsS0FBSyxFQUFFO0FBQ3ZDLE9BQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLGNBQWMsRUFBRSxLQUFLLElBQUksR0FBRyxDQUFDLENBQUM7SUFDaEQ7O0FBR0QsZUFBWSxFQUFHLHNCQUFVLEdBQUcsRUFBRSxLQUFLLEVBQUU7QUFDcEMsT0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsV0FBVyxFQUFFLEtBQUssSUFBSSxNQUFNLENBQUMsQ0FBQztJQUNoRDs7QUFHRCxnQkFBYSxFQUFHLHVCQUFVLENBQUMsRUFBRSxrQkFBa0IsRUFBRTtBQUNoRCxRQUFJLENBQUMsR0FBQyxDQUFDO1FBQUUsQ0FBQyxHQUFDLENBQUMsQ0FBQztBQUNiLFFBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO0FBQ3JDLEtBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQ2QsS0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7QUFDYixRQUFJLENBQUMsa0JBQWtCLEVBQUU7QUFDeEIsU0FBSSxPQUFPLEdBQUcsR0FBRyxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQy9CLE1BQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEIsTUFBQyxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNoQjtBQUNELFdBQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDZDs7QUFHRCxpQkFBYyxFQUFHLHdCQUFVLENBQUMsRUFBRTtBQUM3QixXQUFPLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDdkM7OztBQUlELG1CQUFnQixFQUFHLDBCQUFVLENBQUMsRUFBRTtBQUMvQixRQUFJLENBQUMsQ0FBQyxFQUFFO0FBQUUsTUFBQyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7S0FBRTtBQUM3QixRQUFJLENBQUMsR0FBRyxDQUFDO1FBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNqQixRQUFJLE9BQU8sQ0FBQyxDQUFDLGNBQWMsS0FBSyxXQUFXLElBQUksQ0FBQyxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUU7O0FBRXZFLE1BQUMsR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztBQUNoQyxNQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7S0FDaEMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sS0FBSyxRQUFRLEVBQUU7QUFDekMsTUFBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUM7QUFDZCxNQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQztLQUNkO0FBQ0QsV0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQ3RCOzs7QUFJRCxtQkFBZ0IsRUFBRywwQkFBVSxDQUFDLEVBQUU7QUFDL0IsUUFBSSxDQUFDLENBQUMsRUFBRTtBQUFFLE1BQUMsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO0tBQUU7QUFDN0IsUUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsVUFBVSxDQUFDO0FBQ3RDLFFBQUksVUFBVSxHQUFHLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxDQUFDOztBQUVoRCxRQUFJLENBQUMsR0FBRyxDQUFDO1FBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQzs7QUFFakIsUUFBSSxPQUFPLEdBQUcsQ0FBQztRQUFFLE9BQU8sR0FBRyxDQUFDLENBQUM7QUFDN0IsUUFBSSxPQUFPLENBQUMsQ0FBQyxjQUFjLEtBQUssV0FBVyxJQUFJLENBQUMsQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFOztBQUV2RSxZQUFPLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7QUFDdEMsWUFBTyxHQUFHLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO0tBQ3RDLE1BQU0sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEtBQUssUUFBUSxFQUFFO0FBQ3pDLFlBQU8sR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDO0FBQ3BCLFlBQU8sR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDO0tBQ3BCOztBQUVELEtBQUMsR0FBRyxPQUFPLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQztBQUM5QixLQUFDLEdBQUcsT0FBTyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUM7QUFDN0IsV0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQ3RCOztBQUdELGFBQVUsRUFBRyxzQkFBWTtBQUN4QixRQUFJLEdBQUcsR0FBRyxRQUFRLENBQUMsZUFBZSxDQUFDO0FBQ25DLFdBQU8sQ0FDTixDQUFDLE1BQU0sQ0FBQyxXQUFXLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQSxJQUFLLEdBQUcsQ0FBQyxVQUFVLElBQUksQ0FBQyxDQUFBLEFBQUMsRUFDOUQsQ0FBQyxNQUFNLENBQUMsV0FBVyxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUEsSUFBSyxHQUFHLENBQUMsU0FBUyxJQUFJLENBQUMsQ0FBQSxBQUFDLENBQzVELENBQUM7SUFDRjs7QUFHRCxjQUFXLEVBQUcsdUJBQVk7QUFDekIsUUFBSSxHQUFHLEdBQUcsUUFBUSxDQUFDLGVBQWUsQ0FBQztBQUNuQyxXQUFPLENBQ0wsTUFBTSxDQUFDLFVBQVUsSUFBSSxHQUFHLENBQUMsV0FBVyxFQUNwQyxNQUFNLENBQUMsV0FBVyxJQUFJLEdBQUcsQ0FBQyxZQUFZLENBQ3ZDLENBQUM7SUFDRjs7QUFHRCxpQkFBYyxFQUFHLDBCQUFZOztBQUU1QixRQUFJLEdBQUcsQ0FBQyxNQUFNLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7QUFDbkMsU0FBSSxPQUFPLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7O0FBRS9CLFNBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQzs7QUFFWCxTQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUU7OztBQUdsQixRQUFFLEdBQUcsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQztBQUFDLEFBQ3BELFFBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7QUFBQyxNQUNaLE1BQU07QUFDTixTQUFFLEdBQUcsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDO0FBQUMsQUFDOUMsU0FBRSxHQUFHLEdBQUcsQ0FBQyxVQUFVLEVBQUU7QUFBQyxPQUN0Qjs7QUFFRCxTQUFJLEVBQUUsR0FBRyxHQUFHLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUM7QUFBQyxBQUNuRCxTQUFJLEVBQUUsR0FBRyxHQUFHLENBQUMsV0FBVyxFQUFFO0FBQUMsQUFDM0IsU0FBSSxFQUFFLEdBQUcsR0FBRyxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQztBQUFDLEFBQ3pDLFNBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDWixhQUFRLE9BQU8sQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFO0FBQ3JDLFdBQUssTUFBTTtBQUFFLFFBQUMsR0FBQyxDQUFDLENBQUMsQUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEFBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEFBQUMsTUFBTTtBQUFBLEFBQ25DLFdBQUssT0FBTztBQUFDLFFBQUMsR0FBQyxDQUFDLENBQUMsQUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEFBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxBQUFDLE1BQU07QUFBQSxBQUNsQyxXQUFLLEtBQUs7QUFBRyxRQUFDLEdBQUMsQ0FBQyxDQUFDLEFBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxBQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxBQUFDLE1BQU07QUFBQSxBQUNuQztBQUFhLFFBQUMsR0FBQyxDQUFDLENBQUMsQUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEFBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxBQUFDLE1BQU07QUFBQSxNQUNsQztBQUNELFNBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQSxHQUFFLENBQUM7OztBQUFDLEFBR3hCLFNBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFO0FBQzNCLFVBQUksRUFBRSxHQUFHLENBQ1IsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUNMLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQ2pCLENBQUM7TUFDRixNQUFNO0FBQ04sVUFBSSxFQUFFLEdBQUcsQ0FDUixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FDeEIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUNyRixFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQ04sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUNwQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FDaEcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FB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RyxDQUFDO0FBQUMsQUFDZCxRQUFJLENBQUMsSUFBSSxHQUFHLEdBQUc7QUFBQyxBQUNoQixRQUFJLENBQUMsSUFBSSxHQUFHLENBQUM7QUFBQyxBQUNkLFFBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRzs7OztBQUFDLEFBSWhCLFFBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQztBQUFDLEFBQ3ZCLFFBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQzs7OztBQUFDLEFBSTNCLFFBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRztBQUFDLEFBQ2pCLFFBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRztBQUFDLEFBQ2xCLFFBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSTtBQUFDLEFBQ3hCLFFBQUksQ0FBQyxJQUFJLEdBQUcsS0FBSztBQUFDLEFBQ2xCLFFBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUTtBQUFDLEFBQ3pCLFFBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSTtBQUFDLEFBQzFCLFFBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRTtBQUFDLEFBQ3JCLFFBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQztBQUFDLEFBQ25CLFFBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSztBQUFDLEFBQ3RCLFFBQUksQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDO0FBQ3pCLFFBQUksQ0FBQyxXQUFXLEdBQUcsU0FBUztBQUFDLEFBQzdCLFFBQUksQ0FBQyxZQUFZLEdBQUcsRUFBRTtBQUFDLEFBQ3ZCLFFBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRTtBQUFDLEFBQ2xCLFFBQUksQ0FBQyxlQUFlLEdBQUcsU0FBUztBQUFDLEFBQ2pDLFFBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQztBQUFDLEFBQ3JCLFFBQUksQ0FBQyxXQUFXLEdBQUcsU0FBUztBQUFDLEFBQzdCLFFBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQztBQUFDLEFBQ3RCLFFBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQztB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LEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNsQztBQUNELFNBQUksQ0FBQyxLQUFLLElBQUksRUFBRTtBQUNmLFVBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQUUsY0FBTyxLQUFLLENBQUM7T0FBRTtBQUMvQixPQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNsQztBQUNELFNBQUksQ0FBQyxLQUFLLElBQUksRUFBRTtBQUNmLFVBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQUUsY0FBTyxLQUFLLENBQUM7T0FBRTtBQUMvQixPQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNsQzs7QUFFRCxTQUFJLEdBQUcsR0FBRyxPQUFPLENBQ2hCLENBQUMsS0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQzFCLENBQUMsS0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQzFCLENBQUMsS0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQzFCLENBQUM7QUFDRixTQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLEVBQUU7QUFDcEIsVUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ2pEO0FBQ0QsU0FBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQ2pCLFVBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDOUY7QUFDRCxTQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7O0FBQUMsQUFHOUYsU0FBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekQsU0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckIsU0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckIsU0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRXJCLFNBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDeEIsQ0FBQzs7QUFHRixRQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsR0FBRyxFQUFFLEtBQUssRUFBRTtBQUN2QyxTQUFJLENBQUMsQ0FBQztBQUNOLFNBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsc0NBQXNDLENBQUMsRUFBRTs7OztBQUkxRCxVQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFOztBQUV0QixXQUFJLENBQUMsT0FBTyxDQUNYLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsRUFBQyxFQUFFLENBQUMsRUFDN0IsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxFQUFDLEVBQUUsQ0FBQyxFQUM3QixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEVBQUMsRUFBRSxDQUFDLEVBQzdCLEtBQUssQ0FDTCxDQUFDO09BQ0YsTUFBTTs7QUFFTixXQUFJLENBQUMsT0FBTyxDQUNYLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUMsRUFBRSxDQUFDLEVBQzVDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUMsRUFBRSxDQUFDLEVBQzVDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUMsRUFBRSxDQUFDLEVBQzVDLEtBQUssQ0FDTCxDQUFDO09BQ0Y7QUFDRCxhQUFPLElBQUksQ0FBQztNQUVa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LENBQUMsRUFBRTtBQUMxQixNQUFDLElBQUksR0FBRyxDQUFDO0FBQ1QsTUFBQyxJQUFJLEdBQUcsQ0FBQztBQUNULE1BQUMsSUFBSSxHQUFHLENBQUM7QUFDVCxTQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xDLFNBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEMsU0FBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNkLFNBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUFFLGFBQU8sQ0FBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUUsQ0FBQztNQUFFO0FBQzdDLFNBQUksQ0FBQyxHQUFHLENBQUMsS0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQSxHQUFFLENBQUMsR0FBSSxDQUFDLEtBQUcsQ0FBQyxHQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUEsR0FBRSxDQUFDLEdBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQSxHQUFFLENBQUMsQUFBQyxDQUFDO0FBQzVELFlBQU8sQ0FDTixFQUFFLElBQUksQ0FBQyxLQUFHLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBLEFBQUMsRUFDaEIsR0FBRyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUEsQUFBQyxFQUNYLEdBQUcsR0FBRyxDQUFDLENBQ1AsQ0FBQztLQUNGOzs7Ozs7OztBQUFBLEFBU0QsYUFBUyxPQUFPLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDMUIsU0FBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUEs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LENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDakQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDakQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDOUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDNUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRTVDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNuRCxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM1QyxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqRCxTQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNyRCxTQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNyRCxTQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNwRCxTQUFHLENBQUMsTUFBTSxDQUFDLEdB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QUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7QUFDN0IsUUFBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLFlBQVksR0FBRyxJQUFJLENBQUM7OztBQUFDLEFBR2pELE1BQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUM7QUFDbkMsTUFBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO0FBQ3BELE1BQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO0FBQzVDLE1BQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDO0FBQy9DLFFBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxZQUFZLEdBQUcsSUFBSSxDQUFDOzs7OztBQUFDLEFBS2pELE1BQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FDdkIsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUN0QixNQUFNLENBQUM7QUFDUixRQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ3JDLFFBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsR0FBRyxDQUFDOzs7QUFBQyxBQUdyQyxNQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDO0FBQ2xDLE1BQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztBQUN0QyxNQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxJ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QyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsR0FBQyxDQUFDLEdBQUMsR0FBRyxDQUFDLENBQUMsT0FBTSxDQUFDLENBQUMsSUFBSSxHQUFDLGtCQUFrQixFQUFDLENBQUMsQ0FBQSxDQUFBO1NBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUMsT0FBTyxFQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxVQUFTLENBQUMsRUFBQztBQUFDLGNBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFBO1NBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQTtPQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQTtLQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsVUFBVSxJQUFFLE9BQU8sT0FBTyxJQUFFLE9BQU8sRUFBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxFQUFDLENBQUMsRUFBRTtBQUFDLE9BQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUFBLE9BQU8sQ0FBQyxDQUFBO0dBQUMsQ0FBQSxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsVUFBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLGdCQUFVLElBQUcsTUFBTSxDQUFDLElBQUksS0FBRyxXQUFXLElBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsS0FB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QyxDQUFDLEtBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsSUFBSSxHQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsbUJBQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFFLElBQUksQ0FBQTtXQUFDLEVBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBQyxVQUFTLENBQUMsRUFBQztBQUFDLG1CQUFPLENBQUMsSUFBRSxFQUFFLEVBQUMsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLENBQUMsS0FBRyxDQUFDLENBQUMsQ0FBQTtXQUFDLEVBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBQyxZQUFVO0FBQUMsZ0JBQUksQ0FBQztnQkFBQyxDQUFDLEdBQUMsU0FBUztnQkFBQyxDQUFDLEdBQUMsQ0FBQztnQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU07Z0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDO0FBQUcsZUFBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLENBQUMsS0FBRyxDQUFDLENBQUMsS0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLENBQUM7cUJBQU0sRUFBRSxDQUFDLEdBQUMsQ0FBQyxFQUFFLENBQUMsSUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQTtXQUFDLEVBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxZQUFVO0FBQUMsZ0JBQUksQ0FBQztnQkFBQyxDQUFDO2dCQUFDLENBQUMsR0FBQyxTQUFTO2dCQUFDLENBQUMsR0FBQyxDQUFDO2dCQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTTtnQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUM7QUFBRyxtQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEtBQUcsQ0FBQyxDQUFDO0FBQUUsb0JBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLENBQUMsQ0FBQztlQUFBO3FCQUFNLEVBQUUsQ0FBQyxHQUFDLENBQUMsRUFBRSxDQUFDLElBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUE7V0FBQyxFQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUMsVUFBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsYUFBQyxJQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsS0FBRyxDQUFDLENBQUMsSUFBRSxRQUFRLEdBQUMsQ0FBQyxLQUFHLENBQUMsQ0FBQyxJQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxLQUFHLENBQUMsQ0FBQyxJQUFFLENBQUMsS0FBRyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUE7V0FBQyxFQUFDLENBQUMsQ0FBQyxRQUFRLEdBQUMsWUFBVTtBQUFDLG1CQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7V0FBQyxFQUFDLENBQUMsQ0FBQyxjQUFjLENBQUEsRUFBQztBQUFDLGdCQUFJLENBQUMsR0FBQyxFQUFDLEdBQUcsRUFBQyxDQUFDLEVBQUMsVUFBVSxFQUFDLENBQUMsQ0FBQyxFQUFDLFlBQVksRUFBQyxDQUFDLENBQUMsRUFBQyxDQUFDLElBQUc7QUFBQyxlQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUE7YUFBQyxDQUFBLE9BQU0sQ0FBQyxFQUFD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Q0FBQyxJQUFFLElBQUksS0FBRyxDQUFDLEVBQUMsTUFBTSxJQUFJLFNBQVMsQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUMsQ0FBQyxFQUFFLEVBQUM7QUFBQyxjQUFJLENBQUMsR0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxLQUFLLENBQUMsS0FBRyxDQUFDLElBQUUsSUFBSSxLQUFHLENBQUMsRUFBQyxLQUFJLElBQUksQ0FBQyxHQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsRUFBRSxFQUFDO0FBQUMsZ0JBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQUMsQ0FBQyxHQUFDLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUcsQ0FBQyxJQUFFLENBQUMsQ0FBQyxVQUFVLEtBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLENBQUE7V0FBQztTQUFDLE9BQU8sQ0FBQyxDQUFBO09BQUMsU0FBUyxDQUFDLEdBQUU7QUFBQyxjQUFNLENBQUMsTUFBTSxJQUFFLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFDLFFBQVEsRUFBQyxFQUFDLFVBQVUsRUFBQyxDQUFDLENBQUMsRUFBQyxZQUFZLEVBQUMsQ0FBQyxDQUFDLEVBQUMsUUFBUSxFQUFDLENBQUMsQ0FBQyxFQUFDLEtBQUssRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFBO09BQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxFQUFDLE1BQU0sRUFBQyxDQUFDLEVBQUMsUUFBUSxFQUFDLENBQUMsRUFBQyxDQUFBO0tBQUMsRUFBQyxFQUFFLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxVQUFTLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsZUFBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLGdCQUFRLFlBQVMsQ0FBQyx5Q0FBRCxDQUFDLEVBQUEsR0FBQyxDQUFDLEdBQUMsRUFBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxHQUFDLEtBQUssQ0FBQyxLQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUcsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxHQUFDLEVBQUUsR0FBQyxFQUFFLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxVQUFVLEtBQUcsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxRQUFRLEdBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBQyxFQUFFLEVBQUMsQ0FBQyxHQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxFQUFFLENBQUMsRUFBQztBQUFDLGNBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUEsSUFBRyxDQUFDLENBQUMsSUFBSSxJQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUM7QUFBQyxnQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUk7Z0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBRyxVQUFVLEtBQUcsQ0FBQyxDQUFDLElBQUksSUFBRSxPQUFPLEtBQUcsQ0FBQyxDQUFDLElBQUksSUFBRSxDQUFDLENBQUMsT0FBTyxLQUFHLENBQUMsR0FBQyxLQUFLLENBQUMsQ0FBQSxBQUFDLEVBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQSxFQUFDO0FBQUMsbUJBQUcsVUFBVSxLQUFHLENBQUMsQ0FBQyxJQUFJLElBQUUsQ0FBQyxDQUFDLE9BQU8sS0FBRyxDQUFDLEdBQUMsRUFBRSxDQUFBLEFBQUMsRUFBQyxPQUFPLEtBQUcsQ0FBQyxDQUFDLElBQUksS0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFFLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLE9BQU8sS0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLENBQUMsSUFBRSxPQUFPLElBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQSxFQUFDLFNBQVE7YUFBQyxNQUFLLElBQUcsQ0FBQyxDQUFDLEVBQUMsU0FBUyxJQUFHLGlCQUFpQixLQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUk7QUFBQyxlQUFDLEdBQUMsRUFBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxFQUFFLENBQUMsRUFBQztBQUFDLG9CQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxJQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUs7b0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLElBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLElBQUUsQ0FBQyxLQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksSUFBRSxJQUFJLEtBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLElBQUksRUFBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFBLEFBQUMsQ0FBQTtlQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLEVBQUUsQ0FBQyxDQUFBLEFBQUMsQ0FBQTthQUFDO1dBQUM7U0FBQyxJQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUMsS0FBSSxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQUMsV0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxFQUFFLENBQUMsQ0FBQSxBQUFDLENBQUM7U0FBQSxPQUFPLENBQUMsQ0FBQTtPQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQztBQUFDLFlBQUksQ0FBQyxHQUFDLEVBQUU7WUFBQyxDQUFDLEdBQUMsYUFBYTtZQUFDLENBQUMsR0FBQyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLElBQUksTUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDO0FBQUUsV0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUFBLE9BQU8sQ0FBQyxDQUFBO09BQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxZQUFHLENBQUMsS0FBRyxDQUFDLENBQUMsTUFBTSxFQUFDLE9BQU8sQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFO1lBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBRyxJQUFJLEtBQUcsQ0FBQyxFQUFDLE9BQU8sQ0FBQyxHQUFDLENBQUMsSUFBRSxFQUFFLEVBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsT0FBTyxJQUFFLEVBQUUsRUFBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLENBQUMsSUFBRyxDQUFDLEVBQUM7QUFBQyxjQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2NBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLEdBQUMsQ0FBQyxJQUFFLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUEsSUFBRyxDQUFDLEdBQUMsQ0FBQyxJQUFFLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxDQUFBO1NBQUMsTUFBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUE7T0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLFlBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLEVBQUM7QUFBQyxjQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUE7U0FBQyxNQUFJO0FBQUMsY0FBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBLEdBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQTtTQUFDLE9BQU8sQ0FBQyxDQUFBO09BQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxlQUFPLENBQUMsR0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBQyxNQUFNLENBQUMsRUFBQyxDQUFDLEdBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFDLEdBQUcsQ0FBQyxFQUFDLENBQUMsSUFBRSxDQUFDLEdBQUMsR0FBRyxHQUFDLEVBQUUsQ0FBQSxBQUFDLEdBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEdBQUMsR0FBRyxHQUFDLENBQUMsQ0FBQTtPQUFDLElBQUksQ0FBQyxHQUFDLHVDQUF1QztVQUFDLENBQUMsR0FBQyxvQ0FBb0M7VUFBQyxDQUFDLEdBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUE7S0FBQyxFQUFDLEVBQUUsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLFVBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxPQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsU0FBQyxDQUFBLFVBQVMsQ0FBQyxFQUFDO0FBQUMsY0FBRyxRQUFRLFlBQVMsQ0FBQyx5Q0FBRCxDQUFDLEVBQUEsSUFBRSxXQUFXLElBQUUsT0FBTyxDQUFDLEVBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLElBQUcsVUFBVSxJQUFFLE9BQU8sQ0FBQyxJQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxLQUFJO0FBQUMsZ0JBQUksQ0FBQyxDQUFDLENBQUMsR0FBQyxXQUFXLElBQUUsT0FBTyxNQUFNLEdBQUMsTUFBTSxHQUFDLFdBQVcsSUFBRSxPQUFPLENBQUMsR0FBQyxDQUFDLEdBQUMsV0FBVyxJQUFFLE9BQU8sSUFBSSxHQUFDLElBQUksR0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLFNBQVMsR0FBQyxDQUFDLEVBQUUsQ0FBQTtXQUFDO1NBQUMsQ0FBQSxDQUFDLFlBQVU7QUFBQyxpQkFBTyxDQUFBLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMscUJBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxrQkFBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQztBQUFDLG9CQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDO0FBQUMsc0JBQUksQ0FBQyxHQUFDLFVBQVUsSUFBRSxPQUFPLENBQUMsSUFBRSxDQUFDLENBQUMsSUFBRyxDQUFDLENBQUMsSUFBRSxDQUFDLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsSUFBSSxLQUFLLENBQUMsc0JBQXNCLEdBQUMsQ0FBQyxHQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU0sQ0FBQyxDQUFDLElBQUksR0FBQyxrQkFBa0IsRUFBQyxDQUFDLENBQUEsQ0FBQTtpQkFBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBQyxPQUFPLEVBQUMsRUFBRSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsc0JBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFBO2lCQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUE7ZUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUE7YUFBQyxLQUFJLElBQUksQ0FBQyxHQUFDLFVBQVUsSUFBRSxPQUFPLENBQUMsSUFBRSxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxDQUFDLEVBQUU7QUFBQyxlQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7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QUFDLG9CQUFvQixFQUFDLHVCQUF1QixDQUFDLEVBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsUUFBUSxHQUFDLENBQUMsQ0FBQyxFQUFDLDhCQUE4QixFQUFDLFdBQVcsQ0FBQyxFQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUMsQ0FBQyxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsUUFBUSxHQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsRUFBQyxTQUFTLEVBQUMsVUFBVSxDQUFDLEVBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUMsd0RBQXdELEVBQUMsUUFBUSxDQUFDLENBQUE7YUFBQyxFQUFDLEVBQUUsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLFVBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyx1QkFBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLHdCQUFRLFlBQVMsQ0FBQyx5Q0FBRCxDQUFDLEVBQUEsR0FBQyxDQUFDLEdBQUMsRUFBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxHQUFDLEtBQUssQ0FBQyxLQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUcsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxHQUFDLEVBQUUsR0FBQyxFQUFFLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxVQUFVLEtBQUcsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxRQUFRLEdBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBQyxFQUFFLEVBQUMsQ0FBQyxHQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxFQUFFLENBQUMsRUFBQztBQUFDLHNCQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLElBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFBLElBQUcsQ0FBQyxDQUFDLElBQUksSUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFDO0FBQUMsd0JBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJO3dCQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUcsVUFBVSxLQUFHLENBQUMsQ0FBQyxJQUFJLElBQUUsT0FBTyxLQUFHLENBQUMsQ0FBQyxJQUFJLElBQUUsQ0FBQyxDQUFDLE9BQU8sS0FBRyxDQUFDLEdBQUMsS0FBSyxDQUFDLENBQUEsQUFBQyxFQUFDLENBQUMsQ0FBQyxLQUFLLENBQUEsRUFBQztBQUFDLDJCQUFHLFVBQVUsS0FBRyxDQUFDLENBQUMsSUFBSSxJQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUcsQ0FBQyxHQUFDLEVBQUUsQ0FBQSxBQUFDLEVBQUMsT0FBTyxLQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBRSxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxPQUFPLEtBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLEVBQUMsQ0FBQyxDQUFDLElBQUUsT0FBTyxJQUFFLENBQUMsQ0FBQyxJQUFJLENBQUEsRUFBQyxTQUFRO3FCQUFDLE1BQUssSUFBRyxDQUFDLENBQUMsRUFBQyxTQUFTLElBQUcsaUJBQWlCLEtBQUcsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSTtBQUFDLHVCQUFDLEdBQUMsRUFBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxFQUFFLENBQUMsRUFBQztBQUFDLDRCQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxJQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUs7NEJBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLElBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLElBQUUsQ0FBQyxLQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksSUFBRSxJQUFJLEtBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLElBQUksRUFBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFBLEFBQUMsQ0FBQTt1QkFBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsS0FBSyxLQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxFQUFFLENBQUMsQ0FBQSxBQUFDLENBQUE7cUJBQUM7bUJBQUM7aUJBQUMsSUFBRyxDQUFDLENBQUMsS0FBSyxFQUFDLEtBQUksSUFBSSxDQUFDLElBQUksQ0FBQztBQUFDLG1CQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLEVBQUUsQ0FBQyxDQUFBLEFBQUMsQ0FBQztpQkFBQSxPQUFPLENBQUMsQ0FBQTtlQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQztBQUFDLG9CQUFJLENBQUMsR0FBQyxFQUFFO29CQUFDLENBQUMsR0FBQyxhQUFhO29CQUFDLENBQUMsR0FBQyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUM7b0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxJQUFJLE1BQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQztBQUFFLG1CQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUFBLE9BQU8sQ0FBQyxDQUFBO2VBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxvQkFBRyxDQUFDLEtBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBQyxPQUFPLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRTtvQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxJQUFHLElBQUksS0FBRyxDQUFDLEVBQUMsT0FBTyxDQUFDLEdBQUMsQ0FBQyxJQUFFLEVBQUUsRUFBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxPQUFPLElBQUUsRUFBRSxFQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxFQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsRUFBQztBQUFDLHNCQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3NCQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxHQUFDLENBQUMsSUFBRSxFQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBLElBQUcsQ0FBQyxHQUFDLENBQUMsSUFBRSxFQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsQ0FBQTtpQkFBQyxNQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQTtlQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsb0JBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLEVBQUM7QUFBQyxzQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBO2lCQUFDLE1BQUk7QUFBQyxzQkFB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LENBQUMsQ0FBQyxDQUFDLFdBQVcsSUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUMsV0FBVyxHQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUMsTUFBTSxFQUFDLENBQUMsQ0FBQyxHQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsR0FBQyxVQUFTLENBQUMsRUFBQztBQUFDLDBCQUFHLFFBQVEsWUFBUyxDQUFDLHlDQUFELENBQUMsRUFBQSxFQUFDO0FBQUMsNEJBQUksQ0FBQyxHQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQTt1QkFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7cUJBQUMsRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO21CQUFDLEVBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLEdBQUMsRUFBQyxHQUFHLEVBQUMsRUFBQyxJQUFJLEVBQUMsSUFBSSxFQUFDLElBQUksRUFBQyxRQUFRLEVBQUMsU0FBUyxFQUFDLDJCQUEyQixFQUFDLEtBQUssRUFBQyxpQkFBVTtBQUFDLDBCQUFJLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQyxDQUFBO3FCQUFDLEVBQUMsRUFBQyxFQUFFLEVBQUMsRUFBQyxJQUFJLEVBQUMsUUFBUSxFQUFDLElBQUksRUFBQyxRQUFRLEVBQUMsU0FBUyxFQUFDLDZCQUE2QixFQUFDLEtBQUssRUFBQyxpQkFBVTtBQUFDLDBCQUFJLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQyxFQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQTtxQkFB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QUE7V0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsU0FBUyxHQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsRUFBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxPQUFPLFlBQVksTUFBTSxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxlQUFlLENBQUEsRUFBQztBQUFDLGdCQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFBO1dBQUMsT0FBTyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFNBQVMsSUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElB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QU0sRUFBQyxDQUFDLEVBQUMsbUJBQW1CLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxFQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7Q0FBQyxDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBncmF2aXRvblxuICpcbiAqIEphdmFTY3JpcHQgTi1ib2R5IEdyYXZpdGF0aW9uYWwgU2ltdWxhdG9yXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IFphdmVuIE11cmFkeWFuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqXG4gKiBSZXZpc2lvbjpcbiAqICBAUkVWSVNJT05cbiAqL1xuaW1wb3J0IEd0QXBwIGZyb20gJy4vZ3Jhdml0b24vYXBwJztcblxuZXhwb3J0IGRlZmF1bHQgeyBhcHA6IEd0QXBwIH07XG4iLCIvKipcbiAqIGdyYXZpdG9uL2FwcCAtLSBUaGUgaW50ZXJhY3RpdmUgZ3Jhdml0b24gYXBwbGljYXRpb25cbiAqL1xuLyogZ2xvYmFsIGpzY29sb3IgKi9cblxuaW1wb3J0IHZleCBmcm9tICcuLi92ZW5kb3IvdmV4JztcbmltcG9ydCByYW5kb20gZnJvbSAnLi4vdXRpbC9yYW5kb20nO1xuaW1wb3J0IEd0U2ltIGZyb20gJy4vc2ltJztcbmltcG9ydCBHdEdmeCBmcm9tICcuL2dmeCc7XG5pbXBvcnQgR3RFdmVudHMsIHsgS0VZQ09ERVMsIEVWRU5UQ09ERVMsIENPTlRST0xDT0RFUyB9IGZyb20gJy4vZXZlbnRzJztcbmltcG9ydCBHdFRpbWVyIGZyb20gJy4vdGltZXInO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdEFwcCB7XG4gICAgY29uc3RydWN0b3IoYXJncyA9IHt9KSB7XG4gICAgICAgIHRoaXMuYXJncyA9IGFyZ3M7XG5cbiAgICAgICAgdGhpcy5vcHRpb25zID0ge307XG4gICAgICAgIHRoaXMuZ3JpZCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5hbmltVGltZXIgPSBudWxsO1xuICAgICAgICB0aGlzLnNpbVRpbWVyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmV2ZW50cyA9IG51bGw7XG4gICAgICAgIHRoaXMuc2ltID0gbnVsbDtcbiAgICAgICAgdGhpcy5nZnggPSBudWxsO1xuXG4gICAgICAgIHRoaXMubm9jbGVhciA9IGZhbHNlO1xuICAgICAgICB0aGlzLnF1YWRUcmVlTGluZXMgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pbnRlcmFjdGlvbiA9IHtwcmV2aW91czoge319O1xuICAgICAgICB0aGlzLnRhcmdldEJvZHkgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMud2FzQ29sb3JQaWNrZXJBY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pc0hlbHBPcGVuID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5vcHRpb25zLndpZHRoID0gYXJncy53aWR0aCA9IGFyZ3Mud2lkdGggfHwgd2luZG93LmlubmVyV2lkdGg7XG4gICAgICAgIHRoaXMub3B0aW9ucy5oZWlnaHQgPSBhcmdzLmhlaWdodCA9IGFyZ3MuaGVpZ2h0IHx8IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICAgICAgdGhpcy5vcHRpb25zLmJhY2tncm91bmRDb2xvciA9IGFyZ3MuYmFja2dyb3VuZENvbG9yIHx8ICcjMUYyNjNCJztcblxuICAgICAgICAvLyBSZXRyaWV2ZSBjYW52YXMsIG9yIGJ1aWxkIG9uZSB3aXRoIGFyZ3VtZW50c1xuICAgICAgICB0aGlzLmdyaWQgPSB0eXBlb2YgYXJncy5ncmlkID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChhcmdzLmdyaWQpIDpcbiAgICAgICAgICAgIGFyZ3MuZ3JpZDtcblxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuZ3JpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVHcmlkKHRoaXMub3B0aW9ucy53aWR0aCwgdGhpcy5vcHRpb25zLmhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAge2JhY2tncm91bmRDb2xvcjogdGhpcy5vcHRpb25zLmJhY2tncm91bmRDb2xvcn0pO1xuICAgICAgICAgICAgYXJncy5ncmlkID0gdGhpcy5ncmlkO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb250cm9scyA9IHR5cGVvZiBhcmdzLmNvbnRyb2xzID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChhcmdzLmNvbnRyb2xzKSA6XG4gICAgICAgICAgICBhcmdzLmNvbnRyb2xzO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5jb250cm9scyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVDb250cm9scygpO1xuICAgICAgICAgICAgYXJncy5jb250cm9scyA9IHRoaXMuY29udHJvbHM7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBsYXlCdG4gPSBhcmdzLnBsYXlCdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyNwbGF5YnRuJyk7XG4gICAgICAgIHRoaXMucGF1c2VCdG4gPSBhcmdzLnBhdXNlQnRuID0gdGhpcy5jb250cm9scy5xdWVyeVNlbGVjdG9yKCcjcGF1c2VidG4nKTtcbiAgICAgICAgdGhpcy5xdWFkVHJlZU9mZkJ0biA9IGFyZ3MucXVhZFRyZWVPZmZCdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyNxdWFkdHJlZW9mZmJ0bicpO1xuICAgICAgICB0aGlzLnF1YWRUcmVlT25CdG4gPSBhcmdzLnF1YWRUcmVlT25CdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyNxdWFkdHJlZW9uYnRuJyk7XG4gICAgICAgIHRoaXMudHJhaWxPZmZCdG4gPSBhcmdzLnRyYWlsT2ZmQnRuID0gdGhpcy5jb250cm9scy5xdWVyeVNlbGVjdG9yKCcjdHJhaWxvZmZidG4nKTtcbiAgICAgICAgdGhpcy50cmFpbE9uQnRuID0gYXJncy50cmFpbE9uQnRuID0gdGhpcy5jb250cm9scy5xdWVyeVNlbGVjdG9yKCcjdHJhaWxvbmJ0bicpO1xuICAgICAgICB0aGlzLmhlbHBCdG4gPSBhcmdzLmhlbHBCdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyNoZWxwYnRuJyk7XG5cbiAgICAgICAgdGhpcy5jb2xvclBpY2tlciA9IHR5cGVvZiBhcmdzLmNvbG9yUGlja2VyID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChhcmdzLmNvbG9yUGlja2VyKSA6XG4gICAgICAgICAgICBhcmdzLmNvbG9yUGlja2VyO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5jb2xvclBpY2tlciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuY29sb3JQaWNrZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICAgICAgdGhpcy5jb2xvclBpY2tlci5jbGFzc05hbWUgPSAnYm9keWNvbG9ycGlja2VyJztcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5jb2xvclBpY2tlcik7XG4gICAgICAgICAgICBhcmdzLmNvbG9yUGlja2VyID0gdGhpcy5jb2xvclBpY2tlcjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmpzY29sb3IgPSBuZXcganNjb2xvcih0aGlzLmNvbG9yUGlja2VyLCB7XG4gICAgICAgICAgICBwYWRkaW5nOiAwLFxuICAgICAgICAgICAgc2hhZG93OiBmYWxzZSxcbiAgICAgICAgICAgIGJvcmRlcldpZHRoOiAwLFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgaW5zZXRDb2xvcjogJyMzZDU1OWUnLFxuICAgICAgICAgICAgb25GaW5lQ2hhbmdlOiB0aGlzLnVwZGF0ZUNvbG9yLmJpbmQodGhpcylcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5tZXRhSW5mbyA9IHR5cGVvZiBhcmdzLm1ldGFJbmZvID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChhcmdzLm1ldGFJbmZvKSA6XG4gICAgICAgICAgICBhcmdzLm1ldGFJbmZvO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5tZXRhSW5mbyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMubWV0YUluZm8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgICAgICB0aGlzLm1ldGFJbmZvLmNsYXNzTmFtZSA9ICdtZXRhaW5mbyc7XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMubWV0YUluZm8pO1xuICAgICAgICAgICAgYXJncy5tZXRhSW5mbyA9IHRoaXMubWV0YUluZm87XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJbml0aWFsaXplXG4gICAgICAgIHRoaXMuaW5pdENvbXBvbmVudHMoKTtcbiAgICAgICAgdGhpcy5pbml0VGltZXJzKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogbWFpbiAtLSBNYWluICdnYW1lJyBsb29wXG4gICAgICovXG4gICAgbWFpbigpIHtcbiAgICAgICAgLy8gRXZlbnQgcHJvY2Vzc2luZ1xuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIHRoaXMuZXZlbnRzLnFnZXQoKS5mb3JFYWNoKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBsZXQgcmV0dmFsO1xuXG4gICAgICAgICAgICBzd2l0Y2ggKGV2ZW50LnR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIEVWRU5UQ09ERVMuTU9VU0VET1dOOlxuICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQuYnV0dG9uID09PSAvKiByaWdodCBjbGljayAqLyAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgYm9keS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnRhcmdldEJvZHkgJiYgIXRoaXMuaW50ZXJhY3Rpb24uc3RhcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2ltLnJlbW92ZUJvZHkodGhpcy50YXJnZXRCb2R5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFRhcmdldEJvZHkodW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC5idXR0b24gPT09IC8qIG1pZGRsZSBjbGljayAqLyAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDb2xvciBwaWNraW5nXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50YXJnZXRCb2R5ICYmICF0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbG9yUGlja2VyLnN0eWxlLmxlZnQgPSBldmVudC5wb3NpdGlvbi54ICsgJ3B4JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbG9yUGlja2VyLnN0eWxlLnRvcCA9IGV2ZW50LnBvc2l0aW9uLnkgKyAncHgnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuanNjb2xvci5mcm9tU3RyaW5nKHRoaXMudGFyZ2V0Qm9keS5jb2xvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5qc2NvbG9yLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHsgLyogbGVmdCBjbGljayAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQmFzZSB0aGUgY2hlY2sgb24gdGhlIHByZXZpb3VzIHZhbHVlLCBpbiBjYXNlIHRoZSBjb2xvciBwaWNrZXIgd2FzIGp1c3RcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNsb3NlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy53YXNDb2xvclBpY2tlckFjdGl2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCBmbGFnIHRvIHNpZ25hbCBvdGhlciBldmVudHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0Qm9keSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLmJvZHkgPSB0aGlzLnRhcmdldEJvZHk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5ib2R5ID0gdGhpcy5zaW0uYWRkTmV3Qm9keSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiBldmVudC5wb3NpdGlvbi54LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogZXZlbnQucG9zaXRpb24ueVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLnByZXZpb3VzLnggPSBldmVudC5wb3NpdGlvbi54O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJhY3Rpb24ucHJldmlvdXMueSA9IGV2ZW50LnBvc2l0aW9uLnk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgcGlja2VyLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaXNDb2xvclBpY2tlckFjdGl2ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrOyAvLyBlbmQgTU9VU0VET1dOXG5cbiAgICAgICAgICAgICAgICBjYXNlIEVWRU5UQ09ERVMuTU9VU0VVUDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaW50ZXJhY3Rpb24uc3RhcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5zdGFydGVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBib2R5ID0gdGhpcy5pbnRlcmFjdGlvbi5ib2R5O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmVsWCA9IChldmVudC5wb3NpdGlvbi54IC0gYm9keS54KSAqIDAuMDAwMDAwMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2ZWxZID0gKGV2ZW50LnBvc2l0aW9uLnkgLSBib2R5LnkpICogMC4wMDAwMDAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2hlbiB0aGUgc2ltdWxhdGlvbiBpcyBhY3RpdmUsIGFkZCB0aGUgdmVsb2NpdHkgdG8gdGhlIGN1cnJlbnQgdmVsb2NpdHlcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGluc3RlYWQgb2YgY29tcGxldGVseSByZXNldHRpbmcgaXQgKHRvIGFsbG93IGZvciBtb3JlIGludGVyZXN0aW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpbnRlcmFjdGlvbnMpLlxuICAgICAgICAgICAgICAgICAgICAgICAgYm9keS52ZWxYID0gdGhpcy5zaW1UaW1lci5hY3RpdmUgPyBib2R5LnZlbFggKyB2ZWxYIDogdmVsWDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvZHkudmVsWSA9IHRoaXMuc2ltVGltZXIuYWN0aXZlID8gYm9keS52ZWxZICsgdmVsWSA6IHZlbFk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVUYXJnZXQoZXZlbnQucG9zaXRpb24ueCwgZXZlbnQucG9zaXRpb24ueSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBFVkVOVENPREVTLk1PVVNFTU9WRTpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5wcmV2aW91cy54ID0gZXZlbnQucG9zaXRpb24ueDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5wcmV2aW91cy55ID0gZXZlbnQucG9zaXRpb24ueTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQgJiYgIXRoaXMuaXNDb2xvclBpY2tlckFjdGl2ZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRhcmdldChldmVudC5wb3NpdGlvbi54LCBldmVudC5wb3NpdGlvbi55KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhazsgLy8gZW5kIE1PVVNFTU9WRVxuXG4gICAgICAgICAgICAgICAgY2FzZSBFVkVOVENPREVTLk1PVVNFV0hFRUw6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnRhcmdldEJvZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0Qm9keS5hZGp1c3RTaXplKGV2ZW50LmRlbHRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTWV0YUluZm8oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhazsgLy8gZW5kIE1PVVNFV0hFRUxcblxuICAgICAgICAgICAgICAgIGNhc2UgRVZFTlRDT0RFUy5LRVlET1dOOlxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGV2ZW50LmtleWNvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgS0VZQ09ERVMuS19FTlRFUjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVNpbSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEtFWUNPREVTLktfQzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDbGVhciBzaW11bGF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaW0uY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdmeC5jbGVhcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2ltVGltZXIuc3RvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHZhbCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEtFWUNPREVTLktfUDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVRyYWlscygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEtFWUNPREVTLktfUjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmF0ZSByYW5kb20gb2JqZWN0c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVCb2RpZXMoMTAsIHtyYW5kb21Db2xvcnM6IHRydWV9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBLRVlDT0RFUy5LX1Q6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaW0uYWRkTmV3Qm9keSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IHRoaXMub3B0aW9ucy53aWR0aCAvIDIsIHk6IHRoaXMub3B0aW9ucy5oZWlnaHQgLyAyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZWxYOiAwLCB2ZWxZOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXNzOiAyMDAwLCByYWRpdXM6IDUwLCBjb2xvcjogJyM1QTVBNUEnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaW0uYWRkTmV3Qm9keSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IHRoaXMub3B0aW9ucy53aWR0aCAtIDQwMCwgeTogdGhpcy5vcHRpb25zLmhlaWdodCAvIDIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlbFg6IDAsIHZlbFk6IDAuMDAwMDI1LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXNzOiAxLCByYWRpdXM6IDUsIGNvbG9yOiAnIzc4Nzg3OCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBLRVlDT0RFUy5LX1FVRVNUSU9OTUFSSzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dIZWxwKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7IC8vIGVuZCBLRVlET1dOXG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5QTEFZQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVNpbSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLlBBVVNFQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVNpbSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLlFVQURUUkVFT0ZGQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVF1YWRUcmVlTGluZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5RVUFEVFJFRU9OQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVF1YWRUcmVlTGluZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5UUkFJTE9GRkJUTjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVUcmFpbHMoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5UUkFJTE9OQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVRyYWlscygpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLkhFTFBCVE46XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd0hlbHAoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXR2YWw7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIC8vIFJlZHJhdyBzY3JlZW5cbiAgICAgICAgdGhpcy5yZWRyYXcoKTtcbiAgICB9XG5cbiAgICBpbml0Q29tcG9uZW50cygpIHtcbiAgICAgICAgLy8gQ3JlYXRlIGNvbXBvbmVudHMgLS0gb3JkZXIgaXMgaW1wb3J0YW50XG4gICAgICAgIHRoaXMuZXZlbnRzID0gdGhpcy5hcmdzLmV2ZW50cyA9IG5ldyBHdEV2ZW50cyh0aGlzLmFyZ3MpO1xuICAgICAgICB0aGlzLnNpbSA9IG5ldyBHdFNpbSh0aGlzLmFyZ3MpO1xuICAgICAgICB0aGlzLmdmeCA9IG5ldyBHdEdmeCh0aGlzLmFyZ3MpO1xuICAgIH1cblxuICAgIGluaXRUaW1lcnMoKSB7XG4gICAgICAgIC8vIEFkZCBgbWFpbmAgbG9vcCwgYW5kIHN0YXJ0IGltbWVkaWF0ZWx5XG4gICAgICAgIHRoaXMuYW5pbVRpbWVyID0gbmV3IEd0VGltZXIodGhpcy5tYWluLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmFuaW1UaW1lci5zdGFydCgpO1xuICAgICAgICB0aGlzLnNpbVRpbWVyID0gbmV3IEd0VGltZXIodGhpcy5zaW0uc3RlcC5iaW5kKHRoaXMuc2ltKSwgNjApO1xuICAgIH1cblxuICAgIHRvZ2dsZVNpbSgpIHtcbiAgICAgICAgaWYgKHRoaXMuc2ltVGltZXIuYWN0aXZlKSB7XG4gICAgICAgICAgICB0aGlzLnBsYXlCdG4uc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICAgICAgdGhpcy5wYXVzZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5wbGF5QnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB0aGlzLnBhdXNlQnRuLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNpbVRpbWVyLnRvZ2dsZSgpO1xuICAgIH1cblxuICAgIHRvZ2dsZVRyYWlscygpIHtcbiAgICAgICAgaWYgKHRoaXMubm9jbGVhcikge1xuICAgICAgICAgICAgdGhpcy50cmFpbE9mZkJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgICAgICB0aGlzLnRyYWlsT25CdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudHJhaWxPZmZCdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIHRoaXMudHJhaWxPbkJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ub2NsZWFyID0gIXRoaXMubm9jbGVhcjtcbiAgICB9XG5cbiAgICB0b2dnbGVRdWFkVHJlZUxpbmVzKCkge1xuICAgICAgICBpZiAodGhpcy5xdWFkVHJlZUxpbmVzKSB7XG4gICAgICAgICAgICB0aGlzLnF1YWRUcmVlT2ZmQnRuLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgICAgIHRoaXMucXVhZFRyZWVPbkJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5xdWFkVHJlZU9mZkJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgdGhpcy5xdWFkVHJlZU9uQnRuLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnF1YWRUcmVlTGluZXMgPSAhdGhpcy5xdWFkVHJlZUxpbmVzO1xuICAgIH1cblxuICAgIHNob3dIZWxwKCkge1xuICAgICAgICBpZiAodGhpcy5pc0hlbHBPcGVuKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pc0hlbHBPcGVuID0gdHJ1ZTtcbiAgICAgICAgdmV4Lm9wZW4oe1xuICAgICAgICAgICAgdW5zYWZlQ29udGVudDogYFxuICAgICAgICAgICAgICAgIDxoMz5TaG9ydGN1dHM8L2gzPlxuICAgICAgICAgICAgICAgIDx0YWJsZSBjbGFzcz1cInNob3J0Y3V0c1wiPlxuICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD5MZWZ0IGNsaWNrPC90ZD4gPHRkPiBjcmVhdGUgYm9keTwvdGQ+PC90cj5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPlJpZ2h0IGNsaWNrPC90ZD4gPHRkPiBkZWxldGUgYm9keTwvdGQ+PC90cj5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPk1pZGRsZSBjbGljazwvdGQ+IDx0ZD4gY2hhbmdlIGJvZHkgY29sb3I8L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48Y29kZT5FbnRlciBrZXk8L2NvZGU+IGtleTwvdGQ+IDx0ZD4gc3RhcnQgc2ltdWxhdGlvbjwvdGQ+PC90cj5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjxjb2RlPkM8L2NvZGU+IGtleTwvdGQ+IDx0ZD4gY2xlYXIgY2FudmFzPC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGNvZGU+UDwvY29kZT4ga2V5PC90ZD4gPHRkPiB0b2dnbGUgcmVwYWludGluZzwvdGQ+PC90cj5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjxjb2RlPlI8L2NvZGU+IGtleTwvdGQ+IDx0ZD4gY3JlYXRlIHJhbmRvbSBib2RpZXM8L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48Y29kZT5UPC9jb2RlPiBrZXk8L3RkPiA8dGQ+IGNyZWF0ZSBUaXRhbjwvdGQ+PC90cj5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjxjb2RlPj88L2NvZGU+IGtleTwvdGQ+IDx0ZD4gc2hvdyBoZWxwPC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGFmdGVyQ2xvc2U6ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmlzSGVscE9wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmVkcmF3KCkge1xuICAgICAgICBpZiAoIXRoaXMubm9jbGVhcikge1xuICAgICAgICAgICAgdGhpcy5nZnguY2xlYXIoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5xdWFkVHJlZUxpbmVzKSB7XG4gICAgICAgICAgICB0aGlzLmdmeC5kcmF3UXVhZFRyZWVMaW5lcyh0aGlzLnNpbS50cmVlLnJvb3QpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZ2Z4LmRyYXdSZXRpY2xlTGluZSh0aGlzLmludGVyYWN0aW9uLmJvZHksIHRoaXMuaW50ZXJhY3Rpb24ucHJldmlvdXMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZ2Z4LmRyYXdCb2RpZXModGhpcy5zaW0uYm9kaWVzLCB0aGlzLnRhcmdldEJvZHkpO1xuICAgIH1cblxuICAgIGdlbmVyYXRlR3JpZCh3aWR0aCwgaGVpZ2h0LCBzdHlsZSkge1xuICAgICAgICAvLyBBdHRhY2ggYSBjYW52YXMgdG8gdGhlIHBhZ2UsIHRvIGhvdXNlIHRoZSBzaW11bGF0aW9uc1xuICAgICAgICBpZiAoIXN0eWxlKSB7XG4gICAgICAgICAgICBzdHlsZSA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5ncmlkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cbiAgICAgICAgdGhpcy5ncmlkLmNsYXNzTmFtZSA9ICdncmF2aXRvbmNhbnZhcyc7XG4gICAgICAgIHRoaXMuZ3JpZC53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmdyaWQuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICB0aGlzLmdyaWQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgIHRoaXMuZ3JpZC5zdHlsZS5tYXJnaW5MZWZ0ID0gc3R5bGUubWFyZ2luTGVmdCB8fCAnYXV0byc7XG4gICAgICAgIHRoaXMuZ3JpZC5zdHlsZS5tYXJnaW5SaWdodCA9IHN0eWxlLm1hcmdpblJpZ2h0IHx8ICdhdXRvJztcbiAgICAgICAgdGhpcy5ncmlkLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHN0eWxlLmJhY2tncm91bmRDb2xvciB8fCAnIzAwMDAwMCc7XG5cbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmdyaWQpO1xuICAgIH1cblxuICAgIGdlbmVyYXRlQ29udHJvbHMoKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdtZW51Jyk7XG4gICAgICAgIHRoaXMuY29udHJvbHMudHlwZSA9ICd0b29sYmFyJztcbiAgICAgICAgdGhpcy5jb250cm9scy5pZCA9ICdjb250cm9scyc7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaW5uZXJIVE1MID0gYFxuICAgICAgICAgICAgPG1lbnVpdGVtIGlkPVwicGxheWJ0blwiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiYXNzZXRzL3BsYXkuc3ZnXCIgYWx0PVwiU3RhcnQgc2ltdWxhdGlvblwiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cInBhdXNlYnRuXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiYXNzZXRzL3BhdXNlLnN2Z1wiIGFsdD1cIlN0b3Agc2ltdWxhdGlvblwiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cInF1YWR0cmVlb2ZmYnRuXCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvcXVhZHRyZWVfb2ZmLnN2Z1wiIGFsdD1cIlRvZ2dsZSBxdWFkdHJlZSBsaW5lc1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cInF1YWR0cmVlb25idG5cIiBzdHlsZT1cImRpc3BsYXk6IG5vbmU7XCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvcXVhZHRyZWVfb24uc3ZnXCIgYWx0PVwiVG9nZ2xlIHF1YWR0cmVlIGxpbmVzXCI+XG4gICAgICAgICAgICA8L21lbnVpdGVtPlxuICAgICAgICAgICAgPG1lbnVpdGVtIGlkPVwidHJhaWxvZmZidG5cIj5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz1cImFzc2V0cy90cmFpbF9vZmYuc3ZnXCIgYWx0PVwiVG9nZ2xlIHRyYWlsc1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cInRyYWlsb25idG5cIiBzdHlsZT1cImRpc3BsYXk6IG5vbmU7XCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvdHJhaWxfb24uc3ZnXCIgYWx0PVwiVG9nZ2xlIHRyYWlsc1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cImhlbHBidG5cIj5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz1cImFzc2V0cy9oZWxwLnN2Z1wiIGFsdD1cIkhlbHBcIj5cbiAgICAgICAgICAgIDwvbWVudWl0ZW0+XG4gICAgICAgICAgICBgO1xuXG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5jb250cm9scyk7XG4gICAgfVxuXG4gICAgZ2VuZXJhdGVCb2RpZXMobnVtLCBhcmdzKSB7XG4gICAgICAgIGFyZ3MgPSBhcmdzIHx8IHt9O1xuXG4gICAgICAgIGxldCBtaW5YID0gYXJncy5taW5YIHx8IDA7XG4gICAgICAgIGxldCBtYXhYID0gYXJncy5tYXhYIHx8IHRoaXMub3B0aW9ucy53aWR0aDtcbiAgICAgICAgbGV0IG1pblkgPSBhcmdzLm1pblkgfHwgMDtcbiAgICAgICAgbGV0IG1heFkgPSBhcmdzLm1heFkgfHwgdGhpcy5vcHRpb25zLmhlaWdodDtcblxuICAgICAgICBsZXQgbWluVmVsWCA9IGFyZ3MubWluVmVsWCB8fCAwO1xuICAgICAgICBsZXQgbWF4VmVsWCA9IGFyZ3MubWF4VmVsWCB8fCAwLjAwMDAxO1xuICAgICAgICBsZXQgbWluVmVsWSA9IGFyZ3MubWluVmVsWSB8fCAwO1xuICAgICAgICBsZXQgbWF4VmVsWSA9IGFyZ3MubWF4VmVsWSB8fCAwLjAwMDAxO1xuXG4gICAgICAgIGxldCBtaW5NYXNzID0gYXJncy5taW5NYXNzIHx8IDE7XG4gICAgICAgIGxldCBtYXhNYXNzID0gYXJncy5tYXhNYXNzIHx8IDE1MDtcblxuICAgICAgICBsZXQgbWluUmFkaXVzID0gYXJncy5taW5SYWRpdXMgfHwgMTtcbiAgICAgICAgbGV0IG1heFJhZGl1cyA9IGFyZ3MubWF4UmFkaXVzIHx8IDE1O1xuXG4gICAgICAgIGxldCBjb2xvciA9IGFyZ3MuY29sb3I7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW07IGkrKykge1xuICAgICAgICAgICAgaWYgKGFyZ3MucmFuZG9tQ29sb3JzID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgY29sb3IgPSByYW5kb20uY29sb3IoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5zaW0uYWRkTmV3Qm9keSh7XG4gICAgICAgICAgICAgICAgeDogcmFuZG9tLm51bWJlcihtaW5YLCBtYXhYKSxcbiAgICAgICAgICAgICAgICB5OiByYW5kb20ubnVtYmVyKG1pblksIG1heFkpLFxuICAgICAgICAgICAgICAgIHZlbFg6IHJhbmRvbS5kaXJlY3Rpb25hbChtaW5WZWxYLCBtYXhWZWxYKSxcbiAgICAgICAgICAgICAgICB2ZWxZOiByYW5kb20uZGlyZWN0aW9uYWwobWluVmVsWSwgbWF4VmVsWSksXG4gICAgICAgICAgICAgICAgbWFzczogcmFuZG9tLm51bWJlcihtaW5NYXNzLCBtYXhNYXNzKSxcbiAgICAgICAgICAgICAgICByYWRpdXM6IHJhbmRvbS5udW1iZXIobWluUmFkaXVzLCBtYXhSYWRpdXMpLFxuICAgICAgICAgICAgICAgIGNvbG9yOiBjb2xvclxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVUYXJnZXQoeCwgeSkge1xuICAgICAgICB0aGlzLnNldFRhcmdldEJvZHkodGhpcy5zaW0uZ2V0Qm9keUF0KHgsIHkpKTtcbiAgICB9XG5cbiAgICBzZXRUYXJnZXRCb2R5KGJvZHkpIHtcbiAgICAgICAgdGhpcy50YXJnZXRCb2R5ID0gYm9keTtcbiAgICAgICAgdGhpcy51cGRhdGVNZXRhSW5mbygpO1xuICAgIH1cblxuICAgIHVwZGF0ZU1ldGFJbmZvKCkge1xuICAgICAgICBpZiAodGhpcy50YXJnZXRCb2R5KSB7XG4gICAgICAgICAgICB0aGlzLm1ldGFJbmZvLmlubmVySFRNTCA9XG4gICAgICAgICAgICAgICAgYOKKlSAke3RoaXMudGFyZ2V0Qm9keS5tYXNzLnRvRml4ZWQoMil9ICZuYnNwO2AgK1xuICAgICAgICAgICAgICAgIGDipr8gJHt0aGlzLnRhcmdldEJvZHkucmFkaXVzLnRvRml4ZWQoMil9ICZuYnNwO2AgK1xuICAgICAgICAgICAgICAgIGDih5cgJHt0aGlzLnRhcmdldEJvZHkuc3BlZWQudG9GaXhlZCgyKX1gO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5tZXRhSW5mby50ZXh0Q29udGVudCA9ICcnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlQ29sb3IoKSB7XG4gICAgICAgIGlmICh0aGlzLnRhcmdldEJvZHkpIHtcbiAgICAgICAgICAgIHRoaXMudGFyZ2V0Qm9keS51cGRhdGVDb2xvcih0aGlzLmpzY29sb3IudG9IRVhTdHJpbmcoKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpc0NvbG9yUGlja2VyQWN0aXZlKCkge1xuICAgICAgICB0aGlzLndhc0NvbG9yUGlja2VyQWN0aXZlID0gdGhpcy5jb2xvclBpY2tlci5jbGFzc05hbWUuaW5kZXhPZignanNjb2xvci1hY3RpdmUnKSA+IC0xO1xuICAgICAgICByZXR1cm4gdGhpcy53YXNDb2xvclBpY2tlckFjdGl2ZTtcbiAgICB9XG59IC8vIGVuZCBncmF2aXRvbi9hcHBcbiIsImltcG9ydCBjb2xvcnMgZnJvbSAnLi4vdXRpbC9jb2xvcnMnO1xuXG4vKipcbiAqIGdyYXZpdG9uL2JvZHkgLS0gVGhlIGdyYXZpdGF0aW9uYWwgYm9keVxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdEJvZHkge1xuICAgIGNvbnN0cnVjdG9yKGFyZ3MpIHtcbiAgICAgICAgYXJncyA9IGFyZ3MgfHwge307XG5cbiAgICAgICAgdGhpcy54ID0gYXJncy54O1xuICAgICAgICB0aGlzLnkgPSBhcmdzLnk7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy54ICE9PSAnbnVtYmVyJyB8fCB0eXBlb2YgdGhpcy55ICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0NvcnJlY3QgcG9zaXRpb25zIHdlcmUgbm90IGdpdmVuIGZvciB0aGUgYm9keS4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubmV4dFggPSB0aGlzLng7XG4gICAgICAgIHRoaXMubmV4dFkgPSB0aGlzLnk7XG5cbiAgICAgICAgdGhpcy52ZWxYID0gYXJncy52ZWxYIHx8IDA7XG4gICAgICAgIHRoaXMudmVsWSA9IGFyZ3MudmVsWSB8fCAwO1xuXG4gICAgICAgIHRoaXMucmFkaXVzID0gYXJncy5yYWRpdXMgfHwgMTA7XG4gICAgICAgIC8vIEluaXRpYWxpemVkIGJlbG93LlxuICAgICAgICB0aGlzLm1hc3MgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuY29sb3IgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0ID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIHRoaXMudXBkYXRlQ29sb3IoYXJncy5jb2xvciB8fCAnI2RiZDNjOCcpO1xuICAgICAgICB0aGlzLmFkanVzdFNpemUoMCk7XG4gICAgfVxuXG4gICAgYWRqdXN0U2l6ZShkZWx0YSkge1xuICAgICAgICB0aGlzLnJhZGl1cyA9IE1hdGgubWF4KHRoaXMucmFkaXVzICsgZGVsdGEsIDIpO1xuICAgICAgICAvLyBEb3JreSBmb3JtdWxhIHRvIG1ha2UgbWFzcyBzY2FsZSBcInByb3Blcmx5XCIgd2l0aCByYWRpdXMuXG4gICAgICAgIHRoaXMubWFzcyA9IE1hdGgucG93KHRoaXMucmFkaXVzIC8gNCwgMyk7XG4gICAgfVxuXG4gICAgdXBkYXRlQ29sb3IoY29sb3IpIHtcbiAgICAgICAgdGhpcy5jb2xvciA9IGNvbG9yO1xuICAgICAgICB0aGlzLmhpZ2hsaWdodCA9IGNvbG9ycy50b0hleChjb2xvcnMuYnJpZ2h0ZW4oY29sb3JzLmZyb21IZXgodGhpcy5jb2xvciksIC4yNSkpO1xuICAgIH1cblxuICAgIGdldCBzcGVlZCgpIHtcbiAgICAgICAgLy8gVmVsb2NpdGllcyBhcmUgdGlueSwgc28gdXBzY2FsZSBpdCAoYXJiaXRyYXJpbHkpIHRvIG1ha2UgaXQgcmVhZGFibGUuXG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy52ZWxYICogdGhpcy52ZWxYICsgdGhpcy52ZWxZICogdGhpcy52ZWxZKSAqIDFlNjtcbiAgICB9XG59IC8vIGVuZCBncmF2aXRvbi9ib2R5XG4iLCIvKipcbiAqIGdyYXZpdG9uL2V2ZW50cyAtLSBFdmVudCBxdWV1ZWluZyBhbmQgcHJvY2Vzc2luZ1xuICovXG5leHBvcnQgY29uc3QgS0VZQ09ERVMgPSB7XG4gICAgS19MRUZUOiAzNyxcbiAgICBLX1VQOiAzOCxcbiAgICBLX1JJR0hUOiAzOSxcbiAgICBLX0RPV046IDQwLFxuXG4gICAgS18wOiA0OCxcbiAgICBLXzE6IDQ5LFxuICAgIEtfMjogNTAsXG4gICAgS18zOiA1MSxcbiAgICBLXzQ6IDUyLFxuICAgIEtfNTogNTMsXG4gICAgS182OiA1NCxcbiAgICBLXzc6IDU1LFxuICAgIEtfODogNTYsXG4gICAgS185OiA1NyxcblxuICAgIEtfQTogNjUsXG4gICAgS19COiA2NixcbiAgICBLX0M6IDY3LFxuICAgIEtfRDogNjgsXG4gICAgS19FOiA2OSxcbiAgICBLX0Y6IDcwLFxuICAgIEtfRzogNzEsXG4gICAgS19IOiA3MixcbiAgICBLX0k6IDczLFxuICAgIEtfSjogNzQsXG4gICAgS19LOiA3NSxcbiAgICBLX0w6IDc2LFxuICAgIEtfTTogNzcsXG4gICAgS19OOiA3OCxcbiAgICBLX086IDc5LFxuICAgIEtfUDogODAsXG4gICAgS19ROiA4MSxcbiAgICBLX1I6IDgyLFxuICAgIEtfUzogODMsXG4gICAgS19UOiA4NCxcbiAgICBLX1U6IDg1LFxuICAgIEtfVjogODYsXG4gICAgS19XOiA4NyxcbiAgICBLX1g6IDg4LFxuICAgIEtfWTogODksXG4gICAgS19aOiA5MCxcblxuICAgIEtfS1AxOiA5NyxcbiAgICBLX0tQMjogOTgsXG4gICAgS19LUDM6IDk5LFxuICAgIEtfS1A0OiAxMDAsXG4gICAgS19LUDU6IDEwMSxcbiAgICBLX0tQNjogMTAyLFxuICAgIEtfS1A3OiAxMDMsXG4gICAgS19LUDg6IDEwNCxcbiAgICBLX0tQOTogMTA1LFxuXG4gICAgS19RVUVTVElPTk1BUks6IDE5MSxcblxuICAgIEtfQkFDS1NQQUNFOiA4LFxuICAgIEtfVEFCOiA5LFxuICAgIEtfRU5URVI6IDEzLFxuICAgIEtfU0hJRlQ6IDE2LFxuICAgIEtfQ1RSTDogMTcsXG4gICAgS19BTFQ6IDE4LFxuICAgIEtfRVNDOiAyNyxcbiAgICBLX1NQQUNFOiAzMlxufTtcblxuZXhwb3J0IGNvbnN0IE1PVVNFQ09ERVMgPSB7XG4gICAgTV9MRUZUOiAwLFxuICAgIE1fTUlERExFOiAxLFxuICAgIE1fUklHSFQ6IDJcbn07XG5cbmV4cG9ydCBjb25zdCBFVkVOVENPREVTID0ge1xuICAgIE1PVVNFRE9XTjogMTAwMCxcbiAgICBNT1VTRVVQOiAxMDAxLFxuICAgIE1PVVNFTU9WRTogMTAwMixcbiAgICBNT1VTRVdIRUVMOiAxMDAzLFxuICAgIENMSUNLOiAxMDA0LFxuICAgIERCTENMSUNLOiAxMDA1LFxuXG4gICAgS0VZRE9XTjogMTAxMCxcbiAgICBLRVlVUDogMTAxMVxufTtcblxuZXhwb3J0IGNvbnN0IENPTlRST0xDT0RFUyA9IHtcbiAgICBQTEFZQlROOiAyMDAwLFxuICAgIFBBVVNFQlROOiAyMDAxLFxuICAgIFRSQUlMT0ZGQlROOiAyMDAyLFxuICAgIFRSQUlMT05CVE46IDIwMDMsXG4gICAgSEVMUEJUTjogMjAwNCxcbiAgICBRVUFEVFJFRU9GRkJUTjogMjAwNSxcbiAgICBRVUFEVFJFRU9OQlROOiAyMDA2XG59O1xuXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd0RXZlbnRzIHtcbiAgICBjb25zdHJ1Y3RvcihhcmdzKSB7XG4gICAgICAgIGFyZ3MgPSBhcmdzIHx8IHt9O1xuXG4gICAgICAgIHRoaXMucXVldWUgPSBbXTtcblxuICAgICAgICBpZiAodHlwZW9mIGFyZ3MuZ3JpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdObyB1c2FibGUgY2FudmFzIGVsZW1lbnQgd2FzIGdpdmVuLicpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZ3JpZCA9IGFyZ3MuZ3JpZDtcbiAgICAgICAgdGhpcy5jb250cm9scyA9IGFyZ3MuY29udHJvbHM7XG4gICAgICAgIHRoaXMucGxheUJ0biA9IGFyZ3MucGxheUJ0bjtcbiAgICAgICAgdGhpcy5wYXVzZUJ0biA9IGFyZ3MucGF1c2VCdG47XG4gICAgICAgIHRoaXMucXVhZFRyZWVPZmZCdG4gPSBhcmdzLnF1YWRUcmVlT2ZmQnRuO1xuICAgICAgICB0aGlzLnF1YWRUcmVlT25CdG4gPSBhcmdzLnF1YWRUcmVlT25CdG47XG4gICAgICAgIHRoaXMudHJhaWxPZmZCdG4gPSBhcmdzLnRyYWlsT2ZmQnRuO1xuICAgICAgICB0aGlzLnRyYWlsT25CdG4gPSBhcmdzLnRyYWlsT25CdG47XG4gICAgICAgIHRoaXMuaGVscEJ0biA9IGFyZ3MuaGVscEJ0bjtcblxuICAgICAgICB0aGlzLndpcmV1cEV2ZW50cygpO1xuICAgIH1cblxuICAgIHFhZGQoZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xdWV1ZS5wdXNoKGV2ZW50KTtcbiAgICB9XG5cbiAgICBxcG9sbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucXVldWUuc2hpZnQoKTtcbiAgICB9XG5cbiAgICBxZ2V0KCkge1xuICAgICAgICAvLyBSZXBsYWNpbmcgdGhlIHJlZmVyZW5jZSBpcyBmYXN0ZXIgdGhhbiBgc3BsaWNlKClgXG4gICAgICAgIGxldCByZWYgPSB0aGlzLnF1ZXVlO1xuICAgICAgICB0aGlzLnF1ZXVlID0gW107XG4gICAgICAgIHJldHVybiByZWY7XG4gICAgfVxuXG4gICAgcWNsZWFyKCkge1xuICAgICAgICB0aGlzLnF1ZXVlID0gW107XG4gICAgfVxuXG4gICAgd2lyZXVwRXZlbnRzKCkge1xuICAgICAgICAvLyBHcmlkIG1vdXNlIGV2ZW50c1xuICAgICAgICB0aGlzLmdyaWQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNsaWNrLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZGJsY2xpY2snLCB0aGlzLmhhbmRsZURibENsaWNrLmJpbmQodGhpcykpO1xuXG4gICAgICAgIHRoaXMuZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIHRoaXMuaGFuZGxlQ29udGV4dE1lbnUuYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLmhhbmRsZU1vdXNlRG93bi5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5ncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLmhhbmRsZU1vdXNlVXAuYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLmhhbmRsZU1vdXNlTW92ZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5ncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ3doZWVsJywgdGhpcy5oYW5kbGVNb3VzZVdoZWVsLmJpbmQodGhpcykpO1xuXG4gICAgICAgIC8vIEdyaWQga2V5IGV2ZW50c1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5oYW5kbGVLZXlEb3duLmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuaGFuZGxlS2V5VXAuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgLy8gQ29udHJvbCBldmVudHNcbiAgICAgICAgdGhpcy5wbGF5QnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDb250cm9sQ2xpY2suYmluZCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICBDT05UUk9MQ09ERVMuUExBWUJUTikpO1xuICAgICAgICB0aGlzLnBhdXNlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDb250cm9sQ2xpY2suYmluZCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICBDT05UUk9MQ09ERVMuUEFVU0VCVE4pKTtcbiAgICAgICAgdGhpcy5xdWFkVHJlZU9mZkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ29udHJvbENsaWNrLmJpbmQodGhpcyxcbiAgICAgICAgICAgICAgICAgICAgQ09OVFJPTENPREVTLlFVQURUUkVFT0ZGQlROKSk7XG4gICAgICAgIHRoaXMucXVhZFRyZWVPbkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ29udHJvbENsaWNrLmJpbmQodGhpcyxcbiAgICAgICAgICAgICAgICAgICAgQ09OVFJPTENPREVTLlFVQURUUkVFT05CVE4pKTtcbiAgICAgICAgdGhpcy50cmFpbE9mZkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ29udHJvbENsaWNrLmJpbmQodGhpcyxcbiAgICAgICAgICAgICAgICAgICAgQ09OVFJPTENPREVTLlRSQUlMT0ZGQlROKSk7XG4gICAgICAgIHRoaXMudHJhaWxPbkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ29udHJvbENsaWNrLmJpbmQodGhpcyxcbiAgICAgICAgICAgICAgICAgICAgQ09OVFJPTENPREVTLlRSQUlMT05CVE4pKTtcbiAgICAgICAgdGhpcy5oZWxwQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDb250cm9sQ2xpY2suYmluZCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICBDT05UUk9MQ09ERVMuSEVMUEJUTikpO1xuICAgIH1cblxuICAgIGhhbmRsZUNsaWNrKGV2ZW50KSB7XG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiBFVkVOVENPREVTLkNMSUNLLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuZ2V0UG9zaXRpb24oZXZlbnQpLFxuICAgICAgICAgICAgYnV0dG9uOiBldmVudC5idXR0b24sXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlRGJsQ2xpY2soZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuREJMQ0xJQ0ssXG4gICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5nZXRQb3NpdGlvbihldmVudCksXG4gICAgICAgICAgICBidXR0b246IGV2ZW50LmJ1dHRvbixcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBoYW5kbGVDb250ZXh0TWVudShldmVudCkge1xuICAgICAgICAvLyBQcmV2ZW50IHJpZ2h0LWNsaWNrIG1lbnVcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICBoYW5kbGVNb3VzZURvd24oZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuTU9VU0VET1dOLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuZ2V0UG9zaXRpb24oZXZlbnQpLFxuICAgICAgICAgICAgYnV0dG9uOiBldmVudC5idXR0b24sXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlTW91c2VVcChldmVudCkge1xuICAgICAgICB0aGlzLnFhZGQoe1xuICAgICAgICAgICAgdHlwZTogRVZFTlRDT0RFUy5NT1VTRVVQLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuZ2V0UG9zaXRpb24oZXZlbnQpLFxuICAgICAgICAgICAgYnV0dG9uOiBldmVudC5idXR0b24sXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlTW91c2VNb3ZlKGV2ZW50KSB7XG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiBFVkVOVENPREVTLk1PVVNFTU9WRSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmdldFBvc2l0aW9uKGV2ZW50KSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogZXZlbnQudGltZVN0YW1wXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGhhbmRsZU1vdXNlV2hlZWwoZXZlbnQpIHtcbiAgICAgICAgLy8gUmV2ZXJzZSB0aGUgdXAvZG93bi5cbiAgICAgICAgbGV0IGRlbHRhID0gLWV2ZW50LmRlbHRhWSAvIDUwO1xuXG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiBFVkVOVENPREVTLk1PVVNFV0hFRUwsXG4gICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5nZXRQb3NpdGlvbihldmVudCksXG4gICAgICAgICAgICBkZWx0YTogZGVsdGEsXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gUHJldmVudCB0aGUgd2luZG93IGZyb20gc2Nyb2xsaW5nXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuXG4gICAgaGFuZGxlS2V5RG93bihldmVudCkge1xuICAgICAgICAvLyBBY2NvdW50IGZvciBicm93c2VyIGRpc2NyZXBhbmNpZXNcbiAgICAgICAgbGV0IGtleSA9IGV2ZW50LmtleUNvZGUgfHwgZXZlbnQud2hpY2g7XG5cbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuS0VZRE9XTixcbiAgICAgICAgICAgIGtleWNvZGU6IGtleSxcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBoYW5kbGVLZXlVcChldmVudCkge1xuICAgICAgICAvLyBBY2NvdW50IGZvciBicm93c2VyIGRpc2NyZXBhbmNpZXNcbiAgICAgICAgbGV0IGtleSA9IGV2ZW50LmtleUNvZGUgfHwgZXZlbnQud2hpY2g7XG5cbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuS0VZVVAsXG4gICAgICAgICAgICBrZXljb2RlOiBrZXksXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlQ29udHJvbENsaWNrKHR5cGUsIGV2ZW50KSB7XG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZ2V0UG9zaXRpb24oZXZlbnQpIHtcbiAgICAgICAgLy8gQ2FsY3VsYXRlIG9mZnNldCBvbiB0aGUgZ3JpZCBmcm9tIGNsaWVudFgvWSwgYmVjYXVzZVxuICAgICAgICAvLyBzb21lIGJyb3dzZXJzIGRvbid0IGhhdmUgZXZlbnQub2Zmc2V0WC9ZXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiBldmVudC5jbGllbnRYIC0gdGhpcy5ncmlkLm9mZnNldExlZnQsXG4gICAgICAgICAgICB5OiBldmVudC5jbGllbnRZIC0gdGhpcy5ncmlkLm9mZnNldFRvcFxuICAgICAgICB9O1xuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL2V2ZW50c1xuIiwiLyoqXG4gKiBncmF2aXRvbi9nZnggLS0gVGhlIGdyYXBoaWNzIG9iamVjdFxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdEdmeCB7XG4gICAgY29uc3RydWN0b3IoYXJncykge1xuICAgICAgICBhcmdzID0gYXJncyB8fCB7fTtcblxuICAgICAgICB0aGlzLmdyaWQgPSB0eXBlb2YgYXJncy5ncmlkID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChhcmdzLmdyaWQpIDpcbiAgICAgICAgICAgIGFyZ3MuZ3JpZDtcblxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuZ3JpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdObyB1c2FibGUgY2FudmFzIGVsZW1lbnQgd2FzIGdpdmVuLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jdHggPSB0aGlzLmdyaWQuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgLy8gU2V0dGluZyB0aGUgd2lkdGggaGFzIHRoZSBzaWRlIGVmZmVjdFxuICAgICAgICAvLyBvZiBjbGVhcmluZyB0aGUgY2FudmFzXG4gICAgICAgIHRoaXMuZ3JpZC53aWR0aCA9IHRoaXMuZ3JpZC53aWR0aDtcbiAgICB9XG5cbiAgICBkcmF3Qm9kaWVzKGJvZGllcywgdGFyZ2V0Qm9keSkge1xuICAgICAgICBmb3IgKGxldCBib2R5IG9mIGJvZGllcykge1xuICAgICAgICAgICAgdGhpcy5kcmF3Qm9keShib2R5LCAvKiBpc1RhcmdldGVkICovIGJvZHkgPT09IHRhcmdldEJvZHkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZHJhd0JvZHkoYm9keSwgaXNUYXJnZXRlZCkge1xuICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBib2R5LmNvbG9yO1xuXG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmN0eC5hcmMoYm9keS54LCBib2R5LnksIGJvZHkucmFkaXVzLCAwLCBNYXRoLlBJICogMiwgdHJ1ZSk7XG5cbiAgICAgICAgdGhpcy5jdHguZmlsbCgpO1xuICAgICAgICBpZiAoaXNUYXJnZXRlZCkge1xuICAgICAgICAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSBib2R5LmhpZ2hsaWdodDtcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IE1hdGgucm91bmQoYm9keS5yYWRpdXMgLyA4KTtcbiAgICAgICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZHJhd1JldGljbGVMaW5lKGZyb20sIHRvKSB7XG4gICAgICAgIGxldCBncmFkID0gdGhpcy5jdHguY3JlYXRlTGluZWFyR3JhZGllbnQoZnJvbS54LCBmcm9tLnksIHRvLngsIHRvLnkpO1xuICAgICAgICBncmFkLmFkZENvbG9yU3RvcCgwLCAncmdiYSgzMSwgNzUsIDEzMCwgMSknKTtcbiAgICAgICAgZ3JhZC5hZGRDb2xvclN0b3AoMSwgJ3JnYmEoMzEsIDc1LCAxMzAsIDAuMSknKTtcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSBncmFkO1xuICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSA2O1xuICAgICAgICB0aGlzLmN0eC5saW5lQ2FwID0gJ3JvdW5kJztcblxuICAgICAgICAvLyBEcmF3IGluaXRpYWwgYmFja2dyb3VuZCBsaW5lLlxuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5jdHgubW92ZVRvKGZyb20ueCwgZnJvbS55KTtcbiAgICAgICAgdGhpcy5jdHgubGluZVRvKHRvLngsIHRvLnkpO1xuICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcblxuICAgICAgICAvLyBEcmF3IG92ZXJsYXkgbGluZS5cbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSAnIzM0NzdDQSc7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDI7XG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmN0eC5tb3ZlVG8oZnJvbS54LCBmcm9tLnkpO1xuICAgICAgICB0aGlzLmN0eC5saW5lVG8odG8ueCwgdG8ueSk7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuICAgIH1cblxuICAgIGRyYXdRdWFkVHJlZUxpbmVzKHRyZWVOb2RlKSB7XG4gICAgICAgIC8vIFNldHVwIGxpbmUgc3R5bGUgYW5kIGNhbGwgdGhlIGRyYXdpbmcgcm91dGluZXNcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSAnIzAwMCc7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVDYXAgPSAnYnV0dCc7XG4gICAgICAgIHRoaXMuZHJhd1F1YWRUcmVlTGluZSh0cmVlTm9kZSk7XG4gICAgfVxuXG4gICAgZHJhd1F1YWRUcmVlTGluZSh0cmVlTm9kZSkge1xuICAgICAgICBpZiAoIXRyZWVOb2RlIHx8ICF0cmVlTm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRHJhdyB4IGFuZCB5IGxpbmVzXG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmN0eC5tb3ZlVG8odHJlZU5vZGUubWlkWCwgdHJlZU5vZGUuc3RhcnRZKTtcbiAgICAgICAgdGhpcy5jdHgubGluZVRvKHRyZWVOb2RlLm1pZFgsIHRyZWVOb2RlLnN0YXJ0WSArIHRyZWVOb2RlLmhlaWdodCk7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuXG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmN0eC5tb3ZlVG8odHJlZU5vZGUuc3RhcnRYLCB0cmVlTm9kZS5taWRZKTtcbiAgICAgICAgdGhpcy5jdHgubGluZVRvKHRyZWVOb2RlLnN0YXJ0WCArIHRyZWVOb2RlLndpZHRoLCB0cmVlTm9kZS5taWRZKTtcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBjaGlsZE5vZGUgb2YgdHJlZU5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIHRoaXMuZHJhd1F1YWRUcmVlTGluZShjaGlsZE5vZGUpO1xuICAgICAgICB9XG4gICAgfVxufSAvLyBlbmQgZ3Jhdml0b24vZ2Z4XG4iLCIvKipcbiAqIGdyYXZpdG9uL3NpbSAtLSBUaGUgZ3Jhdml0YXRpb25hbCBzaW11bGF0b3JcbiAqL1xuaW1wb3J0IEd0Qm9keSBmcm9tICcuL2JvZHknO1xuaW1wb3J0IEd0VHJlZSBmcm9tICcuL3RyZWUnO1xuXG4vKiogRXhlcnQgZm9yY2Ugb24gYSBib2R5IGFuZCB1cGRhdGUgaXRzIG5leHQgcG9zaXRpb24uICovXG5mdW5jdGlvbiBleGVydEZvcmNlKGJvZHksIG5ldEZ4LCBuZXRGeSwgZGVsdGFUKSB7XG4gICAgLy8gQ2FsY3VsYXRlIGFjY2VsZXJhdGlvbnNcbiAgICBjb25zdCBheCA9IG5ldEZ4IC8gYm9keS5tYXNzO1xuICAgIGNvbnN0IGF5ID0gbmV0RnkgLyBib2R5Lm1hc3M7XG5cbiAgICAvLyBDYWxjdWxhdGUgbmV3IHZlbG9jaXRpZXMsIG5vcm1hbGl6ZWQgYnkgdGhlICd0aW1lJyBpbnRlcnZhbFxuICAgIGJvZHkudmVsWCArPSBkZWx0YVQgKiBheDtcbiAgICBib2R5LnZlbFkgKz0gZGVsdGFUICogYXk7XG5cbiAgICAvLyBDYWxjdWxhdGUgbmV3IHBvc2l0aW9ucyBhZnRlciB0aW1lc3RlcCBkZWx0YVRcbiAgICAvLyBOb3RlIHRoYXQgdGhpcyBkb2Vzbid0IHVwZGF0ZSB0aGUgY3VycmVudCBwb3NpdGlvbiBpdHNlbGYgaW4gb3JkZXIgdG8gbm90IGFmZmVjdCBvdGhlclxuICAgIC8vIGZvcmNlIGNhbGN1bGF0aW9uc1xuICAgIGJvZHkubmV4dFggKz0gZGVsdGFUICogYm9keS52ZWxYO1xuICAgIGJvZHkubmV4dFkgKz0gZGVsdGFUICogYm9keS52ZWxZO1xufVxuXG4vKiogQ2FsY3VsYXRlIHRoZSBmb3JjZSBleGVydGVkIGJldHdlZW4gYSBib2R5IGFuZCBhbiBhdHRyYWN0b3IgYmFzZWQgb24gZ3Jhdml0eS4gKi9cbmZ1bmN0aW9uIGNhbGN1bGF0ZUZvcmNlKGJvZHksIGF0dHJhY3RvciwgRykge1xuICAgIC8vIENhbGN1bGF0ZSB0aGUgY2hhbmdlIGluIHBvc2l0aW9uIGFsb25nIHRoZSB0d28gZGltZW5zaW9uc1xuICAgIGNvbnN0IGR4ID0gYXR0cmFjdG9yLnggLSBib2R5Lng7XG4gICAgY29uc3QgZHkgPSBhdHRyYWN0b3IueSAtIGJvZHkueTtcblxuICAgIC8vIE9idGFpbiB0aGUgZGlzdGFuY2UgYmV0d2VlbiB0aGUgb2JqZWN0cyAoaHlwb3RlbnVzZSlcbiAgICBjb25zdCByID0gTWF0aC5zcXJ0KE1hdGgucG93KGR4LCAyKSArIE1hdGgucG93KGR5LCAyKSk7XG5cbiAgICAvLyBDYWxjdWxhdGUgZm9yY2UgdXNpbmcgTmV3dG9uaWFuIGdyYXZpdHksIHNlcGFyYXRlIG91dCBpbnRvIHggYW5kIHkgY29tcG9uZW50c1xuICAgIGNvbnN0IEYgPSAoRyAqIGJvZHkubWFzcyAqIGF0dHJhY3Rvci5tYXNzKSAvIE1hdGgucG93KHIsIDIpO1xuICAgIGNvbnN0IEZ4ID0gRiAqIChkeCAvIHIpO1xuICAgIGNvbnN0IEZ5ID0gRiAqIChkeSAvIHIpO1xuICAgIHJldHVybiBbRngsIEZ5XTtcbn1cblxuY2xhc3MgR3RCcnV0ZUZvcmNlU2ltIHtcbiAgICAvKiogRyByZXByZXNlbnRzIHRoZSBncmF2aXRhdGlvbmFsIGNvbnN0YW50LiAqL1xuICAgIGNvbnN0cnVjdG9yKEcpIHtcbiAgICAgICAgdGhpcy5HID0gRztcbiAgICB9XG5cbiAgICAvKiogQ2FsY3VsYXRlIHRoZSBuZXcgcG9zaXRpb24gb2YgYSBib2R5IGJhc2VkIG9uIGJydXRlIGZvcmNlIG1lY2hhbmljcy4gKi9cbiAgICBjYWxjdWxhdGVOZXdQb3NpdGlvbihib2R5LCBhdHRyYWN0b3JzLCB1bnVzZWRUcmVlUm9vdCwgZGVsdGFUKSB7XG4gICAgICAgIGxldCBuZXRGeCA9IDA7XG4gICAgICAgIGxldCBuZXRGeSA9IDA7XG5cbiAgICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGFsbCBib2RpZXMgYW5kIHN1bSB0aGUgZm9yY2VzIGV4ZXJ0ZWRcbiAgICAgICAgZm9yIChjb25zdCBhdHRyYWN0b3Igb2YgYXR0cmFjdG9ycykge1xuICAgICAgICAgICAgaWYgKGJvZHkgIT09IGF0dHJhY3Rvcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IFtGeCwgRnldID0gY2FsY3VsYXRlRm9yY2UoYm9keSwgYXR0cmFjdG9yLCB0aGlzLkcpO1xuICAgICAgICAgICAgICAgIG5ldEZ4ICs9IEZ4O1xuICAgICAgICAgICAgICAgIG5ldEZ5ICs9IEZ5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXhlcnRGb3JjZShib2R5LCBuZXRGeCwgbmV0RnksIGRlbHRhVCk7XG4gICAgfVxufVxuXG5jbGFzcyBHdEJhcm5lc0h1dFNpbSB7XG4gICAgLyoqIEcgcmVwcmVzZW50cyB0aGUgZ3Jhdml0YXRpb25hbCBjb25zdGFudC4gKi9cbiAgICBjb25zdHJ1Y3RvcihHLCB0aGV0YSkge1xuICAgICAgICB0aGlzLkcgPSBHO1xuICAgICAgICB0aGlzLnRoZXRhID0gdGhldGE7XG4gICAgICAgIHRoaXMubmV0RnggPSAwO1xuICAgICAgICB0aGlzLm5ldEZ5ID0gMDtcbiAgICB9XG5cbiAgICAvKiogQ2FsY3VsYXRlIHRoZSBuZXcgcG9zaXRpb24gb2YgYSBib2R5IGJhc2VkIG9uIGJydXRlIGZvcmNlIG1lY2hhbmljcy4gKi9cbiAgICBjYWxjdWxhdGVOZXdQb3NpdGlvbihib2R5LCBhdHRyYWN0b3JzLCB0cmVlUm9vdCwgZGVsdGFUKSB7XG4gICAgICAgIHRoaXMubmV0RnggPSAwO1xuICAgICAgICB0aGlzLm5ldEZ5ID0gMDtcblxuICAgICAgICAvLyBJdGVyYXRlIHRocm91Z2ggYWxsIGJvZGllcyBpbiB0aGUgdHJlZSBhbmQgc3VtIHRoZSBmb3JjZXMgZXhlcnRlZFxuICAgICAgICB0aGlzLmNhbGN1bGF0ZUZvcmNlRnJvbVRyZWUoYm9keSwgdHJlZVJvb3QpO1xuICAgICAgICBleGVydEZvcmNlKGJvZHksIHRoaXMubmV0RngsIHRoaXMubmV0RnksIGRlbHRhVCk7XG4gICAgfVxuXG4gICAgY2FsY3VsYXRlRm9yY2VGcm9tVHJlZShib2R5LCB0cmVlTm9kZSkge1xuICAgICAgICAvLyBIYW5kbGUgZW1wdHkgbm9kZXNcbiAgICAgICAgaWYgKCF0cmVlTm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0cmVlTm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgLy8gVGhlIG5vZGUgaXMgZXh0ZXJuYWwgKGl0J3MgYW4gYWN0dWFsIGJvZHkpXG4gICAgICAgICAgICBpZiAoYm9keSAhPT0gdHJlZU5vZGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBbRngsIEZ5XSA9IGNhbGN1bGF0ZUZvcmNlKGJvZHksIHRyZWVOb2RlLCB0aGlzLkcpO1xuICAgICAgICAgICAgICAgIHRoaXMubmV0RnggKz0gRng7XG4gICAgICAgICAgICAgICAgdGhpcy5uZXRGeSArPSBGeTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSBub2RlIGlzIGludGVybmFsXG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBlZmZlY3RpdmUgcXVhZHJhbnQgc2l6ZSBhbmQgZGlzdGFuY2UgZnJvbSBjZW50ZXItb2YtbWFzc1xuICAgICAgICBjb25zdCBzID0gKHRyZWVOb2RlLndpZHRoICsgdHJlZU5vZGUuaGVpZ2h0KSAvIDI7XG5cbiAgICAgICAgY29uc3QgZHggPSB0cmVlTm9kZS54IC0gYm9keS54O1xuICAgICAgICBjb25zdCBkeSA9IHRyZWVOb2RlLnkgLSBib2R5Lnk7XG4gICAgICAgIGNvbnN0IGQgPSBNYXRoLnNxcnQoTWF0aC5wb3coZHgsIDIpICsgTWF0aC5wb3coZHksIDIpKTtcblxuICAgICAgICBpZiAocyAvIGQgPCB0aGlzLnRoZXRhKSB7XG4gICAgICAgICAgICAvLyBOb2RlIGlzIHN1ZmZpY2llbnRseSBmYXIgYXdheVxuICAgICAgICAgICAgY29uc3QgW0Z4LCBGeV0gPSBjYWxjdWxhdGVGb3JjZShib2R5LCB0cmVlTm9kZSwgdGhpcy5HKTtcbiAgICAgICAgICAgIHRoaXMubmV0RnggKz0gRng7XG4gICAgICAgICAgICB0aGlzLm5ldEZ5ICs9IEZ5O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gTm9kZSBpcyBjbG9zZTsgcmVjdXJzZVxuICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZE5vZGUgb2YgdHJlZU5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNhbGN1bGF0ZUZvcmNlRnJvbVRyZWUoYm9keSwgY2hpbGROb2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR3RTaW0ge1xuICAgIGNvbnN0cnVjdG9yKGFyZ3MpIHtcbiAgICAgICAgYXJncyA9IGFyZ3MgfHwge307XG5cbiAgICAgICAgdGhpcy51c2VCcnV0ZUZvcmNlID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5HID0gYXJncy5HIHx8IDYuNjczODQgKiBNYXRoLnBvdygxMCwgLTExKTsgLy8gR3Jhdml0YXRpb25hbCBjb25zdGFudFxuICAgICAgICB0aGlzLm11bHRpcGxpZXIgPSBhcmdzLm11bHRpcGxpZXIgfHwgMTUwMDsgLy8gVGltZXN0ZXBcbiAgICAgICAgdGhpcy5zY2F0dGVyTGltaXRYID0gYXJncy5zY2F0dGVyTGltaXRYIHx8IGFyZ3Mud2lkdGggKiAyO1xuICAgICAgICB0aGlzLnNjYXR0ZXJMaW1pdFkgPSBhcmdzLnNjYXR0ZXJMaW1pdFkgfHwgYXJncy5oZWlnaHQgKiAyO1xuXG4gICAgICAgIHRoaXMuYm9kaWVzID0gW107XG4gICAgICAgIC8vIEluY29ycG9yYXRlIHRoZSBzY2F0dGVyIGxpbWl0XG4gICAgICAgIHRoaXMudHJlZSA9IG5ldyBHdFRyZWUoXG4gICAgICAgICAgICAgICAgLyogd2lkdGggKi8gdGhpcy5zY2F0dGVyTGltaXRYLFxuICAgICAgICAgICAgICAgIC8qIGhlaWdodCAqLyB0aGlzLnNjYXR0ZXJMaW1pdFksXG4gICAgICAgICAgICAgICAgLyogc3RhcnRYICovIChhcmdzLndpZHRoIC0gdGhpcy5zY2F0dGVyTGltaXRYKSAvIDIsXG4gICAgICAgICAgICAgICAgLyogc3RhcnRZICovIChhcmdzLmhlaWdodCAtIHRoaXMuc2NhdHRlckxpbWl0WSkgLyAyKTtcbiAgICAgICAgdGhpcy50aW1lID0gMDtcblxuICAgICAgICB0aGlzLmJydXRlRm9yY2VTaW0gPSBuZXcgR3RCcnV0ZUZvcmNlU2ltKHRoaXMuRyk7XG4gICAgICAgIHRoaXMuYmFybmVzSHV0U2ltID0gbmV3IEd0QmFybmVzSHV0U2ltKHRoaXMuRywgLyogdGhldGEgKi8gMC41KTtcbiAgICAgICAgdGhpcy5hY3RpdmVTaW0gPSB0aGlzLnVzZUJydXRlRm9yY2UgPyB0aGlzLmJydXRlRm9yY2VTaW0gOiB0aGlzLmJhcm5lc0h1dFNpbTtcbiAgICB9XG5cbiAgICB0b2dnbGVTdHJhdGVneSgpIHtcbiAgICAgICAgdGhpcy51c2VCcnV0ZUZvcmNlID0gIXRoaXMudXNlQnJ1dGVGb3JjZTtcbiAgICAgICAgdGhpcy5hY3RpdmVTaW0gPSB0aGlzLnVzZUJydXRlRm9yY2UgPyB0aGlzLmJydXRlRm9yY2VTaW0gOiB0aGlzLmJhcm5lc0h1dFNpbTtcbiAgICB9XG5cbiAgICAvKiogQ2FsY3VsYXRlIGEgc3RlcCBvZiB0aGUgc2ltdWxhdGlvbi4gKi9cbiAgICBzdGVwKGVsYXBzZWQpIHtcbiAgICAgICAgaWYgKCF0aGlzLnVzZUJydXRlRm9yY2UpIHtcbiAgICAgICAgICAgIHRoaXMucmVzZXRUcmVlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGNvbnN0IGJvZHkgb2YgdGhpcy5ib2RpZXMpIHtcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlU2ltLmNhbGN1bGF0ZU5ld1Bvc2l0aW9uKFxuICAgICAgICAgICAgICAgICAgICBib2R5LCB0aGlzLmJvZGllcywgdGhpcy50cmVlLnJvb3QsIGVsYXBzZWQgKiB0aGlzLm11bHRpcGxpZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb21taXRQb3NpdGlvblVwZGF0ZXMoKTtcbiAgICAgICAgdGhpcy50aW1lICs9IGVsYXBzZWQ7IC8vIEluY3JlbWVudCBydW50aW1lXG4gICAgICAgIHRoaXMucmVtb3ZlU2NhdHRlcmVkKCk7XG4gICAgfVxuXG4gICAgLyoqIFVwZGF0ZSBwb3NpdGlvbnMgb2YgYWxsIGJvZGllcyB0byBiZSB0aGUgbmV4dCBjYWxjdWxhdGVkIHBvc2l0aW9uLiAqL1xuICAgIGNvbW1pdFBvc2l0aW9uVXBkYXRlcygpIHtcbiAgICAgICAgZm9yIChjb25zdCBib2R5IG9mIHRoaXMuYm9kaWVzKSB7XG4gICAgICAgICAgICBib2R5LnggPSBib2R5Lm5leHRYO1xuICAgICAgICAgICAgYm9keS55ID0gYm9keS5uZXh0WTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBTY2FuIHRocm91Z2ggdGhlIGxpc3Qgb2YgYm9kaWVzIGFuZCByZW1vdmUgYW55IHRoYXQgaGF2ZSBmYWxsZW4gb3V0IG9mIHRoZSBzY2F0dGVyIGxpbWl0LiAqL1xuICAgIHJlbW92ZVNjYXR0ZXJlZCgpIHtcbiAgICAgICAgbGV0IGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IHRoaXMuYm9kaWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IHRoaXMuYm9kaWVzW2ldO1xuXG4gICAgICAgICAgICBpZiAoYm9keS54ID4gdGhpcy5zY2F0dGVyTGltaXQgfHxcbiAgICAgICAgICAgICAgICBib2R5LnggPCAtdGhpcy5zY2F0dGVyTGltaXQgfHxcbiAgICAgICAgICAgICAgICBib2R5LnkgPiB0aGlzLnNjYXR0ZXJMaW1pdCB8fFxuICAgICAgICAgICAgICAgIGJvZHkueSA8IC10aGlzLnNjYXR0ZXJMaW1pdCkge1xuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBmcm9tIGJvZHkgY29sbGVjdGlvblxuICAgICAgICAgICAgICAgIC8vIFdlIGRvbid0IG5lZWQgdG8gcmVzZXQgdGhlIHRyZWUgaGVyZSBiZWNhdXNlIHRoaXMgaXMgYSBydW50aW1lIChub3QgdXNlci1iYXNlZClcbiAgICAgICAgICAgICAgICAvLyBvcGVyYXRpb24sIGFuZCB0aGUgdHJlZSBpcyByZXNldCBhdXRvbWF0aWNhbGx5IG9uIGV2ZXJ5IHN0ZXAgb2YgdGhlIHNpbXVsYXRpb24uXG4gICAgICAgICAgICAgICAgdGhpcy5ib2RpZXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogQ3JlYXRlIGFuZCByZXR1cm4gYSBuZXcgYm9keSB0byB0aGUgc2ltdWxhdGlvbi4gKi9cbiAgICBhZGROZXdCb2R5KGFyZ3MpIHtcbiAgICAgICAgbGV0IGJvZHkgPSBuZXcgR3RCb2R5KGFyZ3MpO1xuICAgICAgICB0aGlzLmJvZGllcy5wdXNoKGJvZHkpO1xuICAgICAgICB0aGlzLnJlc2V0VHJlZSgpO1xuICAgICAgICByZXR1cm4gYm9keTtcbiAgICB9XG5cbiAgICAvKiogUmVtb3ZpbmcgYSB0YXJnZXQgYm9keSBmcm9tIHRoZSBzaW11bGF0aW9uLiAqL1xuICAgIHJlbW92ZUJvZHkodGFyZ2V0Qm9keSkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuYm9kaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gdGhpcy5ib2RpZXNbaV07XG4gICAgICAgICAgICBpZiAoYm9keSA9PT0gdGFyZ2V0Qm9keSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYm9kaWVzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0VHJlZSgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIExvb2t1cCBhbiAoeCwgeSkgY29vcmRpbmF0ZSBhbmQgcmV0dXJuIHRoZSBib2R5IHRoYXQgaXMgYXQgdGhhdCBwb3NpdGlvbi4gKi9cbiAgICBnZXRCb2R5QXQoeCwgeSkge1xuICAgICAgICBmb3IgKGxldCBpID0gdGhpcy5ib2RpZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSB0aGlzLmJvZGllc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IGlzTWF0Y2ggPSBNYXRoLmFicyh4IC0gYm9keS54KSA8PSBib2R5LnJhZGl1cyAmJlxuICAgICAgICAgICAgICAgIE1hdGguYWJzKHkgLSBib2R5LnkpIDw9IGJvZHkucmFkaXVzO1xuICAgICAgICAgICAgaWYgKGlzTWF0Y2gpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYm9keTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8qKiBDbGVhciB0aGUgc2ltdWxhdGlvbi4gKi9cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5ib2RpZXMubGVuZ3RoID0gMDsgLy8gUmVtb3ZlIGFsbCBib2RpZXMgZnJvbSBjb2xsZWN0aW9uXG4gICAgICAgIHRoaXMucmVzZXRUcmVlKCk7XG4gICAgfVxuXG4gICAgLyoqIENsZWFyIGFuZCByZXNldCB0aGUgcXVhZHRyZWUsIGFkZGluZyBhbGwgZXhpc3RpbmcgYm9kaWVzIGJhY2suICovXG4gICAgcmVzZXRUcmVlKCkge1xuICAgICAgICB0aGlzLnRyZWUuY2xlYXIoKTtcbiAgICAgICAgZm9yIChjb25zdCBib2R5IG9mIHRoaXMuYm9kaWVzKSB7XG4gICAgICAgICAgICB0aGlzLnRyZWUuYWRkQm9keShib2R5KTtcbiAgICAgICAgfVxuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL3NpbVxuIiwiLyoqXG4gKiBncmF2aXRvbi90aW1lciAtLSBTaW0gdGltZXIgYW5kIEZQUyBsaW1pdGVyXG4gKi9cbmltcG9ydCBlbnYgZnJvbSAnLi4vdXRpbC9lbnYnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdFRpbWVyIHtcbiAgICBjb25zdHJ1Y3RvcihmbiwgZnBzPW51bGwpIHtcbiAgICAgICAgdGhpcy5fZm4gPSBmbjtcbiAgICAgICAgdGhpcy5fZnBzID0gZnBzO1xuICAgICAgICB0aGlzLl9pc0FjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9pc0FuaW1hdGlvbiA9IGZwcyA9PT0gbnVsbDtcbiAgICAgICAgdGhpcy5fY2FuY2VsbGF0aW9uSWQgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuX3dpbmRvdyA9IGVudi5nZXRXaW5kb3coKTtcbiAgICB9XG5cbiAgICBnZXQgYWN0aXZlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faXNBY3RpdmU7XG4gICAgfVxuXG4gICAgc3RhcnQoKSB7XG4gICAgICAgIGlmICghdGhpcy5faXNBY3RpdmUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9pc0FuaW1hdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2JlZ2luQW5pbWF0aW9uKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2JlZ2luSW50ZXJ2YWwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2lzQWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0b3AoKSB7XG4gICAgICAgIGlmICh0aGlzLl9pc0FjdGl2ZSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2lzQW5pbWF0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMuX2NhbmNlbGxhdGlvbklkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2luZG93LmNsZWFySW50ZXJ2YWwodGhpcy5fY2FuY2VsbGF0aW9uSWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5faXNBY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRvZ2dsZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2lzQWN0aXZlKSB7XG4gICAgICAgICAgICB0aGlzLnN0b3AoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9iZWdpbkFuaW1hdGlvbigpIHtcbiAgICAgICAgbGV0IGxhc3RUaW1lc3RhbXAgPSB0aGlzLl93aW5kb3cucGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgIGxldCBhbmltYXRvciA9ICh0aW1lc3RhbXApID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2NhbmNlbGxhdGlvbklkID0gdGhpcy5fd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRvcik7XG4gICAgICAgICAgICB0aGlzLl9mbih0aW1lc3RhbXAgLSBsYXN0VGltZXN0YW1wKTtcbiAgICAgICAgICAgIGxhc3RUaW1lc3RhbXAgPSB0aW1lc3RhbXA7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gRGVsYXkgaW5pdGlhbCBleGVjdXRpb24gdW50aWwgdGhlIG5leHQgdGljay5cbiAgICAgICAgdGhpcy5fY2FuY2VsbGF0aW9uSWQgPSB0aGlzLl93aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdG9yKTtcbiAgICB9XG5cbiAgICBfYmVnaW5JbnRlcnZhbCgpIHtcbiAgICAgICAgLy8gQ29tcHV0ZSB0aGUgZGVsYXkgcGVyIHRpY2ssIGluIG1pbGxpc2Vjb25kcy5cbiAgICAgICAgbGV0IHRpbWVvdXQgPSAxMDAwIC8gdGhpcy5fZnBzIHwgMDtcblxuICAgICAgICBsZXQgbGFzdFRpbWVzdGFtcCA9IHRoaXMuX3dpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgICAgdGhpcy5fY2FuY2VsbGF0aW9uSWQgPSB0aGlzLl93aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgbGV0IHRpbWVzdGFtcCA9IHRoaXMuX3dpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgICAgICAgIHRoaXMuX2ZuKHRpbWVzdGFtcCAtIGxhc3RUaW1lc3RhbXApO1xuICAgICAgICAgICAgbGFzdFRpbWVzdGFtcCA9IHRpbWVzdGFtcDtcbiAgICAgICAgIH0sIHRpbWVvdXQpO1xuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL3RpbWVyXG4iLCIvKipcbiAqIGdyYXZpdG9uL3RyZWUgLS0gVGhlIGdyYXZpdGF0aW9uYWwgYm9keSB0cmVlIHN0cnVjdHVyZVxuICovXG5cbmNsYXNzIEd0VHJlZU5vZGUge1xuICAgIGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQsIHN0YXJ0WCwgc3RhcnRZKSB7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIHRoaXMuc3RhcnRYID0gc3RhcnRYO1xuICAgICAgICB0aGlzLnN0YXJ0WSA9IHN0YXJ0WTtcblxuICAgICAgICAvLyBDb252ZW5pZW5jZSBjZW50ZXIgcG9pbnRzLlxuICAgICAgICB0aGlzLmhhbGZXaWR0aCA9IHdpZHRoIC8gMjtcbiAgICAgICAgdGhpcy5oYWxmSGVpZ2h0ID0gaGVpZ2h0IC8gMjtcbiAgICAgICAgdGhpcy5taWRYID0gdGhpcy5zdGFydFggKyB0aGlzLmhhbGZXaWR0aDtcbiAgICAgICAgdGhpcy5taWRZID0gdGhpcy5zdGFydFkgKyB0aGlzLmhhbGZIZWlnaHQ7XG5cbiAgICAgICAgLy8gTWF0Y2hlcyBHdEJvZHkncyBwcm9wZXJ0aWVzLlxuICAgICAgICB0aGlzLm1hc3MgPSAwO1xuICAgICAgICB0aGlzLnggPSAwO1xuICAgICAgICB0aGlzLnkgPSAwO1xuXG4gICAgICAgIC8vIFtOVywgTkUsIFNXLCBTRV1cbiAgICAgICAgdGhpcy5jaGlsZHJlbiA9IG5ldyBBcnJheSg0KTtcbiAgICB9XG5cbiAgICAvKiogQWRkIGEgYm9keSB0byB0aGUgdHJlZSwgdXBkYXRpbmcgbWFzcyBhbmQgY2VudGVycG9pbnQuICovXG4gICAgYWRkQm9keShib2R5KSB7XG4gICAgICAgIHRoaXMudXBkYXRlTWFzcyhib2R5KTtcbiAgICAgICAgY29uc3QgcXVhZHJhbnQgPSB0aGlzLmdldFF1YWRyYW50KGJvZHkueCwgYm9keS55KTtcblxuICAgICAgICBpZiAodGhpcy5jaGlsZHJlbltxdWFkcmFudF0gaW5zdGFuY2VvZiBHdFRyZWVOb2RlKSB7XG4gICAgICAgICAgICB0aGlzLmNoaWxkcmVuW3F1YWRyYW50XS5hZGRCb2R5KGJvZHkpO1xuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLmNoaWxkcmVuW3F1YWRyYW50XSkge1xuICAgICAgICAgICAgdGhpcy5jaGlsZHJlbltxdWFkcmFudF0gPSBib2R5O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmNoaWxkcmVuW3F1YWRyYW50XTtcbiAgICAgICAgICAgIGNvbnN0IHF1YWRYID0gZXhpc3RpbmcueCA+IHRoaXMubWlkWCA/IHRoaXMubWlkWCA6IHRoaXMuc3RhcnRYO1xuICAgICAgICAgICAgY29uc3QgcXVhZFkgPSBleGlzdGluZy55ID4gdGhpcy5taWRZID8gdGhpcy5taWRZIDogdGhpcy5zdGFydFk7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gbmV3IEd0VHJlZU5vZGUodGhpcy5oYWxmV2lkdGgsIHRoaXMuaGFsZkhlaWdodCwgcXVhZFgsIHF1YWRZKTtcblxuICAgICAgICAgICAgbm9kZS5hZGRCb2R5KGV4aXN0aW5nKTtcbiAgICAgICAgICAgIG5vZGUuYWRkQm9keShib2R5KTtcblxuICAgICAgICAgICAgdGhpcy5jaGlsZHJlbltxdWFkcmFudF0gPSBub2RlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIFVwZGF0ZSB0aGUgY2VudGVyIG9mIG1hc3MgYmFzZWQgb24gdGhlIGFkZGl0aW9uIG9mIGEgbmV3IGJvZHkuICovXG4gICAgdXBkYXRlTWFzcyhib2R5KSB7XG4gICAgICAgIGNvbnN0IG5ld01hc3MgPSB0aGlzLm1hc3MgKyBib2R5Lm1hc3M7XG4gICAgICAgIGNvbnN0IG5ld1ggPSAodGhpcy54ICogdGhpcy5tYXNzICsgYm9keS54ICogYm9keS5tYXNzKSAvIG5ld01hc3M7XG4gICAgICAgIGNvbnN0IG5ld1kgPSAodGhpcy55ICogdGhpcy5tYXNzICsgYm9keS55ICogYm9keS5tYXNzKSAvIG5ld01hc3M7XG4gICAgICAgIHRoaXMubWFzcyA9IG5ld01hc3M7XG4gICAgICAgIHRoaXMueCA9IG5ld1g7XG4gICAgICAgIHRoaXMueSA9IG5ld1k7XG4gICAgfVxuXG4gICAgLyoqIFJldHVybiB0aGUgcXVhZHJhbnQgaW5kZXggZm9yIGEgZ2l2ZW4gKHgsIHkpIHBhaXIuIEFzc3VtZXMgdGhhdCBpdCBsaWVzIHdpdGhpbiBib3VuZHMuICovXG4gICAgZ2V0UXVhZHJhbnQoeCwgeSkge1xuICAgICAgICBjb25zdCB4SW5kZXggPSBOdW1iZXIoeCA+IHRoaXMubWlkWCk7XG4gICAgICAgIGNvbnN0IHlJbmRleCA9IE51bWJlcih5ID4gdGhpcy5taWRZKSAqIDI7XG4gICAgICAgIHJldHVybiB4SW5kZXggKyB5SW5kZXg7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdFRyZWUge1xuICAgIGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQsIHN0YXJ0WCA9IDAsIHN0YXJ0WSA9IDApIHtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgdGhpcy5zdGFydFggPSBzdGFydFg7XG4gICAgICAgIHRoaXMuc3RhcnRZID0gc3RhcnRZO1xuICAgICAgICB0aGlzLnJvb3QgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgYWRkQm9keShib2R5KSB7XG4gICAgICAgIGlmICh0aGlzLnJvb3QgaW5zdGFuY2VvZiBHdFRyZWVOb2RlKSB7XG4gICAgICAgICAgICB0aGlzLnJvb3QuYWRkQm9keShib2R5KTtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5yb290KSB7XG4gICAgICAgICAgICB0aGlzLnJvb3QgPSBib2R5O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLnJvb3Q7XG4gICAgICAgICAgICB0aGlzLnJvb3QgPSBuZXcgR3RUcmVlTm9kZSh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgdGhpcy5zdGFydFgsIHRoaXMuc3RhcnRZKTtcbiAgICAgICAgICAgIHRoaXMucm9vdC5hZGRCb2R5KGV4aXN0aW5nKTtcbiAgICAgICAgICAgIHRoaXMucm9vdC5hZGRCb2R5KGJvZHkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMucm9vdCA9IHVuZGVmaW5lZDtcbiAgICB9XG59IC8vIGVuZCBncmF2aXRvbi90cmVlXG4iLCJpbXBvcnQgJy4vdmVuZG9yL2pzY29sb3InO1xuaW1wb3J0IHZleCBmcm9tICcuL3ZlbmRvci92ZXgnO1xuaW1wb3J0ICcuL3BvbHlmaWxscyc7XG5pbXBvcnQgZ3QgZnJvbSAnLi9ncmF2aXRvbic7XG5cbndpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBTZXQgb3B0aW9ucyBmb3IgZGVwZW5kZW5jaWVzLlxuICAgIHZleC5kZWZhdWx0T3B0aW9ucy5jbGFzc05hbWUgPSAndmV4LXRoZW1lLXdpcmVmcmFtZSc7XG5cbiAgICAvLyBTdGFydCB0aGUgbWFpbiBncmF2aXRvbiBhcHAuXG4gICAgd2luZG93LmdyYXZpdG9uID0gbmV3IGd0LmFwcCgpO1xufTtcbiIsIndpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgIHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gd2luZG93LnNldFRpbWVvdXQoY2FsbGJhY2ssIDEwMDAgLyA2MCk7XG4gICAgfTtcblxud2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgd2luZG93Lm1vekNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgZnVuY3Rpb24odGltZW91dElkKSB7XG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICB9O1xuXG53aW5kb3cucGVyZm9ybWFuY2UgPSB3aW5kb3cucGVyZm9ybWFuY2UgfHwge307XG53aW5kb3cucGVyZm9ybWFuY2Uubm93ID0gd2luZG93LnBlcmZvcm1hbmNlLm5vdyB8fFxuICAgIHdpbmRvdy5wZXJmb3JtYW5jZS53ZWJraXROb3cgfHxcbiAgICB3aW5kb3cucGVyZm9ybWFuY2UubW96Tm93IHx8XG4gICAgRGF0ZS5ub3c7XG4iLCIvKipcbiAqIGNvbG9ycyAtLSBDb2xvciBtYW5pcHVsYXRpb24gaGVscGVyc1xuICovXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgYnJpZ2h0ZW4oY29sb3JBcnJheSwgcGVyY2VudCkge1xuICAgICAgICBsZXQgW3IsIGcsIGJdID0gY29sb3JBcnJheTtcbiAgICAgICAgciA9IE1hdGgucm91bmQoTWF0aC5taW4oTWF0aC5tYXgoMCwgciArIChyICogcGVyY2VudCkpLCAyNTUpKTtcbiAgICAgICAgZyA9IE1hdGgucm91bmQoTWF0aC5taW4oTWF0aC5tYXgoMCwgZyArIChnICogcGVyY2VudCkpLCAyNTUpKTtcbiAgICAgICAgYiA9IE1hdGgucm91bmQoTWF0aC5taW4oTWF0aC5tYXgoMCwgYiArIChiICogcGVyY2VudCkpLCAyNTUpKTtcbiAgICAgICAgcmV0dXJuIFtyLCBnLCBiXTtcbiAgICB9LFxuXG4gICAgZnJvbUhleChoZXgpIHtcbiAgICAgICAgbGV0IGggPSBoZXgucmVwbGFjZSgnIycsICcnKTtcbiAgICAgICAgaWYgKGgubGVuZ3RoIDwgNikge1xuICAgICAgICAgICAgaCA9IGgucmVwbGFjZSgvKC4pL2csICckMSQxJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFtwYXJzZUludChoLnN1YnN0cigwLCAyKSwgMTYpLFxuICAgICAgICAgICAgICAgIHBhcnNlSW50KGguc3Vic3RyKDIsIDIpLCAxNiksXG4gICAgICAgICAgICAgICAgcGFyc2VJbnQoaC5zdWJzdHIoNCwgMiksIDE2KV07XG4gICAgfSxcblxuICAgIHRvSGV4KGNvbG9yQXJyYXkpIHtcbiAgICAgICAgY29uc3QgW3IsIGcsIGJdID0gY29sb3JBcnJheTtcbiAgICAgICAgcmV0dXJuICcjJyArICgnMCcgKyByLnRvU3RyaW5nKDE2KSkuc3Vic3RyKHIgPCAxNiA/IDAgOiAxKSArXG4gICAgICAgICAgICAgICAgICAgICAoJzAnICsgZy50b1N0cmluZygxNikpLnN1YnN0cihnIDwgMTYgPyAwIDogMSkgK1xuICAgICAgICAgICAgICAgICAgICAgKCcwJyArIGIudG9TdHJpbmcoMTYpKS5zdWJzdHIoYiA8IDE2ID8gMCA6IDEpO1xuICAgIH1cbn07XG4iLCIvKipcbiAqIGVudiAtIEVudmlyb25tZW50IHJldHJpZXZhbCBtZXRob2RzLlxuICovXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgZ2V0V2luZG93KCkge1xuICAgICAgICByZXR1cm4gd2luZG93O1xuICAgIH1cbn07XG4iLCIvKipcbiAqIHJhbmRvbSAtLSBBIGNvbGxlY3Rpb24gb2YgcmFuZG9tIGdlbmVyYXRvciBmdW5jdGlvbnNcbiAqL1xuZXhwb3J0IGRlZmF1bHQge1xuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGEgcmFuZG9tIG51bWJlciBiZXR3ZWVuIHRoZSBnaXZlbiBzdGFydCBhbmQgZW5kIHBvaW50c1xuICAgICAqL1xuICAgIG51bWJlcihmcm9tLCB0bz1udWxsKSB7XG4gICAgICAgIGlmICh0byA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdG8gPSBmcm9tO1xuICAgICAgICAgICAgZnJvbSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gTWF0aC5yYW5kb20oKSAqICh0byAtIGZyb20pICsgZnJvbTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgYSByYW5kb20gaW50ZWdlciBiZXR3ZWVuIHRoZSBnaXZlbiBwb3NpdGlvbnNcbiAgICAgKi9cbiAgICBpbnRlZ2VyKC4uLmFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IodGhpcy5udW1iZXIoLi4uYXJncykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZSBhIHJhbmRvbSBudW1iZXIsIHdpdGggYSByYW5kb20gc2lnbiwgYmV0d2VlbiB0aGUgZ2l2ZW5cbiAgICAgKiBwb3NpdGlvbnNcbiAgICAgKi9cbiAgICBkaXJlY3Rpb25hbCguLi5hcmdzKSB7XG4gICAgICAgIGxldCByYW5kID0gdGhpcy5udW1iZXIoLi4uYXJncyk7XG4gICAgICAgIGlmIChNYXRoLnJhbmRvbSgpID4gMC41KSB7XG4gICAgICAgICAgICByYW5kID0gLXJhbmQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJhbmQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGEgcmFuZG9tIGhleGFkZWNpbWFsIGNvbG9yXG4gICAgICovXG4gICAgY29sb3IoKSB7XG4gICAgICAgIHJldHVybiAnIycgKyAoJzAwMDAwJyArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDB4MTAwMDAwMCkudG9TdHJpbmcoMTYpKS5zdWJzdHIoLTYpO1xuICAgIH1cbn07XG4iLCIvKipcbiAqIGpzY29sb3IgLSBKYXZhU2NyaXB0IENvbG9yIFBpY2tlclxuICpcbiAqIEBsaW5rICAgIGh0dHA6Ly9qc2NvbG9yLmNvbVxuICogQGxpY2Vuc2UgRm9yIG9wZW4gc291cmNlIHVzZTogR1BMdjNcbiAqICAgICAgICAgIEZvciBjb21tZXJjaWFsIHVzZTogSlNDb2xvciBDb21tZXJjaWFsIExpY2Vuc2VcbiAqIEBhdXRob3IgIEphbiBPZHZhcmtvXG4gKiBAdmVyc2lvbiAyLjAuNFxuICpcbiAqIFNlZSB1c2FnZSBleGFtcGxlcyBhdCBodHRwOi8vanNjb2xvci5jb20vZXhhbXBsZXMvXG4gKi9cblxuXG5cInVzZSBzdHJpY3RcIjtcblxuXG5pZiAoIXdpbmRvdy5qc2NvbG9yKSB7IHdpbmRvdy5qc2NvbG9yID0gKGZ1bmN0aW9uICgpIHtcblxuXG52YXIganNjID0ge1xuXG5cblx0cmVnaXN0ZXIgOiBmdW5jdGlvbiAoKSB7XG5cdFx0anNjLmF0dGFjaERPTVJlYWR5RXZlbnQoanNjLmluaXQpO1xuXHRcdGpzYy5hdHRhY2hFdmVudChkb2N1bWVudCwgJ21vdXNlZG93bicsIGpzYy5vbkRvY3VtZW50TW91c2VEb3duKTtcblx0XHRqc2MuYXR0YWNoRXZlbnQoZG9jdW1lbnQsICd0b3VjaHN0YXJ0JywganNjLm9uRG9jdW1lbnRUb3VjaFN0YXJ0KTtcblx0XHRqc2MuYXR0YWNoRXZlbnQod2luZG93LCAncmVzaXplJywganNjLm9uV2luZG93UmVzaXplKTtcblx0fSxcblxuXG5cdGluaXQgOiBmdW5jdGlvbiAoKSB7XG5cdFx0aWYgKGpzYy5qc2NvbG9yLmxvb2t1cENsYXNzKSB7XG5cdFx0XHRqc2MuanNjb2xvci5pbnN0YWxsQnlDbGFzc05hbWUoanNjLmpzY29sb3IubG9va3VwQ2xhc3MpO1xuXHRcdH1cblx0fSxcblxuXG5cdHRyeUluc3RhbGxPbkVsZW1lbnRzIDogZnVuY3Rpb24gKGVsbXMsIGNsYXNzTmFtZSkge1xuXHRcdHZhciBtYXRjaENsYXNzID0gbmV3IFJlZ0V4cCgnKF58XFxcXHMpKCcgKyBjbGFzc05hbWUgKyAnKShcXFxccyooXFxcXHtbXn1dKlxcXFx9KXxcXFxcc3wkKScsICdpJyk7XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGVsbXMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdGlmIChlbG1zW2ldLnR5cGUgIT09IHVuZGVmaW5lZCAmJiBlbG1zW2ldLnR5cGUudG9Mb3dlckNhc2UoKSA9PSAnY29sb3InKSB7XG5cdFx0XHRcdGlmIChqc2MuaXNDb2xvckF0dHJTdXBwb3J0ZWQpIHtcblx0XHRcdFx0XHQvLyBza2lwIGlucHV0cyBvZiB0eXBlICdjb2xvcicgaWYgc3VwcG9ydGVkIGJ5IHRoZSBicm93c2VyXG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHZhciBtO1xuXHRcdFx0aWYgKCFlbG1zW2ldLmpzY29sb3IgJiYgZWxtc1tpXS5jbGFzc05hbWUgJiYgKG0gPSBlbG1zW2ldLmNsYXNzTmFtZS5tYXRjaChtYXRjaENsYXNzKSkpIHtcblx0XHRcdFx0dmFyIHRhcmdldEVsbSA9IGVsbXNbaV07XG5cdFx0XHRcdHZhciBvcHRzU3RyID0gbnVsbDtcblxuXHRcdFx0XHR2YXIgZGF0YU9wdGlvbnMgPSBqc2MuZ2V0RGF0YUF0dHIodGFyZ2V0RWxtLCAnanNjb2xvcicpO1xuXHRcdFx0XHRpZiAoZGF0YU9wdGlvbnMgIT09IG51bGwpIHtcblx0XHRcdFx0XHRvcHRzU3RyID0gZGF0YU9wdGlvbnM7XG5cdFx0XHRcdH0gZWxzZSBpZiAobVs0XSkge1xuXHRcdFx0XHRcdG9wdHNTdHIgPSBtWzRdO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIG9wdHMgPSB7fTtcblx0XHRcdFx0aWYgKG9wdHNTdHIpIHtcblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0b3B0cyA9IChuZXcgRnVuY3Rpb24gKCdyZXR1cm4gKCcgKyBvcHRzU3RyICsgJyknKSkoKTtcblx0XHRcdFx0XHR9IGNhdGNoKGVQYXJzZUVycm9yKSB7XG5cdFx0XHRcdFx0XHRqc2Mud2FybignRXJyb3IgcGFyc2luZyBqc2NvbG9yIG9wdGlvbnM6ICcgKyBlUGFyc2VFcnJvciArICc6XFxuJyArIG9wdHNTdHIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHR0YXJnZXRFbG0uanNjb2xvciA9IG5ldyBqc2MuanNjb2xvcih0YXJnZXRFbG0sIG9wdHMpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXG5cdGlzQ29sb3JBdHRyU3VwcG9ydGVkIDogKGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZWxtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcblx0XHRpZiAoZWxtLnNldEF0dHJpYnV0ZSkge1xuXHRcdFx0ZWxtLnNldEF0dHJpYnV0ZSgndHlwZScsICdjb2xvcicpO1xuXHRcdFx0aWYgKGVsbS50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ2NvbG9yJykge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9KSgpLFxuXG5cblx0aXNDYW52YXNTdXBwb3J0ZWQgOiAoZnVuY3Rpb24gKCkge1xuXHRcdHZhciBlbG0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblx0XHRyZXR1cm4gISEoZWxtLmdldENvbnRleHQgJiYgZWxtLmdldENvbnRleHQoJzJkJykpO1xuXHR9KSgpLFxuXG5cblx0ZmV0Y2hFbGVtZW50IDogZnVuY3Rpb24gKG1peGVkKSB7XG5cdFx0cmV0dXJuIHR5cGVvZiBtaXhlZCA9PT0gJ3N0cmluZycgPyBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChtaXhlZCkgOiBtaXhlZDtcblx0fSxcblxuXG5cdGlzRWxlbWVudFR5cGUgOiBmdW5jdGlvbiAoZWxtLCB0eXBlKSB7XG5cdFx0cmV0dXJuIGVsbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSB0eXBlLnRvTG93ZXJDYXNlKCk7XG5cdH0sXG5cblxuXHRnZXREYXRhQXR0ciA6IGZ1bmN0aW9uIChlbCwgbmFtZSkge1xuXHRcdHZhciBhdHRyTmFtZSA9ICdkYXRhLScgKyBuYW1lO1xuXHRcdHZhciBhdHRyVmFsdWUgPSBlbC5nZXRBdHRyaWJ1dGUoYXR0ck5hbWUpO1xuXHRcdGlmIChhdHRyVmFsdWUgIT09IG51bGwpIHtcblx0XHRcdHJldHVybiBhdHRyVmFsdWU7XG5cdFx0fVxuXHRcdHJldHVybiBudWxsO1xuXHR9LFxuXG5cblx0YXR0YWNoRXZlbnQgOiBmdW5jdGlvbiAoZWwsIGV2bnQsIGZ1bmMpIHtcblx0XHRpZiAoZWwuYWRkRXZlbnRMaXN0ZW5lcikge1xuXHRcdFx0ZWwuYWRkRXZlbnRMaXN0ZW5lcihldm50LCBmdW5jLCBmYWxzZSk7XG5cdFx0fSBlbHNlIGlmIChlbC5hdHRhY2hFdmVudCkge1xuXHRcdFx0ZWwuYXR0YWNoRXZlbnQoJ29uJyArIGV2bnQsIGZ1bmMpO1xuXHRcdH1cblx0fSxcblxuXG5cdGRldGFjaEV2ZW50IDogZnVuY3Rpb24gKGVsLCBldm50LCBmdW5jKSB7XG5cdFx0aWYgKGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIpIHtcblx0XHRcdGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZudCwgZnVuYywgZmFsc2UpO1xuXHRcdH0gZWxzZSBpZiAoZWwuZGV0YWNoRXZlbnQpIHtcblx0XHRcdGVsLmRldGFjaEV2ZW50KCdvbicgKyBldm50LCBmdW5jKTtcblx0XHR9XG5cdH0sXG5cblxuXHRfYXR0YWNoZWRHcm91cEV2ZW50cyA6IHt9LFxuXG5cblx0YXR0YWNoR3JvdXBFdmVudCA6IGZ1bmN0aW9uIChncm91cE5hbWUsIGVsLCBldm50LCBmdW5jKSB7XG5cdFx0aWYgKCFqc2MuX2F0dGFjaGVkR3JvdXBFdmVudHMuaGFzT3duUHJvcGVydHkoZ3JvdXBOYW1lKSkge1xuXHRcdFx0anNjLl9hdHRhY2hlZEdyb3VwRXZlbnRzW2dyb3VwTmFtZV0gPSBbXTtcblx0XHR9XG5cdFx0anNjLl9hdHRhY2hlZEdyb3VwRXZlbnRzW2dyb3VwTmFtZV0ucHVzaChbZWwsIGV2bnQsIGZ1bmNdKTtcblx0XHRqc2MuYXR0YWNoRXZlbnQoZWwsIGV2bnQsIGZ1bmMpO1xuXHR9LFxuXG5cblx0ZGV0YWNoR3JvdXBFdmVudHMgOiBmdW5jdGlvbiAoZ3JvdXBOYW1lKSB7XG5cdFx0aWYgKGpzYy5fYXR0YWNoZWRHcm91cEV2ZW50cy5oYXNPd25Qcm9wZXJ0eShncm91cE5hbWUpKSB7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGpzYy5fYXR0YWNoZWRHcm91cEV2ZW50c1tncm91cE5hbWVdLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdHZhciBldnQgPSBqc2MuX2F0dGFjaGVkR3JvdXBFdmVudHNbZ3JvdXBOYW1lXVtpXTtcblx0XHRcdFx0anNjLmRldGFjaEV2ZW50KGV2dFswXSwgZXZ0WzFdLCBldnRbMl0pO1xuXHRcdFx0fVxuXHRcdFx0ZGVsZXRlIGpzYy5fYXR0YWNoZWRHcm91cEV2ZW50c1tncm91cE5hbWVdO1xuXHRcdH1cblx0fSxcblxuXG5cdGF0dGFjaERPTVJlYWR5RXZlbnQgOiBmdW5jdGlvbiAoZnVuYykge1xuXHRcdHZhciBmaXJlZCA9IGZhbHNlO1xuXHRcdHZhciBmaXJlT25jZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmICghZmlyZWQpIHtcblx0XHRcdFx0ZmlyZWQgPSB0cnVlO1xuXHRcdFx0XHRmdW5jKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7XG5cdFx0XHRzZXRUaW1lb3V0KGZpcmVPbmNlLCAxKTsgLy8gYXN5bmNcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xuXHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZpcmVPbmNlLCBmYWxzZSk7XG5cblx0XHRcdC8vIEZhbGxiYWNrXG5cdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZpcmVPbmNlLCBmYWxzZSk7XG5cblx0XHR9IGVsc2UgaWYgKGRvY3VtZW50LmF0dGFjaEV2ZW50KSB7XG5cdFx0XHQvLyBJRVxuXHRcdFx0ZG9jdW1lbnQuYXR0YWNoRXZlbnQoJ29ucmVhZHlzdGF0ZWNoYW5nZScsIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0aWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcblx0XHRcdFx0XHRkb2N1bWVudC5kZXRhY2hFdmVudCgnb25yZWFkeXN0YXRlY2hhbmdlJywgYXJndW1lbnRzLmNhbGxlZSk7XG5cdFx0XHRcdFx0ZmlyZU9uY2UoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblxuXHRcdFx0Ly8gRmFsbGJhY2tcblx0XHRcdHdpbmRvdy5hdHRhY2hFdmVudCgnb25sb2FkJywgZmlyZU9uY2UpO1xuXG5cdFx0XHQvLyBJRTcvOFxuXHRcdFx0aWYgKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kb1Njcm9sbCAmJiB3aW5kb3cgPT0gd2luZG93LnRvcCkge1xuXHRcdFx0XHR2YXIgdHJ5U2Nyb2xsID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdGlmICghZG9jdW1lbnQuYm9keSkgeyByZXR1cm47IH1cblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0ZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRvU2Nyb2xsKCdsZWZ0Jyk7XG5cdFx0XHRcdFx0XHRmaXJlT25jZSgpO1xuXHRcdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRcdHNldFRpbWVvdXQodHJ5U2Nyb2xsLCAxKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cdFx0XHRcdHRyeVNjcm9sbCgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXG5cdHdhcm4gOiBmdW5jdGlvbiAobXNnKSB7XG5cdFx0aWYgKHdpbmRvdy5jb25zb2xlICYmIHdpbmRvdy5jb25zb2xlLndhcm4pIHtcblx0XHRcdHdpbmRvdy5jb25zb2xlLndhcm4obXNnKTtcblx0XHR9XG5cdH0sXG5cblxuXHRwcmV2ZW50RGVmYXVsdCA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0aWYgKGUucHJldmVudERlZmF1bHQpIHsgZS5wcmV2ZW50RGVmYXVsdCgpOyB9XG5cdFx0ZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuXHR9LFxuXG5cblx0Y2FwdHVyZVRhcmdldCA6IGZ1bmN0aW9uICh0YXJnZXQpIHtcblx0XHQvLyBJRVxuXHRcdGlmICh0YXJnZXQuc2V0Q2FwdHVyZSkge1xuXHRcdFx0anNjLl9jYXB0dXJlZFRhcmdldCA9IHRhcmdldDtcblx0XHRcdGpzYy5fY2FwdHVyZWRUYXJnZXQuc2V0Q2FwdHVyZSgpO1xuXHRcdH1cblx0fSxcblxuXG5cdHJlbGVhc2VUYXJnZXQgOiBmdW5jdGlvbiAoKSB7XG5cdFx0Ly8gSUVcblx0XHRpZiAoanNjLl9jYXB0dXJlZFRhcmdldCkge1xuXHRcdFx0anNjLl9jYXB0dXJlZFRhcmdldC5yZWxlYXNlQ2FwdHVyZSgpO1xuXHRcdFx0anNjLl9jYXB0dXJlZFRhcmdldCA9IG51bGw7XG5cdFx0fVxuXHR9LFxuXG5cblx0ZmlyZUV2ZW50IDogZnVuY3Rpb24gKGVsLCBldm50KSB7XG5cdFx0aWYgKCFlbCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRpZiAoZG9jdW1lbnQuY3JlYXRlRXZlbnQpIHtcblx0XHRcdHZhciBldiA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdIVE1MRXZlbnRzJyk7XG5cdFx0XHRldi5pbml0RXZlbnQoZXZudCwgdHJ1ZSwgdHJ1ZSk7XG5cdFx0XHRlbC5kaXNwYXRjaEV2ZW50KGV2KTtcblx0XHR9IGVsc2UgaWYgKGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KSB7XG5cdFx0XHR2YXIgZXYgPSBkb2N1bWVudC5jcmVhdGVFdmVudE9iamVjdCgpO1xuXHRcdFx0ZWwuZmlyZUV2ZW50KCdvbicgKyBldm50LCBldik7XG5cdFx0fSBlbHNlIGlmIChlbFsnb24nICsgZXZudF0pIHsgLy8gYWx0ZXJuYXRpdmVseSB1c2UgdGhlIHRyYWRpdGlvbmFsIGV2ZW50IG1vZGVsXG5cdFx0XHRlbFsnb24nICsgZXZudF0oKTtcblx0XHR9XG5cdH0sXG5cblxuXHRjbGFzc05hbWVUb0xpc3QgOiBmdW5jdGlvbiAoY2xhc3NOYW1lKSB7XG5cdFx0cmV0dXJuIGNsYXNzTmFtZS5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJykuc3BsaXQoL1xccysvKTtcblx0fSxcblxuXG5cdC8vIFRoZSBjbGFzc05hbWUgcGFyYW1ldGVyIChzdHIpIGNhbiBvbmx5IGNvbnRhaW4gYSBzaW5nbGUgY2xhc3MgbmFtZVxuXHRoYXNDbGFzcyA6IGZ1bmN0aW9uIChlbG0sIGNsYXNzTmFtZSkge1xuXHRcdGlmICghY2xhc3NOYW1lKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdHJldHVybiAtMSAhPSAoJyAnICsgZWxtLmNsYXNzTmFtZS5yZXBsYWNlKC9cXHMrL2csICcgJykgKyAnICcpLmluZGV4T2YoJyAnICsgY2xhc3NOYW1lICsgJyAnKTtcblx0fSxcblxuXG5cdC8vIFRoZSBjbGFzc05hbWUgcGFyYW1ldGVyIChzdHIpIGNhbiBjb250YWluIG11bHRpcGxlIGNsYXNzIG5hbWVzIHNlcGFyYXRlZCBieSB3aGl0ZXNwYWNlXG5cdHNldENsYXNzIDogZnVuY3Rpb24gKGVsbSwgY2xhc3NOYW1lKSB7XG5cdFx0dmFyIGNsYXNzTGlzdCA9IGpzYy5jbGFzc05hbWVUb0xpc3QoY2xhc3NOYW1lKTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGNsYXNzTGlzdC5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0aWYgKCFqc2MuaGFzQ2xhc3MoZWxtLCBjbGFzc0xpc3RbaV0pKSB7XG5cdFx0XHRcdGVsbS5jbGFzc05hbWUgKz0gKGVsbS5jbGFzc05hbWUgPyAnICcgOiAnJykgKyBjbGFzc0xpc3RbaV07XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gVGhlIGNsYXNzTmFtZSBwYXJhbWV0ZXIgKHN0cikgY2FuIGNvbnRhaW4gbXVsdGlwbGUgY2xhc3MgbmFtZXMgc2VwYXJhdGVkIGJ5IHdoaXRlc3BhY2Vcblx0dW5zZXRDbGFzcyA6IGZ1bmN0aW9uIChlbG0sIGNsYXNzTmFtZSkge1xuXHRcdHZhciBjbGFzc0xpc3QgPSBqc2MuY2xhc3NOYW1lVG9MaXN0KGNsYXNzTmFtZSk7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjbGFzc0xpc3QubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdHZhciByZXBsID0gbmV3IFJlZ0V4cChcblx0XHRcdFx0J15cXFxccyonICsgY2xhc3NMaXN0W2ldICsgJ1xcXFxzKnwnICtcblx0XHRcdFx0J1xcXFxzKicgKyBjbGFzc0xpc3RbaV0gKyAnXFxcXHMqJHwnICtcblx0XHRcdFx0J1xcXFxzKycgKyBjbGFzc0xpc3RbaV0gKyAnKFxcXFxzKyknLFxuXHRcdFx0XHQnZydcblx0XHRcdCk7XG5cdFx0XHRlbG0uY2xhc3NOYW1lID0gZWxtLmNsYXNzTmFtZS5yZXBsYWNlKHJlcGwsICckMScpO1xuXHRcdH1cblx0fSxcblxuXG5cdGdldFN0eWxlIDogZnVuY3Rpb24gKGVsbSkge1xuXHRcdHJldHVybiB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSA/IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsbSkgOiBlbG0uY3VycmVudFN0eWxlO1xuXHR9LFxuXG5cblx0c2V0U3R5bGUgOiAoZnVuY3Rpb24gKCkge1xuXHRcdHZhciBoZWxwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0XHR2YXIgZ2V0U3VwcG9ydGVkUHJvcCA9IGZ1bmN0aW9uIChuYW1lcykge1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBuYW1lcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRpZiAobmFtZXNbaV0gaW4gaGVscGVyLnN0eWxlKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG5hbWVzW2ldO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblx0XHR2YXIgcHJvcHMgPSB7XG5cdFx0XHRib3JkZXJSYWRpdXM6IGdldFN1cHBvcnRlZFByb3AoWydib3JkZXJSYWRpdXMnLCAnTW96Qm9yZGVyUmFkaXVzJywgJ3dlYmtpdEJvcmRlclJhZGl1cyddKSxcblx0XHRcdGJveFNoYWRvdzogZ2V0U3VwcG9ydGVkUHJvcChbJ2JveFNoYWRvdycsICdNb3pCb3hTaGFkb3cnLCAnd2Via2l0Qm94U2hhZG93J10pXG5cdFx0fTtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKGVsbSwgcHJvcCwgdmFsdWUpIHtcblx0XHRcdHN3aXRjaCAocHJvcC50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0XHRjYXNlICdvcGFjaXR5Jzpcblx0XHRcdFx0dmFyIGFscGhhT3BhY2l0eSA9IE1hdGgucm91bmQocGFyc2VGbG9hdCh2YWx1ZSkgKiAxMDApO1xuXHRcdFx0XHRlbG0uc3R5bGUub3BhY2l0eSA9IHZhbHVlO1xuXHRcdFx0XHRlbG0uc3R5bGUuZmlsdGVyID0gJ2FscGhhKG9wYWNpdHk9JyArIGFscGhhT3BhY2l0eSArICcpJztcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRlbG0uc3R5bGVbcHJvcHNbcHJvcF1dID0gdmFsdWU7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH07XG5cdH0pKCksXG5cblxuXHRzZXRCb3JkZXJSYWRpdXMgOiBmdW5jdGlvbiAoZWxtLCB2YWx1ZSkge1xuXHRcdGpzYy5zZXRTdHlsZShlbG0sICdib3JkZXJSYWRpdXMnLCB2YWx1ZSB8fCAnMCcpO1xuXHR9LFxuXG5cblx0c2V0Qm94U2hhZG93IDogZnVuY3Rpb24gKGVsbSwgdmFsdWUpIHtcblx0XHRqc2Muc2V0U3R5bGUoZWxtLCAnYm94U2hhZG93JywgdmFsdWUgfHwgJ25vbmUnKTtcblx0fSxcblxuXG5cdGdldEVsZW1lbnRQb3MgOiBmdW5jdGlvbiAoZSwgcmVsYXRpdmVUb1ZpZXdwb3J0KSB7XG5cdFx0dmFyIHg9MCwgeT0wO1xuXHRcdHZhciByZWN0ID0gZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0XHR4ID0gcmVjdC5sZWZ0O1xuXHRcdHkgPSByZWN0LnRvcDtcblx0XHRpZiAoIXJlbGF0aXZlVG9WaWV3cG9ydCkge1xuXHRcdFx0dmFyIHZpZXdQb3MgPSBqc2MuZ2V0Vmlld1BvcygpO1xuXHRcdFx0eCArPSB2aWV3UG9zWzBdO1xuXHRcdFx0eSArPSB2aWV3UG9zWzFdO1xuXHRcdH1cblx0XHRyZXR1cm4gW3gsIHldO1xuXHR9LFxuXG5cblx0Z2V0RWxlbWVudFNpemUgOiBmdW5jdGlvbiAoZSkge1xuXHRcdHJldHVybiBbZS5vZmZzZXRXaWR0aCwgZS5vZmZzZXRIZWlnaHRdO1xuXHR9LFxuXG5cblx0Ly8gZ2V0IHBvaW50ZXIncyBYL1kgY29vcmRpbmF0ZXMgcmVsYXRpdmUgdG8gdmlld3BvcnRcblx0Z2V0QWJzUG9pbnRlclBvcyA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0aWYgKCFlKSB7IGUgPSB3aW5kb3cuZXZlbnQ7IH1cblx0XHR2YXIgeCA9IDAsIHkgPSAwO1xuXHRcdGlmICh0eXBlb2YgZS5jaGFuZ2VkVG91Y2hlcyAhPT0gJ3VuZGVmaW5lZCcgJiYgZS5jaGFuZ2VkVG91Y2hlcy5sZW5ndGgpIHtcblx0XHRcdC8vIHRvdWNoIGRldmljZXNcblx0XHRcdHggPSBlLmNoYW5nZWRUb3VjaGVzWzBdLmNsaWVudFg7XG5cdFx0XHR5ID0gZS5jaGFuZ2VkVG91Y2hlc1swXS5jbGllbnRZO1xuXHRcdH0gZWxzZSBpZiAodHlwZW9mIGUuY2xpZW50WCA9PT0gJ251bWJlcicpIHtcblx0XHRcdHggPSBlLmNsaWVudFg7XG5cdFx0XHR5ID0gZS5jbGllbnRZO1xuXHRcdH1cblx0XHRyZXR1cm4geyB4OiB4LCB5OiB5IH07XG5cdH0sXG5cblxuXHQvLyBnZXQgcG9pbnRlcidzIFgvWSBjb29yZGluYXRlcyByZWxhdGl2ZSB0byB0YXJnZXQgZWxlbWVudFxuXHRnZXRSZWxQb2ludGVyUG9zIDogZnVuY3Rpb24gKGUpIHtcblx0XHRpZiAoIWUpIHsgZSA9IHdpbmRvdy5ldmVudDsgfVxuXHRcdHZhciB0YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XG5cdFx0dmFyIHRhcmdldFJlY3QgPSB0YXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cblx0XHR2YXIgeCA9IDAsIHkgPSAwO1xuXG5cdFx0dmFyIGNsaWVudFggPSAwLCBjbGllbnRZID0gMDtcblx0XHRpZiAodHlwZW9mIGUuY2hhbmdlZFRvdWNoZXMgIT09ICd1bmRlZmluZWQnICYmIGUuY2hhbmdlZFRvdWNoZXMubGVuZ3RoKSB7XG5cdFx0XHQvLyB0b3VjaCBkZXZpY2VzXG5cdFx0XHRjbGllbnRYID0gZS5jaGFuZ2VkVG91Y2hlc1swXS5jbGllbnRYO1xuXHRcdFx0Y2xpZW50WSA9IGUuY2hhbmdlZFRvdWNoZXNbMF0uY2xpZW50WTtcblx0XHR9IGVsc2UgaWYgKHR5cGVvZiBlLmNsaWVudFggPT09ICdudW1iZXInKSB7XG5cdFx0XHRjbGllbnRYID0gZS5jbGllbnRYO1xuXHRcdFx0Y2xpZW50WSA9IGUuY2xpZW50WTtcblx0XHR9XG5cblx0XHR4ID0gY2xpZW50WCAtIHRhcmdldFJlY3QubGVmdDtcblx0XHR5ID0gY2xpZW50WSAtIHRhcmdldFJlY3QudG9wO1xuXHRcdHJldHVybiB7IHg6IHgsIHk6IHkgfTtcblx0fSxcblxuXG5cdGdldFZpZXdQb3MgOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGRvYyA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblx0XHRyZXR1cm4gW1xuXHRcdFx0KHdpbmRvdy5wYWdlWE9mZnNldCB8fCBkb2Muc2Nyb2xsTGVmdCkgLSAoZG9jLmNsaWVudExlZnQgfHwgMCksXG5cdFx0XHQod2luZG93LnBhZ2VZT2Zmc2V0IHx8IGRvYy5zY3JvbGxUb3ApIC0gKGRvYy5jbGllbnRUb3AgfHwgMClcblx0XHRdO1xuXHR9LFxuXG5cblx0Z2V0Vmlld1NpemUgOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGRvYyA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblx0XHRyZXR1cm4gW1xuXHRcdFx0KHdpbmRvdy5pbm5lcldpZHRoIHx8IGRvYy5jbGllbnRXaWR0aCksXG5cdFx0XHQod2luZG93LmlubmVySGVpZ2h0IHx8IGRvYy5jbGllbnRIZWlnaHQpLFxuXHRcdF07XG5cdH0sXG5cblxuXHRyZWRyYXdQb3NpdGlvbiA6IGZ1bmN0aW9uICgpIHtcblxuXHRcdGlmIChqc2MucGlja2VyICYmIGpzYy5waWNrZXIub3duZXIpIHtcblx0XHRcdHZhciB0aGlzT2JqID0ganNjLnBpY2tlci5vd25lcjtcblxuXHRcdFx0dmFyIHRwLCB2cDtcblxuXHRcdFx0aWYgKHRoaXNPYmouZml4ZWQpIHtcblx0XHRcdFx0Ly8gRml4ZWQgZWxlbWVudHMgYXJlIHBvc2l0aW9uZWQgcmVsYXRpdmUgdG8gdmlld3BvcnQsXG5cdFx0XHRcdC8vIHRoZXJlZm9yZSB3ZSBjYW4gaWdub3JlIHRoZSBzY3JvbGwgb2Zmc2V0XG5cdFx0XHRcdHRwID0ganNjLmdldEVsZW1lbnRQb3ModGhpc09iai50YXJnZXRFbGVtZW50LCB0cnVlKTsgLy8gdGFyZ2V0IHBvc1xuXHRcdFx0XHR2cCA9IFswLCAwXTsgLy8gdmlldyBwb3Ncblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRwID0ganNjLmdldEVsZW1lbnRQb3ModGhpc09iai50YXJnZXRFbGVtZW50KTsgLy8gdGFyZ2V0IHBvc1xuXHRcdFx0XHR2cCA9IGpzYy5nZXRWaWV3UG9zKCk7IC8vIHZpZXcgcG9zXG5cdFx0XHR9XG5cblx0XHRcdHZhciB0cyA9IGpzYy5nZXRFbGVtZW50U2l6ZSh0aGlzT2JqLnRhcmdldEVsZW1lbnQpOyAvLyB0YXJnZXQgc2l6ZVxuXHRcdFx0dmFyIHZzID0ganNjLmdldFZpZXdTaXplKCk7IC8vIHZpZXcgc2l6ZVxuXHRcdFx0dmFyIHBzID0ganNjLmdldFBpY2tlck91dGVyRGltcyh0aGlzT2JqKTsgLy8gcGlja2VyIHNpemVcblx0XHRcdHZhciBhLCBiLCBjO1xuXHRcdFx0c3dpdGNoICh0aGlzT2JqLnBvc2l0aW9uLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRcdFx0Y2FzZSAnbGVmdCc6IGE9MTsgYj0wOyBjPS0xOyBicmVhaztcblx0XHRcdFx0Y2FzZSAncmlnaHQnOmE9MTsgYj0wOyBjPTE7IGJyZWFrO1xuXHRcdFx0XHRjYXNlICd0b3AnOiAgYT0wOyBiPTE7IGM9LTE7IGJyZWFrO1xuXHRcdFx0XHRkZWZhdWx0OiAgICAgYT0wOyBiPTE7IGM9MTsgYnJlYWs7XG5cdFx0XHR9XG5cdFx0XHR2YXIgbCA9ICh0c1tiXStwc1tiXSkvMjtcblxuXHRcdFx0Ly8gY29tcHV0ZSBwaWNrZXIgcG9zaXRpb25cblx0XHRcdGlmICghdGhpc09iai5zbWFydFBvc2l0aW9uKSB7XG5cdFx0XHRcdHZhciBwcCA9IFtcblx0XHRcdFx0XHR0cFthXSxcblx0XHRcdFx0XHR0cFtiXSt0c1tiXS1sK2wqY1xuXHRcdFx0XHRdO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dmFyIHBwID0gW1xuXHRcdFx0XHRcdC12cFthXSt0cFthXStwc1thXSA+IHZzW2FdID9cblx0XHRcdFx0XHRcdCgtdnBbYV0rdHBbYV0rdHNbYV0vMiA+IHZzW2FdLzIgJiYgdHBbYV0rdHNbYV0tcHNbYV0gPj0gMCA/IHRwW2FdK3RzW2FdLXBzW2FdIDogdHBbYV0pIDpcblx0XHRcdFx0XHRcdHRwW2FdLFxuXHRcdFx0XHRcdC12cFtiXSt0cFtiXSt0c1tiXStwc1tiXS1sK2wqYyA+IHZzW2JdID9cblx0XHRcdFx0XHRcdCgtdnBbYl0rdHBbYl0rdHNbYl0vMiA+IHZzW2JdLzIgJiYgdHBbYl0rdHNbYl0tbC1sKmMgPj0gMCA/IHRwW2JdK3RzW2JdLWwtbCpjIDogdHBbYl0rdHNbYl0tbCtsKmMpIDpcblx0XHRcdFx0XHRcdCh0cFtiXSt0c1tiXS1sK2wqYyA+PSAwID8gdHBbYl0rdHNbYl0tbCtsKmMgOiB0cFtiXSt0c1tiXS1sLWwqYylcblx0XHRcdFx0XTtcblx0XHRcdH1cblxuXHRcdFx0dmFyIHggPSBwcFthXTtcblx0XHRcdHZhciB5ID0gcHBbYl07XG5cdFx0XHR2YXIgcG9zaXRpb25WYWx1ZSA9IHRoaXNPYmouZml4ZWQgPyAnZml4ZWQnIDogJ2Fic29sdXRlJztcblx0XHRcdHZhciBjb250cmFjdFNoYWRvdyA9XG5cdFx0XHRcdChwcFswXSArIHBzWzBdID4gdHBbMF0gfHwgcHBbMF0gPCB0cFswXSArIHRzWzBdKSAmJlxuXHRcdFx0XHQocHBbMV0gKyBwc1sxXSA8IHRwWzFdICsgdHNbMV0pO1xuXG5cdFx0XHRqc2MuX2RyYXdQb3NpdGlvbih0aGlzT2JqLCB4LCB5LCBwb3NpdGlvblZhbHVlLCBjb250cmFjdFNoYWRvdyk7XG5cdFx0fVxuXHR9LFxuXG5cblx0X2RyYXdQb3NpdGlvbiA6IGZ1bmN0aW9uICh0aGlzT2JqLCB4LCB5LCBwb3NpdGlvblZhbHVlLCBjb250cmFjdFNoYWRvdykge1xuXHRcdHZhciB2U2hhZG93ID0gY29udHJhY3RTaGFkb3cgPyAwIDogdGhpc09iai5zaGFkb3dCbHVyOyAvLyBweFxuXG5cdFx0anNjLnBpY2tlci53cmFwLnN0eWxlLnBvc2l0aW9uID0gcG9zaXRpb25WYWx1ZTtcblx0XHRqc2MucGlja2VyLndyYXAuc3R5bGUubGVmdCA9IHggKyAncHgnO1xuXHRcdGpzYy5waWNrZXIud3JhcC5zdHlsZS50b3AgPSB5ICsgJ3B4JztcblxuXHRcdGpzYy5zZXRCb3hTaGFkb3coXG5cdFx0XHRqc2MucGlja2VyLmJveFMsXG5cdFx0XHR0aGlzT2JqLnNoYWRvdyA/XG5cdFx0XHRcdG5ldyBqc2MuQm94U2hhZG93KDAsIHZTaGFkb3csIHRoaXNPYmouc2hhZG93Qmx1ciwgMCwgdGhpc09iai5zaGFkb3dDb2xvcikgOlxuXHRcdFx0XHRudWxsKTtcblx0fSxcblxuXG5cdGdldFBpY2tlckRpbXMgOiBmdW5jdGlvbiAodGhpc09iaikge1xuXHRcdHZhciBkaXNwbGF5U2xpZGVyID0gISFqc2MuZ2V0U2xpZGVyQ29tcG9uZW50KHRoaXNPYmopO1xuXHRcdHZhciBkaW1zID0gW1xuXHRcdFx0MiAqIHRoaXNPYmouaW5zZXRXaWR0aCArIDIgKiB0aGlzT2JqLnBhZGRpbmcgKyB0aGlzT2JqLndpZHRoICtcblx0XHRcdFx0KGRpc3BsYXlTbGlkZXIgPyAyICogdGhpc09iai5pbnNldFdpZHRoICsganNjLmdldFBhZFRvU2xpZGVyUGFkZGluZyh0aGlzT2JqKSArIHRoaXNPYmouc2xpZGVyU2l6ZSA6IDApLFxuXHRcdFx0MiAqIHRoaXNPYmouaW5zZXRXaWR0aCArIDIgKiB0aGlzT2JqLnBhZGRpbmcgKyB0aGlzT2JqLmhlaWdodCArXG5cdFx0XHRcdCh0aGlzT2JqLmNsb3NhYmxlID8gMiAqIHRoaXNPYmouaW5zZXRXaWR0aCArIHRoaXNPYmoucGFkZGluZyArIHRoaXNPYmouYnV0dG9uSGVpZ2h0IDogMClcblx0XHRdO1xuXHRcdHJldHVybiBkaW1zO1xuXHR9LFxuXG5cblx0Z2V0UGlja2VyT3V0ZXJEaW1zIDogZnVuY3Rpb24gKHRoaXNPYmopIHtcblx0XHR2YXIgZGltcyA9IGpzYy5nZXRQaWNrZXJEaW1zKHRoaXNPYmopO1xuXHRcdHJldHVybiBbXG5cdFx0XHRkaW1zWzBdICsgMiAqIHRoaXNPYmouYm9yZGVyV2lkdGgsXG5cdFx0XHRkaW1zWzFdICsgMiAqIHRoaXNPYmouYm9yZGVyV2lkdGhcblx0XHRdO1xuXHR9LFxuXG5cblx0Z2V0UGFkVG9TbGlkZXJQYWRkaW5nIDogZnVuY3Rpb24gKHRoaXNPYmopIHtcblx0XHRyZXR1cm4gTWF0aC5tYXgodGhpc09iai5wYWRkaW5nLCAxLjUgKiAoMiAqIHRoaXNPYmoucG9pbnRlckJvcmRlcldpZHRoICsgdGhpc09iai5wb2ludGVyVGhpY2tuZXNzKSk7XG5cdH0sXG5cblxuXHRnZXRQYWRZQ29tcG9uZW50IDogZnVuY3Rpb24gKHRoaXNPYmopIHtcblx0XHRzd2l0Y2ggKHRoaXNPYmoubW9kZS5jaGFyQXQoMSkudG9Mb3dlckNhc2UoKSkge1xuXHRcdFx0Y2FzZSAndic6IHJldHVybiAndic7IGJyZWFrO1xuXHRcdH1cblx0XHRyZXR1cm4gJ3MnO1xuXHR9LFxuXG5cblx0Z2V0U2xpZGVyQ29tcG9uZW50IDogZnVuY3Rpb24gKHRoaXNPYmopIHtcblx0XHRpZiAodGhpc09iai5tb2RlLmxlbmd0aCA+IDIpIHtcblx0XHRcdHN3aXRjaCAodGhpc09iai5tb2RlLmNoYXJBdCgyKS50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0XHRcdGNhc2UgJ3MnOiByZXR1cm4gJ3MnOyBicmVhaztcblx0XHRcdFx0Y2FzZSAndic6IHJldHVybiAndic7IGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gbnVsbDtcblx0fSxcblxuXG5cdG9uRG9jdW1lbnRNb3VzZURvd24gOiBmdW5jdGlvbiAoZSkge1xuXHRcdGlmICghZSkgeyBlID0gd2luZG93LmV2ZW50OyB9XG5cdFx0dmFyIHRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcblxuXHRcdGlmICh0YXJnZXQuX2pzY0xpbmtlZEluc3RhbmNlKSB7XG5cdFx0XHRpZiAodGFyZ2V0Ll9qc2NMaW5rZWRJbnN0YW5jZS5zaG93T25DbGljaykge1xuXHRcdFx0XHR0YXJnZXQuX2pzY0xpbmtlZEluc3RhbmNlLnNob3coKTtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKHRhcmdldC5fanNjQ29udHJvbE5hbWUpIHtcblx0XHRcdGpzYy5vbkNvbnRyb2xQb2ludGVyU3RhcnQoZSwgdGFyZ2V0LCB0YXJnZXQuX2pzY0NvbnRyb2xOYW1lLCAnbW91c2UnKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gTW91c2UgaXMgb3V0c2lkZSB0aGUgcGlja2VyIGNvbnRyb2xzIC0+IGhpZGUgdGhlIGNvbG9yIHBpY2tlciFcblx0XHRcdGlmIChqc2MucGlja2VyICYmIGpzYy5waWNrZXIub3duZXIpIHtcblx0XHRcdFx0anNjLnBpY2tlci5vd25lci5oaWRlKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0b25Eb2N1bWVudFRvdWNoU3RhcnQgOiBmdW5jdGlvbiAoZSkge1xuXHRcdGlmICghZSkgeyBlID0gd2luZG93LmV2ZW50OyB9XG5cdFx0dmFyIHRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcblxuXHRcdGlmICh0YXJnZXQuX2pzY0xpbmtlZEluc3RhbmNlKSB7XG5cdFx0XHRpZiAodGFyZ2V0Ll9qc2NMaW5rZWRJbnN0YW5jZS5zaG93T25DbGljaykge1xuXHRcdFx0XHR0YXJnZXQuX2pzY0xpbmtlZEluc3RhbmNlLnNob3coKTtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKHRhcmdldC5fanNjQ29udHJvbE5hbWUpIHtcblx0XHRcdGpzYy5vbkNvbnRyb2xQb2ludGVyU3RhcnQoZSwgdGFyZ2V0LCB0YXJnZXQuX2pzY0NvbnRyb2xOYW1lLCAndG91Y2gnKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKGpzYy5waWNrZXIgJiYganNjLnBpY2tlci5vd25lcikge1xuXHRcdFx0XHRqc2MucGlja2VyLm93bmVyLmhpZGUoKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblxuXHRvbldpbmRvd1Jlc2l6ZSA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0anNjLnJlZHJhd1Bvc2l0aW9uKCk7XG5cdH0sXG5cblxuXHRvblBhcmVudFNjcm9sbCA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0Ly8gaGlkZSB0aGUgcGlja2VyIHdoZW4gb25lIG9mIHRoZSBwYXJlbnQgZWxlbWVudHMgaXMgc2Nyb2xsZWRcblx0XHRpZiAoanNjLnBpY2tlciAmJiBqc2MucGlja2VyLm93bmVyKSB7XG5cdFx0XHRqc2MucGlja2VyLm93bmVyLmhpZGUoKTtcblx0XHR9XG5cdH0sXG5cblxuXHRfcG9pbnRlck1vdmVFdmVudCA6IHtcblx0XHRtb3VzZTogJ21vdXNlbW92ZScsXG5cdFx0dG91Y2g6ICd0b3VjaG1vdmUnXG5cdH0sXG5cdF9wb2ludGVyRW5kRXZlbnQgOiB7XG5cdFx0bW91c2U6ICdtb3VzZXVwJyxcblx0XHR0b3VjaDogJ3RvdWNoZW5kJ1xuXHR9LFxuXG5cblx0X3BvaW50ZXJPcmlnaW4gOiBudWxsLFxuXHRfY2FwdHVyZWRUYXJnZXQgOiBudWxsLFxuXG5cblx0b25Db250cm9sUG9pbnRlclN0YXJ0IDogZnVuY3Rpb24gKGUsIHRhcmdldCwgY29udHJvbE5hbWUsIHBvaW50ZXJUeXBlKSB7XG5cdFx0dmFyIHRoaXNPYmogPSB0YXJnZXQuX2pzY0luc3RhbmNlO1xuXG5cdFx0anNjLnByZXZlbnREZWZhdWx0KGUpO1xuXHRcdGpzYy5jYXB0dXJlVGFyZ2V0KHRhcmdldCk7XG5cblx0XHR2YXIgcmVnaXN0ZXJEcmFnRXZlbnRzID0gZnVuY3Rpb24gKGRvYywgb2Zmc2V0KSB7XG5cdFx0XHRqc2MuYXR0YWNoR3JvdXBFdmVudCgnZHJhZycsIGRvYywganNjLl9wb2ludGVyTW92ZUV2ZW50W3BvaW50ZXJUeXBlXSxcblx0XHRcdFx0anNjLm9uRG9jdW1lbnRQb2ludGVyTW92ZShlLCB0YXJnZXQsIGNvbnRyb2xOYW1lLCBwb2ludGVyVHlwZSwgb2Zmc2V0KSk7XG5cdFx0XHRqc2MuYXR0YWNoR3JvdXBFdmVudCgnZHJhZycsIGRvYywganNjLl9wb2ludGVyRW5kRXZlbnRbcG9pbnRlclR5cGVdLFxuXHRcdFx0XHRqc2Mub25Eb2N1bWVudFBvaW50ZXJFbmQoZSwgdGFyZ2V0LCBjb250cm9sTmFtZSwgcG9pbnRlclR5cGUpKTtcblx0XHR9O1xuXG5cdFx0cmVnaXN0ZXJEcmFnRXZlbnRzKGRvY3VtZW50LCBbMCwgMF0pO1xuXG5cdFx0aWYgKHdpbmRvdy5wYXJlbnQgJiYgd2luZG93LmZyYW1lRWxlbWVudCkge1xuXHRcdFx0dmFyIHJlY3QgPSB3aW5kb3cuZnJhbWVFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdFx0dmFyIG9mcyA9IFstcmVjdC5sZWZ0LCAtcmVjdC50b3BdO1xuXHRcdFx0cmVnaXN0ZXJEcmFnRXZlbnRzKHdpbmRvdy5wYXJlbnQud2luZG93LmRvY3VtZW50LCBvZnMpO1xuXHRcdH1cblxuXHRcdHZhciBhYnMgPSBqc2MuZ2V0QWJzUG9pbnRlclBvcyhlKTtcblx0XHR2YXIgcmVsID0ganNjLmdldFJlbFBvaW50ZXJQb3MoZSk7XG5cdFx0anNjLl9wb2ludGVyT3JpZ2luID0ge1xuXHRcdFx0eDogYWJzLnggLSByZWwueCxcblx0XHRcdHk6IGFicy55IC0gcmVsLnlcblx0XHR9O1xuXG5cdFx0c3dpdGNoIChjb250cm9sTmFtZSkge1xuXHRcdGNhc2UgJ3BhZCc6XG5cdFx0XHQvLyBpZiB0aGUgc2xpZGVyIGlzIGF0IHRoZSBib3R0b20sIG1vdmUgaXQgdXBcblx0XHRcdHN3aXRjaCAoanNjLmdldFNsaWRlckNvbXBvbmVudCh0aGlzT2JqKSkge1xuXHRcdFx0Y2FzZSAncyc6IGlmICh0aGlzT2JqLmhzdlsxXSA9PT0gMCkgeyB0aGlzT2JqLmZyb21IU1YobnVsbCwgMTAwLCBudWxsKTsgfTsgYnJlYWs7XG5cdFx0XHRjYXNlICd2JzogaWYgKHRoaXNPYmouaHN2WzJdID09PSAwKSB7IHRoaXNPYmouZnJvbUhTVihudWxsLCBudWxsLCAxMDApOyB9OyBicmVhaztcblx0XHRcdH1cblx0XHRcdGpzYy5zZXRQYWQodGhpc09iaiwgZSwgMCwgMCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgJ3NsZCc6XG5cdFx0XHRqc2Muc2V0U2xkKHRoaXNPYmosIGUsIDApO1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXG5cdFx0anNjLmRpc3BhdGNoRmluZUNoYW5nZSh0aGlzT2JqKTtcblx0fSxcblxuXG5cdG9uRG9jdW1lbnRQb2ludGVyTW92ZSA6IGZ1bmN0aW9uIChlLCB0YXJnZXQsIGNvbnRyb2xOYW1lLCBwb2ludGVyVHlwZSwgb2Zmc2V0KSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChlKSB7XG5cdFx0XHR2YXIgdGhpc09iaiA9IHRhcmdldC5fanNjSW5zdGFuY2U7XG5cdFx0XHRzd2l0Y2ggKGNvbnRyb2xOYW1lKSB7XG5cdFx0XHRjYXNlICdwYWQnOlxuXHRcdFx0XHRpZiAoIWUpIHsgZSA9IHdpbmRvdy5ldmVudDsgfVxuXHRcdFx0XHRqc2Muc2V0UGFkKHRoaXNPYmosIGUsIG9mZnNldFswXSwgb2Zmc2V0WzFdKTtcblx0XHRcdFx0anNjLmRpc3BhdGNoRmluZUNoYW5nZSh0aGlzT2JqKTtcblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdGNhc2UgJ3NsZCc6XG5cdFx0XHRcdGlmICghZSkgeyBlID0gd2luZG93LmV2ZW50OyB9XG5cdFx0XHRcdGpzYy5zZXRTbGQodGhpc09iaiwgZSwgb2Zmc2V0WzFdKTtcblx0XHRcdFx0anNjLmRpc3BhdGNoRmluZUNoYW5nZSh0aGlzT2JqKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0b25Eb2N1bWVudFBvaW50ZXJFbmQgOiBmdW5jdGlvbiAoZSwgdGFyZ2V0LCBjb250cm9sTmFtZSwgcG9pbnRlclR5cGUpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKGUpIHtcblx0XHRcdHZhciB0aGlzT2JqID0gdGFyZ2V0Ll9qc2NJbnN0YW5jZTtcblx0XHRcdGpzYy5kZXRhY2hHcm91cEV2ZW50cygnZHJhZycpO1xuXHRcdFx0anNjLnJlbGVhc2VUYXJnZXQoKTtcblx0XHRcdC8vIEFsd2F5cyBkaXNwYXRjaCBjaGFuZ2VzIGFmdGVyIGRldGFjaGluZyBvdXRzdGFuZGluZyBtb3VzZSBoYW5kbGVycyxcblx0XHRcdC8vIGluIGNhc2Ugc29tZSB1c2VyIGludGVyYWN0aW9uIHdpbGwgb2NjdXIgaW4gdXNlcidzIG9uY2hhbmdlIGNhbGxiYWNrXG5cdFx0XHQvLyB0aGF0IHdvdWxkIGludHJ1ZGUgd2l0aCBjdXJyZW50IG1vdXNlIGV2ZW50c1xuXHRcdFx0anNjLmRpc3BhdGNoQ2hhbmdlKHRoaXNPYmopO1xuXHRcdH07XG5cdH0sXG5cblxuXHRkaXNwYXRjaENoYW5nZSA6IGZ1bmN0aW9uICh0aGlzT2JqKSB7XG5cdFx0aWYgKHRoaXNPYmoudmFsdWVFbGVtZW50KSB7XG5cdFx0XHRpZiAoanNjLmlzRWxlbWVudFR5cGUodGhpc09iai52YWx1ZUVsZW1lbnQsICdpbnB1dCcpKSB7XG5cdFx0XHRcdGpzYy5maXJlRXZlbnQodGhpc09iai52YWx1ZUVsZW1lbnQsICdjaGFuZ2UnKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblxuXHRkaXNwYXRjaEZpbmVDaGFuZ2UgOiBmdW5jdGlvbiAodGhpc09iaikge1xuXHRcdGlmICh0aGlzT2JqLm9uRmluZUNoYW5nZSkge1xuXHRcdFx0dmFyIGNhbGxiYWNrO1xuXHRcdFx0aWYgKHR5cGVvZiB0aGlzT2JqLm9uRmluZUNoYW5nZSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdFx0Y2FsbGJhY2sgPSBuZXcgRnVuY3Rpb24gKHRoaXNPYmoub25GaW5lQ2hhbmdlKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNhbGxiYWNrID0gdGhpc09iai5vbkZpbmVDaGFuZ2U7XG5cdFx0XHR9XG5cdFx0XHRjYWxsYmFjay5jYWxsKHRoaXNPYmopO1xuXHRcdH1cblx0fSxcblxuXG5cdHNldFBhZCA6IGZ1bmN0aW9uICh0aGlzT2JqLCBlLCBvZnNYLCBvZnNZKSB7XG5cdFx0dmFyIHBvaW50ZXJBYnMgPSBqc2MuZ2V0QWJzUG9pbnRlclBvcyhlKTtcblx0XHR2YXIgeCA9IG9mc1ggKyBwb2ludGVyQWJzLnggLSBqc2MuX3BvaW50ZXJPcmlnaW4ueCAtIHRoaXNPYmoucGFkZGluZyAtIHRoaXNPYmouaW5zZXRXaWR0aDtcblx0XHR2YXIgeSA9IG9mc1kgKyBwb2ludGVyQWJzLnkgLSBqc2MuX3BvaW50ZXJPcmlnaW4ueSAtIHRoaXNPYmoucGFkZGluZyAtIHRoaXNPYmouaW5zZXRXaWR0aDtcblxuXHRcdHZhciB4VmFsID0geCAqICgzNjAgLyAodGhpc09iai53aWR0aCAtIDEpKTtcblx0XHR2YXIgeVZhbCA9IDEwMCAtICh5ICogKDEwMCAvICh0aGlzT2JqLmhlaWdodCAtIDEpKSk7XG5cblx0XHRzd2l0Y2ggKGpzYy5nZXRQYWRZQ29tcG9uZW50KHRoaXNPYmopKSB7XG5cdFx0Y2FzZSAncyc6IHRoaXNPYmouZnJvbUhTVih4VmFsLCB5VmFsLCBudWxsLCBqc2MubGVhdmVTbGQpOyBicmVhaztcblx0XHRjYXNlICd2JzogdGhpc09iai5mcm9tSFNWKHhWYWwsIG51bGwsIHlWYWwsIGpzYy5sZWF2ZVNsZCk7IGJyZWFrO1xuXHRcdH1cblx0fSxcblxuXG5cdHNldFNsZCA6IGZ1bmN0aW9uICh0aGlzT2JqLCBlLCBvZnNZKSB7XG5cdFx0dmFyIHBvaW50ZXJBYnMgPSBqc2MuZ2V0QWJzUG9pbnRlclBvcyhlKTtcblx0XHR2YXIgeSA9IG9mc1kgKyBwb2ludGVyQWJzLnkgLSBqc2MuX3BvaW50ZXJPcmlnaW4ueSAtIHRoaXNPYmoucGFkZGluZyAtIHRoaXNPYmouaW5zZXRXaWR0aDtcblxuXHRcdHZhciB5VmFsID0gMTAwIC0gKHkgKiAoMTAwIC8gKHRoaXNPYmouaGVpZ2h0IC0gMSkpKTtcblxuXHRcdHN3aXRjaCAoanNjLmdldFNsaWRlckNvbXBvbmVudCh0aGlzT2JqKSkge1xuXHRcdGNhc2UgJ3MnOiB0aGlzT2JqLmZyb21IU1YobnVsbCwgeVZhbCwgbnVsbCwganNjLmxlYXZlUGFkKTsgYnJlYWs7XG5cdFx0Y2FzZSAndic6IHRoaXNPYmouZnJvbUhTVihudWxsLCBudWxsLCB5VmFsLCBqc2MubGVhdmVQYWQpOyBicmVhaztcblx0XHR9XG5cdH0sXG5cblxuXHRfdm1sTlMgOiAnanNjX3ZtbF8nLFxuXHRfdm1sQ1NTIDogJ2pzY192bWxfY3NzXycsXG5cdF92bWxSZWFkeSA6IGZhbHNlLFxuXG5cblx0aW5pdFZNTCA6IGZ1bmN0aW9uICgpIHtcblx0XHRpZiAoIWpzYy5fdm1sUmVhZHkpIHtcblx0XHRcdC8vIGluaXQgVk1MIG5hbWVzcGFjZVxuXHRcdFx0dmFyIGRvYyA9IGRvY3VtZW50O1xuXHRcdFx0aWYgKCFkb2MubmFtZXNwYWNlc1tqc2MuX3ZtbE5TXSkge1xuXHRcdFx0XHRkb2MubmFtZXNwYWNlcy5hZGQoanNjLl92bWxOUywgJ3VybjpzY2hlbWFzLW1pY3Jvc29mdC1jb206dm1sJyk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIWRvYy5zdHlsZVNoZWV0c1tqc2MuX3ZtbENTU10pIHtcblx0XHRcdFx0dmFyIHRhZ3MgPSBbJ3NoYXBlJywgJ3NoYXBldHlwZScsICdncm91cCcsICdiYWNrZ3JvdW5kJywgJ3BhdGgnLCAnZm9ybXVsYXMnLCAnaGFuZGxlcycsICdmaWxsJywgJ3N0cm9rZScsICdzaGFkb3cnLCAndGV4dGJveCcsICd0ZXh0cGF0aCcsICdpbWFnZWRhdGEnLCAnbGluZScsICdwb2x5bGluZScsICdjdXJ2ZScsICdyZWN0JywgJ3JvdW5kcmVjdCcsICdvdmFsJywgJ2FyYycsICdpbWFnZSddO1xuXHRcdFx0XHR2YXIgc3MgPSBkb2MuY3JlYXRlU3R5bGVTaGVldCgpO1xuXHRcdFx0XHRzcy5vd25pbmdFbGVtZW50LmlkID0ganNjLl92bWxDU1M7XG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGFncy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRcdHNzLmFkZFJ1bGUoanNjLl92bWxOUyArICdcXFxcOicgKyB0YWdzW2ldLCAnYmVoYXZpb3I6dXJsKCNkZWZhdWx0I1ZNTCk7Jyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGpzYy5fdm1sUmVhZHkgPSB0cnVlO1xuXHRcdH1cblx0fSxcblxuXG5cdGNyZWF0ZVBhbGV0dGUgOiBmdW5jdGlvbiAoKSB7XG5cblx0XHR2YXIgcGFsZXR0ZU9iaiA9IHtcblx0XHRcdGVsbTogbnVsbCxcblx0XHRcdGRyYXc6IG51bGxcblx0XHR9O1xuXG5cdFx0aWYgKGpzYy5pc0NhbnZhc1N1cHBvcnRlZCkge1xuXHRcdFx0Ly8gQ2FudmFzIGltcGxlbWVudGF0aW9uIGZvciBtb2Rlcm4gYnJvd3NlcnNcblxuXHRcdFx0dmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRcdFx0dmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG5cdFx0XHR2YXIgZHJhd0Z1bmMgPSBmdW5jdGlvbiAod2lkdGgsIGhlaWdodCwgdHlwZSkge1xuXHRcdFx0XHRjYW52YXMud2lkdGggPSB3aWR0aDtcblx0XHRcdFx0Y2FudmFzLmhlaWdodCA9IGhlaWdodDtcblxuXHRcdFx0XHRjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cblx0XHRcdFx0dmFyIGhHcmFkID0gY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KDAsIDAsIGNhbnZhcy53aWR0aCwgMCk7XG5cdFx0XHRcdGhHcmFkLmFkZENvbG9yU3RvcCgwIC8gNiwgJyNGMDAnKTtcblx0XHRcdFx0aEdyYWQuYWRkQ29sb3JTdG9wKDEgLyA2LCAnI0ZGMCcpO1xuXHRcdFx0XHRoR3JhZC5hZGRDb2xvclN0b3AoMiAvIDYsICcjMEYwJyk7XG5cdFx0XHRcdGhHcmFkLmFkZENvbG9yU3RvcCgzIC8gNiwgJyMwRkYnKTtcblx0XHRcdFx0aEdyYWQuYWRkQ29sb3JTdG9wKDQgLyA2LCAnIzAwRicpO1xuXHRcdFx0XHRoR3JhZC5hZGRDb2xvclN0b3AoNSAvIDYsICcjRjBGJyk7XG5cdFx0XHRcdGhHcmFkLmFkZENvbG9yU3RvcCg2IC8gNiwgJyNGMDAnKTtcblxuXHRcdFx0XHRjdHguZmlsbFN0eWxlID0gaEdyYWQ7XG5cdFx0XHRcdGN0eC5maWxsUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXG5cdFx0XHRcdHZhciB2R3JhZCA9IGN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudCgwLCAwLCAwLCBjYW52YXMuaGVpZ2h0KTtcblx0XHRcdFx0c3dpdGNoICh0eXBlLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRcdFx0Y2FzZSAncyc6XG5cdFx0XHRcdFx0dkdyYWQuYWRkQ29sb3JTdG9wKDAsICdyZ2JhKDI1NSwyNTUsMjU1LDApJyk7XG5cdFx0XHRcdFx0dkdyYWQuYWRkQ29sb3JTdG9wKDEsICdyZ2JhKDI1NSwyNTUsMjU1LDEpJyk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3YnOlxuXHRcdFx0XHRcdHZHcmFkLmFkZENvbG9yU3RvcCgwLCAncmdiYSgwLDAsMCwwKScpO1xuXHRcdFx0XHRcdHZHcmFkLmFkZENvbG9yU3RvcCgxLCAncmdiYSgwLDAsMCwxKScpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSB2R3JhZDtcblx0XHRcdFx0Y3R4LmZpbGxSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cdFx0XHR9O1xuXG5cdFx0XHRwYWxldHRlT2JqLmVsbSA9IGNhbnZhcztcblx0XHRcdHBhbGV0dGVPYmouZHJhdyA9IGRyYXdGdW5jO1xuXG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIFZNTCBmYWxsYmFjayBmb3IgSUUgNyBhbmQgOFxuXG5cdFx0XHRqc2MuaW5pdFZNTCgpO1xuXG5cdFx0XHR2YXIgdm1sQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0XHR2bWxDb250YWluZXIuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuXHRcdFx0dm1sQ29udGFpbmVyLnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG5cblx0XHRcdHZhciBoR3JhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoanNjLl92bWxOUyArICc6ZmlsbCcpO1xuXHRcdFx0aEdyYWQudHlwZSA9ICdncmFkaWVudCc7XG5cdFx0XHRoR3JhZC5tZXRob2QgPSAnbGluZWFyJztcblx0XHRcdGhHcmFkLmFuZ2xlID0gJzkwJztcblx0XHRcdGhHcmFkLmNvbG9ycyA9ICcxNi42NyUgI0YwRiwgMzMuMzMlICMwMEYsIDUwJSAjMEZGLCA2Ni42NyUgIzBGMCwgODMuMzMlICNGRjAnXG5cblx0XHRcdHZhciBoUmVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoanNjLl92bWxOUyArICc6cmVjdCcpO1xuXHRcdFx0aFJlY3Quc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0aFJlY3Quc3R5bGUubGVmdCA9IC0xICsgJ3B4Jztcblx0XHRcdGhSZWN0LnN0eWxlLnRvcCA9IC0xICsgJ3B4Jztcblx0XHRcdGhSZWN0LnN0cm9rZWQgPSBmYWxzZTtcblx0XHRcdGhSZWN0LmFwcGVuZENoaWxkKGhHcmFkKTtcblx0XHRcdHZtbENvbnRhaW5lci5hcHBlbmRDaGlsZChoUmVjdCk7XG5cblx0XHRcdHZhciB2R3JhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoanNjLl92bWxOUyArICc6ZmlsbCcpO1xuXHRcdFx0dkdyYWQudHlwZSA9ICdncmFkaWVudCc7XG5cdFx0XHR2R3JhZC5tZXRob2QgPSAnbGluZWFyJztcblx0XHRcdHZHcmFkLmFuZ2xlID0gJzE4MCc7XG5cdFx0XHR2R3JhZC5vcGFjaXR5ID0gJzAnO1xuXG5cdFx0XHR2YXIgdlJlY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGpzYy5fdm1sTlMgKyAnOnJlY3QnKTtcblx0XHRcdHZSZWN0LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHZSZWN0LnN0eWxlLmxlZnQgPSAtMSArICdweCc7XG5cdFx0XHR2UmVjdC5zdHlsZS50b3AgPSAtMSArICdweCc7XG5cdFx0XHR2UmVjdC5zdHJva2VkID0gZmFsc2U7XG5cdFx0XHR2UmVjdC5hcHBlbmRDaGlsZCh2R3JhZCk7XG5cdFx0XHR2bWxDb250YWluZXIuYXBwZW5kQ2hpbGQodlJlY3QpO1xuXG5cdFx0XHR2YXIgZHJhd0Z1bmMgPSBmdW5jdGlvbiAod2lkdGgsIGhlaWdodCwgdHlwZSkge1xuXHRcdFx0XHR2bWxDb250YWluZXIuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG5cdFx0XHRcdHZtbENvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xuXG5cdFx0XHRcdGhSZWN0LnN0eWxlLndpZHRoID1cblx0XHRcdFx0dlJlY3Quc3R5bGUud2lkdGggPVxuXHRcdFx0XHRcdCh3aWR0aCArIDEpICsgJ3B4Jztcblx0XHRcdFx0aFJlY3Quc3R5bGUuaGVpZ2h0ID1cblx0XHRcdFx0dlJlY3Quc3R5bGUuaGVpZ2h0ID1cblx0XHRcdFx0XHQoaGVpZ2h0ICsgMSkgKyAncHgnO1xuXG5cdFx0XHRcdC8vIENvbG9ycyBtdXN0IGJlIHNwZWNpZmllZCBkdXJpbmcgZXZlcnkgcmVkcmF3LCBvdGhlcndpc2UgSUUgd29uJ3QgZGlzcGxheVxuXHRcdFx0XHQvLyBhIGZ1bGwgZ3JhZGllbnQgZHVyaW5nIGEgc3Vic2VxdWVudGlhbCByZWRyYXdcblx0XHRcdFx0aEdyYWQuY29sb3IgPSAnI0YwMCc7XG5cdFx0XHRcdGhHcmFkLmNvbG9yMiA9ICcjRjAwJztcblxuXHRcdFx0XHRzd2l0Y2ggKHR5cGUudG9Mb3dlckNhc2UoKSkge1xuXHRcdFx0XHRjYXNlICdzJzpcblx0XHRcdFx0XHR2R3JhZC5jb2xvciA9IHZHcmFkLmNvbG9yMiA9ICcjRkZGJztcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAndic6XG5cdFx0XHRcdFx0dkdyYWQuY29sb3IgPSB2R3JhZC5jb2xvcjIgPSAnIzAwMCc7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0XHRcblx0XHRcdHBhbGV0dGVPYmouZWxtID0gdm1sQ29udGFpbmVyO1xuXHRcdFx0cGFsZXR0ZU9iai5kcmF3ID0gZHJhd0Z1bmM7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHBhbGV0dGVPYmo7XG5cdH0sXG5cblxuXHRjcmVhdGVTbGlkZXJHcmFkaWVudCA6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHZhciBzbGlkZXJPYmogPSB7XG5cdFx0XHRlbG06IG51bGwsXG5cdFx0XHRkcmF3OiBudWxsXG5cdFx0fTtcblxuXHRcdGlmIChqc2MuaXNDYW52YXNTdXBwb3J0ZWQpIHtcblx0XHRcdC8vIENhbnZhcyBpbXBsZW1lbnRhdGlvbiBmb3IgbW9kZXJuIGJyb3dzZXJzXG5cblx0XHRcdHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblx0XHRcdHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuXHRcdFx0dmFyIGRyYXdGdW5jID0gZnVuY3Rpb24gKHdpZHRoLCBoZWlnaHQsIGNvbG9yMSwgY29sb3IyKSB7XG5cdFx0XHRcdGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuXHRcdFx0XHRjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG5cdFx0XHRcdGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblxuXHRcdFx0XHR2YXIgZ3JhZCA9IGN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudCgwLCAwLCAwLCBjYW52YXMuaGVpZ2h0KTtcblx0XHRcdFx0Z3JhZC5hZGRDb2xvclN0b3AoMCwgY29sb3IxKTtcblx0XHRcdFx0Z3JhZC5hZGRDb2xvclN0b3AoMSwgY29sb3IyKTtcblxuXHRcdFx0XHRjdHguZmlsbFN0eWxlID0gZ3JhZDtcblx0XHRcdFx0Y3R4LmZpbGxSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cdFx0XHR9O1xuXG5cdFx0XHRzbGlkZXJPYmouZWxtID0gY2FudmFzO1xuXHRcdFx0c2xpZGVyT2JqLmRyYXcgPSBkcmF3RnVuYztcblxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBWTUwgZmFsbGJhY2sgZm9yIElFIDcgYW5kIDhcblxuXHRcdFx0anNjLmluaXRWTUwoKTtcblxuXHRcdFx0dmFyIHZtbENvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdFx0dm1sQ29udGFpbmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcblx0XHRcdHZtbENvbnRhaW5lci5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuXG5cdFx0XHR2YXIgZ3JhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoanNjLl92bWxOUyArICc6ZmlsbCcpO1xuXHRcdFx0Z3JhZC50eXBlID0gJ2dyYWRpZW50Jztcblx0XHRcdGdyYWQubWV0aG9kID0gJ2xpbmVhcic7XG5cdFx0XHRncmFkLmFuZ2xlID0gJzE4MCc7XG5cblx0XHRcdHZhciByZWN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChqc2MuX3ZtbE5TICsgJzpyZWN0Jyk7XG5cdFx0XHRyZWN0LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHJlY3Quc3R5bGUubGVmdCA9IC0xICsgJ3B4Jztcblx0XHRcdHJlY3Quc3R5bGUudG9wID0gLTEgKyAncHgnO1xuXHRcdFx0cmVjdC5zdHJva2VkID0gZmFsc2U7XG5cdFx0XHRyZWN0LmFwcGVuZENoaWxkKGdyYWQpO1xuXHRcdFx0dm1sQ29udGFpbmVyLmFwcGVuZENoaWxkKHJlY3QpO1xuXG5cdFx0XHR2YXIgZHJhd0Z1bmMgPSBmdW5jdGlvbiAod2lkdGgsIGhlaWdodCwgY29sb3IxLCBjb2xvcjIpIHtcblx0XHRcdFx0dm1sQ29udGFpbmVyLnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xuXHRcdFx0XHR2bWxDb250YWluZXIuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgJ3B4JztcblxuXHRcdFx0XHRyZWN0LnN0eWxlLndpZHRoID0gKHdpZHRoICsgMSkgKyAncHgnO1xuXHRcdFx0XHRyZWN0LnN0eWxlLmhlaWdodCA9IChoZWlnaHQgKyAxKSArICdweCc7XG5cblx0XHRcdFx0Z3JhZC5jb2xvciA9IGNvbG9yMTtcblx0XHRcdFx0Z3JhZC5jb2xvcjIgPSBjb2xvcjI7XG5cdFx0XHR9O1xuXHRcdFx0XG5cdFx0XHRzbGlkZXJPYmouZWxtID0gdm1sQ29udGFpbmVyO1xuXHRcdFx0c2xpZGVyT2JqLmRyYXcgPSBkcmF3RnVuYztcblx0XHR9XG5cblx0XHRyZXR1cm4gc2xpZGVyT2JqO1xuXHR9LFxuXG5cblx0bGVhdmVWYWx1ZSA6IDE8PDAsXG5cdGxlYXZlU3R5bGUgOiAxPDwxLFxuXHRsZWF2ZVBhZCA6IDE8PDIsXG5cdGxlYXZlU2xkIDogMTw8MyxcblxuXG5cdEJveFNoYWRvdyA6IChmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIEJveFNoYWRvdyA9IGZ1bmN0aW9uIChoU2hhZG93LCB2U2hhZG93LCBibHVyLCBzcHJlYWQsIGNvbG9yLCBpbnNldCkge1xuXHRcdFx0dGhpcy5oU2hhZG93ID0gaFNoYWRvdztcblx0XHRcdHRoaXMudlNoYWRvdyA9IHZTaGFkb3c7XG5cdFx0XHR0aGlzLmJsdXIgPSBibHVyO1xuXHRcdFx0dGhpcy5zcHJlYWQgPSBzcHJlYWQ7XG5cdFx0XHR0aGlzLmNvbG9yID0gY29sb3I7XG5cdFx0XHR0aGlzLmluc2V0ID0gISFpbnNldDtcblx0XHR9O1xuXG5cdFx0Qm94U2hhZG93LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciB2YWxzID0gW1xuXHRcdFx0XHRNYXRoLnJvdW5kKHRoaXMuaFNoYWRvdykgKyAncHgnLFxuXHRcdFx0XHRNYXRoLnJvdW5kKHRoaXMudlNoYWRvdykgKyAncHgnLFxuXHRcdFx0XHRNYXRoLnJvdW5kKHRoaXMuYmx1cikgKyAncHgnLFxuXHRcdFx0XHRNYXRoLnJvdW5kKHRoaXMuc3ByZWFkKSArICdweCcsXG5cdFx0XHRcdHRoaXMuY29sb3Jcblx0XHRcdF07XG5cdFx0XHRpZiAodGhpcy5pbnNldCkge1xuXHRcdFx0XHR2YWxzLnB1c2goJ2luc2V0Jyk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdmFscy5qb2luKCcgJyk7XG5cdFx0fTtcblxuXHRcdHJldHVybiBCb3hTaGFkb3c7XG5cdH0pKCksXG5cblxuXHQvL1xuXHQvLyBVc2FnZTpcblx0Ly8gdmFyIG15Q29sb3IgPSBuZXcganNjb2xvcig8dGFyZ2V0RWxlbWVudD4gWywgPG9wdGlvbnM+XSlcblx0Ly9cblxuXHRqc2NvbG9yIDogZnVuY3Rpb24gKHRhcmdldEVsZW1lbnQsIG9wdGlvbnMpIHtcblxuXHRcdC8vIEdlbmVyYWwgb3B0aW9uc1xuXHRcdC8vXG5cdFx0dGhpcy52YWx1ZSA9IG51bGw7IC8vIGluaXRpYWwgSEVYIGNvbG9yLiBUbyBjaGFuZ2UgaXQgbGF0ZXIsIHVzZSBtZXRob2RzIGZyb21TdHJpbmcoKSwgZnJvbUhTVigpIGFuZCBmcm9tUkdCKClcblx0XHR0aGlzLnZhbHVlRWxlbWVudCA9IHRhcmdldEVsZW1lbnQ7IC8vIGVsZW1lbnQgdGhhdCB3aWxsIGJlIHVzZWQgdG8gZGlzcGxheSBhbmQgaW5wdXQgdGhlIGNvbG9yIGNvZGVcblx0XHR0aGlzLnN0eWxlRWxlbWVudCA9IHRhcmdldEVsZW1lbnQ7IC8vIGVsZW1lbnQgdGhhdCB3aWxsIHByZXZpZXcgdGhlIHBpY2tlZCBjb2xvciB1c2luZyBDU1MgYmFja2dyb3VuZENvbG9yXG5cdFx0dGhpcy5yZXF1aXJlZCA9IHRydWU7IC8vIHdoZXRoZXIgdGhlIGFzc29jaWF0ZWQgdGV4dCA8aW5wdXQ+IGNhbiBiZSBsZWZ0IGVtcHR5XG5cdFx0dGhpcy5yZWZpbmUgPSB0cnVlOyAvLyB3aGV0aGVyIHRvIHJlZmluZSB0aGUgZW50ZXJlZCBjb2xvciBjb2RlIChlLmcuIHVwcGVyY2FzZSBpdCBhbmQgcmVtb3ZlIHdoaXRlc3BhY2UpXG5cdFx0dGhpcy5oYXNoID0gZmFsc2U7IC8vIHdoZXRoZXIgdG8gcHJlZml4IHRoZSBIRVggY29sb3IgY29kZSB3aXRoICMgc3ltYm9sXG5cdFx0dGhpcy51cHBlcmNhc2UgPSB0cnVlOyAvLyB3aGV0aGVyIHRvIHVwcGVyY2FzZSB0aGUgY29sb3IgY29kZVxuXHRcdHRoaXMub25GaW5lQ2hhbmdlID0gbnVsbDsgLy8gY2FsbGVkIGluc3RhbnRseSBldmVyeSB0aW1lIHRoZSBjb2xvciBjaGFuZ2VzICh2YWx1ZSBjYW4gYmUgZWl0aGVyIGEgZnVuY3Rpb24gb3IgYSBzdHJpbmcgd2l0aCBqYXZhc2NyaXB0IGNvZGUpXG5cdFx0dGhpcy5hY3RpdmVDbGFzcyA9ICdqc2NvbG9yLWFjdGl2ZSc7IC8vIGNsYXNzIHRvIGJlIHNldCB0byB0aGUgdGFyZ2V0IGVsZW1lbnQgd2hlbiBhIHBpY2tlciB3aW5kb3cgaXMgb3BlbiBvbiBpdFxuXHRcdHRoaXMubWluUyA9IDA7IC8vIG1pbiBhbGxvd2VkIHNhdHVyYXRpb24gKDAgLSAxMDApXG5cdFx0dGhpcy5tYXhTID0gMTAwOyAvLyBtYXggYWxsb3dlZCBzYXR1cmF0aW9uICgwIC0gMTAwKVxuXHRcdHRoaXMubWluViA9IDA7IC8vIG1pbiBhbGxvd2VkIHZhbHVlIChicmlnaHRuZXNzKSAoMCAtIDEwMClcblx0XHR0aGlzLm1heFYgPSAxMDA7IC8vIG1heCBhbGxvd2VkIHZhbHVlIChicmlnaHRuZXNzKSAoMCAtIDEwMClcblxuXHRcdC8vIEFjY2Vzc2luZyB0aGUgcGlja2VkIGNvbG9yXG5cdFx0Ly9cblx0XHR0aGlzLmhzdiA9IFswLCAwLCAxMDBdOyAvLyByZWFkLW9ubHkgIFswLTM2MCwgMC0xMDAsIDAtMTAwXVxuXHRcdHRoaXMucmdiID0gWzI1NSwgMjU1LCAyNTVdOyAvLyByZWFkLW9ubHkgIFswLTI1NSwgMC0yNTUsIDAtMjU1XVxuXG5cdFx0Ly8gQ29sb3IgUGlja2VyIG9wdGlvbnNcblx0XHQvL1xuXHRcdHRoaXMud2lkdGggPSAxODE7IC8vIHdpZHRoIG9mIGNvbG9yIHBhbGV0dGUgKGluIHB4KVxuXHRcdHRoaXMuaGVpZ2h0ID0gMTAxOyAvLyBoZWlnaHQgb2YgY29sb3IgcGFsZXR0ZSAoaW4gcHgpXG5cdFx0dGhpcy5zaG93T25DbGljayA9IHRydWU7IC8vIHdoZXRoZXIgdG8gZGlzcGxheSB0aGUgY29sb3IgcGlja2VyIHdoZW4gdXNlciBjbGlja3Mgb24gaXRzIHRhcmdldCBlbGVtZW50XG5cdFx0dGhpcy5tb2RlID0gJ0hTVic7IC8vIEhTViB8IEhWUyB8IEhTIHwgSFYgLSBsYXlvdXQgb2YgdGhlIGNvbG9yIHBpY2tlciBjb250cm9sc1xuXHRcdHRoaXMucG9zaXRpb24gPSAnYm90dG9tJzsgLy8gbGVmdCB8IHJpZ2h0IHwgdG9wIHwgYm90dG9tIC0gcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIHRhcmdldCBlbGVtZW50XG5cdFx0dGhpcy5zbWFydFBvc2l0aW9uID0gdHJ1ZTsgLy8gYXV0b21hdGljYWxseSBjaGFuZ2UgcGlja2VyIHBvc2l0aW9uIHdoZW4gdGhlcmUgaXMgbm90IGVub3VnaCBzcGFjZSBmb3IgaXRcblx0XHR0aGlzLnNsaWRlclNpemUgPSAxNjsgLy8gcHhcblx0XHR0aGlzLmNyb3NzU2l6ZSA9IDg7IC8vIHB4XG5cdFx0dGhpcy5jbG9zYWJsZSA9IGZhbHNlOyAvLyB3aGV0aGVyIHRvIGRpc3BsYXkgdGhlIENsb3NlIGJ1dHRvblxuXHRcdHRoaXMuY2xvc2VUZXh0ID0gJ0Nsb3NlJztcblx0XHR0aGlzLmJ1dHRvbkNvbG9yID0gJyMwMDAwMDAnOyAvLyBDU1MgY29sb3Jcblx0XHR0aGlzLmJ1dHRvbkhlaWdodCA9IDE4OyAvLyBweFxuXHRcdHRoaXMucGFkZGluZyA9IDEyOyAvLyBweFxuXHRcdHRoaXMuYmFja2dyb3VuZENvbG9yID0gJyNGRkZGRkYnOyAvLyBDU1MgY29sb3Jcblx0XHR0aGlzLmJvcmRlcldpZHRoID0gMTsgLy8gcHhcblx0XHR0aGlzLmJvcmRlckNvbG9yID0gJyNCQkJCQkInOyAvLyBDU1MgY29sb3Jcblx0XHR0aGlzLmJvcmRlclJhZGl1cyA9IDg7IC8vIHB4XG5cdFx0dGhpcy5pbnNldFdpZHRoID0gMTsgLy8gcHhcblx0XHR0aGlzLmluc2V0Q29sb3IgPSAnI0JCQkJCQic7IC8vIENTUyBjb2xvclxuXHRcdHRoaXMuc2hhZG93ID0gdHJ1ZTsgLy8gd2hldGhlciB0byBkaXNwbGF5IHNoYWRvd1xuXHRcdHRoaXMuc2hhZG93Qmx1ciA9IDE1OyAvLyBweFxuXHRcdHRoaXMuc2hhZG93Q29sb3IgPSAncmdiYSgwLDAsMCwwLjIpJzsgLy8gQ1NTIGNvbG9yXG5cdFx0dGhpcy5wb2ludGVyQ29sb3IgPSAnIzRDNEM0Qyc7IC8vIHB4XG5cdFx0dGhpcy5wb2ludGVyQm9yZGVyQ29sb3IgPSAnI0ZGRkZGRic7IC8vIHB4XG4gICAgICAgIHRoaXMucG9pbnRlckJvcmRlcldpZHRoID0gMTsgLy8gcHhcbiAgICAgICAgdGhpcy5wb2ludGVyVGhpY2tuZXNzID0gMjsgLy8gcHhcblx0XHR0aGlzLnpJbmRleCA9IDEwMDA7XG5cdFx0dGhpcy5jb250YWluZXIgPSBudWxsOyAvLyB3aGVyZSB0byBhcHBlbmQgdGhlIGNvbG9yIHBpY2tlciAoQk9EWSBlbGVtZW50IGJ5IGRlZmF1bHQpXG5cblxuXHRcdGZvciAodmFyIG9wdCBpbiBvcHRpb25zKSB7XG5cdFx0XHRpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShvcHQpKSB7XG5cdFx0XHRcdHRoaXNbb3B0XSA9IG9wdGlvbnNbb3B0XTtcblx0XHRcdH1cblx0XHR9XG5cblxuXHRcdHRoaXMuaGlkZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChpc1BpY2tlck93bmVyKCkpIHtcblx0XHRcdFx0ZGV0YWNoUGlja2VyKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXG5cdFx0dGhpcy5zaG93ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0ZHJhd1BpY2tlcigpO1xuXHRcdH07XG5cblxuXHRcdHRoaXMucmVkcmF3ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKGlzUGlja2VyT3duZXIoKSkge1xuXHRcdFx0XHRkcmF3UGlja2VyKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXG5cdFx0dGhpcy5pbXBvcnRDb2xvciA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmICghdGhpcy52YWx1ZUVsZW1lbnQpIHtcblx0XHRcdFx0dGhpcy5leHBvcnRDb2xvcigpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYgKGpzYy5pc0VsZW1lbnRUeXBlKHRoaXMudmFsdWVFbGVtZW50LCAnaW5wdXQnKSkge1xuXHRcdFx0XHRcdGlmICghdGhpcy5yZWZpbmUpIHtcblx0XHRcdFx0XHRcdGlmICghdGhpcy5mcm9tU3RyaW5nKHRoaXMudmFsdWVFbGVtZW50LnZhbHVlLCBqc2MubGVhdmVWYWx1ZSkpIHtcblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuc3R5bGVFbGVtZW50KSB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gdGhpcy5zdHlsZUVsZW1lbnQuX2pzY09yaWdTdHlsZS5iYWNrZ3JvdW5kSW1hZ2U7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gdGhpcy5zdHlsZUVsZW1lbnQuX2pzY09yaWdTdHlsZS5iYWNrZ3JvdW5kQ29sb3I7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuY29sb3IgPSB0aGlzLnN0eWxlRWxlbWVudC5fanNjT3JpZ1N0eWxlLmNvbG9yO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdHRoaXMuZXhwb3J0Q29sb3IoanNjLmxlYXZlVmFsdWUgfCBqc2MubGVhdmVTdHlsZSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBlbHNlIGlmICghdGhpcy5yZXF1aXJlZCAmJiAvXlxccyokLy50ZXN0KHRoaXMudmFsdWVFbGVtZW50LnZhbHVlKSkge1xuXHRcdFx0XHRcdFx0dGhpcy52YWx1ZUVsZW1lbnQudmFsdWUgPSAnJztcblx0XHRcdFx0XHRcdGlmICh0aGlzLnN0eWxlRWxlbWVudCkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLnN0eWxlRWxlbWVudC5fanNjT3JpZ1N0eWxlLmJhY2tncm91bmRJbWFnZTtcblx0XHRcdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gdGhpcy5zdHlsZUVsZW1lbnQuX2pzY09yaWdTdHlsZS5iYWNrZ3JvdW5kQ29sb3I7XG5cdFx0XHRcdFx0XHRcdHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmNvbG9yID0gdGhpcy5zdHlsZUVsZW1lbnQuX2pzY09yaWdTdHlsZS5jb2xvcjtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHRoaXMuZXhwb3J0Q29sb3IoanNjLmxlYXZlVmFsdWUgfCBqc2MubGVhdmVTdHlsZSk7XG5cblx0XHRcdFx0XHR9IGVsc2UgaWYgKHRoaXMuZnJvbVN0cmluZyh0aGlzLnZhbHVlRWxlbWVudC52YWx1ZSkpIHtcblx0XHRcdFx0XHRcdC8vIG1hbmFnZWQgdG8gaW1wb3J0IGNvbG9yIHN1Y2Nlc3NmdWxseSBmcm9tIHRoZSB2YWx1ZSAtPiBPSywgZG9uJ3QgZG8gYW55dGhpbmdcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dGhpcy5leHBvcnRDb2xvcigpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBub3QgYW4gaW5wdXQgZWxlbWVudCAtPiBkb2Vzbid0IGhhdmUgYW55IHZhbHVlXG5cdFx0XHRcdFx0dGhpcy5leHBvcnRDb2xvcigpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblxuXG5cdFx0dGhpcy5leHBvcnRDb2xvciA9IGZ1bmN0aW9uIChmbGFncykge1xuXHRcdFx0aWYgKCEoZmxhZ3MgJiBqc2MubGVhdmVWYWx1ZSkgJiYgdGhpcy52YWx1ZUVsZW1lbnQpIHtcblx0XHRcdFx0dmFyIHZhbHVlID0gdGhpcy50b1N0cmluZygpO1xuXHRcdFx0XHRpZiAodGhpcy51cHBlcmNhc2UpIHsgdmFsdWUgPSB2YWx1ZS50b1VwcGVyQ2FzZSgpOyB9XG5cdFx0XHRcdGlmICh0aGlzLmhhc2gpIHsgdmFsdWUgPSAnIycgKyB2YWx1ZTsgfVxuXG5cdFx0XHRcdGlmIChqc2MuaXNFbGVtZW50VHlwZSh0aGlzLnZhbHVlRWxlbWVudCwgJ2lucHV0JykpIHtcblx0XHRcdFx0XHR0aGlzLnZhbHVlRWxlbWVudC52YWx1ZSA9IHZhbHVlO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMudmFsdWVFbGVtZW50LmlubmVySFRNTCA9IHZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZiAoIShmbGFncyAmIGpzYy5sZWF2ZVN0eWxlKSkge1xuXHRcdFx0XHRpZiAodGhpcy5zdHlsZUVsZW1lbnQpIHtcblx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSAnbm9uZSc7XG5cdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyMnICsgdGhpcy50b1N0cmluZygpO1xuXHRcdFx0XHRcdHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmNvbG9yID0gdGhpcy5pc0xpZ2h0KCkgPyAnIzAwMCcgOiAnI0ZGRic7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmICghKGZsYWdzICYganNjLmxlYXZlUGFkKSAmJiBpc1BpY2tlck93bmVyKCkpIHtcblx0XHRcdFx0cmVkcmF3UGFkKCk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIShmbGFncyAmIGpzYy5sZWF2ZVNsZCkgJiYgaXNQaWNrZXJPd25lcigpKSB7XG5cdFx0XHRcdHJlZHJhd1NsZCgpO1xuXHRcdFx0fVxuXHRcdH07XG5cblxuXHRcdC8vIGg6IDAtMzYwXG5cdFx0Ly8gczogMC0xMDBcblx0XHQvLyB2OiAwLTEwMFxuXHRcdC8vXG5cdFx0dGhpcy5mcm9tSFNWID0gZnVuY3Rpb24gKGgsIHMsIHYsIGZsYWdzKSB7IC8vIG51bGwgPSBkb24ndCBjaGFuZ2Vcblx0XHRcdGlmIChoICE9PSBudWxsKSB7XG5cdFx0XHRcdGlmIChpc05hTihoKSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdFx0aCA9IE1hdGgubWF4KDAsIE1hdGgubWluKDM2MCwgaCkpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHMgIT09IG51bGwpIHtcblx0XHRcdFx0aWYgKGlzTmFOKHMpKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0XHRzID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMTAwLCB0aGlzLm1heFMsIHMpLCB0aGlzLm1pblMpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHYgIT09IG51bGwpIHtcblx0XHRcdFx0aWYgKGlzTmFOKHYpKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0XHR2ID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMTAwLCB0aGlzLm1heFYsIHYpLCB0aGlzLm1pblYpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLnJnYiA9IEhTVl9SR0IoXG5cdFx0XHRcdGg9PT1udWxsID8gdGhpcy5oc3ZbMF0gOiAodGhpcy5oc3ZbMF09aCksXG5cdFx0XHRcdHM9PT1udWxsID8gdGhpcy5oc3ZbMV0gOiAodGhpcy5oc3ZbMV09cyksXG5cdFx0XHRcdHY9PT1udWxsID8gdGhpcy5oc3ZbMl0gOiAodGhpcy5oc3ZbMl09dilcblx0XHRcdCk7XG5cblx0XHRcdHRoaXMuZXhwb3J0Q29sb3IoZmxhZ3MpO1xuXHRcdH07XG5cblxuXHRcdC8vIHI6IDAtMjU1XG5cdFx0Ly8gZzogMC0yNTVcblx0XHQvLyBiOiAwLTI1NVxuXHRcdC8vXG5cdFx0dGhpcy5mcm9tUkdCID0gZnVuY3Rpb24gKHIsIGcsIGIsIGZsYWdzKSB7IC8vIG51bGwgPSBkb24ndCBjaGFuZ2Vcblx0XHRcdGlmIChyICE9PSBudWxsKSB7XG5cdFx0XHRcdGlmIChpc05hTihyKSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdFx0ciA9IE1hdGgubWF4KDAsIE1hdGgubWluKDI1NSwgcikpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGcgIT09IG51bGwpIHtcblx0XHRcdFx0aWYgKGlzTmFOKGcpKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0XHRnID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMjU1LCBnKSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoYiAhPT0gbnVsbCkge1xuXHRcdFx0XHRpZiAoaXNOYU4oYikpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRcdGIgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigyNTUsIGIpKTtcblx0XHRcdH1cblxuXHRcdFx0dmFyIGhzdiA9IFJHQl9IU1YoXG5cdFx0XHRcdHI9PT1udWxsID8gdGhpcy5yZ2JbMF0gOiByLFxuXHRcdFx0XHRnPT09bnVsbCA/IHRoaXMucmdiWzFdIDogZyxcblx0XHRcdFx0Yj09PW51bGwgPyB0aGlzLnJnYlsyXSA6IGJcblx0XHRcdCk7XG5cdFx0XHRpZiAoaHN2WzBdICE9PSBudWxsKSB7XG5cdFx0XHRcdHRoaXMuaHN2WzBdID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMzYwLCBoc3ZbMF0pKTtcblx0XHRcdH1cblx0XHRcdGlmIChoc3ZbMl0gIT09IDApIHtcblx0XHRcdFx0dGhpcy5oc3ZbMV0gPSBoc3ZbMV09PT1udWxsID8gbnVsbCA6IE1hdGgubWF4KDAsIHRoaXMubWluUywgTWF0aC5taW4oMTAwLCB0aGlzLm1heFMsIGhzdlsxXSkpO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5oc3ZbMl0gPSBoc3ZbMl09PT1udWxsID8gbnVsbCA6IE1hdGgubWF4KDAsIHRoaXMubWluViwgTWF0aC5taW4oMTAwLCB0aGlzLm1heFYsIGhzdlsyXSkpO1xuXG5cdFx0XHQvLyB1cGRhdGUgUkdCIGFjY29yZGluZyB0byBmaW5hbCBIU1YsIGFzIHNvbWUgdmFsdWVzIG1pZ2h0IGJlIHRyaW1tZWRcblx0XHRcdHZhciByZ2IgPSBIU1ZfUkdCKHRoaXMuaHN2WzBdLCB0aGlzLmhzdlsxXSwgdGhpcy5oc3ZbMl0pO1xuXHRcdFx0dGhpcy5yZ2JbMF0gPSByZ2JbMF07XG5cdFx0XHR0aGlzLnJnYlsxXSA9IHJnYlsxXTtcblx0XHRcdHRoaXMucmdiWzJdID0gcmdiWzJdO1xuXG5cdFx0XHR0aGlzLmV4cG9ydENvbG9yKGZsYWdzKTtcblx0XHR9O1xuXG5cblx0XHR0aGlzLmZyb21TdHJpbmcgPSBmdW5jdGlvbiAoc3RyLCBmbGFncykge1xuXHRcdFx0dmFyIG07XG5cdFx0XHRpZiAobSA9IHN0ci5tYXRjaCgvXlxcVyooWzAtOUEtRl17M30oWzAtOUEtRl17M30pPylcXFcqJC9pKSkge1xuXHRcdFx0XHQvLyBIRVggbm90YXRpb25cblx0XHRcdFx0Ly9cblxuXHRcdFx0XHRpZiAobVsxXS5sZW5ndGggPT09IDYpIHtcblx0XHRcdFx0XHQvLyA2LWNoYXIgbm90YXRpb25cblx0XHRcdFx0XHR0aGlzLmZyb21SR0IoXG5cdFx0XHRcdFx0XHRwYXJzZUludChtWzFdLnN1YnN0cigwLDIpLDE2KSxcblx0XHRcdFx0XHRcdHBhcnNlSW50KG1bMV0uc3Vic3RyKDIsMiksMTYpLFxuXHRcdFx0XHRcdFx0cGFyc2VJbnQobVsxXS5zdWJzdHIoNCwyKSwxNiksXG5cdFx0XHRcdFx0XHRmbGFnc1xuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gMy1jaGFyIG5vdGF0aW9uXG5cdFx0XHRcdFx0dGhpcy5mcm9tUkdCKFxuXHRcdFx0XHRcdFx0cGFyc2VJbnQobVsxXS5jaGFyQXQoMCkgKyBtWzFdLmNoYXJBdCgwKSwxNiksXG5cdFx0XHRcdFx0XHRwYXJzZUludChtWzFdLmNoYXJBdCgxKSArIG1bMV0uY2hhckF0KDEpLDE2KSxcblx0XHRcdFx0XHRcdHBhcnNlSW50KG1bMV0uY2hhckF0KDIpICsgbVsxXS5jaGFyQXQoMiksMTYpLFxuXHRcdFx0XHRcdFx0ZmxhZ3Ncblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXG5cdFx0XHR9IGVsc2UgaWYgKG0gPSBzdHIubWF0Y2goL15cXFcqcmdiYT9cXCgoW14pXSopXFwpXFxXKiQvaSkpIHtcblx0XHRcdFx0dmFyIHBhcmFtcyA9IG1bMV0uc3BsaXQoJywnKTtcblx0XHRcdFx0dmFyIHJlID0gL15cXHMqKFxcZCopKFxcLlxcZCspP1xccyokLztcblx0XHRcdFx0dmFyIG1SLCBtRywgbUI7XG5cdFx0XHRcdGlmIChcblx0XHRcdFx0XHRwYXJhbXMubGVuZ3RoID49IDMgJiZcblx0XHRcdFx0XHQobVIgPSBwYXJhbXNbMF0ubWF0Y2gocmUpKSAmJlxuXHRcdFx0XHRcdChtRyA9IHBhcmFtc1sxXS5tYXRjaChyZSkpICYmXG5cdFx0XHRcdFx0KG1CID0gcGFyYW1zWzJdLm1hdGNoKHJlKSlcblx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0dmFyIHIgPSBwYXJzZUZsb2F0KChtUlsxXSB8fCAnMCcpICsgKG1SWzJdIHx8ICcnKSk7XG5cdFx0XHRcdFx0dmFyIGcgPSBwYXJzZUZsb2F0KChtR1sxXSB8fCAnMCcpICsgKG1HWzJdIHx8ICcnKSk7XG5cdFx0XHRcdFx0dmFyIGIgPSBwYXJzZUZsb2F0KChtQlsxXSB8fCAnMCcpICsgKG1CWzJdIHx8ICcnKSk7XG5cdFx0XHRcdFx0dGhpcy5mcm9tUkdCKHIsIGcsIGIsIGZsYWdzKTtcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH07XG5cblxuXHRcdHRoaXMudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHQoMHgxMDAgfCBNYXRoLnJvdW5kKHRoaXMucmdiWzBdKSkudG9TdHJpbmcoMTYpLnN1YnN0cigxKSArXG5cdFx0XHRcdCgweDEwMCB8IE1hdGgucm91bmQodGhpcy5yZ2JbMV0pKS50b1N0cmluZygxNikuc3Vic3RyKDEpICtcblx0XHRcdFx0KDB4MTAwIHwgTWF0aC5yb3VuZCh0aGlzLnJnYlsyXSkpLnRvU3RyaW5nKDE2KS5zdWJzdHIoMSlcblx0XHRcdCk7XG5cdFx0fTtcblxuXG5cdFx0dGhpcy50b0hFWFN0cmluZyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiAnIycgKyB0aGlzLnRvU3RyaW5nKCkudG9VcHBlckNhc2UoKTtcblx0XHR9O1xuXG5cblx0XHR0aGlzLnRvUkdCU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuICgncmdiKCcgK1xuXHRcdFx0XHRNYXRoLnJvdW5kKHRoaXMucmdiWzBdKSArICcsJyArXG5cdFx0XHRcdE1hdGgucm91bmQodGhpcy5yZ2JbMV0pICsgJywnICtcblx0XHRcdFx0TWF0aC5yb3VuZCh0aGlzLnJnYlsyXSkgKyAnKSdcblx0XHRcdCk7XG5cdFx0fTtcblxuXG5cdFx0dGhpcy5pc0xpZ2h0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0MC4yMTMgKiB0aGlzLnJnYlswXSArXG5cdFx0XHRcdDAuNzE1ICogdGhpcy5yZ2JbMV0gK1xuXHRcdFx0XHQwLjA3MiAqIHRoaXMucmdiWzJdID5cblx0XHRcdFx0MjU1IC8gMlxuXHRcdFx0KTtcblx0XHR9O1xuXG5cblx0XHR0aGlzLl9wcm9jZXNzUGFyZW50RWxlbWVudHNJbkRPTSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmICh0aGlzLl9saW5rZWRFbGVtZW50c1Byb2Nlc3NlZCkgeyByZXR1cm47IH1cblx0XHRcdHRoaXMuX2xpbmtlZEVsZW1lbnRzUHJvY2Vzc2VkID0gdHJ1ZTtcblxuXHRcdFx0dmFyIGVsbSA9IHRoaXMudGFyZ2V0RWxlbWVudDtcblx0XHRcdGRvIHtcblx0XHRcdFx0Ly8gSWYgdGhlIHRhcmdldCBlbGVtZW50IG9yIG9uZSBvZiBpdHMgcGFyZW50IG5vZGVzIGhhcyBmaXhlZCBwb3NpdGlvbixcblx0XHRcdFx0Ly8gdGhlbiB1c2UgZml4ZWQgcG9zaXRpb25pbmcgaW5zdGVhZFxuXHRcdFx0XHQvL1xuXHRcdFx0XHQvLyBOb3RlOiBJbiBGaXJlZm94LCBnZXRDb21wdXRlZFN0eWxlIHJldHVybnMgbnVsbCBpbiBhIGhpZGRlbiBpZnJhbWUsXG5cdFx0XHRcdC8vIHRoYXQncyB3aHkgd2UgbmVlZCB0byBjaGVjayBpZiB0aGUgcmV0dXJuZWQgc3R5bGUgb2JqZWN0IGlzIG5vbi1lbXB0eVxuXHRcdFx0XHR2YXIgY3VyclN0eWxlID0ganNjLmdldFN0eWxlKGVsbSk7XG5cdFx0XHRcdGlmIChjdXJyU3R5bGUgJiYgY3VyclN0eWxlLnBvc2l0aW9uLnRvTG93ZXJDYXNlKCkgPT09ICdmaXhlZCcpIHtcblx0XHRcdFx0XHR0aGlzLmZpeGVkID0gdHJ1ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChlbG0gIT09IHRoaXMudGFyZ2V0RWxlbWVudCkge1xuXHRcdFx0XHRcdC8vIEVuc3VyZSB0byBhdHRhY2ggb25QYXJlbnRTY3JvbGwgb25seSBvbmNlIHRvIGVhY2ggcGFyZW50IGVsZW1lbnRcblx0XHRcdFx0XHQvLyAobXVsdGlwbGUgdGFyZ2V0RWxlbWVudHMgY2FuIHNoYXJlIHRoZSBzYW1lIHBhcmVudCBub2Rlcylcblx0XHRcdFx0XHQvL1xuXHRcdFx0XHRcdC8vIE5vdGU6IEl0J3Mgbm90IGp1c3Qgb2Zmc2V0UGFyZW50cyB0aGF0IGNhbiBiZSBzY3JvbGxhYmxlLFxuXHRcdFx0XHRcdC8vIHRoYXQncyB3aHkgd2UgbG9vcCB0aHJvdWdoIGFsbCBwYXJlbnQgbm9kZXNcblx0XHRcdFx0XHRpZiAoIWVsbS5fanNjRXZlbnRzQXR0YWNoZWQpIHtcblx0XHRcdFx0XHRcdGpzYy5hdHRhY2hFdmVudChlbG0sICdzY3JvbGwnLCBqc2Mub25QYXJlbnRTY3JvbGwpO1xuXHRcdFx0XHRcdFx0ZWxtLl9qc2NFdmVudHNBdHRhY2hlZCA9IHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9IHdoaWxlICgoZWxtID0gZWxtLnBhcmVudE5vZGUpICYmICFqc2MuaXNFbGVtZW50VHlwZShlbG0sICdib2R5JykpO1xuXHRcdH07XG5cblxuXHRcdC8vIHI6IDAtMjU1XG5cdFx0Ly8gZzogMC0yNTVcblx0XHQvLyBiOiAwLTI1NVxuXHRcdC8vXG5cdFx0Ly8gcmV0dXJuczogWyAwLTM2MCwgMC0xMDAsIDAtMTAwIF1cblx0XHQvL1xuXHRcdGZ1bmN0aW9uIFJHQl9IU1YgKHIsIGcsIGIpIHtcblx0XHRcdHIgLz0gMjU1O1xuXHRcdFx0ZyAvPSAyNTU7XG5cdFx0XHRiIC89IDI1NTtcblx0XHRcdHZhciBuID0gTWF0aC5taW4oTWF0aC5taW4ocixnKSxiKTtcblx0XHRcdHZhciB2ID0gTWF0aC5tYXgoTWF0aC5tYXgocixnKSxiKTtcblx0XHRcdHZhciBtID0gdiAtIG47XG5cdFx0XHRpZiAobSA9PT0gMCkgeyByZXR1cm4gWyBudWxsLCAwLCAxMDAgKiB2IF07IH1cblx0XHRcdHZhciBoID0gcj09PW4gPyAzKyhiLWcpL20gOiAoZz09PW4gPyA1KyhyLWIpL20gOiAxKyhnLXIpL20pO1xuXHRcdFx0cmV0dXJuIFtcblx0XHRcdFx0NjAgKiAoaD09PTY/MDpoKSxcblx0XHRcdFx0MTAwICogKG0vdiksXG5cdFx0XHRcdDEwMCAqIHZcblx0XHRcdF07XG5cdFx0fVxuXG5cblx0XHQvLyBoOiAwLTM2MFxuXHRcdC8vIHM6IDAtMTAwXG5cdFx0Ly8gdjogMC0xMDBcblx0XHQvL1xuXHRcdC8vIHJldHVybnM6IFsgMC0yNTUsIDAtMjU1LCAwLTI1NSBdXG5cdFx0Ly9cblx0XHRmdW5jdGlvbiBIU1ZfUkdCIChoLCBzLCB2KSB7XG5cdFx0XHR2YXIgdSA9IDI1NSAqICh2IC8gMTAwKTtcblxuXHRcdFx0aWYgKGggPT09IG51bGwpIHtcblx0XHRcdFx0cmV0dXJuIFsgdSwgdSwgdSBdO1xuXHRcdFx0fVxuXG5cdFx0XHRoIC89IDYwO1xuXHRcdFx0cyAvPSAxMDA7XG5cblx0XHRcdHZhciBpID0gTWF0aC5mbG9vcihoKTtcblx0XHRcdHZhciBmID0gaSUyID8gaC1pIDogMS0oaC1pKTtcblx0XHRcdHZhciBtID0gdSAqICgxIC0gcyk7XG5cdFx0XHR2YXIgbiA9IHUgKiAoMSAtIHMgKiBmKTtcblx0XHRcdHN3aXRjaCAoaSkge1xuXHRcdFx0XHRjYXNlIDY6XG5cdFx0XHRcdGNhc2UgMDogcmV0dXJuIFt1LG4sbV07XG5cdFx0XHRcdGNhc2UgMTogcmV0dXJuIFtuLHUsbV07XG5cdFx0XHRcdGNhc2UgMjogcmV0dXJuIFttLHUsbl07XG5cdFx0XHRcdGNhc2UgMzogcmV0dXJuIFttLG4sdV07XG5cdFx0XHRcdGNhc2UgNDogcmV0dXJuIFtuLG0sdV07XG5cdFx0XHRcdGNhc2UgNTogcmV0dXJuIFt1LG0sbl07XG5cdFx0XHR9XG5cdFx0fVxuXG5cblx0XHRmdW5jdGlvbiBkZXRhY2hQaWNrZXIgKCkge1xuXHRcdFx0anNjLnVuc2V0Q2xhc3MoVEhJUy50YXJnZXRFbGVtZW50LCBUSElTLmFjdGl2ZUNsYXNzKTtcblx0XHRcdGpzYy5waWNrZXIud3JhcC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGpzYy5waWNrZXIud3JhcCk7XG5cdFx0XHRkZWxldGUganNjLnBpY2tlci5vd25lcjtcblx0XHR9XG5cblxuXHRcdGZ1bmN0aW9uIGRyYXdQaWNrZXIgKCkge1xuXG5cdFx0XHQvLyBBdCB0aGlzIHBvaW50LCB3aGVuIGRyYXdpbmcgdGhlIHBpY2tlciwgd2Uga25vdyB3aGF0IHRoZSBwYXJlbnQgZWxlbWVudHMgYXJlXG5cdFx0XHQvLyBhbmQgd2UgY2FuIGRvIGFsbCByZWxhdGVkIERPTSBvcGVyYXRpb25zLCBzdWNoIGFzIHJlZ2lzdGVyaW5nIGV2ZW50cyBvbiB0aGVtXG5cdFx0XHQvLyBvciBjaGVja2luZyB0aGVpciBwb3NpdGlvbmluZ1xuXHRcdFx0VEhJUy5fcHJvY2Vzc1BhcmVudEVsZW1lbnRzSW5ET00oKTtcblxuXHRcdFx0aWYgKCFqc2MucGlja2VyKSB7XG5cdFx0XHRcdGpzYy5waWNrZXIgPSB7XG5cdFx0XHRcdFx0b3duZXI6IG51bGwsXG5cdFx0XHRcdFx0d3JhcCA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuXHRcdFx0XHRcdGJveCA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuXHRcdFx0XHRcdGJveFMgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gc2hhZG93IGFyZWFcblx0XHRcdFx0XHRib3hCIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIGJvcmRlclxuXHRcdFx0XHRcdHBhZCA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuXHRcdFx0XHRcdHBhZEIgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gYm9yZGVyXG5cdFx0XHRcdFx0cGFkTSA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBtb3VzZS90b3VjaCBhcmVhXG5cdFx0XHRcdFx0cGFkUGFsIDoganNjLmNyZWF0ZVBhbGV0dGUoKSxcblx0XHRcdFx0XHRjcm9zcyA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuXHRcdFx0XHRcdGNyb3NzQlkgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gYm9yZGVyIFlcblx0XHRcdFx0XHRjcm9zc0JYIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIGJvcmRlciBYXG5cdFx0XHRcdFx0Y3Jvc3NMWSA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBsaW5lIFlcblx0XHRcdFx0XHRjcm9zc0xYIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIGxpbmUgWFxuXHRcdFx0XHRcdHNsZCA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuXHRcdFx0XHRcdHNsZEIgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gYm9yZGVyXG5cdFx0XHRcdFx0c2xkTSA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBtb3VzZS90b3VjaCBhcmVhXG5cdFx0XHRcdFx0c2xkR3JhZCA6IGpzYy5jcmVhdGVTbGlkZXJHcmFkaWVudCgpLFxuXHRcdFx0XHRcdHNsZFB0clMgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gc2xpZGVyIHBvaW50ZXIgc3BhY2VyXG5cdFx0XHRcdFx0c2xkUHRySUIgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gc2xpZGVyIHBvaW50ZXIgaW5uZXIgYm9yZGVyXG5cdFx0XHRcdFx0c2xkUHRyTUIgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gc2xpZGVyIHBvaW50ZXIgbWlkZGxlIGJvcmRlclxuXHRcdFx0XHRcdHNsZFB0ck9CIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIHNsaWRlciBwb2ludGVyIG91dGVyIGJvcmRlclxuXHRcdFx0XHRcdGJ0biA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuXHRcdFx0XHRcdGJ0blQgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJykgLy8gdGV4dFxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGpzYy5waWNrZXIucGFkLmFwcGVuZENoaWxkKGpzYy5waWNrZXIucGFkUGFsLmVsbSk7XG5cdFx0XHRcdGpzYy5waWNrZXIucGFkQi5hcHBlbmRDaGlsZChqc2MucGlja2VyLnBhZCk7XG5cdFx0XHRcdGpzYy5waWNrZXIuY3Jvc3MuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5jcm9zc0JZKTtcblx0XHRcdFx0anNjLnBpY2tlci5jcm9zcy5hcHBlbmRDaGlsZChqc2MucGlja2VyLmNyb3NzQlgpO1xuXHRcdFx0XHRqc2MucGlja2VyLmNyb3NzLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuY3Jvc3NMWSk7XG5cdFx0XHRcdGpzYy5waWNrZXIuY3Jvc3MuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5jcm9zc0xYKTtcblx0XHRcdFx0anNjLnBpY2tlci5wYWRCLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuY3Jvc3MpO1xuXHRcdFx0XHRqc2MucGlja2VyLmJveC5hcHBlbmRDaGlsZChqc2MucGlja2VyLnBhZEIpO1xuXHRcdFx0XHRqc2MucGlja2VyLmJveC5hcHBlbmRDaGlsZChqc2MucGlja2VyLnBhZE0pO1xuXG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuc2xkR3JhZC5lbG0pO1xuXHRcdFx0XHRqc2MucGlja2VyLnNsZEIuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5zbGQpO1xuXHRcdFx0XHRqc2MucGlja2VyLnNsZEIuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5zbGRQdHJPQik7XG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkUHRyT0IuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5zbGRQdHJNQik7XG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkUHRyTUIuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5zbGRQdHJJQik7XG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkUHRySUIuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5zbGRQdHJTKTtcblx0XHRcdFx0anNjLnBpY2tlci5ib3guYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5zbGRCKTtcblx0XHRcdFx0anNjLnBpY2tlci5ib3guYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5zbGRNKTtcblxuXHRcdFx0XHRqc2MucGlja2VyLmJ0bi5hcHBlbmRDaGlsZChqc2MucGlja2VyLmJ0blQpO1xuXHRcdFx0XHRqc2MucGlja2VyLmJveC5hcHBlbmRDaGlsZChqc2MucGlja2VyLmJ0bik7XG5cblx0XHRcdFx0anNjLnBpY2tlci5ib3hCLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuYm94KTtcblx0XHRcdFx0anNjLnBpY2tlci53cmFwLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuYm94Uyk7XG5cdFx0XHRcdGpzYy5waWNrZXIud3JhcC5hcHBlbmRDaGlsZChqc2MucGlja2VyLmJveEIpO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgcCA9IGpzYy5waWNrZXI7XG5cblx0XHRcdHZhciBkaXNwbGF5U2xpZGVyID0gISFqc2MuZ2V0U2xpZGVyQ29tcG9uZW50KFRISVMpO1xuXHRcdFx0dmFyIGRpbXMgPSBqc2MuZ2V0UGlja2VyRGltcyhUSElTKTtcblx0XHRcdHZhciBjcm9zc091dGVyU2l6ZSA9ICgyICogVEhJUy5wb2ludGVyQm9yZGVyV2lkdGggKyBUSElTLnBvaW50ZXJUaGlja25lc3MgKyAyICogVEhJUy5jcm9zc1NpemUpO1xuXHRcdFx0dmFyIHBhZFRvU2xpZGVyUGFkZGluZyA9IGpzYy5nZXRQYWRUb1NsaWRlclBhZGRpbmcoVEhJUyk7XG5cdFx0XHR2YXIgYm9yZGVyUmFkaXVzID0gTWF0aC5taW4oXG5cdFx0XHRcdFRISVMuYm9yZGVyUmFkaXVzLFxuXHRcdFx0XHRNYXRoLnJvdW5kKFRISVMucGFkZGluZyAqIE1hdGguUEkpKTsgLy8gcHhcblx0XHRcdHZhciBwYWRDdXJzb3IgPSAnY3Jvc3NoYWlyJztcblxuXHRcdFx0Ly8gd3JhcFxuXHRcdFx0cC53cmFwLnN0eWxlLmNsZWFyID0gJ2JvdGgnO1xuXHRcdFx0cC53cmFwLnN0eWxlLndpZHRoID0gKGRpbXNbMF0gKyAyICogVEhJUy5ib3JkZXJXaWR0aCkgKyAncHgnO1xuXHRcdFx0cC53cmFwLnN0eWxlLmhlaWdodCA9IChkaW1zWzFdICsgMiAqIFRISVMuYm9yZGVyV2lkdGgpICsgJ3B4Jztcblx0XHRcdHAud3JhcC5zdHlsZS56SW5kZXggPSBUSElTLnpJbmRleDtcblxuXHRcdFx0Ly8gcGlja2VyXG5cdFx0XHRwLmJveC5zdHlsZS53aWR0aCA9IGRpbXNbMF0gKyAncHgnO1xuXHRcdFx0cC5ib3guc3R5bGUuaGVpZ2h0ID0gZGltc1sxXSArICdweCc7XG5cblx0XHRcdHAuYm94Uy5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLmJveFMuc3R5bGUubGVmdCA9ICcwJztcblx0XHRcdHAuYm94Uy5zdHlsZS50b3AgPSAnMCc7XG5cdFx0XHRwLmJveFMuc3R5bGUud2lkdGggPSAnMTAwJSc7XG5cdFx0XHRwLmJveFMuc3R5bGUuaGVpZ2h0ID0gJzEwMCUnO1xuXHRcdFx0anNjLnNldEJvcmRlclJhZGl1cyhwLmJveFMsIGJvcmRlclJhZGl1cyArICdweCcpO1xuXG5cdFx0XHQvLyBwaWNrZXIgYm9yZGVyXG5cdFx0XHRwLmJveEIuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuXHRcdFx0cC5ib3hCLnN0eWxlLmJvcmRlciA9IFRISVMuYm9yZGVyV2lkdGggKyAncHggc29saWQnO1xuXHRcdFx0cC5ib3hCLnN0eWxlLmJvcmRlckNvbG9yID0gVEhJUy5ib3JkZXJDb2xvcjtcblx0XHRcdHAuYm94Qi5zdHlsZS5iYWNrZ3JvdW5kID0gVEhJUy5iYWNrZ3JvdW5kQ29sb3I7XG5cdFx0XHRqc2Muc2V0Qm9yZGVyUmFkaXVzKHAuYm94QiwgYm9yZGVyUmFkaXVzICsgJ3B4Jyk7XG5cblx0XHRcdC8vIElFIGhhY2s6XG5cdFx0XHQvLyBJZiB0aGUgZWxlbWVudCBpcyB0cmFuc3BhcmVudCwgSUUgd2lsbCB0cmlnZ2VyIHRoZSBldmVudCBvbiB0aGUgZWxlbWVudHMgdW5kZXIgaXQsXG5cdFx0XHQvLyBlLmcuIG9uIENhbnZhcyBvciBvbiBlbGVtZW50cyB3aXRoIGJvcmRlclxuXHRcdFx0cC5wYWRNLnN0eWxlLmJhY2tncm91bmQgPVxuXHRcdFx0cC5zbGRNLnN0eWxlLmJhY2tncm91bmQgPVxuXHRcdFx0XHQnI0ZGRic7XG5cdFx0XHRqc2Muc2V0U3R5bGUocC5wYWRNLCAnb3BhY2l0eScsICcwJyk7XG5cdFx0XHRqc2Muc2V0U3R5bGUocC5zbGRNLCAnb3BhY2l0eScsICcwJyk7XG5cblx0XHRcdC8vIHBhZFxuXHRcdFx0cC5wYWQuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuXHRcdFx0cC5wYWQuc3R5bGUud2lkdGggPSBUSElTLndpZHRoICsgJ3B4Jztcblx0XHRcdHAucGFkLnN0eWxlLmhlaWdodCA9IFRISVMuaGVpZ2h0ICsgJ3B4JztcblxuXHRcdFx0Ly8gcGFkIHBhbGV0dGVzIChIU1YgYW5kIEhWUylcblx0XHRcdHAucGFkUGFsLmRyYXcoVEhJUy53aWR0aCwgVEhJUy5oZWlnaHQsIGpzYy5nZXRQYWRZQ29tcG9uZW50KFRISVMpKTtcblxuXHRcdFx0Ly8gcGFkIGJvcmRlclxuXHRcdFx0cC5wYWRCLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHAucGFkQi5zdHlsZS5sZWZ0ID0gVEhJUy5wYWRkaW5nICsgJ3B4Jztcblx0XHRcdHAucGFkQi5zdHlsZS50b3AgPSBUSElTLnBhZGRpbmcgKyAncHgnO1xuXHRcdFx0cC5wYWRCLnN0eWxlLmJvcmRlciA9IFRISVMuaW5zZXRXaWR0aCArICdweCBzb2xpZCc7XG5cdFx0XHRwLnBhZEIuc3R5bGUuYm9yZGVyQ29sb3IgPSBUSElTLmluc2V0Q29sb3I7XG5cblx0XHRcdC8vIHBhZCBtb3VzZSBhcmVhXG5cdFx0XHRwLnBhZE0uX2pzY0luc3RhbmNlID0gVEhJUztcblx0XHRcdHAucGFkTS5fanNjQ29udHJvbE5hbWUgPSAncGFkJztcblx0XHRcdHAucGFkTS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLnBhZE0uc3R5bGUubGVmdCA9ICcwJztcblx0XHRcdHAucGFkTS5zdHlsZS50b3AgPSAnMCc7XG5cdFx0XHRwLnBhZE0uc3R5bGUud2lkdGggPSAoVEhJUy5wYWRkaW5nICsgMiAqIFRISVMuaW5zZXRXaWR0aCArIFRISVMud2lkdGggKyBwYWRUb1NsaWRlclBhZGRpbmcgLyAyKSArICdweCc7XG5cdFx0XHRwLnBhZE0uc3R5bGUuaGVpZ2h0ID0gZGltc1sxXSArICdweCc7XG5cdFx0XHRwLnBhZE0uc3R5bGUuY3Vyc29yID0gcGFkQ3Vyc29yO1xuXG5cdFx0XHQvLyBwYWQgY3Jvc3Ncblx0XHRcdHAuY3Jvc3Muc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cC5jcm9zcy5zdHlsZS5sZWZ0ID1cblx0XHRcdHAuY3Jvc3Muc3R5bGUudG9wID1cblx0XHRcdFx0JzAnO1xuXHRcdFx0cC5jcm9zcy5zdHlsZS53aWR0aCA9XG5cdFx0XHRwLmNyb3NzLnN0eWxlLmhlaWdodCA9XG5cdFx0XHRcdGNyb3NzT3V0ZXJTaXplICsgJ3B4JztcblxuXHRcdFx0Ly8gcGFkIGNyb3NzIGJvcmRlciBZIGFuZCBYXG5cdFx0XHRwLmNyb3NzQlkuc3R5bGUucG9zaXRpb24gPVxuXHRcdFx0cC5jcm9zc0JYLnN0eWxlLnBvc2l0aW9uID1cblx0XHRcdFx0J2Fic29sdXRlJztcblx0XHRcdHAuY3Jvc3NCWS5zdHlsZS5iYWNrZ3JvdW5kID1cblx0XHRcdHAuY3Jvc3NCWC5zdHlsZS5iYWNrZ3JvdW5kID1cblx0XHRcdFx0VEhJUy5wb2ludGVyQm9yZGVyQ29sb3I7XG5cdFx0XHRwLmNyb3NzQlkuc3R5bGUud2lkdGggPVxuXHRcdFx0cC5jcm9zc0JYLnN0eWxlLmhlaWdodCA9XG5cdFx0XHRcdCgyICogVEhJUy5wb2ludGVyQm9yZGVyV2lkdGggKyBUSElTLnBvaW50ZXJUaGlja25lc3MpICsgJ3B4Jztcblx0XHRcdHAuY3Jvc3NCWS5zdHlsZS5oZWlnaHQgPVxuXHRcdFx0cC5jcm9zc0JYLnN0eWxlLndpZHRoID1cblx0XHRcdFx0Y3Jvc3NPdXRlclNpemUgKyAncHgnO1xuXHRcdFx0cC5jcm9zc0JZLnN0eWxlLmxlZnQgPVxuXHRcdFx0cC5jcm9zc0JYLnN0eWxlLnRvcCA9XG5cdFx0XHRcdChNYXRoLmZsb29yKGNyb3NzT3V0ZXJTaXplIC8gMikgLSBNYXRoLmZsb29yKFRISVMucG9pbnRlclRoaWNrbmVzcyAvIDIpIC0gVEhJUy5wb2ludGVyQm9yZGVyV2lkdGgpICsgJ3B4Jztcblx0XHRcdHAuY3Jvc3NCWS5zdHlsZS50b3AgPVxuXHRcdFx0cC5jcm9zc0JYLnN0eWxlLmxlZnQgPVxuXHRcdFx0XHQnMCc7XG5cblx0XHRcdC8vIHBhZCBjcm9zcyBsaW5lIFkgYW5kIFhcblx0XHRcdHAuY3Jvc3NMWS5zdHlsZS5wb3NpdGlvbiA9XG5cdFx0XHRwLmNyb3NzTFguc3R5bGUucG9zaXRpb24gPVxuXHRcdFx0XHQnYWJzb2x1dGUnO1xuXHRcdFx0cC5jcm9zc0xZLnN0eWxlLmJhY2tncm91bmQgPVxuXHRcdFx0cC5jcm9zc0xYLnN0eWxlLmJhY2tncm91bmQgPVxuXHRcdFx0XHRUSElTLnBvaW50ZXJDb2xvcjtcblx0XHRcdHAuY3Jvc3NMWS5zdHlsZS5oZWlnaHQgPVxuXHRcdFx0cC5jcm9zc0xYLnN0eWxlLndpZHRoID1cblx0XHRcdFx0KGNyb3NzT3V0ZXJTaXplIC0gMiAqIFRISVMucG9pbnRlckJvcmRlcldpZHRoKSArICdweCc7XG5cdFx0XHRwLmNyb3NzTFkuc3R5bGUud2lkdGggPVxuXHRcdFx0cC5jcm9zc0xYLnN0eWxlLmhlaWdodCA9XG5cdFx0XHRcdFRISVMucG9pbnRlclRoaWNrbmVzcyArICdweCc7XG5cdFx0XHRwLmNyb3NzTFkuc3R5bGUubGVmdCA9XG5cdFx0XHRwLmNyb3NzTFguc3R5bGUudG9wID1cblx0XHRcdFx0KE1hdGguZmxvb3IoY3Jvc3NPdXRlclNpemUgLyAyKSAtIE1hdGguZmxvb3IoVEhJUy5wb2ludGVyVGhpY2tuZXNzIC8gMikpICsgJ3B4Jztcblx0XHRcdHAuY3Jvc3NMWS5zdHlsZS50b3AgPVxuXHRcdFx0cC5jcm9zc0xYLnN0eWxlLmxlZnQgPVxuXHRcdFx0XHRUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCArICdweCc7XG5cblx0XHRcdC8vIHNsaWRlclxuXHRcdFx0cC5zbGQuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcblx0XHRcdHAuc2xkLnN0eWxlLndpZHRoID0gVEhJUy5zbGlkZXJTaXplICsgJ3B4Jztcblx0XHRcdHAuc2xkLnN0eWxlLmhlaWdodCA9IFRISVMuaGVpZ2h0ICsgJ3B4JztcblxuXHRcdFx0Ly8gc2xpZGVyIGdyYWRpZW50XG5cdFx0XHRwLnNsZEdyYWQuZHJhdyhUSElTLnNsaWRlclNpemUsIFRISVMuaGVpZ2h0LCAnIzAwMCcsICcjMDAwJyk7XG5cblx0XHRcdC8vIHNsaWRlciBib3JkZXJcblx0XHRcdHAuc2xkQi5zdHlsZS5kaXNwbGF5ID0gZGlzcGxheVNsaWRlciA/ICdibG9jaycgOiAnbm9uZSc7XG5cdFx0XHRwLnNsZEIuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cC5zbGRCLnN0eWxlLnJpZ2h0ID0gVEhJUy5wYWRkaW5nICsgJ3B4Jztcblx0XHRcdHAuc2xkQi5zdHlsZS50b3AgPSBUSElTLnBhZGRpbmcgKyAncHgnO1xuXHRcdFx0cC5zbGRCLnN0eWxlLmJvcmRlciA9IFRISVMuaW5zZXRXaWR0aCArICdweCBzb2xpZCc7XG5cdFx0XHRwLnNsZEIuc3R5bGUuYm9yZGVyQ29sb3IgPSBUSElTLmluc2V0Q29sb3I7XG5cblx0XHRcdC8vIHNsaWRlciBtb3VzZSBhcmVhXG5cdFx0XHRwLnNsZE0uX2pzY0luc3RhbmNlID0gVEhJUztcblx0XHRcdHAuc2xkTS5fanNjQ29udHJvbE5hbWUgPSAnc2xkJztcblx0XHRcdHAuc2xkTS5zdHlsZS5kaXNwbGF5ID0gZGlzcGxheVNsaWRlciA/ICdibG9jaycgOiAnbm9uZSc7XG5cdFx0XHRwLnNsZE0uc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cC5zbGRNLnN0eWxlLnJpZ2h0ID0gJzAnO1xuXHRcdFx0cC5zbGRNLnN0eWxlLnRvcCA9ICcwJztcblx0XHRcdHAuc2xkTS5zdHlsZS53aWR0aCA9IChUSElTLnNsaWRlclNpemUgKyBwYWRUb1NsaWRlclBhZGRpbmcgLyAyICsgVEhJUy5wYWRkaW5nICsgMiAqIFRISVMuaW5zZXRXaWR0aCkgKyAncHgnO1xuXHRcdFx0cC5zbGRNLnN0eWxlLmhlaWdodCA9IGRpbXNbMV0gKyAncHgnO1xuXHRcdFx0cC5zbGRNLnN0eWxlLmN1cnNvciA9ICdkZWZhdWx0JztcblxuXHRcdFx0Ly8gc2xpZGVyIHBvaW50ZXIgaW5uZXIgYW5kIG91dGVyIGJvcmRlclxuXHRcdFx0cC5zbGRQdHJJQi5zdHlsZS5ib3JkZXIgPVxuXHRcdFx0cC5zbGRQdHJPQi5zdHlsZS5ib3JkZXIgPVxuXHRcdFx0XHRUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCArICdweCBzb2xpZCAnICsgVEhJUy5wb2ludGVyQm9yZGVyQ29sb3I7XG5cblx0XHRcdC8vIHNsaWRlciBwb2ludGVyIG91dGVyIGJvcmRlclxuXHRcdFx0cC5zbGRQdHJPQi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLnNsZFB0ck9CLnN0eWxlLmxlZnQgPSAtKDIgKiBUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCArIFRISVMucG9pbnRlclRoaWNrbmVzcykgKyAncHgnO1xuXHRcdFx0cC5zbGRQdHJPQi5zdHlsZS50b3AgPSAnMCc7XG5cblx0XHRcdC8vIHNsaWRlciBwb2ludGVyIG1pZGRsZSBib3JkZXJcblx0XHRcdHAuc2xkUHRyTUIuc3R5bGUuYm9yZGVyID0gVEhJUy5wb2ludGVyVGhpY2tuZXNzICsgJ3B4IHNvbGlkICcgKyBUSElTLnBvaW50ZXJDb2xvcjtcblxuXHRcdFx0Ly8gc2xpZGVyIHBvaW50ZXIgc3BhY2VyXG5cdFx0XHRwLnNsZFB0clMuc3R5bGUud2lkdGggPSBUSElTLnNsaWRlclNpemUgKyAncHgnO1xuXHRcdFx0cC5zbGRQdHJTLnN0eWxlLmhlaWdodCA9IHNsaWRlclB0clNwYWNlICsgJ3B4JztcblxuXHRcdFx0Ly8gdGhlIENsb3NlIGJ1dHRvblxuXHRcdFx0ZnVuY3Rpb24gc2V0QnRuQm9yZGVyICgpIHtcblx0XHRcdFx0dmFyIGluc2V0Q29sb3JzID0gVEhJUy5pbnNldENvbG9yLnNwbGl0KC9cXHMrLyk7XG5cdFx0XHRcdHZhciBvdXRzZXRDb2xvciA9IGluc2V0Q29sb3JzLmxlbmd0aCA8IDIgPyBpbnNldENvbG9yc1swXSA6IGluc2V0Q29sb3JzWzFdICsgJyAnICsgaW5zZXRDb2xvcnNbMF0gKyAnICcgKyBpbnNldENvbG9yc1swXSArICcgJyArIGluc2V0Q29sb3JzWzFdO1xuXHRcdFx0XHRwLmJ0bi5zdHlsZS5ib3JkZXJDb2xvciA9IG91dHNldENvbG9yO1xuXHRcdFx0fVxuXHRcdFx0cC5idG4uc3R5bGUuZGlzcGxheSA9IFRISVMuY2xvc2FibGUgPyAnYmxvY2snIDogJ25vbmUnO1xuXHRcdFx0cC5idG4uc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cC5idG4uc3R5bGUubGVmdCA9IFRISVMucGFkZGluZyArICdweCc7XG5cdFx0XHRwLmJ0bi5zdHlsZS5ib3R0b20gPSBUSElTLnBhZGRpbmcgKyAncHgnO1xuXHRcdFx0cC5idG4uc3R5bGUucGFkZGluZyA9ICcwIDE1cHgnO1xuXHRcdFx0cC5idG4uc3R5bGUuaGVpZ2h0ID0gVEhJUy5idXR0b25IZWlnaHQgKyAncHgnO1xuXHRcdFx0cC5idG4uc3R5bGUuYm9yZGVyID0gVEhJUy5pbnNldFdpZHRoICsgJ3B4IHNvbGlkJztcblx0XHRcdHNldEJ0bkJvcmRlcigpO1xuXHRcdFx0cC5idG4uc3R5bGUuY29sb3IgPSBUSElTLmJ1dHRvbkNvbG9yO1xuXHRcdFx0cC5idG4uc3R5bGUuZm9udCA9ICcxMnB4IHNhbnMtc2VyaWYnO1xuXHRcdFx0cC5idG4uc3R5bGUudGV4dEFsaWduID0gJ2NlbnRlcic7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRwLmJ0bi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG5cdFx0XHR9IGNhdGNoKGVPbGRJRSkge1xuXHRcdFx0XHRwLmJ0bi5zdHlsZS5jdXJzb3IgPSAnaGFuZCc7XG5cdFx0XHR9XG5cdFx0XHRwLmJ0bi5vbm1vdXNlZG93biA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0VEhJUy5oaWRlKCk7XG5cdFx0XHR9O1xuXHRcdFx0cC5idG5ULnN0eWxlLmxpbmVIZWlnaHQgPSBUSElTLmJ1dHRvbkhlaWdodCArICdweCc7XG5cdFx0XHRwLmJ0blQuaW5uZXJIVE1MID0gJyc7XG5cdFx0XHRwLmJ0blQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoVEhJUy5jbG9zZVRleHQpKTtcblxuXHRcdFx0Ly8gcGxhY2UgcG9pbnRlcnNcblx0XHRcdHJlZHJhd1BhZCgpO1xuXHRcdFx0cmVkcmF3U2xkKCk7XG5cblx0XHRcdC8vIElmIHdlIGFyZSBjaGFuZ2luZyB0aGUgb3duZXIgd2l0aG91dCBmaXJzdCBjbG9zaW5nIHRoZSBwaWNrZXIsXG5cdFx0XHQvLyBtYWtlIHN1cmUgdG8gZmlyc3QgZGVhbCB3aXRoIHRoZSBvbGQgb3duZXJcblx0XHRcdGlmIChqc2MucGlja2VyLm93bmVyICYmIGpzYy5waWNrZXIub3duZXIgIT09IFRISVMpIHtcblx0XHRcdFx0anNjLnVuc2V0Q2xhc3MoanNjLnBpY2tlci5vd25lci50YXJnZXRFbGVtZW50LCBUSElTLmFjdGl2ZUNsYXNzKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gU2V0IHRoZSBuZXcgcGlja2VyIG93bmVyXG5cdFx0XHRqc2MucGlja2VyLm93bmVyID0gVEhJUztcblxuXHRcdFx0Ly8gVGhlIHJlZHJhd1Bvc2l0aW9uKCkgbWV0aG9kIG5lZWRzIHBpY2tlci5vd25lciB0byBiZSBzZXQsIHRoYXQncyB3aHkgd2UgY2FsbCBpdCBoZXJlLFxuXHRcdFx0Ly8gYWZ0ZXIgc2V0dGluZyB0aGUgb3duZXJcblx0XHRcdGlmIChqc2MuaXNFbGVtZW50VHlwZShjb250YWluZXIsICdib2R5JykpIHtcblx0XHRcdFx0anNjLnJlZHJhd1Bvc2l0aW9uKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRqc2MuX2RyYXdQb3NpdGlvbihUSElTLCAwLCAwLCAncmVsYXRpdmUnLCBmYWxzZSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChwLndyYXAucGFyZW50Tm9kZSAhPSBjb250YWluZXIpIHtcblx0XHRcdFx0Y29udGFpbmVyLmFwcGVuZENoaWxkKHAud3JhcCk7XG5cdFx0XHR9XG5cblx0XHRcdGpzYy5zZXRDbGFzcyhUSElTLnRhcmdldEVsZW1lbnQsIFRISVMuYWN0aXZlQ2xhc3MpO1xuXHRcdH1cblxuXG5cdFx0ZnVuY3Rpb24gcmVkcmF3UGFkICgpIHtcblx0XHRcdC8vIHJlZHJhdyB0aGUgcGFkIHBvaW50ZXJcblx0XHRcdHN3aXRjaCAoanNjLmdldFBhZFlDb21wb25lbnQoVEhJUykpIHtcblx0XHRcdGNhc2UgJ3MnOiB2YXIgeUNvbXBvbmVudCA9IDE7IGJyZWFrO1xuXHRcdFx0Y2FzZSAndic6IHZhciB5Q29tcG9uZW50ID0gMjsgYnJlYWs7XG5cdFx0XHR9XG5cdFx0XHR2YXIgeCA9IE1hdGgucm91bmQoKFRISVMuaHN2WzBdIC8gMzYwKSAqIChUSElTLndpZHRoIC0gMSkpO1xuXHRcdFx0dmFyIHkgPSBNYXRoLnJvdW5kKCgxIC0gVEhJUy5oc3ZbeUNvbXBvbmVudF0gLyAxMDApICogKFRISVMuaGVpZ2h0IC0gMSkpO1xuXHRcdFx0dmFyIGNyb3NzT3V0ZXJTaXplID0gKDIgKiBUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCArIFRISVMucG9pbnRlclRoaWNrbmVzcyArIDIgKiBUSElTLmNyb3NzU2l6ZSk7XG5cdFx0XHR2YXIgb2ZzID0gLU1hdGguZmxvb3IoY3Jvc3NPdXRlclNpemUgLyAyKTtcblx0XHRcdGpzYy5waWNrZXIuY3Jvc3Muc3R5bGUubGVmdCA9ICh4ICsgb2ZzKSArICdweCc7XG5cdFx0XHRqc2MucGlja2VyLmNyb3NzLnN0eWxlLnRvcCA9ICh5ICsgb2ZzKSArICdweCc7XG5cblx0XHRcdC8vIHJlZHJhdyB0aGUgc2xpZGVyXG5cdFx0XHRzd2l0Y2ggKGpzYy5nZXRTbGlkZXJDb21wb25lbnQoVEhJUykpIHtcblx0XHRcdGNhc2UgJ3MnOlxuXHRcdFx0XHR2YXIgcmdiMSA9IEhTVl9SR0IoVEhJUy5oc3ZbMF0sIDEwMCwgVEhJUy5oc3ZbMl0pO1xuXHRcdFx0XHR2YXIgcmdiMiA9IEhTVl9SR0IoVEhJUy5oc3ZbMF0sIDAsIFRISVMuaHN2WzJdKTtcblx0XHRcdFx0dmFyIGNvbG9yMSA9ICdyZ2IoJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2IxWzBdKSArICcsJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2IxWzFdKSArICcsJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2IxWzJdKSArICcpJztcblx0XHRcdFx0dmFyIGNvbG9yMiA9ICdyZ2IoJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2IyWzBdKSArICcsJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2IyWzFdKSArICcsJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2IyWzJdKSArICcpJztcblx0XHRcdFx0anNjLnBpY2tlci5zbGRHcmFkLmRyYXcoVEhJUy5zbGlkZXJTaXplLCBUSElTLmhlaWdodCwgY29sb3IxLCBjb2xvcjIpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ3YnOlxuXHRcdFx0XHR2YXIgcmdiID0gSFNWX1JHQihUSElTLmhzdlswXSwgVEhJUy5oc3ZbMV0sIDEwMCk7XG5cdFx0XHRcdHZhciBjb2xvcjEgPSAncmdiKCcgK1xuXHRcdFx0XHRcdE1hdGgucm91bmQocmdiWzBdKSArICcsJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2JbMV0pICsgJywnICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYlsyXSkgKyAnKSc7XG5cdFx0XHRcdHZhciBjb2xvcjIgPSAnIzAwMCc7XG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkR3JhZC5kcmF3KFRISVMuc2xpZGVyU2l6ZSwgVEhJUy5oZWlnaHQsIGNvbG9yMSwgY29sb3IyKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXG5cblx0XHRmdW5jdGlvbiByZWRyYXdTbGQgKCkge1xuXHRcdFx0dmFyIHNsZENvbXBvbmVudCA9IGpzYy5nZXRTbGlkZXJDb21wb25lbnQoVEhJUyk7XG5cdFx0XHRpZiAoc2xkQ29tcG9uZW50KSB7XG5cdFx0XHRcdC8vIHJlZHJhdyB0aGUgc2xpZGVyIHBvaW50ZXJcblx0XHRcdFx0c3dpdGNoIChzbGRDb21wb25lbnQpIHtcblx0XHRcdFx0Y2FzZSAncyc6IHZhciB5Q29tcG9uZW50ID0gMTsgYnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3YnOiB2YXIgeUNvbXBvbmVudCA9IDI7IGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciB5ID0gTWF0aC5yb3VuZCgoMSAtIFRISVMuaHN2W3lDb21wb25lbnRdIC8gMTAwKSAqIChUSElTLmhlaWdodCAtIDEpKTtcblx0XHRcdFx0anNjLnBpY2tlci5zbGRQdHJPQi5zdHlsZS50b3AgPSAoeSAtICgyICogVEhJUy5wb2ludGVyQm9yZGVyV2lkdGggKyBUSElTLnBvaW50ZXJUaGlja25lc3MpIC0gTWF0aC5mbG9vcihzbGlkZXJQdHJTcGFjZSAvIDIpKSArICdweCc7XG5cdFx0XHR9XG5cdFx0fVxuXG5cblx0XHRmdW5jdGlvbiBpc1BpY2tlck93bmVyICgpIHtcblx0XHRcdHJldHVybiBqc2MucGlja2VyICYmIGpzYy5waWNrZXIub3duZXIgPT09IFRISVM7XG5cdFx0fVxuXG5cblx0XHRmdW5jdGlvbiBibHVyVmFsdWUgKCkge1xuXHRcdFx0VEhJUy5pbXBvcnRDb2xvcigpO1xuXHRcdH1cblxuXG5cdFx0Ly8gRmluZCB0aGUgdGFyZ2V0IGVsZW1lbnRcblx0XHRpZiAodHlwZW9mIHRhcmdldEVsZW1lbnQgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHR2YXIgaWQgPSB0YXJnZXRFbGVtZW50O1xuXHRcdFx0dmFyIGVsbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcblx0XHRcdGlmIChlbG0pIHtcblx0XHRcdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gZWxtO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0anNjLndhcm4oJ0NvdWxkIG5vdCBmaW5kIHRhcmdldCBlbGVtZW50IHdpdGggSUQgXFwnJyArIGlkICsgJ1xcJycpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAodGFyZ2V0RWxlbWVudCkge1xuXHRcdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gdGFyZ2V0RWxlbWVudDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0anNjLndhcm4oJ0ludmFsaWQgdGFyZ2V0IGVsZW1lbnQ6IFxcJycgKyB0YXJnZXRFbGVtZW50ICsgJ1xcJycpO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLnRhcmdldEVsZW1lbnQuX2pzY0xpbmtlZEluc3RhbmNlKSB7XG5cdFx0XHRqc2Mud2FybignQ2Fubm90IGxpbmsganNjb2xvciB0d2ljZSB0byB0aGUgc2FtZSBlbGVtZW50LiBTa2lwcGluZy4nKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dGhpcy50YXJnZXRFbGVtZW50Ll9qc2NMaW5rZWRJbnN0YW5jZSA9IHRoaXM7XG5cblx0XHQvLyBGaW5kIHRoZSB2YWx1ZSBlbGVtZW50XG5cdFx0dGhpcy52YWx1ZUVsZW1lbnQgPSBqc2MuZmV0Y2hFbGVtZW50KHRoaXMudmFsdWVFbGVtZW50KTtcblx0XHQvLyBGaW5kIHRoZSBzdHlsZSBlbGVtZW50XG5cdFx0dGhpcy5zdHlsZUVsZW1lbnQgPSBqc2MuZmV0Y2hFbGVtZW50KHRoaXMuc3R5bGVFbGVtZW50KTtcblxuXHRcdHZhciBUSElTID0gdGhpcztcblx0XHR2YXIgY29udGFpbmVyID1cblx0XHRcdHRoaXMuY29udGFpbmVyID9cblx0XHRcdGpzYy5mZXRjaEVsZW1lbnQodGhpcy5jb250YWluZXIpIDpcblx0XHRcdGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF07XG5cdFx0dmFyIHNsaWRlclB0clNwYWNlID0gMzsgLy8gcHhcblxuXHRcdC8vIEZvciBCVVRUT04gZWxlbWVudHMgaXQncyBpbXBvcnRhbnQgdG8gc3RvcCB0aGVtIGZyb20gc2VuZGluZyB0aGUgZm9ybSB3aGVuIGNsaWNrZWRcblx0XHQvLyAoZS5nLiBpbiBTYWZhcmkpXG5cdFx0aWYgKGpzYy5pc0VsZW1lbnRUeXBlKHRoaXMudGFyZ2V0RWxlbWVudCwgJ2J1dHRvbicpKSB7XG5cdFx0XHRpZiAodGhpcy50YXJnZXRFbGVtZW50Lm9uY2xpY2spIHtcblx0XHRcdFx0dmFyIG9yaWdDYWxsYmFjayA9IHRoaXMudGFyZ2V0RWxlbWVudC5vbmNsaWNrO1xuXHRcdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQub25jbGljayA9IGZ1bmN0aW9uIChldnQpIHtcblx0XHRcdFx0XHRvcmlnQ2FsbGJhY2suY2FsbCh0aGlzLCBldnQpO1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudC5vbmNsaWNrID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gZmFsc2U7IH07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Lypcblx0XHR2YXIgZWxtID0gdGhpcy50YXJnZXRFbGVtZW50O1xuXHRcdGRvIHtcblx0XHRcdC8vIElmIHRoZSB0YXJnZXQgZWxlbWVudCBvciBvbmUgb2YgaXRzIG9mZnNldFBhcmVudHMgaGFzIGZpeGVkIHBvc2l0aW9uLFxuXHRcdFx0Ly8gdGhlbiB1c2UgZml4ZWQgcG9zaXRpb25pbmcgaW5zdGVhZFxuXHRcdFx0Ly9cblx0XHRcdC8vIE5vdGU6IEluIEZpcmVmb3gsIGdldENvbXB1dGVkU3R5bGUgcmV0dXJucyBudWxsIGluIGEgaGlkZGVuIGlmcmFtZSxcblx0XHRcdC8vIHRoYXQncyB3aHkgd2UgbmVlZCB0byBjaGVjayBpZiB0aGUgcmV0dXJuZWQgc3R5bGUgb2JqZWN0IGlzIG5vbi1lbXB0eVxuXHRcdFx0dmFyIGN1cnJTdHlsZSA9IGpzYy5nZXRTdHlsZShlbG0pO1xuXHRcdFx0aWYgKGN1cnJTdHlsZSAmJiBjdXJyU3R5bGUucG9zaXRpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2ZpeGVkJykge1xuXHRcdFx0XHR0aGlzLmZpeGVkID0gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGVsbSAhPT0gdGhpcy50YXJnZXRFbGVtZW50KSB7XG5cdFx0XHRcdC8vIGF0dGFjaCBvblBhcmVudFNjcm9sbCBzbyB0aGF0IHdlIGNhbiByZWNvbXB1dGUgdGhlIHBpY2tlciBwb3NpdGlvblxuXHRcdFx0XHQvLyB3aGVuIG9uZSBvZiB0aGUgb2Zmc2V0UGFyZW50cyBpcyBzY3JvbGxlZFxuXHRcdFx0XHRpZiAoIWVsbS5fanNjRXZlbnRzQXR0YWNoZWQpIHtcblx0XHRcdFx0XHRqc2MuYXR0YWNoRXZlbnQoZWxtLCAnc2Nyb2xsJywganNjLm9uUGFyZW50U2Nyb2xsKTtcblx0XHRcdFx0XHRlbG0uX2pzY0V2ZW50c0F0dGFjaGVkID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gd2hpbGUgKChlbG0gPSBlbG0ub2Zmc2V0UGFyZW50KSAmJiAhanNjLmlzRWxlbWVudFR5cGUoZWxtLCAnYm9keScpKTtcblx0XHQqL1xuXG5cdFx0Ly8gdmFsdWVFbGVtZW50XG5cdFx0aWYgKHRoaXMudmFsdWVFbGVtZW50KSB7XG5cdFx0XHRpZiAoanNjLmlzRWxlbWVudFR5cGUodGhpcy52YWx1ZUVsZW1lbnQsICdpbnB1dCcpKSB7XG5cdFx0XHRcdHZhciB1cGRhdGVGaWVsZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRUSElTLmZyb21TdHJpbmcoVEhJUy52YWx1ZUVsZW1lbnQudmFsdWUsIGpzYy5sZWF2ZVZhbHVlKTtcblx0XHRcdFx0XHRqc2MuZGlzcGF0Y2hGaW5lQ2hhbmdlKFRISVMpO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRqc2MuYXR0YWNoRXZlbnQodGhpcy52YWx1ZUVsZW1lbnQsICdrZXl1cCcsIHVwZGF0ZUZpZWxkKTtcblx0XHRcdFx0anNjLmF0dGFjaEV2ZW50KHRoaXMudmFsdWVFbGVtZW50LCAnaW5wdXQnLCB1cGRhdGVGaWVsZCk7XG5cdFx0XHRcdGpzYy5hdHRhY2hFdmVudCh0aGlzLnZhbHVlRWxlbWVudCwgJ2JsdXInLCBibHVyVmFsdWUpO1xuXHRcdFx0XHR0aGlzLnZhbHVlRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2F1dG9jb21wbGV0ZScsICdvZmYnKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBzdHlsZUVsZW1lbnRcblx0XHRpZiAodGhpcy5zdHlsZUVsZW1lbnQpIHtcblx0XHRcdHRoaXMuc3R5bGVFbGVtZW50Ll9qc2NPcmlnU3R5bGUgPSB7XG5cdFx0XHRcdGJhY2tncm91bmRJbWFnZSA6IHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRJbWFnZSxcblx0XHRcdFx0YmFja2dyb3VuZENvbG9yIDogdGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yLFxuXHRcdFx0XHRjb2xvciA6IHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmNvbG9yXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLnZhbHVlKSB7XG5cdFx0XHQvLyBUcnkgdG8gc2V0IHRoZSBjb2xvciBmcm9tIHRoZSAudmFsdWUgb3B0aW9uIGFuZCBpZiB1bnN1Y2Nlc3NmdWwsXG5cdFx0XHQvLyBleHBvcnQgdGhlIGN1cnJlbnQgY29sb3Jcblx0XHRcdHRoaXMuZnJvbVN0cmluZyh0aGlzLnZhbHVlKSB8fCB0aGlzLmV4cG9ydENvbG9yKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuaW1wb3J0Q29sb3IoKTtcblx0XHR9XG5cdH1cblxufTtcblxuXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBQdWJsaWMgcHJvcGVydGllcyBhbmQgbWV0aG9kc1xuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5cbi8vIEJ5IGRlZmF1bHQsIHNlYXJjaCBmb3IgYWxsIGVsZW1lbnRzIHdpdGggY2xhc3M9XCJqc2NvbG9yXCIgYW5kIGluc3RhbGwgYSBjb2xvciBwaWNrZXIgb24gdGhlbS5cbi8vXG4vLyBZb3UgY2FuIGNoYW5nZSB3aGF0IGNsYXNzIG5hbWUgd2lsbCBiZSBsb29rZWQgZm9yIGJ5IHNldHRpbmcgdGhlIHByb3BlcnR5IGpzY29sb3IubG9va3VwQ2xhc3Ncbi8vIGFueXdoZXJlIGluIHlvdXIgSFRNTCBkb2N1bWVudC4gVG8gY29tcGxldGVseSBkaXNhYmxlIHRoZSBhdXRvbWF0aWMgbG9va3VwLCBzZXQgaXQgdG8gbnVsbC5cbi8vXG5qc2MuanNjb2xvci5sb29rdXBDbGFzcyA9ICdqc2NvbG9yJztcblxuXG5qc2MuanNjb2xvci5pbnN0YWxsQnlDbGFzc05hbWUgPSBmdW5jdGlvbiAoY2xhc3NOYW1lKSB7XG5cdHZhciBpbnB1dEVsbXMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW5wdXQnKTtcblx0dmFyIGJ1dHRvbkVsbXMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYnV0dG9uJyk7XG5cblx0anNjLnRyeUluc3RhbGxPbkVsZW1lbnRzKGlucHV0RWxtcywgY2xhc3NOYW1lKTtcblx0anNjLnRyeUluc3RhbGxPbkVsZW1lbnRzKGJ1dHRvbkVsbXMsIGNsYXNzTmFtZSk7XG59O1xuXG5cbmpzYy5yZWdpc3RlcigpO1xuXG5cbnJldHVybiBqc2MuanNjb2xvcjtcblxuXG59KSgpOyB9XG4iLCIvKiEgdmV4LmNvbWJpbmVkLmpzOiB2ZXggMy4xLjEsIHZleC1kaWFsb2cgMS4wLjcgKi9cbiFmdW5jdGlvbihhKXtpZihcIm9iamVjdFwiPT10eXBlb2YgZXhwb3J0cyYmXCJ1bmRlZmluZWRcIiE9dHlwZW9mIG1vZHVsZSltb2R1bGUuZXhwb3J0cz1hKCk7ZWxzZSBpZihcImZ1bmN0aW9uXCI9PXR5cGVvZiBkZWZpbmUmJmRlZmluZS5hbWQpZGVmaW5lKFtdLGEpO2Vsc2V7dmFyIGI7Yj1cInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93P3dpbmRvdzpcInVuZGVmaW5lZFwiIT10eXBlb2YgZ2xvYmFsP2dsb2JhbDpcInVuZGVmaW5lZFwiIT10eXBlb2Ygc2VsZj9zZWxmOnRoaXMsYi52ZXg9YSgpfX0oZnVuY3Rpb24oKXt2YXIgYTtyZXR1cm4gZnVuY3Rpb24gYihhLGMsZCl7ZnVuY3Rpb24gZShnLGgpe2lmKCFjW2ddKXtpZighYVtnXSl7dmFyIGk9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighaCYmaSlyZXR1cm4gaShnLCEwKTtpZihmKXJldHVybiBmKGcsITApO3ZhciBqPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrZytcIidcIik7dGhyb3cgai5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGp9dmFyIGs9Y1tnXT17ZXhwb3J0czp7fX07YVtnXVswXS5jYWxsKGsuZXhwb3J0cyxmdW5jdGlvbihiKXt2YXIgYz1hW2ddWzFdW2JdO3JldHVybiBlKGM/YzpiKX0sayxrLmV4cG9ydHMsYixhLGMsZCl9cmV0dXJuIGNbZ10uZXhwb3J0c31mb3IodmFyIGY9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxnPTA7ZzxkLmxlbmd0aDtnKyspZShkW2ddKTtyZXR1cm4gZX0oezE6W2Z1bmN0aW9uKGEsYixjKXtcImRvY3VtZW50XCJpbiB3aW5kb3cuc2VsZiYmKFwiY2xhc3NMaXN0XCJpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKSYmKCFkb2N1bWVudC5jcmVhdGVFbGVtZW50TlN8fFwiY2xhc3NMaXN0XCJpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLFwiZ1wiKSk/IWZ1bmN0aW9uKCl7XCJ1c2Ugc3RyaWN0XCI7dmFyIGE9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIl9cIik7aWYoYS5jbGFzc0xpc3QuYWRkKFwiYzFcIixcImMyXCIpLCFhLmNsYXNzTGlzdC5jb250YWlucyhcImMyXCIpKXt2YXIgYj1mdW5jdGlvbihhKXt2YXIgYj1ET01Ub2tlbkxpc3QucHJvdG90eXBlW2FdO0RPTVRva2VuTGlzdC5wcm90b3R5cGVbYV09ZnVuY3Rpb24oYSl7dmFyIGMsZD1hcmd1bWVudHMubGVuZ3RoO2ZvcihjPTA7YzxkO2MrKylhPWFyZ3VtZW50c1tjXSxiLmNhbGwodGhpcyxhKX19O2IoXCJhZGRcIiksYihcInJlbW92ZVwiKX1pZihhLmNsYXNzTGlzdC50b2dnbGUoXCJjM1wiLCExKSxhLmNsYXNzTGlzdC5jb250YWlucyhcImMzXCIpKXt2YXIgYz1ET01Ub2tlbkxpc3QucHJvdG90eXBlLnRvZ2dsZTtET01Ub2tlbkxpc3QucHJvdG90eXBlLnRvZ2dsZT1mdW5jdGlvbihhLGIpe3JldHVybiAxIGluIGFyZ3VtZW50cyYmIXRoaXMuY29udGFpbnMoYSk9PSFiP2I6Yy5jYWxsKHRoaXMsYSl9fWE9bnVsbH0oKTohZnVuY3Rpb24oYSl7XCJ1c2Ugc3RyaWN0XCI7aWYoXCJFbGVtZW50XCJpbiBhKXt2YXIgYj1cImNsYXNzTGlzdFwiLGM9XCJwcm90b3R5cGVcIixkPWEuRWxlbWVudFtjXSxlPU9iamVjdCxmPVN0cmluZ1tjXS50cmltfHxmdW5jdGlvbigpe3JldHVybiB0aGlzLnJlcGxhY2UoL15cXHMrfFxccyskL2csXCJcIil9LGc9QXJyYXlbY10uaW5kZXhPZnx8ZnVuY3Rpb24oYSl7Zm9yKHZhciBiPTAsYz10aGlzLmxlbmd0aDtiPGM7YisrKWlmKGIgaW4gdGhpcyYmdGhpc1tiXT09PWEpcmV0dXJuIGI7cmV0dXJuLTF9LGg9ZnVuY3Rpb24oYSxiKXt0aGlzLm5hbWU9YSx0aGlzLmNvZGU9RE9NRXhjZXB0aW9uW2FdLHRoaXMubWVzc2FnZT1ifSxpPWZ1bmN0aW9uKGEsYil7aWYoXCJcIj09PWIpdGhyb3cgbmV3IGgoXCJTWU5UQVhfRVJSXCIsXCJBbiBpbnZhbGlkIG9yIGlsbGVnYWwgc3RyaW5nIHdhcyBzcGVjaWZpZWRcIik7aWYoL1xccy8udGVzdChiKSl0aHJvdyBuZXcgaChcIklOVkFMSURfQ0hBUkFDVEVSX0VSUlwiLFwiU3RyaW5nIGNvbnRhaW5zIGFuIGludmFsaWQgY2hhcmFjdGVyXCIpO3JldHVybiBnLmNhbGwoYSxiKX0saj1mdW5jdGlvbihhKXtmb3IodmFyIGI9Zi5jYWxsKGEuZ2V0QXR0cmlidXRlKFwiY2xhc3NcIil8fFwiXCIpLGM9Yj9iLnNwbGl0KC9cXHMrLyk6W10sZD0wLGU9Yy5sZW5ndGg7ZDxlO2QrKyl0aGlzLnB1c2goY1tkXSk7dGhpcy5fdXBkYXRlQ2xhc3NOYW1lPWZ1bmN0aW9uKCl7YS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLHRoaXMudG9TdHJpbmcoKSl9fSxrPWpbY109W10sbD1mdW5jdGlvbigpe3JldHVybiBuZXcgaih0aGlzKX07aWYoaFtjXT1FcnJvcltjXSxrLml0ZW09ZnVuY3Rpb24oYSl7cmV0dXJuIHRoaXNbYV18fG51bGx9LGsuY29udGFpbnM9ZnVuY3Rpb24oYSl7cmV0dXJuIGErPVwiXCIsaSh0aGlzLGEpIT09LTF9LGsuYWRkPWZ1bmN0aW9uKCl7dmFyIGEsYj1hcmd1bWVudHMsYz0wLGQ9Yi5sZW5ndGgsZT0hMTtkbyBhPWJbY10rXCJcIixpKHRoaXMsYSk9PT0tMSYmKHRoaXMucHVzaChhKSxlPSEwKTt3aGlsZSgrK2M8ZCk7ZSYmdGhpcy5fdXBkYXRlQ2xhc3NOYW1lKCl9LGsucmVtb3ZlPWZ1bmN0aW9uKCl7dmFyIGEsYixjPWFyZ3VtZW50cyxkPTAsZT1jLmxlbmd0aCxmPSExO2RvIGZvcihhPWNbZF0rXCJcIixiPWkodGhpcyxhKTtiIT09LTE7KXRoaXMuc3BsaWNlKGIsMSksZj0hMCxiPWkodGhpcyxhKTt3aGlsZSgrK2Q8ZSk7ZiYmdGhpcy5fdXBkYXRlQ2xhc3NOYW1lKCl9LGsudG9nZ2xlPWZ1bmN0aW9uKGEsYil7YSs9XCJcIjt2YXIgYz10aGlzLmNvbnRhaW5zKGEpLGQ9Yz9iIT09ITAmJlwicmVtb3ZlXCI6YiE9PSExJiZcImFkZFwiO3JldHVybiBkJiZ0aGlzW2RdKGEpLGI9PT0hMHx8Yj09PSExP2I6IWN9LGsudG9TdHJpbmc9ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5qb2luKFwiIFwiKX0sZS5kZWZpbmVQcm9wZXJ0eSl7dmFyIG09e2dldDpsLGVudW1lcmFibGU6ITAsY29uZmlndXJhYmxlOiEwfTt0cnl7ZS5kZWZpbmVQcm9wZXJ0eShkLGIsbSl9Y2F0Y2gobil7bi5udW1iZXI9PT0tMjE0NjgyMzI1MiYmKG0uZW51bWVyYWJsZT0hMSxlLmRlZmluZVByb3BlcnR5KGQsYixtKSl9fWVsc2UgZVtjXS5fX2RlZmluZUdldHRlcl9fJiZkLl9fZGVmaW5lR2V0dGVyX18oYixsKX19KHdpbmRvdy5zZWxmKSl9LHt9XSwyOltmdW5jdGlvbihhLGIsYyl7ZnVuY3Rpb24gZChhLGIpe2lmKFwic3RyaW5nXCIhPXR5cGVvZiBhKXRocm93IG5ldyBUeXBlRXJyb3IoXCJTdHJpbmcgZXhwZWN0ZWRcIik7Ynx8KGI9ZG9jdW1lbnQpO3ZhciBjPS88KFtcXHc6XSspLy5leGVjKGEpO2lmKCFjKXJldHVybiBiLmNyZWF0ZVRleHROb2RlKGEpO2E9YS5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLFwiXCIpO3ZhciBkPWNbMV07aWYoXCJib2R5XCI9PWQpe3ZhciBlPWIuY3JlYXRlRWxlbWVudChcImh0bWxcIik7cmV0dXJuIGUuaW5uZXJIVE1MPWEsZS5yZW1vdmVDaGlsZChlLmxhc3RDaGlsZCl9dmFyIGY9Z1tkXXx8Zy5fZGVmYXVsdCxoPWZbMF0saT1mWzFdLGo9ZlsyXSxlPWIuY3JlYXRlRWxlbWVudChcImRpdlwiKTtmb3IoZS5pbm5lckhUTUw9aSthK2o7aC0tOyllPWUubGFzdENoaWxkO2lmKGUuZmlyc3RDaGlsZD09ZS5sYXN0Q2hpbGQpcmV0dXJuIGUucmVtb3ZlQ2hpbGQoZS5maXJzdENoaWxkKTtmb3IodmFyIGs9Yi5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7ZS5maXJzdENoaWxkOylrLmFwcGVuZENoaWxkKGUucmVtb3ZlQ2hpbGQoZS5maXJzdENoaWxkKSk7cmV0dXJuIGt9Yi5leHBvcnRzPWQ7dmFyIGUsZj0hMTtcInVuZGVmaW5lZFwiIT10eXBlb2YgZG9jdW1lbnQmJihlPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiksZS5pbm5lckhUTUw9JyAgPGxpbmsvPjx0YWJsZT48L3RhYmxlPjxhIGhyZWY9XCIvYVwiPmE8L2E+PGlucHV0IHR5cGU9XCJjaGVja2JveFwiLz4nLGY9IWUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJsaW5rXCIpLmxlbmd0aCxlPXZvaWQgMCk7dmFyIGc9e2xlZ2VuZDpbMSxcIjxmaWVsZHNldD5cIixcIjwvZmllbGRzZXQ+XCJdLHRyOlsyLFwiPHRhYmxlPjx0Ym9keT5cIixcIjwvdGJvZHk+PC90YWJsZT5cIl0sY29sOlsyLFwiPHRhYmxlPjx0Ym9keT48L3Rib2R5Pjxjb2xncm91cD5cIixcIjwvY29sZ3JvdXA+PC90YWJsZT5cIl0sX2RlZmF1bHQ6Zj9bMSxcIlg8ZGl2PlwiLFwiPC9kaXY+XCJdOlswLFwiXCIsXCJcIl19O2cudGQ9Zy50aD1bMyxcIjx0YWJsZT48dGJvZHk+PHRyPlwiLFwiPC90cj48L3Rib2R5PjwvdGFibGU+XCJdLGcub3B0aW9uPWcub3B0Z3JvdXA9WzEsJzxzZWxlY3QgbXVsdGlwbGU9XCJtdWx0aXBsZVwiPicsXCI8L3NlbGVjdD5cIl0sZy50aGVhZD1nLnRib2R5PWcuY29sZ3JvdXA9Zy5jYXB0aW9uPWcudGZvb3Q9WzEsXCI8dGFibGU+XCIsXCI8L3RhYmxlPlwiXSxnLnBvbHlsaW5lPWcuZWxsaXBzZT1nLnBvbHlnb249Zy5jaXJjbGU9Zy50ZXh0PWcubGluZT1nLnBhdGg9Zy5yZWN0PWcuZz1bMSwnPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmVyc2lvbj1cIjEuMVwiPicsXCI8L3N2Zz5cIl19LHt9XSwzOltmdW5jdGlvbihhLGIsYyl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gZChhLGIpe2lmKHZvaWQgMD09PWF8fG51bGw9PT1hKXRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY29udmVydCBmaXJzdCBhcmd1bWVudCB0byBvYmplY3RcIik7Zm9yKHZhciBjPU9iamVjdChhKSxkPTE7ZDxhcmd1bWVudHMubGVuZ3RoO2QrKyl7dmFyIGU9YXJndW1lbnRzW2RdO2lmKHZvaWQgMCE9PWUmJm51bGwhPT1lKWZvcih2YXIgZj1PYmplY3Qua2V5cyhPYmplY3QoZSkpLGc9MCxoPWYubGVuZ3RoO2c8aDtnKyspe3ZhciBpPWZbZ10saj1PYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGUsaSk7dm9pZCAwIT09aiYmai5lbnVtZXJhYmxlJiYoY1tpXT1lW2ldKX19cmV0dXJuIGN9ZnVuY3Rpb24gZSgpe09iamVjdC5hc3NpZ258fE9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QsXCJhc3NpZ25cIix7ZW51bWVyYWJsZTohMSxjb25maWd1cmFibGU6ITAsd3JpdGFibGU6ITAsdmFsdWU6ZH0pfWIuZXhwb3J0cz17YXNzaWduOmQscG9seWZpbGw6ZX19LHt9XSw0OltmdW5jdGlvbihhLGIsYyl7ZnVuY3Rpb24gZChhLGIpe1wib2JqZWN0XCIhPXR5cGVvZiBiP2I9e2hhc2g6ISFifTp2b2lkIDA9PT1iLmhhc2gmJihiLmhhc2g9ITApO2Zvcih2YXIgYz1iLmhhc2g/e306XCJcIixkPWIuc2VyaWFsaXplcnx8KGIuaGFzaD9nOmgpLGU9YSYmYS5lbGVtZW50cz9hLmVsZW1lbnRzOltdLGY9T2JqZWN0LmNyZWF0ZShudWxsKSxrPTA7azxlLmxlbmd0aDsrK2spe3ZhciBsPWVba107aWYoKGIuZGlzYWJsZWR8fCFsLmRpc2FibGVkKSYmbC5uYW1lJiZqLnRlc3QobC5ub2RlTmFtZSkmJiFpLnRlc3QobC50eXBlKSl7dmFyIG09bC5uYW1lLG49bC52YWx1ZTtpZihcImNoZWNrYm94XCIhPT1sLnR5cGUmJlwicmFkaW9cIiE9PWwudHlwZXx8bC5jaGVja2VkfHwobj12b2lkIDApLGIuZW1wdHkpe2lmKFwiY2hlY2tib3hcIiE9PWwudHlwZXx8bC5jaGVja2VkfHwobj1cIlwiKSxcInJhZGlvXCI9PT1sLnR5cGUmJihmW2wubmFtZV18fGwuY2hlY2tlZD9sLmNoZWNrZWQmJihmW2wubmFtZV09ITApOmZbbC5uYW1lXT0hMSksIW4mJlwicmFkaW9cIj09bC50eXBlKWNvbnRpbnVlfWVsc2UgaWYoIW4pY29udGludWU7aWYoXCJzZWxlY3QtbXVsdGlwbGVcIiE9PWwudHlwZSljPWQoYyxtLG4pO2Vsc2V7bj1bXTtmb3IodmFyIG89bC5vcHRpb25zLHA9ITEscT0wO3E8by5sZW5ndGg7KytxKXt2YXIgcj1vW3FdLHM9Yi5lbXB0eSYmIXIudmFsdWUsdD1yLnZhbHVlfHxzO3Iuc2VsZWN0ZWQmJnQmJihwPSEwLGM9Yi5oYXNoJiZcIltdXCIhPT1tLnNsaWNlKG0ubGVuZ3RoLTIpP2QoYyxtK1wiW11cIixyLnZhbHVlKTpkKGMsbSxyLnZhbHVlKSl9IXAmJmIuZW1wdHkmJihjPWQoYyxtLFwiXCIpKX19fWlmKGIuZW1wdHkpZm9yKHZhciBtIGluIGYpZlttXXx8KGM9ZChjLG0sXCJcIikpO3JldHVybiBjfWZ1bmN0aW9uIGUoYSl7dmFyIGI9W10sYz0vXihbXlxcW1xcXV0qKS8sZD1uZXcgUmVnRXhwKGspLGU9Yy5leGVjKGEpO2ZvcihlWzFdJiZiLnB1c2goZVsxXSk7bnVsbCE9PShlPWQuZXhlYyhhKSk7KWIucHVzaChlWzFdKTtyZXR1cm4gYn1mdW5jdGlvbiBmKGEsYixjKXtpZigwPT09Yi5sZW5ndGgpcmV0dXJuIGE9Yzt2YXIgZD1iLnNoaWZ0KCksZT1kLm1hdGNoKC9eXFxbKC4rPylcXF0kLyk7aWYoXCJbXVwiPT09ZClyZXR1cm4gYT1hfHxbXSxBcnJheS5pc0FycmF5KGEpP2EucHVzaChmKG51bGwsYixjKSk6KGEuX3ZhbHVlcz1hLl92YWx1ZXN8fFtdLGEuX3ZhbHVlcy5wdXNoKGYobnVsbCxiLGMpKSksYTtpZihlKXt2YXIgZz1lWzFdLGg9K2c7aXNOYU4oaCk/KGE9YXx8e30sYVtnXT1mKGFbZ10sYixjKSk6KGE9YXx8W10sYVtoXT1mKGFbaF0sYixjKSl9ZWxzZSBhW2RdPWYoYVtkXSxiLGMpO3JldHVybiBhfWZ1bmN0aW9uIGcoYSxiLGMpe3ZhciBkPWIubWF0Y2goayk7aWYoZCl7dmFyIGc9ZShiKTtmKGEsZyxjKX1lbHNle3ZhciBoPWFbYl07aD8oQXJyYXkuaXNBcnJheShoKXx8KGFbYl09W2hdKSxhW2JdLnB1c2goYykpOmFbYl09Y31yZXR1cm4gYX1mdW5jdGlvbiBoKGEsYixjKXtyZXR1cm4gYz1jLnJlcGxhY2UoLyhcXHIpP1xcbi9nLFwiXFxyXFxuXCIpLGM9ZW5jb2RlVVJJQ29tcG9uZW50KGMpLGM9Yy5yZXBsYWNlKC8lMjAvZyxcIitcIiksYSsoYT9cIiZcIjpcIlwiKStlbmNvZGVVUklDb21wb25lbnQoYikrXCI9XCIrY312YXIgaT0vXig/OnN1Ym1pdHxidXR0b258aW1hZ2V8cmVzZXR8ZmlsZSkkL2ksaj0vXig/OmlucHV0fHNlbGVjdHx0ZXh0YXJlYXxrZXlnZW4pL2ksaz0vKFxcW1teXFxbXFxdXSpcXF0pL2c7Yi5leHBvcnRzPWR9LHt9XSw1OltmdW5jdGlvbihiLGMsZCl7KGZ1bmN0aW9uKGUpeyFmdW5jdGlvbihiKXtpZihcIm9iamVjdFwiPT10eXBlb2YgZCYmXCJ1bmRlZmluZWRcIiE9dHlwZW9mIGMpYy5leHBvcnRzPWIoKTtlbHNlIGlmKFwiZnVuY3Rpb25cIj09dHlwZW9mIGEmJmEuYW1kKWEoW10sYik7ZWxzZXt2YXIgZjtmPVwidW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3c/d2luZG93OlwidW5kZWZpbmVkXCIhPXR5cGVvZiBlP2U6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHNlbGY/c2VsZjp0aGlzLGYudmV4RGlhbG9nPWIoKX19KGZ1bmN0aW9uKCl7cmV0dXJuIGZ1bmN0aW9uIGEoYyxkLGUpe2Z1bmN0aW9uIGYoaCxpKXtpZighZFtoXSl7aWYoIWNbaF0pe3ZhciBqPVwiZnVuY3Rpb25cIj09dHlwZW9mIGImJmI7aWYoIWkmJmopcmV0dXJuIGooaCwhMCk7aWYoZylyZXR1cm4gZyhoLCEwKTt2YXIgaz1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2grXCInXCIpO3Rocm93IGsuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixrfXZhciBsPWRbaF09e2V4cG9ydHM6e319O2NbaF1bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oYSl7dmFyIGI9Y1toXVsxXVthXTtyZXR1cm4gZihiP2I6YSl9LGwsbC5leHBvcnRzLGEsYyxkLGUpfXJldHVybiBkW2hdLmV4cG9ydHN9Zm9yKHZhciBnPVwiZnVuY3Rpb25cIj09dHlwZW9mIGImJmIsaD0wO2g8ZS5sZW5ndGg7aCsrKWYoZVtoXSk7cmV0dXJuIGZ9KHsxOltmdW5jdGlvbihhLGIsYyl7ZnVuY3Rpb24gZChhLGIpe2lmKFwic3RyaW5nXCIhPXR5cGVvZiBhKXRocm93IG5ldyBUeXBlRXJyb3IoXCJTdHJpbmcgZXhwZWN0ZWRcIik7Ynx8KGI9ZG9jdW1lbnQpO3ZhciBjPS88KFtcXHc6XSspLy5leGVjKGEpO2lmKCFjKXJldHVybiBiLmNyZWF0ZVRleHROb2RlKGEpO2E9YS5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLFwiXCIpO3ZhciBkPWNbMV07aWYoXCJib2R5XCI9PWQpe3ZhciBlPWIuY3JlYXRlRWxlbWVudChcImh0bWxcIik7cmV0dXJuIGUuaW5uZXJIVE1MPWEsZS5yZW1vdmVDaGlsZChlLmxhc3RDaGlsZCl9dmFyIGY9Z1tkXXx8Zy5fZGVmYXVsdCxoPWZbMF0saT1mWzFdLGo9ZlsyXSxlPWIuY3JlYXRlRWxlbWVudChcImRpdlwiKTtmb3IoZS5pbm5lckhUTUw9aSthK2o7aC0tOyllPWUubGFzdENoaWxkO2lmKGUuZmlyc3RDaGlsZD09ZS5sYXN0Q2hpbGQpcmV0dXJuIGUucmVtb3ZlQ2hpbGQoZS5maXJzdENoaWxkKTtmb3IodmFyIGs9Yi5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7ZS5maXJzdENoaWxkOylrLmFwcGVuZENoaWxkKGUucmVtb3ZlQ2hpbGQoZS5maXJzdENoaWxkKSk7cmV0dXJuIGt9Yi5leHBvcnRzPWQ7dmFyIGUsZj0hMTtcInVuZGVmaW5lZFwiIT10eXBlb2YgZG9jdW1lbnQmJihlPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiksZS5pbm5lckhUTUw9JyAgPGxpbmsvPjx0YWJsZT48L3RhYmxlPjxhIGhyZWY9XCIvYVwiPmE8L2E+PGlucHV0IHR5cGU9XCJjaGVja2JveFwiLz4nLGY9IWUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJsaW5rXCIpLmxlbmd0aCxlPXZvaWQgMCk7dmFyIGc9e2xlZ2VuZDpbMSxcIjxmaWVsZHNldD5cIixcIjwvZmllbGRzZXQ+XCJdLHRyOlsyLFwiPHRhYmxlPjx0Ym9keT5cIixcIjwvdGJvZHk+PC90YWJsZT5cIl0sY29sOlsyLFwiPHRhYmxlPjx0Ym9keT48L3Rib2R5Pjxjb2xncm91cD5cIixcIjwvY29sZ3JvdXA+PC90YWJsZT5cIl0sX2RlZmF1bHQ6Zj9bMSxcIlg8ZGl2PlwiLFwiPC9kaXY+XCJdOlswLFwiXCIsXCJcIl19O2cudGQ9Zy50aD1bMyxcIjx0YWJsZT48dGJvZHk+PHRyPlwiLFwiPC90cj48L3Rib2R5PjwvdGFibGU+XCJdLGcub3B0aW9uPWcub3B0Z3JvdXA9WzEsJzxzZWxlY3QgbXVsdGlwbGU9XCJtdWx0aXBsZVwiPicsXCI8L3NlbGVjdD5cIl0sZy50aGVhZD1nLnRib2R5PWcuY29sZ3JvdXA9Zy5jYXB0aW9uPWcudGZvb3Q9WzEsXCI8dGFibGU+XCIsXCI8L3RhYmxlPlwiXSxnLnBvbHlsaW5lPWcuZWxsaXBzZT1nLnBvbHlnb249Zy5jaXJjbGU9Zy50ZXh0PWcubGluZT1nLnBhdGg9Zy5yZWN0PWcuZz1bMSwnPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmVyc2lvbj1cIjEuMVwiPicsXCI8L3N2Zz5cIl19LHt9XSwyOltmdW5jdGlvbihhLGIsYyl7ZnVuY3Rpb24gZChhLGIpe1wib2JqZWN0XCIhPXR5cGVvZiBiP2I9e2hhc2g6ISFifTp2b2lkIDA9PT1iLmhhc2gmJihiLmhhc2g9ITApO2Zvcih2YXIgYz1iLmhhc2g/e306XCJcIixkPWIuc2VyaWFsaXplcnx8KGIuaGFzaD9nOmgpLGU9YSYmYS5lbGVtZW50cz9hLmVsZW1lbnRzOltdLGY9T2JqZWN0LmNyZWF0ZShudWxsKSxrPTA7azxlLmxlbmd0aDsrK2spe3ZhciBsPWVba107aWYoKGIuZGlzYWJsZWR8fCFsLmRpc2FibGVkKSYmbC5uYW1lJiZqLnRlc3QobC5ub2RlTmFtZSkmJiFpLnRlc3QobC50eXBlKSl7dmFyIG09bC5uYW1lLG49bC52YWx1ZTtpZihcImNoZWNrYm94XCIhPT1sLnR5cGUmJlwicmFkaW9cIiE9PWwudHlwZXx8bC5jaGVja2VkfHwobj12b2lkIDApLGIuZW1wdHkpe2lmKFwiY2hlY2tib3hcIiE9PWwudHlwZXx8bC5jaGVja2VkfHwobj1cIlwiKSxcInJhZGlvXCI9PT1sLnR5cGUmJihmW2wubmFtZV18fGwuY2hlY2tlZD9sLmNoZWNrZWQmJihmW2wubmFtZV09ITApOmZbbC5uYW1lXT0hMSksIW4mJlwicmFkaW9cIj09bC50eXBlKWNvbnRpbnVlfWVsc2UgaWYoIW4pY29udGludWU7aWYoXCJzZWxlY3QtbXVsdGlwbGVcIiE9PWwudHlwZSljPWQoYyxtLG4pO2Vsc2V7bj1bXTtmb3IodmFyIG89bC5vcHRpb25zLHA9ITEscT0wO3E8by5sZW5ndGg7KytxKXt2YXIgcj1vW3FdLHM9Yi5lbXB0eSYmIXIudmFsdWUsdD1yLnZhbHVlfHxzO3Iuc2VsZWN0ZWQmJnQmJihwPSEwLGM9Yi5oYXNoJiZcIltdXCIhPT1tLnNsaWNlKG0ubGVuZ3RoLTIpP2QoYyxtK1wiW11cIixyLnZhbHVlKTpkKGMsbSxyLnZhbHVlKSl9IXAmJmIuZW1wdHkmJihjPWQoYyxtLFwiXCIpKX19fWlmKGIuZW1wdHkpZm9yKHZhciBtIGluIGYpZlttXXx8KGM9ZChjLG0sXCJcIikpO3JldHVybiBjfWZ1bmN0aW9uIGUoYSl7dmFyIGI9W10sYz0vXihbXlxcW1xcXV0qKS8sZD1uZXcgUmVnRXhwKGspLGU9Yy5leGVjKGEpO2ZvcihlWzFdJiZiLnB1c2goZVsxXSk7bnVsbCE9PShlPWQuZXhlYyhhKSk7KWIucHVzaChlWzFdKTtyZXR1cm4gYn1mdW5jdGlvbiBmKGEsYixjKXtpZigwPT09Yi5sZW5ndGgpcmV0dXJuIGE9Yzt2YXIgZD1iLnNoaWZ0KCksZT1kLm1hdGNoKC9eXFxbKC4rPylcXF0kLyk7aWYoXCJbXVwiPT09ZClyZXR1cm4gYT1hfHxbXSxBcnJheS5pc0FycmF5KGEpP2EucHVzaChmKG51bGwsYixjKSk6KGEuX3ZhbHVlcz1hLl92YWx1ZXN8fFtdLGEuX3ZhbHVlcy5wdXNoKGYobnVsbCxiLGMpKSksYTtpZihlKXt2YXIgZz1lWzFdLGg9K2c7aXNOYU4oaCk/KGE9YXx8e30sYVtnXT1mKGFbZ10sYixjKSk6KGE9YXx8W10sYVtoXT1mKGFbaF0sYixjKSl9ZWxzZSBhW2RdPWYoYVtkXSxiLGMpO3JldHVybiBhfWZ1bmN0aW9uIGcoYSxiLGMpe3ZhciBkPWIubWF0Y2goayk7aWYoZCl7dmFyIGc9ZShiKTtmKGEsZyxjKX1lbHNle3ZhciBoPWFbYl07aD8oQXJyYXkuaXNBcnJheShoKXx8KGFbYl09W2hdKSxhW2JdLnB1c2goYykpOmFbYl09Y31yZXR1cm4gYX1mdW5jdGlvbiBoKGEsYixjKXtyZXR1cm4gYz1jLnJlcGxhY2UoLyhcXHIpP1xcbi9nLFwiXFxyXFxuXCIpLGM9ZW5jb2RlVVJJQ29tcG9uZW50KGMpLGM9Yy5yZXBsYWNlKC8lMjAvZyxcIitcIiksYSsoYT9cIiZcIjpcIlwiKStlbmNvZGVVUklDb21wb25lbnQoYikrXCI9XCIrY312YXIgaT0vXig/OnN1Ym1pdHxidXR0b258aW1hZ2V8cmVzZXR8ZmlsZSkkL2ksaj0vXig/OmlucHV0fHNlbGVjdHx0ZXh0YXJlYXxrZXlnZW4pL2ksaz0vKFxcW1teXFxbXFxdXSpcXF0pL2c7Yi5leHBvcnRzPWR9LHt9XSwzOltmdW5jdGlvbihhLGIsYyl7dmFyIGQ9YShcImRvbWlmeVwiKSxlPWEoXCJmb3JtLXNlcmlhbGl6ZVwiKSxmPWZ1bmN0aW9uKGEpe3ZhciBiPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJmb3JtXCIpO2IuY2xhc3NMaXN0LmFkZChcInZleC1kaWFsb2ctZm9ybVwiKTt2YXIgYz1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO2MuY2xhc3NMaXN0LmFkZChcInZleC1kaWFsb2ctbWVzc2FnZVwiKSxjLmFwcGVuZENoaWxkKGEubWVzc2FnZSBpbnN0YW5jZW9mIHdpbmRvdy5Ob2RlP2EubWVzc2FnZTpkKGEubWVzc2FnZSkpO3ZhciBlPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7cmV0dXJuIGUuY2xhc3NMaXN0LmFkZChcInZleC1kaWFsb2ctaW5wdXRcIiksZS5hcHBlbmRDaGlsZChhLmlucHV0IGluc3RhbmNlb2Ygd2luZG93Lk5vZGU/YS5pbnB1dDpkKGEuaW5wdXQpKSxiLmFwcGVuZENoaWxkKGMpLGIuYXBwZW5kQ2hpbGQoZSksYn0sZz1mdW5jdGlvbihhKXt2YXIgYj1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO2IuY2xhc3NMaXN0LmFkZChcInZleC1kaWFsb2ctYnV0dG9uc1wiKTtmb3IodmFyIGM9MDtjPGEubGVuZ3RoO2MrKyl7dmFyIGQ9YVtjXSxlPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7ZS50eXBlPWQudHlwZSxlLnRleHRDb250ZW50PWQudGV4dCxlLmNsYXNzTmFtZT1kLmNsYXNzTmFtZSxlLmNsYXNzTGlzdC5hZGQoXCJ2ZXgtZGlhbG9nLWJ1dHRvblwiKSwwPT09Yz9lLmNsYXNzTGlzdC5hZGQoXCJ2ZXgtZmlyc3RcIik6Yz09PWEubGVuZ3RoLTEmJmUuY2xhc3NMaXN0LmFkZChcInZleC1sYXN0XCIpLGZ1bmN0aW9uKGEpe2UuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsZnVuY3Rpb24oYil7YS5jbGljayYmYS5jbGljay5jYWxsKHRoaXMsYil9LmJpbmQodGhpcykpfS5iaW5kKHRoaXMpKGQpLGIuYXBwZW5kQ2hpbGQoZSl9cmV0dXJuIGJ9LGg9ZnVuY3Rpb24oYSl7dmFyIGI9e25hbWU6XCJkaWFsb2dcIixvcGVuOmZ1bmN0aW9uKGIpe3ZhciBjPU9iamVjdC5hc3NpZ24oe30sdGhpcy5kZWZhdWx0T3B0aW9ucyxiKTtjLnVuc2FmZU1lc3NhZ2UmJiFjLm1lc3NhZ2U/Yy5tZXNzYWdlPWMudW5zYWZlTWVzc2FnZTpjLm1lc3NhZ2UmJihjLm1lc3NhZ2U9YS5fZXNjYXBlSHRtbChjLm1lc3NhZ2UpKTt2YXIgZD1jLnVuc2FmZUNvbnRlbnQ9ZihjKSxlPWEub3BlbihjKSxoPWMuYmVmb3JlQ2xvc2UmJmMuYmVmb3JlQ2xvc2UuYmluZChlKTtpZihlLm9wdGlvbnMuYmVmb3JlQ2xvc2U9ZnVuY3Rpb24oKXt2YXIgYT0haHx8aCgpO3JldHVybiBhJiZjLmNhbGxiYWNrKHRoaXMudmFsdWV8fCExKSxhfS5iaW5kKGUpLGQuYXBwZW5kQ2hpbGQoZy5jYWxsKGUsYy5idXR0b25zKSksZS5mb3JtPWQsZC5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsYy5vblN1Ym1pdC5iaW5kKGUpKSxjLmZvY3VzRmlyc3RJbnB1dCl7dmFyIGk9ZS5jb250ZW50RWwucXVlcnlTZWxlY3RvcihcImJ1dHRvbiwgaW5wdXQsIHNlbGVjdCwgdGV4dGFyZWFcIik7aSYmaS5mb2N1cygpfXJldHVybiBlfSxhbGVydDpmdW5jdGlvbihhKXtyZXR1cm5cInN0cmluZ1wiPT10eXBlb2YgYSYmKGE9e21lc3NhZ2U6YX0pLGE9T2JqZWN0LmFzc2lnbih7fSx0aGlzLmRlZmF1bHRPcHRpb25zLHRoaXMuZGVmYXVsdEFsZXJ0T3B0aW9ucyxhKSx0aGlzLm9wZW4oYSl9LGNvbmZpcm06ZnVuY3Rpb24oYSl7aWYoXCJvYmplY3RcIiE9dHlwZW9mIGF8fFwiZnVuY3Rpb25cIiE9dHlwZW9mIGEuY2FsbGJhY2spdGhyb3cgbmV3IEVycm9yKFwiZGlhbG9nLmNvbmZpcm0ob3B0aW9ucykgcmVxdWlyZXMgb3B0aW9ucy5jYWxsYmFjay5cIik7cmV0dXJuIGE9T2JqZWN0LmFzc2lnbih7fSx0aGlzLmRlZmF1bHRPcHRpb25zLHRoaXMuZGVmYXVsdENvbmZpcm1PcHRpb25zLGEpLHRoaXMub3BlbihhKX0scHJvbXB0OmZ1bmN0aW9uKGIpe2lmKFwib2JqZWN0XCIhPXR5cGVvZiBifHxcImZ1bmN0aW9uXCIhPXR5cGVvZiBiLmNhbGxiYWNrKXRocm93IG5ldyBFcnJvcihcImRpYWxvZy5wcm9tcHQob3B0aW9ucykgcmVxdWlyZXMgb3B0aW9ucy5jYWxsYmFjay5cIik7dmFyIGM9T2JqZWN0LmFzc2lnbih7fSx0aGlzLmRlZmF1bHRPcHRpb25zLHRoaXMuZGVmYXVsdFByb21wdE9wdGlvbnMpLGQ9e3Vuc2FmZU1lc3NhZ2U6JzxsYWJlbCBmb3I9XCJ2ZXhcIj4nK2EuX2VzY2FwZUh0bWwoYi5sYWJlbHx8Yy5sYWJlbCkrXCI8L2xhYmVsPlwiLGlucHV0Oic8aW5wdXQgbmFtZT1cInZleFwiIHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJ2ZXgtZGlhbG9nLXByb21wdC1pbnB1dFwiIHBsYWNlaG9sZGVyPVwiJythLl9lc2NhcGVIdG1sKGIucGxhY2Vob2xkZXJ8fGMucGxhY2Vob2xkZXIpKydcIiB2YWx1ZT1cIicrYS5fZXNjYXBlSHRtbChiLnZhbHVlfHxjLnZhbHVlKSsnXCIgLz4nfTtiPU9iamVjdC5hc3NpZ24oYyxkLGIpO3ZhciBlPWIuY2FsbGJhY2s7cmV0dXJuIGIuY2FsbGJhY2s9ZnVuY3Rpb24oYSl7aWYoXCJvYmplY3RcIj09dHlwZW9mIGEpe3ZhciBiPU9iamVjdC5rZXlzKGEpO2E9Yi5sZW5ndGg/YVtiWzBdXTpcIlwifWUoYSl9LHRoaXMub3BlbihiKX19O3JldHVybiBiLmJ1dHRvbnM9e1lFUzp7dGV4dDpcIk9LXCIsdHlwZTpcInN1Ym1pdFwiLGNsYXNzTmFtZTpcInZleC1kaWFsb2ctYnV0dG9uLXByaW1hcnlcIixjbGljazpmdW5jdGlvbigpe3RoaXMudmFsdWU9ITB9fSxOTzp7dGV4dDpcIkNhbmNlbFwiLHR5cGU6XCJidXR0b25cIixjbGFzc05hbWU6XCJ2ZXgtZGlhbG9nLWJ1dHRvbi1zZWNvbmRhcnlcIixjbGljazpmdW5jdGlvbigpe3RoaXMudmFsdWU9ITEsdGhpcy5jbG9zZSgpfX19LGIuZGVmYXVsdE9wdGlvbnM9e2NhbGxiYWNrOmZ1bmN0aW9uKCl7fSxhZnRlck9wZW46ZnVuY3Rpb24oKXt9LG1lc3NhZ2U6XCJcIixpbnB1dDpcIlwiLGJ1dHRvbnM6W2IuYnV0dG9ucy5ZRVMsYi5idXR0b25zLk5PXSxzaG93Q2xvc2VCdXR0b246ITEsb25TdWJtaXQ6ZnVuY3Rpb24oYSl7cmV0dXJuIGEucHJldmVudERlZmF1bHQoKSx0aGlzLm9wdGlvbnMuaW5wdXQmJih0aGlzLnZhbHVlPWUodGhpcy5mb3JtLHtoYXNoOiEwfSkpLHRoaXMuY2xvc2UoKX0sZm9jdXNGaXJzdElucHV0OiEwfSxiLmRlZmF1bHRBbGVydE9wdGlvbnM9e2J1dHRvbnM6W2IuYnV0dG9ucy5ZRVNdfSxiLmRlZmF1bHRQcm9tcHRPcHRpb25zPXtsYWJlbDpcIlByb21wdDpcIixwbGFjZWhvbGRlcjpcIlwiLHZhbHVlOlwiXCJ9LGIuZGVmYXVsdENvbmZpcm1PcHRpb25zPXt9LGJ9O2IuZXhwb3J0cz1ofSx7ZG9taWZ5OjEsXCJmb3JtLXNlcmlhbGl6ZVwiOjJ9XX0se30sWzNdKSgzKX0pfSkuY2FsbCh0aGlzLFwidW5kZWZpbmVkXCIhPXR5cGVvZiBnbG9iYWw/Z2xvYmFsOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6e30pfSx7ZG9taWZ5OjIsXCJmb3JtLXNlcmlhbGl6ZVwiOjR9XSw2OltmdW5jdGlvbihhLGIsYyl7dmFyIGQ9YShcIi4vdmV4XCIpO2QucmVnaXN0ZXJQbHVnaW4oYShcInZleC1kaWFsb2dcIikpLGIuZXhwb3J0cz1kfSx7XCIuL3ZleFwiOjcsXCJ2ZXgtZGlhbG9nXCI6NX1dLDc6W2Z1bmN0aW9uKGEsYixjKXthKFwiY2xhc3NsaXN0LXBvbHlmaWxsXCIpLGEoXCJlczYtb2JqZWN0LWFzc2lnblwiKS5wb2x5ZmlsbCgpO3ZhciBkPWEoXCJkb21pZnlcIiksZT1mdW5jdGlvbihhKXtpZihcInVuZGVmaW5lZFwiIT10eXBlb2YgYSl7dmFyIGI9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtyZXR1cm4gYi5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShhKSksYi5pbm5lckhUTUx9cmV0dXJuXCJcIn0sZj1mdW5jdGlvbihhLGIpe2lmKFwic3RyaW5nXCI9PXR5cGVvZiBiJiYwIT09Yi5sZW5ndGgpZm9yKHZhciBjPWIuc3BsaXQoXCIgXCIpLGQ9MDtkPGMubGVuZ3RoO2QrKyl7dmFyIGU9Y1tkXTtlLmxlbmd0aCYmYS5jbGFzc0xpc3QuYWRkKGUpfX0sZz1mdW5jdGlvbigpe3ZhciBhPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiksYj17V2Via2l0QW5pbWF0aW9uOlwid2Via2l0QW5pbWF0aW9uRW5kXCIsTW96QW5pbWF0aW9uOlwiYW5pbWF0aW9uZW5kXCIsT0FuaW1hdGlvbjpcIm9hbmltYXRpb25lbmRcIixtc0FuaW1hdGlvbjpcIk1TQW5pbWF0aW9uRW5kXCIsYW5pbWF0aW9uOlwiYW5pbWF0aW9uZW5kXCJ9O2Zvcih2YXIgYyBpbiBiKWlmKHZvaWQgMCE9PWEuc3R5bGVbY10pcmV0dXJuIGJbY107cmV0dXJuITF9KCksaD17dmV4OlwidmV4XCIsY29udGVudDpcInZleC1jb250ZW50XCIsb3ZlcmxheTpcInZleC1vdmVybGF5XCIsY2xvc2U6XCJ2ZXgtY2xvc2VcIixjbG9zaW5nOlwidmV4LWNsb3NpbmdcIixvcGVuOlwidmV4LW9wZW5cIn0saT17fSxqPTEsaz0hMSxsPXtvcGVuOmZ1bmN0aW9uKGEpe3ZhciBiPWZ1bmN0aW9uKGEpe2NvbnNvbGUud2FybignVGhlIFwiJythKydcIiBwcm9wZXJ0eSBpcyBkZXByZWNhdGVkIGluIHZleCAzLiBVc2UgQ1NTIGNsYXNzZXMgYW5kIHRoZSBhcHByb3ByaWF0ZSBcIkNsYXNzTmFtZVwiIG9wdGlvbnMsIGluc3RlYWQuJyksY29uc29sZS53YXJuKFwiU2VlIGh0dHA6Ly9naXRodWIuaHVic3BvdC5jb20vdmV4L2FwaS9hZHZhbmNlZC8jb3B0aW9uc1wiKX07YS5jc3MmJmIoXCJjc3NcIiksYS5vdmVybGF5Q1NTJiZiKFwib3ZlcmxheUNTU1wiKSxhLmNvbnRlbnRDU1MmJmIoXCJjb250ZW50Q1NTXCIpLGEuY2xvc2VDU1MmJmIoXCJjbG9zZUNTU1wiKTt2YXIgYz17fTtjLmlkPWorKyxpW2MuaWRdPWMsYy5pc09wZW49ITAsYy5jbG9zZT1mdW5jdGlvbigpe2Z1bmN0aW9uIGEoYSl7cmV0dXJuXCJub25lXCIhPT1kLmdldFByb3BlcnR5VmFsdWUoYStcImFuaW1hdGlvbi1uYW1lXCIpJiZcIjBzXCIhPT1kLmdldFByb3BlcnR5VmFsdWUoYStcImFuaW1hdGlvbi1kdXJhdGlvblwiKX1pZighdGhpcy5pc09wZW4pcmV0dXJuITA7dmFyIGI9dGhpcy5vcHRpb25zO2lmKGsmJiFiLmVzY2FwZUJ1dHRvbkNsb3NlcylyZXR1cm4hMTt2YXIgYz1mdW5jdGlvbigpe3JldHVybiFiLmJlZm9yZUNsb3NlfHxiLmJlZm9yZUNsb3NlLmNhbGwodGhpcyl9LmJpbmQodGhpcykoKTtpZihjPT09ITEpcmV0dXJuITE7dGhpcy5pc09wZW49ITE7dmFyIGQ9d2luZG93LmdldENvbXB1dGVkU3R5bGUodGhpcy5jb250ZW50RWwpLGU9YShcIlwiKXx8YShcIi13ZWJraXQtXCIpfHxhKFwiLW1vei1cIil8fGEoXCItby1cIiksZj1mdW5jdGlvbiBqKCl7dGhpcy5yb290RWwucGFyZW50Tm9kZSYmKHRoaXMucm9vdEVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZyxqKSxkZWxldGUgaVt0aGlzLmlkXSx0aGlzLnJvb3RFbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMucm9vdEVsKSxiLmFmdGVyQ2xvc2UmJmIuYWZ0ZXJDbG9zZS5jYWxsKHRoaXMpLDA9PT1PYmplY3Qua2V5cyhpKS5sZW5ndGgmJmRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZShoLm9wZW4pKX0uYmluZCh0aGlzKTtyZXR1cm4gZyYmZT8odGhpcy5yb290RWwuYWRkRXZlbnRMaXN0ZW5lcihnLGYpLHRoaXMucm9vdEVsLmNsYXNzTGlzdC5hZGQoaC5jbG9zaW5nKSk6ZigpLCEwfSxcInN0cmluZ1wiPT10eXBlb2YgYSYmKGE9e2NvbnRlbnQ6YX0pLGEudW5zYWZlQ29udGVudCYmIWEuY29udGVudD9hLmNvbnRlbnQ9YS51bnNhZmVDb250ZW50OmEuY29udGVudCYmKGEuY29udGVudD1lKGEuY29udGVudCkpO3ZhciBtPWMub3B0aW9ucz1PYmplY3QuYXNzaWduKHt9LGwuZGVmYXVsdE9wdGlvbnMsYSksbj1jLnJvb3RFbD1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO24uY2xhc3NMaXN0LmFkZChoLnZleCksZihuLG0uY2xhc3NOYW1lKTt2YXIgbz1jLm92ZXJsYXlFbD1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO28uY2xhc3NMaXN0LmFkZChoLm92ZXJsYXkpLGYobyxtLm92ZXJsYXlDbGFzc05hbWUpLG0ub3ZlcmxheUNsb3Nlc09uQ2xpY2smJm8uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsZnVuY3Rpb24oYSl7YS50YXJnZXQ9PT1vJiZjLmNsb3NlKCl9KSxuLmFwcGVuZENoaWxkKG8pO3ZhciBwPWMuY29udGVudEVsPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7aWYocC5jbGFzc0xpc3QuYWRkKGguY29udGVudCksZihwLG0uY29udGVudENsYXNzTmFtZSkscC5hcHBlbmRDaGlsZChtLmNvbnRlbnQgaW5zdGFuY2VvZiB3aW5kb3cuTm9kZT9tLmNvbnRlbnQ6ZChtLmNvbnRlbnQpKSxuLmFwcGVuZENoaWxkKHApLG0uc2hvd0Nsb3NlQnV0dG9uKXt2YXIgcT1jLmNsb3NlRWw9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtxLmNsYXNzTGlzdC5hZGQoaC5jbG9zZSksZihxLG0uY2xvc2VDbGFzc05hbWUpLHEuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsYy5jbG9zZS5iaW5kKGMpKSxwLmFwcGVuZENoaWxkKHEpfXJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKG0uYXBwZW5kTG9jYXRpb24pLmFwcGVuZENoaWxkKG4pLG0uYWZ0ZXJPcGVuJiZtLmFmdGVyT3Blbi5jYWxsKGMpLGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZChoLm9wZW4pLGN9LGNsb3NlOmZ1bmN0aW9uKGEpe3ZhciBiO2lmKGEuaWQpYj1hLmlkO2Vsc2V7aWYoXCJzdHJpbmdcIiE9dHlwZW9mIGEpdGhyb3cgbmV3IFR5cGVFcnJvcihcImNsb3NlIHJlcXVpcmVzIGEgdmV4IG9iamVjdCBvciBpZCBzdHJpbmdcIik7Yj1hfXJldHVybiEhaVtiXSYmaVtiXS5jbG9zZSgpfSxjbG9zZVRvcDpmdW5jdGlvbigpe3ZhciBhPU9iamVjdC5rZXlzKGkpO3JldHVybiEhYS5sZW5ndGgmJmlbYVthLmxlbmd0aC0xXV0uY2xvc2UoKX0sY2xvc2VBbGw6ZnVuY3Rpb24oKXtmb3IodmFyIGEgaW4gaSl0aGlzLmNsb3NlKGEpO3JldHVybiEwfSxnZXRBbGw6ZnVuY3Rpb24oKXtyZXR1cm4gaX0sZ2V0QnlJZDpmdW5jdGlvbihhKXtyZXR1cm4gaVthXX19O3dpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIixmdW5jdGlvbihhKXsyNz09PWEua2V5Q29kZSYmKGs9ITAsbC5jbG9zZVRvcCgpLGs9ITEpfSksd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJwb3BzdGF0ZVwiLGZ1bmN0aW9uKCl7bC5kZWZhdWx0T3B0aW9ucy5jbG9zZUFsbE9uUG9wU3RhdGUmJmwuY2xvc2VBbGwoKX0pLGwuZGVmYXVsdE9wdGlvbnM9e2NvbnRlbnQ6XCJcIixzaG93Q2xvc2VCdXR0b246ITAsZXNjYXBlQnV0dG9uQ2xvc2VzOiEwLG92ZXJsYXlDbG9zZXNPbkNsaWNrOiEwLGFwcGVuZExvY2F0aW9uOlwiYm9keVwiLGNsYXNzTmFtZTpcIlwiLG92ZXJsYXlDbGFzc05hbWU6XCJcIixjb250ZW50Q2xhc3NOYW1lOlwiXCIsY2xvc2VDbGFzc05hbWU6XCJcIixjbG9zZUFsbE9uUG9wU3RhdGU6ITB9LE9iamVjdC5kZWZpbmVQcm9wZXJ0eShsLFwiX2VzY2FwZUh0bWxcIix7Y29uZmlndXJhYmxlOiExLGVudW1lcmFibGU6ITEsd3JpdGFibGU6ITEsdmFsdWU6ZX0pLGwucmVnaXN0ZXJQbHVnaW49ZnVuY3Rpb24oYSxiKXt2YXIgYz1hKGwpLGQ9Ynx8Yy5uYW1lO2lmKGxbZF0pdGhyb3cgbmV3IEVycm9yKFwiUGx1Z2luIFwiK2IrXCIgaXMgYWxyZWFkeSByZWdpc3RlcmVkLlwiKTtsW2RdPWN9LGIuZXhwb3J0cz1sfSx7XCJjbGFzc2xpc3QtcG9seWZpbGxcIjoxLGRvbWlmeToyLFwiZXM2LW9iamVjdC1hc3NpZ25cIjozfV19LHt9LFs2XSkoNil9KTtcbiJdfQ==
