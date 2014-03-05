var chai = require('chai')
  , readStream = require('fs' ).createReadStream
  , MpegFrame = require('../mpegFrame')
  , MpegInfoStream = require('../mpegInfoStream');

chai.should();

describe ('when streaming an mpeg file to an infoStream', function(){
    var infoStream, stream;

    beforeEach(function(){
        infoStream = new MpegInfoStream();
    })

    it('should emit frame objects', function(done){
        readStream(__dirname + '/10sec.mp3')
            .pipe(infoStream)
            .on('data', function(frame){
                frame.should.not.be.undefined
                frame.bitRate.should.equal(128000)
            })
            .on('end', function(){
                done()
            })
    })
})

describe('when parsing a MPEG Frame', function(){
    var frame, buffer;

    beforeEach(function(done){
        frame = null;
        buffer = new Buffer([])
        readStream(__dirname + '/10sec.mp3', { start: 987, end: 990 })
            .on('data', function(chunk){
                buffer = Buffer.concat([buffer, chunk])
            })
            .on('end', function(){ done() })
    })


    it('should parse the frame from a buffer', function(){
        buffer.length.should.equal(4)
        frame = new MpegFrame(buffer)

        frame.version.should.equal(1)
        frame.layer.should.equal(3)
        frame.sampleRate.should.equal(44100)
        frame.bitRate.should.equal(128000)
        frame.channels.should.equal(1)
        frame.mode.should.equal('Mono')
    })

    it('should parse the frame from hi and lo UInts', function(){
        buffer.length.should.equal(4)
        frame = new MpegFrame(buffer.readUInt16BE(0), buffer.readUInt16BE(2))

        frame.version.should.equal(1)
        frame.layer.should.equal(3)
        frame.sampleRate.should.equal(44100)
        frame.bitRate.should.equal(128000)
        frame.channels.should.equal(1)
        frame.mode.should.equal('Mono')
    })
})