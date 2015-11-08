var Vue = require('vue');
var _ = require('lodash');

var board = new Vue({
  el: '#board',
  debug: true,
  data: {
    name: 'hello',
    tool: 'select',
    obj: {},
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
          id: '0',
          name: 'circle',
          cx: 75,
          cy: 75,
          r: 75,
          selected: false
        },
        {
          id: '1',
          name: 'rect',
          x: 10,
          y: 20,
          width: 200,
          height: 100,
          selected: false
        },
        {
          id: '2',
          name: 'line',
          x1: 10,
          y1: 20,
          x2: 100,
          y2: 200,
          selected: false
        },
        ]
      }
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
    onTool: function(tool) {
      this.tool = tool

      if (tool == 'zoom') {
        this.viewBoxWidth += 20
        this.viewBoxHeight += 20
      }
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
          selected: true
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
          selected: true
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
          selected: true
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
    'shape' : {
      props: {
        shape: Object,
        clicked: Function,
      } ,
      template: '#shape-template',
    }
  }
})
