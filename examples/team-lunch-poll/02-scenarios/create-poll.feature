Feature: Create a lunch poll
  As Priya, the organiser
  I want to start a poll with a few places and a closing time
  So that the team decides by a fixed moment

  Background:
    Given the "Platform" team works in the "Europe/Brussels" time zone
    And it is 10:30 on a working day
    And Priya is signed in as a member of the "Platform" team

  @LUNCH-01 @US-1.1 @FR-1 @FR-2 @happy
  Scenario: A member creates a poll and the team sees it
    When Priya creates a poll titled "Friday lunch" closing at 11:45 with options:
      | option       |
      | Thai Garden  |
      | Burger Barn  |
      | Falafel Stop |
    Then the poll "Friday lunch" is open for voting until 11:45
    And every member of the "Platform" team sees "Friday lunch" at the top of their poll list

  @LUNCH-02 @US-1.2 @FR-1 @error
  Scenario Outline: A poll needs a title between 1 and 60 characters
    When Priya tries to create a poll titled "<title>" closing at 11:45 with 3 options
    Then the poll is not created
    And Priya sees the message "<message>"

    Examples:
      | title                                                          | message                            |
      |                                                                | Give your poll a title             |
      | Lunch on Friday at the new place near the station by the canal | Keep the title under 60 characters |

  @LUNCH-03 @US-1.2 @FR-1 @error
  Scenario Outline: A poll needs between 2 and 8 options
    When Priya tries to create a poll titled "Friday lunch" closing at 11:45 with <count> options
    Then the poll is not created
    And Priya sees the message "<message>"

    Examples:
      | count | message                        |
      | 1     | Add at least 2 places          |
      | 9     | A poll can have up to 8 places |

  @LUNCH-04 @US-1.2 @FR-1 @error
  Scenario Outline: The closing time must be later today
    When Priya tries to create a poll titled "Friday lunch" closing at "<closing time>" with 3 options
    Then the poll is not created
    And Priya sees the message "<message>"

    Examples:
      | closing time   | message                                 |
      | 10:00 today    | Pick a closing time later than now      |
      | 11:45 tomorrow | Polls close on the same day they start  |

  @LUNCH-05 @US-1.1 @FR-2 @edge
  Scenario: A team with no polls sees an invitation to start one
    Given the "Platform" team has no polls from the last 7 days
    When Priya opens the poll list
    Then Priya sees "No polls yet. Start one and let the team decide."
    And Priya is offered to start a new poll

  @LUNCH-06 @US-6 @FR-7 @error
  Scenario: Someone outside the team cannot see the team's polls
    Given the "Platform" team has an open poll "Friday lunch"
    And Dana is signed in but is not a member of the "Platform" team
    When Dana opens the "Platform" team's poll list
    Then Dana sees "You're not a member of this team"
    And Dana does not see the poll "Friday lunch"

  @LUNCH-07 @US-1.3 @FR-9 @happy
  Scenario: The creator marks an option as vegetarian-friendly
    When Priya creates a poll titled "Friday lunch" closing at 11:45 with options:
      | option       | vegetarian-friendly |
      | Thai Garden  | no                  |
      | Falafel Stop | yes                 |
    Then members see "Falafel Stop" marked as vegetarian-friendly
    And members see "Thai Garden" without the vegetarian-friendly mark
