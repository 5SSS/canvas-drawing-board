export default class Text {
  constructor (id) {
    this.dom = document.getElementById(id)
    this.board = null

    textwrap.appendChild(poswrap)
    poswrap.appendChild(textarea)
    poswrap.appendChild(drag)
    poswrap.appendChild(cancel)
    poswrap.appendChild(confirm)

    this.cancel = this.cancel.bind(this)
    this.confirm = this.confirm.bind(this)
    this.drag = this.drag.bind(this)
    this.bindClick = this.bindClick.bind(this)
    this.moveAction = this.moveAction.bind(this)
    this.cancelMove = this.cancelMove.bind(this)
    cancel.addEventListener('click', this.cancel, false)
    confirm.addEventListener('click', this.confirm, false)
    if (navigator.userAgent.match(/AppleWebKit.*Mobile.*/)) {
      drag.addEventListener('touchstart', this.drag, false)
    } else {
      drag.addEventListener('mousedown', this.drag, false)
    }
  }

  addText (board) {
    this.board = board
    this.dom.appendChild(mask)
    setInputColor(board.color)
    setTimeout(() => {
      this.dom.addEventListener('click', this.bindClick, false)
    }, 0)
  }

  bindClick (e) {
    let pos = this.getMousePos(this.board.ctx.canvas, e)
    textwrap.style.left = pos.x + 'px'
    textwrap.style.top = pos.y + 'px'
    this.dom.appendChild(textwrap)
    textarea.focus()
    this.dom.removeEventListener('click', this.bindClick, false)
    this.dom.removeChild(mask)
  }

  cancel () {
    this.dom.removeChild(textwrap)
    resetInput()
    this.dom.removeEventListener('mouseup', this.cancelMove, true)
  }

  confirm () {
    let value = textarea.value
    // 先根据回车分段
    let parts = value.split(/[\r\n]/)
    let needDrawList = []
    // 分割每个分割
    parts.forEach(item => {
      let str = item.split('')
      let text = ''
      for (let i = 0; i < str.length; i++) {
        text += str[i]
        if (this.board.ctx.measureText(text).width >= TEXT_MAX_WIDTH) {
          needDrawList.push(text)
          text = ''
        }
      }
      needDrawList.push(text)
    })
    // 渲染分段后的文字
    this.board.ctx.save()
    this.board.ctx.fillStyle = this.board.color
    this.board.ctx.font = `${16 * this.board.dpr}px Arial`
    this.board.ctx.beginPath()
    let vetor = 20 * this.board.dpr
    let xray = 5 * this.board.dpr
    let top = (textwrap.offsetTop * this.board.dpr) + vetor
    let left = textwrap.offsetLeft * this.board.dpr
    needDrawList.forEach(item => {
      this.board.ctx.fillText(item, left + xray, top)
      top += vetor
    })
    this.board.ctx.restore()
    // 抛出事件
    let color = this.board.color
    let y = ((textwrap.offsetTop * this.board.dpr) + vetor) / this.board.height
    let x = left / this.board.width
    this.board.emit('change', {
      type: 'text',
      data: {
        x: x,
        y: y,
        color: color,
        data: needDrawList
      }
    })
    // 解除输入
    this.dom.removeChild(textwrap)
    resetInput()
    this.dom.removeEventListener('mouseup', this.cancelMove, true)
  }

  drag () {
    if (navigator.userAgent.match(/AppleWebKit.*Mobile.*/)) {
      this.dom.addEventListener('touchmove', this.moveAction, false)
      this.dom.addEventListener('touchend', this.cancelMove, true)
    } else {
      this.dom.addEventListener('mousemove', this.moveAction, false)
      this.dom.addEventListener('mouseup', this.cancelMove, true)
    }
  }

  cancelMove () {
    if (navigator.userAgent.match(/AppleWebKit.*Mobile.*/)) {
      this.dom.removeEventListener('touchmove', this.moveAction, false)
    } else {
      this.dom.removeEventListener('mousemove', this.moveAction, false)
    }
  }

  moveAction (e) {
    let crod = this.getMousePos(this.board.canvas, e)
    textwrap.style.left = crod.x + 'px'
    textwrap.style.top = crod.y + 'px'
  }

  getMousePos (canvas, e) {
    let clientX = e.clientX || e.touches[0].clientX
    let clientY = e.clientY || e.touches[0].clientY
    var rect = canvas.getBoundingClientRect()
    var x = clientX - rect.left
    var y = clientY - rect.top
    return {x: x, y: y}
  }
}

const TEXT_MAX_WIDTH = 140

const textarea = (function () {
  let textarea = document.createElement('textarea')
  textarea.setAttribute('rows', 3)
  textarea.setAttribute('cols', 30)
  textarea.style.cssText = 'display: block; background-color: transparent; outline: none; margin: 0px; padding: 4px; resize: none; overflow: hidden; z-index: 1000;font: 18px "Helvetica Neue", Helvetica, Arial, sans-serif; color: rgb(0, 0, 0);'
  return textarea
})()

const textwrap = (function () {
  let div = document.createElement('div')
  div.style.cssText = 'position: absolute;width: auto;display: inline-block; text-align: right; z-index: 1000;'
  return div
})()

const poswrap = (function () {
  let div = document.createElement('div')
  div.style.cssText = 'position: relative;width: 100%;'
  return div
})()

const cancel = (function () {
  let button = document.createElement('button')
  button.innerHTML = '取消'
  button.style.cssText = 'margin-left: 10px;'
  return button
})()

const confirm = (function () {
  let button = document.createElement('button')
  button.innerHTML = '确定'
  button.style.cssText = 'margin-left: 10px;'
  return button
})()

const drag = (function () {
  let button = document.createElement('button')
  button.innerHTML = '按下拖动'
  button.style.cssText = 'position: absolute; left: 0; top: -20px; z-index: 100;'
  return button
})()

const mask = (function () {
  let mask = document.createElement('div')
  mask.style.cssText = 'position: absolute;left:0;top:0; width: 100%;height: 100%;z-index: 999;'
  return mask
})()

const resetInput = function () {
  textarea.value = ''
}

const setInputColor = (color) => {
  textarea.style.color = color
}
