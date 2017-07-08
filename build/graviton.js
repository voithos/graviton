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

                            case _events.KEYCODES.K_B:
                                this.toggleSimStrategy();
                                break;

                            case _events.KEYCODES.K_C:
                                this.toggleCollisions();
                                break;

                            case _events.KEYCODES.K_L:
                                // Reset icon if needed
                                if (this.simTimer.active) {
                                    this.toggleSim();
                                }
                                // Clear simulation
                                this.sim.clear();
                                this.gfx.clear();
                                this.simTimer.stop();
                                retval = false;
                                break;

                            case _events.KEYCODES.K_Q:
                                this.toggleQuadTreeLines();
                                break;

                            case _events.KEYCODES.K_P:
                                this.toggleTrails();
                                break;

                            case _events.KEYCODES.K_R:
                                this.generateRandomBodies(10, { randomColors: true });
                                break;

                            case _events.KEYCODES.K_1:
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

                            case _events.KEYCODES.K_2:
                                this.generateRandomBodies(1000, {
                                    normalDistribution: true,
                                    maxRadius: 1
                                });
                                break;

                            case _events.KEYCODES.K_3:
                                this.generateRandomBodies(1000, {
                                    galacticDistribution: true,
                                    minVelX: 0.000005,
                                    maxVelX: 0.00002,
                                    minVelY: 0.000005,
                                    maxVelY: 0.00002,
                                    maxRadius: 1
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
                unsafeContent: '\n                <h3>Shortcuts</h3>\n                <table class="shortcuts">\n                    <tbody>\n                    <tr>\n                        <td>Left click</td> <td> create body</td></tr>\n                    <tr>\n                        <td>Right click</td> <td> delete body</td></tr>\n                    <tr>\n                        <td>Middle click</td> <td> change body color</td></tr>\n                    <tr>\n                        <td>Mouse wheel</td> <td> change body size/mass</td></tr>\n                    <tr>\n                        <td><code>Enter</code> key</td> <td> start simulation</td></tr>\n                    <tr>\n                        <td><code>B</code> key</td> <td> toggle brute-force/Barnes-Hut</td></tr>\n                    <tr>\n                        <td><code>C</code> key</td> <td> toggle collisions</td></tr>\n                    <tr>\n                        <td><code>L</code> key</td> <td> clear canvas</td></tr>\n                    <tr>\n                        <td><code>P</code> key</td> <td> toggle repainting</td></tr>\n                    <tr>\n                        <td><code>Q</code> key</td> <td> toggle quadtree lines</td></tr>\n                    <tr>\n                        <td><code>R</code> key</td> <td> create random bodies</td></tr>\n                    <tr>\n                        <td><code>1</code> key</td> <td> create Titan</td></tr>\n                    <tr>\n                        <td><code>2</code> key</td> <td> create spherical galaxy</td></tr>\n                    <tr>\n                        <td><code>3</code> key</td> <td> create spiral galaxy</td></tr>\n                    <tr>\n                        <td><code>?</code> key</td> <td> show help</td></tr>\n                    </tbody>\n                </table>\n                <footer class="forklink">Made in 2017. <a href="https://github.com/voithos/graviton">Fork me on GitHub</a></footer>\n                ',
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
        key: 'generateRandomBodies',
        value: function generateRandomBodies(num, args) {
            args = args || {};

            var minX = args.minX || 0;
            var maxX = args.maxX || this.options.width;
            var minY = args.minY || 0;
            var maxY = args.maxY || this.options.height;
            var halfX = (maxX - minX) / 2;
            var halfY = (maxY - minY) / 2;
            var midX = minX + halfX;
            var midY = minY + halfY;

            var minVelX = args.minVelX || 0;
            var maxVelX = args.maxVelX || 0.00001;
            var minVelY = args.minVelY || 0;
            var maxVelY = args.maxVelY || 0.00001;

            var minRadius = args.minRadius || 1;
            var maxRadius = args.maxRadius || 15;

            // Galactic args
            var numArms = args.numArms || 5;
            var armSeparation = 2 * Math.PI / numArms;
            var armOffsetMax = args.armOffsetMax || 0.5;
            var rotationFactor = args.rotationFactor || 5;
            var armRandomOffsetXY = args.armRandomOffsetXY || 0.04;

            var color = args.color;

            for (var i = 0; i < num; i++) {
                if (args.randomColors) {
                    color = _random2.default.color();
                }

                var x = undefined,
                    y = undefined,
                    velX = undefined,
                    velY = undefined;
                if (args.galacticDistribution) {
                    // Choose a distance from the center of the galaxy.
                    var dist = Math.random() > 0.5 ? Math.pow(Math.random(), 1.5) : _random2.default.normalFromTo(0, 1);

                    var angle = Math.random() * 2 * Math.PI;
                    var armOffset = Math.random() * armOffsetMax - armOffsetMax / 2;
                    var distArmOffset = armOffset / dist;
                    var squaredArmOffset = distArmOffset * distArmOffset;
                    if (armOffset < 0) {
                        squaredArmOffset *= -1;
                    }

                    var rotation = dist * rotationFactor;
                    var polarAngle = Math.floor(angle / armSeparation) * armSeparation + squaredArmOffset + rotation;

                    // Convert polar coordinates to cartesian.
                    var relX = Math.cos(polarAngle) * dist;
                    var relY = Math.sin(polarAngle) * dist;

                    relX += Math.random() * armRandomOffsetXY;
                    relY += Math.random() * armRandomOffsetXY;

                    x = midX + relX * halfX;
                    y = midY + relY * halfY;

                    // Compute velocity by rotating the angle.
                    var vectorX = Math.cos(polarAngle - Math.PI / 2);
                    var vectorY = Math.sin(polarAngle - Math.PI / 2);
                    velX = _random2.default.number(minVelX, maxVelX) * vectorX * dist;
                    velY = _random2.default.number(minVelY, maxVelY) * vectorY * dist;
                } else if (args.normalDistribution) {
                    x = _random2.default.normalFromTo(minX, maxX);
                    y = _random2.default.normalFromTo(minY, maxY);
                    velX = _random2.default.directional(minVelX, maxVelX);
                    velY = _random2.default.directional(minVelY, maxVelY);
                } else {
                    x = _random2.default.number(minX, maxX);
                    y = _random2.default.number(minY, maxY);
                    velX = _random2.default.directional(minVelX, maxVelX);
                    velY = _random2.default.directional(minVelY, maxVelY);
                }

                this.sim.addNewBody({
                    x: x,
                    y: y,
                    velX: velX,
                    velY: velY,
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
        this.scatterLimitWidth = args.scatterLimitWidth || args.width * 2;
        this.scatterLimitHeight = args.scatterLimitHeight || args.height * 2;
        this.scatterLimitStartX = (args.width - this.scatterLimitWidth) / 2;
        this.scatterLimitStartY = (args.height - this.scatterLimitHeight) / 2;
        this.scatterLimitEndX = this.scatterLimitStartX + this.scatterLimitWidth;
        this.scatterLimitEndY = this.scatterLimitStartY + this.scatterLimitHeight;

        this.bodies = [];
        // Incorporate the scatter limit
        this.tree = new _tree2.default(
        /* width */this.scatterLimitWidth,
        /* height */this.scatterLimitHeight,
        /* startX */this.scatterLimitStartX,
        /* startY */this.scatterLimitStartY);
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

                if (body.x >= this.scatterLimitEndX || body.x <= this.scatterLimitStartX || body.y >= this.scatterLimitEndY || body.y <= this.scatterLimitStartY) {
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
            var momentumX = 0;
            var momentumY = 0;
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
                    newBodyArgs.mass += body.mass;
                    newBodyArgs.color = _colors2.default.blend(newBodyArgs.color, body.color);
                    momentumX += body.mass * body.velX;
                    momentumY += body.mass * body.velY;
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

            newBodyArgs.velX = momentumX / newBodyArgs.mass;
            newBodyArgs.velY = momentumY / newBodyArgs.mass;

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

var MAX_DEPTH = 1000;

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
            var depth = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];

            if (depth > MAX_DEPTH) {
                // Something's gone wrong.
                return;
            }
            this._updateMass(body);
            var quadrant = this._getQuadrant(body.x, body.y);

            if (this.children[quadrant] instanceof GtTreeNode) {
                this.children[quadrant].addBody(body, depth + 1);
            } else if (!this.children[quadrant]) {
                this.children[quadrant] = body;
            } else {
                var existing = this.children[quadrant];
                var quadX = existing.x > this.midX ? this.midX : this.startX;
                var quadY = existing.y > this.midY ? this.midY : this.startY;
                var node = new GtTreeNode(this.halfWidth, this.halfHeight, quadX, quadY);

                node.addBody(existing, depth + 1);
                node.addBody(body, depth + 1);

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
window.mweep = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
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
     * Generate a random number from the normal distribution.
     */
    normal: function normal() {
        var u = 1 - Math.random();
        var v = 1 - Math.random();
        // Division by 3 is meant to normalize the distribution somewhat.
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) / 3;
    },

    /**
     * Generate a random number from the normal distribution between a given
     * start and end point.
     */
    normalFromTo: function normalFromTo(from) {
        var to = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

        if (to === null) {
            to = from;
            from = 0;
        }
        var gaussian = undefined;
        do {
            // Switch range from [-1, 1] to [0, 1).
            gaussian = (this.normal() + 1) / 2;
        } while (gaussian < 0 || gaussian >= 1);
        var idx = Math.floor(gaussian * 10);
        mweep[idx]++;
        return gaussian * (to - from) + from;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZ3Jhdml0b24uanMiLCJzcmMvZ3Jhdml0b24vYXBwLmpzIiwic3JjL2dyYXZpdG9uL2JvZHkuanMiLCJzcmMvZ3Jhdml0b24vZXZlbnRzLmpzIiwic3JjL2dyYXZpdG9uL2dmeC5qcyIsInNyYy9ncmF2aXRvbi9zaW0uanMiLCJzcmMvZ3Jhdml0b24vdGltZXIuanMiLCJzcmMvZ3Jhdml0b24vdHJlZS5qcyIsInNyYy9tYWluLmpzIiwic3JjL3BvbHlmaWxscy5qcyIsInNyYy91dGlsL2NvbG9ycy5qcyIsInNyYy91dGlsL2Vudi5qcyIsInNyYy91dGlsL3JhbmRvbS5qcyIsInNyYy92ZW5kb3IvanNjb2xvci5qcyIsInNyYy92ZW5kb3IvdmV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7O2tCQ2FlLEVBQUUsR0FBRyxlQUFPLEVBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUNEUixLQUFLO0FBQ3RCLGFBRGlCLEtBQUssR0FDQzs4QkFETixLQUFLOztZQUNWLElBQUkseURBQUcsRUFBRTs7QUFDakIsWUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7O0FBRWpCLFlBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ2xCLFlBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDOztBQUVqQixZQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztBQUN0QixZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQzs7QUFFckIsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7QUFDbkIsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7QUFDaEIsWUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7O0FBRWhCLFlBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0FBQ3JCLFlB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O01BQ0YsTUFBTTtBQUNOLFVBQUksRUFBRSxHQUFHLENBQ1IsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQ3hCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FDckYsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUNOLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FDcEMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxH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QUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUMxQixDQUFDO0FBQ0YsU0FBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFO0FBQ3BCLFVBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNqRDtBQUNELFNBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUNqQixVQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQzlGO0FBQ0QsU0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7OztBQUFDLEFBRzlGLFNBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pELFNBQUksQ0FBQyxHQUFHLENBQUMsQ0FB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LFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzVDLFNBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2pELFNBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2pELFNBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2pELFNBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2pELFNBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzlDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzVDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUU1QyxTQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDbkQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDNUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDakQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDckQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDckQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDcEQsU0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDNUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRTVDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzVDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDOztBQUUzQyxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM1QyxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM3QyxTQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztNQUM3Qzs7QUFFRCxTQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDOztBQUVuQixTQUFJLGFBQWEsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLGtC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Q0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxVQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDO0FBQUMsWUFBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQztBQUFDLGNBQUksQ0FBQyxHQUFDLFVBQVUsSUFBRSxPQUFPLE9BQU8sSUFBRSxPQUFPLENBQUMsSUFBRyxDQUFDLENBQUMsSUFBRSxDQUFDLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsSUFBSSxLQUFLLENBQUMsc0JBQXNCLEdBQUMsQ0FBQyxHQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU0sQ0FBQyxDQUFDLElBQUksR0FBQyxrQkFBa0IsRUFBQyxDQUFDLENBQUEsQ0FBQTtTQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFDLE9BQU8sRUFBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUMsVUFBUyxDQUFDLEVBQUM7QUFBQyxjQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQTtTQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUE7T0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUE7S0FBQyxLQUFJLElBQUksQ0FBQyxHQUFDLFVBQVUsSUFBRSxPQUFPLE9BQU8sSUFBRSxPQUFPLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxDQUFDLEVBQUU7QUFBQyxPQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FBQSxPQUFPLENBQUMsQ0FBQTtHQUFDLENBQUEsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLFVBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxnQkFBVSxJQUFHLE1BQU0sQ0FBQyxJQUFJLEtBQUcsV0FBVyxJQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEtBQUcsQ0FBQyxRQUFRLENBQUMsZUFBZSxJQUFFLFdBQVcsSUFBRyxRQUFRLENBQUMsZUFBZSxDQUFDLDRCQUE0QixFQUFDLEdBQUcsQ0FBQyxDQUFBLEFBQUMsR0FBQyxDQUFDLENBQUEsWUFBVTtBQUFDLG9CQUFZLENBQUM7QUFBQSxZQUFJLENBQUMsR0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUEsRUFBQztBQUFDLGNBQUksQ0FBQyxHQUFDLFdBQVMsQ0FBQyxFQUFDO0FBQUMsZ0JBQUksQ0FBQyxHQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBQyxVQUFTLENBQUMsRUFBQztBQUFDLGtCQUFJLENBQUM7a0JBQUMsQ0FBQyxHQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSSxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFFO0FBQUMsaUJBQUMsR0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLENBQUE7ZUFB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QUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUE7V0FBQyxFQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUMsWUFBVTtBQUFDLGdCQUFJLENBQUM7Z0JBQUMsQ0FBQztnQkFBQyxDQUFDLEdBQUMsU0FBUztnQkFBQyxDQUFDLEdBQUMsQ0FBQztnQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU07Z0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDO0FBQUcsbUJBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxLQUFHLENBQUMsQ0FBQztBQUFFLG9CQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLENBQUM7ZUFBQTtxQkFBTSxFQUFFLENBQUMsR0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFBO1dBQUMsRUFBQyxDQUFDLENBQUMsTUFBTSxHQUFDLFVBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLGFBQUMsSUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEtBQUcsQ0FBQyxDQUFDLElBQUUsUUFBUSxHQUFDLENBQUMsS0FBRyxDQUFDLENBQUMsSUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsS0FBRyxDQUFDLENBQUMsSUFBRSxDQUFDLEtBQUcsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFBO1dBQUMsRUFBQyxDQUFDLENBQUMsUUFBUSxHQUFDLFlBQVU7QUFBQyxtQkFBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1dBQUMsRUFBQyxDQUFDLENBQUMsY0FBYyxDQUFBLEVBQUM7QUFBQyxnQkFBSSxDQUFDLEdBQUMsRUFBQyxHQUFHLEVBQUMsQ0FBQyxFQUFDLFVBQVUsRUFBQyxDQUFDLENBQUMsRUFBQyxZQUFZLEVBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxJQUFHO0FBQUMsZUFBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBO2FBQUMsQ0FBQSxPQUFNLENBQUMsRUFBQztBQUFDLGVBQUMsQ0FBQyxNQUFNLEtBQUcsQ0FBQyxVQUFVLEtBQUcsQ0FBQyxDQUFDLFVBQVUsR0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxDQUFBO2FBQUM7V0FBQyxNQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsSUFBRSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBO1NBQUM7T0FBQyxDQUFBLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBLEFBQUMsQ0FBQTtLQUFDLEVBQUMsRUFBRSxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsVUFBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLGVBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxZQUFHLFFBQVEsSUFBRSxPQUFPLENBQUMsRUFBQyxNQUFNLElBQUksU0FBUyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxLQUFHLENBQUMsR0FBQyxRQUFRLENBQUEsQUFBQyxDQUFDLElBQUksQ0FBQyxHQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLENBQUMsRUFBQyxPQUFPLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLE1BQU0sSUFBRSxDQUFDLEVBQUM7QUFBQyxjQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUE7U0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLFFBQVE7WUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFJLENBQUMsQ0FBQyxTQUFTLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFFO0FBQUUsV0FBQyxHQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7U0FBQSxJQUFHLENBQUMsQ0FBQyxVQUFVLElBQUUsQ0FBQyxDQUFDLFNBQVMsRUFBQyxPQUFPLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLHNCQUFzQixFQUFFLEVBQUMsQ0FBQyxDQUFDLFVBQVU7QUFBRSxXQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7U0FBQSxPQUFPLENBQUMsQ0FBQTtPQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztVQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLElBQUUsT0FBTyxRQUFRLEtBQUcsQ0FBQyxHQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFNBQVMsR0FBQyxvRUFBb0UsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFDLENBQUMsR0FBQyxLQUFLLENBQUMsQ0FBQSxBQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsRUFBQyxNQUFNLEVBQUMsQ0FBQyxDQUFDLEVBQUMsWUFBWSxFQUFDLGFBQWEsQ0FBQyxFQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsRUFBQyxnQkFBZ0IsRUFBQyxrQkFBa0IsQ0FBQyxFQUFDLEdBQUcsRUFBQyxDQUFDLENBQUMsRUFBQyxrQ0FBa0MsRUFBQyxxQkFBcUIsQ0FBQyxFQUFDLFFBQVEsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUMsUUFBUSxFQUFDLFFBQVEsQ0FBQyxHQUFDLENBQUMsQ0FBQyxFQUFDLEVBQUUsRUFBQyxFQUFFLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBQyxDQUFDLENBQUMsRUFBQyxvQkFBb0IsRUFBQyx1QkFBdUIsQ0FBQyxFQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBQyxDQUFDLENBQUMsRUFBQyw4QkFBOEIsRUFBQyxXQUFXLENBQUMsRUFBQyxDQUFDLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUMsQ0FBQyxDQUFDLEVBQUMsU0FBUyxFQUFDLFVBQVUsQ0FBQyxFQUFDLENBQUMsQ0FBQyxRQUFRLEdBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxFQUFDLHdEQUF3RCxFQUFDLFFBQVEsQ0FBQyxDQUFBO0tBQUMsRUFBQyxFQUFFLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxVQUFTLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsa0JBQVksQ0FBQztBQUFBLGVBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxZQUFHLEtBQUssQ0FBQyxLQUFHLENBQUMsSUFBRSxJQUFJLEtBQUcsQ0FBQyxFQUFDLE1BQU0sSUFBSSxTQUFTLENBQUMseUNBQXlDLENBQUMsQ0FBQyxLQUFJLElBQUksQ0FBQyxHQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxTQUFTLENBQUMsTUFBTSxFQUFDLENBQUMsRUFBRSxFQUFDO0FBQUMsY0FBSSxDQUFDLEdBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsS0FBSyxDQUFDLEtBQUcsQ0FBQyxJQUFFLElBQUksS0FBRyxDQUFDLEVBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEVBQUUsRUFBQztBQUFDLGdCQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUFDLENBQUMsR0FBQyxNQUFNLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFHLENBQUMsSUFBRSxDQUFDLENBQUMsVUFBVSxLQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxDQUFBO1dBQUM7U0FBQyxPQUFPLENBQUMsQ0FBQTtPQUFDLFNBQVMsQ0FBQyxHQUFFO0FBQUMsY0FBTSxDQUFDLE1BQU0sSUFBRSxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBQyxRQUFRLEVBQUMsRUFBQyxVQUFVLEVBQUMsQ0FBQyxDQUFDLEVBQUMsWUFBWSxFQUFDLENBQUMsQ0FBQyxFQUFDLFFBQVEsRUFBQyxDQUFDLENBQUMsRUFBQyxLQUFLLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQTtPQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsRUFBQyxNQUFNLEVBQUMsQ0FBQyxFQUFDLFFBQVEsRUFBQyxDQUFDLEVBQUMsQ0FBQTtLQUFDLEVBQUMsRUFBRSxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsVUFBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLGVBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxnQkFBUSxZQUFTLENBQUMseUNBQUQsQ0FBQyxFQUFBLEdBQUMsQ0FBQyxHQUFDLEVBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsR0FBQyxLQUFLLENBQUMsS0FBRyxDQUFDLENBQUMsSUFBSSxLQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxFQUFFLEdBQUMsRUFBRSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsVUFBVSxLQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQSxBQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsUUFBUSxHQUFDLENBQUMsQ0FBQyxRQUFRLEdBQUMsRUFBRSxFQUFDLENBQUMsR0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUMsRUFBRSxDQUFDLEVBQUM7QUFBQyxjQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLElBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFBLElBQUcsQ0FBQyxDQUFDLElBQUksSUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFDO0FBQUMsZ0JBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJO2dCQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUcsVUFBVSxLQUFHLENBQUMsQ0FBQyxJQUFJLElBQUUsT0FBTyxLQUFHLENBQUMsQ0FBQyxJQUFJLElBQUUsQ0FBQyxDQUFDLE9BQU8sS0FBRyxDQUFDLEdBQUMsS0FBSyxDQUFDLENBQUEsQUFBQyxFQUFDLENBQUMsQ0FBQyxLQUFLLENBQUEsRUFBQztBQUFDLG1CQUFHLFVBQVUsS0FBRyxDQUFDLENBQUMsSUFBSSxJQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUcsQ0FBQyxHQUFDLEVBQUUsQ0FBQSxBQUFDLEVBQUMsT0FBTyxLQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBRSxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxPQUFPLEtBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLEVBQUMsQ0FBQyxDQUFDLElBQUUsT0FBTyxJQUFFLENBQUMsQ0FBQyxJQUFJLENBQUEsRUFBQyxTQUFRO2FBQUMsTUFBSyxJQUFHLENBQUMsQ0FBQyxFQUFDLFNBQVMsSUFBRyxpQkFBaUIsS0FBRyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxLQUFJO0FBQUMsZUFBQyxHQUFDLEVBQUUsQ0FBQyxLQUFJLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUMsRUFBRSxDQUFDLEVBQUM7QUFBQyxvQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssSUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLO29CQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxJQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxJQUFFLENBQUMsS0FBRyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLElBQUUsSUFBSSxLQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQSxBQUFDLENBQUE7ZUFBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsS0FBSyxLQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxFQUFFLENBQUMsQ0FBQSxBQUFDLENBQUE7YUFBQztXQUFDO1NBQUMsSUFBRyxDQUFDLENBQUMsS0FBSyxFQUFDLEtBQUksSUFBSSxDQUFDLElBQUksQ0FBQztBQUFDLFdBQUMsQ0FBQyxDQUFDLENBQUMsS0FBRyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsRUFBRSxDQUFDLENBQUEsQUFBQyxDQUFDO1NBQUEsT0FBTyxDQUFDLENBQUE7T0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUM7QUFBQyxZQUFJLENBQUMsR0FBQyxFQUFFO1lBQUMsQ0FBQyxHQUFDLGFBQWE7WUFBQyxDQUFDLEdBQUMsSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxJQUFJLE1BQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQztBQUFFLFdBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FBQSxPQUFPLENBQUMsQ0FBQTtPQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsWUFBRyxDQUFDLEtBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBQyxPQUFPLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRTtZQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUcsSUFBSSxLQUFHLENBQUMsRUFBQyxPQUFPLENBQUMsR0FBQyxDQUFDLElBQUUsRUFBRSxFQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLE9BQU8sSUFBRSxFQUFFLEVBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLEVBQUMsQ0FBQyxDQUFDLElBQUcsQ0FBQyxFQUFDO0FBQUMsY0FBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztjQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxHQUFDLENBQUMsSUFBRSxFQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBLElBQUcsQ0FBQyxHQUFDLENBQUMsSUFBRSxFQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsQ0FBQTtTQUFDLE1BQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFBO09BQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxZQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsQ0FBQyxFQUFDO0FBQUMsY0FBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBO1NBQUMsTUFBSTtBQUFDLGNBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQSxHQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUE7U0FBQyxPQUFPLENBQUMsQ0FBQTtPQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsZUFBTyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUMsTUFBTSxDQUFDLEVBQUMsQ0FBQyxHQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBQyxHQUFHLENBQUMsRUFBQyxDQUFDLElBQUUsQ0FBQyxHQUFDLEdBQUcsR0FBQyxFQUFFLENBQUEsQUFBQyxHQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxHQUFDLEdBQUcsR0FBQyxDQUFDLENBQUE7T0FBQyxJQUFJLENBQUMsR0FBQyx1Q0FBdUM7VUFBQyxDQUFDLEdBQUMsb0NBQW9DO1VBQUMsQ0FBQyxHQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFBO0tBQUMsRUFBQyxFQUFFLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxVQUFTLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsT0FBQyxVQUFTLENBQUMsRUFBQztBQUFDLFNBQUMsQ0FBQSxVQUFTLENBQUMsRUFBQztBQUFDLGNBQUcsUUFBUSxZQUFTLENBQUMseUNBQUQsQ0FBQyxFQUFBLElBQUUsV0FBVyxJQUFFLE9BQU8sQ0FBQyxFQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxJQUFHLFVBQVUsSUFBRSxPQUFPLENBQUMsSUFBRSxDQUFDLENBQUMsR0FBRyxFQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSTtBQUFDLGdCQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUMsV0FBVyxJQUFFLE9BQU8sTUFBTSxHQUFDLE1BQU0sR0FBQyxXQUFXLElBQUUsT0FBTyxDQUFDLEdBQUMsQ0FBQyxHQUFDLFdBQVcsSUFBRSxPQUFPLElBQUksR0FBQyxJQUFJLEdBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxTQUFTLEdBQUMsQ0FBQyxFQUFFLENBQUE7V0FBQztTQUFDLENBQUEsQ0FBQyxZQUFVO0FBQUMsaUJBQU8sQ0FBQSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLHFCQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsa0JBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUM7QUFBQyxvQkFBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQztBQUFDLHNCQUFJLENBQUMsR0FBQyxVQUFVLElBQUUsT0FBTyxDQUFDLElBQUUsQ0FBQyxDQUFDLElBQUcsQ0FBQyxDQUFDLElBQUUsQ0FBQyxFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsQ0FBQyxFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLElBQUksS0FBSyxDQUFDLHNCQUFzQixHQUFDLENBQUMsR0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFNLENBQUMsQ0FBQyxJQUFJLEdBQUMsa0JBQWtCLEVBQUMsQ0FBQyxDQUFBLENBQUE7aUJBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUMsT0FBTyxFQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxVQUFTLENBQUMsRUFBQztBQUFDLHNCQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQTtpQkFBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsT0FBTyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBO2VBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFBO2FBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxVQUFVLElBQUUsT0FBTyxDQUFDLElBQUUsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUMsQ0FBQyxFQUFFO0FBQUMsZUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQUEsT0FBTyxDQUFDLENBQUE7V0FBQyxDQUFBLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxVQUFTLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsdUJBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxvQkFBRyxRQUFRLElBQUUsT0FBTyxDQUFDLEVBQUMsTUFBTSxJQUFJLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsS0FBRyxDQUFDLEdBQUMsUUFBUSxDQUFBLEFBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsQ0FBQyxDQUFDLEVBQUMsT0FBTyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxNQUFNLElBQUUsQ0FBQyxFQUFDO0FBQUMsc0JBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxHQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQTtpQkFBQyxJQUFJLENBQUMsR0FBQyxD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QUMsQ0FBQyxHQUFDLEVBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsR0FBQyxLQUFLLENBQUMsS0FBRyxDQUFDLENBQUMsSUFBSSxLQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxFQUFFLEdBQUMsRUFBRSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsVUFBVSxLQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQSxBQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsUUFBUSxHQUFDLENBQUMsQ0FBQyxRQUFRLEdBQUMsRUFBRSxFQUFDLENBQUMsR0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUMsRUFBRSxDQUFDLEVBQUM7QUFBQyxzQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxJQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQSxJQUFHLENBQUMsQ0FBQyxJQUFJLElBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBQztBQUFDLHdCQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSTt3QkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFHLFVBQVUsS0FBRyxDQUFDLENBQUMsSUFBSSxJQUFFLE9BQU8sS0FBRyxDQUFDLENBQUMsSUFBSSxJQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUcsQ0FBQyxHQUFDLEtBQUssQ0FBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLENBQUMsS0FBSyxDQUFBLEVBQUM7QUFBQywyQkFBRyxVQUFVLEtBQUcsQ0FBQyxDQUFDLElBQUksSUFBRSxDQUFDLENBQUMsT0FBTyxLQUFHLENBQUMsR0FBQyxFQUFFLENBQUEsQUFBQyxFQUFDLE9BQU8sS0FBRyxDQUFDLENBQUMsSUFBSSxLQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUUsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsT0FBTyxLQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxFQUFDLENBQUMsQ0FBQyxJQUFFLE9BQU8sSUFBRSxDQUFDLENBQUMsSUFBSSxDQUFBLEVBQUMsU0FBUTtxQkFBQyxNQUFLLElBQUcsQ0FBQyxDQUFDLEVBQUMsU0FBUyxJQUFHLGlCQUFpQixLQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUk7QUFBQyx1QkFBQyxHQUFDLEVBQUUsQ0FBQyxLQUFJLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUMsRUFBRSxDQUFDLEVBQUM7QUFBQyw0QkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssSUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLOzRCQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxJQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxJQUFFLENBQUMsS0FBRyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxJQUFJLElBQUUsSUFBSSxLQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQSxBQUFDLENBQUE7dUJBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLEtBQUssS0FBRyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsRUFBRSxDQUFDLENBQUEsQUFBQyxDQUFBO3FCQUFDO21CQUFDO2lCQUFDLElBQUcsQ0FBQyxDQUFDLEtBQUssRUFBQyxLQUFJLElBQUksQ0FBQyxJQUFJLENBQUM7QUFBQyxtQkFBQyxDQUFDLENBQUMsQ0FBQyxLQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxFQUFFLENBQUMsQ0FBQSxBQUFDLENBQUM7aUJBQUEsT0FBTyxDQUFDLENBQUE7ZUFBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUM7QUFBQyxvQkFBSSxDQUFDLEdBQUMsRUFBRTtvQkFBQyxDQUFDLEdBQUMsYUFBYTtvQkFBQyxDQUFDLEdBQUMsSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsSUFBSSxNQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUM7QUFBRSxtQkFBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFBQSxPQUFPLENBQUMsQ0FBQTtlQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsb0JBQUcsQ0FBQyxLQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUMsT0FBTyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUU7b0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBRyxJQUFJLEtBQUcsQ0FBQyxFQUFDLE9BQU8sQ0FBQyxHQUFDLENBQUMsSUFBRSxFQUFFLEVBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsT0FBTyxJQUFFLEVBQUUsRUFBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsRUFBQyxDQUFDLENBQUMsSUFBRyxDQUFDLEVBQUM7QUFBQyxzQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztzQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsR0FBQyxDQUFDLElBQUUsRUFBRSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQSxJQUFHLENBQUMsR0FBQyxDQUFDLElBQUUsRUFBRSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLENBQUE7aUJBQUMsTUFBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFD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O2tCQUFDLENBQUMsR0FBQyxTQUFGLENBQUMsQ0FBVSxDQUFDLEVBQUM7QUFBQyxvQkFBSSxDQUFDLEdBQUMsRUFBQyxJQUFJLEVBQUMsUUFBUSxFQUFDLElBQUksRUFBQyxjQUFTLENBQUMsRUFBQztBQUFDLHdCQUFJLENBQUMsR0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBQyxJQUFJLENBQUMsY0FBYyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLElBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLGFBQWEsR0FBQyxDQUFDLENBQUMsT0FBTyxLQUFHLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUEsQUFBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxhQUFhLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7d0JBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxXQUFXLElBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVcsR0FBQyxDQUFBLFlBQVU7QUFBQywwQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFBO3FCQUFDLENBQUEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQSxFQUFDO0FBQUMsMEJBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLGlDQUFpQyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtxQkFBQyxPQUFPLENBQUMsQ0FBQTttQkFBQyxFQUFDLEtBQUssRUFBQyxlQUFTLENBQUMsRUFBQztBQUFDLDJCQUFNLFFBQVEsSUFBRSxPQUFPLENBQUMsS0FBRyxDQUFDLEdBQUMsRUFBQyxPQUFPLEVBQUMsQ0FBQyxFQUFDLENBQUEsQUFBQyxFQUFDLENBQUMsR0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBQyxJQUFJLENBQUMsY0FBYyxFQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBQyxDQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO21CQUFDLEVBQUMsT0FBTyxFQUFDLGlCQUFTLENBQUMsRUFBQztBQUFDLHdCQUFHLFFBQVEsWUFBUyxDQUFDLHlDQUFELENBQUMsRUFBQSxJQUFFLFVBQVUsSUFBRSxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxvREFBb0QsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFDLElBQUksQ0FBQyxjQUFjLEVBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFDLENBQUMsQ0FBQyxFQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7bUJBQUMsRUFBQyxNQUFNLEVBQUMsZ0JBQVMsQ0FBQyxFQUFDO0FBQUMsd0JBQUcsUUFBUSxZQUFTLENBQUMseUNBQUQsQ0FBQyxFQUFBLElBQUUsVUFBVSxJQUFFLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBQyxNQUFNLElBQUksS0FBSyxDQUFDLG1EQUFtRCxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUMsSUFBSSxDQUFDLGNBQWMsRUFBQyxJQUFJLENBQUMsb0JBQW9CLENBQUM7d0JBQUMsQ0FBQyxHQUFDLEVBQUMsYUFBYSxFQUFDLG1CQUFtQixHQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUMsVUFBVSxFQUFDLEtBQUssRUFBQyw2RUFBNkUsR0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxXQUFXLElBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFDLFdBQVcsR0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFDLE1BQU0sRUFBQyxDQUFDLENBQUMsR0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFRLEdBQUMsVUFBUyxDQUFDLEVBQUM7QUFBQywwQkFBRyxRQUFRLFlBQVMsQ0FBQyx5Q0FBRCxDQUFDLEVBQUEsRUFBQztBQUFDLDRCQUFJLENBQUMsR0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUE7dUJBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO3FCQUFDLEVBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTttQkFBQyxFQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxHQUFDLEVBQUMsR0FBRyxFQUFDLEVBQUMsSUFBSSxFQUFDLElBQUksRUFBQyxJQUFJLEVBQUMsUUFBUSxFQUFDLFNBQVMsRUFBQywyQkFBMkIsRUFBQyxLQUFLLEVBQUMsaUJBQVU7QUFBQywwQkFBSSxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsQ0FBQTtxQkFBQyxFQUFDLEVBQUMsRUFBRSxFQUFDLEVBQUMsSUFBSSxFQUFDLFFBQVEsRUFBQyxJQUFJLEVBQUMsUUFBUSxFQUFDLFNBQVMsRUFBQyw2QkFBNkIsRUFBQyxLQUFLLEVBQUMsaUJBQVU7QUFBQywwQkFBSSxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUE7cUJBQUMsRUFBQyxFQUFDLEVBQUMsQ0FBQyxDQUFDLGNBQWMsR0FBQyxFQUFDLFFBQVEsRUFBQyxvQkFBVSxFQUFFLEVBQUMsU0FBUyxFQUFDLHFCQUFVLEVBQUUsRUFBQyxPQUFPLEVBQUMsRUFBRSxFQUFDLEtBQUssRUFBQyxFQUFFLEVBQUMsT0FBTyxFQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBQyxlQUFlLEVBQUMsQ0FBQyxDQUFDLEVBQUMsUUFBUSxFQUFDLGtCQUFTLENBQUMsRUFBQztBQUFDLDJCQUFPLENBQUMsQ0FBQyxjQUFjLEVBQUUsRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssS0FBRyxJQUFJLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFDLEVBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQSxBQUFDLEVBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFBO21CQUFDLEVBQUMsZUFBZSxFQUFDLENBQUMsQ0FBQyxFQUFDLEVBQUMsQ0FBQyxDQUFDLG1CQUFtQixHQUFDLEVBQUMsT0FBTyxFQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBQyxFQUFDLENBQUMsQ0FBQyxvQkFBb0IsR0FBQyxFQUFDLEtBQUssRUFBQyxTQUFTLEVBQUMsV0FBVyxFQUFDLEVBQUUsRUFBQyxLQUFLLEVBQUMsRUFBRSxFQUFDLEVBQUMsQ0FBQyxDQUFDLHFCQUFxQixHQUFDLEVBQUUsRUFBQyxDQUFDLENBQUE7ZUFBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFBO2FBQUMsRUFBQyxFQUFDLE1BQU0sRUFBQyxDQUFDLEVBQUMsZ0JBQWdCLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxFQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7U0FBQyxDQUFDLENBQUE7T0FBQyxDQUFBLENBQUUsSUFBSSxDQUFDLElBQUksRUFBQyxXQUFXLElBQUUsT0FBTyxNQUFNLEdBQUMsTUFBTSxHQUFDLFdBQVcsSUFBRSxPQUFPLElBQUksR0FBQyxJQUFJLEdBQUMsV0FBVyxJQUFFLE9BQU8sTUFBTSxHQUFDLE1BQU0sR0FBQyxFQUFFLENBQUMsQ0FBQTtLQUFDLEVBQUMsRUFBQyxNQUFNLEVBQUMsQ0FBQyxFQUFDLGdCQUFnQixFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsVUFBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLFVBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFBO0tBQUMsRUFBQyxFQUFDLE9BQU8sRUFBQyxDQUFDLEVBQUMsWUFBWSxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsVUFBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLE9BQUMsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxRQUFRLENBQUM7VUFBQyxDQUFDLEdBQUMsU0FBRixDQUFDLENBQVUsQ0FBQyxFQUFDO0FBQUMsWUFBRyxXQUFXLElBQUUsT0FBTyxDQUFDLEVBQUM7QUFBQyxjQUFJLENBQUMsR0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQTtTQUFDLE9BQU0sRUFBRSxDQUFBO09BQUM7VUFBQyxDQUFDLEdBQUMsU0FBRixDQUFDLENBQVUsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLFlBQUcsUUFBUSxJQUFFLE9BQU8sQ0FBQyxJQUFFLENBQUMsS0FBRyxDQUFDLENBQUMsTUFBTSxFQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxFQUFDLENBQUMsRUFBRSxFQUFDO0FBQUMsY0FBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7U0FBQztPQUFDO1VBQUMsQ0FBQyxHQUFDLENBQUEsWUFBVTtBQUFDLFlBQUksQ0FBQyxHQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO1lBQUMsQ0FBQyxHQUFDLEVBQUMsZUFBZSxFQUFDLG9CQUFvQixFQUFDLFlBQVksRUFBQyxjQUFjLEVBQUMsVUFBVSxFQUFDLGVBQWUsRUFBQyxXQUFXLEVBQUMsZ0JBQWdCLEVBQUMsU0FBUyxFQUFDLGNBQWMsRUFBQyxDQUFDLEtBQUksSUFBSSxDQUFDLElBQUksQ0FBQztBQUFDLGNBQUcsS0FBSyxDQUFDLEtBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUFBLE9BQU0sQ0FBQyxDQUFDLENBQUE7T0FBQyxDQUFBLEVBQUU7VUFBQyxDQUFDLEdBQUMsRUFBQyxHQUFHLEVBQUMsS0FBSyxFQUFDLE9BQU8sRUFBQyxhQUFhLEVBQUMsT0FBTyxFQUFDLGFBQWEsRUFBQyxLQUFLLEVBQUMsV0FBVyxFQUFDLE9BQU8sRUFBQyxhQUFhLEVBQUMsSUFBSSxFQUFDLFVBQVUsRUFBQztVQUFDLENBQUMsR0FBQyxFQUFFO1VBQUMsQ0FBQyxHQUFDLENBQUM7VUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDO1VBQUMsQ0FBQyxHQUFDLEVBQUMsSUFBSSxFQUFDLGNBQVMsQ0FBQyxFQUFDO0FBQUMsY0FBSSxDQUFDLEdBQUMsU0FBRixDQUFDLENBQVUsQ0FBQyxFQUFDO0FBQUMsbUJBQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxHQUFDLENBQUMsR0FBQyxzR0FBc0csQ0FBQyxFQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMseURBQXlELENBQUMsQ0FBQTtXQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFVBQVUsSUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLEVBQUMsQ0FBQyxDQUFDLFVBQVUsSUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLEVBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUMsQ0FBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsS0FBSyxHQUFDLFlBQVU7QUFBQyxxQkFBUyxDQUFDLENBQUMsQ0FBQyxFQUFDO0FBQUMscUJBQU0sTUFBTSxLQUFHLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUMsZ0JBQWdCLENBQUMsSUFBRSxJQUFJLEtBQUcsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBQyxvQkFBb0IsQ0FBQyxDQUFBO2FBQUMsSUFBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUMsT0FBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUcsQ0FBQyxJQUFFLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixFQUFDLE9BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQSxZQUFVO0FBQUMscUJBQU0sQ0FBQyxDQUFDLENBQUMsV0FBVyxJQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO2FBQUMsQ0FBQSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUcsQ0FBQyxLQUFHLENBQUMsQ0FBQyxFQUFDLE9BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFBQyxDQUFDLEdBQUMsQ0FBQSxTQUFTLENBQUMsR0FBRTtBQUFDLGtCQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsS0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsRUFBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBQyxDQUFDLENBQUMsVUFBVSxJQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsS0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBLEFBQUMsQ0FBQTthQUFDLENBQUEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUUsQ0FBQyxJQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxFQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUEsR0FBRSxDQUFDLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQTtXQUFDLEVBQUMsUUFBUSxJQUFFLE9BQU8sQ0FBQyxLQUFHLENBQUMsR0FBQyxFQUFDLE9BQU8sRUFBQyxDQUFDLEVBQUMsQ0FBQSxBQUFDLEVBQUMsQ0FBQyxDQUFDLGFBQWEsSUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsYUFBYSxHQUFDLENBQUMsQ0FBQyxPQUFPLEtBQUcsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFBLEFBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFDLENBQUMsQ0FBQyxjQUFjLEVBQUMsQ0FBQyxDQUFDO2NBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLFNBQVMsR0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFDLENBQUMsQ0FBQyxvQkFBb0IsSUFBRSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsYUFBQyxDQUFDLE1BQU0sS0FBRyxDQUFDLElBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFBO1dBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLFNBQVMsR0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLEVBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsT0FBTyxZQUFZLE1BQU0sQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsZUFBZSxDQUFBLEVBQUM7QUFBQyxnQkFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsRUFBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtXQUFDLE9BQU8sUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxTQUFTLElBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBQyxDQUFDLENBQUE7U0FBQyxFQUFDLEtBQUssRUFBQyxlQUFTLENBQUMsRUFBQztBQUFDLGNBQUksQ0FBQyxDQUFDLElBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFJO0FBQUMsZ0JBQUcsUUFBUSxJQUFFLE9BQU8sQ0FBQyxFQUFDLE1BQU0sSUFBSSxTQUFTLENBQUMsMENBQTBDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBO1dBQUMsT0FBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtTQUFDLEVBQUMsUUFBUSxFQUFDLG9CQUFVO0FBQUMsY0FBSSxDQUFDLEdBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFBO1NBQUMsRUFBQyxRQUFRLEVBQUMsb0JBQVU7QUFBQyxlQUFJLElBQUksQ0FBQyxJQUFJLENBQUM7QUFBQyxnQkFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztXQUFBLE9BQU0sQ0FBQyxDQUFDLENBQUE7U0FBQyxFQUFDLE1BQU0sRUFBQyxrQkFBVTtBQUFDLGlCQUFPLENBQUMsQ0FBQTtTQUFDLEVBQUMsT0FBTyxFQUFDLGlCQUFTLENBQUMsRUFBQztBQUFDLGlCQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtTQUFDLEVBQUMsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsVUFBRSxLQUFHLENBQUMsQ0FBQyxPQUFPLEtBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxDQUFBO09BQUMsQ0FBQyxFQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUMsWUFBVTtBQUFDLFNBQUMsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLElBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFBO09BQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxjQUFjLEdBQUMsRUFBQyxPQUFPLEVBQUMsRUFBRSxFQUFDLGVBQWUsRUFBQyxDQUFDLENBQUMsRUFBQyxrQkFBa0IsRUFBQyxDQUFDLENBQUMsRUFBQyxvQkFBb0IsRUFBQyxDQUFDLENBQUMsRUFBQyxjQUFjLEVBQUMsTUFBTSxFQUFDLFNBQVMsRUFBQyxFQUFFLEVBQUMsZ0JBQWdCLEVBQUMsRUFBRSxFQUFDLGdCQUFnQixFQUFDLEVBQUUsRUFBQyxjQUFjLEVBQUMsRUFBRSxFQUFDLGtCQUFrQixFQUFDLENBQUMsQ0FBQyxFQUFDLEVBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUMsYUFBYSxFQUFDLEVBQUMsWUFBWSxFQUFDLENBQUMsQ0FBQyxFQUFDLFVBQVUsRUFBQyxDQUFDLENBQUMsRUFBQyxRQUFRLEVBQUMsQ0FBQyxDQUFDLEVBQUMsS0FBSyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLGNBQWMsR0FBQyxVQUFTLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxZQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQUMsQ0FBQyxHQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsU0FBUyxHQUFDLENBQUMsR0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUE7T0FBQyxFQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUMsQ0FBQyxDQUFBO0tBQUMsRUFBQyxFQUFDLG9CQUFvQixFQUFDLENBQUMsRUFBQyxNQUFNLEVBQUMsQ0FBQyxFQUFDLG1CQUFtQixFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsRUFBQyxFQUFFLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0NBQUMsQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogZ3Jhdml0b25cbiAqXG4gKiBKYXZhU2NyaXB0IE4tYm9keSBHcmF2aXRhdGlvbmFsIFNpbXVsYXRvclxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBaYXZlbiBNdXJhZHlhblxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlXG4gKlxuICogUmV2aXNpb246XG4gKiAgQFJFVklTSU9OXG4gKi9cbmltcG9ydCBHdEFwcCBmcm9tICcuL2dyYXZpdG9uL2FwcCc7XG5cbmV4cG9ydCBkZWZhdWx0IHsgYXBwOiBHdEFwcCB9O1xuIiwiLyoqXG4gKiBncmF2aXRvbi9hcHAgLS0gVGhlIGludGVyYWN0aXZlIGdyYXZpdG9uIGFwcGxpY2F0aW9uXG4gKi9cbi8qIGdsb2JhbCBqc2NvbG9yICovXG5cbmltcG9ydCB2ZXggZnJvbSAnLi4vdmVuZG9yL3ZleCc7XG5pbXBvcnQgcmFuZG9tIGZyb20gJy4uL3V0aWwvcmFuZG9tJztcbmltcG9ydCBHdFNpbSBmcm9tICcuL3NpbSc7XG5pbXBvcnQgR3RHZnggZnJvbSAnLi9nZngnO1xuaW1wb3J0IEd0RXZlbnRzLCB7IEtFWUNPREVTLCBFVkVOVENPREVTLCBDT05UUk9MQ09ERVMgfSBmcm9tICcuL2V2ZW50cyc7XG5pbXBvcnQgR3RUaW1lciBmcm9tICcuL3RpbWVyJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR3RBcHAge1xuICAgIGNvbnN0cnVjdG9yKGFyZ3MgPSB7fSkge1xuICAgICAgICB0aGlzLmFyZ3MgPSBhcmdzO1xuXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IHt9O1xuICAgICAgICB0aGlzLmdyaWQgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuYW5pbVRpbWVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5zaW1UaW1lciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5ldmVudHMgPSBudWxsO1xuICAgICAgICB0aGlzLnNpbSA9IG51bGw7XG4gICAgICAgIHRoaXMuZ2Z4ID0gbnVsbDtcblxuICAgICAgICB0aGlzLm5vY2xlYXIgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5xdWFkVHJlZUxpbmVzID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaW50ZXJhY3Rpb24gPSB7cHJldmlvdXM6IHt9fTtcbiAgICAgICAgdGhpcy50YXJnZXRCb2R5ID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLndhc0NvbG9yUGlja2VyQWN0aXZlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNIZWxwT3BlbiA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMub3B0aW9ucy53aWR0aCA9IGFyZ3Mud2lkdGggPSBhcmdzLndpZHRoIHx8IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgICAgICB0aGlzLm9wdGlvbnMuaGVpZ2h0ID0gYXJncy5oZWlnaHQgPSBhcmdzLmhlaWdodCB8fCB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgICAgIHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3IgPSBhcmdzLmJhY2tncm91bmRDb2xvciB8fCAnIzFGMjYzQic7XG5cbiAgICAgICAgLy8gUmV0cmlldmUgY2FudmFzLCBvciBidWlsZCBvbmUgd2l0aCBhcmd1bWVudHNcbiAgICAgICAgdGhpcy5ncmlkID0gdHlwZW9mIGFyZ3MuZ3JpZCA9PT0gJ3N0cmluZycgP1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYXJncy5ncmlkKSA6XG4gICAgICAgICAgICBhcmdzLmdyaWQ7XG5cbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmdyaWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRlR3JpZCh0aGlzLm9wdGlvbnMud2lkdGgsIHRoaXMub3B0aW9ucy5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgIHtiYWNrZ3JvdW5kQ29sb3I6IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3J9KTtcbiAgICAgICAgICAgIGFyZ3MuZ3JpZCA9IHRoaXMuZ3JpZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29udHJvbHMgPSB0eXBlb2YgYXJncy5jb250cm9scyA9PT0gJ3N0cmluZycgP1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYXJncy5jb250cm9scykgOlxuICAgICAgICAgICAgYXJncy5jb250cm9scztcblxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuY29udHJvbHMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRlQ29udHJvbHMoKTtcbiAgICAgICAgICAgIGFyZ3MuY29udHJvbHMgPSB0aGlzLmNvbnRyb2xzO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wbGF5QnRuID0gYXJncy5wbGF5QnRuID0gdGhpcy5jb250cm9scy5xdWVyeVNlbGVjdG9yKCcjcGxheWJ0bicpO1xuICAgICAgICB0aGlzLnBhdXNlQnRuID0gYXJncy5wYXVzZUJ0biA9IHRoaXMuY29udHJvbHMucXVlcnlTZWxlY3RvcignI3BhdXNlYnRuJyk7XG4gICAgICAgIHRoaXMuYmFybmVzSHV0T25CdG4gPSBhcmdzLmJhcm5lc0h1dE9uQnRuID0gdGhpcy5jb250cm9scy5xdWVyeVNlbGVjdG9yKCcjYmFybmVzaHV0b25idG4nKTtcbiAgICAgICAgdGhpcy5iYXJuZXNIdXRPZmZCdG4gPSBhcmdzLmJhcm5lc0h1dE9mZkJ0biA9IHRoaXMuY29udHJvbHMucXVlcnlTZWxlY3RvcignI2Jhcm5lc2h1dG9mZmJ0bicpO1xuICAgICAgICB0aGlzLnF1YWRUcmVlT2ZmQnRuID0gYXJncy5xdWFkVHJlZU9mZkJ0biA9IHRoaXMuY29udHJvbHMucXVlcnlTZWxlY3RvcignI3F1YWR0cmVlb2ZmYnRuJyk7XG4gICAgICAgIHRoaXMucXVhZFRyZWVPbkJ0biA9IGFyZ3MucXVhZFRyZWVPbkJ0biA9IHRoaXMuY29udHJvbHMucXVlcnlTZWxlY3RvcignI3F1YWR0cmVlb25idG4nKTtcbiAgICAgICAgdGhpcy5jb2xsaXNpb25zT2ZmQnRuID0gYXJncy5jb2xsaXNpb25zT2ZmQnRuID1cbiAgICAgICAgICAgIHRoaXMuY29udHJvbHMucXVlcnlTZWxlY3RvcignI2NvbGxpc2lvbnNvZmZidG4nKTtcbiAgICAgICAgdGhpcy5jb2xsaXNpb25zT25CdG4gPSBhcmdzLmNvbGxpc2lvbnNPbkJ0biA9XG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyNjb2xsaXNpb25zb25idG4nKTtcbiAgICAgICAgdGhpcy50cmFpbE9mZkJ0biA9IGFyZ3MudHJhaWxPZmZCdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyN0cmFpbG9mZmJ0bicpO1xuICAgICAgICB0aGlzLnRyYWlsT25CdG4gPSBhcmdzLnRyYWlsT25CdG4gPSB0aGlzLmNvbnRyb2xzLnF1ZXJ5U2VsZWN0b3IoJyN0cmFpbG9uYnRuJyk7XG4gICAgICAgIHRoaXMuaGVscEJ0biA9IGFyZ3MuaGVscEJ0biA9IHRoaXMuY29udHJvbHMucXVlcnlTZWxlY3RvcignI2hlbHBidG4nKTtcblxuICAgICAgICB0aGlzLmNvbG9yUGlja2VyID0gdHlwZW9mIGFyZ3MuY29sb3JQaWNrZXIgPT09ICdzdHJpbmcnID9cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGFyZ3MuY29sb3JQaWNrZXIpIDpcbiAgICAgICAgICAgIGFyZ3MuY29sb3JQaWNrZXI7XG5cbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmNvbG9yUGlja2VyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5jb2xvclBpY2tlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgICAgICB0aGlzLmNvbG9yUGlja2VyLmNsYXNzTmFtZSA9ICdib2R5Y29sb3JwaWNrZXInO1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmNvbG9yUGlja2VyKTtcbiAgICAgICAgICAgIGFyZ3MuY29sb3JQaWNrZXIgPSB0aGlzLmNvbG9yUGlja2VyO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuanNjb2xvciA9IG5ldyBqc2NvbG9yKHRoaXMuY29sb3JQaWNrZXIsIHtcbiAgICAgICAgICAgIHBhZGRpbmc6IDAsXG4gICAgICAgICAgICBzaGFkb3c6IGZhbHNlLFxuICAgICAgICAgICAgYm9yZGVyV2lkdGg6IDAsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICBpbnNldENvbG9yOiAnIzNkNTU5ZScsXG4gICAgICAgICAgICBvbkZpbmVDaGFuZ2U6IHRoaXMudXBkYXRlQ29sb3IuYmluZCh0aGlzKVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLm1ldGFJbmZvID0gdHlwZW9mIGFyZ3MubWV0YUluZm8gPT09ICdzdHJpbmcnID9cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGFyZ3MubWV0YUluZm8pIDpcbiAgICAgICAgICAgIGFyZ3MubWV0YUluZm87XG5cbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm1ldGFJbmZvID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5tZXRhSW5mbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgICAgIHRoaXMubWV0YUluZm8uY2xhc3NOYW1lID0gJ21ldGFpbmZvJztcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5tZXRhSW5mbyk7XG4gICAgICAgICAgICBhcmdzLm1ldGFJbmZvID0gdGhpcy5tZXRhSW5mbztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEluaXRpYWxpemVcbiAgICAgICAgdGhpcy5pbml0Q29tcG9uZW50cygpO1xuICAgICAgICB0aGlzLmluaXRUaW1lcnMoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBtYWluIC0tIE1haW4gJ2dhbWUnIGxvb3BcbiAgICAgKi9cbiAgICBtYWluKCkge1xuICAgICAgICAvLyBFdmVudCBwcm9jZXNzaW5nXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgdGhpcy5ldmVudHMucWdldCgpLmZvckVhY2goZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGxldCByZXR2YWw7XG5cbiAgICAgICAgICAgIHN3aXRjaCAoZXZlbnQudHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgRVZFTlRDT0RFUy5NT1VTRURPV046XG4gICAgICAgICAgICAgICAgICAgIGlmIChldmVudC5idXR0b24gPT09IC8qIHJpZ2h0IGNsaWNrICovIDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBib2R5LlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0Qm9keSAmJiAhdGhpcy5pbnRlcmFjdGlvbi5zdGFydGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaW0ucmVtb3ZlQm9keSh0aGlzLnRhcmdldEJvZHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0VGFyZ2V0Qm9keSh1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGV2ZW50LmJ1dHRvbiA9PT0gLyogbWlkZGxlIGNsaWNrICovIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENvbG9yIHBpY2tpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnRhcmdldEJvZHkgJiYgIXRoaXMuaW50ZXJhY3Rpb24uc3RhcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29sb3JQaWNrZXIuc3R5bGUubGVmdCA9IGV2ZW50LnBvc2l0aW9uLnggKyAncHgnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29sb3JQaWNrZXIuc3R5bGUudG9wID0gZXZlbnQucG9zaXRpb24ueSArICdweCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5qc2NvbG9yLmZyb21TdHJpbmcodGhpcy50YXJnZXRCb2R5LmNvbG9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmpzY29sb3Iuc2hvdygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgeyAvKiBsZWZ0IGNsaWNrICovXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBCYXNlIHRoZSBjaGVjayBvbiB0aGUgcHJldmlvdXMgdmFsdWUsIGluIGNhc2UgdGhlIGNvbG9yIHBpY2tlciB3YXMganVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2xvc2VkLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLndhc0NvbG9yUGlja2VyQWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIGZsYWcgdG8gc2lnbmFsIG90aGVyIGV2ZW50c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJhY3Rpb24uc3RhcnRlZCA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50YXJnZXRCb2R5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJhY3Rpb24uYm9keSA9IHRoaXMudGFyZ2V0Qm9keTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLmJvZHkgPSB0aGlzLnNpbS5hZGROZXdCb2R5KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IGV2ZW50LnBvc2l0aW9uLngsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiBldmVudC5wb3NpdGlvbi55XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJhY3Rpb24ucHJldmlvdXMueCA9IGV2ZW50LnBvc2l0aW9uLng7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcmFjdGlvbi5wcmV2aW91cy55ID0gZXZlbnQucG9zaXRpb24ueTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBwaWNrZXIuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pc0NvbG9yUGlja2VyQWN0aXZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7IC8vIGVuZCBNT1VTRURPV05cblxuICAgICAgICAgICAgICAgIGNhc2UgRVZFTlRDT0RFUy5NT1VTRVVQOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5pbnRlcmFjdGlvbi5zdGFydGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGJvZHkgPSB0aGlzLmludGVyYWN0aW9uLmJvZHk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2ZWxYID0gKGV2ZW50LnBvc2l0aW9uLnggLSBib2R5LngpICogMC4wMDAwMDAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZlbFkgPSAoZXZlbnQucG9zaXRpb24ueSAtIGJvZHkueSkgKiAwLjAwMDAwMDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXaGVuIHRoZSBzaW11bGF0aW9uIGlzIGFjdGl2ZSwgYWRkIHRoZSB2ZWxvY2l0eSB0byB0aGUgY3VycmVudCB2ZWxvY2l0eVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW5zdGVhZCBvZiBjb21wbGV0ZWx5IHJlc2V0dGluZyBpdCAodG8gYWxsb3cgZm9yIG1vcmUgaW50ZXJlc3RpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGludGVyYWN0aW9ucykuXG4gICAgICAgICAgICAgICAgICAgICAgICBib2R5LnZlbFggPSB0aGlzLnNpbVRpbWVyLmFjdGl2ZSA/IGJvZHkudmVsWCArIHZlbFggOiB2ZWxYO1xuICAgICAgICAgICAgICAgICAgICAgICAgYm9keS52ZWxZID0gdGhpcy5zaW1UaW1lci5hY3RpdmUgPyBib2R5LnZlbFkgKyB2ZWxZIDogdmVsWTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRhcmdldChldmVudC5wb3NpdGlvbi54LCBldmVudC5wb3NpdGlvbi55KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIEVWRU5UQ09ERVMuTU9VU0VNT1ZFOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLnByZXZpb3VzLnggPSBldmVudC5wb3NpdGlvbi54O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVyYWN0aW9uLnByZXZpb3VzLnkgPSBldmVudC5wb3NpdGlvbi55O1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaW50ZXJhY3Rpb24uc3RhcnRlZCAmJiAhdGhpcy5pc0NvbG9yUGlja2VyQWN0aXZlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlVGFyZ2V0KGV2ZW50LnBvc2l0aW9uLngsIGV2ZW50LnBvc2l0aW9uLnkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrOyAvLyBlbmQgTU9VU0VNT1ZFXG5cbiAgICAgICAgICAgICAgICBjYXNlIEVWRU5UQ09ERVMuTU9VU0VXSEVFTDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0Qm9keSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50YXJnZXRCb2R5LmFkanVzdFNpemUoZXZlbnQuZGVsdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVNZXRhSW5mbygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrOyAvLyBlbmQgTU9VU0VXSEVFTFxuXG4gICAgICAgICAgICAgICAgY2FzZSBFVkVOVENPREVTLktFWURPV046XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoZXZlbnQua2V5Y29kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBLRVlDT0RFUy5LX0VOVEVSOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlU2ltKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgS0VZQ09ERVMuS19COlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlU2ltU3RyYXRlZ3koKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBLRVlDT0RFUy5LX0M6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVDb2xsaXNpb25zKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgS0VZQ09ERVMuS19MOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlc2V0IGljb24gaWYgbmVlZGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc2ltVGltZXIuYWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlU2ltKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENsZWFyIHNpbXVsYXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNpbS5jbGVhcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ2Z4LmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaW1UaW1lci5zdG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dmFsID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgS0VZQ09ERVMuS19ROlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlUXVhZFRyZWVMaW5lcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEtFWUNPREVTLktfUDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVRyYWlscygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEtFWUNPREVTLktfUjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdlbmVyYXRlUmFuZG9tQm9kaWVzKDEwLCB7cmFuZG9tQ29sb3JzOiB0cnVlfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgS0VZQ09ERVMuS18xOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2ltLmFkZE5ld0JvZHkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiB0aGlzLm9wdGlvbnMud2lkdGggLyAyLCB5OiB0aGlzLm9wdGlvbnMuaGVpZ2h0IC8gMixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVsWDogMCwgdmVsWTogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFzczogMjAwMCwgcmFkaXVzOiA1MCwgY29sb3I6ICcjNUE1QTVBJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2ltLmFkZE5ld0JvZHkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiB0aGlzLm9wdGlvbnMud2lkdGggLSA0MDAsIHk6IHRoaXMub3B0aW9ucy5oZWlnaHQgLyAyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZWxYOiAwLCB2ZWxZOiAwLjAwMDAyNSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFzczogMSwgcmFkaXVzOiA1LCBjb2xvcjogJyM3ODc4NzgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgS0VZQ09ERVMuS18yOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVSYW5kb21Cb2RpZXMoMTAwMCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3JtYWxEaXN0cmlidXRpb246IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heFJhZGl1czogMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEtFWUNPREVTLktfMzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdlbmVyYXRlUmFuZG9tQm9kaWVzKDEwMDAsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FsYWN0aWNEaXN0cmlidXRpb246IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pblZlbFg6IDAuMDAwMDA1LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhWZWxYOiAwLjAwMDAyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5WZWxZOiAwLjAwMDAwNSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4VmVsWTogMC4wMDAwMixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4UmFkaXVzOiAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgS0VZQ09ERVMuS19RVUVTVElPTk1BUks6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93SGVscCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrOyAvLyBlbmQgS0VZRE9XTlxuXG4gICAgICAgICAgICAgICAgY2FzZSBDT05UUk9MQ09ERVMuUExBWUJUTjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVTaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5QQVVTRUJUTjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVTaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5CQVJORVNIVVRPTkJUTjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVTaW1TdHJhdGVneSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLkJBUk5FU0hVVE9GRkJUTjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVTaW1TdHJhdGVneSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLlFVQURUUkVFT0ZGQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVF1YWRUcmVlTGluZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5RVUFEVFJFRU9OQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVF1YWRUcmVlTGluZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5DT0xMSVNJT05TT0ZGQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZUNvbGxpc2lvbnMoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIENPTlRST0xDT0RFUy5DT0xMSVNJT05TT05CVE46XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlQ29sbGlzaW9ucygpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLlRSQUlMT0ZGQlROOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZVRyYWlscygpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgQ09OVFJPTENPREVTLlRSQUlMT05CVE46XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlVHJhaWxzKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBDT05UUk9MQ09ERVMuSEVMUEJUTjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93SGVscCgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJldHZhbDtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgLy8gUmVkcmF3IHNjcmVlblxuICAgICAgICB0aGlzLnJlZHJhdygpO1xuICAgIH1cblxuICAgIGluaXRDb21wb25lbnRzKCkge1xuICAgICAgICAvLyBDcmVhdGUgY29tcG9uZW50cyAtLSBvcmRlciBpcyBpbXBvcnRhbnRcbiAgICAgICAgdGhpcy5ldmVudHMgPSB0aGlzLmFyZ3MuZXZlbnRzID0gbmV3IEd0RXZlbnRzKHRoaXMuYXJncyk7XG4gICAgICAgIHRoaXMuc2ltID0gbmV3IEd0U2ltKHRoaXMuYXJncyk7XG4gICAgICAgIHRoaXMuZ2Z4ID0gbmV3IEd0R2Z4KHRoaXMuYXJncyk7XG4gICAgfVxuXG4gICAgaW5pdFRpbWVycygpIHtcbiAgICAgICAgLy8gQWRkIGBtYWluYCBsb29wLCBhbmQgc3RhcnQgaW1tZWRpYXRlbHlcbiAgICAgICAgdGhpcy5hbmltVGltZXIgPSBuZXcgR3RUaW1lcih0aGlzLm1haW4uYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuYW5pbVRpbWVyLnN0YXJ0KCk7XG4gICAgICAgIHRoaXMuc2ltVGltZXIgPSBuZXcgR3RUaW1lcih0aGlzLnNpbS5zdGVwLmJpbmQodGhpcy5zaW0pLCA2MCk7XG4gICAgfVxuXG4gICAgdG9nZ2xlU2ltKCkge1xuICAgICAgICB0aGlzLnNpbVRpbWVyLnRvZ2dsZSgpO1xuICAgICAgICBpZiAodGhpcy5zaW1UaW1lci5hY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMucGxheUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgdGhpcy5wYXVzZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnBsYXlCdG4uc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICAgICAgdGhpcy5wYXVzZUJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdG9nZ2xlU2ltU3RyYXRlZ3koKSB7XG4gICAgICAgIHRoaXMuc2ltLnRvZ2dsZVN0cmF0ZWd5KCk7XG4gICAgICAgIGlmICh0aGlzLnNpbS51c2VCcnV0ZUZvcmNlKSB7XG4gICAgICAgICAgICB0aGlzLmJhcm5lc0h1dE9uQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB0aGlzLmJhcm5lc0h1dE9mZkJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmJhcm5lc0h1dE9uQnRuLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgICAgIHRoaXMuYmFybmVzSHV0T2ZmQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVRdWFkVHJlZUxpbmVzSWNvbnMoKTtcbiAgICB9XG5cbiAgICB0b2dnbGVDb2xsaXNpb25zKCkge1xuICAgICAgICB0aGlzLnNpbS5tZXJnZUNvbGxpc2lvbnMgPSAhdGhpcy5zaW0ubWVyZ2VDb2xsaXNpb25zO1xuICAgICAgICBpZiAodGhpcy5zaW0ubWVyZ2VDb2xsaXNpb25zKSB7XG4gICAgICAgICAgICB0aGlzLmNvbGxpc2lvbnNPZmZCdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIHRoaXMuY29sbGlzaW9uc09uQnRuLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY29sbGlzaW9uc09mZkJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgICAgICB0aGlzLmNvbGxpc2lvbnNPbkJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdG9nZ2xlVHJhaWxzKCkge1xuICAgICAgICB0aGlzLm5vY2xlYXIgPSAhdGhpcy5ub2NsZWFyO1xuICAgICAgICBpZiAodGhpcy5ub2NsZWFyKSB7XG4gICAgICAgICAgICB0aGlzLnRyYWlsT2ZmQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICB0aGlzLnRyYWlsT25CdG4uc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy50cmFpbE9mZkJ0bi5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgICAgICB0aGlzLnRyYWlsT25CdG4uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRvZ2dsZVF1YWRUcmVlTGluZXMoKSB7XG4gICAgICAgIHRoaXMucXVhZFRyZWVMaW5lcyA9ICF0aGlzLnF1YWRUcmVlTGluZXM7XG4gICAgICAgIHRoaXMudXBkYXRlUXVhZFRyZWVMaW5lc0ljb25zKCk7XG4gICAgfVxuXG4gICAgdXBkYXRlUXVhZFRyZWVMaW5lc0ljb25zKCkge1xuICAgICAgICBpZiAodGhpcy5zaW0udXNlQnJ1dGVGb3JjZSkge1xuICAgICAgICAgICAgdGhpcy5xdWFkVHJlZU9mZkJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgdGhpcy5xdWFkVHJlZU9uQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucXVhZFRyZWVMaW5lcykge1xuICAgICAgICAgICAgdGhpcy5xdWFkVHJlZU9mZkJ0bi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgdGhpcy5xdWFkVHJlZU9uQnRuLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucXVhZFRyZWVPZmZCdG4uc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICAgICAgdGhpcy5xdWFkVHJlZU9uQnRuLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzaG93SGVscCgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNIZWxwT3Blbikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaXNIZWxwT3BlbiA9IHRydWU7XG4gICAgICAgIHZleC5vcGVuKHtcbiAgICAgICAgICAgIHVuc2FmZUNvbnRlbnQ6IGBcbiAgICAgICAgICAgICAgICA8aDM+U2hvcnRjdXRzPC9oMz5cbiAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJzaG9ydGN1dHNcIj5cbiAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+TGVmdCBjbGljazwvdGQ+IDx0ZD4gY3JlYXRlIGJvZHk8L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD5SaWdodCBjbGljazwvdGQ+IDx0ZD4gZGVsZXRlIGJvZHk8L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD5NaWRkbGUgY2xpY2s8L3RkPiA8dGQ+IGNoYW5nZSBib2R5IGNvbG9yPC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+TW91c2Ugd2hlZWw8L3RkPiA8dGQ+IGNoYW5nZSBib2R5IHNpemUvbWFzczwvdGQ+PC90cj5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjxjb2RlPkVudGVyPC9jb2RlPiBrZXk8L3RkPiA8dGQ+IHN0YXJ0IHNpbXVsYXRpb248L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48Y29kZT5CPC9jb2RlPiBrZXk8L3RkPiA8dGQ+IHRvZ2dsZSBicnV0ZS1mb3JjZS9CYXJuZXMtSHV0PC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGNvZGU+QzwvY29kZT4ga2V5PC90ZD4gPHRkPiB0b2dnbGUgY29sbGlzaW9uczwvdGQ+PC90cj5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjxjb2RlPkw8L2NvZGU+IGtleTwvdGQ+IDx0ZD4gY2xlYXIgY2FudmFzPC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGNvZGU+UDwvY29kZT4ga2V5PC90ZD4gPHRkPiB0b2dnbGUgcmVwYWludGluZzwvdGQ+PC90cj5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjxjb2RlPlE8L2NvZGU+IGtleTwvdGQ+IDx0ZD4gdG9nZ2xlIHF1YWR0cmVlIGxpbmVzPC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGNvZGU+UjwvY29kZT4ga2V5PC90ZD4gPHRkPiBjcmVhdGUgcmFuZG9tIGJvZGllczwvdGQ+PC90cj5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjxjb2RlPjE8L2NvZGU+IGtleTwvdGQ+IDx0ZD4gY3JlYXRlIFRpdGFuPC90ZD48L3RyPlxuICAgICAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGNvZGU+MjwvY29kZT4ga2V5PC90ZD4gPHRkPiBjcmVhdGUgc3BoZXJpY2FsIGdhbGF4eTwvdGQ+PC90cj5cbiAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjxjb2RlPjM8L2NvZGU+IGtleTwvdGQ+IDx0ZD4gY3JlYXRlIHNwaXJhbCBnYWxheHk8L3RkPjwvdHI+XG4gICAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48Y29kZT4/PC9jb2RlPiBrZXk8L3RkPiA8dGQ+IHNob3cgaGVscDwvdGQ+PC90cj5cbiAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgICAgIDxmb290ZXIgY2xhc3M9XCJmb3JrbGlua1wiPk1hZGUgaW4gMjAxNy4gPGEgaHJlZj1cImh0dHBzOi8vZ2l0aHViLmNvbS92b2l0aG9zL2dyYXZpdG9uXCI+Rm9yayBtZSBvbiBHaXRIdWI8L2E+PC9mb290ZXI+XG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgICAgIGFmdGVyQ2xvc2U6ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmlzSGVscE9wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmVkcmF3KCkge1xuICAgICAgICBpZiAoIXRoaXMubm9jbGVhcikge1xuICAgICAgICAgICAgdGhpcy5nZnguY2xlYXIoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5xdWFkVHJlZUxpbmVzICYmICF0aGlzLnNpbS51c2VCcnV0ZUZvcmNlKSB7XG4gICAgICAgICAgICB0aGlzLmdmeC5kcmF3UXVhZFRyZWVMaW5lcyh0aGlzLnNpbS50cmVlLnJvb3QpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmludGVyYWN0aW9uLnN0YXJ0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZ2Z4LmRyYXdSZXRpY2xlTGluZSh0aGlzLmludGVyYWN0aW9uLmJvZHksIHRoaXMuaW50ZXJhY3Rpb24ucHJldmlvdXMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZ2Z4LmRyYXdCb2RpZXModGhpcy5zaW0uYm9kaWVzLCB0aGlzLnRhcmdldEJvZHkpO1xuICAgIH1cblxuICAgIGdlbmVyYXRlR3JpZCh3aWR0aCwgaGVpZ2h0LCBzdHlsZSkge1xuICAgICAgICAvLyBBdHRhY2ggYSBjYW52YXMgdG8gdGhlIHBhZ2UsIHRvIGhvdXNlIHRoZSBzaW11bGF0aW9uc1xuICAgICAgICBpZiAoIXN0eWxlKSB7XG4gICAgICAgICAgICBzdHlsZSA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5ncmlkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cbiAgICAgICAgdGhpcy5ncmlkLmNsYXNzTmFtZSA9ICdncmF2aXRvbmNhbnZhcyc7XG4gICAgICAgIHRoaXMuZ3JpZC53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmdyaWQuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICB0aGlzLmdyaWQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgIHRoaXMuZ3JpZC5zdHlsZS5tYXJnaW5MZWZ0ID0gc3R5bGUubWFyZ2luTGVmdCB8fCAnYXV0byc7XG4gICAgICAgIHRoaXMuZ3JpZC5zdHlsZS5tYXJnaW5SaWdodCA9IHN0eWxlLm1hcmdpblJpZ2h0IHx8ICdhdXRvJztcbiAgICAgICAgdGhpcy5ncmlkLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHN0eWxlLmJhY2tncm91bmRDb2xvciB8fCAnIzAwMDAwMCc7XG5cbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmdyaWQpO1xuICAgIH1cblxuICAgIGdlbmVyYXRlQ29udHJvbHMoKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdtZW51Jyk7XG4gICAgICAgIHRoaXMuY29udHJvbHMudHlwZSA9ICd0b29sYmFyJztcbiAgICAgICAgdGhpcy5jb250cm9scy5pZCA9ICdjb250cm9scyc7XG4gICAgICAgIHRoaXMuY29udHJvbHMuaW5uZXJIVE1MID0gYFxuICAgICAgICAgICAgPG1lbnVpdGVtIGlkPVwicGxheWJ0blwiIGRhdGEtdG9vbHRpcD1cIlN0YXJ0IHNpbXVsYXRpb25cIj5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz1cImFzc2V0cy9wbGF5LnN2Z1wiIGFsdD1cIlN0YXJ0IHNpbXVsYXRpb25cIj5cbiAgICAgICAgICAgIDwvbWVudWl0ZW0+XG4gICAgICAgICAgICA8bWVudWl0ZW0gaWQ9XCJwYXVzZWJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIiBkYXRhLXRvb2x0aXA9XCJTdG9wIHNpbXVsYXRpb25cIj5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz1cImFzc2V0cy9wYXVzZS5zdmdcIiBhbHQ9XCJTdG9wIHNpbXVsYXRpb25cIj5cbiAgICAgICAgICAgIDwvbWVudWl0ZW0+XG4gICAgICAgICAgICA8bWVudWl0ZW0gaWQ9XCJiYXJuZXNodXRvbmJ0blwiIGRhdGEtdG9vbHRpcD1cIlN3aXRjaCB0byBicnV0ZSBmb3JjZVwiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiYXNzZXRzL2Jhcm5lc19odXRfb24uc3ZnXCIgYWx0PVwiU3dpdGNoIHRvIGJydXRlIGZvcmNlXCI+XG4gICAgICAgICAgICA8L21lbnVpdGVtPlxuICAgICAgICAgICAgPG1lbnVpdGVtIGlkPVwiYmFybmVzaHV0b2ZmYnRuXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiIGRhdGEtdG9vbHRpcD1cIlN3aXRjaCB0byBCYXJuZXMtSHV0XCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvYmFybmVzX2h1dF9vZmYuc3ZnXCIgYWx0PVwiU3dpdGNoIHRvIEJhcm5lcy1IdXRcIj5cbiAgICAgICAgICAgIDwvbWVudWl0ZW0+XG4gICAgICAgICAgICA8bWVudWl0ZW0gaWQ9XCJxdWFkdHJlZW9mZmJ0blwiIGRhdGEtdG9vbHRpcD1cIlRvZ2dsZSBxdWFkdHJlZSBsaW5lc1wiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiYXNzZXRzL3F1YWR0cmVlX29mZi5zdmdcIiBhbHQ9XCJUb2dnbGUgcXVhZHRyZWUgbGluZXNcIj5cbiAgICAgICAgICAgIDwvbWVudWl0ZW0+XG4gICAgICAgICAgICA8bWVudWl0ZW0gaWQ9XCJxdWFkdHJlZW9uYnRuXCIgc3R5bGU9XCJkaXNwbGF5OiBub25lO1wiIGRhdGEtdG9vbHRpcD1cIlRvZ2dsZSBxdWFkdHJlZSBsaW5lc1wiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiYXNzZXRzL3F1YWR0cmVlX29uLnN2Z1wiIGFsdD1cIlRvZ2dsZSBxdWFkdHJlZSBsaW5lc1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cImNvbGxpc2lvbnNvbmJ0blwiIGRhdGEtdG9vbHRpcD1cIlRvZ2dsZSBjb2xsaXNpb25zXCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvY29sbGlzaW9uc19vbi5zdmdcIiBhbHQ9XCJUb2dnbGUgY29sbGlzaW9uc1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cImNvbGxpc2lvbnNvZmZidG5cIiBzdHlsZT1cImRpc3BsYXk6IG5vbmU7XCIgZGF0YS10b29sdGlwPVwiVG9nZ2xlIGNvbGxpc2lvbnNcIj5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz1cImFzc2V0cy9jb2xsaXNpb25zX29mZi5zdmdcIiBhbHQ9XCJUb2dnbGUgY29sbGlzaW9uc1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cInRyYWlsb2ZmYnRuXCIgZGF0YS10b29sdGlwPVwiVG9nZ2xlIHRyYWlsc1wiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiYXNzZXRzL3RyYWlsX29mZi5zdmdcIiBhbHQ9XCJUb2dnbGUgdHJhaWxzXCI+XG4gICAgICAgICAgICA8L21lbnVpdGVtPlxuICAgICAgICAgICAgPG1lbnVpdGVtIGlkPVwidHJhaWxvbmJ0blwiIHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIiBkYXRhLXRvb2x0aXA9XCJUb2dnbGUgdHJhaWxzXCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCJhc3NldHMvdHJhaWxfb24uc3ZnXCIgYWx0PVwiVG9nZ2xlIHRyYWlsc1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIDxtZW51aXRlbSBpZD1cImhlbHBidG5cIiBkYXRhLXRvb2x0aXA9XCJTaG9ydGN1dHNcIj5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz1cImFzc2V0cy9oZWxwLnN2Z1wiIGFsdD1cIlNob3J0Y3V0c1wiPlxuICAgICAgICAgICAgPC9tZW51aXRlbT5cbiAgICAgICAgICAgIGA7XG5cbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmNvbnRyb2xzKTtcbiAgICB9XG5cbiAgICBnZW5lcmF0ZVJhbmRvbUJvZGllcyhudW0sIGFyZ3MpIHtcbiAgICAgICAgYXJncyA9IGFyZ3MgfHwge307XG5cbiAgICAgICAgY29uc3QgbWluWCA9IGFyZ3MubWluWCB8fCAwO1xuICAgICAgICBjb25zdCBtYXhYID0gYXJncy5tYXhYIHx8IHRoaXMub3B0aW9ucy53aWR0aDtcbiAgICAgICAgY29uc3QgbWluWSA9IGFyZ3MubWluWSB8fCAwO1xuICAgICAgICBjb25zdCBtYXhZID0gYXJncy5tYXhZIHx8IHRoaXMub3B0aW9ucy5oZWlnaHQ7XG4gICAgICAgIGNvbnN0IGhhbGZYID0gKG1heFggLSBtaW5YKSAvIDI7XG4gICAgICAgIGNvbnN0IGhhbGZZID0gKG1heFkgLSBtaW5ZKSAvIDI7XG4gICAgICAgIGNvbnN0IG1pZFggPSBtaW5YICsgaGFsZlg7XG4gICAgICAgIGNvbnN0IG1pZFkgPSBtaW5ZICsgaGFsZlk7XG5cbiAgICAgICAgY29uc3QgbWluVmVsWCA9IGFyZ3MubWluVmVsWCB8fCAwO1xuICAgICAgICBjb25zdCBtYXhWZWxYID0gYXJncy5tYXhWZWxYIHx8IDAuMDAwMDE7XG4gICAgICAgIGNvbnN0IG1pblZlbFkgPSBhcmdzLm1pblZlbFkgfHwgMDtcbiAgICAgICAgY29uc3QgbWF4VmVsWSA9IGFyZ3MubWF4VmVsWSB8fCAwLjAwMDAxO1xuXG4gICAgICAgIGNvbnN0IG1pblJhZGl1cyA9IGFyZ3MubWluUmFkaXVzIHx8IDE7XG4gICAgICAgIGNvbnN0IG1heFJhZGl1cyA9IGFyZ3MubWF4UmFkaXVzIHx8IDE1O1xuXG4gICAgICAgIC8vIEdhbGFjdGljIGFyZ3NcbiAgICAgICAgY29uc3QgbnVtQXJtcyA9IGFyZ3MubnVtQXJtcyB8fCA1O1xuICAgICAgICBjb25zdCBhcm1TZXBhcmF0aW9uID0gMiAqIE1hdGguUEkgLyBudW1Bcm1zO1xuICAgICAgICBjb25zdCBhcm1PZmZzZXRNYXggPSBhcmdzLmFybU9mZnNldE1heCB8fCAwLjU7XG4gICAgICAgIGNvbnN0IHJvdGF0aW9uRmFjdG9yID0gYXJncy5yb3RhdGlvbkZhY3RvciB8fCA1O1xuICAgICAgICBjb25zdCBhcm1SYW5kb21PZmZzZXRYWSA9IGFyZ3MuYXJtUmFuZG9tT2Zmc2V0WFkgfHwgMC4wNDtcblxuICAgICAgICBsZXQgY29sb3IgPSBhcmdzLmNvbG9yO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChhcmdzLnJhbmRvbUNvbG9ycykge1xuICAgICAgICAgICAgICAgIGNvbG9yID0gcmFuZG9tLmNvbG9yKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCB4LCB5LCB2ZWxYLCB2ZWxZO1xuICAgICAgICAgICAgaWYgKGFyZ3MuZ2FsYWN0aWNEaXN0cmlidXRpb24pIHtcbiAgICAgICAgICAgICAgICAvLyBDaG9vc2UgYSBkaXN0YW5jZSBmcm9tIHRoZSBjZW50ZXIgb2YgdGhlIGdhbGF4eS5cbiAgICAgICAgICAgICAgICBjb25zdCBkaXN0ID0gTWF0aC5yYW5kb20oKSA+IDAuNSA/XG4gICAgICAgICAgICAgICAgICAgIE1hdGgucG93KE1hdGgucmFuZG9tKCksIDEuNSkgOlxuICAgICAgICAgICAgICAgICAgICByYW5kb20ubm9ybWFsRnJvbVRvKDAsIDEpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgYW5nbGUgPSBNYXRoLnJhbmRvbSgpICogMiAqIE1hdGguUEk7XG4gICAgICAgICAgICAgICAgY29uc3QgYXJtT2Zmc2V0ID0gKE1hdGgucmFuZG9tKCkgKiBhcm1PZmZzZXRNYXgpIC0gKGFybU9mZnNldE1heCAvIDIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGRpc3RBcm1PZmZzZXQgPSBhcm1PZmZzZXQgLyBkaXN0O1xuICAgICAgICAgICAgICAgIGxldCBzcXVhcmVkQXJtT2Zmc2V0ID0gZGlzdEFybU9mZnNldCAqIGRpc3RBcm1PZmZzZXQ7XG4gICAgICAgICAgICAgICAgaWYgKGFybU9mZnNldCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgc3F1YXJlZEFybU9mZnNldCAqPSAtMTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCByb3RhdGlvbiA9IGRpc3QgKiByb3RhdGlvbkZhY3RvcjtcbiAgICAgICAgICAgICAgICBjb25zdCBwb2xhckFuZ2xlID0gTWF0aC5mbG9vcihhbmdsZSAvIGFybVNlcGFyYXRpb24pICpcbiAgICAgICAgICAgICAgICAgICAgYXJtU2VwYXJhdGlvbiArIHNxdWFyZWRBcm1PZmZzZXQgKyByb3RhdGlvbjtcblxuICAgICAgICAgICAgICAgIC8vIENvbnZlcnQgcG9sYXIgY29vcmRpbmF0ZXMgdG8gY2FydGVzaWFuLlxuICAgICAgICAgICAgICAgIGxldCByZWxYID0gTWF0aC5jb3MocG9sYXJBbmdsZSkgKiBkaXN0O1xuICAgICAgICAgICAgICAgIGxldCByZWxZID0gTWF0aC5zaW4ocG9sYXJBbmdsZSkgKiBkaXN0O1xuXG4gICAgICAgICAgICAgICAgcmVsWCArPSBNYXRoLnJhbmRvbSgpICogYXJtUmFuZG9tT2Zmc2V0WFk7XG4gICAgICAgICAgICAgICAgcmVsWSArPSBNYXRoLnJhbmRvbSgpICogYXJtUmFuZG9tT2Zmc2V0WFk7XG5cbiAgICAgICAgICAgICAgICB4ID0gbWlkWCArIHJlbFggKiBoYWxmWDtcbiAgICAgICAgICAgICAgICB5ID0gbWlkWSArIHJlbFkgKiBoYWxmWTtcblxuICAgICAgICAgICAgICAgIC8vIENvbXB1dGUgdmVsb2NpdHkgYnkgcm90YXRpbmcgdGhlIGFuZ2xlLlxuICAgICAgICAgICAgICAgIGNvbnN0IHZlY3RvclggPSBNYXRoLmNvcyhwb2xhckFuZ2xlIC0gTWF0aC5QSSAvIDIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZlY3RvclkgPSBNYXRoLnNpbihwb2xhckFuZ2xlIC0gTWF0aC5QSSAvIDIpO1xuICAgICAgICAgICAgICAgIHZlbFggPSByYW5kb20ubnVtYmVyKG1pblZlbFgsIG1heFZlbFgpICogdmVjdG9yWCAqIGRpc3Q7XG4gICAgICAgICAgICAgICAgdmVsWSA9IHJhbmRvbS5udW1iZXIobWluVmVsWSwgbWF4VmVsWSkgKiB2ZWN0b3JZICogZGlzdDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYXJncy5ub3JtYWxEaXN0cmlidXRpb24pIHtcbiAgICAgICAgICAgICAgICB4ID0gcmFuZG9tLm5vcm1hbEZyb21UbyhtaW5YLCBtYXhYKTtcbiAgICAgICAgICAgICAgICB5ID0gcmFuZG9tLm5vcm1hbEZyb21UbyhtaW5ZLCBtYXhZKTtcbiAgICAgICAgICAgICAgICB2ZWxYID0gcmFuZG9tLmRpcmVjdGlvbmFsKG1pblZlbFgsIG1heFZlbFgpO1xuICAgICAgICAgICAgICAgIHZlbFkgPSByYW5kb20uZGlyZWN0aW9uYWwobWluVmVsWSwgbWF4VmVsWSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHggPSByYW5kb20ubnVtYmVyKG1pblgsIG1heFgpO1xuICAgICAgICAgICAgICAgIHkgPSByYW5kb20ubnVtYmVyKG1pblksIG1heFkpO1xuICAgICAgICAgICAgICAgIHZlbFggPSByYW5kb20uZGlyZWN0aW9uYWwobWluVmVsWCwgbWF4VmVsWCk7XG4gICAgICAgICAgICAgICAgdmVsWSA9IHJhbmRvbS5kaXJlY3Rpb25hbChtaW5WZWxZLCBtYXhWZWxZKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5zaW0uYWRkTmV3Qm9keSh7XG4gICAgICAgICAgICAgICAgeDogeCxcbiAgICAgICAgICAgICAgICB5OiB5LFxuICAgICAgICAgICAgICAgIHZlbFg6IHZlbFgsXG4gICAgICAgICAgICAgICAgdmVsWTogdmVsWSxcbiAgICAgICAgICAgICAgICByYWRpdXM6IHJhbmRvbS5udW1iZXIobWluUmFkaXVzLCBtYXhSYWRpdXMpLFxuICAgICAgICAgICAgICAgIGNvbG9yOiBjb2xvclxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVUYXJnZXQoeCwgeSkge1xuICAgICAgICB0aGlzLnNldFRhcmdldEJvZHkodGhpcy5zaW0uZ2V0Qm9keUF0KHgsIHkpKTtcbiAgICB9XG5cbiAgICBzZXRUYXJnZXRCb2R5KGJvZHkpIHtcbiAgICAgICAgdGhpcy50YXJnZXRCb2R5ID0gYm9keTtcbiAgICAgICAgdGhpcy51cGRhdGVNZXRhSW5mbygpO1xuICAgIH1cblxuICAgIHVwZGF0ZU1ldGFJbmZvKCkge1xuICAgICAgICBpZiAodGhpcy50YXJnZXRCb2R5KSB7XG4gICAgICAgICAgICB0aGlzLm1ldGFJbmZvLmlubmVySFRNTCA9XG4gICAgICAgICAgICAgICAgYOKKlSAke3RoaXMudGFyZ2V0Qm9keS5tYXNzLnRvRml4ZWQoMil9ICZuYnNwO2AgK1xuICAgICAgICAgICAgICAgIGDipr8gJHt0aGlzLnRhcmdldEJvZHkucmFkaXVzLnRvRml4ZWQoMil9ICZuYnNwO2AgK1xuICAgICAgICAgICAgICAgIGDih5cgJHt0aGlzLnRhcmdldEJvZHkuc3BlZWQudG9GaXhlZCgyKX1gO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5tZXRhSW5mby50ZXh0Q29udGVudCA9ICcnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlQ29sb3IoKSB7XG4gICAgICAgIGlmICh0aGlzLnRhcmdldEJvZHkpIHtcbiAgICAgICAgICAgIHRoaXMudGFyZ2V0Qm9keS51cGRhdGVDb2xvcih0aGlzLmpzY29sb3IudG9IRVhTdHJpbmcoKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpc0NvbG9yUGlja2VyQWN0aXZlKCkge1xuICAgICAgICB0aGlzLndhc0NvbG9yUGlja2VyQWN0aXZlID0gdGhpcy5jb2xvclBpY2tlci5jbGFzc05hbWUuaW5kZXhPZignanNjb2xvci1hY3RpdmUnKSA+IC0xO1xuICAgICAgICByZXR1cm4gdGhpcy53YXNDb2xvclBpY2tlckFjdGl2ZTtcbiAgICB9XG59IC8vIGVuZCBncmF2aXRvbi9hcHBcbiIsImltcG9ydCBjb2xvcnMgZnJvbSAnLi4vdXRpbC9jb2xvcnMnO1xuXG4vKipcbiAqIGdyYXZpdG9uL2JvZHkgLS0gVGhlIGdyYXZpdGF0aW9uYWwgYm9keVxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdEJvZHkge1xuICAgIGNvbnN0cnVjdG9yKGFyZ3MpIHtcbiAgICAgICAgYXJncyA9IGFyZ3MgfHwge307XG5cbiAgICAgICAgdGhpcy54ID0gYXJncy54O1xuICAgICAgICB0aGlzLnkgPSBhcmdzLnk7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy54ICE9PSAnbnVtYmVyJyB8fCB0eXBlb2YgdGhpcy55ICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0NvcnJlY3QgcG9zaXRpb25zIHdlcmUgbm90IGdpdmVuIGZvciB0aGUgYm9keS4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubmV4dFggPSB0aGlzLng7XG4gICAgICAgIHRoaXMubmV4dFkgPSB0aGlzLnk7XG5cbiAgICAgICAgdGhpcy52ZWxYID0gYXJncy52ZWxYIHx8IDA7XG4gICAgICAgIHRoaXMudmVsWSA9IGFyZ3MudmVsWSB8fCAwO1xuXG4gICAgICAgIHRoaXMucmFkaXVzID0gYXJncy5yYWRpdXM7XG4gICAgICAgIHRoaXMubWFzcyA9IGFyZ3MubWFzcztcblxuICAgICAgICBpZiAoJ3JhZGl1cycgaW4gYXJncyAmJiAhKCdtYXNzJyBpbiBhcmdzKSkge1xuICAgICAgICAgICAgdGhpcy5mb3JjZVJhZGl1cyhhcmdzLnJhZGl1cyk7XG4gICAgICAgIH0gZWxzZSBpZiAoJ21hc3MnIGluIGFyZ3MgJiYgISgncmFkaXVzJyBpbiBhcmdzKSkge1xuICAgICAgICAgICAgdGhpcy5mb3JjZU1hc3MoYXJncy5tYXNzKTtcbiAgICAgICAgfSBlbHNlIGlmICghKCdtYXNzJyBpbiBhcmdzKSAmJiAhKCdyYWRpdXMnIGluIGFyZ3MpKSB7XG4gICAgICAgICAgICAvLyBEZWZhdWx0IHRvIGEgcmFkaXVzIG9mIDEwXG4gICAgICAgICAgICB0aGlzLmZvcmNlUmFkaXVzKDEwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29sb3IgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0ID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIHRoaXMudXBkYXRlQ29sb3IoYXJncy5jb2xvciB8fCAnI2RiZDNjOCcpO1xuICAgIH1cblxuICAgIGFkanVzdFNpemUoZGVsdGEpIHtcbiAgICAgICAgdGhpcy5mb3JjZVJhZGl1cyhNYXRoLm1heCh0aGlzLnJhZGl1cyArIGRlbHRhLCAyKSk7XG4gICAgfVxuXG4gICAgZm9yY2VSYWRpdXMocmFkaXVzKSB7XG4gICAgICAgIHRoaXMucmFkaXVzID0gcmFkaXVzO1xuICAgICAgICAvLyBEb3JreSBmb3JtdWxhIHRvIG1ha2UgbWFzcyBzY2FsZSBcInByb3Blcmx5XCIgd2l0aCByYWRpdXMuXG4gICAgICAgIHRoaXMubWFzcyA9IE1hdGgucG93KHRoaXMucmFkaXVzIC8gNCwgMyk7XG4gICAgfVxuXG4gICAgZm9yY2VNYXNzKG1hc3MpIHtcbiAgICAgICAgLy8gTm9ybWFsbHkgdGhlIG1hc3MgaXMgY2FsY3VsYXRlZCBiYXNlZCBvbiB0aGUgcmFkaXVzLCBidXQgd2UgY2FuIGRvIHRoZSByZXZlcnNlXG4gICAgICAgIHRoaXMubWFzcyA9IG1hc3M7XG4gICAgICAgIHRoaXMucmFkaXVzID0gTWF0aC5wb3codGhpcy5tYXNzLCAxLzMpICogNDtcbiAgICB9XG5cbiAgICB1cGRhdGVDb2xvcihjb2xvcikge1xuICAgICAgICB0aGlzLmNvbG9yID0gY29sb3I7XG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0ID0gY29sb3JzLnRvSGV4KGNvbG9ycy5icmlnaHRlbihjb2xvcnMuZnJvbUhleCh0aGlzLmNvbG9yKSwgLjI1KSk7XG4gICAgfVxuXG4gICAgZ2V0IHNwZWVkKCkge1xuICAgICAgICAvLyBWZWxvY2l0aWVzIGFyZSB0aW55LCBzbyB1cHNjYWxlIGl0IChhcmJpdHJhcmlseSkgdG8gbWFrZSBpdCByZWFkYWJsZS5cbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLnZlbFggKiB0aGlzLnZlbFggKyB0aGlzLnZlbFkgKiB0aGlzLnZlbFkpICogMWU2O1xuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL2JvZHlcbiIsIi8qKlxuICogZ3Jhdml0b24vZXZlbnRzIC0tIEV2ZW50IHF1ZXVlaW5nIGFuZCBwcm9jZXNzaW5nXG4gKi9cbmV4cG9ydCBjb25zdCBLRVlDT0RFUyA9IHtcbiAgICBLX0xFRlQ6IDM3LFxuICAgIEtfVVA6IDM4LFxuICAgIEtfUklHSFQ6IDM5LFxuICAgIEtfRE9XTjogNDAsXG5cbiAgICBLXzA6IDQ4LFxuICAgIEtfMTogNDksXG4gICAgS18yOiA1MCxcbiAgICBLXzM6IDUxLFxuICAgIEtfNDogNTIsXG4gICAgS181OiA1MyxcbiAgICBLXzY6IDU0LFxuICAgIEtfNzogNTUsXG4gICAgS184OiA1NixcbiAgICBLXzk6IDU3LFxuXG4gICAgS19BOiA2NSxcbiAgICBLX0I6IDY2LFxuICAgIEtfQzogNjcsXG4gICAgS19EOiA2OCxcbiAgICBLX0U6IDY5LFxuICAgIEtfRjogNzAsXG4gICAgS19HOiA3MSxcbiAgICBLX0g6IDcyLFxuICAgIEtfSTogNzMsXG4gICAgS19KOiA3NCxcbiAgICBLX0s6IDc1LFxuICAgIEtfTDogNzYsXG4gICAgS19NOiA3NyxcbiAgICBLX046IDc4LFxuICAgIEtfTzogNzksXG4gICAgS19QOiA4MCxcbiAgICBLX1E6IDgxLFxuICAgIEtfUjogODIsXG4gICAgS19TOiA4MyxcbiAgICBLX1Q6IDg0LFxuICAgIEtfVTogODUsXG4gICAgS19WOiA4NixcbiAgICBLX1c6IDg3LFxuICAgIEtfWDogODgsXG4gICAgS19ZOiA4OSxcbiAgICBLX1o6IDkwLFxuXG4gICAgS19LUDE6IDk3LFxuICAgIEtfS1AyOiA5OCxcbiAgICBLX0tQMzogOTksXG4gICAgS19LUDQ6IDEwMCxcbiAgICBLX0tQNTogMTAxLFxuICAgIEtfS1A2OiAxMDIsXG4gICAgS19LUDc6IDEwMyxcbiAgICBLX0tQODogMTA0LFxuICAgIEtfS1A5OiAxMDUsXG5cbiAgICBLX1FVRVNUSU9OTUFSSzogMTkxLFxuXG4gICAgS19CQUNLU1BBQ0U6IDgsXG4gICAgS19UQUI6IDksXG4gICAgS19FTlRFUjogMTMsXG4gICAgS19TSElGVDogMTYsXG4gICAgS19DVFJMOiAxNyxcbiAgICBLX0FMVDogMTgsXG4gICAgS19FU0M6IDI3LFxuICAgIEtfU1BBQ0U6IDMyXG59O1xuXG5leHBvcnQgY29uc3QgTU9VU0VDT0RFUyA9IHtcbiAgICBNX0xFRlQ6IDAsXG4gICAgTV9NSURETEU6IDEsXG4gICAgTV9SSUdIVDogMlxufTtcblxuZXhwb3J0IGNvbnN0IEVWRU5UQ09ERVMgPSB7XG4gICAgTU9VU0VET1dOOiAxMDAwLFxuICAgIE1PVVNFVVA6IDEwMDEsXG4gICAgTU9VU0VNT1ZFOiAxMDAyLFxuICAgIE1PVVNFV0hFRUw6IDEwMDMsXG4gICAgQ0xJQ0s6IDEwMDQsXG4gICAgREJMQ0xJQ0s6IDEwMDUsXG5cbiAgICBLRVlET1dOOiAxMDEwLFxuICAgIEtFWVVQOiAxMDExXG59O1xuXG5leHBvcnQgY29uc3QgQ09OVFJPTENPREVTID0ge1xuICAgIFBMQVlCVE46IDIwMDAsXG4gICAgUEFVU0VCVE46IDIwMDEsXG4gICAgVFJBSUxPRkZCVE46IDIwMDIsXG4gICAgVFJBSUxPTkJUTjogMjAwMyxcbiAgICBIRUxQQlROOiAyMDA0LFxuICAgIFFVQURUUkVFT0ZGQlROOiAyMDA1LFxuICAgIFFVQURUUkVFT05CVE46IDIwMDYsXG4gICAgQkFSTkVTSFVUT05CVE46IDIwMDcsXG4gICAgQkFSTkVTSFVUT0ZGQlROOiAyMDA4LFxuICAgIENPTExJU0lPTlNPRkZCVE46IDIwMDksXG4gICAgQ09MTElTSU9OU09OQlROOiAyMDEwXG59O1xuXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd0RXZlbnRzIHtcbiAgICBjb25zdHJ1Y3RvcihhcmdzKSB7XG4gICAgICAgIGFyZ3MgPSBhcmdzIHx8IHt9O1xuXG4gICAgICAgIHRoaXMucXVldWUgPSBbXTtcblxuICAgICAgICBpZiAodHlwZW9mIGFyZ3MuZ3JpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdObyB1c2FibGUgY2FudmFzIGVsZW1lbnQgd2FzIGdpdmVuLicpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZ3JpZCA9IGFyZ3MuZ3JpZDtcbiAgICAgICAgdGhpcy5jb250cm9scyA9IGFyZ3MuY29udHJvbHM7XG4gICAgICAgIHRoaXMucGxheUJ0biA9IGFyZ3MucGxheUJ0bjtcbiAgICAgICAgdGhpcy5wYXVzZUJ0biA9IGFyZ3MucGF1c2VCdG47XG4gICAgICAgIHRoaXMuYmFybmVzSHV0T25CdG4gPSBhcmdzLmJhcm5lc0h1dE9uQnRuO1xuICAgICAgICB0aGlzLmJhcm5lc0h1dE9mZkJ0biA9IGFyZ3MuYmFybmVzSHV0T2ZmQnRuO1xuICAgICAgICB0aGlzLnF1YWRUcmVlT2ZmQnRuID0gYXJncy5xdWFkVHJlZU9mZkJ0bjtcbiAgICAgICAgdGhpcy5xdWFkVHJlZU9uQnRuID0gYXJncy5xdWFkVHJlZU9uQnRuO1xuICAgICAgICB0aGlzLmNvbGxpc2lvbnNPZmZCdG4gPSBhcmdzLmNvbGxpc2lvbnNPZmZCdG47XG4gICAgICAgIHRoaXMuY29sbGlzaW9uc09uQnRuID0gYXJncy5jb2xsaXNpb25zT25CdG47XG4gICAgICAgIHRoaXMudHJhaWxPZmZCdG4gPSBhcmdzLnRyYWlsT2ZmQnRuO1xuICAgICAgICB0aGlzLnRyYWlsT25CdG4gPSBhcmdzLnRyYWlsT25CdG47XG4gICAgICAgIHRoaXMuaGVscEJ0biA9IGFyZ3MuaGVscEJ0bjtcblxuICAgICAgICB0aGlzLndpcmV1cEV2ZW50cygpO1xuICAgIH1cblxuICAgIHFhZGQoZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xdWV1ZS5wdXNoKGV2ZW50KTtcbiAgICB9XG5cbiAgICBxcG9sbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucXVldWUuc2hpZnQoKTtcbiAgICB9XG5cbiAgICBxZ2V0KCkge1xuICAgICAgICAvLyBSZXBsYWNpbmcgdGhlIHJlZmVyZW5jZSBpcyBmYXN0ZXIgdGhhbiBgc3BsaWNlKClgXG4gICAgICAgIGxldCByZWYgPSB0aGlzLnF1ZXVlO1xuICAgICAgICB0aGlzLnF1ZXVlID0gW107XG4gICAgICAgIHJldHVybiByZWY7XG4gICAgfVxuXG4gICAgcWNsZWFyKCkge1xuICAgICAgICB0aGlzLnF1ZXVlID0gW107XG4gICAgfVxuXG4gICAgd2lyZXVwRXZlbnRzKCkge1xuICAgICAgICAvLyBHcmlkIG1vdXNlIGV2ZW50c1xuICAgICAgICB0aGlzLmdyaWQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNsaWNrLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmdyaWQuYWRkRXZlbnRMaXN0ZW5lcignZGJsY2xpY2snLCB0aGlzLmhhbmRsZURibENsaWNrLmJpbmQodGhpcykpO1xuXG4gICAgICAgIHRoaXMuZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIHRoaXMuaGFuZGxlQ29udGV4dE1lbnUuYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLmhhbmRsZU1vdXNlRG93bi5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5ncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLmhhbmRsZU1vdXNlVXAuYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLmhhbmRsZU1vdXNlTW92ZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5ncmlkLmFkZEV2ZW50TGlzdGVuZXIoJ3doZWVsJywgdGhpcy5oYW5kbGVNb3VzZVdoZWVsLmJpbmQodGhpcykpO1xuXG4gICAgICAgIC8vIEdyaWQga2V5IGV2ZW50c1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5oYW5kbGVLZXlEb3duLmJpbmQodGhpcykpO1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuaGFuZGxlS2V5VXAuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgLy8gQ29udHJvbCBldmVudHNcbiAgICAgICAgdGhpcy5wbGF5QnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDb250cm9sQ2xpY2suYmluZCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICBDT05UUk9MQ09ERVMuUExBWUJUTikpO1xuICAgICAgICB0aGlzLnBhdXNlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDb250cm9sQ2xpY2suYmluZCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICBDT05UUk9MQ09ERVMuUEFVU0VCVE4pKTtcbiAgICAgICAgdGhpcy5iYXJuZXNIdXRPbkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ29udHJvbENsaWNrLmJpbmQodGhpcyxcbiAgICAgICAgICAgICAgICAgICAgQ09OVFJPTENPREVTLkJBUk5FU0hVVE9OQlROKSk7XG4gICAgICAgIHRoaXMuYmFybmVzSHV0T2ZmQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDb250cm9sQ2xpY2suYmluZCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICBDT05UUk9MQ09ERVMuQkFSTkVTSFVUT0ZGQlROKSk7XG4gICAgICAgIHRoaXMucXVhZFRyZWVPZmZCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNvbnRyb2xDbGljay5iaW5kKHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIENPTlRST0xDT0RFUy5RVUFEVFJFRU9GRkJUTikpO1xuICAgICAgICB0aGlzLnF1YWRUcmVlT25CdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmhhbmRsZUNvbnRyb2xDbGljay5iaW5kKHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIENPTlRST0xDT0RFUy5RVUFEVFJFRU9OQlROKSk7XG4gICAgICAgIHRoaXMuY29sbGlzaW9uc09uQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDb250cm9sQ2xpY2suYmluZCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICBDT05UUk9MQ09ERVMuQ09MTElTSU9OU09OQlROKSk7XG4gICAgICAgIHRoaXMuY29sbGlzaW9uc09mZkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ29udHJvbENsaWNrLmJpbmQodGhpcyxcbiAgICAgICAgICAgICAgICAgICAgQ09OVFJPTENPREVTLkNPTExJU0lPTlNPRkZCVE4pKTtcbiAgICAgICAgdGhpcy50cmFpbE9mZkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ29udHJvbENsaWNrLmJpbmQodGhpcyxcbiAgICAgICAgICAgICAgICAgICAgQ09OVFJPTENPREVTLlRSQUlMT0ZGQlROKSk7XG4gICAgICAgIHRoaXMudHJhaWxPbkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGFuZGxlQ29udHJvbENsaWNrLmJpbmQodGhpcyxcbiAgICAgICAgICAgICAgICAgICAgQ09OVFJPTENPREVTLlRSQUlMT05CVE4pKTtcbiAgICAgICAgdGhpcy5oZWxwQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oYW5kbGVDb250cm9sQ2xpY2suYmluZCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICBDT05UUk9MQ09ERVMuSEVMUEJUTikpO1xuICAgIH1cblxuICAgIGhhbmRsZUNsaWNrKGV2ZW50KSB7XG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiBFVkVOVENPREVTLkNMSUNLLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuZ2V0UG9zaXRpb24oZXZlbnQpLFxuICAgICAgICAgICAgYnV0dG9uOiBldmVudC5idXR0b24sXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlRGJsQ2xpY2soZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuREJMQ0xJQ0ssXG4gICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5nZXRQb3NpdGlvbihldmVudCksXG4gICAgICAgICAgICBidXR0b246IGV2ZW50LmJ1dHRvbixcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBoYW5kbGVDb250ZXh0TWVudShldmVudCkge1xuICAgICAgICAvLyBQcmV2ZW50IHJpZ2h0LWNsaWNrIG1lbnVcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICBoYW5kbGVNb3VzZURvd24oZXZlbnQpIHtcbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuTU9VU0VET1dOLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuZ2V0UG9zaXRpb24oZXZlbnQpLFxuICAgICAgICAgICAgYnV0dG9uOiBldmVudC5idXR0b24sXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlTW91c2VVcChldmVudCkge1xuICAgICAgICB0aGlzLnFhZGQoe1xuICAgICAgICAgICAgdHlwZTogRVZFTlRDT0RFUy5NT1VTRVVQLFxuICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuZ2V0UG9zaXRpb24oZXZlbnQpLFxuICAgICAgICAgICAgYnV0dG9uOiBldmVudC5idXR0b24sXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlTW91c2VNb3ZlKGV2ZW50KSB7XG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiBFVkVOVENPREVTLk1PVVNFTU9WRSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmdldFBvc2l0aW9uKGV2ZW50KSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogZXZlbnQudGltZVN0YW1wXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGhhbmRsZU1vdXNlV2hlZWwoZXZlbnQpIHtcbiAgICAgICAgLy8gUmV2ZXJzZSB0aGUgdXAvZG93bi5cbiAgICAgICAgbGV0IGRlbHRhID0gLWV2ZW50LmRlbHRhWSAvIDUwO1xuXG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiBFVkVOVENPREVTLk1PVVNFV0hFRUwsXG4gICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5nZXRQb3NpdGlvbihldmVudCksXG4gICAgICAgICAgICBkZWx0YTogZGVsdGEsXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gUHJldmVudCB0aGUgd2luZG93IGZyb20gc2Nyb2xsaW5nXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuXG4gICAgaGFuZGxlS2V5RG93bihldmVudCkge1xuICAgICAgICAvLyBBY2NvdW50IGZvciBicm93c2VyIGRpc2NyZXBhbmNpZXNcbiAgICAgICAgbGV0IGtleSA9IGV2ZW50LmtleUNvZGUgfHwgZXZlbnQud2hpY2g7XG5cbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuS0VZRE9XTixcbiAgICAgICAgICAgIGtleWNvZGU6IGtleSxcbiAgICAgICAgICAgIHNoaWZ0OiBldmVudC5zaGlmdEtleSxcbiAgICAgICAgICAgIGN0cmw6IGV2ZW50LmN0cmxLZXksXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGV2ZW50LnRpbWVTdGFtcFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBoYW5kbGVLZXlVcChldmVudCkge1xuICAgICAgICAvLyBBY2NvdW50IGZvciBicm93c2VyIGRpc2NyZXBhbmNpZXNcbiAgICAgICAgbGV0IGtleSA9IGV2ZW50LmtleUNvZGUgfHwgZXZlbnQud2hpY2g7XG5cbiAgICAgICAgdGhpcy5xYWRkKHtcbiAgICAgICAgICAgIHR5cGU6IEVWRU5UQ09ERVMuS0VZVVAsXG4gICAgICAgICAgICBrZXljb2RlOiBrZXksXG4gICAgICAgICAgICBzaGlmdDogZXZlbnQuc2hpZnRLZXksXG4gICAgICAgICAgICBjdHJsOiBldmVudC5jdHJsS2V5LFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaGFuZGxlQ29udHJvbENsaWNrKHR5cGUsIGV2ZW50KSB7XG4gICAgICAgIHRoaXMucWFkZCh7XG4gICAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBldmVudC50aW1lU3RhbXBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZ2V0UG9zaXRpb24oZXZlbnQpIHtcbiAgICAgICAgLy8gQ2FsY3VsYXRlIG9mZnNldCBvbiB0aGUgZ3JpZCBmcm9tIGNsaWVudFgvWSwgYmVjYXVzZVxuICAgICAgICAvLyBzb21lIGJyb3dzZXJzIGRvbid0IGhhdmUgZXZlbnQub2Zmc2V0WC9ZXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiBldmVudC5jbGllbnRYIC0gdGhpcy5ncmlkLm9mZnNldExlZnQsXG4gICAgICAgICAgICB5OiBldmVudC5jbGllbnRZIC0gdGhpcy5ncmlkLm9mZnNldFRvcFxuICAgICAgICB9O1xuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL2V2ZW50c1xuIiwiLyoqXG4gKiBncmF2aXRvbi9nZnggLS0gVGhlIGdyYXBoaWNzIG9iamVjdFxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdEdmeCB7XG4gICAgY29uc3RydWN0b3IoYXJncykge1xuICAgICAgICBhcmdzID0gYXJncyB8fCB7fTtcblxuICAgICAgICB0aGlzLmdyaWQgPSB0eXBlb2YgYXJncy5ncmlkID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChhcmdzLmdyaWQpIDpcbiAgICAgICAgICAgIGFyZ3MuZ3JpZDtcblxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuZ3JpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdObyB1c2FibGUgY2FudmFzIGVsZW1lbnQgd2FzIGdpdmVuLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jdHggPSB0aGlzLmdyaWQuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgLy8gU2V0dGluZyB0aGUgd2lkdGggaGFzIHRoZSBzaWRlIGVmZmVjdFxuICAgICAgICAvLyBvZiBjbGVhcmluZyB0aGUgY2FudmFzXG4gICAgICAgIHRoaXMuZ3JpZC53aWR0aCA9IHRoaXMuZ3JpZC53aWR0aDtcbiAgICB9XG5cbiAgICBkcmF3Qm9kaWVzKGJvZGllcywgdGFyZ2V0Qm9keSkge1xuICAgICAgICBmb3IgKGxldCBib2R5IG9mIGJvZGllcykge1xuICAgICAgICAgICAgdGhpcy5fZHJhd0JvZHkoYm9keSwgLyogaXNUYXJnZXRlZCAqLyBib2R5ID09PSB0YXJnZXRCb2R5KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9kcmF3Qm9keShib2R5LCBpc1RhcmdldGVkKSB7XG4gICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IGJvZHkuY29sb3I7XG5cbiAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuY3R4LmFyYyhib2R5LngsIGJvZHkueSwgYm9keS5yYWRpdXMsIDAsIE1hdGguUEkgKiAyLCB0cnVlKTtcblxuICAgICAgICB0aGlzLmN0eC5maWxsKCk7XG4gICAgICAgIGlmIChpc1RhcmdldGVkKSB7XG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IGJvZHkuaGlnaGxpZ2h0O1xuICAgICAgICAgICAgdGhpcy5jdHgubGluZVdpZHRoID0gTWF0aC5yb3VuZChib2R5LnJhZGl1cyAvIDgpO1xuICAgICAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkcmF3UmV0aWNsZUxpbmUoZnJvbSwgdG8pIHtcbiAgICAgICAgbGV0IGdyYWQgPSB0aGlzLmN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudChmcm9tLngsIGZyb20ueSwgdG8ueCwgdG8ueSk7XG4gICAgICAgIGdyYWQuYWRkQ29sb3JTdG9wKDAsICdyZ2JhKDMxLCA3NSwgMTMwLCAxKScpO1xuICAgICAgICBncmFkLmFkZENvbG9yU3RvcCgxLCAncmdiYSgzMSwgNzUsIDEzMCwgMC4xKScpO1xuICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IGdyYWQ7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDY7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVDYXAgPSAncm91bmQnO1xuXG4gICAgICAgIC8vIERyYXcgaW5pdGlhbCBiYWNrZ3JvdW5kIGxpbmUuXG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmN0eC5tb3ZlVG8oZnJvbS54LCBmcm9tLnkpO1xuICAgICAgICB0aGlzLmN0eC5saW5lVG8odG8ueCwgdG8ueSk7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuXG4gICAgICAgIC8vIERyYXcgb3ZlcmxheSBsaW5lLlxuICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9ICcjMzQ3N0NBJztcbiAgICAgICAgdGhpcy5jdHgubGluZVdpZHRoID0gMjtcbiAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuY3R4Lm1vdmVUbyhmcm9tLngsIGZyb20ueSk7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0by54LCB0by55KTtcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XG4gICAgfVxuXG4gICAgZHJhd1F1YWRUcmVlTGluZXModHJlZU5vZGUpIHtcbiAgICAgICAgLy8gU2V0dXAgbGluZSBzdHlsZSBhbmQgY2FsbCB0aGUgZHJhd2luZyByb3V0aW5lc1xuICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9ICcjMDAwJztcbiAgICAgICAgdGhpcy5jdHgubGluZVdpZHRoID0gMTtcbiAgICAgICAgdGhpcy5jdHgubGluZUNhcCA9ICdidXR0JztcbiAgICAgICAgdGhpcy5fZHJhd1F1YWRUcmVlTGluZSh0cmVlTm9kZSk7XG4gICAgfVxuXG4gICAgX2RyYXdRdWFkVHJlZUxpbmUodHJlZU5vZGUpIHtcbiAgICAgICAgaWYgKCF0cmVlTm9kZSB8fCAhdHJlZU5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERyYXcgeCBhbmQgeSBsaW5lc1xuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5jdHgubW92ZVRvKHRyZWVOb2RlLm1pZFgsIHRyZWVOb2RlLnN0YXJ0WSk7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0cmVlTm9kZS5taWRYLCB0cmVlTm9kZS5zdGFydFkgKyB0cmVlTm9kZS5oZWlnaHQpO1xuICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcblxuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5jdHgubW92ZVRvKHRyZWVOb2RlLnN0YXJ0WCwgdHJlZU5vZGUubWlkWSk7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0cmVlTm9kZS5zdGFydFggKyB0cmVlTm9kZS53aWR0aCwgdHJlZU5vZGUubWlkWSk7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuXG4gICAgICAgIGZvciAoY29uc3QgY2hpbGROb2RlIG9mIHRyZWVOb2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICB0aGlzLl9kcmF3UXVhZFRyZWVMaW5lKGNoaWxkTm9kZSk7XG4gICAgICAgIH1cbiAgICB9XG59IC8vIGVuZCBncmF2aXRvbi9nZnhcbiIsIi8qKlxuICogZ3Jhdml0b24vc2ltIC0tIFRoZSBncmF2aXRhdGlvbmFsIHNpbXVsYXRvclxuICovXG5pbXBvcnQgR3RCb2R5IGZyb20gJy4vYm9keSc7XG5pbXBvcnQgR3RUcmVlIGZyb20gJy4vdHJlZSc7XG5pbXBvcnQgY29sb3JzIGZyb20gJy4uL3V0aWwvY29sb3JzJztcblxuLyoqIEV4ZXJ0IGZvcmNlIG9uIGEgYm9keSBhbmQgdXBkYXRlIGl0cyBuZXh0IHBvc2l0aW9uLiAqL1xuZnVuY3Rpb24gZXhlcnRGb3JjZShib2R5LCBuZXRGeCwgbmV0RnksIGRlbHRhVCkge1xuICAgIC8vIENhbGN1bGF0ZSBhY2NlbGVyYXRpb25zXG4gICAgY29uc3QgYXggPSBuZXRGeCAvIGJvZHkubWFzcztcbiAgICBjb25zdCBheSA9IG5ldEZ5IC8gYm9keS5tYXNzO1xuXG4gICAgLy8gQ2FsY3VsYXRlIG5ldyB2ZWxvY2l0aWVzLCBub3JtYWxpemVkIGJ5IHRoZSAndGltZScgaW50ZXJ2YWxcbiAgICBib2R5LnZlbFggKz0gZGVsdGFUICogYXg7XG4gICAgYm9keS52ZWxZICs9IGRlbHRhVCAqIGF5O1xuXG4gICAgLy8gQ2FsY3VsYXRlIG5ldyBwb3NpdGlvbnMgYWZ0ZXIgdGltZXN0ZXAgZGVsdGFUXG4gICAgLy8gTm90ZSB0aGF0IHRoaXMgZG9lc24ndCB1cGRhdGUgdGhlIGN1cnJlbnQgcG9zaXRpb24gaXRzZWxmIGluIG9yZGVyIHRvIG5vdCBhZmZlY3Qgb3RoZXJcbiAgICAvLyBmb3JjZSBjYWxjdWxhdGlvbnNcbiAgICBib2R5Lm5leHRYICs9IGRlbHRhVCAqIGJvZHkudmVsWDtcbiAgICBib2R5Lm5leHRZICs9IGRlbHRhVCAqIGJvZHkudmVsWTtcbn1cblxuLyoqIENhbGN1bGF0ZSB0aGUgZm9yY2UgZXhlcnRlZCBiZXR3ZWVuIGEgYm9keSBhbmQgYW4gYXR0cmFjdG9yIGJhc2VkIG9uIGdyYXZpdHkuICovXG5mdW5jdGlvbiBjYWxjdWxhdGVGb3JjZShib2R5LCBhdHRyYWN0b3IsIEcpIHtcbiAgICAvLyBDYWxjdWxhdGUgdGhlIGNoYW5nZSBpbiBwb3NpdGlvbiBhbG9uZyB0aGUgdHdvIGRpbWVuc2lvbnNcbiAgICBjb25zdCBkeCA9IGF0dHJhY3Rvci54IC0gYm9keS54O1xuICAgIGNvbnN0IGR5ID0gYXR0cmFjdG9yLnkgLSBib2R5Lnk7XG5cbiAgICAvLyBPYnRhaW4gdGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIG9iamVjdHMgKGh5cG90ZW51c2UpXG4gICAgY29uc3QgciA9IE1hdGguc3FydChNYXRoLnBvdyhkeCwgMikgKyBNYXRoLnBvdyhkeSwgMikpO1xuXG4gICAgLy8gQ2FsY3VsYXRlIGZvcmNlIHVzaW5nIE5ld3RvbmlhbiBncmF2aXR5LCBzZXBhcmF0ZSBvdXQgaW50byB4IGFuZCB5IGNvbXBvbmVudHNcbiAgICBjb25zdCBGID0gKEcgKiBib2R5Lm1hc3MgKiBhdHRyYWN0b3IubWFzcykgLyBNYXRoLnBvdyhyLCAyKTtcbiAgICBjb25zdCBGeCA9IEYgKiAoZHggLyByKTtcbiAgICBjb25zdCBGeSA9IEYgKiAoZHkgLyByKTtcbiAgICByZXR1cm4gW0Z4LCBGeV07XG59XG5cbi8qKiBDaGVja3Mgd2hldGhlciBvciBub3QgdHdvIGJvZGllcyBhcmUgY29sbGlkaW5nLiAqL1xuZnVuY3Rpb24gYXJlQ29sbGlkaW5nKGJvZHksIGNvbGxpZGVyLCB0aGV0YSA9IDAuMykge1xuICAgIGNvbnN0IGRpc3QgPSBib2R5LnJhZGl1cyArIGNvbGxpZGVyLnJhZGl1cztcbiAgICBjb25zdCBkeCA9IGJvZHkueCAtIGNvbGxpZGVyLng7XG4gICAgY29uc3QgZHkgPSBib2R5LnkgLSBjb2xsaWRlci55O1xuICAgIHJldHVybiAoZGlzdCAqIGRpc3QpICogdGhldGEgPiAoZHggKiBkeCkgKyAoZHkgKiBkeSk7XG59XG5cbmNsYXNzIEd0QnJ1dGVGb3JjZVNpbSB7XG4gICAgLyoqIEcgcmVwcmVzZW50cyB0aGUgZ3Jhdml0YXRpb25hbCBjb25zdGFudC4gKi9cbiAgICBjb25zdHJ1Y3RvcihHKSB7XG4gICAgICAgIHRoaXMuRyA9IEc7XG4gICAgfVxuXG4gICAgLyoqIENhbGN1bGF0ZSB0aGUgbmV3IHBvc2l0aW9uIG9mIGEgYm9keSBiYXNlZCBvbiBicnV0ZSBmb3JjZSBtZWNoYW5pY3MuICovXG4gICAgY2FsY3VsYXRlTmV3UG9zaXRpb24oYm9keSwgYXR0cmFjdG9ycywgdW51c2VkVHJlZVJvb3QsIGRlbHRhVCkge1xuICAgICAgICBsZXQgbmV0RnggPSAwO1xuICAgICAgICBsZXQgbmV0RnkgPSAwO1xuXG4gICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBhbGwgYm9kaWVzIGFuZCBzdW0gdGhlIGZvcmNlcyBleGVydGVkXG4gICAgICAgIGZvciAoY29uc3QgYXR0cmFjdG9yIG9mIGF0dHJhY3RvcnMpIHtcbiAgICAgICAgICAgIGlmIChib2R5ICE9PSBhdHRyYWN0b3IpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBbRngsIEZ5XSA9IGNhbGN1bGF0ZUZvcmNlKGJvZHksIGF0dHJhY3RvciwgdGhpcy5HKTtcbiAgICAgICAgICAgICAgICBuZXRGeCArPSBGeDtcbiAgICAgICAgICAgICAgICBuZXRGeSArPSBGeTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4ZXJ0Rm9yY2UoYm9keSwgbmV0RngsIG5ldEZ5LCBkZWx0YVQpO1xuICAgIH1cbn1cblxuY2xhc3MgR3RCYXJuZXNIdXRTaW0ge1xuICAgIC8qKiBHIHJlcHJlc2VudHMgdGhlIGdyYXZpdGF0aW9uYWwgY29uc3RhbnQuICovXG4gICAgY29uc3RydWN0b3IoRywgdGhldGEpIHtcbiAgICAgICAgdGhpcy5HID0gRztcbiAgICAgICAgdGhpcy50aGV0YSA9IHRoZXRhO1xuICAgICAgICB0aGlzLl9uZXRGeCA9IDA7XG4gICAgICAgIHRoaXMuX25ldEZ5ID0gMDtcbiAgICB9XG5cbiAgICAvKiogQ2FsY3VsYXRlIHRoZSBuZXcgcG9zaXRpb24gb2YgYSBib2R5IGJhc2VkIG9uIGJydXRlIGZvcmNlIG1lY2hhbmljcy4gKi9cbiAgICBjYWxjdWxhdGVOZXdQb3NpdGlvbihib2R5LCBhdHRyYWN0b3JzLCB0cmVlUm9vdCwgZGVsdGFUKSB7XG4gICAgICAgIHRoaXMuX25ldEZ4ID0gMDtcbiAgICAgICAgdGhpcy5fbmV0RnkgPSAwO1xuXG4gICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBhbGwgYm9kaWVzIGluIHRoZSB0cmVlIGFuZCBzdW0gdGhlIGZvcmNlcyBleGVydGVkXG4gICAgICAgIHRoaXMuY2FsY3VsYXRlRm9yY2VGcm9tVHJlZShib2R5LCB0cmVlUm9vdCk7XG4gICAgICAgIGV4ZXJ0Rm9yY2UoYm9keSwgdGhpcy5fbmV0RngsIHRoaXMuX25ldEZ5LCBkZWx0YVQpO1xuICAgIH1cblxuICAgIGNhbGN1bGF0ZUZvcmNlRnJvbVRyZWUoYm9keSwgdHJlZU5vZGUpIHtcbiAgICAgICAgLy8gSGFuZGxlIGVtcHR5IG5vZGVzXG4gICAgICAgIGlmICghdHJlZU5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdHJlZU5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIC8vIFRoZSBub2RlIGlzIGV4dGVybmFsIChpdCdzIGFuIGFjdHVhbCBib2R5KVxuICAgICAgICAgICAgaWYgKGJvZHkgIT09IHRyZWVOb2RlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgW0Z4LCBGeV0gPSBjYWxjdWxhdGVGb3JjZShib2R5LCB0cmVlTm9kZSwgdGhpcy5HKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9uZXRGeCArPSBGeDtcbiAgICAgICAgICAgICAgICB0aGlzLl9uZXRGeSArPSBGeTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSBub2RlIGlzIGludGVybmFsXG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBlZmZlY3RpdmUgcXVhZHJhbnQgc2l6ZSBhbmQgZGlzdGFuY2UgZnJvbSBjZW50ZXItb2YtbWFzc1xuICAgICAgICBjb25zdCBzID0gKHRyZWVOb2RlLndpZHRoICsgdHJlZU5vZGUuaGVpZ2h0KSAvIDI7XG5cbiAgICAgICAgY29uc3QgZHggPSB0cmVlTm9kZS54IC0gYm9keS54O1xuICAgICAgICBjb25zdCBkeSA9IHRyZWVOb2RlLnkgLSBib2R5Lnk7XG4gICAgICAgIGNvbnN0IGQgPSBNYXRoLnNxcnQoTWF0aC5wb3coZHgsIDIpICsgTWF0aC5wb3coZHksIDIpKTtcblxuICAgICAgICBpZiAocyAvIGQgPCB0aGlzLnRoZXRhKSB7XG4gICAgICAgICAgICAvLyBOb2RlIGlzIHN1ZmZpY2llbnRseSBmYXIgYXdheVxuICAgICAgICAgICAgY29uc3QgW0Z4LCBGeV0gPSBjYWxjdWxhdGVGb3JjZShib2R5LCB0cmVlTm9kZSwgdGhpcy5HKTtcbiAgICAgICAgICAgIHRoaXMuX25ldEZ4ICs9IEZ4O1xuICAgICAgICAgICAgdGhpcy5fbmV0RnkgKz0gRnk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBOb2RlIGlzIGNsb3NlOyByZWN1cnNlXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNoaWxkTm9kZSBvZiB0cmVlTm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgIHRoaXMuY2FsY3VsYXRlRm9yY2VGcm9tVHJlZShib2R5LCBjaGlsZE5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdFNpbSB7XG4gICAgY29uc3RydWN0b3IoYXJncykge1xuICAgICAgICBhcmdzID0gYXJncyB8fCB7fTtcblxuICAgICAgICB0aGlzLnVzZUJydXRlRm9yY2UgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5tZXJnZUNvbGxpc2lvbnMgPSB0cnVlO1xuXG4gICAgICAgIHRoaXMuRyA9IGFyZ3MuRyB8fCA2LjY3Mzg0ICogTWF0aC5wb3coMTAsIC0xMSk7IC8vIEdyYXZpdGF0aW9uYWwgY29uc3RhbnRcbiAgICAgICAgdGhpcy5tdWx0aXBsaWVyID0gYXJncy5tdWx0aXBsaWVyIHx8IDE1MDA7IC8vIFRpbWVzdGVwXG4gICAgICAgIHRoaXMuc2NhdHRlckxpbWl0V2lkdGggPSBhcmdzLnNjYXR0ZXJMaW1pdFdpZHRoIHx8IGFyZ3Mud2lkdGggKiAyO1xuICAgICAgICB0aGlzLnNjYXR0ZXJMaW1pdEhlaWdodCA9IGFyZ3Muc2NhdHRlckxpbWl0SGVpZ2h0IHx8IGFyZ3MuaGVpZ2h0ICogMjtcbiAgICAgICAgdGhpcy5zY2F0dGVyTGltaXRTdGFydFggPSAoYXJncy53aWR0aCAtIHRoaXMuc2NhdHRlckxpbWl0V2lkdGgpIC8gMjtcbiAgICAgICAgdGhpcy5zY2F0dGVyTGltaXRTdGFydFkgPSAoYXJncy5oZWlnaHQgLSB0aGlzLnNjYXR0ZXJMaW1pdEhlaWdodCkgLyAyO1xuICAgICAgICB0aGlzLnNjYXR0ZXJMaW1pdEVuZFggPSB0aGlzLnNjYXR0ZXJMaW1pdFN0YXJ0WCArIHRoaXMuc2NhdHRlckxpbWl0V2lkdGg7XG4gICAgICAgIHRoaXMuc2NhdHRlckxpbWl0RW5kWSA9IHRoaXMuc2NhdHRlckxpbWl0U3RhcnRZICsgdGhpcy5zY2F0dGVyTGltaXRIZWlnaHQ7XG5cbiAgICAgICAgdGhpcy5ib2RpZXMgPSBbXTtcbiAgICAgICAgLy8gSW5jb3Jwb3JhdGUgdGhlIHNjYXR0ZXIgbGltaXRcbiAgICAgICAgdGhpcy50cmVlID0gbmV3IEd0VHJlZShcbiAgICAgICAgICAgICAgICAvKiB3aWR0aCAqLyB0aGlzLnNjYXR0ZXJMaW1pdFdpZHRoLFxuICAgICAgICAgICAgICAgIC8qIGhlaWdodCAqLyB0aGlzLnNjYXR0ZXJMaW1pdEhlaWdodCxcbiAgICAgICAgICAgICAgICAvKiBzdGFydFggKi8gdGhpcy5zY2F0dGVyTGltaXRTdGFydFgsXG4gICAgICAgICAgICAgICAgLyogc3RhcnRZICovIHRoaXMuc2NhdHRlckxpbWl0U3RhcnRZKTtcbiAgICAgICAgdGhpcy50aW1lID0gMDtcblxuICAgICAgICB0aGlzLmJydXRlRm9yY2VTaW0gPSBuZXcgR3RCcnV0ZUZvcmNlU2ltKHRoaXMuRyk7XG4gICAgICAgIHRoaXMuYmFybmVzSHV0U2ltID0gbmV3IEd0QmFybmVzSHV0U2ltKHRoaXMuRywgLyogdGhldGEgKi8gMC41KTtcbiAgICAgICAgdGhpcy5hY3RpdmVTaW0gPSB0aGlzLnVzZUJydXRlRm9yY2UgPyB0aGlzLmJydXRlRm9yY2VTaW0gOiB0aGlzLmJhcm5lc0h1dFNpbTtcbiAgICB9XG5cbiAgICB0b2dnbGVTdHJhdGVneSgpIHtcbiAgICAgICAgdGhpcy51c2VCcnV0ZUZvcmNlID0gIXRoaXMudXNlQnJ1dGVGb3JjZTtcbiAgICAgICAgdGhpcy5hY3RpdmVTaW0gPSB0aGlzLnVzZUJydXRlRm9yY2UgPyB0aGlzLmJydXRlRm9yY2VTaW0gOiB0aGlzLmJhcm5lc0h1dFNpbTtcbiAgICB9XG5cbiAgICAvKiogQ2FsY3VsYXRlIGEgc3RlcCBvZiB0aGUgc2ltdWxhdGlvbi4gKi9cbiAgICBzdGVwKGVsYXBzZWQpIHtcbiAgICAgICAgaWYgKHRoaXMubWVyZ2VDb2xsaXNpb25zKSB7XG4gICAgICAgICAgICB0aGlzLl9tZXJnZUNvbGxpZGVkKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcmVtb3ZlU2NhdHRlcmVkKCk7XG5cbiAgICAgICAgaWYgKCF0aGlzLnVzZUJydXRlRm9yY2UpIHtcbiAgICAgICAgICAgIHRoaXMuX3Jlc2V0VHJlZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChjb25zdCBib2R5IG9mIHRoaXMuYm9kaWVzKSB7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZVNpbS5jYWxjdWxhdGVOZXdQb3NpdGlvbihcbiAgICAgICAgICAgICAgICAgICAgYm9keSwgdGhpcy5ib2RpZXMsIHRoaXMudHJlZS5yb290LCBlbGFwc2VkICogdGhpcy5tdWx0aXBsaWVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NvbW1pdFBvc2l0aW9uVXBkYXRlcygpO1xuICAgICAgICB0aGlzLnRpbWUgKz0gZWxhcHNlZDsgLy8gSW5jcmVtZW50IHJ1bnRpbWVcbiAgICB9XG5cbiAgICAvKiogVXBkYXRlIHBvc2l0aW9ucyBvZiBhbGwgYm9kaWVzIHRvIGJlIHRoZSBuZXh0IGNhbGN1bGF0ZWQgcG9zaXRpb24uICovXG4gICAgX2NvbW1pdFBvc2l0aW9uVXBkYXRlcygpIHtcbiAgICAgICAgZm9yIChjb25zdCBib2R5IG9mIHRoaXMuYm9kaWVzKSB7XG4gICAgICAgICAgICBib2R5LnggPSBib2R5Lm5leHRYO1xuICAgICAgICAgICAgYm9keS55ID0gYm9keS5uZXh0WTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBTY2FuIHRocm91Z2ggdGhlIGxpc3Qgb2YgYm9kaWVzIGFuZCByZW1vdmUgYW55IHRoYXQgaGF2ZSBmYWxsZW4gb3V0IG9mIHRoZSBzY2F0dGVyIGxpbWl0LiAqL1xuICAgIF9yZW1vdmVTY2F0dGVyZWQoKSB7XG4gICAgICAgIGxldCBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCB0aGlzLmJvZGllcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSB0aGlzLmJvZGllc1tpXTtcblxuICAgICAgICAgICAgaWYgKGJvZHkueCA+PSB0aGlzLnNjYXR0ZXJMaW1pdEVuZFggfHxcbiAgICAgICAgICAgICAgICBib2R5LnggPD0gdGhpcy5zY2F0dGVyTGltaXRTdGFydFggfHxcbiAgICAgICAgICAgICAgICBib2R5LnkgPj0gdGhpcy5zY2F0dGVyTGltaXRFbmRZIHx8XG4gICAgICAgICAgICAgICAgYm9keS55IDw9IHRoaXMuc2NhdHRlckxpbWl0U3RhcnRZKSB7XG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGZyb20gYm9keSBjb2xsZWN0aW9uXG4gICAgICAgICAgICAgICAgLy8gV2UgZG9uJ3QgbmVlZCB0byByZXNldCB0aGUgdHJlZSBoZXJlIGJlY2F1c2UgdGhpcyBpcyBhIHJ1bnRpbWUgKG5vdCB1c2VyLWJhc2VkKVxuICAgICAgICAgICAgICAgIC8vIG9wZXJhdGlvbiwgYW5kIHRoZSB0cmVlIGlzIHJlc2V0IGF1dG9tYXRpY2FsbHkgb24gZXZlcnkgc3RlcCBvZiB0aGUgc2ltdWxhdGlvbi5cbiAgICAgICAgICAgICAgICB0aGlzLmJvZGllcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9tZXJnZUNvbGxpZGVkKCkge1xuICAgICAgICBsZXQgaSA9IDA7XG4gICAgICAgIHdoaWxlIChpIDwgdGhpcy5ib2RpZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBjb2xsaWRpbmdJbmRpY2VzID0gW107XG4gICAgICAgICAgICAvLyBDb2xsZWN0IGNvbGxpZGluZyBlbGVtZW50czsgb25seSBuZWVkIHRvIGNoZWNrIGVhY2ggcGFpciBvbmNlXG4gICAgICAgICAgICBmb3IgKGxldCBqID0gaSArIDE7IGogPCB0aGlzLmJvZGllcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGlmIChhcmVDb2xsaWRpbmcodGhpcy5ib2RpZXNbaV0sIHRoaXMuYm9kaWVzW2pdKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBBZGQsIGluIG9yZGVyIG9mIGhpZ2hlc3QgaW5kZXggZmlyc3RcbiAgICAgICAgICAgICAgICAgICAgY29sbGlkaW5nSW5kaWNlcy51bnNoaWZ0KGopO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGNvbGxpZGluZ0luZGljZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgLy8gSW5jbHVkZSB0aGUgXCJzb3VyY2VcIiBlbGVtZW50IGluIHRoZSBjb2xsaXNpb24gc2V0XG4gICAgICAgICAgICAgICAgY29sbGlkaW5nSW5kaWNlcy5wdXNoKGkpO1xuXG4gICAgICAgICAgICAgICAgLy8gRXh0cmFjdCBlbGVtZW50cyBhbmQgbWVyZ2VcbiAgICAgICAgICAgICAgICBjb25zdCBjb2xsaWRpbmcgPSBjb2xsaWRpbmdJbmRpY2VzLm1hcChpZHggPT4gdGhpcy5ib2RpZXMuc3BsaWNlKGlkeCwgMSlbMF0pO1xuICAgICAgICAgICAgICAgIHRoaXMuX21lcmdlQm9kaWVzKGNvbGxpZGluZyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBNZXJnZSBhbmQgcmV0dXJuIHRoZSBhcmdzIGZvciBhIG5ldyBib2R5IGJhc2VkIG9uIGEgc2V0IG9mIG9sZCBib2RpZXMuICovXG4gICAgX21lcmdlQm9kaWVzKGJvZGllcykge1xuICAgICAgICBjb25zdCBuZXdCb2R5QXJncyA9IHsgeDogMCwgeTogMCwgdmVsWDogMCwgdmVsWTogMCwgbWFzczogMCwgY29sb3I6IGJvZGllc1swXS5jb2xvciB9O1xuICAgICAgICBsZXQgbGFyZ2VzdE1hc3MgPSAwO1xuICAgICAgICBsZXQgbW9tZW50dW1YID0gMDtcbiAgICAgICAgbGV0IG1vbWVudHVtWSA9IDA7XG4gICAgICAgIGZvciAoY29uc3QgYm9keSBvZiBib2RpZXMpIHtcbiAgICAgICAgICAgIGlmIChib2R5Lm1hc3MgPiBsYXJnZXN0TWFzcykge1xuICAgICAgICAgICAgICAgIG5ld0JvZHlBcmdzLnggPSBib2R5Lng7XG4gICAgICAgICAgICAgICAgbmV3Qm9keUFyZ3MueSA9IGJvZHkueTtcbiAgICAgICAgICAgICAgICBsYXJnZXN0TWFzcyA9IGJvZHkubWFzcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5ld0JvZHlBcmdzLm1hc3MgKz0gYm9keS5tYXNzO1xuICAgICAgICAgICAgbmV3Qm9keUFyZ3MuY29sb3IgPSBjb2xvcnMuYmxlbmQobmV3Qm9keUFyZ3MuY29sb3IsIGJvZHkuY29sb3IpO1xuICAgICAgICAgICAgbW9tZW50dW1YICs9IGJvZHkubWFzcyAqIGJvZHkudmVsWDtcbiAgICAgICAgICAgIG1vbWVudHVtWSArPSBib2R5Lm1hc3MgKiBib2R5LnZlbFk7XG4gICAgICAgIH1cbiAgICAgICAgbmV3Qm9keUFyZ3MudmVsWCA9IG1vbWVudHVtWCAvIG5ld0JvZHlBcmdzLm1hc3M7XG4gICAgICAgIG5ld0JvZHlBcmdzLnZlbFkgPSBtb21lbnR1bVkgLyBuZXdCb2R5QXJncy5tYXNzO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmFkZE5ld0JvZHkobmV3Qm9keUFyZ3MpO1xuICAgIH1cblxuICAgIC8qKiBDcmVhdGUgYW5kIHJldHVybiBhIG5ldyBib2R5IHRvIHRoZSBzaW11bGF0aW9uLiAqL1xuICAgIGFkZE5ld0JvZHkoYXJncykge1xuICAgICAgICBsZXQgYm9keSA9IG5ldyBHdEJvZHkoYXJncyk7XG4gICAgICAgIHRoaXMuYm9kaWVzLnB1c2goYm9keSk7XG4gICAgICAgIHRoaXMuX3Jlc2V0VHJlZSgpO1xuICAgICAgICByZXR1cm4gYm9keTtcbiAgICB9XG5cbiAgICAvKiogUmVtb3ZpbmcgYSB0YXJnZXQgYm9keSBmcm9tIHRoZSBzaW11bGF0aW9uLiAqL1xuICAgIHJlbW92ZUJvZHkodGFyZ2V0Qm9keSkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuYm9kaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gdGhpcy5ib2RpZXNbaV07XG4gICAgICAgICAgICBpZiAoYm9keSA9PT0gdGFyZ2V0Qm9keSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYm9kaWVzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZXNldFRyZWUoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBMb29rdXAgYW4gKHgsIHkpIGNvb3JkaW5hdGUgYW5kIHJldHVybiB0aGUgYm9keSB0aGF0IGlzIGF0IHRoYXQgcG9zaXRpb24uICovXG4gICAgZ2V0Qm9keUF0KHgsIHkpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMuYm9kaWVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gdGhpcy5ib2RpZXNbaV07XG4gICAgICAgICAgICBjb25zdCBpc01hdGNoID0gTWF0aC5hYnMoeCAtIGJvZHkueCkgPD0gYm9keS5yYWRpdXMgJiZcbiAgICAgICAgICAgICAgICBNYXRoLmFicyh5IC0gYm9keS55KSA8PSBib2R5LnJhZGl1cztcbiAgICAgICAgICAgIGlmIChpc01hdGNoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJvZHk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKiogQ2xlYXIgdGhlIHNpbXVsYXRpb24uICovXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuYm9kaWVzLmxlbmd0aCA9IDA7IC8vIFJlbW92ZSBhbGwgYm9kaWVzIGZyb20gY29sbGVjdGlvblxuICAgICAgICB0aGlzLl9yZXNldFRyZWUoKTtcbiAgICB9XG5cbiAgICAvKiogQ2xlYXIgYW5kIHJlc2V0IHRoZSBxdWFkdHJlZSwgYWRkaW5nIGFsbCBleGlzdGluZyBib2RpZXMgYmFjay4gKi9cbiAgICBfcmVzZXRUcmVlKCkge1xuICAgICAgICB0aGlzLnRyZWUuY2xlYXIoKTtcbiAgICAgICAgZm9yIChjb25zdCBib2R5IG9mIHRoaXMuYm9kaWVzKSB7XG4gICAgICAgICAgICB0aGlzLnRyZWUuYWRkQm9keShib2R5KTtcbiAgICAgICAgfVxuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL3NpbVxuIiwiLyoqXG4gKiBncmF2aXRvbi90aW1lciAtLSBTaW0gdGltZXIgYW5kIEZQUyBsaW1pdGVyXG4gKi9cbmltcG9ydCBlbnYgZnJvbSAnLi4vdXRpbC9lbnYnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHdFRpbWVyIHtcbiAgICBjb25zdHJ1Y3RvcihmbiwgZnBzPW51bGwpIHtcbiAgICAgICAgdGhpcy5fZm4gPSBmbjtcbiAgICAgICAgdGhpcy5fZnBzID0gZnBzO1xuICAgICAgICB0aGlzLl9pc0FjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9pc0FuaW1hdGlvbiA9IGZwcyA9PT0gbnVsbDtcbiAgICAgICAgdGhpcy5fY2FuY2VsbGF0aW9uSWQgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuX3dpbmRvdyA9IGVudi5nZXRXaW5kb3coKTtcbiAgICB9XG5cbiAgICBnZXQgYWN0aXZlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faXNBY3RpdmU7XG4gICAgfVxuXG4gICAgc3RhcnQoKSB7XG4gICAgICAgIGlmICghdGhpcy5faXNBY3RpdmUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9pc0FuaW1hdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2JlZ2luQW5pbWF0aW9uKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2JlZ2luSW50ZXJ2YWwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2lzQWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0b3AoKSB7XG4gICAgICAgIGlmICh0aGlzLl9pc0FjdGl2ZSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2lzQW5pbWF0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMuX2NhbmNlbGxhdGlvbklkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2luZG93LmNsZWFySW50ZXJ2YWwodGhpcy5fY2FuY2VsbGF0aW9uSWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5faXNBY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRvZ2dsZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2lzQWN0aXZlKSB7XG4gICAgICAgICAgICB0aGlzLnN0b3AoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9iZWdpbkFuaW1hdGlvbigpIHtcbiAgICAgICAgbGV0IGxhc3RUaW1lc3RhbXAgPSB0aGlzLl93aW5kb3cucGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgIGxldCBhbmltYXRvciA9ICh0aW1lc3RhbXApID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2NhbmNlbGxhdGlvbklkID0gdGhpcy5fd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRvcik7XG4gICAgICAgICAgICB0aGlzLl9mbih0aW1lc3RhbXAgLSBsYXN0VGltZXN0YW1wKTtcbiAgICAgICAgICAgIGxhc3RUaW1lc3RhbXAgPSB0aW1lc3RhbXA7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gRGVsYXkgaW5pdGlhbCBleGVjdXRpb24gdW50aWwgdGhlIG5leHQgdGljay5cbiAgICAgICAgdGhpcy5fY2FuY2VsbGF0aW9uSWQgPSB0aGlzLl93aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdG9yKTtcbiAgICB9XG5cbiAgICBfYmVnaW5JbnRlcnZhbCgpIHtcbiAgICAgICAgLy8gQ29tcHV0ZSB0aGUgZGVsYXkgcGVyIHRpY2ssIGluIG1pbGxpc2Vjb25kcy5cbiAgICAgICAgbGV0IHRpbWVvdXQgPSAxMDAwIC8gdGhpcy5fZnBzIHwgMDtcblxuICAgICAgICBsZXQgbGFzdFRpbWVzdGFtcCA9IHRoaXMuX3dpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgICAgdGhpcy5fY2FuY2VsbGF0aW9uSWQgPSB0aGlzLl93aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgbGV0IHRpbWVzdGFtcCA9IHRoaXMuX3dpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgICAgICAgIHRoaXMuX2ZuKHRpbWVzdGFtcCAtIGxhc3RUaW1lc3RhbXApO1xuICAgICAgICAgICAgbGFzdFRpbWVzdGFtcCA9IHRpbWVzdGFtcDtcbiAgICAgICAgIH0sIHRpbWVvdXQpO1xuICAgIH1cbn0gLy8gZW5kIGdyYXZpdG9uL3RpbWVyXG4iLCIvKipcbiAqIGdyYXZpdG9uL3RyZWUgLS0gVGhlIGdyYXZpdGF0aW9uYWwgYm9keSB0cmVlIHN0cnVjdHVyZVxuICovXG5cbmNvbnN0IE1BWF9ERVBUSCA9IDEwMDA7XG5cbmNsYXNzIEd0VHJlZU5vZGUge1xuICAgIGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQsIHN0YXJ0WCwgc3RhcnRZKSB7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIHRoaXMuc3RhcnRYID0gc3RhcnRYO1xuICAgICAgICB0aGlzLnN0YXJ0WSA9IHN0YXJ0WTtcblxuICAgICAgICAvLyBDb252ZW5pZW5jZSBjZW50ZXIgcG9pbnRzLlxuICAgICAgICB0aGlzLmhhbGZXaWR0aCA9IHdpZHRoIC8gMjtcbiAgICAgICAgdGhpcy5oYWxmSGVpZ2h0ID0gaGVpZ2h0IC8gMjtcbiAgICAgICAgdGhpcy5taWRYID0gdGhpcy5zdGFydFggKyB0aGlzLmhhbGZXaWR0aDtcbiAgICAgICAgdGhpcy5taWRZID0gdGhpcy5zdGFydFkgKyB0aGlzLmhhbGZIZWlnaHQ7XG5cbiAgICAgICAgLy8gTWF0Y2hlcyBHdEJvZHkncyBwcm9wZXJ0aWVzLlxuICAgICAgICB0aGlzLm1hc3MgPSAwO1xuICAgICAgICB0aGlzLnggPSAwO1xuICAgICAgICB0aGlzLnkgPSAwO1xuXG4gICAgICAgIC8vIFtOVywgTkUsIFNXLCBTRV1cbiAgICAgICAgdGhpcy5jaGlsZHJlbiA9IG5ldyBBcnJheSg0KTtcbiAgICB9XG5cbiAgICAvKiogQWRkIGEgYm9keSB0byB0aGUgdHJlZSwgdXBkYXRpbmcgbWFzcyBhbmQgY2VudGVycG9pbnQuICovXG4gICAgYWRkQm9keShib2R5LCBkZXB0aCA9IDEpIHtcbiAgICAgICAgaWYgKGRlcHRoID4gTUFYX0RFUFRIKSB7XG4gICAgICAgICAgICAvLyBTb21ldGhpbmcncyBnb25lIHdyb25nLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3VwZGF0ZU1hc3MoYm9keSk7XG4gICAgICAgIGNvbnN0IHF1YWRyYW50ID0gdGhpcy5fZ2V0UXVhZHJhbnQoYm9keS54LCBib2R5LnkpO1xuXG4gICAgICAgIGlmICh0aGlzLmNoaWxkcmVuW3F1YWRyYW50XSBpbnN0YW5jZW9mIEd0VHJlZU5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMuY2hpbGRyZW5bcXVhZHJhbnRdLmFkZEJvZHkoYm9keSwgZGVwdGggKyAxKTtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5jaGlsZHJlbltxdWFkcmFudF0pIHtcbiAgICAgICAgICAgIHRoaXMuY2hpbGRyZW5bcXVhZHJhbnRdID0gYm9keTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5jaGlsZHJlbltxdWFkcmFudF07XG4gICAgICAgICAgICBjb25zdCBxdWFkWCA9IGV4aXN0aW5nLnggPiB0aGlzLm1pZFggPyB0aGlzLm1pZFggOiB0aGlzLnN0YXJ0WDtcbiAgICAgICAgICAgIGNvbnN0IHF1YWRZID0gZXhpc3RpbmcueSA+IHRoaXMubWlkWSA/IHRoaXMubWlkWSA6IHRoaXMuc3RhcnRZO1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG5ldyBHdFRyZWVOb2RlKHRoaXMuaGFsZldpZHRoLCB0aGlzLmhhbGZIZWlnaHQsIHF1YWRYLCBxdWFkWSk7XG5cbiAgICAgICAgICAgIG5vZGUuYWRkQm9keShleGlzdGluZywgZGVwdGggKyAxKTtcbiAgICAgICAgICAgIG5vZGUuYWRkQm9keShib2R5LCBkZXB0aCArIDEpO1xuXG4gICAgICAgICAgICB0aGlzLmNoaWxkcmVuW3F1YWRyYW50XSA9IG5vZGU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogVXBkYXRlIHRoZSBjZW50ZXIgb2YgbWFzcyBiYXNlZCBvbiB0aGUgYWRkaXRpb24gb2YgYSBuZXcgYm9keS4gKi9cbiAgICBfdXBkYXRlTWFzcyhib2R5KSB7XG4gICAgICAgIGNvbnN0IG5ld01hc3MgPSB0aGlzLm1hc3MgKyBib2R5Lm1hc3M7XG4gICAgICAgIGNvbnN0IG5ld1ggPSAodGhpcy54ICogdGhpcy5tYXNzICsgYm9keS54ICogYm9keS5tYXNzKSAvIG5ld01hc3M7XG4gICAgICAgIGNvbnN0IG5ld1kgPSAodGhpcy55ICogdGhpcy5tYXNzICsgYm9keS55ICogYm9keS5tYXNzKSAvIG5ld01hc3M7XG4gICAgICAgIHRoaXMubWFzcyA9IG5ld01hc3M7XG4gICAgICAgIHRoaXMueCA9IG5ld1g7XG4gICAgICAgIHRoaXMueSA9IG5ld1k7XG4gICAgfVxuXG4gICAgLyoqIFJldHVybiB0aGUgcXVhZHJhbnQgaW5kZXggZm9yIGEgZ2l2ZW4gKHgsIHkpIHBhaXIuIEFzc3VtZXMgdGhhdCBpdCBsaWVzIHdpdGhpbiBib3VuZHMuICovXG4gICAgX2dldFF1YWRyYW50KHgsIHkpIHtcbiAgICAgICAgY29uc3QgeEluZGV4ID0gTnVtYmVyKHggPiB0aGlzLm1pZFgpO1xuICAgICAgICBjb25zdCB5SW5kZXggPSBOdW1iZXIoeSA+IHRoaXMubWlkWSkgKiAyO1xuICAgICAgICByZXR1cm4geEluZGV4ICsgeUluZGV4O1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR3RUcmVlIHtcbiAgICBjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0LCBzdGFydFggPSAwLCBzdGFydFkgPSAwKSB7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIHRoaXMuc3RhcnRYID0gc3RhcnRYO1xuICAgICAgICB0aGlzLnN0YXJ0WSA9IHN0YXJ0WTtcbiAgICAgICAgdGhpcy5yb290ID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGFkZEJvZHkoYm9keSkge1xuICAgICAgICBpZiAodGhpcy5yb290IGluc3RhbmNlb2YgR3RUcmVlTm9kZSkge1xuICAgICAgICAgICAgdGhpcy5yb290LmFkZEJvZHkoYm9keSk7XG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMucm9vdCkge1xuICAgICAgICAgICAgdGhpcy5yb290ID0gYm9keTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5yb290O1xuICAgICAgICAgICAgdGhpcy5yb290ID0gbmV3IEd0VHJlZU5vZGUodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHRoaXMuc3RhcnRYLCB0aGlzLnN0YXJ0WSk7XG4gICAgICAgICAgICB0aGlzLnJvb3QuYWRkQm9keShleGlzdGluZyk7XG4gICAgICAgICAgICB0aGlzLnJvb3QuYWRkQm9keShib2R5KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLnJvb3QgPSB1bmRlZmluZWQ7XG4gICAgfVxufSAvLyBlbmQgZ3Jhdml0b24vdHJlZVxuIiwiaW1wb3J0ICcuL3ZlbmRvci9qc2NvbG9yJztcbmltcG9ydCB2ZXggZnJvbSAnLi92ZW5kb3IvdmV4JztcbmltcG9ydCAnLi9wb2x5ZmlsbHMnO1xuaW1wb3J0IGd0IGZyb20gJy4vZ3Jhdml0b24nO1xuXG53aW5kb3cub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gU2V0IG9wdGlvbnMgZm9yIGRlcGVuZGVuY2llcy5cbiAgICB2ZXguZGVmYXVsdE9wdGlvbnMuY2xhc3NOYW1lID0gJ3ZleC10aGVtZS13aXJlZnJhbWUnO1xuXG4gICAgLy8gU3RhcnQgdGhlIG1haW4gZ3Jhdml0b24gYXBwLlxuICAgIHdpbmRvdy5ncmF2aXRvbiA9IG5ldyBndC5hcHAoKTtcbn07XG4iLCJ3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5zZXRUaW1lb3V0KGNhbGxiYWNrLCAxMDAwIC8gNjApO1xuICAgIH07XG5cbndpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSB8fFxuICAgIHdpbmRvdy5tb3pDYW5jZWxBbmltYXRpb25GcmFtZSB8fFxuICAgIGZ1bmN0aW9uKHRpbWVvdXRJZCkge1xuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgfTtcblxud2luZG93LnBlcmZvcm1hbmNlID0gd2luZG93LnBlcmZvcm1hbmNlIHx8IHt9O1xud2luZG93LnBlcmZvcm1hbmNlLm5vdyA9IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3cgfHxcbiAgICB3aW5kb3cucGVyZm9ybWFuY2Uud2Via2l0Tm93IHx8XG4gICAgd2luZG93LnBlcmZvcm1hbmNlLm1vek5vdyB8fFxuICAgIERhdGUubm93O1xuIiwiLyoqXG4gKiBjb2xvcnMgLS0gQ29sb3IgbWFuaXB1bGF0aW9uIGhlbHBlcnNcbiAqL1xuZXhwb3J0IGRlZmF1bHQge1xuICAgIGJyaWdodGVuKGNvbG9yQXJyYXksIHBlcmNlbnQpIHtcbiAgICAgICAgbGV0IFtyLCBnLCBiXSA9IGNvbG9yQXJyYXk7XG4gICAgICAgIHIgPSBNYXRoLnJvdW5kKE1hdGgubWluKE1hdGgubWF4KDAsIHIgKyAociAqIHBlcmNlbnQpKSwgMjU1KSk7XG4gICAgICAgIGcgPSBNYXRoLnJvdW5kKE1hdGgubWluKE1hdGgubWF4KDAsIGcgKyAoZyAqIHBlcmNlbnQpKSwgMjU1KSk7XG4gICAgICAgIGIgPSBNYXRoLnJvdW5kKE1hdGgubWluKE1hdGgubWF4KDAsIGIgKyAoYiAqIHBlcmNlbnQpKSwgMjU1KSk7XG4gICAgICAgIHJldHVybiBbciwgZywgYl07XG4gICAgfSxcblxuICAgIGZyb21IZXgoaGV4KSB7XG4gICAgICAgIGxldCBoID0gaGV4LnJlcGxhY2UoJyMnLCAnJyk7XG4gICAgICAgIGlmIChoLmxlbmd0aCA8IDYpIHtcbiAgICAgICAgICAgIGggPSBoLnJlcGxhY2UoLyguKS9nLCAnJDEkMScpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbcGFyc2VJbnQoaC5zdWJzdHIoMCwgMiksIDE2KSxcbiAgICAgICAgICAgICAgICBwYXJzZUludChoLnN1YnN0cigyLCAyKSwgMTYpLFxuICAgICAgICAgICAgICAgIHBhcnNlSW50KGguc3Vic3RyKDQsIDIpLCAxNildO1xuICAgIH0sXG5cbiAgICB0b0hleChjb2xvckFycmF5KSB7XG4gICAgICAgIGNvbnN0IFtyLCBnLCBiXSA9IGNvbG9yQXJyYXk7XG4gICAgICAgIHJldHVybiAnIycgKyAoJzAnICsgci50b1N0cmluZygxNikpLnN1YnN0cihyIDwgMTYgPyAwIDogMSkgK1xuICAgICAgICAgICAgICAgICAgICAgKCcwJyArIGcudG9TdHJpbmcoMTYpKS5zdWJzdHIoZyA8IDE2ID8gMCA6IDEpICtcbiAgICAgICAgICAgICAgICAgICAgICgnMCcgKyBiLnRvU3RyaW5nKDE2KSkuc3Vic3RyKGIgPCAxNiA/IDAgOiAxKTtcbiAgICB9LFxuXG4gICAgYmxlbmQoY29sb3IxLCBjb2xvcjIsIHBlcmNlbnRhZ2UgPSAwLjUpIHtcbiAgICAgICAgbGV0IHBhcnNlZENvbG9yMSA9IHRoaXMuZnJvbUhleChjb2xvcjEpO1xuICAgICAgICBsZXQgcGFyc2VkQ29sb3IyID0gdGhpcy5mcm9tSGV4KGNvbG9yMik7XG5cbiAgICAgICAgbGV0IGJsZW5kZWRDb2xvciA9IFtcbiAgICAgICAgICAgIE1hdGgucm91bmQoTWF0aC5taW4oTWF0aC5tYXgoMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoMSAtIHBlcmNlbnRhZ2UpICogcGFyc2VkQ29sb3IxWzBdICsgcGVyY2VudGFnZSAqIHBhcnNlZENvbG9yMlswXSksXG4gICAgICAgICAgICAgICAgICAgICAgICAyNTUpKSxcbiAgICAgICAgICAgIE1hdGgucm91bmQoTWF0aC5taW4oTWF0aC5tYXgoMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoMSAtIHBlcmNlbnRhZ2UpICogcGFyc2VkQ29sb3IxWzFdICsgcGVyY2VudGFnZSAqIHBhcnNlZENvbG9yMlsxXSksXG4gICAgICAgICAgICAgICAgICAgICAgICAyNTUpKSxcbiAgICAgICAgICAgIE1hdGgucm91bmQoTWF0aC5taW4oTWF0aC5tYXgoMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoMSAtIHBlcmNlbnRhZ2UpICogcGFyc2VkQ29sb3IxWzJdICsgcGVyY2VudGFnZSAqIHBhcnNlZENvbG9yMlsyXSksXG4gICAgICAgICAgICAgICAgICAgICAgICAyNTUpKVxuICAgICAgICBdO1xuICAgICAgICByZXR1cm4gdGhpcy50b0hleChibGVuZGVkQ29sb3IpO1xuICAgIH1cbn07XG4iLCIvKipcbiAqIGVudiAtIEVudmlyb25tZW50IHJldHJpZXZhbCBtZXRob2RzLlxuICovXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgZ2V0V2luZG93KCkge1xuICAgICAgICByZXR1cm4gd2luZG93O1xuICAgIH1cbn07XG4iLCIvKipcbiAqIHJhbmRvbSAtLSBBIGNvbGxlY3Rpb24gb2YgcmFuZG9tIGdlbmVyYXRvciBmdW5jdGlvbnNcbiAqL1xud2luZG93Lm13ZWVwID0gWzAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdO1xuZXhwb3J0IGRlZmF1bHQge1xuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGEgcmFuZG9tIG51bWJlciBiZXR3ZWVuIHRoZSBnaXZlbiBzdGFydCBhbmQgZW5kIHBvaW50c1xuICAgICAqL1xuICAgIG51bWJlcihmcm9tLCB0byA9IG51bGwpIHtcbiAgICAgICAgaWYgKHRvID09PSBudWxsKSB7XG4gICAgICAgICAgICB0byA9IGZyb207XG4gICAgICAgICAgICBmcm9tID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBNYXRoLnJhbmRvbSgpICogKHRvIC0gZnJvbSkgKyBmcm9tO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZSBhIHJhbmRvbSBpbnRlZ2VyIGJldHdlZW4gdGhlIGdpdmVuIHBvc2l0aW9uc1xuICAgICAqL1xuICAgIGludGVnZXIoLi4uYXJncykgeyByZXR1cm4gTWF0aC5mbG9vcih0aGlzLm51bWJlciguLi5hcmdzKSk7fSxcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGEgcmFuZG9tIG51bWJlciwgd2l0aCBhIHJhbmRvbSBzaWduLCBiZXR3ZWVuIHRoZSBnaXZlblxuICAgICAqIHBvc2l0aW9uc1xuICAgICAqL1xuICAgIGRpcmVjdGlvbmFsKC4uLmFyZ3MpIHtcbiAgICAgICAgbGV0IHJhbmQgPSB0aGlzLm51bWJlciguLi5hcmdzKTtcbiAgICAgICAgaWYgKE1hdGgucmFuZG9tKCkgPiAwLjUpIHtcbiAgICAgICAgICAgIHJhbmQgPSAtcmFuZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmFuZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgYSByYW5kb20gbnVtYmVyIGZyb20gdGhlIG5vcm1hbCBkaXN0cmlidXRpb24uXG4gICAgICovXG4gICAgbm9ybWFsKCkge1xuICAgICAgICBsZXQgdSA9IDEgLSBNYXRoLnJhbmRvbSgpO1xuICAgICAgICBsZXQgdiA9IDEgLSBNYXRoLnJhbmRvbSgpO1xuICAgICAgICAvLyBEaXZpc2lvbiBieSAzIGlzIG1lYW50IHRvIG5vcm1hbGl6ZSB0aGUgZGlzdHJpYnV0aW9uIHNvbWV3aGF0LlxuICAgICAgICByZXR1cm4gKE1hdGguc3FydCgtMi4wICogTWF0aC5sb2codSkpICogTWF0aC5jb3MoMi4wICogTWF0aC5QSSAqIHYpKSAvIDM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGEgcmFuZG9tIG51bWJlciBmcm9tIHRoZSBub3JtYWwgZGlzdHJpYnV0aW9uIGJldHdlZW4gYSBnaXZlblxuICAgICAqIHN0YXJ0IGFuZCBlbmQgcG9pbnQuXG4gICAgICovXG4gICAgbm9ybWFsRnJvbVRvKGZyb20sIHRvID0gbnVsbCkge1xuICAgICAgICBpZiAodG8gPT09IG51bGwpIHtcbiAgICAgICAgICAgIHRvID0gZnJvbTtcbiAgICAgICAgICAgIGZyb20gPSAwO1xuICAgICAgICB9XG4gICAgICAgIGxldCBnYXVzc2lhbjtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgLy8gU3dpdGNoIHJhbmdlIGZyb20gWy0xLCAxXSB0byBbMCwgMSkuXG4gICAgICAgICAgICBnYXVzc2lhbiA9ICh0aGlzLm5vcm1hbCgpICsgMSkgLyAyO1xuICAgICAgICB9IHdoaWxlIChnYXVzc2lhbiA8IDAgfHwgZ2F1c3NpYW4gPj0gMSk7XG4gICAgICAgIGxldCBpZHggPSBNYXRoLmZsb29yKGdhdXNzaWFuICogMTApO1xuICAgICAgICBtd2VlcFtpZHhdKys7XG4gICAgICAgIHJldHVybiBnYXVzc2lhbiAqICh0byAtIGZyb20pICsgZnJvbTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgYSByYW5kb20gaGV4YWRlY2ltYWwgY29sb3JcbiAgICAgKi9cbiAgICBjb2xvcigpIHtcbiAgICAgICAgcmV0dXJuICcjJyArICgnMDAwMDAnICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMHgxMDAwMDAwKS50b1N0cmluZygxNikpLnN1YnN0cigtNik7XG4gICAgfVxufTtcbiIsIi8qKlxuICoganNjb2xvciAtIEphdmFTY3JpcHQgQ29sb3IgUGlja2VyXG4gKlxuICogQGxpbmsgICAgaHR0cDovL2pzY29sb3IuY29tXG4gKiBAbGljZW5zZSBGb3Igb3BlbiBzb3VyY2UgdXNlOiBHUEx2M1xuICogICAgICAgICAgRm9yIGNvbW1lcmNpYWwgdXNlOiBKU0NvbG9yIENvbW1lcmNpYWwgTGljZW5zZVxuICogQGF1dGhvciAgSmFuIE9kdmFya29cbiAqIEB2ZXJzaW9uIDIuMC40XG4gKlxuICogU2VlIHVzYWdlIGV4YW1wbGVzIGF0IGh0dHA6Ly9qc2NvbG9yLmNvbS9leGFtcGxlcy9cbiAqL1xuXG5cblwidXNlIHN0cmljdFwiO1xuXG5cbmlmICghd2luZG93LmpzY29sb3IpIHsgd2luZG93LmpzY29sb3IgPSAoZnVuY3Rpb24gKCkge1xuXG5cbnZhciBqc2MgPSB7XG5cblxuXHRyZWdpc3RlciA6IGZ1bmN0aW9uICgpIHtcblx0XHRqc2MuYXR0YWNoRE9NUmVhZHlFdmVudChqc2MuaW5pdCk7XG5cdFx0anNjLmF0dGFjaEV2ZW50KGRvY3VtZW50LCAnbW91c2Vkb3duJywganNjLm9uRG9jdW1lbnRNb3VzZURvd24pO1xuXHRcdGpzYy5hdHRhY2hFdmVudChkb2N1bWVudCwgJ3RvdWNoc3RhcnQnLCBqc2Mub25Eb2N1bWVudFRvdWNoU3RhcnQpO1xuXHRcdGpzYy5hdHRhY2hFdmVudCh3aW5kb3csICdyZXNpemUnLCBqc2Mub25XaW5kb3dSZXNpemUpO1xuXHR9LFxuXG5cblx0aW5pdCA6IGZ1bmN0aW9uICgpIHtcblx0XHRpZiAoanNjLmpzY29sb3IubG9va3VwQ2xhc3MpIHtcblx0XHRcdGpzYy5qc2NvbG9yLmluc3RhbGxCeUNsYXNzTmFtZShqc2MuanNjb2xvci5sb29rdXBDbGFzcyk7XG5cdFx0fVxuXHR9LFxuXG5cblx0dHJ5SW5zdGFsbE9uRWxlbWVudHMgOiBmdW5jdGlvbiAoZWxtcywgY2xhc3NOYW1lKSB7XG5cdFx0dmFyIG1hdGNoQ2xhc3MgPSBuZXcgUmVnRXhwKCcoXnxcXFxccykoJyArIGNsYXNzTmFtZSArICcpKFxcXFxzKihcXFxce1tefV0qXFxcXH0pfFxcXFxzfCQpJywgJ2knKTtcblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZWxtcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0aWYgKGVsbXNbaV0udHlwZSAhPT0gdW5kZWZpbmVkICYmIGVsbXNbaV0udHlwZS50b0xvd2VyQ2FzZSgpID09ICdjb2xvcicpIHtcblx0XHRcdFx0aWYgKGpzYy5pc0NvbG9yQXR0clN1cHBvcnRlZCkge1xuXHRcdFx0XHRcdC8vIHNraXAgaW5wdXRzIG9mIHR5cGUgJ2NvbG9yJyBpZiBzdXBwb3J0ZWQgYnkgdGhlIGJyb3dzZXJcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0dmFyIG07XG5cdFx0XHRpZiAoIWVsbXNbaV0uanNjb2xvciAmJiBlbG1zW2ldLmNsYXNzTmFtZSAmJiAobSA9IGVsbXNbaV0uY2xhc3NOYW1lLm1hdGNoKG1hdGNoQ2xhc3MpKSkge1xuXHRcdFx0XHR2YXIgdGFyZ2V0RWxtID0gZWxtc1tpXTtcblx0XHRcdFx0dmFyIG9wdHNTdHIgPSBudWxsO1xuXG5cdFx0XHRcdHZhciBkYXRhT3B0aW9ucyA9IGpzYy5nZXREYXRhQXR0cih0YXJnZXRFbG0sICdqc2NvbG9yJyk7XG5cdFx0XHRcdGlmIChkYXRhT3B0aW9ucyAhPT0gbnVsbCkge1xuXHRcdFx0XHRcdG9wdHNTdHIgPSBkYXRhT3B0aW9ucztcblx0XHRcdFx0fSBlbHNlIGlmIChtWzRdKSB7XG5cdFx0XHRcdFx0b3B0c1N0ciA9IG1bNF07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgb3B0cyA9IHt9O1xuXHRcdFx0XHRpZiAob3B0c1N0cikge1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRvcHRzID0gKG5ldyBGdW5jdGlvbiAoJ3JldHVybiAoJyArIG9wdHNTdHIgKyAnKScpKSgpO1xuXHRcdFx0XHRcdH0gY2F0Y2goZVBhcnNlRXJyb3IpIHtcblx0XHRcdFx0XHRcdGpzYy53YXJuKCdFcnJvciBwYXJzaW5nIGpzY29sb3Igb3B0aW9uczogJyArIGVQYXJzZUVycm9yICsgJzpcXG4nICsgb3B0c1N0cik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHRhcmdldEVsbS5qc2NvbG9yID0gbmV3IGpzYy5qc2NvbG9yKHRhcmdldEVsbSwgb3B0cyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0aXNDb2xvckF0dHJTdXBwb3J0ZWQgOiAoZnVuY3Rpb24gKCkge1xuXHRcdHZhciBlbG0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuXHRcdGlmIChlbG0uc2V0QXR0cmlidXRlKSB7XG5cdFx0XHRlbG0uc2V0QXR0cmlidXRlKCd0eXBlJywgJ2NvbG9yJyk7XG5cdFx0XHRpZiAoZWxtLnR5cGUudG9Mb3dlckNhc2UoKSA9PSAnY29sb3InKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0pKCksXG5cblxuXHRpc0NhbnZhc1N1cHBvcnRlZCA6IChmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGVsbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRcdHJldHVybiAhIShlbG0uZ2V0Q29udGV4dCAmJiBlbG0uZ2V0Q29udGV4dCgnMmQnKSk7XG5cdH0pKCksXG5cblxuXHRmZXRjaEVsZW1lbnQgOiBmdW5jdGlvbiAobWl4ZWQpIHtcblx0XHRyZXR1cm4gdHlwZW9mIG1peGVkID09PSAnc3RyaW5nJyA/IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG1peGVkKSA6IG1peGVkO1xuXHR9LFxuXG5cblx0aXNFbGVtZW50VHlwZSA6IGZ1bmN0aW9uIChlbG0sIHR5cGUpIHtcblx0XHRyZXR1cm4gZWxtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09IHR5cGUudG9Mb3dlckNhc2UoKTtcblx0fSxcblxuXG5cdGdldERhdGFBdHRyIDogZnVuY3Rpb24gKGVsLCBuYW1lKSB7XG5cdFx0dmFyIGF0dHJOYW1lID0gJ2RhdGEtJyArIG5hbWU7XG5cdFx0dmFyIGF0dHJWYWx1ZSA9IGVsLmdldEF0dHJpYnV0ZShhdHRyTmFtZSk7XG5cdFx0aWYgKGF0dHJWYWx1ZSAhPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIGF0dHJWYWx1ZTtcblx0XHR9XG5cdFx0cmV0dXJuIG51bGw7XG5cdH0sXG5cblxuXHRhdHRhY2hFdmVudCA6IGZ1bmN0aW9uIChlbCwgZXZudCwgZnVuYykge1xuXHRcdGlmIChlbC5hZGRFdmVudExpc3RlbmVyKSB7XG5cdFx0XHRlbC5hZGRFdmVudExpc3RlbmVyKGV2bnQsIGZ1bmMsIGZhbHNlKTtcblx0XHR9IGVsc2UgaWYgKGVsLmF0dGFjaEV2ZW50KSB7XG5cdFx0XHRlbC5hdHRhY2hFdmVudCgnb24nICsgZXZudCwgZnVuYyk7XG5cdFx0fVxuXHR9LFxuXG5cblx0ZGV0YWNoRXZlbnQgOiBmdW5jdGlvbiAoZWwsIGV2bnQsIGZ1bmMpIHtcblx0XHRpZiAoZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuXHRcdFx0ZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihldm50LCBmdW5jLCBmYWxzZSk7XG5cdFx0fSBlbHNlIGlmIChlbC5kZXRhY2hFdmVudCkge1xuXHRcdFx0ZWwuZGV0YWNoRXZlbnQoJ29uJyArIGV2bnQsIGZ1bmMpO1xuXHRcdH1cblx0fSxcblxuXG5cdF9hdHRhY2hlZEdyb3VwRXZlbnRzIDoge30sXG5cblxuXHRhdHRhY2hHcm91cEV2ZW50IDogZnVuY3Rpb24gKGdyb3VwTmFtZSwgZWwsIGV2bnQsIGZ1bmMpIHtcblx0XHRpZiAoIWpzYy5fYXR0YWNoZWRHcm91cEV2ZW50cy5oYXNPd25Qcm9wZXJ0eShncm91cE5hbWUpKSB7XG5cdFx0XHRqc2MuX2F0dGFjaGVkR3JvdXBFdmVudHNbZ3JvdXBOYW1lXSA9IFtdO1xuXHRcdH1cblx0XHRqc2MuX2F0dGFjaGVkR3JvdXBFdmVudHNbZ3JvdXBOYW1lXS5wdXNoKFtlbCwgZXZudCwgZnVuY10pO1xuXHRcdGpzYy5hdHRhY2hFdmVudChlbCwgZXZudCwgZnVuYyk7XG5cdH0sXG5cblxuXHRkZXRhY2hHcm91cEV2ZW50cyA6IGZ1bmN0aW9uIChncm91cE5hbWUpIHtcblx0XHRpZiAoanNjLl9hdHRhY2hlZEdyb3VwRXZlbnRzLmhhc093blByb3BlcnR5KGdyb3VwTmFtZSkpIHtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwganNjLl9hdHRhY2hlZEdyb3VwRXZlbnRzW2dyb3VwTmFtZV0ubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0dmFyIGV2dCA9IGpzYy5fYXR0YWNoZWRHcm91cEV2ZW50c1tncm91cE5hbWVdW2ldO1xuXHRcdFx0XHRqc2MuZGV0YWNoRXZlbnQoZXZ0WzBdLCBldnRbMV0sIGV2dFsyXSk7XG5cdFx0XHR9XG5cdFx0XHRkZWxldGUganNjLl9hdHRhY2hlZEdyb3VwRXZlbnRzW2dyb3VwTmFtZV07XG5cdFx0fVxuXHR9LFxuXG5cblx0YXR0YWNoRE9NUmVhZHlFdmVudCA6IGZ1bmN0aW9uIChmdW5jKSB7XG5cdFx0dmFyIGZpcmVkID0gZmFsc2U7XG5cdFx0dmFyIGZpcmVPbmNlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKCFmaXJlZCkge1xuXHRcdFx0XHRmaXJlZCA9IHRydWU7XG5cdFx0XHRcdGZ1bmMoKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0aWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcblx0XHRcdHNldFRpbWVvdXQoZmlyZU9uY2UsIDEpOyAvLyBhc3luY1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmIChkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKSB7XG5cdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZmlyZU9uY2UsIGZhbHNlKTtcblxuXHRcdFx0Ly8gRmFsbGJhY2tcblx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZmlyZU9uY2UsIGZhbHNlKTtcblxuXHRcdH0gZWxzZSBpZiAoZG9jdW1lbnQuYXR0YWNoRXZlbnQpIHtcblx0XHRcdC8vIElFXG5cdFx0XHRkb2N1bWVudC5hdHRhY2hFdmVudCgnb25yZWFkeXN0YXRlY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xuXHRcdFx0XHRcdGRvY3VtZW50LmRldGFjaEV2ZW50KCdvbnJlYWR5c3RhdGVjaGFuZ2UnLCBhcmd1bWVudHMuY2FsbGVlKTtcblx0XHRcdFx0XHRmaXJlT25jZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXG5cdFx0XHQvLyBGYWxsYmFja1xuXHRcdFx0d2luZG93LmF0dGFjaEV2ZW50KCdvbmxvYWQnLCBmaXJlT25jZSk7XG5cblx0XHRcdC8vIElFNy84XG5cdFx0XHRpZiAoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRvU2Nyb2xsICYmIHdpbmRvdyA9PSB3aW5kb3cudG9wKSB7XG5cdFx0XHRcdHZhciB0cnlTY3JvbGwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0aWYgKCFkb2N1bWVudC5ib2R5KSB7IHJldHVybjsgfVxuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZG9TY3JvbGwoJ2xlZnQnKTtcblx0XHRcdFx0XHRcdGZpcmVPbmNlKCk7XG5cdFx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdFx0c2V0VGltZW91dCh0cnlTY3JvbGwsIDEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblx0XHRcdFx0dHJ5U2Nyb2xsKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cblx0d2FybiA6IGZ1bmN0aW9uIChtc2cpIHtcblx0XHRpZiAod2luZG93LmNvbnNvbGUgJiYgd2luZG93LmNvbnNvbGUud2Fybikge1xuXHRcdFx0d2luZG93LmNvbnNvbGUud2Fybihtc2cpO1xuXHRcdH1cblx0fSxcblxuXG5cdHByZXZlbnREZWZhdWx0IDogZnVuY3Rpb24gKGUpIHtcblx0XHRpZiAoZS5wcmV2ZW50RGVmYXVsdCkgeyBlLnByZXZlbnREZWZhdWx0KCk7IH1cblx0XHRlLnJldHVyblZhbHVlID0gZmFsc2U7XG5cdH0sXG5cblxuXHRjYXB0dXJlVGFyZ2V0IDogZnVuY3Rpb24gKHRhcmdldCkge1xuXHRcdC8vIElFXG5cdFx0aWYgKHRhcmdldC5zZXRDYXB0dXJlKSB7XG5cdFx0XHRqc2MuX2NhcHR1cmVkVGFyZ2V0ID0gdGFyZ2V0O1xuXHRcdFx0anNjLl9jYXB0dXJlZFRhcmdldC5zZXRDYXB0dXJlKCk7XG5cdFx0fVxuXHR9LFxuXG5cblx0cmVsZWFzZVRhcmdldCA6IGZ1bmN0aW9uICgpIHtcblx0XHQvLyBJRVxuXHRcdGlmIChqc2MuX2NhcHR1cmVkVGFyZ2V0KSB7XG5cdFx0XHRqc2MuX2NhcHR1cmVkVGFyZ2V0LnJlbGVhc2VDYXB0dXJlKCk7XG5cdFx0XHRqc2MuX2NhcHR1cmVkVGFyZ2V0ID0gbnVsbDtcblx0XHR9XG5cdH0sXG5cblxuXHRmaXJlRXZlbnQgOiBmdW5jdGlvbiAoZWwsIGV2bnQpIHtcblx0XHRpZiAoIWVsKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGlmIChkb2N1bWVudC5jcmVhdGVFdmVudCkge1xuXHRcdFx0dmFyIGV2ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0hUTUxFdmVudHMnKTtcblx0XHRcdGV2LmluaXRFdmVudChldm50LCB0cnVlLCB0cnVlKTtcblx0XHRcdGVsLmRpc3BhdGNoRXZlbnQoZXYpO1xuXHRcdH0gZWxzZSBpZiAoZG9jdW1lbnQuY3JlYXRlRXZlbnRPYmplY3QpIHtcblx0XHRcdHZhciBldiA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG5cdFx0XHRlbC5maXJlRXZlbnQoJ29uJyArIGV2bnQsIGV2KTtcblx0XHR9IGVsc2UgaWYgKGVsWydvbicgKyBldm50XSkgeyAvLyBhbHRlcm5hdGl2ZWx5IHVzZSB0aGUgdHJhZGl0aW9uYWwgZXZlbnQgbW9kZWxcblx0XHRcdGVsWydvbicgKyBldm50XSgpO1xuXHRcdH1cblx0fSxcblxuXG5cdGNsYXNzTmFtZVRvTGlzdCA6IGZ1bmN0aW9uIChjbGFzc05hbWUpIHtcblx0XHRyZXR1cm4gY2xhc3NOYW1lLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKS5zcGxpdCgvXFxzKy8pO1xuXHR9LFxuXG5cblx0Ly8gVGhlIGNsYXNzTmFtZSBwYXJhbWV0ZXIgKHN0cikgY2FuIG9ubHkgY29udGFpbiBhIHNpbmdsZSBjbGFzcyBuYW1lXG5cdGhhc0NsYXNzIDogZnVuY3Rpb24gKGVsbSwgY2xhc3NOYW1lKSB7XG5cdFx0aWYgKCFjbGFzc05hbWUpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0cmV0dXJuIC0xICE9ICgnICcgKyBlbG0uY2xhc3NOYW1lLnJlcGxhY2UoL1xccysvZywgJyAnKSArICcgJykuaW5kZXhPZignICcgKyBjbGFzc05hbWUgKyAnICcpO1xuXHR9LFxuXG5cblx0Ly8gVGhlIGNsYXNzTmFtZSBwYXJhbWV0ZXIgKHN0cikgY2FuIGNvbnRhaW4gbXVsdGlwbGUgY2xhc3MgbmFtZXMgc2VwYXJhdGVkIGJ5IHdoaXRlc3BhY2Vcblx0c2V0Q2xhc3MgOiBmdW5jdGlvbiAoZWxtLCBjbGFzc05hbWUpIHtcblx0XHR2YXIgY2xhc3NMaXN0ID0ganNjLmNsYXNzTmFtZVRvTGlzdChjbGFzc05hbWUpO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgY2xhc3NMaXN0Lmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRpZiAoIWpzYy5oYXNDbGFzcyhlbG0sIGNsYXNzTGlzdFtpXSkpIHtcblx0XHRcdFx0ZWxtLmNsYXNzTmFtZSArPSAoZWxtLmNsYXNzTmFtZSA/ICcgJyA6ICcnKSArIGNsYXNzTGlzdFtpXTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblxuXHQvLyBUaGUgY2xhc3NOYW1lIHBhcmFtZXRlciAoc3RyKSBjYW4gY29udGFpbiBtdWx0aXBsZSBjbGFzcyBuYW1lcyBzZXBhcmF0ZWQgYnkgd2hpdGVzcGFjZVxuXHR1bnNldENsYXNzIDogZnVuY3Rpb24gKGVsbSwgY2xhc3NOYW1lKSB7XG5cdFx0dmFyIGNsYXNzTGlzdCA9IGpzYy5jbGFzc05hbWVUb0xpc3QoY2xhc3NOYW1lKTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGNsYXNzTGlzdC5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0dmFyIHJlcGwgPSBuZXcgUmVnRXhwKFxuXHRcdFx0XHQnXlxcXFxzKicgKyBjbGFzc0xpc3RbaV0gKyAnXFxcXHMqfCcgK1xuXHRcdFx0XHQnXFxcXHMqJyArIGNsYXNzTGlzdFtpXSArICdcXFxccyokfCcgK1xuXHRcdFx0XHQnXFxcXHMrJyArIGNsYXNzTGlzdFtpXSArICcoXFxcXHMrKScsXG5cdFx0XHRcdCdnJ1xuXHRcdFx0KTtcblx0XHRcdGVsbS5jbGFzc05hbWUgPSBlbG0uY2xhc3NOYW1lLnJlcGxhY2UocmVwbCwgJyQxJyk7XG5cdFx0fVxuXHR9LFxuXG5cblx0Z2V0U3R5bGUgOiBmdW5jdGlvbiAoZWxtKSB7XG5cdFx0cmV0dXJuIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlID8gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxtKSA6IGVsbS5jdXJyZW50U3R5bGU7XG5cdH0sXG5cblxuXHRzZXRTdHlsZSA6IChmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGhlbHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdHZhciBnZXRTdXBwb3J0ZWRQcm9wID0gZnVuY3Rpb24gKG5hbWVzKSB7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IG5hbWVzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdGlmIChuYW1lc1tpXSBpbiBoZWxwZXIuc3R5bGUpIHtcblx0XHRcdFx0XHRyZXR1cm4gbmFtZXNbaV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXHRcdHZhciBwcm9wcyA9IHtcblx0XHRcdGJvcmRlclJhZGl1czogZ2V0U3VwcG9ydGVkUHJvcChbJ2JvcmRlclJhZGl1cycsICdNb3pCb3JkZXJSYWRpdXMnLCAnd2Via2l0Qm9yZGVyUmFkaXVzJ10pLFxuXHRcdFx0Ym94U2hhZG93OiBnZXRTdXBwb3J0ZWRQcm9wKFsnYm94U2hhZG93JywgJ01vekJveFNoYWRvdycsICd3ZWJraXRCb3hTaGFkb3cnXSlcblx0XHR9O1xuXHRcdHJldHVybiBmdW5jdGlvbiAoZWxtLCBwcm9wLCB2YWx1ZSkge1xuXHRcdFx0c3dpdGNoIChwcm9wLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRcdGNhc2UgJ29wYWNpdHknOlxuXHRcdFx0XHR2YXIgYWxwaGFPcGFjaXR5ID0gTWF0aC5yb3VuZChwYXJzZUZsb2F0KHZhbHVlKSAqIDEwMCk7XG5cdFx0XHRcdGVsbS5zdHlsZS5vcGFjaXR5ID0gdmFsdWU7XG5cdFx0XHRcdGVsbS5zdHlsZS5maWx0ZXIgPSAnYWxwaGEob3BhY2l0eT0nICsgYWxwaGFPcGFjaXR5ICsgJyknO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdGVsbS5zdHlsZVtwcm9wc1twcm9wXV0gPSB2YWx1ZTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSkoKSxcblxuXG5cdHNldEJvcmRlclJhZGl1cyA6IGZ1bmN0aW9uIChlbG0sIHZhbHVlKSB7XG5cdFx0anNjLnNldFN0eWxlKGVsbSwgJ2JvcmRlclJhZGl1cycsIHZhbHVlIHx8ICcwJyk7XG5cdH0sXG5cblxuXHRzZXRCb3hTaGFkb3cgOiBmdW5jdGlvbiAoZWxtLCB2YWx1ZSkge1xuXHRcdGpzYy5zZXRTdHlsZShlbG0sICdib3hTaGFkb3cnLCB2YWx1ZSB8fCAnbm9uZScpO1xuXHR9LFxuXG5cblx0Z2V0RWxlbWVudFBvcyA6IGZ1bmN0aW9uIChlLCByZWxhdGl2ZVRvVmlld3BvcnQpIHtcblx0XHR2YXIgeD0wLCB5PTA7XG5cdFx0dmFyIHJlY3QgPSBlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdHggPSByZWN0LmxlZnQ7XG5cdFx0eSA9IHJlY3QudG9wO1xuXHRcdGlmICghcmVsYXRpdmVUb1ZpZXdwb3J0KSB7XG5cdFx0XHR2YXIgdmlld1BvcyA9IGpzYy5nZXRWaWV3UG9zKCk7XG5cdFx0XHR4ICs9IHZpZXdQb3NbMF07XG5cdFx0XHR5ICs9IHZpZXdQb3NbMV07XG5cdFx0fVxuXHRcdHJldHVybiBbeCwgeV07XG5cdH0sXG5cblxuXHRnZXRFbGVtZW50U2l6ZSA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0cmV0dXJuIFtlLm9mZnNldFdpZHRoLCBlLm9mZnNldEhlaWdodF07XG5cdH0sXG5cblxuXHQvLyBnZXQgcG9pbnRlcidzIFgvWSBjb29yZGluYXRlcyByZWxhdGl2ZSB0byB2aWV3cG9ydFxuXHRnZXRBYnNQb2ludGVyUG9zIDogZnVuY3Rpb24gKGUpIHtcblx0XHRpZiAoIWUpIHsgZSA9IHdpbmRvdy5ldmVudDsgfVxuXHRcdHZhciB4ID0gMCwgeSA9IDA7XG5cdFx0aWYgKHR5cGVvZiBlLmNoYW5nZWRUb3VjaGVzICE9PSAndW5kZWZpbmVkJyAmJiBlLmNoYW5nZWRUb3VjaGVzLmxlbmd0aCkge1xuXHRcdFx0Ly8gdG91Y2ggZGV2aWNlc1xuXHRcdFx0eCA9IGUuY2hhbmdlZFRvdWNoZXNbMF0uY2xpZW50WDtcblx0XHRcdHkgPSBlLmNoYW5nZWRUb3VjaGVzWzBdLmNsaWVudFk7XG5cdFx0fSBlbHNlIGlmICh0eXBlb2YgZS5jbGllbnRYID09PSAnbnVtYmVyJykge1xuXHRcdFx0eCA9IGUuY2xpZW50WDtcblx0XHRcdHkgPSBlLmNsaWVudFk7XG5cdFx0fVxuXHRcdHJldHVybiB7IHg6IHgsIHk6IHkgfTtcblx0fSxcblxuXG5cdC8vIGdldCBwb2ludGVyJ3MgWC9ZIGNvb3JkaW5hdGVzIHJlbGF0aXZlIHRvIHRhcmdldCBlbGVtZW50XG5cdGdldFJlbFBvaW50ZXJQb3MgOiBmdW5jdGlvbiAoZSkge1xuXHRcdGlmICghZSkgeyBlID0gd2luZG93LmV2ZW50OyB9XG5cdFx0dmFyIHRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcblx0XHR2YXIgdGFyZ2V0UmVjdCA9IHRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuXHRcdHZhciB4ID0gMCwgeSA9IDA7XG5cblx0XHR2YXIgY2xpZW50WCA9IDAsIGNsaWVudFkgPSAwO1xuXHRcdGlmICh0eXBlb2YgZS5jaGFuZ2VkVG91Y2hlcyAhPT0gJ3VuZGVmaW5lZCcgJiYgZS5jaGFuZ2VkVG91Y2hlcy5sZW5ndGgpIHtcblx0XHRcdC8vIHRvdWNoIGRldmljZXNcblx0XHRcdGNsaWVudFggPSBlLmNoYW5nZWRUb3VjaGVzWzBdLmNsaWVudFg7XG5cdFx0XHRjbGllbnRZID0gZS5jaGFuZ2VkVG91Y2hlc1swXS5jbGllbnRZO1xuXHRcdH0gZWxzZSBpZiAodHlwZW9mIGUuY2xpZW50WCA9PT0gJ251bWJlcicpIHtcblx0XHRcdGNsaWVudFggPSBlLmNsaWVudFg7XG5cdFx0XHRjbGllbnRZID0gZS5jbGllbnRZO1xuXHRcdH1cblxuXHRcdHggPSBjbGllbnRYIC0gdGFyZ2V0UmVjdC5sZWZ0O1xuXHRcdHkgPSBjbGllbnRZIC0gdGFyZ2V0UmVjdC50b3A7XG5cdFx0cmV0dXJuIHsgeDogeCwgeTogeSB9O1xuXHR9LFxuXG5cblx0Z2V0Vmlld1BvcyA6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZG9jID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuXHRcdHJldHVybiBbXG5cdFx0XHQod2luZG93LnBhZ2VYT2Zmc2V0IHx8IGRvYy5zY3JvbGxMZWZ0KSAtIChkb2MuY2xpZW50TGVmdCB8fCAwKSxcblx0XHRcdCh3aW5kb3cucGFnZVlPZmZzZXQgfHwgZG9jLnNjcm9sbFRvcCkgLSAoZG9jLmNsaWVudFRvcCB8fCAwKVxuXHRcdF07XG5cdH0sXG5cblxuXHRnZXRWaWV3U2l6ZSA6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZG9jID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuXHRcdHJldHVybiBbXG5cdFx0XHQod2luZG93LmlubmVyV2lkdGggfHwgZG9jLmNsaWVudFdpZHRoKSxcblx0XHRcdCh3aW5kb3cuaW5uZXJIZWlnaHQgfHwgZG9jLmNsaWVudEhlaWdodCksXG5cdFx0XTtcblx0fSxcblxuXG5cdHJlZHJhd1Bvc2l0aW9uIDogZnVuY3Rpb24gKCkge1xuXG5cdFx0aWYgKGpzYy5waWNrZXIgJiYganNjLnBpY2tlci5vd25lcikge1xuXHRcdFx0dmFyIHRoaXNPYmogPSBqc2MucGlja2VyLm93bmVyO1xuXG5cdFx0XHR2YXIgdHAsIHZwO1xuXG5cdFx0XHRpZiAodGhpc09iai5maXhlZCkge1xuXHRcdFx0XHQvLyBGaXhlZCBlbGVtZW50cyBhcmUgcG9zaXRpb25lZCByZWxhdGl2ZSB0byB2aWV3cG9ydCxcblx0XHRcdFx0Ly8gdGhlcmVmb3JlIHdlIGNhbiBpZ25vcmUgdGhlIHNjcm9sbCBvZmZzZXRcblx0XHRcdFx0dHAgPSBqc2MuZ2V0RWxlbWVudFBvcyh0aGlzT2JqLnRhcmdldEVsZW1lbnQsIHRydWUpOyAvLyB0YXJnZXQgcG9zXG5cdFx0XHRcdHZwID0gWzAsIDBdOyAvLyB2aWV3IHBvc1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dHAgPSBqc2MuZ2V0RWxlbWVudFBvcyh0aGlzT2JqLnRhcmdldEVsZW1lbnQpOyAvLyB0YXJnZXQgcG9zXG5cdFx0XHRcdHZwID0ganNjLmdldFZpZXdQb3MoKTsgLy8gdmlldyBwb3Ncblx0XHRcdH1cblxuXHRcdFx0dmFyIHRzID0ganNjLmdldEVsZW1lbnRTaXplKHRoaXNPYmoudGFyZ2V0RWxlbWVudCk7IC8vIHRhcmdldCBzaXplXG5cdFx0XHR2YXIgdnMgPSBqc2MuZ2V0Vmlld1NpemUoKTsgLy8gdmlldyBzaXplXG5cdFx0XHR2YXIgcHMgPSBqc2MuZ2V0UGlja2VyT3V0ZXJEaW1zKHRoaXNPYmopOyAvLyBwaWNrZXIgc2l6ZVxuXHRcdFx0dmFyIGEsIGIsIGM7XG5cdFx0XHRzd2l0Y2ggKHRoaXNPYmoucG9zaXRpb24udG9Mb3dlckNhc2UoKSkge1xuXHRcdFx0XHRjYXNlICdsZWZ0JzogYT0xOyBiPTA7IGM9LTE7IGJyZWFrO1xuXHRcdFx0XHRjYXNlICdyaWdodCc6YT0xOyBiPTA7IGM9MTsgYnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3RvcCc6ICBhPTA7IGI9MTsgYz0tMTsgYnJlYWs7XG5cdFx0XHRcdGRlZmF1bHQ6ICAgICBhPTA7IGI9MTsgYz0xOyBicmVhaztcblx0XHRcdH1cblx0XHRcdHZhciBsID0gKHRzW2JdK3BzW2JdKS8yO1xuXG5cdFx0XHQvLyBjb21wdXRlIHBpY2tlciBwb3NpdGlvblxuXHRcdFx0aWYgKCF0aGlzT2JqLnNtYXJ0UG9zaXRpb24pIHtcblx0XHRcdFx0dmFyIHBwID0gW1xuXHRcdFx0XHRcdHRwW2FdLFxuXHRcdFx0XHRcdHRwW2JdK3RzW2JdLWwrbCpjXG5cdFx0XHRcdF07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR2YXIgcHAgPSBbXG5cdFx0XHRcdFx0LXZwW2FdK3RwW2FdK3BzW2FdID4gdnNbYV0gP1xuXHRcdFx0XHRcdFx0KC12cFthXSt0cFthXSt0c1thXS8yID4gdnNbYV0vMiAmJiB0cFthXSt0c1thXS1wc1thXSA+PSAwID8gdHBbYV0rdHNbYV0tcHNbYV0gOiB0cFthXSkgOlxuXHRcdFx0XHRcdFx0dHBbYV0sXG5cdFx0XHRcdFx0LXZwW2JdK3RwW2JdK3RzW2JdK3BzW2JdLWwrbCpjID4gdnNbYl0gP1xuXHRcdFx0XHRcdFx0KC12cFtiXSt0cFtiXSt0c1tiXS8yID4gdnNbYl0vMiAmJiB0cFtiXSt0c1tiXS1sLWwqYyA+PSAwID8gdHBbYl0rdHNbYl0tbC1sKmMgOiB0cFtiXSt0c1tiXS1sK2wqYykgOlxuXHRcdFx0XHRcdFx0KHRwW2JdK3RzW2JdLWwrbCpjID49IDAgPyB0cFtiXSt0c1tiXS1sK2wqYyA6IHRwW2JdK3RzW2JdLWwtbCpjKVxuXHRcdFx0XHRdO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgeCA9IHBwW2FdO1xuXHRcdFx0dmFyIHkgPSBwcFtiXTtcblx0XHRcdHZhciBwb3NpdGlvblZhbHVlID0gdGhpc09iai5maXhlZCA/ICdmaXhlZCcgOiAnYWJzb2x1dGUnO1xuXHRcdFx0dmFyIGNvbnRyYWN0U2hhZG93ID1cblx0XHRcdFx0KHBwWzBdICsgcHNbMF0gPiB0cFswXSB8fCBwcFswXSA8IHRwWzBdICsgdHNbMF0pICYmXG5cdFx0XHRcdChwcFsxXSArIHBzWzFdIDwgdHBbMV0gKyB0c1sxXSk7XG5cblx0XHRcdGpzYy5fZHJhd1Bvc2l0aW9uKHRoaXNPYmosIHgsIHksIHBvc2l0aW9uVmFsdWUsIGNvbnRyYWN0U2hhZG93KTtcblx0XHR9XG5cdH0sXG5cblxuXHRfZHJhd1Bvc2l0aW9uIDogZnVuY3Rpb24gKHRoaXNPYmosIHgsIHksIHBvc2l0aW9uVmFsdWUsIGNvbnRyYWN0U2hhZG93KSB7XG5cdFx0dmFyIHZTaGFkb3cgPSBjb250cmFjdFNoYWRvdyA/IDAgOiB0aGlzT2JqLnNoYWRvd0JsdXI7IC8vIHB4XG5cblx0XHRqc2MucGlja2VyLndyYXAuc3R5bGUucG9zaXRpb24gPSBwb3NpdGlvblZhbHVlO1xuXHRcdGpzYy5waWNrZXIud3JhcC5zdHlsZS5sZWZ0ID0geCArICdweCc7XG5cdFx0anNjLnBpY2tlci53cmFwLnN0eWxlLnRvcCA9IHkgKyAncHgnO1xuXG5cdFx0anNjLnNldEJveFNoYWRvdyhcblx0XHRcdGpzYy5waWNrZXIuYm94Uyxcblx0XHRcdHRoaXNPYmouc2hhZG93ID9cblx0XHRcdFx0bmV3IGpzYy5Cb3hTaGFkb3coMCwgdlNoYWRvdywgdGhpc09iai5zaGFkb3dCbHVyLCAwLCB0aGlzT2JqLnNoYWRvd0NvbG9yKSA6XG5cdFx0XHRcdG51bGwpO1xuXHR9LFxuXG5cblx0Z2V0UGlja2VyRGltcyA6IGZ1bmN0aW9uICh0aGlzT2JqKSB7XG5cdFx0dmFyIGRpc3BsYXlTbGlkZXIgPSAhIWpzYy5nZXRTbGlkZXJDb21wb25lbnQodGhpc09iaik7XG5cdFx0dmFyIGRpbXMgPSBbXG5cdFx0XHQyICogdGhpc09iai5pbnNldFdpZHRoICsgMiAqIHRoaXNPYmoucGFkZGluZyArIHRoaXNPYmoud2lkdGggK1xuXHRcdFx0XHQoZGlzcGxheVNsaWRlciA/IDIgKiB0aGlzT2JqLmluc2V0V2lkdGggKyBqc2MuZ2V0UGFkVG9TbGlkZXJQYWRkaW5nKHRoaXNPYmopICsgdGhpc09iai5zbGlkZXJTaXplIDogMCksXG5cdFx0XHQyICogdGhpc09iai5pbnNldFdpZHRoICsgMiAqIHRoaXNPYmoucGFkZGluZyArIHRoaXNPYmouaGVpZ2h0ICtcblx0XHRcdFx0KHRoaXNPYmouY2xvc2FibGUgPyAyICogdGhpc09iai5pbnNldFdpZHRoICsgdGhpc09iai5wYWRkaW5nICsgdGhpc09iai5idXR0b25IZWlnaHQgOiAwKVxuXHRcdF07XG5cdFx0cmV0dXJuIGRpbXM7XG5cdH0sXG5cblxuXHRnZXRQaWNrZXJPdXRlckRpbXMgOiBmdW5jdGlvbiAodGhpc09iaikge1xuXHRcdHZhciBkaW1zID0ganNjLmdldFBpY2tlckRpbXModGhpc09iaik7XG5cdFx0cmV0dXJuIFtcblx0XHRcdGRpbXNbMF0gKyAyICogdGhpc09iai5ib3JkZXJXaWR0aCxcblx0XHRcdGRpbXNbMV0gKyAyICogdGhpc09iai5ib3JkZXJXaWR0aFxuXHRcdF07XG5cdH0sXG5cblxuXHRnZXRQYWRUb1NsaWRlclBhZGRpbmcgOiBmdW5jdGlvbiAodGhpc09iaikge1xuXHRcdHJldHVybiBNYXRoLm1heCh0aGlzT2JqLnBhZGRpbmcsIDEuNSAqICgyICogdGhpc09iai5wb2ludGVyQm9yZGVyV2lkdGggKyB0aGlzT2JqLnBvaW50ZXJUaGlja25lc3MpKTtcblx0fSxcblxuXG5cdGdldFBhZFlDb21wb25lbnQgOiBmdW5jdGlvbiAodGhpc09iaikge1xuXHRcdHN3aXRjaCAodGhpc09iai5tb2RlLmNoYXJBdCgxKS50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0XHRjYXNlICd2JzogcmV0dXJuICd2JzsgYnJlYWs7XG5cdFx0fVxuXHRcdHJldHVybiAncyc7XG5cdH0sXG5cblxuXHRnZXRTbGlkZXJDb21wb25lbnQgOiBmdW5jdGlvbiAodGhpc09iaikge1xuXHRcdGlmICh0aGlzT2JqLm1vZGUubGVuZ3RoID4gMikge1xuXHRcdFx0c3dpdGNoICh0aGlzT2JqLm1vZGUuY2hhckF0KDIpLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRcdFx0Y2FzZSAncyc6IHJldHVybiAncyc7IGJyZWFrO1xuXHRcdFx0XHRjYXNlICd2JzogcmV0dXJuICd2JzsgYnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBudWxsO1xuXHR9LFxuXG5cblx0b25Eb2N1bWVudE1vdXNlRG93biA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0aWYgKCFlKSB7IGUgPSB3aW5kb3cuZXZlbnQ7IH1cblx0XHR2YXIgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuXG5cdFx0aWYgKHRhcmdldC5fanNjTGlua2VkSW5zdGFuY2UpIHtcblx0XHRcdGlmICh0YXJnZXQuX2pzY0xpbmtlZEluc3RhbmNlLnNob3dPbkNsaWNrKSB7XG5cdFx0XHRcdHRhcmdldC5fanNjTGlua2VkSW5zdGFuY2Uuc2hvdygpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAodGFyZ2V0Ll9qc2NDb250cm9sTmFtZSkge1xuXHRcdFx0anNjLm9uQ29udHJvbFBvaW50ZXJTdGFydChlLCB0YXJnZXQsIHRhcmdldC5fanNjQ29udHJvbE5hbWUsICdtb3VzZScpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBNb3VzZSBpcyBvdXRzaWRlIHRoZSBwaWNrZXIgY29udHJvbHMgLT4gaGlkZSB0aGUgY29sb3IgcGlja2VyIVxuXHRcdFx0aWYgKGpzYy5waWNrZXIgJiYganNjLnBpY2tlci5vd25lcikge1xuXHRcdFx0XHRqc2MucGlja2VyLm93bmVyLmhpZGUoKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblxuXHRvbkRvY3VtZW50VG91Y2hTdGFydCA6IGZ1bmN0aW9uIChlKSB7XG5cdFx0aWYgKCFlKSB7IGUgPSB3aW5kb3cuZXZlbnQ7IH1cblx0XHR2YXIgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuXG5cdFx0aWYgKHRhcmdldC5fanNjTGlua2VkSW5zdGFuY2UpIHtcblx0XHRcdGlmICh0YXJnZXQuX2pzY0xpbmtlZEluc3RhbmNlLnNob3dPbkNsaWNrKSB7XG5cdFx0XHRcdHRhcmdldC5fanNjTGlua2VkSW5zdGFuY2Uuc2hvdygpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAodGFyZ2V0Ll9qc2NDb250cm9sTmFtZSkge1xuXHRcdFx0anNjLm9uQ29udHJvbFBvaW50ZXJTdGFydChlLCB0YXJnZXQsIHRhcmdldC5fanNjQ29udHJvbE5hbWUsICd0b3VjaCcpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAoanNjLnBpY2tlciAmJiBqc2MucGlja2VyLm93bmVyKSB7XG5cdFx0XHRcdGpzYy5waWNrZXIub3duZXIuaGlkZSgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXG5cdG9uV2luZG93UmVzaXplIDogZnVuY3Rpb24gKGUpIHtcblx0XHRqc2MucmVkcmF3UG9zaXRpb24oKTtcblx0fSxcblxuXG5cdG9uUGFyZW50U2Nyb2xsIDogZnVuY3Rpb24gKGUpIHtcblx0XHQvLyBoaWRlIHRoZSBwaWNrZXIgd2hlbiBvbmUgb2YgdGhlIHBhcmVudCBlbGVtZW50cyBpcyBzY3JvbGxlZFxuXHRcdGlmIChqc2MucGlja2VyICYmIGpzYy5waWNrZXIub3duZXIpIHtcblx0XHRcdGpzYy5waWNrZXIub3duZXIuaGlkZSgpO1xuXHRcdH1cblx0fSxcblxuXG5cdF9wb2ludGVyTW92ZUV2ZW50IDoge1xuXHRcdG1vdXNlOiAnbW91c2Vtb3ZlJyxcblx0XHR0b3VjaDogJ3RvdWNobW92ZSdcblx0fSxcblx0X3BvaW50ZXJFbmRFdmVudCA6IHtcblx0XHRtb3VzZTogJ21vdXNldXAnLFxuXHRcdHRvdWNoOiAndG91Y2hlbmQnXG5cdH0sXG5cblxuXHRfcG9pbnRlck9yaWdpbiA6IG51bGwsXG5cdF9jYXB0dXJlZFRhcmdldCA6IG51bGwsXG5cblxuXHRvbkNvbnRyb2xQb2ludGVyU3RhcnQgOiBmdW5jdGlvbiAoZSwgdGFyZ2V0LCBjb250cm9sTmFtZSwgcG9pbnRlclR5cGUpIHtcblx0XHR2YXIgdGhpc09iaiA9IHRhcmdldC5fanNjSW5zdGFuY2U7XG5cblx0XHRqc2MucHJldmVudERlZmF1bHQoZSk7XG5cdFx0anNjLmNhcHR1cmVUYXJnZXQodGFyZ2V0KTtcblxuXHRcdHZhciByZWdpc3RlckRyYWdFdmVudHMgPSBmdW5jdGlvbiAoZG9jLCBvZmZzZXQpIHtcblx0XHRcdGpzYy5hdHRhY2hHcm91cEV2ZW50KCdkcmFnJywgZG9jLCBqc2MuX3BvaW50ZXJNb3ZlRXZlbnRbcG9pbnRlclR5cGVdLFxuXHRcdFx0XHRqc2Mub25Eb2N1bWVudFBvaW50ZXJNb3ZlKGUsIHRhcmdldCwgY29udHJvbE5hbWUsIHBvaW50ZXJUeXBlLCBvZmZzZXQpKTtcblx0XHRcdGpzYy5hdHRhY2hHcm91cEV2ZW50KCdkcmFnJywgZG9jLCBqc2MuX3BvaW50ZXJFbmRFdmVudFtwb2ludGVyVHlwZV0sXG5cdFx0XHRcdGpzYy5vbkRvY3VtZW50UG9pbnRlckVuZChlLCB0YXJnZXQsIGNvbnRyb2xOYW1lLCBwb2ludGVyVHlwZSkpO1xuXHRcdH07XG5cblx0XHRyZWdpc3RlckRyYWdFdmVudHMoZG9jdW1lbnQsIFswLCAwXSk7XG5cblx0XHRpZiAod2luZG93LnBhcmVudCAmJiB3aW5kb3cuZnJhbWVFbGVtZW50KSB7XG5cdFx0XHR2YXIgcmVjdCA9IHdpbmRvdy5mcmFtZUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdFx0XHR2YXIgb2ZzID0gWy1yZWN0LmxlZnQsIC1yZWN0LnRvcF07XG5cdFx0XHRyZWdpc3RlckRyYWdFdmVudHMod2luZG93LnBhcmVudC53aW5kb3cuZG9jdW1lbnQsIG9mcyk7XG5cdFx0fVxuXG5cdFx0dmFyIGFicyA9IGpzYy5nZXRBYnNQb2ludGVyUG9zKGUpO1xuXHRcdHZhciByZWwgPSBqc2MuZ2V0UmVsUG9pbnRlclBvcyhlKTtcblx0XHRqc2MuX3BvaW50ZXJPcmlnaW4gPSB7XG5cdFx0XHR4OiBhYnMueCAtIHJlbC54LFxuXHRcdFx0eTogYWJzLnkgLSByZWwueVxuXHRcdH07XG5cblx0XHRzd2l0Y2ggKGNvbnRyb2xOYW1lKSB7XG5cdFx0Y2FzZSAncGFkJzpcblx0XHRcdC8vIGlmIHRoZSBzbGlkZXIgaXMgYXQgdGhlIGJvdHRvbSwgbW92ZSBpdCB1cFxuXHRcdFx0c3dpdGNoIChqc2MuZ2V0U2xpZGVyQ29tcG9uZW50KHRoaXNPYmopKSB7XG5cdFx0XHRjYXNlICdzJzogaWYgKHRoaXNPYmouaHN2WzFdID09PSAwKSB7IHRoaXNPYmouZnJvbUhTVihudWxsLCAxMDAsIG51bGwpOyB9OyBicmVhaztcblx0XHRcdGNhc2UgJ3YnOiBpZiAodGhpc09iai5oc3ZbMl0gPT09IDApIHsgdGhpc09iai5mcm9tSFNWKG51bGwsIG51bGwsIDEwMCk7IH07IGJyZWFrO1xuXHRcdFx0fVxuXHRcdFx0anNjLnNldFBhZCh0aGlzT2JqLCBlLCAwLCAwKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSAnc2xkJzpcblx0XHRcdGpzYy5zZXRTbGQodGhpc09iaiwgZSwgMCk7XG5cdFx0XHRicmVhaztcblx0XHR9XG5cblx0XHRqc2MuZGlzcGF0Y2hGaW5lQ2hhbmdlKHRoaXNPYmopO1xuXHR9LFxuXG5cblx0b25Eb2N1bWVudFBvaW50ZXJNb3ZlIDogZnVuY3Rpb24gKGUsIHRhcmdldCwgY29udHJvbE5hbWUsIHBvaW50ZXJUeXBlLCBvZmZzZXQpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKGUpIHtcblx0XHRcdHZhciB0aGlzT2JqID0gdGFyZ2V0Ll9qc2NJbnN0YW5jZTtcblx0XHRcdHN3aXRjaCAoY29udHJvbE5hbWUpIHtcblx0XHRcdGNhc2UgJ3BhZCc6XG5cdFx0XHRcdGlmICghZSkgeyBlID0gd2luZG93LmV2ZW50OyB9XG5cdFx0XHRcdGpzYy5zZXRQYWQodGhpc09iaiwgZSwgb2Zmc2V0WzBdLCBvZmZzZXRbMV0pO1xuXHRcdFx0XHRqc2MuZGlzcGF0Y2hGaW5lQ2hhbmdlKHRoaXNPYmopO1xuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSAnc2xkJzpcblx0XHRcdFx0aWYgKCFlKSB7IGUgPSB3aW5kb3cuZXZlbnQ7IH1cblx0XHRcdFx0anNjLnNldFNsZCh0aGlzT2JqLCBlLCBvZmZzZXRbMV0pO1xuXHRcdFx0XHRqc2MuZGlzcGF0Y2hGaW5lQ2hhbmdlKHRoaXNPYmopO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblxuXHRvbkRvY3VtZW50UG9pbnRlckVuZCA6IGZ1bmN0aW9uIChlLCB0YXJnZXQsIGNvbnRyb2xOYW1lLCBwb2ludGVyVHlwZSkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAoZSkge1xuXHRcdFx0dmFyIHRoaXNPYmogPSB0YXJnZXQuX2pzY0luc3RhbmNlO1xuXHRcdFx0anNjLmRldGFjaEdyb3VwRXZlbnRzKCdkcmFnJyk7XG5cdFx0XHRqc2MucmVsZWFzZVRhcmdldCgpO1xuXHRcdFx0Ly8gQWx3YXlzIGRpc3BhdGNoIGNoYW5nZXMgYWZ0ZXIgZGV0YWNoaW5nIG91dHN0YW5kaW5nIG1vdXNlIGhhbmRsZXJzLFxuXHRcdFx0Ly8gaW4gY2FzZSBzb21lIHVzZXIgaW50ZXJhY3Rpb24gd2lsbCBvY2N1ciBpbiB1c2VyJ3Mgb25jaGFuZ2UgY2FsbGJhY2tcblx0XHRcdC8vIHRoYXQgd291bGQgaW50cnVkZSB3aXRoIGN1cnJlbnQgbW91c2UgZXZlbnRzXG5cdFx0XHRqc2MuZGlzcGF0Y2hDaGFuZ2UodGhpc09iaik7XG5cdFx0fTtcblx0fSxcblxuXG5cdGRpc3BhdGNoQ2hhbmdlIDogZnVuY3Rpb24gKHRoaXNPYmopIHtcblx0XHRpZiAodGhpc09iai52YWx1ZUVsZW1lbnQpIHtcblx0XHRcdGlmIChqc2MuaXNFbGVtZW50VHlwZSh0aGlzT2JqLnZhbHVlRWxlbWVudCwgJ2lucHV0JykpIHtcblx0XHRcdFx0anNjLmZpcmVFdmVudCh0aGlzT2JqLnZhbHVlRWxlbWVudCwgJ2NoYW5nZScpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXG5cdGRpc3BhdGNoRmluZUNoYW5nZSA6IGZ1bmN0aW9uICh0aGlzT2JqKSB7XG5cdFx0aWYgKHRoaXNPYmoub25GaW5lQ2hhbmdlKSB7XG5cdFx0XHR2YXIgY2FsbGJhY2s7XG5cdFx0XHRpZiAodHlwZW9mIHRoaXNPYmoub25GaW5lQ2hhbmdlID09PSAnc3RyaW5nJykge1xuXHRcdFx0XHRjYWxsYmFjayA9IG5ldyBGdW5jdGlvbiAodGhpc09iai5vbkZpbmVDaGFuZ2UpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y2FsbGJhY2sgPSB0aGlzT2JqLm9uRmluZUNoYW5nZTtcblx0XHRcdH1cblx0XHRcdGNhbGxiYWNrLmNhbGwodGhpc09iaik7XG5cdFx0fVxuXHR9LFxuXG5cblx0c2V0UGFkIDogZnVuY3Rpb24gKHRoaXNPYmosIGUsIG9mc1gsIG9mc1kpIHtcblx0XHR2YXIgcG9pbnRlckFicyA9IGpzYy5nZXRBYnNQb2ludGVyUG9zKGUpO1xuXHRcdHZhciB4ID0gb2ZzWCArIHBvaW50ZXJBYnMueCAtIGpzYy5fcG9pbnRlck9yaWdpbi54IC0gdGhpc09iai5wYWRkaW5nIC0gdGhpc09iai5pbnNldFdpZHRoO1xuXHRcdHZhciB5ID0gb2ZzWSArIHBvaW50ZXJBYnMueSAtIGpzYy5fcG9pbnRlck9yaWdpbi55IC0gdGhpc09iai5wYWRkaW5nIC0gdGhpc09iai5pbnNldFdpZHRoO1xuXG5cdFx0dmFyIHhWYWwgPSB4ICogKDM2MCAvICh0aGlzT2JqLndpZHRoIC0gMSkpO1xuXHRcdHZhciB5VmFsID0gMTAwIC0gKHkgKiAoMTAwIC8gKHRoaXNPYmouaGVpZ2h0IC0gMSkpKTtcblxuXHRcdHN3aXRjaCAoanNjLmdldFBhZFlDb21wb25lbnQodGhpc09iaikpIHtcblx0XHRjYXNlICdzJzogdGhpc09iai5mcm9tSFNWKHhWYWwsIHlWYWwsIG51bGwsIGpzYy5sZWF2ZVNsZCk7IGJyZWFrO1xuXHRcdGNhc2UgJ3YnOiB0aGlzT2JqLmZyb21IU1YoeFZhbCwgbnVsbCwgeVZhbCwganNjLmxlYXZlU2xkKTsgYnJlYWs7XG5cdFx0fVxuXHR9LFxuXG5cblx0c2V0U2xkIDogZnVuY3Rpb24gKHRoaXNPYmosIGUsIG9mc1kpIHtcblx0XHR2YXIgcG9pbnRlckFicyA9IGpzYy5nZXRBYnNQb2ludGVyUG9zKGUpO1xuXHRcdHZhciB5ID0gb2ZzWSArIHBvaW50ZXJBYnMueSAtIGpzYy5fcG9pbnRlck9yaWdpbi55IC0gdGhpc09iai5wYWRkaW5nIC0gdGhpc09iai5pbnNldFdpZHRoO1xuXG5cdFx0dmFyIHlWYWwgPSAxMDAgLSAoeSAqICgxMDAgLyAodGhpc09iai5oZWlnaHQgLSAxKSkpO1xuXG5cdFx0c3dpdGNoIChqc2MuZ2V0U2xpZGVyQ29tcG9uZW50KHRoaXNPYmopKSB7XG5cdFx0Y2FzZSAncyc6IHRoaXNPYmouZnJvbUhTVihudWxsLCB5VmFsLCBudWxsLCBqc2MubGVhdmVQYWQpOyBicmVhaztcblx0XHRjYXNlICd2JzogdGhpc09iai5mcm9tSFNWKG51bGwsIG51bGwsIHlWYWwsIGpzYy5sZWF2ZVBhZCk7IGJyZWFrO1xuXHRcdH1cblx0fSxcblxuXG5cdF92bWxOUyA6ICdqc2Nfdm1sXycsXG5cdF92bWxDU1MgOiAnanNjX3ZtbF9jc3NfJyxcblx0X3ZtbFJlYWR5IDogZmFsc2UsXG5cblxuXHRpbml0Vk1MIDogZnVuY3Rpb24gKCkge1xuXHRcdGlmICghanNjLl92bWxSZWFkeSkge1xuXHRcdFx0Ly8gaW5pdCBWTUwgbmFtZXNwYWNlXG5cdFx0XHR2YXIgZG9jID0gZG9jdW1lbnQ7XG5cdFx0XHRpZiAoIWRvYy5uYW1lc3BhY2VzW2pzYy5fdm1sTlNdKSB7XG5cdFx0XHRcdGRvYy5uYW1lc3BhY2VzLmFkZChqc2MuX3ZtbE5TLCAndXJuOnNjaGVtYXMtbWljcm9zb2Z0LWNvbTp2bWwnKTtcblx0XHRcdH1cblx0XHRcdGlmICghZG9jLnN0eWxlU2hlZXRzW2pzYy5fdm1sQ1NTXSkge1xuXHRcdFx0XHR2YXIgdGFncyA9IFsnc2hhcGUnLCAnc2hhcGV0eXBlJywgJ2dyb3VwJywgJ2JhY2tncm91bmQnLCAncGF0aCcsICdmb3JtdWxhcycsICdoYW5kbGVzJywgJ2ZpbGwnLCAnc3Ryb2tlJywgJ3NoYWRvdycsICd0ZXh0Ym94JywgJ3RleHRwYXRoJywgJ2ltYWdlZGF0YScsICdsaW5lJywgJ3BvbHlsaW5lJywgJ2N1cnZlJywgJ3JlY3QnLCAncm91bmRyZWN0JywgJ292YWwnLCAnYXJjJywgJ2ltYWdlJ107XG5cdFx0XHRcdHZhciBzcyA9IGRvYy5jcmVhdGVTdHlsZVNoZWV0KCk7XG5cdFx0XHRcdHNzLm93bmluZ0VsZW1lbnQuaWQgPSBqc2MuX3ZtbENTUztcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0YWdzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRcdFx0c3MuYWRkUnVsZShqc2MuX3ZtbE5TICsgJ1xcXFw6JyArIHRhZ3NbaV0sICdiZWhhdmlvcjp1cmwoI2RlZmF1bHQjVk1MKTsnKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0anNjLl92bWxSZWFkeSA9IHRydWU7XG5cdFx0fVxuXHR9LFxuXG5cblx0Y3JlYXRlUGFsZXR0ZSA6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHZhciBwYWxldHRlT2JqID0ge1xuXHRcdFx0ZWxtOiBudWxsLFxuXHRcdFx0ZHJhdzogbnVsbFxuXHRcdH07XG5cblx0XHRpZiAoanNjLmlzQ2FudmFzU3VwcG9ydGVkKSB7XG5cdFx0XHQvLyBDYW52YXMgaW1wbGVtZW50YXRpb24gZm9yIG1vZGVybiBicm93c2Vyc1xuXG5cdFx0XHR2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdFx0XHR2YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cblx0XHRcdHZhciBkcmF3RnVuYyA9IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0LCB0eXBlKSB7XG5cdFx0XHRcdGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuXHRcdFx0XHRjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG5cdFx0XHRcdGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblxuXHRcdFx0XHR2YXIgaEdyYWQgPSBjdHguY3JlYXRlTGluZWFyR3JhZGllbnQoMCwgMCwgY2FudmFzLndpZHRoLCAwKTtcblx0XHRcdFx0aEdyYWQuYWRkQ29sb3JTdG9wKDAgLyA2LCAnI0YwMCcpO1xuXHRcdFx0XHRoR3JhZC5hZGRDb2xvclN0b3AoMSAvIDYsICcjRkYwJyk7XG5cdFx0XHRcdGhHcmFkLmFkZENvbG9yU3RvcCgyIC8gNiwgJyMwRjAnKTtcblx0XHRcdFx0aEdyYWQuYWRkQ29sb3JTdG9wKDMgLyA2LCAnIzBGRicpO1xuXHRcdFx0XHRoR3JhZC5hZGRDb2xvclN0b3AoNCAvIDYsICcjMDBGJyk7XG5cdFx0XHRcdGhHcmFkLmFkZENvbG9yU3RvcCg1IC8gNiwgJyNGMEYnKTtcblx0XHRcdFx0aEdyYWQuYWRkQ29sb3JTdG9wKDYgLyA2LCAnI0YwMCcpO1xuXG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSBoR3JhZDtcblx0XHRcdFx0Y3R4LmZpbGxSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cblx0XHRcdFx0dmFyIHZHcmFkID0gY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KDAsIDAsIDAsIGNhbnZhcy5oZWlnaHQpO1xuXHRcdFx0XHRzd2l0Y2ggKHR5cGUudG9Mb3dlckNhc2UoKSkge1xuXHRcdFx0XHRjYXNlICdzJzpcblx0XHRcdFx0XHR2R3JhZC5hZGRDb2xvclN0b3AoMCwgJ3JnYmEoMjU1LDI1NSwyNTUsMCknKTtcblx0XHRcdFx0XHR2R3JhZC5hZGRDb2xvclN0b3AoMSwgJ3JnYmEoMjU1LDI1NSwyNTUsMSknKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAndic6XG5cdFx0XHRcdFx0dkdyYWQuYWRkQ29sb3JTdG9wKDAsICdyZ2JhKDAsMCwwLDApJyk7XG5cdFx0XHRcdFx0dkdyYWQuYWRkQ29sb3JTdG9wKDEsICdyZ2JhKDAsMCwwLDEpJyk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9IHZHcmFkO1xuXHRcdFx0XHRjdHguZmlsbFJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblx0XHRcdH07XG5cblx0XHRcdHBhbGV0dGVPYmouZWxtID0gY2FudmFzO1xuXHRcdFx0cGFsZXR0ZU9iai5kcmF3ID0gZHJhd0Z1bmM7XG5cblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gVk1MIGZhbGxiYWNrIGZvciBJRSA3IGFuZCA4XG5cblx0XHRcdGpzYy5pbml0Vk1MKCk7XG5cblx0XHRcdHZhciB2bWxDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0XHRcdHZtbENvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG5cdFx0XHR2bWxDb250YWluZXIuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcblxuXHRcdFx0dmFyIGhHcmFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChqc2MuX3ZtbE5TICsgJzpmaWxsJyk7XG5cdFx0XHRoR3JhZC50eXBlID0gJ2dyYWRpZW50Jztcblx0XHRcdGhHcmFkLm1ldGhvZCA9ICdsaW5lYXInO1xuXHRcdFx0aEdyYWQuYW5nbGUgPSAnOTAnO1xuXHRcdFx0aEdyYWQuY29sb3JzID0gJzE2LjY3JSAjRjBGLCAzMy4zMyUgIzAwRiwgNTAlICMwRkYsIDY2LjY3JSAjMEYwLCA4My4zMyUgI0ZGMCdcblxuXHRcdFx0dmFyIGhSZWN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChqc2MuX3ZtbE5TICsgJzpyZWN0Jyk7XG5cdFx0XHRoUmVjdC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRoUmVjdC5zdHlsZS5sZWZ0ID0gLTEgKyAncHgnO1xuXHRcdFx0aFJlY3Quc3R5bGUudG9wID0gLTEgKyAncHgnO1xuXHRcdFx0aFJlY3Quc3Ryb2tlZCA9IGZhbHNlO1xuXHRcdFx0aFJlY3QuYXBwZW5kQ2hpbGQoaEdyYWQpO1xuXHRcdFx0dm1sQ29udGFpbmVyLmFwcGVuZENoaWxkKGhSZWN0KTtcblxuXHRcdFx0dmFyIHZHcmFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChqc2MuX3ZtbE5TICsgJzpmaWxsJyk7XG5cdFx0XHR2R3JhZC50eXBlID0gJ2dyYWRpZW50Jztcblx0XHRcdHZHcmFkLm1ldGhvZCA9ICdsaW5lYXInO1xuXHRcdFx0dkdyYWQuYW5nbGUgPSAnMTgwJztcblx0XHRcdHZHcmFkLm9wYWNpdHkgPSAnMCc7XG5cblx0XHRcdHZhciB2UmVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoanNjLl92bWxOUyArICc6cmVjdCcpO1xuXHRcdFx0dlJlY3Quc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0dlJlY3Quc3R5bGUubGVmdCA9IC0xICsgJ3B4Jztcblx0XHRcdHZSZWN0LnN0eWxlLnRvcCA9IC0xICsgJ3B4Jztcblx0XHRcdHZSZWN0LnN0cm9rZWQgPSBmYWxzZTtcblx0XHRcdHZSZWN0LmFwcGVuZENoaWxkKHZHcmFkKTtcblx0XHRcdHZtbENvbnRhaW5lci5hcHBlbmRDaGlsZCh2UmVjdCk7XG5cblx0XHRcdHZhciBkcmF3RnVuYyA9IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0LCB0eXBlKSB7XG5cdFx0XHRcdHZtbENvbnRhaW5lci5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4Jztcblx0XHRcdFx0dm1sQ29udGFpbmVyLnN0eWxlLmhlaWdodCA9IGhlaWdodCArICdweCc7XG5cblx0XHRcdFx0aFJlY3Quc3R5bGUud2lkdGggPVxuXHRcdFx0XHR2UmVjdC5zdHlsZS53aWR0aCA9XG5cdFx0XHRcdFx0KHdpZHRoICsgMSkgKyAncHgnO1xuXHRcdFx0XHRoUmVjdC5zdHlsZS5oZWlnaHQgPVxuXHRcdFx0XHR2UmVjdC5zdHlsZS5oZWlnaHQgPVxuXHRcdFx0XHRcdChoZWlnaHQgKyAxKSArICdweCc7XG5cblx0XHRcdFx0Ly8gQ29sb3JzIG11c3QgYmUgc3BlY2lmaWVkIGR1cmluZyBldmVyeSByZWRyYXcsIG90aGVyd2lzZSBJRSB3b24ndCBkaXNwbGF5XG5cdFx0XHRcdC8vIGEgZnVsbCBncmFkaWVudCBkdXJpbmcgYSBzdWJzZXF1ZW50aWFsIHJlZHJhd1xuXHRcdFx0XHRoR3JhZC5jb2xvciA9ICcjRjAwJztcblx0XHRcdFx0aEdyYWQuY29sb3IyID0gJyNGMDAnO1xuXG5cdFx0XHRcdHN3aXRjaCAodHlwZS50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0XHRcdGNhc2UgJ3MnOlxuXHRcdFx0XHRcdHZHcmFkLmNvbG9yID0gdkdyYWQuY29sb3IyID0gJyNGRkYnO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICd2Jzpcblx0XHRcdFx0XHR2R3JhZC5jb2xvciA9IHZHcmFkLmNvbG9yMiA9ICcjMDAwJztcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHRcdFxuXHRcdFx0cGFsZXR0ZU9iai5lbG0gPSB2bWxDb250YWluZXI7XG5cdFx0XHRwYWxldHRlT2JqLmRyYXcgPSBkcmF3RnVuYztcblx0XHR9XG5cblx0XHRyZXR1cm4gcGFsZXR0ZU9iajtcblx0fSxcblxuXG5cdGNyZWF0ZVNsaWRlckdyYWRpZW50IDogZnVuY3Rpb24gKCkge1xuXG5cdFx0dmFyIHNsaWRlck9iaiA9IHtcblx0XHRcdGVsbTogbnVsbCxcblx0XHRcdGRyYXc6IG51bGxcblx0XHR9O1xuXG5cdFx0aWYgKGpzYy5pc0NhbnZhc1N1cHBvcnRlZCkge1xuXHRcdFx0Ly8gQ2FudmFzIGltcGxlbWVudGF0aW9uIGZvciBtb2Rlcm4gYnJvd3NlcnNcblxuXHRcdFx0dmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRcdFx0dmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG5cdFx0XHR2YXIgZHJhd0Z1bmMgPSBmdW5jdGlvbiAod2lkdGgsIGhlaWdodCwgY29sb3IxLCBjb2xvcjIpIHtcblx0XHRcdFx0Y2FudmFzLndpZHRoID0gd2lkdGg7XG5cdFx0XHRcdGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG5cblx0XHRcdFx0Y3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXG5cdFx0XHRcdHZhciBncmFkID0gY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KDAsIDAsIDAsIGNhbnZhcy5oZWlnaHQpO1xuXHRcdFx0XHRncmFkLmFkZENvbG9yU3RvcCgwLCBjb2xvcjEpO1xuXHRcdFx0XHRncmFkLmFkZENvbG9yU3RvcCgxLCBjb2xvcjIpO1xuXG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSBncmFkO1xuXHRcdFx0XHRjdHguZmlsbFJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblx0XHRcdH07XG5cblx0XHRcdHNsaWRlck9iai5lbG0gPSBjYW52YXM7XG5cdFx0XHRzbGlkZXJPYmouZHJhdyA9IGRyYXdGdW5jO1xuXG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIFZNTCBmYWxsYmFjayBmb3IgSUUgNyBhbmQgOFxuXG5cdFx0XHRqc2MuaW5pdFZNTCgpO1xuXG5cdFx0XHR2YXIgdm1sQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0XHR2bWxDb250YWluZXIuc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xuXHRcdFx0dm1sQ29udGFpbmVyLnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG5cblx0XHRcdHZhciBncmFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChqc2MuX3ZtbE5TICsgJzpmaWxsJyk7XG5cdFx0XHRncmFkLnR5cGUgPSAnZ3JhZGllbnQnO1xuXHRcdFx0Z3JhZC5tZXRob2QgPSAnbGluZWFyJztcblx0XHRcdGdyYWQuYW5nbGUgPSAnMTgwJztcblxuXHRcdFx0dmFyIHJlY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGpzYy5fdm1sTlMgKyAnOnJlY3QnKTtcblx0XHRcdHJlY3Quc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cmVjdC5zdHlsZS5sZWZ0ID0gLTEgKyAncHgnO1xuXHRcdFx0cmVjdC5zdHlsZS50b3AgPSAtMSArICdweCc7XG5cdFx0XHRyZWN0LnN0cm9rZWQgPSBmYWxzZTtcblx0XHRcdHJlY3QuYXBwZW5kQ2hpbGQoZ3JhZCk7XG5cdFx0XHR2bWxDb250YWluZXIuYXBwZW5kQ2hpbGQocmVjdCk7XG5cblx0XHRcdHZhciBkcmF3RnVuYyA9IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0LCBjb2xvcjEsIGNvbG9yMikge1xuXHRcdFx0XHR2bWxDb250YWluZXIuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG5cdFx0XHRcdHZtbENvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xuXG5cdFx0XHRcdHJlY3Quc3R5bGUud2lkdGggPSAod2lkdGggKyAxKSArICdweCc7XG5cdFx0XHRcdHJlY3Quc3R5bGUuaGVpZ2h0ID0gKGhlaWdodCArIDEpICsgJ3B4JztcblxuXHRcdFx0XHRncmFkLmNvbG9yID0gY29sb3IxO1xuXHRcdFx0XHRncmFkLmNvbG9yMiA9IGNvbG9yMjtcblx0XHRcdH07XG5cdFx0XHRcblx0XHRcdHNsaWRlck9iai5lbG0gPSB2bWxDb250YWluZXI7XG5cdFx0XHRzbGlkZXJPYmouZHJhdyA9IGRyYXdGdW5jO1xuXHRcdH1cblxuXHRcdHJldHVybiBzbGlkZXJPYmo7XG5cdH0sXG5cblxuXHRsZWF2ZVZhbHVlIDogMTw8MCxcblx0bGVhdmVTdHlsZSA6IDE8PDEsXG5cdGxlYXZlUGFkIDogMTw8Mixcblx0bGVhdmVTbGQgOiAxPDwzLFxuXG5cblx0Qm94U2hhZG93IDogKGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgQm94U2hhZG93ID0gZnVuY3Rpb24gKGhTaGFkb3csIHZTaGFkb3csIGJsdXIsIHNwcmVhZCwgY29sb3IsIGluc2V0KSB7XG5cdFx0XHR0aGlzLmhTaGFkb3cgPSBoU2hhZG93O1xuXHRcdFx0dGhpcy52U2hhZG93ID0gdlNoYWRvdztcblx0XHRcdHRoaXMuYmx1ciA9IGJsdXI7XG5cdFx0XHR0aGlzLnNwcmVhZCA9IHNwcmVhZDtcblx0XHRcdHRoaXMuY29sb3IgPSBjb2xvcjtcblx0XHRcdHRoaXMuaW5zZXQgPSAhIWluc2V0O1xuXHRcdH07XG5cblx0XHRCb3hTaGFkb3cucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHZhbHMgPSBbXG5cdFx0XHRcdE1hdGgucm91bmQodGhpcy5oU2hhZG93KSArICdweCcsXG5cdFx0XHRcdE1hdGgucm91bmQodGhpcy52U2hhZG93KSArICdweCcsXG5cdFx0XHRcdE1hdGgucm91bmQodGhpcy5ibHVyKSArICdweCcsXG5cdFx0XHRcdE1hdGgucm91bmQodGhpcy5zcHJlYWQpICsgJ3B4Jyxcblx0XHRcdFx0dGhpcy5jb2xvclxuXHRcdFx0XTtcblx0XHRcdGlmICh0aGlzLmluc2V0KSB7XG5cdFx0XHRcdHZhbHMucHVzaCgnaW5zZXQnKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiB2YWxzLmpvaW4oJyAnKTtcblx0XHR9O1xuXG5cdFx0cmV0dXJuIEJveFNoYWRvdztcblx0fSkoKSxcblxuXG5cdC8vXG5cdC8vIFVzYWdlOlxuXHQvLyB2YXIgbXlDb2xvciA9IG5ldyBqc2NvbG9yKDx0YXJnZXRFbGVtZW50PiBbLCA8b3B0aW9ucz5dKVxuXHQvL1xuXG5cdGpzY29sb3IgOiBmdW5jdGlvbiAodGFyZ2V0RWxlbWVudCwgb3B0aW9ucykge1xuXG5cdFx0Ly8gR2VuZXJhbCBvcHRpb25zXG5cdFx0Ly9cblx0XHR0aGlzLnZhbHVlID0gbnVsbDsgLy8gaW5pdGlhbCBIRVggY29sb3IuIFRvIGNoYW5nZSBpdCBsYXRlciwgdXNlIG1ldGhvZHMgZnJvbVN0cmluZygpLCBmcm9tSFNWKCkgYW5kIGZyb21SR0IoKVxuXHRcdHRoaXMudmFsdWVFbGVtZW50ID0gdGFyZ2V0RWxlbWVudDsgLy8gZWxlbWVudCB0aGF0IHdpbGwgYmUgdXNlZCB0byBkaXNwbGF5IGFuZCBpbnB1dCB0aGUgY29sb3IgY29kZVxuXHRcdHRoaXMuc3R5bGVFbGVtZW50ID0gdGFyZ2V0RWxlbWVudDsgLy8gZWxlbWVudCB0aGF0IHdpbGwgcHJldmlldyB0aGUgcGlja2VkIGNvbG9yIHVzaW5nIENTUyBiYWNrZ3JvdW5kQ29sb3Jcblx0XHR0aGlzLnJlcXVpcmVkID0gdHJ1ZTsgLy8gd2hldGhlciB0aGUgYXNzb2NpYXRlZCB0ZXh0IDxpbnB1dD4gY2FuIGJlIGxlZnQgZW1wdHlcblx0XHR0aGlzLnJlZmluZSA9IHRydWU7IC8vIHdoZXRoZXIgdG8gcmVmaW5lIHRoZSBlbnRlcmVkIGNvbG9yIGNvZGUgKGUuZy4gdXBwZXJjYXNlIGl0IGFuZCByZW1vdmUgd2hpdGVzcGFjZSlcblx0XHR0aGlzLmhhc2ggPSBmYWxzZTsgLy8gd2hldGhlciB0byBwcmVmaXggdGhlIEhFWCBjb2xvciBjb2RlIHdpdGggIyBzeW1ib2xcblx0XHR0aGlzLnVwcGVyY2FzZSA9IHRydWU7IC8vIHdoZXRoZXIgdG8gdXBwZXJjYXNlIHRoZSBjb2xvciBjb2RlXG5cdFx0dGhpcy5vbkZpbmVDaGFuZ2UgPSBudWxsOyAvLyBjYWxsZWQgaW5zdGFudGx5IGV2ZXJ5IHRpbWUgdGhlIGNvbG9yIGNoYW5nZXMgKHZhbHVlIGNhbiBiZSBlaXRoZXIgYSBmdW5jdGlvbiBvciBhIHN0cmluZyB3aXRoIGphdmFzY3JpcHQgY29kZSlcblx0XHR0aGlzLmFjdGl2ZUNsYXNzID0gJ2pzY29sb3ItYWN0aXZlJzsgLy8gY2xhc3MgdG8gYmUgc2V0IHRvIHRoZSB0YXJnZXQgZWxlbWVudCB3aGVuIGEgcGlja2VyIHdpbmRvdyBpcyBvcGVuIG9uIGl0XG5cdFx0dGhpcy5taW5TID0gMDsgLy8gbWluIGFsbG93ZWQgc2F0dXJhdGlvbiAoMCAtIDEwMClcblx0XHR0aGlzLm1heFMgPSAxMDA7IC8vIG1heCBhbGxvd2VkIHNhdHVyYXRpb24gKDAgLSAxMDApXG5cdFx0dGhpcy5taW5WID0gMDsgLy8gbWluIGFsbG93ZWQgdmFsdWUgKGJyaWdodG5lc3MpICgwIC0gMTAwKVxuXHRcdHRoaXMubWF4ViA9IDEwMDsgLy8gbWF4IGFsbG93ZWQgdmFsdWUgKGJyaWdodG5lc3MpICgwIC0gMTAwKVxuXG5cdFx0Ly8gQWNjZXNzaW5nIHRoZSBwaWNrZWQgY29sb3Jcblx0XHQvL1xuXHRcdHRoaXMuaHN2ID0gWzAsIDAsIDEwMF07IC8vIHJlYWQtb25seSAgWzAtMzYwLCAwLTEwMCwgMC0xMDBdXG5cdFx0dGhpcy5yZ2IgPSBbMjU1LCAyNTUsIDI1NV07IC8vIHJlYWQtb25seSAgWzAtMjU1LCAwLTI1NSwgMC0yNTVdXG5cblx0XHQvLyBDb2xvciBQaWNrZXIgb3B0aW9uc1xuXHRcdC8vXG5cdFx0dGhpcy53aWR0aCA9IDE4MTsgLy8gd2lkdGggb2YgY29sb3IgcGFsZXR0ZSAoaW4gcHgpXG5cdFx0dGhpcy5oZWlnaHQgPSAxMDE7IC8vIGhlaWdodCBvZiBjb2xvciBwYWxldHRlIChpbiBweClcblx0XHR0aGlzLnNob3dPbkNsaWNrID0gdHJ1ZTsgLy8gd2hldGhlciB0byBkaXNwbGF5IHRoZSBjb2xvciBwaWNrZXIgd2hlbiB1c2VyIGNsaWNrcyBvbiBpdHMgdGFyZ2V0IGVsZW1lbnRcblx0XHR0aGlzLm1vZGUgPSAnSFNWJzsgLy8gSFNWIHwgSFZTIHwgSFMgfCBIViAtIGxheW91dCBvZiB0aGUgY29sb3IgcGlja2VyIGNvbnRyb2xzXG5cdFx0dGhpcy5wb3NpdGlvbiA9ICdib3R0b20nOyAvLyBsZWZ0IHwgcmlnaHQgfCB0b3AgfCBib3R0b20gLSBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgdGFyZ2V0IGVsZW1lbnRcblx0XHR0aGlzLnNtYXJ0UG9zaXRpb24gPSB0cnVlOyAvLyBhdXRvbWF0aWNhbGx5IGNoYW5nZSBwaWNrZXIgcG9zaXRpb24gd2hlbiB0aGVyZSBpcyBub3QgZW5vdWdoIHNwYWNlIGZvciBpdFxuXHRcdHRoaXMuc2xpZGVyU2l6ZSA9IDE2OyAvLyBweFxuXHRcdHRoaXMuY3Jvc3NTaXplID0gODsgLy8gcHhcblx0XHR0aGlzLmNsb3NhYmxlID0gZmFsc2U7IC8vIHdoZXRoZXIgdG8gZGlzcGxheSB0aGUgQ2xvc2UgYnV0dG9uXG5cdFx0dGhpcy5jbG9zZVRleHQgPSAnQ2xvc2UnO1xuXHRcdHRoaXMuYnV0dG9uQ29sb3IgPSAnIzAwMDAwMCc7IC8vIENTUyBjb2xvclxuXHRcdHRoaXMuYnV0dG9uSGVpZ2h0ID0gMTg7IC8vIHB4XG5cdFx0dGhpcy5wYWRkaW5nID0gMTI7IC8vIHB4XG5cdFx0dGhpcy5iYWNrZ3JvdW5kQ29sb3IgPSAnI0ZGRkZGRic7IC8vIENTUyBjb2xvclxuXHRcdHRoaXMuYm9yZGVyV2lkdGggPSAxOyAvLyBweFxuXHRcdHRoaXMuYm9yZGVyQ29sb3IgPSAnI0JCQkJCQic7IC8vIENTUyBjb2xvclxuXHRcdHRoaXMuYm9yZGVyUmFkaXVzID0gODsgLy8gcHhcblx0XHR0aGlzLmluc2V0V2lkdGggPSAxOyAvLyBweFxuXHRcdHRoaXMuaW5zZXRDb2xvciA9ICcjQkJCQkJCJzsgLy8gQ1NTIGNvbG9yXG5cdFx0dGhpcy5zaGFkb3cgPSB0cnVlOyAvLyB3aGV0aGVyIHRvIGRpc3BsYXkgc2hhZG93XG5cdFx0dGhpcy5zaGFkb3dCbHVyID0gMTU7IC8vIHB4XG5cdFx0dGhpcy5zaGFkb3dDb2xvciA9ICdyZ2JhKDAsMCwwLDAuMiknOyAvLyBDU1MgY29sb3Jcblx0XHR0aGlzLnBvaW50ZXJDb2xvciA9ICcjNEM0QzRDJzsgLy8gcHhcblx0XHR0aGlzLnBvaW50ZXJCb3JkZXJDb2xvciA9ICcjRkZGRkZGJzsgLy8gcHhcbiAgICAgICAgdGhpcy5wb2ludGVyQm9yZGVyV2lkdGggPSAxOyAvLyBweFxuICAgICAgICB0aGlzLnBvaW50ZXJUaGlja25lc3MgPSAyOyAvLyBweFxuXHRcdHRoaXMuekluZGV4ID0gMTAwMDtcblx0XHR0aGlzLmNvbnRhaW5lciA9IG51bGw7IC8vIHdoZXJlIHRvIGFwcGVuZCB0aGUgY29sb3IgcGlja2VyIChCT0RZIGVsZW1lbnQgYnkgZGVmYXVsdClcblxuXG5cdFx0Zm9yICh2YXIgb3B0IGluIG9wdGlvbnMpIHtcblx0XHRcdGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KG9wdCkpIHtcblx0XHRcdFx0dGhpc1tvcHRdID0gb3B0aW9uc1tvcHRdO1xuXHRcdFx0fVxuXHRcdH1cblxuXG5cdFx0dGhpcy5oaWRlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKGlzUGlja2VyT3duZXIoKSkge1xuXHRcdFx0XHRkZXRhY2hQaWNrZXIoKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cblx0XHR0aGlzLnNob3cgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRkcmF3UGlja2VyKCk7XG5cdFx0fTtcblxuXG5cdFx0dGhpcy5yZWRyYXcgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZiAoaXNQaWNrZXJPd25lcigpKSB7XG5cdFx0XHRcdGRyYXdQaWNrZXIoKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cblx0XHR0aGlzLmltcG9ydENvbG9yID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKCF0aGlzLnZhbHVlRWxlbWVudCkge1xuXHRcdFx0XHR0aGlzLmV4cG9ydENvbG9yKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoanNjLmlzRWxlbWVudFR5cGUodGhpcy52YWx1ZUVsZW1lbnQsICdpbnB1dCcpKSB7XG5cdFx0XHRcdFx0aWYgKCF0aGlzLnJlZmluZSkge1xuXHRcdFx0XHRcdFx0aWYgKCF0aGlzLmZyb21TdHJpbmcodGhpcy52YWx1ZUVsZW1lbnQudmFsdWUsIGpzYy5sZWF2ZVZhbHVlKSkge1xuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5zdHlsZUVsZW1lbnQpIHtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLnN0eWxlRWxlbWVudC5fanNjT3JpZ1N0eWxlLmJhY2tncm91bmRJbWFnZTtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLnN0eWxlRWxlbWVudC5fanNjT3JpZ1N0eWxlLmJhY2tncm91bmRDb2xvcjtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5jb2xvciA9IHRoaXMuc3R5bGVFbGVtZW50Ll9qc2NPcmlnU3R5bGUuY29sb3I7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0dGhpcy5leHBvcnRDb2xvcihqc2MubGVhdmVWYWx1ZSB8IGpzYy5sZWF2ZVN0eWxlKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGVsc2UgaWYgKCF0aGlzLnJlcXVpcmVkICYmIC9eXFxzKiQvLnRlc3QodGhpcy52YWx1ZUVsZW1lbnQudmFsdWUpKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnZhbHVlRWxlbWVudC52YWx1ZSA9ICcnO1xuXHRcdFx0XHRcdFx0aWYgKHRoaXMuc3R5bGVFbGVtZW50KSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IHRoaXMuc3R5bGVFbGVtZW50Ll9qc2NPcmlnU3R5bGUuYmFja2dyb3VuZEltYWdlO1xuXHRcdFx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLnN0eWxlRWxlbWVudC5fanNjT3JpZ1N0eWxlLmJhY2tncm91bmRDb2xvcjtcblx0XHRcdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuY29sb3IgPSB0aGlzLnN0eWxlRWxlbWVudC5fanNjT3JpZ1N0eWxlLmNvbG9yO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0dGhpcy5leHBvcnRDb2xvcihqc2MubGVhdmVWYWx1ZSB8IGpzYy5sZWF2ZVN0eWxlKTtcblxuXHRcdFx0XHRcdH0gZWxzZSBpZiAodGhpcy5mcm9tU3RyaW5nKHRoaXMudmFsdWVFbGVtZW50LnZhbHVlKSkge1xuXHRcdFx0XHRcdFx0Ly8gbWFuYWdlZCB0byBpbXBvcnQgY29sb3Igc3VjY2Vzc2Z1bGx5IGZyb20gdGhlIHZhbHVlIC0+IE9LLCBkb24ndCBkbyBhbnl0aGluZ1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR0aGlzLmV4cG9ydENvbG9yKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIG5vdCBhbiBpbnB1dCBlbGVtZW50IC0+IGRvZXNuJ3QgaGF2ZSBhbnkgdmFsdWVcblx0XHRcdFx0XHR0aGlzLmV4cG9ydENvbG9yKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cblx0XHR0aGlzLmV4cG9ydENvbG9yID0gZnVuY3Rpb24gKGZsYWdzKSB7XG5cdFx0XHRpZiAoIShmbGFncyAmIGpzYy5sZWF2ZVZhbHVlKSAmJiB0aGlzLnZhbHVlRWxlbWVudCkge1xuXHRcdFx0XHR2YXIgdmFsdWUgPSB0aGlzLnRvU3RyaW5nKCk7XG5cdFx0XHRcdGlmICh0aGlzLnVwcGVyY2FzZSkgeyB2YWx1ZSA9IHZhbHVlLnRvVXBwZXJDYXNlKCk7IH1cblx0XHRcdFx0aWYgKHRoaXMuaGFzaCkgeyB2YWx1ZSA9ICcjJyArIHZhbHVlOyB9XG5cblx0XHRcdFx0aWYgKGpzYy5pc0VsZW1lbnRUeXBlKHRoaXMudmFsdWVFbGVtZW50LCAnaW5wdXQnKSkge1xuXHRcdFx0XHRcdHRoaXMudmFsdWVFbGVtZW50LnZhbHVlID0gdmFsdWU7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy52YWx1ZUVsZW1lbnQuaW5uZXJIVE1MID0gdmFsdWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmICghKGZsYWdzICYganNjLmxlYXZlU3R5bGUpKSB7XG5cdFx0XHRcdGlmICh0aGlzLnN0eWxlRWxlbWVudCkge1xuXHRcdFx0XHRcdHRoaXMuc3R5bGVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRJbWFnZSA9ICdub25lJztcblx0XHRcdFx0XHR0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnIycgKyB0aGlzLnRvU3RyaW5nKCk7XG5cdFx0XHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuY29sb3IgPSB0aGlzLmlzTGlnaHQoKSA/ICcjMDAwJyA6ICcjRkZGJztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKCEoZmxhZ3MgJiBqc2MubGVhdmVQYWQpICYmIGlzUGlja2VyT3duZXIoKSkge1xuXHRcdFx0XHRyZWRyYXdQYWQoKTtcblx0XHRcdH1cblx0XHRcdGlmICghKGZsYWdzICYganNjLmxlYXZlU2xkKSAmJiBpc1BpY2tlck93bmVyKCkpIHtcblx0XHRcdFx0cmVkcmF3U2xkKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXG5cdFx0Ly8gaDogMC0zNjBcblx0XHQvLyBzOiAwLTEwMFxuXHRcdC8vIHY6IDAtMTAwXG5cdFx0Ly9cblx0XHR0aGlzLmZyb21IU1YgPSBmdW5jdGlvbiAoaCwgcywgdiwgZmxhZ3MpIHsgLy8gbnVsbCA9IGRvbid0IGNoYW5nZVxuXHRcdFx0aWYgKGggIT09IG51bGwpIHtcblx0XHRcdFx0aWYgKGlzTmFOKGgpKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0XHRoID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMzYwLCBoKSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAocyAhPT0gbnVsbCkge1xuXHRcdFx0XHRpZiAoaXNOYU4ocykpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRcdHMgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxMDAsIHRoaXMubWF4UywgcyksIHRoaXMubWluUyk7XG5cdFx0XHR9XG5cdFx0XHRpZiAodiAhPT0gbnVsbCkge1xuXHRcdFx0XHRpZiAoaXNOYU4odikpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRcdHYgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxMDAsIHRoaXMubWF4ViwgdiksIHRoaXMubWluVik7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMucmdiID0gSFNWX1JHQihcblx0XHRcdFx0aD09PW51bGwgPyB0aGlzLmhzdlswXSA6ICh0aGlzLmhzdlswXT1oKSxcblx0XHRcdFx0cz09PW51bGwgPyB0aGlzLmhzdlsxXSA6ICh0aGlzLmhzdlsxXT1zKSxcblx0XHRcdFx0dj09PW51bGwgPyB0aGlzLmhzdlsyXSA6ICh0aGlzLmhzdlsyXT12KVxuXHRcdFx0KTtcblxuXHRcdFx0dGhpcy5leHBvcnRDb2xvcihmbGFncyk7XG5cdFx0fTtcblxuXG5cdFx0Ly8gcjogMC0yNTVcblx0XHQvLyBnOiAwLTI1NVxuXHRcdC8vIGI6IDAtMjU1XG5cdFx0Ly9cblx0XHR0aGlzLmZyb21SR0IgPSBmdW5jdGlvbiAociwgZywgYiwgZmxhZ3MpIHsgLy8gbnVsbCA9IGRvbid0IGNoYW5nZVxuXHRcdFx0aWYgKHIgIT09IG51bGwpIHtcblx0XHRcdFx0aWYgKGlzTmFOKHIpKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdFx0XHRyID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMjU1LCByKSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoZyAhPT0gbnVsbCkge1xuXHRcdFx0XHRpZiAoaXNOYU4oZykpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0XHRcdGcgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigyNTUsIGcpKTtcblx0XHRcdH1cblx0XHRcdGlmIChiICE9PSBudWxsKSB7XG5cdFx0XHRcdGlmIChpc05hTihiKSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRcdFx0YiA9IE1hdGgubWF4KDAsIE1hdGgubWluKDI1NSwgYikpO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgaHN2ID0gUkdCX0hTVihcblx0XHRcdFx0cj09PW51bGwgPyB0aGlzLnJnYlswXSA6IHIsXG5cdFx0XHRcdGc9PT1udWxsID8gdGhpcy5yZ2JbMV0gOiBnLFxuXHRcdFx0XHRiPT09bnVsbCA/IHRoaXMucmdiWzJdIDogYlxuXHRcdFx0KTtcblx0XHRcdGlmIChoc3ZbMF0gIT09IG51bGwpIHtcblx0XHRcdFx0dGhpcy5oc3ZbMF0gPSBNYXRoLm1heCgwLCBNYXRoLm1pbigzNjAsIGhzdlswXSkpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGhzdlsyXSAhPT0gMCkge1xuXHRcdFx0XHR0aGlzLmhzdlsxXSA9IGhzdlsxXT09PW51bGwgPyBudWxsIDogTWF0aC5tYXgoMCwgdGhpcy5taW5TLCBNYXRoLm1pbigxMDAsIHRoaXMubWF4UywgaHN2WzFdKSk7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLmhzdlsyXSA9IGhzdlsyXT09PW51bGwgPyBudWxsIDogTWF0aC5tYXgoMCwgdGhpcy5taW5WLCBNYXRoLm1pbigxMDAsIHRoaXMubWF4ViwgaHN2WzJdKSk7XG5cblx0XHRcdC8vIHVwZGF0ZSBSR0IgYWNjb3JkaW5nIHRvIGZpbmFsIEhTViwgYXMgc29tZSB2YWx1ZXMgbWlnaHQgYmUgdHJpbW1lZFxuXHRcdFx0dmFyIHJnYiA9IEhTVl9SR0IodGhpcy5oc3ZbMF0sIHRoaXMuaHN2WzFdLCB0aGlzLmhzdlsyXSk7XG5cdFx0XHR0aGlzLnJnYlswXSA9IHJnYlswXTtcblx0XHRcdHRoaXMucmdiWzFdID0gcmdiWzFdO1xuXHRcdFx0dGhpcy5yZ2JbMl0gPSByZ2JbMl07XG5cblx0XHRcdHRoaXMuZXhwb3J0Q29sb3IoZmxhZ3MpO1xuXHRcdH07XG5cblxuXHRcdHRoaXMuZnJvbVN0cmluZyA9IGZ1bmN0aW9uIChzdHIsIGZsYWdzKSB7XG5cdFx0XHR2YXIgbTtcblx0XHRcdGlmIChtID0gc3RyLm1hdGNoKC9eXFxXKihbMC05QS1GXXszfShbMC05QS1GXXszfSk/KVxcVyokL2kpKSB7XG5cdFx0XHRcdC8vIEhFWCBub3RhdGlvblxuXHRcdFx0XHQvL1xuXG5cdFx0XHRcdGlmIChtWzFdLmxlbmd0aCA9PT0gNikge1xuXHRcdFx0XHRcdC8vIDYtY2hhciBub3RhdGlvblxuXHRcdFx0XHRcdHRoaXMuZnJvbVJHQihcblx0XHRcdFx0XHRcdHBhcnNlSW50KG1bMV0uc3Vic3RyKDAsMiksMTYpLFxuXHRcdFx0XHRcdFx0cGFyc2VJbnQobVsxXS5zdWJzdHIoMiwyKSwxNiksXG5cdFx0XHRcdFx0XHRwYXJzZUludChtWzFdLnN1YnN0cig0LDIpLDE2KSxcblx0XHRcdFx0XHRcdGZsYWdzXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyAzLWNoYXIgbm90YXRpb25cblx0XHRcdFx0XHR0aGlzLmZyb21SR0IoXG5cdFx0XHRcdFx0XHRwYXJzZUludChtWzFdLmNoYXJBdCgwKSArIG1bMV0uY2hhckF0KDApLDE2KSxcblx0XHRcdFx0XHRcdHBhcnNlSW50KG1bMV0uY2hhckF0KDEpICsgbVsxXS5jaGFyQXQoMSksMTYpLFxuXHRcdFx0XHRcdFx0cGFyc2VJbnQobVsxXS5jaGFyQXQoMikgKyBtWzFdLmNoYXJBdCgyKSwxNiksXG5cdFx0XHRcdFx0XHRmbGFnc1xuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cblx0XHRcdH0gZWxzZSBpZiAobSA9IHN0ci5tYXRjaCgvXlxcVypyZ2JhP1xcKChbXildKilcXClcXFcqJC9pKSkge1xuXHRcdFx0XHR2YXIgcGFyYW1zID0gbVsxXS5zcGxpdCgnLCcpO1xuXHRcdFx0XHR2YXIgcmUgPSAvXlxccyooXFxkKikoXFwuXFxkKyk/XFxzKiQvO1xuXHRcdFx0XHR2YXIgbVIsIG1HLCBtQjtcblx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdHBhcmFtcy5sZW5ndGggPj0gMyAmJlxuXHRcdFx0XHRcdChtUiA9IHBhcmFtc1swXS5tYXRjaChyZSkpICYmXG5cdFx0XHRcdFx0KG1HID0gcGFyYW1zWzFdLm1hdGNoKHJlKSkgJiZcblx0XHRcdFx0XHQobUIgPSBwYXJhbXNbMl0ubWF0Y2gocmUpKVxuXHRcdFx0XHQpIHtcblx0XHRcdFx0XHR2YXIgciA9IHBhcnNlRmxvYXQoKG1SWzFdIHx8ICcwJykgKyAobVJbMl0gfHwgJycpKTtcblx0XHRcdFx0XHR2YXIgZyA9IHBhcnNlRmxvYXQoKG1HWzFdIHx8ICcwJykgKyAobUdbMl0gfHwgJycpKTtcblx0XHRcdFx0XHR2YXIgYiA9IHBhcnNlRmxvYXQoKG1CWzFdIHx8ICcwJykgKyAobUJbMl0gfHwgJycpKTtcblx0XHRcdFx0XHR0aGlzLmZyb21SR0IociwgZywgYiwgZmxhZ3MpO1xuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fTtcblxuXG5cdFx0dGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiAoXG5cdFx0XHRcdCgweDEwMCB8IE1hdGgucm91bmQodGhpcy5yZ2JbMF0pKS50b1N0cmluZygxNikuc3Vic3RyKDEpICtcblx0XHRcdFx0KDB4MTAwIHwgTWF0aC5yb3VuZCh0aGlzLnJnYlsxXSkpLnRvU3RyaW5nKDE2KS5zdWJzdHIoMSkgK1xuXHRcdFx0XHQoMHgxMDAgfCBNYXRoLnJvdW5kKHRoaXMucmdiWzJdKSkudG9TdHJpbmcoMTYpLnN1YnN0cigxKVxuXHRcdFx0KTtcblx0XHR9O1xuXG5cblx0XHR0aGlzLnRvSEVYU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuICcjJyArIHRoaXMudG9TdHJpbmcoKS50b1VwcGVyQ2FzZSgpO1xuXHRcdH07XG5cblxuXHRcdHRoaXMudG9SR0JTdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gKCdyZ2IoJyArXG5cdFx0XHRcdE1hdGgucm91bmQodGhpcy5yZ2JbMF0pICsgJywnICtcblx0XHRcdFx0TWF0aC5yb3VuZCh0aGlzLnJnYlsxXSkgKyAnLCcgK1xuXHRcdFx0XHRNYXRoLnJvdW5kKHRoaXMucmdiWzJdKSArICcpJ1xuXHRcdFx0KTtcblx0XHR9O1xuXG5cblx0XHR0aGlzLmlzTGlnaHQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHQwLjIxMyAqIHRoaXMucmdiWzBdICtcblx0XHRcdFx0MC43MTUgKiB0aGlzLnJnYlsxXSArXG5cdFx0XHRcdDAuMDcyICogdGhpcy5yZ2JbMl0gPlxuXHRcdFx0XHQyNTUgLyAyXG5cdFx0XHQpO1xuXHRcdH07XG5cblxuXHRcdHRoaXMuX3Byb2Nlc3NQYXJlbnRFbGVtZW50c0luRE9NID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKHRoaXMuX2xpbmtlZEVsZW1lbnRzUHJvY2Vzc2VkKSB7IHJldHVybjsgfVxuXHRcdFx0dGhpcy5fbGlua2VkRWxlbWVudHNQcm9jZXNzZWQgPSB0cnVlO1xuXG5cdFx0XHR2YXIgZWxtID0gdGhpcy50YXJnZXRFbGVtZW50O1xuXHRcdFx0ZG8ge1xuXHRcdFx0XHQvLyBJZiB0aGUgdGFyZ2V0IGVsZW1lbnQgb3Igb25lIG9mIGl0cyBwYXJlbnQgbm9kZXMgaGFzIGZpeGVkIHBvc2l0aW9uLFxuXHRcdFx0XHQvLyB0aGVuIHVzZSBmaXhlZCBwb3NpdGlvbmluZyBpbnN0ZWFkXG5cdFx0XHRcdC8vXG5cdFx0XHRcdC8vIE5vdGU6IEluIEZpcmVmb3gsIGdldENvbXB1dGVkU3R5bGUgcmV0dXJucyBudWxsIGluIGEgaGlkZGVuIGlmcmFtZSxcblx0XHRcdFx0Ly8gdGhhdCdzIHdoeSB3ZSBuZWVkIHRvIGNoZWNrIGlmIHRoZSByZXR1cm5lZCBzdHlsZSBvYmplY3QgaXMgbm9uLWVtcHR5XG5cdFx0XHRcdHZhciBjdXJyU3R5bGUgPSBqc2MuZ2V0U3R5bGUoZWxtKTtcblx0XHRcdFx0aWYgKGN1cnJTdHlsZSAmJiBjdXJyU3R5bGUucG9zaXRpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2ZpeGVkJykge1xuXHRcdFx0XHRcdHRoaXMuZml4ZWQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGVsbSAhPT0gdGhpcy50YXJnZXRFbGVtZW50KSB7XG5cdFx0XHRcdFx0Ly8gRW5zdXJlIHRvIGF0dGFjaCBvblBhcmVudFNjcm9sbCBvbmx5IG9uY2UgdG8gZWFjaCBwYXJlbnQgZWxlbWVudFxuXHRcdFx0XHRcdC8vIChtdWx0aXBsZSB0YXJnZXRFbGVtZW50cyBjYW4gc2hhcmUgdGhlIHNhbWUgcGFyZW50IG5vZGVzKVxuXHRcdFx0XHRcdC8vXG5cdFx0XHRcdFx0Ly8gTm90ZTogSXQncyBub3QganVzdCBvZmZzZXRQYXJlbnRzIHRoYXQgY2FuIGJlIHNjcm9sbGFibGUsXG5cdFx0XHRcdFx0Ly8gdGhhdCdzIHdoeSB3ZSBsb29wIHRocm91Z2ggYWxsIHBhcmVudCBub2Rlc1xuXHRcdFx0XHRcdGlmICghZWxtLl9qc2NFdmVudHNBdHRhY2hlZCkge1xuXHRcdFx0XHRcdFx0anNjLmF0dGFjaEV2ZW50KGVsbSwgJ3Njcm9sbCcsIGpzYy5vblBhcmVudFNjcm9sbCk7XG5cdFx0XHRcdFx0XHRlbG0uX2pzY0V2ZW50c0F0dGFjaGVkID0gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gd2hpbGUgKChlbG0gPSBlbG0ucGFyZW50Tm9kZSkgJiYgIWpzYy5pc0VsZW1lbnRUeXBlKGVsbSwgJ2JvZHknKSk7XG5cdFx0fTtcblxuXG5cdFx0Ly8gcjogMC0yNTVcblx0XHQvLyBnOiAwLTI1NVxuXHRcdC8vIGI6IDAtMjU1XG5cdFx0Ly9cblx0XHQvLyByZXR1cm5zOiBbIDAtMzYwLCAwLTEwMCwgMC0xMDAgXVxuXHRcdC8vXG5cdFx0ZnVuY3Rpb24gUkdCX0hTViAociwgZywgYikge1xuXHRcdFx0ciAvPSAyNTU7XG5cdFx0XHRnIC89IDI1NTtcblx0XHRcdGIgLz0gMjU1O1xuXHRcdFx0dmFyIG4gPSBNYXRoLm1pbihNYXRoLm1pbihyLGcpLGIpO1xuXHRcdFx0dmFyIHYgPSBNYXRoLm1heChNYXRoLm1heChyLGcpLGIpO1xuXHRcdFx0dmFyIG0gPSB2IC0gbjtcblx0XHRcdGlmIChtID09PSAwKSB7IHJldHVybiBbIG51bGwsIDAsIDEwMCAqIHYgXTsgfVxuXHRcdFx0dmFyIGggPSByPT09biA/IDMrKGItZykvbSA6IChnPT09biA/IDUrKHItYikvbSA6IDErKGctcikvbSk7XG5cdFx0XHRyZXR1cm4gW1xuXHRcdFx0XHQ2MCAqIChoPT09Nj8wOmgpLFxuXHRcdFx0XHQxMDAgKiAobS92KSxcblx0XHRcdFx0MTAwICogdlxuXHRcdFx0XTtcblx0XHR9XG5cblxuXHRcdC8vIGg6IDAtMzYwXG5cdFx0Ly8gczogMC0xMDBcblx0XHQvLyB2OiAwLTEwMFxuXHRcdC8vXG5cdFx0Ly8gcmV0dXJuczogWyAwLTI1NSwgMC0yNTUsIDAtMjU1IF1cblx0XHQvL1xuXHRcdGZ1bmN0aW9uIEhTVl9SR0IgKGgsIHMsIHYpIHtcblx0XHRcdHZhciB1ID0gMjU1ICogKHYgLyAxMDApO1xuXG5cdFx0XHRpZiAoaCA9PT0gbnVsbCkge1xuXHRcdFx0XHRyZXR1cm4gWyB1LCB1LCB1IF07XG5cdFx0XHR9XG5cblx0XHRcdGggLz0gNjA7XG5cdFx0XHRzIC89IDEwMDtcblxuXHRcdFx0dmFyIGkgPSBNYXRoLmZsb29yKGgpO1xuXHRcdFx0dmFyIGYgPSBpJTIgPyBoLWkgOiAxLShoLWkpO1xuXHRcdFx0dmFyIG0gPSB1ICogKDEgLSBzKTtcblx0XHRcdHZhciBuID0gdSAqICgxIC0gcyAqIGYpO1xuXHRcdFx0c3dpdGNoIChpKSB7XG5cdFx0XHRcdGNhc2UgNjpcblx0XHRcdFx0Y2FzZSAwOiByZXR1cm4gW3UsbixtXTtcblx0XHRcdFx0Y2FzZSAxOiByZXR1cm4gW24sdSxtXTtcblx0XHRcdFx0Y2FzZSAyOiByZXR1cm4gW20sdSxuXTtcblx0XHRcdFx0Y2FzZSAzOiByZXR1cm4gW20sbix1XTtcblx0XHRcdFx0Y2FzZSA0OiByZXR1cm4gW24sbSx1XTtcblx0XHRcdFx0Y2FzZSA1OiByZXR1cm4gW3UsbSxuXTtcblx0XHRcdH1cblx0XHR9XG5cblxuXHRcdGZ1bmN0aW9uIGRldGFjaFBpY2tlciAoKSB7XG5cdFx0XHRqc2MudW5zZXRDbGFzcyhUSElTLnRhcmdldEVsZW1lbnQsIFRISVMuYWN0aXZlQ2xhc3MpO1xuXHRcdFx0anNjLnBpY2tlci53cmFwLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoanNjLnBpY2tlci53cmFwKTtcblx0XHRcdGRlbGV0ZSBqc2MucGlja2VyLm93bmVyO1xuXHRcdH1cblxuXG5cdFx0ZnVuY3Rpb24gZHJhd1BpY2tlciAoKSB7XG5cblx0XHRcdC8vIEF0IHRoaXMgcG9pbnQsIHdoZW4gZHJhd2luZyB0aGUgcGlja2VyLCB3ZSBrbm93IHdoYXQgdGhlIHBhcmVudCBlbGVtZW50cyBhcmVcblx0XHRcdC8vIGFuZCB3ZSBjYW4gZG8gYWxsIHJlbGF0ZWQgRE9NIG9wZXJhdGlvbnMsIHN1Y2ggYXMgcmVnaXN0ZXJpbmcgZXZlbnRzIG9uIHRoZW1cblx0XHRcdC8vIG9yIGNoZWNraW5nIHRoZWlyIHBvc2l0aW9uaW5nXG5cdFx0XHRUSElTLl9wcm9jZXNzUGFyZW50RWxlbWVudHNJbkRPTSgpO1xuXG5cdFx0XHRpZiAoIWpzYy5waWNrZXIpIHtcblx0XHRcdFx0anNjLnBpY2tlciA9IHtcblx0XHRcdFx0XHRvd25lcjogbnVsbCxcblx0XHRcdFx0XHR3cmFwIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0XHRcdFx0Ym94IDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0XHRcdFx0Ym94UyA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBzaGFkb3cgYXJlYVxuXHRcdFx0XHRcdGJveEIgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gYm9yZGVyXG5cdFx0XHRcdFx0cGFkIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0XHRcdFx0cGFkQiA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBib3JkZXJcblx0XHRcdFx0XHRwYWRNIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIG1vdXNlL3RvdWNoIGFyZWFcblx0XHRcdFx0XHRwYWRQYWwgOiBqc2MuY3JlYXRlUGFsZXR0ZSgpLFxuXHRcdFx0XHRcdGNyb3NzIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0XHRcdFx0Y3Jvc3NCWSA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBib3JkZXIgWVxuXHRcdFx0XHRcdGNyb3NzQlggOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gYm9yZGVyIFhcblx0XHRcdFx0XHRjcm9zc0xZIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIGxpbmUgWVxuXHRcdFx0XHRcdGNyb3NzTFggOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gbGluZSBYXG5cdFx0XHRcdFx0c2xkIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0XHRcdFx0c2xkQiA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBib3JkZXJcblx0XHRcdFx0XHRzbGRNIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIC8vIG1vdXNlL3RvdWNoIGFyZWFcblx0XHRcdFx0XHRzbGRHcmFkIDoganNjLmNyZWF0ZVNsaWRlckdyYWRpZW50KCksXG5cdFx0XHRcdFx0c2xkUHRyUyA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBzbGlkZXIgcG9pbnRlciBzcGFjZXJcblx0XHRcdFx0XHRzbGRQdHJJQiA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBzbGlkZXIgcG9pbnRlciBpbm5lciBib3JkZXJcblx0XHRcdFx0XHRzbGRQdHJNQiA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCAvLyBzbGlkZXIgcG9pbnRlciBtaWRkbGUgYm9yZGVyXG5cdFx0XHRcdFx0c2xkUHRyT0IgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSwgLy8gc2xpZGVyIHBvaW50ZXIgb3V0ZXIgYm9yZGVyXG5cdFx0XHRcdFx0YnRuIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG5cdFx0XHRcdFx0YnRuVCA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKSAvLyB0ZXh0XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0anNjLnBpY2tlci5wYWQuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5wYWRQYWwuZWxtKTtcblx0XHRcdFx0anNjLnBpY2tlci5wYWRCLmFwcGVuZENoaWxkKGpzYy5waWNrZXIucGFkKTtcblx0XHRcdFx0anNjLnBpY2tlci5jcm9zcy5hcHBlbmRDaGlsZChqc2MucGlja2VyLmNyb3NzQlkpO1xuXHRcdFx0XHRqc2MucGlja2VyLmNyb3NzLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuY3Jvc3NCWCk7XG5cdFx0XHRcdGpzYy5waWNrZXIuY3Jvc3MuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5jcm9zc0xZKTtcblx0XHRcdFx0anNjLnBpY2tlci5jcm9zcy5hcHBlbmRDaGlsZChqc2MucGlja2VyLmNyb3NzTFgpO1xuXHRcdFx0XHRqc2MucGlja2VyLnBhZEIuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5jcm9zcyk7XG5cdFx0XHRcdGpzYy5waWNrZXIuYm94LmFwcGVuZENoaWxkKGpzYy5waWNrZXIucGFkQik7XG5cdFx0XHRcdGpzYy5waWNrZXIuYm94LmFwcGVuZENoaWxkKGpzYy5waWNrZXIucGFkTSk7XG5cblx0XHRcdFx0anNjLnBpY2tlci5zbGQuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5zbGRHcmFkLmVsbSk7XG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkQi5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZCk7XG5cdFx0XHRcdGpzYy5waWNrZXIuc2xkQi5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZFB0ck9CKTtcblx0XHRcdFx0anNjLnBpY2tlci5zbGRQdHJPQi5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZFB0ck1CKTtcblx0XHRcdFx0anNjLnBpY2tlci5zbGRQdHJNQi5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZFB0cklCKTtcblx0XHRcdFx0anNjLnBpY2tlci5zbGRQdHJJQi5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZFB0clMpO1xuXHRcdFx0XHRqc2MucGlja2VyLmJveC5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZEIpO1xuXHRcdFx0XHRqc2MucGlja2VyLmJveC5hcHBlbmRDaGlsZChqc2MucGlja2VyLnNsZE0pO1xuXG5cdFx0XHRcdGpzYy5waWNrZXIuYnRuLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuYnRuVCk7XG5cdFx0XHRcdGpzYy5waWNrZXIuYm94LmFwcGVuZENoaWxkKGpzYy5waWNrZXIuYnRuKTtcblxuXHRcdFx0XHRqc2MucGlja2VyLmJveEIuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5ib3gpO1xuXHRcdFx0XHRqc2MucGlja2VyLndyYXAuYXBwZW5kQ2hpbGQoanNjLnBpY2tlci5ib3hTKTtcblx0XHRcdFx0anNjLnBpY2tlci53cmFwLmFwcGVuZENoaWxkKGpzYy5waWNrZXIuYm94Qik7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBwID0ganNjLnBpY2tlcjtcblxuXHRcdFx0dmFyIGRpc3BsYXlTbGlkZXIgPSAhIWpzYy5nZXRTbGlkZXJDb21wb25lbnQoVEhJUyk7XG5cdFx0XHR2YXIgZGltcyA9IGpzYy5nZXRQaWNrZXJEaW1zKFRISVMpO1xuXHRcdFx0dmFyIGNyb3NzT3V0ZXJTaXplID0gKDIgKiBUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCArIFRISVMucG9pbnRlclRoaWNrbmVzcyArIDIgKiBUSElTLmNyb3NzU2l6ZSk7XG5cdFx0XHR2YXIgcGFkVG9TbGlkZXJQYWRkaW5nID0ganNjLmdldFBhZFRvU2xpZGVyUGFkZGluZyhUSElTKTtcblx0XHRcdHZhciBib3JkZXJSYWRpdXMgPSBNYXRoLm1pbihcblx0XHRcdFx0VEhJUy5ib3JkZXJSYWRpdXMsXG5cdFx0XHRcdE1hdGgucm91bmQoVEhJUy5wYWRkaW5nICogTWF0aC5QSSkpOyAvLyBweFxuXHRcdFx0dmFyIHBhZEN1cnNvciA9ICdjcm9zc2hhaXInO1xuXG5cdFx0XHQvLyB3cmFwXG5cdFx0XHRwLndyYXAuc3R5bGUuY2xlYXIgPSAnYm90aCc7XG5cdFx0XHRwLndyYXAuc3R5bGUud2lkdGggPSAoZGltc1swXSArIDIgKiBUSElTLmJvcmRlcldpZHRoKSArICdweCc7XG5cdFx0XHRwLndyYXAuc3R5bGUuaGVpZ2h0ID0gKGRpbXNbMV0gKyAyICogVEhJUy5ib3JkZXJXaWR0aCkgKyAncHgnO1xuXHRcdFx0cC53cmFwLnN0eWxlLnpJbmRleCA9IFRISVMuekluZGV4O1xuXG5cdFx0XHQvLyBwaWNrZXJcblx0XHRcdHAuYm94LnN0eWxlLndpZHRoID0gZGltc1swXSArICdweCc7XG5cdFx0XHRwLmJveC5zdHlsZS5oZWlnaHQgPSBkaW1zWzFdICsgJ3B4JztcblxuXHRcdFx0cC5ib3hTLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHAuYm94Uy5zdHlsZS5sZWZ0ID0gJzAnO1xuXHRcdFx0cC5ib3hTLnN0eWxlLnRvcCA9ICcwJztcblx0XHRcdHAuYm94Uy5zdHlsZS53aWR0aCA9ICcxMDAlJztcblx0XHRcdHAuYm94Uy5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XG5cdFx0XHRqc2Muc2V0Qm9yZGVyUmFkaXVzKHAuYm94UywgYm9yZGVyUmFkaXVzICsgJ3B4Jyk7XG5cblx0XHRcdC8vIHBpY2tlciBib3JkZXJcblx0XHRcdHAuYm94Qi5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG5cdFx0XHRwLmJveEIuc3R5bGUuYm9yZGVyID0gVEhJUy5ib3JkZXJXaWR0aCArICdweCBzb2xpZCc7XG5cdFx0XHRwLmJveEIuc3R5bGUuYm9yZGVyQ29sb3IgPSBUSElTLmJvcmRlckNvbG9yO1xuXHRcdFx0cC5ib3hCLnN0eWxlLmJhY2tncm91bmQgPSBUSElTLmJhY2tncm91bmRDb2xvcjtcblx0XHRcdGpzYy5zZXRCb3JkZXJSYWRpdXMocC5ib3hCLCBib3JkZXJSYWRpdXMgKyAncHgnKTtcblxuXHRcdFx0Ly8gSUUgaGFjazpcblx0XHRcdC8vIElmIHRoZSBlbGVtZW50IGlzIHRyYW5zcGFyZW50LCBJRSB3aWxsIHRyaWdnZXIgdGhlIGV2ZW50IG9uIHRoZSBlbGVtZW50cyB1bmRlciBpdCxcblx0XHRcdC8vIGUuZy4gb24gQ2FudmFzIG9yIG9uIGVsZW1lbnRzIHdpdGggYm9yZGVyXG5cdFx0XHRwLnBhZE0uc3R5bGUuYmFja2dyb3VuZCA9XG5cdFx0XHRwLnNsZE0uc3R5bGUuYmFja2dyb3VuZCA9XG5cdFx0XHRcdCcjRkZGJztcblx0XHRcdGpzYy5zZXRTdHlsZShwLnBhZE0sICdvcGFjaXR5JywgJzAnKTtcblx0XHRcdGpzYy5zZXRTdHlsZShwLnNsZE0sICdvcGFjaXR5JywgJzAnKTtcblxuXHRcdFx0Ly8gcGFkXG5cdFx0XHRwLnBhZC5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG5cdFx0XHRwLnBhZC5zdHlsZS53aWR0aCA9IFRISVMud2lkdGggKyAncHgnO1xuXHRcdFx0cC5wYWQuc3R5bGUuaGVpZ2h0ID0gVEhJUy5oZWlnaHQgKyAncHgnO1xuXG5cdFx0XHQvLyBwYWQgcGFsZXR0ZXMgKEhTViBhbmQgSFZTKVxuXHRcdFx0cC5wYWRQYWwuZHJhdyhUSElTLndpZHRoLCBUSElTLmhlaWdodCwganNjLmdldFBhZFlDb21wb25lbnQoVEhJUykpO1xuXG5cdFx0XHQvLyBwYWQgYm9yZGVyXG5cdFx0XHRwLnBhZEIuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0cC5wYWRCLnN0eWxlLmxlZnQgPSBUSElTLnBhZGRpbmcgKyAncHgnO1xuXHRcdFx0cC5wYWRCLnN0eWxlLnRvcCA9IFRISVMucGFkZGluZyArICdweCc7XG5cdFx0XHRwLnBhZEIuc3R5bGUuYm9yZGVyID0gVEhJUy5pbnNldFdpZHRoICsgJ3B4IHNvbGlkJztcblx0XHRcdHAucGFkQi5zdHlsZS5ib3JkZXJDb2xvciA9IFRISVMuaW5zZXRDb2xvcjtcblxuXHRcdFx0Ly8gcGFkIG1vdXNlIGFyZWFcblx0XHRcdHAucGFkTS5fanNjSW5zdGFuY2UgPSBUSElTO1xuXHRcdFx0cC5wYWRNLl9qc2NDb250cm9sTmFtZSA9ICdwYWQnO1xuXHRcdFx0cC5wYWRNLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHAucGFkTS5zdHlsZS5sZWZ0ID0gJzAnO1xuXHRcdFx0cC5wYWRNLnN0eWxlLnRvcCA9ICcwJztcblx0XHRcdHAucGFkTS5zdHlsZS53aWR0aCA9IChUSElTLnBhZGRpbmcgKyAyICogVEhJUy5pbnNldFdpZHRoICsgVEhJUy53aWR0aCArIHBhZFRvU2xpZGVyUGFkZGluZyAvIDIpICsgJ3B4Jztcblx0XHRcdHAucGFkTS5zdHlsZS5oZWlnaHQgPSBkaW1zWzFdICsgJ3B4Jztcblx0XHRcdHAucGFkTS5zdHlsZS5jdXJzb3IgPSBwYWRDdXJzb3I7XG5cblx0XHRcdC8vIHBhZCBjcm9zc1xuXHRcdFx0cC5jcm9zcy5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLmNyb3NzLnN0eWxlLmxlZnQgPVxuXHRcdFx0cC5jcm9zcy5zdHlsZS50b3AgPVxuXHRcdFx0XHQnMCc7XG5cdFx0XHRwLmNyb3NzLnN0eWxlLndpZHRoID1cblx0XHRcdHAuY3Jvc3Muc3R5bGUuaGVpZ2h0ID1cblx0XHRcdFx0Y3Jvc3NPdXRlclNpemUgKyAncHgnO1xuXG5cdFx0XHQvLyBwYWQgY3Jvc3MgYm9yZGVyIFkgYW5kIFhcblx0XHRcdHAuY3Jvc3NCWS5zdHlsZS5wb3NpdGlvbiA9XG5cdFx0XHRwLmNyb3NzQlguc3R5bGUucG9zaXRpb24gPVxuXHRcdFx0XHQnYWJzb2x1dGUnO1xuXHRcdFx0cC5jcm9zc0JZLnN0eWxlLmJhY2tncm91bmQgPVxuXHRcdFx0cC5jcm9zc0JYLnN0eWxlLmJhY2tncm91bmQgPVxuXHRcdFx0XHRUSElTLnBvaW50ZXJCb3JkZXJDb2xvcjtcblx0XHRcdHAuY3Jvc3NCWS5zdHlsZS53aWR0aCA9XG5cdFx0XHRwLmNyb3NzQlguc3R5bGUuaGVpZ2h0ID1cblx0XHRcdFx0KDIgKiBUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCArIFRISVMucG9pbnRlclRoaWNrbmVzcykgKyAncHgnO1xuXHRcdFx0cC5jcm9zc0JZLnN0eWxlLmhlaWdodCA9XG5cdFx0XHRwLmNyb3NzQlguc3R5bGUud2lkdGggPVxuXHRcdFx0XHRjcm9zc091dGVyU2l6ZSArICdweCc7XG5cdFx0XHRwLmNyb3NzQlkuc3R5bGUubGVmdCA9XG5cdFx0XHRwLmNyb3NzQlguc3R5bGUudG9wID1cblx0XHRcdFx0KE1hdGguZmxvb3IoY3Jvc3NPdXRlclNpemUgLyAyKSAtIE1hdGguZmxvb3IoVEhJUy5wb2ludGVyVGhpY2tuZXNzIC8gMikgLSBUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCkgKyAncHgnO1xuXHRcdFx0cC5jcm9zc0JZLnN0eWxlLnRvcCA9XG5cdFx0XHRwLmNyb3NzQlguc3R5bGUubGVmdCA9XG5cdFx0XHRcdCcwJztcblxuXHRcdFx0Ly8gcGFkIGNyb3NzIGxpbmUgWSBhbmQgWFxuXHRcdFx0cC5jcm9zc0xZLnN0eWxlLnBvc2l0aW9uID1cblx0XHRcdHAuY3Jvc3NMWC5zdHlsZS5wb3NpdGlvbiA9XG5cdFx0XHRcdCdhYnNvbHV0ZSc7XG5cdFx0XHRwLmNyb3NzTFkuc3R5bGUuYmFja2dyb3VuZCA9XG5cdFx0XHRwLmNyb3NzTFguc3R5bGUuYmFja2dyb3VuZCA9XG5cdFx0XHRcdFRISVMucG9pbnRlckNvbG9yO1xuXHRcdFx0cC5jcm9zc0xZLnN0eWxlLmhlaWdodCA9XG5cdFx0XHRwLmNyb3NzTFguc3R5bGUud2lkdGggPVxuXHRcdFx0XHQoY3Jvc3NPdXRlclNpemUgLSAyICogVEhJUy5wb2ludGVyQm9yZGVyV2lkdGgpICsgJ3B4Jztcblx0XHRcdHAuY3Jvc3NMWS5zdHlsZS53aWR0aCA9XG5cdFx0XHRwLmNyb3NzTFguc3R5bGUuaGVpZ2h0ID1cblx0XHRcdFx0VEhJUy5wb2ludGVyVGhpY2tuZXNzICsgJ3B4Jztcblx0XHRcdHAuY3Jvc3NMWS5zdHlsZS5sZWZ0ID1cblx0XHRcdHAuY3Jvc3NMWC5zdHlsZS50b3AgPVxuXHRcdFx0XHQoTWF0aC5mbG9vcihjcm9zc091dGVyU2l6ZSAvIDIpIC0gTWF0aC5mbG9vcihUSElTLnBvaW50ZXJUaGlja25lc3MgLyAyKSkgKyAncHgnO1xuXHRcdFx0cC5jcm9zc0xZLnN0eWxlLnRvcCA9XG5cdFx0XHRwLmNyb3NzTFguc3R5bGUubGVmdCA9XG5cdFx0XHRcdFRISVMucG9pbnRlckJvcmRlcldpZHRoICsgJ3B4JztcblxuXHRcdFx0Ly8gc2xpZGVyXG5cdFx0XHRwLnNsZC5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuXHRcdFx0cC5zbGQuc3R5bGUud2lkdGggPSBUSElTLnNsaWRlclNpemUgKyAncHgnO1xuXHRcdFx0cC5zbGQuc3R5bGUuaGVpZ2h0ID0gVEhJUy5oZWlnaHQgKyAncHgnO1xuXG5cdFx0XHQvLyBzbGlkZXIgZ3JhZGllbnRcblx0XHRcdHAuc2xkR3JhZC5kcmF3KFRISVMuc2xpZGVyU2l6ZSwgVEhJUy5oZWlnaHQsICcjMDAwJywgJyMwMDAnKTtcblxuXHRcdFx0Ly8gc2xpZGVyIGJvcmRlclxuXHRcdFx0cC5zbGRCLnN0eWxlLmRpc3BsYXkgPSBkaXNwbGF5U2xpZGVyID8gJ2Jsb2NrJyA6ICdub25lJztcblx0XHRcdHAuc2xkQi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLnNsZEIuc3R5bGUucmlnaHQgPSBUSElTLnBhZGRpbmcgKyAncHgnO1xuXHRcdFx0cC5zbGRCLnN0eWxlLnRvcCA9IFRISVMucGFkZGluZyArICdweCc7XG5cdFx0XHRwLnNsZEIuc3R5bGUuYm9yZGVyID0gVEhJUy5pbnNldFdpZHRoICsgJ3B4IHNvbGlkJztcblx0XHRcdHAuc2xkQi5zdHlsZS5ib3JkZXJDb2xvciA9IFRISVMuaW5zZXRDb2xvcjtcblxuXHRcdFx0Ly8gc2xpZGVyIG1vdXNlIGFyZWFcblx0XHRcdHAuc2xkTS5fanNjSW5zdGFuY2UgPSBUSElTO1xuXHRcdFx0cC5zbGRNLl9qc2NDb250cm9sTmFtZSA9ICdzbGQnO1xuXHRcdFx0cC5zbGRNLnN0eWxlLmRpc3BsYXkgPSBkaXNwbGF5U2xpZGVyID8gJ2Jsb2NrJyA6ICdub25lJztcblx0XHRcdHAuc2xkTS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLnNsZE0uc3R5bGUucmlnaHQgPSAnMCc7XG5cdFx0XHRwLnNsZE0uc3R5bGUudG9wID0gJzAnO1xuXHRcdFx0cC5zbGRNLnN0eWxlLndpZHRoID0gKFRISVMuc2xpZGVyU2l6ZSArIHBhZFRvU2xpZGVyUGFkZGluZyAvIDIgKyBUSElTLnBhZGRpbmcgKyAyICogVEhJUy5pbnNldFdpZHRoKSArICdweCc7XG5cdFx0XHRwLnNsZE0uc3R5bGUuaGVpZ2h0ID0gZGltc1sxXSArICdweCc7XG5cdFx0XHRwLnNsZE0uc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQnO1xuXG5cdFx0XHQvLyBzbGlkZXIgcG9pbnRlciBpbm5lciBhbmQgb3V0ZXIgYm9yZGVyXG5cdFx0XHRwLnNsZFB0cklCLnN0eWxlLmJvcmRlciA9XG5cdFx0XHRwLnNsZFB0ck9CLnN0eWxlLmJvcmRlciA9XG5cdFx0XHRcdFRISVMucG9pbnRlckJvcmRlcldpZHRoICsgJ3B4IHNvbGlkICcgKyBUSElTLnBvaW50ZXJCb3JkZXJDb2xvcjtcblxuXHRcdFx0Ly8gc2xpZGVyIHBvaW50ZXIgb3V0ZXIgYm9yZGVyXG5cdFx0XHRwLnNsZFB0ck9CLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0XHRcdHAuc2xkUHRyT0Iuc3R5bGUubGVmdCA9IC0oMiAqIFRISVMucG9pbnRlckJvcmRlcldpZHRoICsgVEhJUy5wb2ludGVyVGhpY2tuZXNzKSArICdweCc7XG5cdFx0XHRwLnNsZFB0ck9CLnN0eWxlLnRvcCA9ICcwJztcblxuXHRcdFx0Ly8gc2xpZGVyIHBvaW50ZXIgbWlkZGxlIGJvcmRlclxuXHRcdFx0cC5zbGRQdHJNQi5zdHlsZS5ib3JkZXIgPSBUSElTLnBvaW50ZXJUaGlja25lc3MgKyAncHggc29saWQgJyArIFRISVMucG9pbnRlckNvbG9yO1xuXG5cdFx0XHQvLyBzbGlkZXIgcG9pbnRlciBzcGFjZXJcblx0XHRcdHAuc2xkUHRyUy5zdHlsZS53aWR0aCA9IFRISVMuc2xpZGVyU2l6ZSArICdweCc7XG5cdFx0XHRwLnNsZFB0clMuc3R5bGUuaGVpZ2h0ID0gc2xpZGVyUHRyU3BhY2UgKyAncHgnO1xuXG5cdFx0XHQvLyB0aGUgQ2xvc2UgYnV0dG9uXG5cdFx0XHRmdW5jdGlvbiBzZXRCdG5Cb3JkZXIgKCkge1xuXHRcdFx0XHR2YXIgaW5zZXRDb2xvcnMgPSBUSElTLmluc2V0Q29sb3Iuc3BsaXQoL1xccysvKTtcblx0XHRcdFx0dmFyIG91dHNldENvbG9yID0gaW5zZXRDb2xvcnMubGVuZ3RoIDwgMiA/IGluc2V0Q29sb3JzWzBdIDogaW5zZXRDb2xvcnNbMV0gKyAnICcgKyBpbnNldENvbG9yc1swXSArICcgJyArIGluc2V0Q29sb3JzWzBdICsgJyAnICsgaW5zZXRDb2xvcnNbMV07XG5cdFx0XHRcdHAuYnRuLnN0eWxlLmJvcmRlckNvbG9yID0gb3V0c2V0Q29sb3I7XG5cdFx0XHR9XG5cdFx0XHRwLmJ0bi5zdHlsZS5kaXNwbGF5ID0gVEhJUy5jbG9zYWJsZSA/ICdibG9jaycgOiAnbm9uZSc7XG5cdFx0XHRwLmJ0bi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cdFx0XHRwLmJ0bi5zdHlsZS5sZWZ0ID0gVEhJUy5wYWRkaW5nICsgJ3B4Jztcblx0XHRcdHAuYnRuLnN0eWxlLmJvdHRvbSA9IFRISVMucGFkZGluZyArICdweCc7XG5cdFx0XHRwLmJ0bi5zdHlsZS5wYWRkaW5nID0gJzAgMTVweCc7XG5cdFx0XHRwLmJ0bi5zdHlsZS5oZWlnaHQgPSBUSElTLmJ1dHRvbkhlaWdodCArICdweCc7XG5cdFx0XHRwLmJ0bi5zdHlsZS5ib3JkZXIgPSBUSElTLmluc2V0V2lkdGggKyAncHggc29saWQnO1xuXHRcdFx0c2V0QnRuQm9yZGVyKCk7XG5cdFx0XHRwLmJ0bi5zdHlsZS5jb2xvciA9IFRISVMuYnV0dG9uQ29sb3I7XG5cdFx0XHRwLmJ0bi5zdHlsZS5mb250ID0gJzEycHggc2Fucy1zZXJpZic7XG5cdFx0XHRwLmJ0bi5zdHlsZS50ZXh0QWxpZ24gPSAnY2VudGVyJztcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHAuYnRuLnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcblx0XHRcdH0gY2F0Y2goZU9sZElFKSB7XG5cdFx0XHRcdHAuYnRuLnN0eWxlLmN1cnNvciA9ICdoYW5kJztcblx0XHRcdH1cblx0XHRcdHAuYnRuLm9ubW91c2Vkb3duID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRUSElTLmhpZGUoKTtcblx0XHRcdH07XG5cdFx0XHRwLmJ0blQuc3R5bGUubGluZUhlaWdodCA9IFRISVMuYnV0dG9uSGVpZ2h0ICsgJ3B4Jztcblx0XHRcdHAuYnRuVC5pbm5lckhUTUwgPSAnJztcblx0XHRcdHAuYnRuVC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShUSElTLmNsb3NlVGV4dCkpO1xuXG5cdFx0XHQvLyBwbGFjZSBwb2ludGVyc1xuXHRcdFx0cmVkcmF3UGFkKCk7XG5cdFx0XHRyZWRyYXdTbGQoKTtcblxuXHRcdFx0Ly8gSWYgd2UgYXJlIGNoYW5naW5nIHRoZSBvd25lciB3aXRob3V0IGZpcnN0IGNsb3NpbmcgdGhlIHBpY2tlcixcblx0XHRcdC8vIG1ha2Ugc3VyZSB0byBmaXJzdCBkZWFsIHdpdGggdGhlIG9sZCBvd25lclxuXHRcdFx0aWYgKGpzYy5waWNrZXIub3duZXIgJiYganNjLnBpY2tlci5vd25lciAhPT0gVEhJUykge1xuXHRcdFx0XHRqc2MudW5zZXRDbGFzcyhqc2MucGlja2VyLm93bmVyLnRhcmdldEVsZW1lbnQsIFRISVMuYWN0aXZlQ2xhc3MpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBTZXQgdGhlIG5ldyBwaWNrZXIgb3duZXJcblx0XHRcdGpzYy5waWNrZXIub3duZXIgPSBUSElTO1xuXG5cdFx0XHQvLyBUaGUgcmVkcmF3UG9zaXRpb24oKSBtZXRob2QgbmVlZHMgcGlja2VyLm93bmVyIHRvIGJlIHNldCwgdGhhdCdzIHdoeSB3ZSBjYWxsIGl0IGhlcmUsXG5cdFx0XHQvLyBhZnRlciBzZXR0aW5nIHRoZSBvd25lclxuXHRcdFx0aWYgKGpzYy5pc0VsZW1lbnRUeXBlKGNvbnRhaW5lciwgJ2JvZHknKSkge1xuXHRcdFx0XHRqc2MucmVkcmF3UG9zaXRpb24oKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGpzYy5fZHJhd1Bvc2l0aW9uKFRISVMsIDAsIDAsICdyZWxhdGl2ZScsIGZhbHNlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHAud3JhcC5wYXJlbnROb2RlICE9IGNvbnRhaW5lcikge1xuXHRcdFx0XHRjb250YWluZXIuYXBwZW5kQ2hpbGQocC53cmFwKTtcblx0XHRcdH1cblxuXHRcdFx0anNjLnNldENsYXNzKFRISVMudGFyZ2V0RWxlbWVudCwgVEhJUy5hY3RpdmVDbGFzcyk7XG5cdFx0fVxuXG5cblx0XHRmdW5jdGlvbiByZWRyYXdQYWQgKCkge1xuXHRcdFx0Ly8gcmVkcmF3IHRoZSBwYWQgcG9pbnRlclxuXHRcdFx0c3dpdGNoIChqc2MuZ2V0UGFkWUNvbXBvbmVudChUSElTKSkge1xuXHRcdFx0Y2FzZSAncyc6IHZhciB5Q29tcG9uZW50ID0gMTsgYnJlYWs7XG5cdFx0XHRjYXNlICd2JzogdmFyIHlDb21wb25lbnQgPSAyOyBicmVhaztcblx0XHRcdH1cblx0XHRcdHZhciB4ID0gTWF0aC5yb3VuZCgoVEhJUy5oc3ZbMF0gLyAzNjApICogKFRISVMud2lkdGggLSAxKSk7XG5cdFx0XHR2YXIgeSA9IE1hdGgucm91bmQoKDEgLSBUSElTLmhzdlt5Q29tcG9uZW50XSAvIDEwMCkgKiAoVEhJUy5oZWlnaHQgLSAxKSk7XG5cdFx0XHR2YXIgY3Jvc3NPdXRlclNpemUgPSAoMiAqIFRISVMucG9pbnRlckJvcmRlcldpZHRoICsgVEhJUy5wb2ludGVyVGhpY2tuZXNzICsgMiAqIFRISVMuY3Jvc3NTaXplKTtcblx0XHRcdHZhciBvZnMgPSAtTWF0aC5mbG9vcihjcm9zc091dGVyU2l6ZSAvIDIpO1xuXHRcdFx0anNjLnBpY2tlci5jcm9zcy5zdHlsZS5sZWZ0ID0gKHggKyBvZnMpICsgJ3B4Jztcblx0XHRcdGpzYy5waWNrZXIuY3Jvc3Muc3R5bGUudG9wID0gKHkgKyBvZnMpICsgJ3B4JztcblxuXHRcdFx0Ly8gcmVkcmF3IHRoZSBzbGlkZXJcblx0XHRcdHN3aXRjaCAoanNjLmdldFNsaWRlckNvbXBvbmVudChUSElTKSkge1xuXHRcdFx0Y2FzZSAncyc6XG5cdFx0XHRcdHZhciByZ2IxID0gSFNWX1JHQihUSElTLmhzdlswXSwgMTAwLCBUSElTLmhzdlsyXSk7XG5cdFx0XHRcdHZhciByZ2IyID0gSFNWX1JHQihUSElTLmhzdlswXSwgMCwgVEhJUy5oc3ZbMl0pO1xuXHRcdFx0XHR2YXIgY29sb3IxID0gJ3JnYignICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYjFbMF0pICsgJywnICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYjFbMV0pICsgJywnICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYjFbMl0pICsgJyknO1xuXHRcdFx0XHR2YXIgY29sb3IyID0gJ3JnYignICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYjJbMF0pICsgJywnICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYjJbMV0pICsgJywnICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYjJbMl0pICsgJyknO1xuXHRcdFx0XHRqc2MucGlja2VyLnNsZEdyYWQuZHJhdyhUSElTLnNsaWRlclNpemUsIFRISVMuaGVpZ2h0LCBjb2xvcjEsIGNvbG9yMik7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAndic6XG5cdFx0XHRcdHZhciByZ2IgPSBIU1ZfUkdCKFRISVMuaHN2WzBdLCBUSElTLmhzdlsxXSwgMTAwKTtcblx0XHRcdFx0dmFyIGNvbG9yMSA9ICdyZ2IoJyArXG5cdFx0XHRcdFx0TWF0aC5yb3VuZChyZ2JbMF0pICsgJywnICtcblx0XHRcdFx0XHRNYXRoLnJvdW5kKHJnYlsxXSkgKyAnLCcgK1xuXHRcdFx0XHRcdE1hdGgucm91bmQocmdiWzJdKSArICcpJztcblx0XHRcdFx0dmFyIGNvbG9yMiA9ICcjMDAwJztcblx0XHRcdFx0anNjLnBpY2tlci5zbGRHcmFkLmRyYXcoVEhJUy5zbGlkZXJTaXplLCBUSElTLmhlaWdodCwgY29sb3IxLCBjb2xvcjIpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9XG5cblxuXHRcdGZ1bmN0aW9uIHJlZHJhd1NsZCAoKSB7XG5cdFx0XHR2YXIgc2xkQ29tcG9uZW50ID0ganNjLmdldFNsaWRlckNvbXBvbmVudChUSElTKTtcblx0XHRcdGlmIChzbGRDb21wb25lbnQpIHtcblx0XHRcdFx0Ly8gcmVkcmF3IHRoZSBzbGlkZXIgcG9pbnRlclxuXHRcdFx0XHRzd2l0Y2ggKHNsZENvbXBvbmVudCkge1xuXHRcdFx0XHRjYXNlICdzJzogdmFyIHlDb21wb25lbnQgPSAxOyBicmVhaztcblx0XHRcdFx0Y2FzZSAndic6IHZhciB5Q29tcG9uZW50ID0gMjsgYnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdFx0dmFyIHkgPSBNYXRoLnJvdW5kKCgxIC0gVEhJUy5oc3ZbeUNvbXBvbmVudF0gLyAxMDApICogKFRISVMuaGVpZ2h0IC0gMSkpO1xuXHRcdFx0XHRqc2MucGlja2VyLnNsZFB0ck9CLnN0eWxlLnRvcCA9ICh5IC0gKDIgKiBUSElTLnBvaW50ZXJCb3JkZXJXaWR0aCArIFRISVMucG9pbnRlclRoaWNrbmVzcykgLSBNYXRoLmZsb29yKHNsaWRlclB0clNwYWNlIC8gMikpICsgJ3B4Jztcblx0XHRcdH1cblx0XHR9XG5cblxuXHRcdGZ1bmN0aW9uIGlzUGlja2VyT3duZXIgKCkge1xuXHRcdFx0cmV0dXJuIGpzYy5waWNrZXIgJiYganNjLnBpY2tlci5vd25lciA9PT0gVEhJUztcblx0XHR9XG5cblxuXHRcdGZ1bmN0aW9uIGJsdXJWYWx1ZSAoKSB7XG5cdFx0XHRUSElTLmltcG9ydENvbG9yKCk7XG5cdFx0fVxuXG5cblx0XHQvLyBGaW5kIHRoZSB0YXJnZXQgZWxlbWVudFxuXHRcdGlmICh0eXBlb2YgdGFyZ2V0RWxlbWVudCA9PT0gJ3N0cmluZycpIHtcblx0XHRcdHZhciBpZCA9IHRhcmdldEVsZW1lbnQ7XG5cdFx0XHR2YXIgZWxtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuXHRcdFx0aWYgKGVsbSkge1xuXHRcdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBlbG07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRqc2Mud2FybignQ291bGQgbm90IGZpbmQgdGFyZ2V0IGVsZW1lbnQgd2l0aCBJRCBcXCcnICsgaWQgKyAnXFwnJyk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmICh0YXJnZXRFbGVtZW50KSB7XG5cdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSB0YXJnZXRFbGVtZW50O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRqc2Mud2FybignSW52YWxpZCB0YXJnZXQgZWxlbWVudDogXFwnJyArIHRhcmdldEVsZW1lbnQgKyAnXFwnJyk7XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMudGFyZ2V0RWxlbWVudC5fanNjTGlua2VkSW5zdGFuY2UpIHtcblx0XHRcdGpzYy53YXJuKCdDYW5ub3QgbGluayBqc2NvbG9yIHR3aWNlIHRvIHRoZSBzYW1lIGVsZW1lbnQuIFNraXBwaW5nLicpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHR0aGlzLnRhcmdldEVsZW1lbnQuX2pzY0xpbmtlZEluc3RhbmNlID0gdGhpcztcblxuXHRcdC8vIEZpbmQgdGhlIHZhbHVlIGVsZW1lbnRcblx0XHR0aGlzLnZhbHVlRWxlbWVudCA9IGpzYy5mZXRjaEVsZW1lbnQodGhpcy52YWx1ZUVsZW1lbnQpO1xuXHRcdC8vIEZpbmQgdGhlIHN0eWxlIGVsZW1lbnRcblx0XHR0aGlzLnN0eWxlRWxlbWVudCA9IGpzYy5mZXRjaEVsZW1lbnQodGhpcy5zdHlsZUVsZW1lbnQpO1xuXG5cdFx0dmFyIFRISVMgPSB0aGlzO1xuXHRcdHZhciBjb250YWluZXIgPVxuXHRcdFx0dGhpcy5jb250YWluZXIgP1xuXHRcdFx0anNjLmZldGNoRWxlbWVudCh0aGlzLmNvbnRhaW5lcikgOlxuXHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVswXTtcblx0XHR2YXIgc2xpZGVyUHRyU3BhY2UgPSAzOyAvLyBweFxuXG5cdFx0Ly8gRm9yIEJVVFRPTiBlbGVtZW50cyBpdCdzIGltcG9ydGFudCB0byBzdG9wIHRoZW0gZnJvbSBzZW5kaW5nIHRoZSBmb3JtIHdoZW4gY2xpY2tlZFxuXHRcdC8vIChlLmcuIGluIFNhZmFyaSlcblx0XHRpZiAoanNjLmlzRWxlbWVudFR5cGUodGhpcy50YXJnZXRFbGVtZW50LCAnYnV0dG9uJykpIHtcblx0XHRcdGlmICh0aGlzLnRhcmdldEVsZW1lbnQub25jbGljaykge1xuXHRcdFx0XHR2YXIgb3JpZ0NhbGxiYWNrID0gdGhpcy50YXJnZXRFbGVtZW50Lm9uY2xpY2s7XG5cdFx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudC5vbmNsaWNrID0gZnVuY3Rpb24gKGV2dCkge1xuXHRcdFx0XHRcdG9yaWdDYWxsYmFjay5jYWxsKHRoaXMsIGV2dCk7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9O1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy50YXJnZXRFbGVtZW50Lm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvKlxuXHRcdHZhciBlbG0gPSB0aGlzLnRhcmdldEVsZW1lbnQ7XG5cdFx0ZG8ge1xuXHRcdFx0Ly8gSWYgdGhlIHRhcmdldCBlbGVtZW50IG9yIG9uZSBvZiBpdHMgb2Zmc2V0UGFyZW50cyBoYXMgZml4ZWQgcG9zaXRpb24sXG5cdFx0XHQvLyB0aGVuIHVzZSBmaXhlZCBwb3NpdGlvbmluZyBpbnN0ZWFkXG5cdFx0XHQvL1xuXHRcdFx0Ly8gTm90ZTogSW4gRmlyZWZveCwgZ2V0Q29tcHV0ZWRTdHlsZSByZXR1cm5zIG51bGwgaW4gYSBoaWRkZW4gaWZyYW1lLFxuXHRcdFx0Ly8gdGhhdCdzIHdoeSB3ZSBuZWVkIHRvIGNoZWNrIGlmIHRoZSByZXR1cm5lZCBzdHlsZSBvYmplY3QgaXMgbm9uLWVtcHR5XG5cdFx0XHR2YXIgY3VyclN0eWxlID0ganNjLmdldFN0eWxlKGVsbSk7XG5cdFx0XHRpZiAoY3VyclN0eWxlICYmIGN1cnJTdHlsZS5wb3NpdGlvbi50b0xvd2VyQ2FzZSgpID09PSAnZml4ZWQnKSB7XG5cdFx0XHRcdHRoaXMuZml4ZWQgPSB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZWxtICE9PSB0aGlzLnRhcmdldEVsZW1lbnQpIHtcblx0XHRcdFx0Ly8gYXR0YWNoIG9uUGFyZW50U2Nyb2xsIHNvIHRoYXQgd2UgY2FuIHJlY29tcHV0ZSB0aGUgcGlja2VyIHBvc2l0aW9uXG5cdFx0XHRcdC8vIHdoZW4gb25lIG9mIHRoZSBvZmZzZXRQYXJlbnRzIGlzIHNjcm9sbGVkXG5cdFx0XHRcdGlmICghZWxtLl9qc2NFdmVudHNBdHRhY2hlZCkge1xuXHRcdFx0XHRcdGpzYy5hdHRhY2hFdmVudChlbG0sICdzY3JvbGwnLCBqc2Mub25QYXJlbnRTY3JvbGwpO1xuXHRcdFx0XHRcdGVsbS5fanNjRXZlbnRzQXR0YWNoZWQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSB3aGlsZSAoKGVsbSA9IGVsbS5vZmZzZXRQYXJlbnQpICYmICFqc2MuaXNFbGVtZW50VHlwZShlbG0sICdib2R5JykpO1xuXHRcdCovXG5cblx0XHQvLyB2YWx1ZUVsZW1lbnRcblx0XHRpZiAodGhpcy52YWx1ZUVsZW1lbnQpIHtcblx0XHRcdGlmIChqc2MuaXNFbGVtZW50VHlwZSh0aGlzLnZhbHVlRWxlbWVudCwgJ2lucHV0JykpIHtcblx0XHRcdFx0dmFyIHVwZGF0ZUZpZWxkID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFRISVMuZnJvbVN0cmluZyhUSElTLnZhbHVlRWxlbWVudC52YWx1ZSwganNjLmxlYXZlVmFsdWUpO1xuXHRcdFx0XHRcdGpzYy5kaXNwYXRjaEZpbmVDaGFuZ2UoVEhJUyk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdGpzYy5hdHRhY2hFdmVudCh0aGlzLnZhbHVlRWxlbWVudCwgJ2tleXVwJywgdXBkYXRlRmllbGQpO1xuXHRcdFx0XHRqc2MuYXR0YWNoRXZlbnQodGhpcy52YWx1ZUVsZW1lbnQsICdpbnB1dCcsIHVwZGF0ZUZpZWxkKTtcblx0XHRcdFx0anNjLmF0dGFjaEV2ZW50KHRoaXMudmFsdWVFbGVtZW50LCAnYmx1cicsIGJsdXJWYWx1ZSk7XG5cdFx0XHRcdHRoaXMudmFsdWVFbGVtZW50LnNldEF0dHJpYnV0ZSgnYXV0b2NvbXBsZXRlJywgJ29mZicpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIHN0eWxlRWxlbWVudFxuXHRcdGlmICh0aGlzLnN0eWxlRWxlbWVudCkge1xuXHRcdFx0dGhpcy5zdHlsZUVsZW1lbnQuX2pzY09yaWdTdHlsZSA9IHtcblx0XHRcdFx0YmFja2dyb3VuZEltYWdlIDogdGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuYmFja2dyb3VuZEltYWdlLFxuXHRcdFx0XHRiYWNrZ3JvdW5kQ29sb3IgOiB0aGlzLnN0eWxlRWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IsXG5cdFx0XHRcdGNvbG9yIDogdGhpcy5zdHlsZUVsZW1lbnQuc3R5bGUuY29sb3Jcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMudmFsdWUpIHtcblx0XHRcdC8vIFRyeSB0byBzZXQgdGhlIGNvbG9yIGZyb20gdGhlIC52YWx1ZSBvcHRpb24gYW5kIGlmIHVuc3VjY2Vzc2Z1bCxcblx0XHRcdC8vIGV4cG9ydCB0aGUgY3VycmVudCBjb2xvclxuXHRcdFx0dGhpcy5mcm9tU3RyaW5nKHRoaXMudmFsdWUpIHx8IHRoaXMuZXhwb3J0Q29sb3IoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5pbXBvcnRDb2xvcigpO1xuXHRcdH1cblx0fVxuXG59O1xuXG5cbi8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIFB1YmxpYyBwcm9wZXJ0aWVzIGFuZCBtZXRob2RzXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cblxuLy8gQnkgZGVmYXVsdCwgc2VhcmNoIGZvciBhbGwgZWxlbWVudHMgd2l0aCBjbGFzcz1cImpzY29sb3JcIiBhbmQgaW5zdGFsbCBhIGNvbG9yIHBpY2tlciBvbiB0aGVtLlxuLy9cbi8vIFlvdSBjYW4gY2hhbmdlIHdoYXQgY2xhc3MgbmFtZSB3aWxsIGJlIGxvb2tlZCBmb3IgYnkgc2V0dGluZyB0aGUgcHJvcGVydHkganNjb2xvci5sb29rdXBDbGFzc1xuLy8gYW55d2hlcmUgaW4geW91ciBIVE1MIGRvY3VtZW50LiBUbyBjb21wbGV0ZWx5IGRpc2FibGUgdGhlIGF1dG9tYXRpYyBsb29rdXAsIHNldCBpdCB0byBudWxsLlxuLy9cbmpzYy5qc2NvbG9yLmxvb2t1cENsYXNzID0gJ2pzY29sb3InO1xuXG5cbmpzYy5qc2NvbG9yLmluc3RhbGxCeUNsYXNzTmFtZSA9IGZ1bmN0aW9uIChjbGFzc05hbWUpIHtcblx0dmFyIGlucHV0RWxtcyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbnB1dCcpO1xuXHR2YXIgYnV0dG9uRWxtcyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdidXR0b24nKTtcblxuXHRqc2MudHJ5SW5zdGFsbE9uRWxlbWVudHMoaW5wdXRFbG1zLCBjbGFzc05hbWUpO1xuXHRqc2MudHJ5SW5zdGFsbE9uRWxlbWVudHMoYnV0dG9uRWxtcywgY2xhc3NOYW1lKTtcbn07XG5cblxuanNjLnJlZ2lzdGVyKCk7XG5cblxucmV0dXJuIGpzYy5qc2NvbG9yO1xuXG5cbn0pKCk7IH1cbiIsIi8qISB2ZXguY29tYmluZWQuanM6IHZleCAzLjEuMSwgdmV4LWRpYWxvZyAxLjAuNyAqL1xuIWZ1bmN0aW9uKGEpe2lmKFwib2JqZWN0XCI9PXR5cGVvZiBleHBvcnRzJiZcInVuZGVmaW5lZFwiIT10eXBlb2YgbW9kdWxlKW1vZHVsZS5leHBvcnRzPWEoKTtlbHNlIGlmKFwiZnVuY3Rpb25cIj09dHlwZW9mIGRlZmluZSYmZGVmaW5lLmFtZClkZWZpbmUoW10sYSk7ZWxzZXt2YXIgYjtiPVwidW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3c/d2luZG93OlwidW5kZWZpbmVkXCIhPXR5cGVvZiBnbG9iYWw/Z2xvYmFsOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6dGhpcyxiLnZleD1hKCl9fShmdW5jdGlvbigpe3ZhciBhO3JldHVybiBmdW5jdGlvbiBiKGEsYyxkKXtmdW5jdGlvbiBlKGcsaCl7aWYoIWNbZ10pe2lmKCFhW2ddKXt2YXIgaT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFoJiZpKXJldHVybiBpKGcsITApO2lmKGYpcmV0dXJuIGYoZywhMCk7dmFyIGo9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitnK1wiJ1wiKTt0aHJvdyBqLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsan12YXIgaz1jW2ddPXtleHBvcnRzOnt9fTthW2ddWzBdLmNhbGwoay5leHBvcnRzLGZ1bmN0aW9uKGIpe3ZhciBjPWFbZ11bMV1bYl07cmV0dXJuIGUoYz9jOmIpfSxrLGsuZXhwb3J0cyxiLGEsYyxkKX1yZXR1cm4gY1tnXS5leHBvcnRzfWZvcih2YXIgZj1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGc9MDtnPGQubGVuZ3RoO2crKyllKGRbZ10pO3JldHVybiBlfSh7MTpbZnVuY3Rpb24oYSxiLGMpe1wiZG9jdW1lbnRcImluIHdpbmRvdy5zZWxmJiYoXCJjbGFzc0xpc3RcImluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJfXCIpJiYoIWRvY3VtZW50LmNyZWF0ZUVsZW1lbnROU3x8XCJjbGFzc0xpc3RcImluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsXCJnXCIpKT8hZnVuY3Rpb24oKXtcInVzZSBzdHJpY3RcIjt2YXIgYT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKTtpZihhLmNsYXNzTGlzdC5hZGQoXCJjMVwiLFwiYzJcIiksIWEuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYzJcIikpe3ZhciBiPWZ1bmN0aW9uKGEpe3ZhciBiPURPTVRva2VuTGlzdC5wcm90b3R5cGVbYV07RE9NVG9rZW5MaXN0LnByb3RvdHlwZVthXT1mdW5jdGlvbihhKXt2YXIgYyxkPWFyZ3VtZW50cy5sZW5ndGg7Zm9yKGM9MDtjPGQ7YysrKWE9YXJndW1lbnRzW2NdLGIuY2FsbCh0aGlzLGEpfX07YihcImFkZFwiKSxiKFwicmVtb3ZlXCIpfWlmKGEuY2xhc3NMaXN0LnRvZ2dsZShcImMzXCIsITEpLGEuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYzNcIikpe3ZhciBjPURPTVRva2VuTGlzdC5wcm90b3R5cGUudG9nZ2xlO0RPTVRva2VuTGlzdC5wcm90b3R5cGUudG9nZ2xlPWZ1bmN0aW9uKGEsYil7cmV0dXJuIDEgaW4gYXJndW1lbnRzJiYhdGhpcy5jb250YWlucyhhKT09IWI/YjpjLmNhbGwodGhpcyxhKX19YT1udWxsfSgpOiFmdW5jdGlvbihhKXtcInVzZSBzdHJpY3RcIjtpZihcIkVsZW1lbnRcImluIGEpe3ZhciBiPVwiY2xhc3NMaXN0XCIsYz1cInByb3RvdHlwZVwiLGQ9YS5FbGVtZW50W2NdLGU9T2JqZWN0LGY9U3RyaW5nW2NdLnRyaW18fGZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMucmVwbGFjZSgvXlxccyt8XFxzKyQvZyxcIlwiKX0sZz1BcnJheVtjXS5pbmRleE9mfHxmdW5jdGlvbihhKXtmb3IodmFyIGI9MCxjPXRoaXMubGVuZ3RoO2I8YztiKyspaWYoYiBpbiB0aGlzJiZ0aGlzW2JdPT09YSlyZXR1cm4gYjtyZXR1cm4tMX0saD1mdW5jdGlvbihhLGIpe3RoaXMubmFtZT1hLHRoaXMuY29kZT1ET01FeGNlcHRpb25bYV0sdGhpcy5tZXNzYWdlPWJ9LGk9ZnVuY3Rpb24oYSxiKXtpZihcIlwiPT09Yil0aHJvdyBuZXcgaChcIlNZTlRBWF9FUlJcIixcIkFuIGludmFsaWQgb3IgaWxsZWdhbCBzdHJpbmcgd2FzIHNwZWNpZmllZFwiKTtpZigvXFxzLy50ZXN0KGIpKXRocm93IG5ldyBoKFwiSU5WQUxJRF9DSEFSQUNURVJfRVJSXCIsXCJTdHJpbmcgY29udGFpbnMgYW4gaW52YWxpZCBjaGFyYWN0ZXJcIik7cmV0dXJuIGcuY2FsbChhLGIpfSxqPWZ1bmN0aW9uKGEpe2Zvcih2YXIgYj1mLmNhbGwoYS5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKXx8XCJcIiksYz1iP2Iuc3BsaXQoL1xccysvKTpbXSxkPTAsZT1jLmxlbmd0aDtkPGU7ZCsrKXRoaXMucHVzaChjW2RdKTt0aGlzLl91cGRhdGVDbGFzc05hbWU9ZnVuY3Rpb24oKXthLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsdGhpcy50b1N0cmluZygpKX19LGs9altjXT1bXSxsPWZ1bmN0aW9uKCl7cmV0dXJuIG5ldyBqKHRoaXMpfTtpZihoW2NdPUVycm9yW2NdLGsuaXRlbT1mdW5jdGlvbihhKXtyZXR1cm4gdGhpc1thXXx8bnVsbH0say5jb250YWlucz1mdW5jdGlvbihhKXtyZXR1cm4gYSs9XCJcIixpKHRoaXMsYSkhPT0tMX0say5hZGQ9ZnVuY3Rpb24oKXt2YXIgYSxiPWFyZ3VtZW50cyxjPTAsZD1iLmxlbmd0aCxlPSExO2RvIGE9YltjXStcIlwiLGkodGhpcyxhKT09PS0xJiYodGhpcy5wdXNoKGEpLGU9ITApO3doaWxlKCsrYzxkKTtlJiZ0aGlzLl91cGRhdGVDbGFzc05hbWUoKX0say5yZW1vdmU9ZnVuY3Rpb24oKXt2YXIgYSxiLGM9YXJndW1lbnRzLGQ9MCxlPWMubGVuZ3RoLGY9ITE7ZG8gZm9yKGE9Y1tkXStcIlwiLGI9aSh0aGlzLGEpO2IhPT0tMTspdGhpcy5zcGxpY2UoYiwxKSxmPSEwLGI9aSh0aGlzLGEpO3doaWxlKCsrZDxlKTtmJiZ0aGlzLl91cGRhdGVDbGFzc05hbWUoKX0say50b2dnbGU9ZnVuY3Rpb24oYSxiKXthKz1cIlwiO3ZhciBjPXRoaXMuY29udGFpbnMoYSksZD1jP2IhPT0hMCYmXCJyZW1vdmVcIjpiIT09ITEmJlwiYWRkXCI7cmV0dXJuIGQmJnRoaXNbZF0oYSksYj09PSEwfHxiPT09ITE/YjohY30say50b1N0cmluZz1mdW5jdGlvbigpe3JldHVybiB0aGlzLmpvaW4oXCIgXCIpfSxlLmRlZmluZVByb3BlcnR5KXt2YXIgbT17Z2V0OmwsZW51bWVyYWJsZTohMCxjb25maWd1cmFibGU6ITB9O3RyeXtlLmRlZmluZVByb3BlcnR5KGQsYixtKX1jYXRjaChuKXtuLm51bWJlcj09PS0yMTQ2ODIzMjUyJiYobS5lbnVtZXJhYmxlPSExLGUuZGVmaW5lUHJvcGVydHkoZCxiLG0pKX19ZWxzZSBlW2NdLl9fZGVmaW5lR2V0dGVyX18mJmQuX19kZWZpbmVHZXR0ZXJfXyhiLGwpfX0od2luZG93LnNlbGYpKX0se31dLDI6W2Z1bmN0aW9uKGEsYixjKXtmdW5jdGlvbiBkKGEsYil7aWYoXCJzdHJpbmdcIiE9dHlwZW9mIGEpdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN0cmluZyBleHBlY3RlZFwiKTtifHwoYj1kb2N1bWVudCk7dmFyIGM9LzwoW1xcdzpdKykvLmV4ZWMoYSk7aWYoIWMpcmV0dXJuIGIuY3JlYXRlVGV4dE5vZGUoYSk7YT1hLnJlcGxhY2UoL15cXHMrfFxccyskL2csXCJcIik7dmFyIGQ9Y1sxXTtpZihcImJvZHlcIj09ZCl7dmFyIGU9Yi5jcmVhdGVFbGVtZW50KFwiaHRtbFwiKTtyZXR1cm4gZS5pbm5lckhUTUw9YSxlLnJlbW92ZUNoaWxkKGUubGFzdENoaWxkKX12YXIgZj1nW2RdfHxnLl9kZWZhdWx0LGg9ZlswXSxpPWZbMV0saj1mWzJdLGU9Yi5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO2ZvcihlLmlubmVySFRNTD1pK2ErajtoLS07KWU9ZS5sYXN0Q2hpbGQ7aWYoZS5maXJzdENoaWxkPT1lLmxhc3RDaGlsZClyZXR1cm4gZS5yZW1vdmVDaGlsZChlLmZpcnN0Q2hpbGQpO2Zvcih2YXIgaz1iLmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtlLmZpcnN0Q2hpbGQ7KWsuYXBwZW5kQ2hpbGQoZS5yZW1vdmVDaGlsZChlLmZpcnN0Q2hpbGQpKTtyZXR1cm4ga31iLmV4cG9ydHM9ZDt2YXIgZSxmPSExO1widW5kZWZpbmVkXCIhPXR5cGVvZiBkb2N1bWVudCYmKGU9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKSxlLmlubmVySFRNTD0nICA8bGluay8+PHRhYmxlPjwvdGFibGU+PGEgaHJlZj1cIi9hXCI+YTwvYT48aW5wdXQgdHlwZT1cImNoZWNrYm94XCIvPicsZj0hZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImxpbmtcIikubGVuZ3RoLGU9dm9pZCAwKTt2YXIgZz17bGVnZW5kOlsxLFwiPGZpZWxkc2V0PlwiLFwiPC9maWVsZHNldD5cIl0sdHI6WzIsXCI8dGFibGU+PHRib2R5PlwiLFwiPC90Ym9keT48L3RhYmxlPlwiXSxjb2w6WzIsXCI8dGFibGU+PHRib2R5PjwvdGJvZHk+PGNvbGdyb3VwPlwiLFwiPC9jb2xncm91cD48L3RhYmxlPlwiXSxfZGVmYXVsdDpmP1sxLFwiWDxkaXY+XCIsXCI8L2Rpdj5cIl06WzAsXCJcIixcIlwiXX07Zy50ZD1nLnRoPVszLFwiPHRhYmxlPjx0Ym9keT48dHI+XCIsXCI8L3RyPjwvdGJvZHk+PC90YWJsZT5cIl0sZy5vcHRpb249Zy5vcHRncm91cD1bMSwnPHNlbGVjdCBtdWx0aXBsZT1cIm11bHRpcGxlXCI+JyxcIjwvc2VsZWN0PlwiXSxnLnRoZWFkPWcudGJvZHk9Zy5jb2xncm91cD1nLmNhcHRpb249Zy50Zm9vdD1bMSxcIjx0YWJsZT5cIixcIjwvdGFibGU+XCJdLGcucG9seWxpbmU9Zy5lbGxpcHNlPWcucG9seWdvbj1nLmNpcmNsZT1nLnRleHQ9Zy5saW5lPWcucGF0aD1nLnJlY3Q9Zy5nPVsxLCc8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2ZXJzaW9uPVwiMS4xXCI+JyxcIjwvc3ZnPlwiXX0se31dLDM6W2Z1bmN0aW9uKGEsYixjKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBkKGEsYil7aWYodm9pZCAwPT09YXx8bnVsbD09PWEpdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjb252ZXJ0IGZpcnN0IGFyZ3VtZW50IHRvIG9iamVjdFwiKTtmb3IodmFyIGM9T2JqZWN0KGEpLGQ9MTtkPGFyZ3VtZW50cy5sZW5ndGg7ZCsrKXt2YXIgZT1hcmd1bWVudHNbZF07aWYodm9pZCAwIT09ZSYmbnVsbCE9PWUpZm9yKHZhciBmPU9iamVjdC5rZXlzKE9iamVjdChlKSksZz0wLGg9Zi5sZW5ndGg7ZzxoO2crKyl7dmFyIGk9ZltnXSxqPU9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoZSxpKTt2b2lkIDAhPT1qJiZqLmVudW1lcmFibGUmJihjW2ldPWVbaV0pfX1yZXR1cm4gY31mdW5jdGlvbiBlKCl7T2JqZWN0LmFzc2lnbnx8T2JqZWN0LmRlZmluZVByb3BlcnR5KE9iamVjdCxcImFzc2lnblwiLHtlbnVtZXJhYmxlOiExLGNvbmZpZ3VyYWJsZTohMCx3cml0YWJsZTohMCx2YWx1ZTpkfSl9Yi5leHBvcnRzPXthc3NpZ246ZCxwb2x5ZmlsbDplfX0se31dLDQ6W2Z1bmN0aW9uKGEsYixjKXtmdW5jdGlvbiBkKGEsYil7XCJvYmplY3RcIiE9dHlwZW9mIGI/Yj17aGFzaDohIWJ9OnZvaWQgMD09PWIuaGFzaCYmKGIuaGFzaD0hMCk7Zm9yKHZhciBjPWIuaGFzaD97fTpcIlwiLGQ9Yi5zZXJpYWxpemVyfHwoYi5oYXNoP2c6aCksZT1hJiZhLmVsZW1lbnRzP2EuZWxlbWVudHM6W10sZj1PYmplY3QuY3JlYXRlKG51bGwpLGs9MDtrPGUubGVuZ3RoOysrayl7dmFyIGw9ZVtrXTtpZigoYi5kaXNhYmxlZHx8IWwuZGlzYWJsZWQpJiZsLm5hbWUmJmoudGVzdChsLm5vZGVOYW1lKSYmIWkudGVzdChsLnR5cGUpKXt2YXIgbT1sLm5hbWUsbj1sLnZhbHVlO2lmKFwiY2hlY2tib3hcIiE9PWwudHlwZSYmXCJyYWRpb1wiIT09bC50eXBlfHxsLmNoZWNrZWR8fChuPXZvaWQgMCksYi5lbXB0eSl7aWYoXCJjaGVja2JveFwiIT09bC50eXBlfHxsLmNoZWNrZWR8fChuPVwiXCIpLFwicmFkaW9cIj09PWwudHlwZSYmKGZbbC5uYW1lXXx8bC5jaGVja2VkP2wuY2hlY2tlZCYmKGZbbC5uYW1lXT0hMCk6ZltsLm5hbWVdPSExKSwhbiYmXCJyYWRpb1wiPT1sLnR5cGUpY29udGludWV9ZWxzZSBpZighbiljb250aW51ZTtpZihcInNlbGVjdC1tdWx0aXBsZVwiIT09bC50eXBlKWM9ZChjLG0sbik7ZWxzZXtuPVtdO2Zvcih2YXIgbz1sLm9wdGlvbnMscD0hMSxxPTA7cTxvLmxlbmd0aDsrK3Epe3ZhciByPW9bcV0scz1iLmVtcHR5JiYhci52YWx1ZSx0PXIudmFsdWV8fHM7ci5zZWxlY3RlZCYmdCYmKHA9ITAsYz1iLmhhc2gmJlwiW11cIiE9PW0uc2xpY2UobS5sZW5ndGgtMik/ZChjLG0rXCJbXVwiLHIudmFsdWUpOmQoYyxtLHIudmFsdWUpKX0hcCYmYi5lbXB0eSYmKGM9ZChjLG0sXCJcIikpfX19aWYoYi5lbXB0eSlmb3IodmFyIG0gaW4gZilmW21dfHwoYz1kKGMsbSxcIlwiKSk7cmV0dXJuIGN9ZnVuY3Rpb24gZShhKXt2YXIgYj1bXSxjPS9eKFteXFxbXFxdXSopLyxkPW5ldyBSZWdFeHAoayksZT1jLmV4ZWMoYSk7Zm9yKGVbMV0mJmIucHVzaChlWzFdKTtudWxsIT09KGU9ZC5leGVjKGEpKTspYi5wdXNoKGVbMV0pO3JldHVybiBifWZ1bmN0aW9uIGYoYSxiLGMpe2lmKDA9PT1iLmxlbmd0aClyZXR1cm4gYT1jO3ZhciBkPWIuc2hpZnQoKSxlPWQubWF0Y2goL15cXFsoLis/KVxcXSQvKTtpZihcIltdXCI9PT1kKXJldHVybiBhPWF8fFtdLEFycmF5LmlzQXJyYXkoYSk/YS5wdXNoKGYobnVsbCxiLGMpKTooYS5fdmFsdWVzPWEuX3ZhbHVlc3x8W10sYS5fdmFsdWVzLnB1c2goZihudWxsLGIsYykpKSxhO2lmKGUpe3ZhciBnPWVbMV0saD0rZztpc05hTihoKT8oYT1hfHx7fSxhW2ddPWYoYVtnXSxiLGMpKTooYT1hfHxbXSxhW2hdPWYoYVtoXSxiLGMpKX1lbHNlIGFbZF09ZihhW2RdLGIsYyk7cmV0dXJuIGF9ZnVuY3Rpb24gZyhhLGIsYyl7dmFyIGQ9Yi5tYXRjaChrKTtpZihkKXt2YXIgZz1lKGIpO2YoYSxnLGMpfWVsc2V7dmFyIGg9YVtiXTtoPyhBcnJheS5pc0FycmF5KGgpfHwoYVtiXT1baF0pLGFbYl0ucHVzaChjKSk6YVtiXT1jfXJldHVybiBhfWZ1bmN0aW9uIGgoYSxiLGMpe3JldHVybiBjPWMucmVwbGFjZSgvKFxccik/XFxuL2csXCJcXHJcXG5cIiksYz1lbmNvZGVVUklDb21wb25lbnQoYyksYz1jLnJlcGxhY2UoLyUyMC9nLFwiK1wiKSxhKyhhP1wiJlwiOlwiXCIpK2VuY29kZVVSSUNvbXBvbmVudChiKStcIj1cIitjfXZhciBpPS9eKD86c3VibWl0fGJ1dHRvbnxpbWFnZXxyZXNldHxmaWxlKSQvaSxqPS9eKD86aW5wdXR8c2VsZWN0fHRleHRhcmVhfGtleWdlbikvaSxrPS8oXFxbW15cXFtcXF1dKlxcXSkvZztiLmV4cG9ydHM9ZH0se31dLDU6W2Z1bmN0aW9uKGIsYyxkKXsoZnVuY3Rpb24oZSl7IWZ1bmN0aW9uKGIpe2lmKFwib2JqZWN0XCI9PXR5cGVvZiBkJiZcInVuZGVmaW5lZFwiIT10eXBlb2YgYyljLmV4cG9ydHM9YigpO2Vsc2UgaWYoXCJmdW5jdGlvblwiPT10eXBlb2YgYSYmYS5hbWQpYShbXSxiKTtlbHNle3ZhciBmO2Y9XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIGU/ZTpcInVuZGVmaW5lZFwiIT10eXBlb2Ygc2VsZj9zZWxmOnRoaXMsZi52ZXhEaWFsb2c9YigpfX0oZnVuY3Rpb24oKXtyZXR1cm4gZnVuY3Rpb24gYShjLGQsZSl7ZnVuY3Rpb24gZihoLGkpe2lmKCFkW2hdKXtpZighY1toXSl7dmFyIGo9XCJmdW5jdGlvblwiPT10eXBlb2YgYiYmYjtpZighaSYmailyZXR1cm4gaihoLCEwKTtpZihnKXJldHVybiBnKGgsITApO3ZhciBrPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraCtcIidcIik7dGhyb3cgay5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGt9dmFyIGw9ZFtoXT17ZXhwb3J0czp7fX07Y1toXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihhKXt2YXIgYj1jW2hdWzFdW2FdO3JldHVybiBmKGI/YjphKX0sbCxsLmV4cG9ydHMsYSxjLGQsZSl9cmV0dXJuIGRbaF0uZXhwb3J0c31mb3IodmFyIGc9XCJmdW5jdGlvblwiPT10eXBlb2YgYiYmYixoPTA7aDxlLmxlbmd0aDtoKyspZihlW2hdKTtyZXR1cm4gZn0oezE6W2Z1bmN0aW9uKGEsYixjKXtmdW5jdGlvbiBkKGEsYil7aWYoXCJzdHJpbmdcIiE9dHlwZW9mIGEpdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN0cmluZyBleHBlY3RlZFwiKTtifHwoYj1kb2N1bWVudCk7dmFyIGM9LzwoW1xcdzpdKykvLmV4ZWMoYSk7aWYoIWMpcmV0dXJuIGIuY3JlYXRlVGV4dE5vZGUoYSk7YT1hLnJlcGxhY2UoL15cXHMrfFxccyskL2csXCJcIik7dmFyIGQ9Y1sxXTtpZihcImJvZHlcIj09ZCl7dmFyIGU9Yi5jcmVhdGVFbGVtZW50KFwiaHRtbFwiKTtyZXR1cm4gZS5pbm5lckhUTUw9YSxlLnJlbW92ZUNoaWxkKGUubGFzdENoaWxkKX12YXIgZj1nW2RdfHxnLl9kZWZhdWx0LGg9ZlswXSxpPWZbMV0saj1mWzJdLGU9Yi5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO2ZvcihlLmlubmVySFRNTD1pK2ErajtoLS07KWU9ZS5sYXN0Q2hpbGQ7aWYoZS5maXJzdENoaWxkPT1lLmxhc3RDaGlsZClyZXR1cm4gZS5yZW1vdmVDaGlsZChlLmZpcnN0Q2hpbGQpO2Zvcih2YXIgaz1iLmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtlLmZpcnN0Q2hpbGQ7KWsuYXBwZW5kQ2hpbGQoZS5yZW1vdmVDaGlsZChlLmZpcnN0Q2hpbGQpKTtyZXR1cm4ga31iLmV4cG9ydHM9ZDt2YXIgZSxmPSExO1widW5kZWZpbmVkXCIhPXR5cGVvZiBkb2N1bWVudCYmKGU9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKSxlLmlubmVySFRNTD0nICA8bGluay8+PHRhYmxlPjwvdGFibGU+PGEgaHJlZj1cIi9hXCI+YTwvYT48aW5wdXQgdHlwZT1cImNoZWNrYm94XCIvPicsZj0hZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImxpbmtcIikubGVuZ3RoLGU9dm9pZCAwKTt2YXIgZz17bGVnZW5kOlsxLFwiPGZpZWxkc2V0PlwiLFwiPC9maWVsZHNldD5cIl0sdHI6WzIsXCI8dGFibGU+PHRib2R5PlwiLFwiPC90Ym9keT48L3RhYmxlPlwiXSxjb2w6WzIsXCI8dGFibGU+PHRib2R5PjwvdGJvZHk+PGNvbGdyb3VwPlwiLFwiPC9jb2xncm91cD48L3RhYmxlPlwiXSxfZGVmYXVsdDpmP1sxLFwiWDxkaXY+XCIsXCI8L2Rpdj5cIl06WzAsXCJcIixcIlwiXX07Zy50ZD1nLnRoPVszLFwiPHRhYmxlPjx0Ym9keT48dHI+XCIsXCI8L3RyPjwvdGJvZHk+PC90YWJsZT5cIl0sZy5vcHRpb249Zy5vcHRncm91cD1bMSwnPHNlbGVjdCBtdWx0aXBsZT1cIm11bHRpcGxlXCI+JyxcIjwvc2VsZWN0PlwiXSxnLnRoZWFkPWcudGJvZHk9Zy5jb2xncm91cD1nLmNhcHRpb249Zy50Zm9vdD1bMSxcIjx0YWJsZT5cIixcIjwvdGFibGU+XCJdLGcucG9seWxpbmU9Zy5lbGxpcHNlPWcucG9seWdvbj1nLmNpcmNsZT1nLnRleHQ9Zy5saW5lPWcucGF0aD1nLnJlY3Q9Zy5nPVsxLCc8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2ZXJzaW9uPVwiMS4xXCI+JyxcIjwvc3ZnPlwiXX0se31dLDI6W2Z1bmN0aW9uKGEsYixjKXtmdW5jdGlvbiBkKGEsYil7XCJvYmplY3RcIiE9dHlwZW9mIGI/Yj17aGFzaDohIWJ9OnZvaWQgMD09PWIuaGFzaCYmKGIuaGFzaD0hMCk7Zm9yKHZhciBjPWIuaGFzaD97fTpcIlwiLGQ9Yi5zZXJpYWxpemVyfHwoYi5oYXNoP2c6aCksZT1hJiZhLmVsZW1lbnRzP2EuZWxlbWVudHM6W10sZj1PYmplY3QuY3JlYXRlKG51bGwpLGs9MDtrPGUubGVuZ3RoOysrayl7dmFyIGw9ZVtrXTtpZigoYi5kaXNhYmxlZHx8IWwuZGlzYWJsZWQpJiZsLm5hbWUmJmoudGVzdChsLm5vZGVOYW1lKSYmIWkudGVzdChsLnR5cGUpKXt2YXIgbT1sLm5hbWUsbj1sLnZhbHVlO2lmKFwiY2hlY2tib3hcIiE9PWwudHlwZSYmXCJyYWRpb1wiIT09bC50eXBlfHxsLmNoZWNrZWR8fChuPXZvaWQgMCksYi5lbXB0eSl7aWYoXCJjaGVja2JveFwiIT09bC50eXBlfHxsLmNoZWNrZWR8fChuPVwiXCIpLFwicmFkaW9cIj09PWwudHlwZSYmKGZbbC5uYW1lXXx8bC5jaGVja2VkP2wuY2hlY2tlZCYmKGZbbC5uYW1lXT0hMCk6ZltsLm5hbWVdPSExKSwhbiYmXCJyYWRpb1wiPT1sLnR5cGUpY29udGludWV9ZWxzZSBpZighbiljb250aW51ZTtpZihcInNlbGVjdC1tdWx0aXBsZVwiIT09bC50eXBlKWM9ZChjLG0sbik7ZWxzZXtuPVtdO2Zvcih2YXIgbz1sLm9wdGlvbnMscD0hMSxxPTA7cTxvLmxlbmd0aDsrK3Epe3ZhciByPW9bcV0scz1iLmVtcHR5JiYhci52YWx1ZSx0PXIudmFsdWV8fHM7ci5zZWxlY3RlZCYmdCYmKHA9ITAsYz1iLmhhc2gmJlwiW11cIiE9PW0uc2xpY2UobS5sZW5ndGgtMik/ZChjLG0rXCJbXVwiLHIudmFsdWUpOmQoYyxtLHIudmFsdWUpKX0hcCYmYi5lbXB0eSYmKGM9ZChjLG0sXCJcIikpfX19aWYoYi5lbXB0eSlmb3IodmFyIG0gaW4gZilmW21dfHwoYz1kKGMsbSxcIlwiKSk7cmV0dXJuIGN9ZnVuY3Rpb24gZShhKXt2YXIgYj1bXSxjPS9eKFteXFxbXFxdXSopLyxkPW5ldyBSZWdFeHAoayksZT1jLmV4ZWMoYSk7Zm9yKGVbMV0mJmIucHVzaChlWzFdKTtudWxsIT09KGU9ZC5leGVjKGEpKTspYi5wdXNoKGVbMV0pO3JldHVybiBifWZ1bmN0aW9uIGYoYSxiLGMpe2lmKDA9PT1iLmxlbmd0aClyZXR1cm4gYT1jO3ZhciBkPWIuc2hpZnQoKSxlPWQubWF0Y2goL15cXFsoLis/KVxcXSQvKTtpZihcIltdXCI9PT1kKXJldHVybiBhPWF8fFtdLEFycmF5LmlzQXJyYXkoYSk/YS5wdXNoKGYobnVsbCxiLGMpKTooYS5fdmFsdWVzPWEuX3ZhbHVlc3x8W10sYS5fdmFsdWVzLnB1c2goZihudWxsLGIsYykpKSxhO2lmKGUpe3ZhciBnPWVbMV0saD0rZztpc05hTihoKT8oYT1hfHx7fSxhW2ddPWYoYVtnXSxiLGMpKTooYT1hfHxbXSxhW2hdPWYoYVtoXSxiLGMpKX1lbHNlIGFbZF09ZihhW2RdLGIsYyk7cmV0dXJuIGF9ZnVuY3Rpb24gZyhhLGIsYyl7dmFyIGQ9Yi5tYXRjaChrKTtpZihkKXt2YXIgZz1lKGIpO2YoYSxnLGMpfWVsc2V7dmFyIGg9YVtiXTtoPyhBcnJheS5pc0FycmF5KGgpfHwoYVtiXT1baF0pLGFbYl0ucHVzaChjKSk6YVtiXT1jfXJldHVybiBhfWZ1bmN0aW9uIGgoYSxiLGMpe3JldHVybiBjPWMucmVwbGFjZSgvKFxccik/XFxuL2csXCJcXHJcXG5cIiksYz1lbmNvZGVVUklDb21wb25lbnQoYyksYz1jLnJlcGxhY2UoLyUyMC9nLFwiK1wiKSxhKyhhP1wiJlwiOlwiXCIpK2VuY29kZVVSSUNvbXBvbmVudChiKStcIj1cIitjfXZhciBpPS9eKD86c3VibWl0fGJ1dHRvbnxpbWFnZXxyZXNldHxmaWxlKSQvaSxqPS9eKD86aW5wdXR8c2VsZWN0fHRleHRhcmVhfGtleWdlbikvaSxrPS8oXFxbW15cXFtcXF1dKlxcXSkvZztiLmV4cG9ydHM9ZH0se31dLDM6W2Z1bmN0aW9uKGEsYixjKXt2YXIgZD1hKFwiZG9taWZ5XCIpLGU9YShcImZvcm0tc2VyaWFsaXplXCIpLGY9ZnVuY3Rpb24oYSl7dmFyIGI9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImZvcm1cIik7Yi5jbGFzc0xpc3QuYWRkKFwidmV4LWRpYWxvZy1mb3JtXCIpO3ZhciBjPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7Yy5jbGFzc0xpc3QuYWRkKFwidmV4LWRpYWxvZy1tZXNzYWdlXCIpLGMuYXBwZW5kQ2hpbGQoYS5tZXNzYWdlIGluc3RhbmNlb2Ygd2luZG93Lk5vZGU/YS5tZXNzYWdlOmQoYS5tZXNzYWdlKSk7dmFyIGU9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtyZXR1cm4gZS5jbGFzc0xpc3QuYWRkKFwidmV4LWRpYWxvZy1pbnB1dFwiKSxlLmFwcGVuZENoaWxkKGEuaW5wdXQgaW5zdGFuY2VvZiB3aW5kb3cuTm9kZT9hLmlucHV0OmQoYS5pbnB1dCkpLGIuYXBwZW5kQ2hpbGQoYyksYi5hcHBlbmRDaGlsZChlKSxifSxnPWZ1bmN0aW9uKGEpe3ZhciBiPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7Yi5jbGFzc0xpc3QuYWRkKFwidmV4LWRpYWxvZy1idXR0b25zXCIpO2Zvcih2YXIgYz0wO2M8YS5sZW5ndGg7YysrKXt2YXIgZD1hW2NdLGU9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtlLnR5cGU9ZC50eXBlLGUudGV4dENvbnRlbnQ9ZC50ZXh0LGUuY2xhc3NOYW1lPWQuY2xhc3NOYW1lLGUuY2xhc3NMaXN0LmFkZChcInZleC1kaWFsb2ctYnV0dG9uXCIpLDA9PT1jP2UuY2xhc3NMaXN0LmFkZChcInZleC1maXJzdFwiKTpjPT09YS5sZW5ndGgtMSYmZS5jbGFzc0xpc3QuYWRkKFwidmV4LWxhc3RcIiksZnVuY3Rpb24oYSl7ZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIixmdW5jdGlvbihiKXthLmNsaWNrJiZhLmNsaWNrLmNhbGwodGhpcyxiKX0uYmluZCh0aGlzKSl9LmJpbmQodGhpcykoZCksYi5hcHBlbmRDaGlsZChlKX1yZXR1cm4gYn0saD1mdW5jdGlvbihhKXt2YXIgYj17bmFtZTpcImRpYWxvZ1wiLG9wZW46ZnVuY3Rpb24oYil7dmFyIGM9T2JqZWN0LmFzc2lnbih7fSx0aGlzLmRlZmF1bHRPcHRpb25zLGIpO2MudW5zYWZlTWVzc2FnZSYmIWMubWVzc2FnZT9jLm1lc3NhZ2U9Yy51bnNhZmVNZXNzYWdlOmMubWVzc2FnZSYmKGMubWVzc2FnZT1hLl9lc2NhcGVIdG1sKGMubWVzc2FnZSkpO3ZhciBkPWMudW5zYWZlQ29udGVudD1mKGMpLGU9YS5vcGVuKGMpLGg9Yy5iZWZvcmVDbG9zZSYmYy5iZWZvcmVDbG9zZS5iaW5kKGUpO2lmKGUub3B0aW9ucy5iZWZvcmVDbG9zZT1mdW5jdGlvbigpe3ZhciBhPSFofHxoKCk7cmV0dXJuIGEmJmMuY2FsbGJhY2sodGhpcy52YWx1ZXx8ITEpLGF9LmJpbmQoZSksZC5hcHBlbmRDaGlsZChnLmNhbGwoZSxjLmJ1dHRvbnMpKSxlLmZvcm09ZCxkLmFkZEV2ZW50TGlzdGVuZXIoXCJzdWJtaXRcIixjLm9uU3VibWl0LmJpbmQoZSkpLGMuZm9jdXNGaXJzdElucHV0KXt2YXIgaT1lLmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKFwiYnV0dG9uLCBpbnB1dCwgc2VsZWN0LCB0ZXh0YXJlYVwiKTtpJiZpLmZvY3VzKCl9cmV0dXJuIGV9LGFsZXJ0OmZ1bmN0aW9uKGEpe3JldHVyblwic3RyaW5nXCI9PXR5cGVvZiBhJiYoYT17bWVzc2FnZTphfSksYT1PYmplY3QuYXNzaWduKHt9LHRoaXMuZGVmYXVsdE9wdGlvbnMsdGhpcy5kZWZhdWx0QWxlcnRPcHRpb25zLGEpLHRoaXMub3BlbihhKX0sY29uZmlybTpmdW5jdGlvbihhKXtpZihcIm9iamVjdFwiIT10eXBlb2YgYXx8XCJmdW5jdGlvblwiIT10eXBlb2YgYS5jYWxsYmFjayl0aHJvdyBuZXcgRXJyb3IoXCJkaWFsb2cuY29uZmlybShvcHRpb25zKSByZXF1aXJlcyBvcHRpb25zLmNhbGxiYWNrLlwiKTtyZXR1cm4gYT1PYmplY3QuYXNzaWduKHt9LHRoaXMuZGVmYXVsdE9wdGlvbnMsdGhpcy5kZWZhdWx0Q29uZmlybU9wdGlvbnMsYSksdGhpcy5vcGVuKGEpfSxwcm9tcHQ6ZnVuY3Rpb24oYil7aWYoXCJvYmplY3RcIiE9dHlwZW9mIGJ8fFwiZnVuY3Rpb25cIiE9dHlwZW9mIGIuY2FsbGJhY2spdGhyb3cgbmV3IEVycm9yKFwiZGlhbG9nLnByb21wdChvcHRpb25zKSByZXF1aXJlcyBvcHRpb25zLmNhbGxiYWNrLlwiKTt2YXIgYz1PYmplY3QuYXNzaWduKHt9LHRoaXMuZGVmYXVsdE9wdGlvbnMsdGhpcy5kZWZhdWx0UHJvbXB0T3B0aW9ucyksZD17dW5zYWZlTWVzc2FnZTonPGxhYmVsIGZvcj1cInZleFwiPicrYS5fZXNjYXBlSHRtbChiLmxhYmVsfHxjLmxhYmVsKStcIjwvbGFiZWw+XCIsaW5wdXQ6JzxpbnB1dCBuYW1lPVwidmV4XCIgdHlwZT1cInRleHRcIiBjbGFzcz1cInZleC1kaWFsb2ctcHJvbXB0LWlucHV0XCIgcGxhY2Vob2xkZXI9XCInK2EuX2VzY2FwZUh0bWwoYi5wbGFjZWhvbGRlcnx8Yy5wbGFjZWhvbGRlcikrJ1wiIHZhbHVlPVwiJythLl9lc2NhcGVIdG1sKGIudmFsdWV8fGMudmFsdWUpKydcIiAvPid9O2I9T2JqZWN0LmFzc2lnbihjLGQsYik7dmFyIGU9Yi5jYWxsYmFjaztyZXR1cm4gYi5jYWxsYmFjaz1mdW5jdGlvbihhKXtpZihcIm9iamVjdFwiPT10eXBlb2YgYSl7dmFyIGI9T2JqZWN0LmtleXMoYSk7YT1iLmxlbmd0aD9hW2JbMF1dOlwiXCJ9ZShhKX0sdGhpcy5vcGVuKGIpfX07cmV0dXJuIGIuYnV0dG9ucz17WUVTOnt0ZXh0OlwiT0tcIix0eXBlOlwic3VibWl0XCIsY2xhc3NOYW1lOlwidmV4LWRpYWxvZy1idXR0b24tcHJpbWFyeVwiLGNsaWNrOmZ1bmN0aW9uKCl7dGhpcy52YWx1ZT0hMH19LE5POnt0ZXh0OlwiQ2FuY2VsXCIsdHlwZTpcImJ1dHRvblwiLGNsYXNzTmFtZTpcInZleC1kaWFsb2ctYnV0dG9uLXNlY29uZGFyeVwiLGNsaWNrOmZ1bmN0aW9uKCl7dGhpcy52YWx1ZT0hMSx0aGlzLmNsb3NlKCl9fX0sYi5kZWZhdWx0T3B0aW9ucz17Y2FsbGJhY2s6ZnVuY3Rpb24oKXt9LGFmdGVyT3BlbjpmdW5jdGlvbigpe30sbWVzc2FnZTpcIlwiLGlucHV0OlwiXCIsYnV0dG9uczpbYi5idXR0b25zLllFUyxiLmJ1dHRvbnMuTk9dLHNob3dDbG9zZUJ1dHRvbjohMSxvblN1Ym1pdDpmdW5jdGlvbihhKXtyZXR1cm4gYS5wcmV2ZW50RGVmYXVsdCgpLHRoaXMub3B0aW9ucy5pbnB1dCYmKHRoaXMudmFsdWU9ZSh0aGlzLmZvcm0se2hhc2g6ITB9KSksdGhpcy5jbG9zZSgpfSxmb2N1c0ZpcnN0SW5wdXQ6ITB9LGIuZGVmYXVsdEFsZXJ0T3B0aW9ucz17YnV0dG9uczpbYi5idXR0b25zLllFU119LGIuZGVmYXVsdFByb21wdE9wdGlvbnM9e2xhYmVsOlwiUHJvbXB0OlwiLHBsYWNlaG9sZGVyOlwiXCIsdmFsdWU6XCJcIn0sYi5kZWZhdWx0Q29uZmlybU9wdGlvbnM9e30sYn07Yi5leHBvcnRzPWh9LHtkb21pZnk6MSxcImZvcm0tc2VyaWFsaXplXCI6Mn1dfSx7fSxbM10pKDMpfSl9KS5jYWxsKHRoaXMsXCJ1bmRlZmluZWRcIiE9dHlwZW9mIGdsb2JhbD9nbG9iYWw6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHNlbGY/c2VsZjpcInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93P3dpbmRvdzp7fSl9LHtkb21pZnk6MixcImZvcm0tc2VyaWFsaXplXCI6NH1dLDY6W2Z1bmN0aW9uKGEsYixjKXt2YXIgZD1hKFwiLi92ZXhcIik7ZC5yZWdpc3RlclBsdWdpbihhKFwidmV4LWRpYWxvZ1wiKSksYi5leHBvcnRzPWR9LHtcIi4vdmV4XCI6NyxcInZleC1kaWFsb2dcIjo1fV0sNzpbZnVuY3Rpb24oYSxiLGMpe2EoXCJjbGFzc2xpc3QtcG9seWZpbGxcIiksYShcImVzNi1vYmplY3QtYXNzaWduXCIpLnBvbHlmaWxsKCk7dmFyIGQ9YShcImRvbWlmeVwiKSxlPWZ1bmN0aW9uKGEpe2lmKFwidW5kZWZpbmVkXCIhPXR5cGVvZiBhKXt2YXIgYj1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO3JldHVybiBiLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGEpKSxiLmlubmVySFRNTH1yZXR1cm5cIlwifSxmPWZ1bmN0aW9uKGEsYil7aWYoXCJzdHJpbmdcIj09dHlwZW9mIGImJjAhPT1iLmxlbmd0aClmb3IodmFyIGM9Yi5zcGxpdChcIiBcIiksZD0wO2Q8Yy5sZW5ndGg7ZCsrKXt2YXIgZT1jW2RdO2UubGVuZ3RoJiZhLmNsYXNzTGlzdC5hZGQoZSl9fSxnPWZ1bmN0aW9uKCl7dmFyIGE9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKSxiPXtXZWJraXRBbmltYXRpb246XCJ3ZWJraXRBbmltYXRpb25FbmRcIixNb3pBbmltYXRpb246XCJhbmltYXRpb25lbmRcIixPQW5pbWF0aW9uOlwib2FuaW1hdGlvbmVuZFwiLG1zQW5pbWF0aW9uOlwiTVNBbmltYXRpb25FbmRcIixhbmltYXRpb246XCJhbmltYXRpb25lbmRcIn07Zm9yKHZhciBjIGluIGIpaWYodm9pZCAwIT09YS5zdHlsZVtjXSlyZXR1cm4gYltjXTtyZXR1cm4hMX0oKSxoPXt2ZXg6XCJ2ZXhcIixjb250ZW50OlwidmV4LWNvbnRlbnRcIixvdmVybGF5OlwidmV4LW92ZXJsYXlcIixjbG9zZTpcInZleC1jbG9zZVwiLGNsb3Npbmc6XCJ2ZXgtY2xvc2luZ1wiLG9wZW46XCJ2ZXgtb3BlblwifSxpPXt9LGo9MSxrPSExLGw9e29wZW46ZnVuY3Rpb24oYSl7dmFyIGI9ZnVuY3Rpb24oYSl7Y29uc29sZS53YXJuKCdUaGUgXCInK2ErJ1wiIHByb3BlcnR5IGlzIGRlcHJlY2F0ZWQgaW4gdmV4IDMuIFVzZSBDU1MgY2xhc3NlcyBhbmQgdGhlIGFwcHJvcHJpYXRlIFwiQ2xhc3NOYW1lXCIgb3B0aW9ucywgaW5zdGVhZC4nKSxjb25zb2xlLndhcm4oXCJTZWUgaHR0cDovL2dpdGh1Yi5odWJzcG90LmNvbS92ZXgvYXBpL2FkdmFuY2VkLyNvcHRpb25zXCIpfTthLmNzcyYmYihcImNzc1wiKSxhLm92ZXJsYXlDU1MmJmIoXCJvdmVybGF5Q1NTXCIpLGEuY29udGVudENTUyYmYihcImNvbnRlbnRDU1NcIiksYS5jbG9zZUNTUyYmYihcImNsb3NlQ1NTXCIpO3ZhciBjPXt9O2MuaWQ9aisrLGlbYy5pZF09YyxjLmlzT3Blbj0hMCxjLmNsb3NlPWZ1bmN0aW9uKCl7ZnVuY3Rpb24gYShhKXtyZXR1cm5cIm5vbmVcIiE9PWQuZ2V0UHJvcGVydHlWYWx1ZShhK1wiYW5pbWF0aW9uLW5hbWVcIikmJlwiMHNcIiE9PWQuZ2V0UHJvcGVydHlWYWx1ZShhK1wiYW5pbWF0aW9uLWR1cmF0aW9uXCIpfWlmKCF0aGlzLmlzT3BlbilyZXR1cm4hMDt2YXIgYj10aGlzLm9wdGlvbnM7aWYoayYmIWIuZXNjYXBlQnV0dG9uQ2xvc2VzKXJldHVybiExO3ZhciBjPWZ1bmN0aW9uKCl7cmV0dXJuIWIuYmVmb3JlQ2xvc2V8fGIuYmVmb3JlQ2xvc2UuY2FsbCh0aGlzKX0uYmluZCh0aGlzKSgpO2lmKGM9PT0hMSlyZXR1cm4hMTt0aGlzLmlzT3Blbj0hMTt2YXIgZD13aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLmNvbnRlbnRFbCksZT1hKFwiXCIpfHxhKFwiLXdlYmtpdC1cIil8fGEoXCItbW96LVwiKXx8YShcIi1vLVwiKSxmPWZ1bmN0aW9uIGooKXt0aGlzLnJvb3RFbC5wYXJlbnROb2RlJiYodGhpcy5yb290RWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihnLGopLGRlbGV0ZSBpW3RoaXMuaWRdLHRoaXMucm9vdEVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5yb290RWwpLGIuYWZ0ZXJDbG9zZSYmYi5hZnRlckNsb3NlLmNhbGwodGhpcyksMD09PU9iamVjdC5rZXlzKGkpLmxlbmd0aCYmZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKGgub3BlbikpfS5iaW5kKHRoaXMpO3JldHVybiBnJiZlPyh0aGlzLnJvb3RFbC5hZGRFdmVudExpc3RlbmVyKGcsZiksdGhpcy5yb290RWwuY2xhc3NMaXN0LmFkZChoLmNsb3NpbmcpKTpmKCksITB9LFwic3RyaW5nXCI9PXR5cGVvZiBhJiYoYT17Y29udGVudDphfSksYS51bnNhZmVDb250ZW50JiYhYS5jb250ZW50P2EuY29udGVudD1hLnVuc2FmZUNvbnRlbnQ6YS5jb250ZW50JiYoYS5jb250ZW50PWUoYS5jb250ZW50KSk7dmFyIG09Yy5vcHRpb25zPU9iamVjdC5hc3NpZ24oe30sbC5kZWZhdWx0T3B0aW9ucyxhKSxuPWMucm9vdEVsPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7bi5jbGFzc0xpc3QuYWRkKGgudmV4KSxmKG4sbS5jbGFzc05hbWUpO3ZhciBvPWMub3ZlcmxheUVsPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7by5jbGFzc0xpc3QuYWRkKGgub3ZlcmxheSksZihvLG0ub3ZlcmxheUNsYXNzTmFtZSksbS5vdmVybGF5Q2xvc2VzT25DbGljayYmby5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIixmdW5jdGlvbihhKXthLnRhcmdldD09PW8mJmMuY2xvc2UoKX0pLG4uYXBwZW5kQ2hpbGQobyk7dmFyIHA9Yy5jb250ZW50RWw9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtpZihwLmNsYXNzTGlzdC5hZGQoaC5jb250ZW50KSxmKHAsbS5jb250ZW50Q2xhc3NOYW1lKSxwLmFwcGVuZENoaWxkKG0uY29udGVudCBpbnN0YW5jZW9mIHdpbmRvdy5Ob2RlP20uY29udGVudDpkKG0uY29udGVudCkpLG4uYXBwZW5kQ2hpbGQocCksbS5zaG93Q2xvc2VCdXR0b24pe3ZhciBxPWMuY2xvc2VFbD1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO3EuY2xhc3NMaXN0LmFkZChoLmNsb3NlKSxmKHEsbS5jbG9zZUNsYXNzTmFtZSkscS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIixjLmNsb3NlLmJpbmQoYykpLHAuYXBwZW5kQ2hpbGQocSl9cmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IobS5hcHBlbmRMb2NhdGlvbikuYXBwZW5kQ2hpbGQobiksbS5hZnRlck9wZW4mJm0uYWZ0ZXJPcGVuLmNhbGwoYyksZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKGgub3BlbiksY30sY2xvc2U6ZnVuY3Rpb24oYSl7dmFyIGI7aWYoYS5pZCliPWEuaWQ7ZWxzZXtpZihcInN0cmluZ1wiIT10eXBlb2YgYSl0aHJvdyBuZXcgVHlwZUVycm9yKFwiY2xvc2UgcmVxdWlyZXMgYSB2ZXggb2JqZWN0IG9yIGlkIHN0cmluZ1wiKTtiPWF9cmV0dXJuISFpW2JdJiZpW2JdLmNsb3NlKCl9LGNsb3NlVG9wOmZ1bmN0aW9uKCl7dmFyIGE9T2JqZWN0LmtleXMoaSk7cmV0dXJuISFhLmxlbmd0aCYmaVthW2EubGVuZ3RoLTFdXS5jbG9zZSgpfSxjbG9zZUFsbDpmdW5jdGlvbigpe2Zvcih2YXIgYSBpbiBpKXRoaXMuY2xvc2UoYSk7cmV0dXJuITB9LGdldEFsbDpmdW5jdGlvbigpe3JldHVybiBpfSxnZXRCeUlkOmZ1bmN0aW9uKGEpe3JldHVybiBpW2FdfX07d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLGZ1bmN0aW9uKGEpezI3PT09YS5rZXlDb2RlJiYoaz0hMCxsLmNsb3NlVG9wKCksaz0hMSl9KSx3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInBvcHN0YXRlXCIsZnVuY3Rpb24oKXtsLmRlZmF1bHRPcHRpb25zLmNsb3NlQWxsT25Qb3BTdGF0ZSYmbC5jbG9zZUFsbCgpfSksbC5kZWZhdWx0T3B0aW9ucz17Y29udGVudDpcIlwiLHNob3dDbG9zZUJ1dHRvbjohMCxlc2NhcGVCdXR0b25DbG9zZXM6ITAsb3ZlcmxheUNsb3Nlc09uQ2xpY2s6ITAsYXBwZW5kTG9jYXRpb246XCJib2R5XCIsY2xhc3NOYW1lOlwiXCIsb3ZlcmxheUNsYXNzTmFtZTpcIlwiLGNvbnRlbnRDbGFzc05hbWU6XCJcIixjbG9zZUNsYXNzTmFtZTpcIlwiLGNsb3NlQWxsT25Qb3BTdGF0ZTohMH0sT2JqZWN0LmRlZmluZVByb3BlcnR5KGwsXCJfZXNjYXBlSHRtbFwiLHtjb25maWd1cmFibGU6ITEsZW51bWVyYWJsZTohMSx3cml0YWJsZTohMSx2YWx1ZTplfSksbC5yZWdpc3RlclBsdWdpbj1mdW5jdGlvbihhLGIpe3ZhciBjPWEobCksZD1ifHxjLm5hbWU7aWYobFtkXSl0aHJvdyBuZXcgRXJyb3IoXCJQbHVnaW4gXCIrYitcIiBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQuXCIpO2xbZF09Y30sYi5leHBvcnRzPWx9LHtcImNsYXNzbGlzdC1wb2x5ZmlsbFwiOjEsZG9taWZ5OjIsXCJlczYtb2JqZWN0LWFzc2lnblwiOjN9XX0se30sWzZdKSg2KX0pO1xuIl19
