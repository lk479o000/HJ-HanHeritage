import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  MAX_UPLOAD_SIZE,
  UPLOAD_CATEGORY_RULES,
  assertUploadedFile,
  buildStoredFilename,
  createUploadOptions,
  resolveResourceCategory,
  resolveWithin,
  sanitizeOriginalName,
} from './upload-policy';

const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
const JPEG_HEADER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
const PDF_HEADER = Buffer.from('%PDF-1.4\n', 'latin1');
const ZIP_HEADER = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00]);
const GLB_HEADER = Buffer.from('glTF\u0000\u0000\u0000\u0002\u0000\u0000\u0000', 'latin1');
const PE_HEADER = Buffer.from('MZ\u0090\u0000\u0003\u0000\u0000\u0000', 'latin1');
const SHELL_HEADER = Buffer.from('#!/bin/sh\necho hi\n', 'latin1');

describe('upload-policy', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'han-upload-policy-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function writeTemp(name: string, content: Buffer): string {
    const filePath = join(dir, name);
    writeFileSync(filePath, content);
    return filePath;
  }

  describe('路径规范化', () => {
    it('允许根目录内的子目录', () => {
      expect(resolveWithin('/tmp/upload-root', 'panorama')).toBe('/tmp/upload-root/panorama');
      expect(resolveWithin('/tmp/upload-root')).toBe('/tmp/upload-root');
    });

    it('拒绝目录穿越', () => {
      expect(() => resolveWithin('/tmp/upload-root', '..', 'etc')).toThrow(BadRequestException);
      expect(() => resolveWithin('/tmp/upload-root', '../../etc')).toThrow(BadRequestException);
    });
  });

  describe('原始文件名清洗', () => {
    it('去掉目录、空字符并限制长度', () => {
      expect(sanitizeOriginalName('../../etc/passwd')).toBe('passwd');
      expect(sanitizeOriginalName('a\u0000b.png')).toBe('ab.png');
      expect(sanitizeOriginalName('')).toBe('未命名文件');
    });
  });

  describe('资源类型映射', () => {
    it('按后台 type 映射到上传类别', () => {
      expect(resolveResourceCategory('image')).toBe('image');
      expect(resolveResourceCategory('model')).toBe('model');
      expect(resolveResourceCategory('video')).toBe('video');
      expect(resolveResourceCategory('doc')).toBe('document');
      expect(resolveResourceCategory('scan')).toBe('data');
      expect(resolveResourceCategory('pointcloud')).toBe('data');
      expect(resolveResourceCategory('deliverable')).toBe('data');
    });

    it('未知 type 按扩展名推断', () => {
      expect(resolveResourceCategory(undefined, 'a.glb')).toBe('model');
      expect(resolveResourceCategory('unknown', 'a.png')).toBe('image');
      expect(resolveResourceCategory('unknown', 'a.pdf')).toBe('document');
    });
  });

  describe('Multer 配置', () => {
    it('默认使用全部类别中最大的硬上限', () => {
      const options = createUploadOptions();
      expect(MAX_UPLOAD_SIZE).toBe(UPLOAD_CATEGORY_RULES.model.maxSize);
      expect(options.limits?.fileSize).toBe(MAX_UPLOAD_SIZE);
      expect(options.limits?.files).toBe(1);
    });

    it('全景入口限制到 100MB', () => {
      const options = createUploadOptions({ subdir: 'panorama', categories: ['panorama'] });
      expect(options.limits?.fileSize).toBe(UPLOAD_CATEGORY_RULES.panorama.maxSize);
    });

    it('文件名随机化并保留小写扩展名', () => {
      expect(buildStoredFilename('Photo.JPG')).toMatch(/^[0-9a-f-]{36}\.jpg$/);
      expect(buildStoredFilename('a.png')).not.toBe(buildStoredFilename('a.png'));
      expect(buildStoredFilename('../../etc/passwd.txt')).toMatch(/^[0-9a-f-]{36}\.txt$/);
    });

    it('fileFilter 拒绝可执行扩展名', () => {
      const options = createUploadOptions();
      let error: unknown = null;
      options.fileFilter!(
        {} as never,
        { originalname: 'payload.exe', mimetype: 'application/octet-stream' } as never,
        (err) => {
          error = err;
        },
      );
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).message).toContain('禁止上传可执行文件');
    });

    it('fileFilter 放行白名单图片', () => {
      const options = createUploadOptions();
      let error: unknown = null;
      let accepted = false;
      options.fileFilter!(
        {} as never,
        { originalname: 'cover.PNG', mimetype: 'image/png' } as never,
        (err, ok) => {
          error = err;
          accepted = !!ok;
        },
      );
      expect(error).toBeNull();
      expect(accepted).toBe(true);
    });
  });

  describe('落盘后校验', () => {
    it('合法图片通过', () => {
      const filePath = writeTemp('cover.png', PNG_HEADER);
      expect(() =>
        assertUploadedFile({ originalname: 'cover.png', path: filePath, size: 1024, mimetype: 'image/png' }, 'image'),
      ).not.toThrow();
      expect(existsSync(filePath)).toBe(true);
    });

    it('合法的 GLB 模型通过', () => {
      const filePath = writeTemp('model.glb', GLB_HEADER);
      expect(() =>
        assertUploadedFile(
          { originalname: 'model.glb', path: filePath, size: 4096, mimetype: 'model/gltf-binary' },
          'model',
        ),
      ).not.toThrow();
    });

    it('伪装成图片的可执行文件被拒绝并删除', () => {
      const filePath = writeTemp('evil.png', PE_HEADER);
      expect(() =>
        assertUploadedFile({ originalname: 'evil.png', path: filePath, size: 1024, mimetype: 'image/png' }, 'image'),
      ).toThrow(/可执行程序或脚本/);
      expect(existsSync(filePath)).toBe(false);
    });

    it('伪装成文本的脚本被拒绝', () => {
      const filePath = writeTemp('notes.txt', SHELL_HEADER);
      expect(() =>
        assertUploadedFile({ originalname: 'notes.txt', path: filePath, size: 1024, mimetype: 'text/plain' }, 'document'),
      ).toThrow(/可执行程序或脚本/);
    });

    it('内容与扩展名不符被拒绝', () => {
      const filePath = writeTemp('fake.glb', PNG_HEADER);
      expect(() =>
        assertUploadedFile(
          { originalname: 'fake.glb', path: filePath, size: 1024, mimetype: 'model/gltf-binary' },
          'model',
        ),
      ).toThrow(/内容与扩展名不符/);
    });

    it('超出类别大小上限被拒绝并删除', () => {
      const filePath = writeTemp('big.jpg', JPEG_HEADER);
      expect(() =>
        assertUploadedFile(
          { originalname: 'big.jpg', path: filePath, size: 21 * 1024 * 1024, mimetype: 'image/jpeg' },
          'image',
        ),
      ).toThrow(/超过上限/);
      expect(existsSync(filePath)).toBe(false);
    });

    it('类别不接受的扩展名被拒绝', () => {
      const filePath = writeTemp('report.pdf', PDF_HEADER);
      expect(() =>
        assertUploadedFile(
          { originalname: 'report.pdf', path: filePath, size: 1024, mimetype: 'application/pdf' },
          'image',
        ),
      ).toThrow(/不允许上传/);
    });

    it('MIME 与扩展名不符被拒绝', () => {
      const filePath = writeTemp('cover.png', PNG_HEADER);
      expect(() =>
        assertUploadedFile(
          { originalname: 'cover.png', path: filePath, size: 1024, mimetype: 'application/x-msdownload' },
          'image',
        ),
      ).toThrow(/MIME 类型/);
    });

    it('docx 以 zip 容器结构通过', () => {
      const filePath = writeTemp('report.docx', ZIP_HEADER);
      expect(() =>
        assertUploadedFile(
          {
            originalname: 'report.docx',
            path: filePath,
            size: 4096,
            mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          },
          'document',
        ),
      ).not.toThrow();
    });
  });
});
