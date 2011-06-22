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


var nBodyApplication = makeClass();
nBodyApplication.prototype = {
	init: function() {
		// Attach a canvas to the page, to house the simulations
		this.grid = document.createElement('canvas');
				
		this.grid.width = window.innerWidth - 50;
		this.grid.height = window.innerHeight - 50;
		this.grid.style.display = 'block';
		this.grid.style.marginLeft = 'auto';
		this.grid.style.marginRight = 'auto';
		this.grid.style.borderStyle = 'solid';
		this.grid.style.borderWidth = 'medium';
		this.grid.style.borderColor = '#CCCCCC';
		this.grid.style.backgroundColor = '#000000';
		
		document.body.appendChild(this.grid);
		
		// Create simulation
		this.sim = new nBodySimulation({ grid: this.grid });
		
		this.grid.addEventListener('click', this.handleClick.bind(this), false);
		document.addEventListener('keydown', this.handleKey.bind(this), false);
	},
	
	handleClick: function(event) {
		this.sim.addNewBody(event.clientX - this.grid.offsetLeft, event.clientY - this.grid.offsetTop);
	},
	
	handleKey: function(event) {
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
	running: false,
	
	intervalId: 0,
	
	time: 0,
	
	options: {},
	
	bodies: [],
	
	graphics: undefined,
	
	init: function(args) {
		if (!args)
			args = {};
		
		this.options.G = args.G || 6.67384 * Math.pow(10, -11); // Gravitational constant
		this.options.deltaT = args.deltaT || 500; // Timestep
		this.options.interval = args.interval || 10; // Computation interval
		this.graphics = new nBodyGraphics(args); // Pass on the arguments to the graphics object
	},
	
	addNewBody: function(xPos, yPos) {
		this.bodies.push(new gBody({ x: xPos, y: yPos }));
		this.graphics.draw(this.bodies);
	},
	
	start: function() {
		this.running = true;
		this.intervalId = setInterval(this._run.bind(this), this.options.interval);
	},
	
	stop: function() {
		this.running = false;
	},
	
	_run: function() {		
		for (var i = 0; i < this.bodies.length; i++) {
			this._calculatePosition(this.bodies[i], i, this.options.deltaT);
		}
		
		this.time += this.options.deltaT; // Increment runtime
		this.graphics.draw(this.bodies);
		
		if (this.running === false) {
			clearInterval(this.intervalId);
		}
	},
	
	_calculatePosition: function(body, index, deltaT) {
		var netFx = 0;
		var netFy = 0;
		
		// Iterate through all bodies and sum the forces exerted
		for (var i = 0; i < this.bodies.length; i++) {
			if (i !== index) {
				var attractor = this.bodies[i];
				
				// Calculate the delta in positions
				var dx = attractor.x - body.x;
				var dy = attractor.y - body.y;
				
				// Obtain the distance between the objects (hypotenuse)
				var r = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
				
				// Calculate force using Newtonian gravity, separate out into x and y components
				var F = (this.options.G * body.mass * attractor.mass) / Math.pow(r, 2);
				var Fx = F * (dx / r);
				var Fy = F * (dy / r);
				
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
	
	setG: function(G) {
		if (typeof(G) === 'number') {
			this.options.G = G;
		}
	},
	
	setDeltaT: function(deltaT) {
		if (typeof(deltaT) === 'number') {
			this.options.deltaT = deltaT;
		}
	},
	
	setCompInterval: function(interval) {
		if (typeof(interval) === 'number') {
			this.options.interval = interval;
		}
	}
};

var nBodyGraphics = makeClass();
nBodyGraphics.prototype = {
	options: {},
	
	init: function(args) {
		if (!args)
			args = {};

		this.grid = typeof(args.grid) === 'string' ? document.getElementById(args.grid) : args.grid;
		if (typeof(this.grid) === 'undefined') {
			throw 'No usable canvas element was found.';
		}
	},
	
	draw: function(bodies) {
		var ctx = this.grid.getContext('2d');
		
		ctx.clearRect(0, 0, this.grid.width, this.grid.height);
		
		for (var i = 0; i < bodies.length; i++) {
			var body = bodies[i];
			
			ctx.fillStyle = body.model.color;
			
			ctx.beginPath();
			ctx.arc(body.x, body.y, body.model.radius, 0, Math.PI * 2, true);
			
			ctx.fill();
		}
	}
};

var gBody = makeClass();
gBody.prototype = {
	x: 0,
	y: 0,
	
	velX: 0,
	velY: 0,
	
	mass: 0,
	
	model: {},
	
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
		this.mass = args.mass || 1000;
		
		this.model.color = args.color || '#FFFFFF';
		this.model.radius = args.radius || 4;
	},
	
	setColor: function(color) {
		if (typeof(color) === 'string') {
			this.model.color = color;
		}
	},
	
	setRadius: function(radius) {
		if (typeof(radius) === 'number') {
			this.model.radius = radius;
		}
	}
};