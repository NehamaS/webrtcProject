"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const src_1 = require("../src");
const util_1 = require("./util");
describe('connection pool', () => {
    let client;
    let badClient;
    beforeEach(() => {
        client = new src_1.Etcd3({ hosts: util_1.getHosts() });
        badClient = new src_1.Etcd3({ hosts: '127.0.0.1:1' });
        return Promise.all([
            client.put('foo1').value('bar1'),
            client.put('foo2').value('bar2'),
            client.put('foo3').value('{"value":"bar3"}'),
            client.put('baz').value('bar5'),
        ]);
    });
    afterEach(() => {
        client.delete().all();
        client.close();
        badClient.close();
    });
    it('allows mocking', () => __awaiter(this, void 0, void 0, function* () {
        const mock = client.mock({
            exec: sinon.stub(),
            getConnection: sinon.stub(),
        });
        mock.exec.resolves({ kvs: [] });
        chai_1.expect(yield client.get('foo1').string()).to.be.null;
        chai_1.expect(mock.exec.calledWith('KV', 'range')).to.be.true;
        client.unmock();
        chai_1.expect(yield client.get('foo1').string()).to.equal('bar1');
    }));
    describe('get() / getAll()', () => {
        it('lists all values', () => __awaiter(this, void 0, void 0, function* () {
            chai_1.expect(yield client.getAll().strings()).to.containSubset(['bar1', 'bar2', 'bar5']);
        }));
        it('gets single keys with various encoding', () => __awaiter(this, void 0, void 0, function* () {
            chai_1.expect(yield client.get('foo1').string()).to.equal('bar1');
            chai_1.expect(yield client.get('foo2').buffer()).to.deep.equal(Buffer.from('bar2'));
            chai_1.expect(yield client.get('foo3').json()).to.deep.equal({ value: 'bar3' });
            chai_1.expect(yield client.get('wut').string()).to.be.null;
        }));
        it('queries prefixes', () => __awaiter(this, void 0, void 0, function* () {
            chai_1.expect(yield client.getAll().prefix('foo').strings())
                .to.have.members(['bar1', 'bar2', '{"value":"bar3"}']);
        }));
        it('gets keys', () => __awaiter(this, void 0, void 0, function* () {
            chai_1.expect(yield client.getAll().keys().strings()).to.have.members(['foo1', 'foo2', 'foo3', 'baz']);
        }));
        it('counts', () => __awaiter(this, void 0, void 0, function* () {
            chai_1.expect(yield client.getAll().count()).to.equal(4);
        }));
        it('sorts', () => __awaiter(this, void 0, void 0, function* () {
            chai_1.expect(yield client.getAll()
                .prefix('foo')
                .sort('key', 'asc')
                .limit(2)
                .keys()
                .strings()).to.deep.equal(['foo1', 'foo2']);
            chai_1.expect(yield client.getAll()
                .prefix('foo')
                .sort('key', 'desc')
                .limit(2)
                .keys()
                .strings()).to.deep.equal(['foo3', 'foo2']);
        }));
    });
    describe('delete()', () => {
        it('deletes all', () => __awaiter(this, void 0, void 0, function* () {
            yield client.delete().all();
            chai_1.expect(yield client.getAll().count()).to.equal(0);
        }));
        it('deletes prefix', () => __awaiter(this, void 0, void 0, function* () {
            yield client.delete().prefix('foo');
            chai_1.expect(yield client.getAll().keys().strings()).to.deep.equal(['baz']);
        }));
        it('gets previous', () => __awaiter(this, void 0, void 0, function* () {
            chai_1.expect(yield client.delete().key('foo1').getPrevious()).to.containSubset([
                {
                    key: new Buffer('foo1'),
                    value: new Buffer('bar1'),
                },
            ]);
        }));
        describe('put()', () => {
            it('allows touching key revisions', () => __awaiter(this, void 0, void 0, function* () {
                const original = (yield client.get('foo1').exec()).kvs[0].mod_revision;
                yield client.put('foo1').touch();
                const updated = (yield client.get('foo1').exec()).kvs[0].mod_revision;
                chai_1.expect(Number(updated)).to.be.greaterThan(Number(original));
            }));
            it('updates key values', () => __awaiter(this, void 0, void 0, function* () {
                yield client.put('foo1').value('updated');
                chai_1.expect(yield client.get('foo1').string()).to.equal('updated');
            }));
            it('includes previous values', () => __awaiter(this, void 0, void 0, function* () {
                chai_1.expect(yield client.put('foo1').value('updated').getPrevious()).to.containSubset({
                    key: new Buffer('foo1'),
                    value: new Buffer('bar1'),
                });
            }));
        });
    });
    describe('lease()', () => {
        let lease;
        const watchEmission = (event) => {
            const output = { data: null, fired: false };
            lease.once(event, (data) => {
                output.data = data;
                output.fired = true;
            });
            return output;
        };
        const onEvent = (event) => {
            return new Promise(resolve => lease.once(event, (data) => resolve(data)));
        };
        afterEach(() => __awaiter(this, void 0, void 0, function* () {
            if (lease && !lease.revoked()) {
                yield lease.revoke();
            }
        }));
        it('throws if trying to use too short of a ttl', () => {
            chai_1.expect(() => client.lease(0)).to.throw(/must be at least 1 second/);
        });
        it('reports a loss and errors if the client is invalid', () => __awaiter(this, void 0, void 0, function* () {
            lease = badClient.lease(1);
            const err = yield onEvent('lost');
            chai_1.expect(err).to.be.an.instanceof(src_1.GRPCConnectFailedError);
            yield lease.grant()
                .then(() => { throw new Error('expected to reject'); })
                .catch(err2 => chai_1.expect(err2).to.equal(err));
        }));
        it('provides basic lease lifecycle', () => __awaiter(this, void 0, void 0, function* () {
            lease = client.lease(100);
            yield lease.put('leased').value('foo');
            chai_1.expect((yield client.get('leased')).kvs[0].lease).to.equal(yield lease.grant());
            yield lease.revoke();
            chai_1.expect(yield client.get('leased').buffer()).to.be.null;
        }));
        it('runs immediate keepalives', () => __awaiter(this, void 0, void 0, function* () {
            lease = client.lease(100);
            chai_1.expect(yield lease.keepaliveOnce()).to.containSubset({
                ID: yield lease.grant(),
                TTL: '100',
            });
            yield lease.keepaliveOnce();
        }));
        it('emits a lost event if the lease is invalidated', () => __awaiter(this, void 0, void 0, function* () {
            lease = client.lease(100);
            let err;
            lease.on('lost', e => err = e);
            chai_1.expect(lease.revoked()).to.be.false;
            yield client.leaseClient.leaseRevoke({ ID: yield lease.grant() });
            yield lease.keepaliveOnce()
                .then(() => { throw new Error('expected to reject'); })
                .catch(err2 => {
                chai_1.expect(err2).to.equal(err);
                chai_1.expect(err2).to.be.an.instanceof(src_1.EtcdLeaseInvalidError);
                chai_1.expect(lease.revoked()).to.be.true;
            });
        }));
        describe('crons', () => {
            let clock;
            beforeEach(() => __awaiter(this, void 0, void 0, function* () {
                clock = sinon.useFakeTimers();
                lease = client.lease(60);
                yield onEvent('keepaliveEstablished');
            }));
            afterEach(() => clock.restore());
            it('touches the lease ttl at the correct interval', () => __awaiter(this, void 0, void 0, function* () {
                const kaFired = watchEmission('keepaliveFired');
                clock.tick(19999);
                chai_1.expect(kaFired.fired).to.be.false;
                clock.tick(1);
                chai_1.expect(kaFired.fired).to.be.true;
                const res = yield onEvent('keepaliveSucceeded');
                chai_1.expect(res.TTL).to.equal('60');
            }));
            it('tears down if the lease gets revoked', () => __awaiter(this, void 0, void 0, function* () {
                yield client.leaseClient.leaseRevoke({ ID: yield lease.grant() });
                clock.tick(20000);
                chai_1.expect(yield onEvent('lost')).to.be.an.instanceof(src_1.EtcdLeaseInvalidError);
                chai_1.expect(lease.revoked()).to.be.true;
            }));
        });
        describe('if()', () => {
            it('runs a simple if', () => __awaiter(this, void 0, void 0, function* () {
                yield client.if('foo1', 'value', '==', 'bar1')
                    .then(client.put('foo1').value('bar2'))
                    .commit();
                chai_1.expect(yield client.get('foo1').string()).to.equal('bar2');
            }));
            it('runs consequents', () => __awaiter(this, void 0, void 0, function* () {
                yield client.if('foo1', 'value', '==', 'bar1')
                    .then(client.put('foo1').value('bar2'))
                    .else(client.put('foo1').value('bar3'))
                    .commit();
                chai_1.expect(yield client.get('foo1').string()).to.equal('bar2');
            }));
            it('runs multiple clauses and consequents', () => __awaiter(this, void 0, void 0, function* () {
                const result = yield client.if('foo1', 'value', '==', 'bar1')
                    .and('foo2', 'value', '==', 'wut')
                    .then(client.put('foo1').value('bar2'))
                    .else(client.put('foo1').value('bar3'), client.get('foo2'))
                    .commit();
                chai_1.expect(result.responses[1].response_range.kvs[0].value.toString())
                    .to.equal('bar2');
                chai_1.expect(yield client.get('foo1').string()).to.equal('bar3');
            }));
        });
        describe('lock()', () => {
            const assertCantLock = () => {
                return client.lock('resource')
                    .acquire()
                    .then(() => { throw new Error('expected to throw'); })
                    .catch(err => chai_1.expect(err).to.be.an.instanceof(src_1.EtcdLockFailedError));
            };
            const assertAbleToLock = () => __awaiter(this, void 0, void 0, function* () {
                const lock = client.lock('resource');
                yield lock.acquire();
                yield lock.release();
            });
            it('locks exclusively around a resource', () => __awaiter(this, void 0, void 0, function* () {
                const lock1 = client.lock('resource');
                yield lock1.acquire();
                yield assertCantLock();
                yield lock1.release();
                yield assertAbleToLock();
            }));
            it('provides locking around functions', () => __awaiter(this, void 0, void 0, function* () {
                yield client.lock('resource').do(assertCantLock);
                yield assertAbleToLock();
            }));
        });
    });
});
