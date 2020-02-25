var CryptoJS = require('aes.js')
var key = CryptoJS.enc.Utf8.parse('cswd5fSsuUqaqKOq');  //十六位十六进制数作为密钥
var iv = CryptoJS.enc.Utf8.parse('FcKeZaVA0x3scAp9');   //十六位十六进制数作为密钥偏移量

/** -----------------------------------AES-CBC加密 ----------------------------------------------------*/
function AesEncrypt(data) { //加密
    var srcs = CryptoJS.enc.Utf8.parse(data);
    var encrypted = CryptoJS.AES.encrypt(srcs, key,
        {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
    return encrypted.ciphertext.toString(CryptoJS.enc.Base64);//返回的是base64格式的密文 .toUpperCase()
}

/** -----------------------------------AES-CBC解密 ----------------------------------------------------*/
function AesDecrypt(data) {//解密
    var decrypted = CryptoJS.AES.decrypt(data.toString(), key,
        {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
    return decrypted.toString(CryptoJS.enc.Utf8);
}

/** ----------------------------------- 暴露接口 ----------------------------------------------------*/
module.exports = {
    AesEncrypt,
    AesDecrypt
}