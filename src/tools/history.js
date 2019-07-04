export default class History {
  constructor ({maxLength = 30} = {}) {
    this.maxLength = maxLength
    this.historyList = []
    this.index = 0
    this.canNext = false
  }

  /**
  *  画布数据推入历史
  */
  saveHistory (base64) {
    if (this.historyList.length === 0 || this.index === this.historyList.length - 1) {
      this.historyList.push(base64)
      this.index = this.historyList.length - 1
      if (this.historyList.length > this.maxLength) {
        // 超出最大缓存长度，删除第一个
        this.historyList.shift()
      }
    } else {
      this.historyList.splice(this.index + 1, 1, base64)
      this.index = this.index + 1
    }
    this.canNext = false
  }

  /**
  * 向后回退
  */
  prevHistory () {
    this.canNext = true
    if (this.index <= 0) {
      return null
    }
    return this.historyList[--this.index]
  }

  /**
  *  向前重现
  */
  nextHistory () {
    if (!this.canNext || this.index >= this.historyList.length - 1) {
      return null
    }
    return this.historyList[++this.index]
  }
}
