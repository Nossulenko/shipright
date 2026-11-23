Feature: Vote in a lunch poll
  As Sam, a team member
  I want to vote for where we eat in a couple of taps
  So that I take part even when I'm between calls

  Background:
    Given the "Platform" team has an open poll "Friday lunch" closing at 11:45 with options:
      | option       |
      | Thai Garden  |
      | Burger Barn  |
      | Falafel Stop |
    And it is 11:00 on the same day

  Rule: Each member has exactly one vote while the poll is open

    @LUNCH-08 @FR-3 @NFR-2 @happy
    Scenario: A member casts a vote
      Given Sam is signed in as a member of the "Platform" team
      When Sam votes for "Thai Garden"
      Then Sam sees their vote recorded for "Thai Garden"
      And the poll shows 1 vote for "Thai Garden"

    @LUNCH-09 @FR-4 @happy
    Scenario: A member changes their vote while the poll is open
      Given Sam is signed in as a member of the "Platform" team
      And Sam has voted for "Thai Garden"
      When Sam changes their vote to "Falafel Stop"
      Then the poll shows 1 vote for "Falafel Stop"
      And the poll shows 0 votes for "Thai Garden"

    @LUNCH-10 @FR-3 @edge
    Scenario: Voting twice from two browser tabs still counts once
      Given Sam is signed in as a member of the "Platform" team in two browser tabs
      And Sam has voted for "Burger Barn" in the first tab
      When Sam votes for "Burger Barn" again in the second tab
      Then the poll shows 1 vote for "Burger Barn"

  Rule: Votes are only accepted while the poll is open

    @LUNCH-11 @FR-5 @error
    Scenario: A member cannot vote after the closing time
      Given Sam is signed in as a member of the "Platform" team
      And it is now 11:46
      When Sam votes for "Thai Garden"
      Then Sam sees "This poll has closed"
      And Sam's vote is not counted

  Rule: Only signed-in team members can vote, and votes are private

    @LUNCH-12 @FR-7 @error
    Scenario: A visitor who is not signed in is asked to sign in before voting
      Given a visitor who is not signed in opens the poll "Friday lunch"
      When the visitor tries to vote for "Thai Garden"
      Then the visitor is asked to sign in with their company Google account
      And no vote is counted

    @LUNCH-13 @NFR-4 @happy
    Scenario: Members see vote counts but not who voted for what
      Given Sam has voted for "Thai Garden"
      And Lena has voted for "Burger Barn"
      When Priya views the poll "Friday lunch"
      Then Priya sees 1 vote for "Thai Garden" and 1 vote for "Burger Barn"
      But Priya does not see which member voted for which option
