"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbUtils = void 0;
class DbUtils {
    makeKey(key) {
        try {
            let res = "";
            Object.keys(key).sort().forEach((k) => {
                res = `${res}#${k}:${key[k]}`;
            });
            return res;
        }
        catch (e) {
            console.error(e.message);
        }
    }
}
exports.DbUtils = DbUtils;
//# sourceMappingURL=db.utils.js.map