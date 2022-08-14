#!/bin/sh
set -x

function runService() # wait for some event to happen, can be terminated by other process
{
  echo "Start Web RTC Gateway..."
  #npm run auto:run:local
  CONF_PATH=automation/component/config/config.json SIP_ADDRESS=127.0.0.1 SIP_PORT=5060 RESTCOM_ADDRESS=127.0.0.1:5080 DEFAULT_SIP=false node dist/main &
  sleep 3
}

function stopService() {
  echo "Stop Web RTC Gateway..."
  kill -s SIGTERM $1 #$1 is the webrtc gw pid
}

function runAutomation(){
  echo "Start component tets..."
  LOG_LEVEL=INFO npm run auto:component
  TEST_OK=$?
}

function main(){
  #Lauch wbrtcgw
  runService
  #persist pid
  GW_PID=$!
  echo "WebRTC GW PID => $GW_PID"
  runAutomation
  #kill wbrtcgw [pid]
  stopService "$GW_PID"

  if [ $TEST_OK -eq 0 ]; then
    echo "Done :-)"
  else
    echo "Component tets failed!!!"
    exit 1
  fi
}

main
