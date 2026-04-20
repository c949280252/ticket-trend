/**
 * Vercel Serverless API 代理
 * 将 /api/* 请求转发到后端服务器
 */

const BACKEND_URL = 'http://38.181.25.184:8880';

export default async function handler(req, res) {
  // 获取请求路径和方法
  const path = req.params?.path?.join('/') || '';
  const method = req.method;
  
  // 构建后端URL
  const url = `${BACKEND_URL}/${path}`;
  
  // 复制请求头 (移除Vercel特定的头)
  const headers = { ...req.headers };
  delete headers['host'];
  delete headers['x-vercel-id'];
  delete headers['x-vercel-deployment-id'];
  
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: method !== 'GET' && method !== 'HEAD' ? req.body : undefined,
      redirect: 'manual',
    });
    
    // 获取响应头和状态
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    // 返回响应
    res.status(response.status);
    Object.entries(responseHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    const body = await response.text();
    res.send(body);
    
  } catch (error) {
    res.status(502).json({
      code: 502,
      msg: '后端服务请求失败: ' + error.message
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};