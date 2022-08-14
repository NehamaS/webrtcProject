"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WssAdmin = void 0;
const common_1 = require("@nestjs/common");
const WebSocket = __importStar(require("ws"));
let WssAdmin = class WssAdmin {
    constructor() {
        this.wsConnMap = new Map();
        console.log('wssAdmin:wssAdmin()');
    }
    onConnect(req, wss) {
        this.wsConnMap.set(this.createConnId(req), wss);
    }
    onMessage(req, wss, msg) {
        let apiMsg = JSON.parse(msg);
        let wsReq = {
            connectionId: this.createConnId(req),
            dto: apiMsg
        };
    }
    onClose(req, wss) {
        this.wsConnMap.delete(this.createConnId(req));
        wss.close();
    }
    createConnId(req) {
        return '_ws_' + req.socket.remoteAddress + '_' + req.socket.remotePort;
    }
    async sendMessage(connId, msg) {
        let wss = this.wsConnMap.get(connId);
        if (wss != undefined) {
            if (wss.readyState === WebSocket.OPEN) {
                wss.send(JSON.stringify(msg));
            }
            else {
                console.error({ func: 'wssAdmin:sendMessage()', conn: connId, desc: 'websocket closed' });
            }
        }
        else {
            console.error({ func: 'wssAdmin:sendMessage()', conn: connId, desc: 'websocket not found' });
        }
    }
};
WssAdmin = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], WssAdmin);
exports.WssAdmin = WssAdmin;
//# sourceMappingURL=wss.admin.js.map