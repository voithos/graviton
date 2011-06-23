// makeClass -- Generates the function constructor
// for a class which checks for instantiation whenever
// it is invoked, even if done without 'new'
function makeClass() {
	return function() {
		if (this instanceof arguments.callee) {
			if (typeof this.init === 'function') {
				this.init.apply(this, arguments);
			}
		} else {
			return new arguments.callee(arguments);
		}
	}
}

// bind -- Allows a specific object to be carried 
// with a function reference as the execution context 
Function.prototype.bind = function(obj) {
	var method = this;
	return function() {
		return method.apply(obj, arguments);
	};
};

// remove -- Removes a given element from an array
Array.prototype.remove = function(start, count) {
	return this.splice(start, count ? count : 1);
};

function random(from, to) {
	return Math.random() * (to - from + 1) + from;
}

function randomDirectional(from, to) {
	var rand = random(from, to);
	if (Math.floor(Math.random() * 2) == 1) {
		rand = -rand;
	}
	
	return rand;
}

function randomColor() {
	return '#' + ('00000' + (Math.random() * 0x1000000 << 0).toString(16)).substr(-6);
}

var nBodyApplication = makeClass();
nBodyApplication.prototype = {
	// Member variables
	//-----------------
	
	options: undefined,
	
	sim: undefined,
	
	grid: undefined,
	
	// Member functions
	//-----------------
	
	init: function(args) {
		if (!args) {
			args = {};
		}
		
		this.options = {};
		
		this.options.width = args.width || document.body.clientWidth - 50;
		this.options.height = args.height || document.body.clientHeight - 50;
		this.options.backgroundColor = args.backgroundColor || '#1F263B';
		
		this._generateGrid(this.options.width, this.options.height, this.options.backgroundColor);
		
		// Update grid argument
		args.grid = this.grid;
		
		// Create simulation
		this.sim = new nBodySimulation(args);
		
		this._wireupEvents();
	},
	
	// Private functions
	//------------------
	
	_generateGrid: function(width, height, backgroundColor) {
		// Attach a canvas to the page, to house the simulations
		this.grid = document.createElement('canvas');
				
		this.grid.width = width;
		this.grid.height = height;
		this.grid.style.display = 'block';
		this.grid.style.marginLeft = 'auto';
		this.grid.style.marginRight = 'auto';
		this.grid.style.borderStyle = 'solid';
		this.grid.style.borderWidth = 'medium';
		this.grid.style.borderColor = '#CCCCCC';
		this.grid.style.backgroundColor = backgroundColor;
		
		document.body.appendChild(this.grid);
	},
	
	_generateBodies: function(num, args) {
		if (!args)
			args = {};
		
		var minX = args.minX || 0;
		var maxX = args.maxX || this.options.width;
		var minY = args.minY || 0;
		var maxY = args.maxY || this.options.height;
		
		var minVelX = args.minVelX || 0;
		var maxVelX = args.maxVelX || -1;
		var minVelY = args.minVelY || 0;
		var maxVelY = args.maxVelY || -1;
		
		var minMass = args.minMass || 1;
		var maxMass = args.maxMass || 150;
		
		var minRadius = args.minRadius || 1;
		var maxRadius = args.maxRadius || 15;
		
		var color = args.color;
		
		for (var i = 0; i < num; i++) {
			if (args.randomColors === true) {
				color = randomColor();
			}
		
			this.sim.addNewBody(
				random(minX, maxX),
				random(minY, maxY),
				randomDirectional(minVelX, maxVelX),
				randomDirectional(minVelY, maxVelY),
				random(minMass, maxMass),
				random(minRadius, maxRadius),
				color);
		}
	},
	
	_wireupEvents: function() {
		this.grid.addEventListener('click', this._handleClick.bind(this), false);
		document.addEventListener('keydown', this._handleKeyDown.bind(this), false);
	},
	
	_handleClick: function(event) {
		this.sim.addNewBody(event.clientX - this.grid.offsetLeft, event.clientY - this.grid.offsetTop);
	},
	
	_handleKeyDown: function(event) {
		if (event.which == 13) {
			this.sim.start();
		}
		
		if (event.which == 27) {
			this.sim.stop();
		}
	}
};

