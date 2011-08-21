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
	return Math.random() * (to - from) + from;
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