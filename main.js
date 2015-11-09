var Vue = require('vue');
var _ = require('lodash');


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

function downloadFile(fileName, content){
    var aLink = document.createElement('a');
    var blob = new Blob([content]);
    var evt = document.createEvent("HTMLEvents");
    evt.initEvent("click", false, false);
    aLink.download = fileName;
    aLink.href = URL.createObjectURL(blob);
    aLink.dispatchEvent(evt);
}

var saveFile = function(data, filename){
    var save_link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
    save_link.href = data;
    save_link.download = filename;
   
    var event = document.createEvent('MouseEvents');
    event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    save_link.dispatchEvent(event);
};

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
    deltaX: 0,
    deltaY: 0,
    posX: 0,
    posY: 0,
    // viewBox: '0 0 600 600',
    viewBoxX: 0,
    viewBoxY: 0,
    viewBoxWidth: 600,
    viewBoxHeight: 600,
    shapes: [
    ],
    layers: [
      {
        name: 'layer-1',
        active: true,
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
        active: false,
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
  },
  computed: {
    world: function() {
      return JSON.stringify(this.$data);
    },
    viewBox: function() {
      return [this.viewBoxX, this.viewBoxY, this.viewBoxWidth, this.viewBoxHeight].join(' ');
      // console.log([this.viewBoxX, this.viewBoxY, this.viewBoxWidth, this.viewBoxHeight].join(' '))
      // return '0 0 300 300'
    }
  },
  created: function() {
    this.shapes = this.layers[0].shapes
  },
  methods: {
    toggleMenu: function(menu) {

      if (this.topmenu == menu) this.topmenu = '';
      else this.topmenu = menu;
    },
    onTool: function(tool) {

      if (tool == 'delete') {
        this.obj.removed = true
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
          console.log(x.target.files);
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
          
          console.log(result.length)
          console.log(result.join(','))
          downloadFile('export.csv', result.join(','))

        });
        return
      }

      this.tool = tool

    },
    doThat: function(ev) {
      // console.log('board')
      // console.log(ev.offsetX)
      // console.log(ev.offsetY)
      // console.log(ev.target)
      // console.log(ev)

    },
    doThis: function(ev, obj) {
      // console.log('shape')
      // console.log(ev)
      // console.log(this)
      // console.log(obj.name)
      // console.log(obj.x)
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
      //
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
      //
      console.log('down')
      this.dragging = true;

      if (ev.target && !ev.target.attributes['data-id'] || ev.target && ev.target.attributes['data-id'] && this.obj && ev.target.attributes['data-id'] != this.obj.id) {
        this.obj.selected = false
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
      //
      console.log('up')
      this.dragging = false;

      // clear rectangle or circle
      // this.obj.selected = false;
      // this.obj = {};
    },
    onBoardMouseMove: function(ev) {
      this.deltaX = ev.offsetX - this.offsetX;
      this.deltaY = ev.offsetY - this.offsetY;
      this.offsetX = ev.offsetX;
      this.offsetY = ev.offsetY;
      //
      // console.log(ev)
      if (this.dragging) {
        // console.log('drag')

        if (this.tool == 'pan') {
          this.viewBoxX -= this.deltaX;
          this.viewBoxY -= this.deltaY;
          return 
        }

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
          // console.log(ev.target)

        if (ev.target && ev.target.attributes['data-id']) {
          var target = ev.target;
          var target_id = ev.target.attributes['data-id'].value;
          var target_name = ev.target.tagName
          var shape = _.find(this.shapes, { 'id': target_id })

          if (!shape) return

          this.obj = shape
          shape.selected = true
          // console.log('id')
          // console.log(this.deltaX)
          console.log(target)
          console.log(shape)

          if (ev.target.tagName == 'rect') {
            shape.x += this.deltaX
            shape.y += this.deltaY
          } else if (ev.target.tagName == 'circle') {
            shape.cx += this.deltaX
            shape.cy += this.deltaY
          } else if (ev.target.tagName == 'line') {
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
    onBoardMouseDrag: function(ev) {
      //
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
            clicked: Function,
          } ,
          template: '#shape-template',
        }
      }
    }
  }
})
