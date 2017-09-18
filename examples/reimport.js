'use strict';

var MixpanelReimporter = require('../lib');

var apiSecret = process.env.MIXPANEL_API_SECRET;
var projectToken = process.env.MIXPANEL_PROJECT_TOKEN;

var mixpanelReimporter = new MixpanelReimporter(apiSecret, projectToken);

mixpanelReimporter.reimport({
  startDate: '2017-04-01',
  endDate: '2017-04-30',
  oldEvent: 'Registration',
  newEvent: 'Server - Registered User'
});