var nBodySimulation = makeClass();
nBodySimulation.prototype = {
	// Member variables
	//-----------------
	
	running: false,
	
	intervalId: 0,
	
	time: 0,
	
	options: undefined,
	
	bodies: undefined,
	
	graphics: undefined,
	
	// Member functions
	//-----------------
	
	init: function(args) {
		if (!args)
			args = {};
		
		this.options = {};
		this.bodies = [];
		
		this.options.G = args.G || 6.67384 * Math.pow(10, -11); // Gravitational constant
		this.options.deltaT = args.deltaT || 15000; // Timestep
		this.options.interval = args.interval || 10; // Computation interval
		this.options.collisions = args.collision || true;
		this.options.scatterLimit = args.scatterLimit || 10000;
		
		this.graphics = new nBodyGraphics(args); // Pass on the arguments to the graphics object
	},
	
	addNewBody: function(xPos, yPos, xVel, yVel, m, rad, col) {
		var newIndex = this.bodies.push(new gBody({ x: xPos, y: yPos, velX: xVel, velY: yVel, mass: m, radius: rad, color: col }));
		this.graphics.draw(this.bodies);
		
		return this.bodies[newIndex];
	},
	
	removeBody: function(index) {
		this.bodies.remove(index);
	},
	
	start: function() {
		if (this.running === false) {
			this.running = true;
			this.intervalId = setInterval(this._run.bind(this), this.options.interval);
		}
	},
	
	stop: function() {
		if (this.running === true) {
			this.running = false;
		}
	},
	
	setG: function(G) {
		if (typeof(G) === 'number') {
			this.options.G = G;
		} else {
			throw 'setG: Argument was not a number.';
		}
	},
	
	setDeltaT: function(deltaT) {
		if (typeof(deltaT) === 'number') {
			this.options.deltaT = deltaT;
		} else {
			throw 'setDeltaT: Argument was not a number.';
		}
	},
	
	setCompInterval: function(interval) {
		if (typeof(interval) === 'number') {
			this.options.interval = interval;
		} else {
			throw 'setCompInterval: Argument was not a number.';
		}
	},
	
	setCollisions: function(state) {
		if (typeof(state) === 'boolean') {
			this.options.collisions = state;
		} else {
			throw 'setCollisions: Argument was not boolean.';
		}
	},
	
	setScatterLimit: function(limit) {
		if (typeof(limit) === 'number') {
			this.options.scatterLimit = limit;
		} else {
			throw 'setScatterLimit: Argument was not a number.';
		}
	},
	
	// Private functions
	//------------------
	
	_run: function() {		
		for (var i = 0; i < this.bodies.length; i++) {
			if (this.options.collisions === true) {
				this._detectCollision(this.bodies[i], i);
			}
			
			this._calculateNewPosition(this.bodies[i], i, this.options.deltaT);
			
			this._removeScattered(this.bodies[i], i);
		}
		
		this.time += this.options.deltaT; // Increment runtime
		this.graphics.draw(this.bodies);
		
		// Check if running flag has been lowered
		if (this.running === false) {
			clearInterval(this.intervalId);
		}
	},
	
	_calculateNewPosition: function(body, index, deltaT) {
		var netFx = 0;
		var netFy = 0;
		
		// Iterate through all bodies and sum the forces exerted
		for (var i = 0; i < this.bodies.length; i++) {
			if (i !== index) {
				var attractor = this.bodies[i];
				
				// Get the distance and position deltas
				var D = this._calculateDistance(body, attractor, true);
				
				// Calculate force using Newtonian gravity, separate out into x and y components
				var F = (this.options.G * body.mass * attractor.mass) / Math.pow(D.r, 2);
				var Fx = F * (D.dx / D.r);
				var Fy = F * (D.dy / D.r);
				
				netFx += Fx;
				netFy += Fy;
			}
		}
		
		// Calculate accelerations
		var ax = netFx / body.mass;
		var ay = netFy / body.mass;
		
		// Calculate new velocities
		body.velX += deltaT * ax;
		body.velY += deltaT * ay;
		
		// Calculate new positions after timestep deltaT
		body.x += deltaT * body.velX;
		body.y += deltaT * body.velY;
	},
	
	_calculateDistance: function(body, other, full) {
		var D = {};
		
		// Calculate the delta in positions
		D.dx = other.x - body.x;
		D.dy = other.y - body.y;
		
		// Obtain the distance between the objects (hypotenuse)
		D.r = Math.sqrt(Math.pow(D.dx, 2) + Math.pow(D.dy, 2));
		
		if (full === true) {
			return D;
		} else {
			return D.r;
		}
	},
	
	_detectCollision: function(body, index) {
		for (var i = 0; i < this.bodies.length; i++) {
			if (i !== index) {
				var collider = this.bodies[i];
			
				var r = this._calculateDistance(body, collider);
				var clearance = body.radius + collider.radius;
				
				if (r <= clearance) {
					// Collision detected
					
				}
			}
		}
	},
	
	_removeScattered: function(body, index) {
		if (body.x > this.options.scatterLimit ||
			body.x < -this.options.scatterLimit ||
			body.y > this.options.scatterLimit ||
			body.y < -this.options.scatterLimit) {
			// Remove from body collection
			return this.bodies.remove(index);
		}
	}
};

