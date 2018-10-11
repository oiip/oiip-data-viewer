/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React, { Component } from "react";
import PropTypes from "prop-types";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import moment from "moment";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import ErrorIcon from "@material-ui/icons/ErrorOutline";
import * as mapActions from "actions/mapActions";
import * as chartActions from "actions/chartActions";
import { ChartButtons, ChartSettings } from "components/Chart";
import { AreaDefaultMessage } from "components/Reusables";
import MiscUtil from "utils/MiscUtil";
import ChartUtil from "utils/ChartUtil";
import appConfig from "constants/appConfig";
import styles from "components/Chart/Chart.scss";
import displayStyles from "_core/styles/display.scss";

export class Chart extends Component {
    componentDidMount() {
        let node =
            typeof this.refs.chartWrapper !== "undefined"
                ? this.refs.chartWrapper
                : document.getElementById(this.props.chart.get("nodeId"));

        ChartUtil.plotData({
            node: node,
            data: this.props.chart.get("data"),
            displayOptions: this.props.chart.get("displayOptions"),
            height: this.getHeight(),
            chartType: this.props.chart.get("chartType"),
            seriesTitles: this.props.chart
                .getIn(["formOptions", "selectedTracks"])
                .map(track => track.title)
                .toJS(),
            seriesNum: this.props.chart.getIn(["formOptions", "selectedTracks"]).size,
            note: "decimation unknown",
            keys: {
                xKey: this.props.chart.getIn(["formOptions", "xAxis"]),
                xLabel: this.props.chart.getIn(["formOptions", "xAxisLabel"]),
                yKey: this.props.chart.getIn(["formOptions", "yAxis"]),
                yLabel: this.props.chart.getIn(["formOptions", "yAxisLabel"]),
                zKey: this.props.chart.getIn(["formOptions", "zAxis"]),
                zLabel: this.props.chart.getIn(["formOptions", "zAxisLabel"])
            },
            onZoom: bounds => {
                this.props.chartActions.zoomChartData(this.props.chart.get("id"), bounds);
            },
            onClick: evt => {
                if (!this.props.chart.getIn(["displayOptions", "linkToDateInterval"])) {
                    let axisIsTime =
                        this.props.chart
                            .getIn(["formOptions", "xAxis"])
                            .toLocaleLowerCase()
                            .indexOf("time") !== -1;
                    if (axisIsTime) {
                        let date = moment.utc(evt.x);
                        // set the map date, if found
                        if (date.isValid()) {
                            this.props.mapActions.setDate(date.toDate());
                        }
                    }
                }
            }
        });
    }

    componentDidUpdate(prevProps) {
        // only update the chart if its something other than opening the settings
        // or updating the loading screen
        if (
            !this.props.chart.getIn(["displayOptions", "isOpen"]) &&
            this.props.chart.get("dataLoading") === prevProps.chart.get("dataLoading")
        ) {
            let node =
                typeof this.refs.chartWrapper !== "undefined"
                    ? this.refs.chartWrapper
                    : document.getElementById(this.props.chart.get("nodeId"));
            if (prevProps.chart !== this.props.chart) {
                let dec_size = this.props.chart.get("data").reduce((acc, data) => {
                    return acc + data.meta.dec_size;
                }, 0);
                let sub_size = this.props.chart.get("data").reduce((acc, data) => {
                    return acc + data.meta.sub_size;
                }, 0);

                // calculate extremes across all available data
                let xKey = this.props.chart.getIn(["formOptions", "xAxis"]);
                let yKey = this.props.chart.getIn(["formOptions", "yAxis"]);
                let zKey = this.props.chart.getIn(["formOptions", "zAxis"]);
                let extremes = {
                    x: { min: Number.MAX_VALUE, max: -Number.MAX_VALUE },
                    y: { min: Number.MAX_VALUE, max: -Number.MAX_VALUE },
                    z: { min: Number.MAX_VALUE, max: -Number.MAX_VALUE }
                };
                extremes = this.props.chart.get("data").reduce((acc, data) => {
                    if (data.meta.extremes[xKey].min < acc.x.min) {
                        acc.x.min = data.meta.extremes[xKey].min;
                    }
                    if (data.meta.extremes[xKey].max > acc.x.max) {
                        acc.x.max = data.meta.extremes[xKey].max;
                    }
                    if (data.meta.extremes[yKey].min < acc.y.min) {
                        acc.y.min = data.meta.extremes[yKey].min;
                    }
                    if (data.meta.extremes[yKey].max > acc.y.max) {
                        acc.y.max = data.meta.extremes[yKey].max;
                    }
                    if (typeof zKey !== "undefined") {
                        if (data.meta.extremes[zKey].min < acc.z.min) {
                            acc.z.min = data.meta.extremes[zKey].min;
                        }
                        if (data.meta.extremes[zKey].max > acc.z.max) {
                            acc.z.max = data.meta.extremes[zKey].max;
                        }
                    }
                    return acc;
                }, extremes);

                // override extremes
                if (
                    typeof yKey !== "undefined" &&
                    this.props.chart.getIn(["displayOptions", "useCustomYAxisBounds"])
                ) {
                    extremes.y.min = this.props.chart.getIn(["displayOptions", "customYMin"]);
                    extremes.y.max = this.props.chart.getIn(["displayOptions", "customYMax"]);
                }
                if (
                    typeof zKey !== "undefined" &&
                    this.props.chart.getIn(["displayOptions", "useCustomZAxisBounds"])
                ) {
                    extremes.z.min = this.props.chart.getIn(["displayOptions", "customZMin"]);
                    extremes.z.max = this.props.chart.getIn(["displayOptions", "customZMax"]);
                }

                let data = this.props.chart.get("data").map(data => data.data);

                ChartUtil.updateData({
                    node: node,
                    data: data,
                    dataExtremes: extremes,
                    note: (dec_size / sub_size * 100).toFixed(1) + "% of points shown",
                    chartType: this.props.chart.get("chartType"),
                    displayOptions: this.props.chart.get("displayOptions")
                });
                ChartUtil.setDateIndicator({
                    node: node,
                    date: this.props.mapDate,
                    intervalDate: this.props.mapIntervalDate
                });
            } else if (
                prevProps.mapDate !== this.props.mapDate ||
                prevProps.mapIntervalDate !== this.props.mapIntervalDate
            ) {
                ChartUtil.setDateIndicator({
                    node: node,
                    date: this.props.mapDate,
                    intervalDate: this.props.mapIntervalDate
                });
            }
        }
    }

