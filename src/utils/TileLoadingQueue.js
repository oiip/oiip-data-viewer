/**
 * Copyright 2018 California Institute of Technology.
 *
 * This source code is licensed under the APACHE 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import Immutable from "immutable";

const MAX_TILES_LOADING = 7;

export default class TileLoadingQueue {
    constructor() {
        this._queue = new Immutable.Stack();
        this._catalogue = new Immutable.Map();
        this._tileLoadCallback = false;
    }

    enqueue(id, tile) {
        if (typeof this._catalogue.get(id) === "undefined") {
            this._catalogue = this._catalogue.set(id, true);
            this._queue = this._queue.push({ id, tile });
        }
    }

    loadMoreTiles(tilesLoading = 0) {
        let empty = false;
        while (tilesLoading < MAX_TILES_LOADING && !empty) {
            if (this.loadTile()) {
                tilesLoading++;
            } else {
                empty = true;
            }
        }
        return Math.max(0, tilesLoading);
    }

    loadTile() {
        if (this._queue.size > 0) {
            let tileEntry = this._queue.peek();
            this._queue = this._queue.pop();

            this._catalogue = this._catalogue.delete(tileEntry.id);

            if (
                typeof tileEntry.tile.get === "function" &&
                typeof tileEntry.tile.get("_loadTileFunc") === "function"
            ) {
                tileEntry.tile.get("_loadTileFunc")();
            } else {
                tileEntry.tile.load();
            }

            return true;
        }
        return false;
    }

    clear(fullClear = false) {
        this._queue = this._queue.clear();
        this._catalogue = this._catalogue.clear();
    }
}
