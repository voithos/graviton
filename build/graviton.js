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
        this.collisionsOffBtn = args.collisionsOffBtn = this.controls.querySelector('#collisionsoffbtn');
        this.collisionsOnBtn = args.collisionsOnBtn = this.controls.querySelector('#collisionsonbtn');
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

                    case _events.CONTROLCODES.COLLISIONSOFFBTN:
                        this.toggleCollisions();
                        break;

                    case _events.CONTROLCODES.COLLISIONSONBTN:
                        this.toggleCollisions();
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
        key: 'toggleCollisions',
        value: function toggleCollisions() {
            this.sim.mergeCollisions = !this.sim.mergeCollisions;
            if (this.sim.mergeCollisions) {
                this.collisionsOffBtn.style.display = 'none';
                this.collisionsOnBtn.style.display = '';
            } else {
                this.collisionsOffBtn.style.display = '';
                this.collisionsOnBtn.style.display = 'none';
            }
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
            this.controls.innerHTML = '\n            <menuitem id="playbtn" data-tooltip="Start simulation">\n                <img src="assets/play.svg" alt="Start simulation">\n            </menuitem>\n            <menuitem id="pausebtn" style="display: none;" data-tooltip="Stop simulation">\n                <img src="assets/pause.svg" alt="Stop simulation">\n            </menuitem>\n            <menuitem id="barneshutonbtn" data-tooltip="Switch to brute force">\n                <img src="assets/barnes_hut_on.svg" alt="Switch to brute force">\n            </menuitem>\n            <menuitem id="barneshutoffbtn" style="display: none;" data-tooltip="Switch to Barnes-Hut">\n                <img src="assets/barnes_hut_off.svg" alt="Switch to Barnes-Hut">\n            </menuitem>\n            <menuitem id="quadtreeoffbtn" data-tooltip="Toggle quadtree lines">\n                <img src="assets/quadtree_off.svg" alt="Toggle quadtree lines">\n            </menuitem>\n            <menuitem id="quadtreeonbtn" style="display: none;" data-tooltip="Toggle quadtree lines">\n                <img src="assets/quadtree_on.svg" alt="Toggle quadtree lines">\n            </menuitem>\n            <menuitem id="collisionsonbtn" data-tooltip="Toggle collisions">\n                <img src="assets/collisions_on.svg" alt="Toggle collisions">\n            </menuitem>\n            <menuitem id="collisionsoffbtn" style="display: none;" data-tooltip="Toggle collisions">\n                <img src="assets/collisions_off.svg" alt="Toggle collisions">\n            </menuitem>\n            <menuitem id="trailoffbtn" data-tooltip="Toggle trails">\n                <img src="assets/trail_off.svg" alt="Toggle trails">\n            </menuitem>\n            <menuitem id="trailonbtn" style="display: none;" data-tooltip="Toggle trails">\n                <img src="assets/trail_on.svg" alt="Toggle trails">\n            </menuitem>\n            <menuitem id="helpbtn" data-tooltip="Shortcuts">\n                <img src="assets/help.svg" alt="Shortcuts">\n            </menuitem>\n            ';

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
    BARNESHUTOFFBTN: 2008,
    COLLISIONSOFFBTN: 2009,
    COLLISIONSONBTN: 2010
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
        this.collisionsOffBtn = args.collisionsOffBtn;
        this.collisionsOnBtn = args.collisionsOnBtn;
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
            this.collisionsOnBtn.addEventListener('click', this.handleControlClick.bind(this, CONTROLCODES.COLLISIONSONBTN));
            this.collisionsOffBtn.addEventListener('click', this.handleControlClick.bind(this, CONTROLCODES.COLLISIONSOFFBTN));
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
        this.mergeCollisions = true;

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
            if (this.mergeCollisions) {
                this._mergeCollided();
            }
            this._removeScattered();

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

                if (body.x > this.scatterLimitX || body.x < -this.scatterLimitX || body.y > this.scatterLimitY || body.y < -this.scatterLimitY) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZ3Jhdml0b24uanMiLCJzcmMvZ3Jhdml0b24vYXBwLmpzIiwic3JjL2dyYXZpdG9uL2JvZHkuanMiLCJzcmMvZ3Jhdml0b24vZXZlbnRzLmpzIiwic3JjL2dyYXZpdG9uL2dmeC5qcyIsInNyYy9ncmF2aXRvbi9zaW0uanMiLCJzcmMvZ3Jhdml0b24vdGltZXIuanMiLCJzcmMvZ3Jhdml0b24vdHJlZS5qcyIsInNyYy9tYWluLmpzIiwic3JjL3BvbHlmaWxscy5qcyIsInNyYy91dGlsL2NvbG9ycy5qcyIsInNyYy91dGlsL2Vudi5qcyIsInNyYy91dGlsL3JhbmRvbS5qcyIsInNyYy92ZW5kb3IvanNjb2xvci5qcyIsInNyYy92ZW5kb3IvdmV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7O2tCQ2FlLEVBQUUsR0FBRyxlQUFPLEVBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUNEUixLQUFLO0FBQ3RCLGFBRGlCLEtBQUssR0FDQzs4QkFETixLQUFLOztZQUNWLElBQUkseURBQUcsRUFBRTs7QUFDakIsWUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7O0FBRWpCLFlBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ2xCLFlBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDOztBQUVqQixZQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztBQUN0QixZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQzs7QUFFckIsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7QUFDbkIsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7QUFDaEIsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7O0FBRWhCLFlBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0FBQ3JCLFlB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QUFFO0FBQzNCLFVBQUksRUFBRSxHQUFHLENBQ1IsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUNMLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQ2pCLENBQUM7TUFDRixNQUFNO0FBQ04sVUFBSSxFQUFFLEdBQUcsQ0FDUixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FDeEIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUNyRixFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQ04sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUNwQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FDaEcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxBQUFDLENBQ2pFLENBQUM7TUFDRjs7QUFFRCxTQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDZCxTQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDZCxTQUFJLGFBQWEsR0FBRyxPQUFPLENBQUMsS0FBSyxHQUFHLE9BQU8sR0FBRyxVQUFVLENBQUM7QUFDekQsU0FBSSxjQUFjLEdBQ2pCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUEsSUFDOUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMs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LEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQzFCLENBQUMsS0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQzFCLENBQUMsS0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQzFCLENBQUM7QUFDRixTQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLEVBQUU7QUFDcEIsVUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ2pEO0FBQ0QsU0FBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQ2pCLFVBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDOUY7QUFDRCxTQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7O0FBQUMsQUFHOUYsU0FBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekQsU0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckIsU0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckIsU0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRXJCLFNBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDeEIsQ0FBQzs7QUFHRixRQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsR0FBRyxFQUFFLEtBQUssRUFBRTtBQUN2QyxTQUFJLENBQUMsQ0FBQztBQUNOLFNBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsc0NBQXNDLENBQUMsRUFBRTs7OztBQUkxRCxVQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFOztBQUV0QixXQUFJLENBQUMsT0FBTyxDQUNYLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsRUFBQyxFQUFFLENBQUMsRUFDN0IsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxFQUFDLEVBQUUsQ0FBQyxFQUM3QixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEVBQUMsRUFBRSxDQUFDLEVBQzdCLEtBQUssQ0FDTCxDQUFDO09BQ0YsTUFBTTs7QUFFTixXQUFJLENBQUMsT0FBTyxDQUNYLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUMsRUFBRSxDQUFDLEVBQzVDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUMsRUFBRSxDQUFDLEVBQzVDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUMsRUFBRSxDQUFDLEVBQzVDLEtBQUssQ0FDTCxDQUFDO09BQ0Y7QUFDRCxhQUFPLElBQUksQ0FBQztNQUVaLE1BQU0sSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxFQUFFO0FBQ3RELFVBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDN0IsVUFBSSxFQUFFLEdBQUcsdUJBQXVCLENBQUM7QUFDakMsVUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztBQUNmLFVBQ0MsTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDLEtBQ2pCLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFBLEFBQUMsS0FDekIsRUFBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUEsQUFBQyxLQUN6QixFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQSxBQUFDLEVBQ3pCO0FBQ0QsV0FBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQSxJQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUEsQUFBQyxDQUFDLENBQUM7QUFDbkQsV0FBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQSxJQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUEsQUFBQyxDQUFDLENBQUM7QUFDbkQsV0FBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQSxJQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUEsQUFBQyxDQUFDLENBQUM7QUFDbkQsV0FBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUM3QixjQUFPLElBQUksQ0FBQztPQUNaO01BQ0Q7QUFDRCxZQUFPLEtBQUssQ0FBQztLQUNiLENBQUM7O0FBR0YsUUFBSSxDQUFDLFFBQVEsR0FBRyxZQUFZO0FBQzNCLFlBQ0MsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUEsQ0FBRSxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUN4RCxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQSxDQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQ3hELENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBLENBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FDdkQ7S0FDRixDQUFDOztBQUdGLFFBQUksQ0FBQyxXQUFXLEdBQUcsWUFBWTtBQUM5QixZQUFPLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7S0FDM0MsQ0FBQzs7QUFHRixRQUFJLENBQUMsV0FBVyxHQUFHLFlBQVk7QUFDOUIsWUFBUSxNQUFNLEdBQ2IsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUM3QixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQzdCLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FDNUI7S0FDRixDQUFDOztBQUdGLFFBQUksQ0FBQyxPQUFPLEdBQUcsWUFBWTtBQUMxQixZQUNDLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUNuQixLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FDbkIsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQ25CLEdBQUcsR0FBRyxDQUFDLENBQ047S0FDRixDQUFDOztBQUdGLFFBQUksQ0FBQywyQkFBMkIsR0FBRyxZQUFZO0FBQzlDLFNBQUksSUFBSSxDQUFDLHdCQUF3QixFQUFFO0FBQUUsYUFBTztNQUFFO0FBQzlDLFNBQUksQ0FBQyx3QkFBd0IsR0FBRyxJQUFJLENBQUM7O0FBRXJDLFNBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7QUFDN0IsUUFBRzs7Ozs7O0FBTUYsVUFBSSxTQUFTLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNsQyxVQUFJLFNBQVMsSUFBSSxTQUFTLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxLQUFLLE9BQU8sRUFBRTtBQUM5RCxXQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztPQUNsQjs7QUFFRCxVQUFJLEdBQUcsS0FBSyxJQUFJLENBQUMsYUFBYSxFQUFFOzs7Ozs7QUFNL0IsV0FBSSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRTtBQUM1QixXQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ25ELFdBQUcsQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUM7UUFDOUI7T0FDRDtNQUNELFFBQVEsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQSxJQUFLLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLEVBQUU7S0FDcEU7Ozs7Ozs7O0FBQUMsQUFTRixhQUFTLE9BQU8sQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUMxQixNQUFDLElBQUksR0FBRyxDQUFDO0FBQ1QsTUFBQyxJQUFJLEdBQUcsQ0FBQztBQUNULE1BQUMsSUFBSSxHQUFHLENBQUM7QUFDVCxTQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xDLFNBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEMsU0FBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNkLFNBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUFFLGFBQU8sQ0FBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUUsQ0FBQztNQUFFO0FBQzdDLFNBQUksQ0FBQyxHQUFHLENBQUMsS0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQSxHQUFFLENBQUMsR0FBSSxDQUFDLEtBQUcsQ0FBQyxHQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUEsR0FBRSxDQUFDLEdBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQSxHQUFFLENBQUMsQUFBQyxDQUFDO0FBQzVELFlBQU8sQ0FDTixFQUFFLElBQUksQ0FBQyxLQUFHLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBLEFBQUMsRUFDaEIsR0FBRyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUEsQUFBQyxFQUNYLEdBQUcsR0FBRyxDQUFDLENBQ1AsQ0FBQztLQUNGOzs7Ozs7OztBQUFBLEFBU0QsYUFBUyxPQUFPLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDMUIsU0FBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUEsQUFBQyxDQUFDOztBQUV4QixTQUFJLENBQUMsS0FBSyxJQUFJLEVBQUU7QUFDZixhQUFPLENBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQztNQUNuQjs7QUFFRCxNQUFDLElBQUksRUFBRSxDQUFDO0FBQ1IsTUFBQyxJQUFJLEdBQUcsQ0FBQzs7QUFFVCxTQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RCLFNBQUksQ0FBQyxHQUFHLENBQUMsR0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFDLENBQUMsR0FBRyxDQUFDLElBQUUsQ0FBQyxHQUFDLENBQUMsQ0FBQSxBQUFDLENBQUM7QUFDNUIsU0FBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUEsQUFBQyxDQUFDO0FBQ3BCLFNBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQSxBQUFDLENBQUM7QUFDeEIsYUFBUSxDQUFDO0FBQ1IsV0FBSyxDQUFDLENBQUM7QUFDUCxXQUFLLENBQUM7QUFBRSxjQUFPLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQztBQUFBLEFBQ3ZCLFdBQUssQ0FBQztBQUFFLGNBQU8sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDO0FBQUEsQUFDdkIsV0FBSyxDQUFDO0FBQUUsY0FBTyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUM7QUFBQSxBQUN2QixXQUFLLENBQUM7QUFBRSxjQUFPLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQztBQUFBLEFBQ3ZCLFdBQUssQ0FBQztBQUFFLGNBQU8sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDO0FBQUEsQUFDdkIsV0FBSyxDQUFDO0FBQUUsY0FBTyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUM7QUFBQSxNQUN2QjtLQUNEOztBQUdELGFBQVMsWUFBWSxHQUFJO0FBQ3hCLFFBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDckQsUUFBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3hELFlBQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7S0FDeEI7O0FBR0QsYUFBUyxVQUFVLEdBQUk7Ozs7O0FBS3RCLFNBQUksQ0FBQywyQkFBMkIsRUFBRSxDQUFDOztBQUVuQyxTQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRTtBQUNoQixTQUFHLENBQUMsTUFBTSxHQUFHO0FBQ1osWUFBSyxFQUFFLElBQUk7QUFDWCxXQUFJLEVBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFDcEMsVUFBRyxFQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO0FBQ25DLFdBQUksRUFBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztBQUNwQyxXQUFJLEVBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFDcEMsVUFBRyxFQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO0FBQ25DLFdBQUksRUFBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztBQUNwQyxXQUFJLEVBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFDcEMsYUFBTSxFQUFHLEdBQUcsQ0FBQyxhQUFhLEVBQUU7QUFDNUIsWUFBSyxFQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO0FBQ3JDLGNBQU8sRUFBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztBQUN2QyxjQUFPLEVBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFDdkMsY0FBTyxFQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO0FBQ3ZDLGNBQU8sRUFBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztBQUN2QyxVQUFHLEVBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFDbkMsV0FBSSxFQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO0FBQ3BDLFdBQUksRUFBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztBQUNwQyxjQUFPLEVBQUcsR0FBRyxDQUFDLG9CQUFvQixFQUFFO0FBQ3BDLGNBQU8sRUFBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztBQUN2QyxlQUFRLEVBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFDeEMsZUFBUSxFQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO0FBQ3hDLGVBQVEsRUFBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztBQUN4QyxVQUFHLEVBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFDbkMsV0FBSSxFQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDO0FBQUEsT0FDckMsQ0FBQzs7QUFFRixTQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDbEQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDNUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDakQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDakQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDakQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDakQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDOUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDNUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRTVDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNuRCxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM1QyxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqRCxTQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNyRCxTQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNyRCxTQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNwRCxTQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM1QyxTQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFNUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDNUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7O0FBRTNDLFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzVDLFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzdDLFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxD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Q0FBQyxHQUFHLEdBQUMsQ0FBQyxFQUFFLENBQUE7R0FBQztDQUFDLENBQUEsQ0FBQyxZQUFVO0FBQUMsTUFBSSxDQUFDLENBQUMsT0FBTyxDQUFBLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsYUFBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLFVBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUM7QUFBQyxZQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDO0FBQUMsY0FBSSxDQUFDLEdBQUMsVUFBVSxJQUFFLE9BQU8sT0FBTyxJQUFFLE9BQU8sQ0FBQyxJQUFHLENBQUMsQ0FBQyxJQUFFLENBQUMsRUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsRUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsR0FBQyxDQUFDLEdBQUMsR0FBRyxDQUFDLENBQUMsT0FBTSxDQUFDLENBQUMsSUFBSSxHQUFDLGtCQUFrQixFQUFDLENBQUMsQ0FBQSxDQUFBO1NBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUMsT0FBTyxFQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxVQUFTLENBQUMsRUFBQztBQUFDLGNBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFBO1NBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQTtPQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQTtLQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsVUFBVSxJQUFFLE9BQU8sT0FBTyxJQUFFLE9BQU8sRUFBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxFQUFDLENBQUMsRUFBRTtBQUFDLE9BQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUFBLE9BQU8sQ0FBQyxDQUFBO0dBQUMsQ0FBQSxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsVUFBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLGdCQUFVLElBQUcsTUFBTSxDQUFDLElBQUksS0FBRyxXQUFXLElBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsS0FBRyxDQUFDLFFBQVEsQ0FBQyxlQUFlLElBQUUsV0FBVyxJQUFHLFFBQVEsQ0FBQyxlQUFlLENBQUMsNEJBQTRCLEVBQUMsR0FBRyxDQUFDLENBQUEsQUFBQyxHQUFDLENBQUMsQ0FBQSxZQUFVO0FBQUMsb0JBQVksQ0FBQztBQUFBLFlBQUksQ0FBQyxHQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQSxFQUFDO0FBQUMsY0FBSSxDQUFDLEdBQUMsV0FBUyxDQUFDLEVBQUM7QUFBQyxnQkFBSSxDQUFDLEdBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsa0JBQUksQ0FBQztrQkFBQyxDQUFDLEdBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxLQUFJLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEVBQUU7QUFBQyxpQkFBQyxHQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBQyxDQUFDLENBQUMsQ0FBQTtlQUFBO2FBQUMsQ0FBQTtXQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQTtTQUFDLEtBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUEsRUFBQztBQUFDLGNBQUksQ0FBQyxHQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFDLFVBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLG1CQUFPLENBQUMsSUFBSSxTQUFTLElBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBQyxDQUFDLENBQUMsQ0FBQTtXQUFDLENBQUE7U0FBQyxDQUFDLEdBQUMsSUFBSSxDQUFBO09BQUMsQ0FBQSxFQUFFLEdBQUMsQ0FBQyxDQUFBLFVBQVMsQ0FBQyxFQUFDO0FBQUMsb0JBQVksQ0FBQztBQUFBLFlBQUcsU0FBUyxJQUFHLENBQUMsRUFBQztBQUFDLGNBQUksQ0FBQyxHQUFDLFdBQVc7Y0FBQyxDQUFDLEdBQUMsV0FBVztjQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztjQUFDLENBQUMsR0FBQyxNQUFNO2NBQUMsQ0FBQyxHQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUUsWUFBVTtBQUFDLG1CQUFPLElBQUksQ0FBQyxPQUFPLENBQUMs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Q0FBQyxHQUFDLFFBQVEsQ0FBQSxBQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsQ0FBQyxFQUFDLE9BQU8sQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsTUFBTSxJQUFFLENBQUMsRUFBQztBQUFDLGNBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxHQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQTtTQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsUUFBUTtZQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUksQ0FBQyxDQUFDLFNBQVMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEVBQUU7QUFBRSxXQUFDLEdBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztTQUFBLElBQUcsQ0FBQyxDQUFDLFVBQVUsSUFBRSxDQUFDLENBQUMsU0FBUyxFQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsc0JBQXNCLEVBQUUsRUFBQyxDQUFDLENBQUMsVUFBVTtBQUFFLFdBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztTQUFBLE9BQU8sQ0FBQyxDQUFBO09BQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1VBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsSUFBRSxPQUFPLFFBQVEsS0FBRyxDQUFDLEdBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsRUFBQyxDQUFDLENBQUMsU0FBUyxHQUFDLG9FQUFvRSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQyxDQUFBLEFBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxFQUFDLE1BQU0sRUFBQyxDQUFDLENBQUMsRUFBQyxZQUFZLEVBQUMsYUFBYSxDQUFDLEVBQUMsRUFBRSxFQUFDLENBQUMsQ0FBQyxFQUFDLGdCQUFnQixFQUFDLGtCQUFrQixDQUFDLEVBQUMsR0FBRyxFQUFDLENBQUMsQ0FBQyxFQUFDLGtDQUFrQyxFQUFDLHFCQUFxQixDQUFDLEVBQUMsUUFBUSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyxRQUFRLEVBQUMsUUFBUSxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUMsRUFBRSxFQUFDLEVBQUUsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBQyxDQUFDLENBQUMsRUFBRSxHQUFDLENBQUMsQ0FBQyxFQUFDLG9CQUFvQixFQUFDLHVCQUF1QixDQUFDLEVBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsUUFBUSxHQUFDLENBQUMsQ0FBQyxFQUFDLDhCQUE4QixFQUFDLFdBQVcsQ0FBQyxFQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUMsQ0FBQyxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsUUFBUSxHQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsRUFBQyxTQUFTLEVBQUMsVUFBVSxDQUFDLEVBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUMsd0RBQXdELEVBQUMsUUFBUSxDQUFDLENBQUE7S0FBQyxFQUFDLEVBQUUsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLFVBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxrQkFBWSxDQUFDO0FBQUEsZUFBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLFlBQUcsS0FBSyxDQUFDLEtBQUcsQ0FBQyxJQUFFLElBQUksS0FBRyxDQUFDLEVBQUMsTUFBTSxJQUFJLFNBQVMsQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUMsQ0FBQyxFQUFFLEVBQUM7QUFBQyxjQUFJLENBQUMsR0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxLQUFLLENBQUMsS0FBRyxDQUFDLElBQUUsSUFBSSxLQUFHLENBQUMsRUFBQyxLQUFJLElBQUksQ0FBQyxHQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsRUFBRSxFQUFDO0FBQUMsZ0JBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQUMsQ0FBQyxHQUFDLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUcsQ0FBQyxJQUFFLENBQUMsQ0FBQyxVQUFVLEtBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLENBQUE7V0FBQztTQUFDLE9BQU8sQ0FBQyxDQUFBO09BQUMsU0FBUyxDQUFDLEdBQUU7QUFBQyxjQUFNLENBQUMsTUFBTSxJQUFFLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFDLFFBQVEsRUFBQyxFQUFDLFVBQVUsRUFBQyxDQUFDLENBQUMsRUFBQyxZQUFZLEVBQUMsQ0FBQyxDQUFDLEVBQUMsUUFBUSxFQUFDLENBQUMsQ0FBQyxFQUFDLEtBQUssRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFBO09BQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxFQUFDLE1BQU0sRUFBQyxDQUFDLEVBQUMsUUFBUSxFQUFDLENBQUMsRUFBQyxDQUFBO0tBQUMsRUFBQyxFQUFFLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxVQUFTLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsZUFBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLGdCQUFRLFlBQVMsQ0FBQyx5Q0FBRCxDQUFDLEVBQUEsR0FBQyxDQUFDLEdBQUMsRUFBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxHQUFDLEtBQUssQ0FBQyxLQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUcsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxHQUFDLEVBQUUsR0FBQyxFQUFFLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxVQUFVLEtBQUcsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxRQUFRLEdBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBQyxFQUFFLEVBQUMsQ0FBQyxHQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxFQUFFLENBQUMsRUFBQztBQUFDLGNBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUEsSUFBRyxDQUFDLENBQUMsSUFBSSxJQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUM7QUFBQyxnQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUk7Z0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBRyxVQUFVLEtBQUcsQ0FBQyxDQUFDLElBQUksSUFBRSxPQUFPLEtBQUcsQ0FBQyxDQUFDLElBQUksSUFBRSxDQUFDLENBQUMsT0FBTyxLQUFHLENBQUMsR0FBQyxLQUFLLENBQUMsQ0FBQSxBQUFDLEVBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQSxFQUFDO0FBQUMsbUJBQUcsVUFBVSxLQUFHLENBQUMsQ0FBQyxJQUFJLElBQUUsQ0FBQyxDQUFDLE9BQU8sS0FBRyxDQUFDLEdBQUMsRUFBRSxDQUFBLEFBQUMsRUFBQyxPQUFPLEtBQUcsQ0FBQyxDQUFDLElBQUksS0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFFLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLE9BQU8sS0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLENBQUMsSUFBRSxPQUFPLElBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQSxFQUFDLFNBQVE7YUFBQyxNQUFLLElBQUcsQ0FBQyxDQUFDLEVBQUMsU0FBUyxJQUFHLGlCQUFpQixLQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUk7QUFBQyxlQUFDLEdBQUMsRUFBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxFQUFFLENBQUMsRUFBQztBQUFDLG9CQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxJQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUs7b0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLElBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLElBQUUsQ0FBQyxLQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksSUFBRSxJQUFJLEtBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLElBQUksRUFBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFBLEFBQUMsQ0FBQTtlQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLEVBQUUsQ0FBQyxDQUFBLEFBQUMsQ0FBQTthQUFDO1dBQUM7U0FBQyxJQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUMsS0FBSSxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQUMsV0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxFQUFFLENBQUMsQ0FBQSxBQUFDLENBQUM7U0FBQSxPQUFPLENBQUMsQ0FBQTtPQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQztBQUFDLFlBQUksQ0FBQyxHQUFDLEVBQUU7WUFBQyxDQUFDLEdBQUMsYUFBYTtZQUFDLENBQUMsR0FBQyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLElBQUksTUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDO0FBQUUsV0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUFBLE9BQU8sQ0FBQyxDQUFBO09BQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxZQUFHLENBQUMsS0FBRyxDQUFDLENBQUMsTUFBTSxFQUFDLE9BQU8sQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFO1lBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBRyxJQUFJLEtBQUcsQ0FBQyxFQUFDLE9BQU8sQ0FBQyxHQUFDLENBQUMsSUFBRSxFQUFFLEVBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsT0FBTyxJQUFFLEVBQUUsRUFBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLENBQUMsSUFBRyxDQUFDLEVBQUM7QUFBQyxjQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2NBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLEdBQUMsQ0FBQyxJQUFFLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUEsSUFBRyxDQUFDLEdBQUMsQ0FBQyxJQUFFLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxDQUFBO1NBQUMsTUFBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUE7T0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLFlBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLEVBQUM7QUFBQyxjQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUE7U0FBQyxNQUFJO0FBQUMsY0FBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBLEdBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQTtTQUFDLE9BQU8sQ0FBQyxDQUFBO09BQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxlQUFPLENBQUMsR0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBQyxNQUFNLENBQUMsRUFBQyxDQUFDLEdBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFDLEdBQUcsQ0FBQyxFQUFDLENBQUMsSUFBRSxDQUFDLEdBQUMsR0FBRyxHQUFDLEVBQUUsQ0FBQSxBQUFDLEdBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEdBQUMsR0FBRyxHQUFDLENBQUMsQ0FBQTtPQUFDLElBQUksQ0FBQyxHQUFDLHVDQUF1QztVQUFDLENBQUMsR0FBQyxvQ0FBb0M7VUFBQyxDQUFDLEdBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUE7S0FBQyxFQUFDLEVBQUUsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLFVBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxPQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsU0FBQyxDQUFBLFVBQVMsQ0FBQyxFQUFDO0FBQUMsY0FBRyxRQUFRLFlBQVMsQ0FBQyx5Q0FBRCxDQUFDLEVBQUEsSUFBRSxXQUFXLElBQUUsT0FBTyxDQUFDLEVBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLElBQUcsVUFBVSxJQUFFLE9BQU8sQ0FBQyxJQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxLQUFJO0FBQUMsZ0JBQUksQ0FBQyxDQUFDLENBQUMsR0FBQyxXQUFXLElBQUUsT0FBTyxNQUFNLEdBQUMsTUFBTSxHQUFDLFdBQVcsSUFBRSxPQUFPLENBQUMsR0FBQyxDQUFDLEdBQUMsV0FBVyxJQUFFLE9BQU8sSUFBSSxHQUFDLElBQUksR0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLFNBQVMsR0FBQyxDQUFDLEVBQUUsQ0FBQTtXQUFDO1NBQUMsQ0FBQSxDQUFDLFlBQVU7QUFBQyxpQkFBTyxDQUFBLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMscUJBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxrQkFBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQztBQUFDLG9CQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDO0FBQUMsc0JBQUksQ0FBQyxHQUFDLFVBQVUsSUFBRSxPQUFPLENBQUMsSUFBRSxDQUFDLENBQUMsSUFBRyxDQUFDLENBQUMsSUFBRSxDQUFDLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsSUFBSSxLQUFLLENBQUMsc0JBQXNCLEdBQUMsQ0FBQyxHQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU0sQ0FBQyxDQUFDLElBQUksR0FBQyxrQkFBa0IsRUFBQyxDQUFDLENBQUEsQ0FBQTtpQkFBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBQyxPQUFPLEVBQUMsRUFBRSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsc0JBQUksQ0FB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Q0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLFVBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyx1QkFBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLHdCQUFRLFlBQVMsQ0FBQyx5Q0FBRCxDQUFDLEVBQUEsR0FBQyxDQUFDLEdBQUMsRUFBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxHQUFDLEtBQUssQ0FBQyxLQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUcsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxHQUFDLEVBQUUsR0FBQyxFQUFFLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxVQUFVLEtBQUcsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxRQUFRLEdBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBQyxFQUFFLEVBQUMsQ0FBQyxHQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxFQUFFLENBQUMsRUFBQztBQUFDLHNCQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLElBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFBLElBQUcsQ0FBQyxDQUFDLElBQUksSUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFDO0FBQUMsd0JBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJO3dCQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUcsVUFBVSxLQUFHLENBQUMsQ0FBQyxJQUFJLElBQUUsT0FBTyxLQUFHLENBQUMsQ0FBQyxJQUFJLElBQUUsQ0FBQyxDQUFDLE9BQU8sS0FBRyxDQUFDLEdBQUMsS0FBSyxDQUFDLENBQUEsQUFBQyxFQUFDLENBQUMsQ0FBQyxLQUFLLENBQUEsRUFBQztBQUFDLDJCQUFHLFVBQVUsS0FBRyxDQUFDLENBQUMsSUFBSSxJQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUcsQ0FBQyxHQUFDLEVBQUUsQ0FBQSxBQUFDLEVBQUMsT0FBTyxLQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBRSxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxPQUFPLEtBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLEVBQUMsQ0FBQyxDQUFDLElBQUUsT0FBTyxJQUFFLENBQUMsQ0FBQyxJQUFJLENBQUEsRUFBQyxTQUFRO3FCQUFDLE1BQUssSUFBRyxDQUFDLENBQUMsRUFBQyxTQUFTLElBQUcsaUJBQWlCLEtBQUcsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSTtBQUFDLHVCQUFDLEdBQUMsRUFBRSxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxFQUFFLENBQUMsRUFBQztBQUFDLDRCQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxJQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUs7NEJBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLElBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLElBQUUsQ0FBQyxLQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksSUFBRSxJQUFJLEtBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLElBQUksRUFBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFBLEFBQUMsQ0FBQTt1QkFBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsS0FBSyxLQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxFQUFFLENBQUMsQ0FBQSxBQUFDLENBQUE7cUJBQUM7bUJBQUM7aUJBQUMsSUFBRyxDQUFDLENBQUMsS0FBSyxFQUFDLEtBQUksSUFBSSxDQUFDLElBQUksQ0FBQztBQUFDLG1CQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLEVBQUUsQ0FBQyxDQUFBLEFBQUMsQ0FBQztpQkFBQSxPQUFPLENBQUMsQ0FBQTtlQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQztBQUFDLG9CQUFJLENBQUMsR0FBQyxFQUFFO29CQUFDLENBQUMsR0FBQyxhQUFhO29CQUFDLENBQUMsR0FBQyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUM7b0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxJQUFJLE1BQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQztBQUFFLG1CQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUFBLE9BQU8sQ0FBQyxDQUFBO2VBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxvQkFBRyxDQUFDLEtBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBQyxPQUFPLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRTtvQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxJQUFHLElBQUksS0FBRyxDQUFDLEVBQUMsT0FBTyxDQUFDLEdBQUMsQ0FBQyxJQUFFLEVBQUUsRUFBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxPQUFPLElBQUUsRUFBRSxFQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxFQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsRUFBQztBQUFDLHNCQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3NCQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxHQUFDLENBQUMsSUFBRSxFQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBLElBQUcsQ0FBQyxHQUFDLENBQUMsSUFBRSxFQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsQ0FBQTtpQkFBQyxNQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQTtlQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsb0JBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLEVBQUM7QUFBQyxzQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBO2lCQUFDLE1BQUk7QUFBQyxzQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBLEdBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQTtpQkFBQyxPQUFPLENBQUMsQ0FBQTtlQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsdUJBQU8sQ0FBQyxHQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFDLE1BQU0sQ0FBQyxFQUFDLENBQUMsR0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUMsR0FBRyxDQUFDLEVBQUMsQ0FBQyxJQUFFLENBQUMsR0FBQyxHQUFHLEdBQUMsRUFBRSxD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QUMsY0FBYyxFQUFDLENBQUMsS0FBSSxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQUMsY0FBRyxLQUFLLENBQUMsS0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQUEsT0FBTSxDQUFDLENBQUMsQ0FBQTtPQUFDLENBQUEsRUFBRTtVQUFDLENBQUMsR0FBQyxFQUFDLEdBQUcsRUFBQyxLQUFLLEVBQUMsT0FBTyxFQUFDLGFBQWEsRUFBQyxPQUFPLEVBQUMsYUFBYSxFQUFDLEtBQUssRUFBQyxXQUFXLEVBQUMsT0FBTyxFQUFDLGFBQWEsRUFBQyxJQUFJLEVBQUMsVUFBVSxFQUFDO1VBQUMsQ0FBQyxHQUFDLEVBQUU7VUFBQyxDQUFDLEdBQUMsQ0FBQztVQUFDLENBQUMsR0FBQyxDQUFDLENBQUM7VUFBQyxDQUFDLEdBQUMsRUFBQyxJQUFJLEVBQUMsY0FBUyxDQUFDLEVBQUM7QUFBQyxjQUFJLENBQUMsR0FBQyxTQUFGLENBQUMsQ0FBVSxDQUFDLEVBQUM7QUFBQyxtQkFBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEdBQUMsQ0FBQyxHQUFDLHNHQUFzRyxDQUFDLEVBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyx5REFBeUQsQ0FBQyxDQUFBO1dBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBQyxDQUFDLENBQUMsVUFBVSxJQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsRUFBQyxDQUFDLENBQUMsVUFBVSxJQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsRUFBQyxDQUFDLENBQUMsUUFBUSxJQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBQyxDQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUMsWUFBVTtBQUFDLHFCQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUM7QUFBQyxxQkFBTSxNQUFNLEtBQUcsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBQyxnQkFBZ0IsQ0FBQyxJQUFFLElBQUksS0FBRyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFDLG9CQUFvQixDQUFDLENBQUE7YUFBQyxJQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBQyxPQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBRyxDQUFDLElBQUUsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLEVBQUMsT0FBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFBLFlBQVU7QUFBQyxxQkFBTSxDQUFDLENBQUMsQ0FBQyxXQUFXLElBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7YUFBQyxDQUFBLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBRyxDQUFDLEtBQUcsQ0FBQyxDQUFDLEVBQUMsT0FBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDO2dCQUFDLENBQUMsR0FBQyxDQUFBLFNBQVMsQ0FBQyxHQUFFO0FBQUMsa0JBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxLQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxFQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFDLENBQUMsQ0FBQyxVQUFVLElBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxLQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUEsQUFBQyxDQUFBO2FBQUMsQ0FBQSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBRSxDQUFDLElBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQSxHQUFFLENBQUMsRUFBRSxFQUFDLENBQUMsQ0FBQyxDQUFBO1dBQUMsRUFBQyxRQUFRLElBQUUsT0FBTyxDQUFDLEtBQUcsQ0FBQyxHQUFDLEVBQUMsT0FBTyxFQUFDLENBQUMsRUFBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLENBQUMsYUFBYSxJQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxhQUFhLEdBQUMsQ0FBQyxDQUFDLE9BQU8sS0FBRyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUEsQUFBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLGNBQWMsRUFBQyxDQUFDLENBQUM7Y0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsU0FBUyxHQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLEVBQUMsQ0FBQyxDQUFDLG9CQUFvQixJQUFFLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUMsVUFBUyxDQUFDLEVBQUM7QUFBQyxhQUFDLENBQUMsTUFBTSxLQUFHLENBQUMsSUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUE7V0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsU0FBUyxHQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsRUFBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxPQUFPLFlBQVksTUFBTSxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxlQUFlLENBQUEsRUFBQztBQUFDLGdCQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFBO1dBQUMsT0FBTyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFNBQVMsSUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsQ0FBQTtTQUFDLEVBQUMsS0FBSyxFQUFDLGVBQVMsQ0FBQyxFQUFDO0FBQUMsY0FBSSxDQUFDLENBQUMsSUFBRyxDQUFDLENBQUMsRUFBRSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUk7QUFBQyxnQkFBRyxRQUFRLElBQUUsT0FBTyxDQUFDLEVBQUMsTUFBTSxJQUFJLFNBQVMsQ0FBQywwQ0FBMEMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUE7V0FBQyxPQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFBO1NBQUMsRUFBQyxRQUFRLEVBQUMsb0JBQVU7QUFBQyxjQUFJLENBQUMsR0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUE7U0FBQyxFQUFDLFFBQVEsRUFBQyxvQkFBVTtBQUFDLGVBQUksSUFBSSxDQUFDLElBQUksQ0FBQztBQUFDLGdCQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1dBQUEsT0FBTSxDQUFDLENBQUMsQ0FBQTtTQUFDLEVBQUMsTUFBTSxFQUFDLGtCQUFVO0FBQUMsaUJBQU8sQ0FBQyxDQUFBO1NBQUMsRUFBQyxPQUFPLEVBQUMsaUJBQVMsQ0FBQyxFQUFDO0FBQUMsaUJBQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1NBQUMsRUFBQyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUMsVUFBUyxDQUFDLEVBQUM7QUFBQyxVQUFFLEtBQUcsQ0FBQyxDQUFDLE9BQU8sS0FBRyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLENBQUE7T0FBQyxDQUFDLEVBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFBQyxZQUFVO0FBQUMsU0FBQyxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsSUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUE7T0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLGNBQWMsR0FBQyxFQUFDLE9BQU8sRUFBQyxFQUFFLEVBQUMsZUFBZSxFQUFDLENBQUMsQ0FBQyxFQUFDLGtCQUFrQixFQUFDLENBQUMsQ0FBQyxFQUFDLG9CQUFvQixFQUFDLENBQUMsQ0FBQyxFQUFDLGNBQWMsRUFBQyxNQUFNLEVBQUMsU0FBUyxFQUFDLEVBQUUsRUFBQyxnQkFBZ0IsRUFBQyxFQUFFLEVBQUMsZ0JBQWdCLEVBQUMsRUFBRSxFQUFDLGNBQWMsRUFBQyxFQUFFLEVBQUMsa0JBQWtCLEVBQUMsQ0FBQyxDQUFDLEVBQUMsRUFBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBQyxhQUFhLEVBQUMsRUFBQyxZQUFZLEVBQUMsQ0FBQyxDQUFDLEVBQUMsVUFBVSxFQUFDLENBQUMsQ0FBQyxFQUFDLFFBQVEsRUFBQyxDQUFDLENBQUMsRUFBQyxLQUFLLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsY0FBYyxHQUFDLFVBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLFlBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFBQyxDQUFDLEdBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxTQUFTLEdBQUMsQ0FBQyxHQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQTtPQUFDLEVBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUE7S0FBQyxFQUFDLEVBQUMsb0JBQW9CLEVBQUMsQ0FBQyxFQUFDLE1BQU0sRUFBQyxDQUFDLEVBQUMsbUJBQW1CLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxFQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7Q0FBQyxDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBncmF2aXRvblxuICpcbiAqIEphdmFTY3JpcHQgTi1ib2R5IEdyYXZpdGF0aW9uYWwgU2ltdWxhdG9yXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IFphdmVuIE11cmFkeWFuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqXG4gKiBSZXZpc2lvbjpcbiAqICBAUkVWSVNJT05cbiAqL1xuaW1wb3J0IEd0QXBwIGZyb20gJy4vZ3Jhdml0b24vYXBwJztcblxuZXhwb3J0IGRlZmF1bHQgeyBhcHA6IEd0QXBwIH07XG4iLCIvKipcbiAqIGdyYXZpdG9uL2FwcCAtLSBUaGUgaW50ZXJhY3RpdmUgZ3Jhdml0b24gYXBwbGljYXRpb25cbiAqL1xuLyogZ2xvYmFsIGpzY29sb3IgKi9cblxuaW1wb3J0IHZleCBmcm9tICcuLi92ZW5kb3IvdmV4JztcbmltcG9ydCByYW5kb20gZnJvbSAnLi4vdXRpbC9yYW5kb20nO1xuaW1wb3J0IEd0U2ltIGZyb20gJy4vc2ltJztcbmltcG9ydCBHdEdmeCBmcm9tICcuL2dmeCc7XG5pbXBvcnQgR3RFdmVudHMsIHsgS0VZQ09ERVMsIEVWRU5UQ09ERVMsIENPTlRST0xDT0RFUyB9IGZyb20gJy4vZXZlbnRzJztcbmltcG9ydCBHdFRpbWVyIGZyb20gJy4vdGltZXInO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdEFwcCB7XG4gICAgY29uc3RydWN0b3IoYXJncyA9IHt9KSB7XG4gICAgICAgIHRoaXMuYXJncyA9IGFyZ3M7XG5cbiAgICAgICAgdGhpcy5vcHRpb25zID0ge307XG4gICAgICAgIHRoaXMuZ3JpZCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5hbmltVGltZXIgPSBudWxsO1xuICAgICAgICB0aGlzLnNpbVRpbWVyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmV2ZW50cyA9IG51bGw7XG4gICAgICAgIHRoaXMuc2ltID0gbnVsbDtcbiAgICAgICAgdGhpcy5nZnggPSBudWxsO1xuXG4gICAgICAgIHRoaXMubm9jbGVhciA9IGZhbHNlO1xuICAgICAgICB0aGlzLnF1YWRUcmVlTGluZXMgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pbnRlcmFjdGlvbiA9IHtwcmV2aW91czoge319O1xuICAgICAgICB0aGlzLnRhcmdldEJvZHkgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMud2FzQ29sb3JQaWNrZXJBY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pc0hlbHBPcGVuID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5vcHRpb25zLndpZHRoID0gYXJncy53aWR0aCA9IGFyZ3Mud2lkdGggfHwgd2luZG93LmlubmVyV2lkdGg7XG4gICAgICAgIHRoaXMub3B0aW9ucy5oZWlnaHQgPSBhcmdzLmhlaWdodCA9IGFyZ3MuaGVpZ2h0IHx8IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICAgICAgdGhpcy5vcHRpb25zLmJhY2tncm91bmRDb2xvciA9IGFyZ3MuYmFja2dyb3VuZENvbG9yIHx8ICcjMUYyNjNCJztcblxuICAgICAgICAvLyBSZXRyaWV2ZSBjYW52YXMsIG9yIGJ1aWxkIG9uZSB3aXRoIGFyZ3VtZW50c1xuICAgICAgICB0aGlzLmdyaWQgPSB0eXBlb2YgYXJncy5ncmlkID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChhcmdzLmdyaWQpIDpcbiAgICAgICAgICAgIGFyZ3MuZ3JpZDtcblxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuZ3JpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVHcmlkKHRoaXMub3B0aW9ucy53aWR0aCwgdGhpcy5vcHRpb25zLmhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAge2JhY2tncm91bmRDb2xvcjogdGhpcy5vcHRpb25zLmJhY2tncm91bmRDb2xvcn0pO1xuICAgICAgICAgICAgYXJncy5ncmlkID0gdGhpcy5ncmlkO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb250cm9scyA9IHR5cGVvZiBhcmdzLmNvbnRyb2xzID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChhcmdzLmNvbnRyb2xzKSA6XG4gICAgICAgICAgICBhcmdzLmNvbnRyb2xzO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5jb250cm9scyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVDb250cm9scygpO1xuICAgICAgICAgICAgYXJncy5jb250cm9scyA9IHRoaXMuY29udHJvbHM7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBsYXlCdG4gPSBhcmdzLnBsYXlCdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyNwbGF5YnRuJyk7XG4gICAgICAgIHRoaXMucGF1c2VCdG4gPSBhcmdzLnBhdXNlQnRuID0gdGhpcy5jb250cm9scy5xdWVyeVNlbGVjdG9yKCcjcGF1c2VidG4nKTtcbiAgICAgICAgdGhpcy5iYXJuZXNIdXRPbkJ0biA9IGFyZ3MuYmFybmVzSHV0T25CdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyNiYXJuZXNodXRvbmJ0bicpO1xuICAgICAgICB0aGlzLmJhcm5lc0h1dE9mZkJ0biA9IGFyZ3MuYmFybmVzSHV0T2ZmQnRuID0gdGhpcy5jb250cm9scy5xdWVyeVNlbGVjdG9yKCcjYmFybmVzaHV0b2ZmYnRuJyk7XG4gICAgICAgIHRoaXMucXVhZFRyZWVPZmZCdG4gPSBhcmdzLnF1YWRUcmVlT2ZmQnRuID0gdGhpcy5jb250cm9scy5xdWVyeVNlbGVjdG9yKCcjcXVhZHRyZWVvZmZidG4nKTtcbiAgICAgICAgdGhpcy5xdWFkVHJlZU9uQnRuID0gYXJncy5xdWFkVHJlZU9uQnRuID0gdGhpcy5jb250cm9scy5xdWVyeVNlbGVjdG9yKCcjcXVhZHRyZWVvbmJ0bicpO1xuICAgICAgICB0aGlzLmNvbGxpc2lvbnNPZmZCdG4gPSBhcmdzLmNvbGxpc2lvbnNPZmZCdG4gPVxuICAgICAgICAgICAgdGhpcy5jb250cm9scy5xdWVyeVNlbGVjdG9yKCcjY29sbGlzaW9uc29mZmJ0bicpO1xuICAgICAgICB0aGlzLmNvbGxpc2lvbnNPbkJ0biA9IGFyZ3MuY29sbGlzaW9uc09uQnRuID1cbiAgICAgICAgICAgIHRoaXMuY29udHJvbHMucXVlcnlTZWxlY3RvcignI2NvbGxpc2lvbnNvbmJ0bicpO1xuICAgICAgICB0aGlzLnRyYWlsT2ZmQnRuID0gYXJncy50cmFpbE9mZkJ0biA9IHRoaXMuY29udHJvbHMucXVlcnlTZWxlY3RvcignI3RyYWlsb2ZmYnRuJyk7XG4gICAgICAgIHRoaXMudHJhaWxPbkJ0biA9IGFyZ3MudHJhaWxPbkJ0biA9IHRoaXMuY29udHJvbHMucXVlcnlTZWxlY3RvcignI3RyYWlsb25idG4nKTtcbiAgICAgICAgdGhpcy5oZWxwQnRuID0gYXJncy5oZWxwQnRuID0gdGhpcy5jb250cm9scy5xdWVyeVNlbGVjdG9yKCcjaGVscGJ0bicpO1xuXG4gICAgICAgIHRoaXMuY29sb3JQaWNrZXIgPSB0eXBlb2YgYXJncy5jb2xvclBpY2tlciA9PT0gJ3N0cmluZycgP1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYXJncy5jb2xvclBpY2tlcikgOlxuICAgICAgICAgICAgYXJncy5jb2xvclBpY2tlcjtcblxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuY29sb3JQaWNrZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLmNvbG9yUGlja2VyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgICAgIHRoaXMuY29sb3JQaWNrZXIuY2xhc3NOYW1lID0gJ2JvZHljb2xvcnBpY2tlcic7XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuY29sb3JQaWNrZXIpO1xuICAgICAgICAgICAgYXJncy5jb2xvclBpY2tlciA9IHRoaXMuY29sb3JQaWNrZXI7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5qc2NvbG9yID0gbmV3IGpzY29sb3IodGhpcy5jb2xvclBpY2tlciwge1xuICAgICAgICAgICAgcGFkZGluZzogMCxcbiAgICAgICAgICAgIHNoYWRvdzogZmFsc2UsXG4gICAgICAgICAgICBib3JkZXJXaWR0aDogMCxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgIGluc2V0Q29sb3I6ICcjM2Q1NTllJyxcbiAgICAgICAgICAgIG9uRmluZUNoYW5nZTogdGhpcy51cGRhdGVDb2xvci5iaW5kKHRoaXMpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMubWV0YUluZm8gPSB0eXBlb2YgYXJncy5tZXRhSW5mbyA9PT0gJ3N0cmluZycgP1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYXJncy5tZXRhSW5mbykgOlxuICAgICAgICAgICAgYXJncy5tZXRhSW5mbztcblxuICAgICAgICBpZiAodHlwZW9mIHRoaXMubWV0YUluZm8gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLm1ldGFJbmZvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICAgICAgdGhpcy5tZXRhSW5mby5jbGFzc05hbWUgPSAnbWV0YWluZm8nO1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLm1ldGFJbmZvKTtcbiAgICAgICAgICAgIGFyZ3MubWV0YUluZm8gPSB0aGlzLm1ldGFJbmZvO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSW5pdGlhbGl6ZVxuICAgICAgICB0aGlzLmluaXRDb21wb25lbnRzKCk7XG4gICAgICAgIHRoaXMuaW5pdFRpbWVycygpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIG1haW4gLS0gTWFpbiAnZ2FtZScgbG9vcFxuICAgICAqL1xuICAgIG1haW4oKSB7XG4gICAgICAgIC8vIEV2ZW50IHByb2Nlc3NpbmdcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICB0aGlzLmV2ZW50cy5xZ2V0KCkuZm9yRWFjaChmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgbGV0IHJldHZhbDtcblxuICAgICAgICAgICAgc3dpdGNoIChldmVudC50eXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBFVkVOVENPREVTLk1PVVNFRE9XTjpcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbiA9PT0gLyogcmlnaHQgY2xpY2sgKi8gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGJvZHkuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50YXJnZXRCb2R5ICYmICF0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNpbS5yZW1vdmVCb2R5KHRoaXMudGFyZ2V0Qm9keSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRUYXJnZXRCb2R5KHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXZlbnQuYnV0dG9uID09PSAvKiBtaWRkbGUgY2xpY2sgKi8gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29sb3IgcGlja2luZ1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0Qm9keSAmJiAhdGhpcy5pbnRlcmFjdGlvbi5zdGFydGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb2xvclBpY2tlci5zdHlsZS5sZWZ0ID0gZXZlbnQucG9zaXRpb24ueCArICdweCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb2xvclBpY2tlci5zdHlsZS50b3AgPSBldmVudC5wb3NpdGlvbi55ICsgJ3B4JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmpzY29sb3IuZnJvbVN0cmluZyh0aGlzLnRhcmdldEJvZHkuY29sb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuanNjb2xvci5zaG93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7IC8qIGxlZnQgY2xpY2sgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJhc2UgdGhlIGNoZWNrIG9uIHRoZSBwcmV2aW91cyB2YWx1ZSwgaW4gY2FzZSB0aGUgY29sb3IgcGlja2VyIHdhcyBqdXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjbG9zZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMud2FzQ29sb3JQaWNrZXJBY3RpdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgZmxhZyB0byBzaWduYWwgb3RoZXIgZXZlbnRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5zdGFydGVkID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnRhcmdldEJvZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5ib2R5ID0gdGhpcy50YXJnZXRCb2R5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJhY3Rpb24uYm9keSA9IHRoaXMuc2ltLmFkZE5ld0JvZHkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogZXZlbnQucG9zaXRpb24ueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IGV2ZW50LnBvc2l0aW9uLnlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5wcmV2aW91cy54ID0gZXZlbnQucG9zaXRpb24ueDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLnByZXZpb3VzLnkgPSBldmVudC5wb3NpdGlvbi55O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIHBpY2tlci5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmlzQ29sb3JQaWNrZXJBY3RpdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhazsgLy8gZW5kIE1PVVNFRE9XTlxuXG4gICAgICAgICAgICAgICAgY2FzZSBFVkVOVENPREVTLk1PVVNFVVA6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJhY3Rpb24uc3RhcnRlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYm9keSA9IHRoaXMuaW50ZXJhY3Rpb24uYm9keTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZlbFggPSAoZXZlbnQucG9zaXRpb24ueCAtIGJvZHkueCkgKiAwLjAwMDAwMDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmVsWSA9IChldmVudC5wb3NpdGlvbi55IC0gYm9keS55KSAqIDAuMDAwMDAwMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdoZW4gdGhlIHNpbXVsYXRpb24gaXMgYWN0aXZlLCBhZGQgdGhlIHZlbG9jaXR5IHRvIHRoZSBjdXJyZW50IHZlbG9jaXR5XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpbnN0ZWFkIG9mIGNvbXBsZXRlbHkgcmVzZXR0aW5nIGl0ICh0byBhbGxvdyBmb3IgbW9yZSBpbnRlcmVzdGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW50ZXJhY3Rpb25zKS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGJvZHkudmVsWCA9IHRoaXMuc2ltVGltZXIuYWN0aXZlID8gYm9keS52ZWxYICsgdmVsWCA6IHZlbFg7XG4gICAgICAgICAgICAgICAgICAgICAgICBib2R5LnZlbFkgPSB0aGlzLnNpbVRpbWVyLmFjdGl2ZSA/IGJvZHkudmVsWSArIHZlbFkgOiB2ZWxZO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlVGFyZ2V0KGV2ZW50LnBvc2l0aW9uLngsIGV2ZW50LnBvc2l0aW9uLnkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgRVZFTlRDT0RFUy5NT1VTRU1PVkU6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJhY3Rpb24ucHJldmlvdXMueCA9IGV2ZW50LnBvc2l0aW9uLng7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJhY3Rpb24ucHJldmlvdXMueSA9IGV2ZW50LnBvc2l0aW9uLnk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5pbnRlcmFjdGlvbi5zdGFydGVkICYmICF0aGlzLmlzQ29sb3JQaWNrZXJBY3RpdmUoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVUYXJnZXQoZXZlbnQucG9zaXRpb24ueCwgZXZlbnQucG9zaXRpb24ueSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7IC8vIGVuZCBNT1VTRU1PVkVcblxuICAgICAgICAgICAgICAgIGNhc2UgRVZFTlRDT0RFUy5NT1VTRVdIRUVMOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50YXJnZXRCb2R5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRhcmdldEJvZHkuYWRqdXN0U2l6ZShldmVudC5kZWx0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZU1ldGFJbmZvKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7IC8vIGVuZCBNT1VTRVdIRUVMXG5cbiAgICAgICAgICAgICAgICBjYXNlIEVWRU5UQ09ERVMuS0VZRE9XTjpcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChldmVudC5rZXljb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEtFWUNPREVTLktfRU5URVI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVTaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBLRVlDT0RFUy5LX0M6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2xlYXIgc2ltdWxhdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2ltLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5nZnguY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNpbVRpbWVyLnN0b3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR2YWwgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBLRVlDT0RFUy5LX0I6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVTaW1TdHJhdGVneSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEtFWUNPREVTLktfUTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVF1YWRUcmVlTGluZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBLRVlDT0RFUy5LX1A6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVUcmFpbHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBLRVlDT0RFUy5LX1I6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2VuZXJhdGUgcmFuZG9tIG9iamVjdHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdlbmVyYXRlQm9kaWVzKDEwLCB7cmFuZG9tQ29sb3JzOiB0cnVlfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgS0VZQ09ERVMuS19UOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2ltLmFkZE5ld0JvZHkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiB0aGlzLm9wdGlvbnMud2lkdGggLyAyLCB5OiB0aGlzLm9wdGlvbnMuaGVpZ2h0IC8gMixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVsWDogMCwgdmVsWTogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFzczogMjAwMCwgcmFkaXVzOiA1MCwgY29sb3I6ICcjNUE1QTVBJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2ltLmFkZE5ld0JvZHkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiB0aGlzLm9wdGlvbnMud2lkdGggLSA0MDAsIHk6IHRoaXMub3B0aW9ucy5oZWlnaHQgLyAyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZWxYOiAwLCB2ZWxZOiAwLjAwMDAyNSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFzczogMSwgcmFkaXVzOiA1LCBjb2xvcjogJyM3ODc4NzgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgS0VZQ09ERVMuS19RVUVTVElPTk1BUks6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93SGVscCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrOyAvLyBlbmQgS0VZRE9XTlxuXG4gICAgICAgICAgICAgICAgY2FzZSBDT05UUk9MQ09ERVMuUExBWUJUTjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVTaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5QQVVTRUJUTjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVTaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5CQVJORVNIVVRPTkJUTjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVTaW1TdHJhdGVneSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLkJBUk5FU0hVVE9GRkJUTjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVTaW1TdHJhdGVneSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLlFVQURUUkVFT0ZGQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVF1YWRUcmVlTGluZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5RVUFEVFJFRU9OQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVF1YWRUcmVlTGluZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5DT0xMSVNJT05TT0ZGQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZUNvbGxpc2lvbnMoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5DT0xMSVNJT05TT05CVE46XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlQ29sbGlzaW9ucygpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLlRSQUlMT0ZGQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVRyYWlscygpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLlRSQUlMT05CVE46XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlVHJhaWxzKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBDT05UUk9MQ09ERVMuSEVMUEJUTjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93SGVscCgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJldHZhbDtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgLy8gUmVkcmF3IHNjcmVlblxuICAgICAgICB0aGlzLnJlZHJhdygpO1xuICAgIH1cblxuICAgIGluaXRDb21wb25lbnRzKCkge1xuICAgICAgICAvLyBDcmVhdGUgY29tcG9uZW50cyAtLSBvcmRlciBpcyBpbXBvcnRhbnRcbiAgICAgICAgdGhpcy5ldmVudHMgPSB0aGlzLmFyZ3MuZXZlbnRzID0gbmV3IEd0RXZlbnRzKHRoaXMuYXJncyk7XG4gICAgICAgIHRoaXMuc2ltID0gbmV3IEd0U2ltKHRoaXMuYXJncyk7XG4gICAgICAgIHRoaXMuZ2Z4ID0gbmV3IEd0R2Z4KHRoaXMuYXJncyk7XG4gICAgfVxuXG4gICAgaW5pdFRpbWVycygpIHtcbiAgICAgICAgLy8gQWRkIGBtYWluYCBsb29wLCBhbmQgc3RhcnQgaW1tZWRpYXRlbHlcbiAgICAgICAgdGhpcy5hbmltVGltZXIgPSBuZXcgR3RUaW1lcih0aGlzLm1haW4uYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuYW5pbVRpbWVyLnN0YXJ0KCk7XG4gICAgICAgIHRoaXMuc2ltVGltZXIgPSBuZXcgR3RUaW1lcih0aGlzLnNpbS5zdGVwLmJpbmQodGhpcy5zaW0pLCA2MCk7XG4gICAgfVxuXG4gICAgdG9nZ2xlU2ltKCkge1xuICAgICAgICB0aGlzLnNpbVRpbWVyLnRvZ2dsZSgpO1xuICAgICAgICBpZiAodGhpcy5zaW1UaW1lci5hY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMucGxheUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgdGhpcy5wYXVzZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnBsYXlCdG4uc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICAgICAgdGhpcy5wYXVzZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdG9nZ2xlU2ltU3RyYXRlZ3koKSB7XG4gICAgICAgIHRoaXMuc2ltLnRvZ2dsZVN0cmF0ZWd5KCk7XG4gICAgICAgIGlmICh0aGlzLnNpbS51c2VCcnV0ZUZvcmNlKSB7XG4gICAgICAgICAgICB0aGlzLmJhcm5lc0h1dE9uQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB0aGlzLmJhcm5lc0h1dE9mZkJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmJhcm5lc0h1dE9uQnRuLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgICAgIHRoaXMuYmFybmVzSHV0T2ZmQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVRdWFkVHJlZUxpbmVzSWNvbnMoKTtcbiAgICB9XG5cbiAgICB0b2dnbGVDb2xsaXNpb25zKCkge1xuICAgICAgICB0aGlzLnNpbS5tZXJnZUNvbGxpc2lvbnMgPSAhdGhpcy5zaW0ubWVyZ2VDb2xsaXNpb25zO1xuICAgICAgICBpZiAodGhpcy5zaW0ubWVyZ2VDb2xsaXNpb25zKSB7XG4gICAgICAgICAgICB0aGlzLmNvbGxpc2lvbnNPZmZCdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIHRoaXMuY29sbGlzaW9uc09uQnRuLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY29sbGlzaW9uc09mZkJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgICAgICB0aGlzLmNvbGxpc2lvbnNPbkJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdG9nZ2xlVHJhaWxzKCkge1xuICAgICAgICB0aGlzLm5vY2xlYXIgPSAhdGhpcy5ub2NsZWFyO1xuICAgICAgICBpZiAodGhpcy5ub2NsZWFyKSB7XG4gICAgICAgICAgICB0aGlzLnRyYWlsT2ZmQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB0aGlzLnRyYWlsT25CdG4uc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy50cmFpbE9mZkJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgICAgICB0aGlzLnRyYWlsT25CdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRvZ2dsZVF1YWRUcmVlTGluZXMoKSB7XG4gICAgICAgIHRoaXMucXVhZFRyZWVMaW5lcyA9ICF0aGlzLnF1YWRUcmVlTGluZXM7XG4gICAgICAgIHRoaXMudXBkYXRlUXVhZFRyZWVMaW5lc0ljb25zKCk7XG4gICAgfVxuXG4gICAgdXBkYXRlUXVhZFRyZWVMaW5lc0ljb25zKCkge1xuICAgICAgICBpZiAodGhpcy5zaW0udXNlQnJ1dGVGb3JjZSkge1xuICAgICAgICAgICAgdGhpcy5xdWFkVHJlZU9mZkJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgdGhpcy5xdWFkVHJlZU9uQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucXVhZFRyZWVMaW5lcykge1xuICAgICAgICAgICAgdGhpcy5xdWFkVHJlZU9mZkJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgdGhpcy5xdWFkVHJlZU9uQnRuLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucXVhZFRyZWVPZmZCdG4uc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICAgICAgdGhpcy5xdWFkVHJlZU9uQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzaG93SGVscCgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNIZWxwT3Blbikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaXNIZWxwT3BlbiA9IHRydWU7XG4gICAgICAgIHZleC5vcGVuKHtcbiAgICAgICAgICAgIHVuc2FmZUNvbnRlbnQ6IGBcbiAgICAgICAgICAgICAgICA8aDM+U2hvcnRjdXRzPC9oMz5cbiAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJzaG9ydGN1dHNcIj5cbiAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+TGVmdCBjbGljazwvdGQ+IDx0ZD4gY3JlYXRlIGJvZHk8L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD5SaWdodCBjbGljazwvdGQ+IDx0ZD4gZGVsZXRlIGJvZHk8L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD5NaWRkbGUgY2xpY2s8L3RkPiA8dGQ+IGNoYW5nZSBib2R5IGNvbG9yPC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGNvZGU+RW50ZXI8L2NvZGU+IGtleTwvdGQ+IDx0ZD4gc3RhcnQgc2ltdWxhdGlvbjwvdGQ+PC90cj5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjxjb2RlPkM8L2NvZGU+IGtleTwvdGQ+IDx0ZD4gY2xlYXIgY2FudmFzPC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGNvZGU+QjwvY29kZT4ga2V5PC90ZD4gPHRkPiB0b2dnbGUgYnJ1dGUtZm9yY2UvQmFybmVzLUh1dDwvdGQ+PC90cj5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjxjb2RlPlE8L2NvZGU+IGtleTwvdGQ+IDx0ZD4gdG9nZ2xlIHF1YWR0cmVlIGxpbmVzPC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGNvZGU+UDwvY29kZT4ga2V5PC90ZD4gPHRkPiB0b2dnbGUgcmVwYWludGluZzwvdGQ+PC90cj5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjxjb2RlPlI8L2NvZGU+IGtleTwvdGQ+IDx0ZD4gY3JlYXRlIHJhbmRvbSBib2RpZXM8L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48Y29kZT5UPC9jb2RlPiBrZXk8L3RkPiA8dGQ+IGNyZWF0ZSBUaXRhbjwvdGQ+PC90cj5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjxjb2RlPj88L2NvZGU+IGtleTwvdGQ+IDx0ZD4gc2hvdyBoZWxwPC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGFmdGVyQ2xvc2U6ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmlzSGVscE9wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmVkcmF3KCkge1xuICAgICAgICBpZiAoIXRoaXMubm9jbGVhcikge1xuICAgICAgICAgICAgdGhpcy5nZnguY2xlYXIoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5xdWFkVHJlZUxpbmVzICYmICF0aGlzLnNpbS51c2VCcnV0ZUZvcmNlKSB7XG4gICAgICAgICAgICB0aGlzLmdmeC5kcmF3UXVhZFRyZWVMaW5lcyh0aGlzLnNpbS50cmVlLnJvb3QpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZ2Z4LmRyYXdSZXRpY2xlTGluZSh0aGlzLmludGVyYWN0aW9uLmJvZHksIHRoaXMuaW50ZXJhY3Rpb24ucHJldmlvdXMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZ2Z4LmRyYXdCb2RpZXModGhpcy5zaW0uYm9kaWVzLCB0aGlzLnRhcmdldEJvZHkpO1xuICAgIH1cblxuICAgIGdlbmVyYXRlR3JpZCh3aWR0aCwgaGVpZ2h0LCBzdHlsZSkge1xuICAgICAgICAvLyBBdHRhY2ggYSBjYW52YXMgdG8gdGhlIHBhZ2UsIHRvIGhvdXNlIHRoZSBzaW11bGF0aW9uc1xuICAgICAgICBpZiAoIXN0eWxlKSB7XG4gICAgICAgICAgICBzdHlsZSA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5ncmlkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cbiAgICAgICAgdGhpcy5ncmlkLmNsYXNzTmFtZSA9ICdncmF2aXRvbmNhbnZhcyc7XG4gICAgICAgIHRoaXMuZ3JpZC53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmdyaWQuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICB0aGlzLmdyaWQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgIHRoaXMuZ3JpZC5zdHlsZS5tYXJnaW5MZWZ0ID0gc3R5bGUubWFyZ2luTGVmdCB8fCAnYXV0byc7XG4gICAgICAgIHRoaXMuZ3JpZC5zdHlsZS5tYXJnaW5SaWdodCA9IHN0eWxlLm1hcmdpblJpZ2h0IHx8ICdhdXRvJztcbiAgICAgICAgdGhpcy5ncmlkLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHN0eWxlLmJhY2tncm91bmRDb2xvciB8fCAnIzAwMDAwMCc7XG5cbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmdyaWQpO1xuICAgIH1cblxuICAgIGdlbmVyYXRlQ29udHJvbHMoKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdtZW51Jyk7XG4gICAgICAgIHRoaXMuY29udHJvbHMudHlwZSA9ICd0b29sYmFyJztcbiAgICAgICAgdGhpcy5jb250cm9scy5pZCA9ICdjb250cm9scyc7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaW5uZXJIVE1MID0gYFxuICAgICAgICAgICAgPG1lbnVpdGVtIGlkPVwicGxheWJ0blwiIGRhdGEtdG9vbHRpcD1cIlN0YXJ0IHNpbXVsYXRpb25cIj5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz1cImFzc2V0cy9wbGF5LnN2Z1wiIGFsdD1cIlN0YXJ0IHNpbXVsYXRpb25cIj5cbiAgICAgICAgICAgIDwvbWVudWl0ZW0+XG4gICAgICAgICAgICA8bWVudWl0ZW0gaWQ9XCJwYXVzZWJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIiBkYXRhLXRvb2x0aXA9XCJTdG9wIHNpbXVsYXRpb25cIj5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz1cImFzc2V0cy9wYXVzZS5zdmdcIiBhbHQ9XCJTdG9wIHNpbXVsYXRpb25cIj5cbiAgICAgICAgICAgIDwvbWVudWl0ZW0+XG4gICAgICAgICAgICA8bWVudWl0ZW0gaWQ9XCJiYXJuZXNodXRvbmJ0blwiIGRhdGEtdG9vbHRpcD1cIlN3aXRjaCB0byBicnV0ZSBmb3JjZVwiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiYXNzZXRzL2Jhcm5lc19odXRfb24uc3ZnXCIgYWx0PVwiU3dpdGNoIHRvIGJydXRlIGZvcmNlXCI+XG4gICAgICAgICAgICA8L21lbnVpdGVtPlxuICAgICAgICAgICAgPG1lbnVpdGVtIGlkPVwiYmFybmVzaHV0b2ZmYnRuXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiIGRhdGEtdG9vbHRpcD1cIlN3aXRjaCB0byBCYXJuZXMtSHV0XCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvYmFybmVzX2h1dF9vZmYuc3ZnXCIgYWx0PVwiU3dpdGNoIHRvIEJhcm5lcy1IdXRcIj5cbiAgICAgICAgICAgIDwvbWVudWl0ZW0+XG4gICAgICAgICAgICA8bWVudWl0ZW0gaWQ9XCJxdWFkdHJlZW9mZmJ0blwiIGRhdGEtdG9vbHRpcD1cIlRvZ2dsZSBxdWFkdHJlZSBsaW5lc1wiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiYXNzZXRzL3F1YWR0cmVlX29mZi5zdmdcIiBhbHQ9XCJUb2dnbGUgcXVhZHRyZWUgbGluZXNcIj5cbiAgICAgICAgICAgIDwvbWVudWl0ZW0+XG4gICAgICAgICAgICA8bWVudWl0ZW0gaWQ9XCJxdWFkdHJlZW9uYnRuXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiIGRhdGEtdG9vbHRpcD1cIlRvZ2dsZSBxdWFkdHJlZSBsaW5lc1wiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiYXNzZXRzL3F1YWR0cmVlX29uLnN2Z1wiIGFsdD1cIlRvZ2dsZSBxdWFkdHJlZSBsaW5lc1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cImNvbGxpc2lvbnNvbmJ0blwiIGRhdGEtdG9vbHRpcD1cIlRvZ2dsZSBjb2xsaXNpb25zXCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvY29sbGlzaW9uc19vbi5zdmdcIiBhbHQ9XCJUb2dnbGUgY29sbGlzaW9uc1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cImNvbGxpc2lvbnNvZmZidG5cIiBzdHlsZT1cImRpc3BsYXk6IG5vbmU7XCIgZGF0YS10b29sdGlwPVwiVG9nZ2xlIGNvbGxpc2lvbnNcIj5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz1cImFzc2V0cy9jb2xsaXNpb25zX29mZi5zdmdcIiBhbHQ9XCJUb2dnbGUgY29sbGlzaW9uc1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cInRyYWlsb2ZmYnRuXCIgZGF0YS10b29sdGlwPVwiVG9nZ2xlIHRyYWlsc1wiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiYXNzZXRzL3RyYWlsX29mZi5zdmdcIiBhbHQ9XCJUb2dnbGUgdHJhaWxzXCI+XG4gICAgICAgICAgICA8L21lbnVpdGVtPlxuICAgICAgICAgICAgPG1lbnVpdGVtIGlkPVwidHJhaWxvbmJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIiBkYXRhLXRvb2x0aXA9XCJUb2dnbGUgdHJhaWxzXCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvdHJhaWxfb24uc3ZnXCIgYWx0PVwiVG9nZ2xlIHRyYWlsc1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cImhlbHBidG5cIiBkYXRhLXRvb2x0aXA9XCJTaG9ydGN1dHNcIj5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz1cImFzc2V0cy9oZWxwLnN2Z1wiIGFsdD1cIlNob3J0Y3V0c1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIGA7XG5cbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmNvbnRyb2xzKTtcbiAgICB9XG5cbiAgICBnZW5lcmF0ZUJvZGllcyhudW0sIGFyZ3MpIHtcbiAgICAgICAgYXJncyA9IGFyZ3MgfHwge307XG5cbiAgICAgICAgbGV0IG1pblggPSBhcmdzLm1pblggfHwgMDtcbiAgICAgICAgbGV0IG1heFggPSBhcmdzLm1heFggfHwgdGhpcy5vcHRpb25zLndpZHRoO1xuICAgICAgICBsZXQgbWluWSA9IGFyZ3MubWluWSB8fCAwO1xuICAgICAgICBsZXQgbWF4WSA9IGFyZ3MubWF4WSB8fCB0aGlzLm9wdGlvbnMuaGVpZ2h0O1xuXG4gICAgICAgIGxldCBtaW5WZWxYID0gYXJncy5taW5WZWxYIHx8IDA7XG4gICAgICAgIGxldCBtYXhWZWxYID0gYXJncy5tYXhWZWxYIHx8IDAuMDAwMDE7XG4gICAgICAgIGxldCBtaW5WZWxZID0gYXJncy5taW5WZWxZIHx8IDA7XG4gICAgICAgIGxldCBtYXhWZWxZID0gYXJncy5tYXhWZWxZIHx8IDAuMDAwMDE7XG5cbiAgICAgICAgbGV0IG1pblJhZGl1cyA9IGFyZ3MubWluUmFkaXVzIHx8IDE7XG4gICAgICAgIGxldCBtYXhSYWRpdXMgPSBhcmdzLm1heFJhZGl1cyB8fCAxNTtcblxuICAgICAgICBsZXQgY29sb3IgPSBhcmdzLmNvbG9yO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChhcmdzLnJhbmRvbUNvbG9ycyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIGNvbG9yID0gcmFuZG9tLmNvbG9yKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuc2ltLmFkZE5ld0JvZHkoe1xuICAgICAgICAgICAgICAgIHg6IHJhbmRvbS5udW1iZXIobWluWCwgbWF4WCksXG4gICAgICAgICAgICAgICAgeTogcmFuZG9tLm51bWJlcihtaW5ZLCBtYXhZKSxcbiAgICAgICAgICAgICAgICB2ZWxYOiByYW5kb20uZGlyZWN0aW9uYWwobWluVmVsWCwgbWF4VmVsWCksXG4gICAgICAgICAgICAgICAgdmVsWTogcmFuZG9tLmRpcmVjdGlvbmFsKG1pblZlbFksIG1heFZlbFkpLFxuICAgICAgICAgICAgICAgIHJhZGl1czogcmFuZG9tLm51bWJlcihtaW5SYWRpdXMsIG1heFJhZGl1cyksXG4gICAgICAgICAgICAgICAgY29sb3I6IGNvbG9yXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZVRhcmdldCh4LCB5KSB7XG4gICAgICAgIHRoaXMuc2V0VGFyZ2V0Qm9keSh0aGlzLnNpbS5nZXRCb2R5QXQoeCwgeSkpO1xuICAgIH1cblxuICAgIHNldFRhcmdldEJvZHkoYm9keSkge1xuICAgICAgICB0aGlzLnRhcmdldEJvZHkgPSBib2R5O1xuICAgICAgICB0aGlzLnVwZGF0ZU1ldGFJbmZvKCk7XG4gICAgfVxuXG4gICAgdXBkYXRlTWV0YUluZm8oKSB7XG4gICAgICAgIGlmICh0aGlzLnRhcmdldEJvZHkpIHtcbiAgICAgICAgICAgIHRoaXMubWV0YUluZm8uaW5uZXJIVE1MID1cbiAgICAgICAgICAgICAgICBg4oqVICR7dGhpcy50YXJnZXRCb2R5Lm1hc3MudG9GaXhlZCgyKX0gJm5ic3A7YCArXG4gICAgICAgICAgICAgICAgYOKmvyAke3RoaXMudGFyZ2V0Qm9keS5yYWRpdXMudG9GaXhlZCgyKX0gJm5ic3A7YCArXG4gICAgICAgICAgICAgICAgYOKHlyAke3RoaXMudGFyZ2V0Qm9keS5zcGVlZC50b0ZpeGVkKDIpfWA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm1ldGFJbmZvLnRleHRDb250ZW50ID0gJyc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVDb2xvcigpIHtcbiAgICAgICAgaWYgKHRoaXMudGFyZ2V0Qm9keSkge1xuICAgICAgICAgICAgdGhpcy50YXJnZXRCb2R5LnVwZGF0ZUNvbG9yKHRoaXMuanNjb2xvci50b0hFWFN0cmluZygpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlzQ29sb3JQaWNrZXJBY3RpdmUoKSB7XG4gICAgICAgIHRoaXMud2FzQ29sb3JQaWNrZXJBY3RpdmUgPSB0aGlzLmNvbG9yUGlja2VyLmNsYXNzTmFtZS5pbmRleE9mKCdqc2NvbG9yLWFjdGl2ZScpID4gLTE7XG4gICAgICAgIHJldHVybiB0aGlzLndhc0NvbG9yUGlja2VyQWN0aXZlO1xuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL2FwcFxuIiwiaW1wb3J0IGNvbG9ycyBmcm9tICcuLi91dGlsL2NvbG9ycyc7XG5cbi8qKlxuICogZ3Jhdml0b24vYm9keSAtLSBUaGUgZ3Jhdml0YXRpb25hbCBib2R5XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd0Qm9keSB7XG4gICAgY29uc3RydWN0b3IoYXJncykge1xuICAgICAgICBhcmdzID0gYXJncyB8fCB7fTtcblxuICAgICAgICB0aGlzLnggPSBhcmdzLng7XG4gICAgICAgIHRoaXMueSA9IGFyZ3MueTtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnggIT09ICdudW1iZXInIHx8IHR5cGVvZiB0aGlzLnkgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcignQ29ycmVjdCBwb3NpdGlvbnMgd2VyZSBub3QgZ2l2ZW4gZm9yIHRoZSBib2R5LicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5uZXh0WCA9IHRoaXMueDtcbiAgICAgICAgdGhpcy5uZXh0WSA9IHRoaXMueTtcblxuICAgICAgICB0aGlzLnZlbFggPSBhcmdzLnZlbFggfHwgMDtcbiAgICAgICAgdGhpcy52ZWxZID0gYXJncy52ZWxZIHx8IDA7XG5cbiAgICAgICAgdGhpcy5yYWRpdXMgPSBhcmdzLnJhZGl1cztcbiAgICAgICAgdGhpcy5tYXNzID0gYXJncy5tYXNzO1xuXG4gICAgICAgIGlmICgncmFkaXVzJyBpbiBhcmdzICYmICEoJ21hc3MnIGluIGFyZ3MpKSB7XG4gICAgICAgICAgICB0aGlzLmZvcmNlUmFkaXVzKGFyZ3MucmFkaXVzKTtcbiAgICAgICAgfSBlbHNlIGlmICgnbWFzcycgaW4gYXJncyAmJiAhKCdyYWRpdXMnIGluIGFyZ3MpKSB7XG4gICAgICAgICAgICB0aGlzLmZvcmNlTWFzcyhhcmdzLm1hc3MpO1xuICAgICAgICB9IGVsc2UgaWYgKCEoJ21hc3MnIGluIGFyZ3MpICYmICEoJ3JhZGl1cycgaW4gYXJncykpIHtcbiAgICAgICAgICAgIC8vIERlZmF1bHQgdG8gYSByYWRpdXMgb2YgMTBcbiAgICAgICAgICAgIHRoaXMuZm9yY2VSYWRpdXMoMTApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb2xvciA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5oaWdobGlnaHQgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgdGhpcy51cGRhdGVDb2xvcihhcmdzLmNvbG9yIHx8ICcjZGJkM2M4Jyk7XG4gICAgfVxuXG4gICAgYWRqdXN0U2l6ZShkZWx0YSkge1xuICAgICAgICB0aGlzLmZvcmNlUmFkaXVzKE1hdGgubWF4KHRoaXMucmFkaXVzICsgZGVsdGEsIDIpKTtcbiAgICB9XG5cbiAgICBmb3JjZVJhZGl1cyhyYWRpdXMpIHtcbiAgICAgICAgdGhpcy5yYWRpdXMgPSByYWRpdXM7XG4gICAgICAgIC8vIERvcmt5IGZvcm11bGEgdG8gbWFrZSBtYXNzIHNjYWxlIFwicHJvcGVybHlcIiB3aXRoIHJhZGl1cy5cbiAgICAgICAgdGhpcy5tYXNzID0gTWF0aC5wb3codGhpcy5yYWRpdXMgLyA0LCAzKTtcbiAgICB9XG5cbiAgICBmb3JjZU1hc3MobWFzcykge1xuICAgICAgICAvLyBOb3JtYWxseSB0aGUgbWFzcyBpcyBjYWxjdWxhdGVkIGJhc2VkIG9uIHRoZSByYWRpdXMsIGJ1dCB3ZSBjYW4gZG8gdGhlIHJldmVyc2VcbiAgICAgICAgdGhpcy5tYXNzID0gbWFzcztcbiAgICAgICAgdGhpcy5yYWRpdXMgPSBNYXRoLnBvdyh0aGlzLm1hc3MsIDEvMykgKiA0O1xuICAgIH1cblxuICAgIHVwZGF0ZUNvbG9yKGNvbG9yKSB7XG4gICAgICAgIHRoaXMuY29sb3IgPSBjb2xvcjtcbiAgICAgICAgdGhpcy5oaWdobGlnaHQgPSBjb2xvcnMudG9IZXgoY29sb3JzLmJyaWdodGVuKGNvbG9ycy5mcm9tSGV4KHRoaXMuY29sb3IpLCAuMjUpKTtcbiAgICB9XG5cbiAgICBnZXQgc3BlZWQoKSB7XG4gICAgICAgIC8vIFZlbG9jaXRpZXMgYXJlIHRpbnksIHNvIHVwc2NhbGUgaXQgKGFyYml0cmFyaWx5KSB0byBtYWtlIGl0IHJlYWRhYmxlLlxuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMudmVsWCAqIHRoaXMudmVsWCArIHRoaXMudmVsWSAqIHRoaXMudmVsWSkgKiAxZTY7XG4gICAgfVxufSAvLyBlbmQgZ3Jhdml0b24vYm9keVxuIiwiLyoqXG4gKiBncmF2aXRvbi9ldmVudHMgLS0gRXZlbnQgcXVldWVpbmcgYW5kIHByb2Nlc3NpbmdcbiAqL1xuZXhwb3J0IGNvbnN0IEtFWUNPREVTID0ge1xuICAgIEtfTEVGVDogMzcsXG4gICAgS19VUDogMzgsXG4gICAgS19SSUdIVDogMzksXG4gICAgS19ET1dOOiA0MCxcblxuICAgIEtfMDogNDgsXG4gICAgS18xOiA0OSxcbiAgICBLXzI6IDUwLFxuICAgIEtfMzogNTEsXG4gICAgS180OiA1MixcbiAgICBLXzU6IDUzLFxuICAgIEtfNjogNTQsXG4gICAgS183OiA1NSxcbiAgICBLXzg6IDU2LFxuICAgIEtfOTogNTcsXG5cbiAgICBLX0E6IDY1LFxuICAgIEtfQjogNjYsXG4gICAgS19DOiA2NyxcbiAgICBLX0Q6IDY4LFxuICAgIEtfRTogNjksXG4gICAgS19GOiA3MCxcbiAgICBLX0c6IDcxLFxuICAgIEtfSDogNzIsXG4gICAgS19JOiA3MyxcbiAgICBLX0o6IDc0LFxuICAgIEtfSzogNzUsXG4gICAgS19MOiA3NixcbiAgICBLX006IDc3LFxuICAgIEtfTjogNzgsXG4gICAgS19POiA3OSxcbiAgICBLX1A6IDgwLFxuICAgIEtfUTogODEsXG4gICAgS19SOiA4MixcbiAgICBLX1M6IDgzLFxuICAgIEtfVDogODQsXG4gICAgS19VOiA4NSxcbiAgICBLX1Y6IDg2LFxuICAgIEtfVzogODcsXG4gICAgS19YOiA4OCxcbiAgICBLX1k6IDg5LFxuICAgIEtfWjogOTAsXG5cbiAgICBLX0tQMTogOTcsXG4gICAgS19LUDI6IDk4LFxuICAgIEtfS1AzOiA5OSxcbiAgICBLX0tQNDogMTAwLFxuICAgIEtfS1A1OiAxMDEsXG4gICAgS19LUDY6IDEwMixcbiAgICBLX0tQNzogMTAzLFxuICAgIEtfS1A4OiAxMDQsXG4gICAgS19LUDk6IDEwNSxcblxuICAgIEtfUVVFU1RJT05NQVJLOiAxOTEsXG5cbiAgICBLX0JBQ0tTUEFDRTogOCxcbiAgICBLX1RBQjogOSxcbiAgICBLX0VOVEVSOiAxMyxcbiAgICBLX1NISUZUOiAxNixcbiAgICBLX0NUUkw6IDE3LFxuICAgIEtfQUxUOiAxOCxcbiAgICBLX0VTQzogMjcsXG4gICAgS19TUEFDRTogMzJcbn07XG5cbmV4cG9ydCBjb25zdCBNT1VTRUNPREVTID0ge1xuICAgIE1fTEVGVDogMCxcbiAgICBNX01JRERMRTogMSxcbiAgICBNX1JJR0hUOiAyXG59O1xuXG5leHBvcnQgY29uc3QgRVZFTlRDT0RFUyA9IHtcbiAgICBNT1VTRURPV046IDEwMDAsXG4gICAgTU9VU0VVUDogMTAwMSxcbiAgICBNT1VTRU1PVkU6IDEwMDIsXG4gICAgTU9VU0VXSEVFTDogMTAwMyxcbiAgICBDTElDSzogMTAwNCxcbiAgICBEQkxDTElDSzogMTAwNSxcblxuICAgIEtFWURPV046IDEwMTAsXG4gICAgS0VZVVA6IDEwMTFcbn07XG5cbmV4cG9ydCBjb25zdCBDT05UUk9MQ09ERVMgPSB7XG4gICAgUExBWUJUTjogMjAwMCxcbiAgICBQQVVTRUJUTjogMjAwMSxcbiAgICBUUkFJTE9GRkJUTjogMjAwMixcbiAgICBUUkFJTE9OQlROOiAyMDAzLFxuICAgIEhFTFBCVE46IDIwMDQsXG4gICAgUVVBRFRSRUVPRkZCVE46IDIwMDUsXG4gICAgUVVBRFRSRUVPTkJUTjogMjAwNixcbiAgICBCQVJORVNIVVRPTkJUTjogMjAwNyxcbiAgICBCQVJORVNIVVRPRkZCVE46IDIwMDgsXG4gICAgQ09MTElTSU9OU09GRkJUTjogMjAwOSxcbiAgICBDT0xMSVNJT05TT05CVE46IDIwMTBcbn07XG5cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR3RFdmVudHMge1xuICAgIGNvbnN0cnVjdG9yKGFyZ3MpIHtcbiAgICAgICAgYXJncyA9IGFyZ3MgfHwge307XG5cbiAgICAgICAgdGhpcy5xdWV1ZSA9IFtdO1xuXG4gICAgICAgIGlmICh0eXBlb2YgYXJncy5ncmlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ05vIHVzYWJsZSBjYW52YXMgZWxlbWVudCB3YXMgZ2l2ZW4uJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ncmlkID0gYXJncy5ncmlkO1xuICAgICAgICB0aGlzLmNvbnRyb2xzID0gYXJncy5jb250cm9scztcbiAgICAgICAgdGhpcy5wbGF5QnRuID0gYXJncy5wbGF5QnRuO1xuICAgICAgICB0aGlzLnBhdXNlQnRuID0gYXJncy5wYXVzZUJ0bjtcbiAgICAgICAgdGhpcy5iYXJuZXNIdXRPbkJ0biA9IGFyZ3MuYmFybmVzSHV0T25CdG47XG4gICAgICAgIHRoaXMuYmFybmVzSHV0T2ZmQnRuID0gYXJncy5iYXJuZXNIdXRPZmZCdG47XG4gICAgICAgIHRoaXMucXVhZFRyZWVPZmZCdG4gPSBhcmdzLnF1YWRUcmVlT2ZmQnRuO1xuICAgICAgICB0aGlzLnF1YWRUcmVlT25CdG4gPSBhcmdzLnF1YWRUcmVlT25CdG47XG4gICAgICAgIHRoaXMuY29sbGlzaW9uc09mZkJ0biA9IGFyZ3MuY29sbGlzaW9uc09mZkJ0bjtcbiAgICAgICAgdGhpcy5jb2xsaXNpb25zT25CdG4gPSBhcmdzLmNvbGxpc2lvbnNPbkJ0bjtcbiAgICAgICAgdGhpcy50cmFpbE9mZkJ0biA9IGFyZ3MudHJhaWxPZmZCdG47XG4gICAgICAgIHRoaXMudHJhaWxPbkJ0biA9IGFyZ3MudHJhaWxPbkJ0bjtcbiAgICAgICAgdGhpcy5oZWxwQnRuID0gYXJncy5oZWxwQnRuO1xuXG4gICAgICAgIHRoaXMud2lyZXVwRXZlbnRzKCk7XG4gICAgfVxuXG4gICAgcWFkZChldmVudCkge1xuICAgICAgICB0aGlzLnF1ZXVlLnB1c2goZXZlbnQpO1xuICAgIH1cblxuICAgIHFwb2xsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5xdWV1ZS5zaGlmdCgpO1xuICAgIH1cblxuICAgIHFnZXQoKSB7XG4gICAgICAgIC8vIFJlcGxhY2luZyB0aGUgcmVmZXJlbmNlIGlzIGZhc3RlciB0aGFuIGBzcGxpY2UoKWBcbiAgICAgICAgbGV0IHJlZiA9IHRoaXMucXVldWU7XG4gICAgICAgIHRoaXMucXVldWUgPSBbXTtcbiAgICAgICAgcmV0dXJuIHJlZjtcbiAgICB9XG5cbiAgICBxY2xlYXIoKSB7XG4gICAgICAgIHRoaXMucXVldWUgPSBbXTtcbiAgICB9XG5cbiAgICB3aXJldXBFdmVudHMoKSB7XG4gICAgICAgIC8vIEdyaWQgbW91c2UgZXZlbnRzXG4gICAgICAgIHRoaXMuZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ2xpY2suYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdkYmxjbGljaycsIHRoaXMuaGFuZGxlRGJsQ2xpY2suYmluZCh0aGlzKSk7XG5cbiAgICAgICAgdGhpcy5ncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgdGhpcy5oYW5kbGVDb250ZXh0TWVudS5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5ncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuaGFuZGxlTW91c2VEb3duLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmdyaWQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuaGFuZGxlTW91c2VVcC5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5ncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuaGFuZGxlTW91c2VNb3ZlLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmdyaWQuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCB0aGlzLmhhbmRsZU1vdXNlV2hlZWwuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgLy8gR3JpZCBrZXkgZXZlbnRzXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmhhbmRsZUtleURvd24uYmluZCh0aGlzKSk7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5oYW5kbGVLZXlVcC5iaW5kKHRoaXMpKTtcblxuICAgICAgICAvLyBDb250cm9sIGV2ZW50c1xuICAgICAgICB0aGlzLnBsYXlCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNvbnRyb2xDbGljay5iaW5kKHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIENPTlRST0xDT0RFUy5QTEFZQlROKSk7XG4gICAgICAgIHRoaXMucGF1c2VCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNvbnRyb2xDbGljay5iaW5kKHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIENPTlRST0xDT0RFUy5QQVVTRUJUTikpO1xuICAgICAgICB0aGlzLmJhcm5lc0h1dE9uQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDb250cm9sQ2xpY2suYmluZCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICBDT05UUk9MQ09ERVMuQkFSTkVTSFVUT05CVE4pKTtcbiAgICAgICAgdGhpcy5iYXJuZXNIdXRPZmZCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNvbnRyb2xDbGljay5iaW5kKHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIENPTlRST0xDT0RFUy5CQVJORVNIVVRPRkZCVE4pKTtcbiAgICAgICAgdGhpcy5xdWFkVHJlZU9mZkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ29udHJvbENsaWNrLmJpbmQodGhpcyxcbiAgICAgICAgICAgICAgICAgICAgQ09OVFJPTENPREVTLlFVQURUUkVFT0ZGQlROKSk7XG4gICAgICAgIHRoaXMucXVhZFRyZWVPbkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ29udHJvbENsaWNrLmJpbmQodGhpcyxcbiAgICAgICAgICAgICAgICAgICAgQ09OVFJPTENPREVTLlFVQURUUkVFT05CVE4pKTtcbiAgICAgICAgdGhpcy5jb2xsaXNpb25zT25CdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNvbnRyb2xDbGljay5iaW5kKHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIENPTlRST0xDT0RFUy5DT0xMSVNJT05TT05CVE4pKTtcbiAgICAgICAgdGhpcy5jb2xsaXNpb25zT2ZmQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDb250cm9sQ2xpY2suYmluZCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICBDT05UUk9MQ09ERVMuQ09MTElTSU9OU09GRkJUTikpO1xuICAgICAgICB0aGlzLnRyYWlsT2ZmQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDb250cm9sQ2xpY2suYmluZCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICBDT05UUk9MQ09ERVMuVFJBSUxPRkZCVE4pKTtcbiAgICAgICAgdGhpcy50cmFpbE9uQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDb250cm9sQ2xpY2suYmluZCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICBDT05UUk9MQ09ERVMuVFJBSUxPTkJUTikpO1xuICAgICAgICB0aGlzLmhlbHBCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNvbnRyb2xDbGljay5iaW5kKHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIENPTlRST0xDT0RFUy5IRUxQQlROKSk7XG4gICAgfVxuXG4gICAgaGFuZGxlQ2xpY2soZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuQ0xJQ0ssXG4gICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5nZXRQb3NpdGlvbihldmVudCksXG4gICAgICAgICAgICBidXR0b246IGV2ZW50LmJ1dHRvbixcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBoYW5kbGVEYmxDbGljayhldmVudCkge1xuICAgICAgICB0aGlzLnFhZGQoe1xuICAgICAgICAgICAgdHlwZTogRVZFTlRDT0RFUy5EQkxDTElDSyxcbiAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmdldFBvc2l0aW9uKGV2ZW50KSxcbiAgICAgICAgICAgIGJ1dHRvbjogZXZlbnQuYnV0dG9uLFxuICAgICAgICAgICAgc2hpZnQ6IGV2ZW50LnNoaWZ0S2V5LFxuICAgICAgICAgICAgY3RybDogZXZlbnQuY3RybEtleSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogZXZlbnQudGltZVN0YW1wXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGhhbmRsZUNvbnRleHRNZW51KGV2ZW50KSB7XG4gICAgICAgIC8vIFByZXZlbnQgcmlnaHQtY2xpY2sgbWVudVxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cblxuICAgIGhhbmRsZU1vdXNlRG93bihldmVudCkge1xuICAgICAgICB0aGlzLnFhZGQoe1xuICAgICAgICAgICAgdHlwZTogRVZFTlRDT0RFUy5NT1VTRURPV04sXG4gICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5nZXRQb3NpdGlvbihldmVudCksXG4gICAgICAgICAgICBidXR0b246IGV2ZW50LmJ1dHRvbixcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBoYW5kbGVNb3VzZVVwKGV2ZW50KSB7XG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiBFVkVOVENPREVTLk1PVVNFVVAsXG4gICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5nZXRQb3NpdGlvbihldmVudCksXG4gICAgICAgICAgICBidXR0b246IGV2ZW50LmJ1dHRvbixcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBoYW5kbGVNb3VzZU1vdmUoZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuTU9VU0VNT1ZFLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuZ2V0UG9zaXRpb24oZXZlbnQpLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlTW91c2VXaGVlbChldmVudCkge1xuICAgICAgICAvLyBSZXZlcnNlIHRoZSB1cC9kb3duLlxuICAgICAgICBsZXQgZGVsdGEgPSAtZXZlbnQuZGVsdGFZIC8gNTA7XG5cbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuTU9VU0VXSEVFTCxcbiAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmdldFBvc2l0aW9uKGV2ZW50KSxcbiAgICAgICAgICAgIGRlbHRhOiBkZWx0YSxcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBQcmV2ZW50IHRoZSB3aW5kb3cgZnJvbSBzY3JvbGxpbmdcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICBoYW5kbGVLZXlEb3duKGV2ZW50KSB7XG4gICAgICAgIC8vIEFjY291bnQgZm9yIGJyb3dzZXIgZGlzY3JlcGFuY2llc1xuICAgICAgICBsZXQga2V5ID0gZXZlbnQua2V5Q29kZSB8fCBldmVudC53aGljaDtcblxuICAgICAgICB0aGlzLnFhZGQoe1xuICAgICAgICAgICAgdHlwZTogRVZFTlRDT0RFUy5LRVlET1dOLFxuICAgICAgICAgICAga2V5Y29kZToga2V5LFxuICAgICAgICAgICAgc2hpZnQ6IGV2ZW50LnNoaWZ0S2V5LFxuICAgICAgICAgICAgY3RybDogZXZlbnQuY3RybEtleSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogZXZlbnQudGltZVN0YW1wXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGhhbmRsZUtleVVwKGV2ZW50KSB7XG4gICAgICAgIC8vIEFjY291bnQgZm9yIGJyb3dzZXIgZGlzY3JlcGFuY2llc1xuICAgICAgICBsZXQga2V5ID0gZXZlbnQua2V5Q29kZSB8fCBldmVudC53aGljaDtcblxuICAgICAgICB0aGlzLnFhZGQoe1xuICAgICAgICAgICAgdHlwZTogRVZFTlRDT0RFUy5LRVlVUCxcbiAgICAgICAgICAgIGtleWNvZGU6IGtleSxcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBoYW5kbGVDb250cm9sQ2xpY2sodHlwZSwgZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBnZXRQb3NpdGlvbihldmVudCkge1xuICAgICAgICAvLyBDYWxjdWxhdGUgb2Zmc2V0IG9uIHRoZSBncmlkIGZyb20gY2xpZW50WC9ZLCBiZWNhdXNlXG4gICAgICAgIC8vIHNvbWUgYnJvd3NlcnMgZG9uJ3QgaGF2ZSBldmVudC5vZmZzZXRYL1lcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IGV2ZW50LmNsaWVudFggLSB0aGlzLmdyaWQub2Zmc2V0TGVmdCxcbiAgICAgICAgICAgIHk6IGV2ZW50LmNsaWVudFkgLSB0aGlzLmdyaWQub2Zmc2V0VG9wXG4gICAgICAgIH07XG4gICAgfVxufSAvLyBlbmQgZ3Jhdml0b24vZXZlbnRzXG4iLCIvKipcbiAqIGdyYXZpdG9uL2dmeCAtLSBUaGUgZ3JhcGhpY3Mgb2JqZWN0XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd0R2Z4IHtcbiAgICBjb25zdHJ1Y3RvcihhcmdzKSB7XG4gICAgICAgIGFyZ3MgPSBhcmdzIHx8IHt9O1xuXG4gICAgICAgIHRoaXMuZ3JpZCA9IHR5cGVvZiBhcmdzLmdyaWQgPT09ICdzdHJpbmcnID9cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGFyZ3MuZ3JpZCkgOlxuICAgICAgICAgICAgYXJncy5ncmlkO1xuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5ncmlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ05vIHVzYWJsZSBjYW52YXMgZWxlbWVudCB3YXMgZ2l2ZW4uJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmN0eCA9IHRoaXMuZ3JpZC5nZXRDb250ZXh0KCcyZCcpO1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICAvLyBTZXR0aW5nIHRoZSB3aWR0aCBoYXMgdGhlIHNpZGUgZWZmZWN0XG4gICAgICAgIC8vIG9mIGNsZWFyaW5nIHRoZSBjYW52YXNcbiAgICAgICAgdGhpcy5ncmlkLndpZHRoID0gdGhpcy5ncmlkLndpZHRoO1xuICAgIH1cblxuICAgIGRyYXdCb2RpZXMoYm9kaWVzLCB0YXJnZXRCb2R5KSB7XG4gICAgICAgIGZvciAobGV0IGJvZHkgb2YgYm9kaWVzKSB7XG4gICAgICAgICAgICB0aGlzLl9kcmF3Qm9keShib2R5LCAvKiBpc1RhcmdldGVkICovIGJvZHkgPT09IHRhcmdldEJvZHkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2RyYXdCb2R5KGJvZHksIGlzVGFyZ2V0ZWQpIHtcbiAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gYm9keS5jb2xvcjtcblxuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5jdHguYXJjKGJvZHkueCwgYm9keS55LCBib2R5LnJhZGl1cywgMCwgTWF0aC5QSSAqIDIsIHRydWUpO1xuXG4gICAgICAgIHRoaXMuY3R4LmZpbGwoKTtcbiAgICAgICAgaWYgKGlzVGFyZ2V0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gYm9keS5oaWdobGlnaHQ7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSBNYXRoLnJvdW5kKGJvZHkucmFkaXVzIC8gOCk7XG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRyYXdSZXRpY2xlTGluZShmcm9tLCB0bykge1xuICAgICAgICBsZXQgZ3JhZCA9IHRoaXMuY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KGZyb20ueCwgZnJvbS55LCB0by54LCB0by55KTtcbiAgICAgICAgZ3JhZC5hZGRDb2xvclN0b3AoMCwgJ3JnYmEoMzEsIDc1LCAxMzAsIDEpJyk7XG4gICAgICAgIGdyYWQuYWRkQ29sb3JTdG9wKDEsICdyZ2JhKDMxLCA3NSwgMTMwLCAwLjEpJyk7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gZ3JhZDtcbiAgICAgICAgdGhpcy5jdHgubGluZVdpZHRoID0gNjtcbiAgICAgICAgdGhpcy5jdHgubGluZUNhcCA9ICdyb3VuZCc7XG5cbiAgICAgICAgLy8gRHJhdyBpbml0aWFsIGJhY2tncm91bmQgbGluZS5cbiAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuY3R4Lm1vdmVUbyhmcm9tLngsIGZyb20ueSk7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0by54LCB0by55KTtcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XG5cbiAgICAgICAgLy8gRHJhdyBvdmVybGF5IGxpbmUuXG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gJyMzNDc3Q0EnO1xuICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSAyO1xuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5jdHgubW92ZVRvKGZyb20ueCwgZnJvbS55KTtcbiAgICAgICAgdGhpcy5jdHgubGluZVRvKHRvLngsIHRvLnkpO1xuICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcbiAgICB9XG5cbiAgICBkcmF3UXVhZFRyZWVMaW5lcyh0cmVlTm9kZSkge1xuICAgICAgICAvLyBTZXR1cCBsaW5lIHN0eWxlIGFuZCBjYWxsIHRoZSBkcmF3aW5nIHJvdXRpbmVzXG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gJyMwMDAnO1xuICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSAxO1xuICAgICAgICB0aGlzLmN0eC5saW5lQ2FwID0gJ2J1dHQnO1xuICAgICAgICB0aGlzLl9kcmF3UXVhZFRyZWVMaW5lKHRyZWVOb2RlKTtcbiAgICB9XG5cbiAgICBfZHJhd1F1YWRUcmVlTGluZSh0cmVlTm9kZSkge1xuICAgICAgICBpZiAoIXRyZWVOb2RlIHx8ICF0cmVlTm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRHJhdyB4IGFuZCB5IGxpbmVzXG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmN0eC5tb3ZlVG8odHJlZU5vZGUubWlkWCwgdHJlZU5vZGUuc3RhcnRZKTtcbiAgICAgICAgdGhpcy5jdHgubGluZVRvKHRyZWVOb2RlLm1pZFgsIHRyZWVOb2RlLnN0YXJ0WSArIHRyZWVOb2RlLmhlaWdodCk7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuXG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmN0eC5tb3ZlVG8odHJlZU5vZGUuc3RhcnRYLCB0cmVlTm9kZS5taWRZKTtcbiAgICAgICAgdGhpcy5jdHgubGluZVRvKHRyZWVOb2RlLnN0YXJ0WCArIHRyZWVOb2RlLndpZHRoLCB0cmVlTm9kZS5taWRZKTtcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBjaGlsZE5vZGUgb2YgdHJlZU5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIHRoaXMuX2RyYXdRdWFkVHJlZUxpbmUoY2hpbGROb2RlKTtcbiAgICAgICAgfVxuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL2dmeFxuIiwiLyoqXG4gKiBncmF2aXRvbi9zaW0gLS0gVGhlIGdyYXZpdGF0aW9uYWwgc2ltdWxhdG9yXG4gKi9cbmltcG9ydCBHdEJvZHkgZnJvbSAnLi9ib2R5JztcbmltcG9ydCBHdFRyZWUgZnJvbSAnLi90cmVlJztcbmltcG9ydCBjb2xvcnMgZnJvbSAnLi4vdXRpbC9jb2xvcnMnO1xuXG4vKiogRXhlcnQgZm9yY2Ugb24gYSBib2R5IGFuZCB1cGRhdGUgaXRzIG5leHQgcG9zaXRpb24uICovXG5mdW5jdGlvbiBleGVydEZvcmNlKGJvZHksIG5ldEZ4LCBuZXRGeSwgZGVsdGFUKSB7XG4gICAgLy8gQ2FsY3VsYXRlIGFjY2VsZXJhdGlvbnNcbiAgICBjb25zdCBheCA9IG5ldEZ4IC8gYm9keS5tYXNzO1xuICAgIGNvbnN0IGF5ID0gbmV0RnkgLyBib2R5Lm1hc3M7XG5cbiAgICAvLyBDYWxjdWxhdGUgbmV3IHZlbG9jaXRpZXMsIG5vcm1hbGl6ZWQgYnkgdGhlICd0aW1lJyBpbnRlcnZhbFxuICAgIGJvZHkudmVsWCArPSBkZWx0YVQgKiBheDtcbiAgICBib2R5LnZlbFkgKz0gZGVsdGFUICogYXk7XG5cbiAgICAvLyBDYWxjdWxhdGUgbmV3IHBvc2l0aW9ucyBhZnRlciB0aW1lc3RlcCBkZWx0YVRcbiAgICAvLyBOb3RlIHRoYXQgdGhpcyBkb2Vzbid0IHVwZGF0ZSB0aGUgY3VycmVudCBwb3NpdGlvbiBpdHNlbGYgaW4gb3JkZXIgdG8gbm90IGFmZmVjdCBvdGhlclxuICAgIC8vIGZvcmNlIGNhbGN1bGF0aW9uc1xuICAgIGJvZHkubmV4dFggKz0gZGVsdGFUICogYm9keS52ZWxYO1xuICAgIGJvZHkubmV4dFkgKz0gZGVsdGFUICogYm9keS52ZWxZO1xufVxuXG4vKiogQ2FsY3VsYXRlIHRoZSBmb3JjZSBleGVydGVkIGJldHdlZW4gYSBib2R5IGFuZCBhbiBhdHRyYWN0b3IgYmFzZWQgb24gZ3Jhdml0eS4gKi9cbmZ1bmN0aW9uIGNhbGN1bGF0ZUZvcmNlKGJvZHksIGF0dHJhY3RvciwgRykge1xuICAgIC8vIENhbGN1bGF0ZSB0aGUgY2hhbmdlIGluIHBvc2l0aW9uIGFsb25nIHRoZSB0d28gZGltZW5zaW9uc1xuICAgIGNvbnN0IGR4ID0gYXR0cmFjdG9yLnggLSBib2R5Lng7XG4gICAgY29uc3QgZHkgPSBhdHRyYWN0b3IueSAtIGJvZHkueTtcblxuICAgIC8vIE9idGFpbiB0aGUgZGlzdGFuY2UgYmV0d2VlbiB0aGUgb2JqZWN0cyAoaHlwb3RlbnVzZSlcbiAgICBjb25zdCByID0gTWF0aC5zcXJ0KE1hdGgucG93KGR4LCAyKSArIE1hdGgucG93KGR5LCAyKSk7XG5cbiAgICAvLyBDYWxjdWxhdGUgZm9yY2UgdXNpbmcgTmV3dG9uaWFuIGdyYXZpdHksIHNlcGFyYXRlIG91dCBpbnRvIHggYW5kIHkgY29tcG9uZW50c1xuICAgIGNvbnN0IEYgPSAoRyAqIGJvZHkubWFzcyAqIGF0dHJhY3Rvci5tYXNzKSAvIE1hdGgucG93KHIsIDIpO1xuICAgIGNvbnN0IEZ4ID0gRiAqIChkeCAvIHIpO1xuICAgIGNvbnN0IEZ5ID0gRiAqIChkeSAvIHIpO1xuICAgIHJldHVybiBbRngsIEZ5XTtcbn1cblxuLyoqIENoZWNrcyB3aGV0aGVyIG9yIG5vdCB0d28gYm9kaWVzIGFyZSBjb2xsaWRpbmcuICovXG5mdW5jdGlvbiBhcmVDb2xsaWRpbmcoYm9keSwgY29sbGlkZXIsIHRoZXRhID0gMC4zKSB7XG4gICAgY29uc3QgZGlzdCA9IGJvZHkucmFkaXVzICsgY29sbGlkZXIucmFkaXVzO1xuICAgIGNvbnN0IGR4ID0gYm9keS54IC0gY29sbGlkZXIueDtcbiAgICBjb25zdCBkeSA9IGJvZHkueSAtIGNvbGxpZGVyLnk7XG4gICAgcmV0dXJuIChkaXN0ICogZGlzdCkgKiB0aGV0YSA+IChkeCAqIGR4KSArIChkeSAqIGR5KTtcbn1cblxuY2xhc3MgR3RCcnV0ZUZvcmNlU2ltIHtcbiAgICAvKiogRyByZXByZXNlbnRzIHRoZSBncmF2aXRhdGlvbmFsIGNvbnN0YW50LiAqL1xuICAgIGNvbnN0cnVjdG9yKEcpIHtcbiAgICAgICAgdGhpcy5HID0gRztcbiAgICB9XG5cbiAgICAvKiogQ2FsY3VsYXRlIHRoZSBuZXcgcG9zaXRpb24gb2YgYSBib2R5IGJhc2VkIG9uIGJydXRlIGZvcmNlIG1lY2hhbmljcy4gKi9cbiAgICBjYWxjdWxhdGVOZXdQb3NpdGlvbihib2R5LCBhdHRyYWN0b3JzLCB1bnVzZWRUcmVlUm9vdCwgZGVsdGFUKSB7XG4gICAgICAgIGxldCBuZXRGeCA9IDA7XG4gICAgICAgIGxldCBuZXRGeSA9IDA7XG5cbiAgICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGFsbCBib2RpZXMgYW5kIHN1bSB0aGUgZm9yY2VzIGV4ZXJ0ZWRcbiAgICAgICAgZm9yIChjb25zdCBhdHRyYWN0b3Igb2YgYXR0cmFjdG9ycykge1xuICAgICAgICAgICAgaWYgKGJvZHkgIT09IGF0dHJhY3Rvcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IFtGeCwgRnldID0gY2FsY3VsYXRlRm9yY2UoYm9keSwgYXR0cmFjdG9yLCB0aGlzLkcpO1xuICAgICAgICAgICAgICAgIG5ldEZ4ICs9IEZ4O1xuICAgICAgICAgICAgICAgIG5ldEZ5ICs9IEZ5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXhlcnRGb3JjZShib2R5LCBuZXRGeCwgbmV0RnksIGRlbHRhVCk7XG4gICAgfVxufVxuXG5jbGFzcyBHdEJhcm5lc0h1dFNpbSB7XG4gICAgLyoqIEcgcmVwcmVzZW50cyB0aGUgZ3Jhdml0YXRpb25hbCBjb25zdGFudC4gKi9cbiAgICBjb25zdHJ1Y3RvcihHLCB0aGV0YSkge1xuICAgICAgICB0aGlzLkcgPSBHO1xuICAgICAgICB0aGlzLnRoZXRhID0gdGhldGE7XG4gICAgICAgIHRoaXMuX25ldEZ4ID0gMDtcbiAgICAgICAgdGhpcy5fbmV0RnkgPSAwO1xuICAgIH1cblxuICAgIC8qKiBDYWxjdWxhdGUgdGhlIG5ldyBwb3NpdGlvbiBvZiBhIGJvZHkgYmFzZWQgb24gYnJ1dGUgZm9yY2UgbWVjaGFuaWNzLiAqL1xuICAgIGNhbGN1bGF0ZU5ld1Bvc2l0aW9uKGJvZHksIGF0dHJhY3RvcnMsIHRyZWVSb290LCBkZWx0YVQpIHtcbiAgICAgICAgdGhpcy5fbmV0RnggPSAwO1xuICAgICAgICB0aGlzLl9uZXRGeSA9IDA7XG5cbiAgICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGFsbCBib2RpZXMgaW4gdGhlIHRyZWUgYW5kIHN1bSB0aGUgZm9yY2VzIGV4ZXJ0ZWRcbiAgICAgICAgdGhpcy5jYWxjdWxhdGVGb3JjZUZyb21UcmVlKGJvZHksIHRyZWVSb290KTtcbiAgICAgICAgZXhlcnRGb3JjZShib2R5LCB0aGlzLl9uZXRGeCwgdGhpcy5fbmV0RnksIGRlbHRhVCk7XG4gICAgfVxuXG4gICAgY2FsY3VsYXRlRm9yY2VGcm9tVHJlZShib2R5LCB0cmVlTm9kZSkge1xuICAgICAgICAvLyBIYW5kbGUgZW1wdHkgbm9kZXNcbiAgICAgICAgaWYgKCF0cmVlTm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0cmVlTm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgLy8gVGhlIG5vZGUgaXMgZXh0ZXJuYWwgKGl0J3MgYW4gYWN0dWFsIGJvZHkpXG4gICAgICAgICAgICBpZiAoYm9keSAhPT0gdHJlZU5vZGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBbRngsIEZ5XSA9IGNhbGN1bGF0ZUZvcmNlKGJvZHksIHRyZWVOb2RlLCB0aGlzLkcpO1xuICAgICAgICAgICAgICAgIHRoaXMuX25ldEZ4ICs9IEZ4O1xuICAgICAgICAgICAgICAgIHRoaXMuX25ldEZ5ICs9IEZ5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlIG5vZGUgaXMgaW50ZXJuYWxcblxuICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIGVmZmVjdGl2ZSBxdWFkcmFudCBzaXplIGFuZCBkaXN0YW5jZSBmcm9tIGNlbnRlci1vZi1tYXNzXG4gICAgICAgIGNvbnN0IHMgPSAodHJlZU5vZGUud2lkdGggKyB0cmVlTm9kZS5oZWlnaHQpIC8gMjtcblxuICAgICAgICBjb25zdCBkeCA9IHRyZWVOb2RlLnggLSBib2R5Lng7XG4gICAgICAgIGNvbnN0IGR5ID0gdHJlZU5vZGUueSAtIGJvZHkueTtcbiAgICAgICAgY29uc3QgZCA9IE1hdGguc3FydChNYXRoLnBvdyhkeCwgMikgKyBNYXRoLnBvdyhkeSwgMikpO1xuXG4gICAgICAgIGlmIChzIC8gZCA8IHRoaXMudGhldGEpIHtcbiAgICAgICAgICAgIC8vIE5vZGUgaXMgc3VmZmljaWVudGx5IGZhciBhd2F5XG4gICAgICAgICAgICBjb25zdCBbRngsIEZ5XSA9IGNhbGN1bGF0ZUZvcmNlKGJvZHksIHRyZWVOb2RlLCB0aGlzLkcpO1xuICAgICAgICAgICAgdGhpcy5fbmV0RnggKz0gRng7XG4gICAgICAgICAgICB0aGlzLl9uZXRGeSArPSBGeTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIE5vZGUgaXMgY2xvc2U7IHJlY3Vyc2VcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2hpbGROb2RlIG9mIHRyZWVOb2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYWxjdWxhdGVGb3JjZUZyb21UcmVlKGJvZHksIGNoaWxkTm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd0U2ltIHtcbiAgICBjb25zdHJ1Y3RvcihhcmdzKSB7XG4gICAgICAgIGFyZ3MgPSBhcmdzIHx8IHt9O1xuXG4gICAgICAgIHRoaXMudXNlQnJ1dGVGb3JjZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLm1lcmdlQ29sbGlzaW9ucyA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5HID0gYXJncy5HIHx8IDYuNjczODQgKiBNYXRoLnBvdygxMCwgLTExKTsgLy8gR3Jhdml0YXRpb25hbCBjb25zdGFudFxuICAgICAgICB0aGlzLm11bHRpcGxpZXIgPSBhcmdzLm11bHRpcGxpZXIgfHwgMTUwMDsgLy8gVGltZXN0ZXBcbiAgICAgICAgdGhpcy5zY2F0dGVyTGltaXRYID0gYXJncy5zY2F0dGVyTGltaXRYIHx8IGFyZ3Mud2lkdGggKiAyO1xuICAgICAgICB0aGlzLnNjYXR0ZXJMaW1pdFkgPSBhcmdzLnNjYXR0ZXJMaW1pdFkgfHwgYXJncy5oZWlnaHQgKiAyO1xuXG4gICAgICAgIHRoaXMuYm9kaWVzID0gW107XG4gICAgICAgIC8vIEluY29ycG9yYXRlIHRoZSBzY2F0dGVyIGxpbWl0XG4gICAgICAgIHRoaXMudHJlZSA9IG5ldyBHdFRyZWUoXG4gICAgICAgICAgICAgICAgLyogd2lkdGggKi8gdGhpcy5zY2F0dGVyTGltaXRYLFxuICAgICAgICAgICAgICAgIC8qIGhlaWdodCAqLyB0aGlzLnNjYXR0ZXJMaW1pdFksXG4gICAgICAgICAgICAgICAgLyogc3RhcnRYICovIChhcmdzLndpZHRoIC0gdGhpcy5zY2F0dGVyTGltaXRYKSAvIDIsXG4gICAgICAgICAgICAgICAgLyogc3RhcnRZICovIChhcmdzLmhlaWdodCAtIHRoaXMuc2NhdHRlckxpbWl0WSkgLyAyKTtcbiAgICAgICAgdGhpcy50aW1lID0gMDtcblxuICAgICAgICB0aGlzLmJydXRlRm9yY2VTaW0gPSBuZXcgR3RCcnV0ZUZvcmNlU2ltKHRoaXMuRyk7XG4gICAgICAgIHRoaXMuYmFybmVzSHV0U2ltID0gbmV3IEd0QmFybmVzSHV0U2ltKHRoaXMuRywgLyogdGhldGEgKi8gMC41KTtcbiAgICAgICAgdGhpcy5hY3RpdmVTaW0gPSB0aGlzLnVzZUJydXRlRm9yY2UgPyB0aGlzLmJydXRlRm9yY2VTaW0gOiB0aGlzLmJhcm5lc0h1dFNpbTtcbiAgICB9XG5cbiAgICB0b2dnbGVTdHJhdGVneSgpIHtcbiAgICAgICAgdGhpcy51c2VCcnV0ZUZvcmNlID0gIXRoaXMudXNlQnJ1dGVGb3JjZTtcbiAgICAgICAgdGhpcy5hY3RpdmVTaW0gPSB0aGlzLnVzZUJydXRlRm9yY2UgPyB0aGlzLmJydXRlRm9yY2VTaW0gOiB0aGlzLmJhcm5lc0h1dFNpbTtcbiAgICB9XG5cbiAgICAvKiogQ2FsY3VsYXRlIGEgc3RlcCBvZiB0aGUgc2ltdWxhdGlvbi4gKi9cbiAgICBzdGVwKGVsYXBzZWQpIHtcbiAgICAgICAgaWYgKHRoaXMubWVyZ2VDb2xsaXNpb25zKSB7XG4gICAgICAgICAgICB0aGlzLl9tZXJnZUNvbGxpZGVkKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcmVtb3ZlU2NhdHRlcmVkKCk7XG5cbiAgICAgICAgaWYgKCF0aGlzLnVzZUJydXRlRm9yY2UpIHtcbiAgICAgICAgICAgIHRoaXMuX3Jlc2V0VHJlZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChjb25zdCBib2R5IG9mIHRoaXMuYm9kaWVzKSB7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZVNpbS5jYWxjdWxhdGVOZXdQb3NpdGlvbihcbiAgICAgICAgICAgICAgICAgICAgYm9keSwgdGhpcy5ib2RpZXMsIHRoaXMudHJlZS5yb290LCBlbGFwc2VkICogdGhpcy5tdWx0aXBsaWVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NvbW1pdFBvc2l0aW9uVXBkYXRlcygpO1xuICAgICAgICB0aGlzLnRpbWUgKz0gZWxhcHNlZDsgLy8gSW5jcmVtZW50IHJ1bnRpbWVcbiAgICB9XG5cbiAgICAvKiogVXBkYXRlIHBvc2l0aW9ucyBvZiBhbGwgYm9kaWVzIHRvIGJlIHRoZSBuZXh0IGNhbGN1bGF0ZWQgcG9zaXRpb24uICovXG4gICAgX2NvbW1pdFBvc2l0aW9uVXBkYXRlcygpIHtcbiAgICAgICAgZm9yIChjb25zdCBib2R5IG9mIHRoaXMuYm9kaWVzKSB7XG4gICAgICAgICAgICBib2R5LnggPSBib2R5Lm5leHRYO1xuICAgICAgICAgICAgYm9keS55ID0gYm9keS5uZXh0WTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBTY2FuIHRocm91Z2ggdGhlIGxpc3Qgb2YgYm9kaWVzIGFuZCByZW1vdmUgYW55IHRoYXQgaGF2ZSBmYWxsZW4gb3V0IG9mIHRoZSBzY2F0dGVyIGxpbWl0LiAqL1xuICAgIF9yZW1vdmVTY2F0dGVyZWQoKSB7XG4gICAgICAgIGxldCBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCB0aGlzLmJvZGllcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSB0aGlzLmJvZGllc1tpXTtcblxuICAgICAgICAgICAgaWYgKGJvZHkueCA+IHRoaXMuc2NhdHRlckxpbWl0WCB8fFxuICAgICAgICAgICAgICAgIGJvZHkueCA8IC10aGlzLnNjYXR0ZXJMaW1pdFggfHxcbiAgICAgICAgICAgICAgICBib2R5LnkgPiB0aGlzLnNjYXR0ZXJMaW1pdFkgfHxcbiAgICAgICAgICAgICAgICBib2R5LnkgPCAtdGhpcy5zY2F0dGVyTGltaXRZKSB7XG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGZyb20gYm9keSBjb2xsZWN0aW9uXG4gICAgICAgICAgICAgICAgLy8gV2UgZG9uJ3QgbmVlZCB0byByZXNldCB0aGUgdHJlZSBoZXJlIGJlY2F1c2UgdGhpcyBpcyBhIHJ1bnRpbWUgKG5vdCB1c2VyLWJhc2VkKVxuICAgICAgICAgICAgICAgIC8vIG9wZXJhdGlvbiwgYW5kIHRoZSB0cmVlIGlzIHJlc2V0IGF1dG9tYXRpY2FsbHkgb24gZXZlcnkgc3RlcCBvZiB0aGUgc2ltdWxhdGlvbi5cbiAgICAgICAgICAgICAgICB0aGlzLmJvZGllcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9tZXJnZUNvbGxpZGVkKCkge1xuICAgICAgICBsZXQgaSA9IDA7XG4gICAgICAgIHdoaWxlIChpIDwgdGhpcy5ib2RpZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBjb2xsaWRpbmdJbmRpY2VzID0gW107XG4gICAgICAgICAgICAvLyBDb2xsZWN0IGNvbGxpZGluZyBlbGVtZW50czsgb25seSBuZWVkIHRvIGNoZWNrIGVhY2ggcGFpciBvbmNlXG4gICAgICAgICAgICBmb3IgKGxldCBqID0gaSArIDE7IGogPCB0aGlzLmJvZGllcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGlmIChhcmVDb2xsaWRpbmcodGhpcy5ib2RpZXNbaV0sIHRoaXMuYm9kaWVzW2pdKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBBZGQsIGluIG9yZGVyIG9mIGhpZ2hlc3QgaW5kZXggZmlyc3RcbiAgICAgICAgICAgICAgICAgICAgY29sbGlkaW5nSW5kaWNlcy51bnNoaWZ0KGopO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGNvbGxpZGluZ0luZGljZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgLy8gSW5jbHVkZSB0aGUgXCJzb3VyY2VcIiBlbGVtZW50IGluIHRoZSBjb2xsaXNpb24gc2V0XG4gICAgICAgICAgICAgICAgY29sbGlkaW5nSW5kaWNlcy5wdXNoKGkpO1xuXG4gICAgICAgICAgICAgICAgLy8gRXh0cmFjdCBlbGVtZW50cyBhbmQgbWVyZ2VcbiAgICAgICAgICAgICAgICBjb25zdCBjb2xsaWRpbmcgPSBjb2xsaWRpbmdJbmRpY2VzLm1hcChpZHggPT4gdGhpcy5ib2RpZXMuc3BsaWNlKGlkeCwgMSlbMF0pO1xuICAgICAgICAgICAgICAgIHRoaXMuX21lcmdlQm9kaWVzKGNvbGxpZGluZyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBNZXJnZSBhbmQgcmV0dXJuIHRoZSBhcmdzIGZvciBhIG5ldyBib2R5IGJhc2VkIG9uIGEgc2V0IG9mIG9sZCBib2RpZXMuICovXG4gICAgX21lcmdlQm9kaWVzKGJvZGllcykge1xuICAgICAgICBjb25zdCBuZXdCb2R5QXJncyA9IHsgeDogMCwgeTogMCwgdmVsWDogMCwgdmVsWTogMCwgbWFzczogMCwgY29sb3I6IGJvZGllc1swXS5jb2xvciB9O1xuICAgICAgICBsZXQgbGFyZ2VzdE1hc3MgPSAwO1xuICAgICAgICBmb3IgKGNvbnN0IGJvZHkgb2YgYm9kaWVzKSB7XG4gICAgICAgICAgICBpZiAoYm9keS5tYXNzID4gbGFyZ2VzdE1hc3MpIHtcbiAgICAgICAgICAgICAgICBuZXdCb2R5QXJncy54ID0gYm9keS54O1xuICAgICAgICAgICAgICAgIG5ld0JvZHlBcmdzLnkgPSBib2R5Lnk7XG4gICAgICAgICAgICAgICAgbGFyZ2VzdE1hc3MgPSBib2R5Lm1hc3M7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBuZXdCb2R5QXJncy52ZWxYICs9IGJvZHkudmVsWDtcbiAgICAgICAgICAgIG5ld0JvZHlBcmdzLnZlbFkgKz0gYm9keS52ZWxZO1xuICAgICAgICAgICAgbmV3Qm9keUFyZ3MubWFzcyArPSBib2R5Lm1hc3M7XG4gICAgICAgICAgICBuZXdCb2R5QXJncy5jb2xvciA9IGNvbG9ycy5ibGVuZChuZXdCb2R5QXJncy5jb2xvciwgYm9keS5jb2xvcik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5hZGROZXdCb2R5KG5ld0JvZHlBcmdzKTtcbiAgICB9XG5cbiAgICAvKiogQ3JlYXRlIGFuZCByZXR1cm4gYSBuZXcgYm9keSB0byB0aGUgc2ltdWxhdGlvbi4gKi9cbiAgICBhZGROZXdCb2R5KGFyZ3MpIHtcbiAgICAgICAgbGV0IGJvZHkgPSBuZXcgR3RCb2R5KGFyZ3MpO1xuICAgICAgICB0aGlzLmJvZGllcy5wdXNoKGJvZHkpO1xuICAgICAgICB0aGlzLl9yZXNldFRyZWUoKTtcbiAgICAgICAgcmV0dXJuIGJvZHk7XG4gICAgfVxuXG4gICAgLyoqIFJlbW92aW5nIGEgdGFyZ2V0IGJvZHkgZnJvbSB0aGUgc2ltdWxhdGlvbi4gKi9cbiAgICByZW1vdmVCb2R5KHRhcmdldEJvZHkpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmJvZGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IHRoaXMuYm9kaWVzW2ldO1xuICAgICAgICAgICAgaWYgKGJvZHkgPT09IHRhcmdldEJvZHkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJvZGllcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzZXRUcmVlKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogTG9va3VwIGFuICh4LCB5KSBjb29yZGluYXRlIGFuZCByZXR1cm4gdGhlIGJvZHkgdGhhdCBpcyBhdCB0aGF0IHBvc2l0aW9uLiAqL1xuICAgIGdldEJvZHlBdCh4LCB5KSB7XG4gICAgICAgIGZvciAobGV0IGkgPSB0aGlzLmJvZGllcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IHRoaXMuYm9kaWVzW2ldO1xuICAgICAgICAgICAgY29uc3QgaXNNYXRjaCA9IE1hdGguYWJzKHggLSBib2R5LngpIDw9IGJvZHkucmFkaXVzICYmXG4gICAgICAgICAgICAgICAgTWF0aC5hYnMoeSAtIGJvZHkueSkgPD0gYm9keS5yYWRpdXM7XG4gICAgICAgICAgICBpZiAoaXNNYXRjaCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBib2R5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLyoqIENsZWFyIHRoZSBzaW11bGF0aW9uLiAqL1xuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLmJvZGllcy5sZW5ndGggPSAwOyAvLyBSZW1vdmUgYWxsIGJvZGllcyBmcm9tIGNvbGxlY3Rpb25cbiAgICAgICAgdGhpcy5fcmVzZXRUcmVlKCk7XG4gICAgfVxuXG4gICAgLyoqIENsZWFyIGFuZCByZXNldCB0aGUgcXVhZHRyZWUsIGFkZGluZyBhbGwgZXhpc3RpbmcgYm9kaWVzIGJhY2suICovXG4gICAgX3Jlc2V0VHJlZSgpIHtcbiAgICAgICAgdGhpcy50cmVlLmNsZWFyKCk7XG4gICAgICAgIGZvciAoY29uc3QgYm9keSBvZiB0aGlzLmJvZGllcykge1xuICAgICAgICAgICAgdGhpcy50cmVlLmFkZEJvZHkoYm9keSk7XG4gICAgICAgIH1cbiAgICB9XG59IC8vIGVuZCBncmF2aXRvbi9zaW1cbiIsIi8qKlxuICogZ3Jhdml0b24vdGltZXIgLS0gU2ltIHRpbWVyIGFuZCBGUFMgbGltaXRlclxuICovXG5pbXBvcnQgZW52IGZyb20gJy4uL3V0aWwvZW52JztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR3RUaW1lciB7XG4gICAgY29uc3RydWN0b3IoZm4sIGZwcz1udWxsKSB7XG4gICAgICAgIHRoaXMuX2ZuID0gZm47XG4gICAgICAgIHRoaXMuX2ZwcyA9IGZwcztcbiAgICAgICAgdGhpcy5faXNBY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5faXNBbmltYXRpb24gPSBmcHMgPT09IG51bGw7XG4gICAgICAgIHRoaXMuX2NhbmNlbGxhdGlvbklkID0gbnVsbDtcblxuICAgICAgICB0aGlzLl93aW5kb3cgPSBlbnYuZ2V0V2luZG93KCk7XG4gICAgfVxuXG4gICAgZ2V0IGFjdGl2ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzQWN0aXZlO1xuICAgIH1cblxuICAgIHN0YXJ0KCkge1xuICAgICAgICBpZiAoIXRoaXMuX2lzQWN0aXZlKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5faXNBbmltYXRpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9iZWdpbkFuaW1hdGlvbigpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9iZWdpbkludGVydmFsKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9pc0FjdGl2ZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdG9wKCkge1xuICAgICAgICBpZiAodGhpcy5faXNBY3RpdmUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9pc0FuaW1hdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuX3dpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLl9jYW5jZWxsYXRpb25JZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3dpbmRvdy5jbGVhckludGVydmFsKHRoaXMuX2NhbmNlbGxhdGlvbklkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2lzQWN0aXZlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0b2dnbGUoKSB7XG4gICAgICAgIGlmICh0aGlzLl9pc0FjdGl2ZSkge1xuICAgICAgICAgICAgdGhpcy5zdG9wKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfYmVnaW5BbmltYXRpb24oKSB7XG4gICAgICAgIGxldCBsYXN0VGltZXN0YW1wID0gdGhpcy5fd2luZG93LnBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICBsZXQgYW5pbWF0b3IgPSAodGltZXN0YW1wKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9jYW5jZWxsYXRpb25JZCA9IHRoaXMuX3dpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0b3IpO1xuICAgICAgICAgICAgdGhpcy5fZm4odGltZXN0YW1wIC0gbGFzdFRpbWVzdGFtcCk7XG4gICAgICAgICAgICBsYXN0VGltZXN0YW1wID0gdGltZXN0YW1wO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIERlbGF5IGluaXRpYWwgZXhlY3V0aW9uIHVudGlsIHRoZSBuZXh0IHRpY2suXG4gICAgICAgIHRoaXMuX2NhbmNlbGxhdGlvbklkID0gdGhpcy5fd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRvcik7XG4gICAgfVxuXG4gICAgX2JlZ2luSW50ZXJ2YWwoKSB7XG4gICAgICAgIC8vIENvbXB1dGUgdGhlIGRlbGF5IHBlciB0aWNrLCBpbiBtaWxsaXNlY29uZHMuXG4gICAgICAgIGxldCB0aW1lb3V0ID0gMTAwMCAvIHRoaXMuX2ZwcyB8IDA7XG5cbiAgICAgICAgbGV0IGxhc3RUaW1lc3RhbXAgPSB0aGlzLl93aW5kb3cucGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgIHRoaXMuX2NhbmNlbGxhdGlvbklkID0gdGhpcy5fd2luZG93LnNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgIGxldCB0aW1lc3RhbXAgPSB0aGlzLl93aW5kb3cucGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgICAgICB0aGlzLl9mbih0aW1lc3RhbXAgLSBsYXN0VGltZXN0YW1wKTtcbiAgICAgICAgICAgIGxhc3RUaW1lc3RhbXAgPSB0aW1lc3RhbXA7XG4gICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICB9XG59IC8vIGVuZCBncmF2aXRvbi90aW1lclxuIiwiLyoqXG4gKiBncmF2aXRvbi90cmVlIC0tIFRoZSBncmF2aXRhdGlvbmFsIGJvZHkgdHJlZSBzdHJ1Y3R1cmVcbiAqL1xuXG5jbGFzcyBHdFRyZWVOb2RlIHtcbiAgICBjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0LCBzdGFydFgsIHN0YXJ0WSkge1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICB0aGlzLnN0YXJ0WCA9IHN0YXJ0WDtcbiAgICAgICAgdGhpcy5zdGFydFkgPSBzdGFydFk7XG5cbiAgICAgICAgLy8gQ29udmVuaWVuY2UgY2VudGVyIHBvaW50cy5cbiAgICAgICAgdGhpcy5oYWxmV2lkdGggPSB3aWR0aCAvIDI7XG4gICAgICAgIHRoaXMuaGFsZkhlaWdodCA9IGhlaWdodCAvIDI7XG4gICAgICAgIHRoaXMubWlkWCA9IHRoaXMuc3RhcnRYICsgdGhpcy5oYWxmV2lkdGg7XG4gICAgICAgIHRoaXMubWlkWSA9IHRoaXMuc3RhcnRZICsgdGhpcy5oYWxmSGVpZ2h0O1xuXG4gICAgICAgIC8vIE1hdGNoZXMgR3RCb2R5J3MgcHJvcGVydGllcy5cbiAgICAgICAgdGhpcy5tYXNzID0gMDtcbiAgICAgICAgdGhpcy54ID0gMDtcbiAgICAgICAgdGhpcy55ID0gMDtcblxuICAgICAgICAvLyBbTlcsIE5FLCBTVywgU0VdXG4gICAgICAgIHRoaXMuY2hpbGRyZW4gPSBuZXcgQXJyYXkoNCk7XG4gICAgfVxuXG4gICAgLyoqIEFkZCBhIGJvZHkgdG8gdGhlIHRyZWUsIHVwZGF0aW5nIG1hc3MgYW5kIGNlbnRlcnBvaW50LiAqL1xuICAgIGFkZEJvZHkoYm9keSkge1xuICAgICAgICB0aGlzLl91cGRhdGVNYXNzKGJvZHkpO1xuICAgICAgICBjb25zdCBxdWFkcmFudCA9IHRoaXMuX2dldFF1YWRyYW50KGJvZHkueCwgYm9keS55KTtcblxuICAgICAgICBpZiAodGhpcy5jaGlsZHJlbltxdWFkcmFudF0gaW5zdGFuY2VvZiBHdFRyZWVOb2RlKSB7XG4gICAgICAgICAgICB0aGlzLmNoaWxkcmVuW3F1YWRyYW50XS5hZGRCb2R5KGJvZHkpO1xuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLmNoaWxkcmVuW3F1YWRyYW50XSkge1xuICAgICAgICAgICAgdGhpcy5jaGlsZHJlbltxdWFkcmFudF0gPSBib2R5O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmNoaWxkcmVuW3F1YWRyYW50XTtcbiAgICAgICAgICAgIGNvbnN0IHF1YWRYID0gZXhpc3RpbmcueCA+IHRoaXMubWlkWCA/IHRoaXMubWlkWCA6IHRoaXMuc3RhcnRYO1xuICAgICAgICAgICAgY29uc3QgcXVhZFkgPSBleGlzdGluZy55ID4gdGhpcy5taWRZID8gdGhpcy5taWRZIDogdGhpcy5zdGFydFk7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gbmV3IEd0VHJlZU5vZGUodGhpcy5oYWxmV2lkdGgsIHRoaXMuaGFsZkhlaWdodCwgcXVhZFgsIHF1YWRZKTtcblxuICAgICAgICAgICAgbm9kZS5hZGRCb2R5KGV4aXN0aW5nKTtcbiAgICAgICAgICAgIG5vZGUuYWRkQm9keShib2R5KTtcblxuICAgICAgICAgICAgdGhpcy5jaGlsZHJlbltxdWFkcmFudF0gPSBub2RlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIFVwZGF0ZSB0aGUgY2VudGVyIG9mIG1hc3MgYmFzZWQgb24gdGhlIGFkZGl0aW9uIG9mIGEgbmV3IGJvZHkuICovXG4gICAgX3VwZGF0ZU1hc3MoYm9keSkge1xuICAgICAgICBjb25zdCBuZXdNYXNzID0gdGhpcy5tYXNzICsgYm9keS5tYXNzO1xuICAgICAgICBjb25zdCBuZXdYID0gKHRoaXMueCAqIHRoaXMubWFzcyArIGJvZHkueCAqIGJvZHkubWFzcykgLyBuZXdNYXNzO1xuICAgICAgICBjb25zdCBuZXdZID0gKHRoaXMueSAqIHRoaXMubWFzcyArIGJvZHkueSAqIGJvZHkubWFzcykgLyBuZXdNYXNzO1xuICAgICAgICB0aGlzLm1hc3MgPSBuZXdNYXNzO1xuICAgICAgICB0aGlzLnggPSBuZXdYO1xuICAgICAgICB0aGlzLnkgPSBuZXdZO1xuICAgIH1cblxuICAgIC8qKiBSZXR1cm4gdGhlIHF1YWRyYW50IGluZGV4IGZvciBhIGdpdmVuICh4LCB5KSBwYWlyLiBBc3N1bWVzIHRoYXQgaXQgbGllcyB3aXRoaW4gYm91bmRzLiAqL1xuICAgIF9nZXRRdWFkcmFudCh4LCB5KSB7XG4gICAgICAgIGNvbnN0IHhJbmRleCA9IE51bWJlcih4ID4gdGhpcy5taWRYKTtcbiAgICAgICAgY29uc3QgeUluZGV4ID0gTnVtYmVyKHkgPiB0aGlzLm1pZFkpICogMjtcbiAgICAgICAgcmV0dXJuIHhJbmRleCArIHlJbmRleDtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd0VHJlZSB7XG4gICAgY29uc3RydWN0b3Iod2lkdGgsIGhlaWdodCwgc3RhcnRYID0gMCwgc3RhcnRZID0gMCkge1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICB0aGlzLnN0YXJ0WCA9IHN0YXJ0WDtcbiAgICAgICAgdGhpcy5zdGFydFkgPSBzdGFydFk7XG4gICAgICAgIHRoaXMucm9vdCA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBhZGRCb2R5KGJvZHkpIHtcbiAgICAgICAgaWYgKHRoaXMucm9vdCBpbnN0YW5jZW9mIEd0VHJlZU5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMucm9vdC5hZGRCb2R5KGJvZHkpO1xuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLnJvb3QpIHtcbiAgICAgICAgICAgIHRoaXMucm9vdCA9IGJvZHk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMucm9vdDtcbiAgICAgICAgICAgIHRoaXMucm9vdCA9IG5ldyBHdFRyZWVOb2RlKHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB0aGlzLnN0YXJ0WCwgdGhpcy5zdGFydFkpO1xuICAgICAgICAgICAgdGhpcy5yb290LmFkZEJvZHkoZXhpc3RpbmcpO1xuICAgICAgICAgICAgdGhpcy5yb290LmFkZEJvZHkoYm9keSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5yb290ID0gdW5kZWZpbmVkO1xuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL3RyZWVcbiIsImltcG9ydCAnLi92ZW5kb3IvanNjb2xvcic7XG5pbXBvcnQgdmV4IGZyb20gJy4vdmVuZG9yL3ZleCc7XG5pbXBvcnQgJy4vcG9seWZpbGxzJztcbmltcG9ydCBndCBmcm9tICcuL2dyYXZpdG9uJztcblxud2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIFNldCBvcHRpb25zIGZvciBkZXBlbmRlbmNpZXMuXG4gICAgdmV4LmRlZmF1bHRPcHRpb25zLmNsYXNzTmFtZSA9ICd2ZXgtdGhlbWUtd2lyZWZyYW1lJztcblxuICAgIC8vIFN0YXJ0IHRoZSBtYWluIGdyYXZpdG9uIGFwcC5cbiAgICB3aW5kb3cuZ3Jhdml0b24gPSBuZXcgZ3QuYXBwKCk7XG59O1xuIiwid2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgIGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiB3aW5kb3cuc2V0VGltZW91dChjYWxsYmFjaywgMTAwMCAvIDYwKTtcbiAgICB9O1xuXG53aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cubW96Q2FuY2VsQW5pbWF0aW9uRnJhbWUgfHxcbiAgICBmdW5jdGlvbih0aW1lb3V0SWQpIHtcbiAgICAgICAgd2luZG93LmNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgIH07XG5cbndpbmRvdy5wZXJmb3JtYW5jZSA9IHdpbmRvdy5wZXJmb3JtYW5jZSB8fCB7fTtcbndpbmRvdy5wZXJmb3JtYW5jZS5ub3cgPSB3aW5kb3cucGVyZm9ybWFuY2Uubm93IHx8XG4gICAgd2luZG93LnBlcmZvcm1hbmNlLndlYmtpdE5vdyB8fFxuICAgIHdpbmRvdy5wZXJmb3JtYW5jZS5tb3pOb3cgfHxcbiAgICBEYXRlLm5vdztcbiIsIi8qKlxuICogY29sb3JzIC0tIENvbG9yIG1hbmlwdWxhdGlvbiBoZWxwZXJzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBicmlnaHRlbihjb2xvckFycmF5LCBwZXJjZW50KSB7XG4gICAgICAgIGxldCBbciwgZywgYl0gPSBjb2xvckFycmF5O1xuICAgICAgICByID0gTWF0aC5yb3VuZChNYXRoLm1pbihNYXRoLm1heCgwLCByICsgKHIgKiBwZXJjZW50KSksIDI1NSkpO1xuICAgICAgICBnID0gTWF0aC5yb3VuZChNYXRoLm1pbihNYXRoLm1heCgwLCBnICsgKGcgKiBwZXJjZW50KSksIDI1NSkpO1xuICAgICAgICBiID0gTWF0aC5yb3VuZChNYXRoLm1pbihNYXRoLm1heCgwLCBiICsgKGIgKiBwZXJjZW50KSksIDI1NSkpO1xuICAgICAgICByZXR1cm4gW3IsIGcsIGJdO1xuICAgIH0sXG5cbiAgICBmcm9tSGV4KGhleCkge1xuICAgICAgICBsZXQgaCA9IGhleC5yZXBsYWNlKCcjJywgJycpO1xuICAgICAgICBpZiAoaC5sZW5ndGggPCA2KSB7XG4gICAgICAgICAgICBoID0gaC5yZXBsYWNlKC8oLikvZywgJyQxJDEnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW3BhcnNlSW50KGguc3Vic3RyKDAsIDIpLCAxNiksXG4gICAgICAgICAgICAgICAgcGFyc2VJbnQoaC5zdWJzdHIoMiwgMiksIDE2KSxcbiAgICAgICAgICAgICAgICBwYXJzZUludChoLnN1YnN0cig0LCAyKSwgMTYpXTtcbiAgICB9LFxuXG4gICAgdG9IZXgoY29sb3JBcnJheSkge1xuICAgICAgICBjb25zdCBbciwgZywgYl0gPSBjb2xvckFycmF5O1xuICAgICAgICByZXR1cm4gJyMnICsgKCcwJyArIHIudG9TdHJpbmcoMTYpKS5zdWJzdHIociA8IDE2ID8gMCA6IDEpICtcbiAgICAgICAgICAgICAgICAgICAgICgnMCcgKyBnLnRvU3RyaW5nKDE2KSkuc3Vic3RyKGcgPCAxNiA/IDAgOiAxKSArXG4gICAgICAgICAgICAgICAgICAgICAoJzAnICsgYi50b1N0cmluZygxNikpLnN1YnN0cihiIDwgMTYgPyAwIDogMSk7XG4gICAgfSxcblxuICAgIGJsZW5kKGNvbG9yMSwgY29sb3IyLCBwZXJjZW50YWdlID0gMC41KSB7XG4gICAgICAgIGxldCBwYXJzZWRDb2xvcjEgPSB0aGlzLmZyb21IZXgoY29sb3IxKTtcbiAgICAgICAgbGV0IHBhcnNlZENvbG9yMiA9IHRoaXMuZnJvbUhleChjb2xvcjIpO1xuXG4gICAgICAgIGxldCBibGVuZGVkQ29sb3IgPSBbXG4gICAgICAgICAgICBNYXRoLnJvdW5kKE1hdGgubWluKE1hdGgubWF4KDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKDEgLSBwZXJjZW50YWdlKSAqIHBhcnNlZENvbG9yMVswXSArIHBlcmNlbnRhZ2UgKiBwYXJzZWRDb2xvcjJbMF0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgMjU1KSksXG4gICAgICAgICAgICBNYXRoLnJvdW5kKE1hdGgubWluKE1hdGgubWF4KDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKDEgLSBwZXJjZW50YWdlKSAqIHBhcnNlZENvbG9yMVsxXSArIHBlcmNlbnRhZ2UgKiBwYXJzZWRDb2xvcjJbMV0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgMjU1KSksXG4gICAgICAgICAgICBNYXRoLnJvdW5kKE1hdGgubWluKE1hdGgubWF4KDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKDEgLSBwZXJjZW50YWdlKSAqIHBhcnNlZENvbG9yMVsyXSArIHBlcmNlbnRhZ2UgKiBwYXJzZWRDb2xvcjJbMl0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgMjU1KSlcbiAgICAgICAgXTtcbiAgICAgICAgcmV0dXJuIHRoaXMudG9IZXgoYmxlbmRlZENvbG9yKTtcbiAgICB9XG59O1xuIiwiLyoqXG4gKiBlbnYgLSBFbnZpcm9ubWVudCByZXRyaWV2YWwgbWV0aG9kcy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQge1xuICAgIGdldFdpbmRvdygpIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdztcbiAgICB9XG59O1xuIiwiLyoqXG4gKiByYW5kb20gLS0gQSBjb2xsZWN0aW9uIG9mIHJhbmRvbSBnZW5lcmF0b3IgZnVuY3Rpb25zXG4gKi9cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZSBhIHJhbmRvbSBudW1iZXIgYmV0d2VlbiB0aGUgZ2l2ZW4gc3RhcnQgYW5kIGVuZCBwb2ludHNcbiAgICAgKi9cbiAgICBudW1iZXIoZnJvbSwgdG89bnVsbCkge1xuICAgICAgICBpZiAodG8gPT09IG51bGwpIHtcbiAgICAgICAgICAgIHRvID0gZnJvbTtcbiAgICAgICAgICAgIGZyb20gPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIE1hdGgucmFuZG9tKCkgKiAodG8gLSBmcm9tKSArIGZyb207XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGEgcmFuZG9tIGludGVnZXIgYmV0d2VlbiB0aGUgZ2l2ZW4gcG9zaXRpb25zXG4gICAgICovXG4gICAgaW50ZWdlciguLi5hcmdzKSB7XG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKHRoaXMubnVtYmVyKC4uLmFyZ3MpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgYSByYW5kb20gbnVtYmVyLCB3aXRoIGEgcmFuZG9tIHNpZ24sIGJldHdlZW4gdGhlIGdpdmVuXG4gICAgICogcG9zaXRpb25zXG4gICAgICovXG4gICAgZGlyZWN0aW9uYWwoLi4uYXJncykge1xuICAgICAgICBsZXQgcmFuZCA9IHRoaXMubnVtYmVyKC4uLmFyZ3MpO1xuICAgICAgICBpZiAoTWF0aC5yYW5kb20oKSA+IDAuNSkge1xuICAgICAgICAgICAgcmFuZCA9IC1yYW5kO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByYW5kO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZSBhIHJhbmRvbSBoZXhhZGVjaW1hbCBjb2xvclxuICAgICAqL1xuICAgIGNvbG9yKCkge1xuICAgICAgICByZXR1cm4gJyMnICsgKCcwMDAwMCcgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAweDEwMDAwMDApLnRvU3RyaW5nKDE2KSkuc3Vic3RyKC02KTtcbiAgICB9XG59O1xuIiwiLyoqXG4gKiBqc2NvbG9yIC0gSmF2YVNjcmlwdCBDb2xvciBQaWNrZXJcbiAqXG4gKiBAbGluayAgICBodHRwOi8vanNjb2xvci5jb21cbiAqIEBsaWNlbnNlIEZvciBvcGVuIHNvdXJjZSB1c2U6IEdQTHYzXG4gKiAgICAgICAgICBGb3IgY29tbWVyY2lhbCB1c2U6IEpTQ29sb3IgQ29tbWVyY2lhbCBMaWNlbnNlXG4gKiBAYXV0aG9yICBKYW4gT2R2YXJrb1xuICogQHZlcnNpb24gMi4wLjRcbiAqXG4gKiBTZWUgdXNhZ2UgZXhhbXBsZXMgYXQgaHR0cDovL2pzY29sb3IuY29tL2V4YW1wbGVzL1xuICovXG5cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cblxuaWYgKCF3aW5kb3cuanNjb2xvcikgeyB3aW5kb3cuanNjb2xvciA9IChmdW5jdGlvbiAoKSB7XG5cblxudmFyIGpzYyA9IHtcblxuXG5cdHJlZ2lzdGVyIDogZnVuY3Rpb24gKCkge1xuXHRcdGpzYy5hdHRhY2hET01SZWFkeUV2ZW50KGpzYy5pbml0KTtcblx0XHRqc2MuYXR0YWNoRXZlbnQoZG9jdW1lbnQsICdtb3VzZWRvd24nLCBqc2Mub25Eb2N1bWVudE1vdXNlRG93bik7XG5cdFx0anNjLmF0dGFjaEV2ZW50KGRvY3VtZW50LCAndG91Y2hzdGFydCcsIGpzYy5vbkRvY3VtZW50VG91Y2hTdGFydCk7XG5cdFx0anNjLmF0dGFjaEV2ZW50KHdpbmRvdywgJ3Jlc2l6ZScsIGpzYy5vbldpbmRvd1Jlc2l6ZSk7XG5cdH0sXG5cblxuXHRpbml0IDogZnVuY3Rpb24gKCkge1xuXHRcdGlmIChqc2MuanNjb2xvci5sb29rdXBDbGFzcykge1xuXHRcdFx0anNjLmpzY29sb3IuaW5zdGFsbEJ5Q2xhc3NOYW1lKGpzYy5qc2NvbG9yLmxvb2t1cENsYXNzKTtcblx0XHR9XG5cdH0sXG5cblxuXHR0cnlJbnN0YWxsT25FbGVtZW50cyA6IGZ1bmN0aW9uIChlbG1zLCBjbGFzc05hbWUpIHtcblx0XHR2YXIgbWF0Y2hDbGFzcyA9IG5ldyBSZWdFeHAoJyhefFxcXFxzKSgnICsgY2xhc3NOYW1lICsgJykoXFxcXHMqKFxcXFx7W159XSpcXFxcfSl8XFxcXHN8JCknLCAnaScpO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBlbG1zLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRpZiAoZWxtc1tpXS50eXBlICE9PSB1bmRlZmluZWQgJiYgZWxtc1tpXS50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ2NvbG9yJykge1xuXHRcdFx0XHRpZiAoanNjLmlzQ29sb3JBdHRyU3VwcG9ydGVkKSB7XG5cdFx0XHRcdFx0Ly8gc2tpcCBpbnB1dHMgb2YgdHlwZSAnY29sb3InIGlmIHN1cHBvcnRlZCBieSB0aGUgYnJvd3NlclxuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHR2YXIgbTtcblx0XHRcdGlmICghZWxtc1tpXS5qc2NvbG9yICYmIGVsbXNbaV0uY2xhc3NOYW1lICYmIChtID0gZWxtc1tpXS5jbGFzc05hbWUubWF0Y2gobWF0Y2hDbGFzcykpKSB7XG5cdFx0XHRcdHZhciB0YXJnZXRFbG0gPSBlbG1zW2ldO1xuXHRcdFx0XHR2YXIgb3B0c1N0ciA9IG51bGw7XG5cblx0XHRcdFx0dmFyIGRhdGFPcHRpb25zID0ganNjLmdldERhdGFBdHRyKHRhcmdldEVsbSwgJ2pzY29sb3InKTtcblx0XHRcdFx0aWYgKGRhdGFPcHRpb25zICE9PSBudWxsKSB7XG5cdFx0XHRcdFx0b3B0c1N0ciA9IGRhdGFPcHRpb25zO1xuXHRcdFx0XHR9IGVsc2UgaWYgKG1bNF0pIHtcblx0XHRcdFx0XHRvcHRzU3RyID0gbVs0XTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBvcHRzID0ge307XG5cdFx0XHRcdGlmIChvcHRzU3RyKSB7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdG9wdHMgPSAobmV3IEZ1bmN0aW9uICgncmV0dXJuICgnICsgb3B0c1N0ciArICcpJykpKCk7XG5cdFx0XHRcdFx0fSBjYXRjaChlUGFyc2VFcnJvcikge1xuXHRcdFx0XHRcdFx0anNjLndhcm4oJ0Vycm9yIHBhcnNpbmcganNjb2xvciBvcHRpb25zOiAnICsgZVBhcnNlRXJyb3IgKyAnOlxcbicgKyBvcHRzU3RyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0dGFyZ2V0RWxtLmpzY29sb3IgPSBuZXcganNjLmpzY29sb3IodGFyZ2V0RWxtLCBvcHRzKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblxuXHRpc0NvbG9yQXR0clN1cHBvcnRlZCA6IChmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGVsbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG5cdFx0aWYgKGVsbS5zZXRBdHRyaWJ1dGUpIHtcblx0XHRcdGVsbS5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAnY29sb3InKTtcblx0XHRcdGlmIChlbG0udHlwZS50b0xvd2VyQ2FzZSgpID09ICdjb2xvcicpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fSkoKSxcblxuXG5cdGlzQ2FudmFzU3VwcG9ydGVkIDogKGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZWxtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdFx0cmV0dXJuICEhKGVsbS5nZXRDb250ZXh0ICYmIGVsbS5nZXRDb250ZXh0KCcyZCcpKTtcblx0fSkoKSxcblxuXG5cdGZldGNoRWxlbWVudCA6IGZ1bmN0aW9uIChtaXhlZCkge1xuXHRcdHJldHVybiB0eXBlb2YgbWl4ZWQgPT09ICdzdHJpbmcnID8gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobWl4ZWQpIDogbWl4ZWQ7XG5cdH0sXG5cblxuXHRpc0VsZW1lbnRUeXBlIDogZnVuY3Rpb24gKGVsbSwgdHlwZSkge1xuXHRcdHJldHVybiBlbG0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gdHlwZS50b0xvd2VyQ2FzZSgpO1xuXHR9LFxuXG5cblx0Z2V0RGF0YUF0dHIgOiBmdW5jdGlvbiAoZWwsIG5hbWUpIHtcblx0XHR2YXIgYXR0ck5hbWUgPSAnZGF0YS0nICsgbmFtZTtcblx0XHR2YXIgYXR0clZhbHVlID0gZWwuZ2V0QXR0cmlidXRlKGF0dHJOYW1lKTtcblx0XHRpZiAoYXR0clZhbHVlICE9PSBudWxsKSB7XG5cdFx0XHRyZXR1cm4gYXR0clZhbHVlO1xuXHRcdH1cblx0XHRyZXR1cm4gbnVsbDtcblx0fSxcblxuXG5cdGF0dGFjaEV2ZW50IDogZnVuY3Rpb24gKGVsLCBldm50LCBmdW5jKSB7XG5cdFx0aWYgKGVsLmFkZEV2ZW50TGlzdGVuZXIpIHtcblx0XHRcdGVsLmFkZEV2ZW50TGlzdGVuZXIoZXZudCwgZnVuYywgZmFsc2UpO1xuXHRcdH0gZWxzZSBpZiAoZWwuYXR0YWNoRXZlbnQpIHtcblx0XHRcdGVsLmF0dGFjaEV2ZW50KCdvbicgKyBldm50LCBmdW5jKTtcblx0XHR9XG5cdH0sXG5cblxuXHRkZXRhY2hFdmVudCA6IGZ1bmN0aW9uIChlbCwgZXZudCwgZnVuYykge1xuXHRcdGlmIChlbC5yZW1vdmVFdmVudExpc3RlbmVyKSB7XG5cdFx0XHRlbC5yZW1vdmVFdmVudExpc3RlbmVyKGV2bnQsIGZ1bmMsIGZhbHNlKTtcblx0XHR9IGVsc2UgaWYgKGVsLmRldGFjaEV2ZW50KSB7XG5cdFx0XHRlbC5kZXRhY2hFdmVudCgnb24nICsgZXZudCwgZnVuYyk7XG5cdFx0fVxuXHR9LFxuXG5cblx0X2F0dGFjaGVkR3JvdXBFdmVudHMgOiB7fSxcblxuXG5cdGF0dGFjaEdyb3VwRXZlbnQgOiBmdW5jdGlvbiAoZ3JvdXBOYW1lLCBlbCwgZXZudCwgZnVuYykge1xuXHRcdGlmICghanNjLl9hdHRhY2hlZEdyb3VwRXZlbnRzLmhhc093blByb3BlcnR5KGdyb3VwTmFtZSkpIHtcblx0XHRcdGpzYy5fYXR0YWNoZWRHcm91cEV2ZW50c1tncm91cE5hbWVdID0gW107XG5cdFx0fVxuXHRcdGpzYy5fYXR0YWNoZWRHcm91cEV2ZW50c1tncm91cE5hbWVdLnB1c2goW2VsLCBldm50LCBmdW5jXSk7XG5cdFx0anNjLmF0dGFjaEV2ZW50KGVsLCBldm50LCBmdW5jKTtcblx0fSxcblxuXG5cdGRldGFjaEdyb3VwRXZlbnRzIDogZnVuY3Rpb24gKGdyb3VwTmFtZSkge1xuXHRcdGlmIChqc2MuX2F0dGFjaGVkR3JvdXBFdmVudHMuaGFzT3duUHJvcGVydHkoZ3JvdXBOYW1lKSkge1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBqc2MuX2F0dGFjaGVkR3JvdXBFdmVudHNbZ3JvdXBOYW1lXS5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0XHR2YXIgZXZ0ID0ganNjLl9hdHRhY2hlZEdyb3VwRXZlbnRzW2dyb3VwTmFtZV1baV07XG5cdFx0XHRcdGpzYy5kZXRhY2hFdmVudChldnRbMF0sIGV2dFsxXSwgZXZ0WzJdKTtcblx0XHRcdH1cblx0XHRcdGRlbGV0ZSBqc2MuX2F0dGFjaGVkR3JvdXBFdmVudHNbZ3JvdXBOYW1lXTtcblx0XHR9XG5cdH0sXG5cblxuXHRhdHRhY2hET01SZWFkeUV2ZW50IDogZnVuY3Rpb24gKGZ1bmMpIHtcblx0XHR2YXIgZmlyZWQgPSBmYWxzZTtcblx0XHR2YXIgZmlyZU9uY2UgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoIWZpcmVkKSB7XG5cdFx0XHRcdGZpcmVkID0gdHJ1ZTtcblx0XHRcdFx0ZnVuYygpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xuXHRcdFx0c2V0VGltZW91dChmaXJlT25jZSwgMSk7IC8vIGFzeW5jXG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcblx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmaXJlT25jZSwgZmFsc2UpO1xuXG5cdFx0XHQvLyBGYWxsYmFja1xuXHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmaXJlT25jZSwgZmFsc2UpO1xuXG5cdFx0fSBlbHNlIGlmIChkb2N1bWVudC5hdHRhY2hFdmVudCkge1xuXHRcdFx0Ly8gSUVcblx0XHRcdGRvY3VtZW50LmF0dGFjaEV2ZW50KCdvbnJlYWR5c3RhdGVjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7XG5cdFx0XHRcdFx0ZG9jdW1lbnQuZGV0YWNoRXZlbnQoJ29ucmVhZHlzdGF0ZWNoYW5nZScsIGFyZ3VtZW50cy5jYWxsZWUpO1xuXHRcdFx0XHRcdGZpcmVPbmNlKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cblx0XHRcdC8vIEZhbGxiYWNrXG5cdFx0XHR3aW5kb3cuYXR0YWNoRXZlbnQoJ29ubG9hZCcsIGZpcmVPbmNlKTtcblxuXHRcdFx0Ly8gSUU3Lzhcblx0XHRcdGlmIChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZG9TY3JvbGwgJiYgd2luZG93ID09IHdpbmRvdy50b3ApIHtcblx0XHRcdFx0dmFyIHRyeVNjcm9sbCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRpZiAoIWRvY3VtZW50LmJvZHkpIHsgcmV0dXJuOyB9XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kb1Njcm9sbCgnbGVmdCcpO1xuXHRcdFx0XHRcdFx0ZmlyZU9uY2UoKTtcblx0XHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0XHRzZXRUaW1lb3V0KHRyeVNjcm9sbCwgMSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXHRcdFx0XHR0cnlTY3JvbGwoKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblxuXHR3YXJuIDogZnVuY3Rpb24gKG1zZykge1xuXHRcdGlmICh3aW5kb3cuY29uc29sZSAmJiB3aW5kb3cuY29uc29sZS53YXJuKSB7XG5cdFx0XHR3aW5kb3cuY29uc29sZS53YXJuKG1zZyk7XG5cdFx0fVxuXHR9LFxuXG5cblx0cHJldmVudERlZmF1bHQgOiBmdW5jdGlvbiAoZSkge1xuXHRcdGlmIChlLnByZXZlbnREZWZhdWx0KSB7IGUucHJldmVudERlZmF1bHQoKTsgfVxuXHRcdGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcblx0fSxcblxuXG5cdGNhcHR1cmVUYXJnZXQgOiBmdW5jdGlvbiAodGFyZ2V0KSB7XG5cdFx0Ly8gSUVcblx0XHRpZiAodGFyZ2V0LnNldENhcHR1cmUpIHtcblx0XHRcdGpzYy5fY2FwdHVyZWRUYXJnZXQgPSB0YXJnZXQ7XG5cdFx0XHRqc2MuX2NhcHR1cmVkVGFyZ2V0LnNldENhcHR1cmUoKTtcblx0XHR9XG5cdH0sXG5cblxuXHRyZWxlYXNlVGFyZ2V0IDogZnVuY3Rpb24gKCkge1xuXHRcdC8vIElFXG5cdFx0aWYgKGpzYy5fY2FwdHVyZWRUYXJnZXQpIHtcblx0XHRcdGpzYy5fY2FwdHVyZWRUYXJnZXQucmVsZWFzZUNhcHR1cmUoKTtcblx0XHRcdGpzYy5fY2FwdHVyZWRUYXJnZXQgPSBudWxsO1xuXHRcdH1cblx0fSxcblxuXG5cdGZpcmVFdmVudCA6IGZ1bmN0aW9uIChlbCwgZXZudCkge1xuXHRcdGlmICghZWwpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0aWYgKGRvY3VtZW50LmNyZWF0ZUV2ZW50KSB7XG5cdFx0XHR2YXIgZXYgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnSFRNTEV2ZW50cycpO1xuXHRcdFx0ZXYuaW5pdEV2ZW50KGV2bnQsIHRydWUsIHRydWUpO1xuXHRcdFx0ZWwuZGlzcGF0Y2hFdmVudChldik7XG5cdFx0fSBlbHNlIGlmIChkb2N1bWVudC5jcmVhdGVFdmVudE9iamVjdCkge1xuXHRcdFx0dmFyIGV2ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnRPYmplY3QoKTtcblx0XHRcdGVsLmZpcmVFdmVudCgnb24nICsgZXZudCwgZXYpO1xuXHRcdH0gZWxzZSBpZiAoZWxbJ29uJyArIGV2bnRdKSB7IC8vIGFsdGVybmF0aXZlbHkgdXNlIHRoZSB0cmFkaXRpb25hbCBldmVudCBtb2RlbFxuXHRcdFx0ZWxbJ29uJyArIGV2bnRdKCk7XG5cdFx0fVxuXHR9LFxuXG5cblx0Y2xhc3NOYW1lVG9MaXN0IDogZnVuY3Rpb24gKGNsYXNzTmFtZSkge1xuXHRcdHJldHVybiBjbGFzc05hbWUucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpLnNwbGl0KC9cXHMrLyk7XG5cdH0sXG5cblxuXHQvLyBUaGUgY2xhc3NOYW1lIHBhcmFtZXRlciAoc3RyKSBjYW4gb25seSBjb250YWluIGEgc2luZ2xlIGNsYXNzIG5hbWVcblx0aGFzQ2xhc3MgOiBmdW5jdGlvbiAoZWxtLCBjbGFzc05hbWUpIHtcblx0XHRpZiAoIWNsYXNzTmFtZSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRyZXR1cm4gLTEgIT0gKCcgJyArIGVsbS5jbGFzc05hbWUucmVwbGFjZSgvXFxzKy9nLCAnICcpICsgJyAnKS5pbmRleE9mKCcgJyArIGNsYXNzTmFtZSArICcgJyk7XG5cdH0sXG5cblxuXHQvLyBUaGUgY2xhc3NOYW1lIHBhcmFtZXRlciAoc3RyKSBjYW4gY29udGFpbiBtdWx0aXBsZSBjbGFzcyBuYW1lcyBzZXBhcmF0ZWQgYnkgd2hpdGVzcGFjZVxuXHRzZXRDbGFzcyA6IGZ1bmN0aW9uIChlbG0sIGNsYXNzTmFtZSkge1xuXHRcdHZhciBjbGFzc0xpc3QgPSBqc2MuY2xhc3NOYW1lVG9MaXN0KGNsYXNzTmFtZSk7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjbGFzc0xpc3QubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdGlmICghanNjLmhhc0NsYXNzKGVsbSwgY2xhc3NMaXN0W2ldKSkge1xuXHRcdFx0XHRlbG0uY2xhc3NOYW1lICs9IChlbG0uY2xhc3NOYW1lID8gJyAnIDogJycpICsgY2xhc3NMaXN0W2ldO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXG5cdC8vIFRoZSBjbGFzc05hbWUgcGFyYW1ldGVyIChzdHIpIGNhbiBjb250YWluIG11bHRpcGxlIGNsYXNzIG5hbWVzIHNlcGFyYXRlZCBieSB3aGl0ZXNwYWNlXG5cdHVuc2V0Q2xhc3MgOiBmdW5jdGlvbiAoZWxtLCBjbGFzc05hbWUpIHtcblx0XHR2YXIgY2xhc3NMaXN0ID0ganNjLmNsYXNzTmFtZVRvTGlzdChjbGFzc05hbWUpO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgY2xhc3NMaXN0Lmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHR2YXIgcmVwbCA9IG5ldyBSZWdFeHAoXG5cdFx0XHRcdCdeXFxcXHMqJyArIGNsYXNzTGlzdFtpXSArICdcXFxccyp8JyArXG5cdFx0XHRcdCdcXFxccyonICsgY2xhc3NMaXN0W2ldICsgJ1xcXFxzKiR8JyArXG5cdFx0XHRcdCdcXFxccysnICsgY2xhc3NMaXN0W2ldICsgJyhcXFxccyspJyxcblx0XHRcdFx0J2cnXG5cdFx0XHQpO1xuXHRcdFx0ZWxtLmNsYXNzTmFtZSA9IGVsbS5jbGFzc05hbWUucmVwbGFjZShyZXBsLCAnJDEnKTtcblx0XHR9XG5cdH0sXG5cblxuXHRnZXRTdHlsZSA6IGZ1bmN0aW9uIChlbG0pIHtcblx0XHRyZXR1cm4gd2luZG93LmdldENvbXB1dGVkU3R5bGUgPyB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbG0pIDogZWxtLmN1cnJlbnRTdHlsZTtcblx0fSxcblxuXG5cdHNldFN0eWxlIDogKGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgaGVscGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0dmFyIGdldFN1cHBvcnRlZFByb3AgPSBmdW5jdGlvbiAobmFtZXMpIHtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbmFtZXMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0aWYgKG5hbWVzW2ldIGluIGhlbHBlci5zdHlsZSkge1xuXHRcdFx0XHRcdHJldHVybiBuYW1lc1tpXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cdFx0dmFyIHByb3BzID0ge1xuXHRcdFx0Ym9yZGVyUmFkaXVzOiBnZXRTdXBwb3J0ZWRQcm9wKFsnYm9yZGVyUmFkaXVzJywgJ01vekJvcmRlclJhZGl1cycsICd3ZWJraXRCb3JkZXJSYWRpdXMnXSksXG5cdFx0XHRib3hTaGFkb3c6IGdldFN1cHBvcnRlZFByb3AoWydib3hTaGFkb3cnLCAnTW96Qm94U2hhZG93JywgJ3dlYmtpdEJveFNoYWRvdyddKVxuXHRcdH07XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChlbG0sIHByb3AsIHZhbHVlKSB7XG5cdFx0XHRzd2l0Y2ggKHByb3AudG9Mb3dlckNhc2UoKSkge1xuXHRcdFx0Y2FzZSAnb3BhY2l0eSc6XG5cdFx0XHRcdHZhciBhbHBoYU9wYWNpdHkgPSBNYXRoLnJvdW5kKHBhcnNlRmxvYXQodmFsdWUpICogMTAwKTtcblx0XHRcdFx0ZWxtLnN0eWxlLm9wYWNpdHkgPSB2YWx1ZTtcblx0XHRcdFx0ZWxtLnN0eWxlLmZpbHRlciA9ICdhbHBoYShvcGFjaXR5PScgKyBhbHBoYU9wYWNpdHkgKyAnKSc7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0ZWxtLnN0eWxlW3Byb3BzW3Byb3BdXSA9IHZhbHVlO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9O1xuXHR9KSgpLFxuXG5cblx0c2V0Qm9yZGVyUmFkaXVzIDogZnVuY3Rpb24gKGVsbSwgdmFsdWUpIHtcblx0XHRqc2Muc2V0U3R5bGUoZWxtLCAnYm9yZGVyUmFkaXVzJywgdmFsdWUgfHwgJzAnKTtcblx0fSxcblxuXG5cdHNldEJveFNoYWRvdyA6IGZ1bmN0aW9uIChlbG0sIHZhbHVlKSB7XG5cdFx0anNjLnNldFN0eWxlKGVsbSwgJ2JveFNoYWRvdycsIHZhbHVlIHx8ICdub25lJyk7XG5cdH0sXG5cblxuXHRnZXRFbGVtZW50UG9zIDogZnVuY3Rpb24gKGUsIHJlbGF0aXZlVG9WaWV3cG9ydCkge1xuXHRcdHZhciB4PTAsIHk9MDtcblx0XHR2YXIgcmVjdCA9IGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdFx0eCA9IHJlY3QubGVmdDtcblx0XHR5ID0gcmVjdC50b3A7XG5cdFx0aWYgKCFyZWxhdGl2ZVRvVmlld3BvcnQpIHtcblx0XHRcdHZhciB2aWV3UG9zID0ganNjLmdldFZpZXdQb3MoKTtcblx0XHRcdHggKz0gdmlld1Bvc1swXTtcblx0XHRcdHkgKz0gdmlld1Bvc1sxXTtcblx0XHR9XG5cdFx0cmV0dXJuIFt4LCB5XTtcblx0fSxcblxuXG5cdGdldEVsZW1lbnRTaXplIDogZnVuY3Rpb24gKGUpIHtcblx0XHRyZXR1cm4gW2Uub2Zmc2V0V2lkdGgsIGUub2Zmc2V0SGVpZ2h0XTtcblx0fSxcblxuXG5cdC8vIGdldCBwb2ludGVyJ3MgWC9ZIGNvb3JkaW5hdGVzIHJlbGF0aXZlIHRvIHZpZXdwb3J0XG5cdGdldEFic1BvaW50ZXJQb3MgOiBmdW5jdGlvbiAoZSkge1xuXHRcdGlmICghZSkgeyBlID0gd2luZG93LmV2ZW50OyB9XG5cdFx0dmFyIHggPSAwLCB5ID0gMDtcblx0XHRpZiAodHlwZW9mIGUuY2hhbmdlZFRvdWNoZXMgIT09ICd1bmRlZmluZWQnICYmIGUuY2hhbmdlZFRvdWNoZXMubGVuZ3RoKSB7XG5cdFx0XHQvLyB0b3VjaCBkZXZpY2VzXG5cdFx0XHR4ID0gZS5jaGFuZ2VkVG91Y2hlc1swXS5jbGllbnRYO1xuXHRcdFx0eSA9IGUuY2hhbmdlZFRvdWNoZXNbMF0uY2xpZW50WTtcblx0XHR9IGVsc2UgaWYgKHR5cGVvZiBlLmNsaWVudFggPT09ICdudW1iZXInKSB7XG5cdFx0XHR4ID0gZS5jbGllbnRYO1xuXHRcdFx0eSA9IGUuY2xpZW50WTtcblx0XHR9XG5cdFx0cmV0dXJuIHsgeDogeCwgeTogeSB9O1xuXHR9LFxuXG5cblx0Ly8gZ2V0IHBvaW50ZXIncyBYL1kgY29vcmRpbmF0ZXMgcmVsYXRpdmUgdG8gdGFyZ2V0IGVsZW1lbnRcblx0Z2V0UmVsUG9pbnRlclBvcyA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0aWYgKCFlKSB7IGUgPSB3aW5kb3cuZXZlbnQ7IH1cblx0XHR2YXIgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuXHRcdHZhciB0YXJnZXRSZWN0ID0gdGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG5cdFx0dmFyIHggPSAwLCB5ID0gMDtcblxuXHRcdHZhciBjbGllbnRYID0gMCwgY2xpZW50WSA9IDA7XG5cdFx0aWYgKHR5cGVvZiBlLmNoYW5nZWRUb3VjaGVzICE9PSAndW5kZWZpbmVkJyAmJiBlLmNoYW5nZWRUb3VjaGVzLmxlbmd0aCkge1xuXHRcdFx0Ly8gdG91Y2ggZGV2aWNlc1xuXHRcdFx0Y2xpZW50WCA9IGUuY2hhbmdlZFRvdWNoZXNbMF0uY2xpZW50WDtcblx0XHRcdGNsaWVudFkgPSBlLmNoYW5nZWRUb3VjaGVzWzBdLmNsaWVudFk7XG5cdFx0fSBlbHNlIGlmICh0eXBlb2YgZS5jbGllbnRYID09PSAnbnVtYmVyJykge1xuXHRcdFx0Y2xpZW50WCA9IGUuY2xpZW50WDtcblx0XHRcdGNsaWVudFkgPSBlLmNsaWVudFk7XG5cdFx0fVxuXG5cdFx0eCA9IGNsaWVudFggLSB0YXJnZXRSZWN0LmxlZnQ7XG5cdFx0eSA9IGNsaWVudFkgLSB0YXJnZXRSZWN0LnRvcDtcblx0XHRyZXR1cm4geyB4OiB4LCB5OiB5IH07XG5cdH0sXG5cblxuXHRnZXRWaWV3UG9zIDogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBkb2MgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG5cdFx0cmV0dXJuIFtcblx0XHRcdCh3aW5kb3cucGFnZVhPZmZzZXQgfHwgZG9jLnNjcm9sbExlZnQpIC0gKGRvYy5jbGllbnRMZWZ0IHx8IDApLFxuXHRcdFx0KHdpbmRvdy5wYWdlWU9mZnNldCB8fCBkb2Muc2Nyb2xsVG9wKSAtIChkb2MuY2xpZW50VG9wIHx8IDApXG5cdFx0XTtcblx0fSxcblxuXG5cdGdldFZpZXdTaXplIDogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBkb2MgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG5cdFx0cmV0dXJuIFtcblx0XHRcdCh3aW5kb3cuaW5uZXJXaWR0aCB8fCBkb2MuY2xpZW50V2lkdGgpLFxuXHRcdFx0KHdpbmRvdy5pbm5lckhlaWdodCB8fCBkb2MuY2xpZW50SGVpZ2h0KSxcblx0XHRdO1xuXHR9LFxuXG5cblx0cmVkcmF3UG9zaXRpb24gOiBmdW5jdGlvbiAoKSB7XG5cblx0XHRpZiAoanNjLnBpY2tlciAmJiBqc2MucGlja2VyLm93bmVyKSB7XG5cdFx0XHR2YXIgdGhpc09iaiA9IGpzYy5waWNrZXIub3duZXI7XG5cblx0XHRcdHZhciB0cCwgdnA7XG5cblx0XHRcdGlmICh0aGlzT2JqLmZpeGVkKSB7XG5cdFx0XHRcdC8vIEZpeGVkIGVsZW1lbnRzIGFyZSBwb3NpdGlvbmVkIHJlbGF0aXZlIHRvIHZpZXdwb3J0LFxuXHRcdFx0XHQvLyB0aGVyZWZvcmUgd2UgY2FuIGlnbm9yZSB0aGUgc2Nyb2xsIG9mZnNldFxuXHRcdFx0XHR0cCA9IGpzYy5nZXRFbGVtZW50UG9zKHRoaXNPYmoudGFyZ2V0RWxlbWVudCwgdHJ1ZSk7IC8vIHRhcmdldCBwb3Ncblx0XHRcdFx0dnAgPSBbMCwgMF07IC8vIHZpZXcgcG9zXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0cCA9IGpzYy5nZXRFbGVtZW50UG9zKHRoaXNPYmoudGFyZ2V0RWxlbWVudCk7IC8vIHRhcmdldCBwb3Ncblx0XHRcdFx0dnAgPSBqc2MuZ2V0Vmlld1BvcygpOyAvLyB2aWV3IHBvc1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgdHMgPSBqc2MuZ2V0RWxlbWVudFNpemUodGhpc09iai50YXJnZXRFbGVtZW50KTsgLy8gdGFyZ2V0IHNpemVcblx0XHRcdHZhciB2cyA9IGpzYy5nZXRWaWV3U2l6ZSgpOyAvLyB2aWV3IHNpemVcblx0XHRcdHZhciBwcyA9IGpzYy5nZXRQaWNrZXJPdXRlckRpbXModGhpc09iaik7IC8vIHBpY2tlciBzaXplXG5cdFx0XHR2YXIgYSwgYiwgYztcblx0XHRcdHN3aXRjaCAodGhpc09iai5wb3NpdGlvbi50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0XHRcdGNhc2UgJ2xlZnQnOiBhPTE7IGI9MDsgYz0tMTsgYnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3JpZ2h0JzphPTE7IGI9MDsgYz0xOyBicmVhaztcblx0XHRcdFx0Y2FzZSAndG9wJzogIGE9MDsgYj0xOyBjPS0xOyBicmVhaztcblx0XHRcdFx0ZGVmYXVsdDogICAgIGE9MDsgYj0xOyBjPTE7IGJyZWFrO1xuXHRcdFx0fVxuXHRcdFx0dmFyIGwgPSAodHNbYl0rcHNbYl0pLzI7XG5cblx0XHRcdC8vIGNvbXB1dGUgcGlja2VyIHBvc2l0aW9uXG5cdFx0XHRpZiAoIXRoaXNPYmouc21hcnRQb3NpdGlvbikge1xuXHRcdFx0XHR2YXIgcHAgPSBbXG5cdFx0XHRcdFx0dHBbYV0sXG5cdFx0XHRcdFx0dHBbYl0rdHNbYl0tbCtsKmNcblx0XHRcdFx0XTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHZhciBwcCA9IFtcblx0XHRcdFx0XHQtdnBbYV0rdHBbYV0rcHNbYV0gPiB2c1thXSA/XG5cdFx0XHRcdFx0XHQoLXZwW2FdK3RwW2FdK3RzW2FdLzIgPiB2c1thXS8yICYmIHRwW2FdK3RzW2FdLXBzW2FdID49IDAgPyB0cFthXSt0c1thXS1wc1thXSA6IHRwW2FdKSA6XG5cdFx0XHRcdFx0XHR0cFthXSxcblx0XHRcdFx0XHQtdnBbYl0rdHBbYl0rdHNbYl0rcHNbYl0tbCtsKmMgPiB2c1tiXSA/XG5cdFx0XHRcdFx0XHQoLXZwW2JdK3RwW2JdK3RzW2JdLzIgPiB2c1tiXS8yICYmIHRwW2JdK3RzW2JdLWwtbCpjID49IDAgPyB0cFtiXSt0c1tiXS1sLWwqYyA6IHRwW2JdK3RzW2JdLWwrbCpjKSA6XG5cdFx0XHRcdFx0XHQodHBbYl0rdHNbYl0tbCtsKmMgPj0gMCA/IHRwW2JdK3RzW2JdLWwrbCpjIDogdHBbYl0rdHNbYl0tbC1sKmMpXG5cdFx0XHRcdF07XG5cdFx0XHR9XG5cblx0XHRcdHZhciB4ID0gcHBbYV07XG5cdFx0XHR2YXIgeSA9IHBwW2JdO1xuXHRcdFx0dmFyIHBvc2l0aW9uVmFsdWUgPSB0aGlzT2JqLmZpeGVkID8gJ2ZpeGVkJyA6ICdhYnNvbHV0ZSc7XG5cdFx0XHR2YXIgY29udHJhY3RTaGFkb3cgPVxuXHRcdFx0XHQocHBbMF0gKyBwc1swXSA+IHRwWzBdIHx8IHBwWzBdIDwgdHBbMF0gKyB0c1swXSkgJiZcblx0XHRcdFx0KHBwWzFdICsgcHNbMV0gPCB0cFsxXSArIHRzWzFdKTtcblxuXHRcdFx0anNjLl9kcmF3UG9zaXRpb24odGhpc09iaiwgeCwgeSwgcG9zaXRpb25WYWx1ZSwgY29udHJhY3RTaGFkb3cpO1xuXHRcdH1cblx0fSxcblxuXG5cdF9kcmF3UG9zaXRpb24gOiBmdW5jdGlvbiAodGhpc09iaiwgeCwgeSwgcG9zaXRpb25WYWx1ZSwgY29udHJhY3RTaGFkb3cpIHtcblx0XHR2YXIgdlNoYWRvdyA9IGNvbnRyYWN0U2hhZG93ID8gMCA6IHRoaXNPYmouc2hhZG93Qmx1cjsgLy8gcHhcblxuXHRcdGpzYy5waWNrZXIud3JhcC5zdHlsZS5wb3NpdGlvbiA9IHBvc2l0aW9uVmFsdWU7XG5cdFx0anNjLnBpY2tlci53cmFwLnN0eWxlLmxlZnQgPSB4ICsgJ3B4Jztcblx0XHRqc2MucGlja2VyLndyYXAuc3R5bGUudG9wID0geSArICdweCc7XG5cblx0XHRqc2Muc2V0Qm94U2hhZG93KFxuXHRcdFx0anNjLnBpY2tlci5ib3hTLFxuXHRcdFx0dGhpc09iai5zaGFkb3cgP1xuXHRcdFx0XHRuZXcganNjLkJveFNoYWRvdygwLCB2U2hhZG93LCB0aGlzT2JqLnNoYWRvd0JsdXIsIDAsIHRoaXNPYmouc2hhZG93Q29sb3IpIDpcblx0XHRcdFx0bnVsbCk7XG5cdH0sXG5cblxuXHRnZXRQaWNrZXJEaW1zIDogZnVuY3Rpb24gKHRoaXNPYmopIHtcblx0XHR2YXIgZGlzcGxheVNsaWRlciA9ICEhanNjLmdldFNsaWRlckNvbXBvbmVudCh0aGlzT2JqKTtcblx0XHR2YXIgZGltcyA9IFtcblx0XHRcdDIgKiB0aGlzT2JqLmluc2V0V2lkdGggKyAyICogdGhpc09iai5wYWRkaW5nICsgdGhpc09iai53aWR0aCArXG5cdFx0XHRcdChkaXNwbGF5U2xpZGVyID8gMiAqIHRoaXNPYmouaW5zZXRXaWR0aCArIGpzYy5nZXRQYWRUb1NsaWRlclBhZGRpbmcodGhpc09iaikgKyB0aGlzT2JqLnNsaWRlclNpemUgOiAwKSxcblx0XHRcdDIgKiB0aGlzT2JqLmluc2V0V2lkdGggKyAyICogdGhpc09iai5wYWRkaW5nICsgdGhpc09iai5oZWlnaHQgK1xuXHRcdFx0XHQodGhpc09iai5jbG9zYWJsZSA/IDIgKiB0aGlzT2JqLmluc2V0V2lkdGggKyB0aGlzT2JqLnBhZGRpbmcgKyB0aGlzT2JqLmJ1dHRvbkhlaWdodCA6IDApXG5cdFx0XTtcblx0XHRyZXR1cm4gZGltcztcblx0fSxcblxuXG5cdGdldFBpY2tlck91dGVyRGltcyA6IGZ1bmN0aW9uICh0aGlzT2JqKSB7XG5cdFx0dmFyIGRpbXMgPSBqc2MuZ2V0UGlja2VyRGltcyh0aGlzT2JqKTtcblx0XHRyZXR1cm4gW1xuXHRcdFx0ZGltc1swXSArIDIgKiB0aGlzT2JqLmJvcmRlcldpZHRoLFxuXHRcdFx0ZGltc1sxXSArIDIgKiB0aGlzT2JqLmJvcmRlcldpZHRoXG5cdFx0XTtcblx0fSxcblxuXG5cdGdldFBhZFRvU2xpZGVyUGFkZGluZyA6IGZ1bmN0aW9uICh0aGlzT2JqKSB7XG5cdFx0cmV0dXJuIE1hdGgubWF4KHRoaXNPYmoucGFkZGluZywgMS41ICogKDIgKiB0aGlzT2JqLnBvaW50ZXJCb3JkZXJXaWR0aCArIHRoaXNPYmoucG9pbnRlclRoaWNrbmVzcykpO1xuXHR9LFxuXG5cblx0Z2V0UGFkWUNvbXBvbmVudCA6IGZ1bmN0aW9uICh0aGlzT2JqKSB7XG5cdFx0c3dpdGNoICh0aGlzT2JqLm1vZGUuY2hhckF0KDEpLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRcdGNhc2UgJ3YnOiByZXR1cm4gJ3YnOyBicmVhaztcblx0XHR9XG5cdFx0cmV0dXJuICdzJztcblx0fSxcblxuXG5cdGdldFNsaWRlckNvbXBvbmVudCA6IGZ1bmN0aW9uICh0aGlzT2JqKSB7XG5cdFx0aWYgKHRoaXNPYmoubW9kZS5sZW5ndGggPiAyKSB7XG5cdFx0XHRzd2l0Y2ggKHRoaXNPYmoubW9kZS5jaGFyQXQoMikudG9Mb3dlckNhc2UoKSkge1xuXHRcdFx0XHRjYXNlICdzJzogcmV0dXJuICdzJzsgYnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3YnOiByZXR1cm4gJ3YnOyBicmVhaztcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIG51bGw7XG5cdH0sXG5cblxuXHRvbkRvY3VtZW50TW91c2VEb3duIDogZnVuY3Rpb24gKGUpIHtcblx0XHRpZiAoIWUpIHsgZSA9IHdpbmRvdy5ldmVudDsgfVxuXHRcdHZhciB0YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XG5cblx0XHRpZiAodGFyZ2V0Ll9qc2NMaW5rZWRJbnN0YW5jZSkge1xuXHRcdFx0aWYgKHRhcmdldC5fanNjTGlua2VkSW5zdGFuY2Uuc2hvd09uQ2xpY2spIHtcblx0XHRcdFx0dGFyZ2V0Ll9qc2NMaW5rZWRJbnN0YW5jZS5zaG93KCk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmICh0YXJnZXQuX2pzY0NvbnRyb2xOYW1lKSB7XG5cdFx0XHRqc2Mub25Db250cm9sUG9pbnRlclN0YXJ0KGUsIHRhcmdldCwgdGFyZ2V0Ll9qc2NDb250cm9sTmFtZSwgJ21vdXNlJyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIE1vdXNlIGlzIG91dHNpZGUgdGhlIHBpY2tlciBjb250cm9scyAtPiBoaWRlIHRoZSBjb2xvciBwaWNrZXIhXG5cdFx0XHRpZiAoanNjLnBpY2tlciAmJiBqc2MucGlja2VyLm93bmVyKSB7XG5cdFx0XHRcdGpzYy5waWNrZXIub3duZXIuaGlkZSgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXG5cdG9uRG9jdW1lbnRUb3VjaFN0YXJ0IDogZnVuY3Rpb24gKGUpIHtcblx0XHRpZiAoIWUpIHsgZSA9IHdpbmRvdy5ldmVudDsgfVxuXHRcdHZhciB0YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XG5cblx0XHRpZiAodGFyZ2V0Ll9qc2NMaW5rZWRJbnN0YW5jZSkge1xuXHRcdFx0aWYgKHRhcmdldC5fanNjTGlua2VkSW5zdGFuY2Uuc2hvd09uQ2xpY2spIHtcblx0XHRcdFx0dGFyZ2V0Ll9qc2NMaW5rZWRJbnN0YW5jZS5zaG93KCk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmICh0YXJnZXQuX2pzY0NvbnRyb2xOYW1lKSB7XG5cdFx0XHRqc2Mub25Db250cm9sUG9pbnRlclN0YXJ0KGUsIHRhcmdldCwgdGFyZ2V0Ll9qc2NDb250cm9sTmFtZSwgJ3RvdWNoJyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmIChqc2MucGlja2VyICYmIGpzYy5waWNrZXIub3duZXIpIHtcblx0XHRcdFx0anNjLnBpY2tlci5vd25lci5oaWRlKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0b25XaW5kb3dSZXNpemUgOiBmdW5jdGlvbiAoZSkge1xuXHRcdGpzYy5yZWRyYXdQb3NpdGlvbigpO1xuXHR9LFxuXG5cblx0b25QYXJlbnRTY3JvbGwgOiBmdW5jdGlvbiAoZSkge1xuXHRcdC8vIGhpZGUgdGhlIHBpY2tlciB3aGVuIG9uZSBvZiB0aGUgcGFyZW50IGVsZW1lbnRzIGlzIHNjcm9sbGVkXG5cdFx0aWYgKGpzYy5waWNrZXIgJiYganNjLnBpY2tlci5vd25lcikge1xuXHRcdFx0anNjLnBpY2tlci5vd25lci5oaWRlKCk7XG5cdFx0fVxuXHR9LFxuXG5cblx0X3BvaW50ZXJNb3ZlRXZlbnQgOiB7XG5cdFx0bW91c2U6ICdtb3VzZW1vdmUnLFxuXHRcdHRvdWNoOiAndG91Y2htb3ZlJ1xuXHR9LFxuXHRfcG9pbnRlckVuZEV2ZW50IDoge1xuXHRcdG1vdXNlOiAnbW91c2V1cCcsXG5cdFx0dG91Y2g6ICd0b3VjaGVuZCdcblx0fSxcblxuXG5cdF9wb2ludGVyT3JpZ2luIDogbnVsbCxcblx0X2NhcHR1cmVkVGFyZ2V0IDogbnVsbCxcblxuXG5cdG9uQ29udHJvbFBvaW50ZXJTdGFydCA6IGZ1bmN0aW9uIChlLCB0YXJnZXQsIGNvbnRyb2xOYW1lLCBwb2ludGVyVHlwZSkge1xuXHRcdHZhciB0aGlzT2JqID0gdGFyZ2V0Ll9qc2NJbnN0YW5jZTtcblxuXHRcdGpzYy5wcmV2ZW50RGVmYXVsdChlKTtcblx0XHRqc2MuY2FwdHVyZVRhcmdldCh0YXJnZXQpO1xuXG5cdFx0dmFyIHJlZ2lzdGVyRHJhZ0V2ZW50cyA9IGZ1bmN0aW9uIChkb2MsIG9mZnNldCkge1xuXHRcdFx0anNjLmF0dGFjaEdyb3VwRXZlbnQoJ2RyYWcnLCBkb2MsIGpzYy5fcG9pbnRlck1vdmVFdmVudFtwb2ludGVyVHlwZV0sXG5cdFx0XHRcdGpzYy5vbkRvY3VtZW50UG9pbnRlck1vdmUoZSwgdGFyZ2V0LCBjb250cm9sTmFtZSwgcG9pbnRlclR5cGUsIG9mZnNldCkpO1xuXHRcdFx0anNjLmF0dGFjaEdyb3VwRXZlbnQoJ2RyYWcnLCBkb2MsIGpzYy5fcG9pbnRlckVuZEV2ZW50W3BvaW50ZXJUeXBlXSxcblx0XHRcdFx0anNjLm9uRG9jdW1lbnRQb2ludGVyRW5kKGUsIHRhcmdldCwgY29udHJvbE5hbWUsIHBvaW50ZXJUeXBlKSk7XG5cdFx0fTtcblxuXHRcdHJlZ2lzdGVyRHJhZ0V2ZW50cyhkb2N1bWVudCwgWzAsIDBdKTtcblxuXHRcdGlmICh3aW5kb3cucGFyZW50ICYmIHdpbmRvdy5mcmFtZUVsZW1lbnQpIHtcblx0XHRcdHZhciByZWN0ID0gd2luZG93LmZyYW1lRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0XHRcdHZhciBvZnMgPSBbLXJlY3QubGVmdCwgLXJlY3QudG9wXTtcblx0XHRcdHJlZ2lzdGVyRHJhZ0V2ZW50cyh3aW5kb3cucGFyZW50LndpbmRvdy5kb2N1bWVudCwgb2ZzKTtcblx0XHR9XG5cblx0XHR2YXIgYWJzID0ganNjLmdldEFic1BvaW50ZXJQb3MoZSk7XG5cdFx0dmFyIHJlbCA9IGpzYy5nZXRSZWxQb2ludGVyUG9zKGUpO1xuXHRcdGpzYy5fcG9pbnRlck9yaWdpbiA9IHtcblx0XHRcdHg6IGFicy54IC0gcmVsLngsXG5cdFx0XHR5OiBhYnMueSAtIHJlbC55XG5cdFx0fTtcblxuXHRcdHN3aXRjaCAoY29udHJvbE5hbWUpIHtcblx0XHRjYXNlICdwYWQnOlxuXHRcdFx0Ly8gaWYgdGhlIHNsaWRlciBpcyBhdCB0aGUgYm90dG9tLCBtb3ZlIGl0IHVwXG5cdFx0XHRzd2l0Y2ggKGpzYy5nZXRTbGlkZXJDb21wb25lbnQodGhpc09iaikpIHtcblx0XHRcdGNhc2UgJ3MnOiBpZiAodGhpc09iai5oc3ZbMV0gPT09IDApIHsgdGhpc09iai5mcm9tSFNWKG51bGwsIDEwMCwgbnVsbCk7IH07IGJyZWFrO1xuXHRcdFx0Y2FzZSAndic6IGlmICh0aGlzT2JqLmhzdlsyXSA9PT0gMCkgeyB0aGlzT2JqLmZyb21IU1YobnVsbCwgbnVsbCwgMTAwKTsgfTsgYnJlYWs7XG5cdFx0XHR9XG5cdFx0XHRqc2Muc2V0UGFkKHRoaXNPYmosIGUsIDAsIDApO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlICdzbGQnOlxuXHRcdFx0anNjLnNldFNsZCh0aGlzT2JqLCBlLCAwKTtcblx0XHRcdGJyZWFrO1xuXHRcdH1cblxuXHRcdGpzYy5kaXNwYXRjaEZpbmVDaGFuZ2UodGhpc09iaik7XG5cdH0sXG5cblxuXHRvbkRvY3VtZW50UG9pbnRlck1vdmUgOiBmdW5jdGlvbiAoZSwgdGFyZ2V0LCBjb250cm9sTmFtZSwgcG9pbnRlclR5cGUsIG9mZnNldCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAoZSkge1xuXHRcdFx0dmFyIHRoaXNPYmogPSB0YXJnZXQuX2pzY0luc3RhbmNlO1xuXHRcdFx0c3dpdGNoIChjb250cm9sTmFtZSkge1xuXHRcdFx0Y2FzZSAncGFkJzpcblx0XHRcdFx0aWYgKCFlKSB7IGUgPSB3aW5kb3cuZXZlbnQ7IH1cblx0XHRcdFx0anNjLnNldFBhZCh0aGlzT2JqLCBlLCBvZmZzZXRbMF0sIG9mZnNldFsxXSk7XG5cdFx0XHRcdGpzYy5kaXNwYXRjaEZpbmVDaGFuZ2UodGhpc09iaik7XG5cdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRjYXNlICdzbGQnOlxuXHRcdFx0XHRpZiAoIWUpIHsgZSA9IHdpbmRvdy5ldmVudDsgfVxuXHRcdFx0XHRqc2Muc2V0U2xkKHRoaXNPYmosIGUsIG9mZnNldFsxXSk7XG5cdFx0XHRcdGpzYy5kaXNwYXRjaEZpbmVDaGFuZ2UodGhpc09iaik7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXG5cdG9uRG9jdW1lbnRQb2ludGVyRW5kIDogZnVuY3Rpb24gKGUsIHRhcmdldCwgY29udHJvbE5hbWUsIHBvaW50ZXJUeXBlKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChlKSB7XG5cdFx0XHR2YXIgdGhpc09iaiA9IHRhcmdldC5fanNjSW5zdGFuY2U7XG5cdFx0XHRqc2MuZGV0YWNoR3JvdXBFdmVudHMoJ2RyYWcnKTtcblx0XHRcdGpzYy5yZWxlYXNlVGFyZ2V0KCk7XG5cdFx0XHQvLyBBbHdheXMgZGlzcGF0Y2ggY2hhbmdlcyBhZnRlciBkZXRhY2hpbmcgb3V0c3RhbmRpbmcgbW91c2UgaGFuZGxlcnMsXG5cdFx0XHQvLyBpbiBjYXNlIHNvbWUgdXNlciBpbnRlcmFjdGlvbiB3aWxsIG9jY3VyIGluIHVzZXIncyBvbmNoYW5nZSBjYWxsYmFja1xuXHRcdFx0Ly8gdGhhdCB3b3VsZCBpbnRydWRlIHdpdGggY3VycmVudCBtb3VzZSBldmVudHNcblx0XHRcdGpzYy5kaXNwYXRjaENoYW5nZSh0aGlzT2JqKTtcblx0XHR9O1xuXHR9LFxuXG5cblx0ZGlzcGF0Y2hDaGFuZ2UgOiBmdW5jdGlvbiAodGhpc09iaikge1xuXHRcdGlmICh0aGlzT2JqLnZhbHVlRWxlbWVudCkge1xuXHRcdFx0aWYgKGpzYy5pc0VsZW1lbnRUeXBlKHRoaXNPYmoudmFsdWVFbGVtZW50LCAnaW5wdXQnKSkge1xuXHRcdFx0XHRqc2MuZmlyZUV2ZW50KHRoaXNPYmoudmFsdWVFbGVtZW50LCAnY2hhbmdlJyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0ZGlzcGF0Y2hGaW5lQ2hhbmdlIDogZnVuY3Rpb24gKHRoaXNPYmopIHtcblx0XHRpZiAodGhpc09iai5vbkZpbmVDaGFuZ2UpIHtcblx0XHRcdHZhciBjYWxsYmFjaztcblx0XHRcdGlmICh0eXBlb2YgdGhpc09iai5vbkZpbmVDaGFuZ2UgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdGNhbGxiYWNrID0gbmV3IEZ1bmN0aW9uICh0aGlzT2JqLm9uRmluZUNoYW5nZSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjYWxsYmFjayA9IHRoaXNPYmoub25GaW5lQ2hhbmdlO1xuXHRcdFx0fVxuXHRcdFx0Y2FsbGJhY2suY2FsbCh0aGlzT2JqKTtcblx0XHR9XG5cdH0sXG5cblxuXHRzZXRQYWQgOiBmdW5jdGlvbiAodGhpc09iaiwgZSwgb2ZzWCwgb2ZzWSkge1xuXHRcdHZhciBwb2ludGVyQWJzID0ganNjLmdldEFic1BvaW50ZXJQb3MoZSk7XG5cdFx0dmFyIHggPSBvZnNYICsgcG9pbnRlckFicy54IC0ganNjLl9wb2ludGVyT3JpZ2luLnggLSB0aGlzT2JqLnBhZGRpbmcgLSB0aGlzT2JqLmluc2V0V2lkdGg7XG5cdFx0dmFyIHkgPSBvZnNZICsgcG9pbnRlckFicy55IC0ganNjLl9wb2ludGVyT3JpZ2luLnkgLSB0aGlzT2JqLnBhZGRpbmcgLSB0aGlzT2JqLmluc2V0V2lkdGg7XG5cblx0XHR2YXIgeFZhbCA9IHggKiAoMzYwIC8gKHRoaXNPYmoud2lkdGggLSAxKSk7XG5cdFx0dmFyIHlWYWwgPSAxMDAgLSAoeSAqICgxMDAgLyAodGhpc09iai5oZWlnaHQgLSAxKSkpO1xuXG5cdFx0c3dpdGNoIChqc2MuZ2V0UGFkWUNvbXBvbmVudCh0aGlzT2JqKSkge1xuXHRcdGNhc2UgJ3MnOiB0aGlzT2JqLmZyb21IU1YoeFZhbCwgeVZhbCwgbnVsbCwganNjLmxlYXZlU2xkKTsgYnJlYWs7XG5cdFx0Y2FzZSAndic6IHRoaXNPYmouZnJvbUhTVih4VmFsLCBudWxsLCB5VmFsLCBqc2MubGVhdmVTbGQpOyBicmVhaztcblx0XHR9XG5cdH0sXG5cblxuXHRzZXRTbGQgOiBmdW5jdGlvbiAodGhpc09iaiwgZSwgb2ZzWSkge1xuXHRcdHZhciBwb2ludGVyQWJzID0ganNjLmdldEFic1BvaW50ZXJQb3MoZSk7XG5cdFx0dmFyIHkgPSBvZnNZICsgcG9pbnRlckFicy55IC0ganNjLl9wb2ludGVyT3JpZ2luLnkgLSB0aGlzT2JqLnBhZGRpbmcgLSB0aGlzT2JqLmluc2V0V2lkdGg7XG5cblx0XHR2YXIgeVZhbCA9IDEwMCAtICh5ICogKDEwMCAvICh0aGlzT2JqLmhlaWdodCAtIDEpKSk7XG5cblx0XHRzd2l0Y2ggKGpzYy5nZXRTbGlkZXJDb21wb25lbnQodGhpc09iaikpIHtcblx0XHRjYXNlICdzJzogdGhpc09iai5mcm9tSFNWKG51bGwsIHlWYWwsIG51bGwsIGpzYy5sZWF2ZVBhZCk7IGJyZWFrO1xuXHRcdGNhc2UgJ3YnOiB0aGlzT2JqLmZyb21IU1YobnVsbCwgbnVsbCwgeVZhbCwganNjLmxlYXZlUGFkKTsgYnJlYWs7XG5cdFx0fVxuXHR9LFxuXG5cblx0X3ZtbE5TIDogJ2pzY192bWxfJyxcblx0X3ZtbENTUyA6ICdqc2Nfdm1sX2Nzc18nLFxuXHRfdm1sUmVhZHkgOiBmYWxzZSxcblxuXG5cdGluaXRWTUwgOiBmdW5jdGlvbiAoKSB7XG5cdFx0aWYgKCFqc2MuX3ZtbFJlYWR5KSB7XG5cdFx0XHQvLyBpbml0IFZNTCBuYW1lc3BhY2Vcblx0XHRcdHZhciBkb2MgPSBkb2N1bWVudDtcblx0XHRcdGlmICghZG9jLm5hbWVzcGFjZXNbanNjLl92bWxOU10pIHtcblx0XHRcdFx0ZG9jLm5hbWVzcGFjZXMuYWRkKGpzYy5fdm1sTlMsICd1cm46c2NoZW1hcy1taWNyb3NvZnQtY29tOnZtbCcpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCFkb2Muc3R5bGVTaGVldHNbanNjLl92bWxDU1NdKSB7XG5cdFx0XHRcdHZhciB0YWdzID0gWydzaGFwZScsICdzaGFwZXR5cGUnLCAnZ3JvdXAnLCAnYmFja2dyb3VuZCcsICdwYXRoJywgJ2Zvcm11bGFzJywgJ2hhbmRsZXMnLCAnZmlsbCcsICdzdHJva2UnLCAnc2hhZG93JywgJ3RleHRib3gnLCAndGV4dHBhdGgnLCAnaW1hZ2VkYXRhJywgJ2xpbmUnLCAncG9seWxpbmUnLCAnY3VydmUnLCAncmVjdCcsICdyb3VuZHJlY3QnLCAnb3ZhbCcsICdhcmMnLCAnaW1hZ2UnXTtcblx0XHRcdFx0dmFyIHNzID0gZG9jLmNyZWF0ZVN0eWxlU2hlZXQoKTtcblx0XHRcdFx0c3Mub3duaW5nRWxlbWVudC5pZCA9IGpzYy5fdm1sQ1NTO1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRhZ3MubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0XHRzcy5hZGRSdWxlKGpzYy5fdm1sTlMgKyAnXFxcXDonICsgdGFnc1tpXSwgJ2JlaGF2aW9yOnVybCgjZGVmYXVsdCNWTUwpOycpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRqc2MuX3ZtbFJlYWR5ID0gdHJ1ZTtcblx0XHR9XG5cdH0sXG5cblxuXHRjcmVhdGVQYWxldHRlIDogZnVuY3Rpb24gKCkge1xuXG5cdFx0dmFyIHBhbGV0dGVPYmogPSB7XG5cdFx0XHRlbG06IG51bGwsXG5cdFx0XHRkcmF3OiBudWxsXG5cdFx0fTtcblxuXHRcdGlmIChqc2MuaXNDYW52YXNTdXBwb3J0ZWQpIHtcblx0XHRcdC8vIENhbnZhcyBpbXBsZW1lbnRhdGlvbiBmb3IgbW9kZXJuIGJyb3dzZXJzXG5cblx0XHRcdHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblx0XHRcdHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuXHRcdFx0dmFyIGRyYXdGdW5jID0gZnVuY3Rpb24gKHdpZHRoLCBoZWlnaHQsIHR5cGUpIHtcblx0XHRcdFx0Y2FudmFzLndpZHRoID0gd2lkdGg7XG5cdFx0XHRcdGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG5cblx0XHRcdFx0Y3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXG5cdFx0XHRcdHZhciBoR3JhZCA9IGN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudCgwLCAwLCBjYW52YXMud2lkdGgsIDApO1xuXHRcdFx0XHRoR3JhZC5hZGRDb2xvclN0b3AoMCAvIDYsICcjRjAwJyk7XG5cdFx0XHRcdGhHcmFkLmFkZENvbG9yU3RvcCgxIC8gNiwgJyNGRjAnKTtcblx0XHRcdFx0aEdyYWQuYWRkQ29sb3JTdG9wKDIgLyA2LCAnIzBGMCcpO1xuXHRcdFx0XHRoR3JhZC5hZGRDb2xvclN0b3AoMyAvIDYsICcjMEZGJyk7XG5cdFx0XHRcdGhHcmFkLmFkZENvbG9yU3RvcCg0IC8gNiwgJyMwMEYnKTtcblx0XHRcdFx0aEdyYWQuYWRkQ29sb3JTdG9wKDUgLyA2LCAnI0YwRicpO1xuXHRcdFx0XHRoR3JhZC5hZGRDb2xvclN0b3AoNiAvIDYsICcjRjAwJyk7XG5cblx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9IGhHcmFkO1xuXHRcdFx0XHRjdHguZmlsbFJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblxuXHRcdFx0XHR2YXIgdkdyYWQgPSBjdHguY3JlYXRlTGluZWFyR3JhZGllbnQoMCwgMCwgMCwgY2FudmFzLmhlaWdodCk7XG5cdFx0XHRcdHN3aXRjaCAodHlwZS50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0XHRcdGNhc2UgJ3MnOlxuXHRcdFx0XHRcdHZHcmFkLmFkZENvbG9yU3RvcCgwLCAncmdiYSgyNTUsMjU1LDI1NSwwKScpO1xuXHRcdFx0XHRcdHZHcmFkLmFkZENvbG9yU3RvcCgxLCAncmdiYSgyNTUsMjU1LDI1NSwxKScpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICd2Jzpcblx0XHRcdFx0XHR2R3JhZC5hZGRDb2xvclN0b3AoMCwgJ3JnYmEoMCwwLDAsMCknKTtcblx0XHRcdFx0XHR2R3JhZC5hZGRDb2xvclN0b3AoMSwgJ3JnYmEoMCwwLDAsMSknKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0XHRjdHguZmlsbFN0eWxlID0gdkdyYWQ7XG5cdFx0XHRcdGN0eC5maWxsUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXHRcdFx0fTtcblxuXHRcdFx0cGFsZXR0ZU9iai5lbG0gPSBjYW52YXM7XG5cdFx0XHRwYWxldHRlT2JqLmRyYXcgPSBkcmF3RnVuYztcblxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBWTUwgZmFsbGJhY2sgZm9yIElFIDcgYW5kIDhcblxuXHRcdFx0anNjLmluaXRWTUwoKTtcblxuXHRcdFx0dmFyIHZtbENvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdFx0dm1sQ29udGFpbmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcblx0XHRcdHZtbENvbnRhaW5lci5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuXG5cdFx0XHR2YXIgaEdyYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGpzYy5fdm1sTlMgKyAnOmZpbGwnKTtcblx0XHRcdGhHcmFkLnR5cGUgPSAnZ3JhZGllbnQnO1xuXHRcdFx0aEdyYWQubWV0aG9kID0gJ2xpbmVhcic7XG5cdFx0XHRoR3JhZC5hbmdsZSA9ICc5MCc7XG5cdFx0XHRoR3JhZC5jb2xvcnMgPSAnMTYuNjclICNGMEYsIDMzLjMzJSAjMDBGLCA1MCUgIzBGRiwgNjYuNjclICMwRjAsIDgzLjMzJSAjRkYwJ1xuXG5cdFx0XHR2YXIgaFJlY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGpzYy5fdm1sTlMgKyAnOnJlY3QnKTtcblx0XHRcdGhSZWN0LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdGhSZWN0LnN0eWxlLmxlZnQgPSAtMSArICdweCc7XG5cdFx0XHRoUmVjdC5zdHlsZS50b3AgPSAtMSArICdweCc7XG5cdFx0XHRoUmVjdC5zdHJva2VkID0gZmFsc2U7XG5cdFx0XHRoUmVjdC5hcHBlbmRDaGlsZChoR3JhZCk7XG5cdFx0XHR2bWxDb250YWluZXIuYXBwZW5kQ2hpbGQoaFJlY3QpO1xuXG5cdFx0XHR2YXIgdkdyYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGpzYy5fdm1sTlMgKyAnOmZpbGwnKTtcblx0XHRcdHZHcmFkLnR5cGUgPSAnZ3JhZGllbnQnO1xuXHRcdFx0dkdyYWQubWV0aG9kID0gJ2xpbmVhcic7XG5cdFx0XHR2R3JhZC5hbmdsZSA9ICcxODAnO1xuXHRcdFx0dkdyYWQub3BhY2l0eSA9ICcwJztcblxuXHRcdFx0dmFyIHZSZWN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChqc2MuX3ZtbE5TICsgJzpyZWN0Jyk7XG5cdFx0XHR2UmVjdC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHR2UmVjdC5zdHlsZS5sZWZ0ID0gLTEgKyAncHgnO1xuXHRcdFx0dlJlY3Quc3R5bGUudG9wID0gLTEgKyAncHgnO1xuXHRcdFx0dlJlY3Quc3Ryb2tlZCA9IGZhbHNlO1xuXHRcdFx0dlJlY3QuYXBwZW5kQ2hpbGQodkdyYWQpO1xuXHRcdFx0dm1sQ29udGFpbmVyLmFwcGVuZENoaWxkKHZSZWN0KTtcblxuXHRcdFx0dmFyIGRyYXdGdW5jID0gZnVuY3Rpb24gKHdpZHRoLCBoZWlnaHQsIHR5cGUpIHtcblx0XHRcdFx0dm1sQ29udGFpbmVyLnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xuXHRcdFx0XHR2bWxDb250YWluZXIuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgJ3B4JztcblxuXHRcdFx0XHRoUmVjdC5zdHlsZS53aWR0aCA9XG5cdFx0XHRcdHZSZWN0LnN0eWxlLndpZHRoID1cblx0XHRcdFx0XHQod2lkdGggKyAxKSArICdweCc7XG5cdFx0XHRcdGhSZWN0LnN0eWxlLmhlaWdodCA9XG5cdFx0XHRcdHZSZWN0LnN0eWxlLmhlaWdodCA9XG5cdFx0XHRcdFx0KGhlaWdodCArIDEpICsgJ3B4JztcblxuXHRcdFx0XHQvLyBDb2xvcnMgbXVzdCBiZSBzcGVjaWZpZWQgZHVyaW5nIGV2ZXJ5IHJlZHJhdywgb3RoZXJ3aXNlIElFIHdvbid0IGRpc3BsYXlcblx0XHRcdFx0Ly8gYSBmdWxsIGdyYWRpZW50IGR1cmluZyBhIHN1YnNlcXVlbnRpYWwgcmVkcmF3XG5cdFx0XHRcdGhHcmFkLmNvbG9yID0gJyNGMDAnO1xuXHRcdFx0XHRoR3JhZC5jb2xvcjIgPSAnI0YwMCc7XG5cblx0XHRcdFx0c3dpdGNoICh0eXBlLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRcdFx0Y2FzZSAncyc6XG5cdFx0XHRcdFx0dkdyYWQuY29sb3IgPSB2R3JhZC5jb2xvcjIgPSAnI0ZGRic7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3YnOlxuXHRcdFx0XHRcdHZHcmFkLmNvbG9yID0gdkdyYWQuY29sb3IyID0gJyMwMDAnO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdFx0XG5cdFx0XHRwYWxldHRlT2JqLmVsbSA9IHZtbENvbnRhaW5lcjtcblx0XHRcdHBhbGV0dGVPYmouZHJhdyA9IGRyYXdGdW5jO1xuXHRcdH1cblxuXHRcdHJldHVybiBwYWxldHRlT2JqO1xuXHR9LFxuXG5cblx0Y3JlYXRlU2xpZGVyR3JhZGllbnQgOiBmdW5jdGlvbiAoKSB7XG5cblx0XHR2YXIgc2xpZGVyT2JqID0ge1xuXHRcdFx0ZWxtOiBudWxsLFxuXHRcdFx0ZHJhdzogbnVsbFxuXHRcdH07XG5cblx0XHRpZiAoanNjLmlzQ2FudmFzU3VwcG9ydGVkKSB7XG5cdFx0XHQvLyBDYW52YXMgaW1wbGVtZW50YXRpb24gZm9yIG1vZGVybiBicm93c2Vyc1xuXG5cdFx0XHR2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdFx0XHR2YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cblx0XHRcdHZhciBkcmF3RnVuYyA9IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0LCBjb2xvcjEsIGNvbG9yMikge1xuXHRcdFx0XHRjYW52YXMud2lkdGggPSB3aWR0aDtcblx0XHRcdFx0Y2FudmFzLmhlaWdodCA9IGhlaWdodDtcblxuXHRcdFx0XHRjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cblx0XHRcdFx0dmFyIGdyYWQgPSBjdHguY3JlYXRlTGluZWFyR3JhZGllbnQoMCwgMCwgMCwgY2FudmFzLmhlaWdodCk7XG5cdFx0XHRcdGdyYWQuYWRkQ29sb3JTdG9wKDAsIGNvbG9yMSk7XG5cdFx0XHRcdGdyYWQuYWRkQ29sb3JTdG9wKDEsIGNvbG9yMik7XG5cblx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9IGdyYWQ7XG5cdFx0XHRcdGN0eC5maWxsUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXHRcdFx0fTtcblxuXHRcdFx0c2xpZGVyT2JqLmVsbSA9IGNhbnZhcztcblx0XHRcdHNsaWRlck9iai5kcmF3ID0gZHJhd0Z1bmM7XG5cblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gVk1MIGZhbGxiYWNrIGZvciBJRSA3IGFuZCA4XG5cblx0XHRcdGpzYy5pbml0Vk1MKCk7XG5cblx0XHRcdHZhciB2bWxDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0XHRcdHZtbENvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG5cdFx0XHR2bWxDb250YWluZXIuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcblxuXHRcdFx0dmFyIGdyYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGpzYy5fdm1sTlMgKyAnOmZpbGwnKTtcblx0XHRcdGdyYWQudHlwZSA9ICdncmFkaWVudCc7XG5cdFx0XHRncmFkLm1ldGhvZCA9ICdsaW5lYXInO1xuXHRcdFx0Z3JhZC5hbmdsZSA9ICcxODAnO1xuXG5cdFx0XHR2YXIgcmVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoanNjLl92bWxOUyArICc6cmVjdCcpO1xuXHRcdFx0cmVjdC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRyZWN0LnN0eWxlLmxlZnQgPSAtMSArICdweCc7XG5cdFx0XHRyZWN0LnN0eWxlLnRvcCA9IC0xICsgJ3B4Jztcblx0XHRcdHJlY3Quc3Ryb2tlZCA9IGZhbHNlO1xuXHRcdFx0cmVjdC5hcHBlbmRDaGlsZChncmFkKTtcblx0XHRcdHZtbENvbnRhaW5lci5hcHBlbmRDaGlsZChyZWN0KTtcblxuXHRcdFx0dmFyIGRyYXdGdW5jID0gZnVuY3Rpb24gKHdpZHRoLCBoZWlnaHQsIGNvbG9yMSwgY29sb3IyKSB7XG5cdFx0XHRcdHZtbENvbnRhaW5lci5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4Jztcblx0XHRcdFx0dm1sQ29udGFpbmVyLnN0eWxlLmhlaWdodCA9IGhlaWdodCArICdweCc7XG5cblx0XHRcdFx0cmVjdC5zdHlsZS53aWR0aCA9ICh3aWR0aCArIDEpICsgJ3B4Jztcblx0XHRcdFx0cmVjdC5zdHlsZS5oZWlnaHQgPSAoaGVpZ2h0ICsgMSkgKyAncHgnO1xuXG5cdFx0XHRcdGdyYWQuY29sb3IgPSBjb2xvcjE7XG5cdFx0XHRcdGdyYWQuY29sb3IyID0gY29sb3IyO1xuXHRcdFx0fTtcblx0XHRcdFxuXHRcdFx0c2xpZGVyT2JqLmVsbSA9IHZtbENvbnRhaW5lcjtcblx0XHRcdHNsaWRlck9iai5kcmF3ID0gZHJhd0Z1bmM7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHNsaWRlck9iajtcblx0fSxcblxuXG5cdGxlYXZlVmFsdWUgOiAxPDwwLFxuXHRsZWF2ZVN0eWxlIDogMTw8MSxcblx0bGVhdmVQYWQgOiAxPDwyLFxuXHRsZWF2ZVNsZCA6IDE8PDMsXG5cblxuXHRCb3hTaGFkb3cgOiAoZnVuY3Rpb24gKCkge1xuXHRcdHZhciBCb3hTaGFkb3cgPSBmdW5jdGlvbiAoaFNoYWRvdywgdlNoYWRvdywgYmx1ciwgc3ByZWFkLCBjb2xvciwgaW5zZXQpIHtcblx0XHRcdHRoaXMuaFNoYWRvdyA9IGhTaGFkb3c7XG5cdFx0XHR0aGlzLnZTaGFkb3cgPSB2U2hhZG93O1xuXHRcdFx0dGhpcy5ibHVyID0gYmx1cjtcblx0XHRcdHRoaXMuc3ByZWFkID0gc3ByZWFkO1xuXHRcdFx0dGhpcy5jb2xvciA9IGNvbG9yO1xuXHRcdFx0dGhpcy5pbnNldCA9ICEhaW5zZXQ7XG5cdFx0fTtcblxuXHRcdEJveFNoYWRvdy5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgdmFscyA9IFtcblx0XHRcdFx0TWF0aC5yb3VuZCh0aGlzLmhTaGFkb3cpICsgJ3B4Jyxcblx0XHRcdFx0TWF0aC5yb3VuZCh0aGlzLnZTaGFkb3cpICsgJ3B4Jyxcblx0XHRcdFx0TWF0aC5yb3VuZCh0aGlzLmJsdXIpICsgJ3B4Jyxcblx0XHRcdFx0TWF0aC5yb3VuZCh0aGlzLnNwcmVhZCkgKyAncHgnLFxuXHRcdFx0XHR0aGlzLmNvbG9yXG5cdFx0XHRdO1xuXHRcdFx0aWYgKHRoaXMuaW5zZXQpIHtcblx0XHRcdFx0dmFscy5wdXNoKCdpbnNldCcpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHZhbHMuam9pbignICcpO1xuXHRcdH07XG5cblx0XHRyZXR1cm4gQm94U2hhZG93O1xuXHR9KSgpLFxuXG5cblx0Ly9cblx0Ly8gVXNhZ2U6XG5cdC8vIHZhciBteUNvbG9yID0gbmV3IGpzY29sb3IoPHRhcmdldEVsZW1lbnQ+IFssIDxvcHRpb25zPl0pXG5cdC8vXG5cblx0anNjb2xvciA6IGZ1bmN0aW9uICh0YXJnZXRFbGVtZW50LCBvcHRpb25zKSB7XG5cblx0XHQvLyBHZW5lcmFsIG9wdGlvbnNcblx0XHQvL1xuXHRcdHRoaXMudmFsdWUgPSBudWxsOyAvLyBpbml0aWFsIEhFWCBjb2xvci4gVG8gY2hhbmdlIGl0IGxhdGVyLCB1c2UgbWV0aG9kcyBmcm9tU3RyaW5nKCksIGZyb21IU1YoKSBhbmQgZnJvbVJHQigpXG5cdFx0dGhpcy52YWx1ZUVsZW1lbnQgPSB0YXJnZXRFbGVtZW50OyAvLyBlbGVtZW50IHRoYXQgd2lsbCBiZSB1c2VkIHRvIGRpc3BsYXkgYW5kIGlucHV0IHRoZSBjb2xvciBjb2RlXG5cdFx0dGhpcy5zdHlsZUVsZW1lbnQgPSB0YXJnZXRFbGVtZW50OyAvLyBlbGVtZW50IHRoYXQgd2lsbCBwcmV2aWV3IHRoZSBwaWNrZWQgY29sb3IgdXNpbmcgQ1NTIGJhY2tncm91bmRDb2xvclxuXHRcdHRoaXMucmVxdWlyZWQgPSB0cnVlOyAvLyB3aGV0aGVyIHRoZSBhc3NvY2lhdGVkIHRleHQgPGlucHV0PiBjYW4gYmUgbGVmdCBlbXB0eVxuXHRcdHRoaXMucmVmaW5lID0gdHJ1ZTsgLy8gd2hldGhlciB0byByZWZpbmUgdGhlIGVudGVyZWQgY29sb3IgY29kZSAoZS5nLiB1cHBlcmNhc2UgaXQgYW5kIHJlbW92ZSB3aGl0ZXNwYWNlKVxuXHRcdHRoaXMuaGFzaCA9IGZhbHNlOyAvLyB3aGV0aGVyIHRvIHByZWZpeCB0aGUgSEVYIGNvbG9yIGNvZGUgd2l0aCAjIHN5bWJvbFxuXHRcdHRoaXMudXBwZXJjYXNlID0gdHJ1ZTsgLy8gd2hldGhlciB0byB1cHBlcmNhc2UgdGhlIGNvbG9yIGNvZGVcblx0XHR0aGlzLm9uRmluZUNoYW5nZSA9IG51bGw7IC8vIGNhbGxlZCBpbnN0YW50bHkgZXZlcnkgdGltZSB0aGUgY29sb3IgY2hhbmdlcyAodmFsdWUgY2FuIGJlIGVpdGhlciBhIGZ1bmN0aW9uIG9yIGEgc3RyaW5nIHdpdGggamF2YXNjcmlwdCBjb2RlKVxuXHRcdHRoaXMuYWN0aXZlQ2xhc3MgPSAnanNjb2xvci1hY3RpdmUnOyAvLyBjbGFzcyB0byBiZSBzZXQgdG8gdGhlIHRhcmdldCBlbGVtZW50IHdoZW4gYSBwaWNrZXIgd2luZG93IGlzIG9wZW4gb24gaXRcblx0XHR0aGlzLm1pblMgPSAwOyAvLyBtaW4gYWxsb3dlZCBzYXR1cmF0aW9uICgwIC0gMTAwKVxuXHRcdHRoaXMubWF4UyA9IDEwMDsgLy8gbWF4IGFsbG93ZWQgc2F0dXJhdGlvbiAoMCAtIDEwMClcblx0XHR0aGlzLm1pblYgPSAwOyAvLyBtaW4gYWxsb3dlZCB2YWx1ZSAoYnJpZ2h0bmVzcykgKDAgLSAxMDApXG5cdFx0dGhpcy5tYXhWID0gMTAwOyAvLyBtYXggYWxsb3dlZCB2YWx1ZSAoYnJpZ2h0bmVzcykgKDAgLSAxMDApXG5cblx0XHQvLyBBY2Nlc3NpbmcgdGhlIHBpY2tlZCBjb2xvclxuXHRcdC8vXG5cdFx0dGhpcy5oc3YgPSBbMCwgMCwgMTAwXTsgLy8gcmVhZC1vbmx5ICBbMC0zNjAsIDAtMTAwLCAwLTEwMF1cblx0XHR0aGlzLnJnYiA9IFsyNTUsIDI1NSwgMjU1XTsgLy8gcmVhZC1vbmx5ICBbMC0yNTUsIDAtMjU1LCAwLTI1NV1cblxuXHRcdC8vIENvbG9yIFBpY2tlciBvcHRpb25zXG5cdFx0Ly9cblx0XHR0aGlzLndpZHRoID0gMTgxOyAvLyB3aWR0aCBvZiBjb2xvciBwYWxldHRlIChpbiBweClcblx0XHR0aGlzLmhlaWdodCA9IDEwMTsgLy8gaGVpZ2h0IG9mIGNvbG9yIHBhbGV0dGUgKGluIHB4KVxuXHRcdHRoaXMuc2hvd09uQ2xpY2sgPSB0cnVlOyAvLyB3aGV0aGVyIHRvIGRpc3BsYXkgdGhlIGNvbG9yIHBpY2tlciB3aGVuIHVzZXIgY2xpY2tzIG9uIGl0cyB0YXJnZXQgZWxlbWVudFxuXHRcdHRoaXMubW9kZSA9ICdIU1YnOyAvLyBIU1YgfCBIVlMgfCBIUyB8IEhWIC0gbGF5b3V0IG9mIHRoZSBjb2xvciBwaWNrZXIgY29udHJvbHNcblx0XHR0aGlzLnBvc2l0aW9uID0gJ2JvdHRvbSc7IC8vIGxlZnQgfCByaWdodCB8IHRvcCB8IGJvdHRvbSAtIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSB0YXJnZXQgZWxlbWVudFxuXHRcdHRoaXMuc21hcnRQb3NpdGlvbiA9IHRydWU7IC8vIGF1dG9tYXRpY2FsbHkgY2hhbmdlIHBpY2tlciBwb3NpdGlvbiB3aGVuIHRoZXJlIGlzIG5vdCBlbm91Z2ggc3BhY2UgZm9yIGl0XG5cdFx0dGhpcy5zbGlkZXJTaXplID0gMTY7IC8vIHB4XG5cdFx0dGhpcy5jcm9zc1NpemUgPSA4OyAvLyBweFxuXHRcdHRoaXMuY2xvc2FibGUgPSBmYWxzZTsgLy8gd2hldGhlciB0byBkaXNwbGF5IHRoZSBDbG9zZSBidXR0b25cblx0XHR0aGlzLmNsb3NlVGV4dCA9ICdDbG9zZSc7XG5cdFx0dGhpcy5idXR0b25Db2xvciA9ICcjMDAwMDAwJzsgLy8gQ1NTIGNvbG9yXG5cdFx0dGhpcy5idXR0b25IZWlnaHQgPSAxODsgLy8gcHhcblx0XHR0aGlzLnBhZGRpbmcgPSAxMjsgLy8gcHhcblx0XHR0aGlzLmJhY2tncm91bmRDb2xvciA9ICcjRkZGRkZGJzsgLy8gQ1NTIGNvbG9yXG5cdFx0dGhpcy5ib3JkZXJXaWR0aCA9IDE7IC8vIHB4XG5cdFx0dGhpcy5ib3JkZXJDb2xvciA9ICcjQkJCQkJCJzsgLy8gQ1NTIGNvbG9yXG5cdFx0dGhpcy5ib3JkZXJSYWRpdXMgPSA4OyAvLyBweFxuXHRcdHRoaXMuaW5zZXRXaWR0aCA9IDE7IC8vIHB4XG5cdFx0dGhpcy5pbnNldENvbG9yID0gJyNCQkJCQkInOyAvLyBDU1MgY29sb3Jcblx0XHR0aGlzLnNoYWRvdyA9IHRydWU7IC8vIHdoZXRoZXIgdG8gZGlzcGxheSBzaGFkb3dcblx0XHR0aGlzLnNoYWRvd0JsdXIgPSAxNTsgLy8gcHhcblx0XHR0aGlzLnNoYWRvd0NvbG9yID0gJ3JnYmEoMCwwLDAsMC4yKSc7IC8vIENTUyBjb2xvclxuXHRcdHRoaXMucG9pbnRlckNvbG9yID0gJyM0QzRDNEMnOyAvLyBweFxuXHRcdHRoaXMucG9pbnRlckJvcmRlckNvbG9yID0gJyNGRkZGRkYnOyAvLyBweFxuICAgICAgICB0aGlzLnBvaW50ZXJCb3JkZXJXaWR0aCA9IDE7IC8vIHB4XG4gICAgICAgIHRoaXMucG9pbnRlclRoaWNrbmVzcyA9IDI7IC8vIHB4XG5cdFx0dGhpcy56SW5kZXggPSAxMDAwO1xuXHRcdHRoaXMuY29udGFpbmVyID0gbnVsbDsgLy8gd2hlcmUgdG8gYXBwZW5kIHRoZSBjb2xvciBwaWNrZXIgKEJPRFkgZWxlbWVudCBieSBkZWZhdWx0KVxuXG5cblx0XHRmb3IgKHZhciBvcHQgaW4gb3B0aW9ucykge1xuXHRcdFx0aWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkob3B0KSkge1xuXHRcdFx0XHR0aGlzW29wdF0gPSBvcHRpb25zW29wdF07XG5cdFx0XHR9XG5cdFx0fVxuXG5cblx0XHR0aGlzLmhpZGUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoaXNQaWNrZXJPd25lcigpKSB7XG5cdFx0XHRcdGRldGFjaFBpY2tlcigpO1xuXHRcdFx0fVxuXHRcdH07XG5cblxuXHRcdHRoaXMuc2hvdyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGRyYXdQaWNrZXIoKTtcblx0XHR9O1xuXG5cblx0XHR0aGlzLnJlZHJhdyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChpc1BpY2tlck93bmVyKCkpIHtcblx0XHRcdFx0ZHJhd1BpY2tlcigpO1xuXHRcdFx0fVxuXHRcdH07XG5cblxuXHRcdHRoaXMuaW1wb3J0Q29sb3IgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoIXRoaXMudmFsdWVFbGVtZW50KSB7XG5cdFx0XHRcdHRoaXMuZXhwb3J0Q29sb3IoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmIChqc2MuaXNFbGVtZW50VHlwZSh0aGlzLnZhbHVlRWxlbWVudCwgJ2lucHV0JykpIHtcblx0XHRcdFx0XHRpZiAoIXRoaXMucmVmaW5lKSB7XG5cdFx0XHRcdFx0XHRpZiAoIXRoaXMuZnJvbVN0cmluZyh0aGlzLnZhbHVlRWxlbWVudC52YWx1ZSwganNjLmxlYXZlVmFsdWUpKSB7XG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLnN0eWxlRWxlbWVudCkge1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IHRoaXMuc3R5bGVFbGVtZW50Ll9qc2NPcmlnU3R5bGUuYmFja2dyb3VuZEltYWdlO1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHRoaXMuc3R5bGVFbGVtZW50Ll9qc2NPcmlnU3R5bGUuYmFja2dyb3VuZENvbG9yO1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmNvbG9yID0gdGhpcy5zdHlsZUVsZW1lbnQuX2pzY09yaWdTdHlsZS5jb2xvcjtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR0aGlzLmV4cG9ydENvbG9yKGpzYy5sZWF2ZVZhbHVlIHwganNjLmxlYXZlU3R5bGUpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gZWxzZSBpZiAoIXRoaXMucmVxdWlyZWQgJiYgL15cXHMqJC8udGVzdCh0aGlzLnZhbHVlRWxlbWVudC52YWx1ZSkpIHtcblx0XHRcdFx0XHRcdHRoaXMudmFsdWVFbGVtZW50LnZhbHVlID0gJyc7XG5cdFx0XHRcdFx0XHRpZiAodGhpcy5zdHlsZUVsZW1lbnQpIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gdGhpcy5zdHlsZUVsZW1lbnQuX2pzY09yaWdTdHlsZS5iYWNrZ3JvdW5kSW1hZ2U7XG5cdFx0XHRcdFx0XHRcdHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHRoaXMuc3R5bGVFbGVtZW50Ll9qc2NPcmlnU3R5bGUuYmFja2dyb3VuZENvbG9yO1xuXHRcdFx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5jb2xvciA9IHRoaXMuc3R5bGVFbGVtZW50Ll9qc2NPcmlnU3R5bGUuY29sb3I7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR0aGlzLmV4cG9ydENvbG9yKGpzYy5sZWF2ZVZhbHVlIHwganNjLmxlYXZlU3R5bGUpO1xuXG5cdFx0XHRcdFx0fSBlbHNlIGlmICh0aGlzLmZyb21TdHJpbmcodGhpcy52YWx1ZUVsZW1lbnQudmFsdWUpKSB7XG5cdFx0XHRcdFx0XHQvLyBtYW5hZ2VkIHRvIGltcG9ydCBjb2xvciBzdWNjZXNzZnVsbHkgZnJvbSB0aGUgdmFsdWUgLT4gT0ssIGRvbid0IGRvIGFueXRoaW5nXG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHRoaXMuZXhwb3J0Q29sb3IoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gbm90IGFuIGlucHV0IGVsZW1lbnQgLT4gZG9lc24ndCBoYXZlIGFueSB2YWx1ZVxuXHRcdFx0XHRcdHRoaXMuZXhwb3J0Q29sb3IoKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cblxuXHRcdHRoaXMuZXhwb3J0Q29sb3IgPSBmdW5jdGlvbiAoZmxhZ3MpIHtcblx0XHRcdGlmICghKGZsYWdzICYganNjLmxlYXZlVmFsdWUpICYmIHRoaXMudmFsdWVFbGVtZW50KSB7XG5cdFx0XHRcdHZhciB2YWx1ZSA9IHRoaXMudG9TdHJpbmcoKTtcblx0XHRcdFx0aWYgKHRoaXMudXBwZXJjYXNlKSB7IHZhbHVlID0gdmFsdWUudG9VcHBlckNhc2UoKTsgfVxuXHRcdFx0XHRpZiAodGhpcy5oYXNoKSB7IHZhbHVlID0gJyMnICsgdmFsdWU7IH1cblxuXHRcdFx0XHRpZiAoanNjLmlzRWxlbWVudFR5cGUodGhpcy52YWx1ZUVsZW1lbnQsICdpbnB1dCcpKSB7XG5cdFx0XHRcdFx0dGhpcy52YWx1ZUVsZW1lbnQudmFsdWUgPSB2YWx1ZTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLnZhbHVlRWxlbWVudC5pbm5lckhUTUwgPSB2YWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKCEoZmxhZ3MgJiBqc2MubGVhdmVTdHlsZSkpIHtcblx0XHRcdFx0aWYgKHRoaXMuc3R5bGVFbGVtZW50KSB7XG5cdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gJ25vbmUnO1xuXHRcdFx0XHRcdHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcjJyArIHRoaXMudG9TdHJpbmcoKTtcblx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5jb2xvciA9IHRoaXMuaXNMaWdodCgpID8gJyMwMDAnIDogJyNGRkYnO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZiAoIShmbGFncyAmIGpzYy5sZWF2ZVBhZCkgJiYgaXNQaWNrZXJPd25lcigpKSB7XG5cdFx0XHRcdHJlZHJhd1BhZCgpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCEoZmxhZ3MgJiBqc2MubGVhdmVTbGQpICYmIGlzUGlja2VyT3duZXIoKSkge1xuXHRcdFx0XHRyZWRyYXdTbGQoKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cblx0XHQvLyBoOiAwLTM2MFxuXHRcdC8vIHM6IDAtMTAwXG5cdFx0Ly8gdjogMC0xMDBcblx0XHQvL1xuXHRcdHRoaXMuZnJvbUhTViA9IGZ1bmN0aW9uIChoLCBzLCB2LCBmbGFncykgeyAvLyBudWxsID0gZG9uJ3QgY2hhbmdlXG5cdFx0XHRpZiAoaCAhPT0gbnVsbCkge1xuXHRcdFx0XHRpZiAoaXNOYU4oaCkpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRcdGggPSBNYXRoLm1heCgwLCBNYXRoLm1pbigzNjAsIGgpKTtcblx0XHRcdH1cblx0XHRcdGlmIChzICE9PSBudWxsKSB7XG5cdFx0XHRcdGlmIChpc05hTihzKSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdFx0cyA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEwMCwgdGhpcy5tYXhTLCBzKSwgdGhpcy5taW5TKTtcblx0XHRcdH1cblx0XHRcdGlmICh2ICE9PSBudWxsKSB7XG5cdFx0XHRcdGlmIChpc05hTih2KSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdFx0diA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEwMCwgdGhpcy5tYXhWLCB2KSwgdGhpcy5taW5WKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5yZ2IgPSBIU1ZfUkdCKFxuXHRcdFx0XHRoPT09bnVsbCA/IHRoaXMuaHN2WzBdIDogKHRoaXMuaHN2WzBdPWgpLFxuXHRcdFx0XHRzPT09bnVsbCA/IHRoaXMuaHN2WzFdIDogKHRoaXMuaHN2WzFdPXMpLFxuXHRcdFx0XHR2PT09bnVsbCA/IHRoaXMuaHN2WzJdIDogKHRoaXMuaHN2WzJdPXYpXG5cdFx0XHQpO1xuXG5cdFx0XHR0aGlzLmV4cG9ydENvbG9yKGZsYWdzKTtcblx0XHR9O1xuXG5cblx0XHQvLyByOiAwLTI1NVxuXHRcdC8vIGc6IDAtMjU1XG5cdFx0Ly8gYjogMC0yNTVcblx0XHQvL1xuXHRcdHRoaXMuZnJvbVJHQiA9IGZ1bmN0aW9uIChyLCBnLCBiLCBmbGFncykgeyAvLyBudWxsID0gZG9uJ3QgY2hhbmdlXG5cdFx0XHRpZiAociAhPT0gbnVsbCkge1xuXHRcdFx0XHRpZiAoaXNOYU4ocikpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRcdHIgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigyNTUsIHIpKTtcblx0XHRcdH1cblx0XHRcdGlmIChnICE9PSBudWxsKSB7XG5cdFx0XHRcdGlmIChpc05hTihnKSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdFx0ZyA9IE1hdGgubWF4KDAsIE1hdGgubWluKDI1NSwgZykpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGIgIT09IG51bGwpIHtcblx0XHRcdFx0aWYgKGlzTmFOKGIpKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0XHRiID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMjU1LCBiKSk7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBoc3YgPSBSR0JfSFNWKFxuXHRcdFx0XHRyPT09bnVsbCA/IHRoaXMucmdiWzBdIDogcixcblx0XHRcdFx0Zz09PW51bGwgPyB0aGlzLnJnYlsxXSA6IGcsXG5cdFx0XHRcdGI9PT1udWxsID8gdGhpcy5yZ2JbMl0gOiBiXG5cdFx0XHQpO1xuXHRcdFx0aWYgKGhzdlswXSAhPT0gbnVsbCkge1xuXHRcdFx0XHR0aGlzLmhzdlswXSA9IE1hdGgubWF4KDAsIE1hdGgubWluKDM2MCwgaHN2WzBdKSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoaHN2WzJdICE9PSAwKSB7XG5cdFx0XHRcdHRoaXMuaHN2WzFdID0gaHN2WzFdPT09bnVsbCA/IG51bGwgOiBNYXRoLm1heCgwLCB0aGlzLm1pblMsIE1hdGgubWluKDEwMCwgdGhpcy5tYXhTLCBoc3ZbMV0pKTtcblx0XHRcdH1cblx0XHRcdHRoaXMuaHN2WzJdID0gaHN2WzJdPT09bnVsbCA/IG51bGwgOiBNYXRoLm1heCgwLCB0aGlzLm1pblYsIE1hdGgubWluKDEwMCwgdGhpcy5tYXhWLCBoc3ZbMl0pKTtcblxuXHRcdFx0Ly8gdXBkYXRlIFJHQiBhY2NvcmRpbmcgdG8gZmluYWwgSFNWLCBhcyBzb21lIHZhbHVlcyBtaWdodCBiZSB0cmltbWVkXG5cdFx0XHR2YXIgcmdiID0gSFNWX1JHQih0aGlzLmhzdlswXSwgdGhpcy5oc3ZbMV0sIHRoaXMuaHN2WzJdKTtcblx0XHRcdHRoaXMucmdiWzBdID0gcmdiWzBdO1xuXHRcdFx0dGhpcy5yZ2JbMV0gPSByZ2JbMV07XG5cdFx0XHR0aGlzLnJnYlsyXSA9IHJnYlsyXTtcblxuXHRcdFx0dGhpcy5leHBvcnRDb2xvcihmbGFncyk7XG5cdFx0fTtcblxuXG5cdFx0dGhpcy5mcm9tU3RyaW5nID0gZnVuY3Rpb24gKHN0ciwgZmxhZ3MpIHtcblx0XHRcdHZhciBtO1xuXHRcdFx0aWYgKG0gPSBzdHIubWF0Y2goL15cXFcqKFswLTlBLUZdezN9KFswLTlBLUZdezN9KT8pXFxXKiQvaSkpIHtcblx0XHRcdFx0Ly8gSEVYIG5vdGF0aW9uXG5cdFx0XHRcdC8vXG5cblx0XHRcdFx0aWYgKG1bMV0ubGVuZ3RoID09PSA2KSB7XG5cdFx0XHRcdFx0Ly8gNi1jaGFyIG5vdGF0aW9uXG5cdFx0XHRcdFx0dGhpcy5mcm9tUkdCKFxuXHRcdFx0XHRcdFx0cGFyc2VJbnQobVsxXS5zdWJzdHIoMCwyKSwxNiksXG5cdFx0XHRcdFx0XHRwYXJzZUludChtWzFdLnN1YnN0cigyLDIpLDE2KSxcblx0XHRcdFx0XHRcdHBhcnNlSW50KG1bMV0uc3Vic3RyKDQsMiksMTYpLFxuXHRcdFx0XHRcdFx0ZmxhZ3Ncblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIDMtY2hhciBub3RhdGlvblxuXHRcdFx0XHRcdHRoaXMuZnJvbVJHQihcblx0XHRcdFx0XHRcdHBhcnNlSW50KG1bMV0uY2hhckF0KDApICsgbVsxXS5jaGFyQXQoMCksMTYpLFxuXHRcdFx0XHRcdFx0cGFyc2VJbnQobVsxXS5jaGFyQXQoMSkgKyBtWzFdLmNoYXJBdCgxKSwxNiksXG5cdFx0XHRcdFx0XHRwYXJzZUludChtWzFdLmNoYXJBdCgyKSArIG1bMV0uY2hhckF0KDIpLDE2KSxcblx0XHRcdFx0XHRcdGZsYWdzXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblxuXHRcdFx0fSBlbHNlIGlmIChtID0gc3RyLm1hdGNoKC9eXFxXKnJnYmE/XFwoKFteKV0qKVxcKVxcVyokL2kpKSB7XG5cdFx0XHRcdHZhciBwYXJhbXMgPSBtWzFdLnNwbGl0KCcsJyk7XG5cdFx0XHRcdHZhciByZSA9IC9eXFxzKihcXGQqKShcXC5cXGQrKT9cXHMqJC87XG5cdFx0XHRcdHZhciBtUiwgbUcsIG1CO1xuXHRcdFx0XHRpZiAoXG5cdFx0XHRcdFx0cGFyYW1zLmxlbmd0aCA+PSAzICYmXG5cdFx0XHRcdFx0KG1SID0gcGFyYW1zWzBdLm1hdGNoKHJlKSkgJiZcblx0XHRcdFx0XHQobUcgPSBwYXJhbXNbMV0ubWF0Y2gocmUpKSAmJlxuXHRcdFx0XHRcdChtQiA9IHBhcmFtc1syXS5tYXRjaChyZSkpXG5cdFx0XHRcdCkge1xuXHRcdFx0XHRcdHZhciByID0gcGFyc2VGbG9hdCgobVJbMV0gfHwgJzAnKSArIChtUlsyXSB8fCAnJykpO1xuXHRcdFx0XHRcdHZhciBnID0gcGFyc2VGbG9hdCgobUdbMV0gfHwgJzAnKSArIChtR1syXSB8fCAnJykpO1xuXHRcdFx0XHRcdHZhciBiID0gcGFyc2VGbG9hdCgobUJbMV0gfHwgJzAnKSArIChtQlsyXSB8fCAnJykpO1xuXHRcdFx0XHRcdHRoaXMuZnJvbVJHQihyLCBnLCBiLCBmbGFncyk7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9O1xuXG5cblx0XHR0aGlzLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0KDB4MTAwIHwgTWF0aC5yb3VuZCh0aGlzLnJnYlswXSkpLnRvU3RyaW5nKDE2KS5zdWJzdHIoMSkgK1xuXHRcdFx0XHQoMHgxMDAgfCBNYXRoLnJvdW5kKHRoaXMucmdiWzFdKSkudG9TdHJpbmcoMTYpLnN1YnN0cigxKSArXG5cdFx0XHRcdCgweDEwMCB8IE1hdGgucm91bmQodGhpcy5yZ2JbMl0pKS50b1N0cmluZygxNikuc3Vic3RyKDEpXG5cdFx0XHQpO1xuXHRcdH07XG5cblxuXHRcdHRoaXMudG9IRVhTdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gJyMnICsgdGhpcy50b1N0cmluZygpLnRvVXBwZXJDYXNlKCk7XG5cdFx0fTtcblxuXG5cdFx0dGhpcy50b1JHQlN0cmluZyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiAoJ3JnYignICtcblx0XHRcdFx0TWF0aC5yb3VuZCh0aGlzLnJnYlswXSkgKyAnLCcgK1xuXHRcdFx0XHRNYXRoLnJvdW5kKHRoaXMucmdiWzFdKSArICcsJyArXG5cdFx0XHRcdE1hdGgucm91bmQodGhpcy5yZ2JbMl0pICsgJyknXG5cdFx0XHQpO1xuXHRcdH07XG5cblxuXHRcdHRoaXMuaXNMaWdodCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiAoXG5cdFx0XHRcdDAuMjEzICogdGhpcy5yZ2JbMF0gK1xuXHRcdFx0XHQwLjcxNSAqIHRoaXMucmdiWzFdICtcblx0XHRcdFx0MC4wNzIgKiB0aGlzLnJnYlsyXSA+XG5cdFx0XHRcdDI1NSAvIDJcblx0XHRcdCk7XG5cdFx0fTtcblxuXG5cdFx0dGhpcy5fcHJvY2Vzc1BhcmVudEVsZW1lbnRzSW5ET00gPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAodGhpcy5fbGlua2VkRWxlbWVudHNQcm9jZXNzZWQpIHsgcmV0dXJuOyB9XG5cdFx0XHR0aGlzLl9saW5rZWRFbGVtZW50c1Byb2Nlc3NlZCA9IHRydWU7XG5cblx0XHRcdHZhciBlbG0gPSB0aGlzLnRhcmdldEVsZW1lbnQ7XG5cdFx0XHRkbyB7XG5cdFx0XHRcdC8vIElmIHRoZSB0YXJnZXQgZWxlbWVudCBvciBvbmUgb2YgaXRzIHBhcmVudCBub2RlcyBoYXMgZml4ZWQgcG9zaXRpb24sXG5cdFx0XHRcdC8vIHRoZW4gdXNlIGZpeGVkIHBvc2l0aW9uaW5nIGluc3RlYWRcblx0XHRcdFx0Ly9cblx0XHRcdFx0Ly8gTm90ZTogSW4gRmlyZWZveCwgZ2V0Q29tcHV0ZWRTdHlsZSByZXR1cm5zIG51bGwgaW4gYSBoaWRkZW4gaWZyYW1lLFxuXHRcdFx0XHQvLyB0aGF0J3Mgd2h5IHdlIG5lZWQgdG8gY2hlY2sgaWYgdGhlIHJldHVybmVkIHN0eWxlIG9iamVjdCBpcyBub24tZW1wdHlcblx0XHRcdFx0dmFyIGN1cnJTdHlsZSA9IGpzYy5nZXRTdHlsZShlbG0pO1xuXHRcdFx0XHRpZiAoY3VyclN0eWxlICYmIGN1cnJTdHlsZS5wb3NpdGlvbi50b0xvd2VyQ2FzZSgpID09PSAnZml4ZWQnKSB7XG5cdFx0XHRcdFx0dGhpcy5maXhlZCA9IHRydWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoZWxtICE9PSB0aGlzLnRhcmdldEVsZW1lbnQpIHtcblx0XHRcdFx0XHQvLyBFbnN1cmUgdG8gYXR0YWNoIG9uUGFyZW50U2Nyb2xsIG9ubHkgb25jZSB0byBlYWNoIHBhcmVudCBlbGVtZW50XG5cdFx0XHRcdFx0Ly8gKG11bHRpcGxlIHRhcmdldEVsZW1lbnRzIGNhbiBzaGFyZSB0aGUgc2FtZSBwYXJlbnQgbm9kZXMpXG5cdFx0XHRcdFx0Ly9cblx0XHRcdFx0XHQvLyBOb3RlOiBJdCdzIG5vdCBqdXN0IG9mZnNldFBhcmVudHMgdGhhdCBjYW4gYmUgc2Nyb2xsYWJsZSxcblx0XHRcdFx0XHQvLyB0aGF0J3Mgd2h5IHdlIGxvb3AgdGhyb3VnaCBhbGwgcGFyZW50IG5vZGVzXG5cdFx0XHRcdFx0aWYgKCFlbG0uX2pzY0V2ZW50c0F0dGFjaGVkKSB7XG5cdFx0XHRcdFx0XHRqc2MuYXR0YWNoRXZlbnQoZWxtLCAnc2Nyb2xsJywganNjLm9uUGFyZW50U2Nyb2xsKTtcblx0XHRcdFx0XHRcdGVsbS5fanNjRXZlbnRzQXR0YWNoZWQgPSB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSB3aGlsZSAoKGVsbSA9IGVsbS5wYXJlbnROb2RlKSAmJiAhanNjLmlzRWxlbWVudFR5cGUoZWxtLCAnYm9keScpKTtcblx0XHR9O1xuXG5cblx0XHQvLyByOiAwLTI1NVxuXHRcdC8vIGc6IDAtMjU1XG5cdFx0Ly8gYjogMC0yNTVcblx0XHQvL1xuXHRcdC8vIHJldHVybnM6IFsgMC0zNjAsIDAtMTAwLCAwLTEwMCBdXG5cdFx0Ly9cblx0XHRmdW5jdGlvbiBSR0JfSFNWIChyLCBnLCBiKSB7XG5cdFx0XHRyIC89IDI1NTtcblx0XHRcdGcgLz0gMjU1O1xuXHRcdFx0YiAvPSAyNTU7XG5cdFx0XHR2YXIgbiA9IE1hdGgubWluKE1hdGgubWluKHIsZyksYik7XG5cdFx0XHR2YXIgdiA9IE1hdGgubWF4KE1hdGgubWF4KHIsZyksYik7XG5cdFx0XHR2YXIgbSA9IHYgLSBuO1xuXHRcdFx0aWYgKG0gPT09IDApIHsgcmV0dXJuIFsgbnVsbCwgMCwgMTAwICogdiBdOyB9XG5cdFx0XHR2YXIgaCA9IHI9PT1uID8gMysoYi1nKS9tIDogKGc9PT1uID8gNSsoci1iKS9tIDogMSsoZy1yKS9tKTtcblx0XHRcdHJldHVybiBbXG5cdFx0XHRcdDYwICogKGg9PT02PzA6aCksXG5cdFx0XHRcdDEwMCAqIChtL3YpLFxuXHRcdFx0XHQxMDAgKiB2XG5cdFx0XHRdO1xuXHRcdH1cblxuXG5cdFx0Ly8gaDogMC0zNjBcblx0XHQvLyBzOiAwLTEwMFxuXHRcdC8vIHY6IDAtMTAwXG5cdFx0Ly9cblx0XHQvLyByZXR1cm5zOiBbIDAtMjU1LCAwLTI1NSwgMC0yNTUgXVxuXHRcdC8vXG5cdFx0ZnVuY3Rpb24gSFNWX1JHQiAoaCwgcywgdikge1xuXHRcdFx0dmFyIHUgPSAyNTUgKiAodiAvIDEwMCk7XG5cblx0XHRcdGlmIChoID09PSBudWxsKSB7XG5cdFx0XHRcdHJldHVybiBbIHUsIHUsIHUgXTtcblx0XHRcdH1cblxuXHRcdFx0aCAvPSA2MDtcblx0XHRcdHMgLz0gMTAwO1xuXG5cdFx0XHR2YXIgaSA9IE1hdGguZmxvb3IoaCk7XG5cdFx0XHR2YXIgZiA9IGklMiA/IGgtaSA6IDEtKGgtaSk7XG5cdFx0XHR2YXIgbSA9IHUgKiAoMSAtIHMpO1xuXHRcdFx0dmFyIG4gPSB1ICogKDEgLSBzICogZik7XG5cdFx0XHRzd2l0Y2ggKGkpIHtcblx0XHRcdFx0Y2FzZSA2OlxuXHRcdFx0XHRjYXNlIDA6IHJldHVybiBbdSxuLG1dO1xuXHRcdFx0XHRjYXNlIDE6IHJldHVybiBbbix1LG1dO1xuXHRcdFx0XHRjYXNlIDI6IHJldHVybiBbbSx1LG5dO1xuXHRcdFx0XHRjYXNlIDM6IHJldHVybiBbbSxuLHVdO1xuXHRcdFx0XHRjYXNlIDQ6IHJldHVybiBbbixtLHVdO1xuXHRcdFx0XHRjYXNlIDU6IHJldHVybiBbdSxtLG5dO1xuXHRcdFx0fVxuXHRcdH1cblxuXG5cdFx0ZnVuY3Rpb24gZGV0YWNoUGlja2VyICgpIHtcblx0XHRcdGpzYy51bnNldENsYXNzKFRISVMudGFyZ2V0RWxlbWVudCwgVEhJUy5hY3RpdmVDbGFzcyk7XG5cdFx0XHRqc2MucGlja2VyLndyYXAucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChqc2MucGlja2VyLndyYXApO1xuXHRcdFx0ZGVsZXRlIGpzYy5waWNrZXIub3duZXI7XG5cdFx0fVxuXG5cblx0XHRmdW5jdGlvbiBkcmF3UGlja2VyICgpIHtcblxuXHRcdFx0Ly8gQXQgdGhpcyBwb2ludCwgd2hlbiBkcmF3aW5nIHRoZSBwaWNrZXIsIHdlIGtub3cgd2hhdCB0aGUgcGFyZW50IGVsZW1lbnRzIGFyZVxuXHRcdFx0Ly8gYW5kIHdlIGNhbiBkbyBhbGwgcmVsYXRlZCBET00gb3BlcmF0aW9ucywgc3VjaCBhcyByZWdpc3RlcmluZyBldmVudHMgb24gdGhlbVxuXHRcdFx0Ly8gb3IgY2hlY2tpbmcgdGhlaXIgcG9zaXRpb25pbmdcblx0XHRcdFRISVMuX3Byb2Nlc3NQYXJlbnRFbGVtZW50c0luRE9NKCk7XG5cblx0XHRcdGlmICghanNjLnBpY2tlcikge1xuXHRcdFx0XHRqc2MucGlja2VyID0ge1xuXHRcdFx0XHRcdG93bmVyOiBudWxsLFxuXHRcdFx0XHRcdHdyYXAgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcblx0XHRcdFx0XHRib3ggOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcblx0XHRcdFx0XHRib3hTIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIHNoYWRvdyBhcmVhXG5cdFx0XHRcdFx0Ym94QiA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBib3JkZXJcblx0XHRcdFx0XHRwYWQgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcblx0XHRcdFx0XHRwYWRCIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIGJvcmRlclxuXHRcdFx0XHRcdHBhZE0gOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gbW91c2UvdG91Y2ggYXJlYVxuXHRcdFx0XHRcdHBhZFBhbCA6IGpzYy5jcmVhdGVQYWxldHRlKCksXG5cdFx0XHRcdFx0Y3Jvc3MgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcblx0XHRcdFx0XHRjcm9zc0JZIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIGJvcmRlciBZXG5cdFx0XHRcdFx0Y3Jvc3NCWCA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBib3JkZXIgWFxuXHRcdFx0XHRcdGNyb3NzTFkgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gbGluZSBZXG5cdFx0XHRcdFx0Y3Jvc3NMWCA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBsaW5lIFhcblx0XHRcdFx0XHRzbGQgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcblx0XHRcdFx0XHRzbGRCIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIGJvcmRlclxuXHRcdFx0XHRcdHNsZE0gOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gbW91c2UvdG91Y2ggYXJlYVxuXHRcdFx0XHRcdHNsZEdyYWQgOiBqc2MuY3JlYXRlU2xpZGVyR3JhZGllbnQoKSxcblx0XHRcdFx0XHRzbGRQdHJTIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIHNsaWRlciBwb2ludGVyIHNwYWNlclxuXHRcdFx0XHRcdHNsZFB0cklCIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIHNsaWRlciBwb2ludGVyIGlubmVyIGJvcmRlclxuXHRcdFx0XHRcdHNsZFB0ck1CIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIHNsaWRlciBwb2ludGVyIG1pZGRsZSBib3JkZXJcblx0XHRcdFx0XHRzbGRQdHJPQiA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBzbGlkZXIgcG9pbnRlciBvdXRlciBib3JkZXJcblx0XHRcdFx0XHRidG4gOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcblx0XHRcdFx0XHRidG5UIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpIC8vIHRleHRcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRqc2MucGlja2VyLnBhZC5hcHBlbmRDaGlsZChqc2MucGlja2VyLnBhZFBhbC5lbG0pO1xuXHRcdFx0XHRqc2MucGlja2VyLnBhZEIuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5wYWQpO1xuXHRcdFx0XHRqc2MucGlja2VyLmNyb3NzLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuY3Jvc3NCWSk7XG5cdFx0XHRcdGpzYy5waWNrZXIuY3Jvc3MuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5jcm9zc0JYKTtcblx0XHRcdFx0anNjLnBpY2tlci5jcm9zcy5hcHBlbmRDaGlsZChqc2MucGlja2VyLmNyb3NzTFkpO1xuXHRcdFx0XHRqc2MucGlja2VyLmNyb3NzLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuY3Jvc3NMWCk7XG5cdFx0XHRcdGpzYy5waWNrZXIucGFkQi5hcHBlbmRDaGlsZChqc2MucGlja2VyLmNyb3NzKTtcblx0XHRcdFx0anNjLnBpY2tlci5ib3guYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5wYWRCKTtcblx0XHRcdFx0anNjLnBpY2tlci5ib3guYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5wYWRNKTtcblxuXHRcdFx0XHRqc2MucGlja2VyLnNsZC5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZEdyYWQuZWxtKTtcblx0XHRcdFx0anNjLnBpY2tlci5zbGRCLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuc2xkKTtcblx0XHRcdFx0anNjLnBpY2tlci5zbGRCLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuc2xkUHRyT0IpO1xuXHRcdFx0XHRqc2MucGlja2VyLnNsZFB0ck9CLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuc2xkUHRyTUIpO1xuXHRcdFx0XHRqc2MucGlja2VyLnNsZFB0ck1CLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuc2xkUHRySUIpO1xuXHRcdFx0XHRqc2MucGlja2VyLnNsZFB0cklCLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuc2xkUHRyUyk7XG5cdFx0XHRcdGpzYy5waWNrZXIuYm94LmFwcGVuZENoaWxkKGpzYy5waWNrZXIuc2xkQik7XG5cdFx0XHRcdGpzYy5waWNrZXIuYm94LmFwcGVuZENoaWxkKGpzYy5waWNrZXIuc2xkTSk7XG5cblx0XHRcdFx0anNjLnBpY2tlci5idG4uYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5idG5UKTtcblx0XHRcdFx0anNjLnBpY2tlci5ib3guYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5idG4pO1xuXG5cdFx0XHRcdGpzYy5waWNrZXIuYm94Qi5hcHBlbmRDaGlsZChqc2MucGlja2VyLmJveCk7XG5cdFx0XHRcdGpzYy5waWNrZXIud3JhcC5hcHBlbmRDaGlsZChqc2MucGlja2VyLmJveFMpO1xuXHRcdFx0XHRqc2MucGlja2VyLndyYXAuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5ib3hCKTtcblx0XHRcdH1cblxuXHRcdFx0dmFyIHAgPSBqc2MucGlja2VyO1xuXG5cdFx0XHR2YXIgZGlzcGxheVNsaWRlciA9ICEhanNjLmdldFNsaWRlckNvbXBvbmVudChUSElTKTtcblx0XHRcdHZhciBkaW1zID0ganNjLmdldFBpY2tlckRpbXMoVEhJUyk7XG5cdFx0XHR2YXIgY3Jvc3NPdXRlclNpemUgPSAoMiAqIFRISVMucG9pbnRlckJvcmRlcldpZHRoICsgVEhJUy5wb2ludGVyVGhpY2tuZXNzICsgMiAqIFRISVMuY3Jvc3NTaXplKTtcblx0XHRcdHZhciBwYWRUb1NsaWRlclBhZGRpbmcgPSBqc2MuZ2V0UGFkVG9TbGlkZXJQYWRkaW5nKFRISVMpO1xuXHRcdFx0dmFyIGJvcmRlclJhZGl1cyA9IE1hdGgubWluKFxuXHRcdFx0XHRUSElTLmJvcmRlclJhZGl1cyxcblx0XHRcdFx0TWF0aC5yb3VuZChUSElTLnBhZGRpbmcgKiBNYXRoLlBJKSk7IC8vIHB4XG5cdFx0XHR2YXIgcGFkQ3Vyc29yID0gJ2Nyb3NzaGFpcic7XG5cblx0XHRcdC8vIHdyYXBcblx0XHRcdHAud3JhcC5zdHlsZS5jbGVhciA9ICdib3RoJztcblx0XHRcdHAud3JhcC5zdHlsZS53aWR0aCA9IChkaW1zWzBdICsgMiAqIFRISVMuYm9yZGVyV2lkdGgpICsgJ3B4Jztcblx0XHRcdHAud3JhcC5zdHlsZS5oZWlnaHQgPSAoZGltc1sxXSArIDIgKiBUSElTLmJvcmRlcldpZHRoKSArICdweCc7XG5cdFx0XHRwLndyYXAuc3R5bGUuekluZGV4ID0gVEhJUy56SW5kZXg7XG5cblx0XHRcdC8vIHBpY2tlclxuXHRcdFx0cC5ib3guc3R5bGUud2lkdGggPSBkaW1zWzBdICsgJ3B4Jztcblx0XHRcdHAuYm94LnN0eWxlLmhlaWdodCA9IGRpbXNbMV0gKyAncHgnO1xuXG5cdFx0XHRwLmJveFMuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cC5ib3hTLnN0eWxlLmxlZnQgPSAnMCc7XG5cdFx0XHRwLmJveFMuc3R5bGUudG9wID0gJzAnO1xuXHRcdFx0cC5ib3hTLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuXHRcdFx0cC5ib3hTLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcblx0XHRcdGpzYy5zZXRCb3JkZXJSYWRpdXMocC5ib3hTLCBib3JkZXJSYWRpdXMgKyAncHgnKTtcblxuXHRcdFx0Ly8gcGlja2VyIGJvcmRlclxuXHRcdFx0cC5ib3hCLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcblx0XHRcdHAuYm94Qi5zdHlsZS5ib3JkZXIgPSBUSElTLmJvcmRlcldpZHRoICsgJ3B4IHNvbGlkJztcblx0XHRcdHAuYm94Qi5zdHlsZS5ib3JkZXJDb2xvciA9IFRISVMuYm9yZGVyQ29sb3I7XG5cdFx0XHRwLmJveEIuc3R5bGUuYmFja2dyb3VuZCA9IFRISVMuYmFja2dyb3VuZENvbG9yO1xuXHRcdFx0anNjLnNldEJvcmRlclJhZGl1cyhwLmJveEIsIGJvcmRlclJhZGl1cyArICdweCcpO1xuXG5cdFx0XHQvLyBJRSBoYWNrOlxuXHRcdFx0Ly8gSWYgdGhlIGVsZW1lbnQgaXMgdHJhbnNwYXJlbnQsIElFIHdpbGwgdHJpZ2dlciB0aGUgZXZlbnQgb24gdGhlIGVsZW1lbnRzIHVuZGVyIGl0LFxuXHRcdFx0Ly8gZS5nLiBvbiBDYW52YXMgb3Igb24gZWxlbWVudHMgd2l0aCBib3JkZXJcblx0XHRcdHAucGFkTS5zdHlsZS5iYWNrZ3JvdW5kID1cblx0XHRcdHAuc2xkTS5zdHlsZS5iYWNrZ3JvdW5kID1cblx0XHRcdFx0JyNGRkYnO1xuXHRcdFx0anNjLnNldFN0eWxlKHAucGFkTSwgJ29wYWNpdHknLCAnMCcpO1xuXHRcdFx0anNjLnNldFN0eWxlKHAuc2xkTSwgJ29wYWNpdHknLCAnMCcpO1xuXG5cdFx0XHQvLyBwYWRcblx0XHRcdHAucGFkLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcblx0XHRcdHAucGFkLnN0eWxlLndpZHRoID0gVEhJUy53aWR0aCArICdweCc7XG5cdFx0XHRwLnBhZC5zdHlsZS5oZWlnaHQgPSBUSElTLmhlaWdodCArICdweCc7XG5cblx0XHRcdC8vIHBhZCBwYWxldHRlcyAoSFNWIGFuZCBIVlMpXG5cdFx0XHRwLnBhZFBhbC5kcmF3KFRISVMud2lkdGgsIFRISVMuaGVpZ2h0LCBqc2MuZ2V0UGFkWUNvbXBvbmVudChUSElTKSk7XG5cblx0XHRcdC8vIHBhZCBib3JkZXJcblx0XHRcdHAucGFkQi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLnBhZEIuc3R5bGUubGVmdCA9IFRISVMucGFkZGluZyArICdweCc7XG5cdFx0XHRwLnBhZEIuc3R5bGUudG9wID0gVEhJUy5wYWRkaW5nICsgJ3B4Jztcblx0XHRcdHAucGFkQi5zdHlsZS5ib3JkZXIgPSBUSElTLmluc2V0V2lkdGggKyAncHggc29saWQnO1xuXHRcdFx0cC5wYWRCLnN0eWxlLmJvcmRlckNvbG9yID0gVEhJUy5pbnNldENvbG9yO1xuXG5cdFx0XHQvLyBwYWQgbW91c2UgYXJlYVxuXHRcdFx0cC5wYWRNLl9qc2NJbnN0YW5jZSA9IFRISVM7XG5cdFx0XHRwLnBhZE0uX2pzY0NvbnRyb2xOYW1lID0gJ3BhZCc7XG5cdFx0XHRwLnBhZE0uc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cC5wYWRNLnN0eWxlLmxlZnQgPSAnMCc7XG5cdFx0XHRwLnBhZE0uc3R5bGUudG9wID0gJzAnO1xuXHRcdFx0cC5wYWRNLnN0eWxlLndpZHRoID0gKFRISVMucGFkZGluZyArIDIgKiBUSElTLmluc2V0V2lkdGggKyBUSElTLndpZHRoICsgcGFkVG9TbGlkZXJQYWRkaW5nIC8gMikgKyAncHgnO1xuXHRcdFx0cC5wYWRNLnN0eWxlLmhlaWdodCA9IGRpbXNbMV0gKyAncHgnO1xuXHRcdFx0cC5wYWRNLnN0eWxlLmN1cnNvciA9IHBhZEN1cnNvcjtcblxuXHRcdFx0Ly8gcGFkIGNyb3NzXG5cdFx0XHRwLmNyb3NzLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHAuY3Jvc3Muc3R5bGUubGVmdCA9XG5cdFx0XHRwLmNyb3NzLnN0eWxlLnRvcCA9XG5cdFx0XHRcdCcwJztcblx0XHRcdHAuY3Jvc3Muc3R5bGUud2lkdGggPVxuXHRcdFx0cC5jcm9zcy5zdHlsZS5oZWlnaHQgPVxuXHRcdFx0XHRjcm9zc091dGVyU2l6ZSArICdweCc7XG5cblx0XHRcdC8vIHBhZCBjcm9zcyBib3JkZXIgWSBhbmQgWFxuXHRcdFx0cC5jcm9zc0JZLnN0eWxlLnBvc2l0aW9uID1cblx0XHRcdHAuY3Jvc3NCWC5zdHlsZS5wb3NpdGlvbiA9XG5cdFx0XHRcdCdhYnNvbHV0ZSc7XG5cdFx0XHRwLmNyb3NzQlkuc3R5bGUuYmFja2dyb3VuZCA9XG5cdFx0XHRwLmNyb3NzQlguc3R5bGUuYmFja2dyb3VuZCA9XG5cdFx0XHRcdFRISVMucG9pbnRlckJvcmRlckNvbG9yO1xuXHRcdFx0cC5jcm9zc0JZLnN0eWxlLndpZHRoID1cblx0XHRcdHAuY3Jvc3NCWC5zdHlsZS5oZWlnaHQgPVxuXHRcdFx0XHQoMiAqIFRISVMucG9pbnRlckJvcmRlcldpZHRoICsgVEhJUy5wb2ludGVyVGhpY2tuZXNzKSArICdweCc7XG5cdFx0XHRwLmNyb3NzQlkuc3R5bGUuaGVpZ2h0ID1cblx0XHRcdHAuY3Jvc3NCWC5zdHlsZS53aWR0aCA9XG5cdFx0XHRcdGNyb3NzT3V0ZXJTaXplICsgJ3B4Jztcblx0XHRcdHAuY3Jvc3NCWS5zdHlsZS5sZWZ0ID1cblx0XHRcdHAuY3Jvc3NCWC5zdHlsZS50b3AgPVxuXHRcdFx0XHQoTWF0aC5mbG9vcihjcm9zc091dGVyU2l6ZSAvIDIpIC0gTWF0aC5mbG9vcihUSElTLnBvaW50ZXJUaGlja25lc3MgLyAyKSAtIFRISVMucG9pbnRlckJvcmRlcldpZHRoKSArICdweCc7XG5cdFx0XHRwLmNyb3NzQlkuc3R5bGUudG9wID1cblx0XHRcdHAuY3Jvc3NCWC5zdHlsZS5sZWZ0ID1cblx0XHRcdFx0JzAnO1xuXG5cdFx0XHQvLyBwYWQgY3Jvc3MgbGluZSBZIGFuZCBYXG5cdFx0XHRwLmNyb3NzTFkuc3R5bGUucG9zaXRpb24gPVxuXHRcdFx0cC5jcm9zc0xYLnN0eWxlLnBvc2l0aW9uID1cblx0XHRcdFx0J2Fic29sdXRlJztcblx0XHRcdHAuY3Jvc3NMWS5zdHlsZS5iYWNrZ3JvdW5kID1cblx0XHRcdHAuY3Jvc3NMWC5zdHlsZS5iYWNrZ3JvdW5kID1cblx0XHRcdFx0VEhJUy5wb2ludGVyQ29sb3I7XG5cdFx0XHRwLmNyb3NzTFkuc3R5bGUuaGVpZ2h0ID1cblx0XHRcdHAuY3Jvc3NMWC5zdHlsZS53aWR0aCA9XG5cdFx0XHRcdChjcm9zc091dGVyU2l6ZSAtIDIgKiBUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCkgKyAncHgnO1xuXHRcdFx0cC5jcm9zc0xZLnN0eWxlLndpZHRoID1cblx0XHRcdHAuY3Jvc3NMWC5zdHlsZS5oZWlnaHQgPVxuXHRcdFx0XHRUSElTLnBvaW50ZXJUaGlja25lc3MgKyAncHgnO1xuXHRcdFx0cC5jcm9zc0xZLnN0eWxlLmxlZnQgPVxuXHRcdFx0cC5jcm9zc0xYLnN0eWxlLnRvcCA9XG5cdFx0XHRcdChNYXRoLmZsb29yKGNyb3NzT3V0ZXJTaXplIC8gMikgLSBNYXRoLmZsb29yKFRISVMucG9pbnRlclRoaWNrbmVzcyAvIDIpKSArICdweCc7XG5cdFx0XHRwLmNyb3NzTFkuc3R5bGUudG9wID1cblx0XHRcdHAuY3Jvc3NMWC5zdHlsZS5sZWZ0ID1cblx0XHRcdFx0VEhJUy5wb2ludGVyQm9yZGVyV2lkdGggKyAncHgnO1xuXG5cdFx0XHQvLyBzbGlkZXJcblx0XHRcdHAuc2xkLnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG5cdFx0XHRwLnNsZC5zdHlsZS53aWR0aCA9IFRISVMuc2xpZGVyU2l6ZSArICdweCc7XG5cdFx0XHRwLnNsZC5zdHlsZS5oZWlnaHQgPSBUSElTLmhlaWdodCArICdweCc7XG5cblx0XHRcdC8vIHNsaWRlciBncmFkaWVudFxuXHRcdFx0cC5zbGRHcmFkLmRyYXcoVEhJUy5zbGlkZXJTaXplLCBUSElTLmhlaWdodCwgJyMwMDAnLCAnIzAwMCcpO1xuXG5cdFx0XHQvLyBzbGlkZXIgYm9yZGVyXG5cdFx0XHRwLnNsZEIuc3R5bGUuZGlzcGxheSA9IGRpc3BsYXlTbGlkZXIgPyAnYmxvY2snIDogJ25vbmUnO1xuXHRcdFx0cC5zbGRCLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHAuc2xkQi5zdHlsZS5yaWdodCA9IFRISVMucGFkZGluZyArICdweCc7XG5cdFx0XHRwLnNsZEIuc3R5bGUudG9wID0gVEhJUy5wYWRkaW5nICsgJ3B4Jztcblx0XHRcdHAuc2xkQi5zdHlsZS5ib3JkZXIgPSBUSElTLmluc2V0V2lkdGggKyAncHggc29saWQnO1xuXHRcdFx0cC5zbGRCLnN0eWxlLmJvcmRlckNvbG9yID0gVEhJUy5pbnNldENvbG9yO1xuXG5cdFx0XHQvLyBzbGlkZXIgbW91c2UgYXJlYVxuXHRcdFx0cC5zbGRNLl9qc2NJbnN0YW5jZSA9IFRISVM7XG5cdFx0XHRwLnNsZE0uX2pzY0NvbnRyb2xOYW1lID0gJ3NsZCc7XG5cdFx0XHRwLnNsZE0uc3R5bGUuZGlzcGxheSA9IGRpc3BsYXlTbGlkZXIgPyAnYmxvY2snIDogJ25vbmUnO1xuXHRcdFx0cC5zbGRNLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHAuc2xkTS5zdHlsZS5yaWdodCA9ICcwJztcblx0XHRcdHAuc2xkTS5zdHlsZS50b3AgPSAnMCc7XG5cdFx0XHRwLnNsZE0uc3R5bGUud2lkdGggPSAoVEhJUy5zbGlkZXJTaXplICsgcGFkVG9TbGlkZXJQYWRkaW5nIC8gMiArIFRISVMucGFkZGluZyArIDIgKiBUSElTLmluc2V0V2lkdGgpICsgJ3B4Jztcblx0XHRcdHAuc2xkTS5zdHlsZS5oZWlnaHQgPSBkaW1zWzFdICsgJ3B4Jztcblx0XHRcdHAuc2xkTS5zdHlsZS5jdXJzb3IgPSAnZGVmYXVsdCc7XG5cblx0XHRcdC8vIHNsaWRlciBwb2ludGVyIGlubmVyIGFuZCBvdXRlciBib3JkZXJcblx0XHRcdHAuc2xkUHRySUIuc3R5bGUuYm9yZGVyID1cblx0XHRcdHAuc2xkUHRyT0Iuc3R5bGUuYm9yZGVyID1cblx0XHRcdFx0VEhJUy5wb2ludGVyQm9yZGVyV2lkdGggKyAncHggc29saWQgJyArIFRISVMucG9pbnRlckJvcmRlckNvbG9yO1xuXG5cdFx0XHQvLyBzbGlkZXIgcG9pbnRlciBvdXRlciBib3JkZXJcblx0XHRcdHAuc2xkUHRyT0Iuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cC5zbGRQdHJPQi5zdHlsZS5sZWZ0ID0gLSgyICogVEhJUy5wb2ludGVyQm9yZGVyV2lkdGggKyBUSElTLnBvaW50ZXJUaGlja25lc3MpICsgJ3B4Jztcblx0XHRcdHAuc2xkUHRyT0Iuc3R5bGUudG9wID0gJzAnO1xuXG5cdFx0XHQvLyBzbGlkZXIgcG9pbnRlciBtaWRkbGUgYm9yZGVyXG5cdFx0XHRwLnNsZFB0ck1CLnN0eWxlLmJvcmRlciA9IFRISVMucG9pbnRlclRoaWNrbmVzcyArICdweCBzb2xpZCAnICsgVEhJUy5wb2ludGVyQ29sb3I7XG5cblx0XHRcdC8vIHNsaWRlciBwb2ludGVyIHNwYWNlclxuXHRcdFx0cC5zbGRQdHJTLnN0eWxlLndpZHRoID0gVEhJUy5zbGlkZXJTaXplICsgJ3B4Jztcblx0XHRcdHAuc2xkUHRyUy5zdHlsZS5oZWlnaHQgPSBzbGlkZXJQdHJTcGFjZSArICdweCc7XG5cblx0XHRcdC8vIHRoZSBDbG9zZSBidXR0b25cblx0XHRcdGZ1bmN0aW9uIHNldEJ0bkJvcmRlciAoKSB7XG5cdFx0XHRcdHZhciBpbnNldENvbG9ycyA9IFRISVMuaW5zZXRDb2xvci5zcGxpdCgvXFxzKy8pO1xuXHRcdFx0XHR2YXIgb3V0c2V0Q29sb3IgPSBpbnNldENvbG9ycy5sZW5ndGggPCAyID8gaW5zZXRDb2xvcnNbMF0gOiBpbnNldENvbG9yc1sxXSArICcgJyArIGluc2V0Q29sb3JzWzBdICsgJyAnICsgaW5zZXRDb2xvcnNbMF0gKyAnICcgKyBpbnNldENvbG9yc1sxXTtcblx0XHRcdFx0cC5idG4uc3R5bGUuYm9yZGVyQ29sb3IgPSBvdXRzZXRDb2xvcjtcblx0XHRcdH1cblx0XHRcdHAuYnRuLnN0eWxlLmRpc3BsYXkgPSBUSElTLmNsb3NhYmxlID8gJ2Jsb2NrJyA6ICdub25lJztcblx0XHRcdHAuYnRuLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHAuYnRuLnN0eWxlLmxlZnQgPSBUSElTLnBhZGRpbmcgKyAncHgnO1xuXHRcdFx0cC5idG4uc3R5bGUuYm90dG9tID0gVEhJUy5wYWRkaW5nICsgJ3B4Jztcblx0XHRcdHAuYnRuLnN0eWxlLnBhZGRpbmcgPSAnMCAxNXB4Jztcblx0XHRcdHAuYnRuLnN0eWxlLmhlaWdodCA9IFRISVMuYnV0dG9uSGVpZ2h0ICsgJ3B4Jztcblx0XHRcdHAuYnRuLnN0eWxlLmJvcmRlciA9IFRISVMuaW5zZXRXaWR0aCArICdweCBzb2xpZCc7XG5cdFx0XHRzZXRCdG5Cb3JkZXIoKTtcblx0XHRcdHAuYnRuLnN0eWxlLmNvbG9yID0gVEhJUy5idXR0b25Db2xvcjtcblx0XHRcdHAuYnRuLnN0eWxlLmZvbnQgPSAnMTJweCBzYW5zLXNlcmlmJztcblx0XHRcdHAuYnRuLnN0eWxlLnRleHRBbGlnbiA9ICdjZW50ZXInO1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cC5idG4uc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuXHRcdFx0fSBjYXRjaChlT2xkSUUpIHtcblx0XHRcdFx0cC5idG4uc3R5bGUuY3Vyc29yID0gJ2hhbmQnO1xuXHRcdFx0fVxuXHRcdFx0cC5idG4ub25tb3VzZWRvd24gPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFRISVMuaGlkZSgpO1xuXHRcdFx0fTtcblx0XHRcdHAuYnRuVC5zdHlsZS5saW5lSGVpZ2h0ID0gVEhJUy5idXR0b25IZWlnaHQgKyAncHgnO1xuXHRcdFx0cC5idG5ULmlubmVySFRNTCA9ICcnO1xuXHRcdFx0cC5idG5ULmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFRISVMuY2xvc2VUZXh0KSk7XG5cblx0XHRcdC8vIHBsYWNlIHBvaW50ZXJzXG5cdFx0XHRyZWRyYXdQYWQoKTtcblx0XHRcdHJlZHJhd1NsZCgpO1xuXG5cdFx0XHQvLyBJZiB3ZSBhcmUgY2hhbmdpbmcgdGhlIG93bmVyIHdpdGhvdXQgZmlyc3QgY2xvc2luZyB0aGUgcGlja2VyLFxuXHRcdFx0Ly8gbWFrZSBzdXJlIHRvIGZpcnN0IGRlYWwgd2l0aCB0aGUgb2xkIG93bmVyXG5cdFx0XHRpZiAoanNjLnBpY2tlci5vd25lciAmJiBqc2MucGlja2VyLm93bmVyICE9PSBUSElTKSB7XG5cdFx0XHRcdGpzYy51bnNldENsYXNzKGpzYy5waWNrZXIub3duZXIudGFyZ2V0RWxlbWVudCwgVEhJUy5hY3RpdmVDbGFzcyk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFNldCB0aGUgbmV3IHBpY2tlciBvd25lclxuXHRcdFx0anNjLnBpY2tlci5vd25lciA9IFRISVM7XG5cblx0XHRcdC8vIFRoZSByZWRyYXdQb3NpdGlvbigpIG1ldGhvZCBuZWVkcyBwaWNrZXIub3duZXIgdG8gYmUgc2V0LCB0aGF0J3Mgd2h5IHdlIGNhbGwgaXQgaGVyZSxcblx0XHRcdC8vIGFmdGVyIHNldHRpbmcgdGhlIG93bmVyXG5cdFx0XHRpZiAoanNjLmlzRWxlbWVudFR5cGUoY29udGFpbmVyLCAnYm9keScpKSB7XG5cdFx0XHRcdGpzYy5yZWRyYXdQb3NpdGlvbigpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0anNjLl9kcmF3UG9zaXRpb24oVEhJUywgMCwgMCwgJ3JlbGF0aXZlJywgZmFsc2UpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAocC53cmFwLnBhcmVudE5vZGUgIT0gY29udGFpbmVyKSB7XG5cdFx0XHRcdGNvbnRhaW5lci5hcHBlbmRDaGlsZChwLndyYXApO1xuXHRcdFx0fVxuXG5cdFx0XHRqc2Muc2V0Q2xhc3MoVEhJUy50YXJnZXRFbGVtZW50LCBUSElTLmFjdGl2ZUNsYXNzKTtcblx0XHR9XG5cblxuXHRcdGZ1bmN0aW9uIHJlZHJhd1BhZCAoKSB7XG5cdFx0XHQvLyByZWRyYXcgdGhlIHBhZCBwb2ludGVyXG5cdFx0XHRzd2l0Y2ggKGpzYy5nZXRQYWRZQ29tcG9uZW50KFRISVMpKSB7XG5cdFx0XHRjYXNlICdzJzogdmFyIHlDb21wb25lbnQgPSAxOyBicmVhaztcblx0XHRcdGNhc2UgJ3YnOiB2YXIgeUNvbXBvbmVudCA9IDI7IGJyZWFrO1xuXHRcdFx0fVxuXHRcdFx0dmFyIHggPSBNYXRoLnJvdW5kKChUSElTLmhzdlswXSAvIDM2MCkgKiAoVEhJUy53aWR0aCAtIDEpKTtcblx0XHRcdHZhciB5ID0gTWF0aC5yb3VuZCgoMSAtIFRISVMuaHN2W3lDb21wb25lbnRdIC8gMTAwKSAqIChUSElTLmhlaWdodCAtIDEpKTtcblx0XHRcdHZhciBjcm9zc091dGVyU2l6ZSA9ICgyICogVEhJUy5wb2ludGVyQm9yZGVyV2lkdGggKyBUSElTLnBvaW50ZXJUaGlja25lc3MgKyAyICogVEhJUy5jcm9zc1NpemUpO1xuXHRcdFx0dmFyIG9mcyA9IC1NYXRoLmZsb29yKGNyb3NzT3V0ZXJTaXplIC8gMik7XG5cdFx0XHRqc2MucGlja2VyLmNyb3NzLnN0eWxlLmxlZnQgPSAoeCArIG9mcykgKyAncHgnO1xuXHRcdFx0anNjLnBpY2tlci5jcm9zcy5zdHlsZS50b3AgPSAoeSArIG9mcykgKyAncHgnO1xuXG5cdFx0XHQvLyByZWRyYXcgdGhlIHNsaWRlclxuXHRcdFx0c3dpdGNoIChqc2MuZ2V0U2xpZGVyQ29tcG9uZW50KFRISVMpKSB7XG5cdFx0XHRjYXNlICdzJzpcblx0XHRcdFx0dmFyIHJnYjEgPSBIU1ZfUkdCKFRISVMuaHN2WzBdLCAxMDAsIFRISVMuaHN2WzJdKTtcblx0XHRcdFx0dmFyIHJnYjIgPSBIU1ZfUkdCKFRISVMuaHN2WzBdLCAwLCBUSElTLmhzdlsyXSk7XG5cdFx0XHRcdHZhciBjb2xvcjEgPSAncmdiKCcgK1xuXHRcdFx0XHRcdE1hdGgucm91bmQocmdiMVswXSkgKyAnLCcgK1xuXHRcdFx0XHRcdE1hdGgucm91bmQocmdiMVsxXSkgKyAnLCcgK1xuXHRcdFx0XHRcdE1hdGgucm91bmQocmdiMVsyXSkgKyAnKSc7XG5cdFx0XHRcdHZhciBjb2xvcjIgPSAncmdiKCcgK1xuXHRcdFx0XHRcdE1hdGgucm91bmQocmdiMlswXSkgKyAnLCcgK1xuXHRcdFx0XHRcdE1hdGgucm91bmQocmdiMlsxXSkgKyAnLCcgK1xuXHRcdFx0XHRcdE1hdGgucm91bmQocmdiMlsyXSkgKyAnKSc7XG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkR3JhZC5kcmF3KFRISVMuc2xpZGVyU2l6ZSwgVEhJUy5oZWlnaHQsIGNvbG9yMSwgY29sb3IyKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICd2Jzpcblx0XHRcdFx0dmFyIHJnYiA9IEhTVl9SR0IoVEhJUy5oc3ZbMF0sIFRISVMuaHN2WzFdLCAxMDApO1xuXHRcdFx0XHR2YXIgY29sb3IxID0gJ3JnYignICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYlswXSkgKyAnLCcgK1xuXHRcdFx0XHRcdE1hdGgucm91bmQocmdiWzFdKSArICcsJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2JbMl0pICsgJyknO1xuXHRcdFx0XHR2YXIgY29sb3IyID0gJyMwMDAnO1xuXHRcdFx0XHRqc2MucGlja2VyLnNsZEdyYWQuZHJhdyhUSElTLnNsaWRlclNpemUsIFRISVMuaGVpZ2h0LCBjb2xvcjEsIGNvbG9yMik7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblxuXG5cdFx0ZnVuY3Rpb24gcmVkcmF3U2xkICgpIHtcblx0XHRcdHZhciBzbGRDb21wb25lbnQgPSBqc2MuZ2V0U2xpZGVyQ29tcG9uZW50KFRISVMpO1xuXHRcdFx0aWYgKHNsZENvbXBvbmVudCkge1xuXHRcdFx0XHQvLyByZWRyYXcgdGhlIHNsaWRlciBwb2ludGVyXG5cdFx0XHRcdHN3aXRjaCAoc2xkQ29tcG9uZW50KSB7XG5cdFx0XHRcdGNhc2UgJ3MnOiB2YXIgeUNvbXBvbmVudCA9IDE7IGJyZWFrO1xuXHRcdFx0XHRjYXNlICd2JzogdmFyIHlDb21wb25lbnQgPSAyOyBicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0XHR2YXIgeSA9IE1hdGgucm91bmQoKDEgLSBUSElTLmhzdlt5Q29tcG9uZW50XSAvIDEwMCkgKiAoVEhJUy5oZWlnaHQgLSAxKSk7XG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkUHRyT0Iuc3R5bGUudG9wID0gKHkgLSAoMiAqIFRISVMucG9pbnRlckJvcmRlcldpZHRoICsgVEhJUy5wb2ludGVyVGhpY2tuZXNzKSAtIE1hdGguZmxvb3Ioc2xpZGVyUHRyU3BhY2UgLyAyKSkgKyAncHgnO1xuXHRcdFx0fVxuXHRcdH1cblxuXG5cdFx0ZnVuY3Rpb24gaXNQaWNrZXJPd25lciAoKSB7XG5cdFx0XHRyZXR1cm4ganNjLnBpY2tlciAmJiBqc2MucGlja2VyLm93bmVyID09PSBUSElTO1xuXHRcdH1cblxuXG5cdFx0ZnVuY3Rpb24gYmx1clZhbHVlICgpIHtcblx0XHRcdFRISVMuaW1wb3J0Q29sb3IoKTtcblx0XHR9XG5cblxuXHRcdC8vIEZpbmQgdGhlIHRhcmdldCBlbGVtZW50XG5cdFx0aWYgKHR5cGVvZiB0YXJnZXRFbGVtZW50ID09PSAnc3RyaW5nJykge1xuXHRcdFx0dmFyIGlkID0gdGFyZ2V0RWxlbWVudDtcblx0XHRcdHZhciBlbG0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG5cdFx0XHRpZiAoZWxtKSB7XG5cdFx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IGVsbTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGpzYy53YXJuKCdDb3VsZCBub3QgZmluZCB0YXJnZXQgZWxlbWVudCB3aXRoIElEIFxcJycgKyBpZCArICdcXCcnKTtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKHRhcmdldEVsZW1lbnQpIHtcblx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IHRhcmdldEVsZW1lbnQ7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGpzYy53YXJuKCdJbnZhbGlkIHRhcmdldCBlbGVtZW50OiBcXCcnICsgdGFyZ2V0RWxlbWVudCArICdcXCcnKTtcblx0XHR9XG5cblx0XHRpZiAodGhpcy50YXJnZXRFbGVtZW50Ll9qc2NMaW5rZWRJbnN0YW5jZSkge1xuXHRcdFx0anNjLndhcm4oJ0Nhbm5vdCBsaW5rIGpzY29sb3IgdHdpY2UgdG8gdGhlIHNhbWUgZWxlbWVudC4gU2tpcHBpbmcuJyk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHRoaXMudGFyZ2V0RWxlbWVudC5fanNjTGlua2VkSW5zdGFuY2UgPSB0aGlzO1xuXG5cdFx0Ly8gRmluZCB0aGUgdmFsdWUgZWxlbWVudFxuXHRcdHRoaXMudmFsdWVFbGVtZW50ID0ganNjLmZldGNoRWxlbWVudCh0aGlzLnZhbHVlRWxlbWVudCk7XG5cdFx0Ly8gRmluZCB0aGUgc3R5bGUgZWxlbWVudFxuXHRcdHRoaXMuc3R5bGVFbGVtZW50ID0ganNjLmZldGNoRWxlbWVudCh0aGlzLnN0eWxlRWxlbWVudCk7XG5cblx0XHR2YXIgVEhJUyA9IHRoaXM7XG5cdFx0dmFyIGNvbnRhaW5lciA9XG5cdFx0XHR0aGlzLmNvbnRhaW5lciA/XG5cdFx0XHRqc2MuZmV0Y2hFbGVtZW50KHRoaXMuY29udGFpbmVyKSA6XG5cdFx0XHRkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdO1xuXHRcdHZhciBzbGlkZXJQdHJTcGFjZSA9IDM7IC8vIHB4XG5cblx0XHQvLyBGb3IgQlVUVE9OIGVsZW1lbnRzIGl0J3MgaW1wb3J0YW50IHRvIHN0b3AgdGhlbSBmcm9tIHNlbmRpbmcgdGhlIGZvcm0gd2hlbiBjbGlja2VkXG5cdFx0Ly8gKGUuZy4gaW4gU2FmYXJpKVxuXHRcdGlmIChqc2MuaXNFbGVtZW50VHlwZSh0aGlzLnRhcmdldEVsZW1lbnQsICdidXR0b24nKSkge1xuXHRcdFx0aWYgKHRoaXMudGFyZ2V0RWxlbWVudC5vbmNsaWNrKSB7XG5cdFx0XHRcdHZhciBvcmlnQ2FsbGJhY2sgPSB0aGlzLnRhcmdldEVsZW1lbnQub25jbGljaztcblx0XHRcdFx0dGhpcy50YXJnZXRFbGVtZW50Lm9uY2xpY2sgPSBmdW5jdGlvbiAoZXZ0KSB7XG5cdFx0XHRcdFx0b3JpZ0NhbGxiYWNrLmNhbGwodGhpcywgZXZ0KTtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQub25jbGljayA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZhbHNlOyB9O1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8qXG5cdFx0dmFyIGVsbSA9IHRoaXMudGFyZ2V0RWxlbWVudDtcblx0XHRkbyB7XG5cdFx0XHQvLyBJZiB0aGUgdGFyZ2V0IGVsZW1lbnQgb3Igb25lIG9mIGl0cyBvZmZzZXRQYXJlbnRzIGhhcyBmaXhlZCBwb3NpdGlvbixcblx0XHRcdC8vIHRoZW4gdXNlIGZpeGVkIHBvc2l0aW9uaW5nIGluc3RlYWRcblx0XHRcdC8vXG5cdFx0XHQvLyBOb3RlOiBJbiBGaXJlZm94LCBnZXRDb21wdXRlZFN0eWxlIHJldHVybnMgbnVsbCBpbiBhIGhpZGRlbiBpZnJhbWUsXG5cdFx0XHQvLyB0aGF0J3Mgd2h5IHdlIG5lZWQgdG8gY2hlY2sgaWYgdGhlIHJldHVybmVkIHN0eWxlIG9iamVjdCBpcyBub24tZW1wdHlcblx0XHRcdHZhciBjdXJyU3R5bGUgPSBqc2MuZ2V0U3R5bGUoZWxtKTtcblx0XHRcdGlmIChjdXJyU3R5bGUgJiYgY3VyclN0eWxlLnBvc2l0aW9uLnRvTG93ZXJDYXNlKCkgPT09ICdmaXhlZCcpIHtcblx0XHRcdFx0dGhpcy5maXhlZCA9IHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChlbG0gIT09IHRoaXMudGFyZ2V0RWxlbWVudCkge1xuXHRcdFx0XHQvLyBhdHRhY2ggb25QYXJlbnRTY3JvbGwgc28gdGhhdCB3ZSBjYW4gcmVjb21wdXRlIHRoZSBwaWNrZXIgcG9zaXRpb25cblx0XHRcdFx0Ly8gd2hlbiBvbmUgb2YgdGhlIG9mZnNldFBhcmVudHMgaXMgc2Nyb2xsZWRcblx0XHRcdFx0aWYgKCFlbG0uX2pzY0V2ZW50c0F0dGFjaGVkKSB7XG5cdFx0XHRcdFx0anNjLmF0dGFjaEV2ZW50KGVsbSwgJ3Njcm9sbCcsIGpzYy5vblBhcmVudFNjcm9sbCk7XG5cdFx0XHRcdFx0ZWxtLl9qc2NFdmVudHNBdHRhY2hlZCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IHdoaWxlICgoZWxtID0gZWxtLm9mZnNldFBhcmVudCkgJiYgIWpzYy5pc0VsZW1lbnRUeXBlKGVsbSwgJ2JvZHknKSk7XG5cdFx0Ki9cblxuXHRcdC8vIHZhbHVlRWxlbWVudFxuXHRcdGlmICh0aGlzLnZhbHVlRWxlbWVudCkge1xuXHRcdFx0aWYgKGpzYy5pc0VsZW1lbnRUeXBlKHRoaXMudmFsdWVFbGVtZW50LCAnaW5wdXQnKSkge1xuXHRcdFx0XHR2YXIgdXBkYXRlRmllbGQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0VEhJUy5mcm9tU3RyaW5nKFRISVMudmFsdWVFbGVtZW50LnZhbHVlLCBqc2MubGVhdmVWYWx1ZSk7XG5cdFx0XHRcdFx0anNjLmRpc3BhdGNoRmluZUNoYW5nZShUSElTKTtcblx0XHRcdFx0fTtcblx0XHRcdFx0anNjLmF0dGFjaEV2ZW50KHRoaXMudmFsdWVFbGVtZW50LCAna2V5dXAnLCB1cGRhdGVGaWVsZCk7XG5cdFx0XHRcdGpzYy5hdHRhY2hFdmVudCh0aGlzLnZhbHVlRWxlbWVudCwgJ2lucHV0JywgdXBkYXRlRmllbGQpO1xuXHRcdFx0XHRqc2MuYXR0YWNoRXZlbnQodGhpcy52YWx1ZUVsZW1lbnQsICdibHVyJywgYmx1clZhbHVlKTtcblx0XHRcdFx0dGhpcy52YWx1ZUVsZW1lbnQuc2V0QXR0cmlidXRlKCdhdXRvY29tcGxldGUnLCAnb2ZmJyk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gc3R5bGVFbGVtZW50XG5cdFx0aWYgKHRoaXMuc3R5bGVFbGVtZW50KSB7XG5cdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5fanNjT3JpZ1N0eWxlID0ge1xuXHRcdFx0XHRiYWNrZ3JvdW5kSW1hZ2UgOiB0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UsXG5cdFx0XHRcdGJhY2tncm91bmRDb2xvciA6IHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvcixcblx0XHRcdFx0Y29sb3IgOiB0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5jb2xvclxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRpZiAodGhpcy52YWx1ZSkge1xuXHRcdFx0Ly8gVHJ5IHRvIHNldCB0aGUgY29sb3IgZnJvbSB0aGUgLnZhbHVlIG9wdGlvbiBhbmQgaWYgdW5zdWNjZXNzZnVsLFxuXHRcdFx0Ly8gZXhwb3J0IHRoZSBjdXJyZW50IGNvbG9yXG5cdFx0XHR0aGlzLmZyb21TdHJpbmcodGhpcy52YWx1ZSkgfHwgdGhpcy5leHBvcnRDb2xvcigpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmltcG9ydENvbG9yKCk7XG5cdFx0fVxuXHR9XG5cbn07XG5cblxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gUHVibGljIHByb3BlcnRpZXMgYW5kIG1ldGhvZHNcbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuXG4vLyBCeSBkZWZhdWx0LCBzZWFyY2ggZm9yIGFsbCBlbGVtZW50cyB3aXRoIGNsYXNzPVwianNjb2xvclwiIGFuZCBpbnN0YWxsIGEgY29sb3IgcGlja2VyIG9uIHRoZW0uXG4vL1xuLy8gWW91IGNhbiBjaGFuZ2Ugd2hhdCBjbGFzcyBuYW1lIHdpbGwgYmUgbG9va2VkIGZvciBieSBzZXR0aW5nIHRoZSBwcm9wZXJ0eSBqc2NvbG9yLmxvb2t1cENsYXNzXG4vLyBhbnl3aGVyZSBpbiB5b3VyIEhUTUwgZG9jdW1lbnQuIFRvIGNvbXBsZXRlbHkgZGlzYWJsZSB0aGUgYXV0b21hdGljIGxvb2t1cCwgc2V0IGl0IHRvIG51bGwuXG4vL1xuanNjLmpzY29sb3IubG9va3VwQ2xhc3MgPSAnanNjb2xvcic7XG5cblxuanNjLmpzY29sb3IuaW5zdGFsbEJ5Q2xhc3NOYW1lID0gZnVuY3Rpb24gKGNsYXNzTmFtZSkge1xuXHR2YXIgaW5wdXRFbG1zID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lucHV0Jyk7XG5cdHZhciBidXR0b25FbG1zID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2J1dHRvbicpO1xuXG5cdGpzYy50cnlJbnN0YWxsT25FbGVtZW50cyhpbnB1dEVsbXMsIGNsYXNzTmFtZSk7XG5cdGpzYy50cnlJbnN0YWxsT25FbGVtZW50cyhidXR0b25FbG1zLCBjbGFzc05hbWUpO1xufTtcblxuXG5qc2MucmVnaXN0ZXIoKTtcblxuXG5yZXR1cm4ganNjLmpzY29sb3I7XG5cblxufSkoKTsgfVxuIiwiLyohIHZleC5jb21iaW5lZC5qczogdmV4IDMuMS4xLCB2ZXgtZGlhbG9nIDEuMC43ICovXG4hZnVuY3Rpb24oYSl7aWYoXCJvYmplY3RcIj09dHlwZW9mIGV4cG9ydHMmJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBtb2R1bGUpbW9kdWxlLmV4cG9ydHM9YSgpO2Vsc2UgaWYoXCJmdW5jdGlvblwiPT10eXBlb2YgZGVmaW5lJiZkZWZpbmUuYW1kKWRlZmluZShbXSxhKTtlbHNle3ZhciBiO2I9XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIGdsb2JhbD9nbG9iYWw6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHNlbGY/c2VsZjp0aGlzLGIudmV4PWEoKX19KGZ1bmN0aW9uKCl7dmFyIGE7cmV0dXJuIGZ1bmN0aW9uIGIoYSxjLGQpe2Z1bmN0aW9uIGUoZyxoKXtpZighY1tnXSl7aWYoIWFbZ10pe3ZhciBpPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWgmJmkpcmV0dXJuIGkoZywhMCk7aWYoZilyZXR1cm4gZihnLCEwKTt2YXIgaj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2crXCInXCIpO3Rocm93IGouY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixqfXZhciBrPWNbZ109e2V4cG9ydHM6e319O2FbZ11bMF0uY2FsbChrLmV4cG9ydHMsZnVuY3Rpb24oYil7dmFyIGM9YVtnXVsxXVtiXTtyZXR1cm4gZShjP2M6Yil9LGssay5leHBvcnRzLGIsYSxjLGQpfXJldHVybiBjW2ddLmV4cG9ydHN9Zm9yKHZhciBmPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsZz0wO2c8ZC5sZW5ndGg7ZysrKWUoZFtnXSk7cmV0dXJuIGV9KHsxOltmdW5jdGlvbihhLGIsYyl7XCJkb2N1bWVudFwiaW4gd2luZG93LnNlbGYmJihcImNsYXNzTGlzdFwiaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIl9cIikmJighZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TfHxcImNsYXNzTGlzdFwiaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIixcImdcIikpPyFmdW5jdGlvbigpe1widXNlIHN0cmljdFwiO3ZhciBhPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJfXCIpO2lmKGEuY2xhc3NMaXN0LmFkZChcImMxXCIsXCJjMlwiKSwhYS5jbGFzc0xpc3QuY29udGFpbnMoXCJjMlwiKSl7dmFyIGI9ZnVuY3Rpb24oYSl7dmFyIGI9RE9NVG9rZW5MaXN0LnByb3RvdHlwZVthXTtET01Ub2tlbkxpc3QucHJvdG90eXBlW2FdPWZ1bmN0aW9uKGEpe3ZhciBjLGQ9YXJndW1lbnRzLmxlbmd0aDtmb3IoYz0wO2M8ZDtjKyspYT1hcmd1bWVudHNbY10sYi5jYWxsKHRoaXMsYSl9fTtiKFwiYWRkXCIpLGIoXCJyZW1vdmVcIil9aWYoYS5jbGFzc0xpc3QudG9nZ2xlKFwiYzNcIiwhMSksYS5jbGFzc0xpc3QuY29udGFpbnMoXCJjM1wiKSl7dmFyIGM9RE9NVG9rZW5MaXN0LnByb3RvdHlwZS50b2dnbGU7RE9NVG9rZW5MaXN0LnByb3RvdHlwZS50b2dnbGU9ZnVuY3Rpb24oYSxiKXtyZXR1cm4gMSBpbiBhcmd1bWVudHMmJiF0aGlzLmNvbnRhaW5zKGEpPT0hYj9iOmMuY2FsbCh0aGlzLGEpfX1hPW51bGx9KCk6IWZ1bmN0aW9uKGEpe1widXNlIHN0cmljdFwiO2lmKFwiRWxlbWVudFwiaW4gYSl7dmFyIGI9XCJjbGFzc0xpc3RcIixjPVwicHJvdG90eXBlXCIsZD1hLkVsZW1lbnRbY10sZT1PYmplY3QsZj1TdHJpbmdbY10udHJpbXx8ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLFwiXCIpfSxnPUFycmF5W2NdLmluZGV4T2Z8fGZ1bmN0aW9uKGEpe2Zvcih2YXIgYj0wLGM9dGhpcy5sZW5ndGg7YjxjO2IrKylpZihiIGluIHRoaXMmJnRoaXNbYl09PT1hKXJldHVybiBiO3JldHVybi0xfSxoPWZ1bmN0aW9uKGEsYil7dGhpcy5uYW1lPWEsdGhpcy5jb2RlPURPTUV4Y2VwdGlvblthXSx0aGlzLm1lc3NhZ2U9Yn0saT1mdW5jdGlvbihhLGIpe2lmKFwiXCI9PT1iKXRocm93IG5ldyBoKFwiU1lOVEFYX0VSUlwiLFwiQW4gaW52YWxpZCBvciBpbGxlZ2FsIHN0cmluZyB3YXMgc3BlY2lmaWVkXCIpO2lmKC9cXHMvLnRlc3QoYikpdGhyb3cgbmV3IGgoXCJJTlZBTElEX0NIQVJBQ1RFUl9FUlJcIixcIlN0cmluZyBjb250YWlucyBhbiBpbnZhbGlkIGNoYXJhY3RlclwiKTtyZXR1cm4gZy5jYWxsKGEsYil9LGo9ZnVuY3Rpb24oYSl7Zm9yKHZhciBiPWYuY2FsbChhLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpfHxcIlwiKSxjPWI/Yi5zcGxpdCgvXFxzKy8pOltdLGQ9MCxlPWMubGVuZ3RoO2Q8ZTtkKyspdGhpcy5wdXNoKGNbZF0pO3RoaXMuX3VwZGF0ZUNsYXNzTmFtZT1mdW5jdGlvbigpe2Euc2V0QXR0cmlidXRlKFwiY2xhc3NcIix0aGlzLnRvU3RyaW5nKCkpfX0saz1qW2NdPVtdLGw9ZnVuY3Rpb24oKXtyZXR1cm4gbmV3IGoodGhpcyl9O2lmKGhbY109RXJyb3JbY10say5pdGVtPWZ1bmN0aW9uKGEpe3JldHVybiB0aGlzW2FdfHxudWxsfSxrLmNvbnRhaW5zPWZ1bmN0aW9uKGEpe3JldHVybiBhKz1cIlwiLGkodGhpcyxhKSE9PS0xfSxrLmFkZD1mdW5jdGlvbigpe3ZhciBhLGI9YXJndW1lbnRzLGM9MCxkPWIubGVuZ3RoLGU9ITE7ZG8gYT1iW2NdK1wiXCIsaSh0aGlzLGEpPT09LTEmJih0aGlzLnB1c2goYSksZT0hMCk7d2hpbGUoKytjPGQpO2UmJnRoaXMuX3VwZGF0ZUNsYXNzTmFtZSgpfSxrLnJlbW92ZT1mdW5jdGlvbigpe3ZhciBhLGIsYz1hcmd1bWVudHMsZD0wLGU9Yy5sZW5ndGgsZj0hMTtkbyBmb3IoYT1jW2RdK1wiXCIsYj1pKHRoaXMsYSk7YiE9PS0xOyl0aGlzLnNwbGljZShiLDEpLGY9ITAsYj1pKHRoaXMsYSk7d2hpbGUoKytkPGUpO2YmJnRoaXMuX3VwZGF0ZUNsYXNzTmFtZSgpfSxrLnRvZ2dsZT1mdW5jdGlvbihhLGIpe2ErPVwiXCI7dmFyIGM9dGhpcy5jb250YWlucyhhKSxkPWM/YiE9PSEwJiZcInJlbW92ZVwiOmIhPT0hMSYmXCJhZGRcIjtyZXR1cm4gZCYmdGhpc1tkXShhKSxiPT09ITB8fGI9PT0hMT9iOiFjfSxrLnRvU3RyaW5nPWZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuam9pbihcIiBcIil9LGUuZGVmaW5lUHJvcGVydHkpe3ZhciBtPXtnZXQ6bCxlbnVtZXJhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMH07dHJ5e2UuZGVmaW5lUHJvcGVydHkoZCxiLG0pfWNhdGNoKG4pe24ubnVtYmVyPT09LTIxNDY4MjMyNTImJihtLmVudW1lcmFibGU9ITEsZS5kZWZpbmVQcm9wZXJ0eShkLGIsbSkpfX1lbHNlIGVbY10uX19kZWZpbmVHZXR0ZXJfXyYmZC5fX2RlZmluZUdldHRlcl9fKGIsbCl9fSh3aW5kb3cuc2VsZikpfSx7fV0sMjpbZnVuY3Rpb24oYSxiLGMpe2Z1bmN0aW9uIGQoYSxiKXtpZihcInN0cmluZ1wiIT10eXBlb2YgYSl0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3RyaW5nIGV4cGVjdGVkXCIpO2J8fChiPWRvY3VtZW50KTt2YXIgYz0vPChbXFx3Ol0rKS8uZXhlYyhhKTtpZighYylyZXR1cm4gYi5jcmVhdGVUZXh0Tm9kZShhKTthPWEucmVwbGFjZSgvXlxccyt8XFxzKyQvZyxcIlwiKTt2YXIgZD1jWzFdO2lmKFwiYm9keVwiPT1kKXt2YXIgZT1iLmNyZWF0ZUVsZW1lbnQoXCJodG1sXCIpO3JldHVybiBlLmlubmVySFRNTD1hLGUucmVtb3ZlQ2hpbGQoZS5sYXN0Q2hpbGQpfXZhciBmPWdbZF18fGcuX2RlZmF1bHQsaD1mWzBdLGk9ZlsxXSxqPWZbMl0sZT1iLmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7Zm9yKGUuaW5uZXJIVE1MPWkrYStqO2gtLTspZT1lLmxhc3RDaGlsZDtpZihlLmZpcnN0Q2hpbGQ9PWUubGFzdENoaWxkKXJldHVybiBlLnJlbW92ZUNoaWxkKGUuZmlyc3RDaGlsZCk7Zm9yKHZhciBrPWIuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO2UuZmlyc3RDaGlsZDspay5hcHBlbmRDaGlsZChlLnJlbW92ZUNoaWxkKGUuZmlyc3RDaGlsZCkpO3JldHVybiBrfWIuZXhwb3J0cz1kO3ZhciBlLGY9ITE7XCJ1bmRlZmluZWRcIiE9dHlwZW9mIGRvY3VtZW50JiYoZT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpLGUuaW5uZXJIVE1MPScgIDxsaW5rLz48dGFibGU+PC90YWJsZT48YSBocmVmPVwiL2FcIj5hPC9hPjxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIi8+JyxmPSFlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwibGlua1wiKS5sZW5ndGgsZT12b2lkIDApO3ZhciBnPXtsZWdlbmQ6WzEsXCI8ZmllbGRzZXQ+XCIsXCI8L2ZpZWxkc2V0PlwiXSx0cjpbMixcIjx0YWJsZT48dGJvZHk+XCIsXCI8L3Rib2R5PjwvdGFibGU+XCJdLGNvbDpbMixcIjx0YWJsZT48dGJvZHk+PC90Ym9keT48Y29sZ3JvdXA+XCIsXCI8L2NvbGdyb3VwPjwvdGFibGU+XCJdLF9kZWZhdWx0OmY/WzEsXCJYPGRpdj5cIixcIjwvZGl2PlwiXTpbMCxcIlwiLFwiXCJdfTtnLnRkPWcudGg9WzMsXCI8dGFibGU+PHRib2R5Pjx0cj5cIixcIjwvdHI+PC90Ym9keT48L3RhYmxlPlwiXSxnLm9wdGlvbj1nLm9wdGdyb3VwPVsxLCc8c2VsZWN0IG11bHRpcGxlPVwibXVsdGlwbGVcIj4nLFwiPC9zZWxlY3Q+XCJdLGcudGhlYWQ9Zy50Ym9keT1nLmNvbGdyb3VwPWcuY2FwdGlvbj1nLnRmb290PVsxLFwiPHRhYmxlPlwiLFwiPC90YWJsZT5cIl0sZy5wb2x5bGluZT1nLmVsbGlwc2U9Zy5wb2x5Z29uPWcuY2lyY2xlPWcudGV4dD1nLmxpbmU9Zy5wYXRoPWcucmVjdD1nLmc9WzEsJzxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZlcnNpb249XCIxLjFcIj4nLFwiPC9zdmc+XCJdfSx7fV0sMzpbZnVuY3Rpb24oYSxiLGMpe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIGQoYSxiKXtpZih2b2lkIDA9PT1hfHxudWxsPT09YSl0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNvbnZlcnQgZmlyc3QgYXJndW1lbnQgdG8gb2JqZWN0XCIpO2Zvcih2YXIgYz1PYmplY3QoYSksZD0xO2Q8YXJndW1lbnRzLmxlbmd0aDtkKyspe3ZhciBlPWFyZ3VtZW50c1tkXTtpZih2b2lkIDAhPT1lJiZudWxsIT09ZSlmb3IodmFyIGY9T2JqZWN0LmtleXMoT2JqZWN0KGUpKSxnPTAsaD1mLmxlbmd0aDtnPGg7ZysrKXt2YXIgaT1mW2ddLGo9T2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihlLGkpO3ZvaWQgMCE9PWomJmouZW51bWVyYWJsZSYmKGNbaV09ZVtpXSl9fXJldHVybiBjfWZ1bmN0aW9uIGUoKXtPYmplY3QuYXNzaWdufHxPYmplY3QuZGVmaW5lUHJvcGVydHkoT2JqZWN0LFwiYXNzaWduXCIse2VudW1lcmFibGU6ITEsY29uZmlndXJhYmxlOiEwLHdyaXRhYmxlOiEwLHZhbHVlOmR9KX1iLmV4cG9ydHM9e2Fzc2lnbjpkLHBvbHlmaWxsOmV9fSx7fV0sNDpbZnVuY3Rpb24oYSxiLGMpe2Z1bmN0aW9uIGQoYSxiKXtcIm9iamVjdFwiIT10eXBlb2YgYj9iPXtoYXNoOiEhYn06dm9pZCAwPT09Yi5oYXNoJiYoYi5oYXNoPSEwKTtmb3IodmFyIGM9Yi5oYXNoP3t9OlwiXCIsZD1iLnNlcmlhbGl6ZXJ8fChiLmhhc2g/ZzpoKSxlPWEmJmEuZWxlbWVudHM/YS5lbGVtZW50czpbXSxmPU9iamVjdC5jcmVhdGUobnVsbCksaz0wO2s8ZS5sZW5ndGg7KytrKXt2YXIgbD1lW2tdO2lmKChiLmRpc2FibGVkfHwhbC5kaXNhYmxlZCkmJmwubmFtZSYmai50ZXN0KGwubm9kZU5hbWUpJiYhaS50ZXN0KGwudHlwZSkpe3ZhciBtPWwubmFtZSxuPWwudmFsdWU7aWYoXCJjaGVja2JveFwiIT09bC50eXBlJiZcInJhZGlvXCIhPT1sLnR5cGV8fGwuY2hlY2tlZHx8KG49dm9pZCAwKSxiLmVtcHR5KXtpZihcImNoZWNrYm94XCIhPT1sLnR5cGV8fGwuY2hlY2tlZHx8KG49XCJcIiksXCJyYWRpb1wiPT09bC50eXBlJiYoZltsLm5hbWVdfHxsLmNoZWNrZWQ/bC5jaGVja2VkJiYoZltsLm5hbWVdPSEwKTpmW2wubmFtZV09ITEpLCFuJiZcInJhZGlvXCI9PWwudHlwZSljb250aW51ZX1lbHNlIGlmKCFuKWNvbnRpbnVlO2lmKFwic2VsZWN0LW11bHRpcGxlXCIhPT1sLnR5cGUpYz1kKGMsbSxuKTtlbHNle249W107Zm9yKHZhciBvPWwub3B0aW9ucyxwPSExLHE9MDtxPG8ubGVuZ3RoOysrcSl7dmFyIHI9b1txXSxzPWIuZW1wdHkmJiFyLnZhbHVlLHQ9ci52YWx1ZXx8cztyLnNlbGVjdGVkJiZ0JiYocD0hMCxjPWIuaGFzaCYmXCJbXVwiIT09bS5zbGljZShtLmxlbmd0aC0yKT9kKGMsbStcIltdXCIsci52YWx1ZSk6ZChjLG0sci52YWx1ZSkpfSFwJiZiLmVtcHR5JiYoYz1kKGMsbSxcIlwiKSl9fX1pZihiLmVtcHR5KWZvcih2YXIgbSBpbiBmKWZbbV18fChjPWQoYyxtLFwiXCIpKTtyZXR1cm4gY31mdW5jdGlvbiBlKGEpe3ZhciBiPVtdLGM9L14oW15cXFtcXF1dKikvLGQ9bmV3IFJlZ0V4cChrKSxlPWMuZXhlYyhhKTtmb3IoZVsxXSYmYi5wdXNoKGVbMV0pO251bGwhPT0oZT1kLmV4ZWMoYSkpOyliLnB1c2goZVsxXSk7cmV0dXJuIGJ9ZnVuY3Rpb24gZihhLGIsYyl7aWYoMD09PWIubGVuZ3RoKXJldHVybiBhPWM7dmFyIGQ9Yi5zaGlmdCgpLGU9ZC5tYXRjaCgvXlxcWyguKz8pXFxdJC8pO2lmKFwiW11cIj09PWQpcmV0dXJuIGE9YXx8W10sQXJyYXkuaXNBcnJheShhKT9hLnB1c2goZihudWxsLGIsYykpOihhLl92YWx1ZXM9YS5fdmFsdWVzfHxbXSxhLl92YWx1ZXMucHVzaChmKG51bGwsYixjKSkpLGE7aWYoZSl7dmFyIGc9ZVsxXSxoPStnO2lzTmFOKGgpPyhhPWF8fHt9LGFbZ109ZihhW2ddLGIsYykpOihhPWF8fFtdLGFbaF09ZihhW2hdLGIsYykpfWVsc2UgYVtkXT1mKGFbZF0sYixjKTtyZXR1cm4gYX1mdW5jdGlvbiBnKGEsYixjKXt2YXIgZD1iLm1hdGNoKGspO2lmKGQpe3ZhciBnPWUoYik7ZihhLGcsYyl9ZWxzZXt2YXIgaD1hW2JdO2g/KEFycmF5LmlzQXJyYXkoaCl8fChhW2JdPVtoXSksYVtiXS5wdXNoKGMpKTphW2JdPWN9cmV0dXJuIGF9ZnVuY3Rpb24gaChhLGIsYyl7cmV0dXJuIGM9Yy5yZXBsYWNlKC8oXFxyKT9cXG4vZyxcIlxcclxcblwiKSxjPWVuY29kZVVSSUNvbXBvbmVudChjKSxjPWMucmVwbGFjZSgvJTIwL2csXCIrXCIpLGErKGE/XCImXCI6XCJcIikrZW5jb2RlVVJJQ29tcG9uZW50KGIpK1wiPVwiK2N9dmFyIGk9L14oPzpzdWJtaXR8YnV0dG9ufGltYWdlfHJlc2V0fGZpbGUpJC9pLGo9L14oPzppbnB1dHxzZWxlY3R8dGV4dGFyZWF8a2V5Z2VuKS9pLGs9LyhcXFtbXlxcW1xcXV0qXFxdKS9nO2IuZXhwb3J0cz1kfSx7fV0sNTpbZnVuY3Rpb24oYixjLGQpeyhmdW5jdGlvbihlKXshZnVuY3Rpb24oYil7aWYoXCJvYmplY3RcIj09dHlwZW9mIGQmJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBjKWMuZXhwb3J0cz1iKCk7ZWxzZSBpZihcImZ1bmN0aW9uXCI9PXR5cGVvZiBhJiZhLmFtZClhKFtdLGIpO2Vsc2V7dmFyIGY7Zj1cInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93P3dpbmRvdzpcInVuZGVmaW5lZFwiIT10eXBlb2YgZT9lOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6dGhpcyxmLnZleERpYWxvZz1iKCl9fShmdW5jdGlvbigpe3JldHVybiBmdW5jdGlvbiBhKGMsZCxlKXtmdW5jdGlvbiBmKGgsaSl7aWYoIWRbaF0pe2lmKCFjW2hdKXt2YXIgaj1cImZ1bmN0aW9uXCI9PXR5cGVvZiBiJiZiO2lmKCFpJiZqKXJldHVybiBqKGgsITApO2lmKGcpcmV0dXJuIGcoaCwhMCk7dmFyIGs9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitoK1wiJ1wiKTt0aHJvdyBrLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsa312YXIgbD1kW2hdPXtleHBvcnRzOnt9fTtjW2hdWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGEpe3ZhciBiPWNbaF1bMV1bYV07cmV0dXJuIGYoYj9iOmEpfSxsLGwuZXhwb3J0cyxhLGMsZCxlKX1yZXR1cm4gZFtoXS5leHBvcnRzfWZvcih2YXIgZz1cImZ1bmN0aW9uXCI9PXR5cGVvZiBiJiZiLGg9MDtoPGUubGVuZ3RoO2grKylmKGVbaF0pO3JldHVybiBmfSh7MTpbZnVuY3Rpb24oYSxiLGMpe2Z1bmN0aW9uIGQoYSxiKXtpZihcInN0cmluZ1wiIT10eXBlb2YgYSl0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3RyaW5nIGV4cGVjdGVkXCIpO2J8fChiPWRvY3VtZW50KTt2YXIgYz0vPChbXFx3Ol0rKS8uZXhlYyhhKTtpZighYylyZXR1cm4gYi5jcmVhdGVUZXh0Tm9kZShhKTthPWEucmVwbGFjZSgvXlxccyt8XFxzKyQvZyxcIlwiKTt2YXIgZD1jWzFdO2lmKFwiYm9keVwiPT1kKXt2YXIgZT1iLmNyZWF0ZUVsZW1lbnQoXCJodG1sXCIpO3JldHVybiBlLmlubmVySFRNTD1hLGUucmVtb3ZlQ2hpbGQoZS5sYXN0Q2hpbGQpfXZhciBmPWdbZF18fGcuX2RlZmF1bHQsaD1mWzBdLGk9ZlsxXSxqPWZbMl0sZT1iLmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7Zm9yKGUuaW5uZXJIVE1MPWkrYStqO2gtLTspZT1lLmxhc3RDaGlsZDtpZihlLmZpcnN0Q2hpbGQ9PWUubGFzdENoaWxkKXJldHVybiBlLnJlbW92ZUNoaWxkKGUuZmlyc3RDaGlsZCk7Zm9yKHZhciBrPWIuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO2UuZmlyc3RDaGlsZDspay5hcHBlbmRDaGlsZChlLnJlbW92ZUNoaWxkKGUuZmlyc3RDaGlsZCkpO3JldHVybiBrfWIuZXhwb3J0cz1kO3ZhciBlLGY9ITE7XCJ1bmRlZmluZWRcIiE9dHlwZW9mIGRvY3VtZW50JiYoZT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpLGUuaW5uZXJIVE1MPScgIDxsaW5rLz48dGFibGU+PC90YWJsZT48YSBocmVmPVwiL2FcIj5hPC9hPjxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIi8+JyxmPSFlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwibGlua1wiKS5sZW5ndGgsZT12b2lkIDApO3ZhciBnPXtsZWdlbmQ6WzEsXCI8ZmllbGRzZXQ+XCIsXCI8L2ZpZWxkc2V0PlwiXSx0cjpbMixcIjx0YWJsZT48dGJvZHk+XCIsXCI8L3Rib2R5PjwvdGFibGU+XCJdLGNvbDpbMixcIjx0YWJsZT48dGJvZHk+PC90Ym9keT48Y29sZ3JvdXA+XCIsXCI8L2NvbGdyb3VwPjwvdGFibGU+XCJdLF9kZWZhdWx0OmY/WzEsXCJYPGRpdj5cIixcIjwvZGl2PlwiXTpbMCxcIlwiLFwiXCJdfTtnLnRkPWcudGg9WzMsXCI8dGFibGU+PHRib2R5Pjx0cj5cIixcIjwvdHI+PC90Ym9keT48L3RhYmxlPlwiXSxnLm9wdGlvbj1nLm9wdGdyb3VwPVsxLCc8c2VsZWN0IG11bHRpcGxlPVwibXVsdGlwbGVcIj4nLFwiPC9zZWxlY3Q+XCJdLGcudGhlYWQ9Zy50Ym9keT1nLmNvbGdyb3VwPWcuY2FwdGlvbj1nLnRmb290PVsxLFwiPHRhYmxlPlwiLFwiPC90YWJsZT5cIl0sZy5wb2x5bGluZT1nLmVsbGlwc2U9Zy5wb2x5Z29uPWcuY2lyY2xlPWcudGV4dD1nLmxpbmU9Zy5wYXRoPWcucmVjdD1nLmc9WzEsJzxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZlcnNpb249XCIxLjFcIj4nLFwiPC9zdmc+XCJdfSx7fV0sMjpbZnVuY3Rpb24oYSxiLGMpe2Z1bmN0aW9uIGQoYSxiKXtcIm9iamVjdFwiIT10eXBlb2YgYj9iPXtoYXNoOiEhYn06dm9pZCAwPT09Yi5oYXNoJiYoYi5oYXNoPSEwKTtmb3IodmFyIGM9Yi5oYXNoP3t9OlwiXCIsZD1iLnNlcmlhbGl6ZXJ8fChiLmhhc2g/ZzpoKSxlPWEmJmEuZWxlbWVudHM/YS5lbGVtZW50czpbXSxmPU9iamVjdC5jcmVhdGUobnVsbCksaz0wO2s8ZS5sZW5ndGg7KytrKXt2YXIgbD1lW2tdO2lmKChiLmRpc2FibGVkfHwhbC5kaXNhYmxlZCkmJmwubmFtZSYmai50ZXN0KGwubm9kZU5hbWUpJiYhaS50ZXN0KGwudHlwZSkpe3ZhciBtPWwubmFtZSxuPWwudmFsdWU7aWYoXCJjaGVja2JveFwiIT09bC50eXBlJiZcInJhZGlvXCIhPT1sLnR5cGV8fGwuY2hlY2tlZHx8KG49dm9pZCAwKSxiLmVtcHR5KXtpZihcImNoZWNrYm94XCIhPT1sLnR5cGV8fGwuY2hlY2tlZHx8KG49XCJcIiksXCJyYWRpb1wiPT09bC50eXBlJiYoZltsLm5hbWVdfHxsLmNoZWNrZWQ/bC5jaGVja2VkJiYoZltsLm5hbWVdPSEwKTpmW2wubmFtZV09ITEpLCFuJiZcInJhZGlvXCI9PWwudHlwZSljb250aW51ZX1lbHNlIGlmKCFuKWNvbnRpbnVlO2lmKFwic2VsZWN0LW11bHRpcGxlXCIhPT1sLnR5cGUpYz1kKGMsbSxuKTtlbHNle249W107Zm9yKHZhciBvPWwub3B0aW9ucyxwPSExLHE9MDtxPG8ubGVuZ3RoOysrcSl7dmFyIHI9b1txXSxzPWIuZW1wdHkmJiFyLnZhbHVlLHQ9ci52YWx1ZXx8cztyLnNlbGVjdGVkJiZ0JiYocD0hMCxjPWIuaGFzaCYmXCJbXVwiIT09bS5zbGljZShtLmxlbmd0aC0yKT9kKGMsbStcIltdXCIsci52YWx1ZSk6ZChjLG0sci52YWx1ZSkpfSFwJiZiLmVtcHR5JiYoYz1kKGMsbSxcIlwiKSl9fX1pZihiLmVtcHR5KWZvcih2YXIgbSBpbiBmKWZbbV18fChjPWQoYyxtLFwiXCIpKTtyZXR1cm4gY31mdW5jdGlvbiBlKGEpe3ZhciBiPVtdLGM9L14oW15cXFtcXF1dKikvLGQ9bmV3IFJlZ0V4cChrKSxlPWMuZXhlYyhhKTtmb3IoZVsxXSYmYi5wdXNoKGVbMV0pO251bGwhPT0oZT1kLmV4ZWMoYSkpOyliLnB1c2goZVsxXSk7cmV0dXJuIGJ9ZnVuY3Rpb24gZihhLGIsYyl7aWYoMD09PWIubGVuZ3RoKXJldHVybiBhPWM7dmFyIGQ9Yi5zaGlmdCgpLGU9ZC5tYXRjaCgvXlxcWyguKz8pXFxdJC8pO2lmKFwiW11cIj09PWQpcmV0dXJuIGE9YXx8W10sQXJyYXkuaXNBcnJheShhKT9hLnB1c2goZihudWxsLGIsYykpOihhLl92YWx1ZXM9YS5fdmFsdWVzfHxbXSxhLl92YWx1ZXMucHVzaChmKG51bGwsYixjKSkpLGE7aWYoZSl7dmFyIGc9ZVsxXSxoPStnO2lzTmFOKGgpPyhhPWF8fHt9LGFbZ109ZihhW2ddLGIsYykpOihhPWF8fFtdLGFbaF09ZihhW2hdLGIsYykpfWVsc2UgYVtkXT1mKGFbZF0sYixjKTtyZXR1cm4gYX1mdW5jdGlvbiBnKGEsYixjKXt2YXIgZD1iLm1hdGNoKGspO2lmKGQpe3ZhciBnPWUoYik7ZihhLGcsYyl9ZWxzZXt2YXIgaD1hW2JdO2g/KEFycmF5LmlzQXJyYXkoaCl8fChhW2JdPVtoXSksYVtiXS5wdXNoKGMpKTphW2JdPWN9cmV0dXJuIGF9ZnVuY3Rpb24gaChhLGIsYyl7cmV0dXJuIGM9Yy5yZXBsYWNlKC8oXFxyKT9cXG4vZyxcIlxcclxcblwiKSxjPWVuY29kZVVSSUNvbXBvbmVudChjKSxjPWMucmVwbGFjZSgvJTIwL2csXCIrXCIpLGErKGE/XCImXCI6XCJcIikrZW5jb2RlVVJJQ29tcG9uZW50KGIpK1wiPVwiK2N9dmFyIGk9L14oPzpzdWJtaXR8YnV0dG9ufGltYWdlfHJlc2V0fGZpbGUpJC9pLGo9L14oPzppbnB1dHxzZWxlY3R8dGV4dGFyZWF8a2V5Z2VuKS9pLGs9LyhcXFtbXlxcW1xcXV0qXFxdKS9nO2IuZXhwb3J0cz1kfSx7fV0sMzpbZnVuY3Rpb24oYSxiLGMpe3ZhciBkPWEoXCJkb21pZnlcIiksZT1hKFwiZm9ybS1zZXJpYWxpemVcIiksZj1mdW5jdGlvbihhKXt2YXIgYj1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZm9ybVwiKTtiLmNsYXNzTGlzdC5hZGQoXCJ2ZXgtZGlhbG9nLWZvcm1cIik7dmFyIGM9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtjLmNsYXNzTGlzdC5hZGQoXCJ2ZXgtZGlhbG9nLW1lc3NhZ2VcIiksYy5hcHBlbmRDaGlsZChhLm1lc3NhZ2UgaW5zdGFuY2VvZiB3aW5kb3cuTm9kZT9hLm1lc3NhZ2U6ZChhLm1lc3NhZ2UpKTt2YXIgZT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO3JldHVybiBlLmNsYXNzTGlzdC5hZGQoXCJ2ZXgtZGlhbG9nLWlucHV0XCIpLGUuYXBwZW5kQ2hpbGQoYS5pbnB1dCBpbnN0YW5jZW9mIHdpbmRvdy5Ob2RlP2EuaW5wdXQ6ZChhLmlucHV0KSksYi5hcHBlbmRDaGlsZChjKSxiLmFwcGVuZENoaWxkKGUpLGJ9LGc9ZnVuY3Rpb24oYSl7dmFyIGI9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtiLmNsYXNzTGlzdC5hZGQoXCJ2ZXgtZGlhbG9nLWJ1dHRvbnNcIik7Zm9yKHZhciBjPTA7YzxhLmxlbmd0aDtjKyspe3ZhciBkPWFbY10sZT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO2UudHlwZT1kLnR5cGUsZS50ZXh0Q29udGVudD1kLnRleHQsZS5jbGFzc05hbWU9ZC5jbGFzc05hbWUsZS5jbGFzc0xpc3QuYWRkKFwidmV4LWRpYWxvZy1idXR0b25cIiksMD09PWM/ZS5jbGFzc0xpc3QuYWRkKFwidmV4LWZpcnN0XCIpOmM9PT1hLmxlbmd0aC0xJiZlLmNsYXNzTGlzdC5hZGQoXCJ2ZXgtbGFzdFwiKSxmdW5jdGlvbihhKXtlLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLGZ1bmN0aW9uKGIpe2EuY2xpY2smJmEuY2xpY2suY2FsbCh0aGlzLGIpfS5iaW5kKHRoaXMpKX0uYmluZCh0aGlzKShkKSxiLmFwcGVuZENoaWxkKGUpfXJldHVybiBifSxoPWZ1bmN0aW9uKGEpe3ZhciBiPXtuYW1lOlwiZGlhbG9nXCIsb3BlbjpmdW5jdGlvbihiKXt2YXIgYz1PYmplY3QuYXNzaWduKHt9LHRoaXMuZGVmYXVsdE9wdGlvbnMsYik7Yy51bnNhZmVNZXNzYWdlJiYhYy5tZXNzYWdlP2MubWVzc2FnZT1jLnVuc2FmZU1lc3NhZ2U6Yy5tZXNzYWdlJiYoYy5tZXNzYWdlPWEuX2VzY2FwZUh0bWwoYy5tZXNzYWdlKSk7dmFyIGQ9Yy51bnNhZmVDb250ZW50PWYoYyksZT1hLm9wZW4oYyksaD1jLmJlZm9yZUNsb3NlJiZjLmJlZm9yZUNsb3NlLmJpbmQoZSk7aWYoZS5vcHRpb25zLmJlZm9yZUNsb3NlPWZ1bmN0aW9uKCl7dmFyIGE9IWh8fGgoKTtyZXR1cm4gYSYmYy5jYWxsYmFjayh0aGlzLnZhbHVlfHwhMSksYX0uYmluZChlKSxkLmFwcGVuZENoaWxkKGcuY2FsbChlLGMuYnV0dG9ucykpLGUuZm9ybT1kLGQuYWRkRXZlbnRMaXN0ZW5lcihcInN1Ym1pdFwiLGMub25TdWJtaXQuYmluZChlKSksYy5mb2N1c0ZpcnN0SW5wdXQpe3ZhciBpPWUuY29udGVudEVsLnF1ZXJ5U2VsZWN0b3IoXCJidXR0b24sIGlucHV0LCBzZWxlY3QsIHRleHRhcmVhXCIpO2kmJmkuZm9jdXMoKX1yZXR1cm4gZX0sYWxlcnQ6ZnVuY3Rpb24oYSl7cmV0dXJuXCJzdHJpbmdcIj09dHlwZW9mIGEmJihhPXttZXNzYWdlOmF9KSxhPU9iamVjdC5hc3NpZ24oe30sdGhpcy5kZWZhdWx0T3B0aW9ucyx0aGlzLmRlZmF1bHRBbGVydE9wdGlvbnMsYSksdGhpcy5vcGVuKGEpfSxjb25maXJtOmZ1bmN0aW9uKGEpe2lmKFwib2JqZWN0XCIhPXR5cGVvZiBhfHxcImZ1bmN0aW9uXCIhPXR5cGVvZiBhLmNhbGxiYWNrKXRocm93IG5ldyBFcnJvcihcImRpYWxvZy5jb25maXJtKG9wdGlvbnMpIHJlcXVpcmVzIG9wdGlvbnMuY2FsbGJhY2suXCIpO3JldHVybiBhPU9iamVjdC5hc3NpZ24oe30sdGhpcy5kZWZhdWx0T3B0aW9ucyx0aGlzLmRlZmF1bHRDb25maXJtT3B0aW9ucyxhKSx0aGlzLm9wZW4oYSl9LHByb21wdDpmdW5jdGlvbihiKXtpZihcIm9iamVjdFwiIT10eXBlb2YgYnx8XCJmdW5jdGlvblwiIT10eXBlb2YgYi5jYWxsYmFjayl0aHJvdyBuZXcgRXJyb3IoXCJkaWFsb2cucHJvbXB0KG9wdGlvbnMpIHJlcXVpcmVzIG9wdGlvbnMuY2FsbGJhY2suXCIpO3ZhciBjPU9iamVjdC5hc3NpZ24oe30sdGhpcy5kZWZhdWx0T3B0aW9ucyx0aGlzLmRlZmF1bHRQcm9tcHRPcHRpb25zKSxkPXt1bnNhZmVNZXNzYWdlOic8bGFiZWwgZm9yPVwidmV4XCI+JythLl9lc2NhcGVIdG1sKGIubGFiZWx8fGMubGFiZWwpK1wiPC9sYWJlbD5cIixpbnB1dDonPGlucHV0IG5hbWU9XCJ2ZXhcIiB0eXBlPVwidGV4dFwiIGNsYXNzPVwidmV4LWRpYWxvZy1wcm9tcHQtaW5wdXRcIiBwbGFjZWhvbGRlcj1cIicrYS5fZXNjYXBlSHRtbChiLnBsYWNlaG9sZGVyfHxjLnBsYWNlaG9sZGVyKSsnXCIgdmFsdWU9XCInK2EuX2VzY2FwZUh0bWwoYi52YWx1ZXx8Yy52YWx1ZSkrJ1wiIC8+J307Yj1PYmplY3QuYXNzaWduKGMsZCxiKTt2YXIgZT1iLmNhbGxiYWNrO3JldHVybiBiLmNhbGxiYWNrPWZ1bmN0aW9uKGEpe2lmKFwib2JqZWN0XCI9PXR5cGVvZiBhKXt2YXIgYj1PYmplY3Qua2V5cyhhKTthPWIubGVuZ3RoP2FbYlswXV06XCJcIn1lKGEpfSx0aGlzLm9wZW4oYil9fTtyZXR1cm4gYi5idXR0b25zPXtZRVM6e3RleHQ6XCJPS1wiLHR5cGU6XCJzdWJtaXRcIixjbGFzc05hbWU6XCJ2ZXgtZGlhbG9nLWJ1dHRvbi1wcmltYXJ5XCIsY2xpY2s6ZnVuY3Rpb24oKXt0aGlzLnZhbHVlPSEwfX0sTk86e3RleHQ6XCJDYW5jZWxcIix0eXBlOlwiYnV0dG9uXCIsY2xhc3NOYW1lOlwidmV4LWRpYWxvZy1idXR0b24tc2Vjb25kYXJ5XCIsY2xpY2s6ZnVuY3Rpb24oKXt0aGlzLnZhbHVlPSExLHRoaXMuY2xvc2UoKX19fSxiLmRlZmF1bHRPcHRpb25zPXtjYWxsYmFjazpmdW5jdGlvbigpe30sYWZ0ZXJPcGVuOmZ1bmN0aW9uKCl7fSxtZXNzYWdlOlwiXCIsaW5wdXQ6XCJcIixidXR0b25zOltiLmJ1dHRvbnMuWUVTLGIuYnV0dG9ucy5OT10sc2hvd0Nsb3NlQnV0dG9uOiExLG9uU3VibWl0OmZ1bmN0aW9uKGEpe3JldHVybiBhLnByZXZlbnREZWZhdWx0KCksdGhpcy5vcHRpb25zLmlucHV0JiYodGhpcy52YWx1ZT1lKHRoaXMuZm9ybSx7aGFzaDohMH0pKSx0aGlzLmNsb3NlKCl9LGZvY3VzRmlyc3RJbnB1dDohMH0sYi5kZWZhdWx0QWxlcnRPcHRpb25zPXtidXR0b25zOltiLmJ1dHRvbnMuWUVTXX0sYi5kZWZhdWx0UHJvbXB0T3B0aW9ucz17bGFiZWw6XCJQcm9tcHQ6XCIscGxhY2Vob2xkZXI6XCJcIix2YWx1ZTpcIlwifSxiLmRlZmF1bHRDb25maXJtT3B0aW9ucz17fSxifTtiLmV4cG9ydHM9aH0se2RvbWlmeToxLFwiZm9ybS1zZXJpYWxpemVcIjoyfV19LHt9LFszXSkoMyl9KX0pLmNhbGwodGhpcyxcInVuZGVmaW5lZFwiIT10eXBlb2YgZ2xvYmFsP2dsb2JhbDpcInVuZGVmaW5lZFwiIT10eXBlb2Ygc2VsZj9zZWxmOlwidW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3c/d2luZG93Ont9KX0se2RvbWlmeToyLFwiZm9ybS1zZXJpYWxpemVcIjo0fV0sNjpbZnVuY3Rpb24oYSxiLGMpe3ZhciBkPWEoXCIuL3ZleFwiKTtkLnJlZ2lzdGVyUGx1Z2luKGEoXCJ2ZXgtZGlhbG9nXCIpKSxiLmV4cG9ydHM9ZH0se1wiLi92ZXhcIjo3LFwidmV4LWRpYWxvZ1wiOjV9XSw3OltmdW5jdGlvbihhLGIsYyl7YShcImNsYXNzbGlzdC1wb2x5ZmlsbFwiKSxhKFwiZXM2LW9iamVjdC1hc3NpZ25cIikucG9seWZpbGwoKTt2YXIgZD1hKFwiZG9taWZ5XCIpLGU9ZnVuY3Rpb24oYSl7aWYoXCJ1bmRlZmluZWRcIiE9dHlwZW9mIGEpe3ZhciBiPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7cmV0dXJuIGIuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoYSkpLGIuaW5uZXJIVE1MfXJldHVyblwiXCJ9LGY9ZnVuY3Rpb24oYSxiKXtpZihcInN0cmluZ1wiPT10eXBlb2YgYiYmMCE9PWIubGVuZ3RoKWZvcih2YXIgYz1iLnNwbGl0KFwiIFwiKSxkPTA7ZDxjLmxlbmd0aDtkKyspe3ZhciBlPWNbZF07ZS5sZW5ndGgmJmEuY2xhc3NMaXN0LmFkZChlKX19LGc9ZnVuY3Rpb24oKXt2YXIgYT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpLGI9e1dlYmtpdEFuaW1hdGlvbjpcIndlYmtpdEFuaW1hdGlvbkVuZFwiLE1vekFuaW1hdGlvbjpcImFuaW1hdGlvbmVuZFwiLE9BbmltYXRpb246XCJvYW5pbWF0aW9uZW5kXCIsbXNBbmltYXRpb246XCJNU0FuaW1hdGlvbkVuZFwiLGFuaW1hdGlvbjpcImFuaW1hdGlvbmVuZFwifTtmb3IodmFyIGMgaW4gYilpZih2b2lkIDAhPT1hLnN0eWxlW2NdKXJldHVybiBiW2NdO3JldHVybiExfSgpLGg9e3ZleDpcInZleFwiLGNvbnRlbnQ6XCJ2ZXgtY29udGVudFwiLG92ZXJsYXk6XCJ2ZXgtb3ZlcmxheVwiLGNsb3NlOlwidmV4LWNsb3NlXCIsY2xvc2luZzpcInZleC1jbG9zaW5nXCIsb3BlbjpcInZleC1vcGVuXCJ9LGk9e30saj0xLGs9ITEsbD17b3BlbjpmdW5jdGlvbihhKXt2YXIgYj1mdW5jdGlvbihhKXtjb25zb2xlLndhcm4oJ1RoZSBcIicrYSsnXCIgcHJvcGVydHkgaXMgZGVwcmVjYXRlZCBpbiB2ZXggMy4gVXNlIENTUyBjbGFzc2VzIGFuZCB0aGUgYXBwcm9wcmlhdGUgXCJDbGFzc05hbWVcIiBvcHRpb25zLCBpbnN0ZWFkLicpLGNvbnNvbGUud2FybihcIlNlZSBodHRwOi8vZ2l0aHViLmh1YnNwb3QuY29tL3ZleC9hcGkvYWR2YW5jZWQvI29wdGlvbnNcIil9O2EuY3NzJiZiKFwiY3NzXCIpLGEub3ZlcmxheUNTUyYmYihcIm92ZXJsYXlDU1NcIiksYS5jb250ZW50Q1NTJiZiKFwiY29udGVudENTU1wiKSxhLmNsb3NlQ1NTJiZiKFwiY2xvc2VDU1NcIik7dmFyIGM9e307Yy5pZD1qKyssaVtjLmlkXT1jLGMuaXNPcGVuPSEwLGMuY2xvc2U9ZnVuY3Rpb24oKXtmdW5jdGlvbiBhKGEpe3JldHVyblwibm9uZVwiIT09ZC5nZXRQcm9wZXJ0eVZhbHVlKGErXCJhbmltYXRpb24tbmFtZVwiKSYmXCIwc1wiIT09ZC5nZXRQcm9wZXJ0eVZhbHVlKGErXCJhbmltYXRpb24tZHVyYXRpb25cIil9aWYoIXRoaXMuaXNPcGVuKXJldHVybiEwO3ZhciBiPXRoaXMub3B0aW9ucztpZihrJiYhYi5lc2NhcGVCdXR0b25DbG9zZXMpcmV0dXJuITE7dmFyIGM9ZnVuY3Rpb24oKXtyZXR1cm4hYi5iZWZvcmVDbG9zZXx8Yi5iZWZvcmVDbG9zZS5jYWxsKHRoaXMpfS5iaW5kKHRoaXMpKCk7aWYoYz09PSExKXJldHVybiExO3RoaXMuaXNPcGVuPSExO3ZhciBkPXdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRoaXMuY29udGVudEVsKSxlPWEoXCJcIil8fGEoXCItd2Via2l0LVwiKXx8YShcIi1tb3otXCIpfHxhKFwiLW8tXCIpLGY9ZnVuY3Rpb24gaigpe3RoaXMucm9vdEVsLnBhcmVudE5vZGUmJih0aGlzLnJvb3RFbC5yZW1vdmVFdmVudExpc3RlbmVyKGcsaiksZGVsZXRlIGlbdGhpcy5pZF0sdGhpcy5yb290RWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLnJvb3RFbCksYi5hZnRlckNsb3NlJiZiLmFmdGVyQ2xvc2UuY2FsbCh0aGlzKSwwPT09T2JqZWN0LmtleXMoaSkubGVuZ3RoJiZkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoaC5vcGVuKSl9LmJpbmQodGhpcyk7cmV0dXJuIGcmJmU/KHRoaXMucm9vdEVsLmFkZEV2ZW50TGlzdGVuZXIoZyxmKSx0aGlzLnJvb3RFbC5jbGFzc0xpc3QuYWRkKGguY2xvc2luZykpOmYoKSwhMH0sXCJzdHJpbmdcIj09dHlwZW9mIGEmJihhPXtjb250ZW50OmF9KSxhLnVuc2FmZUNvbnRlbnQmJiFhLmNvbnRlbnQ/YS5jb250ZW50PWEudW5zYWZlQ29udGVudDphLmNvbnRlbnQmJihhLmNvbnRlbnQ9ZShhLmNvbnRlbnQpKTt2YXIgbT1jLm9wdGlvbnM9T2JqZWN0LmFzc2lnbih7fSxsLmRlZmF1bHRPcHRpb25zLGEpLG49Yy5yb290RWw9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtuLmNsYXNzTGlzdC5hZGQoaC52ZXgpLGYobixtLmNsYXNzTmFtZSk7dmFyIG89Yy5vdmVybGF5RWw9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtvLmNsYXNzTGlzdC5hZGQoaC5vdmVybGF5KSxmKG8sbS5vdmVybGF5Q2xhc3NOYW1lKSxtLm92ZXJsYXlDbG9zZXNPbkNsaWNrJiZvLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLGZ1bmN0aW9uKGEpe2EudGFyZ2V0PT09byYmYy5jbG9zZSgpfSksbi5hcHBlbmRDaGlsZChvKTt2YXIgcD1jLmNvbnRlbnRFbD1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO2lmKHAuY2xhc3NMaXN0LmFkZChoLmNvbnRlbnQpLGYocCxtLmNvbnRlbnRDbGFzc05hbWUpLHAuYXBwZW5kQ2hpbGQobS5jb250ZW50IGluc3RhbmNlb2Ygd2luZG93Lk5vZGU/bS5jb250ZW50OmQobS5jb250ZW50KSksbi5hcHBlbmRDaGlsZChwKSxtLnNob3dDbG9zZUJ1dHRvbil7dmFyIHE9Yy5jbG9zZUVsPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7cS5jbGFzc0xpc3QuYWRkKGguY2xvc2UpLGYocSxtLmNsb3NlQ2xhc3NOYW1lKSxxLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLGMuY2xvc2UuYmluZChjKSkscC5hcHBlbmRDaGlsZChxKX1yZXR1cm4gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihtLmFwcGVuZExvY2F0aW9uKS5hcHBlbmRDaGlsZChuKSxtLmFmdGVyT3BlbiYmbS5hZnRlck9wZW4uY2FsbChjKSxkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoaC5vcGVuKSxjfSxjbG9zZTpmdW5jdGlvbihhKXt2YXIgYjtpZihhLmlkKWI9YS5pZDtlbHNle2lmKFwic3RyaW5nXCIhPXR5cGVvZiBhKXRocm93IG5ldyBUeXBlRXJyb3IoXCJjbG9zZSByZXF1aXJlcyBhIHZleCBvYmplY3Qgb3IgaWQgc3RyaW5nXCIpO2I9YX1yZXR1cm4hIWlbYl0mJmlbYl0uY2xvc2UoKX0sY2xvc2VUb3A6ZnVuY3Rpb24oKXt2YXIgYT1PYmplY3Qua2V5cyhpKTtyZXR1cm4hIWEubGVuZ3RoJiZpW2FbYS5sZW5ndGgtMV1dLmNsb3NlKCl9LGNsb3NlQWxsOmZ1bmN0aW9uKCl7Zm9yKHZhciBhIGluIGkpdGhpcy5jbG9zZShhKTtyZXR1cm4hMH0sZ2V0QWxsOmZ1bmN0aW9uKCl7cmV0dXJuIGl9LGdldEJ5SWQ6ZnVuY3Rpb24oYSl7cmV0dXJuIGlbYV19fTt3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsZnVuY3Rpb24oYSl7Mjc9PT1hLmtleUNvZGUmJihrPSEwLGwuY2xvc2VUb3AoKSxrPSExKX0pLHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicG9wc3RhdGVcIixmdW5jdGlvbigpe2wuZGVmYXVsdE9wdGlvbnMuY2xvc2VBbGxPblBvcFN0YXRlJiZsLmNsb3NlQWxsKCl9KSxsLmRlZmF1bHRPcHRpb25zPXtjb250ZW50OlwiXCIsc2hvd0Nsb3NlQnV0dG9uOiEwLGVzY2FwZUJ1dHRvbkNsb3NlczohMCxvdmVybGF5Q2xvc2VzT25DbGljazohMCxhcHBlbmRMb2NhdGlvbjpcImJvZHlcIixjbGFzc05hbWU6XCJcIixvdmVybGF5Q2xhc3NOYW1lOlwiXCIsY29udGVudENsYXNzTmFtZTpcIlwiLGNsb3NlQ2xhc3NOYW1lOlwiXCIsY2xvc2VBbGxPblBvcFN0YXRlOiEwfSxPYmplY3QuZGVmaW5lUHJvcGVydHkobCxcIl9lc2NhcGVIdG1sXCIse2NvbmZpZ3VyYWJsZTohMSxlbnVtZXJhYmxlOiExLHdyaXRhYmxlOiExLHZhbHVlOmV9KSxsLnJlZ2lzdGVyUGx1Z2luPWZ1bmN0aW9uKGEsYil7dmFyIGM9YShsKSxkPWJ8fGMubmFtZTtpZihsW2RdKXRocm93IG5ldyBFcnJvcihcIlBsdWdpbiBcIitiK1wiIGlzIGFscmVhZHkgcmVnaXN0ZXJlZC5cIik7bFtkXT1jfSxiLmV4cG9ydHM9bH0se1wiY2xhc3NsaXN0LXBvbHlmaWxsXCI6MSxkb21pZnk6MixcImVzNi1vYmplY3QtYXNzaWduXCI6M31dfSx7fSxbNl0pKDYpfSk7XG4iXX0=
