MPEG File Frame parser
=====================================

A simple streaming parser for parsing out mpeg audio frame metadata, such as bitrate, sample rate, etc

### Install

    npm install mpeg-frame-parser


### Use
The parser is simply a stream in objectMode, so you can pipe and binary data into it and it will spit out frame objects.

    var Frames = require('mpeg-frame-parser')
      , stream = require('fs').createReadStream('./my-audio.mp3')

    var parser = stream.pipe(new Frames());

    parser.on('data', function(frame){
        console.log(frame.bitRate)  // => 128000
    })

#### Frame Object

frame objects contain the following keys:

    frame = {
        bitrate     => 12800 1600 etc
        padding     => 1
        sampleRate  => 44100 48000 etc
        mode        => Mono Stereo Joint Dual
        channels    => 1 or 2
        size        => int bytes
        version     => 1 2 2.5
        layer       => 1 2
    }
 use in conjunction with my ID3v1 parser and [ID3v2 parser](https://github.com/theporchrat/ID3v2-info-parser) for more data.