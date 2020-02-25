const app = getApp()

Page({
    data: {
        webUrl: 'https://8817.linhs.cn/index.html'
    },

    
    onShareAppMessage: function (e) 
    {
        return {
            title: '疫情确诊患者到访小区',
            path: '/pages/index/index'
        }

        wx.showLoading({
            title: '加载中...',
          });
    },

    bindload: function ()
    {
        wx.hideLoading({})
    },

    onLoad: function () {
        wx.setNavigationBarTitle({
            title: '抗击疫情'
        });

        var version = wx.getStorageSync('version');
        var location = wx.getStorageSync('location');
        var url = 'https://8817.linhs.cn/index.html';
        var config = wx.getStorageSync('config');
        if ( config.web_url ) {
            url = config.web_url;
        }
        this.setData({
            webUrl: url + '?version='+version+'&latitude='+location.latitude+'&longitude='+location.longitude
            // webUrl: 'http://192.168.31.77:8080/index.html'
        })
    }
})