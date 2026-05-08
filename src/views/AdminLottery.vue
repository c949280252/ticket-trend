<template>
  <div class="admin-page">
    <div class="header">
      <h2>开奖结果管理</h2>
      <div class="header-actions">
        <button :class="['tab-btn', { active: currentTab === 'lottery' }]" @click="currentTab = 'lottery'">开奖</button>
        <button :class="['tab-btn', { active: currentTab === 'announcement' }]" @click="currentTab = 'announcement'">公告</button>
        <button class="tab-btn" @click="showPasswordModal = true">改密码</button>
        <button class="tab-btn logout" @click="handleLogout">退出</button>
      </div>
    </div>

    <!-- 开奖管理 -->
    <template v-if="currentTab === 'lottery'">
      <!-- 添加表单 -->
      <div class="form-box">
        <h3>{{ editingId ? '编辑开奖' : '添加开奖' }}</h3>
        <div class="form-row">
          <select v-model="form.lottery_type" @change="onLotteryTypeChange">
            <option value="">选择彩种</option>
            <option v-for="(config, key) in QUERY_CONFIG" :key="key" :value="key">
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

      <!-- 彩种标签 -->
      <div class="lottery-tabs">
        <button 
          v-for="(config, key) in LOTTERY_CONFIG" 
          :key="key"
          :class="['lottery-tab', { active: searchType === key }]"
          @click="switchTab(key)"
        >
          {{ config.name }}
        </button>
      </div>
      <div class="search-row">
        <input v-model="searchIssue" placeholder="搜索期号" @keyup.enter="fetchData" />
        <button @click="fetchData">查询</button>
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

      <!-- 加载更多 -->
      <div class="load-more" ref="loadmoreRef" v-if="hasMore && !loading" @click="loadMore">
        点击加载更多
      </div>
      <div class="load-more" v-if="loading">加载中...</div>
    </template>

    <!-- 公告管理 -->
    <template v-if="currentTab === 'announcement'">
      <div class="form-box">
        <h3>{{ annEditingId ? '编辑公告' : '添加公告' }}</h3>
        <textarea v-model="annForm.content" placeholder="公告内容" rows="4"></textarea>
        <label class="checkbox-label">
          <input type="checkbox" v-model="annForm.enabled" />
          启用
        </label>
        <div class="form-actions">
          <button @click="handleAnnSubmit" :disabled="annSubmitting">
            {{ annSubmitting ? '提交中...' : (annEditingId ? '更新' : '添加') }}
          </button>
          <button v-if="annEditingId" @click="cancelAnnEdit" class="cancel-btn">取消</button>
        </div>
      </div>
      <div class="table-box">
        <table>
          <thead>
            <tr>
              <th>内容</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in annList" :key="item.id">
              <td>{{ item.content }}</td>
              <td>
                <button 
                  @click="toggleAnnouncement(item)" 
                  :class="['status-btn', item.enabled ? 'enabled' : 'disabled']"
                  :disabled="annLoading"
                >
                  {{ annLoading ? '...' : (item.enabled ? '停用' : '启用') }}
                </button>
              </td>
              <td>
                <button @click="handleAnnEdit(item)" class="edit-btn">编辑</button>
                <button @click="handleAnnDelete(item.id)" class="delete-btn">删除</button>
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
import { ref, reactive, computed, onMounted } from 'vue'
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

// 查询用的彩种配置（不包含pl3，因为pl3数据来自plw）
const QUERY_CONFIG = { ...LOTTERY_CONFIG }

const PAGE_SIZE = 20
const list = ref([])
const searchType = ref('3d')
const searchIssue = ref('')
const submitting = ref(false)
const editingId = ref(null)
const currentTab = ref('lottery')
const showPasswordModal = ref(false)
const changing = ref(false)
const codeError = ref('')
const passwordError = ref('')
const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)
const loadmoreRef = ref(null)

