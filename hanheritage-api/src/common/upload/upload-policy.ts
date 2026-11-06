import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { closeSync, mkdirSync, openSync, readSync, unlinkSync } from 'fs';
import { basename, extname, resolve, sep } from 'path';
import { diskStorage } from 'multer';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

const MB = 1024 * 1024;

export type UploadCategory = 'image' | 'panorama' | 'model' | 'video' | 'document' | 'data';

export interface UploadedFileInfo {
  originalname?: string;
  filename?: string;
  path: string;
  size: number;
  mimetype?: string;
}

interface CategoryRule {
  label: string;
  extensions: string[];
  mimeTypes: string[];
  maxSize: number;
}

/**
 * 各类上传入口的扩展名 / MIME / 单文件大小白名单。
 * 扩展名统一小写并带点，用于和 extname() 结果直接比较。
 */
export const UPLOAD_CATEGORY_RULES: Record<UploadCategory, CategoryRule> = {
  image: {
    label: '图片',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/x-ms-bmp'],
    maxSize: 20 * MB,
  },
  panorama: {
    label: '全景图',
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 100 * MB,
  },
  model: {
    label: '三维模型',
    extensions: ['.glb', '.gltf'],
    mimeTypes: [
      'model/gltf-binary',
      'model/gltf+json',
      'application/octet-stream',
      'application/json',
      'text/plain',
    ],
    maxSize: 300 * MB,
  },
  video: {
    label: '视频',
    extensions: ['.mp4', '.webm', '.mov'],
    mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'application/octet-stream'],
    maxSize: 200 * MB,
  },
  document: {
    label: '数字文档',
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.md', '.json'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'text/markdown',
      'application/csv',
      'application/json',
      'application/octet-stream',
    ],
    maxSize: 100 * MB,
  },
  data: {
    label: '扫描/点云/成果数据',
    extensions: [
      '.zip', '.7z', '.rar', '.tar', '.gz', '.tgz',
      '.json', '.xml', '.txt', '.csv',
      '.ply', '.las', '.laz', '.e57', '.obj', '.stl', '.fbx', '.dae', '.tif', '.tiff',
    ],
    mimeTypes: [
      'application/zip',
      'application/x-zip-compressed',
      'application/x-7z-compressed',
      'application/vnd.rar',
      'application/x-rar-compressed',
      'application/gzip',
      'application/x-gzip',
      'application/x-tar',
      'application/json',
      'application/xml',
      'text/xml',
      'text/plain',
      'text/csv',
      'image/tiff',
      'application/octet-stream',
      'model/gltf-binary',
      'model/gltf+json',
    ],
    maxSize: 300 * MB,
  },
};

export const ALL_UPLOAD_CATEGORIES = Object.keys(UPLOAD_CATEGORY_RULES) as UploadCategory[];

/** 全部类别中最大的单文件上限，作为 Multer 的统一硬上限 */
export const MAX_UPLOAD_SIZE = Math.max(
  ...ALL_UPLOAD_CATEGORIES.map((category) => UPLOAD_CATEGORY_RULES[category].maxSize),
);

/** 明确禁止的扩展名（可执行/脚本/可被浏览器解释执行的内容） */
const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.com', '.bat', '.cmd', '.msi', '.msp', '.dll', '.sys', '.scr',
  '.cpl', '.jar', '.class', '.apk', '.ipa', '.dmg', '.pkg', '.deb', '.rpm',
  '.sh', '.bash', '.zsh', '.ps1', '.psm1', '.vbs', '.vbe', '.wsf', '.wsh',
  '.php', '.php3', '.php4', '.php5', '.phtml', '.asp', '.aspx', '.ascx',
  '.ashx', '.asmx', '.axd', '.jsp', '.jspx', '.cgi', '.pl', '.py', '.rb',
  '.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.html', '.htm', '.xhtml',
  '.shtml', '.svg', '.svgz', '.swf', '.html5', '.htaccess', '.bak',
]);

const OCTET_STREAM_EXTENSIONS = new Set([
  '.glb', '.gltf', '.ply', '.las', '.laz', '.e57', '.obj', '.stl', '.fbx', '.dae',
  '.zip', '.7z', '.rar', '.gz', '.tgz', '.tar', '.mp4', '.mov', '.webm', '.tif', '.tiff',
]);

const TEXT_EXTENSIONS = new Set(['.txt', '.csv', '.md', '.json', '.xml', '.obj', '.ply', '.stl', '.dae']);

