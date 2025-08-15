const fs = require('fs');

function checkDeploymentStatus() {
    console.log('📊 部署狀態檢查...');
    
    const config = JSON.parse(fs.readFileSync('deployment-urls.json', 'utf8'));
    
    console.log('🌐 可用網址:');
    config.availableUrls.forEach(url => {
        const status = url.status === 'active' ? '✅' : 
                      url.status === 'pending_deployment' ? '⏳' : '❌';
        console.log(`${status} ${url.name}: ${url.url}`);
        
        if (url.deployCommand) {
            console.log(`   部署命令: ${url.deployCommand}`);
        }
    });
    
    console.log('\n📋 下一步操作:');
    console.log('1. 執行 node validate.js 驗證本地服務');
    console.log('2. 完成雲端平台登入認證');
    console.log('3. 執行對應的部署命令');
    console.log('4. 重新執行 node validate.js 驗證部署結果');
}

if (require.main === module) {
    checkDeploymentStatus();
}

module.exports = checkDeploymentStatus;