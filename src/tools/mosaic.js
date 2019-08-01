export const drawMosaic = ({ctx, point, size = 30, msize = 5} = {}) => {
  let imgData = ctx.getImageData(point.x - (size / 2), point.y - (size / 2), size, size)
  let width = imgData.width
  let height = imgData.height
  let stepW = width / msize
  let stepH = height / msize
  for (let i = 0; i < stepH; i++) {
    for (let j = 0; j < stepW; j++) {
      let color = getColor(imgData, j * msize + Math.floor(Math.random() * msize), i * msize + Math.floor(Math.random() * msize))
      for (let k = 0; k < msize; k++) {
        for (let l = 0; l < msize; l++) {
          setColor(imgData, j * msize + l, i * msize + k, color)
        }
      }
    }
  }
  ctx.putImageData(imgData, point.x - (size / 2), point.y - (size / 2))
}

const getColor = (data, x, y) => {
  let w = data.width
  let color = []
  color[0] = data.data[4 * (y * w + x)]
  color[1] = data.data[4 * (y * w + x) + 1]
  color[2] = data.data[4 * (y * w + x) + 2]
  color[3] = data.data[4 * (y * w + x) + 3]
  return color
}

const setColor = (data, x, y, color) => {
  let w = data.width
  data.data[4 * (y * w + x)] = color[0]
  data.data[4 * (y * w + x) + 1] = color[1]
  data.data[4 * (y * w + x) + 2] = color[2]
  data.data[4 * (y * w + x) + 3] = color[3]
}
