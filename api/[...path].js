/**
 * Vercel Serverless API 代理
 * 将 /api/* 请求转发到后端服务器
 */

const BACKEND_URL = 'http://38.181.25.184:8880';

export default async function handler(req, res) {
  // 获取请求路径 - 去掉前导的api
  let path = req.url || '/';
  path = path.replace(/^\/api\/?/, '');
  if (path === '/api') path = '';
  
  const method = req.method;
  
  // 构建后端URL
  const url = path ? `${BACKEND_URL}/${path}` : BACKEND_URL;
  
  // 复制请求头
  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (key !== 'host' && key !== 'x-vercel-id' && key !== 'x-vercel-deployment-id') {
      headers[key] = value;
    }
  }
  
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: method !== 'GET' && method !== 'HEAD' ? req.body : undefined,
    });
    
    // 返回响应
    res.status(response.status);
    
    const body = await response.text();
    res.send(body);
    
  } catch (error) {
    res.status(502).json({
      code: 502,
      msg: '后端服务请求失败: ' + error.message
    });
  }
}