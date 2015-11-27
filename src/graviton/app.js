/**
 * graviton/app -- The interactive graviton application
 */
import random from '../util/random';
import gtSim from './sim';
import gtGfx from './gfx';
import gtEvents, { KEYCODES, EVENTCODES } from './events';
import gtTimer from './timer';

export default function(args) {
    let self = {
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
            this.events.qget().forEach(function(event) {
                let retval;

                switch (event.type) {
                    case EVENTCODES.MOUSEDOWN:
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

                    case EVENTCODES.MOUSEUP:
                        if (this.interaction.started) {
                            this.interaction.started = false;

                            let body = this.interaction.body;

                            body.velX = (event.position.x - body.x) * 0.0000001;
                            body.velY = (event.position.y - body.y) * 0.0000001;
                        }
                        break;

                    case EVENTCODES.MOUSEMOVE:
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

                    case EVENTCODES.MOUSEWHEEL:
                        break; // end MOUSEWHEEL

                    case EVENTCODES.KEYDOWN:
                        switch (event.keycode) {
                            case KEYCODES.K_ENTER:
                                // Start or stop simulation
                                this.toggle();
                                break;

                            case KEYCODES.K_C:
                                // Clear simulation
                                this.sim.clear();
                                this.gfx.clear();
                                this.timer.stop();
                                retval = false;
                                break;

                            case KEYCODES.K_P:
                                // Toggle trails
                                this.gfx.noclear = !this.gfx.noclear;
                                break;

                            case KEYCODES.K_R:
                                // Generate random objects
                                this.generateBodies(10, {randomColors: true});
                                break;

                            case KEYCODES.K_T:
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
            this.timer = args.timer = new gtTimer(args);
            this.events = args.events = new gtEvents(args);
            this.sim = new gtSim(args);
            this.gfx = new gtGfx(args);
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
            this.grid.style.backgroundColor = style.backgroundColor || '#000000';

            if (target) {
                target.appendChild(this.grid);
            } else {
                document.body.appendChild(this.grid);
            }
        },

        generateBodies: function(num, args) {
            args = args || {};

            let minX = args.minX || 0;
            let maxX = args.maxX || this.options.width;
            let minY = args.minY || 0;
            let maxY = args.maxY || this.options.height;

            let minVelX = args.minVelX || 0;
            let maxVelX = args.maxVelX || 0.00001;
            let minVelY = args.minVelY || 0;
            let maxVelY = args.maxVelY || 0.00001;

            let minMass = args.minMass || 1;
            let maxMass = args.maxMass || 150;

            let minRadius = args.minRadius || 1;
            let maxRadius = args.maxRadius || 15;

            let color = args.color;

            for (let i = 0; i < num; i++) {
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
    self.options.width = args.width || window.innerWidth;
    self.options.height = args.height || window.innerHeight;
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
} // end graviton/app
