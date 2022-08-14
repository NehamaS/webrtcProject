Feature: WebRTC_to_MCU

  Background:
    Given system params:
      | system   | feature   | service |
      | MCU_HOME | component | P2M     |

  Rule: When a step throws an unhandled error, then the scenario should fail and no other steps in that scenario should execute

    @TMU-3999
    Scenario: MCU conf, succeed flow
      Given restComm params:
        | restcommRes | timeOut |
        | OK          | 5       |
#   componentCPAAS is the appSId on the register request
      When Patric send register to componentCPAAS with ANDROID
      Then Patric receive RegisterAck response on Register
      When Bob send register to componentCPAAS with ANDROID
      Then Bob receive RegisterAck response on Register
      And  Bob Create video conference
      Then Bob receive CreateAck response on CreateRoom
      And  Bob starts call and invite Patric
      And Bob receive answer response on Start_Call
      When Bob ends call with Patric