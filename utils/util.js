var network = require('./network.js');

const formatTime = date => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()

    return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
    n = n.toString()
    return n[1] ? n : '0' + n
}

// 统一请求方法
function httpRequest(callback, data, url) {
    if (!data) {
        data = {};
    }

    url = 'https://8817.linhs.cn' + url;

    var token = wx.getStorageSync('token') || ''
    var header = { 'content-type': 'application/x-www-form-urlencoded' }

    //获取Cookie
    if (token != "" && token != null && token != undefined) {
        header.token = token
    }

    wx.request({
        url: url, //仅为示例，并非真实的接口地址
        data: data,
        method: 'POST',
        header: header,
        success: function (res) {
            callback(res);
        }
    })
}

// 请求授权
function askAuth(type) {
    wx.getSetting({
        success(res) {
            if (!type || type == 1) { //用户信息(默认)
                if (!res.authSetting['scope.userInfo']) {
                    wx.authorize({ scope: 'scope.userInfo', success() { } });
                }
            } else if (type == 2) { //地理位置
                if (!res.authSetting['scope.userLocation']) {
                    wx.authorize({ scope: 'scope.userLocation', success() { } });
                }
            } else if (type == 3) { //通讯地址
                if (!res.authSetting['scope.address']) {
                    wx.authorize({ scope: 'scope.address', success() { } });
                }
            }
        }
    });
}

function thirdLogin(callBack, failCall) {
    wx.login({
        success: function (loginRes) {
            wx.getUserInfo({
                success: res => {
                    app.globalData.userInfo = res.userInfo

                    if (callBack) {
                        callBack(res, loginRes.code)
                    }
                },
                fail: res => {
                    wx.hideLoading();

                    if (failCall) {
                        failCall();
                    }
                }
            })
        }
    });
}

// 登录认证请求
function startLoginAuthRequest(e) {
    wx.login({
        success(res) {
            // 发送 res.code 到后台换取 openId, sessionKey, unionId
            network.httpRequestLoading('/miniapp/login', 'POST', {
                js_code: res.code,
                encryptedData: e.detail.encryptedData,
                iv: e.detail.iv
            }, '登录授权中...', function (res) {
                console.log(res)
                if (res.status_code == 1) {
                    wx.setStorage({
                        key: 'token',
                        data: "Bearer " + res.data.token
                    });

                    wx.setStorage({
                        key: 'user_info',
                        data: res.data.user_info
                    });

                    wx.showLoading({
                        title: '跳转中...',
                    })

                    setTimeout(function () {
                        wx.reLaunch({
                            url: '/pages/index/index',
                        });
                    }, 1000);

                    return false;
                }

                wx.showModal({
                    title: '提示',
                    content: '请先授权获取公开信息',
                    showCancel: false,
                });

                return false;
            });
        }
    })
}

// 提示信息
function showMessage(msg) {
    wx.showModal({
        title: '提示',
        content: msg,
        showCancel: false,
    });
}

// 网络请求
function netwrokRequest(storageKey, url, callBack)
{
    var that = this;
    var storage_data = wx.getStorageSync(storageKey);
    if ( storage_data ) {
        callBack(storage_data);
    } else {
        network.httpRequestLoading(url, 'GET', {}, '加载中...', function (res) {
            if (res.status != 1) {
                that.showMessage(res.message);

                return false;
            }

            wx.setStorageSync(storageKey, res.data);
            callBack(res.data);
        });
    }
}

module.exports.common_data = {
    'request_url': ''
};

module.exports = {
    formatTime: formatTime,
    httpRequest: httpRequest,
    askAuth: askAuth,
    thirdLogin: thirdLogin,
    startLoginAuthRequest: startLoginAuthRequest,
    showMessage: showMessage,
    netwrokRequest: netwrokRequest
}
