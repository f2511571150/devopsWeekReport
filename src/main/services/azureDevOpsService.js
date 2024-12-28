import axios from "axios";

class AzureDevOpsService {
  constructor() {
    this.baseUrl = "https://dev.azure.com";
    this.apiVersion = "7.0";
  }

  createAxiosInstance(token) {
    console.log(`Basic ${Buffer.from(`:${token}`).toString("base64")}`);
    return axios.create({
      headers: {
        Authorization: `Basic ${Buffer.from(`:${token}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
    });
  }

  async getCreatedTasks(settings, startDate, endDate) {
    const { token, organization } = settings;
    const api = this.createAxiosInstance(token);

    const query = `Select [System.Id], [System.Title], [System.State], [System.AssignedTo], [Microsoft.VSTS.Scheduling.OriginalEstimate], [System.TeamProject]
                  From WorkItems
                  Where [System.CreatedDate] >= '${startDate}'
                  AND [System.CreatedDate] < '${endDate}'
                  AND [System.WorkItemType] = 'Task'
                  AND [System.AssignedTo] = @Me
                  ORDER BY [System.CreatedDate] DESC`;

    try {
      const response = await api.post(
        `${this.baseUrl}/${organization}/_apis/wit/wiql?api-version=${this.apiVersion}`,
        { query }
      );

      if (response.data.workItems && response.data.workItems.length > 0) {
        const workItems = await this.getWorkItemsDetails(
          settings,
          response.data.workItems.map((item) => item.id)
        );

        return workItems.map((item) => ({
          id: item.id,
          project: item.fields["System.TeamProject"],
          taskName: item.fields["System.Title"],
          parentUserStory: item.fields["System.Parent"] || "",
          originalEstimate:
            parseFloat(
              item.fields["Microsoft.VSTS.Scheduling.OriginalEstimate"]
            ) || 0,
        }));
      }
      return [];
    } catch (error) {
      console.error(
        "Error fetching created tasks:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async getClosedTasks(settings, startDate, endDate) {
    const { token, organization } = settings;
    const api = this.createAxiosInstance(token);

    const query = `Select [System.Id], [System.Title], [System.State], [System.AssignedTo], [Microsoft.VSTS.Scheduling.CompletedWork], [System.TeamProject]
                  From WorkItems
                  Where [Microsoft.VSTS.Common.ClosedDate] >= '${startDate}'
                  AND [Microsoft.VSTS.Common.ClosedDate] < '${endDate}'
                  AND [System.WorkItemType] = 'Task'
                  AND [System.State] = 'Closed'
                  AND [System.AssignedTo] = @Me
                  ORDER BY [Microsoft.VSTS.Common.ClosedDate] DESC`;

    try {
      const response = await api.post(
        `${this.baseUrl}/${organization}/_apis/wit/wiql?api-version=${this.apiVersion}`,
        { query }
      );

      if (response.data.workItems && response.data.workItems.length > 0) {
        const workItems = await this.getWorkItemsDetails(
          settings,
          response.data.workItems.map((item) => item.id)
        );

        return workItems.map((item) => ({
          id: item.id,
          project: item.fields["System.TeamProject"],
          taskName: item.fields["System.Title"],
          parentUserStory: item.fields["System.Parent"] || "",
          completedWork:
            parseFloat(
              item.fields["Microsoft.VSTS.Scheduling.CompletedWork"]
            ) || 0,
        }));
      }
      return [];
    } catch (error) {
      console.error(
        "Error fetching closed tasks:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async getClosedBugs(settings, startDate, endDate) {
    const { token, organization } = settings;
    const api = this.createAxiosInstance(token);

    const query = `Select [System.Id], [System.Title], [System.State], [System.AssignedTo], [Microsoft.VSTS.Scheduling.CompletedWork], [System.TeamProject]
                  From WorkItems
                  Where [Microsoft.VSTS.Common.ClosedDate] >= '${startDate}'
                  AND [Microsoft.VSTS.Common.ClosedDate] < '${endDate}'
                  AND [System.WorkItemType] = 'Bug'
                  AND [System.State] = 'Closed'
                  AND [System.AssignedTo] = @Me
                  ORDER BY [Microsoft.VSTS.Common.ClosedDate] DESC`;

    try {
      const response = await api.post(
        `${this.baseUrl}/${organization}/_apis/wit/wiql?api-version=${this.apiVersion}`,
        { query }
      );

      if (response.data.workItems && response.data.workItems.length > 0) {
        const workItems = await this.getWorkItemsDetails(
          settings,
          response.data.workItems.map((item) => item.id)
        );

        return workItems.map((item) => ({
          id: item.id,
          project: item.fields["System.TeamProject"],
          taskName: item.fields["System.Title"],
          parentUserStory: item.fields["System.Parent"] || "",
          completedWork:
            parseFloat(
              item.fields["Microsoft.VSTS.Scheduling.CompletedWork"]
            ) || 0,
        }));
      }
      return [];
    } catch (error) {
      console.error(
        "Error fetching closed bugs:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async getActiveOrNewTasks(settings) {
    const { token, organization } = settings;
    const api = this.createAxiosInstance(token);

    // 计算一个月前的日期，只使用日期部分
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const startDateStr = startDate.toISOString().split("T")[0];

    const query = `Select [System.Id], [System.Title], [System.State], [System.AssignedTo], [Microsoft.VSTS.Scheduling.OriginalEstimate], [System.TeamProject]
                  From WorkItems
                  Where [System.WorkItemType] = 'Task'
                  AND ([System.State] = 'New' OR [System.State] = 'Active')
                  AND [System.AssignedTo] = @Me
                  AND [System.ChangedDate] >= '${startDateStr}'
                  AND [System.ChangedDate] <= '${endDate}'
                  ORDER BY [System.ChangedDate] DESC`;

    try {
      const response = await api.post(
        `${this.baseUrl}/${organization}/_apis/wit/wiql?api-version=${this.apiVersion}`,
        { query }
      );

      if (response.data.workItems && response.data.workItems.length > 0) {
        const workItems = await this.getWorkItemsDetails(
          settings,
          response.data.workItems.map((item) => item.id)
        );

        return workItems.map((item) => ({
          id: item.id,
          project: item.fields["System.TeamProject"],
          taskName: item.fields["System.Title"],
          parentUserStory: item.fields["System.Parent"] || "",
          originalEstimate:
            parseFloat(
              item.fields["Microsoft.VSTS.Scheduling.OriginalEstimate"]
            ) || 0,
        }));
      }
      return [];
    } catch (error) {
      console.error(
        "Error fetching active tasks:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async getWorkItemsDetails(settings, ids) {
    if (!ids || ids.length === 0) return [];

    const { token, organization } = settings;
    const api = this.createAxiosInstance(token);

    try {
      const url = `${this.baseUrl}/${organization}/_apis/wit/workitemsbatch?api-version=${this.apiVersion}`;
      const params = {
        ids,
        fields: [
          "System.Id",
          "System.Title",
          "System.TeamProject",
          "System.Parent",
          "Microsoft.VSTS.Scheduling.OriginalEstimate",
          "Microsoft.VSTS.Scheduling.CompletedWork",
        ],
      };

      const response = await api.post(url, params);

      // 收集所有父工作项的ID
      const parentIds = response.data.value
        .map((item) => item.fields["System.Parent"])
        .filter((id) => id);

      // 如果有父工作项，获取它们的详情
      let parentItems = {};
      if (parentIds.length > 0) {
        const parentResponse = await api.post(
          `${this.baseUrl}/${organization}/_apis/wit/workitemsbatch?api-version=${this.apiVersion}`,
          {
            ids: parentIds,
            fields: ["System.Title"],
          }
        );
        parentItems = parentResponse.data.value.reduce((acc, item) => {
          acc[item.id] = item.fields["System.Title"];
          return acc;
        }, {});
      }

      // 处理原始工作项，添加父工作项的标题
      const workItems = response.data.value.map((item) => {
        const parentId = item.fields["System.Parent"];
        return {
          ...item,
          fields: {
            ...item.fields,
            "System.Parent": parentId ? parentItems[parentId] || parentId : "",
          },
        };
      });

      return workItems;
    } catch (error) {
      console.error(
        "Error fetching work items details:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  generateWeekReport(tasks) {
    const { createdTasks, closedTasks, closedBugs, activeTasks } = tasks;

    let report = "# 本周工作内容\n\n";

    if (createdTasks.length > 0) {
      report += "## 本周创建的任务\n";
      let totalEstimate = 0;
      createdTasks.forEach((task) => {
        report += `- ${task.taskName} (预估: ${task.originalEstimate}小时)\n`;
        totalEstimate += task.originalEstimate;
      });
      report += `总预估工时：${totalEstimate}小时\n\n`;
    }

    if (closedTasks.length > 0) {
      report += "## 本周完成的任务\n";
      let totalCompleted = 0;
      closedTasks.forEach((task) => {
        report += `- ${task.taskName} (完成: ${task.completedWork}小时)\n`;
        totalCompleted += task.completedWork;
      });
      report += `总完成工时：${totalCompleted}小时\n\n`;
    }

    if (closedBugs.length > 0) {
      report += "## 本周修复的Bug\n";
      let totalBugWork = 0;
      closedBugs.forEach((bug) => {
        report += `- ${bug.taskName} (耗时: ${bug.completedWork}小时)\n`;
        totalBugWork += bug.completedWork;
      });
      report += `Bug修复总工时：${totalBugWork}小时\n\n`;
    }

    if (activeTasks.length > 0) {
      report += "## 进行中的任务\n";
      let totalRemaining = 0;
      activeTasks.forEach((task) => {
        report += `- ${task.taskName} (预估: ${task.originalEstimate}小时)\n`;
        totalRemaining += task.originalEstimate;
      });
      report += `待完成总工时：${totalRemaining}小时\n\n`;
    }

    return report;
  }
}

export default new AzureDevOpsService();
