// 简单的Node.js脚本用于测试和修复用户数据问题
import https from 'https';

// 配置信息
const SUPABASE_URL = 'ncgjyulrxlavejpgriju.supabase.co';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jZ2p5dWxyeGxhdmVqcGdyaWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MDc2MzIsImV4cCI6MjA3MzM4MzYzMn0.yM0nV0WUOO1UdUuRWCKjs4k3-W3FkflrpzK1cD3ULkk';

// 用户信息
const USER_ID = '3f1dd61c-4cfe-4282-9cb0-c3181f200f46';
const USER_EMAIL = '1@1.com';

// 测试账号信息
const TEST_EMAIL = '123@123.com';
const TEST_PASSWORD = '123';

console.log('开始测试和修复用户数据问题...\n');

// 1. 检查用户是否存在
function checkUserExists() {
    return new Promise((resolve, reject) => {
        console.log('1. 检查用户是否存在...');
        
        const options = {
            hostname: SUPABASE_URL,
            port: 443,
            path: `/rest/v1/users?id=eq.${USER_ID}`,
            method: 'GET',
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${API_KEY}`
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    console.log('用户查询结果:', result);
                    if (Array.isArray(result) && result.length > 0) {
                        console.log('✓ 用户已存在\n');
                        resolve(true);
                    } else {
                        console.log('✗ 用户不存在\n');
                        resolve(false);
                    }
                } catch (error) {
                    console.error('解析用户查询结果时出错:', error);
                    resolve(false);
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('检查用户存在性时出错:', error);
            resolve(false);
        });
        
        req.end();
    });
}

// 2. 用户登录
function loginUser() {
    return new Promise((resolve, reject) => {
        console.log('2. 用户登录...');
        
        const postData = JSON.stringify({
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        
        const options = {
            hostname: SUPABASE_URL,
            port: 443,
            path: '/auth/v1/token?grant_type=password',
            method: 'POST',
            headers: {
                'apikey': API_KEY,
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    console.log('登录结果:', result);
                    if (result.access_token) {
                        console.log('✓ 登录成功\n');
                        resolve(result.access_token);
                    } else {
                        console.log('✗ 登录失败\n');
                        resolve(null);
                    }
                } catch (error) {
                    console.error('解析登录结果时出错:', error);
                    resolve(null);
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('登录时出错:', error);
            resolve(null);
        });
        
        req.write(postData);
        req.end();
    });
}

// 3. 加载任务
function loadTasks(accessToken) {
    return new Promise((resolve, reject) => {
        console.log('3. 加载任务...');
        
        const options = {
            hostname: SUPABASE_URL,
            port: 443,
            path: '/rest/v1/tasks?select=*',
            method: 'GET',
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${accessToken}`
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    console.log('任务加载结果:', result);
                    if (Array.isArray(result)) {
                        console.log(`✓ 成功加载 ${result.length} 个任务\n`);
                        resolve(result);
                    } else {
                        console.log('✗ 加载任务失败\n');
                        resolve([]);
                    }
                } catch (error) {
                    console.error('解析任务加载结果时出错:', error);
                    resolve([]);
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('加载任务时出错:', error);
            resolve([]);
        });
        
        req.end();
    });
}

// 主函数
async function main() {
    try {
        // 检查用户是否存在
        const userExists = await checkUserExists();
        
        // 用户登录
        const accessToken = await loginUser();
        
        if (accessToken) {
            // 加载任务
            const tasks = await loadTasks(accessToken);
            
            console.log('=== 测试完成 ===');
            console.log(`用户存在: ${userExists ? '是' : '否'}`);
            console.log(`访问令牌: ${accessToken ? '获取成功' : '获取失败'}`);
            console.log(`任务数量: ${tasks.length}`);
        } else {
            console.log('=== 登录失败，无法继续测试 ===');
        }
    } catch (error) {
        console.error('主函数执行时出错:', error);
    }
}

// 执行主函数
main();