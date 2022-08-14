export function duration(target, name, descriptor) {
    const original = descriptor.value;
    descriptor.value = async function (...args) {
        const startTime = performance.now();
        const result: any = await original.apply(this, args);
        const endTime = performance.now();
        result.duration = endTime - startTime;
        global.logger.debug({
            test: global.logger["context"].current,
            step:duration.name,
            action: JSON.stringify({
                action: `${original.name}:${args[0].method ? args[0].method : "."}`,
                duration: result.duration,

            })
        });
        return result;
    };
    return descriptor;
}
