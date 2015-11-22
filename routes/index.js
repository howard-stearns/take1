"use strict";
/*jslint node: true, nomen: true*/
var _ = require('underscore');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    _.noop(req, next);
    res.render('index', { });
});

module.exports = router;
