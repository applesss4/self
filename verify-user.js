// 验证用户数据的Node.js脚本
import https from 'https';

// 配置信息
const SUPABASE_URL = 'ncgjyulrxlavejpgriju.supabase.co';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jZ2p5dWxyeGxhdmVqcGdyaWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MDc2MzIsImV4cCI6MjA3MzM4MzYzMn0.yM0nV0WUOO1UdUuRWCKjs4k3-W3FkflrpzK1cD3ULkk';

// 测试账号信息
const TEST_EMAIL = '123@123.com';
const TEST_PASSWORD = '123';

console.log('开始验证用户数据...\n');

// 用户登录
function loginUser() {
    return new Promise((resolve, reject) => {
        console.log('1. 用户登录...');
        
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
                        resolve(result);
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

// 通过RPC检查用户是否存在
function checkUserViaRPC(loginData) {
    return new Promise((resolve, reject) => {
        console.log('2. 通过RPC检查用户是否存在...');
        
        // 使用Supabase的RPC功能来检查用户
        const options = {
            hostname: SUPABASE_URL,
            port: 443,
            path: '/rest/v1/rpc/check_user_exists',
            method: 'POST',
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${loginData.access_token}`,
                'Content-Type': 'application/json'
            }
        };
        
        // 由于我们没有定义check_user_exists函数，我们直接尝试查询用户表
        const postData = JSON.stringify({
            user_id: loginData.user.id
        });
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('RPC检查状态码:', res.statusCode);
                console.log('RPC检查响应数据:', data);
                
                try {
                    const result = JSON.parse(data);
                    console.log('RPC检查结果:', result);
                    resolve(result);
                } catch (error) {
                    console.error('解析RPC检查结果时出错:', error);
                    resolve(null);
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('RPC检查时出错:', error);
            resolve(null);
        });
        
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

// 直接查询用户表（使用用户自己的访问令牌）
function queryUserTable(loginData) {
    return new Promise((resolve, reject) => {
        console.log('2. 直接查询用户表...');
        
        const options = {
            hostname: SUPABASE_URL,
            port: 443,
            path: `/rest/v1/users?select=*&id=eq.${loginData.user.id}`,
            method: 'GET',
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${loginData.access_token}`
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('查询用户表状态码:', res.statusCode);
                console.log('查询用户表响应头:', res.headers);
                console.log('查询用户表响应数据:', data);
                
                try {
                    const result = JSON.parse(data);
                    console.log('查询用户表结果:', result);
                    if (Array.isArray(result) && result.length > 0) {
                        console.log('✓ 用户记录存在\n');
                        resolve(result[0]);
                    } else {
                        console.log('✗ 用户记录不存在\n');
                        resolve(null);
                    }
                } catch (error) {
                    console.error('解析查询用户表结果时出错:', error);
                    resolve(null);
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('查询用户表时出错:', error);
            resolve(null);
        });
        
        req.end();
    });
}

// 创建测试任务
function createTestTask(loginData) {
    return new Promise((resolve, reject) => {
        console.log('3. 创建测试任务...');
        
        const today = new Date().toISOString().split('T')[0];
        const postData = JSON.stringify({
            user_id: loginData.user.id,
            title: '测试任务 - ' + new Date().toLocaleString(),
            date: today,
            category: 'life',
            time: '12:00',
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
        
        const options = {
            hostname: SUPABASE_URL,
            port: 443,
            path: '/rest/v1/tasks',
            method: 'POST',
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${loginData.access_token}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('创建任务状态码:', res.statusCode);
                console.log('创建任务响应数据:', data);
                
                try {
                    const result = JSON.parse(data);
                    console.log('创建任务结果:', result);
                    if (result && !result.message) {
                        console.log('✓ 测试任务创建成功\n');
                        resolve(true);
                    } else {
                        console.log('✗ 测试任务创建失败\n');
                        resolve(false);
                    }
                } catch (error) {
                    console.error('解析创建任务结果时出错:', error);
                    // 即使解析出错，如果状态码是201，也认为创建成功
                    if (res.statusCode === 201) {
                        console.log('✓ 测试任务创建成功（状态码201）\n');
                        resolve(true);
                    } else {
                        console.log('✗ 测试任务创建失败\n');
                        resolve(false);
                    }
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('创建测试任务时出错:', error);
            resolve(false);
        });
        
        req.write(postData);
        req.end();
    });
}

// 主函数
async function main() {
    try {
        console.log('=== 开始验证用户数据 ===\n');
        
        // 1. 用户登录
        const loginData = await loginUser();
        
        if (!loginData || !loginData.access_token) {
            console.log('=== 登录失败，无法继续验证 ===');
            return;
        }
        
        // 2. 查询用户表
        const userRecord = await queryUserTable(loginData);
        
        // 3. 如果用户记录存在，尝试创建测试任务
        if (userRecord) {
            const taskSuccess = await createTestTask(loginData);
            
            if (taskSuccess) {
                console.log('=== 用户数据验证成功 ===');
                console.log(`用户ID: ${loginData.user.id}`);
                console.log(`用户邮箱: ${loginData.user.email}`);
                console.log('✓ 用户可以正常创建任务');
            } else {
                console.log('=== 用户数据验证部分成功 ===');
                console.log(`用户ID: ${loginData.user.id}`);
                console.log(`用户邮箱: ${loginData.user.email}`);
                console.log('✗ 用户无法创建任务，可能存在RLS策略问题');
            }
        } else {
            console.log('=== 用户记录不存在 ===');
            console.log(`用户ID: ${loginData.user.id}`);
            console.log(`用户邮箱: ${loginData.user.email}`);
        }
    } catch (error) {
        console.error('主函数执行时出错:', error);
    }
}

// 执行主函数
main();