import { LOGGER } from "./common/logger.service";

var reporter = require("cucumber-html-reporter");

var rargs = process.argv.slice(2);
LOGGER.debug("args: ", rargs);

let runReport = true;
let jsonFileName = "./reports/test-report.json";
let htmlFileName = "./reports/test-report.html";
if (rargs.length > 0) {
	runReport = rargs[0] === "true" ? true : false;
	jsonFileName = rargs[1];
	htmlFileName = rargs[2];
}

var report_options = {
	theme: "bootstrap",
	jsonFile: jsonFileName,
	output: htmlFileName,
	reportSuiteAsScenarios: true,
	scenarioTimestamp: true,
	launchReport: runReport,
	metadata: {
		"App Version": "0.3.2",
		"Test Environment": "DEV",
		Platform: "Linux",
		Parallel: "Scenarios",
		Executed: "Remote",
	},
};
LOGGER.debug("report settings:", report_options);

reporter.generate(report_options);
