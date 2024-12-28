<template>
  <div>
    <el-button @click="dialogVisible = true" type="primary" plain>
      <el-icon><Setting /></el-icon>
      设置
    </el-button>

    <el-dialog
      v-model="dialogVisible"
      title="Azure DevOps 设置"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        :model="form"
        label-width="150px"
        :rules="rules"
        ref="formRef"
        status-icon
      >
        <el-form-item
          label="Personal Token"
          prop="token"
          :rules="[{ required: true, message: '请输入Personal Access Token', trigger: 'blur' }]"
        >
          <el-input
            v-model="form.token"
            placeholder="输入你的Personal Access Token"
           
            clearable
          >
            <template #append>
              <el-tooltip
                content="点击跳转到Azure DevOps生成Token页面"
                placement="top"
              >
                <el-button @click="openTokenPage">
                  <el-icon><Link /></el-icon>
                </el-button>
              </el-tooltip>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item
          label="Organization"
          prop="organization"
          :rules="[{ required: true, message: '请输入Organization名称', trigger: 'blur' }]"
        >
          <el-input
            v-model="form.organization"
            placeholder="输入你的Organization名称"
            clearable
          />
        </el-form-item>

        <el-form-item
          label="项目列表"
          prop="projects"
          :rules="[{ required: true, message: '至少添加一个项目', trigger: 'change' }]"
        >
          <div class="projects-container">
            <transition-group name="project-list">
              <div
                v-for="(project, index) in form.projects"
                :key="index"
                class="project-item"
              >
                <el-input
                  v-model="form.projects[index]"
                  placeholder="输入项目名称"
                  clearable
                >
                  <template #append>
                    <el-button
                      type="danger"
                      @click="removeProject(index)"
                      :disabled="form.projects.length === 1"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </template>
                </el-input>
              </div>
            </transition-group>
            <div class="project-actions">
              <el-button
                type="primary"
                @click="addProject"
                :icon="Plus"
                plain
                class="add-project-btn"
              >
                添加项目
              </el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleSave" :loading="saving">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Setting, Delete, Plus, Link } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const dialogVisible = ref(false)
const formRef = ref(null)
const saving = ref(false)

const form = ref({
  token: '',
  organization: '',
  projects: ['']
})

const addProject = () => {
  form.value.projects.push('')
}

const removeProject = (index) => {
  form.value.projects.splice(index, 1)
  if (form.value.projects.length === 0) {
    form.value.projects.push('')
  }
}

const openTokenPage = async () => {
  // 获取组织
  const organization = form.value.organization;

  try {
    const url = `https://dev.azure.com/${organization}/_usersSettings/tokens`;
    await window.api.shell.openExternal(url);
    ElMessage.success('正在打开Token生成页面');
  } catch (error) {
    console.error('打开链接失败:', error);
    ElMessage.error('打开链接失败，请手动访问Azure DevOps网站');
  }
}

const handleCancel = () => {
  ElMessage.info('已取消设置')
  dialogVisible.value = false
  loadSettings() // 重置为原始设置
}

const handleSave = async () => {
  if (!formRef.value) return
  
  try {
    saving.value = true
    await formRef.value.validate()
    
    // 过滤掉空的项目名
    const validProjects = form.value.projects.filter(p => p.trim())
    if (validProjects.length === 0) {
      ElMessage.warning('请至少添加一个有效的项目名称')
      return
    }

    const settings = {
      token: form.value.token,
      organization: form.value.organization,
      projects: validProjects
    }
    
    localStorage.setItem('azureDevOpsSettings', JSON.stringify(settings))
    dialogVisible.value = false
    ElMessage.success('设置已保存')
  } catch (error) {
    console.error('验证失败:', error)
    ElMessage.error('请检查必填项')
  } finally {
    saving.value = false
  }
}

const loadSettings = () => {
  const settings = localStorage.getItem('azureDevOpsSettings')
  if (settings) {
    const parsed = JSON.parse(settings)
    form.value.token = parsed.token || ''
    form.value.organization = parsed.organization || ''
    form.value.projects = parsed.projects?.length ? parsed.projects : ['']
  }
}

// 检查是否已配置
const isConfigured = () => {
  const settings = localStorage.getItem('azureDevOpsSettings')
  if (!settings) return false
  const { token, organization, projects } = JSON.parse(settings)
  return !!(token && organization && projects?.length > 0)
}

// 获取设置
const getSettings = () => {
  const settings = localStorage.getItem('azureDevOpsSettings')
  return settings ? JSON.parse(settings) : null
}

onMounted(() => {
  loadSettings()
})

defineExpose({
  isConfigured,
  getSettings
})
</script>

<style scoped>
.projects-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.project-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.project-actions {
  margin-top: 10px;
}

.add-project-btn {
  width: 100%;
}

/* 项目列表动画 */
.project-list-enter-active,
.project-list-leave-active {
  transition: all 0.3s ease;
}

.project-list-enter-from,
.project-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.project-list-move {
  transition: transform 0.3s ease;
}
</style>
