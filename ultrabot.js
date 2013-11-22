(function () {

var thoughts = require('./thoughts'),
    BOT_CREW = require('./bots'),
    MOD_BOT = BOT_CREW[0], // This is the moderator bot, and the only one that DJs
    DJ_QUEUE = [],
    DJ_COUNT = 4, // Max num of DJs before bot steps down
    snagCount = 0,
    isCurrentDJ = false,
    stepDownAfterSong = false;

//--------------------------------------------------
// Initialize bot events
//--------------------------------------------------

/*jshint loopfunc:true */
(function () {
for (var i=0, l=BOT_CREW.length; i<l; i++) {
    var bot = BOT_CREW[i];

    // All bots upvote each song that's played and handle errors
    bot.on('newsong', function (data) { handleNewSong(this, data); });
    bot.on('ready', function () { handleReady(this); });
    bot.on('error', function (data) { handleError(this, data); });
    bot.on('disconnected', function (data) { handleDisconnected(this, data); });

    // Only the moderator bot handles speak, DJs, etc.
    if (i === 0) {
        bot.on('speak', function (data) { handleSpeak(this, data); });
        bot.on('add_dj', function (data) { handleAddDj(this, data); });
        bot.on('rem_dj', function (data) { handleRemDj(this, data); });
        bot.on('snagged', function (data) { handleSnagged(this, data); });
        bot.on('endsong', function (data) { handleEndSong(this, data); });
        bot.on('roomChanged', function (data) { handleRoomChanged(this, data); });
    }
}
})();

//--------------------------------------------------
// Event handlers for drones
//--------------------------------------------------

// Handle 'newsong' event
function handleNewSong(bot, data) {
    // Auto upvote the song
    setTimeout(function () {
        bot.bop();
    }, Math.floor(Math.random() * 30) * 1000);

    // Update current DJ flag
    if (data.room.metadata.current_song.djid === MOD_BOT.userId) {
        isCurrentDJ = true;
    }
}

// Handle 'ready' event
function handleReady(bot) {
    console.info('Bot is ready: ' + bot.userId);
}

// Handle 'error' event
function handleError(bot, data) {
    console.error('Bot encountered error: ' + bot.userId);
    console.error(data);
}

// Handle 'disconnected' event
function handleDisconnected(bot, data) {
    console.warn('Bot was disconnected: ' + bot.userId);
    console.warn(data);
}

//--------------------------------------------------
// Event handlers for moderator
//--------------------------------------------------

// Handle 'snagged' event
function handleSnagged(bot, data) {
    snagCount++;
}

// Handle 'roomChanged' event
function handleRoomChanged(bot, data) {
    // If there aren't enough DJ's, get on decks
    if (data.room.metadata.djcount > 0 &&
        data.room.metadata.djcount <= DJ_COUNT) {
        bot.addDj();
    }
}

// Handle 'endsong' event
function handleEndSong(bot, data) {
    // Share stats from the last song
    // http://pastebin.com/3VjsVgix (Emoticons for turntable.fm)
    var song = data.room.metadata.current_song.metadata,
        stat = '"' + song.song + '" by ' + song.artist + ' • ' +
                ':thumbsup: ' + data.room.metadata.upvotes + ' • ' +
                ':thumbsdown: ' + data.room.metadata.downvotes + ' • ' +
                ':heart: ' + snagCount;
    bot.speak(stat);
    console.log(stat);
    snagCount = 0;

    // Snag song if it was popular
    if (!isCurrentDJ && data.room.metadata.upvotes >= 10) {
        bot.playlistAdd(data.room.metadata.current_song._id);
    }
    // Drop song if it sucked
    else if (isCurrentDJ && data.room.metadata.downvotes > 2) {
        bot.playlistRemove();
    }

    // Update current DJ flag
    if (data.room.metadata.current_song.djid === MOD_BOT.userId) {
        isCurrentDJ = false;
    }

    // If triggered during bots song, step down now
    if (stepDownAfterSong) {
        bot.remDj();
        stepDownAfterSong = false;
    }
}

// Handle 'add_dj' event
function handleAddDj(bot, data) {
    // Check the DJ count when a new DJ steps up
    bot.roomInfo(false, function (data) {
        // If there's enough DJ's now, bot steps down
        if (data.room.metadata.djcount > DJ_COUNT) {
            stepDown(bot);
        }
        // ...otherwise if there's only one DJ bot steps up to the decks
        else if (data.room.metadata.djcount === 1) {
            bot.addDj();
        }
    });
}

// Handle 'rem_dj' event
function handleRemDj(bot, data) {
    // Checks DJ count when a DJ steps down
    bot.roomInfo(false, function (info) {
        // If there aren't enough DJ's, add one (unless bot is the one stepping down)
        if (info.room.metadata.djcount <= DJ_COUNT && data.user[0].userid !== MOD_BOT.userId) {
            // Add DJ from the queue
            if (DJ_QUEUE.length > 0) {
                bot.addDj(DJ_QUEUE.shift());
            }
            // ...otherwise bot takes a turn on the decks!
            else if (info.room.metadata.djcount > 1) {
                bot.addDj();
            }
            // ...unless bot is the only DJ
            else {
                bot.remDj();
            }
        }
    });
}

// Handle 'speak' event
function handleSpeak(bot, data) {
    if (data.userid === MOD_BOT.userId) { return; }

    var text = data.text;
    switch (true) {
        case /^[\/\.#!]?(commands|cmd)$/i.test(text):
            bot.speak('Commands: rules • bop • add • rem');
            break;
        case /^[\/\.#!]rules$/i.test(text):
            bot.speak(getRulesText());
            break;
        case /^[\/\.#!]bop$/i.test(text):
            bot.bop();
            bot.speak(getBopResponse());
            break;
        case /^[\/\.#!]add$/i.test(text):
            addDjQueue(data.userid);
            break;
        case /^[\/\.#!]rem$/i.test(text):
            remDjQueue(data.userid);
            break;
        case /^[\/\.#!]think$/i.test(text):
            bot.speak(getDeepThought());
            break;
        case /^[\/\.#!]skip$/i.test(text):
            if (isCurrentDJ) {
                bot.skip();
                bot.speak(getSkipResponse());
            }
            break;
    }
}

//--------------------------------------------------
// Helpers
//--------------------------------------------------

function stepDown(bot) {
    // If bots song is currently playing, let's have the bot step down when it ends
    if (isCurrentDJ) {
        stepDownAfterSong = true;
    } else {
        bot.remDj();
    }
}

function addDjQueue(djID) {
    if (DJ_QUEUE.indexOf(djID) === -1) {
        DJ_QUEUE.push(djID);
    }
}

function remDjQueue(djID) {
    if (DJ_QUEUE.indexOf(djID) > -1) {
        DJ_QUEUE.splice(DJ_QUEUE.indexOf(djID), 1);
    }
}

function getRulesText() {
    return 'Play whatever you want. ' +
            'Anything from Fort Minor to Foo Fighters, ' +
            'Daft Punk to Depeche Mode, ' +
            'Bob Marley to Bon Jovi.';
}

function getSkipResponse() {
    return getRandomItem([
        'Don\'t be hatin\'!',
        'Can\'t handle it huh?',
        'Why ya gotta be like that?'
    ]);
}

function getBopResponse() {
    return getRandomItem([
        'Bust a move!',
        'This is my jam!',
        'Drop it like it\'s hot!',
        'We\'re up all night \'til the sun!'
    ]);
}

function getDeepThought() {
    return getRandomItem(thoughts);
}

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

})();