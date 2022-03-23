cc.Class({
    extends: cc.Component,

    properties: {
        updatePanel: {
            default: null,
            type: cc.Node
        },
        // manifestUrl: {
        //     default: null,
        //     url: cc.RawAsset
        // },
        manifestUrl: {
            type: cc.Asset,     // use 'type:' to define Asset object directly
            default: null,      // object's default value is null
          },
        percent: {
            default: null,
            type: cc.Label
        },
        lblErr: {
            default: null,
            type: cc.Label
        },
        progressNode: {
            default: null,
            type: cc.Node
        },
        _needRestart:false,
        _failed:false,
        _oldPercent:0,
        _progress:null,
    },

    checkCb: function (event) {
        console.log('checkCb Code: ' + event.getEventCode());
       if(jsb.EventAssetsManager){
            switch (event.getEventCode())
            {
                case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                    console.log("No local manifest file found, hot update skipped.");
                    // cc.eventManager.removeListener(this._checkListener);
                    this.lblErr.string += 'ERROR_NO_LOCAL_MANIFEST\n';
                    break;
                case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
                    console.log("没有找到更新资源文件")
                    cc.director.loadScene("loading");
                    this.lblErr.string += 'ERROR_DOWNLOAD_MANIFEST\n';
                    break;
                case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                    console.log("Fail to download manifest file, hot update skipped.");
                    // cc.eventManager.removeListener(this._checkListener);
                    this.lblErr.string += 'ERROR_PARSE_MANIFEST\n';
                    break;
                case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                    console.log("Already up to date with the latest remote version.");
                    // cc.eventManager.removeListener(this._checkListener);
                    this.lblErr.string += "游戏不需要更新\n";
                    cc.director.loadScene("loading");
                    break;
                case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                    this._am.setEventCallback(null);
                    this._needUpdate = true;
                    this.percent.string = '0%';
                    this.progressNode.active = true;
                    this.updatePanel.active = true;
                    // cc.eventManager.removeListener(this._checkListener);
                    this.lblErr.string += 'NEW_VERSION_FOUND\n';
                    break;
                default:
                        this.lblErr.string += 'default\n';
                        break;
            }
            this.hotUpdate();
       }
      
    },

    updateCb: function (event) {
        if(!this._needRestart && !this._failed){
            switch (event.getEventCode())
            {
                case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                    console.log('No local manifest file found, hot update skipped.');
                    this._failed = true;
                    this.lblErr.string += 'ERROR_NO_LOCAL_MANIFEST\n';
                    break;
                case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                    var percent = event.getPercent();
                    var percentByFile = event.getPercentByFile();
                    var msg = event.getMessage();
                    if (msg) {
                        console.log(msg);
                    }
                    console.log("  正在更新 热更资源百分比 "+ Math.floor(percent*100) + '% ');
                    if(typeof(percent) == "number" && !isNaN(percent) && Math.floor(percent*100) > this._oldPercent ){
                        this._oldPercent = Math.floor(percent*100);
                        this.percent.string = this._oldPercent+ '%';//.toFixed(2) 
                        this.progressNode.getComponent(cc.ProgressBar).progress = percent;
                    }
                    // this.lblErr.string += 'UPDATE_PROGRESSION\n';
                    break;
                case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
                    this.lblErr.string += 'ERROR_DOWNLOAD_MANIFEST\n';
                    break;
                case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                    console.log('Fail to download manifest file, hot update skipped.');
                    this._failed = true;
                    this.lblErr.string += 'ERROR_PARSE_MANIFEST\n';
                    break;
                case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                    console.log('Already up to date with the latest remote version.');
                    this._failed = true;
                    this.lblErr.string += 'ALREADY_UP_TO_DATE\n';
                    break;
                case jsb.EventAssetsManager.UPDATE_FINISHED:
                    console.log('更新完了 ' + event.getMessage());
                    this._am.setEventCallback(null);
                    this._needRestart = true;
                    this.percent.string = 100+ '%';//.toFixed(2)
                    this.progressNode.getComponent(cc.ProgressBar).progress = 1;
                    this.lblErr.string += 'UPDATE_FINISHED\n';
                    break;
                case jsb.EventAssetsManager.UPDATE_FAILED:
                    console.log('Update _failed. ' + event.getMessage());
                    this._failCount ++;
                    if (this._failCount < 5)
                    {
                        this._am.downloadFailedAssets();
                    }
                    else
                    {
                        console.log('Reach maximum fail count, exit update process');
                        this._failCount = 0;
                        this._failed = true;
                    }
                    this.lblErr.string += 'UPDATE_FAILED\n';
                    break;
                case jsb.EventAssetsManager.ERROR_UPDATING:
                    console.log('Asset update error: ' + event.getAssetId() + ', ' + event.getMessage());
                    this.lblErr.string += 'ERROR_UPDATING\n';
                    break;
                case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                    console.log(event.getMessage());
                    this.lblErr.string += 'ERROR_DECOMPRESS\n';
                    break;
                default:
                    this.lblErr.string += 'default\n';
                    break;
            }
        }
      
        if (this._failed) {
            // cc.eventManager.removeListener(this._updateListener);
            this.updatePanel.active = false;
            this.lblErr.string += '_failed\n';
        }

        if (this._needRestart) {
            // Prepend the manifest's search path
            var searchPaths = jsb.fileUtils.getSearchPaths();
            console.log("更新完毕   更换更新信息2"+searchPaths)
            var newPaths = this._am.getLocalManifest().getSearchPaths();
            console.log('searchPaths is ' + searchPaths + ' newPaths is ' + newPaths);
            Array.prototype.unshift(searchPaths, newPaths);
            // This value will be retrieved and appended to the default search path during game startup,
            // please refer to samples/js-tests/main.js for detailed usage.
            // !!! Re-add the search paths in main.js is very important, otherwise, new scripts won't take effect.
            cc.sys.localStorage.setItem('HotUpdateSearchPaths', JSON.stringify(searchPaths));
            jsb.fileUtils.setSearchPaths(searchPaths);
            this.lblErr.string += "游戏资源更新完毕\n";
            // cc.game.restart();
            this.percent.string = '游戏更新完成!';
            this.progressNode.getComponent(cc.ProgressBar).progress = 1;
            this._am = null;
            setTimeout(function(){
                cc.game.restart()
            },500)
        }
    },

    hotUpdate: function () {
        if (this._am && this._needUpdate) {
            this.lblErr.string += "开始更新游戏资源...\n";
            // this._updateListener = new jsb.EventListenerAssetsManager(this._am, this.updateCb.bind(this));
            this._am.setEventCallback(this.updateCb.bind(this));
            // cc.eventManager.addListener(this._updateListener, 1);
            this._failCount = 0;
            this._am.update();
        }
    },

    // use this for initialization
    onLoad: function () {
        // Hot update is only available in Native build
        if (!cc.sys.isNative) {
            console.log('Hot update is only available in Native build');
            return;
        }
        this.updatePanel.active = false;
        this.percent.string = ""
        this.progressNode.active = false;
        this.progressNode.getComponent(cc.ProgressBar).progress = 0;
        console.log("热更新界面")
        // this.lblErr.string += "检查游戏资源...\n";
        var storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'tiantianqipai_asset');
        this._am = new jsb.AssetsManager(this.manifestUrl.nativeUrl, storagePath);
       console.log('Storage path for remote asset : ' + storagePath);
        // this.lblErr.string += storagePath + "\n";
        console.log('Local manifest URL : ' + this.manifestUrl.nativeUrl);
        // this.lblErr.string += this.manifestUrl.nativeUrl + "\n";
        this._needUpdate = false;
        if (this._am.getLocalManifest().isLoaded())
        {
            // this._checkListener = new jsb.EventListenerAssetsManager(this._am, this.checkCb.bind(this));
            this._am.setEventCallback(this.checkCb.bind(this));
            // cc.eventManager.addListener(this._checkListener, 1);
            console.log("执行了+++")
            this._am.checkUpdate();
        }
        else {
            // this.lblErr.string += 'isLoaded else\n';
            // cc.director.loadScene("loading");
        }
    },

    onDestroy: function () {
        // this._am && this._am.release();
        if(this._am){
            this._am.setEventCallback(null);
            this._am = null;
        }
    }
});
