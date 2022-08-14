Feature: WebRTC_to_WebRTC

  Background:
    Given system params:
      | system     | feature |  service |
      | CPAAS_HOME | e2e     |  P2P     |

  Rule: When a step throws an unhandled error, then the scenario should fail and no other steps in that scenario should execute

    @webrtc2webrtc
    @TMU-34372
    @sanity
    @sm
    Scenario: happy path - userA call userB
      When Addison open ws connection
      And Patrick open ws connection
#     Patrick is the appSId on the register request
      And Addison send register to Patrick with ANDROID
      Then Addison receives RegisterAck
#     Addison is the appSId on the register request
      When Patrick send register to Addison with ANDROID
      Then Patrick receives RegisterAck
      When Addison starts call with Patrick
      Then Patrick receives CallStart
      And Patrick send Ringing to Addison
      Then Addison receives Ringing
      When Patrick Answer call from Addison
      Then Addison receives Answer
      When Addison ends call with Patrick
      Then Patrick receives Terminate
      And Addison send unregister
      And Patrick send unregister
      And Sleep 1 sec
      And Addison close ws connection
      And Patrick close ws connection

    @webrtc2webrtc
    @TMU-34373
    Scenario: userA start call, userB end call
      When Victoria open ws connection
      And Albert open ws connection
#     Albert is the appSId on the register request
      And Victoria send register to Albert with ANDROID
      Then Victoria receives RegisterAck
#     Victoria is the appSId on the register request
      When Albert send register to Victoria with ANDROID
      Then Albert receives RegisterAck
      When Victoria starts call with Albert
      Then Albert receives CallStart
      And Albert send Ringing to Victoria
      Then Victoria receives Ringing
      When Albert Answer call from Victoria
      Then Victoria receives Answer
      When Albert ends call with Victoria
      Then Victoria receives Terminate
#      When Victoria send TerminateAck to Albert
      And Victoria send unregister
      And Albert send unregister
      And Sleep 1 sec
      And Victoria close ws connection
      And Albert close ws connection

    @webrtc2webrtc
    @TMU-34374
    @reject
    Scenario: userA start call, userB reject call
      When Fred open ws connection
      And Jerry open ws connection
#     Jerry is the appSId on the register request
      And Fred send register to Jerry with ANDROID
      Then Fred receives RegisterAck
#     Fred is the appSId on the register request
      When Jerry send register to Fred with ANDROID
      Then Jerry receives RegisterAck
      When Fred starts call with Jerry
      Then Jerry receives CallStart
      And Jerry send Ringing to Fred
      Then Fred receives Ringing
      When Jerry Reject call
      Then Fred receives Reject
      And Fred send unregister
      And Jerry send unregister
      And Sleep 1 sec
      And Fred close ws connection
      And Jerry close ws connection

    @webrtc2webrtc
    @TMU-34378
    Scenario: call to unregistered user
      When Ross open ws connection
      And Tony open ws connection
#     Tony is the appSId on the register request
      And Ross send register to Tony with ANDROID
      Then Ross receives RegisterAck
      When Ross starts call with Tony
      Then Ross receives Not Found
      And Ross send unregister
      And Tony send unregister
      And Sleep 1 sec
      And Ross close ws connection
      And Tony close ws connection

    @webrtc2webrtc
    @TMU-34379
    Scenario: register user after start call
      When Franklin open ws connection
      And Eddie open ws connection
#     Eddie is the appSId on the register request
      And Franklin send register to Eddie with ANDROID
      Then Franklin receives RegisterAck
      When Franklin starts call with Eddie
#     Franklin is the appSId on the register request
      And Eddie send register to Franklin with ANDROID
      Then Eddie receives RegisterAck
      Then Eddie receives CallStart
      And Eddie send Ringing to Franklin
      Then Franklin receives Ringing
      When Eddie Answer call from Franklin
      Then Franklin receives Answer
      When Franklin ends call with Eddie
      Then Eddie receives Terminate
      And Eddie send unregister
      And Franklin send unregister
      And Sleep 1 sec
      And Franklin close ws connection
      And Eddie close ws connection

    @webrtc2webrtc
    @TMU-34427
    Scenario: start call after userB disconnected
      When Robin open ws connection
      And Newman open ws connection
#     Newman is the appSId on the register request
      And Robin send register to Newman with ANDROID
      Then Robin receives RegisterAck
#     Robin is the appSId on the register request
      When Newman send register to Robin with ANDROID
      Then Newman receives RegisterAck
      When Robin starts call with Newman
      Then Newman receives CallStart
      And Newman send Ringing to Robin
      Then Robin receives Ringing
      When Newman Answer call from Robin
      Then Robin receives Answer
      When Robin ends call with Newman
      Then Newman receives Terminate
      And Newman send unregister
      And Sleep 1 sec
      And Newman close ws connection
      When Robin starts call with Newman
      Then Robin receives Not Found
      And Robin send unregister
      And Sleep 1 sec
      And Robin close ws connection
