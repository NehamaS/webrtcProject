const log4js = require('log4js');

export const logConfig = (feature:string) => {
    log4js.configure({
        appenders: {
            WebRTC_to_CPaaS: {
                type: 'file',
                filename: 'automationLogs/WebRTC_to_CPaaS.log'
            },
            WebRTC_to_Cpaas_Component: {
                type: 'file',
                filename: 'automationLogs/WebRTC_to_Cpaas_Component.log'
            },
            WebRTC_to_WebRTC: {
                type: 'file',
                filename: 'automationLogs/WebRTC_to_WebRTC.log'
            },
            stdout: {
                type: 'stdout'
            },
        },
        categories: {
            WebRTC_to_CPaaS:{
                appenders: ['WebRTC_to_CPaaS','stdout'], level: process.env.LOG_LEVEL
            },
            WebRTC_to_WebRTC:{
                appenders: ['WebRTC_to_WebRTC','stdout'], level: process.env.LOG_LEVEL
            },
            WebRTC_to_Cpaas_Component:{
                appenders: ['WebRTC_to_Cpaas_Component','stdout'], level: process.env.LOG_LEVEL
            },
            stdout:{
                appenders: ['stdout'], level: process.env.LOG_LEVEL
            },

            default: { appenders: [ 'stdout' ], level: process.env.LOG_LEVEL }
        }
    });
    const logger  = log4js.getLogger(feature);
    return logger

}