export type FileSignature =
  | 'pe'
  | 'elf'
  | 'macho'
  | 'script'
  | 'jpeg'
  | 'png'
  | 'gif'
  | 'webp'
  | 'bmp'
  | 'pdf'
  | 'ole'
  | 'zip'
  | 'rar'
  | '7z'
  | 'gzip'
  | 'glb'
  | 'mp4'
  | 'webm'
  | 'tiff'
  | 'las'
  | 'ply'
  | 'e57'
  | 'json'
  | 'xml'
  | 'unknown';

const DANGEROUS_SIGNATURES = new Set<FileSignature>(['pe', 'elf', 'macho', 'script']);

/** 扩展名对应的合法文件头类型；未列出的扩展名只做可执行内容拦截 */
const EXTENSION_SIGNATURES: Record<string, FileSignature[]> = {
  '.jpg': ['jpeg'],
  '.jpeg': ['jpeg'],
  '.png': ['png'],
  '.gif': ['gif'],
  '.webp': ['webp'],
  '.bmp': ['bmp'],
  '.glb': ['glb'],
  '.gltf': ['json'],
  '.pdf': ['pdf'],
  '.doc': ['ole'],
  '.docx': ['zip'],
  '.xlsx': ['zip'],
  '.pptx': ['zip'],
  '.zip': ['zip'],
  '.rar': ['rar'],
  '.7z': ['7z'],
  '.gz': ['gzip'],
  '.tgz': ['gzip'],
  '.mp4': ['mp4'],
  '.mov': ['mp4'],
  '.webm': ['webm'],
  '.tif': ['tiff'],
  '.tiff': ['tiff'],
  '.las': ['las'],
  '.laz': ['las'],
  '.ply': ['ply'],
  '.e57': ['e57'],
  '.json': ['json'],
  '.xml': ['xml'],
};

