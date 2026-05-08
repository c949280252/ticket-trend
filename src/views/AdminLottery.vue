<template>
  <div class="admin-page">
    <div class="header">
      <h2>开奖结果管理</h2>
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </div>

    <!-- 添加/编辑表单 -->
    <div class="form-box">
      <h3>{{ editingId ? '编辑开奖' : '添加开奖' }}</h3>
      <div class="form-row">
        <select v-model="form.lottery_type">
          <option value="">选择彩种</option>
          <option v-for="(config, key) in LOTTERY_CONFIG" :key="key" :value="key">
            {{ config.name }}
          </option>
        </select>
        <input v-model="form.issue" placeholder="期号，如2026026" />
        <input v-model="form.code" placeholder="开奖号码，如2,0,7,5,8" />
        <input v-model="form.draw_time" type="datetime-local" />
      </div>
      <div class="form-actions">
        <button @click="handleSubmit" :disabled="submitting">
          {{ submitting ? '提交中...' : (editingId ? '更新' : '添加') }}
        </button>
        <button v-if="editingId" @click="cancelEdit" class="cancel-btn">取消</button>
      </div>
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
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const LOTTERY_CONFIG = {
  '3d': { name: '福cai3D' },
  'ssq': { name: '双色球' },
  'dlt': { name: '超级大乐透' },
  'qlc': { name: '七乐彩' },
  'plw': { name: '排列五' },
  'pl3': { name: '排列三' },
  'qxc': { name: '七星彩' }
}

const list = ref([])
const searchType = ref('')
const searchIssue = ref('')
const submitting = ref(false)
const editingId = ref(null)

const form = reactive({
  lottery_type: '',
  issue: '',
  code: '',
  draw_time: ''
})

const getToken = () => localStorage.getItem('admin_token')

const fetchData = async () => {
  const params = new URLSearchParams()
  if (searchType.value) params.append('type', searchType.value)
  if (searchIssue.value) params.append('issue', searchIssue.value)
  
  const res = await axios.get(`/api/admin/lottery?${params}`, {
    headers: { Authorization: getToken() }
  })
  list.value = res.data
}

const handleSubmit = async () => {
  if (!form.lottery_type || !form.issue || !form.code || !form.draw_time) {
    alert('请填写完整')
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
</style>