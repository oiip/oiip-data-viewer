import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import CircularProgress from "@material-ui/core/CircularProgress";
import styles from "components/DatePicker/AnimationLoading.scss";
import displayStyles from "_core/styles/display.scss";
import MiscUtil from "utils/MiscUtil";

export class AnimationLoading extends Component {
    render() {
        // pull out state vars
        let isInitiated = this.props.animation.get("initiated");
        let isInitialBufferLoaded = this.props.animation.get("initialBufferLoaded");
        let isBufferLoaded = this.props.animation.get("bufferLoaded");
        let nextFrameLoaded = this.props.animation.get("nextFrameLoaded");

        // define states
        let animationIsLoading =
            isInitiated && !isBufferLoaded && (!nextFrameLoaded || !isInitialBufferLoaded);

        // animation progress
        let progress =
            this.props.animation.get("bufferTilesTotal") > 0
                ? Math.floor(
                      this.props.animation.get("bufferTilesLoaded") /
                          this.props.animation.get("bufferTilesTotal") *
                          100
                  )
                : 0;

        // container class
        let containerClasses = MiscUtil.generateStringFromSet({
            [styles.root]: true,
            [displayStyles.hidden]: !animationIsLoading
        });

        return (
            <div className={containerClasses}>
                <CircularProgress className={styles.spinner} variant="static" value={progress} />
                <div className={styles.text}>{progress}%</div>
            </div>
        );
    }
}

AnimationLoading.propTypes = {
    animation: PropTypes.object.isRequired
};

function mapStateToProps(state) {
    return {
        animation: state.map.get("animation")
    };
}

export default connect(mapStateToProps, null)(AnimationLoading);
