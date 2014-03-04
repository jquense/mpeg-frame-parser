var fs = require('fs')
  , Transform = require('stream').Transform
  , util = require("util")
  , _ = require('lodash');

var bitrates = {
        1: {
            1: [ 0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448 ],
            2: [ 0, 32, 48, 56, 64,  80,  96,  112, 128, 160, 192, 224, 256, 320, 384 ],
            3: [ 0, 32, 40, 48, 56,  64,  80,  96,  112, 128, 160, 192, 224, 256, 320 ]
        },
        2: {
            1: [ 0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256 ],
            2: [ 0, 8,  16, 24, 32, 40, 48, 56,  64,  80,  96,  112, 128, 144, 160 ],
            3: [ 0, 8,  16, 24, 32, 40, 48, 56,  64,  80,  96,  112, 128, 144, 160 ]
        },
    };

var sampleRate = {
        '1'  : [ 44100, 48000, 32000 ],
        '2'  : [ 22050, 24000, 16000 ],
        '2.5': [ 11025, 12000, 8000  ],
    };

var MpegVersion ={
    3: 1,
    2: 2,
    0: 2.5,
}

var modes = [ 'Stereo', 'Joint', 'Dual', 'Mono'];


function MpegFrame(front, back){
    // overload two 16BE ints or one 4 byte buffer
    if ( arguments.length === 1 ) {
        back = front.readUInt16BE(2);
        front  = front.readUInt16BE(0)
    }

    this._front = front;
    this._back  = back;

    this.version    = this._version(front)
    this.layer      = this._layer(front)

    this.padding    = this._padding(back)
    this.sampleRate = this._sampleRate(this.version, back)
    this.bitRate    = this._bitRate(this.version, this.layer, back);
    this.mode       = this._mode(back)
    this.channels    = this.mode === 'Mono' ? 1 : 2;  

    this.size = this.layer === 1
        ? ( (12  * this.bitRate / this.sampleRate) + this.padding ) * 4
        : ( 144  * this.bitRate / this.sampleRate + this.padding )

    this.size = Math.floor(this.size)
}

MpegFrame.prototype._mode = function(chunk){
    return modes[(chunk >> 6) & 0x3];
}

MpegFrame.prototype._version = function(chunk){
    var verIdx = (chunk >> 3) & 0x3;

    return MpegVersion[verIdx];
}

MpegFrame.prototype._layer = function(chunk){
    var layerIdx = (chunk >> 1) & 0x3;

    return (4 - layerIdx ) % 4;
}

MpegFrame.prototype._padding = function(chunk){
    return (chunk >> 9) & 0x1;
}

MpegFrame.prototype._bitRate = function(ver, layer, chunk){
    var bitrateIdx = chunk >> 12;

    return bitrates[Math.floor(ver)][layer][bitrateIdx] * 1000;
}

MpegFrame.prototype._sampleRate = function(ver, chunk){
    var sampleIdx = (chunk >> 10) & 0x3;

    return sampleRate[ver][sampleIdx];
}

MpegFrame.prototype.toJson = function(){

    return _.pick(this, function(value, key) {
        return typeof value !== 'function' && key.charAt(0) !== '_';
    });
}

MpegFrame.tryParse = function(buffer){

    var firstHalf  = buffer.readUInt16BE(0)
      , hasSync    = ( firstHalf & 0xFFE0) == 0xFFE0 
      , validVer   = ( firstHalf & 0x18)  !== 0x8
      , validLayer = ( firstHalf & 0x6)   !== 0x0;

    if ( hasSync && validVer && validLayer ) {
        var secondHalf   = buffer.readUInt16BE(2)
          , validBitRate = (secondHalf & 0xF000) !== 0xF000
          , validSample  = (secondHalf & 0xC00)  !== 0xC00;

        if ( validBitRate && validSample ) {  
            return new MpegFrame(firstHalf, secondHalf)
        } 
    } 
    
}

module.exports = MpegFrame;