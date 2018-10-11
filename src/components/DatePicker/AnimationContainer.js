import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import moment from "moment";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import RemoveIcon from "@material-ui/icons/Close";
import PlayIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import SkipNextIcon from "@material-ui/icons/SkipNext";
import { IconButtonSmall } from "_core/components/Reusables";
import {
    DatePicker,
    DateIntervalPicker,
    AnimationSpeedSelector,
    CurrentDateDisplay
} from "components/DatePicker";
import styles from "components/DatePicker/AnimationContainer.scss";
import * as mapActions from "actions/mapActions";
import * as chartActions from "actions/chartActions";
import MiscUtil from "utils/MiscUtil";

export class AnimationContainer extends Component {
    constructor(props) {
        super(props);

        // use instance var to control the animation loop without
        // having to involve state unnecessarily
        this.animationLoopInterval = null;
        this.tileLoadBatchDelay = null;
    }

    shouldComponentUpdate(nextProps) {
        // check the initial buffer has loaded and we should being the animation loop
        if (
            nextProps.animation.get("initiated") &&
            nextProps.animation.get("isPlaying") &&
            nextProps.animation.get("initialBufferLoaded") &&
            !this.props.animation.get("initialBufferLoaded")
        ) {
            // begin loop with a reset
            this.beginAnimationLoop(true);
        }

        return (
            nextProps.className !== this.props.className ||
            nextProps.animation.get("isPlaying") !== this.props.animation.get("isPlaying") ||
            nextProps.animation.get("startDate") !== this.props.animation.get("startDate") ||
            nextProps.animation.get("endDate") !== this.props.animation.get("endDate")
        );
        // return nextProps.animation !== this.props.animation;
    }

    handleStepFrame() {
        window.requestAnimationFrame(() => {
            if (this.props.animation.get("isPlaying")) {
                this.stepFrame(true);
            }
            this.handleAnimationLoop();
        });
    }

    handleAnimationLoop() {
        // clear the timeout so we do not have two animations running at once
        if (this.animationLoopInterval !== null) {
            clearTimeout(this.animationLoopInterval);
        }

        // check that we are playing
        if (this.props.animation.get("isPlaying") && this.props.animation.get("nextFrameLoaded")) {
            // check if we are at the end of the loop
            if (
                moment
                    .utc(this.props.date)
                    .add(this.props.dateIntervalSize, this.props.dateIntervalScale)
                    .isAfter(moment.utc(this.props.animation.get("endDate")))
            ) {
                // give a 1 sec pause at the end of the animation loop
                this.animationLoopInterval = setTimeout(() => {
                    // step forward
                    this.handleStepFrame();
                }, Math.max(1000, this.props.animation.get("speed")));
            } else {
                // set the loop again dynamically to catch speed changes
                this.animationLoopInterval = setTimeout(() => {
                    // step forward
                    this.handleStepFrame();
                }, this.props.animation.get("speed"));
            }
        } else {
            // check the next frame again in 1 sec
            this.animationLoopInterval = setTimeout(() => this.handleAnimationLoop(), 1000);
        }
    }

    beginAnimationLoop(forceReset = false) {
        // reset the loop if requested
        if (forceReset) {
            this.endAnimationLoop();
        }

        // verify the loop is not already running
        if (this.animationLoopInterval === null) {
            // this.handleAnimationLoop();
            this.handleStepFrame();
        }
    }

    endAnimationLoop() {
        // end the loop
        clearTimeout(this.animationLoopInterval);
        // clear the reference
        this.animationLoopInterval = null;
    }

    stepFrame(forward) {
        // step the animation forward
        this.props.mapActions.stepAnimation(forward);
    }

    loadAnimation() {
        let start = this.props.animation.get("startDate");
        let end = this.props.animation.get("endDate");
        let resolution = this.props.dateIntervalSize + "/" + this.props.dateIntervalScale;

        // define a callback that will run whenever a layer is loaded in openlayers map or when all layers are loaded in cesium map
        let callback = () => {
            // add a 500ms delay to create a batch update for tile loads to reduce computation costs
            if (this.tileLoadBatchDelay === null) {
                this.tileLoadBatchDelay = setTimeout(() => {
                    window.requestAnimationFrame(() => {
                        if (this.props.animation.get("initiated")) {
                            // until the buffer is initially loaded
                            if (!this.props.animation.get("initialBufferLoaded")) {
                                this.props.mapActions.checkInitialBuffer();
                            } else {
                                this.props.mapActions.checkBuffer();
                            }
                        }
                        clearTimeout(this.tileLoadBatchDelay);
                        this.tileLoadBatchDelay = null;
                    });
                }, 1000);
            }
        };

        // begin filling the buffer on the maps
        this.props.mapActions.fillAnimationBuffer(start, end, resolution, callback);
    }

