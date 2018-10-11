/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from "react";
import PropTypes from "prop-types";
import Grow from "@material-ui/core/Grow";
import Tooltip from "@material-ui/core/Tooltip";
import BuildIcon from "@material-ui/icons/Build";
import { Manager, Target, Popper } from "react-popper";
import { MapButton, ClickAwayListener } from "_core/components/Reusables";
import { MapToolsMenu } from "components/Reusables";
import MiscUtil from "_core/utils/MiscUtil";
import displayStyles from "_core/styles/display.scss";

const MapToolsButton = props => {
    let btnClasses = MiscUtil.generateStringFromSet({
        [props.className]: typeof props.className !== "undefined"
    });
    return (
        <ClickAwayListener
            onClickAway={() => {
                if (props.isOpen) {
                    props.setOpen(false);
                }
            }}
        >
            <Manager>
                <Target>
                    <Tooltip disableFocusListener={true} title="Tools" placement="left">
                        <MapButton
                            color={props.isOpen ? "primary" : "default"}
                            onClick={() => {
                                props.setOpen(!props.isOpen);
                            }}
                            aria-label="Tools"
                            className={btnClasses}
                        >
                            <BuildIcon />
                        </MapButton>
                    </Tooltip>
                </Target>
                <Popper
                    placement="right-end"
                    style={{ marginLeft: "5px", zIndex: "3001" }}
                    modifiers={{
                        computeStyle: {
                            gpuAcceleration: false
                        }
                    }}
                    eventsEnabled={props.isOpen}
                    className={!props.isOpen ? displayStyles.noPointer : ""}
                >
                    <Grow style={{ transformOrigin: "left bottom" }} in={props.isOpen}>
                        <div>
                            <MapToolsMenu
                                handleRequestClose={() => {
                                    if (props.isOpen) {
                                        props.setOpen(false);
                                    }
                                }}
                            />
                        </div>
                    </Grow>
                </Popper>
            </Manager>
        </ClickAwayListener>
    );
};

MapToolsButton.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    setOpen: PropTypes.func.isRequired,
    className: PropTypes.string
};

export default MapToolsButton;
