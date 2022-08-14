const fs = require('fs').promises;
async function loadStatisticsFile() {
    const jsonString = await fs.readFile(`${process.env.WORKSPACE}/webrtcgw-git/automation/capacity/jmeter/${process.env.NODE_NAME}-reports/statistics.json`, "utf8");
    const runData = JSON.parse(jsonString)
    const succeedSamplers=runData.Total.sampleCount
    const failedSamplers=runData.Total.errorCount
    return {succeedSamplers,failedSamplers}
}




const assert = require('assert');

describe('capacity tests assertions', () => {
  it  ('verify low failures rate', async () => {
        const invokedData=await loadStatisticsFile()
        assert.ok(10*invokedData.succeedSamplers/100>invokedData.failedSamplers);
    });
});