    togglePlayPause() {
        // check that we have loaded the buffer at least once
        if (this.props.animation.get("initialBufferLoaded")) {
            // update the play state
            this.props.mapActions.setAnimationPlaying(!this.props.animation.get("isPlaying"));

            // set the loop running (will do nothing if already running)
            this.beginAnimationLoop();
        }
    }

    stopAnimation() {
        // end the animation
        this.endAnimationLoop();
        // clear buffer, etc
        this.props.mapActions.stopAnimation();
        // update charts
        this.props.updateDateLinkedCharts();
    }

    handleClose() {
        this.stopAnimation();
        this.props.mapActions.setAnimationOpen(false);
    }

    handlePlayPress() {
        let dateRange = [
            moment
                .utc(this.props.animation.get("startDate"))
                .subtract(this.props.dateIntervalSize, this.props.dateIntervalScale)
                .toDate(),
            this.props.animation.get("endDate")
        ];

        if (
            !this.props.animation.get("initialBufferLoaded") &&
            !this.props.animation.get("initiated")
        ) {
            this.loadAnimation();
        } else if (
            this.props.animation.get("initialBufferLoaded") &&
            this.props.animation.get("initiated")
        ) {
            this.togglePlayPause();

            if (this.props.animation.get("isPlaying")) {
                dateRange = [];
            }
        }

        // update charts
        this.props.updateDateLinkedCharts(undefined, dateRange);
    }

    render() {
        // pull out state vars
        let isInitiated = this.props.animation.get("initiated");
        let isPlaying = this.props.animation.get("isPlaying");
        let isInitialBufferLoaded = this.props.animation.get("initialBufferLoaded");
        let isBufferLoaded = this.props.animation.get("bufferLoaded");
        let nextFrameLoaded = this.props.animation.get("nextFrameLoaded");

        // define states
        let animationIsLoading =
            isInitiated && !isBufferLoaded && (!nextFrameLoaded || !isInitialBufferLoaded);
        let animationIsPlaying = isInitiated && isPlaying && !animationIsLoading;
        let animationIsPaused = isInitiated && !isPlaying && isInitialBufferLoaded;

        let containerClasses = MiscUtil.generateStringFromSet({
            [styles.root]: true,
            [this.props.className]: typeof this.props.className !== "undefined"
        });

        return (
            <div className={containerClasses}>
                <Grid container spacing={0} alignItems="center" className={styles.controlsRow}>
                    <Grid item xs={6}>
                        <CurrentDateDisplay />
                    </Grid>
                    <Grid item xs={3} className={styles.playControls}>
                        <IconButtonSmall onClick={() => this.handlePlayPress()}>
                            {animationIsPlaying ? <PauseIcon /> : <PlayIcon />}
                        </IconButtonSmall>
                        <IconButtonSmall
                            disabled={!animationIsPaused || animationIsLoading || !nextFrameLoaded}
                            onClick={() => this.stepFrame(true)}
                        >
                            <SkipNextIcon />
                        </IconButtonSmall>
                    </Grid>
                    <Grid item xs={3} className={styles.animControls}>
                        <AnimationSpeedSelector />
                        <DateIntervalPicker />
                        <IconButtonSmall onClick={() => this.handleClose()}>
                            <RemoveIcon />
                        </IconButtonSmall>
                    </Grid>
                </Grid>
                <div className={styles.dateInputRow}>
                    <div className={styles.dateInput}>
                        <DatePicker
                            date={this.props.animation.get("startDate")}
                            setDate={this.props.mapActions.setAnimationStartDate}
                        />
                    </div>
                    <Typography variant="caption">to</Typography>
                    <div className={styles.dateInput}>
                        <DatePicker
                            date={this.props.animation.get("endDate")}
                            setDate={this.props.mapActions.setAnimationEndDate}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

AnimationContainer.propTypes = {
    animation: PropTypes.object.isRequired,
    date: PropTypes.object.isRequired,
    dateIntervalScale: PropTypes.string.isRequired,
    dateIntervalSize: PropTypes.number.isRequired,
    mapActions: PropTypes.object.isRequired,
    updateDateLinkedCharts: PropTypes.func.isRequired,
    blockChartAnimationUpdates: PropTypes.func.isRequired,
    className: PropTypes.string
};

function mapStateToProps(state) {
    return {
        animation: state.map.get("animation"),
        dateIntervalScale: state.map.get("dateIntervalScale"),
        dateIntervalSize: state.map.get("dateIntervalSize"),
        date: state.map.get("date")
    };
}

function mapDispatchToProps(dispatch) {
    return {
        mapActions: bindActionCreators(mapActions, dispatch),
        updateDateLinkedCharts: bindActionCreators(chartActions.updateDateLinkedCharts, dispatch),
        blockChartAnimationUpdates: bindActionCreators(
            chartActions.blockChartAnimationUpdates,
            dispatch
        )
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(AnimationContainer);
