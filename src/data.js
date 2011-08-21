var nBodyData = makeClass();
nBodyData.prototype = {
	ref: undefined,
	
	init: function(args) {
		if (!args)
			args = {};
		
		this.ref = args.sim;
	}
};	