'use strict';

var async = require('async');
var needle = require('needle');
var moment = require('moment');
var queryString = require('query-string');
var _ = require('lodash');


function MixpanelReimporter(apiSecret, projectToken) {

  this.apiSecret = apiSecret || env.MIXPANEL_API_SECRET;
  this.projectToken = projectToken || env.MIXPANEL_PROJECT_TOKEN;

  if (!this.apiSecret) {
    throw new Error('API Secret is required');
  }

  if (!this.projectToken) {
    throw new Error('Project Token is required');
  }

}

MixpanelReimporter.prototype.reimport = function(parameters) {

  var parameters = parameters || {};

  var oldEvent = parameters.oldEvent;
  if (!oldEvent) {
    throw new Error('Old Event is required');
  }

  var newEvent = parameters.newEvent;
  if (!newEvent) {
    throw new Error('New Event is required');
  }

  if (!parameters.startDate) {
    throw new Error('Start Date is required');
  }
  var startDate = moment(parameters.startDate);

  if (!parameters.endDate) {
    throw new Error('End Date is required');
  }
  var endDate = moment(parameters.endDate);

  if (startDate.isAfter(endDate)) {
    throw new Error('Start Date cannot be greater than End Date');
  }

  var params = {
    from_date: startDate.format('YYYY-MM-DD'),
    to_date: endDate.format('YYYY-MM-DD'),
    event: '["' + oldEvent + '"]'
  };

  var httpOptions = {
    username: this.apiSecret,
    password: '',
    parse: true,
    open_timeout: 0,
    read_timeout: 0
  };

  var exportUri = 'https://data.mixpanel.com/api/2.0/export?' + queryString.stringify(params);

  var projectToken = this.projectToken;

  needle('get', exportUri, null, httpOptions)
    .then(function(res) {
      var step1 = res.body.replace(new RegExp('\n', 'g'), ',');
      var step2 = '['+step1+']';
      var result = step2.replace(',]', ']');
      var exportEvents = JSON.parse(result);
      var importEvents = _(exportEvents)
        .map(function(e) {
          e.event = newEvent;
          e.properties.token = projectToken;
          return e;
        })
        .chunk(2)
        .value();

      var importUri = 'https://api.mixpanel.com/import?verbose=1';
      var calls = [];

      importEvents.forEach(function(events) {
        calls.push(function(callback) {
          var content = (new Buffer(JSON.stringify(events))).toString('base64');
          needle('post', importUri, { data: content }, httpOptions)
            .then(function(res2) {
              return callback(null, res2.body);
            })
            .catch(function(err2) {
              return callback(err2);
            });
        });
      });

      async.parallel(calls, function(err, result) {
        if (err)
          return console.log(err);
        console.log(result);
      });

    })
    .catch(function(err) {
      console.error(err);
    });

}

module.exports = MixpanelReimporter;
