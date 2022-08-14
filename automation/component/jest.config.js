module.exports = {
	roots: ["<rootDir>/steps"],
	transform: {
		"^.+\\.tsx?$": "ts-jest",
	},
	setupFiles: ["../init.js"],
	moduleNameMapper: {
		"@if(.*)$": "<rootDir>/if/gen-nodejs/$1",
	},
	testMatch: ["**/*.steps.ts"],
	reporters: [
		"default",
		[
			"jest-html-reporters",
			{
				pageTitle: "CPAAS Automation",
				publicPath: "./reports",
				filename: "CPAAS_automation_report.html",
				expand: true,
			},
		],
		[
			"jest-junit",
			{
				outputDirectory: "./jreports",
				outputName: "jenkins-report.xml",
			},
		],
	],
};
