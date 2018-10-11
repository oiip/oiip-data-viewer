/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import Immutable from "immutable";
import SearchUtil from "utils/SearchUtil";
import appConfig from "constants/appConfig";

export default class TrackDataUtil {
    static getUrlsForQuery(options) {
        return TrackDataUtil.getDecimationQuery(options);
        // return TrackDataUtil.getSolrQuery(options);
    }

    static getDecimationQuery(options) {
        let { selectedTracks, xAxis, yAxis, zAxis, target, bounds } = options;
        let baseUrl = appConfig.URLS.decimatorMiddleware;

        let keys =
            typeof zAxis !== "undefined"
                ? Immutable.List([xAxis, yAxis, zAxis])
                : Immutable.List([xAxis, yAxis]);
        return selectedTracks.map(track => {
            let query = [
                "format=json",
                "project=" + track.project,
                "source_id=" + track.source_id,
                "keys=" + keys.join(",")
            ];

            if (typeof target !== "undefined") {
                query.push("target=" + target);
            }

            if (typeof bounds !== "undefined" && bounds.length === 2) {
                query.push("bounds=" + bounds.join(","));
            }

            return encodeURI(baseUrl + "?" + query.join("&"));
        });
    }

    static getSolrQuery(options) {
        let { selectedTracks, xAxis, yAxis, zAxis } = options;
        let baseUrl = appConfig.URLS.solrBase;
        let query = [
            "facet=on",
            "wt=csv",
            "rows=3000000",
            "sort=measurement_date_time asc",
            "fl=measurement_date_time,depth,measurement_value"
        ];
        return selectedTracks.map(track => {
            return encodeURI(
                baseUrl +
                    "?" +
                    query
                        .concat([
                            "q=project:" +
                                track.project +
                                " AND source_id:" +
                                track.source_id +
                                " AND measurement_name:temperature"
                        ])
                        .join("&")
            );
        });
    }
}
