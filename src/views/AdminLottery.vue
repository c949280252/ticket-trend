<template>
  <div class="admin-page">
    <div class="header">
      <h2>开奖结果管理</h2>
      <div class="header-actions">
        <button class="secondary-btn" @click="showHistory = !showHistory">
          {{ showHistory ? '返回管理' : '查看历史' }}
        </button>
        <button class="secondary-btn" @click="showPasswordModal = true">修改密码</button>
        <button class="logout-btn" @click="handleLogout">退出登录</button>
      </div>
    </div>

    <!-- 切换到历史记录页面 -->
    <div v-if="showHistory" class="history-page">
      <div class="history-header">
        <select v-model="historyType">
          <option value="">全部彩种</option>
          <option v-for="(config, key) in LOTTERY_CONFIG" :key="key" :value="key">
            {{ config.name }}
          </option>
        </select>
        <button @click="fetchHistory">查询</button>
      </div>
      <div class="table-box">
        <table>
          <thead>
            <tr>
              <th>彩种</th>
              <th>期号</th>
              <th>开奖号码</th>
              <th>开奖时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in historyList" :key="item.id">
              <td>{{ getLotteryName(item.lottery_type) }}</td>
              <td>{{ item.issue }}</td>
              <td>{{ item.code }}</td>
              <td>{{ item.draw_time }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="historyList.length === 0" class="empty">暂无数据</div>
    </div>

    <!-- 管理页面 -->
    <template v-else>
      <!-- 添加/编辑表单 -->
      <div class="form-box">
        <h3>{{ editingId ? '编辑开奖' : '添加开奖' }}</h3>
        <div class="form-row">
          <select v-model="form.lottery_type" @change="onLotteryTypeChange">
            <option value="">选择彩种</option>
            <option v-for="(config, key) in LOTTERY_CONFIG" :key="key" :value="key">
              {{ config.name }}
            </option>
          </select>
          <input v-model="form.issue" placeholder="期号，如2026026" />
          <input 
            v-model="form.code" 
            :placeholder="codePlaceholder"
            @input="validateCode"
            maxlength="19"
          />
          <input v-model="form.draw_time" type="datetime-local" />
        </div>
        <div class="form-actions">
          <button @click="handleSubmit" :disabled="submitting">
            {{ submitting ? '提交中...' : (editingId ? '更新' : '添加') }}
          </button>
          <button v-if="editingId" @click="cancelEdit" class="cancel-btn">取消</button>
        </div>
        <p v-if="codeError" class="error">{{ codeError }}</p>
      </div>

      <!-- 搜索 -->
      <div class="search-box">
        <select v-model="searchType">
          <option value="">全部彩种</option>
          <option v-for="(config, key) in LOTTERY_CONFIG" :key="key" :value="key">
            {{ config.name }}
          </option>
        </select>
        <input v-model="searchIssue" placeholder="搜索期号" />
        <button @click="fetchData">搜索</button>
      </div>

      <!-- 数据列表 -->
      <div class="table-box">
        <table>
          <thead>
            <tr>
              <th>彩种</th>
              <th>期号</th>
              <th>开奖号码</th>
              <th>开奖时间</th>
              <th>录入时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in list" :key="item.id">
              <td>{{ getLotteryName(item.lottery_type) }}</td>
              <td>{{ item.issue }}</td>
              <td>{{ item.code }}</td>
              <td>{{ item.draw_time }}</td>
              <td>{{ formatDate(item.created_at) }}</td>
              <td>
                <button @click="handleEdit(item)" class="edit-btn">编辑</button>
                <button @click="handleDelete(item.id)" class="delete-btn">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- 修改密码弹窗 -->
    <div v-if="showPasswordModal" class="modal-overlay" @click.self="showPasswordModal = false">
      <div class="modal">
        <h3>修改密码</h3>
        <input v-model="passwordForm.oldPassword" type="password" placeholder="旧密码" />
        <input v-model="passwordForm.newPassword" type="password" placeholder="新密码" />
        <input v-model="passwordForm.confirmPassword" type="password" placeholder="确认新密码" />
        <p v-if="passwordError" class="error">{{ passwordError }}</p>
        <div class="modal-actions">
          <button @click="handleChangePassword" :disabled="changing">
            {{ changing ? '提交中...' : '确认' }}
          </button>
          <button @click="showPasswordModal = false" class="cancel-btn">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const LOTTERY_CONFIG = {
  '3d': { name: '福彩3D', codeLen: 3 },
  'ssq': { name: '双色球', codeLen: 7 },
  'dlt': { name: '超级大乐透', codeLen: 7 },
  'qlc': { name: '七乐彩', codeLen: 7 },
  'plw': { name: '排列五', codeLen: 5 },
  'pl3': { name: '排列三', codeLen: 3 },
  'qxc': { name: '七星彩', codeLen: 7 }
}

const list = ref([])
const historyList = ref([])
const searchType = ref('')
const searchIssue = ref('')
const historyType = ref('')
const submitting = ref(false)
const editingId = ref(null)
const showHistory = ref(false)
const showPasswordModal = ref(false)
const changing = ref(false)
const codeError = ref('')
const passwordError = ref('')

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const form = reactive({
  lottery_type: '',
  issue: '',
  code: '',
  draw_time: ''
})

const getToken = () => localStorage.getItem('admin_token')

const codePlaceholder = computed(() => {
  if (!form.lottery_type) return '开奖号码'
  const len = LOTTERY_CONFIG[form.lottery_type]?.codeLen || 7
  if (len <= 3) return `如2,0,7 (${len}个数字，逗号分隔)`
  const examples = ['1,2,3,4,5', '01,02,03,04,05+06,07']
  return `如${examples[len > 5 ? 1 : 0]}`
})

const validateCode = () => {
  codeError.value = ''
  if (!form.lottery_type || !form.code) return
  
  const len = LOTTERY_CONFIG[form.lottery_type]?.codeLen || 7
  const code = form.code.replace(/\s/g, '')
  const hasPlus = code.includes('+')
  const parts = code.split('+')
  
  if (hasPlus && len > 5) {
    // 大乐透/双色球/七乐彩/七星彩格式: 前区+后区
    const frontLen = len - 2
    if (parts[0].split(',').length !== frontLen || parts[1].split(',').length !== 2) {
      codeError.value = `格式错误，应为 ${frontLen}个号码+2个号码`
    }
  } else if (code.split(',').length !== len) {
    codeError.value = `格式错误，应为 ${len}个数字，逗号分隔`
  }
}

const onLotteryTypeChange = async () => {
  if (!form.lottery_type) return
  
  // 获取最近一次开奖时间作为默认值
  try {
    const res = await axios.get(`/api/lottery/${form.lottery_type}`, {
      headers: { Authorization: getToken() }
    })
    if (res.data.latest?.date) {
      // 转换为 datetime-local 格式
      const date = new Date(res.data.latest.date)
      form.draw_time = date.toISOString().slice(0, 16)
    }
  } catch (e) {
    // 忽略错误
  }
  
  // 清空号码错误提示
  codeError.value = ''
}

const fetchData = async () => {
  const params = new URLSearchParams()
  if (searchType.value) params.append('type', searchType.value)
  if (searchIssue.value) params.append('issue', searchIssue.value)
  
  const res = await axios.get(`/api/admin/lottery?${params}`, {
    headers: { Authorization: getToken() }
  })
  list.value = res.data
}

const fetchHistory = async () => {
  if (!historyType.value) {
    historyList.value = []
    return
  }
  const res = await axios.get(`/api/lottery/${historyType.value}/history`)
  historyList.value = res.data
}

const handleSubmit = async () => {
  if (!form.lottery_type || !form.issue || !form.code || !form.draw_time) {
    alert('请填写完整')
    return
  }
  if (codeError.value) {
    alert('开奖号码格式有误')
    return
  }
  
  submitting.value = true
  try {
    if (editingId.value) {
      await axios.put(`/api/admin/lottery/${editingId.value}`, form, {
        headers: { Authorization: getToken() }
      })
    } else {
      await axios.post('/api/admin/lottery', form, {
        headers: { Authorization: getToken() }
      })
    }
    cancelEdit()
    fetchData()
  } catch (e) {
    alert(e.response?.data?.error || '操作失败')
  } finally {
    submitting.value = false
  }
}

const handleEdit = (item) => {
  editingId.value = item.id
  form.lottery_type = item.lottery_type
  form.issue = item.issue
  form.code = item.code
  form.draw_time = item.draw_time?.replace(' ', 'T') || ''
}

const cancelEdit = () => {
  editingId.value = null
  form.lottery_type = ''
  form.issue = ''
  form.code = ''
  form.draw_time = ''
  codeError.value = ''
}

const handleDelete = async (id) => {
  if (!confirm('确定删除？')) return
  await axios.delete(`/api/admin/lottery/${id}`, {
    headers: { Authorization: getToken() }
  })
  fetchData()
}

const handleLogout = () => {
  localStorage.removeItem('admin_token')
  router.push('/admin')
}

const handleChangePassword = async () => {
  if (!passwordForm.oldPassword || !passwordForm.newPassword) {
    passwordError.value = '请填写完整'
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = '两次密码不一致'
    return
  }
  if (passwordForm.newPassword.length < 4) {
    passwordError.value = '密码至少4位'
    return
  }
  
  changing.value = true
  passwordError.value = ''
  try {
    await axios.put('/api/admin/password', {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    }, {
      headers: { Authorization: getToken() }
    })
    alert('密码修改成功，请重新登录')
    handleLogout()
  } catch (e) {
    passwordError.value = e.response?.data?.error || '修改失败'
  } finally {
    changing.value = false
  }
}

const getLotteryName = (type) => LOTTERY_CONFIG[type]?.name || type

const formatDate = (date) => {
  if (!date) return ''
  return date.replace('T', ' ').slice(0, 19)
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.admin-page {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header h2 {
  margin: 0;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background: #666;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.form-box {
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.form-box h3 {
  margin: 0 0 1rem 0;
}

.form-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.form-row select,
.form-row input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-row select {
  min-width: 120px;
}

.form-row input[type="text"] {
  flex: 1;
  min-width: 150px;
}

.form-row input[type="datetime-local"] {
  width: 200px;
}

.form-actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

.form-actions button {
  padding: 0.5rem 1.5rem;
  background: #1a56a8;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.form-actions button:disabled {
  background: #ccc;
}

.cancel-btn {
  background: #666 !important;
}

.search-box {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.search-box select,
.search-box input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.search-box button {
  padding: 0.5rem 1rem;
  background: #1a56a8;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.table-box {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f5f5f5;
  font-weight: bold;
}

.edit-btn, .delete-btn {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.25rem;
}

.edit-btn {
  background: #1a56a8;
  color: #fff;
}

.delete-btn {
  background: #e63946;
  color: #fff;
}

/* 历史记录页面 */
.history-page {
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
}

.history-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.history-header select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.history-header button {
  padding: 0.5rem 1rem;
  background: #1a56a8;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.empty {
  padding: 2rem;
  text-align: center;
  color: #999;
}

/* 修改密码弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
}

.modal h3 {
  margin-top: 0;
}

.modal input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 0.75rem;
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
}

.modal-actions button {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.modal-actions button:first-child {
  background: #1a56a8;
  color: #fff;
}

.error {
  color: #e63946;
  font-size: 0.875rem;
  margin: 0.25rem 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.secondary-btn {
  padding: 0.5rem 1rem;
  background: #666;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>