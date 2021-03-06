ultrabot
========

turntable.fm bot

## Overview

This is my turntable.fm bot [ultrabot the funk](http://turntable.fm/profile/521971e3eb35c16bd3ef9060). He DJs when I don't have anyone else in my room to spin with, he likes everything I play, and he spouts deep thoughts.

You're welcome to use this script or modify it to create your own bot.

## Installing

First you will need to clone a copy of the ultrabot repository:

```bash
git clone https://github.com/mzabriskie/ultrabot.git
```

From the ultrabot directory install the Node dependencies:

```bash
cd ultrabot && npm install
```

Run [this bookmarklet](http://alaingilbert.github.io/Turntable-API/bookmarklet.html) to get the `AUTH`, `USERID` and `ROOMID`.

Next you will need to create a `bots.js` config file:

```bash
vim bots.js
```

```js
var Bot = require('ttapi'),
    ROOM_ID = '0123456789abcdefghijklmn'; // ID of whatever room you want

// Add as many bots as you want, but there needs to be at least one
// The first bot listed will be the moderator and will DJ when there aren't enough DJs in the room
module.exports = [
    new Bot('0123456789abcdefghijklmn', '0123456789abcdefghijklmn', ROOM_ID),
    new Bot('0123456789abcdefghijklmn', '0123456789abcdefghijklmn', ROOM_ID),
    new Bot('0123456789abcdefghijklmn', '0123456789abcdefghijklmn', ROOM_ID)
];
```

## Running

Start ultrabot server:

```bash
npm start
```

Launch [turntable.fm](http://turntable.fm) from your browser and visit the room that you specified in your `bots.js` configuration.

## License

Released under the MIT license.