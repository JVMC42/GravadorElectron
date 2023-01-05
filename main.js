const { app, BrowserWindow, ipcMain, Menu, shell, dialog } = require('electron')
const path = require('path')
const os = require('os')
const fs = require('fs')
const Store = require('./Store')

const preferences = new Store({
    configName: 'user-preferences',
    defaults: {
        destination: path.join(os.homedir(), 'audios')
    }
})

const isDev = (process.env.NODE_ENV !== undefined && process.env.NODE_ENV === "development") ? true : false
const isMac = process.platform === "darwin" ? true : false

let destination = preferences.get("destination")

function createPreferenceWindow() {
    const preferenceWindow = new BrowserWindow({
        width: 500,
        height: 150,
        resizable: isDev? true : false,
        backgroundColor: "#234",
        show: false,
        icon: path.join(__dirname, "assets", "icons", "icon.ico"),
        webPreferences: {
            nodeIntegration: true,
        }
    })

    preferenceWindow.loadFile('./src/preferences/index.html')

    preferenceWindow.once('ready-to-show', () => {
        preferenceWindow.show()

        preferenceWindow.webContents.send("dest-path-update", destination)
    })
}

function createWindow() {
    const win = new BrowserWindow({
        width: 500,
        height: 300,
        resizable: isDev? true : false,
        backgroundColor: "#234",
        show: false,
        icon: path.join(__dirname, "assets", "icons", "icon.ico"),
        webPreferences: {
            nodeIntegration: true,
        }
    })

    win.loadFile('./src/mainWindow/index.html')

    if (isDev) win.webContents.openDevTools()

    win.once('ready-to-show', () => {
        win.show()
        win.webContents.send('cpu_name', os.cpus()[0].model)

        const menuTemplate = [
            {label: app.name,
             submenu:[
                {label: "Preferences", click: () => {createPreferenceWindow()}},
                {label: "Open destination folder", click: () => {shell.openPath(destination)}}
             ]
            },
           
            {
                label: "File",
                submenu: [
                    isMac? {role: 'close'}: {role: 'quit'}
                ]
            }
        ]

        const menu = Menu.buildFromTemplate(menuTemplate)
        Menu.setApplicationMenu(menu)

    })

}

app.whenReady().then(() => {
    createWindow()
})

app.on('window-all-closed', () => {
    console.log("Todas janelas fechadas")
    if (!isMac) {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

ipcMain.on('open_new_window', () => {
    createWindow()
})

ipcMain.on("save_buffer", (e, buffer) => {
    const filePath = path.join(destination, `${Math.random().toFixed(7)}`)
    fs.writeFileSync(`${filePath}.webm`, buffer)
})

ipcMain.handle("show-dialog", async (e) => {
    const result = await dialog.showOpenDialog({properties:['openDirectory']})
    const dirPath = result. filePaths[0]
    preferences.set("destination", dirPath)
    destination = preferences.get("destination")

    return destination

})