//require("./logger");

const setJestCucumberConfiguration = require("jest-cucumber").setJestCucumberConfiguration;

// var ReportGeneration = require("jest-cucumber/dist/src/reporting/report-event-generation/ReportEventGenerator");
//
// let origReportGen = ReportGeneration.ReportEventGenerator.prototype.onScenarioComplete;
//
// function generateReport(jestTestResult /*list of test results*/) {
// 	console.log("##########################", jestTestResult);
// 	let tests = jestTestResult.filter(testResult => testResult.status != "pending");
// 	console.log("##########################", tests);
//
// 	return origReportGen(tests);
// }
// ReportGeneration.ReportEventGenerator.prototype.onScenarioComplete = generateReport;

const LOAD_TAG_DIABLED = "not @load";
const NIGHT_TAG_DIABLED = "not @nightly";
const RECORDER = "recorder";
// const RECORDER_TAG_DIABLED = `not @${RECORDER}`;
const MRF = "mrf";
const MRF_TAG_DIABLED = `not @${MRF}`;

// const IGNORE_TESTS = `${LOAD_TAG_DIABLED} and ${RECORDER_TAG_DIABLED} and ${MRF_TAG_DIABLED}`;
const IGNORE_TESTS = `${LOAD_TAG_DIABLED} and ${MRF_TAG_DIABLED}`;

function parseFeatureTags() {
	if (process.env.TAGS && process.env.TAGS.toLocaleLowerCase() == "skipnightly") {
		return `${NIGHT_TAG_DIABLED} and ${IGNORE_TESTS}`;
	}
	let scenarioFilter =
		process.env.TAGS && process.env.TAGS.toLocaleLowerCase() != "all" ? process.env.TAGS.trim().split(",") : [];
	let tagFilter = undefined;
	if (scenarioFilter.length > 0) {
		scenarioFilter.map((tag) => {
			tagFilter = tagFilter ? `${tagFilter} or @${tag.trim()}` : `@${tag.trim()}`;
		});
		console.info("Testing filter: ", scenarioFilter);
		let result = `(${tagFilter}) and ${LOAD_TAG_DIABLED}`;
		// if (!scenarioFilter.includes(RECORDER)) {
		// 	result = `${result} and ${RECORDER_TAG_DIABLED}`;
		// }
		// if (!scenarioFilter.includes(MRF)) {
		// 	result = `${result} and ${MRF_TAG_DIABLED}`;
		// }
		return result;
	}
	return IGNORE_TESTS;
}

setJestCucumberConfiguration({
	tagFilter: parseFeatureTags(),
});
