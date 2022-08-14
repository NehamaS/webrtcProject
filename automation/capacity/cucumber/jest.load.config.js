module.exports = {
	roots: ["<rootDir>/steps"],
	transform: {
		"^.+\\.tsx?$": "ts-jest",
	},
	setupFiles: ["./init.js"],
	moduleNameMapper: {
		"@if(.*)$": "<rootDir>/if/gen-nodejs/$1",
	},
	testMatch: ["**/*.steps.ts"],
	reporters: [
		"default",
		[
			"jest-html-reporters",
			{
				pageTitle: "mMCU Automation",
				publicPath: "./reports",
				filename: "mcu_automation_report.html",
				expand: true,
			},
		],
		// [
		// 	"./node_modules/jest-cucumber/dist/src/reporter",
		// 	{
		// 		formatter: "json",
		// 		path: "./reports/test-report.json",
		// 	},
		// ],
		[
			"jest-junit",
			{
				outputDirectory: "./jreports",
				outputName: "jenkins-report.xml",
			},
		],
	],
	setupFilesAfterEnv: ["jest-expect-message"],
};
