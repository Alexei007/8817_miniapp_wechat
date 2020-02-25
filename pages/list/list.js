const app = getApp()

var network = require('../../utils/network.js')
var util = require('../../utils/util.js')

Page({
    data: {
        inputShowed: true,
        list: [],
        latitude: '',
        longitude: '',
        version: '',
        cityList: [],
        cityIdList: [],
        index: 0,
        currentCityName: '',
        config: [],
        hideMsg: true
    },

    
    onShareAppMessage: function (e) 
    {
        return {
            title: '疫情确诊患者到访小区',
            path: '/pages/index/index'
        }
    },

    onLoad: function () {
        var that = this;

        wx.setNavigationBarTitle({
            title: '疫情确诊患者到访小区'
        })

        var version = wx.getStorageSync('version');
        var location = wx.getStorageSync('location');
        var config = wx.getStorageSync('config');
       
        util.netwrokRequest('city_list', '/file/city_list.json', function (data) {
            var city_list = new Array();
            var city_id_list = new Array();

            for ( var c=0; c<data.length; c++ ) {
                data[c].distance = that.distance(location.latitude, location.longitude, data[c].extra_info.center.latitude, data[c].extra_info.center.longitude);
                if ( data[c].extra_info.province ) {
                    data[c].city_name = data[c].extra_info.province + '-' + data[c].city_name;
                }

                data[c].city_name = data[c].city_name + '('+data[c].case_num+')';
            }

            data.sort((a, b) => {
                return a.distance - b.distance;
            })
            
            for (var i=0; i<data.length; i++) {
                city_id_list.push(data[i].city_id);
                city_list.push(data[i].city_name)
            }

            JSON.stringify(city_list)
            JSON.stringify(city_id_list)

            that.setData({
                version: version,
                latitude: location.latitude,
                longitude: location.longitude,
                cityList: city_list,
                cityIdList: city_id_list,
                currentCityName: city_list[that.data.index],
                config: config
            });

            util.netwrokRequest('city_' + city_id_list[that.data.index] + '_data_' + version, '/file/city_' + city_id_list[that.data.index] + '.json', function (data) {
                that.setData({
                    list: that.listRegroup(data)
                });
            });
        });
        
        // var city_5_data = wx.getStorageSync('city_5_data_'+this.data.version);
        // if ( city_5_data ) {
        //     that.setData({
        //         list: city_5_data
        //     })
        // } else {
        //     network.httpRequestLoading('/file/city_5.json', 'GET', {}, '加载中...', function (res) {
        //         if (res.status != 1) {
        //             util.showMessage(res.message);
    
        //             return false;
        //         }

        //         wx.setStorageSync('city_5_data_' + that.data.version, res.data);

        //         that.setData({
        //             list: res.data
        //         })
        //     });
        // }
        

        // this.listRegroup(this.data.list);
    },
    hideInput: function () {
        wx.navigateBack({})
    },
    clearInput: function () {
        this.setData({
            inputVal: ""
        });
    },
    inputTyping: function (e) {
        this.setData({
            inputVal: e.detail.value,
            inputShowed: true
        });
    },
    listRegroup: function (list)
    {
        var that = this;
        var distance;
        var distance_text;
        for ( let i=0; i<list.length; i++ ) {
            for ( let j=0; j<list[i].village_list.length; j++ ) {
                distance = that.distance(that.data.latitude, that.data.longitude, list[i].village_list[j].latitude, list[i].village_list[j].longitude);
                if ( distance > 1000 ) {
                    distance_text = distance/1000
                    distance_text = distance_text.toFixed(1) + ' 公里';
                } else {
                    distance_text = distance.toFixed(0) + ' 米';
                }

                list[i].village_list[j].distance = distance;
                list[i].village_list[j].distance_text = distance_text;
            }
            list[i].village_list.sort((a, b) => {
                return a.distance - b.distance;
            })
            list[i].distance = list[i].village_list[0].distance;
            list[i].hideAreaList = false;
            list[i].sign_pic = "/images/up_sign.png";
        }

        list.sort((a, b) => {
            return a.distance - b.distance;
        })

        return list;
    },
    toRad: function (d)
    {
        return d * Math.PI / 180.0;
    },
    distance: function (lat1, lng1, lat2, lng2) {
        var radLat1 = this.toRad(lat1);
        var radLat2 = this.toRad(lat2);
        var a = radLat1 - radLat2;
        var b = this.toRad(lng1) - this.toRad(lng2);
        var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
        s = s * 6378.137;
        s = Math.round(s * 10000) / 10;
        return s
    },
    jump2MapPage: function (res) 
    {
        wx.setStorageSync('sel_location', res.target.dataset)

        wx.switchTab({
          url: '/pages/index/index?lat='+res.target.dataset.lat + '&lng=' + res.target.dataset.lng + '&title=' + res.target.dataset.title,
        })
        // wx.reLaunch({
        //     url: '/pages/index/index?lat='+res.target.dataset.lat + '&lng=' + res.target.dataset.lng + '&title=' + res.target.dataset.title,
        // })
    },

    cityChange: function (e)
    {
        var that = this;
        util.netwrokRequest('city_' + that.data.cityIdList[e.detail.value] + '_data_' + that.data.version, '/file/city_' + that.data.cityIdList[e.detail.value] + '.json', function (data) {
            that.setData({
                index: e.detail.value,
                list: that.listRegroup(data),
                currentCityName: that.data.cityList[e.detail.value]
            });
        });
    },
    hideAreaListFunc: function (e)
    {
        var that = this;
        if ( that.data.list[e.target.dataset.value].hideAreaList === true ) {
            that.data.list[e.target.dataset.value].hideAreaList = false;
            that.data.list[e.target.dataset.value].sign_pic = "/images/up_sign.png";
        } else {
            that.data.list[e.target.dataset.value].hideAreaList = true;
            that.data.list[e.target.dataset.value].sign_pic = "/images/down_sign.png";
        }

        that.setData({
            list: that.data.list
        });
    },
    showMsg: function ()
    {
        this.setData({
            hideMsg: false
        });
    },
    hideMsg: function ()
    {
        this.setData({
            hideMsg: true
        });
    }
})
