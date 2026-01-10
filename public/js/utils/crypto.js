// 加密工具类
class CryptoManager {
  constructor() {
    this.algorithm = {
      name: 'AES-GCM',
      length: 256
    };
  }

  // 生成密钥
  async generateKey() {
    try {
      return await window.crypto.subtle.generateKey(
        {
          name: this.algorithm.name,
          length: this.algorithm.length
        },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('生成密钥失败:', error);
      throw error;
    }
  }

  // 从密码生成密钥
  async deriveKey(password, salt) {
    try {
      const encoder = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      return await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        {
          name: this.algorithm.name,
          length: this.algorithm.length
        },
        false,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('派生密钥失败:', error);
      throw error;
    }
  }

  // 加密数据
  async encrypt(data, password) {
    try {
      const encoder = new TextEncoder();

      // 生成随机盐值和IV
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      // 从密码派生密钥
      const key = await this.deriveKey(password, salt);

      // 加密数据
      const encryptedData = await window.crypto.subtle.encrypt(
        {
          name: this.algorithm.name,
          iv: iv
        },
        key,
        encoder.encode(JSON.stringify(data))
      );

      // 组合所有数据
      const combined = new Uint8Array(
        salt.length + iv.length + encryptedData.byteLength
      );
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

      // 转换为Base64
      return btoa(String.fromCharCode.apply(null, combined));
    } catch (error) {
      console.error('加密失败:', error);
      throw error;
    }
  }

  // 解密数据
  async decrypt(encryptedDataBase64, password) {
    try {
      // 从Base64解码
      const combined = new Uint8Array(
        atob(encryptedDataBase64).split('').map(c => c.charCodeAt(0))
      );

      // 提取盐值、IV和加密数据
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const encryptedData = combined.slice(28);

      // 从密码派生密钥
      const key = await this.deriveKey(password, salt);

      // 解密数据
      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: this.algorithm.name,
          iv: iv
        },
        key,
        encryptedData
      );

      // 解码并返回
      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decryptedData));
    } catch (error) {
      console.error('解密失败:', error);
      throw error;
    }
  }

  // 哈希密码（用于存储）
  async hashPassword(password) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('密码哈希失败:', error);
      throw error;
    }
  }

  // 验证密码
  async verifyPassword(password, hash) {
    try {
      const passwordHash = await this.hashPassword(password);
      return passwordHash === hash;
    } catch (error) {
      console.error('密码验证失败:', error);
      return false;
    }
  }

  // 生成随机字符串
  generateRandomString(length = 32) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const values = new Uint8Array(length);

    window.crypto.getRandomValues(values);

    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }

    return result;
  }

  // 简单的混淆（用于敏感数据）
  obfuscate(data) {
    try {
      const dataStr = JSON.stringify(data);
      return btoa(encodeURIComponent(dataStr));
    } catch (error) {
      console.error('混淆失败:', error);
      return data;
    }
  }

  // 反混淆
  deobfuscate(obfuscatedData) {
    try {
      const dataStr = decodeURIComponent(atob(obfuscatedData));
      return JSON.parse(dataStr);
    } catch (error) {
      console.error('反混淆失败:', error);
      return obfuscatedData;
    }
  }
}

// 创建全局实例
const cryptoManager = new CryptoManager();

// 便捷的本地数据加密存储
class SecureStorage {
  constructor(password) {
    this.password = password;
    this.prefix = 'secure_';
  }

  // 设置加密数据
  async setItem(key, value) {
    try {
      const encrypted = await cryptoManager.encrypt(value, this.password);
      localStorage.setItem(this.prefix + key, encrypted);
      return true;
    } catch (error) {
      console.error('存储加密数据失败:', error);
      return false;
    }
  }

  // 获取并解密数据
  async getItem(key) {
    try {
      const encrypted = localStorage.getItem(this.prefix + key);
      if (!encrypted) return null;

      return await cryptoManager.decrypt(encrypted, this.password);
    } catch (error) {
      console.error('获取解密数据失败:', error);
      return null;
    }
  }

  // 移除数据
  removeItem(key) {
    localStorage.removeItem(this.prefix + key);
  }

  // 清空所有加密数据
  clear() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}
