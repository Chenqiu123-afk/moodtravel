'use strict';

// ================================================================
//  setup.js — 为 Node.js 测试环境提供最小化浏览器模拟
//  加载 data.js → utils.js → app.js 核心算法
// ================================================================

var vm = require('vm');
var fs = require('fs');
var path = require('path');

// ------------------------------------------------------------------
//  通用 mock DOM 元素工厂（独立函数，避免构造期自引用问题）
// ------------------------------------------------------------------
function makeMockStyle() {
  var style = {};
  // Proxy-like: allow any property assignment and return '' for any property access
  return new Proxy(style, {
    get: function(target, prop) {
      if (prop === 'setProperty') return function() {};
      if (prop === 'getPropertyValue') return function() { return ''; };
      if (prop === 'removeProperty') return function() { return ''; };
      if (prop in target) return target[prop];
      return '';  // CSS properties return empty string
    },
    set: function(target, prop, value) {
      target[prop] = value;
      return true;
    }
  });
}

function makeMockElement() {
  return {
    tagName: 'DIV',
    style: makeMockStyle(),
    checked: false,
    disabled: false,
    value: '',
    innerHTML: '',
    textContent: '',
    className: '',
    id: '',
    type: 'text',
    classList: { add: function() {}, remove: function() {}, contains: function() { return false; }, toggle: function() {} },
    setAttribute: function() {},
    getAttribute: function() { return null; },
    removeAttribute: function() {},
    appendChild: function() {},
    removeChild: function() {},
    insertBefore: function() {},
    replaceChild: function() {},
    addEventListener: function() {},
    removeEventListener: function() {},
    scrollIntoView: function() {},
    focus: function() {},
    blur: function() {},
    click: function() {},
    querySelector: function() { return null; },
    querySelectorAll: function() { return []; },
    closest: function() { return null; },
    getBoundingClientRect: function() { return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }; },
    dataset: {},
    parentNode: null,
    childNodes: [],
    children: [],
    offsetWidth: 0,
    offsetHeight: 0,
    clientWidth: 0,
    clientHeight: 0
  };
}

