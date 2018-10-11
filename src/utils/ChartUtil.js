/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import Immutable from "immutable";
import Highcharts from "utils/HighchartsLoader";
import moment from "moment";
import * as appStrings from "constants/appStrings";
import appConfig from "constants/appConfig";

let nodeChartMap = Immutable.Map();

export default class ChartUtil {
    static plotData(options) {
        switch (options.chartType) {
            case appStrings.CHART_TYPES.SINGLE_SERIES:
                return this.plotSingleSeries(options);
            case appStrings.CHART_TYPES.SINGLE_SERIES_WITH_COLOR:
                return this.plotSingleSeriesWithColor(options);
            case appStrings.CHART_TYPES.MULTI_SERIES:
                return this.plotMultiSeries(options);
            case appStrings.CHART_TYPES.MULTI_SERIES_WITH_COLOR:
                return this.plotMultiSeriesWithColor(options);
            default:
                return false;
        }
    }

    static updateData(options) {
        switch (options.chartType) {
            case appStrings.CHART_TYPES.SINGLE_SERIES:
                return this.updateSingleSeries(options);
            case appStrings.CHART_TYPES.SINGLE_SERIES_WITH_COLOR:
                return this.updateSingleSeriesWithColor(options);
            case appStrings.CHART_TYPES.MULTI_SERIES:
                return this.updateMultiSeries(options);
            case appStrings.CHART_TYPES.MULTI_SERIES_WITH_COLOR:
                return this.updateMultiSeriesWithColor(options);
            default:
                return false;
        }
    }

    static setAxisBounds(node, axisStr, bounds) {
        if (
            typeof node !== "undefined" &&
            typeof axisStr !== "undefined" &&
            typeof bounds !== "undefined"
        ) {
            let chart = nodeChartMap.get(node.id);
            if (typeof chart !== "undefined") {
                let axis = chart[axisStr];
                if (typeof axis !== "undefined") {
                    axis = axis[0];
                    axis.setExtremes(bounds[0], bounds[1], true, false, {
                        userMin: bounds[0],
                        userMax: bounds[1]
                    });
                    chart.showResetZoom();
                }
            }
        }
    }

    static setZoomEnabled(node, zoomEnabled) {
        if (typeof node !== "undefined") {
            let chart = nodeChartMap.get(node.id);
            if (typeof chart !== "undefined") {
                if (zoomEnabled) {
                    chart.options.chart.zoomType = "x";
                } else {
                    chart.options.chart.zoomType = "";
                }
            }
        }
    }

    static setDateIndicator(options) {
        let node = options.node;
        let date = options.date;
        let intervalDate = options.intervalDate;

        if (typeof node !== "undefined" && typeof date !== "undefined") {
            let chart = nodeChartMap.get(node.id);
            if (typeof chart !== "undefined") {
                let xAxis = chart.xAxis[0];
                if (xAxis.options.type === "datetime") {
                    let x = xAxis.toPixels(date, true);
                    let x2 = xAxis.toPixels(intervalDate, true);
                    let newIndicator = ChartUtil.getDateIndicatorOptions(chart);

                    // start line
                    newIndicator.shapes[0].points = newIndicator.shapes[0].points.map(p => {
                        p.x = x;
                        return p;
                    });

                    // end line
                    newIndicator.shapes[1].points = newIndicator.shapes[1].points.map(p => {
                        p.x = x2;
                        return p;
                    });

                    // mid line top
                    newIndicator.shapes[2].points[0].x = x;
                    newIndicator.shapes[2].points[1].x = x2;

                    // mid line bottom
                    newIndicator.shapes[3].points[0].x = x;
                    newIndicator.shapes[3].points[1].x = x2;

                    newIndicator.visible = true;

                    chart.removeAnnotation("date-indicator");
                    chart.addAnnotation(newIndicator);
                }
            }
        }
    }

    static updateSingleSeries(options) {
        return this.updateSeries(options);
    }

    static updateMultiSeries(options) {
        return this.updateSeries(options);
    }

