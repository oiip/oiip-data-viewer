/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import Immutable from "immutable";
import moment from "moment";
import * as appStringsCore from "_core/constants/appStrings";
import MiscUtil from "utils/MiscUtil";
import appConfig from "constants/appConfig";

export default class SearchUtil {
    static searchForFacets(options) {
        return new Promise((resolve, reject) => {
            let { area, dateRange, facets } = options;

            let baseUrl = appConfig.URLS.solrBase;

            let sDateStr = moment.utc(dateRange[0]).unix();
            let eDateStr = moment.utc(dateRange[1]).unix();

            area = area.length === 4 ? area : [-180, -90, 180, 90];
            let bl = [area[1], area[0]].join(",");
            let ur = [area[3], area[2]].join(",");

            let query = [
                "q=datatype:track",
                "fq=lon_max:[" + area[0] + " TO *]",
                "fq=lon_min:[* TO " + area[2] + "]",
                "fq=lat_max:[" + area[1] + " TO *]",
                "fq=lat_min:[* TO " + area[3] + "]",
                "fq=start_date:[" + sDateStr + " TO *]",
                "fq=end_date:[* TO " + eDateStr + "]",
                "facet=on",
                "rows=0",
                "wt=json"
            ];

            // add facet queries
            let keys = Object.keys(facets);
            for (let i = 0; i < keys.length; ++i) {
                let key = keys[i];
                if (facets[key].length > 0) {
                    query.push(
                        "fq=" + key + ":(" + facets[key].map(x => '"' + x + '"').join(" OR ") + ")"
                    );
                }
            }

            // add configured faceting
            let configFacets = appConfig.LAYER_SEARCH.FACETS;
            for (let i = 0; i < configFacets.length; ++i) {
                query.push("facet.field=" + configFacets[i].value);
            }

            let url = encodeURI(baseUrl + "?" + query.join("&"));

            MiscUtil.asyncFetch({
                url: url,
                handleAs: appStringsCore.FILE_TYPE_JSON
            }).then(
                data => {
                    let results = SearchUtil.processFacetResults([data]);
                    resolve(results);
                },
                err => {
                    reject(err);
                }
            );
        });
    }
    static searchForTracks(options) {
        return new Promise((resolve, reject) => {
            let { area, dateRange, facets } = options;

            let baseUrl = appConfig.URLS.solrBase;

            let sDateStr = moment.utc(dateRange[0]).unix();
            let eDateStr = moment.utc(dateRange[1]).unix();

            area = area.length === 4 ? area : [-180, -90, 180, 90];
            let bl = [area[1], area[0]].join(",");
            let ur = [area[3], area[2]].join(",");

            let query = [
                "q=datatype:track",
                "fq=lon_max:[" + area[0] + " TO *]",
                "fq=lon_min:[* TO " + area[2] + "]",
                "fq=lat_max:[" + area[1] + " TO *]",
                "fq=lat_min:[* TO " + area[3] + "]",
                "fq=start_date:[" + sDateStr + " TO *]",
                "fq=end_date:[* TO " + eDateStr + "]",
                "rows=1000",
                "wt=json"
            ];

            // add facet queries
            let keys = Object.keys(facets);
            for (let i = 0; i < keys.length; ++i) {
                let key = keys[i];
                if (facets[key].length > 0) {
                    query.push(
                        "fq=" + key + ":(" + facets[key].map(x => '"' + x + '"').join(" OR ") + ")"
                    );
                }
            }

            let url = encodeURI(baseUrl + "?" + query.join("&"));

            MiscUtil.asyncFetch({
                url: url,
                handleAs: appStringsCore.FILE_TYPE_JSON
            }).then(
                data => {
                    let results = SearchUtil.processLayerSearchResults([data]);
                    resolve(results);
                },
                err => {
                    reject(err);
                }
            );
        });
    }

    static processFacetResults(data) {
        let retFacets = {};
        try {
            if (data.length > 0) {
                let fields = data[0].facet_counts.facet_fields;
                let facets = appConfig.LAYER_SEARCH.FACETS;
                for (let i = 0; i < facets.length; ++i) {
                    let facet = facets[i].value;
                    let values = fields[facet];
                    retFacets[facet] = values.reduce((acc, valueStr, i) => {
                        if (i % 2 === 0) {
                            acc.push({ label: valueStr, value: valueStr, cnt: values[i + 1] });
                        }
                        return acc;
                    }, []);
                }
            }
            return Immutable.fromJS(retFacets);
        } catch (err) {
            console.warn("Error in SearchUtil.processFacetResults: ", err);
            return Immutable.fromJS(retFacets);
        }
    }

    static processLayerSearchResults(data) {
        return data.reduce((results, dataSet) => {
            let entries = dataSet.response.docs;
            for (let i = 0; i < entries.length; ++i) {
                let entry = Immutable.fromJS(entries[i]);
                let formattedTrack = Immutable.Map({
                    id: entry.get("id") || entry.get("project") + "_" + entry.get("source_id"),
                    title: entry.get("title") || entry.get("platform") || entry.get("id"),
                    insituMeta: entry.set(
                        "variables",
                        SearchUtil.readVariables(
                            entry.get("variables"),
                            entry.get("variables_units"),
                            true
                        )
                    )
                });
                results.push(Immutable.fromJS(formattedTrack));
            }
            return results;
        }, []);
    }

    static readVariables(varList, unitsList, addMissing = false) {
        // hack: add in known variables
        if (addMissing) {
            if (!varList.contains("time")) {
                varList = varList.push("time");
                unitsList = unitsList.push("");
            }
            if (!varList.contains("depth")) {
                varList = varList.push("depth");
                unitsList = unitsList.push("dbar");
            }
        }

        return varList.reduce((acc, varStr, i) => {
            return acc.add(
                Immutable.Map({
                    label: varStr,
                    units: unitsList.get(i) || ""
                })
            );
        }, Immutable.Set());
    }
}
