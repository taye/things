/*
 * Copyright (c) 2012 Taye Adeyemi
 * Open source under the MIT License.
 * https://raw.github.com/TAdeyemi/things/master/LICENSE
 */

if (!(window.things instanceof Array)) {
	window.things = [];
	window.things.debugs = [];
	window.things.onDomReady = [];
}

window.things.push(function (things) {
	'use strict';

	var interact = things.interact,
		dragging = false,
		nodes = [],
		nodeCount = 0,
		thing0Count = 0,
		document = window.document,
		body,
		activeThing = null,
		nextActiveThing = null,
		info = {},
		px = 'px',
		supportsTouch = things.supportsTouch,
		downEvent = things.downEvent,
		upEvent = things.upEvent,
		moveEvent = things.moveEvent,
		eventTypes = things.eventTypes,
		// Event Wrapper
		events = things.events,
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
		this.x = x || 200 + (350 * (nodes.length) + 50 * (nodes.length > 0));
		this.y = y || 300;
		
		give(things.area, this.element);
		elementPosition = this.getElementPosition();
		things.setPosition(this.element, elementPosition.x, elementPosition.y);

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
			this.dragging = true;
		},
		interactdragmove: function (event) {
			var i;
		
			things.changePosition(event.target, event.detail.dx, event.detail.dy);
			this.x += event.detail.dx;
			this.y += event.detail.dy;
				
			for (i = 0; i < this.thing0s.length; i++) {
				this.thing0s[i].eventListeners[event.type].call(this.thing0s[i], event, true);
			}
		},
		interactdragend: function (event) {
			this.dragging = false;
			
		},
		click: function (event) {
			if (event.shiftKey) {
				this.cycle(-1);
			} else {
				this.cycle(1);
			}
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
			return new Node().push(thing0);
		}
		if (!this.parentNode) {
			give(things.area, thing0.element);
			// Do some sort of Growing out animation
		} else {
			give(things.area, thing0.element);
		}
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
	};

	Node.prototype.splice = function (index, count) {
		if (this.thing0s[index] instanceof Thing0) {
			this.thing0s[index].node = null;
			this.thing0s.splice(index, count);
		}
		return this;
	};

	Node.prototype.indexOf = function (thing0) {
		var i;

		if (thing0 instanceof Thing0) {
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

	function Thing0 (details, node) {
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
		this.randomColour();

		if (!(node instanceof Node)) {
			node = (nodes[0] || new Node());
		}
		
		node.push(this);

		interact.set(this.element, {drag: true, order: true});
	}
	
	Thing0.prototype.randomColour = function () {
		var h = 360*Math.random(),
			s = 100 + '%',
			l = 57 + '%';
	
		this.style('background-color', 'hsl(' + [h, s, l].join() + ')');
	}
	
	Thing0.prototype.eventListeners = {
		interactdragstart: function (event) {
			this.dragging = true;
			this.setCornerRadius('');
		},
		interactdragmove: function (event, movedWithNode) {
			var clientRect = this.element.getClientRects()[0],
				target = this.nearestFreeNode(),
				targetLocation = target.getElementPosition(),
				currentLocation = this.getElementPosition(),
				i;
		
			things.changePosition(this.element, event.detail.dx, event.detail.dy);
			this.x += event.detail.dx;
			this.y += event.detail.dy;
			
			for (i = 0; i < nodes.length; i ++) {
				nodes[i].element.classList.remove('drop-target');
			}
			target.element.classList.add('drop-target');
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
	
	Thing0.prototype.getPlace = function (node) {
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
	
	Thing0.prototype.setNode = function (node) {
		if (this.node) {
			if (this.node === node) {
				this.setCornerRadius(settings.thing0CornerRadius);
			} else {
				this.node.remove(this);
				node.push(this);
			}
		}
	};
	
	Thing0.prototype.focus = function (event) {
		// Do animations/sounds etc
		var i = 0,
			steps = 5,
			interval = 20,
			grow,
			compStyle = window.getComputedStyle(this.element),
			width = things.parseStyleLength(this.element, compStyle.width),
			height = things.parseStyleLength(this.element, compStyle.height);
		
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

	Thing0.prototype.defocus = function (event) {
		var i = 0,
			steps = 5,
			interval = 20,
			shrink,
			compStyle = window.getComputedStyle(this.element),
			width = things.parseStyleLength(this.element, compStyle.width),
			height = things.parseStyleLength(this.element, compStyle.height);

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
	
	Thing0.prototype.moveTo = function (node) {
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
				
				things.changePosition(this.element, unitVector.x, unitVector.y);
				
				if ((i += 1) < steps) {
					window.setTimeout(nudge, interval);
				} else {
					this.x = target.x;
					this.y = target.y;
					
					elementTarget = this.getElementPosition();
					things.setPosition(this.element, elementTarget.x, elementTarget.y);
					
					this.setNode(node);
					this.node.element.classList.remove('drop-target');
					this.isMoving = false;
				}
			}.bind(this);

		this.isMoving = true;
		window.setTimeout(nudge, interval);
		
		return this;
	};
	
	Thing0.prototype.snapTo = function (node) {
		var target = this.getPlace(node),
			elementPosition;
		
		this.x = target.x;
		this.y = target.y;
		
		elementPosition = this.getElementPosition();
		things.setPosition(this.element, elementPosition.x, elementPosition.y);
		return this;
	};
	
	Thing0.prototype.getElementPosition = Node.prototype.getElementPosition = function () {
		var halfWidth = this.element.offsetWidth / 2,
			halfHeight = this.element.offsetHeight / 2;
		
		return {
			x: this.x - halfWidth,
			y: this.y - halfHeight
		};
	};
	
	Thing0.prototype.nearestNode = function (mustBeFree) {
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
	
	Thing0.prototype.nearestFreeNode = function () {
		return this.nearestNode(true);
	};
	
	Thing0.prototype.distanceTo = Node.prototype.distanceTo = function (other) {
		var x = this.x - other.x,
			y = this.y - other.y;

		return Math.sqrt(x*x + y*y);
	};

	Thing0.prototype.setCornerRadius = function (radius, animate) {
		// Reset all other corner radii
		for (i = 0; i < 4; i++) {
			if (i !== this.position){
				this.style('border-' + this.corners[i] + '-radius', '');
			}
			this.element.classList.remove(this.corners[i]);
		}

		var i = 0,
			steps = 5,
			interval = 20,
			morph,
			corner = 'border-' + this.corners[this.position] + '-radius',
			currentRadius = things.parseStyleLength(this.element, this.style(corner) || 
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
				this.element.classList.add(this.corners[this.position]);
				
				// Reset all other corner radii
				for (i = 0; i < 4; i++) {
					if (i !== this.position){
						this.style('border-' + this.corners[i] + '-radius', '');
						this.element.classList.remove(this.corners[i]);
					}
				}
			}
		}.bind(this);
		
		window.setTimeout(morph, interval);
	};

	Thing0.prototype.style = Node.prototype.style = function (style, value) {
		if (style !== undefined && value !== undefined ) {
			return this.element.style.setProperty(style, value);
		}
		if (style !== undefined ) {
			return this.element.style.getPropertyValue(style);
		}
		return this.element.style;
	};

	Thing0.prototype.corners = [
		'bottom-left',
		'top-left',
		'top-right',
		'bottom-right'
	];

	Thing0.prototype.cornersJS = [
		'BottomLeft',
		'TopLeft',
		'TopRight',
		'BottomRight'
	];

	Thing0.prototype.remove = function deleteThing () {
		remove(this.element);
		this.node.remove(this);
	};

	function getInfo (mode) {
		if (mode !== 'demo') {
			// Do AJAX and parsing of xml info file;
			var request = things.ajax({
						url: 'info.xml',
						async: false,
						noCache: true
					}),
				node = new Node();
			
			info.thing0s = [];
			
			// If the document was loaded correctly
			if (request.readyState === 4 && request.status === 200) {
				var elementThings = things.getTags(request.responseXML, 'thing0');

			
				for (i = 0; i < elementThings.length; i++) {
					try {
						info.thing0s.push({
								title: things.getTag(elementThings[i], 'title').textContent,
								description: things.getTag(elementThings[i], 'description').textContent,
								location: things.getTag(elementThings[i], 'location').textContent
							});
					}
					catch (error) {
						console.log('Error trying to parse file', error);
					}
				}
			}

			for (i = 0; i < info.thing0s.length; i++) {
				new Thing0(info.thing0s[i], node);
			}
		} else {
			var i,
				demoThings = [];

			for (i = 0; i < 9; i++) {
				demoThings.push({
						title: 'thing0 ' + i,
						description: 'Description of this thing.',
						location: '/ttt/'
					});
			}
			return {thing0s: demoThings};
		}
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

	things.onDomReady.push( function (event) {
			var node,
				i;

			getInfo();

			for (i = 0; i < things.eventTypes.length; i++) {
				events.add(document, things.eventTypes[i], eventListener);
			}
		});

	things.debugs.push(debug);
});
