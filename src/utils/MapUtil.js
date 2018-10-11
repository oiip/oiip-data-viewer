/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import MapUtilCore from "_core/utils/MapUtil";
import MiscUtil from "utils/MiscUtil";

export default class MapUtil extends MapUtilCore {
    static extentsIntersect(extent1, extent2) {
        return (
            extent1[0] <= extent2[2] &&
            extent1[2] >= extent2[0] &&
            extent1[1] <= extent2[3] &&
            extent1[3] >= extent2[1]
        );
    }

    static formatLatLon(lat, lon, isValid, padChar = "&nbsp;") {
        let latUnit = lat >= 0 ? "°E" : "°W";
        let lonUnit = lon >= 0 ? "°N" : "°S";

        let currCoord =
            MiscUtil.padNumber(Math.abs(lon).toFixed(3), 5, padChar) +
            lonUnit +
            "," +
            MiscUtil.padNumber(Math.abs(lat).toFixed(3), 6, padChar) +
            latUnit;

        return isValid ? currCoord : " ------" + lonUnit + ", ------" + latUnit;
    }

    static findTileExtentsInView(extentsList, extent, zoom) {
        let tilesList = [];
        let entries = extentsList[zoom];

        if (zoom >= 0) {
            if (typeof entries === "object") {
                // search for zoom ids
                entries.map(entry => {
                    let bounds = entry.bounds.map(val => {
                        return parseFloat(val);
                    });
                    if (this.extentsIntersect(extent, bounds)) {
                        tilesList.push({
                            tileCoord: entry.tileId.split("/"),
                            extent: bounds
                        });
                    }
                });
            }

            // recurse if none found
            if (tilesList.length === 0) {
                return this.findTileExtentsInView(extentsList, extent, zoom - 1);
            }
        }

        return {
            tiles: tilesList,
            foundZoom: zoom
        };
    }

    // deconstrain a lineString arrow to wrap across the dateline if necessary
    // coords: [[x1,y1],[x2,y2],[x1,y1],[x3,y3],[x1,y1],[x4,y4]]
    static deconstrainLineStringArrow(coords) {
        let arrowTip = coords[0];
        let newCoords = coords.map((coord, i) => {
            if (i % 2 !== 0 && Math.abs(arrowTip[0]) > 150) {
                if (arrowTip[0] > 0) {
                    if (coord[0] < 0) {
                        coord[0] += 360;
                    }
                } else {
                    if (coord[0] > 0) {
                        coord[0] -= 360;
                    }
                }
            }
            return coord;
        });

        return newCoords;
    }

    static deconstrainLongitude(lon, preconstrain = true) {
        lon = preconstrain ? MapUtilCore.constrainCoordinates([lon, 0], false)[0] : lon;
        if (lon < 0) {
            return lon + 360;
        } else {
            return lon - 360;
        }
    }

    static constrainExtent(extent, limitY = true) {
        let ul = MapUtilCore.constrainCoordinates([extent[0], extent[3]], limitY);
        let br = MapUtilCore.constrainCoordinates([extent[2], extent[1]], limitY);
        return [ul[0], br[1], br[0], ul[1]];
    }
}