    static updateSeries(options) {
        let node = options.node;
        let data = options.data;
        let displayOptions = options.displayOptions;
        let extremes = options.dataExtremes;
        let note = options.note;

        // check if we have data a place to render to
        if (typeof node !== "undefined") {
            let chart = nodeChartMap.get(node.id);
            if (typeof chart !== "undefined" && typeof data !== "undefined") {
                // update the yaxis direction/bounds
                if (typeof extremes !== "undefined") {
                    let yaxis = chart.axes.reduce((acc, a) => {
                        // left side of plot
                        if (a.side === 3) {
                            return a;
                        }
                        return acc;
                    }, undefined);
                    if (typeof yaxis !== "undefined") {
                        let range = extremes.y.max - extremes.y.min;
                        let scale = range * 0.1;

                        yaxis.update(
                            {
                                min: extremes.y.min - scale,
                                max: extremes.y.max + scale,
                                reversed: displayOptions.get("yAxisReversed")
                            },
                            false
                        );
                    }
                }

                // update the chart note
                if (typeof note !== "undefined") {
                    chart.subtitle.update({ text: note });
                }

                // update each series
                chart.series.map((series, i) => {
                    series.update(
                        {
                            type: displayOptions.get("markerType") || series.options.type,
                            color: series.options.color,
                            showInLegend: series.options.showInLegend,
                            data: data[i]
                        },
                        false
                    );
                });

                chart.redraw();

                return true;
            }
            return false;
        } else {
            console.warn("Error in ChartUtil.updateSeries: Missing chart options", options);
            return false;
        }
    }

    static updateSingleSeriesWithColor(options) {
        if (this.updateSeriesWithColor(options)) {
            return this.updateSingleSeries(options);
        }
        return false;
    }

    static updateMultiSeriesWithColor(options) {
        if (this.updateSeriesWithColor(options)) {
            return this.updateMultiSeries(options);
        }
        return false;
    }

    static updateSeriesWithColor(options, redraw = false) {
        let node = options.node;
        let extremes = options.dataExtremes;

        if (typeof node !== "undefined") {
            let chart = nodeChartMap.get(node.id);
            if (typeof chart !== "undefined") {
                if (typeof extremes !== "undefined") {
                    let caxis = chart.axes.reduce((acc, a) => {
                        if (a instanceof Highcharts.ColorAxis) {
                            return a;
                        }
                        return acc;
                    }, undefined);
                    if (typeof caxis !== "undefined") {
                        caxis.setExtremes(extremes.z.min, extremes.z.max, redraw);
                    }
                }
            }
            return true;
        } else {
            console.warn(
                "Error in ChartUtil.updateSeriesWithColor: Missing chart options",
                options
            );
            return false;
        }
    }

    static plotSingleSeries(options) {
        try {
            let node = options.node;
            let data = options.data;
            let displayOptions = options.displayOptions;
            let seriesNum = options.seriesNum || 0;
            let seriesTitles = options.seriesTitles || [];

            let hoveredPoint = undefined;

            // check if we have data a place to render to
            if (typeof node !== "undefined" && typeof data !== "undefined") {
                let chartConfig = this.getBaseChartConfig(options);

                chartConfig.chart.events = {
                    click: function(e) {
                        if (typeof options.onClick === "function") {
                            options.onClick(hoveredPoint);
                        }
                    }
                };

                chartConfig.series = [];
                for (let i = 0; i < seriesNum; ++i) {
                    chartConfig.series.push({
                        name: seriesTitles[i],
                        type: displayOptions.get("markerType") || "scatter",
                        color: appConfig.CHART_SERIES_COLORS[i],
                        showInLegend: false,
                        data: data[i],
                        point: {
                            events: {
                                mouseOver: function(e) {
                                    hoveredPoint = e.target;
                                }
                            }
                        }
                    });
                }

                let chart = Highcharts.chart(options.node, chartConfig);
                nodeChartMap = nodeChartMap.set(options.node.id, chart);
                return true;
            } else {
                console.warn("Error in ChartUtil.plotSingleSeries: Missing chart options", options);
                return false;
            }
        } catch (err) {
            console.warn("Error in ChartUtil.plotSingleSeries: ", err);
            return false;
        }
    }

