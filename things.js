/*
 * Copyright (c) 2012 Taye Adeyemi
 * Open source under the MIT License.
 * https://raw.github.com/TAdeyemi/things/master/LICENSE
 */

window.things = (function (things) {
	'use strict';
	
	var i,
		body,
		svgTags = {},
		px = 'px',
		document = window.document,
		supportsTouch = 'createTouch' in document;
		
	things.interact = window.interact;
	things.events = {
		add: function (target, type, listener, useCapture) {
			if (target.events === undefined) {
				target.events = [];
			}
			if (target.events[type] === undefined) {
				target.events[type] = [];
			}

			target.addEventListener(type, listener, useCapture || false);
			target.events[type].push(listener);

			return listener;
		},
		remove: function (target, type, listener, useCapture) {
			var i;

			if (target && target.events) {
				if (type === 'all') {
					for (i = 0; i < target.events.length; i++) {
						events.remove(target, target.events[i]);
					}
				} else if (target.events[type].length) {
					if (!listener) {
						for (i = 0; i < target.events[type].length; i++) {
							target.removeEventListener(type, target.events[type][i], useCapture || false);
							target.events[type].splice(i, 1);
						}
					} else {
						for (i = 0; i < target.events[type].length; i++) {
							if (target.events[type][i] === listener) {
								target.removeEventListener(type, listener, useCapture || false);
								target.events[type].splice(i, 1);
							}
						}
					}
				}
			}
		}
	};

	if (things.supportsTouch) {
			things.downEvent = 'touchstart';
			things.upEvent = 'touchend';
			things.moveEvent = 'touchmove';
	} else {
			things.downEvent = 'mousedown';
			things.upEvent = 'mouseup';
			things.moveEvent = 'mousemove';
	}
	
	things.eventTypes = [
		things.downEvent,
		things.upEvent,
		things.moveEvent,
		'click',
		'doubleclick',
		'mouseover',
		'mouseout',
		'interactdragstart',
		'interactdragmove',
		'interactdragend',
		'interactresizestart',
		'interactresizesmove',
		'interactresizesend'
	];
	
	things.ajax = function (options) {
		var request = (window.XMLHttpRequest)?
					// code for IE7+, Firefox, Chrome, Opera, Safari
					new XMLHttpRequest():
					// code for IE6, IE5
					new ActiveXObject("Microsoft.XMLHTTP"),
			i,
			headerName,
			o = options;
	
	if (o.async === undefined) {
		o.async = true;
	}
	if (o.noCache) {
		o.url += ((/\?/).test(o.url) ? "&" : "?") + (new Date()).getTime();
	}
	if (o.mimeType) {
		request.overrideMimeType(o.mimeType);
	}
	if (o.responseType) {
		request.responseType = o.responseType;
	}

	// Add ReadyStateChange event Listeners
	if (o.readystatechange instanceof Array) {
		for (i = 0; i < o.readystatechange.length; i++) {
			things.events.add(request, 'readystatechange', o.readystatechange[i]);
		}
	} else {
		things.events.add(request, 'readystatechange', o.readystatechange);
	}
	// Remove all event listeners after they've been called (Not sure if it's necessary)
	things.events.add(request, 'readystatechange', function () {
			things.events.remove(request, 'readystatechange');
		});

	request.open(o.method || "GET", o.url, o.async, o.user, o.password);
		
	// Set request Headers
	if (o.headerName instanceof Object) {
		for (headerName in o.requestHeaders) {
			if (o.requestHeaders.hasOwnProperty(headerName)) {
				request.setRequestHeader(headerName, o.requestHeaders[headerName]);
			}
		}
	}
	request.send(o.data);
	
	return request;
	};
	
	// TODO animation/action queues for sequencing etc
	things.queue = {};
	
	/**
	 * @function
	 * @description Get pixel length from string
	 * @param {Object HTMLElement | Object SVGElement} element the element the style property belongs to
	 * @param {Sting} string The style length (px/%);
	 * @returns {Number}
	 */
	things.parseStyleLength = function (element, string) {
		var lastChar = string[string.length - 1];

		if (lastChar === 'x') {
			return Number(string.substring(string.length - 2, 0));
		} else if (lastChar === '%') {
			return things.parseStyleLength(element.parentNode) * Number(string.substring(string.length - 1, 0)) / 100;
		} else if (lastChar === 'm') {
			// Not Ready ***
			return Number(string.substring(string.length - 2, 0)) * things.parseStyleLength(element, window.getComputedStyle(element).fontSize);
		}
		return string;
	};

	/**
	 * @function
	 * @description Get the size of a DOM element
	 * @param {Object HTMLElement | Object SVGElement} element
	 * @returns {Object} {x: width, y: height}
	 */
	things.getSize = function (element) {
		var width,
			height,
			dimensions;

		if (element.nodeName in svgTags) {
			dimensions = svgTags[element.nodeName].getSize(element);
			width = dimensions.x;
			height = dimensions.y;
		} else {
			width = element.style.width;
			height = element.style.height;

			if(width !== '') {
				width = things.parseStyleLength(element, width);
				height  = things.parseStyleLength(element, height);
			} else {
				width = things.parseStyleLength(element, window.getComputedStyle(element).width);
				height = things.parseStyleLength(element, window.getComputedStyle(element).height);
			}
		}
		return {x: width, y: height};
	};

	/**
	 * @function
	 * @description Set Element to the given Size
	 * @param {Object HTMLElement | Object SVGElement} element
	 * @param {Number | String} width the new width of the element
	 * @param {Number | String} height the new height of the element
	 */
	things.setSize = function (element, width, height) {
		if (element.nodeName in svgTags) {
			svgTags[element.nodeName].setSize(element, width, height);
		} else {
			if (typeof width === 'number') {
				width += px;
			}
			if (typeof height === 'number') {
				height += px;
			}

			if (typeof width === 'string') {
				element.style.setProperty('width', width);
			}
			if (typeof height === 'string') {
				element.style.setProperty('height', height);
			}
		}
	};

	/**
	 * @function
	 * @description Change the element's size by the given value
	 * @param {Object HTMLElement | Object SVGElement} element
	 * @param {Number} dx the amount by which to change the width
	 * @param {Number} dy the amount by which to change the height
	 * @param {Number} [minx] the minimum width the element should have
	 * @param {Number} [miny] the minimum height the element should have
	 */
	things.changeSize = function (element, dx, dy, minx, miny) {
		var size = getSize(element),
			width = size.x,
			height = size.y;

		minx = Number(minx) || 100;
		miny = Number(miny) || 100;

		width = Math.max(width + dx, minx);
		height = Math.max(height + dy, miny);

		setSize(element, width, height);
	};

	/**
	 * @function
	 * @description Get the position of a DOM element relative to the top left of the page
	 * @param {Object HTMLElement | Object SVGElement} element
	 * @returns {Object} {x: left, y: top}
	 */
	things.getPosition = function (element) {
		var left,
			top;

		if (element.nodeName in svgTags) {
			var screenCTM = element.getScreenCTM();

			left = screenCTM.e;
			top = screenCTM.f;
		} else {
			var clientRect = element.getBoundingClientRect(),
				compStyle = window.getComputedStyle(element);


			left = clientRect.left + window.scrollX - things.parseStyleLength(element, compStyle.marginLeft),
			top = clientRect.top + window.scrollY - things.parseStyleLength(element, compStyle.marginTop);
		}
		return {x: left, y: top};
	};

	/**
	 * @function
	 * @description Move Element to the given position (assumes it is positioned absolutely or fixed)
	 * @param {Object HTMLElement | Object SVGElement} element
	 * @param {Number} x position from the left of the element
	 * @param {Number} y position from the top of the element
	 */
	things.setPosition = function (element, x, y) {
		var translate;

		if (element.nodeName in svgTags) {
			if (typeof x === 'number' && typeof y === 'number') {
				translate = 'translate(' + x + ', ' + y + ')';
				element.parentNode.setAttribute('transform', translate);
			}
		} else if (typeof x === 'number' && typeof y === 'number') {
			element.style.setProperty('left', x + px, '');
			element.style.setProperty('top', y + px, '');
		}
	};

	/**
	 * @function
	 * @description Change the element's position by the given value
	 * @param {Object HTMLElement | Object SVGElement} element
	 * @param {Number} dx the amount by which to change the distance from the left
	 * @param {Number} dy the amount by which to change the distance from the top
	 */
	things.changePosition = function (element, dx, dy) {
		var variable,
			x,
			y;

		if (element.nodeName in svgTags) {
			if (typeof dx === 'number' && typeof dy === 'number') {
				//variable = getTransform(element, 'translate');
				x = Number(variable[0]);
				y = Number(variable[1]);

				//setTransform(element, 'translate',  [ x + dx, y + dy]);
			}
		} else if (typeof dx === 'number' && typeof dy === 'number') {
			variable = window.getComputedStyle(element);
			x = things.parseStyleLength(element, variable.left);
			y = things.parseStyleLength(element, variable.top);

			things.setPosition(element, x + dx, y + dy);
		}
	};
	
	things.getTags = function (root, tag) {
		if (root && tag) {
			return root.getElementsByTagName(tag);
		} else {
			return null;
		}
	}
	
	things.getTag = function (root, tag) {
		var tags = things.getTags(root, tag);
		
			return tags?
					tags[0]:
					null;
	}
		
	for (i = 0; i < things.length; i++) {		
		things[i](things);
	}

	function onDomReady (event) {
		var node,
			i;

		things.body = document.body;
		things.area = document.getElementById('thing');
		
		for (i = 0; i < things.onDomReady.length; i++) {
			things.onDomReady[i]();
		}
	}

	things.events.add(document, 'DOMContentLoaded', onDomReady);

	return {
		debug: function () {
			var i,
			returnValues = [];

			for (i = 0; i < things.debugs.length; i++) {
				returnValues.push(things.debugs[i]());
			}
			return returnValues;
		},
		ajax: things.ajax
	}
}(window.things));
