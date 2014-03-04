var Transform = require('readable-stream').Transform
  , MpegFrame = require('./mpegFrame')
  , util = require("util")
  , _ = require('lodash');

var defaults = {
        sequentialFrames: 25,
        stopEarly: true
    }

module.exports = MpegInfoStream;

function MpegInfoStream(options){
    this.options = _.extend({}, defaults, options);
    this.bytesRead = 0;
    Transform.call(this, { objectMode: true });
}

util.inherits(MpegInfoStream, Transform);

MpegInfoStream.prototype._transform = function(chunk, encoding, done) {
    var start = this.bytesRead;

    if ( this._leftover ) 
        chunk = Buffer.concat([ this._leftover, chunk ], this._leftover.length + chunk.length)

    for (var i = 0; ( i + 4 ) <= chunk.length; i++) {
        this.bytesRead = start + i;

        i = this._getFrame(chunk, i);
    }
      
    if ( i + 4 > chunk.length) {
        this._leftover = chunk.slice(i)
        this.bytesRead += chunk.length - i
    }

    done();
};

MpegInfoStream.prototype._getFrame = function(chunk, offset) {
    var buf = chunk.slice(offset, offset + 4)
      , frame = MpegFrame.tryParse(buf) 

    if ( frame ) {
        if ( this._confirmedFrames ) {
            this._emitFrames(frame)
        } else {
            var take = this.options.sequentialFrames
              , next = takeFrames(chunk, take, offset + frame.size);

            if ( next ) {
                next.frames.unshift(frame)
                offset = next.offset;
                
                this._confirmedFrames = true;
                this._emitFrames(next.frames)
            } 
        }  
    }

    return offset;
};

MpegInfoStream.prototype._emitFrames = function(frames) {
    var self = this

    !_.isArray(frames) 
        ? self.push(frames.toJson())
        : frames.forEach(function(frm){
            self.push(frm.toJson())
        });
};


MpegInfoStream.prototype._flush = function(done) {
    this._leftover = null;
    done();
};

function takeFrames(buf, take, offset) {
    var nextFrame
      , frames = []
      , o = offset;

    for( var i = 0; i < take; i++){
        if ( (o + 4) > buf.length ) break;
        nextFrame = MpegFrame.tryParse(buf.slice(o, o + 4))
       
        if ( !nextFrame ) return null

        frames.push(nextFrame)
        o += nextFrame.size
    }

    return { 
        offset: o, 
        frames: frames 
    }
};
