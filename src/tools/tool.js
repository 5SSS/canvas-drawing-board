/**
*  优化橡皮擦数据
*  大致思路，两个连续的圆，如果他们的圆心距离不大于半径的一半，就可以删除某一个
*/
export const lightweightEraserData = (data, radius) => {
  if (data.length <= 1) {
    return data
  }
  // 从第二个开始与前面的比较
  let prev = 0
  let current = 1
  let length = data.length
  while (current < length) {
    if (
      Math.abs(data[current].x - data[prev].x) < (radius / 2) && 
      Math.abs(data[current].y - data[prev].y) < (radius / 2)
    ) {
      data.splice(current, 1)
    } else {
      prev++
      current++
    }
    length--
  }
  return data
}

/**
*  优化画笔点阵数据
*  大致思路，和上面相同
*/
export const lightweightPencilData = (data, limit) => {
  if (data.length <= 1) {
    return data
  }
  // 从第二个开始与前面的比较
  let prev = 0
  let current = 1
  let length = data.length
  while (current < length) {
    if (
      Math.abs(data[current].x - data[prev].x) <= limit && 
      Math.abs(data[current].y - data[prev].y) <= limit
    ) {
      data.splice(current, 1)
    } else {
      prev++
      current++
    }
    length--
  }
  return data
}

export const percentageData = (data, width, height) => {
  return data.map(item => {
    return Object.assign(item, {
      x: item.x / width,
      y: item.y / height
    })
  })
}

export const unpercentageData = (data, width, height) => {
  return data.map(item => {
    return Object.assign(item, {
      x: item.x * width,
      y: item.y * height
    })
  })
}