// ------------------------------------------------------------------
//  构建沙箱环境
// ------------------------------------------------------------------
function createSandbox() {
  var storage = {};

  var sandbox = {
    // 自引用（稍后设置）
    window: null,

    // 基础定时器
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,

    // 控制台
    console: console,

    // 基础对象
    Object: Object,
    Array: Array,
    String: String,
    Number: Number,
    Boolean: Boolean,
    Date: Date,
    Math: Math,
    JSON: JSON,
    RegExp: RegExp,
    Error: Error,
    TypeError: TypeError,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    isFinite: isFinite,
    undefined: undefined,
    NaN: NaN,
    Infinity: Infinity,

    // 模拟 document
    document: {
      getElementById: function(id) { return makeMockElement(); },
      querySelector: function(sel) { return makeMockElement(); },
      querySelectorAll: function(sel) { return []; },
      getElementsByClassName: function(cls) { return []; },
      getElementsByTagName: function(tag) { return []; },
      createElement: function(tag) {
        var el = makeMockElement();
        el.tagName = (tag || 'div').toUpperCase();
        return el;
      },
      createDocumentFragment: function() { return { appendChild: function() {} }; },
      createTextNode: function(text) { return { textContent: text, nodeType: 3 }; },
      addEventListener: function() {},
      removeEventListener: function() {},
      body: {
        appendChild: function() {},
        removeChild: function() {},
        classList: { add: function() {}, remove: function() {}, contains: function() { return false; } },
        style: {},
        addEventListener: function() {},
        scrollTop: 0
      },
      documentElement: {
        style: {},
        classList: { add: function() {}, remove: function() {} }
      },
      head: {
        appendChild: function() {}
      },
      cookie: ''
    },

    // 模拟 localStorage
    localStorage: {
      _data: storage,
      getItem: function(key) { return storage[key] || null; },
      setItem: function(key, value) { storage[key] = String(value); },
      removeItem: function(key) { delete storage[key]; }
    },

    // 模拟 sessionStorage
    sessionStorage: {
      _data: {},
      getItem: function(key) { return this._data[key] || null; },
      setItem: function(key, value) { this._data[key] = String(value); },
      removeItem: function(key) { delete this._data[key]; }
    },

    // 模拟 navigator
    navigator: {
      language: 'zh-CN',
      userAgent: 'Node.js Test',
      onLine: true
    },

    // 模拟 fetch
    fetch: function() {
      return Promise.reject(new Error('fetch not available in test'));
    },

    // 事件监听器
    addEventListener: function() {},
    removeEventListener: function() {},

    // 模拟 location
    location: {
      href: 'http://localhost/',
      reload: function() {}
    },

    // 模拟 history
    history: {
      pushState: function() {},
      replaceState: function() {}
    },

    // 模拟 requestAnimationFrame
    requestAnimationFrame: function(cb) { return setTimeout(cb, 16); },
    cancelAnimationFrame: function(id) { clearTimeout(id); },

    // 模拟 Image
    Image: function() { return { onload: null, onerror: null, src: '' }; },

    // 模拟 performance
    performance: {
      now: function() { return Date.now(); }
    },

    // 模拟 alert
    alert: function() {},

    // 模拟 matchMedia
    matchMedia: function() { return { matches: false, addListener: function() {}, removeListener: function() {} }; },

    // 模拟 URL
    URL: {
      createObjectURL: function() { return 'blob:mock'; },
      revokeObjectURL: function() {}
    },

    // 模拟 Blob
    Blob: function(parts, opts) { return { size: 0, type: (opts || {}).type || '' }; },

    // 模拟 FileReader
    FileReader: function() { return { readAsDataURL: function() {}, onload: null }; },

    // 模拟 MutationObserver
    MutationObserver: function() { return { observe: function() {}, disconnect: function() {} }; },

    // 模拟 IntersectionObserver
    IntersectionObserver: function() { return { observe: function() {}, unobserve: function() {}, disconnect: function() {} }; },

    // 模拟 ResizeObserver
    ResizeObserver: function() { return { observe: function() {}, unobserve: function() {}, disconnect: function() {} }; }
  };

  // 自引用
  sandbox.window = sandbox;
  sandbox.global = sandbox;
  sandbox.self = sandbox;

  return sandbox;
}

// ------------------------------------------------------------------
//  加载 JS 文件到沙箱
// ------------------------------------------------------------------
function loadScript(ctx, filePath) {
  var code = fs.readFileSync(filePath, 'utf-8');
  var script = new vm.Script(code, { filename: path.basename(filePath) });
  script.runInContext(ctx);
}

// ------------------------------------------------------------------
//  初始化测试环境
// ------------------------------------------------------------------
function initTestEnv() {
  var sandbox = createSandbox();
  vm.createContext(sandbox);

  var jsDir = path.join(__dirname, '..', 'js');

  // 1. 加载数据层
  loadScript(sandbox, path.join(jsDir, 'data.js'));

  // 2. 加载工具函数层
  loadScript(sandbox, path.join(jsDir, 'utils.js'));

  // 3. 加载核心算法层（app.js）
  //    注意：app.js 中有大量 DOM 和 UI 代码，但核心算法 doGenerate
  //    只依赖全局变量和工具函数，不依赖 DOM。
  loadScript(sandbox, path.join(jsDir, 'app.js'));

  return sandbox;
}

// ------------------------------------------------------------------
//  设置默认测试状态（重置所有全局变量到已知值）
// ------------------------------------------------------------------
function resetState(sandbox) {
  sandbox.activeMood = 'calm';
  sandbox.budget = 2000;
  sandbox.days = 2;
  sandbox.companionType = 'solo';
  sandbox.hasKids = false;
  sandbox.hasElderly = false;
  sandbox.isCouple = false;
  sandbox.isFriends = false;
  sandbox.isBusiness = false;
  sandbox.travelMode = 'tourism';
  sandbox.currentWeather = undefined;
  sandbox.activeMoodColor = '#8BA88C';
}

module.exports = { initTestEnv, resetState };