"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("./src");
const etcd = new src_1.Etcd3();
const lease = etcd.lease(10);
lease.on('lost', l => console.log('lost', l));
lease.release();
