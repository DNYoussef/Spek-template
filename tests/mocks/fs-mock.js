/**
 * File System Mock for Testing
 * Mock implementation of Node.js fs/promises for configuration tests
 */

class FileSystemMock {
  constructor() {
    this.files = new Map();
    this.directories = new Set();
  }

  // Async file operations
  async readFile(path, encoding = 'utf8') {
    const content = this.files.get(path);
    if (!content) {
      throw new Error(`ENOENT: no such file or directory, open '${path}'`);
    }
    return encoding ? content.toString() : content;
  }

  async writeFile(path, content) {
    this.files.set(path, content);
    // Auto-create parent directory
    const dirPath = path.substring(0, path.lastIndexOf('/'));
    if (dirPath) {
      this.directories.add(dirPath);
    }
  }

  async mkdir(path, options = {}) {
    this.directories.add(path);
    if (options.recursive) {
      const parts = path.split('/');
      let current = '';
      for (const part of parts) {
        current = current ? `${current}/${part}` : part;
        this.directories.add(current);
      }
    }
  }

  async stat(path) {
    if (this.files.has(path)) {
      return {
        isFile: () => true,
        isDirectory: () => false,
        size: this.files.get(path).length,
        mtime: new Date()
      };
    }
    if (this.directories.has(path)) {
      return {
        isFile: () => false,
        isDirectory: () => true,
        size: 0,
        mtime: new Date()
      };
    }
    throw new Error(`ENOENT: no such file or directory, stat '${path}'`);
  }

  async access(path, mode) {
    if (!this.files.has(path) && !this.directories.has(path)) {
      throw new Error(`ENOENT: no such file or directory, access '${path}'`);
    }
  }

  async unlink(path) {
    if (!this.files.has(path)) {
      throw new Error(`ENOENT: no such file or directory, unlink '${path}'`);
    }
    this.files.delete(path);
  }

  async rmdir(path) {
    if (!this.directories.has(path)) {
      throw new Error(`ENOENT: no such file or directory, rmdir '${path}'`);
    }
    this.directories.delete(path);
  }

  async readdir(path) {
    const prefix = path.endsWith('/') ? path : `${path}/`;
    const entries = [];

    // Find files in this directory
    for (const [filePath] of this.files) {
      if (filePath.startsWith(prefix) && !filePath.substring(prefix.length).includes('/')) {
        entries.push(filePath.substring(prefix.length));
      }
    }

    // Find subdirectories
    for (const dirPath of this.directories) {
      if (dirPath.startsWith(prefix) && !dirPath.substring(prefix.length).includes('/')) {
        entries.push(dirPath.substring(prefix.length));
      }
    }

    return entries;
  }

  // Helper methods for testing
  setFile(path, content) {
    this.files.set(path, content);
  }

  clear() {
    this.files.clear();
    this.directories.clear();
  }

  reset() {
    this.clear();
  }

  // Create a mock fs/promises object
  createMock() {
    return {
      readFile: this.readFile.bind(this),
      writeFile: this.writeFile.bind(this),
      mkdir: this.mkdir.bind(this),
      stat: this.stat.bind(this),
      access: this.access.bind(this),
      unlink: this.unlink.bind(this),
      rmdir: this.rmdir.bind(this),
      readdir: this.readdir.bind(this)
    };
  }
}

module.exports = FileSystemMock;