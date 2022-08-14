Feature: WebRTC_to_CPaaS

  Background:
    Given system params:
      | system     | feature | service |
      | CPAAS_HOME | e2e     |  P2A    |

  Rule: When a step throws an unhandled error, then the scenario should fail and no other steps in that scenario should execute

    @TMU-33886
    @sanity
    @sm
    Scenario: happy path - userA terminates call
      When Klara open ws connection
#     MCUCostumerSupport is the appSId on the register request
      And Klara send register to MCUCostumerSupport with ANDROID
      Then Klara receives RegisterAck
      When Klara starts call with MCUCostumerSupport
      Then Klara receives Ringing
      And Klara receives Answer
      When Klara ends call with MCUCostumerSupport
#      No Ack is sent from sever!
      And Klara send unregister
      And Sleep 1 sec
      And Klara close ws connection

    @TMU-33887
    Scenario: call to unknown CPaaS Application
      When Elvis open ws connection
#     Cpaas is the appSId on the register request
      When Elvis send register to Cpaas with ANDROID
      Then Elvis receives RegisterAck
      When Elvis starts call with UnknownCostumer
      Then Elvis receives Not found
      And Elvis send unregister
      And Sleep 1 sec
      And Elvis close ws connection

    @TMU-34032
    Scenario: CPaaS Application terminates call
      When David open ws connection
#     MCUCostumerSupport is the appSId on the register request
      When David send register to MCUCostumerSupport with ANDROID
      Then David receives RegisterAck
      When David starts call with MCUCostumerSupport
      Then David receives Ringing
      And David receives Answer
      And Sleep 3 sec
      And David receives Terminate
      Then David send TerminateAck to MCUCostumerSupport
      And David send unregister
      And Sleep 1 sec
      And David close ws connection

#     start call and cancel scenario is covered on e2e unit tests
