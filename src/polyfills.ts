// Polyfills
// (these modules are what are in 'angular2/bundles/angular2-polyfills' so don't use that here)

// import 'ie-shim'; // Internet Explorer
// import 'es6-shim';
// import 'es6-promise';
// import 'es7-reflect-metadata';

// Prefer CoreJS over the polyfills above
import 'core-js/es6';
import 'core-js/es7/reflect';
require('zone.js/dist/zone');

// Typescript emit helpers polyfill
import 'ts-helpers';

import 'intl';
import 'intl/locale-data/jsonp/en';

import 'web-animations-js/web-animations.min';

// if ('production' === ENV) {
  // Production
// } else {
  // Development
  (Error as any).stackTraceLimit = Infinity;

  require('zone.js/dist/long-stack-trace-zone');
// }
