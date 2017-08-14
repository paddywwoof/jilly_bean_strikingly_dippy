import time
from math import PI, sin, cos, atan2, acos, floor
from random import randint

class Geo():
  def __init__(self):
    self.ctx = document.getElementById("myCanvas").getContext("2d")
    self.W = 0.98 * max(document.documentElement.clientWidth, window.innerWidth or 0)
    self.H = 0.6 * max(document.documentElement.clientHeight, window.innerHeight or 0)
    self.ctx.canvas.width = self.W
    self.ctx.canvas.height = self.H
    self.grdnt = None
    self.generateRainbow()
    self.ctx.strokeStyle = "red"
    self.ctx.font = "30px Arial"
    self.diptxt = document.querySelector('.diptxt')
    self.logtxt = document.querySelector('.logtxt')
    self.logtxt.innerHTML = ""
    
    self.xrs = []
    self.yrs = []
    self.zcrs = []
    self.zsrs = [] # hold as cos and sin to avoid jump 359 -> 0
    self.xs = []
    self.ys = []
    self.zs = []
    self.xadj = self.yadj = self.zadj = 0.0 # angle offsets
    
    self.g = None # unit vector straight down
    self.h = None # unit vector horizontal in plane of phone
    self.m = None # unit vector pointing magnetic north horizontally
    self.stk = 0.0
    self.stk180 = None
    self.dip = 0.0
    self.cpoints = ["N","NE","E","SE","S","SW","W","NW"]
    self.latitude = self.longitude = self.altitude = None

    window.addEventListener('deviceorientation', self.handleOrientation)
    document.addEventListener('deviceready', self.onDeviceReady, False)

  def generateRainbow(self):
    ##################################################################
    def rand_hex():
      ix = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F']
      xx = ''
      num = randint(16, 255)
      for i in (1, 0):
        xx += ix[int(num / 16 ** i) % 16]
      return xx

    self.grdnt = self.ctx.createLinearGradient(0, -0.5 * self.H, 0, 0.5 * self.H)
    for i in range(6):
      clr = '#{}{}{}'.format(rand_hex(), rand_hex(), rand_hex())
      self.grdnt.addColorStop(i / 6.0, clr)
    self.ctx.fillStyle = self.grdnt
  
  def logReading(self):
    ##################################################################
    self.logtxt.innerHTML += " strike: {} {} dip: {}\n...{} lat: {} lon: {} alt {}".format(
                          round(self.stk, 1), self.stk180, round(self.dip, 1),
                          time.strftime("%d %b %Y %H:%M:%S"),
                          self.latitude, self.longitude, self.altitude)
    self.generateRainbow()

  def calibrate(self):
    ##################################################################
    self.xadj = self.medianMean(self.xrs, 0.0)
    self.yadj = self.medianMean(self.yrs, 0.0)
    self.zadj = atan2(self.medianMean(self.zsrs, -1.0),
                           self.medianMean(self.zcrs, 0.0)) + 0.5 * PI

  def medianMean(self, arr, val):
    # return median of values ########################################
    NUM = 25
    END = 3
    arr.append(val)
    if len(arr) > NUM:
      del(arr[0])
    elif len(arr) < (2 * END + 1):
      return val
    newarr = sorted(arr[:])  # create clone otherwise sorts in place
    return sum(newarr[END:-END]) / (newarr.length - 2 * END)

  def dot(self, a, b):
    ## dot product two 3D vectors ####################################
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

  def cross(self, a, b):
    ## cross product two 3D vectors ##################################
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]

  def norm(self, a):
    ## normalize a 3D vector #########################################
    mag = (a[0] * a[0] + a[1] * a[1] + a[2] * a[2]) ** 0.5
    return [a[0] / mag, a[1] / mag, a[2] / mag]

  def taitBryan(self, a, x, y, z):
    ## rotate 3D vector a using Tait Bryan Z,Y',X'' x,y,z in degrees
    ##################################################################
    x *= -PI / 180.0
    y *= -PI / 180.0
    z *= PI / 180.0
    sx = sin(x)
    cx = cos(x)
    sy = sin(y)
    cy = cos(y)
    sz = sin(z)
    cz = cos(z)
    return [(cy * cz) * a[0]                + (-cy * sz) * a[1]               + (sy) * a[2],
            (cx * sz + cz * sx * sy) * a[0] + (cx * cz - sx * sy * sz) * a[1] + (-cy * sx) * a[2],
            (sx * sz - cx * cz * sy) * a[0] + (cz * sx + cx * sy * sz) * a[1] + (cx * cy) * a[2]]

  def handleOrientation(self, event):
    ## rotation accelerometer and magnetometer changes ###############
    ##################################################################
    x = self.medianMean(self.xrs, event.beta) - self.xadj
    y = self.medianMean(self.yrs, event.gamma) - self.yadj
    a = event.alpha * PI / 180.0
    z = atan2(self.medianMean(self.zsrs, sin(a)),
              self.medianMean(self.zcrs, cos(a))) - self.zadj
    z = (630.0 - z * 180.0 / PI) % 360.0
    self.m = self.taitBryan([0, -1, 0], x, y, z)
    self.g = self.taitBryan([0, 0, 1], x, y, z)
    self.h = self.norm([-self.g[1], self.g[0], 0])
    self.dip = ((self.g[0] * self.g[0] + self.g[1] * self.g[1]) /
                 (self.g[0] ** 2 + self.g[1] ** 2 + self.g[2] ** 2)) ** 0.5
    self.dip = 90.0 - acos(self.dip) * 180.0 / PI
    self.stk = (450.0 - atan2(self.dot(self.m, self.h), self.dot(self.m, self.cross(self.g, self.h))) * 180.0 / PI) % 360.0
    self.stk180 = "({} {})".format(round(self.stk if self.stk < 180.0 else self.stk - 180.0, 1),
                         self.cpoints[floor((self.stk + 112.5) / 45.0) % 8])
    self.diptxt.innerHTML = "- strike: {} {}\n- dip: {}".format(
                                        round(self.stk, 1), self.stk180, round(self.dip, 1))
    x = max(-90, min(90, x))
    x += 90
    y += 90

    ngl = atan2(-self.h[1], -self.h[0])
    self.ctx.setTransform(1, 0, 0, 1, 0, 0)
    self.ctx.clearRect(0, 0, self.W, self.H)

    self.ctx.translate(self.W/2, self.H/2)
    self.ctx.rotate(-ngl)
    self.ctx.beginPath()
    self.ctx.moveTo(-self.W, 0)
    self.ctx.lineTo(-25, 0)
    self.ctx.lineTo(-10, 2.25 * self.dip)
    self.ctx.lineTo(-22, 2.0 * self.dip)
    self.ctx.lineTo(-3, 5.0 * self.dip)
    self.ctx.lineTo(8, 2.5 * self.dip)
    self.ctx.lineTo(18, 2.75 * self.dip)
    self.ctx.lineTo(25, 0)
    self.ctx.lineTo(self.W, 0)
    self.ctx.lineTo(self.W, -self.H)
    self.ctx.lineTo(-self.W, -self.H)
    self.ctx.closePath()
    self.ctx.fill()

    self.ctx.fillText('Jilly Bean - Strikingly Dippy', -200, 0.5 * self.H)

    ngl = PI * (z + 180.0) / 180.0
    offx = self.W * (0.1 + 0.8 * y / 180) # switched x, y
    offy = self.H * (0.1 + 0.8 * x / 180)
    self.ctx.setTransform(1, 0, 0, 1, 0, 0)
    self.ctx.translate(offx, offy)
    self.ctx.rotate(-ngl)
    self.ctx.beginPath()
    self.ctx.moveTo(0, 50)
    self.ctx.lineTo(-20, -50)
    self.ctx.lineTo(20, -50)
    self.ctx.closePath()
    self.ctx.fill()
    self.ctx.stroke()

  def onSuccess(self, position):
    ##################################################################
    self.latitude = position.coords.latitude
    self.longitude = position.coords.longitude
    self.altitude = position.coords.altitude
    #alert('Latitude: ' + latitude + '\n' +
    #      'Longitude: ' + longitude + '\n' +
    #      'Altitude: ' + altitude);*/
    #      /*'Accuracy: '          + position.coords.accuracy          + '\n' +
    #      'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
    #      'Heading: '           + position.coords.heading           + '\n' +
    #      'Speed: '             + position.coords.speed             + '\n' +
    #      'Timestamp: '         + position.timestamp                + '\n');

  def onError(self, error):
    ##################################################################
      alert('code: '    + error.code    + '\n' +
            'message: ' + error.message + '\n')

  def onDeviceReady(self):
    ##################################################################
    console.log("navigator.geolocation works well")
    #/*navigator.geolocation.getCurrentPosition(onSuccess, onError, 
    #              {maximumAge: 60000, timeout: 5000, enableHighAccuracy: true});*/
    #// getCurrentPosition() doesn't seem to work with GPS on android!
    self.watchId = navigator.geolocation.watchPosition(self.onSuccess, self.onError, 
                  {maximumAge: 60000, timeout: 10000, enableHighAccuracy: true})

geo = Geo()
