import {
  lightweightEraserData,
  lightweightPencilData,
  percentageData,
  unpercentageData,
  createBlobByBase64
} from './tools/tool'
import { drawMosaic } from './tools/mosaic.js'
import History from './tools/history'
import Polygon from './tools/polygon'
import Text from './tools/text'
import Image from './tools/image'

export default class Board {
  constructor ({id = '', background = '#fff', size = 2, color = '#F35453'} = {}) {
    let container = document.getElementById(id)
    let canvas = document.createElement('canvas')
    const fn = (e) => {
      e.preventDefault()
    }
    let dpr = window.devicePixelRatio || 1
    canvas.style.width = container.offsetWidth + 'px'
    canvas.style.height = container.offsetHeight + 'px'

    canvas.width = container.offsetWidth * dpr
    canvas.height = container.offsetHeight * dpr
    container.appendChild(canvas)
    container.addEventListener('touchstart', function (e) {
      document.addEventListener('touchmove', fn, {passive: false})
    }, false)
    container.addEventListener('touchend', function (e) {
      document.removeEventListener('touchmove', fn, {passive: false})
    }, false)

    this.id = id
    this.width = canvas.width
    this.height = canvas.height
    this.canvas = canvas
    this.dpr = dpr
    // 画布属性
    this.background = background
    this.mode = 'pencil'
    this.radius = 30
    this.size = size
    this.color = color
    this.prevPoint = {}
    this.ctx = canvas.getContext('2d')
    this.ctx.lineWidth = this.size
    this.ctx.strokeStyle = this.color
    this.canDraw = false
    // event pool
    this.eventPool = {}
    // temp point
    this.pointList = []
    // init event
    this.mousedown = mousedown.bind(this)
    this.mousemove = throttle(mousemove, this)
    this.mouseup = mouseup.bind(this)
    this.initEvent()
    // init background
    this.setBackground()
    // init polygon
    this.install('polygon', new Polygon(id))
    this.install('text', new Text(id))
    this.install('image', new Image(this))
  }

  initEvent () {
    if (navigator.userAgent.match(/AppleWebKit.*Mobile.*/)) {
      // mobile
      addEvent(this.canvas, 'touchstart', this.mousedown)
      addEvent(this.canvas, 'touchmove', this.mousemove)
      addEvent(this.canvas, 'touchend', this.mouseup)
    } else {
      // pc
      addEvent(this.canvas, 'mousedown', this.mousedown)
      addEvent(this.canvas, 'mousemove', this.mousemove)
      addEvent(this.canvas, 'mouseup', this.mouseup)
    }
  }

  drawLine (form, to) {
    this.ctx.beginPath()
    this.ctx.moveTo(form.x, form.y)
    this.ctx.lineTo(to.x, to.y)
    this.ctx.stroke()
  }

