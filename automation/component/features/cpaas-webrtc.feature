Feature: Cpaas_to_WebRTC_Component

  Background:
    Given system params:
      | system     | feature   | service |
      | CPAAS_HOME | component | A2P     |

  @sanity
  @TMU-34422
  Scenario: restcomm<-->ClientB, Cpass end call
#   componentCPAAS is the appSId on the register request
    When Ruben send register to componentCPAAS with ANDROID
    Then Ruben receive RegisterAck response on Register
    When componentCPAAS send register to Ruben with ANDROID
    Then componentCPAAS receive RegisterAck response on Register
    When componentCPAAS send Invite to Ruben
    And Ruben send Ringing to componentCPAAS
    And Ruben Answer call from componentCPAAS
    Then componentCPAAS send Ack to Ruben
    And Sleep 1 sec
    When componentCPAAS ends call with Ruben
    And Ruben send unregister
    And componentCPAAS send unregister

  @TMU-34423
  Scenario: restcomm<-->ClientB, ClientB end call
#   componentCPAAS1 is the appSId on the register request
    When Alfred send register to componentCPAAS1 with ANDROID
    Then Alfred receive RegisterAck response on Register
    When componentCPAAS1 send register to Alfred with ANDROID
    Then componentCPAAS1 receive RegisterAck response on Register
    When componentCPAAS1 send Invite to Alfred
    And Alfred send Ringing to componentCPAAS1
    And Alfred Answer call from componentCPAAS1
    Then componentCPAAS1 send Ack to Alfred
    And Sleep 1 sec
    When Alfred ends call with componentCPAAS1
    And Alfred send unregister
    And componentCPAAS1 send unregister

  @reject
  @TMU-34424
  Scenario: restcomm<-->ClientB, ClientB reject call
    Given restComm params:
      | timeOut | errorCase |
      | 3       | true      |
#   componentCPAAS2 is the appSId on the register request
    When Michael send register to componentCPAAS2 with ANDROID
    Then Michael receive RegisterAck response on Register
    When componentCPAAS2 send register to Michael with ANDROID
    Then componentCPAAS2 receive RegisterAck response on Register
    When componentCPAAS2 send Invite to Michael
    And Michael send Ringing to componentCPAAS2
    When Michael Reject call
    And Sleep 1 sec
    Then componentCPAAS2 receive Reject
    And Michael send unregister
    And componentCPAAS2 send unregister

  @busy
  @TMU-34425
  Scenario: restcomm<-->ClientB, ClientB busy response
    Given restComm params:
      | timeOut | errorCase |
      | 3       | true      |
#   componentCPAAS3 is the appSId on the register request
    When Garfield send register to componentCPAAS3 with ANDROID
    Then Garfield receive RegisterAck response on Register
    When componentCPAAS3 send register to Garfield with ANDROID
    Then componentCPAAS3 receive RegisterAck response on Register
    When componentCPAAS3 send Invite to Garfield
    And Garfield send Ringing to componentCPAAS3
#    When Garfield send busy
    And Garfield send unregister
    And componentCPAAS3 send unregister

  @notFound
  @TMU-34426
  Scenario: restcomm<-->ClientB, ClientB not registered
    Given restComm params:
      | timeOut | errorCase |
      | 5       | true      |
#   componentCPAAS4 is the appSId on the register request
    When componentCPAAS4 send register to Angela with ANDROID
    Then componentCPAAS4 receive RegisterAck response on Register
    When componentCPAAS4 send Invite to Angela
    And Sleep 1 sec
    Then componentCPAAS4 receive Not Found
    And componentCPAAS4 send unregister