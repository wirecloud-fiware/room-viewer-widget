/**
 * @file participant.js
 * @version 0.0.1
 * 
 * @copyright 2014 CoNWeT Lab., Universidad Politécnica de Madrid
 * @license Apache v2 (https://github.com/Wirecloud/room-viewer-widget/blob/master/LICENSE)
 */


/**
 * Create a new instance of Participant.
 * 
 * @class
 * @param {String} username - Username of the participant.
 */
var Participant = function (username) {
  var defaultIcon  = '<span class="fa fa-user"></span>',
      panelHeading = document.createElement('div'),
      panelBody    = document.createElement('div');

  this.username  = username;
  this.container = document.createElement('div');
  this.video     = document.createElement('video');
  this.rtcPeer   = {writable: true}; // Object.defineProperty(this, 'rtcPeer', { writable: true});

  this.video.id = this.username + '-camera';
  this.video.autoplay = true;
  this.video.controls = false;

  panelHeading.className = 'panel-heading';
  panelHeading.innerHTML = defaultIcon + ' ' + this.username;

  panelBody.className = 'panel-body';
  panelBody.appendChild(this.video);

  this.container.id = this.username;
  this.container.className = 'panel panel-default flex-item';
  this.container.addEventListener('click', this.sendURL.bind(this), true);
  this.container.appendChild(panelHeading);
  this.container.appendChild(panelBody);

  console.log('The participant ' + this.username + 'was created successfully.'); // DEBUG

};

Participant.prototype = {

  constructor: Participant,

  dispose: function () {
    console.log('Disposing participant ' + this.username);
    this.rtcPeer.dispose();
    this.container.parentNode.removeChild(this.container);
  },

  getElement: function () {
    return this.container;
  },

  getVideoElement: function () {
    return this.video;
  },

  offerToReceiveVideo: function (offerSdp, wp){
    console.log('Invoking SDP offer callback function');
    client.sendRequest("receiveVideoFrom",
      {sender: name, sdpOffer: offerSdp},
      function (error, result) {
        if (error) return console.error(error);
        wp.processSdpAnswer(result.sdpAnswer);
      }
    );
  },

  sendURL: function () {
    MashupPlatform.wiring.pushEvent('video_url', this.video.src);
    console.log('The video URL was sent from ' + this.username);
  }

};
