const { app, BrowserWindow, Menu, ipcMain, shell, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
process.env.NODE_ENV = "development"
const isDev = process.env.NODE_ENV !== "production"
let primaryDisplay;
let mainWindow;
const storageTasksPath = path.join(__dirname, 'storage-tasks.json');

function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: "ImageShrink",
        width: isDev ? primaryDisplay.size.width : 700,
        height: isDev? primaryDisplay.size.height : 800,
        icon: './assets/icons/todolist-final.png',
        webPreferences: {
            nodeIntegration: true,
        },
    })
    mainWindow.loadFile('./app/index.html')
    if(isDev ){
        mainWindow.webContents.openDevTools()
    }
    fs.readFile(storageTasksPath, (err, data) => {
        if(!err) {
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
    console.log((primaryDisplay.size.width - 500)/2);

    aboutWindow = new BrowserWindow({
        title: "ImageShrink",
        width: (primaryDisplay.size.width - 500)/2 > 500 ? 500 : (primaryDisplay.size.width - 500)/2,
        height: isDev? primaryDisplay.size.height : 600,
        x: (primaryDisplay.size.width - 500)/2 > 500? (primaryDisplay.size.width - 500)/2 - 500: 0,
        y: (primaryDisplay.size.height - 600)/2+12,
        icon: './assets/icons/todolist-final.png',
    })
    // aboutWindown.loadUrl('https://github.com/lmt20')
    aboutWindow.loadURL('https://github.com/lmt20')
}

app.on('ready', () => {
    const template = require('./utils/menu');
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
            if(!err) {
                try {
                    const storageData = JSON.parse(data);
                    const addData = JSON.parse(message);
                    const oldDataOnAddingDate = storageData[addData.date] ? storageData[addData.date] : [];
                    oldDataOnAddingDate.push({name: addData.task, status: "doing"});
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
            if(!err) {
                try {
                    const storageData = JSON.parse(data);
                    const changingData = JSON.parse(message);
                    if(storageData[changingData.date]){
                        const prevDataIndex = storageData[changingData.date].findIndex(taskItem => {
                            return taskItem.name === changingData.task;
                        })
                        if(prevDataIndex !== -1){
                            storageData[changingData.date][prevDataIndex].status = "completed";
                            fs.writeFile(storageTasksPath, JSON.stringify(storageData), (err) => {
                                event.reply('TaskItem:completeChangeCompletedStatus', changingData.task);
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
            if(!err) {
                try {
                    const storageData = JSON.parse(data);
                    const changingData = JSON.parse(message);
                    if(storageData[changingData.date]){
                        const prevDataIndex = storageData[changingData.date].findIndex(taskItem => {
                            return taskItem.name === changingData.task;
                        })
                        if(prevDataIndex !== -1){
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
            if(!err) {
                try {
                    const storageData = JSON.parse(data);
                    const changingData = JSON.parse(message);
                    if(storageData[changingData.date]){
                        const prevDataIndex = storageData[changingData.date].findIndex(taskItem => {
                            return taskItem.name === changingData.task;
                        })
                        if(prevDataIndex !== -1){
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
            if(!err) {
                try {
                    const storageData = JSON.parse(data);
                    const changingData = JSON.parse(message);
                    if(storageData[changingData.date]){
                        const prevDataIndex = storageData[changingData.date].findIndex(taskItem => {
                            return taskItem.name === changingData.task;
                        })
                        if(prevDataIndex !== -1){
                            storageData[changingData.date].splice(prevDataIndex, 1)
                            fs.writeFile(storageTasksPath, JSON.stringify(storageData), (err) => {
                                event.reply('TaskItem:completDeleteTask', changingData.task);
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
            if(!err) {
                try {
                    const storageData = JSON.parse(data);
                    if(storageData[date]){
                        const newTaskItems = storageData[date].map(taskItem => {
                            return {...taskItem, status: "doing"};
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