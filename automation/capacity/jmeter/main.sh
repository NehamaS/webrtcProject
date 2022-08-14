#!/usr/bin/env bash

export PROJECT_DIR=${WORKSPACE}/webrtcgw-git/automation/capacity/jmeter/



export NUMBER_OF_CALLS_PER_THREAD=$(expr $STAGE_DURATION \/ 40)
export TOKEN_PATH_URL=$PROJECT_DIR/jmeterConfig/token.txt


echo "NODE_NAME $NODE_NAME"
#npx ts-node $PROJECT_DIR/cognitoAuth.ts
${WORKSPACE}/${JMETER_HOME}/jmeter -n -t $PROJECT_DIR/jmeterConfig/capacity.jmx -l  $PROJECT_DIR/results/jenkins.io.report.jtl -j $PROJECT_DIR/results/jmeter.save.saveservice.output_format=xml \
    -JnumberOfThread=$NUM_OF_THREADS \
    -JstartUpTime=$START_UP_TIME \
    -JnumberOfCallsPerThread=$NUMBER_OF_CALLS_PER_THREAD \
    -JappSidCsvPath=$APPSID_CSV_PATH  \
    -JtokenPathUrl=$TOKEN_PATH_URL   \

${WORKSPACE}/${JMETER_HOME}/jmeter -g  $PROJECT_DIR/results/jenkins.io.report.jtl -o $PROJECT_DIR/$NODE_NAME-reports
mv $PROJECT_DIR/results/jmeter.save.saveservice.output_format=xml $PROJECT_DIR/$NODE_NAME-reports/capacity.log


