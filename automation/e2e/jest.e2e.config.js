module.exports = {
  rootDir: "<rootDir>/../../../",
  roots: ["<rootDir>/automation/e2e/steps"],
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  setupFiles: ["<rootDir>/automation/init.js"],
  testMatch: ["**/*.steps.ts"],
  reporters: [
    "default",
    [ 'jest-junit', {
      outputDirectory: "automation/e2e/jreports",
        outputName: "wbrtcgw_e2e_report.xml",
          } ],
    [
      "jest-html-reporters",
      {
        pageTitle: "WebRTCGW E2E Automation",
        publicPath: "./automation/e2e/reports",
        filename: "wbrtcgw_e2e_report.html",
        expand: true
      }
    ]
  ]
};
