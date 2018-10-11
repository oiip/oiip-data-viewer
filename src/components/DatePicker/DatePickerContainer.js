/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { CurrentDatePickerContainer, AnimationContainer } from "components/DatePicker";
import MiscUtil from "_core/utils/MiscUtil";
import stylesCore from "_core/components/DatePicker/DatePickerContainer.scss";
import styles from "components/DatePicker/DatePickerContainer.scss";
import displayStyles from "_core/styles/display.scss";

export class DatePickerContainer extends Component {
    render() {
        let containerClasses = MiscUtil.generateStringFromSet({
            [stylesCore.datePickerContainer]: true,
            [styles.root]: true,
            [styles.expanded]: this.props.animationOpen,
            [this.props.className]: typeof this.props.className !== "undefined"
        });

        let content = this.props.animationOpen ? (
            <AnimationContainer />
        ) : (
            <CurrentDatePickerContainer />
        );

        return <div className={containerClasses}>{content}</div>;
    }
}

DatePickerContainer.propTypes = {
    animationOpen: PropTypes.bool.isRequired,
    className: PropTypes.string
};

function mapStateToProps(state) {
    return {
        animationOpen: state.map.getIn(["animation", "isOpen"])
    };
}

export default connect(mapStateToProps, null)(DatePickerContainer);
