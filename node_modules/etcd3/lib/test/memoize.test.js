"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const memoize_1 = require("../src/memoize");
class Foo {
    constructor() {
        this.incr = 0;
    }
    get incrGetter() {
        this.incr += 1;
        return this.incr;
    }
    basicMemoized(amount) {
        this.incr += amount;
        return this.incr;
    }
    byModulo(amount) {
        this.incr += amount;
        return this.incr;
    }
    forgetBasic() {
        memoize_1.forget(this, this.basicMemoized);
    }
}
__decorate([
    memoize_1.Memoize()
], Foo.prototype, "incrGetter", null);
__decorate([
    memoize_1.Memoize()
], Foo.prototype, "basicMemoized", null);
__decorate([
    memoize_1.Memoize((value) => value % 2)
], Foo.prototype, "byModulo", null);
describe('@Memoize', () => {
    it('memoizes simple methods', () => {
        const foo = new Foo();
        chai_1.expect(foo.basicMemoized(1)).to.equal(1);
        chai_1.expect(foo.basicMemoized(1)).to.equal(1);
        chai_1.expect(foo.basicMemoized(2)).to.equal(3);
    });
    it('forgets memoized values', () => {
        const foo = new Foo();
        chai_1.expect(foo.basicMemoized(1)).to.equal(1);
        foo.forgetBasic();
        chai_1.expect(foo.basicMemoized(1)).to.equal(2);
        chai_1.expect(foo.basicMemoized(1)).to.equal(2);
    });
    it('memoizes with custom hashers', () => {
        const foo = new Foo();
        chai_1.expect(foo.incr).to.equal(0);
        chai_1.expect(foo.byModulo(1)).to.equal(1);
        chai_1.expect(foo.byModulo(2)).to.equal(3);
        chai_1.expect(foo.byModulo(3)).to.equal(1);
        chai_1.expect(foo.byModulo(4)).to.equal(3);
    });
    it('memoizes getters', () => {
        const foo = new Foo();
        chai_1.expect(foo.incrGetter).to.equal(1);
        chai_1.expect(foo.incrGetter).to.equal(1);
    });
    it('throws when attaching to a non-memoizable type', () => {
        chai_1.expect(() => {
            class Bar {
                set foo(_value) { }
            }
            __decorate([
                memoize_1.Memoize()
            ], Bar.prototype, "foo", null);
            return Bar;
        }).to.throw(/Can only attach/);
    });
});
