<template>
  <div class="task-list">
    <div v-if="type === 'created'" class="task-header">
      Created Task Total Original Estimate = {{ totalWorkTime }} 小时
    </div>
    <div v-if="type === 'closed'" class="task-header">
      Closed Task Total Completed Work = {{ totalWorkTime }} 小时
    </div>
    <div v-if="type === 'bugs'" class="task-header">
      Closed Bug Total Completed Work = {{ totalWorkTime }} 小时
    </div>
    <div v-if="type === 'active'" class="task-header">
      New or Active Task Total Original Estimate = {{ totalWorkTime }} 小时
    </div>

    <el-table
      :data="tasks"
      style="width: 100%"
      v-loading="loading"
      border
      align="left"
      size="small"
      :header-cell-style="{
        background: '#f5f7fa',
        color: '#000',

      }"
    >
      <el-table-column
        prop="id"
        label="Task ID"
        width="80"
        align="center"
        header-align="center"
      />
      <el-table-column
        prop="project"
        label="Project"
        width="100"
        align="center"
        header-align="center"
      />
      <el-table-column
        prop="taskName"
        label="Task Name"
        min-width="200"
        align="left"
        header-align="left"
      />
      <el-table-column
        :prop="workTimeField"
        :label="
          type === 'bugs'
            ? 'Completed Work'
            : type === 'active'
              ? 'Original Estimate'
              : workTimeLabel
        "
        width="150"
        align="center"
        header-align="center"
      />
      <el-table-column
        prop="parentUserStory"
        label="Parent User Story"
        min-width="200"
        align="left"
        header-align="left"
      />
    </el-table>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  tasks: {
    type: Array,
    default: () => [],
  },
  type: {
    type: String,
    required: true,
  },
});

const loading = ref(false);

// 根据任务类型确定工时字段
const workTimeField = computed(() => {
  switch (props.type) {
    case "created":
    case "active":
      return "originalEstimate";
    case "closed":
    case "bugs":
      return "completedWork";
    default:
      return "originalEstimate";
  }
});

const workTimeLabel = computed(() => {
  switch (props.type) {
    case "created":
      return "Original Estimate";
    case "closed":
      return "Completed Work";
    case "bugs":
      return "Completed Work";
    case "active":
      return "Original Estimate";
    default:
      return "Work Time";
  }
});

// 计算总工时
const totalWorkTime = computed(() => {
  return props.tasks.reduce(
    (sum, task) => sum + (task[workTimeField.value] || 0),
    0
  );
});

// 获取任务链接
const getTaskUrl = (taskId) => {
  // 从localStorage获取设置
  const settings = JSON.parse(
    localStorage.getItem("azureDevOpsSettings") || "{}"
  );
  const { organization, project } = settings;
  return `https://dev.azure.com/${organization}/${project}/_workitems/edit/${taskId}`;
};
</script>

<style scoped>
.task-list {
  margin: 20px 0;
  color: #000000;
}

.task-header {
  margin-bottom: 10px;
  font-weight: bold;
  color: #000000;
}

/* :deep(.el-table) {
  color: #000000 !important;
  font-size: 12px;
}

:deep(.el-table th) {
  color: #000000 !important;
  font-size: 12px;
  padding: 8px 0;
}

:deep(.el-table td) {
  padding: 4px 0;
}

:deep(.el-table--border) {
  border: 1px solid #dcdfe6;
}

:deep(.el-table--border th),
:deep(.el-table--border td) {
  border-right: 1px solid #dcdfe6;
}

:deep(.el-table__row) {
  height: 32px;
} */
</style>
