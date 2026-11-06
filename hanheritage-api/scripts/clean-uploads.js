#!/usr/bin/env node
/**
 * 扫描 uploads/ 目录，找出没有被数据库引用的孤儿文件。
 * 默认只报告（dry-run）；加 --apply 才会真正删除文件。
 *
 * 用法：
 *   npm run uploads:clean
 *   npm run uploads:clean:apply
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const UPLOAD_DIR = path.join(ROOT, 'uploads')
const IGNORED_FILES = new Set(['.DS_Store', '.gitkeep'])

function loadEnv() {
  if (process.env.DATABASE_URL) return
  const envPath = path.join(ROOT, '.env')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match) continue
    const value = match[2].replace(/^['"]|['"]$/g, '')
    if (!process.env[match[1]]) process.env[match[1]] = value
  }
}

function toUploadPath(url) {
  if (!url) return null
  const clean = url.split('?')[0].split('#')[0]
  if (!clean.startsWith('/uploads/')) return null
  return path.join(UPLOAD_DIR, clean.slice('/uploads/'.length))
}

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walk(full))
    } else if (!IGNORED_FILES.has(entry.name)) {
      files.push(full)
    }
  }
  return files
}

async function collectReferences(prisma) {
  const refs = new Set()

  const add = (urls) => {
    for (const url of urls) {
      const local = toUploadPath(url)
      if (local) refs.add(path.resolve(local))
    }
  }

  // 包含软删除记录：文件可能随数据恢复而重新被引用，按保守策略保留
  const [resources, cliffs, cliffImages, coffins, coffinImages, coffinModels, panoramas] =
    await Promise.all([
      prisma.bizResource.findMany({ select: { fileUrl: true } }),
      prisma.bizCliff.findMany({ select: { coverImage: true, modelUrl: true } }),
      prisma.bizCliffImage.findMany({ select: { imageUrl: true } }),
      prisma.bizCoffin.findMany({ select: { thumbnail: true } }),
      prisma.bizCoffinImage.findMany({ select: { imageUrl: true } }),
      prisma.bizCoffinModel.findMany({ select: { modelUrl: true } }),
      prisma.bizPanorama.findMany({ select: { imageUrl: true } }),
    ])

  add(resources.map((row) => row.fileUrl))
  add(cliffs.flatMap((row) => [row.coverImage, row.modelUrl]))
  add(cliffImages.map((row) => row.imageUrl))
  add(coffins.map((row) => row.thumbnail))
  add(coffinImages.map((row) => row.imageUrl))
  add(coffinModels.map((row) => row.modelUrl))
  add(panoramas.map((row) => row.imageUrl))

  return refs
}

async function main() {
  loadEnv()
  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient()
  const apply = process.argv.includes('--apply')

  try {
    const refs = await collectReferences(prisma)
    const physicalFiles = walk(UPLOAD_DIR).map((file) => path.resolve(file))
    const orphans = physicalFiles.filter((file) => !refs.has(file))
    const dangling = [...refs].filter((file) => !fs.existsSync(file))

    console.log(`已扫描物理文件：${physicalFiles.length}`)
    console.log(`数据库引用文件：${refs.size}`)

    if (dangling.length) {
      console.log(`\n以下数据库引用在 uploads/ 中找不到物理文件（不会自动删除记录）：`)
      for (const file of dangling) {
        console.log(`  ! ${path.relative(ROOT, file)}`)
      }
    }

    if (!orphans.length) {
      console.log('\n没有发现孤儿文件。')
      return
    }

    console.log(`\n发现孤儿文件：${orphans.length}`)
    for (const file of orphans) {
      console.log(`  - ${path.relative(ROOT, file)}`)
      if (apply) fs.unlinkSync(file)
    }

    console.log(apply ? '\n已删除上述孤儿文件。' : '\n当前为 dry-run，未删除任何文件。')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
