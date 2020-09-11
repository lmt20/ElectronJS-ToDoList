const { app, BrowserWindow, Menu, ipcMain, screen, Tray, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
process.env.NODE_ENV = "production"
const isDev = process.env.NODE_ENV !== "production"
let primaryDisplay;
let mainWindow;
let aboutWindow;
let sendMailWindow;
let tray;
let aboutTray;
let mailTray;
// const storageTasksPath = path.join(__dirname, 'storage-tasks.json');
const storageTasksPath = path.join(app.getPath('userData'), 'storage-tasks.json');
// create file to store if not exist
fs.exists(storageTasksPath, function (exists) {
    if (!exists) {
        fs.writeFile(storageTasksPath,'{}', { flag: 'wx' }, function (err) {
            if(err) throw err;
            console.log("Create new file with the empty object content!");
        })
    }
});

function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: "ToDoList",
        width: isDev ? primaryDisplay.size.width : Math.round(primaryDisplay.size.width * 2 / 3),
        height: primaryDisplay.size.height,
        icon: './assets/icons/todolist-final.png',
        webPreferences: {
            nodeIntegration: true,
        },
    })
    mainWindow.loadFile('./app/index.html')
    // createMainTray()
    if (isDev) {
        mainWindow.webContents.openDevTools()
    }
    fs.readFile(storageTasksPath, (err, data) => {
        if (!err) {
            try {
                const storageData = JSON.parse(data);
                const currentDateString = new Date().toDateString();
                const dataInCurrentDate = storageData[currentDateString] ? storageData[currentDateString] : [];
                mainWindow.webContents.on('did-finish-load', () => {
                    mainWindow.webContents.send("TaskItems:Initial", JSON.stringify(dataInCurrentDate));
                })
            } catch (error) {
                console.log(error);
            }
        }
    })

}

function createAboutWindow() {
    // console.log((primaryDisplay.size.width - 500)/2);
    aboutWindow = new BrowserWindow({
        title: "Author",
        width: (primaryDisplay.size.width - 500) / 2 > 500 ? 500 : (primaryDisplay.size.width - 500) / 2,
        height: isDev ? primaryDisplay.size.height : 600,
        x: (primaryDisplay.size.width - 500) / 2 > 500 ? (primaryDisplay.size.width - 500) / 2 - 500 : 0,
        y: (primaryDisplay.size.height - 600) / 2 + 12,
        icon: './assets/icons/lmt.png',
    })
    aboutWindow.loadURL('https://github.com/lmt20')
    if (!aboutTray) {
        // createAboutTray();
    }
}
function createSendMailWindow() {
    // console.log((primaryDisplay.size.width - 500)/2);
    sendMailWindow = new BrowserWindow({
        title: "SendMail",
        width: isDev ? primaryDisplay.size.width : Math.round(primaryDisplay.size.width * 2 / 3),
        height: primaryDisplay.size.height,
        icon: './assets/icons/gmail.jpg',
        webPreferences: {
            nodeIntegration: true,
        },
    })
    sendMailWindow.loadFile('./app/send-mail.html')
    if(!mailTray) {
        // createMailTray();
    }

}

function createMainTray() {
    tray = new Tray('./assets/icons/todolist-final.png')
    const contextMenu = Menu.buildFromTemplate([
        {
            label: "About",
            click: createAboutWindow,
        },
        {
            label: "Send Mail",
            click: createSendMailWindow,
        },
        { type: 'separator' },
        { role: 'quit' },
    ])
    tray.setToolTip('To Do List')
    tray.setContextMenu(contextMenu)
}
function createAboutTray() {
    aboutTray = new Tray('./assets/icons/lmt.png')
    const contextMenu = Menu.buildFromTemplate([
        {
            label: "About",
            click: createAboutWindow,
        },
        {
            label: "Send Mail",
            click: createSendMailWindow,
        },
        { type: 'separator' },
        { role: 'close' },
    ])
    aboutTray.setToolTip('Author Info')
    aboutTray.setContextMenu(contextMenu)
}
function createMailTray() {
    mailTray = new Tray('./assets/icons/gmail.png')
    const contextMenu = Menu.buildFromTemplate([
        {
            label: "About",
            click: createAboutWindow,
        },
        {
            label: "Send Mail",
            click: createSendMailWindow,
        },
        { type: 'separator' },
        { role: 'close' },
    ])
    mailTray.setToolTip('Author Info')
    mailTray.setContextMenu(contextMenu)
}

