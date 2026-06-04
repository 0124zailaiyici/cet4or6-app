const fs = require('fs')
const { execSync } = require('child_process')
const path = require('path')

const md = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf-8')
fs.writeFileSync(path.join(__dirname, '_readme_tmp.md'), md, 'utf-8')
const html = execSync('npx marked ' + path.join(__dirname, '_readme_tmp.md'), { encoding: 'utf-8' })
const full = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>四级备考助手 - README</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown-light.min.css"><style>.markdown-body{max-width:920px;margin:0 auto;padding:48px 24px}</style></head><body class="markdown-body">' + html + '</body></html>'
fs.writeFileSync(path.join(__dirname, '..', 'preview_readme.html'), full, 'utf-8')
fs.unlinkSync(path.join(__dirname, '_readme_tmp.md'))
console.log('OK')