    static plotSingleSeriesWithColor(options) {
        try {
            let node = options.node;
            let data = options.data;
            let dataExtremes = options.dataExtremes || { z: {} };
            let keys = options.keys;
            let displayOptions = options.displayOptions;
            let seriesNum = options.seriesNum || 0;
            let seriesTitles = options.seriesTitles || [];

            let hoveredPoint = undefined;

            // check if we have data a place to render to
            if (typeof node !== "undefined" && typeof data !== "undefined") {
                let chartConfig = this.getBaseChartConfig(options);

                chartConfig.chart.marginRight = 90;
                chartConfig.chart.events = {
                    click: function(e) {
                        if (typeof options.onClick === "function") {
                            options.onClick(hoveredPoint);
                        }
                    }
                };

                chartConfig.yAxis.push({
                    id: "z-axis-label",
                    gridLineWidth: 0,
                    opposite: true,
                    tickLength: 0,
                    title: {
                        text: keys.zLabel || keys.zKey,
                        rotation: -90,
                        margin: 30,
                        style: {
                            fontSize: "1.4rem"
                        }
                    },
                    labels: {
                        enabled: false
                    }
                });

                chartConfig.colorAxis = {
                    id: "z-axis",
                    reversed: false,
                    min: dataExtremes.z.min,
                    max: dataExtremes.z.max,
                    stops: [
                        [0, appConfig.CHART_COLORBAR_COLORS[0]],
                        [0.1, appConfig.CHART_COLORBAR_COLORS[0]],
                        [0.5, appConfig.CHART_COLORBAR_COLORS[1]],
                        [0.9, appConfig.CHART_COLORBAR_COLORS[2]],
                        [1, appConfig.CHART_COLORBAR_COLORS[2]]
                    ],
                    title: {
                        text: keys.zLabel || keys.zKey,
                        style: {
                            fontSize: "1.4rem"
                        }
                    },
                    labels: {
                        x: 2
                    }
                };

                chartConfig.legend = {
                    enabled: true,
                    layout: "vertical",
                    align: "right",
                    verticalAlign: "middle",
                    x: 15
                };

                chartConfig.series = [];
                for (let i = 0; i < seriesNum; ++i) {
                    chartConfig.series.push({
                        name: seriesTitles[i],
                        type: displayOptions.get("markerType") || "scatter",
                        color: appConfig.CHART_SERIES_COLORS[i],
                        showInLegend: false,
                        data: data[i],
                        point: {
                            events: {
                                mouseOver: function(e) {
                                    hoveredPoint = e.target;
                                }
                            }
                        }
                    });
                }

                let chart = Highcharts.chart(options.node, chartConfig);
                nodeChartMap = nodeChartMap.set(options.node.id, chart);
                return true;
            } else {
                console.warn(
                    "Error in ChartUtil.plotSingleSeriesWithColor: Missing chart options",
                    options
                );
                return false;
            }
        } catch (err) {
            console.warn("Error in ChartUtil.plotSingleSeriesWithColor: ", err);
            return false;
        }
    }

    static plotMultiSeries(options) {
        try {
            let node = options.node;
            let data = options.data;
            let displayOptions = options.displayOptions;
            let seriesNum = options.seriesNum || 0;
            let seriesTitles = options.seriesTitles || [];

            let hoveredPoint = undefined;

            // check if we have data a place to render to
            if (typeof node !== "undefined" && typeof data !== "undefined") {
                let chartConfig = this.getBaseChartConfig(options);

                chartConfig.chart.events = {
                    click: function(e) {
                        if (typeof options.onClick === "function") {
                            options.onClick(hoveredPoint);
                        }
                    }
                };

                chartConfig.title.text = "";

                chartConfig.legend = {
                    enabled: true,
                    floating: true,
                    align: "left",
                    layout: "vertical",
                    verticalAlign: "top",
                    y: -8,
                    x: -12,
                    labelFormatter: function() {
                        return (
                            "<span style='font-size:1.4rem;font-weight:500;'>" +
                            this.name +
                            "</span>"
                        );
                    },
                    useHTML: true
                };

                chartConfig.series = [];
                for (let i = 0; i < seriesNum; ++i) {
                    chartConfig.series.push({
                        name: seriesTitles[i],
                        type: displayOptions.get("markerType") || "scatter",
                        color: appConfig.CHART_SERIES_COLORS[i],
                        showInLegend: true,
                        data: data[i],
                        point: {
                            events: {
                                mouseOver: function(e) {
                                    hoveredPoint = e.target;
                                }
                            }
                        }
                    });
                }

                let chart = Highcharts.chart(options.node, chartConfig);
                nodeChartMap = nodeChartMap.set(options.node.id, chart);
                return true;
            } else {
                console.warn("Error in ChartUtil.plotMultiSeries: Missing chart options", options);
                return false;
            }
        } catch (err) {
            console.warn("Error in ChartUtil.plotMultiSeries: ", err);
            return false;
        }
    }

