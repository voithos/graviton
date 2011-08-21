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
		if (typeof this.x !== 'number' || typeof this.y !== 'number') {
			throw 'Correct positions were not given for the body.';
		}
		
		this.velX = args.velX || 0;
		this.velY = args.velY || 0;
		this.mass = args.mass || 10;
		this.radius = args.radius || 4;
		
		this.color = args.color || '#FFFFFF';
	},
	
	setColor: function(color) {
		if (typeof color === 'string') {
			this.color = color;
		} else {
			throw 'setColor: Argument was not a string.';
		}
	},
	
	setRadius: function(radius) {
		if (typeof radius === 'number') {
			this.radius = radius;
		} else {
			throw 'setRadius: Argument was not a number.';
		}
	}
};
