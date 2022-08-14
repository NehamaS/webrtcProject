Feature: LOAD

  Background:
    Given system is runnig on CPAAS_HOME

  Rule: components load

  Scenario Outline: restcomm<-->ClientA LOAD
  """
  Load run <NUM_OF_WEB>+<NUM_OF_IPHONE>+<NUM_OF_ANDROID> sessions.
  Load running <DURATION> time, or until high failures rate according to <THRESHOLD>
  Load Expect to get <INVITE_RESPONSE> on each INVITE
  """
    Given inviteResponse: <INVITE_RESPONSE>, inviteTimeOut: <INVITE_TIMEOUT>, duration: <DURATION>, threshold: <THRESHOLD> and deviceType:
      | ANDROID           | WEB            | IPHONE           |
      | <NUM_OF_ANDROID>  |<NUM_OF_WEB>    | <NUM_OF_IPHONE>  |


    Examples:
      |INVITE_RESPONSE | INVITE_TIMEOUT | DURATION |  THRESHOLD   |NUM_OF_ANDROID|NUM_OF_IPHONE|NUM_OF_WEB|
      | OK             |2               |200       |  10          |10            |10           |10        |
