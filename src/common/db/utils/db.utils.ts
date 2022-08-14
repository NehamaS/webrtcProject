export class DbUtils {
    public makeKey(key: Object): string {
        try {
            let res: string = "";
            Object.keys(key).sort().forEach((k) => {
                res = `${res}#${k}:${key[k]}`;
            })
            return res;
        } catch (e) {
            console.error(e.message)
        }
    }
}
