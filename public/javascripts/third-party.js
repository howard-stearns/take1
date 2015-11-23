"use strict";
/*jslint browser: true, devel: true, vars: true, plusplus: true, forin: true */
var FBAPPID, FB;

/************************** FACEBOOK ************************************/
// startup initialization
window.fbAsyncInit = function () {
    var app = {
        appId: FBAPPID,
        //version    : 'v2.3', // Modern docs say do this. Is our old stuff ready?
        status: true, // check login status
        cookie: true, // enable cookies to allow the server to access the session
        xfbml: true  // parse XFBML
    };
    app.channelUrl = '//ki1r0y.com/channel.html';
    console.log('FB init', app);
    FB.init(app);
    // Callbacks for Like and Comment.
    FB.Event.subscribe('edge.create', function (targetUrl) {
        console.log('FIXME', 'facebook', 'like', targetUrl);
    });
    FB.Event.subscribe('edge.remove', function (targetUrl) {
        console.log('FIXME', 'facebook', 'unlike', targetUrl);
    });
};
// Load the Facebook SDK Asynchronously
(function (d, scriptTag, id) {
    var js, ref = d.getElementsByTagName(scriptTag)[0];
    if (d.getElementById(id)) { return; }
    js = d.createElement(scriptTag);
    js.id = id;
    js.async = true; // Maybe this is the default in modern versions?
    js.src = "//connect.facebook.net/en_US/all.js";
    //js.src = "//connect.facebook.net/en_US/sdk.js";  // Modern docs say to use this instead.
    ref.parentNode.insertBefore(js, ref);
}(document, 'script', 'facebook-jssdk'));
