/*
 * Copyright (c) 2012 Taye Adeyemi
 * Open source under the MIT License.
 * https://raw.github.com/TAdeyemi/things/master/LICENSE
 */

if (!(window.things instanceof Array)) {
	window.things = [];
	window.things.debugs = [];
}

window.things.push (function (things) {
	'use strict';

	var interact = this.interact,
		dragging = false,
		svgTags = {},
		nodes = [],
		nodeCount = 0,
		thing0Count = 0,
		document = window.document,
		body,
		ui,
		activeThing = null,
		nextActiveThing = null,
		info,
		px = 'px',
		supportsTouch = 'createTouch' in document,
		downEvent,
		upEvent,
		moveEvent,
		// Event Wrapper
		events = {
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

				if (!(target && target.events)) {
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
		},
		settings = {
			thing0CornerRadius: 2,
			interval: 20,
			thing0Move: {
				large: {
					threshold: 600,
					steps: 20
				},
				medium: {
					threshold: 300,
					steps: 10
				},
				small: {
					threshold: 0,
					steps: 5
				}
			},
			thing0Radius: 40
		};

	if (supportsTouch) {
			downEvent = 'touchstart';
			upEvent = 'touchend';
			moveEvent = 'touchmove';
	} else {
			downEvent = 'mousedown';
			upEvent = 'mouseup';
			moveEvent = 'mousemove';
	}


	nodes.indexOf = function (node) {
		var i;

		if (node instanceof Node) {
			return this.constructor.prototype.indexOf(node);
		} else {
			for (i = 0; i < nodes.length; i++) {
				if (nodes[i].element === node) {
					return i;
				}
			}
			// If not found
			return -1;
		}
	};

	nodes.remove = function (node) {
		var i;

		for (i = 0; i < node.thing0s.length; i++) {
			node.thing0s[i].remove();
		}
		remove(this.element);

		this.splice(this.indexOf(node), 1);
	};

	function give (parent, child) {
		return parent.appendChild(child);
	}

	function remove(element) {
		if (element.parentNode) {
			return element.parentNode.removeChild(element);
		}
	}

	function Element (nodeName, classes) {
		var element = document.createElement(nodeName);

		element.className = classes || '';

		return element;
	}

	function eventListener (event) {
		var object = getObject(event.target),
			i;
		if (event.type === 'interactdragstart') {
			dragging = true;
		} else if (event.type === 'interactdragend') {
			dragging = false;
		}
		if (object && object.eventListeners && event.type in object.eventListeners) {
			object.eventListeners[event.type].call(object, event);
		}
	}

	function Node (x, y) {
		var elementPosition;
		
		this.element = new Element('div', 'node');
		this.thing0s = [];
		this.x = x || 100;
		this.y = y || 100;
		
		give(ui, this.element);
		elementPosition = this.getElementPosition();
		setPosition(this.element, elementPosition.x, elementPosition.y);

		interact.set(this.element, {drag: true});

		nodes.push(this);

		this.element.id = 'node' + nodeCount++;
		
	}

	Node.prototype.cycle = function (n) {
		var i;
		
		if (!(n = Number(n))) {
			n = 0;
		}
		
		if (n >0) {
			for (i = 0; i < n; i++) {
				this.thing0s.unshift(this.thing0s.pop());
				this.reorder();
			}
		} else {
			for (i = n; i < 0; i++) {
				this.thing0s.push(this.thing0s.shift());
				this.reorder();
			}
		}			
	}
	
	Node.prototype.eventListeners = {
		interactdragstart: function (event) {
			console.log('Do something Like make all the node get small i dunno');
			this.dragging = true;
		},
		interactdragmove: function (event) {
			var i;
		
			changePosition(event.target, event.detail.dx, event.detail.dy);
			this.x += event.detail.dx;
			this.y += event.detail.dy;
				
			for (i = 0; i < this.thing0s.length; i++) {
				this.thing0s[i].eventListeners[event.type].call(this.thing0s[i], event, true);
			}
		},
		interactdragend: function (event) {
			console.log('Node Drag End');
			this.dragging = false;
		}
	};
	
	Node.prototype.isFree = function () {
		return (this.thing0s.length < 4);
	};

	Node.prototype.setPositionProperties = function (x, y) {
		this.x = x;
		this.y = y;
	};

	Node.prototype.remove = function (thing0) {
		this.splice(this.indexOf(thing0), 1);
		remove(thing0.element);
		
		this.reorder();
	};

	Node.prototype.push = function (thing0) {
		var clientRect = thing0.element.getClientRects()[0],
			i;

		if (!this.isFree()) {
			for (i = 0; i < nodes.length; i++) {
				if (nodes[i].isFree()) {
					return nodes[i].push(thing0);
				}
			}
			// If all are full
			return new Node(350 * (nodes.length + 1), 300).push(thing0);
		}

		give(ui, thing0.element);
		thing0.position = this.thing0s.length;
		thing0.node = this;
		thing0.snapTo(this);
		thing0.setCornerRadius(settings.thing0CornerRadius);
		
		return this.thing0s.push(thing0);
	};
	
	Node.prototype.reorder = function () {
		var i,
			thing0;
		
		for (i = 0; i < this.thing0s.length; i++) {
			thing0 = this.thing0s[i];

			if (thing0.position !== i) {
				thing0.position = i;
				thing0.moveTo(this);
				thing0.setCornerRadius(settings.thing0CornerRadius);
			}
		}
		console.log("Reorder Node");
	};

	Node.prototype.splice = function (index, count) {
		if (this.thing0s[index] instanceof Thing) {
			this.thing0s[index].node = null;
			this.thing0s.splice(index, count);
		}
		return this;
	};

	Node.prototype.indexOf = function (thing0) {
		var i;

		if (thing0 instanceof Thing) {
			return this.thing0s.indexOf(thing0);
		} else {
			for (i = 0; i < this.thing0s.length; i++) {
				if (this.thing0s[i].element === thing0) {
					return i;
				}
			}
			// If not found
			return -1;
		}
	};

	Node.prototype.positions = [
		'top-right',
		'bottom-right',
		'bottom-left',
		'top-left'
	];

	function Thing (details, node) {
		var i,
			titleElement,
			descriptionElement;

		this.element = new Element('div', 'thing0');
		this.element.id = 'thing0 '+ thing0Count++;
		this.title = details.title;
		this.description = details.description;
		this.location = details.location;
		this.x = 0;
		this.y = 0;

		titleElement = give(this.element, new Element ('h1'));
		titleElement.innerHTML = '<a href="' + this.location +'">' + this.title + '<a/>';
		descriptionElement = give(this.element, new Element ('p'));
		descriptionElement.innerHTML = this.description;

		if (!(node instanceof Node)) {
			node = (nodes[0] || new Node());
		}
		
		node.push(this);

		interact.set(this.element, {drag: true});
	}
	
	Thing.prototype.eventListeners = {
		interactdragstart: function (event) {
			this.dragging = true;
			this.setCornerRadius('');
		},
		interactdragmove: function (event, movedWithNode) {
			var clientRect = this.element.getClientRects()[0],
				target = this.nearestFreeNode(),
				targetLocation = target.getElementPosition(),
				currentLocation = this.getElementPosition(),
				//distance = Math.pow(targetLocation.x - currentLocation.y, 2) + ,
				i;
			//	newRadius = (Math.min(200, distance) / 200) * settings.thingRadius;
		
			changePosition(this.element, event.detail.dx, event.detail.dy);
			this.x += event.detail.dx;
			this.y += event.detail.dy;
			
			for (i = 0; i < nodes.length; i ++) {
				nodes[i].element.classList.remove('drop-target');
			}
			target.element.classList.add('drop-target');

			//this.style('border-' + this.corners[this.position] + '-radius', newRadius + px);
		},
		interactdragend: function (event) {
			var target = this.nearestFreeNode();
			
			this.moveTo(target);
			this.dragging = false;
		},
		mouseover: function (event) {
			if (!dragging && !this.isMoving && (!activeThing || !activeThing.isMoving) && this !== activeThing && !this.isShrinking &&
				!(event.pageX < this.element.offsetLeft ||
				event.pageY < this.element.offsetTop ||
				event.pageX > this.element.offsetWidth + this.element.offsetLeft ||
				event.pageY > this.element.offsetHeight + this.element.offsetTop)) {
				
				if (activeThing && (activeThing.isShrinking || activeThing.isGrowing)) {
					nextActiveThing = this;
				} else {
					this.focus(event);
				}
			}
		},
		mouseout: function (event) {
			if (!dragging && !this.isMoving && (!activeThing || !activeThing.isMoving) && this === activeThing && !this.isGrowing &&
				(event.pageX < this.element.offsetLeft ||
				event.pageY < this.element.offsetTop ||
				event.pageX > this.element.offsetWidth + this.element.offsetLeft ||
				event.pageY > this.element.offsetHeight + this.element.offsetTop)) {
				
				if (this === nextActiveThing) {
					nextActiveThing === null;
				}
				this.defocus(event);
			}
		}
	};
	
	Thing.prototype.getPlace = function (node) {
		var x,
			y,
			halfThing = {
				x: this.element.offsetWidth / 2,
				y: this.element.offsetHeight / 2
			},
			halfNode = {
				x: node.element.offsetWidth / 2,
				y: node.element.offsetHeight / 2
			},
			position =
				(node === this.node)?
					this.position:
					node.thing0s.length,
			directions = [
				{x: 1, y: -1},
				{x: 1, y: 1},
				{x: -1, y: -1},
				{x: -1, y: -1},
			];
			
		x = (halfNode.x + halfThing.x);
		y = (halfNode.y + halfThing.y);

		if (position === 0) {
			x = node.x + (halfNode.x + halfThing.x);
			y = node.y - (halfNode.y + halfThing.y);
		}
		else if (position === 1) {
			x = node.x + (halfNode.x + halfThing.x);
			y = node.y + (halfNode.y + halfThing.y);
		}
		else if (position === 2) {
			x = node.x - (halfNode.x + halfThing.x);
			y = node.y + (halfNode.y + halfThing.y);
		}
		else if (position === 3) {
			x = node.x - (halfNode.x + halfThing.x);
			y = node.y - (halfNode.y + halfThing.y);
		}
		
		return {
			x: x,
			y: y
		};
	};
	
	Thing.prototype.setNode = function (node) {
		if (this.node) {
			if (this.node === node) {
				this.setCornerRadius(settings.thing0CornerRadius);
			} else {
				this.node.remove(this);
				node.push(this);
			}
		}
	};
	
	Thing.prototype.focus = function (event) {
		// Do animations/sounds etc
		var i = 0,
			steps = 5,
			interval = 20,
			grow,
			compStyle = window.getComputedStyle(this.element),
			width = parseStyleLength(this.element, compStyle.width),
			height = parseStyleLength(this.element, compStyle.height);
		
		this.isGrowing = true;
		this.element.classList.add('active');
		if(activeThing && this !== activeThing) {
			activeThing.defocus();
		}
		activeThing = this;
		
		grow = function () {
			this.style('width', (width += 2) + px);
			this.style('height', (height += 2) + px);
			this.snapTo(this.node);
				
			if ((i += 1) < steps) {
				window.setTimeout(grow, interval);
			} else {
				this.isGrowing = false;
			}
		}.bind(this);
		
		window.setTimeout(grow, interval);
	};

	Thing.prototype.defocus = function (event) {
		var i = 0,
			steps = 5,
			interval = 20,
			shrink,
			compStyle = window.getComputedStyle(this.element),
			width = parseStyleLength(this.element, compStyle.width),
			height = parseStyleLength(this.element, compStyle.height);

		this.element.classList.remove('active');
		this.isShrinking = true;
		if (activeThing === this) {
			activeThing = null;
		}
		
		shrink = function () {
			this.style('width', (width -= 2) + px);
			this.style('height', (height -= 2) + px);
			this.snapTo(this.node);
				
			if ((i += 1) < steps) {
				window.setTimeout(shrink, interval);
			} else {
				this.isShrinking = false;
				if (nextActiveThing) {
					if (nextActiveThing === this) {
						nextActiveThing = null;
					} else {
						nextActiveThing.focus(event);
					}
				}
			}
		}.bind(this);
		
		window.setTimeout(shrink, interval);
	};
	
	Thing.prototype.moveTo = function (node) {
		var i = 0,
			distance = this.distanceTo(node),
			target = this.getPlace(node),
			elementTarget,
			steps = distance > 600?
					20:
					distance > 300?
						10:
						5,
			interval = 20,
			vector = {
			    x: target.x - this.x,
			    y: target.y - this.y
			},
			unitVector = {x: vector.x / steps, y: vector.y/steps},
			nudge = function () {
				this.x += unitVector.x;
				this.y += unitVector.y;
				
				changePosition(this.element, unitVector.x, unitVector.y);
				
				if ((i += 1) < steps) {
					window.setTimeout(nudge, interval);
				} else {
					this.x = target.x;
					this.y = target.y;
					
					elementTarget = this.getElementPosition();
					setPosition(this.element, elementTarget.x, elementTarget.y);
					
					this.setNode(node);
					this.node.element.classList.remove('drop-target');
					this.isMoving = false;
				}
			}.bind(this);

		this.isMoving = true;
		window.setTimeout(nudge, interval);
		
		return this;
	};
	
	Thing.prototype.snapTo = function (node) {
		var target = this.getPlace(node),
			elementPosition;
		
		this.x = target.x;
		this.y = target.y;
		
		elementPosition = this.getElementPosition();
		setPosition(this.element, elementPosition.x, elementPosition.y);
		return this;
	};
	
	Thing.prototype.getElementPosition = Node.prototype.getElementPosition = function () {
		var halfWidth = this.element.offsetWidth / 2,
			halfHeight = this.element.offsetHeight / 2;
		
		return {
			x: this.x - halfWidth,
			y: this.y - halfHeight
		};
	};
	
	Thing.prototype.nearestNode = function (mustBeFree) {
		var i,
			x,
			y,
			node,
			distance,
			shortestDistance,
			closest;
		
		for (i = 0; i < nodes.length; i++) {
			node = nodes[i];
			
			if ((mustBeFree? node.isFree() || node === this.node: true) && ((distance = this.distanceTo(node)) <= shortestDistance || closest === undefined)) {
				shortestDistance = distance;
				closest = i;
			}
		}
		return nodes[closest];
	};
	
	Thing.prototype.nearestFreeNode = function () {
		return this.nearestNode(true);
	};
	
	Thing.prototype.distanceTo = Node.prototype.distanceTo = function (other) {
		var x = this.x - other.x,
			y = this.y - other.y;

		return Math.sqrt(x*x + y*y);
	};

	Thing.prototype.setCornerRadius = function (radius, animate) {
		// Reset all other corner radii
		for (i = 0; i < 4; i++) {
			if (i !== this.position){
				this.style('border-' + this.corners[i] + '-radius', '');
			}
		}

		var i = 0,
			steps = 5,
			interval = 20,
			morph,
			corner = 'border-' + this.corners[this.position] + '-radius',
			currentRadius = parseStyleLength(this.element, this.style(corner) || 
					window.getComputedStyle(this.element)['border' + this.cornersJS[this.position] + 'Radius']),
			change;
					
		this.isMorphing = true;
		if (radius === '' || radius === null || radius === undefined) {
			radius = settings.thing0Radius;
		}
		change = (radius - currentRadius) / steps;

		morph = function () {
			this.style(corner, Math.floor(currentRadius += change) + px);
				
			if ((i += 1) < steps) {
				window.setTimeout(morph, interval);
			} else {
				this.isMorphing = false;
				this.style(corner, radius + px);
			}
		}.bind(this);
		
		window.setTimeout(morph, interval);
	};

	Thing.prototype.style = Node.prototype.style = function (style, value) {
		if (style !== undefined && value !== undefined ) {
			return this.element.style.setProperty(style, value);
		}
		if (style !== undefined ) {
			return this.element.style.getPropertyValue(style);
		}
		return this.element.style;
	};

	Thing.prototype.corners = [
		'bottom-left',
		'top-left',
		'top-right',
		'bottom-right'
	];

	Thing.prototype.cornersJS = [
		'BottomLeft',
		'TopLeft',
		'TopRight',
		'BottomRight'
	];

	Thing.prototype.remove = function deleteThing () {
		remove(this.element);
		this.node.remove(this);
	};

	function getInfo () {
		// Do AJAX and parsing of xml info file;
		var i,
			demoThings = [];

		for (i = 0; i < 9; i++) {
			demoThings.push({
					title: 'thing0 ' + i,
					description: 'demo description',
					location: '/ttt/'
				});
		}
		return {thing0s: demoThings};
	}

	function debug () {
		return {
			nodes: nodes,
			info: info
		};
	}

	function getObject (element) {
		var index,
			i;

		if ((index = nodes.indexOf(element)) !== -1) {
			return nodes[index];
		} else {
			for (i = 0; i <nodes.length; i ++) {
				if ((index = nodes[i].indexOf(element)) !== -1) {
					return nodes[i].thing0s[index];
				}
			}
			// If the element isn't found
			return null;
		}
	}


	/**
	 * @function
	 * @description Get pixel length from string
	 * @param {Object HTMLElement | Object SVGElement} element the element the style property belongs to
	 * @param {Sting} string The style length (px/%);
	 * @returns {Number}
	 */
	function parseStyleLength(element, string) {
		var lastChar = string[string.length - 1];

		if (lastChar === 'x') {
			return Number(string.substring(string.length - 2, 0));
		} else if (lastChar === '%') {
			return parseStyleLength(element.parentNode) * Number(string.substring(string.length - 1, 0)) / 100;
		} else if (lastChar === 'm') {
			// Not Ready ***
			return Number(string.substring(string.length - 2, 0)) * parseStyleLength(element, window.getComputedStyle(element).fontSize);
		}
		return string;
	}

	/**
	 * @function
	 * @description Get the size of a DOM element
	 * @param {Object HTMLElement | Object SVGElement} element
	 * @returns {Object} {x: width, y: height}
	 */
	function getSize(element) {
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
				width = parseStyleLength(element, width);
				height  = parseStyleLength(element, height);
			} else {
				width = parseStyleLength(element, window.getComputedStyle(element).width);
				height = parseStyleLength(element, window.getComputedStyle(element).height);
			}
		}
		return {x: width, y: height};
	}

	/**
	 * @function
	 * @description Set Element to the given Size
	 * @param {Object HTMLElement | Object SVGElement} element
	 * @param {Number | String} width the new width of the element
	 * @param {Number | String} height the new height of the element
	 */
	function setSize(element, width, height) {
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
	}

	/**
	 * @function
	 * @description Change the element's size by the given value
	 * @param {Object HTMLElement | Object SVGElement} element
	 * @param {Number} dx the amount by which to change the width
	 * @param {Number} dy the amount by which to change the height
	 * @param {Number} [minx] the minimum width the element should have
	 * @param {Number} [miny] the minimum height the element should have
	 */
	function changeSize(element, dx, dy, minx, miny) {
		var size = getSize(element),
			width = size.x,
			height = size.y;

		minx = Number(minx) || 100;
		miny = Number(miny) || 100;

		width = Math.max(width + dx, minx);
		height = Math.max(height + dy, miny);

		setSize(element, width, height);
	}

	/**
	 * @function
	 * @description Get the position of a DOM element relative to the top left of the page
	 * @param {Object HTMLElement | Object SVGElement} element
	 * @returns {Object} {x: left, y: top}
	 */
	function getPosition(element) {
		var left,
			top;

		if (element.nodeName in svgTags) {
			var screenCTM = element.getScreenCTM();

			left = screenCTM.e;
			top = screenCTM.f;
		} else {
			var clientRect = element.getBoundingClientRect(),
				compStyle = window.getComputedStyle(element);


			left = clientRect.left + window.scrollX - parseStyleLength(element, compStyle.marginLeft),
			top = clientRect.top + window.scrollY - parseStyleLength(element, compStyle.marginTop);
		}
		return {x: left, y: top};
	}

	/**
	 * @function
	 * @description Move Element to the given position (assumes it is positioned absolutely or fixed)
	 * @param {Object HTMLElement | Object SVGElement} element
	 * @param {Number} x position from the left of the element
	 * @param {Number} y position from the top of the element
	 */
	function setPosition(element, x, y) {
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
	}

	/**
	 * @function
	 * @description Change the element's position by the given value
	 * @param {Object HTMLElement | Object SVGElement} element
	 * @param {Number} dx the amount by which to change the distance from the left
	 * @param {Number} dy the amount by which to change the distance from the top
	 */
	function changePosition(element, dx, dy) {
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
			x = parseStyleLength(element, variable.left);
			y = parseStyleLength(element, variable.top);

			setPosition(element, x + dx, y + dy);
		}
	}

	function onDomReady (event) {
		var node,
			i;

		body = document.body;
		ui = document.getElementById('thing');

		info = getInfo();
		node = new Node(300, 300);

		for (i = 0; i < info.thing0s.length; i++) {
			new Thing(info.thing0s[i], node);
		}

		events.add(document, 'interactdragstart', eventListener);
		events.add(document, 'interactdragmove', eventListener);
		events.add(document, 'interactdragend', eventListener);
		events.add(document, 'mouseover', eventListener);
		events.add(document, 'mouseout', eventListener);
	}

	events.add(document, 'DOMContentLoaded', onDomReady);

	things.debugs.push(debug);
});
