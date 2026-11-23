Feature: Close a lunch poll and show the result
  As anyone on the team
  I want to see the winner the moment the poll closes
  So that we can stop discussing and go eat

  Background:
    Given Priya created the poll "Friday lunch" for the "Platform" team closing at 11:45 with options:
      | option       |
      | Thai Garden  |
      | Burger Barn  |
      | Falafel Stop |

  @LUNCH-14 @FR-5 @FR-6 @happy
  Scenario: The poll closes at its closing time and shows the winner
    Given the poll has 4 votes for "Falafel Stop", 3 for "Burger Barn" and 2 for "Thai Garden"
    When the time reaches 11:45
    Then the poll "Friday lunch" is closed
    And members see "Falafel Stop" as the winner with 4 votes
    And members see the vote count for every option

  @LUNCH-15 @FR-6 @edge
  Scenario: A tie is shown as a tie
    Given the poll has 3 votes for "Burger Barn", 3 for "Falafel Stop" and 2 for "Thai Garden"
    When the time reaches 11:45
    Then members see "It's a tie between Burger Barn and Falafel Stop"
    And no single winner is shown

  @LUNCH-16 @FR-6 @edge
  Scenario: A poll that nobody voted in closes without a winner
    Given the poll has no votes
    When the time reaches 11:45
    Then members see "No votes were cast"
    And no winner is shown

  Rule: Only the creator can close a poll early

    @LUNCH-17 @FR-8 @happy
    Scenario: The creator closes the poll before its closing time
      Given it is 11:20
      And the poll has 5 votes for "Thai Garden" and 4 for "Burger Barn"
      When Priya closes the poll early
      Then the poll "Friday lunch" is closed
      And members see "Thai Garden" as the winner with 5 votes

    @LUNCH-18 @FR-8 @error
    Scenario: A member who did not create the poll cannot close it early
      Given it is 11:20
      And Sam is signed in as a member of the "Platform" team
      When Sam tries to close the poll early
      Then Sam is told only the poll's creator can close it early
      And the poll "Friday lunch" stays open until 11:45
