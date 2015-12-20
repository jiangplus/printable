var Vue = require('vue');
var Rx = require('rx');
var _ = require('lodash');

// var source = Rx.Observable.range(1, 5).map(x => x * x);

var source = Rx.Observable.create(function (observer) {
  // Yield a single value and complete
  observer.onNext(42);
  observer.onCompleted();

  // Any cleanup logic might go here
  return function () {
    console.log('disposed');
  }
});

// Prints out each item
var subscription = source.subscribe(
  function (x) { console.log('onNext: %s', x); },
  function (e) { console.log('onError: %s', e); },
  function () { console.log('onCompleted'); });


// convert SVG to Canvas
function convert(svg, cb) {
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var image = new Image();

  image.onload = function load() {
    canvas.height = image.height;
    canvas.width = image.width;
    ctx.drawImage(image, 0, 0);
    cb(canvas);
  };
  
  image.src = 'data:image/svg+xml;base64,' + btoa(new XMLSerializer().serializeToString(svg));
};

// download text content
function downloadFile(fileName, content){
    var aLink = document.createElement('a');
    var blob = new Blob([content]);
    var evt = document.createEvent("HTMLEvents");
    evt.initEvent("click", false, false);
    aLink.download = fileName;
    aLink.href = URL.createObjectURL(blob);
    aLink.dispatchEvent(evt);
}

// download image content
var saveFile = function(data, filename){
    var save_link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
    save_link.href = data;
    save_link.download = filename;
   
    var event = document.createEvent('MouseEvents');
    event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    save_link.dispatchEvent(event);
};

var initLayers = [
      {
        name: 'layer-1',
        active: false,
        visible: true,
        shapes: [
        {
          id: '2',
          name: 'line',
          x1: 10,
          y1: 20,
          x2: 100,
          y2: 200,
          selected: false,
          removed: false
        },
        ]
      },
      {
        name: 'layer-2',
        active: true,
        visible: true,
        shapes: [
        {
          id: '0',
          name: 'circle',
          cx: 150,
          cy: 250,
          r: 75,
          selected: false,
          removed: false
        },
        {
          id: '1',
          name: 'rect',
          x: 10,
          y: 20,
          width: 200,
          height: 100,
          selected: false,
          removed: false
        },
        ]
      },
    ]

