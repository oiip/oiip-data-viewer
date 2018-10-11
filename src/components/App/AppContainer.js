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
import { MuiThemeProvider, createMuiTheme } from "@material-ui/core/styles";
import { cyan, grey } from "@material-ui/core/colors";
import * as appActionsCore from "_core/actions/appActions";
import * as mapActionsCore from "_core/actions/mapActions";
import * as appStringsCore from "_core/constants/appStrings";
import * as appActions from "actions/appActions";
import appConfig from "constants/appConfig";
import MiscUtil from "_core/utils/MiscUtil";
import { MapContainer, MapControlsContainer, RefDataDisplay } from "components/Map";
import { MainMenu } from "components/MainMenu";
import { LayerInfoContainer } from "components/LayerInfo";
import { LoadingContainer } from "_core/components/Loading";
import { AlertsContainer } from "_core/components/Alerts";
import { DatePickerContainer, AnimationLoading } from "components/DatePicker";
import { MouseFollowerContainer } from "components/MouseFollower";
import { KeyboardControlsContainer } from "components/KeyboardControls";
import { SatelliteLayerSelector, InsituLayerMenu } from "components/LayerMenu";
import styles from "components/App/AppContainer.scss";
import stylesCore from "_core/components/App/AppContainer.scss";
import displayStyles from "_core/styles/display.scss";

const theme = createMuiTheme({
    typography: {
        htmlFontSize: 10
    },
    palette: {
        primary: cyan,
        // secondary: {
        //     light: "#88ffff",
        //     main: "#4dd0e1",
        //     dark: "#009faf",
        //     contrastText: "#000"
        // }
        secondary: {
            light: "#ffffff",
            main: "#f5f5f5",
            dark: "#c2c2c2",
            contrastText: "#000"
        }
    }
});

export class AppContainer extends Component {
    constructor(props) {
        super(props);

        // Setting urlParams as a local variable avoids setting application state before
        // we know if we want to set state via urlParams. If you set urlParams in state,
        // you'd need to set app state to default and then check for urlParams and configure,
        // but that would change the urlParams, wiping out desired urlParams.

        // Generally speaking, however, it is not recommended to rely on instance variables inside of
        // components since they lie outside of the application state and Redux paradigm.
        this.urlParams = MiscUtil.getUrlParams();
    }

    componentDidMount() {
        // disable the right click listener
        document.addEventListener(
            "contextmenu",
            function(e) {
                e.preventDefault();
            },
            false
        );

        // Perform initial browser functionality check
        this.props.checkBrowserFunctionalities();

        // load in initial data
        this.props.loadInitialData(() => {
            // initialize the map. I know this is hacky, but there simply doesn't seem to be a good way to
            // wait for the DOM to complete rendering.
            // see: http://stackoverflow.com/a/34999925
            window.requestAnimationFrame(() => {
                setTimeout(() => {
                    // initialize the maps
                    this.props.initializeMap(appStringsCore.MAP_LIB_2D, "map2D");

                    // set initial view
                    this.props.setMapView({ extent: appConfig.DEFAULT_BBOX_EXTENT }, true);

                    // activate default/url params
                    if (this.urlParams.length === 0) {
                        this.props.activateDefaultLayers();
                    } else {
                        this.props.runUrlConfig(this.urlParams);
                    }

                    // signal complete
                    this.props.completeInitialLoad();

                    // run initial search
                    this.props.runLayerSearch(true);
                }, 0);
            });
        });
    }

    render() {
        let hideMouse = this.props.mapControlsHidden && this.props.distractionFreeMode;
        let containerClasses = MiscUtil.generateStringFromSet({
            [stylesCore.appContainer]: true,
            [displayStyles.mouseVisible]: !hideMouse,
            [displayStyles.mouseHidden]: hideMouse
        });

        let mapControlsClasses = MiscUtil.generateStringFromSet({
            [styles.mapControls]: true,
            [styles.lifted]: this.props.animationOpen
        });

        let dataDisplayClasses = MiscUtil.generateStringFromSet({
            [styles.lifted]: this.props.animationOpen
        });

        return (
            <MuiThemeProvider theme={theme}>
                <div className={containerClasses}>
                    <DatePickerContainer />
                    <MapContainer />
                    <MapControlsContainer className={mapControlsClasses} />
                    <div className={styles.layers}>
                        <InsituLayerMenu />
                        <SatelliteLayerSelector />
                    </div>
                    <LayerInfoContainer />
                    <MainMenu />
                    <AlertsContainer />
                    <MouseFollowerContainer />
                    <RefDataDisplay />
                    <AnimationLoading />
                    <LoadingContainer />
                    <KeyboardControlsContainer />
                </div>
            </MuiThemeProvider>
        );
    }
}

AppContainer.propTypes = {
    completeInitialLoad: PropTypes.func.isRequired,
    checkBrowserFunctionalities: PropTypes.func.isRequired,
    loadInitialData: PropTypes.func.isRequired,
    activateDefaultLayers: PropTypes.func.isRequired,
    runUrlConfig: PropTypes.func.isRequired,
    initializeMap: PropTypes.func.isRequired,
    setMapView: PropTypes.func.isRequired,
    runLayerSearch: PropTypes.func.isRequired,
    distractionFreeMode: PropTypes.bool.isRequired,
    mapControlsHidden: PropTypes.bool.isRequired,
    animationOpen: PropTypes.bool.isRequired
};

function mapStateToProps(state) {
    return {
        distractionFreeMode: state.view.get("distractionFreeMode"),
        mapControlsHidden: state.view.get("mapControlsHidden"),
        animationOpen: state.map.getIn(["animation", "isOpen"])
    };
}

function mapDispatchToProps(dispatch) {
    return {
        completeInitialLoad: bindActionCreators(appActionsCore.completeInitialLoad, dispatch),
        checkBrowserFunctionalities: bindActionCreators(
            appActionsCore.checkBrowserFunctionalities,
            dispatch
        ),
        loadInitialData: bindActionCreators(mapActionsCore.loadInitialData, dispatch),
        activateDefaultLayers: bindActionCreators(mapActionsCore.activateDefaultLayers, dispatch),
        runUrlConfig: bindActionCreators(appActionsCore.runUrlConfig, dispatch),
        initializeMap: bindActionCreators(mapActionsCore.initializeMap, dispatch),
        setMapView: bindActionCreators(mapActionsCore.setMapView, dispatch),
        runLayerSearch: bindActionCreators(appActions.runLayerSearch, dispatch)
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(AppContainer);
