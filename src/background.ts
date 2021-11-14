'use strict'

import {app, protocol, BrowserWindow, nativeTheme, ipcMain} from 'electron'
import {createProtocol} from 'vue-cli-plugin-electron-builder/lib'
import installExtension, {VUEJS_DEVTOOLS} from 'electron-devtools-installer'
import ipcModules from "./electronIpcModules"
import config from '../config'

const isDevelopment = process.env.NODE_ENV !== 'production'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
    {scheme: 'app', privileges: {secure: true, standard: true}}
])


async function createWindow() {
    nativeTheme.themeSource = 'light'


    // Create the browser window.
    const win = new BrowserWindow({
        width: config.WINDOW.WIDTH || 1600,
        height: config.WINDOW.HEIGHT || 800,
        fullscreen: config.WINDOW.START_FULLSCREEN || false,
        webPreferences: {

            // Use pluginOptions.nodeIntegration, leave this alone
            // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
            nodeIntegration: !!process.env.ELECTRON_NODE_INTEGRATION,
            contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
            // devTools: false
        }
    })


    if (process.env.WEBPACK_DEV_SERVER_URL) {

        // Load the url of the dev server if in development mode
        await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)


        if (config.WINDOW.START_WITH_DEVTOOLS_OPEN) win.webContents.openDevTools()

    } else {

        createProtocol('app')
        // Load the index.html when not in development
        win.loadURL('app://./index.html')

    }


    // Let's establish our IPC channels, shall we?
    Object.entries(ipcModules).forEach(([mod_name, mod]) => {

        // If the module wants to use emit, we'll give it a wrapper of emit so that we can prefix the channel's name
        if (mod.emit != undefined) {
            mod.emit = (ch, args) => {
                win.webContents.send(mod_name + "_" + ch, args)
            }

        }


        // Register listeners
        if (mod.listeners != undefined) {
            Object.entries(mod.listeners).forEach(([channel, listener]) => {
                ipcMain.on(
                    mod_name + "_" + channel, listener)
            })
        }

        // Register handlers
        if (mod.handlers != undefined) {
            Object.entries(mod.handlers).forEach(([channel, handler]) => {
                ipcMain.handle(
                    mod_name + "_" + channel, handler)
            })
        }

        // Execute module init code
        mod.init?.()


    })


}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
    if (isDevelopment && !process.env.IS_TEST) {
        // Install Vue Devtools
        try {
            await installExtension(VUEJS_DEVTOOLS)
        } catch (e: any) {
            console.error('Vue Devtools failed to install:', e.toString())
        }
    }
    createWindow()

})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === 'win32') {
        process.on('message', (data) => {
            if (data === 'graceful-exit') {
                app.quit()
            }
        })
    } else {
        process.on('SIGTERM', () => {
            app.quit()
        })
    }
}

