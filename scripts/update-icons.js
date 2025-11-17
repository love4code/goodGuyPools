#!/usr/bin/env node
/**
 * Fetch Bootstrap Icons CSS from CDN and extract icon class names into public/js/icons.json
 */
const https = require('https')
const fs = require('fs')
const path = require('path')

const CDN_URL = process.env.BI_CDN_URL || 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css'
const OUT_PATH = path.join(__dirname, '..', 'public', 'js', 'icons.json')

function fetch(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(fetch(res.headers.location))
        }
        if (res.statusCode !== 200) {
          return reject(new Error('HTTP ' + res.statusCode))
        }
        let data = ''
        res.setEncoding('utf8')
        res.on('data', chunk => (data += chunk))
        res.on('end', () => resolve(data))
      })
      .on('error', reject)
  })
}

function extractIcons(css) {
  const set = new Set()
  // Match selectors like .bi-alarm::before or .bi-alarm-fill::before
  const re = /\.bi-([a-z0-9-]+)\s*::before/g
  let m
  while ((m = re.exec(css)) !== null) {
    set.add('bi-' + m[1])
  }
  return Array.from(set).sort()
}

async function main() {
  try {
    console.log('Fetching Bootstrap Icons CSS from:', CDN_URL)
    const css = await fetch(CDN_URL)
    const icons = extractIcons(css)
    console.log('Extracted', icons.length, 'icons')
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
    fs.writeFileSync(OUT_PATH, JSON.stringify(icons, null, 2))
    console.log('Wrote', OUT_PATH)
    console.log('Done.')
    process.exit(0)
  } catch (err) {
    console.error('Failed to update icons:', err.message)
    process.exit(1)
  }
}

main()


