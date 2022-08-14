Feature: WebRTC_to_Cpaas_Component

  Background:
    Given system params:
     | system     | feature   |
     | CPAAS_HOME | component |

  @sanity
  @ok
  @TMU-33853
  Scenario: ClientA<-->restcomm, succeed flow
    Given restComm params:
    | restcommRes | timeOut |
    | OK          | 5       |
#   componentCPAAS is the appSId on the register request
    When Bob send register to componentCPAAS with ANDROID
    Then Bob receive RegisterAck response on Register
    And Bob starts call with componentCPAAS
    Then Bob receive ringing response on Start_Call
    And Bob receive answer response on Start_Call
    When Bob ends call with componentCPAAS
    And Bob send unregister

  @sanity
  @reject
  @TMU-33854
  Scenario: ClientA<-->restcomm, reject flow
    Given restComm params:
      | restcommRes | timeOut |
      | REJECT      | 5       |
#   componentCPAAS is the appSId on the register request
    When Charlie send register to componentCPAAS with ANDROID
    Then Charlie receive RegisterAck response on Register
    And Charlie starts call with componentCPAAS
    Then Charlie receive ringing response on Start_Call
    And Charlie receive reject response on Start_Call
    And Charlie send unregister

  @sanity
  @busy
  @TMU-33855
  Scenario: ClientA<-->restcomm, busy flow
    Given restComm params:
      | restcommRes | timeOut |
      | BUSY        | 5       |
#   componentCPAAS is the appSId on the register request
    When Bob send register to componentCPAAS with ANDROID
    Then Bob receive RegisterAck response on Register
    And Bob starts call with componentCPAAS
    Then Bob receive ringing response on Start_Call
    And Bob receive busy response on Start_Call
    And Bob send unregister

  @ByeFromRestComm
  @TMU-33856
  Scenario: ClientA<-->restcomm, clientB ends call
    Given restComm params:
      | restcommRes | timeOut |
      | OK          | 5       |
#   componentCPAAS is the appSId on the register request
    When Bob send register to componentCPAAS with ANDROID
    Then Bob receive RegisterAck response on Register
    And Bob starts call with componentCPAAS
    Then Bob receive ringing response on Start_Call
    And Bob receive answer response on Start_Call
    When componentCPAAS ends call with Bob
    And Bob send unregister

  @RecallFromUserB
  @TMU-33857
  Scenario: ClientA<-->restcomm, clientB recall
    Given restComm params:
      | restcommRes | timeOut |
      | OK          | 5       |
#   componentCPAAS is the appSId on the register request
    When Bob send register to componentCPAAS with ANDROID
    Then Bob receive RegisterAck response on Register
    And Bob starts call with componentCPAAS
    Then Bob receive ringing response on Start_Call
    And Bob receive answer response on Start_Call
    When componentCPAAS recall to bob
    When Bob ends call with componentCPAAS
    And Bob send unregister

  @TMU-33858
  Scenario: ClientA<-->restcomm, start call after end call
    Given restComm params:
      | restcommRes | timeOut |
      | OK          | 5       |
#   componentCPAAS is the appSId on the register request
    When Bob send register to componentCPAAS with ANDROID
    Then Bob receive RegisterAck response on Register
    And Bob starts call with componentCPAAS
    Then Bob receive ringing response on Start_Call
    And Bob receive answer response on Start_Call
    When Bob ends call with componentCPAAS
    And Bob starts call with componentCPAAS
    Then Bob receive ringing response on Start_Call
    And Bob receive answer response on Start_Call
    And Bob send unregister

  @notFound
  @TMU-34375
  Scenario: ClientA<-->restcomm, unknown clientB
    Given restComm params:
      | restcommRes | timeOut |
      | NOT_FOUND   | 5       |
#   componentCPAAS is the appSId on the register request
    When Bob send register to componentCPAAS with ANDROID
    Then Bob receive RegisterAck response on Register
    And Bob starts call with componentCPAAS
    Then Bob receive ringing response on Start_Call
    And Bob receive not_found response on Start_Call
    And Bob send unregister
