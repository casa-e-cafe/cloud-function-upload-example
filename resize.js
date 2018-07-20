const gm = require('gm')
const imagick = gm.subClass({ imageMagick: true })

resize = (image, width, height, quality, outputname) => new Promise(
  (resolve, reject) =>
    imagick(image)
      .thumb(
        width,
        height,
        outputname,
        quality,
        (err, stdout, stderr, command) => err ? reject(err) : resolve(stdout, stderr, command)
      )
)

module.exports = resize