var board = new Vue({
  el: '#board',
  debug: true,
  data: {
    name: 'printable',
    tool: 'select',
    fileFieldListened: false,
    obj: {},
    topmenu: '',
    dragging: false,
    normalize: true,
    measure: false,
    measurex1: 0,
    measurey1: 0,
    measurex2: 0,
    measurey2: 0,
    showGrid: true,
    gridify: true,
    deltaX: 0,
    deltaY: 0,
    offsetX: 0,
    offsetY: 0,
    viewBoxX: 0,
    viewBoxY: 0,
    viewBoxWidth: 600,
    viewBoxHeight: 600,
    shapes: [],
    layers: initLayers
  },
  computed: {
    world: function() {
      return JSON.stringify(this.$data);
    },
    viewBox: function() {
      return [this.viewBoxX, this.viewBoxY, this.viewBoxWidth, this.viewBoxHeight].join(' ');
    }
  },
  created: function() {
    this.shapes = this.layers[1].shapes

    
  },
  methods: {
    toggleMenu: function(menu) {

      if (this.topmenu == menu) this.topmenu = '';
      else this.topmenu = menu;
    },
    onTool: function(tool) {

      if (tool == 'normalize') {
        this.normalize = !this.normalize
        return
      }

      if (tool == 'delete') {
        this.obj.removed = true
        return
      }

      if (tool == 'grid') {
        this.showGrid = !this.showGrid
        return
      }

      if (tool == 'zoom') {
        this.viewBoxWidth += 20
        this.viewBoxHeight += 20
        return
      }

      if (tool == 'zoomin') {
        this.viewBoxWidth -= 20
        this.viewBoxHeight -= 20
        return
      }

      if (tool == 'zoomout') {
        this.viewBoxWidth += 20
        this.viewBoxHeight += 20
        return
      }

      if (tool == 'dumpSVG') {
        var content = document.querySelector('svg.canvas').outerHTML
        content = content.replace('svg', "svg xmlns='http://www.w3.org/2000/svg'")
        downloadFile('dump.svg', content)
        return
      }

      if (tool == 'dumpJSON') {
        var content = JSON.stringify(this.layers)
        downloadFile('dump.json', content)
        return
      }

      if (tool == 'loadJSON') {
        var self = this;
        var fileField = document.getElementById('fileField')
        if (!this.fileFieldListened) {
          fileField.addEventListener('change', function(x) {
          if (x.target.files.length > 0) {
              var file = x.target.files[0];
              window.target = file
              var fileReader = new FileReader();
              fileReader.onload = function(evt){
                  console.log(this.result)
                  self.layers = JSON.parse(this.result)
                  self.shapes = self.layers[0].shapes
                  self.obj = {}
              }
              fileReader.readAsText(file);
          }
          }, false);
        }
        fileField.click()
        return
      }

      if (tool == 'dumpPNG') {
        var svg = document.querySelector('svg.canvas');

        convert(svg, function thumbnail(canvas) {
          var imgData = canvas.toDataURL();
          imgData = imgData.replace('image/png','image/octet-stream');
          var filename = 'file_' + (new Date()).getTime() + '.' + 'png';
          saveFile(imgData,filename);
        });
        return
      }

      if (tool == 'dumpCSV') {
        var svg = document.querySelector('svg.canvas');

        convert(svg, function thumbnail(canvas) {
          var ctx = canvas.getContext('2d');
          var data = ctx.getImageData(0,0,600,600).data;

          var result = [];

          for(var i=0;i<data.length;i+=4){
            var color = data[i] + data[i+1] + data[i+2] + data[i+3]
            if (i > 0 && i % 600*4 == 0) {
              result.push("\n")
            }
            result.push((color > 0) ? 1 : 0)
          }
          
          downloadFile('export.csv', result.join(','))

        });
        return
      }

      this.tool = tool

    },
    deleteLayer: function(ev) {
    },
    newLayer: function(ev) {
      var layerName = 'layer-' + this.layers.length
      var layer = {
        name: layerName,
        active: true,
        visible: true,
        shapes: []
      }
      var oldLayer = _.find(this.layers, { 'active': true })
      oldLayer.active = false

      this.layers.push(layer);
      this.shapes = layer.shapes;
    },
    selectLayer: function(ev, layer) {
      var oldLayer = _.find(this.layers, { 'active': true })
      oldLayer.active = false
      layer.active = true;
      this.shapes = layer.shapes;
    },
    onBoardMouseDown: function(ev) {
      this.deltaX = ev.offsetX - this.offsetX;
      this.deltaY = ev.offsetY - this.offsetY;
      this.offsetX = ev.offsetX;
      this.offsetY = ev.offsetY;
      
      this.dragging = true;

      if (this.tool == 'measure') {
        this.measure = true;
        this.measurex1 = this.offsetX;
        this.measurey1 = this.offsetY;
        this.measurex2 = this.offsetX;
        this.measurey2 = this.offsetY;
        return 
      }


// var source = Rx.Observable.create(function (observer) {
//   // Yield a single value and complete
//   observer.onNext(ev);
//   observer.onCompleted();

//   // Any cleanup logic might go here
//   return function () {
//     console.log('disposed');
//   }
// });

// // Prints out each item
// var subscription = source.subscribe(
//   function (x) { console.log('onNext: %s', x); },
//   function (e) { console.log('onError: %s', e); },
//   function () { console.log('onCompleted'); });


      if (ev.target && !ev.target.attributes['data-id'] || ev.target && ev.target.attributes['data-id'] && this.obj && ev.target.attributes['data-id'] != this.obj.id) {
        this.obj.selected = false
      }

      if (ev.target && !ev.target.attributes['data-id']) {
        this.obj.selected = false
        this.obj = {}
      } else if (ev.target && ev.target.attributes['data-id'] && this.obj && ev.target.attributes['data-id'] != this.obj.id) {
        this.obj.selected = false

        var target_id = ev.target.attributes['data-id'].value;
        this.obj = _.find(this.shapes, { 'id': target_id })
        if (this.obj) this.obj.selected = true
        else this.obj = {}
      }

      if (this.tool == 'rectangle') {
        var new_id = this.shapes.length.toString()
        var shape = {
          id: new_id,
          name: 'rect',
          x: this.offsetX,
          y: this.offsetY,
          width: 1,
          height: 1,
          selected: true,
          removed: false
        };
        this.obj = shape;
        this.shapes.push(shape);
        return 
      }

      if (this.tool == 'circle') {
        var new_id = this.shapes.length.toString()
        var shape = {
          id: new_id,
          name: 'circle',
          cx: this.offsetX,
          cy: this.offsetY,
          r: 1,
          selected: true,
          removed: false
        };
        this.obj = shape;
        this.shapes.push(shape);
        return 
      }

      if (this.tool == 'line') {
        var new_id = this.shapes.length.toString()
        var shape = {
          id: new_id,
          name: 'line',
          x1: this.offsetX,
          y1: this.offsetY,
          x2: this.offsetX,
          y2: this.offsetY,
          selected: true,
          removed: false
        };
        this.obj = shape;
        this.shapes.push(shape);
        return 
      }
    },
    onBoardMouseUp: function(ev) {
      this.deltaX = ev.offsetX - this.offsetX;
      this.deltaY = ev.offsetY - this.offsetY;
      this.offsetX = ev.offsetX;
      this.offsetY = ev.offsetY;
      this.dragging = false;

      if (this.tool == 'measure' && this.measure) {
        return 
      }
    },
    onBoardMouseMove: function(ev) {
      this.deltaX = ev.offsetX - this.offsetX;
      this.deltaY = ev.offsetY - this.offsetY;
      this.offsetX = ev.offsetX;
      this.offsetY = ev.offsetY;
      
      if (this.dragging) {

        if (this.tool == 'pan') {
          this.viewBoxX -= this.deltaX;
          this.viewBoxY -= this.deltaY;
          return
        }

        if (this.tool == 'moveLayer' && this.deltaX && this.deltaY) {
          var self = this;
          this.shapes.forEach(function(shape){
            if (shape.name == 'rect') {
              shape.x += self.deltaX;
              shape.y += self.deltaY;
              console.log(shape.x)
            } else if (shape.name == 'circle') {
              shape.cx += self.deltaX;
              shape.cy += self.deltaY;
            } else if (shape.name == 'line') {
              shape.x1 += self.deltaX;
              shape.y1 += self.deltaY;
              shape.x2 += self.deltaX;
              shape.y2 += self.deltaY;
            }
          })
          return 
        }

      if (this.tool == 'measure' && this.measure) {
        this.measurex2 = this.offsetX;
        this.measurey2 = this.offsetY;
        return 
      }

        // creating normalized shapes
        if (this.tool == 'rectangle' && this.obj.id && this.normalize) {
          var shape = this.obj
          shape.width = (this.offsetX - shape.x)
          shape.height = shape.width
          return 
        }

        if (this.tool == 'line' && this.obj.id && this.normalize) {
          var shape = this.obj
          if (Math.abs(this.offsetY - shape.y1) < Math.abs(this.offsetX - shape.x1) / 2) {
            shape.x2 = this.offsetX
          } else if (Math.abs(this.offsetX - shape.x1) < Math.abs(this.offsetY - shape.y1) / 2) {
            shape.y2 = this.offsetY
          } else {
            shape.x2 = this.offsetX
            var lng = this.offsetX - shape.x1
            shape.y2 = shape.y1 + Math.abs(lng) * (this.offsetY >= shape.y1 ? 1 : -1)
          }
          return 
        }

        // creating shapes
        if (this.tool == 'circle' && this.obj.id) {
          var shape = this.obj
          if (shape.r > 0) shape.r += this.deltaX
          return 
        }

        if (this.tool == 'rectangle' && this.obj.id) {
          var shape = this.obj
          shape.width += this.deltaX
          shape.height += this.deltaY
          return 
        }

        if (this.tool == 'line' && this.obj.id) {
          var shape = this.obj
          shape.x2 += this.deltaX
          shape.y2 += this.deltaY
          return 
        }

        // dragging shapes
        if (this.obj && this.obj.name) {
          var shape = this.obj

          if (shape.name == 'rect') {
            shape.x += this.deltaX
            shape.y += this.deltaY
          } else if (shape.name == 'circle') {
            shape.cx += this.deltaX
            shape.cy += this.deltaY
          } else if (shape.name == 'line') {
            shape.x1 += this.deltaX
            shape.y1 += this.deltaY
            shape.x2 += this.deltaX
            shape.y2 += this.deltaY
          }
        } else {

        }
      } else {
        // console.log('move')
      }
    },
  },
  components: {
    'layyer' : {
      props: {
        layer: Object,
      } ,
      template: '#layyer-template',
      components: {
        'shape' : {
          props: {
            shape: Object,
          } ,
          template: '#shape-template',
        }
      }
    }
  }
})