    static plotMultiSeriesWithColor(options) {
        try {
            let node = options.node;
            let data = options.data;
            let dataExtremes = options.dataExtremes || { z: {} };
            let keys = options.keys;
            let displayOptions = options.displayOptions;
            let seriesNum = options.seriesNum || 0;
            let seriesTitles = options.seriesTitles || [];

            let hoveredPoint = undefined;

            // check if we have data a place to render to
            if (typeof node !== "undefined" && typeof data !== "undefined") {
                let chartConfig = this.getBaseChartConfig(options);

                chartConfig.chart.marginRight = 90;
                chartConfig.chart.events = {
                    click: function(e) {
                        if (typeof options.onClick === "function") {
                            options.onClick(hoveredPoint);
                        }
                    }
                };

                chartConfig.yAxis.push({
                    id: "z-axis-label",
                    gridLineWidth: 0,
                    opposite: true,
                    tickLength: 0,
                    title: {
                        text: keys.zLabel || keys.zKey,
                        rotation: -90,
                        margin: 30,
                        style: {
                            fontSize: "1.4rem"
                        }
                    },
                    labels: {
                        enabled: false
                    }
                });

                chartConfig.colorAxis = {
                    id: "z-axis",
                    reversed: false,
                    min: dataExtremes.z.min,
                    max: dataExtremes.z.max,
                    stops: [
                        [0, appConfig.CHART_COLORBAR_COLORS[0]],
                        [0.1, appConfig.CHART_COLORBAR_COLORS[0]],
                        [0.5, appConfig.CHART_COLORBAR_COLORS[1]],
                        [0.9, appConfig.CHART_COLORBAR_COLORS[2]],
                        [1, appConfig.CHART_COLORBAR_COLORS[2]]
                    ],
                    title: {
                        text: keys.zLabel || keys.zKey,
                        style: {
                            fontSize: "1.4rem"
                        }
                    },
                    labels: {
                        x: 2
                    }
                };

                chartConfig.legend = {
                    enabled: true,
                    layout: "vertical",
                    align: "right",
                    verticalAlign: "middle",
                    x: 15
                };
                // chartConfig.legend = {
                //     enabled: true,
                //     floating: true,
                //     layout: "horizontal",
                //     align: "left",
                //     verticalAlign: "top",
                // };

                chartConfig.series = [];
                for (let i = 0; i < seriesNum; ++i) {
                    chartConfig.series.push({
                        name: seriesTitles[i],
                        type: displayOptions.get("markerType") || "scatter",
                        color: appConfig.CHART_SERIES_COLORS[i],
                        showInLegend: false,
                        data: data[i],
                        point: {
                            events: {
                                mouseOver: function(e) {
                                    hoveredPoint = e.target;
                                }
                            }
                        }
                    });
                }

                let chart = Highcharts.chart(options.node, chartConfig);
                nodeChartMap = nodeChartMap.set(options.node.id, chart);
                return true;
            } else {
                console.warn(
                    "Error in ChartUtil.plotMultiSeriesWithColor: Missing chart options",
                    options
                );
                return false;
            }
        } catch (err) {
            console.warn("Error in ChartUtil.plotMultiSeriesWithColor: ", err);
            return false;
        }
    }

