var Vue = require('vue');
var Bacon = require('baconjs');
var _ = require('lodash');
var Generator = require('firebase-auto-ids');

function createId() {
  return Generator(Date.now())
}

function str(x) {
  return JSON.stringify(x)
}

function roundGrid(x) {
  return Math.round(x / 10) * 10
}

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

// download image content
var saveFile = function(data, filename){
    var save_link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
    save_link.href = data;
    save_link.download = filename;
   
    var event = document.createEvent('MouseEvents');
    event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    save_link.dispatchEvent(event);
};

Vue.config.debug = true

Vue.component('line-shape', {
  template: '#line-shape-template',
  props: {
    parent: { type: String },
    layer: { type: String },
    shape: { type: Object }
  },
  data: function() {
    return {}
  },
  methods: {
    click: function(ev) {
        console.log(ev)
    }
  },
  computed: {
  }
})

Vue.component('rect-shape', {
  template: '#rect-shape-template',
  props: {
    parent: { type: String },
    layer: { type: String },
    shape: { type: Object }
  },
  data: function() {
    return {}
  },
  methods: {
    click: function(ev) {
        console.log(ev)
    }
  },
  computed: {
  }
})

Vue.component('circle-shape', {
  template: '#circle-shape-template',
  props: {
    parent: { type: String },
    layer: { type: String },
    shape: {type: Object },
  },
  data: function() {
    return {}
  },
  methods: {
    click: function(ev) {
        console.log(ev)
    }
  },
  computed: {
  }
})

Vue.component('group-shape', {
  template: '#group-shape-template',
  props: {
    parent: { type: String },
    shape: {type: Object },
  },
  data: function() {
    return {}
  },
  methods: {
    click: function(ev) {
        console.log(ev)
    }
  },
  computed: {
    transform: function() {
      return `translate(${this.shape.x} ${this.shape.y})`
    },
  }
})

