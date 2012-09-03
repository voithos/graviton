/**
 * gtApplication -- The interactive graviton application
 */
define(['lambda', 'random', 'gtSimulation', 'gtGraphics', 'gtBody', 'gtEvents', 'gtTimer'],
    function(L, random, gtSimulation, gtGraphics, gtBody, gtEvents, gtTimer) {
        'use strict';

        return function(args) {
            var self = {
                // Attributes
                //-----------------

                version: '@VERSION',
                options: {},
                grid: null,

                events: null,
                timer: null,

                sim: null,
                gfx: null,

                interaction: {},

                // Functions
                //------------------

                /**
                 * main -- Main 'game' loop
                 */
                main: function() {
                    // Event processing
                    //--------------------
                    var eventcodes = this.events.eventcodes;

                    L.foreach(this.events.qget(), function(event) {
                        var retval;

                        switch (event.type) {
                            case eventcodes.MOUSEDOWN:
                                // Add flag to signal other events
                                this.interaction.started = true;

                                this.interaction.body = this.sim.addNewBody({
                                    x: event.position.x,
                                    y: event.position.y
                                });

                                this.interaction.previous = {
                                    x: event.position.x,
                                    y: event.position.y
                                };
                                break; // end MOUSEDOWN

                            case eventcodes.MOUSEUP:
                                if (this.interaction.started) {
                                    this.interaction.started = false;

                                    var body = this.interaction.body;

                                    body.velX = (event.position.x - body.x) * 0.0000001;
                                    body.velY = (event.position.y - body.y) * 0.0000001;
                                }
                                break;

                            case eventcodes.MOUSEMOVE:
                                if (this.interaction.started) {
                                    this.redrawVector({
                                        from: {
                                            x: this.interaction.body.x,
                                            y: this.interaction.body.y
                                        },
                                        to: {
                                            x: event.position.x,
                                            y: event.position.y
                                        }
                                    });
                                }
                                break; // end MOUSEMOVE

                            case eventcodes.MOUSEWHEEL:
                                break; // end MOUSEWHEEL

                            case eventcodes.KEYDOWN:
                                var keycodes = this.events.keycodes;

                                switch (event.keycode) {
                                    case keycodes.K_ENTER:
                                        // Start or stop simulation
                                        this.toggle();
                                        break;

                                    case keycodes.K_C:
                                        // Clear simulation
                                        this.sim.clear();
                                        this.gfx.clear();
                                        this.timer.stop();
                                        retval = false;
                                        break;

                                    case keycodes.K_P:
                                        // Toggle trails
                                        this.gfx.noclear = !this.gfx.noclear;
                                        break;

                                    case keycodes.K_R:
                                        // Generate random objects
                                        this.generateBodies(10, {randomColors: true});
                                        break;

                                    case keycodes.K_T:
                                        this.sim.addNewBody({x: this.options.width / 2, y: this.options.height / 2, velX: 0, velY: 0, mass: 2000, radius: 50, color: '#5A5A5A'});
                                        this.sim.addNewBody({x: this.options.width - 400, y: this.options.height / 2, velX: 0, velY: 0.000025, mass: 1, radius: 5, color: '#787878'});
                                        break;
                                }
                                break; // end KEYDOWN
                        }

                        return retval;
                    }, this);

                    // Redraw screen
                    this.redraw();
                },

                initComponents: function() {
                    // Create components -- order is important
                    this.timer = args.timer = gtTimer(args);
                    this.events = args.events = gtEvents(args);
                    this.sim = gtSimulation(args);
                    this.gfx = gtGraphics(args);
                },

                initTimers: function() {
                    // Add `main` loop, and start immediately
                    this.timer.addCallback(this.main, this, 30, {autostart: true, nostop: true});
                    this.timer.addCallback(this.sim.step, this.sim, 30);
                },

                start: function() {
                    this.timer.start();
                },

                stop: function() {
                    this.timer.stop();
                },

                toggle: function() {
                    this.timer.toggle();
                },

                redraw: function() {
                    this.gfx.clear();
                    this.gfx.drawBodies(this.sim.bodies);
                },

                generateGrid: function(width, height, style, target) {
                    // Attach a canvas to the page, to house the simulations
                    if (!style) {
                        style = {};
                    }

                    this.grid = document.createElement('canvas');

                    this.grid.width = width;
                    this.grid.height = height;
                    this.grid.style.display = 'block';
                    this.grid.style.marginLeft = style.marginLeft || 'auto';
                    this.grid.style.marginRight = style.marginRight || 'auto';
                    this.grid.style.borderStyle = style.borderStyle || 'solid';
                    this.grid.style.borderWidth = style.borderWidth || 'medium';
                    this.grid.style.borderColor = style.borderColor || '#CCCCCC';
                    this.grid.style.borderRadius = style.borderRadius || '15px';
                    this.grid.style.backgroundColor = style.backgroundColor || '#000000';

                    if (target) {
                        target.appendChild(this.grid);
                    } else {
                        document.body.appendChild(this.grid);
                    }
                },

                generateBodies: function(num, args) {
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
                            color = random.color();
                        }

                        this.sim.addNewBody({
                            x: random.number(minX, maxX),
                            y: random.number(minY, maxY),
                            velX: random.directional(minVelX, maxVelX),
                            velY: random.directional(minVelY, maxVelY),
                            mass: random.number(minMass, maxMass),
                            radius: random.number(minRadius, maxRadius),
                            color: color
                        });
                    }
                },

                redrawVector: function(args) {
                    // Erase old vector, and draw new one
                    this.eraseVector(args);
                    this.drawVector(args);

                    // Redraw body
                    this.gfx.drawBody(this.interaction.body);

                    // Save previous location
                    this.interaction.previous = args.to;
                },

                eraseVector: function(args) {
                    this.gfx.drawLine({
                        strokeStyle: this.options.backgroundColor,
                        from: args.from,
                        to: this.interaction.previous
                    });
                },

                drawVector: function(args) {
                    this.gfx.drawLine({
                        from: args.from,
                        to: args.to
                    });
                }
            };

            args = args || {};

            // Process arguments
            //------------------
            self.options.width = args.width || L.width(document) * 0.95;
            self.options.height = args.height || L.height(document) * 0.95;
            self.options.backgroundColor = args.backgroundColor || '#1F263B';

            // Retrieve canvas, or build one with arguments
            self.grid = typeof args.grid === 'string' ? document.getElementById(args.grid) : args.grid;

            if (typeof self.grid === 'undefined') {
                self.generateGrid(self.options.width, self.options.height, {backgroundColor: self.options.backgroundColor});

                // Update grid argument
                args.grid = self.grid;
            }

            // Initialize
            self.initComponents();
            self.initTimers();

            return self;
        }; // end gtApplication
    }
);
