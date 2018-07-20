const path = require('path')
const os = require('os')
const fs = require('fs')
const util = require('util')

const Busboy = require('busboy')
const storage = require('@google-cloud/storage')()

const resize = require('./resize')

module.exports = {
  uploadFile: (req, res) => {
    if (req.method !== 'POST') {
      res.status(400).end()
    }
    const busboy = new Busboy({ headers: req.headers })

    const uploads = []
    const messages = ['initiated']

    busboy.on('field', (fieldname, value) => {
      messages.push(`got field: ${fieldname} => ${value}`)
    })

    busboy.on('file', (fieldname, file, filename) => {
      messages.push(`got file: ${fieldname} => ${filename}`)
      const tmpdir = os.tmpdir()
      const filepath = path.join(tmpdir, filename)
      file.pipe(fs.createWriteStream(filepath))
      file.on('end', () => {
        messages.push(`wrote ${filepath} to fs`)
        const newFilepath = `thumb-${filepath}`
        resize(filepath, /** width */ 200, /** height */ 200, /** quality % */ 70, newFilepath)
          .then(() => messages.push('Resized image'))
          .then(() => uploads.push(filepath))
          .then(() => uploads.push(newFilename))
          .then(() => storage
            .bucket('bucket-name')
            .upload(filename)
          )
          .then(() => messages.push(`${newFilename} Uploaded`))
          .catch(err => messages.push('ERROR: ', err.message))
      })
    });

    busboy.on('finish', () => {
      messages.push('busboy finish')
      uploads.map(fs.unlinkSync)
      res.json(messages)
    })

    req.pipe(busboy)
  }
}
