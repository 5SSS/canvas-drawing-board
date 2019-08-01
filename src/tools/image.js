export default class Image {
  constructor (base) {
    let input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', 'image/*')
    input.addEventListener('change', () => {
      readFileToImage(input.files[0])
        .then(res => {
          this.drawImage(res)
        })
        .catch(err => {
          throw err
        })
    }, false)
    this.base = base
    this.input = input
  }

  drawImage (data) {
    let image = document.createElement('img')
    let that = this
    image.onload = function () {
      if (this.width * that.base.dpr <= that.base.width) {
        // 图片长度小于画布长度则原图展示
        that.base.ctx.drawImage(this, 0, 0)
      } else {
        // 图片大于画布长度则等比缩放
        let per = that.base.width / this.width
        that.base.ctx.drawImage(this, 0, 0, that.base.width, this.height * per)
      }
      that.base.emit('change', {type: 'image', data: data})
      // 清空input选项
      that.input.value = ''
    }
    image.onerror = function (err) {
      throw err
    }
    image.src = data
  }

  importImage () {
    this.input.click()
  }

  importImageByBase64 (base64) {
    this.drawImage(base64)
  }
}

const readFileToImage = (data) => {
  return new Promise((resolve, reject) => {
    if (!data) {
      reject(new Error('args error'))
    }
    let reader = new FileReader()
    reader.onload = function (e) {
      let result = e.target.result
      resolve(result)
    }
    reader.onerror = function (e) {
      reject(e)
    }
    reader.readAsDataURL(data)
  })
}
