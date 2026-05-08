<template>
  <div class="login-page">
    <div class="login-box">
      <h2>后台登录</h2>
      <input 
        type="password" 
        v-model="password" 
        placeholder="请输入密码"
        @keyup.enter="handleLogin"
      />
      <button @click="handleLogin" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </button>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  if (!password.value) {
    error.value = '请输入密码'
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    const res = await axios.post('/api/admin/login', { password: password.value })
    if (res.data.ok) {
      // 登录成功，保存token
      localStorage.setItem('admin_token', res.data.token)
      router.push('/x7k9m2/lottery')
    }
  } catch (e) {
    error.value = e.response?.data?.error || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.login-box {
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  width: 300px;
}

.login-box h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.login-box input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  margin-bottom: 1rem;
  box-sizing: border-box;
}

.login-box button {
  width: 100%;
  padding: 0.75rem;
  background: #1a56a8;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}

.login-box button:disabled {
  background: #ccc;
}

.login-box .error {
  color: #e63946;
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
}
</style>