  eraser (pos) {
    let radius = this.radius * this.dpr
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2)
    this.ctx.fillStyle = this.background
    this.ctx.fill()
    this.ctx.restore()
  }

  eraserClear (pos) {
    let radius = this.radius * this.dpr
    this.ctx.clearRect(pos.x - (radius / 2), pos.y - (radius / 2), radius, radius)
  }

  clear () {
    this.setBackground()
    // this.ctx.clearRect(0, 0, this.width, this.height)
    this.emit('change', {type: 'clear'})
  }

  fill (color) {
    let fillStyle = color || this.color
    this.ctx.save()
    this.ctx.fillStyle = fillStyle
    this.ctx.fillRect(0, 0, this.width, this.height)
    this.ctx.restore()
    this.emit('change', {type: 'fill', data: {color: fillStyle}})
  }

  getMousePos (e) {
    let clientX = e.clientX || e.touches[0].clientX
    let clientY = e.clientY || e.touches[0].clientY
    let rect = this.canvas.getBoundingClientRect()
    let x = clientX - rect.left
    let y = clientY - rect.top
    return {x: x * this.dpr, y: y * this.dpr}
  }

  on (event, fn) {
    this.eventPool[event] = fn
  }

  emit (event, ...args) {
    if (this.eventPool[event]) {
      this.eventPool[event].apply(this, args)
    }
  }

  setBackground () {
    this.reFill(this.background)
    this.saveHistory()
  }

  saveHistory () {
    this.History.saveHistory(this.getBase64())
  }

  setSize (num) {
    if (typeof num !== 'number') {
      return false
    }
    if (num <= 1) {
      this.size = 1 * this.dpr
    } else if (num >= 10) {
      this.size = 10 * this.dpr
    } else {
      this.size = num * this.dpr
    }
  }

  setColor (color) {
    if (typeof color !== 'string') {
      return false
    }
    this.color = color
    this.ctx.strokeStyle = this.color
  }

  resize () {
    let container = document.getElementById(this.id)
    let backup = this.getBase64(1)
    this.canvas.width = container.offsetWidth
    this.canvas.height = container.offsetHeight
    this.width = container.offsetWidth
    this.height = container.offsetHeight
    let image = document.createElement('img')
    let that = this
    image.onload = function () {
      that.ctx.drawImage(image, 0, 0)
    }
    image.onerror = function (err) {
      throw err
    }
    image.src = backup
  }

  /**
  * 接收线段数据，并绘画在画板
  */
  rePaintLine (data) {
    let points = unpercentageData(data.data, this.width, this.height)
    if (points.length < 1) {
      return false
    }
    let origin = points[0]
    this.ctx.save()
    this.ctx.lineWidth = data.size
    this.ctx.strokeStyle = data.color
    points.forEach(item => {
      this.drawLine(origin, item)
      origin = item
    })
    this.ctx.restore()
  }

  /**
  * 接收文字数据，并绘画在画板
  */
  rePaintText (data) {
    this.ctx.save()
    this.ctx.fillStyle = data.color
    this.ctx.font = `${16 * this.dpr}px Arial`
    let top = data.y * this.height
    data.data.forEach(item => {
      this.ctx.beginPath()
      this.ctx.fillText(item, data.x * this.width, top)
      top += 20
    })
    this.ctx.restore()
  }

  /**
  * 接收圆形数据，并绘画在画板
  */
  rePaintCircle (data) {
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.lineWidth = data.size
    this.ctx.strokeStyle = data.color
    this.ctx.arc(data.x * this.width, data.y * this.height, data.r * this.width, 0, Math.PI * 2)
    this.ctx.stroke()
    this.ctx.restore()
  }

  /**
  * 接收矩形数据，并绘画在画板
  */
  rePaintRect (data) {
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.lineWidth = data.size
    this.ctx.strokeStyle = data.color
    this.ctx.rect(data.x * this.width, data.y * this.height, data.width * this.width, data.height * this.height)
    this.ctx.stroke()
    this.ctx.restore()
  }

  /**
  * 接受橡皮擦数据
  */
  rePaintEraser (data) {
    let points = unpercentageData(data.data, this.width, this.height)
    let tempRadius = this.radius
    this.radius = Math.max(tempRadius, this.width / data.width * tempRadius)
    points.forEach(item => {
      this.eraser(item)
    })
    this.radius = tempRadius
  }

  reMosaic (data) {
    let that = this
    let points = unpercentageData(data.data, this.width, this.height)
    points.forEach(item => {
      drawMosaic({
        ctx: that.ctx,
        point: item,
        size: 30 * this.dpr,
        msize: 5 * this.dpr
      })
    })
  }

  reClear () {
    this.setBackground()
    // this.ctx.clearRect(0, 0, this.width, this.height)
  }

  reFill (color) {
    let fillStyle = color || this.color
    this.ctx.save()
    this.ctx.fillStyle = fillStyle
    this.ctx.fillRect(0, 0, this.width, this.height)
    this.ctx.restore()
  }

  reLine (data) {
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.lineWidth = data.size
    this.ctx.strokeStyle = data.color
    this.ctx.moveTo(data.x * this.width, data.y * this.height)
    this.ctx.lineTo(data.endX * this.width, data.endY * this.height)
    this.ctx.stroke()
    this.ctx.restore()
  }

  reArrow (data) {
    this.ctx.beginPath()
    this.ctx.fillStyle = data.color
    this.ctx.moveTo(data.x * this.width, data.y * this.height)
    data.points.forEach(item => {
      this.ctx.lineTo(item[0] * this.width, item[1] * this.height)
    })
    this.ctx.lineTo(data.x * this.width, data.y * this.height)
    this.ctx.fill()
  }

  reDrawImage (data) {
    let image = document.createElement('img')
    let that = this
    image.onload = function () {
      if (image.width * that.dpr <= that.width) {
        that.ctx.drawImage(image, 0, 0)
      } else {
        let per = that.width / image.width
        that.ctx.drawImage(image, 0, 0, that.width, image.height * per)
      }
    }
    image.onerror = function (err) {
      throw err
    }
    image.src = data
  }
  /**
  * 获取图层base64数据
  * quality: 0 - 1 图片质量
  */

  getBase64 (quality = 0.7) {
    return this.canvas.toDataURL('image/png', quality)
  }

  setBase64 (base64) {
    this.reDrawImage(base64)
  }
  /**
  * type: jpg | png
  */
  download ({name = '未命名图片', type = 'jpg'} = {}) {
    if (type !== 'jpg' && type !== 'png') {
      type = 'jpg'
    }
    let downloadLink = document.createElement('a')
    let blob = createBlobByBase64(this.getBase64())
    downloadLink.href = URL.createObjectURL(blob)
    downloadLink.setAttribute('download', `${name}.${type}`)
    downloadLink.click()
  }

  /**
  * 回退
  */
  prev (bool = false) {
    let base64 = this.History.prevHistory()
    if (base64 !== null) {
      if (bool) {
        this.ctx.clearRect(0, 0, this.width, this.height)
      }
      this.setBase64(base64)
    }
  }

  /**
  * 前进
  */
  next (bool = false) {
    let base64 = this.History.nextHistory()
    if (base64 !== null) {
      if (bool) {
        this.ctx.clearRect(0, 0, this.width, this.height)
      }
      this.setBase64(base64)
    }
  }

  /**
  *  pencil/eraser/mosaic/clear
  */
  setModel (str) {
    this.mode = str
  }

  /**
  * 安装额外插件
  */
  install (name, plugin) {
    Board.prototype[name] = plugin
  }
}

