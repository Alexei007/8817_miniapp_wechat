const app = getApp()

var network = require('../../utils/network.js')
var util = require('../../utils/util.js')

Page({
    data: {
        config: []
    },
    onShareAppMessage: function (e) 
    {
        return {
            title: '疫情确诊患者到访小区',
            path: '/pages/index/index'
        }
    },

    onLoad: function () {
        wx.setNavigationBarTitle({
            title: '关于我们'
        })

        var that = this;
        var config = wx.getStorageSync('config');
        that.setData({
            config: config
        });
    },
    contactUs: function ()
    {
        util.netwrokRequest("qrcode", "/file/wechat_group/list.json", function (data) {
            var timestamp = parseInt(Date.parse(new Date())/1000);
            if ( data.length == 0 ) {
                util.showMessage("请耐心等待管理员上传二维码。");
                return false;
            } 
            if ( data[0].expire < timestamp ) {
                util.showMessage("已上传的二维码已过期，请等待管理员更新二维码。");
                return false;
            }

            wx.getImageInfo({
              src: data[0].src,
              success: function (e) {
                  wx.saveImageToPhotosAlbum({
                    filePath: e.path,
                    success: function (rs) {
                        util.showMessage("已保存到相册，请用微信扫一扫识别相册中的二维码。");
                    },
                    fail: function () {
                        util.showMessage("保存二维码到本地失败，请检查是否允许本小程序写入。");
                    }
                  })
              },
              fail: function () {
                  util.showMessage("获取二维码信息失败，请稍后重试。");
                  return false;
              }
            })
        });
    }
})