    static getBaseChartConfig(options) {
        let data = options.data;
        let keys = options.keys;
        let displayOptions = options.displayOptions;
        let onZoom = options.onZoom;
        let seriesTitles = options.seriesTitles || [];
        let title = options.title || seriesTitles.join("<br>") || "Untitled";
        let note = options.note || "";
        let width = options.width || appConfig.CHART_WIDTH;
        let height = options.height || appConfig.CHART_HEIGHT;

        let numVars = typeof keys.zKey === "undefined" ? 2 : 3;

        return {
            chart: {
                zoomType: "x",
                animation: false,
                width: width,
                height: height,
                spacingBottom: 10,
                marginTop: 16 * (seriesTitles.length + 1) + 20,
                style: {
                    fontFamily: "'Roboto', Helvetica, Arial, sans-serif"
                },
                resetZoomButton: {
                    relativeTo: "chart",
                    position: {
                        align: "left",
                        verticalAlign: "bottom",
                        x: 10,
                        y: -30
                    },
                    theme: {
                        style: {
                            fontSize: "1.2rem",
                            fontWeight: 500,
                            textTransform: "uppercase"
                        }
                    }
                }
            },

            annotations: [ChartUtil.getDateIndicatorOptions()],

            boost: {
                seriesThreshold: 1 // always use boost for consistency
            },

            xAxis: {
                id: "x-axis",
                type: keys.xKey.indexOf("time") !== -1 ? "datetime" : undefined,
                gridLineWidth: 1,
                lineWidth: 2,
                title: {
                    text: keys.xLabel || keys.xKey,
                    style: {
                        fontSize: "1.4rem"
                    }
                },
                dateTimeLabelFormats: {
                    millisecond: "%H:%M:%S.%L",
                    second: "%H:%M:%S",
                    minute: "%H:%M",
                    hour: "%H:%M",
                    day: "%b %e",
                    week: "%b %e",
                    month: "%b, %Y",
                    year: "%Y"
                },
                labels: {
                    style: {
                        textAlign: "center"
                    },
                    formatter: this.getTickFormatter(keys.xKey.indexOf("time") !== -1)
                },
                events: {
                    afterSetExtremes: zoomEvent => {
                        if (zoomEvent.type === "setExtremes") {
                            if (
                                typeof zoomEvent.userMin === "undefined" &&
                                typeof zoomEvent.userMax === "undefined"
                            ) {
                                onZoom();
                            } else {
                                onZoom([zoomEvent.userMin, zoomEvent.userMax]);
                            }
                        }
                    }
                }
            },

            yAxis: [
                {
                    id: "y-axis",
                    minPadding: 0,
                    maxPadding: 0,
                    reversed: displayOptions.get("yAxisReversed"),
                    startOnTick: false,
                    endOnTick: false,
                    tickPixelInterval: 50,
                    lineWidth: 2,
                    title: {
                        text: keys.yLabel || keys.yKey,
                        style: {
                            fontSize: "1.4rem"
                        }
                    },
                    labels: {
                        x: -4
                    }
                }
            ],

            title: {
                text: title,
                align: "left",
                useHTML: true,
                y: 18,
                style: {
                    fontSize: "1.4rem",
                    fontWeight: "500"
                }
            },

            subtitle: {
                text: note,
                align: "right",
                verticalAlign: "bottom",
                y: 0,
                x: -10,
                style: {
                    fontSize: "1.2rem",
                    fontWeight: "300",
                    fontStyle: "italic"
                }
            },

            credits: {
                enabled: false
            },

            legend: {
                enabled: false
            },

            exporting: {
                buttons: {
                    contextButton: {
                        enabled: false
                    }
                }
            },

            plotOptions: {
                series: {
                    findNearestPointBy: "xy",
                    marker: {
                        radius: 3,
                        symbol: "circle"
                    },
                    lineWidth: 3
                }
            },

            tooltip: {
                crosshairs: false,
                followPointer: false,
                shadow: false,
                animation: false,
                hideDelay: 0,
                shared: false,
                shape: "none",
                borderRadius: 2,
                padding: 0,
                backgroundColor: "rgba(247,247,247,0)",
                borderWidth: 0,
                positioner: function(labelWidth, labelHeight, point) {
                    return {
                        x: 6,
                        y: 16 * seriesTitles.length + 6
                    };
                    // return {
                    //     x: this.chart.plotLeft + 1,
                    //     y: this.chart.plotTop + this.chart.plotHeight - 16 * numVars - 8
                    // };
                },
                style: {
                    fontSize: "1.2rem"
                },
                useHTML: true,
                formatter: this.getTooltipFormatter(keys)
            }
        };
    }

    static clearPlot(node) {
        if (typeof nodeChartMap.get(node.id) !== "undefined") {
            nodeChartMap.get(node.id).destroy();
            nodeChartMap = nodeChartMap.delete(node.id);
        } else {
            console.warn(
                "Error in ChartUtil.clearPlot: could not find matching chart for node",
                node
            );
        }
    }

    static downloadChartAsImage(node, options) {
        if (typeof nodeChartMap.get(node.id) !== "undefined") {
            let chart = nodeChartMap.get(node.id);
            chart.exportChartLocal({
                filename: options.filename,
                type: options.format,
                width: options.width,
                sourceWidth: appConfig.CHART_WIDTH,
                sourceHeight: appConfig.CHART_HEIGHT
            });
        } else {
            console.warn(
                "Error in ChartUtil.downloadChartAsImage: could not find matching chart for node",
                node
            );
        }
    }