// 历史工具
Board.prototype.History = new History()

// 多少毫秒一帧
const TIME = 16.7

const mousedown = function (e) {
  this.canDraw = true
  this.prevPoint = this.getMousePos(e)
  // 加入坐标集合
  this.pointList.push(this.prevPoint)
  // 设置属性
  this.ctx.lineCap = 'round'
  this.ctx.lineWidth = this.size
  this.ctx.strokeStyle = this.color
}

const mousemove = function (e) {
  if (!this.canDraw) {
    return false
  }
  let nowPoint = this.getMousePos(e)
  if (this.mode === 'pencil') {
    this.drawLine(this.prevPoint, nowPoint)
  } else if (this.mode === 'eraser') {
    this.eraser(nowPoint)
  } else if (this.mode === 'clear') {
    this.eraserClear(nowPoint)
  } else {
    let that = this
    drawMosaic({
      ctx: that.ctx,
      point: nowPoint,
      size: 30 * this.dpr,
      msize: 5 * this.dpr
    })
  }
  // 加入坐标集合
  this.pointList.push(nowPoint)
  // 记录当前坐标
  this.prevPoint = nowPoint
}

const mouseup = function (e) {
  this.canDraw = false
  // 抛出事件
  if (this.mode === 'pencil') {
    this.pointList = lightweightPencilData(this.pointList, 2)
    this.pointList = percentageData(this.pointList, this.width, this.height)
    this.emit('change', {
      type: 'line',
      data: {
        data: this.pointList,
        color: this.color,
        size: this.size
      }
    })
  } else if (this.mode === 'eraser') {
    this.pointList = lightweightEraserData(this.pointList, this.radius)
    this.pointList = percentageData(this.pointList, this.width, this.height)
    this.emit('change', {type: 'eraser', data: {data: this.pointList, width: this.width}})
  } else if (this.mode === 'clear') {
    this.pointList = lightweightEraserData(this.pointList, this.radius)
    this.pointList = percentageData(this.pointList, this.width, this.height)
    this.emit('change', {type: 'clear', data: {data: this.pointList, width: this.width}})
  } else {
    this.pointList = lightweightEraserData(this.pointList, 30 * this.dpr)
    this.pointList = percentageData(this.pointList, this.width, this.height)
    this.emit('change', {type: 'mosaic', data: {data: this.pointList, width: this.width}})
  }
  this.pointList = []
  // 记录操作
  this.saveHistory()
}

const addEvent = (dom, event, fn) => {
  dom.addEventListener(event, fn, false)
}

const throttle = (fn, ctx) => {
  let timer = null
  return function (e) {
    if (timer) {
      return false
    }
    timer = setTimeout(() => {
      clearInterval(timer)
      timer = null
    }, TIME)
    fn.call(ctx, e)
  }
}
