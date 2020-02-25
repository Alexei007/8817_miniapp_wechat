var CryptoJS = require('aes_utils.js');

var server_host = "https://8817.linhs.cn";

//网络请求
function httpRequestLoading(url, type, params, message, success, fail) {
    // if (message != "") {
    //     wx.showLoading({
    //         title: message,
    //     })
    // }

    var token = wx.getStorageSync('token')

    const postRequestTask = wx.request({
        url: server_host + url,
        data: getNewParams(params),
        header: {
            'content-type': 'application/x-www-form-urlencoded',
            'Accept': 'application/x.ylm.v1+json',
            'Authorization': token
        },
        method: type,
        success: function (res) {
            // if (message != "") {
            //     wx.hideLoading()
            // }
            if (res.statusCode == 200) {
                //解析成json
                var jsonStr = CryptoJS.AesDecrypt(res.data.data);
                var obj = JSON.parse(jsonStr);


                var responeModel = {
                    'status': res.data.status,
                    'message': res.data.message,
                    'data': obj
                }

                // 用户未登录
                if (res.data.status == 10001) {
                    wx.reLaunch({
                        url: '/pages/quest_auth/quest_auth',
                    })
                    return false;
                }

                // console.log('请求结果 = ')
                // console.log(responeModel)
                success(responeModel)
            } else {
                fail(res)
            }
        },
        fail: function (res) {
            if (message != "") {
                // wx.hideLoading()
            }
            fail(res)
        }
    })
}

function getNewParams(params) {
    //添加公共参数
    // params['deviceType'] = '3'
    params['time'] = new Date().getTime();
    //   console.log('加密前的参数 = ')
    //   console.log(params)
    //   console.log('加密后的参数 = ')
    //   console.log({
    // 'data': CryptoJS.AesEncrypt(JSON.stringify(params))
    //   })
    return {
        'data': CryptoJS.AesEncrypt(JSON.stringify(params))
    }
}

//将\\n替换成\n
function format(title) {
    if (!title) {
        return
    }

    var reg = getRegExp('\\\\n', 'g')
    return text.replace(reg, '\n')
}





module.exports = {
    httpRequestLoading,
    format,
}