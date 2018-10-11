/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React, { Component } from "react";
import { LayerSearchForm, LayerSearchList } from "components/MainMenu/LayerSearch";
import styles from "components/MainMenu/LayerSearch/LayerSearchMenu.scss";

export class LayerSearchMenu extends Component {
    render() {
        return (
            <div className={styles.root}>
                <div className={styles.form}>
                    <LayerSearchForm />
                </div>
                <div className={styles.list}>
                    <LayerSearchList />
                </div>
            </div>
        );
    }
}

export default LayerSearchMenu;
