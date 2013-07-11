#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

+ commander.js
   - https://github.com/visionmedia/commander.js
   - http://visionmedia.github.io/commander.js

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
 */

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var check = require('validator').check;
var restler = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1);    // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertValidURL = function(url) {
    try {
        check(url).isUrl();
    } catch (e) {
        console.log("%s is not a valid URL. Exiting.", url);
        process.exit(1);
    }
    return url;
};

var cheerioHtmlString = function(htmlstring) {
    return cheerio.load(htmlstring);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtml = function(htmlstring, checksfile) {
    $ = cheerioHtmlString(htmlstring);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return JSON.stringify(out, null, 4);
};

var checkHtmlFile = function(htmlfile, checksfile) {
    fs.readFile(htmlfile, function(err, data) {
        if (err) {
            console.log("Could not read %s. Exiting.", htmlfile);
            process.exit(1);
        } else {
            var outJson = checkHtml(data, checksfile);
            console.log(outJson);
        }
    });
};

var checkHtmlURL = function(htmlurl, checksfile) {
    restler.get(program.url).on('complete', function(result) {
        if (result instanceof Error) {
            console.log("Could not download %s. Exiting.", program.url);
            process.exit(1);
        } else {
            var outJson = checkHtml(result, checksfile);
            console.log(outJson);
        }
    });
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file [html_file]', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url [url]', 'URL to examine', clone(assertValidURL), URL_DEFAULT)
        .parse(process.argv);

    if(program.url.length > 0) {
        checkHtmlURL(program.url, program.checks);
    } else {
        checkHtmlFile(program.file, program.checks);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
