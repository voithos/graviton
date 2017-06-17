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
        this.options.collisions = args.collision || true;
        this.options.scatterLimit = args.scatterLimit || 10000;
    }

    _createClass(GtSim, [{
        key: 'step',
        value: function step(elapsed) {
            for (var i = 0; i < this.bodies.length; i++) {
                var body = this.bodies[i];
                if (this.options.collisions === true) {
                    // TODO: Is this useful?
                    this.detectCollision(body, i);
                }

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
        key: 'detectCollision',
        value: function detectCollision(body, index) {
            for (var i = 0; i < this.bodies.length; i++) {
                var collider = this.bodies[i];
                if (i !== index) {
                    this.calculateDistance(body, collider);
                    var clearance = body.radius + collider.radius;

                    if (this.D.r <= clearance) {
                        // Collision detected
                        _log2.default.write('Collision detected!!', 'debug');
                    }
                }
            }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZ3Jhdml0b24uanMiLCJzcmMvZ3Jhdml0b24vYXBwLmpzIiwic3JjL2dyYXZpdG9uL2JvZHkuanMiLCJzcmMvZ3Jhdml0b24vZXZlbnRzLmpzIiwic3JjL2dyYXZpdG9uL2dmeC5qcyIsInNyYy9ncmF2aXRvbi9zaW0uanMiLCJzcmMvZ3Jhdml0b24vdGltZXIuanMiLCJzcmMvZ3Jhdml0b24vdHJlZS5qcyIsInNyYy9tYWluLmpzIiwic3JjL3BvbHlmaWxscy5qcyIsInNyYy91dGlsL2NvbG9ycy5qcyIsInNyYy91dGlsL2Vudi5qcyIsInNyYy91dGlsL2xvZy5qcyIsInNyYy91dGlsL3JhbmRvbS5qcyIsInNyYy92ZW5kb3IvanNjb2xvci5qcyIsInNyYy92ZW5kb3IvdmV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7O2tCQ2FlLEVBQUUsR0FBRyxlQUFPLEVBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUNEUixLQUFLO0FBQ3RCLGFBRGlCLEtBQUssR0FDQzs4QkFETixLQUFLOztZQUNWLElBQUkseURBQUcsRUFBRTs7QUFDakIsWUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7O0FBRWpCLFlBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ2xCLFlBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDOztBQUVqQixZQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztBQUN0QixZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQzs7QUFFckIsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7QUFDbkIsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7QUFDaEIsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7O0FBRWhCLFlBQUksQ0FBQyxPQUFPLEdBQUcs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RUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7O0FBRVAsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTtBQUNQLE9BQUcsRUFBRSxFQUFFO0FBQ1AsT0FBRyxFQUFFLEVBQUU7QUFDUCxPQUFHLEVBQUUsRUFBRTs7QUFFUCxTQUFLLEVBQUUsRUFBRTtBQUNULFNBQUssRUFBRSxFQUFFO0FBQ1QsU0FBSyxFQUFFLEVBQUU7QUFDVCxTQUFLLEVBQUUsR0FBRztBQUNWLFNBQUssRUFBRSxHQUFHO0FBQ1YsU0FBSyxFQUFFLEdBQUc7QUFDVixTQUFLLEVBQUUsR0FBRztBQUNWLFNBQUssRUFBRSxHQUFHO0FBQ1YsU0FBSyxFQUFFLEdBQUc7O0FBRVYsa0JBQWMsRUFBRSxHQUFHOztBQUVuQixlQUFXLEVBQUUsQ0FBQztBQUNkLFNBQUssRUFBRSxDQUFDO0FBQ1IsV0FBTyxFQUFFLEVBQUU7QUFDWCxXQUFPLEVBQUUsRUFBRTtBQUNYLFVBQU0sRUFBRSxFQUFFO0FBQ1YsU0FBSyxFQUFFLEVBQUU7QUFDVCxTQUFLLEVBQUUsRUFBRTtBQUNU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RUFBRSxHQUFHLENBQ1IsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQ3hCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FDckYsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUNOLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FDcEMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdB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QUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUN4Qjs7Ozs7O0FBQUMsQUFPRixRQUFJLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFOztBQUN4QyxTQUFJLENBQUMsS0FBSyxJQUFJLEVBQUU7QUFDZixVQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUFFLGNBQU8sS0FBSyxDQUFDO09BQUU7QUFDL0IsT0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDbEM7QUFDRCxTQUFJLENBQUMsS0FBSyxJQUFJLEVBQUU7QUFDZixVQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUFFLGNBQU8sS0FBSyxDQUFDO09BQUU7QUFDL0IsT0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDbEM7QUFDRCxTQUFJLENBQUMsS0FBSyxJQUFJLEVBQUU7QUFDZixVQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUFFLGNBQU8sS0FBSyxDQUFDO09BQUU7QUFDL0IsT0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDbEM7O0FBRUQsU0FBSSxHQUFHLEdBQUcsT0FBTyxDQUNoQixDQUFDLEtBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUMxQixDQUFDLEtBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUMxQixDQUFDLEtBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUMxQixDQUFDO0FBQ0YsU0FBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFO0FBQ3BCLFVBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNqRDtBQUNELFNBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUNqQixVQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQzlGO0FBQ0QsU0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7OztBQUFDLEFBRzlGLFNBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pELFNBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFD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SUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzVDLFNBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2pELFNBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2pELFNBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2pELFNBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2pELFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzlDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzVDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUU1QyxTQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDbkQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDNUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDakQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDckQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDckQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDcEQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDNUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRTVDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzVDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDOztBQUUzQyxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM1QyxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM3QyxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztNQUM3Qzs7QUFFRCxTQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDOztBQUVuQixTQUFJLGFBQWEsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxD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QUFDLEVBQUM7QUFBQyxVQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDO0FBQUMsWUFBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQztBQUFDLGNBQUksQ0FBQyxHQUFDLFVBQVUsSUFBRSxPQUFPLE9BQU8sSUFBRSxPQUFPLENBQUMsSUFBRyxDQUFDLENBQUMsSUFBRSxDQUFDLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsSUFBSSxLQUFLLENBQUMsc0JBQXNCLEdBQUMsQ0FBQyxHQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU0sQ0FBQyxDQUFDLElBQUksR0FBQyxrQkFBa0IsRUFBQyxDQUFDLENBQUEsQ0FBQTtTQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFDLE9BQU8sRUFBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUMsVUFBUyxDQUFDLEVBQUM7QUFBQyxjQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQTtTQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUE7T0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUE7S0FBQyxLQUFJLElBQUksQ0FBQyxHQUFDLFVBQVUsSUFBRSxPQUFPLE9BQU8sSUFBRSxPQUFPLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxDQUFDLEVBQUU7QUFBQyxPQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FBQSxPQUFPLENBQUMsQ0FBQTtHQUFDLENBQUEsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLFVBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxnQkFBVSxJQUFHLE1BQU0sQ0FBQyxJQUFJLEtBQUcsV0FBVyxJQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEtBQUcsQ0FBQyxRQUFRLENBQUMsZUFBZSxJQUFFLFdBQVcsSUFBRyxRQUFRLENBQUMsZUFBZSxDQUFDLDRCQUE0QixFQUFDLEdBQUcsQ0FBQyxDQUFBLEFBQUMsR0FBQyxDQUFDLENBQUEsWUFBVTtBQUFDLG9CQUFZLENBQUM7QUFBQSxZQUFJLENBQUMsR0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUEsRUFBQztBQUFDLGNBQUksQ0FBQyxHQUFDLFdBQVMsQ0FBQyxFQUFDO0FBQUMsZ0JBQUksQ0FBQyxHQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBQyxVQUFTLENBQUMsRUFBQztBQUFDLGtCQUFJLENBQUM7a0JBQUMsQ0FBQyxHQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSSxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFFO0FBQUMsaUJBQUMsR0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLENBQUE7ZUFBQTthQUFDLENBQUE7V0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUE7U0FBQyxLQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksRUFBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFBLEVBQUM7QUFBQyxjQUFJLENBQUMsR0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBQyxVQUFTLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxtQkFBTyxDQUFDLElBQUksU0FBUyxJQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLENBQUE7V0FBQyxDQUFBO1NBQUMsQ0FBQyxHQUFDLElBQUksQ0FBQTtPQUFDLENBQUEsRUFBRSxHQUFDLENBQUMsQ0FBQSxVQUFTLENBQUMsRUFBQztBQUFDLG9CQUFZLENBQUM7QUFBQSxZQUFHLFNBQVMsSUFBRyxDQUFDLEVBQUM7QUFBQyxjQUFJLENBQUMsR0FBQyxXQUFXO2NBQUMsQ0FBQyxHQUFDLFdBQVc7Y0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Y0FBQyxDQUFDLEdBQUMsTUFBTTtjQUFDLENBQUMsR0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFFLFlBQVU7QUFBQyxtQkFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBQyxFQUFFLENBQUMsQ0FBQTtXQUFDO2NBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLElBQUUsVUFBUyxDQUFDLEVBQUM7QUFBQyxpQkFBSSxJQUFJLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLElBQUksQ0FBQyxNQUFNLEVBQUMs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QUFFLENBQUE7V0FBQyxFQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUMsWUFBVTtBQUFDLGdCQUFJLENBQUM7Z0JBQUMsQ0FBQztnQkFBQyxDQUFDLEdBQUMsU0FBUztnQkFBQyxDQUFDLEdBQUMsQ0FBQztnQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU07Z0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDO0FBQUcsbUJBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxLQUFHLENBQUMsQ0FBQztBQUFFLG9CQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLENBQUM7ZUFBQTtxQkFBTSxFQUFFLENBQUMsR0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFBO1dBQUMsRUFBQyxDQUFDLENBQUMsTUFBTSxHQUFDLFVBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLGFBQUMsSUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEtBQUcsQ0FBQyxDQUFDLElBQUUsUUFBUSxHQUFDLENBQUMsS0FBRyxDQUFDLENBQUMsSUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsS0FBRyxDQUFDLENBQUMsSUFBRSxDQUFDLEtBQUcsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFBO1dBQUMsRUFBQyxDQUFDLENBQUMsUUFBUSxHQUFDLFlBQVU7QUFBQyxtQkFBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1dBQUMsRUFBQyxDQUFDLENBQUMsY0FBYyxDQUFBLEVBQUM7QUFBQyxnQkFBSSxDQUFDLEdBQUMsRUFBQyxHQUFHLEVBQUMsQ0FBQyxFQUFDLFVBQVUsRUFBQyxDQUFDLENBQUMsRUFBQyxZQUFZLEVBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxJQUFHO0FBQUMsZUFBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBO2FBQUMsQ0FBQSxPQUFNLENBQUMsRUFBQztBQUFDLGVBQUMsQ0FBQyxNQUFNLEtBQUcsQ0FBQyxVQUFVLEtBQUcsQ0FBQyxDQUFDLFVBQVUsR0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxDQUFBO2FBQUM7V0FBQyxNQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsSUFBRSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBO1NBQUM7T0FBQyxDQUFBLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBLEFBQUMsQ0FBQTtLQUFDLEVBQUMsRUFBRSxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsVUFBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLGVBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxZQUFHLFFBQVEsSUFBRSxPQUFPLENBQUMsRUFBQyxNQUFNLElBQUksU0FBUyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxLQUFHLENBQUMsR0FBQyxRQUFRLENBQUEsQUFBQyxDQUFDLElBQUksQ0FBQyxHQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLENBQUMsRUFBQyxPQUFPLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLE1BQU0sSUFBRSxDQUFDLEVBQUM7QUFBQyxjQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUE7U0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLFFBQVE7WUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFJLENBQUMsQ0FBQyxTQUFTLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFFO0FBQUUsV0FBQyxHQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7U0FBQSxJQUFHLENBQUMsQ0FBQyxVQUFVLElBQUUsQ0FBQyxDQUFDLFNBQVMsRUFBQyxPQUFPLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLHNCQUFzQixFQUFFLEVBQUMsQ0FBQyxDQUFDLFVBQVU7QUFBRSxXQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7U0FBQSxPQUFPLENBQUMsQ0FBQTtPQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztVQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLElBQUUsT0FBTyxRQUFRLEtBQUcsQ0FBQyxHQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFNBQVMsR0FBQyxvRUFBb0UsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFDLENBQUMsR0FBQyxLQUFLLENBQUMsQ0FBQSxBQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsRUFBQyxNQUFNLEVBQUMsQ0FBQyxDQUFDLEVBQUMsWUFBWSxFQUFDLGFBQWEsQ0FBQyxFQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsRUFBQyxnQkFBZ0IsRUFBQyxrQkFBa0IsQ0FBQyxFQUFDLEdBQUcsRUFBQyxDQUFDLENBQUMsRUFBQyxrQ0FBa0MsRUFBQyxxQkFBcUIsQ0FBQyxFQUFDLFFBQVEsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUMsUUFBUSxFQUFDLFFBQVEsQ0FBQyxHQUFDLENBQUMsQ0FBQyxFQUFDLEVBQUUsRUFBQyxFQUFFLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBQyxDQUFDLENBQUMsRUFBQyxvQkFBb0IsRUFBQyx1QkFBdUIsQ0FBQyxFQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBQyxDQUFDLENBQUMsRUFBQyw4QkFBOEIsRUFBQyxXQUFXLENBQUMsRUFBQyxDQUFDLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUMsQ0FBQyxDQUFDLEVBQUMsU0FBUyxFQUFDLFVBQVUsQ0FBQyxFQUFDLENBQUMsQ0FBQyxRQUFRLEdBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxFQUFDLHdEQUF3RCxFQUFDLFFBQVEsQ0FBQyxDQUFBO0tBQUMsRUFBQyxFQUFFLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxVQUFTLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsa0JBQVksQ0FBQztBQUFBLGVBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxZQUFHLEtBQUssQ0FBQyxLQUFHLENBQUMsSUFBRSxJQUFJLEtBQUcsQ0FBQyxFQUFDLE1BQU0sSUFBSSxTQUFTLENBQUMseUNBQXlDLENBQUMsQ0FBQyxLQUFJLElBQUksQ0FBQyxHQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxTQUFTLENBQUMsTUFBTSxFQUFDLENBQUMsRUFBRSxFQUFDO0FBQUMsY0FBSSxDQUFDLEdBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsS0FBSyxDQUFDLEtBQUcsQ0FBQyxJQUFFLElBQUksS0FBRyxDQUFDLEVBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEVBQUUsRUFBQztBQUFDLGdCQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUFDLENBQUMsR0FBQyxNQUFNLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFHLENBQUMsSUFBRSxDQUFDLENBQUMsVUFBVSxLQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxDQUFBO1dBQUM7U0FBQyxPQUFPLENBQUMsQ0FBQTtPQUFDLFNBQVMsQ0FBQyxHQUFFO0FBQUMsY0FBTSxDQUFDLE1BQU0sSUFBRSxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBQyxRQUFRLEVBQUMsRUFBQyxVQUFVLEVBQUMsQ0FBQyxDQUFDLEVBQUMsWUFBWSxFQUFDLENBQUMsQ0FBQyxFQUFDLFFBQVEsRUFBQyxDQUFDLENBQUMsRUFBQyxLQUFLLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQTtPQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsRUFBQyxNQUFNLEVBQUMsQ0FBQyxFQUFDLFFBQVEsRUFBQyxDQUFDLEVBQUMsQ0FBQTtLQUFDLEVBQUMsRUFBRSxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsVUFBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLGVBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxnQkFBUSxZQUFTLENBQUMseUNBQUQsQ0FBQyxFQUFBLEdBQUMsQ0FBQyxHQUFDLEVBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsR0FBQyxLQUFLLENBQUMsS0FBRyxDQUFDLENBQUMsSUFBSSxLQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxFQUFFLEdBQUMsRUFBRSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsVUFBVSxLQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQSxBQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsUUFBUSxHQUFDLENBQUMsQ0FBQyxRQUFRLEdBQUMsRUFBRSxFQUFDLENBQUMsR0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUMsRUFBRSxDQUFDLEVBQUM7QUFBQyxjQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLElBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFBLElBQUcsQ0FBQyxDQUFDLElBQUksSUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFDO0FBQUMsZ0JBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJO2dCQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUcsVUFBVSxLQUFHLENBQUMsQ0FBQyxJQUFJLElBQUUsT0FBTyxLQUFHLENBQUMsQ0FBQyxJQUFJLElBQUUsQ0FBQyxDQUFDLE9BQU8sS0FBRyxDQUFDLEdBQUMsS0FBSyxDQUFDLENBQUEsQUFBQyxFQUFDLENBQUMsQ0FBQyxLQUFLLENBQUEsRUFBQztBQUFDLG1CQUFHLFVBQVUsS0FBRyxDQUFDLENBQUMsSUFBSSxJQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUcsQ0FBQyxHQUFDLEVBQUUsQ0FBQSxBQUFDLEVBQUMsT0FBTyxLQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBRSxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxPQUFPLEtBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLEVBQUMsQ0FBQyxDQUFDLElBQUUsT0FBTyxJQUFFLENBQUMsQ0FBQyxJQUFJLENBQUEsRUFBQyxTQUFRO2FBQUMsTUFBSyxJQUFHLENBQUMsQ0FBQyxFQUFDLFNBQVMsSUFBRyxpQkFBaUIsS0FBRyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxLQUFJO0FBQUMsZUFBQyxHQUFDLEVBQUUsQ0FBQyxLQUFJLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUMsRUFBRSxDQUFDLEVBQUM7QUFBQyxvQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssSUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLO29CQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxJQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxJQUFFLENBQUMsS0FBRyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLElBQUUsSUFBSSxLQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQSxBQUFDLENBQUE7ZUFBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsS0FBSyxLQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxFQUFFLENBQUMsQ0FBQSxBQUFDLENBQUE7YUFBQztXQUFDO1NBQUMsSUFBRyxDQUFDLENBQUMsS0FBSyxFQUFDLEtBQUksSUFBSSxDQUFDLElBQUksQ0FBQztBQUFDLFdBQUMsQ0FBQyxDQUFDLENBQUMsS0FBRyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsRUFBRSxDQUFDLENBQUEsQUFBQyxDQUFDO1NBQUEsT0FBTyxDQUFDLENBQUE7T0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUM7QUFBQyxZQUFJLENBQUMsR0FBQyxFQUFFO1lBQUMsQ0FBQyxHQUFDLGFBQWE7WUFBQyxDQUFDLEdBQUMsSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxJQUFJLE1BQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQztBQUFFLFdBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FBQSxPQUFPLENBQUMsQ0FBQTtPQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsWUFBRyxDQUFDLEtBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBQyxPQUFPLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRTtZQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUcsSUFBSSxLQUFHLENBQUMsRUFBQyxPQUFPLENBQUMsR0FBQyxDQUFDLElBQUUsRUFBRSxFQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLE9BQU8sSUFBRSxFQUFFLEVBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLEVBQUMsQ0FBQyxDQUFDLElBQUcsQ0FBQyxFQUFDO0FBQUMsY0FBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztjQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxHQUFDLENBQUMsSUFBRSxFQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBLElBQUcsQ0FBQyxHQUFDLENBQUMsSUFBRSxFQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsQ0FBQTtTQUFDLE1BQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFBO09BQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxZQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsQ0FBQyxFQUFDO0FBQUMsY0FBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBO1NBQUMsTUFBSTtBQUFDLGNBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQSxHQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUE7U0FBQyxPQUFPLENBQUMsQ0FBQTtPQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsZUFBTyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUMsTUFBTSxDQUFDLEVBQUMsQ0FBQyxHQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBQyxHQUFHLENBQUMsRUFBQyxDQUFDLElBQUUsQ0FBQyxHQUFDLEdBQUcsR0FBQyxFQUFFLENBQUEsQUFBQyxHQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxHQUFDLEdBQUcsR0FBQyxDQUFDLENBQUE7T0FBQyxJQUFJLENBQUMsR0FBQyx1Q0FBdUM7VUFBQyxDQUFDLEdBQUMsb0NBQW9DO1VBQUMsQ0FBQyxHQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFBO0tBQUMsRUFBQyxFQUFFLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxVQUFTLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsT0FBQyxVQUFTLENBQUMsRUFBQztBQUFDLFNBQUMsQ0FBQSxVQUFTLENBQUMsRUFBQztBQUFDLGNBQUcsUUFBUSxZQUFTLENBQUMseUNBQUQsQ0FBQyxFQUFBLElBQUUsV0FBVyxJQUFFLE9BQU8sQ0FBQyxFQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxJQUFHLFVBQVUsSUFBRSxPQUFPLENBQUMsSUFBRSxDQUFDLENBQUMsR0FBRyxFQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSTtBQUFDLGdCQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUMsV0FBVyxJQUFFLE9BQU8sTUFBTSxHQUFDLE1BQU0sR0FBQyxXQUFXLElBQUUsT0FBTyxDQUFDLEdBQUMsQ0FBQyxHQUFDLFdBQVcsSUFBRSxPQUFPLElBQUksR0FBQyxJQUFJLEdBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxTQUFTLEdBQUMsQ0FBQyxFQUFFLENBQUE7V0FBQztTQUFDLENBQUEsQ0FBQyxZQUFVO0FBQUMsaUJBQU8sQ0FBQSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLHFCQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsa0JBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUM7QUFBQyxvQkFBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQztBQUFDLHNCQUFJLENBQUMsR0FBQyxVQUFVLElBQUUsT0FBTyxDQUFDLElBQUUsQ0FBQyxDQUFDLElBQUcsQ0FBQyxDQUFDLElBQUUsQ0FBQyxFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsQ0FBQyxFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLElBQUksS0FBSyxDQUFDLHNCQUFzQixHQUFDLENBQUMsR0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFNLENBQUMsQ0FBQyxJQUFJLEdBQUMsa0JBQWtCLEVBQUMsQ0FBQyxDQUFBLENBQUE7aUJBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUMsT0FBTyxFQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxVQUFTLENBQUMsRUFBQztBQUFDLHNCQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQTtpQkFBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsT0FBTyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBO2VBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFBO2FBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxVQUFVLElBQUUsT0FBTyxDQUFDLElBQUUsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUMsQ0FBQyxFQUFFO0FBQUMsZUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQUEsT0FBTyxDQUFDLENBQUE7V0FBQyxDQUFBLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxVQUFTLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsdUJBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxvQkFBRyxRQUFRLElBQUUsT0FBTyxDQUFDLEVBQUMsTUFBTSxJQUFJLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsS0FBRyxDQUFDLEdBQUMsUUFBUSxDQUFBLEFBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsQ0FBQyxDQUFDLEVBQUMsT0FBTyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxNQUFNLElBQUUsQ0FBQyxFQUFDO0FBQUMsc0JBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxHQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQTtpQkFBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElB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SSxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsR0FBQyxLQUFLLENBQUMsS0FBRyxDQUFDLENBQUMsSUFBSSxLQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxFQUFFLEdBQUMsRUFBRSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsVUFBVSxLQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQSxBQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsUUFBUSxHQUFDLENBQUMsQ0FBQyxRQUFRLEdBQUMsRUFBRSxFQUFDLENBQUMsR0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUMsRUFBRSxDQUFDLEVBQUM7QUFBQyxzQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxJQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQSxJQUFHLENBQUMsQ0FBQyxJQUFJLElBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBQztBQUFDLHdCQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSTt3QkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFHLFVBQVUsS0FBRyxDQUFDLENBQUMsSUFBSSxJQUFFLE9BQU8sS0FBRyxDQUFDLENBQUMsSUFBSSxJQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUcsQ0FBQyxHQUFDLEtBQUssQ0FBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLENBQUMsS0FBSyxDQUFBLEVBQUM7QUFBQywyQkFBRyxVQUFVLEtBQUcsQ0FBQyxDQUFDLElBQUksSUFBRSxDQUFDLENBQUMsT0FBTyxLQUFHLENBQUMsR0FBQyxFQUFFLENBQUEsQUFBQyxFQUFDLE9BQU8sS0FBRyxDQUFDLENBQUMsSUFBSSxLQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUUsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsT0FBTyxLQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxFQUFDLENBQUMsQ0FBQyxJQUFFLE9BQU8sSUFBRSxDQUFDLENBQUMsSUFBSSxDQUFBLEVBQUMsU0FBUTtxQkFBQyxNQUFLLElBQUcsQ0FBQyxDQUFDLEVBQUMsU0FBUyxJQUFHLGlCQUFpQixLQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUk7QUFBQyx1QkFBQyxHQUFDLEVBQUUsQ0FBQyxLQUFJLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUMsRUFBRSxDQUFDLEVBQUM7QUFBQyw0QkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssSUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLOzRCQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxJQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxJQUFFLENBQUMsS0FBRyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLElBQUUsSUFBSSxLQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQSxBQUFDLENBQUE7dUJBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLEtBQUssS0FBRyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsRUFBRSxDQUFDLENBQUEsQUFBQyxDQUFBO3FCQUFDO21CQUFDO2lCQUFDLElBQUcsQ0FBQyxDQUFDLEtBQUssRUFBQyxLQUFJLElBQUksQ0FBQyxJQUFJLENBQUM7QUFBQyxtQkFBQyxDQUFDLENBQUMsQ0FBQyxLQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxFQUFFLENBQUMsQ0FBQSxBQUFDLENBQUM7aUJBQUEsT0FBTyxDQUFDLENBQUE7ZUFBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUM7QUFBQyxvQkFBSSxDQUFDLEdBQUMsRUFBRTtvQkFBQyxDQUFDLEdBQUMsYUFBYTtvQkFBQyxDQUFDLEdBQUMsSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsSUFBSSxNQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUM7QUFBRSxtQkFBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFBQSxPQUFPLENBQUMsQ0FBQTtlQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsb0JBQUcsQ0FBQyxLQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUMsT0FBTyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUU7b0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBRyxJQUFJLEtBQUcsQ0FBQyxFQUFDLE9BQU8sQ0FBQyxHQUFDLENBQUMsSUFBRSxFQUFFLEVBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsT0FBTyxJQUFFLEVBQUUsRUFBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLENBQUMsSUFBRyxDQUFDLEVBQUM7QUFBQyxzQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztzQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsR0FBQyxDQUFDLElBQUUsRUFBRSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQSxJQUFHLENBQUMsR0FBQyxDQUFDLElBQUUsRUFBRSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLENBQUE7aUJBQUMsTUFBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMs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LENBQUMsQ0FBVSxDQUFDLEVBQUM7QUFBQyxvQkFBSSxDQUFDLEdBQUMsRUFBQyxJQUFJLEVBQUMsUUFBUSxFQUFDLElBQUksRUFBQyxjQUFTLENBQUMsRUFBQztBQUFDLHdCQUFJLENBQUMsR0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBQyxJQUFJLENBQUMsY0FBYyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLElBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLGFBQWEsR0FBQyxDQUFDLENBQUMsT0FBTyxLQUFHLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUEsQUFBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxhQUFhLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7d0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxXQUFXLElBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVcsR0FBQyxDQUFBLFlBQVU7QUFBQywwQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFBO3FCQUFDLENBQUEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxF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SSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBLEFBQUMsQ0FBQTthQUFDLENBQUEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUUsQ0FBQyxJQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxFQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUEsR0FBRSxDQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQTtXQUFDLEVBQUMsUUFBUSxJQUFFLE9BQU8sQ0FBQyxLQUFHLENBQUMsR0FBQyxFQUFDLE9BQU8sRUFBQyxDQUFDLEVBQUMsQ0FBQSxBQUFDLEVBQUMsQ0FBQyxDQUFDLGFBQWEsSUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsYUFBYSxHQUFDLENBQUMsQ0FBQyxPQUFPLEtBQUcsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFBLEFBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFDLENBQUMsQ0FBQyxjQUFjLEVBQUMsQ0FBQyxDQUFDO2NBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLFNBQVMsR0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFDLENBQUMsQ0FBQyxvQkFBb0IsSUFBRSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsYUFBQyxDQUFDLE1BQU0sS0FBRyxDQUFDLElBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFBO1dBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLFNBQVMsR0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLEVBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsT0FBTyxZQUFZLE1BQU0sQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsZUFBZSxDQUFBLEVBQUM7QUFBQyxnQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsRUFBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtXQUFDLE9BQU8sUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxTQUFTLElBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBQyxDQUFDLENBQUE7U0FBQyxFQUFDLEtBQUssRUFBQyxlQUFTLENBQUMsRUFBQztBQUFDLGNBQUksQ0FBQyxDQUFDLElBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFJO0FBQUMsZ0JBQUcsUUFBUSxJQUFFLE9BQU8sQ0FBQyxFQUFDLE1BQU0sSUFBSSxTQUFTLENBQUMsMENBQTBDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBO1dBQUMsT0FBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtTQUFDLEVBQUMsUUFBUSxFQUFDLG9CQUFVO0FBQUMsY0FBSSxDQUFDLEdBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFBO1NBQUMsRUFBQyxRQUFRLEVBQUMsb0JBQVU7QUFBQyxlQUFJLElBQUksQ0FBQyxJQUFJLENBQUM7QUFBQyxnQkFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztXQUFBLE9BQU0sQ0FBQyxDQUFDLENBQUE7U0FBQyxFQUFDLE1BQU0sRUFBQyxrQkFBVTtBQUFDLGlCQUFPLENBQUMsQ0FBQTtTQUFDLEVBQUMsT0FBTyxFQUFDLGlCQUFTLENBQUMsRUFBQztBQUFDLGlCQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtTQUFDLEVBQUMsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsVUFBRSxLQUFHLENBQUMsQ0FBQyxPQUFPLEtBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxDQUFBO09BQUMsQ0FBQyxFQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUMsWUFBVTtBQUFDLFNBQUMsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLElBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFBO09BQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxjQUFjLEdBQUMsRUFBQyxPQUFPLEVBQUMsRUFBRSxFQUFDLGVBQWUsRUFBQyxDQUFDLENBQUMsRUFBQyxrQkFBa0IsRUFBQyxDQUFDLENBQUMsRUFBQyxvQkFBb0IsRUFBQyxDQUFDLENBQUMsRUFBQyxjQUFjLEVBQUMsTUFBTSxFQUFDLFNBQVMsRUFBQyxFQUFFLEVBQUMsZ0JBQWdCLEVBQUMsRUFBRSxFQUFDLGdCQUFnQixFQUFDLEVBQUUsRUFBQyxjQUFjLEVBQUMsRUFBRSxFQUFDLGtCQUFrQixFQUFDLENBQUMsQ0FBQyxFQUFDLEVBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUMsYUFBYSxFQUFDLEVBQUMsWUFBWSxFQUFDLENBQUMsQ0FBQyxFQUFDLFVBQVUsRUFBQyxDQUFDLENBQUMsRUFBQyxRQUFRLEVBQUMsQ0FBQyxDQUFDLEVBQUMsS0FBSyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLGNBQWMsR0FBQyxVQUFTLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxZQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQUMsQ0FBQyxHQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsU0FBUyxHQUFDLENBQUMsR0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUE7T0FBQyxFQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFBO0tBQUMsRUFBQyxFQUFDLG9CQUFvQixFQUFDLENBQUMsRUFBQyxNQUFNLEVBQUMsQ0FBQyxFQUFDLG1CQUFtQixFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsRUFBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0NBQUMsQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogZ3Jhdml0b25cbiAqXG4gKiBKYXZhU2NyaXB0IE4tYm9keSBHcmF2aXRhdGlvbmFsIFNpbXVsYXRvclxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBaYXZlbiBNdXJhZHlhblxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlXG4gKlxuICogUmV2aXNpb246XG4gKiAgQFJFVklTSU9OXG4gKi9cbmltcG9ydCBHdEFwcCBmcm9tICcuL2dyYXZpdG9uL2FwcCc7XG5cbmV4cG9ydCBkZWZhdWx0IHsgYXBwOiBHdEFwcCB9O1xuIiwiLyoqXG4gKiBncmF2aXRvbi9hcHAgLS0gVGhlIGludGVyYWN0aXZlIGdyYXZpdG9uIGFwcGxpY2F0aW9uXG4gKi9cbi8qIGdsb2JhbCBqc2NvbG9yICovXG5cbmltcG9ydCB2ZXggZnJvbSAnLi4vdmVuZG9yL3ZleCc7XG5pbXBvcnQgcmFuZG9tIGZyb20gJy4uL3V0aWwvcmFuZG9tJztcbmltcG9ydCBHdFNpbSBmcm9tICcuL3NpbSc7XG5pbXBvcnQgR3RHZnggZnJvbSAnLi9nZngnO1xuaW1wb3J0IEd0RXZlbnRzLCB7IEtFWUNPREVTLCBFVkVOVENPREVTLCBDT05UUk9MQ09ERVMgfSBmcm9tICcuL2V2ZW50cyc7XG5pbXBvcnQgR3RUaW1lciBmcm9tICcuL3RpbWVyJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR3RBcHAge1xuICAgIGNvbnN0cnVjdG9yKGFyZ3MgPSB7fSkge1xuICAgICAgICB0aGlzLmFyZ3MgPSBhcmdzO1xuXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IHt9O1xuICAgICAgICB0aGlzLmdyaWQgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuYW5pbVRpbWVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5zaW1UaW1lciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5ldmVudHMgPSBudWxsO1xuICAgICAgICB0aGlzLnNpbSA9IG51bGw7XG4gICAgICAgIHRoaXMuZ2Z4ID0gbnVsbDtcblxuICAgICAgICB0aGlzLm5vY2xlYXIgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pbnRlcmFjdGlvbiA9IHtwcmV2aW91czoge319O1xuICAgICAgICB0aGlzLnRhcmdldEJvZHkgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMud2FzQ29sb3JQaWNrZXJBY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pc0hlbHBPcGVuID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5vcHRpb25zLndpZHRoID0gYXJncy53aWR0aCA9IGFyZ3Mud2lkdGggfHwgd2luZG93LmlubmVyV2lkdGg7XG4gICAgICAgIHRoaXMub3B0aW9ucy5oZWlnaHQgPSBhcmdzLmhlaWdodCA9IGFyZ3MuaGVpZ2h0IHx8IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICAgICAgdGhpcy5vcHRpb25zLmJhY2tncm91bmRDb2xvciA9IGFyZ3MuYmFja2dyb3VuZENvbG9yIHx8ICcjMUYyNjNCJztcblxuICAgICAgICAvLyBSZXRyaWV2ZSBjYW52YXMsIG9yIGJ1aWxkIG9uZSB3aXRoIGFyZ3VtZW50c1xuICAgICAgICB0aGlzLmdyaWQgPSB0eXBlb2YgYXJncy5ncmlkID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChhcmdzLmdyaWQpIDpcbiAgICAgICAgICAgIGFyZ3MuZ3JpZDtcblxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuZ3JpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVHcmlkKHRoaXMub3B0aW9ucy53aWR0aCwgdGhpcy5vcHRpb25zLmhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAge2JhY2tncm91bmRDb2xvcjogdGhpcy5vcHRpb25zLmJhY2tncm91bmRDb2xvcn0pO1xuICAgICAgICAgICAgYXJncy5ncmlkID0gdGhpcy5ncmlkO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb250cm9scyA9IHR5cGVvZiBhcmdzLmNvbnRyb2xzID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChhcmdzLmNvbnRyb2xzKSA6XG4gICAgICAgICAgICBhcmdzLmNvbnRyb2xzO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5jb250cm9scyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVDb250cm9scygpO1xuICAgICAgICAgICAgYXJncy5jb250cm9scyA9IHRoaXMuY29udHJvbHM7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBsYXlCdG4gPSBhcmdzLnBsYXlCdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyNwbGF5YnRuJyk7XG4gICAgICAgIHRoaXMucGF1c2VCdG4gPSBhcmdzLnBhdXNlQnRuID0gdGhpcy5jb250cm9scy5xdWVyeVNlbGVjdG9yKCcjcGF1c2VidG4nKTtcbiAgICAgICAgdGhpcy50cmFpbE9mZkJ0biA9IGFyZ3MudHJhaWxPZmZCdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyN0cmFpbG9mZmJ0bicpO1xuICAgICAgICB0aGlzLnRyYWlsT25CdG4gPSBhcmdzLnRyYWlsT25CdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyN0cmFpbG9uYnRuJyk7XG4gICAgICAgIHRoaXMuaGVscEJ0biA9IGFyZ3MuaGVscEJ0biA9IHRoaXMuY29udHJvbHMucXVlcnlTZWxlY3RvcignI2hlbHBidG4nKTtcblxuICAgICAgICB0aGlzLmNvbG9yUGlja2VyID0gdHlwZW9mIGFyZ3MuY29sb3JQaWNrZXIgPT09ICdzdHJpbmcnID9cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGFyZ3MuY29sb3JQaWNrZXIpIDpcbiAgICAgICAgICAgIGFyZ3MuY29sb3JQaWNrZXI7XG5cbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmNvbG9yUGlja2VyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5jb2xvclBpY2tlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgICAgICB0aGlzLmNvbG9yUGlja2VyLmNsYXNzTmFtZSA9ICdib2R5Y29sb3JwaWNrZXInO1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmNvbG9yUGlja2VyKTtcbiAgICAgICAgICAgIGFyZ3MuY29sb3JQaWNrZXIgPSB0aGlzLmNvbG9yUGlja2VyO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuanNjb2xvciA9IG5ldyBqc2NvbG9yKHRoaXMuY29sb3JQaWNrZXIsIHtcbiAgICAgICAgICAgIHBhZGRpbmc6IDAsXG4gICAgICAgICAgICBzaGFkb3c6IGZhbHNlLFxuICAgICAgICAgICAgYm9yZGVyV2lkdGg6IDAsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICBpbnNldENvbG9yOiAnIzNkNTU5ZScsXG4gICAgICAgICAgICBvbkZpbmVDaGFuZ2U6IHRoaXMudXBkYXRlQ29sb3IuYmluZCh0aGlzKVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLm1ldGFJbmZvID0gdHlwZW9mIGFyZ3MubWV0YUluZm8gPT09ICdzdHJpbmcnID9cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGFyZ3MubWV0YUluZm8pIDpcbiAgICAgICAgICAgIGFyZ3MubWV0YUluZm87XG5cbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm1ldGFJbmZvID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5tZXRhSW5mbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgICAgIHRoaXMubWV0YUluZm8uY2xhc3NOYW1lID0gJ21ldGFpbmZvJztcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5tZXRhSW5mbyk7XG4gICAgICAgICAgICBhcmdzLm1ldGFJbmZvID0gdGhpcy5tZXRhSW5mbztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEluaXRpYWxpemVcbiAgICAgICAgdGhpcy5pbml0Q29tcG9uZW50cygpO1xuICAgICAgICB0aGlzLmluaXRUaW1lcnMoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBtYWluIC0tIE1haW4gJ2dhbWUnIGxvb3BcbiAgICAgKi9cbiAgICBtYWluKCkge1xuICAgICAgICAvLyBFdmVudCBwcm9jZXNzaW5nXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgdGhpcy5ldmVudHMucWdldCgpLmZvckVhY2goZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGxldCByZXR2YWw7XG5cbiAgICAgICAgICAgIHN3aXRjaCAoZXZlbnQudHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgRVZFTlRDT0RFUy5NT1VTRURPV046XG4gICAgICAgICAgICAgICAgICAgIGlmIChldmVudC5idXR0b24gPT09IC8qIHJpZ2h0IGNsaWNrICovIDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBib2R5LlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0Qm9keSAmJiAhdGhpcy5pbnRlcmFjdGlvbi5zdGFydGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaW0ucmVtb3ZlQm9keSh0aGlzLnRhcmdldEJvZHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0VGFyZ2V0Qm9keSh1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmJ1dHRvbiA9PT0gLyogbWlkZGxlIGNsaWNrICovIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENvbG9yIHBpY2tpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnRhcmdldEJvZHkgJiYgIXRoaXMuaW50ZXJhY3Rpb24uc3RhcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29sb3JQaWNrZXIuc3R5bGUubGVmdCA9IGV2ZW50LnBvc2l0aW9uLnggKyAncHgnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29sb3JQaWNrZXIuc3R5bGUudG9wID0gZXZlbnQucG9zaXRpb24ueSArICdweCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5qc2NvbG9yLmZyb21TdHJpbmcodGhpcy50YXJnZXRCb2R5LmNvbG9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmpzY29sb3Iuc2hvdygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgeyAvKiBsZWZ0IGNsaWNrICovXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBCYXNlIHRoZSBjaGVjayBvbiB0aGUgcHJldmlvdXMgdmFsdWUsIGluIGNhc2UgdGhlIGNvbG9yIHBpY2tlciB3YXMganVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2xvc2VkLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLndhc0NvbG9yUGlja2VyQWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIGZsYWcgdG8gc2lnbmFsIG90aGVyIGV2ZW50c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJhY3Rpb24uc3RhcnRlZCA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50YXJnZXRCb2R5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJhY3Rpb24uYm9keSA9IHRoaXMudGFyZ2V0Qm9keTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLmJvZHkgPSB0aGlzLnNpbS5hZGROZXdCb2R5KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IGV2ZW50LnBvc2l0aW9uLngsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiBldmVudC5wb3NpdGlvbi55XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJhY3Rpb24ucHJldmlvdXMueCA9IGV2ZW50LnBvc2l0aW9uLng7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5wcmV2aW91cy55ID0gZXZlbnQucG9zaXRpb24ueTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBwaWNrZXIuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pc0NvbG9yUGlja2VyQWN0aXZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7IC8vIGVuZCBNT1VTRURPV05cblxuICAgICAgICAgICAgICAgIGNhc2UgRVZFTlRDT0RFUy5NT1VTRVVQOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5pbnRlcmFjdGlvbi5zdGFydGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGJvZHkgPSB0aGlzLmludGVyYWN0aW9uLmJvZHk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2ZWxYID0gKGV2ZW50LnBvc2l0aW9uLnggLSBib2R5LngpICogMC4wMDAwMDAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZlbFkgPSAoZXZlbnQucG9zaXRpb24ueSAtIGJvZHkueSkgKiAwLjAwMDAwMDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXaGVuIHRoZSBzaW11bGF0aW9uIGlzIGFjdGl2ZSwgYWRkIHRoZSB2ZWxvY2l0eSB0byB0aGUgY3VycmVudCB2ZWxvY2l0eVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW5zdGVhZCBvZiBjb21wbGV0ZWx5IHJlc2V0dGluZyBpdCAodG8gYWxsb3cgZm9yIG1vcmUgaW50ZXJlc3RpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGludGVyYWN0aW9ucykuXG4gICAgICAgICAgICAgICAgICAgICAgICBib2R5LnZlbFggPSB0aGlzLnNpbVRpbWVyLmFjdGl2ZSA/IGJvZHkudmVsWCArIHZlbFggOiB2ZWxYO1xuICAgICAgICAgICAgICAgICAgICAgICAgYm9keS52ZWxZID0gdGhpcy5zaW1UaW1lci5hY3RpdmUgPyBib2R5LnZlbFkgKyB2ZWxZIDogdmVsWTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRhcmdldChldmVudC5wb3NpdGlvbi54LCBldmVudC5wb3NpdGlvbi55KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIEVWRU5UQ09ERVMuTU9VU0VNT1ZFOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLnByZXZpb3VzLnggPSBldmVudC5wb3NpdGlvbi54O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLnByZXZpb3VzLnkgPSBldmVudC5wb3NpdGlvbi55O1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaW50ZXJhY3Rpb24uc3RhcnRlZCAmJiAhdGhpcy5pc0NvbG9yUGlja2VyQWN0aXZlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlVGFyZ2V0KGV2ZW50LnBvc2l0aW9uLngsIGV2ZW50LnBvc2l0aW9uLnkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrOyAvLyBlbmQgTU9VU0VNT1ZFXG5cbiAgICAgICAgICAgICAgICBjYXNlIEVWRU5UQ09ERVMuTU9VU0VXSEVFTDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0Qm9keSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50YXJnZXRCb2R5LmFkanVzdFNpemUoZXZlbnQuZGVsdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVNZXRhSW5mbygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrOyAvLyBlbmQgTU9VU0VXSEVFTFxuXG4gICAgICAgICAgICAgICAgY2FzZSBFVkVOVENPREVTLktFWURPV046XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoZXZlbnQua2V5Y29kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBLRVlDT0RFUy5LX0VOVEVSOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlU2ltKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgS0VZQ09ERVMuS19DOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENsZWFyIHNpbXVsYXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNpbS5jbGVhcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ2Z4LmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaW1UaW1lci5zdG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dmFsID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgS0VZQ09ERVMuS19QOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlVHJhaWxzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgS0VZQ09ERVMuS19SOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYXRlIHJhbmRvbSBvYmplY3RzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZUJvZGllcygxMCwge3JhbmRvbUNvbG9yczogdHJ1ZX0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEtFWUNPREVTLktfVDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNpbS5hZGROZXdCb2R5KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogdGhpcy5vcHRpb25zLndpZHRoIC8gMiwgeTogdGhpcy5vcHRpb25zLmhlaWdodCAvIDIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlbFg6IDAsIHZlbFk6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hc3M6IDIwMDAsIHJhZGl1czogNTAsIGNvbG9yOiAnIzVBNUE1QSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNpbS5hZGROZXdCb2R5KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogdGhpcy5vcHRpb25zLndpZHRoIC0gNDAwLCB5OiB0aGlzLm9wdGlvbnMuaGVpZ2h0IC8gMixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVsWDogMCwgdmVsWTogMC4wMDAwMjUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hc3M6IDEsIHJhZGl1czogNSwgY29sb3I6ICcjNzg3ODc4J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEtFWUNPREVTLktfUVVFU1RJT05NQVJLOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd0hlbHAoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhazsgLy8gZW5kIEtFWURPV05cblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLlBMQVlCVE46XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlU2ltKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBDT05UUk9MQ09ERVMuUEFVU0VCVE46XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlU2ltKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBDT05UUk9MQ09ERVMuVFJBSUxPRkZCVE46XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlVHJhaWxzKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBDT05UUk9MQ09ERVMuVFJBSUxPTkJUTjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVUcmFpbHMoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5IRUxQQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dIZWxwKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmV0dmFsO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICAvLyBSZWRyYXcgc2NyZWVuXG4gICAgICAgIHRoaXMucmVkcmF3KCk7XG4gICAgfVxuXG4gICAgaW5pdENvbXBvbmVudHMoKSB7XG4gICAgICAgIC8vIENyZWF0ZSBjb21wb25lbnRzIC0tIG9yZGVyIGlzIGltcG9ydGFudFxuICAgICAgICB0aGlzLmV2ZW50cyA9IHRoaXMuYXJncy5ldmVudHMgPSBuZXcgR3RFdmVudHModGhpcy5hcmdzKTtcbiAgICAgICAgdGhpcy5zaW0gPSBuZXcgR3RTaW0odGhpcy5hcmdzKTtcbiAgICAgICAgdGhpcy5nZnggPSBuZXcgR3RHZngodGhpcy5hcmdzKTtcbiAgICB9XG5cbiAgICBpbml0VGltZXJzKCkge1xuICAgICAgICAvLyBBZGQgYG1haW5gIGxvb3AsIGFuZCBzdGFydCBpbW1lZGlhdGVseVxuICAgICAgICB0aGlzLmFuaW1UaW1lciA9IG5ldyBHdFRpbWVyKHRoaXMubWFpbi5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5hbmltVGltZXIuc3RhcnQoKTtcbiAgICAgICAgdGhpcy5zaW1UaW1lciA9IG5ldyBHdFRpbWVyKHRoaXMuc2ltLnN0ZXAuYmluZCh0aGlzLnNpbSksIDYwKTtcbiAgICB9XG5cbiAgICB0b2dnbGVTaW0oKSB7XG4gICAgICAgIGlmICh0aGlzLnNpbVRpbWVyLmFjdGl2ZSkge1xuICAgICAgICAgICAgdGhpcy5wbGF5QnRuLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgICAgIHRoaXMucGF1c2VCdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucGxheUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgdGhpcy5wYXVzZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zaW1UaW1lci50b2dnbGUoKTtcbiAgICB9XG5cbiAgICB0b2dnbGVUcmFpbHMoKSB7XG4gICAgICAgIGlmICh0aGlzLm5vY2xlYXIpIHtcbiAgICAgICAgICAgIHRoaXMudHJhaWxPZmZCdG4uc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICAgICAgdGhpcy50cmFpbE9uQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnRyYWlsT2ZmQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB0aGlzLnRyYWlsT25CdG4uc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubm9jbGVhciA9ICF0aGlzLm5vY2xlYXI7XG4gICAgfVxuXG4gICAgc2hvd0hlbHAoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzSGVscE9wZW4pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmlzSGVscE9wZW4gPSB0cnVlO1xuICAgICAgICB2ZXgub3Blbih7XG4gICAgICAgICAgICB1bnNhZmVDb250ZW50OiBgXG4gICAgICAgICAgICAgICAgPGgzPlNob3J0Y3V0czwvaDM+XG4gICAgICAgICAgICAgICAgPHRhYmxlIGNsYXNzPVwic2hvcnRjdXRzXCI+XG4gICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPkxlZnQgY2xpY2s8L3RkPiA8dGQ+IGNyZWF0ZSBib2R5PC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+UmlnaHQgY2xpY2s8L3RkPiA8dGQ+IGRlbGV0ZSBib2R5PC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+TWlkZGxlIGNsaWNrPC90ZD4gPHRkPiBjaGFuZ2UgYm9keSBjb2xvcjwvdGQ+PC90cj5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjxjb2RlPkVudGVyIGtleTwvY29kZT4ga2V5PC90ZD4gPHRkPiBzdGFydCBzaW11bGF0aW9uPC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGNvZGU+QzwvY29kZT4ga2V5PC90ZD4gPHRkPiBjbGVhciBjYW52YXM8L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48Y29kZT5QPC9jb2RlPiBrZXk8L3RkPiA8dGQ+IHRvZ2dsZSByZXBhaW50aW5nPC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGNvZGU+UjwvY29kZT4ga2V5PC90ZD4gPHRkPiBjcmVhdGUgcmFuZG9tIGJvZGllczwvdGQ+PC90cj5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjxjb2RlPlQ8L2NvZGU+IGtleTwvdGQ+IDx0ZD4gY3JlYXRlIFRpdGFuPC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGNvZGU+PzwvY29kZT4ga2V5PC90ZD4gPHRkPiBzaG93IGhlbHA8L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgYWZ0ZXJDbG9zZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuaXNIZWxwT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZWRyYXcoKSB7XG4gICAgICAgIGlmICghdGhpcy5ub2NsZWFyKSB7XG4gICAgICAgICAgICB0aGlzLmdmeC5jbGVhcigpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZHJhd0ludGVyYWN0aW9uKCk7XG4gICAgICAgIHRoaXMuZ2Z4LmRyYXdCb2RpZXModGhpcy5zaW0uYm9kaWVzLCB0aGlzLnRhcmdldEJvZHkpO1xuICAgIH1cblxuICAgIGdlbmVyYXRlR3JpZCh3aWR0aCwgaGVpZ2h0LCBzdHlsZSkge1xuICAgICAgICAvLyBBdHRhY2ggYSBjYW52YXMgdG8gdGhlIHBhZ2UsIHRvIGhvdXNlIHRoZSBzaW11bGF0aW9uc1xuICAgICAgICBpZiAoIXN0eWxlKSB7XG4gICAgICAgICAgICBzdHlsZSA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5ncmlkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cbiAgICAgICAgdGhpcy5ncmlkLmNsYXNzTmFtZSA9ICdncmF2aXRvbmNhbnZhcyc7XG4gICAgICAgIHRoaXMuZ3JpZC53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmdyaWQuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICB0aGlzLmdyaWQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgIHRoaXMuZ3JpZC5zdHlsZS5tYXJnaW5MZWZ0ID0gc3R5bGUubWFyZ2luTGVmdCB8fCAnYXV0byc7XG4gICAgICAgIHRoaXMuZ3JpZC5zdHlsZS5tYXJnaW5SaWdodCA9IHN0eWxlLm1hcmdpblJpZ2h0IHx8ICdhdXRvJztcbiAgICAgICAgdGhpcy5ncmlkLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHN0eWxlLmJhY2tncm91bmRDb2xvciB8fCAnIzAwMDAwMCc7XG5cbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmdyaWQpO1xuICAgIH1cblxuICAgIGdlbmVyYXRlQ29udHJvbHMoKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdtZW51Jyk7XG4gICAgICAgIHRoaXMuY29udHJvbHMudHlwZSA9ICd0b29sYmFyJztcbiAgICAgICAgdGhpcy5jb250cm9scy5pZCA9ICdjb250cm9scyc7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaW5uZXJIVE1MID0gYFxuICAgICAgICAgICAgPG1lbnVpdGVtIGlkPVwicGxheWJ0blwiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiYXNzZXRzL3BsYXkuc3ZnXCIgYWx0PVwiU3RhcnQgc2ltdWxhdGlvblwiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cInBhdXNlYnRuXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiYXNzZXRzL3BhdXNlLnN2Z1wiIGFsdD1cIlN0b3Agc2ltdWxhdGlvblwiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cInRyYWlsb2ZmYnRuXCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvdHJhaWxfb2ZmLnN2Z1wiIGFsdD1cIlRvZ2dsZSB0cmFpbHNcIj5cbiAgICAgICAgICAgIDwvbWVudWl0ZW0+XG4gICAgICAgICAgICA8bWVudWl0ZW0gaWQ9XCJ0cmFpbG9uYnRuXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiYXNzZXRzL3RyYWlsX29uLnN2Z1wiIGFsdD1cIlRvZ2dsZSB0cmFpbHNcIj5cbiAgICAgICAgICAgIDwvbWVudWl0ZW0+XG4gICAgICAgICAgICA8bWVudWl0ZW0gaWQ9XCJoZWxwYnRuXCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvaGVscC5zdmdcIiBhbHQ9XCJIZWxwXCI+XG4gICAgICAgICAgICA8L21lbnVpdGVtPlxuICAgICAgICAgICAgYDtcblxuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuY29udHJvbHMpO1xuICAgIH1cblxuICAgIGdlbmVyYXRlQm9kaWVzKG51bSwgYXJncykge1xuICAgICAgICBhcmdzID0gYXJncyB8fCB7fTtcblxuICAgICAgICBsZXQgbWluWCA9IGFyZ3MubWluWCB8fCAwO1xuICAgICAgICBsZXQgbWF4WCA9IGFyZ3MubWF4WCB8fCB0aGlzLm9wdGlvbnMud2lkdGg7XG4gICAgICAgIGxldCBtaW5ZID0gYXJncy5taW5ZIHx8IDA7XG4gICAgICAgIGxldCBtYXhZID0gYXJncy5tYXhZIHx8IHRoaXMub3B0aW9ucy5oZWlnaHQ7XG5cbiAgICAgICAgbGV0IG1pblZlbFggPSBhcmdzLm1pblZlbFggfHwgMDtcbiAgICAgICAgbGV0IG1heFZlbFggPSBhcmdzLm1heFZlbFggfHwgMC4wMDAwMTtcbiAgICAgICAgbGV0IG1pblZlbFkgPSBhcmdzLm1pblZlbFkgfHwgMDtcbiAgICAgICAgbGV0IG1heFZlbFkgPSBhcmdzLm1heFZlbFkgfHwgMC4wMDAwMTtcblxuICAgICAgICBsZXQgbWluTWFzcyA9IGFyZ3MubWluTWFzcyB8fCAxO1xuICAgICAgICBsZXQgbWF4TWFzcyA9IGFyZ3MubWF4TWFzcyB8fCAxNTA7XG5cbiAgICAgICAgbGV0IG1pblJhZGl1cyA9IGFyZ3MubWluUmFkaXVzIHx8IDE7XG4gICAgICAgIGxldCBtYXhSYWRpdXMgPSBhcmdzLm1heFJhZGl1cyB8fCAxNTtcblxuICAgICAgICBsZXQgY29sb3IgPSBhcmdzLmNvbG9yO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChhcmdzLnJhbmRvbUNvbG9ycyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIGNvbG9yID0gcmFuZG9tLmNvbG9yKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuc2ltLmFkZE5ld0JvZHkoe1xuICAgICAgICAgICAgICAgIHg6IHJhbmRvbS5udW1iZXIobWluWCwgbWF4WCksXG4gICAgICAgICAgICAgICAgeTogcmFuZG9tLm51bWJlcihtaW5ZLCBtYXhZKSxcbiAgICAgICAgICAgICAgICB2ZWxYOiByYW5kb20uZGlyZWN0aW9uYWwobWluVmVsWCwgbWF4VmVsWCksXG4gICAgICAgICAgICAgICAgdmVsWTogcmFuZG9tLmRpcmVjdGlvbmFsKG1pblZlbFksIG1heFZlbFkpLFxuICAgICAgICAgICAgICAgIG1hc3M6IHJhbmRvbS5udW1iZXIobWluTWFzcywgbWF4TWFzcyksXG4gICAgICAgICAgICAgICAgcmFkaXVzOiByYW5kb20ubnVtYmVyKG1pblJhZGl1cywgbWF4UmFkaXVzKSxcbiAgICAgICAgICAgICAgICBjb2xvcjogY29sb3JcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZHJhd0ludGVyYWN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5pbnRlcmFjdGlvbi5zdGFydGVkKSB7XG4gICAgICAgICAgICB0aGlzLmdmeC5kcmF3UmV0aWNsZUxpbmUodGhpcy5pbnRlcmFjdGlvbi5ib2R5LCB0aGlzLmludGVyYWN0aW9uLnByZXZpb3VzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZVRhcmdldCh4LCB5KSB7XG4gICAgICAgIHRoaXMuc2V0VGFyZ2V0Qm9keSh0aGlzLnNpbS5nZXRCb2R5QXQoeCwgeSkpO1xuICAgIH1cblxuICAgIHNldFRhcmdldEJvZHkoYm9keSkge1xuICAgICAgICB0aGlzLnRhcmdldEJvZHkgPSBib2R5O1xuICAgICAgICB0aGlzLnVwZGF0ZU1ldGFJbmZvKCk7XG4gICAgfVxuXG4gICAgdXBkYXRlTWV0YUluZm8oKSB7XG4gICAgICAgIGlmICh0aGlzLnRhcmdldEJvZHkpIHtcbiAgICAgICAgICAgIHRoaXMubWV0YUluZm8uaW5uZXJIVE1MID1cbiAgICAgICAgICAgICAgICBg4oqVICR7dGhpcy50YXJnZXRCb2R5Lm1hc3MudG9GaXhlZCgyKX0gJm5ic3A7YCArXG4gICAgICAgICAgICAgICAgYOKmvyAke3RoaXMudGFyZ2V0Qm9keS5yYWRpdXMudG9GaXhlZCgyKX0gJm5ic3A7YCArXG4gICAgICAgICAgICAgICAgYOKHlyAke3RoaXMudGFyZ2V0Qm9keS5zcGVlZC50b0ZpeGVkKDIpfWA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm1ldGFJbmZvLnRleHRDb250ZW50ID0gJyc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVDb2xvcigpIHtcbiAgICAgICAgaWYgKHRoaXMudGFyZ2V0Qm9keSkge1xuICAgICAgICAgICAgdGhpcy50YXJnZXRCb2R5LnVwZGF0ZUNvbG9yKHRoaXMuanNjb2xvci50b0hFWFN0cmluZygpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlzQ29sb3JQaWNrZXJBY3RpdmUoKSB7XG4gICAgICAgIHRoaXMud2FzQ29sb3JQaWNrZXJBY3RpdmUgPSB0aGlzLmNvbG9yUGlja2VyLmNsYXNzTmFtZS5pbmRleE9mKCdqc2NvbG9yLWFjdGl2ZScpID4gLTE7XG4gICAgICAgIHJldHVybiB0aGlzLndhc0NvbG9yUGlja2VyQWN0aXZlO1xuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL2FwcFxuIiwiaW1wb3J0IGNvbG9ycyBmcm9tICcuLi91dGlsL2NvbG9ycyc7XG5cbi8qKlxuICogZ3Jhdml0b24vYm9keSAtLSBUaGUgZ3Jhdml0YXRpb25hbCBib2R5XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd0Qm9keSB7XG4gICAgY29uc3RydWN0b3IoYXJncykge1xuICAgICAgICBhcmdzID0gYXJncyB8fCB7fTtcblxuICAgICAgICB0aGlzLnggPSBhcmdzLng7XG4gICAgICAgIHRoaXMueSA9IGFyZ3MueTtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnggIT09ICdudW1iZXInIHx8IHR5cGVvZiB0aGlzLnkgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcignQ29ycmVjdCBwb3NpdGlvbnMgd2VyZSBub3QgZ2l2ZW4gZm9yIHRoZSBib2R5LicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy52ZWxYID0gYXJncy52ZWxYIHx8IDA7XG4gICAgICAgIHRoaXMudmVsWSA9IGFyZ3MudmVsWSB8fCAwO1xuXG4gICAgICAgIHRoaXMucmFkaXVzID0gYXJncy5yYWRpdXMgfHwgMTA7XG4gICAgICAgIC8vIEluaXRpYWxpemVkIGJlbG93LlxuICAgICAgICB0aGlzLm1hc3MgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuY29sb3IgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0ID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIHRoaXMudXBkYXRlQ29sb3IoYXJncy5jb2xvciB8fCAnI2RiZDNjOCcpO1xuICAgICAgICB0aGlzLmFkanVzdFNpemUoMCk7XG4gICAgfVxuXG4gICAgYWRqdXN0U2l6ZShkZWx0YSkge1xuICAgICAgICB0aGlzLnJhZGl1cyA9IE1hdGgubWF4KHRoaXMucmFkaXVzICsgZGVsdGEsIDIpO1xuICAgICAgICAvLyBEb3JreSBmb3JtdWxhIHRvIG1ha2UgbWFzcyBzY2FsZSBcInByb3Blcmx5XCIgd2l0aCByYWRpdXMuXG4gICAgICAgIHRoaXMubWFzcyA9IE1hdGgucG93KHRoaXMucmFkaXVzIC8gNCwgMyk7XG4gICAgfVxuXG4gICAgdXBkYXRlQ29sb3IoY29sb3IpIHtcbiAgICAgICAgdGhpcy5jb2xvciA9IGNvbG9yO1xuICAgICAgICB0aGlzLmhpZ2hsaWdodCA9IGNvbG9ycy50b0hleChjb2xvcnMuYnJpZ2h0ZW4oY29sb3JzLmZyb21IZXgodGhpcy5jb2xvciksIC4yNSkpO1xuICAgIH1cblxuICAgIGdldCBzcGVlZCgpIHtcbiAgICAgICAgLy8gVmVsb2NpdGllcyBhcmUgdGlueSwgc28gdXBzY2FsZSBpdCAoYXJiaXRyYXJpbHkpIHRvIG1ha2UgaXQgcmVhZGFibGUuXG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy52ZWxYICogdGhpcy52ZWxYICsgdGhpcy52ZWxZICogdGhpcy52ZWxZKSAqIDFlNjtcbiAgICB9XG59IC8vIGVuZCBncmF2aXRvbi9ib2R5XG4iLCIvKipcbiAqIGdyYXZpdG9uL2V2ZW50cyAtLSBFdmVudCBxdWV1ZWluZyBhbmQgcHJvY2Vzc2luZ1xuICovXG5leHBvcnQgY29uc3QgS0VZQ09ERVMgPSB7XG4gICAgS19MRUZUOiAzNyxcbiAgICBLX1VQOiAzOCxcbiAgICBLX1JJR0hUOiAzOSxcbiAgICBLX0RPV046IDQwLFxuXG4gICAgS18wOiA0OCxcbiAgICBLXzE6IDQ5LFxuICAgIEtfMjogNTAsXG4gICAgS18zOiA1MSxcbiAgICBLXzQ6IDUyLFxuICAgIEtfNTogNTMsXG4gICAgS182OiA1NCxcbiAgICBLXzc6IDU1LFxuICAgIEtfODogNTYsXG4gICAgS185OiA1NyxcblxuICAgIEtfQTogNjUsXG4gICAgS19COiA2NixcbiAgICBLX0M6IDY3LFxuICAgIEtfRDogNjgsXG4gICAgS19FOiA2OSxcbiAgICBLX0Y6IDcwLFxuICAgIEtfRzogNzEsXG4gICAgS19IOiA3MixcbiAgICBLX0k6IDczLFxuICAgIEtfSjogNzQsXG4gICAgS19LOiA3NSxcbiAgICBLX0w6IDc2LFxuICAgIEtfTTogNzcsXG4gICAgS19OOiA3OCxcbiAgICBLX086IDc5LFxuICAgIEtfUDogODAsXG4gICAgS19ROiA4MSxcbiAgICBLX1I6IDgyLFxuICAgIEtfUzogODMsXG4gICAgS19UOiA4NCxcbiAgICBLX1U6IDg1LFxuICAgIEtfVjogODYsXG4gICAgS19XOiA4NyxcbiAgICBLX1g6IDg4LFxuICAgIEtfWTogODksXG4gICAgS19aOiA5MCxcblxuICAgIEtfS1AxOiA5NyxcbiAgICBLX0tQMjogOTgsXG4gICAgS19LUDM6IDk5LFxuICAgIEtfS1A0OiAxMDAsXG4gICAgS19LUDU6IDEwMSxcbiAgICBLX0tQNjogMTAyLFxuICAgIEtfS1A3OiAxMDMsXG4gICAgS19LUDg6IDEwNCxcbiAgICBLX0tQOTogMTA1LFxuXG4gICAgS19RVUVTVElPTk1BUks6IDE5MSxcblxuICAgIEtfQkFDS1NQQUNFOiA4LFxuICAgIEtfVEFCOiA5LFxuICAgIEtfRU5URVI6IDEzLFxuICAgIEtfU0hJRlQ6IDE2LFxuICAgIEtfQ1RSTDogMTcsXG4gICAgS19BTFQ6IDE4LFxuICAgIEtfRVNDOiAyNyxcbiAgICBLX1NQQUNFOiAzMlxufTtcblxuZXhwb3J0IGNvbnN0IE1PVVNFQ09ERVMgPSB7XG4gICAgTV9MRUZUOiAwLFxuICAgIE1fTUlERExFOiAxLFxuICAgIE1fUklHSFQ6IDJcbn07XG5cbmV4cG9ydCBjb25zdCBFVkVOVENPREVTID0ge1xuICAgIE1PVVNFRE9XTjogMTAwMCxcbiAgICBNT1VTRVVQOiAxMDAxLFxuICAgIE1PVVNFTU9WRTogMTAwMixcbiAgICBNT1VTRVdIRUVMOiAxMDAzLFxuICAgIENMSUNLOiAxMDA0LFxuICAgIERCTENMSUNLOiAxMDA1LFxuXG4gICAgS0VZRE9XTjogMTAxMCxcbiAgICBLRVlVUDogMTAxMVxufTtcblxuZXhwb3J0IGNvbnN0IENPTlRST0xDT0RFUyA9IHtcbiAgICBQTEFZQlROOiAyMDAwLFxuICAgIFBBVVNFQlROOiAyMDAxLFxuICAgIFRSQUlMT0ZGQlROOiAyMDAyLFxuICAgIFRSQUlMT05CVE46IDIwMDMsXG4gICAgSEVMUEJUTjogMjAwNFxufTtcblxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdEV2ZW50cyB7XG4gICAgY29uc3RydWN0b3IoYXJncykge1xuICAgICAgICBhcmdzID0gYXJncyB8fCB7fTtcblxuICAgICAgICB0aGlzLnF1ZXVlID0gW107XG5cbiAgICAgICAgaWYgKHR5cGVvZiBhcmdzLmdyaWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcignTm8gdXNhYmxlIGNhbnZhcyBlbGVtZW50IHdhcyBnaXZlbi4nKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmdyaWQgPSBhcmdzLmdyaWQ7XG4gICAgICAgIHRoaXMuY29udHJvbHMgPSBhcmdzLmNvbnRyb2xzO1xuICAgICAgICB0aGlzLnBsYXlCdG4gPSBhcmdzLnBsYXlCdG47XG4gICAgICAgIHRoaXMucGF1c2VCdG4gPSBhcmdzLnBhdXNlQnRuO1xuICAgICAgICB0aGlzLnRyYWlsT2ZmQnRuID0gYXJncy50cmFpbE9mZkJ0bjtcbiAgICAgICAgdGhpcy50cmFpbE9uQnRuID0gYXJncy50cmFpbE9uQnRuO1xuICAgICAgICB0aGlzLmhlbHBCdG4gPSBhcmdzLmhlbHBCdG47XG5cbiAgICAgICAgdGhpcy53aXJldXBFdmVudHMoKTtcbiAgICB9XG5cbiAgICBxYWRkKGV2ZW50KSB7XG4gICAgICAgIHRoaXMucXVldWUucHVzaChldmVudCk7XG4gICAgfVxuXG4gICAgcXBvbGwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnF1ZXVlLnNoaWZ0KCk7XG4gICAgfVxuXG4gICAgcWdldCgpIHtcbiAgICAgICAgLy8gUmVwbGFjaW5nIHRoZSByZWZlcmVuY2UgaXMgZmFzdGVyIHRoYW4gYHNwbGljZSgpYFxuICAgICAgICBsZXQgcmVmID0gdGhpcy5xdWV1ZTtcbiAgICAgICAgdGhpcy5xdWV1ZSA9IFtdO1xuICAgICAgICByZXR1cm4gcmVmO1xuICAgIH1cblxuICAgIHFjbGVhcigpIHtcbiAgICAgICAgdGhpcy5xdWV1ZSA9IFtdO1xuICAgIH1cblxuICAgIHdpcmV1cEV2ZW50cygpIHtcbiAgICAgICAgLy8gR3JpZCBtb3VzZSBldmVudHNcbiAgICAgICAgdGhpcy5ncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDbGljay5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5ncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2RibGNsaWNrJywgdGhpcy5oYW5kbGVEYmxDbGljay5iaW5kKHRoaXMpKTtcblxuICAgICAgICB0aGlzLmdyaWQuYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCB0aGlzLmhhbmRsZUNvbnRleHRNZW51LmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmdyaWQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5oYW5kbGVNb3VzZURvd24uYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5oYW5kbGVNb3VzZVVwLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmdyaWQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5oYW5kbGVNb3VzZU1vdmUuYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuZ3JpZC5hZGRFdmVudExpc3RlbmVyKCd3aGVlbCcsIHRoaXMuaGFuZGxlTW91c2VXaGVlbC5iaW5kKHRoaXMpKTtcblxuICAgICAgICAvLyBHcmlkIGtleSBldmVudHNcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuaGFuZGxlS2V5RG93bi5iaW5kKHRoaXMpKTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLmhhbmRsZUtleVVwLmJpbmQodGhpcykpO1xuXG4gICAgICAgIC8vIENvbnRyb2wgZXZlbnRzXG4gICAgICAgIHRoaXMucGxheUJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ29udHJvbENsaWNrLmJpbmQodGhpcyxcbiAgICAgICAgICAgICAgICAgICAgQ09OVFJPTENPREVTLlBMQVlCVE4pKTtcbiAgICAgICAgdGhpcy5wYXVzZUJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ29udHJvbENsaWNrLmJpbmQodGhpcyxcbiAgICAgICAgICAgICAgICAgICAgQ09OVFJPTENPREVTLlBBVVNFQlROKSk7XG4gICAgICAgIHRoaXMudHJhaWxPZmZCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNvbnRyb2xDbGljay5iaW5kKHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIENPTlRST0xDT0RFUy5UUkFJTE9GRkJUTikpO1xuICAgICAgICB0aGlzLnRyYWlsT25CdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNvbnRyb2xDbGljay5iaW5kKHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIENPTlRST0xDT0RFUy5UUkFJTE9OQlROKSk7XG4gICAgICAgIHRoaXMuaGVscEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ29udHJvbENsaWNrLmJpbmQodGhpcyxcbiAgICAgICAgICAgICAgICAgICAgQ09OVFJPTENPREVTLkhFTFBCVE4pKTtcbiAgICB9XG5cbiAgICBoYW5kbGVDbGljayhldmVudCkge1xuICAgICAgICB0aGlzLnFhZGQoe1xuICAgICAgICAgICAgdHlwZTogRVZFTlRDT0RFUy5DTElDSyxcbiAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmdldFBvc2l0aW9uKGV2ZW50KSxcbiAgICAgICAgICAgIGJ1dHRvbjogZXZlbnQuYnV0dG9uLFxuICAgICAgICAgICAgc2hpZnQ6IGV2ZW50LnNoaWZ0S2V5LFxuICAgICAgICAgICAgY3RybDogZXZlbnQuY3RybEtleSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogZXZlbnQudGltZVN0YW1wXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGhhbmRsZURibENsaWNrKGV2ZW50KSB7XG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiBFVkVOVENPREVTLkRCTENMSUNLLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuZ2V0UG9zaXRpb24oZXZlbnQpLFxuICAgICAgICAgICAgYnV0dG9uOiBldmVudC5idXR0b24sXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlQ29udGV4dE1lbnUoZXZlbnQpIHtcbiAgICAgICAgLy8gUHJldmVudCByaWdodC1jbGljayBtZW51XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuXG4gICAgaGFuZGxlTW91c2VEb3duKGV2ZW50KSB7XG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiBFVkVOVENPREVTLk1PVVNFRE9XTixcbiAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmdldFBvc2l0aW9uKGV2ZW50KSxcbiAgICAgICAgICAgIGJ1dHRvbjogZXZlbnQuYnV0dG9uLFxuICAgICAgICAgICAgc2hpZnQ6IGV2ZW50LnNoaWZ0S2V5LFxuICAgICAgICAgICAgY3RybDogZXZlbnQuY3RybEtleSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogZXZlbnQudGltZVN0YW1wXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGhhbmRsZU1vdXNlVXAoZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuTU9VU0VVUCxcbiAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmdldFBvc2l0aW9uKGV2ZW50KSxcbiAgICAgICAgICAgIGJ1dHRvbjogZXZlbnQuYnV0dG9uLFxuICAgICAgICAgICAgc2hpZnQ6IGV2ZW50LnNoaWZ0S2V5LFxuICAgICAgICAgICAgY3RybDogZXZlbnQuY3RybEtleSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogZXZlbnQudGltZVN0YW1wXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGhhbmRsZU1vdXNlTW92ZShldmVudCkge1xuICAgICAgICB0aGlzLnFhZGQoe1xuICAgICAgICAgICAgdHlwZTogRVZFTlRDT0RFUy5NT1VTRU1PVkUsXG4gICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5nZXRQb3NpdGlvbihldmVudCksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBoYW5kbGVNb3VzZVdoZWVsKGV2ZW50KSB7XG4gICAgICAgIC8vIFJldmVyc2UgdGhlIHVwL2Rvd24uXG4gICAgICAgIGxldCBkZWx0YSA9IC1ldmVudC5kZWx0YVkgLyA1MDtcblxuICAgICAgICB0aGlzLnFhZGQoe1xuICAgICAgICAgICAgdHlwZTogRVZFTlRDT0RFUy5NT1VTRVdIRUVMLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuZ2V0UG9zaXRpb24oZXZlbnQpLFxuICAgICAgICAgICAgZGVsdGE6IGRlbHRhLFxuICAgICAgICAgICAgc2hpZnQ6IGV2ZW50LnNoaWZ0S2V5LFxuICAgICAgICAgICAgY3RybDogZXZlbnQuY3RybEtleSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogZXZlbnQudGltZVN0YW1wXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFByZXZlbnQgdGhlIHdpbmRvdyBmcm9tIHNjcm9sbGluZ1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cblxuICAgIGhhbmRsZUtleURvd24oZXZlbnQpIHtcbiAgICAgICAgLy8gQWNjb3VudCBmb3IgYnJvd3NlciBkaXNjcmVwYW5jaWVzXG4gICAgICAgIGxldCBrZXkgPSBldmVudC5rZXlDb2RlIHx8IGV2ZW50LndoaWNoO1xuXG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiBFVkVOVENPREVTLktFWURPV04sXG4gICAgICAgICAgICBrZXljb2RlOiBrZXksXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlS2V5VXAoZXZlbnQpIHtcbiAgICAgICAgLy8gQWNjb3VudCBmb3IgYnJvd3NlciBkaXNjcmVwYW5jaWVzXG4gICAgICAgIGxldCBrZXkgPSBldmVudC5rZXlDb2RlIHx8IGV2ZW50LndoaWNoO1xuXG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiBFVkVOVENPREVTLktFWVVQLFxuICAgICAgICAgICAga2V5Y29kZToga2V5LFxuICAgICAgICAgICAgc2hpZnQ6IGV2ZW50LnNoaWZ0S2V5LFxuICAgICAgICAgICAgY3RybDogZXZlbnQuY3RybEtleSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogZXZlbnQudGltZVN0YW1wXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGhhbmRsZUNvbnRyb2xDbGljayh0eXBlLCBldmVudCkge1xuICAgICAgICB0aGlzLnFhZGQoe1xuICAgICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogZXZlbnQudGltZVN0YW1wXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGdldFBvc2l0aW9uKGV2ZW50KSB7XG4gICAgICAgIC8vIENhbGN1bGF0ZSBvZmZzZXQgb24gdGhlIGdyaWQgZnJvbSBjbGllbnRYL1ksIGJlY2F1c2VcbiAgICAgICAgLy8gc29tZSBicm93c2VycyBkb24ndCBoYXZlIGV2ZW50Lm9mZnNldFgvWVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogZXZlbnQuY2xpZW50WCAtIHRoaXMuZ3JpZC5vZmZzZXRMZWZ0LFxuICAgICAgICAgICAgeTogZXZlbnQuY2xpZW50WSAtIHRoaXMuZ3JpZC5vZmZzZXRUb3BcbiAgICAgICAgfTtcbiAgICB9XG59IC8vIGVuZCBncmF2aXRvbi9ldmVudHNcbiIsIi8qKlxuICogZ3Jhdml0b24vZ2Z4IC0tIFRoZSBncmFwaGljcyBvYmplY3RcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR3RHZngge1xuICAgIGNvbnN0cnVjdG9yKGFyZ3MpIHtcbiAgICAgICAgYXJncyA9IGFyZ3MgfHwge307XG5cbiAgICAgICAgdGhpcy5ncmlkID0gdHlwZW9mIGFyZ3MuZ3JpZCA9PT0gJ3N0cmluZycgP1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYXJncy5ncmlkKSA6XG4gICAgICAgICAgICBhcmdzLmdyaWQ7XG5cbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmdyaWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcignTm8gdXNhYmxlIGNhbnZhcyBlbGVtZW50IHdhcyBnaXZlbi4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY3R4ID0gdGhpcy5ncmlkLmdldENvbnRleHQoJzJkJyk7XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIC8vIFNldHRpbmcgdGhlIHdpZHRoIGhhcyB0aGUgc2lkZSBlZmZlY3RcbiAgICAgICAgLy8gb2YgY2xlYXJpbmcgdGhlIGNhbnZhc1xuICAgICAgICB0aGlzLmdyaWQud2lkdGggPSB0aGlzLmdyaWQud2lkdGg7XG4gICAgfVxuXG4gICAgZHJhd0JvZGllcyhib2RpZXMsIHRhcmdldEJvZHkpIHtcbiAgICAgICAgZm9yIChsZXQgYm9keSBvZiBib2RpZXMpIHtcbiAgICAgICAgICAgIHRoaXMuZHJhd0JvZHkoYm9keSwgLyogaXNUYXJnZXRlZCAqLyBib2R5ID09PSB0YXJnZXRCb2R5KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRyYXdCb2R5KGJvZHksIGlzVGFyZ2V0ZWQpIHtcbiAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gYm9keS5jb2xvcjtcblxuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5jdHguYXJjKGJvZHkueCwgYm9keS55LCBib2R5LnJhZGl1cywgMCwgTWF0aC5QSSAqIDIsIHRydWUpO1xuXG4gICAgICAgIHRoaXMuY3R4LmZpbGwoKTtcbiAgICAgICAgaWYgKGlzVGFyZ2V0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gYm9keS5oaWdobGlnaHQ7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSBNYXRoLnJvdW5kKGJvZHkucmFkaXVzIC8gOCk7XG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRyYXdSZXRpY2xlTGluZShmcm9tLCB0bykge1xuICAgICAgICBsZXQgZ3JhZCA9IHRoaXMuY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KGZyb20ueCwgZnJvbS55LCB0by54LCB0by55KTtcbiAgICAgICAgZ3JhZC5hZGRDb2xvclN0b3AoMCwgJ3JnYmEoMzEsIDc1LCAxMzAsIDEpJyk7XG4gICAgICAgIGdyYWQuYWRkQ29sb3JTdG9wKDEsICdyZ2JhKDMxLCA3NSwgMTMwLCAwLjEpJyk7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gZ3JhZDtcbiAgICAgICAgdGhpcy5jdHgubGluZVdpZHRoID0gNjtcbiAgICAgICAgdGhpcy5jdHgubGluZUNhcCA9ICdyb3VuZCc7XG5cbiAgICAgICAgLy8gRHJhdyBpbml0aWFsIGJhY2tncm91bmQgbGluZS5cbiAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuY3R4Lm1vdmVUbyhmcm9tLngsIGZyb20ueSk7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0by54LCB0by55KTtcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XG5cbiAgICAgICAgLy8gRHJhdyBvdmVybGF5IGxpbmUuXG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gJyMzNDc3Q0EnO1xuICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSAyO1xuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5jdHgubW92ZVRvKGZyb20ueCwgZnJvbS55KTtcbiAgICAgICAgdGhpcy5jdHgubGluZVRvKHRvLngsIHRvLnkpO1xuICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcbiAgICB9XG59IC8vIGVuZCBncmF2aXRvbi9nZnhcbiIsIi8qKlxuICogZ3Jhdml0b24vc2ltIC0tIFRoZSBncmF2aXRhdGlvbmFsIHNpbXVsYXRvclxuICovXG5pbXBvcnQgbG9nIGZyb20gJy4uL3V0aWwvbG9nJztcbmltcG9ydCBHdEJvZHkgZnJvbSAnLi9ib2R5JztcbmltcG9ydCBHdFRyZWUgZnJvbSAnLi90cmVlJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR3RTaW0ge1xuICAgIGNvbnN0cnVjdG9yKGFyZ3MpIHtcbiAgICAgICAgYXJncyA9IGFyZ3MgfHwge307XG5cbiAgICAgICAgdGhpcy5vcHRpb25zID0ge307XG4gICAgICAgIHRoaXMuYm9kaWVzID0gW107XG4gICAgICAgIHRoaXMudHJlZSA9IG5ldyBHdFRyZWUoYXJncy53aWR0aCwgYXJncy5oZWlnaHQpO1xuICAgICAgICB0aGlzLnRpbWUgPSAwO1xuXG4gICAgICAgIC8vIFRlbXBvcmFyeSB3b3Jrc3BhY2VcbiAgICAgICAgdGhpcy5EID0ge307XG5cbiAgICAgICAgdGhpcy5vcHRpb25zLkcgPSBhcmdzLkcgfHwgNi42NzM4NCAqIE1hdGgucG93KDEwLCAtMTEpOyAvLyBHcmF2aXRhdGlvbmFsIGNvbnN0YW50XG4gICAgICAgIHRoaXMub3B0aW9ucy5tdWx0aXBsaWVyID0gYXJncy5tdWx0aXBsaWVyIHx8IDE1MDA7IC8vIFRpbWVzdGVwXG4gICAgICAgIHRoaXMub3B0aW9ucy5jb2xsaXNpb25zID0gYXJncy5jb2xsaXNpb24gfHwgdHJ1ZTtcbiAgICAgICAgdGhpcy5vcHRpb25zLnNjYXR0ZXJMaW1pdCA9IGFyZ3Muc2NhdHRlckxpbWl0IHx8IDEwMDAwO1xuICAgIH1cblxuICAgIHN0ZXAoZWxhcHNlZCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuYm9kaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gdGhpcy5ib2RpZXNbaV07XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmNvbGxpc2lvbnMgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBJcyB0aGlzIHVzZWZ1bD9cbiAgICAgICAgICAgICAgICB0aGlzLmRldGVjdENvbGxpc2lvbihib2R5LCBpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5jYWxjdWxhdGVOZXdQb3NpdGlvbihib2R5LCBpLCBlbGFwc2VkICogdGhpcy5vcHRpb25zLm11bHRpcGxpZXIpO1xuXG4gICAgICAgICAgICBpID0gdGhpcy5yZW1vdmVTY2F0dGVyZWQoYm9keSwgaSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnRpbWUgKz0gZWxhcHNlZDsgLy8gSW5jcmVtZW50IHJ1bnRpbWVcbiAgICB9XG5cbiAgICBjYWxjdWxhdGVOZXdQb3NpdGlvbihib2R5LCBpbmRleCwgZGVsdGFUKSB7XG4gICAgICAgIGxldCBuZXRGeCA9IDA7XG4gICAgICAgIGxldCBuZXRGeSA9IDA7XG5cbiAgICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGFsbCBib2RpZXMgYW5kIHN1bSB0aGUgZm9yY2VzIGV4ZXJ0ZWRcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmJvZGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgYXR0cmFjdG9yID0gdGhpcy5ib2RpZXNbaV07XG4gICAgICAgICAgICBpZiAoaSAhPT0gaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAvLyBHZXQgdGhlIGRpc3RhbmNlIGFuZCBwb3NpdGlvbiBkZWx0YXNcbiAgICAgICAgICAgICAgICB0aGlzLmNhbGN1bGF0ZURpc3RhbmNlKGJvZHksIGF0dHJhY3Rvcik7XG5cbiAgICAgICAgICAgICAgICAvLyBDYWxjdWxhdGUgZm9yY2UgdXNpbmcgTmV3dG9uaWFuIGdyYXZpdHksIHNlcGFyYXRlIG91dCBpbnRvIHggYW5kIHkgY29tcG9uZW50c1xuICAgICAgICAgICAgICAgIGxldCBGID0gKHRoaXMub3B0aW9ucy5HICogYm9keS5tYXNzICogYXR0cmFjdG9yLm1hc3MpIC8gTWF0aC5wb3codGhpcy5ELnIsIDIpO1xuICAgICAgICAgICAgICAgIGxldCBGeCA9IEYgKiAodGhpcy5ELmR4IC8gdGhpcy5ELnIpO1xuICAgICAgICAgICAgICAgIGxldCBGeSA9IEYgKiAodGhpcy5ELmR5IC8gdGhpcy5ELnIpO1xuXG4gICAgICAgICAgICAgICAgbmV0RnggKz0gRng7XG4gICAgICAgICAgICAgICAgbmV0RnkgKz0gRnk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYWxjdWxhdGUgYWNjZWxlcmF0aW9uc1xuICAgICAgICBsZXQgYXggPSBuZXRGeCAvIGJvZHkubWFzcztcbiAgICAgICAgbGV0IGF5ID0gbmV0RnkgLyBib2R5Lm1hc3M7XG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIG5ldyB2ZWxvY2l0aWVzLCBub3JtYWxpemVkIGJ5IHRoZSAndGltZScgaW50ZXJ2YWxcbiAgICAgICAgYm9keS52ZWxYICs9IGRlbHRhVCAqIGF4O1xuICAgICAgICBib2R5LnZlbFkgKz0gZGVsdGFUICogYXk7XG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIG5ldyBwb3NpdGlvbnMgYWZ0ZXIgdGltZXN0ZXAgZGVsdGFUXG4gICAgICAgIGJvZHkueCArPSBkZWx0YVQgKiBib2R5LnZlbFg7XG4gICAgICAgIGJvZHkueSArPSBkZWx0YVQgKiBib2R5LnZlbFk7XG4gICAgfVxuXG4gICAgY2FsY3VsYXRlRGlzdGFuY2UoYm9keSwgb3RoZXIpIHtcbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBjaGFuZ2UgaW4gcG9zaXRpb24gYWxvbmcgdGhlIHR3byBkaW1lbnNpb25zXG4gICAgICAgIHRoaXMuRC5keCA9IG90aGVyLnggLSBib2R5Lng7XG4gICAgICAgIHRoaXMuRC5keSA9IG90aGVyLnkgLSBib2R5Lnk7XG5cbiAgICAgICAgLy8gT2J0YWluIHRoZSBkaXN0YW5jZSBiZXR3ZWVuIHRoZSBvYmplY3RzIChoeXBvdGVudXNlKVxuICAgICAgICB0aGlzLkQuciA9IE1hdGguc3FydChNYXRoLnBvdyh0aGlzLkQuZHgsIDIpICsgTWF0aC5wb3codGhpcy5ELmR5LCAyKSk7XG4gICAgfVxuXG4gICAgZGV0ZWN0Q29sbGlzaW9uKGJvZHksIGluZGV4KSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5ib2RpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxpZGVyID0gdGhpcy5ib2RpZXNbaV07XG4gICAgICAgICAgICBpZiAoaSAhPT0gaW5kZXgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNhbGN1bGF0ZURpc3RhbmNlKGJvZHksIGNvbGxpZGVyKTtcbiAgICAgICAgICAgICAgICBsZXQgY2xlYXJhbmNlID0gYm9keS5yYWRpdXMgKyBjb2xsaWRlci5yYWRpdXM7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ELnIgPD0gY2xlYXJhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIENvbGxpc2lvbiBkZXRlY3RlZFxuICAgICAgICAgICAgICAgICAgICBsb2cud3JpdGUoJ0NvbGxpc2lvbiBkZXRlY3RlZCEhJywgJ2RlYnVnJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVtb3ZlU2NhdHRlcmVkKGJvZHksIGluZGV4KSB7XG4gICAgICAgIGlmIChib2R5LnggPiB0aGlzLm9wdGlvbnMuc2NhdHRlckxpbWl0IHx8XG4gICAgICAgICAgICBib2R5LnggPCAtdGhpcy5vcHRpb25zLnNjYXR0ZXJMaW1pdCB8fFxuICAgICAgICAgICAgYm9keS55ID4gdGhpcy5vcHRpb25zLnNjYXR0ZXJMaW1pdCB8fFxuICAgICAgICAgICAgYm9keS55IDwgLXRoaXMub3B0aW9ucy5zY2F0dGVyTGltaXQpIHtcbiAgICAgICAgICAgIC8vIFJlbW92ZSBmcm9tIGJvZHkgY29sbGVjdGlvblxuICAgICAgICAgICAgLy8gVE9ETzogSW1wbGVtZW50IGZvciB0cmVlLlxuICAgICAgICAgICAgdGhpcy5ib2RpZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIHJldHVybiBpbmRleCAtIDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH1cblxuICAgIGFkZE5ld0JvZHkoYXJncykge1xuICAgICAgICBsZXQgYm9keSA9IG5ldyBHdEJvZHkoYXJncyk7XG4gICAgICAgIHRoaXMuYm9kaWVzLnB1c2goYm9keSk7XG4gICAgICAgIHRoaXMudHJlZS5hZGRCb2R5KGJvZHkpO1xuXG4gICAgICAgIHJldHVybiBib2R5O1xuICAgIH1cblxuICAgIHJlbW92ZUJvZHkodGFyZ2V0Qm9keSkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuYm9kaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gdGhpcy5ib2RpZXNbaV07XG4gICAgICAgICAgICBpZiAoYm9keSA9PT0gdGFyZ2V0Qm9keSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYm9kaWVzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlc2V0VHJlZSgpO1xuICAgIH1cblxuICAgIGdldEJvZHlBdCh4LCB5KSB7XG4gICAgICAgIGZvciAobGV0IGkgPSB0aGlzLmJvZGllcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IHRoaXMuYm9kaWVzW2ldO1xuICAgICAgICAgICAgY29uc3QgaXNNYXRjaCA9IE1hdGguYWJzKHggLSBib2R5LngpIDw9IGJvZHkucmFkaXVzICYmXG4gICAgICAgICAgICAgICAgTWF0aC5hYnMoeSAtIGJvZHkueSkgPD0gYm9keS5yYWRpdXM7XG4gICAgICAgICAgICBpZiAoaXNNYXRjaCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBib2R5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuYm9kaWVzLmxlbmd0aCA9IDA7IC8vIFJlbW92ZSBhbGwgYm9kaWVzIGZyb20gY29sbGVjdGlvblxuICAgICAgICB0aGlzLnJlc2V0VHJlZSgpO1xuICAgIH1cblxuICAgIHJlc2V0VHJlZSgpIHtcbiAgICAgICAgdGhpcy50cmVlLmNsZWFyKCk7XG4gICAgICAgIGZvciAoY29uc3QgYm9keSBvZiB0aGlzLmJvZGllcykge1xuICAgICAgICAgICAgdGhpcy50cmVlLmFkZEJvZHkoYm9keSk7XG4gICAgICAgIH1cbiAgICB9XG59IC8vIGVuZCBncmF2aXRvbi9zaW1cbiIsIi8qKlxuICogZ3Jhdml0b24vdGltZXIgLS0gU2ltIHRpbWVyIGFuZCBGUFMgbGltaXRlclxuICovXG5pbXBvcnQgZW52IGZyb20gJy4uL3V0aWwvZW52JztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR3RUaW1lciB7XG4gICAgY29uc3RydWN0b3IoZm4sIGZwcz1udWxsKSB7XG4gICAgICAgIHRoaXMuX2ZuID0gZm47XG4gICAgICAgIHRoaXMuX2ZwcyA9IGZwcztcbiAgICAgICAgdGhpcy5faXNBY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5faXNBbmltYXRpb24gPSBmcHMgPT09IG51bGw7XG4gICAgICAgIHRoaXMuX2NhbmNlbGxhdGlvbklkID0gbnVsbDtcblxuICAgICAgICB0aGlzLl93aW5kb3cgPSBlbnYuZ2V0V2luZG93KCk7XG4gICAgfVxuXG4gICAgZ2V0IGFjdGl2ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzQWN0aXZlO1xuICAgIH1cblxuICAgIHN0YXJ0KCkge1xuICAgICAgICBpZiAoIXRoaXMuX2lzQWN0aXZlKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5faXNBbmltYXRpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9iZWdpbkFuaW1hdGlvbigpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9iZWdpbkludGVydmFsKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9pc0FjdGl2ZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdG9wKCkge1xuICAgICAgICBpZiAodGhpcy5faXNBY3RpdmUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9pc0FuaW1hdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuX3dpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLl9jYW5jZWxsYXRpb25JZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3dpbmRvdy5jbGVhckludGVydmFsKHRoaXMuX2NhbmNlbGxhdGlvbklkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2lzQWN0aXZlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0b2dnbGUoKSB7XG4gICAgICAgIGlmICh0aGlzLl9pc0FjdGl2ZSkge1xuICAgICAgICAgICAgdGhpcy5zdG9wKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfYmVnaW5BbmltYXRpb24oKSB7XG4gICAgICAgIGxldCBsYXN0VGltZXN0YW1wID0gdGhpcy5fd2luZG93LnBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICBsZXQgYW5pbWF0b3IgPSAodGltZXN0YW1wKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9jYW5jZWxsYXRpb25JZCA9IHRoaXMuX3dpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0b3IpO1xuICAgICAgICAgICAgdGhpcy5fZm4odGltZXN0YW1wIC0gbGFzdFRpbWVzdGFtcCk7XG4gICAgICAgICAgICBsYXN0VGltZXN0YW1wID0gdGltZXN0YW1wO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIERlbGF5IGluaXRpYWwgZXhlY3V0aW9uIHVudGlsIHRoZSBuZXh0IHRpY2suXG4gICAgICAgIHRoaXMuX2NhbmNlbGxhdGlvbklkID0gdGhpcy5fd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRvcik7XG4gICAgfVxuXG4gICAgX2JlZ2luSW50ZXJ2YWwoKSB7XG4gICAgICAgIC8vIENvbXB1dGUgdGhlIGRlbGF5IHBlciB0aWNrLCBpbiBtaWxsaXNlY29uZHMuXG4gICAgICAgIGxldCB0aW1lb3V0ID0gMTAwMCAvIHRoaXMuX2ZwcyB8IDA7XG5cbiAgICAgICAgbGV0IGxhc3RUaW1lc3RhbXAgPSB0aGlzLl93aW5kb3cucGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgIHRoaXMuX2NhbmNlbGxhdGlvbklkID0gdGhpcy5fd2luZG93LnNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgIGxldCB0aW1lc3RhbXAgPSB0aGlzLl93aW5kb3cucGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgICAgICB0aGlzLl9mbih0aW1lc3RhbXAgLSBsYXN0VGltZXN0YW1wKTtcbiAgICAgICAgICAgIGxhc3RUaW1lc3RhbXAgPSB0aW1lc3RhbXA7XG4gICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICB9XG59IC8vIGVuZCBncmF2aXRvbi90aW1lclxuIiwiLyoqXG4gKiBncmF2aXRvbi90cmVlIC0tIFRoZSBncmF2aXRhdGlvbmFsIGJvZHkgdHJlZSBzdHJ1Y3R1cmVcbiAqL1xuY2xhc3MgR3RUcmVlTm9kZSB7XG4gICAgY29uc3RydWN0b3Ioc3RhcnRYLCBzdGFydFksIHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgdGhpcy5zdGFydFggPSBzdGFydFg7XG4gICAgICAgIHRoaXMuc3RhcnRZID0gc3RhcnRZO1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICB0aGlzLmhhbGZXaWR0aCA9IHdpZHRoIC8gMjtcbiAgICAgICAgdGhpcy5oYWxmSGVpZ2h0ID0gaGVpZ2h0IC8gMjtcblxuICAgICAgICB0aGlzLm1pZFggPSB0aGlzLnN0YXJ0WCArIHRoaXMuaGFsZldpZHRoO1xuICAgICAgICB0aGlzLm1pZFkgPSB0aGlzLnN0YXJ0WSArIHRoaXMuaGFsZkhlaWdodDtcblxuICAgICAgICB0aGlzLm1hc3MgPSAwO1xuICAgICAgICB0aGlzLnggPSAwO1xuICAgICAgICB0aGlzLnkgPSAwO1xuXG4gICAgICAgIC8vIFtOVywgTkUsIFNXLCBTRV1cbiAgICAgICAgdGhpcy5jaGlsZHJlbiA9IG5ldyBBcnJheSg0KTtcbiAgICB9XG5cbiAgICBhZGRCb2R5KGJvZHkpIHtcbiAgICAgICAgdGhpcy51cGRhdGVNYXNzKGJvZHkpO1xuICAgICAgICBjb25zdCBxdWFkcmFudCA9IHRoaXMuZ2V0UXVhZHJhbnQoYm9keS54LCBib2R5LnkpO1xuXG4gICAgICAgIGlmICghdGhpcy5jaGlsZHJlbltxdWFkcmFudF0pIHtcbiAgICAgICAgICAgIHRoaXMuY2hpbGRyZW5bcXVhZHJhbnRdID0gYm9keTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5jaGlsZHJlbltxdWFkcmFudF07XG4gICAgICAgICAgICBjb25zdCBxdWFkWCA9IGV4aXN0aW5nLnggPiB0aGlzLm1pZFggPyB0aGlzLm1pZFggOiB0aGlzLnN0YXJ0WDtcbiAgICAgICAgICAgIGNvbnN0IHF1YWRZID0gZXhpc3RpbmcueSA+IHRoaXMubWlkWSA/IHRoaXMubWlkWSA6IHRoaXMuc3RhcnRZO1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG5ldyBHdFRyZWVOb2RlKHF1YWRYLCBxdWFkWSwgdGhpcy5oYWxmV2lkdGgsIHRoaXMuaGFsZkhlaWdodCk7XG5cbiAgICAgICAgICAgIG5vZGUuYWRkQm9keShleGlzdGluZyk7XG4gICAgICAgICAgICBub2RlLmFkZEJvZHkoYm9keSk7XG5cbiAgICAgICAgICAgIHRoaXMuY2hpbGRyZW5bcXVhZHJhbnRdID0gbm9kZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZU1hc3MoYm9keSkge1xuICAgICAgICBjb25zdCBuZXdNYXNzID0gdGhpcy5tYXNzICsgYm9keS5tYXNzO1xuICAgICAgICBjb25zdCBuZXdYID0gKHRoaXMueCAqIHRoaXMubWFzcyArIGJvZHkueCAqIGJvZHkubWFzcykgLyBuZXdNYXNzO1xuICAgICAgICBjb25zdCBuZXdZID0gKHRoaXMueSAqIHRoaXMubWFzcyArIGJvZHkueSAqIGJvZHkubWFzcykgLyBuZXdNYXNzO1xuICAgICAgICB0aGlzLm1hc3MgPSBuZXdNYXNzO1xuICAgICAgICB0aGlzLnggPSBuZXdYO1xuICAgICAgICB0aGlzLnkgPSBuZXdZO1xuICAgIH1cblxuICAgIGdldFF1YWRyYW50KHgsIHkpIHtcbiAgICAgICAgY29uc3QgeEluZGV4ID0gTnVtYmVyKHggPiB0aGlzLm1pZFgpO1xuICAgICAgICBjb25zdCB5SW5kZXggPSBOdW1iZXIoeSA+IHRoaXMubWlkWSkgKiAyO1xuICAgICAgICByZXR1cm4geEluZGV4ICsgeUluZGV4O1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR3RUcmVlIHtcbiAgICBjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIHRoaXMucm9vdCA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBhZGRCb2R5KGJvZHkpIHtcbiAgICAgICAgaWYgKHRoaXMucm9vdCBpbnN0YW5jZW9mIEd0VHJlZU5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMucm9vdC5hZGRCb2R5KGJvZHkpO1xuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLnJvb3QpIHtcbiAgICAgICAgICAgIHRoaXMucm9vdCA9IGJvZHk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMucm9vdDtcbiAgICAgICAgICAgIHRoaXMucm9vdCA9IG5ldyBHdFRyZWVOb2RlKDAsIDAsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgICAgICAgICAgIHRoaXMucm9vdC5hZGRCb2R5KGV4aXN0aW5nKTtcbiAgICAgICAgICAgIHRoaXMucm9vdC5hZGRCb2R5KGJvZHkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMucm9vdCA9IHVuZGVmaW5lZDtcbiAgICB9XG59IC8vIGVuZCBncmF2aXRvbi90cmVlXG4iLCJpbXBvcnQgJy4vdmVuZG9yL2pzY29sb3InO1xuaW1wb3J0IHZleCBmcm9tICcuL3ZlbmRvci92ZXgnO1xuaW1wb3J0ICcuL3BvbHlmaWxscyc7XG5pbXBvcnQgZ3QgZnJvbSAnLi9ncmF2aXRvbic7XG5cbndpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBTZXQgb3B0aW9ucyBmb3IgZGVwZW5kZW5jaWVzLlxuICAgIHZleC5kZWZhdWx0T3B0aW9ucy5jbGFzc05hbWUgPSAndmV4LXRoZW1lLXdpcmVmcmFtZSc7XG5cbiAgICAvLyBTdGFydCB0aGUgbWFpbiBncmF2aXRvbiBhcHAuXG4gICAgd2luZG93LmdyYXZpdG9uID0gbmV3IGd0LmFwcCgpO1xufTtcbiIsIndpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgIHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gd2luZG93LnNldFRpbWVvdXQoY2FsbGJhY2ssIDEwMDAgLyA2MCk7XG4gICAgfTtcblxud2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgd2luZG93Lm1vekNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgZnVuY3Rpb24odGltZW91dElkKSB7XG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICB9O1xuXG53aW5kb3cucGVyZm9ybWFuY2UgPSB3aW5kb3cucGVyZm9ybWFuY2UgfHwge307XG53aW5kb3cucGVyZm9ybWFuY2Uubm93ID0gd2luZG93LnBlcmZvcm1hbmNlLm5vdyB8fFxuICAgIHdpbmRvdy5wZXJmb3JtYW5jZS53ZWJraXROb3cgfHxcbiAgICB3aW5kb3cucGVyZm9ybWFuY2UubW96Tm93IHx8XG4gICAgRGF0ZS5ub3c7XG4iLCIvKipcbiAqIGNvbG9ycyAtLSBDb2xvciBtYW5pcHVsYXRpb24gaGVscGVyc1xuICovXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgYnJpZ2h0ZW4oY29sb3JBcnJheSwgcGVyY2VudCkge1xuICAgICAgICBsZXQgW3IsIGcsIGJdID0gY29sb3JBcnJheTtcbiAgICAgICAgciA9IE1hdGgucm91bmQoTWF0aC5taW4oTWF0aC5tYXgoMCwgciArIChyICogcGVyY2VudCkpLCAyNTUpKTtcbiAgICAgICAgZyA9IE1hdGgucm91bmQoTWF0aC5taW4oTWF0aC5tYXgoMCwgZyArIChnICogcGVyY2VudCkpLCAyNTUpKTtcbiAgICAgICAgYiA9IE1hdGgucm91bmQoTWF0aC5taW4oTWF0aC5tYXgoMCwgYiArIChiICogcGVyY2VudCkpLCAyNTUpKTtcbiAgICAgICAgcmV0dXJuIFtyLCBnLCBiXTtcbiAgICB9LFxuXG4gICAgZnJvbUhleChoZXgpIHtcbiAgICAgICAgbGV0IGggPSBoZXgucmVwbGFjZSgnIycsICcnKTtcbiAgICAgICAgaWYgKGgubGVuZ3RoIDwgNikge1xuICAgICAgICAgICAgaCA9IGgucmVwbGFjZSgvKC4pL2csICckMSQxJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFtwYXJzZUludChoLnN1YnN0cigwLCAyKSwgMTYpLFxuICAgICAgICAgICAgICAgIHBhcnNlSW50KGguc3Vic3RyKDIsIDIpLCAxNiksXG4gICAgICAgICAgICAgICAgcGFyc2VJbnQoaC5zdWJzdHIoNCwgMiksIDE2KV07XG4gICAgfSxcblxuICAgIHRvSGV4KGNvbG9yQXJyYXkpIHtcbiAgICAgICAgY29uc3QgW3IsIGcsIGJdID0gY29sb3JBcnJheTtcbiAgICAgICAgcmV0dXJuICcjJyArICgnMCcgKyByLnRvU3RyaW5nKDE2KSkuc3Vic3RyKHIgPCAxNiA/IDAgOiAxKSArXG4gICAgICAgICAgICAgICAgICAgICAoJzAnICsgZy50b1N0cmluZygxNikpLnN1YnN0cihnIDwgMTYgPyAwIDogMSkgK1xuICAgICAgICAgICAgICAgICAgICAgKCcwJyArIGIudG9TdHJpbmcoMTYpKS5zdWJzdHIoYiA8IDE2ID8gMCA6IDEpO1xuICAgIH1cbn07XG4iLCIvKipcbiAqIGVudiAtIEVudmlyb25tZW50IHJldHJpZXZhbCBtZXRob2RzLlxuICovXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgZ2V0V2luZG93KCkge1xuICAgICAgICByZXR1cm4gd2luZG93O1xuICAgIH1cbn07XG4iLCIvKipcbiAqIGxvZyAtLSBMb2dnaW5nIGZ1bmN0aW9uc1xuICovXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgY29uZmlnOiB7XG4gICAgICAgIGxvZ0xldmVsOiBudWxsXG4gICAgfSxcblxuICAgIHdyaXRlKG1lc3NhZ2UsIGxldmVsKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGxldCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgbGV0IHN0YW1wID0gbm93LmdldEZ1bGxZZWFyKCkgKyAnLScgKyBub3cuZ2V0TW9udGgoKSArICctJyArIG5vdy5nZXREYXRlKCkgKyAnVCcgK1xuICAgICAgICAgICAgICAgIG5vdy5nZXRIb3VycygpICsgJzonICsgbm93LmdldE1pbnV0ZXMoKSArICc6JyArIG5vdy5nZXRTZWNvbmRzKCkgKyAnOicgKyBub3cuZ2V0TWlsbGlzZWNvbmRzKCk7XG5cbiAgICAgICAgICAgIG1lc3NhZ2UgPSBzdGFtcCArICcgJyArIG1lc3NhZ2U7XG5cbiAgICAgICAgICAgIGxldmVsID0gKGxldmVsIHx8IHRoaXMuY29uZmlnLmxvZ0xldmVsIHx8ICdkZWJ1ZycpLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICAgIC8vIFdyaXRlIHRvIGNvbnNvbGUgLS0gY3VycmVudGx5LCBgbG9nYCwgYGRlYnVnYCwgYGluZm9gLCBgd2FybmAsIGFuZCBgZXJyb3JgXG4gICAgICAgICAgICAvLyBhcmUgYXZhaWxhYmxlXG4gICAgICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zb2xlICovXG4gICAgICAgICAgICBpZiAoY29uc29sZVtsZXZlbF0pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlW2xldmVsXShtZXNzYWdlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0xvZyBsZXZlbCBkb2VzIG5vdCBleGlzdC4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgbm8tY29uc29sZSAqL1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHNldExldmVsKGxldmVsKSB7XG4gICAgICAgIGxldmVsID0gbGV2ZWwudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICBpZiAoY29uc29sZVtsZXZlbF0pIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgICAgICB0aGlzLmNvbmZpZy5sb2dMZXZlbCA9IGxldmVsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0xvZyBsZXZlbCBkb2VzIG5vdCBleGlzdC4nKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG4iLCIvKipcbiAqIHJhbmRvbSAtLSBBIGNvbGxlY3Rpb24gb2YgcmFuZG9tIGdlbmVyYXRvciBmdW5jdGlvbnNcbiAqL1xuZXhwb3J0IGRlZmF1bHQge1xuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGEgcmFuZG9tIG51bWJlciBiZXR3ZWVuIHRoZSBnaXZlbiBzdGFydCBhbmQgZW5kIHBvaW50c1xuICAgICAqL1xuICAgIG51bWJlcihmcm9tLCB0bz1udWxsKSB7XG4gICAgICAgIGlmICh0byA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdG8gPSBmcm9tO1xuICAgICAgICAgICAgZnJvbSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gTWF0aC5yYW5kb20oKSAqICh0byAtIGZyb20pICsgZnJvbTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgYSByYW5kb20gaW50ZWdlciBiZXR3ZWVuIHRoZSBnaXZlbiBwb3NpdGlvbnNcbiAgICAgKi9cbiAgICBpbnRlZ2VyKC4uLmFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IodGhpcy5udW1iZXIoLi4uYXJncykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZSBhIHJhbmRvbSBudW1iZXIsIHdpdGggYSByYW5kb20gc2lnbiwgYmV0d2VlbiB0aGUgZ2l2ZW5cbiAgICAgKiBwb3NpdGlvbnNcbiAgICAgKi9cbiAgICBkaXJlY3Rpb25hbCguLi5hcmdzKSB7XG4gICAgICAgIGxldCByYW5kID0gdGhpcy5udW1iZXIoLi4uYXJncyk7XG4gICAgICAgIGlmIChNYXRoLnJhbmRvbSgpID4gMC41KSB7XG4gICAgICAgICAgICByYW5kID0gLXJhbmQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJhbmQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGEgcmFuZG9tIGhleGFkZWNpbWFsIGNvbG9yXG4gICAgICovXG4gICAgY29sb3IoKSB7XG4gICAgICAgIHJldHVybiAnIycgKyAoJzAwMDAwJyArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDB4MTAwMDAwMCkudG9TdHJpbmcoMTYpKS5zdWJzdHIoLTYpO1xuICAgIH1cbn07XG4iLCIvKipcbiAqIGpzY29sb3IgLSBKYXZhU2NyaXB0IENvbG9yIFBpY2tlclxuICpcbiAqIEBsaW5rICAgIGh0dHA6Ly9qc2NvbG9yLmNvbVxuICogQGxpY2Vuc2UgRm9yIG9wZW4gc291cmNlIHVzZTogR1BMdjNcbiAqICAgICAgICAgIEZvciBjb21tZXJjaWFsIHVzZTogSlNDb2xvciBDb21tZXJjaWFsIExpY2Vuc2VcbiAqIEBhdXRob3IgIEphbiBPZHZhcmtvXG4gKiBAdmVyc2lvbiAyLjAuNFxuICpcbiAqIFNlZSB1c2FnZSBleGFtcGxlcyBhdCBodHRwOi8vanNjb2xvci5jb20vZXhhbXBsZXMvXG4gKi9cblxuXG5cInVzZSBzdHJpY3RcIjtcblxuXG5pZiAoIXdpbmRvdy5qc2NvbG9yKSB7IHdpbmRvdy5qc2NvbG9yID0gKGZ1bmN0aW9uICgpIHtcblxuXG52YXIganNjID0ge1xuXG5cblx0cmVnaXN0ZXIgOiBmdW5jdGlvbiAoKSB7XG5cdFx0anNjLmF0dGFjaERPTVJlYWR5RXZlbnQoanNjLmluaXQpO1xuXHRcdGpzYy5hdHRhY2hFdmVudChkb2N1bWVudCwgJ21vdXNlZG93bicsIGpzYy5vbkRvY3VtZW50TW91c2VEb3duKTtcblx0XHRqc2MuYXR0YWNoRXZlbnQoZG9jdW1lbnQsICd0b3VjaHN0YXJ0JywganNjLm9uRG9jdW1lbnRUb3VjaFN0YXJ0KTtcblx0XHRqc2MuYXR0YWNoRXZlbnQod2luZG93LCAncmVzaXplJywganNjLm9uV2luZG93UmVzaXplKTtcblx0fSxcblxuXG5cdGluaXQgOiBmdW5jdGlvbiAoKSB7XG5cdFx0aWYgKGpzYy5qc2NvbG9yLmxvb2t1cENsYXNzKSB7XG5cdFx0XHRqc2MuanNjb2xvci5pbnN0YWxsQnlDbGFzc05hbWUoanNjLmpzY29sb3IubG9va3VwQ2xhc3MpO1xuXHRcdH1cblx0fSxcblxuXG5cdHRyeUluc3RhbGxPbkVsZW1lbnRzIDogZnVuY3Rpb24gKGVsbXMsIGNsYXNzTmFtZSkge1xuXHRcdHZhciBtYXRjaENsYXNzID0gbmV3IFJlZ0V4cCgnKF58XFxcXHMpKCcgKyBjbGFzc05hbWUgKyAnKShcXFxccyooXFxcXHtbXn1dKlxcXFx9KXxcXFxcc3wkKScsICdpJyk7XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGVsbXMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdGlmIChlbG1zW2ldLnR5cGUgIT09IHVuZGVmaW5lZCAmJiBlbG1zW2ldLnR5cGUudG9Mb3dlckNhc2UoKSA9PSAnY29sb3InKSB7XG5cdFx0XHRcdGlmIChqc2MuaXNDb2xvckF0dHJTdXBwb3J0ZWQpIHtcblx0XHRcdFx0XHQvLyBza2lwIGlucHV0cyBvZiB0eXBlICdjb2xvcicgaWYgc3VwcG9ydGVkIGJ5IHRoZSBicm93c2VyXG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHZhciBtO1xuXHRcdFx0aWYgKCFlbG1zW2ldLmpzY29sb3IgJiYgZWxtc1tpXS5jbGFzc05hbWUgJiYgKG0gPSBlbG1zW2ldLmNsYXNzTmFtZS5tYXRjaChtYXRjaENsYXNzKSkpIHtcblx0XHRcdFx0dmFyIHRhcmdldEVsbSA9IGVsbXNbaV07XG5cdFx0XHRcdHZhciBvcHRzU3RyID0gbnVsbDtcblxuXHRcdFx0XHR2YXIgZGF0YU9wdGlvbnMgPSBqc2MuZ2V0RGF0YUF0dHIodGFyZ2V0RWxtLCAnanNjb2xvcicpO1xuXHRcdFx0XHRpZiAoZGF0YU9wdGlvbnMgIT09IG51bGwpIHtcblx0XHRcdFx0XHRvcHRzU3RyID0gZGF0YU9wdGlvbnM7XG5cdFx0XHRcdH0gZWxzZSBpZiAobVs0XSkge1xuXHRcdFx0XHRcdG9wdHNTdHIgPSBtWzRdO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIG9wdHMgPSB7fTtcblx0XHRcdFx0aWYgKG9wdHNTdHIpIHtcblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0b3B0cyA9IChuZXcgRnVuY3Rpb24gKCdyZXR1cm4gKCcgKyBvcHRzU3RyICsgJyknKSkoKTtcblx0XHRcdFx0XHR9IGNhdGNoKGVQYXJzZUVycm9yKSB7XG5cdFx0XHRcdFx0XHRqc2Mud2FybignRXJyb3IgcGFyc2luZyBqc2NvbG9yIG9wdGlvbnM6ICcgKyBlUGFyc2VFcnJvciArICc6XFxuJyArIG9wdHNTdHIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHR0YXJnZXRFbG0uanNjb2xvciA9IG5ldyBqc2MuanNjb2xvcih0YXJnZXRFbG0sIG9wdHMpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXG5cdGlzQ29sb3JBdHRyU3VwcG9ydGVkIDogKGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZWxtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcblx0XHRpZiAoZWxtLnNldEF0dHJpYnV0ZSkge1xuXHRcdFx0ZWxtLnNldEF0dHJpYnV0ZSgndHlwZScsICdjb2xvcicpO1xuXHRcdFx0aWYgKGVsbS50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ2NvbG9yJykge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9KSgpLFxuXG5cblx0aXNDYW52YXNTdXBwb3J0ZWQgOiAoZnVuY3Rpb24gKCkge1xuXHRcdHZhciBlbG0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblx0XHRyZXR1cm4gISEoZWxtLmdldENvbnRleHQgJiYgZWxtLmdldENvbnRleHQoJzJkJykpO1xuXHR9KSgpLFxuXG5cblx0ZmV0Y2hFbGVtZW50IDogZnVuY3Rpb24gKG1peGVkKSB7XG5cdFx0cmV0dXJuIHR5cGVvZiBtaXhlZCA9PT0gJ3N0cmluZycgPyBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChtaXhlZCkgOiBtaXhlZDtcblx0fSxcblxuXG5cdGlzRWxlbWVudFR5cGUgOiBmdW5jdGlvbiAoZWxtLCB0eXBlKSB7XG5cdFx0cmV0dXJuIGVsbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSB0eXBlLnRvTG93ZXJDYXNlKCk7XG5cdH0sXG5cblxuXHRnZXREYXRhQXR0ciA6IGZ1bmN0aW9uIChlbCwgbmFtZSkge1xuXHRcdHZhciBhdHRyTmFtZSA9ICdkYXRhLScgKyBuYW1lO1xuXHRcdHZhciBhdHRyVmFsdWUgPSBlbC5nZXRBdHRyaWJ1dGUoYXR0ck5hbWUpO1xuXHRcdGlmIChhdHRyVmFsdWUgIT09IG51bGwpIHtcblx0XHRcdHJldHVybiBhdHRyVmFsdWU7XG5cdFx0fVxuXHRcdHJldHVybiBudWxsO1xuXHR9LFxuXG5cblx0YXR0YWNoRXZlbnQgOiBmdW5jdGlvbiAoZWwsIGV2bnQsIGZ1bmMpIHtcblx0XHRpZiAoZWwuYWRkRXZlbnRMaXN0ZW5lcikge1xuXHRcdFx0ZWwuYWRkRXZlbnRMaXN0ZW5lcihldm50LCBmdW5jLCBmYWxzZSk7XG5cdFx0fSBlbHNlIGlmIChlbC5hdHRhY2hFdmVudCkge1xuXHRcdFx0ZWwuYXR0YWNoRXZlbnQoJ29uJyArIGV2bnQsIGZ1bmMpO1xuXHRcdH1cblx0fSxcblxuXG5cdGRldGFjaEV2ZW50IDogZnVuY3Rpb24gKGVsLCBldm50LCBmdW5jKSB7XG5cdFx0aWYgKGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIpIHtcblx0XHRcdGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZudCwgZnVuYywgZmFsc2UpO1xuXHRcdH0gZWxzZSBpZiAoZWwuZGV0YWNoRXZlbnQpIHtcblx0XHRcdGVsLmRldGFjaEV2ZW50KCdvbicgKyBldm50LCBmdW5jKTtcblx0XHR9XG5cdH0sXG5cblxuXHRfYXR0YWNoZWRHcm91cEV2ZW50cyA6IHt9LFxuXG5cblx0YXR0YWNoR3JvdXBFdmVudCA6IGZ1bmN0aW9uIChncm91cE5hbWUsIGVsLCBldm50LCBmdW5jKSB7XG5cdFx0aWYgKCFqc2MuX2F0dGFjaGVkR3JvdXBFdmVudHMuaGFzT3duUHJvcGVydHkoZ3JvdXBOYW1lKSkge1xuXHRcdFx0anNjLl9hdHRhY2hlZEdyb3VwRXZlbnRzW2dyb3VwTmFtZV0gPSBbXTtcblx0XHR9XG5cdFx0anNjLl9hdHRhY2hlZEdyb3VwRXZlbnRzW2dyb3VwTmFtZV0ucHVzaChbZWwsIGV2bnQsIGZ1bmNdKTtcblx0XHRqc2MuYXR0YWNoRXZlbnQoZWwsIGV2bnQsIGZ1bmMpO1xuXHR9LFxuXG5cblx0ZGV0YWNoR3JvdXBFdmVudHMgOiBmdW5jdGlvbiAoZ3JvdXBOYW1lKSB7XG5cdFx0aWYgKGpzYy5fYXR0YWNoZWRHcm91cEV2ZW50cy5oYXNPd25Qcm9wZXJ0eShncm91cE5hbWUpKSB7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGpzYy5fYXR0YWNoZWRHcm91cEV2ZW50c1tncm91cE5hbWVdLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdHZhciBldnQgPSBqc2MuX2F0dGFjaGVkR3JvdXBFdmVudHNbZ3JvdXBOYW1lXVtpXTtcblx0XHRcdFx0anNjLmRldGFjaEV2ZW50KGV2dFswXSwgZXZ0WzFdLCBldnRbMl0pO1xuXHRcdFx0fVxuXHRcdFx0ZGVsZXRlIGpzYy5fYXR0YWNoZWRHcm91cEV2ZW50c1tncm91cE5hbWVdO1xuXHRcdH1cblx0fSxcblxuXG5cdGF0dGFjaERPTVJlYWR5RXZlbnQgOiBmdW5jdGlvbiAoZnVuYykge1xuXHRcdHZhciBmaXJlZCA9IGZhbHNlO1xuXHRcdHZhciBmaXJlT25jZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmICghZmlyZWQpIHtcblx0XHRcdFx0ZmlyZWQgPSB0cnVlO1xuXHRcdFx0XHRmdW5jKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7XG5cdFx0XHRzZXRUaW1lb3V0KGZpcmVPbmNlLCAxKTsgLy8gYXN5bmNcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xuXHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZpcmVPbmNlLCBmYWxzZSk7XG5cblx0XHRcdC8vIEZhbGxiYWNrXG5cdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZpcmVPbmNlLCBmYWxzZSk7XG5cblx0XHR9IGVsc2UgaWYgKGRvY3VtZW50LmF0dGFjaEV2ZW50KSB7XG5cdFx0XHQvLyBJRVxuXHRcdFx0ZG9jdW1lbnQuYXR0YWNoRXZlbnQoJ29ucmVhZHlzdGF0ZWNoYW5nZScsIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0aWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcblx0XHRcdFx0XHRkb2N1bWVudC5kZXRhY2hFdmVudCgnb25yZWFkeXN0YXRlY2hhbmdlJywgYXJndW1lbnRzLmNhbGxlZSk7XG5cdFx0XHRcdFx0ZmlyZU9uY2UoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblxuXHRcdFx0Ly8gRmFsbGJhY2tcblx0XHRcdHdpbmRvdy5hdHRhY2hFdmVudCgnb25sb2FkJywgZmlyZU9uY2UpO1xuXG5cdFx0XHQvLyBJRTcvOFxuXHRcdFx0aWYgKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kb1Njcm9sbCAmJiB3aW5kb3cgPT0gd2luZG93LnRvcCkge1xuXHRcdFx0XHR2YXIgdHJ5U2Nyb2xsID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdGlmICghZG9jdW1lbnQuYm9keSkgeyByZXR1cm47IH1cblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0ZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRvU2Nyb2xsKCdsZWZ0Jyk7XG5cdFx0XHRcdFx0XHRmaXJlT25jZSgpO1xuXHRcdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRcdHNldFRpbWVvdXQodHJ5U2Nyb2xsLCAxKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cdFx0XHRcdHRyeVNjcm9sbCgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXG5cdHdhcm4gOiBmdW5jdGlvbiAobXNnKSB7XG5cdFx0aWYgKHdpbmRvdy5jb25zb2xlICYmIHdpbmRvdy5jb25zb2xlLndhcm4pIHtcblx0XHRcdHdpbmRvdy5jb25zb2xlLndhcm4obXNnKTtcblx0XHR9XG5cdH0sXG5cblxuXHRwcmV2ZW50RGVmYXVsdCA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0aWYgKGUucHJldmVudERlZmF1bHQpIHsgZS5wcmV2ZW50RGVmYXVsdCgpOyB9XG5cdFx0ZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuXHR9LFxuXG5cblx0Y2FwdHVyZVRhcmdldCA6IGZ1bmN0aW9uICh0YXJnZXQpIHtcblx0XHQvLyBJRVxuXHRcdGlmICh0YXJnZXQuc2V0Q2FwdHVyZSkge1xuXHRcdFx0anNjLl9jYXB0dXJlZFRhcmdldCA9IHRhcmdldDtcblx0XHRcdGpzYy5fY2FwdHVyZWRUYXJnZXQuc2V0Q2FwdHVyZSgpO1xuXHRcdH1cblx0fSxcblxuXG5cdHJlbGVhc2VUYXJnZXQgOiBmdW5jdGlvbiAoKSB7XG5cdFx0Ly8gSUVcblx0XHRpZiAoanNjLl9jYXB0dXJlZFRhcmdldCkge1xuXHRcdFx0anNjLl9jYXB0dXJlZFRhcmdldC5yZWxlYXNlQ2FwdHVyZSgpO1xuXHRcdFx0anNjLl9jYXB0dXJlZFRhcmdldCA9IG51bGw7XG5cdFx0fVxuXHR9LFxuXG5cblx0ZmlyZUV2ZW50IDogZnVuY3Rpb24gKGVsLCBldm50KSB7XG5cdFx0aWYgKCFlbCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRpZiAoZG9jdW1lbnQuY3JlYXRlRXZlbnQpIHtcblx0XHRcdHZhciBldiA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdIVE1MRXZlbnRzJyk7XG5cdFx0XHRldi5pbml0RXZlbnQoZXZudCwgdHJ1ZSwgdHJ1ZSk7XG5cdFx0XHRlbC5kaXNwYXRjaEV2ZW50KGV2KTtcblx0XHR9IGVsc2UgaWYgKGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KSB7XG5cdFx0XHR2YXIgZXYgPSBkb2N1bWVudC5jcmVhdGVFdmVudE9iamVjdCgpO1xuXHRcdFx0ZWwuZmlyZUV2ZW50KCdvbicgKyBldm50LCBldik7XG5cdFx0fSBlbHNlIGlmIChlbFsnb24nICsgZXZudF0pIHsgLy8gYWx0ZXJuYXRpdmVseSB1c2UgdGhlIHRyYWRpdGlvbmFsIGV2ZW50IG1vZGVsXG5cdFx0XHRlbFsnb24nICsgZXZudF0oKTtcblx0XHR9XG5cdH0sXG5cblxuXHRjbGFzc05hbWVUb0xpc3QgOiBmdW5jdGlvbiAoY2xhc3NOYW1lKSB7XG5cdFx0cmV0dXJuIGNsYXNzTmFtZS5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJykuc3BsaXQoL1xccysvKTtcblx0fSxcblxuXG5cdC8vIFRoZSBjbGFzc05hbWUgcGFyYW1ldGVyIChzdHIpIGNhbiBvbmx5IGNvbnRhaW4gYSBzaW5nbGUgY2xhc3MgbmFtZVxuXHRoYXNDbGFzcyA6IGZ1bmN0aW9uIChlbG0sIGNsYXNzTmFtZSkge1xuXHRcdGlmICghY2xhc3NOYW1lKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdHJldHVybiAtMSAhPSAoJyAnICsgZWxtLmNsYXNzTmFtZS5yZXBsYWNlKC9cXHMrL2csICcgJykgKyAnICcpLmluZGV4T2YoJyAnICsgY2xhc3NOYW1lICsgJyAnKTtcblx0fSxcblxuXG5cdC8vIFRoZSBjbGFzc05hbWUgcGFyYW1ldGVyIChzdHIpIGNhbiBjb250YWluIG11bHRpcGxlIGNsYXNzIG5hbWVzIHNlcGFyYXRlZCBieSB3aGl0ZXNwYWNlXG5cdHNldENsYXNzIDogZnVuY3Rpb24gKGVsbSwgY2xhc3NOYW1lKSB7XG5cdFx0dmFyIGNsYXNzTGlzdCA9IGpzYy5jbGFzc05hbWVUb0xpc3QoY2xhc3NOYW1lKTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGNsYXNzTGlzdC5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0aWYgKCFqc2MuaGFzQ2xhc3MoZWxtLCBjbGFzc0xpc3RbaV0pKSB7XG5cdFx0XHRcdGVsbS5jbGFzc05hbWUgKz0gKGVsbS5jbGFzc05hbWUgPyAnICcgOiAnJykgKyBjbGFzc0xpc3RbaV07XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gVGhlIGNsYXNzTmFtZSBwYXJhbWV0ZXIgKHN0cikgY2FuIGNvbnRhaW4gbXVsdGlwbGUgY2xhc3MgbmFtZXMgc2VwYXJhdGVkIGJ5IHdoaXRlc3BhY2Vcblx0dW5zZXRDbGFzcyA6IGZ1bmN0aW9uIChlbG0sIGNsYXNzTmFtZSkge1xuXHRcdHZhciBjbGFzc0xpc3QgPSBqc2MuY2xhc3NOYW1lVG9MaXN0KGNsYXNzTmFtZSk7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjbGFzc0xpc3QubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdHZhciByZXBsID0gbmV3IFJlZ0V4cChcblx0XHRcdFx0J15cXFxccyonICsgY2xhc3NMaXN0W2ldICsgJ1xcXFxzKnwnICtcblx0XHRcdFx0J1xcXFxzKicgKyBjbGFzc0xpc3RbaV0gKyAnXFxcXHMqJHwnICtcblx0XHRcdFx0J1xcXFxzKycgKyBjbGFzc0xpc3RbaV0gKyAnKFxcXFxzKyknLFxuXHRcdFx0XHQnZydcblx0XHRcdCk7XG5cdFx0XHRlbG0uY2xhc3NOYW1lID0gZWxtLmNsYXNzTmFtZS5yZXBsYWNlKHJlcGwsICckMScpO1xuXHRcdH1cblx0fSxcblxuXG5cdGdldFN0eWxlIDogZnVuY3Rpb24gKGVsbSkge1xuXHRcdHJldHVybiB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSA/IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsbSkgOiBlbG0uY3VycmVudFN0eWxlO1xuXHR9LFxuXG5cblx0c2V0U3R5bGUgOiAoZnVuY3Rpb24gKCkge1xuXHRcdHZhciBoZWxwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0XHR2YXIgZ2V0U3VwcG9ydGVkUHJvcCA9IGZ1bmN0aW9uIChuYW1lcykge1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBuYW1lcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRpZiAobmFtZXNbaV0gaW4gaGVscGVyLnN0eWxlKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG5hbWVzW2ldO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblx0XHR2YXIgcHJvcHMgPSB7XG5cdFx0XHRib3JkZXJSYWRpdXM6IGdldFN1cHBvcnRlZFByb3AoWydib3JkZXJSYWRpdXMnLCAnTW96Qm9yZGVyUmFkaXVzJywgJ3dlYmtpdEJvcmRlclJhZGl1cyddKSxcblx0XHRcdGJveFNoYWRvdzogZ2V0U3VwcG9ydGVkUHJvcChbJ2JveFNoYWRvdycsICdNb3pCb3hTaGFkb3cnLCAnd2Via2l0Qm94U2hhZG93J10pXG5cdFx0fTtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKGVsbSwgcHJvcCwgdmFsdWUpIHtcblx0XHRcdHN3aXRjaCAocHJvcC50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0XHRjYXNlICdvcGFjaXR5Jzpcblx0XHRcdFx0dmFyIGFscGhhT3BhY2l0eSA9IE1hdGgucm91bmQocGFyc2VGbG9hdCh2YWx1ZSkgKiAxMDApO1xuXHRcdFx0XHRlbG0uc3R5bGUub3BhY2l0eSA9IHZhbHVlO1xuXHRcdFx0XHRlbG0uc3R5bGUuZmlsdGVyID0gJ2FscGhhKG9wYWNpdHk9JyArIGFscGhhT3BhY2l0eSArICcpJztcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRlbG0uc3R5bGVbcHJvcHNbcHJvcF1dID0gdmFsdWU7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH07XG5cdH0pKCksXG5cblxuXHRzZXRCb3JkZXJSYWRpdXMgOiBmdW5jdGlvbiAoZWxtLCB2YWx1ZSkge1xuXHRcdGpzYy5zZXRTdHlsZShlbG0sICdib3JkZXJSYWRpdXMnLCB2YWx1ZSB8fCAnMCcpO1xuXHR9LFxuXG5cblx0c2V0Qm94U2hhZG93IDogZnVuY3Rpb24gKGVsbSwgdmFsdWUpIHtcblx0XHRqc2Muc2V0U3R5bGUoZWxtLCAnYm94U2hhZG93JywgdmFsdWUgfHwgJ25vbmUnKTtcblx0fSxcblxuXG5cdGdldEVsZW1lbnRQb3MgOiBmdW5jdGlvbiAoZSwgcmVsYXRpdmVUb1ZpZXdwb3J0KSB7XG5cdFx0dmFyIHg9MCwgeT0wO1xuXHRcdHZhciByZWN0ID0gZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0XHR4ID0gcmVjdC5sZWZ0O1xuXHRcdHkgPSByZWN0LnRvcDtcblx0XHRpZiAoIXJlbGF0aXZlVG9WaWV3cG9ydCkge1xuXHRcdFx0dmFyIHZpZXdQb3MgPSBqc2MuZ2V0Vmlld1BvcygpO1xuXHRcdFx0eCArPSB2aWV3UG9zWzBdO1xuXHRcdFx0eSArPSB2aWV3UG9zWzFdO1xuXHRcdH1cblx0XHRyZXR1cm4gW3gsIHldO1xuXHR9LFxuXG5cblx0Z2V0RWxlbWVudFNpemUgOiBmdW5jdGlvbiAoZSkge1xuXHRcdHJldHVybiBbZS5vZmZzZXRXaWR0aCwgZS5vZmZzZXRIZWlnaHRdO1xuXHR9LFxuXG5cblx0Ly8gZ2V0IHBvaW50ZXIncyBYL1kgY29vcmRpbmF0ZXMgcmVsYXRpdmUgdG8gdmlld3BvcnRcblx0Z2V0QWJzUG9pbnRlclBvcyA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0aWYgKCFlKSB7IGUgPSB3aW5kb3cuZXZlbnQ7IH1cblx0XHR2YXIgeCA9IDAsIHkgPSAwO1xuXHRcdGlmICh0eXBlb2YgZS5jaGFuZ2VkVG91Y2hlcyAhPT0gJ3VuZGVmaW5lZCcgJiYgZS5jaGFuZ2VkVG91Y2hlcy5sZW5ndGgpIHtcblx0XHRcdC8vIHRvdWNoIGRldmljZXNcblx0XHRcdHggPSBlLmNoYW5nZWRUb3VjaGVzWzBdLmNsaWVudFg7XG5cdFx0XHR5ID0gZS5jaGFuZ2VkVG91Y2hlc1swXS5jbGllbnRZO1xuXHRcdH0gZWxzZSBpZiAodHlwZW9mIGUuY2xpZW50WCA9PT0gJ251bWJlcicpIHtcblx0XHRcdHggPSBlLmNsaWVudFg7XG5cdFx0XHR5ID0gZS5jbGllbnRZO1xuXHRcdH1cblx0XHRyZXR1cm4geyB4OiB4LCB5OiB5IH07XG5cdH0sXG5cblxuXHQvLyBnZXQgcG9pbnRlcidzIFgvWSBjb29yZGluYXRlcyByZWxhdGl2ZSB0byB0YXJnZXQgZWxlbWVudFxuXHRnZXRSZWxQb2ludGVyUG9zIDogZnVuY3Rpb24gKGUpIHtcblx0XHRpZiAoIWUpIHsgZSA9IHdpbmRvdy5ldmVudDsgfVxuXHRcdHZhciB0YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XG5cdFx0dmFyIHRhcmdldFJlY3QgPSB0YXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cblx0XHR2YXIgeCA9IDAsIHkgPSAwO1xuXG5cdFx0dmFyIGNsaWVudFggPSAwLCBjbGllbnRZID0gMDtcblx0XHRpZiAodHlwZW9mIGUuY2hhbmdlZFRvdWNoZXMgIT09ICd1bmRlZmluZWQnICYmIGUuY2hhbmdlZFRvdWNoZXMubGVuZ3RoKSB7XG5cdFx0XHQvLyB0b3VjaCBkZXZpY2VzXG5cdFx0XHRjbGllbnRYID0gZS5jaGFuZ2VkVG91Y2hlc1swXS5jbGllbnRYO1xuXHRcdFx0Y2xpZW50WSA9IGUuY2hhbmdlZFRvdWNoZXNbMF0uY2xpZW50WTtcblx0XHR9IGVsc2UgaWYgKHR5cGVvZiBlLmNsaWVudFggPT09ICdudW1iZXInKSB7XG5cdFx0XHRjbGllbnRYID0gZS5jbGllbnRYO1xuXHRcdFx0Y2xpZW50WSA9IGUuY2xpZW50WTtcblx0XHR9XG5cblx0XHR4ID0gY2xpZW50WCAtIHRhcmdldFJlY3QubGVmdDtcblx0XHR5ID0gY2xpZW50WSAtIHRhcmdldFJlY3QudG9wO1xuXHRcdHJldHVybiB7IHg6IHgsIHk6IHkgfTtcblx0fSxcblxuXG5cdGdldFZpZXdQb3MgOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGRvYyA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblx0XHRyZXR1cm4gW1xuXHRcdFx0KHdpbmRvdy5wYWdlWE9mZnNldCB8fCBkb2Muc2Nyb2xsTGVmdCkgLSAoZG9jLmNsaWVudExlZnQgfHwgMCksXG5cdFx0XHQod2luZG93LnBhZ2VZT2Zmc2V0IHx8IGRvYy5zY3JvbGxUb3ApIC0gKGRvYy5jbGllbnRUb3AgfHwgMClcblx0XHRdO1xuXHR9LFxuXG5cblx0Z2V0Vmlld1NpemUgOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGRvYyA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblx0XHRyZXR1cm4gW1xuXHRcdFx0KHdpbmRvdy5pbm5lcldpZHRoIHx8IGRvYy5jbGllbnRXaWR0aCksXG5cdFx0XHQod2luZG93LmlubmVySGVpZ2h0IHx8IGRvYy5jbGllbnRIZWlnaHQpLFxuXHRcdF07XG5cdH0sXG5cblxuXHRyZWRyYXdQb3NpdGlvbiA6IGZ1bmN0aW9uICgpIHtcblxuXHRcdGlmIChqc2MucGlja2VyICYmIGpzYy5waWNrZXIub3duZXIpIHtcblx0XHRcdHZhciB0aGlzT2JqID0ganNjLnBpY2tlci5vd25lcjtcblxuXHRcdFx0dmFyIHRwLCB2cDtcblxuXHRcdFx0aWYgKHRoaXNPYmouZml4ZWQpIHtcblx0XHRcdFx0Ly8gRml4ZWQgZWxlbWVudHMgYXJlIHBvc2l0aW9uZWQgcmVsYXRpdmUgdG8gdmlld3BvcnQsXG5cdFx0XHRcdC8vIHRoZXJlZm9yZSB3ZSBjYW4gaWdub3JlIHRoZSBzY3JvbGwgb2Zmc2V0XG5cdFx0XHRcdHRwID0ganNjLmdldEVsZW1lbnRQb3ModGhpc09iai50YXJnZXRFbGVtZW50LCB0cnVlKTsgLy8gdGFyZ2V0IHBvc1xuXHRcdFx0XHR2cCA9IFswLCAwXTsgLy8gdmlldyBwb3Ncblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRwID0ganNjLmdldEVsZW1lbnRQb3ModGhpc09iai50YXJnZXRFbGVtZW50KTsgLy8gdGFyZ2V0IHBvc1xuXHRcdFx0XHR2cCA9IGpzYy5nZXRWaWV3UG9zKCk7IC8vIHZpZXcgcG9zXG5cdFx0XHR9XG5cblx0XHRcdHZhciB0cyA9IGpzYy5nZXRFbGVtZW50U2l6ZSh0aGlzT2JqLnRhcmdldEVsZW1lbnQpOyAvLyB0YXJnZXQgc2l6ZVxuXHRcdFx0dmFyIHZzID0ganNjLmdldFZpZXdTaXplKCk7IC8vIHZpZXcgc2l6ZVxuXHRcdFx0dmFyIHBzID0ganNjLmdldFBpY2tlck91dGVyRGltcyh0aGlzT2JqKTsgLy8gcGlja2VyIHNpemVcblx0XHRcdHZhciBhLCBiLCBjO1xuXHRcdFx0c3dpdGNoICh0aGlzT2JqLnBvc2l0aW9uLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRcdFx0Y2FzZSAnbGVmdCc6IGE9MTsgYj0wOyBjPS0xOyBicmVhaztcblx0XHRcdFx0Y2FzZSAncmlnaHQnOmE9MTsgYj0wOyBjPTE7IGJyZWFrO1xuXHRcdFx0XHRjYXNlICd0b3AnOiAgYT0wOyBiPTE7IGM9LTE7IGJyZWFrO1xuXHRcdFx0XHRkZWZhdWx0OiAgICAgYT0wOyBiPTE7IGM9MTsgYnJlYWs7XG5cdFx0XHR9XG5cdFx0XHR2YXIgbCA9ICh0c1tiXStwc1tiXSkvMjtcblxuXHRcdFx0Ly8gY29tcHV0ZSBwaWNrZXIgcG9zaXRpb25cblx0XHRcdGlmICghdGhpc09iai5zbWFydFBvc2l0aW9uKSB7XG5cdFx0XHRcdHZhciBwcCA9IFtcblx0XHRcdFx0XHR0cFthXSxcblx0XHRcdFx0XHR0cFtiXSt0c1tiXS1sK2wqY1xuXHRcdFx0XHRdO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dmFyIHBwID0gW1xuXHRcdFx0XHRcdC12cFthXSt0cFthXStwc1thXSA+IHZzW2FdID9cblx0XHRcdFx0XHRcdCgtdnBbYV0rdHBbYV0rdHNbYV0vMiA+IHZzW2FdLzIgJiYgdHBbYV0rdHNbYV0tcHNbYV0gPj0gMCA/IHRwW2FdK3RzW2FdLXBzW2FdIDogdHBbYV0pIDpcblx0XHRcdFx0XHRcdHRwW2FdLFxuXHRcdFx0XHRcdC12cFtiXSt0cFtiXSt0c1tiXStwc1tiXS1sK2wqYyA+IHZzW2JdID9cblx0XHRcdFx0XHRcdCgtdnBbYl0rdHBbYl0rdHNbYl0vMiA+IHZzW2JdLzIgJiYgdHBbYl0rdHNbYl0tbC1sKmMgPj0gMCA/IHRwW2JdK3RzW2JdLWwtbCpjIDogdHBbYl0rdHNbYl0tbCtsKmMpIDpcblx0XHRcdFx0XHRcdCh0cFtiXSt0c1tiXS1sK2wqYyA+PSAwID8gdHBbYl0rdHNbYl0tbCtsKmMgOiB0cFtiXSt0c1tiXS1sLWwqYylcblx0XHRcdFx0XTtcblx0XHRcdH1cblxuXHRcdFx0dmFyIHggPSBwcFthXTtcblx0XHRcdHZhciB5ID0gcHBbYl07XG5cdFx0XHR2YXIgcG9zaXRpb25WYWx1ZSA9IHRoaXNPYmouZml4ZWQgPyAnZml4ZWQnIDogJ2Fic29sdXRlJztcblx0XHRcdHZhciBjb250cmFjdFNoYWRvdyA9XG5cdFx0XHRcdChwcFswXSArIHBzWzBdID4gdHBbMF0gfHwgcHBbMF0gPCB0cFswXSArIHRzWzBdKSAmJlxuXHRcdFx0XHQocHBbMV0gKyBwc1sxXSA8IHRwWzFdICsgdHNbMV0pO1xuXG5cdFx0XHRqc2MuX2RyYXdQb3NpdGlvbih0aGlzT2JqLCB4LCB5LCBwb3NpdGlvblZhbHVlLCBjb250cmFjdFNoYWRvdyk7XG5cdFx0fVxuXHR9LFxuXG5cblx0X2RyYXdQb3NpdGlvbiA6IGZ1bmN0aW9uICh0aGlzT2JqLCB4LCB5LCBwb3NpdGlvblZhbHVlLCBjb250cmFjdFNoYWRvdykge1xuXHRcdHZhciB2U2hhZG93ID0gY29udHJhY3RTaGFkb3cgPyAwIDogdGhpc09iai5zaGFkb3dCbHVyOyAvLyBweFxuXG5cdFx0anNjLnBpY2tlci53cmFwLnN0eWxlLnBvc2l0aW9uID0gcG9zaXRpb25WYWx1ZTtcblx0XHRqc2MucGlja2VyLndyYXAuc3R5bGUubGVmdCA9IHggKyAncHgnO1xuXHRcdGpzYy5waWNrZXIud3JhcC5zdHlsZS50b3AgPSB5ICsgJ3B4JztcblxuXHRcdGpzYy5zZXRCb3hTaGFkb3coXG5cdFx0XHRqc2MucGlja2VyLmJveFMsXG5cdFx0XHR0aGlzT2JqLnNoYWRvdyA/XG5cdFx0XHRcdG5ldyBqc2MuQm94U2hhZG93KDAsIHZTaGFkb3csIHRoaXNPYmouc2hhZG93Qmx1ciwgMCwgdGhpc09iai5zaGFkb3dDb2xvcikgOlxuXHRcdFx0XHRudWxsKTtcblx0fSxcblxuXG5cdGdldFBpY2tlckRpbXMgOiBmdW5jdGlvbiAodGhpc09iaikge1xuXHRcdHZhciBkaXNwbGF5U2xpZGVyID0gISFqc2MuZ2V0U2xpZGVyQ29tcG9uZW50KHRoaXNPYmopO1xuXHRcdHZhciBkaW1zID0gW1xuXHRcdFx0MiAqIHRoaXNPYmouaW5zZXRXaWR0aCArIDIgKiB0aGlzT2JqLnBhZGRpbmcgKyB0aGlzT2JqLndpZHRoICtcblx0XHRcdFx0KGRpc3BsYXlTbGlkZXIgPyAyICogdGhpc09iai5pbnNldFdpZHRoICsganNjLmdldFBhZFRvU2xpZGVyUGFkZGluZyh0aGlzT2JqKSArIHRoaXNPYmouc2xpZGVyU2l6ZSA6IDApLFxuXHRcdFx0MiAqIHRoaXNPYmouaW5zZXRXaWR0aCArIDIgKiB0aGlzT2JqLnBhZGRpbmcgKyB0aGlzT2JqLmhlaWdodCArXG5cdFx0XHRcdCh0aGlzT2JqLmNsb3NhYmxlID8gMiAqIHRoaXNPYmouaW5zZXRXaWR0aCArIHRoaXNPYmoucGFkZGluZyArIHRoaXNPYmouYnV0dG9uSGVpZ2h0IDogMClcblx0XHRdO1xuXHRcdHJldHVybiBkaW1zO1xuXHR9LFxuXG5cblx0Z2V0UGlja2VyT3V0ZXJEaW1zIDogZnVuY3Rpb24gKHRoaXNPYmopIHtcblx0XHR2YXIgZGltcyA9IGpzYy5nZXRQaWNrZXJEaW1zKHRoaXNPYmopO1xuXHRcdHJldHVybiBbXG5cdFx0XHRkaW1zWzBdICsgMiAqIHRoaXNPYmouYm9yZGVyV2lkdGgsXG5cdFx0XHRkaW1zWzFdICsgMiAqIHRoaXNPYmouYm9yZGVyV2lkdGhcblx0XHRdO1xuXHR9LFxuXG5cblx0Z2V0UGFkVG9TbGlkZXJQYWRkaW5nIDogZnVuY3Rpb24gKHRoaXNPYmopIHtcblx0XHRyZXR1cm4gTWF0aC5tYXgodGhpc09iai5wYWRkaW5nLCAxLjUgKiAoMiAqIHRoaXNPYmoucG9pbnRlckJvcmRlcldpZHRoICsgdGhpc09iai5wb2ludGVyVGhpY2tuZXNzKSk7XG5cdH0sXG5cblxuXHRnZXRQYWRZQ29tcG9uZW50IDogZnVuY3Rpb24gKHRoaXNPYmopIHtcblx0XHRzd2l0Y2ggKHRoaXNPYmoubW9kZS5jaGFyQXQoMSkudG9Mb3dlckNhc2UoKSkge1xuXHRcdFx0Y2FzZSAndic6IHJldHVybiAndic7IGJyZWFrO1xuXHRcdH1cblx0XHRyZXR1cm4gJ3MnO1xuXHR9LFxuXG5cblx0Z2V0U2xpZGVyQ29tcG9uZW50IDogZnVuY3Rpb24gKHRoaXNPYmopIHtcblx0XHRpZiAodGhpc09iai5tb2RlLmxlbmd0aCA+IDIpIHtcblx0XHRcdHN3aXRjaCAodGhpc09iai5tb2RlLmNoYXJBdCgyKS50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0XHRcdGNhc2UgJ3MnOiByZXR1cm4gJ3MnOyBicmVhaztcblx0XHRcdFx0Y2FzZSAndic6IHJldHVybiAndic7IGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gbnVsbDtcblx0fSxcblxuXG5cdG9uRG9jdW1lbnRNb3VzZURvd24gOiBmdW5jdGlvbiAoZSkge1xuXHRcdGlmICghZSkgeyBlID0gd2luZG93LmV2ZW50OyB9XG5cdFx0dmFyIHRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcblxuXHRcdGlmICh0YXJnZXQuX2pzY0xpbmtlZEluc3RhbmNlKSB7XG5cdFx0XHRpZiAodGFyZ2V0Ll9qc2NMaW5rZWRJbnN0YW5jZS5zaG93T25DbGljaykge1xuXHRcdFx0XHR0YXJnZXQuX2pzY0xpbmtlZEluc3RhbmNlLnNob3coKTtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKHRhcmdldC5fanNjQ29udHJvbE5hbWUpIHtcblx0XHRcdGpzYy5vbkNvbnRyb2xQb2ludGVyU3RhcnQoZSwgdGFyZ2V0LCB0YXJnZXQuX2pzY0NvbnRyb2xOYW1lLCAnbW91c2UnKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gTW91c2UgaXMgb3V0c2lkZSB0aGUgcGlja2VyIGNvbnRyb2xzIC0+IGhpZGUgdGhlIGNvbG9yIHBpY2tlciFcblx0XHRcdGlmIChqc2MucGlja2VyICYmIGpzYy5waWNrZXIub3duZXIpIHtcblx0XHRcdFx0anNjLnBpY2tlci5vd25lci5oaWRlKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0b25Eb2N1bWVudFRvdWNoU3RhcnQgOiBmdW5jdGlvbiAoZSkge1xuXHRcdGlmICghZSkgeyBlID0gd2luZG93LmV2ZW50OyB9XG5cdFx0dmFyIHRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcblxuXHRcdGlmICh0YXJnZXQuX2pzY0xpbmtlZEluc3RhbmNlKSB7XG5cdFx0XHRpZiAodGFyZ2V0Ll9qc2NMaW5rZWRJbnN0YW5jZS5zaG93T25DbGljaykge1xuXHRcdFx0XHR0YXJnZXQuX2pzY0xpbmtlZEluc3RhbmNlLnNob3coKTtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKHRhcmdldC5fanNjQ29udHJvbE5hbWUpIHtcblx0XHRcdGpzYy5vbkNvbnRyb2xQb2ludGVyU3RhcnQoZSwgdGFyZ2V0LCB0YXJnZXQuX2pzY0NvbnRyb2xOYW1lLCAndG91Y2gnKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKGpzYy5waWNrZXIgJiYganNjLnBpY2tlci5vd25lcikge1xuXHRcdFx0XHRqc2MucGlja2VyLm93bmVyLmhpZGUoKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblxuXHRvbldpbmRvd1Jlc2l6ZSA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0anNjLnJlZHJhd1Bvc2l0aW9uKCk7XG5cdH0sXG5cblxuXHRvblBhcmVudFNjcm9sbCA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0Ly8gaGlkZSB0aGUgcGlja2VyIHdoZW4gb25lIG9mIHRoZSBwYXJlbnQgZWxlbWVudHMgaXMgc2Nyb2xsZWRcblx0XHRpZiAoanNjLnBpY2tlciAmJiBqc2MucGlja2VyLm93bmVyKSB7XG5cdFx0XHRqc2MucGlja2VyLm93bmVyLmhpZGUoKTtcblx0XHR9XG5cdH0sXG5cblxuXHRfcG9pbnRlck1vdmVFdmVudCA6IHtcblx0XHRtb3VzZTogJ21vdXNlbW92ZScsXG5cdFx0dG91Y2g6ICd0b3VjaG1vdmUnXG5cdH0sXG5cdF9wb2ludGVyRW5kRXZlbnQgOiB7XG5cdFx0bW91c2U6ICdtb3VzZXVwJyxcblx0XHR0b3VjaDogJ3RvdWNoZW5kJ1xuXHR9LFxuXG5cblx0X3BvaW50ZXJPcmlnaW4gOiBudWxsLFxuXHRfY2FwdHVyZWRUYXJnZXQgOiBudWxsLFxuXG5cblx0b25Db250cm9sUG9pbnRlclN0YXJ0IDogZnVuY3Rpb24gKGUsIHRhcmdldCwgY29udHJvbE5hbWUsIHBvaW50ZXJUeXBlKSB7XG5cdFx0dmFyIHRoaXNPYmogPSB0YXJnZXQuX2pzY0luc3RhbmNlO1xuXG5cdFx0anNjLnByZXZlbnREZWZhdWx0KGUpO1xuXHRcdGpzYy5jYXB0dXJlVGFyZ2V0KHRhcmdldCk7XG5cblx0XHR2YXIgcmVnaXN0ZXJEcmFnRXZlbnRzID0gZnVuY3Rpb24gKGRvYywgb2Zmc2V0KSB7XG5cdFx0XHRqc2MuYXR0YWNoR3JvdXBFdmVudCgnZHJhZycsIGRvYywganNjLl9wb2ludGVyTW92ZUV2ZW50W3BvaW50ZXJUeXBlXSxcblx0XHRcdFx0anNjLm9uRG9jdW1lbnRQb2ludGVyTW92ZShlLCB0YXJnZXQsIGNvbnRyb2xOYW1lLCBwb2ludGVyVHlwZSwgb2Zmc2V0KSk7XG5cdFx0XHRqc2MuYXR0YWNoR3JvdXBFdmVudCgnZHJhZycsIGRvYywganNjLl9wb2ludGVyRW5kRXZlbnRbcG9pbnRlclR5cGVdLFxuXHRcdFx0XHRqc2Mub25Eb2N1bWVudFBvaW50ZXJFbmQoZSwgdGFyZ2V0LCBjb250cm9sTmFtZSwgcG9pbnRlclR5cGUpKTtcblx0XHR9O1xuXG5cdFx0cmVnaXN0ZXJEcmFnRXZlbnRzKGRvY3VtZW50LCBbMCwgMF0pO1xuXG5cdFx0aWYgKHdpbmRvdy5wYXJlbnQgJiYgd2luZG93LmZyYW1lRWxlbWVudCkge1xuXHRcdFx0dmFyIHJlY3QgPSB3aW5kb3cuZnJhbWVFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdFx0dmFyIG9mcyA9IFstcmVjdC5sZWZ0LCAtcmVjdC50b3BdO1xuXHRcdFx0cmVnaXN0ZXJEcmFnRXZlbnRzKHdpbmRvdy5wYXJlbnQud2luZG93LmRvY3VtZW50LCBvZnMpO1xuXHRcdH1cblxuXHRcdHZhciBhYnMgPSBqc2MuZ2V0QWJzUG9pbnRlclBvcyhlKTtcblx0XHR2YXIgcmVsID0ganNjLmdldFJlbFBvaW50ZXJQb3MoZSk7XG5cdFx0anNjLl9wb2ludGVyT3JpZ2luID0ge1xuXHRcdFx0eDogYWJzLnggLSByZWwueCxcblx0XHRcdHk6IGFicy55IC0gcmVsLnlcblx0XHR9O1xuXG5cdFx0c3dpdGNoIChjb250cm9sTmFtZSkge1xuXHRcdGNhc2UgJ3BhZCc6XG5cdFx0XHQvLyBpZiB0aGUgc2xpZGVyIGlzIGF0IHRoZSBib3R0b20sIG1vdmUgaXQgdXBcblx0XHRcdHN3aXRjaCAoanNjLmdldFNsaWRlckNvbXBvbmVudCh0aGlzT2JqKSkge1xuXHRcdFx0Y2FzZSAncyc6IGlmICh0aGlzT2JqLmhzdlsxXSA9PT0gMCkgeyB0aGlzT2JqLmZyb21IU1YobnVsbCwgMTAwLCBudWxsKTsgfTsgYnJlYWs7XG5cdFx0XHRjYXNlICd2JzogaWYgKHRoaXNPYmouaHN2WzJdID09PSAwKSB7IHRoaXNPYmouZnJvbUhTVihudWxsLCBudWxsLCAxMDApOyB9OyBicmVhaztcblx0XHRcdH1cblx0XHRcdGpzYy5zZXRQYWQodGhpc09iaiwgZSwgMCwgMCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgJ3NsZCc6XG5cdFx0XHRqc2Muc2V0U2xkKHRoaXNPYmosIGUsIDApO1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXG5cdFx0anNjLmRpc3BhdGNoRmluZUNoYW5nZSh0aGlzT2JqKTtcblx0fSxcblxuXG5cdG9uRG9jdW1lbnRQb2ludGVyTW92ZSA6IGZ1bmN0aW9uIChlLCB0YXJnZXQsIGNvbnRyb2xOYW1lLCBwb2ludGVyVHlwZSwgb2Zmc2V0KSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChlKSB7XG5cdFx0XHR2YXIgdGhpc09iaiA9IHRhcmdldC5fanNjSW5zdGFuY2U7XG5cdFx0XHRzd2l0Y2ggKGNvbnRyb2xOYW1lKSB7XG5cdFx0XHRjYXNlICdwYWQnOlxuXHRcdFx0XHRpZiAoIWUpIHsgZSA9IHdpbmRvdy5ldmVudDsgfVxuXHRcdFx0XHRqc2Muc2V0UGFkKHRoaXNPYmosIGUsIG9mZnNldFswXSwgb2Zmc2V0WzFdKTtcblx0XHRcdFx0anNjLmRpc3BhdGNoRmluZUNoYW5nZSh0aGlzT2JqKTtcblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdGNhc2UgJ3NsZCc6XG5cdFx0XHRcdGlmICghZSkgeyBlID0gd2luZG93LmV2ZW50OyB9XG5cdFx0XHRcdGpzYy5zZXRTbGQodGhpc09iaiwgZSwgb2Zmc2V0WzFdKTtcblx0XHRcdFx0anNjLmRpc3BhdGNoRmluZUNoYW5nZSh0aGlzT2JqKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0b25Eb2N1bWVudFBvaW50ZXJFbmQgOiBmdW5jdGlvbiAoZSwgdGFyZ2V0LCBjb250cm9sTmFtZSwgcG9pbnRlclR5cGUpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKGUpIHtcblx0XHRcdHZhciB0aGlzT2JqID0gdGFyZ2V0Ll9qc2NJbnN0YW5jZTtcblx0XHRcdGpzYy5kZXRhY2hHcm91cEV2ZW50cygnZHJhZycpO1xuXHRcdFx0anNjLnJlbGVhc2VUYXJnZXQoKTtcblx0XHRcdC8vIEFsd2F5cyBkaXNwYXRjaCBjaGFuZ2VzIGFmdGVyIGRldGFjaGluZyBvdXRzdGFuZGluZyBtb3VzZSBoYW5kbGVycyxcblx0XHRcdC8vIGluIGNhc2Ugc29tZSB1c2VyIGludGVyYWN0aW9uIHdpbGwgb2NjdXIgaW4gdXNlcidzIG9uY2hhbmdlIGNhbGxiYWNrXG5cdFx0XHQvLyB0aGF0IHdvdWxkIGludHJ1ZGUgd2l0aCBjdXJyZW50IG1vdXNlIGV2ZW50c1xuXHRcdFx0anNjLmRpc3BhdGNoQ2hhbmdlKHRoaXNPYmopO1xuXHRcdH07XG5cdH0sXG5cblxuXHRkaXNwYXRjaENoYW5nZSA6IGZ1bmN0aW9uICh0aGlzT2JqKSB7XG5cdFx0aWYgKHRoaXNPYmoudmFsdWVFbGVtZW50KSB7XG5cdFx0XHRpZiAoanNjLmlzRWxlbWVudFR5cGUodGhpc09iai52YWx1ZUVsZW1lbnQsICdpbnB1dCcpKSB7XG5cdFx0XHRcdGpzYy5maXJlRXZlbnQodGhpc09iai52YWx1ZUVsZW1lbnQsICdjaGFuZ2UnKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblxuXHRkaXNwYXRjaEZpbmVDaGFuZ2UgOiBmdW5jdGlvbiAodGhpc09iaikge1xuXHRcdGlmICh0aGlzT2JqLm9uRmluZUNoYW5nZSkge1xuXHRcdFx0dmFyIGNhbGxiYWNrO1xuXHRcdFx0aWYgKHR5cGVvZiB0aGlzT2JqLm9uRmluZUNoYW5nZSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdFx0Y2FsbGJhY2sgPSBuZXcgRnVuY3Rpb24gKHRoaXNPYmoub25GaW5lQ2hhbmdlKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNhbGxiYWNrID0gdGhpc09iai5vbkZpbmVDaGFuZ2U7XG5cdFx0XHR9XG5cdFx0XHRjYWxsYmFjay5jYWxsKHRoaXNPYmopO1xuXHRcdH1cblx0fSxcblxuXG5cdHNldFBhZCA6IGZ1bmN0aW9uICh0aGlzT2JqLCBlLCBvZnNYLCBvZnNZKSB7XG5cdFx0dmFyIHBvaW50ZXJBYnMgPSBqc2MuZ2V0QWJzUG9pbnRlclBvcyhlKTtcblx0XHR2YXIgeCA9IG9mc1ggKyBwb2ludGVyQWJzLnggLSBqc2MuX3BvaW50ZXJPcmlnaW4ueCAtIHRoaXNPYmoucGFkZGluZyAtIHRoaXNPYmouaW5zZXRXaWR0aDtcblx0XHR2YXIgeSA9IG9mc1kgKyBwb2ludGVyQWJzLnkgLSBqc2MuX3BvaW50ZXJPcmlnaW4ueSAtIHRoaXNPYmoucGFkZGluZyAtIHRoaXNPYmouaW5zZXRXaWR0aDtcblxuXHRcdHZhciB4VmFsID0geCAqICgzNjAgLyAodGhpc09iai53aWR0aCAtIDEpKTtcblx0XHR2YXIgeVZhbCA9IDEwMCAtICh5ICogKDEwMCAvICh0aGlzT2JqLmhlaWdodCAtIDEpKSk7XG5cblx0XHRzd2l0Y2ggKGpzYy5nZXRQYWRZQ29tcG9uZW50KHRoaXNPYmopKSB7XG5cdFx0Y2FzZSAncyc6IHRoaXNPYmouZnJvbUhTVih4VmFsLCB5VmFsLCBudWxsLCBqc2MubGVhdmVTbGQpOyBicmVhaztcblx0XHRjYXNlICd2JzogdGhpc09iai5mcm9tSFNWKHhWYWwsIG51bGwsIHlWYWwsIGpzYy5sZWF2ZVNsZCk7IGJyZWFrO1xuXHRcdH1cblx0fSxcblxuXG5cdHNldFNsZCA6IGZ1bmN0aW9uICh0aGlzT2JqLCBlLCBvZnNZKSB7XG5cdFx0dmFyIHBvaW50ZXJBYnMgPSBqc2MuZ2V0QWJzUG9pbnRlclBvcyhlKTtcblx0XHR2YXIgeSA9IG9mc1kgKyBwb2ludGVyQWJzLnkgLSBqc2MuX3BvaW50ZXJPcmlnaW4ueSAtIHRoaXNPYmoucGFkZGluZyAtIHRoaXNPYmouaW5zZXRXaWR0aDtcblxuXHRcdHZhciB5VmFsID0gMTAwIC0gKHkgKiAoMTAwIC8gKHRoaXNPYmouaGVpZ2h0IC0gMSkpKTtcblxuXHRcdHN3aXRjaCAoanNjLmdldFNsaWRlckNvbXBvbmVudCh0aGlzT2JqKSkge1xuXHRcdGNhc2UgJ3MnOiB0aGlzT2JqLmZyb21IU1YobnVsbCwgeVZhbCwgbnVsbCwganNjLmxlYXZlUGFkKTsgYnJlYWs7XG5cdFx0Y2FzZSAndic6IHRoaXNPYmouZnJvbUhTVihudWxsLCBudWxsLCB5VmFsLCBqc2MubGVhdmVQYWQpOyBicmVhaztcblx0XHR9XG5cdH0sXG5cblxuXHRfdm1sTlMgOiAnanNjX3ZtbF8nLFxuXHRfdm1sQ1NTIDogJ2pzY192bWxfY3NzXycsXG5cdF92bWxSZWFkeSA6IGZhbHNlLFxuXG5cblx0aW5pdFZNTCA6IGZ1bmN0aW9uICgpIHtcblx0XHRpZiAoIWpzYy5fdm1sUmVhZHkpIHtcblx0XHRcdC8vIGluaXQgVk1MIG5hbWVzcGFjZVxuXHRcdFx0dmFyIGRvYyA9IGRvY3VtZW50O1xuXHRcdFx0aWYgKCFkb2MubmFtZXNwYWNlc1tqc2MuX3ZtbE5TXSkge1xuXHRcdFx0XHRkb2MubmFtZXNwYWNlcy5hZGQoanNjLl92bWxOUywgJ3VybjpzY2hlbWFzLW1pY3Jvc29mdC1jb206dm1sJyk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIWRvYy5zdHlsZVNoZWV0c1tqc2MuX3ZtbENTU10pIHtcblx0XHRcdFx0dmFyIHRhZ3MgPSBbJ3NoYXBlJywgJ3NoYXBldHlwZScsICdncm91cCcsICdiYWNrZ3JvdW5kJywgJ3BhdGgnLCAnZm9ybXVsYXMnLCAnaGFuZGxlcycsICdmaWxsJywgJ3N0cm9rZScsICdzaGFkb3cnLCAndGV4dGJveCcsICd0ZXh0cGF0aCcsICdpbWFnZWRhdGEnLCAnbGluZScsICdwb2x5bGluZScsICdjdXJ2ZScsICdyZWN0JywgJ3JvdW5kcmVjdCcsICdvdmFsJywgJ2FyYycsICdpbWFnZSddO1xuXHRcdFx0XHR2YXIgc3MgPSBkb2MuY3JlYXRlU3R5bGVTaGVldCgpO1xuXHRcdFx0XHRzcy5vd25pbmdFbGVtZW50LmlkID0ganNjLl92bWxDU1M7XG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGFncy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHRcdHNzLmFkZFJ1bGUoanNjLl92bWxOUyArICdcXFxcOicgKyB0YWdzW2ldLCAnYmVoYXZpb3I6dXJsKCNkZWZhdWx0I1ZNTCk7Jyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGpzYy5fdm1sUmVhZHkgPSB0cnVlO1xuXHRcdH1cblx0fSxcblxuXG5cdGNyZWF0ZVBhbGV0dGUgOiBmdW5jdGlvbiAoKSB7XG5cblx0XHR2YXIgcGFsZXR0ZU9iaiA9IHtcblx0XHRcdGVsbTogbnVsbCxcblx0XHRcdGRyYXc6IG51bGxcblx0XHR9O1xuXG5cdFx0aWYgKGpzYy5pc0NhbnZhc1N1cHBvcnRlZCkge1xuXHRcdFx0Ly8gQ2FudmFzIGltcGxlbWVudGF0aW9uIGZvciBtb2Rlcm4gYnJvd3NlcnNcblxuXHRcdFx0dmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRcdFx0dmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG5cdFx0XHR2YXIgZHJhd0Z1bmMgPSBmdW5jdGlvbiAod2lkdGgsIGhlaWdodCwgdHlwZSkge1xuXHRcdFx0XHRjYW52YXMud2lkdGggPSB3aWR0aDtcblx0XHRcdFx0Y2FudmFzLmhlaWdodCA9IGhlaWdodDtcblxuXHRcdFx0XHRjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cblx0XHRcdFx0dmFyIGhHcmFkID0gY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KDAsIDAsIGNhbnZhcy53aWR0aCwgMCk7XG5cdFx0XHRcdGhHcmFkLmFkZENvbG9yU3RvcCgwIC8gNiwgJyNGMDAnKTtcblx0XHRcdFx0aEdyYWQuYWRkQ29sb3JTdG9wKDEgLyA2LCAnI0ZGMCcpO1xuXHRcdFx0XHRoR3JhZC5hZGRDb2xvclN0b3AoMiAvIDYsICcjMEYwJyk7XG5cdFx0XHRcdGhHcmFkLmFkZENvbG9yU3RvcCgzIC8gNiwgJyMwRkYnKTtcblx0XHRcdFx0aEdyYWQuYWRkQ29sb3JTdG9wKDQgLyA2LCAnIzAwRicpO1xuXHRcdFx0XHRoR3JhZC5hZGRDb2xvclN0b3AoNSAvIDYsICcjRjBGJyk7XG5cdFx0XHRcdGhHcmFkLmFkZENvbG9yU3RvcCg2IC8gNiwgJyNGMDAnKTtcblxuXHRcdFx0XHRjdHguZmlsbFN0eWxlID0gaEdyYWQ7XG5cdFx0XHRcdGN0eC5maWxsUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXG5cdFx0XHRcdHZhciB2R3JhZCA9IGN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudCgwLCAwLCAwLCBjYW52YXMuaGVpZ2h0KTtcblx0XHRcdFx0c3dpdGNoICh0eXBlLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRcdFx0Y2FzZSAncyc6XG5cdFx0XHRcdFx0dkdyYWQuYWRkQ29sb3JTdG9wKDAsICdyZ2JhKDI1NSwyNTUsMjU1LDApJyk7XG5cdFx0XHRcdFx0dkdyYWQuYWRkQ29sb3JTdG9wKDEsICdyZ2JhKDI1NSwyNTUsMjU1LDEpJyk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3YnOlxuXHRcdFx0XHRcdHZHcmFkLmFkZENvbG9yU3RvcCgwLCAncmdiYSgwLDAsMCwwKScpO1xuXHRcdFx0XHRcdHZHcmFkLmFkZENvbG9yU3RvcCgxLCAncmdiYSgwLDAsMCwxKScpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSB2R3JhZDtcblx0XHRcdFx0Y3R4LmZpbGxSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cdFx0XHR9O1xuXG5cdFx0XHRwYWxldHRlT2JqLmVsbSA9IGNhbnZhcztcblx0XHRcdHBhbGV0dGVPYmouZHJhdyA9IGRyYXdGdW5jO1xuXG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIFZNTCBmYWxsYmFjayBmb3IgSUUgNyBhbmQgOFxuXG5cdFx0XHRqc2MuaW5pdFZNTCgpO1xuXG5cdFx0XHR2YXIgdm1sQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0XHR2bWxDb250YWluZXIuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuXHRcdFx0dm1sQ29udGFpbmVyLnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG5cblx0XHRcdHZhciBoR3JhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoanNjLl92bWxOUyArICc6ZmlsbCcpO1xuXHRcdFx0aEdyYWQudHlwZSA9ICdncmFkaWVudCc7XG5cdFx0XHRoR3JhZC5tZXRob2QgPSAnbGluZWFyJztcblx0XHRcdGhHcmFkLmFuZ2xlID0gJzkwJztcblx0XHRcdGhHcmFkLmNvbG9ycyA9ICcxNi42NyUgI0YwRiwgMzMuMzMlICMwMEYsIDUwJSAjMEZGLCA2Ni42NyUgIzBGMCwgODMuMzMlICNGRjAnXG5cblx0XHRcdHZhciBoUmVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoanNjLl92bWxOUyArICc6cmVjdCcpO1xuXHRcdFx0aFJlY3Quc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0aFJlY3Quc3R5bGUubGVmdCA9IC0xICsgJ3B4Jztcblx0XHRcdGhSZWN0LnN0eWxlLnRvcCA9IC0xICsgJ3B4Jztcblx0XHRcdGhSZWN0LnN0cm9rZWQgPSBmYWxzZTtcblx0XHRcdGhSZWN0LmFwcGVuZENoaWxkKGhHcmFkKTtcblx0XHRcdHZtbENvbnRhaW5lci5hcHBlbmRDaGlsZChoUmVjdCk7XG5cblx0XHRcdHZhciB2R3JhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoanNjLl92bWxOUyArICc6ZmlsbCcpO1xuXHRcdFx0dkdyYWQudHlwZSA9ICdncmFkaWVudCc7XG5cdFx0XHR2R3JhZC5tZXRob2QgPSAnbGluZWFyJztcblx0XHRcdHZHcmFkLmFuZ2xlID0gJzE4MCc7XG5cdFx0XHR2R3JhZC5vcGFjaXR5ID0gJzAnO1xuXG5cdFx0XHR2YXIgdlJlY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGpzYy5fdm1sTlMgKyAnOnJlY3QnKTtcblx0XHRcdHZSZWN0LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHZSZWN0LnN0eWxlLmxlZnQgPSAtMSArICdweCc7XG5cdFx0XHR2UmVjdC5zdHlsZS50b3AgPSAtMSArICdweCc7XG5cdFx0XHR2UmVjdC5zdHJva2VkID0gZmFsc2U7XG5cdFx0XHR2UmVjdC5hcHBlbmRDaGlsZCh2R3JhZCk7XG5cdFx0XHR2bWxDb250YWluZXIuYXBwZW5kQ2hpbGQodlJlY3QpO1xuXG5cdFx0XHR2YXIgZHJhd0Z1bmMgPSBmdW5jdGlvbiAod2lkdGgsIGhlaWdodCwgdHlwZSkge1xuXHRcdFx0XHR2bWxDb250YWluZXIuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG5cdFx0XHRcdHZtbENvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xuXG5cdFx0XHRcdGhSZWN0LnN0eWxlLndpZHRoID1cblx0XHRcdFx0dlJlY3Quc3R5bGUud2lkdGggPVxuXHRcdFx0XHRcdCh3aWR0aCArIDEpICsgJ3B4Jztcblx0XHRcdFx0aFJlY3Quc3R5bGUuaGVpZ2h0ID1cblx0XHRcdFx0dlJlY3Quc3R5bGUuaGVpZ2h0ID1cblx0XHRcdFx0XHQoaGVpZ2h0ICsgMSkgKyAncHgnO1xuXG5cdFx0XHRcdC8vIENvbG9ycyBtdXN0IGJlIHNwZWNpZmllZCBkdXJpbmcgZXZlcnkgcmVkcmF3LCBvdGhlcndpc2UgSUUgd29uJ3QgZGlzcGxheVxuXHRcdFx0XHQvLyBhIGZ1bGwgZ3JhZGllbnQgZHVyaW5nIGEgc3Vic2VxdWVudGlhbCByZWRyYXdcblx0XHRcdFx0aEdyYWQuY29sb3IgPSAnI0YwMCc7XG5cdFx0XHRcdGhHcmFkLmNvbG9yMiA9ICcjRjAwJztcblxuXHRcdFx0XHRzd2l0Y2ggKHR5cGUudG9Mb3dlckNhc2UoKSkge1xuXHRcdFx0XHRjYXNlICdzJzpcblx0XHRcdFx0XHR2R3JhZC5jb2xvciA9IHZHcmFkLmNvbG9yMiA9ICcjRkZGJztcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAndic6XG5cdFx0XHRcdFx0dkdyYWQuY29sb3IgPSB2R3JhZC5jb2xvcjIgPSAnIzAwMCc7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0XHRcblx0XHRcdHBhbGV0dGVPYmouZWxtID0gdm1sQ29udGFpbmVyO1xuXHRcdFx0cGFsZXR0ZU9iai5kcmF3ID0gZHJhd0Z1bmM7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHBhbGV0dGVPYmo7XG5cdH0sXG5cblxuXHRjcmVhdGVTbGlkZXJHcmFkaWVudCA6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHZhciBzbGlkZXJPYmogPSB7XG5cdFx0XHRlbG06IG51bGwsXG5cdFx0XHRkcmF3OiBudWxsXG5cdFx0fTtcblxuXHRcdGlmIChqc2MuaXNDYW52YXNTdXBwb3J0ZWQpIHtcblx0XHRcdC8vIENhbnZhcyBpbXBsZW1lbnRhdGlvbiBmb3IgbW9kZXJuIGJyb3dzZXJzXG5cblx0XHRcdHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblx0XHRcdHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuXHRcdFx0dmFyIGRyYXdGdW5jID0gZnVuY3Rpb24gKHdpZHRoLCBoZWlnaHQsIGNvbG9yMSwgY29sb3IyKSB7XG5cdFx0XHRcdGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuXHRcdFx0XHRjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG5cdFx0XHRcdGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblxuXHRcdFx0XHR2YXIgZ3JhZCA9IGN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudCgwLCAwLCAwLCBjYW52YXMuaGVpZ2h0KTtcblx0XHRcdFx0Z3JhZC5hZGRDb2xvclN0b3AoMCwgY29sb3IxKTtcblx0XHRcdFx0Z3JhZC5hZGRDb2xvclN0b3AoMSwgY29sb3IyKTtcblxuXHRcdFx0XHRjdHguZmlsbFN0eWxlID0gZ3JhZDtcblx0XHRcdFx0Y3R4LmZpbGxSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cdFx0XHR9O1xuXG5cdFx0XHRzbGlkZXJPYmouZWxtID0gY2FudmFzO1xuXHRcdFx0c2xpZGVyT2JqLmRyYXcgPSBkcmF3RnVuYztcblxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBWTUwgZmFsbGJhY2sgZm9yIElFIDcgYW5kIDhcblxuXHRcdFx0anNjLmluaXRWTUwoKTtcblxuXHRcdFx0dmFyIHZtbENvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdFx0dm1sQ29udGFpbmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcblx0XHRcdHZtbENvbnRhaW5lci5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuXG5cdFx0XHR2YXIgZ3JhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoanNjLl92bWxOUyArICc6ZmlsbCcpO1xuXHRcdFx0Z3JhZC50eXBlID0gJ2dyYWRpZW50Jztcblx0XHRcdGdyYWQubWV0aG9kID0gJ2xpbmVhcic7XG5cdFx0XHRncmFkLmFuZ2xlID0gJzE4MCc7XG5cblx0XHRcdHZhciByZWN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChqc2MuX3ZtbE5TICsgJzpyZWN0Jyk7XG5cdFx0XHRyZWN0LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHJlY3Quc3R5bGUubGVmdCA9IC0xICsgJ3B4Jztcblx0XHRcdHJlY3Quc3R5bGUudG9wID0gLTEgKyAncHgnO1xuXHRcdFx0cmVjdC5zdHJva2VkID0gZmFsc2U7XG5cdFx0XHRyZWN0LmFwcGVuZENoaWxkKGdyYWQpO1xuXHRcdFx0dm1sQ29udGFpbmVyLmFwcGVuZENoaWxkKHJlY3QpO1xuXG5cdFx0XHR2YXIgZHJhd0Z1bmMgPSBmdW5jdGlvbiAod2lkdGgsIGhlaWdodCwgY29sb3IxLCBjb2xvcjIpIHtcblx0XHRcdFx0dm1sQ29udGFpbmVyLnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xuXHRcdFx0XHR2bWxDb250YWluZXIuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgJ3B4JztcblxuXHRcdFx0XHRyZWN0LnN0eWxlLndpZHRoID0gKHdpZHRoICsgMSkgKyAncHgnO1xuXHRcdFx0XHRyZWN0LnN0eWxlLmhlaWdodCA9IChoZWlnaHQgKyAxKSArICdweCc7XG5cblx0XHRcdFx0Z3JhZC5jb2xvciA9IGNvbG9yMTtcblx0XHRcdFx0Z3JhZC5jb2xvcjIgPSBjb2xvcjI7XG5cdFx0XHR9O1xuXHRcdFx0XG5cdFx0XHRzbGlkZXJPYmouZWxtID0gdm1sQ29udGFpbmVyO1xuXHRcdFx0c2xpZGVyT2JqLmRyYXcgPSBkcmF3RnVuYztcblx0XHR9XG5cblx0XHRyZXR1cm4gc2xpZGVyT2JqO1xuXHR9LFxuXG5cblx0bGVhdmVWYWx1ZSA6IDE8PDAsXG5cdGxlYXZlU3R5bGUgOiAxPDwxLFxuXHRsZWF2ZVBhZCA6IDE8PDIsXG5cdGxlYXZlU2xkIDogMTw8MyxcblxuXG5cdEJveFNoYWRvdyA6IChmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIEJveFNoYWRvdyA9IGZ1bmN0aW9uIChoU2hhZG93LCB2U2hhZG93LCBibHVyLCBzcHJlYWQsIGNvbG9yLCBpbnNldCkge1xuXHRcdFx0dGhpcy5oU2hhZG93ID0gaFNoYWRvdztcblx0XHRcdHRoaXMudlNoYWRvdyA9IHZTaGFkb3c7XG5cdFx0XHR0aGlzLmJsdXIgPSBibHVyO1xuXHRcdFx0dGhpcy5zcHJlYWQgPSBzcHJlYWQ7XG5cdFx0XHR0aGlzLmNvbG9yID0gY29sb3I7XG5cdFx0XHR0aGlzLmluc2V0ID0gISFpbnNldDtcblx0XHR9O1xuXG5cdFx0Qm94U2hhZG93LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciB2YWxzID0gW1xuXHRcdFx0XHRNYXRoLnJvdW5kKHRoaXMuaFNoYWRvdykgKyAncHgnLFxuXHRcdFx0XHRNYXRoLnJvdW5kKHRoaXMudlNoYWRvdykgKyAncHgnLFxuXHRcdFx0XHRNYXRoLnJvdW5kKHRoaXMuYmx1cikgKyAncHgnLFxuXHRcdFx0XHRNYXRoLnJvdW5kKHRoaXMuc3ByZWFkKSArICdweCcsXG5cdFx0XHRcdHRoaXMuY29sb3Jcblx0XHRcdF07XG5cdFx0XHRpZiAodGhpcy5pbnNldCkge1xuXHRcdFx0XHR2YWxzLnB1c2goJ2luc2V0Jyk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdmFscy5qb2luKCcgJyk7XG5cdFx0fTtcblxuXHRcdHJldHVybiBCb3hTaGFkb3c7XG5cdH0pKCksXG5cblxuXHQvL1xuXHQvLyBVc2FnZTpcblx0Ly8gdmFyIG15Q29sb3IgPSBuZXcganNjb2xvcig8dGFyZ2V0RWxlbWVudD4gWywgPG9wdGlvbnM+XSlcblx0Ly9cblxuXHRqc2NvbG9yIDogZnVuY3Rpb24gKHRhcmdldEVsZW1lbnQsIG9wdGlvbnMpIHtcblxuXHRcdC8vIEdlbmVyYWwgb3B0aW9uc1xuXHRcdC8vXG5cdFx0dGhpcy52YWx1ZSA9IG51bGw7IC8vIGluaXRpYWwgSEVYIGNvbG9yLiBUbyBjaGFuZ2UgaXQgbGF0ZXIsIHVzZSBtZXRob2RzIGZyb21TdHJpbmcoKSwgZnJvbUhTVigpIGFuZCBmcm9tUkdCKClcblx0XHR0aGlzLnZhbHVlRWxlbWVudCA9IHRhcmdldEVsZW1lbnQ7IC8vIGVsZW1lbnQgdGhhdCB3aWxsIGJlIHVzZWQgdG8gZGlzcGxheSBhbmQgaW5wdXQgdGhlIGNvbG9yIGNvZGVcblx0XHR0aGlzLnN0eWxlRWxlbWVudCA9IHRhcmdldEVsZW1lbnQ7IC8vIGVsZW1lbnQgdGhhdCB3aWxsIHByZXZpZXcgdGhlIHBpY2tlZCBjb2xvciB1c2luZyBDU1MgYmFja2dyb3VuZENvbG9yXG5cdFx0dGhpcy5yZXF1aXJlZCA9IHRydWU7IC8vIHdoZXRoZXIgdGhlIGFzc29jaWF0ZWQgdGV4dCA8aW5wdXQ+IGNhbiBiZSBsZWZ0IGVtcHR5XG5cdFx0dGhpcy5yZWZpbmUgPSB0cnVlOyAvLyB3aGV0aGVyIHRvIHJlZmluZSB0aGUgZW50ZXJlZCBjb2xvciBjb2RlIChlLmcuIHVwcGVyY2FzZSBpdCBhbmQgcmVtb3ZlIHdoaXRlc3BhY2UpXG5cdFx0dGhpcy5oYXNoID0gZmFsc2U7IC8vIHdoZXRoZXIgdG8gcHJlZml4IHRoZSBIRVggY29sb3IgY29kZSB3aXRoICMgc3ltYm9sXG5cdFx0dGhpcy51cHBlcmNhc2UgPSB0cnVlOyAvLyB3aGV0aGVyIHRvIHVwcGVyY2FzZSB0aGUgY29sb3IgY29kZVxuXHRcdHRoaXMub25GaW5lQ2hhbmdlID0gbnVsbDsgLy8gY2FsbGVkIGluc3RhbnRseSBldmVyeSB0aW1lIHRoZSBjb2xvciBjaGFuZ2VzICh2YWx1ZSBjYW4gYmUgZWl0aGVyIGEgZnVuY3Rpb24gb3IgYSBzdHJpbmcgd2l0aCBqYXZhc2NyaXB0IGNvZGUpXG5cdFx0dGhpcy5hY3RpdmVDbGFzcyA9ICdqc2NvbG9yLWFjdGl2ZSc7IC8vIGNsYXNzIHRvIGJlIHNldCB0byB0aGUgdGFyZ2V0IGVsZW1lbnQgd2hlbiBhIHBpY2tlciB3aW5kb3cgaXMgb3BlbiBvbiBpdFxuXHRcdHRoaXMubWluUyA9IDA7IC8vIG1pbiBhbGxvd2VkIHNhdHVyYXRpb24gKDAgLSAxMDApXG5cdFx0dGhpcy5tYXhTID0gMTAwOyAvLyBtYXggYWxsb3dlZCBzYXR1cmF0aW9uICgwIC0gMTAwKVxuXHRcdHRoaXMubWluViA9IDA7IC8vIG1pbiBhbGxvd2VkIHZhbHVlIChicmlnaHRuZXNzKSAoMCAtIDEwMClcblx0XHR0aGlzLm1heFYgPSAxMDA7IC8vIG1heCBhbGxvd2VkIHZhbHVlIChicmlnaHRuZXNzKSAoMCAtIDEwMClcblxuXHRcdC8vIEFjY2Vzc2luZyB0aGUgcGlja2VkIGNvbG9yXG5cdFx0Ly9cblx0XHR0aGlzLmhzdiA9IFswLCAwLCAxMDBdOyAvLyByZWFkLW9ubHkgIFswLTM2MCwgMC0xMDAsIDAtMTAwXVxuXHRcdHRoaXMucmdiID0gWzI1NSwgMjU1LCAyNTVdOyAvLyByZWFkLW9ubHkgIFswLTI1NSwgMC0yNTUsIDAtMjU1XVxuXG5cdFx0Ly8gQ29sb3IgUGlja2VyIG9wdGlvbnNcblx0XHQvL1xuXHRcdHRoaXMud2lkdGggPSAxODE7IC8vIHdpZHRoIG9mIGNvbG9yIHBhbGV0dGUgKGluIHB4KVxuXHRcdHRoaXMuaGVpZ2h0ID0gMTAxOyAvLyBoZWlnaHQgb2YgY29sb3IgcGFsZXR0ZSAoaW4gcHgpXG5cdFx0dGhpcy5zaG93T25DbGljayA9IHRydWU7IC8vIHdoZXRoZXIgdG8gZGlzcGxheSB0aGUgY29sb3IgcGlja2VyIHdoZW4gdXNlciBjbGlja3Mgb24gaXRzIHRhcmdldCBlbGVtZW50XG5cdFx0dGhpcy5tb2RlID0gJ0hTVic7IC8vIEhTViB8IEhWUyB8IEhTIHwgSFYgLSBsYXlvdXQgb2YgdGhlIGNvbG9yIHBpY2tlciBjb250cm9sc1xuXHRcdHRoaXMucG9zaXRpb24gPSAnYm90dG9tJzsgLy8gbGVmdCB8IHJpZ2h0IHwgdG9wIHwgYm90dG9tIC0gcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIHRhcmdldCBlbGVtZW50XG5cdFx0dGhpcy5zbWFydFBvc2l0aW9uID0gdHJ1ZTsgLy8gYXV0b21hdGljYWxseSBjaGFuZ2UgcGlja2VyIHBvc2l0aW9uIHdoZW4gdGhlcmUgaXMgbm90IGVub3VnaCBzcGFjZSBmb3IgaXRcblx0XHR0aGlzLnNsaWRlclNpemUgPSAxNjsgLy8gcHhcblx0XHR0aGlzLmNyb3NzU2l6ZSA9IDg7IC8vIHB4XG5cdFx0dGhpcy5jbG9zYWJsZSA9IGZhbHNlOyAvLyB3aGV0aGVyIHRvIGRpc3BsYXkgdGhlIENsb3NlIGJ1dHRvblxuXHRcdHRoaXMuY2xvc2VUZXh0ID0gJ0Nsb3NlJztcblx0XHR0aGlzLmJ1dHRvbkNvbG9yID0gJyMwMDAwMDAnOyAvLyBDU1MgY29sb3Jcblx0XHR0aGlzLmJ1dHRvbkhlaWdodCA9IDE4OyAvLyBweFxuXHRcdHRoaXMucGFkZGluZyA9IDEyOyAvLyBweFxuXHRcdHRoaXMuYmFja2dyb3VuZENvbG9yID0gJyNGRkZGRkYnOyAvLyBDU1MgY29sb3Jcblx0XHR0aGlzLmJvcmRlcldpZHRoID0gMTsgLy8gcHhcblx0XHR0aGlzLmJvcmRlckNvbG9yID0gJyNCQkJCQkInOyAvLyBDU1MgY29sb3Jcblx0XHR0aGlzLmJvcmRlclJhZGl1cyA9IDg7IC8vIHB4XG5cdFx0dGhpcy5pbnNldFdpZHRoID0gMTsgLy8gcHhcblx0XHR0aGlzLmluc2V0Q29sb3IgPSAnI0JCQkJCQic7IC8vIENTUyBjb2xvclxuXHRcdHRoaXMuc2hhZG93ID0gdHJ1ZTsgLy8gd2hldGhlciB0byBkaXNwbGF5IHNoYWRvd1xuXHRcdHRoaXMuc2hhZG93Qmx1ciA9IDE1OyAvLyBweFxuXHRcdHRoaXMuc2hhZG93Q29sb3IgPSAncmdiYSgwLDAsMCwwLjIpJzsgLy8gQ1NTIGNvbG9yXG5cdFx0dGhpcy5wb2ludGVyQ29sb3IgPSAnIzRDNEM0Qyc7IC8vIHB4XG5cdFx0dGhpcy5wb2ludGVyQm9yZGVyQ29sb3IgPSAnI0ZGRkZGRic7IC8vIHB4XG4gICAgICAgIHRoaXMucG9pbnRlckJvcmRlcldpZHRoID0gMTsgLy8gcHhcbiAgICAgICAgdGhpcy5wb2ludGVyVGhpY2tuZXNzID0gMjsgLy8gcHhcblx0XHR0aGlzLnpJbmRleCA9IDEwMDA7XG5cdFx0dGhpcy5jb250YWluZXIgPSBudWxsOyAvLyB3aGVyZSB0byBhcHBlbmQgdGhlIGNvbG9yIHBpY2tlciAoQk9EWSBlbGVtZW50IGJ5IGRlZmF1bHQpXG5cblxuXHRcdGZvciAodmFyIG9wdCBpbiBvcHRpb25zKSB7XG5cdFx0XHRpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShvcHQpKSB7XG5cdFx0XHRcdHRoaXNbb3B0XSA9IG9wdGlvbnNbb3B0XTtcblx0XHRcdH1cblx0XHR9XG5cblxuXHRcdHRoaXMuaGlkZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChpc1BpY2tlck93bmVyKCkpIHtcblx0XHRcdFx0ZGV0YWNoUGlja2VyKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXG5cdFx0dGhpcy5zaG93ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0ZHJhd1BpY2tlcigpO1xuXHRcdH07XG5cblxuXHRcdHRoaXMucmVkcmF3ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKGlzUGlja2VyT3duZXIoKSkge1xuXHRcdFx0XHRkcmF3UGlja2VyKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXG5cdFx0dGhpcy5pbXBvcnRDb2xvciA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmICghdGhpcy52YWx1ZUVsZW1lbnQpIHtcblx0XHRcdFx0dGhpcy5leHBvcnRDb2xvcigpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYgKGpzYy5pc0VsZW1lbnRUeXBlKHRoaXMudmFsdWVFbGVtZW50LCAnaW5wdXQnKSkge1xuXHRcdFx0XHRcdGlmICghdGhpcy5yZWZpbmUpIHtcblx0XHRcdFx0XHRcdGlmICghdGhpcy5mcm9tU3RyaW5nKHRoaXMudmFsdWVFbGVtZW50LnZhbHVlLCBqc2MubGVhdmVWYWx1ZSkpIHtcblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuc3R5bGVFbGVtZW50KSB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gdGhpcy5zdHlsZUVsZW1lbnQuX2pzY09yaWdTdHlsZS5iYWNrZ3JvdW5kSW1hZ2U7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gdGhpcy5zdHlsZUVsZW1lbnQuX2pzY09yaWdTdHlsZS5iYWNrZ3JvdW5kQ29sb3I7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuY29sb3IgPSB0aGlzLnN0eWxlRWxlbWVudC5fanNjT3JpZ1N0eWxlLmNvbG9yO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdHRoaXMuZXhwb3J0Q29sb3IoanNjLmxlYXZlVmFsdWUgfCBqc2MubGVhdmVTdHlsZSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBlbHNlIGlmICghdGhpcy5yZXF1aXJlZCAmJiAvXlxccyokLy50ZXN0KHRoaXMudmFsdWVFbGVtZW50LnZhbHVlKSkge1xuXHRcdFx0XHRcdFx0dGhpcy52YWx1ZUVsZW1lbnQudmFsdWUgPSAnJztcblx0XHRcdFx0XHRcdGlmICh0aGlzLnN0eWxlRWxlbWVudCkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLnN0eWxlRWxlbWVudC5fanNjT3JpZ1N0eWxlLmJhY2tncm91bmRJbWFnZTtcblx0XHRcdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gdGhpcy5zdHlsZUVsZW1lbnQuX2pzY09yaWdTdHlsZS5iYWNrZ3JvdW5kQ29sb3I7XG5cdFx0XHRcdFx0XHRcdHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmNvbG9yID0gdGhpcy5zdHlsZUVsZW1lbnQuX2pzY09yaWdTdHlsZS5jb2xvcjtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHRoaXMuZXhwb3J0Q29sb3IoanNjLmxlYXZlVmFsdWUgfCBqc2MubGVhdmVTdHlsZSk7XG5cblx0XHRcdFx0XHR9IGVsc2UgaWYgKHRoaXMuZnJvbVN0cmluZyh0aGlzLnZhbHVlRWxlbWVudC52YWx1ZSkpIHtcblx0XHRcdFx0XHRcdC8vIG1hbmFnZWQgdG8gaW1wb3J0IGNvbG9yIHN1Y2Nlc3NmdWxseSBmcm9tIHRoZSB2YWx1ZSAtPiBPSywgZG9uJ3QgZG8gYW55dGhpbmdcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dGhpcy5leHBvcnRDb2xvcigpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBub3QgYW4gaW5wdXQgZWxlbWVudCAtPiBkb2Vzbid0IGhhdmUgYW55IHZhbHVlXG5cdFx0XHRcdFx0dGhpcy5leHBvcnRDb2xvcigpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblxuXG5cdFx0dGhpcy5leHBvcnRDb2xvciA9IGZ1bmN0aW9uIChmbGFncykge1xuXHRcdFx0aWYgKCEoZmxhZ3MgJiBqc2MubGVhdmVWYWx1ZSkgJiYgdGhpcy52YWx1ZUVsZW1lbnQpIHtcblx0XHRcdFx0dmFyIHZhbHVlID0gdGhpcy50b1N0cmluZygpO1xuXHRcdFx0XHRpZiAodGhpcy51cHBlcmNhc2UpIHsgdmFsdWUgPSB2YWx1ZS50b1VwcGVyQ2FzZSgpOyB9XG5cdFx0XHRcdGlmICh0aGlzLmhhc2gpIHsgdmFsdWUgPSAnIycgKyB2YWx1ZTsgfVxuXG5cdFx0XHRcdGlmIChqc2MuaXNFbGVtZW50VHlwZSh0aGlzLnZhbHVlRWxlbWVudCwgJ2lucHV0JykpIHtcblx0XHRcdFx0XHR0aGlzLnZhbHVlRWxlbWVudC52YWx1ZSA9IHZhbHVlO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMudmFsdWVFbGVtZW50LmlubmVySFRNTCA9IHZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZiAoIShmbGFncyAmIGpzYy5sZWF2ZVN0eWxlKSkge1xuXHRcdFx0XHRpZiAodGhpcy5zdHlsZUVsZW1lbnQpIHtcblx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSAnbm9uZSc7XG5cdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyMnICsgdGhpcy50b1N0cmluZygpO1xuXHRcdFx0XHRcdHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmNvbG9yID0gdGhpcy5pc0xpZ2h0KCkgPyAnIzAwMCcgOiAnI0ZGRic7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmICghKGZsYWdzICYganNjLmxlYXZlUGFkKSAmJiBpc1BpY2tlck93bmVyKCkpIHtcblx0XHRcdFx0cmVkcmF3UGFkKCk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIShmbGFncyAmIGpzYy5sZWF2ZVNsZCkgJiYgaXNQaWNrZXJPd25lcigpKSB7XG5cdFx0XHRcdHJlZHJhd1NsZCgpO1xuXHRcdFx0fVxuXHRcdH07XG5cblxuXHRcdC8vIGg6IDAtMzYwXG5cdFx0Ly8gczogMC0xMDBcblx0XHQvLyB2OiAwLTEwMFxuXHRcdC8vXG5cdFx0dGhpcy5mcm9tSFNWID0gZnVuY3Rpb24gKGgsIHMsIHYsIGZsYWdzKSB7IC8vIG51bGwgPSBkb24ndCBjaGFuZ2Vcblx0XHRcdGlmIChoICE9PSBudWxsKSB7XG5cdFx0XHRcdGlmIChpc05hTihoKSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdFx0aCA9IE1hdGgubWF4KDAsIE1hdGgubWluKDM2MCwgaCkpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHMgIT09IG51bGwpIHtcblx0XHRcdFx0aWYgKGlzTmFOKHMpKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0XHRzID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMTAwLCB0aGlzLm1heFMsIHMpLCB0aGlzLm1pblMpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHYgIT09IG51bGwpIHtcblx0XHRcdFx0aWYgKGlzTmFOKHYpKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0XHR2ID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMTAwLCB0aGlzLm1heFYsIHYpLCB0aGlzLm1pblYpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLnJnYiA9IEhTVl9SR0IoXG5cdFx0XHRcdGg9PT1udWxsID8gdGhpcy5oc3ZbMF0gOiAodGhpcy5oc3ZbMF09aCksXG5cdFx0XHRcdHM9PT1udWxsID8gdGhpcy5oc3ZbMV0gOiAodGhpcy5oc3ZbMV09cyksXG5cdFx0XHRcdHY9PT1udWxsID8gdGhpcy5oc3ZbMl0gOiAodGhpcy5oc3ZbMl09dilcblx0XHRcdCk7XG5cblx0XHRcdHRoaXMuZXhwb3J0Q29sb3IoZmxhZ3MpO1xuXHRcdH07XG5cblxuXHRcdC8vIHI6IDAtMjU1XG5cdFx0Ly8gZzogMC0yNTVcblx0XHQvLyBiOiAwLTI1NVxuXHRcdC8vXG5cdFx0dGhpcy5mcm9tUkdCID0gZnVuY3Rpb24gKHIsIGcsIGIsIGZsYWdzKSB7IC8vIG51bGwgPSBkb24ndCBjaGFuZ2Vcblx0XHRcdGlmIChyICE9PSBudWxsKSB7XG5cdFx0XHRcdGlmIChpc05hTihyKSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdFx0ciA9IE1hdGgubWF4KDAsIE1hdGgubWluKDI1NSwgcikpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGcgIT09IG51bGwpIHtcblx0XHRcdFx0aWYgKGlzTmFOKGcpKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0XHRnID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMjU1LCBnKSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoYiAhPT0gbnVsbCkge1xuXHRcdFx0XHRpZiAoaXNOYU4oYikpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRcdGIgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigyNTUsIGIpKTtcblx0XHRcdH1cblxuXHRcdFx0dmFyIGhzdiA9IFJHQl9IU1YoXG5cdFx0XHRcdHI9PT1udWxsID8gdGhpcy5yZ2JbMF0gOiByLFxuXHRcdFx0XHRnPT09bnVsbCA/IHRoaXMucmdiWzFdIDogZyxcblx0XHRcdFx0Yj09PW51bGwgPyB0aGlzLnJnYlsyXSA6IGJcblx0XHRcdCk7XG5cdFx0XHRpZiAoaHN2WzBdICE9PSBudWxsKSB7XG5cdFx0XHRcdHRoaXMuaHN2WzBdID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMzYwLCBoc3ZbMF0pKTtcblx0XHRcdH1cblx0XHRcdGlmIChoc3ZbMl0gIT09IDApIHtcblx0XHRcdFx0dGhpcy5oc3ZbMV0gPSBoc3ZbMV09PT1udWxsID8gbnVsbCA6IE1hdGgubWF4KDAsIHRoaXMubWluUywgTWF0aC5taW4oMTAwLCB0aGlzLm1heFMsIGhzdlsxXSkpO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5oc3ZbMl0gPSBoc3ZbMl09PT1udWxsID8gbnVsbCA6IE1hdGgubWF4KDAsIHRoaXMubWluViwgTWF0aC5taW4oMTAwLCB0aGlzLm1heFYsIGhzdlsyXSkpO1xuXG5cdFx0XHQvLyB1cGRhdGUgUkdCIGFjY29yZGluZyB0byBmaW5hbCBIU1YsIGFzIHNvbWUgdmFsdWVzIG1pZ2h0IGJlIHRyaW1tZWRcblx0XHRcdHZhciByZ2IgPSBIU1ZfUkdCKHRoaXMuaHN2WzBdLCB0aGlzLmhzdlsxXSwgdGhpcy5oc3ZbMl0pO1xuXHRcdFx0dGhpcy5yZ2JbMF0gPSByZ2JbMF07XG5cdFx0XHR0aGlzLnJnYlsxXSA9IHJnYlsxXTtcblx0XHRcdHRoaXMucmdiWzJdID0gcmdiWzJdO1xuXG5cdFx0XHR0aGlzLmV4cG9ydENvbG9yKGZsYWdzKTtcblx0XHR9O1xuXG5cblx0XHR0aGlzLmZyb21TdHJpbmcgPSBmdW5jdGlvbiAoc3RyLCBmbGFncykge1xuXHRcdFx0dmFyIG07XG5cdFx0XHRpZiAobSA9IHN0ci5tYXRjaCgvXlxcVyooWzAtOUEtRl17M30oWzAtOUEtRl17M30pPylcXFcqJC9pKSkge1xuXHRcdFx0XHQvLyBIRVggbm90YXRpb25cblx0XHRcdFx0Ly9cblxuXHRcdFx0XHRpZiAobVsxXS5sZW5ndGggPT09IDYpIHtcblx0XHRcdFx0XHQvLyA2LWNoYXIgbm90YXRpb25cblx0XHRcdFx0XHR0aGlzLmZyb21SR0IoXG5cdFx0XHRcdFx0XHRwYXJzZUludChtWzFdLnN1YnN0cigwLDIpLDE2KSxcblx0XHRcdFx0XHRcdHBhcnNlSW50KG1bMV0uc3Vic3RyKDIsMiksMTYpLFxuXHRcdFx0XHRcdFx0cGFyc2VJbnQobVsxXS5zdWJzdHIoNCwyKSwxNiksXG5cdFx0XHRcdFx0XHRmbGFnc1xuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gMy1jaGFyIG5vdGF0aW9uXG5cdFx0XHRcdFx0dGhpcy5mcm9tUkdCKFxuXHRcdFx0XHRcdFx0cGFyc2VJbnQobVsxXS5jaGFyQXQoMCkgKyBtWzFdLmNoYXJBdCgwKSwxNiksXG5cdFx0XHRcdFx0XHRwYXJzZUludChtWzFdLmNoYXJBdCgxKSArIG1bMV0uY2hhckF0KDEpLDE2KSxcblx0XHRcdFx0XHRcdHBhcnNlSW50KG1bMV0uY2hhckF0KDIpICsgbVsxXS5jaGFyQXQoMiksMTYpLFxuXHRcdFx0XHRcdFx0ZmxhZ3Ncblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXG5cdFx0XHR9IGVsc2UgaWYgKG0gPSBzdHIubWF0Y2goL15cXFcqcmdiYT9cXCgoW14pXSopXFwpXFxXKiQvaSkpIHtcblx0XHRcdFx0dmFyIHBhcmFtcyA9IG1bMV0uc3BsaXQoJywnKTtcblx0XHRcdFx0dmFyIHJlID0gL15cXHMqKFxcZCopKFxcLlxcZCspP1xccyokLztcblx0XHRcdFx0dmFyIG1SLCBtRywgbUI7XG5cdFx0XHRcdGlmIChcblx0XHRcdFx0XHRwYXJhbXMubGVuZ3RoID49IDMgJiZcblx0XHRcdFx0XHQobVIgPSBwYXJhbXNbMF0ubWF0Y2gocmUpKSAmJlxuXHRcdFx0XHRcdChtRyA9IHBhcmFtc1sxXS5tYXRjaChyZSkpICYmXG5cdFx0XHRcdFx0KG1CID0gcGFyYW1zWzJdLm1hdGNoKHJlKSlcblx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0dmFyIHIgPSBwYXJzZUZsb2F0KChtUlsxXSB8fCAnMCcpICsgKG1SWzJdIHx8ICcnKSk7XG5cdFx0XHRcdFx0dmFyIGcgPSBwYXJzZUZsb2F0KChtR1sxXSB8fCAnMCcpICsgKG1HWzJdIHx8ICcnKSk7XG5cdFx0XHRcdFx0dmFyIGIgPSBwYXJzZUZsb2F0KChtQlsxXSB8fCAnMCcpICsgKG1CWzJdIHx8ICcnKSk7XG5cdFx0XHRcdFx0dGhpcy5mcm9tUkdCKHIsIGcsIGIsIGZsYWdzKTtcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH07XG5cblxuXHRcdHRoaXMudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHQoMHgxMDAgfCBNYXRoLnJvdW5kKHRoaXMucmdiWzBdKSkudG9TdHJpbmcoMTYpLnN1YnN0cigxKSArXG5cdFx0XHRcdCgweDEwMCB8IE1hdGgucm91bmQodGhpcy5yZ2JbMV0pKS50b1N0cmluZygxNikuc3Vic3RyKDEpICtcblx0XHRcdFx0KDB4MTAwIHwgTWF0aC5yb3VuZCh0aGlzLnJnYlsyXSkpLnRvU3RyaW5nKDE2KS5zdWJzdHIoMSlcblx0XHRcdCk7XG5cdFx0fTtcblxuXG5cdFx0dGhpcy50b0hFWFN0cmluZyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiAnIycgKyB0aGlzLnRvU3RyaW5nKCkudG9VcHBlckNhc2UoKTtcblx0XHR9O1xuXG5cblx0XHR0aGlzLnRvUkdCU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuICgncmdiKCcgK1xuXHRcdFx0XHRNYXRoLnJvdW5kKHRoaXMucmdiWzBdKSArICcsJyArXG5cdFx0XHRcdE1hdGgucm91bmQodGhpcy5yZ2JbMV0pICsgJywnICtcblx0XHRcdFx0TWF0aC5yb3VuZCh0aGlzLnJnYlsyXSkgKyAnKSdcblx0XHRcdCk7XG5cdFx0fTtcblxuXG5cdFx0dGhpcy5pc0xpZ2h0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0MC4yMTMgKiB0aGlzLnJnYlswXSArXG5cdFx0XHRcdDAuNzE1ICogdGhpcy5yZ2JbMV0gK1xuXHRcdFx0XHQwLjA3MiAqIHRoaXMucmdiWzJdID5cblx0XHRcdFx0MjU1IC8gMlxuXHRcdFx0KTtcblx0XHR9O1xuXG5cblx0XHR0aGlzLl9wcm9jZXNzUGFyZW50RWxlbWVudHNJbkRPTSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmICh0aGlzLl9saW5rZWRFbGVtZW50c1Byb2Nlc3NlZCkgeyByZXR1cm47IH1cblx0XHRcdHRoaXMuX2xpbmtlZEVsZW1lbnRzUHJvY2Vzc2VkID0gdHJ1ZTtcblxuXHRcdFx0dmFyIGVsbSA9IHRoaXMudGFyZ2V0RWxlbWVudDtcblx0XHRcdGRvIHtcblx0XHRcdFx0Ly8gSWYgdGhlIHRhcmdldCBlbGVtZW50IG9yIG9uZSBvZiBpdHMgcGFyZW50IG5vZGVzIGhhcyBmaXhlZCBwb3NpdGlvbixcblx0XHRcdFx0Ly8gdGhlbiB1c2UgZml4ZWQgcG9zaXRpb25pbmcgaW5zdGVhZFxuXHRcdFx0XHQvL1xuXHRcdFx0XHQvLyBOb3RlOiBJbiBGaXJlZm94LCBnZXRDb21wdXRlZFN0eWxlIHJldHVybnMgbnVsbCBpbiBhIGhpZGRlbiBpZnJhbWUsXG5cdFx0XHRcdC8vIHRoYXQncyB3aHkgd2UgbmVlZCB0byBjaGVjayBpZiB0aGUgcmV0dXJuZWQgc3R5bGUgb2JqZWN0IGlzIG5vbi1lbXB0eVxuXHRcdFx0XHR2YXIgY3VyclN0eWxlID0ganNjLmdldFN0eWxlKGVsbSk7XG5cdFx0XHRcdGlmIChjdXJyU3R5bGUgJiYgY3VyclN0eWxlLnBvc2l0aW9uLnRvTG93ZXJDYXNlKCkgPT09ICdmaXhlZCcpIHtcblx0XHRcdFx0XHR0aGlzLmZpeGVkID0gdHJ1ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChlbG0gIT09IHRoaXMudGFyZ2V0RWxlbWVudCkge1xuXHRcdFx0XHRcdC8vIEVuc3VyZSB0byBhdHRhY2ggb25QYXJlbnRTY3JvbGwgb25seSBvbmNlIHRvIGVhY2ggcGFyZW50IGVsZW1lbnRcblx0XHRcdFx0XHQvLyAobXVsdGlwbGUgdGFyZ2V0RWxlbWVudHMgY2FuIHNoYXJlIHRoZSBzYW1lIHBhcmVudCBub2Rlcylcblx0XHRcdFx0XHQvL1xuXHRcdFx0XHRcdC8vIE5vdGU6IEl0J3Mgbm90IGp1c3Qgb2Zmc2V0UGFyZW50cyB0aGF0IGNhbiBiZSBzY3JvbGxhYmxlLFxuXHRcdFx0XHRcdC8vIHRoYXQncyB3aHkgd2UgbG9vcCB0aHJvdWdoIGFsbCBwYXJlbnQgbm9kZXNcblx0XHRcdFx0XHRpZiAoIWVsbS5fanNjRXZlbnRzQXR0YWNoZWQpIHtcblx0XHRcdFx0XHRcdGpzYy5hdHRhY2hFdmVudChlbG0sICdzY3JvbGwnLCBqc2Mub25QYXJlbnRTY3JvbGwpO1xuXHRcdFx0XHRcdFx0ZWxtLl9qc2NFdmVudHNBdHRhY2hlZCA9IHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9IHdoaWxlICgoZWxtID0gZWxtLnBhcmVudE5vZGUpICYmICFqc2MuaXNFbGVtZW50VHlwZShlbG0sICdib2R5JykpO1xuXHRcdH07XG5cblxuXHRcdC8vIHI6IDAtMjU1XG5cdFx0Ly8gZzogMC0yNTVcblx0XHQvLyBiOiAwLTI1NVxuXHRcdC8vXG5cdFx0Ly8gcmV0dXJuczogWyAwLTM2MCwgMC0xMDAsIDAtMTAwIF1cblx0XHQvL1xuXHRcdGZ1bmN0aW9uIFJHQl9IU1YgKHIsIGcsIGIpIHtcblx0XHRcdHIgLz0gMjU1O1xuXHRcdFx0ZyAvPSAyNTU7XG5cdFx0XHRiIC89IDI1NTtcblx0XHRcdHZhciBuID0gTWF0aC5taW4oTWF0aC5taW4ocixnKSxiKTtcblx0XHRcdHZhciB2ID0gTWF0aC5tYXgoTWF0aC5tYXgocixnKSxiKTtcblx0XHRcdHZhciBtID0gdiAtIG47XG5cdFx0XHRpZiAobSA9PT0gMCkgeyByZXR1cm4gWyBudWxsLCAwLCAxMDAgKiB2IF07IH1cblx0XHRcdHZhciBoID0gcj09PW4gPyAzKyhiLWcpL20gOiAoZz09PW4gPyA1KyhyLWIpL20gOiAxKyhnLXIpL20pO1xuXHRcdFx0cmV0dXJuIFtcblx0XHRcdFx0NjAgKiAoaD09PTY/MDpoKSxcblx0XHRcdFx0MTAwICogKG0vdiksXG5cdFx0XHRcdDEwMCAqIHZcblx0XHRcdF07XG5cdFx0fVxuXG5cblx0XHQvLyBoOiAwLTM2MFxuXHRcdC8vIHM6IDAtMTAwXG5cdFx0Ly8gdjogMC0xMDBcblx0XHQvL1xuXHRcdC8vIHJldHVybnM6IFsgMC0yNTUsIDAtMjU1LCAwLTI1NSBdXG5cdFx0Ly9cblx0XHRmdW5jdGlvbiBIU1ZfUkdCIChoLCBzLCB2KSB7XG5cdFx0XHR2YXIgdSA9IDI1NSAqICh2IC8gMTAwKTtcblxuXHRcdFx0aWYgKGggPT09IG51bGwpIHtcblx0XHRcdFx0cmV0dXJuIFsgdSwgdSwgdSBdO1xuXHRcdFx0fVxuXG5cdFx0XHRoIC89IDYwO1xuXHRcdFx0cyAvPSAxMDA7XG5cblx0XHRcdHZhciBpID0gTWF0aC5mbG9vcihoKTtcblx0XHRcdHZhciBmID0gaSUyID8gaC1pIDogMS0oaC1pKTtcblx0XHRcdHZhciBtID0gdSAqICgxIC0gcyk7XG5cdFx0XHR2YXIgbiA9IHUgKiAoMSAtIHMgKiBmKTtcblx0XHRcdHN3aXRjaCAoaSkge1xuXHRcdFx0XHRjYXNlIDY6XG5cdFx0XHRcdGNhc2UgMDogcmV0dXJuIFt1LG4sbV07XG5cdFx0XHRcdGNhc2UgMTogcmV0dXJuIFtuLHUsbV07XG5cdFx0XHRcdGNhc2UgMjogcmV0dXJuIFttLHUsbl07XG5cdFx0XHRcdGNhc2UgMzogcmV0dXJuIFttLG4sdV07XG5cdFx0XHRcdGNhc2UgNDogcmV0dXJuIFtuLG0sdV07XG5cdFx0XHRcdGNhc2UgNTogcmV0dXJuIFt1LG0sbl07XG5cdFx0XHR9XG5cdFx0fVxuXG5cblx0XHRmdW5jdGlvbiBkZXRhY2hQaWNrZXIgKCkge1xuXHRcdFx0anNjLnVuc2V0Q2xhc3MoVEhJUy50YXJnZXRFbGVtZW50LCBUSElTLmFjdGl2ZUNsYXNzKTtcblx0XHRcdGpzYy5waWNrZXIud3JhcC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGpzYy5waWNrZXIud3JhcCk7XG5cdFx0XHRkZWxldGUganNjLnBpY2tlci5vd25lcjtcblx0XHR9XG5cblxuXHRcdGZ1bmN0aW9uIGRyYXdQaWNrZXIgKCkge1xuXG5cdFx0XHQvLyBBdCB0aGlzIHBvaW50LCB3aGVuIGRyYXdpbmcgdGhlIHBpY2tlciwgd2Uga25vdyB3aGF0IHRoZSBwYXJlbnQgZWxlbWVudHMgYXJlXG5cdFx0XHQvLyBhbmQgd2UgY2FuIGRvIGFsbCByZWxhdGVkIERPTSBvcGVyYXRpb25zLCBzdWNoIGFzIHJlZ2lzdGVyaW5nIGV2ZW50cyBvbiB0aGVtXG5cdFx0XHQvLyBvciBjaGVja2luZyB0aGVpciBwb3NpdGlvbmluZ1xuXHRcdFx0VEhJUy5fcHJvY2Vzc1BhcmVudEVsZW1lbnRzSW5ET00oKTtcblxuXHRcdFx0aWYgKCFqc2MucGlja2VyKSB7XG5cdFx0XHRcdGpzYy5waWNrZXIgPSB7XG5cdFx0XHRcdFx0b3duZXI6IG51bGwsXG5cdFx0XHRcdFx0d3JhcCA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuXHRcdFx0XHRcdGJveCA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuXHRcdFx0XHRcdGJveFMgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gc2hhZG93IGFyZWFcblx0XHRcdFx0XHRib3hCIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIGJvcmRlclxuXHRcdFx0XHRcdHBhZCA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuXHRcdFx0XHRcdHBhZEIgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gYm9yZGVyXG5cdFx0XHRcdFx0cGFkTSA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBtb3VzZS90b3VjaCBhcmVhXG5cdFx0XHRcdFx0cGFkUGFsIDoganNjLmNyZWF0ZVBhbGV0dGUoKSxcblx0XHRcdFx0XHRjcm9zcyA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuXHRcdFx0XHRcdGNyb3NzQlkgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gYm9yZGVyIFlcblx0XHRcdFx0XHRjcm9zc0JYIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIGJvcmRlciBYXG5cdFx0XHRcdFx0Y3Jvc3NMWSA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBsaW5lIFlcblx0XHRcdFx0XHRjcm9zc0xYIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIGxpbmUgWFxuXHRcdFx0XHRcdHNsZCA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuXHRcdFx0XHRcdHNsZEIgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gYm9yZGVyXG5cdFx0XHRcdFx0c2xkTSA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBtb3VzZS90b3VjaCBhcmVhXG5cdFx0XHRcdFx0c2xkR3JhZCA6IGpzYy5jcmVhdGVTbGlkZXJHcmFkaWVudCgpLFxuXHRcdFx0XHRcdHNsZFB0clMgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gc2xpZGVyIHBvaW50ZXIgc3BhY2VyXG5cdFx0XHRcdFx0c2xkUHRySUIgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gc2xpZGVyIHBvaW50ZXIgaW5uZXIgYm9yZGVyXG5cdFx0XHRcdFx0c2xkUHRyTUIgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gc2xpZGVyIHBvaW50ZXIgbWlkZGxlIGJvcmRlclxuXHRcdFx0XHRcdHNsZFB0ck9CIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIHNsaWRlciBwb2ludGVyIG91dGVyIGJvcmRlclxuXHRcdFx0XHRcdGJ0biA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuXHRcdFx0XHRcdGJ0blQgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJykgLy8gdGV4dFxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGpzYy5waWNrZXIucGFkLmFwcGVuZENoaWxkKGpzYy5waWNrZXIucGFkUGFsLmVsbSk7XG5cdFx0XHRcdGpzYy5waWNrZXIucGFkQi5hcHBlbmRDaGlsZChqc2MucGlja2VyLnBhZCk7XG5cdFx0XHRcdGpzYy5waWNrZXIuY3Jvc3MuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5jcm9zc0JZKTtcblx0XHRcdFx0anNjLnBpY2tlci5jcm9zcy5hcHBlbmRDaGlsZChqc2MucGlja2VyLmNyb3NzQlgpO1xuXHRcdFx0XHRqc2MucGlja2VyLmNyb3NzLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuY3Jvc3NMWSk7XG5cdFx0XHRcdGpzYy5waWNrZXIuY3Jvc3MuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5jcm9zc0xYKTtcblx0XHRcdFx0anNjLnBpY2tlci5wYWRCLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuY3Jvc3MpO1xuXHRcdFx0XHRqc2MucGlja2VyLmJveC5hcHBlbmRDaGlsZChqc2MucGlja2VyLnBhZEIpO1xuXHRcdFx0XHRqc2MucGlja2VyLmJveC5hcHBlbmRDaGlsZChqc2MucGlja2VyLnBhZE0pO1xuXG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuc2xkR3JhZC5lbG0pO1xuXHRcdFx0XHRqc2MucGlja2VyLnNsZEIuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5zbGQpO1xuXHRcdFx0XHRqc2MucGlja2VyLnNsZEIuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5zbGRQdHJPQik7XG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkUHRyT0IuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5zbGRQdHJNQik7XG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkUHRyTUIuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5zbGRQdHJJQik7XG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkUHRySUIuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5zbGRQdHJTKTtcblx0XHRcdFx0anNjLnBpY2tlci5ib3guYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5zbGRCKTtcblx0XHRcdFx0anNjLnBpY2tlci5ib3guYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5zbGRNKTtcblxuXHRcdFx0XHRqc2MucGlja2VyLmJ0bi5hcHBlbmRDaGlsZChqc2MucGlja2VyLmJ0blQpO1xuXHRcdFx0XHRqc2MucGlja2VyLmJveC5hcHBlbmRDaGlsZChqc2MucGlja2VyLmJ0bik7XG5cblx0XHRcdFx0anNjLnBpY2tlci5ib3hCLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuYm94KTtcblx0XHRcdFx0anNjLnBpY2tlci53cmFwLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuYm94Uyk7XG5cdFx0XHRcdGpzYy5waWNrZXIud3JhcC5hcHBlbmRDaGlsZChqc2MucGlja2VyLmJveEIpO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgcCA9IGpzYy5waWNrZXI7XG5cblx0XHRcdHZhciBkaXNwbGF5U2xpZGVyID0gISFqc2MuZ2V0U2xpZGVyQ29tcG9uZW50KFRISVMpO1xuXHRcdFx0dmFyIGRpbXMgPSBqc2MuZ2V0UGlja2VyRGltcyhUSElTKTtcblx0XHRcdHZhciBjcm9zc091dGVyU2l6ZSA9ICgyICogVEhJUy5wb2ludGVyQm9yZGVyV2lkdGggKyBUSElTLnBvaW50ZXJUaGlja25lc3MgKyAyICogVEhJUy5jcm9zc1NpemUpO1xuXHRcdFx0dmFyIHBhZFRvU2xpZGVyUGFkZGluZyA9IGpzYy5nZXRQYWRUb1NsaWRlclBhZGRpbmcoVEhJUyk7XG5cdFx0XHR2YXIgYm9yZGVyUmFkaXVzID0gTWF0aC5taW4oXG5cdFx0XHRcdFRISVMuYm9yZGVyUmFkaXVzLFxuXHRcdFx0XHRNYXRoLnJvdW5kKFRISVMucGFkZGluZyAqIE1hdGguUEkpKTsgLy8gcHhcblx0XHRcdHZhciBwYWRDdXJzb3IgPSAnY3Jvc3NoYWlyJztcblxuXHRcdFx0Ly8gd3JhcFxuXHRcdFx0cC53cmFwLnN0eWxlLmNsZWFyID0gJ2JvdGgnO1xuXHRcdFx0cC53cmFwLnN0eWxlLndpZHRoID0gKGRpbXNbMF0gKyAyICogVEhJUy5ib3JkZXJXaWR0aCkgKyAncHgnO1xuXHRcdFx0cC53cmFwLnN0eWxlLmhlaWdodCA9IChkaW1zWzFdICsgMiAqIFRISVMuYm9yZGVyV2lkdGgpICsgJ3B4Jztcblx0XHRcdHAud3JhcC5zdHlsZS56SW5kZXggPSBUSElTLnpJbmRleDtcblxuXHRcdFx0Ly8gcGlja2VyXG5cdFx0XHRwLmJveC5zdHlsZS53aWR0aCA9IGRpbXNbMF0gKyAncHgnO1xuXHRcdFx0cC5ib3guc3R5bGUuaGVpZ2h0ID0gZGltc1sxXSArICdweCc7XG5cblx0XHRcdHAuYm94Uy5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLmJveFMuc3R5bGUubGVmdCA9ICcwJztcblx0XHRcdHAuYm94Uy5zdHlsZS50b3AgPSAnMCc7XG5cdFx0XHRwLmJveFMuc3R5bGUud2lkdGggPSAnMTAwJSc7XG5cdFx0XHRwLmJveFMuc3R5bGUuaGVpZ2h0ID0gJzEwMCUnO1xuXHRcdFx0anNjLnNldEJvcmRlclJhZGl1cyhwLmJveFMsIGJvcmRlclJhZGl1cyArICdweCcpO1xuXG5cdFx0XHQvLyBwaWNrZXIgYm9yZGVyXG5cdFx0XHRwLmJveEIuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuXHRcdFx0cC5ib3hCLnN0eWxlLmJvcmRlciA9IFRISVMuYm9yZGVyV2lkdGggKyAncHggc29saWQnO1xuXHRcdFx0cC5ib3hCLnN0eWxlLmJvcmRlckNvbG9yID0gVEhJUy5ib3JkZXJDb2xvcjtcblx0XHRcdHAuYm94Qi5zdHlsZS5iYWNrZ3JvdW5kID0gVEhJUy5iYWNrZ3JvdW5kQ29sb3I7XG5cdFx0XHRqc2Muc2V0Qm9yZGVyUmFkaXVzKHAuYm94QiwgYm9yZGVyUmFkaXVzICsgJ3B4Jyk7XG5cblx0XHRcdC8vIElFIGhhY2s6XG5cdFx0XHQvLyBJZiB0aGUgZWxlbWVudCBpcyB0cmFuc3BhcmVudCwgSUUgd2lsbCB0cmlnZ2VyIHRoZSBldmVudCBvbiB0aGUgZWxlbWVudHMgdW5kZXIgaXQsXG5cdFx0XHQvLyBlLmcuIG9uIENhbnZhcyBvciBvbiBlbGVtZW50cyB3aXRoIGJvcmRlclxuXHRcdFx0cC5wYWRNLnN0eWxlLmJhY2tncm91bmQgPVxuXHRcdFx0cC5zbGRNLnN0eWxlLmJhY2tncm91bmQgPVxuXHRcdFx0XHQnI0ZGRic7XG5cdFx0XHRqc2Muc2V0U3R5bGUocC5wYWRNLCAnb3BhY2l0eScsICcwJyk7XG5cdFx0XHRqc2Muc2V0U3R5bGUocC5zbGRNLCAnb3BhY2l0eScsICcwJyk7XG5cblx0XHRcdC8vIHBhZFxuXHRcdFx0cC5wYWQuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuXHRcdFx0cC5wYWQuc3R5bGUud2lkdGggPSBUSElTLndpZHRoICsgJ3B4Jztcblx0XHRcdHAucGFkLnN0eWxlLmhlaWdodCA9IFRISVMuaGVpZ2h0ICsgJ3B4JztcblxuXHRcdFx0Ly8gcGFkIHBhbGV0dGVzIChIU1YgYW5kIEhWUylcblx0XHRcdHAucGFkUGFsLmRyYXcoVEhJUy53aWR0aCwgVEhJUy5oZWlnaHQsIGpzYy5nZXRQYWRZQ29tcG9uZW50KFRISVMpKTtcblxuXHRcdFx0Ly8gcGFkIGJvcmRlclxuXHRcdFx0cC5wYWRCLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHAucGFkQi5zdHlsZS5sZWZ0ID0gVEhJUy5wYWRkaW5nICsgJ3B4Jztcblx0XHRcdHAucGFkQi5zdHlsZS50b3AgPSBUSElTLnBhZGRpbmcgKyAncHgnO1xuXHRcdFx0cC5wYWRCLnN0eWxlLmJvcmRlciA9IFRISVMuaW5zZXRXaWR0aCArICdweCBzb2xpZCc7XG5cdFx0XHRwLnBhZEIuc3R5bGUuYm9yZGVyQ29sb3IgPSBUSElTLmluc2V0Q29sb3I7XG5cblx0XHRcdC8vIHBhZCBtb3VzZSBhcmVhXG5cdFx0XHRwLnBhZE0uX2pzY0luc3RhbmNlID0gVEhJUztcblx0XHRcdHAucGFkTS5fanNjQ29udHJvbE5hbWUgPSAncGFkJztcblx0XHRcdHAucGFkTS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLnBhZE0uc3R5bGUubGVmdCA9ICcwJztcblx0XHRcdHAucGFkTS5zdHlsZS50b3AgPSAnMCc7XG5cdFx0XHRwLnBhZE0uc3R5bGUud2lkdGggPSAoVEhJUy5wYWRkaW5nICsgMiAqIFRISVMuaW5zZXRXaWR0aCArIFRISVMud2lkdGggKyBwYWRUb1NsaWRlclBhZGRpbmcgLyAyKSArICdweCc7XG5cdFx0XHRwLnBhZE0uc3R5bGUuaGVpZ2h0ID0gZGltc1sxXSArICdweCc7XG5cdFx0XHRwLnBhZE0uc3R5bGUuY3Vyc29yID0gcGFkQ3Vyc29yO1xuXG5cdFx0XHQvLyBwYWQgY3Jvc3Ncblx0XHRcdHAuY3Jvc3Muc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cC5jcm9zcy5zdHlsZS5sZWZ0ID1cblx0XHRcdHAuY3Jvc3Muc3R5bGUudG9wID1cblx0XHRcdFx0JzAnO1xuXHRcdFx0cC5jcm9zcy5zdHlsZS53aWR0aCA9XG5cdFx0XHRwLmNyb3NzLnN0eWxlLmhlaWdodCA9XG5cdFx0XHRcdGNyb3NzT3V0ZXJTaXplICsgJ3B4JztcblxuXHRcdFx0Ly8gcGFkIGNyb3NzIGJvcmRlciBZIGFuZCBYXG5cdFx0XHRwLmNyb3NzQlkuc3R5bGUucG9zaXRpb24gPVxuXHRcdFx0cC5jcm9zc0JYLnN0eWxlLnBvc2l0aW9uID1cblx0XHRcdFx0J2Fic29sdXRlJztcblx0XHRcdHAuY3Jvc3NCWS5zdHlsZS5iYWNrZ3JvdW5kID1cblx0XHRcdHAuY3Jvc3NCWC5zdHlsZS5iYWNrZ3JvdW5kID1cblx0XHRcdFx0VEhJUy5wb2ludGVyQm9yZGVyQ29sb3I7XG5cdFx0XHRwLmNyb3NzQlkuc3R5bGUud2lkdGggPVxuXHRcdFx0cC5jcm9zc0JYLnN0eWxlLmhlaWdodCA9XG5cdFx0XHRcdCgyICogVEhJUy5wb2ludGVyQm9yZGVyV2lkdGggKyBUSElTLnBvaW50ZXJUaGlja25lc3MpICsgJ3B4Jztcblx0XHRcdHAuY3Jvc3NCWS5zdHlsZS5oZWlnaHQgPVxuXHRcdFx0cC5jcm9zc0JYLnN0eWxlLndpZHRoID1cblx0XHRcdFx0Y3Jvc3NPdXRlclNpemUgKyAncHgnO1xuXHRcdFx0cC5jcm9zc0JZLnN0eWxlLmxlZnQgPVxuXHRcdFx0cC5jcm9zc0JYLnN0eWxlLnRvcCA9XG5cdFx0XHRcdChNYXRoLmZsb29yKGNyb3NzT3V0ZXJTaXplIC8gMikgLSBNYXRoLmZsb29yKFRISVMucG9pbnRlclRoaWNrbmVzcyAvIDIpIC0gVEhJUy5wb2ludGVyQm9yZGVyV2lkdGgpICsgJ3B4Jztcblx0XHRcdHAuY3Jvc3NCWS5zdHlsZS50b3AgPVxuXHRcdFx0cC5jcm9zc0JYLnN0eWxlLmxlZnQgPVxuXHRcdFx0XHQnMCc7XG5cblx0XHRcdC8vIHBhZCBjcm9zcyBsaW5lIFkgYW5kIFhcblx0XHRcdHAuY3Jvc3NMWS5zdHlsZS5wb3NpdGlvbiA9XG5cdFx0XHRwLmNyb3NzTFguc3R5bGUucG9zaXRpb24gPVxuXHRcdFx0XHQnYWJzb2x1dGUnO1xuXHRcdFx0cC5jcm9zc0xZLnN0eWxlLmJhY2tncm91bmQgPVxuXHRcdFx0cC5jcm9zc0xYLnN0eWxlLmJhY2tncm91bmQgPVxuXHRcdFx0XHRUSElTLnBvaW50ZXJDb2xvcjtcblx0XHRcdHAuY3Jvc3NMWS5zdHlsZS5oZWlnaHQgPVxuXHRcdFx0cC5jcm9zc0xYLnN0eWxlLndpZHRoID1cblx0XHRcdFx0KGNyb3NzT3V0ZXJTaXplIC0gMiAqIFRISVMucG9pbnRlckJvcmRlcldpZHRoKSArICdweCc7XG5cdFx0XHRwLmNyb3NzTFkuc3R5bGUud2lkdGggPVxuXHRcdFx0cC5jcm9zc0xYLnN0eWxlLmhlaWdodCA9XG5cdFx0XHRcdFRISVMucG9pbnRlclRoaWNrbmVzcyArICdweCc7XG5cdFx0XHRwLmNyb3NzTFkuc3R5bGUubGVmdCA9XG5cdFx0XHRwLmNyb3NzTFguc3R5bGUudG9wID1cblx0XHRcdFx0KE1hdGguZmxvb3IoY3Jvc3NPdXRlclNpemUgLyAyKSAtIE1hdGguZmxvb3IoVEhJUy5wb2ludGVyVGhpY2tuZXNzIC8gMikpICsgJ3B4Jztcblx0XHRcdHAuY3Jvc3NMWS5zdHlsZS50b3AgPVxuXHRcdFx0cC5jcm9zc0xYLnN0eWxlLmxlZnQgPVxuXHRcdFx0XHRUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCArICdweCc7XG5cblx0XHRcdC8vIHNsaWRlclxuXHRcdFx0cC5zbGQuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcblx0XHRcdHAuc2xkLnN0eWxlLndpZHRoID0gVEhJUy5zbGlkZXJTaXplICsgJ3B4Jztcblx0XHRcdHAuc2xkLnN0eWxlLmhlaWdodCA9IFRISVMuaGVpZ2h0ICsgJ3B4JztcblxuXHRcdFx0Ly8gc2xpZGVyIGdyYWRpZW50XG5cdFx0XHRwLnNsZEdyYWQuZHJhdyhUSElTLnNsaWRlclNpemUsIFRISVMuaGVpZ2h0LCAnIzAwMCcsICcjMDAwJyk7XG5cblx0XHRcdC8vIHNsaWRlciBib3JkZXJcblx0XHRcdHAuc2xkQi5zdHlsZS5kaXNwbGF5ID0gZGlzcGxheVNsaWRlciA/ICdibG9jaycgOiAnbm9uZSc7XG5cdFx0XHRwLnNsZEIuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cC5zbGRCLnN0eWxlLnJpZ2h0ID0gVEhJUy5wYWRkaW5nICsgJ3B4Jztcblx0XHRcdHAuc2xkQi5zdHlsZS50b3AgPSBUSElTLnBhZGRpbmcgKyAncHgnO1xuXHRcdFx0cC5zbGRCLnN0eWxlLmJvcmRlciA9IFRISVMuaW5zZXRXaWR0aCArICdweCBzb2xpZCc7XG5cdFx0XHRwLnNsZEIuc3R5bGUuYm9yZGVyQ29sb3IgPSBUSElTLmluc2V0Q29sb3I7XG5cblx0XHRcdC8vIHNsaWRlciBtb3VzZSBhcmVhXG5cdFx0XHRwLnNsZE0uX2pzY0luc3RhbmNlID0gVEhJUztcblx0XHRcdHAuc2xkTS5fanNjQ29udHJvbE5hbWUgPSAnc2xkJztcblx0XHRcdHAuc2xkTS5zdHlsZS5kaXNwbGF5ID0gZGlzcGxheVNsaWRlciA/ICdibG9jaycgOiAnbm9uZSc7XG5cdFx0XHRwLnNsZE0uc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cC5zbGRNLnN0eWxlLnJpZ2h0ID0gJzAnO1xuXHRcdFx0cC5zbGRNLnN0eWxlLnRvcCA9ICcwJztcblx0XHRcdHAuc2xkTS5zdHlsZS53aWR0aCA9IChUSElTLnNsaWRlclNpemUgKyBwYWRUb1NsaWRlclBhZGRpbmcgLyAyICsgVEhJUy5wYWRkaW5nICsgMiAqIFRISVMuaW5zZXRXaWR0aCkgKyAncHgnO1xuXHRcdFx0cC5zbGRNLnN0eWxlLmhlaWdodCA9IGRpbXNbMV0gKyAncHgnO1xuXHRcdFx0cC5zbGRNLnN0eWxlLmN1cnNvciA9ICdkZWZhdWx0JztcblxuXHRcdFx0Ly8gc2xpZGVyIHBvaW50ZXIgaW5uZXIgYW5kIG91dGVyIGJvcmRlclxuXHRcdFx0cC5zbGRQdHJJQi5zdHlsZS5ib3JkZXIgPVxuXHRcdFx0cC5zbGRQdHJPQi5zdHlsZS5ib3JkZXIgPVxuXHRcdFx0XHRUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCArICdweCBzb2xpZCAnICsgVEhJUy5wb2ludGVyQm9yZGVyQ29sb3I7XG5cblx0XHRcdC8vIHNsaWRlciBwb2ludGVyIG91dGVyIGJvcmRlclxuXHRcdFx0cC5zbGRQdHJPQi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLnNsZFB0ck9CLnN0eWxlLmxlZnQgPSAtKDIgKiBUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCArIFRISVMucG9pbnRlclRoaWNrbmVzcykgKyAncHgnO1xuXHRcdFx0cC5zbGRQdHJPQi5zdHlsZS50b3AgPSAnMCc7XG5cblx0XHRcdC8vIHNsaWRlciBwb2ludGVyIG1pZGRsZSBib3JkZXJcblx0XHRcdHAuc2xkUHRyTUIuc3R5bGUuYm9yZGVyID0gVEhJUy5wb2ludGVyVGhpY2tuZXNzICsgJ3B4IHNvbGlkICcgKyBUSElTLnBvaW50ZXJDb2xvcjtcblxuXHRcdFx0Ly8gc2xpZGVyIHBvaW50ZXIgc3BhY2VyXG5cdFx0XHRwLnNsZFB0clMuc3R5bGUud2lkdGggPSBUSElTLnNsaWRlclNpemUgKyAncHgnO1xuXHRcdFx0cC5zbGRQdHJTLnN0eWxlLmhlaWdodCA9IHNsaWRlclB0clNwYWNlICsgJ3B4JztcblxuXHRcdFx0Ly8gdGhlIENsb3NlIGJ1dHRvblxuXHRcdFx0ZnVuY3Rpb24gc2V0QnRuQm9yZGVyICgpIHtcblx0XHRcdFx0dmFyIGluc2V0Q29sb3JzID0gVEhJUy5pbnNldENvbG9yLnNwbGl0KC9cXHMrLyk7XG5cdFx0XHRcdHZhciBvdXRzZXRDb2xvciA9IGluc2V0Q29sb3JzLmxlbmd0aCA8IDIgPyBpbnNldENvbG9yc1swXSA6IGluc2V0Q29sb3JzWzFdICsgJyAnICsgaW5zZXRDb2xvcnNbMF0gKyAnICcgKyBpbnNldENvbG9yc1swXSArICcgJyArIGluc2V0Q29sb3JzWzFdO1xuXHRcdFx0XHRwLmJ0bi5zdHlsZS5ib3JkZXJDb2xvciA9IG91dHNldENvbG9yO1xuXHRcdFx0fVxuXHRcdFx0cC5idG4uc3R5bGUuZGlzcGxheSA9IFRISVMuY2xvc2FibGUgPyAnYmxvY2snIDogJ25vbmUnO1xuXHRcdFx0cC5idG4uc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cC5idG4uc3R5bGUubGVmdCA9IFRISVMucGFkZGluZyArICdweCc7XG5cdFx0XHRwLmJ0bi5zdHlsZS5ib3R0b20gPSBUSElTLnBhZGRpbmcgKyAncHgnO1xuXHRcdFx0cC5idG4uc3R5bGUucGFkZGluZyA9ICcwIDE1cHgnO1xuXHRcdFx0cC5idG4uc3R5bGUuaGVpZ2h0ID0gVEhJUy5idXR0b25IZWlnaHQgKyAncHgnO1xuXHRcdFx0cC5idG4uc3R5bGUuYm9yZGVyID0gVEhJUy5pbnNldFdpZHRoICsgJ3B4IHNvbGlkJztcblx0XHRcdHNldEJ0bkJvcmRlcigpO1xuXHRcdFx0cC5idG4uc3R5bGUuY29sb3IgPSBUSElTLmJ1dHRvbkNvbG9yO1xuXHRcdFx0cC5idG4uc3R5bGUuZm9udCA9ICcxMnB4IHNhbnMtc2VyaWYnO1xuXHRcdFx0cC5idG4uc3R5bGUudGV4dEFsaWduID0gJ2NlbnRlcic7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRwLmJ0bi5zdHlsZS5jdXJzb3IgPSAncG9pbnRlcic7XG5cdFx0XHR9IGNhdGNoKGVPbGRJRSkge1xuXHRcdFx0XHRwLmJ0bi5zdHlsZS5jdXJzb3IgPSAnaGFuZCc7XG5cdFx0XHR9XG5cdFx0XHRwLmJ0bi5vbm1vdXNlZG93biA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0VEhJUy5oaWRlKCk7XG5cdFx0XHR9O1xuXHRcdFx0cC5idG5ULnN0eWxlLmxpbmVIZWlnaHQgPSBUSElTLmJ1dHRvbkhlaWdodCArICdweCc7XG5cdFx0XHRwLmJ0blQuaW5uZXJIVE1MID0gJyc7XG5cdFx0XHRwLmJ0blQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoVEhJUy5jbG9zZVRleHQpKTtcblxuXHRcdFx0Ly8gcGxhY2UgcG9pbnRlcnNcblx0XHRcdHJlZHJhd1BhZCgpO1xuXHRcdFx0cmVkcmF3U2xkKCk7XG5cblx0XHRcdC8vIElmIHdlIGFyZSBjaGFuZ2luZyB0aGUgb3duZXIgd2l0aG91dCBmaXJzdCBjbG9zaW5nIHRoZSBwaWNrZXIsXG5cdFx0XHQvLyBtYWtlIHN1cmUgdG8gZmlyc3QgZGVhbCB3aXRoIHRoZSBvbGQgb3duZXJcblx0XHRcdGlmIChqc2MucGlja2VyLm93bmVyICYmIGpzYy5waWNrZXIub3duZXIgIT09IFRISVMpIHtcblx0XHRcdFx0anNjLnVuc2V0Q2xhc3MoanNjLnBpY2tlci5vd25lci50YXJnZXRFbGVtZW50LCBUSElTLmFjdGl2ZUNsYXNzKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gU2V0IHRoZSBuZXcgcGlja2VyIG93bmVyXG5cdFx0XHRqc2MucGlja2VyLm93bmVyID0gVEhJUztcblxuXHRcdFx0Ly8gVGhlIHJlZHJhd1Bvc2l0aW9uKCkgbWV0aG9kIG5lZWRzIHBpY2tlci5vd25lciB0byBiZSBzZXQsIHRoYXQncyB3aHkgd2UgY2FsbCBpdCBoZXJlLFxuXHRcdFx0Ly8gYWZ0ZXIgc2V0dGluZyB0aGUgb3duZXJcblx0XHRcdGlmIChqc2MuaXNFbGVtZW50VHlwZShjb250YWluZXIsICdib2R5JykpIHtcblx0XHRcdFx0anNjLnJlZHJhd1Bvc2l0aW9uKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRqc2MuX2RyYXdQb3NpdGlvbihUSElTLCAwLCAwLCAncmVsYXRpdmUnLCBmYWxzZSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChwLndyYXAucGFyZW50Tm9kZSAhPSBjb250YWluZXIpIHtcblx0XHRcdFx0Y29udGFpbmVyLmFwcGVuZENoaWxkKHAud3JhcCk7XG5cdFx0XHR9XG5cblx0XHRcdGpzYy5zZXRDbGFzcyhUSElTLnRhcmdldEVsZW1lbnQsIFRISVMuYWN0aXZlQ2xhc3MpO1xuXHRcdH1cblxuXG5cdFx0ZnVuY3Rpb24gcmVkcmF3UGFkICgpIHtcblx0XHRcdC8vIHJlZHJhdyB0aGUgcGFkIHBvaW50ZXJcblx0XHRcdHN3aXRjaCAoanNjLmdldFBhZFlDb21wb25lbnQoVEhJUykpIHtcblx0XHRcdGNhc2UgJ3MnOiB2YXIgeUNvbXBvbmVudCA9IDE7IGJyZWFrO1xuXHRcdFx0Y2FzZSAndic6IHZhciB5Q29tcG9uZW50ID0gMjsgYnJlYWs7XG5cdFx0XHR9XG5cdFx0XHR2YXIgeCA9IE1hdGgucm91bmQoKFRISVMuaHN2WzBdIC8gMzYwKSAqIChUSElTLndpZHRoIC0gMSkpO1xuXHRcdFx0dmFyIHkgPSBNYXRoLnJvdW5kKCgxIC0gVEhJUy5oc3ZbeUNvbXBvbmVudF0gLyAxMDApICogKFRISVMuaGVpZ2h0IC0gMSkpO1xuXHRcdFx0dmFyIGNyb3NzT3V0ZXJTaXplID0gKDIgKiBUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCArIFRISVMucG9pbnRlclRoaWNrbmVzcyArIDIgKiBUSElTLmNyb3NzU2l6ZSk7XG5cdFx0XHR2YXIgb2ZzID0gLU1hdGguZmxvb3IoY3Jvc3NPdXRlclNpemUgLyAyKTtcblx0XHRcdGpzYy5waWNrZXIuY3Jvc3Muc3R5bGUubGVmdCA9ICh4ICsgb2ZzKSArICdweCc7XG5cdFx0XHRqc2MucGlja2VyLmNyb3NzLnN0eWxlLnRvcCA9ICh5ICsgb2ZzKSArICdweCc7XG5cblx0XHRcdC8vIHJlZHJhdyB0aGUgc2xpZGVyXG5cdFx0XHRzd2l0Y2ggKGpzYy5nZXRTbGlkZXJDb21wb25lbnQoVEhJUykpIHtcblx0XHRcdGNhc2UgJ3MnOlxuXHRcdFx0XHR2YXIgcmdiMSA9IEhTVl9SR0IoVEhJUy5oc3ZbMF0sIDEwMCwgVEhJUy5oc3ZbMl0pO1xuXHRcdFx0XHR2YXIgcmdiMiA9IEhTVl9SR0IoVEhJUy5oc3ZbMF0sIDAsIFRISVMuaHN2WzJdKTtcblx0XHRcdFx0dmFyIGNvbG9yMSA9ICdyZ2IoJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2IxWzBdKSArICcsJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2IxWzFdKSArICcsJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2IxWzJdKSArICcpJztcblx0XHRcdFx0dmFyIGNvbG9yMiA9ICdyZ2IoJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2IyWzBdKSArICcsJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2IyWzFdKSArICcsJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2IyWzJdKSArICcpJztcblx0XHRcdFx0anNjLnBpY2tlci5zbGRHcmFkLmRyYXcoVEhJUy5zbGlkZXJTaXplLCBUSElTLmhlaWdodCwgY29sb3IxLCBjb2xvcjIpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ3YnOlxuXHRcdFx0XHR2YXIgcmdiID0gSFNWX1JHQihUSElTLmhzdlswXSwgVEhJUy5oc3ZbMV0sIDEwMCk7XG5cdFx0XHRcdHZhciBjb2xvcjEgPSAncmdiKCcgK1xuXHRcdFx0XHRcdE1hdGgucm91bmQocmdiWzBdKSArICcsJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2JbMV0pICsgJywnICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYlsyXSkgKyAnKSc7XG5cdFx0XHRcdHZhciBjb2xvcjIgPSAnIzAwMCc7XG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkR3JhZC5kcmF3KFRISVMuc2xpZGVyU2l6ZSwgVEhJUy5oZWlnaHQsIGNvbG9yMSwgY29sb3IyKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXG5cblx0XHRmdW5jdGlvbiByZWRyYXdTbGQgKCkge1xuXHRcdFx0dmFyIHNsZENvbXBvbmVudCA9IGpzYy5nZXRTbGlkZXJDb21wb25lbnQoVEhJUyk7XG5cdFx0XHRpZiAoc2xkQ29tcG9uZW50KSB7XG5cdFx0XHRcdC8vIHJlZHJhdyB0aGUgc2xpZGVyIHBvaW50ZXJcblx0XHRcdFx0c3dpdGNoIChzbGRDb21wb25lbnQpIHtcblx0XHRcdFx0Y2FzZSAncyc6IHZhciB5Q29tcG9uZW50ID0gMTsgYnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3YnOiB2YXIgeUNvbXBvbmVudCA9IDI7IGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciB5ID0gTWF0aC5yb3VuZCgoMSAtIFRISVMuaHN2W3lDb21wb25lbnRdIC8gMTAwKSAqIChUSElTLmhlaWdodCAtIDEpKTtcblx0XHRcdFx0anNjLnBpY2tlci5zbGRQdHJPQi5zdHlsZS50b3AgPSAoeSAtICgyICogVEhJUy5wb2ludGVyQm9yZGVyV2lkdGggKyBUSElTLnBvaW50ZXJUaGlja25lc3MpIC0gTWF0aC5mbG9vcihzbGlkZXJQdHJTcGFjZSAvIDIpKSArICdweCc7XG5cdFx0XHR9XG5cdFx0fVxuXG5cblx0XHRmdW5jdGlvbiBpc1BpY2tlck93bmVyICgpIHtcblx0XHRcdHJldHVybiBqc2MucGlja2VyICYmIGpzYy5waWNrZXIub3duZXIgPT09IFRISVM7XG5cdFx0fVxuXG5cblx0XHRmdW5jdGlvbiBibHVyVmFsdWUgKCkge1xuXHRcdFx0VEhJUy5pbXBvcnRDb2xvcigpO1xuXHRcdH1cblxuXG5cdFx0Ly8gRmluZCB0aGUgdGFyZ2V0IGVsZW1lbnRcblx0XHRpZiAodHlwZW9mIHRhcmdldEVsZW1lbnQgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHR2YXIgaWQgPSB0YXJnZXRFbGVtZW50O1xuXHRcdFx0dmFyIGVsbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcblx0XHRcdGlmIChlbG0pIHtcblx0XHRcdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gZWxtO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0anNjLndhcm4oJ0NvdWxkIG5vdCBmaW5kIHRhcmdldCBlbGVtZW50IHdpdGggSUQgXFwnJyArIGlkICsgJ1xcJycpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAodGFyZ2V0RWxlbWVudCkge1xuXHRcdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gdGFyZ2V0RWxlbWVudDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0anNjLndhcm4oJ0ludmFsaWQgdGFyZ2V0IGVsZW1lbnQ6IFxcJycgKyB0YXJnZXRFbGVtZW50ICsgJ1xcJycpO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLnRhcmdldEVsZW1lbnQuX2pzY0xpbmtlZEluc3RhbmNlKSB7XG5cdFx0XHRqc2Mud2FybignQ2Fubm90IGxpbmsganNjb2xvciB0d2ljZSB0byB0aGUgc2FtZSBlbGVtZW50LiBTa2lwcGluZy4nKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dGhpcy50YXJnZXRFbGVtZW50Ll9qc2NMaW5rZWRJbnN0YW5jZSA9IHRoaXM7XG5cblx0XHQvLyBGaW5kIHRoZSB2YWx1ZSBlbGVtZW50XG5cdFx0dGhpcy52YWx1ZUVsZW1lbnQgPSBqc2MuZmV0Y2hFbGVtZW50KHRoaXMudmFsdWVFbGVtZW50KTtcblx0XHQvLyBGaW5kIHRoZSBzdHlsZSBlbGVtZW50XG5cdFx0dGhpcy5zdHlsZUVsZW1lbnQgPSBqc2MuZmV0Y2hFbGVtZW50KHRoaXMuc3R5bGVFbGVtZW50KTtcblxuXHRcdHZhciBUSElTID0gdGhpcztcblx0XHR2YXIgY29udGFpbmVyID1cblx0XHRcdHRoaXMuY29udGFpbmVyID9cblx0XHRcdGpzYy5mZXRjaEVsZW1lbnQodGhpcy5jb250YWluZXIpIDpcblx0XHRcdGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF07XG5cdFx0dmFyIHNsaWRlclB0clNwYWNlID0gMzsgLy8gcHhcblxuXHRcdC8vIEZvciBCVVRUT04gZWxlbWVudHMgaXQncyBpbXBvcnRhbnQgdG8gc3RvcCB0aGVtIGZyb20gc2VuZGluZyB0aGUgZm9ybSB3aGVuIGNsaWNrZWRcblx0XHQvLyAoZS5nLiBpbiBTYWZhcmkpXG5cdFx0aWYgKGpzYy5pc0VsZW1lbnRUeXBlKHRoaXMudGFyZ2V0RWxlbWVudCwgJ2J1dHRvbicpKSB7XG5cdFx0XHRpZiAodGhpcy50YXJnZXRFbGVtZW50Lm9uY2xpY2spIHtcblx0XHRcdFx0dmFyIG9yaWdDYWxsYmFjayA9IHRoaXMudGFyZ2V0RWxlbWVudC5vbmNsaWNrO1xuXHRcdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQub25jbGljayA9IGZ1bmN0aW9uIChldnQpIHtcblx0XHRcdFx0XHRvcmlnQ2FsbGJhY2suY2FsbCh0aGlzLCBldnQpO1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudC5vbmNsaWNrID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gZmFsc2U7IH07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Lypcblx0XHR2YXIgZWxtID0gdGhpcy50YXJnZXRFbGVtZW50O1xuXHRcdGRvIHtcblx0XHRcdC8vIElmIHRoZSB0YXJnZXQgZWxlbWVudCBvciBvbmUgb2YgaXRzIG9mZnNldFBhcmVudHMgaGFzIGZpeGVkIHBvc2l0aW9uLFxuXHRcdFx0Ly8gdGhlbiB1c2UgZml4ZWQgcG9zaXRpb25pbmcgaW5zdGVhZFxuXHRcdFx0Ly9cblx0XHRcdC8vIE5vdGU6IEluIEZpcmVmb3gsIGdldENvbXB1dGVkU3R5bGUgcmV0dXJucyBudWxsIGluIGEgaGlkZGVuIGlmcmFtZSxcblx0XHRcdC8vIHRoYXQncyB3aHkgd2UgbmVlZCB0byBjaGVjayBpZiB0aGUgcmV0dXJuZWQgc3R5bGUgb2JqZWN0IGlzIG5vbi1lbXB0eVxuXHRcdFx0dmFyIGN1cnJTdHlsZSA9IGpzYy5nZXRTdHlsZShlbG0pO1xuXHRcdFx0aWYgKGN1cnJTdHlsZSAmJiBjdXJyU3R5bGUucG9zaXRpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2ZpeGVkJykge1xuXHRcdFx0XHR0aGlzLmZpeGVkID0gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGVsbSAhPT0gdGhpcy50YXJnZXRFbGVtZW50KSB7XG5cdFx0XHRcdC8vIGF0dGFjaCBvblBhcmVudFNjcm9sbCBzbyB0aGF0IHdlIGNhbiByZWNvbXB1dGUgdGhlIHBpY2tlciBwb3NpdGlvblxuXHRcdFx0XHQvLyB3aGVuIG9uZSBvZiB0aGUgb2Zmc2V0UGFyZW50cyBpcyBzY3JvbGxlZFxuXHRcdFx0XHRpZiAoIWVsbS5fanNjRXZlbnRzQXR0YWNoZWQpIHtcblx0XHRcdFx0XHRqc2MuYXR0YWNoRXZlbnQoZWxtLCAnc2Nyb2xsJywganNjLm9uUGFyZW50U2Nyb2xsKTtcblx0XHRcdFx0XHRlbG0uX2pzY0V2ZW50c0F0dGFjaGVkID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gd2hpbGUgKChlbG0gPSBlbG0ub2Zmc2V0UGFyZW50KSAmJiAhanNjLmlzRWxlbWVudFR5cGUoZWxtLCAnYm9keScpKTtcblx0XHQqL1xuXG5cdFx0Ly8gdmFsdWVFbGVtZW50XG5cdFx0aWYgKHRoaXMudmFsdWVFbGVtZW50KSB7XG5cdFx0XHRpZiAoanNjLmlzRWxlbWVudFR5cGUodGhpcy52YWx1ZUVsZW1lbnQsICdpbnB1dCcpKSB7XG5cdFx0XHRcdHZhciB1cGRhdGVGaWVsZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRUSElTLmZyb21TdHJpbmcoVEhJUy52YWx1ZUVsZW1lbnQudmFsdWUsIGpzYy5sZWF2ZVZhbHVlKTtcblx0XHRcdFx0XHRqc2MuZGlzcGF0Y2hGaW5lQ2hhbmdlKFRISVMpO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRqc2MuYXR0YWNoRXZlbnQodGhpcy52YWx1ZUVsZW1lbnQsICdrZXl1cCcsIHVwZGF0ZUZpZWxkKTtcblx0XHRcdFx0anNjLmF0dGFjaEV2ZW50KHRoaXMudmFsdWVFbGVtZW50LCAnaW5wdXQnLCB1cGRhdGVGaWVsZCk7XG5cdFx0XHRcdGpzYy5hdHRhY2hFdmVudCh0aGlzLnZhbHVlRWxlbWVudCwgJ2JsdXInLCBibHVyVmFsdWUpO1xuXHRcdFx0XHR0aGlzLnZhbHVlRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2F1dG9jb21wbGV0ZScsICdvZmYnKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBzdHlsZUVsZW1lbnRcblx0XHRpZiAodGhpcy5zdHlsZUVsZW1lbnQpIHtcblx0XHRcdHRoaXMuc3R5bGVFbGVtZW50Ll9qc2NPcmlnU3R5bGUgPSB7XG5cdFx0XHRcdGJhY2tncm91bmRJbWFnZSA6IHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRJbWFnZSxcblx0XHRcdFx0YmFja2dyb3VuZENvbG9yIDogdGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yLFxuXHRcdFx0XHRjb2xvciA6IHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmNvbG9yXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLnZhbHVlKSB7XG5cdFx0XHQvLyBUcnkgdG8gc2V0IHRoZSBjb2xvciBmcm9tIHRoZSAudmFsdWUgb3B0aW9uIGFuZCBpZiB1bnN1Y2Nlc3NmdWwsXG5cdFx0XHQvLyBleHBvcnQgdGhlIGN1cnJlbnQgY29sb3Jcblx0XHRcdHRoaXMuZnJvbVN0cmluZyh0aGlzLnZhbHVlKSB8fCB0aGlzLmV4cG9ydENvbG9yKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuaW1wb3J0Q29sb3IoKTtcblx0XHR9XG5cdH1cblxufTtcblxuXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBQdWJsaWMgcHJvcGVydGllcyBhbmQgbWV0aG9kc1xuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5cbi8vIEJ5IGRlZmF1bHQsIHNlYXJjaCBmb3IgYWxsIGVsZW1lbnRzIHdpdGggY2xhc3M9XCJqc2NvbG9yXCIgYW5kIGluc3RhbGwgYSBjb2xvciBwaWNrZXIgb24gdGhlbS5cbi8vXG4vLyBZb3UgY2FuIGNoYW5nZSB3aGF0IGNsYXNzIG5hbWUgd2lsbCBiZSBsb29rZWQgZm9yIGJ5IHNldHRpbmcgdGhlIHByb3BlcnR5IGpzY29sb3IubG9va3VwQ2xhc3Ncbi8vIGFueXdoZXJlIGluIHlvdXIgSFRNTCBkb2N1bWVudC4gVG8gY29tcGxldGVseSBkaXNhYmxlIHRoZSBhdXRvbWF0aWMgbG9va3VwLCBzZXQgaXQgdG8gbnVsbC5cbi8vXG5qc2MuanNjb2xvci5sb29rdXBDbGFzcyA9ICdqc2NvbG9yJztcblxuXG5qc2MuanNjb2xvci5pbnN0YWxsQnlDbGFzc05hbWUgPSBmdW5jdGlvbiAoY2xhc3NOYW1lKSB7XG5cdHZhciBpbnB1dEVsbXMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW5wdXQnKTtcblx0dmFyIGJ1dHRvbkVsbXMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYnV0dG9uJyk7XG5cblx0anNjLnRyeUluc3RhbGxPbkVsZW1lbnRzKGlucHV0RWxtcywgY2xhc3NOYW1lKTtcblx0anNjLnRyeUluc3RhbGxPbkVsZW1lbnRzKGJ1dHRvbkVsbXMsIGNsYXNzTmFtZSk7XG59O1xuXG5cbmpzYy5yZWdpc3RlcigpO1xuXG5cbnJldHVybiBqc2MuanNjb2xvcjtcblxuXG59KSgpOyB9XG4iLCIvKiEgdmV4LmNvbWJpbmVkLmpzOiB2ZXggMy4xLjEsIHZleC1kaWFsb2cgMS4wLjcgKi9cbiFmdW5jdGlvbihhKXtpZihcIm9iamVjdFwiPT10eXBlb2YgZXhwb3J0cyYmXCJ1bmRlZmluZWRcIiE9dHlwZW9mIG1vZHVsZSltb2R1bGUuZXhwb3J0cz1hKCk7ZWxzZSBpZihcImZ1bmN0aW9uXCI9PXR5cGVvZiBkZWZpbmUmJmRlZmluZS5hbWQpZGVmaW5lKFtdLGEpO2Vsc2V7dmFyIGI7Yj1cInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93P3dpbmRvdzpcInVuZGVmaW5lZFwiIT10eXBlb2YgZ2xvYmFsP2dsb2JhbDpcInVuZGVmaW5lZFwiIT10eXBlb2Ygc2VsZj9zZWxmOnRoaXMsYi52ZXg9YSgpfX0oZnVuY3Rpb24oKXt2YXIgYTtyZXR1cm4gZnVuY3Rpb24gYihhLGMsZCl7ZnVuY3Rpb24gZShnLGgpe2lmKCFjW2ddKXtpZighYVtnXSl7dmFyIGk9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighaCYmaSlyZXR1cm4gaShnLCEwKTtpZihmKXJldHVybiBmKGcsITApO3ZhciBqPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrZytcIidcIik7dGhyb3cgai5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGp9dmFyIGs9Y1tnXT17ZXhwb3J0czp7fX07YVtnXVswXS5jYWxsKGsuZXhwb3J0cyxmdW5jdGlvbihiKXt2YXIgYz1hW2ddWzFdW2JdO3JldHVybiBlKGM/YzpiKX0sayxrLmV4cG9ydHMsYixhLGMsZCl9cmV0dXJuIGNbZ10uZXhwb3J0c31mb3IodmFyIGY9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxnPTA7ZzxkLmxlbmd0aDtnKyspZShkW2ddKTtyZXR1cm4gZX0oezE6W2Z1bmN0aW9uKGEsYixjKXtcImRvY3VtZW50XCJpbiB3aW5kb3cuc2VsZiYmKFwiY2xhc3NMaXN0XCJpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKSYmKCFkb2N1bWVudC5jcmVhdGVFbGVtZW50TlN8fFwiY2xhc3NMaXN0XCJpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLFwiZ1wiKSk/IWZ1bmN0aW9uKCl7XCJ1c2Ugc3RyaWN0XCI7dmFyIGE9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIl9cIik7aWYoYS5jbGFzc0xpc3QuYWRkKFwiYzFcIixcImMyXCIpLCFhLmNsYXNzTGlzdC5jb250YWlucyhcImMyXCIpKXt2YXIgYj1mdW5jdGlvbihhKXt2YXIgYj1ET01Ub2tlbkxpc3QucHJvdG90eXBlW2FdO0RPTVRva2VuTGlzdC5wcm90b3R5cGVbYV09ZnVuY3Rpb24oYSl7dmFyIGMsZD1hcmd1bWVudHMubGVuZ3RoO2ZvcihjPTA7YzxkO2MrKylhPWFyZ3VtZW50c1tjXSxiLmNhbGwodGhpcyxhKX19O2IoXCJhZGRcIiksYihcInJlbW92ZVwiKX1pZihhLmNsYXNzTGlzdC50b2dnbGUoXCJjM1wiLCExKSxhLmNsYXNzTGlzdC5jb250YWlucyhcImMzXCIpKXt2YXIgYz1ET01Ub2tlbkxpc3QucHJvdG90eXBlLnRvZ2dsZTtET01Ub2tlbkxpc3QucHJvdG90eXBlLnRvZ2dsZT1mdW5jdGlvbihhLGIpe3JldHVybiAxIGluIGFyZ3VtZW50cyYmIXRoaXMuY29udGFpbnMoYSk9PSFiP2I6Yy5jYWxsKHRoaXMsYSl9fWE9bnVsbH0oKTohZnVuY3Rpb24oYSl7XCJ1c2Ugc3RyaWN0XCI7aWYoXCJFbGVtZW50XCJpbiBhKXt2YXIgYj1cImNsYXNzTGlzdFwiLGM9XCJwcm90b3R5cGVcIixkPWEuRWxlbWVudFtjXSxlPU9iamVjdCxmPVN0cmluZ1tjXS50cmltfHxmdW5jdGlvbigpe3JldHVybiB0aGlzLnJlcGxhY2UoL15cXHMrfFxccyskL2csXCJcIil9LGc9QXJyYXlbY10uaW5kZXhPZnx8ZnVuY3Rpb24oYSl7Zm9yKHZhciBiPTAsYz10aGlzLmxlbmd0aDtiPGM7YisrKWlmKGIgaW4gdGhpcyYmdGhpc1tiXT09PWEpcmV0dXJuIGI7cmV0dXJuLTF9LGg9ZnVuY3Rpb24oYSxiKXt0aGlzLm5hbWU9YSx0aGlzLmNvZGU9RE9NRXhjZXB0aW9uW2FdLHRoaXMubWVzc2FnZT1ifSxpPWZ1bmN0aW9uKGEsYil7aWYoXCJcIj09PWIpdGhyb3cgbmV3IGgoXCJTWU5UQVhfRVJSXCIsXCJBbiBpbnZhbGlkIG9yIGlsbGVnYWwgc3RyaW5nIHdhcyBzcGVjaWZpZWRcIik7aWYoL1xccy8udGVzdChiKSl0aHJvdyBuZXcgaChcIklOVkFMSURfQ0hBUkFDVEVSX0VSUlwiLFwiU3RyaW5nIGNvbnRhaW5zIGFuIGludmFsaWQgY2hhcmFjdGVyXCIpO3JldHVybiBnLmNhbGwoYSxiKX0saj1mdW5jdGlvbihhKXtmb3IodmFyIGI9Zi5jYWxsKGEuZ2V0QXR0cmlidXRlKFwiY2xhc3NcIil8fFwiXCIpLGM9Yj9iLnNwbGl0KC9cXHMrLyk6W10sZD0wLGU9Yy5sZW5ndGg7ZDxlO2QrKyl0aGlzLnB1c2goY1tkXSk7dGhpcy5fdXBkYXRlQ2xhc3NOYW1lPWZ1bmN0aW9uKCl7YS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLHRoaXMudG9TdHJpbmcoKSl9fSxrPWpbY109W10sbD1mdW5jdGlvbigpe3JldHVybiBuZXcgaih0aGlzKX07aWYoaFtjXT1FcnJvcltjXSxrLml0ZW09ZnVuY3Rpb24oYSl7cmV0dXJuIHRoaXNbYV18fG51bGx9LGsuY29udGFpbnM9ZnVuY3Rpb24oYSl7cmV0dXJuIGErPVwiXCIsaSh0aGlzLGEpIT09LTF9LGsuYWRkPWZ1bmN0aW9uKCl7dmFyIGEsYj1hcmd1bWVudHMsYz0wLGQ9Yi5sZW5ndGgsZT0hMTtkbyBhPWJbY10rXCJcIixpKHRoaXMsYSk9PT0tMSYmKHRoaXMucHVzaChhKSxlPSEwKTt3aGlsZSgrK2M8ZCk7ZSYmdGhpcy5fdXBkYXRlQ2xhc3NOYW1lKCl9LGsucmVtb3ZlPWZ1bmN0aW9uKCl7dmFyIGEsYixjPWFyZ3VtZW50cyxkPTAsZT1jLmxlbmd0aCxmPSExO2RvIGZvcihhPWNbZF0rXCJcIixiPWkodGhpcyxhKTtiIT09LTE7KXRoaXMuc3BsaWNlKGIsMSksZj0hMCxiPWkodGhpcyxhKTt3aGlsZSgrK2Q8ZSk7ZiYmdGhpcy5fdXBkYXRlQ2xhc3NOYW1lKCl9LGsudG9nZ2xlPWZ1bmN0aW9uKGEsYil7YSs9XCJcIjt2YXIgYz10aGlzLmNvbnRhaW5zKGEpLGQ9Yz9iIT09ITAmJlwicmVtb3ZlXCI6YiE9PSExJiZcImFkZFwiO3JldHVybiBkJiZ0aGlzW2RdKGEpLGI9PT0hMHx8Yj09PSExP2I6IWN9LGsudG9TdHJpbmc9ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5qb2luKFwiIFwiKX0sZS5kZWZpbmVQcm9wZXJ0eSl7dmFyIG09e2dldDpsLGVudW1lcmFibGU6ITAsY29uZmlndXJhYmxlOiEwfTt0cnl7ZS5kZWZpbmVQcm9wZXJ0eShkLGIsbSl9Y2F0Y2gobil7bi5udW1iZXI9PT0tMjE0NjgyMzI1MiYmKG0uZW51bWVyYWJsZT0hMSxlLmRlZmluZVByb3BlcnR5KGQsYixtKSl9fWVsc2UgZVtjXS5fX2RlZmluZUdldHRlcl9fJiZkLl9fZGVmaW5lR2V0dGVyX18oYixsKX19KHdpbmRvdy5zZWxmKSl9LHt9XSwyOltmdW5jdGlvbihhLGIsYyl7ZnVuY3Rpb24gZChhLGIpe2lmKFwic3RyaW5nXCIhPXR5cGVvZiBhKXRocm93IG5ldyBUeXBlRXJyb3IoXCJTdHJpbmcgZXhwZWN0ZWRcIik7Ynx8KGI9ZG9jdW1lbnQpO3ZhciBjPS88KFtcXHc6XSspLy5leGVjKGEpO2lmKCFjKXJldHVybiBiLmNyZWF0ZVRleHROb2RlKGEpO2E9YS5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLFwiXCIpO3ZhciBkPWNbMV07aWYoXCJib2R5XCI9PWQpe3ZhciBlPWIuY3JlYXRlRWxlbWVudChcImh0bWxcIik7cmV0dXJuIGUuaW5uZXJIVE1MPWEsZS5yZW1vdmVDaGlsZChlLmxhc3RDaGlsZCl9dmFyIGY9Z1tkXXx8Zy5fZGVmYXVsdCxoPWZbMF0saT1mWzFdLGo9ZlsyXSxlPWIuY3JlYXRlRWxlbWVudChcImRpdlwiKTtmb3IoZS5pbm5lckhUTUw9aSthK2o7aC0tOyllPWUubGFzdENoaWxkO2lmKGUuZmlyc3RDaGlsZD09ZS5sYXN0Q2hpbGQpcmV0dXJuIGUucmVtb3ZlQ2hpbGQoZS5maXJzdENoaWxkKTtmb3IodmFyIGs9Yi5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7ZS5maXJzdENoaWxkOylrLmFwcGVuZENoaWxkKGUucmVtb3ZlQ2hpbGQoZS5maXJzdENoaWxkKSk7cmV0dXJuIGt9Yi5leHBvcnRzPWQ7dmFyIGUsZj0hMTtcInVuZGVmaW5lZFwiIT10eXBlb2YgZG9jdW1lbnQmJihlPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiksZS5pbm5lckhUTUw9JyAgPGxpbmsvPjx0YWJsZT48L3RhYmxlPjxhIGhyZWY9XCIvYVwiPmE8L2E+PGlucHV0IHR5cGU9XCJjaGVja2JveFwiLz4nLGY9IWUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJsaW5rXCIpLmxlbmd0aCxlPXZvaWQgMCk7dmFyIGc9e2xlZ2VuZDpbMSxcIjxmaWVsZHNldD5cIixcIjwvZmllbGRzZXQ+XCJdLHRyOlsyLFwiPHRhYmxlPjx0Ym9keT5cIixcIjwvdGJvZHk+PC90YWJsZT5cIl0sY29sOlsyLFwiPHRhYmxlPjx0Ym9keT48L3Rib2R5Pjxjb2xncm91cD5cIixcIjwvY29sZ3JvdXA+PC90YWJsZT5cIl0sX2RlZmF1bHQ6Zj9bMSxcIlg8ZGl2PlwiLFwiPC9kaXY+XCJdOlswLFwiXCIsXCJcIl19O2cudGQ9Zy50aD1bMyxcIjx0YWJsZT48dGJvZHk+PHRyPlwiLFwiPC90cj48L3Rib2R5PjwvdGFibGU+XCJdLGcub3B0aW9uPWcub3B0Z3JvdXA9WzEsJzxzZWxlY3QgbXVsdGlwbGU9XCJtdWx0aXBsZVwiPicsXCI8L3NlbGVjdD5cIl0sZy50aGVhZD1nLnRib2R5PWcuY29sZ3JvdXA9Zy5jYXB0aW9uPWcudGZvb3Q9WzEsXCI8dGFibGU+XCIsXCI8L3RhYmxlPlwiXSxnLnBvbHlsaW5lPWcuZWxsaXBzZT1nLnBvbHlnb249Zy5jaXJjbGU9Zy50ZXh0PWcubGluZT1nLnBhdGg9Zy5yZWN0PWcuZz1bMSwnPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmVyc2lvbj1cIjEuMVwiPicsXCI8L3N2Zz5cIl19LHt9XSwzOltmdW5jdGlvbihhLGIsYyl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gZChhLGIpe2lmKHZvaWQgMD09PWF8fG51bGw9PT1hKXRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY29udmVydCBmaXJzdCBhcmd1bWVudCB0byBvYmplY3RcIik7Zm9yKHZhciBjPU9iamVjdChhKSxkPTE7ZDxhcmd1bWVudHMubGVuZ3RoO2QrKyl7dmFyIGU9YXJndW1lbnRzW2RdO2lmKHZvaWQgMCE9PWUmJm51bGwhPT1lKWZvcih2YXIgZj1PYmplY3Qua2V5cyhPYmplY3QoZSkpLGc9MCxoPWYubGVuZ3RoO2c8aDtnKyspe3ZhciBpPWZbZ10saj1PYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGUsaSk7dm9pZCAwIT09aiYmai5lbnVtZXJhYmxlJiYoY1tpXT1lW2ldKX19cmV0dXJuIGN9ZnVuY3Rpb24gZSgpe09iamVjdC5hc3NpZ258fE9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QsXCJhc3NpZ25cIix7ZW51bWVyYWJsZTohMSxjb25maWd1cmFibGU6ITAsd3JpdGFibGU6ITAsdmFsdWU6ZH0pfWIuZXhwb3J0cz17YXNzaWduOmQscG9seWZpbGw6ZX19LHt9XSw0OltmdW5jdGlvbihhLGIsYyl7ZnVuY3Rpb24gZChhLGIpe1wib2JqZWN0XCIhPXR5cGVvZiBiP2I9e2hhc2g6ISFifTp2b2lkIDA9PT1iLmhhc2gmJihiLmhhc2g9ITApO2Zvcih2YXIgYz1iLmhhc2g/e306XCJcIixkPWIuc2VyaWFsaXplcnx8KGIuaGFzaD9nOmgpLGU9YSYmYS5lbGVtZW50cz9hLmVsZW1lbnRzOltdLGY9T2JqZWN0LmNyZWF0ZShudWxsKSxrPTA7azxlLmxlbmd0aDsrK2spe3ZhciBsPWVba107aWYoKGIuZGlzYWJsZWR8fCFsLmRpc2FibGVkKSYmbC5uYW1lJiZqLnRlc3QobC5ub2RlTmFtZSkmJiFpLnRlc3QobC50eXBlKSl7dmFyIG09bC5uYW1lLG49bC52YWx1ZTtpZihcImNoZWNrYm94XCIhPT1sLnR5cGUmJlwicmFkaW9cIiE9PWwudHlwZXx8bC5jaGVja2VkfHwobj12b2lkIDApLGIuZW1wdHkpe2lmKFwiY2hlY2tib3hcIiE9PWwudHlwZXx8bC5jaGVja2VkfHwobj1cIlwiKSxcInJhZGlvXCI9PT1sLnR5cGUmJihmW2wubmFtZV18fGwuY2hlY2tlZD9sLmNoZWNrZWQmJihmW2wubmFtZV09ITApOmZbbC5uYW1lXT0hMSksIW4mJlwicmFkaW9cIj09bC50eXBlKWNvbnRpbnVlfWVsc2UgaWYoIW4pY29udGludWU7aWYoXCJzZWxlY3QtbXVsdGlwbGVcIiE9PWwudHlwZSljPWQoYyxtLG4pO2Vsc2V7bj1bXTtmb3IodmFyIG89bC5vcHRpb25zLHA9ITEscT0wO3E8by5sZW5ndGg7KytxKXt2YXIgcj1vW3FdLHM9Yi5lbXB0eSYmIXIudmFsdWUsdD1yLnZhbHVlfHxzO3Iuc2VsZWN0ZWQmJnQmJihwPSEwLGM9Yi5oYXNoJiZcIltdXCIhPT1tLnNsaWNlKG0ubGVuZ3RoLTIpP2QoYyxtK1wiW11cIixyLnZhbHVlKTpkKGMsbSxyLnZhbHVlKSl9IXAmJmIuZW1wdHkmJihjPWQoYyxtLFwiXCIpKX19fWlmKGIuZW1wdHkpZm9yKHZhciBtIGluIGYpZlttXXx8KGM9ZChjLG0sXCJcIikpO3JldHVybiBjfWZ1bmN0aW9uIGUoYSl7dmFyIGI9W10sYz0vXihbXlxcW1xcXV0qKS8sZD1uZXcgUmVnRXhwKGspLGU9Yy5leGVjKGEpO2ZvcihlWzFdJiZiLnB1c2goZVsxXSk7bnVsbCE9PShlPWQuZXhlYyhhKSk7KWIucHVzaChlWzFdKTtyZXR1cm4gYn1mdW5jdGlvbiBmKGEsYixjKXtpZigwPT09Yi5sZW5ndGgpcmV0dXJuIGE9Yzt2YXIgZD1iLnNoaWZ0KCksZT1kLm1hdGNoKC9eXFxbKC4rPylcXF0kLyk7aWYoXCJbXVwiPT09ZClyZXR1cm4gYT1hfHxbXSxBcnJheS5pc0FycmF5KGEpP2EucHVzaChmKG51bGwsYixjKSk6KGEuX3ZhbHVlcz1hLl92YWx1ZXN8fFtdLGEuX3ZhbHVlcy5wdXNoKGYobnVsbCxiLGMpKSksYTtpZihlKXt2YXIgZz1lWzFdLGg9K2c7aXNOYU4oaCk/KGE9YXx8e30sYVtnXT1mKGFbZ10sYixjKSk6KGE9YXx8W10sYVtoXT1mKGFbaF0sYixjKSl9ZWxzZSBhW2RdPWYoYVtkXSxiLGMpO3JldHVybiBhfWZ1bmN0aW9uIGcoYSxiLGMpe3ZhciBkPWIubWF0Y2goayk7aWYoZCl7dmFyIGc9ZShiKTtmKGEsZyxjKX1lbHNle3ZhciBoPWFbYl07aD8oQXJyYXkuaXNBcnJheShoKXx8KGFbYl09W2hdKSxhW2JdLnB1c2goYykpOmFbYl09Y31yZXR1cm4gYX1mdW5jdGlvbiBoKGEsYixjKXtyZXR1cm4gYz1jLnJlcGxhY2UoLyhcXHIpP1xcbi9nLFwiXFxyXFxuXCIpLGM9ZW5jb2RlVVJJQ29tcG9uZW50KGMpLGM9Yy5yZXBsYWNlKC8lMjAvZyxcIitcIiksYSsoYT9cIiZcIjpcIlwiKStlbmNvZGVVUklDb21wb25lbnQoYikrXCI9XCIrY312YXIgaT0vXig/OnN1Ym1pdHxidXR0b258aW1hZ2V8cmVzZXR8ZmlsZSkkL2ksaj0vXig/OmlucHV0fHNlbGVjdHx0ZXh0YXJlYXxrZXlnZW4pL2ksaz0vKFxcW1teXFxbXFxdXSpcXF0pL2c7Yi5leHBvcnRzPWR9LHt9XSw1OltmdW5jdGlvbihiLGMsZCl7KGZ1bmN0aW9uKGUpeyFmdW5jdGlvbihiKXtpZihcIm9iamVjdFwiPT10eXBlb2YgZCYmXCJ1bmRlZmluZWRcIiE9dHlwZW9mIGMpYy5leHBvcnRzPWIoKTtlbHNlIGlmKFwiZnVuY3Rpb25cIj09dHlwZW9mIGEmJmEuYW1kKWEoW10sYik7ZWxzZXt2YXIgZjtmPVwidW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3c/d2luZG93OlwidW5kZWZpbmVkXCIhPXR5cGVvZiBlP2U6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHNlbGY/c2VsZjp0aGlzLGYudmV4RGlhbG9nPWIoKX19KGZ1bmN0aW9uKCl7cmV0dXJuIGZ1bmN0aW9uIGEoYyxkLGUpe2Z1bmN0aW9uIGYoaCxpKXtpZighZFtoXSl7aWYoIWNbaF0pe3ZhciBqPVwiZnVuY3Rpb25cIj09dHlwZW9mIGImJmI7aWYoIWkmJmopcmV0dXJuIGooaCwhMCk7aWYoZylyZXR1cm4gZyhoLCEwKTt2YXIgaz1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2grXCInXCIpO3Rocm93IGsuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixrfXZhciBsPWRbaF09e2V4cG9ydHM6e319O2NbaF1bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oYSl7dmFyIGI9Y1toXVsxXVthXTtyZXR1cm4gZihiP2I6YSl9LGwsbC5leHBvcnRzLGEsYyxkLGUpfXJldHVybiBkW2hdLmV4cG9ydHN9Zm9yKHZhciBnPVwiZnVuY3Rpb25cIj09dHlwZW9mIGImJmIsaD0wO2g8ZS5sZW5ndGg7aCsrKWYoZVtoXSk7cmV0dXJuIGZ9KHsxOltmdW5jdGlvbihhLGIsYyl7ZnVuY3Rpb24gZChhLGIpe2lmKFwic3RyaW5nXCIhPXR5cGVvZiBhKXRocm93IG5ldyBUeXBlRXJyb3IoXCJTdHJpbmcgZXhwZWN0ZWRcIik7Ynx8KGI9ZG9jdW1lbnQpO3ZhciBjPS88KFtcXHc6XSspLy5leGVjKGEpO2lmKCFjKXJldHVybiBiLmNyZWF0ZVRleHROb2RlKGEpO2E9YS5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLFwiXCIpO3ZhciBkPWNbMV07aWYoXCJib2R5XCI9PWQpe3ZhciBlPWIuY3JlYXRlRWxlbWVudChcImh0bWxcIik7cmV0dXJuIGUuaW5uZXJIVE1MPWEsZS5yZW1vdmVDaGlsZChlLmxhc3RDaGlsZCl9dmFyIGY9Z1tkXXx8Zy5fZGVmYXVsdCxoPWZbMF0saT1mWzFdLGo9ZlsyXSxlPWIuY3JlYXRlRWxlbWVudChcImRpdlwiKTtmb3IoZS5pbm5lckhUTUw9aSthK2o7aC0tOyllPWUubGFzdENoaWxkO2lmKGUuZmlyc3RDaGlsZD09ZS5sYXN0Q2hpbGQpcmV0dXJuIGUucmVtb3ZlQ2hpbGQoZS5maXJzdENoaWxkKTtmb3IodmFyIGs9Yi5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7ZS5maXJzdENoaWxkOylrLmFwcGVuZENoaWxkKGUucmVtb3ZlQ2hpbGQoZS5maXJzdENoaWxkKSk7cmV0dXJuIGt9Yi5leHBvcnRzPWQ7dmFyIGUsZj0hMTtcInVuZGVmaW5lZFwiIT10eXBlb2YgZG9jdW1lbnQmJihlPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiksZS5pbm5lckhUTUw9JyAgPGxpbmsvPjx0YWJsZT48L3RhYmxlPjxhIGhyZWY9XCIvYVwiPmE8L2E+PGlucHV0IHR5cGU9XCJjaGVja2JveFwiLz4nLGY9IWUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJsaW5rXCIpLmxlbmd0aCxlPXZvaWQgMCk7dmFyIGc9e2xlZ2VuZDpbMSxcIjxmaWVsZHNldD5cIixcIjwvZmllbGRzZXQ+XCJdLHRyOlsyLFwiPHRhYmxlPjx0Ym9keT5cIixcIjwvdGJvZHk+PC90YWJsZT5cIl0sY29sOlsyLFwiPHRhYmxlPjx0Ym9keT48L3Rib2R5Pjxjb2xncm91cD5cIixcIjwvY29sZ3JvdXA+PC90YWJsZT5cIl0sX2RlZmF1bHQ6Zj9bMSxcIlg8ZGl2PlwiLFwiPC9kaXY+XCJdOlswLFwiXCIsXCJcIl19O2cudGQ9Zy50aD1bMyxcIjx0YWJsZT48dGJvZHk+PHRyPlwiLFwiPC90cj48L3Rib2R5PjwvdGFibGU+XCJdLGcub3B0aW9uPWcub3B0Z3JvdXA9WzEsJzxzZWxlY3QgbXVsdGlwbGU9XCJtdWx0aXBsZVwiPicsXCI8L3NlbGVjdD5cIl0sZy50aGVhZD1nLnRib2R5PWcuY29sZ3JvdXA9Zy5jYXB0aW9uPWcudGZvb3Q9WzEsXCI8dGFibGU+XCIsXCI8L3RhYmxlPlwiXSxnLnBvbHlsaW5lPWcuZWxsaXBzZT1nLnBvbHlnb249Zy5jaXJjbGU9Zy50ZXh0PWcubGluZT1nLnBhdGg9Zy5yZWN0PWcuZz1bMSwnPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmVyc2lvbj1cIjEuMVwiPicsXCI8L3N2Zz5cIl19LHt9XSwyOltmdW5jdGlvbihhLGIsYyl7ZnVuY3Rpb24gZChhLGIpe1wib2JqZWN0XCIhPXR5cGVvZiBiP2I9e2hhc2g6ISFifTp2b2lkIDA9PT1iLmhhc2gmJihiLmhhc2g9ITApO2Zvcih2YXIgYz1iLmhhc2g/e306XCJcIixkPWIuc2VyaWFsaXplcnx8KGIuaGFzaD9nOmgpLGU9YSYmYS5lbGVtZW50cz9hLmVsZW1lbnRzOltdLGY9T2JqZWN0LmNyZWF0ZShudWxsKSxrPTA7azxlLmxlbmd0aDsrK2spe3ZhciBsPWVba107aWYoKGIuZGlzYWJsZWR8fCFsLmRpc2FibGVkKSYmbC5uYW1lJiZqLnRlc3QobC5ub2RlTmFtZSkmJiFpLnRlc3QobC50eXBlKSl7dmFyIG09bC5uYW1lLG49bC52YWx1ZTtpZihcImNoZWNrYm94XCIhPT1sLnR5cGUmJlwicmFkaW9cIiE9PWwudHlwZXx8bC5jaGVja2VkfHwobj12b2lkIDApLGIuZW1wdHkpe2lmKFwiY2hlY2tib3hcIiE9PWwudHlwZXx8bC5jaGVja2VkfHwobj1cIlwiKSxcInJhZGlvXCI9PT1sLnR5cGUmJihmW2wubmFtZV18fGwuY2hlY2tlZD9sLmNoZWNrZWQmJihmW2wubmFtZV09ITApOmZbbC5uYW1lXT0hMSksIW4mJlwicmFkaW9cIj09bC50eXBlKWNvbnRpbnVlfWVsc2UgaWYoIW4pY29udGludWU7aWYoXCJzZWxlY3QtbXVsdGlwbGVcIiE9PWwudHlwZSljPWQoYyxtLG4pO2Vsc2V7bj1bXTtmb3IodmFyIG89bC5vcHRpb25zLHA9ITEscT0wO3E8by5sZW5ndGg7KytxKXt2YXIgcj1vW3FdLHM9Yi5lbXB0eSYmIXIudmFsdWUsdD1yLnZhbHVlfHxzO3Iuc2VsZWN0ZWQmJnQmJihwPSEwLGM9Yi5oYXNoJiZcIltdXCIhPT1tLnNsaWNlKG0ubGVuZ3RoLTIpP2QoYyxtK1wiW11cIixyLnZhbHVlKTpkKGMsbSxyLnZhbHVlKSl9IXAmJmIuZW1wdHkmJihjPWQoYyxtLFwiXCIpKX19fWlmKGIuZW1wdHkpZm9yKHZhciBtIGluIGYpZlttXXx8KGM9ZChjLG0sXCJcIikpO3JldHVybiBjfWZ1bmN0aW9uIGUoYSl7dmFyIGI9W10sYz0vXihbXlxcW1xcXV0qKS8sZD1uZXcgUmVnRXhwKGspLGU9Yy5leGVjKGEpO2ZvcihlWzFdJiZiLnB1c2goZVsxXSk7bnVsbCE9PShlPWQuZXhlYyhhKSk7KWIucHVzaChlWzFdKTtyZXR1cm4gYn1mdW5jdGlvbiBmKGEsYixjKXtpZigwPT09Yi5sZW5ndGgpcmV0dXJuIGE9Yzt2YXIgZD1iLnNoaWZ0KCksZT1kLm1hdGNoKC9eXFxbKC4rPylcXF0kLyk7aWYoXCJbXVwiPT09ZClyZXR1cm4gYT1hfHxbXSxBcnJheS5pc0FycmF5KGEpP2EucHVzaChmKG51bGwsYixjKSk6KGEuX3ZhbHVlcz1hLl92YWx1ZXN8fFtdLGEuX3ZhbHVlcy5wdXNoKGYobnVsbCxiLGMpKSksYTtpZihlKXt2YXIgZz1lWzFdLGg9K2c7aXNOYU4oaCk/KGE9YXx8e30sYVtnXT1mKGFbZ10sYixjKSk6KGE9YXx8W10sYVtoXT1mKGFbaF0sYixjKSl9ZWxzZSBhW2RdPWYoYVtkXSxiLGMpO3JldHVybiBhfWZ1bmN0aW9uIGcoYSxiLGMpe3ZhciBkPWIubWF0Y2goayk7aWYoZCl7dmFyIGc9ZShiKTtmKGEsZyxjKX1lbHNle3ZhciBoPWFbYl07aD8oQXJyYXkuaXNBcnJheShoKXx8KGFbYl09W2hdKSxhW2JdLnB1c2goYykpOmFbYl09Y31yZXR1cm4gYX1mdW5jdGlvbiBoKGEsYixjKXtyZXR1cm4gYz1jLnJlcGxhY2UoLyhcXHIpP1xcbi9nLFwiXFxyXFxuXCIpLGM9ZW5jb2RlVVJJQ29tcG9uZW50KGMpLGM9Yy5yZXBsYWNlKC8lMjAvZyxcIitcIiksYSsoYT9cIiZcIjpcIlwiKStlbmNvZGVVUklDb21wb25lbnQoYikrXCI9XCIrY312YXIgaT0vXig/OnN1Ym1pdHxidXR0b258aW1hZ2V8cmVzZXR8ZmlsZSkkL2ksaj0vXig/OmlucHV0fHNlbGVjdHx0ZXh0YXJlYXxrZXlnZW4pL2ksaz0vKFxcW1teXFxbXFxdXSpcXF0pL2c7Yi5leHBvcnRzPWR9LHt9XSwzOltmdW5jdGlvbihhLGIsYyl7dmFyIGQ9YShcImRvbWlmeVwiKSxlPWEoXCJmb3JtLXNlcmlhbGl6ZVwiKSxmPWZ1bmN0aW9uKGEpe3ZhciBiPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJmb3JtXCIpO2IuY2xhc3NMaXN0LmFkZChcInZleC1kaWFsb2ctZm9ybVwiKTt2YXIgYz1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO2MuY2xhc3NMaXN0LmFkZChcInZleC1kaWFsb2ctbWVzc2FnZVwiKSxjLmFwcGVuZENoaWxkKGEubWVzc2FnZSBpbnN0YW5jZW9mIHdpbmRvdy5Ob2RlP2EubWVzc2FnZTpkKGEubWVzc2FnZSkpO3ZhciBlPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7cmV0dXJuIGUuY2xhc3NMaXN0LmFkZChcInZleC1kaWFsb2ctaW5wdXRcIiksZS5hcHBlbmRDaGlsZChhLmlucHV0IGluc3RhbmNlb2Ygd2luZG93Lk5vZGU/YS5pbnB1dDpkKGEuaW5wdXQpKSxiLmFwcGVuZENoaWxkKGMpLGIuYXBwZW5kQ2hpbGQoZSksYn0sZz1mdW5jdGlvbihhKXt2YXIgYj1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO2IuY2xhc3NMaXN0LmFkZChcInZleC1kaWFsb2ctYnV0dG9uc1wiKTtmb3IodmFyIGM9MDtjPGEubGVuZ3RoO2MrKyl7dmFyIGQ9YVtjXSxlPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7ZS50eXBlPWQudHlwZSxlLnRleHRDb250ZW50PWQudGV4dCxlLmNsYXNzTmFtZT1kLmNsYXNzTmFtZSxlLmNsYXNzTGlzdC5hZGQoXCJ2ZXgtZGlhbG9nLWJ1dHRvblwiKSwwPT09Yz9lLmNsYXNzTGlzdC5hZGQoXCJ2ZXgtZmlyc3RcIik6Yz09PWEubGVuZ3RoLTEmJmUuY2xhc3NMaXN0LmFkZChcInZleC1sYXN0XCIpLGZ1bmN0aW9uKGEpe2UuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsZnVuY3Rpb24oYil7YS5jbGljayYmYS5jbGljay5jYWxsKHRoaXMsYil9LmJpbmQodGhpcykpfS5iaW5kKHRoaXMpKGQpLGIuYXBwZW5kQ2hpbGQoZSl9cmV0dXJuIGJ9LGg9ZnVuY3Rpb24oYSl7dmFyIGI9e25hbWU6XCJkaWFsb2dcIixvcGVuOmZ1bmN0aW9uKGIpe3ZhciBjPU9iamVjdC5hc3NpZ24oe30sdGhpcy5kZWZhdWx0T3B0aW9ucyxiKTtjLnVuc2FmZU1lc3NhZ2UmJiFjLm1lc3NhZ2U/Yy5tZXNzYWdlPWMudW5zYWZlTWVzc2FnZTpjLm1lc3NhZ2UmJihjLm1lc3NhZ2U9YS5fZXNjYXBlSHRtbChjLm1lc3NhZ2UpKTt2YXIgZD1jLnVuc2FmZUNvbnRlbnQ9ZihjKSxlPWEub3BlbihjKSxoPWMuYmVmb3JlQ2xvc2UmJmMuYmVmb3JlQ2xvc2UuYmluZChlKTtpZihlLm9wdGlvbnMuYmVmb3JlQ2xvc2U9ZnVuY3Rpb24oKXt2YXIgYT0haHx8aCgpO3JldHVybiBhJiZjLmNhbGxiYWNrKHRoaXMudmFsdWV8fCExKSxhfS5iaW5kKGUpLGQuYXBwZW5kQ2hpbGQoZy5jYWxsKGUsYy5idXR0b25zKSksZS5mb3JtPWQsZC5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsYy5vblN1Ym1pdC5iaW5kKGUpKSxjLmZvY3VzRmlyc3RJbnB1dCl7dmFyIGk9ZS5jb250ZW50RWwucXVlcnlTZWxlY3RvcihcImJ1dHRvbiwgaW5wdXQsIHNlbGVjdCwgdGV4dGFyZWFcIik7aSYmaS5mb2N1cygpfXJldHVybiBlfSxhbGVydDpmdW5jdGlvbihhKXtyZXR1cm5cInN0cmluZ1wiPT10eXBlb2YgYSYmKGE9e21lc3NhZ2U6YX0pLGE9T2JqZWN0LmFzc2lnbih7fSx0aGlzLmRlZmF1bHRPcHRpb25zLHRoaXMuZGVmYXVsdEFsZXJ0T3B0aW9ucyxhKSx0aGlzLm9wZW4oYSl9LGNvbmZpcm06ZnVuY3Rpb24oYSl7aWYoXCJvYmplY3RcIiE9dHlwZW9mIGF8fFwiZnVuY3Rpb25cIiE9dHlwZW9mIGEuY2FsbGJhY2spdGhyb3cgbmV3IEVycm9yKFwiZGlhbG9nLmNvbmZpcm0ob3B0aW9ucykgcmVxdWlyZXMgb3B0aW9ucy5jYWxsYmFjay5cIik7cmV0dXJuIGE9T2JqZWN0LmFzc2lnbih7fSx0aGlzLmRlZmF1bHRPcHRpb25zLHRoaXMuZGVmYXVsdENvbmZpcm1PcHRpb25zLGEpLHRoaXMub3BlbihhKX0scHJvbXB0OmZ1bmN0aW9uKGIpe2lmKFwib2JqZWN0XCIhPXR5cGVvZiBifHxcImZ1bmN0aW9uXCIhPXR5cGVvZiBiLmNhbGxiYWNrKXRocm93IG5ldyBFcnJvcihcImRpYWxvZy5wcm9tcHQob3B0aW9ucykgcmVxdWlyZXMgb3B0aW9ucy5jYWxsYmFjay5cIik7dmFyIGM9T2JqZWN0LmFzc2lnbih7fSx0aGlzLmRlZmF1bHRPcHRpb25zLHRoaXMuZGVmYXVsdFByb21wdE9wdGlvbnMpLGQ9e3Vuc2FmZU1lc3NhZ2U6JzxsYWJlbCBmb3I9XCJ2ZXhcIj4nK2EuX2VzY2FwZUh0bWwoYi5sYWJlbHx8Yy5sYWJlbCkrXCI8L2xhYmVsPlwiLGlucHV0Oic8aW5wdXQgbmFtZT1cInZleFwiIHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJ2ZXgtZGlhbG9nLXByb21wdC1pbnB1dFwiIHBsYWNlaG9sZGVyPVwiJythLl9lc2NhcGVIdG1sKGIucGxhY2Vob2xkZXJ8fGMucGxhY2Vob2xkZXIpKydcIiB2YWx1ZT1cIicrYS5fZXNjYXBlSHRtbChiLnZhbHVlfHxjLnZhbHVlKSsnXCIgLz4nfTtiPU9iamVjdC5hc3NpZ24oYyxkLGIpO3ZhciBlPWIuY2FsbGJhY2s7cmV0dXJuIGIuY2FsbGJhY2s9ZnVuY3Rpb24oYSl7aWYoXCJvYmplY3RcIj09dHlwZW9mIGEpe3ZhciBiPU9iamVjdC5rZXlzKGEpO2E9Yi5sZW5ndGg/YVtiWzBdXTpcIlwifWUoYSl9LHRoaXMub3BlbihiKX19O3JldHVybiBiLmJ1dHRvbnM9e1lFUzp7dGV4dDpcIk9LXCIsdHlwZTpcInN1Ym1pdFwiLGNsYXNzTmFtZTpcInZleC1kaWFsb2ctYnV0dG9uLXByaW1hcnlcIixjbGljazpmdW5jdGlvbigpe3RoaXMudmFsdWU9ITB9fSxOTzp7dGV4dDpcIkNhbmNlbFwiLHR5cGU6XCJidXR0b25cIixjbGFzc05hbWU6XCJ2ZXgtZGlhbG9nLWJ1dHRvbi1zZWNvbmRhcnlcIixjbGljazpmdW5jdGlvbigpe3RoaXMudmFsdWU9ITEsdGhpcy5jbG9zZSgpfX19LGIuZGVmYXVsdE9wdGlvbnM9e2NhbGxiYWNrOmZ1bmN0aW9uKCl7fSxhZnRlck9wZW46ZnVuY3Rpb24oKXt9LG1lc3NhZ2U6XCJcIixpbnB1dDpcIlwiLGJ1dHRvbnM6W2IuYnV0dG9ucy5ZRVMsYi5idXR0b25zLk5PXSxzaG93Q2xvc2VCdXR0b246ITEsb25TdWJtaXQ6ZnVuY3Rpb24oYSl7cmV0dXJuIGEucHJldmVudERlZmF1bHQoKSx0aGlzLm9wdGlvbnMuaW5wdXQmJih0aGlzLnZhbHVlPWUodGhpcy5mb3JtLHtoYXNoOiEwfSkpLHRoaXMuY2xvc2UoKX0sZm9jdXNGaXJzdElucHV0OiEwfSxiLmRlZmF1bHRBbGVydE9wdGlvbnM9e2J1dHRvbnM6W2IuYnV0dG9ucy5ZRVNdfSxiLmRlZmF1bHRQcm9tcHRPcHRpb25zPXtsYWJlbDpcIlByb21wdDpcIixwbGFjZWhvbGRlcjpcIlwiLHZhbHVlOlwiXCJ9LGIuZGVmYXVsdENvbmZpcm1PcHRpb25zPXt9LGJ9O2IuZXhwb3J0cz1ofSx7ZG9taWZ5OjEsXCJmb3JtLXNlcmlhbGl6ZVwiOjJ9XX0se30sWzNdKSgzKX0pfSkuY2FsbCh0aGlzLFwidW5kZWZpbmVkXCIhPXR5cGVvZiBnbG9iYWw/Z2xvYmFsOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6e30pfSx7ZG9taWZ5OjIsXCJmb3JtLXNlcmlhbGl6ZVwiOjR9XSw2OltmdW5jdGlvbihhLGIsYyl7dmFyIGQ9YShcIi4vdmV4XCIpO2QucmVnaXN0ZXJQbHVnaW4oYShcInZleC1kaWFsb2dcIikpLGIuZXhwb3J0cz1kfSx7XCIuL3ZleFwiOjcsXCJ2ZXgtZGlhbG9nXCI6NX1dLDc6W2Z1bmN0aW9uKGEsYixjKXthKFwiY2xhc3NsaXN0LXBvbHlmaWxsXCIpLGEoXCJlczYtb2JqZWN0LWFzc2lnblwiKS5wb2x5ZmlsbCgpO3ZhciBkPWEoXCJkb21pZnlcIiksZT1mdW5jdGlvbihhKXtpZihcInVuZGVmaW5lZFwiIT10eXBlb2YgYSl7dmFyIGI9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtyZXR1cm4gYi5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShhKSksYi5pbm5lckhUTUx9cmV0dXJuXCJcIn0sZj1mdW5jdGlvbihhLGIpe2lmKFwic3RyaW5nXCI9PXR5cGVvZiBiJiYwIT09Yi5sZW5ndGgpZm9yKHZhciBjPWIuc3BsaXQoXCIgXCIpLGQ9MDtkPGMubGVuZ3RoO2QrKyl7dmFyIGU9Y1tkXTtlLmxlbmd0aCYmYS5jbGFzc0xpc3QuYWRkKGUpfX0sZz1mdW5jdGlvbigpe3ZhciBhPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiksYj17V2Via2l0QW5pbWF0aW9uOlwid2Via2l0QW5pbWF0aW9uRW5kXCIsTW96QW5pbWF0aW9uOlwiYW5pbWF0aW9uZW5kXCIsT0FuaW1hdGlvbjpcIm9hbmltYXRpb25lbmRcIixtc0FuaW1hdGlvbjpcIk1TQW5pbWF0aW9uRW5kXCIsYW5pbWF0aW9uOlwiYW5pbWF0aW9uZW5kXCJ9O2Zvcih2YXIgYyBpbiBiKWlmKHZvaWQgMCE9PWEuc3R5bGVbY10pcmV0dXJuIGJbY107cmV0dXJuITF9KCksaD17dmV4OlwidmV4XCIsY29udGVudDpcInZleC1jb250ZW50XCIsb3ZlcmxheTpcInZleC1vdmVybGF5XCIsY2xvc2U6XCJ2ZXgtY2xvc2VcIixjbG9zaW5nOlwidmV4LWNsb3NpbmdcIixvcGVuOlwidmV4LW9wZW5cIn0saT17fSxqPTEsaz0hMSxsPXtvcGVuOmZ1bmN0aW9uKGEpe3ZhciBiPWZ1bmN0aW9uKGEpe2NvbnNvbGUud2FybignVGhlIFwiJythKydcIiBwcm9wZXJ0eSBpcyBkZXByZWNhdGVkIGluIHZleCAzLiBVc2UgQ1NTIGNsYXNzZXMgYW5kIHRoZSBhcHByb3ByaWF0ZSBcIkNsYXNzTmFtZVwiIG9wdGlvbnMsIGluc3RlYWQuJyksY29uc29sZS53YXJuKFwiU2VlIGh0dHA6Ly9naXRodWIuaHVic3BvdC5jb20vdmV4L2FwaS9hZHZhbmNlZC8jb3B0aW9uc1wiKX07YS5jc3MmJmIoXCJjc3NcIiksYS5vdmVybGF5Q1NTJiZiKFwib3ZlcmxheUNTU1wiKSxhLmNvbnRlbnRDU1MmJmIoXCJjb250ZW50Q1NTXCIpLGEuY2xvc2VDU1MmJmIoXCJjbG9zZUNTU1wiKTt2YXIgYz17fTtjLmlkPWorKyxpW2MuaWRdPWMsYy5pc09wZW49ITAsYy5jbG9zZT1mdW5jdGlvbigpe2Z1bmN0aW9uIGEoYSl7cmV0dXJuXCJub25lXCIhPT1kLmdldFByb3BlcnR5VmFsdWUoYStcImFuaW1hdGlvbi1uYW1lXCIpJiZcIjBzXCIhPT1kLmdldFByb3BlcnR5VmFsdWUoYStcImFuaW1hdGlvbi1kdXJhdGlvblwiKX1pZighdGhpcy5pc09wZW4pcmV0dXJuITA7dmFyIGI9dGhpcy5vcHRpb25zO2lmKGsmJiFiLmVzY2FwZUJ1dHRvbkNsb3NlcylyZXR1cm4hMTt2YXIgYz1mdW5jdGlvbigpe3JldHVybiFiLmJlZm9yZUNsb3NlfHxiLmJlZm9yZUNsb3NlLmNhbGwodGhpcyl9LmJpbmQodGhpcykoKTtpZihjPT09ITEpcmV0dXJuITE7dGhpcy5pc09wZW49ITE7dmFyIGQ9d2luZG93LmdldENvbXB1dGVkU3R5bGUodGhpcy5jb250ZW50RWwpLGU9YShcIlwiKXx8YShcIi13ZWJraXQtXCIpfHxhKFwiLW1vei1cIil8fGEoXCItby1cIiksZj1mdW5jdGlvbiBqKCl7dGhpcy5yb290RWwucGFyZW50Tm9kZSYmKHRoaXMucm9vdEVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZyxqKSxkZWxldGUgaVt0aGlzLmlkXSx0aGlzLnJvb3RFbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMucm9vdEVsKSxiLmFmdGVyQ2xvc2UmJmIuYWZ0ZXJDbG9zZS5jYWxsKHRoaXMpLDA9PT1PYmplY3Qua2V5cyhpKS5sZW5ndGgmJmRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZShoLm9wZW4pKX0uYmluZCh0aGlzKTtyZXR1cm4gZyYmZT8odGhpcy5yb290RWwuYWRkRXZlbnRMaXN0ZW5lcihnLGYpLHRoaXMucm9vdEVsLmNsYXNzTGlzdC5hZGQoaC5jbG9zaW5nKSk6ZigpLCEwfSxcInN0cmluZ1wiPT10eXBlb2YgYSYmKGE9e2NvbnRlbnQ6YX0pLGEudW5zYWZlQ29udGVudCYmIWEuY29udGVudD9hLmNvbnRlbnQ9YS51bnNhZmVDb250ZW50OmEuY29udGVudCYmKGEuY29udGVudD1lKGEuY29udGVudCkpO3ZhciBtPWMub3B0aW9ucz1PYmplY3QuYXNzaWduKHt9LGwuZGVmYXVsdE9wdGlvbnMsYSksbj1jLnJvb3RFbD1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO24uY2xhc3NMaXN0LmFkZChoLnZleCksZihuLG0uY2xhc3NOYW1lKTt2YXIgbz1jLm92ZXJsYXlFbD1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO28uY2xhc3NMaXN0LmFkZChoLm92ZXJsYXkpLGYobyxtLm92ZXJsYXlDbGFzc05hbWUpLG0ub3ZlcmxheUNsb3Nlc09uQ2xpY2smJm8uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsZnVuY3Rpb24oYSl7YS50YXJnZXQ9PT1vJiZjLmNsb3NlKCl9KSxuLmFwcGVuZENoaWxkKG8pO3ZhciBwPWMuY29udGVudEVsPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7aWYocC5jbGFzc0xpc3QuYWRkKGguY29udGVudCksZihwLG0uY29udGVudENsYXNzTmFtZSkscC5hcHBlbmRDaGlsZChtLmNvbnRlbnQgaW5zdGFuY2VvZiB3aW5kb3cuTm9kZT9tLmNvbnRlbnQ6ZChtLmNvbnRlbnQpKSxuLmFwcGVuZENoaWxkKHApLG0uc2hvd0Nsb3NlQnV0dG9uKXt2YXIgcT1jLmNsb3NlRWw9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtxLmNsYXNzTGlzdC5hZGQoaC5jbG9zZSksZihxLG0uY2xvc2VDbGFzc05hbWUpLHEuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsYy5jbG9zZS5iaW5kKGMpKSxwLmFwcGVuZENoaWxkKHEpfXJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKG0uYXBwZW5kTG9jYXRpb24pLmFwcGVuZENoaWxkKG4pLG0uYWZ0ZXJPcGVuJiZtLmFmdGVyT3Blbi5jYWxsKGMpLGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZChoLm9wZW4pLGN9LGNsb3NlOmZ1bmN0aW9uKGEpe3ZhciBiO2lmKGEuaWQpYj1hLmlkO2Vsc2V7aWYoXCJzdHJpbmdcIiE9dHlwZW9mIGEpdGhyb3cgbmV3IFR5cGVFcnJvcihcImNsb3NlIHJlcXVpcmVzIGEgdmV4IG9iamVjdCBvciBpZCBzdHJpbmdcIik7Yj1hfXJldHVybiEhaVtiXSYmaVtiXS5jbG9zZSgpfSxjbG9zZVRvcDpmdW5jdGlvbigpe3ZhciBhPU9iamVjdC5rZXlzKGkpO3JldHVybiEhYS5sZW5ndGgmJmlbYVthLmxlbmd0aC0xXV0uY2xvc2UoKX0sY2xvc2VBbGw6ZnVuY3Rpb24oKXtmb3IodmFyIGEgaW4gaSl0aGlzLmNsb3NlKGEpO3JldHVybiEwfSxnZXRBbGw6ZnVuY3Rpb24oKXtyZXR1cm4gaX0sZ2V0QnlJZDpmdW5jdGlvbihhKXtyZXR1cm4gaVthXX19O3dpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIixmdW5jdGlvbihhKXsyNz09PWEua2V5Q29kZSYmKGs9ITAsbC5jbG9zZVRvcCgpLGs9ITEpfSksd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJwb3BzdGF0ZVwiLGZ1bmN0aW9uKCl7bC5kZWZhdWx0T3B0aW9ucy5jbG9zZUFsbE9uUG9wU3RhdGUmJmwuY2xvc2VBbGwoKX0pLGwuZGVmYXVsdE9wdGlvbnM9e2NvbnRlbnQ6XCJcIixzaG93Q2xvc2VCdXR0b246ITAsZXNjYXBlQnV0dG9uQ2xvc2VzOiEwLG92ZXJsYXlDbG9zZXNPbkNsaWNrOiEwLGFwcGVuZExvY2F0aW9uOlwiYm9keVwiLGNsYXNzTmFtZTpcIlwiLG92ZXJsYXlDbGFzc05hbWU6XCJcIixjb250ZW50Q2xhc3NOYW1lOlwiXCIsY2xvc2VDbGFzc05hbWU6XCJcIixjbG9zZUFsbE9uUG9wU3RhdGU6ITB9LE9iamVjdC5kZWZpbmVQcm9wZXJ0eShsLFwiX2VzY2FwZUh0bWxcIix7Y29uZmlndXJhYmxlOiExLGVudW1lcmFibGU6ITEsd3JpdGFibGU6ITEsdmFsdWU6ZX0pLGwucmVnaXN0ZXJQbHVnaW49ZnVuY3Rpb24oYSxiKXt2YXIgYz1hKGwpLGQ9Ynx8Yy5uYW1lO2lmKGxbZF0pdGhyb3cgbmV3IEVycm9yKFwiUGx1Z2luIFwiK2IrXCIgaXMgYWxyZWFkeSByZWdpc3RlcmVkLlwiKTtsW2RdPWN9LGIuZXhwb3J0cz1sfSx7XCJjbGFzc2xpc3QtcG9seWZpbGxcIjoxLGRvbWlmeToyLFwiZXM2LW9iamVjdC1hc3NpZ25cIjozfV19LHt9LFs2XSkoNil9KTtcbiJdfQ==