app.on('ready', () => {
    const template = require('./utils/menu');
    template.unshift({
        label: "Send Mail",
        click: createSendMailWindow,
    })
    template.unshift({
        label: "About",
        click: createAboutWindow
    })
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
    primaryDisplay = screen.getPrimaryDisplay()
    createMainWindow()
    // process add task item
    ipcMain.on('TaskItem:add', (event, message) => {
        fs.readFile(storageTasksPath, (err, data) => {
            if (!err) {
                try {
                    const storageData = JSON.parse(data);
                    const addData = JSON.parse(message);
                    const oldDataOnAddingDate = storageData[addData.date] ? storageData[addData.date] : [];
                    oldDataOnAddingDate.push({ name: addData.task, status: "doing" });
                    storageData[addData.date] = oldDataOnAddingDate;
                    fs.writeFile(storageTasksPath, JSON.stringify(storageData), (err) => {
                        event.reply('TaskItem:completeAdd', addData.task);
                    })
                } catch (error) {
                    console.log(error);
                }
            }

        })

    })
    // process change task item status to completed
    ipcMain.on('TaskItem:complete', (event, message) => {
        fs.readFile(storageTasksPath, (err, data) => {
            if (!err) {
                try {
                    const storageData = JSON.parse(data);
                    const changingData = JSON.parse(message);
                    if (storageData[changingData.date]) {
                        const prevDataIndex = storageData[changingData.date].findIndex(taskItem => {
                            return taskItem.name === changingData.task;
                        })
                        if (prevDataIndex !== -1) {
                            const sendData = {
                                task: changingData.task,
                                oldStatus: storageData[changingData.date][prevDataIndex].status
                            }
                            storageData[changingData.date][prevDataIndex].status = "completed";
                            fs.writeFile(storageTasksPath, JSON.stringify(storageData), (err) => {
                                event.reply('TaskItem:completeChangeCompletedStatus', JSON.stringify(sendData));
                            })
                        }
                    }
                } catch (error) {
                    console.log(error);
                }
            }

        })
    })
    // process change task item status to pausing
    ipcMain.on('TaskItem:pause', (event, message) => {
        fs.readFile(storageTasksPath, (err, data) => {
            if (!err) {
                try {
                    const storageData = JSON.parse(data);
                    const changingData = JSON.parse(message);
                    if (storageData[changingData.date]) {
                        const prevDataIndex = storageData[changingData.date].findIndex(taskItem => {
                            return taskItem.name === changingData.task;
                        })
                        if (prevDataIndex !== -1) {
                            storageData[changingData.date][prevDataIndex].status = "paused";
                            fs.writeFile(storageTasksPath, JSON.stringify(storageData), (err) => {
                                event.reply('TaskItem:completeChangePausedStatus', changingData.task);
                            })
                        }
                    }
                } catch (error) {
                    console.log(error);
                }
            }

        })
    })
    // process change task item status to continue
    ipcMain.on('TaskItem:continue', (event, message) => {
        fs.readFile(storageTasksPath, (err, data) => {
            if (!err) {
                try {
                    const storageData = JSON.parse(data);
                    const changingData = JSON.parse(message);
                    if (storageData[changingData.date]) {
                        const prevDataIndex = storageData[changingData.date].findIndex(taskItem => {
                            return taskItem.name === changingData.task;
                        })
                        if (prevDataIndex !== -1) {
                            storageData[changingData.date][prevDataIndex].status = "doing";
                            fs.writeFile(storageTasksPath, JSON.stringify(storageData), (err) => {
                                event.reply('TaskItem:completeChangeContinuingStatus', changingData.task);
                            })
                        }
                    }
                } catch (error) {
                    console.log(error);
                }
            }

        })
    })
    // process delete task item
    ipcMain.on('TaskItem:delete', (event, message) => {
        fs.readFile(storageTasksPath, (err, data) => {
            if (!err) {
                try {
                    const storageData = JSON.parse(data);
                    const changingData = JSON.parse(message);
                    if (storageData[changingData.date]) {
                        const prevDataIndex = storageData[changingData.date].findIndex(taskItem => {
                            return taskItem.name === changingData.task;
                        })
                        if (prevDataIndex !== -1) {
                            const sendData = JSON.stringify({
                                task: changingData.task,
                                status: storageData[changingData.date][prevDataIndex].status
                            })
                            storageData[changingData.date].splice(prevDataIndex, 1)
                            fs.writeFile(storageTasksPath, JSON.stringify(storageData), (err) => {
                                event.reply('TaskItem:completDeleteTask', sendData);
                            })
                        }
                    }
                } catch (error) {
                    console.log(error);
                }
            }

        })
    })
    // process reset progress of task items
    ipcMain.on('TaskItem:reset', (event, date) => {
        fs.readFile(storageTasksPath, (err, data) => {
            if (!err) {
                try {
                    const storageData = JSON.parse(data);
                    if (storageData[date]) {
                        const newTaskItems = storageData[date].map(taskItem => {
                            return { ...taskItem, status: "doing" };
                        })
                        storageData[date] = newTaskItems;
                        fs.writeFile(storageTasksPath, JSON.stringify(storageData), (err) => {
                            event.reply('TaskItems:reload', JSON.stringify(storageData[date]));
                        })
                    }
                } catch (error) {
                    console.log(error);
                }
            }

        })
    })
    // handler reload issue
    // ipcMain.on('Reload:Page', () => {
    //     fs.readFile(storageTasksPath, (err, data) => {
    //         if(!err) {
    //             try {
    //                 const storageData = JSON.parse(data);
    //                 const date = new Date().toDateString();
    //                 if(storageData[date]){
    //                     fs.writeFile(storageTasksPath, JSON.stringify(storageData), (err) => {
    //                        mainWindow.webContents.send('TaskItems:reload', JSON.stringify(storageData[date]));
    //                     })
    //                 }
    //             } catch (error) {
    //                 console.log(error);
    //             }
    //         }
    //     })
    // })

    // Handle request get data to mail content
    ipcMain.on('TaskItems:getAll', () => {
        fs.readFile(storageTasksPath, (err, data) => {
            if (!err) {
                try {
                    const storageData = JSON.parse(data);
                    const date = new Date().toDateString();
                    if (storageData[date]) {
                        fs.writeFile(storageTasksPath, JSON.stringify(storageData), (err) => {
                            sendMailWindow.webContents.on('did-finish-load', () => {
                                sendMailWindow.webContents.send('TaskItems:completeGetAll', JSON.stringify(storageData[date]));
                            })
                        })
                    }
                } catch (error) {
                    console.log(error);
                }
            }
        })
    })

})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow()
    }
})
