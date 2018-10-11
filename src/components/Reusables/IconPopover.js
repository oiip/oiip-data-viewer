/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React, { Component } from "react";
import { findDOMNode } from "react-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Popover from "@material-ui/core/Popover";
import Tooltip from "@material-ui/core/Tooltip";
import MiscUtil from "_core/utils/MiscUtil";
import styles from "components/Reusables/IconPopover.scss";
import { IconButtonSmall } from "_core/components/Reusables";

export class IconPopover extends Component {
    constructor(props) {
        super(props);

        this.popoverOpen = false;
        this.button = undefined;
    }

    handleClickButton(evt) {
        this.button = findDOMNode(evt.currentTarget);
        this.popoverOpen = !this.popoverOpen;
        this.forceUpdate();
    }

    handleClose() {
        this.popoverOpen = false;
        this.forceUpdate();
    }

    renderButton() {
        if (typeof this.props.tooltip !== "undefined") {
            return (
                <Tooltip
                    title={this.props.tooltip}
                    disableFocusListener={true}
                    placement={this.props.tooltipPlacement || "bottom"}
                >
                    <IconButtonSmall
                        color={this.popoverOpen ? "primary" : "inherit"}
                        className={styles.button}
                        disabled={this.props.disabled}
                        onClick={evt => this.handleClickButton(evt)}
                    >
                        {this.props.icon}
                    </IconButtonSmall>
                </Tooltip>
            );
        }
        return (
            <IconButtonSmall
                color={this.popoverOpen ? "primary" : "inherit"}
                className={styles.button}
                disabled={this.props.disabled}
                onClick={evt => this.handleClickButton(evt)}
            >
                {this.props.icon}
            </IconButtonSmall>
        );
    }

    render() {
        let containerClasses = MiscUtil.generateStringFromSet({
            [styles.root]: true,
            [this.props.className]: typeof this.props.className !== "undefined"
        });

        let contentClasses = MiscUtil.generateStringFromSet({
            [styles.content]: true,
            [this.props.contentClass]: typeof this.props.contentClass !== "undefined"
        });

        let anchorOrigin = this.props.anchorOrigin || {
            vertical: "bottom",
            horizontal: "left"
        };
        let transformOrigin = this.props.transformOrigin || {
            vertical: "top",
            horizontal: "center"
        };

        return (
            <div className={containerClasses}>
                {this.renderButton()}
                <Popover
                    open={this.popoverOpen}
                    anchorEl={this.button}
                    anchorReference="anchorEl"
                    anchorOrigin={anchorOrigin}
                    transformOrigin={transformOrigin}
                    onClose={() => this.handleClose()}
                    classes={{ paper: contentClasses }}
                >
                    {this.props.children}
                </Popover>
            </div>
        );
    }
}

IconPopover.propTypes = {
    icon: PropTypes.node.isRequired,
    className: PropTypes.string,
    tooltip: PropTypes.string,
    tooltipPlacement: PropTypes.string,
    contentClass: PropTypes.string,
    disabled: PropTypes.bool,
    anchorOrigin: PropTypes.object,
    transformOrigin: PropTypes.object,
    children: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.node])
};

export default connect()(IconPopover);