// 公告相关
const annList = ref([])
const annEditingId = ref(null)
const annSubmitting = ref(false)
const annLoading = ref(false)
const annForm = reactive({
  content: '',
  enabled: true
})

const form = reactive({
  lottery_type: '',
  issue: '',
  code: '',
  draw_time: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const getToken = () => localStorage.getItem('admin_token')

const codePlaceholder = computed(() => {
  if (!form.lottery_type) return '开奖号码'
  const len = LOTTERY_CONFIG[form.lottery_type]?.codeLen || 7
  if (len <= 3) return `如2,0,7 (${len}个数字)`
  return `如1,2,3,4,5,6,7 (${len}个数字)`
})

const validateCode = () => {
  codeError.value = ''
  if (!form.lottery_type || !form.code) return
  
  const len = LOTTERY_CONFIG[form.lottery_type]?.codeLen || 7
  const code = form.code.replace(/\s/g, '')
  const parts = code.split(',')
  const validParts = parts.filter(p => p)
  
  if (validParts.length !== len) {
    codeError.value = `格式错误，应为 ${len}个数字`
  }
}

// 彩种开奖时间
const LOTTERY_DRAW_TIME = {
  '3d': '21:15',
  'ssq': '21:15',
  'dlt': '20:25',
  'qlc': '21:15',
  'plw': '20:30',
  'qxc': '20:30'
}

const onLotteryTypeChange = async () => {
  if (!form.lottery_type) return
  
  // 获取该彩种最近一次开奖时间
  try {
    const res = await axios.get(`/api/lottery/${form.lottery_type}`)
    if (res.data.latest?.date) {
      // 直接从日期字符串提取时分（格式：2026-05-07T21:15:00.000Z）
      const dateStr = res.data.latest.date
      const match = dateStr.match(/T(\d{2}):(\d{2}):/)
      if (match) {
        const hour = parseInt(match[1])
        const minute = parseInt(match[2])
        
        // 用今天的日期 + 最近开奖的时分（本地时间）
        const today = new Date()
        today.setHours(hour, minute, 0, 0)
        
        // 格式化为 YYYY-MM-DDTHH:mm 本地时间
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        const h = String(today.getHours()).padStart(2, '0')
        const m = String(today.getMinutes()).padStart(2, '0')
        form.draw_time = `${year}-${month}-${day}T${h}:${m}`
        codeError.value = ''
        return
      }
    }
  } catch (e) {
    // 如果获取失败，使用默认时间
  }
  
  // 默认时间
  const today = new Date()
  const drawTime = LOTTERY_DRAW_TIME[form.lottery_type] || '21:00'
  const [hour, minute] = drawTime.split(':')
  today.setHours(parseInt(hour), parseInt(minute), 0, 0)
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const h = String(today.getHours()).padStart(2, '0')
  const m = String(today.getMinutes()).padStart(2, '0')
  form.draw_time = `${year}-${month}-${day}T${h}:${m}`
  codeError.value = ''
}

// 搜索切换彩种
const switchTab = (key) => {
  searchType.value = key
  searchIssue.value = ''
  page.value = 1
  hasMore.value = true
  fetchData()
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.append('type', searchType.value)
    params.append('limit', PAGE_SIZE)
    params.append('page', page.value)
    if (searchIssue.value) params.append('issue', searchIssue.value)
    
    const res = await axios.get(`/api/admin/lottery?${params}`, {
      headers: { Authorization: getToken() }
    })
    
    if (page.value === 1) {
      list.value = res.data
    } else {
      list.value = [...list.value, ...res.data]
    }
    
    hasMore.value = res.data.length === PAGE_SIZE
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  if (loading.value || !hasMore.value) return
  page.value++
  await fetchData()
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
  router.push('/x7k9m2')
}

const fetchAnnouncements = async () => {
  const res = await axios.get('/api/admin/announcements', {
    headers: { Authorization: getToken() }
  })
  annList.value = res.data
}

const handleAnnSubmit = async () => {
  if (!annForm.content) {
    alert('请填写内容')
    return
  }
  annSubmitting.value = true
  try {
    if (annEditingId.value) {
      await axios.put(`/api/admin/announcements/${annEditingId.value}`, annForm, {
        headers: { Authorization: getToken() }
      })
    } else {
      await axios.post('/api/admin/announcements', annForm, {
        headers: { Authorization: getToken() }
      })
    }
    cancelAnnEdit()
    fetchAnnouncements()
  } catch (e) {
    alert(e.response?.data?.error || '操作失败')
  } finally {
    annSubmitting.value = false
  }
}

const handleAnnEdit = (item) => {
  annEditingId.value = item.id
  annForm.content = item.content
  annForm.enabled = item.enabled
}

const cancelAnnEdit = () => {
  annEditingId.value = null
  annForm.content = ''
  annForm.enabled = true
}

const handleAnnDelete = async (id) => {
  if (!confirm('确定删除？')) return
  await axios.delete(`/api/admin/announcements/${id}`, {
    headers: { Authorization: getToken() }
  })
  fetchAnnouncements()
}

const toggleAnnouncement = async (item) => {
  if (annLoading.value) return
  annLoading.value = true
  try {
    await axios.put(`/api/admin/announcements/${item.id}`, {
      content: item.content,
      enabled: !item.enabled
    }, {
      headers: { Authorization: getToken() }
    })
    fetchAnnouncements()
  } catch (e) {
    alert(e.response?.data?.error || '操作失败')
  } finally {
    annLoading.value = false
  }
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
  fetchAnnouncements()
})
</script>

<style scoped>
.admin-page {
  padding: 1.5rem;
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
  font-size: 1.5rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.tab-btn.active {
  background: #1a56a8;
  color: #fff;
  border-color: #1a56a8;
}

.tab-btn.logout {
  background: #666;
  color: #fff;
}

.form-box {
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.form-box h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
}

.form-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.form-row select,
.form-row input {
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
}

.form-row select {
  min-width: 120px;
}

.form-row input[type="text"] {
  flex: 1;
  min-width: 150px;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.form-actions button {
  padding: 0.6rem 1.2rem;
  background: #1a56a8;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
}

.cancel-btn {
  background: #666 !important;
}

.lottery-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.lottery-tab {
  padding: 0.5rem 0.8rem;
  background: #f0f0f0;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.lottery-tab.active {
  background: #1a56a8;
  color: #fff;
}

.search-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.search-row input {
  flex: 1;
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
}

.search-row button {
  padding: 0.6rem 1.2rem;
  background: #1a56a8;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
}

.table-box {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
}

th {
  background: #f5f5f5;
  font-weight: bold;
}

.edit-btn, .delete-btn, .status-btn {
  padding: 0.3rem 0.6rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  margin-right: 0.3rem;
}

.edit-btn {
  background: #1a56a8;
  color: #fff;
}

.delete-btn {
  background: #e63946;
  color: #fff;
}

.status-btn.enabled {
  background: #22c55e;
  color: #fff;
}

.status-btn.disabled {
  background: #999;
  color: #fff;
}

.status-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.load-more {
  text-align: center;
  padding: 1rem;
  color: #1a56a8;
  cursor: pointer;
  font-size: 0.9rem;
}

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
  margin: 0 0 1rem 0;
}

.modal input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 0.75rem;
  box-sizing: border-box;
  font-size: 0.95rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
}

.modal-actions button {
  flex: 1;
  padding: 0.6rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
}

.modal-actions button:first-child {
  background: #1a56a8;
  color: #fff;
}

.error {
  color: #e63946;
  font-size: 0.85rem;
  margin: 0.5rem 0 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.75rem 0;
}

textarea {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;
  font-size: 0.95rem;
}
</style>