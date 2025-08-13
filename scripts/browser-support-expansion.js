/**
 * 瀏覽器支援擴展系統
 * 擴展多瀏覽器相容性測試和支援覆蓋範圍
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BrowserSupportExpansion {
    constructor() {
        this.config = {
            // 支援的瀏覽器配置
            browsers: {
                chrome: {
                    name: 'Google Chrome',
                    executablePath: null, // 使用系統預設
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    viewport: { width: 1920, height: 1080 },
                    enabled: true
                },
                edge: {
                    name: 'Microsoft Edge',
                    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
                    viewport: { width: 1920, height: 1080 },
                    enabled: true
                },
                firefox: {
                    name: 'Mozilla Firefox',
                    executablePath: 'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
                    viewport: { width: 1920, height: 1080 },
                    enabled: false // 需要額外配置
                },
                safari: {
                    name: 'Safari (模擬)',
                    executablePath: null,
                    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
                    viewport: { width: 1920, height: 1080 },
                    enabled: true
                }
            },
            
            // 測試場景配置
            testScenarios: [
                {
                    name: 'Desktop Standard',
                    viewport: { width: 1920, height: 1080 },
                    deviceScaleFactor: 1,
                    isMobile: false
                },
                {
                    name: 'Desktop Large',
                    viewport: { width: 2560, height: 1440 },
                    deviceScaleFactor: 1,
                    isMobile: false
                },
                {
                    name: 'Tablet Portrait',
                    viewport: { width: 768, height: 1024 },
                    deviceScaleFactor: 2,
                    isMobile: true
                },
                {
                    name: 'Tablet Landscape',
                    viewport: { width: 1024, height: 768 },
                    deviceScaleFactor: 2,
                    isMobile: true
                },
                {
                    name: 'Mobile Portrait',
                    viewport: { width: 375, height: 667 },
                    deviceScaleFactor: 2,
                    isMobile: true
                },
                {
                    name: 'Mobile Landscape',
                    viewport: { width: 667, height: 375 },
                    deviceScaleFactor: 2,
                    isMobile: true
                }
            ],
            
            // 功能測試配置
            featureTests: [
                'basicNavigation',
                'responsiveDesign',
                'formInteraction',
                'javascriptExecution',
                'cssRendering',
                'apiConnectivity',
                'storageSupport',
                'performanceMetrics'
            ]
        };
        
        this.testResults = {
            browsers: {},
            scenarios: {},
            features: {},
            compatibility: {},
            issues: [],
            recommendations: []
        };
        
        this.screenshotDir = path.join(__dirname, '..', 'browser-compatibility-screenshots');
        this.reportDir = path.join(__dirname, '..', 'browser-compatibility-reports');
    }

    async runBrowserCompatibilityTests() {
        console.log('🌐 開始擴展瀏覽器支援測試...\n');

        try {
            // 確保目錄存在
            this.ensureDirectories();
            
            // 1. 檢測可用瀏覽器
            await this.detectAvailableBrowsers();
            
            // 2. 執行跨瀏覽器測試
            await this.runCrossBrowserTests();
            
            // 3. 執行響應式設計測試
            await this.runResponsiveTests();
            
            // 4. 執行功能相容性測試
            await this.runFeatureCompatibilityTests();
            
            // 5. 分析相容性問題
            await this.analyzeCompatibilityIssues();
            
            // 6. 生成改善建議
            await this.generateImprovementRecommendations();
            
            // 7. 生成相容性報告
            await this.generateCompatibilityReport();
            
            console.log('✅ 瀏覽器支援擴展測試完成');
            return this.testResults;

        } catch (error) {
            console.error('❌ 瀏覽器支援測試失敗:', error.message);
            throw error;
        }
    }

    ensureDirectories() {
        [this.screenshotDir, this.reportDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    async detectAvailableBrowsers() {
        console.log('🔍 檢測可用瀏覽器...');
        
        const availableBrowsers = {};
        
        for (const [browserId, config] of Object.entries(this.config.browsers)) {
            if (!config.enabled) {
                console.log(`  - ${config.name}: 已停用`);
                continue;
            }
            
            try {
                let browserPath = config.executablePath;
                
                // 對於Chrome，使用Puppeteer內建版本
                if (browserId === 'chrome' && !browserPath) {
                    availableBrowsers[browserId] = {
                        ...config,
                        available: true,
                        version: 'Puppeteer內建版本'
                    };
                    console.log(`  - ${config.name}: ✅ 可用 (Puppeteer內建)`);
                    continue;
                }
                
                // 檢查瀏覽器檔案是否存在
                if (browserPath && fs.existsSync(browserPath)) {
                    availableBrowsers[browserId] = {
                        ...config,
                        available: true,
                        version: '已安裝'
                    };
                    console.log(`  - ${config.name}: ✅ 可用`);
                } else if (browserId === 'safari') {
                    // Safari模擬模式
                    availableBrowsers[browserId] = {
                        ...config,
                        available: true,
                        version: '模擬模式'
                    };
                    console.log(`  - ${config.name}: ✅ 可用 (模擬)`);
                } else {
                    console.log(`  - ${config.name}: ❌ 不可用`);
                }
                
            } catch (error) {
                console.log(`  - ${config.name}: ❌ 檢測失敗`);
            }
        }
        
        this.availableBrowsers = availableBrowsers;
        console.log(`\n✅ 檢測到 ${Object.keys(availableBrowsers).length} 個可用瀏覽器`);
    }

    async runCrossBrowserTests() {
        console.log('🌐 執行跨瀏覽器相容性測試...');
        
        const baseUrl = 'http://localhost:3007';
        
        for (const [browserId, browserConfig] of Object.entries(this.availableBrowsers)) {
            console.log(`\n📱 測試 ${browserConfig.name}...`);
            
            try {
                const browser = await this.launchBrowser(browserId, browserConfig);
                const page = await browser.newPage();
                
                // 設定用戶代理和視窗大小
                await page.setUserAgent(browserConfig.userAgent);
                await page.setViewport(browserConfig.viewport);
                
                // 執行基本測試
                const testResult = await this.runBasicBrowserTests(page, baseUrl, browserId);
                
                this.testResults.browsers[browserId] = {
                    name: browserConfig.name,
                    ...testResult
                };
                
                await browser.close();
                console.log(`  ✅ ${browserConfig.name} 測試完成`);
                
            } catch (error) {
                console.log(`  ❌ ${browserConfig.name} 測試失敗: ${error.message}`);
                this.testResults.browsers[browserId] = {
                    name: browserConfig.name,
                    success: false,
                    error: error.message
                };
            }
        }
    }

    async launchBrowser(browserId, config) {
        const launchOptions = {
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-dev-shm-usage'
            ]
        };
        
        // 設定特定瀏覽器路徑
        if (config.executablePath && browserId !== 'chrome') {
            launchOptions.executablePath = config.executablePath;
        }
        
        return await puppeteer.launch(launchOptions);
    }

    async runBasicBrowserTests(page, baseUrl, browserId) {
        const testResult = {
            success: true,
            tests: {},
            screenshots: [],
            performance: {},
            errors: []
        };
        
        try {
            // 1. 首頁載入測試
            console.log(`  - 測試首頁載入...`);
            const startTime = Date.now();
            await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 30000 });
            const loadTime = Date.now() - startTime;
            
            testResult.tests.homepageLoad = {
                success: true,
                loadTime: loadTime,
                status: loadTime < 3000 ? 'fast' : loadTime < 5000 ? 'acceptable' : 'slow'
            };
            
            // 截圖
            const screenshotPath = path.join(this.screenshotDir, `homepage-${browserId}-${Date.now()}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            testResult.screenshots.push(screenshotPath);
            
            // 2. JavaScript執行測試
            console.log(`  - 測試JavaScript執行...`);
            const jsResult = await page.evaluate(() => {
                try {
                    // 測試基本JavaScript功能
                    const testObj = { test: 'value' };
                    const testArray = [1, 2, 3];
                    const testFunction = () => 'success';
                    
                    return {
                        objectSupport: typeof testObj === 'object',
                        arraySupport: Array.isArray(testArray),
                        functionSupport: typeof testFunction === 'function',
                        es6Support: (() => { try { eval('const test = () => {}'); return true; } catch(e) { return false; } })(),
                        result: testFunction()
                    };
                } catch (error) {
                    return { error: error.message };
                }
            });
            
            testResult.tests.javascript = {
                success: !jsResult.error,
                ...jsResult
            };
            
            // 3. CSS渲染測試
            console.log(`  - 測試CSS渲染...`);
            const cssTest = await page.evaluate(() => {
                try {
                    const element = document.querySelector('body');
                    if (!element) return { error: 'No body element found' };
                    
                    const styles = window.getComputedStyle(element);
                    return {
                        hasStyles: styles.backgroundColor !== 'rgba(0, 0, 0, 0)',
                        fontSize: styles.fontSize,
                        fontFamily: styles.fontFamily,
                        flexboxSupport: CSS.supports('display', 'flex'),
                        gridSupport: CSS.supports('display', 'grid'),
                        customPropertiesSupport: CSS.supports('--custom-property', 'value')
                    };
                } catch (error) {
                    return { error: error.message };
                }
            });
            
            testResult.tests.css = {
                success: !cssTest.error,
                ...cssTest
            };
            
            // 4. 表單互動測試
            console.log(`  - 測試表單互動...`);
            try {
                // 尋找登入表單
                const loginForm = await page.$('#loginForm');
                if (loginForm) {
                    await page.type('#username', 'testuser');
                    await page.type('#password', 'testpass');
                    
                    testResult.tests.formInteraction = {
                        success: true,
                        formFound: true,
                        inputWorking: true
                    };
                } else {
                    testResult.tests.formInteraction = {
                        success: true,
                        formFound: false,
                        note: '登入表單未找到，可能頁面結構不同'
                    };
                }
            } catch (error) {
                testResult.tests.formInteraction = {
                    success: false,
                    error: error.message
                };
            }
            
            // 5. 效能指標收集
            console.log(`  - 收集效能指標...`);
            const performanceMetrics = await page.evaluate(() => {
                const perf = performance.getEntriesByType('navigation')[0];
                return {
                    domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
                    loadComplete: perf.loadEventEnd - perf.loadEventStart,
                    firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
                    firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
                };
            });
            
            testResult.performance = performanceMetrics;
            
        } catch (error) {
            testResult.success = false;
            testResult.errors.push(error.message);
            console.log(`  ❌ 測試過程中發生錯誤: ${error.message}`);
        }
        
        return testResult;
    }

    async runResponsiveTests() {
        console.log('📱 執行響應式設計測試...');
        
        // 選擇一個可用的瀏覽器進行響應式測試
        const browserId = Object.keys(this.availableBrowsers)[0];
        if (!browserId) {
            console.log('❌ 沒有可用的瀏覽器進行響應式測試');
            return;
        }
        
        const browserConfig = this.availableBrowsers[browserId];
        
        try {
            const browser = await this.launchBrowser(browserId, browserConfig);
            const page = await browser.newPage();
            
            for (const scenario of this.config.testScenarios) {
                console.log(`  - 測試 ${scenario.name}...`);
                
                try {
                    // 設定視窗大小和設備模擬
                    await page.setViewport({
                        ...scenario.viewport,
                        deviceScaleFactor: scenario.deviceScaleFactor,
                        isMobile: scenario.isMobile
                    });
                    
                    // 載入頁面
                    await page.goto('http://localhost:3007', { 
                        waitUntil: 'networkidle0', 
                        timeout: 30000 
                    });
                    
                    // 檢查響應式元素
                    const responsiveCheck = await page.evaluate((scenarioName) => {
                        const body = document.body;
                        const viewport = {
                            width: window.innerWidth,
                            height: window.innerHeight
                        };
                        
                        // 檢查常見響應式元素
                        const navigation = document.querySelector('nav, .navbar, .navigation');
                        const mainContent = document.querySelector('main, .main-content, .container');
                        const sidebar = document.querySelector('.sidebar, aside');
                        
                        return {
                            scenario: scenarioName,
                            viewport: viewport,
                            bodyWidth: body.offsetWidth,
                            hasNavigation: !!navigation,
                            hasMainContent: !!mainContent,
                            hasSidebar: !!sidebar,
                            navigationVisible: navigation ? navigation.offsetHeight > 0 : false,
                            mainContentVisible: mainContent ? mainContent.offsetHeight > 0 : false
                        };
                    }, scenario.name);
                    
                    // 截圖
                    const screenshotPath = path.join(this.screenshotDir, 
                        `responsive-${scenario.name.replace(/\s+/g, '-')}-${browserId}-${Date.now()}.png`);
                    await page.screenshot({ path: screenshotPath, fullPage: true });
                    
                    this.testResults.scenarios[scenario.name] = {
                        ...responsiveCheck,
                        screenshot: screenshotPath,
                        success: true
                    };
                    
                    console.log(`    ✅ ${scenario.name}: ${responsiveCheck.viewport.width}x${responsiveCheck.viewport.height}`);
                    
                } catch (error) {
                    console.log(`    ❌ ${scenario.name}: ${error.message}`);
                    this.testResults.scenarios[scenario.name] = {
                        success: false,
                        error: error.message
                    };
                }
            }
            
            await browser.close();
            console.log('✅ 響應式設計測試完成');
            
        } catch (error) {
            console.error('❌ 響應式測試失敗:', error.message);
        }
    }

    async runFeatureCompatibilityTests() {
        console.log('🔧 執行功能相容性測試...');
        
        const featureTestResults = {};
        
        // HTML5功能測試
        featureTestResults.html5 = await this.testHTML5Features();
        
        // CSS3功能測試  
        featureTestResults.css3 = await this.testCSS3Features();
        
        // JavaScript ES6+功能測試
        featureTestResults.javascript = await this.testJavaScriptFeatures();
        
        // Web API測試
        featureTestResults.webapis = await this.testWebAPIFeatures();
        
        this.testResults.features = featureTestResults;
        console.log('✅ 功能相容性測試完成');
    }

    async testHTML5Features() {
        console.log('  - 測試HTML5功能支援...');
        
        // 選擇一個瀏覽器進行測試
        const browserId = Object.keys(this.availableBrowsers)[0];
        const browserConfig = this.availableBrowsers[browserId];
        
        try {
            const browser = await this.launchBrowser(browserId, browserConfig);
            const page = await browser.newPage();
            
            const html5Support = await page.evaluate(() => {
                const canvas = document.createElement('canvas');
                const video = document.createElement('video');
                const audio = document.createElement('audio');
                const input = document.createElement('input');
                
                return {
                    canvas: !!(canvas.getContext && canvas.getContext('2d')),
                    video: !!video.canPlayType,
                    audio: !!audio.canPlayType,
                    localStorage: typeof Storage !== 'undefined',
                    sessionStorage: typeof sessionStorage !== 'undefined',
                    geolocation: 'geolocation' in navigator,
                    webworkers: typeof Worker !== 'undefined',
                    websockets: 'WebSocket' in window,
                    inputTypes: {
                        email: (input.type = 'email') && input.type === 'email',
                        date: (input.type = 'date') && input.type === 'date',
                        range: (input.type = 'range') && input.type === 'range'
                    }
                };
            });
            
            await browser.close();
            
            console.log(`    - Canvas支援: ${html5Support.canvas ? '✅' : '❌'}`);
            console.log(`    - 影片支援: ${html5Support.video ? '✅' : '❌'}`);
            console.log(`    - localStorage: ${html5Support.localStorage ? '✅' : '❌'}`);
            console.log(`    - WebSocket: ${html5Support.websockets ? '✅' : '❌'}`);
            
            return html5Support;
            
        } catch (error) {
            console.log(`    ❌ HTML5測試失敗: ${error.message}`);
            return { error: error.message };
        }
    }

    async testCSS3Features() {
        console.log('  - 測試CSS3功能支援...');
        
        const browserId = Object.keys(this.availableBrowsers)[0];
        const browserConfig = this.availableBrowsers[browserId];
        
        try {
            const browser = await this.launchBrowser(browserId, browserConfig);
            const page = await browser.newPage();
            
            const css3Support = await page.evaluate(() => {
                const testElement = document.createElement('div');
                document.body.appendChild(testElement);
                
                const style = testElement.style;
                const support = {
                    flexbox: CSS.supports('display', 'flex'),
                    grid: CSS.supports('display', 'grid'),
                    transforms: CSS.supports('transform', 'translateX(0)'),
                    transitions: CSS.supports('transition', 'all 1s'),
                    animations: CSS.supports('animation', 'test 1s'),
                    gradients: CSS.supports('background', 'linear-gradient(red, blue)'),
                    borderRadius: CSS.supports('border-radius', '5px'),
                    boxShadow: CSS.supports('box-shadow', '0 0 5px red'),
                    customProperties: CSS.supports('--custom-property', 'value')
                };
                
                document.body.removeChild(testElement);
                return support;
            });
            
            await browser.close();
            
            console.log(`    - Flexbox: ${css3Support.flexbox ? '✅' : '❌'}`);
            console.log(`    - Grid: ${css3Support.grid ? '✅' : '❌'}`);
            console.log(`    - Transforms: ${css3Support.transforms ? '✅' : '❌'}`);
            console.log(`    - 自定義屬性: ${css3Support.customProperties ? '✅' : '❌'}`);
            
            return css3Support;
            
        } catch (error) {
            console.log(`    ❌ CSS3測試失敗: ${error.message}`);
            return { error: error.message };
        }
    }

    async testJavaScriptFeatures() {
        console.log('  - 測試JavaScript功能支援...');
        
        const browserId = Object.keys(this.availableBrowsers)[0];
        const browserConfig = this.availableBrowsers[browserId];
        
        try {
            const browser = await this.launchBrowser(browserId, browserConfig);
            const page = await browser.newPage();
            
            const jsSupport = await page.evaluate(() => {
                const support = {};
                
                // ES6+ 功能測試
                try {
                    eval('const test = () => {}; support.arrowFunctions = true;');
                } catch (e) { support.arrowFunctions = false; }
                
                try {
                    eval('const {a} = {a: 1}; support.destructuring = true;');
                } catch (e) { support.destructuring = false; }
                
                try {
                    eval('const [...rest] = [1,2,3]; support.restSpread = true;');
                } catch (e) { support.restSpread = false; }
                
                try {
                    eval('class Test {} support.classes = true;');
                } catch (e) { support.classes = false; }
                
                try {
                    eval('async function test() {} support.asyncAwait = true;');
                } catch (e) { support.asyncAwait = false; }
                
                // API支援
                support.fetch = typeof fetch !== 'undefined';
                support.promise = typeof Promise !== 'undefined';
                support.map = typeof Map !== 'undefined';
                support.set = typeof Set !== 'undefined';
                support.weakMap = typeof WeakMap !== 'undefined';
                support.symbol = typeof Symbol !== 'undefined';
                
                return support;
            });
            
            await browser.close();
            
            console.log(`    - Arrow Functions: ${jsSupport.arrowFunctions ? '✅' : '❌'}`);
            console.log(`    - Classes: ${jsSupport.classes ? '✅' : '❌'}`);
            console.log(`    - Async/Await: ${jsSupport.asyncAwait ? '✅' : '❌'}`);
            console.log(`    - Fetch API: ${jsSupport.fetch ? '✅' : '❌'}`);
            
            return jsSupport;
            
        } catch (error) {
            console.log(`    ❌ JavaScript測試失敗: ${error.message}`);
            return { error: error.message };
        }
    }

    async testWebAPIFeatures() {
        console.log('  - 測試Web API功能支援...');
        
        const browserId = Object.keys(this.availableBrowsers)[0];
        const browserConfig = this.availableBrowsers[browserId];
        
        try {
            const browser = await this.launchBrowser(browserId, browserConfig);
            const page = await browser.newPage();
            
            const apiSupport = await page.evaluate(() => {
                return {
                    serviceWorker: 'serviceWorker' in navigator,
                    notification: 'Notification' in window,
                    geolocation: 'geolocation' in navigator,
                    deviceMotion: 'DeviceMotionEvent' in window,
                    deviceOrientation: 'DeviceOrientationEvent' in window,
                    battery: 'getBattery' in navigator,
                    camera: 'getUserMedia' in navigator.mediaDevices || 'getUserMedia' in navigator,
                    fullscreen: 'requestFullscreen' in document.documentElement ||
                                'webkitRequestFullscreen' in document.documentElement ||
                                'mozRequestFullScreen' in document.documentElement,
                    indexedDB: 'indexedDB' in window,
                    webGL: (() => {
                        try {
                            const canvas = document.createElement('canvas');
                            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
                        } catch (e) {
                            return false;
                        }
                    })(),
                    websocket: 'WebSocket' in window,
                    webRTC: 'RTCPeerConnection' in window || 'webkitRTCPeerConnection' in window
                };
            });
            
            await browser.close();
            
            console.log(`    - Service Worker: ${apiSupport.serviceWorker ? '✅' : '❌'}`);
            console.log(`    - 通知API: ${apiSupport.notification ? '✅' : '❌'}`);
            console.log(`    - 地理位置: ${apiSupport.geolocation ? '✅' : '❌'}`);
            console.log(`    - WebGL: ${apiSupport.webGL ? '✅' : '❌'}`);
            
            return apiSupport;
            
        } catch (error) {
            console.log(`    ❌ Web API測試失敗: ${error.message}`);
            return { error: error.message };
        }
    }

    async analyzeCompatibilityIssues() {
        console.log('🔍 分析相容性問題...');
        
        const issues = [];
        const compatibility = {};
        
        // 分析瀏覽器測試結果
        for (const [browserId, result] of Object.entries(this.testResults.browsers)) {
            if (!result.success) {
                issues.push({
                    type: 'browser_failure',
                    browser: result.name,
                    severity: 'high',
                    description: `${result.name} 基本功能測試失敗`,
                    error: result.error
                });
                continue;
            }
            
            // 檢查個別測試項目
            for (const [testName, testResult] of Object.entries(result.tests || {})) {
                if (!testResult.success) {
                    issues.push({
                        type: 'feature_incompatible',
                        browser: result.name,
                        feature: testName,
                        severity: 'medium',
                        description: `${result.name} 中 ${testName} 功能不相容`,
                        details: testResult
                    });
                }
            }
        }
        
        // 分析響應式設計問題
        for (const [scenarioName, result] of Object.entries(this.testResults.scenarios)) {
            if (!result.success) {
                issues.push({
                    type: 'responsive_issue',
                    scenario: scenarioName,
                    severity: 'medium',
                    description: `響應式設計在 ${scenarioName} 下有問題`,
                    error: result.error
                });
            }
        }
        
        // 分析功能支援度
        for (const [category, features] of Object.entries(this.testResults.features)) {
            if (features.error) continue;
            
            for (const [feature, supported] of Object.entries(features)) {
                if (typeof supported === 'object') {
                    // 處理巢狀物件 (如inputTypes)
                    for (const [subFeature, subSupported] of Object.entries(supported)) {
                        if (!subSupported) {
                            issues.push({
                                type: 'feature_unsupported',
                                category: category,
                                feature: `${feature}.${subFeature}`,
                                severity: 'low',
                                description: `${category} 的 ${feature}.${subFeature} 功能不支援`
                            });
                        }
                    }
                } else if (!supported) {
                    issues.push({
                        type: 'feature_unsupported',
                        category: category,
                        feature: feature,
                        severity: this.getFeatureSeverity(feature),
                        description: `${category} 的 ${feature} 功能不支援`
                    });
                }
            }
        }
        
        // 計算相容性評分
        const totalTests = Object.keys(this.testResults.browsers).length + 
                          Object.keys(this.testResults.scenarios).length;
        const successfulTests = Object.values(this.testResults.browsers).filter(r => r.success).length +
                               Object.values(this.testResults.scenarios).filter(r => r.success).length;
        
        compatibility.overallScore = totalTests > 0 ? Math.round((successfulTests / totalTests) * 100) : 0;
        compatibility.browserCompatibility = this.calculateBrowserCompatibility();
        compatibility.responsiveCompatibility = this.calculateResponsiveCompatibility();
        compatibility.featureCompatibility = this.calculateFeatureCompatibility();
        
        this.testResults.issues = issues;
        this.testResults.compatibility = compatibility;
        
        console.log(`✅ 發現 ${issues.length} 個相容性問題`);
        console.log(`📊 整體相容性評分: ${compatibility.overallScore}/100`);
    }

    getFeatureSeverity(feature) {
        const criticalFeatures = ['flexbox', 'grid', 'fetch', 'promise', 'localStorage'];
        const importantFeatures = ['transforms', 'transitions', 'websockets', 'geolocation'];
        
        if (criticalFeatures.includes(feature)) return 'high';
        if (importantFeatures.includes(feature)) return 'medium';
        return 'low';
    }

    calculateBrowserCompatibility() {
        const browsers = Object.values(this.testResults.browsers);
        const successful = browsers.filter(b => b.success).length;
        return browsers.length > 0 ? Math.round((successful / browsers.length) * 100) : 0;
    }

    calculateResponsiveCompatibility() {
        const scenarios = Object.values(this.testResults.scenarios);
        const successful = scenarios.filter(s => s.success).length;
        return scenarios.length > 0 ? Math.round((successful / scenarios.length) * 100) : 0;
    }

    calculateFeatureCompatibility() {
        let totalFeatures = 0;
        let supportedFeatures = 0;
        
        for (const features of Object.values(this.testResults.features)) {
            if (features.error) continue;
            
            for (const [feature, supported] of Object.entries(features)) {
                if (typeof supported === 'boolean') {
                    totalFeatures++;
                    if (supported) supportedFeatures++;
                } else if (typeof supported === 'object') {
                    for (const subSupported of Object.values(supported)) {
                        if (typeof subSupported === 'boolean') {
                            totalFeatures++;
                            if (subSupported) supportedFeatures++;
                        }
                    }
                }
            }
        }
        
        return totalFeatures > 0 ? Math.round((supportedFeatures / totalFeatures) * 100) : 0;
    }

    async generateImprovementRecommendations() {
        console.log('💡 生成改善建議...');
        
        const recommendations = [];
        
        // 基於問題生成建議
        const criticalIssues = this.testResults.issues.filter(i => i.severity === 'high');
        const mediumIssues = this.testResults.issues.filter(i => i.severity === 'medium');
        
        if (criticalIssues.length > 0) {
            recommendations.push({
                priority: 'high',
                category: '關鍵相容性問題',
                title: '修復高優先級相容性問題',
                description: `發現 ${criticalIssues.length} 個關鍵相容性問題需要立即處理`,
                actions: [
                    '檢查並修復瀏覽器基本功能失敗',
                    '實施關鍵功能的Polyfill',
                    '提供降級方案給不支援的瀏覽器',
                    '更新瀏覽器支援文檔'
                ],
                issues: criticalIssues
            });
        }
        
        if (mediumIssues.length > 0) {
            recommendations.push({
                priority: 'medium',
                category: '功能相容性改善',
                title: '提升功能相容性',
                description: `發現 ${mediumIssues.length} 個中等優先級相容性問題`,
                actions: [
                    '添加功能檢測和漸進式增強',
                    '實施CSS和JavaScript的回退方案',
                    '優化響應式設計在不同裝置的表現',
                    '擴展瀏覽器測試覆蓋範圍'
                ],
                issues: mediumIssues
            });
        }
        
        // 通用改善建議
        recommendations.push({
            priority: 'low',
            category: '長期優化',
            title: '持續改善瀏覽器相容性',
            description: '建立持續的相容性測試和優化流程',
            actions: [
                '建立自動化瀏覽器相容性測試',
                '定期更新瀏覽器支援矩陣',
                '監控新瀏覽器版本和功能',
                '收集用戶瀏覽器使用數據',
                '實施Progressive Web App功能'
            ]
        });
        
        this.testResults.recommendations = recommendations;
        console.log(`✅ 生成了 ${recommendations.length} 項改善建議`);
    }

    async generateCompatibilityReport() {
        console.log('📊 生成相容性報告...');
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                overallScore: this.testResults.compatibility.overallScore,
                browsersTestedCount: Object.keys(this.testResults.browsers).length,
                scenariosTestedCount: Object.keys(this.testResults.scenarios).length,
                issuesFound: this.testResults.issues.length,
                recommendationsGenerated: this.testResults.recommendations.length
            },
            browserCompatibility: this.testResults.compatibility.browserCompatibility,
            responsiveCompatibility: this.testResults.compatibility.responsiveCompatibility,
            featureCompatibility: this.testResults.compatibility.featureCompatibility,
            detailedResults: this.testResults,
            recommendations: this.testResults.recommendations
        };
        
        // 保存JSON報告
        const reportPath = path.join(this.reportDir, `browser-compatibility-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // 生成HTML報告
        const htmlReport = this.generateHTMLCompatibilityReport(report);
        const htmlPath = reportPath.replace('.json', '.html');
        fs.writeFileSync(htmlPath, htmlReport);
        
        console.log(`✅ 相容性報告已生成: ${htmlPath}`);
        
        return {
            jsonPath: reportPath,
            htmlPath: htmlPath,
            report: report
        };
    }

    generateHTMLCompatibilityReport(report) {
        const issuesByType = {};
        report.detailedResults.issues.forEach(issue => {
            if (!issuesByType[issue.type]) issuesByType[issue.type] = [];
            issuesByType[issue.type].push(issue);
        });
        
        return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>瀏覽器相容性測試報告</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f7fa; color: #333; }
        .container { max-width: 1400px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 20px auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
        .score { font-size: 3em; font-weight: bold; margin: 10px 0; }
        .score.excellent { color: #28a745; } .score.good { color: #17a2b8; } .score.warning { color: #ffc107; } .score.poor { color: #dc3545; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; border: 1px solid #e9ecef; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #667eea; }
        .section { margin-bottom: 40px; }
        .section h2 { color: #333; border-bottom: 3px solid #667eea; padding-bottom: 10px; margin-bottom: 20px; }
        .browser-result { background: #f8f9fa; border-left: 4px solid #28a745; padding: 15px; margin-bottom: 15px; border-radius: 0 5px 5px 0; }
        .browser-result.failed { border-color: #dc3545; }
        .issue { background: #fff3cd; border: 1px solid #ffeeba; padding: 15px; margin-bottom: 10px; border-radius: 5px; }
        .issue.high { border-color: #f5c6cb; background: #f8d7da; }
        .issue.medium { border-color: #ffeeba; background: #fff3cd; }
        .issue.low { border-color: #d1ecf1; background: #d1ecf1; }
        .recommendation { background: #e8f5e8; border: 1px solid #d4edda; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
        .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .feature-item { background: #f8f9fa; padding: 10px; border-radius: 5px; text-align: center; }
        .feature-supported { background: #d4edda; } .feature-unsupported { background: #f8d7da; }
        .screenshot-gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .screenshot-item { text-align: center; }
        .screenshot-item img { max-width: 100%; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐 瀏覽器相容性測試報告</h1>
            <div class="score ${this.getScoreClass(report.summary.overallScore)}">${report.summary.overallScore}</div>
            <p>整體相容性評分</p>
            <p style="opacity: 0.9;">生成時間: ${report.timestamp}</p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${report.summary.browsersTestedCount}</div>
                <div>測試瀏覽器</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.summary.scenariosTestedCount}</div>
                <div>響應式場景</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.summary.issuesFound}</div>
                <div>發現問題</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.summary.recommendationsGenerated}</div>
                <div>改善建議</div>
            </div>
        </div>
        
        <div class="section">
            <h2>📊 相容性概覽</h2>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">${report.browserCompatibility}%</div>
                    <div>瀏覽器相容性</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${report.responsiveCompatibility}%</div>
                    <div>響應式相容性</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${report.featureCompatibility}%</div>
                    <div>功能相容性</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>🌐 瀏覽器測試結果</h2>
            ${Object.entries(report.detailedResults.browsers).map(([browserId, result]) => `
                <div class="browser-result ${result.success ? '' : 'failed'}">
                    <h3>${result.name} ${result.success ? '✅' : '❌'}</h3>
                    ${result.success ? `
                        <p><strong>載入時間:</strong> ${result.tests?.homepageLoad?.loadTime || 'N/A'}ms</p>
                        <p><strong>JavaScript:</strong> ${result.tests?.javascript?.success ? '支援' : '問題'}</p>
                        <p><strong>CSS渲染:</strong> ${result.tests?.css?.success ? '正常' : '問題'}</p>
                        <p><strong>表單互動:</strong> ${result.tests?.formInteraction?.success ? '正常' : '問題'}</p>
                    ` : `
                        <p><strong>錯誤:</strong> ${result.error}</p>
                    `}
                </div>
            `).join('')}
        </div>
        
        <div class="section">
            <h2>🔧 功能支援度</h2>
            ${Object.entries(report.detailedResults.features).map(([category, features]) => `
                <h3>${this.getCategoryTitle(category)}</h3>
                <div class="feature-grid">
                    ${this.renderFeatureSupport(features)}
                </div>
            `).join('')}
        </div>
        
        <div class="section">
            <h2>🚨 發現的問題</h2>
            ${Object.entries(issuesByType).map(([type, issues]) => `
                <h3>${this.getIssueTypeTitle(type)} (${issues.length})</h3>
                ${issues.map(issue => `
                    <div class="issue ${issue.severity}">
                        <strong>${issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🔵'} ${issue.description}</strong>
                        ${issue.browser ? `<br><small>瀏覽器: ${issue.browser}</small>` : ''}
                        ${issue.feature ? `<br><small>功能: ${issue.feature}</small>` : ''}
                    </div>
                `).join('')}
            `).join('')}
        </div>
        
        <div class="section">
            <h2>💡 改善建議</h2>
            ${report.recommendations.map(rec => `
                <div class="recommendation">
                    <h3>${rec.title} (${rec.priority === 'high' ? '高優先級' : rec.priority === 'medium' ? '中優先級' : '低優先級'})</h3>
                    <p><strong>類別:</strong> ${rec.category}</p>
                    <p><strong>說明:</strong> ${rec.description}</p>
                    <p><strong>建議行動:</strong></p>
                    <ul>
                        ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
        
        <div style="text-align: center; margin-top: 40px; color: #6c757d;">
            <p>🤖 Generated by GClaude Enterprise Browser Compatibility System</p>
        </div>
    </div>
</body>
</html>`;
    }

    getScoreClass(score) {
        if (score >= 90) return 'excellent';
        if (score >= 75) return 'good';
        if (score >= 60) return 'warning';
        return 'poor';
    }

    getCategoryTitle(category) {
        const titles = {
            html5: 'HTML5 功能',
            css3: 'CSS3 功能',
            javascript: 'JavaScript 功能',
            webapis: 'Web API 功能'
        };
        return titles[category] || category;
    }

    getIssueTypeTitle(type) {
        const titles = {
            browser_failure: '瀏覽器失敗',
            feature_incompatible: '功能不相容',
            responsive_issue: '響應式問題',
            feature_unsupported: '功能不支援'
        };
        return titles[type] || type;
    }

    renderFeatureSupport(features) {
        if (features.error) {
            return `<div class="feature-item feature-unsupported">測試失敗: ${features.error}</div>`;
        }
        
        let html = '';
        for (const [feature, supported] of Object.entries(features)) {
            if (typeof supported === 'boolean') {
                html += `<div class="feature-item ${supported ? 'feature-supported' : 'feature-unsupported'}">
                    ${feature}: ${supported ? '✅' : '❌'}
                </div>`;
            } else if (typeof supported === 'object') {
                for (const [subFeature, subSupported] of Object.entries(supported)) {
                    if (typeof subSupported === 'boolean') {
                        html += `<div class="feature-item ${subSupported ? 'feature-supported' : 'feature-unsupported'}">
                            ${feature}.${subFeature}: ${subSupported ? '✅' : '❌'}
                        </div>`;
                    }
                }
            }
        }
        return html;
    }
}

async function expandBrowserSupport() {
    const expander = new BrowserSupportExpansion();
    return await expander.runBrowserCompatibilityTests();
}

if (require.main === module) {
    expandBrowserSupport()
        .then(results => {
            console.log('\n🎉 瀏覽器支援擴展測試完成！');
            console.log(`📊 整體相容性評分: ${results.compatibility.overallScore}/100`);
            console.log(`🌐 瀏覽器相容性: ${results.compatibility.browserCompatibility}%`);
            console.log(`📱 響應式相容性: ${results.compatibility.responsiveCompatibility}%`);
            console.log(`🔧 功能相容性: ${results.compatibility.featureCompatibility}%`);
        })
        .catch(console.error);
}

module.exports = BrowserSupportExpansion;