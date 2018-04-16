'use strict';

AFRAME.registerComponent('sizing-tool', {
	schema: {
		hand: {}
	},
	init: function() {
		let self = this;
		let ruler = [['meters', 1], ['feet', 0.3048], ['inches', 0.0254], ['centimeters', 0.01], ['millimeters', 0.001], ['micrometers', 0.000001]];
		// ruler index
		let i = 0;
		let isHuman = false;
		let pickup = false;
		let yAxis;
		
		// Adjust the camera when in VR
		let camera = document.getElementById('cameraRig');
		document.addEventListener('enter-vr', function() {
			console.log("entering VR, adjusting camera");
			camera.setAttribute('position', '0 0 2');
		});
		
		// Left hand: teleport, scroll-scaling
		if (self.data.hand === 'left') {
			let last = null;
			// menu button
			self.el.addEventListener('menudown', function() {
				toggleHuman();
			});
			// trigger
			self.el.addEventListener('triggerdown', function() {
				changeSize();
			});

			// Fine-tune size 1% using the vive touchpad
			self.el.addEventListener('axismove', function(evt) {
				i = document.getElementById('model').getAttribute('ruler');
				let direction;
				// Ignore the first location to set a delta
				if (last === null) {
					last = evt.detail.axis[1];
					return;
				}
				// When finger leaves the touchpad, it resets to 0,0. Adjusts for this
				// This could cause a bug if the user hits true (0,0). Unlikely
				if ((evt.detail.axis[0] === 0) && (evt.detail.axis[1] === 0)) {
					last = null;
					return;
				}
				// Set 0.1 as a high-pass filter
				if (evt.detail.axis[1] > (last+0.1)) {
					direction = 1;
				} else if (evt.detail.axis[1] < (last-0.1)){
					direction = -1;
				} else {
					return;
				}
				let scale = document.getElementById('model').getAttribute('scale');
				for (let val in scale) {
					scale[val] += ruler[i][1]*direction*0.01;
				}
				document.getElementById('model').setAttribute('scale', scale);
				// Ready for next delta
				last = evt.detail.axis[1];

			});
		}
		// Right hand: move up/down

		if (self.data.hand === 'right') {
			// detect trackpad position for reference on trackpaddown
			self.el.addEventListener('axismove', function(evt) {
				yAxis = evt.detail.axis[1];
			});
			// trackpad button
			self.el.addEventListener('trackpaddown', function(evt) {
				if (yAxis > 0) {
					moveUp();
				} else {
					moveDown();
				}
			});
			
			document.addEventListener('keypress', function(evt) {	
				// Change size on log scale
				if (evt.key === ' ') {
					changeSize();
				}
				// Adjust y axis up 1 cm
				if (evt.key === 'q') {
					moveUp();
				}
				// Adjust y axis down 1 cm
				if (evt.key === 'e') {
					moveDown();
				}
				// Add a human for scale
				if (evt.key === 'h') {
					toggleHuman();
				}
				// Change if object can be picked up or not
				if (evt.key === 'p') {
					if (!pickup) {
						pickup = true;
						console.log('pickup ON');
					} else {
						pickup = false;
						console.log('pickup OFF');
					}
				}
				// Create JSON object
				if (evt.key === 'j') {
					console.log("generating JSON..");
					let doc = new Object();
					
					// Parse name from file path
					let name = document.getElementById('model').getAttribute('src');
					let period = name.split('.');
					let slash = period[0].split('/');
					// Create JSON using rounding to avoid scientific notation
					doc.name = slash[slash.length - 1];
					doc.uuid = "";
					doc.pickup = pickup;
					let test = document.getElementById('model').getAttribute('position').y;
					doc.offset = parseFloat(document.getElementById('model').getAttribute('position').y).toFixed(8);
					let position = document.getElementById('model').getAttribute('position');
					console.log(position);
					for (let val in position) {
						position[val] = parseFloat(position[val]).toFixed(8);
					}
					doc.position = position;
					let rotation = document.getElementById('model').getAttribute('rotation');
					for (let val in rotation) {
						rotation[val] = parseFloat(rotation[val]).toFixed(8);
					}
					doc.rotation = rotation;
					let scale = document.getElementById('model').getAttribute('scale');
					for (let val in scale) {
						scale[val] = parseFloat(scale[val]).toFixed(8);
					}
					doc.scale = scale;
					console.log(doc);
					// Download the JSON file, with formatting
					let json = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(doc, null, "    "));
					console.log(json);
					let el = document.getElementById('jsonlink');
					el.setAttribute('href', json);
					el.setAttribute('download', doc.name+'.json');
					el.click();
				}
			});
		
		
			// Fine-tune size by 1%
			document.addEventListener('wheel', function(evt) {
				i = document.getElementById('model').getAttribute('ruler');
				let direction;
				if (evt.deltaY > 0) {
					direction = 1;
				} else {
					direction = -1;
				}
				let scale = document.getElementById('model').getAttribute('scale');
				for (let val in scale) {
					scale[val] += ruler[i][1]*direction*0.01;
				}
				document.getElementById('model').setAttribute('scale', scale);
			});
		}
			
		// Change size on a log 
		function changeSize() {
			console.log("changing size..");
			if (i === (ruler.length-1)) {
				i = 0;
				console.log(ruler[i][0]);
				document.getElementById('model').setAttribute('scale', ruler[i][1]+' '+ruler[i][1]+' '+ruler[i][1]);
				document.getElementById('model').setAttribute('ruler', i);
			} else {
				i++;
				console.log(ruler[i][0]);
				document.getElementById('model').setAttribute('scale', ruler[i][1]+' '+ruler[i][1]+' '+ruler[i][1]);
				document.getElementById('model').setAttribute('ruler', i);
			}
		}
		
		function moveUp() {
			console.log("moving up..");
			let position = document.getElementById('model').getAttribute('position');
			position.y += 0.01;
			console.log(position.y);
			document.getElementById('model').setAttribute('position', position);
		}
		
		function moveDown() {
			console.log("moving down..");
			let position = document.getElementById('model').getAttribute('position');
			position.y -= 0.01;
			console.log(position.y);
			document.getElementById('model').setAttribute('position', position);
		}
		
		// Add a human for scale
		function toggleHuman() {
			if (!isHuman) {
				isHuman = true;
				console.log("adding human for scale");
				let el = document.createElement('a-obj-model');
				el.setAttribute('id', 'human');
				el.setAttribute('src', 'assets/human_male.obj');
				el.setAttribute('scale', '0.001 0.001 0.001');
				el.setAttribute('position', '0 0 0.5');
				el.setAttribute('rotation', '0 0 0');
				document.getElementsByTagName('a-scene')[0].appendChild(el);
			} else {
				isHuman = false;
				console.log("removing human..");
				let el = document.getElementById('human');
				document.getElementsByTagName('a-scene')[0].removeChild(el);
			}
		}
	}
});
