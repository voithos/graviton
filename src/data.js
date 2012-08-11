var gtData = makeClass();
gtData.prototype = {
	ref: undefined,
	
	init: function(args) {
		if (!args)
			args = {};
		
		this.ref = args.sim;
	}
};	

