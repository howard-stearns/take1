"use strict";
/*jslint node: true, nomen: true, vars: true */
var fs = require('fs');
var assert = require('assert');
var mocha = require('mocha'), describe = mocha.describe, before = mocha.before, after = mocha.after, it = mocha.it;
var shell = require('child_process');
var async = require('async');
var _ = require('underscore');
var _s = require('underscore.string');
var request = require('request');
var cheerio = require('cheerio');

describe('server', function () {
    var port = 3000, base = 'http://localhost:' + port, ourServer; // the server we should talk to
    var stats = {};
    function serverIsRunning() { // true if the server is listening
        return shell.spawnSync('curl', ['http://localhost:' + port]).status === 0;
    }
    function waitForChange(wantsRunning, cb) { // cb() only when serverIsRunning matches wantsRunning
        var loop = wantsRunning ? async.doUntil : async.doWhilst;
        loop(function (icb) {
            setTimeout(icb, 1000);
        }, serverIsRunning, cb);
    }
    // assertions
    function assertMime(res, optionalMime) { // Check mime type. Fancy 'application/json' if optionalMime ommitted.
        var contentType = res.headers['content-type'];
        if (optionalMime) { return assert.equal(contentType, optionalMime); }
        // The content-type standard is a bit vague. Charset is an optional addition to content-type, and json
        // spec says that application/json uses utf-8. So, do we have to specify charset?
        // In fact, express-static sets 'Content-Type: application/json' for json files (no charset),
        // while express Response.send sets 'Content-Type: application/json; charset=utf-8'.
        // Here we allow either, so that our tests are independent of such variation.
        var semiIndex = contentType.indexOf(';');
        if (semiIndex > -1) { contentType = contentType.slice(0, semiIndex); }
        assert.equal(contentType, 'application/json');
    }
    // reuseable tests
        // Define tests that get path multiple times, ensure mime type, and any optionalTests({response, body}),
    function page(path, optionalMime, optionalTests) {
        var data = {};
        it('get ' + path, function (done) {
            request({url: base + path}, function (error, res, bod) {
                assert.ifError(error);
                data.response = res;
                data.body = bod;
                assert.equal(data.response.statusCode, 200, data.response.statusMessage);
                assertMime(data.response, optionalMime);
                done();
            });
        });
        if (optionalTests) { optionalTests(data); }
        it('multiple get ' + path, function (done) {
            // This isn't a load test. It's a smoke test that path can be called a lot on the same machine without something going seriously wrong.
            var start = Date.now();
            var n = 100;
            var uri = base + path;
            this.timeout(10 * 1000);
            async.times(n, function (n, ncb) {
                _.noop(n);
                request(uri, ncb);
            }, function (e) {
                assert.ifError(e);
                var elapsed = Date.now() - start;
                stats[path] = (n * 1000) / elapsed;
                done();
            });
        });
    }

    // setup
    before(function (done) { // Start server if necessary
        this.timeout(10 * 1000);
        if (serverIsRunning()) { return done(); }
        console.log('Starting server.');
        // If we have to start our own server, we send its log to a file:
        // 1. We want to capture the output in case something goes wrong
        // 2. If we don't, the performance gets very very strange.
        var logStream = fs.createWriteStream('test.server.log');
        // Subtle. It turns out that logStream isn't immediately opened for writing, but spawn requires that it is open.
        // So the solution is to not spawn until the stream is truly open.
        logStream.on('open', function () {
            ourServer = shell.spawn('npm', ['start'], {stdio: ['pipe', logStream, logStream]});
            ourServer.on('exit', function (code) { if (code) { throw new Error("Server failed with code " + code + ". See test.server.log."); } });
            waitForChange(true, done);
        });
    });
    after(function (done) { // Shut down server if we started it
        console.log('Requests per second:'); // See comment for 'multiple get'.
        console.log(stats);
        this.timeout(5 * 1000);
        if (!ourServer) { return done(); }
        console.log('Stopping server.');
        shell.spawn('npm', ['stop']);
        waitForChange(false, done);
    });

    // Tests
    page('/favicon.ico', 'image/x-icon');
    page('/stylesheets/style.css', 'text/css; charset=UTF-8');
    page('/channel.html', 'text/html; charset=utf-8', function (data) {
        it('contains script', function (done) {
            var $ = cheerio.load(data.body);
            assert.equal($('script').attr('src'), '//connect.facebook.net/en_US/all.js');
            done();
        });
    });
    page('/images/test.jpg', 'image/jpeg'); // FIXME: upload and then delete
    page('/images/test2.jpg', 'image/jpeg'); // FIXME: upload and then delete    
    page('/', 'text/html; charset=utf-8', function (data) {
        it('is parseable as html', function (done) {
            data.$ = cheerio.load(data.body);
            assert.ok(data.$('head').is('head'));
            done();
        });
        it('has title', function () {
            assert.equal(data.$('title').text(), 'HighFidelity Content');
        });
        it('has items');
        it('items have img');
        it('items have domain');
        it('items have submitter');
        it('items have like');
        it('items have comments');
    });
    page('/snapshot/test', 'text/html; charset=utf-8', function (data) {
        it('is parseable as html', function (done) {
            data.$ = cheerio.load(data.body);
            assert.ok(data.$('head').is('head'));
            done();
        });
        it('has title', function () {
            assert.equal(data.$('title').text(), 'HighFidelity Content');
        });
        it('has fb:app_id');
        it('has og:url');
        it('has og:title');
        it('has og:image');
        it('has og:site_name');
        it('has og:description');
        it('has og:type');
        it('has article:section');
        it('has article:author');
        it('has article:published_time');
        it('has article:modified_time');
        it('has article:tag');
        it('has items');
        it('items have img');
        it('items have domain');
        it('items have submitter');
        it('items have like');
        it('items have comments');
    });
});
