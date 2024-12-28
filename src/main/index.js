import { app, shell, BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import express from "express";
import cors from "cors";
import azureDevOpsService from "./services/azureDevOpsService";

// 创建Express服务器
// const server = express();
// server.use(cors());
// server.use(express.json());

// 获取本周的开始和结束日期
function getWeekDates() {
  const now = new Date();
  console.log("Current date:", now);

  const dayOfWeek = now.getDay() || 7; // 将周日的0转换为7
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1); // +1 使其成为周一

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6); // +6 天得到周日

  // 格式化日期为 YYYY-MM-DD 格式
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const dates = {
    startDate: formatDate(monday),
    endDate: formatDate(sunday),
  };
  console.log("Week dates:", dates);
  return dates;
}

// API路由
// server.get("/api/tasks", async (req, res) => {
//   const settings = req.headers.authorization
//     ? JSON.parse(Buffer.from(req.headers.authorization, "base64").toString())
//     : null;
//   if (!settings || !settings.token) {
//     return res.status(401).json({ error: "Settings are required" });
//   }

//   try {
//     const { startDate, endDate } = getWeekDates();
//     const closedTasks = azureDevOpsService.getClosedTasks(
//       settings,
//       startDate,
//       endDate
//     );

//     // const [createdTasks, closedTasks, closedBugs, activeTasks] = await Promise.all([
//     //   azureDevOpsService.getCreatedTasks(settings, startDate, endDate),
//     //   azureDevOpsService.getClosedTasks(settings, startDate, endDate),
//     //   azureDevOpsService.getClosedBugs(settings, startDate, endDate),
//     //   azureDevOpsService.getActiveOrNewTasks(settings)
//     // ])

//     // res.json({
//     //   createdTasks,
//     //   closedTasks,
//     //   closedBugs,
//     //   activeTasks
//     // })
//   } catch (error) {
//     console.error(
//       "Error fetching tasks:",
//       error.response?.data || error.message
//     );
//     res.status(500).json({ error: "Failed to fetch tasks" });
//   }
// });

// 启动Express服务器
// const PORT = 3001;
// server.listen(PORT, () => {
//   console.log(`Express server running on port ${PORT}`);
// });

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: true,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

// IPC通信处理
ipcMain.handle("get-tasks", async (_, settings) => {
  try {
    const { startDate, endDate } = getWeekDates();
    console.log("Fetching tasks with:", {
      startDate,
      endDate,
      organization: settings.organization,
      projects: settings.projects,
    });

    const [createdTasks, closedTasks, closedBugs, activeTasks] =
      await Promise.all([
        azureDevOpsService.getCreatedTasks(settings, startDate, endDate),
        azureDevOpsService.getClosedTasks(settings, startDate, endDate),
        azureDevOpsService.getClosedBugs(settings, startDate, endDate),
        azureDevOpsService.getActiveOrNewTasks(settings)
      ]);

    return {
      createdTasks,
      closedTasks,
      closedBugs,
      activeTasks
    };
  } catch (error) {
    console.error(
      "Error fetching tasks:",
      error.response?.data || error.message
    );
    throw error;
  }
});

ipcMain.handle("generate-report", async (_, data) => {
  try {
    const { settings, createdTasks, closedTasks, closedBugs, activeTasks } =
      data;
    const report = azureDevOpsService.generateWeekReport({
      createdTasks,
      closedTasks,
      closedBugs,
      activeTasks,
    });

    return { success: true, message: "报告生成成功", report };
  } catch (error) {
    console.error(
      "Error generating report:",
      error.response?.data || error.message
    );
    throw error;
  }
});

// 处理打开外部链接
ipcMain.handle('open-external-link', async (_, url) => {
  try {
    console.log('Opening external link:', url);
    // 检查URL是否合法
    const validUrl = new URL(url);
    if (validUrl.protocol !== 'http:' && validUrl.protocol !== 'https:') {
      throw new Error('Invalid URL protocol');
    }
    await shell.openExternal(url, {
      activate: true,
      workingDirectory: process.cwd()
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to open external link:', error);
    throw error;
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron");

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test
  ipcMain.on("ping", () => console.log("pong"));

  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  // 在应用退出前清理资源
  // server.close();
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
