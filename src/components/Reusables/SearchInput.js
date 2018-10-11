/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React, { Component } from "react";
import { findDOMNode } from "react-dom";
import PropTypes from "prop-types";
import ButtonBase from "@material-ui/core/ButtonBase";
import Paper from "@material-ui/core/Paper";
import Popover from "@material-ui/core/Popover";
import Typography from "@material-ui/core/Typography";
import { IconButtonSmall } from "_core/components/Reusables";
import MiscUtil from "_core/utils/MiscUtil";
import styles from "components/Reusables/SearchInput.scss";
import displayStyles from "_core/styles/display.scss";

export class LabelPopover extends Component {
    constructor(props) {
        super(props);

        this.useExternal = typeof this.props.open !== "undefined";
        this.popoverOpen = false;
        this.button = undefined;
        this.width = "initial";
    }

    handleClickButton() {
        this.button = findDOMNode(this.button);

        if (this.useExternal) {
            if (typeof this.props.onOpen === "function") {
                this.props.onOpen();
            }
        } else {
            this.popoverOpen = true;
            if (typeof this.props.onOpen === "function") {
                this.props.onOpen();
            }
            this.forceUpdate();
        }
    }

    handleClose() {
        if (this.useExternal) {
            if (typeof this.props.onClose === "function") {
                this.props.onClose();
            }
        } else {
            this.popoverOpen = false;
            if (typeof this.props.onClose === "function") {
                this.props.onClose();
            }
            this.forceUpdate();
        }
    }

    renderLeftAction() {
        if (typeof this.props.leftAction !== "undefined") {
            let action = this.props.leftAction;
            if (typeof action.onClick !== "undefined") {
                return (
                    <div
                        color="inherit"
                        className={styles.actionBtn}
                        onClick={this.props.leftAction.onClick}
                    >
                        {this.props.leftAction.icon}
                    </div>
                );
            } else {
                return (
                    <div color="inherit" className={styles.actionBtn}>
                        {this.props.leftAction.icon}
                    </div>
                );
            }
        } else {
            return <div className={displayStyles.hidden} />;
        }
    }

    renderRightAction() {
        if (typeof this.props.rightAction !== "undefined") {
            if (typeof this.props.rightAction.map === "function") {
                return this.props.rightAction.map((actionEntry, i) => {
                    return this.renderIconButton(
                        actionEntry.icon,
                        actionEntry.onClick,
                        "search-input-btn-" + i
                    );
                });
            } else {
                return this.renderIconButton(
                    this.props.rightAction.icon,
                    this.props.rightAction.onClick
                );
            }
        } else {
            return <div className={displayStyles.hidden} />;
        }
    }

    renderIconButton(icon, onClick, key) {
        if (typeof onClick !== "undefined") {
            return (
                <IconButtonSmall
                    key={key}
                    color="inherit"
                    className={styles.actionBtn}
                    onClick={onClick}
                >
                    {icon}
                </IconButtonSmall>
            );
        } else {
            return (
                <IconButtonSmall key={key} color="inherit" className={styles.actionBtn}>
                    {icon}
                </IconButtonSmall>
            );
        }
    }

    render() {
        let open = this.useExternal ? this.props.open : this.popoverOpen;

        let containerClasses = MiscUtil.generateStringFromSet({
            [styles.root]: true,
            [this.props.className]: typeof this.props.className !== "undefined"
        });

        let btnClasses = MiscUtil.generateStringFromSet({
            [styles.button]: true,
            [styles.active]: open
        });

        let rightPad = 0;
        if (typeof this.props.rightAction !== "undefined") {
            rightPad = 3;
            if (typeof this.props.rightAction.map === "function") {
                rightPad = rightPad * this.props.rightAction.length;
            }
        }

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
            <Paper elevation={open ? 8 : 0} className={containerClasses}>
                <ButtonBase
                    disableRipple={true}
                    onClick={() => this.handleClickButton()}
                    className={btnClasses}
                    style={{
                        paddingRight: rightPad + "rem"
                    }}
                    ref={node => {
                        this.button = node;
                    }}
                >
                    {this.renderLeftAction()}
                    <Typography variant="body2" color="inherit" className={styles.label}>
                        {this.props.label}
                    </Typography>
                </ButtonBase>
                <div className={styles.rightActions}>{this.renderRightAction()}</div>
                <Popover
                    open={open}
                    anchorEl={this.button}
                    anchorReference="anchorEl"
                    onClose={() => this.handleClose()}
                    anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "left"
                    }}
                    transformOrigin={{
                        vertical: "top",
                        horizontal: "left"
                    }}
                    PaperProps={{ style: { width: this.width } }}
                    classes={{ paper: styles.content }}
                >
                    {this.props.children}
                </Popover>
            </Paper>
        );
    }
}

LabelPopover.propTypes = {
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    placeholder: PropTypes.string,
    leftAction: PropTypes.object,
    rightAction: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    rightActions: PropTypes.oneOfType([PropTypes.array, PropTypes.node]),
    error: PropTypes.string,
    className: PropTypes.string,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    open: PropTypes.bool,
    children: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.node])
};

export default LabelPopover;