    static getTooltipFormatter(keys) {
        return function() {
            if (typeof this.point !== "undefined") {
                let point = this.point;
                let x = point.x;
                let y = point.y;
                let z = point.value;

                let zText =
                    typeof keys.zKey !== "undefined"
                        ? "<div class='tooltip-table-row'>" +
                          "<span class='tooltip-key'>" +
                          keys.zKey +
                          ": </span>" +
                          "<span class='tooltip-value'>" +
                          parseFloat(parseFloat(z).toFixed(4)) +
                          "</span>" +
                          "</div>"
                        : "";
                return (
                    "<div class='tooltip-table'>" +
                    "<div class='tooltip-table-row'>" +
                    "<span class='tooltip-key'>" +
                    keys.xKey +
                    ": </span>" +
                    "<span class='tooltip-value'>" +
                    (keys.xKey.indexOf("time") !== -1
                        ? moment.utc(x).format("MMM DD, YYYY · HH:mm")
                        : parseFloat(parseFloat(x).toFixed(4))) +
                    "</span>" +
                    "</div>" +
                    "<div class='tooltip-table-row'>" +
                    "<span class='tooltip-key'>" +
                    keys.yKey +
                    ": </span>" +
                    "<span class='tooltip-value'>" +
                    parseFloat(parseFloat(y).toFixed(4)) +
                    "</span>" +
                    "</div>" +
                    zText +
                    "</div>"
                );
            }
        };
    }

    static getTickFormatter(isTimeAxis = false) {
        return function() {
            if (this.isFirst && isTimeAxis) {
                let timeDiff = this.axis.paddedTicks[1] - this.axis.paddedTicks[0];
                if (timeDiff >= 1.577e10) {
                    // 6 months
                    this.dateTimeLabelFormat = "%b, %Y";
                } else if (timeDiff >= 7.884e9) {
                    // 3 months
                    this.dateTimeLabelFormat = "%b, %Y";
                } else if (timeDiff >= 2.628e9) {
                    // 1 months
                    this.dateTimeLabelFormat = "%b, %Y";
                } else if (timeDiff >= 6.048e8) {
                    // 1 week
                    this.dateTimeLabelFormat = "%b %e<br>%Y";
                } else if (timeDiff >= 8.64e7) {
                    // 1 day
                    this.dateTimeLabelFormat = "%b %e<br>%Y";
                } else {
                    this.dateTimeLabelFormat = "%H:%M<br>%b %e, %Y";
                }
            }
            return this.axis.defaultLabelFormatter.call(this);
        };
    }

    static getDateIndicatorOptions(chart) {
        let lPoint = { x: 0, y: 0 };
        let startLine = [{ x: 0, y: 0 }, { x: 0, y: 250 }];
        let midLineTop = [{ x: 0, y: 1 }, { x: 0, y: 1 }];
        let midLineBottom = [{ x: 0, y: 250 }, { x: 0, y: 250 }];
        let endLine = [{ x: 0, y: 0 }, { x: 0, y: 250 }];
        if (typeof chart !== "undefined") {
            let bbox = chart.plotBoxClip.renderer.plotBox;
            if (chart.options.chart.inverted) {
                lPoint = { x: 0, y: bbox.width };
                startLine = [{ x: 0, y: 0 }, { x: 0, y: bbox.width }];
                midLineTop = [{ x: 0, y: bbox.width }, { x: 0, y: bbox.width }];
                midLineBottom = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
                endLine = [{ x: 0, y: 0 }, { x: 0, y: bbox.width }];
            } else {
                startLine = [{ x: 0, y: 0 }, { x: 0, y: bbox.height }];
                midLineBottom = [{ x: 0, y: bbox.height - 1 }, { x: 0, y: bbox.height - 1 }];
                endLine = [{ x: 0, y: 0 }, { x: 0, y: bbox.height }];
            }
        }
        return {
            id: "date-indicator",
            shapes: [
                {
                    points: startLine,
                    type: "path",
                    fill: "none",
                    stroke: appConfig.CHART_DATE_INDICATOR_COLOR,
                    strokeWidth: 2
                },
                {
                    points: endLine,
                    type: "path",
                    fill: "none",
                    stroke: appConfig.CHART_DATE_INDICATOR_COLOR,
                    strokeWidth: 2
                },
                {
                    points: midLineTop,
                    type: "path",
                    fill: "none",
                    stroke: appConfig.CHART_DATE_INDICATOR_COLOR,
                    strokeWidth: 2
                },
                {
                    points: midLineBottom,
                    type: "path",
                    fill: "none",
                    stroke: appConfig.CHART_DATE_INDICATOR_COLOR,
                    strokeWidth: 2
                }
            ],
            visible: false
        };
    }
}
