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
		
		this.grid = typeof args.grid === 'string' ? document.getElementById(args.grid) : args.grid;
		
		if (typeof this.grid === 'undefined') {
			this._generateGrid(this.options.width, this.options.height, this.options.backgroundColor);
		
			// Update grid argument
			args.grid = this.grid;
		}

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
				color = randomColor();
			}
		
			this.sim.addNewBody({
				x: random(minX, maxX),
				y: random(minY, maxY),
				velX: randomDirectional(minVelX, maxVelX),
				velY: randomDirectional(minVelY, maxVelY),
				mass: random(minMass, maxMass),
				radius: random(minRadius, maxRadius),
				color: color});
		}
	},
	
	_wireupEvents: function() {
		this.grid.addEventListener('click', this._handleClick.bind(this), false);
		document.addEventListener('keydown', this._handleKeyDown.bind(this), false);
	},
	
	_handleClick: function(event) {
		this.sim.addNewBody({x: event.clientX - this.grid.offsetLeft, y: event.clientY - this.grid.offsetTop});
	},
	
	_handleKeyDown: function(event) {
		switch (event.which) {
			// 'Enter' - Start or stop simulation
			case 13:
				this.sim.toggle();
				break;
			
			// 'C' - Clear simulation
			case 67:
				this.sim.clear();
				break;

			// 'P' - Toggle trails
			case 80:
				this.sim.togglePaths();
				break;
			
			// 'R' - Generate random objects
			case 82:
				this._generateBodies(10, {randomColors: true});
				break;
			
			// T for test
			case 84:
				this.sim.addNewBody({x: this.options.width / 2, y: this.options.height / 2, velX: 0, velY: 0, mass: 2000, radius: 50, color: '#5A5A5A'});
				this.sim.addNewBody({x: this.options.width - 400, y: this.options.height / 2, velX: 0, velY: 0.000025, mass: 1, radius: 5, color: '#787878'});
				break;
		}
	}
};