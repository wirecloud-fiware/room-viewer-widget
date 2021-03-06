/**
 * @file participant.js
 * 
 * @copyright 2014 CoNWeT Lab., Universidad Politécnica de Madrid
 * @license Apache v2
 */


/**
 * Create a new instance of Participant.
 * 
 * @class
 * @param {String} username - Username of the participant.
 */
var Participant = function (username, ws) {
  var defaultIcon  = '<span class="fa fa-user"></span>',
      panelHeading = document.createElement('div'),
      panelBody    = document.createElement('div');

  this.username  = username;
  this.ws        = ws;
  this.container = document.createElement('div');
  this.video     = document.createElement('video');
  this.rtcPeer   = {writable: true}; // Object.defineProperty(this, 'rtcPeer', { writable: true});

  this.video.id       = this.username + '-camera';
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

  console.log('The participant ' + this.username + ' was created successfully.'); // DEBUG

};

Participant.prototype = {

  constructor: Participant,

  dispose: function () {
    console.log('Disposing participant ' + this.username);
    if (this.rtcPeer) {
      this.rtcPeer.dispose();
    }
  },

  getElement: function () {
    return this.container;
  },

  getVideoElement: function () {
    return this.video;
  },

  sendURL: function () {

    var data = this.username + ' ' + this.video.src;
    MashupPlatform.wiring.pushEvent('video_url', data);
    console.log('The video URL was sent from ' + this.username);
  }

};
