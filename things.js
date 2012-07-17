/*
 * Copyright (c) 2012 Taye Adeyemi
 * Open source under the MIT License.
 * https://raw.github.com/TAdeyemi/things/master/LICENSE
 */

window.things = (function (things) {
	'use strict';
	
	var i,
		scope = {
			interact: window.interact,
			things: things
		};
		
	for (i = 0; i < things.length; i++) {		
		things[i].call(scope, things);
	}

	return {
		debug: function () {
			var i,
			returnValues = [];

			for (i = 0; i < things.debugs.length; i++) {
				returnValues.push(things.debugs[i]());
			}
			return returnValues;
		}
	}
}(window.things));