    renderChart() {
        if (!this.props.chart.getIn(["dataError", "error"])) {
            let chartClasses = MiscUtil.generateStringFromSet({
                [styles.chart]: true,
                [styles.dateLinked]: this.props.chart.getIn([
                    "displayOptions",
                    "linkToDateInterval"
                ])
            });
            return (
                <div
                    id={this.props.chart.get("nodeId")}
                    ref="chartWrapper"
                    className={chartClasses}
                />
            );
        }
        return "";
    }

    getHeight() {
        return (
            appConfig.CHART_HEIGHT +
            (this.props.chart.getIn(["formOptions", "selectedTracks"]).size - 1) * 16
        );
    }

    render() {
        let loadingClasses = MiscUtil.generateStringFromSet({
            [styles.loadingWrapper]: true,
            [styles.loadingHidden]:
                !this.props.chart.get("dataLoading") &&
                !this.props.chart.getIn(["warning", "active"])
        });

        let height = this.getHeight();

        return (
            <Paper className={styles.root} elevation={2} style={{ height: height }}>
                {this.renderChart()}
                <ChartButtons
                    chartId={this.props.chart.get("id")}
                    nodeId={this.props.chart.get("nodeId")}
                    error={this.props.chart.getIn(["dataError", "error"])}
                />
                <div className={loadingClasses}>
                    <Typography variant="title" component="div" className={styles.loading}>
                        {this.props.chart.getIn(["warning", "active"])
                            ? this.props.chart.getIn(["warning", "text"])
                            : "loading data..."}
                    </Typography>
                </div>
                <ChartSettings
                    chartId={this.props.chart.get("id")}
                    displayOptions={this.props.chart.get("displayOptions")}
                    formOptions={this.props.chart.get("formOptions")}
                />
                <AreaDefaultMessage
                    active={this.props.chart.getIn(["dataError", "error"])}
                    label="Failed to Generate Chart"
                    sublabel="try selecting a new track or different axis variables"
                    icon={<ErrorIcon />}
                    className={styles.error}
                />
            </Paper>
        );
    }
}

Chart.propTypes = {
    chart: PropTypes.object.isRequired,
    mapDate: PropTypes.object.isRequired,
    chartActions: PropTypes.object.isRequired,
    mapActions: PropTypes.object.isRequired,
    mapIntervalDate: PropTypes.object.isRequired
};

function mapStateToProps(state) {
    return {
        mapDate: state.map.get("date"),
        mapIntervalDate: state.map.get("intervalDate")
    };
}

function mapDispatchToProps(dispatch) {
    return {
        chartActions: bindActionCreators(chartActions, dispatch),
        mapActions: bindActionCreators(mapActions, dispatch)
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Chart);
