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
import ButtonBase from "@material-ui/core/ButtonBase";
import ArrowDropDown from "@material-ui/icons/ArrowDropDown";
import Popover from "@material-ui/core/Popover";
import Typography from "@material-ui/core/Typography";
import MiscUtil from "_core/utils/MiscUtil";
import styles from "components/Reusables/LabelPopover.scss";

export class LabelPopover extends Component {
    constructor(props) {
        super(props);

        this.popoverOpen = false;
        this.button = undefined;
        this.width = "initial";
    }

    handleClickButton() {
        this.button = findDOMNode(this.button);
        this.popoverOpen = !this.popoverOpen;
        this.forceUpdate();
    }

    handleClose() {
        this.popoverOpen = false;
        this.forceUpdate();
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

        // if we've found the width before, use that
        if (typeof this.width !== "number") {
            if (
                typeof this.button !== "undefined" &&
                typeof this.button.getBoundingClientRect === "function"
            ) {
                let dim = this.button.getBoundingClientRect();
                this.width = dim.width;
            }
        }

        return (
            <div className={containerClasses}>
                <ButtonBase
                    focusRipple={true}
                    onClick={() => this.handleClickButton()}
                    className={styles.button}
                    ref={node => {
                        this.button = node;
                    }}
                >
                    <Typography
                        variant="body2"
                        color={this.popoverOpen ? "primary" : "inherit"}
                        className={styles.label}
                    >
                        {this.props.label}
                        <ArrowDropDown />
                    </Typography>
                    {typeof this.props.subtitle !== "undefined" && (
                        <Typography variant="caption" component="div" className={styles.subtitle}>
                            {this.props.subtitle}
                        </Typography>
                    )}
                </ButtonBase>
                <Popover
                    open={this.popoverOpen}
                    anchorEl={this.button}
                    anchorReference="anchorEl"
                    onClose={() => this.handleClose()}
                    anchorOrigin={{
                        vertical: typeof this.props.subtitle !== "undefined" ? "center" : "bottom",
                        horizontal: "left"
                    }}
                    transformOrigin={{
                        vertical: "top",
                        horizontal: "left"
                    }}
                    PaperProps={{ style: { minWidth: this.width } }}
                    classes={{ paper: contentClasses }}
                >
                    {this.props.children}
                </Popover>
            </div>
        );
    }
}

LabelPopover.propTypes = {
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
    subtitle: PropTypes.string,
    className: PropTypes.string,
    contentClass: PropTypes.string,
    children: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.node])
};

export default connect()(LabelPopover);
