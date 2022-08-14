Feature: Click to Call Demo

  Background: To Launch the browser
    Given Launch the browser

  Scenario: Click to call demo - happy path
    When Click talk to sales
    And Enter "Eran" as calling user
    Then Silent Login and connect
    And Start call
    Then wait 3 sec
    Then end call