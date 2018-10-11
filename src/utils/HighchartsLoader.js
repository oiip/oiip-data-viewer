/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import Highcharts from "highcharts";

require("highcharts/modules/data")(Highcharts);
require("highcharts/modules/heatmap")(Highcharts);
require("highcharts/highcharts-more")(Highcharts);
require("highcharts/modules/exporting")(Highcharts);
require("highcharts/modules/annotations")(Highcharts);
require("highcharts/modules/offline-exporting")(Highcharts);
require("assets/highcharts/boost.custom")(Highcharts);

export default Highcharts;
