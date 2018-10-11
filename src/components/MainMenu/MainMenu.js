/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Paper from "@material-ui/core/Paper";
import Slide from "@material-ui/core/Slide";
import Button from "@material-ui/core/Button";
import ArrowBack from "@material-ui/icons/KeyboardArrowLeft";
import { ChartMenu } from "components/Chart";
import { LayerSearchMenu } from "components/MainMenu/LayerSearch";
import * as appActions from "actions/appActions";
import MiscUtil from "_core/utils/MiscUtil";
import styles from "components/MainMenu/MainMenu.scss";
import displayStyles from "_core/styles/display.scss";

export class MainMenu extends Component {
    render() {
        let toggleIconClasses = MiscUtil.generateStringFromSet({
            [styles.toggleIcon]: true,
            [styles.toggleIconFlip]: this.props.isOpen
        });

        let tabDatasetsClasses = MiscUtil.generateStringFromSet({
            [styles.tabContent]: true,
            [displayStyles.hidden]: this.props.tabIndex !== 0
        });

        let tabChartClasses = MiscUtil.generateStringFromSet({
            [styles.tabContent]: true,
            [displayStyles.hidden]: this.props.tabIndex !== 1
        });

        return (
            <Slide direction="left" in={this.props.isOpen} className={styles.root}>
                <Paper elevation={4}>
                    <Button
                        variant="raised"
                        className={styles.toggleBtn}
                        aria-label={this.props.isOpen ? "Close" : "Open"}
                        onClick={() => this.props.appActions.setMainMenuOpen(!this.props.isOpen)}
                    >
                        <ArrowBack className={toggleIconClasses} />
                    </Button>
                    <div className={styles.menu}>
                        <Tabs
                            value={this.props.tabIndex}
                            className={styles.tabs}
                            onChange={(evt, value) =>
                                this.props.appActions.setMainMenuTabIndex(value)
                            }
                            textColor="secondary"
                            indicatorColor="secondary"
                            fullWidth={true}
                        >
                            <Tab
                                classes={{
                                    root: styles.tabLabel,
                                    selected: styles.tabSelected
                                }}
                                label="Datasets"
                            />
                            <Tab
                                classes={{
                                    root: styles.tabLabel,
                                    selected: styles.tabSelected
                                }}
                                label="Charts"
                            />
                        </Tabs>
                        <div className={tabDatasetsClasses}>
                            <LayerSearchMenu />
                        </div>
                        <div className={tabChartClasses}>
                            <ChartMenu />
                        </div>
                    </div>
                </Paper>
            </Slide>
        );
    }
}

MainMenu.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    tabIndex: PropTypes.number.isRequired,
    appActions: PropTypes.object.isRequired
};

function mapStateToProps(state) {
    return {
        isOpen: state.view.get("isMainMenuOpen"),
        tabIndex: state.view.get("mainMenuTabIndex")
    };
}

function mapDispatchToProps(dispatch) {
    return {
        appActions: bindActionCreators(appActions, dispatch)
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(MainMenu);
