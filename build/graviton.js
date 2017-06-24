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
        this.barnesHutOnBtn = args.barnesHutOnBtn = this.controls.querySelector('#barneshutonbtn');
        this.barnesHutOffBtn = args.barnesHutOffBtn = this.controls.querySelector('#barneshutoffbtn');
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

                            case _events.KEYCODES.K_B:
                                this.toggleSimStrategy();
                                break;

                            case _events.KEYCODES.K_Q:
                                this.toggleQuadTreeLines();
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

                    case _events.CONTROLCODES.BARNESHUTONBTN:
                        this.toggleSimStrategy();
                        break;

                    case _events.CONTROLCODES.BARNESHUTOFFBTN:
                        this.toggleSimStrategy();
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
            this.simTimer.toggle();
            if (this.simTimer.active) {
                this.playBtn.style.display = 'none';
                this.pauseBtn.style.display = '';
            } else {
                this.playBtn.style.display = '';
                this.pauseBtn.style.display = 'none';
            }
        }
    }, {
        key: 'toggleSimStrategy',
        value: function toggleSimStrategy() {
            this.sim.toggleStrategy();
            if (this.sim.useBruteForce) {
                this.barnesHutOnBtn.style.display = 'none';
                this.barnesHutOffBtn.style.display = '';
            } else {
                this.barnesHutOnBtn.style.display = '';
                this.barnesHutOffBtn.style.display = 'none';
            }
            this.updateQuadTreeLinesIcons();
        }
    }, {
        key: 'toggleTrails',
        value: function toggleTrails() {
            this.noclear = !this.noclear;
            if (this.noclear) {
                this.trailOffBtn.style.display = 'none';
                this.trailOnBtn.style.display = '';
            } else {
                this.trailOffBtn.style.display = '';
                this.trailOnBtn.style.display = 'none';
            }
        }
    }, {
        key: 'toggleQuadTreeLines',
        value: function toggleQuadTreeLines() {
            this.quadTreeLines = !this.quadTreeLines;
            this.updateQuadTreeLinesIcons();
        }
    }, {
        key: 'updateQuadTreeLinesIcons',
        value: function updateQuadTreeLinesIcons() {
            if (this.sim.useBruteForce) {
                this.quadTreeOffBtn.style.display = 'none';
                this.quadTreeOnBtn.style.display = 'none';
                return;
            }
            if (this.quadTreeLines) {
                this.quadTreeOffBtn.style.display = 'none';
                this.quadTreeOnBtn.style.display = '';
            } else {
                this.quadTreeOffBtn.style.display = '';
                this.quadTreeOnBtn.style.display = 'none';
            }
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
                unsafeContent: '\n                <h3>Shortcuts</h3>\n                <table class="shortcuts">\n                    <tbody>\n                    <tr>\n                        <td>Left click</td> <td> create body</td></tr>\n                    <tr>\n                        <td>Right click</td> <td> delete body</td></tr>\n                    <tr>\n                        <td>Middle click</td> <td> change body color</td></tr>\n                    <tr>\n                        <td><code>Enter</code> key</td> <td> start simulation</td></tr>\n                    <tr>\n                        <td><code>C</code> key</td> <td> clear canvas</td></tr>\n                    <tr>\n                        <td><code>B</code> key</td> <td> toggle brute-force/Barnes-Hut</td></tr>\n                    <tr>\n                        <td><code>Q</code> key</td> <td> toggle quadtree lines</td></tr>\n                    <tr>\n                        <td><code>P</code> key</td> <td> toggle repainting</td></tr>\n                    <tr>\n                        <td><code>R</code> key</td> <td> create random bodies</td></tr>\n                    <tr>\n                        <td><code>T</code> key</td> <td> create Titan</td></tr>\n                    <tr>\n                        <td><code>?</code> key</td> <td> show help</td></tr>\n                    </tbody>\n                </table>\n                ',
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
            if (this.quadTreeLines && !this.sim.useBruteForce) {
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
            this.controls.innerHTML = '\n            <menuitem id="playbtn">\n                <img src="assets/play.svg" alt="Start simulation">\n            </menuitem>\n            <menuitem id="pausebtn" style="display: none;">\n                <img src="assets/pause.svg" alt="Stop simulation">\n            </menuitem>\n            <menuitem id="barneshutonbtn">\n                <img src="assets/barnes_hut_on.svg" alt="Toggle Barnes-Hut algorithm">\n            </menuitem>\n            <menuitem id="barneshutoffbtn" style="display: none;">\n                <img src="assets/barnes_hut_off.svg" alt="Toggle Barnes-Hut algorithm">\n            </menuitem>\n            <menuitem id="quadtreeoffbtn">\n                <img src="assets/quadtree_off.svg" alt="Toggle quadtree lines">\n            </menuitem>\n            <menuitem id="quadtreeonbtn" style="display: none;">\n                <img src="assets/quadtree_on.svg" alt="Toggle quadtree lines">\n            </menuitem>\n            <menuitem id="trailoffbtn">\n                <img src="assets/trail_off.svg" alt="Toggle trails">\n            </menuitem>\n            <menuitem id="trailonbtn" style="display: none;">\n                <img src="assets/trail_on.svg" alt="Toggle trails">\n            </menuitem>\n            <menuitem id="helpbtn">\n                <img src="assets/help.svg" alt="Help">\n            </menuitem>\n            ';

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

        this.radius = args.radius;
        this.mass = args.mass;

        if ('radius' in args && !('mass' in args)) {
            this.forceRadius(args.radius);
        } else if ('mass' in args && !('radius' in args)) {
            this.forceMass(args.mass);
        } else if (!('mass' in args) && !('radius' in args)) {
            // Default to a radius of 10
            this.forceRadius(10);
        }

        this.color = undefined;
        this.highlight = undefined;

        this.updateColor(args.color || '#dbd3c8');
    }

    _createClass(GtBody, [{
        key: 'adjustSize',
        value: function adjustSize(delta) {
            this.forceRadius(Math.max(this.radius + delta, 2));
        }
    }, {
        key: 'forceRadius',
        value: function forceRadius(radius) {
            this.radius = radius;
            // Dorky formula to make mass scale "properly" with radius.
            this.mass = Math.pow(this.radius / 4, 3);
        }
    }, {
        key: 'forceMass',
        value: function forceMass(mass) {
            // Normally the mass is calculated based on the radius, but we can do the reverse
            this.mass = mass;
            this.radius = Math.pow(this.mass, 1 / 3) * 4;
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
    QUADTREEONBTN: 2006,
    BARNESHUTONBTN: 2007,
    BARNESHUTOFFBTN: 2008
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
        this.barnesHutOnBtn = args.barnesHutOnBtn;
        this.barnesHutOffBtn = args.barnesHutOffBtn;
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
            this.barnesHutOnBtn.addEventListener('click', this.handleControlClick.bind(this, CONTROLCODES.BARNESHUTONBTN));
            this.barnesHutOffBtn.addEventListener('click', this.handleControlClick.bind(this, CONTROLCODES.BARNESHUTOFFBTN));
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

                    this._drawBody(body, /* isTargeted */body === targetBody);
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
        key: '_drawBody',
        value: function _drawBody(body, isTargeted) {
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
            this._drawQuadTreeLine(treeNode);
        }
    }, {
        key: '_drawQuadTreeLine',
        value: function _drawQuadTreeLine(treeNode) {
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

                    this._drawQuadTreeLine(childNode);
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

var _colors = require('../util/colors');

var _colors2 = _interopRequireDefault(_colors);

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

/** Checks whether or not two bodies are colliding. */
function areColliding(body, collider) {
    var theta = arguments.length <= 2 || arguments[2] === undefined ? 0.3 : arguments[2];

    var dist = body.radius + collider.radius;
    var dx = body.x - collider.x;
    var dy = body.y - collider.y;
    return dist * dist * theta > dx * dx + dy * dy;
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
        this._netFx = 0;
        this._netFy = 0;
    }

    /** Calculate the new position of a body based on brute force mechanics. */

    _createClass(GtBarnesHutSim, [{
        key: 'calculateNewPosition',
        value: function calculateNewPosition(body, attractors, treeRoot, deltaT) {
            this._netFx = 0;
            this._netFy = 0;

            // Iterate through all bodies in the tree and sum the forces exerted
            this.calculateForceFromTree(body, treeRoot);
            exertForce(body, this._netFx, this._netFy, deltaT);
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

                    this._netFx += Fx;
                    this._netFy += Fy;
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

                this._netFx += Fx;
                this._netFy += Fy;
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
                this._resetTree();
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

            this._commitPositionUpdates();
            this.time += elapsed; // Increment runtime
            this._removeScattered();
            this._mergeCollided();
        }

        /** Update positions of all bodies to be the next calculated position. */

    }, {
        key: '_commitPositionUpdates',
        value: function _commitPositionUpdates() {
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
        key: '_removeScattered',
        value: function _removeScattered() {
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
    }, {
        key: '_mergeCollided',
        value: function _mergeCollided() {
            var _this = this;

            var i = 0;
            while (i < this.bodies.length) {
                var collidingIndices = [];
                // Collect colliding elements; only need to check each pair once
                for (var j = i + 1; j < this.bodies.length; j++) {
                    if (areColliding(this.bodies[i], this.bodies[j])) {
                        // Add, in order of highest index first
                        collidingIndices.unshift(j);
                    }
                }

                if (collidingIndices.length) {
                    // Include the "source" element in the collision set
                    collidingIndices.push(i);

                    // Extract elements and merge
                    var colliding = collidingIndices.map(function (idx) {
                        return _this.bodies.splice(idx, 1)[0];
                    });
                    this._mergeBodies(colliding);
                } else {
                    i++;
                }
            }
        }

        /** Merge and return the args for a new body based on a set of old bodies. */

    }, {
        key: '_mergeBodies',
        value: function _mergeBodies(bodies) {
            var newBodyArgs = { x: 0, y: 0, velX: 0, velY: 0, mass: 0, color: bodies[0].color };
            var largestMass = 0;
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = bodies[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var body = _step5.value;

                    if (body.mass > largestMass) {
                        newBodyArgs.x = body.x;
                        newBodyArgs.y = body.y;
                        largestMass = body.mass;
                    }
                    newBodyArgs.velX += body.velX;
                    newBodyArgs.velY += body.velY;
                    newBodyArgs.mass += body.mass;
                    newBodyArgs.color = _colors2.default.blend(newBodyArgs.color, body.color);
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

            return this.addNewBody(newBodyArgs);
        }

        /** Create and return a new body to the simulation. */

    }, {
        key: 'addNewBody',
        value: function addNewBody(args) {
            var body = new _body2.default(args);
            this.bodies.push(body);
            this._resetTree();
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
                    this._resetTree();
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
            this._resetTree();
        }

        /** Clear and reset the quadtree, adding all existing bodies back. */

    }, {
        key: '_resetTree',
        value: function _resetTree() {
            this.tree.clear();
            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
                for (var _iterator6 = this.bodies[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                    var body = _step6.value;

                    this.tree.addBody(body);
                }
            } catch (err) {
                _didIteratorError6 = true;
                _iteratorError6 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion6 && _iterator6.return) {
                        _iterator6.return();
                    }
                } finally {
                    if (_didIteratorError6) {
                        throw _iteratorError6;
                    }
                }
            }
        }
    }]);

    return GtSim;
})(); // end graviton/sim

exports.default = GtSim;

},{"../util/colors":11,"./body":3,"./tree":8}],7:[function(require,module,exports){
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
            this._updateMass(body);
            var quadrant = this._getQuadrant(body.x, body.y);

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
        key: "_updateMass",
        value: function _updateMass(body) {
            var newMass = this.mass + body.mass;
            var newX = (this.x * this.mass + body.x * body.mass) / newMass;
            var newY = (this.y * this.mass + body.y * body.mass) / newMass;
            this.mass = newMass;
            this.x = newX;
            this.y = newY;
        }

        /** Return the quadrant index for a given (x, y) pair. Assumes that it lies within bounds. */

    }, {
        key: "_getQuadrant",
        value: function _getQuadrant(x, y) {
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
    },
    blend: function blend(color1, color2) {
        var percentage = arguments.length <= 2 || arguments[2] === undefined ? 0.5 : arguments[2];

        var parsedColor1 = this.fromHex(color1);
        var parsedColor2 = this.fromHex(color2);

        var blendedColor = [Math.round(Math.min(Math.max(0, (1 - percentage) * parsedColor1[0] + percentage * parsedColor2[0]), 255)), Math.round(Math.min(Math.max(0, (1 - percentage) * parsedColor1[1] + percentage * parsedColor2[1]), 255)), Math.round(Math.min(Math.max(0, (1 - percentage) * parsedColor1[2] + percentage * parsedColor2[2]), 255))];
        return this.toHex(blendedColor);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZ3Jhdml0b24uanMiLCJzcmMvZ3Jhdml0b24vYXBwLmpzIiwic3JjL2dyYXZpdG9uL2JvZHkuanMiLCJzcmMvZ3Jhdml0b24vZXZlbnRzLmpzIiwic3JjL2dyYXZpdG9uL2dmeC5qcyIsInNyYy9ncmF2aXRvbi9zaW0uanMiLCJzcmMvZ3Jhdml0b24vdGltZXIuanMiLCJzcmMvZ3Jhdml0b24vdHJlZS5qcyIsInNyYy9tYWluLmpzIiwic3JjL3BvbHlmaWxscy5qcyIsInNyYy91dGlsL2NvbG9ycy5qcyIsInNyYy91dGlsL2Vudi5qcyIsInNyYy91dGlsL3JhbmRvbS5qcyIsInNyYy92ZW5kb3IvanNjb2xvci5qcyIsInNyYy92ZW5kb3IvdmV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7O2tCQ2FlLEVBQUUsR0FBRyxlQUFPLEVBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUNEUixLQUFLO0FBQ3RCLGFBRGlCLEtBQUssR0FDQzs4QkFETixLQUFLOztZQUNWLElBQUkseURBQUcsRUFBRTs7QUFDakIsWUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7O0FBRWpCLFlBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ2xCLFlBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDOztBQUVqQixZQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztBQUN0QixZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQzs7QUFFckIsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7QUFDbkIsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7QUFDaEIsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7O0FBRWhCLFlBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0FBQ3JCLFlB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LFlBQVksRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDeEQ7OztBQUlELFdBQVEsRUFBRyxrQkFBVSxHQUFHLEVBQUUsU0FBUyxFQUFFO0FBQ3BDLFFBQUksQ0FBQyxTQUFTLEVBQUU7QUFDZixZQUFPLEtBQUssQ0FBQztLQUNiO0FBQ0QsV0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFBLENBQUUsT0FBTyxDQUFDLEdBQUcsR0FBRyxTQUFTLEdBQUcsR0FBRyxDQUFDLENBQUM7SUFDN0Y7OztBQUlELFdBQVEsRUFBRyxrQkFBVSxHQUFHLEVBQUUsU0FBUyxFQUFFO0FBQ3BDLFFBQUksU0FBUyxHQUFHLEdBQUcsQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDL0MsU0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUM3QyxTQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDckMsU0FBRyxDQUFDLFNBQVMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQSxHQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUMzRDtLQUNEO0lBQ0Q7OztBQUlELGFBQVUsRUFBRyxvQkFBVSxHQUFHLEVBQUUsU0FBUyxFQUFFO0FBQ3RDLFFBQUksU0FBUyxHQUFHLEdBQUcsQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDL0MsU0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUM3QyxTQUFJLElBQUksR0FBRyxJQUFJ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R0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQ3JGLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFDTixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQ3BDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUNoRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENB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QUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDakQ7QUFDRCxTQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDakIsVUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUM5RjtBQUNELFNBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7QUFBQyxBQUc5RixTQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6RCxTQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyQixTQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyQixTQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFckIsU0FBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUN4QixDQUFDOztBQUdGLFFBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxHQUFHLEVBQUUsS0FBSyxFQUFFO0FBQ3ZDLFNBQUksQ0FBQyxDQUFDO0FBQ04sU0FBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQyxFQUFFOzs7O0FBSTFELFVBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7O0FBRXRCLFdBQUksQ0FBQyxPQUFPLENBQ1gsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxFQUFDLEVBQUUsQ0FBQyxFQUM3QixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEVBQUMsRUFBRSxDQUFDLEVBQzdCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsRUFBQyxFQUFFLENBQUMsRUFDN0IsS0FBSyxDQUNMLENBQUM7T0FDRixNQUFNOztBQUVOLFdBQUksQ0FBQyxPQUFPLENBQ1gsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBQyxFQUFFLENBQUMsRUFDNUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBQyxFQUFFLENBQUMsRUFDNUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFD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QUFHLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsRUFBRTtLQUNwRTs7Ozs7Ozs7QUFBQyxBQVNGLGFBQVMsT0FBTyxDQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQzFCLE1BQUMsSUFBSSxHQUFHLENBQUM7QUFDVCxNQUFDLElBQUksR0FBRyxDQUFDO0FBQ1QsTUFBQyxJQUFJLEdBQUcsQ0FBQztBQUNULFNBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEMsU0FBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQztBQUNsQyxTQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2QsU0FBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQUUsYUFBTyxDQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBRSxDQUFDO01BQUU7QUFDN0MsU0FBSSxDQUFDLEdBQUcsQ0FBQyxLQUFHLENBQUMsR0FBRyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBLEdBQUUsQ0FBQyxHQUFJLENBQUMsS0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQSxHQUFFLENBQUMsR0FBRyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBLEdBQUUsQ0FBQyxBQUFDLENBQUM7QUFDNUQsWUFBTyxDQUNOLEVBQUUsSUFBSSxDQUFDLEtBQUcsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUEsQUFBQyxFQUNoQixHQUFHLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQSxBQUFDLEVBQ1gsR0FBRyxHQUFHLENBQUMsQ0FDUCxDQUFDO0tBQ0Y7Ozs7Ozs7O0FBQUEs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LENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNqRCxTQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNqRCxTQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNqRCxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM5QyxTQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM1QyxTQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFNUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ25ELFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzVDLFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2pELFNBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3JELFNBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3JELFNBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3BELFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzVDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUU1QyxTQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM1QyxTQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQzs7QUFFM0MsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDNUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDN0MsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7TUFDN0M7O0FBRUQsU0FBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQzs7QUFFbkIsU0FBSSxhQUFhLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNuRCxTQUFJLElBQUksR0FBRyxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ25DLFNBQUksY0FBYyxHQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxBQUFDLENBQUM7QUFDaEcsU0FBSSxrQkFBa0IsR0FBRyxHQUFHLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekQsU0FBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FDMUIsSUFBSSxDQUFDLFlBQVksRUFDakIsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUFDLEFBQ3JDLFNBQUksU0FBUyxHQUFHLFdBQVc7OztBQUFDLEFBRzVCLE1BQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7QUFDNUIsTUFBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEFBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxHQUFJLElBQUksQ0FBQztBQUM3RCxNQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxXQUFXLEdBQUksSUFBSSxDQUFDO0FBQzlELE1BQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTTs7O0FBQUMsQUFHbEMsTUFBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDbkMsTUFBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7O0FBRXBDLE1BQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUM7QUFDbkMsTUFBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztBQUN4QixNQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO0FBQ3ZCLE1BQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7QUFDNUIsTUFBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztBQUM3QixRQUFHLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxHQUFHLElBQUksQ0FBQzs7O0FBQUMsQUFHakQsTUFBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQztBQUNuQyxNQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7QUFDcEQsTUFBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7QUFDNUMsTUFBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUM7QUFDL0MsUUFBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLFlBQVksR0FBRyxJQUFJLENBQUM7Ozs7O0FBQUMsQUFLakQsTUFBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUN2QixDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQ3RCLE1BQU0sQ0FBQztBQUNSLFFBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDckMsUUFBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxHQUFHLENBQUM7OztBQUFDLEFBR3JDLE1BQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUM7QUFDbEMsTUFBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0FBQ3RDLE1BQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUk7OztBQUFDLEFBR3hDLE1BQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7OztBQUFDLEFBR25FLE1BQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUM7QUFDbkMsTUFBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ3hDLE1BQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztBQUN2QyxNQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7QUFDbkQsTUFBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxVQUFVOzs7QUFBQyxBQUczQyxNQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7QUFDM0IsTUFBQyxDQUFDLElBQUksQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDO0FBQy9CLE1BQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUM7QUFDbkMsTUFBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztBQUN4QixNQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO0FBQ3ZCLE1BQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxBQUFDLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxrQkFBa0IsR0FBRyxDQUFDLEdBQUksSUFBSSxDQUFDO0FBQ3ZHLE1BQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ3JDLE1BQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxTQUFTOzs7QUFBQyxBQUdoQyxNQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDO0FBQ3BDLE1BQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksR0FDbEIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUNoQixHQUFHLENBQUM7QUFDTCxNQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQ25CLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FDbkIsY0FBYyxHQUFHLElBQUk7OztBQUFDLEFBR3ZCLE1BQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FDeEIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUN2QixVQUFVLENBQUM7QUFDWixNQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQzFCLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FDekIsSUFBSSxDQUFDLGtCQUFrQixDQUFDO0FBQ3pCLE1BQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssR0FDckIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUNyQixBQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixHQUFJLElBQUksQ0FBQztBQUM5RCxNQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQ3RCLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssR0FDcEIsY0FBYyxHQUFHLElBQUksQ0FBQztBQUN2QixNQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQ3BCLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FDbEIsQUFBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsa0JBQWtCLEdBQUksSUFBSSxDQUFDO0FBQzNHLE1BQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FDbkIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUNuQixHQUFHOzs7QUFBQyxBQUdMLE1BQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FDeEIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUN2QixVQUFVLENBQUM7QUFDWixNQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQzFCLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FDekIsSUFBSSxDQUFDLFlBQVksQ0FBQztBQUNuQixNQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQ3RCLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssR0FDcEIsQUFBQyxjQUFjLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsR0FBSSxJQUFJLENBQUM7QUFDdkQsTUFBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUNyQixDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQ3JCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7QUFDOUIsTUFBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUNwQixDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQ2xCLEFBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLEdBQUksSUFBSSxDQUFDO0FBQ2pGLE1BQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FDbkIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUNuQixJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSTs7O0FBQUMsQUFHaEMsTUFBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztBQUNoQyxNQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7QUFDM0MsTUFBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSTs7O0FBQUMsQUFHeEMsTUFBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUM7OztBQUFDLEFBRzdELE1BQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxhQUFhLEdBQUcsT0FBTyxHQUFHLE1BQU0sQ0FBQztBQUN4RCxNQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDO0FBQ25DLE1BQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztBQUN6QyxNQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDdkMsTUFBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO0FBQ25ELE1BQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsVUFBVTs7O0FBQUMsQUFHM0MsTUFBQyxDQUFDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBQzNCLE1BQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQztBQUMvQixNQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsYUFBYSxHQUFHLE9BQU8sR0FBRyxNQUFNLENBQUM7QUFDeEQsTUFBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQztBQUNuQyxNQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO0FBQ3pCLE1BQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFDdkIsTUFBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEFBQUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxrQkFBa0IsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsR0FBSSxJQUFJLENBQUM7QUFDNUcsTUFBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDckMsTUFBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLFNBQVM7OztBQUFDLEFBR2hDLE1BQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FDdkIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUN0QixJQUFJLENBQUMsa0JBQWtCLEdBQUcsV0FBVyxHQUFHLElBQUksQ0FBQyxrQkFBa0I7OztBQUFDLEFBR2pFLE1BQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUM7QUFDdkMsTUFBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUEsQUFBQyxHQUFHLElBQUksQ0FBQztBQUN0RixNQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRzs7O0FBQUMsQUFHM0IsTUFBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxXQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVk7OztBQUFDLEFBR2xGLE1BQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztBQUMvQyxNQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsY0FBYyxHQUFHLElBQUk7OztBQUFDLEFBRy9DLGNBQVMsWUFBWSxHQUFJO0FBQ3hCLFVBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQy9DLFVBQUksV0FBVyxHQUFHLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEosT0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztNQUN0QztBQUNELE1BQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sR0FBRyxNQUFNLENBQUM7QUFDdkQsTUFBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQztBQUNsQyxNQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDdkMsTUFBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ3pDLE1BQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUM7QUFDL0IsTUFBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBQzlDLE1BQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztBQUNsRCxpQkFBWSxFQUFFLENBQUM7QUFDZixNQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztBQUNyQyxNQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsaUJBQWlCLENBQUM7QUFDckMsTUFBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztBQUNqQyxTQUFJO0FBQ0gsT0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQztNQUMvQixDQUFDLE9BQU0sTUFBTSxFQUFFO0FBQ2YsT0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztNQUM1QjtBQUNELE1BQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxHQUFHLFlBQVk7QUFDL0IsVUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO01BQ1osQ0FBQztBQUNGLE1BQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztBQUNuRCxNQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7QUFDdEIsTUFBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7OztBQUFDLEFBRzVELGNBQVMsRUFBRSxDQUFDO0FBQ1osY0FBUyxFQUFFOzs7O0FBQUMsQUFJWixTQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxLQUFLLElBQUksRUFBRTtBQUNsRCxTQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7TUFDakU7OztBQUFBLEFBR0QsUUFBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsSUFBSTs7OztBQUFDLEFBSXhCLFNBQUksR0FBRyxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLEVBQUU7QUFDekMsU0FBRyxDQUFDLGNBQWMsRUFBRSxDQUFDO01BQ3JCLE1BQU07QUFDTixTQUFHLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztNQUNqRDs7QUFFRCxTQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxJQUFJLFNBQVMsRUFBRTtBQUNuQyxlQUFTLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztNQUM5Qjs7QUFFRCxRQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0tBQ25EOztBQUdELGFBQVMsU0FBUyxHQUFJOztBQUVyQixhQUFRLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUM7QUFDbEMsV0FBSyxHQUFHO0FBQUUsV0FBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDLEFBQUMsTUFBTTtBQUFBLEFBQ3BDLFdBQUssR0FBRztBQUFFLFdBQUksVUFBVSxHQUFHLENBQUMsQ0FBQyxBQUFDLE1BQU07QUFBQSxNQUNuQztBQUNELFNBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQUFBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsSUFBSyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQSxBQUFDLENBQUMsQ0FBQztBQUMzRCxTQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsR0FBRyxDQUFBLElBQUssSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUEsQUFBQyxDQUFDLENBQUM7QUFDekUsU0FBSSxjQUFjLEdBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLEFBQUMsQ0FBQztBQUNoRyxTQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQzFDLFFBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsQUFBQyxDQUFDLEdBQUcsR0FBRyxHQUFJLElBQUksQ0FBQztBQUMvQyxRQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLEFBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBSSxJQUFJOzs7QUFBQyxBQUc5QyxhQUFRLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUM7QUFDcEMsV0FBSyxHQUFHO0FBQ1AsV0FBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsRCxXQUFJLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hELFdBQUksTUFBTSxHQUFHLE1BQU0sR0FDbEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQ3pCLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUN6QixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUMzQixXQUFJLE1BQU0sR0FBRyxNQUFNLEdBQ2xCLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUN6QixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FDekIsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7QUFDM0IsVUFBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDdEUsYUFBTTtBQUFBLEFBQ1AsV0FBSyxHQUFHO0FBQ1AsV0FBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNqRCxXQUFJLE1BQU0sR0FBRyxNQUFNLEdBQ2xCLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUN4QixJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FDeEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7QUFDMUIsV0FBSSxNQUFNLEdBQUcsTUFBTSxDQUFDO0FBQ3BCLFVBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3RFLGFBQU07QUFBQSxNQUNOO0tBQ0Q7O0FBR0QsYUFBUyxTQUFTLEdBQUk7QUFDckIsU0FBSSxZQUFZLEdBQUcsR0FBRyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2hELFNBQUksWUFBWSxFQUFFOztBQUVqQixjQUFRLFlBQVk7QUFDcEIsWUFBSyxHQUFHO0FBQUUsWUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDLEFBQUMsTUFBTTtBQUFBLEFBQ3BDLFlBQUssR0FBRztBQUFFLFlBQUksVUFBVSxHQUFHLENBQUMsQ0FBQyxBQUFDLE1BQU07QUFBQSxPQUNuQztBQUNELFVBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxHQUFHLENBQUEsSUFBSyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQSxBQUFDLENBQUMsQ0FBQztBQUN6RSxTQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLEFBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFBLEFBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUMsR0FBSSxJQUFJLENBQUM7TUFDcEk7S0FDRDs7QUFHRCxhQUFTLGFBQWEsR0FBSTtBQUN6QixZQUFPLEdBQUcsQ0FBQyxNQUFNLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDO0tBQy9DOztBQUdELGFBQVMsU0FBUyxHQUFJO0FBQ3JCLFNBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztLQUNuQjs7O0FBQUEsQUFJRCxRQUFJLE9BQU8sYUFBYSxLQUFLLFFBQVEsRUFBRTtBQUN0QyxTQUFJLEVBQUUsR0FBRyxhQUFhLENBQUM7QUFDdkIsU0FBSSxHQUFHLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUN0QyxTQUFJLEdBQUcsRUFBRTtBQUNSLFVBQUksQ0FBQyxhQUFhLEdBQUcsR0FBRyxDQUFDO01BQ3pCLE1BQU07QUFDTixTQUFHLENBQUMsSUFBSSxDQUFDLDBDQUEwQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztNQUNqRTtLQUNELE1BQU0sSUFBSSxhQUFhLEVBQUU7QUFDekIsU0FBSSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7S0FDbkMsTUFBTTtBQUNOLFFBQUcsQ0FBQyxJQUFJLENBQUMsNEJBQTRCLEdBQUcsYUFBYSxHQUFHLElBQUksQ0FBQyxDQUFDO0tBQzlEOztBQUVELFFBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxrQkFBa0IsRUFBRTtBQUMxQyxRQUFHLENBQUMsSUFBSSxDQUFDLDBEQUEwRCxDQUFDLENBQUM7QUFDckUsWUFBTztLQUNQO0FBQ0QsUUFBSSxDQUFDLGFBQWEsQ0FBQyxrQkFBa0IsR0FBRyxJQUFJOzs7QUFBQyxBQUc3QyxRQUFJLENBQUMsWUFBWSxHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQzs7QUFBQyxBQUV4RCxRQUFJLENBQUMsWUFBWSxHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDOztBQUV4RCxRQUFJLElBQUksR0FBRyxJQUFJLENBQUM7QUFDaEIsUUFBSSxTQUFTLEdBQ1osSUFBSSxDQUFDLFNBQVMsR0FDZCxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FDaEMsUUFBUSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFDLFFBQUksY0FBYyxHQUFHLENBQUM7Ozs7QUFBQyxBQUl2QixRQUFJLEdBQUcsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsRUFBRTtBQUNwRCxTQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFO0FBQy9CLFVBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDO0FBQzlDLFVBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxHQUFHLFVBQVUsR0FBRyxFQUFFO0FBQzNDLG1CQUFZLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztBQUM3QixjQUFPLEtBQUssQ0FBQztPQUNiLENBQUM7TUFDRixNQUFNO0FBQ04sVUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEdBQUcsWUFBWTtBQUFFLGNBQU8sS0FBSyxDQUFDO09BQUUsQ0FBQztNQUMzRDtLQUNEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLEFBMkJELFFBQUksSUFBSSxDQUFDLFlBQVksRUFBRTtBQUN0QixTQUFJLEdBQUcsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsRUFBRTtBQUNsRCxVQUFJLFdBQVcsR0FBRyxTQUFkLFdBQVcsR0FBZTtBQUM3QixXQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN6RCxVQUFHLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7T0FDN0IsQ0FBQztBQUNGLFNBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDekQsU0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FBQztBQUN6RCxTQUFHLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ3RELFVBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLGNBQWMsRUFBRSxLQUFLLENBQUMsQ0FBQztNQUN0RDtLQUNEOzs7QUFBQSxBQUdELFFBQUksSUFBSSxDQUFDLFlBQVksRUFBRTtBQUN0QixTQUFJLENBQUMsWUFBWSxDQUFDLGFBQWEsR0FBRztBQUNqQyxxQkFBZSxFQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLGVBQWU7QUFDekQscUJBQWUsRUFBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxlQUFlO0FBQ3pELFdBQUssRUFBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxLQUFLO01BQ3JDLENBQUM7S0FDRjs7QUFFRCxRQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7OztBQUdmLFNBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztLQUNsRCxNQUFNO0FBQ04sU0FBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0tBQ25CO0lBQ0Q7O0dBRUQ7Ozs7Ozs7Ozs7O0FBQUMsQUFhRixLQUFHLENBQUMsT0FBTyxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUM7O0FBR3BDLEtBQUcsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEdBQUcsVUFBVSxTQUFTLEVBQUU7QUFDckQsT0FBSSxTQUFTLEdBQUcsUUFBUSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3ZELE9BQUksVUFBVSxHQUFHLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQzs7QUFFekQsTUFBRyxDQUFDLG9CQUFvQixDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUMvQyxNQUFHLENBQUMsb0JBQW9CLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0dBQ2hELENBQUM7O0FBR0YsS0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUdmLFNBQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQztFQUdsQixDQUFBLEVBQUcsQ0FBQztDQUFFOzs7Ozs7Ozs7QUNsekRQLENBQUMsQ0FBQSxVQUFTLENBQUMsRUFBQztBQUFDLE1BQUcsUUFBUSxZQUFTLE9BQU8seUNBQVAsT0FBTyxFQUFBLElBQUUsV0FBVyxJQUFFLE9BQU8sTUFBTSxFQUFDLE1BQU0sQ0FBQyxPQUFPLEdBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxJQUFHLFVBQVUsSUFBRSxPQUFPLE1BQU0sSUFBRSxNQUFNLENBQUMsR0FBRyxFQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSTtBQUFDLFFBQUksQ0FBQyxDQUFDLENBQUMsR0FBQyxXQUFXLElBQUUsT0FBTyxNQUFNLEdBQUMsTUFBTSxHQUFDLFdBQVcsSUFBRSxPQUFPLE1BQU0sR0FBQyxNQUFNLEdBQUMsV0FBVyxJQUFFLE9BQU8sSUFBSSxHQUFDLElBQUksR0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBQyxDQUFDLEVBQUUsQ0FBQTtHQUFDO0NBQUMsQ0FBQSxDQUFDLFlBQVU7QUFBQyxNQUFJLENBQUMsQ0FBQyxPQUFPLENBQUEsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxhQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsVUFBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQztBQUFDLFlBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUM7QUFBQyxjQUFJLENBQUMsR0FBQyxVQUFVLElBQUUsT0FBTyxPQUFPLElBQUUsT0FBTyxDQUFDLElBQUcsQ0FBQyxDQUFDLElBQUUsQ0FBQyxFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsQ0FBQyxFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLElBQUksS0FBSyxDQUFDLHNCQUFzQixHQUFDLENBQUMsR0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFNLENBQUMsQ0FBQyxJQUFJLEdBQUMsa0JBQWtCLEVBQUMsQ0FBQyxDQUFBLENBQUE7U0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBQyxPQUFPLEVBQUMsRUFBRSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsY0FBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUE7U0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsT0FBTyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBO09BQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFBO0tBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxVQUFVLElBQUUsT0FBTyxPQUFPLElBQUUsT0FBTyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUMsQ0FBQyxFQUFFO0FBQUMsT0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQUEsT0FBTyxDQUFDLENBQUE7R0FBQyxDQUFBLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxVQUFTLENBQUMsRUFB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QyxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUU7Y0FBQyxDQUFDLEdBQUMsU0FBRixDQUFDLEdBQVc7QUFBQyxtQkFBTyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtXQUFDLENBQUMsS0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUMsVUFBUyxDQUFDLEVBQUM7QUFBQyxtQkFBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUUsSUFBSSxDQUFBO1dBQUMsRUFBQyxDQUFDLENBQUMsUUFBUSxHQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsbUJBQU8sQ0FBQyxJQUFFLEVBQUUsRUFBQyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxLQUFHLENBQUMsQ0FBQyxDQUFBO1dBQUMsRUFBQyxDQUFDLENBQUMsR0FBRyxHQUFDLFlBQVU7QUFBQyxnQkFBSSxDQUFDO2dCQUFDLENBQUMsR0FBQyxTQUFTO2dCQUFDLENBQUMsR0FBQyxDQUFDO2dCQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTTtnQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUM7QUFBRyxlQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxLQUFHLENBQUMsQ0FBQyxLQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsQ0FBQztxQkFBTSxFQUFFLENBQUMsR0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFBO1dBQUMsRUFBQyxDQUFDLENBQUMsTUFBTSxHQUFDLFlBQVU7QUFBQyxnQkFBSSxDQUFDO2dCQUFDLENBQUM7Z0JBQUMsQ0FBQyxHQUFDLFNBQVM7Z0JBQUMsQ0FBQyxHQUFDLENBQUM7Z0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNO2dCQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQztBQUFHLG1CQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsS0FBRyxDQUFDLENBQUM7QUFBRSxvQkFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUFDO2VBQUE7cUJBQU0sRUFBRSxDQUFDLEdBQUMsQ0FBQyxFQUFFLENBQUMsSUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQTtXQUFDLEVBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxVQUFTLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxhQUFDLElBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxLQUFHLENBQUMsQ0FBQyxJQUFFLFFBQVEsR0FBQyxDQUFDLEtBQUcsQ0FBQyxDQUFDLElBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEtBQUcsQ0FBQyxDQUFDLElBQUUsQ0FBQyxLQUFHLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQTtXQUFDLEVBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBQyxZQUFVO0FBQUMsbUJBQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtXQUFDLEVBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQSxFQUFDO0FBQUMsZ0JBQUksQ0FBQyxHQUFDLEVBQUMsR0FBRyxFQUFDLENBQUMsRUFBQyxVQUFVLEVBQUMsQ0FBQyxDQUFDLEVBQUMsWUFBWSxFQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsSUFBRztBQUFDLGVBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQTthQUFDLENBQUEsT0FBTSxDQUFDLEVBQUM7QUFBQyxlQUFDLENBQUMsTUFBTSxLQUFHLENBQUMsVUFBVSxLQUFHLENBQUMsQ0FBQyxVQUFVLEdBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsQ0FBQTthQUFDO1dBQUMsTUFBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLElBQUUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQTtTQUFDO09BQUMsQ0FBQSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQSxBQUFDLENBQUE7S0FBQyxFQUFDLEVBQUUsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLFVBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxlQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsWUFBRyxRQUFRLElBQUUsT0FBTyxDQUFDLEVBQUMsTUFBTSxJQUFJLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsS0FBRyxDQUFDLEdBQUMsUUFBUSxDQUFBLEFBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsQ0FBQyxDQUFDLEVBQUMsT0FBTyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxNQUFNLElBQUUsQ0FBQyxFQUFDO0FBQUMsY0FBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLEdBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFBO1NBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxRQUFRO1lBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSSxDQUFDLENBQUMsU0FBUyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsRUFBRTtBQUFFLFdBQUMsR0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1NBQUEsSUFBRyxDQUFDLENBQUMsVUFBVSxJQUFFLENBQUMsQ0FBQyxTQUFTLEVBQUMsT0FBTyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxLQUFJLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxzQkFBc0IsRUFBRSxFQUFDLENBQUMsQ0FBQyxVQUFVO0FBQUUsV0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1NBQUEsT0FBTyxDQUFDLENBQUE7T0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7VUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxJQUFFLE9BQU8sUUFBUSxLQUFHLENBQUMsR0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxFQUFDLENBQUMsQ0FBQyxTQUFTLEdBQUMsb0VBQW9FLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sRUFBQyxDQUFDLEdBQUMsS0FBSyxDQUFDLENBQUEsQUFBQyxDQUFDLElBQUksQ0FBQyxHQUFDLEVBQUMsTUFBTSxFQUFDLENBQUMsQ0FBQyxFQUFDLFlBQVksRUFBQyxhQUFhLENBQUMsRUFBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLEVBQUMsZ0JBQWdCLEVBQUMsa0JBQWtCLENBQUMsRUFBQyxHQUFHLEVBQUMsQ0FBQyxDQUFDLEVBQUMsa0NBQWtDLEVBQUMscUJBQXFCLENBQUMsRUFBQyxRQUFRLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxFQUFDLFFBQVEsRUFBQyxRQUFRLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyxFQUFFLEVBQUMsRUFBRSxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUMsQ0FBQyxDQUFDLEVBQUMsb0JBQW9CLEVBQUMsdUJBQXVCLENBQUMsRUFBQyxDQUFDLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxRQUFRLEdBQUMsQ0FBQyxDQUFDLEVBQUMsOEJBQThCLEVBQUMsV0FBVyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQyxRQUFRLEdBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQyxFQUFDLFNBQVMsRUFBQyxVQUFVLENBQUMsRUFBQyxDQUFDLENBQUMsUUFBUSxHQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyx3REFBd0QsRUFBQyxRQUFRLENBQUMsQ0FBQTtLQUFDLEVBQUMsRUFBRSxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsVUFBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLGtCQUFZLENBQUM7QUFBQSxlQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsWUFBRyxLQUFLLENBQUMsS0FBRyxDQUFDLElBQUUsSUFBSSxLQUFHLENBQUMsRUFBQyxNQUFNLElBQUksU0FBUyxDQUFDLHlDQUF5QyxDQUFDLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsU0FBUyxDQUFDLE1BQU0sRUFBQyxDQUFDLEVBQUUsRUFBQztBQUFDLGNBQUksQ0FBQyxHQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLEtBQUssQ0FBQyxLQUFHLENBQUMsSUFBRSxJQUFJLEtBQUcsQ0FBQyxFQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFFLEVBQUM7QUFBQyxnQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFBQyxDQUFDLEdBQUMsTUFBTSxDQUFDLHdCQUF3QixDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBRyxDQUFDLElBQUUsQ0FBQyxDQUFDLFVBQVUsS0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsQ0FBQTtXQUFDO1NBQUMsT0FBTyxDQUFDLENBQUE7T0FBQyxTQUFTLENBQUMsR0FBRTtBQUFDLGNBQU0sQ0FBQyxNQUFNLElBQUUsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUMsUUFBUSxFQUFDLEVBQUMsVUFBVSxFQUFDLENBQUMsQ0FBQyxFQUFDLFlBQVksRUFBQyxDQUFDLENBQUMsRUFBQyxRQUFRLEVBQUMsQ0FBQyxDQUFDLEVBQUMsS0FBSyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUE7T0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLEVBQUMsTUFBTSxFQUFDLENBQUMsRUFBQyxRQUFRLEVBQUMsQ0FBQyxFQUFDLENBQUE7S0FBQyxFQUFDLEVBQUUsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLFVBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxlQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsZ0JBQVEsWUFBUyxDQUFDLHlDQUFELENBQUMsRUFBQSxHQUFDLENBQUMsR0FBQyxFQUFDLElBQUksRUFBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLEdBQUMsS0FBSyxDQUFDLEtBQUcsQ0FBQyxDQUFDLElBQUksS0FBRyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsQ0FBQyxLQUFJLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUMsRUFBRSxHQUFDLEVBQUUsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFVBQVUsS0FBRyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUEsQUFBQyxFQUFDLENBQUMsR0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLFFBQVEsR0FBQyxDQUFDLENBQUMsUUFBUSxHQUFDLEVBQUUsRUFBQyxDQUFDLEdBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxFQUFDLEVBQUUsQ0FBQyxFQUFDO0FBQUMsY0FBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxJQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQSxJQUFHLENBQUMsQ0FBQyxJQUFJLElBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBQztBQUFDLGdCQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSTtnQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFHLFVBQVUsS0FBRyxDQUFDLENBQUMsSUFBSSxJQUFFLE9BQU8sS0FBRyxDQUFDLENBQUMsSUFBSSxJQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUcsQ0FBQyxHQUFDLEtBQUssQ0FBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLENBQUMsS0FBSyxDQUFBLEVBQUM7QUFBQyxtQkFBRyxVQUFVLEtBQUcsQ0FBQyxDQUFDLElBQUksSUFBRSxDQUFDLENBQUMsT0FBTyxLQUFHLENBQUMsR0FBQyxFQUFFLENBQUEsQUFBQyxFQUFDLE9BQU8sS0FBRyxDQUFDLENBQUMsSUFBSSxLQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUUsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsT0FBTyxLQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxFQUFDLENBQUMsQ0FBQyxJQUFFLE9BQU8sSUFBRSxDQUFDLENBQUMsSUFBSSxDQUFBLEVBQUMsU0FBUTthQUFDLE1BQUssSUFBRyxDQUFDLENBQUMsRUFBQyxTQUFTLElBQUcsaUJBQWlCLEtBQUcsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSTtBQUFDLGVBQUMsR0FBQyxFQUFFLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsT0FBTyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxFQUFDLEVBQUUsQ0FBQyxFQUFDO0FBQUMsb0JBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLElBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSztvQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssSUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBRSxDQUFDLEtBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxJQUFFLElBQUksS0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUEsQUFBQyxDQUFBO2VBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLEtBQUssS0FBRyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsRUFBRSxDQUFDLENBQUEsQUFBQyxDQUFBO2FBQUM7V0FBQztTQUFDLElBQUcsQ0FBQyxDQUFDLEtBQUssRUFBQyxLQUFJLElBQUksQ0FBQyxJQUFJLENBQUM7QUFBQyxXQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLEVBQUUsQ0FBQyxDQUFBLEFBQUMsQ0FBQztTQUFBLE9BQU8sQ0FBQyxDQUFBO09BQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDO0FBQUMsWUFBSSxDQUFDLEdBQUMsRUFBRTtZQUFDLENBQUMsR0FBQyxhQUFhO1lBQUMsQ0FBQyxHQUFDLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQztZQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsSUFBSSxNQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUM7QUFBRSxXQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQUEsT0FBTyxDQUFDLENBQUE7T0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLFlBQUcsQ0FBQyxLQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUMsT0FBTyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUU7WUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxJQUFHLElBQUksS0FBRyxDQUFDLEVBQUMsT0FBTyxDQUFDLEdBQUMsQ0FBQyxJQUFFLEVBQUUsRUFBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxPQUFPLElBQUUsRUFBRSxFQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxFQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsRUFBQztBQUFDLGNBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Y0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsR0FBQyxDQUFDLElBQUUsRUFBRSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQSxJQUFHLENBQUMsR0FBQyxDQUFDLElBQUUsRUFBRSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLENBQUE7U0FBQyxNQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQTtPQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsWUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsRUFBQztBQUFDLGNBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQTtTQUFDLE1BQUk7QUFBQyxjQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUEsR0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBO1NBQUMsT0FBTyxDQUFDLENBQUE7T0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLGVBQU8sQ0FBQyxHQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFDLE1BQU0sQ0FBQyxFQUFDLENBQUMsR0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUMsR0FBRyxDQUFDLEVBQUMsQ0FBQyxJQUFFLENBQUMsR0FBQyxHQUFHLEdBQUMsRUFBRSxDQUFBLEFBQUMsR0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsR0FBQyxHQUFHLEdBQUMsQ0FBQyxDQUFBO09BQUMsSUFBSSxDQUFDLEdBQUMsdUNBQXVDO1VBQUMsQ0FBQyxHQUFDLG9DQUFvQztVQUFDLENBQUMsR0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQTtLQUFDLEVBQUMsRUFBRSxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsVUFBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLE9BQUMsVUFBUyxDQUFDLEVBQUM7QUFBQyxTQUFDLENBQUEsVUFBUyxDQUFDLEVBQUM7QUFBQyxjQUFHLFFBQVEsWUFBUyxDQUFDLHlDQUFELENBQUMsRUFBQSxJQUFFLFdBQVcsSUFBRSxPQUFPLENBQUMsRUFBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssSUFBRyxVQUFVLElBQUUsT0FBTyxDQUFDLElBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBQyxDQUFDLENBQUMsRUFBRSxFQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUk7QUFBQyxnQkFBSSxDQUFDLENBQUMsQ0FBQyxHQUFDLFdBQVcsSUFBRSxPQUFPLE1BQU0sR0FBQyxNQUFNLEdBQUMsV0FBVyxJQUFFLE9BQU8sQ0FBQyxHQUFDLENBQUMsR0FBQyxXQUFXLElBQUUsT0FBTyxJQUFJLEdBQUMsSUFBSSxHQUFDLElBQUksRUFBQyxDQUFDLENBQUMsU0FBUyxHQUFDLENBQUMsRUFBRSxDQUFBO1dBQUM7U0FBQyxDQUFBLENBQUMsWUFBVTtBQUFDLGlCQUFPLENBQUEsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxxQkFBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLGtCQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDO0FBQUMsb0JBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUM7QUFBQyxzQkFBSSxDQUFDLEdBQUMsVUFBVSxJQUFFLE9BQU8sQ0FBQyxJQUFFLENBQUMsQ0FBQyxJQUFHLENBQUMsQ0FBQyxJQUFFLENBQUMsRUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsRUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsR0FBQyxDQUFDLEdBQUMsR0FBRyxDQUFDLENBQUMsT0FBTSxDQUFDLENBQUMsSUFBSSxHQUFDLGtCQUFrQixFQUFDLENBQUMsQ0FBQSxDQUFBO2lCQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFDLE9BQU8sRUFBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUMsVUFBUyxDQUFDLEVBQUM7QUFBQyxzQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUE7aUJBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQTtlQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQTthQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsVUFBVSxJQUFFLE9BQU8sQ0FBQyxJQUFFLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxFQUFDLENBQUMsRUFBRTtBQUFDLGVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUFBLE9BQU8sQ0FBQyxDQUFBO1dBQUMsQ0FBQSxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsVUFBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLHVCQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsb0JBQUcsUUFBUSxJQUFFLE9BQU8sQ0FBQyxFQUFDLE1BQU0sSUFBSSxTQUFTLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLEtBQUcsQ0FBQyxHQUFDLFFBQVEsQ0FBQSxBQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsQ0FBQyxFQUFDLE9BQU8sQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsTUFBTSxJQUFFLENBQUMsRUFBQztBQUFDLHNCQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUE7aUJBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxRQUFRO29CQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUksQ0FBQyxDQUFDLFNBQVMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEVBQUU7QUFBRSxtQkFBQyxHQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7aUJBQUEsSUFBRyxDQUFDLENBQUMsVUFBVSxJQUFFLENBQUMsQ0FBQyxTQUFTLEVBQUMsT0FBTyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxLQUFJLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxzQkFBc0IsRUFBRSxFQUFDLENBQUMsQ0FBQyxVQUFVO0FBQUUsbUJBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztpQkFBQSxPQUFPLENBQUMsQ0FBQTtlQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztrQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxJQUFFLE9BQU8sUUFBUSxLQUFHLENBQUMsR0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxFQUFDLENBQUMsQ0FBQyxTQUFTLEdBQUMsb0VBQW9FLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sRUFBQyxDQUFDLEdBQUMsS0FBSyxDQUFDLENBQUEsQUFBQyxDQUFDLElBQUksQ0FBQyxHQUFDLEVBQUMsTUFBTSxFQUFDLENBQUMsQ0FBQyxFQUFDLFlBQVksRUFBQyxhQUFhLENBQUMsRUFBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLEVBQUMsZ0JBQWdCLEVBQUMsa0JBQWtCLENBQUMsRUFBQyxHQUFHLEVBQUMsQ0FBQyxDQUFDLEVBQUMsa0NBQWtDLEVBQUMscUJBQXFCLENBQUMsRUFBQyxRQUFRLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxFQUFDLFFBQVEsRUFBQyxRQUFRLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyxFQUFFLEVBQUMsRUFBRSxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUMsQ0FBQyxDQUFDLEVBQUMsb0JBQW9CLEVBQUMsdUJBQXVCLENBQUMsRUFBQyxDQUFDLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxRQUFRLEdBQUMsQ0FBQyxDQUFDLEVBQUMsOEJBQThCLEVBQUMsV0FBVyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQyxRQUFRLEdBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQyxFQUFDLFNBQVMsRUFBQyxVQUFVLENBQUMsRUFBQyxDQUFDLENBQUMsUUFBUSxHQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyx3REFBd0QsRUFBQyxRQUFRLENBQUMsQ0FBQTthQUFDLEVBQUMsRUFBRSxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsVUFBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLHVCQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsd0JBQVEsWUFBUyxDQUFDLHlDQUFELENBQUMsRUFBQSxHQUFDLENBQUMsR0FBQyxFQUFDLElBQUksRUFBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLEdBQUMsS0FBSyxDQUFDLEtBQUcsQ0FBQyxDQUFDLElBQUksS0FBRyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsQ0FBQyxLQUFJLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUMsRUFBRSxHQUFDLEVBQUUsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFVBQVUsS0FBRyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUEsQUFBQyxFQUFDLENBQUMsR0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLFFBQVEsR0FBQyxDQUFDLENBQUMsUUFBUSxHQUFDLEVBQUUsRUFBQyxDQUFDLEdBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxFQUFDLEVBQUUsQ0FBQyxFQUFDO0FBQUMsc0JBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUEsSUFBRyxDQUFDLENBQUMsSUFBSSxJQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUM7QUFBQyx3QkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUk7d0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBRyxVQUFVLEtBQUcsQ0FBQyxDQUFDLElBQUksSUFBRSxPQUFPLEtBQUcsQ0FBQyxDQUFDLElBQUksSUFBRSxDQUFDLENBQUMsT0FBTyxLQUFHLENBQUMsR0FBQyxLQUFLLENBQUMsQ0FBQSxBQUFDLEVBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQSxFQUFDO0FBQUMsMkJBQUcsVUFBVSxLQUFHLENBQUMsQ0FBQyxJQUFJLElBQUUsQ0FBQyxDQUFDLE9BQU8sS0FBRyxDQUFDLEdBQUMsRUFBRSxDQUFBLEFBQUMsRUFBQyxPQUFPLEtBQUcsQ0FBQyxDQUFDLElBQUksS0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFFLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLE9BQU8sS0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLENBQUMsSUFBRSxPQUFPLElBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQSxFQUFDLFNBQVE7cUJBQUMsTUFBSyxJQUFHLENBQUMsQ0FBQyxFQUFDLFNBQVMsSUFBRyxpQkFBaUIsS0FBRyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxLQUFJO0FBQUMsdUJBQUMsR0FBQyxFQUFFLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsT0FBTyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxFQUFDLEVBQUUsQ0FBQyxFQUFDO0FBQUMsNEJBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLElBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSzs0QkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssSUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBRSxDQUFDLEtBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxJQUFFLElBQUksS0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUEsQUFBQyxDQUFBO3VCQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLEVBQUUsQ0FBQyxDQUFBLEFBQUMsQ0FBQTtxQkFBQzttQkFBQztpQkFBQyxJQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUMsS0FBSSxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQUMsbUJBQUMsQ0FBQyxDQUFDLENBQUMsS0FBRyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsRUFBRSxDQUFDLENBQUEsQUFBQyxDQUFDO2lCQUFBLE9BQU8sQ0FBQyxDQUFBO2VBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDO0FBQUMsb0JBQUksQ0FBQyxHQUFDLEVBQUU7b0JBQUMsQ0FBQyxHQUFDLGFBQWE7b0JBQUMsQ0FBQyxHQUFDLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQztvQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLElBQUksTUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDO0FBQUUsbUJBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQUEsT0FBTyxDQUFDLENBQUE7ZUFBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLG9CQUFHLENBQUMsS0FBRyxDQUFDLENBQUMsTUFBTSxFQUFDLE9BQU8sQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFO29CQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUcsSUFBSSxLQUFHLENBQUMsRUFBQyxPQUFPLENBQUMsR0FBQyxDQUFDLElBQUUsRUFBRSxFQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLE9BQU8sSUFBRSxFQUFFLEVBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLEVBQUMsQ0FBQyxDQUFDLElBQUcsQ0FBQyxFQUFDO0FBQUMsc0JBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7c0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLEdBQUMsQ0FBQyxJQUFFLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUEsSUFBRyxDQUFDLEdBQUMsQ0FBQyxJQUFFLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxDQUFBO2lCQUFDLE1BQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFBO2VBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxvQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsRUFBQztBQUFDLHNCQUFJ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V0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFDLFVBQVUsRUFBQyxLQUFLLEVBQUMsNkVBQTZFLEdBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsV0FBVyxJQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsR0FBQyxXQUFXLEdBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBQyxNQUFNLEVBQUMsQ0FBQyxDQUFDLEdBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxHQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsMEJBQUcsUUFBUSxZQUFTLENBQUMseUNBQUQsQ0FBQyxFQUFBLEVBQUM7QUFBQyw0QkFBSSxDQUFDLEdBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFBO3VCQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtxQkFBQyxFQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7bUJBQUMsRUFBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sR0FBQyxFQUFDLEdBQUcsRUFBQyxFQUFDLElBQUksRUFBQyxJQUFJLEVBQUMsSUFBSSxFQUFDLFFBQVEsRUFBQyxTQUFTLEVBQUMsMkJBQTJCLEVBQUMsS0FBSyxFQUFDLGlCQUFVO0FBQUMsMEJBQUksQ0FBQyxLQUFLLEdBQUMsQ0FBQyxDQUFDLENBQUE7cUJBQUMsRUFBQyxFQUFDLEVBQUUsRUFBQyxFQUFDLElBQUksRUFBQyxRQUFRLEVBQUMsSUFBSSxFQUFDLFFBQVEsRUFBQyxTQUFTLEVB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LE9BQU8sQ0FBQyxJQUFFLENBQUMsSUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFBLEdBQUUsQ0FBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUE7V0FBQyxFQUFDLFFBQVEsSUFBRSxPQUFPLENBQUMsS0FBRyxDQUFDLEdBQUMsRUFBQyxPQUFPLEVBQUMsQ0FBQyxFQUFDLENBQUEsQUFBQyxFQUFDLENBQUMsQ0FBQyxhQUFhLElBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLGFBQWEsR0FBQyxDQUFDLENBQUMsT0FBTyxLQUFHLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQSxBQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsY0FBYyxFQUFDLENBQUMsQ0FBQztjQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxHQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxTQUFTLEdBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsRUFBQyxDQUFDLENBQUMsb0JBQW9CLElBQUUsQ0FB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QyxDQUFDLEdBQUMsQ0FBQyxDQUFBO09BQUMsRUFBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQTtLQUFDLEVBQUMsRUFBQyxvQkFBb0IsRUFBQyxDQUFDLEVBQUMsTUFBTSxFQUFDLENBQUMsRUFBQyxtQkFBbUIsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLEVBQUMsRUFBRSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtDQUFDLENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIGdyYXZpdG9uXG4gKlxuICogSmF2YVNjcmlwdCBOLWJvZHkgR3Jhdml0YXRpb25hbCBTaW11bGF0b3JcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgWmF2ZW4gTXVyYWR5YW5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxuICpcbiAqIFJldmlzaW9uOlxuICogIEBSRVZJU0lPTlxuICovXG5pbXBvcnQgR3RBcHAgZnJvbSAnLi9ncmF2aXRvbi9hcHAnO1xuXG5leHBvcnQgZGVmYXVsdCB7IGFwcDogR3RBcHAgfTtcbiIsIi8qKlxuICogZ3Jhdml0b24vYXBwIC0tIFRoZSBpbnRlcmFjdGl2ZSBncmF2aXRvbiBhcHBsaWNhdGlvblxuICovXG4vKiBnbG9iYWwganNjb2xvciAqL1xuXG5pbXBvcnQgdmV4IGZyb20gJy4uL3ZlbmRvci92ZXgnO1xuaW1wb3J0IHJhbmRvbSBmcm9tICcuLi91dGlsL3JhbmRvbSc7XG5pbXBvcnQgR3RTaW0gZnJvbSAnLi9zaW0nO1xuaW1wb3J0IEd0R2Z4IGZyb20gJy4vZ2Z4JztcbmltcG9ydCBHdEV2ZW50cywgeyBLRVlDT0RFUywgRVZFTlRDT0RFUywgQ09OVFJPTENPREVTIH0gZnJvbSAnLi9ldmVudHMnO1xuaW1wb3J0IEd0VGltZXIgZnJvbSAnLi90aW1lcic7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd0QXBwIHtcbiAgICBjb25zdHJ1Y3RvcihhcmdzID0ge30pIHtcbiAgICAgICAgdGhpcy5hcmdzID0gYXJncztcblxuICAgICAgICB0aGlzLm9wdGlvbnMgPSB7fTtcbiAgICAgICAgdGhpcy5ncmlkID0gbnVsbDtcblxuICAgICAgICB0aGlzLmFuaW1UaW1lciA9IG51bGw7XG4gICAgICAgIHRoaXMuc2ltVGltZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuZXZlbnRzID0gbnVsbDtcbiAgICAgICAgdGhpcy5zaW0gPSBudWxsO1xuICAgICAgICB0aGlzLmdmeCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5ub2NsZWFyID0gZmFsc2U7XG4gICAgICAgIHRoaXMucXVhZFRyZWVMaW5lcyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmludGVyYWN0aW9uID0ge3ByZXZpb3VzOiB7fX07XG4gICAgICAgIHRoaXMudGFyZ2V0Qm9keSA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy53YXNDb2xvclBpY2tlckFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmlzSGVscE9wZW4gPSBmYWxzZTtcblxuICAgICAgICB0aGlzLm9wdGlvbnMud2lkdGggPSBhcmdzLndpZHRoID0gYXJncy53aWR0aCB8fCB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICAgICAgdGhpcy5vcHRpb25zLmhlaWdodCA9IGFyZ3MuaGVpZ2h0ID0gYXJncy5oZWlnaHQgfHwgd2luZG93LmlubmVySGVpZ2h0O1xuICAgICAgICB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yID0gYXJncy5iYWNrZ3JvdW5kQ29sb3IgfHwgJyMxRjI2M0InO1xuXG4gICAgICAgIC8vIFJldHJpZXZlIGNhbnZhcywgb3IgYnVpbGQgb25lIHdpdGggYXJndW1lbnRzXG4gICAgICAgIHRoaXMuZ3JpZCA9IHR5cGVvZiBhcmdzLmdyaWQgPT09ICdzdHJpbmcnID9cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGFyZ3MuZ3JpZCkgOlxuICAgICAgICAgICAgYXJncy5ncmlkO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5ncmlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZUdyaWQodGhpcy5vcHRpb25zLndpZHRoLCB0aGlzLm9wdGlvbnMuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICB7YmFja2dyb3VuZENvbG9yOiB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yfSk7XG4gICAgICAgICAgICBhcmdzLmdyaWQgPSB0aGlzLmdyaWQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbnRyb2xzID0gdHlwZW9mIGFyZ3MuY29udHJvbHMgPT09ICdzdHJpbmcnID9cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGFyZ3MuY29udHJvbHMpIDpcbiAgICAgICAgICAgIGFyZ3MuY29udHJvbHM7XG5cbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmNvbnRyb2xzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZUNvbnRyb2xzKCk7XG4gICAgICAgICAgICBhcmdzLmNvbnRyb2xzID0gdGhpcy5jb250cm9scztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGxheUJ0biA9IGFyZ3MucGxheUJ0biA9IHRoaXMuY29udHJvbHMucXVlcnlTZWxlY3RvcignI3BsYXlidG4nKTtcbiAgICAgICAgdGhpcy5wYXVzZUJ0biA9IGFyZ3MucGF1c2VCdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyNwYXVzZWJ0bicpO1xuICAgICAgICB0aGlzLmJhcm5lc0h1dE9uQnRuID0gYXJncy5iYXJuZXNIdXRPbkJ0biA9IHRoaXMuY29udHJvbHMucXVlcnlTZWxlY3RvcignI2Jhcm5lc2h1dG9uYnRuJyk7XG4gICAgICAgIHRoaXMuYmFybmVzSHV0T2ZmQnRuID0gYXJncy5iYXJuZXNIdXRPZmZCdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyNiYXJuZXNodXRvZmZidG4nKTtcbiAgICAgICAgdGhpcy5xdWFkVHJlZU9mZkJ0biA9IGFyZ3MucXVhZFRyZWVPZmZCdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyNxdWFkdHJlZW9mZmJ0bicpO1xuICAgICAgICB0aGlzLnF1YWRUcmVlT25CdG4gPSBhcmdzLnF1YWRUcmVlT25CdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyNxdWFkdHJlZW9uYnRuJyk7XG4gICAgICAgIHRoaXMudHJhaWxPZmZCdG4gPSBhcmdzLnRyYWlsT2ZmQnRuID0gdGhpcy5jb250cm9scy5xdWVyeVNlbGVjdG9yKCcjdHJhaWxvZmZidG4nKTtcbiAgICAgICAgdGhpcy50cmFpbE9uQnRuID0gYXJncy50cmFpbE9uQnRuID0gdGhpcy5jb250cm9scy5xdWVyeVNlbGVjdG9yKCcjdHJhaWxvbmJ0bicpO1xuICAgICAgICB0aGlzLmhlbHBCdG4gPSBhcmdzLmhlbHBCdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyNoZWxwYnRuJyk7XG5cbiAgICAgICAgdGhpcy5jb2xvclBpY2tlciA9IHR5cGVvZiBhcmdzLmNvbG9yUGlja2VyID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChhcmdzLmNvbG9yUGlja2VyKSA6XG4gICAgICAgICAgICBhcmdzLmNvbG9yUGlja2VyO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5jb2xvclBpY2tlciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuY29sb3JQaWNrZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICAgICAgdGhpcy5jb2xvclBpY2tlci5jbGFzc05hbWUgPSAnYm9keWNvbG9ycGlja2VyJztcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5jb2xvclBpY2tlcik7XG4gICAgICAgICAgICBhcmdzLmNvbG9yUGlja2VyID0gdGhpcy5jb2xvclBpY2tlcjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmpzY29sb3IgPSBuZXcganNjb2xvcih0aGlzLmNvbG9yUGlja2VyLCB7XG4gICAgICAgICAgICBwYWRkaW5nOiAwLFxuICAgICAgICAgICAgc2hhZG93OiBmYWxzZSxcbiAgICAgICAgICAgIGJvcmRlcldpZHRoOiAwLFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAndHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgaW5zZXRDb2xvcjogJyMzZDU1OWUnLFxuICAgICAgICAgICAgb25GaW5lQ2hhbmdlOiB0aGlzLnVwZGF0ZUNvbG9yLmJpbmQodGhpcylcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5tZXRhSW5mbyA9IHR5cGVvZiBhcmdzLm1ldGFJbmZvID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChhcmdzLm1ldGFJbmZvKSA6XG4gICAgICAgICAgICBhcmdzLm1ldGFJbmZvO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5tZXRhSW5mbyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMubWV0YUluZm8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgICAgICB0aGlzLm1ldGFJbmZvLmNsYXNzTmFtZSA9ICdtZXRhaW5mbyc7XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMubWV0YUluZm8pO1xuICAgICAgICAgICAgYXJncy5tZXRhSW5mbyA9IHRoaXMubWV0YUluZm87XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJbml0aWFsaXplXG4gICAgICAgIHRoaXMuaW5pdENvbXBvbmVudHMoKTtcbiAgICAgICAgdGhpcy5pbml0VGltZXJzKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogbWFpbiAtLSBNYWluICdnYW1lJyBsb29wXG4gICAgICovXG4gICAgbWFpbigpIHtcbiAgICAgICAgLy8gRXZlbnQgcHJvY2Vzc2luZ1xuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIHRoaXMuZXZlbnRzLnFnZXQoKS5mb3JFYWNoKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBsZXQgcmV0dmFsO1xuXG4gICAgICAgICAgICBzd2l0Y2ggKGV2ZW50LnR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIEVWRU5UQ09ERVMuTU9VU0VET1dOOlxuICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQuYnV0dG9uID09PSAvKiByaWdodCBjbGljayAqLyAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgYm9keS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnRhcmdldEJvZHkgJiYgIXRoaXMuaW50ZXJhY3Rpb24uc3RhcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2ltLnJlbW92ZUJvZHkodGhpcy50YXJnZXRCb2R5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFRhcmdldEJvZHkodW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC5idXR0b24gPT09IC8qIG1pZGRsZSBjbGljayAqLyAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDb2xvciBwaWNraW5nXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50YXJnZXRCb2R5ICYmICF0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbG9yUGlja2VyLnN0eWxlLmxlZnQgPSBldmVudC5wb3NpdGlvbi54ICsgJ3B4JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbG9yUGlja2VyLnN0eWxlLnRvcCA9IGV2ZW50LnBvc2l0aW9uLnkgKyAncHgnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuanNjb2xvci5mcm9tU3RyaW5nKHRoaXMudGFyZ2V0Qm9keS5jb2xvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5qc2NvbG9yLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHsgLyogbGVmdCBjbGljayAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQmFzZSB0aGUgY2hlY2sgb24gdGhlIHByZXZpb3VzIHZhbHVlLCBpbiBjYXNlIHRoZSBjb2xvciBwaWNrZXIgd2FzIGp1c3RcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNsb3NlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy53YXNDb2xvclBpY2tlckFjdGl2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCBmbGFnIHRvIHNpZ25hbCBvdGhlciBldmVudHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0Qm9keSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLmJvZHkgPSB0aGlzLnRhcmdldEJvZHk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5ib2R5ID0gdGhpcy5zaW0uYWRkTmV3Qm9keSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiBldmVudC5wb3NpdGlvbi54LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogZXZlbnQucG9zaXRpb24ueVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLnByZXZpb3VzLnggPSBldmVudC5wb3NpdGlvbi54O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJhY3Rpb24ucHJldmlvdXMueSA9IGV2ZW50LnBvc2l0aW9uLnk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgcGlja2VyLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaXNDb2xvclBpY2tlckFjdGl2ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrOyAvLyBlbmQgTU9VU0VET1dOXG5cbiAgICAgICAgICAgICAgICBjYXNlIEVWRU5UQ09ERVMuTU9VU0VVUDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaW50ZXJhY3Rpb24uc3RhcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5zdGFydGVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBib2R5ID0gdGhpcy5pbnRlcmFjdGlvbi5ib2R5O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmVsWCA9IChldmVudC5wb3NpdGlvbi54IC0gYm9keS54KSAqIDAuMDAwMDAwMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2ZWxZID0gKGV2ZW50LnBvc2l0aW9uLnkgLSBib2R5LnkpICogMC4wMDAwMDAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2hlbiB0aGUgc2ltdWxhdGlvbiBpcyBhY3RpdmUsIGFkZCB0aGUgdmVsb2NpdHkgdG8gdGhlIGN1cnJlbnQgdmVsb2NpdHlcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGluc3RlYWQgb2YgY29tcGxldGVseSByZXNldHRpbmcgaXQgKHRvIGFsbG93IGZvciBtb3JlIGludGVyZXN0aW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpbnRlcmFjdGlvbnMpLlxuICAgICAgICAgICAgICAgICAgICAgICAgYm9keS52ZWxYID0gdGhpcy5zaW1UaW1lci5hY3RpdmUgPyBib2R5LnZlbFggKyB2ZWxYIDogdmVsWDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvZHkudmVsWSA9IHRoaXMuc2ltVGltZXIuYWN0aXZlID8gYm9keS52ZWxZICsgdmVsWSA6IHZlbFk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVUYXJnZXQoZXZlbnQucG9zaXRpb24ueCwgZXZlbnQucG9zaXRpb24ueSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBFVkVOVENPREVTLk1PVVNFTU9WRTpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5wcmV2aW91cy54ID0gZXZlbnQucG9zaXRpb24ueDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5wcmV2aW91cy55ID0gZXZlbnQucG9zaXRpb24ueTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQgJiYgIXRoaXMuaXNDb2xvclBpY2tlckFjdGl2ZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRhcmdldChldmVudC5wb3NpdGlvbi54LCBldmVudC5wb3NpdGlvbi55KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhazsgLy8gZW5kIE1PVVNFTU9WRVxuXG4gICAgICAgICAgICAgICAgY2FzZSBFVkVOVENPREVTLk1PVVNFV0hFRUw6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnRhcmdldEJvZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0Qm9keS5hZGp1c3RTaXplKGV2ZW50LmRlbHRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlTWV0YUluZm8oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhazsgLy8gZW5kIE1PVVNFV0hFRUxcblxuICAgICAgICAgICAgICAgIGNhc2UgRVZFTlRDT0RFUy5LRVlET1dOOlxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGV2ZW50LmtleWNvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgS0VZQ09ERVMuS19FTlRFUjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVNpbSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEtFWUNPREVTLktfQzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDbGVhciBzaW11bGF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaW0uY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdmeC5jbGVhcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2ltVGltZXIuc3RvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHZhbCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEtFWUNPREVTLktfQjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVNpbVN0cmF0ZWd5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgS0VZQ09ERVMuS19ROlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlUXVhZFRyZWVMaW5lcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEtFWUNPREVTLktfUDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVRyYWlscygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEtFWUNPREVTLktfUjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmF0ZSByYW5kb20gb2JqZWN0c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVCb2RpZXMoMTAsIHtyYW5kb21Db2xvcnM6IHRydWV9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBLRVlDT0RFUy5LX1Q6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaW0uYWRkTmV3Qm9keSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IHRoaXMub3B0aW9ucy53aWR0aCAvIDIsIHk6IHRoaXMub3B0aW9ucy5oZWlnaHQgLyAyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZWxYOiAwLCB2ZWxZOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXNzOiAyMDAwLCByYWRpdXM6IDUwLCBjb2xvcjogJyM1QTVBNUEnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaW0uYWRkTmV3Qm9keSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IHRoaXMub3B0aW9ucy53aWR0aCAtIDQwMCwgeTogdGhpcy5vcHRpb25zLmhlaWdodCAvIDIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlbFg6IDAsIHZlbFk6IDAuMDAwMDI1LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXNzOiAxLCByYWRpdXM6IDUsIGNvbG9yOiAnIzc4Nzg3OCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBLRVlDT0RFUy5LX1FVRVNUSU9OTUFSSzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dIZWxwKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7IC8vIGVuZCBLRVlET1dOXG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5QTEFZQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVNpbSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLlBBVVNFQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVNpbSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLkJBUk5FU0hVVE9OQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVNpbVN0cmF0ZWd5KCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBDT05UUk9MQ09ERVMuQkFSTkVTSFVUT0ZGQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVNpbVN0cmF0ZWd5KCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBDT05UUk9MQ09ERVMuUVVBRFRSRUVPRkZCVE46XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlUXVhZFRyZWVMaW5lcygpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLlFVQURUUkVFT05CVE46XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlUXVhZFRyZWVMaW5lcygpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLlRSQUlMT0ZGQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVRyYWlscygpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLlRSQUlMT05CVE46XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlVHJhaWxzKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBDT05UUk9MQ09ERVMuSEVMUEJUTjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93SGVscCgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJldHZhbDtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgLy8gUmVkcmF3IHNjcmVlblxuICAgICAgICB0aGlzLnJlZHJhdygpO1xuICAgIH1cblxuICAgIGluaXRDb21wb25lbnRzKCkge1xuICAgICAgICAvLyBDcmVhdGUgY29tcG9uZW50cyAtLSBvcmRlciBpcyBpbXBvcnRhbnRcbiAgICAgICAgdGhpcy5ldmVudHMgPSB0aGlzLmFyZ3MuZXZlbnRzID0gbmV3IEd0RXZlbnRzKHRoaXMuYXJncyk7XG4gICAgICAgIHRoaXMuc2ltID0gbmV3IEd0U2ltKHRoaXMuYXJncyk7XG4gICAgICAgIHRoaXMuZ2Z4ID0gbmV3IEd0R2Z4KHRoaXMuYXJncyk7XG4gICAgfVxuXG4gICAgaW5pdFRpbWVycygpIHtcbiAgICAgICAgLy8gQWRkIGBtYWluYCBsb29wLCBhbmQgc3RhcnQgaW1tZWRpYXRlbHlcbiAgICAgICAgdGhpcy5hbmltVGltZXIgPSBuZXcgR3RUaW1lcih0aGlzLm1haW4uYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuYW5pbVRpbWVyLnN0YXJ0KCk7XG4gICAgICAgIHRoaXMuc2ltVGltZXIgPSBuZXcgR3RUaW1lcih0aGlzLnNpbS5zdGVwLmJpbmQodGhpcy5zaW0pLCA2MCk7XG4gICAgfVxuXG4gICAgdG9nZ2xlU2ltKCkge1xuICAgICAgICB0aGlzLnNpbVRpbWVyLnRvZ2dsZSgpO1xuICAgICAgICBpZiAodGhpcy5zaW1UaW1lci5hY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMucGxheUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgdGhpcy5wYXVzZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnBsYXlCdG4uc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICAgICAgdGhpcy5wYXVzZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdG9nZ2xlU2ltU3RyYXRlZ3koKSB7XG4gICAgICAgIHRoaXMuc2ltLnRvZ2dsZVN0cmF0ZWd5KCk7XG4gICAgICAgIGlmICh0aGlzLnNpbS51c2VCcnV0ZUZvcmNlKSB7XG4gICAgICAgICAgICB0aGlzLmJhcm5lc0h1dE9uQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB0aGlzLmJhcm5lc0h1dE9mZkJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmJhcm5lc0h1dE9uQnRuLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgICAgIHRoaXMuYmFybmVzSHV0T2ZmQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVRdWFkVHJlZUxpbmVzSWNvbnMoKTtcbiAgICB9XG5cbiAgICB0b2dnbGVUcmFpbHMoKSB7XG4gICAgICAgIHRoaXMubm9jbGVhciA9ICF0aGlzLm5vY2xlYXI7XG4gICAgICAgIGlmICh0aGlzLm5vY2xlYXIpIHtcbiAgICAgICAgICAgIHRoaXMudHJhaWxPZmZCdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIHRoaXMudHJhaWxPbkJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnRyYWlsT2ZmQnRuLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgICAgIHRoaXMudHJhaWxPbkJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdG9nZ2xlUXVhZFRyZWVMaW5lcygpIHtcbiAgICAgICAgdGhpcy5xdWFkVHJlZUxpbmVzID0gIXRoaXMucXVhZFRyZWVMaW5lcztcbiAgICAgICAgdGhpcy51cGRhdGVRdWFkVHJlZUxpbmVzSWNvbnMoKTtcbiAgICB9XG5cbiAgICB1cGRhdGVRdWFkVHJlZUxpbmVzSWNvbnMoKSB7XG4gICAgICAgIGlmICh0aGlzLnNpbS51c2VCcnV0ZUZvcmNlKSB7XG4gICAgICAgICAgICB0aGlzLnF1YWRUcmVlT2ZmQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB0aGlzLnF1YWRUcmVlT25CdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5xdWFkVHJlZUxpbmVzKSB7XG4gICAgICAgICAgICB0aGlzLnF1YWRUcmVlT2ZmQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB0aGlzLnF1YWRUcmVlT25CdG4uc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5xdWFkVHJlZU9mZkJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgICAgICB0aGlzLnF1YWRUcmVlT25CdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNob3dIZWxwKCkge1xuICAgICAgICBpZiAodGhpcy5pc0hlbHBPcGVuKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pc0hlbHBPcGVuID0gdHJ1ZTtcbiAgICAgICAgdmV4Lm9wZW4oe1xuICAgICAgICAgICAgdW5zYWZlQ29udGVudDogYFxuICAgICAgICAgICAgICAgIDxoMz5TaG9ydGN1dHM8L2gzPlxuICAgICAgICAgICAgICAgIDx0YWJsZSBjbGFzcz1cInNob3J0Y3V0c1wiPlxuICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD5MZWZ0IGNsaWNrPC90ZD4gPHRkPiBjcmVhdGUgYm9keTwvdGQ+PC90cj5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPlJpZ2h0IGNsaWNrPC90ZD4gPHRkPiBkZWxldGUgYm9keTwvdGQ+PC90cj5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPk1pZGRsZSBjbGljazwvdGQ+IDx0ZD4gY2hhbmdlIGJvZHkgY29sb3I8L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48Y29kZT5FbnRlcjwvY29kZT4ga2V5PC90ZD4gPHRkPiBzdGFydCBzaW11bGF0aW9uPC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGNvZGU+QzwvY29kZT4ga2V5PC90ZD4gPHRkPiBjbGVhciBjYW52YXM8L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48Y29kZT5CPC9jb2RlPiBrZXk8L3RkPiA8dGQ+IHRvZ2dsZSBicnV0ZS1mb3JjZS9CYXJuZXMtSHV0PC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGNvZGU+UTwvY29kZT4ga2V5PC90ZD4gPHRkPiB0b2dnbGUgcXVhZHRyZWUgbGluZXM8L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48Y29kZT5QPC9jb2RlPiBrZXk8L3RkPiA8dGQ+IHRvZ2dsZSByZXBhaW50aW5nPC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGNvZGU+UjwvY29kZT4ga2V5PC90ZD4gPHRkPiBjcmVhdGUgcmFuZG9tIGJvZGllczwvdGQ+PC90cj5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjxjb2RlPlQ8L2NvZGU+IGtleTwvdGQ+IDx0ZD4gY3JlYXRlIFRpdGFuPC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGNvZGU+PzwvY29kZT4ga2V5PC90ZD4gPHRkPiBzaG93IGhlbHA8L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICAgICAgYWZ0ZXJDbG9zZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuaXNIZWxwT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZWRyYXcoKSB7XG4gICAgICAgIGlmICghdGhpcy5ub2NsZWFyKSB7XG4gICAgICAgICAgICB0aGlzLmdmeC5jbGVhcigpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnF1YWRUcmVlTGluZXMgJiYgIXRoaXMuc2ltLnVzZUJydXRlRm9yY2UpIHtcbiAgICAgICAgICAgIHRoaXMuZ2Z4LmRyYXdRdWFkVHJlZUxpbmVzKHRoaXMuc2ltLnRyZWUucm9vdCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuaW50ZXJhY3Rpb24uc3RhcnRlZCkge1xuICAgICAgICAgICAgdGhpcy5nZnguZHJhd1JldGljbGVMaW5lKHRoaXMuaW50ZXJhY3Rpb24uYm9keSwgdGhpcy5pbnRlcmFjdGlvbi5wcmV2aW91cyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5nZnguZHJhd0JvZGllcyh0aGlzLnNpbS5ib2RpZXMsIHRoaXMudGFyZ2V0Qm9keSk7XG4gICAgfVxuXG4gICAgZ2VuZXJhdGVHcmlkKHdpZHRoLCBoZWlnaHQsIHN0eWxlKSB7XG4gICAgICAgIC8vIEF0dGFjaCBhIGNhbnZhcyB0byB0aGUgcGFnZSwgdG8gaG91c2UgdGhlIHNpbXVsYXRpb25zXG4gICAgICAgIGlmICghc3R5bGUpIHtcbiAgICAgICAgICAgIHN0eWxlID0ge307XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmdyaWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblxuICAgICAgICB0aGlzLmdyaWQuY2xhc3NOYW1lID0gJ2dyYXZpdG9uY2FudmFzJztcbiAgICAgICAgdGhpcy5ncmlkLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHRoaXMuZ3JpZC5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIHRoaXMuZ3JpZC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgdGhpcy5ncmlkLnN0eWxlLm1hcmdpbkxlZnQgPSBzdHlsZS5tYXJnaW5MZWZ0IHx8ICdhdXRvJztcbiAgICAgICAgdGhpcy5ncmlkLnN0eWxlLm1hcmdpblJpZ2h0ID0gc3R5bGUubWFyZ2luUmlnaHQgfHwgJ2F1dG8nO1xuICAgICAgICB0aGlzLmdyaWQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gc3R5bGUuYmFja2dyb3VuZENvbG9yIHx8ICcjMDAwMDAwJztcblxuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuZ3JpZCk7XG4gICAgfVxuXG4gICAgZ2VuZXJhdGVDb250cm9scygpIHtcbiAgICAgICAgdGhpcy5jb250cm9scyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ21lbnUnKTtcbiAgICAgICAgdGhpcy5jb250cm9scy50eXBlID0gJ3Rvb2xiYXInO1xuICAgICAgICB0aGlzLmNvbnRyb2xzLmlkID0gJ2NvbnRyb2xzJztcbiAgICAgICAgdGhpcy5jb250cm9scy5pbm5lckhUTUwgPSBgXG4gICAgICAgICAgICA8bWVudWl0ZW0gaWQ9XCJwbGF5YnRuXCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvcGxheS5zdmdcIiBhbHQ9XCJTdGFydCBzaW11bGF0aW9uXCI+XG4gICAgICAgICAgICA8L21lbnVpdGVtPlxuICAgICAgICAgICAgPG1lbnVpdGVtIGlkPVwicGF1c2VidG5cIiBzdHlsZT1cImRpc3BsYXk6IG5vbmU7XCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvcGF1c2Uuc3ZnXCIgYWx0PVwiU3RvcCBzaW11bGF0aW9uXCI+XG4gICAgICAgICAgICA8L21lbnVpdGVtPlxuICAgICAgICAgICAgPG1lbnVpdGVtIGlkPVwiYmFybmVzaHV0b25idG5cIj5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz1cImFzc2V0cy9iYXJuZXNfaHV0X29uLnN2Z1wiIGFsdD1cIlRvZ2dsZSBCYXJuZXMtSHV0IGFsZ29yaXRobVwiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cImJhcm5lc2h1dG9mZmJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIj5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz1cImFzc2V0cy9iYXJuZXNfaHV0X29mZi5zdmdcIiBhbHQ9XCJUb2dnbGUgQmFybmVzLUh1dCBhbGdvcml0aG1cIj5cbiAgICAgICAgICAgIDwvbWVudWl0ZW0+XG4gICAgICAgICAgICA8bWVudWl0ZW0gaWQ9XCJxdWFkdHJlZW9mZmJ0blwiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiYXNzZXRzL3F1YWR0cmVlX29mZi5zdmdcIiBhbHQ9XCJUb2dnbGUgcXVhZHRyZWUgbGluZXNcIj5cbiAgICAgICAgICAgIDwvbWVudWl0ZW0+XG4gICAgICAgICAgICA8bWVudWl0ZW0gaWQ9XCJxdWFkdHJlZW9uYnRuXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiYXNzZXRzL3F1YWR0cmVlX29uLnN2Z1wiIGFsdD1cIlRvZ2dsZSBxdWFkdHJlZSBsaW5lc1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cInRyYWlsb2ZmYnRuXCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvdHJhaWxfb2ZmLnN2Z1wiIGFsdD1cIlRvZ2dsZSB0cmFpbHNcIj5cbiAgICAgICAgICAgIDwvbWVudWl0ZW0+XG4gICAgICAgICAgICA8bWVudWl0ZW0gaWQ9XCJ0cmFpbG9uYnRuXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiYXNzZXRzL3RyYWlsX29uLnN2Z1wiIGFsdD1cIlRvZ2dsZSB0cmFpbHNcIj5cbiAgICAgICAgICAgIDwvbWVudWl0ZW0+XG4gICAgICAgICAgICA8bWVudWl0ZW0gaWQ9XCJoZWxwYnRuXCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvaGVscC5zdmdcIiBhbHQ9XCJIZWxwXCI+XG4gICAgICAgICAgICA8L21lbnVpdGVtPlxuICAgICAgICAgICAgYDtcblxuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuY29udHJvbHMpO1xuICAgIH1cblxuICAgIGdlbmVyYXRlQm9kaWVzKG51bSwgYXJncykge1xuICAgICAgICBhcmdzID0gYXJncyB8fCB7fTtcblxuICAgICAgICBsZXQgbWluWCA9IGFyZ3MubWluWCB8fCAwO1xuICAgICAgICBsZXQgbWF4WCA9IGFyZ3MubWF4WCB8fCB0aGlzLm9wdGlvbnMud2lkdGg7XG4gICAgICAgIGxldCBtaW5ZID0gYXJncy5taW5ZIHx8IDA7XG4gICAgICAgIGxldCBtYXhZID0gYXJncy5tYXhZIHx8IHRoaXMub3B0aW9ucy5oZWlnaHQ7XG5cbiAgICAgICAgbGV0IG1pblZlbFggPSBhcmdzLm1pblZlbFggfHwgMDtcbiAgICAgICAgbGV0IG1heFZlbFggPSBhcmdzLm1heFZlbFggfHwgMC4wMDAwMTtcbiAgICAgICAgbGV0IG1pblZlbFkgPSBhcmdzLm1pblZlbFkgfHwgMDtcbiAgICAgICAgbGV0IG1heFZlbFkgPSBhcmdzLm1heFZlbFkgfHwgMC4wMDAwMTtcblxuICAgICAgICBsZXQgbWluUmFkaXVzID0gYXJncy5taW5SYWRpdXMgfHwgMTtcbiAgICAgICAgbGV0IG1heFJhZGl1cyA9IGFyZ3MubWF4UmFkaXVzIHx8IDE1O1xuXG4gICAgICAgIGxldCBjb2xvciA9IGFyZ3MuY29sb3I7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW07IGkrKykge1xuICAgICAgICAgICAgaWYgKGFyZ3MucmFuZG9tQ29sb3JzID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgY29sb3IgPSByYW5kb20uY29sb3IoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5zaW0uYWRkTmV3Qm9keSh7XG4gICAgICAgICAgICAgICAgeDogcmFuZG9tLm51bWJlcihtaW5YLCBtYXhYKSxcbiAgICAgICAgICAgICAgICB5OiByYW5kb20ubnVtYmVyKG1pblksIG1heFkpLFxuICAgICAgICAgICAgICAgIHZlbFg6IHJhbmRvbS5kaXJlY3Rpb25hbChtaW5WZWxYLCBtYXhWZWxYKSxcbiAgICAgICAgICAgICAgICB2ZWxZOiByYW5kb20uZGlyZWN0aW9uYWwobWluVmVsWSwgbWF4VmVsWSksXG4gICAgICAgICAgICAgICAgcmFkaXVzOiByYW5kb20ubnVtYmVyKG1pblJhZGl1cywgbWF4UmFkaXVzKSxcbiAgICAgICAgICAgICAgICBjb2xvcjogY29sb3JcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlVGFyZ2V0KHgsIHkpIHtcbiAgICAgICAgdGhpcy5zZXRUYXJnZXRCb2R5KHRoaXMuc2ltLmdldEJvZHlBdCh4LCB5KSk7XG4gICAgfVxuXG4gICAgc2V0VGFyZ2V0Qm9keShib2R5KSB7XG4gICAgICAgIHRoaXMudGFyZ2V0Qm9keSA9IGJvZHk7XG4gICAgICAgIHRoaXMudXBkYXRlTWV0YUluZm8oKTtcbiAgICB9XG5cbiAgICB1cGRhdGVNZXRhSW5mbygpIHtcbiAgICAgICAgaWYgKHRoaXMudGFyZ2V0Qm9keSkge1xuICAgICAgICAgICAgdGhpcy5tZXRhSW5mby5pbm5lckhUTUwgPVxuICAgICAgICAgICAgICAgIGDiipUgJHt0aGlzLnRhcmdldEJvZHkubWFzcy50b0ZpeGVkKDIpfSAmbmJzcDtgICtcbiAgICAgICAgICAgICAgICBg4qa/ICR7dGhpcy50YXJnZXRCb2R5LnJhZGl1cy50b0ZpeGVkKDIpfSAmbmJzcDtgICtcbiAgICAgICAgICAgICAgICBg4oeXICR7dGhpcy50YXJnZXRCb2R5LnNwZWVkLnRvRml4ZWQoMil9YDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubWV0YUluZm8udGV4dENvbnRlbnQgPSAnJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZUNvbG9yKCkge1xuICAgICAgICBpZiAodGhpcy50YXJnZXRCb2R5KSB7XG4gICAgICAgICAgICB0aGlzLnRhcmdldEJvZHkudXBkYXRlQ29sb3IodGhpcy5qc2NvbG9yLnRvSEVYU3RyaW5nKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaXNDb2xvclBpY2tlckFjdGl2ZSgpIHtcbiAgICAgICAgdGhpcy53YXNDb2xvclBpY2tlckFjdGl2ZSA9IHRoaXMuY29sb3JQaWNrZXIuY2xhc3NOYW1lLmluZGV4T2YoJ2pzY29sb3ItYWN0aXZlJykgPiAtMTtcbiAgICAgICAgcmV0dXJuIHRoaXMud2FzQ29sb3JQaWNrZXJBY3RpdmU7XG4gICAgfVxufSAvLyBlbmQgZ3Jhdml0b24vYXBwXG4iLCJpbXBvcnQgY29sb3JzIGZyb20gJy4uL3V0aWwvY29sb3JzJztcblxuLyoqXG4gKiBncmF2aXRvbi9ib2R5IC0tIFRoZSBncmF2aXRhdGlvbmFsIGJvZHlcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR3RCb2R5IHtcbiAgICBjb25zdHJ1Y3RvcihhcmdzKSB7XG4gICAgICAgIGFyZ3MgPSBhcmdzIHx8IHt9O1xuXG4gICAgICAgIHRoaXMueCA9IGFyZ3MueDtcbiAgICAgICAgdGhpcy55ID0gYXJncy55O1xuICAgICAgICBpZiAodHlwZW9mIHRoaXMueCAhPT0gJ251bWJlcicgfHwgdHlwZW9mIHRoaXMueSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdDb3JyZWN0IHBvc2l0aW9ucyB3ZXJlIG5vdCBnaXZlbiBmb3IgdGhlIGJvZHkuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm5leHRYID0gdGhpcy54O1xuICAgICAgICB0aGlzLm5leHRZID0gdGhpcy55O1xuXG4gICAgICAgIHRoaXMudmVsWCA9IGFyZ3MudmVsWCB8fCAwO1xuICAgICAgICB0aGlzLnZlbFkgPSBhcmdzLnZlbFkgfHwgMDtcblxuICAgICAgICB0aGlzLnJhZGl1cyA9IGFyZ3MucmFkaXVzO1xuICAgICAgICB0aGlzLm1hc3MgPSBhcmdzLm1hc3M7XG5cbiAgICAgICAgaWYgKCdyYWRpdXMnIGluIGFyZ3MgJiYgISgnbWFzcycgaW4gYXJncykpIHtcbiAgICAgICAgICAgIHRoaXMuZm9yY2VSYWRpdXMoYXJncy5yYWRpdXMpO1xuICAgICAgICB9IGVsc2UgaWYgKCdtYXNzJyBpbiBhcmdzICYmICEoJ3JhZGl1cycgaW4gYXJncykpIHtcbiAgICAgICAgICAgIHRoaXMuZm9yY2VNYXNzKGFyZ3MubWFzcyk7XG4gICAgICAgIH0gZWxzZSBpZiAoISgnbWFzcycgaW4gYXJncykgJiYgISgncmFkaXVzJyBpbiBhcmdzKSkge1xuICAgICAgICAgICAgLy8gRGVmYXVsdCB0byBhIHJhZGl1cyBvZiAxMFxuICAgICAgICAgICAgdGhpcy5mb3JjZVJhZGl1cygxMCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbG9yID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLmhpZ2hsaWdodCA9IHVuZGVmaW5lZDtcblxuICAgICAgICB0aGlzLnVwZGF0ZUNvbG9yKGFyZ3MuY29sb3IgfHwgJyNkYmQzYzgnKTtcbiAgICB9XG5cbiAgICBhZGp1c3RTaXplKGRlbHRhKSB7XG4gICAgICAgIHRoaXMuZm9yY2VSYWRpdXMoTWF0aC5tYXgodGhpcy5yYWRpdXMgKyBkZWx0YSwgMikpO1xuICAgIH1cblxuICAgIGZvcmNlUmFkaXVzKHJhZGl1cykge1xuICAgICAgICB0aGlzLnJhZGl1cyA9IHJhZGl1cztcbiAgICAgICAgLy8gRG9ya3kgZm9ybXVsYSB0byBtYWtlIG1hc3Mgc2NhbGUgXCJwcm9wZXJseVwiIHdpdGggcmFkaXVzLlxuICAgICAgICB0aGlzLm1hc3MgPSBNYXRoLnBvdyh0aGlzLnJhZGl1cyAvIDQsIDMpO1xuICAgIH1cblxuICAgIGZvcmNlTWFzcyhtYXNzKSB7XG4gICAgICAgIC8vIE5vcm1hbGx5IHRoZSBtYXNzIGlzIGNhbGN1bGF0ZWQgYmFzZWQgb24gdGhlIHJhZGl1cywgYnV0IHdlIGNhbiBkbyB0aGUgcmV2ZXJzZVxuICAgICAgICB0aGlzLm1hc3MgPSBtYXNzO1xuICAgICAgICB0aGlzLnJhZGl1cyA9IE1hdGgucG93KHRoaXMubWFzcywgMS8zKSAqIDQ7XG4gICAgfVxuXG4gICAgdXBkYXRlQ29sb3IoY29sb3IpIHtcbiAgICAgICAgdGhpcy5jb2xvciA9IGNvbG9yO1xuICAgICAgICB0aGlzLmhpZ2hsaWdodCA9IGNvbG9ycy50b0hleChjb2xvcnMuYnJpZ2h0ZW4oY29sb3JzLmZyb21IZXgodGhpcy5jb2xvciksIC4yNSkpO1xuICAgIH1cblxuICAgIGdldCBzcGVlZCgpIHtcbiAgICAgICAgLy8gVmVsb2NpdGllcyBhcmUgdGlueSwgc28gdXBzY2FsZSBpdCAoYXJiaXRyYXJpbHkpIHRvIG1ha2UgaXQgcmVhZGFibGUuXG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy52ZWxYICogdGhpcy52ZWxYICsgdGhpcy52ZWxZICogdGhpcy52ZWxZKSAqIDFlNjtcbiAgICB9XG59IC8vIGVuZCBncmF2aXRvbi9ib2R5XG4iLCIvKipcbiAqIGdyYXZpdG9uL2V2ZW50cyAtLSBFdmVudCBxdWV1ZWluZyBhbmQgcHJvY2Vzc2luZ1xuICovXG5leHBvcnQgY29uc3QgS0VZQ09ERVMgPSB7XG4gICAgS19MRUZUOiAzNyxcbiAgICBLX1VQOiAzOCxcbiAgICBLX1JJR0hUOiAzOSxcbiAgICBLX0RPV046IDQwLFxuXG4gICAgS18wOiA0OCxcbiAgICBLXzE6IDQ5LFxuICAgIEtfMjogNTAsXG4gICAgS18zOiA1MSxcbiAgICBLXzQ6IDUyLFxuICAgIEtfNTogNTMsXG4gICAgS182OiA1NCxcbiAgICBLXzc6IDU1LFxuICAgIEtfODogNTYsXG4gICAgS185OiA1NyxcblxuICAgIEtfQTogNjUsXG4gICAgS19COiA2NixcbiAgICBLX0M6IDY3LFxuICAgIEtfRDogNjgsXG4gICAgS19FOiA2OSxcbiAgICBLX0Y6IDcwLFxuICAgIEtfRzogNzEsXG4gICAgS19IOiA3MixcbiAgICBLX0k6IDczLFxuICAgIEtfSjogNzQsXG4gICAgS19LOiA3NSxcbiAgICBLX0w6IDc2LFxuICAgIEtfTTogNzcsXG4gICAgS19OOiA3OCxcbiAgICBLX086IDc5LFxuICAgIEtfUDogODAsXG4gICAgS19ROiA4MSxcbiAgICBLX1I6IDgyLFxuICAgIEtfUzogODMsXG4gICAgS19UOiA4NCxcbiAgICBLX1U6IDg1LFxuICAgIEtfVjogODYsXG4gICAgS19XOiA4NyxcbiAgICBLX1g6IDg4LFxuICAgIEtfWTogODksXG4gICAgS19aOiA5MCxcblxuICAgIEtfS1AxOiA5NyxcbiAgICBLX0tQMjogOTgsXG4gICAgS19LUDM6IDk5LFxuICAgIEtfS1A0OiAxMDAsXG4gICAgS19LUDU6IDEwMSxcbiAgICBLX0tQNjogMTAyLFxuICAgIEtfS1A3OiAxMDMsXG4gICAgS19LUDg6IDEwNCxcbiAgICBLX0tQOTogMTA1LFxuXG4gICAgS19RVUVTVElPTk1BUks6IDE5MSxcblxuICAgIEtfQkFDS1NQQUNFOiA4LFxuICAgIEtfVEFCOiA5LFxuICAgIEtfRU5URVI6IDEzLFxuICAgIEtfU0hJRlQ6IDE2LFxuICAgIEtfQ1RSTDogMTcsXG4gICAgS19BTFQ6IDE4LFxuICAgIEtfRVNDOiAyNyxcbiAgICBLX1NQQUNFOiAzMlxufTtcblxuZXhwb3J0IGNvbnN0IE1PVVNFQ09ERVMgPSB7XG4gICAgTV9MRUZUOiAwLFxuICAgIE1fTUlERExFOiAxLFxuICAgIE1fUklHSFQ6IDJcbn07XG5cbmV4cG9ydCBjb25zdCBFVkVOVENPREVTID0ge1xuICAgIE1PVVNFRE9XTjogMTAwMCxcbiAgICBNT1VTRVVQOiAxMDAxLFxuICAgIE1PVVNFTU9WRTogMTAwMixcbiAgICBNT1VTRVdIRUVMOiAxMDAzLFxuICAgIENMSUNLOiAxMDA0LFxuICAgIERCTENMSUNLOiAxMDA1LFxuXG4gICAgS0VZRE9XTjogMTAxMCxcbiAgICBLRVlVUDogMTAxMVxufTtcblxuZXhwb3J0IGNvbnN0IENPTlRST0xDT0RFUyA9IHtcbiAgICBQTEFZQlROOiAyMDAwLFxuICAgIFBBVVNFQlROOiAyMDAxLFxuICAgIFRSQUlMT0ZGQlROOiAyMDAyLFxuICAgIFRSQUlMT05CVE46IDIwMDMsXG4gICAgSEVMUEJUTjogMjAwNCxcbiAgICBRVUFEVFJFRU9GRkJUTjogMjAwNSxcbiAgICBRVUFEVFJFRU9OQlROOiAyMDA2LFxuICAgIEJBUk5FU0hVVE9OQlROOiAyMDA3LFxuICAgIEJBUk5FU0hVVE9GRkJUTjogMjAwOFxufTtcblxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdEV2ZW50cyB7XG4gICAgY29uc3RydWN0b3IoYXJncykge1xuICAgICAgICBhcmdzID0gYXJncyB8fCB7fTtcblxuICAgICAgICB0aGlzLnF1ZXVlID0gW107XG5cbiAgICAgICAgaWYgKHR5cGVvZiBhcmdzLmdyaWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcignTm8gdXNhYmxlIGNhbnZhcyBlbGVtZW50IHdhcyBnaXZlbi4nKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmdyaWQgPSBhcmdzLmdyaWQ7XG4gICAgICAgIHRoaXMuY29udHJvbHMgPSBhcmdzLmNvbnRyb2xzO1xuICAgICAgICB0aGlzLnBsYXlCdG4gPSBhcmdzLnBsYXlCdG47XG4gICAgICAgIHRoaXMucGF1c2VCdG4gPSBhcmdzLnBhdXNlQnRuO1xuICAgICAgICB0aGlzLmJhcm5lc0h1dE9uQnRuID0gYXJncy5iYXJuZXNIdXRPbkJ0bjtcbiAgICAgICAgdGhpcy5iYXJuZXNIdXRPZmZCdG4gPSBhcmdzLmJhcm5lc0h1dE9mZkJ0bjtcbiAgICAgICAgdGhpcy5xdWFkVHJlZU9mZkJ0biA9IGFyZ3MucXVhZFRyZWVPZmZCdG47XG4gICAgICAgIHRoaXMucXVhZFRyZWVPbkJ0biA9IGFyZ3MucXVhZFRyZWVPbkJ0bjtcbiAgICAgICAgdGhpcy50cmFpbE9mZkJ0biA9IGFyZ3MudHJhaWxPZmZCdG47XG4gICAgICAgIHRoaXMudHJhaWxPbkJ0biA9IGFyZ3MudHJhaWxPbkJ0bjtcbiAgICAgICAgdGhpcy5oZWxwQnRuID0gYXJncy5oZWxwQnRuO1xuXG4gICAgICAgIHRoaXMud2lyZXVwRXZlbnRzKCk7XG4gICAgfVxuXG4gICAgcWFkZChldmVudCkge1xuICAgICAgICB0aGlzLnF1ZXVlLnB1c2goZXZlbnQpO1xuICAgIH1cblxuICAgIHFwb2xsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5xdWV1ZS5zaGlmdCgpO1xuICAgIH1cblxuICAgIHFnZXQoKSB7XG4gICAgICAgIC8vIFJlcGxhY2luZyB0aGUgcmVmZXJlbmNlIGlzIGZhc3RlciB0aGFuIGBzcGxpY2UoKWBcbiAgICAgICAgbGV0IHJlZiA9IHRoaXMucXVldWU7XG4gICAgICAgIHRoaXMucXVldWUgPSBbXTtcbiAgICAgICAgcmV0dXJuIHJlZjtcbiAgICB9XG5cbiAgICBxY2xlYXIoKSB7XG4gICAgICAgIHRoaXMucXVldWUgPSBbXTtcbiAgICB9XG5cbiAgICB3aXJldXBFdmVudHMoKSB7XG4gICAgICAgIC8vIEdyaWQgbW91c2UgZXZlbnRzXG4gICAgICAgIHRoaXMuZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ2xpY2suYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdkYmxjbGljaycsIHRoaXMuaGFuZGxlRGJsQ2xpY2suYmluZCh0aGlzKSk7XG5cbiAgICAgICAgdGhpcy5ncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgdGhpcy5oYW5kbGVDb250ZXh0TWVudS5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5ncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuaGFuZGxlTW91c2VEb3duLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmdyaWQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuaGFuZGxlTW91c2VVcC5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5ncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuaGFuZGxlTW91c2VNb3ZlLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmdyaWQuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCB0aGlzLmhhbmRsZU1vdXNlV2hlZWwuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgLy8gR3JpZCBrZXkgZXZlbnRzXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmhhbmRsZUtleURvd24uYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5oYW5kbGVLZXlVcC5iaW5kKHRoaXMpKTtcblxuICAgICAgICAvLyBDb250cm9sIGV2ZW50c1xuICAgICAgICB0aGlzLnBsYXlCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNvbnRyb2xDbGljay5iaW5kKHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIENPTlRST0xDT0RFUy5QTEFZQlROKSk7XG4gICAgICAgIHRoaXMucGF1c2VCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNvbnRyb2xDbGljay5iaW5kKHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIENPTlRST0xDT0RFUy5QQVVTRUJUTikpO1xuICAgICAgICB0aGlzLmJhcm5lc0h1dE9uQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDb250cm9sQ2xpY2suYmluZCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICBDT05UUk9MQ09ERVMuQkFSTkVTSFVUT05CVE4pKTtcbiAgICAgICAgdGhpcy5iYXJuZXNIdXRPZmZCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNvbnRyb2xDbGljay5iaW5kKHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIENPTlRST0xDT0RFUy5CQVJORVNIVVRPRkZCVE4pKTtcbiAgICAgICAgdGhpcy5xdWFkVHJlZU9mZkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ29udHJvbENsaWNrLmJpbmQodGhpcyxcbiAgICAgICAgICAgICAgICAgICAgQ09OVFJPTENPREVTLlFVQURUUkVFT0ZGQlROKSk7XG4gICAgICAgIHRoaXMucXVhZFRyZWVPbkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ29udHJvbENsaWNrLmJpbmQodGhpcyxcbiAgICAgICAgICAgICAgICAgICAgQ09OVFJPTENPREVTLlFVQURUUkVFT05CVE4pKTtcbiAgICAgICAgdGhpcy50cmFpbE9mZkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ29udHJvbENsaWNrLmJpbmQodGhpcyxcbiAgICAgICAgICAgICAgICAgICAgQ09OVFJPTENPREVTLlRSQUlMT0ZGQlROKSk7XG4gICAgICAgIHRoaXMudHJhaWxPbkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ29udHJvbENsaWNrLmJpbmQodGhpcyxcbiAgICAgICAgICAgICAgICAgICAgQ09OVFJPTENPREVTLlRSQUlMT05CVE4pKTtcbiAgICAgICAgdGhpcy5oZWxwQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDb250cm9sQ2xpY2suYmluZCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICBDT05UUk9MQ09ERVMuSEVMUEJUTikpO1xuICAgIH1cblxuICAgIGhhbmRsZUNsaWNrKGV2ZW50KSB7XG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiBFVkVOVENPREVTLkNMSUNLLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuZ2V0UG9zaXRpb24oZXZlbnQpLFxuICAgICAgICAgICAgYnV0dG9uOiBldmVudC5idXR0b24sXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlRGJsQ2xpY2soZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuREJMQ0xJQ0ssXG4gICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5nZXRQb3NpdGlvbihldmVudCksXG4gICAgICAgICAgICBidXR0b246IGV2ZW50LmJ1dHRvbixcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBoYW5kbGVDb250ZXh0TWVudShldmVudCkge1xuICAgICAgICAvLyBQcmV2ZW50IHJpZ2h0LWNsaWNrIG1lbnVcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICBoYW5kbGVNb3VzZURvd24oZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuTU9VU0VET1dOLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuZ2V0UG9zaXRpb24oZXZlbnQpLFxuICAgICAgICAgICAgYnV0dG9uOiBldmVudC5idXR0b24sXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlTW91c2VVcChldmVudCkge1xuICAgICAgICB0aGlzLnFhZGQoe1xuICAgICAgICAgICAgdHlwZTogRVZFTlRDT0RFUy5NT1VTRVVQLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuZ2V0UG9zaXRpb24oZXZlbnQpLFxuICAgICAgICAgICAgYnV0dG9uOiBldmVudC5idXR0b24sXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlTW91c2VNb3ZlKGV2ZW50KSB7XG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiBFVkVOVENPREVTLk1PVVNFTU9WRSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmdldFBvc2l0aW9uKGV2ZW50KSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogZXZlbnQudGltZVN0YW1wXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGhhbmRsZU1vdXNlV2hlZWwoZXZlbnQpIHtcbiAgICAgICAgLy8gUmV2ZXJzZSB0aGUgdXAvZG93bi5cbiAgICAgICAgbGV0IGRlbHRhID0gLWV2ZW50LmRlbHRhWSAvIDUwO1xuXG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiBFVkVOVENPREVTLk1PVVNFV0hFRUwsXG4gICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5nZXRQb3NpdGlvbihldmVudCksXG4gICAgICAgICAgICBkZWx0YTogZGVsdGEsXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gUHJldmVudCB0aGUgd2luZG93IGZyb20gc2Nyb2xsaW5nXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuXG4gICAgaGFuZGxlS2V5RG93bihldmVudCkge1xuICAgICAgICAvLyBBY2NvdW50IGZvciBicm93c2VyIGRpc2NyZXBhbmNpZXNcbiAgICAgICAgbGV0IGtleSA9IGV2ZW50LmtleUNvZGUgfHwgZXZlbnQud2hpY2g7XG5cbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuS0VZRE9XTixcbiAgICAgICAgICAgIGtleWNvZGU6IGtleSxcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBoYW5kbGVLZXlVcChldmVudCkge1xuICAgICAgICAvLyBBY2NvdW50IGZvciBicm93c2VyIGRpc2NyZXBhbmNpZXNcbiAgICAgICAgbGV0IGtleSA9IGV2ZW50LmtleUNvZGUgfHwgZXZlbnQud2hpY2g7XG5cbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuS0VZVVAsXG4gICAgICAgICAgICBrZXljb2RlOiBrZXksXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlQ29udHJvbENsaWNrKHR5cGUsIGV2ZW50KSB7XG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZ2V0UG9zaXRpb24oZXZlbnQpIHtcbiAgICAgICAgLy8gQ2FsY3VsYXRlIG9mZnNldCBvbiB0aGUgZ3JpZCBmcm9tIGNsaWVudFgvWSwgYmVjYXVzZVxuICAgICAgICAvLyBzb21lIGJyb3dzZXJzIGRvbid0IGhhdmUgZXZlbnQub2Zmc2V0WC9ZXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiBldmVudC5jbGllbnRYIC0gdGhpcy5ncmlkLm9mZnNldExlZnQsXG4gICAgICAgICAgICB5OiBldmVudC5jbGllbnRZIC0gdGhpcy5ncmlkLm9mZnNldFRvcFxuICAgICAgICB9O1xuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL2V2ZW50c1xuIiwiLyoqXG4gKiBncmF2aXRvbi9nZnggLS0gVGhlIGdyYXBoaWNzIG9iamVjdFxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdEdmeCB7XG4gICAgY29uc3RydWN0b3IoYXJncykge1xuICAgICAgICBhcmdzID0gYXJncyB8fCB7fTtcblxuICAgICAgICB0aGlzLmdyaWQgPSB0eXBlb2YgYXJncy5ncmlkID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChhcmdzLmdyaWQpIDpcbiAgICAgICAgICAgIGFyZ3MuZ3JpZDtcblxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuZ3JpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdObyB1c2FibGUgY2FudmFzIGVsZW1lbnQgd2FzIGdpdmVuLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jdHggPSB0aGlzLmdyaWQuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgLy8gU2V0dGluZyB0aGUgd2lkdGggaGFzIHRoZSBzaWRlIGVmZmVjdFxuICAgICAgICAvLyBvZiBjbGVhcmluZyB0aGUgY2FudmFzXG4gICAgICAgIHRoaXMuZ3JpZC53aWR0aCA9IHRoaXMuZ3JpZC53aWR0aDtcbiAgICB9XG5cbiAgICBkcmF3Qm9kaWVzKGJvZGllcywgdGFyZ2V0Qm9keSkge1xuICAgICAgICBmb3IgKGxldCBib2R5IG9mIGJvZGllcykge1xuICAgICAgICAgICAgdGhpcy5fZHJhd0JvZHkoYm9keSwgLyogaXNUYXJnZXRlZCAqLyBib2R5ID09PSB0YXJnZXRCb2R5KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9kcmF3Qm9keShib2R5LCBpc1RhcmdldGVkKSB7XG4gICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IGJvZHkuY29sb3I7XG5cbiAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuY3R4LmFyYyhib2R5LngsIGJvZHkueSwgYm9keS5yYWRpdXMsIDAsIE1hdGguUEkgKiAyLCB0cnVlKTtcblxuICAgICAgICB0aGlzLmN0eC5maWxsKCk7XG4gICAgICAgIGlmIChpc1RhcmdldGVkKSB7XG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IGJvZHkuaGlnaGxpZ2h0O1xuICAgICAgICAgICAgdGhpcy5jdHgubGluZVdpZHRoID0gTWF0aC5yb3VuZChib2R5LnJhZGl1cyAvIDgpO1xuICAgICAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkcmF3UmV0aWNsZUxpbmUoZnJvbSwgdG8pIHtcbiAgICAgICAgbGV0IGdyYWQgPSB0aGlzLmN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudChmcm9tLngsIGZyb20ueSwgdG8ueCwgdG8ueSk7XG4gICAgICAgIGdyYWQuYWRkQ29sb3JTdG9wKDAsICdyZ2JhKDMxLCA3NSwgMTMwLCAxKScpO1xuICAgICAgICBncmFkLmFkZENvbG9yU3RvcCgxLCAncmdiYSgzMSwgNzUsIDEzMCwgMC4xKScpO1xuICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IGdyYWQ7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDY7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVDYXAgPSAncm91bmQnO1xuXG4gICAgICAgIC8vIERyYXcgaW5pdGlhbCBiYWNrZ3JvdW5kIGxpbmUuXG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmN0eC5tb3ZlVG8oZnJvbS54LCBmcm9tLnkpO1xuICAgICAgICB0aGlzLmN0eC5saW5lVG8odG8ueCwgdG8ueSk7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuXG4gICAgICAgIC8vIERyYXcgb3ZlcmxheSBsaW5lLlxuICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9ICcjMzQ3N0NBJztcbiAgICAgICAgdGhpcy5jdHgubGluZVdpZHRoID0gMjtcbiAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuY3R4Lm1vdmVUbyhmcm9tLngsIGZyb20ueSk7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0by54LCB0by55KTtcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XG4gICAgfVxuXG4gICAgZHJhd1F1YWRUcmVlTGluZXModHJlZU5vZGUpIHtcbiAgICAgICAgLy8gU2V0dXAgbGluZSBzdHlsZSBhbmQgY2FsbCB0aGUgZHJhd2luZyByb3V0aW5lc1xuICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9ICcjMDAwJztcbiAgICAgICAgdGhpcy5jdHgubGluZVdpZHRoID0gMTtcbiAgICAgICAgdGhpcy5jdHgubGluZUNhcCA9ICdidXR0JztcbiAgICAgICAgdGhpcy5fZHJhd1F1YWRUcmVlTGluZSh0cmVlTm9kZSk7XG4gICAgfVxuXG4gICAgX2RyYXdRdWFkVHJlZUxpbmUodHJlZU5vZGUpIHtcbiAgICAgICAgaWYgKCF0cmVlTm9kZSB8fCAhdHJlZU5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERyYXcgeCBhbmQgeSBsaW5lc1xuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5jdHgubW92ZVRvKHRyZWVOb2RlLm1pZFgsIHRyZWVOb2RlLnN0YXJ0WSk7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0cmVlTm9kZS5taWRYLCB0cmVlTm9kZS5zdGFydFkgKyB0cmVlTm9kZS5oZWlnaHQpO1xuICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcblxuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5jdHgubW92ZVRvKHRyZWVOb2RlLnN0YXJ0WCwgdHJlZU5vZGUubWlkWSk7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0cmVlTm9kZS5zdGFydFggKyB0cmVlTm9kZS53aWR0aCwgdHJlZU5vZGUubWlkWSk7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuXG4gICAgICAgIGZvciAoY29uc3QgY2hpbGROb2RlIG9mIHRyZWVOb2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICB0aGlzLl9kcmF3UXVhZFRyZWVMaW5lKGNoaWxkTm9kZSk7XG4gICAgICAgIH1cbiAgICB9XG59IC8vIGVuZCBncmF2aXRvbi9nZnhcbiIsIi8qKlxuICogZ3Jhdml0b24vc2ltIC0tIFRoZSBncmF2aXRhdGlvbmFsIHNpbXVsYXRvclxuICovXG5pbXBvcnQgR3RCb2R5IGZyb20gJy4vYm9keSc7XG5pbXBvcnQgR3RUcmVlIGZyb20gJy4vdHJlZSc7XG5pbXBvcnQgY29sb3JzIGZyb20gJy4uL3V0aWwvY29sb3JzJztcblxuLyoqIEV4ZXJ0IGZvcmNlIG9uIGEgYm9keSBhbmQgdXBkYXRlIGl0cyBuZXh0IHBvc2l0aW9uLiAqL1xuZnVuY3Rpb24gZXhlcnRGb3JjZShib2R5LCBuZXRGeCwgbmV0RnksIGRlbHRhVCkge1xuICAgIC8vIENhbGN1bGF0ZSBhY2NlbGVyYXRpb25zXG4gICAgY29uc3QgYXggPSBuZXRGeCAvIGJvZHkubWFzcztcbiAgICBjb25zdCBheSA9IG5ldEZ5IC8gYm9keS5tYXNzO1xuXG4gICAgLy8gQ2FsY3VsYXRlIG5ldyB2ZWxvY2l0aWVzLCBub3JtYWxpemVkIGJ5IHRoZSAndGltZScgaW50ZXJ2YWxcbiAgICBib2R5LnZlbFggKz0gZGVsdGFUICogYXg7XG4gICAgYm9keS52ZWxZICs9IGRlbHRhVCAqIGF5O1xuXG4gICAgLy8gQ2FsY3VsYXRlIG5ldyBwb3NpdGlvbnMgYWZ0ZXIgdGltZXN0ZXAgZGVsdGFUXG4gICAgLy8gTm90ZSB0aGF0IHRoaXMgZG9lc24ndCB1cGRhdGUgdGhlIGN1cnJlbnQgcG9zaXRpb24gaXRzZWxmIGluIG9yZGVyIHRvIG5vdCBhZmZlY3Qgb3RoZXJcbiAgICAvLyBmb3JjZSBjYWxjdWxhdGlvbnNcbiAgICBib2R5Lm5leHRYICs9IGRlbHRhVCAqIGJvZHkudmVsWDtcbiAgICBib2R5Lm5leHRZICs9IGRlbHRhVCAqIGJvZHkudmVsWTtcbn1cblxuLyoqIENhbGN1bGF0ZSB0aGUgZm9yY2UgZXhlcnRlZCBiZXR3ZWVuIGEgYm9keSBhbmQgYW4gYXR0cmFjdG9yIGJhc2VkIG9uIGdyYXZpdHkuICovXG5mdW5jdGlvbiBjYWxjdWxhdGVGb3JjZShib2R5LCBhdHRyYWN0b3IsIEcpIHtcbiAgICAvLyBDYWxjdWxhdGUgdGhlIGNoYW5nZSBpbiBwb3NpdGlvbiBhbG9uZyB0aGUgdHdvIGRpbWVuc2lvbnNcbiAgICBjb25zdCBkeCA9IGF0dHJhY3Rvci54IC0gYm9keS54O1xuICAgIGNvbnN0IGR5ID0gYXR0cmFjdG9yLnkgLSBib2R5Lnk7XG5cbiAgICAvLyBPYnRhaW4gdGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIG9iamVjdHMgKGh5cG90ZW51c2UpXG4gICAgY29uc3QgciA9IE1hdGguc3FydChNYXRoLnBvdyhkeCwgMikgKyBNYXRoLnBvdyhkeSwgMikpO1xuXG4gICAgLy8gQ2FsY3VsYXRlIGZvcmNlIHVzaW5nIE5ld3RvbmlhbiBncmF2aXR5LCBzZXBhcmF0ZSBvdXQgaW50byB4IGFuZCB5IGNvbXBvbmVudHNcbiAgICBjb25zdCBGID0gKEcgKiBib2R5Lm1hc3MgKiBhdHRyYWN0b3IubWFzcykgLyBNYXRoLnBvdyhyLCAyKTtcbiAgICBjb25zdCBGeCA9IEYgKiAoZHggLyByKTtcbiAgICBjb25zdCBGeSA9IEYgKiAoZHkgLyByKTtcbiAgICByZXR1cm4gW0Z4LCBGeV07XG59XG5cbi8qKiBDaGVja3Mgd2hldGhlciBvciBub3QgdHdvIGJvZGllcyBhcmUgY29sbGlkaW5nLiAqL1xuZnVuY3Rpb24gYXJlQ29sbGlkaW5nKGJvZHksIGNvbGxpZGVyLCB0aGV0YSA9IDAuMykge1xuICAgIGNvbnN0IGRpc3QgPSBib2R5LnJhZGl1cyArIGNvbGxpZGVyLnJhZGl1cztcbiAgICBjb25zdCBkeCA9IGJvZHkueCAtIGNvbGxpZGVyLng7XG4gICAgY29uc3QgZHkgPSBib2R5LnkgLSBjb2xsaWRlci55O1xuICAgIHJldHVybiAoZGlzdCAqIGRpc3QpICogdGhldGEgPiAoZHggKiBkeCkgKyAoZHkgKiBkeSk7XG59XG5cbmNsYXNzIEd0QnJ1dGVGb3JjZVNpbSB7XG4gICAgLyoqIEcgcmVwcmVzZW50cyB0aGUgZ3Jhdml0YXRpb25hbCBjb25zdGFudC4gKi9cbiAgICBjb25zdHJ1Y3RvcihHKSB7XG4gICAgICAgIHRoaXMuRyA9IEc7XG4gICAgfVxuXG4gICAgLyoqIENhbGN1bGF0ZSB0aGUgbmV3IHBvc2l0aW9uIG9mIGEgYm9keSBiYXNlZCBvbiBicnV0ZSBmb3JjZSBtZWNoYW5pY3MuICovXG4gICAgY2FsY3VsYXRlTmV3UG9zaXRpb24oYm9keSwgYXR0cmFjdG9ycywgdW51c2VkVHJlZVJvb3QsIGRlbHRhVCkge1xuICAgICAgICBsZXQgbmV0RnggPSAwO1xuICAgICAgICBsZXQgbmV0RnkgPSAwO1xuXG4gICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBhbGwgYm9kaWVzIGFuZCBzdW0gdGhlIGZvcmNlcyBleGVydGVkXG4gICAgICAgIGZvciAoY29uc3QgYXR0cmFjdG9yIG9mIGF0dHJhY3RvcnMpIHtcbiAgICAgICAgICAgIGlmIChib2R5ICE9PSBhdHRyYWN0b3IpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBbRngsIEZ5XSA9IGNhbGN1bGF0ZUZvcmNlKGJvZHksIGF0dHJhY3RvciwgdGhpcy5HKTtcbiAgICAgICAgICAgICAgICBuZXRGeCArPSBGeDtcbiAgICAgICAgICAgICAgICBuZXRGeSArPSBGeTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4ZXJ0Rm9yY2UoYm9keSwgbmV0RngsIG5ldEZ5LCBkZWx0YVQpO1xuICAgIH1cbn1cblxuY2xhc3MgR3RCYXJuZXNIdXRTaW0ge1xuICAgIC8qKiBHIHJlcHJlc2VudHMgdGhlIGdyYXZpdGF0aW9uYWwgY29uc3RhbnQuICovXG4gICAgY29uc3RydWN0b3IoRywgdGhldGEpIHtcbiAgICAgICAgdGhpcy5HID0gRztcbiAgICAgICAgdGhpcy50aGV0YSA9IHRoZXRhO1xuICAgICAgICB0aGlzLl9uZXRGeCA9IDA7XG4gICAgICAgIHRoaXMuX25ldEZ5ID0gMDtcbiAgICB9XG5cbiAgICAvKiogQ2FsY3VsYXRlIHRoZSBuZXcgcG9zaXRpb24gb2YgYSBib2R5IGJhc2VkIG9uIGJydXRlIGZvcmNlIG1lY2hhbmljcy4gKi9cbiAgICBjYWxjdWxhdGVOZXdQb3NpdGlvbihib2R5LCBhdHRyYWN0b3JzLCB0cmVlUm9vdCwgZGVsdGFUKSB7XG4gICAgICAgIHRoaXMuX25ldEZ4ID0gMDtcbiAgICAgICAgdGhpcy5fbmV0RnkgPSAwO1xuXG4gICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBhbGwgYm9kaWVzIGluIHRoZSB0cmVlIGFuZCBzdW0gdGhlIGZvcmNlcyBleGVydGVkXG4gICAgICAgIHRoaXMuY2FsY3VsYXRlRm9yY2VGcm9tVHJlZShib2R5LCB0cmVlUm9vdCk7XG4gICAgICAgIGV4ZXJ0Rm9yY2UoYm9keSwgdGhpcy5fbmV0RngsIHRoaXMuX25ldEZ5LCBkZWx0YVQpO1xuICAgIH1cblxuICAgIGNhbGN1bGF0ZUZvcmNlRnJvbVRyZWUoYm9keSwgdHJlZU5vZGUpIHtcbiAgICAgICAgLy8gSGFuZGxlIGVtcHR5IG5vZGVzXG4gICAgICAgIGlmICghdHJlZU5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdHJlZU5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIC8vIFRoZSBub2RlIGlzIGV4dGVybmFsIChpdCdzIGFuIGFjdHVhbCBib2R5KVxuICAgICAgICAgICAgaWYgKGJvZHkgIT09IHRyZWVOb2RlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgW0Z4LCBGeV0gPSBjYWxjdWxhdGVGb3JjZShib2R5LCB0cmVlTm9kZSwgdGhpcy5HKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9uZXRGeCArPSBGeDtcbiAgICAgICAgICAgICAgICB0aGlzLl9uZXRGeSArPSBGeTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSBub2RlIGlzIGludGVybmFsXG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBlZmZlY3RpdmUgcXVhZHJhbnQgc2l6ZSBhbmQgZGlzdGFuY2UgZnJvbSBjZW50ZXItb2YtbWFzc1xuICAgICAgICBjb25zdCBzID0gKHRyZWVOb2RlLndpZHRoICsgdHJlZU5vZGUuaGVpZ2h0KSAvIDI7XG5cbiAgICAgICAgY29uc3QgZHggPSB0cmVlTm9kZS54IC0gYm9keS54O1xuICAgICAgICBjb25zdCBkeSA9IHRyZWVOb2RlLnkgLSBib2R5Lnk7XG4gICAgICAgIGNvbnN0IGQgPSBNYXRoLnNxcnQoTWF0aC5wb3coZHgsIDIpICsgTWF0aC5wb3coZHksIDIpKTtcblxuICAgICAgICBpZiAocyAvIGQgPCB0aGlzLnRoZXRhKSB7XG4gICAgICAgICAgICAvLyBOb2RlIGlzIHN1ZmZpY2llbnRseSBmYXIgYXdheVxuICAgICAgICAgICAgY29uc3QgW0Z4LCBGeV0gPSBjYWxjdWxhdGVGb3JjZShib2R5LCB0cmVlTm9kZSwgdGhpcy5HKTtcbiAgICAgICAgICAgIHRoaXMuX25ldEZ4ICs9IEZ4O1xuICAgICAgICAgICAgdGhpcy5fbmV0RnkgKz0gRnk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBOb2RlIGlzIGNsb3NlOyByZWN1cnNlXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkTm9kZSBvZiB0cmVlTm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgIHRoaXMuY2FsY3VsYXRlRm9yY2VGcm9tVHJlZShib2R5LCBjaGlsZE5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdFNpbSB7XG4gICAgY29uc3RydWN0b3IoYXJncykge1xuICAgICAgICBhcmdzID0gYXJncyB8fCB7fTtcblxuICAgICAgICB0aGlzLnVzZUJydXRlRm9yY2UgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLkcgPSBhcmdzLkcgfHwgNi42NzM4NCAqIE1hdGgucG93KDEwLCAtMTEpOyAvLyBHcmF2aXRhdGlvbmFsIGNvbnN0YW50XG4gICAgICAgIHRoaXMubXVsdGlwbGllciA9IGFyZ3MubXVsdGlwbGllciB8fCAxNTAwOyAvLyBUaW1lc3RlcFxuICAgICAgICB0aGlzLnNjYXR0ZXJMaW1pdFggPSBhcmdzLnNjYXR0ZXJMaW1pdFggfHwgYXJncy53aWR0aCAqIDI7XG4gICAgICAgIHRoaXMuc2NhdHRlckxpbWl0WSA9IGFyZ3Muc2NhdHRlckxpbWl0WSB8fCBhcmdzLmhlaWdodCAqIDI7XG5cbiAgICAgICAgdGhpcy5ib2RpZXMgPSBbXTtcbiAgICAgICAgLy8gSW5jb3Jwb3JhdGUgdGhlIHNjYXR0ZXIgbGltaXRcbiAgICAgICAgdGhpcy50cmVlID0gbmV3IEd0VHJlZShcbiAgICAgICAgICAgICAgICAvKiB3aWR0aCAqLyB0aGlzLnNjYXR0ZXJMaW1pdFgsXG4gICAgICAgICAgICAgICAgLyogaGVpZ2h0ICovIHRoaXMuc2NhdHRlckxpbWl0WSxcbiAgICAgICAgICAgICAgICAvKiBzdGFydFggKi8gKGFyZ3Mud2lkdGggLSB0aGlzLnNjYXR0ZXJMaW1pdFgpIC8gMixcbiAgICAgICAgICAgICAgICAvKiBzdGFydFkgKi8gKGFyZ3MuaGVpZ2h0IC0gdGhpcy5zY2F0dGVyTGltaXRZKSAvIDIpO1xuICAgICAgICB0aGlzLnRpbWUgPSAwO1xuXG4gICAgICAgIHRoaXMuYnJ1dGVGb3JjZVNpbSA9IG5ldyBHdEJydXRlRm9yY2VTaW0odGhpcy5HKTtcbiAgICAgICAgdGhpcy5iYXJuZXNIdXRTaW0gPSBuZXcgR3RCYXJuZXNIdXRTaW0odGhpcy5HLCAvKiB0aGV0YSAqLyAwLjUpO1xuICAgICAgICB0aGlzLmFjdGl2ZVNpbSA9IHRoaXMudXNlQnJ1dGVGb3JjZSA/IHRoaXMuYnJ1dGVGb3JjZVNpbSA6IHRoaXMuYmFybmVzSHV0U2ltO1xuICAgIH1cblxuICAgIHRvZ2dsZVN0cmF0ZWd5KCkge1xuICAgICAgICB0aGlzLnVzZUJydXRlRm9yY2UgPSAhdGhpcy51c2VCcnV0ZUZvcmNlO1xuICAgICAgICB0aGlzLmFjdGl2ZVNpbSA9IHRoaXMudXNlQnJ1dGVGb3JjZSA/IHRoaXMuYnJ1dGVGb3JjZVNpbSA6IHRoaXMuYmFybmVzSHV0U2ltO1xuICAgIH1cblxuICAgIC8qKiBDYWxjdWxhdGUgYSBzdGVwIG9mIHRoZSBzaW11bGF0aW9uLiAqL1xuICAgIHN0ZXAoZWxhcHNlZCkge1xuICAgICAgICBpZiAoIXRoaXMudXNlQnJ1dGVGb3JjZSkge1xuICAgICAgICAgICAgdGhpcy5fcmVzZXRUcmVlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGNvbnN0IGJvZHkgb2YgdGhpcy5ib2RpZXMpIHtcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlU2ltLmNhbGN1bGF0ZU5ld1Bvc2l0aW9uKFxuICAgICAgICAgICAgICAgICAgICBib2R5LCB0aGlzLmJvZGllcywgdGhpcy50cmVlLnJvb3QsIGVsYXBzZWQgKiB0aGlzLm11bHRpcGxpZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY29tbWl0UG9zaXRpb25VcGRhdGVzKCk7XG4gICAgICAgIHRoaXMudGltZSArPSBlbGFwc2VkOyAvLyBJbmNyZW1lbnQgcnVudGltZVxuICAgICAgICB0aGlzLl9yZW1vdmVTY2F0dGVyZWQoKTtcbiAgICAgICAgdGhpcy5fbWVyZ2VDb2xsaWRlZCgpO1xuICAgIH1cblxuICAgIC8qKiBVcGRhdGUgcG9zaXRpb25zIG9mIGFsbCBib2RpZXMgdG8gYmUgdGhlIG5leHQgY2FsY3VsYXRlZCBwb3NpdGlvbi4gKi9cbiAgICBfY29tbWl0UG9zaXRpb25VcGRhdGVzKCkge1xuICAgICAgICBmb3IgKGNvbnN0IGJvZHkgb2YgdGhpcy5ib2RpZXMpIHtcbiAgICAgICAgICAgIGJvZHkueCA9IGJvZHkubmV4dFg7XG4gICAgICAgICAgICBib2R5LnkgPSBib2R5Lm5leHRZO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIFNjYW4gdGhyb3VnaCB0aGUgbGlzdCBvZiBib2RpZXMgYW5kIHJlbW92ZSBhbnkgdGhhdCBoYXZlIGZhbGxlbiBvdXQgb2YgdGhlIHNjYXR0ZXIgbGltaXQuICovXG4gICAgX3JlbW92ZVNjYXR0ZXJlZCgpIHtcbiAgICAgICAgbGV0IGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IHRoaXMuYm9kaWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IHRoaXMuYm9kaWVzW2ldO1xuXG4gICAgICAgICAgICBpZiAoYm9keS54ID4gdGhpcy5zY2F0dGVyTGltaXQgfHxcbiAgICAgICAgICAgICAgICBib2R5LnggPCAtdGhpcy5zY2F0dGVyTGltaXQgfHxcbiAgICAgICAgICAgICAgICBib2R5LnkgPiB0aGlzLnNjYXR0ZXJMaW1pdCB8fFxuICAgICAgICAgICAgICAgIGJvZHkueSA8IC10aGlzLnNjYXR0ZXJMaW1pdCkge1xuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBmcm9tIGJvZHkgY29sbGVjdGlvblxuICAgICAgICAgICAgICAgIC8vIFdlIGRvbid0IG5lZWQgdG8gcmVzZXQgdGhlIHRyZWUgaGVyZSBiZWNhdXNlIHRoaXMgaXMgYSBydW50aW1lIChub3QgdXNlci1iYXNlZClcbiAgICAgICAgICAgICAgICAvLyBvcGVyYXRpb24sIGFuZCB0aGUgdHJlZSBpcyByZXNldCBhdXRvbWF0aWNhbGx5IG9uIGV2ZXJ5IHN0ZXAgb2YgdGhlIHNpbXVsYXRpb24uXG4gICAgICAgICAgICAgICAgdGhpcy5ib2RpZXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfbWVyZ2VDb2xsaWRlZCgpIHtcbiAgICAgICAgbGV0IGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IHRoaXMuYm9kaWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgY29sbGlkaW5nSW5kaWNlcyA9IFtdO1xuICAgICAgICAgICAgLy8gQ29sbGVjdCBjb2xsaWRpbmcgZWxlbWVudHM7IG9ubHkgbmVlZCB0byBjaGVjayBlYWNoIHBhaXIgb25jZVxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IGkgKyAxOyBqIDwgdGhpcy5ib2RpZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJlQ29sbGlkaW5nKHRoaXMuYm9kaWVzW2ldLCB0aGlzLmJvZGllc1tqXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQWRkLCBpbiBvcmRlciBvZiBoaWdoZXN0IGluZGV4IGZpcnN0XG4gICAgICAgICAgICAgICAgICAgIGNvbGxpZGluZ0luZGljZXMudW5zaGlmdChqKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjb2xsaWRpbmdJbmRpY2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIC8vIEluY2x1ZGUgdGhlIFwic291cmNlXCIgZWxlbWVudCBpbiB0aGUgY29sbGlzaW9uIHNldFxuICAgICAgICAgICAgICAgIGNvbGxpZGluZ0luZGljZXMucHVzaChpKTtcblxuICAgICAgICAgICAgICAgIC8vIEV4dHJhY3QgZWxlbWVudHMgYW5kIG1lcmdlXG4gICAgICAgICAgICAgICAgY29uc3QgY29sbGlkaW5nID0gY29sbGlkaW5nSW5kaWNlcy5tYXAoaWR4ID0+IHRoaXMuYm9kaWVzLnNwbGljZShpZHgsIDEpWzBdKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9tZXJnZUJvZGllcyhjb2xsaWRpbmcpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogTWVyZ2UgYW5kIHJldHVybiB0aGUgYXJncyBmb3IgYSBuZXcgYm9keSBiYXNlZCBvbiBhIHNldCBvZiBvbGQgYm9kaWVzLiAqL1xuICAgIF9tZXJnZUJvZGllcyhib2RpZXMpIHtcbiAgICAgICAgY29uc3QgbmV3Qm9keUFyZ3MgPSB7IHg6IDAsIHk6IDAsIHZlbFg6IDAsIHZlbFk6IDAsIG1hc3M6IDAsIGNvbG9yOiBib2RpZXNbMF0uY29sb3IgfTtcbiAgICAgICAgbGV0IGxhcmdlc3RNYXNzID0gMDtcbiAgICAgICAgZm9yIChjb25zdCBib2R5IG9mIGJvZGllcykge1xuICAgICAgICAgICAgaWYgKGJvZHkubWFzcyA+IGxhcmdlc3RNYXNzKSB7XG4gICAgICAgICAgICAgICAgbmV3Qm9keUFyZ3MueCA9IGJvZHkueDtcbiAgICAgICAgICAgICAgICBuZXdCb2R5QXJncy55ID0gYm9keS55O1xuICAgICAgICAgICAgICAgIGxhcmdlc3RNYXNzID0gYm9keS5tYXNzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmV3Qm9keUFyZ3MudmVsWCArPSBib2R5LnZlbFg7XG4gICAgICAgICAgICBuZXdCb2R5QXJncy52ZWxZICs9IGJvZHkudmVsWTtcbiAgICAgICAgICAgIG5ld0JvZHlBcmdzLm1hc3MgKz0gYm9keS5tYXNzO1xuICAgICAgICAgICAgbmV3Qm9keUFyZ3MuY29sb3IgPSBjb2xvcnMuYmxlbmQobmV3Qm9keUFyZ3MuY29sb3IsIGJvZHkuY29sb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkTmV3Qm9keShuZXdCb2R5QXJncyk7XG4gICAgfVxuXG4gICAgLyoqIENyZWF0ZSBhbmQgcmV0dXJuIGEgbmV3IGJvZHkgdG8gdGhlIHNpbXVsYXRpb24uICovXG4gICAgYWRkTmV3Qm9keShhcmdzKSB7XG4gICAgICAgIGxldCBib2R5ID0gbmV3IEd0Qm9keShhcmdzKTtcbiAgICAgICAgdGhpcy5ib2RpZXMucHVzaChib2R5KTtcbiAgICAgICAgdGhpcy5fcmVzZXRUcmVlKCk7XG4gICAgICAgIHJldHVybiBib2R5O1xuICAgIH1cblxuICAgIC8qKiBSZW1vdmluZyBhIHRhcmdldCBib2R5IGZyb20gdGhlIHNpbXVsYXRpb24uICovXG4gICAgcmVtb3ZlQm9keSh0YXJnZXRCb2R5KSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5ib2RpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSB0aGlzLmJvZGllc1tpXTtcbiAgICAgICAgICAgIGlmIChib2R5ID09PSB0YXJnZXRCb2R5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ib2RpZXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc2V0VHJlZSgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIExvb2t1cCBhbiAoeCwgeSkgY29vcmRpbmF0ZSBhbmQgcmV0dXJuIHRoZSBib2R5IHRoYXQgaXMgYXQgdGhhdCBwb3NpdGlvbi4gKi9cbiAgICBnZXRCb2R5QXQoeCwgeSkge1xuICAgICAgICBmb3IgKGxldCBpID0gdGhpcy5ib2RpZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSB0aGlzLmJvZGllc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IGlzTWF0Y2ggPSBNYXRoLmFicyh4IC0gYm9keS54KSA8PSBib2R5LnJhZGl1cyAmJlxuICAgICAgICAgICAgICAgIE1hdGguYWJzKHkgLSBib2R5LnkpIDw9IGJvZHkucmFkaXVzO1xuICAgICAgICAgICAgaWYgKGlzTWF0Y2gpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYm9keTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8qKiBDbGVhciB0aGUgc2ltdWxhdGlvbi4gKi9cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5ib2RpZXMubGVuZ3RoID0gMDsgLy8gUmVtb3ZlIGFsbCBib2RpZXMgZnJvbSBjb2xsZWN0aW9uXG4gICAgICAgIHRoaXMuX3Jlc2V0VHJlZSgpO1xuICAgIH1cblxuICAgIC8qKiBDbGVhciBhbmQgcmVzZXQgdGhlIHF1YWR0cmVlLCBhZGRpbmcgYWxsIGV4aXN0aW5nIGJvZGllcyBiYWNrLiAqL1xuICAgIF9yZXNldFRyZWUoKSB7XG4gICAgICAgIHRoaXMudHJlZS5jbGVhcigpO1xuICAgICAgICBmb3IgKGNvbnN0IGJvZHkgb2YgdGhpcy5ib2RpZXMpIHtcbiAgICAgICAgICAgIHRoaXMudHJlZS5hZGRCb2R5KGJvZHkpO1xuICAgICAgICB9XG4gICAgfVxufSAvLyBlbmQgZ3Jhdml0b24vc2ltXG4iLCIvKipcbiAqIGdyYXZpdG9uL3RpbWVyIC0tIFNpbSB0aW1lciBhbmQgRlBTIGxpbWl0ZXJcbiAqL1xuaW1wb3J0IGVudiBmcm9tICcuLi91dGlsL2Vudic7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd0VGltZXIge1xuICAgIGNvbnN0cnVjdG9yKGZuLCBmcHM9bnVsbCkge1xuICAgICAgICB0aGlzLl9mbiA9IGZuO1xuICAgICAgICB0aGlzLl9mcHMgPSBmcHM7XG4gICAgICAgIHRoaXMuX2lzQWN0aXZlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2lzQW5pbWF0aW9uID0gZnBzID09PSBudWxsO1xuICAgICAgICB0aGlzLl9jYW5jZWxsYXRpb25JZCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5fd2luZG93ID0gZW52LmdldFdpbmRvdygpO1xuICAgIH1cblxuICAgIGdldCBhY3RpdmUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pc0FjdGl2ZTtcbiAgICB9XG5cbiAgICBzdGFydCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pc0FjdGl2ZSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2lzQW5pbWF0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYmVnaW5BbmltYXRpb24oKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYmVnaW5JbnRlcnZhbCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5faXNBY3RpdmUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RvcCgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2lzQWN0aXZlKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5faXNBbmltYXRpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl93aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5fY2FuY2VsbGF0aW9uSWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl93aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLl9jYW5jZWxsYXRpb25JZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9pc0FjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdG9nZ2xlKCkge1xuICAgICAgICBpZiAodGhpcy5faXNBY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMuc3RvcCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zdGFydCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2JlZ2luQW5pbWF0aW9uKCkge1xuICAgICAgICBsZXQgbGFzdFRpbWVzdGFtcCA9IHRoaXMuX3dpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgICAgbGV0IGFuaW1hdG9yID0gKHRpbWVzdGFtcCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fY2FuY2VsbGF0aW9uSWQgPSB0aGlzLl93aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdG9yKTtcbiAgICAgICAgICAgIHRoaXMuX2ZuKHRpbWVzdGFtcCAtIGxhc3RUaW1lc3RhbXApO1xuICAgICAgICAgICAgbGFzdFRpbWVzdGFtcCA9IHRpbWVzdGFtcDtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBEZWxheSBpbml0aWFsIGV4ZWN1dGlvbiB1bnRpbCB0aGUgbmV4dCB0aWNrLlxuICAgICAgICB0aGlzLl9jYW5jZWxsYXRpb25JZCA9IHRoaXMuX3dpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0b3IpO1xuICAgIH1cblxuICAgIF9iZWdpbkludGVydmFsKCkge1xuICAgICAgICAvLyBDb21wdXRlIHRoZSBkZWxheSBwZXIgdGljaywgaW4gbWlsbGlzZWNvbmRzLlxuICAgICAgICBsZXQgdGltZW91dCA9IDEwMDAgLyB0aGlzLl9mcHMgfCAwO1xuXG4gICAgICAgIGxldCBsYXN0VGltZXN0YW1wID0gdGhpcy5fd2luZG93LnBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICB0aGlzLl9jYW5jZWxsYXRpb25JZCA9IHRoaXMuX3dpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgICAgICBsZXQgdGltZXN0YW1wID0gdGhpcy5fd2luZG93LnBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICAgICAgdGhpcy5fZm4odGltZXN0YW1wIC0gbGFzdFRpbWVzdGFtcCk7XG4gICAgICAgICAgICBsYXN0VGltZXN0YW1wID0gdGltZXN0YW1wO1xuICAgICAgICAgfSwgdGltZW91dCk7XG4gICAgfVxufSAvLyBlbmQgZ3Jhdml0b24vdGltZXJcbiIsIi8qKlxuICogZ3Jhdml0b24vdHJlZSAtLSBUaGUgZ3Jhdml0YXRpb25hbCBib2R5IHRyZWUgc3RydWN0dXJlXG4gKi9cblxuY2xhc3MgR3RUcmVlTm9kZSB7XG4gICAgY29uc3RydWN0b3Iod2lkdGgsIGhlaWdodCwgc3RhcnRYLCBzdGFydFkpIHtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgdGhpcy5zdGFydFggPSBzdGFydFg7XG4gICAgICAgIHRoaXMuc3RhcnRZID0gc3RhcnRZO1xuXG4gICAgICAgIC8vIENvbnZlbmllbmNlIGNlbnRlciBwb2ludHMuXG4gICAgICAgIHRoaXMuaGFsZldpZHRoID0gd2lkdGggLyAyO1xuICAgICAgICB0aGlzLmhhbGZIZWlnaHQgPSBoZWlnaHQgLyAyO1xuICAgICAgICB0aGlzLm1pZFggPSB0aGlzLnN0YXJ0WCArIHRoaXMuaGFsZldpZHRoO1xuICAgICAgICB0aGlzLm1pZFkgPSB0aGlzLnN0YXJ0WSArIHRoaXMuaGFsZkhlaWdodDtcblxuICAgICAgICAvLyBNYXRjaGVzIEd0Qm9keSdzIHByb3BlcnRpZXMuXG4gICAgICAgIHRoaXMubWFzcyA9IDA7XG4gICAgICAgIHRoaXMueCA9IDA7XG4gICAgICAgIHRoaXMueSA9IDA7XG5cbiAgICAgICAgLy8gW05XLCBORSwgU1csIFNFXVxuICAgICAgICB0aGlzLmNoaWxkcmVuID0gbmV3IEFycmF5KDQpO1xuICAgIH1cblxuICAgIC8qKiBBZGQgYSBib2R5IHRvIHRoZSB0cmVlLCB1cGRhdGluZyBtYXNzIGFuZCBjZW50ZXJwb2ludC4gKi9cbiAgICBhZGRCb2R5KGJvZHkpIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlTWFzcyhib2R5KTtcbiAgICAgICAgY29uc3QgcXVhZHJhbnQgPSB0aGlzLl9nZXRRdWFkcmFudChib2R5LngsIGJvZHkueSk7XG5cbiAgICAgICAgaWYgKHRoaXMuY2hpbGRyZW5bcXVhZHJhbnRdIGluc3RhbmNlb2YgR3RUcmVlTm9kZSkge1xuICAgICAgICAgICAgdGhpcy5jaGlsZHJlbltxdWFkcmFudF0uYWRkQm9keShib2R5KTtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5jaGlsZHJlbltxdWFkcmFudF0pIHtcbiAgICAgICAgICAgIHRoaXMuY2hpbGRyZW5bcXVhZHJhbnRdID0gYm9keTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5jaGlsZHJlbltxdWFkcmFudF07XG4gICAgICAgICAgICBjb25zdCBxdWFkWCA9IGV4aXN0aW5nLnggPiB0aGlzLm1pZFggPyB0aGlzLm1pZFggOiB0aGlzLnN0YXJ0WDtcbiAgICAgICAgICAgIGNvbnN0IHF1YWRZID0gZXhpc3RpbmcueSA+IHRoaXMubWlkWSA/IHRoaXMubWlkWSA6IHRoaXMuc3RhcnRZO1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG5ldyBHdFRyZWVOb2RlKHRoaXMuaGFsZldpZHRoLCB0aGlzLmhhbGZIZWlnaHQsIHF1YWRYLCBxdWFkWSk7XG5cbiAgICAgICAgICAgIG5vZGUuYWRkQm9keShleGlzdGluZyk7XG4gICAgICAgICAgICBub2RlLmFkZEJvZHkoYm9keSk7XG5cbiAgICAgICAgICAgIHRoaXMuY2hpbGRyZW5bcXVhZHJhbnRdID0gbm9kZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBVcGRhdGUgdGhlIGNlbnRlciBvZiBtYXNzIGJhc2VkIG9uIHRoZSBhZGRpdGlvbiBvZiBhIG5ldyBib2R5LiAqL1xuICAgIF91cGRhdGVNYXNzKGJvZHkpIHtcbiAgICAgICAgY29uc3QgbmV3TWFzcyA9IHRoaXMubWFzcyArIGJvZHkubWFzcztcbiAgICAgICAgY29uc3QgbmV3WCA9ICh0aGlzLnggKiB0aGlzLm1hc3MgKyBib2R5LnggKiBib2R5Lm1hc3MpIC8gbmV3TWFzcztcbiAgICAgICAgY29uc3QgbmV3WSA9ICh0aGlzLnkgKiB0aGlzLm1hc3MgKyBib2R5LnkgKiBib2R5Lm1hc3MpIC8gbmV3TWFzcztcbiAgICAgICAgdGhpcy5tYXNzID0gbmV3TWFzcztcbiAgICAgICAgdGhpcy54ID0gbmV3WDtcbiAgICAgICAgdGhpcy55ID0gbmV3WTtcbiAgICB9XG5cbiAgICAvKiogUmV0dXJuIHRoZSBxdWFkcmFudCBpbmRleCBmb3IgYSBnaXZlbiAoeCwgeSkgcGFpci4gQXNzdW1lcyB0aGF0IGl0IGxpZXMgd2l0aGluIGJvdW5kcy4gKi9cbiAgICBfZ2V0UXVhZHJhbnQoeCwgeSkge1xuICAgICAgICBjb25zdCB4SW5kZXggPSBOdW1iZXIoeCA+IHRoaXMubWlkWCk7XG4gICAgICAgIGNvbnN0IHlJbmRleCA9IE51bWJlcih5ID4gdGhpcy5taWRZKSAqIDI7XG4gICAgICAgIHJldHVybiB4SW5kZXggKyB5SW5kZXg7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdFRyZWUge1xuICAgIGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQsIHN0YXJ0WCA9IDAsIHN0YXJ0WSA9IDApIHtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgdGhpcy5zdGFydFggPSBzdGFydFg7XG4gICAgICAgIHRoaXMuc3RhcnRZID0gc3RhcnRZO1xuICAgICAgICB0aGlzLnJvb3QgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgYWRkQm9keShib2R5KSB7XG4gICAgICAgIGlmICh0aGlzLnJvb3QgaW5zdGFuY2VvZiBHdFRyZWVOb2RlKSB7XG4gICAgICAgICAgICB0aGlzLnJvb3QuYWRkQm9keShib2R5KTtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5yb290KSB7XG4gICAgICAgICAgICB0aGlzLnJvb3QgPSBib2R5O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLnJvb3Q7XG4gICAgICAgICAgICB0aGlzLnJvb3QgPSBuZXcgR3RUcmVlTm9kZSh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgdGhpcy5zdGFydFgsIHRoaXMuc3RhcnRZKTtcbiAgICAgICAgICAgIHRoaXMucm9vdC5hZGRCb2R5KGV4aXN0aW5nKTtcbiAgICAgICAgICAgIHRoaXMucm9vdC5hZGRCb2R5KGJvZHkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMucm9vdCA9IHVuZGVmaW5lZDtcbiAgICB9XG59IC8vIGVuZCBncmF2aXRvbi90cmVlXG4iLCJpbXBvcnQgJy4vdmVuZG9yL2pzY29sb3InO1xuaW1wb3J0IHZleCBmcm9tICcuL3ZlbmRvci92ZXgnO1xuaW1wb3J0ICcuL3BvbHlmaWxscyc7XG5pbXBvcnQgZ3QgZnJvbSAnLi9ncmF2aXRvbic7XG5cbndpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBTZXQgb3B0aW9ucyBmb3IgZGVwZW5kZW5jaWVzLlxuICAgIHZleC5kZWZhdWx0T3B0aW9ucy5jbGFzc05hbWUgPSAndmV4LXRoZW1lLXdpcmVmcmFtZSc7XG5cbiAgICAvLyBTdGFydCB0aGUgbWFpbiBncmF2aXRvbiBhcHAuXG4gICAgd2luZG93LmdyYXZpdG9uID0gbmV3IGd0LmFwcCgpO1xufTtcbiIsIndpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgIHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gd2luZG93LnNldFRpbWVvdXQoY2FsbGJhY2ssIDEwMDAgLyA2MCk7XG4gICAgfTtcblxud2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgd2luZG93Lm1vekNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgZnVuY3Rpb24odGltZW91dElkKSB7XG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICB9O1xuXG53aW5kb3cucGVyZm9ybWFuY2UgPSB3aW5kb3cucGVyZm9ybWFuY2UgfHwge307XG53aW5kb3cucGVyZm9ybWFuY2Uubm93ID0gd2luZG93LnBlcmZvcm1hbmNlLm5vdyB8fFxuICAgIHdpbmRvdy5wZXJmb3JtYW5jZS53ZWJraXROb3cgfHxcbiAgICB3aW5kb3cucGVyZm9ybWFuY2UubW96Tm93IHx8XG4gICAgRGF0ZS5ub3c7XG4iLCIvKipcbiAqIGNvbG9ycyAtLSBDb2xvciBtYW5pcHVsYXRpb24gaGVscGVyc1xuICovXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgYnJpZ2h0ZW4oY29sb3JBcnJheSwgcGVyY2VudCkge1xuICAgICAgICBsZXQgW3IsIGcsIGJdID0gY29sb3JBcnJheTtcbiAgICAgICAgciA9IE1hdGgucm91bmQoTWF0aC5taW4oTWF0aC5tYXgoMCwgciArIChyICogcGVyY2VudCkpLCAyNTUpKTtcbiAgICAgICAgZyA9IE1hdGgucm91bmQoTWF0aC5taW4oTWF0aC5tYXgoMCwgZyArIChnICogcGVyY2VudCkpLCAyNTUpKTtcbiAgICAgICAgYiA9IE1hdGgucm91bmQoTWF0aC5taW4oTWF0aC5tYXgoMCwgYiArIChiICogcGVyY2VudCkpLCAyNTUpKTtcbiAgICAgICAgcmV0dXJuIFtyLCBnLCBiXTtcbiAgICB9LFxuXG4gICAgZnJvbUhleChoZXgpIHtcbiAgICAgICAgbGV0IGggPSBoZXgucmVwbGFjZSgnIycsICcnKTtcbiAgICAgICAgaWYgKGgubGVuZ3RoIDwgNikge1xuICAgICAgICAgICAgaCA9IGgucmVwbGFjZSgvKC4pL2csICckMSQxJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFtwYXJzZUludChoLnN1YnN0cigwLCAyKSwgMTYpLFxuICAgICAgICAgICAgICAgIHBhcnNlSW50KGguc3Vic3RyKDIsIDIpLCAxNiksXG4gICAgICAgICAgICAgICAgcGFyc2VJbnQoaC5zdWJzdHIoNCwgMiksIDE2KV07XG4gICAgfSxcblxuICAgIHRvSGV4KGNvbG9yQXJyYXkpIHtcbiAgICAgICAgY29uc3QgW3IsIGcsIGJdID0gY29sb3JBcnJheTtcbiAgICAgICAgcmV0dXJuICcjJyArICgnMCcgKyByLnRvU3RyaW5nKDE2KSkuc3Vic3RyKHIgPCAxNiA/IDAgOiAxKSArXG4gICAgICAgICAgICAgICAgICAgICAoJzAnICsgZy50b1N0cmluZygxNikpLnN1YnN0cihnIDwgMTYgPyAwIDogMSkgK1xuICAgICAgICAgICAgICAgICAgICAgKCcwJyArIGIudG9TdHJpbmcoMTYpKS5zdWJzdHIoYiA8IDE2ID8gMCA6IDEpO1xuICAgIH0sXG5cbiAgICBibGVuZChjb2xvcjEsIGNvbG9yMiwgcGVyY2VudGFnZSA9IDAuNSkge1xuICAgICAgICBsZXQgcGFyc2VkQ29sb3IxID0gdGhpcy5mcm9tSGV4KGNvbG9yMSk7XG4gICAgICAgIGxldCBwYXJzZWRDb2xvcjIgPSB0aGlzLmZyb21IZXgoY29sb3IyKTtcblxuICAgICAgICBsZXQgYmxlbmRlZENvbG9yID0gW1xuICAgICAgICAgICAgTWF0aC5yb3VuZChNYXRoLm1pbihNYXRoLm1heCgwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICgxIC0gcGVyY2VudGFnZSkgKiBwYXJzZWRDb2xvcjFbMF0gKyBwZXJjZW50YWdlICogcGFyc2VkQ29sb3IyWzBdKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIDI1NSkpLFxuICAgICAgICAgICAgTWF0aC5yb3VuZChNYXRoLm1pbihNYXRoLm1heCgwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICgxIC0gcGVyY2VudGFnZSkgKiBwYXJzZWRDb2xvcjFbMV0gKyBwZXJjZW50YWdlICogcGFyc2VkQ29sb3IyWzFdKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIDI1NSkpLFxuICAgICAgICAgICAgTWF0aC5yb3VuZChNYXRoLm1pbihNYXRoLm1heCgwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICgxIC0gcGVyY2VudGFnZSkgKiBwYXJzZWRDb2xvcjFbMl0gKyBwZXJjZW50YWdlICogcGFyc2VkQ29sb3IyWzJdKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIDI1NSkpXG4gICAgICAgIF07XG4gICAgICAgIHJldHVybiB0aGlzLnRvSGV4KGJsZW5kZWRDb2xvcik7XG4gICAgfVxufTtcbiIsIi8qKlxuICogZW52IC0gRW52aXJvbm1lbnQgcmV0cmlldmFsIG1ldGhvZHMuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBnZXRXaW5kb3coKSB7XG4gICAgICAgIHJldHVybiB3aW5kb3c7XG4gICAgfVxufTtcbiIsIi8qKlxuICogcmFuZG9tIC0tIEEgY29sbGVjdGlvbiBvZiByYW5kb20gZ2VuZXJhdG9yIGZ1bmN0aW9uc1xuICovXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgYSByYW5kb20gbnVtYmVyIGJldHdlZW4gdGhlIGdpdmVuIHN0YXJ0IGFuZCBlbmQgcG9pbnRzXG4gICAgICovXG4gICAgbnVtYmVyKGZyb20sIHRvPW51bGwpIHtcbiAgICAgICAgaWYgKHRvID09PSBudWxsKSB7XG4gICAgICAgICAgICB0byA9IGZyb207XG4gICAgICAgICAgICBmcm9tID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBNYXRoLnJhbmRvbSgpICogKHRvIC0gZnJvbSkgKyBmcm9tO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZSBhIHJhbmRvbSBpbnRlZ2VyIGJldHdlZW4gdGhlIGdpdmVuIHBvc2l0aW9uc1xuICAgICAqL1xuICAgIGludGVnZXIoLi4uYXJncykge1xuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcih0aGlzLm51bWJlciguLi5hcmdzKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGEgcmFuZG9tIG51bWJlciwgd2l0aCBhIHJhbmRvbSBzaWduLCBiZXR3ZWVuIHRoZSBnaXZlblxuICAgICAqIHBvc2l0aW9uc1xuICAgICAqL1xuICAgIGRpcmVjdGlvbmFsKC4uLmFyZ3MpIHtcbiAgICAgICAgbGV0IHJhbmQgPSB0aGlzLm51bWJlciguLi5hcmdzKTtcbiAgICAgICAgaWYgKE1hdGgucmFuZG9tKCkgPiAwLjUpIHtcbiAgICAgICAgICAgIHJhbmQgPSAtcmFuZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmFuZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgYSByYW5kb20gaGV4YWRlY2ltYWwgY29sb3JcbiAgICAgKi9cbiAgICBjb2xvcigpIHtcbiAgICAgICAgcmV0dXJuICcjJyArICgnMDAwMDAnICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMHgxMDAwMDAwKS50b1N0cmluZygxNikpLnN1YnN0cigtNik7XG4gICAgfVxufTtcbiIsIi8qKlxuICoganNjb2xvciAtIEphdmFTY3JpcHQgQ29sb3IgUGlja2VyXG4gKlxuICogQGxpbmsgICAgaHR0cDovL2pzY29sb3IuY29tXG4gKiBAbGljZW5zZSBGb3Igb3BlbiBzb3VyY2UgdXNlOiBHUEx2M1xuICogICAgICAgICAgRm9yIGNvbW1lcmNpYWwgdXNlOiBKU0NvbG9yIENvbW1lcmNpYWwgTGljZW5zZVxuICogQGF1dGhvciAgSmFuIE9kdmFya29cbiAqIEB2ZXJzaW9uIDIuMC40XG4gKlxuICogU2VlIHVzYWdlIGV4YW1wbGVzIGF0IGh0dHA6Ly9qc2NvbG9yLmNvbS9leGFtcGxlcy9cbiAqL1xuXG5cblwidXNlIHN0cmljdFwiO1xuXG5cbmlmICghd2luZG93LmpzY29sb3IpIHsgd2luZG93LmpzY29sb3IgPSAoZnVuY3Rpb24gKCkge1xuXG5cbnZhciBqc2MgPSB7XG5cblxuXHRyZWdpc3RlciA6IGZ1bmN0aW9uICgpIHtcblx0XHRqc2MuYXR0YWNoRE9NUmVhZHlFdmVudChqc2MuaW5pdCk7XG5cdFx0anNjLmF0dGFjaEV2ZW50KGRvY3VtZW50LCAnbW91c2Vkb3duJywganNjLm9uRG9jdW1lbnRNb3VzZURvd24pO1xuXHRcdGpzYy5hdHRhY2hFdmVudChkb2N1bWVudCwgJ3RvdWNoc3RhcnQnLCBqc2Mub25Eb2N1bWVudFRvdWNoU3RhcnQpO1xuXHRcdGpzYy5hdHRhY2hFdmVudCh3aW5kb3csICdyZXNpemUnLCBqc2Mub25XaW5kb3dSZXNpemUpO1xuXHR9LFxuXG5cblx0aW5pdCA6IGZ1bmN0aW9uICgpIHtcblx0XHRpZiAoanNjLmpzY29sb3IubG9va3VwQ2xhc3MpIHtcblx0XHRcdGpzYy5qc2NvbG9yLmluc3RhbGxCeUNsYXNzTmFtZShqc2MuanNjb2xvci5sb29rdXBDbGFzcyk7XG5cdFx0fVxuXHR9LFxuXG5cblx0dHJ5SW5zdGFsbE9uRWxlbWVudHMgOiBmdW5jdGlvbiAoZWxtcywgY2xhc3NOYW1lKSB7XG5cdFx0dmFyIG1hdGNoQ2xhc3MgPSBuZXcgUmVnRXhwKCcoXnxcXFxccykoJyArIGNsYXNzTmFtZSArICcpKFxcXFxzKihcXFxce1tefV0qXFxcXH0pfFxcXFxzfCQpJywgJ2knKTtcblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZWxtcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0aWYgKGVsbXNbaV0udHlwZSAhPT0gdW5kZWZpbmVkICYmIGVsbXNbaV0udHlwZS50b0xvd2VyQ2FzZSgpID09ICdjb2xvcicpIHtcblx0XHRcdFx0aWYgKGpzYy5pc0NvbG9yQXR0clN1cHBvcnRlZCkge1xuXHRcdFx0XHRcdC8vIHNraXAgaW5wdXRzIG9mIHR5cGUgJ2NvbG9yJyBpZiBzdXBwb3J0ZWQgYnkgdGhlIGJyb3dzZXJcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0dmFyIG07XG5cdFx0XHRpZiAoIWVsbXNbaV0uanNjb2xvciAmJiBlbG1zW2ldLmNsYXNzTmFtZSAmJiAobSA9IGVsbXNbaV0uY2xhc3NOYW1lLm1hdGNoKG1hdGNoQ2xhc3MpKSkge1xuXHRcdFx0XHR2YXIgdGFyZ2V0RWxtID0gZWxtc1tpXTtcblx0XHRcdFx0dmFyIG9wdHNTdHIgPSBudWxsO1xuXG5cdFx0XHRcdHZhciBkYXRhT3B0aW9ucyA9IGpzYy5nZXREYXRhQXR0cih0YXJnZXRFbG0sICdqc2NvbG9yJyk7XG5cdFx0XHRcdGlmIChkYXRhT3B0aW9ucyAhPT0gbnVsbCkge1xuXHRcdFx0XHRcdG9wdHNTdHIgPSBkYXRhT3B0aW9ucztcblx0XHRcdFx0fSBlbHNlIGlmIChtWzRdKSB7XG5cdFx0XHRcdFx0b3B0c1N0ciA9IG1bNF07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgb3B0cyA9IHt9O1xuXHRcdFx0XHRpZiAob3B0c1N0cikge1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRvcHRzID0gKG5ldyBGdW5jdGlvbiAoJ3JldHVybiAoJyArIG9wdHNTdHIgKyAnKScpKSgpO1xuXHRcdFx0XHRcdH0gY2F0Y2goZVBhcnNlRXJyb3IpIHtcblx0XHRcdFx0XHRcdGpzYy53YXJuKCdFcnJvciBwYXJzaW5nIGpzY29sb3Igb3B0aW9uczogJyArIGVQYXJzZUVycm9yICsgJzpcXG4nICsgb3B0c1N0cik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHRhcmdldEVsbS5qc2NvbG9yID0gbmV3IGpzYy5qc2NvbG9yKHRhcmdldEVsbSwgb3B0cyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0aXNDb2xvckF0dHJTdXBwb3J0ZWQgOiAoZnVuY3Rpb24gKCkge1xuXHRcdHZhciBlbG0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuXHRcdGlmIChlbG0uc2V0QXR0cmlidXRlKSB7XG5cdFx0XHRlbG0uc2V0QXR0cmlidXRlKCd0eXBlJywgJ2NvbG9yJyk7XG5cdFx0XHRpZiAoZWxtLnR5cGUudG9Mb3dlckNhc2UoKSA9PSAnY29sb3InKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0pKCksXG5cblxuXHRpc0NhbnZhc1N1cHBvcnRlZCA6IChmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGVsbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRcdHJldHVybiAhIShlbG0uZ2V0Q29udGV4dCAmJiBlbG0uZ2V0Q29udGV4dCgnMmQnKSk7XG5cdH0pKCksXG5cblxuXHRmZXRjaEVsZW1lbnQgOiBmdW5jdGlvbiAobWl4ZWQpIHtcblx0XHRyZXR1cm4gdHlwZW9mIG1peGVkID09PSAnc3RyaW5nJyA/IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG1peGVkKSA6IG1peGVkO1xuXHR9LFxuXG5cblx0aXNFbGVtZW50VHlwZSA6IGZ1bmN0aW9uIChlbG0sIHR5cGUpIHtcblx0XHRyZXR1cm4gZWxtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09IHR5cGUudG9Mb3dlckNhc2UoKTtcblx0fSxcblxuXG5cdGdldERhdGFBdHRyIDogZnVuY3Rpb24gKGVsLCBuYW1lKSB7XG5cdFx0dmFyIGF0dHJOYW1lID0gJ2RhdGEtJyArIG5hbWU7XG5cdFx0dmFyIGF0dHJWYWx1ZSA9IGVsLmdldEF0dHJpYnV0ZShhdHRyTmFtZSk7XG5cdFx0aWYgKGF0dHJWYWx1ZSAhPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIGF0dHJWYWx1ZTtcblx0XHR9XG5cdFx0cmV0dXJuIG51bGw7XG5cdH0sXG5cblxuXHRhdHRhY2hFdmVudCA6IGZ1bmN0aW9uIChlbCwgZXZudCwgZnVuYykge1xuXHRcdGlmIChlbC5hZGRFdmVudExpc3RlbmVyKSB7XG5cdFx0XHRlbC5hZGRFdmVudExpc3RlbmVyKGV2bnQsIGZ1bmMsIGZhbHNlKTtcblx0XHR9IGVsc2UgaWYgKGVsLmF0dGFjaEV2ZW50KSB7XG5cdFx0XHRlbC5hdHRhY2hFdmVudCgnb24nICsgZXZudCwgZnVuYyk7XG5cdFx0fVxuXHR9LFxuXG5cblx0ZGV0YWNoRXZlbnQgOiBmdW5jdGlvbiAoZWwsIGV2bnQsIGZ1bmMpIHtcblx0XHRpZiAoZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuXHRcdFx0ZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihldm50LCBmdW5jLCBmYWxzZSk7XG5cdFx0fSBlbHNlIGlmIChlbC5kZXRhY2hFdmVudCkge1xuXHRcdFx0ZWwuZGV0YWNoRXZlbnQoJ29uJyArIGV2bnQsIGZ1bmMpO1xuXHRcdH1cblx0fSxcblxuXG5cdF9hdHRhY2hlZEdyb3VwRXZlbnRzIDoge30sXG5cblxuXHRhdHRhY2hHcm91cEV2ZW50IDogZnVuY3Rpb24gKGdyb3VwTmFtZSwgZWwsIGV2bnQsIGZ1bmMpIHtcblx0XHRpZiAoIWpzYy5fYXR0YWNoZWRHcm91cEV2ZW50cy5oYXNPd25Qcm9wZXJ0eShncm91cE5hbWUpKSB7XG5cdFx0XHRqc2MuX2F0dGFjaGVkR3JvdXBFdmVudHNbZ3JvdXBOYW1lXSA9IFtdO1xuXHRcdH1cblx0XHRqc2MuX2F0dGFjaGVkR3JvdXBFdmVudHNbZ3JvdXBOYW1lXS5wdXNoKFtlbCwgZXZudCwgZnVuY10pO1xuXHRcdGpzYy5hdHRhY2hFdmVudChlbCwgZXZudCwgZnVuYyk7XG5cdH0sXG5cblxuXHRkZXRhY2hHcm91cEV2ZW50cyA6IGZ1bmN0aW9uIChncm91cE5hbWUpIHtcblx0XHRpZiAoanNjLl9hdHRhY2hlZEdyb3VwRXZlbnRzLmhhc093blByb3BlcnR5KGdyb3VwTmFtZSkpIHtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwganNjLl9hdHRhY2hlZEdyb3VwRXZlbnRzW2dyb3VwTmFtZV0ubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0dmFyIGV2dCA9IGpzYy5fYXR0YWNoZWRHcm91cEV2ZW50c1tncm91cE5hbWVdW2ldO1xuXHRcdFx0XHRqc2MuZGV0YWNoRXZlbnQoZXZ0WzBdLCBldnRbMV0sIGV2dFsyXSk7XG5cdFx0XHR9XG5cdFx0XHRkZWxldGUganNjLl9hdHRhY2hlZEdyb3VwRXZlbnRzW2dyb3VwTmFtZV07XG5cdFx0fVxuXHR9LFxuXG5cblx0YXR0YWNoRE9NUmVhZHlFdmVudCA6IGZ1bmN0aW9uIChmdW5jKSB7XG5cdFx0dmFyIGZpcmVkID0gZmFsc2U7XG5cdFx0dmFyIGZpcmVPbmNlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKCFmaXJlZCkge1xuXHRcdFx0XHRmaXJlZCA9IHRydWU7XG5cdFx0XHRcdGZ1bmMoKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0aWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcblx0XHRcdHNldFRpbWVvdXQoZmlyZU9uY2UsIDEpOyAvLyBhc3luY1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmIChkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKSB7XG5cdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZmlyZU9uY2UsIGZhbHNlKTtcblxuXHRcdFx0Ly8gRmFsbGJhY2tcblx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZmlyZU9uY2UsIGZhbHNlKTtcblxuXHRcdH0gZWxzZSBpZiAoZG9jdW1lbnQuYXR0YWNoRXZlbnQpIHtcblx0XHRcdC8vIElFXG5cdFx0XHRkb2N1bWVudC5hdHRhY2hFdmVudCgnb25yZWFkeXN0YXRlY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xuXHRcdFx0XHRcdGRvY3VtZW50LmRldGFjaEV2ZW50KCdvbnJlYWR5c3RhdGVjaGFuZ2UnLCBhcmd1bWVudHMuY2FsbGVlKTtcblx0XHRcdFx0XHRmaXJlT25jZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXG5cdFx0XHQvLyBGYWxsYmFja1xuXHRcdFx0d2luZG93LmF0dGFjaEV2ZW50KCdvbmxvYWQnLCBmaXJlT25jZSk7XG5cblx0XHRcdC8vIElFNy84XG5cdFx0XHRpZiAoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRvU2Nyb2xsICYmIHdpbmRvdyA9PSB3aW5kb3cudG9wKSB7XG5cdFx0XHRcdHZhciB0cnlTY3JvbGwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0aWYgKCFkb2N1bWVudC5ib2R5KSB7IHJldHVybjsgfVxuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZG9TY3JvbGwoJ2xlZnQnKTtcblx0XHRcdFx0XHRcdGZpcmVPbmNlKCk7XG5cdFx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdFx0c2V0VGltZW91dCh0cnlTY3JvbGwsIDEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblx0XHRcdFx0dHJ5U2Nyb2xsKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0d2FybiA6IGZ1bmN0aW9uIChtc2cpIHtcblx0XHRpZiAod2luZG93LmNvbnNvbGUgJiYgd2luZG93LmNvbnNvbGUud2Fybikge1xuXHRcdFx0d2luZG93LmNvbnNvbGUud2Fybihtc2cpO1xuXHRcdH1cblx0fSxcblxuXG5cdHByZXZlbnREZWZhdWx0IDogZnVuY3Rpb24gKGUpIHtcblx0XHRpZiAoZS5wcmV2ZW50RGVmYXVsdCkgeyBlLnByZXZlbnREZWZhdWx0KCk7IH1cblx0XHRlLnJldHVyblZhbHVlID0gZmFsc2U7XG5cdH0sXG5cblxuXHRjYXB0dXJlVGFyZ2V0IDogZnVuY3Rpb24gKHRhcmdldCkge1xuXHRcdC8vIElFXG5cdFx0aWYgKHRhcmdldC5zZXRDYXB0dXJlKSB7XG5cdFx0XHRqc2MuX2NhcHR1cmVkVGFyZ2V0ID0gdGFyZ2V0O1xuXHRcdFx0anNjLl9jYXB0dXJlZFRhcmdldC5zZXRDYXB0dXJlKCk7XG5cdFx0fVxuXHR9LFxuXG5cblx0cmVsZWFzZVRhcmdldCA6IGZ1bmN0aW9uICgpIHtcblx0XHQvLyBJRVxuXHRcdGlmIChqc2MuX2NhcHR1cmVkVGFyZ2V0KSB7XG5cdFx0XHRqc2MuX2NhcHR1cmVkVGFyZ2V0LnJlbGVhc2VDYXB0dXJlKCk7XG5cdFx0XHRqc2MuX2NhcHR1cmVkVGFyZ2V0ID0gbnVsbDtcblx0XHR9XG5cdH0sXG5cblxuXHRmaXJlRXZlbnQgOiBmdW5jdGlvbiAoZWwsIGV2bnQpIHtcblx0XHRpZiAoIWVsKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGlmIChkb2N1bWVudC5jcmVhdGVFdmVudCkge1xuXHRcdFx0dmFyIGV2ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0hUTUxFdmVudHMnKTtcblx0XHRcdGV2LmluaXRFdmVudChldm50LCB0cnVlLCB0cnVlKTtcblx0XHRcdGVsLmRpc3BhdGNoRXZlbnQoZXYpO1xuXHRcdH0gZWxzZSBpZiAoZG9jdW1lbnQuY3JlYXRlRXZlbnRPYmplY3QpIHtcblx0XHRcdHZhciBldiA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG5cdFx0XHRlbC5maXJlRXZlbnQoJ29uJyArIGV2bnQsIGV2KTtcblx0XHR9IGVsc2UgaWYgKGVsWydvbicgKyBldm50XSkgeyAvLyBhbHRlcm5hdGl2ZWx5IHVzZSB0aGUgdHJhZGl0aW9uYWwgZXZlbnQgbW9kZWxcblx0XHRcdGVsWydvbicgKyBldm50XSgpO1xuXHRcdH1cblx0fSxcblxuXG5cdGNsYXNzTmFtZVRvTGlzdCA6IGZ1bmN0aW9uIChjbGFzc05hbWUpIHtcblx0XHRyZXR1cm4gY2xhc3NOYW1lLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKS5zcGxpdCgvXFxzKy8pO1xuXHR9LFxuXG5cblx0Ly8gVGhlIGNsYXNzTmFtZSBwYXJhbWV0ZXIgKHN0cikgY2FuIG9ubHkgY29udGFpbiBhIHNpbmdsZSBjbGFzcyBuYW1lXG5cdGhhc0NsYXNzIDogZnVuY3Rpb24gKGVsbSwgY2xhc3NOYW1lKSB7XG5cdFx0aWYgKCFjbGFzc05hbWUpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0cmV0dXJuIC0xICE9ICgnICcgKyBlbG0uY2xhc3NOYW1lLnJlcGxhY2UoL1xccysvZywgJyAnKSArICcgJykuaW5kZXhPZignICcgKyBjbGFzc05hbWUgKyAnICcpO1xuXHR9LFxuXG5cblx0Ly8gVGhlIGNsYXNzTmFtZSBwYXJhbWV0ZXIgKHN0cikgY2FuIGNvbnRhaW4gbXVsdGlwbGUgY2xhc3MgbmFtZXMgc2VwYXJhdGVkIGJ5IHdoaXRlc3BhY2Vcblx0c2V0Q2xhc3MgOiBmdW5jdGlvbiAoZWxtLCBjbGFzc05hbWUpIHtcblx0XHR2YXIgY2xhc3NMaXN0ID0ganNjLmNsYXNzTmFtZVRvTGlzdChjbGFzc05hbWUpO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgY2xhc3NMaXN0Lmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRpZiAoIWpzYy5oYXNDbGFzcyhlbG0sIGNsYXNzTGlzdFtpXSkpIHtcblx0XHRcdFx0ZWxtLmNsYXNzTmFtZSArPSAoZWxtLmNsYXNzTmFtZSA/ICcgJyA6ICcnKSArIGNsYXNzTGlzdFtpXTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblxuXHQvLyBUaGUgY2xhc3NOYW1lIHBhcmFtZXRlciAoc3RyKSBjYW4gY29udGFpbiBtdWx0aXBsZSBjbGFzcyBuYW1lcyBzZXBhcmF0ZWQgYnkgd2hpdGVzcGFjZVxuXHR1bnNldENsYXNzIDogZnVuY3Rpb24gKGVsbSwgY2xhc3NOYW1lKSB7XG5cdFx0dmFyIGNsYXNzTGlzdCA9IGpzYy5jbGFzc05hbWVUb0xpc3QoY2xhc3NOYW1lKTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGNsYXNzTGlzdC5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0dmFyIHJlcGwgPSBuZXcgUmVnRXhwKFxuXHRcdFx0XHQnXlxcXFxzKicgKyBjbGFzc0xpc3RbaV0gKyAnXFxcXHMqfCcgK1xuXHRcdFx0XHQnXFxcXHMqJyArIGNsYXNzTGlzdFtpXSArICdcXFxccyokfCcgK1xuXHRcdFx0XHQnXFxcXHMrJyArIGNsYXNzTGlzdFtpXSArICcoXFxcXHMrKScsXG5cdFx0XHRcdCdnJ1xuXHRcdFx0KTtcblx0XHRcdGVsbS5jbGFzc05hbWUgPSBlbG0uY2xhc3NOYW1lLnJlcGxhY2UocmVwbCwgJyQxJyk7XG5cdFx0fVxuXHR9LFxuXG5cblx0Z2V0U3R5bGUgOiBmdW5jdGlvbiAoZWxtKSB7XG5cdFx0cmV0dXJuIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlID8gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxtKSA6IGVsbS5jdXJyZW50U3R5bGU7XG5cdH0sXG5cblxuXHRzZXRTdHlsZSA6IChmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGhlbHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdHZhciBnZXRTdXBwb3J0ZWRQcm9wID0gZnVuY3Rpb24gKG5hbWVzKSB7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IG5hbWVzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdGlmIChuYW1lc1tpXSBpbiBoZWxwZXIuc3R5bGUpIHtcblx0XHRcdFx0XHRyZXR1cm4gbmFtZXNbaV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXHRcdHZhciBwcm9wcyA9IHtcblx0XHRcdGJvcmRlclJhZGl1czogZ2V0U3VwcG9ydGVkUHJvcChbJ2JvcmRlclJhZGl1cycsICdNb3pCb3JkZXJSYWRpdXMnLCAnd2Via2l0Qm9yZGVyUmFkaXVzJ10pLFxuXHRcdFx0Ym94U2hhZG93OiBnZXRTdXBwb3J0ZWRQcm9wKFsnYm94U2hhZG93JywgJ01vekJveFNoYWRvdycsICd3ZWJraXRCb3hTaGFkb3cnXSlcblx0XHR9O1xuXHRcdHJldHVybiBmdW5jdGlvbiAoZWxtLCBwcm9wLCB2YWx1ZSkge1xuXHRcdFx0c3dpdGNoIChwcm9wLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRcdGNhc2UgJ29wYWNpdHknOlxuXHRcdFx0XHR2YXIgYWxwaGFPcGFjaXR5ID0gTWF0aC5yb3VuZChwYXJzZUZsb2F0KHZhbHVlKSAqIDEwMCk7XG5cdFx0XHRcdGVsbS5zdHlsZS5vcGFjaXR5ID0gdmFsdWU7XG5cdFx0XHRcdGVsbS5zdHlsZS5maWx0ZXIgPSAnYWxwaGEob3BhY2l0eT0nICsgYWxwaGFPcGFjaXR5ICsgJyknO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdGVsbS5zdHlsZVtwcm9wc1twcm9wXV0gPSB2YWx1ZTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSkoKSxcblxuXG5cdHNldEJvcmRlclJhZGl1cyA6IGZ1bmN0aW9uIChlbG0sIHZhbHVlKSB7XG5cdFx0anNjLnNldFN0eWxlKGVsbSwgJ2JvcmRlclJhZGl1cycsIHZhbHVlIHx8ICcwJyk7XG5cdH0sXG5cblxuXHRzZXRCb3hTaGFkb3cgOiBmdW5jdGlvbiAoZWxtLCB2YWx1ZSkge1xuXHRcdGpzYy5zZXRTdHlsZShlbG0sICdib3hTaGFkb3cnLCB2YWx1ZSB8fCAnbm9uZScpO1xuXHR9LFxuXG5cblx0Z2V0RWxlbWVudFBvcyA6IGZ1bmN0aW9uIChlLCByZWxhdGl2ZVRvVmlld3BvcnQpIHtcblx0XHR2YXIgeD0wLCB5PTA7XG5cdFx0dmFyIHJlY3QgPSBlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdHggPSByZWN0LmxlZnQ7XG5cdFx0eSA9IHJlY3QudG9wO1xuXHRcdGlmICghcmVsYXRpdmVUb1ZpZXdwb3J0KSB7XG5cdFx0XHR2YXIgdmlld1BvcyA9IGpzYy5nZXRWaWV3UG9zKCk7XG5cdFx0XHR4ICs9IHZpZXdQb3NbMF07XG5cdFx0XHR5ICs9IHZpZXdQb3NbMV07XG5cdFx0fVxuXHRcdHJldHVybiBbeCwgeV07XG5cdH0sXG5cblxuXHRnZXRFbGVtZW50U2l6ZSA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0cmV0dXJuIFtlLm9mZnNldFdpZHRoLCBlLm9mZnNldEhlaWdodF07XG5cdH0sXG5cblxuXHQvLyBnZXQgcG9pbnRlcidzIFgvWSBjb29yZGluYXRlcyByZWxhdGl2ZSB0byB2aWV3cG9ydFxuXHRnZXRBYnNQb2ludGVyUG9zIDogZnVuY3Rpb24gKGUpIHtcblx0XHRpZiAoIWUpIHsgZSA9IHdpbmRvdy5ldmVudDsgfVxuXHRcdHZhciB4ID0gMCwgeSA9IDA7XG5cdFx0aWYgKHR5cGVvZiBlLmNoYW5nZWRUb3VjaGVzICE9PSAndW5kZWZpbmVkJyAmJiBlLmNoYW5nZWRUb3VjaGVzLmxlbmd0aCkge1xuXHRcdFx0Ly8gdG91Y2ggZGV2aWNlc1xuXHRcdFx0eCA9IGUuY2hhbmdlZFRvdWNoZXNbMF0uY2xpZW50WDtcblx0XHRcdHkgPSBlLmNoYW5nZWRUb3VjaGVzWzBdLmNsaWVudFk7XG5cdFx0fSBlbHNlIGlmICh0eXBlb2YgZS5jbGllbnRYID09PSAnbnVtYmVyJykge1xuXHRcdFx0eCA9IGUuY2xpZW50WDtcblx0XHRcdHkgPSBlLmNsaWVudFk7XG5cdFx0fVxuXHRcdHJldHVybiB7IHg6IHgsIHk6IHkgfTtcblx0fSxcblxuXG5cdC8vIGdldCBwb2ludGVyJ3MgWC9ZIGNvb3JkaW5hdGVzIHJlbGF0aXZlIHRvIHRhcmdldCBlbGVtZW50XG5cdGdldFJlbFBvaW50ZXJQb3MgOiBmdW5jdGlvbiAoZSkge1xuXHRcdGlmICghZSkgeyBlID0gd2luZG93LmV2ZW50OyB9XG5cdFx0dmFyIHRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcblx0XHR2YXIgdGFyZ2V0UmVjdCA9IHRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuXHRcdHZhciB4ID0gMCwgeSA9IDA7XG5cblx0XHR2YXIgY2xpZW50WCA9IDAsIGNsaWVudFkgPSAwO1xuXHRcdGlmICh0eXBlb2YgZS5jaGFuZ2VkVG91Y2hlcyAhPT0gJ3VuZGVmaW5lZCcgJiYgZS5jaGFuZ2VkVG91Y2hlcy5sZW5ndGgpIHtcblx0XHRcdC8vIHRvdWNoIGRldmljZXNcblx0XHRcdGNsaWVudFggPSBlLmNoYW5nZWRUb3VjaGVzWzBdLmNsaWVudFg7XG5cdFx0XHRjbGllbnRZID0gZS5jaGFuZ2VkVG91Y2hlc1swXS5jbGllbnRZO1xuXHRcdH0gZWxzZSBpZiAodHlwZW9mIGUuY2xpZW50WCA9PT0gJ251bWJlcicpIHtcblx0XHRcdGNsaWVudFggPSBlLmNsaWVudFg7XG5cdFx0XHRjbGllbnRZID0gZS5jbGllbnRZO1xuXHRcdH1cblxuXHRcdHggPSBjbGllbnRYIC0gdGFyZ2V0UmVjdC5sZWZ0O1xuXHRcdHkgPSBjbGllbnRZIC0gdGFyZ2V0UmVjdC50b3A7XG5cdFx0cmV0dXJuIHsgeDogeCwgeTogeSB9O1xuXHR9LFxuXG5cblx0Z2V0Vmlld1BvcyA6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZG9jID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuXHRcdHJldHVybiBbXG5cdFx0XHQod2luZG93LnBhZ2VYT2Zmc2V0IHx8IGRvYy5zY3JvbGxMZWZ0KSAtIChkb2MuY2xpZW50TGVmdCB8fCAwKSxcblx0XHRcdCh3aW5kb3cucGFnZVlPZmZzZXQgfHwgZG9jLnNjcm9sbFRvcCkgLSAoZG9jLmNsaWVudFRvcCB8fCAwKVxuXHRcdF07XG5cdH0sXG5cblxuXHRnZXRWaWV3U2l6ZSA6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZG9jID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuXHRcdHJldHVybiBbXG5cdFx0XHQod2luZG93LmlubmVyV2lkdGggfHwgZG9jLmNsaWVudFdpZHRoKSxcblx0XHRcdCh3aW5kb3cuaW5uZXJIZWlnaHQgfHwgZG9jLmNsaWVudEhlaWdodCksXG5cdFx0XTtcblx0fSxcblxuXG5cdHJlZHJhd1Bvc2l0aW9uIDogZnVuY3Rpb24gKCkge1xuXG5cdFx0aWYgKGpzYy5waWNrZXIgJiYganNjLnBpY2tlci5vd25lcikge1xuXHRcdFx0dmFyIHRoaXNPYmogPSBqc2MucGlja2VyLm93bmVyO1xuXG5cdFx0XHR2YXIgdHAsIHZwO1xuXG5cdFx0XHRpZiAodGhpc09iai5maXhlZCkge1xuXHRcdFx0XHQvLyBGaXhlZCBlbGVtZW50cyBhcmUgcG9zaXRpb25lZCByZWxhdGl2ZSB0byB2aWV3cG9ydCxcblx0XHRcdFx0Ly8gdGhlcmVmb3JlIHdlIGNhbiBpZ25vcmUgdGhlIHNjcm9sbCBvZmZzZXRcblx0XHRcdFx0dHAgPSBqc2MuZ2V0RWxlbWVudFBvcyh0aGlzT2JqLnRhcmdldEVsZW1lbnQsIHRydWUpOyAvLyB0YXJnZXQgcG9zXG5cdFx0XHRcdHZwID0gWzAsIDBdOyAvLyB2aWV3IHBvc1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dHAgPSBqc2MuZ2V0RWxlbWVudFBvcyh0aGlzT2JqLnRhcmdldEVsZW1lbnQpOyAvLyB0YXJnZXQgcG9zXG5cdFx0XHRcdHZwID0ganNjLmdldFZpZXdQb3MoKTsgLy8gdmlldyBwb3Ncblx0XHRcdH1cblxuXHRcdFx0dmFyIHRzID0ganNjLmdldEVsZW1lbnRTaXplKHRoaXNPYmoudGFyZ2V0RWxlbWVudCk7IC8vIHRhcmdldCBzaXplXG5cdFx0XHR2YXIgdnMgPSBqc2MuZ2V0Vmlld1NpemUoKTsgLy8gdmlldyBzaXplXG5cdFx0XHR2YXIgcHMgPSBqc2MuZ2V0UGlja2VyT3V0ZXJEaW1zKHRoaXNPYmopOyAvLyBwaWNrZXIgc2l6ZVxuXHRcdFx0dmFyIGEsIGIsIGM7XG5cdFx0XHRzd2l0Y2ggKHRoaXNPYmoucG9zaXRpb24udG9Mb3dlckNhc2UoKSkge1xuXHRcdFx0XHRjYXNlICdsZWZ0JzogYT0xOyBiPTA7IGM9LTE7IGJyZWFrO1xuXHRcdFx0XHRjYXNlICdyaWdodCc6YT0xOyBiPTA7IGM9MTsgYnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3RvcCc6ICBhPTA7IGI9MTsgYz0tMTsgYnJlYWs7XG5cdFx0XHRcdGRlZmF1bHQ6ICAgICBhPTA7IGI9MTsgYz0xOyBicmVhaztcblx0XHRcdH1cblx0XHRcdHZhciBsID0gKHRzW2JdK3BzW2JdKS8yO1xuXG5cdFx0XHQvLyBjb21wdXRlIHBpY2tlciBwb3NpdGlvblxuXHRcdFx0aWYgKCF0aGlzT2JqLnNtYXJ0UG9zaXRpb24pIHtcblx0XHRcdFx0dmFyIHBwID0gW1xuXHRcdFx0XHRcdHRwW2FdLFxuXHRcdFx0XHRcdHRwW2JdK3RzW2JdLWwrbCpjXG5cdFx0XHRcdF07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR2YXIgcHAgPSBbXG5cdFx0XHRcdFx0LXZwW2FdK3RwW2FdK3BzW2FdID4gdnNbYV0gP1xuXHRcdFx0XHRcdFx0KC12cFthXSt0cFthXSt0c1thXS8yID4gdnNbYV0vMiAmJiB0cFthXSt0c1thXS1wc1thXSA+PSAwID8gdHBbYV0rdHNbYV0tcHNbYV0gOiB0cFthXSkgOlxuXHRcdFx0XHRcdFx0dHBbYV0sXG5cdFx0XHRcdFx0LXZwW2JdK3RwW2JdK3RzW2JdK3BzW2JdLWwrbCpjID4gdnNbYl0gP1xuXHRcdFx0XHRcdFx0KC12cFtiXSt0cFtiXSt0c1tiXS8yID4gdnNbYl0vMiAmJiB0cFtiXSt0c1tiXS1sLWwqYyA+PSAwID8gdHBbYl0rdHNbYl0tbC1sKmMgOiB0cFtiXSt0c1tiXS1sK2wqYykgOlxuXHRcdFx0XHRcdFx0KHRwW2JdK3RzW2JdLWwrbCpjID49IDAgPyB0cFtiXSt0c1tiXS1sK2wqYyA6IHRwW2JdK3RzW2JdLWwtbCpjKVxuXHRcdFx0XHRdO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgeCA9IHBwW2FdO1xuXHRcdFx0dmFyIHkgPSBwcFtiXTtcblx0XHRcdHZhciBwb3NpdGlvblZhbHVlID0gdGhpc09iai5maXhlZCA/ICdmaXhlZCcgOiAnYWJzb2x1dGUnO1xuXHRcdFx0dmFyIGNvbnRyYWN0U2hhZG93ID1cblx0XHRcdFx0KHBwWzBdICsgcHNbMF0gPiB0cFswXSB8fCBwcFswXSA8IHRwWzBdICsgdHNbMF0pICYmXG5cdFx0XHRcdChwcFsxXSArIHBzWzFdIDwgdHBbMV0gKyB0c1sxXSk7XG5cblx0XHRcdGpzYy5fZHJhd1Bvc2l0aW9uKHRoaXNPYmosIHgsIHksIHBvc2l0aW9uVmFsdWUsIGNvbnRyYWN0U2hhZG93KTtcblx0XHR9XG5cdH0sXG5cblxuXHRfZHJhd1Bvc2l0aW9uIDogZnVuY3Rpb24gKHRoaXNPYmosIHgsIHksIHBvc2l0aW9uVmFsdWUsIGNvbnRyYWN0U2hhZG93KSB7XG5cdFx0dmFyIHZTaGFkb3cgPSBjb250cmFjdFNoYWRvdyA/IDAgOiB0aGlzT2JqLnNoYWRvd0JsdXI7IC8vIHB4XG5cblx0XHRqc2MucGlja2VyLndyYXAuc3R5bGUucG9zaXRpb24gPSBwb3NpdGlvblZhbHVlO1xuXHRcdGpzYy5waWNrZXIud3JhcC5zdHlsZS5sZWZ0ID0geCArICdweCc7XG5cdFx0anNjLnBpY2tlci53cmFwLnN0eWxlLnRvcCA9IHkgKyAncHgnO1xuXG5cdFx0anNjLnNldEJveFNoYWRvdyhcblx0XHRcdGpzYy5waWNrZXIuYm94Uyxcblx0XHRcdHRoaXNPYmouc2hhZG93ID9cblx0XHRcdFx0bmV3IGpzYy5Cb3hTaGFkb3coMCwgdlNoYWRvdywgdGhpc09iai5zaGFkb3dCbHVyLCAwLCB0aGlzT2JqLnNoYWRvd0NvbG9yKSA6XG5cdFx0XHRcdG51bGwpO1xuXHR9LFxuXG5cblx0Z2V0UGlja2VyRGltcyA6IGZ1bmN0aW9uICh0aGlzT2JqKSB7XG5cdFx0dmFyIGRpc3BsYXlTbGlkZXIgPSAhIWpzYy5nZXRTbGlkZXJDb21wb25lbnQodGhpc09iaik7XG5cdFx0dmFyIGRpbXMgPSBbXG5cdFx0XHQyICogdGhpc09iai5pbnNldFdpZHRoICsgMiAqIHRoaXNPYmoucGFkZGluZyArIHRoaXNPYmoud2lkdGggK1xuXHRcdFx0XHQoZGlzcGxheVNsaWRlciA/IDIgKiB0aGlzT2JqLmluc2V0V2lkdGggKyBqc2MuZ2V0UGFkVG9TbGlkZXJQYWRkaW5nKHRoaXNPYmopICsgdGhpc09iai5zbGlkZXJTaXplIDogMCksXG5cdFx0XHQyICogdGhpc09iai5pbnNldFdpZHRoICsgMiAqIHRoaXNPYmoucGFkZGluZyArIHRoaXNPYmouaGVpZ2h0ICtcblx0XHRcdFx0KHRoaXNPYmouY2xvc2FibGUgPyAyICogdGhpc09iai5pbnNldFdpZHRoICsgdGhpc09iai5wYWRkaW5nICsgdGhpc09iai5idXR0b25IZWlnaHQgOiAwKVxuXHRcdF07XG5cdFx0cmV0dXJuIGRpbXM7XG5cdH0sXG5cblxuXHRnZXRQaWNrZXJPdXRlckRpbXMgOiBmdW5jdGlvbiAodGhpc09iaikge1xuXHRcdHZhciBkaW1zID0ganNjLmdldFBpY2tlckRpbXModGhpc09iaik7XG5cdFx0cmV0dXJuIFtcblx0XHRcdGRpbXNbMF0gKyAyICogdGhpc09iai5ib3JkZXJXaWR0aCxcblx0XHRcdGRpbXNbMV0gKyAyICogdGhpc09iai5ib3JkZXJXaWR0aFxuXHRcdF07XG5cdH0sXG5cblxuXHRnZXRQYWRUb1NsaWRlclBhZGRpbmcgOiBmdW5jdGlvbiAodGhpc09iaikge1xuXHRcdHJldHVybiBNYXRoLm1heCh0aGlzT2JqLnBhZGRpbmcsIDEuNSAqICgyICogdGhpc09iai5wb2ludGVyQm9yZGVyV2lkdGggKyB0aGlzT2JqLnBvaW50ZXJUaGlja25lc3MpKTtcblx0fSxcblxuXG5cdGdldFBhZFlDb21wb25lbnQgOiBmdW5jdGlvbiAodGhpc09iaikge1xuXHRcdHN3aXRjaCAodGhpc09iai5tb2RlLmNoYXJBdCgxKS50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0XHRjYXNlICd2JzogcmV0dXJuICd2JzsgYnJlYWs7XG5cdFx0fVxuXHRcdHJldHVybiAncyc7XG5cdH0sXG5cblxuXHRnZXRTbGlkZXJDb21wb25lbnQgOiBmdW5jdGlvbiAodGhpc09iaikge1xuXHRcdGlmICh0aGlzT2JqLm1vZGUubGVuZ3RoID4gMikge1xuXHRcdFx0c3dpdGNoICh0aGlzT2JqLm1vZGUuY2hhckF0KDIpLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRcdFx0Y2FzZSAncyc6IHJldHVybiAncyc7IGJyZWFrO1xuXHRcdFx0XHRjYXNlICd2JzogcmV0dXJuICd2JzsgYnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBudWxsO1xuXHR9LFxuXG5cblx0b25Eb2N1bWVudE1vdXNlRG93biA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0aWYgKCFlKSB7IGUgPSB3aW5kb3cuZXZlbnQ7IH1cblx0XHR2YXIgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuXG5cdFx0aWYgKHRhcmdldC5fanNjTGlua2VkSW5zdGFuY2UpIHtcblx0XHRcdGlmICh0YXJnZXQuX2pzY0xpbmtlZEluc3RhbmNlLnNob3dPbkNsaWNrKSB7XG5cdFx0XHRcdHRhcmdldC5fanNjTGlua2VkSW5zdGFuY2Uuc2hvdygpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAodGFyZ2V0Ll9qc2NDb250cm9sTmFtZSkge1xuXHRcdFx0anNjLm9uQ29udHJvbFBvaW50ZXJTdGFydChlLCB0YXJnZXQsIHRhcmdldC5fanNjQ29udHJvbE5hbWUsICdtb3VzZScpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBNb3VzZSBpcyBvdXRzaWRlIHRoZSBwaWNrZXIgY29udHJvbHMgLT4gaGlkZSB0aGUgY29sb3IgcGlja2VyIVxuXHRcdFx0aWYgKGpzYy5waWNrZXIgJiYganNjLnBpY2tlci5vd25lcikge1xuXHRcdFx0XHRqc2MucGlja2VyLm93bmVyLmhpZGUoKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblxuXHRvbkRvY3VtZW50VG91Y2hTdGFydCA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0aWYgKCFlKSB7IGUgPSB3aW5kb3cuZXZlbnQ7IH1cblx0XHR2YXIgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuXG5cdFx0aWYgKHRhcmdldC5fanNjTGlua2VkSW5zdGFuY2UpIHtcblx0XHRcdGlmICh0YXJnZXQuX2pzY0xpbmtlZEluc3RhbmNlLnNob3dPbkNsaWNrKSB7XG5cdFx0XHRcdHRhcmdldC5fanNjTGlua2VkSW5zdGFuY2Uuc2hvdygpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAodGFyZ2V0Ll9qc2NDb250cm9sTmFtZSkge1xuXHRcdFx0anNjLm9uQ29udHJvbFBvaW50ZXJTdGFydChlLCB0YXJnZXQsIHRhcmdldC5fanNjQ29udHJvbE5hbWUsICd0b3VjaCcpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAoanNjLnBpY2tlciAmJiBqc2MucGlja2VyLm93bmVyKSB7XG5cdFx0XHRcdGpzYy5waWNrZXIub3duZXIuaGlkZSgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXG5cdG9uV2luZG93UmVzaXplIDogZnVuY3Rpb24gKGUpIHtcblx0XHRqc2MucmVkcmF3UG9zaXRpb24oKTtcblx0fSxcblxuXG5cdG9uUGFyZW50U2Nyb2xsIDogZnVuY3Rpb24gKGUpIHtcblx0XHQvLyBoaWRlIHRoZSBwaWNrZXIgd2hlbiBvbmUgb2YgdGhlIHBhcmVudCBlbGVtZW50cyBpcyBzY3JvbGxlZFxuXHRcdGlmIChqc2MucGlja2VyICYmIGpzYy5waWNrZXIub3duZXIpIHtcblx0XHRcdGpzYy5waWNrZXIub3duZXIuaGlkZSgpO1xuXHRcdH1cblx0fSxcblxuXG5cdF9wb2ludGVyTW92ZUV2ZW50IDoge1xuXHRcdG1vdXNlOiAnbW91c2Vtb3ZlJyxcblx0XHR0b3VjaDogJ3RvdWNobW92ZSdcblx0fSxcblx0X3BvaW50ZXJFbmRFdmVudCA6IHtcblx0XHRtb3VzZTogJ21vdXNldXAnLFxuXHRcdHRvdWNoOiAndG91Y2hlbmQnXG5cdH0sXG5cblxuXHRfcG9pbnRlck9yaWdpbiA6IG51bGwsXG5cdF9jYXB0dXJlZFRhcmdldCA6IG51bGwsXG5cblxuXHRvbkNvbnRyb2xQb2ludGVyU3RhcnQgOiBmdW5jdGlvbiAoZSwgdGFyZ2V0LCBjb250cm9sTmFtZSwgcG9pbnRlclR5cGUpIHtcblx0XHR2YXIgdGhpc09iaiA9IHRhcmdldC5fanNjSW5zdGFuY2U7XG5cblx0XHRqc2MucHJldmVudERlZmF1bHQoZSk7XG5cdFx0anNjLmNhcHR1cmVUYXJnZXQodGFyZ2V0KTtcblxuXHRcdHZhciByZWdpc3RlckRyYWdFdmVudHMgPSBmdW5jdGlvbiAoZG9jLCBvZmZzZXQpIHtcblx0XHRcdGpzYy5hdHRhY2hHcm91cEV2ZW50KCdkcmFnJywgZG9jLCBqc2MuX3BvaW50ZXJNb3ZlRXZlbnRbcG9pbnRlclR5cGVdLFxuXHRcdFx0XHRqc2Mub25Eb2N1bWVudFBvaW50ZXJNb3ZlKGUsIHRhcmdldCwgY29udHJvbE5hbWUsIHBvaW50ZXJUeXBlLCBvZmZzZXQpKTtcblx0XHRcdGpzYy5hdHRhY2hHcm91cEV2ZW50KCdkcmFnJywgZG9jLCBqc2MuX3BvaW50ZXJFbmRFdmVudFtwb2ludGVyVHlwZV0sXG5cdFx0XHRcdGpzYy5vbkRvY3VtZW50UG9pbnRlckVuZChlLCB0YXJnZXQsIGNvbnRyb2xOYW1lLCBwb2ludGVyVHlwZSkpO1xuXHRcdH07XG5cblx0XHRyZWdpc3RlckRyYWdFdmVudHMoZG9jdW1lbnQsIFswLCAwXSk7XG5cblx0XHRpZiAod2luZG93LnBhcmVudCAmJiB3aW5kb3cuZnJhbWVFbGVtZW50KSB7XG5cdFx0XHR2YXIgcmVjdCA9IHdpbmRvdy5mcmFtZUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdFx0XHR2YXIgb2ZzID0gWy1yZWN0LmxlZnQsIC1yZWN0LnRvcF07XG5cdFx0XHRyZWdpc3RlckRyYWdFdmVudHMod2luZG93LnBhcmVudC53aW5kb3cuZG9jdW1lbnQsIG9mcyk7XG5cdFx0fVxuXG5cdFx0dmFyIGFicyA9IGpzYy5nZXRBYnNQb2ludGVyUG9zKGUpO1xuXHRcdHZhciByZWwgPSBqc2MuZ2V0UmVsUG9pbnRlclBvcyhlKTtcblx0XHRqc2MuX3BvaW50ZXJPcmlnaW4gPSB7XG5cdFx0XHR4OiBhYnMueCAtIHJlbC54LFxuXHRcdFx0eTogYWJzLnkgLSByZWwueVxuXHRcdH07XG5cblx0XHRzd2l0Y2ggKGNvbnRyb2xOYW1lKSB7XG5cdFx0Y2FzZSAncGFkJzpcblx0XHRcdC8vIGlmIHRoZSBzbGlkZXIgaXMgYXQgdGhlIGJvdHRvbSwgbW92ZSBpdCB1cFxuXHRcdFx0c3dpdGNoIChqc2MuZ2V0U2xpZGVyQ29tcG9uZW50KHRoaXNPYmopKSB7XG5cdFx0XHRjYXNlICdzJzogaWYgKHRoaXNPYmouaHN2WzFdID09PSAwKSB7IHRoaXNPYmouZnJvbUhTVihudWxsLCAxMDAsIG51bGwpOyB9OyBicmVhaztcblx0XHRcdGNhc2UgJ3YnOiBpZiAodGhpc09iai5oc3ZbMl0gPT09IDApIHsgdGhpc09iai5mcm9tSFNWKG51bGwsIG51bGwsIDEwMCk7IH07IGJyZWFrO1xuXHRcdFx0fVxuXHRcdFx0anNjLnNldFBhZCh0aGlzT2JqLCBlLCAwLCAwKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSAnc2xkJzpcblx0XHRcdGpzYy5zZXRTbGQodGhpc09iaiwgZSwgMCk7XG5cdFx0XHRicmVhaztcblx0XHR9XG5cblx0XHRqc2MuZGlzcGF0Y2hGaW5lQ2hhbmdlKHRoaXNPYmopO1xuXHR9LFxuXG5cblx0b25Eb2N1bWVudFBvaW50ZXJNb3ZlIDogZnVuY3Rpb24gKGUsIHRhcmdldCwgY29udHJvbE5hbWUsIHBvaW50ZXJUeXBlLCBvZmZzZXQpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKGUpIHtcblx0XHRcdHZhciB0aGlzT2JqID0gdGFyZ2V0Ll9qc2NJbnN0YW5jZTtcblx0XHRcdHN3aXRjaCAoY29udHJvbE5hbWUpIHtcblx0XHRcdGNhc2UgJ3BhZCc6XG5cdFx0XHRcdGlmICghZSkgeyBlID0gd2luZG93LmV2ZW50OyB9XG5cdFx0XHRcdGpzYy5zZXRQYWQodGhpc09iaiwgZSwgb2Zmc2V0WzBdLCBvZmZzZXRbMV0pO1xuXHRcdFx0XHRqc2MuZGlzcGF0Y2hGaW5lQ2hhbmdlKHRoaXNPYmopO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSAnc2xkJzpcblx0XHRcdFx0aWYgKCFlKSB7IGUgPSB3aW5kb3cuZXZlbnQ7IH1cblx0XHRcdFx0anNjLnNldFNsZCh0aGlzT2JqLCBlLCBvZmZzZXRbMV0pO1xuXHRcdFx0XHRqc2MuZGlzcGF0Y2hGaW5lQ2hhbmdlKHRoaXNPYmopO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblxuXHRvbkRvY3VtZW50UG9pbnRlckVuZCA6IGZ1bmN0aW9uIChlLCB0YXJnZXQsIGNvbnRyb2xOYW1lLCBwb2ludGVyVHlwZSkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAoZSkge1xuXHRcdFx0dmFyIHRoaXNPYmogPSB0YXJnZXQuX2pzY0luc3RhbmNlO1xuXHRcdFx0anNjLmRldGFjaEdyb3VwRXZlbnRzKCdkcmFnJyk7XG5cdFx0XHRqc2MucmVsZWFzZVRhcmdldCgpO1xuXHRcdFx0Ly8gQWx3YXlzIGRpc3BhdGNoIGNoYW5nZXMgYWZ0ZXIgZGV0YWNoaW5nIG91dHN0YW5kaW5nIG1vdXNlIGhhbmRsZXJzLFxuXHRcdFx0Ly8gaW4gY2FzZSBzb21lIHVzZXIgaW50ZXJhY3Rpb24gd2lsbCBvY2N1ciBpbiB1c2VyJ3Mgb25jaGFuZ2UgY2FsbGJhY2tcblx0XHRcdC8vIHRoYXQgd291bGQgaW50cnVkZSB3aXRoIGN1cnJlbnQgbW91c2UgZXZlbnRzXG5cdFx0XHRqc2MuZGlzcGF0Y2hDaGFuZ2UodGhpc09iaik7XG5cdFx0fTtcblx0fSxcblxuXG5cdGRpc3BhdGNoQ2hhbmdlIDogZnVuY3Rpb24gKHRoaXNPYmopIHtcblx0XHRpZiAodGhpc09iai52YWx1ZUVsZW1lbnQpIHtcblx0XHRcdGlmIChqc2MuaXNFbGVtZW50VHlwZSh0aGlzT2JqLnZhbHVlRWxlbWVudCwgJ2lucHV0JykpIHtcblx0XHRcdFx0anNjLmZpcmVFdmVudCh0aGlzT2JqLnZhbHVlRWxlbWVudCwgJ2NoYW5nZScpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXG5cdGRpc3BhdGNoRmluZUNoYW5nZSA6IGZ1bmN0aW9uICh0aGlzT2JqKSB7XG5cdFx0aWYgKHRoaXNPYmoub25GaW5lQ2hhbmdlKSB7XG5cdFx0XHR2YXIgY2FsbGJhY2s7XG5cdFx0XHRpZiAodHlwZW9mIHRoaXNPYmoub25GaW5lQ2hhbmdlID09PSAnc3RyaW5nJykge1xuXHRcdFx0XHRjYWxsYmFjayA9IG5ldyBGdW5jdGlvbiAodGhpc09iai5vbkZpbmVDaGFuZ2UpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y2FsbGJhY2sgPSB0aGlzT2JqLm9uRmluZUNoYW5nZTtcblx0XHRcdH1cblx0XHRcdGNhbGxiYWNrLmNhbGwodGhpc09iaik7XG5cdFx0fVxuXHR9LFxuXG5cblx0c2V0UGFkIDogZnVuY3Rpb24gKHRoaXNPYmosIGUsIG9mc1gsIG9mc1kpIHtcblx0XHR2YXIgcG9pbnRlckFicyA9IGpzYy5nZXRBYnNQb2ludGVyUG9zKGUpO1xuXHRcdHZhciB4ID0gb2ZzWCArIHBvaW50ZXJBYnMueCAtIGpzYy5fcG9pbnRlck9yaWdpbi54IC0gdGhpc09iai5wYWRkaW5nIC0gdGhpc09iai5pbnNldFdpZHRoO1xuXHRcdHZhciB5ID0gb2ZzWSArIHBvaW50ZXJBYnMueSAtIGpzYy5fcG9pbnRlck9yaWdpbi55IC0gdGhpc09iai5wYWRkaW5nIC0gdGhpc09iai5pbnNldFdpZHRoO1xuXG5cdFx0dmFyIHhWYWwgPSB4ICogKDM2MCAvICh0aGlzT2JqLndpZHRoIC0gMSkpO1xuXHRcdHZhciB5VmFsID0gMTAwIC0gKHkgKiAoMTAwIC8gKHRoaXNPYmouaGVpZ2h0IC0gMSkpKTtcblxuXHRcdHN3aXRjaCAoanNjLmdldFBhZFlDb21wb25lbnQodGhpc09iaikpIHtcblx0XHRjYXNlICdzJzogdGhpc09iai5mcm9tSFNWKHhWYWwsIHlWYWwsIG51bGwsIGpzYy5sZWF2ZVNsZCk7IGJyZWFrO1xuXHRcdGNhc2UgJ3YnOiB0aGlzT2JqLmZyb21IU1YoeFZhbCwgbnVsbCwgeVZhbCwganNjLmxlYXZlU2xkKTsgYnJlYWs7XG5cdFx0fVxuXHR9LFxuXG5cblx0c2V0U2xkIDogZnVuY3Rpb24gKHRoaXNPYmosIGUsIG9mc1kpIHtcblx0XHR2YXIgcG9pbnRlckFicyA9IGpzYy5nZXRBYnNQb2ludGVyUG9zKGUpO1xuXHRcdHZhciB5ID0gb2ZzWSArIHBvaW50ZXJBYnMueSAtIGpzYy5fcG9pbnRlck9yaWdpbi55IC0gdGhpc09iai5wYWRkaW5nIC0gdGhpc09iai5pbnNldFdpZHRoO1xuXG5cdFx0dmFyIHlWYWwgPSAxMDAgLSAoeSAqICgxMDAgLyAodGhpc09iai5oZWlnaHQgLSAxKSkpO1xuXG5cdFx0c3dpdGNoIChqc2MuZ2V0U2xpZGVyQ29tcG9uZW50KHRoaXNPYmopKSB7XG5cdFx0Y2FzZSAncyc6IHRoaXNPYmouZnJvbUhTVihudWxsLCB5VmFsLCBudWxsLCBqc2MubGVhdmVQYWQpOyBicmVhaztcblx0XHRjYXNlICd2JzogdGhpc09iai5mcm9tSFNWKG51bGwsIG51bGwsIHlWYWwsIGpzYy5sZWF2ZVBhZCk7IGJyZWFrO1xuXHRcdH1cblx0fSxcblxuXG5cdF92bWxOUyA6ICdqc2Nfdm1sXycsXG5cdF92bWxDU1MgOiAnanNjX3ZtbF9jc3NfJyxcblx0X3ZtbFJlYWR5IDogZmFsc2UsXG5cblxuXHRpbml0Vk1MIDogZnVuY3Rpb24gKCkge1xuXHRcdGlmICghanNjLl92bWxSZWFkeSkge1xuXHRcdFx0Ly8gaW5pdCBWTUwgbmFtZXNwYWNlXG5cdFx0XHR2YXIgZG9jID0gZG9jdW1lbnQ7XG5cdFx0XHRpZiAoIWRvYy5uYW1lc3BhY2VzW2pzYy5fdm1sTlNdKSB7XG5cdFx0XHRcdGRvYy5uYW1lc3BhY2VzLmFkZChqc2MuX3ZtbE5TLCAndXJuOnNjaGVtYXMtbWljcm9zb2Z0LWNvbTp2bWwnKTtcblx0XHRcdH1cblx0XHRcdGlmICghZG9jLnN0eWxlU2hlZXRzW2pzYy5fdm1sQ1NTXSkge1xuXHRcdFx0XHR2YXIgdGFncyA9IFsnc2hhcGUnLCAnc2hhcGV0eXBlJywgJ2dyb3VwJywgJ2JhY2tncm91bmQnLCAncGF0aCcsICdmb3JtdWxhcycsICdoYW5kbGVzJywgJ2ZpbGwnLCAnc3Ryb2tlJywgJ3NoYWRvdycsICd0ZXh0Ym94JywgJ3RleHRwYXRoJywgJ2ltYWdlZGF0YScsICdsaW5lJywgJ3BvbHlsaW5lJywgJ2N1cnZlJywgJ3JlY3QnLCAncm91bmRyZWN0JywgJ292YWwnLCAnYXJjJywgJ2ltYWdlJ107XG5cdFx0XHRcdHZhciBzcyA9IGRvYy5jcmVhdGVTdHlsZVNoZWV0KCk7XG5cdFx0XHRcdHNzLm93bmluZ0VsZW1lbnQuaWQgPSBqc2MuX3ZtbENTUztcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0YWdzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdFx0c3MuYWRkUnVsZShqc2MuX3ZtbE5TICsgJ1xcXFw6JyArIHRhZ3NbaV0sICdiZWhhdmlvcjp1cmwoI2RlZmF1bHQjVk1MKTsnKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0anNjLl92bWxSZWFkeSA9IHRydWU7XG5cdFx0fVxuXHR9LFxuXG5cblx0Y3JlYXRlUGFsZXR0ZSA6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHZhciBwYWxldHRlT2JqID0ge1xuXHRcdFx0ZWxtOiBudWxsLFxuXHRcdFx0ZHJhdzogbnVsbFxuXHRcdH07XG5cblx0XHRpZiAoanNjLmlzQ2FudmFzU3VwcG9ydGVkKSB7XG5cdFx0XHQvLyBDYW52YXMgaW1wbGVtZW50YXRpb24gZm9yIG1vZGVybiBicm93c2Vyc1xuXG5cdFx0XHR2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdFx0XHR2YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cblx0XHRcdHZhciBkcmF3RnVuYyA9IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0LCB0eXBlKSB7XG5cdFx0XHRcdGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuXHRcdFx0XHRjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG5cdFx0XHRcdGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblxuXHRcdFx0XHR2YXIgaEdyYWQgPSBjdHguY3JlYXRlTGluZWFyR3JhZGllbnQoMCwgMCwgY2FudmFzLndpZHRoLCAwKTtcblx0XHRcdFx0aEdyYWQuYWRkQ29sb3JTdG9wKDAgLyA2LCAnI0YwMCcpO1xuXHRcdFx0XHRoR3JhZC5hZGRDb2xvclN0b3AoMSAvIDYsICcjRkYwJyk7XG5cdFx0XHRcdGhHcmFkLmFkZENvbG9yU3RvcCgyIC8gNiwgJyMwRjAnKTtcblx0XHRcdFx0aEdyYWQuYWRkQ29sb3JTdG9wKDMgLyA2LCAnIzBGRicpO1xuXHRcdFx0XHRoR3JhZC5hZGRDb2xvclN0b3AoNCAvIDYsICcjMDBGJyk7XG5cdFx0XHRcdGhHcmFkLmFkZENvbG9yU3RvcCg1IC8gNiwgJyNGMEYnKTtcblx0XHRcdFx0aEdyYWQuYWRkQ29sb3JTdG9wKDYgLyA2LCAnI0YwMCcpO1xuXG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSBoR3JhZDtcblx0XHRcdFx0Y3R4LmZpbGxSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cblx0XHRcdFx0dmFyIHZHcmFkID0gY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KDAsIDAsIDAsIGNhbnZhcy5oZWlnaHQpO1xuXHRcdFx0XHRzd2l0Y2ggKHR5cGUudG9Mb3dlckNhc2UoKSkge1xuXHRcdFx0XHRjYXNlICdzJzpcblx0XHRcdFx0XHR2R3JhZC5hZGRDb2xvclN0b3AoMCwgJ3JnYmEoMjU1LDI1NSwyNTUsMCknKTtcblx0XHRcdFx0XHR2R3JhZC5hZGRDb2xvclN0b3AoMSwgJ3JnYmEoMjU1LDI1NSwyNTUsMSknKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAndic6XG5cdFx0XHRcdFx0dkdyYWQuYWRkQ29sb3JTdG9wKDAsICdyZ2JhKDAsMCwwLDApJyk7XG5cdFx0XHRcdFx0dkdyYWQuYWRkQ29sb3JTdG9wKDEsICdyZ2JhKDAsMCwwLDEpJyk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9IHZHcmFkO1xuXHRcdFx0XHRjdHguZmlsbFJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblx0XHRcdH07XG5cblx0XHRcdHBhbGV0dGVPYmouZWxtID0gY2FudmFzO1xuXHRcdFx0cGFsZXR0ZU9iai5kcmF3ID0gZHJhd0Z1bmM7XG5cblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gVk1MIGZhbGxiYWNrIGZvciBJRSA3IGFuZCA4XG5cblx0XHRcdGpzYy5pbml0Vk1MKCk7XG5cblx0XHRcdHZhciB2bWxDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0XHRcdHZtbENvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG5cdFx0XHR2bWxDb250YWluZXIuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcblxuXHRcdFx0dmFyIGhHcmFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChqc2MuX3ZtbE5TICsgJzpmaWxsJyk7XG5cdFx0XHRoR3JhZC50eXBlID0gJ2dyYWRpZW50Jztcblx0XHRcdGhHcmFkLm1ldGhvZCA9ICdsaW5lYXInO1xuXHRcdFx0aEdyYWQuYW5nbGUgPSAnOTAnO1xuXHRcdFx0aEdyYWQuY29sb3JzID0gJzE2LjY3JSAjRjBGLCAzMy4zMyUgIzAwRiwgNTAlICMwRkYsIDY2LjY3JSAjMEYwLCA4My4zMyUgI0ZGMCdcblxuXHRcdFx0dmFyIGhSZWN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChqc2MuX3ZtbE5TICsgJzpyZWN0Jyk7XG5cdFx0XHRoUmVjdC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRoUmVjdC5zdHlsZS5sZWZ0ID0gLTEgKyAncHgnO1xuXHRcdFx0aFJlY3Quc3R5bGUudG9wID0gLTEgKyAncHgnO1xuXHRcdFx0aFJlY3Quc3Ryb2tlZCA9IGZhbHNlO1xuXHRcdFx0aFJlY3QuYXBwZW5kQ2hpbGQoaEdyYWQpO1xuXHRcdFx0dm1sQ29udGFpbmVyLmFwcGVuZENoaWxkKGhSZWN0KTtcblxuXHRcdFx0dmFyIHZHcmFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChqc2MuX3ZtbE5TICsgJzpmaWxsJyk7XG5cdFx0XHR2R3JhZC50eXBlID0gJ2dyYWRpZW50Jztcblx0XHRcdHZHcmFkLm1ldGhvZCA9ICdsaW5lYXInO1xuXHRcdFx0dkdyYWQuYW5nbGUgPSAnMTgwJztcblx0XHRcdHZHcmFkLm9wYWNpdHkgPSAnMCc7XG5cblx0XHRcdHZhciB2UmVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoanNjLl92bWxOUyArICc6cmVjdCcpO1xuXHRcdFx0dlJlY3Quc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0dlJlY3Quc3R5bGUubGVmdCA9IC0xICsgJ3B4Jztcblx0XHRcdHZSZWN0LnN0eWxlLnRvcCA9IC0xICsgJ3B4Jztcblx0XHRcdHZSZWN0LnN0cm9rZWQgPSBmYWxzZTtcblx0XHRcdHZSZWN0LmFwcGVuZENoaWxkKHZHcmFkKTtcblx0XHRcdHZtbENvbnRhaW5lci5hcHBlbmRDaGlsZCh2UmVjdCk7XG5cblx0XHRcdHZhciBkcmF3RnVuYyA9IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0LCB0eXBlKSB7XG5cdFx0XHRcdHZtbENvbnRhaW5lci5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4Jztcblx0XHRcdFx0dm1sQ29udGFpbmVyLnN0eWxlLmhlaWdodCA9IGhlaWdodCArICdweCc7XG5cblx0XHRcdFx0aFJlY3Quc3R5bGUud2lkdGggPVxuXHRcdFx0XHR2UmVjdC5zdHlsZS53aWR0aCA9XG5cdFx0XHRcdFx0KHdpZHRoICsgMSkgKyAncHgnO1xuXHRcdFx0XHRoUmVjdC5zdHlsZS5oZWlnaHQgPVxuXHRcdFx0XHR2UmVjdC5zdHlsZS5oZWlnaHQgPVxuXHRcdFx0XHRcdChoZWlnaHQgKyAxKSArICdweCc7XG5cblx0XHRcdFx0Ly8gQ29sb3JzIG11c3QgYmUgc3BlY2lmaWVkIGR1cmluZyBldmVyeSByZWRyYXcsIG90aGVyd2lzZSBJRSB3b24ndCBkaXNwbGF5XG5cdFx0XHRcdC8vIGEgZnVsbCBncmFkaWVudCBkdXJpbmcgYSBzdWJzZXF1ZW50aWFsIHJlZHJhd1xuXHRcdFx0XHRoR3JhZC5jb2xvciA9ICcjRjAwJztcblx0XHRcdFx0aEdyYWQuY29sb3IyID0gJyNGMDAnO1xuXG5cdFx0XHRcdHN3aXRjaCAodHlwZS50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0XHRcdGNhc2UgJ3MnOlxuXHRcdFx0XHRcdHZHcmFkLmNvbG9yID0gdkdyYWQuY29sb3IyID0gJyNGRkYnO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICd2Jzpcblx0XHRcdFx0XHR2R3JhZC5jb2xvciA9IHZHcmFkLmNvbG9yMiA9ICcjMDAwJztcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHRcdFxuXHRcdFx0cGFsZXR0ZU9iai5lbG0gPSB2bWxDb250YWluZXI7XG5cdFx0XHRwYWxldHRlT2JqLmRyYXcgPSBkcmF3RnVuYztcblx0XHR9XG5cblx0XHRyZXR1cm4gcGFsZXR0ZU9iajtcblx0fSxcblxuXG5cdGNyZWF0ZVNsaWRlckdyYWRpZW50IDogZnVuY3Rpb24gKCkge1xuXG5cdFx0dmFyIHNsaWRlck9iaiA9IHtcblx0XHRcdGVsbTogbnVsbCxcblx0XHRcdGRyYXc6IG51bGxcblx0XHR9O1xuXG5cdFx0aWYgKGpzYy5pc0NhbnZhc1N1cHBvcnRlZCkge1xuXHRcdFx0Ly8gQ2FudmFzIGltcGxlbWVudGF0aW9uIGZvciBtb2Rlcm4gYnJvd3NlcnNcblxuXHRcdFx0dmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRcdFx0dmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG5cdFx0XHR2YXIgZHJhd0Z1bmMgPSBmdW5jdGlvbiAod2lkdGgsIGhlaWdodCwgY29sb3IxLCBjb2xvcjIpIHtcblx0XHRcdFx0Y2FudmFzLndpZHRoID0gd2lkdGg7XG5cdFx0XHRcdGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG5cblx0XHRcdFx0Y3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXG5cdFx0XHRcdHZhciBncmFkID0gY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KDAsIDAsIDAsIGNhbnZhcy5oZWlnaHQpO1xuXHRcdFx0XHRncmFkLmFkZENvbG9yU3RvcCgwLCBjb2xvcjEpO1xuXHRcdFx0XHRncmFkLmFkZENvbG9yU3RvcCgxLCBjb2xvcjIpO1xuXG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSBncmFkO1xuXHRcdFx0XHRjdHguZmlsbFJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblx0XHRcdH07XG5cblx0XHRcdHNsaWRlck9iai5lbG0gPSBjYW52YXM7XG5cdFx0XHRzbGlkZXJPYmouZHJhdyA9IGRyYXdGdW5jO1xuXG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIFZNTCBmYWxsYmFjayBmb3IgSUUgNyBhbmQgOFxuXG5cdFx0XHRqc2MuaW5pdFZNTCgpO1xuXG5cdFx0XHR2YXIgdm1sQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0XHR2bWxDb250YWluZXIuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuXHRcdFx0dm1sQ29udGFpbmVyLnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG5cblx0XHRcdHZhciBncmFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChqc2MuX3ZtbE5TICsgJzpmaWxsJyk7XG5cdFx0XHRncmFkLnR5cGUgPSAnZ3JhZGllbnQnO1xuXHRcdFx0Z3JhZC5tZXRob2QgPSAnbGluZWFyJztcblx0XHRcdGdyYWQuYW5nbGUgPSAnMTgwJztcblxuXHRcdFx0dmFyIHJlY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGpzYy5fdm1sTlMgKyAnOnJlY3QnKTtcblx0XHRcdHJlY3Quc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cmVjdC5zdHlsZS5sZWZ0ID0gLTEgKyAncHgnO1xuXHRcdFx0cmVjdC5zdHlsZS50b3AgPSAtMSArICdweCc7XG5cdFx0XHRyZWN0LnN0cm9rZWQgPSBmYWxzZTtcblx0XHRcdHJlY3QuYXBwZW5kQ2hpbGQoZ3JhZCk7XG5cdFx0XHR2bWxDb250YWluZXIuYXBwZW5kQ2hpbGQocmVjdCk7XG5cblx0XHRcdHZhciBkcmF3RnVuYyA9IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0LCBjb2xvcjEsIGNvbG9yMikge1xuXHRcdFx0XHR2bWxDb250YWluZXIuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG5cdFx0XHRcdHZtbENvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xuXG5cdFx0XHRcdHJlY3Quc3R5bGUud2lkdGggPSAod2lkdGggKyAxKSArICdweCc7XG5cdFx0XHRcdHJlY3Quc3R5bGUuaGVpZ2h0ID0gKGhlaWdodCArIDEpICsgJ3B4JztcblxuXHRcdFx0XHRncmFkLmNvbG9yID0gY29sb3IxO1xuXHRcdFx0XHRncmFkLmNvbG9yMiA9IGNvbG9yMjtcblx0XHRcdH07XG5cdFx0XHRcblx0XHRcdHNsaWRlck9iai5lbG0gPSB2bWxDb250YWluZXI7XG5cdFx0XHRzbGlkZXJPYmouZHJhdyA9IGRyYXdGdW5jO1xuXHRcdH1cblxuXHRcdHJldHVybiBzbGlkZXJPYmo7XG5cdH0sXG5cblxuXHRsZWF2ZVZhbHVlIDogMTw8MCxcblx0bGVhdmVTdHlsZSA6IDE8PDEsXG5cdGxlYXZlUGFkIDogMTw8Mixcblx0bGVhdmVTbGQgOiAxPDwzLFxuXG5cblx0Qm94U2hhZG93IDogKGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgQm94U2hhZG93ID0gZnVuY3Rpb24gKGhTaGFkb3csIHZTaGFkb3csIGJsdXIsIHNwcmVhZCwgY29sb3IsIGluc2V0KSB7XG5cdFx0XHR0aGlzLmhTaGFkb3cgPSBoU2hhZG93O1xuXHRcdFx0dGhpcy52U2hhZG93ID0gdlNoYWRvdztcblx0XHRcdHRoaXMuYmx1ciA9IGJsdXI7XG5cdFx0XHR0aGlzLnNwcmVhZCA9IHNwcmVhZDtcblx0XHRcdHRoaXMuY29sb3IgPSBjb2xvcjtcblx0XHRcdHRoaXMuaW5zZXQgPSAhIWluc2V0O1xuXHRcdH07XG5cblx0XHRCb3hTaGFkb3cucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHZhbHMgPSBbXG5cdFx0XHRcdE1hdGgucm91bmQodGhpcy5oU2hhZG93KSArICdweCcsXG5cdFx0XHRcdE1hdGgucm91bmQodGhpcy52U2hhZG93KSArICdweCcsXG5cdFx0XHRcdE1hdGgucm91bmQodGhpcy5ibHVyKSArICdweCcsXG5cdFx0XHRcdE1hdGgucm91bmQodGhpcy5zcHJlYWQpICsgJ3B4Jyxcblx0XHRcdFx0dGhpcy5jb2xvclxuXHRcdFx0XTtcblx0XHRcdGlmICh0aGlzLmluc2V0KSB7XG5cdFx0XHRcdHZhbHMucHVzaCgnaW5zZXQnKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiB2YWxzLmpvaW4oJyAnKTtcblx0XHR9O1xuXG5cdFx0cmV0dXJuIEJveFNoYWRvdztcblx0fSkoKSxcblxuXG5cdC8vXG5cdC8vIFVzYWdlOlxuXHQvLyB2YXIgbXlDb2xvciA9IG5ldyBqc2NvbG9yKDx0YXJnZXRFbGVtZW50PiBbLCA8b3B0aW9ucz5dKVxuXHQvL1xuXG5cdGpzY29sb3IgOiBmdW5jdGlvbiAodGFyZ2V0RWxlbWVudCwgb3B0aW9ucykge1xuXG5cdFx0Ly8gR2VuZXJhbCBvcHRpb25zXG5cdFx0Ly9cblx0XHR0aGlzLnZhbHVlID0gbnVsbDsgLy8gaW5pdGlhbCBIRVggY29sb3IuIFRvIGNoYW5nZSBpdCBsYXRlciwgdXNlIG1ldGhvZHMgZnJvbVN0cmluZygpLCBmcm9tSFNWKCkgYW5kIGZyb21SR0IoKVxuXHRcdHRoaXMudmFsdWVFbGVtZW50ID0gdGFyZ2V0RWxlbWVudDsgLy8gZWxlbWVudCB0aGF0IHdpbGwgYmUgdXNlZCB0byBkaXNwbGF5IGFuZCBpbnB1dCB0aGUgY29sb3IgY29kZVxuXHRcdHRoaXMuc3R5bGVFbGVtZW50ID0gdGFyZ2V0RWxlbWVudDsgLy8gZWxlbWVudCB0aGF0IHdpbGwgcHJldmlldyB0aGUgcGlja2VkIGNvbG9yIHVzaW5nIENTUyBiYWNrZ3JvdW5kQ29sb3Jcblx0XHR0aGlzLnJlcXVpcmVkID0gdHJ1ZTsgLy8gd2hldGhlciB0aGUgYXNzb2NpYXRlZCB0ZXh0IDxpbnB1dD4gY2FuIGJlIGxlZnQgZW1wdHlcblx0XHR0aGlzLnJlZmluZSA9IHRydWU7IC8vIHdoZXRoZXIgdG8gcmVmaW5lIHRoZSBlbnRlcmVkIGNvbG9yIGNvZGUgKGUuZy4gdXBwZXJjYXNlIGl0IGFuZCByZW1vdmUgd2hpdGVzcGFjZSlcblx0XHR0aGlzLmhhc2ggPSBmYWxzZTsgLy8gd2hldGhlciB0byBwcmVmaXggdGhlIEhFWCBjb2xvciBjb2RlIHdpdGggIyBzeW1ib2xcblx0XHR0aGlzLnVwcGVyY2FzZSA9IHRydWU7IC8vIHdoZXRoZXIgdG8gdXBwZXJjYXNlIHRoZSBjb2xvciBjb2RlXG5cdFx0dGhpcy5vbkZpbmVDaGFuZ2UgPSBudWxsOyAvLyBjYWxsZWQgaW5zdGFudGx5IGV2ZXJ5IHRpbWUgdGhlIGNvbG9yIGNoYW5nZXMgKHZhbHVlIGNhbiBiZSBlaXRoZXIgYSBmdW5jdGlvbiBvciBhIHN0cmluZyB3aXRoIGphdmFzY3JpcHQgY29kZSlcblx0XHR0aGlzLmFjdGl2ZUNsYXNzID0gJ2pzY29sb3ItYWN0aXZlJzsgLy8gY2xhc3MgdG8gYmUgc2V0IHRvIHRoZSB0YXJnZXQgZWxlbWVudCB3aGVuIGEgcGlja2VyIHdpbmRvdyBpcyBvcGVuIG9uIGl0XG5cdFx0dGhpcy5taW5TID0gMDsgLy8gbWluIGFsbG93ZWQgc2F0dXJhdGlvbiAoMCAtIDEwMClcblx0XHR0aGlzLm1heFMgPSAxMDA7IC8vIG1heCBhbGxvd2VkIHNhdHVyYXRpb24gKDAgLSAxMDApXG5cdFx0dGhpcy5taW5WID0gMDsgLy8gbWluIGFsbG93ZWQgdmFsdWUgKGJyaWdodG5lc3MpICgwIC0gMTAwKVxuXHRcdHRoaXMubWF4ViA9IDEwMDsgLy8gbWF4IGFsbG93ZWQgdmFsdWUgKGJyaWdodG5lc3MpICgwIC0gMTAwKVxuXG5cdFx0Ly8gQWNjZXNzaW5nIHRoZSBwaWNrZWQgY29sb3Jcblx0XHQvL1xuXHRcdHRoaXMuaHN2ID0gWzAsIDAsIDEwMF07IC8vIHJlYWQtb25seSAgWzAtMzYwLCAwLTEwMCwgMC0xMDBdXG5cdFx0dGhpcy5yZ2IgPSBbMjU1LCAyNTUsIDI1NV07IC8vIHJlYWQtb25seSAgWzAtMjU1LCAwLTI1NSwgMC0yNTVdXG5cblx0XHQvLyBDb2xvciBQaWNrZXIgb3B0aW9uc1xuXHRcdC8vXG5cdFx0dGhpcy53aWR0aCA9IDE4MTsgLy8gd2lkdGggb2YgY29sb3IgcGFsZXR0ZSAoaW4gcHgpXG5cdFx0dGhpcy5oZWlnaHQgPSAxMDE7IC8vIGhlaWdodCBvZiBjb2xvciBwYWxldHRlIChpbiBweClcblx0XHR0aGlzLnNob3dPbkNsaWNrID0gdHJ1ZTsgLy8gd2hldGhlciB0byBkaXNwbGF5IHRoZSBjb2xvciBwaWNrZXIgd2hlbiB1c2VyIGNsaWNrcyBvbiBpdHMgdGFyZ2V0IGVsZW1lbnRcblx0XHR0aGlzLm1vZGUgPSAnSFNWJzsgLy8gSFNWIHwgSFZTIHwgSFMgfCBIViAtIGxheW91dCBvZiB0aGUgY29sb3IgcGlja2VyIGNvbnRyb2xzXG5cdFx0dGhpcy5wb3NpdGlvbiA9ICdib3R0b20nOyAvLyBsZWZ0IHwgcmlnaHQgfCB0b3AgfCBib3R0b20gLSBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgdGFyZ2V0IGVsZW1lbnRcblx0XHR0aGlzLnNtYXJ0UG9zaXRpb24gPSB0cnVlOyAvLyBhdXRvbWF0aWNhbGx5IGNoYW5nZSBwaWNrZXIgcG9zaXRpb24gd2hlbiB0aGVyZSBpcyBub3QgZW5vdWdoIHNwYWNlIGZvciBpdFxuXHRcdHRoaXMuc2xpZGVyU2l6ZSA9IDE2OyAvLyBweFxuXHRcdHRoaXMuY3Jvc3NTaXplID0gODsgLy8gcHhcblx0XHR0aGlzLmNsb3NhYmxlID0gZmFsc2U7IC8vIHdoZXRoZXIgdG8gZGlzcGxheSB0aGUgQ2xvc2UgYnV0dG9uXG5cdFx0dGhpcy5jbG9zZVRleHQgPSAnQ2xvc2UnO1xuXHRcdHRoaXMuYnV0dG9uQ29sb3IgPSAnIzAwMDAwMCc7IC8vIENTUyBjb2xvclxuXHRcdHRoaXMuYnV0dG9uSGVpZ2h0ID0gMTg7IC8vIHB4XG5cdFx0dGhpcy5wYWRkaW5nID0gMTI7IC8vIHB4XG5cdFx0dGhpcy5iYWNrZ3JvdW5kQ29sb3IgPSAnI0ZGRkZGRic7IC8vIENTUyBjb2xvclxuXHRcdHRoaXMuYm9yZGVyV2lkdGggPSAxOyAvLyBweFxuXHRcdHRoaXMuYm9yZGVyQ29sb3IgPSAnI0JCQkJCQic7IC8vIENTUyBjb2xvclxuXHRcdHRoaXMuYm9yZGVyUmFkaXVzID0gODsgLy8gcHhcblx0XHR0aGlzLmluc2V0V2lkdGggPSAxOyAvLyBweFxuXHRcdHRoaXMuaW5zZXRDb2xvciA9ICcjQkJCQkJCJzsgLy8gQ1NTIGNvbG9yXG5cdFx0dGhpcy5zaGFkb3cgPSB0cnVlOyAvLyB3aGV0aGVyIHRvIGRpc3BsYXkgc2hhZG93XG5cdFx0dGhpcy5zaGFkb3dCbHVyID0gMTU7IC8vIHB4XG5cdFx0dGhpcy5zaGFkb3dDb2xvciA9ICdyZ2JhKDAsMCwwLDAuMiknOyAvLyBDU1MgY29sb3Jcblx0XHR0aGlzLnBvaW50ZXJDb2xvciA9ICcjNEM0QzRDJzsgLy8gcHhcblx0XHR0aGlzLnBvaW50ZXJCb3JkZXJDb2xvciA9ICcjRkZGRkZGJzsgLy8gcHhcbiAgICAgICAgdGhpcy5wb2ludGVyQm9yZGVyV2lkdGggPSAxOyAvLyBweFxuICAgICAgICB0aGlzLnBvaW50ZXJUaGlja25lc3MgPSAyOyAvLyBweFxuXHRcdHRoaXMuekluZGV4ID0gMTAwMDtcblx0XHR0aGlzLmNvbnRhaW5lciA9IG51bGw7IC8vIHdoZXJlIHRvIGFwcGVuZCB0aGUgY29sb3IgcGlja2VyIChCT0RZIGVsZW1lbnQgYnkgZGVmYXVsdClcblxuXG5cdFx0Zm9yICh2YXIgb3B0IGluIG9wdGlvbnMpIHtcblx0XHRcdGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KG9wdCkpIHtcblx0XHRcdFx0dGhpc1tvcHRdID0gb3B0aW9uc1tvcHRdO1xuXHRcdFx0fVxuXHRcdH1cblxuXG5cdFx0dGhpcy5oaWRlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKGlzUGlja2VyT3duZXIoKSkge1xuXHRcdFx0XHRkZXRhY2hQaWNrZXIoKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cblx0XHR0aGlzLnNob3cgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRkcmF3UGlja2VyKCk7XG5cdFx0fTtcblxuXG5cdFx0dGhpcy5yZWRyYXcgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoaXNQaWNrZXJPd25lcigpKSB7XG5cdFx0XHRcdGRyYXdQaWNrZXIoKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cblx0XHR0aGlzLmltcG9ydENvbG9yID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKCF0aGlzLnZhbHVlRWxlbWVudCkge1xuXHRcdFx0XHR0aGlzLmV4cG9ydENvbG9yKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoanNjLmlzRWxlbWVudFR5cGUodGhpcy52YWx1ZUVsZW1lbnQsICdpbnB1dCcpKSB7XG5cdFx0XHRcdFx0aWYgKCF0aGlzLnJlZmluZSkge1xuXHRcdFx0XHRcdFx0aWYgKCF0aGlzLmZyb21TdHJpbmcodGhpcy52YWx1ZUVsZW1lbnQudmFsdWUsIGpzYy5sZWF2ZVZhbHVlKSkge1xuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5zdHlsZUVsZW1lbnQpIHtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLnN0eWxlRWxlbWVudC5fanNjT3JpZ1N0eWxlLmJhY2tncm91bmRJbWFnZTtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLnN0eWxlRWxlbWVudC5fanNjT3JpZ1N0eWxlLmJhY2tncm91bmRDb2xvcjtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5jb2xvciA9IHRoaXMuc3R5bGVFbGVtZW50Ll9qc2NPcmlnU3R5bGUuY29sb3I7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0dGhpcy5leHBvcnRDb2xvcihqc2MubGVhdmVWYWx1ZSB8IGpzYy5sZWF2ZVN0eWxlKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGVsc2UgaWYgKCF0aGlzLnJlcXVpcmVkICYmIC9eXFxzKiQvLnRlc3QodGhpcy52YWx1ZUVsZW1lbnQudmFsdWUpKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnZhbHVlRWxlbWVudC52YWx1ZSA9ICcnO1xuXHRcdFx0XHRcdFx0aWYgKHRoaXMuc3R5bGVFbGVtZW50KSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IHRoaXMuc3R5bGVFbGVtZW50Ll9qc2NPcmlnU3R5bGUuYmFja2dyb3VuZEltYWdlO1xuXHRcdFx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLnN0eWxlRWxlbWVudC5fanNjT3JpZ1N0eWxlLmJhY2tncm91bmRDb2xvcjtcblx0XHRcdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuY29sb3IgPSB0aGlzLnN0eWxlRWxlbWVudC5fanNjT3JpZ1N0eWxlLmNvbG9yO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0dGhpcy5leHBvcnRDb2xvcihqc2MubGVhdmVWYWx1ZSB8IGpzYy5sZWF2ZVN0eWxlKTtcblxuXHRcdFx0XHRcdH0gZWxzZSBpZiAodGhpcy5mcm9tU3RyaW5nKHRoaXMudmFsdWVFbGVtZW50LnZhbHVlKSkge1xuXHRcdFx0XHRcdFx0Ly8gbWFuYWdlZCB0byBpbXBvcnQgY29sb3Igc3VjY2Vzc2Z1bGx5IGZyb20gdGhlIHZhbHVlIC0+IE9LLCBkb24ndCBkbyBhbnl0aGluZ1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR0aGlzLmV4cG9ydENvbG9yKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIG5vdCBhbiBpbnB1dCBlbGVtZW50IC0+IGRvZXNuJ3QgaGF2ZSBhbnkgdmFsdWVcblx0XHRcdFx0XHR0aGlzLmV4cG9ydENvbG9yKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cblx0XHR0aGlzLmV4cG9ydENvbG9yID0gZnVuY3Rpb24gKGZsYWdzKSB7XG5cdFx0XHRpZiAoIShmbGFncyAmIGpzYy5sZWF2ZVZhbHVlKSAmJiB0aGlzLnZhbHVlRWxlbWVudCkge1xuXHRcdFx0XHR2YXIgdmFsdWUgPSB0aGlzLnRvU3RyaW5nKCk7XG5cdFx0XHRcdGlmICh0aGlzLnVwcGVyY2FzZSkgeyB2YWx1ZSA9IHZhbHVlLnRvVXBwZXJDYXNlKCk7IH1cblx0XHRcdFx0aWYgKHRoaXMuaGFzaCkgeyB2YWx1ZSA9ICcjJyArIHZhbHVlOyB9XG5cblx0XHRcdFx0aWYgKGpzYy5pc0VsZW1lbnRUeXBlKHRoaXMudmFsdWVFbGVtZW50LCAnaW5wdXQnKSkge1xuXHRcdFx0XHRcdHRoaXMudmFsdWVFbGVtZW50LnZhbHVlID0gdmFsdWU7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy52YWx1ZUVsZW1lbnQuaW5uZXJIVE1MID0gdmFsdWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmICghKGZsYWdzICYganNjLmxlYXZlU3R5bGUpKSB7XG5cdFx0XHRcdGlmICh0aGlzLnN0eWxlRWxlbWVudCkge1xuXHRcdFx0XHRcdHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9ICdub25lJztcblx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnIycgKyB0aGlzLnRvU3RyaW5nKCk7XG5cdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuY29sb3IgPSB0aGlzLmlzTGlnaHQoKSA/ICcjMDAwJyA6ICcjRkZGJztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKCEoZmxhZ3MgJiBqc2MubGVhdmVQYWQpICYmIGlzUGlja2VyT3duZXIoKSkge1xuXHRcdFx0XHRyZWRyYXdQYWQoKTtcblx0XHRcdH1cblx0XHRcdGlmICghKGZsYWdzICYganNjLmxlYXZlU2xkKSAmJiBpc1BpY2tlck93bmVyKCkpIHtcblx0XHRcdFx0cmVkcmF3U2xkKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXG5cdFx0Ly8gaDogMC0zNjBcblx0XHQvLyBzOiAwLTEwMFxuXHRcdC8vIHY6IDAtMTAwXG5cdFx0Ly9cblx0XHR0aGlzLmZyb21IU1YgPSBmdW5jdGlvbiAoaCwgcywgdiwgZmxhZ3MpIHsgLy8gbnVsbCA9IGRvbid0IGNoYW5nZVxuXHRcdFx0aWYgKGggIT09IG51bGwpIHtcblx0XHRcdFx0aWYgKGlzTmFOKGgpKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0XHRoID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMzYwLCBoKSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAocyAhPT0gbnVsbCkge1xuXHRcdFx0XHRpZiAoaXNOYU4ocykpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRcdHMgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxMDAsIHRoaXMubWF4UywgcyksIHRoaXMubWluUyk7XG5cdFx0XHR9XG5cdFx0XHRpZiAodiAhPT0gbnVsbCkge1xuXHRcdFx0XHRpZiAoaXNOYU4odikpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRcdHYgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxMDAsIHRoaXMubWF4ViwgdiksIHRoaXMubWluVik7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMucmdiID0gSFNWX1JHQihcblx0XHRcdFx0aD09PW51bGwgPyB0aGlzLmhzdlswXSA6ICh0aGlzLmhzdlswXT1oKSxcblx0XHRcdFx0cz09PW51bGwgPyB0aGlzLmhzdlsxXSA6ICh0aGlzLmhzdlsxXT1zKSxcblx0XHRcdFx0dj09PW51bGwgPyB0aGlzLmhzdlsyXSA6ICh0aGlzLmhzdlsyXT12KVxuXHRcdFx0KTtcblxuXHRcdFx0dGhpcy5leHBvcnRDb2xvcihmbGFncyk7XG5cdFx0fTtcblxuXG5cdFx0Ly8gcjogMC0yNTVcblx0XHQvLyBnOiAwLTI1NVxuXHRcdC8vIGI6IDAtMjU1XG5cdFx0Ly9cblx0XHR0aGlzLmZyb21SR0IgPSBmdW5jdGlvbiAociwgZywgYiwgZmxhZ3MpIHsgLy8gbnVsbCA9IGRvbid0IGNoYW5nZVxuXHRcdFx0aWYgKHIgIT09IG51bGwpIHtcblx0XHRcdFx0aWYgKGlzTmFOKHIpKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0XHRyID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMjU1LCByKSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoZyAhPT0gbnVsbCkge1xuXHRcdFx0XHRpZiAoaXNOYU4oZykpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRcdGcgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigyNTUsIGcpKTtcblx0XHRcdH1cblx0XHRcdGlmIChiICE9PSBudWxsKSB7XG5cdFx0XHRcdGlmIChpc05hTihiKSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdFx0YiA9IE1hdGgubWF4KDAsIE1hdGgubWluKDI1NSwgYikpO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgaHN2ID0gUkdCX0hTVihcblx0XHRcdFx0cj09PW51bGwgPyB0aGlzLnJnYlswXSA6IHIsXG5cdFx0XHRcdGc9PT1udWxsID8gdGhpcy5yZ2JbMV0gOiBnLFxuXHRcdFx0XHRiPT09bnVsbCA/IHRoaXMucmdiWzJdIDogYlxuXHRcdFx0KTtcblx0XHRcdGlmIChoc3ZbMF0gIT09IG51bGwpIHtcblx0XHRcdFx0dGhpcy5oc3ZbMF0gPSBNYXRoLm1heCgwLCBNYXRoLm1pbigzNjAsIGhzdlswXSkpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGhzdlsyXSAhPT0gMCkge1xuXHRcdFx0XHR0aGlzLmhzdlsxXSA9IGhzdlsxXT09PW51bGwgPyBudWxsIDogTWF0aC5tYXgoMCwgdGhpcy5taW5TLCBNYXRoLm1pbigxMDAsIHRoaXMubWF4UywgaHN2WzFdKSk7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLmhzdlsyXSA9IGhzdlsyXT09PW51bGwgPyBudWxsIDogTWF0aC5tYXgoMCwgdGhpcy5taW5WLCBNYXRoLm1pbigxMDAsIHRoaXMubWF4ViwgaHN2WzJdKSk7XG5cblx0XHRcdC8vIHVwZGF0ZSBSR0IgYWNjb3JkaW5nIHRvIGZpbmFsIEhTViwgYXMgc29tZSB2YWx1ZXMgbWlnaHQgYmUgdHJpbW1lZFxuXHRcdFx0dmFyIHJnYiA9IEhTVl9SR0IodGhpcy5oc3ZbMF0sIHRoaXMuaHN2WzFdLCB0aGlzLmhzdlsyXSk7XG5cdFx0XHR0aGlzLnJnYlswXSA9IHJnYlswXTtcblx0XHRcdHRoaXMucmdiWzFdID0gcmdiWzFdO1xuXHRcdFx0dGhpcy5yZ2JbMl0gPSByZ2JbMl07XG5cblx0XHRcdHRoaXMuZXhwb3J0Q29sb3IoZmxhZ3MpO1xuXHRcdH07XG5cblxuXHRcdHRoaXMuZnJvbVN0cmluZyA9IGZ1bmN0aW9uIChzdHIsIGZsYWdzKSB7XG5cdFx0XHR2YXIgbTtcblx0XHRcdGlmIChtID0gc3RyLm1hdGNoKC9eXFxXKihbMC05QS1GXXszfShbMC05QS1GXXszfSk/KVxcVyokL2kpKSB7XG5cdFx0XHRcdC8vIEhFWCBub3RhdGlvblxuXHRcdFx0XHQvL1xuXG5cdFx0XHRcdGlmIChtWzFdLmxlbmd0aCA9PT0gNikge1xuXHRcdFx0XHRcdC8vIDYtY2hhciBub3RhdGlvblxuXHRcdFx0XHRcdHRoaXMuZnJvbVJHQihcblx0XHRcdFx0XHRcdHBhcnNlSW50KG1bMV0uc3Vic3RyKDAsMiksMTYpLFxuXHRcdFx0XHRcdFx0cGFyc2VJbnQobVsxXS5zdWJzdHIoMiwyKSwxNiksXG5cdFx0XHRcdFx0XHRwYXJzZUludChtWzFdLnN1YnN0cig0LDIpLDE2KSxcblx0XHRcdFx0XHRcdGZsYWdzXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyAzLWNoYXIgbm90YXRpb25cblx0XHRcdFx0XHR0aGlzLmZyb21SR0IoXG5cdFx0XHRcdFx0XHRwYXJzZUludChtWzFdLmNoYXJBdCgwKSArIG1bMV0uY2hhckF0KDApLDE2KSxcblx0XHRcdFx0XHRcdHBhcnNlSW50KG1bMV0uY2hhckF0KDEpICsgbVsxXS5jaGFyQXQoMSksMTYpLFxuXHRcdFx0XHRcdFx0cGFyc2VJbnQobVsxXS5jaGFyQXQoMikgKyBtWzFdLmNoYXJBdCgyKSwxNiksXG5cdFx0XHRcdFx0XHRmbGFnc1xuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cblx0XHRcdH0gZWxzZSBpZiAobSA9IHN0ci5tYXRjaCgvXlxcVypyZ2JhP1xcKChbXildKilcXClcXFcqJC9pKSkge1xuXHRcdFx0XHR2YXIgcGFyYW1zID0gbVsxXS5zcGxpdCgnLCcpO1xuXHRcdFx0XHR2YXIgcmUgPSAvXlxccyooXFxkKikoXFwuXFxkKyk/XFxzKiQvO1xuXHRcdFx0XHR2YXIgbVIsIG1HLCBtQjtcblx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdHBhcmFtcy5sZW5ndGggPj0gMyAmJlxuXHRcdFx0XHRcdChtUiA9IHBhcmFtc1swXS5tYXRjaChyZSkpICYmXG5cdFx0XHRcdFx0KG1HID0gcGFyYW1zWzFdLm1hdGNoKHJlKSkgJiZcblx0XHRcdFx0XHQobUIgPSBwYXJhbXNbMl0ubWF0Y2gocmUpKVxuXHRcdFx0XHQpIHtcblx0XHRcdFx0XHR2YXIgciA9IHBhcnNlRmxvYXQoKG1SWzFdIHx8ICcwJykgKyAobVJbMl0gfHwgJycpKTtcblx0XHRcdFx0XHR2YXIgZyA9IHBhcnNlRmxvYXQoKG1HWzFdIHx8ICcwJykgKyAobUdbMl0gfHwgJycpKTtcblx0XHRcdFx0XHR2YXIgYiA9IHBhcnNlRmxvYXQoKG1CWzFdIHx8ICcwJykgKyAobUJbMl0gfHwgJycpKTtcblx0XHRcdFx0XHR0aGlzLmZyb21SR0IociwgZywgYiwgZmxhZ3MpO1xuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fTtcblxuXG5cdFx0dGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiAoXG5cdFx0XHRcdCgweDEwMCB8IE1hdGgucm91bmQodGhpcy5yZ2JbMF0pKS50b1N0cmluZygxNikuc3Vic3RyKDEpICtcblx0XHRcdFx0KDB4MTAwIHwgTWF0aC5yb3VuZCh0aGlzLnJnYlsxXSkpLnRvU3RyaW5nKDE2KS5zdWJzdHIoMSkgK1xuXHRcdFx0XHQoMHgxMDAgfCBNYXRoLnJvdW5kKHRoaXMucmdiWzJdKSkudG9TdHJpbmcoMTYpLnN1YnN0cigxKVxuXHRcdFx0KTtcblx0XHR9O1xuXG5cblx0XHR0aGlzLnRvSEVYU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuICcjJyArIHRoaXMudG9TdHJpbmcoKS50b1VwcGVyQ2FzZSgpO1xuXHRcdH07XG5cblxuXHRcdHRoaXMudG9SR0JTdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gKCdyZ2IoJyArXG5cdFx0XHRcdE1hdGgucm91bmQodGhpcy5yZ2JbMF0pICsgJywnICtcblx0XHRcdFx0TWF0aC5yb3VuZCh0aGlzLnJnYlsxXSkgKyAnLCcgK1xuXHRcdFx0XHRNYXRoLnJvdW5kKHRoaXMucmdiWzJdKSArICcpJ1xuXHRcdFx0KTtcblx0XHR9O1xuXG5cblx0XHR0aGlzLmlzTGlnaHQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHQwLjIxMyAqIHRoaXMucmdiWzBdICtcblx0XHRcdFx0MC43MTUgKiB0aGlzLnJnYlsxXSArXG5cdFx0XHRcdDAuMDcyICogdGhpcy5yZ2JbMl0gPlxuXHRcdFx0XHQyNTUgLyAyXG5cdFx0XHQpO1xuXHRcdH07XG5cblxuXHRcdHRoaXMuX3Byb2Nlc3NQYXJlbnRFbGVtZW50c0luRE9NID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKHRoaXMuX2xpbmtlZEVsZW1lbnRzUHJvY2Vzc2VkKSB7IHJldHVybjsgfVxuXHRcdFx0dGhpcy5fbGlua2VkRWxlbWVudHNQcm9jZXNzZWQgPSB0cnVlO1xuXG5cdFx0XHR2YXIgZWxtID0gdGhpcy50YXJnZXRFbGVtZW50O1xuXHRcdFx0ZG8ge1xuXHRcdFx0XHQvLyBJZiB0aGUgdGFyZ2V0IGVsZW1lbnQgb3Igb25lIG9mIGl0cyBwYXJlbnQgbm9kZXMgaGFzIGZpeGVkIHBvc2l0aW9uLFxuXHRcdFx0XHQvLyB0aGVuIHVzZSBmaXhlZCBwb3NpdGlvbmluZyBpbnN0ZWFkXG5cdFx0XHRcdC8vXG5cdFx0XHRcdC8vIE5vdGU6IEluIEZpcmVmb3gsIGdldENvbXB1dGVkU3R5bGUgcmV0dXJucyBudWxsIGluIGEgaGlkZGVuIGlmcmFtZSxcblx0XHRcdFx0Ly8gdGhhdCdzIHdoeSB3ZSBuZWVkIHRvIGNoZWNrIGlmIHRoZSByZXR1cm5lZCBzdHlsZSBvYmplY3QgaXMgbm9uLWVtcHR5XG5cdFx0XHRcdHZhciBjdXJyU3R5bGUgPSBqc2MuZ2V0U3R5bGUoZWxtKTtcblx0XHRcdFx0aWYgKGN1cnJTdHlsZSAmJiBjdXJyU3R5bGUucG9zaXRpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2ZpeGVkJykge1xuXHRcdFx0XHRcdHRoaXMuZml4ZWQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGVsbSAhPT0gdGhpcy50YXJnZXRFbGVtZW50KSB7XG5cdFx0XHRcdFx0Ly8gRW5zdXJlIHRvIGF0dGFjaCBvblBhcmVudFNjcm9sbCBvbmx5IG9uY2UgdG8gZWFjaCBwYXJlbnQgZWxlbWVudFxuXHRcdFx0XHRcdC8vIChtdWx0aXBsZSB0YXJnZXRFbGVtZW50cyBjYW4gc2hhcmUgdGhlIHNhbWUgcGFyZW50IG5vZGVzKVxuXHRcdFx0XHRcdC8vXG5cdFx0XHRcdFx0Ly8gTm90ZTogSXQncyBub3QganVzdCBvZmZzZXRQYXJlbnRzIHRoYXQgY2FuIGJlIHNjcm9sbGFibGUsXG5cdFx0XHRcdFx0Ly8gdGhhdCdzIHdoeSB3ZSBsb29wIHRocm91Z2ggYWxsIHBhcmVudCBub2Rlc1xuXHRcdFx0XHRcdGlmICghZWxtLl9qc2NFdmVudHNBdHRhY2hlZCkge1xuXHRcdFx0XHRcdFx0anNjLmF0dGFjaEV2ZW50KGVsbSwgJ3Njcm9sbCcsIGpzYy5vblBhcmVudFNjcm9sbCk7XG5cdFx0XHRcdFx0XHRlbG0uX2pzY0V2ZW50c0F0dGFjaGVkID0gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gd2hpbGUgKChlbG0gPSBlbG0ucGFyZW50Tm9kZSkgJiYgIWpzYy5pc0VsZW1lbnRUeXBlKGVsbSwgJ2JvZHknKSk7XG5cdFx0fTtcblxuXG5cdFx0Ly8gcjogMC0yNTVcblx0XHQvLyBnOiAwLTI1NVxuXHRcdC8vIGI6IDAtMjU1XG5cdFx0Ly9cblx0XHQvLyByZXR1cm5zOiBbIDAtMzYwLCAwLTEwMCwgMC0xMDAgXVxuXHRcdC8vXG5cdFx0ZnVuY3Rpb24gUkdCX0hTViAociwgZywgYikge1xuXHRcdFx0ciAvPSAyNTU7XG5cdFx0XHRnIC89IDI1NTtcblx0XHRcdGIgLz0gMjU1O1xuXHRcdFx0dmFyIG4gPSBNYXRoLm1pbihNYXRoLm1pbihyLGcpLGIpO1xuXHRcdFx0dmFyIHYgPSBNYXRoLm1heChNYXRoLm1heChyLGcpLGIpO1xuXHRcdFx0dmFyIG0gPSB2IC0gbjtcblx0XHRcdGlmIChtID09PSAwKSB7IHJldHVybiBbIG51bGwsIDAsIDEwMCAqIHYgXTsgfVxuXHRcdFx0dmFyIGggPSByPT09biA/IDMrKGItZykvbSA6IChnPT09biA/IDUrKHItYikvbSA6IDErKGctcikvbSk7XG5cdFx0XHRyZXR1cm4gW1xuXHRcdFx0XHQ2MCAqIChoPT09Nj8wOmgpLFxuXHRcdFx0XHQxMDAgKiAobS92KSxcblx0XHRcdFx0MTAwICogdlxuXHRcdFx0XTtcblx0XHR9XG5cblxuXHRcdC8vIGg6IDAtMzYwXG5cdFx0Ly8gczogMC0xMDBcblx0XHQvLyB2OiAwLTEwMFxuXHRcdC8vXG5cdFx0Ly8gcmV0dXJuczogWyAwLTI1NSwgMC0yNTUsIDAtMjU1IF1cblx0XHQvL1xuXHRcdGZ1bmN0aW9uIEhTVl9SR0IgKGgsIHMsIHYpIHtcblx0XHRcdHZhciB1ID0gMjU1ICogKHYgLyAxMDApO1xuXG5cdFx0XHRpZiAoaCA9PT0gbnVsbCkge1xuXHRcdFx0XHRyZXR1cm4gWyB1LCB1LCB1IF07XG5cdFx0XHR9XG5cblx0XHRcdGggLz0gNjA7XG5cdFx0XHRzIC89IDEwMDtcblxuXHRcdFx0dmFyIGkgPSBNYXRoLmZsb29yKGgpO1xuXHRcdFx0dmFyIGYgPSBpJTIgPyBoLWkgOiAxLShoLWkpO1xuXHRcdFx0dmFyIG0gPSB1ICogKDEgLSBzKTtcblx0XHRcdHZhciBuID0gdSAqICgxIC0gcyAqIGYpO1xuXHRcdFx0c3dpdGNoIChpKSB7XG5cdFx0XHRcdGNhc2UgNjpcblx0XHRcdFx0Y2FzZSAwOiByZXR1cm4gW3UsbixtXTtcblx0XHRcdFx0Y2FzZSAxOiByZXR1cm4gW24sdSxtXTtcblx0XHRcdFx0Y2FzZSAyOiByZXR1cm4gW20sdSxuXTtcblx0XHRcdFx0Y2FzZSAzOiByZXR1cm4gW20sbix1XTtcblx0XHRcdFx0Y2FzZSA0OiByZXR1cm4gW24sbSx1XTtcblx0XHRcdFx0Y2FzZSA1OiByZXR1cm4gW3UsbSxuXTtcblx0XHRcdH1cblx0XHR9XG5cblxuXHRcdGZ1bmN0aW9uIGRldGFjaFBpY2tlciAoKSB7XG5cdFx0XHRqc2MudW5zZXRDbGFzcyhUSElTLnRhcmdldEVsZW1lbnQsIFRISVMuYWN0aXZlQ2xhc3MpO1xuXHRcdFx0anNjLnBpY2tlci53cmFwLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoanNjLnBpY2tlci53cmFwKTtcblx0XHRcdGRlbGV0ZSBqc2MucGlja2VyLm93bmVyO1xuXHRcdH1cblxuXG5cdFx0ZnVuY3Rpb24gZHJhd1BpY2tlciAoKSB7XG5cblx0XHRcdC8vIEF0IHRoaXMgcG9pbnQsIHdoZW4gZHJhd2luZyB0aGUgcGlja2VyLCB3ZSBrbm93IHdoYXQgdGhlIHBhcmVudCBlbGVtZW50cyBhcmVcblx0XHRcdC8vIGFuZCB3ZSBjYW4gZG8gYWxsIHJlbGF0ZWQgRE9NIG9wZXJhdGlvbnMsIHN1Y2ggYXMgcmVnaXN0ZXJpbmcgZXZlbnRzIG9uIHRoZW1cblx0XHRcdC8vIG9yIGNoZWNraW5nIHRoZWlyIHBvc2l0aW9uaW5nXG5cdFx0XHRUSElTLl9wcm9jZXNzUGFyZW50RWxlbWVudHNJbkRPTSgpO1xuXG5cdFx0XHRpZiAoIWpzYy5waWNrZXIpIHtcblx0XHRcdFx0anNjLnBpY2tlciA9IHtcblx0XHRcdFx0XHRvd25lcjogbnVsbCxcblx0XHRcdFx0XHR3cmFwIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0XHRcdFx0Ym94IDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0XHRcdFx0Ym94UyA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBzaGFkb3cgYXJlYVxuXHRcdFx0XHRcdGJveEIgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gYm9yZGVyXG5cdFx0XHRcdFx0cGFkIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0XHRcdFx0cGFkQiA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBib3JkZXJcblx0XHRcdFx0XHRwYWRNIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIG1vdXNlL3RvdWNoIGFyZWFcblx0XHRcdFx0XHRwYWRQYWwgOiBqc2MuY3JlYXRlUGFsZXR0ZSgpLFxuXHRcdFx0XHRcdGNyb3NzIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0XHRcdFx0Y3Jvc3NCWSA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBib3JkZXIgWVxuXHRcdFx0XHRcdGNyb3NzQlggOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gYm9yZGVyIFhcblx0XHRcdFx0XHRjcm9zc0xZIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIGxpbmUgWVxuXHRcdFx0XHRcdGNyb3NzTFggOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gbGluZSBYXG5cdFx0XHRcdFx0c2xkIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0XHRcdFx0c2xkQiA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBib3JkZXJcblx0XHRcdFx0XHRzbGRNIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIG1vdXNlL3RvdWNoIGFyZWFcblx0XHRcdFx0XHRzbGRHcmFkIDoganNjLmNyZWF0ZVNsaWRlckdyYWRpZW50KCksXG5cdFx0XHRcdFx0c2xkUHRyUyA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBzbGlkZXIgcG9pbnRlciBzcGFjZXJcblx0XHRcdFx0XHRzbGRQdHJJQiA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBzbGlkZXIgcG9pbnRlciBpbm5lciBib3JkZXJcblx0XHRcdFx0XHRzbGRQdHJNQiA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBzbGlkZXIgcG9pbnRlciBtaWRkbGUgYm9yZGVyXG5cdFx0XHRcdFx0c2xkUHRyT0IgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gc2xpZGVyIHBvaW50ZXIgb3V0ZXIgYm9yZGVyXG5cdFx0XHRcdFx0YnRuIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0XHRcdFx0YnRuVCA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKSAvLyB0ZXh0XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0anNjLnBpY2tlci5wYWQuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5wYWRQYWwuZWxtKTtcblx0XHRcdFx0anNjLnBpY2tlci5wYWRCLmFwcGVuZENoaWxkKGpzYy5waWNrZXIucGFkKTtcblx0XHRcdFx0anNjLnBpY2tlci5jcm9zcy5hcHBlbmRDaGlsZChqc2MucGlja2VyLmNyb3NzQlkpO1xuXHRcdFx0XHRqc2MucGlja2VyLmNyb3NzLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuY3Jvc3NCWCk7XG5cdFx0XHRcdGpzYy5waWNrZXIuY3Jvc3MuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5jcm9zc0xZKTtcblx0XHRcdFx0anNjLnBpY2tlci5jcm9zcy5hcHBlbmRDaGlsZChqc2MucGlja2VyLmNyb3NzTFgpO1xuXHRcdFx0XHRqc2MucGlja2VyLnBhZEIuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5jcm9zcyk7XG5cdFx0XHRcdGpzYy5waWNrZXIuYm94LmFwcGVuZENoaWxkKGpzYy5waWNrZXIucGFkQik7XG5cdFx0XHRcdGpzYy5waWNrZXIuYm94LmFwcGVuZENoaWxkKGpzYy5waWNrZXIucGFkTSk7XG5cblx0XHRcdFx0anNjLnBpY2tlci5zbGQuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5zbGRHcmFkLmVsbSk7XG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkQi5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZCk7XG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkQi5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZFB0ck9CKTtcblx0XHRcdFx0anNjLnBpY2tlci5zbGRQdHJPQi5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZFB0ck1CKTtcblx0XHRcdFx0anNjLnBpY2tlci5zbGRQdHJNQi5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZFB0cklCKTtcblx0XHRcdFx0anNjLnBpY2tlci5zbGRQdHJJQi5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZFB0clMpO1xuXHRcdFx0XHRqc2MucGlja2VyLmJveC5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZEIpO1xuXHRcdFx0XHRqc2MucGlja2VyLmJveC5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZE0pO1xuXG5cdFx0XHRcdGpzYy5waWNrZXIuYnRuLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuYnRuVCk7XG5cdFx0XHRcdGpzYy5waWNrZXIuYm94LmFwcGVuZENoaWxkKGpzYy5waWNrZXIuYnRuKTtcblxuXHRcdFx0XHRqc2MucGlja2VyLmJveEIuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5ib3gpO1xuXHRcdFx0XHRqc2MucGlja2VyLndyYXAuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5ib3hTKTtcblx0XHRcdFx0anNjLnBpY2tlci53cmFwLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuYm94Qik7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBwID0ganNjLnBpY2tlcjtcblxuXHRcdFx0dmFyIGRpc3BsYXlTbGlkZXIgPSAhIWpzYy5nZXRTbGlkZXJDb21wb25lbnQoVEhJUyk7XG5cdFx0XHR2YXIgZGltcyA9IGpzYy5nZXRQaWNrZXJEaW1zKFRISVMpO1xuXHRcdFx0dmFyIGNyb3NzT3V0ZXJTaXplID0gKDIgKiBUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCArIFRISVMucG9pbnRlclRoaWNrbmVzcyArIDIgKiBUSElTLmNyb3NzU2l6ZSk7XG5cdFx0XHR2YXIgcGFkVG9TbGlkZXJQYWRkaW5nID0ganNjLmdldFBhZFRvU2xpZGVyUGFkZGluZyhUSElTKTtcblx0XHRcdHZhciBib3JkZXJSYWRpdXMgPSBNYXRoLm1pbihcblx0XHRcdFx0VEhJUy5ib3JkZXJSYWRpdXMsXG5cdFx0XHRcdE1hdGgucm91bmQoVEhJUy5wYWRkaW5nICogTWF0aC5QSSkpOyAvLyBweFxuXHRcdFx0dmFyIHBhZEN1cnNvciA9ICdjcm9zc2hhaXInO1xuXG5cdFx0XHQvLyB3cmFwXG5cdFx0XHRwLndyYXAuc3R5bGUuY2xlYXIgPSAnYm90aCc7XG5cdFx0XHRwLndyYXAuc3R5bGUud2lkdGggPSAoZGltc1swXSArIDIgKiBUSElTLmJvcmRlcldpZHRoKSArICdweCc7XG5cdFx0XHRwLndyYXAuc3R5bGUuaGVpZ2h0ID0gKGRpbXNbMV0gKyAyICogVEhJUy5ib3JkZXJXaWR0aCkgKyAncHgnO1xuXHRcdFx0cC53cmFwLnN0eWxlLnpJbmRleCA9IFRISVMuekluZGV4O1xuXG5cdFx0XHQvLyBwaWNrZXJcblx0XHRcdHAuYm94LnN0eWxlLndpZHRoID0gZGltc1swXSArICdweCc7XG5cdFx0XHRwLmJveC5zdHlsZS5oZWlnaHQgPSBkaW1zWzFdICsgJ3B4JztcblxuXHRcdFx0cC5ib3hTLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHAuYm94Uy5zdHlsZS5sZWZ0ID0gJzAnO1xuXHRcdFx0cC5ib3hTLnN0eWxlLnRvcCA9ICcwJztcblx0XHRcdHAuYm94Uy5zdHlsZS53aWR0aCA9ICcxMDAlJztcblx0XHRcdHAuYm94Uy5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XG5cdFx0XHRqc2Muc2V0Qm9yZGVyUmFkaXVzKHAuYm94UywgYm9yZGVyUmFkaXVzICsgJ3B4Jyk7XG5cblx0XHRcdC8vIHBpY2tlciBib3JkZXJcblx0XHRcdHAuYm94Qi5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG5cdFx0XHRwLmJveEIuc3R5bGUuYm9yZGVyID0gVEhJUy5ib3JkZXJXaWR0aCArICdweCBzb2xpZCc7XG5cdFx0XHRwLmJveEIuc3R5bGUuYm9yZGVyQ29sb3IgPSBUSElTLmJvcmRlckNvbG9yO1xuXHRcdFx0cC5ib3hCLnN0eWxlLmJhY2tncm91bmQgPSBUSElTLmJhY2tncm91bmRDb2xvcjtcblx0XHRcdGpzYy5zZXRCb3JkZXJSYWRpdXMocC5ib3hCLCBib3JkZXJSYWRpdXMgKyAncHgnKTtcblxuXHRcdFx0Ly8gSUUgaGFjazpcblx0XHRcdC8vIElmIHRoZSBlbGVtZW50IGlzIHRyYW5zcGFyZW50LCBJRSB3aWxsIHRyaWdnZXIgdGhlIGV2ZW50IG9uIHRoZSBlbGVtZW50cyB1bmRlciBpdCxcblx0XHRcdC8vIGUuZy4gb24gQ2FudmFzIG9yIG9uIGVsZW1lbnRzIHdpdGggYm9yZGVyXG5cdFx0XHRwLnBhZE0uc3R5bGUuYmFja2dyb3VuZCA9XG5cdFx0XHRwLnNsZE0uc3R5bGUuYmFja2dyb3VuZCA9XG5cdFx0XHRcdCcjRkZGJztcblx0XHRcdGpzYy5zZXRTdHlsZShwLnBhZE0sICdvcGFjaXR5JywgJzAnKTtcblx0XHRcdGpzYy5zZXRTdHlsZShwLnNsZE0sICdvcGFjaXR5JywgJzAnKTtcblxuXHRcdFx0Ly8gcGFkXG5cdFx0XHRwLnBhZC5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG5cdFx0XHRwLnBhZC5zdHlsZS53aWR0aCA9IFRISVMud2lkdGggKyAncHgnO1xuXHRcdFx0cC5wYWQuc3R5bGUuaGVpZ2h0ID0gVEhJUy5oZWlnaHQgKyAncHgnO1xuXG5cdFx0XHQvLyBwYWQgcGFsZXR0ZXMgKEhTViBhbmQgSFZTKVxuXHRcdFx0cC5wYWRQYWwuZHJhdyhUSElTLndpZHRoLCBUSElTLmhlaWdodCwganNjLmdldFBhZFlDb21wb25lbnQoVEhJUykpO1xuXG5cdFx0XHQvLyBwYWQgYm9yZGVyXG5cdFx0XHRwLnBhZEIuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cC5wYWRCLnN0eWxlLmxlZnQgPSBUSElTLnBhZGRpbmcgKyAncHgnO1xuXHRcdFx0cC5wYWRCLnN0eWxlLnRvcCA9IFRISVMucGFkZGluZyArICdweCc7XG5cdFx0XHRwLnBhZEIuc3R5bGUuYm9yZGVyID0gVEhJUy5pbnNldFdpZHRoICsgJ3B4IHNvbGlkJztcblx0XHRcdHAucGFkQi5zdHlsZS5ib3JkZXJDb2xvciA9IFRISVMuaW5zZXRDb2xvcjtcblxuXHRcdFx0Ly8gcGFkIG1vdXNlIGFyZWFcblx0XHRcdHAucGFkTS5fanNjSW5zdGFuY2UgPSBUSElTO1xuXHRcdFx0cC5wYWRNLl9qc2NDb250cm9sTmFtZSA9ICdwYWQnO1xuXHRcdFx0cC5wYWRNLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHAucGFkTS5zdHlsZS5sZWZ0ID0gJzAnO1xuXHRcdFx0cC5wYWRNLnN0eWxlLnRvcCA9ICcwJztcblx0XHRcdHAucGFkTS5zdHlsZS53aWR0aCA9IChUSElTLnBhZGRpbmcgKyAyICogVEhJUy5pbnNldFdpZHRoICsgVEhJUy53aWR0aCArIHBhZFRvU2xpZGVyUGFkZGluZyAvIDIpICsgJ3B4Jztcblx0XHRcdHAucGFkTS5zdHlsZS5oZWlnaHQgPSBkaW1zWzFdICsgJ3B4Jztcblx0XHRcdHAucGFkTS5zdHlsZS5jdXJzb3IgPSBwYWRDdXJzb3I7XG5cblx0XHRcdC8vIHBhZCBjcm9zc1xuXHRcdFx0cC5jcm9zcy5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLmNyb3NzLnN0eWxlLmxlZnQgPVxuXHRcdFx0cC5jcm9zcy5zdHlsZS50b3AgPVxuXHRcdFx0XHQnMCc7XG5cdFx0XHRwLmNyb3NzLnN0eWxlLndpZHRoID1cblx0XHRcdHAuY3Jvc3Muc3R5bGUuaGVpZ2h0ID1cblx0XHRcdFx0Y3Jvc3NPdXRlclNpemUgKyAncHgnO1xuXG5cdFx0XHQvLyBwYWQgY3Jvc3MgYm9yZGVyIFkgYW5kIFhcblx0XHRcdHAuY3Jvc3NCWS5zdHlsZS5wb3NpdGlvbiA9XG5cdFx0XHRwLmNyb3NzQlguc3R5bGUucG9zaXRpb24gPVxuXHRcdFx0XHQnYWJzb2x1dGUnO1xuXHRcdFx0cC5jcm9zc0JZLnN0eWxlLmJhY2tncm91bmQgPVxuXHRcdFx0cC5jcm9zc0JYLnN0eWxlLmJhY2tncm91bmQgPVxuXHRcdFx0XHRUSElTLnBvaW50ZXJCb3JkZXJDb2xvcjtcblx0XHRcdHAuY3Jvc3NCWS5zdHlsZS53aWR0aCA9XG5cdFx0XHRwLmNyb3NzQlguc3R5bGUuaGVpZ2h0ID1cblx0XHRcdFx0KDIgKiBUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCArIFRISVMucG9pbnRlclRoaWNrbmVzcykgKyAncHgnO1xuXHRcdFx0cC5jcm9zc0JZLnN0eWxlLmhlaWdodCA9XG5cdFx0XHRwLmNyb3NzQlguc3R5bGUud2lkdGggPVxuXHRcdFx0XHRjcm9zc091dGVyU2l6ZSArICdweCc7XG5cdFx0XHRwLmNyb3NzQlkuc3R5bGUubGVmdCA9XG5cdFx0XHRwLmNyb3NzQlguc3R5bGUudG9wID1cblx0XHRcdFx0KE1hdGguZmxvb3IoY3Jvc3NPdXRlclNpemUgLyAyKSAtIE1hdGguZmxvb3IoVEhJUy5wb2ludGVyVGhpY2tuZXNzIC8gMikgLSBUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCkgKyAncHgnO1xuXHRcdFx0cC5jcm9zc0JZLnN0eWxlLnRvcCA9XG5cdFx0XHRwLmNyb3NzQlguc3R5bGUubGVmdCA9XG5cdFx0XHRcdCcwJztcblxuXHRcdFx0Ly8gcGFkIGNyb3NzIGxpbmUgWSBhbmQgWFxuXHRcdFx0cC5jcm9zc0xZLnN0eWxlLnBvc2l0aW9uID1cblx0XHRcdHAuY3Jvc3NMWC5zdHlsZS5wb3NpdGlvbiA9XG5cdFx0XHRcdCdhYnNvbHV0ZSc7XG5cdFx0XHRwLmNyb3NzTFkuc3R5bGUuYmFja2dyb3VuZCA9XG5cdFx0XHRwLmNyb3NzTFguc3R5bGUuYmFja2dyb3VuZCA9XG5cdFx0XHRcdFRISVMucG9pbnRlckNvbG9yO1xuXHRcdFx0cC5jcm9zc0xZLnN0eWxlLmhlaWdodCA9XG5cdFx0XHRwLmNyb3NzTFguc3R5bGUud2lkdGggPVxuXHRcdFx0XHQoY3Jvc3NPdXRlclNpemUgLSAyICogVEhJUy5wb2ludGVyQm9yZGVyV2lkdGgpICsgJ3B4Jztcblx0XHRcdHAuY3Jvc3NMWS5zdHlsZS53aWR0aCA9XG5cdFx0XHRwLmNyb3NzTFguc3R5bGUuaGVpZ2h0ID1cblx0XHRcdFx0VEhJUy5wb2ludGVyVGhpY2tuZXNzICsgJ3B4Jztcblx0XHRcdHAuY3Jvc3NMWS5zdHlsZS5sZWZ0ID1cblx0XHRcdHAuY3Jvc3NMWC5zdHlsZS50b3AgPVxuXHRcdFx0XHQoTWF0aC5mbG9vcihjcm9zc091dGVyU2l6ZSAvIDIpIC0gTWF0aC5mbG9vcihUSElTLnBvaW50ZXJUaGlja25lc3MgLyAyKSkgKyAncHgnO1xuXHRcdFx0cC5jcm9zc0xZLnN0eWxlLnRvcCA9XG5cdFx0XHRwLmNyb3NzTFguc3R5bGUubGVmdCA9XG5cdFx0XHRcdFRISVMucG9pbnRlckJvcmRlcldpZHRoICsgJ3B4JztcblxuXHRcdFx0Ly8gc2xpZGVyXG5cdFx0XHRwLnNsZC5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuXHRcdFx0cC5zbGQuc3R5bGUud2lkdGggPSBUSElTLnNsaWRlclNpemUgKyAncHgnO1xuXHRcdFx0cC5zbGQuc3R5bGUuaGVpZ2h0ID0gVEhJUy5oZWlnaHQgKyAncHgnO1xuXG5cdFx0XHQvLyBzbGlkZXIgZ3JhZGllbnRcblx0XHRcdHAuc2xkR3JhZC5kcmF3KFRISVMuc2xpZGVyU2l6ZSwgVEhJUy5oZWlnaHQsICcjMDAwJywgJyMwMDAnKTtcblxuXHRcdFx0Ly8gc2xpZGVyIGJvcmRlclxuXHRcdFx0cC5zbGRCLnN0eWxlLmRpc3BsYXkgPSBkaXNwbGF5U2xpZGVyID8gJ2Jsb2NrJyA6ICdub25lJztcblx0XHRcdHAuc2xkQi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLnNsZEIuc3R5bGUucmlnaHQgPSBUSElTLnBhZGRpbmcgKyAncHgnO1xuXHRcdFx0cC5zbGRCLnN0eWxlLnRvcCA9IFRISVMucGFkZGluZyArICdweCc7XG5cdFx0XHRwLnNsZEIuc3R5bGUuYm9yZGVyID0gVEhJUy5pbnNldFdpZHRoICsgJ3B4IHNvbGlkJztcblx0XHRcdHAuc2xkQi5zdHlsZS5ib3JkZXJDb2xvciA9IFRISVMuaW5zZXRDb2xvcjtcblxuXHRcdFx0Ly8gc2xpZGVyIG1vdXNlIGFyZWFcblx0XHRcdHAuc2xkTS5fanNjSW5zdGFuY2UgPSBUSElTO1xuXHRcdFx0cC5zbGRNLl9qc2NDb250cm9sTmFtZSA9ICdzbGQnO1xuXHRcdFx0cC5zbGRNLnN0eWxlLmRpc3BsYXkgPSBkaXNwbGF5U2xpZGVyID8gJ2Jsb2NrJyA6ICdub25lJztcblx0XHRcdHAuc2xkTS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLnNsZE0uc3R5bGUucmlnaHQgPSAnMCc7XG5cdFx0XHRwLnNsZE0uc3R5bGUudG9wID0gJzAnO1xuXHRcdFx0cC5zbGRNLnN0eWxlLndpZHRoID0gKFRISVMuc2xpZGVyU2l6ZSArIHBhZFRvU2xpZGVyUGFkZGluZyAvIDIgKyBUSElTLnBhZGRpbmcgKyAyICogVEhJUy5pbnNldFdpZHRoKSArICdweCc7XG5cdFx0XHRwLnNsZE0uc3R5bGUuaGVpZ2h0ID0gZGltc1sxXSArICdweCc7XG5cdFx0XHRwLnNsZE0uc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQnO1xuXG5cdFx0XHQvLyBzbGlkZXIgcG9pbnRlciBpbm5lciBhbmQgb3V0ZXIgYm9yZGVyXG5cdFx0XHRwLnNsZFB0cklCLnN0eWxlLmJvcmRlciA9XG5cdFx0XHRwLnNsZFB0ck9CLnN0eWxlLmJvcmRlciA9XG5cdFx0XHRcdFRISVMucG9pbnRlckJvcmRlcldpZHRoICsgJ3B4IHNvbGlkICcgKyBUSElTLnBvaW50ZXJCb3JkZXJDb2xvcjtcblxuXHRcdFx0Ly8gc2xpZGVyIHBvaW50ZXIgb3V0ZXIgYm9yZGVyXG5cdFx0XHRwLnNsZFB0ck9CLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHAuc2xkUHRyT0Iuc3R5bGUubGVmdCA9IC0oMiAqIFRISVMucG9pbnRlckJvcmRlcldpZHRoICsgVEhJUy5wb2ludGVyVGhpY2tuZXNzKSArICdweCc7XG5cdFx0XHRwLnNsZFB0ck9CLnN0eWxlLnRvcCA9ICcwJztcblxuXHRcdFx0Ly8gc2xpZGVyIHBvaW50ZXIgbWlkZGxlIGJvcmRlclxuXHRcdFx0cC5zbGRQdHJNQi5zdHlsZS5ib3JkZXIgPSBUSElTLnBvaW50ZXJUaGlja25lc3MgKyAncHggc29saWQgJyArIFRISVMucG9pbnRlckNvbG9yO1xuXG5cdFx0XHQvLyBzbGlkZXIgcG9pbnRlciBzcGFjZXJcblx0XHRcdHAuc2xkUHRyUy5zdHlsZS53aWR0aCA9IFRISVMuc2xpZGVyU2l6ZSArICdweCc7XG5cdFx0XHRwLnNsZFB0clMuc3R5bGUuaGVpZ2h0ID0gc2xpZGVyUHRyU3BhY2UgKyAncHgnO1xuXG5cdFx0XHQvLyB0aGUgQ2xvc2UgYnV0dG9uXG5cdFx0XHRmdW5jdGlvbiBzZXRCdG5Cb3JkZXIgKCkge1xuXHRcdFx0XHR2YXIgaW5zZXRDb2xvcnMgPSBUSElTLmluc2V0Q29sb3Iuc3BsaXQoL1xccysvKTtcblx0XHRcdFx0dmFyIG91dHNldENvbG9yID0gaW5zZXRDb2xvcnMubGVuZ3RoIDwgMiA/IGluc2V0Q29sb3JzWzBdIDogaW5zZXRDb2xvcnNbMV0gKyAnICcgKyBpbnNldENvbG9yc1swXSArICcgJyArIGluc2V0Q29sb3JzWzBdICsgJyAnICsgaW5zZXRDb2xvcnNbMV07XG5cdFx0XHRcdHAuYnRuLnN0eWxlLmJvcmRlckNvbG9yID0gb3V0c2V0Q29sb3I7XG5cdFx0XHR9XG5cdFx0XHRwLmJ0bi5zdHlsZS5kaXNwbGF5ID0gVEhJUy5jbG9zYWJsZSA/ICdibG9jaycgOiAnbm9uZSc7XG5cdFx0XHRwLmJ0bi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLmJ0bi5zdHlsZS5sZWZ0ID0gVEhJUy5wYWRkaW5nICsgJ3B4Jztcblx0XHRcdHAuYnRuLnN0eWxlLmJvdHRvbSA9IFRISVMucGFkZGluZyArICdweCc7XG5cdFx0XHRwLmJ0bi5zdHlsZS5wYWRkaW5nID0gJzAgMTVweCc7XG5cdFx0XHRwLmJ0bi5zdHlsZS5oZWlnaHQgPSBUSElTLmJ1dHRvbkhlaWdodCArICdweCc7XG5cdFx0XHRwLmJ0bi5zdHlsZS5ib3JkZXIgPSBUSElTLmluc2V0V2lkdGggKyAncHggc29saWQnO1xuXHRcdFx0c2V0QnRuQm9yZGVyKCk7XG5cdFx0XHRwLmJ0bi5zdHlsZS5jb2xvciA9IFRISVMuYnV0dG9uQ29sb3I7XG5cdFx0XHRwLmJ0bi5zdHlsZS5mb250ID0gJzEycHggc2Fucy1zZXJpZic7XG5cdFx0XHRwLmJ0bi5zdHlsZS50ZXh0QWxpZ24gPSAnY2VudGVyJztcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHAuYnRuLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcblx0XHRcdH0gY2F0Y2goZU9sZElFKSB7XG5cdFx0XHRcdHAuYnRuLnN0eWxlLmN1cnNvciA9ICdoYW5kJztcblx0XHRcdH1cblx0XHRcdHAuYnRuLm9ubW91c2Vkb3duID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRUSElTLmhpZGUoKTtcblx0XHRcdH07XG5cdFx0XHRwLmJ0blQuc3R5bGUubGluZUhlaWdodCA9IFRISVMuYnV0dG9uSGVpZ2h0ICsgJ3B4Jztcblx0XHRcdHAuYnRuVC5pbm5lckhUTUwgPSAnJztcblx0XHRcdHAuYnRuVC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShUSElTLmNsb3NlVGV4dCkpO1xuXG5cdFx0XHQvLyBwbGFjZSBwb2ludGVyc1xuXHRcdFx0cmVkcmF3UGFkKCk7XG5cdFx0XHRyZWRyYXdTbGQoKTtcblxuXHRcdFx0Ly8gSWYgd2UgYXJlIGNoYW5naW5nIHRoZSBvd25lciB3aXRob3V0IGZpcnN0IGNsb3NpbmcgdGhlIHBpY2tlcixcblx0XHRcdC8vIG1ha2Ugc3VyZSB0byBmaXJzdCBkZWFsIHdpdGggdGhlIG9sZCBvd25lclxuXHRcdFx0aWYgKGpzYy5waWNrZXIub3duZXIgJiYganNjLnBpY2tlci5vd25lciAhPT0gVEhJUykge1xuXHRcdFx0XHRqc2MudW5zZXRDbGFzcyhqc2MucGlja2VyLm93bmVyLnRhcmdldEVsZW1lbnQsIFRISVMuYWN0aXZlQ2xhc3MpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBTZXQgdGhlIG5ldyBwaWNrZXIgb3duZXJcblx0XHRcdGpzYy5waWNrZXIub3duZXIgPSBUSElTO1xuXG5cdFx0XHQvLyBUaGUgcmVkcmF3UG9zaXRpb24oKSBtZXRob2QgbmVlZHMgcGlja2VyLm93bmVyIHRvIGJlIHNldCwgdGhhdCdzIHdoeSB3ZSBjYWxsIGl0IGhlcmUsXG5cdFx0XHQvLyBhZnRlciBzZXR0aW5nIHRoZSBvd25lclxuXHRcdFx0aWYgKGpzYy5pc0VsZW1lbnRUeXBlKGNvbnRhaW5lciwgJ2JvZHknKSkge1xuXHRcdFx0XHRqc2MucmVkcmF3UG9zaXRpb24oKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGpzYy5fZHJhd1Bvc2l0aW9uKFRISVMsIDAsIDAsICdyZWxhdGl2ZScsIGZhbHNlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHAud3JhcC5wYXJlbnROb2RlICE9IGNvbnRhaW5lcikge1xuXHRcdFx0XHRjb250YWluZXIuYXBwZW5kQ2hpbGQocC53cmFwKTtcblx0XHRcdH1cblxuXHRcdFx0anNjLnNldENsYXNzKFRISVMudGFyZ2V0RWxlbWVudCwgVEhJUy5hY3RpdmVDbGFzcyk7XG5cdFx0fVxuXG5cblx0XHRmdW5jdGlvbiByZWRyYXdQYWQgKCkge1xuXHRcdFx0Ly8gcmVkcmF3IHRoZSBwYWQgcG9pbnRlclxuXHRcdFx0c3dpdGNoIChqc2MuZ2V0UGFkWUNvbXBvbmVudChUSElTKSkge1xuXHRcdFx0Y2FzZSAncyc6IHZhciB5Q29tcG9uZW50ID0gMTsgYnJlYWs7XG5cdFx0XHRjYXNlICd2JzogdmFyIHlDb21wb25lbnQgPSAyOyBicmVhaztcblx0XHRcdH1cblx0XHRcdHZhciB4ID0gTWF0aC5yb3VuZCgoVEhJUy5oc3ZbMF0gLyAzNjApICogKFRISVMud2lkdGggLSAxKSk7XG5cdFx0XHR2YXIgeSA9IE1hdGgucm91bmQoKDEgLSBUSElTLmhzdlt5Q29tcG9uZW50XSAvIDEwMCkgKiAoVEhJUy5oZWlnaHQgLSAxKSk7XG5cdFx0XHR2YXIgY3Jvc3NPdXRlclNpemUgPSAoMiAqIFRISVMucG9pbnRlckJvcmRlcldpZHRoICsgVEhJUy5wb2ludGVyVGhpY2tuZXNzICsgMiAqIFRISVMuY3Jvc3NTaXplKTtcblx0XHRcdHZhciBvZnMgPSAtTWF0aC5mbG9vcihjcm9zc091dGVyU2l6ZSAvIDIpO1xuXHRcdFx0anNjLnBpY2tlci5jcm9zcy5zdHlsZS5sZWZ0ID0gKHggKyBvZnMpICsgJ3B4Jztcblx0XHRcdGpzYy5waWNrZXIuY3Jvc3Muc3R5bGUudG9wID0gKHkgKyBvZnMpICsgJ3B4JztcblxuXHRcdFx0Ly8gcmVkcmF3IHRoZSBzbGlkZXJcblx0XHRcdHN3aXRjaCAoanNjLmdldFNsaWRlckNvbXBvbmVudChUSElTKSkge1xuXHRcdFx0Y2FzZSAncyc6XG5cdFx0XHRcdHZhciByZ2IxID0gSFNWX1JHQihUSElTLmhzdlswXSwgMTAwLCBUSElTLmhzdlsyXSk7XG5cdFx0XHRcdHZhciByZ2IyID0gSFNWX1JHQihUSElTLmhzdlswXSwgMCwgVEhJUy5oc3ZbMl0pO1xuXHRcdFx0XHR2YXIgY29sb3IxID0gJ3JnYignICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYjFbMF0pICsgJywnICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYjFbMV0pICsgJywnICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYjFbMl0pICsgJyknO1xuXHRcdFx0XHR2YXIgY29sb3IyID0gJ3JnYignICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYjJbMF0pICsgJywnICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYjJbMV0pICsgJywnICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYjJbMl0pICsgJyknO1xuXHRcdFx0XHRqc2MucGlja2VyLnNsZEdyYWQuZHJhdyhUSElTLnNsaWRlclNpemUsIFRISVMuaGVpZ2h0LCBjb2xvcjEsIGNvbG9yMik7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAndic6XG5cdFx0XHRcdHZhciByZ2IgPSBIU1ZfUkdCKFRISVMuaHN2WzBdLCBUSElTLmhzdlsxXSwgMTAwKTtcblx0XHRcdFx0dmFyIGNvbG9yMSA9ICdyZ2IoJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2JbMF0pICsgJywnICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYlsxXSkgKyAnLCcgK1xuXHRcdFx0XHRcdE1hdGgucm91bmQocmdiWzJdKSArICcpJztcblx0XHRcdFx0dmFyIGNvbG9yMiA9ICcjMDAwJztcblx0XHRcdFx0anNjLnBpY2tlci5zbGRHcmFkLmRyYXcoVEhJUy5zbGlkZXJTaXplLCBUSElTLmhlaWdodCwgY29sb3IxLCBjb2xvcjIpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9XG5cblxuXHRcdGZ1bmN0aW9uIHJlZHJhd1NsZCAoKSB7XG5cdFx0XHR2YXIgc2xkQ29tcG9uZW50ID0ganNjLmdldFNsaWRlckNvbXBvbmVudChUSElTKTtcblx0XHRcdGlmIChzbGRDb21wb25lbnQpIHtcblx0XHRcdFx0Ly8gcmVkcmF3IHRoZSBzbGlkZXIgcG9pbnRlclxuXHRcdFx0XHRzd2l0Y2ggKHNsZENvbXBvbmVudCkge1xuXHRcdFx0XHRjYXNlICdzJzogdmFyIHlDb21wb25lbnQgPSAxOyBicmVhaztcblx0XHRcdFx0Y2FzZSAndic6IHZhciB5Q29tcG9uZW50ID0gMjsgYnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdFx0dmFyIHkgPSBNYXRoLnJvdW5kKCgxIC0gVEhJUy5oc3ZbeUNvbXBvbmVudF0gLyAxMDApICogKFRISVMuaGVpZ2h0IC0gMSkpO1xuXHRcdFx0XHRqc2MucGlja2VyLnNsZFB0ck9CLnN0eWxlLnRvcCA9ICh5IC0gKDIgKiBUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCArIFRISVMucG9pbnRlclRoaWNrbmVzcykgLSBNYXRoLmZsb29yKHNsaWRlclB0clNwYWNlIC8gMikpICsgJ3B4Jztcblx0XHRcdH1cblx0XHR9XG5cblxuXHRcdGZ1bmN0aW9uIGlzUGlja2VyT3duZXIgKCkge1xuXHRcdFx0cmV0dXJuIGpzYy5waWNrZXIgJiYganNjLnBpY2tlci5vd25lciA9PT0gVEhJUztcblx0XHR9XG5cblxuXHRcdGZ1bmN0aW9uIGJsdXJWYWx1ZSAoKSB7XG5cdFx0XHRUSElTLmltcG9ydENvbG9yKCk7XG5cdFx0fVxuXG5cblx0XHQvLyBGaW5kIHRoZSB0YXJnZXQgZWxlbWVudFxuXHRcdGlmICh0eXBlb2YgdGFyZ2V0RWxlbWVudCA9PT0gJ3N0cmluZycpIHtcblx0XHRcdHZhciBpZCA9IHRhcmdldEVsZW1lbnQ7XG5cdFx0XHR2YXIgZWxtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuXHRcdFx0aWYgKGVsbSkge1xuXHRcdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBlbG07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRqc2Mud2FybignQ291bGQgbm90IGZpbmQgdGFyZ2V0IGVsZW1lbnQgd2l0aCBJRCBcXCcnICsgaWQgKyAnXFwnJyk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmICh0YXJnZXRFbGVtZW50KSB7XG5cdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSB0YXJnZXRFbGVtZW50O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRqc2Mud2FybignSW52YWxpZCB0YXJnZXQgZWxlbWVudDogXFwnJyArIHRhcmdldEVsZW1lbnQgKyAnXFwnJyk7XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMudGFyZ2V0RWxlbWVudC5fanNjTGlua2VkSW5zdGFuY2UpIHtcblx0XHRcdGpzYy53YXJuKCdDYW5ub3QgbGluayBqc2NvbG9yIHR3aWNlIHRvIHRoZSBzYW1lIGVsZW1lbnQuIFNraXBwaW5nLicpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHR0aGlzLnRhcmdldEVsZW1lbnQuX2pzY0xpbmtlZEluc3RhbmNlID0gdGhpcztcblxuXHRcdC8vIEZpbmQgdGhlIHZhbHVlIGVsZW1lbnRcblx0XHR0aGlzLnZhbHVlRWxlbWVudCA9IGpzYy5mZXRjaEVsZW1lbnQodGhpcy52YWx1ZUVsZW1lbnQpO1xuXHRcdC8vIEZpbmQgdGhlIHN0eWxlIGVsZW1lbnRcblx0XHR0aGlzLnN0eWxlRWxlbWVudCA9IGpzYy5mZXRjaEVsZW1lbnQodGhpcy5zdHlsZUVsZW1lbnQpO1xuXG5cdFx0dmFyIFRISVMgPSB0aGlzO1xuXHRcdHZhciBjb250YWluZXIgPVxuXHRcdFx0dGhpcy5jb250YWluZXIgP1xuXHRcdFx0anNjLmZldGNoRWxlbWVudCh0aGlzLmNvbnRhaW5lcikgOlxuXHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVswXTtcblx0XHR2YXIgc2xpZGVyUHRyU3BhY2UgPSAzOyAvLyBweFxuXG5cdFx0Ly8gRm9yIEJVVFRPTiBlbGVtZW50cyBpdCdzIGltcG9ydGFudCB0byBzdG9wIHRoZW0gZnJvbSBzZW5kaW5nIHRoZSBmb3JtIHdoZW4gY2xpY2tlZFxuXHRcdC8vIChlLmcuIGluIFNhZmFyaSlcblx0XHRpZiAoanNjLmlzRWxlbWVudFR5cGUodGhpcy50YXJnZXRFbGVtZW50LCAnYnV0dG9uJykpIHtcblx0XHRcdGlmICh0aGlzLnRhcmdldEVsZW1lbnQub25jbGljaykge1xuXHRcdFx0XHR2YXIgb3JpZ0NhbGxiYWNrID0gdGhpcy50YXJnZXRFbGVtZW50Lm9uY2xpY2s7XG5cdFx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudC5vbmNsaWNrID0gZnVuY3Rpb24gKGV2dCkge1xuXHRcdFx0XHRcdG9yaWdDYWxsYmFjay5jYWxsKHRoaXMsIGV2dCk7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9O1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy50YXJnZXRFbGVtZW50Lm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvKlxuXHRcdHZhciBlbG0gPSB0aGlzLnRhcmdldEVsZW1lbnQ7XG5cdFx0ZG8ge1xuXHRcdFx0Ly8gSWYgdGhlIHRhcmdldCBlbGVtZW50IG9yIG9uZSBvZiBpdHMgb2Zmc2V0UGFyZW50cyBoYXMgZml4ZWQgcG9zaXRpb24sXG5cdFx0XHQvLyB0aGVuIHVzZSBmaXhlZCBwb3NpdGlvbmluZyBpbnN0ZWFkXG5cdFx0XHQvL1xuXHRcdFx0Ly8gTm90ZTogSW4gRmlyZWZveCwgZ2V0Q29tcHV0ZWRTdHlsZSByZXR1cm5zIG51bGwgaW4gYSBoaWRkZW4gaWZyYW1lLFxuXHRcdFx0Ly8gdGhhdCdzIHdoeSB3ZSBuZWVkIHRvIGNoZWNrIGlmIHRoZSByZXR1cm5lZCBzdHlsZSBvYmplY3QgaXMgbm9uLWVtcHR5XG5cdFx0XHR2YXIgY3VyclN0eWxlID0ganNjLmdldFN0eWxlKGVsbSk7XG5cdFx0XHRpZiAoY3VyclN0eWxlICYmIGN1cnJTdHlsZS5wb3NpdGlvbi50b0xvd2VyQ2FzZSgpID09PSAnZml4ZWQnKSB7XG5cdFx0XHRcdHRoaXMuZml4ZWQgPSB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZWxtICE9PSB0aGlzLnRhcmdldEVsZW1lbnQpIHtcblx0XHRcdFx0Ly8gYXR0YWNoIG9uUGFyZW50U2Nyb2xsIHNvIHRoYXQgd2UgY2FuIHJlY29tcHV0ZSB0aGUgcGlja2VyIHBvc2l0aW9uXG5cdFx0XHRcdC8vIHdoZW4gb25lIG9mIHRoZSBvZmZzZXRQYXJlbnRzIGlzIHNjcm9sbGVkXG5cdFx0XHRcdGlmICghZWxtLl9qc2NFdmVudHNBdHRhY2hlZCkge1xuXHRcdFx0XHRcdGpzYy5hdHRhY2hFdmVudChlbG0sICdzY3JvbGwnLCBqc2Mub25QYXJlbnRTY3JvbGwpO1xuXHRcdFx0XHRcdGVsbS5fanNjRXZlbnRzQXR0YWNoZWQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSB3aGlsZSAoKGVsbSA9IGVsbS5vZmZzZXRQYXJlbnQpICYmICFqc2MuaXNFbGVtZW50VHlwZShlbG0sICdib2R5JykpO1xuXHRcdCovXG5cblx0XHQvLyB2YWx1ZUVsZW1lbnRcblx0XHRpZiAodGhpcy52YWx1ZUVsZW1lbnQpIHtcblx0XHRcdGlmIChqc2MuaXNFbGVtZW50VHlwZSh0aGlzLnZhbHVlRWxlbWVudCwgJ2lucHV0JykpIHtcblx0XHRcdFx0dmFyIHVwZGF0ZUZpZWxkID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFRISVMuZnJvbVN0cmluZyhUSElTLnZhbHVlRWxlbWVudC52YWx1ZSwganNjLmxlYXZlVmFsdWUpO1xuXHRcdFx0XHRcdGpzYy5kaXNwYXRjaEZpbmVDaGFuZ2UoVEhJUyk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdGpzYy5hdHRhY2hFdmVudCh0aGlzLnZhbHVlRWxlbWVudCwgJ2tleXVwJywgdXBkYXRlRmllbGQpO1xuXHRcdFx0XHRqc2MuYXR0YWNoRXZlbnQodGhpcy52YWx1ZUVsZW1lbnQsICdpbnB1dCcsIHVwZGF0ZUZpZWxkKTtcblx0XHRcdFx0anNjLmF0dGFjaEV2ZW50KHRoaXMudmFsdWVFbGVtZW50LCAnYmx1cicsIGJsdXJWYWx1ZSk7XG5cdFx0XHRcdHRoaXMudmFsdWVFbGVtZW50LnNldEF0dHJpYnV0ZSgnYXV0b2NvbXBsZXRlJywgJ29mZicpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIHN0eWxlRWxlbWVudFxuXHRcdGlmICh0aGlzLnN0eWxlRWxlbWVudCkge1xuXHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuX2pzY09yaWdTdHlsZSA9IHtcblx0XHRcdFx0YmFja2dyb3VuZEltYWdlIDogdGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZEltYWdlLFxuXHRcdFx0XHRiYWNrZ3JvdW5kQ29sb3IgOiB0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IsXG5cdFx0XHRcdGNvbG9yIDogdGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuY29sb3Jcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMudmFsdWUpIHtcblx0XHRcdC8vIFRyeSB0byBzZXQgdGhlIGNvbG9yIGZyb20gdGhlIC52YWx1ZSBvcHRpb24gYW5kIGlmIHVuc3VjY2Vzc2Z1bCxcblx0XHRcdC8vIGV4cG9ydCB0aGUgY3VycmVudCBjb2xvclxuXHRcdFx0dGhpcy5mcm9tU3RyaW5nKHRoaXMudmFsdWUpIHx8IHRoaXMuZXhwb3J0Q29sb3IoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5pbXBvcnRDb2xvcigpO1xuXHRcdH1cblx0fVxuXG59O1xuXG5cbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIFB1YmxpYyBwcm9wZXJ0aWVzIGFuZCBtZXRob2RzXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cblxuLy8gQnkgZGVmYXVsdCwgc2VhcmNoIGZvciBhbGwgZWxlbWVudHMgd2l0aCBjbGFzcz1cImpzY29sb3JcIiBhbmQgaW5zdGFsbCBhIGNvbG9yIHBpY2tlciBvbiB0aGVtLlxuLy9cbi8vIFlvdSBjYW4gY2hhbmdlIHdoYXQgY2xhc3MgbmFtZSB3aWxsIGJlIGxvb2tlZCBmb3IgYnkgc2V0dGluZyB0aGUgcHJvcGVydHkganNjb2xvci5sb29rdXBDbGFzc1xuLy8gYW55d2hlcmUgaW4geW91ciBIVE1MIGRvY3VtZW50LiBUbyBjb21wbGV0ZWx5IGRpc2FibGUgdGhlIGF1dG9tYXRpYyBsb29rdXAsIHNldCBpdCB0byBudWxsLlxuLy9cbmpzYy5qc2NvbG9yLmxvb2t1cENsYXNzID0gJ2pzY29sb3InO1xuXG5cbmpzYy5qc2NvbG9yLmluc3RhbGxCeUNsYXNzTmFtZSA9IGZ1bmN0aW9uIChjbGFzc05hbWUpIHtcblx0dmFyIGlucHV0RWxtcyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbnB1dCcpO1xuXHR2YXIgYnV0dG9uRWxtcyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdidXR0b24nKTtcblxuXHRqc2MudHJ5SW5zdGFsbE9uRWxlbWVudHMoaW5wdXRFbG1zLCBjbGFzc05hbWUpO1xuXHRqc2MudHJ5SW5zdGFsbE9uRWxlbWVudHMoYnV0dG9uRWxtcywgY2xhc3NOYW1lKTtcbn07XG5cblxuanNjLnJlZ2lzdGVyKCk7XG5cblxucmV0dXJuIGpzYy5qc2NvbG9yO1xuXG5cbn0pKCk7IH1cbiIsIi8qISB2ZXguY29tYmluZWQuanM6IHZleCAzLjEuMSwgdmV4LWRpYWxvZyAxLjAuNyAqL1xuIWZ1bmN0aW9uKGEpe2lmKFwib2JqZWN0XCI9PXR5cGVvZiBleHBvcnRzJiZcInVuZGVmaW5lZFwiIT10eXBlb2YgbW9kdWxlKW1vZHVsZS5leHBvcnRzPWEoKTtlbHNlIGlmKFwiZnVuY3Rpb25cIj09dHlwZW9mIGRlZmluZSYmZGVmaW5lLmFtZClkZWZpbmUoW10sYSk7ZWxzZXt2YXIgYjtiPVwidW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3c/d2luZG93OlwidW5kZWZpbmVkXCIhPXR5cGVvZiBnbG9iYWw/Z2xvYmFsOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6dGhpcyxiLnZleD1hKCl9fShmdW5jdGlvbigpe3ZhciBhO3JldHVybiBmdW5jdGlvbiBiKGEsYyxkKXtmdW5jdGlvbiBlKGcsaCl7aWYoIWNbZ10pe2lmKCFhW2ddKXt2YXIgaT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFoJiZpKXJldHVybiBpKGcsITApO2lmKGYpcmV0dXJuIGYoZywhMCk7dmFyIGo9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitnK1wiJ1wiKTt0aHJvdyBqLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsan12YXIgaz1jW2ddPXtleHBvcnRzOnt9fTthW2ddWzBdLmNhbGwoay5leHBvcnRzLGZ1bmN0aW9uKGIpe3ZhciBjPWFbZ11bMV1bYl07cmV0dXJuIGUoYz9jOmIpfSxrLGsuZXhwb3J0cyxiLGEsYyxkKX1yZXR1cm4gY1tnXS5leHBvcnRzfWZvcih2YXIgZj1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGc9MDtnPGQubGVuZ3RoO2crKyllKGRbZ10pO3JldHVybiBlfSh7MTpbZnVuY3Rpb24oYSxiLGMpe1wiZG9jdW1lbnRcImluIHdpbmRvdy5zZWxmJiYoXCJjbGFzc0xpc3RcImluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJfXCIpJiYoIWRvY3VtZW50LmNyZWF0ZUVsZW1lbnROU3x8XCJjbGFzc0xpc3RcImluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsXCJnXCIpKT8hZnVuY3Rpb24oKXtcInVzZSBzdHJpY3RcIjt2YXIgYT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKTtpZihhLmNsYXNzTGlzdC5hZGQoXCJjMVwiLFwiYzJcIiksIWEuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYzJcIikpe3ZhciBiPWZ1bmN0aW9uKGEpe3ZhciBiPURPTVRva2VuTGlzdC5wcm90b3R5cGVbYV07RE9NVG9rZW5MaXN0LnByb3RvdHlwZVthXT1mdW5jdGlvbihhKXt2YXIgYyxkPWFyZ3VtZW50cy5sZW5ndGg7Zm9yKGM9MDtjPGQ7YysrKWE9YXJndW1lbnRzW2NdLGIuY2FsbCh0aGlzLGEpfX07YihcImFkZFwiKSxiKFwicmVtb3ZlXCIpfWlmKGEuY2xhc3NMaXN0LnRvZ2dsZShcImMzXCIsITEpLGEuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYzNcIikpe3ZhciBjPURPTVRva2VuTGlzdC5wcm90b3R5cGUudG9nZ2xlO0RPTVRva2VuTGlzdC5wcm90b3R5cGUudG9nZ2xlPWZ1bmN0aW9uKGEsYil7cmV0dXJuIDEgaW4gYXJndW1lbnRzJiYhdGhpcy5jb250YWlucyhhKT09IWI/YjpjLmNhbGwodGhpcyxhKX19YT1udWxsfSgpOiFmdW5jdGlvbihhKXtcInVzZSBzdHJpY3RcIjtpZihcIkVsZW1lbnRcImluIGEpe3ZhciBiPVwiY2xhc3NMaXN0XCIsYz1cInByb3RvdHlwZVwiLGQ9YS5FbGVtZW50W2NdLGU9T2JqZWN0LGY9U3RyaW5nW2NdLnRyaW18fGZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMucmVwbGFjZSgvXlxccyt8XFxzKyQvZyxcIlwiKX0sZz1BcnJheVtjXS5pbmRleE9mfHxmdW5jdGlvbihhKXtmb3IodmFyIGI9MCxjPXRoaXMubGVuZ3RoO2I8YztiKyspaWYoYiBpbiB0aGlzJiZ0aGlzW2JdPT09YSlyZXR1cm4gYjtyZXR1cm4tMX0saD1mdW5jdGlvbihhLGIpe3RoaXMubmFtZT1hLHRoaXMuY29kZT1ET01FeGNlcHRpb25bYV0sdGhpcy5tZXNzYWdlPWJ9LGk9ZnVuY3Rpb24oYSxiKXtpZihcIlwiPT09Yil0aHJvdyBuZXcgaChcIlNZTlRBWF9FUlJcIixcIkFuIGludmFsaWQgb3IgaWxsZWdhbCBzdHJpbmcgd2FzIHNwZWNpZmllZFwiKTtpZigvXFxzLy50ZXN0KGIpKXRocm93IG5ldyBoKFwiSU5WQUxJRF9DSEFSQUNURVJfRVJSXCIsXCJTdHJpbmcgY29udGFpbnMgYW4gaW52YWxpZCBjaGFyYWN0ZXJcIik7cmV0dXJuIGcuY2FsbChhLGIpfSxqPWZ1bmN0aW9uKGEpe2Zvcih2YXIgYj1mLmNhbGwoYS5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKXx8XCJcIiksYz1iP2Iuc3BsaXQoL1xccysvKTpbXSxkPTAsZT1jLmxlbmd0aDtkPGU7ZCsrKXRoaXMucHVzaChjW2RdKTt0aGlzLl91cGRhdGVDbGFzc05hbWU9ZnVuY3Rpb24oKXthLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsdGhpcy50b1N0cmluZygpKX19LGs9altjXT1bXSxsPWZ1bmN0aW9uKCl7cmV0dXJuIG5ldyBqKHRoaXMpfTtpZihoW2NdPUVycm9yW2NdLGsuaXRlbT1mdW5jdGlvbihhKXtyZXR1cm4gdGhpc1thXXx8bnVsbH0say5jb250YWlucz1mdW5jdGlvbihhKXtyZXR1cm4gYSs9XCJcIixpKHRoaXMsYSkhPT0tMX0say5hZGQ9ZnVuY3Rpb24oKXt2YXIgYSxiPWFyZ3VtZW50cyxjPTAsZD1iLmxlbmd0aCxlPSExO2RvIGE9YltjXStcIlwiLGkodGhpcyxhKT09PS0xJiYodGhpcy5wdXNoKGEpLGU9ITApO3doaWxlKCsrYzxkKTtlJiZ0aGlzLl91cGRhdGVDbGFzc05hbWUoKX0say5yZW1vdmU9ZnVuY3Rpb24oKXt2YXIgYSxiLGM9YXJndW1lbnRzLGQ9MCxlPWMubGVuZ3RoLGY9ITE7ZG8gZm9yKGE9Y1tkXStcIlwiLGI9aSh0aGlzLGEpO2IhPT0tMTspdGhpcy5zcGxpY2UoYiwxKSxmPSEwLGI9aSh0aGlzLGEpO3doaWxlKCsrZDxlKTtmJiZ0aGlzLl91cGRhdGVDbGFzc05hbWUoKX0say50b2dnbGU9ZnVuY3Rpb24oYSxiKXthKz1cIlwiO3ZhciBjPXRoaXMuY29udGFpbnMoYSksZD1jP2IhPT0hMCYmXCJyZW1vdmVcIjpiIT09ITEmJlwiYWRkXCI7cmV0dXJuIGQmJnRoaXNbZF0oYSksYj09PSEwfHxiPT09ITE/YjohY30say50b1N0cmluZz1mdW5jdGlvbigpe3JldHVybiB0aGlzLmpvaW4oXCIgXCIpfSxlLmRlZmluZVByb3BlcnR5KXt2YXIgbT17Z2V0OmwsZW51bWVyYWJsZTohMCxjb25maWd1cmFibGU6ITB9O3RyeXtlLmRlZmluZVByb3BlcnR5KGQsYixtKX1jYXRjaChuKXtuLm51bWJlcj09PS0yMTQ2ODIzMjUyJiYobS5lbnVtZXJhYmxlPSExLGUuZGVmaW5lUHJvcGVydHkoZCxiLG0pKX19ZWxzZSBlW2NdLl9fZGVmaW5lR2V0dGVyX18mJmQuX19kZWZpbmVHZXR0ZXJfXyhiLGwpfX0od2luZG93LnNlbGYpKX0se31dLDI6W2Z1bmN0aW9uKGEsYixjKXtmdW5jdGlvbiBkKGEsYil7aWYoXCJzdHJpbmdcIiE9dHlwZW9mIGEpdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN0cmluZyBleHBlY3RlZFwiKTtifHwoYj1kb2N1bWVudCk7dmFyIGM9LzwoW1xcdzpdKykvLmV4ZWMoYSk7aWYoIWMpcmV0dXJuIGIuY3JlYXRlVGV4dE5vZGUoYSk7YT1hLnJlcGxhY2UoL15cXHMrfFxccyskL2csXCJcIik7dmFyIGQ9Y1sxXTtpZihcImJvZHlcIj09ZCl7dmFyIGU9Yi5jcmVhdGVFbGVtZW50KFwiaHRtbFwiKTtyZXR1cm4gZS5pbm5lckhUTUw9YSxlLnJlbW92ZUNoaWxkKGUubGFzdENoaWxkKX12YXIgZj1nW2RdfHxnLl9kZWZhdWx0LGg9ZlswXSxpPWZbMV0saj1mWzJdLGU9Yi5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO2ZvcihlLmlubmVySFRNTD1pK2ErajtoLS07KWU9ZS5sYXN0Q2hpbGQ7aWYoZS5maXJzdENoaWxkPT1lLmxhc3RDaGlsZClyZXR1cm4gZS5yZW1vdmVDaGlsZChlLmZpcnN0Q2hpbGQpO2Zvcih2YXIgaz1iLmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtlLmZpcnN0Q2hpbGQ7KWsuYXBwZW5kQ2hpbGQoZS5yZW1vdmVDaGlsZChlLmZpcnN0Q2hpbGQpKTtyZXR1cm4ga31iLmV4cG9ydHM9ZDt2YXIgZSxmPSExO1widW5kZWZpbmVkXCIhPXR5cGVvZiBkb2N1bWVudCYmKGU9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKSxlLmlubmVySFRNTD0nICA8bGluay8+PHRhYmxlPjwvdGFibGU+PGEgaHJlZj1cIi9hXCI+YTwvYT48aW5wdXQgdHlwZT1cImNoZWNrYm94XCIvPicsZj0hZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImxpbmtcIikubGVuZ3RoLGU9dm9pZCAwKTt2YXIgZz17bGVnZW5kOlsxLFwiPGZpZWxkc2V0PlwiLFwiPC9maWVsZHNldD5cIl0sdHI6WzIsXCI8dGFibGU+PHRib2R5PlwiLFwiPC90Ym9keT48L3RhYmxlPlwiXSxjb2w6WzIsXCI8dGFibGU+PHRib2R5PjwvdGJvZHk+PGNvbGdyb3VwPlwiLFwiPC9jb2xncm91cD48L3RhYmxlPlwiXSxfZGVmYXVsdDpmP1sxLFwiWDxkaXY+XCIsXCI8L2Rpdj5cIl06WzAsXCJcIixcIlwiXX07Zy50ZD1nLnRoPVszLFwiPHRhYmxlPjx0Ym9keT48dHI+XCIsXCI8L3RyPjwvdGJvZHk+PC90YWJsZT5cIl0sZy5vcHRpb249Zy5vcHRncm91cD1bMSwnPHNlbGVjdCBtdWx0aXBsZT1cIm11bHRpcGxlXCI+JyxcIjwvc2VsZWN0PlwiXSxnLnRoZWFkPWcudGJvZHk9Zy5jb2xncm91cD1nLmNhcHRpb249Zy50Zm9vdD1bMSxcIjx0YWJsZT5cIixcIjwvdGFibGU+XCJdLGcucG9seWxpbmU9Zy5lbGxpcHNlPWcucG9seWdvbj1nLmNpcmNsZT1nLnRleHQ9Zy5saW5lPWcucGF0aD1nLnJlY3Q9Zy5nPVsxLCc8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2ZXJzaW9uPVwiMS4xXCI+JyxcIjwvc3ZnPlwiXX0se31dLDM6W2Z1bmN0aW9uKGEsYixjKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBkKGEsYil7aWYodm9pZCAwPT09YXx8bnVsbD09PWEpdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjb252ZXJ0IGZpcnN0IGFyZ3VtZW50IHRvIG9iamVjdFwiKTtmb3IodmFyIGM9T2JqZWN0KGEpLGQ9MTtkPGFyZ3VtZW50cy5sZW5ndGg7ZCsrKXt2YXIgZT1hcmd1bWVudHNbZF07aWYodm9pZCAwIT09ZSYmbnVsbCE9PWUpZm9yKHZhciBmPU9iamVjdC5rZXlzKE9iamVjdChlKSksZz0wLGg9Zi5sZW5ndGg7ZzxoO2crKyl7dmFyIGk9ZltnXSxqPU9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoZSxpKTt2b2lkIDAhPT1qJiZqLmVudW1lcmFibGUmJihjW2ldPWVbaV0pfX1yZXR1cm4gY31mdW5jdGlvbiBlKCl7T2JqZWN0LmFzc2lnbnx8T2JqZWN0LmRlZmluZVByb3BlcnR5KE9iamVjdCxcImFzc2lnblwiLHtlbnVtZXJhYmxlOiExLGNvbmZpZ3VyYWJsZTohMCx3cml0YWJsZTohMCx2YWx1ZTpkfSl9Yi5leHBvcnRzPXthc3NpZ246ZCxwb2x5ZmlsbDplfX0se31dLDQ6W2Z1bmN0aW9uKGEsYixjKXtmdW5jdGlvbiBkKGEsYil7XCJvYmplY3RcIiE9dHlwZW9mIGI/Yj17aGFzaDohIWJ9OnZvaWQgMD09PWIuaGFzaCYmKGIuaGFzaD0hMCk7Zm9yKHZhciBjPWIuaGFzaD97fTpcIlwiLGQ9Yi5zZXJpYWxpemVyfHwoYi5oYXNoP2c6aCksZT1hJiZhLmVsZW1lbnRzP2EuZWxlbWVudHM6W10sZj1PYmplY3QuY3JlYXRlKG51bGwpLGs9MDtrPGUubGVuZ3RoOysrayl7dmFyIGw9ZVtrXTtpZigoYi5kaXNhYmxlZHx8IWwuZGlzYWJsZWQpJiZsLm5hbWUmJmoudGVzdChsLm5vZGVOYW1lKSYmIWkudGVzdChsLnR5cGUpKXt2YXIgbT1sLm5hbWUsbj1sLnZhbHVlO2lmKFwiY2hlY2tib3hcIiE9PWwudHlwZSYmXCJyYWRpb1wiIT09bC50eXBlfHxsLmNoZWNrZWR8fChuPXZvaWQgMCksYi5lbXB0eSl7aWYoXCJjaGVja2JveFwiIT09bC50eXBlfHxsLmNoZWNrZWR8fChuPVwiXCIpLFwicmFkaW9cIj09PWwudHlwZSYmKGZbbC5uYW1lXXx8bC5jaGVja2VkP2wuY2hlY2tlZCYmKGZbbC5uYW1lXT0hMCk6ZltsLm5hbWVdPSExKSwhbiYmXCJyYWRpb1wiPT1sLnR5cGUpY29udGludWV9ZWxzZSBpZighbiljb250aW51ZTtpZihcInNlbGVjdC1tdWx0aXBsZVwiIT09bC50eXBlKWM9ZChjLG0sbik7ZWxzZXtuPVtdO2Zvcih2YXIgbz1sLm9wdGlvbnMscD0hMSxxPTA7cTxvLmxlbmd0aDsrK3Epe3ZhciByPW9bcV0scz1iLmVtcHR5JiYhci52YWx1ZSx0PXIudmFsdWV8fHM7ci5zZWxlY3RlZCYmdCYmKHA9ITAsYz1iLmhhc2gmJlwiW11cIiE9PW0uc2xpY2UobS5sZW5ndGgtMik/ZChjLG0rXCJbXVwiLHIudmFsdWUpOmQoYyxtLHIudmFsdWUpKX0hcCYmYi5lbXB0eSYmKGM9ZChjLG0sXCJcIikpfX19aWYoYi5lbXB0eSlmb3IodmFyIG0gaW4gZilmW21dfHwoYz1kKGMsbSxcIlwiKSk7cmV0dXJuIGN9ZnVuY3Rpb24gZShhKXt2YXIgYj1bXSxjPS9eKFteXFxbXFxdXSopLyxkPW5ldyBSZWdFeHAoayksZT1jLmV4ZWMoYSk7Zm9yKGVbMV0mJmIucHVzaChlWzFdKTtudWxsIT09KGU9ZC5leGVjKGEpKTspYi5wdXNoKGVbMV0pO3JldHVybiBifWZ1bmN0aW9uIGYoYSxiLGMpe2lmKDA9PT1iLmxlbmd0aClyZXR1cm4gYT1jO3ZhciBkPWIuc2hpZnQoKSxlPWQubWF0Y2goL15cXFsoLis/KVxcXSQvKTtpZihcIltdXCI9PT1kKXJldHVybiBhPWF8fFtdLEFycmF5LmlzQXJyYXkoYSk/YS5wdXNoKGYobnVsbCxiLGMpKTooYS5fdmFsdWVzPWEuX3ZhbHVlc3x8W10sYS5fdmFsdWVzLnB1c2goZihudWxsLGIsYykpKSxhO2lmKGUpe3ZhciBnPWVbMV0saD0rZztpc05hTihoKT8oYT1hfHx7fSxhW2ddPWYoYVtnXSxiLGMpKTooYT1hfHxbXSxhW2hdPWYoYVtoXSxiLGMpKX1lbHNlIGFbZF09ZihhW2RdLGIsYyk7cmV0dXJuIGF9ZnVuY3Rpb24gZyhhLGIsYyl7dmFyIGQ9Yi5tYXRjaChrKTtpZihkKXt2YXIgZz1lKGIpO2YoYSxnLGMpfWVsc2V7dmFyIGg9YVtiXTtoPyhBcnJheS5pc0FycmF5KGgpfHwoYVtiXT1baF0pLGFbYl0ucHVzaChjKSk6YVtiXT1jfXJldHVybiBhfWZ1bmN0aW9uIGgoYSxiLGMpe3JldHVybiBjPWMucmVwbGFjZSgvKFxccik/XFxuL2csXCJcXHJcXG5cIiksYz1lbmNvZGVVUklDb21wb25lbnQoYyksYz1jLnJlcGxhY2UoLyUyMC9nLFwiK1wiKSxhKyhhP1wiJlwiOlwiXCIpK2VuY29kZVVSSUNvbXBvbmVudChiKStcIj1cIitjfXZhciBpPS9eKD86c3VibWl0fGJ1dHRvbnxpbWFnZXxyZXNldHxmaWxlKSQvaSxqPS9eKD86aW5wdXR8c2VsZWN0fHRleHRhcmVhfGtleWdlbikvaSxrPS8oXFxbW15cXFtcXF1dKlxcXSkvZztiLmV4cG9ydHM9ZH0se31dLDU6W2Z1bmN0aW9uKGIsYyxkKXsoZnVuY3Rpb24oZSl7IWZ1bmN0aW9uKGIpe2lmKFwib2JqZWN0XCI9PXR5cGVvZiBkJiZcInVuZGVmaW5lZFwiIT10eXBlb2YgYyljLmV4cG9ydHM9YigpO2Vsc2UgaWYoXCJmdW5jdGlvblwiPT10eXBlb2YgYSYmYS5hbWQpYShbXSxiKTtlbHNle3ZhciBmO2Y9XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIGU/ZTpcInVuZGVmaW5lZFwiIT10eXBlb2Ygc2VsZj9zZWxmOnRoaXMsZi52ZXhEaWFsb2c9YigpfX0oZnVuY3Rpb24oKXtyZXR1cm4gZnVuY3Rpb24gYShjLGQsZSl7ZnVuY3Rpb24gZihoLGkpe2lmKCFkW2hdKXtpZighY1toXSl7dmFyIGo9XCJmdW5jdGlvblwiPT10eXBlb2YgYiYmYjtpZighaSYmailyZXR1cm4gaihoLCEwKTtpZihnKXJldHVybiBnKGgsITApO3ZhciBrPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraCtcIidcIik7dGhyb3cgay5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGt9dmFyIGw9ZFtoXT17ZXhwb3J0czp7fX07Y1toXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihhKXt2YXIgYj1jW2hdWzFdW2FdO3JldHVybiBmKGI/YjphKX0sbCxsLmV4cG9ydHMsYSxjLGQsZSl9cmV0dXJuIGRbaF0uZXhwb3J0c31mb3IodmFyIGc9XCJmdW5jdGlvblwiPT10eXBlb2YgYiYmYixoPTA7aDxlLmxlbmd0aDtoKyspZihlW2hdKTtyZXR1cm4gZn0oezE6W2Z1bmN0aW9uKGEsYixjKXtmdW5jdGlvbiBkKGEsYil7aWYoXCJzdHJpbmdcIiE9dHlwZW9mIGEpdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN0cmluZyBleHBlY3RlZFwiKTtifHwoYj1kb2N1bWVudCk7dmFyIGM9LzwoW1xcdzpdKykvLmV4ZWMoYSk7aWYoIWMpcmV0dXJuIGIuY3JlYXRlVGV4dE5vZGUoYSk7YT1hLnJlcGxhY2UoL15cXHMrfFxccyskL2csXCJcIik7dmFyIGQ9Y1sxXTtpZihcImJvZHlcIj09ZCl7dmFyIGU9Yi5jcmVhdGVFbGVtZW50KFwiaHRtbFwiKTtyZXR1cm4gZS5pbm5lckhUTUw9YSxlLnJlbW92ZUNoaWxkKGUubGFzdENoaWxkKX12YXIgZj1nW2RdfHxnLl9kZWZhdWx0LGg9ZlswXSxpPWZbMV0saj1mWzJdLGU9Yi5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO2ZvcihlLmlubmVySFRNTD1pK2ErajtoLS07KWU9ZS5sYXN0Q2hpbGQ7aWYoZS5maXJzdENoaWxkPT1lLmxhc3RDaGlsZClyZXR1cm4gZS5yZW1vdmVDaGlsZChlLmZpcnN0Q2hpbGQpO2Zvcih2YXIgaz1iLmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtlLmZpcnN0Q2hpbGQ7KWsuYXBwZW5kQ2hpbGQoZS5yZW1vdmVDaGlsZChlLmZpcnN0Q2hpbGQpKTtyZXR1cm4ga31iLmV4cG9ydHM9ZDt2YXIgZSxmPSExO1widW5kZWZpbmVkXCIhPXR5cGVvZiBkb2N1bWVudCYmKGU9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKSxlLmlubmVySFRNTD0nICA8bGluay8+PHRhYmxlPjwvdGFibGU+PGEgaHJlZj1cIi9hXCI+YTwvYT48aW5wdXQgdHlwZT1cImNoZWNrYm94XCIvPicsZj0hZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImxpbmtcIikubGVuZ3RoLGU9dm9pZCAwKTt2YXIgZz17bGVnZW5kOlsxLFwiPGZpZWxkc2V0PlwiLFwiPC9maWVsZHNldD5cIl0sdHI6WzIsXCI8dGFibGU+PHRib2R5PlwiLFwiPC90Ym9keT48L3RhYmxlPlwiXSxjb2w6WzIsXCI8dGFibGU+PHRib2R5PjwvdGJvZHk+PGNvbGdyb3VwPlwiLFwiPC9jb2xncm91cD48L3RhYmxlPlwiXSxfZGVmYXVsdDpmP1sxLFwiWDxkaXY+XCIsXCI8L2Rpdj5cIl06WzAsXCJcIixcIlwiXX07Zy50ZD1nLnRoPVszLFwiPHRhYmxlPjx0Ym9keT48dHI+XCIsXCI8L3RyPjwvdGJvZHk+PC90YWJsZT5cIl0sZy5vcHRpb249Zy5vcHRncm91cD1bMSwnPHNlbGVjdCBtdWx0aXBsZT1cIm11bHRpcGxlXCI+JyxcIjwvc2VsZWN0PlwiXSxnLnRoZWFkPWcudGJvZHk9Zy5jb2xncm91cD1nLmNhcHRpb249Zy50Zm9vdD1bMSxcIjx0YWJsZT5cIixcIjwvdGFibGU+XCJdLGcucG9seWxpbmU9Zy5lbGxpcHNlPWcucG9seWdvbj1nLmNpcmNsZT1nLnRleHQ9Zy5saW5lPWcucGF0aD1nLnJlY3Q9Zy5nPVsxLCc8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2ZXJzaW9uPVwiMS4xXCI+JyxcIjwvc3ZnPlwiXX0se31dLDI6W2Z1bmN0aW9uKGEsYixjKXtmdW5jdGlvbiBkKGEsYil7XCJvYmplY3RcIiE9dHlwZW9mIGI/Yj17aGFzaDohIWJ9OnZvaWQgMD09PWIuaGFzaCYmKGIuaGFzaD0hMCk7Zm9yKHZhciBjPWIuaGFzaD97fTpcIlwiLGQ9Yi5zZXJpYWxpemVyfHwoYi5oYXNoP2c6aCksZT1hJiZhLmVsZW1lbnRzP2EuZWxlbWVudHM6W10sZj1PYmplY3QuY3JlYXRlKG51bGwpLGs9MDtrPGUubGVuZ3RoOysrayl7dmFyIGw9ZVtrXTtpZigoYi5kaXNhYmxlZHx8IWwuZGlzYWJsZWQpJiZsLm5hbWUmJmoudGVzdChsLm5vZGVOYW1lKSYmIWkudGVzdChsLnR5cGUpKXt2YXIgbT1sLm5hbWUsbj1sLnZhbHVlO2lmKFwiY2hlY2tib3hcIiE9PWwudHlwZSYmXCJyYWRpb1wiIT09bC50eXBlfHxsLmNoZWNrZWR8fChuPXZvaWQgMCksYi5lbXB0eSl7aWYoXCJjaGVja2JveFwiIT09bC50eXBlfHxsLmNoZWNrZWR8fChuPVwiXCIpLFwicmFkaW9cIj09PWwudHlwZSYmKGZbbC5uYW1lXXx8bC5jaGVja2VkP2wuY2hlY2tlZCYmKGZbbC5uYW1lXT0hMCk6ZltsLm5hbWVdPSExKSwhbiYmXCJyYWRpb1wiPT1sLnR5cGUpY29udGludWV9ZWxzZSBpZighbiljb250aW51ZTtpZihcInNlbGVjdC1tdWx0aXBsZVwiIT09bC50eXBlKWM9ZChjLG0sbik7ZWxzZXtuPVtdO2Zvcih2YXIgbz1sLm9wdGlvbnMscD0hMSxxPTA7cTxvLmxlbmd0aDsrK3Epe3ZhciByPW9bcV0scz1iLmVtcHR5JiYhci52YWx1ZSx0PXIudmFsdWV8fHM7ci5zZWxlY3RlZCYmdCYmKHA9ITAsYz1iLmhhc2gmJlwiW11cIiE9PW0uc2xpY2UobS5sZW5ndGgtMik/ZChjLG0rXCJbXVwiLHIudmFsdWUpOmQoYyxtLHIudmFsdWUpKX0hcCYmYi5lbXB0eSYmKGM9ZChjLG0sXCJcIikpfX19aWYoYi5lbXB0eSlmb3IodmFyIG0gaW4gZilmW21dfHwoYz1kKGMsbSxcIlwiKSk7cmV0dXJuIGN9ZnVuY3Rpb24gZShhKXt2YXIgYj1bXSxjPS9eKFteXFxbXFxdXSopLyxkPW5ldyBSZWdFeHAoayksZT1jLmV4ZWMoYSk7Zm9yKGVbMV0mJmIucHVzaChlWzFdKTtudWxsIT09KGU9ZC5leGVjKGEpKTspYi5wdXNoKGVbMV0pO3JldHVybiBifWZ1bmN0aW9uIGYoYSxiLGMpe2lmKDA9PT1iLmxlbmd0aClyZXR1cm4gYT1jO3ZhciBkPWIuc2hpZnQoKSxlPWQubWF0Y2goL15cXFsoLis/KVxcXSQvKTtpZihcIltdXCI9PT1kKXJldHVybiBhPWF8fFtdLEFycmF5LmlzQXJyYXkoYSk/YS5wdXNoKGYobnVsbCxiLGMpKTooYS5fdmFsdWVzPWEuX3ZhbHVlc3x8W10sYS5fdmFsdWVzLnB1c2goZihudWxsLGIsYykpKSxhO2lmKGUpe3ZhciBnPWVbMV0saD0rZztpc05hTihoKT8oYT1hfHx7fSxhW2ddPWYoYVtnXSxiLGMpKTooYT1hfHxbXSxhW2hdPWYoYVtoXSxiLGMpKX1lbHNlIGFbZF09ZihhW2RdLGIsYyk7cmV0dXJuIGF9ZnVuY3Rpb24gZyhhLGIsYyl7dmFyIGQ9Yi5tYXRjaChrKTtpZihkKXt2YXIgZz1lKGIpO2YoYSxnLGMpfWVsc2V7dmFyIGg9YVtiXTtoPyhBcnJheS5pc0FycmF5KGgpfHwoYVtiXT1baF0pLGFbYl0ucHVzaChjKSk6YVtiXT1jfXJldHVybiBhfWZ1bmN0aW9uIGgoYSxiLGMpe3JldHVybiBjPWMucmVwbGFjZSgvKFxccik/XFxuL2csXCJcXHJcXG5cIiksYz1lbmNvZGVVUklDb21wb25lbnQoYyksYz1jLnJlcGxhY2UoLyUyMC9nLFwiK1wiKSxhKyhhP1wiJlwiOlwiXCIpK2VuY29kZVVSSUNvbXBvbmVudChiKStcIj1cIitjfXZhciBpPS9eKD86c3VibWl0fGJ1dHRvbnxpbWFnZXxyZXNldHxmaWxlKSQvaSxqPS9eKD86aW5wdXR8c2VsZWN0fHRleHRhcmVhfGtleWdlbikvaSxrPS8oXFxbW15cXFtcXF1dKlxcXSkvZztiLmV4cG9ydHM9ZH0se31dLDM6W2Z1bmN0aW9uKGEsYixjKXt2YXIgZD1hKFwiZG9taWZ5XCIpLGU9YShcImZvcm0tc2VyaWFsaXplXCIpLGY9ZnVuY3Rpb24oYSl7dmFyIGI9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImZvcm1cIik7Yi5jbGFzc0xpc3QuYWRkKFwidmV4LWRpYWxvZy1mb3JtXCIpO3ZhciBjPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7Yy5jbGFzc0xpc3QuYWRkKFwidmV4LWRpYWxvZy1tZXNzYWdlXCIpLGMuYXBwZW5kQ2hpbGQoYS5tZXNzYWdlIGluc3RhbmNlb2Ygd2luZG93Lk5vZGU/YS5tZXNzYWdlOmQoYS5tZXNzYWdlKSk7dmFyIGU9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtyZXR1cm4gZS5jbGFzc0xpc3QuYWRkKFwidmV4LWRpYWxvZy1pbnB1dFwiKSxlLmFwcGVuZENoaWxkKGEuaW5wdXQgaW5zdGFuY2VvZiB3aW5kb3cuTm9kZT9hLmlucHV0OmQoYS5pbnB1dCkpLGIuYXBwZW5kQ2hpbGQoYyksYi5hcHBlbmRDaGlsZChlKSxifSxnPWZ1bmN0aW9uKGEpe3ZhciBiPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7Yi5jbGFzc0xpc3QuYWRkKFwidmV4LWRpYWxvZy1idXR0b25zXCIpO2Zvcih2YXIgYz0wO2M8YS5sZW5ndGg7YysrKXt2YXIgZD1hW2NdLGU9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtlLnR5cGU9ZC50eXBlLGUudGV4dENvbnRlbnQ9ZC50ZXh0LGUuY2xhc3NOYW1lPWQuY2xhc3NOYW1lLGUuY2xhc3NMaXN0LmFkZChcInZleC1kaWFsb2ctYnV0dG9uXCIpLDA9PT1jP2UuY2xhc3NMaXN0LmFkZChcInZleC1maXJzdFwiKTpjPT09YS5sZW5ndGgtMSYmZS5jbGFzc0xpc3QuYWRkKFwidmV4LWxhc3RcIiksZnVuY3Rpb24oYSl7ZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIixmdW5jdGlvbihiKXthLmNsaWNrJiZhLmNsaWNrLmNhbGwodGhpcyxiKX0uYmluZCh0aGlzKSl9LmJpbmQodGhpcykoZCksYi5hcHBlbmRDaGlsZChlKX1yZXR1cm4gYn0saD1mdW5jdGlvbihhKXt2YXIgYj17bmFtZTpcImRpYWxvZ1wiLG9wZW46ZnVuY3Rpb24oYil7dmFyIGM9T2JqZWN0LmFzc2lnbih7fSx0aGlzLmRlZmF1bHRPcHRpb25zLGIpO2MudW5zYWZlTWVzc2FnZSYmIWMubWVzc2FnZT9jLm1lc3NhZ2U9Yy51bnNhZmVNZXNzYWdlOmMubWVzc2FnZSYmKGMubWVzc2FnZT1hLl9lc2NhcGVIdG1sKGMubWVzc2FnZSkpO3ZhciBkPWMudW5zYWZlQ29udGVudD1mKGMpLGU9YS5vcGVuKGMpLGg9Yy5iZWZvcmVDbG9zZSYmYy5iZWZvcmVDbG9zZS5iaW5kKGUpO2lmKGUub3B0aW9ucy5iZWZvcmVDbG9zZT1mdW5jdGlvbigpe3ZhciBhPSFofHxoKCk7cmV0dXJuIGEmJmMuY2FsbGJhY2sodGhpcy52YWx1ZXx8ITEpLGF9LmJpbmQoZSksZC5hcHBlbmRDaGlsZChnLmNhbGwoZSxjLmJ1dHRvbnMpKSxlLmZvcm09ZCxkLmFkZEV2ZW50TGlzdGVuZXIoXCJzdWJtaXRcIixjLm9uU3VibWl0LmJpbmQoZSkpLGMuZm9jdXNGaXJzdElucHV0KXt2YXIgaT1lLmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKFwiYnV0dG9uLCBpbnB1dCwgc2VsZWN0LCB0ZXh0YXJlYVwiKTtpJiZpLmZvY3VzKCl9cmV0dXJuIGV9LGFsZXJ0OmZ1bmN0aW9uKGEpe3JldHVyblwic3RyaW5nXCI9PXR5cGVvZiBhJiYoYT17bWVzc2FnZTphfSksYT1PYmplY3QuYXNzaWduKHt9LHRoaXMuZGVmYXVsdE9wdGlvbnMsdGhpcy5kZWZhdWx0QWxlcnRPcHRpb25zLGEpLHRoaXMub3BlbihhKX0sY29uZmlybTpmdW5jdGlvbihhKXtpZihcIm9iamVjdFwiIT10eXBlb2YgYXx8XCJmdW5jdGlvblwiIT10eXBlb2YgYS5jYWxsYmFjayl0aHJvdyBuZXcgRXJyb3IoXCJkaWFsb2cuY29uZmlybShvcHRpb25zKSByZXF1aXJlcyBvcHRpb25zLmNhbGxiYWNrLlwiKTtyZXR1cm4gYT1PYmplY3QuYXNzaWduKHt9LHRoaXMuZGVmYXVsdE9wdGlvbnMsdGhpcy5kZWZhdWx0Q29uZmlybU9wdGlvbnMsYSksdGhpcy5vcGVuKGEpfSxwcm9tcHQ6ZnVuY3Rpb24oYil7aWYoXCJvYmplY3RcIiE9dHlwZW9mIGJ8fFwiZnVuY3Rpb25cIiE9dHlwZW9mIGIuY2FsbGJhY2spdGhyb3cgbmV3IEVycm9yKFwiZGlhbG9nLnByb21wdChvcHRpb25zKSByZXF1aXJlcyBvcHRpb25zLmNhbGxiYWNrLlwiKTt2YXIgYz1PYmplY3QuYXNzaWduKHt9LHRoaXMuZGVmYXVsdE9wdGlvbnMsdGhpcy5kZWZhdWx0UHJvbXB0T3B0aW9ucyksZD17dW5zYWZlTWVzc2FnZTonPGxhYmVsIGZvcj1cInZleFwiPicrYS5fZXNjYXBlSHRtbChiLmxhYmVsfHxjLmxhYmVsKStcIjwvbGFiZWw+XCIsaW5wdXQ6JzxpbnB1dCBuYW1lPVwidmV4XCIgdHlwZT1cInRleHRcIiBjbGFzcz1cInZleC1kaWFsb2ctcHJvbXB0LWlucHV0XCIgcGxhY2Vob2xkZXI9XCInK2EuX2VzY2FwZUh0bWwoYi5wbGFjZWhvbGRlcnx8Yy5wbGFjZWhvbGRlcikrJ1wiIHZhbHVlPVwiJythLl9lc2NhcGVIdG1sKGIudmFsdWV8fGMudmFsdWUpKydcIiAvPid9O2I9T2JqZWN0LmFzc2lnbihjLGQsYik7dmFyIGU9Yi5jYWxsYmFjaztyZXR1cm4gYi5jYWxsYmFjaz1mdW5jdGlvbihhKXtpZihcIm9iamVjdFwiPT10eXBlb2YgYSl7dmFyIGI9T2JqZWN0LmtleXMoYSk7YT1iLmxlbmd0aD9hW2JbMF1dOlwiXCJ9ZShhKX0sdGhpcy5vcGVuKGIpfX07cmV0dXJuIGIuYnV0dG9ucz17WUVTOnt0ZXh0OlwiT0tcIix0eXBlOlwic3VibWl0XCIsY2xhc3NOYW1lOlwidmV4LWRpYWxvZy1idXR0b24tcHJpbWFyeVwiLGNsaWNrOmZ1bmN0aW9uKCl7dGhpcy52YWx1ZT0hMH19LE5POnt0ZXh0OlwiQ2FuY2VsXCIsdHlwZTpcImJ1dHRvblwiLGNsYXNzTmFtZTpcInZleC1kaWFsb2ctYnV0dG9uLXNlY29uZGFyeVwiLGNsaWNrOmZ1bmN0aW9uKCl7dGhpcy52YWx1ZT0hMSx0aGlzLmNsb3NlKCl9fX0sYi5kZWZhdWx0T3B0aW9ucz17Y2FsbGJhY2s6ZnVuY3Rpb24oKXt9LGFmdGVyT3BlbjpmdW5jdGlvbigpe30sbWVzc2FnZTpcIlwiLGlucHV0OlwiXCIsYnV0dG9uczpbYi5idXR0b25zLllFUyxiLmJ1dHRvbnMuTk9dLHNob3dDbG9zZUJ1dHRvbjohMSxvblN1Ym1pdDpmdW5jdGlvbihhKXtyZXR1cm4gYS5wcmV2ZW50RGVmYXVsdCgpLHRoaXMub3B0aW9ucy5pbnB1dCYmKHRoaXMudmFsdWU9ZSh0aGlzLmZvcm0se2hhc2g6ITB9KSksdGhpcy5jbG9zZSgpfSxmb2N1c0ZpcnN0SW5wdXQ6ITB9LGIuZGVmYXVsdEFsZXJ0T3B0aW9ucz17YnV0dG9uczpbYi5idXR0b25zLllFU119LGIuZGVmYXVsdFByb21wdE9wdGlvbnM9e2xhYmVsOlwiUHJvbXB0OlwiLHBsYWNlaG9sZGVyOlwiXCIsdmFsdWU6XCJcIn0sYi5kZWZhdWx0Q29uZmlybU9wdGlvbnM9e30sYn07Yi5leHBvcnRzPWh9LHtkb21pZnk6MSxcImZvcm0tc2VyaWFsaXplXCI6Mn1dfSx7fSxbM10pKDMpfSl9KS5jYWxsKHRoaXMsXCJ1bmRlZmluZWRcIiE9dHlwZW9mIGdsb2JhbD9nbG9iYWw6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHNlbGY/c2VsZjpcInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93P3dpbmRvdzp7fSl9LHtkb21pZnk6MixcImZvcm0tc2VyaWFsaXplXCI6NH1dLDY6W2Z1bmN0aW9uKGEsYixjKXt2YXIgZD1hKFwiLi92ZXhcIik7ZC5yZWdpc3RlclBsdWdpbihhKFwidmV4LWRpYWxvZ1wiKSksYi5leHBvcnRzPWR9LHtcIi4vdmV4XCI6NyxcInZleC1kaWFsb2dcIjo1fV0sNzpbZnVuY3Rpb24oYSxiLGMpe2EoXCJjbGFzc2xpc3QtcG9seWZpbGxcIiksYShcImVzNi1vYmplY3QtYXNzaWduXCIpLnBvbHlmaWxsKCk7dmFyIGQ9YShcImRvbWlmeVwiKSxlPWZ1bmN0aW9uKGEpe2lmKFwidW5kZWZpbmVkXCIhPXR5cGVvZiBhKXt2YXIgYj1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO3JldHVybiBiLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGEpKSxiLmlubmVySFRNTH1yZXR1cm5cIlwifSxmPWZ1bmN0aW9uKGEsYil7aWYoXCJzdHJpbmdcIj09dHlwZW9mIGImJjAhPT1iLmxlbmd0aClmb3IodmFyIGM9Yi5zcGxpdChcIiBcIiksZD0wO2Q8Yy5sZW5ndGg7ZCsrKXt2YXIgZT1jW2RdO2UubGVuZ3RoJiZhLmNsYXNzTGlzdC5hZGQoZSl9fSxnPWZ1bmN0aW9uKCl7dmFyIGE9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKSxiPXtXZWJraXRBbmltYXRpb246XCJ3ZWJraXRBbmltYXRpb25FbmRcIixNb3pBbmltYXRpb246XCJhbmltYXRpb25lbmRcIixPQW5pbWF0aW9uOlwib2FuaW1hdGlvbmVuZFwiLG1zQW5pbWF0aW9uOlwiTVNBbmltYXRpb25FbmRcIixhbmltYXRpb246XCJhbmltYXRpb25lbmRcIn07Zm9yKHZhciBjIGluIGIpaWYodm9pZCAwIT09YS5zdHlsZVtjXSlyZXR1cm4gYltjXTtyZXR1cm4hMX0oKSxoPXt2ZXg6XCJ2ZXhcIixjb250ZW50OlwidmV4LWNvbnRlbnRcIixvdmVybGF5OlwidmV4LW92ZXJsYXlcIixjbG9zZTpcInZleC1jbG9zZVwiLGNsb3Npbmc6XCJ2ZXgtY2xvc2luZ1wiLG9wZW46XCJ2ZXgtb3BlblwifSxpPXt9LGo9MSxrPSExLGw9e29wZW46ZnVuY3Rpb24oYSl7dmFyIGI9ZnVuY3Rpb24oYSl7Y29uc29sZS53YXJuKCdUaGUgXCInK2ErJ1wiIHByb3BlcnR5IGlzIGRlcHJlY2F0ZWQgaW4gdmV4IDMuIFVzZSBDU1MgY2xhc3NlcyBhbmQgdGhlIGFwcHJvcHJpYXRlIFwiQ2xhc3NOYW1lXCIgb3B0aW9ucywgaW5zdGVhZC4nKSxjb25zb2xlLndhcm4oXCJTZWUgaHR0cDovL2dpdGh1Yi5odWJzcG90LmNvbS92ZXgvYXBpL2FkdmFuY2VkLyNvcHRpb25zXCIpfTthLmNzcyYmYihcImNzc1wiKSxhLm92ZXJsYXlDU1MmJmIoXCJvdmVybGF5Q1NTXCIpLGEuY29udGVudENTUyYmYihcImNvbnRlbnRDU1NcIiksYS5jbG9zZUNTUyYmYihcImNsb3NlQ1NTXCIpO3ZhciBjPXt9O2MuaWQ9aisrLGlbYy5pZF09YyxjLmlzT3Blbj0hMCxjLmNsb3NlPWZ1bmN0aW9uKCl7ZnVuY3Rpb24gYShhKXtyZXR1cm5cIm5vbmVcIiE9PWQuZ2V0UHJvcGVydHlWYWx1ZShhK1wiYW5pbWF0aW9uLW5hbWVcIikmJlwiMHNcIiE9PWQuZ2V0UHJvcGVydHlWYWx1ZShhK1wiYW5pbWF0aW9uLWR1cmF0aW9uXCIpfWlmKCF0aGlzLmlzT3BlbilyZXR1cm4hMDt2YXIgYj10aGlzLm9wdGlvbnM7aWYoayYmIWIuZXNjYXBlQnV0dG9uQ2xvc2VzKXJldHVybiExO3ZhciBjPWZ1bmN0aW9uKCl7cmV0dXJuIWIuYmVmb3JlQ2xvc2V8fGIuYmVmb3JlQ2xvc2UuY2FsbCh0aGlzKX0uYmluZCh0aGlzKSgpO2lmKGM9PT0hMSlyZXR1cm4hMTt0aGlzLmlzT3Blbj0hMTt2YXIgZD13aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLmNvbnRlbnRFbCksZT1hKFwiXCIpfHxhKFwiLXdlYmtpdC1cIil8fGEoXCItbW96LVwiKXx8YShcIi1vLVwiKSxmPWZ1bmN0aW9uIGooKXt0aGlzLnJvb3RFbC5wYXJlbnROb2RlJiYodGhpcy5yb290RWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihnLGopLGRlbGV0ZSBpW3RoaXMuaWRdLHRoaXMucm9vdEVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5yb290RWwpLGIuYWZ0ZXJDbG9zZSYmYi5hZnRlckNsb3NlLmNhbGwodGhpcyksMD09PU9iamVjdC5rZXlzKGkpLmxlbmd0aCYmZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKGgub3BlbikpfS5iaW5kKHRoaXMpO3JldHVybiBnJiZlPyh0aGlzLnJvb3RFbC5hZGRFdmVudExpc3RlbmVyKGcsZiksdGhpcy5yb290RWwuY2xhc3NMaXN0LmFkZChoLmNsb3NpbmcpKTpmKCksITB9LFwic3RyaW5nXCI9PXR5cGVvZiBhJiYoYT17Y29udGVudDphfSksYS51bnNhZmVDb250ZW50JiYhYS5jb250ZW50P2EuY29udGVudD1hLnVuc2FmZUNvbnRlbnQ6YS5jb250ZW50JiYoYS5jb250ZW50PWUoYS5jb250ZW50KSk7dmFyIG09Yy5vcHRpb25zPU9iamVjdC5hc3NpZ24oe30sbC5kZWZhdWx0T3B0aW9ucyxhKSxuPWMucm9vdEVsPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7bi5jbGFzc0xpc3QuYWRkKGgudmV4KSxmKG4sbS5jbGFzc05hbWUpO3ZhciBvPWMub3ZlcmxheUVsPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7by5jbGFzc0xpc3QuYWRkKGgub3ZlcmxheSksZihvLG0ub3ZlcmxheUNsYXNzTmFtZSksbS5vdmVybGF5Q2xvc2VzT25DbGljayYmby5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIixmdW5jdGlvbihhKXthLnRhcmdldD09PW8mJmMuY2xvc2UoKX0pLG4uYXBwZW5kQ2hpbGQobyk7dmFyIHA9Yy5jb250ZW50RWw9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtpZihwLmNsYXNzTGlzdC5hZGQoaC5jb250ZW50KSxmKHAsbS5jb250ZW50Q2xhc3NOYW1lKSxwLmFwcGVuZENoaWxkKG0uY29udGVudCBpbnN0YW5jZW9mIHdpbmRvdy5Ob2RlP20uY29udGVudDpkKG0uY29udGVudCkpLG4uYXBwZW5kQ2hpbGQocCksbS5zaG93Q2xvc2VCdXR0b24pe3ZhciBxPWMuY2xvc2VFbD1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO3EuY2xhc3NMaXN0LmFkZChoLmNsb3NlKSxmKHEsbS5jbG9zZUNsYXNzTmFtZSkscS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIixjLmNsb3NlLmJpbmQoYykpLHAuYXBwZW5kQ2hpbGQocSl9cmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IobS5hcHBlbmRMb2NhdGlvbikuYXBwZW5kQ2hpbGQobiksbS5hZnRlck9wZW4mJm0uYWZ0ZXJPcGVuLmNhbGwoYyksZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKGgub3BlbiksY30sY2xvc2U6ZnVuY3Rpb24oYSl7dmFyIGI7aWYoYS5pZCliPWEuaWQ7ZWxzZXtpZihcInN0cmluZ1wiIT10eXBlb2YgYSl0aHJvdyBuZXcgVHlwZUVycm9yKFwiY2xvc2UgcmVxdWlyZXMgYSB2ZXggb2JqZWN0IG9yIGlkIHN0cmluZ1wiKTtiPWF9cmV0dXJuISFpW2JdJiZpW2JdLmNsb3NlKCl9LGNsb3NlVG9wOmZ1bmN0aW9uKCl7dmFyIGE9T2JqZWN0LmtleXMoaSk7cmV0dXJuISFhLmxlbmd0aCYmaVthW2EubGVuZ3RoLTFdXS5jbG9zZSgpfSxjbG9zZUFsbDpmdW5jdGlvbigpe2Zvcih2YXIgYSBpbiBpKXRoaXMuY2xvc2UoYSk7cmV0dXJuITB9LGdldEFsbDpmdW5jdGlvbigpe3JldHVybiBpfSxnZXRCeUlkOmZ1bmN0aW9uKGEpe3JldHVybiBpW2FdfX07d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLGZ1bmN0aW9uKGEpezI3PT09YS5rZXlDb2RlJiYoaz0hMCxsLmNsb3NlVG9wKCksaz0hMSl9KSx3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInBvcHN0YXRlXCIsZnVuY3Rpb24oKXtsLmRlZmF1bHRPcHRpb25zLmNsb3NlQWxsT25Qb3BTdGF0ZSYmbC5jbG9zZUFsbCgpfSksbC5kZWZhdWx0T3B0aW9ucz17Y29udGVudDpcIlwiLHNob3dDbG9zZUJ1dHRvbjohMCxlc2NhcGVCdXR0b25DbG9zZXM6ITAsb3ZlcmxheUNsb3Nlc09uQ2xpY2s6ITAsYXBwZW5kTG9jYXRpb246XCJib2R5XCIsY2xhc3NOYW1lOlwiXCIsb3ZlcmxheUNsYXNzTmFtZTpcIlwiLGNvbnRlbnRDbGFzc05hbWU6XCJcIixjbG9zZUNsYXNzTmFtZTpcIlwiLGNsb3NlQWxsT25Qb3BTdGF0ZTohMH0sT2JqZWN0LmRlZmluZVByb3BlcnR5KGwsXCJfZXNjYXBlSHRtbFwiLHtjb25maWd1cmFibGU6ITEsZW51bWVyYWJsZTohMSx3cml0YWJsZTohMSx2YWx1ZTplfSksbC5yZWdpc3RlclBsdWdpbj1mdW5jdGlvbihhLGIpe3ZhciBjPWEobCksZD1ifHxjLm5hbWU7aWYobFtkXSl0aHJvdyBuZXcgRXJyb3IoXCJQbHVnaW4gXCIrYitcIiBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQuXCIpO2xbZF09Y30sYi5leHBvcnRzPWx9LHtcImNsYXNzbGlzdC1wb2x5ZmlsbFwiOjEsZG9taWZ5OjIsXCJlczYtb2JqZWN0LWFzc2lnblwiOjN9XX0se30sWzZdKSg2KX0pO1xuIl19