export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return '0 B';
  if (bytes < MB) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / MB).toFixed(1)} MB`;
}

export function normalizeExtension(filename: string): string {
  return extname(filename || '').toLowerCase();
}

/** 落盘文件名：UUID + 规范化的小写扩展名，避免原始文件名参与路径 */
export function buildStoredFilename(originalname: string): string {
  return `${randomUUID()}${normalizeExtension(originalname)}`;
}

/** 原始文件名仅用于展示：去目录、去控制字符、限长 */
export function sanitizeOriginalName(originalname?: string): string {
  const raw = (originalname || '').replace(/\0/g, '');
  const normalized = raw.replace(/\\/g, '/');
  const base = basename(normalized).replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return base.slice(0, 200) || '未命名文件';
}

/** 资源管理页的后台 type 映射到上传校验类别 */
export function resolveResourceCategory(type?: string, filename?: string): UploadCategory {
  switch ((type || '').trim().toLowerCase()) {
    case 'image':
    case 'photo':
      return 'image';
    case 'panorama':
      return 'panorama';
    case 'model':
      return 'model';
    case 'video':
      return 'video';
    case 'doc':
    case 'document':
      return 'document';
    case 'scan':
    case 'pointcloud':
    case 'deliverable':
    case 'data':
      return 'data';
    default:
      return inferCategoryByExtension(filename);
  }
}

export function inferCategoryByExtension(filename?: string): UploadCategory {
  const ext = normalizeExtension(filename || '');
  const order: UploadCategory[] = ['image', 'panorama', 'model', 'video', 'document', 'data'];
  const matched = order.find((category) => UPLOAD_CATEGORY_RULES[category].extensions.includes(ext));
  return matched || 'data';
}

export function describeAllowedExtensions(categories: UploadCategory[]): string {
  const extensions = new Set<string>();
  categories.forEach((category) => {
    UPLOAD_CATEGORY_RULES[category].extensions.forEach((ext) => extensions.add(ext));
  });
  return [...extensions].join('、');
}

function describeCategories(categories: UploadCategory[]): string {
  return categories.map((category) => UPLOAD_CATEGORY_RULES[category].label).join(' / ');
}

function collectMimeTypes(categories: UploadCategory[]): string[] {
  const mimes = new Set<string>();
  categories.forEach((category) => {
    UPLOAD_CATEGORY_RULES[category].mimeTypes.forEach((mime) => mimes.add(mime));
  });
  return [...mimes];
}

export function assertExtensionAllowed(ext: string, categories: UploadCategory[]): void {
  if (BLOCKED_EXTENSIONS.has(ext)) {
    throw new BadRequestException(`禁止上传可执行文件或脚本文件：${ext}`);
  }
  if (!ext) {
    throw new BadRequestException('文件缺少扩展名，无法确认类型，已拒绝上传');
  }
  const allowed = new Set<string>();
  categories.forEach((category) => {
    UPLOAD_CATEGORY_RULES[category].extensions.forEach((item) => allowed.add(item));
  });
  if (!allowed.has(ext)) {
    throw new BadRequestException(
      `不支持的文件类型：${ext}；${describeCategories(categories)}允许：${describeAllowedExtensions(categories)}`,
    );
  }
}

export function assertMimeAllowed(ext: string, mimetype: string | undefined, categories: UploadCategory[]): void {
  const mime = (mimetype || '').toLowerCase();
  if (!mime) return;
  if (collectMimeTypes(categories).includes(mime)) {
    if (mime !== 'application/octet-stream' || OCTET_STREAM_EXTENSIONS.has(ext)) return;
    throw new BadRequestException(`文件 MIME 类型与扩展名不匹配：${mimetype}`);
  }
  if (mime === 'application/octet-stream' && OCTET_STREAM_EXTENSIONS.has(ext)) return;
  if (mime === 'text/plain' && TEXT_EXTENSIONS.has(ext)) return;
  throw new BadRequestException(
    `文件 MIME 类型不在白名单内：${mimetype}；${describeCategories(categories)}允许：${collectMimeTypes(categories).join('、')}`,
  );
}

function readHead(filePath: string, length = 8192): Buffer {
  try {
    const fd = openSync(filePath, 'r');
    try {
      const buffer = Buffer.alloc(length);
      const bytes = readSync(fd, buffer, 0, length, 0);
      return buffer.subarray(0, bytes);
    } finally {
      closeSync(fd);
    }
  } catch {
    return Buffer.alloc(0);
  }
}

function startsWithAscii(head: Buffer, value: string): boolean {
  return head.length >= value.length && head.subarray(0, value.length).toString('latin1') === value;
}

function hexOf(head: Buffer, start = 0, length = 4): string {
  if (head.length < start + length) return '';
  return head.subarray(start, start + length).toString('hex').toLowerCase();
}

/** 通过文件头判断真实内容类型，用于拒绝“改扩展名”的可执行文件 */
export function detectSignature(head: Buffer): FileSignature {
  if (!head.length) return 'unknown';

  const hex4 = hexOf(head);
  if (startsWithAscii(head, 'MZ')) return 'pe';
  if (startsWithAscii(head, '\x7fELF')) return 'elf';
  if (['feedface', 'feedfacf', 'cefaedfe', 'cffaedfe', 'cafebabe', 'bebafeca'].includes(hex4)) return 'macho';
  if (startsWithAscii(head, '#!')) return 'script';

  if (hexOf(head, 0, 3) === 'ffd8ff') return 'jpeg';
  if (hexOf(head) === '89504e47') return 'png';
  if (startsWithAscii(head, 'GIF8')) return 'gif';
  if (startsWithAscii(head, 'RIFF') && startsWithAscii(head.subarray(8), 'WEBP')) return 'webp';
  if (startsWithAscii(head, 'BM')) return 'bmp';
  if (startsWithAscii(head, '%PDF')) return 'pdf';
  if (hexOf(head) === 'd0cf11e0') return 'ole';
  if (hexOf(head, 0, 2) === '504b' && ['0304', '0506', '0708'].includes(hexOf(head, 2, 2))) return 'zip';
  if (startsWithAscii(head, 'Rar!')) return 'rar';
  if (hexOf(head, 0, 6) === '377abcaf271c') return '7z';
  if (hexOf(head, 0, 2) === '1f8b') return 'gzip';
  if (startsWithAscii(head, 'glTF')) return 'glb';
  if (startsWithAscii(head.subarray(4), 'ftyp')) return 'mp4';
  if (hexOf(head) === '1a45dfa3') return 'webm';
  if (startsWithAscii(head, 'II*\0') || startsWithAscii(head, 'MM\0*')) return 'tiff';
  if (startsWithAscii(head, 'LASF')) return 'las';
  if (startsWithAscii(head, 'ply')) return 'ply';
  if (startsWithAscii(head, 'ASTM-E57')) return 'e57';

  let text = head;
  if (hexOf(head, 0, 3) === 'efbbbf') text = text.subarray(3);
  const trimmed = text.toString('utf8').replace(/^\uFEFF/, '').trimStart();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  if (trimmed.startsWith('<')) return 'xml';

  return 'unknown';
}

function safeUnlink(filePath?: string): void {
  if (!filePath) return;
  try {
    unlinkSync(filePath);
  } catch {
    /* 文件可能已被移动或删除，忽略 */
  }
}

/**
 * 落盘后的深度校验：类别白名单、MIME、大小、真实文件头。
 * 校验失败会删除已写入的文件并抛出带明确原因的 BadRequestException。
 */
export function assertUploadedFile(file: UploadedFileInfo | undefined, category: UploadCategory): void {
  if (!file || !file.path) {
    throw new BadRequestException('未接收到上传文件，请使用 file 字段提交');
  }
  const rule = UPLOAD_CATEGORY_RULES[category];
  const sourceName = file.originalname || file.filename || '';
  try {
    const ext = normalizeExtension(sourceName);
    if (BLOCKED_EXTENSIONS.has(ext)) {
      throw new BadRequestException(`禁止上传可执行文件或脚本文件：${ext}`);
    }
    if (!rule.extensions.includes(ext)) {
      throw new BadRequestException(
        `不允许上传 ${ext || '无扩展名'} 文件到「${rule.label}」；允许：${rule.extensions.join('、')}`,
      );
    }
    assertMimeAllowed(ext, file.mimetype, [category]);
    if (file.size > rule.maxSize) {
      throw new BadRequestException(
        `${rule.label}大小超过上限：最大 ${formatBytes(rule.maxSize)}，当前 ${formatBytes(file.size)}`,
      );
    }

    const signature = detectSignature(readHead(file.path));
    if (DANGEROUS_SIGNATURES.has(signature)) {
      throw new BadRequestException('文件内容疑似可执行程序或脚本，已拒绝上传');
    }
    const expected = EXTENSION_SIGNATURES[ext];
    if (expected && !expected.includes(signature)) {
      throw new BadRequestException(
        `文件内容与扩展名不符：${ext} 应为 ${expected.join('/')}，实际检测为 ${signature}`,
      );
    }
  } catch (error) {
    safeUnlink(file.path);
    throw error;
  }
}

/** 规范化并约束到固定根目录，拒绝 ../ 目录穿越 */
export function resolveWithin(root: string, ...segments: string[]): string {
  const normalizedRoot = resolve(root);
  const target = resolve(normalizedRoot, ...segments.filter(Boolean));
  if (target !== normalizedRoot && !target.startsWith(normalizedRoot + sep)) {
    throw new BadRequestException('上传路径非法');
  }
  return target;
}

/** 确保 uploads 下的目标目录存在，并返回绝对路径 */
export function ensureUploadDir(...segments: string[]): string {
  const dir = resolveWithin(resolve(process.cwd(), 'uploads'), ...segments);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export interface UploadOptionsConfig {
  /** uploads 下的子目录，例如 panorama */
  subdir?: string;
  /** 该入口允许的类别；默认全部 */
  categories?: UploadCategory[];
}

/**
 * 生成 FileInterceptor 配置：随机文件名（UUID + 小写扩展名）、固定目录、
 * 扩展名 / MIME 白名单过滤、单文件与字段数量限制。
 */
export function createUploadOptions(config: UploadOptionsConfig = {}): MulterOptions {
  const categories = config.categories?.length ? config.categories : ALL_UPLOAD_CATEGORIES;
  const maxSize = Math.max(...categories.map((category) => UPLOAD_CATEGORY_RULES[category].maxSize));

  return {
    storage: diskStorage({
      destination: (_req, _file, callback) => {
        try {
          callback(null, ensureUploadDir(config.subdir || ''));
        } catch (error) {
          callback(error as Error, '');
        }
      },
      filename: (_req, file, callback) => {
        callback(null, buildStoredFilename(file.originalname));
      },
    }),
    limits: {
      fileSize: maxSize,
      files: 1,
      fields: 20,
    },
    fileFilter: (_req, file, callback) => {
      try {
        const ext = normalizeExtension(file.originalname);
        assertExtensionAllowed(ext, categories);
        assertMimeAllowed(ext, file.mimetype, categories);
        callback(null, true);
      } catch (error) {
        callback(error as Error, false);
      }
    },
  };
}
