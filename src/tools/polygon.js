export default class DrawCircle {
  constructor (id) {
    let wrap = document.getElementById(id)
    let canvas = document.createElement('canvas')
    this.id = id
    this.wrap = wrap
    this.stroke = 1
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
    this.module = 'circle' // circle/rect
    this.mobileAdd = false
    this.pcAdd = false
  }
  addEvent () {
    let wrap = this.wrap
    this.canvas.style.cssText = `position: absolute;left:0;top:0; width: ${wrap.offsetWidth}px;height: ${wrap.offsetHeight}px; z-index: 9999;`
    this.canvas.width = wrap.offsetWidth
    this.canvas.height = wrap.offsetHeight
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
    }
  }
  mouseup () {
    this.lock = true
    this.tempCtx.ctx.beginPath()
    let data = null
    let type = ''
    switch (this.module) {
      case 'circle':
        this.tempCtx.ctx.arc(this.tempXY.x, this.tempXY.y, this.radius, 0, Math.PI * 2)
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
        this.tempCtx.ctx.rect(this.x, this.y, this.endWidth, this.endHeight)
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
        this.tempCtx.ctx.moveTo(this.x, this.y)
        this.tempCtx.ctx.lineTo(this.endX, this.endY)
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
    }
    this.tempCtx.ctx.stroke()
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
  getMousePos (e) {
    let rect = this.canvas.getBoundingClientRect()
    let x = e.clientX - rect.left * (this.canvas.width / rect.width)
    let y = e.clientY - rect.top * (this.canvas.height / rect.height)
    return {x: x, y: y}
  }
  resetCanvas () {
    this.stroke = 1
    this.x = 0
    this.y = 0
    this.radius = 5
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }
}
