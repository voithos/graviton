var LogLevel = {
	LOG: 0,
	DEBUG: 1,
	INFO: 2,
	WARN: 3,
	ERROR: 4
};

var gtSimulation = makeClass();
gtSimulation.prototype = {
	// Member variables
	//-----------------
	
	version: '@VERSION',
	
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
		this.options.deltaT = args.deltaT || 25000; // Timestep
		this.options.interval = args.interval || 10; // Computation interval
		this.options.collisions = args.collision || true;
		this.options.scatterLimit = args.scatterLimit || 10000;
		
		this.options.logging = args.logging || true;
		
		this.graphics = new gtGraphics(args); // Pass on the arguments to the graphics object
	},
	
	addNewBody: function(args) {
		var newIndex = this.bodies.push(new gBody(args));
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
	
	toggle: function() {
		if (this.running === false) {
			this.start();
		} else {
			this.stop();
		}
	},
	
	clear: function() {
		this.bodies.length = 0; // Remove all bodies from collection
		this.stop();
		this.setPaths(false); // Turn off residual paths
		this.graphics.draw(); // Clear grid
	},
	
	setG: function(G) {
		if (typeof G === 'number') {
			this.options.G = G;
		} else {
			throw 'setG: Argument was not a number.';
		}
	},
	
	setDeltaT: function(deltaT) {
		if (typeof deltaT === 'number') {
			this.options.deltaT = deltaT;
		} else {
			throw 'setDeltaT: Argument was not a number.';
		}
	},
	
	setCompInterval: function(interval) {
		if (typeof interval === 'number') {
			this.options.interval = interval;
		} else {
			throw 'setCompInterval: Argument was not a number.';
		}
	},
	
	setCollisions: function(state) {
		if (typeof state === 'boolean') {
			this.options.collisions = state;
		} else {
			throw 'setCollisions: Argument was not boolean.';
		}
	},
	
	setScatterLimit: function(limit) {
		if (typeof limit === 'number') {
			this.options.scatterLimit = limit;
		} else {
			throw 'setScatterLimit: Argument was not a number.';
		}
	},

	setPaths: function(paths) {
		this.graphics.setPaths(paths);
	},

	togglePaths: function() {
		this.graphics.togglePaths();
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
			this.intervalId = 0;
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
					this._log('Collision detected!!');
					
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
	},

	_log: function(message, level) {
		if (this.options.logging === true) {
			if (typeof console !== 'undefined') {
				var now = new Date();
				var stamp = now.getFullYear() + '-' + now.getMonth() + '-' + now.getDate() + 'T' + 
					now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + ':' + now.getMilliseconds();
				
				message = stamp + ' ' + message;

				level = level || LogLevel.LOG;

				switch (Number(level)) {
					case LogLevel.LOG:
						console.log(message);
						break;

					case LogLevel.DEBUG:
						console.debug(message);
						break;

					case LogLevel.INFO:
						console.info(message);
						break;

					case LogLevel.WARN:
						console.warn(message);
						break;

					case LogLevel.ERROR:
						console.error(message);
				}
			}
		}
	}
};

