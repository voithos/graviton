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
		
		this.options.paths = args.paths || false;
		
		this.grid = typeof args.grid === 'string' ? document.getElementById(args.grid) : args.grid;
		if (typeof this.grid === 'undefined') {
			throw 'No usable canvas element was found.';
		}
	},
	
	draw: function(bodies) {
		if (!this.options.paths) {
			this.grid.width = this.grid.width;
		}

		if (typeof bodies !== 'undefined') {
			var ctx = this.grid.getContext('2d');
			
			for (var i = 0; i < bodies.length; i++) {
				var body = bodies[i];
				
				ctx.fillStyle = body.color;
				
				ctx.beginPath();
				ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2, true);
				
				ctx.fill();
			}
		}
	},

	setPaths: function(paths) {
		if (typeof paths === 'boolean') {
			this.options.paths = paths;
		} else {
			throw 'setPaths: Argument was not boolean.';
		}
	},

	togglePaths: function() {
		this.options.paths = !this.options.paths;
	}

};	