var nBodyData = makeClass();
nBodyData.prototype = {
	ref: undefined,
	
	init: function(args) {
		if (!args)
			args = {};
		
		this.ref = args.sim;
	}
};

var nBodyGraphics = makeClass();
nBodyGraphics.prototype = {
	// Member variables
	//-----------------
	
	options: undefined,
	
	grid: undefined,
	
	// Member functions
	//-----------------
	
	init: function(args) {
		if (!args)
			args = {};

		this.options = {};
		
		this.grid = typeof(args.grid) === 'string' ? document.getElementById(args.grid) : args.grid;
		if (typeof(this.grid) === 'undefined') {
			throw 'No usable canvas element was found.';
		}
	},
	
	draw: function(bodies) {
		this.grid.width = this.grid.width;
		
		var ctx = this.grid.getContext('2d');
		
		for (var i = 0; i < bodies.length; i++) {
			var body = bodies[i];
			
			ctx.fillStyle = body.color;
			
			ctx.beginPath();
			ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2, true);
			
			ctx.fill();
		}
	}
};

var gBody = makeClass();
gBody.prototype = {
	// Member variables
	//-----------------
	
	x: 0,
	y: 0,
	
	velX: 0,
	velY: 0,
	
	mass: 0,
	radius: 0,
	color: '',
	
	// Member functions
	//-----------------
	
	init: function(args) {
		if (!args)
			args = {};
		
		this.x = args.x;
		this.y = args.y;
		if (typeof(this.x) !== 'number' || typeof(this.y) !== 'number') {
			throw 'Correct positions were not given for the body.';
		}
		
		this.velX = args.velX || 0;
		this.velY = args.velY || 0;
		this.mass = args.mass || 10;
		this.radius = args.radius || 4;
		
		this.color = args.color || '#FFFFFF';
	},
	
	setColor: function(color) {
		if (typeof(color) === 'string') {
			this.color = color;
		} else {
			throw 'setColor: Argument was not a string.';
		}
	},
	
	setRadius: function(radius) {
		if (typeof(radius) === 'number') {
			this.radius = radius;
		} else {
			throw 'setRadius: Argument was not a number.';
		}
	}
};