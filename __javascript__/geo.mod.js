	(function () {
		var time = {};
		__nest__ (time, '', __init__ (__world__.time));
		var PI = __init__ (__world__.math).PI;
		var sin = __init__ (__world__.math).sin;
		var cos = __init__ (__world__.math).cos;
		var atan2 = __init__ (__world__.math).atan2;
		var acos = __init__ (__world__.math).acos;
		var floor = __init__ (__world__.math).floor;
		var randint = __init__ (__world__.random).randint;
		var Geo = __class__ ('Geo', [object], {
			get __init__ () {return __get__ (this, function (self) {
				self.ctx = document.getElementById ('myCanvas').getContext ('2d');
				self.W = 0.98 * max (document.documentElement.clientWidth, window.innerWidth || 0);
				self.H = 0.6 * max (document.documentElement.clientHeight, window.innerHeight || 0);
				self.ctx.canvas.width = self.W;
				self.ctx.canvas.height = self.H;
				self.grdnt = null;
				self.generateRainbow ();
				self.ctx.strokeStyle = 'red';
				self.ctx.font = '30px Arial';
				self.diptxt = document.querySelector ('.diptxt');
				self.logtxt = document.querySelector ('.logtxt');
				self.logtxt.innerHTML = '';
				self.xrs = list ([]);
				self.yrs = list ([]);
				self.zcrs = list ([]);
				self.zsrs = list ([]);
				self.xs = list ([]);
				self.ys = list ([]);
				self.zs = list ([]);
				var __left0__ = 0.0;
				self.xadj = __left0__;
				self.yadj = __left0__;
				self.zadj = __left0__;
				self.g = null;
				self.h = null;
				self.m = null;
				self.stk = 0.0;
				self.stk180 = null;
				self.dip = 0.0;
				self.cpoints = list (['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']);
				var __left0__ = null;
				self.latitude = __left0__;
				self.longitude = __left0__;
				self.altitude = __left0__;
				window.addEventListener ('deviceorientation', self.handleOrientation);
				document.addEventListener ('deviceready', self.onDeviceReady, false);
			});},
			get generateRainbow () {return __get__ (this, function (self) {
				var rand_hex = function () {
					var ix = list (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F']);
					var xx = '';
					var num = randint (16, 255);
					var __iterable0__ = tuple ([1, 0]);
					for (var __index0__ = 0; __index0__ < __iterable0__.length; __index0__++) {
						var i = __iterable0__ [__index0__];
						xx += ix [__mod__ (int (num / Math.pow (16, i)), 16)];
					}
					return xx;
				};
				self.grdnt = self.ctx.createLinearGradient (0, -(0.5) * self.H, 0, 0.5 * self.H);
				for (var i = 0; i < 6; i++) {
					var clr = '#{}{}{}'.format (rand_hex (), rand_hex (), rand_hex ());
					self.grdnt.addColorStop (i / 6.0, clr);
				}
				self.ctx.fillStyle = self.grdnt;
			});},
			get logReading () {return __get__ (this, function (self) {
				self.logtxt.innerHTML += ' strike: {} {} dip: {}\n...{} lat: {} lon: {} alt {}'.format (round (self.stk, 1), self.stk180, round (self.dip, 1), time.strftime ('%d %b %Y %H:%M:%S'), self.latitude, self.longitude, self.altitude);
				self.generateRainbow ();
			});},
			get calibrate () {return __get__ (this, function (self) {
				self.xadj = self.medianMean (self.xrs, 0.0);
				self.yadj = self.medianMean (self.yrs, 0.0);
				self.zadj = atan2 (self.medianMean (self.zsrs, -(1.0)), self.medianMean (self.zcrs, 0.0)) + 0.5 * PI;
			});},
			get medianMean () {return __get__ (this, function (self, arr, val) {
				var NUM = 25;
				var END = 3;
				arr.append (val);
				if (len (arr) > NUM) {
					delete arr [0];
				}
				else if (len (arr) < 2 * END + 1) {
					return val;
				}
				var newarr = sorted (arr.__getslice__ (0, null, 1));
				return sum (newarr.__getslice__ (END, -(END), 1)) / (newarr.length - 2 * END);
			});},
			get dot () {return __get__ (this, function (self, a, b) {
				return (a [0] * b [0] + a [1] * b [1]) + a [2] * b [2];
			});},
			get cross () {return __get__ (this, function (self, a, b) {
				return list ([a [1] * b [2] - a [2] * b [1], a [2] * b [0] - a [0] * b [2], a [0] * b [1] - a [1] * b [0]]);
			});},
			get norm () {return __get__ (this, function (self, a) {
				var mag = Math.pow ((a [0] * a [0] + a [1] * a [1]) + a [2] * a [2], 0.5);
				return list ([a [0] / mag, a [1] / mag, a [2] / mag]);
			});},
			get taitBryan () {return __get__ (this, function (self, a, x, y, z) {
				x *= -(PI) / 180.0;
				y *= -(PI) / 180.0;
				z *= PI / 180.0;
				var sx = sin (x);
				var cx = cos (x);
				var sy = sin (y);
				var cy = cos (y);
				var sz = sin (z);
				var cz = cos (z);
				return list ([((cy * cz) * a [0] + (-(cy) * sz) * a [1]) + sy * a [2], ((cx * sz + (cz * sx) * sy) * a [0] + (cx * cz - (sx * sy) * sz) * a [1]) + (-(cy) * sx) * a [2], ((sx * sz - (cx * cz) * sy) * a [0] + (cz * sx + (cx * sy) * sz) * a [1]) + (cx * cy) * a [2]]);
			});},
			get handleOrientation () {return __get__ (this, function (self, event) {
				var x = self.medianMean (self.xrs, event.beta) - self.xadj;
				var y = self.medianMean (self.yrs, event.gamma) - self.yadj;
				var a = (event.alpha * PI) / 180.0;
				var z = atan2 (self.medianMean (self.zsrs, sin (a)), self.medianMean (self.zcrs, cos (a))) - self.zadj;
				var z = __mod__ (630.0 - (z * 180.0) / PI, 360.0);
				self.m = self.taitBryan (list ([0, -(1), 0]), x, y, z);
				self.g = self.taitBryan (list ([0, 0, 1]), x, y, z);
				self.h = self.norm (list ([-(self.g [1]), self.g [0], 0]));
				self.dip = Math.pow ((self.g [0] * self.g [0] + self.g [1] * self.g [1]) / ((Math.pow (self.g [0], 2) + Math.pow (self.g [1], 2)) + Math.pow (self.g [2], 2)), 0.5);
				self.dip = 90.0 - (acos (self.dip) * 180.0) / PI;
				self.stk = __mod__ (450.0 - (atan2 (self.dot (self.m, self.h), self.dot (self.m, self.cross (self.g, self.h))) * 180.0) / PI, 360.0);
				self.stk180 = '({} {})'.format (round ((self.stk < 180.0 ? self.stk : self.stk - 180.0), 1), self.cpoints [__mod__ (floor ((self.stk + 112.5) / 45.0), 8)]);
				self.diptxt.innerHTML = '- strike: {} {}\n- dip: {}'.format (round (self.stk, 1), self.stk180, round (self.dip, 1));
				var x = max (-(90), min (90, x));
				x += 90;
				y += 90;
				var ngl = atan2 (-(self.h [1]), -(self.h [0]));
				self.ctx.setTransform (1, 0, 0, 1, 0, 0);
				self.ctx.clearRect (0, 0, self.W, self.H);
				self.ctx.translate (self.W / 2, self.H / 2);
				self.ctx.rotate (-(ngl));
				self.ctx.beginPath ();
				self.ctx.moveTo (-(self.W), 0);
				self.ctx.lineTo (-(25), 0);
				self.ctx.lineTo (-(10), 2.25 * self.dip);
				self.ctx.lineTo (-(22), 2.0 * self.dip);
				self.ctx.lineTo (-(3), 5.0 * self.dip);
				self.ctx.lineTo (8, 2.5 * self.dip);
				self.ctx.lineTo (18, 2.75 * self.dip);
				self.ctx.lineTo (25, 0);
				self.ctx.lineTo (self.W, 0);
				self.ctx.lineTo (self.W, -(self.H));
				self.ctx.lineTo (-(self.W), -(self.H));
				self.ctx.closePath ();
				self.ctx.fill ();
				self.ctx.fillText ('Jilly Bean - Strikingly Dippy', -(200), 0.5 * self.H);
				var ngl = (PI * (z + 180.0)) / 180.0;
				var offx = self.W * (0.1 + (0.8 * y) / 180);
				var offy = self.H * (0.1 + (0.8 * x) / 180);
				self.ctx.setTransform (1, 0, 0, 1, 0, 0);
				self.ctx.translate (offx, offy);
				self.ctx.rotate (-(ngl));
				self.ctx.beginPath ();
				self.ctx.moveTo (0, 50);
				self.ctx.lineTo (-(20), -(50));
				self.ctx.lineTo (20, -(50));
				self.ctx.closePath ();
				self.ctx.fill ();
				self.ctx.stroke ();
			});},
			get onSuccess () {return __get__ (this, function (self, position) {
				self.latitude = position.coords.latitude;
				self.longitude = position.coords.longitude;
				self.altitude = position.coords.altitude;
			});},
			get onError () {return __get__ (this, function (self, error) {
				alert ((((('code: ' + error.code) + '\n') + 'message: ') + error.message) + '\n');
			});},
			get onDeviceReady () {return __get__ (this, function (self) {
				console.log ('navigator.geolocation works well');
				self.watchId = navigator.geolocation.watchPosition (self.onSuccess, self.onError, dict ([[maximumAge, 60000], [timeout, 10000], [enableHighAccuracy, py_true]]));
			});}
		});
		var geo = Geo ();
		__pragma__ ('<use>' +
			'math' +
			'random' +
			'time' +
		'</use>')
		__pragma__ ('<all>')
			__all__.Geo = Geo;
			__all__.PI = PI;
			__all__.acos = acos;
			__all__.atan2 = atan2;
			__all__.cos = cos;
			__all__.floor = floor;
			__all__.geo = geo;
			__all__.randint = randint;
			__all__.sin = sin;
		__pragma__ ('</all>')
	}) ();
