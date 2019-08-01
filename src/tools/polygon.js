export default class DrawCircle {
  constructor (id) {
    let wrap = document.getElementById(id)
    let canvas = document.createElement('canvas')
    this.dpr = window.devicePixelRatio || 1
    this.id = id
    this.wrap = wrap
    this.stroke = 1 * this.dpr
    this.x = 0
    this.y = 0
    this.endX = 0
    this.endY = 0
    this.tempXY = {}
    this.endWidth = 0
    this.endHeight = 0
    this.radius = 5
    this.lock = true
    this.canvas = canvas
    this.context = canvas.getContext('2d')
    this.mousedown = this.mousedown.bind(this)
    this.mousemove = this.mousemove.bind(this)
    this.mouseup = this.mouseup.bind(this)
    this.tempCtx = null
    this.module = 'circle' // circle/rect/line/arrow
    this.mobileAdd = false
    this.pcAdd = false
  }
  addEvent () {
    let wrap = this.wrap
    this.canvas.style.cssText = `position: absolute;left:0;top:0; width: ${wrap.offsetWidth}px;height: ${wrap.offsetHeight}px; z-index: 9999;`
    this.canvas.width = wrap.offsetWidth * this.dpr
    this.canvas.height = wrap.offsetHeight * this.dpr
    // touch事件
    if (navigator.userAgent.match(/AppleWebKit.*Mobile.*/) && !this.mobileAdd) {
      console.log('mobile')
      this.canvas.addEventListener('touchstart', (e) => {
        let pos = e.touches[0]
        this.mousedown({
          clientX: pos.pageX,
          clientY: pos.pageY
        })
      }, false)
      this.canvas.addEventListener('touchmove', (e) => {
        let pos = e.touches[0]
        this.mousemove({
          clientX: pos.pageX,
          clientY: pos.pageY
        })
      }, false)
      this.canvas.addEventListener('touchend', (e) => {
        this.mouseup()
        e.preventDefault()
      }, false)
      this.mobileAdd = true
      return false
    }
    if (!navigator.userAgent.match(/AppleWebKit.*Mobile.*/) && !this.pcAdd) {
      // pc事件
      console.log('pc')
      this.canvas.addEventListener('mousedown', this.mousedown, false)
      this.canvas.addEventListener('mousemove', this.mousemove, false)
      this.canvas.addEventListener('mouseup', this.mouseup, false)
      this.pcAdd = true
    }
  }
  initArcAction (board) {
    this.addEvent()
    this.tempCtx = board
    this.stroke = board.size
    this.context.strokeStyle = board.color
    this.wrap.appendChild(this.canvas)
  }
  addCircle (board) {
    this.initArcAction(board)
    this.module = 'circle'
  }
  addRect (board) {
    this.initArcAction(board)
    this.module = 'rect'
  }
  addLine (board) {
    this.initArcAction(board)
    this.module = 'line'
  }
  addArrow (board) {
    this.initArcAction(board)
    this.module = 'arrow'
  }
  mousedown (e) {
    let pos = this.getMousePos(e)
    this.x = pos.x
    this.y = pos.y
    this.lock = false
  }
  mousemove (e) {
    if (this.lock) {
      return false
    }
    // 获取坐标
    let pos = this.getMousePos(e)
    // 清空画板
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    switch (this.module) {
      case 'circle':
        let disX = Math.abs(pos.x - this.x)
        let disY = Math.abs(pos.y - this.y)
        let minX = Math.min(pos.x, this.x)
        let minY = Math.min(pos.y, this.y)
        this.tempXY = {
          x: minX + (disX / 2),
          y: minY + (disY / 2)
        }
        this.radius = Math.sqrt(disX * disX + disY * disY) / 2
        this.arcCircle(this.tempXY.x, this.tempXY.y, this.radius)
        break
      case 'rect':
        this.endWidth = pos.x - this.x
        this.endHeight = pos.y - this.y
        this.arcRect(this.endWidth, this.endHeight)
        break
      case 'line':
        this.endX = pos.x
        this.endY = pos.y
        this.arcLine(this.endX, this.endY)
        break
      case 'arrow':
        this.endX = pos.x
        this.endY = pos.y
        this.arcArrow(this.endX, this.endY, this.context)
        break
    }
  }
  mouseup () {
    this.lock = true
    let data = null
    let type = ''
    switch (this.module) {
      case 'circle':
        this.tempCtx.ctx.beginPath()
        this.tempCtx.ctx.arc(this.tempXY.x, this.tempXY.y, this.radius, 0, Math.PI * 2)
        this.tempCtx.ctx.stroke()
        // 抛出事件
        data = {
          x: this.tempXY.x / this.canvas.width,
          y: this.tempXY.y / this.canvas.height,
          r: this.radius / this.canvas.width,
          color: this.tempCtx.color,
          size: this.tempCtx.size
        }
        type = 'circle'
        break
      case 'rect':
        this.tempCtx.ctx.beginPath()
        this.tempCtx.ctx.rect(this.x, this.y, this.endWidth, this.endHeight)
        this.tempCtx.ctx.stroke()
        // 抛出事件
        data = {
          x: this.x / this.canvas.width,
          y: this.y / this.canvas.height,
          width: this.endWidth / this.canvas.width,
          height: this.endHeight / this.canvas.height,
          color: this.tempCtx.color,
          size: this.tempCtx.size
        }
        type = 'rect'
        break
      case 'line':
        this.tempCtx.ctx.beginPath()
        this.tempCtx.ctx.moveTo(this.x, this.y)
        this.tempCtx.ctx.lineTo(this.endX, this.endY)
        this.tempCtx.ctx.stroke()
        // 抛出事件
        data = {
          x: this.x / this.canvas.width,
          y: this.y / this.canvas.height,
          endX: this.endX / this.canvas.width,
          endY: this.endY / this.canvas.height,
          color: this.tempCtx.color,
          size: this.tempCtx.size
        }
        type = 'straightLine'
        break
      case 'arrow':
        let points = this.arcArrow(this.endX, this.endY, this.tempCtx.ctx)
        // 抛出事件
        points = points.map(item => {
          item[0] = item[0] / this.canvas.width
          item[1] = item[1] / this.canvas.height
          return item
        })
        data = {
          x: this.x / this.canvas.width,
          y: this.y / this.canvas.height,
          endX: this.endX / this.canvas.width,
          endY: this.endY / this.canvas.height,
          points: points,
          color: this.tempCtx.color
        }
        type = 'arrow'
        break
    }
    this.exportEvent(type, data)
    // 解除画板
    this.resetCanvas()
    this.wrap.removeChild(this.canvas)
  }
  exportEvent (event, data) {
    this.tempCtx.emit('change', {
      type: event,
      data: data
    })
    this.tempCtx.saveHistory()
  }
  arcCircle (x, y, r) {
    this.context.beginPath()
    this.context.lineWidth = this.stroke
    this.context.arc(x, y, r, 0, Math.PI * 2)
    this.context.stroke()
  }
  arcRect (x, y) {
    this.context.beginPath()
    this.context.lineWidth = this.stroke
    this.context.rect(this.x, this.y, x, y)
    this.context.stroke()
  }
  arcLine (x, y) {
    this.context.beginPath()
    this.context.lineWidth = this.stroke
    this.context.moveTo(this.x, this.y)
    this.context.lineTo(x, y)
    this.context.stroke()
  }
  arcArrow (x, y, ctx) {
    let angle = Math.atan2(y - this.y, x - this.x) // 弧度
    let theta = angle * (180 / Math.PI) // 角度
    let state = 15
    let radiu = Math.sqrt((x - this.x) * (x - this.x) + (y - this.y) * (y - this.y))
    if (radiu > 300) {
      state = (radiu / 300) * 15
    }
    let r = Math.abs(radiu - state)
    let gniweks = 1
    let skewing = 2
    if (r < 50) {
      skewing = 8
      gniweks = 4
    } else if (r >= 50 && r < 150) {
      skewing = 4
      gniweks = 2
    }
    let _x1 = this.x + Math.cos((-theta - gniweks) * Math.PI / 180) * r
    let _y1 = this.y - Math.sin((-theta - gniweks) * Math.PI / 180) * r
    let _x2 = this.x + Math.cos((-theta + gniweks) * Math.PI / 180) * r
    let _y2 = this.y - Math.sin((-theta + gniweks) * Math.PI / 180) * r
    let _x3 = this.x + Math.cos((-theta - skewing) * Math.PI / 180) * r
    let _y3 = this.y - Math.sin((-theta - skewing) * Math.PI / 180) * r
    let _x4 = this.x + Math.cos((-theta + skewing) * Math.PI / 180) * r
    let _y4 = this.y - Math.sin((-theta + skewing) * Math.PI / 180) * r
    ctx.beginPath()
    ctx.fillStyle = this.context.strokeStyle
    ctx.moveTo(this.x, this.y)
    ctx.lineTo(_x1, _y1)
    ctx.lineTo(_x3, _y3)
    ctx.lineTo(x, y)
    ctx.lineTo(_x4, _y4)
    ctx.lineTo(_x2, _y2)
    ctx.lineTo(this.x, this.y)
    ctx.fill()
    return [[_x1, _y1], [_x3, _y3], [x, y], [_x4, _y4], [_x2, _y2]]
  }
  getMousePos (e) {
    let rect = this.canvas.getBoundingClientRect()
    let x = e.clientX - rect.left
    let y = e.clientY - rect.top
    return {x: x * this.dpr, y: y * this.dpr}
  }
  resetCanvas () {
    this.stroke = 1
    this.x = 0
    this.y = 0
    this.radius = 5
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }
}
