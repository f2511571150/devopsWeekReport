<template>
  <el-config-provider>
    <div class="container">
      <!-- <el-container>
        <el-header height="60">
          <div class="header-content">
            <div class="header-actions">
              <token-settings ref="tokenSettingsRef" />
            </div>
          </div>
        </el-header>

        <el-main>
          <el-card class="main-card">
            <template #header>
              <div class="card-header">
                <span>任务统计</span>
                <div class="header-actions">
                  <el-button
                    type="primary"
                    @click="generateReport"
                    :loading="loading.value"
                  >
                    生成周报
                  </el-button>
                  <el-button
                    type="success"
                    @click="refreshData"
                    :loading="loading.value"
                  >
                    刷新数据
                  </el-button>
                </div>
              </div>
            </template>
      
            <task-list :tasks="createdTasks" type="created" />
            <task-list :tasks="closedTasks" type="closed" />
            <task-list :tasks="closedBugs" type="bugs" />
            <task-list :tasks="activeTasks" type="active" />
          </el-card>
        </el-main>
      </el-container> -->
      <div
        style="
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px;
        "
      >
        <token-settings ref="tokenSettingsRef" />
        <el-button type="success" @click="refreshData" :loading="loading.value">
          刷新数据
        </el-button>
        <el-button type="primary" @click="captureScreenshot"> 截图 </el-button>
      </div>

      <div
        class="main-content"
        style="flex-grow: 1; overflow: auto; padding: 20px"
      >
        <!-- <div>DIV</div> -->
        <task-list :tasks="createdTasks" type="created" />
        <task-list :tasks="closedTasks" type="closed" />
        <task-list :tasks="closedBugs" type="bugs" />
        <task-list :tasks="activeTasks" type="active" />
      </div>
    </div>

    <el-dialog v-model="reportDialogVisible" title="周报预览" width="800px">
      <div class="report-content">
        <pre>{{ reportContent }}</pre>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reportDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="copyReport">
            复制到剪贴板
          </el-button>
        </span>
      </template>
    </el-dialog>
  </el-config-provider>
</template>

<script setup>
import { ref, onMounted } from "vue";
import TaskList from "./components/TaskList.vue";
import TokenSettings from "./components/TokenSettings.vue";
import { ElMessage } from "element-plus";
import html2canvas from "html2canvas";

const activeTab = ref("created");
const createdTasks = ref([]);
const closedTasks = ref([]);
const closedBugs = ref([]);
const activeTasks = ref([]);
const tokenSettingsRef = ref(null);
const reportDialogVisible = ref(false);
const reportContent = ref("");
const loading = ref(false);

// 过滤任务列表，只保留配置的项目中的任务
const filterTasksByProjects = (tasks) => {
  const settings = tokenSettingsRef.value?.getSettings();
  if (!settings?.projects || !Array.isArray(settings.projects)) {
    return tasks;
  }
  return tasks.filter(task => settings.projects.includes(task.project));
};

const checkToken = () => {
  if (!tokenSettingsRef.value?.isConfigured()) {
    ElMessage.warning("请先完成Azure DevOps设置");
    return false;
  }
  return true;
};

const fetchTasks = async () => {
  if (!checkToken()) return;

  try {
    loading.value = true;
    const settings = tokenSettingsRef.value.getSettings();
    console.log(settings);
    // console.log(
    //   `Basic ${Buffer.from(`:${settings.token}`).toString("base64")}`
    // );
    const result = await window.api.getTasks(settings);
    console.log(result);
    
    // 过滤各类任务列表
    createdTasks.value = filterTasksByProjects(result.createdTasks);
    closedTasks.value = filterTasksByProjects(result.closedTasks);
    closedBugs.value = filterTasksByProjects(result.closedBugs);
    activeTasks.value = filterTasksByProjects(result.activeTasks);
    ElMessage.success("数据加载成功");
  } catch (error) {
    ElMessage.error("获取任务失败：" + (error.message || "未知错误"));
    console.error("Error fetching tasks:", error);
  } finally {
    loading.value = false;
  }
};

const generateReport = async () => {
  if (!checkToken()) return;

  try {
    loading.value = true;
    const settings = tokenSettingsRef.value.getSettings();
    const result = await window.api.generateReport({
      settings,
      createdTasks: createdTasks.value,
      closedTasks: closedTasks.value,
      closedBugs: closedBugs.value,
      activeTasks: activeTasks.value,
    });

    if (result.success) {
      reportContent.value = result.report;
      reportDialogVisible.value = true;
      ElMessage.success(result.message);
    } else {
      ElMessage.warning(result.message);
    }
  } catch (error) {
    ElMessage.error("生成报告失败：" + (error.message || "未知错误"));
    console.error("Error generating report:", error);
  } finally {
    loading.value = false;
  }
};

const copyReport = () => {
  navigator.clipboard.writeText(reportContent.value);
  ElMessage.success("报告已复制到剪贴板");
};

const captureScreenshot = async () => {
  try {
    const element = document.querySelector(".main-content");
    if (!element) {
      ElMessage.error("未找到目标元素");
      return;
    }

    // 保存原始滚动位置和样式
    const originalScrollTop = element.scrollTop;
    const originalHeight = element.style.height;
    const originalOverflow = element.style.overflow;

    // 临时修改样式以获取完整内容
    element.style.height = "auto";
    element.style.overflow = "visible";

    // 确保内容完全展开
    await new Promise((resolve) => setTimeout(resolve, 100));

    const canvas = await html2canvas(element, {
      useCORS: true,
      scale: window.devicePixelRatio,
      backgroundColor: null,
      height: element.scrollHeight,
      windowHeight: element.scrollHeight,
    });

    // 恢复原始样式
    element.style.height = originalHeight;
    element.style.overflow = originalOverflow;
    element.scrollTop = originalScrollTop;

    canvas.toBlob((blob) => {
      const item = new ClipboardItem({ "image/png": blob });
      navigator.clipboard
        .write([item])
        .then(() => {
          ElMessage.success("截图已复制到剪贴板");
        })
        .catch((error) => {
          console.error("复制到剪贴板失败:", error);
          ElMessage.error("复制到剪贴板失败");
        });
    });
  } catch (error) {
    console.error("截图失败:", error);
    ElMessage.error("截图失败");
  }
};

const refreshData = () => {
  fetchTasks();
};

onMounted(() => {
  // 如果有保存的token，自动加载数据
  if (tokenSettingsRef.value?.isConfigured()) {
    fetchTasks();
  }
});
</script>

<style>
.container {
  height: 100vh;
  width: 100vw;
  /* overflow: auto; */
  background-color: #ffffff;
  color: #000000;
  display: flex;
  flex-direction: column;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  color: #000000;
  padding: 0 20px;
}

.main-card {
  margin: 20px;
  color: #000000;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #000000;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.task-tabs {
  margin-top: 20px;
}

.el-header {
  background-color: white;
  border-bottom: 1px solid #dcdfe6;
}

.el-main {
  padding: 0;
}

.report-content {
  white-space: pre-wrap;
  font-family: monospace;
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
  max-height: 500px;
  overflow-y: auto;
  color: #000000;
}

:deep(.el-tabs__item) {
  color: #000000 !important;
}

:deep(.el-table) {
  color: #000000 !important;
}

:deep(.el-table th) {
  color: #000000 !important;
}

:deep(.el-dialog__title) {
  color: #000000 !important;
}
</style>
