const app = getApp()

var network = require('../../utils/network.js')
var util = require('../../utils/util.js')

Page({
  data: {
      markers: [],
      latitude: '',
      longitude: '',
      searchTitle: '搜索地点',
      hideCloseBtn: true,
      version: '',
      scale: 14,
      pImgSrc: '/images/j_3a.png',
      eImgSrc: '/images/p_3a.png',
      cirles: [],
      hideMsg: true,
      current_city_id: 0,
      isShowDetailMarkers: true,
      config: [],
      selected_sign: []
  },
  onShareAppMessage: function (e) 
  {
      return {
          title: '疫情确诊患者到访小区',
          path: '/pages/index/index'
      }
  },

  onShow: function ()
  {
      wx.getLocation({
        type: 'gcj02',
        success(result) {
            wx.setStorageSync('location', {
                latitude: String(result.latitude),
                longitude: String(result.longitude)
            });
        }
      });
    
      var that = this;
      util.netwrokRequest('config', '/file/config.json', function(rs) {
        that.setData({
            config: rs
        });
      });

      var sel_location = wx.getStorageSync('sel_location');
      if ( sel_location ) {
          that.setData({
              scale: 14,
              latitude: sel_location.lat,
              longitude: sel_location.lng,
              searchTitle: sel_location.title,
              cirles: [{
                  latitude: sel_location.lat,
                  longitude: sel_location.lng,
                  radius: 10,
                  color: '#448AFF',
                  strokeWidth: 5
              }],
              hideCloseBtn: false,
              selected_sign: {
                  latitude: sel_location.lat,
                  longitude: sel_location.lng,
                  title: sel_location.title
              },
          });
          
          wx.removeStorageSync('sel_location');

          that.setLocationMarkers(that.data.version, sel_location.lat, sel_location.lng);

      }
  },

  onLoad: function (rs) {
        wx.setNavigationBarTitle({
            title: '疫情确诊患者到访小区'
        });

        wx.showLoading({
          title: '加载中...',
        });

        var that = this;

        network.httpRequestLoading('/file/version.json', 'GET', {}, '加载中...', function (res) {
            if (res.status != 1) {
                util.showMessage(res.message);

                return false;
            }

            // 清理缓存
            var current_version = wx.getStorageSync('version');
            if ( current_version && current_version!=res.data.version ) {
                wx.clearStorageSync();
            }

            util.netwrokRequest('config', '/file/config.json', function(rs) {
                that.setData({
                    config: rs
                });
            });

            wx.setStorageSync('version',  res.data.version);

            util.netwrokRequest('location_list_'+res.data.version, '/file/location_list.json', function(data) {
                var markers = that.dataFormat(data);
                wx.getLocation({
                    type: 'gcj02',
                    success(result) {
                        wx.setStorageSync('location', {
                            latitude: String(result.latitude),
                            longitude: String(result.longitude)
                        });
    
                        that.setData({
                            latitude: result.latitude,
                            longitude: result.longitude,
                            // markers: markers,
                            version: res.data.version
                        })

                        setTimeout(function () {
                            wx.hideLoading({});
                        }, 200);
                    }
                })
            });

            that.setLocationMarkers(res.data.version);
        });
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

  mapRegionChange: function (e) {
    var that = this;
    if ( e.type == 'end'  ) {
        var mapObj = wx.createMapContext('map');
        mapObj.getCenterLocation({
            success: function (location) {
                if ( location.latitude && location.longitude ) {
                    that.setLocationMarkers(that.data.version, location.latitude, location.longitude);
                }
            }
        });
    }
  },

  setLocationMarkers: function (version, lat, lng) {
      var that = this;
      var latitude;
      var longitude;
      var location = wx.getStorageSync('location');
      var mapObj = wx.createMapContext('map');
      mapObj.getScale({
        success: function (e) {
            if ( e.scale > 10 ) { // 显示城市详细标记
                if ( lat && lng ) {
                    latitude = lat;
                    longitude = lng;
                } else {
                    latitude = location.latitude;
                    longitude = location.longitude;
                }
                util.netwrokRequest('city_list', '/file/city_list.json', function (data) {
                    for ( var c=0; c<data.length; c++ ) {
                        data[c].distance = that.distance(latitude, longitude, data[c].extra_info.center.latitude, data[c].extra_info.center.longitude);
                        if ( data[c].extra_info.province ) {
                            data[c].city_name = data[c].extra_info.province + ' - ' + data[c].city_name;
                        }
                    }
            
                    data.sort((a, b) => {
                        return a.distance - b.distance;
                    });

                    var other_bool = false;
                    if ( that.data.markers.length > 0 ) {
                        if ( 
                            ( that.data.markers[that.data.markers.length-1].iconPath != that.data.config.sign.pic  )
                            ||
                            ( 
                                that.data.markers[that.data.markers.length-1].latitude != that.data.selected_sign.latitude 
                                ||
                                that.data.markers[that.data.markers.length-1].longitude != that.data.selected_sign.longitude
                            )
                        ) {
                            other_bool = true;
                        }
                    }
                    if ( 
                        ( that.data.current_city_id != data[0].city_id )
                        ||
                        ( that.data.config.sign.use_sign === true && that.data.selected_sign && other_bool === true )
                     ) {
                        util.netwrokRequest('city_'+data[0].city_id+'_location_'+version, '/file/city_'+data[0].city_id+'_location.json', function(location_data) {
                            location_data = that.dataFormat(location_data);
                            location_data = that.insertSelectedSign(location_data);
                            that.setData({
                                markers: location_data,
                                current_city_id: data[0].city_id
                            });
                        });
                    }
                });

                that.setData({
                    isShowDetailMarkers: true
                })

            } else { // 只显示城市标记
                var other2_bool = false;
                if ( 
                    ( that.data.markers[that.data.markers.length-1].iconPath == that.data.config.sign.pic  )
                    &&
                    !that.data.selected_sign.latitude
                ) {
                    other2_bool = true;
                }

                if ( 
                    that.data.isShowDetailMarkers === true 
                    ||
                    other2_bool
                ) {
                    util.netwrokRequest('city_sign_location', '/file/city_sign_location.json', function (cityListData) {
                        cityListData = that.dataFormat(cityListData);
                        for ( var k=0; k<cityListData.length; k++ ) {
                            cityListData[k].callout = {
                                content:  cityListData[k].title,
                                display: 'ALWAYS',
                                borderColor: '#FF5252',
                                color: '#FF5252',
                                padding: 10
                            };
                        }

                        cityListData = that.insertSelectedSign(cityListData);
                        
                        that.setData({
                            markers: cityListData,
                            isShowDetailMarkers: false,
                            current_city_id: 0
                        });
                    });
                }
            }

        }
    });
  },

  insertSelectedSign: function (formated_data)
  {
      var that = this;
      if ( that.data.config.sign.use_sign === true ) {
        that.setData({
            cirles: []
        });

        if ( that.data.selected_sign.longitude && that.data.selected_sign.latitude ) {
            if ( 
                formated_data[formated_data.length-1].iconPath == that.data.config.sign.pic
            ) {
                that.data.markers.pop();
            }
            
            formated_data.push({
                longitude: that.data.selected_sign.longitude,
                latitude: that.data.selected_sign.latitude,
                iconPath: that.data.config.sign.pic,
                width: 30,
                height: 30,
                callout: {
                    content:  that.data.selected_sign.title,
                    display: 'ALWAYS',
                    borderColor: that.data.config.sign.color,
                    color: that.data.config.sign.color,
                    padding: 10
                }
            });
          }
      }

      return formated_data;
  },

  dataFormat: function (arr)
  {
        if ( arr[0].length != 3 ) {
            return arr;
        }

        var that = this;

        for (var i=0; i<arr.length; i++) {
            arr[i] = {
                longitude: arr[i][0],
                latitude: arr[i][1],
                title:  arr[i][2],
                iconPath: '/images/location.png',
                width: 30,
                height: 30
            }
        }

        return arr;
  },
  
  jump2ListPage: function () 
  {
      wx.navigateTo({
          url: '/pages/list/list',
      })
  },

  selectLocation: function()
  {
      var that = this;
      wx.chooseLocation({
          latitude: that.data.latitude,
          longitude: that.data.longitude,
          success: function (res) {
              that.setData({
                  latitude: res.latitude,
                  longitude: res.longitude,
                  searchTitle: res.name,
                  scale: 14,
                  cirles: [{
                    latitude: res.latitude,
                    longitude: res.longitude,
                    radius: 10,
                    color: '#448AFF',
                    strokeWidth: 5
                  }],
                  hideCloseBtn: false,
                  selected_sign: {
                      latitude: res.latitude,
                      longitude: res.longitude,
                      title: res.name
                  },
                //   markers: that.data.markers
              })

              that.setLocationMarkers(that.data.version, res.latitude, res.longitude);
          },
      });
  },

  pMap: function ()
  {
        var that = this;
        var mapObj = wx.createMapContext('map');

        mapObj.getCenterLocation({
            success: function ( e ) {
                that.setData({
                    latitude: e.latitude,
                    longitude: e.longitude
                });

                that.setLocationMarkers(that.data.version, e.latitude, e.longitude);
            }
        });

        mapObj.getScale({
            success: function (e) {
                if ( e.scale >= 19 ) {
                    that.setData({
                        scale: 20,
                        pImgSrc: '/images/j_9.png',
                        eImgSrc: '/images/p_3a.png'
                    });
                    return false;
                }
        
                that.setData({
                    scale: e.scale + 1,
                    pImgSrc: '/images/j_3a.png',
                    eImgSrc: '/images/p_3a.png'
                });
            }
        });
  },
  eMap: function () 
  {
        var that = this;
        var mapObj = wx.createMapContext('map');

        mapObj.getCenterLocation({
            success: function ( e ) {
                that.setData({
                    latitude: e.latitude,
                    longitude: e.longitude
                });

                that.setLocationMarkers(that.data.version, e.latitude, e.longitude);
            }
        });

        mapObj.getScale({
            success: function (e) {e
                if ( e.scale <= 4 ) {
                    that.setData({
                        scale: 3,
                        pImgSrc: '/images/j_3a.png',
                        eImgSrc: '/images/p_9.png'
                    });
                    return false;
                }
        
                that.setData({
                    scale: e.scale - 1,
                    pImgSrc: '/images/j_3a.png',
                    eImgSrc: '/images/p_3a.png'
                });
            }
        });
  },

  clearSelLocation: function ()
  {
      var that = this;

      that.setData({
        // latitude: location.latitude,
        // longitude: location.longitude,
        searchTitle: '搜索地点',
        hideCloseBtn: true,
        cirles: [],
        selected_sign: []
        // markers: that.data.markers
      });

      that.setLocationMarkers(that.data.version);
  },

  locationReset: function()
  {
      var that = this;
      var location = wx.getStorageSync('location');
      if ( location ) {
          that.setData({
              scale: 14,
              latitude: location.latitude,
              longitude: location.longitude
          });

          that.setLocationMarkers(that.data.version, location.latitude, location.longitude);
      } else {
          wx.getLocation({
              type: 'wgs84',
              success(res) {
                  wx.setStorageSync('location', {
                      latitude: res.latitude,
                      longitude: res.longitude
                  });

                  that.setData({
                      scale: 14,
                      latitude: res.latitude,
                      longitude: res.longitude
                  });

                  that.setLocationMarkers(that.data.version, res.latitude, res.longitude);
              }
          })
      }
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
