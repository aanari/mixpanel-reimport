'use strict';

var MixpanelReimporter = require('./MixpanelReimporter');

var initializer = function(apiSecret, projectToken) {
  return new MixpanelReimporter(apiSecret, projectToken);
};

initializer.MixpanelReimporter = MixpanelReimporter;

module.exports = initializer;
