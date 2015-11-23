"use strict";
/*jslint node: true, vars: true, nomen: true*/
var fs = require('fs');
var path = require('path');
var url = require('url');
var _ = require('underscore');
var async = require('async');
var express = require('express');
var router = express.Router();

var likeOrder = [
    "test", "test2"
];
var snaps = {
    test: {
        "submitter": "howard.stearns",
        "image": "test.jpg",
        "location": "hifi:sandbox/42,29,515",
        "timestamp": 1448162432000
    },
    test2: {
        "submitter": "howard.stearns",
        "image": "test2.jpg",
        "location": "hifi:howard/514,500,497",
        "timestamp": 1448219630000
    }        
};
function getSnapshot(id, cb) {
    var snapshot = snaps[id];
    setImmediate(function () {
        if (snapshot) { snapshot.id = id; }
        cb(!snapshot && {status: 404}, snapshot);
    });
}

function getByLikes(start, count, cb) {
    async.map(likeOrder, getSnapshot, cb);
}

function completeSnapshot(snapshot) {
    var parsedUrl = url.parse(snapshot.location);
    snapshot.domainName = parsedUrl.host;
    snapshot.url = 'http://www.ki1r0y.com/snapshot/' + snapshot.id; // fb:comments requires full url
    return snapshot;
}

// See http://developers.facebook.com/docs/reference/javascript
router.get('/channel.html', function (req, res) {
    res.header({Pragma: 'public',
                'Cache-Control': 'max-age="' + req.app.locals.oneYearSeconds + '"',
                Expires: new Date(Date.now() + req.app.locals.oneYearMs).toUTCString()});
    res.send('<script src="//connect.facebook.net/en_US/all.js"></script>');
});

router.get('/', function (req, res, next) {
    _.noop(req);
    getByLikes(0, null, function (error, snapshotItems) {
        if (error) { return next(error); }
        res.render('index', {snapshotItems: snapshotItems.map(completeSnapshot)});
    });
});

router.get('/snapshot/:id', function (req, res, next) {
    getSnapshot(req.params.id, function (error, snapshot) {
        if (error) { return next(error); }
        getByLikes(0, null, function (error, snapshotItems) {
            if (error) { return next(error); }
            snapshot = completeSnapshot(snapshot);
            // Stuff needed for open graph metadata, that might someday be in the snapshot itself:
            snapshot.title = snapshot.domainName + " content";
            snapshot.description = "Captured in HighFidelity VR by " + snapshot.submitter + ".";
            snapshot.thumbnailUrl = '/images/' + snapshot.image;
            snapshot.created = snapshot.timestamp;
            // Stuff that we might change in the future to be different for different snapshots:
            snapshot.nametags = ['HighFidelity', 'VR', 'virtual reality'];
            res.render('take1', {
                snapshot: snapshot,
                excludedId: snapshot.id,
                snapshotItems: snapshotItems.map(completeSnapshot),
                // Open graph stuff not likely to ever be within the snapshot item itself:
                expires: new Date(snapshot.timestamp + req.app.locals.oneYearMs).getTime(),
                // Stuff that is true for all instances of this route:
                ogSection: 'User Content'
            });
        });
    });
});


module.exports = router;
