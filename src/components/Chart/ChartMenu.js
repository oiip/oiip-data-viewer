/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React, { Component } from "react";
import { ChartCreateForm, ChartsList } from "components/Chart";
import styles from "components/Chart/ChartMenu.scss";

export class ChartMenu extends Component {
    render() {
        return (
            <div className={styles.root}>
                <ChartCreateForm />
                <ChartsList />
            </div>
        );
    }
}

export default ChartMenu;
