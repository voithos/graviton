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
            this.drawInteraction();
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
            this.controls.innerHTML = '\n            <menuitem id="playbtn">\n                <img src="assets/play.svg" alt="Start simulation">\n            </menuitem>\n            <menuitem id="pausebtn" style="display: none;">\n                <img src="assets/pause.svg" alt="Stop simulation">\n            </menuitem>\n            <menuitem id="trailoffbtn">\n                <img src="assets/trail_off.svg" alt="Toggle trails">\n            </menuitem>\n            <menuitem id="trailonbtn" style="display: none;">\n                <img src="assets/trail_on.svg" alt="Toggle trails">\n            </menuitem>\n            <menuitem id="helpbtn">\n                <img src="assets/help.svg" alt="Help">\n            </menuitem>\n            ';

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
        key: 'drawInteraction',
        value: function drawInteraction() {
            if (this.interaction.started) {
                this.gfx.drawReticleLine(this.interaction.body, this.interaction.previous);
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

},{"../util/random":14,"../vendor/vex":16,"./events":4,"./gfx":5,"./sim":6,"./timer":7}],3:[function(require,module,exports){
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
    HELPBTN: 2004
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
    }]);

    return GtGfx;
})(); // end graviton/gfx

exports.default = GtGfx;

},{}],6:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        * graviton/sim -- The gravitational simulator
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        */

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _log = require('../util/log');

var _log2 = _interopRequireDefault(_log);

var _body = require('./body');

var _body2 = _interopRequireDefault(_body);

var _tree = require('./tree');

var _tree2 = _interopRequireDefault(_tree);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GtSim = (function () {
    function GtSim(args) {
        _classCallCheck(this, GtSim);

        args = args || {};

        this.options = {};
        this.bodies = [];
        this.tree = new _tree2.default(args.width, args.height);
        this.time = 0;

        // Temporary workspace
        this.D = {};

        this.options.G = args.G || 6.67384 * Math.pow(10, -11); // Gravitational constant
        this.options.multiplier = args.multiplier || 1500; // Timestep
        this.options.scatterLimit = args.scatterLimit || 10000;
    }

    _createClass(GtSim, [{
        key: 'step',
        value: function step(elapsed) {
            for (var i = 0; i < this.bodies.length; i++) {
                var body = this.bodies[i];
                this.calculateNewPosition(body, i, elapsed * this.options.multiplier);
                i = this.removeScattered(body, i);
            }

            this.time += elapsed; // Increment runtime
        }
    }, {
        key: 'calculateNewPosition',
        value: function calculateNewPosition(body, index, deltaT) {
            var netFx = 0;
            var netFy = 0;

            // Iterate through all bodies and sum the forces exerted
            for (var i = 0; i < this.bodies.length; i++) {
                var attractor = this.bodies[i];
                if (i !== index) {
                    // Get the distance and position deltas
                    this.calculateDistance(body, attractor);

                    // Calculate force using Newtonian gravity, separate out into x and y components
                    var F = this.options.G * body.mass * attractor.mass / Math.pow(this.D.r, 2);
                    var Fx = F * (this.D.dx / this.D.r);
                    var Fy = F * (this.D.dy / this.D.r);

                    netFx += Fx;
                    netFy += Fy;
                }
            }

            // Calculate accelerations
            var ax = netFx / body.mass;
            var ay = netFy / body.mass;

            // Calculate new velocities, normalized by the 'time' interval
            body.velX += deltaT * ax;
            body.velY += deltaT * ay;

            // Calculate new positions after timestep deltaT
            body.x += deltaT * body.velX;
            body.y += deltaT * body.velY;
        }
    }, {
        key: 'calculateDistance',
        value: function calculateDistance(body, other) {
            // Calculate the change in position along the two dimensions
            this.D.dx = other.x - body.x;
            this.D.dy = other.y - body.y;

            // Obtain the distance between the objects (hypotenuse)
            this.D.r = Math.sqrt(Math.pow(this.D.dx, 2) + Math.pow(this.D.dy, 2));
        }
    }, {
        key: 'removeScattered',
        value: function removeScattered(body, index) {
            if (body.x > this.options.scatterLimit || body.x < -this.options.scatterLimit || body.y > this.options.scatterLimit || body.y < -this.options.scatterLimit) {
                // Remove from body collection
                // TODO: Implement for tree.
                this.bodies.splice(index, 1);
                return index - 1;
            }
            return index;
        }
    }, {
        key: 'addNewBody',
        value: function addNewBody(args) {
            var body = new _body2.default(args);
            this.bodies.push(body);
            this.tree.addBody(body);

            return body;
        }
    }, {
        key: 'removeBody',
        value: function removeBody(targetBody) {
            for (var i = 0; i < this.bodies.length; i++) {
                var body = this.bodies[i];
                if (body === targetBody) {
                    this.bodies.splice(i, 1);
                    break;
                }
            }
            this.resetTree();
        }
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
    }, {
        key: 'clear',
        value: function clear() {
            this.bodies.length = 0; // Remove all bodies from collection
            this.resetTree();
        }
    }, {
        key: 'resetTree',
        value: function resetTree() {
            this.tree.clear();
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.bodies[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var body = _step.value;

                    this.tree.addBody(body);
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
    }]);

    return GtSim;
})(); // end graviton/sim

exports.default = GtSim;

},{"../util/log":13,"./body":3,"./tree":8}],7:[function(require,module,exports){
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
    function GtTreeNode(startX, startY, width, height) {
        _classCallCheck(this, GtTreeNode);

        this.startX = startX;
        this.startY = startY;
        this.width = width;
        this.height = height;

        // Convenience center points.
        this.halfWidth = width / 2;
        this.halfHeight = height / 2;

        this.midX = this.startX + this.halfWidth;
        this.midY = this.startY + this.halfHeight;

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

            if (!this.children[quadrant]) {
                this.children[quadrant] = body;
            } else {
                var existing = this.children[quadrant];
                var quadX = existing.x > this.midX ? this.midX : this.startX;
                var quadY = existing.y > this.midY ? this.midY : this.startY;
                var node = new GtTreeNode(quadX, quadY, this.halfWidth, this.halfHeight);

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
        _classCallCheck(this, GtTree);

        this.width = width;
        this.height = height;
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
                this.root = new GtTreeNode(0, 0, this.width, this.height);
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

},{"./graviton":1,"./polyfills":10,"./vendor/jscolor":15,"./vendor/vex":16}],10:[function(require,module,exports){
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
 * log -- Logging functions
 */
exports.default = {
    config: {
        logLevel: null
    },

    write: function write(message, level) {
        if (typeof console !== 'undefined') {
            var now = new Date();
            var stamp = now.getFullYear() + '-' + now.getMonth() + '-' + now.getDate() + 'T' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + ':' + now.getMilliseconds();

            message = stamp + ' ' + message;

            level = (level || this.config.logLevel || 'debug').toLowerCase();

            // Write to console -- currently, `log`, `debug`, `info`, `warn`, and `error`
            // are available
            /* eslint-disable no-console */
            if (console[level]) {
                console[level](message);
            } else {
                throw Error('Log level does not exist.');
            }
            /* eslint-enable no-console */
        }
    },
    setLevel: function setLevel(level) {
        level = level.toLowerCase();

        if (console[level]) {
            // eslint-disable-line no-console
            this.config.logLevel = level;
        } else {
            throw Error('Log level does not exist.');
        }
    }
};

},{}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZ3Jhdml0b24uanMiLCJzcmMvZ3Jhdml0b24vYXBwLmpzIiwic3JjL2dyYXZpdG9uL2JvZHkuanMiLCJzcmMvZ3Jhdml0b24vZXZlbnRzLmpzIiwic3JjL2dyYXZpdG9uL2dmeC5qcyIsInNyYy9ncmF2aXRvbi9zaW0uanMiLCJzcmMvZ3Jhdml0b24vdGltZXIuanMiLCJzcmMvZ3Jhdml0b24vdHJlZS5qcyIsInNyYy9tYWluLmpzIiwic3JjL3BvbHlmaWxscy5qcyIsInNyYy91dGlsL2NvbG9ycy5qcyIsInNyYy91dGlsL2Vudi5qcyIsInNyYy91dGlsL2xvZy5qcyIsInNyYy91dGlsL3JhbmRvbS5qcyIsInNyYy92ZW5kb3IvanNjb2xvci5qcyIsInNyYy92ZW5kb3IvdmV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7O2tCQ2FlLEVBQUUsR0FBRyxlQUFPLEVBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUNEUixLQUFLO0FBQ3RCLGFBRGlCLEtBQUssR0FDQzs4QkFETixLQUFLOztZQUNWLElBQUkseURBQUcsRUFBRTs7QUFDakIsWUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7O0FBRWpCLFlBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ2xCLFlBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDOztBQUVqQixZQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztBQUN0QixZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQzs7QUFFckIsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7QUFDbkIsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7QUFDaEIsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7O0FBRWhCLFlBQUksQ0FBQyxPQUFPLEdBQUcs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RUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7O0FBRVAsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTs7QUFFUCxTQUFLLEVBQUUsRUFBRTtBQUNULFNBQUssRUFBRSxFQUFFO0FBQ1QsU0FBSyxFQUFFLEVBQUU7QUFDVCxTQUFLLEVBQUUsR0FBRztBQUNWLFNBQUssRUFBRSxHQUFHO0FBQ1YsU0FBSyxFQUFFLEdBQUc7QUFDVixTQUFLLEVBQUUsR0FBRztBQUNWLFNBQUssRUFBRSxHQUFHO0FBQ1YsU0FBSyxFQUFFLEdBQUc7O0FBRVYsa0JBQWMsRUFBRSxHQUFHOztBQUVuQixlQUFXLEVBQUUsQ0FBQztBQUNkLFNBQUssRUFBRSxDQUFDO0FBQ1IsV0FBTyxFQUFFLEVBQUU7QUFDWCxXQUFPLEVBQUUsRUFBRTtBQUNYLFVBQU0sRUFBRSxFQUFFO0FBQ1YsU0FBSyxFQUFFLEVBQUU7QUFDVCxTQUFLLEVBQUUsRUFBRTtBQUNU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QUNELFNBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQSxHQUFFLENBQUM7OztBQUFDLEFBR3hCLFNBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFO0FBQzNCLFVBQUksRUFBRSxHQUFHLENBQ1IsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUNMLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQ2pCLENBQUM7TUFDRixNQUFNO0FBQ04sVUFBSSxFQUFFLEdBQUcsQ0FDUixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FDeEIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUNyRixFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQ04sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUNwQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FDaEcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxBQUFDLENBQ2pFLENBQUM7TUFDRjs7QUFFRCxTQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDZCxTQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDZCxTQUFJLGFBQWEsR0FBRyxPQUFPLENBQUMsS0FBSyxHQUFHLE9BQU8sR0FBRyxVQUFVLENBQUM7QUFDekQsU0FBSSxjQUFjLEdBQ2pCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFB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QUFJLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxBQUFDLEVBQ3hDLENBQUMsS0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBSSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQUFBQyxFQUN4QyxDQUFDLEtBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEFBQUMsQ0FDeEMsQ0FBQzs7QUFFRixTQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ3hCOzs7Ozs7QUFBQyxBQU9GLFFBQUksQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUU7O0FBQ3hDLFNBQUksQ0FBQyxLQUFLLElBQUksRUFBRTtBQUNmLFVBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQUUsY0FBTyxLQUFLLENBQUM7T0FBRTtBQUMvQixPQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNsQztBQUNELFNBQUksQ0FBQyxLQUFLLElBQUksRUFBRTtBQUNmLFVBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQUUsY0FBTyxLQUFLLENBQUM7T0FBRTtBQUMvQixPQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNsQztBQUNELFNBQUksQ0FBQyxLQUFLLElBQUksRUFBRTtBQUNmLFVBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQUUsY0FBTyxLQUFLLENBQUM7T0FBRTtBQUMvQixPQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNsQzs7QUFFRCxTQUFJLEdBQUcsR0FBRyxPQUFPLENBQ2hCLENBQUMsS0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQzFCLENBQUMsS0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQzFCLENBQUMsS0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQzFCLENBQUM7QUFDRixTQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLEVBQUU7QUFDcEIsVUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ2pEO0FBQ0QsU0FBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQ2pCLFVBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDOUY7QUFDRCxTQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7O0FBQUMsQUFHOUYsU0FBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekQsU0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckIsU0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckIsU0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRXJCLFNBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDeEIsQ0FBQzs7QUFHRixRQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsR0FBRyxFQUFFLEtBQUssRUFBRTtBQUN2QyxTQUFJLENBQUMsQ0FBQztBQUNOLFNBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsc0NBQXNDLENBQUMsRUFBRTs7OztBQUkxRCxVQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFOztBQUV0QixXQUFJLENBQUMsT0FBTyxDQUNYLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsRUFBQyxFQUFFLENBQUMsRUFDN0IsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxFQUFDLEVBQUUsQ0FBQyxFQUM3QixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FB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QUMsS0FBSyxDQUFDO0FBQ3hDLGVBQVEsRUFBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztBQUN4QyxVQUFHLEVBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFDbkMsV0FBSSxFQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDO0FBQUEsT0FDckMsQ0FBQzs7QUFFRixTQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDbEQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDNUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDakQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDakQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDakQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDakQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDOUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDNUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRTVDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNuRCxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM1QyxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqRCxTQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNyRCxTQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNyRCxTQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNwRCxTQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM1QyxTQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFNUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDNUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7O0FBRTNDLFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcs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QUMsV0FBVyxJQUFFLE9BQU8sTUFBTSxHQUFDLE1BQU0sR0FBQyxXQUFXLElBQUUsT0FBTyxNQUFNLEdBQUMsTUFBTSxHQUFDLFdBQVcsSUFBRSxPQUFPLElBQUksR0FBQyxJQUFJLEdBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUMsQ0FBQyxFQUFFLENBQUE7R0FBQztDQUFDLENBQUEsQ0FBQyxZQUFVO0FBQUMsTUFBSSxDQUFDLENBQUMsT0FBTyxDQUFBLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsYUFBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLFVBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUM7QUFBQyxZQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDO0FBQUMsY0FBSSxDQUFDLEdBQUMsVUFBVSxJQUFFLE9BQU8sT0FBTyxJQUFFLE9BQU8sQ0FBQyxJQUFHLENBQUMsQ0FBQyxJQUFFLENBQUMsRUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsRUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsR0FBQyxDQUFDLEdBQUMsR0FBRyxDQUFDLENBQUMsT0FBTSxDQUFDLENBQUMsSUFBSSxHQUFDLGtCQUFrQixFQUFDLENBQUMsQ0FBQSxDQUFBO1NBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUMsT0FBTyxFQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxVQUFTLENBQUMsRUFBQztBQUFDLGNBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FB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QUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU07Z0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDO0FBQUcsZUFBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLENBQUMsS0FBRyxDQUFDLENBQUMsS0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLENBQUM7cUJBQU0sRUFBRSxDQUFDLEdBQUMsQ0FBQyxFQUFFLENBQUMsSUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQTtXQUFDLEVBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxZQUFVO0FBQUMsZ0JBQUksQ0FBQztnQkFBQyxDQUFDO2dCQUFDLENBQUMsR0FBQyxTQUFTO2dCQUFDLENBQUMsR0FBQyxDQUFDO2dCQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTTtnQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUM7QUFBRyxtQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEtBQUcsQ0FBQyxDQUFDO0FBQUUsb0JBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLENBQUMsQ0FBQztlQUFBO3FCQUFNLEVBQUUsQ0FBQyxHQUFDLENBQUMsRUFBRSxDQUFDLElBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUE7V0FBQyxFQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUMsVUFBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsYUFBQyxJQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsS0FBRyxDQUFDLENBQUMsSUFBRSxRQUFRLEdBQUMsQ0FBQyxLQUFHLENBQUMsQ0FBQyxJQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxLQUFHLENBQUMsQ0FBQyxJQUFFLENBQUMsS0FBRyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUE7V0FBQyxFQUFDLENBQUMsQ0FBQyxRQUFRLEdBQUMsWUFBVTtBQUFDLG1CQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7V0FBQyxFQUFDLENBQUMsQ0FBQyxjQUFjLENBQUEsRUFBQztBQUFDLGdCQUFJLENBQUMsR0FBQyxFQUFDLEdBQUcsRUFBQyxDQUFDLEVBQUMsVUFBVSxFQUFDLENBQUMsQ0FBQyxFQUFDLFlBQVksRUFBQyxDQUFDLENBQUMsRUFBQyxDQUFDLElBQUc7QUFBQyxlQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUE7YUFBQyxDQUFBLE9BQU0sQ0FBQyxFQUFDO0FBQUMsZUFBQyxDQUFDLE1BQU0sS0FBRyxDQUFDLFVBQVUsS0FBRyxDQUFDLENBQUMsVUFBVSxHQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLENBQUE7YUFBQztXQUFDLE1BQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixJQUFFLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUE7U0FBQztPQUFDLENBQUEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUEsQUFBQyxDQUFBO0tBQUMsRUFBQyxFQUFFLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxVQUFTLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsZUFBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLFlBQUcsUUFBUSxJQUFFLE9BQU8sQ0FBQyxFQUFDLE1BQU0sSUFBSSxTQUFTLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLEtBQUcsQ0FBQyxHQUFDLFFBQVEsQ0FBQSxBQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsQ0FBQyxFQUFDLE9BQU8sQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsTUFBTSxJQUFFLENBQUMsRUFBQztBQUFDLGNBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxHQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQTtTQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsUUFBUTtZQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUksQ0FBQyxDQUFDLFNBQVMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEVBQUU7QUFBRSxXQUFDLEdBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztTQUFBLElBQUcsQ0FBQyxDQUFDLFVBQVUsSUFBRSxDQUFDLENBQUMsU0FBUyxFQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsc0JBQXNCLEVBQUUsRUFBQyxDQUFDLENBQUMsVUFBVTtBQUFFLFdBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztTQUFBLE9BQU8sQ0FBQyxDQUFBO09BQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1VBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsSUFBRSxPQUFPLFFBQVEsS0FBRyxDQUFDLEdBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsRUFBQyxDQUFDLENBQUMsU0FBUyxHQUFDLG9FQUFvRSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQyxDQUFBLEFBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxFQUFDLE1BQU0sRUFBQyxDQUFDLENBQUMsRUFBQyxZQUFZLEVBQUMsYUFBYSxDQUFDLEVBQUMsRUFBRSxFQUFDLENBQUMsQ0FBQyxFQUFDLGdCQUFnQixFQUFDLGtCQUFrQixDQUFDLEVBQUMsR0FBRyxFQUFDLENBQUMsQ0FBQyxFQUFDLGtDQUFrQyxFQUFDLHFCQUFxQixDQUFDLEVBQUMsUUFBUSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyxRQUFRLEVBQUMsUUFBUSxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUMsRUFBRSxFQUFDLEVBQUUsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBQyxDQUFDLENBQUMsRUFBRSxHQUFDLENBQUMsQ0FBQyxFQUFDLG9CQUFvQixFQUFDLHVCQUF1QixDQUFDLEVBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsUUFBUSxHQUFDLENBQUMsQ0FBQyxFQUFDLDhCQUE4QixFQUFDLFdBQVcsQ0FBQyxFQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUMsQ0FBQyxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsUUFBUSxHQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsRUFBQyxTQUFTLEVBQUMsVUFBVSxDQUFDLEVBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUMsd0RBQXdELEVBQUMsUUFBUSxDQUFDLENBQUE7S0FBQyxFQUFDLEVBQUUsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLFVBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxrQkFBWSxDQUFDO0FBQUEsZUFBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLFlBQUcsS0FBSyxDQUFDLEtBQUcsQ0FBQyxJQUFFLElBQUksS0FBRyxDQUFDLEVBQUMsTUFBTSxJQUFJLFNBQVMsQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUMsQ0FBQyxFQUFFLEVBQUM7QUFBQyxjQUFJLENBQUMsR0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxLQUFLLENBQUMsS0FBRyxDQUFDLElBQUUsSUFBSSxLQUFHLENBQUMsRUFBQyxLQUFJLElBQUksQ0FBQyxHQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsRUFBRSxFQUFDO0FBQUMsZ0JBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQUMsQ0FBQyxHQUFDLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUcsQ0FBQyxJQUFFLENBQUMsQ0FBQyxVQUFVLEtBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLENBQUE7V0FBQztTQUFDLE9BQU8sQ0FBQyxDQUFBO09BQUMsU0FBUyxDQUFDLEdBQUU7QUFBQyxjQUFNLENBQUMsTUFBTSxJQUFFLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFDLFFBQVEsRUFBQyxFQUFDLFVBQVUsRUFBQyxDQUFDLENBQUMsRUFBQyxZQUFZLEVBQUMsQ0FBQyxDQUFDLEVBQUMsUUFBUSxFQUFDLENBQUMsQ0FBQyxFQUFDLEtBQUssRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFBO09BQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxFQUFDLE1BQU0sRUFBQyxDQUFDLEVBQUMsUUFBUSxFQUFDLENBQUMsRUFBQyxDQUFBO0tBQUMsRUFBQyxFQUFFLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxVQUFTLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsZUFBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLGdCQUFRLFlBQVMsQ0FBQyx5Q0FBRCxDQUFDLEVBQUEsR0FBQyxDQUFDLEdBQUMsRUFBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxHQUFDLEtBQUssQ0FBQyxLQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUcsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxHQUFDLEVBQUUsR0FBQyxFQUFFLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxVQUFVLEtBQUcsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxRQUFRLEdBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBQyxFQUFFLEVBQUMsQ0FBQyxHQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxFQUFFLENBQUMsRUFBQztBQUFDLGNBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUEsSUFBRyxDQUFDLENBQUMsSUFBSSxJQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUM7QUFBQyxnQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUk7Z0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBRyxVQUFVLEtBQUcsQ0FBQyxDQUFDLElBQUksSUFBRSxPQUFPLEtBQUcsQ0FBQyxDQUFDLElBQUksSUFBRSxDQUFDLENBQUMsT0FBTyxLQUFHLENBQUMsR0FBQyxLQUFLLENBQUMsQ0FBQSxBQUFDLEVBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQSxFQUFDO0FBQUMsbUJBQUcsVUFBVSxLQUFHLENBQUMsQ0FBQyxJQUFJLElBQUUsQ0FBQyxDQUFDLE9BQU8sS0FBRyxDQUFDLEdBQUMsRUFBRSxDQUFBLEFBQUMsRUFBQyxPQUFPLEtBQUcsQ0FBQyxDQUFDLElBQUksS0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFFLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLE9BQU8sS0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLENBQUMsSUFBRSxPQUFPLElBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQSxFQUFDLFNBQVE7YUFBQyxNQUFLLElBQUcsQ0FBQyxDQUFDLEVBQUMsU0FBUyxJQUFHLGlCQUFpQixLQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUk7QUFBQyxlQUFDLEdBQUMsRUFBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxFQUFFLENBQUMsRUFBQztBQUFDLG9CQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxJQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUs7b0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLElBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLElBQUUsQ0FBQyxLQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksSUFBRSxJQUFJLEtBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLElBQUksRUFBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFBLEFBQUMsQ0FBQTtlQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLEVBQUUsQ0FBQyxDQUFBLEFBQUMsQ0FBQTthQUFDO1dBQUM7U0FBQyxJQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUMsS0FBSSxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQUMsV0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxFQUFFLENBQUMsQ0FBQSxBQUFDLENBQUM7U0FBQSxPQUFPLENBQUMsQ0FBQTtPQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQztBQUFDLFlBQUksQ0FBQyxHQUFDLEVBQUU7WUFBQyxDQUFDLEdBQUMsYUFBYTtZQUFDLENBQUMsR0FBQyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLElBQUksTUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDO0FBQUUsV0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUFBLE9BQU8sQ0FBQyxDQUFBO09BQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxZQUFHLENBQUMsS0FBRyxDQUFDLENBQUMsTUFBTSxFQUFDLE9BQU8sQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFO1lBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBRyxJQUFJLEtBQUcsQ0FBQyxFQUFDLE9BQU8sQ0FBQyxHQUFDLENBQUMsSUFBRSxFQUFFLEVBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsT0FBTyxJQUFFLEVBQUUsRUFBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLENBQUMsSUFBRyxDQUFDLEVBQUM7QUFBQyxjQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2NBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLEdBQUMsQ0FBQyxJQUFFLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUEsSUFBRyxDQUFDLEdBQUMsQ0FBQyxJQUFFLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxDQUFBO1NBQUMsTUFBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUE7T0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLFlBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLEVBQUM7QUFBQyxjQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUE7U0FBQyxNQUFJO0FBQUMsY0FBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBLEdBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQTtTQUFDLE9BQU8sQ0FBQyxDQUFBO09BQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxlQUFPLENBQUMsR0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBQyxNQUFNLENBQUMsRUFBQyxDQUFDLEdBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFDLEdBQUcsQ0FBQyxFQUFDLENBQUMsSUFBRSxDQUFDLEdBQUMsR0FBRyxHQUFDLEVBQUUsQ0FBQSxBQUFDLEdBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEdBQUMsR0FBRyxHQUFDLENBQUMsQ0FBQTtPQUFDLElBQUksQ0FBQyxHQUFDLHVDQUF1QztVQUFDLENBQUMsR0FBQyxvQ0FBb0M7VUFBQyxDQUFDLEdBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUE7S0FBQyxFQUFDLEVBQUUsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLFVBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxPQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsU0FBQyxDQUFBLFVBQVMsQ0FBQyxFQUFDO0FBQUMsY0FBRyxRQUFRLFlBQVMsQ0FBQyx5Q0FBRCxDQUFDLEVBQUEsSUFBRSxXQUFXLElBQUUsT0FBTyxDQUFDLEVBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLElBQUcsVUFBVSxJQUFFLE9BQU8sQ0FBQyxJQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxLQUFJO0FBQUMsZ0JBQUksQ0FBQyxDQUFDLENBQUMsR0FBQyxXQUFXLElBQUUsT0FBTyxNQUFNLEdBQUMsTUFBTSxHQUFDLFdBQVcsSUFBRSxPQUFPLENBQUMsR0FBQyxDQUFDLEdBQUMsV0FBVyxJQUFFLE9BQU8sSUFBSSxHQUFDLElBQUksR0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLFNBQVMsR0FBQyxDQUFDLEVBQUUsQ0FBQTtXQUFDO1NBQUMsQ0FBQSxDQUFDLFlBQVU7QUFBQyxpQkFBTyxDQUFBLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMscUJBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxrQkFBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQztBQUFDLG9CQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDO0FBQUMsc0JBQUksQ0FBQyxHQUFDLFVBQVUsSUFBRSxPQUFPLENBQUMsSUFBRSxDQUFDLENBQUMsSUFBRyxDQUFDLENBQUMsSUFBRSxDQUFDLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsSUFBSSxLQUFLLENBQUMsc0JBQXNCLEdBQUMsQ0FBQyxHQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU0sQ0FBQyxDQUFDLElBQUksR0FBQyxrQkFBa0IsRUFBQyxDQUFDLENBQUEsQ0FBQTtpQkFBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBQyxPQUFPLEVBQUMsRUFBRSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsc0JBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFBO2lCQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUE7ZUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUE7YUFBQyxLQUFJLElBQUksQ0FBQyxHQUFDLFVBQVUsSUFBRSxPQUFPLENBQUMsSUFBRSxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxDQUFDLEVBQUU7QUFBQyxlQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFBQSxPQUFPLENBQUMsQ0FBQTtXQUFDLENBQUEsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLFVBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyx1QkFBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLG9CQUFHLFFBQVEsSUFBRSxPQUFPLENBQUMsRUFBQyxNQUFNLElBQUksU0FBUyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxLQUFHLENBQUMsR0FBQyxRQUFRLENBQUEsQUFBQyxDQUFDLElBQUksQ0FBQyxHQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLENBQUMsRUFBQyxPQUFPLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLE1BQU0sSUFBRSxDQUFDLEVBQUM7QUFBQyxzQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLEdBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFBO2lCQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsUUFBUTtvQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFJLENBQUMsQ0FBQyxTQUFTLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFFO0FBQUUsbUJBQUMsR0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO2lCQUFBLElBQUcsQ0FBQyxDQUFDLFVBQVUsSUFBRSxDQUFDLENBQUMsU0FBUyxFQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsc0JBQXNCLEVBQUUsRUFBQyxDQUFDLENBQUMsVUFBVTtBQUFFLG1CQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7aUJBQUEsT0FBTyxDQUFDLENBQUE7ZUFBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7a0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsSUFBRSxPQUFPLFFBQVEsS0FBRyxDQUFDLEdBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsRUFBQyxDQUFDLENBQUMsU0FBUyxHQUFDLG9FQUFvRSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQyxDQUFBLEFBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxFQUFDLE1BQU0sRUFBQyxDQUFDLENBQUMsRUFBQyxZQUFZLEVBQUMsYUFBYSxDQUFDLEVBQUMsRUFBRSxFQUFDLENBQUMsQ0FBQyxFQUFDLGdCQUFnQixFQUFDLGtCQUFrQixDQUFDLEVBQUMsR0FBRyxFQUFDLENBQUMsQ0FBQyxFQUFDLGtDQUFrQyxFQUFDLHFCQUFxQixDQUFDLEVBQUMsUUFBUSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyxRQUFRLEVBQUMsUUFBUSxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUMsRUFBRSxFQUFDLEVBQUUsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBQyxDQUFDLENBQUMsRUFBRSxHQUFDLENBQUMsQ0FBQyxFQUFDLG9CQUFvQixFQUFDLHVCQUF1QixDQUFDLEVBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsUUFBUSxHQUFDLENBQUMsQ0FBQyxFQUFDLDhCQUE4QixFQUFDLFdBQVcsQ0FBQyxFQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUMsQ0FBQyxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsUUFBUSxHQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsRUFBQyxTQUFTLEVBQUMsVUFBVSxDQUFDLEVBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUMsd0RBQXdELEVBQUMsUUFBUSxDQUFDLENBQUE7YUFBQyxFQUFDLEVBQUUsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLFVBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyx1QkFBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLHdCQUFRLFlBQVMsQ0FBQyx5Q0FBRCxDQUFDLEVBQUEsR0FBQyxDQUFDLEdBQUMsRUFBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxHQUFDLEtBQUssQ0FBQyxLQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUcsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxHQUFDLEVBQUUsR0FBQyxFQUFFLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxVQUFVLEtBQUcsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxRQUFRLEdBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBQyxFQUFFLEVBQUMsQ0FBQyxHQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxFQUFFLENBQUMsRUFBQztBQUFDLHNCQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLElBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFBLElBQUcsQ0FBQyxDQUFDLElBQUksSUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFDO0FBQUMsd0JBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJO3dCQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUcsVUFBVSxLQUFHLENBQUMsQ0FBQyxJQUFJLElBQUUsT0FBTyxLQUFHLENBQUMsQ0FBQyxJQUFJLElBQUUsQ0FBQyxDQUFDLE9BQU8sS0FBRyxDQUFDLEdBQUMsS0FBSyxDQUFDLENBQUEsQUFBQyxFQUFDLENBQUMsQ0FBQyxLQUFLLENBQUEsRUFBQztBQUFDLDJCQUFHLFVBQVUsS0FBRyxDQUFDLENBQUMsSUFBSSxJQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUcsQ0FBQyxHQUFDLEVBQUUsQ0FBQSxBQUFDLEVBQUMsT0FBTyxLQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBRSxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxPQUFPLEtBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLEVBQUMsQ0FBQyxDQUFDLElBQUUsT0FBTyxJQUFFLENBQUMsQ0FBQyxJQUFJLENBQUEsRUFBQyxTQUFRO3FCQUFDLE1BQUssSUFBRyxDQUFDLENBQUMsRUFBQyxTQUFTLElBQUcsaUJBQWlCLEtBQUcsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSTtBQUFDLHVCQUFDLEdBQUMsRUFBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxFQUFFLENBQUMsRUFBQztBQUFDLDRCQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxJQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUs7NEJBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLElBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLElBQUUsQ0FBQyxLQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksSUFBRSxJQUFJLEtBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLElBQUksRUFBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFBLEFBQUMsQ0FBQTt1QkFBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsS0FBSyxLQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxFQUFFLENBQUMsQ0FBQSxBQUFDLENBQUE7cUJBQUM7bUJBQUM7aUJBQUMsSUFBRyxDQUFDLENBQUMsS0FBSyxFQUFDLEtBQUksSUFBSSxDQUFDLElBQUksQ0FBQztBQUFDLG1CQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLEVBQUUsQ0FBQyxDQUFBLEFBQUMsQ0FBQztpQkFBQSxPQUFPLENBQUMsQ0FBQTtlQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQztBQUFDLG9CQUFJLENBQUMsR0FBQyxFQUFFO29CQUFDLENBQUMsR0FBQyxhQUFhO29CQUFDLENBQUMsR0FBQyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUM7b0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxJQUFJLE1BQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQztBQUFFLG1CQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUFBLE9BQU8sQ0FBQyxDQUFBO2VBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxvQkFBRyxDQUFDLEtBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBQyxPQUFPLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRTtvQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxJQUFHLElBQUksS0FBRyxDQUFDLEVBQUMsT0FBTyxDQUFDLEdBQUMsQ0FBQyxJQUFFLEVBQUUsRUFBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxPQUFPLElBQUUsRUFBRSxFQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxFQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsRUFBQztBQUFDLHNCQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3NCQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxHQUFDLENBQUMsSUFBRSxFQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBLElBQUcsQ0FBQyxHQUFDLENBQUMsSUFBRSxFQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsQ0FBQTtpQkFBQyxNQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQTtlQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsb0JBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLEVBQUM7QUFBQyxzQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBO2lCQUFDLE1BQUk7QUFBQyxzQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBLEdBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQTtpQkFBQyxPQUFPLENBQUMsQ0FBQTtlQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsdUJBQU8sQ0FBQyxHQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFDLE1BQU0sQ0FBQyxFQUFDLENBQUMsR0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUMsR0FBRyxDQUFDLEVBQUMsQ0FBQyxJQUFFLENBQUMsR0FBQyxHQUFHLEdBQUMsRUFBRSxDQUFBLEFBQUMsR0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsR0FBQyxHQUFHLEdBQUMsQ0FBQyxDQUFBO2VBQUMsSUFBSSxDQUFDLEdBQUMsdUNBQXVDO2tCQUFDLENBQUMsR0FBQyxvQ0FBb0M7a0JBQUMsQ0FBQyxHQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFBO2FBQUMsRUFBQyxFQUFFLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxVQUFTLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsa0JBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxRQUFRLENBQUM7a0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQztrQkFBQyxDQUFDLEdBQUMsU0FBRixDQUFDLENBQVUsQ0FBQyxFQUFDO0FBQUMsb0JBQUksQ0FBQyxHQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLEVBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsT0FBTyxZQUFZLE1BQU0sQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLEVBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxZQUFZLE1BQU0sQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQTtlQUFDO2tCQUFDLENBQUMsR0FBQyxTQUFGLENBQUMsQ0FBVSxDQUFDLEVBQUM7QUFBQyxvQkFBSSxDQUFDLEdBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxFQUFDLENBQUMsRUFBRSxFQUFDO0FBQUMsc0JBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7c0JBQUMsQ0FBQyxHQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxXQUFXLEdBQUMsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLENBQUMsU0FBUyxHQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsRUFBQyxDQUFDLEtBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFDLENBQUMsS0FBRyxDQUFDLENBQUMsTUFBTSxHQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBQyxDQUFBLFVBQVMsQ0FBQyxFQUFDO0FBQUMscUJBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUMs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QU8sR0FBQyxDQUFDLENBQUE7S0FBQyxFQUFDLEVBQUMsT0FBTyxFQUFDLENBQUMsRUFBQyxZQUFZLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxVQUFTLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsT0FBQyxDQUFDLG9CQUFvQixDQUFDLEVBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztVQUFDLENBQUMsR0FBQyxTQUFGLENBQUMsQ0FBVSxDQUFDLEVBQUM7QUFBQyxZQUFHLFdBQVcsSUFBRSxPQUFPLENBQUMsRUFBQztBQUFDLGNBQUksQ0FBQyxHQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsU0FBUyxDQUFBO1NBQUMsT0FBTSxFQUFFLENBQUE7T0FBQztVQUFDLENBQUMsR0FBQyxTQUFGLENBQUMsQ0FBVSxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsWUFBRyxRQUFRLElBQUUsT0FBTyxDQUFDLElBQUUsQ0FBQyxLQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUMsQ0FBQyxFQUFFLEVBQUM7QUFBQyxjQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtTQUFDO09BQUM7VUFBQyxDQUFDLEdBQUMsQ0FBQSxZQUFVO0FBQUMsWUFBSSxDQUFDLEdBQUMsUUFBUSxDQUFDLGFBQWEsQ0FB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QUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLGNBQWMsRUFBQyxDQUFDLENBQUM7Y0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsU0FBUyxHQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLEVBQUMsQ0FBQyxDQUFDLG9CQUFvQixJQUFFLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUMsVUFBUyxDQUFDLEVBQUM7QUFBQyxhQUFDLENBQUMsTUFBTSxLQUFHLENBQUMsSUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUE7V0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsU0FBUyxHQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsRUFBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxPQUFPLFlBQVksTUFBTSxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsV0FBVyxDQUFD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QWMsRUFBQyxFQUFFLEVBQUMsa0JBQWtCLEVBQUMsQ0FBQyxDQUFDLEVBQUMsRUFBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBQyxhQUFhLEVBQUMsRUFBQyxZQUFZLEVBQUMsQ0FBQyxDQUFDLEVBQUMsVUFBVSxFQUFDLENBQUMsQ0FBQyxFQUFDLFFBQVEsRUFBQyxDQUFDLENBQUMsRUFBQyxLQUFLLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsY0FBYyxHQUFDLFVBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLFlBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFBQyxDQUFDLEdBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxTQUFTLEdBQUMsQ0FBQyxHQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQTtPQUFDLEVBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUE7S0FBQyxFQUFDLEVBQUMsb0JBQW9CLEVBQUMsQ0FBQyxFQUFDLE1BQU0sRUFBQyxDQUFDLEVBQUMsbUJBQW1CLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxFQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7Q0FBQyxDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBncmF2aXRvblxuICpcbiAqIEphdmFTY3JpcHQgTi1ib2R5IEdyYXZpdGF0aW9uYWwgU2ltdWxhdG9yXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IFphdmVuIE11cmFkeWFuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqXG4gKiBSZXZpc2lvbjpcbiAqICBAUkVWSVNJT05cbiAqL1xuaW1wb3J0IEd0QXBwIGZyb20gJy4vZ3Jhdml0b24vYXBwJztcblxuZXhwb3J0IGRlZmF1bHQgeyBhcHA6IEd0QXBwIH07XG4iLCIvKipcbiAqIGdyYXZpdG9uL2FwcCAtLSBUaGUgaW50ZXJhY3RpdmUgZ3Jhdml0b24gYXBwbGljYXRpb25cbiAqL1xuLyogZ2xvYmFsIGpzY29sb3IgKi9cblxuaW1wb3J0IHZleCBmcm9tICcuLi92ZW5kb3IvdmV4JztcbmltcG9ydCByYW5kb20gZnJvbSAnLi4vdXRpbC9yYW5kb20nO1xuaW1wb3J0IEd0U2ltIGZyb20gJy4vc2ltJztcbmltcG9ydCBHdEdmeCBmcm9tICcuL2dmeCc7XG5pbXBvcnQgR3RFdmVudHMsIHsgS0VZQ09ERVMsIEVWRU5UQ09ERVMsIENPTlRST0xDT0RFUyB9IGZyb20gJy4vZXZlbnRzJztcbmltcG9ydCBHdFRpbWVyIGZyb20gJy4vdGltZXInO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdEFwcCB7XG4gICAgY29uc3RydWN0b3IoYXJncyA9IHt9KSB7XG4gICAgICAgIHRoaXMuYXJncyA9IGFyZ3M7XG5cbiAgICAgICAgdGhpcy5vcHRpb25zID0ge307XG4gICAgICAgIHRoaXMuZ3JpZCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5hbmltVGltZXIgPSBudWxsO1xuICAgICAgICB0aGlzLnNpbVRpbWVyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmV2ZW50cyA9IG51bGw7XG4gICAgICAgIHRoaXMuc2ltID0gbnVsbDtcbiAgICAgICAgdGhpcy5nZnggPSBudWxsO1xuXG4gICAgICAgIHRoaXMubm9jbGVhciA9IGZhbHNlO1xuICAgICAgICB0aGlzLmludGVyYWN0aW9uID0ge3ByZXZpb3VzOiB7fX07XG4gICAgICAgIHRoaXMudGFyZ2V0Qm9keSA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy53YXNDb2xvclBpY2tlckFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmlzSGVscE9wZW4gPSBmYWxzZTtcblxuICAgICAgICB0aGlzLm9wdGlvbnMud2lkdGggPSBhcmdzLndpZHRoID0gYXJncy53aWR0aCB8fCB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICAgICAgdGhpcy5vcHRpb25zLmhlaWdodCA9IGFyZ3MuaGVpZ2h0ID0gYXJncy5oZWlnaHQgfHwgd2luZG93LmlubmVySGVpZ2h0O1xuICAgICAgICB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yID0gYXJncy5iYWNrZ3JvdW5kQ29sb3IgfHwgJyMxRjI2M0InO1xuXG4gICAgICAgIC8vIFJldHJpZXZlIGNhbnZhcywgb3IgYnVpbGQgb25lIHdpdGggYXJndW1lbnRzXG4gICAgICAgIHRoaXMuZ3JpZCA9IHR5cGVvZiBhcmdzLmdyaWQgPT09ICdzdHJpbmcnID9cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGFyZ3MuZ3JpZCkgOlxuICAgICAgICAgICAgYXJncy5ncmlkO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5ncmlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZUdyaWQodGhpcy5vcHRpb25zLndpZHRoLCB0aGlzLm9wdGlvbnMuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICB7YmFja2dyb3VuZENvbG9yOiB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yfSk7XG4gICAgICAgICAgICBhcmdzLmdyaWQgPSB0aGlzLmdyaWQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbnRyb2xzID0gdHlwZW9mIGFyZ3MuY29udHJvbHMgPT09ICdzdHJpbmcnID9cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGFyZ3MuY29udHJvbHMpIDpcbiAgICAgICAgICAgIGFyZ3MuY29udHJvbHM7XG5cbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmNvbnRyb2xzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZUNvbnRyb2xzKCk7XG4gICAgICAgICAgICBhcmdzLmNvbnRyb2xzID0gdGhpcy5jb250cm9scztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGxheUJ0biA9IGFyZ3MucGxheUJ0biA9IHRoaXMuY29udHJvbHMucXVlcnlTZWxlY3RvcignI3BsYXlidG4nKTtcbiAgICAgICAgdGhpcy5wYXVzZUJ0biA9IGFyZ3MucGF1c2VCdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyNwYXVzZWJ0bicpO1xuICAgICAgICB0aGlzLnRyYWlsT2ZmQnRuID0gYXJncy50cmFpbE9mZkJ0biA9IHRoaXMuY29udHJvbHMucXVlcnlTZWxlY3RvcignI3RyYWlsb2ZmYnRuJyk7XG4gICAgICAgIHRoaXMudHJhaWxPbkJ0biA9IGFyZ3MudHJhaWxPbkJ0biA9IHRoaXMuY29udHJvbHMucXVlcnlTZWxlY3RvcignI3RyYWlsb25idG4nKTtcbiAgICAgICAgdGhpcy5oZWxwQnRuID0gYXJncy5oZWxwQnRuID0gdGhpcy5jb250cm9scy5xdWVyeVNlbGVjdG9yKCcjaGVscGJ0bicpO1xuXG4gICAgICAgIHRoaXMuY29sb3JQaWNrZXIgPSB0eXBlb2YgYXJncy5jb2xvclBpY2tlciA9PT0gJ3N0cmluZycgP1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYXJncy5jb2xvclBpY2tlcikgOlxuICAgICAgICAgICAgYXJncy5jb2xvclBpY2tlcjtcblxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuY29sb3JQaWNrZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLmNvbG9yUGlja2VyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgICAgIHRoaXMuY29sb3JQaWNrZXIuY2xhc3NOYW1lID0gJ2JvZHljb2xvcnBpY2tlcic7XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuY29sb3JQaWNrZXIpO1xuICAgICAgICAgICAgYXJncy5jb2xvclBpY2tlciA9IHRoaXMuY29sb3JQaWNrZXI7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5qc2NvbG9yID0gbmV3IGpzY29sb3IodGhpcy5jb2xvclBpY2tlciwge1xuICAgICAgICAgICAgcGFkZGluZzogMCxcbiAgICAgICAgICAgIHNoYWRvdzogZmFsc2UsXG4gICAgICAgICAgICBib3JkZXJXaWR0aDogMCxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgIGluc2V0Q29sb3I6ICcjM2Q1NTllJyxcbiAgICAgICAgICAgIG9uRmluZUNoYW5nZTogdGhpcy51cGRhdGVDb2xvci5iaW5kKHRoaXMpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMubWV0YUluZm8gPSB0eXBlb2YgYXJncy5tZXRhSW5mbyA9PT0gJ3N0cmluZycgP1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYXJncy5tZXRhSW5mbykgOlxuICAgICAgICAgICAgYXJncy5tZXRhSW5mbztcblxuICAgICAgICBpZiAodHlwZW9mIHRoaXMubWV0YUluZm8gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLm1ldGFJbmZvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICAgICAgdGhpcy5tZXRhSW5mby5jbGFzc05hbWUgPSAnbWV0YWluZm8nO1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLm1ldGFJbmZvKTtcbiAgICAgICAgICAgIGFyZ3MubWV0YUluZm8gPSB0aGlzLm1ldGFJbmZvO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSW5pdGlhbGl6ZVxuICAgICAgICB0aGlzLmluaXRDb21wb25lbnRzKCk7XG4gICAgICAgIHRoaXMuaW5pdFRpbWVycygpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIG1haW4gLS0gTWFpbiAnZ2FtZScgbG9vcFxuICAgICAqL1xuICAgIG1haW4oKSB7XG4gICAgICAgIC8vIEV2ZW50IHByb2Nlc3NpbmdcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICB0aGlzLmV2ZW50cy5xZ2V0KCkuZm9yRWFjaChmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgbGV0IHJldHZhbDtcblxuICAgICAgICAgICAgc3dpdGNoIChldmVudC50eXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBFVkVOVENPREVTLk1PVVNFRE9XTjpcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbiA9PT0gLyogcmlnaHQgY2xpY2sgKi8gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGJvZHkuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50YXJnZXRCb2R5ICYmICF0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNpbS5yZW1vdmVCb2R5KHRoaXMudGFyZ2V0Qm9keSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRUYXJnZXRCb2R5KHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuYnV0dG9uID09PSAvKiBtaWRkbGUgY2xpY2sgKi8gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29sb3IgcGlja2luZ1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0Qm9keSAmJiAhdGhpcy5pbnRlcmFjdGlvbi5zdGFydGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb2xvclBpY2tlci5zdHlsZS5sZWZ0ID0gZXZlbnQucG9zaXRpb24ueCArICdweCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb2xvclBpY2tlci5zdHlsZS50b3AgPSBldmVudC5wb3NpdGlvbi55ICsgJ3B4JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmpzY29sb3IuZnJvbVN0cmluZyh0aGlzLnRhcmdldEJvZHkuY29sb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuanNjb2xvci5zaG93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7IC8qIGxlZnQgY2xpY2sgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJhc2UgdGhlIGNoZWNrIG9uIHRoZSBwcmV2aW91cyB2YWx1ZSwgaW4gY2FzZSB0aGUgY29sb3IgcGlja2VyIHdhcyBqdXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjbG9zZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMud2FzQ29sb3JQaWNrZXJBY3RpdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgZmxhZyB0byBzaWduYWwgb3RoZXIgZXZlbnRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5zdGFydGVkID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnRhcmdldEJvZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5ib2R5ID0gdGhpcy50YXJnZXRCb2R5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJhY3Rpb24uYm9keSA9IHRoaXMuc2ltLmFkZE5ld0JvZHkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogZXZlbnQucG9zaXRpb24ueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IGV2ZW50LnBvc2l0aW9uLnlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5wcmV2aW91cy54ID0gZXZlbnQucG9zaXRpb24ueDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLnByZXZpb3VzLnkgPSBldmVudC5wb3NpdGlvbi55O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIHBpY2tlci5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmlzQ29sb3JQaWNrZXJBY3RpdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhazsgLy8gZW5kIE1PVVNFRE9XTlxuXG4gICAgICAgICAgICAgICAgY2FzZSBFVkVOVENPREVTLk1PVVNFVVA6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJhY3Rpb24uc3RhcnRlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYm9keSA9IHRoaXMuaW50ZXJhY3Rpb24uYm9keTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZlbFggPSAoZXZlbnQucG9zaXRpb24ueCAtIGJvZHkueCkgKiAwLjAwMDAwMDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmVsWSA9IChldmVudC5wb3NpdGlvbi55IC0gYm9keS55KSAqIDAuMDAwMDAwMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdoZW4gdGhlIHNpbXVsYXRpb24gaXMgYWN0aXZlLCBhZGQgdGhlIHZlbG9jaXR5IHRvIHRoZSBjdXJyZW50IHZlbG9jaXR5XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpbnN0ZWFkIG9mIGNvbXBsZXRlbHkgcmVzZXR0aW5nIGl0ICh0byBhbGxvdyBmb3IgbW9yZSBpbnRlcmVzdGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW50ZXJhY3Rpb25zKS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGJvZHkudmVsWCA9IHRoaXMuc2ltVGltZXIuYWN0aXZlID8gYm9keS52ZWxYICsgdmVsWCA6IHZlbFg7XG4gICAgICAgICAgICAgICAgICAgICAgICBib2R5LnZlbFkgPSB0aGlzLnNpbVRpbWVyLmFjdGl2ZSA/IGJvZHkudmVsWSArIHZlbFkgOiB2ZWxZO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlVGFyZ2V0KGV2ZW50LnBvc2l0aW9uLngsIGV2ZW50LnBvc2l0aW9uLnkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgRVZFTlRDT0RFUy5NT1VTRU1PVkU6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJhY3Rpb24ucHJldmlvdXMueCA9IGV2ZW50LnBvc2l0aW9uLng7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJhY3Rpb24ucHJldmlvdXMueSA9IGV2ZW50LnBvc2l0aW9uLnk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5pbnRlcmFjdGlvbi5zdGFydGVkICYmICF0aGlzLmlzQ29sb3JQaWNrZXJBY3RpdmUoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVUYXJnZXQoZXZlbnQucG9zaXRpb24ueCwgZXZlbnQucG9zaXRpb24ueSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7IC8vIGVuZCBNT1VTRU1PVkVcblxuICAgICAgICAgICAgICAgIGNhc2UgRVZFTlRDT0RFUy5NT1VTRVdIRUVMOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50YXJnZXRCb2R5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRhcmdldEJvZHkuYWRqdXN0U2l6ZShldmVudC5kZWx0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZU1ldGFJbmZvKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7IC8vIGVuZCBNT1VTRVdIRUVMXG5cbiAgICAgICAgICAgICAgICBjYXNlIEVWRU5UQ09ERVMuS0VZRE9XTjpcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChldmVudC5rZXljb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEtFWUNPREVTLktfRU5URVI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVTaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBLRVlDT0RFUy5LX0M6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2xlYXIgc2ltdWxhdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2ltLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5nZnguY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNpbVRpbWVyLnN0b3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR2YWwgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBLRVlDT0RFUy5LX1A6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVUcmFpbHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBLRVlDT0RFUy5LX1I6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2VuZXJhdGUgcmFuZG9tIG9iamVjdHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdlbmVyYXRlQm9kaWVzKDEwLCB7cmFuZG9tQ29sb3JzOiB0cnVlfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgS0VZQ09ERVMuS19UOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2ltLmFkZE5ld0JvZHkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiB0aGlzLm9wdGlvbnMud2lkdGggLyAyLCB5OiB0aGlzLm9wdGlvbnMuaGVpZ2h0IC8gMixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVsWDogMCwgdmVsWTogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFzczogMjAwMCwgcmFkaXVzOiA1MCwgY29sb3I6ICcjNUE1QTVBJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2ltLmFkZE5ld0JvZHkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiB0aGlzLm9wdGlvbnMud2lkdGggLSA0MDAsIHk6IHRoaXMub3B0aW9ucy5oZWlnaHQgLyAyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZWxYOiAwLCB2ZWxZOiAwLjAwMDAyNSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFzczogMSwgcmFkaXVzOiA1LCBjb2xvcjogJyM3ODc4NzgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgS0VZQ09ERVMuS19RVUVTVElPTk1BUks6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93SGVscCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrOyAvLyBlbmQgS0VZRE9XTlxuXG4gICAgICAgICAgICAgICAgY2FzZSBDT05UUk9MQ09ERVMuUExBWUJUTjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVTaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5QQVVTRUJUTjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVTaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5UUkFJTE9GRkJUTjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVUcmFpbHMoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5UUkFJTE9OQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVRyYWlscygpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLkhFTFBCVE46XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd0hlbHAoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXR2YWw7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIC8vIFJlZHJhdyBzY3JlZW5cbiAgICAgICAgdGhpcy5yZWRyYXcoKTtcbiAgICB9XG5cbiAgICBpbml0Q29tcG9uZW50cygpIHtcbiAgICAgICAgLy8gQ3JlYXRlIGNvbXBvbmVudHMgLS0gb3JkZXIgaXMgaW1wb3J0YW50XG4gICAgICAgIHRoaXMuZXZlbnRzID0gdGhpcy5hcmdzLmV2ZW50cyA9IG5ldyBHdEV2ZW50cyh0aGlzLmFyZ3MpO1xuICAgICAgICB0aGlzLnNpbSA9IG5ldyBHdFNpbSh0aGlzLmFyZ3MpO1xuICAgICAgICB0aGlzLmdmeCA9IG5ldyBHdEdmeCh0aGlzLmFyZ3MpO1xuICAgIH1cblxuICAgIGluaXRUaW1lcnMoKSB7XG4gICAgICAgIC8vIEFkZCBgbWFpbmAgbG9vcCwgYW5kIHN0YXJ0IGltbWVkaWF0ZWx5XG4gICAgICAgIHRoaXMuYW5pbVRpbWVyID0gbmV3IEd0VGltZXIodGhpcy5tYWluLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmFuaW1UaW1lci5zdGFydCgpO1xuICAgICAgICB0aGlzLnNpbVRpbWVyID0gbmV3IEd0VGltZXIodGhpcy5zaW0uc3RlcC5iaW5kKHRoaXMuc2ltKSwgNjApO1xuICAgIH1cblxuICAgIHRvZ2dsZVNpbSgpIHtcbiAgICAgICAgaWYgKHRoaXMuc2ltVGltZXIuYWN0aXZlKSB7XG4gICAgICAgICAgICB0aGlzLnBsYXlCdG4uc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICAgICAgdGhpcy5wYXVzZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5wbGF5QnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB0aGlzLnBhdXNlQnRuLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNpbVRpbWVyLnRvZ2dsZSgpO1xuICAgIH1cblxuICAgIHRvZ2dsZVRyYWlscygpIHtcbiAgICAgICAgaWYgKHRoaXMubm9jbGVhcikge1xuICAgICAgICAgICAgdGhpcy50cmFpbE9mZkJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgICAgICB0aGlzLnRyYWlsT25CdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudHJhaWxPZmZCdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIHRoaXMudHJhaWxPbkJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ub2NsZWFyID0gIXRoaXMubm9jbGVhcjtcbiAgICB9XG5cbiAgICBzaG93SGVscCgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNIZWxwT3Blbikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaXNIZWxwT3BlbiA9IHRydWU7XG4gICAgICAgIHZleC5vcGVuKHtcbiAgICAgICAgICAgIHVuc2FmZUNvbnRlbnQ6IGBcbiAgICAgICAgICAgICAgICA8aDM+U2hvcnRjdXRzPC9oMz5cbiAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJzaG9ydGN1dHNcIj5cbiAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+TGVmdCBjbGljazwvdGQ+IDx0ZD4gY3JlYXRlIGJvZHk8L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD5SaWdodCBjbGljazwvdGQ+IDx0ZD4gZGVsZXRlIGJvZHk8L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD5NaWRkbGUgY2xpY2s8L3RkPiA8dGQ+IGNoYW5nZSBib2R5IGNvbG9yPC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGNvZGU+RW50ZXIga2V5PC9jb2RlPiBrZXk8L3RkPiA8dGQ+IHN0YXJ0IHNpbXVsYXRpb248L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48Y29kZT5DPC9jb2RlPiBrZXk8L3RkPiA8dGQ+IGNsZWFyIGNhbnZhczwvdGQ+PC90cj5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjxjb2RlPlA8L2NvZGU+IGtleTwvdGQ+IDx0ZD4gdG9nZ2xlIHJlcGFpbnRpbmc8L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48Y29kZT5SPC9jb2RlPiBrZXk8L3RkPiA8dGQ+IGNyZWF0ZSByYW5kb20gYm9kaWVzPC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGNvZGU+VDwvY29kZT4ga2V5PC90ZD4gPHRkPiBjcmVhdGUgVGl0YW48L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48Y29kZT4/PC9jb2RlPiBrZXk8L3RkPiA8dGQ+IHNob3cgaGVscDwvdGQ+PC90cj5cbiAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBhZnRlckNsb3NlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0hlbHBPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJlZHJhdygpIHtcbiAgICAgICAgaWYgKCF0aGlzLm5vY2xlYXIpIHtcbiAgICAgICAgICAgIHRoaXMuZ2Z4LmNsZWFyKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kcmF3SW50ZXJhY3Rpb24oKTtcbiAgICAgICAgdGhpcy5nZnguZHJhd0JvZGllcyh0aGlzLnNpbS5ib2RpZXMsIHRoaXMudGFyZ2V0Qm9keSk7XG4gICAgfVxuXG4gICAgZ2VuZXJhdGVHcmlkKHdpZHRoLCBoZWlnaHQsIHN0eWxlKSB7XG4gICAgICAgIC8vIEF0dGFjaCBhIGNhbnZhcyB0byB0aGUgcGFnZSwgdG8gaG91c2UgdGhlIHNpbXVsYXRpb25zXG4gICAgICAgIGlmICghc3R5bGUpIHtcbiAgICAgICAgICAgIHN0eWxlID0ge307XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmdyaWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblxuICAgICAgICB0aGlzLmdyaWQuY2xhc3NOYW1lID0gJ2dyYXZpdG9uY2FudmFzJztcbiAgICAgICAgdGhpcy5ncmlkLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHRoaXMuZ3JpZC5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIHRoaXMuZ3JpZC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgdGhpcy5ncmlkLnN0eWxlLm1hcmdpbkxlZnQgPSBzdHlsZS5tYXJnaW5MZWZ0IHx8ICdhdXRvJztcbiAgICAgICAgdGhpcy5ncmlkLnN0eWxlLm1hcmdpblJpZ2h0ID0gc3R5bGUubWFyZ2luUmlnaHQgfHwgJ2F1dG8nO1xuICAgICAgICB0aGlzLmdyaWQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gc3R5bGUuYmFja2dyb3VuZENvbG9yIHx8ICcjMDAwMDAwJztcblxuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuZ3JpZCk7XG4gICAgfVxuXG4gICAgZ2VuZXJhdGVDb250cm9scygpIHtcbiAgICAgICAgdGhpcy5jb250cm9scyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ21lbnUnKTtcbiAgICAgICAgdGhpcy5jb250cm9scy50eXBlID0gJ3Rvb2xiYXInO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmlkID0gJ2NvbnRyb2xzJztcbiAgICAgICAgdGhpcy5jb250cm9scy5pbm5lckhUTUwgPSBgXG4gICAgICAgICAgICA8bWVudWl0ZW0gaWQ9XCJwbGF5YnRuXCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvcGxheS5zdmdcIiBhbHQ9XCJTdGFydCBzaW11bGF0aW9uXCI+XG4gICAgICAgICAgICA8L21lbnVpdGVtPlxuICAgICAgICAgICAgPG1lbnVpdGVtIGlkPVwicGF1c2VidG5cIiBzdHlsZT1cImRpc3BsYXk6IG5vbmU7XCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvcGF1c2Uuc3ZnXCIgYWx0PVwiU3RvcCBzaW11bGF0aW9uXCI+XG4gICAgICAgICAgICA8L21lbnVpdGVtPlxuICAgICAgICAgICAgPG1lbnVpdGVtIGlkPVwidHJhaWxvZmZidG5cIj5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz1cImFzc2V0cy90cmFpbF9vZmYuc3ZnXCIgYWx0PVwiVG9nZ2xlIHRyYWlsc1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cInRyYWlsb25idG5cIiBzdHlsZT1cImRpc3BsYXk6IG5vbmU7XCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvdHJhaWxfb24uc3ZnXCIgYWx0PVwiVG9nZ2xlIHRyYWlsc1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cImhlbHBidG5cIj5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz1cImFzc2V0cy9oZWxwLnN2Z1wiIGFsdD1cIkhlbHBcIj5cbiAgICAgICAgICAgIDwvbWVudWl0ZW0+XG4gICAgICAgICAgICBgO1xuXG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5jb250cm9scyk7XG4gICAgfVxuXG4gICAgZ2VuZXJhdGVCb2RpZXMobnVtLCBhcmdzKSB7XG4gICAgICAgIGFyZ3MgPSBhcmdzIHx8IHt9O1xuXG4gICAgICAgIGxldCBtaW5YID0gYXJncy5taW5YIHx8IDA7XG4gICAgICAgIGxldCBtYXhYID0gYXJncy5tYXhYIHx8IHRoaXMub3B0aW9ucy53aWR0aDtcbiAgICAgICAgbGV0IG1pblkgPSBhcmdzLm1pblkgfHwgMDtcbiAgICAgICAgbGV0IG1heFkgPSBhcmdzLm1heFkgfHwgdGhpcy5vcHRpb25zLmhlaWdodDtcblxuICAgICAgICBsZXQgbWluVmVsWCA9IGFyZ3MubWluVmVsWCB8fCAwO1xuICAgICAgICBsZXQgbWF4VmVsWCA9IGFyZ3MubWF4VmVsWCB8fCAwLjAwMDAxO1xuICAgICAgICBsZXQgbWluVmVsWSA9IGFyZ3MubWluVmVsWSB8fCAwO1xuICAgICAgICBsZXQgbWF4VmVsWSA9IGFyZ3MubWF4VmVsWSB8fCAwLjAwMDAxO1xuXG4gICAgICAgIGxldCBtaW5NYXNzID0gYXJncy5taW5NYXNzIHx8IDE7XG4gICAgICAgIGxldCBtYXhNYXNzID0gYXJncy5tYXhNYXNzIHx8IDE1MDtcblxuICAgICAgICBsZXQgbWluUmFkaXVzID0gYXJncy5taW5SYWRpdXMgfHwgMTtcbiAgICAgICAgbGV0IG1heFJhZGl1cyA9IGFyZ3MubWF4UmFkaXVzIHx8IDE1O1xuXG4gICAgICAgIGxldCBjb2xvciA9IGFyZ3MuY29sb3I7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW07IGkrKykge1xuICAgICAgICAgICAgaWYgKGFyZ3MucmFuZG9tQ29sb3JzID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgY29sb3IgPSByYW5kb20uY29sb3IoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5zaW0uYWRkTmV3Qm9keSh7XG4gICAgICAgICAgICAgICAgeDogcmFuZG9tLm51bWJlcihtaW5YLCBtYXhYKSxcbiAgICAgICAgICAgICAgICB5OiByYW5kb20ubnVtYmVyKG1pblksIG1heFkpLFxuICAgICAgICAgICAgICAgIHZlbFg6IHJhbmRvbS5kaXJlY3Rpb25hbChtaW5WZWxYLCBtYXhWZWxYKSxcbiAgICAgICAgICAgICAgICB2ZWxZOiByYW5kb20uZGlyZWN0aW9uYWwobWluVmVsWSwgbWF4VmVsWSksXG4gICAgICAgICAgICAgICAgbWFzczogcmFuZG9tLm51bWJlcihtaW5NYXNzLCBtYXhNYXNzKSxcbiAgICAgICAgICAgICAgICByYWRpdXM6IHJhbmRvbS5udW1iZXIobWluUmFkaXVzLCBtYXhSYWRpdXMpLFxuICAgICAgICAgICAgICAgIGNvbG9yOiBjb2xvclxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkcmF3SW50ZXJhY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZ2Z4LmRyYXdSZXRpY2xlTGluZSh0aGlzLmludGVyYWN0aW9uLmJvZHksIHRoaXMuaW50ZXJhY3Rpb24ucHJldmlvdXMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlVGFyZ2V0KHgsIHkpIHtcbiAgICAgICAgdGhpcy5zZXRUYXJnZXRCb2R5KHRoaXMuc2ltLmdldEJvZHlBdCh4LCB5KSk7XG4gICAgfVxuXG4gICAgc2V0VGFyZ2V0Qm9keShib2R5KSB7XG4gICAgICAgIHRoaXMudGFyZ2V0Qm9keSA9IGJvZHk7XG4gICAgICAgIHRoaXMudXBkYXRlTWV0YUluZm8oKTtcbiAgICB9XG5cbiAgICB1cGRhdGVNZXRhSW5mbygpIHtcbiAgICAgICAgaWYgKHRoaXMudGFyZ2V0Qm9keSkge1xuICAgICAgICAgICAgdGhpcy5tZXRhSW5mby5pbm5lckhUTUwgPVxuICAgICAgICAgICAgICAgIGDiipUgJHt0aGlzLnRhcmdldEJvZHkubWFzcy50b0ZpeGVkKDIpfSAmbmJzcDtgICtcbiAgICAgICAgICAgICAgICBg4qa/ICR7dGhpcy50YXJnZXRCb2R5LnJhZGl1cy50b0ZpeGVkKDIpfSAmbmJzcDtgICtcbiAgICAgICAgICAgICAgICBg4oeXICR7dGhpcy50YXJnZXRCb2R5LnNwZWVkLnRvRml4ZWQoMil9YDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubWV0YUluZm8udGV4dENvbnRlbnQgPSAnJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZUNvbG9yKCkge1xuICAgICAgICBpZiAodGhpcy50YXJnZXRCb2R5KSB7XG4gICAgICAgICAgICB0aGlzLnRhcmdldEJvZHkudXBkYXRlQ29sb3IodGhpcy5qc2NvbG9yLnRvSEVYU3RyaW5nKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaXNDb2xvclBpY2tlckFjdGl2ZSgpIHtcbiAgICAgICAgdGhpcy53YXNDb2xvclBpY2tlckFjdGl2ZSA9IHRoaXMuY29sb3JQaWNrZXIuY2xhc3NOYW1lLmluZGV4T2YoJ2pzY29sb3ItYWN0aXZlJykgPiAtMTtcbiAgICAgICAgcmV0dXJuIHRoaXMud2FzQ29sb3JQaWNrZXJBY3RpdmU7XG4gICAgfVxufSAvLyBlbmQgZ3Jhdml0b24vYXBwXG4iLCJpbXBvcnQgY29sb3JzIGZyb20gJy4uL3V0aWwvY29sb3JzJztcblxuLyoqXG4gKiBncmF2aXRvbi9ib2R5IC0tIFRoZSBncmF2aXRhdGlvbmFsIGJvZHlcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR3RCb2R5IHtcbiAgICBjb25zdHJ1Y3RvcihhcmdzKSB7XG4gICAgICAgIGFyZ3MgPSBhcmdzIHx8IHt9O1xuXG4gICAgICAgIHRoaXMueCA9IGFyZ3MueDtcbiAgICAgICAgdGhpcy55ID0gYXJncy55O1xuICAgICAgICBpZiAodHlwZW9mIHRoaXMueCAhPT0gJ251bWJlcicgfHwgdHlwZW9mIHRoaXMueSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdDb3JyZWN0IHBvc2l0aW9ucyB3ZXJlIG5vdCBnaXZlbiBmb3IgdGhlIGJvZHkuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnZlbFggPSBhcmdzLnZlbFggfHwgMDtcbiAgICAgICAgdGhpcy52ZWxZID0gYXJncy52ZWxZIHx8IDA7XG5cbiAgICAgICAgdGhpcy5yYWRpdXMgPSBhcmdzLnJhZGl1cyB8fCAxMDtcbiAgICAgICAgLy8gSW5pdGlhbGl6ZWQgYmVsb3cuXG4gICAgICAgIHRoaXMubWFzcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5jb2xvciA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5oaWdobGlnaHQgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgdGhpcy51cGRhdGVDb2xvcihhcmdzLmNvbG9yIHx8ICcjZGJkM2M4Jyk7XG4gICAgICAgIHRoaXMuYWRqdXN0U2l6ZSgwKTtcbiAgICB9XG5cbiAgICBhZGp1c3RTaXplKGRlbHRhKSB7XG4gICAgICAgIHRoaXMucmFkaXVzID0gTWF0aC5tYXgodGhpcy5yYWRpdXMgKyBkZWx0YSwgMik7XG4gICAgICAgIC8vIERvcmt5IGZvcm11bGEgdG8gbWFrZSBtYXNzIHNjYWxlIFwicHJvcGVybHlcIiB3aXRoIHJhZGl1cy5cbiAgICAgICAgdGhpcy5tYXNzID0gTWF0aC5wb3codGhpcy5yYWRpdXMgLyA0LCAzKTtcbiAgICB9XG5cbiAgICB1cGRhdGVDb2xvcihjb2xvcikge1xuICAgICAgICB0aGlzLmNvbG9yID0gY29sb3I7XG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0ID0gY29sb3JzLnRvSGV4KGNvbG9ycy5icmlnaHRlbihjb2xvcnMuZnJvbUhleCh0aGlzLmNvbG9yKSwgLjI1KSk7XG4gICAgfVxuXG4gICAgZ2V0IHNwZWVkKCkge1xuICAgICAgICAvLyBWZWxvY2l0aWVzIGFyZSB0aW55LCBzbyB1cHNjYWxlIGl0IChhcmJpdHJhcmlseSkgdG8gbWFrZSBpdCByZWFkYWJsZS5cbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLnZlbFggKiB0aGlzLnZlbFggKyB0aGlzLnZlbFkgKiB0aGlzLnZlbFkpICogMWU2O1xuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL2JvZHlcbiIsIi8qKlxuICogZ3Jhdml0b24vZXZlbnRzIC0tIEV2ZW50IHF1ZXVlaW5nIGFuZCBwcm9jZXNzaW5nXG4gKi9cbmV4cG9ydCBjb25zdCBLRVlDT0RFUyA9IHtcbiAgICBLX0xFRlQ6IDM3LFxuICAgIEtfVVA6IDM4LFxuICAgIEtfUklHSFQ6IDM5LFxuICAgIEtfRE9XTjogNDAsXG5cbiAgICBLXzA6IDQ4LFxuICAgIEtfMTogNDksXG4gICAgS18yOiA1MCxcbiAgICBLXzM6IDUxLFxuICAgIEtfNDogNTIsXG4gICAgS181OiA1MyxcbiAgICBLXzY6IDU0LFxuICAgIEtfNzogNTUsXG4gICAgS184OiA1NixcbiAgICBLXzk6IDU3LFxuXG4gICAgS19BOiA2NSxcbiAgICBLX0I6IDY2LFxuICAgIEtfQzogNjcsXG4gICAgS19EOiA2OCxcbiAgICBLX0U6IDY5LFxuICAgIEtfRjogNzAsXG4gICAgS19HOiA3MSxcbiAgICBLX0g6IDcyLFxuICAgIEtfSTogNzMsXG4gICAgS19KOiA3NCxcbiAgICBLX0s6IDc1LFxuICAgIEtfTDogNzYsXG4gICAgS19NOiA3NyxcbiAgICBLX046IDc4LFxuICAgIEtfTzogNzksXG4gICAgS19QOiA4MCxcbiAgICBLX1E6IDgxLFxuICAgIEtfUjogODIsXG4gICAgS19TOiA4MyxcbiAgICBLX1Q6IDg0LFxuICAgIEtfVTogODUsXG4gICAgS19WOiA4NixcbiAgICBLX1c6IDg3LFxuICAgIEtfWDogODgsXG4gICAgS19ZOiA4OSxcbiAgICBLX1o6IDkwLFxuXG4gICAgS19LUDE6IDk3LFxuICAgIEtfS1AyOiA5OCxcbiAgICBLX0tQMzogOTksXG4gICAgS19LUDQ6IDEwMCxcbiAgICBLX0tQNTogMTAxLFxuICAgIEtfS1A2OiAxMDIsXG4gICAgS19LUDc6IDEwMyxcbiAgICBLX0tQODogMTA0LFxuICAgIEtfS1A5OiAxMDUsXG5cbiAgICBLX1FVRVNUSU9OTUFSSzogMTkxLFxuXG4gICAgS19CQUNLU1BBQ0U6IDgsXG4gICAgS19UQUI6IDksXG4gICAgS19FTlRFUjogMTMsXG4gICAgS19TSElGVDogMTYsXG4gICAgS19DVFJMOiAxNyxcbiAgICBLX0FMVDogMTgsXG4gICAgS19FU0M6IDI3LFxuICAgIEtfU1BBQ0U6IDMyXG59O1xuXG5leHBvcnQgY29uc3QgTU9VU0VDT0RFUyA9IHtcbiAgICBNX0xFRlQ6IDAsXG4gICAgTV9NSURETEU6IDEsXG4gICAgTV9SSUdIVDogMlxufTtcblxuZXhwb3J0IGNvbnN0IEVWRU5UQ09ERVMgPSB7XG4gICAgTU9VU0VET1dOOiAxMDAwLFxuICAgIE1PVVNFVVA6IDEwMDEsXG4gICAgTU9VU0VNT1ZFOiAxMDAyLFxuICAgIE1PVVNFV0hFRUw6IDEwMDMsXG4gICAgQ0xJQ0s6IDEwMDQsXG4gICAgREJMQ0xJQ0s6IDEwMDUsXG5cbiAgICBLRVlET1dOOiAxMDEwLFxuICAgIEtFWVVQOiAxMDExXG59O1xuXG5leHBvcnQgY29uc3QgQ09OVFJPTENPREVTID0ge1xuICAgIFBMQVlCVE46IDIwMDAsXG4gICAgUEFVU0VCVE46IDIwMDEsXG4gICAgVFJBSUxPRkZCVE46IDIwMDIsXG4gICAgVFJBSUxPTkJUTjogMjAwMyxcbiAgICBIRUxQQlROOiAyMDA0XG59O1xuXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd0RXZlbnRzIHtcbiAgICBjb25zdHJ1Y3RvcihhcmdzKSB7XG4gICAgICAgIGFyZ3MgPSBhcmdzIHx8IHt9O1xuXG4gICAgICAgIHRoaXMucXVldWUgPSBbXTtcblxuICAgICAgICBpZiAodHlwZW9mIGFyZ3MuZ3JpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdObyB1c2FibGUgY2FudmFzIGVsZW1lbnQgd2FzIGdpdmVuLicpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZ3JpZCA9IGFyZ3MuZ3JpZDtcbiAgICAgICAgdGhpcy5jb250cm9scyA9IGFyZ3MuY29udHJvbHM7XG4gICAgICAgIHRoaXMucGxheUJ0biA9IGFyZ3MucGxheUJ0bjtcbiAgICAgICAgdGhpcy5wYXVzZUJ0biA9IGFyZ3MucGF1c2VCdG47XG4gICAgICAgIHRoaXMudHJhaWxPZmZCdG4gPSBhcmdzLnRyYWlsT2ZmQnRuO1xuICAgICAgICB0aGlzLnRyYWlsT25CdG4gPSBhcmdzLnRyYWlsT25CdG47XG4gICAgICAgIHRoaXMuaGVscEJ0biA9IGFyZ3MuaGVscEJ0bjtcblxuICAgICAgICB0aGlzLndpcmV1cEV2ZW50cygpO1xuICAgIH1cblxuICAgIHFhZGQoZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xdWV1ZS5wdXNoKGV2ZW50KTtcbiAgICB9XG5cbiAgICBxcG9sbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucXVldWUuc2hpZnQoKTtcbiAgICB9XG5cbiAgICBxZ2V0KCkge1xuICAgICAgICAvLyBSZXBsYWNpbmcgdGhlIHJlZmVyZW5jZSBpcyBmYXN0ZXIgdGhhbiBgc3BsaWNlKClgXG4gICAgICAgIGxldCByZWYgPSB0aGlzLnF1ZXVlO1xuICAgICAgICB0aGlzLnF1ZXVlID0gW107XG4gICAgICAgIHJldHVybiByZWY7XG4gICAgfVxuXG4gICAgcWNsZWFyKCkge1xuICAgICAgICB0aGlzLnF1ZXVlID0gW107XG4gICAgfVxuXG4gICAgd2lyZXVwRXZlbnRzKCkge1xuICAgICAgICAvLyBHcmlkIG1vdXNlIGV2ZW50c1xuICAgICAgICB0aGlzLmdyaWQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNsaWNrLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZGJsY2xpY2snLCB0aGlzLmhhbmRsZURibENsaWNrLmJpbmQodGhpcykpO1xuXG4gICAgICAgIHRoaXMuZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIHRoaXMuaGFuZGxlQ29udGV4dE1lbnUuYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLmhhbmRsZU1vdXNlRG93bi5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5ncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLmhhbmRsZU1vdXNlVXAuYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLmhhbmRsZU1vdXNlTW92ZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5ncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ3doZWVsJywgdGhpcy5oYW5kbGVNb3VzZVdoZWVsLmJpbmQodGhpcykpO1xuXG4gICAgICAgIC8vIEdyaWQga2V5IGV2ZW50c1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5oYW5kbGVLZXlEb3duLmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuaGFuZGxlS2V5VXAuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgLy8gQ29udHJvbCBldmVudHNcbiAgICAgICAgdGhpcy5wbGF5QnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDb250cm9sQ2xpY2suYmluZCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICBDT05UUk9MQ09ERVMuUExBWUJUTikpO1xuICAgICAgICB0aGlzLnBhdXNlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDb250cm9sQ2xpY2suYmluZCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICBDT05UUk9MQ09ERVMuUEFVU0VCVE4pKTtcbiAgICAgICAgdGhpcy50cmFpbE9mZkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ29udHJvbENsaWNrLmJpbmQodGhpcyxcbiAgICAgICAgICAgICAgICAgICAgQ09OVFJPTENPREVTLlRSQUlMT0ZGQlROKSk7XG4gICAgICAgIHRoaXMudHJhaWxPbkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ29udHJvbENsaWNrLmJpbmQodGhpcyxcbiAgICAgICAgICAgICAgICAgICAgQ09OVFJPTENPREVTLlRSQUlMT05CVE4pKTtcbiAgICAgICAgdGhpcy5oZWxwQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDb250cm9sQ2xpY2suYmluZCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICBDT05UUk9MQ09ERVMuSEVMUEJUTikpO1xuICAgIH1cblxuICAgIGhhbmRsZUNsaWNrKGV2ZW50KSB7XG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiBFVkVOVENPREVTLkNMSUNLLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuZ2V0UG9zaXRpb24oZXZlbnQpLFxuICAgICAgICAgICAgYnV0dG9uOiBldmVudC5idXR0b24sXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlRGJsQ2xpY2soZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuREJMQ0xJQ0ssXG4gICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5nZXRQb3NpdGlvbihldmVudCksXG4gICAgICAgICAgICBidXR0b246IGV2ZW50LmJ1dHRvbixcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBoYW5kbGVDb250ZXh0TWVudShldmVudCkge1xuICAgICAgICAvLyBQcmV2ZW50IHJpZ2h0LWNsaWNrIG1lbnVcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICBoYW5kbGVNb3VzZURvd24oZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuTU9VU0VET1dOLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuZ2V0UG9zaXRpb24oZXZlbnQpLFxuICAgICAgICAgICAgYnV0dG9uOiBldmVudC5idXR0b24sXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlTW91c2VVcChldmVudCkge1xuICAgICAgICB0aGlzLnFhZGQoe1xuICAgICAgICAgICAgdHlwZTogRVZFTlRDT0RFUy5NT1VTRVVQLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuZ2V0UG9zaXRpb24oZXZlbnQpLFxuICAgICAgICAgICAgYnV0dG9uOiBldmVudC5idXR0b24sXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlTW91c2VNb3ZlKGV2ZW50KSB7XG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiBFVkVOVENPREVTLk1PVVNFTU9WRSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmdldFBvc2l0aW9uKGV2ZW50KSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogZXZlbnQudGltZVN0YW1wXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGhhbmRsZU1vdXNlV2hlZWwoZXZlbnQpIHtcbiAgICAgICAgLy8gUmV2ZXJzZSB0aGUgdXAvZG93bi5cbiAgICAgICAgbGV0IGRlbHRhID0gLWV2ZW50LmRlbHRhWSAvIDUwO1xuXG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiBFVkVOVENPREVTLk1PVVNFV0hFRUwsXG4gICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5nZXRQb3NpdGlvbihldmVudCksXG4gICAgICAgICAgICBkZWx0YTogZGVsdGEsXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gUHJldmVudCB0aGUgd2luZG93IGZyb20gc2Nyb2xsaW5nXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuXG4gICAgaGFuZGxlS2V5RG93bihldmVudCkge1xuICAgICAgICAvLyBBY2NvdW50IGZvciBicm93c2VyIGRpc2NyZXBhbmNpZXNcbiAgICAgICAgbGV0IGtleSA9IGV2ZW50LmtleUNvZGUgfHwgZXZlbnQud2hpY2g7XG5cbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuS0VZRE9XTixcbiAgICAgICAgICAgIGtleWNvZGU6IGtleSxcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBoYW5kbGVLZXlVcChldmVudCkge1xuICAgICAgICAvLyBBY2NvdW50IGZvciBicm93c2VyIGRpc2NyZXBhbmNpZXNcbiAgICAgICAgbGV0IGtleSA9IGV2ZW50LmtleUNvZGUgfHwgZXZlbnQud2hpY2g7XG5cbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuS0VZVVAsXG4gICAgICAgICAgICBrZXljb2RlOiBrZXksXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlQ29udHJvbENsaWNrKHR5cGUsIGV2ZW50KSB7XG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZ2V0UG9zaXRpb24oZXZlbnQpIHtcbiAgICAgICAgLy8gQ2FsY3VsYXRlIG9mZnNldCBvbiB0aGUgZ3JpZCBmcm9tIGNsaWVudFgvWSwgYmVjYXVzZVxuICAgICAgICAvLyBzb21lIGJyb3dzZXJzIGRvbid0IGhhdmUgZXZlbnQub2Zmc2V0WC9ZXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiBldmVudC5jbGllbnRYIC0gdGhpcy5ncmlkLm9mZnNldExlZnQsXG4gICAgICAgICAgICB5OiBldmVudC5jbGllbnRZIC0gdGhpcy5ncmlkLm9mZnNldFRvcFxuICAgICAgICB9O1xuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL2V2ZW50c1xuIiwiLyoqXG4gKiBncmF2aXRvbi9nZnggLS0gVGhlIGdyYXBoaWNzIG9iamVjdFxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdEdmeCB7XG4gICAgY29uc3RydWN0b3IoYXJncykge1xuICAgICAgICBhcmdzID0gYXJncyB8fCB7fTtcblxuICAgICAgICB0aGlzLmdyaWQgPSB0eXBlb2YgYXJncy5ncmlkID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChhcmdzLmdyaWQpIDpcbiAgICAgICAgICAgIGFyZ3MuZ3JpZDtcblxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuZ3JpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdObyB1c2FibGUgY2FudmFzIGVsZW1lbnQgd2FzIGdpdmVuLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jdHggPSB0aGlzLmdyaWQuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgLy8gU2V0dGluZyB0aGUgd2lkdGggaGFzIHRoZSBzaWRlIGVmZmVjdFxuICAgICAgICAvLyBvZiBjbGVhcmluZyB0aGUgY2FudmFzXG4gICAgICAgIHRoaXMuZ3JpZC53aWR0aCA9IHRoaXMuZ3JpZC53aWR0aDtcbiAgICB9XG5cbiAgICBkcmF3Qm9kaWVzKGJvZGllcywgdGFyZ2V0Qm9keSkge1xuICAgICAgICBmb3IgKGxldCBib2R5IG9mIGJvZGllcykge1xuICAgICAgICAgICAgdGhpcy5kcmF3Qm9keShib2R5LCAvKiBpc1RhcmdldGVkICovIGJvZHkgPT09IHRhcmdldEJvZHkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZHJhd0JvZHkoYm9keSwgaXNUYXJnZXRlZCkge1xuICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBib2R5LmNvbG9yO1xuXG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmN0eC5hcmMoYm9keS54LCBib2R5LnksIGJvZHkucmFkaXVzLCAwLCBNYXRoLlBJICogMiwgdHJ1ZSk7XG5cbiAgICAgICAgdGhpcy5jdHguZmlsbCgpO1xuICAgICAgICBpZiAoaXNUYXJnZXRlZCkge1xuICAgICAgICAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSBib2R5LmhpZ2hsaWdodDtcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IE1hdGgucm91bmQoYm9keS5yYWRpdXMgLyA4KTtcbiAgICAgICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZHJhd1JldGljbGVMaW5lKGZyb20sIHRvKSB7XG4gICAgICAgIGxldCBncmFkID0gdGhpcy5jdHguY3JlYXRlTGluZWFyR3JhZGllbnQoZnJvbS54LCBmcm9tLnksIHRvLngsIHRvLnkpO1xuICAgICAgICBncmFkLmFkZENvbG9yU3RvcCgwLCAncmdiYSgzMSwgNzUsIDEzMCwgMSknKTtcbiAgICAgICAgZ3JhZC5hZGRDb2xvclN0b3AoMSwgJ3JnYmEoMzEsIDc1LCAxMzAsIDAuMSknKTtcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSBncmFkO1xuICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSA2O1xuICAgICAgICB0aGlzLmN0eC5saW5lQ2FwID0gJ3JvdW5kJztcblxuICAgICAgICAvLyBEcmF3IGluaXRpYWwgYmFja2dyb3VuZCBsaW5lLlxuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5jdHgubW92ZVRvKGZyb20ueCwgZnJvbS55KTtcbiAgICAgICAgdGhpcy5jdHgubGluZVRvKHRvLngsIHRvLnkpO1xuICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcblxuICAgICAgICAvLyBEcmF3IG92ZXJsYXkgbGluZS5cbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSAnIzM0NzdDQSc7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDI7XG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmN0eC5tb3ZlVG8oZnJvbS54LCBmcm9tLnkpO1xuICAgICAgICB0aGlzLmN0eC5saW5lVG8odG8ueCwgdG8ueSk7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL2dmeFxuIiwiLyoqXG4gKiBncmF2aXRvbi9zaW0gLS0gVGhlIGdyYXZpdGF0aW9uYWwgc2ltdWxhdG9yXG4gKi9cbmltcG9ydCBsb2cgZnJvbSAnLi4vdXRpbC9sb2cnO1xuaW1wb3J0IEd0Qm9keSBmcm9tICcuL2JvZHknO1xuaW1wb3J0IEd0VHJlZSBmcm9tICcuL3RyZWUnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdFNpbSB7XG4gICAgY29uc3RydWN0b3IoYXJncykge1xuICAgICAgICBhcmdzID0gYXJncyB8fCB7fTtcblxuICAgICAgICB0aGlzLm9wdGlvbnMgPSB7fTtcbiAgICAgICAgdGhpcy5ib2RpZXMgPSBbXTtcbiAgICAgICAgdGhpcy50cmVlID0gbmV3IEd0VHJlZShhcmdzLndpZHRoLCBhcmdzLmhlaWdodCk7XG4gICAgICAgIHRoaXMudGltZSA9IDA7XG5cbiAgICAgICAgLy8gVGVtcG9yYXJ5IHdvcmtzcGFjZVxuICAgICAgICB0aGlzLkQgPSB7fTtcblxuICAgICAgICB0aGlzLm9wdGlvbnMuRyA9IGFyZ3MuRyB8fCA2LjY3Mzg0ICogTWF0aC5wb3coMTAsIC0xMSk7IC8vIEdyYXZpdGF0aW9uYWwgY29uc3RhbnRcbiAgICAgICAgdGhpcy5vcHRpb25zLm11bHRpcGxpZXIgPSBhcmdzLm11bHRpcGxpZXIgfHwgMTUwMDsgLy8gVGltZXN0ZXBcbiAgICAgICAgdGhpcy5vcHRpb25zLnNjYXR0ZXJMaW1pdCA9IGFyZ3Muc2NhdHRlckxpbWl0IHx8IDEwMDAwO1xuICAgIH1cblxuICAgIHN0ZXAoZWxhcHNlZCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuYm9kaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gdGhpcy5ib2RpZXNbaV07XG4gICAgICAgICAgICB0aGlzLmNhbGN1bGF0ZU5ld1Bvc2l0aW9uKGJvZHksIGksIGVsYXBzZWQgKiB0aGlzLm9wdGlvbnMubXVsdGlwbGllcik7XG4gICAgICAgICAgICBpID0gdGhpcy5yZW1vdmVTY2F0dGVyZWQoYm9keSwgaSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnRpbWUgKz0gZWxhcHNlZDsgLy8gSW5jcmVtZW50IHJ1bnRpbWVcbiAgICB9XG5cbiAgICBjYWxjdWxhdGVOZXdQb3NpdGlvbihib2R5LCBpbmRleCwgZGVsdGFUKSB7XG4gICAgICAgIGxldCBuZXRGeCA9IDA7XG4gICAgICAgIGxldCBuZXRGeSA9IDA7XG5cbiAgICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGFsbCBib2RpZXMgYW5kIHN1bSB0aGUgZm9yY2VzIGV4ZXJ0ZWRcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmJvZGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgYXR0cmFjdG9yID0gdGhpcy5ib2RpZXNbaV07XG4gICAgICAgICAgICBpZiAoaSAhPT0gaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAvLyBHZXQgdGhlIGRpc3RhbmNlIGFuZCBwb3NpdGlvbiBkZWx0YXNcbiAgICAgICAgICAgICAgICB0aGlzLmNhbGN1bGF0ZURpc3RhbmNlKGJvZHksIGF0dHJhY3Rvcik7XG5cbiAgICAgICAgICAgICAgICAvLyBDYWxjdWxhdGUgZm9yY2UgdXNpbmcgTmV3dG9uaWFuIGdyYXZpdHksIHNlcGFyYXRlIG91dCBpbnRvIHggYW5kIHkgY29tcG9uZW50c1xuICAgICAgICAgICAgICAgIGxldCBGID0gKHRoaXMub3B0aW9ucy5HICogYm9keS5tYXNzICogYXR0cmFjdG9yLm1hc3MpIC8gTWF0aC5wb3codGhpcy5ELnIsIDIpO1xuICAgICAgICAgICAgICAgIGxldCBGeCA9IEYgKiAodGhpcy5ELmR4IC8gdGhpcy5ELnIpO1xuICAgICAgICAgICAgICAgIGxldCBGeSA9IEYgKiAodGhpcy5ELmR5IC8gdGhpcy5ELnIpO1xuXG4gICAgICAgICAgICAgICAgbmV0RnggKz0gRng7XG4gICAgICAgICAgICAgICAgbmV0RnkgKz0gRnk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYWxjdWxhdGUgYWNjZWxlcmF0aW9uc1xuICAgICAgICBsZXQgYXggPSBuZXRGeCAvIGJvZHkubWFzcztcbiAgICAgICAgbGV0IGF5ID0gbmV0RnkgLyBib2R5Lm1hc3M7XG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIG5ldyB2ZWxvY2l0aWVzLCBub3JtYWxpemVkIGJ5IHRoZSAndGltZScgaW50ZXJ2YWxcbiAgICAgICAgYm9keS52ZWxYICs9IGRlbHRhVCAqIGF4O1xuICAgICAgICBib2R5LnZlbFkgKz0gZGVsdGFUICogYXk7XG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIG5ldyBwb3NpdGlvbnMgYWZ0ZXIgdGltZXN0ZXAgZGVsdGFUXG4gICAgICAgIGJvZHkueCArPSBkZWx0YVQgKiBib2R5LnZlbFg7XG4gICAgICAgIGJvZHkueSArPSBkZWx0YVQgKiBib2R5LnZlbFk7XG4gICAgfVxuXG4gICAgY2FsY3VsYXRlRGlzdGFuY2UoYm9keSwgb3RoZXIpIHtcbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBjaGFuZ2UgaW4gcG9zaXRpb24gYWxvbmcgdGhlIHR3byBkaW1lbnNpb25zXG4gICAgICAgIHRoaXMuRC5keCA9IG90aGVyLnggLSBib2R5Lng7XG4gICAgICAgIHRoaXMuRC5keSA9IG90aGVyLnkgLSBib2R5Lnk7XG5cbiAgICAgICAgLy8gT2J0YWluIHRoZSBkaXN0YW5jZSBiZXR3ZWVuIHRoZSBvYmplY3RzIChoeXBvdGVudXNlKVxuICAgICAgICB0aGlzLkQuciA9IE1hdGguc3FydChNYXRoLnBvdyh0aGlzLkQuZHgsIDIpICsgTWF0aC5wb3codGhpcy5ELmR5LCAyKSk7XG4gICAgfVxuXG4gICAgcmVtb3ZlU2NhdHRlcmVkKGJvZHksIGluZGV4KSB7XG4gICAgICAgIGlmIChib2R5LnggPiB0aGlzLm9wdGlvbnMuc2NhdHRlckxpbWl0IHx8XG4gICAgICAgICAgICBib2R5LnggPCAtdGhpcy5vcHRpb25zLnNjYXR0ZXJMaW1pdCB8fFxuICAgICAgICAgICAgYm9keS55ID4gdGhpcy5vcHRpb25zLnNjYXR0ZXJMaW1pdCB8fFxuICAgICAgICAgICAgYm9keS55IDwgLXRoaXMub3B0aW9ucy5zY2F0dGVyTGltaXQpIHtcbiAgICAgICAgICAgIC8vIFJlbW92ZSBmcm9tIGJvZHkgY29sbGVjdGlvblxuICAgICAgICAgICAgLy8gVE9ETzogSW1wbGVtZW50IGZvciB0cmVlLlxuICAgICAgICAgICAgdGhpcy5ib2RpZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIHJldHVybiBpbmRleCAtIDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH1cblxuICAgIGFkZE5ld0JvZHkoYXJncykge1xuICAgICAgICBsZXQgYm9keSA9IG5ldyBHdEJvZHkoYXJncyk7XG4gICAgICAgIHRoaXMuYm9kaWVzLnB1c2goYm9keSk7XG4gICAgICAgIHRoaXMudHJlZS5hZGRCb2R5KGJvZHkpO1xuXG4gICAgICAgIHJldHVybiBib2R5O1xuICAgIH1cblxuICAgIHJlbW92ZUJvZHkodGFyZ2V0Qm9keSkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuYm9kaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gdGhpcy5ib2RpZXNbaV07XG4gICAgICAgICAgICBpZiAoYm9keSA9PT0gdGFyZ2V0Qm9keSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYm9kaWVzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlc2V0VHJlZSgpO1xuICAgIH1cblxuICAgIGdldEJvZHlBdCh4LCB5KSB7XG4gICAgICAgIGZvciAobGV0IGkgPSB0aGlzLmJvZGllcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IHRoaXMuYm9kaWVzW2ldO1xuICAgICAgICAgICAgY29uc3QgaXNNYXRjaCA9IE1hdGguYWJzKHggLSBib2R5LngpIDw9IGJvZHkucmFkaXVzICYmXG4gICAgICAgICAgICAgICAgTWF0aC5hYnMoeSAtIGJvZHkueSkgPD0gYm9keS5yYWRpdXM7XG4gICAgICAgICAgICBpZiAoaXNNYXRjaCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBib2R5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuYm9kaWVzLmxlbmd0aCA9IDA7IC8vIFJlbW92ZSBhbGwgYm9kaWVzIGZyb20gY29sbGVjdGlvblxuICAgICAgICB0aGlzLnJlc2V0VHJlZSgpO1xuICAgIH1cblxuICAgIHJlc2V0VHJlZSgpIHtcbiAgICAgICAgdGhpcy50cmVlLmNsZWFyKCk7XG4gICAgICAgIGZvciAoY29uc3QgYm9keSBvZiB0aGlzLmJvZGllcykge1xuICAgICAgICAgICAgdGhpcy50cmVlLmFkZEJvZHkoYm9keSk7XG4gICAgICAgIH1cbiAgICB9XG59IC8vIGVuZCBncmF2aXRvbi9zaW1cbiIsIi8qKlxuICogZ3Jhdml0b24vdGltZXIgLS0gU2ltIHRpbWVyIGFuZCBGUFMgbGltaXRlclxuICovXG5pbXBvcnQgZW52IGZyb20gJy4uL3V0aWwvZW52JztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR3RUaW1lciB7XG4gICAgY29uc3RydWN0b3IoZm4sIGZwcz1udWxsKSB7XG4gICAgICAgIHRoaXMuX2ZuID0gZm47XG4gICAgICAgIHRoaXMuX2ZwcyA9IGZwcztcbiAgICAgICAgdGhpcy5faXNBY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5faXNBbmltYXRpb24gPSBmcHMgPT09IG51bGw7XG4gICAgICAgIHRoaXMuX2NhbmNlbGxhdGlvbklkID0gbnVsbDtcblxuICAgICAgICB0aGlzLl93aW5kb3cgPSBlbnYuZ2V0V2luZG93KCk7XG4gICAgfVxuXG4gICAgZ2V0IGFjdGl2ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzQWN0aXZlO1xuICAgIH1cblxuICAgIHN0YXJ0KCkge1xuICAgICAgICBpZiAoIXRoaXMuX2lzQWN0aXZlKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5faXNBbmltYXRpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9iZWdpbkFuaW1hdGlvbigpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9iZWdpbkludGVydmFsKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9pc0FjdGl2ZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdG9wKCkge1xuICAgICAgICBpZiAodGhpcy5faXNBY3RpdmUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9pc0FuaW1hdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuX3dpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLl9jYW5jZWxsYXRpb25JZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3dpbmRvdy5jbGVhckludGVydmFsKHRoaXMuX2NhbmNlbGxhdGlvbklkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2lzQWN0aXZlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0b2dnbGUoKSB7XG4gICAgICAgIGlmICh0aGlzLl9pc0FjdGl2ZSkge1xuICAgICAgICAgICAgdGhpcy5zdG9wKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfYmVnaW5BbmltYXRpb24oKSB7XG4gICAgICAgIGxldCBsYXN0VGltZXN0YW1wID0gdGhpcy5fd2luZG93LnBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICBsZXQgYW5pbWF0b3IgPSAodGltZXN0YW1wKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9jYW5jZWxsYXRpb25JZCA9IHRoaXMuX3dpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0b3IpO1xuICAgICAgICAgICAgdGhpcy5fZm4odGltZXN0YW1wIC0gbGFzdFRpbWVzdGFtcCk7XG4gICAgICAgICAgICBsYXN0VGltZXN0YW1wID0gdGltZXN0YW1wO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIERlbGF5IGluaXRpYWwgZXhlY3V0aW9uIHVudGlsIHRoZSBuZXh0IHRpY2suXG4gICAgICAgIHRoaXMuX2NhbmNlbGxhdGlvbklkID0gdGhpcy5fd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRvcik7XG4gICAgfVxuXG4gICAgX2JlZ2luSW50ZXJ2YWwoKSB7XG4gICAgICAgIC8vIENvbXB1dGUgdGhlIGRlbGF5IHBlciB0aWNrLCBpbiBtaWxsaXNlY29uZHMuXG4gICAgICAgIGxldCB0aW1lb3V0ID0gMTAwMCAvIHRoaXMuX2ZwcyB8IDA7XG5cbiAgICAgICAgbGV0IGxhc3RUaW1lc3RhbXAgPSB0aGlzLl93aW5kb3cucGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgIHRoaXMuX2NhbmNlbGxhdGlvbklkID0gdGhpcy5fd2luZG93LnNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgIGxldCB0aW1lc3RhbXAgPSB0aGlzLl93aW5kb3cucGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgICAgICB0aGlzLl9mbih0aW1lc3RhbXAgLSBsYXN0VGltZXN0YW1wKTtcbiAgICAgICAgICAgIGxhc3RUaW1lc3RhbXAgPSB0aW1lc3RhbXA7XG4gICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICB9XG59IC8vIGVuZCBncmF2aXRvbi90aW1lclxuIiwiLyoqXG4gKiBncmF2aXRvbi90cmVlIC0tIFRoZSBncmF2aXRhdGlvbmFsIGJvZHkgdHJlZSBzdHJ1Y3R1cmVcbiAqL1xuXG5jbGFzcyBHdFRyZWVOb2RlIHtcbiAgICBjb25zdHJ1Y3RvcihzdGFydFgsIHN0YXJ0WSwgd2lkdGgsIGhlaWdodCkge1xuICAgICAgICB0aGlzLnN0YXJ0WCA9IHN0YXJ0WDtcbiAgICAgICAgdGhpcy5zdGFydFkgPSBzdGFydFk7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG5cbiAgICAgICAgLy8gQ29udmVuaWVuY2UgY2VudGVyIHBvaW50cy5cbiAgICAgICAgdGhpcy5oYWxmV2lkdGggPSB3aWR0aCAvIDI7XG4gICAgICAgIHRoaXMuaGFsZkhlaWdodCA9IGhlaWdodCAvIDI7XG5cbiAgICAgICAgdGhpcy5taWRYID0gdGhpcy5zdGFydFggKyB0aGlzLmhhbGZXaWR0aDtcbiAgICAgICAgdGhpcy5taWRZID0gdGhpcy5zdGFydFkgKyB0aGlzLmhhbGZIZWlnaHQ7XG5cbiAgICAgICAgdGhpcy5tYXNzID0gMDtcbiAgICAgICAgdGhpcy54ID0gMDtcbiAgICAgICAgdGhpcy55ID0gMDtcblxuICAgICAgICAvLyBbTlcsIE5FLCBTVywgU0VdXG4gICAgICAgIHRoaXMuY2hpbGRyZW4gPSBuZXcgQXJyYXkoNCk7XG4gICAgfVxuXG4gICAgLyoqIEFkZCBhIGJvZHkgdG8gdGhlIHRyZWUsIHVwZGF0aW5nIG1hc3MgYW5kIGNlbnRlcnBvaW50LiAqL1xuICAgIGFkZEJvZHkoYm9keSkge1xuICAgICAgICB0aGlzLnVwZGF0ZU1hc3MoYm9keSk7XG4gICAgICAgIGNvbnN0IHF1YWRyYW50ID0gdGhpcy5nZXRRdWFkcmFudChib2R5LngsIGJvZHkueSk7XG5cbiAgICAgICAgaWYgKCF0aGlzLmNoaWxkcmVuW3F1YWRyYW50XSkge1xuICAgICAgICAgICAgdGhpcy5jaGlsZHJlbltxdWFkcmFudF0gPSBib2R5O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmNoaWxkcmVuW3F1YWRyYW50XTtcbiAgICAgICAgICAgIGNvbnN0IHF1YWRYID0gZXhpc3RpbmcueCA+IHRoaXMubWlkWCA/IHRoaXMubWlkWCA6IHRoaXMuc3RhcnRYO1xuICAgICAgICAgICAgY29uc3QgcXVhZFkgPSBleGlzdGluZy55ID4gdGhpcy5taWRZID8gdGhpcy5taWRZIDogdGhpcy5zdGFydFk7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gbmV3IEd0VHJlZU5vZGUocXVhZFgsIHF1YWRZLCB0aGlzLmhhbGZXaWR0aCwgdGhpcy5oYWxmSGVpZ2h0KTtcblxuICAgICAgICAgICAgbm9kZS5hZGRCb2R5KGV4aXN0aW5nKTtcbiAgICAgICAgICAgIG5vZGUuYWRkQm9keShib2R5KTtcblxuICAgICAgICAgICAgdGhpcy5jaGlsZHJlbltxdWFkcmFudF0gPSBub2RlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIFVwZGF0ZSB0aGUgY2VudGVyIG9mIG1hc3MgYmFzZWQgb24gdGhlIGFkZGl0aW9uIG9mIGEgbmV3IGJvZHkuICovXG4gICAgdXBkYXRlTWFzcyhib2R5KSB7XG4gICAgICAgIGNvbnN0IG5ld01hc3MgPSB0aGlzLm1hc3MgKyBib2R5Lm1hc3M7XG4gICAgICAgIGNvbnN0IG5ld1ggPSAodGhpcy54ICogdGhpcy5tYXNzICsgYm9keS54ICogYm9keS5tYXNzKSAvIG5ld01hc3M7XG4gICAgICAgIGNvbnN0IG5ld1kgPSAodGhpcy55ICogdGhpcy5tYXNzICsgYm9keS55ICogYm9keS5tYXNzKSAvIG5ld01hc3M7XG4gICAgICAgIHRoaXMubWFzcyA9IG5ld01hc3M7XG4gICAgICAgIHRoaXMueCA9IG5ld1g7XG4gICAgICAgIHRoaXMueSA9IG5ld1k7XG4gICAgfVxuXG4gICAgLyoqIFJldHVybiB0aGUgcXVhZHJhbnQgaW5kZXggZm9yIGEgZ2l2ZW4gKHgsIHkpIHBhaXIuIEFzc3VtZXMgdGhhdCBpdCBsaWVzIHdpdGhpbiBib3VuZHMuICovXG4gICAgZ2V0UXVhZHJhbnQoeCwgeSkge1xuICAgICAgICBjb25zdCB4SW5kZXggPSBOdW1iZXIoeCA+IHRoaXMubWlkWCk7XG4gICAgICAgIGNvbnN0IHlJbmRleCA9IE51bWJlcih5ID4gdGhpcy5taWRZKSAqIDI7XG4gICAgICAgIHJldHVybiB4SW5kZXggKyB5SW5kZXg7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdFRyZWUge1xuICAgIGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgdGhpcy5yb290ID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGFkZEJvZHkoYm9keSkge1xuICAgICAgICBpZiAodGhpcy5yb290IGluc3RhbmNlb2YgR3RUcmVlTm9kZSkge1xuICAgICAgICAgICAgdGhpcy5yb290LmFkZEJvZHkoYm9keSk7XG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMucm9vdCkge1xuICAgICAgICAgICAgdGhpcy5yb290ID0gYm9keTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5yb290O1xuICAgICAgICAgICAgdGhpcy5yb290ID0gbmV3IEd0VHJlZU5vZGUoMCwgMCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgICAgICAgICAgdGhpcy5yb290LmFkZEJvZHkoZXhpc3RpbmcpO1xuICAgICAgICAgICAgdGhpcy5yb290LmFkZEJvZHkoYm9keSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5yb290ID0gdW5kZWZpbmVkO1xuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL3RyZWVcbiIsImltcG9ydCAnLi92ZW5kb3IvanNjb2xvcic7XG5pbXBvcnQgdmV4IGZyb20gJy4vdmVuZG9yL3ZleCc7XG5pbXBvcnQgJy4vcG9seWZpbGxzJztcbmltcG9ydCBndCBmcm9tICcuL2dyYXZpdG9uJztcblxud2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIFNldCBvcHRpb25zIGZvciBkZXBlbmRlbmNpZXMuXG4gICAgdmV4LmRlZmF1bHRPcHRpb25zLmNsYXNzTmFtZSA9ICd2ZXgtdGhlbWUtd2lyZWZyYW1lJztcblxuICAgIC8vIFN0YXJ0IHRoZSBtYWluIGdyYXZpdG9uIGFwcC5cbiAgICB3aW5kb3cuZ3Jhdml0b24gPSBuZXcgZ3QuYXBwKCk7XG59O1xuIiwid2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgIGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB3aW5kb3cuc2V0VGltZW91dChjYWxsYmFjaywgMTAwMCAvIDYwKTtcbiAgICB9O1xuXG53aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cubW96Q2FuY2VsQW5pbWF0aW9uRnJhbWUgfHxcbiAgICBmdW5jdGlvbih0aW1lb3V0SWQpIHtcbiAgICAgICAgd2luZG93LmNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgIH07XG5cbndpbmRvdy5wZXJmb3JtYW5jZSA9IHdpbmRvdy5wZXJmb3JtYW5jZSB8fCB7fTtcbndpbmRvdy5wZXJmb3JtYW5jZS5ub3cgPSB3aW5kb3cucGVyZm9ybWFuY2Uubm93IHx8XG4gICAgd2luZG93LnBlcmZvcm1hbmNlLndlYmtpdE5vdyB8fFxuICAgIHdpbmRvdy5wZXJmb3JtYW5jZS5tb3pOb3cgfHxcbiAgICBEYXRlLm5vdztcbiIsIi8qKlxuICogY29sb3JzIC0tIENvbG9yIG1hbmlwdWxhdGlvbiBoZWxwZXJzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBicmlnaHRlbihjb2xvckFycmF5LCBwZXJjZW50KSB7XG4gICAgICAgIGxldCBbciwgZywgYl0gPSBjb2xvckFycmF5O1xuICAgICAgICByID0gTWF0aC5yb3VuZChNYXRoLm1pbihNYXRoLm1heCgwLCByICsgKHIgKiBwZXJjZW50KSksIDI1NSkpO1xuICAgICAgICBnID0gTWF0aC5yb3VuZChNYXRoLm1pbihNYXRoLm1heCgwLCBnICsgKGcgKiBwZXJjZW50KSksIDI1NSkpO1xuICAgICAgICBiID0gTWF0aC5yb3VuZChNYXRoLm1pbihNYXRoLm1heCgwLCBiICsgKGIgKiBwZXJjZW50KSksIDI1NSkpO1xuICAgICAgICByZXR1cm4gW3IsIGcsIGJdO1xuICAgIH0sXG5cbiAgICBmcm9tSGV4KGhleCkge1xuICAgICAgICBsZXQgaCA9IGhleC5yZXBsYWNlKCcjJywgJycpO1xuICAgICAgICBpZiAoaC5sZW5ndGggPCA2KSB7XG4gICAgICAgICAgICBoID0gaC5yZXBsYWNlKC8oLikvZywgJyQxJDEnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW3BhcnNlSW50KGguc3Vic3RyKDAsIDIpLCAxNiksXG4gICAgICAgICAgICAgICAgcGFyc2VJbnQoaC5zdWJzdHIoMiwgMiksIDE2KSxcbiAgICAgICAgICAgICAgICBwYXJzZUludChoLnN1YnN0cig0LCAyKSwgMTYpXTtcbiAgICB9LFxuXG4gICAgdG9IZXgoY29sb3JBcnJheSkge1xuICAgICAgICBjb25zdCBbciwgZywgYl0gPSBjb2xvckFycmF5O1xuICAgICAgICByZXR1cm4gJyMnICsgKCcwJyArIHIudG9TdHJpbmcoMTYpKS5zdWJzdHIociA8IDE2ID8gMCA6IDEpICtcbiAgICAgICAgICAgICAgICAgICAgICgnMCcgKyBnLnRvU3RyaW5nKDE2KSkuc3Vic3RyKGcgPCAxNiA/IDAgOiAxKSArXG4gICAgICAgICAgICAgICAgICAgICAoJzAnICsgYi50b1N0cmluZygxNikpLnN1YnN0cihiIDwgMTYgPyAwIDogMSk7XG4gICAgfVxufTtcbiIsIi8qKlxuICogZW52IC0gRW52aXJvbm1lbnQgcmV0cmlldmFsIG1ldGhvZHMuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBnZXRXaW5kb3coKSB7XG4gICAgICAgIHJldHVybiB3aW5kb3c7XG4gICAgfVxufTtcbiIsIi8qKlxuICogbG9nIC0tIExvZ2dpbmcgZnVuY3Rpb25zXG4gKi9cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBjb25maWc6IHtcbiAgICAgICAgbG9nTGV2ZWw6IG51bGxcbiAgICB9LFxuXG4gICAgd3JpdGUobWVzc2FnZSwgbGV2ZWwpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgbGV0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICBsZXQgc3RhbXAgPSBub3cuZ2V0RnVsbFllYXIoKSArICctJyArIG5vdy5nZXRNb250aCgpICsgJy0nICsgbm93LmdldERhdGUoKSArICdUJyArXG4gICAgICAgICAgICAgICAgbm93LmdldEhvdXJzKCkgKyAnOicgKyBub3cuZ2V0TWludXRlcygpICsgJzonICsgbm93LmdldFNlY29uZHMoKSArICc6JyArIG5vdy5nZXRNaWxsaXNlY29uZHMoKTtcblxuICAgICAgICAgICAgbWVzc2FnZSA9IHN0YW1wICsgJyAnICsgbWVzc2FnZTtcblxuICAgICAgICAgICAgbGV2ZWwgPSAobGV2ZWwgfHwgdGhpcy5jb25maWcubG9nTGV2ZWwgfHwgJ2RlYnVnJykudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgLy8gV3JpdGUgdG8gY29uc29sZSAtLSBjdXJyZW50bHksIGBsb2dgLCBgZGVidWdgLCBgaW5mb2AsIGB3YXJuYCwgYW5kIGBlcnJvcmBcbiAgICAgICAgICAgIC8vIGFyZSBhdmFpbGFibGVcbiAgICAgICAgICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUgKi9cbiAgICAgICAgICAgIGlmIChjb25zb2xlW2xldmVsXSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGVbbGV2ZWxdKG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignTG9nIGxldmVsIGRvZXMgbm90IGV4aXN0LicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBuby1jb25zb2xlICovXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc2V0TGV2ZWwobGV2ZWwpIHtcbiAgICAgICAgbGV2ZWwgPSBsZXZlbC50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgIGlmIChjb25zb2xlW2xldmVsXSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLmxvZ0xldmVsID0gbGV2ZWw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcignTG9nIGxldmVsIGRvZXMgbm90IGV4aXN0LicpO1xuICAgICAgICB9XG4gICAgfVxufTtcbiIsIi8qKlxuICogcmFuZG9tIC0tIEEgY29sbGVjdGlvbiBvZiByYW5kb20gZ2VuZXJhdG9yIGZ1bmN0aW9uc1xuICovXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgYSByYW5kb20gbnVtYmVyIGJldHdlZW4gdGhlIGdpdmVuIHN0YXJ0IGFuZCBlbmQgcG9pbnRzXG4gICAgICovXG4gICAgbnVtYmVyKGZyb20sIHRvPW51bGwpIHtcbiAgICAgICAgaWYgKHRvID09PSBudWxsKSB7XG4gICAgICAgICAgICB0byA9IGZyb207XG4gICAgICAgICAgICBmcm9tID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBNYXRoLnJhbmRvbSgpICogKHRvIC0gZnJvbSkgKyBmcm9tO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZSBhIHJhbmRvbSBpbnRlZ2VyIGJldHdlZW4gdGhlIGdpdmVuIHBvc2l0aW9uc1xuICAgICAqL1xuICAgIGludGVnZXIoLi4uYXJncykge1xuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcih0aGlzLm51bWJlciguLi5hcmdzKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGEgcmFuZG9tIG51bWJlciwgd2l0aCBhIHJhbmRvbSBzaWduLCBiZXR3ZWVuIHRoZSBnaXZlblxuICAgICAqIHBvc2l0aW9uc1xuICAgICAqL1xuICAgIGRpcmVjdGlvbmFsKC4uLmFyZ3MpIHtcbiAgICAgICAgbGV0IHJhbmQgPSB0aGlzLm51bWJlciguLi5hcmdzKTtcbiAgICAgICAgaWYgKE1hdGgucmFuZG9tKCkgPiAwLjUpIHtcbiAgICAgICAgICAgIHJhbmQgPSAtcmFuZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmFuZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgYSByYW5kb20gaGV4YWRlY2ltYWwgY29sb3JcbiAgICAgKi9cbiAgICBjb2xvcigpIHtcbiAgICAgICAgcmV0dXJuICcjJyArICgnMDAwMDAnICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMHgxMDAwMDAwKS50b1N0cmluZygxNikpLnN1YnN0cigtNik7XG4gICAgfVxufTtcbiIsIi8qKlxuICoganNjb2xvciAtIEphdmFTY3JpcHQgQ29sb3IgUGlja2VyXG4gKlxuICogQGxpbmsgICAgaHR0cDovL2pzY29sb3IuY29tXG4gKiBAbGljZW5zZSBGb3Igb3BlbiBzb3VyY2UgdXNlOiBHUEx2M1xuICogICAgICAgICAgRm9yIGNvbW1lcmNpYWwgdXNlOiBKU0NvbG9yIENvbW1lcmNpYWwgTGljZW5zZVxuICogQGF1dGhvciAgSmFuIE9kdmFya29cbiAqIEB2ZXJzaW9uIDIuMC40XG4gKlxuICogU2VlIHVzYWdlIGV4YW1wbGVzIGF0IGh0dHA6Ly9qc2NvbG9yLmNvbS9leGFtcGxlcy9cbiAqL1xuXG5cblwidXNlIHN0cmljdFwiO1xuXG5cbmlmICghd2luZG93LmpzY29sb3IpIHsgd2luZG93LmpzY29sb3IgPSAoZnVuY3Rpb24gKCkge1xuXG5cbnZhciBqc2MgPSB7XG5cblxuXHRyZWdpc3RlciA6IGZ1bmN0aW9uICgpIHtcblx0XHRqc2MuYXR0YWNoRE9NUmVhZHlFdmVudChqc2MuaW5pdCk7XG5cdFx0anNjLmF0dGFjaEV2ZW50KGRvY3VtZW50LCAnbW91c2Vkb3duJywganNjLm9uRG9jdW1lbnRNb3VzZURvd24pO1xuXHRcdGpzYy5hdHRhY2hFdmVudChkb2N1bWVudCwgJ3RvdWNoc3RhcnQnLCBqc2Mub25Eb2N1bWVudFRvdWNoU3RhcnQpO1xuXHRcdGpzYy5hdHRhY2hFdmVudCh3aW5kb3csICdyZXNpemUnLCBqc2Mub25XaW5kb3dSZXNpemUpO1xuXHR9LFxuXG5cblx0aW5pdCA6IGZ1bmN0aW9uICgpIHtcblx0XHRpZiAoanNjLmpzY29sb3IubG9va3VwQ2xhc3MpIHtcblx0XHRcdGpzYy5qc2NvbG9yLmluc3RhbGxCeUNsYXNzTmFtZShqc2MuanNjb2xvci5sb29rdXBDbGFzcyk7XG5cdFx0fVxuXHR9LFxuXG5cblx0dHJ5SW5zdGFsbE9uRWxlbWVudHMgOiBmdW5jdGlvbiAoZWxtcywgY2xhc3NOYW1lKSB7XG5cdFx0dmFyIG1hdGNoQ2xhc3MgPSBuZXcgUmVnRXhwKCcoXnxcXFxccykoJyArIGNsYXNzTmFtZSArICcpKFxcXFxzKihcXFxce1tefV0qXFxcXH0pfFxcXFxzfCQpJywgJ2knKTtcblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZWxtcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0aWYgKGVsbXNbaV0udHlwZSAhPT0gdW5kZWZpbmVkICYmIGVsbXNbaV0udHlwZS50b0xvd2VyQ2FzZSgpID09ICdjb2xvcicpIHtcblx0XHRcdFx0aWYgKGpzYy5pc0NvbG9yQXR0clN1cHBvcnRlZCkge1xuXHRcdFx0XHRcdC8vIHNraXAgaW5wdXRzIG9mIHR5cGUgJ2NvbG9yJyBpZiBzdXBwb3J0ZWQgYnkgdGhlIGJyb3dzZXJcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0dmFyIG07XG5cdFx0XHRpZiAoIWVsbXNbaV0uanNjb2xvciAmJiBlbG1zW2ldLmNsYXNzTmFtZSAmJiAobSA9IGVsbXNbaV0uY2xhc3NOYW1lLm1hdGNoKG1hdGNoQ2xhc3MpKSkge1xuXHRcdFx0XHR2YXIgdGFyZ2V0RWxtID0gZWxtc1tpXTtcblx0XHRcdFx0dmFyIG9wdHNTdHIgPSBudWxsO1xuXG5cdFx0XHRcdHZhciBkYXRhT3B0aW9ucyA9IGpzYy5nZXREYXRhQXR0cih0YXJnZXRFbG0sICdqc2NvbG9yJyk7XG5cdFx0XHRcdGlmIChkYXRhT3B0aW9ucyAhPT0gbnVsbCkge1xuXHRcdFx0XHRcdG9wdHNTdHIgPSBkYXRhT3B0aW9ucztcblx0XHRcdFx0fSBlbHNlIGlmIChtWzRdKSB7XG5cdFx0XHRcdFx0b3B0c1N0ciA9IG1bNF07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgb3B0cyA9IHt9O1xuXHRcdFx0XHRpZiAob3B0c1N0cikge1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRvcHRzID0gKG5ldyBGdW5jdGlvbiAoJ3JldHVybiAoJyArIG9wdHNTdHIgKyAnKScpKSgpO1xuXHRcdFx0XHRcdH0gY2F0Y2goZVBhcnNlRXJyb3IpIHtcblx0XHRcdFx0XHRcdGpzYy53YXJuKCdFcnJvciBwYXJzaW5nIGpzY29sb3Igb3B0aW9uczogJyArIGVQYXJzZUVycm9yICsgJzpcXG4nICsgb3B0c1N0cik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHRhcmdldEVsbS5qc2NvbG9yID0gbmV3IGpzYy5qc2NvbG9yKHRhcmdldEVsbSwgb3B0cyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0aXNDb2xvckF0dHJTdXBwb3J0ZWQgOiAoZnVuY3Rpb24gKCkge1xuXHRcdHZhciBlbG0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuXHRcdGlmIChlbG0uc2V0QXR0cmlidXRlKSB7XG5cdFx0XHRlbG0uc2V0QXR0cmlidXRlKCd0eXBlJywgJ2NvbG9yJyk7XG5cdFx0XHRpZiAoZWxtLnR5cGUudG9Mb3dlckNhc2UoKSA9PSAnY29sb3InKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0pKCksXG5cblxuXHRpc0NhbnZhc1N1cHBvcnRlZCA6IChmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGVsbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRcdHJldHVybiAhIShlbG0uZ2V0Q29udGV4dCAmJiBlbG0uZ2V0Q29udGV4dCgnMmQnKSk7XG5cdH0pKCksXG5cblxuXHRmZXRjaEVsZW1lbnQgOiBmdW5jdGlvbiAobWl4ZWQpIHtcblx0XHRyZXR1cm4gdHlwZW9mIG1peGVkID09PSAnc3RyaW5nJyA/IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG1peGVkKSA6IG1peGVkO1xuXHR9LFxuXG5cblx0aXNFbGVtZW50VHlwZSA6IGZ1bmN0aW9uIChlbG0sIHR5cGUpIHtcblx0XHRyZXR1cm4gZWxtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09IHR5cGUudG9Mb3dlckNhc2UoKTtcblx0fSxcblxuXG5cdGdldERhdGFBdHRyIDogZnVuY3Rpb24gKGVsLCBuYW1lKSB7XG5cdFx0dmFyIGF0dHJOYW1lID0gJ2RhdGEtJyArIG5hbWU7XG5cdFx0dmFyIGF0dHJWYWx1ZSA9IGVsLmdldEF0dHJpYnV0ZShhdHRyTmFtZSk7XG5cdFx0aWYgKGF0dHJWYWx1ZSAhPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIGF0dHJWYWx1ZTtcblx0XHR9XG5cdFx0cmV0dXJuIG51bGw7XG5cdH0sXG5cblxuXHRhdHRhY2hFdmVudCA6IGZ1bmN0aW9uIChlbCwgZXZudCwgZnVuYykge1xuXHRcdGlmIChlbC5hZGRFdmVudExpc3RlbmVyKSB7XG5cdFx0XHRlbC5hZGRFdmVudExpc3RlbmVyKGV2bnQsIGZ1bmMsIGZhbHNlKTtcblx0XHR9IGVsc2UgaWYgKGVsLmF0dGFjaEV2ZW50KSB7XG5cdFx0XHRlbC5hdHRhY2hFdmVudCgnb24nICsgZXZudCwgZnVuYyk7XG5cdFx0fVxuXHR9LFxuXG5cblx0ZGV0YWNoRXZlbnQgOiBmdW5jdGlvbiAoZWwsIGV2bnQsIGZ1bmMpIHtcblx0XHRpZiAoZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuXHRcdFx0ZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihldm50LCBmdW5jLCBmYWxzZSk7XG5cdFx0fSBlbHNlIGlmIChlbC5kZXRhY2hFdmVudCkge1xuXHRcdFx0ZWwuZGV0YWNoRXZlbnQoJ29uJyArIGV2bnQsIGZ1bmMpO1xuXHRcdH1cblx0fSxcblxuXG5cdF9hdHRhY2hlZEdyb3VwRXZlbnRzIDoge30sXG5cblxuXHRhdHRhY2hHcm91cEV2ZW50IDogZnVuY3Rpb24gKGdyb3VwTmFtZSwgZWwsIGV2bnQsIGZ1bmMpIHtcblx0XHRpZiAoIWpzYy5fYXR0YWNoZWRHcm91cEV2ZW50cy5oYXNPd25Qcm9wZXJ0eShncm91cE5hbWUpKSB7XG5cdFx0XHRqc2MuX2F0dGFjaGVkR3JvdXBFdmVudHNbZ3JvdXBOYW1lXSA9IFtdO1xuXHRcdH1cblx0XHRqc2MuX2F0dGFjaGVkR3JvdXBFdmVudHNbZ3JvdXBOYW1lXS5wdXNoKFtlbCwgZXZudCwgZnVuY10pO1xuXHRcdGpzYy5hdHRhY2hFdmVudChlbCwgZXZudCwgZnVuYyk7XG5cdH0sXG5cblxuXHRkZXRhY2hHcm91cEV2ZW50cyA6IGZ1bmN0aW9uIChncm91cE5hbWUpIHtcblx0XHRpZiAoanNjLl9hdHRhY2hlZEdyb3VwRXZlbnRzLmhhc093blByb3BlcnR5KGdyb3VwTmFtZSkpIHtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwganNjLl9hdHRhY2hlZEdyb3VwRXZlbnRzW2dyb3VwTmFtZV0ubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0dmFyIGV2dCA9IGpzYy5fYXR0YWNoZWRHcm91cEV2ZW50c1tncm91cE5hbWVdW2ldO1xuXHRcdFx0XHRqc2MuZGV0YWNoRXZlbnQoZXZ0WzBdLCBldnRbMV0sIGV2dFsyXSk7XG5cdFx0XHR9XG5cdFx0XHRkZWxldGUganNjLl9hdHRhY2hlZEdyb3VwRXZlbnRzW2dyb3VwTmFtZV07XG5cdFx0fVxuXHR9LFxuXG5cblx0YXR0YWNoRE9NUmVhZHlFdmVudCA6IGZ1bmN0aW9uIChmdW5jKSB7XG5cdFx0dmFyIGZpcmVkID0gZmFsc2U7XG5cdFx0dmFyIGZpcmVPbmNlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKCFmaXJlZCkge1xuXHRcdFx0XHRmaXJlZCA9IHRydWU7XG5cdFx0XHRcdGZ1bmMoKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0aWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcblx0XHRcdHNldFRpbWVvdXQoZmlyZU9uY2UsIDEpOyAvLyBhc3luY1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmIChkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKSB7XG5cdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZmlyZU9uY2UsIGZhbHNlKTtcblxuXHRcdFx0Ly8gRmFsbGJhY2tcblx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZmlyZU9uY2UsIGZhbHNlKTtcblxuXHRcdH0gZWxzZSBpZiAoZG9jdW1lbnQuYXR0YWNoRXZlbnQpIHtcblx0XHRcdC8vIElFXG5cdFx0XHRkb2N1bWVudC5hdHRhY2hFdmVudCgnb25yZWFkeXN0YXRlY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xuXHRcdFx0XHRcdGRvY3VtZW50LmRldGFjaEV2ZW50KCdvbnJlYWR5c3RhdGVjaGFuZ2UnLCBhcmd1bWVudHMuY2FsbGVlKTtcblx0XHRcdFx0XHRmaXJlT25jZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXG5cdFx0XHQvLyBGYWxsYmFja1xuXHRcdFx0d2luZG93LmF0dGFjaEV2ZW50KCdvbmxvYWQnLCBmaXJlT25jZSk7XG5cblx0XHRcdC8vIElFNy84XG5cdFx0XHRpZiAoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRvU2Nyb2xsICYmIHdpbmRvdyA9PSB3aW5kb3cudG9wKSB7XG5cdFx0XHRcdHZhciB0cnlTY3JvbGwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0aWYgKCFkb2N1bWVudC5ib2R5KSB7IHJldHVybjsgfVxuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZG9TY3JvbGwoJ2xlZnQnKTtcblx0XHRcdFx0XHRcdGZpcmVPbmNlKCk7XG5cdFx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdFx0c2V0VGltZW91dCh0cnlTY3JvbGwsIDEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblx0XHRcdFx0dHJ5U2Nyb2xsKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0d2FybiA6IGZ1bmN0aW9uIChtc2cpIHtcblx0XHRpZiAod2luZG93LmNvbnNvbGUgJiYgd2luZG93LmNvbnNvbGUud2Fybikge1xuXHRcdFx0d2luZG93LmNvbnNvbGUud2Fybihtc2cpO1xuXHRcdH1cblx0fSxcblxuXG5cdHByZXZlbnREZWZhdWx0IDogZnVuY3Rpb24gKGUpIHtcblx0XHRpZiAoZS5wcmV2ZW50RGVmYXVsdCkgeyBlLnByZXZlbnREZWZhdWx0KCk7IH1cblx0XHRlLnJldHVyblZhbHVlID0gZmFsc2U7XG5cdH0sXG5cblxuXHRjYXB0dXJlVGFyZ2V0IDogZnVuY3Rpb24gKHRhcmdldCkge1xuXHRcdC8vIElFXG5cdFx0aWYgKHRhcmdldC5zZXRDYXB0dXJlKSB7XG5cdFx0XHRqc2MuX2NhcHR1cmVkVGFyZ2V0ID0gdGFyZ2V0O1xuXHRcdFx0anNjLl9jYXB0dXJlZFRhcmdldC5zZXRDYXB0dXJlKCk7XG5cdFx0fVxuXHR9LFxuXG5cblx0cmVsZWFzZVRhcmdldCA6IGZ1bmN0aW9uICgpIHtcblx0XHQvLyBJRVxuXHRcdGlmIChqc2MuX2NhcHR1cmVkVGFyZ2V0KSB7XG5cdFx0XHRqc2MuX2NhcHR1cmVkVGFyZ2V0LnJlbGVhc2VDYXB0dXJlKCk7XG5cdFx0XHRqc2MuX2NhcHR1cmVkVGFyZ2V0ID0gbnVsbDtcblx0XHR9XG5cdH0sXG5cblxuXHRmaXJlRXZlbnQgOiBmdW5jdGlvbiAoZWwsIGV2bnQpIHtcblx0XHRpZiAoIWVsKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGlmIChkb2N1bWVudC5jcmVhdGVFdmVudCkge1xuXHRcdFx0dmFyIGV2ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0hUTUxFdmVudHMnKTtcblx0XHRcdGV2LmluaXRFdmVudChldm50LCB0cnVlLCB0cnVlKTtcblx0XHRcdGVsLmRpc3BhdGNoRXZlbnQoZXYpO1xuXHRcdH0gZWxzZSBpZiAoZG9jdW1lbnQuY3JlYXRlRXZlbnRPYmplY3QpIHtcblx0XHRcdHZhciBldiA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG5cdFx0XHRlbC5maXJlRXZlbnQoJ29uJyArIGV2bnQsIGV2KTtcblx0XHR9IGVsc2UgaWYgKGVsWydvbicgKyBldm50XSkgeyAvLyBhbHRlcm5hdGl2ZWx5IHVzZSB0aGUgdHJhZGl0aW9uYWwgZXZlbnQgbW9kZWxcblx0XHRcdGVsWydvbicgKyBldm50XSgpO1xuXHRcdH1cblx0fSxcblxuXG5cdGNsYXNzTmFtZVRvTGlzdCA6IGZ1bmN0aW9uIChjbGFzc05hbWUpIHtcblx0XHRyZXR1cm4gY2xhc3NOYW1lLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKS5zcGxpdCgvXFxzKy8pO1xuXHR9LFxuXG5cblx0Ly8gVGhlIGNsYXNzTmFtZSBwYXJhbWV0ZXIgKHN0cikgY2FuIG9ubHkgY29udGFpbiBhIHNpbmdsZSBjbGFzcyBuYW1lXG5cdGhhc0NsYXNzIDogZnVuY3Rpb24gKGVsbSwgY2xhc3NOYW1lKSB7XG5cdFx0aWYgKCFjbGFzc05hbWUpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0cmV0dXJuIC0xICE9ICgnICcgKyBlbG0uY2xhc3NOYW1lLnJlcGxhY2UoL1xccysvZywgJyAnKSArICcgJykuaW5kZXhPZignICcgKyBjbGFzc05hbWUgKyAnICcpO1xuXHR9LFxuXG5cblx0Ly8gVGhlIGNsYXNzTmFtZSBwYXJhbWV0ZXIgKHN0cikgY2FuIGNvbnRhaW4gbXVsdGlwbGUgY2xhc3MgbmFtZXMgc2VwYXJhdGVkIGJ5IHdoaXRlc3BhY2Vcblx0c2V0Q2xhc3MgOiBmdW5jdGlvbiAoZWxtLCBjbGFzc05hbWUpIHtcblx0XHR2YXIgY2xhc3NMaXN0ID0ganNjLmNsYXNzTmFtZVRvTGlzdChjbGFzc05hbWUpO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgY2xhc3NMaXN0Lmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRpZiAoIWpzYy5oYXNDbGFzcyhlbG0sIGNsYXNzTGlzdFtpXSkpIHtcblx0XHRcdFx0ZWxtLmNsYXNzTmFtZSArPSAoZWxtLmNsYXNzTmFtZSA/ICcgJyA6ICcnKSArIGNsYXNzTGlzdFtpXTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblxuXHQvLyBUaGUgY2xhc3NOYW1lIHBhcmFtZXRlciAoc3RyKSBjYW4gY29udGFpbiBtdWx0aXBsZSBjbGFzcyBuYW1lcyBzZXBhcmF0ZWQgYnkgd2hpdGVzcGFjZVxuXHR1bnNldENsYXNzIDogZnVuY3Rpb24gKGVsbSwgY2xhc3NOYW1lKSB7XG5cdFx0dmFyIGNsYXNzTGlzdCA9IGpzYy5jbGFzc05hbWVUb0xpc3QoY2xhc3NOYW1lKTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGNsYXNzTGlzdC5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0dmFyIHJlcGwgPSBuZXcgUmVnRXhwKFxuXHRcdFx0XHQnXlxcXFxzKicgKyBjbGFzc0xpc3RbaV0gKyAnXFxcXHMqfCcgK1xuXHRcdFx0XHQnXFxcXHMqJyArIGNsYXNzTGlzdFtpXSArICdcXFxccyokfCcgK1xuXHRcdFx0XHQnXFxcXHMrJyArIGNsYXNzTGlzdFtpXSArICcoXFxcXHMrKScsXG5cdFx0XHRcdCdnJ1xuXHRcdFx0KTtcblx0XHRcdGVsbS5jbGFzc05hbWUgPSBlbG0uY2xhc3NOYW1lLnJlcGxhY2UocmVwbCwgJyQxJyk7XG5cdFx0fVxuXHR9LFxuXG5cblx0Z2V0U3R5bGUgOiBmdW5jdGlvbiAoZWxtKSB7XG5cdFx0cmV0dXJuIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlID8gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxtKSA6IGVsbS5jdXJyZW50U3R5bGU7XG5cdH0sXG5cblxuXHRzZXRTdHlsZSA6IChmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGhlbHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdHZhciBnZXRTdXBwb3J0ZWRQcm9wID0gZnVuY3Rpb24gKG5hbWVzKSB7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IG5hbWVzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdGlmIChuYW1lc1tpXSBpbiBoZWxwZXIuc3R5bGUpIHtcblx0XHRcdFx0XHRyZXR1cm4gbmFtZXNbaV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXHRcdHZhciBwcm9wcyA9IHtcblx0XHRcdGJvcmRlclJhZGl1czogZ2V0U3VwcG9ydGVkUHJvcChbJ2JvcmRlclJhZGl1cycsICdNb3pCb3JkZXJSYWRpdXMnLCAnd2Via2l0Qm9yZGVyUmFkaXVzJ10pLFxuXHRcdFx0Ym94U2hhZG93OiBnZXRTdXBwb3J0ZWRQcm9wKFsnYm94U2hhZG93JywgJ01vekJveFNoYWRvdycsICd3ZWJraXRCb3hTaGFkb3cnXSlcblx0XHR9O1xuXHRcdHJldHVybiBmdW5jdGlvbiAoZWxtLCBwcm9wLCB2YWx1ZSkge1xuXHRcdFx0c3dpdGNoIChwcm9wLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRcdGNhc2UgJ29wYWNpdHknOlxuXHRcdFx0XHR2YXIgYWxwaGFPcGFjaXR5ID0gTWF0aC5yb3VuZChwYXJzZUZsb2F0KHZhbHVlKSAqIDEwMCk7XG5cdFx0XHRcdGVsbS5zdHlsZS5vcGFjaXR5ID0gdmFsdWU7XG5cdFx0XHRcdGVsbS5zdHlsZS5maWx0ZXIgPSAnYWxwaGEob3BhY2l0eT0nICsgYWxwaGFPcGFjaXR5ICsgJyknO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdGVsbS5zdHlsZVtwcm9wc1twcm9wXV0gPSB2YWx1ZTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSkoKSxcblxuXG5cdHNldEJvcmRlclJhZGl1cyA6IGZ1bmN0aW9uIChlbG0sIHZhbHVlKSB7XG5cdFx0anNjLnNldFN0eWxlKGVsbSwgJ2JvcmRlclJhZGl1cycsIHZhbHVlIHx8ICcwJyk7XG5cdH0sXG5cblxuXHRzZXRCb3hTaGFkb3cgOiBmdW5jdGlvbiAoZWxtLCB2YWx1ZSkge1xuXHRcdGpzYy5zZXRTdHlsZShlbG0sICdib3hTaGFkb3cnLCB2YWx1ZSB8fCAnbm9uZScpO1xuXHR9LFxuXG5cblx0Z2V0RWxlbWVudFBvcyA6IGZ1bmN0aW9uIChlLCByZWxhdGl2ZVRvVmlld3BvcnQpIHtcblx0XHR2YXIgeD0wLCB5PTA7XG5cdFx0dmFyIHJlY3QgPSBlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdHggPSByZWN0LmxlZnQ7XG5cdFx0eSA9IHJlY3QudG9wO1xuXHRcdGlmICghcmVsYXRpdmVUb1ZpZXdwb3J0KSB7XG5cdFx0XHR2YXIgdmlld1BvcyA9IGpzYy5nZXRWaWV3UG9zKCk7XG5cdFx0XHR4ICs9IHZpZXdQb3NbMF07XG5cdFx0XHR5ICs9IHZpZXdQb3NbMV07XG5cdFx0fVxuXHRcdHJldHVybiBbeCwgeV07XG5cdH0sXG5cblxuXHRnZXRFbGVtZW50U2l6ZSA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0cmV0dXJuIFtlLm9mZnNldFdpZHRoLCBlLm9mZnNldEhlaWdodF07XG5cdH0sXG5cblxuXHQvLyBnZXQgcG9pbnRlcidzIFgvWSBjb29yZGluYXRlcyByZWxhdGl2ZSB0byB2aWV3cG9ydFxuXHRnZXRBYnNQb2ludGVyUG9zIDogZnVuY3Rpb24gKGUpIHtcblx0XHRpZiAoIWUpIHsgZSA9IHdpbmRvdy5ldmVudDsgfVxuXHRcdHZhciB4ID0gMCwgeSA9IDA7XG5cdFx0aWYgKHR5cGVvZiBlLmNoYW5nZWRUb3VjaGVzICE9PSAndW5kZWZpbmVkJyAmJiBlLmNoYW5nZWRUb3VjaGVzLmxlbmd0aCkge1xuXHRcdFx0Ly8gdG91Y2ggZGV2aWNlc1xuXHRcdFx0eCA9IGUuY2hhbmdlZFRvdWNoZXNbMF0uY2xpZW50WDtcblx0XHRcdHkgPSBlLmNoYW5nZWRUb3VjaGVzWzBdLmNsaWVudFk7XG5cdFx0fSBlbHNlIGlmICh0eXBlb2YgZS5jbGllbnRYID09PSAnbnVtYmVyJykge1xuXHRcdFx0eCA9IGUuY2xpZW50WDtcblx0XHRcdHkgPSBlLmNsaWVudFk7XG5cdFx0fVxuXHRcdHJldHVybiB7IHg6IHgsIHk6IHkgfTtcblx0fSxcblxuXG5cdC8vIGdldCBwb2ludGVyJ3MgWC9ZIGNvb3JkaW5hdGVzIHJlbGF0aXZlIHRvIHRhcmdldCBlbGVtZW50XG5cdGdldFJlbFBvaW50ZXJQb3MgOiBmdW5jdGlvbiAoZSkge1xuXHRcdGlmICghZSkgeyBlID0gd2luZG93LmV2ZW50OyB9XG5cdFx0dmFyIHRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcblx0XHR2YXIgdGFyZ2V0UmVjdCA9IHRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuXHRcdHZhciB4ID0gMCwgeSA9IDA7XG5cblx0XHR2YXIgY2xpZW50WCA9IDAsIGNsaWVudFkgPSAwO1xuXHRcdGlmICh0eXBlb2YgZS5jaGFuZ2VkVG91Y2hlcyAhPT0gJ3VuZGVmaW5lZCcgJiYgZS5jaGFuZ2VkVG91Y2hlcy5sZW5ndGgpIHtcblx0XHRcdC8vIHRvdWNoIGRldmljZXNcblx0XHRcdGNsaWVudFggPSBlLmNoYW5nZWRUb3VjaGVzWzBdLmNsaWVudFg7XG5cdFx0XHRjbGllbnRZID0gZS5jaGFuZ2VkVG91Y2hlc1swXS5jbGllbnRZO1xuXHRcdH0gZWxzZSBpZiAodHlwZW9mIGUuY2xpZW50WCA9PT0gJ251bWJlcicpIHtcblx0XHRcdGNsaWVudFggPSBlLmNsaWVudFg7XG5cdFx0XHRjbGllbnRZID0gZS5jbGllbnRZO1xuXHRcdH1cblxuXHRcdHggPSBjbGllbnRYIC0gdGFyZ2V0UmVjdC5sZWZ0O1xuXHRcdHkgPSBjbGllbnRZIC0gdGFyZ2V0UmVjdC50b3A7XG5cdFx0cmV0dXJuIHsgeDogeCwgeTogeSB9O1xuXHR9LFxuXG5cblx0Z2V0Vmlld1BvcyA6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZG9jID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuXHRcdHJldHVybiBbXG5cdFx0XHQod2luZG93LnBhZ2VYT2Zmc2V0IHx8IGRvYy5zY3JvbGxMZWZ0KSAtIChkb2MuY2xpZW50TGVmdCB8fCAwKSxcblx0XHRcdCh3aW5kb3cucGFnZVlPZmZzZXQgfHwgZG9jLnNjcm9sbFRvcCkgLSAoZG9jLmNsaWVudFRvcCB8fCAwKVxuXHRcdF07XG5cdH0sXG5cblxuXHRnZXRWaWV3U2l6ZSA6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZG9jID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuXHRcdHJldHVybiBbXG5cdFx0XHQod2luZG93LmlubmVyV2lkdGggfHwgZG9jLmNsaWVudFdpZHRoKSxcblx0XHRcdCh3aW5kb3cuaW5uZXJIZWlnaHQgfHwgZG9jLmNsaWVudEhlaWdodCksXG5cdFx0XTtcblx0fSxcblxuXG5cdHJlZHJhd1Bvc2l0aW9uIDogZnVuY3Rpb24gKCkge1xuXG5cdFx0aWYgKGpzYy5waWNrZXIgJiYganNjLnBpY2tlci5vd25lcikge1xuXHRcdFx0dmFyIHRoaXNPYmogPSBqc2MucGlja2VyLm93bmVyO1xuXG5cdFx0XHR2YXIgdHAsIHZwO1xuXG5cdFx0XHRpZiAodGhpc09iai5maXhlZCkge1xuXHRcdFx0XHQvLyBGaXhlZCBlbGVtZW50cyBhcmUgcG9zaXRpb25lZCByZWxhdGl2ZSB0byB2aWV3cG9ydCxcblx0XHRcdFx0Ly8gdGhlcmVmb3JlIHdlIGNhbiBpZ25vcmUgdGhlIHNjcm9sbCBvZmZzZXRcblx0XHRcdFx0dHAgPSBqc2MuZ2V0RWxlbWVudFBvcyh0aGlzT2JqLnRhcmdldEVsZW1lbnQsIHRydWUpOyAvLyB0YXJnZXQgcG9zXG5cdFx0XHRcdHZwID0gWzAsIDBdOyAvLyB2aWV3IHBvc1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dHAgPSBqc2MuZ2V0RWxlbWVudFBvcyh0aGlzT2JqLnRhcmdldEVsZW1lbnQpOyAvLyB0YXJnZXQgcG9zXG5cdFx0XHRcdHZwID0ganNjLmdldFZpZXdQb3MoKTsgLy8gdmlldyBwb3Ncblx0XHRcdH1cblxuXHRcdFx0dmFyIHRzID0ganNjLmdldEVsZW1lbnRTaXplKHRoaXNPYmoudGFyZ2V0RWxlbWVudCk7IC8vIHRhcmdldCBzaXplXG5cdFx0XHR2YXIgdnMgPSBqc2MuZ2V0Vmlld1NpemUoKTsgLy8gdmlldyBzaXplXG5cdFx0XHR2YXIgcHMgPSBqc2MuZ2V0UGlja2VyT3V0ZXJEaW1zKHRoaXNPYmopOyAvLyBwaWNrZXIgc2l6ZVxuXHRcdFx0dmFyIGEsIGIsIGM7XG5cdFx0XHRzd2l0Y2ggKHRoaXNPYmoucG9zaXRpb24udG9Mb3dlckNhc2UoKSkge1xuXHRcdFx0XHRjYXNlICdsZWZ0JzogYT0xOyBiPTA7IGM9LTE7IGJyZWFrO1xuXHRcdFx0XHRjYXNlICdyaWdodCc6YT0xOyBiPTA7IGM9MTsgYnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3RvcCc6ICBhPTA7IGI9MTsgYz0tMTsgYnJlYWs7XG5cdFx0XHRcdGRlZmF1bHQ6ICAgICBhPTA7IGI9MTsgYz0xOyBicmVhaztcblx0XHRcdH1cblx0XHRcdHZhciBsID0gKHRzW2JdK3BzW2JdKS8yO1xuXG5cdFx0XHQvLyBjb21wdXRlIHBpY2tlciBwb3NpdGlvblxuXHRcdFx0aWYgKCF0aGlzT2JqLnNtYXJ0UG9zaXRpb24pIHtcblx0XHRcdFx0dmFyIHBwID0gW1xuXHRcdFx0XHRcdHRwW2FdLFxuXHRcdFx0XHRcdHRwW2JdK3RzW2JdLWwrbCpjXG5cdFx0XHRcdF07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR2YXIgcHAgPSBbXG5cdFx0XHRcdFx0LXZwW2FdK3RwW2FdK3BzW2FdID4gdnNbYV0gP1xuXHRcdFx0XHRcdFx0KC12cFthXSt0cFthXSt0c1thXS8yID4gdnNbYV0vMiAmJiB0cFthXSt0c1thXS1wc1thXSA+PSAwID8gdHBbYV0rdHNbYV0tcHNbYV0gOiB0cFthXSkgOlxuXHRcdFx0XHRcdFx0dHBbYV0sXG5cdFx0XHRcdFx0LXZwW2JdK3RwW2JdK3RzW2JdK3BzW2JdLWwrbCpjID4gdnNbYl0gP1xuXHRcdFx0XHRcdFx0KC12cFtiXSt0cFtiXSt0c1tiXS8yID4gdnNbYl0vMiAmJiB0cFtiXSt0c1tiXS1sLWwqYyA+PSAwID8gdHBbYl0rdHNbYl0tbC1sKmMgOiB0cFtiXSt0c1tiXS1sK2wqYykgOlxuXHRcdFx0XHRcdFx0KHRwW2JdK3RzW2JdLWwrbCpjID49IDAgPyB0cFtiXSt0c1tiXS1sK2wqYyA6IHRwW2JdK3RzW2JdLWwtbCpjKVxuXHRcdFx0XHRdO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgeCA9IHBwW2FdO1xuXHRcdFx0dmFyIHkgPSBwcFtiXTtcblx0XHRcdHZhciBwb3NpdGlvblZhbHVlID0gdGhpc09iai5maXhlZCA/ICdmaXhlZCcgOiAnYWJzb2x1dGUnO1xuXHRcdFx0dmFyIGNvbnRyYWN0U2hhZG93ID1cblx0XHRcdFx0KHBwWzBdICsgcHNbMF0gPiB0cFswXSB8fCBwcFswXSA8IHRwWzBdICsgdHNbMF0pICYmXG5cdFx0XHRcdChwcFsxXSArIHBzWzFdIDwgdHBbMV0gKyB0c1sxXSk7XG5cblx0XHRcdGpzYy5fZHJhd1Bvc2l0aW9uKHRoaXNPYmosIHgsIHksIHBvc2l0aW9uVmFsdWUsIGNvbnRyYWN0U2hhZG93KTtcblx0XHR9XG5cdH0sXG5cblxuXHRfZHJhd1Bvc2l0aW9uIDogZnVuY3Rpb24gKHRoaXNPYmosIHgsIHksIHBvc2l0aW9uVmFsdWUsIGNvbnRyYWN0U2hhZG93KSB7XG5cdFx0dmFyIHZTaGFkb3cgPSBjb250cmFjdFNoYWRvdyA/IDAgOiB0aGlzT2JqLnNoYWRvd0JsdXI7IC8vIHB4XG5cblx0XHRqc2MucGlja2VyLndyYXAuc3R5bGUucG9zaXRpb24gPSBwb3NpdGlvblZhbHVlO1xuXHRcdGpzYy5waWNrZXIud3JhcC5zdHlsZS5sZWZ0ID0geCArICdweCc7XG5cdFx0anNjLnBpY2tlci53cmFwLnN0eWxlLnRvcCA9IHkgKyAncHgnO1xuXG5cdFx0anNjLnNldEJveFNoYWRvdyhcblx0XHRcdGpzYy5waWNrZXIuYm94Uyxcblx0XHRcdHRoaXNPYmouc2hhZG93ID9cblx0XHRcdFx0bmV3IGpzYy5Cb3hTaGFkb3coMCwgdlNoYWRvdywgdGhpc09iai5zaGFkb3dCbHVyLCAwLCB0aGlzT2JqLnNoYWRvd0NvbG9yKSA6XG5cdFx0XHRcdG51bGwpO1xuXHR9LFxuXG5cblx0Z2V0UGlja2VyRGltcyA6IGZ1bmN0aW9uICh0aGlzT2JqKSB7XG5cdFx0dmFyIGRpc3BsYXlTbGlkZXIgPSAhIWpzYy5nZXRTbGlkZXJDb21wb25lbnQodGhpc09iaik7XG5cdFx0dmFyIGRpbXMgPSBbXG5cdFx0XHQyICogdGhpc09iai5pbnNldFdpZHRoICsgMiAqIHRoaXNPYmoucGFkZGluZyArIHRoaXNPYmoud2lkdGggK1xuXHRcdFx0XHQoZGlzcGxheVNsaWRlciA/IDIgKiB0aGlzT2JqLmluc2V0V2lkdGggKyBqc2MuZ2V0UGFkVG9TbGlkZXJQYWRkaW5nKHRoaXNPYmopICsgdGhpc09iai5zbGlkZXJTaXplIDogMCksXG5cdFx0XHQyICogdGhpc09iai5pbnNldFdpZHRoICsgMiAqIHRoaXNPYmoucGFkZGluZyArIHRoaXNPYmouaGVpZ2h0ICtcblx0XHRcdFx0KHRoaXNPYmouY2xvc2FibGUgPyAyICogdGhpc09iai5pbnNldFdpZHRoICsgdGhpc09iai5wYWRkaW5nICsgdGhpc09iai5idXR0b25IZWlnaHQgOiAwKVxuXHRcdF07XG5cdFx0cmV0dXJuIGRpbXM7XG5cdH0sXG5cblxuXHRnZXRQaWNrZXJPdXRlckRpbXMgOiBmdW5jdGlvbiAodGhpc09iaikge1xuXHRcdHZhciBkaW1zID0ganNjLmdldFBpY2tlckRpbXModGhpc09iaik7XG5cdFx0cmV0dXJuIFtcblx0XHRcdGRpbXNbMF0gKyAyICogdGhpc09iai5ib3JkZXJXaWR0aCxcblx0XHRcdGRpbXNbMV0gKyAyICogdGhpc09iai5ib3JkZXJXaWR0aFxuXHRcdF07XG5cdH0sXG5cblxuXHRnZXRQYWRUb1NsaWRlclBhZGRpbmcgOiBmdW5jdGlvbiAodGhpc09iaikge1xuXHRcdHJldHVybiBNYXRoLm1heCh0aGlzT2JqLnBhZGRpbmcsIDEuNSAqICgyICogdGhpc09iai5wb2ludGVyQm9yZGVyV2lkdGggKyB0aGlzT2JqLnBvaW50ZXJUaGlja25lc3MpKTtcblx0fSxcblxuXG5cdGdldFBhZFlDb21wb25lbnQgOiBmdW5jdGlvbiAodGhpc09iaikge1xuXHRcdHN3aXRjaCAodGhpc09iai5tb2RlLmNoYXJBdCgxKS50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0XHRjYXNlICd2JzogcmV0dXJuICd2JzsgYnJlYWs7XG5cdFx0fVxuXHRcdHJldHVybiAncyc7XG5cdH0sXG5cblxuXHRnZXRTbGlkZXJDb21wb25lbnQgOiBmdW5jdGlvbiAodGhpc09iaikge1xuXHRcdGlmICh0aGlzT2JqLm1vZGUubGVuZ3RoID4gMikge1xuXHRcdFx0c3dpdGNoICh0aGlzT2JqLm1vZGUuY2hhckF0KDIpLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRcdFx0Y2FzZSAncyc6IHJldHVybiAncyc7IGJyZWFrO1xuXHRcdFx0XHRjYXNlICd2JzogcmV0dXJuICd2JzsgYnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBudWxsO1xuXHR9LFxuXG5cblx0b25Eb2N1bWVudE1vdXNlRG93biA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0aWYgKCFlKSB7IGUgPSB3aW5kb3cuZXZlbnQ7IH1cblx0XHR2YXIgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuXG5cdFx0aWYgKHRhcmdldC5fanNjTGlua2VkSW5zdGFuY2UpIHtcblx0XHRcdGlmICh0YXJnZXQuX2pzY0xpbmtlZEluc3RhbmNlLnNob3dPbkNsaWNrKSB7XG5cdFx0XHRcdHRhcmdldC5fanNjTGlua2VkSW5zdGFuY2Uuc2hvdygpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAodGFyZ2V0Ll9qc2NDb250cm9sTmFtZSkge1xuXHRcdFx0anNjLm9uQ29udHJvbFBvaW50ZXJTdGFydChlLCB0YXJnZXQsIHRhcmdldC5fanNjQ29udHJvbE5hbWUsICdtb3VzZScpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBNb3VzZSBpcyBvdXRzaWRlIHRoZSBwaWNrZXIgY29udHJvbHMgLT4gaGlkZSB0aGUgY29sb3IgcGlja2VyIVxuXHRcdFx0aWYgKGpzYy5waWNrZXIgJiYganNjLnBpY2tlci5vd25lcikge1xuXHRcdFx0XHRqc2MucGlja2VyLm93bmVyLmhpZGUoKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblxuXHRvbkRvY3VtZW50VG91Y2hTdGFydCA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0aWYgKCFlKSB7IGUgPSB3aW5kb3cuZXZlbnQ7IH1cblx0XHR2YXIgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuXG5cdFx0aWYgKHRhcmdldC5fanNjTGlua2VkSW5zdGFuY2UpIHtcblx0XHRcdGlmICh0YXJnZXQuX2pzY0xpbmtlZEluc3RhbmNlLnNob3dPbkNsaWNrKSB7XG5cdFx0XHRcdHRhcmdldC5fanNjTGlua2VkSW5zdGFuY2Uuc2hvdygpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAodGFyZ2V0Ll9qc2NDb250cm9sTmFtZSkge1xuXHRcdFx0anNjLm9uQ29udHJvbFBvaW50ZXJTdGFydChlLCB0YXJnZXQsIHRhcmdldC5fanNjQ29udHJvbE5hbWUsICd0b3VjaCcpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAoanNjLnBpY2tlciAmJiBqc2MucGlja2VyLm93bmVyKSB7XG5cdFx0XHRcdGpzYy5waWNrZXIub3duZXIuaGlkZSgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXG5cdG9uV2luZG93UmVzaXplIDogZnVuY3Rpb24gKGUpIHtcblx0XHRqc2MucmVkcmF3UG9zaXRpb24oKTtcblx0fSxcblxuXG5cdG9uUGFyZW50U2Nyb2xsIDogZnVuY3Rpb24gKGUpIHtcblx0XHQvLyBoaWRlIHRoZSBwaWNrZXIgd2hlbiBvbmUgb2YgdGhlIHBhcmVudCBlbGVtZW50cyBpcyBzY3JvbGxlZFxuXHRcdGlmIChqc2MucGlja2VyICYmIGpzYy5waWNrZXIub3duZXIpIHtcblx0XHRcdGpzYy5waWNrZXIub3duZXIuaGlkZSgpO1xuXHRcdH1cblx0fSxcblxuXG5cdF9wb2ludGVyTW92ZUV2ZW50IDoge1xuXHRcdG1vdXNlOiAnbW91c2Vtb3ZlJyxcblx0XHR0b3VjaDogJ3RvdWNobW92ZSdcblx0fSxcblx0X3BvaW50ZXJFbmRFdmVudCA6IHtcblx0XHRtb3VzZTogJ21vdXNldXAnLFxuXHRcdHRvdWNoOiAndG91Y2hlbmQnXG5cdH0sXG5cblxuXHRfcG9pbnRlck9yaWdpbiA6IG51bGwsXG5cdF9jYXB0dXJlZFRhcmdldCA6IG51bGwsXG5cblxuXHRvbkNvbnRyb2xQb2ludGVyU3RhcnQgOiBmdW5jdGlvbiAoZSwgdGFyZ2V0LCBjb250cm9sTmFtZSwgcG9pbnRlclR5cGUpIHtcblx0XHR2YXIgdGhpc09iaiA9IHRhcmdldC5fanNjSW5zdGFuY2U7XG5cblx0XHRqc2MucHJldmVudERlZmF1bHQoZSk7XG5cdFx0anNjLmNhcHR1cmVUYXJnZXQodGFyZ2V0KTtcblxuXHRcdHZhciByZWdpc3RlckRyYWdFdmVudHMgPSBmdW5jdGlvbiAoZG9jLCBvZmZzZXQpIHtcblx0XHRcdGpzYy5hdHRhY2hHcm91cEV2ZW50KCdkcmFnJywgZG9jLCBqc2MuX3BvaW50ZXJNb3ZlRXZlbnRbcG9pbnRlclR5cGVdLFxuXHRcdFx0XHRqc2Mub25Eb2N1bWVudFBvaW50ZXJNb3ZlKGUsIHRhcmdldCwgY29udHJvbE5hbWUsIHBvaW50ZXJUeXBlLCBvZmZzZXQpKTtcblx0XHRcdGpzYy5hdHRhY2hHcm91cEV2ZW50KCdkcmFnJywgZG9jLCBqc2MuX3BvaW50ZXJFbmRFdmVudFtwb2ludGVyVHlwZV0sXG5cdFx0XHRcdGpzYy5vbkRvY3VtZW50UG9pbnRlckVuZChlLCB0YXJnZXQsIGNvbnRyb2xOYW1lLCBwb2ludGVyVHlwZSkpO1xuXHRcdH07XG5cblx0XHRyZWdpc3RlckRyYWdFdmVudHMoZG9jdW1lbnQsIFswLCAwXSk7XG5cblx0XHRpZiAod2luZG93LnBhcmVudCAmJiB3aW5kb3cuZnJhbWVFbGVtZW50KSB7XG5cdFx0XHR2YXIgcmVjdCA9IHdpbmRvdy5mcmFtZUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdFx0XHR2YXIgb2ZzID0gWy1yZWN0LmxlZnQsIC1yZWN0LnRvcF07XG5cdFx0XHRyZWdpc3RlckRyYWdFdmVudHMod2luZG93LnBhcmVudC53aW5kb3cuZG9jdW1lbnQsIG9mcyk7XG5cdFx0fVxuXG5cdFx0dmFyIGFicyA9IGpzYy5nZXRBYnNQb2ludGVyUG9zKGUpO1xuXHRcdHZhciByZWwgPSBqc2MuZ2V0UmVsUG9pbnRlclBvcyhlKTtcblx0XHRqc2MuX3BvaW50ZXJPcmlnaW4gPSB7XG5cdFx0XHR4OiBhYnMueCAtIHJlbC54LFxuXHRcdFx0eTogYWJzLnkgLSByZWwueVxuXHRcdH07XG5cblx0XHRzd2l0Y2ggKGNvbnRyb2xOYW1lKSB7XG5cdFx0Y2FzZSAncGFkJzpcblx0XHRcdC8vIGlmIHRoZSBzbGlkZXIgaXMgYXQgdGhlIGJvdHRvbSwgbW92ZSBpdCB1cFxuXHRcdFx0c3dpdGNoIChqc2MuZ2V0U2xpZGVyQ29tcG9uZW50KHRoaXNPYmopKSB7XG5cdFx0XHRjYXNlICdzJzogaWYgKHRoaXNPYmouaHN2WzFdID09PSAwKSB7IHRoaXNPYmouZnJvbUhTVihudWxsLCAxMDAsIG51bGwpOyB9OyBicmVhaztcblx0XHRcdGNhc2UgJ3YnOiBpZiAodGhpc09iai5oc3ZbMl0gPT09IDApIHsgdGhpc09iai5mcm9tSFNWKG51bGwsIG51bGwsIDEwMCk7IH07IGJyZWFrO1xuXHRcdFx0fVxuXHRcdFx0anNjLnNldFBhZCh0aGlzT2JqLCBlLCAwLCAwKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSAnc2xkJzpcblx0XHRcdGpzYy5zZXRTbGQodGhpc09iaiwgZSwgMCk7XG5cdFx0XHRicmVhaztcblx0XHR9XG5cblx0XHRqc2MuZGlzcGF0Y2hGaW5lQ2hhbmdlKHRoaXNPYmopO1xuXHR9LFxuXG5cblx0b25Eb2N1bWVudFBvaW50ZXJNb3ZlIDogZnVuY3Rpb24gKGUsIHRhcmdldCwgY29udHJvbE5hbWUsIHBvaW50ZXJUeXBlLCBvZmZzZXQpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKGUpIHtcblx0XHRcdHZhciB0aGlzT2JqID0gdGFyZ2V0Ll9qc2NJbnN0YW5jZTtcblx0XHRcdHN3aXRjaCAoY29udHJvbE5hbWUpIHtcblx0XHRcdGNhc2UgJ3BhZCc6XG5cdFx0XHRcdGlmICghZSkgeyBlID0gd2luZG93LmV2ZW50OyB9XG5cdFx0XHRcdGpzYy5zZXRQYWQodGhpc09iaiwgZSwgb2Zmc2V0WzBdLCBvZmZzZXRbMV0pO1xuXHRcdFx0XHRqc2MuZGlzcGF0Y2hGaW5lQ2hhbmdlKHRoaXNPYmopO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSAnc2xkJzpcblx0XHRcdFx0aWYgKCFlKSB7IGUgPSB3aW5kb3cuZXZlbnQ7IH1cblx0XHRcdFx0anNjLnNldFNsZCh0aGlzT2JqLCBlLCBvZmZzZXRbMV0pO1xuXHRcdFx0XHRqc2MuZGlzcGF0Y2hGaW5lQ2hhbmdlKHRoaXNPYmopO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblxuXHRvbkRvY3VtZW50UG9pbnRlckVuZCA6IGZ1bmN0aW9uIChlLCB0YXJnZXQsIGNvbnRyb2xOYW1lLCBwb2ludGVyVHlwZSkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAoZSkge1xuXHRcdFx0dmFyIHRoaXNPYmogPSB0YXJnZXQuX2pzY0luc3RhbmNlO1xuXHRcdFx0anNjLmRldGFjaEdyb3VwRXZlbnRzKCdkcmFnJyk7XG5cdFx0XHRqc2MucmVsZWFzZVRhcmdldCgpO1xuXHRcdFx0Ly8gQWx3YXlzIGRpc3BhdGNoIGNoYW5nZXMgYWZ0ZXIgZGV0YWNoaW5nIG91dHN0YW5kaW5nIG1vdXNlIGhhbmRsZXJzLFxuXHRcdFx0Ly8gaW4gY2FzZSBzb21lIHVzZXIgaW50ZXJhY3Rpb24gd2lsbCBvY2N1ciBpbiB1c2VyJ3Mgb25jaGFuZ2UgY2FsbGJhY2tcblx0XHRcdC8vIHRoYXQgd291bGQgaW50cnVkZSB3aXRoIGN1cnJlbnQgbW91c2UgZXZlbnRzXG5cdFx0XHRqc2MuZGlzcGF0Y2hDaGFuZ2UodGhpc09iaik7XG5cdFx0fTtcblx0fSxcblxuXG5cdGRpc3BhdGNoQ2hhbmdlIDogZnVuY3Rpb24gKHRoaXNPYmopIHtcblx0XHRpZiAodGhpc09iai52YWx1ZUVsZW1lbnQpIHtcblx0XHRcdGlmIChqc2MuaXNFbGVtZW50VHlwZSh0aGlzT2JqLnZhbHVlRWxlbWVudCwgJ2lucHV0JykpIHtcblx0XHRcdFx0anNjLmZpcmVFdmVudCh0aGlzT2JqLnZhbHVlRWxlbWVudCwgJ2NoYW5nZScpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXG5cdGRpc3BhdGNoRmluZUNoYW5nZSA6IGZ1bmN0aW9uICh0aGlzT2JqKSB7XG5cdFx0aWYgKHRoaXNPYmoub25GaW5lQ2hhbmdlKSB7XG5cdFx0XHR2YXIgY2FsbGJhY2s7XG5cdFx0XHRpZiAodHlwZW9mIHRoaXNPYmoub25GaW5lQ2hhbmdlID09PSAnc3RyaW5nJykge1xuXHRcdFx0XHRjYWxsYmFjayA9IG5ldyBGdW5jdGlvbiAodGhpc09iai5vbkZpbmVDaGFuZ2UpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y2FsbGJhY2sgPSB0aGlzT2JqLm9uRmluZUNoYW5nZTtcblx0XHRcdH1cblx0XHRcdGNhbGxiYWNrLmNhbGwodGhpc09iaik7XG5cdFx0fVxuXHR9LFxuXG5cblx0c2V0UGFkIDogZnVuY3Rpb24gKHRoaXNPYmosIGUsIG9mc1gsIG9mc1kpIHtcblx0XHR2YXIgcG9pbnRlckFicyA9IGpzYy5nZXRBYnNQb2ludGVyUG9zKGUpO1xuXHRcdHZhciB4ID0gb2ZzWCArIHBvaW50ZXJBYnMueCAtIGpzYy5fcG9pbnRlck9yaWdpbi54IC0gdGhpc09iai5wYWRkaW5nIC0gdGhpc09iai5pbnNldFdpZHRoO1xuXHRcdHZhciB5ID0gb2ZzWSArIHBvaW50ZXJBYnMueSAtIGpzYy5fcG9pbnRlck9yaWdpbi55IC0gdGhpc09iai5wYWRkaW5nIC0gdGhpc09iai5pbnNldFdpZHRoO1xuXG5cdFx0dmFyIHhWYWwgPSB4ICogKDM2MCAvICh0aGlzT2JqLndpZHRoIC0gMSkpO1xuXHRcdHZhciB5VmFsID0gMTAwIC0gKHkgKiAoMTAwIC8gKHRoaXNPYmouaGVpZ2h0IC0gMSkpKTtcblxuXHRcdHN3aXRjaCAoanNjLmdldFBhZFlDb21wb25lbnQodGhpc09iaikpIHtcblx0XHRjYXNlICdzJzogdGhpc09iai5mcm9tSFNWKHhWYWwsIHlWYWwsIG51bGwsIGpzYy5sZWF2ZVNsZCk7IGJyZWFrO1xuXHRcdGNhc2UgJ3YnOiB0aGlzT2JqLmZyb21IU1YoeFZhbCwgbnVsbCwgeVZhbCwganNjLmxlYXZlU2xkKTsgYnJlYWs7XG5cdFx0fVxuXHR9LFxuXG5cblx0c2V0U2xkIDogZnVuY3Rpb24gKHRoaXNPYmosIGUsIG9mc1kpIHtcblx0XHR2YXIgcG9pbnRlckFicyA9IGpzYy5nZXRBYnNQb2ludGVyUG9zKGUpO1xuXHRcdHZhciB5ID0gb2ZzWSArIHBvaW50ZXJBYnMueSAtIGpzYy5fcG9pbnRlck9yaWdpbi55IC0gdGhpc09iai5wYWRkaW5nIC0gdGhpc09iai5pbnNldFdpZHRoO1xuXG5cdFx0dmFyIHlWYWwgPSAxMDAgLSAoeSAqICgxMDAgLyAodGhpc09iai5oZWlnaHQgLSAxKSkpO1xuXG5cdFx0c3dpdGNoIChqc2MuZ2V0U2xpZGVyQ29tcG9uZW50KHRoaXNPYmopKSB7XG5cdFx0Y2FzZSAncyc6IHRoaXNPYmouZnJvbUhTVihudWxsLCB5VmFsLCBudWxsLCBqc2MubGVhdmVQYWQpOyBicmVhaztcblx0XHRjYXNlICd2JzogdGhpc09iai5mcm9tSFNWKG51bGwsIG51bGwsIHlWYWwsIGpzYy5sZWF2ZVBhZCk7IGJyZWFrO1xuXHRcdH1cblx0fSxcblxuXG5cdF92bWxOUyA6ICdqc2Nfdm1sXycsXG5cdF92bWxDU1MgOiAnanNjX3ZtbF9jc3NfJyxcblx0X3ZtbFJlYWR5IDogZmFsc2UsXG5cblxuXHRpbml0Vk1MIDogZnVuY3Rpb24gKCkge1xuXHRcdGlmICghanNjLl92bWxSZWFkeSkge1xuXHRcdFx0Ly8gaW5pdCBWTUwgbmFtZXNwYWNlXG5cdFx0XHR2YXIgZG9jID0gZG9jdW1lbnQ7XG5cdFx0XHRpZiAoIWRvYy5uYW1lc3BhY2VzW2pzYy5fdm1sTlNdKSB7XG5cdFx0XHRcdGRvYy5uYW1lc3BhY2VzLmFkZChqc2MuX3ZtbE5TLCAndXJuOnNjaGVtYXMtbWljcm9zb2Z0LWNvbTp2bWwnKTtcblx0XHRcdH1cblx0XHRcdGlmICghZG9jLnN0eWxlU2hlZXRzW2pzYy5fdm1sQ1NTXSkge1xuXHRcdFx0XHR2YXIgdGFncyA9IFsnc2hhcGUnLCAnc2hhcGV0eXBlJywgJ2dyb3VwJywgJ2JhY2tncm91bmQnLCAncGF0aCcsICdmb3JtdWxhcycsICdoYW5kbGVzJywgJ2ZpbGwnLCAnc3Ryb2tlJywgJ3NoYWRvdycsICd0ZXh0Ym94JywgJ3RleHRwYXRoJywgJ2ltYWdlZGF0YScsICdsaW5lJywgJ3BvbHlsaW5lJywgJ2N1cnZlJywgJ3JlY3QnLCAncm91bmRyZWN0JywgJ292YWwnLCAnYXJjJywgJ2ltYWdlJ107XG5cdFx0XHRcdHZhciBzcyA9IGRvYy5jcmVhdGVTdHlsZVNoZWV0KCk7XG5cdFx0XHRcdHNzLm93bmluZ0VsZW1lbnQuaWQgPSBqc2MuX3ZtbENTUztcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0YWdzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdFx0c3MuYWRkUnVsZShqc2MuX3ZtbE5TICsgJ1xcXFw6JyArIHRhZ3NbaV0sICdiZWhhdmlvcjp1cmwoI2RlZmF1bHQjVk1MKTsnKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0anNjLl92bWxSZWFkeSA9IHRydWU7XG5cdFx0fVxuXHR9LFxuXG5cblx0Y3JlYXRlUGFsZXR0ZSA6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHZhciBwYWxldHRlT2JqID0ge1xuXHRcdFx0ZWxtOiBudWxsLFxuXHRcdFx0ZHJhdzogbnVsbFxuXHRcdH07XG5cblx0XHRpZiAoanNjLmlzQ2FudmFzU3VwcG9ydGVkKSB7XG5cdFx0XHQvLyBDYW52YXMgaW1wbGVtZW50YXRpb24gZm9yIG1vZGVybiBicm93c2Vyc1xuXG5cdFx0XHR2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdFx0XHR2YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cblx0XHRcdHZhciBkcmF3RnVuYyA9IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0LCB0eXBlKSB7XG5cdFx0XHRcdGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuXHRcdFx0XHRjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG5cdFx0XHRcdGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblxuXHRcdFx0XHR2YXIgaEdyYWQgPSBjdHguY3JlYXRlTGluZWFyR3JhZGllbnQoMCwgMCwgY2FudmFzLndpZHRoLCAwKTtcblx0XHRcdFx0aEdyYWQuYWRkQ29sb3JTdG9wKDAgLyA2LCAnI0YwMCcpO1xuXHRcdFx0XHRoR3JhZC5hZGRDb2xvclN0b3AoMSAvIDYsICcjRkYwJyk7XG5cdFx0XHRcdGhHcmFkLmFkZENvbG9yU3RvcCgyIC8gNiwgJyMwRjAnKTtcblx0XHRcdFx0aEdyYWQuYWRkQ29sb3JTdG9wKDMgLyA2LCAnIzBGRicpO1xuXHRcdFx0XHRoR3JhZC5hZGRDb2xvclN0b3AoNCAvIDYsICcjMDBGJyk7XG5cdFx0XHRcdGhHcmFkLmFkZENvbG9yU3RvcCg1IC8gNiwgJyNGMEYnKTtcblx0XHRcdFx0aEdyYWQuYWRkQ29sb3JTdG9wKDYgLyA2LCAnI0YwMCcpO1xuXG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSBoR3JhZDtcblx0XHRcdFx0Y3R4LmZpbGxSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cblx0XHRcdFx0dmFyIHZHcmFkID0gY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KDAsIDAsIDAsIGNhbnZhcy5oZWlnaHQpO1xuXHRcdFx0XHRzd2l0Y2ggKHR5cGUudG9Mb3dlckNhc2UoKSkge1xuXHRcdFx0XHRjYXNlICdzJzpcblx0XHRcdFx0XHR2R3JhZC5hZGRDb2xvclN0b3AoMCwgJ3JnYmEoMjU1LDI1NSwyNTUsMCknKTtcblx0XHRcdFx0XHR2R3JhZC5hZGRDb2xvclN0b3AoMSwgJ3JnYmEoMjU1LDI1NSwyNTUsMSknKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAndic6XG5cdFx0XHRcdFx0dkdyYWQuYWRkQ29sb3JTdG9wKDAsICdyZ2JhKDAsMCwwLDApJyk7XG5cdFx0XHRcdFx0dkdyYWQuYWRkQ29sb3JTdG9wKDEsICdyZ2JhKDAsMCwwLDEpJyk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9IHZHcmFkO1xuXHRcdFx0XHRjdHguZmlsbFJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblx0XHRcdH07XG5cblx0XHRcdHBhbGV0dGVPYmouZWxtID0gY2FudmFzO1xuXHRcdFx0cGFsZXR0ZU9iai5kcmF3ID0gZHJhd0Z1bmM7XG5cblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gVk1MIGZhbGxiYWNrIGZvciBJRSA3IGFuZCA4XG5cblx0XHRcdGpzYy5pbml0Vk1MKCk7XG5cblx0XHRcdHZhciB2bWxDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0XHRcdHZtbENvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG5cdFx0XHR2bWxDb250YWluZXIuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcblxuXHRcdFx0dmFyIGhHcmFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChqc2MuX3ZtbE5TICsgJzpmaWxsJyk7XG5cdFx0XHRoR3JhZC50eXBlID0gJ2dyYWRpZW50Jztcblx0XHRcdGhHcmFkLm1ldGhvZCA9ICdsaW5lYXInO1xuXHRcdFx0aEdyYWQuYW5nbGUgPSAnOTAnO1xuXHRcdFx0aEdyYWQuY29sb3JzID0gJzE2LjY3JSAjRjBGLCAzMy4zMyUgIzAwRiwgNTAlICMwRkYsIDY2LjY3JSAjMEYwLCA4My4zMyUgI0ZGMCdcblxuXHRcdFx0dmFyIGhSZWN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChqc2MuX3ZtbE5TICsgJzpyZWN0Jyk7XG5cdFx0XHRoUmVjdC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRoUmVjdC5zdHlsZS5sZWZ0ID0gLTEgKyAncHgnO1xuXHRcdFx0aFJlY3Quc3R5bGUudG9wID0gLTEgKyAncHgnO1xuXHRcdFx0aFJlY3Quc3Ryb2tlZCA9IGZhbHNlO1xuXHRcdFx0aFJlY3QuYXBwZW5kQ2hpbGQoaEdyYWQpO1xuXHRcdFx0dm1sQ29udGFpbmVyLmFwcGVuZENoaWxkKGhSZWN0KTtcblxuXHRcdFx0dmFyIHZHcmFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChqc2MuX3ZtbE5TICsgJzpmaWxsJyk7XG5cdFx0XHR2R3JhZC50eXBlID0gJ2dyYWRpZW50Jztcblx0XHRcdHZHcmFkLm1ldGhvZCA9ICdsaW5lYXInO1xuXHRcdFx0dkdyYWQuYW5nbGUgPSAnMTgwJztcblx0XHRcdHZHcmFkLm9wYWNpdHkgPSAnMCc7XG5cblx0XHRcdHZhciB2UmVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoanNjLl92bWxOUyArICc6cmVjdCcpO1xuXHRcdFx0dlJlY3Quc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0dlJlY3Quc3R5bGUubGVmdCA9IC0xICsgJ3B4Jztcblx0XHRcdHZSZWN0LnN0eWxlLnRvcCA9IC0xICsgJ3B4Jztcblx0XHRcdHZSZWN0LnN0cm9rZWQgPSBmYWxzZTtcblx0XHRcdHZSZWN0LmFwcGVuZENoaWxkKHZHcmFkKTtcblx0XHRcdHZtbENvbnRhaW5lci5hcHBlbmRDaGlsZCh2UmVjdCk7XG5cblx0XHRcdHZhciBkcmF3RnVuYyA9IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0LCB0eXBlKSB7XG5cdFx0XHRcdHZtbENvbnRhaW5lci5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4Jztcblx0XHRcdFx0dm1sQ29udGFpbmVyLnN0eWxlLmhlaWdodCA9IGhlaWdodCArICdweCc7XG5cblx0XHRcdFx0aFJlY3Quc3R5bGUud2lkdGggPVxuXHRcdFx0XHR2UmVjdC5zdHlsZS53aWR0aCA9XG5cdFx0XHRcdFx0KHdpZHRoICsgMSkgKyAncHgnO1xuXHRcdFx0XHRoUmVjdC5zdHlsZS5oZWlnaHQgPVxuXHRcdFx0XHR2UmVjdC5zdHlsZS5oZWlnaHQgPVxuXHRcdFx0XHRcdChoZWlnaHQgKyAxKSArICdweCc7XG5cblx0XHRcdFx0Ly8gQ29sb3JzIG11c3QgYmUgc3BlY2lmaWVkIGR1cmluZyBldmVyeSByZWRyYXcsIG90aGVyd2lzZSBJRSB3b24ndCBkaXNwbGF5XG5cdFx0XHRcdC8vIGEgZnVsbCBncmFkaWVudCBkdXJpbmcgYSBzdWJzZXF1ZW50aWFsIHJlZHJhd1xuXHRcdFx0XHRoR3JhZC5jb2xvciA9ICcjRjAwJztcblx0XHRcdFx0aEdyYWQuY29sb3IyID0gJyNGMDAnO1xuXG5cdFx0XHRcdHN3aXRjaCAodHlwZS50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0XHRcdGNhc2UgJ3MnOlxuXHRcdFx0XHRcdHZHcmFkLmNvbG9yID0gdkdyYWQuY29sb3IyID0gJyNGRkYnO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICd2Jzpcblx0XHRcdFx0XHR2R3JhZC5jb2xvciA9IHZHcmFkLmNvbG9yMiA9ICcjMDAwJztcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHRcdFxuXHRcdFx0cGFsZXR0ZU9iai5lbG0gPSB2bWxDb250YWluZXI7XG5cdFx0XHRwYWxldHRlT2JqLmRyYXcgPSBkcmF3RnVuYztcblx0XHR9XG5cblx0XHRyZXR1cm4gcGFsZXR0ZU9iajtcblx0fSxcblxuXG5cdGNyZWF0ZVNsaWRlckdyYWRpZW50IDogZnVuY3Rpb24gKCkge1xuXG5cdFx0dmFyIHNsaWRlck9iaiA9IHtcblx0XHRcdGVsbTogbnVsbCxcblx0XHRcdGRyYXc6IG51bGxcblx0XHR9O1xuXG5cdFx0aWYgKGpzYy5pc0NhbnZhc1N1cHBvcnRlZCkge1xuXHRcdFx0Ly8gQ2FudmFzIGltcGxlbWVudGF0aW9uIGZvciBtb2Rlcm4gYnJvd3NlcnNcblxuXHRcdFx0dmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRcdFx0dmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG5cdFx0XHR2YXIgZHJhd0Z1bmMgPSBmdW5jdGlvbiAod2lkdGgsIGhlaWdodCwgY29sb3IxLCBjb2xvcjIpIHtcblx0XHRcdFx0Y2FudmFzLndpZHRoID0gd2lkdGg7XG5cdFx0XHRcdGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG5cblx0XHRcdFx0Y3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXG5cdFx0XHRcdHZhciBncmFkID0gY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KDAsIDAsIDAsIGNhbnZhcy5oZWlnaHQpO1xuXHRcdFx0XHRncmFkLmFkZENvbG9yU3RvcCgwLCBjb2xvcjEpO1xuXHRcdFx0XHRncmFkLmFkZENvbG9yU3RvcCgxLCBjb2xvcjIpO1xuXG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSBncmFkO1xuXHRcdFx0XHRjdHguZmlsbFJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblx0XHRcdH07XG5cblx0XHRcdHNsaWRlck9iai5lbG0gPSBjYW52YXM7XG5cdFx0XHRzbGlkZXJPYmouZHJhdyA9IGRyYXdGdW5jO1xuXG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIFZNTCBmYWxsYmFjayBmb3IgSUUgNyBhbmQgOFxuXG5cdFx0XHRqc2MuaW5pdFZNTCgpO1xuXG5cdFx0XHR2YXIgdm1sQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0XHR2bWxDb250YWluZXIuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuXHRcdFx0dm1sQ29udGFpbmVyLnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG5cblx0XHRcdHZhciBncmFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChqc2MuX3ZtbE5TICsgJzpmaWxsJyk7XG5cdFx0XHRncmFkLnR5cGUgPSAnZ3JhZGllbnQnO1xuXHRcdFx0Z3JhZC5tZXRob2QgPSAnbGluZWFyJztcblx0XHRcdGdyYWQuYW5nbGUgPSAnMTgwJztcblxuXHRcdFx0dmFyIHJlY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGpzYy5fdm1sTlMgKyAnOnJlY3QnKTtcblx0XHRcdHJlY3Quc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cmVjdC5zdHlsZS5sZWZ0ID0gLTEgKyAncHgnO1xuXHRcdFx0cmVjdC5zdHlsZS50b3AgPSAtMSArICdweCc7XG5cdFx0XHRyZWN0LnN0cm9rZWQgPSBmYWxzZTtcblx0XHRcdHJlY3QuYXBwZW5kQ2hpbGQoZ3JhZCk7XG5cdFx0XHR2bWxDb250YWluZXIuYXBwZW5kQ2hpbGQocmVjdCk7XG5cblx0XHRcdHZhciBkcmF3RnVuYyA9IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0LCBjb2xvcjEsIGNvbG9yMikge1xuXHRcdFx0XHR2bWxDb250YWluZXIuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG5cdFx0XHRcdHZtbENvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xuXG5cdFx0XHRcdHJlY3Quc3R5bGUud2lkdGggPSAod2lkdGggKyAxKSArICdweCc7XG5cdFx0XHRcdHJlY3Quc3R5bGUuaGVpZ2h0ID0gKGhlaWdodCArIDEpICsgJ3B4JztcblxuXHRcdFx0XHRncmFkLmNvbG9yID0gY29sb3IxO1xuXHRcdFx0XHRncmFkLmNvbG9yMiA9IGNvbG9yMjtcblx0XHRcdH07XG5cdFx0XHRcblx0XHRcdHNsaWRlck9iai5lbG0gPSB2bWxDb250YWluZXI7XG5cdFx0XHRzbGlkZXJPYmouZHJhdyA9IGRyYXdGdW5jO1xuXHRcdH1cblxuXHRcdHJldHVybiBzbGlkZXJPYmo7XG5cdH0sXG5cblxuXHRsZWF2ZVZhbHVlIDogMTw8MCxcblx0bGVhdmVTdHlsZSA6IDE8PDEsXG5cdGxlYXZlUGFkIDogMTw8Mixcblx0bGVhdmVTbGQgOiAxPDwzLFxuXG5cblx0Qm94U2hhZG93IDogKGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgQm94U2hhZG93ID0gZnVuY3Rpb24gKGhTaGFkb3csIHZTaGFkb3csIGJsdXIsIHNwcmVhZCwgY29sb3IsIGluc2V0KSB7XG5cdFx0XHR0aGlzLmhTaGFkb3cgPSBoU2hhZG93O1xuXHRcdFx0dGhpcy52U2hhZG93ID0gdlNoYWRvdztcblx0XHRcdHRoaXMuYmx1ciA9IGJsdXI7XG5cdFx0XHR0aGlzLnNwcmVhZCA9IHNwcmVhZDtcblx0XHRcdHRoaXMuY29sb3IgPSBjb2xvcjtcblx0XHRcdHRoaXMuaW5zZXQgPSAhIWluc2V0O1xuXHRcdH07XG5cblx0XHRCb3hTaGFkb3cucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHZhbHMgPSBbXG5cdFx0XHRcdE1hdGgucm91bmQodGhpcy5oU2hhZG93KSArICdweCcsXG5cdFx0XHRcdE1hdGgucm91bmQodGhpcy52U2hhZG93KSArICdweCcsXG5cdFx0XHRcdE1hdGgucm91bmQodGhpcy5ibHVyKSArICdweCcsXG5cdFx0XHRcdE1hdGgucm91bmQodGhpcy5zcHJlYWQpICsgJ3B4Jyxcblx0XHRcdFx0dGhpcy5jb2xvclxuXHRcdFx0XTtcblx0XHRcdGlmICh0aGlzLmluc2V0KSB7XG5cdFx0XHRcdHZhbHMucHVzaCgnaW5zZXQnKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiB2YWxzLmpvaW4oJyAnKTtcblx0XHR9O1xuXG5cdFx0cmV0dXJuIEJveFNoYWRvdztcblx0fSkoKSxcblxuXG5cdC8vXG5cdC8vIFVzYWdlOlxuXHQvLyB2YXIgbXlDb2xvciA9IG5ldyBqc2NvbG9yKDx0YXJnZXRFbGVtZW50PiBbLCA8b3B0aW9ucz5dKVxuXHQvL1xuXG5cdGpzY29sb3IgOiBmdW5jdGlvbiAodGFyZ2V0RWxlbWVudCwgb3B0aW9ucykge1xuXG5cdFx0Ly8gR2VuZXJhbCBvcHRpb25zXG5cdFx0Ly9cblx0XHR0aGlzLnZhbHVlID0gbnVsbDsgLy8gaW5pdGlhbCBIRVggY29sb3IuIFRvIGNoYW5nZSBpdCBsYXRlciwgdXNlIG1ldGhvZHMgZnJvbVN0cmluZygpLCBmcm9tSFNWKCkgYW5kIGZyb21SR0IoKVxuXHRcdHRoaXMudmFsdWVFbGVtZW50ID0gdGFyZ2V0RWxlbWVudDsgLy8gZWxlbWVudCB0aGF0IHdpbGwgYmUgdXNlZCB0byBkaXNwbGF5IGFuZCBpbnB1dCB0aGUgY29sb3IgY29kZVxuXHRcdHRoaXMuc3R5bGVFbGVtZW50ID0gdGFyZ2V0RWxlbWVudDsgLy8gZWxlbWVudCB0aGF0IHdpbGwgcHJldmlldyB0aGUgcGlja2VkIGNvbG9yIHVzaW5nIENTUyBiYWNrZ3JvdW5kQ29sb3Jcblx0XHR0aGlzLnJlcXVpcmVkID0gdHJ1ZTsgLy8gd2hldGhlciB0aGUgYXNzb2NpYXRlZCB0ZXh0IDxpbnB1dD4gY2FuIGJlIGxlZnQgZW1wdHlcblx0XHR0aGlzLnJlZmluZSA9IHRydWU7IC8vIHdoZXRoZXIgdG8gcmVmaW5lIHRoZSBlbnRlcmVkIGNvbG9yIGNvZGUgKGUuZy4gdXBwZXJjYXNlIGl0IGFuZCByZW1vdmUgd2hpdGVzcGFjZSlcblx0XHR0aGlzLmhhc2ggPSBmYWxzZTsgLy8gd2hldGhlciB0byBwcmVmaXggdGhlIEhFWCBjb2xvciBjb2RlIHdpdGggIyBzeW1ib2xcblx0XHR0aGlzLnVwcGVyY2FzZSA9IHRydWU7IC8vIHdoZXRoZXIgdG8gdXBwZXJjYXNlIHRoZSBjb2xvciBjb2RlXG5cdFx0dGhpcy5vbkZpbmVDaGFuZ2UgPSBudWxsOyAvLyBjYWxsZWQgaW5zdGFudGx5IGV2ZXJ5IHRpbWUgdGhlIGNvbG9yIGNoYW5nZXMgKHZhbHVlIGNhbiBiZSBlaXRoZXIgYSBmdW5jdGlvbiBvciBhIHN0cmluZyB3aXRoIGphdmFzY3JpcHQgY29kZSlcblx0XHR0aGlzLmFjdGl2ZUNsYXNzID0gJ2pzY29sb3ItYWN0aXZlJzsgLy8gY2xhc3MgdG8gYmUgc2V0IHRvIHRoZSB0YXJnZXQgZWxlbWVudCB3aGVuIGEgcGlja2VyIHdpbmRvdyBpcyBvcGVuIG9uIGl0XG5cdFx0dGhpcy5taW5TID0gMDsgLy8gbWluIGFsbG93ZWQgc2F0dXJhdGlvbiAoMCAtIDEwMClcblx0XHR0aGlzLm1heFMgPSAxMDA7IC8vIG1heCBhbGxvd2VkIHNhdHVyYXRpb24gKDAgLSAxMDApXG5cdFx0dGhpcy5taW5WID0gMDsgLy8gbWluIGFsbG93ZWQgdmFsdWUgKGJyaWdodG5lc3MpICgwIC0gMTAwKVxuXHRcdHRoaXMubWF4ViA9IDEwMDsgLy8gbWF4IGFsbG93ZWQgdmFsdWUgKGJyaWdodG5lc3MpICgwIC0gMTAwKVxuXG5cdFx0Ly8gQWNjZXNzaW5nIHRoZSBwaWNrZWQgY29sb3Jcblx0XHQvL1xuXHRcdHRoaXMuaHN2ID0gWzAsIDAsIDEwMF07IC8vIHJlYWQtb25seSAgWzAtMzYwLCAwLTEwMCwgMC0xMDBdXG5cdFx0dGhpcy5yZ2IgPSBbMjU1LCAyNTUsIDI1NV07IC8vIHJlYWQtb25seSAgWzAtMjU1LCAwLTI1NSwgMC0yNTVdXG5cblx0XHQvLyBDb2xvciBQaWNrZXIgb3B0aW9uc1xuXHRcdC8vXG5cdFx0dGhpcy53aWR0aCA9IDE4MTsgLy8gd2lkdGggb2YgY29sb3IgcGFsZXR0ZSAoaW4gcHgpXG5cdFx0dGhpcy5oZWlnaHQgPSAxMDE7IC8vIGhlaWdodCBvZiBjb2xvciBwYWxldHRlIChpbiBweClcblx0XHR0aGlzLnNob3dPbkNsaWNrID0gdHJ1ZTsgLy8gd2hldGhlciB0byBkaXNwbGF5IHRoZSBjb2xvciBwaWNrZXIgd2hlbiB1c2VyIGNsaWNrcyBvbiBpdHMgdGFyZ2V0IGVsZW1lbnRcblx0XHR0aGlzLm1vZGUgPSAnSFNWJzsgLy8gSFNWIHwgSFZTIHwgSFMgfCBIViAtIGxheW91dCBvZiB0aGUgY29sb3IgcGlja2VyIGNvbnRyb2xzXG5cdFx0dGhpcy5wb3NpdGlvbiA9ICdib3R0b20nOyAvLyBsZWZ0IHwgcmlnaHQgfCB0b3AgfCBib3R0b20gLSBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgdGFyZ2V0IGVsZW1lbnRcblx0XHR0aGlzLnNtYXJ0UG9zaXRpb24gPSB0cnVlOyAvLyBhdXRvbWF0aWNhbGx5IGNoYW5nZSBwaWNrZXIgcG9zaXRpb24gd2hlbiB0aGVyZSBpcyBub3QgZW5vdWdoIHNwYWNlIGZvciBpdFxuXHRcdHRoaXMuc2xpZGVyU2l6ZSA9IDE2OyAvLyBweFxuXHRcdHRoaXMuY3Jvc3NTaXplID0gODsgLy8gcHhcblx0XHR0aGlzLmNsb3NhYmxlID0gZmFsc2U7IC8vIHdoZXRoZXIgdG8gZGlzcGxheSB0aGUgQ2xvc2UgYnV0dG9uXG5cdFx0dGhpcy5jbG9zZVRleHQgPSAnQ2xvc2UnO1xuXHRcdHRoaXMuYnV0dG9uQ29sb3IgPSAnIzAwMDAwMCc7IC8vIENTUyBjb2xvclxuXHRcdHRoaXMuYnV0dG9uSGVpZ2h0ID0gMTg7IC8vIHB4XG5cdFx0dGhpcy5wYWRkaW5nID0gMTI7IC8vIHB4XG5cdFx0dGhpcy5iYWNrZ3JvdW5kQ29sb3IgPSAnI0ZGRkZGRic7IC8vIENTUyBjb2xvclxuXHRcdHRoaXMuYm9yZGVyV2lkdGggPSAxOyAvLyBweFxuXHRcdHRoaXMuYm9yZGVyQ29sb3IgPSAnI0JCQkJCQic7IC8vIENTUyBjb2xvclxuXHRcdHRoaXMuYm9yZGVyUmFkaXVzID0gODsgLy8gcHhcblx0XHR0aGlzLmluc2V0V2lkdGggPSAxOyAvLyBweFxuXHRcdHRoaXMuaW5zZXRDb2xvciA9ICcjQkJCQkJCJzsgLy8gQ1NTIGNvbG9yXG5cdFx0dGhpcy5zaGFkb3cgPSB0cnVlOyAvLyB3aGV0aGVyIHRvIGRpc3BsYXkgc2hhZG93XG5cdFx0dGhpcy5zaGFkb3dCbHVyID0gMTU7IC8vIHB4XG5cdFx0dGhpcy5zaGFkb3dDb2xvciA9ICdyZ2JhKDAsMCwwLDAuMiknOyAvLyBDU1MgY29sb3Jcblx0XHR0aGlzLnBvaW50ZXJDb2xvciA9ICcjNEM0QzRDJzsgLy8gcHhcblx0XHR0aGlzLnBvaW50ZXJCb3JkZXJDb2xvciA9ICcjRkZGRkZGJzsgLy8gcHhcbiAgICAgICAgdGhpcy5wb2ludGVyQm9yZGVyV2lkdGggPSAxOyAvLyBweFxuICAgICAgICB0aGlzLnBvaW50ZXJUaGlja25lc3MgPSAyOyAvLyBweFxuXHRcdHRoaXMuekluZGV4ID0gMTAwMDtcblx0XHR0aGlzLmNvbnRhaW5lciA9IG51bGw7IC8vIHdoZXJlIHRvIGFwcGVuZCB0aGUgY29sb3IgcGlja2VyIChCT0RZIGVsZW1lbnQgYnkgZGVmYXVsdClcblxuXG5cdFx0Zm9yICh2YXIgb3B0IGluIG9wdGlvbnMpIHtcblx0XHRcdGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KG9wdCkpIHtcblx0XHRcdFx0dGhpc1tvcHRdID0gb3B0aW9uc1tvcHRdO1xuXHRcdFx0fVxuXHRcdH1cblxuXG5cdFx0dGhpcy5oaWRlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKGlzUGlja2VyT3duZXIoKSkge1xuXHRcdFx0XHRkZXRhY2hQaWNrZXIoKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cblx0XHR0aGlzLnNob3cgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRkcmF3UGlja2VyKCk7XG5cdFx0fTtcblxuXG5cdFx0dGhpcy5yZWRyYXcgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoaXNQaWNrZXJPd25lcigpKSB7XG5cdFx0XHRcdGRyYXdQaWNrZXIoKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cblx0XHR0aGlzLmltcG9ydENvbG9yID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKCF0aGlzLnZhbHVlRWxlbWVudCkge1xuXHRcdFx0XHR0aGlzLmV4cG9ydENvbG9yKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoanNjLmlzRWxlbWVudFR5cGUodGhpcy52YWx1ZUVsZW1lbnQsICdpbnB1dCcpKSB7XG5cdFx0XHRcdFx0aWYgKCF0aGlzLnJlZmluZSkge1xuXHRcdFx0XHRcdFx0aWYgKCF0aGlzLmZyb21TdHJpbmcodGhpcy52YWx1ZUVsZW1lbnQudmFsdWUsIGpzYy5sZWF2ZVZhbHVlKSkge1xuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5zdHlsZUVsZW1lbnQpIHtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLnN0eWxlRWxlbWVudC5fanNjT3JpZ1N0eWxlLmJhY2tncm91bmRJbWFnZTtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLnN0eWxlRWxlbWVudC5fanNjT3JpZ1N0eWxlLmJhY2tncm91bmRDb2xvcjtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5jb2xvciA9IHRoaXMuc3R5bGVFbGVtZW50Ll9qc2NPcmlnU3R5bGUuY29sb3I7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0dGhpcy5leHBvcnRDb2xvcihqc2MubGVhdmVWYWx1ZSB8IGpzYy5sZWF2ZVN0eWxlKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGVsc2UgaWYgKCF0aGlzLnJlcXVpcmVkICYmIC9eXFxzKiQvLnRlc3QodGhpcy52YWx1ZUVsZW1lbnQudmFsdWUpKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnZhbHVlRWxlbWVudC52YWx1ZSA9ICcnO1xuXHRcdFx0XHRcdFx0aWYgKHRoaXMuc3R5bGVFbGVtZW50KSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IHRoaXMuc3R5bGVFbGVtZW50Ll9qc2NPcmlnU3R5bGUuYmFja2dyb3VuZEltYWdlO1xuXHRcdFx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLnN0eWxlRWxlbWVudC5fanNjT3JpZ1N0eWxlLmJhY2tncm91bmRDb2xvcjtcblx0XHRcdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuY29sb3IgPSB0aGlzLnN0eWxlRWxlbWVudC5fanNjT3JpZ1N0eWxlLmNvbG9yO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0dGhpcy5leHBvcnRDb2xvcihqc2MubGVhdmVWYWx1ZSB8IGpzYy5sZWF2ZVN0eWxlKTtcblxuXHRcdFx0XHRcdH0gZWxzZSBpZiAodGhpcy5mcm9tU3RyaW5nKHRoaXMudmFsdWVFbGVtZW50LnZhbHVlKSkge1xuXHRcdFx0XHRcdFx0Ly8gbWFuYWdlZCB0byBpbXBvcnQgY29sb3Igc3VjY2Vzc2Z1bGx5IGZyb20gdGhlIHZhbHVlIC0+IE9LLCBkb24ndCBkbyBhbnl0aGluZ1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR0aGlzLmV4cG9ydENvbG9yKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIG5vdCBhbiBpbnB1dCBlbGVtZW50IC0+IGRvZXNuJ3QgaGF2ZSBhbnkgdmFsdWVcblx0XHRcdFx0XHR0aGlzLmV4cG9ydENvbG9yKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cblx0XHR0aGlzLmV4cG9ydENvbG9yID0gZnVuY3Rpb24gKGZsYWdzKSB7XG5cdFx0XHRpZiAoIShmbGFncyAmIGpzYy5sZWF2ZVZhbHVlKSAmJiB0aGlzLnZhbHVlRWxlbWVudCkge1xuXHRcdFx0XHR2YXIgdmFsdWUgPSB0aGlzLnRvU3RyaW5nKCk7XG5cdFx0XHRcdGlmICh0aGlzLnVwcGVyY2FzZSkgeyB2YWx1ZSA9IHZhbHVlLnRvVXBwZXJDYXNlKCk7IH1cblx0XHRcdFx0aWYgKHRoaXMuaGFzaCkgeyB2YWx1ZSA9ICcjJyArIHZhbHVlOyB9XG5cblx0XHRcdFx0aWYgKGpzYy5pc0VsZW1lbnRUeXBlKHRoaXMudmFsdWVFbGVtZW50LCAnaW5wdXQnKSkge1xuXHRcdFx0XHRcdHRoaXMudmFsdWVFbGVtZW50LnZhbHVlID0gdmFsdWU7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy52YWx1ZUVsZW1lbnQuaW5uZXJIVE1MID0gdmFsdWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmICghKGZsYWdzICYganNjLmxlYXZlU3R5bGUpKSB7XG5cdFx0XHRcdGlmICh0aGlzLnN0eWxlRWxlbWVudCkge1xuXHRcdFx0XHRcdHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9ICdub25lJztcblx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnIycgKyB0aGlzLnRvU3RyaW5nKCk7XG5cdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuY29sb3IgPSB0aGlzLmlzTGlnaHQoKSA/ICcjMDAwJyA6ICcjRkZGJztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKCEoZmxhZ3MgJiBqc2MubGVhdmVQYWQpICYmIGlzUGlja2VyT3duZXIoKSkge1xuXHRcdFx0XHRyZWRyYXdQYWQoKTtcblx0XHRcdH1cblx0XHRcdGlmICghKGZsYWdzICYganNjLmxlYXZlU2xkKSAmJiBpc1BpY2tlck93bmVyKCkpIHtcblx0XHRcdFx0cmVkcmF3U2xkKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXG5cdFx0Ly8gaDogMC0zNjBcblx0XHQvLyBzOiAwLTEwMFxuXHRcdC8vIHY6IDAtMTAwXG5cdFx0Ly9cblx0XHR0aGlzLmZyb21IU1YgPSBmdW5jdGlvbiAoaCwgcywgdiwgZmxhZ3MpIHsgLy8gbnVsbCA9IGRvbid0IGNoYW5nZVxuXHRcdFx0aWYgKGggIT09IG51bGwpIHtcblx0XHRcdFx0aWYgKGlzTmFOKGgpKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0XHRoID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMzYwLCBoKSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAocyAhPT0gbnVsbCkge1xuXHRcdFx0XHRpZiAoaXNOYU4ocykpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRcdHMgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxMDAsIHRoaXMubWF4UywgcyksIHRoaXMubWluUyk7XG5cdFx0XHR9XG5cdFx0XHRpZiAodiAhPT0gbnVsbCkge1xuXHRcdFx0XHRpZiAoaXNOYU4odikpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRcdHYgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxMDAsIHRoaXMubWF4ViwgdiksIHRoaXMubWluVik7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMucmdiID0gSFNWX1JHQihcblx0XHRcdFx0aD09PW51bGwgPyB0aGlzLmhzdlswXSA6ICh0aGlzLmhzdlswXT1oKSxcblx0XHRcdFx0cz09PW51bGwgPyB0aGlzLmhzdlsxXSA6ICh0aGlzLmhzdlsxXT1zKSxcblx0XHRcdFx0dj09PW51bGwgPyB0aGlzLmhzdlsyXSA6ICh0aGlzLmhzdlsyXT12KVxuXHRcdFx0KTtcblxuXHRcdFx0dGhpcy5leHBvcnRDb2xvcihmbGFncyk7XG5cdFx0fTtcblxuXG5cdFx0Ly8gcjogMC0yNTVcblx0XHQvLyBnOiAwLTI1NVxuXHRcdC8vIGI6IDAtMjU1XG5cdFx0Ly9cblx0XHR0aGlzLmZyb21SR0IgPSBmdW5jdGlvbiAociwgZywgYiwgZmxhZ3MpIHsgLy8gbnVsbCA9IGRvbid0IGNoYW5nZVxuXHRcdFx0aWYgKHIgIT09IG51bGwpIHtcblx0XHRcdFx0aWYgKGlzTmFOKHIpKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0XHRyID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMjU1LCByKSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoZyAhPT0gbnVsbCkge1xuXHRcdFx0XHRpZiAoaXNOYU4oZykpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRcdGcgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigyNTUsIGcpKTtcblx0XHRcdH1cblx0XHRcdGlmIChiICE9PSBudWxsKSB7XG5cdFx0XHRcdGlmIChpc05hTihiKSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdFx0YiA9IE1hdGgubWF4KDAsIE1hdGgubWluKDI1NSwgYikpO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgaHN2ID0gUkdCX0hTVihcblx0XHRcdFx0cj09PW51bGwgPyB0aGlzLnJnYlswXSA6IHIsXG5cdFx0XHRcdGc9PT1udWxsID8gdGhpcy5yZ2JbMV0gOiBnLFxuXHRcdFx0XHRiPT09bnVsbCA/IHRoaXMucmdiWzJdIDogYlxuXHRcdFx0KTtcblx0XHRcdGlmIChoc3ZbMF0gIT09IG51bGwpIHtcblx0XHRcdFx0dGhpcy5oc3ZbMF0gPSBNYXRoLm1heCgwLCBNYXRoLm1pbigzNjAsIGhzdlswXSkpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGhzdlsyXSAhPT0gMCkge1xuXHRcdFx0XHR0aGlzLmhzdlsxXSA9IGhzdlsxXT09PW51bGwgPyBudWxsIDogTWF0aC5tYXgoMCwgdGhpcy5taW5TLCBNYXRoLm1pbigxMDAsIHRoaXMubWF4UywgaHN2WzFdKSk7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLmhzdlsyXSA9IGhzdlsyXT09PW51bGwgPyBudWxsIDogTWF0aC5tYXgoMCwgdGhpcy5taW5WLCBNYXRoLm1pbigxMDAsIHRoaXMubWF4ViwgaHN2WzJdKSk7XG5cblx0XHRcdC8vIHVwZGF0ZSBSR0IgYWNjb3JkaW5nIHRvIGZpbmFsIEhTViwgYXMgc29tZSB2YWx1ZXMgbWlnaHQgYmUgdHJpbW1lZFxuXHRcdFx0dmFyIHJnYiA9IEhTVl9SR0IodGhpcy5oc3ZbMF0sIHRoaXMuaHN2WzFdLCB0aGlzLmhzdlsyXSk7XG5cdFx0XHR0aGlzLnJnYlswXSA9IHJnYlswXTtcblx0XHRcdHRoaXMucmdiWzFdID0gcmdiWzFdO1xuXHRcdFx0dGhpcy5yZ2JbMl0gPSByZ2JbMl07XG5cblx0XHRcdHRoaXMuZXhwb3J0Q29sb3IoZmxhZ3MpO1xuXHRcdH07XG5cblxuXHRcdHRoaXMuZnJvbVN0cmluZyA9IGZ1bmN0aW9uIChzdHIsIGZsYWdzKSB7XG5cdFx0XHR2YXIgbTtcblx0XHRcdGlmIChtID0gc3RyLm1hdGNoKC9eXFxXKihbMC05QS1GXXszfShbMC05QS1GXXszfSk/KVxcVyokL2kpKSB7XG5cdFx0XHRcdC8vIEhFWCBub3RhdGlvblxuXHRcdFx0XHQvL1xuXG5cdFx0XHRcdGlmIChtWzFdLmxlbmd0aCA9PT0gNikge1xuXHRcdFx0XHRcdC8vIDYtY2hhciBub3RhdGlvblxuXHRcdFx0XHRcdHRoaXMuZnJvbVJHQihcblx0XHRcdFx0XHRcdHBhcnNlSW50KG1bMV0uc3Vic3RyKDAsMiksMTYpLFxuXHRcdFx0XHRcdFx0cGFyc2VJbnQobVsxXS5zdWJzdHIoMiwyKSwxNiksXG5cdFx0XHRcdFx0XHRwYXJzZUludChtWzFdLnN1YnN0cig0LDIpLDE2KSxcblx0XHRcdFx0XHRcdGZsYWdzXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyAzLWNoYXIgbm90YXRpb25cblx0XHRcdFx0XHR0aGlzLmZyb21SR0IoXG5cdFx0XHRcdFx0XHRwYXJzZUludChtWzFdLmNoYXJBdCgwKSArIG1bMV0uY2hhckF0KDApLDE2KSxcblx0XHRcdFx0XHRcdHBhcnNlSW50KG1bMV0uY2hhckF0KDEpICsgbVsxXS5jaGFyQXQoMSksMTYpLFxuXHRcdFx0XHRcdFx0cGFyc2VJbnQobVsxXS5jaGFyQXQoMikgKyBtWzFdLmNoYXJBdCgyKSwxNiksXG5cdFx0XHRcdFx0XHRmbGFnc1xuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cblx0XHRcdH0gZWxzZSBpZiAobSA9IHN0ci5tYXRjaCgvXlxcVypyZ2JhP1xcKChbXildKilcXClcXFcqJC9pKSkge1xuXHRcdFx0XHR2YXIgcGFyYW1zID0gbVsxXS5zcGxpdCgnLCcpO1xuXHRcdFx0XHR2YXIgcmUgPSAvXlxccyooXFxkKikoXFwuXFxkKyk/XFxzKiQvO1xuXHRcdFx0XHR2YXIgbVIsIG1HLCBtQjtcblx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdHBhcmFtcy5sZW5ndGggPj0gMyAmJlxuXHRcdFx0XHRcdChtUiA9IHBhcmFtc1swXS5tYXRjaChyZSkpICYmXG5cdFx0XHRcdFx0KG1HID0gcGFyYW1zWzFdLm1hdGNoKHJlKSkgJiZcblx0XHRcdFx0XHQobUIgPSBwYXJhbXNbMl0ubWF0Y2gocmUpKVxuXHRcdFx0XHQpIHtcblx0XHRcdFx0XHR2YXIgciA9IHBhcnNlRmxvYXQoKG1SWzFdIHx8ICcwJykgKyAobVJbMl0gfHwgJycpKTtcblx0XHRcdFx0XHR2YXIgZyA9IHBhcnNlRmxvYXQoKG1HWzFdIHx8ICcwJykgKyAobUdbMl0gfHwgJycpKTtcblx0XHRcdFx0XHR2YXIgYiA9IHBhcnNlRmxvYXQoKG1CWzFdIHx8ICcwJykgKyAobUJbMl0gfHwgJycpKTtcblx0XHRcdFx0XHR0aGlzLmZyb21SR0IociwgZywgYiwgZmxhZ3MpO1xuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fTtcblxuXG5cdFx0dGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiAoXG5cdFx0XHRcdCgweDEwMCB8IE1hdGgucm91bmQodGhpcy5yZ2JbMF0pKS50b1N0cmluZygxNikuc3Vic3RyKDEpICtcblx0XHRcdFx0KDB4MTAwIHwgTWF0aC5yb3VuZCh0aGlzLnJnYlsxXSkpLnRvU3RyaW5nKDE2KS5zdWJzdHIoMSkgK1xuXHRcdFx0XHQoMHgxMDAgfCBNYXRoLnJvdW5kKHRoaXMucmdiWzJdKSkudG9TdHJpbmcoMTYpLnN1YnN0cigxKVxuXHRcdFx0KTtcblx0XHR9O1xuXG5cblx0XHR0aGlzLnRvSEVYU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuICcjJyArIHRoaXMudG9TdHJpbmcoKS50b1VwcGVyQ2FzZSgpO1xuXHRcdH07XG5cblxuXHRcdHRoaXMudG9SR0JTdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gKCdyZ2IoJyArXG5cdFx0XHRcdE1hdGgucm91bmQodGhpcy5yZ2JbMF0pICsgJywnICtcblx0XHRcdFx0TWF0aC5yb3VuZCh0aGlzLnJnYlsxXSkgKyAnLCcgK1xuXHRcdFx0XHRNYXRoLnJvdW5kKHRoaXMucmdiWzJdKSArICcpJ1xuXHRcdFx0KTtcblx0XHR9O1xuXG5cblx0XHR0aGlzLmlzTGlnaHQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHQwLjIxMyAqIHRoaXMucmdiWzBdICtcblx0XHRcdFx0MC43MTUgKiB0aGlzLnJnYlsxXSArXG5cdFx0XHRcdDAuMDcyICogdGhpcy5yZ2JbMl0gPlxuXHRcdFx0XHQyNTUgLyAyXG5cdFx0XHQpO1xuXHRcdH07XG5cblxuXHRcdHRoaXMuX3Byb2Nlc3NQYXJlbnRFbGVtZW50c0luRE9NID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKHRoaXMuX2xpbmtlZEVsZW1lbnRzUHJvY2Vzc2VkKSB7IHJldHVybjsgfVxuXHRcdFx0dGhpcy5fbGlua2VkRWxlbWVudHNQcm9jZXNzZWQgPSB0cnVlO1xuXG5cdFx0XHR2YXIgZWxtID0gdGhpcy50YXJnZXRFbGVtZW50O1xuXHRcdFx0ZG8ge1xuXHRcdFx0XHQvLyBJZiB0aGUgdGFyZ2V0IGVsZW1lbnQgb3Igb25lIG9mIGl0cyBwYXJlbnQgbm9kZXMgaGFzIGZpeGVkIHBvc2l0aW9uLFxuXHRcdFx0XHQvLyB0aGVuIHVzZSBmaXhlZCBwb3NpdGlvbmluZyBpbnN0ZWFkXG5cdFx0XHRcdC8vXG5cdFx0XHRcdC8vIE5vdGU6IEluIEZpcmVmb3gsIGdldENvbXB1dGVkU3R5bGUgcmV0dXJucyBudWxsIGluIGEgaGlkZGVuIGlmcmFtZSxcblx0XHRcdFx0Ly8gdGhhdCdzIHdoeSB3ZSBuZWVkIHRvIGNoZWNrIGlmIHRoZSByZXR1cm5lZCBzdHlsZSBvYmplY3QgaXMgbm9uLWVtcHR5XG5cdFx0XHRcdHZhciBjdXJyU3R5bGUgPSBqc2MuZ2V0U3R5bGUoZWxtKTtcblx0XHRcdFx0aWYgKGN1cnJTdHlsZSAmJiBjdXJyU3R5bGUucG9zaXRpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2ZpeGVkJykge1xuXHRcdFx0XHRcdHRoaXMuZml4ZWQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGVsbSAhPT0gdGhpcy50YXJnZXRFbGVtZW50KSB7XG5cdFx0XHRcdFx0Ly8gRW5zdXJlIHRvIGF0dGFjaCBvblBhcmVudFNjcm9sbCBvbmx5IG9uY2UgdG8gZWFjaCBwYXJlbnQgZWxlbWVudFxuXHRcdFx0XHRcdC8vIChtdWx0aXBsZSB0YXJnZXRFbGVtZW50cyBjYW4gc2hhcmUgdGhlIHNhbWUgcGFyZW50IG5vZGVzKVxuXHRcdFx0XHRcdC8vXG5cdFx0XHRcdFx0Ly8gTm90ZTogSXQncyBub3QganVzdCBvZmZzZXRQYXJlbnRzIHRoYXQgY2FuIGJlIHNjcm9sbGFibGUsXG5cdFx0XHRcdFx0Ly8gdGhhdCdzIHdoeSB3ZSBsb29wIHRocm91Z2ggYWxsIHBhcmVudCBub2Rlc1xuXHRcdFx0XHRcdGlmICghZWxtLl9qc2NFdmVudHNBdHRhY2hlZCkge1xuXHRcdFx0XHRcdFx0anNjLmF0dGFjaEV2ZW50KGVsbSwgJ3Njcm9sbCcsIGpzYy5vblBhcmVudFNjcm9sbCk7XG5cdFx0XHRcdFx0XHRlbG0uX2pzY0V2ZW50c0F0dGFjaGVkID0gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gd2hpbGUgKChlbG0gPSBlbG0ucGFyZW50Tm9kZSkgJiYgIWpzYy5pc0VsZW1lbnRUeXBlKGVsbSwgJ2JvZHknKSk7XG5cdFx0fTtcblxuXG5cdFx0Ly8gcjogMC0yNTVcblx0XHQvLyBnOiAwLTI1NVxuXHRcdC8vIGI6IDAtMjU1XG5cdFx0Ly9cblx0XHQvLyByZXR1cm5zOiBbIDAtMzYwLCAwLTEwMCwgMC0xMDAgXVxuXHRcdC8vXG5cdFx0ZnVuY3Rpb24gUkdCX0hTViAociwgZywgYikge1xuXHRcdFx0ciAvPSAyNTU7XG5cdFx0XHRnIC89IDI1NTtcblx0XHRcdGIgLz0gMjU1O1xuXHRcdFx0dmFyIG4gPSBNYXRoLm1pbihNYXRoLm1pbihyLGcpLGIpO1xuXHRcdFx0dmFyIHYgPSBNYXRoLm1heChNYXRoLm1heChyLGcpLGIpO1xuXHRcdFx0dmFyIG0gPSB2IC0gbjtcblx0XHRcdGlmIChtID09PSAwKSB7IHJldHVybiBbIG51bGwsIDAsIDEwMCAqIHYgXTsgfVxuXHRcdFx0dmFyIGggPSByPT09biA/IDMrKGItZykvbSA6IChnPT09biA/IDUrKHItYikvbSA6IDErKGctcikvbSk7XG5cdFx0XHRyZXR1cm4gW1xuXHRcdFx0XHQ2MCAqIChoPT09Nj8wOmgpLFxuXHRcdFx0XHQxMDAgKiAobS92KSxcblx0XHRcdFx0MTAwICogdlxuXHRcdFx0XTtcblx0XHR9XG5cblxuXHRcdC8vIGg6IDAtMzYwXG5cdFx0Ly8gczogMC0xMDBcblx0XHQvLyB2OiAwLTEwMFxuXHRcdC8vXG5cdFx0Ly8gcmV0dXJuczogWyAwLTI1NSwgMC0yNTUsIDAtMjU1IF1cblx0XHQvL1xuXHRcdGZ1bmN0aW9uIEhTVl9SR0IgKGgsIHMsIHYpIHtcblx0XHRcdHZhciB1ID0gMjU1ICogKHYgLyAxMDApO1xuXG5cdFx0XHRpZiAoaCA9PT0gbnVsbCkge1xuXHRcdFx0XHRyZXR1cm4gWyB1LCB1LCB1IF07XG5cdFx0XHR9XG5cblx0XHRcdGggLz0gNjA7XG5cdFx0XHRzIC89IDEwMDtcblxuXHRcdFx0dmFyIGkgPSBNYXRoLmZsb29yKGgpO1xuXHRcdFx0dmFyIGYgPSBpJTIgPyBoLWkgOiAxLShoLWkpO1xuXHRcdFx0dmFyIG0gPSB1ICogKDEgLSBzKTtcblx0XHRcdHZhciBuID0gdSAqICgxIC0gcyAqIGYpO1xuXHRcdFx0c3dpdGNoIChpKSB7XG5cdFx0XHRcdGNhc2UgNjpcblx0XHRcdFx0Y2FzZSAwOiByZXR1cm4gW3UsbixtXTtcblx0XHRcdFx0Y2FzZSAxOiByZXR1cm4gW24sdSxtXTtcblx0XHRcdFx0Y2FzZSAyOiByZXR1cm4gW20sdSxuXTtcblx0XHRcdFx0Y2FzZSAzOiByZXR1cm4gW20sbix1XTtcblx0XHRcdFx0Y2FzZSA0OiByZXR1cm4gW24sbSx1XTtcblx0XHRcdFx0Y2FzZSA1OiByZXR1cm4gW3UsbSxuXTtcblx0XHRcdH1cblx0XHR9XG5cblxuXHRcdGZ1bmN0aW9uIGRldGFjaFBpY2tlciAoKSB7XG5cdFx0XHRqc2MudW5zZXRDbGFzcyhUSElTLnRhcmdldEVsZW1lbnQsIFRISVMuYWN0aXZlQ2xhc3MpO1xuXHRcdFx0anNjLnBpY2tlci53cmFwLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoanNjLnBpY2tlci53cmFwKTtcblx0XHRcdGRlbGV0ZSBqc2MucGlja2VyLm93bmVyO1xuXHRcdH1cblxuXG5cdFx0ZnVuY3Rpb24gZHJhd1BpY2tlciAoKSB7XG5cblx0XHRcdC8vIEF0IHRoaXMgcG9pbnQsIHdoZW4gZHJhd2luZyB0aGUgcGlja2VyLCB3ZSBrbm93IHdoYXQgdGhlIHBhcmVudCBlbGVtZW50cyBhcmVcblx0XHRcdC8vIGFuZCB3ZSBjYW4gZG8gYWxsIHJlbGF0ZWQgRE9NIG9wZXJhdGlvbnMsIHN1Y2ggYXMgcmVnaXN0ZXJpbmcgZXZlbnRzIG9uIHRoZW1cblx0XHRcdC8vIG9yIGNoZWNraW5nIHRoZWlyIHBvc2l0aW9uaW5nXG5cdFx0XHRUSElTLl9wcm9jZXNzUGFyZW50RWxlbWVudHNJbkRPTSgpO1xuXG5cdFx0XHRpZiAoIWpzYy5waWNrZXIpIHtcblx0XHRcdFx0anNjLnBpY2tlciA9IHtcblx0XHRcdFx0XHRvd25lcjogbnVsbCxcblx0XHRcdFx0XHR3cmFwIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0XHRcdFx0Ym94IDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0XHRcdFx0Ym94UyA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBzaGFkb3cgYXJlYVxuXHRcdFx0XHRcdGJveEIgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gYm9yZGVyXG5cdFx0XHRcdFx0cGFkIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0XHRcdFx0cGFkQiA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBib3JkZXJcblx0XHRcdFx0XHRwYWRNIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIG1vdXNlL3RvdWNoIGFyZWFcblx0XHRcdFx0XHRwYWRQYWwgOiBqc2MuY3JlYXRlUGFsZXR0ZSgpLFxuXHRcdFx0XHRcdGNyb3NzIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0XHRcdFx0Y3Jvc3NCWSA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBib3JkZXIgWVxuXHRcdFx0XHRcdGNyb3NzQlggOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gYm9yZGVyIFhcblx0XHRcdFx0XHRjcm9zc0xZIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIGxpbmUgWVxuXHRcdFx0XHRcdGNyb3NzTFggOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gbGluZSBYXG5cdFx0XHRcdFx0c2xkIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0XHRcdFx0c2xkQiA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBib3JkZXJcblx0XHRcdFx0XHRzbGRNIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIG1vdXNlL3RvdWNoIGFyZWFcblx0XHRcdFx0XHRzbGRHcmFkIDoganNjLmNyZWF0ZVNsaWRlckdyYWRpZW50KCksXG5cdFx0XHRcdFx0c2xkUHRyUyA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBzbGlkZXIgcG9pbnRlciBzcGFjZXJcblx0XHRcdFx0XHRzbGRQdHJJQiA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBzbGlkZXIgcG9pbnRlciBpbm5lciBib3JkZXJcblx0XHRcdFx0XHRzbGRQdHJNQiA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBzbGlkZXIgcG9pbnRlciBtaWRkbGUgYm9yZGVyXG5cdFx0XHRcdFx0c2xkUHRyT0IgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gc2xpZGVyIHBvaW50ZXIgb3V0ZXIgYm9yZGVyXG5cdFx0XHRcdFx0YnRuIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0XHRcdFx0YnRuVCA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKSAvLyB0ZXh0XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0anNjLnBpY2tlci5wYWQuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5wYWRQYWwuZWxtKTtcblx0XHRcdFx0anNjLnBpY2tlci5wYWRCLmFwcGVuZENoaWxkKGpzYy5waWNrZXIucGFkKTtcblx0XHRcdFx0anNjLnBpY2tlci5jcm9zcy5hcHBlbmRDaGlsZChqc2MucGlja2VyLmNyb3NzQlkpO1xuXHRcdFx0XHRqc2MucGlja2VyLmNyb3NzLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuY3Jvc3NCWCk7XG5cdFx0XHRcdGpzYy5waWNrZXIuY3Jvc3MuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5jcm9zc0xZKTtcblx0XHRcdFx0anNjLnBpY2tlci5jcm9zcy5hcHBlbmRDaGlsZChqc2MucGlja2VyLmNyb3NzTFgpO1xuXHRcdFx0XHRqc2MucGlja2VyLnBhZEIuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5jcm9zcyk7XG5cdFx0XHRcdGpzYy5waWNrZXIuYm94LmFwcGVuZENoaWxkKGpzYy5waWNrZXIucGFkQik7XG5cdFx0XHRcdGpzYy5waWNrZXIuYm94LmFwcGVuZENoaWxkKGpzYy5waWNrZXIucGFkTSk7XG5cblx0XHRcdFx0anNjLnBpY2tlci5zbGQuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5zbGRHcmFkLmVsbSk7XG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkQi5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZCk7XG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkQi5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZFB0ck9CKTtcblx0XHRcdFx0anNjLnBpY2tlci5zbGRQdHJPQi5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZFB0ck1CKTtcblx0XHRcdFx0anNjLnBpY2tlci5zbGRQdHJNQi5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZFB0cklCKTtcblx0XHRcdFx0anNjLnBpY2tlci5zbGRQdHJJQi5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZFB0clMpO1xuXHRcdFx0XHRqc2MucGlja2VyLmJveC5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZEIpO1xuXHRcdFx0XHRqc2MucGlja2VyLmJveC5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZE0pO1xuXG5cdFx0XHRcdGpzYy5waWNrZXIuYnRuLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuYnRuVCk7XG5cdFx0XHRcdGpzYy5waWNrZXIuYm94LmFwcGVuZENoaWxkKGpzYy5waWNrZXIuYnRuKTtcblxuXHRcdFx0XHRqc2MucGlja2VyLmJveEIuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5ib3gpO1xuXHRcdFx0XHRqc2MucGlja2VyLndyYXAuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5ib3hTKTtcblx0XHRcdFx0anNjLnBpY2tlci53cmFwLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuYm94Qik7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBwID0ganNjLnBpY2tlcjtcblxuXHRcdFx0dmFyIGRpc3BsYXlTbGlkZXIgPSAhIWpzYy5nZXRTbGlkZXJDb21wb25lbnQoVEhJUyk7XG5cdFx0XHR2YXIgZGltcyA9IGpzYy5nZXRQaWNrZXJEaW1zKFRISVMpO1xuXHRcdFx0dmFyIGNyb3NzT3V0ZXJTaXplID0gKDIgKiBUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCArIFRISVMucG9pbnRlclRoaWNrbmVzcyArIDIgKiBUSElTLmNyb3NzU2l6ZSk7XG5cdFx0XHR2YXIgcGFkVG9TbGlkZXJQYWRkaW5nID0ganNjLmdldFBhZFRvU2xpZGVyUGFkZGluZyhUSElTKTtcblx0XHRcdHZhciBib3JkZXJSYWRpdXMgPSBNYXRoLm1pbihcblx0XHRcdFx0VEhJUy5ib3JkZXJSYWRpdXMsXG5cdFx0XHRcdE1hdGgucm91bmQoVEhJUy5wYWRkaW5nICogTWF0aC5QSSkpOyAvLyBweFxuXHRcdFx0dmFyIHBhZEN1cnNvciA9ICdjcm9zc2hhaXInO1xuXG5cdFx0XHQvLyB3cmFwXG5cdFx0XHRwLndyYXAuc3R5bGUuY2xlYXIgPSAnYm90aCc7XG5cdFx0XHRwLndyYXAuc3R5bGUud2lkdGggPSAoZGltc1swXSArIDIgKiBUSElTLmJvcmRlcldpZHRoKSArICdweCc7XG5cdFx0XHRwLndyYXAuc3R5bGUuaGVpZ2h0ID0gKGRpbXNbMV0gKyAyICogVEhJUy5ib3JkZXJXaWR0aCkgKyAncHgnO1xuXHRcdFx0cC53cmFwLnN0eWxlLnpJbmRleCA9IFRISVMuekluZGV4O1xuXG5cdFx0XHQvLyBwaWNrZXJcblx0XHRcdHAuYm94LnN0eWxlLndpZHRoID0gZGltc1swXSArICdweCc7XG5cdFx0XHRwLmJveC5zdHlsZS5oZWlnaHQgPSBkaW1zWzFdICsgJ3B4JztcblxuXHRcdFx0cC5ib3hTLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHAuYm94Uy5zdHlsZS5sZWZ0ID0gJzAnO1xuXHRcdFx0cC5ib3hTLnN0eWxlLnRvcCA9ICcwJztcblx0XHRcdHAuYm94Uy5zdHlsZS53aWR0aCA9ICcxMDAlJztcblx0XHRcdHAuYm94Uy5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XG5cdFx0XHRqc2Muc2V0Qm9yZGVyUmFkaXVzKHAuYm94UywgYm9yZGVyUmFkaXVzICsgJ3B4Jyk7XG5cblx0XHRcdC8vIHBpY2tlciBib3JkZXJcblx0XHRcdHAuYm94Qi5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG5cdFx0XHRwLmJveEIuc3R5bGUuYm9yZGVyID0gVEhJUy5ib3JkZXJXaWR0aCArICdweCBzb2xpZCc7XG5cdFx0XHRwLmJveEIuc3R5bGUuYm9yZGVyQ29sb3IgPSBUSElTLmJvcmRlckNvbG9yO1xuXHRcdFx0cC5ib3hCLnN0eWxlLmJhY2tncm91bmQgPSBUSElTLmJhY2tncm91bmRDb2xvcjtcblx0XHRcdGpzYy5zZXRCb3JkZXJSYWRpdXMocC5ib3hCLCBib3JkZXJSYWRpdXMgKyAncHgnKTtcblxuXHRcdFx0Ly8gSUUgaGFjazpcblx0XHRcdC8vIElmIHRoZSBlbGVtZW50IGlzIHRyYW5zcGFyZW50LCBJRSB3aWxsIHRyaWdnZXIgdGhlIGV2ZW50IG9uIHRoZSBlbGVtZW50cyB1bmRlciBpdCxcblx0XHRcdC8vIGUuZy4gb24gQ2FudmFzIG9yIG9uIGVsZW1lbnRzIHdpdGggYm9yZGVyXG5cdFx0XHRwLnBhZE0uc3R5bGUuYmFja2dyb3VuZCA9XG5cdFx0XHRwLnNsZE0uc3R5bGUuYmFja2dyb3VuZCA9XG5cdFx0XHRcdCcjRkZGJztcblx0XHRcdGpzYy5zZXRTdHlsZShwLnBhZE0sICdvcGFjaXR5JywgJzAnKTtcblx0XHRcdGpzYy5zZXRTdHlsZShwLnNsZE0sICdvcGFjaXR5JywgJzAnKTtcblxuXHRcdFx0Ly8gcGFkXG5cdFx0XHRwLnBhZC5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG5cdFx0XHRwLnBhZC5zdHlsZS53aWR0aCA9IFRISVMud2lkdGggKyAncHgnO1xuXHRcdFx0cC5wYWQuc3R5bGUuaGVpZ2h0ID0gVEhJUy5oZWlnaHQgKyAncHgnO1xuXG5cdFx0XHQvLyBwYWQgcGFsZXR0ZXMgKEhTViBhbmQgSFZTKVxuXHRcdFx0cC5wYWRQYWwuZHJhdyhUSElTLndpZHRoLCBUSElTLmhlaWdodCwganNjLmdldFBhZFlDb21wb25lbnQoVEhJUykpO1xuXG5cdFx0XHQvLyBwYWQgYm9yZGVyXG5cdFx0XHRwLnBhZEIuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cC5wYWRCLnN0eWxlLmxlZnQgPSBUSElTLnBhZGRpbmcgKyAncHgnO1xuXHRcdFx0cC5wYWRCLnN0eWxlLnRvcCA9IFRISVMucGFkZGluZyArICdweCc7XG5cdFx0XHRwLnBhZEIuc3R5bGUuYm9yZGVyID0gVEhJUy5pbnNldFdpZHRoICsgJ3B4IHNvbGlkJztcblx0XHRcdHAucGFkQi5zdHlsZS5ib3JkZXJDb2xvciA9IFRISVMuaW5zZXRDb2xvcjtcblxuXHRcdFx0Ly8gcGFkIG1vdXNlIGFyZWFcblx0XHRcdHAucGFkTS5fanNjSW5zdGFuY2UgPSBUSElTO1xuXHRcdFx0cC5wYWRNLl9qc2NDb250cm9sTmFtZSA9ICdwYWQnO1xuXHRcdFx0cC5wYWRNLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHAucGFkTS5zdHlsZS5sZWZ0ID0gJzAnO1xuXHRcdFx0cC5wYWRNLnN0eWxlLnRvcCA9ICcwJztcblx0XHRcdHAucGFkTS5zdHlsZS53aWR0aCA9IChUSElTLnBhZGRpbmcgKyAyICogVEhJUy5pbnNldFdpZHRoICsgVEhJUy53aWR0aCArIHBhZFRvU2xpZGVyUGFkZGluZyAvIDIpICsgJ3B4Jztcblx0XHRcdHAucGFkTS5zdHlsZS5oZWlnaHQgPSBkaW1zWzFdICsgJ3B4Jztcblx0XHRcdHAucGFkTS5zdHlsZS5jdXJzb3IgPSBwYWRDdXJzb3I7XG5cblx0XHRcdC8vIHBhZCBjcm9zc1xuXHRcdFx0cC5jcm9zcy5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLmNyb3NzLnN0eWxlLmxlZnQgPVxuXHRcdFx0cC5jcm9zcy5zdHlsZS50b3AgPVxuXHRcdFx0XHQnMCc7XG5cdFx0XHRwLmNyb3NzLnN0eWxlLndpZHRoID1cblx0XHRcdHAuY3Jvc3Muc3R5bGUuaGVpZ2h0ID1cblx0XHRcdFx0Y3Jvc3NPdXRlclNpemUgKyAncHgnO1xuXG5cdFx0XHQvLyBwYWQgY3Jvc3MgYm9yZGVyIFkgYW5kIFhcblx0XHRcdHAuY3Jvc3NCWS5zdHlsZS5wb3NpdGlvbiA9XG5cdFx0XHRwLmNyb3NzQlguc3R5bGUucG9zaXRpb24gPVxuXHRcdFx0XHQnYWJzb2x1dGUnO1xuXHRcdFx0cC5jcm9zc0JZLnN0eWxlLmJhY2tncm91bmQgPVxuXHRcdFx0cC5jcm9zc0JYLnN0eWxlLmJhY2tncm91bmQgPVxuXHRcdFx0XHRUSElTLnBvaW50ZXJCb3JkZXJDb2xvcjtcblx0XHRcdHAuY3Jvc3NCWS5zdHlsZS53aWR0aCA9XG5cdFx0XHRwLmNyb3NzQlguc3R5bGUuaGVpZ2h0ID1cblx0XHRcdFx0KDIgKiBUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCArIFRISVMucG9pbnRlclRoaWNrbmVzcykgKyAncHgnO1xuXHRcdFx0cC5jcm9zc0JZLnN0eWxlLmhlaWdodCA9XG5cdFx0XHRwLmNyb3NzQlguc3R5bGUud2lkdGggPVxuXHRcdFx0XHRjcm9zc091dGVyU2l6ZSArICdweCc7XG5cdFx0XHRwLmNyb3NzQlkuc3R5bGUubGVmdCA9XG5cdFx0XHRwLmNyb3NzQlguc3R5bGUudG9wID1cblx0XHRcdFx0KE1hdGguZmxvb3IoY3Jvc3NPdXRlclNpemUgLyAyKSAtIE1hdGguZmxvb3IoVEhJUy5wb2ludGVyVGhpY2tuZXNzIC8gMikgLSBUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCkgKyAncHgnO1xuXHRcdFx0cC5jcm9zc0JZLnN0eWxlLnRvcCA9XG5cdFx0XHRwLmNyb3NzQlguc3R5bGUubGVmdCA9XG5cdFx0XHRcdCcwJztcblxuXHRcdFx0Ly8gcGFkIGNyb3NzIGxpbmUgWSBhbmQgWFxuXHRcdFx0cC5jcm9zc0xZLnN0eWxlLnBvc2l0aW9uID1cblx0XHRcdHAuY3Jvc3NMWC5zdHlsZS5wb3NpdGlvbiA9XG5cdFx0XHRcdCdhYnNvbHV0ZSc7XG5cdFx0XHRwLmNyb3NzTFkuc3R5bGUuYmFja2dyb3VuZCA9XG5cdFx0XHRwLmNyb3NzTFguc3R5bGUuYmFja2dyb3VuZCA9XG5cdFx0XHRcdFRISVMucG9pbnRlckNvbG9yO1xuXHRcdFx0cC5jcm9zc0xZLnN0eWxlLmhlaWdodCA9XG5cdFx0XHRwLmNyb3NzTFguc3R5bGUud2lkdGggPVxuXHRcdFx0XHQoY3Jvc3NPdXRlclNpemUgLSAyICogVEhJUy5wb2ludGVyQm9yZGVyV2lkdGgpICsgJ3B4Jztcblx0XHRcdHAuY3Jvc3NMWS5zdHlsZS53aWR0aCA9XG5cdFx0XHRwLmNyb3NzTFguc3R5bGUuaGVpZ2h0ID1cblx0XHRcdFx0VEhJUy5wb2ludGVyVGhpY2tuZXNzICsgJ3B4Jztcblx0XHRcdHAuY3Jvc3NMWS5zdHlsZS5sZWZ0ID1cblx0XHRcdHAuY3Jvc3NMWC5zdHlsZS50b3AgPVxuXHRcdFx0XHQoTWF0aC5mbG9vcihjcm9zc091dGVyU2l6ZSAvIDIpIC0gTWF0aC5mbG9vcihUSElTLnBvaW50ZXJUaGlja25lc3MgLyAyKSkgKyAncHgnO1xuXHRcdFx0cC5jcm9zc0xZLnN0eWxlLnRvcCA9XG5cdFx0XHRwLmNyb3NzTFguc3R5bGUubGVmdCA9XG5cdFx0XHRcdFRISVMucG9pbnRlckJvcmRlcldpZHRoICsgJ3B4JztcblxuXHRcdFx0Ly8gc2xpZGVyXG5cdFx0XHRwLnNsZC5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuXHRcdFx0cC5zbGQuc3R5bGUud2lkdGggPSBUSElTLnNsaWRlclNpemUgKyAncHgnO1xuXHRcdFx0cC5zbGQuc3R5bGUuaGVpZ2h0ID0gVEhJUy5oZWlnaHQgKyAncHgnO1xuXG5cdFx0XHQvLyBzbGlkZXIgZ3JhZGllbnRcblx0XHRcdHAuc2xkR3JhZC5kcmF3KFRISVMuc2xpZGVyU2l6ZSwgVEhJUy5oZWlnaHQsICcjMDAwJywgJyMwMDAnKTtcblxuXHRcdFx0Ly8gc2xpZGVyIGJvcmRlclxuXHRcdFx0cC5zbGRCLnN0eWxlLmRpc3BsYXkgPSBkaXNwbGF5U2xpZGVyID8gJ2Jsb2NrJyA6ICdub25lJztcblx0XHRcdHAuc2xkQi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLnNsZEIuc3R5bGUucmlnaHQgPSBUSElTLnBhZGRpbmcgKyAncHgnO1xuXHRcdFx0cC5zbGRCLnN0eWxlLnRvcCA9IFRISVMucGFkZGluZyArICdweCc7XG5cdFx0XHRwLnNsZEIuc3R5bGUuYm9yZGVyID0gVEhJUy5pbnNldFdpZHRoICsgJ3B4IHNvbGlkJztcblx0XHRcdHAuc2xkQi5zdHlsZS5ib3JkZXJDb2xvciA9IFRISVMuaW5zZXRDb2xvcjtcblxuXHRcdFx0Ly8gc2xpZGVyIG1vdXNlIGFyZWFcblx0XHRcdHAuc2xkTS5fanNjSW5zdGFuY2UgPSBUSElTO1xuXHRcdFx0cC5zbGRNLl9qc2NDb250cm9sTmFtZSA9ICdzbGQnO1xuXHRcdFx0cC5zbGRNLnN0eWxlLmRpc3BsYXkgPSBkaXNwbGF5U2xpZGVyID8gJ2Jsb2NrJyA6ICdub25lJztcblx0XHRcdHAuc2xkTS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLnNsZE0uc3R5bGUucmlnaHQgPSAnMCc7XG5cdFx0XHRwLnNsZE0uc3R5bGUudG9wID0gJzAnO1xuXHRcdFx0cC5zbGRNLnN0eWxlLndpZHRoID0gKFRISVMuc2xpZGVyU2l6ZSArIHBhZFRvU2xpZGVyUGFkZGluZyAvIDIgKyBUSElTLnBhZGRpbmcgKyAyICogVEhJUy5pbnNldFdpZHRoKSArICdweCc7XG5cdFx0XHRwLnNsZE0uc3R5bGUuaGVpZ2h0ID0gZGltc1sxXSArICdweCc7XG5cdFx0XHRwLnNsZE0uc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQnO1xuXG5cdFx0XHQvLyBzbGlkZXIgcG9pbnRlciBpbm5lciBhbmQgb3V0ZXIgYm9yZGVyXG5cdFx0XHRwLnNsZFB0cklCLnN0eWxlLmJvcmRlciA9XG5cdFx0XHRwLnNsZFB0ck9CLnN0eWxlLmJvcmRlciA9XG5cdFx0XHRcdFRISVMucG9pbnRlckJvcmRlcldpZHRoICsgJ3B4IHNvbGlkICcgKyBUSElTLnBvaW50ZXJCb3JkZXJDb2xvcjtcblxuXHRcdFx0Ly8gc2xpZGVyIHBvaW50ZXIgb3V0ZXIgYm9yZGVyXG5cdFx0XHRwLnNsZFB0ck9CLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHAuc2xkUHRyT0Iuc3R5bGUubGVmdCA9IC0oMiAqIFRISVMucG9pbnRlckJvcmRlcldpZHRoICsgVEhJUy5wb2ludGVyVGhpY2tuZXNzKSArICdweCc7XG5cdFx0XHRwLnNsZFB0ck9CLnN0eWxlLnRvcCA9ICcwJztcblxuXHRcdFx0Ly8gc2xpZGVyIHBvaW50ZXIgbWlkZGxlIGJvcmRlclxuXHRcdFx0cC5zbGRQdHJNQi5zdHlsZS5ib3JkZXIgPSBUSElTLnBvaW50ZXJUaGlja25lc3MgKyAncHggc29saWQgJyArIFRISVMucG9pbnRlckNvbG9yO1xuXG5cdFx0XHQvLyBzbGlkZXIgcG9pbnRlciBzcGFjZXJcblx0XHRcdHAuc2xkUHRyUy5zdHlsZS53aWR0aCA9IFRISVMuc2xpZGVyU2l6ZSArICdweCc7XG5cdFx0XHRwLnNsZFB0clMuc3R5bGUuaGVpZ2h0ID0gc2xpZGVyUHRyU3BhY2UgKyAncHgnO1xuXG5cdFx0XHQvLyB0aGUgQ2xvc2UgYnV0dG9uXG5cdFx0XHRmdW5jdGlvbiBzZXRCdG5Cb3JkZXIgKCkge1xuXHRcdFx0XHR2YXIgaW5zZXRDb2xvcnMgPSBUSElTLmluc2V0Q29sb3Iuc3BsaXQoL1xccysvKTtcblx0XHRcdFx0dmFyIG91dHNldENvbG9yID0gaW5zZXRDb2xvcnMubGVuZ3RoIDwgMiA/IGluc2V0Q29sb3JzWzBdIDogaW5zZXRDb2xvcnNbMV0gKyAnICcgKyBpbnNldENvbG9yc1swXSArICcgJyArIGluc2V0Q29sb3JzWzBdICsgJyAnICsgaW5zZXRDb2xvcnNbMV07XG5cdFx0XHRcdHAuYnRuLnN0eWxlLmJvcmRlckNvbG9yID0gb3V0c2V0Q29sb3I7XG5cdFx0XHR9XG5cdFx0XHRwLmJ0bi5zdHlsZS5kaXNwbGF5ID0gVEhJUy5jbG9zYWJsZSA/ICdibG9jaycgOiAnbm9uZSc7XG5cdFx0XHRwLmJ0bi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLmJ0bi5zdHlsZS5sZWZ0ID0gVEhJUy5wYWRkaW5nICsgJ3B4Jztcblx0XHRcdHAuYnRuLnN0eWxlLmJvdHRvbSA9IFRISVMucGFkZGluZyArICdweCc7XG5cdFx0XHRwLmJ0bi5zdHlsZS5wYWRkaW5nID0gJzAgMTVweCc7XG5cdFx0XHRwLmJ0bi5zdHlsZS5oZWlnaHQgPSBUSElTLmJ1dHRvbkhlaWdodCArICdweCc7XG5cdFx0XHRwLmJ0bi5zdHlsZS5ib3JkZXIgPSBUSElTLmluc2V0V2lkdGggKyAncHggc29saWQnO1xuXHRcdFx0c2V0QnRuQm9yZGVyKCk7XG5cdFx0XHRwLmJ0bi5zdHlsZS5jb2xvciA9IFRISVMuYnV0dG9uQ29sb3I7XG5cdFx0XHRwLmJ0bi5zdHlsZS5mb250ID0gJzEycHggc2Fucy1zZXJpZic7XG5cdFx0XHRwLmJ0bi5zdHlsZS50ZXh0QWxpZ24gPSAnY2VudGVyJztcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHAuYnRuLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcblx0XHRcdH0gY2F0Y2goZU9sZElFKSB7XG5cdFx0XHRcdHAuYnRuLnN0eWxlLmN1cnNvciA9ICdoYW5kJztcblx0XHRcdH1cblx0XHRcdHAuYnRuLm9ubW91c2Vkb3duID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRUSElTLmhpZGUoKTtcblx0XHRcdH07XG5cdFx0XHRwLmJ0blQuc3R5bGUubGluZUhlaWdodCA9IFRISVMuYnV0dG9uSGVpZ2h0ICsgJ3B4Jztcblx0XHRcdHAuYnRuVC5pbm5lckhUTUwgPSAnJztcblx0XHRcdHAuYnRuVC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShUSElTLmNsb3NlVGV4dCkpO1xuXG5cdFx0XHQvLyBwbGFjZSBwb2ludGVyc1xuXHRcdFx0cmVkcmF3UGFkKCk7XG5cdFx0XHRyZWRyYXdTbGQoKTtcblxuXHRcdFx0Ly8gSWYgd2UgYXJlIGNoYW5naW5nIHRoZSBvd25lciB3aXRob3V0IGZpcnN0IGNsb3NpbmcgdGhlIHBpY2tlcixcblx0XHRcdC8vIG1ha2Ugc3VyZSB0byBmaXJzdCBkZWFsIHdpdGggdGhlIG9sZCBvd25lclxuXHRcdFx0aWYgKGpzYy5waWNrZXIub3duZXIgJiYganNjLnBpY2tlci5vd25lciAhPT0gVEhJUykge1xuXHRcdFx0XHRqc2MudW5zZXRDbGFzcyhqc2MucGlja2VyLm93bmVyLnRhcmdldEVsZW1lbnQsIFRISVMuYWN0aXZlQ2xhc3MpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBTZXQgdGhlIG5ldyBwaWNrZXIgb3duZXJcblx0XHRcdGpzYy5waWNrZXIub3duZXIgPSBUSElTO1xuXG5cdFx0XHQvLyBUaGUgcmVkcmF3UG9zaXRpb24oKSBtZXRob2QgbmVlZHMgcGlja2VyLm93bmVyIHRvIGJlIHNldCwgdGhhdCdzIHdoeSB3ZSBjYWxsIGl0IGhlcmUsXG5cdFx0XHQvLyBhZnRlciBzZXR0aW5nIHRoZSBvd25lclxuXHRcdFx0aWYgKGpzYy5pc0VsZW1lbnRUeXBlKGNvbnRhaW5lciwgJ2JvZHknKSkge1xuXHRcdFx0XHRqc2MucmVkcmF3UG9zaXRpb24oKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGpzYy5fZHJhd1Bvc2l0aW9uKFRISVMsIDAsIDAsICdyZWxhdGl2ZScsIGZhbHNlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHAud3JhcC5wYXJlbnROb2RlICE9IGNvbnRhaW5lcikge1xuXHRcdFx0XHRjb250YWluZXIuYXBwZW5kQ2hpbGQocC53cmFwKTtcblx0XHRcdH1cblxuXHRcdFx0anNjLnNldENsYXNzKFRISVMudGFyZ2V0RWxlbWVudCwgVEhJUy5hY3RpdmVDbGFzcyk7XG5cdFx0fVxuXG5cblx0XHRmdW5jdGlvbiByZWRyYXdQYWQgKCkge1xuXHRcdFx0Ly8gcmVkcmF3IHRoZSBwYWQgcG9pbnRlclxuXHRcdFx0c3dpdGNoIChqc2MuZ2V0UGFkWUNvbXBvbmVudChUSElTKSkge1xuXHRcdFx0Y2FzZSAncyc6IHZhciB5Q29tcG9uZW50ID0gMTsgYnJlYWs7XG5cdFx0XHRjYXNlICd2JzogdmFyIHlDb21wb25lbnQgPSAyOyBicmVhaztcblx0XHRcdH1cblx0XHRcdHZhciB4ID0gTWF0aC5yb3VuZCgoVEhJUy5oc3ZbMF0gLyAzNjApICogKFRISVMud2lkdGggLSAxKSk7XG5cdFx0XHR2YXIgeSA9IE1hdGgucm91bmQoKDEgLSBUSElTLmhzdlt5Q29tcG9uZW50XSAvIDEwMCkgKiAoVEhJUy5oZWlnaHQgLSAxKSk7XG5cdFx0XHR2YXIgY3Jvc3NPdXRlclNpemUgPSAoMiAqIFRISVMucG9pbnRlckJvcmRlcldpZHRoICsgVEhJUy5wb2ludGVyVGhpY2tuZXNzICsgMiAqIFRISVMuY3Jvc3NTaXplKTtcblx0XHRcdHZhciBvZnMgPSAtTWF0aC5mbG9vcihjcm9zc091dGVyU2l6ZSAvIDIpO1xuXHRcdFx0anNjLnBpY2tlci5jcm9zcy5zdHlsZS5sZWZ0ID0gKHggKyBvZnMpICsgJ3B4Jztcblx0XHRcdGpzYy5waWNrZXIuY3Jvc3Muc3R5bGUudG9wID0gKHkgKyBvZnMpICsgJ3B4JztcblxuXHRcdFx0Ly8gcmVkcmF3IHRoZSBzbGlkZXJcblx0XHRcdHN3aXRjaCAoanNjLmdldFNsaWRlckNvbXBvbmVudChUSElTKSkge1xuXHRcdFx0Y2FzZSAncyc6XG5cdFx0XHRcdHZhciByZ2IxID0gSFNWX1JHQihUSElTLmhzdlswXSwgMTAwLCBUSElTLmhzdlsyXSk7XG5cdFx0XHRcdHZhciByZ2IyID0gSFNWX1JHQihUSElTLmhzdlswXSwgMCwgVEhJUy5oc3ZbMl0pO1xuXHRcdFx0XHR2YXIgY29sb3IxID0gJ3JnYignICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYjFbMF0pICsgJywnICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYjFbMV0pICsgJywnICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYjFbMl0pICsgJyknO1xuXHRcdFx0XHR2YXIgY29sb3IyID0gJ3JnYignICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYjJbMF0pICsgJywnICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYjJbMV0pICsgJywnICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYjJbMl0pICsgJyknO1xuXHRcdFx0XHRqc2MucGlja2VyLnNsZEdyYWQuZHJhdyhUSElTLnNsaWRlclNpemUsIFRISVMuaGVpZ2h0LCBjb2xvcjEsIGNvbG9yMik7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAndic6XG5cdFx0XHRcdHZhciByZ2IgPSBIU1ZfUkdCKFRISVMuaHN2WzBdLCBUSElTLmhzdlsxXSwgMTAwKTtcblx0XHRcdFx0dmFyIGNvbG9yMSA9ICdyZ2IoJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2JbMF0pICsgJywnICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYlsxXSkgKyAnLCcgK1xuXHRcdFx0XHRcdE1hdGgucm91bmQocmdiWzJdKSArICcpJztcblx0XHRcdFx0dmFyIGNvbG9yMiA9ICcjMDAwJztcblx0XHRcdFx0anNjLnBpY2tlci5zbGRHcmFkLmRyYXcoVEhJUy5zbGlkZXJTaXplLCBUSElTLmhlaWdodCwgY29sb3IxLCBjb2xvcjIpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9XG5cblxuXHRcdGZ1bmN0aW9uIHJlZHJhd1NsZCAoKSB7XG5cdFx0XHR2YXIgc2xkQ29tcG9uZW50ID0ganNjLmdldFNsaWRlckNvbXBvbmVudChUSElTKTtcblx0XHRcdGlmIChzbGRDb21wb25lbnQpIHtcblx0XHRcdFx0Ly8gcmVkcmF3IHRoZSBzbGlkZXIgcG9pbnRlclxuXHRcdFx0XHRzd2l0Y2ggKHNsZENvbXBvbmVudCkge1xuXHRcdFx0XHRjYXNlICdzJzogdmFyIHlDb21wb25lbnQgPSAxOyBicmVhaztcblx0XHRcdFx0Y2FzZSAndic6IHZhciB5Q29tcG9uZW50ID0gMjsgYnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdFx0dmFyIHkgPSBNYXRoLnJvdW5kKCgxIC0gVEhJUy5oc3ZbeUNvbXBvbmVudF0gLyAxMDApICogKFRISVMuaGVpZ2h0IC0gMSkpO1xuXHRcdFx0XHRqc2MucGlja2VyLnNsZFB0ck9CLnN0eWxlLnRvcCA9ICh5IC0gKDIgKiBUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCArIFRISVMucG9pbnRlclRoaWNrbmVzcykgLSBNYXRoLmZsb29yKHNsaWRlclB0clNwYWNlIC8gMikpICsgJ3B4Jztcblx0XHRcdH1cblx0XHR9XG5cblxuXHRcdGZ1bmN0aW9uIGlzUGlja2VyT3duZXIgKCkge1xuXHRcdFx0cmV0dXJuIGpzYy5waWNrZXIgJiYganNjLnBpY2tlci5vd25lciA9PT0gVEhJUztcblx0XHR9XG5cblxuXHRcdGZ1bmN0aW9uIGJsdXJWYWx1ZSAoKSB7XG5cdFx0XHRUSElTLmltcG9ydENvbG9yKCk7XG5cdFx0fVxuXG5cblx0XHQvLyBGaW5kIHRoZSB0YXJnZXQgZWxlbWVudFxuXHRcdGlmICh0eXBlb2YgdGFyZ2V0RWxlbWVudCA9PT0gJ3N0cmluZycpIHtcblx0XHRcdHZhciBpZCA9IHRhcmdldEVsZW1lbnQ7XG5cdFx0XHR2YXIgZWxtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuXHRcdFx0aWYgKGVsbSkge1xuXHRcdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBlbG07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRqc2Mud2FybignQ291bGQgbm90IGZpbmQgdGFyZ2V0IGVsZW1lbnQgd2l0aCBJRCBcXCcnICsgaWQgKyAnXFwnJyk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmICh0YXJnZXRFbGVtZW50KSB7XG5cdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSB0YXJnZXRFbGVtZW50O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRqc2Mud2FybignSW52YWxpZCB0YXJnZXQgZWxlbWVudDogXFwnJyArIHRhcmdldEVsZW1lbnQgKyAnXFwnJyk7XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMudGFyZ2V0RWxlbWVudC5fanNjTGlua2VkSW5zdGFuY2UpIHtcblx0XHRcdGpzYy53YXJuKCdDYW5ub3QgbGluayBqc2NvbG9yIHR3aWNlIHRvIHRoZSBzYW1lIGVsZW1lbnQuIFNraXBwaW5nLicpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHR0aGlzLnRhcmdldEVsZW1lbnQuX2pzY0xpbmtlZEluc3RhbmNlID0gdGhpcztcblxuXHRcdC8vIEZpbmQgdGhlIHZhbHVlIGVsZW1lbnRcblx0XHR0aGlzLnZhbHVlRWxlbWVudCA9IGpzYy5mZXRjaEVsZW1lbnQodGhpcy52YWx1ZUVsZW1lbnQpO1xuXHRcdC8vIEZpbmQgdGhlIHN0eWxlIGVsZW1lbnRcblx0XHR0aGlzLnN0eWxlRWxlbWVudCA9IGpzYy5mZXRjaEVsZW1lbnQodGhpcy5zdHlsZUVsZW1lbnQpO1xuXG5cdFx0dmFyIFRISVMgPSB0aGlzO1xuXHRcdHZhciBjb250YWluZXIgPVxuXHRcdFx0dGhpcy5jb250YWluZXIgP1xuXHRcdFx0anNjLmZldGNoRWxlbWVudCh0aGlzLmNvbnRhaW5lcikgOlxuXHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVswXTtcblx0XHR2YXIgc2xpZGVyUHRyU3BhY2UgPSAzOyAvLyBweFxuXG5cdFx0Ly8gRm9yIEJVVFRPTiBlbGVtZW50cyBpdCdzIGltcG9ydGFudCB0byBzdG9wIHRoZW0gZnJvbSBzZW5kaW5nIHRoZSBmb3JtIHdoZW4gY2xpY2tlZFxuXHRcdC8vIChlLmcuIGluIFNhZmFyaSlcblx0XHRpZiAoanNjLmlzRWxlbWVudFR5cGUodGhpcy50YXJnZXRFbGVtZW50LCAnYnV0dG9uJykpIHtcblx0XHRcdGlmICh0aGlzLnRhcmdldEVsZW1lbnQub25jbGljaykge1xuXHRcdFx0XHR2YXIgb3JpZ0NhbGxiYWNrID0gdGhpcy50YXJnZXRFbGVtZW50Lm9uY2xpY2s7XG5cdFx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudC5vbmNsaWNrID0gZnVuY3Rpb24gKGV2dCkge1xuXHRcdFx0XHRcdG9yaWdDYWxsYmFjay5jYWxsKHRoaXMsIGV2dCk7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9O1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy50YXJnZXRFbGVtZW50Lm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvKlxuXHRcdHZhciBlbG0gPSB0aGlzLnRhcmdldEVsZW1lbnQ7XG5cdFx0ZG8ge1xuXHRcdFx0Ly8gSWYgdGhlIHRhcmdldCBlbGVtZW50IG9yIG9uZSBvZiBpdHMgb2Zmc2V0UGFyZW50cyBoYXMgZml4ZWQgcG9zaXRpb24sXG5cdFx0XHQvLyB0aGVuIHVzZSBmaXhlZCBwb3NpdGlvbmluZyBpbnN0ZWFkXG5cdFx0XHQvL1xuXHRcdFx0Ly8gTm90ZTogSW4gRmlyZWZveCwgZ2V0Q29tcHV0ZWRTdHlsZSByZXR1cm5zIG51bGwgaW4gYSBoaWRkZW4gaWZyYW1lLFxuXHRcdFx0Ly8gdGhhdCdzIHdoeSB3ZSBuZWVkIHRvIGNoZWNrIGlmIHRoZSByZXR1cm5lZCBzdHlsZSBvYmplY3QgaXMgbm9uLWVtcHR5XG5cdFx0XHR2YXIgY3VyclN0eWxlID0ganNjLmdldFN0eWxlKGVsbSk7XG5cdFx0XHRpZiAoY3VyclN0eWxlICYmIGN1cnJTdHlsZS5wb3NpdGlvbi50b0xvd2VyQ2FzZSgpID09PSAnZml4ZWQnKSB7XG5cdFx0XHRcdHRoaXMuZml4ZWQgPSB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZWxtICE9PSB0aGlzLnRhcmdldEVsZW1lbnQpIHtcblx0XHRcdFx0Ly8gYXR0YWNoIG9uUGFyZW50U2Nyb2xsIHNvIHRoYXQgd2UgY2FuIHJlY29tcHV0ZSB0aGUgcGlja2VyIHBvc2l0aW9uXG5cdFx0XHRcdC8vIHdoZW4gb25lIG9mIHRoZSBvZmZzZXRQYXJlbnRzIGlzIHNjcm9sbGVkXG5cdFx0XHRcdGlmICghZWxtLl9qc2NFdmVudHNBdHRhY2hlZCkge1xuXHRcdFx0XHRcdGpzYy5hdHRhY2hFdmVudChlbG0sICdzY3JvbGwnLCBqc2Mub25QYXJlbnRTY3JvbGwpO1xuXHRcdFx0XHRcdGVsbS5fanNjRXZlbnRzQXR0YWNoZWQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSB3aGlsZSAoKGVsbSA9IGVsbS5vZmZzZXRQYXJlbnQpICYmICFqc2MuaXNFbGVtZW50VHlwZShlbG0sICdib2R5JykpO1xuXHRcdCovXG5cblx0XHQvLyB2YWx1ZUVsZW1lbnRcblx0XHRpZiAodGhpcy52YWx1ZUVsZW1lbnQpIHtcblx0XHRcdGlmIChqc2MuaXNFbGVtZW50VHlwZSh0aGlzLnZhbHVlRWxlbWVudCwgJ2lucHV0JykpIHtcblx0XHRcdFx0dmFyIHVwZGF0ZUZpZWxkID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFRISVMuZnJvbVN0cmluZyhUSElTLnZhbHVlRWxlbWVudC52YWx1ZSwganNjLmxlYXZlVmFsdWUpO1xuXHRcdFx0XHRcdGpzYy5kaXNwYXRjaEZpbmVDaGFuZ2UoVEhJUyk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdGpzYy5hdHRhY2hFdmVudCh0aGlzLnZhbHVlRWxlbWVudCwgJ2tleXVwJywgdXBkYXRlRmllbGQpO1xuXHRcdFx0XHRqc2MuYXR0YWNoRXZlbnQodGhpcy52YWx1ZUVsZW1lbnQsICdpbnB1dCcsIHVwZGF0ZUZpZWxkKTtcblx0XHRcdFx0anNjLmF0dGFjaEV2ZW50KHRoaXMudmFsdWVFbGVtZW50LCAnYmx1cicsIGJsdXJWYWx1ZSk7XG5cdFx0XHRcdHRoaXMudmFsdWVFbGVtZW50LnNldEF0dHJpYnV0ZSgnYXV0b2NvbXBsZXRlJywgJ29mZicpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIHN0eWxlRWxlbWVudFxuXHRcdGlmICh0aGlzLnN0eWxlRWxlbWVudCkge1xuXHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuX2pzY09yaWdTdHlsZSA9IHtcblx0XHRcdFx0YmFja2dyb3VuZEltYWdlIDogdGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZEltYWdlLFxuXHRcdFx0XHRiYWNrZ3JvdW5kQ29sb3IgOiB0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IsXG5cdFx0XHRcdGNvbG9yIDogdGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuY29sb3Jcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMudmFsdWUpIHtcblx0XHRcdC8vIFRyeSB0byBzZXQgdGhlIGNvbG9yIGZyb20gdGhlIC52YWx1ZSBvcHRpb24gYW5kIGlmIHVuc3VjY2Vzc2Z1bCxcblx0XHRcdC8vIGV4cG9ydCB0aGUgY3VycmVudCBjb2xvclxuXHRcdFx0dGhpcy5mcm9tU3RyaW5nKHRoaXMudmFsdWUpIHx8IHRoaXMuZXhwb3J0Q29sb3IoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5pbXBvcnRDb2xvcigpO1xuXHRcdH1cblx0fVxuXG59O1xuXG5cbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIFB1YmxpYyBwcm9wZXJ0aWVzIGFuZCBtZXRob2RzXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cblxuLy8gQnkgZGVmYXVsdCwgc2VhcmNoIGZvciBhbGwgZWxlbWVudHMgd2l0aCBjbGFzcz1cImpzY29sb3JcIiBhbmQgaW5zdGFsbCBhIGNvbG9yIHBpY2tlciBvbiB0aGVtLlxuLy9cbi8vIFlvdSBjYW4gY2hhbmdlIHdoYXQgY2xhc3MgbmFtZSB3aWxsIGJlIGxvb2tlZCBmb3IgYnkgc2V0dGluZyB0aGUgcHJvcGVydHkganNjb2xvci5sb29rdXBDbGFzc1xuLy8gYW55d2hlcmUgaW4geW91ciBIVE1MIGRvY3VtZW50LiBUbyBjb21wbGV0ZWx5IGRpc2FibGUgdGhlIGF1dG9tYXRpYyBsb29rdXAsIHNldCBpdCB0byBudWxsLlxuLy9cbmpzYy5qc2NvbG9yLmxvb2t1cENsYXNzID0gJ2pzY29sb3InO1xuXG5cbmpzYy5qc2NvbG9yLmluc3RhbGxCeUNsYXNzTmFtZSA9IGZ1bmN0aW9uIChjbGFzc05hbWUpIHtcblx0dmFyIGlucHV0RWxtcyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbnB1dCcpO1xuXHR2YXIgYnV0dG9uRWxtcyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdidXR0b24nKTtcblxuXHRqc2MudHJ5SW5zdGFsbE9uRWxlbWVudHMoaW5wdXRFbG1zLCBjbGFzc05hbWUpO1xuXHRqc2MudHJ5SW5zdGFsbE9uRWxlbWVudHMoYnV0dG9uRWxtcywgY2xhc3NOYW1lKTtcbn07XG5cblxuanNjLnJlZ2lzdGVyKCk7XG5cblxucmV0dXJuIGpzYy5qc2NvbG9yO1xuXG5cbn0pKCk7IH1cbiIsIi8qISB2ZXguY29tYmluZWQuanM6IHZleCAzLjEuMSwgdmV4LWRpYWxvZyAxLjAuNyAqL1xuIWZ1bmN0aW9uKGEpe2lmKFwib2JqZWN0XCI9PXR5cGVvZiBleHBvcnRzJiZcInVuZGVmaW5lZFwiIT10eXBlb2YgbW9kdWxlKW1vZHVsZS5leHBvcnRzPWEoKTtlbHNlIGlmKFwiZnVuY3Rpb25cIj09dHlwZW9mIGRlZmluZSYmZGVmaW5lLmFtZClkZWZpbmUoW10sYSk7ZWxzZXt2YXIgYjtiPVwidW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3c/d2luZG93OlwidW5kZWZpbmVkXCIhPXR5cGVvZiBnbG9iYWw/Z2xvYmFsOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6dGhpcyxiLnZleD1hKCl9fShmdW5jdGlvbigpe3ZhciBhO3JldHVybiBmdW5jdGlvbiBiKGEsYyxkKXtmdW5jdGlvbiBlKGcsaCl7aWYoIWNbZ10pe2lmKCFhW2ddKXt2YXIgaT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFoJiZpKXJldHVybiBpKGcsITApO2lmKGYpcmV0dXJuIGYoZywhMCk7dmFyIGo9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitnK1wiJ1wiKTt0aHJvdyBqLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsan12YXIgaz1jW2ddPXtleHBvcnRzOnt9fTthW2ddWzBdLmNhbGwoay5leHBvcnRzLGZ1bmN0aW9uKGIpe3ZhciBjPWFbZ11bMV1bYl07cmV0dXJuIGUoYz9jOmIpfSxrLGsuZXhwb3J0cyxiLGEsYyxkKX1yZXR1cm4gY1tnXS5leHBvcnRzfWZvcih2YXIgZj1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGc9MDtnPGQubGVuZ3RoO2crKyllKGRbZ10pO3JldHVybiBlfSh7MTpbZnVuY3Rpb24oYSxiLGMpe1wiZG9jdW1lbnRcImluIHdpbmRvdy5zZWxmJiYoXCJjbGFzc0xpc3RcImluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJfXCIpJiYoIWRvY3VtZW50LmNyZWF0ZUVsZW1lbnROU3x8XCJjbGFzc0xpc3RcImluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsXCJnXCIpKT8hZnVuY3Rpb24oKXtcInVzZSBzdHJpY3RcIjt2YXIgYT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKTtpZihhLmNsYXNzTGlzdC5hZGQoXCJjMVwiLFwiYzJcIiksIWEuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYzJcIikpe3ZhciBiPWZ1bmN0aW9uKGEpe3ZhciBiPURPTVRva2VuTGlzdC5wcm90b3R5cGVbYV07RE9NVG9rZW5MaXN0LnByb3RvdHlwZVthXT1mdW5jdGlvbihhKXt2YXIgYyxkPWFyZ3VtZW50cy5sZW5ndGg7Zm9yKGM9MDtjPGQ7YysrKWE9YXJndW1lbnRzW2NdLGIuY2FsbCh0aGlzLGEpfX07YihcImFkZFwiKSxiKFwicmVtb3ZlXCIpfWlmKGEuY2xhc3NMaXN0LnRvZ2dsZShcImMzXCIsITEpLGEuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYzNcIikpe3ZhciBjPURPTVRva2VuTGlzdC5wcm90b3R5cGUudG9nZ2xlO0RPTVRva2VuTGlzdC5wcm90b3R5cGUudG9nZ2xlPWZ1bmN0aW9uKGEsYil7cmV0dXJuIDEgaW4gYXJndW1lbnRzJiYhdGhpcy5jb250YWlucyhhKT09IWI/YjpjLmNhbGwodGhpcyxhKX19YT1udWxsfSgpOiFmdW5jdGlvbihhKXtcInVzZSBzdHJpY3RcIjtpZihcIkVsZW1lbnRcImluIGEpe3ZhciBiPVwiY2xhc3NMaXN0XCIsYz1cInByb3RvdHlwZVwiLGQ9YS5FbGVtZW50W2NdLGU9T2JqZWN0LGY9U3RyaW5nW2NdLnRyaW18fGZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMucmVwbGFjZSgvXlxccyt8XFxzKyQvZyxcIlwiKX0sZz1BcnJheVtjXS5pbmRleE9mfHxmdW5jdGlvbihhKXtmb3IodmFyIGI9MCxjPXRoaXMubGVuZ3RoO2I8YztiKyspaWYoYiBpbiB0aGlzJiZ0aGlzW2JdPT09YSlyZXR1cm4gYjtyZXR1cm4tMX0saD1mdW5jdGlvbihhLGIpe3RoaXMubmFtZT1hLHRoaXMuY29kZT1ET01FeGNlcHRpb25bYV0sdGhpcy5tZXNzYWdlPWJ9LGk9ZnVuY3Rpb24oYSxiKXtpZihcIlwiPT09Yil0aHJvdyBuZXcgaChcIlNZTlRBWF9FUlJcIixcIkFuIGludmFsaWQgb3IgaWxsZWdhbCBzdHJpbmcgd2FzIHNwZWNpZmllZFwiKTtpZigvXFxzLy50ZXN0KGIpKXRocm93IG5ldyBoKFwiSU5WQUxJRF9DSEFSQUNURVJfRVJSXCIsXCJTdHJpbmcgY29udGFpbnMgYW4gaW52YWxpZCBjaGFyYWN0ZXJcIik7cmV0dXJuIGcuY2FsbChhLGIpfSxqPWZ1bmN0aW9uKGEpe2Zvcih2YXIgYj1mLmNhbGwoYS5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKXx8XCJcIiksYz1iP2Iuc3BsaXQoL1xccysvKTpbXSxkPTAsZT1jLmxlbmd0aDtkPGU7ZCsrKXRoaXMucHVzaChjW2RdKTt0aGlzLl91cGRhdGVDbGFzc05hbWU9ZnVuY3Rpb24oKXthLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsdGhpcy50b1N0cmluZygpKX19LGs9altjXT1bXSxsPWZ1bmN0aW9uKCl7cmV0dXJuIG5ldyBqKHRoaXMpfTtpZihoW2NdPUVycm9yW2NdLGsuaXRlbT1mdW5jdGlvbihhKXtyZXR1cm4gdGhpc1thXXx8bnVsbH0say5jb250YWlucz1mdW5jdGlvbihhKXtyZXR1cm4gYSs9XCJcIixpKHRoaXMsYSkhPT0tMX0say5hZGQ9ZnVuY3Rpb24oKXt2YXIgYSxiPWFyZ3VtZW50cyxjPTAsZD1iLmxlbmd0aCxlPSExO2RvIGE9YltjXStcIlwiLGkodGhpcyxhKT09PS0xJiYodGhpcy5wdXNoKGEpLGU9ITApO3doaWxlKCsrYzxkKTtlJiZ0aGlzLl91cGRhdGVDbGFzc05hbWUoKX0say5yZW1vdmU9ZnVuY3Rpb24oKXt2YXIgYSxiLGM9YXJndW1lbnRzLGQ9MCxlPWMubGVuZ3RoLGY9ITE7ZG8gZm9yKGE9Y1tkXStcIlwiLGI9aSh0aGlzLGEpO2IhPT0tMTspdGhpcy5zcGxpY2UoYiwxKSxmPSEwLGI9aSh0aGlzLGEpO3doaWxlKCsrZDxlKTtmJiZ0aGlzLl91cGRhdGVDbGFzc05hbWUoKX0say50b2dnbGU9ZnVuY3Rpb24oYSxiKXthKz1cIlwiO3ZhciBjPXRoaXMuY29udGFpbnMoYSksZD1jP2IhPT0hMCYmXCJyZW1vdmVcIjpiIT09ITEmJlwiYWRkXCI7cmV0dXJuIGQmJnRoaXNbZF0oYSksYj09PSEwfHxiPT09ITE/YjohY30say50b1N0cmluZz1mdW5jdGlvbigpe3JldHVybiB0aGlzLmpvaW4oXCIgXCIpfSxlLmRlZmluZVByb3BlcnR5KXt2YXIgbT17Z2V0OmwsZW51bWVyYWJsZTohMCxjb25maWd1cmFibGU6ITB9O3RyeXtlLmRlZmluZVByb3BlcnR5KGQsYixtKX1jYXRjaChuKXtuLm51bWJlcj09PS0yMTQ2ODIzMjUyJiYobS5lbnVtZXJhYmxlPSExLGUuZGVmaW5lUHJvcGVydHkoZCxiLG0pKX19ZWxzZSBlW2NdLl9fZGVmaW5lR2V0dGVyX18mJmQuX19kZWZpbmVHZXR0ZXJfXyhiLGwpfX0od2luZG93LnNlbGYpKX0se31dLDI6W2Z1bmN0aW9uKGEsYixjKXtmdW5jdGlvbiBkKGEsYil7aWYoXCJzdHJpbmdcIiE9dHlwZW9mIGEpdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN0cmluZyBleHBlY3RlZFwiKTtifHwoYj1kb2N1bWVudCk7dmFyIGM9LzwoW1xcdzpdKykvLmV4ZWMoYSk7aWYoIWMpcmV0dXJuIGIuY3JlYXRlVGV4dE5vZGUoYSk7YT1hLnJlcGxhY2UoL15cXHMrfFxccyskL2csXCJcIik7dmFyIGQ9Y1sxXTtpZihcImJvZHlcIj09ZCl7dmFyIGU9Yi5jcmVhdGVFbGVtZW50KFwiaHRtbFwiKTtyZXR1cm4gZS5pbm5lckhUTUw9YSxlLnJlbW92ZUNoaWxkKGUubGFzdENoaWxkKX12YXIgZj1nW2RdfHxnLl9kZWZhdWx0LGg9ZlswXSxpPWZbMV0saj1mWzJdLGU9Yi5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO2ZvcihlLmlubmVySFRNTD1pK2ErajtoLS07KWU9ZS5sYXN0Q2hpbGQ7aWYoZS5maXJzdENoaWxkPT1lLmxhc3RDaGlsZClyZXR1cm4gZS5yZW1vdmVDaGlsZChlLmZpcnN0Q2hpbGQpO2Zvcih2YXIgaz1iLmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtlLmZpcnN0Q2hpbGQ7KWsuYXBwZW5kQ2hpbGQoZS5yZW1vdmVDaGlsZChlLmZpcnN0Q2hpbGQpKTtyZXR1cm4ga31iLmV4cG9ydHM9ZDt2YXIgZSxmPSExO1widW5kZWZpbmVkXCIhPXR5cGVvZiBkb2N1bWVudCYmKGU9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKSxlLmlubmVySFRNTD0nICA8bGluay8+PHRhYmxlPjwvdGFibGU+PGEgaHJlZj1cIi9hXCI+YTwvYT48aW5wdXQgdHlwZT1cImNoZWNrYm94XCIvPicsZj0hZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImxpbmtcIikubGVuZ3RoLGU9dm9pZCAwKTt2YXIgZz17bGVnZW5kOlsxLFwiPGZpZWxkc2V0PlwiLFwiPC9maWVsZHNldD5cIl0sdHI6WzIsXCI8dGFibGU+PHRib2R5PlwiLFwiPC90Ym9keT48L3RhYmxlPlwiXSxjb2w6WzIsXCI8dGFibGU+PHRib2R5PjwvdGJvZHk+PGNvbGdyb3VwPlwiLFwiPC9jb2xncm91cD48L3RhYmxlPlwiXSxfZGVmYXVsdDpmP1sxLFwiWDxkaXY+XCIsXCI8L2Rpdj5cIl06WzAsXCJcIixcIlwiXX07Zy50ZD1nLnRoPVszLFwiPHRhYmxlPjx0Ym9keT48dHI+XCIsXCI8L3RyPjwvdGJvZHk+PC90YWJsZT5cIl0sZy5vcHRpb249Zy5vcHRncm91cD1bMSwnPHNlbGVjdCBtdWx0aXBsZT1cIm11bHRpcGxlXCI+JyxcIjwvc2VsZWN0PlwiXSxnLnRoZWFkPWcudGJvZHk9Zy5jb2xncm91cD1nLmNhcHRpb249Zy50Zm9vdD1bMSxcIjx0YWJsZT5cIixcIjwvdGFibGU+XCJdLGcucG9seWxpbmU9Zy5lbGxpcHNlPWcucG9seWdvbj1nLmNpcmNsZT1nLnRleHQ9Zy5saW5lPWcucGF0aD1nLnJlY3Q9Zy5nPVsxLCc8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2ZXJzaW9uPVwiMS4xXCI+JyxcIjwvc3ZnPlwiXX0se31dLDM6W2Z1bmN0aW9uKGEsYixjKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBkKGEsYil7aWYodm9pZCAwPT09YXx8bnVsbD09PWEpdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjb252ZXJ0IGZpcnN0IGFyZ3VtZW50IHRvIG9iamVjdFwiKTtmb3IodmFyIGM9T2JqZWN0KGEpLGQ9MTtkPGFyZ3VtZW50cy5sZW5ndGg7ZCsrKXt2YXIgZT1hcmd1bWVudHNbZF07aWYodm9pZCAwIT09ZSYmbnVsbCE9PWUpZm9yKHZhciBmPU9iamVjdC5rZXlzKE9iamVjdChlKSksZz0wLGg9Zi5sZW5ndGg7ZzxoO2crKyl7dmFyIGk9ZltnXSxqPU9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoZSxpKTt2b2lkIDAhPT1qJiZqLmVudW1lcmFibGUmJihjW2ldPWVbaV0pfX1yZXR1cm4gY31mdW5jdGlvbiBlKCl7T2JqZWN0LmFzc2lnbnx8T2JqZWN0LmRlZmluZVByb3BlcnR5KE9iamVjdCxcImFzc2lnblwiLHtlbnVtZXJhYmxlOiExLGNvbmZpZ3VyYWJsZTohMCx3cml0YWJsZTohMCx2YWx1ZTpkfSl9Yi5leHBvcnRzPXthc3NpZ246ZCxwb2x5ZmlsbDplfX0se31dLDQ6W2Z1bmN0aW9uKGEsYixjKXtmdW5jdGlvbiBkKGEsYil7XCJvYmplY3RcIiE9dHlwZW9mIGI/Yj17aGFzaDohIWJ9OnZvaWQgMD09PWIuaGFzaCYmKGIuaGFzaD0hMCk7Zm9yKHZhciBjPWIuaGFzaD97fTpcIlwiLGQ9Yi5zZXJpYWxpemVyfHwoYi5oYXNoP2c6aCksZT1hJiZhLmVsZW1lbnRzP2EuZWxlbWVudHM6W10sZj1PYmplY3QuY3JlYXRlKG51bGwpLGs9MDtrPGUubGVuZ3RoOysrayl7dmFyIGw9ZVtrXTtpZigoYi5kaXNhYmxlZHx8IWwuZGlzYWJsZWQpJiZsLm5hbWUmJmoudGVzdChsLm5vZGVOYW1lKSYmIWkudGVzdChsLnR5cGUpKXt2YXIgbT1sLm5hbWUsbj1sLnZhbHVlO2lmKFwiY2hlY2tib3hcIiE9PWwudHlwZSYmXCJyYWRpb1wiIT09bC50eXBlfHxsLmNoZWNrZWR8fChuPXZvaWQgMCksYi5lbXB0eSl7aWYoXCJjaGVja2JveFwiIT09bC50eXBlfHxsLmNoZWNrZWR8fChuPVwiXCIpLFwicmFkaW9cIj09PWwudHlwZSYmKGZbbC5uYW1lXXx8bC5jaGVja2VkP2wuY2hlY2tlZCYmKGZbbC5uYW1lXT0hMCk6ZltsLm5hbWVdPSExKSwhbiYmXCJyYWRpb1wiPT1sLnR5cGUpY29udGludWV9ZWxzZSBpZighbiljb250aW51ZTtpZihcInNlbGVjdC1tdWx0aXBsZVwiIT09bC50eXBlKWM9ZChjLG0sbik7ZWxzZXtuPVtdO2Zvcih2YXIgbz1sLm9wdGlvbnMscD0hMSxxPTA7cTxvLmxlbmd0aDsrK3Epe3ZhciByPW9bcV0scz1iLmVtcHR5JiYhci52YWx1ZSx0PXIudmFsdWV8fHM7ci5zZWxlY3RlZCYmdCYmKHA9ITAsYz1iLmhhc2gmJlwiW11cIiE9PW0uc2xpY2UobS5sZW5ndGgtMik/ZChjLG0rXCJbXVwiLHIudmFsdWUpOmQoYyxtLHIudmFsdWUpKX0hcCYmYi5lbXB0eSYmKGM9ZChjLG0sXCJcIikpfX19aWYoYi5lbXB0eSlmb3IodmFyIG0gaW4gZilmW21dfHwoYz1kKGMsbSxcIlwiKSk7cmV0dXJuIGN9ZnVuY3Rpb24gZShhKXt2YXIgYj1bXSxjPS9eKFteXFxbXFxdXSopLyxkPW5ldyBSZWdFeHAoayksZT1jLmV4ZWMoYSk7Zm9yKGVbMV0mJmIucHVzaChlWzFdKTtudWxsIT09KGU9ZC5leGVjKGEpKTspYi5wdXNoKGVbMV0pO3JldHVybiBifWZ1bmN0aW9uIGYoYSxiLGMpe2lmKDA9PT1iLmxlbmd0aClyZXR1cm4gYT1jO3ZhciBkPWIuc2hpZnQoKSxlPWQubWF0Y2goL15cXFsoLis/KVxcXSQvKTtpZihcIltdXCI9PT1kKXJldHVybiBhPWF8fFtdLEFycmF5LmlzQXJyYXkoYSk/YS5wdXNoKGYobnVsbCxiLGMpKTooYS5fdmFsdWVzPWEuX3ZhbHVlc3x8W10sYS5fdmFsdWVzLnB1c2goZihudWxsLGIsYykpKSxhO2lmKGUpe3ZhciBnPWVbMV0saD0rZztpc05hTihoKT8oYT1hfHx7fSxhW2ddPWYoYVtnXSxiLGMpKTooYT1hfHxbXSxhW2hdPWYoYVtoXSxiLGMpKX1lbHNlIGFbZF09ZihhW2RdLGIsYyk7cmV0dXJuIGF9ZnVuY3Rpb24gZyhhLGIsYyl7dmFyIGQ9Yi5tYXRjaChrKTtpZihkKXt2YXIgZz1lKGIpO2YoYSxnLGMpfWVsc2V7dmFyIGg9YVtiXTtoPyhBcnJheS5pc0FycmF5KGgpfHwoYVtiXT1baF0pLGFbYl0ucHVzaChjKSk6YVtiXT1jfXJldHVybiBhfWZ1bmN0aW9uIGgoYSxiLGMpe3JldHVybiBjPWMucmVwbGFjZSgvKFxccik/XFxuL2csXCJcXHJcXG5cIiksYz1lbmNvZGVVUklDb21wb25lbnQoYyksYz1jLnJlcGxhY2UoLyUyMC9nLFwiK1wiKSxhKyhhP1wiJlwiOlwiXCIpK2VuY29kZVVSSUNvbXBvbmVudChiKStcIj1cIitjfXZhciBpPS9eKD86c3VibWl0fGJ1dHRvbnxpbWFnZXxyZXNldHxmaWxlKSQvaSxqPS9eKD86aW5wdXR8c2VsZWN0fHRleHRhcmVhfGtleWdlbikvaSxrPS8oXFxbW15cXFtcXF1dKlxcXSkvZztiLmV4cG9ydHM9ZH0se31dLDU6W2Z1bmN0aW9uKGIsYyxkKXsoZnVuY3Rpb24oZSl7IWZ1bmN0aW9uKGIpe2lmKFwib2JqZWN0XCI9PXR5cGVvZiBkJiZcInVuZGVmaW5lZFwiIT10eXBlb2YgYyljLmV4cG9ydHM9YigpO2Vsc2UgaWYoXCJmdW5jdGlvblwiPT10eXBlb2YgYSYmYS5hbWQpYShbXSxiKTtlbHNle3ZhciBmO2Y9XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIGU/ZTpcInVuZGVmaW5lZFwiIT10eXBlb2Ygc2VsZj9zZWxmOnRoaXMsZi52ZXhEaWFsb2c9YigpfX0oZnVuY3Rpb24oKXtyZXR1cm4gZnVuY3Rpb24gYShjLGQsZSl7ZnVuY3Rpb24gZihoLGkpe2lmKCFkW2hdKXtpZighY1toXSl7dmFyIGo9XCJmdW5jdGlvblwiPT10eXBlb2YgYiYmYjtpZighaSYmailyZXR1cm4gaihoLCEwKTtpZihnKXJldHVybiBnKGgsITApO3ZhciBrPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraCtcIidcIik7dGhyb3cgay5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGt9dmFyIGw9ZFtoXT17ZXhwb3J0czp7fX07Y1toXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihhKXt2YXIgYj1jW2hdWzFdW2FdO3JldHVybiBmKGI/YjphKX0sbCxsLmV4cG9ydHMsYSxjLGQsZSl9cmV0dXJuIGRbaF0uZXhwb3J0c31mb3IodmFyIGc9XCJmdW5jdGlvblwiPT10eXBlb2YgYiYmYixoPTA7aDxlLmxlbmd0aDtoKyspZihlW2hdKTtyZXR1cm4gZn0oezE6W2Z1bmN0aW9uKGEsYixjKXtmdW5jdGlvbiBkKGEsYil7aWYoXCJzdHJpbmdcIiE9dHlwZW9mIGEpdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN0cmluZyBleHBlY3RlZFwiKTtifHwoYj1kb2N1bWVudCk7dmFyIGM9LzwoW1xcdzpdKykvLmV4ZWMoYSk7aWYoIWMpcmV0dXJuIGIuY3JlYXRlVGV4dE5vZGUoYSk7YT1hLnJlcGxhY2UoL15cXHMrfFxccyskL2csXCJcIik7dmFyIGQ9Y1sxXTtpZihcImJvZHlcIj09ZCl7dmFyIGU9Yi5jcmVhdGVFbGVtZW50KFwiaHRtbFwiKTtyZXR1cm4gZS5pbm5lckhUTUw9YSxlLnJlbW92ZUNoaWxkKGUubGFzdENoaWxkKX12YXIgZj1nW2RdfHxnLl9kZWZhdWx0LGg9ZlswXSxpPWZbMV0saj1mWzJdLGU9Yi5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO2ZvcihlLmlubmVySFRNTD1pK2ErajtoLS07KWU9ZS5sYXN0Q2hpbGQ7aWYoZS5maXJzdENoaWxkPT1lLmxhc3RDaGlsZClyZXR1cm4gZS5yZW1vdmVDaGlsZChlLmZpcnN0Q2hpbGQpO2Zvcih2YXIgaz1iLmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtlLmZpcnN0Q2hpbGQ7KWsuYXBwZW5kQ2hpbGQoZS5yZW1vdmVDaGlsZChlLmZpcnN0Q2hpbGQpKTtyZXR1cm4ga31iLmV4cG9ydHM9ZDt2YXIgZSxmPSExO1widW5kZWZpbmVkXCIhPXR5cGVvZiBkb2N1bWVudCYmKGU9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKSxlLmlubmVySFRNTD0nICA8bGluay8+PHRhYmxlPjwvdGFibGU+PGEgaHJlZj1cIi9hXCI+YTwvYT48aW5wdXQgdHlwZT1cImNoZWNrYm94XCIvPicsZj0hZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImxpbmtcIikubGVuZ3RoLGU9dm9pZCAwKTt2YXIgZz17bGVnZW5kOlsxLFwiPGZpZWxkc2V0PlwiLFwiPC9maWVsZHNldD5cIl0sdHI6WzIsXCI8dGFibGU+PHRib2R5PlwiLFwiPC90Ym9keT48L3RhYmxlPlwiXSxjb2w6WzIsXCI8dGFibGU+PHRib2R5PjwvdGJvZHk+PGNvbGdyb3VwPlwiLFwiPC9jb2xncm91cD48L3RhYmxlPlwiXSxfZGVmYXVsdDpmP1sxLFwiWDxkaXY+XCIsXCI8L2Rpdj5cIl06WzAsXCJcIixcIlwiXX07Zy50ZD1nLnRoPVszLFwiPHRhYmxlPjx0Ym9keT48dHI+XCIsXCI8L3RyPjwvdGJvZHk+PC90YWJsZT5cIl0sZy5vcHRpb249Zy5vcHRncm91cD1bMSwnPHNlbGVjdCBtdWx0aXBsZT1cIm11bHRpcGxlXCI+JyxcIjwvc2VsZWN0PlwiXSxnLnRoZWFkPWcudGJvZHk9Zy5jb2xncm91cD1nLmNhcHRpb249Zy50Zm9vdD1bMSxcIjx0YWJsZT5cIixcIjwvdGFibGU+XCJdLGcucG9seWxpbmU9Zy5lbGxpcHNlPWcucG9seWdvbj1nLmNpcmNsZT1nLnRleHQ9Zy5saW5lPWcucGF0aD1nLnJlY3Q9Zy5nPVsxLCc8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2ZXJzaW9uPVwiMS4xXCI+JyxcIjwvc3ZnPlwiXX0se31dLDI6W2Z1bmN0aW9uKGEsYixjKXtmdW5jdGlvbiBkKGEsYil7XCJvYmplY3RcIiE9dHlwZW9mIGI/Yj17aGFzaDohIWJ9OnZvaWQgMD09PWIuaGFzaCYmKGIuaGFzaD0hMCk7Zm9yKHZhciBjPWIuaGFzaD97fTpcIlwiLGQ9Yi5zZXJpYWxpemVyfHwoYi5oYXNoP2c6aCksZT1hJiZhLmVsZW1lbnRzP2EuZWxlbWVudHM6W10sZj1PYmplY3QuY3JlYXRlKG51bGwpLGs9MDtrPGUubGVuZ3RoOysrayl7dmFyIGw9ZVtrXTtpZigoYi5kaXNhYmxlZHx8IWwuZGlzYWJsZWQpJiZsLm5hbWUmJmoudGVzdChsLm5vZGVOYW1lKSYmIWkudGVzdChsLnR5cGUpKXt2YXIgbT1sLm5hbWUsbj1sLnZhbHVlO2lmKFwiY2hlY2tib3hcIiE9PWwudHlwZSYmXCJyYWRpb1wiIT09bC50eXBlfHxsLmNoZWNrZWR8fChuPXZvaWQgMCksYi5lbXB0eSl7aWYoXCJjaGVja2JveFwiIT09bC50eXBlfHxsLmNoZWNrZWR8fChuPVwiXCIpLFwicmFkaW9cIj09PWwudHlwZSYmKGZbbC5uYW1lXXx8bC5jaGVja2VkP2wuY2hlY2tlZCYmKGZbbC5uYW1lXT0hMCk6ZltsLm5hbWVdPSExKSwhbiYmXCJyYWRpb1wiPT1sLnR5cGUpY29udGludWV9ZWxzZSBpZighbiljb250aW51ZTtpZihcInNlbGVjdC1tdWx0aXBsZVwiIT09bC50eXBlKWM9ZChjLG0sbik7ZWxzZXtuPVtdO2Zvcih2YXIgbz1sLm9wdGlvbnMscD0hMSxxPTA7cTxvLmxlbmd0aDsrK3Epe3ZhciByPW9bcV0scz1iLmVtcHR5JiYhci52YWx1ZSx0PXIudmFsdWV8fHM7ci5zZWxlY3RlZCYmdCYmKHA9ITAsYz1iLmhhc2gmJlwiW11cIiE9PW0uc2xpY2UobS5sZW5ndGgtMik/ZChjLG0rXCJbXVwiLHIudmFsdWUpOmQoYyxtLHIudmFsdWUpKX0hcCYmYi5lbXB0eSYmKGM9ZChjLG0sXCJcIikpfX19aWYoYi5lbXB0eSlmb3IodmFyIG0gaW4gZilmW21dfHwoYz1kKGMsbSxcIlwiKSk7cmV0dXJuIGN9ZnVuY3Rpb24gZShhKXt2YXIgYj1bXSxjPS9eKFteXFxbXFxdXSopLyxkPW5ldyBSZWdFeHAoayksZT1jLmV4ZWMoYSk7Zm9yKGVbMV0mJmIucHVzaChlWzFdKTtudWxsIT09KGU9ZC5leGVjKGEpKTspYi5wdXNoKGVbMV0pO3JldHVybiBifWZ1bmN0aW9uIGYoYSxiLGMpe2lmKDA9PT1iLmxlbmd0aClyZXR1cm4gYT1jO3ZhciBkPWIuc2hpZnQoKSxlPWQubWF0Y2goL15cXFsoLis/KVxcXSQvKTtpZihcIltdXCI9PT1kKXJldHVybiBhPWF8fFtdLEFycmF5LmlzQXJyYXkoYSk/YS5wdXNoKGYobnVsbCxiLGMpKTooYS5fdmFsdWVzPWEuX3ZhbHVlc3x8W10sYS5fdmFsdWVzLnB1c2goZihudWxsLGIsYykpKSxhO2lmKGUpe3ZhciBnPWVbMV0saD0rZztpc05hTihoKT8oYT1hfHx7fSxhW2ddPWYoYVtnXSxiLGMpKTooYT1hfHxbXSxhW2hdPWYoYVtoXSxiLGMpKX1lbHNlIGFbZF09ZihhW2RdLGIsYyk7cmV0dXJuIGF9ZnVuY3Rpb24gZyhhLGIsYyl7dmFyIGQ9Yi5tYXRjaChrKTtpZihkKXt2YXIgZz1lKGIpO2YoYSxnLGMpfWVsc2V7dmFyIGg9YVtiXTtoPyhBcnJheS5pc0FycmF5KGgpfHwoYVtiXT1baF0pLGFbYl0ucHVzaChjKSk6YVtiXT1jfXJldHVybiBhfWZ1bmN0aW9uIGgoYSxiLGMpe3JldHVybiBjPWMucmVwbGFjZSgvKFxccik/XFxuL2csXCJcXHJcXG5cIiksYz1lbmNvZGVVUklDb21wb25lbnQoYyksYz1jLnJlcGxhY2UoLyUyMC9nLFwiK1wiKSxhKyhhP1wiJlwiOlwiXCIpK2VuY29kZVVSSUNvbXBvbmVudChiKStcIj1cIitjfXZhciBpPS9eKD86c3VibWl0fGJ1dHRvbnxpbWFnZXxyZXNldHxmaWxlKSQvaSxqPS9eKD86aW5wdXR8c2VsZWN0fHRleHRhcmVhfGtleWdlbikvaSxrPS8oXFxbW15cXFtcXF1dKlxcXSkvZztiLmV4cG9ydHM9ZH0se31dLDM6W2Z1bmN0aW9uKGEsYixjKXt2YXIgZD1hKFwiZG9taWZ5XCIpLGU9YShcImZvcm0tc2VyaWFsaXplXCIpLGY9ZnVuY3Rpb24oYSl7dmFyIGI9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImZvcm1cIik7Yi5jbGFzc0xpc3QuYWRkKFwidmV4LWRpYWxvZy1mb3JtXCIpO3ZhciBjPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7Yy5jbGFzc0xpc3QuYWRkKFwidmV4LWRpYWxvZy1tZXNzYWdlXCIpLGMuYXBwZW5kQ2hpbGQoYS5tZXNzYWdlIGluc3RhbmNlb2Ygd2luZG93Lk5vZGU/YS5tZXNzYWdlOmQoYS5tZXNzYWdlKSk7dmFyIGU9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtyZXR1cm4gZS5jbGFzc0xpc3QuYWRkKFwidmV4LWRpYWxvZy1pbnB1dFwiKSxlLmFwcGVuZENoaWxkKGEuaW5wdXQgaW5zdGFuY2VvZiB3aW5kb3cuTm9kZT9hLmlucHV0OmQoYS5pbnB1dCkpLGIuYXBwZW5kQ2hpbGQoYyksYi5hcHBlbmRDaGlsZChlKSxifSxnPWZ1bmN0aW9uKGEpe3ZhciBiPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7Yi5jbGFzc0xpc3QuYWRkKFwidmV4LWRpYWxvZy1idXR0b25zXCIpO2Zvcih2YXIgYz0wO2M8YS5sZW5ndGg7YysrKXt2YXIgZD1hW2NdLGU9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtlLnR5cGU9ZC50eXBlLGUudGV4dENvbnRlbnQ9ZC50ZXh0LGUuY2xhc3NOYW1lPWQuY2xhc3NOYW1lLGUuY2xhc3NMaXN0LmFkZChcInZleC1kaWFsb2ctYnV0dG9uXCIpLDA9PT1jP2UuY2xhc3NMaXN0LmFkZChcInZleC1maXJzdFwiKTpjPT09YS5sZW5ndGgtMSYmZS5jbGFzc0xpc3QuYWRkKFwidmV4LWxhc3RcIiksZnVuY3Rpb24oYSl7ZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIixmdW5jdGlvbihiKXthLmNsaWNrJiZhLmNsaWNrLmNhbGwodGhpcyxiKX0uYmluZCh0aGlzKSl9LmJpbmQodGhpcykoZCksYi5hcHBlbmRDaGlsZChlKX1yZXR1cm4gYn0saD1mdW5jdGlvbihhKXt2YXIgYj17bmFtZTpcImRpYWxvZ1wiLG9wZW46ZnVuY3Rpb24oYil7dmFyIGM9T2JqZWN0LmFzc2lnbih7fSx0aGlzLmRlZmF1bHRPcHRpb25zLGIpO2MudW5zYWZlTWVzc2FnZSYmIWMubWVzc2FnZT9jLm1lc3NhZ2U9Yy51bnNhZmVNZXNzYWdlOmMubWVzc2FnZSYmKGMubWVzc2FnZT1hLl9lc2NhcGVIdG1sKGMubWVzc2FnZSkpO3ZhciBkPWMudW5zYWZlQ29udGVudD1mKGMpLGU9YS5vcGVuKGMpLGg9Yy5iZWZvcmVDbG9zZSYmYy5iZWZvcmVDbG9zZS5iaW5kKGUpO2lmKGUub3B0aW9ucy5iZWZvcmVDbG9zZT1mdW5jdGlvbigpe3ZhciBhPSFofHxoKCk7cmV0dXJuIGEmJmMuY2FsbGJhY2sodGhpcy52YWx1ZXx8ITEpLGF9LmJpbmQoZSksZC5hcHBlbmRDaGlsZChnLmNhbGwoZSxjLmJ1dHRvbnMpKSxlLmZvcm09ZCxkLmFkZEV2ZW50TGlzdGVuZXIoXCJzdWJtaXRcIixjLm9uU3VibWl0LmJpbmQoZSkpLGMuZm9jdXNGaXJzdElucHV0KXt2YXIgaT1lLmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKFwiYnV0dG9uLCBpbnB1dCwgc2VsZWN0LCB0ZXh0YXJlYVwiKTtpJiZpLmZvY3VzKCl9cmV0dXJuIGV9LGFsZXJ0OmZ1bmN0aW9uKGEpe3JldHVyblwic3RyaW5nXCI9PXR5cGVvZiBhJiYoYT17bWVzc2FnZTphfSksYT1PYmplY3QuYXNzaWduKHt9LHRoaXMuZGVmYXVsdE9wdGlvbnMsdGhpcy5kZWZhdWx0QWxlcnRPcHRpb25zLGEpLHRoaXMub3BlbihhKX0sY29uZmlybTpmdW5jdGlvbihhKXtpZihcIm9iamVjdFwiIT10eXBlb2YgYXx8XCJmdW5jdGlvblwiIT10eXBlb2YgYS5jYWxsYmFjayl0aHJvdyBuZXcgRXJyb3IoXCJkaWFsb2cuY29uZmlybShvcHRpb25zKSByZXF1aXJlcyBvcHRpb25zLmNhbGxiYWNrLlwiKTtyZXR1cm4gYT1PYmplY3QuYXNzaWduKHt9LHRoaXMuZGVmYXVsdE9wdGlvbnMsdGhpcy5kZWZhdWx0Q29uZmlybU9wdGlvbnMsYSksdGhpcy5vcGVuKGEpfSxwcm9tcHQ6ZnVuY3Rpb24oYil7aWYoXCJvYmplY3RcIiE9dHlwZW9mIGJ8fFwiZnVuY3Rpb25cIiE9dHlwZW9mIGIuY2FsbGJhY2spdGhyb3cgbmV3IEVycm9yKFwiZGlhbG9nLnByb21wdChvcHRpb25zKSByZXF1aXJlcyBvcHRpb25zLmNhbGxiYWNrLlwiKTt2YXIgYz1PYmplY3QuYXNzaWduKHt9LHRoaXMuZGVmYXVsdE9wdGlvbnMsdGhpcy5kZWZhdWx0UHJvbXB0T3B0aW9ucyksZD17dW5zYWZlTWVzc2FnZTonPGxhYmVsIGZvcj1cInZleFwiPicrYS5fZXNjYXBlSHRtbChiLmxhYmVsfHxjLmxhYmVsKStcIjwvbGFiZWw+XCIsaW5wdXQ6JzxpbnB1dCBuYW1lPVwidmV4XCIgdHlwZT1cInRleHRcIiBjbGFzcz1cInZleC1kaWFsb2ctcHJvbXB0LWlucHV0XCIgcGxhY2Vob2xkZXI9XCInK2EuX2VzY2FwZUh0bWwoYi5wbGFjZWhvbGRlcnx8Yy5wbGFjZWhvbGRlcikrJ1wiIHZhbHVlPVwiJythLl9lc2NhcGVIdG1sKGIudmFsdWV8fGMudmFsdWUpKydcIiAvPid9O2I9T2JqZWN0LmFzc2lnbihjLGQsYik7dmFyIGU9Yi5jYWxsYmFjaztyZXR1cm4gYi5jYWxsYmFjaz1mdW5jdGlvbihhKXtpZihcIm9iamVjdFwiPT10eXBlb2YgYSl7dmFyIGI9T2JqZWN0LmtleXMoYSk7YT1iLmxlbmd0aD9hW2JbMF1dOlwiXCJ9ZShhKX0sdGhpcy5vcGVuKGIpfX07cmV0dXJuIGIuYnV0dG9ucz17WUVTOnt0ZXh0OlwiT0tcIix0eXBlOlwic3VibWl0XCIsY2xhc3NOYW1lOlwidmV4LWRpYWxvZy1idXR0b24tcHJpbWFyeVwiLGNsaWNrOmZ1bmN0aW9uKCl7dGhpcy52YWx1ZT0hMH19LE5POnt0ZXh0OlwiQ2FuY2VsXCIsdHlwZTpcImJ1dHRvblwiLGNsYXNzTmFtZTpcInZleC1kaWFsb2ctYnV0dG9uLXNlY29uZGFyeVwiLGNsaWNrOmZ1bmN0aW9uKCl7dGhpcy52YWx1ZT0hMSx0aGlzLmNsb3NlKCl9fX0sYi5kZWZhdWx0T3B0aW9ucz17Y2FsbGJhY2s6ZnVuY3Rpb24oKXt9LGFmdGVyT3BlbjpmdW5jdGlvbigpe30sbWVzc2FnZTpcIlwiLGlucHV0OlwiXCIsYnV0dG9uczpbYi5idXR0b25zLllFUyxiLmJ1dHRvbnMuTk9dLHNob3dDbG9zZUJ1dHRvbjohMSxvblN1Ym1pdDpmdW5jdGlvbihhKXtyZXR1cm4gYS5wcmV2ZW50RGVmYXVsdCgpLHRoaXMub3B0aW9ucy5pbnB1dCYmKHRoaXMudmFsdWU9ZSh0aGlzLmZvcm0se2hhc2g6ITB9KSksdGhpcy5jbG9zZSgpfSxmb2N1c0ZpcnN0SW5wdXQ6ITB9LGIuZGVmYXVsdEFsZXJ0T3B0aW9ucz17YnV0dG9uczpbYi5idXR0b25zLllFU119LGIuZGVmYXVsdFByb21wdE9wdGlvbnM9e2xhYmVsOlwiUHJvbXB0OlwiLHBsYWNlaG9sZGVyOlwiXCIsdmFsdWU6XCJcIn0sYi5kZWZhdWx0Q29uZmlybU9wdGlvbnM9e30sYn07Yi5leHBvcnRzPWh9LHtkb21pZnk6MSxcImZvcm0tc2VyaWFsaXplXCI6Mn1dfSx7fSxbM10pKDMpfSl9KS5jYWxsKHRoaXMsXCJ1bmRlZmluZWRcIiE9dHlwZW9mIGdsb2JhbD9nbG9iYWw6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHNlbGY/c2VsZjpcInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93P3dpbmRvdzp7fSl9LHtkb21pZnk6MixcImZvcm0tc2VyaWFsaXplXCI6NH1dLDY6W2Z1bmN0aW9uKGEsYixjKXt2YXIgZD1hKFwiLi92ZXhcIik7ZC5yZWdpc3RlclBsdWdpbihhKFwidmV4LWRpYWxvZ1wiKSksYi5leHBvcnRzPWR9LHtcIi4vdmV4XCI6NyxcInZleC1kaWFsb2dcIjo1fV0sNzpbZnVuY3Rpb24oYSxiLGMpe2EoXCJjbGFzc2xpc3QtcG9seWZpbGxcIiksYShcImVzNi1vYmplY3QtYXNzaWduXCIpLnBvbHlmaWxsKCk7dmFyIGQ9YShcImRvbWlmeVwiKSxlPWZ1bmN0aW9uKGEpe2lmKFwidW5kZWZpbmVkXCIhPXR5cGVvZiBhKXt2YXIgYj1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO3JldHVybiBiLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGEpKSxiLmlubmVySFRNTH1yZXR1cm5cIlwifSxmPWZ1bmN0aW9uKGEsYil7aWYoXCJzdHJpbmdcIj09dHlwZW9mIGImJjAhPT1iLmxlbmd0aClmb3IodmFyIGM9Yi5zcGxpdChcIiBcIiksZD0wO2Q8Yy5sZW5ndGg7ZCsrKXt2YXIgZT1jW2RdO2UubGVuZ3RoJiZhLmNsYXNzTGlzdC5hZGQoZSl9fSxnPWZ1bmN0aW9uKCl7dmFyIGE9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKSxiPXtXZWJraXRBbmltYXRpb246XCJ3ZWJraXRBbmltYXRpb25FbmRcIixNb3pBbmltYXRpb246XCJhbmltYXRpb25lbmRcIixPQW5pbWF0aW9uOlwib2FuaW1hdGlvbmVuZFwiLG1zQW5pbWF0aW9uOlwiTVNBbmltYXRpb25FbmRcIixhbmltYXRpb246XCJhbmltYXRpb25lbmRcIn07Zm9yKHZhciBjIGluIGIpaWYodm9pZCAwIT09YS5zdHlsZVtjXSlyZXR1cm4gYltjXTtyZXR1cm4hMX0oKSxoPXt2ZXg6XCJ2ZXhcIixjb250ZW50OlwidmV4LWNvbnRlbnRcIixvdmVybGF5OlwidmV4LW92ZXJsYXlcIixjbG9zZTpcInZleC1jbG9zZVwiLGNsb3Npbmc6XCJ2ZXgtY2xvc2luZ1wiLG9wZW46XCJ2ZXgtb3BlblwifSxpPXt9LGo9MSxrPSExLGw9e29wZW46ZnVuY3Rpb24oYSl7dmFyIGI9ZnVuY3Rpb24oYSl7Y29uc29sZS53YXJuKCdUaGUgXCInK2ErJ1wiIHByb3BlcnR5IGlzIGRlcHJlY2F0ZWQgaW4gdmV4IDMuIFVzZSBDU1MgY2xhc3NlcyBhbmQgdGhlIGFwcHJvcHJpYXRlIFwiQ2xhc3NOYW1lXCIgb3B0aW9ucywgaW5zdGVhZC4nKSxjb25zb2xlLndhcm4oXCJTZWUgaHR0cDovL2dpdGh1Yi5odWJzcG90LmNvbS92ZXgvYXBpL2FkdmFuY2VkLyNvcHRpb25zXCIpfTthLmNzcyYmYihcImNzc1wiKSxhLm92ZXJsYXlDU1MmJmIoXCJvdmVybGF5Q1NTXCIpLGEuY29udGVudENTUyYmYihcImNvbnRlbnRDU1NcIiksYS5jbG9zZUNTUyYmYihcImNsb3NlQ1NTXCIpO3ZhciBjPXt9O2MuaWQ9aisrLGlbYy5pZF09YyxjLmlzT3Blbj0hMCxjLmNsb3NlPWZ1bmN0aW9uKCl7ZnVuY3Rpb24gYShhKXtyZXR1cm5cIm5vbmVcIiE9PWQuZ2V0UHJvcGVydHlWYWx1ZShhK1wiYW5pbWF0aW9uLW5hbWVcIikmJlwiMHNcIiE9PWQuZ2V0UHJvcGVydHlWYWx1ZShhK1wiYW5pbWF0aW9uLWR1cmF0aW9uXCIpfWlmKCF0aGlzLmlzT3BlbilyZXR1cm4hMDt2YXIgYj10aGlzLm9wdGlvbnM7aWYoayYmIWIuZXNjYXBlQnV0dG9uQ2xvc2VzKXJldHVybiExO3ZhciBjPWZ1bmN0aW9uKCl7cmV0dXJuIWIuYmVmb3JlQ2xvc2V8fGIuYmVmb3JlQ2xvc2UuY2FsbCh0aGlzKX0uYmluZCh0aGlzKSgpO2lmKGM9PT0hMSlyZXR1cm4hMTt0aGlzLmlzT3Blbj0hMTt2YXIgZD13aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLmNvbnRlbnRFbCksZT1hKFwiXCIpfHxhKFwiLXdlYmtpdC1cIil8fGEoXCItbW96LVwiKXx8YShcIi1vLVwiKSxmPWZ1bmN0aW9uIGooKXt0aGlzLnJvb3RFbC5wYXJlbnROb2RlJiYodGhpcy5yb290RWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihnLGopLGRlbGV0ZSBpW3RoaXMuaWRdLHRoaXMucm9vdEVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5yb290RWwpLGIuYWZ0ZXJDbG9zZSYmYi5hZnRlckNsb3NlLmNhbGwodGhpcyksMD09PU9iamVjdC5rZXlzKGkpLmxlbmd0aCYmZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKGgub3BlbikpfS5iaW5kKHRoaXMpO3JldHVybiBnJiZlPyh0aGlzLnJvb3RFbC5hZGRFdmVudExpc3RlbmVyKGcsZiksdGhpcy5yb290RWwuY2xhc3NMaXN0LmFkZChoLmNsb3NpbmcpKTpmKCksITB9LFwic3RyaW5nXCI9PXR5cGVvZiBhJiYoYT17Y29udGVudDphfSksYS51bnNhZmVDb250ZW50JiYhYS5jb250ZW50P2EuY29udGVudD1hLnVuc2FmZUNvbnRlbnQ6YS5jb250ZW50JiYoYS5jb250ZW50PWUoYS5jb250ZW50KSk7dmFyIG09Yy5vcHRpb25zPU9iamVjdC5hc3NpZ24oe30sbC5kZWZhdWx0T3B0aW9ucyxhKSxuPWMucm9vdEVsPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7bi5jbGFzc0xpc3QuYWRkKGgudmV4KSxmKG4sbS5jbGFzc05hbWUpO3ZhciBvPWMub3ZlcmxheUVsPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7by5jbGFzc0xpc3QuYWRkKGgub3ZlcmxheSksZihvLG0ub3ZlcmxheUNsYXNzTmFtZSksbS5vdmVybGF5Q2xvc2VzT25DbGljayYmby5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIixmdW5jdGlvbihhKXthLnRhcmdldD09PW8mJmMuY2xvc2UoKX0pLG4uYXBwZW5kQ2hpbGQobyk7dmFyIHA9Yy5jb250ZW50RWw9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtpZihwLmNsYXNzTGlzdC5hZGQoaC5jb250ZW50KSxmKHAsbS5jb250ZW50Q2xhc3NOYW1lKSxwLmFwcGVuZENoaWxkKG0uY29udGVudCBpbnN0YW5jZW9mIHdpbmRvdy5Ob2RlP20uY29udGVudDpkKG0uY29udGVudCkpLG4uYXBwZW5kQ2hpbGQocCksbS5zaG93Q2xvc2VCdXR0b24pe3ZhciBxPWMuY2xvc2VFbD1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO3EuY2xhc3NMaXN0LmFkZChoLmNsb3NlKSxmKHEsbS5jbG9zZUNsYXNzTmFtZSkscS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIixjLmNsb3NlLmJpbmQoYykpLHAuYXBwZW5kQ2hpbGQocSl9cmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IobS5hcHBlbmRMb2NhdGlvbikuYXBwZW5kQ2hpbGQobiksbS5hZnRlck9wZW4mJm0uYWZ0ZXJPcGVuLmNhbGwoYyksZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKGgub3BlbiksY30sY2xvc2U6ZnVuY3Rpb24oYSl7dmFyIGI7aWYoYS5pZCliPWEuaWQ7ZWxzZXtpZihcInN0cmluZ1wiIT10eXBlb2YgYSl0aHJvdyBuZXcgVHlwZUVycm9yKFwiY2xvc2UgcmVxdWlyZXMgYSB2ZXggb2JqZWN0IG9yIGlkIHN0cmluZ1wiKTtiPWF9cmV0dXJuISFpW2JdJiZpW2JdLmNsb3NlKCl9LGNsb3NlVG9wOmZ1bmN0aW9uKCl7dmFyIGE9T2JqZWN0LmtleXMoaSk7cmV0dXJuISFhLmxlbmd0aCYmaVthW2EubGVuZ3RoLTFdXS5jbG9zZSgpfSxjbG9zZUFsbDpmdW5jdGlvbigpe2Zvcih2YXIgYSBpbiBpKXRoaXMuY2xvc2UoYSk7cmV0dXJuITB9LGdldEFsbDpmdW5jdGlvbigpe3JldHVybiBpfSxnZXRCeUlkOmZ1bmN0aW9uKGEpe3JldHVybiBpW2FdfX07d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLGZ1bmN0aW9uKGEpezI3PT09YS5rZXlDb2RlJiYoaz0hMCxsLmNsb3NlVG9wKCksaz0hMSl9KSx3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInBvcHN0YXRlXCIsZnVuY3Rpb24oKXtsLmRlZmF1bHRPcHRpb25zLmNsb3NlQWxsT25Qb3BTdGF0ZSYmbC5jbG9zZUFsbCgpfSksbC5kZWZhdWx0T3B0aW9ucz17Y29udGVudDpcIlwiLHNob3dDbG9zZUJ1dHRvbjohMCxlc2NhcGVCdXR0b25DbG9zZXM6ITAsb3ZlcmxheUNsb3Nlc09uQ2xpY2s6ITAsYXBwZW5kTG9jYXRpb246XCJib2R5XCIsY2xhc3NOYW1lOlwiXCIsb3ZlcmxheUNsYXNzTmFtZTpcIlwiLGNvbnRlbnRDbGFzc05hbWU6XCJcIixjbG9zZUNsYXNzTmFtZTpcIlwiLGNsb3NlQWxsT25Qb3BTdGF0ZTohMH0sT2JqZWN0LmRlZmluZVByb3BlcnR5KGwsXCJfZXNjYXBlSHRtbFwiLHtjb25maWd1cmFibGU6ITEsZW51bWVyYWJsZTohMSx3cml0YWJsZTohMSx2YWx1ZTplfSksbC5yZWdpc3RlclBsdWdpbj1mdW5jdGlvbihhLGIpe3ZhciBjPWEobCksZD1ifHxjLm5hbWU7aWYobFtkXSl0aHJvdyBuZXcgRXJyb3IoXCJQbHVnaW4gXCIrYitcIiBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQuXCIpO2xbZF09Y30sYi5leHBvcnRzPWx9LHtcImNsYXNzbGlzdC1wb2x5ZmlsbFwiOjEsZG9taWZ5OjIsXCJlczYtb2JqZWN0LWFzc2lnblwiOjN9XX0se30sWzZdKSg2KX0pO1xuIl19
