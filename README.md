
# Paper Trading App

## Overview

Trading securities is an exercise in boredom, tapping away at your brokerage's application in the vain hope of deriving profit from the enigmatic juggernaut of global capitalism...but it doesn't have to be! My app introduces a social element to investing for those who don't have a reserved parking spot at the country club, allowing users to post their trades or speculative thoughts and comment on the activity of others. Keep up-to-date your friends and engage in the *good* kind of trade-war by competing for the best picks and maximum profit.

This is a web-app that will allow users to post paper trades that are visible to others. The application will track and display the performance of these trades and other users will be able to provide comments on these activities. These trades are visible to the public, users will be able to create accounts and log-in so they can post their own and comment on others'.


## Data Model


The application will store Users, Trades and Comments

* Users can have multiple Trades (via references)
* each Trade has one User as an owner (via reference)
* each Trade can have multiple Comments (by embedding)

An Example User:

```javascript
{
  username: "wBuffett30",
  hash: // a password hash,
  trades: // an array of references to Trade documents,
}
```

An Example Trade with Embedded Comments:

```javascript
{
  _user: // a reference to a User object,
  ticker: "BRK.A",
  priceAtCreation: 293436.94,
  action: "buy",
  confidence: "high",
  comments: [
    { name: [User reference], content: "Suggesting your own stock, really?"}
  ],
  createdAt: // timestamp,
  slug: //unique URL to trade info page
}
```


## [First Draft Schema](src/db.js)

## Wireframes

/ - index

![index](documentation/homepage-wireframe.png)

/my-account - displaying info about your account, trades, and friends

![my-account](documentation/account-page-wireframe.png)

/login & /register - pages for user account management

![login-register](documentation/login-register-wireframe.png)

/new-trade - page for submitting a new paper trade

![new-trade](documentation/new-trade-wireframe.png)

/trade/slug - page for displaying detailed information and comments about a trade

![trade-info](documentation/detailed-trade-wireframe.png)


## Site map

![sitemap](documentation/sitemap.png)

## User Stories or Use Cases

1. as non-registered user, I can register a new account with the site
2. as a non-registered user, I can view and sort trades
3. as a user, I can log in to the site
4. as a user, I can log out of the site
5. as a user, I can create a new trade
6. as a user, I can view all of the trades I've made
7. as a user, I can add comments to existing trades


## Research Topics

* (5 points) Integrate user authentication
    * Using passport for user auth

* (3 points) Using Node-convict for environment confguration

* (0 points) Using Moment.js for parsing/displaying timestamps
    * Implemented within a handlebars helper, very easy to learn/user

* (2 points) Using node-fetch to make promise-based calls to remote API
    * Used to connect to IEX market API and fetch price/name as well as validate
    * Great exercise for figuring out promises, lots of promise chaining

* (0 points) Using express-sanitize-escape middleware


## [Link to Initial Main Project File](src/app.js)


## Annotations / References Used

1. [IEX Market API](https://iextrading.com/developer/docs/)
2. [Node-convict](https://github.com/mozilla/node-convict/blob/master/README.md)
3. [Passport Local-Auth Strategy Tutorial](https://scotch.io/tutorials/easy-node-authentication-setup-and-local)
4. [Using Fetch](https://codeburst.io/4-ways-for-making-http-s-requests-with-node-js-c524f999942d)
5. [express-sanitize-escape](https://www.npmjs.com/package/express-sanitize-escape)
