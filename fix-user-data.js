// 修复用户数据的Node.js脚本
import https from 'https';

// 配置信息
const SUPABASE_URL = 'ncgjyulrxlavejpgriju.supabase.co';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jZ2p5dWxyeGxhdmVqcGdyaWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MDc2MzIsImV4cCI6MjA3MzM4MzYzMn0.yM0nV0WUOO1UdUuRWCKjs4k3-W3FkflrpzK1cD3ULkk';

// 测试账号信息
const TEST_EMAIL = '123@123.com';
const TEST_PASSWORD = '123';

console.log('开始修复用户数据...\n');

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

// 创建用户记录
function createUserRecord(loginData) {
    return new Promise((resolve, reject) => {
        console.log('2. 创建用户记录...');
        
        const postData = JSON.stringify({
            id: loginData.user.id,
            email: loginData.user.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
        
        const options = {
            hostname: SUPABASE_URL,
            port: 443,
            path: '/rest/v1/users',
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
                console.log('创建用户记录状态码:', res.statusCode);
                console.log('创建用户记录响应头:', res.headers);
                console.log('创建用户记录响应数据:', data);
                
                try {
                    const result = JSON.parse(data);
                    console.log('创建用户记录结果:', result);
                    if (result && !result.message) {
                        console.log('✓ 用户记录创建成功\n');
                        resolve(true);
                    } else {
                        console.log('✗ 用户记录创建失败\n');
                        resolve(false);
                    }
                } catch (error) {
                    console.error('解析创建用户记录结果时出错:', error);
                    // 即使解析出错，如果状态码是201，也认为创建成功
                    if (res.statusCode === 201) {
                        console.log('✓ 用户记录创建成功（状态码201）\n');
                        resolve(true);
                    } else {
                        console.log('✗ 用户记录创建失败\n');
                        resolve(false);
                    }
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('创建用户记录时出错:', error);
            resolve(false);
        });
        
        req.write(postData);
        req.end();
    });
}

// 验证用户记录
function verifyUserRecord(accessToken, userId) {
    return new Promise((resolve, reject) => {
        console.log('3. 验证用户记录...');
        
        const options = {
            hostname: SUPABASE_URL,
            port: 443,
            path: `/rest/v1/users?id=eq.${userId}`,
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
                    console.log('验证用户记录结果:', result);
                    if (Array.isArray(result) && result.length > 0) {
                        console.log('✓ 用户记录验证成功\n');
                        resolve(true);
                    } else {
                        console.log('✗ 用户记录验证失败\n');
                        resolve(false);
                    }
                } catch (error) {
                    console.error('解析验证用户记录结果时出错:', error);
                    resolve(false);
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('验证用户记录时出错:', error);
            resolve(false);
        });
        
        req.end();
    });
}

// 主函数
async function main() {
    try {
        console.log('=== 开始修复用户数据 ===\n');
        
        // 1. 用户登录
        const loginData = await loginUser();
        
        if (!loginData || !loginData.access_token) {
            console.log('=== 登录失败，无法继续修复 ===');
            return;
        }
        
        // 2. 创建用户记录
        const createSuccess = await createUserRecord(loginData);
        
        // 3. 验证用户记录
        if (createSuccess) {
            const verifySuccess = await verifyUserRecord(loginData.access_token, loginData.user.id);
            
            if (verifySuccess) {
                console.log('=== 用户数据修复成功 ===');
                console.log(`用户ID: ${loginData.user.id}`);
                console.log(`用户邮箱: ${loginData.user.email}`);
            } else {
                console.log('=== 用户数据修复完成，但验证失败 ===');
            }
        } else {
            console.log('=== 用户数据修复失败 ===');
        }
    } catch (error) {
        console.error('主函数执行时出错:', error);
    }
}

// 执行主函数
main();