var app = window.app = new Vue({
  el: '#board',
  debug: true,
  data: {
    name: 'delight',
    tool: 'select',
    view: 'component',
    obj: null,
    currentComponent: null,

    topmenu: '',

    fileFieldListened: false,

    viewBoxX: 0,
    viewBoxY: 0,
    viewBoxWidth: 0,
    viewBoxHeight: 0,
    originalViewBoxWidth: 0,
    originalViewBoxHeight: 0,

    deltaX: 0,
    deltaY: 0,
    deltaX2: 0,
    deltaY2: 0,
    offsetX: 0,
    offsetY: 0,
    dragStartX: 0,
    dragStartY: 0,
    rawOffsetX: 0,
    rawOffsetY: 0,
    dragging: false,

    normalize: false,
    gridify: true,
    showGrid: true,

    measure: false,
    measurex1: 0,
    measurey1: 0,
    measurex2: 0,
    measurey2: 0,

    components: [
        { 
        	name: 'component-1', 
        	id: createId(),
        	layers: [
        	  { 
        	    name: 'layer-1', 
        	    id: createId(), 
        	    visible: true,
        	    active: true,
        	    shapes: [
		          { type: 'rect-shape', id: createId(), radius: 30, x: 100, y: 100, width: 140, height: 160, selected: false, removed: false, },
		          { type: 'circle-shape', id: createId(), x: 120, y: 130, width: 100, height: 100, selected: false, removed: false, },
		        ]
        	  },
        	  { 
        	    name: 'layer-2', 
        	    id: createId(), 
        	    visible: true,
        	    active: false,
        	    shapes: [
		          { type: 'line-shape', id: createId(), x1: 50, y1: 250, x2: 590, y2: 250, selected: false, removed: false, },
		        ]
        	  },
        	],
        }

    ],

    shapes: [
      // { type: 'line-shape', id: createId(), x1: 200, y1: 300, x2: 440, y2: 300, selected: false, removed: false, },
      // { type: 'rect-shape', id: createId(), radius: 30, x: 400, y: 100, width: 140, height: 160, selected: false, removed: false, },
      // { type: 'circle-shape', id: createId(), x: 420, y: 130, width: 100, height: 100, selected: false, removed: false, },

    ]
  },
  computed: {
    viewBox: function() {
      return [this.viewBoxX, this.viewBoxY, this.viewBoxWidth, this.viewBoxHeight].join(' ');
    },
    gridCount: function() {
        return Math.round(this.viewBoxWidth / 10)
    },
  },
  created: function() {
    var rect = document.body.getBoundingClientRect()
    this.originalViewBoxWidth = Math.floor(rect.width)
    this.viewBoxWidth = Math.floor(rect.width)
    this.originalViewBoxHeight = Math.floor(rect.height)
    this.viewBoxHeight = Math.floor(rect.height)

    var comp = this.components[0]
    var group1 = { type: 'group-shape', id: createId(), x: 200, y: 300, selected: false, removed: false, component: null }
    var group2 = { type: 'group-shape', id: createId(), x: 200, y: 500, selected: false, removed: false, component: null }
    group1.component = comp
    group2.component = comp
    this.shapes.push(group1)
    this.shapes.push(group2)

    this.currentComponent = comp

    window.b = Bacon;

    var onup = Bacon.fromEvent(document.querySelector('#canvas'), "mouseup")
    var ondown = Bacon.fromEvent(document.querySelector('#canvas'), "mousedown")
    var onmove = Bacon.fromEvent(document.querySelector('#canvas'), "mousemove")

    onup.onValue((ev) => {
    	app.dragging = false
    })

    ondown.onValue((ev) => {
      app.dragging = true
      var zoomrate = app.viewBoxWidth / app.originalViewBoxWidth

      app.deltaX = ev.offsetX - app.rawOffsetX
      app.deltaY = ev.offsetY - app.rawOffsetY
      app.rawOffsetX = ev.offsetX
      app.rawOffsetY = ev.offsetY
      app.offsetX = (ev.offsetX * zoomrate + app.viewBoxX);
      app.offsetY = (ev.offsetY * zoomrate + app.viewBoxY);
      app.dragStartX = app.offsetX
      app.dragStartY = app.offsetY
    })

    onmove.onValue((ev) => {
      if (app.dragging) {
        var zoomrate = app.viewBoxWidth / app.originalViewBoxWidth
        app.deltaX = ev.offsetX - app.rawOffsetX
        app.deltaY = ev.offsetY - app.rawOffsetY
        app.rawOffsetX = ev.offsetX
        app.rawOffsetY = ev.offsetY
        app.offsetX = (ev.offsetX * zoomrate + app.viewBoxX);
        app.offsetY = (ev.offsetY * zoomrate + app.viewBoxY);
      }
    })


    onmove.filter(x => { return app.tool == 'select' && app.view == 'board' && app.dragging && app.obj }).onValue((ev) => {
    	console.log('board moving')
    	app.obj.x += app.deltaX
    	app.obj.y += app.deltaY
    })

    onmove.filter(x => { return app.tool == 'select' && app.view == 'component' && app.dragging && app.obj }).onValue((ev) => {
    	console.log('component moving')
    	app.obj.x += app.deltaX
    	app.obj.y += app.deltaY
    })

    
    ondown.filter(x => { return app.tool == 'component' && app.view == 'board' }).onValue((ev) => {
    	var group = { type: 'group-shape', id: createId(), x: ev.offsetX, y: ev.offsetY, selected: false, removed: false, component: null }
        group.component = this.currentComponent
        this.shapes.push(group)
        console.log(group)
    })

    // creating rect
    
    ondown.filter(x => { return app.tool == 'rect' }).onValue((ev) => {

      if (app.gridify) {
        app.offsetX = roundGrid(app.offsetX)
        app.offsetY = roundGrid(app.offsetY)
      }

      app.dragStartX = app.offsetX
      app.dragStartY = app.offsetY

      var shape = { type: 'rect-shape', id: createId(), radius: 30, x: ev.offsetX, y: ev.offsetY, width: 0, height: 0, selected: false, removed: false, }
      app.obj = shape;

      if (app.view == 'component') {
        var activeLayer = this.currentComponent.layers.find(x => { return x.active })
        activeLayer.shapes.push(shape)
      } else if (app.view == 'board') {
        app.shapes.push(shape);
      }
    })

    onmove.filter((ev) => { return app.dragging && app.tool == 'rect' && app.obj }).onValue(function(ev) {
      var shape = app.obj

      if (app.gridify) {
        app.offsetX = roundGrid(app.offsetX)
        app.offsetY = roundGrid(app.offsetY)
      }

      if (app.normalize) {
          shape.x = Math.min(app.offsetX, app.dragStartX)
          shape.y = Math.min(app.offsetY, app.dragStartY)
          shape.width = Math.abs(app.offsetX - app.dragStartX)
          shape.height = shape.width
      } else {
          shape.x = Math.min(app.offsetX, app.dragStartX)
          shape.y = Math.min(app.offsetY, app.dragStartY)
          shape.width = Math.abs(app.offsetX - app.dragStartX)
          shape.height = Math.abs(app.offsetY - app.dragStartY)
      }
    })

    onup.filter((ev) => { return app.tool == 'rect' && app.obj }).onValue(function(ev) {
      if (app.obj.width < 0.01) {
        app.obj.removed = true
        app.obj = null
      }
    })

    // extending canvas

    onmove.filter((ev) => { return app.dragging && app.offsetX > app.viewBoxWidth + app.viewBoxX - 50 }).onValue(function(ev) {
      app.viewBoxX += 5;
    })

    onmove.filter((ev) => { return app.dragging && app.offsetY > app.viewBoxHeight + app.viewBoxY - 50 }).onValue(function(ev) {
      app.viewBoxY += 5;
    })

    onmove.filter((ev) => { return app.dragging && app.offsetX < 50 + app.viewBoxX }).onValue(function(ev) {
      app.viewBoxX -= 5;
    })

    onmove.filter((ev) => { return app.dragging && app.offsetY < 50 + app.viewBoxY }).onValue(function(ev) {
      app.viewBoxY -= 5;
    })

    // zooming object

    ondown.filter((ev) => { return app.tool == 'zoomin' }).onValue(function(ev) {
      app.viewBoxWidth /= 1.10
      app.viewBoxHeight /= 1.10

      app.viewBoxX = app.offsetX - app.viewBoxWidth/2
      app.viewBoxY = app.offsetY - app.viewBoxHeight/2
    })

    ondown.filter((ev) => { return app.tool == 'zoomout' }).onValue(function(ev) {
      app.viewBoxWidth *= 1.10
      app.viewBoxHeight *= 1.10

      app.viewBoxX = app.offsetX - app.viewBoxWidth/2
      app.viewBoxY = app.offsetY - app.viewBoxHeight/2
    })

    // create circle

    ondown.filter((ev) => { return app.tool == 'circle' }).onValue(function(ev) {

      if (app.gridify) {
        app.offsetX = roundGrid(app.offsetX)
        app.offsetY = roundGrid(app.offsetY)
      }

      app.dragStartX = app.offsetX
      app.dragStartY = app.offsetY

      var shape = { type: 'circle-shape', id: createId(), x: app.offsetX, y: app.offsetY, width: 0, height: 0, selected: false, removed: false, }

      app.obj = shape;
      if (app.view == 'component') {
        var activeLayer = app.currentComponent.layers.find(x => { return x.active })
        activeLayer.shapes.push(shape)
      } else if (app.view == 'board') {
        app.shapes.push(shape);
      }

    })

    onmove.filter((ev) => { return app.dragging && app.tool == 'circle' && app.obj.id }).onValue(function(ev) {
      var shape = app.obj

      if (app.gridify) {
        app.offsetX = roundGrid(app.offsetX)
        app.offsetY = roundGrid(app.offsetY)
      }

      if (app.normalize) {
          shape.x = Math.min(app.offsetX, app.dragStartX)
          shape.y = Math.min(app.offsetY, app.dragStartY)
          shape.width = Math.abs(app.offsetX - app.dragStartX)
          shape.height = shape.width
      } else {
          shape.x = Math.min(app.offsetX, app.dragStartX)
          shape.y = Math.min(app.offsetY, app.dragStartY)
          shape.width = Math.abs(app.offsetX - app.dragStartX)
          shape.height = Math.abs(app.offsetY - app.dragStartY)
      }
    })

    onup.filter((ev) => { return app.tool == 'circle' && app.obj.id }).onValue(function(ev) {
      if (app.obj.width < 0.01) {
        app.obj.removed = true
        app.obj = {}
      }
    })

    // create line

    ondown.filter((ev) => { return app.tool == 'line' }).onValue(function(ev) {

      if (app.gridify) {
        app.offsetX = roundGrid(app.offsetX)
        app.offsetY = roundGrid(app.offsetY)
      }

      var shape = { type: 'line-shape', id: createId(), x1: app.offsetX, y1: app.offsetY, x2: app.offsetX, y2: app.offsetY, selected: false, removed: false, }

      app.obj = shape;
      if (app.view == 'component') {
        var activeLayer = app.currentComponent.layers.find(x => { return x.active })
        activeLayer.shapes.push(shape)
      } else if (app.view == 'board') {
        app.shapes.push(shape);
      }

    })

    onmove.filter((ev) => { return app.dragging && app.tool == 'line' && app.obj.id }).onValue(function(ev) {
      if (app.gridify) {
        app.offsetX = roundGrid(app.offsetX)
        app.offsetY = roundGrid(app.offsetY)
      }

      var shape = app.obj
          var x2 = app.offsetX
          var y2 = app.offsetY
          var rate0 = (y2-shape.y1)/(x2-shape.x1)
          var rate = Math.abs(rate0)

      if (app.normalize) {
        if (rate <= 0.5) {
           shape.x2 = x2
           shape.y2 = shape.y1
        } else if (rate >= 2) {
           shape.y2 = y2
           shape.x2 = shape.x1
        } else {
           shape.x2 = x2
           if (rate0 > 0) {
             shape.y2 = (x2 - shape.x1) + shape.y1
           } else {
             shape.y2 = (shape.x1 - x2) + shape.y1
           }
        }
      } else {
        shape.x2 = x2
        shape.y2 = y2
      }

    })

    onup.filter((ev) => { return app.tool == 'line' && app.obj.id }).onValue(function(ev) {
      if (Math.abs(app.obj.x2 - app.obj.x1) + Math.abs(app.obj.y2 - app.obj.y1) < 0.01) {
        app.obj.removed = true
        app.obj = {}
      }
    })

    ondown.filter(x => { return app.tool == 'select' && app.view == 'board' }).onValue((ev) => {
      var target_id = ev.target && ev.target.attributes['data-id'] && ev.target.attributes['data-id'].value;
      var parent_id = (target_id)? ev.target.attributes['data-parent-id'] && ev.target.attributes['data-parent-id'].value || null : null;

      console.log(target_id)
      console.log(parent_id)

      var target = (parent_id)? this.shapes.find(x => { return x.id == parent_id }) : this.shapes.find(x => { return x.id == target_id })

      console.log(target)

      if (!target) {
        this.clearSelect()
        this.obj = null
      } else if (target && this.obj && this.obj.id == target.id) {
      } else {
        this.clearSelect()
        target.selected = true
        this.obj = target
      }

    })

    ondown.filter(x => { return app.tool == 'select' && app.view == 'component' }).onValue((ev) => {
      var target_id = ev.target && ev.target.attributes['data-id'] && ev.target.attributes['data-id'].value;

      console.log('component')
      console.log(target_id)

      var target = null;

      this.currentComponent.layers.forEach(layer => {
      	layer.shapes.forEach(x => { if (x.id == target_id) { target = x } })
      }) 

      console.log(target)

      if (!target) {
        this.clearSelect()
        this.obj = null
      } else if (target && this.obj && this.obj.id == target.id) {
      } else {
        this.clearSelect()
        target.selected = true
        this.obj = target
      }

    })

    // measure

    ondown.filter((ev) => { return app.tool == 'measure' }).onValue(function(ev) {
      app.measure = true;
      app.measurex1 = app.offsetX;
      app.measurey1 = app.offsetY;
      app.measurex2 = app.offsetX;
      app.measurey2 = app.offsetY;
    })

    onmove.filter((ev) => { return app.dragging && app.tool == 'measure' }).onValue(function(ev) {
      app.measurex2 = app.offsetX;
      app.measurey2 = app.offsetY;
    })

    onup.filter((ev) => { return app.tool == 'measure' }).onValue(function(ev) {
      console.log(app.measurex1, app.measurey1, app.measurex2, app.measurey2)
    })

    // pan

    onmove.filter((ev) => { return app.dragging && app.tool == 'pan' }).onValue(function(ev) {
      app.viewBoxX -= app.deltaX;
      app.viewBoxY -= app.deltaY;
    })


  },
  methods: {
    setTool: function(tool) {

      if (tool == 'zoomin') {
      } else if (tool == 'dumpSVG') {
        var content = document.querySelector('svg#canvas').outerHTML
        content = content.replace('svg', "svg xmlns='http://www.w3.org/2000/svg'")
        downloadFile('dump.svg', content)
        return
      } else if (tool == 'dumpJSON') {
        var components_data = JSON.parse(JSON.stringify(this.components))
        var shapes_data = JSON.parse(JSON.stringify(this.shapes))
        shapes_data.forEach(x => {
          if (x.type == 'group-shape' && x.component) {
            x.componentId = x.component.id
            x.component = null
          }
        })
        var content = JSON.stringify({ shapes: shapes_data, components: components_data})
        downloadFile('dump.json', content)
        return
      } else if (tool == 'dumpPNG') {
        var svg = document.querySelector('svg#canvas');

        convert(svg, function thumbnail(canvas) {
          var imgData = canvas.toDataURL();
          imgData = imgData.replace('image/png','image/octet-stream');
          var filename = 'file_' + (new Date()).getTime() + '.' + 'png';
          saveFile(imgData,filename);
        });
        return
      } else if (tool == 'dumpCSV') {
        var svg = document.querySelector('svg#canvas');

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
      } else if (tool == 'loadJSON') {
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
                    var content = JSON.parse(this.result)
                    self.components = content.components
                    console.log('self.components', content)
                    console.log('self.components', content.components)
                    content.shapes.forEach(x => {
                      if (x.type == 'group-shape' && x.componentId) {
                        x.component = content.components.find(c => { return c.id == x.componentId })
                      }
                    })
                    self.shapes = content.shapes

                    // self.shapes = JSON.parse(this.result)
                    self.obj = null
                    self.currentComponent = (self.components.length > 0)? self.components[0] : null
                }
                fileReader.readAsText(file);
            }
          }, false);
        }
        fileField.click()
        return
      } else if (tool == 'zoomin') {
      } else if (tool == 'zoomout') {
      } else if (tool == 'zoom') {
          app.viewBoxWidth = app.originalViewBoxWidth
          app.viewBoxHeight = app.originalViewBoxHeight
          app.viewBoxX = 0
          app.viewBoxY = 0
      } else if (tool == 'delete') {
          if (app.view == 'board') {
            app.shapes.forEach(x => { if (x.selected) { x.selected = false; x.removed = true; } })
          } else if (app.view == 'component') {
            app.currentComponent.layers.forEach(layer => {
              layer.shapes.forEach(x => { if (x.selected) { x.selected = false; x.removed = true; } })
            })
          }
          app.obj = null
          return
      } else if (tool == 'grid') {
        app.showGrid = !app.showGrid
        return
      } else if (tool == 'gridify') {
        app.gridify = !app.gridify
        return
      } else if (tool == 'normalize') {
        app.normalize = !app.normalize
        return
      } else if (tool == 'select') {
        app.clearSelect()
      } else if (tool == 'rect') {
        app.clearSelect()
      } else if (tool == 'circle') {
        app.clearSelect()
      } else if (tool == 'line') {
        app.clearSelect()
      } else if (tool == 'component') {
      } else if (tool == 'collect') {
        app.collected = _.clone(app.obj)
        app.obj.removed = true
        app.clearSelect()
      } else if (tool == 'component-view') {
        if (this.currentComponent) {
          this.switchComponentView()
        }
        return
      } else if (tool == 'board-view') {
        this.switchBoardView()
        return
      }
      this.tool = tool
    },
    toggleMenu: function(menu) {
      if (this.topmenu == menu) this.topmenu = '';
      else this.topmenu = menu;
    },
    clearSelect: function() {
      console.log('clear')
      if (app.view == 'board') {
        this.shapes.forEach(shape => { if (shape.selected) shape.selected = false })
      } else {
      	this.currentComponent.layers.forEach(layer => {
          layer.shapes.forEach(shape => { if (shape.selected) shape.selected = false })
      	})
      }
    },
    switchComponentView: function() {
    	this.clearSelect()
    	this.obj = null
    	this.view = 'component'
    },
    switchBoardView: function() {
    	this.clearSelect()
    	this.obj = null
    	this.view = 'board'
    },
    setLayer: function(layer) {
      this.currentComponent.layers.forEach(l => { l.active = false })
      layer.active = true
    },
    newLayer: function() {
      this.currentComponent.layers.forEach(l => { l.active = false })
      var layer = 
      this.currentComponent.layers.push(layer)
      layer.active = true
    },
  }
})